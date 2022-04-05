import React, { CSSProperties } from 'react';

import { useTranslation } from 'react-i18next';

import * as ReactLeaflet from 'react-leaflet';
import * as ReactLeafletCore from '@react-leaflet/core';

import L from 'leaflet';

import {
  TooltipProps,
  ButtonProps,
  ButtonGroupProps,
  CircularProgressProps,
  DividerProps,
  DrawerProps,
  FadeProps,
  IconButtonProps,
  ListItemProps,
  ListProps,
  DialogProps,
  BaseTextFieldProps,
  useMediaQuery,
} from '@mui/material';

import { useTheme } from '@mui/material/styles';
import makeStyles from '@mui/styles/makeStyles';

import * as MUI from '@mui/material';

import { Plugin } from '../../api/plugin';
import { API } from '../../api/api';

import { PanelApi } from '../../ui';
import * as UI from '../../ui';

import { LEAFLET_POSITION_CLASSES } from '../../geo/utils/constant';

import { AbstractWebLayersClass } from './abstract/abstract-web-layers';
import { AbstractPluginClass } from './abstract/abstract-plugin';

export { AbstractWebLayersClass } from './abstract/abstract-web-layers';
export { AbstractPluginClass } from './abstract/abstract-plugin';

export { EsriDynamic } from '../../geo/layer/web-layers/esri/esri-dynamic';
export { EsriFeature } from '../../geo/layer/web-layers/esri/esri-feature';
export { GeoJSON } from '../../geo/layer/web-layers/file/geojson';
export { XYZTiles } from '../../geo/layer/web-layers/map-tile/xyz-tiles';
export { OgcFeature } from '../../geo/layer/web-layers/ogc/ogc_feature';
export { WFS } from '../../geo/layer/web-layers/ogc/wfs';
export { WMS } from '../../geo/layer/web-layers/ogc/wms';
export * from './material-ui.d';

declare global {
  interface Window {
    cgpv: TypeCGPV;
    plugins: Record<string, unknown>;
  }
}

export function Cast<TargetType = never>(p: unknown): TargetType {
  return p as TargetType;
}

export interface TypeWindow extends Window {
  cgpv: TypeCGPV;
  plugins: { [pluginId: string]: ((pluginId: string, props: TypeJsonValue) => TypeJsonValue) | AbstractPluginClass | undefined };
}

export type TypeCGPVUI = {
  useTheme: typeof useTheme;
  useMediaQuery: typeof useMediaQuery;
  makeStyles: typeof makeStyles;
  elements: typeof UI;
};

export type TypeCGPVMUI = {
  Stepper: typeof MUI.Stepper;
  Step: typeof MUI.Step;
  StepLabel: typeof MUI.StepLabel;
  StepContent: typeof MUI.StepContent;
  TextField: typeof MUI.TextField;
  Typography: typeof MUI.Stepper;
  InputLabel: typeof MUI.InputLabel;
  FormControl: typeof MUI.FormControl;
  Select: typeof MUI.Select;
  MenuItem: typeof MUI.MenuItem;
  Autocomplete: typeof MUI.Autocomplete;
  Slider: typeof MUI.Slider;
  Tooltip: typeof MUI.Tooltip;
  Checkbox: typeof MUI.Checkbox;
};

export type TypeCGPVConstants = {
  leafletPositionClasses: typeof LEAFLET_POSITION_CLASSES;
};

export type TypeCGPV = {
  init: TypeCallback;
  api: TypeApi;
  react: typeof React;
  leaflet: typeof L;
  reactLeaflet: typeof ReactLeaflet;
  reactLeafletCore: typeof ReactLeafletCore;
  mui?: typeof MUI;
  ui: TypeCGPVUI;
  useTranslation: typeof useTranslation;
  // eslint-disable-next-line @typescript-eslint/ban-types
  types: Object;
  constants: TypeCGPVConstants;
};

export type TypeCallback = (callback: () => void) => void;

export type TypeFunction = () => void;

