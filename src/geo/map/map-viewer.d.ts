import type { Root } from 'react-dom/client';
import type { i18n } from 'i18next';
import OLMap from 'ol/Map';
import type { FitOptions } from 'ol/View';
import View from 'ol/View';
import type { Coordinate } from 'ol/coordinate';
import type { Extent } from 'ol/extent';
import type { Projection as OLProjection } from 'ol/proj';
import type { Condition } from 'ol/events/condition';
import type { Size } from 'ol/size';
import type { GeometryFunction } from 'ol/interaction/Draw';
import type { TypeMapFeaturesInstance, TypeViewSettings, TypeInteraction, TypeValidMapProjectionCodes, TypeDisplayLanguage, TypeDisplayTheme, TypeMapViewSettings } from '@/api/types/map-schema-types';
import type { TypeLayerStatus } from '@/api/types/layer-schema-types';
import { BasemapApi } from '@/geo/layer/basemap/basemap';
import { LayerApi } from '@/geo/layer/layer';
import type { TypeFeatureStyle } from '@/geo/layer/geometry/geometry-types';
import { AppBarApi } from '@/core/components/app-bar/app-bar-api';
import { NavBarApi } from '@/core/components/nav-bar/nav-bar-api';
import { FooterBarApi } from '@/core/components/footer-bar/footer-bar-api';
import { StateApi } from '@/core/stores/state-api';
import { Select } from '@/geo/interaction/select';
import { Draw } from '@/geo/interaction/draw';
import { Extent as ExtentInteraction } from '@/geo/interaction/extent';
import { Modify } from '@/geo/interaction/modify';
import { Snap } from '@/geo/interaction/snap';
import { Translate } from '@/geo/interaction/translate';
import type { TransformOptions } from '@/geo/interaction/transform/transform';
import { Transform } from '@/geo/interaction/transform/transform';
import type { EventDelegateBase } from '@/api/events/event-helper';
import { ModalApi } from '@/ui';
import { type TimeIANA } from '@/core/utils/date-mgt';
import type { TypeMapFeaturesConfig, TypeHTMLElement } from '@/core/types/global-types';
import type { TypeClickMarker } from '@/core/components/click-marker/click-marker';
import { Notifications } from '@/core/utils/notifications';
import type { TypeOrderedLayerInfo } from '@/core/stores/store-interface-and-intial-values/map-state';
import type { TypeLegend } from '@/core/stores/store-interface-and-intial-values/layer-state';
import type { PluginsContainer } from '@/api/plugin/plugin-types';
import type { AbstractPlugin } from '@/api/plugin/abstract-plugin';
/**
 * Class used to manage created maps.
 */
