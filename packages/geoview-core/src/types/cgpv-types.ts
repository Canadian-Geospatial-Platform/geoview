/* eslint-disable @typescript-eslint/no-explicit-any */
import L from 'leaflet';
import { Projection } from '../api/projection';
import { Plugin } from '../api/plugin';
import { API } from '../api/api';
import { Button } from '../common/ui/button';
import { Panel } from '../common/ui/panel';

export function Cast<TargetType = never>(p: unknown): TargetType {
    return p as TargetType;
}

export interface TypeWindow extends Window {
    cgpv?: TypeCGPV;
    plugins?: Record<string, Plugin>;
}

export type TypeCGPV = {
    init: TypeCallback;
    api: TypeApi;
};

export type TypeCallback = (callback: () => void) => void;

export interface TypeApi extends API, Event, Projection, Plugin {}

export interface TypeCSSStyleDeclaration extends CSSStyleDeclaration {
    mozTransform: string;
}

/*-----------------------------------------------------------------------------
 *
 * General Json type
 *
 *---------------------------------------------------------------------------*/

export type TypeJSONValue = string | number | boolean | null | TypeJSONValue[] | TypeJSONObject;

export type TypeJSONObject = {
    [key: string]: TypeJSONValue;
};

export type TypeJSONObjectLoop = {
    [key: string]: TypeJSONObjectLoop;
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
};

/**
 * interface used when adding a new layer
 */
export type TypeLayerConfig = {
    id?: string;
    name: string;
    url: string;
    type: string;
    entries?: string;
};

/**
 * interface used when adding a new layer
 */

export type TypeLayerData = {
    id: string;
    type: 'ogcWMS' | 'geoJSON' | 'esriDynamic' | 'esriFeature' | 'xyzTiles';
    layer: {
        options: {
            url: string;
        };
        metadata: (fn: (error: any, res: { layers: { id: string; subLayerIds: string[] }[] }) => void) => void;
        _url: string;
        entries: {
            attributes: TypeJSONObject;
        }[];
        mapService: {
            options: {
                url: string;
            };
        };
        getLayers: () => Array<number>;
    } & L.Layer;
    layers: TypeLayersInLayerData;
};

export type TypeLayersInLayerData = Record<string, TypeLayersEntry>;

export type TypeLayersEntry = {
    layerData: TypeJSONValue[];
    groupLayer: boolean;
    displayField: string;
    fieldAliases: TypeJSONObject;
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
    getSymbol: (renderer: TypeRendererSymbol, attributes: TypeJSONObject) => TypeJSONObject;
    selectFeature: (featureData: TypeJSONObject) => void;
    selectLayer: (layerData?: TypeLayersEntry) => void;
    // eslint-disable-next-line @typescript-eslint/ban-types
    selectedLayer: TypeLayersEntry | {};
    setPanel: (showLayersList: boolean, showFeaturesList: boolean, showFeaturesInfo: boolean) => void;
};

export type TypeRendererSymbol = {
    symbol: {
        legendImageUrl: string;
    };
    uniqueValueInfos: TypeJSONObject[];
    field1: string;
    field2: string;
    field3: string;
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
    panel?: Panel;
    button: Button;
    groupName?: string | null;
};

/**
 * interface used when creating a new plugin
 */
export type TypePlugin = {
    // id of the plugin
    id: string;
    // plugin class object
    plugin: any;
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
    panel: Panel;
    panelOpen: boolean;
    button: Button;
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
    attributes: TypeJSONObject;
    displayField: TypeJSONValue;
    fieldAliases: TypeJSONObject;
    numOfEntries: number;
    symbol: TypeJSONObject;
};

export type TypeProps<T = string & unknown> = Record<string, T>;

/**
 * interface for the layers list properties
 */
export type TypeLayersListProps = {
    clickPos: L.LatLng | undefined;
    getSymbol: (renderer: TypeRendererSymbol, attributes: TypeJSONObject) => TypeJSONValue;
    layersData: Record<string, TypeLayerData>;
    mapId: string;
    selectFeature: (featureData: TypeJSONObject) => void;
    selectLayer: (layerData?: TypeLayersEntry) => void;
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
    id?: string;
    center: L.LatLngTuple;
    zoom: number;
    projection: number;
    language: string;
    selectBox: boolean;
    boxZoom: boolean;
    basemapOptions: TypeBasemapOptions;
    layers?: TypeLayerConfig[];
    plugins: string[];
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
    id: string;
    name: string;
    type: string;
    description: string;
    descSummary: string;
    altText: string;
    thumbnailUrl: string | Array<string>;
    layers: TypeBasemapLayer[];
    attribution: TypeAttribution;
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
 * Interface for the button properties used when creating a new button
 */
export type TypeButtonProps = {
    // generated button id
    id: string;
    // button tooltip
    tooltip: string;
    // button icon
    icon: React.ReactNode | Element;
    // optional callback function to run on button click
    callback?: () => void;
    // should the button be displayed in the appbar/navbar?
    visible?: boolean;
};

/**
 * constant that defines the panel types
 */
export const CONST_PANEL_TYPES = {
    APPBAR: 'appbar',
    NAVBAR: 'navbar',
};

/**
 * Interface for the panel properties used when creating a new panel
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
    title: string;
    // panel body content
    content?: React.ReactNode | Element;
};

export interface TypeMarkerClusterElementOptions extends L.MarkerOptions {
    selected?: boolean;
    blinking?: boolean;
    on?: Record<string, L.LeafletEventHandlerFn>;
}
