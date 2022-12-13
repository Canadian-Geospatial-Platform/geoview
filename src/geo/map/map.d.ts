/// <reference types="node" />
/// <reference types="react" />
import { i18n } from 'i18next';
import OLMap from 'ol/Map';
import View from 'ol/View';
import { Coordinate } from 'ol/coordinate';
import { Extent } from 'ol/extent';
import { Basemap } from '../layer/basemap/basemap';
import { Layer } from '../layer/layer';
import { AppbarButtons } from '../../core/components/app-bar/app-bar-buttons';
import { NavbarButtons } from '../../core/components/nav-bar/nav-bar-buttons';
import { FooterTabsApi } from '../../core/components/footer-tabs/footer-tabs-api';
import { LegendApi } from '../../core/components/legend/legend-api';
import { DetailsAPI } from '../../core/components/details/details-api';
import { DataGridAPI } from '../../core/components/data-grid/data-grid-api';
import { GeoviewRenderer } from '../renderer/geoview-renderer';
import { ModalApi } from '../../ui';
import { TypeListOfGeoviewLayerConfig, TypeDisplayLanguage, TypeViewSettings } from './map-schema-types';
import { TypeMapFeaturesConfig, TypeHTMLElement } from '../../core/types/global-types';
import { TypeMapSingleClick } from '../../api/events/payloads/map-slingle-click-payload';
/**
 * Class used to manage created maps
 *
 * @exports
 * @class MapViewer
 */
export declare class MapViewer {
    mapFeaturesConfig: TypeMapFeaturesConfig;
    mapId: string;
    map: OLMap;
    appBarButtons: AppbarButtons;
    navBarButtons: NavbarButtons;
    footerTabs: FooterTabsApi;
    legend: LegendApi;
    details: DetailsAPI;
    dataGrid: DataGridAPI;
    basemap: Basemap;
    layer: Layer;
    displayLanguage: TypeDisplayLanguage;
    currentProjection: number;
    currentZoom: number;
    currentPosition: Coordinate;
    singleClickedPosition: TypeMapSingleClick;
    i18nInstance: i18n;
    modal: ModalApi;
    geoviewRenderer: GeoviewRenderer;
    remainingLayersThatNeedToBeLoaded: number;
    readyCallbackHasRun: boolean;
    layerLoadedTimeoutId: Record<string, NodeJS.Timeout>;
    /**
     * Add the map instance to the maps array in the api
     *
     * @param {TypeMapFeaturesConfig} mapFeaturesConfig map properties
     * @param {i18n} i18instance language instance
     */
    constructor(mapFeaturesConfig: TypeMapFeaturesConfig, i18instance: i18n);
    /**
     * Utility function used to decrement the remainingLayersThatNeedToBeLoaded property, preventing it to become less that zero.
     * The methode returns true when the zero value is reached for the first time.
     *
     * @returns true when the zero value is reached for the first time.
     */
    private remainingLayersThatNeedToBeLoadedIsDecrementedToZero4TheFirstTime;
    /**
     * Set the layer added event listener and timeout function for the list of geoview layer configurations.
     *
     * @param {TypeListOfGeoviewLayerConfig} listOfGeoviewLayerConfig The list of geoview layer configurations.
     */
    setEventListenerAndTimeout4ThisListOfLayer(listOfGeoviewLayerConfig: TypeListOfGeoviewLayerConfig): void;
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
    addComponent: (mapComponentId: string, component: JSX.Element) => void;
    /**
     * Remove an existing custom component from the map
     *
     * @param imapComponentIdd the id of the component to remove
     */
    removeComponent: (mapComponentId: string) => void;
    /**
     * Toggle fullscreen / exit fullscreen function
     *
     * @param status toggle fullscreen or exit fullscreen status
     * @param {HTMLElement} element the element to toggle fullscreen on
     */
    toggleFullscreen: (status: boolean, element: TypeHTMLElement) => void;
    /**
     * Update the map viewSettings
     *
     * @param {TypeMapView} mapView map viewSettings object
     */
    setView: (mapView: TypeViewSettings) => void;
    /**
     * Get the map viewSettings
     *
     * @returns the map viewSettings
     */
    getView: () => View;
    /**
     * Function called when the map has been rendered and ready to be customized
     */
    mapReady: () => void;
    /**
     * Change the display language of the map
     *
     * @param {TypeDisplayLanguage} displayLanguage the language to use (en, fr)
     * @param {TypeListOfGeoviewLayerConfig} geoviewLayerConfi optional new set of layers to apply (will override origional set of layers)
     */
    changeLanguage: (displayLanguage: TypeDisplayLanguage, listOfGeoviewLayerConfig?: TypeListOfGeoviewLayerConfig) => void;
    /**
     * Load a new map config from a function call
     *
     * @param {string} mapConfig a new config passed in from the function call
     */
    loadMapConfig: (mapConfig: string) => void;
    /**
     * Set map to either dynamic or static
     *
     * @param {string} interaction map interaction
     */
    toggleMapInteraction: (interaction: string) => void;
    /**
     * Fit the map to its boundaries. It is assumed that the boundaries use the map projection. If projectionCode is undefined,
     * the boundaries are used as is, otherwise they are reprojected from the specified projection code to the map projection.
     *
     * @param {Extent} bounds map bounds
     * @param {string | number | undefined} projectionCode Optional projection code used by the bounds.
     * @returns the bounds
     */
    fitBounds: (bounds: Extent, projectionCode?: string | number | undefined) => void;
}
