import 'ol/ol.css';
import '@/ui/style/style.css';
import '@/ui/style/vendor.css';
import * as types from '@/core/types/cgpv-types';
export * from './core/types/cgpv-types';
export declare const api: types.API;
export declare function addReloadListener(mapId: string): void;
/**
 * Initialize the map div from a function call
 *
 * @param {Element} mapDiv The ma div to initialise
 * @param {string} mapConfig a new config passed in from the function call
 */
export declare function initMapDivFromFunctionCall(mapDiv: HTMLElement, mapConfig: string): Promise<void>;
export declare const cgpv: types.TypeCGPV;
