import type { StacAsset, StacItem, StacPreviewConfig } from './stac-browser-types';

/** A preview resolved for an item: a Cloud-Optimized GeoTIFF or a plain image stretched over the item bbox. */
export interface StacPreviewAsset {
  /** The preview kind. */
  kind: 'cog' | 'image';
  /** URL of the preview asset. */
  href: string;
}

/** Default asset roles/keys used to pick the preview asset in "auto" mode. */
const DEFAULT_ASSET_PRIORITY = ['visual', 'overview', 'data', 'thumbnail'];

/** Media types recognized as GeoTIFF. */
const GEOTIFF_MEDIA_TYPES = ['image/tiff', 'image/geotiff', 'image/x-geotiff', 'application/x-geotiff'];

/** File extensions recognized as browser-displayable images. */
const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];

/**
 * Utility functions to inspect STAC item assets.
 */
export abstract class StacAssetUtils {
  /**
   * Checks if an asset is a GeoTIFF by media type or file extension.
   *
   * @param asset - The STAC asset
   * @returns True when the asset is a GeoTIFF
   */
  static isGeoTiff(asset: StacAsset): boolean {
    if (asset.type) return GEOTIFF_MEDIA_TYPES.some((mediaType) => asset.type!.toLowerCase().startsWith(mediaType));
    const url = asset.href.toLowerCase().split('?')[0];
    return url.endsWith('.tif') || url.endsWith('.tiff');
  }

  /**
   * Checks if an asset is a browser-displayable image (png, jpeg, ...).
   *
   * Assets without media type nor known extension are accepted when they have the thumbnail role (e.g., EODMS browse URLs).
   *
   * @param asset - The STAC asset
   * @returns True when the asset can be displayed as an image
   */
  static isImage(asset: StacAsset): boolean {
    if (asset.type) return asset.type.toLowerCase().startsWith('image/') && !StacAssetUtils.isGeoTiff(asset);
    const url = asset.href.toLowerCase().split('?')[0];
    return IMAGE_EXTENSIONS.some((extension) => url.endsWith(extension)) || !!asset.roles?.includes('thumbnail');
  }

  /**
   * Gets the thumbnail URL of an item.
   *
   * @param item - The STAC item
   * @returns The thumbnail URL, or undefined when the item has no thumbnail asset
   */
  static getThumbnailUrl(item: StacItem): string | undefined {
    return StacAssetUtils.#findAsset(item, 'thumbnail')?.href;
  }

  /**
   * Gets the asset type badge of an item (e.g., "COG").
   *
   * @param item - The STAC item
   * @returns The badge label, or an empty string
   */
  static getAssetTypeBadge(item: StacItem): string {
    const dataAsset = StacAssetUtils.#findAsset(item, 'data');
    return dataAsset && StacAssetUtils.isGeoTiff(dataAsset) ? 'COG' : '';
  }

  /**
   * Resolves the asset used to preview an item on the map, according to the preview configuration.
   *
   * @param item - The STAC item
   * @param preview - Optional preview configuration
   * @returns The preview asset, or undefined when the item cannot be previewed
   */
  static getPreviewAsset(item: StacItem, preview?: StacPreviewConfig): StacPreviewAsset | undefined {
    const mode = preview?.mode ?? 'auto';
    if (mode === 'none') return undefined;
    const hasBbox = (item.bbox?.length ?? 0) >= 4;

    if (mode === 'thumbnail') {
      const thumbnailUrl = StacAssetUtils.getThumbnailUrl(item);
      return thumbnailUrl && hasBbox ? { kind: 'image', href: thumbnailUrl } : undefined;
    }

    for (const roleOrKey of preview?.assetPriority ?? DEFAULT_ASSET_PRIORITY) {
      const asset = StacAssetUtils.#findAsset(item, roleOrKey);
      if (asset && StacAssetUtils.isGeoTiff(asset)) return { kind: 'cog', href: asset.href };
      if (asset && mode === 'auto' && hasBbox && StacAssetUtils.isImage(asset)) return { kind: 'image', href: asset.href };
    }

    const thumbnailUrl = StacAssetUtils.getThumbnailUrl(item);
    if (mode === 'auto' && thumbnailUrl && hasBbox) return { kind: 'image', href: thumbnailUrl };

    return undefined;
  }

  /**
   * Finds an asset by key, then by role.
   *
   * @param item - The STAC item
   * @param roleOrKey - The asset key or role to look for
   * @returns The matching asset, or undefined
   */
  static #findAsset(item: StacItem, roleOrKey: string): StacAsset | undefined {
    if (!item.assets) return undefined;
    return item.assets[roleOrKey] ?? Object.values(item.assets).find((asset) => asset.roles?.includes(roleOrKey));
  }
}
