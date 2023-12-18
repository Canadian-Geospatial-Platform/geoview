import { Extent } from 'ol/extent';
import { XYZ } from 'ol/source';
import TileLayer from 'ol/layer/Tile';
import { TypeJsonObject } from '@/core/types/global-types';
import { TypeBasemapProps, TypeBasemapOptions } from '@/geo/layer/basemap/basemap-types';
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
    activeBasemap?: TypeBasemapProps;
    defaultOrigin?: number[];
    defaultResolutions?: number[];
    defaultExtent?: Extent;
    overviewMap?: TypeBasemapProps;
    basemapOptions: TypeBasemapOptions;
    mapId: string;
    /**
     * initialize basemap
     *
     * @param {TypeBasemapOptions} basemapOptions optional basemap option properties, passed in from map config
     * @param {string} mapId the map id
     */
    constructor(basemapOptions: TypeBasemapOptions, mapId: string);
    /**
     * basemap list
     */
    basemapsList: TypeJsonObject;
    /**
     * Get projection from basemap url
     * Because OpenLayers can reproject on the fly raster, some like Shaded and Simple even if only available in 3978
     * can be use in 3857. For this we need to make a difference between map projection and url use for the basemap
     *
     * @param {string} url basemap url
     * @returns {number} projection code
     */
    private getProjectionFromUrl;
    setOverviewMap(): Promise<void>;
    getOverviewMap(): TypeBasemapProps | undefined;
    /**
     * Create empty basemap tilelayer to use as initial basemap while we load basemap
     * so the viewer will not fails if basemap is not avialable
     *
     * @returns {TileLayer<XYZ>} return the created basemap
     */
    createEmptyBasemap(): TileLayer<XYZ>;
    /**
     * Create a basemap layer
     *
     * @param {string} basemapId the id of the layer
     * @param {TypeJsonObject} basemapLayer the basemap layer url and json url
     * @param {number} opacity the opacity to use for this layer
     * @param {boolean} rest should we do a get request to get the info from the server
     *
     * @returns {TypeBasemapLayer} return the created basemap layer
     */
    private createBasemapLayer;
    /**
     * Create the core basemap and add the layers to it
     *
     * @param {TypeBasemapOptions} basemapOptions basemap options
     * @param {TypeValidMapProjectionCodes} projection optional projection code
     * @param {TypeDisplayLanguage} language optional language
     *
     * @return {Promise<TypeBasemapProps | undefined>} the core basemap
     */
    createCoreBasemap(basemapOptions: TypeBasemapOptions, projection?: TypeValidMapProjectionCodes, language?: TypeDisplayLanguage): Promise<TypeBasemapProps | undefined>;
    /**
     * Create a custom basemap
     *
     * @param {TypeBasemapProps} basemapProps basemap properties
     * @param {TypeValidMapProjectionCodes} projection projection code
     * @param {TypeDisplayLanguage} language optional language
     *
     * @returns {TypeBasemapProps} the created custom basemap
     */
    createCustomBasemap(basemapProps: TypeBasemapProps, projection: TypeValidMapProjectionCodes, language?: TypeDisplayLanguage): TypeBasemapProps;
    /**
     * Load the default basemap that was passed in the map config
     *
     * @param {TypeValidMapProjectionCodes} projection optional projection code
     * @param {TypeDisplayLanguage} language optional language
     */
    loadDefaultBasemaps(projection?: TypeValidMapProjectionCodes, language?: TypeDisplayLanguage): Promise<void>;
    /**
     * Set the current basemap and update the basemap layers on the map
     *
     * @param {TypeBasemapProps} basemap the basemap
     */
    setBasemap(basemap: TypeBasemapProps): void;
}
