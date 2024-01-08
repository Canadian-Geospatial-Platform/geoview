import 'ol/ol.css';
import '@/ui/style/style.css';
import '@/ui/style/vendor.css';
import * as types from '@/core/types/cgpv-types';
export * from './core/types/cgpv-types';
export declare const api: types.API;
/**
 * Function to unmount a map element
 *
 * @param {string} mapId the map id to unmount
 */
export declare function unmountMap(mapId: string): void;
/**
 * Listen for map reload events. The map component is linked to a specific mapId. When we modify something on the map, the
 * changes spread throughout the data structure. We therefore need to reload the entire map configuration to ensure that
 * all changes made to the map are applied.
 *
 * @param {string} mapId the map id to reload
 */
export declare function addReloadListener(mapId: string): void;
/**
 * Initialize a basic div from a function call. The div MUST not have geoview-map class.
 * If is present, the div will be created with a default config
 *
 * @param {Element} mapDiv The basic div to initialise
 * @param {string} mapConfig the new config passed in from the function call
 */
export declare function initMapDivFromFunctionCall(mapDiv: HTMLElement, mapConfig: string): void;
export declare const cgpv: types.TypeCGPV;
