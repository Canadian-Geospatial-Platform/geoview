import { Extent } from 'ol/extent';
import BaseLayer from 'ol/layer/Base';
import OLMap from 'ol/Map';
import { OverviewMap as OLOverviewMap } from 'ol/control';
import { TypeBasemapOptions, TypeValidMapProjectionCodes, TypeDisplayLanguage } from '@/api/config/types/map-schema-types';
import { TypeJsonObject } from '@/api/config/types/config-types';
import { TypeBasemapProps } from '@/geo/layer/basemap/basemap-types';
import { EventDelegateBase } from '@/api/events/event-helper';
import { MapViewer } from '@/geo/map/map-viewer';
/**
 * A class to get a Basemap for a define projection and language. For the moment, a list maps are available and
 * can be filtered by projection (currently only WM and LCC projections are listed,
 * in case other projections needed, they need to be added to the list)
 *
 * @exports
 * @class Basemap
 */
export declare class BasemapApi {
    #private;
    /** The maximum delay to wait before we warn about the basemap taking a long time */
    static DEFAULT_WAIT_PERIOD_BASEMAP_WARNING: number;
    /** Indicates if the basemap has been created successfully */
    created: boolean;
    mapViewer: MapViewer;
    activeBasemap?: TypeBasemapProps;
    defaultOrigin?: number[];
    defaultResolutions?: number[];
    defaultExtent?: Extent;
    overviewMap?: TypeBasemapProps;
    overviewMapCtrl?: OLOverviewMap;
    basemapOptions: TypeBasemapOptions;
    /**
     * Initialize basemap api
     * @param {string} mapViewer - The map viewer.
     * @param {TypeBasemapOptions} basemapOptions - Optional basemap option properties, passed in from map config.
     */
    constructor(mapViewer: MapViewer, basemapOptions: TypeBasemapOptions);
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
     * @return {Promise<TypeBasemapProps>} The core basemap.
     */
    createCoreBasemap(basemapOptions: TypeBasemapOptions, projection?: TypeValidMapProjectionCodes, language?: TypeDisplayLanguage): Promise<TypeBasemapProps>;
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
     * Clears the basemap layers from the map.
     */
    clearBasemaps(): void;
    /**
     * Set the current basemap and update the basemap layers on the map.
     * @param {TypeBasemapProps} basemap - The basemap.
     */
    setBasemap(basemap: TypeBasemapProps): void;
    /**
     * Refreshes the basemap layers
     */
    refreshBasemap(): void;
    /**
     * Registers a basemap changed event callback.
     * @param {BasemapChangedDelegate} callback - The callback to be executed whenever the event is emitted
     */
    onBasemapChanged(callback: BasemapChangedDelegate): void;
    /**
     * Unregisters a basemap changed event callback.
     * @param {BasemapChangedDelegate} callback - The callback to stop being called whenever the event is emitted
     */
    offBasemapChanged(callback: BasemapChangedDelegate): void;
    /**
     * Registers a basemap error event callback.
     * @param {BasemapErrorDelegate} callback - The callback to be executed whenever the event is emitted
     */
    onBasemapError(callback: BasemapErrorDelegate): void;
    /**
     * Unregisters a basemap error event callback.
     * @param {BasemapErrorDelegate} callback - The callback to stop being called whenever the event is emitted
     */
    offBasemapError(callback: BasemapErrorDelegate): void;
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
type BasemapChangedDelegate = EventDelegateBase<BasemapApi, BasemapChangedEvent, void>;
/**
 * Define an event for the delegate.
 */
export type BasemapErrorEvent = {
    error: Error;
};
/**
 * Define a delegate for the event handler function signature.
 */
type BasemapErrorDelegate = EventDelegateBase<BasemapApi, BasemapErrorEvent, void>;
export {};
//# sourceMappingURL=basemap.d.ts.map