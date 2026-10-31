import type { API } from '@/api/api';
import { MapViewer } from '@/geo/map/map-viewer';
/**
 * Safely unmounts a map and cleans up its resources.
 *
 * @param mapId - The map identifier to unmount
 * @param mapContainer - Optional, the html element where the map was mounted
 */
export declare function unmountMap(mapId: string, mapContainer?: HTMLElement): void;
/**
 * Renders the map for inline map and map create from a function call.
 *
 * @param api - The API instance that registers the created MapViewer
 * @param mapElement - The html element div who will contain the map
 * @returns A Promise containing the MapViewer
 */
export declare function renderMap(api: API, mapElement: HTMLElement): Promise<MapViewer>;
/**
 * Initializes a basic div from a function call.
 *
 * GV The div MUST NOT have a geoview-map class or a warning will be shown.
 * If is present, the div will be created with a default config
 *
 * @param api - The API instance that registers the created MapViewer
 * @param mapDiv - The basic div to initialize
 * @param mapConfig - The new config passed in from the function call
 * @returns A Promise containing the MapViewer
 */
export declare function initMapDivFromFunctionCall(api: API, mapDiv: HTMLElement, mapConfig: string): Promise<MapViewer>;
//# sourceMappingURL=map-mount.d.ts.map