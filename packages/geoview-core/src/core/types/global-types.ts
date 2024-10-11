import React from 'react';
import { createRoot } from 'react-dom/client';

import { useTheme } from '@mui/material/styles';
import { useMediaQuery } from '@mui/material';
import { TypeDisplayLanguage } from '@config/types/map-schema-types';
import { API } from '@/api/api';
import { logger } from '@/core/utils/logger';
import { useWhatChanged } from '@/core/utils/useWhatChanged';
import * as UI from '@/ui';
import { AbstractPlugin } from '@/api/plugin/abstract-plugin';
import { TypeMapFeaturesInstance } from '@/geo/map/map-schema-types';

export { getGeoViewStore } from '@/core/stores/stores-managers';

export type { SelectChangeEvent } from '@mui/material';
export type { AnySchemaObject } from 'ajv';

/** ******************************************************************************************************************************
 * Definition of the map feature configuration according to what can be specified in the map div and in the schema for the
 * type extension TypeMapFeaturesInstance.
 */
export interface TypeMapFeaturesConfig extends TypeMapFeaturesInstance {
  // TODO: refactor - once new config is finished, change to extend MapFeatureConfig from @config
  /** This attribute is not part of the schema. It is placed here to keep the 'id' attribute of the HTML div of the map. */
  mapId: string;
  /** This attribute is not part of the schema. It is placed here to keep the 'data-lang' attribute of the HTML div of the map. */
  displayLanguage?: TypeDisplayLanguage;
}

/** ******************************************************************************************************************************
 *  Definition of a global Window type.
 */
declare global {
  interface Window {
    cgpv: TypeCGPV;
    geoviewPlugins: Record<string, unknown>;
  }
}

/** ******************************************************************************************************************************
 * Type extending the window object.
 */
export interface TypeWindow extends Window {
  /** the core */
  cgpv: TypeCGPV;
  /** plugins added to the core */
  geoviewPlugins: { [pluginId: string]: ((pluginId: string, props: TypeJsonValue) => TypeJsonValue) | AbstractPlugin | undefined };
}

/** ******************************************************************************************************************************
 * Type used for exporting core.
 */
export type TypeCGPV = {
  init: CGPVInitCallback;
  onMapInit: CGPVCallback;
  onMapReady: CGPVCallback;
  onLayersProcessed: CGPVCallback;
  onLayersLoaded: CGPVCallback;
  api: API;
  react: typeof React;
  createRoot: typeof createRoot;
  ui: TypeCGPVUI;
  logger: typeof logger;
};

/** ******************************************************************************************************************************
 * Type used for a callback function.
 */
export type CGPVInitCallback = (callbackMapsInit?: (mapId: string) => void, callbackMapsLayersLoaded?: (mapId: string) => void) => void;
export type CGPVCallback = (callback: (mapId: string) => void) => void;

/** ******************************************************************************************************************************
 * Type used for exporting UI
 */
export type TypeCGPVUI = {
  useTheme: typeof useTheme;
  useMediaQuery: typeof useMediaQuery;
  useWhatChanged: typeof useWhatChanged;
  elements: typeof UI;
};

// GV: CONFIG EXTRACTION
// GV: This section of code was extracted and copied to the geoview config section
// GV: |||||
// GV: vvvvv

/** ******************************************************************************************************************************
 * Cast a variable to a different type
 *
 * @param {unkown} p a variable to cast to
 *
 * @returns the casted variable as the new type
 */
export function Cast<TargetType = never>(p: unknown): TargetType {
  return p as TargetType;
}

/* *******************************************************************************************************************************
 * General Json type
 */
/**
 * Type used for a value within a json object
 */
export type TypeJsonValue = null | string | number | boolean | TypeJsonObject[] | { [key: string]: TypeJsonObject };

/** ------------------------------------------------------------------------------------------------------------------------------
 * Type used for an array of objects
 */
export type TypeJsonArray = TypeJsonValue & TypeJsonObject[];

/** ------------------------------------------------------------------------------------------------------------------------------
 * Type used for a json object
 */
export type TypeJsonObject = TypeJsonValue & { [key: string]: TypeJsonObject };

/** ------------------------------------------------------------------------------------------------------------------------------
 * Convert a type of a variable to json object
 *
 * @param {unkown} p an object to convert its type to a json object
 *
 * @returns the variable with the type converted to a json object
 */
export function toJsonObject(p: unknown): TypeJsonObject {
  if (!(p instanceof Object) || p instanceof Array) {
    throw new Error(`Can't convert parameter to TypeJsonObject! typeof = ${typeof p}`);
  }

  return p as TypeJsonObject;
}

// GV: ^^^^^
// GV: |||||

/** ******************************************************************************************************************************
 *  Definition of an extended HTML element type.
 */
export interface TypeHTMLElement extends HTMLElement {
  webkitRequestFullscreen: () => void;
  msRequestFullscreen: () => void;
  mozRequestFullScreen: () => void;
}

/** ******************************************************************************************************************************
 *  Definition of an Container where components are rendered.
 */
export type TypeContainerBox = 'appBar' | 'footerBar';
