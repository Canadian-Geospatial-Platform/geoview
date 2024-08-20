/// <reference types="react" />
import { Root } from 'react-dom/client';
import { i18n } from 'i18next';
import OLMap from 'ol/Map';
import View, { FitOptions } from 'ol/View';
import { Coordinate } from 'ol/coordinate';
import { Extent } from 'ol/extent';
import { Projection as OLProjection, ProjectionLike } from 'ol/proj';
import { TypeViewSettings, TypeInteraction, TypeValidMapProjectionCodes, TypeDisplayLanguage, TypeDisplayTheme } from '@config/types/map-schema-types';
import { Basemap } from '@/geo/layer/basemap/basemap';
import { LayerApi } from '@/geo/layer/layer';
import { TypeFeatureStyle } from '@/geo/layer/geometry/geometry-types';
import { TypeOrderedLayerInfo } from '@/app';
import { TypeRecordOfPlugin } from '@/api/plugin/plugin-types';
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
import { EventDelegateBase } from '@/api/events/event-helper';
import { ModalApi } from '@/ui';
import { TypeMapFeaturesConfig, TypeHTMLElement, TypeJsonObject } from '@/core/types/global-types';
import { TypeClickMarker } from '@/core/components/click-marker/click-marker';
import { Notifications } from '@/core/utils/notifications';
/**
 * Class used to manage created maps
 *
 * @exports
 * @class MapViewer
 */