// export interface TypeApi extends API, Event, Projection, Plugin {} //#427
export interface TypeApi extends API, Event, Plugin {}

export interface TypeCSSStyleDeclaration extends CSSStyleDeclaration {
  mozTransform: string;
}

export type TypeChildren = React.ReactNode;

/**
 * Map context
 */
export type TypeMapContext = {
  id: string;
};

/*-----------------------------------------------------------------------------
 *
 * General Json type
 *
 *---------------------------------------------------------------------------*/

export type TypeJsonString = TypeJsonValue & string;
export type TypeJsonNumber = TypeJsonValue & number;
export type TypeJsonBoolean = TypeJsonValue & boolean;
export type TypeJsonArrayOfString = TypeJsonValue & string[];
export type TypeJsonArray = TypeJsonValue & TypeJsonValue[];
export type TypeJsonObjectArray = TypeJsonValue & (TypeJsonObject[] | TypeJsonObject[]);

export type TypeJsonValue =
  | null
  | string
  | number
  | boolean
  | TypeJsonValue[]
  | { [key: string]: TypeJsonValue }
  | { [key: string]: TypeJsonObject };

export type TypeJsonObject = {
  [key: string]: TypeJsonObject;
};

/*-----------------------------------------------------------------------------
 *
 * Marker Cluster Types
 *
 *---------------------------------------------------------------------------*/

// icon creation function prototype for stamped markers
export type TypeStampedIconCreationFunction = (Stamp: string) => L.DivIcon;

// icon creation function prototype for empty markers
export type TypeIconCreationFunction = () => L.DivIcon;

/**
 * interface used when adding a new layer
 */
export type TypeLayerConfig = {
  id?: string;
  name?: string;
  url: string;
  type: string;
  entries?: string;
};

/**
 * ESRI Json Legend for Dynamic Layer
 */
export type TypeLegendJsonDynamic = {
  layerId: string;
  layerName: string;
  layerType: string;
  maxScale: number;
  minScale: number;
  legend: {
    contentType: string;
    height: number;
    imageData: string;
    label: string;
    url: string;
    width: number;
  }[];
  extent: {
    xmin: number;
    ymin: number;
    xmax: number;
    ymax: number;
    spatialReference: {
      wkid: number;
      latestWkid: number;
    };
  };
};

export type TypeLayersInWebLayer = Record<string, TypeLayersEntry>;

export type TypeLayersEntry = {
  layerData: TypeJsonObject[];
  groupLayer: boolean;
  displayField: string;
  fieldAliases: TypeJsonValue;
  layer: TypeLayerInfo;
  entries?: TypeEntry[];
  renderer: TypeRendererSymbol;
};

export type TypeEntry = {
  attributes: TypeJsonObject;
};

export type TypeLayerInfo = {
  id: string;
  name: string;
  displayField: string;
  displayFieldName: string;
  drawingInfo: {
    renderer: TypeRendererSymbol;
  };
  fields: TypeFieldNameAliasArray;
};

export type TypeFieldNameAliasArray = {
  name: string;
  alias: string;
}[];

export type TypeFieldAlias = { [name: string]: string };

export type TypeFoundLayers = {
  layer: TypeLayersEntry;
  entries: TypeEntry[];
};

/**
 * Interface used for the Features List properties
 */
export type TypeFeaturesListProps = {
  buttonPanel: TypeButtonPanel;
  getSymbol: (renderer: TypeRendererSymbol, attributes: TypeJsonObject) => TypeJsonObject | null;
  selectFeature: (featureData: TypeJsonValue) => void;
  selectLayer: (layerData?: TypeLayersEntry) => void;
  // eslint-disable-next-line @typescript-eslint/ban-types
  selectedLayer: TypeLayersEntry | {};
  setPanel: (showLayersList: boolean, showFeaturesList: boolean, showFeaturesInfo: boolean) => void;
};

