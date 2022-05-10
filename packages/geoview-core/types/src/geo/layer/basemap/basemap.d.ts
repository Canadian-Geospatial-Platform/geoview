import { TypeBasemapProps, TypeBasemapLayer, TypeBasemapOptions, TypeAttribution } from '../../../core/types/cgpv-types';
/**
 * A class to get a Basemap for a define projection and language. For the moment, a list maps are available and
 * can be filtered by projection (currently only WM and LCC projections are listed,
 * in case other projections needed, they need to be added to the list)
 *
 * @export
 * @class Basemap
 */
export declare class Basemap {
    basemaps: TypeBasemapProps[];
    language: string;
    private basemapOptions;
    private projection;
    private mapId;
    private basemapsPaneName;
    /**
     * initialize basemap
     *
     * @param {TypeBasemapOptions} basemapOptions optional basemap option properties, passed in from map config
     * @param {string} language language to be used either en-CA or fr-CA
     * @param {number} projection projection number
     */
    constructor(basemapOptions: TypeBasemapOptions | null | undefined, language: string, projection: number, mapId?: string);
    /**
     * basemap list
     */
    basemapsList: Record<number, Record<string, string>>;
    /**
     * basemap layer configuration
     */
    private basemapLayerOptions;
    /**
     * attribution to add the the map
     */
    private attributionVal;
    /**
     * Build basemap array using projection and language...
     *
     * @return {TypeBasemapLayer[]} basemapLayers the array of basemap layer
     */
    getBasemapLayers(): TypeBasemapLayer[];
    /**
     * load the default basemaps that was passed in the map config
     */
    loadDefaultBasemaps: () => void;
    /**
     * Create a new basemap
     *
     * @param {TypeBasemapProps} basemapProps basemap properties
     */
    createBasemap: (basemapProps: TypeBasemapProps) => void;
    /**
     * Set the current basemap and update the basemap layers on the map
     *
     * @param {string} id the id of the basemap
     */
    setBasemap: (id: string) => void;
    /**
     * get attribution value to add the the map
     *
     * @returns returns the attribution value
     */
    get attribution(): TypeAttribution;
}
