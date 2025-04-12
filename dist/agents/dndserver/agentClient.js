import fetch from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';
/**
 * Client for communicating with A2A agents
 */
export class AgentClient {
    baseUrl;
    agentName;
    /**
     * Create a new AgentClient
     * @param baseUrl The base URL of the agent
     * @param agentName The name of the agent
     */
    constructor(baseUrl, agentName) {
        this.baseUrl = baseUrl;
        this.agentName = agentName;
    }
    /**
     * Send a message to the agent and get the response
     * @param message The message to send
     * @param metadata Additional metadata to include
     * @returns The agent's response text
     */
    async sendMessage(message, metadata = {}) {
        // Generate a unique task ID
        const taskId = uuidv4();
        try {
            // Create the A2A request payload
            const payload = {
                jsonrpc: '2.0',
                id: 1,
                method: 'tasks/send',
                params: {
                    id: taskId,
                    message: {
                        role: 'user',
                        parts: [{ text: message }]
                    },
                    metadata
                }
            };
            // Send the request to the agent
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            // Parse the response
            const data = await response.json();
            // Extract the agent's response message
            const result = data;
            if (result.result && result.result.status && result.result.status.message) {
                // Check if there's a text part in the message
                const textPart = result.result.status.message.parts.find((part) => part.text);
                if (textPart) {
                    return textPart.text;
                }
            }
            throw new Error(`No text response from ${this.agentName}`);
        }
        catch (error) {
            console.error(`Error communicating with ${this.agentName}:`, error);
            throw error;
        }
    }
}
