import type React from 'react';
import type { createRoot } from 'react-dom/client';
import type * as translate from 'react-i18next';
import type { useTheme } from '@mui/material/styles';
import type { useMediaQuery } from '@mui/material';
import type { TypeDisplayLanguage, TypeMapFeaturesInstance } from '@/api/types/map-schema-types';
import type { API } from '@/api/api';
import type { logger } from '@/core/utils/logger';
import type { useWhatChanged } from '@/core/utils/useWhatChanged';
import type * as UI from '@/ui';
import type { AbstractPlugin } from '@/api/plugin/abstract-plugin';
import type { MapViewer } from '@/geo/map/map-viewer';
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
        cgpvs: TypeCGPV[];
        geoviewPlugins?: Record<string, typeof AbstractPlugin>;
    }
}
/**
 * Type extending the window object.
 */
export interface TypeWindow extends Window {
    /** the core */
    cgpv: TypeCGPV;
    /** plugins added to the core */
    geoviewPlugins: Record<string, typeof AbstractPlugin> | undefined;
}
export interface TypeReactUtilities {
    react: typeof React;
    createRoot: typeof createRoot;
    createElement: typeof React.createElement;
}
/**
 * Type used for exporting core.
 */
export type TypeCGPV = {
    init: () => void;
    onMapInit: MapViewerCallback;
    onMapReady: MapViewerCallback;
    api: API;
    reactUtilities: TypeReactUtilities;
    translate: typeof translate;
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
/**
 * Represents a constructor type that returns an instance of `T`.
 * This is useful when you need to pass around classes (constructors) generically,
 * such as for type assertions, factories, dependency injection, or reflection.
 * @template T - The type of the instance the constructor produces.
 */
type RegularClassType<T> = new (...args: any[]) => T;
/**
 * Represents an abstract constructor type that returns an instance of `T`.
 * This is useful when you need to pass around classes (constructors) generically,
 * such as for type assertions, factories, dependency injection, or reflection.
 * @template T - The type of the instance the constructor produces.
 */
type AbstractClassType<T> = abstract new (...args: any[]) => T;
/**
 * Represents a constructor type that returns an instance of `T`.
 * This is useful when you need to pass around classes (constructors) generically,
 * such as for type assertions, factories, dependency injection, or reflection.
 * @template T - The type of the instance the constructor produces.
 */
export type ClassType<T> = RegularClassType<T> | AbstractClassType<T>;
//# sourceMappingURL=global-types.d.ts.map