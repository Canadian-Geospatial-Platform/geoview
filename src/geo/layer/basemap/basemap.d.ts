import { Extent } from 'ol/extent';
import BaseLayer from 'ol/layer/Base';
import OLMap from 'ol/Map';
import { OverviewMap as OLOverviewMap } from 'ol/control';
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
    overviewMapCtrl?: OLOverviewMap;
    basemapOptions: TypeBasemapOptions;
    mapId: string;
    /**
     * Initialize basemap.
     * @param {TypeBasemapOptions} basemapOptions - Optional basemap option properties, passed in from map config.
     * @param {string} mapId - The map id.
     */
    constructor(basemapOptions: TypeBasemapOptions, mapId: string);
    /**
     * Basemap list
     */
    basemapsList: TypeJsonObject;
    getOverviewMapControl(olMap: OLMap, toggleButton: HTMLDivElement): OLOverviewMap;
    createOverviewMapLayers(): BaseLayer[];
    setOverviewMap(): Promise<void>;
    setOverviewMapControlVisibility(olMap: OLMap, visible: boolean): void;
    /**
     * Create the core basemap and add the layers to it.
     * @param {TypeBasemapOptions} basemapOptions - Basemap options.
     * @param {TypeValidMapProjectionCodes} projection - Optional projection code.
     * @param {TypeDisplayLanguage} language - Optional language.
     * @return {Promise<TypeBasemapProps | undefined>} The core basemap.
     */
    createCoreBasemap(basemapOptions: TypeBasemapOptions, projection?: TypeValidMapProjectionCodes, language?: TypeDisplayLanguage): Promise<TypeBasemapProps | undefined>;
    /**
     * Create a custom basemap.
     * @param {TypeBasemapProps} basemapProps - Basemap properties.
     * @param {TypeValidMapProjectionCodes} projection - Projection code.
     * @param {TypeDisplayLanguage} language - Optional language.
     * @returns {TypeBasemapProps} The created custom basemap.
     */
    createCustomBasemap(basemapProps: TypeBasemapProps, projection: TypeValidMapProjectionCodes, language?: TypeDisplayLanguage): TypeBasemapProps;
    /**
     * Load the default basemap that was passed in the map config.
     * @param {TypeValidMapProjectionCodes} projection - Optional projection code.
     * @param {TypeDisplayLanguage} language - Optional language.
     */
    loadDefaultBasemaps(projection?: TypeValidMapProjectionCodes, language?: TypeDisplayLanguage): Promise<void>;
    /**
     * Set the current basemap and update the basemap layers on the map.
     * @param {TypeBasemapProps} basemap - The basemap.
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
 * Define an event for the delegate.
 */
export type BasemapChangedEvent = {
    basemap: TypeBasemapProps;
};
/**
 * Define a delegate for the event handler function signature.
 */
type BasemapChangedDelegate = EventDelegateBase<Basemap, BasemapChangedEvent, void>;
export {};
