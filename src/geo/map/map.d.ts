/// <reference types="react" />
import { i18n } from 'i18next';
import OLMap from 'ol/Map';
import View, { FitOptions } from 'ol/View';
import { ProjectionLike } from 'ol/proj';
import { Coordinate } from 'ol/coordinate';
import { Extent } from 'ol/extent';
import { Basemap } from '@/geo/layer/basemap/basemap';
import { Layer } from '@/geo/layer/layer';
import { TypeFeatureStyle } from '@/geo/layer/geometry/geometry-types';
import { AppbarButtons } from '@/core/components/app-bar/app-bar-buttons';
import { NavbarButtons } from '@/core/components/nav-bar/nav-bar-buttons';
import { FooterTabsApi } from '@/core/components/footer-tabs/footer-tabs-api';
import { NotificationsApi } from '@/core/components/notifications/notifications-api';
import { LegendApi } from '@/core/components/legend/legend-api';
import { Legend2Api } from '@/core/components/legend-2/legend-api';
import { DetailsAPI } from '@/core/components/details/details-api';
import { DetailsAPI as DetailsAPIFooter } from '@/core/components/details-1/details-api';
import { FeatureInfoAPI } from '@/core/components/feature-info/feature-info.api';
import { DataGridAPI } from '@/core/components/data-grid/data-grid-api';
import { DataTableApi } from '@/core/components/data-table/data-table-api';
import { GeoviewRenderer } from '@/geo/renderer/geoview-renderer';
import { Select } from '@/geo/interaction/select';
import { Draw } from '@/geo/interaction/draw';
import { Modify } from '@/geo/interaction/modify';
import { Snap } from '@/geo/interaction/snap';
import { Translate } from '@/geo/interaction/translate';
import { ModalApi } from '@/ui';
import { TypeMapMouseInfo } from '@/api/events/payloads';
import { TypeListOfGeoviewLayerConfig, TypeDisplayLanguage, TypeViewSettings } from '@/geo/map/map-schema-types';
import { TypeMapFeaturesConfig, TypeHTMLElement } from '@/core/types/global-types';
/**
 * Class used to manage created maps
 *
 * @exports
 * @class MapViewer
 */
