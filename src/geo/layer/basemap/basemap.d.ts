import { Extent } from 'ol/extent';
import { TypeBasemapOptions, TypeValidMapProjectionCodes, TypeDisplayLanguage } from '@config/types/map-schema-types';
import { EventDelegateBase } from '@/app';
import { TypeJsonObject } from '@/core/types/global-types';
import { TypeBasemapProps } from '@/geo/layer/basemap/basemap-types';
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
    static REQUEST_DELAY_MAX: number;
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
    setOverviewMap(): Promise<void>;
    getOverviewMap(): TypeBasemapProps | undefined;
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
    /**
     * Registers a component removed event callback.
     * @param {MapComponentRemovedDelegate} callback - The callback to be executed whenever the event is emitted
     */
    onBasemapChanged(callback: BasemapChangedDelegate): void;
    /**
     * Unregisters a component removed event callback.
     * @param {MapComponentRemovedDelegate} callback - The callback to stop being called whenever the event is emitted
     */
    offMapLanguageChanged(callback: BasemapChangedDelegate): void;
}
/**
 * Define an event for the delegate
 */
export type BasemapChangedEvent = {
    basemap: TypeBasemapProps;
};
/**
 * Define a delegate for the event handler function signature
 */
type BasemapChangedDelegate = EventDelegateBase<Basemap, BasemapChangedEvent, void>;
export {};
