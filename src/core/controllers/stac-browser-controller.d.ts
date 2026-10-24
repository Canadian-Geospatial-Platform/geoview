import type { Extent } from 'ol/extent';
import { AbstractMapViewerController } from '@/core/controllers/base/abstract-map-viewer-controller';
import type { ControllerRegistry } from '@/core/controllers/base/controller-registry';
import type { MapViewer } from '@/geo/map/map-viewer';
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
export declare class StacBrowserController extends AbstractMapViewerController {
    #private;
    /** Padding (in pixels) used when zooming to a STAC extent. */
    static readonly ZOOM_PADDING: number[];
    /**
     * Creates an instance of StacBrowserController.
     *
     * @param mapViewer - The map viewer instance to associate with this controller
     * @param controllerRegistry - The controller registry for accessing sibling controllers
     */
    constructor(mapViewer: MapViewer, controllerRegistry: ControllerRegistry);
    /**
     * Removes all preview overlays when the controller is unhooked.
     */
    protected onUnhook(): void;
    /**
     * Replaces the footprints of a geometry group, each drawn with its own style.
     *
     * Identical footprints are drawn once. Bbox footprints are densified so their edges follow curvilinear projections (e.g., LCC).
     *
     * @param groupId - The geometry group id used to manage the footprints lifecycle
     * @param footprints - The styled footprints to draw
     * @param zIndex - Optional z-index of the geometry group (footprint groups default to 9999)
     */
    setFootprints(groupId: string, footprints: TypeStacStyledFootprint[], zIndex?: number): void;
    /**
     * Removes all footprints of a geometry group.
     *
     * @param groupId - The geometry group id to clear
     */
    clearFootprints(groupId: string): void;
    /**
     * Zooms to a lon/lat bounding box in the unobscured map area without a STAC-specific zoom cap.
     * Densifies edges for curvilinear projections and offsets the fit for the open STAC panel.
     *
     * @param bbox - The bounding box in EPSG:4326 [west, south, east, north]
     * @returns A promise that resolves when the zoom animation is complete
     * @throws {InvalidExtentError} When the extent is invalid (propagated from `zoomToExtent()`)
     */
    zoomToLonLatBbox(bbox: TypeLonLatBbox): Promise<void>;
    /**
     * Captures the visible map extent without converting it through lon/lat.
     *
     * @returns The saved extent and projection, or undefined when the map has no usable size or extent
     */
    captureMapExtent(): TypeStacMapExtentSnapshot | undefined;
    /**
     * Restores a saved map extent without extra padding, transforming it when the map projection has changed.
     *
     * @param snapshot - The saved extent and source projection
     * @returns A promise that resolves when the zoom animation is complete
     * @throws {InvalidExtentError} When the saved extent is invalid
     */
    zoomToMapExtent(snapshot: TypeStacMapExtentSnapshot): Promise<void>;
    /**
     * Gets the current map extent as a lon/lat bounding box.
     *
     * @returns The map extent in EPSG:4326 [west, south, east, north], clamped to valid bounds
     */
    getMapExtentAsLonLatBbox(): TypeLonLatBbox;
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
    addPreviewOverlay(overlayId: string, previewAsset: TypeStacPreviewAsset, opacity?: number, bbox?: number[], geometry?: unknown): Promise<boolean>;
    /**
     * Adds a Cloud-Optimized GeoTIFF preview overlay on the map, replacing any overlay with the same id.
     *
     * @param overlayId - The caller-provided id of the overlay
     * @param geotiffUrl - URL of the GeoTIFF
     * @param opacity - Optional overlay opacity (0-1)
     * @returns A promise that resolves with true when the overlay was added
     */
    addGeoTiffOverlay(overlayId: string, geotiffUrl: string, opacity?: number): Promise<boolean>;
    /**
     * Checks whether a preview overlay is on the map.
     *
     * @param overlayId - The id of the overlay
     * @returns True when the overlay exists
     */
    hasOverlay(overlayId: string): boolean;
    /**
     * Removes a preview overlay from the map.
     *
     * @param overlayId - The id of the overlay to remove
     */
    removeOverlay(overlayId: string): void;
    /**
     * Removes all preview overlays from the map.
     */
    removeAllOverlays(): void;
    /**
     * Shows a translated error message in the snackbar and the notification panel.
     *
     * @param messageKey - The translation key of the message
     * @param messageParams - Optional parameters for message interpolation
     */
    showError(messageKey: string, messageParams?: Record<string, unknown>): void;
    /**
     * Shows a translated success message in the snackbar and the notification panel.
     *
     * @param messageKey - The translation key of the message
     * @param messageParams - Optional parameters for message interpolation
     */
    showSuccess(messageKey: string, messageParams?: Record<string, unknown>): void;
}
//# sourceMappingURL=stac-browser-controller.d.ts.map