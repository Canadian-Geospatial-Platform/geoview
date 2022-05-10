import { AxiosResponse } from 'axios';
import { TypeMapSchemaProps, TypeMapConfigProps, TypeJsonObject, TypeLayerConfig } from '../types/cgpv-types';
export declare const catalogUrl = "https://maps.canada.ca/geonetwork/srv/api/v2/docs";
/**
 * Class to handle configuration validation. Will validate every item for structure and valid values. If error found, will replace by default values
 * and sent a message in the console for developers to know something went wrong
 *
 * @exports
 * @class
 */
export declare class Config {
    private id;
    private mapElement;
    private language;
    private defaultLanguage;
    private _config;
    private _projections;
    private _basemapId;
    private _basemapShaded;
    private _basemaplabeled;
    private _center;
    private _languages;
    /**
     * Get map configuration object
     */
    get configuration(): TypeMapSchemaProps;
    /**
     * Create the validation object
     * @param {Element} mapElement the map element
     */
    constructor(mapElement: Element);
    /**
     * Generate layer configs from uuid request result
     *
     * @param {TypeJsonObject} result the uuid request result
     * @returns {TypeLayerConfig[]} layers parsed from uuid result
     */
    static getLayerConfigFromUUID: (result: AxiosResponse<TypeJsonObject>) => TypeLayerConfig[];
    /**
     * Get map config from url parameters
     *
     * @returns {TypeMapSchemaProps | undefined} a config object generated from url parameters
     */
    private getUrlParamsConfig;
    /**
     * Get the config object from inline map element div
     *
     * @returns {TypeMapSchemaProps | undefined} the generated config object from inline map element
     */
    private getInlintDivConfig;
    /**
     * Get the config object from json file
     *
     * @returns {TypeMapSchemaProps | undefined} the generated config object from json file
     */
    private getJsonFileConfig;
    /**
     * Get map config from a function call
     *
     * @param {TypeMapSchemaProps} configObj config object passed in the function
     * @returns {TypeMapConfigProps} a valid map config
     */
    getMapConfigFromFunc(configObj: TypeMapSchemaProps): TypeMapConfigProps | undefined;
    /**
     * Initialize a map config from either inline div, url params, json file
     *
     * @returns {TypeMapConfigProps} the initialized valid map config
     */
    initializeMapConfig(): Promise<TypeMapConfigProps | undefined>;
    /**
     * Parse the search parameters passed from a url
     *
     * @param {string} configParams a search string passed from the url "?..."
     * @returns {Object} object containing the parsed params
     */
    private getMapPropsFromUrlParams;
    /**
     * Get url parameters from url param search string
     *
     * @param {objStr} objStr the url parameters string
     * @returns {TypeJsonObject} an object containing url parameters
     */
    private parseObjectFromUrl;
    /**
     * Validate the configuration file
     * @param {TypeMapSchemaProps} config configuration object to validate
     * @returns {TypeMapSchemaProps} valid JSON configuration object
     */
    private validate;
    /**
     * Log modifications made to configuration by the validator
     * @param {TypeMapSchemaProps} inConfig input config
     * @param {TypeMapSchemaProps} validConfig valid config
     */
    private logModifs;
    /**
     * Validate projection
     * @param {number} projection provided projection
     * @returns {number} valid projection
     */
    private validateProjection;
    /**
     * Validate basemap options
     * @param {number} projection valid projection
     * @param {TypeBasemapOptions} basemapOptions basemap options
     * @returns {TypeBasemapOptions} valid basemap options
     */
    private validateBasemap;
    /**
     * Validate the center
     * @param {number} projection valid projection
     * @param {LatLngTuple} center center of the map
     * @returns {LatLngTuple} valid center of the map
     */
    private validateCenter;
    /**
     * Validate zoom level
     * @param {number} zoom provided zoom level
     * @returns {number} valid zoom level
     */
    private validateZoom;
    /**
     * Validate map language
     * @param {string} language provided language
     * @returns {string} valid language
     */
    private validateLanguage;
}
