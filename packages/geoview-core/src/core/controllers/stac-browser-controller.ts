import type BaseLayer from 'ol/layer/Base';
import type { Extent } from 'ol/extent';

import { AbstractMapViewerController } from '@/core/controllers/base/abstract-map-viewer-controller';
import type { ControllerRegistry } from '@/core/controllers/base/controller-registry';
import { logger } from '@/core/utils/logger';
import type { TypeFeatureStyle } from '@/geo/layer/geometry/geometry-types';
import type { MapViewer } from '@/geo/map/map-viewer';
import { StacLayerHelper } from '@/geo/utils/stac-layer-helper';
import { Projection } from '@/geo/utils/projection';
import { GeoUtilities } from '@/geo/utils/utilities';

/** Bounding box in EPSG:4326 [west, south, east, north]. */
export type TypeLonLatBbox = [number, number, number, number];

/** Map fit padding ordered as top, right, bottom, left. */
export type TypeStacZoomPadding = [number, number, number, number];

/** A visible map extent saved with its source projection. */
export interface TypeStacMapExtentSnapshot {
  /** Visible extent in the source projection. */
  extent: Extent;
  /** Source projection code. */
  projection: string;
}

/** A STAC footprint, either a GeoJSON geometry or a lon/lat bounding box. */
export interface TypeStacFootprint {
  /** GeoJSON geometry (Polygon or MultiPolygon) in EPSG:4326. */
  geometry?: unknown;
  /** Bounding box in EPSG:4326, used when no polygon geometry is available. */
  bbox?: number[];
}

/** A STAC footprint with its drawing style. */
export interface TypeStacStyledFootprint extends TypeStacFootprint {
  /** CSS color for the stroke and fill. */
  color: string;
  /** Optional fill opacity (0-1), defaults to 0.1. */
  fillOpacity?: number;
}

/** A STAC asset resolved for a map preview: a Cloud-Optimized GeoTIFF or a plain image stretched over the footprint. */
export interface TypeStacPreviewAsset {
  /** The preview kind. */
  kind: 'cog' | 'image';
  /** URL of the preview asset. */
  href: string;
}

/**
 * Controller responsible for the STAC browser map interactions (footprints, preview overlays, zoom).
 *
 * Preview overlays are raw OpenLayers layers: they are not part of the GeoView layer system (no legend, no store entry).
 */
export class StacBrowserController extends AbstractMapViewerController {
  /** Padding (in pixels) used when zooming to a STAC extent. */
  static readonly ZOOM_PADDING: TypeStacZoomPadding = [100, 100, 100, 100];

  /** Preview overlays currently on the map, keyed by a caller-provided id. */
  #overlays = new Map<string, BaseLayer>();

  /** Pending preview requests, used to discard stale layers after replacement or unhook. */
  #overlayRequests = new Map<string, symbol>();

  /**
   * Creates an instance of StacBrowserController.
   *
   * @param mapViewer - The map viewer instance to associate with this controller
   * @param controllerRegistry - The controller registry for accessing sibling controllers
   */
  // GV Leave the constructor here, because we'll likely need it soon to inject dependencies.
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(mapViewer: MapViewer, controllerRegistry: ControllerRegistry) {
    super(mapViewer, controllerRegistry);
  }

  // #region OVERRIDES

  /**
   * Removes all preview overlays when the controller is unhooked.
   */
  protected override onUnhook(): void {
    this.removeAllOverlays();
    super.onUnhook();
  }

  // #endregion OVERRIDES

  // #region PUBLIC METHODS

