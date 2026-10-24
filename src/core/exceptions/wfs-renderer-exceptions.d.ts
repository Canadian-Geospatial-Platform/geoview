import { GeoViewError } from './geoview-exceptions';
/**
 * Error thrown when the GetStyles response is invalid (does not conform to the expected schema).
 */
export declare class GetStylesInvalidResponseError extends GeoViewError {
    /**
     * Creates an instance of GetStylesInvalidResponseError.
     */
    constructor();
}
/**
 * Error thrown when the GetStyles operation is not supported.
 */
export declare class GetStylesNotSupportedError extends GeoViewError {
    /**
     * Creates an instance of GetStylesNotSupportedError.
     */
    constructor(cause: string);
}
//# sourceMappingURL=wfs-renderer-exceptions.d.ts.map