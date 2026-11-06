/**
 * STAC discovery of 3D Tiles — STUB, not wired into the plugin.
 *
 * TODO(geoview-3d, STAC): let users pick a tileset from a STAC catalogue instead of configuring `tilesetUrl`.
 * Planned path: reuse the existing geoview-stac-browser plugin's StacApiService (packages/geoview-stac-browser/
 * src/stac-api-service.ts) to search items, then resolve the selected item's 3D Tiles asset with
 * {@link findTilesetAsset} and hand its href to TilesetRenderer.setTilesetUrl(). Assets follow the STAC 3D Tiles
 * convention: a `tileset.json` asset typed `application/json` with role `3d-tiles` (or a 3d-tiles media type).
 */

/** Minimal shape of a STAC asset, as returned by a STAC API item. */
export interface TypeStacAsset {
  /** Absolute or item-relative URL of the asset. */
  href: string;
  /** Media type of the asset. */
  type?: string;
  /** Semantic roles of the asset. */
  roles?: string[];
}

/** Minimal shape of a STAC item with its assets keyed by name. */
export interface TypeStacItem {
  /** The item id. */
  id: string;
  /** The item assets keyed by asset name. */
  assets: Record<string, TypeStacAsset>;
}

/** Asset roles and media types that identify a 3D Tiles tileset. */
const TILESET_ROLE = '3d-tiles';

/**
 * Finds the 3D Tiles tileset asset of a STAC item.
 *
 * Kept free of network access so the selection rule can be agreed on before the STAC flow is built.
 *
 * @param item - The STAC item
 * @returns The tileset.json asset, or undefined when the item has none
 */
export function findTilesetAsset(item: TypeStacItem): TypeStacAsset | undefined {
  return Object.values(item.assets).find(
    (asset) => asset.roles?.includes(TILESET_ROLE) || asset.type?.includes(TILESET_ROLE) || /(^|\/)tileset\.json([?#]|$)/.test(asset.href)
  );
}
