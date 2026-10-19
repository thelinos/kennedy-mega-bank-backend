/**
 * Status - Operation status enumeration
 *
 * This enum defines the possible status values for API responses.
 * Used to indicate the result of operations across the application.
 *
 * Values:
 * - started: Operation has started
 * - progressing: Operation is in progress
 * - successful: Operation completed successfully
 * - failed: Operation failed
 *
 * @enum {string}
 */
const enum Status {
    started,
    progressing,
    successful,
    failed
}

export default Status;