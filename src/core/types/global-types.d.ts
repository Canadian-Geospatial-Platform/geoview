import React from 'react';
import { createRoot } from 'react-dom/client';
import { useTheme } from '@mui/material/styles';
import { useMediaQuery } from '@mui/material';
import { TypeDisplayLanguage, TypeMapFeaturesInstance } from '@/api/config/types/map-schema-types';
import { API } from '@/api/api';
import { logger } from '@/core/utils/logger';
import { useWhatChanged } from '@/core/utils/useWhatChanged';
import * as UI from '@/ui';
import { AbstractPlugin } from '@/api/plugin/abstract-plugin';
import { TypeJsonObject } from '@/api/config/types/config-types';
import { MapViewer } from '@/geo/map/map-viewer';
export { getGeoViewStore } from '@/core/stores/stores-managers';
export type { SelectChangeEvent } from '@mui/material';
/**
 * Definition of the map feature configuration according to what can be specified in the map div and in the schema for the
 * type extension TypeMapFeaturesInstance.
 */
export interface TypeMapFeaturesConfig extends TypeMapFeaturesInstance {
    /** This attribute is not part of the schema. It is placed here to keep the 'id' attribute of the HTML div of the map. */
    mapId: string;
    /** This attribute is not part of the schema. It is placed here to keep the 'data-lang' attribute of the HTML div of the map. */
    displayLanguage?: TypeDisplayLanguage;
}
/**
 *  Definition of a global Window type.
 */
declare global {
    interface Window {
        cgpv: TypeCGPV;
        geoviewPlugins: Record<string, unknown>;
    }
}
/**
 * Type extending the window object.
 */
export interface TypeWindow extends Window {
    /** the core */
    cgpv: TypeCGPV;
    /** plugins added to the core */
    geoviewPlugins: {
        [pluginId: string]: ((pluginId: string, props: null | string | number | boolean | TypeJsonObject[] | {
            [key: string]: TypeJsonObject;
        }) => null | string | number | boolean | TypeJsonObject[] | {
            [key: string]: TypeJsonObject;
        }) | AbstractPlugin | undefined;
    };
}
/**
 * Type used for exporting core.
 */
export type TypeCGPV = {
    init: () => void;
    onMapInit: MapViewerCallback;
    onMapReady: MapViewerCallback;
    onLayersProcessed: MapViewerCallback;
    onLayersLoaded: MapViewerCallback;
    api: API;
    react: typeof React;
    createRoot: typeof createRoot;
    ui: TypeCGPVUI;
    logger: typeof logger;
};
/** MapViewer delegate */
export type MapViewerDelegate = (mapViewer: MapViewer) => void;
/** CGPV MapViewer callback delegate */
export type MapViewerCallback = (callback: MapViewerDelegate) => void;
/**
 * Type used for exporting UI
 */
export type TypeCGPVUI = {
    useTheme: typeof useTheme;
    useMediaQuery: typeof useMediaQuery;
    useWhatChanged: typeof useWhatChanged;
    elements: typeof UI;
};
/**
 *  Definition of an extended HTML element type.
 */
export interface TypeHTMLElement extends HTMLElement {
    webkitRequestFullscreen: () => void;
    msRequestFullscreen: () => void;
    mozRequestFullScreen: () => void;
}
/**
 *  Definition of an Container where components are rendered.
 */
export type TypeContainerBox = 'appBar' | 'footerBar';
