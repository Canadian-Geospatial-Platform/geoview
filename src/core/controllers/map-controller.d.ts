import type { Root } from 'react-dom/client';
import type { Pixel } from 'ol/pixel';
import type { Size } from 'ol/size';
import type { Coordinate } from 'ol/coordinate';
import type { OverviewMap as OLOverviewMap } from 'ol/control';
import { type Extent, type TypeBasemapOptions, type TypeFeatureInfoEntry, type TypeMapFeaturesInstance, type TypeMapMouseInfo, type TypePointMarker, type TypeServiceUrls, type TypeValidMapProjectionCodes } from '@/api/types/map-schema-types';
import type { TypeMapFeaturesConfig } from '@/core/types/global-types';
import { AbstractMapViewerController } from '@/core/controllers/base/abstract-map-viewer-controller';
import type { MapViewer } from '@/geo/map/map-viewer';
import type { TypeFeatureStyle } from '@/geo/layer/geometry/geometry-types';
import type { Draw } from '@/geo/interaction/draw';
import type { TypeClickMarker } from '@/core/components/click-marker/click-marker';
import type { FitOptions } from 'ol/View';
import type { FeatureHighlight } from '@/geo/map/feature-highlight';
/**
 * Controller responsible for Map interactions.
 */
export declare class MapController extends AbstractMapViewerController {
    #private;
    /** The minimal delay in ms to wait after a zoom animation to ensure it has completed. */
    static readonly ZOOM_MIN_DELAY = 500;
    /**
     * Creates an instance of MapController.
     *
     * @param mapViewer - The map viewer instance to associate with this controller
     * @param featureHighlight - The feature highlight instance to associate with this controller
     */
    constructor(mapViewer: MapViewer, featureHighlight: FeatureHighlight);
    /**
     * Zooms to the specified extent.
     *
     * @param extent - The extent to zoom to
     * @param options - The options to configure the zoomToExtent (default: { padding: [100, 100, 100, 100], maxZoom: 13, duration: 500 })
     * @returns A promise that resolves when the zoom animation is complete
     * @throws {InvalidExtentError} When the extent is invalid
     */
    zoomToExtent(extent: Extent, options?: FitOptions): Promise<void>;
    /**
     * Returns to initial view state of map using config.
     *
     * @returns A promise that resolves when the zoom animation is complete
     */
    zoomToInitialExtent(): Promise<void>;
    /**
     * Zooms to geolocation position provided.
     *
     * @param position - Info on position to zoom to
     * @returns A promise that resolves when the zoom animation is complete
     */
    zoomToMyLocation(position: GeolocationPosition): Promise<void>;
    /**
     * Animates the map to the specified zoom level.
     *
     * The store is updated automatically via the MapViewer move-end event.
     *
     * @param zoom - The target zoom level
     * @param duration - Optional animation duration in ms
     * @returns A promise that resolves when the zoom animation is complete
     */
    zoomMap(zoom: number, duration?: number): Promise<void>;
    /**
     * Animates the map zoom without awaiting the result.
     *
     * Fires and forgets the zoom, logging any errors.
     *
     * @param zoom - The target zoom level
     * @param duration - Optional animation duration in ms
     */
    zoomMapAndForget(zoom: number, duration?: number): void;
    /**
     * Zooms to a geolocator search result location.
     *
     * Highlights the bounding box if available, zooms to the extent, and shows the click marker.
     *
     * @param searchItem - The search item description
     * @param coords - The lon/lat coordinates to zoom to
     * @param bbox - Optional bounding box extent for the search result
     * @returns A promise that resolves when the zoom is complete
     */
    zoomToGeoLocatorLocation(searchItem: string, coords: Coordinate, bbox?: Extent): Promise<void>;
    /**
     * Adds a feature to the highlighted features list and visually highlights it on the map.
     *
     * WMS features are excluded since they cannot be individually highlighted.
     *
     * @param feature - The feature to highlight
     */
    addHighlightedFeature(feature: TypeFeatureInfoEntry): void;
    /**
     * Highlights a bounding box on the map.
     *
     * @param extent - The extent to highlight
     * @param isLayerHighlight - Optional flag indicating if this is a layer-level highlight
     */
    highlightBBox(extent: Extent, isLayerHighlight?: boolean): void;
    /**
     * Removes the highlighted bounding box from the map.
     */
    removeBBoxHighlight(): void;
    /**
     * Removes a highlighted feature, or all highlighted features, from the map.
     *
     * WMS features are excluded since they cannot be individually highlighted.
     *
     * @param feature - The feature to remove, or 'all' to remove all highlights
     */
    removeHighlightedFeature(feature: TypeFeatureInfoEntry | 'all'): void;
    /**
     * Adds point markers to a group, replacing existing markers with matching IDs or coordinates.
     *
     * @param group - The group to add the markers to
     * @param pointMarkers - The point markers to add
     */
    addPointMarkers(group: string, pointMarkers: TypePointMarker[]): void;
    /**
     * Removes point markers from a group, or removes the entire group.
     *
     * @param group - The group to remove the markers from
     * @param idsOrCoordinates - Optional IDs or coordinates of the markers to remove; if omitted, the entire group is removed
     */
    removePointMarkersOrGroup(group: string, idsOrCoordinates?: string[] | Coordinate[]): void;
    /**
     * Changes the map projection.
     *
     * Reprojects the view, reloads basemaps, refreshes layers, removes incompatible vector tile layers,
     * and repeats the last feature query. Shows a circular progress indicator during the transition.
     *
     * @param projectionCode - The target projection code
     * @returns A promise that resolves when the projection change is complete
     */
    setProjection(projectionCode: TypeValidMapProjectionCodes): Promise<void>;
    /**
     * Changes the map projection without awaiting the result.
     *
     * Fires and forgets the projection change, logging any errors.
     *
     * @param projectionCode - The target projection code
     */
    setProjectionAndForget(projectionCode: TypeValidMapProjectionCodes): void;
    /**
     * Converts a map coordinate to a pixel position.
     *
     * @param coord - The map coordinate
     * @returns The pixel position on the map viewport
     */
    getPixelFromCoordinate(coord: Coordinate): Pixel;
    /**
     * Sets the click coordinates in the store and emits a single click event in WCAG mode.
     *
     * @param clickCoordinates - The click coordinate information
     */
    setClickCoordinates(clickCoordinates: TypeMapMouseInfo, abortSignal?: AbortSignal): void;
    /**
     * Shows the click marker icon at the given marker position.
     *
     * Projects the marker's lon/lat coordinates to the current map projection before placing it.
     *
     * @param marker - The click marker containing lon/lat coordinates
     */
    clickMarkerIconShow(marker: TypeClickMarker): void;
    /**
     * Forces the map to re-render all layers and features.
     * Useful when layer styles or features have been updated programmatically and need to be reflected visually.
     */
    forceMapToRender(): void;
    /**
     * Sets the React root for the overview map so it can be destroyed with the map element.
     *
     * @param overviewRoot - The React root element for the overview map
     */
    setMapOverviewMapRoot(overviewRoot: Root): void;
    /**
     * Sets the map size in the store and optionally resizes the OpenLayers map.
     *
     * @param size - The new map size
     * @param resizeMap - Optional flag to also resize the OpenLayers map element
     */
    setMapSize(size: Size, resizeMap?: boolean): void;
    /**
     * Rotates the map to the specified angle.
     *
     * The store is updated automatically via the MapViewer move-end event.
     *
     * @param rotation - The target rotation angle in radians
     * @param animate - Whether to animate the rotation change, defaults to true
     */
    rotate(rotation: number, animate?: boolean): void;
    /**
     * Toggles the coordinate info display on or off.
     *
     * When toggled on, clicking the map will display coordinate information such as UTM zone, NTS sheet, and altitude.
     * When toggled off, any existing details coordinate info is removed from the details store.
     * The clicked coordinates themselves remain in the map store.
     *
     * @param abortSignal - Optional AbortSignal to cancel the fetch requests if needed
     */
    toggleCoordinateInfoEnabled(abortSignal: AbortSignal): void;
    /**
     * Creates or deletes coordinate info based on the current enabled state.
     *
     * When coordinate info is enabled, fetches UTM zone, NTS sheet, and altitude
     * data from the configured service URLs and creates a coordinate info layer
     * entry in the store. When disabled, removes any existing coordinate info.
     *
     * @param coordinates - The map mouse info containing click coordinates
     * @param serviceUrls - Service URLs for UTM, NTS, and altitude lookups
     * @param abortSignal - Optional AbortSignal to cancel the fetch requests if needed
     */
    updateStoreCoordinateInfo(coordinates: TypeMapMouseInfo, serviceUrls: TypeServiceUrls, abortSignal?: AbortSignal): Promise<void>;
    /**
     * Gets the OpenLayers overview map control for the given map.
     *
     * @param div - The HTML div element to host the overview map
     * @returns The OpenLayers OverviewMap control
     */
    initOverviewMapControl(div: HTMLDivElement): OLOverviewMap;
    /**
     * Sets the visibility of the overview map control.
     *
     * @param visible - Whether the overview map should be visible
     */
    setOverviewMapVisibility(visible: boolean): void;
    /**
     * Resets the basemap using the current display language and projection.
     *
     * @returns A promise that resolves when the basemap has been reloaded
     */
    resetBasemap(): Promise<void>;
    /**
     * Creates and sets a new basemap with the given options.
     *
     * @param basemapOptions - The basemap options to apply
     * @returns A promise that resolves when the basemap has been set
     */
    setBasemap(basemapOptions: TypeBasemapOptions): Promise<void>;
    /**
     * Creates a map config based on current map state.
     *
     * @param overrideGeocoreServiceNames - Indicates if geocore layer names should be kept as is or returned to defaults
     * @returns The type map features instance
     */
    createMapConfigFromMapState(overrideGeocoreServiceNames?: boolean | 'hybrid'): TypeMapFeaturesInstance | undefined;
    /**
     * Searches through a map config and replaces any matching layer names with their provided partner.
     *
     * @param namePairs - The array of name pairs. Presumably one english and one french name in each pair
     * @param mapConfig - Optional config to modify, or one created using the current map state if not provided
     * @param removeUnlisted - Optional - Whether or not names not provided should be removed from config
     * @returns Map config with updated names, or undefined if no config is available
     */
    replaceMapConfigLayerNames(namePairs: string[][], mapConfig?: TypeMapFeaturesConfig, removeUnlisted?: boolean): TypeMapFeaturesInstance | undefined;
    /**
     * Searches through a map config and replaces any matching layer names with their provided partner.
     *
     * @param namePairs - The array of name pairs. Presumably one english and one french name in each pair
     * @param mapConfig - The config to modify
     * @param removeUnlisted - Remove any layer name that doesn't appear in namePairs
     * @returns Map config with updated names
     */
    static utilReplaceMapConfigLayerNames(namePairs: string[][], mapConfig: TypeMapFeaturesInstance, removeUnlisted?: boolean): TypeMapFeaturesInstance;
    /**
     * Creates a new geometry group on the map if it doesn't already exist.
     * Geometry groups are used to organize and manage collections of vector features (lines, polygons, points).
     *
     * @param groupName - The unique name for the geometry group to create
     */
    createGeometryGroup(groupName: string): void;
    /**
     * Deletes all geometries from a geometry group.
     * Removes all vector features (lines, polygons, points) that belong to the specified group.
     * The group itself remains and can be reused.
     *
     * @param groupName - The name of the geometry group to clear
     */
    deleteGeometriesFromGroup(groupName: string): void;
    /**
     * Initializes drawing interactions on the given vector source.
     *
     * @param geomGroupKey - The geometry group key in which to hold the geometries
     * @param type - The type of geometry to draw (Polygon, LineString, Circle, etc)
     * @param style - The styles for the drawing
     * @returns The init draw interactions object
     */
    initDrawInteractions(geomGroupKey: string, type: string, style: TypeFeatureStyle): Draw;
}
//# sourceMappingURL=map-controller.d.ts.map