  /**
   * Replaces the footprints of a geometry group, each drawn with its own style.
   *
   * Identical footprints are drawn once. Bbox footprints are densified so their edges follow curvilinear projections (e.g., LCC).
   *
   * @param groupId - The geometry group id used to manage the footprints lifecycle
   * @param footprints - The styled footprints to draw
   * @param zIndex - Optional z-index of the geometry group (footprint groups default to 9999)
   */
  setFootprints(groupId: string, footprints: TypeStacStyledFootprint[], zIndex?: number): void {
    this.clearFootprints(groupId);
    const geometryApi = this.getGeometryApi();
    const footprintKeys = new Set<string>();

    footprints.forEach((footprint) => {
      const footprintKey = StacBrowserController.#getFootprintKey(footprint);
      if (footprintKey && footprintKeys.has(footprintKey)) return;
      if (footprintKey) footprintKeys.add(footprintKey);

      const { color, fillOpacity = 0.1 } = footprint;
      // GeometryApi treats a 0 fill opacity as opaque, so an outline-only footprint must omit the fill
      const style: TypeFeatureStyle = {
        strokeColor: color,
        strokeWidth: 2,
        ...(fillOpacity > 0 ? { fillColor: color, fillOpacity } : {}),
      };
      const polygons = GeoUtilities.getGeoJsonPolygons(footprint.geometry);
      if (polygons.length) {
        polygons.forEach((polygon) => geometryApi.addPolygon(polygon, { projection: 4326, style }, undefined, groupId));
        return;
      }

      const bbox = GeoUtilities.bboxToExtent2D(footprint.bbox);
      if (!bbox) return;
      const lonLat = Projection.getProjectionLonLat();
      const ring = Projection.transformAndDensifyExtent(bbox, lonLat, lonLat);
      geometryApi.addPolygon([[...ring, ring[0]]], { projection: 4326, style }, undefined, groupId);
    });

    if (zIndex !== undefined && geometryApi.hasGeometryGroup(groupId)) geometryApi.setGeometryGroupZIndex(groupId, zIndex);
  }

  /**
   * Removes all footprints of a geometry group.
   *
   * @param groupId - The geometry group id to clear
   */
  clearFootprints(groupId: string): void {
    const geometryApi = this.getGeometryApi();
    if (geometryApi.hasGeometryGroup(groupId)) geometryApi.deleteGeometryGroup(groupId);
  }

  /**
   * Zooms to a lon/lat bounding box in the unobscured map area without a STAC-specific zoom cap.
   * Densifies edges for curvilinear projections and offsets the fit for the open STAC panel.
   *
   * @param bbox - The bounding box in EPSG:4326 [west, south, east, north]
   * @param padding - Map fit padding in pixels, ordered as top, right, bottom, left
   * @returns A promise that resolves when the zoom animation is complete
   * @throws {InvalidExtentError} When the extent is invalid (propagated from `zoomToExtent()`)
   */
  zoomToLonLatBbox(bbox: TypeLonLatBbox, padding: TypeStacZoomPadding = StacBrowserController.ZOOM_PADDING): Promise<void> {
    const extent = Projection.transformExtentFromProj(bbox, Projection.getProjectionLonLat(), this.getMapViewer().getProjection(), 25);
    return this.getControllersRegistry().mapController.zoomToExtent(extent, true, {
      padding,
    });
  }

  /**
   * Captures the visible map extent without converting it through lon/lat.
   *
   * @returns The saved extent and projection, or undefined when the map has no usable size or extent
   */
  captureMapExtent(): TypeStacMapExtentSnapshot | undefined {
    const mapViewer = this.getMapViewer();
    const size = mapViewer.map.getSize();
    if (!size || size[0] <= 0 || size[1] <= 0) return undefined;

    const extent = mapViewer.getView().calculateExtent(size);
    if (!extent.every(Number.isFinite)) return undefined;
    return { extent: [...extent], projection: mapViewer.getProjectionEPSG() };
  }

  /**
   * Restores a saved map extent without extra padding, transforming it when the map projection has changed.
   *
   * @param snapshot - The saved extent and source projection
   * @returns A promise that resolves when the zoom animation is complete
   * @throws {InvalidExtentError} When the saved extent is invalid
   */
  zoomToMapExtent(snapshot: TypeStacMapExtentSnapshot): Promise<void> {
    const extent = Projection.transformExtentFromProj(
      [...snapshot.extent],
      Projection.getProjectionFromStringOrNumber(snapshot.projection),
      this.getMapViewer().getProjection(),
      20
    );
    return this.getControllersRegistry().mapController.zoomToExtent(extent, true, { padding: [0, 0, 0, 0] });
  }

