/** Error thrown when a config validation error occurs. */
export declare class ConfigError extends Error {
    /** Creates an instance of ConfigError. */
    constructor();
}
/** Error thrown when a map configuration error occurs. */
export declare class MapConfigError extends ConfigError {
    /**
     * Creates an instance of MapConfigError.
     *
     * @param message - The error message describing the config issue
     */
    constructor(message: string);
}
//# sourceMappingURL=config-exceptions.d.ts.map