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
export function ensureServiceRequestUrl(url: string, service: string, request: string, version: string = '1.3.0'): string {
  const parsedUrl = new URL(url, window.location.href); // fallback base if relative
  const params = parsedUrl.searchParams;

  // Normalize keys for comparison
  const keysLower = Array.from(params.keys()).map((k) => k.toLowerCase());

  // Fill the correct parameter
  if (keysLower.includes('service')) {
    params.delete('service');
  }
  params.set('SERVICE', service);

  // Fill the correct parameter
  if (keysLower.includes('request')) {
    params.delete('request');
  }
  params.set('REQUEST', request);

  // Add required parameters if missing
  if (!keysLower.includes('version') && version && version.length > 0) params.set('VERSION', version);

  // Return the parsed string
  return parsedUrl.toString();
}
