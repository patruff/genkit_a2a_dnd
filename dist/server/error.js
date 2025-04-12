import * as schema from "../schema.js";
/**
 * Custom error class for A2A server operations, incorporating JSON-RPC error codes.
 */
export class A2AError extends Error {
    code;
    data;
    taskId; // Optional task ID context
    constructor(code, message, data, taskId) {
        super(message);
        this.name = "A2AError";
        this.code = code;
        this.data = data;
        this.taskId = taskId; // Store associated task ID if provided
    }
    /**
     * Formats the error into a standard JSON-RPC error object structure.
     */
    toJSONRPCError() {
        const errorObject = {
            code: this.code,
            message: this.message,
        };
        if (this.data !== undefined) {
            errorObject.data = this.data;
        }
        return errorObject;
    }
    // Static factory methods for common errors
    static parseError(message, data) {
        return new A2AError(schema.ErrorCodeParseError, message, data);
    }
    static invalidRequest(message, data) {
        return new A2AError(schema.ErrorCodeInvalidRequest, message, data);
    }
    static methodNotFound(method) {
        return new A2AError(schema.ErrorCodeMethodNotFound, `Method not found: ${method}`);
    }
    static invalidParams(message, data) {
        return new A2AError(schema.ErrorCodeInvalidParams, message, data);
    }
    static internalError(message, data) {
        return new A2AError(schema.ErrorCodeInternalError, message, data);
    }
    static taskNotFound(taskId) {
        return new A2AError(schema.ErrorCodeTaskNotFound, `Task not found: ${taskId}`, undefined, taskId);
    }
    static taskNotCancelable(taskId) {
        return new A2AError(schema.ErrorCodeTaskNotCancelable, `Task not cancelable: ${taskId}`, undefined, taskId);
    }
    static pushNotificationNotSupported() {
        return new A2AError(schema.ErrorCodePushNotificationNotSupported, "Push Notification is not supported");
    }
    static unsupportedOperation(operation) {
        return new A2AError(schema.ErrorCodeUnsupportedOperation, `Unsupported operation: ${operation}`);
    }
}