export declare class MapViewer {
    #private;
    /** Default densification number when forming layer extents, to make ture to compensate for earth curvature */
    static DEFAULT_STOPS: number;
    /** Default DPI values */
    static readonly DEFAULT_DPI_OPEN_LAYERS_LEGACY: number;
    static readonly DEFAULT_DPI_MODERN: number;
    static DEFAULT_DPI: number;
    /** Default inches per meter used by OpenLayers */
    static readonly DEFAULT_INCHES_PER_METER = 39.3700787;
    /** Map features configuration properties */
    mapFeaturesConfig: TypeMapFeaturesConfig;
    /** The id of the map */
    mapId: string;
    /** The OpenLayers map instance */
    map: OLMap;
    /** Plugins attached to the map */
    plugins: PluginsContainer;
    /** The overview map React root */
    overviewRoot: Root | undefined;
    /** Used to access button bar API to create buttons and button panels on the app-bar */
    appBarApi: AppBarApi;
    /** Used to access button bar API to create buttons and button panels on the nav-bar */
    navBarApi: NavBarApi;
    /** Used to access the footer bar API to create buttons and footer panels on the footer-bar */
    footerBarApi: FooterBarApi;
    /** Used to manage states */
    stateApi: StateApi;
    /** Used to access basemap functions */
    basemap: BasemapApi;
    /** Used to attach the notification class */
    notifications: Notifications;
    /** Used to access layers functions */
    layer: LayerApi;
    /** Modals creation */
    modal: ModalApi;
    /** Max number of icons cached */
    iconImageCacheSize: number;
    /** Getter for map is init */
    get mapInit(): boolean;
    /** Getter for map is ready. A Map is ready when all layers have been processed. */
    get mapReady(): boolean;
    /** Getter for map layers processed */
    get mapLayersProcessed(): boolean;
    /** Getter for map layers loaded */
    get mapLayersLoaded(): boolean;
    /**
     * Constructor for a MapViewer, setting:
     * - the mapId
     * - the mapFeaturesConfig
     * - i18n
     * - AppBar, NavBar, FooterBar
     * - modalApi
     * - basemap
     *
     * @param mapFeaturesConfig - Map properties
     * @param i18instance - Language instance
     */
    constructor(mapFeaturesConfig: TypeMapFeaturesConfig, i18instance: i18n);
    /**
     * Create an Open Layer map from configuration attached to the class.
     * This function is called from a useEffect and should be running synchronously.
     *
     * @param mapElement - HTML element to create the map within
     * @returns The OpenLayer map
     */
    createMap(mapElement: HTMLElement): OLMap;
    /**
     * Initializes map, layer class and geometries.
     * This function must be called once the Map is rendered.
     *
     * @returns A promise that resolves when the map initialization is complete
     */
    initMap(): Promise<void>;
    /**
     * Gets a plugin by its id.
     *
     * @param pluginId - The plugin id
     * @returns The plugin
     */
    getPlugin(pluginId: string): AbstractPlugin;
    /**
     * Asynchronously attempts to get a plugin by its id.
     *
     * @param pluginId - The plugin id
     * @returns A promise that resolves with the plugin
     */
    getPluginAsync(pluginId: string): Promise<AbstractPlugin>;
    /**
     * Retrieves the configuration object for a specific core plugin from the map's features configuration.
     *
     * @param pluginId - The ID of the core plugin to look up
     * @returns The configuration object for the specified plugin, or undefined if not found
     */
    getCorePackageConfig(pluginId: string): unknown | undefined;
    /**
     * Returns the current display language.
     *
     * @returns The display language
     */
    getDisplayLanguage(): TypeDisplayLanguage;
    /**
     * Returns the current display theme.
     *
     * @returns The display theme
     */
    getDisplayTheme(): TypeDisplayTheme;
    /**
     * Returns the map current state information.
     *
     * @returns The map state
     */
    getMapState(): TypeMapState;
    /**
     * Gets the map viewSettings.
     *
     * @returns The map viewSettings
     */
    getView(): View;
    /**
     * Set the map viewSettings (coordinate values in lon/lat).
     *
     * @param mapView - Map viewSettings object
     */
    setView(mapView: TypeViewSettings): void;
    /**
     * Asynchronously gets the map center coordinate to give a chance for the map to
     * render before returning the value.
     *
     * @returns A promise that resolves with the map center
     */
    getCenter(): Promise<Coordinate>;
    /**
     * Sets the map center.
     *
     * @param center - New center to use
     */
    setCenter(center: Coordinate): void;
    /**
     * Asynchronously gets the map size to give a chance for the map to
     * render before returning the value.
     *
     * @returns A promise that resolves with the map size
     */
    getMapSize(): Promise<Size>;
    /**
     * Asynchronously gets the map coordinate from pixel to give a chance for the map to
     * render before returning the value.
     *
     * @param pointXY - The pixel coordinate to convert
     * @param timeoutMs - The maximum time in milliseconds to wait for the getCoordinateFromPixel to return a value
     * @returns A promise that resolves with the map coordinate at the given pixel location
     */
    getCoordinateFromPixel(pointXY: [number, number], timeoutMs: number): Promise<Coordinate>;
    /**
     * Gets the map projection.
     *
     * @returns The map projection
     */
    getProjection(): OLProjection;
    /**
     * Gets the ordered layer info.
     *
     * @returns The ordered layer info
     */
    getMapLayerOrderInfo(): TypeOrderedLayerInfo[];
    /**
     * Gets the i18nInstance for localization.
     *
     * @returns The i18n instance
     */
    getI18nInstance(): i18n;
    /**
     * Gets geolocator search area.
     *
     * @returns The geolocator search area with coordinates and optional bounding box, or undefined if not set
     */
    getGeolocatorSearchArea(): {
        coords: Coordinate;
        bbox?: Extent;
    } | undefined;
    /**
     * Set fullscreen / exit fullscreen.
     *
     * @param status - Toggle fullscreen or exit fullscreen status
     * @param element - The element to toggle fullscreen on
     */
    setFullscreen(status: boolean, element: TypeHTMLElement | undefined): void;
    /**
     * Set map to either dynamic or static.
     *
     * @param interaction - Map interaction
     */
    setInteraction(interaction: TypeInteraction): void;
    /**
     * Set the display language of the map.
     *
     * @param displayLanguage - The language to use (en, fr)
     * @param reloadLayers - Optional flag to ask viewer to reload layers with the new localize language
     * @returns A promise that resolves when the language change is complete
     */
    setLanguage(displayLanguage: TypeDisplayLanguage, reloadLayers?: boolean | false): Promise<void>;
    /**
     * Sets the timezone used to display date values for this map.
     *
     * This affects how parsed date instants are converted and presented in the UI,
     * without modifying the underlying stored values.
     *
     * @param displayDateTimezone - The IANA timezone identifier to use for display
     * @throws {InvalidTimezoneError} When the time zone is not a valid or supported IANA identifier
     */
    setDisplayDateTimezone(displayDateTimezone: TimeIANA): void;
    /**
     * Set the display projection of the map.
     *
     * @param projectionCode - The projection code (3978, 3857)
     * @returns A promise that resolves when the projection change is complete
     */
    setProjection(projectionCode: TypeValidMapProjectionCodes): Promise<void>;
    /**
     * Rotates the view to align it at the given degrees.
     *
     * @param degree - The degrees to rotate the map to
     */
    rotate(degree: number): void;
    /**
     * Set the display theme of the map.
     *
     * @param displayTheme - The theme to use (geo.ca, light, dark)
     */
    setTheme(displayTheme: TypeDisplayTheme): void;
    /**
     * Gets map scale for Web Mercator or Lambert Conformal Conic projections.
     *
     * @returns The map scale (e.g. 50000 for 1:50,000), or undefined if meters per unit is unavailable
     */
    getMapScale(): number | undefined;
    /**
     * Converts a zoom level to a map scale.
     *
     * @param zoom - The desired zoom (e.g. 50000 for 1:50,000)
     * @returns The closest scale for the given zoom number, or undefined if meters per unit is unavailable
     */
    getMapScaleFromZoom(zoom: number): number | undefined;
    /**
     * Converts a map scale denominator (1:X) into the corresponding OpenLayers resolution.
     *
     * Resolution is computed using: resolution = scale / (metersPerUnit * inchesPerMeter * dpi)
     *
     * @param targetScale - The scale denominator (e.g., 50000000 for 1:50,000,000). Optional; returns undefined if not provided.
     * @param dpiValue - Dots per inch to use for conversion. Defaults to `MapViewer.DEFAULT_DPI` (usually 96 or 90.714 depending on standard).
     * @returns The map resolution in map units per pixel, or `undefined` if `targetScale` is not provided.
     */
    getMapResolutionFromScale(targetScale: number | undefined, dpiValue?: number): number | undefined;
    /**
     * Converts a map scale denominator (1:X) into the corresponding OpenLayers zoom level.
     *
     * Uses `getMapResolutionFromScale` internally and then computes the zoom for that resolution.
     *
     * @param targetScale - The scale denominator (e.g., 50000000 for 1:50,000,000). Optional; returns undefined if not provided.
     * @param dpiValue - Dots per inch to use for conversion. Defaults to `MapViewer.DEFAULT_DPI`.
     * @returns The OpenLayers zoom level corresponding to the scale, or `undefined` if `targetScale` is not provided.
     */
    getMapZoomFromScale(targetScale: number | undefined, dpiValue?: number): number | undefined;
    /**
     * Set the map zoom level.
     *
     * @param zoom - New zoom level
     * @returns A promise that resolves when the zoom operation completes
     */
    setMapZoomLevel(zoom: number): Promise<void>;
    /**
     * Set the minimum map zoom level.
     *
     * @param zoom - New minimum zoom level
     */
    setMinZoomLevel(zoom: number): void;
    /**
     * Set the maximum map zoom level.
     *
     * @param zoom - New maximum zoom level
     */
    setMaxZoomLevel(zoom: number): void;
    /**
     * Set map extent.
     *
     * @param extent - New extent to zoom to
     * @returns A promise that resolves when the zoom operation completes
     */
    setExtent(extent: Extent): Promise<void>;
    /**
     * Set the maximum extent of the map.
     *
     * @param extent - New extent to use
     */
    setMaxExtent(extent: Extent): void;
    /**
     * Add a new custom component to the map.
     *
     * @param mapComponentId - An id to the new component
     * @param component - The component to add
     */
    addComponent(mapComponentId: string, component: JSX.Element): void;
    /**
     * Remove an existing custom component from the map
     *
     * @param mapComponentId - The id of the component to remove
     */
    removeComponent(mapComponentId: string): void;
    /**
     * Add a localization ressource bundle for a supported language (fr, en).
     *
     * Then the new key added can be access from the utilities function getLocalizesMessage
     * to reuse in ui from outside the core viewer.
     *
     * @param language - The language to add the resource for (en, fr)
     * @param translations - The translation object to add
     */
    addLocalizeRessourceBundle(language: TypeDisplayLanguage, translations: Record<string, unknown>): void;
    /**
     * Emits a map single click event.
     *
     * NOTE: This Does not update the store, only emit the click.
     *
     * @param clickCoordinates - The clicked coordinates to emit
     */
    emitMapSingleClick(clickCoordinates: MapSingleClickEvent): void;
    /**
     * Simulate a map click and return promises of store update and ui update.
     *
     * @param lonlat - The lonlat coordinates to simulate
     * @returns The simulated map click information
     */
    simulateMapClick(lonlat: Coordinate): SimulatedMapClick;
    /**
     * Hide a click marker from the map
     */
    clickMarkerIconHide(): void;
    /**
     * Show a marker on the map.
     *
     * @param marker - The marker to add
     */
    clickMarkerIconShow(marker: TypeClickMarker): void;
    /**
     * Deletes the MapViewer, including its plugins, layers, etc.
     * This function does not unmount the MapViewer. To completely delete a MapViewer, use
     * cgpv.api.deleteMapViewer() which will delete the MapViewer and unmount it - for React.
     *
     * @returns A promise that resolves when the deletion is complete
     */
    delete(): Promise<void>;
    /**
     * Zoom to the specified extent.
     *
     * @param extent - The extent to zoom to
     * @param options - Optional options to configure the zoomToExtent (default: { padding: [100, 100, 100, 100], maxZoom: 11 })
     * @returns A promise that resolves when the zoom operation completes
     */
    zoomToExtent(extent: Extent, options?: FitOptions): Promise<void>;
    /**
     * Zoom to the initial extent defined in the map configuration.
     *
     * @returns A promise that resolves when the zoom operation completes
     */
    zoomToInitialExtent(): Promise<void>;
    /**
     * Update nav bar home button view settings.
     *
     * @param view - The new view settings
     */
    setHomeButtonView(view: TypeMapViewSettings): void;
    /**
     * Zoom to specified extent or coordinate provided in lonlat.
     *
     * @param extent - The extent or coordinate to zoom to
     * @param options - Optional options to configure the zoomToExtent (default: { padding: [100, 100, 100, 100], maxZoom: 11 })
     * @returns A promise that resolves when the zoom operation completes
     */
    zoomToLonLatExtentOrCoordinate(extent: Extent | Coordinate, options?: FitOptions): Promise<void>;
    /**
     * Update the size of the icon image list based on styles.
     *
     * @param legend - The legend to check
     */
    updateIconImageCache(legend: TypeLegend): void;
    /**
     * Waits until all GeoView layers reach the specified status before resolving the promise.
     *
     * This function repeatedly checks whether all layers have reached the given layerStatus.
     *
     * @param layerStatus - The desired status to wait for (e.g., 'loaded', 'processed')
     * @returns A promise that resolves with the number of layers that have reached the specified status
     */
    waitAllLayersStatus(layerStatus: TypeLayerStatus): Promise<number>;
    /**
     * Waits for the map layers loaded event to be emitted.
     *
     * @returns A promise that resolves with the number of layers that have reached the specified status
     */
    waitForLayersLoaded(): Promise<number>;
    /**
     * Waits for the rendercomplete event to be triggered.
     *
     * @returns A promise that resolves when map render is complete
     */
    waitForRender(): Promise<void>;
    /**
     * Initializes selection interactions.
     *
     * @returns The select interaction
     */
    initSelectInteractions(): Select;
    /**
     * Initializes extent interactions.
     *
     * @returns The extent interaction
     */
    initExtentInteractions(): ExtentInteraction;
    /**
     * Initializes translation interactions.
     *
     * @returns The translate interaction
     */
    initTranslateInteractions(): Translate;
    /**
     * Initializes translation interactions without requireing the extra selection click.
     * Note: This will limit translation interactions to one feature at a time.
     *
     * @returns The translate interaction
     */
    initTranslateOneFeatureInteractions(): Translate;
    /**
     * Initializes drawing interactions on the given vector source.
     *
     * @param geomGroupKey - The geometry group key in which to hold the geometries
     * @param type - The type of geometry to draw (Polygon, LineString, Circle, etc)
     * @param style - The styles for the drawing
     * @param geometryFunction - Optional geometry function for custom drawing behavior
     * @returns The draw interaction
     */
    initDrawInteractions(geomGroupKey: string, type: string, style: TypeFeatureStyle, geometryFunction?: GeometryFunction): Draw;
    /**
     * Initializes modifying interactions on the given vector source.
     *
     * @param geomGroupKey - The geometry group key in which to hold the geometries
     * @param style - Optional styles for the modification
     * @param insertVertexCondition - Optional condition for inserting vertices
     * @param pixelTolerance - Optional pixel tolerance for modification
     * @returns The modify interaction
     */
    initModifyInteractions(geomGroupKey: string, style?: TypeFeatureStyle, insertVertexCondition?: Condition, pixelTolerance?: number): Modify;
    /**
     * Initializes snapping interactions on the given vector source.
     *
     * @param geomGroupKey - The geometry group key in which to hold the geometries
     * @returns The snap interaction
     */
    initSnapInteractions(geomGroupKey: string): Snap;
    /**
     * Initializes transform interactions for feature manipulation.
     *
     * @param options - Optional options for the transform interaction
     * @returns The transform interaction
     */
    initTransformInteractions(options?: Partial<TransformOptions>): Transform;
    /**
     * Gets if north pole is visible. This is not a perfect solution and is more a work around.
     *
     * @returns A promise that resolves with true if visible, false otherwise
     */
    getNorthPoleVisibility(): Promise<boolean>;
    /**
     * Get north arrow bearing. Angle use to rotate north arrow for non Web Mercator projection.
     * https://www.movable-type.co.uk/scripts/latlong.html
     *
     * @returns The arrow angle
     */
    getNorthArrowAngle(): string;
    /**
     * Transforms coordinate from LonLat to the current projection of the map.
     *
     * @param coordinate - The LonLat coordinate
     * @returns The coordinate in the map projection
     */
    convertCoordinateLonLatToMapProj(coordinate: Coordinate): Coordinate;
    /**
     * Transforms coordinate from current projection of the map to LonLat.
     *
     * @param coordinate - The coordinate in map projection
     * @returns The coordinate in LonLat
     */
    convertCoordinateMapProjToLonLat(coordinate: Coordinate): Coordinate;
    /**
     * Transforms extent from LonLat to the current projection of the map.
     *
     * @param extent - The LonLat extent
     * @param stops - The number of stops to perform densification on the extent
     * @returns The extent in the map projection
     */
    convertExtentLonLatToMapProj(extent: Extent, stops?: number): Extent;
    /**
     * Transforms extent from current projection of the map to LonLat.
     *
     * @param extent - The extent in map projection
     * @returns The extent in LonLat
     */
    convertExtentMapProjToLonLat(extent: Extent): Extent;
    /**
     * Transforms coordinate from given projection to the current projection of the map.
     *
     * @param coordinate - The given coordinate
     * @param fromProj - The projection of the given coordinate
     * @returns The coordinate in the map projection
     */
    convertCoordinateFromProjToMapProj(coordinate: Coordinate, fromProj: OLProjection): Coordinate;
    /**
     * Transforms coordinate from map projection to given projection.
     *
     * @param coordinate - The given coordinate
     * @param toProj - The projection that should be output
     * @returns The coordinate in the given projection
     */
    convertCoordinateFromMapProjToProj(coordinate: Coordinate, toProj: OLProjection): Coordinate;
    /**
     * Transforms extent from given projection to the current projection of the map.
     *
     * @param extent - The given extent
     * @param fromProj - The projection of the given extent
     * @param stops - The number of stops to perform densification on the extent
     * @returns The extent in the map projection
     */
    convertExtentFromProjToMapProj(extent: Extent, fromProj: OLProjection, stops?: number): Extent;
    /**
     * Transforms extent from map projection to given projection. If the projections are the same, the extent is simply returned.
     *
     * @param extent - The given extent
     * @param toProj - The projection that should be output
     * @returns The extent in the given projection
     */
    convertExtentFromMapProjToProj(extent: Extent, toProj: OLProjection, stops?: number): Extent;
    /**
     * Creates a map config based on current map state.
     *
     * @param overrideGeocoreServiceNames - Optional - Indicates if geocore layer names should be kept as is or returned to defaults.
     *   Set to false after a language change to update the layer names with the new language.
     * @returns Map config with current map state, or undefined if unavailable
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
     * Register handlers on pointer move and map single click.
     *
     * @param map - Map to register events on
     */
    registerMapPointerHandlers(map: OLMap): void;
    /**
     * Unregister handlers on pointer move and map single click.
     *
     * @param map - Map to unregister events on
     */
    unregisterMapPointerHandlers(map: OLMap): void;
    /**
     * Registers a map init event callback.
     *
     * @param callback - The callback to be executed whenever the event is emitted
     */
    onMapInit(callback: MapInitDelegate): void;
    /**
     * Unregisters a map init event callback.
     *
     * @param callback - The callback to stop being called whenever the event is emitted
     */
    offMapInit(callback: MapInitDelegate): void;
    /**
     * Registers a map ready event callback.
     *
     * @param callback - The callback to be executed whenever the event is emitted
     */
    onMapReady(callback: MapReadyDelegate): void;
    /**
     * Unregisters a map ready event callback.
     *
     * @param callback - The callback to stop being called whenever the event is emitted
     */
    offMapReady(callback: MapReadyDelegate): void;
    /**
     * Registers a map layers processed event callback.
     *
     * @param callback - The callback to be executed whenever the event is emitted
     */
    onMapLayersProcessed(callback: MapLayersProcessedDelegate): void;
    /**
     * Unregisters a map layers processed event callback.
     *
     * @param callback - The callback to stop being called whenever the event is emitted
     */
    offMapLayersProcessed(callback: MapLayersProcessedDelegate): void;
    /**
     * Registers a map layers loaded event callback.
     *
     * @param callback - The callback to be executed whenever the event is emitted
     */
    onMapLayersLoaded(callback: MapLayersLoadedDelegate): void;
    /**
     * Unregisters a map layers loaded event callback.
     *
     * @param callback - The callback to stop being called whenever the event is emitted
     */
    offMapLayersLoaded(callback: MapLayersLoadedDelegate): void;
    /**
     * Registers a map move end event callback.
     *
     * @param callback - The callback to be executed whenever the event is emitted
     */
    onMapMoveEnd(callback: MapMoveEndDelegate): void;
    /**
     * Unregisters a map move end event callback.
     *
     * @param callback - The callback to stop being called whenever the event is emitted
     */
    offMapMoveEnd(callback: MapMoveEndDelegate): void;
    /**
     * Registers a map pointer move event callback.
     *
     * @param callback - The callback to be executed whenever the event is emitted
     */
    onMapPointerMove(callback: MapPointerMoveDelegate): void;
    /**
     * Unregisters a map pointer move event callback.
     *
     * @param callback - The callback to stop being called whenever the event is emitted
     */
    offMapPointerMove(callback: MapPointerMoveDelegate): void;
    /**
     * Registers a map pointer stop event callback.
     *
     * @param callback - The callback to be executed whenever the event is emitted
     */
    onMapPointerStop(callback: MapPointerMoveDelegate): void;
    /**
     * Unregisters a map pointer stop event callback.
     *
     * @param callback - The callback to stop being called whenever the event is emitted
     */
    offMapPointerStop(callback: MapPointerMoveDelegate): void;
    /**
     * Registers a map single click event callback.
     *
     * @param callback - The callback to be executed whenever the event is emitted
     */
    onMapSingleClick(callback: MapSingleClickDelegate): void;
    /**
     * Unregisters a map single click end event callback.
     *
     * @param callback - The callback to stop being called whenever the event is emitted
     */
    offMapSingleClick(callback: MapSingleClickDelegate): void;
    /**
     * Registers a map zoom end event callback.
     *
     * @param callback - The callback to be executed whenever the event is emitted
     */
    onMapZoomEnd(callback: MapZoomEndDelegate): void;
    /**
     * Unregisters a map zoom end event callback.
     *
     * @param callback - The callback to stop being called whenever the event is emitted
     */
    offMapZoomEnd(callback: MapZoomEndDelegate): void;
    /**
     * Registers a map rotation event callback.
     *
     * @param callback - The callback to be executed whenever the event is emitted
     */
    onMapRotation(callback: MapRotationDelegate): void;
    /**
     * Unregisters a map rotation event callback.
     *
     * @param callback - The callback to stop being called whenever the event is emitted
     */
    offMapRotation(callback: MapRotationDelegate): void;
    /**
     * Registers a map change size event callback.
     *
     * @param callback - The callback to be executed whenever the event is emitted
     */
    onMapChangeSize(callback: MapChangeSizeDelegate): void;
    /**
     * Unregisters a map change size event callback.
     *
     * @param callback - The callback to stop being called whenever the event is emitted
     */
    offMapChangeSize(callback: MapChangeSizeDelegate): void;
    /**
     * Registers a map projection change event callback.
     *
     * @param callback - The callback to be executed whenever the event is emitted
     */
    onMapProjectionChanged(callback: MapProjectionChangedDelegate): void;
    /**
     * Unregisters a map projection changed event callback.
     *
     * @param callback - The callback to stop being called whenever the event is emitted
     */
    offMapProjectionChanged(callback: MapChangeSizeDelegate): void;
    /**
     * Registers a component added event callback.
     *
     * @param callback - The callback to be executed whenever the event is emitted
     */
    onMapComponentAdded(callback: MapComponentAddedDelegate): void;
    /**
     * Unregisters a component added event callback.
     *
     * @param callback - The callback to stop being called whenever the event is emitted
     */
    offMapComponentAdded(callback: MapComponentAddedDelegate): void;
    /**
     * Registers a component removed event callback.
     *
     * @param callback - The callback to be executed whenever the event is emitted
     */
    onMapComponentRemoved(callback: MapComponentRemovedDelegate): void;
    /**
     * Unregisters a component removed event callback.
     *
     * @param callback - The callback to stop being called whenever the event is emitted
     */
    offMapComponentRemoved(callback: MapComponentRemovedDelegate): void;
    /**
     * Registers a language changed event callback.
     *
     * @param callback - The callback to be executed whenever the event is emitted
     */
    onMapLanguageChanged(callback: MapLanguageChangedDelegate): void;
    /**
     * Unregisters a language changed event callback.
     *
     * @param callback - The callback to stop being called whenever the event is emitted
     */
    offMapLanguageChanged(callback: MapLanguageChangedDelegate): void;
}
/**
 *  Definition of map state to attach to the map object for reference.
 */
