import { ConfigApi } from '@/api/config/config-api';
import { Plugin } from '@/api/plugin/plugin';
import { DateMgt } from '@/core/utils/date-mgt';
import * as Utilities from '@/core/utils/utilities';
import { Projection } from '@/geo/utils/projection';
import { MapViewer } from '@/geo/map/map-viewer';
import * as GeoUtilities from '@/geo/utils/utilities';
import { EventDelegateBase } from '@/api/events/event-helper';
/**
 * Class used to handle api calls (events, functions etc...)
 *
 * @exports
 * @class API
 */
export declare class API {
    #private;
    config: typeof ConfigApi;
    plugin: typeof Plugin;
    utilities: {
        core: typeof Utilities;
        geo: typeof GeoUtilities;
        projection: typeof Projection;
        date: typeof DateMgt;
    };
    /**
     * Initiate the event and projection objects
     */
    constructor();
    /**
     * Gets the list of all map IDs currently in the collection.
     * @returns {string[]} Array of map IDs
     */
    getMapViewerIds(): string[];
    /**
     * Gets a map viewer instance by its ID.
     * @param {string} mapId - The unique identifier of the map to retrieve
     * @returns {MapViewer} The map viewer instance if found
     * @throws {MapViewerNotFoundError} If the map with the specified ID is not found
     */
    getMapViewer(mapId: string): MapViewer;
    /**
     * Asynchronously gets a map viewer instance by its ID.
     * @param {string} mapId - The unique identifier of the map to retrieve
     * @returns {Promise<MapViewer>} The map viewer instance when/if found.
     * @throws {Error} If the map with the specified ID is not found
     */
    getMapViewerAsync(mapId: string): Promise<MapViewer>;
    /**
     * Deletes a map viewer instance by its ID.
     * @param {string} mapId - The unique identifier of the map to delete
     * @param {boolean} deleteContainer - True if we want to delete div from the page
     * @returns {Promise<HTMLElement>} The Promise containing the HTML element
     */
    deleteMapViewer(mapId: string, deleteContainer: boolean): Promise<HTMLElement>;
    /**
     * Returns true if a map id is already registered.
     * @param {string} mapId - The unique identifier of the map to retrieve
     * @returns {boolean} True if map exist
     */
    hasMapViewer(mapId: string): boolean;
    /**
     * Sets a map viewer in maps.
     * @param {string} mapId - ID of the map
     * @param {MapViewer} mapViewer - The viewer to be added
     * @param {(mapViewer: MapViewer) => void} onMapViewerInit - Function to run on map init
     */
    setMapViewer(mapId: string, mapViewer: MapViewer, onMapViewerInit?: (mapViewer: MapViewer) => void): void;
    /**
     * Create a new map in a given div id.
     * GV The div MUST NOT have a geoview-map class or a warning will be shown when initMapDivFromFunctionCall is called.
     * If is present, the div will be created with a default config
     *
     * @param {string} divId - id of the div to create map in
     * @param {string} mapConfig - config passed in from the function call (string or url of a config path)
     * @param {number} divHeight - height of the div to inject the map in (mandatory if the map reloads)
     * @param {boolean} forceDeleteInApi - force a delete of the MapViewer from the this.#maps array
     */
    createMapFromConfig(divId: string, mapConfig: string, divHeight?: number, forceDeleteInApi?: boolean): Promise<MapViewer>;
    /**
     * Registers a map viewer ready event callback.
     * @param {MapViewerReadyDelegate} callback - The callback to be executed whenever the event is emitted
     */
    onMapViewerReady(callback: MapViewerReadyDelegate): void;
    /**
     * Unregisters a map viewer ready event callback.
     * @param {MapViewerReadyDelegate} callback - The callback to stop being called whenever the event is emitted
     */
    offMapViewerReady(callback: MapViewerReadyDelegate): void;
    /**
     * Registers a map added to div event handler.
     * @param {MapAddedToDivDelegate} callback - The callback to be executed whenever the event is emitted
     */
    onMapAddedToDiv(callback: MapAddedToDivDelegate): void;
    /**
     * Unregisters a map added to div event handler.
     * @param {MapAddedToDivdDelegate} callback - The callback to stop being called whenever the event is emitted
     */
    offMapAddedToDiv(callback: MapAddedToDivDelegate): void;
}
/**
 * Define a delegate for the event handler function signature
 */
export type MapViewerReadyDelegate = EventDelegateBase<API, MapViewerReadyEvent, void>;
/**
 * Define an event for the delegate
 */
export type MapViewerReadyEvent = {
    mapId: string;
};
/**
 * Define a delegate for the event handler function signature
 */
export type MapAddedToDivDelegate = EventDelegateBase<API, MapAddedToDivEvent, void>;
/**
 * Define an event for the delegate
 */
export type MapAddedToDivEvent = {
    mapId: string;
};
