import React from 'react';
import ReactDOM from 'react-dom';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { useMediaQuery } from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';
import { API } from '../../api/api';
import * as UI from '../../ui';
import { AbstractPlugin } from '../../api/plugin/abstract-plugin';
import { TypeDisplayLanguage, TypeMapFeaturesInstance } from '../../geo/map/map-schema-types';
export type { SelectChangeEvent } from '@mui/material';
export type { Coordinate } from 'ol/coordinate';
/** ******************************************************************************************************************************
 * Definition of the map feature configuration according to what can be specified in the map div and in the schema for the
 * type extension TypeMapFeaturesInstance.
 */
export interface TypeMapFeaturesConfig extends TypeMapFeaturesInstance {
    /** This attribute is not part of the schema. It is placed here to keep the 'id' attribute of the HTML div of the map. */
    mapId?: string;
    /** This attribute is not part of the schema. It is placed here to keep the 'data-lang' attribute of the HTML div of the map. */
    displayLanguage?: TypeDisplayLanguage;
    /** If true, the ready callback 'cgpv.init(mapId)' is called with the mapId as a parameter when the map is ready */
    triggerReadyCallback?: boolean;
}
/** ******************************************************************************************************************************
 *  Definition of a global Window type.
 */
declare global {
    interface Window {
        cgpv: TypeCGPV;
        plugins: Record<string, unknown>;
    }
}
/** ******************************************************************************************************************************
 * Type extending the window object.
 */
export interface TypeWindow extends Window {
    /** the core */
    cgpv: TypeCGPV;
    /** plugins added to the core */
    plugins: {
        [pluginId: string]: ((pluginId: string, props: TypeJsonValue) => TypeJsonValue) | AbstractPlugin | undefined;
    };
}
/** ******************************************************************************************************************************
 * Type used for exporting core.
 */
export type TypeCGPV = {
    init: TypeCallback;
    api: TypeApi;
    react: typeof React;
    reactDOM: typeof ReactDOM;
    ui: TypeCGPVUI;
    useTranslation: typeof useTranslation;
    types: typeof import('./cgpv-types');
};
/** ******************************************************************************************************************************
 * Type used for a callback function.
 */
export type TypeCallback = (callback: () => void) => void;
/** ******************************************************************************************************************************
 * Interface TypeApi extends API, Event, Projection, Plugin {} // #427
 */
export interface TypeApi extends API, Event, Plugin {
}
/** ******************************************************************************************************************************
 * Type used for exporting UI
 */
export type TypeCGPVUI = {
    useTheme: typeof useTheme;
    useMediaQuery: typeof useMediaQuery;
    makeStyles: typeof makeStyles;
    elements: typeof UI;
};
/** ******************************************************************************************************************************
 * Cast a variable to a different type
 *
 * @param {unkown} p a variable to cast to
 *
 * @returns the casted variable as the new type
 */
export declare function Cast<TargetType = never>(p: unknown): TargetType;
/**
 * Type used for a value within a json object
 */
export type TypeJsonValue = null | string | number | boolean | TypeJsonObject[] | {
    [key: string]: TypeJsonObject;
};
/** ------------------------------------------------------------------------------------------------------------------------------
 * Type used for an array of objects
 */
export type TypeJsonArray = TypeJsonValue & TypeJsonObject[];
/** ------------------------------------------------------------------------------------------------------------------------------
 * Type used for a json object
 */
export type TypeJsonObject = TypeJsonValue & {
    [key: string]: TypeJsonObject;
};
/** ------------------------------------------------------------------------------------------------------------------------------
 * Convert a type of a variable to json object
 *
 * @param {unkown} p an object to convert its type to a json object
 *
 * @returns the variable with the type converted to a json object
 */
export declare function toJsonObject(p: unknown): TypeJsonObject;
/** ******************************************************************************************************************************
 *  Definition of an extended HTML element type.
 */
export interface TypeHTMLElement extends HTMLElement {
    webkitRequestFullscreen: () => void;
    msRequestFullscreen: () => void;
    mozRequestFullScreen: () => void;
}
