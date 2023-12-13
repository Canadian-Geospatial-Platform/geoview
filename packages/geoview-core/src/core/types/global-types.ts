import React from 'react';
import { createRoot } from 'react-dom/client';

import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { useMediaQuery } from '@mui/material';
import { API } from '@/api/api';
import * as UI from '../../ui';
import { AbstractPlugin } from '@/api/plugin/abstract-plugin';
import { TypeDisplayLanguage, TypeMapFeaturesInstance } from '@/geo/map/map-schema-types';

export * from 'zustand';
export { getGeoViewStore } from '@/core/stores/stores-managers';
export { isEqual } from 'lodash';
export type { MutableRefObject, RefObject, Dispatch, SetStateAction } from 'react';
export type { TypeArrayOfLayerData, TypeLayerData, TypeFeatureInfoEntry, TypeFeatureInfoEntryPartial } from '@/api/events/payloads';
export type { TypeRegisteredLayers } from '@/geo/layer/layer';
export type { ButtonPropsLayerPanel } from '@/ui/panel/panel-types';
export type { AbstractGeoViewLayer } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
export type { AbstractGeoViewRaster } from '@/geo/layer/geoview-layers/raster/abstract-geoview-raster';
export type { AbstractGeoViewVector } from '@/geo/layer/geoview-layers/vector/abstract-geoview-vector';
export type { TypeGeoviewLayerType } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
export type { TypeGeoviewLayerConfig, TypeListOfLayerEntryConfig, TypeLayerEntryConfig } from '@/geo/map/map-schema-types';
export type { TypeValidMapProjectionCodes } from '@/geo/map/map-schema-types';
export type { TypeBasemapOptions } from '@/geo/layer/basemap/basemap-types';
export type { TypeViewSettings } from '@/geo/map/map-schema-types';
export type { TypeBasemapProps } from '@/geo/layer/basemap/basemap-types';
export type { TypeIconButtonProps } from '@/ui/icon-button/icon-button-types';
export type { TypeButtonPanel, TypePanelProps } from '@/ui/panel/panel-types';
export type { TypePluginOptions } from '@/api/plugin/abstract-plugin';
export type { SelectChangeEvent } from '@mui/material';
export type { Coordinate } from 'ol/coordinate';
export type { TypeAllQueriesDonePayload, MapMouseEventPayload, TypeArrayOfFeatureInfoEntries } from '@/api/events/payloads';
export type { TypeTabs } from '@/ui/tabs/tabs';

export {
  snackbarMessagePayload,
  mapViewProjectionPayload,
  PayloadBaseClass,
  payloadIsALayerConfig,
  payloadIsRemoveGeoViewLayer,
  payloadIsASnackbarMessage,
  payloadIsAMapMouseEvent,
  payloadIsAllQueriesDone,
} from '@/api/events/payloads';
export { geoviewLayerIsWMS } from '@/geo/layer/geoview-layers/raster/wms';
export { geoviewLayerIsEsriDynamic } from '@/geo/layer/geoview-layers/raster/esri-dynamic';
export { geoviewLayerIsEsriFeature } from '@/geo/layer/geoview-layers/vector/esri-feature';
export { AbstractPlugin } from '@/api/plugin/abstract-plugin';

/** ******************************************************************************************************************************
 * Definition of the map feature configuration according to what can be specified in the map div and in the schema for the
 * type extension TypeMapFeaturesInstance.
 */
export interface TypeMapFeaturesConfig extends TypeMapFeaturesInstance {
  /** This attribute is not part of the schema. It is placed here to keep the 'id' attribute of the HTML div of the map. */
  mapId: string;
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
  plugins: { [pluginId: string]: ((pluginId: string, props: TypeJsonValue) => TypeJsonValue) | AbstractPlugin | undefined };
}

/** ******************************************************************************************************************************
 * Type used for exporting core.
 */
export type TypeCGPV = {
  init: TypeCallback;
  api: API;
  react: typeof React;
  createRoot: typeof createRoot;
  ui: TypeCGPVUI;
  useTranslation: typeof useTranslation;
  types: typeof import('./cgpv-types');
};

/** ******************************************************************************************************************************
 * Type used for a callback function.
 */
export type TypeCallback = (callback: () => void) => void;

/** ******************************************************************************************************************************
 * Type used for exporting UI
 */
export type TypeCGPVUI = {
  useTheme: typeof useTheme;
  useMediaQuery: typeof useMediaQuery;
  elements: typeof UI;
};

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

/** ******************************************************************************************************************************
 *  Definition of an extended HTML element type.
 */
export interface TypeHTMLElement extends HTMLElement {
  webkitRequestFullscreen: () => void;
  msRequestFullscreen: () => void;
  mozRequestFullScreen: () => void;
}
