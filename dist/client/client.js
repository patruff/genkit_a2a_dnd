// Simple error class for client-side representation of JSON-RPC errors
class RpcError extends Error {
    code;
    data;
    constructor(code, message, data) {
        super(message);
        this.name = "RpcError";
        this.code = code;
        this.data = data;
    }
}
/**
 * A client implementation for the A2A protocol that communicates
 * with an A2A server over HTTP using JSON-RPC.
 */
export class A2AClient {
    baseUrl;
    fetchImpl;
    cachedAgentCard = null;
    /**
     * Creates an instance of A2AClient.
     * @param baseUrl The base URL of the A2A server endpoint.
     * @param fetchImpl Optional custom fetch implementation (e.g., for Node.js environments without global fetch). Defaults to global fetch.
     */
    constructor(baseUrl, fetchImpl = fetch) {
        // Ensure baseUrl doesn't end with a slash for consistency
        this.baseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
        this.fetchImpl = fetchImpl;
    }
    /**
     * Helper to generate unique request IDs.
     * Uses crypto.randomUUID if available, otherwise a simple timestamp-based fallback.
     */
    _generateRequestId() {
        if (typeof crypto !== "undefined" &&
            typeof crypto.randomUUID === "function") {
            return crypto.randomUUID();
        }
        else {
            // Fallback for environments without crypto.randomUUID
            return Date.now();
        }
    }
    /**
     * Internal helper method to make JSON-RPC calls via HTTP POST.
     * @param method The JSON-RPC method name.
     * @param params The parameters for the method.
     * @param acceptHeader The desired Accept header ('application/json' or 'text/event-stream').
     * @returns A Promise resolving to the fetch Response object.
     */
    async _makeHttpRequest(method, params, acceptHeader = "application/json") {
        const requestId = this._generateRequestId();
        // JSONRPCRequest is not generic, the specific type comes from Req
        const requestBody = {
            jsonrpc: "2.0",
            id: requestId,
            method: method,
            params: params,
        };
        try {
            const response = await this.fetchImpl(this.baseUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: acceptHeader,
                },
                body: JSON.stringify(requestBody),
                // Consider adding keepalive: true if making many rapid requests
            });
            return response;
        }
        catch (networkError) {
            console.error("Network error during RPC call:", networkError);
            // Wrap network errors into a standard error format if possible
            throw new RpcError(-32603, // Use literal value for ErrorCodeInternalError
            `Network error: ${networkError instanceof Error
                ? networkError.message
                : String(networkError)}`, networkError // Include original error if needed
            );
        }
    }
    /**
     * Handles standard JSON-RPC responses (non-streaming).
     * Parses the response, checks for JSON-RPC errors, and returns ONLY the 'result' payload.
     */
    async _handleJsonResponse(// Takes full Response type
    response, expectedMethod // Optional: helps in debugging
    ) {
        // Return type is now the 'result' property of Res
        let responseBody = null;
        try {
            if (!response.ok) {
                // Attempt to read body even for non-ok responses for potential JSON errors
                responseBody = await response.text();
                let errorData = null;
                try {
                    // Try parsing as JSON RPC Error response
                    const parsedError = JSON.parse(responseBody);
                    if (parsedError.error) {
                        errorData = parsedError.error;
                        throw new RpcError(errorData.code, errorData.message, errorData.data);
                    }
                }
                catch (parseError) {
                    // Ignore parsing error, fall through to generic HTTP error
                }
                // If not a JSON RPC error, throw generic HTTP error
                throw new Error(`HTTP error ${response.status}: ${response.statusText}${responseBody ? ` - ${responseBody}` : ""}`);
            }
            // Read and parse the successful JSON response
            responseBody = await response.text();
            // Parse as the specific JSONRPCResponse type Res
            const jsonResponse = JSON.parse(responseBody);
            // Basic validation of the JSON-RPC response structure
            if (typeof jsonResponse !== "object" ||
                jsonResponse === null ||
                jsonResponse.jsonrpc !== "2.0") {
                throw new RpcError(-32603, "Invalid JSON-RPC response structure received from server.");
            }
            // Check for application-level errors within the JSON-RPC response
            if (jsonResponse.error) {
                throw new RpcError(jsonResponse.error.code, jsonResponse.error.message, jsonResponse.error.data);
            }
            // Optional: Validate response ID matches request ID if needed (requires passing request ID down)
            // Extract and return only the result payload
            return jsonResponse.result;
        }
        catch (error) {
            console.error(`Error processing RPC response for method ${expectedMethod || "unknown"}:`, error, responseBody ? `\nResponse Body: ${responseBody}` : "");
            // Re-throw RpcError instances directly, wrap others
            if (error instanceof RpcError) {
                throw error;
            }
            else {
                throw new RpcError(-32603, // Use literal value for ErrorCodeInternalError
                `Failed to process response: ${error instanceof Error ? error.message : String(error)}`, error);
            }
        }
    }
    /**
     * Handles streaming Server-Sent Events (SSE) responses.
     * Returns an AsyncIterable that yields ONLY the 'result' payloads (events).
     * Throws RpcError if an error is received in the stream.
     */
    async *_handleStreamingResponse(// Takes full Response type
    response, expectedMethod // Optional: helps in debugging
    ) {
        // Yield type is now the 'result' property of StreamRes
        if (!response.ok || !response.body) {
            let errorText = null;
            try {
                errorText = await response.text();
            }
            catch (_) {
                /* Ignore read error */
            }
            console.error(`HTTP error ${response.status} received for streaming method ${expectedMethod || "unknown"}.`, errorText ? `Response: ${errorText}` : "");
            throw new Error(`HTTP error ${response.status}: ${response.statusText} - Failed to establish stream.`);
        }
        const reader = response.body
            .pipeThrough(new TextDecoderStream())
            .getReader();
        let buffer = "";
        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    // Process any remaining data in the buffer before exiting
                    if (buffer.trim()) {
                        console.warn(`SSE stream ended with partial data in buffer for method ${expectedMethod}: ${buffer}`);
                    }
                    break;
                }
                buffer += value;
                const lines = buffer.replace(/\r/g, "").split("\n\n"); // SSE messages end with \n\n
                buffer = lines.pop() || ""; // Keep potential partial message
                for (const message of lines) {
                    if (message.startsWith("data: ")) {
                        const dataLine = message.substring("data: ".length).trim();
                        if (dataLine) {
                            // Ensure data is not empty
                            try {
                                // Parse as the specific JSONRPCResponse type StreamRes
                                const parsedData = JSON.parse(dataLine);
                                // Basic validation of streamed data structure
                                if (typeof parsedData !== "object" ||
                                    parsedData === null ||
                                    !("jsonrpc" in parsedData && parsedData.jsonrpc === "2.0")) {
                                    console.error(`Invalid SSE data structure received for method ${expectedMethod}:`, dataLine);
                                    continue; // Skip invalid data
                                }
                                // Check for errors within the streamed message
                                if (parsedData.error) {
                                    console.error(`Error received in SSE stream for method ${expectedMethod}:`, parsedData.error);
                                    // Depending on requirements, you might want to:
                                    // 1. Yield an error object
                                    // 2. Throw an error (terminating the stream)
                                    // 3. Just log and continue (current behavior)
                                    // Throw an error to terminate the stream
                                    throw new RpcError(parsedData.error.code, parsedData.error.message, parsedData.error.data);
                                }
                                else if (parsedData.result !== undefined) {
                                    // Yield ONLY the result payload, with an explicit cast if needed
                                    yield parsedData.result;
                                }
                                else {
                                    // Should not happen if error and result are mutually exclusive per spec
                                    console.warn(`SSE data for ${expectedMethod} has neither result nor error:`, parsedData);
                                }
                            }
                            catch (e) {
                                console.error(`Failed to parse SSE data line for method ${expectedMethod}:`, dataLine, e);
                            }
                        }
                    }
                    else if (message.trim()) {
                        // Handle other SSE lines if necessary (e.g., 'event:', 'id:', 'retry:')
                        // console.debug(`Received non-data SSE line: ${message}`);
                    }
                }
            }
        }
        catch (error) {
            console.error(`Error reading SSE stream for method ${expectedMethod}:`, error);
            throw error; // Re-throw the stream reading error
        }
        finally {
            reader.releaseLock(); // Ensure the reader lock is released
            console.log(`SSE stream finished for method ${expectedMethod}.`);
        }
    }
    /**
     * Retrieves the AgentCard.
     * Note: The standard A2A protocol doesn't define a JSON-RPC method for this.
     * This implementation fetches it from a hypothetical '/agent-card' endpoint
     * on the same server, assuming it's provided out-of-band.
     * Caches the result after the first successful fetch.
     */
    // @ts-ignore - Protocol defines sync, but client needs async fetch.
    async agentCard() {
        if (this.cachedAgentCard) {
            return this.cachedAgentCard;
        }
        // Assumption: Server exposes the card at a simple GET endpoint.
        // Adjust this URL/method if the server provides the card differently.
        const cardUrl = `${this.baseUrl}/agent-card`; // Or just this.baseUrl if served at root
        try {
            const response = await this.fetchImpl(cardUrl, {
                method: "GET",
                headers: {
                    Accept: "application/json",
                },
            });
            if (!response.ok) {
                throw new Error(`HTTP error ${response.status} fetching agent card from ${cardUrl}: ${response.statusText}`);
            }
            const card = await response.json();
            // TODO: Add validation using a Zod schema or similar if available
            this.cachedAgentCard = card;
            return this.cachedAgentCard;
        }
        catch (error) {
            console.error("Failed to fetch or parse agent card:", error);
            throw new RpcError(-32603, // Use literal value for ErrorCodeInternalError
            `Could not retrieve agent card: ${error instanceof Error ? error.message : String(error)}`, error);
        }
    }
    /**
     * Sends a task request to the agent (non-streaming).
     * @param params The parameters for the tasks/send method.
     * @returns A promise resolving to the Task object or null.
     */
    async sendTask(params) {
        const httpResponse = await this._makeHttpRequest("tasks/send", params);
        // Pass the full Response type to handler, which returns Res['result']
        return this._handleJsonResponse(httpResponse, "tasks/send");
    }
    /**
     * Sends a task request and subscribes to streaming updates.
     * @param params The parameters for the tasks/sendSubscribe method.
     * @yields TaskStatusUpdateEvent or TaskArtifactUpdateEvent payloads.
     */
    sendTaskSubscribe(params) {
        const streamGenerator = async function* () {
            const httpResponse = await this._makeHttpRequest("tasks/sendSubscribe", params, "text/event-stream");
            // Pass the full Response type to handler, which yields Res['result']
            yield* this._handleStreamingResponse(httpResponse, "tasks/sendSubscribe");
        }.bind(this)();
        return streamGenerator; // Type is AsyncIterable<TaskStatusUpdateEvent | TaskArtifactUpdateEvent>
    }
    /**
     * Retrieves the current state of a task.
     * @param params The parameters for the tasks/get method.
     * @returns A promise resolving to the Task object or null.
     */
    async getTask(params) {
        const httpResponse = await this._makeHttpRequest("tasks/get", params);
        return this._handleJsonResponse(httpResponse, "tasks/get");
    }
    /**
     * Cancels a currently running task.
     * @param params The parameters for the tasks/cancel method.
     * @returns A promise resolving to the updated Task object (usually canceled state) or null.
     */
    async cancelTask(params) {
        const httpResponse = await this._makeHttpRequest("tasks/cancel", params);
        return this._handleJsonResponse(httpResponse, "tasks/cancel");
    }
    /**
     * Sets or updates the push notification config for a task.
     * @param params The parameters for the tasks/pushNotification/set method (which is TaskPushNotificationConfig).
     * @returns A promise resolving to the confirmed TaskPushNotificationConfig or null.
     */
    async setTaskPushNotification(params) {
        const httpResponse = await this._makeHttpRequest("tasks/pushNotification/set", params);
        return this._handleJsonResponse(httpResponse, "tasks/pushNotification/set");
    }
    /**
     * Retrieves the currently configured push notification config for a task.
     * @param params The parameters for the tasks/pushNotification/get method.
     * @returns A promise resolving to the TaskPushNotificationConfig or null.
     */
    async getTaskPushNotification(params) {
        const httpResponse = await this._makeHttpRequest("tasks/pushNotification/get", params);
        return this._handleJsonResponse(httpResponse, "tasks/pushNotification/get");
    }
    /**
     * Resubscribes to updates for a task after a potential connection interruption.
     * @param params The parameters for the tasks/resubscribe method.
     * @yields TaskStatusUpdateEvent or TaskArtifactUpdateEvent payloads.
     */
    resubscribeTask(params) {
        const streamGenerator = async function* () {
            const httpResponse = await this._makeHttpRequest("tasks/resubscribe", params, "text/event-stream");
            yield* this._handleStreamingResponse(httpResponse, "tasks/resubscribe");
        }.bind(this)();
        return streamGenerator; // Type is AsyncIterable<TaskStatusUpdateEvent | TaskArtifactUpdateEvent>
    }
    /**
     * Optional: Checks if the server likely supports optional methods based on agent card.
     * This is a client-side heuristic and might not be perfectly accurate.
     * @param capability The capability to check (e.g., 'streaming', 'pushNotifications').
     * @returns A promise resolving to true if the capability is likely supported.
     */
    async supports(capability) {
        try {
            const card = await this.agentCard(); // Fetch card if not cached
            switch (capability) {
                // Check boolean flags directly on the capabilities object
                case "streaming":
                    return !!card.capabilities?.streaming; // Use optional chaining and boolean conversion
                case "pushNotifications":
                    return !!card.capabilities?.pushNotifications; // Use optional chaining and boolean conversion
                default:
                    return false;
            }
        }
        catch (error) {
            console.error(`Failed to determine support for capability '${capability}':`, error);
            return false; // Assume not supported if card fetch fails
        }
    }
}
