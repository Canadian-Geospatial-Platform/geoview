import 'ol/ol.css';
import '@/ui/style/style.css';
import '@/ui/style/vendor.css';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import { API } from '@/api/api';
import { MapViewerDelegate, TypeCGPV } from '@/core/types/global-types';
import { MapViewer } from '@/geo/map/map-viewer';
export * from './core/types/external-types';
export declare const api: API;
/**
 * Safely unmounts a map and cleans up its resources
 *
 * @param {string} mapId - The map id to unmount
 */
export declare function unmountMap(mapId: string, mapContainer: HTMLElement): void;
/**
 * Initialize a basic div from a function call.
 * GV The div MUST NOT have a geoview-map class or a warning will be shown.
 * If is present, the div will be created with a default config
 *
 * @param {HTMLElement} mapDiv - The basic div to initialise
 * @param {string} mapConfig - The new config passed in from the function call
 */
export declare function initMapDivFromFunctionCall(mapDiv: HTMLElement, mapConfig: string): Promise<MapViewer>;
/**
 * Registers a callback when the map has been initialized
 * @param {MapViewerDelegate} callback - The callback to be called
 */
export declare function onMapInit(callback: MapViewerDelegate): void;
/**
 * Registers a callback when the map has turned ready / layers were registered
 * @param {MapViewerDelegate} callback - The callback to be called
 */
export declare function onMapReady(callback: MapViewerDelegate): void;
/**
 * Registers a callback when the layers have been processed
 * @param {MapViewerDelegate} callback - The callback to be called
 */
export declare function onLayersProcessed(callback: MapViewerDelegate): void;
/**
 * Registers a callback when the layers have been loaded
 * @param {MapViewerDelegate} callback - The callback to be called
 */
export declare function onLayersLoaded(callback: MapViewerDelegate): void;
export declare const cgpv: TypeCGPV;
