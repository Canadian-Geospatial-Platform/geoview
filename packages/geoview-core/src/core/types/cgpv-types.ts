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
  AutocompleteProps,
  TypographyProps,
  SliderProps,
  CheckboxProps,
  StepperProps,
  StepLabelProps,
  StepContentProps,
  StepProps,
  TextFieldProps,
  SelectProps,
  MenuItemProps,
  InputLabelProps,
  SelectChangeEvent,
} from '@mui/material';

import { useTheme } from '@mui/material/styles';
import makeStyles from '@mui/styles/makeStyles';

import { Plugin } from '../../api/plugin';
import { API } from '../../api/api';

import { PanelApi } from '../../ui';
import * as UI from '../../ui';

import { LEAFLET_POSITION_CLASSES } from '../../geo/utils/constant';

import { AbstractWebLayersClass } from './abstract/abstract-web-layers';
import { AbstractPluginClass } from './abstract/abstract-plugin';

export { AbstractWebLayersClass } from './abstract/abstract-web-layers';
export { AbstractPluginClass } from './abstract/abstract-plugin';

export * from '../../geo/layer/web-layers/esri/esri-dynamic';
export * from '../../geo/layer/web-layers/esri/esri-feature';
export * from '../../geo/layer/web-layers/file/geojson';
export * from '../../geo/layer/web-layers/map-tile/xyz-tiles';
export * from '../../geo/layer/web-layers/ogc/ogc_feature';
export * from '../../geo/layer/web-layers/ogc/wfs';
export * from '../../geo/layer/web-layers/ogc/wms';

export * from '../../api/events/payloads/basemap-layers-payload';
export * from '../../api/events/payloads/boolean-payload';
export * from '../../api/events/payloads/button-panel-payload';
export * from '../../api/events/payloads/cluster-element-payload';
export * from '../../api/events/payloads/in-keyfocus-payload';
export * from '../../api/events/payloads/lat-long-payload';
export * from '../../api/events/payloads/layer-config-payload';
export * from '../../api/events/payloads/map-component-payload';
export * from '../../api/events/payloads/map-config-payload';
export * from '../../api/events/payloads/map-payload';
export * from '../../api/events/payloads/marker-cluster-config-payload';
export * from '../../api/events/payloads/marker-definition-payload';
export * from '../../api/events/payloads/modal-payload';
export * from '../../api/events/payloads/number-payload';
export * from '../../api/events/payloads/panel-payload';
export * from '../../api/events/payloads/payload-base-class';
export * from '../../api/events/payloads/select-box-payload';
export * from '../../api/events/payloads/snackbar-message-payload';
export * from '../../api/events/payloads/vector-config-payload';
export * from '../../api/events/payloads/vector-payload';
export * from '../../api/events/payloads/web-layer-payload';

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
  interaction: string;
};

/*-----------------------------------------------------------------------------
 *
 * General Json type
 *
 *---------------------------------------------------------------------------*/

export type TypeJsonValue = null | string | number | boolean | TypeJsonObject[] | { [key: string]: TypeJsonObject };

export type TypeJsonArray = TypeJsonValue & TypeJsonObject[];

export type TypeJsonObject = TypeJsonValue & { [key: string]: TypeJsonObject };

export function toJsonObject(p: unknown): TypeJsonObject {
  if (!(p instanceof Object) || p instanceof Array) {
    // eslint-disable-next-line no-console
    console.log(p);
    throw new Error(`Can't convert parameter to TypeJsonObject! typeof = ${typeof p}`);
  }

  return p as TypeJsonObject;
}

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
 * ESRI Json Legend for Dynamic Layer
 */