  /**
   * Gets the current map extent as a lon/lat bounding box.
   *
   * @returns The map extent in EPSG:4326 [west, south, east, north], clamped to valid bounds
   */
  getMapExtentAsLonLatBbox(): TypeLonLatBbox {
    const snapshot = this.captureMapExtent();
    if (!snapshot) return [-180, -90, 180, 90];
    const [west, south, east, north] = Projection.transformExtentFromProj(
      snapshot.extent,
      this.getMapViewer().getProjection(),
      Projection.getProjectionLonLat()
    );
    return [Math.max(west, -180), Math.max(south, -90), Math.min(east, 180), Math.min(north, 90)];
  }

  /**
   * Adds a map preview overlay for a resolved STAC asset, replacing any overlay with the same id.
   *
   * COG assets are rendered as georeferenced tiles; image assets are stretched over the footprint and need a bbox.
   *
   * @param overlayId - The caller-provided id of the overlay
   * @param previewAsset - The asset to preview
   * @param opacity - Optional overlay opacity (0-1)
   * @param bbox - Optional 2D or 3D STAC bbox in EPSG:4326, required for image previews
   * @param geometry - Optional GeoJSON footprint geometry in EPSG:4326 used to clip image previews
   * @returns A promise that resolves with true when the overlay was added
   */
  addPreviewOverlay(
    overlayId: string,
    previewAsset: TypeStacPreviewAsset,
    opacity?: number,
    bbox?: number[],
    geometry?: unknown
  ): Promise<boolean> {
    if (previewAsset.kind === 'cog') return this.addGeoTiffOverlay(overlayId, previewAsset.href, opacity);

    const lonLatBbox = GeoUtilities.bboxToExtent2D(bbox);
    if (!lonLatBbox) return Promise.resolve(false);
    return this.#addImageOverlay(overlayId, previewAsset.href, lonLatBbox, opacity, geometry);
  }