export type TypeRendererSymbol = {
  symbol: {
    contentType: string;
    label: string;
    legendImageUrl: string;
    type: 'simple' | 'uniqueValue';
  };
  uniqueValueInfos: TypeJsonObject[];
  field1: string;
  field2: string;
  field3: string;
};

/**
 * interface used when creating the actual plugin
 */
export type TypePluginStructure = {
  // id of the plugin
  id: string;
  api: API;
  createElement: typeof React.createElement;
  react: typeof React;
  props: TypeJsonValue;
  translate: TypeJsonValue;
  translations: TypeJsonObject;
  makeStyles: typeof makeStyles;
  added?: () => void;
  removed?: () => void;
};

export type TypeRecordOfPlugin = {
  [MapId: string]: { [pluginId: string]: TypePluginStructure };
};

/**
 * constant used to specify available vectors to draw
 */
export const CONST_VECTOR_TYPES = {
  POLYLINE: 'polyline',
  POLYGON: 'polygon',
  CIRCLE: 'circle',
  CIRCLE_MARKER: 'circle_marker',
  MARKER: 'marker',
};

/**
 * Interface for panel properties
 */
export type TypePanelAppProps = {
  panel: PanelApi;
  //   panelOpen: boolean;
  button: TypeButtonProps;
};

/**
 * Feature info properties
 */
export type TypeFeatureInfoProps = {
  buttonPanel: TypeButtonPanel;
  selectedFeature: TypeSelectedFeature;
  setPanel: (showLayersList: boolean, showFeaturesList: boolean, showFeaturesInfo: boolean) => void;
};

export type TypeSelectedFeature = {
  attributes: TypeJsonObject;
  displayField: TypeJsonObject;
  fieldAliases: TypeJsonObject;
  numOfEntries: number;
  symbol: TypeJsonObject;
};

/**
 * interface for the layers list properties in details panel
 */
export type TypeLayersListProps = {
  clickPos?: L.LatLng;
  getSymbol: (renderer: TypeRendererSymbol, attributes: TypeJsonObject) => TypeJsonObject | null;
  layersData: Record<string, AbstractWebLayersClass>;
  mapId: string;
  selectFeature: (featureData: TypeJsonObject) => void;
  selectLayer: (layerData?: TypeLayersEntry) => void;
};

/**
 * interface for the layers list properties in layers panel
 */
export type TypeLayersPanelListProps = {
  mapId: string;
  layers: Record<string, AbstractWebLayersClass>;
  language: string;
};

/**
 * Interface used for the panel content
 */
export type TypePanelContentProps = {
  buttonPanel: TypeButtonPanel;
  mapId: string;
};

/**
 * Interface used when creating a map to validate configuration object
 */
export type TypeMapConfigProps = {
  id: string;
  name?: string;
  center: L.LatLngTuple;
  zoom: number;
  projection: number;
  language: string;
  selectBox: boolean;
  boxZoom: boolean;
  basemapOptions: TypeBasemapOptions;
  layers?: TypeLayerConfig[];
  plugins: string[];
  extraOptions: TypeJsonValue;
};

/**
 * interface for basemap options
 */
export type TypeBasemapOptions = {
  id: string;
  shaded: boolean;
  labeled: boolean;
};

/**
 * interface for basemap basic properties
 */
export type TypeBasemapLayerOptions = {
  tms: boolean;
  tileSize: number;
  attribution: boolean;
  noWrap: boolean;
};

/**
 * interface used to define a new basemap layer
 */
export type TypeBasemapLayer = {
  id: string;
  url: string;
  type: string;
  options: TypeBasemapLayerOptions;
  opacity: number;
  basemapPaneName: string;
};

/**
 * interface used to define zoom levels for a basemap
 */
export type TypeZoomLevels = {
  min: number;
  max: number;
};

/**
 * interface for attribution value
 */
export type TypeAttribution = {
  'en-CA': string;
  'fr-CA': string;
};

/**
 * interface used to define a new basemap
 */