export declare class MapViewer {
    #private;
    mapFeaturesConfig: TypeMapFeaturesConfig;
    mapId: string;
    map: OLMap;
    plugins: TypeRecordOfPlugin;
    overviewRoot: Root | undefined;
    appBarApi: AppBarApi;
    navBarApi: NavBarApi;
    footerBarApi: FooterBarApi;
    stateApi: StateApi;
    basemap: Basemap;
    notifications: Notifications;
    layer: LayerApi;
    modal: ModalApi;
    iconImageCacheSize: number;
    get mapInit(): boolean;
    get mapReady(): boolean;
    get mapLayersProcessed(): boolean;
    get mapLayersLoaded(): boolean;
    /**
     * Constructor for a MapViewer, setting:
     * - the mapId
     * - the mapFeaturesConfig
     * - i18n
     * - AppBar, NavBar, FooterBar
     * - modalApi
     * - basemap
     * @param {TypeMapFeaturesConfig} mapFeaturesConfig map properties
     * @param {i18n} i18instance language instance
     */
    constructor(mapFeaturesConfig: TypeMapFeaturesConfig, i18instance: i18n);
    /**
     * Create an Open Layer map from configuration attached to the class
     * @param {HTMLElement} mapElement - HTML element to create the map within
     * @returns {OLMap} The OpenLayer map
     */
    createMap(mapElement: HTMLElement): OLMap;
    /**
     * Initializes map, layer class and geometries
     */
    initMap(): void;
    /**
     * Add a new custom component to the map
     *
     * @param {string} mapComponentId - An id to the new component
     * @param {JSX.Element} component - The component to add
     */
    addComponent(mapComponentId: string, component: JSX.Element): void;
    /**
     * Remove an existing custom component from the map
     *
     * @param mapComponentId - The id of the component to remove
     */
    removeComponent(mapComponentId: string): void;
    /**
     * Add a localization ressource bundle for a supported language (fr, en). Then the new key added can be
     * access from the utilies function getLocalizesMessage to reuse in ui from outside the core viewer.
     *
     * @param {TypeDisplayLanguage} language - The language to add the ressoruce for (en, fr)
     * @param {TypeJsonObject} translations - The translation object to add
     */
    addLocalizeRessourceBundle(language: TypeDisplayLanguage, translations: TypeJsonObject): void;
    /**
     * Returns the current display language
     * @returns {TypeDisplayLanguage} The display language
     */
    getDisplayLanguage(): TypeDisplayLanguage;
    /**
     * Returns the current display theme
     * @returns {TypeDisplayTheme} The display theme
     */
    getDisplayTheme(): TypeDisplayTheme;
    /**
     * Returns the map current state information
     * @returns {TypeMapState} The map state
     */
    getMapState(): TypeMapState;
    /**
     * Gets the map viewSettings
     * @returns the map viewSettings
     */
    getView(): View;
    /**
     * Gets the map projection
     * @returns the map viewSettings
     */
    getProjection(): OLProjection;
    /**
     * Gets the ordered layer info.
     * @returns {TypeOrderedLayerInfo[]} The ordered layer info
     */
    getMapLayerOrderInfo(): TypeOrderedLayerInfo[];
    /**
     * set fullscreen / exit fullscreen
     *
     * @param status - Toggle fullscreen or exit fullscreen status
     * @param {HTMLElement} element - The element to toggle fullscreen on
     */
    static setFullscreen(status: boolean, element: TypeHTMLElement): void;
    /**
     * Set map to either dynamic or static
     *
     * @param {TypeInteraction} interaction - Map interaction
     */
    setInteraction(interaction: TypeInteraction): void;
    /**
     * Set the display language of the map
     *
     * @param {TypeDisplayLanguage} displayLanguage - The language to use (en, fr)
     * @param {boolean} resetLayer - Optional flag to ask viewer to reload layers with the new localize language
     * @returns {Promise<[void, void]>}
     */
    setLanguage(displayLanguage: TypeDisplayLanguage, resetLayer?: boolean | false): Promise<[void, void]>;
    /**
     * Set the display projection of the map
     *
     * @param {TypeValidMapProjectionCodes} projectionCode - The projection code (3978, 3857)
     * @returns {Promise<void>}
     */
    setProjection(projectionCode: TypeValidMapProjectionCodes): Promise<void>;
    /**
     * Rotates the view to align it at the given degrees
     *
     * @param {number} degree - The degrees to rotate the map to
     */
    rotate(degree: number): void;
    /**
     * Set the display theme of the map
     *
     * @param {TypeDisplayTheme} displayTheme - The theme to use (geo.ca, light, dark)
     */
    setTheme(displayTheme: TypeDisplayTheme): void;
    /**
     * Set the map viewSettings (coordinate values in lat/long)
     *
     * @param {TypeViewSettings} mapView - Map viewSettings object
     */
    setView(mapView: TypeViewSettings): void;
    /**
     * Set the map center.
     *
     * @param {Coordinate} center - New center to use
     */
    setCenter(center: Coordinate): void;
    /**
     * Set the map zoom level.
     *
     * @param {number} zoom - New zoom level
     */
    setZoomLevel(zoom: number): void;
    /**
     * Set the minimum map zoom level.
     *
     * @param {number} zoom - New minimum zoom level
     */
    setMinZoomLevel(zoom: number): void;
    /**
     * Set the maximum map zoom level.
     *
     * @param {number} zoom - New maximum zoom level
     */
    setMaxZoomLevel(zoom: number): void;
    /**
     * Set map extent.
     *
     * @param {Extent} extent - New extent to zoom to.
     */
    setExtent(extent: Extent): Promise<void>;
    /**
     * Set the maximum extent of the map.
     *
     * @param {Extent} extent - New extent to use.
     */
    setMaxExtent(extent: Extent): void;
    /**
     * Loops through all geoview layers and refresh their respective source.
     * Use this function on projection change or other viewer modification who may affect rendering.
     *
     * @returns A Promise which resolves when the rendering is completed after the source(s) were changed.
     */
    refreshLayers(): Promise<void>;
    /**
     * Hide a click marker from the map
     */
    clickMarkerIconHide(): void;
    /**
     * Show a marker on the map
     * @param {TypeClickMarker} marker - The marker to add
     */
    clickMarkerIconShow(marker: TypeClickMarker): void;
    /**
     * Check if geometries needs to be loaded from a URL geoms parameter
     */
    loadGeometries(): void;
    /**
     * Remove map
     *
     * @param {boolean} deleteContainer - True if we want to delete div from the page
     * @returns {HTMLElement} The HTML element
     */
    remove(deleteContainer: boolean): Promise<HTMLElement>;
    /**
     * Reload a map from a config object stored in store, or provided. It first removes then recreates the map.
     * @param {TypeMapFeaturesConfig} mapConfig - Optional map config to use for reload.
     */
    reload(mapConfig?: TypeMapFeaturesConfig): Promise<void>;
    /**
     * Reload a map from a config object created using current map state. It first removes then recreates the map.
     */
    reloadWithCurrentState(): void;
    /**
     * Zoom to the specified extent.
     *
     * @param {Extent} extent - The extent to zoom to.
     * @param {FitOptions} options - The options to configure the zoomToExtent (default: { padding: [100, 100, 100, 100], maxZoom: 11 }).
     */
    zoomToExtent(extent: Extent, options?: FitOptions): Promise<void>;
    /**
     * Zoom to specified extent or coordinate provided in lnglat.
     *
     * @param {Extent | Coordinate} extent - The extent or coordinate to zoom to.
     * @param {FitOptions} options - The options to configure the zoomToExtent (default: { padding: [100, 100, 100, 100], maxZoom: 11 }).
     */
    zoomToLngLatExtentOrCoordinate(extent: Extent | Coordinate, options?: FitOptions): Promise<void>;
    /**
     * Initializes selection interactions
     */
    initSelectInteractions(): Select;
    /**
     * Initializes extent interactions
     */
    initExtentInteractions(): ExtentInteraction;
    /**
     * Initializes translation interactions
     */
    initTranslateInteractions(): Translate;
    /**
     * Initializes drawing interactions on the given vector source
     * @param {string} geomGroupKey - The geometry group key in which to hold the geometries
     * @param {string} type - The type of geometry to draw (Polygon, LineString, Circle, etc)
     * @param {TypeFeatureStyle} styles - The styles for the drawing
     */
    initDrawInteractions(geomGroupKey: string, type: string, style: TypeFeatureStyle): Draw;
    /**
     * Initializes modifying interactions on the given vector source
     * @param {string} geomGroupKey - The geometry group key in which to hold the geometries
     */
    initModifyInteractions(geomGroupKey: string): Modify;
    /**
     * Initializes snapping interactions on the given vector source
     * @param {string} geomGroupKey - The geometry group key in which to hold the geometries
     */
    initSnapInteractions(geomGroupKey: string): Snap;
    /**
     * Gets if north is visible. This is not a perfect solution and is more a work around
     *
     * @returns {boolean} true if visible, false otherwise
     */
    getNorthVisibility(): boolean;
    /**
     * Get north arrow bearing. Angle use to rotate north arrow for non Web Mercator projection
     * https://www.movable-type.co.uk/scripts/latlong.html
     *
     * @returns {string} the arrow angle
     */
    getNorthArrowAngle(): string;
    /**
     * Transforms coordinate from LngLat to the current projection of the map.
     * @param {Coordinate} coordinate - The LngLat coordinate
     * @returns {Coordinate} The coordinate in the map projection
     */
    convertCoordinateLngLatToMapProj(coordinate: Coordinate): Coordinate;
    /**
     * Transforms coordinate from current projection of the map to LngLat.
     * @param {Coordinate} coordinate - The coordinate in map projection
     * @returns {Coordinate} The coordinate in LngLat
     */
    convertCoordinateMapProjToLngLat(coordinate: Coordinate): Coordinate;
    /**
     * Transforms extent from LngLat to the current projection of the map.
     * @param {Extent} extent - The LngLat extent
     * @returns {Extent} The extent in the map projection
     */
    convertExtentLngLatToMapProj(extent: Extent): Extent;
    /**
     * Transforms extent from current projection of the map to LngLat.
     * @param {Extent} extent - The extent in map projection
     * @returns {Extent} The extent in LngLat
     */
    convertExtentMapProjToLngLat(extent: Extent): Extent;
    /**
     * Transforms coordinate from given projection to the current projection of the map.
     * @param {Coordinate} coordinate - The given coordinate
     * @param {ProjectionLike} fromProj - The projection of the given coordinate
     * @returns {Coordinate} The coordinate in the map projection
     */
    convertCoordinateFromProjToMapProj(coordinate: Coordinate, fromProj: ProjectionLike): Coordinate;
    /**
     * Transforms coordinate from map projection to given projection.
     * @param {Coordinate} coordinate - The given coordinate
     * @param {ProjectionLike} toProj - The projection that should be output
     * @returns {Coordinate} The coordinate in the map projection
     */
    convertCoordinateFromMapProjToProj(coordinate: Coordinate, toProj: ProjectionLike): Coordinate;
    /**
     * Transforms extent from given projection to the current projection of the map.
     * @param {Extent} extent - The given extent
     * @param {ProjectionLike} fromProj - The projection of the given extent
     * @returns {Extent} The extent in the map projection
     */
    convertExtentFromProjToMapProj(extent: Extent, fromProj: ProjectionLike): Extent;
    /**
     * Transforms extent from map projection to given projection. If the projects are the same, the extent is simply returned.
     * @param {Extent} extent - The given extent
     * @param {ProjectionLike} toProj - The projection that should be output
     * @returns {Extent} The extent in the map projection
     */
    convertExtentFromMapProjToProj(extent: Extent, toProj: ProjectionLike): Extent;
    /**
     * Creates a map config based on current map state.
     * @returns {TypeMapFeaturesConfig | undefined} Map config with current map state.
     */
    createMapConfigFromMapState(): TypeMapFeaturesConfig | undefined;
    /**
     * Registers a map init event callback.
     * @param {MapInitDelegate} callback - The callback to be executed whenever the event is emitted
     */
    onMapInit(callback: MapInitDelegate): void;
    /**
     * Unregisters a map init event callback.
     * @param {MapInitDelegate} callback - The callback to stop being called whenever the event is emitted
     */
    offMapInit(callback: MapInitDelegate): void;
    /**
     * Registers a map ready event callback.
     * @param {MapReadyDelegate} callback - The callback to be executed whenever the event is emitted
     */
    onMapReady(callback: MapReadyDelegate): void;
    /**
     * Unregisters a map ready event callback.
     * @param {MapReadyDelegate} callback - The callback to stop being called whenever the event is emitted
     */
    offMapReady(callback: MapReadyDelegate): void;
    /**
     * Registers a map layers processed event callback.
     * @param {MapLayersProcessedDelegate} callback - The callback to be executed whenever the event is emitted
     */
    onMapLayersProcessed(callback: MapLayersProcessedDelegate): void;
    /**
     * Unregisters a map layers processed event callback.
     * @param {MapLayersProcessedDelegate} callback - The callback to stop being called whenever the event is emitted
     */
    offMapLayersProcessed(callback: MapLayersProcessedDelegate): void;
    /**
     * Registers a map layers loaded event callback.
     * @param {MapLayersLoadedDelegate} callback - The callback to be executed whenever the event is emitted
     */
    onMapLayersLoaded(callback: MapLayersLoadedDelegate): void;
    /**
     * Unregisters a map layers loaded event callback.
     * @param {MapLayersLoadedDelegate} callback - The callback to stop being called whenever the event is emitted
     */
    offMapLayersLoaded(callback: MapLayersLoadedDelegate): void;
    /**
     * Registers a map move end event callback.
     * @param {MapMoveEndDelegate} callback - The callback to be executed whenever the event is emitted
     */
    onMapMoveEnd(callback: MapMoveEndDelegate): void;
    /**
     * Unregisters a map move end event callback.
     * @param {MapMoveEndDelegate} callback - The callback to stop being called whenever the event is emitted
     */
    offMapMoveEnd(callback: MapMoveEndDelegate): void;
    /**
     * Registers a map pointer move event callback.
     * @param {MapPointerMoveDelegate} callback - The callback to be executed whenever the event is emitted
     */
    onMapPointerMove(callback: MapPointerMoveDelegate): void;
    /**
     * Unregisters a map pointer move event callback.
     * @param {MapPointerMoveDelegate} callback - The callback to stop being called whenever the event is emitted
     */
    offMapPointerMove(callback: MapPointerMoveDelegate): void;
    /**
     * Registers a map single click event callback.
     * @param {MapSingleClickDelegate} callback - The callback to be executed whenever the event is emitted
     */
    onMapSingleClick(callback: MapSingleClickDelegate): void;
    /**
     * Unregisters a map single click end event callback.
     * @param {MapSingleClickDelegate} callback - The callback to stop being called whenever the event is emitted
     */
    offMapSingleClick(callback: MapSingleClickDelegate): void;
    /**
     * Registers a map zoom end event callback.
     * @param {MapZoomEndDelegate} callback - The callback to be executed whenever the event is emitted
     */
    onMapZoomEnd(callback: MapZoomEndDelegate): void;
    /**
     * Unregisters a map zoom end event callback.
     * @param {MapZoomEndDelegate} callback - The callback to stop being called whenever the event is emitted
     */
    offMapZoomEnd(callback: MapZoomEndDelegate): void;
    /**
     * Registers a map rotation event callback.
     * @param {MapRotationDelegate} callback - The callback to be executed whenever the event is emitted
     */
    onMapRotation(callback: MapRotationDelegate): void;
    /**
     * Unregisters a map rotation event callback.
     * @param {MapRotationDelegate} callback - The callback to stop being called whenever the event is emitted
     */
    offMapRotation(callback: MapRotationDelegate): void;
    /**
     * Registers a map change size event callback.
     * @param {MapChangeSizeDelegate} callback - The callback to be executed whenever the event is emitted
     */
    onMapChangeSize(callback: MapChangeSizeDelegate): void;
    /**
     * Unregisters a map change size event callback.
     * @param {MapChangeSizeDelegate} callback - The callback to stop being called whenever the event is emitted
     */
    offMapChangeSize(callback: MapChangeSizeDelegate): void;
    /**
     * Registers a component added event callback.
     * @param {MapComponentAddedDelegate} callback - The callback to be executed whenever the event is emitted
     */
    onMapComponentAdded(callback: MapComponentAddedDelegate): void;
    /**
     * Unregisters a component added event callback.
     * @param {MapComponentAddedDelegate} callback - The callback to stop being called whenever the event is emitted
     */
    offMapComponentAdded(callback: MapComponentAddedDelegate): void;
    /**
     * Registers a component removed event callback.
     * @param {MapComponentRemovedDelegate} callback - The callback to be executed whenever the event is emitted
     */
    onMapComponentRemoved(callback: MapComponentRemovedDelegate): void;
    /**
     * Unregisters a component removed event callback.
     * @param {MapComponentRemovedDelegate} callback - The callback to stop being called whenever the event is emitted
     */
    offMapComponentRemoved(callback: MapComponentRemovedDelegate): void;
    /**
     * Registers a component removed event callback.
     * @param {MapComponentRemovedDelegate} callback - The callback to be executed whenever the event is emitted
     */
    onMapLanguageChanged(callback: MapLanguageChangedDelegate): void;
    /**
     * Unregisters a component removed event callback.
     * @param {MapComponentRemovedDelegate} callback - The callback to stop being called whenever the event is emitted
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
    singleClickedPosition: TypeMapMouseInfo;
    pointerPosition: TypeMapMouseInfo;
};
/**
 * Type used to define the map mouse information
 * */
export type TypeMapMouseInfo = {
    lnglat: Coordinate;
    pixel: Coordinate;
    projected: Coordinate;
    dragging: boolean;
};
/**
 * Define a delegate for the event handler function signature
 */
type MapInitDelegate = EventDelegateBase<MapViewer, undefined, void>;
/**
 * Define a delegate for the event handler function signature
 */
type MapReadyDelegate = EventDelegateBase<MapViewer, undefined, void>;
/**
 * Define a delegate for the event handler function signature
 */
type MapLayersProcessedDelegate = EventDelegateBase<MapViewer, undefined, void>;
/**
 * Define a delegate for the event handler function signature
 */
type MapLayersLoadedDelegate = EventDelegateBase<MapViewer, undefined, void>;
/**
 * Define an event for the delegate
 */
export type MapMoveEndEvent = {
    lnglat: Coordinate;
};
/**
 * Define a delegate for the event handler function signature
 */
type MapMoveEndDelegate = EventDelegateBase<MapViewer, MapMoveEndEvent, void>;
/**
 * Define an event for the delegate
 */
export type MapPointerMoveEvent = TypeMapMouseInfo;
/**
 * Define a delegate for the event handler function signature
 */
type MapPointerMoveDelegate = EventDelegateBase<MapViewer, MapPointerMoveEvent, void>;
/**
 * Define an event for the delegate
 */
export type MapSingleClickEvent = TypeMapMouseInfo;
/**
 * Define a delegate for the event handler function signature
 */
type MapSingleClickDelegate = EventDelegateBase<MapViewer, MapSingleClickEvent, void>;
/**
 * Define an event for the delegate
 */
export type MapZoomEndEvent = {
    zoom: number;
};
/**
 * Define a delegate for the event handler function signature
 */
type MapZoomEndDelegate = EventDelegateBase<MapViewer, MapZoomEndEvent, void>;
/**
 * Define an event for the delegate
 */
export type MapRotationEvent = {
    rotation: number;
};
/**
 * Define a delegate for the event handler function signature
 */
type MapRotationDelegate = EventDelegateBase<MapViewer, MapRotationEvent, void>;
/**
 * Define an event for the delegate
 */
export type MapChangeSizeEvent = {
    size: [number, number];
};
/**
 * Define a delegate for the event handler function signature
 */
type MapChangeSizeDelegate = EventDelegateBase<MapViewer, MapChangeSizeEvent, void>;
/**
 * Define an event for the delegate
 */
export type MapComponentAddedEvent = {
    mapComponentId: string;
    component: JSX.Element;
};
/**
 * Define a delegate for the event handler function signature
 */
type MapComponentAddedDelegate = EventDelegateBase<MapViewer, MapComponentAddedEvent, void>;
/**
 * Define an event for the delegate
 */
export type MapComponentRemovedEvent = {
    mapComponentId: string;
};
/**
 * Define a delegate for the event handler function signature
 */
type MapComponentRemovedDelegate = EventDelegateBase<MapViewer, MapComponentRemovedEvent, void>;
/**
 * Define an event for the delegate
 */
export type MapLanguageChangedEvent = {
    language: TypeDisplayLanguage;
};
/**
 * Define a delegate for the event handler function signature
 */
type MapLanguageChangedDelegate = EventDelegateBase<MapViewer, MapLanguageChangedEvent, void>;
export {};
