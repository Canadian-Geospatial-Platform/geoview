import { ConfigApi } from '@/api/config/config-api';
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
     * @returns A promise that resolves with the MapViewer (after the onMapReady is triggered) which will be created from the configuration
     */
    createMapFromConfig(divId: string, mapConfig: string, divHeight?: number): Promise<MapViewer>;
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
}
//# sourceMappingURL=api.d.ts.map