export type TypeMapState = {
    currentProjection: number;
    currentZoom: number;
    mapCenterCoordinates: Coordinate;
    mapExtent: Extent;
    rotation: number;
    singleClickedPosition: TypeMapMouseInfo;
    pointerPosition: TypeMapMouseInfo;
};
/**
 * Type used to define the map mouse information
 * */
export type TypeMapMouseInfo = {
    lonlat: Coordinate;
    pixel: Coordinate;
    projected: Coordinate;
    dragging: boolean;
};
/**
 * Type used when fetching geometry json
 */
export type GeometryJsonResponse = {
    geometry: GeometryJsonResponseGeometry;
};
/**
 * Type used when fetching geometry json with coordinates property
 */
export type GeometryJsonResponseGeometry = {
    coordinates: number[] | Coordinate[][];
};
/**
 * Delegate for the map init event handler function signature.
 */
export type MapInitDelegate = EventDelegateBase<MapViewer, undefined, void>;
/**
 * Delegate for the map ready event handler function signature.
 */
export type MapReadyDelegate = EventDelegateBase<MapViewer, undefined, void>;
/**
 * Delegate for the map layers processed event handler function signature.
 */
export type MapLayersProcessedDelegate = EventDelegateBase<MapViewer, undefined, void>;
/**
 * Delegate for the map layers loaded event handler function signature.
 */
