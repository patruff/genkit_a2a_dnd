import fetch from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs/promises';
import * as path from 'path';
// Store all messages for later analysis
const messageHistory = [];
/**
 * Client for communicating with A2A agents
 */
export class AgentClient {
    baseUrl;
    agentName;
    enableLogging;
    logDirectory;
    /**
     * Create a new AgentClient
     * @param baseUrl The base URL of the agent
     * @param agentName The name of the agent
     * @param enableLogging Whether to log messages to files
     */
    constructor(baseUrl, agentName, enableLogging = true) {
        this.baseUrl = baseUrl;
        this.agentName = agentName;
        this.enableLogging = enableLogging;
        this.logDirectory = path.join(process.cwd(), 'a2a_logs');
        // Create log directory if it doesn't exist
        if (this.enableLogging) {
            fs.mkdir(this.logDirectory, { recursive: true }).catch(console.error);
        }
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
        const timestamp = new Date().toISOString();
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
            // Log the request
            const requestEntry = {
                timestamp,
                type: 'Request',
                from: 'TavernServer',
                to: this.agentName,
                payload
            };
            messageHistory.push(requestEntry);
            if (this.enableLogging) {
                console.log(`[${timestamp}] 📤 TavernServer -> ${this.agentName}: Request`);
                await this.logMessage(requestEntry);
            }
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
            const responseTimestamp = new Date().toISOString();
            // Log the response
            const responseEntry = {
                timestamp: responseTimestamp,
                type: 'Response',
                from: this.agentName,
                to: 'TavernServer',
                payload: data
            };
            messageHistory.push(responseEntry);
            if (this.enableLogging) {
                console.log(`[${responseTimestamp}] 📥 ${this.agentName} -> TavernServer: Response`);
                await this.logMessage(responseEntry);
            }
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
            // Log error
            if (this.enableLogging) {
                const errorEntry = {
                    timestamp: new Date().toISOString(),
                    type: 'Error',
                    agent: this.agentName,
                    error: error instanceof Error ? error.message : String(error)
                };
                await this.logMessage(errorEntry);
            }
            throw error;
        }
    }
    /**
     * Log a message to a file
     * @param message The message to log
     */
    async logMessage(message) {
        try {
            const filePath = path.join(this.logDirectory, `${this.agentName.toLowerCase()}_messages.jsonl`);
            const messageStr = JSON.stringify(message) + '\n';
            await fs.appendFile(filePath, messageStr);
        }
        catch (error) {
            console.error('Error logging message:', error);
        }
    }
    /**
     * Save the complete message history to a file
     */
    static async saveMessageHistory() {
        try {
            const logDir = path.join(process.cwd(), 'a2a_logs');
            await fs.mkdir(logDir, { recursive: true });
            const filePath = path.join(logDir, 'complete_message_history.json');
            await fs.writeFile(filePath, JSON.stringify(messageHistory, null, 2));
            console.log(`Message history saved to ${filePath}`);
        }
        catch (error) {
            console.error('Error saving message history:', error);
        }
    }
}
