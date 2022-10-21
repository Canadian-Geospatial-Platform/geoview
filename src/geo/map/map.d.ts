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
    /**
     * Add the map instance to the maps array in the api
     *
     * @param {TypeMapFeaturesConfig} mapFeaturesConfig map properties
     * @param {i18n} i18instance language instance
     */
    constructor(mapFeaturesConfig: TypeMapFeaturesConfig, i18instance: i18n);
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
     * Return the language code prefix from localized language
     *
     * @returns {TypeDisplayLanguage} returns the language code prefix from localized language. Ex: en, fr
     */
    getLanguageCodePrefix: () => TypeDisplayLanguage;
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
     * Create bounds on map
     *
     * @param {Extent} bounds map bounds
     * @returns the bounds
     */
    fitBounds: (bounds: Extent) => void;
}
