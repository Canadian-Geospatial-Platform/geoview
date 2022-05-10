import React, { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import * as ReactLeaflet from 'react-leaflet';
import * as ReactLeafletCore from '@react-leaflet/core';
import L from 'leaflet';
import { TooltipProps, ButtonProps, ButtonGroupProps, CircularProgressProps, DividerProps, DrawerProps, FadeProps, IconButtonProps, ListItemProps, ListProps, DialogProps, BaseTextFieldProps, useMediaQuery, AutocompleteProps, TypographyProps, SliderProps, CheckboxProps, StepperProps, StepLabelProps, StepContentProps, StepProps, TextFieldProps, SelectProps, MenuItemProps, InputLabelProps, SelectChangeEvent, ListSubheaderProps } from '@mui/material';
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
export * from '../../api/events/payloads/slider-payload';
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
export declare function Cast<TargetType = never>(p: unknown): TargetType;
export interface TypeWindow extends Window {
    cgpv: TypeCGPV;
    plugins: {
        [pluginId: string]: ((pluginId: string, props: TypeJsonValue) => TypeJsonValue) | AbstractPluginClass | undefined;
    };
}
export declare type TypeCGPVUI = {
    useTheme: typeof useTheme;
    useMediaQuery: typeof useMediaQuery;
    makeStyles: typeof makeStyles;
    elements: typeof UI;
};
export declare type TypeCGPVConstants = {
    leafletPositionClasses: typeof LEAFLET_POSITION_CLASSES;
};
export declare type TypeCGPV = {
    init: TypeCallback;
    api: TypeApi;
    react: typeof React;
    leaflet: typeof L;
    reactLeaflet: typeof ReactLeaflet;
    reactLeafletCore: typeof ReactLeafletCore;
    ui: TypeCGPVUI;
    useTranslation: typeof useTranslation;
    types: Object;
    constants: TypeCGPVConstants;
};
export declare type TypeCallback = (callback: () => void) => void;
export declare type TypeFunction = () => void;
export interface TypeApi extends API, Event, Plugin {
}
export interface TypeCSSStyleDeclaration extends CSSStyleDeclaration {
    mozTransform: string;
}
export declare type TypeChildren = React.ReactNode;
/**
 * Map context
 */
export declare type TypeMapContext = {
    id: string;
    interaction: string;
};
export declare type TypeJsonValue = null | string | number | boolean | TypeJsonObject[] | {
    [key: string]: TypeJsonObject;
};
export declare type TypeJsonArray = TypeJsonValue & TypeJsonObject[];
export declare type TypeJsonObject = TypeJsonValue & {
    [key: string]: TypeJsonObject;
};
export declare function toJsonObject(p: unknown): TypeJsonObject;
export declare type TypeStampedIconCreationFunction = (Stamp: string) => L.DivIcon;
export declare type TypeIconCreationFunction = () => L.DivIcon;
/**
 * ESRI Json Legend for Dynamic Layer
 */
export declare type TypeLegendJsonDynamic = {
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
export declare type TypeLayersInWebLayer = Record<string, TypeLayersEntry>;
export declare type TypeLayersEntry = {
    layerData: TypeJsonArray;
    groupLayer: boolean;
    displayField: string;
    fieldAliases: TypeJsonValue;
    layer: TypeLayerInfo;
    entries?: TypeEntry[];
    renderer: TypeRendererSymbol;
};
export declare type TypeEntry = {
    attributes: TypeJsonObject;
};
export declare type TypeLayerInfo = {
    id: string;
    name: string;
    displayField: string;
    displayFieldName: string;
    drawingInfo: {
        renderer: TypeRendererSymbol;
    };
    fields: TypeFieldNameAliasArray;
};
export declare type TypeFieldNameAliasArray = {
    name: string;
    alias: string;
}[];
export declare type TypeFieldAlias = {
    [name: string]: string;
};
export declare type TypeFoundLayers = {
    layer: TypeLayersEntry;
    entries: TypeEntry[];
};
/**
 * Interface used for the Features List properties
 */
export declare type TypeFeaturesListProps = {
    buttonPanel: TypeButtonPanel;
    getSymbol: (renderer: TypeRendererSymbol, attributes: TypeJsonObject) => TypeJsonObject | null;
    selectFeature: (featureData: TypeJsonObject) => void;
    selectLayer: (layerData?: TypeLayersEntry) => void;
    selectedLayer: TypeLayersEntry | {};
    setPanel: (showLayersList: boolean, showFeaturesList: boolean, showFeaturesInfo: boolean) => void;
};
export declare type TypeRendererSymbol = {
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
export declare type TypePluginStructure = {
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
export declare type TypeRecordOfPlugin = {
    [MapId: string]: {
        [pluginId: string]: TypePluginStructure;
    };
};
/**
 * interface used to define the vector types
 */
export declare type TypeOfVector = 'polyline' | 'polygon' | 'circle' | 'circle_marker' | 'marker';
/**
 * interface used to define the vector type keys
 */
export declare type TypeVectorKeys = 'POLYLINE' | 'POLYGON' | 'CIRCLE' | 'CIRCLE_MARKER' | 'MARKER';
/**
 * constant used to specify available vectors to draw
 */
export declare const CONST_VECTOR_TYPES: Record<TypeVectorKeys, TypeOfVector>;
/**
 * Interface for panel properties
 */
export declare type TypePanelAppProps = {
    panel: PanelApi;
    button: TypeButtonProps;
};
/**
 * Feature info properties
 */
export declare type TypeFeatureInfoProps = {
    buttonPanel: TypeButtonPanel;
    selectedFeature: TypeSelectedFeature;
    setPanel: (showLayersList: boolean, showFeaturesList: boolean, showFeaturesInfo: boolean) => void;
};
export declare type TypeSelectedFeature = {
    attributes: TypeJsonObject;
    displayField: TypeJsonObject;
    fieldAliases: TypeJsonObject;
    numOfEntries: number;
    symbol: TypeJsonObject;
};
/**
 * interface for the layers list properties in details panel
 */
export declare type TypeLayersListProps = {
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
export declare type TypeLayersPanelListProps = {
    mapId: string;
    layers: Record<string, AbstractWebLayersClass>;
    language: string;
};
/**
 * Interface used for the panel content
 */
export declare type TypePanelContentProps = {
    buttonPanel: TypeButtonPanel;
    mapId: string;
};
export declare type TypeMapControls = {
    boxZoom: boolean;
    selectBox: boolean;
};
export declare type TypeMapInitialView = {
    zoom: number;
    center: L.LatLngTuple;
};
export declare type TypeProjections = 3978 | 3857;
/**
 * interface for basemap options
 */
export declare type TypeBasemapOptions = {
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
export declare type TypeLayerSettings = {
    opacity: number;
    visibility: boolean;
    boundingBox: boolean;
    query: boolean;
};
export declare type TypeDetailsLayerSettings = {
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
export declare type TypeDynamicLayerEntry = {
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
export declare type TypeOgcLayerEntry = {
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
    state?: TypeLayerSettings;
}
export interface TypeOgcFeatureLayer extends TypeLayerConfig {
    metadataUrl?: TypeLangString;
    layerEntries: TypeOgcLayerEntry[];
    details?: TypeDetailsLayerSettings;
}
export declare type TypeInteraction = 'static' | 'dynamic';
export declare type TypeMapConfig = {
    interaction: TypeInteraction;
    controls?: TypeMapControls;
    initialView: TypeMapInitialView;
    projection: number;
    basemapOptions: TypeBasemapOptions;
    layers?: TypeLayerConfig[];
};
export declare type TypeLangString = {
    en: string;
    fr: string;
};
export declare type TypeAppBarProps = {
    about: TypeLangString;
};
export declare type TypeNavBarProps = TypeJsonObject;
export declare type TypeNorthArrowProps = TypeJsonObject;
export declare type TypeMapComponents = 'appbar' | 'navbar' | 'northArrow';
export declare type TypeMapCorePackages = 'overview-map' | 'basemap-switcher' | 'layers-panel' | 'details-panel' | 'geolocator';
export declare type TypeExternalPackages = {
    name: string;
    configUrl?: string;
};
export declare type TypeServiceUrls = {
    keys: string;
};
export declare type TypeLanguages = 'en' | 'fr';
export declare type TypeLocalizedLanguages = 'en-CA' | 'fr-CA';
export declare type TypeMapSchemaProps = {
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
export declare type TypeBasemapLayerOptions = {
    tms: boolean;
    tileSize: number;
    attribution: boolean;
    noWrap: boolean;
};
/**
 * interface used to define a new basemap layer
 */
export declare type TypeBasemapLayer = {
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
export declare type TypeZoomLevels = {
    min: number;
    max: number;
};
/**
 * interface for attribution value
 */
export declare type TypeAttribution = {
    'en-CA': string;
    'fr-CA': string;
};
/**
 * interface used to define a new basemap
 */
export declare type TypeBasemapProps = {
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
export declare type TypeAppVersion = {
    hash: string;
    major: number;
    minor: number;
    patch: number;
    timestamp: string;
};
/**
 * constant that defines the panel types
 */
export declare const CONST_PANEL_TYPES: {
    APPBAR: string;
    NAVBAR: string;
};
/**
 * Interface used to initialize a snackbar message
 */
export declare type TypeSnackbarMessage = {
    type: string;
    value: string;
    params?: TypeJsonArray;
};
/**
 * Interface used to initialize a button panel
 */
export declare type TypeButtonPanelProps = {
    panel: TypePanelProps;
    button: TypeButtonProps;
};
/**
 * Interface used when creating a new button panel
 */
export declare type TypeButtonPanel = {
    id: string;
    panel?: PanelApi;
    button: TypeButtonProps;
    groupName?: string;
};
/**
 * Interface for the button properties used when creating a new button
 */
export interface TypeButtonProps extends Omit<ButtonProps, 'type'> {
    id?: string;
    tooltip?: string;
    tooltipPlacement?: TooltipProps['placement'];
    icon?: TypeChildren;
    iconClassName?: string;
    textClassName?: string;
    state?: 'expanded' | 'collapsed';
    type: 'text' | 'textWithIcon' | 'icon';
    visible?: boolean;
}
/**
 * type for the panel properties used when creating a new panel
 */
export declare type TypePanelProps = {
    id?: string;
    type?: string;
    status?: boolean;
    width: string | number;
    icon: React.ReactNode | Element;
    title: string | TypeJsonValue;
    content?: React.ReactNode | Element;
};
/**
 * Button Group properties
 */
export declare type TypeButtonGroupProps = ButtonGroupProps;
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
export declare type TypeFadeProps = FadeProps;
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
export declare type TypeListItemProps = ListItemProps;
/**
 * Customized Material UI Autocomplete properties
 */
export interface TypeAutocompleteProps<T, Multiple extends boolean | undefined = undefined, DisableClearable extends boolean | undefined = undefined, FreeSolo extends boolean | undefined = undefined> extends AutocompleteProps<T, Multiple, DisableClearable, FreeSolo> {
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
    className?: string;
    style?: CSSProperties;
    title?: TypeChildren;
    titleId?: string;
    content?: TypeChildren;
    contentClassName?: string;
    contentStyle?: CSSProperties;
    contentTextId?: string;
    contentTextClassName?: string;
    contentTextStyle?: CSSProperties;
    actions?: TypeChildren;
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
export declare type TypeSelectChangeEvent<unkown> = SelectChangeEvent<unkown>;
/**
 * Required and optional properties for the items (options) of select
 */
export interface TypeSelectItems {
    category?: string;
    items: Array<TypeItemProps>;
}
/**
 * Menu Item properties
 */
export interface TypeMenuItemProps {
    type?: 'item' | 'header';
    item: MenuItemProps | ListSubheaderProps | null;
}
/**
 * Custom MUI Select properties
 */
export interface TypeSelectProps extends SelectProps {
    mapId?: string;
    fullWidth?: boolean;
    menuItems: TypeMenuItemProps[];
    inputLabel: InputLabelProps;
}
/**
 * Properties for the Custom Select component
 */
export interface TypeCustomSelectProps {
    id: string;
    className?: string;
    style?: CSSProperties;
    label: string;
    selectItems: Array<Record<string, TypeSelectItems>> | Array<Record<string, TypeItemProps>>;
    callBack?: <T>(params: T) => void;
    helperText?: string;
    multiple?: boolean;
}
/**
 * Properties for the Slider
 */
export interface TypeSliderProps extends SliderProps {
    id: string;
    className?: string;
    style?: CSSProperties;
    min: number;
    max: number;
    value: Array<number> | number;
    customOnChange?: (value: number[] | number) => void;
    disabled?: boolean;
    marks?: Array<{
        label?: string;
        value: number;
    }>;
    orientation?: 'vertical' | 'horizontal' | undefined;
    step?: number;
    size?: 'small' | 'medium';
    track?: 'inverted' | 'normal' | false;
    ariaLabelledby?: string;
    mapId?: string;
}
/**
 * Properties for the Steps of Stepper
 */
export interface TypeStepperSteps {
    label?: string;
    description: JSX.Element | HTMLElement | string;
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
    orientation?: 'horizontal' | 'vertical';
    alternativeLabel?: boolean;
    nonLinear?: boolean;
    buttonedLabels?: boolean;
    steps?: Array<Record<string, TypeStepperSteps>>;
    backButtonText?: string;
    nextButtonText?: string;
    resetButtonText?: string;
}
/**
 * Custom Material UI Textfield properties
 */
export declare type TypeTextFieldProps = TextFieldProps & {
    mapId?: string;
};
/**
 * Customized Material UI Custom TextField Properties
 */
export interface TypeCustomTextFieldProps extends Omit<BaseTextFieldProps, 'prefix'> {
    id: string;
    errorHelpertext?: string | undefined;
    prefix?: string | JSX.Element | HTMLElement | TypeChildren;
    suffix?: string | JSX.Element | HTMLElement | undefined;
    changeHandler?: <T>(params: T) => void;
}
/**
 * interface used to define the web-layers
 */
export declare type TypeWebLayers = 'esriDynamic' | 'esriFeature' | 'geojson' | 'geoCore' | 'xyzTiles' | 'ogcFeature' | 'ogcWfs' | 'ogcWms';
export declare type LayerTypesKey = 'ESRI_DYNAMIC' | 'ESRI_FEATURE' | 'GEOJSON' | 'GEOCORE' | 'XYZ_TILES' | 'OGC_FEATURE' | 'WFS' | 'WMS';
/**
 * constant contains layer types
 */
export declare const CONST_LAYER_TYPES: Record<LayerTypesKey, TypeWebLayers>;
/**
 * constant contains default layer names
 */
export declare const DEFAULT_LAYER_NAMES: Record<TypeWebLayers, string>;
/**
 * interface used by all web layers
 */
export declare type TypeBaseWebLayersConfig = {
    layerType: TypeWebLayers;
    id?: string;
    name?: TypeLangString;
    url: TypeLangString;
    layerEntries?: (TypeDynamicLayerEntry | TypeOgcLayerEntry)[];
};
/**
 * interface used by all plugins to define their options
 */
export declare type TypePluginOptions = {
    mapId: string;
};
/**
 * constant/interface used to define the precision for date object (yyyy, mm, dd)
 */
export declare const DEFAULT_DATE_PRECISION: {
    year: string;
    month: string;
    day: string;
};
export declare type DatePrecision = 'year' | 'month' | 'day';
/**
 * constant/interface used to define the precision for time object (hh, mm, ss)
 */
export declare const DEFAULT_TIME_PRECISION: {
    hour: string;
    minute: string;
    second: string;
};
export declare type TimePrecision = 'hour' | 'minute' | 'second';
