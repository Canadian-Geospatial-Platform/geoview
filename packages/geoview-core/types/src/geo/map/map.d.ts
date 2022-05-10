/// <reference types="react" />
import { i18n } from 'i18next';
import { LatLng, LatLngBounds } from 'leaflet';
import { Basemap } from '../layer/basemap/basemap';
import { Layer } from '../layer/layer';
import { MapProjection } from '../projection/map-projection';
import '../../core/types/cgp-leaflet-config';
import { TypeMapConfigProps, TypeLayerConfig, TypeLanguages, TypeLocalizedLanguages, TypeMapSchemaProps } from '../../core/types/cgpv-types';
import { AppbarButtons } from '../../core/components/appbar/app-bar-buttons';
import { NavbarButtons } from '../../core/components/navbar/nav-bar-buttons';
import { ModalApi } from '../../ui';
/**
 * Class used to manage created maps
 *
 * @export
 * @class MapViewer
 */
export declare class MapViewer {
    mapProps: TypeMapConfigProps;
    id: string;
    map: L.Map;
    appBarButtons: AppbarButtons;
    navBarButtons: NavbarButtons;
    basemap: Basemap;
    layer: Layer;
    language: TypeLocalizedLanguages;
    currentProjection: number;
    currentZoom: number;
    currentPosition: LatLng;
    projection: MapProjection;
    i18nInstance: i18n;
    modal: ModalApi;
    /**
     * Add the map instance to the maps array in the api
     *
     * @param {TypeMapConfigProps} mapProps map properties
     * @param {i18n} i18instance language instance
     */
    constructor(mapProps: TypeMapConfigProps, i18instance: i18n);
    /**
     * Initialize layers, basemap and projection
     *
     * @param cgpMap
     */
    initMap(cgpMap: L.Map): void;
    /**
     * Check if geometries needs to be loaded from a URL geoms parameter
     */
    loadGeometries(): void;
    /**
     * Add a new custom component to the map
     *
     * @param {string} id an id to the new component
     * @param {JSX.Element} component the component to add
     */
    addComponent: (id: string, component: JSX.Element) => void;
    /**
     * Remove an existing custom component from the map
     *
     * @param id the id of the component to remove
     */
    removeComponent: (id: string) => void;
    /**
     * Get map options configurations based on projection
     *
     * @param epsgCode projection number
     * @returns {L.MapOptions} the map options based on the projection
     */
    getMapOptions: (epsgCode: number) => L.MapOptions;
    /**
     * Toggles fullscreen for the app.
     *
     * @memberof MapInstance
     */
    toggleFullscreen: (element: HTMLElement) => void;
    /**
     * Function called when the map has been rendered and ready to be customized
     */
    mapReady: () => void;
    /**
     * Return the language code from localized language
     *
     * @returns {TypeLanguages} returns the language code from localized language. Ex: en, fr
     */
    getLanguageCode: () => TypeLanguages;
    /**
     * Change the language of the map
     *
     * @param {string} language the language to use (en-CA, fr-CA)
     * @param {TypeLayerConfig} layers optional new set of layers to apply (will override origional set of layers)
     */
    changeLanguage: (language: 'en-CA' | 'fr-CA', layers?: TypeLayerConfig[] | undefined) => void;
    /**
     * Load a new map config from a function call
     *
     * @param {TypeMapSchemaProps} mapConfig a new config passed in from the function call
     */
    loadMapConfig: (mapConfig: TypeMapSchemaProps) => void;
    /**
     * Set map to either dynamic or static
     *
     * @param {string} interaction map interaction
     */
    toggleMapInteraction: (interaction: string) => void;
    /**
     * Create bounds on map
     *
     * @param {LatLng.LatLngBounds} bounds map bounds
     * @returns the bounds
     */
    fitBounds: (bounds: L.LatLngBounds) => import("leaflet").Map;
}