export declare class MapViewer {
    createMapConfigHasRun: boolean;
    mapFeaturesConfig: TypeMapFeaturesConfig;
    mapId: string;
    map: OLMap;
    appBarButtons: AppbarButtons;
    navBarButtons: NavbarButtons;
    footerTabs: FooterTabsApi;
    notifications: NotificationsApi;
    legend: LegendApi;
    legend2: Legend2Api;
    details: DetailsAPI;
    detailsFooter: DetailsAPIFooter;
    featureInfo: FeatureInfoAPI;
    dataGrid: DataGridAPI;
    dataTable: DataTableApi;
    basemap: Basemap;
    layer: Layer;
    displayLanguage: TypeDisplayLanguage;
    currentProjection: number;
    currentZoom: number;
    mapCenterCoordinates: Coordinate;
    singleClickedPosition: TypeMapMouseInfo;
    pointerPosition: TypeMapMouseInfo;
    i18nInstance: i18n;
    modal: ModalApi;
    geoviewRenderer: GeoviewRenderer;
    readyCallbackHasRun: boolean;
    /**
     * Add the map instance to the maps array in the api
     *
     * @param {TypeMapFeaturesConfig} mapFeaturesConfig map properties
     * @param {i18n} i18instance language instance
     */
    constructor(mapFeaturesConfig: TypeMapFeaturesConfig, i18instance: i18n);
    /**
     * Set the layer added event listener and timeout function for the list of geoview layer configurations.
     *
     * @param {TypeListOfGeoviewLayerConfig} listOfGeoviewLayerConfig The list of geoview layer configurations.
     */
    setLayerAddedListener4ThisListOfLayer(listOfGeoviewLayerConfig: TypeListOfGeoviewLayerConfig): void;
    /**
     * Method used to test all geoview layers ready flag to determine if a map is ready.
     *
     * @returns true if all geoview layers on the map are loaded or detected as a load error.
     */
    mapIsReady(): boolean;
    /**
     * Initialize layers, basemap and projection
     *
     * @param cgpMap
     */
    initMap(cgpMap: OLMap): void;
    /**
     * Check if geometries needs to be loaded from a URL geoms parameter
     */
    loadGeometries(): void;
    /**
     * Add a new custom component to the map
     *
     * @param {string} mapComponentId an id to the new component
     * @param {JSX.Element} component the component to add
     */
    addComponent(mapComponentId: string, component: JSX.Element): void;
    /**
     * Remove an existing custom component from the map
     *
     * @param imapComponentIdd the id of the component to remove
     */
    removeComponent(mapComponentId: string): void;
    /**
     * Toggle fullscreen / exit fullscreen function
     *
     * @param status toggle fullscreen or exit fullscreen status
     * @param {HTMLElement} element the element to toggle fullscreen on
     */
    toggleFullscreen(status: boolean, element: TypeHTMLElement): void;
    /**
     * Update the map viewSettings
     *
     * @param {TypeMapView} mapView map viewSettings object
     */
    setView(mapView: TypeViewSettings): void;
    /**
     * Get the map viewSettings
     *
     * @returns the map viewSettings
     */
    getView(): View;
    /**
     * Zoom to the specified extent.
     *
     * @param {Extent} extent The extent to zoom to.
     * @param {FitOptions} options The options to configure the zoomToExtent (default: { padding: [100, 100, 100, 100], maxZoom: 11 }).
     */
    zoomToExtent(extent: Extent, options?: FitOptions): void;
    /**
     * Function called when the map has been rendered and ready to be customized
     */
    mapReady(): void;
    /**
     * Change the display language of the map
     *
     * @param {TypeDisplayLanguage} displayLanguage the language to use (en, fr)
     * @param {TypeListOfGeoviewLayerConfig} listOfGeoviewLayerConfig optional new set of layers to apply (will override original set of layers)
     */
    changeLanguage(displayLanguage: TypeDisplayLanguage, listOfGeoviewLayerConfig?: TypeListOfGeoviewLayerConfig): void;
    /**
     * Reload a map from a config object
     *
     * @param {TypeMapFeaturesConfig} mapFeaturesConfig a new config passed in from the function call
     */
    reloadMap(mapFeaturesConfig: TypeMapFeaturesConfig): void;
    /**
     * Create a new config for this map element, validate an load it
     *
     * @param {string} mapConfig a new config passed in from the function call
     */
    loadMapFromJsonStringConfig(mapConfig: string): void;
    /**
     * Set map to either dynamic or static
     *
     * @param {string} interaction map interaction
     */
    toggleMapInteraction(interaction: string): void;
    /**
     * Fit the map to its boundaries. It is assumed that the boundaries use the map projection. If projectionCode is undefined,
     * the boundaries are used as is, otherwise they are reprojected from the specified projection code to the map projection.
     *
     * @param {Extent} bounds bounding box to zoom to
     * @param {string | number | undefined} projectionCode Optional projection code used by the bounds.
     * @returns the bounds
     */
    fitBounds(bounds?: Extent, projectionCode?: string | number | undefined): void;
    /**
     * Transforms an extent from source projection to destination projection. This returns a new extent (and does not modify the
     * original).
     *
     * @param {Extent} extent The extent to transform.
     * @param {ProjectionLike} source Source projection-like.
     * @param {ProjectionLike} destination Destination projection-like.
     * @param {number} stops Optional number of stops per side used for the transform. By default only the corners are used.
     *
     * @returns The new extent transformed in the destination projection.
     */
    transformExtent(extent: Extent, source: ProjectionLike, destination: ProjectionLike, stops?: number | undefined): Extent;
    /**
     * Transforms an extent from source projection to destination projection. This returns a new extent (and does not modify the
     * original).
     *
     * @param {Extent} extent The extent to transform.
     * @param {ProjectionLike} source Source projection-like.
     * @param {ProjectionLike} destination Destination projection-like.
     * @param {number} stops Optional number of stops per side used for the transform. The default value is 20.
     *
     * @returns The densified extent transformed in the destination projection.
     */
    transformAndDensifyExtent(extent: Extent, source: ProjectionLike, destination: ProjectionLike, stops?: number): Coordinate[];
    /**
     * Initializes selection interactions
     */
    initSelectInteractions(): Select;
    /**
     * Initializes translation interactions
     */
    initTranslateInteractions(): Translate;
    /**
     * Initializes drawing interactions on the given vector source
     * @param geomGroupKey the geometry group key in which to hold the geometries
     * @param type the type of geometry to draw (Polygon, LineString, Circle, etc)
     * @param styles the styles for the drawing
     */
    initDrawInteractions(geomGroupKey: string, type: string, style: TypeFeatureStyle): Draw;
    /**
     * Initializes modifying interactions on the given vector source
     * @param geomGroupKey the geometry group key in which to hold the geometries
     */
    initModifyInteractions(geomGroupKey: string): Modify;
    /**
     * Initializes snapping interactions on the given vector source
     * @param geomGroupKey the geometry group key in which to hold the geometries
     */
    initSnapInteractions(geomGroupKey: string): Snap;
}
