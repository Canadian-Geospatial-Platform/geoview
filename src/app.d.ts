import React from 'react';
import { createRoot } from 'react-dom/client';
import * as translate from 'react-i18next';
import { useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import 'ol/ol.css';
import '@/ui/style/style.css';
import '@/ui/style/vendor.css';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import * as UI from '@/ui';
import { API } from '@/api/api';
import type { MapViewerDelegate } from '@/core/types/global-types';
import { MapViewer } from '@/geo/map/map-viewer';
export * from './core/types/external-types';
export declare const api: API;
/**
 * Safely unmounts a map and cleans up its resources
 * @param {string} mapId - The map id to unmount
 * @param {HTMLElement?} mapContainer - Optional, the html element where the map was mounted
 */
export declare function unmountMap(mapId: string, mapContainer?: HTMLElement): void;
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
 * Initializes the cgpv and render it to root element
 */
declare function init(): void;
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
export declare const cgpv: {
    init: typeof init;
    onMapInit: typeof onMapInit;
    onMapReady: typeof onMapReady;
    api: API;
    reactUtilities: {
        react: typeof React;
        createRoot: typeof createRoot;
        createElement: typeof React.createElement;
    };
    translate: typeof translate;
    ui: {
        useTheme: typeof useTheme;
        useMediaQuery: typeof useMediaQuery;
        useWhatChanged: (hookId: string, dependency?: unknown[], dependencyNames?: string[]) => void;
        elements: typeof UI;
    };
    logger: import("@/core/utils/logger").ConsoleLogger;
};
//# sourceMappingURL=app.d.ts.map