export type TypeLegendJsonDynamic = {
  layerId: string;
  layerName: string;
  layerType: TypeWebLayers;
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
  layerData: TypeJsonArray;
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
  selectFeature: (featureData: TypeJsonObject) => void;
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
  uniqueValueInfos: TypeJsonArray;
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
 * interface used to define the vector types
 */
export type TypeOfVector = 'polyline' | 'polygon' | 'circle' | 'circle_marker' | 'marker';

/**
 * interface used to define the vector type keys
 */
export type TypeVectorKeys = 'POLYLINE' | 'POLYGON' | 'CIRCLE' | 'CIRCLE_MARKER' | 'MARKER';

/**
 * constant used to specify available vectors to draw
 */
export const CONST_VECTOR_TYPES: Record<TypeVectorKeys, TypeOfVector> = {
  POLYLINE: 'polyline' as TypeOfVector,
  POLYGON: 'polygon' as TypeOfVector,
  CIRCLE: 'circle' as TypeOfVector,
  CIRCLE_MARKER: 'circle_marker' as TypeOfVector,
  MARKER: 'marker' as TypeOfVector,
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

export type TypeMapControls = {
  boxZoom: boolean;
  selectBox: boolean;
};

export type TypeMapInitialView = {
  zoom: number;
  center: L.LatLngTuple;
};

export type TypeProjections = 3978 | 3857;

/**
 * interface for basemap options
 */
export type TypeBasemapOptions = {
  id: 'transport' | 'shaded' | 'label' | 'simple';
  shaded: boolean;
  labeled: boolean;
};

/**
 * interface used when adding a new layer
 */
export interface TypeLayerConfig extends TypeBaseWebLayersConfig {
  state?: TypeLayerSettings;
}

export type TypeLayerSettings = {
  opacity: number;
  visibility: boolean;
  boundingBox: boolean;
  query: boolean;
};

export type TypeDetailsLayerSettings = {
  parser?: string;
  template: TypeLangString;
};

export interface TypeBasicLayer extends TypeLayerConfig {
  metadataUrl?: TypeLangString;
  details?: TypeDetailsLayerSettings;
}

export interface TypeFeatureLayer extends TypeLayerConfig {
  metadataUrl?: TypeLangString;
  details?: TypeDetailsLayerSettings;
  nameField?: string;
  tooltipField?: string;
  outfields?: string;
}

export type TypeDynamicLayerEntry = {
  index: number;
  name?: TypeLangString;
  nameField?: string;
  outfields?: string;
};

export interface TypeDynamicLayer extends TypeLayerConfig {
  metadataUrl?: TypeLangString;
  details?: TypeDetailsLayerSettings;
  layerEntries: TypeDynamicLayerEntry[];
}

export interface TypeGeoJSONLayer extends TypeLayerConfig {
  nameField?: string;
  tooltipField?: string;
  renderer?: TypeJsonObject;
  details?: TypeDetailsLayerSettings;
}

export type TypeOgcLayerEntry = {
  id: string;
  name?: TypeLangString;
  state?: TypeLayerSettings;
};

export interface TypeWFSLayer extends TypeLayerConfig {
  nameField?: string;
  layerEntries: TypeOgcLayerEntry[];
  tooltipField?: string;
  renderer?: TypeJsonObject;
  details?: TypeDetailsLayerSettings;
}

export interface TypeWMSLayer extends TypeLayerConfig {
  metadataUrl?: TypeLangString;
  layerEntries: TypeOgcLayerEntry[];
  details?: TypeDetailsLayerSettings;
}

export interface TypeGeometryEndpointLayer extends TypeLayerConfig {
  name: TypeLangString;
  nameField?: string;
  tooltipField?: string;
  renderer?: TypeJsonObject;
  details?: TypeDetailsLayerSettings;
}

export interface TypeGeoCoreLayer extends Omit<TypeLayerConfig, 'url'> {
  id: string;
  url?: string;
}

export interface TypeXYZTiles extends TypeLayerConfig {
  // may seems useless, but ensure attribute defined as TypeXYZTiles keeps its native type
  state?: TypeLayerSettings;
}

export interface TypeOgcFeatureLayer extends TypeLayerConfig {
  metadataUrl?: TypeLangString;
  layerEntries: TypeOgcLayerEntry[];
  details?: TypeDetailsLayerSettings;
}

export type TypeInteraction = 'static' | 'dynamic';

export type TypeMapConfig = {
  interaction: TypeInteraction;
  controls?: TypeMapControls;
  initialView: TypeMapInitialView;
  projection: number;
  basemapOptions: TypeBasemapOptions;
  layers?: TypeLayerConfig[];
};

export type TypeLangString = {
  en: string;
  fr: string;
};

export type TypeAppBarProps = {
  about: TypeLangString;
};

export type TypeNavBarProps = TypeJsonObject;

export type TypeNorthArrowProps = TypeJsonObject;

export type TypeMapComponents = 'appbar' | 'navbar' | 'northArrow';

export type TypeMapCorePackages = 'overview-map' | 'basemap-switcher' | 'layers-panel' | 'details-panel' | 'geolocator';

export type TypeExternalPackages = {
  name: string;
  configUrl?: string;
};

export type TypeServiceUrls = {
  keys: string;
};

export type TypeLanguages = 'en' | 'fr';
export type TypeLocalizedLanguages = 'en-CA' | 'fr-CA';

export type TypeMapSchemaProps = {
  map: TypeMapConfig;
  theme?: 'dark' | 'light';
  appBar?: TypeAppBarProps;
  navBar?: TypeNavBarProps;
  northArrow?: TypeNorthArrowProps;
  components?: TypeMapComponents[];
  corePackages?: TypeMapCorePackages[];
  externalPackages?: TypeExternalPackages[];
  serviceUrls?: TypeServiceUrls;
  languages: TypeLocalizedLanguages[];
  version?: string;
  extraOptions: TypeJsonObject;
};

/**
 * Interface used when creating a map to validate configuration object
 */
export interface TypeMapConfigProps extends TypeMapSchemaProps {
  id: string;
  language: TypeLocalizedLanguages;
}

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
 * Interface used to initialize a snackbar message
 */
export type TypeSnackbarMessage = {
  type: string;
  value: string;
  params?: TypeJsonArray;
};

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
  tooltip?: string;
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
  // panel id
  id?: string;
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
 * Customized Material UI Autocomplete properties
 */
export interface TypeAutocompleteProps<
  T,
  Multiple extends boolean | undefined = undefined,
  DisableClearable extends boolean | undefined = undefined,
  FreeSolo extends boolean | undefined = undefined
> extends AutocompleteProps<T, Multiple, DisableClearable, FreeSolo> {
  mapId?: string;
  fullWidth?: boolean;
}

/**
 * Custom Material UI Typography properties
 */
export interface TypeTypographyProps extends TypographyProps {
  mapId?: string;
}

/**
 * Custom MUI slider properties
 */
export interface TypeSliderProps extends SliderProps {
  mapId?: string;
}

/**
 * Custom MUI Checkbox properties
 */
export interface TypeCheckboxProps extends CheckboxProps {
  mapId?: string;
}

/**
 * Custom MUI Tooltip properties
 */
export interface TypeTooltipProps extends TooltipProps {
  mapId?: string;
}

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

export type TypeSelectChangeEvent<unkown> = SelectChangeEvent<unkown>;

/**
 * Required and optional properties for the items (options) of select
 */
export interface TypeSelectItems {
  category?: string;
  items: Array<TypeItemProps>;
}

/**
 * Custom MUI Select properties
 */
export interface TypeSelectProps extends SelectProps {
  mapId?: string;
  fullWidth?: boolean;
  menuItems: (MenuItemProps | null)[];
  inputLabel: InputLabelProps;
}

/**
 * Properties for the Custom Select component
 */
export interface TypeCustomSelectProps {
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
 * Object that holds a step of a stepper component
 */
export interface TypeStep {
  id?: string | null;
  stepLabel?: StepLabelProps;
  stepContent?: StepContentProps;
  props?: StepProps;
}

/**
 * Custom MUI Stepper Props
 */
export interface TypeStepperProps extends StepperProps {
  mapId?: string;
  steps: (TypeStep | null)[];
}

/**
 * Properties for the Custom Stepper
 */
export interface TypeCustomStepperProps {
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
 * Custom Material UI Textfield properties
 */
export type TypeTextFieldProps = TextFieldProps & { mapId?: string };

/**
 * Customized Material UI Custom TextField Properties
 */
export interface TypeCustomTextFieldProps extends Omit<BaseTextFieldProps, 'prefix'> {
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
export type TypeWebLayers = 'esriDynamic' | 'esriFeature' | 'geojson' | 'geoCore' | 'xyzTiles' | 'ogcFeature' | 'ogcWfs' | 'ogcWms';
export type LayerTypesKey = 'ESRI_DYNAMIC' | 'ESRI_FEATURE' | 'GEOJSON' | 'GEOCORE' | 'XYZ_TILES' | 'OGC_FEATURE' | 'WFS' | 'WMS';

/**
 * constant contains layer types
 */
export const CONST_LAYER_TYPES: Record<LayerTypesKey, TypeWebLayers> = {
  ESRI_DYNAMIC: 'esriDynamic',
  ESRI_FEATURE: 'esriFeature',
  GEOJSON: 'geojson',
  GEOCORE: 'geoCore',
  XYZ_TILES: 'xyzTiles',
  OGC_FEATURE: 'ogcFeature',
  WFS: 'ogcWfs',
  WMS: 'ogcWms',
};

/**
 * constant contains default layer names
 */
export const DEFAULT_LAYER_NAMES: Record<TypeWebLayers, string> = {
  esriDynamic: 'Esri Dynamic Layer',
  esriFeature: 'Esri Feature Layer',
  geojson: 'GeoJson Layer',
  geoCore: 'GeoCore Layer',
  xyzTiles: 'XYZ Tiles',
  ogcFeature: 'OGC Feature Layer',
  ogcWfs: 'WFS Layer',
  ogcWms: 'WMS Layer',
};

/**
 * interface used by all web layers
 */
export type TypeBaseWebLayersConfig = {
  layerType: TypeWebLayers;
  id?: string;
  name?: TypeLangString;
  url: TypeLangString;
  layerEntries?: (TypeDynamicLayerEntry | TypeOgcLayerEntry)[];
};

/**
 * interface used by all plugins to define their options
 */
export type TypePluginOptions = {
  mapId: string;
};

/**
 * constant/interface used to define the precision for date object (yyyy, mm, dd)
 */
export const DEFAULT_DATE_PRECISION = {
  year: 'YYYY',
  month: 'YYYY-MM',
  day: 'YYYY-MM-DD',
};
export type DatePrecision = 'year' | 'month' | 'day';

/**
 * constant/interface used to define the precision for time object (hh, mm, ss)
 */
export const DEFAULT_TIME_PRECISION = {
  hour: 'THHZ',
  minute: 'THH:MMZ',
  second: 'THH:MM:SSZ',
};
export type TimePrecision = 'hour' | 'minute' | 'second';