  /**
   * Adds a Cloud-Optimized GeoTIFF preview overlay on the map, replacing any overlay with the same id.
   *
   * @param overlayId - The caller-provided id of the overlay
   * @param geotiffUrl - URL of the GeoTIFF
   * @param opacity - Optional overlay opacity (0-1)
   * @returns A promise that resolves with true when the overlay was added
   */
  async addGeoTiffOverlay(overlayId: string, geotiffUrl: string, opacity?: number): Promise<boolean> {
    this.removeOverlay(overlayId);
    const requestId = Symbol(overlayId);
    this.#overlayRequests.set(overlayId, requestId);
    try {
      const layer = await StacLayerHelper.createGeoTiffLayer(geotiffUrl, opacity);
      if (this.#overlayRequests.get(overlayId) !== requestId) return false;

      this.#overlayRequests.delete(overlayId);
      if (!layer) {
        this.showError('stacBrowser.errorPreview');
        return false;
      }

      this.getMapViewer().map.addLayer(layer);
      this.#overlays.set(overlayId, layer);
      logger.logInfo('STAC browser - Added GeoTIFF overlay:', overlayId, geotiffUrl);
      return true;
    } catch (error: unknown) {
      if (this.#overlayRequests.get(overlayId) === requestId) {
        this.#overlayRequests.delete(overlayId);
        logger.logError(`STAC browser - Failed to add GeoTIFF overlay: ${overlayId}`, error);
        this.showError('stacBrowser.errorPreview');
      }
      return false;
    }
  }

  /**
   * Checks whether a preview overlay is on the map.
   *
   * @param overlayId - The id of the overlay
   * @returns True when the overlay exists
   */
  hasOverlay(overlayId: string): boolean {
    return this.#overlays.has(overlayId);
  }

  /**
   * Removes a preview overlay from the map.
   *
   * @param overlayId - The id of the overlay to remove
   */
  removeOverlay(overlayId: string): void {
    this.#overlayRequests.delete(overlayId);
    const layer = this.#overlays.get(overlayId);
    if (!layer) return;

    this.getMapViewer().map.removeLayer(layer);
    this.#overlays.delete(overlayId);
  }

  /**
   * Removes all preview overlays from the map.
   */
  removeAllOverlays(): void {
    this.#overlayRequests.clear();
    Array.from(this.#overlays.keys()).forEach((overlayId) => this.removeOverlay(overlayId));
  }

  /**
   * Shows a translated error message in the snackbar and the notification panel.
   *
   * @param messageKey - The translation key of the message
   * @param messageParams - Optional parameters for message interpolation
   */
  showError(messageKey: string, messageParams?: Record<string, unknown>): void {
    this.getControllersRegistry().uiController.addMessage('error', messageKey, messageParams);
  }

  /**
   * Shows a translated success message in the snackbar and the notification panel.
   *
   * @param messageKey - The translation key of the message
   * @param messageParams - Optional parameters for message interpolation
   */
  showSuccess(messageKey: string, messageParams?: Record<string, unknown>): void {
    this.getControllersRegistry().uiController.addMessage('success', messageKey, messageParams);
  }

  // #endregion PUBLIC METHODS

  // #region PRIVATE METHODS

  /**
   * Adds an image preview overlay (e.g., a thumbnail) fitted to the item footprint, replacing any overlay with the same id.
   *
   * @param overlayId - The caller-provided id of the overlay
   * @param imageUrl - URL of the image
   * @param bbox - The bounding box in EPSG:4326 [west, south, east, north]
   * @param opacity - Optional overlay opacity (0-1)
   * @param geometry - Optional GeoJSON footprint geometry in EPSG:4326
   * @returns A promise that resolves with true when the image overlay was added
   */
  async #addImageOverlay(
    overlayId: string,
    imageUrl: string,
    bbox: TypeLonLatBbox,
    opacity?: number,
    geometry?: unknown
  ): Promise<boolean> {
    this.removeOverlay(overlayId);
    const requestId = Symbol(overlayId);
    this.#overlayRequests.set(overlayId, requestId);
    try {
      const layer = await StacLayerHelper.createImageLayer(imageUrl, bbox, opacity, geometry);
      if (this.#overlayRequests.get(overlayId) !== requestId) return false;

      this.#overlayRequests.delete(overlayId);
      this.getMapViewer().map.addLayer(layer);
      this.#overlays.set(overlayId, layer);
      logger.logInfo('STAC browser - Added image overlay:', overlayId, imageUrl);
      return true;
    } catch (error: unknown) {
      if (this.#overlayRequests.get(overlayId) === requestId) {
        this.#overlayRequests.delete(overlayId);
        logger.logError(`STAC browser - Failed to add image overlay: ${overlayId}`, error);
        this.showError('stacBrowser.errorPreview');
      }
      return false;
    }
  }

  // #endregion PRIVATE METHODS

  // #region STATIC METHODS

  /**
   * Creates a stable identity for duplicate GeoJSON geometries or bounding boxes.
   *
   * @param footprint - The STAC footprint to identify
   * @returns A key for identical geometry data, or undefined when no valid footprint is available
   */
  static #getFootprintKey(footprint: TypeStacFootprint): string | undefined {
    if (footprint.geometry) {
      // GeoJSON coordinates are arrays, so their serialized form is stable for identical geometries.
      const geometry = JSON.stringify(footprint.geometry);
      return geometry ? `geometry:${geometry}` : undefined;
    }
    const bbox = GeoUtilities.bboxToExtent2D(footprint.bbox);
    if (bbox) return `bbox:${JSON.stringify(bbox)}`;
    return undefined;
  }

  // #endregion STATIC METHODS
}
