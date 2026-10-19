/**
 * Env - Environment enumeration
 *
 * This enum defines the available environments for the application.
 * Using const enum for better performance (inlined at compile time).
 *
 * @enum {string}
 */
const enum Env {
    development = "development",
    staging = "staging",
    production = "production"
}

export default Env;