import type BaseLayer from 'ol/layer/Base';
import type { Extent } from 'ol/extent';

import { AbstractMapViewerController } from '@/core/controllers/base/abstract-map-viewer-controller';
import type { ControllerRegistry } from '@/core/controllers/base/controller-registry';
import { getStoreUIActiveAppBarTab } from '@/core/stores/states/ui-state';
import { getGVElementById, getGVMapTargetElement } from '@/core/utils/dom-helper';
import { logger } from '@/core/utils/logger';
import type { MapViewer } from '@/geo/map/map-viewer';
import { StacLayerHelper } from '@/geo/utils/stac-layer-helper';
import { Projection } from '@/geo/utils/projection';

/** Bounding box in EPSG:4326 [west, south, east, north]. */
export type TypeLonLatBbox = [number, number, number, number];

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
  /** Bounding box in EPSG:4326, used when no geometry is available. */
  bbox?: number[];
}

/**
 * Controller responsible for the STAC browser map interactions (footprints, preview overlays, zoom).
 *
 * Preview overlays are raw OpenLayers layers: they are not part of the GeoView layer system (no legend, no store entry).
 */
export class StacBrowserController extends AbstractMapViewerController {
  /** Padding (in pixels) used when zooming to a STAC extent. */
  static readonly ZOOM_PADDING = [100, 100, 100, 100];

  /** Preview overlays currently on the map, keyed by a caller-provided id. */
  #overlays = new Map<string, BaseLayer>();

  /** Pending preview requests, used to discard stale layers after replacement or unhook. */
  #overlayRequests = new Map<string, symbol>();

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
   * Zooms to a lon/lat bounding box in the unobscured map area without a STAC-specific zoom cap.
   * Densifies edges for curvilinear projections and offsets the fit for the open STAC panel.
   *
   * @param bbox - The bounding box in EPSG:4326 [west, south, east, north]
   * @returns A promise that resolves when the zoom animation is complete
   * @throws {InvalidExtentError} When the extent is invalid (propagated from `zoomToExtent()`)
   */
  zoomToLonLatBbox(bbox: TypeLonLatBbox): Promise<void> {
    const extent = StacLayerHelper.transformBboxToMapProjection(this.getMapId(), bbox);
    return this.getControllersRegistry().mapController.zoomToExtent(extent, true, {
      padding: this.#getZoomPadding(),
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
    const requestId = Symbol(overlayId);
    this.#overlayRequests.set(overlayId, requestId);
    const { map } = this.getMapViewer();

    try {
      const layer = await StacLayerHelper.addGeoTiffLayer(map, geotiffUrl, opacity);
      if (this.#overlayRequests.get(overlayId) !== requestId) {
        if (layer) StacLayerHelper.removeStacLayer(map, layer);
        return false;
      }

      this.#overlayRequests.delete(overlayId);
      if (!layer) {
        this.showError('stacBrowser.errorPreview');
        return false;
      }

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
   * Adds an image preview overlay (e.g., a thumbnail) fitted to the item footprint, replacing any overlay with the same id.
   *
   * @param overlayId - The caller-provided id of the overlay
   * @param imageUrl - URL of the image
   * @param bbox - The bounding box in EPSG:4326 [west, south, east, north]
   * @param opacity - Optional overlay opacity (0-1)
   * @param geometry - Optional GeoJSON footprint geometry in EPSG:4326
   * @returns A promise that resolves with true when the image overlay was added
   */
  async addImageOverlay(overlayId: string, imageUrl: string, bbox: TypeLonLatBbox, opacity?: number, geometry?: unknown): Promise<boolean> {
    this.removeOverlay(overlayId);
    const requestId = Symbol(overlayId);
    this.#overlayRequests.set(overlayId, requestId);
    const { map } = this.getMapViewer();

    try {
      const layer = await StacLayerHelper.addImageLayer(map, imageUrl, bbox, opacity, geometry);
      if (this.#overlayRequests.get(overlayId) !== requestId) {
        StacLayerHelper.removeStacLayer(map, layer);
        return false;
      }

      this.#overlayRequests.delete(overlayId);
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

    StacLayerHelper.removeStacLayer(this.getMapViewer().map, layer);
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

  // #endregion PUBLIC METHODS

  // #region PRIVATE METHODS

  /**
   * Gets fit padding that reserves the visible STAC panel overlap on the left of the map.
   *
   * Falls back to normal padding when the panel is closed, unavailable, or leaves no usable fit area.
   *
   * @returns Padding in map pixels ordered as top, right, bottom, left
   */
  #getZoomPadding(): [number, number, number, number] {
    const [top, right, bottom, left] = StacBrowserController.ZOOM_PADDING;
    const padding: [number, number, number, number] = [top, right, bottom, left];
    const mapId = this.getMapId();
    const activeTab = getStoreUIActiveAppBarTab(mapId);
    if (!activeTab.isOpen || activeTab.tabId !== 'stac-browser') return padding;

    const panel = getGVElementById(mapId, 'appBar-stac-browser-panel');
    const mapTarget = getGVMapTargetElement(mapId);
    const mapSize = this.getMapViewer().map.getSize();
    if (!panel || !mapTarget || !mapSize || panel.getAttribute('aria-hidden') === 'true') return padding;

    const panelRect = panel.getBoundingClientRect();
    const mapRect = mapTarget.getBoundingClientRect();
    if (
      mapRect.width <= 0 ||
      panelRect.width <= 0 ||
      panelRect.bottom <= mapRect.top ||
      panelRect.top >= mapRect.bottom ||
      panelRect.left >= mapRect.right ||
      panelRect.right <= mapRect.left
    )
      return padding;

    // Convert CSS overlap into map pixels, including when the host applies CSS scaling.
    const overlap = Math.min(mapRect.width, panelRect.right - mapRect.left) * (mapSize[0] / mapRect.width);
    if (mapSize[0] <= left + overlap + right || mapSize[1] <= top + bottom) return padding;

    return [top, right, bottom, left + overlap];
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
    if (footprint.bbox && footprint.bbox.length >= 4) return `bbox:${JSON.stringify(footprint.bbox.slice(0, 4))}`;
    return undefined;
  }

  // #endregion STATIC METHODS
}
