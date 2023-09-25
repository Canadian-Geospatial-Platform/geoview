import { Extent } from 'ol/extent';
import { TypeJsonObject } from '@/core/types/global-types';
import { TypeBasemapProps, TypeBasemapOptions, TypeBasemapLayer } from '@/geo/layer/basemap/basemap-types';
import { TypeDisplayLanguage, TypeValidMapProjectionCodes } from '@/geo/map/map-schema-types';
/**
 * A class to get a Basemap for a define projection and language. For the moment, a list maps are available and
 * can be filtered by projection (currently only WM and LCC projections are listed,
 * in case other projections needed, they need to be added to the list)
 *
 * @exports
 * @class Basemap
 */
export declare class Basemap {
    #private;
    basemaps: TypeBasemapProps[];
    activeBasemap?: TypeBasemapProps;
    defaultOrigin?: number[];
    defaultResolutions?: number[];
    defaultExtent?: Extent;
    overviewMap?: TypeBasemapProps;
    attribution: string;
    displayLanguage: TypeDisplayLanguage;
    basemapOptions: TypeBasemapOptions;
    private projection;
    /**
     * initialize basemap
     *
     * @param {TypeBasemapOptions} basemapOptions optional basemap option properties, passed in from map config
     * @param {TypeDisplayLanguage} displayLanguage language to be used, either en or fr
     * @param {TypeValidMapProjectionCodes} projection projection number
     * @param {string} mapId the map id
     */
    constructor(basemapOptions: TypeBasemapOptions, displayLanguage: TypeDisplayLanguage, projection: TypeValidMapProjectionCodes, mapId: string);
    /**
     * basemap list
     */
    basemapsList: TypeJsonObject;
    /**
     * attribution to add the map
     */
    private attributionVal;
    /**
     * Get projection from basemap url
     * Because OpenLayers can reproject on the fly raster, some like Shaded and Simple even if only available in 3978
     * can be use in 3857. For this we need to make a difference between map projection and url use for the basemap
     *
     * @param {string} url basemap url
     * @returns {number} projection code
     */
    private getProjectionFromUrl;
    /**
     * Get basemap thumbnail url
     *
     * @param {string[]} basemapTypes basemap layer type (shaded, transport, label, simple)
     * @param {TypeValidMapProjectionCodes} projection basemap projection
     * @param {TypeDisplayLanguage} displayLanguage basemap language
     *
     * @returns {string[]} array of thumbnail urls
     */
    private getThumbnailUrl;
    /**
     * Get basemap information (name and description)
     *
     * @param {string[]} basemapTypes basemap layer type (shaded, transport, label, simple)
     * @param {TypeDisplayLanguage} displayLanguage basemap language
     * @returns {string} array with information [name, description]
     */
    private getInfo;
    /**
     * Check if the type of basemap already exist
     *
     * @param {string} type basemap type
     * @returns {boolean} true if basemap exist, false otherwise
     */
    isExisting(type: string): boolean;
    /**
     * Create a basemap layer
     *
     * @param {string} basemapId the id of the layer
     * @param {TypeJsonObject} basemapLayer the basemap layer url and json url
     * @param {number} opacity the opacity to use for this layer
     * @param {boolean} rest should we do a get request to get the info from the server
     * @returns {TypeBasemapLayer} return the created basemap layer
     */
    createBasemapLayer(basemapId: string, basemapLayer: TypeJsonObject, opacity: number, rest: boolean): Promise<TypeBasemapLayer>;
    /**
     * Create the core basemap and add the layers to it
     *
     * @param {TypeBasemapOptions} basemapOptions basemap options
     */
    createCoreBasemap(basemapOptions: TypeBasemapOptions, projection?: number): Promise<TypeBasemapProps | undefined>;
    /**
     * Create a custom basemap
     *
     * @param {TypeBasemapProps} basemapProps basemap properties
     * @returns {TypeBasemapProps} the created custom basemap
     */
    createCustomBasemap(basemapProps: TypeBasemapProps): TypeBasemapProps;
    /**
     * Load the default basemap that was passed in the map config
     *
     * @returns {TypeBasemapProps | undefined} the default basemap
     */
    loadDefaultBasemaps(): Promise<TypeBasemapProps | undefined>;
    /**
     * Create a new basemap
     *
     * @param {TypeBasemapProps} basemapProps basemap properties
     */
    private createBasemap;
    /**
     * Set the current basemap and update the basemap layers on the map
     *
     * @param {string} basemapId the id of the basemap
     */
    setBasemap(basemapId: string): void;
}