export type TypeBasemapProps = {
  id?: string;
  name: string;
  type: string;
  description: string;
  descSummary: string;
  altText: string;
  thumbnailUrl: string | Array<string>;
  layers: TypeBasemapLayer[];
  attribution: string;
  zoomLevels: TypeZoomLevels;
};

/**
 * An object containing version information.
 *
 * @export
 * @interface TypeAppVersion
 */
export type TypeAppVersion = {
  hash: string;
  major: number;
  minor: number;
  patch: number;
  timestamp: string;
};

/**
 * constant that defines the panel types
 */
export const CONST_PANEL_TYPES = {
  APPBAR: 'appbar',
  NAVBAR: 'navbar',
};

/*-----------------------------------------------------------------------------
 *
 * UI Types
 *
 *---------------------------------------------------------------------------*/

/**
 * Interface used to initialize a button panel
 */
export type TypeButtonPanelProps = {
  panel: TypePanelProps;
  button: TypeButtonProps;
};

/**
 * Interface used when creating a new button panel
 */
export type TypeButtonPanel = {
  id: string;
  panel?: PanelApi;
  button: TypeButtonProps;
  groupName?: string;
};

/**
 * Interface for the button properties used when creating a new button
 */
export interface TypeButtonProps extends Omit<ButtonProps, 'type'> {
  // generated button id
  id?: string;
  // button tooltip
  tooltip?: string | TypeJsonValue;
  // location for tooltip
  tooltipPlacement?: TooltipProps['placement'];
  // button icon
  icon?: TypeChildren;
  // optional class names
  iconClassName?: string;
  // optional class names
  textClassName?: string;
  // button state
  state?: 'expanded' | 'collapsed';
  // button type
  type: 'text' | 'textWithIcon' | 'icon';
  // button visibility
  visible?: boolean;
}

/**
 * type for the panel properties used when creating a new panel
 */
export type TypePanelProps = {
  // panel type (appbar, navbar)
  type?: string;
  // panel open status (open/closed)
  status?: boolean;
  // width of the panel
  width: string | number;
  // panel header icon
  icon: React.ReactNode | Element;
  // panel header title
  title: string | TypeJsonValue;
  // panel body content
  content?: React.ReactNode | Element;
};

/**
 * Button Group properties
 */
export type TypeButtonGroupProps = ButtonGroupProps;

/**
 * Circular Progress Properties
 */
export interface TypeCircularProgressProps extends CircularProgressProps {
  className?: string;
  style?: CSSProperties;
  isLoaded: boolean;
}

/**
 * Properties for the Divider
 */
export interface TypeDividerProps extends DividerProps {
  orientation?: 'horizontal' | 'vertical';
  grow?: boolean;
}

/**
 * Drawer Properties
 */
export interface TypeDrawerProps extends DrawerProps {
  status?: boolean;
}

/**
 * Properties for the Fade element
 */
export type TypeFadeProps = FadeProps;

/**
 * Properties for the icon button
 */
export interface TypeIconButtonProps extends IconButtonProps {
  children?: TypeChildren;
  tooltip?: string;
  tooltipPlacement?: TooltipProps['placement'];
  id?: string;
  tabIndex?: number;
  iconRef?: React.RefObject<HTMLButtonElement>;
}

/**
 * Properties for the List UI
 */
export interface TypeListProps extends ListProps {
  type?: 'ul' | 'ol';
}

/**
 * List item properties
 */
export type TypeListItemProps = ListItemProps;

/**
 * Customized Material UI Dialog Properties
 */
export interface TypeDialogProps extends Omit<DialogProps, 'title'> {
  id?: string;

  // custom dialog classes and styles
  className?: string;
  style?: CSSProperties;

  // custom title
  title?: TypeChildren;
  titleId?: string;

  // dialog content and content styling
  content?: TypeChildren;
  contentClassName?: string;
  contentStyle?: CSSProperties;

  // dialog text content container styling
  contentTextId?: string;
  contentTextClassName?: string;
  contentTextStyle?: CSSProperties;

  // action elements / buttons
  actions?: TypeChildren;

  // id of the map that is using this modal
  mapId: string;
}

