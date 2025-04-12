/**
 * Generates a timestamp in ISO 8601 format.
 * @returns The current timestamp as a string.
 */
export function getCurrentTimestamp() {
    return new Date().toISOString();
}
/**
 * Checks if a value is a plain object (excluding arrays and null).
 * @param value The value to check.
 * @returns True if the value is a plain object, false otherwise.
 */
export function isObject(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
/**
 * Type guard to check if an object is a TaskStatus update (lacks 'parts').
 * Used to differentiate yielded updates from the handler.
 */
export function isTaskStatusUpdate(update // eslint-disable-line @typescript-eslint/no-explicit-any
) {
    // Check if it has 'state' and NOT 'parts' (which Artifacts have)
    return isObject(update) && "state" in update && !("parts" in update);
}
/**
 * Type guard to check if an object is an Artifact update (has 'parts').
 * Used to differentiate yielded updates from the handler.
 */
export function isArtifactUpdate(update // eslint-disable-line @typescript-eslint/no-explicit-any
) {
    // Check if it has 'parts'
    return isObject(update) && "parts" in update;
}
