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

export { AbstractWebLayersClass } from '../../geo/layer/web-layers/abstract-web-layers';
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
  plugins: { [pluginId: string]: ((pluginId: string, props: TypeJSONValue) => TypeJSONValue) | AbstractPluginClass | undefined };
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

export type TypeChild = React.ReactElement<never, never>;

export type TypeChildren = React.ReactNode;

/**
 * Map types
 */
export type TypeMapComponent = {
  id: string;
  component: JSX.Element;
};

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

export type TypeJSONValue =
  | null
  | string
  | number
  | boolean
  | TypeJSONValue[]
  | { [key: string]: TypeJSONValue }
  | { [key: string]: TypeJSONObject };

export type TypeJSONObject = {
  [key: string]: TypeJSONObject;
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
 * constant contains layer types
 */
export const CONST_LAYER_TYPES = {
  WMS: 'ogcWMS',
  GEOJSON: 'geoJSON',
  ESRI_DYNAMIC: 'esriDynamic',
  ESRI_FEATURE: 'esriFeature',
  XYZ_TILES: 'xyzTiles',
  WFS: 'ogcWFS',
  OGC_FEATURE: 'ogcFeature',
};

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

/**
 * ESRI Json Legend for Feature Layer
 */
export type TypeLegendJsonFeature = {
  currentVersion: number;
  id: number;
  name: string;
  type: string;
  description: string;
  geometryType: string;
  sourceSpatialReference: {
    wkid: number;
    latestWkid: number;
  };
  copyrightText: string;
  parentLayer: {
    id: number;
    name: string;
  };
  subLayers: unknown[];
  minScale: number;
  maxScale: number;
  drawingInfo: {
    renderer: {
      type: string;
      symbol: {
        type: string;
        url: string;
        imageData: string;
        contentType: string;
        width: number;
        height: number;
        angle: number;
        xoffset: number;
        yoffset: number;
      };
      label: string;
      description: string;
    };
    transparency: number;
    labelingInfo: unknown;
  };
  defaultVisibility: boolean;
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
  hasAttachments: boolean;
  htmlPopupType: string;
  displayField: string;
  typeIdField: unknown;
  subtypeFieldName: unknown;
  subtypeField: unknown;
  defaultSubtypeCode: unknown;
  fields: {
    name: string;
    type: string;
    alias: string;
    domain: unknown;
  }[];
  geometryField: {
    name: string;
    type: string;
    alias: string;
  };
  indexes: {
    name: string;
    fields: string;
    isAscending: boolean;
    isUnique: boolean;
    description: string;
  }[];
  subtypes: [];
  relationships: [];
  canModifyLayer: boolean;
  canScaleSymbols: boolean;
  hasLabels: boolean;
  capabilities: string;
  maxRecordCount: number;
  supportsStatistics: boolean;
  supportsAdvancedQueries: boolean;
  supportedQueryFormats: string;
  isDataVersioned: boolean;
  ownershipBasedAccessControlForFeatures: {
    allowOthersToQuery: boolean;
  };
  useStandardizedQueries: boolean;
  advancedQueryCapabilities: {
    useStandardizedQueries: boolean;
    supportsStatistics: boolean;
    supportsHavingClause: boolean;
    supportsCountDistinct: boolean;
    supportsOrderBy: boolean;
    supportsDistinct: boolean;
    supportsPagination: boolean;
    supportsbooleanCurve: boolean;
    supportsReturningQueryExtent: boolean;
    supportsQueryWithDistance: boolean;
    supportsSqlExpression: boolean;
  };
  supportsDatumTransformation: boolean;
  supportsCoordinatesQuantization: boolean;
};

export type TypeLegendJson = TypeLegendJsonDynamic | TypeLegendJsonDynamic;

/**
 * interface used when adding a new layer
 */
export type TypeLayerData = {
  id: string;
  type: 'ogcWMS' | 'geoJSON' | 'esriDynamic' | 'esriFeature' | 'xyzTiles' | 'ogcWFS' | 'ogcFeature';
  name: string;
  url: string;
  entries: string[];
  layer: {
    setOpacity?: (opacity: number) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    eachFeature?: (x: any) => void;
    options: {
      url: string;
    };
    metadata: (fn: (error: unknown, res: { layers: { id: string; subLayerIds: string[] }[] }) => void) => void;
    _url: string;
    entries: {
      attributes: TypeJSONValue;
    }[];
    mapService: {
      options: {
        url: string;
      };
    };
    getLayers: () => L.Layer[];
  } & L.Layer;
  layers: TypeLayersInLayerData;
  getLegendGraphic?: (id: string) => Promise<string>;
  getLegendJson?: () => Promise<TypeLegendJson>;
  setOpacity: (opacity: number) => void;
  getBounds: () => L.LatLngBounds | Promise<L.LatLngBounds>;
};

export type TypeLayersInLayerData = Record<string, TypeLayersEntry>;

export type TypeLayersEntry = {
  layerData: TypeJSONObject[];
  groupLayer: boolean;
  displayField: string;
  fieldAliases: TypeJSONValue;
  layer: TypeLayerInfo;
  entries?: TypeEntry[];
  renderer: TypeRendererSymbol;
};

export type TypeEntry = {
  attributes: TypeJSONObject;
};

export type TypeLayerInfo = {
  id: string;
  name: string;
  displayField: string;
  displayFieldName: string;
  drawingInfo: {
    renderer: TypeRendererSymbol;
  };
  fields: TypeFieldNameAlias[];
};

export type TypeFieldNameAlias = {
  name: string;
  alias: string;
};

export type TypeFoundLayers = {
  layer: TypeLayersEntry;
  entries: TypeEntry[];
};

/**
 * Interface used for the Features List properties
 */
export type TypeFeaturesListProps = {
  buttonPanel: TypeButtonPanel;
  getSymbol: (renderer: TypeRendererSymbol, attributes: TypeJSONObject) => TypeJSONObject | null;
  selectFeature: (featureData: TypeJSONValue) => void;
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
  uniqueValueInfos: TypeJSONObject[];
  field1: string;
  field2: string;
  field3: string;
};

/**
 * interface used when creating the actual plugin
 */
export type TypeActualPlugin = {
  // id of the plugin
  id: string;
  api: API;
  createElement: typeof React.createElement;
  react: typeof React;
  props: TypeJSONValue;
  translate: TypeJSONValue;
  translations: TypeJSONObject;
  makeStyles: typeof makeStyles;
  added?: () => void;
  removed?: () => void;
};

/**
 * interface used when creating a new plugin
 */
export type TypePluginEntry = {
  // id of the plugin
  id: string;
  // plugin class object
  plugin: TypeActualPlugin;
};

export type TypeRecordOfPlugin = {
  [MapId: string]: { [pluginId: string]: TypePluginEntry };
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
  attributes: TypeJSONValue;
  displayField: TypeJSONValue;
  fieldAliases: TypeJSONValue;
  numOfEntries: number;
  symbol: TypeJSONValue;
};

/**
 * interface for the layers list properties in details panel
 */
export type TypeLayersListProps = {
  clickPos?: L.LatLng;
  getSymbol: (renderer: TypeRendererSymbol, attributes: TypeJSONObject) => TypeJSONObject | null;
  layersData: Record<string, TypeLayerData>;
  mapId: string;
  selectFeature: (featureData: TypeJSONObject) => void;
  selectLayer: (layerData?: TypeLayersEntry) => void;
};

/**
 * interface for the layers list properties in layers panel
 */
export type TypeLayersPanelListProps = {
  mapId: string;
  layers: Record<string, TypeLayerData>;
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
  extraOptions: TypeJSONValue;
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

export interface TypeMarkerClusterElementOptions extends L.MarkerOptions {
  selected?: boolean;
  blinking?: boolean;
  on?: Record<string, L.LeafletEventHandlerFn>;
}

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
  tooltip?: string | TypeJSONValue;
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
  title: string | TypeJSONValue;
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

export type TypePluginOptions = {
  mapId: string;
};

export abstract class AbstractPluginClass {
  // id of the plugin
  id: string;

  // plugin properties
  pluginOptions: TypePluginOptions;

  constructor(id: string, props: TypePluginOptions) {
    this.id = id;
    this.pluginOptions = props;
  }
}
