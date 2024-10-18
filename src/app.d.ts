import 'ol/ol.css';
import '@/ui/style/style.css';
import '@/ui/style/vendor.css';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import { API } from '@/api/api';
import { TypeCGPV } from '@/core/types/global-types';
export * from './core/types/external-types';
export declare const api: API;
/**
 * Function to unmount a map element
 *
 * @param {string} mapId - The map id to unmount
 */
export declare function unmountMap(mapId: string): void;
/**
 * Initialize a basic div from a function call.
 * GV The div MUST NOT have a geoview-map class or a warning will be shown.
 * If is present, the div will be created with a default config
 *
 * @param {HTMLElement} mapDiv - The basic div to initialise
 * @param {string} mapConfig - The new config passed in from the function call
 */
export declare function initMapDivFromFunctionCall(mapDiv: HTMLElement, mapConfig: string): Promise<void>;
/**
 * Registers a callback when the map has been initialized
 * @param {(mapId: string) => void} callback - The callback to be called
 */
export declare function onMapInit(callback: (mapId: string) => void): void;
/**
 * Registers a callback when the map has turned ready / layers were registered
 * @param {(mapId: string) => void} callback - The callback to be called
 */
export declare function onMapReady(callback: (mapId: string) => void): void;
/**
 * Registers a callback when the layers have been processed
 * @param {(mapId: string) => void} callback - The callback to be called
 */
export declare function onLayersProcessed(callback: (mapId: string) => void): void;
/**
 * Registers a callback when the layers have been loaded
 * @param {(mapId: string) => void} callback - The callback to be called
 */
export declare function onLayersLoaded(callback: (mapId: string) => void): void;
export declare const cgpv: TypeCGPV;