export type MapLayersLoadedDelegate = EventDelegateBase<MapViewer, undefined, void>;
/**
 * Event for the map move end delegate.
 */
export type MapMoveEndEvent = {
    lonlat: Coordinate;
};
/**
 * Delegate for the map move end event handler function signature.
 */
export type MapMoveEndDelegate = EventDelegateBase<MapViewer, MapMoveEndEvent, void>;
/**
 * Event for the map pointer move delegate.
 */
export type MapPointerMoveEvent = TypeMapMouseInfo;
/**
 * Delegate for the map pointer move event handler function signature.
 */
export type MapPointerMoveDelegate = EventDelegateBase<MapViewer, MapPointerMoveEvent, void>;
/**
 * Event for the map single click delegate.
 */
export type MapSingleClickEvent = TypeMapMouseInfo;
/**
 * Delegate for the map single click event handler function signature.
 */
export type MapSingleClickDelegate = EventDelegateBase<MapViewer, MapSingleClickEvent, void>;
/**
 * Event for the map zoom end delegate.
 */
export type MapZoomEndEvent = {
    zoom: number;
};
/**
 * Delegate for the map zoom end event handler function signature.
 */
export type MapZoomEndDelegate = EventDelegateBase<MapViewer, MapZoomEndEvent, void>;
/**
 * Event for the map rotation delegate.
 */
