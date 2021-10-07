/* eslint-disable @typescript-eslint/no-explicit-any */
import L, { Map, LeafletEventHandlerFn, MapOptions } from 'leaflet';
import { MapContainerProps } from 'react-leaflet';
import { Projection } from '../api/projection';
import { Plugin } from '../api/plugin';
import { API } from '../api/api';
import { Vector } from '../common/vectors/vector';
import { MarkerClusters } from '../common/vectors/marker-clusters';
import { ButtonPanel } from '../common/ui/button-panel';
import { Basemap } from '../common/basemap';
import { Layer } from '../common/layers/layer';
import { Button, ButtonProps } from '../common/ui/button';
import { Panel, PanelProps } from '../common/ui/panel';

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
 * Used when creating marker cluster group options
 */
export interface TypeMarkerClusterOptions extends L.MarkerOptions {
    selected?: boolean;
    on?: Record<string, LeafletEventHandlerFn>;
}

/**
 * Used when creating a cluster marker
 */
export interface TypeMarkerCluster<OptionsType extends L.MarkerOptions = TypeMarkerClusterOptions> extends L.MarkerCluster {
    id: string;
    options: OptionsType;
    spiderfy: () => void;
}

/**
 * Used when creating marker cluster group options
 */
export interface TypeClusterGroupOptions extends L.MarkerClusterGroupOptions {
    visible?: boolean;
    on?: Record<string, LeafletEventHandlerFn>;
}

/**
 * Used when creating marker cluster group
 */
export interface TypeClusterGroup<OptionsType extends L.MarkerClusterGroupOptions = TypeClusterGroupOptions> extends L.MarkerClusterGroup {
    id: string;
    options: OptionsType;
    getVisibleParent: (marker: TypeMarkerCluster) => TypeMarkerCluster;
}

/**
 * interface used to store and access created maps
 */
export interface TypeMapViewer extends Map, Vector, MarkerClusters, ButtonPanel, Basemap, Layer {
    id: string;
    map: TypeMap;
}

/**
 * interface used to describe cgp map options
 */
export interface TypeMapOptions extends MapOptions {
    boxZoom: boolean;
    selectBox: boolean;
}

/**
 * interface used to describe cgp maps
 */
export interface TypeMap<OptionsType extends MapOptions = TypeMapOptions> extends Map {
    boxZoom: L.Handler;
    selectBox: L.Handler;
    options: OptionsType;
}

/**
 * interface used to store and access created maps
 */
export type TypeMapRef = {
    id: string;
    map: TypeMap;
};

/**
 * constant contains layer types
 */
export const ConstLayerTypes = {
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
    type: 'ogcWMS' | 'esriFeature' | 'esriDynamic';
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
    fieldAliases: Record<string, string>;
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
    panel: PanelProps;
    button: ButtonProps;
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
export const ConstVectorTypes = {
    POLYLINE: 'polyline',
    POLYGON: 'polygon',
    CIRCLE: 'circle',
    CIRCLE_MARKER: 'circle_marker',
    MARKER: 'marker',
};

/**
 * Used when creating a geometry
 */
export interface TypeGeometry extends L.Layer {
    id: string;
    type: string;
}

/**
 * Used to store geometries in a group
 */
export interface VectorType extends L.FeatureGroup {
    id: string;
    visible: boolean;
}

export interface TypeMapContainerProps extends MapContainerProps {
    id?: string;
    boxZoom?: boolean;
    selectBox?: boolean;
}

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