/**
 * Required and optional properties for the item object
 */
export interface TypeItemProps {
  id: string;
  value: string;
  default?: boolean;
}

/**
 * Required and optional properties for the items (options) of select
 */
export interface TypeSelectItems {
  category?: string;
  items: Array<TypeItemProps>;
}

/**
 * Properties for the Select component
 */
export interface TypeSelectProps {
  id: string;
  className?: string;
  style?: CSSProperties;

  // the label for the select component
  label: string;

  // the menu items (<option>) for <select>
  selectItems: Array<Record<string, TypeSelectItems>> | Array<Record<string, TypeItemProps>>;

  // callback that is passed for the select component
  callBack?: <T>(params: T) => void;

  // helper text for the form
  helperText?: string;

  // if multiple selection of items is allowed
  multiple?: boolean;
}

/**
 * Properties for the Steps of Stepper
 */
export interface TypeStepperSteps {
  // the text label for the step
  label?: string;

  // the body of the step
  description: JSX.Element | HTMLElement | string;

  // whether the user is allowed to move to the next step or not
  disableStepMovement?: boolean;
}

/**
 * Properties for the Stepper
 */
export interface TypeStepperProps {
  id: string;
  className?: string;
  style?: CSSProperties;

  // orientaion of the Stepper component. By default, its horizontal
  orientation?: 'horizontal' | 'vertical';

  // alternative label for the steps. Alternative labels appear at the bottom of step icons
  alternativeLabel?: boolean;

  // allows the user to enter a multi-step flow at any point
  // i.e. previous step needs to be completed to move on to the next one
  nonLinear?: boolean;

  // to be able to switch to another step by clicking on the step's button label
  buttonedLabels?: boolean;

  // the steps that will be involved in the component
  steps?: Array<Record<string, TypeStepperSteps>>;

  // text for the back (previous) button that goes to the previous step
  backButtonText?: string;

  // text for the next button that goes to the next step
  nextButtonText?: string;

  // text for the reset button that resets the step count
  resetButtonText?: string;
}

/**
 * Customized Material UI TextField Properties
 */
export interface TypeTextFieldProps extends Omit<BaseTextFieldProps, 'prefix'> {
  id: string;

  // the helper text (as defined above) but only if there is an error
  errorHelpertext?: string | undefined;

  // the HTML Element (for example, an icon) that is embedded inside the text field (left side)
  prefix?: string | JSX.Element | HTMLElement | TypeChildren;

  // the HTML Element (for example, an icon) that is embedded inside the text field (right side)
  suffix?: string | JSX.Element | HTMLElement | undefined;

  // Function that handles change in input
  changeHandler?: <T>(params: T) => void;
}

/*-----------------------------------------------------------------------------
 *
 * Types related to abstract class
 *
 *---------------------------------------------------------------------------*/

// AbstractWebLayersClass types

/**
 * interface used to define the web-layers
 */
export type TypeWebLayers = 'esriDynamic' | 'esriFeature' | 'geoJSON' | 'xyzTiles' | 'ogcFeature' | 'ogcWFS' | 'ogcWMS';

/**
 * constant contains layer types
 */
export const CONST_LAYER_TYPES = {
  WMS: 'ogcWMS' as TypeWebLayers,
  GEOJSON: 'geoJSON' as TypeWebLayers,
  ESRI_DYNAMIC: 'esriDynamic' as TypeWebLayers,
  ESRI_FEATURE: 'esriFeature' as TypeWebLayers,
  XYZ_TILES: 'xyzTiles' as TypeWebLayers,
  WFS: 'ogcWFS' as TypeWebLayers,
  OGC_FEATURE: 'ogcFeature' as TypeWebLayers,
};

/**
 * interface used by all web layers
 */
export type TypeAbstractWebLayersConfig = {
  id?: string;
  name?: string;
  url: string;
};

// AbstractWebLayersClass types

/**
 * interface used by all plugins to define their options
 */
export type TypePluginOptions = {
  mapId: string;
};
