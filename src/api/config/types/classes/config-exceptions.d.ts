export declare class ConfigError extends Error {
    constructor();
}
export declare class MapConfigError extends ConfigError {
    constructor(message: string);
}
export declare class GeoviewLayerConfigError extends ConfigError {
    constructor(message: string);
}
export declare class GeoviewLayerMandatoryError extends ConfigError {
    messageList: Record<string, string>;
    messageKey: string;
    messageVariables: string[];
    constructor(messageKey: string, messageVariables: string[]);
}
export declare class GeoviewLayerInvalidParameterError extends ConfigError {
    messageList: Record<string, string>;
    messageKey: string;
    messageVariables: string[];
    constructor(messageKey: string, messageVariables: string[]);
}
export {};
