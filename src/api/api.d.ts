import { ConfigApi } from '@config/config-api';
import { Plugin } from '@/api/plugin/plugin';
import { DateMgt } from '@/core/utils/date-mgt';
import * as Utilities from '@/core/utils/utilities';
import { Projection } from '@/geo/utils/projection';
import { MapViewer } from '@/geo/map/map-viewer';
import * as GeoUtilities from '@/geo/utils/utilities';
import { EventDelegateBase } from './events/event-helper';
/**
 * Class used to handle api calls (events, functions etc...)
 *
 * @exports
 * @class API
 */
export declare class API {
    #private;
    config: typeof ConfigApi;
    maps: Record<string, MapViewer>;
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
     * Create a new map in a given div id.
     * GV The div MUST NOT have a geoview-map class or a warning will be shown when initMapDivFromFunctionCall is called.
     * If is present, the div will be created with a default config
     *
     * @param {string} divId - id of the div to create map in
     * @param {string} mapConfig - config passed in from the function call (string or url of a config path)
     * @param {number} divHeight - height of the div to inject the map in (mandatory if the map reloads)
     */
    createMapFromConfig(divId: string, mapConfig: string, divHeight?: number): Promise<void>;
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
type MapAddedToDivDelegate = EventDelegateBase<API, MapAddedToDivEvent, void>;
/**
 * Define an event for the delegate
 */
export type MapAddedToDivEvent = {
    mapId: string;
};
export {};
