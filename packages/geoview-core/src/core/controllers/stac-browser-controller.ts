import type BaseLayer from 'ol/layer/Base';

import { AbstractMapViewerController } from '@/core/controllers/base/abstract-map-viewer-controller';
import type { ControllerRegistry } from '@/core/controllers/base/controller-registry';
import { logger } from '@/core/utils/logger';
import type { MapViewer } from '@/geo/map/map-viewer';
import { StacLayerHelper } from '@/geo/utils/stac-layer-helper';

/** Bounding box in EPSG:4326 [west, south, east, north]. */
export type TypeLonLatBbox = [number, number, number, number];

/** A STAC footprint, either a GeoJSON geometry or a lon/lat bounding box. */
export interface TypeStacFootprint {
  /** GeoJSON geometry (Polygon or MultiPolygon) in EPSG:4326. */
  geometry?: unknown;
  /** Bounding box in EPSG:4326, used when no geometry is available. */
  bbox?: number[];
}

/**
 * Controller responsible for the STAC browser map interactions (footprints, preview overlays, zoom).
 *
 * Preview overlays are raw OpenLayers layers: they are not part of the GeoView layer system (no legend, no store entry).
 */
export class StacBrowserController extends AbstractMapViewerController {
  /** Maximum zoom level used when zooming to a STAC extent. */
  static readonly ZOOM_MAX_ZOOM = 12;

  /** Padding (in pixels) used when zooming to a STAC extent. */
  static readonly ZOOM_PADDING = [100, 100, 100, 100];

  /** Preview overlays currently on the map, keyed by a caller-provided id. */
  #overlays = new Map<string, BaseLayer>();

  /** Footprint keys already drawn in each geometry group, used to avoid painting exact duplicates. */
  #footprintKeysByGroup = new Map<string, Set<string>>();

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
   * Adds footprint polygons to the map in the given geometry group.
   *
   * Footprints without a geometry or a valid bbox are skipped.
   *
   * @param groupId - The geometry group id used to manage the footprints lifecycle
   * @param footprints - The footprints to draw
   * @param color - CSS color for the stroke and fill
   * @param fillOpacity - Optional fill opacity (0-1)
   * @param zIndex - Optional z-index of the geometry group (footprint groups default to 9999)
   */
  addFootprints(groupId: string, footprints: TypeStacFootprint[], color: string, fillOpacity?: number, zIndex?: number): void {
    const geometryApi = this.getGeometryApi();
    let footprintKeys = this.#footprintKeysByGroup.get(groupId);
    if (!footprintKeys) {
      footprintKeys = new Set<string>();
      this.#footprintKeysByGroup.set(groupId, footprintKeys);
    }

    footprints.forEach((footprint) => {
      const footprintKey = StacBrowserController.#getFootprintKey(footprint);
      if (footprintKey && footprintKeys.has(footprintKey)) return;
      if (footprintKey) footprintKeys.add(footprintKey);

      if (footprint.geometry) {
        StacLayerHelper.addFootprintLayer(geometryApi, { geometry: footprint.geometry }, color, fillOpacity, groupId);
      } else if (footprint.bbox && footprint.bbox.length >= 4) {
        const [west, south, east, north] = footprint.bbox;
        StacLayerHelper.addFootprintLayer(geometryApi, { bbox: [west, south, east, north] }, color, fillOpacity, groupId);
      }
    });

    if (zIndex !== undefined && geometryApi.hasGeometryGroup(groupId)) geometryApi.setGeometryGroupZIndex(groupId, zIndex);
  }

  /**
   * Removes all footprints of a geometry group.
   *
   * @param groupId - The geometry group id to clear
   */
  clearFootprints(groupId: string): void {
    StacLayerHelper.clearFootprints(this.getGeometryApi(), groupId);
    this.#footprintKeysByGroup.delete(groupId);
  }

  /**
   * Zooms the map to a lon/lat bounding box, densifying the edges for curvilinear projections.
   *
   * @param bbox - The bounding box in EPSG:4326 [west, south, east, north]
   * @returns A promise that resolves when the zoom animation is complete
   * @throws {InvalidExtentError} When the extent is invalid (propagated from `zoomToExtent()`)
   */
  zoomToLonLatBbox(bbox: TypeLonLatBbox): Promise<void> {
    const extent = StacLayerHelper.transformBboxToMapProjection(this.getMapId(), bbox);
    return this.getControllersRegistry().mapController.zoomToExtent(extent, true, {
      maxZoom: StacBrowserController.ZOOM_MAX_ZOOM,
      padding: StacBrowserController.ZOOM_PADDING,
    });
  }

  /**
   * Gets the current map extent as a lon/lat bounding box.
   *
   * @returns The map extent in EPSG:4326 [west, south, east, north]
   */
  getMapExtentAsLonLatBbox(): TypeLonLatBbox {
    return StacLayerHelper.getMapExtentAsWgs84Bbox(this.getMapId());
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

    const layer = await StacLayerHelper.addGeoTiffLayer(this.getMapViewer().map, geotiffUrl, opacity);
    if (!layer) return false;

    this.#overlays.set(overlayId, layer);
    logger.logInfo('STAC browser - Added GeoTIFF overlay:', overlayId, geotiffUrl);
    return true;
  }

  /**
   * Adds an image preview overlay (e.g., a thumbnail) fitted to the item footprint, replacing any overlay with the same id.
   *
   * @param overlayId - The caller-provided id of the overlay
   * @param imageUrl - URL of the image
   * @param bbox - The bounding box in EPSG:4326 [west, south, east, north]
   * @param opacity - Optional overlay opacity (0-1)
   * @param geometry - Optional GeoJSON footprint geometry in EPSG:4326
   */
  addImageOverlay(overlayId: string, imageUrl: string, bbox: TypeLonLatBbox, opacity?: number, geometry?: unknown): void {
    this.removeOverlay(overlayId);
    this.#overlays.set(overlayId, StacLayerHelper.addImageLayer(this.getMapViewer().map, imageUrl, bbox, opacity, geometry));
    logger.logInfo('STAC browser - Added image overlay:', overlayId, imageUrl);
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
    const layer = this.#overlays.get(overlayId);
    if (!layer) return;

    StacLayerHelper.removeStacLayer(this.getMapViewer().map, layer);
    this.#overlays.delete(overlayId);
  }

  /**
   * Removes all preview overlays from the map.
   */
  removeAllOverlays(): void {
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

  // #endregion PUBLIC METHODS

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
    if (footprint.bbox && footprint.bbox.length >= 4) return `bbox:${JSON.stringify(footprint.bbox.slice(0, 4))}`;
    return undefined;
  }

  // #endregion STATIC METHODS
}
