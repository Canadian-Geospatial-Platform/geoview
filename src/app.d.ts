import 'ol/ol.css';
import '@/ui/style/style.css';
import '@/ui/style/vendor.css';
import * as types from '@/core/types/cgpv-types';
export * from './core/types/cgpv-types';
export declare const api: types.API;
export declare function addReloadListener(mapId: string): void;
/**
 * Initialize a basic div from a function call. The div MUST not have llwp-map class.
 * If is present, the div will be created with a default config
 *
 * @param {Element} mapDiv The basic div to initialise
 * @param {string} mapConfig the new config passed in from the function call
 */
export declare function initMapDivFromFunctionCall(mapDiv: HTMLElement, mapConfig: string): void;
export declare const cgpv: types.TypeCGPV;
