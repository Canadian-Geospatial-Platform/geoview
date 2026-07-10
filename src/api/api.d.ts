import { ConfigApi } from '@/api/config/config-api';
import type { EventDelegateBase } from '@/api/events/event-helper';
import { Plugin } from '@/api/plugin/plugin';
import { DateMgt } from '@/core/utils/date-mgt';
import * as Utilities from '@/core/utils/utilities';
import { Projection } from '@/geo/utils/projection';
import type { MapViewer } from '@/geo/map/map-viewer';
import { GeoUtilities } from '@/geo/utils/utilities';
import { LayerApi } from '@/geo/layer/layer';
import type { TypeMapFeaturesConfig } from '@/core/types/global-types';
import type { TypeMapFeaturesInstance } from '@/api/types/map-schema-types';
/** Class used to handle api calls (events, functions etc...). */
export declare class API {
    #private;
    /** ConfigApi static class */
    config: typeof ConfigApi;
    /** LayerApi static class */
    layer: typeof LayerApi;
    /** Load plugins API */
    plugin: typeof Plugin;
    /** Utilities object */
    utilities: {
        core: typeof Utilities;
        geo: typeof GeoUtilities;
        projection: typeof Projection;
        date: typeof DateMgt;
    };
    /**
     * Initiates the event and projection objects.
     */
    constructor();
    /**
     * Gets the list of all map IDs currently in the collection.
     *
     * @returns Array of map IDs
     */
    getMapViewerIds(): string[];
    /**
     * Returns true if a map id is already registered.
     *
     * @param mapId - The unique identifier of the map to retrieve
     * @returns True if map exist
     */
    hasMapViewer(mapId: string): boolean;
    /**
     * Gets a map viewer instance by its ID.
     *
     * @param mapId - The unique identifier of the map to retrieve
     * @returns The map viewer instance if found
     * @throws {MapViewerNotFoundError} When the map with the specified ID is not found
     */
    getMapViewer(mapId: string): MapViewer;
    /**
     * Sets a map viewer in maps.
     *
     * @param mapId - ID of the map
     * @param mapViewer - The viewer to be added
     */
    setMapViewer(mapId: string, mapViewer: MapViewer): void;
    /**
     * Asynchronously gets a map viewer instance by its ID.
     *
     * @param mapId - The unique identifier of the map to retrieve
     * @returns A promise that resolves with the map viewer instance when/if found
     * @throws {Error} When the map with the specified ID is not found
     */
    getMapViewerAsync(mapId: string): Promise<MapViewer>;
    /**
     * Waits for a specific map viewer to be set via the onMapViewerSet event.
     *
     * @param mapId - The unique identifier of the map to wait for
     * @returns A promise that resolves with the map viewer instance once it is set
     */
    waitForMapViewer(mapId: string): Promise<MapViewer>;
    /**
     * Deletes a map viewer instance by its ID and unmounts it from the DOM - for React.
     *
     * @param mapId - The unique identifier of the map to delete
     * @param deleteContainer - True if we want to delete div from the page
     * @returns A promise that resolves when the map viewer is deleted
     */
    deleteMapViewer(mapId: string, deleteContainer: boolean): Promise<void>;
    /**
     * Creates a new map in a given div id.
     *
     * GV The div MUST NOT have a geoview-map class or a warning will be shown when initMapDivFromFunctionCall is called.
     * If is present, the div will be created with a default config.
     *
     * @param divId - Id of the div to create map in (becomes the mapId)
     * @param mapConfig - Config passed in from the function call (string or url of a config path)
     * @param divHeight - Optional height of the div to inject the map in (mandatory if the map reloads)
     * @param waitOnMapReady - Optional flag to wait for the map to be ready before resolving the promise
     * @returns A promise that resolves with the MapViewer (after the onMapReady is triggered) which will be created from the configuration
     */
    createMapFromConfig(divId: string, mapConfig: string, divHeight?: number, waitOnMapReady?: boolean): Promise<MapViewer>;
    /**
     * Creates a new map in a given div id.
     *
     * GV The div MUST NOT have a geoview-map class or a warning will be shown when initMapDivFromFunctionCall is called.
     * If is present, the div will be created with a default config.
     *
     * @param divId - Id of the div to create map in (becomes the mapId)
     * @param mapConfig - Config passed in from the function call (string or url of a config path)
     * @param divHeight - Optional height of the div to inject the map in (mandatory if the map reloads)
     * @returns A promise that resolves with the MapViewer (after the onMapReady is triggered) which will be created from the configuration
     */
    createMapFromConfigFast(divId: string, mapConfig: string, divHeight?: number): Promise<MapViewer>;
    /**
     * Reload a map from a config object stored in store, or provided. It first removes then recreates the map.
     *
     * @param mapId - The unique identifier of the map to reload
     * @param mapConfig - Optional map config to use for reload
     * @returns A promise that resolves with the MapViewer which will be created once reloaded
     */
    reload(mapId: string, mapConfig?: TypeMapFeaturesConfig | TypeMapFeaturesInstance): Promise<MapViewer>;
    /**
     * Reload a map from a config object created using current map state. It first removes then recreates the map.
     *
     * @param mapId - The unique identifier of the map to reload
     * @param maintainGeocoreLayerNames - Indicates if geocore layer names should be kept as is or returned to defaults.
     *                                    Set to false after a language change to update the layer names with the new language
     * @returns A promise that resolves with the MapViewer which will be created once reloaded
     */
    reloadWithCurrentState(mapId: string, maintainGeocoreLayerNames?: boolean): Promise<MapViewer>;
    /**
     * Returns a promise that resolves the next time the map viewer set event fires.
     *
     * @param filter - Optional filter to only resolve when the event matches
     * @returns A promise that resolves with the event payload when a map viewer is set
     */
    onceMapViewerSet(filter?: (event: MapViewerSetEvent) => boolean): Promise<MapViewer>;
    /**
     * Registers a map viewer set event callback.
     *
     * @param callback - The callback to be executed whenever the event is emitted
     * @returns The callback delegate that was registered
     */
    onMapViewerSet(callback: MapViewerSetDelegate): MapViewerSetDelegate;
    /**
     * Unregisters a map viewer set event callback.
     *
     * @param callback - The callback to stop being called whenever the event is emitted
     */
    offMapViewerSet(callback: MapViewerSetDelegate): void;
}
/** The event payload for the map viewer set event. */
export type MapViewerSetEvent = {
    /** The map viewer instance that was set. */
    mapViewer: MapViewer;
};
/** Delegate type for the map viewer set event. */
export type MapViewerSetDelegate = EventDelegateBase<API, MapViewerSetEvent, void>;
//# sourceMappingURL=api.d.ts.map