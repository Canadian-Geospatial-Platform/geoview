/** Earth circumference (m) used by deck.gl's Web Mercator projection (math.gl web-mercator EARTH_CIRCUMFERENCE). */
const DECK_EARTH_CIRCUMFERENCE_M = 40.03e6;

/** Tile size (px) deck.gl's Web Mercator zoom is defined with (math.gl web-mercator TILE_SIZE). */
const DECK_TILE_SIZE_PX = 512;

/** Latitude limit of Web Mercator; beyond it cos(latitude) collapses and zoom diverges. */
const MAX_MERCATOR_LATITUDE = 85.05112878;

/** Viewport centre and zoom shared from the 2D map to the 3D view. */
export interface TypeSyncedViewport {
  /** Centre longitude in degrees. */
  longitude: number;
  /** Centre latitude in degrees. */
  latitude: number;
  /** deck.gl Web Mercator zoom. */
  zoom: number;
}

/**
 * Converts a 2D map view to the equivalent deck.gl viewport, matching ground resolution at the map centre.
 *
 * OpenLayers zoom levels depend on the map projection (e.g. EPSG:3978) while deck.gl zoom is Web Mercator with
 * 512 px tiles, so the two are bridged through metres per pixel at the centre latitude.
 *
 * @param lonlat - The map centre as [longitude, latitude] in degrees
 * @param metersPerPixel - The map ground resolution at the centre, in metres per pixel
 * @returns The equivalent deck.gl viewport, or undefined when the inputs cannot be converted
 */
export function toDeckViewport(lonlat: number[], metersPerPixel: number | undefined): TypeSyncedViewport | undefined {
  const [longitude, latitude] = lonlat;
  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) return undefined;
  if (!metersPerPixel || !Number.isFinite(metersPerPixel) || metersPerPixel <= 0) return undefined;

  const clampedLatitude = Math.max(-MAX_MERCATOR_LATITUDE, Math.min(MAX_MERCATOR_LATITUDE, latitude));
  const metersPerPixelAtZoom0 = (DECK_EARTH_CIRCUMFERENCE_M * Math.cos((clampedLatitude * Math.PI) / 180)) / DECK_TILE_SIZE_PX;
  return { longitude, latitude: clampedLatitude, zoom: Math.log2(metersPerPixelAtZoom0 / metersPerPixel) };
}
