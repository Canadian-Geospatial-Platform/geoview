import { ConfigApi } from '@/api/config/config-api';
import { Plugin } from '@/api/plugin/plugin';
import { DateMgt } from '@/core/utils/date-mgt';
import * as Utilities from '@/core/utils/utilities';
import { Projection } from '@/geo/utils/projection';
import { MapViewer } from '@/geo/map/map-viewer';
import * as GeoUtilities from '@/geo/utils/utilities';
import { LayerApi } from '@/geo/layer/layer';
import { TypeMapFeaturesConfig } from '@/core/types/global-types';
import { TypeMapFeaturesInstance } from '@/api/config/types/map-schema-types';
/**
 * Class used to handle api calls (events, functions etc...)
 *
 * @exports
 * @class API
 */
export declare class API {
    #private;
    config: typeof ConfigApi;
    layer: typeof LayerApi;
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
     * Returns true if a map id is already registered.
     * @param {string} mapId - The unique identifier of the map to retrieve
     * @returns {boolean} True if map exist
     */
    hasMapViewer(mapId: string): boolean;
    /**
     * Gets a map viewer instance by its ID.
     * @param {string} mapId - The unique identifier of the map to retrieve
     * @returns {MapViewer} The map viewer instance if found
     * @throws {MapViewerNotFoundError} If the map with the specified ID is not found
     */
    getMapViewer(mapId: string): MapViewer;
    /**
     * Sets a map viewer in maps.
     * @param {string} mapId - ID of the map
     * @param {MapViewer} mapViewer - The viewer to be added
     */
    setMapViewer(mapId: string, mapViewer: MapViewer): void;
    /**
     * Asynchronously gets a map viewer instance by its ID.
     * @param {string} mapId - The unique identifier of the map to retrieve
     * @returns {Promise<MapViewer>} The map viewer instance when/if found.
     * @throws {Error} If the map with the specified ID is not found
     */
    getMapViewerAsync(mapId: string): Promise<MapViewer>;
    /**
     * Deletes a map viewer instance by its ID and unmounts it from the DOM - for React.
     * @param {string} mapId - The unique identifier of the map to delete
     * @param {boolean} deleteContainer - True if we want to delete div from the page
     * @returns {Promise<void>} Promise when the map viewer is deleted
     */
    deleteMapViewer(mapId: string, deleteContainer: boolean): Promise<void>;
    /**
     * Create a new map in a given div id.
     * GV The div MUST NOT have a geoview-map class or a warning will be shown when initMapDivFromFunctionCall is called.
     * If is present, the div will be created with a default config
     * @param {string} divId - Id of the div to create map in (becomes the mapId)
     * @param {string} mapConfig - Config passed in from the function call (string or url of a config path)
     * @param {number?} divHeight - Optional, height of the div to inject the map in (mandatory if the map reloads)
     * @returns {Promise<MapViewer>} A Promise containing the MapViewer which will be created from the configuration.
     */
    createMapFromConfig(divId: string, mapConfig: string, divHeight?: number): Promise<MapViewer>;
    /**
     * Reload a map from a config object stored in store, or provided. It first removes then recreates the map.
     * @param {TypeMapFeaturesConfig | TypeMapFeaturesInstance} mapConfig - Optional map config to use for reload.
     * @returns {Promise<MapViewer>} A Promise containing the MapViewer which will be created once reloaded.
     */
    reload(mapId: string, mapConfig?: TypeMapFeaturesConfig | TypeMapFeaturesInstance): Promise<MapViewer>;
    /**
     * Reload a map from a config object created using current map state. It first removes then recreates the map.
     * @param {boolean} maintainGeocoreLayerNames - Indicates if geocore layer names should be kept as is or returned to defaults.
     *                                              Set to false after a language change to update the layer names with the new language.
     * @returns {Promise<MapViewer>} A Promise containing the MapViewer which will be created once reloaded.
     */
    reloadWithCurrentState(mapId: string, maintainGeocoreLayerNames?: boolean): Promise<MapViewer>;
}
//# sourceMappingURL=api.d.ts.map