/**
 * Standalone OGC URL helpers.
 *
 * Extracted from GeoUtilities so that both @/core and @/geo can import
 * them without creating circular dependencies.
 */
/**
 * Normalizes an OGC service URL by ensuring `SERVICE`, `REQUEST`, and optionally `VERSION`
 * query parameters are present and correctly cased, overriding any existing variants.
 *
 * @param url - The input service URL (absolute or relative).
 * @param service - The OGC service type (e.g., `"WMS"`, `"WFS"`, `"WMTS"`).
 * @param request - The OGC request type (e.g., `"GetMap"`, `"GetFeature"`, `"GetCapabilities"`).
 * @param version - The default service version. Pass `''` to omit. Defaults to `'1.3.0'`.
 * @returns The normalized, fully qualified service request URL.
 */
export declare function ensureServiceRequestUrl(url: string, service: string, request: string, version?: string): string;
//# sourceMappingURL=ogc-url-helper.d.ts.map