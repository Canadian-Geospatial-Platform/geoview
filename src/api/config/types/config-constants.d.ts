import { LayerEntryTypesKey, LayerTypesKey } from '@/api/config/types/config-types';
import { MapFeatureConfig } from '@/api/config/types/classes/map-feature-config';
import { TypeBasemapId, TypeDisplayLanguage, TypeDisplayTheme, TypeInteraction, TypeLayerEntryType, TypeValidMapProjectionCodes, TypeValidVersions, TypeGeoviewLayerType } from '@/api/config/types/map-schema-types';
/** The default geocore url */
export declare const CV_CONFIG_GEOCORE_URL = "https://geocore.api.geo.ca";
/** The default geolocator url */
export declare const CV_CONFIG_GEOLOCATOR_URL = "https://geolocator.api.geo.ca?keys=geonames,nominatim,locate";
/** The default proxy url */
export declare const CV_CONFIG_PROXY_URL = "https://maps.canada.ca/wmsproxy/ws/wmsproxy/executeFromProxy";
/** The default metadata recors url for uuid layer (empty because it needs to be set by config en and fr) */
export declare const CV_CONFIG_METADATA_RECORDS_URL = "";
export declare const CV_CONFIG_GEOCORE_TYPE = "geoCore";
export declare const CV_CONFIG_SHAPEFILE_TYPE = "shapefile";
export declare const CV_CONST_SUB_LAYER_TYPES: Record<LayerEntryTypesKey, TypeLayerEntryType>;
/**
 * Definition of the GeoView layer constants
 */
export declare const CV_CONST_LAYER_TYPES: Record<LayerTypesKey, TypeGeoviewLayerType>;
/**
 * Definition of the sub schema to use for each type of Geoview layer
 */
export declare const CV_CONST_LEAF_LAYER_SCHEMA_PATH: Record<LayerTypesKey, string>;
export declare const CV_GEOVIEW_SCHEMA_PATH: Record<LayerTypesKey, string>;
export declare const CV_MAP_CONFIG_SCHEMA_PATH = "https://cgpv/schema#/definitions/MapFeatureConfig";
export declare const CV_LAYER_GROUP_SCHEMA_PATH = "https://cgpv/schema#/definitions/GroupLayerEntryConfig";
/** Array of schema versions accepted by the viewer. */
export declare const ACCEPTED_SCHEMA_VERSIONS: TypeValidVersions[];
/** Constante mainly use for language validation. */
export declare const VALID_DISPLAY_LANGUAGE: TypeDisplayLanguage[];
/** Array of valid geoview themes. */
export declare const VALID_DISPLAY_THEME: TypeDisplayTheme[];
/** Constante mainly use for interaction validation. */
export declare const VALID_INTERACTION: TypeInteraction[];
/** Constant mainly used to test if a TypeValidMapProjectionCodes variable is a valid projection codes. */
export declare const VALID_PROJECTION_CODES: number[];
/**
 *  Definition of the basemap options type.
 */
export declare const CV_VALID_BASEMAP_ID: TypeBasemapId[];
/** default configuration if provided configuration is missing or wrong */
export declare const CV_BASEMAP_ID: Record<TypeValidMapProjectionCodes, TypeBasemapId[]>;
export declare const CV_BASEMAP_SHADED: Record<TypeValidMapProjectionCodes, boolean[]>;
export declare const CV_BASEMAP_LABEL: Record<TypeValidMapProjectionCodes, boolean[]>;
export declare const CV_VALID_MAP_CENTER: Record<TypeValidMapProjectionCodes, Record<string, number[]>>;
export declare const CV_MAP_EXTENTS: Record<TypeValidMapProjectionCodes, number[]>;
export declare const CV_MAP_CENTER: Record<TypeValidMapProjectionCodes, number[]>;
export declare const CV_VALID_ZOOM_LEVELS: number[];
/**
 *  Definition of the MapFeatureConfig default values. All the default values that applies to the map feature configuration are
 * defined here.
 */
export declare const CV_DEFAULT_MAP_FEATURE_CONFIG: MapFeatureConfig;
/**
 *  Definition of the initial settings default values.
 */
export declare const CV_DEFAULT_LAYER_INITIAL_SETTINGS: {
    controls: {
        highlight: boolean;
        hover: boolean;
        opacity: boolean;
        query: boolean;
        remove: boolean;
        table: boolean;
        visibility: boolean;
        zoom: boolean;
    };
    states: {
        visible: boolean;
        opacity: number;
        hoverable: boolean;
        queryable: boolean;
    };
};
/**
 * Definition of the default order of the tabs inside appbar
 */
export declare const CV_DEFAULT_APPBAR_TABS_ORDER: string[];
export declare const CV_DEFAULT_APPBAR_CORE: {
    readonly GEOLOCATOR: "geolocator";
    readonly EXPORT: "export";
    readonly GUIDE: "guide";
    readonly DETAILS: "details";
    readonly LEGEND: "legend";
    readonly DATA_TABLE: "data-table";
    readonly LAYERS: "layers";
};
