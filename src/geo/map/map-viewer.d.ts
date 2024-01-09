/// <reference types="react" />
import { Root } from 'react-dom/client';
import { i18n } from 'i18next';
import OLMap from 'ol/Map';
import View, { FitOptions } from 'ol/View';
import { Extent } from 'ol/extent';
import { Basemap } from '@/geo/layer/basemap/basemap';
import { Layer } from '@/geo/layer/layer';
import { TypeFeatureStyle } from '@/geo/layer/geometry/geometry-types';
import { TypeClickMarker } from '@/app';
import { TypeRecordOfPlugin } from '@/api/plugin/plugin-types';
import { AppbarButtons } from '@/core/components/app-bar/app-bar-buttons';
import { NavbarButtons } from '@/core/components/nav-bar/nav-bar-buttons';
import { FooterTabsApi } from '@/core/components/footer-tabs/footer-tabs-api';
import { LegendApi } from '@/core/components/legend/legend-api';
import { LayersApi } from '@/core/components/layers/layers-api';
import { DetailsApi } from '@/core/components/details/details-api';
import { DataTableApi } from '@/core/components/data-table/data-table-api';
import { GeoviewRenderer } from '@/geo/renderer/geoview-renderer';
import { Select } from '@/geo/interaction/select';
import { Draw } from '@/geo/interaction/draw';
import { Extent as ExtentInteraction } from '@/geo/interaction/extent';
import { Modify } from '@/geo/interaction/modify';
import { Snap } from '@/geo/interaction/snap';
import { Translate } from '@/geo/interaction/translate';
import { ModalApi } from '@/ui';
import { TypeListOfGeoviewLayerConfig, TypeDisplayLanguage, TypeViewSettings, TypeMapState, TypeDisplayTheme, TypeInteraction } from '@/geo/map/map-schema-types';
import { TypeMapFeaturesConfig, TypeHTMLElement, TypeValidMapProjectionCodes, TypeJsonObject } from '@/core/types/global-types';
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
    plugins: TypeRecordOfPlugin;
    overviewRoot: Root | undefined;
    appBarButtons: AppbarButtons;
    navBarButtons: NavbarButtons;
    footerTabs: FooterTabsApi;
    legend: LegendApi;
    layers: LayersApi;
    details: DetailsApi;
    dataTable: DataTableApi;
    basemap: Basemap;
    layer: Layer;
    modal: ModalApi;
    geoviewRenderer: GeoviewRenderer;
    readyCallbackHasRun: boolean;
    private i18nInstance;
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
     * Function called when the map has been rendered and ready to be customized
     */
    mapReady(): void;
    /**
     * Initialize layers, basemap and projection
     *
     * @param cgpMap
     */
    initMap(cgpMap: OLMap): void;
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
     * Add a localization ressource bundle for a supported language (fr, en). Then the new key added can be
     * access from the utilies function getLocalizesMessage to reuse in ui from outside the core viewer.
     *
     * @param {TypeDisplayLanguage} language the language to add the ressoruce for (en, fr)
     * @param {TypeJsonObject} translations the translation object to add
     */
    addLocalizeRessourceBundle(language: TypeDisplayLanguage, translations: TypeJsonObject): void;
    /**
     * Return the current display language
     *
     * @returns {TypeDisplayLanguage} The display language
     */
    getDisplayLanguage(): TypeDisplayLanguage;
    /**
     * Return the current display theme
     *
     * @returns {TypeDisplayTheme} The display theme
     */
    getDisplayTheme(): TypeDisplayTheme;
    /**
     * Return the map current state information
     *
     * @returns {TypeMapState} The map state
     */
    getMapState(): TypeMapState;
    /**
     * Get the map viewSettings
     *
     * @returns the map viewSettings
     */
    getView(): View;
    /**
     * set fullscreen / exit fullscreen
     *
     * @param status toggle fullscreen or exit fullscreen status
     * @param {HTMLElement} element the element to toggle fullscreen on
     */
    setFullscreen(status: boolean, element: TypeHTMLElement): void;
    /**
     * Set map to either dynamic or static
     *
     * @param {TypeInteraction} interaction map interaction
     */
    setInteraction(interaction: TypeInteraction): void;
    /**
     * Set the display language of the map
     *
     * @param {TypeDisplayLanguage} displayLanguage the language to use (en, fr)
     * @param {boolean} resetLayer optional flag to ask viewer to reload layers with the new localize language
     */
    setLanguage(displayLanguage: TypeDisplayLanguage, resetLayer?: boolean | false): void;
    /**
     * Set the display projection of the map
     *
     * @param {TypeValidMapProjectionCodes} projectionCode the projection code (3978, 3857)
     */
    setProjection(projectionCode: TypeValidMapProjectionCodes): void;
    /**
     * Set the display theme of the map
     *
     * @param {TypeDisplayTheme} displayTheme the theme to use (geo.ca, light, dark)
     */
    setTheme(displayTheme: TypeDisplayTheme): void;
    /**
     * Set the map viewSettings
     *
     * @param {TypeMapView} mapView map viewSettings object
     */
    setView(mapView: TypeViewSettings): void;
    /**
     * Loop trought all geoview layeres and refresh source. Use this function on projection change or other
     * viewer modification who may affect rendering
     */
    refreshLayers(): void;
    /**
     * Hide a click marker from the map
     */
    clickMarkerIconHide(): void;
    /**
     * Show a marker on the map
     * @param {TypeClickMarker} marker the marker to add
     */
    clickMarkerIconShow(marker: TypeClickMarker): void;
    /**
     * Check if geometries needs to be loaded from a URL geoms parameter
     */
    loadGeometries(): void;
    /**
     * Remove map
     *
     * @param {boolean} deleteContainer true if we want to delete div from the page
     * @returns {HTMLElement} return the HTML element
     */
    remove(deleteContainer: boolean): HTMLElement;
    /**
     * Reload a map from a config object stored in store
     */
    reload(): void;
    /**
     * Zoom to the specified extent.
     *
     * @param {Extent} extent The extent to zoom to.
     * @param {FitOptions} options The options to configure the zoomToExtent (default: { padding: [100, 100, 100, 100], maxZoom: 11 }).
     */
    zoomToExtent(extent: Extent, options?: FitOptions): void;
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