export type MapRotationEvent = {
    rotation: number;
};
/**
 * Delegate for the map rotation event handler function signature.
 */
export type MapRotationDelegate = EventDelegateBase<MapViewer, MapRotationEvent, void>;
/**
 * Event for the map change size delegate.
 */
export type MapChangeSizeEvent = {
    size: Size;
};
/**
 * Delegate for the map change size event handler function signature.
 */
export type MapChangeSizeDelegate = EventDelegateBase<MapViewer, MapChangeSizeEvent, void>;
/**
 * Event for the map projection changed delegate.
 */
export type MapProjectionChangedEvent = {
    projection: OLProjection;
};
/**
 * Delegate for the map projection changed event handler function signature.
 */
export type MapProjectionChangedDelegate = EventDelegateBase<MapViewer, MapProjectionChangedEvent, void>;
/**
 * Event for the map component added delegate.
 */
export type MapComponentAddedEvent = {
    mapComponentId: string;
    component: JSX.Element;
};
/**
 * Delegate for the map component added event handler function signature.
 */
export type MapComponentAddedDelegate = EventDelegateBase<MapViewer, MapComponentAddedEvent, void>;
/**
 * Event for the map component removed delegate.
 */
export type MapComponentRemovedEvent = {
    mapComponentId: string;
};
/**
 * Delegate for the map component removed event handler function signature.
 */
export type MapComponentRemovedDelegate = EventDelegateBase<MapViewer, MapComponentRemovedEvent, void>;
/**
 * Event for the map language changed delegate.
 */
export type MapLanguageChangedEvent = {
    language: TypeDisplayLanguage;
};
/**
 * Delegate for the map language changed event handler function signature.
 */
export type MapLanguageChangedDelegate = EventDelegateBase<MapViewer, MapLanguageChangedEvent, void>;
/**
 * Define a return type for a map click simulation to be able to await on different promises.
 */
export type SimulatedMapClick = {
    /** Promise resolving when the query of the map click is complete */
    promiseQuery: Promise<void>;
    /** Promise resolving when the query of the map click is complete and the UI has been updated */
    promiseQueryBatched: Promise<void>;
};
//# sourceMappingURL=map-viewer.d.ts.map