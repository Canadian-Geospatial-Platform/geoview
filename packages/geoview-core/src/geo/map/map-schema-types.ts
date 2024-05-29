import { Extent } from 'ol/extent';
import BaseLayer from 'ol/layer/Base';
import Feature from 'ol/Feature';
import RenderFeature from 'ol/render/Feature';
import { Coordinate } from 'ol/coordinate';
import { Pixel } from 'ol/pixel';

import {
  TypeBasemapOptions,
  TypeViewSettings,
  TypeInteraction,
  TypeHighlightColors,
  TypeValidMapProjectionCodes,
  TypeDisplayTheme,
  TypeLocalizedString,
  TypeLayerStates,
  TypeLayerControls,
  TypePostSettings,
  TypeServiceUrls,
  TypeNavBarProps,
  TypeAppBarProps,
  TypeFooterBarProps,
  TypeOverviewMapProps,
  TypeMapComponents,
  TypeMapCorePackages,
  TypeExternalPackages,
} from '@config/types/map-schema-types';

import { CONST_LAYER_TYPES, TypeGeoviewLayerType } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { ImageStaticLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/image-static-layer-entry-config';
import { OgcWmsLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/ogc-wms-layer-entry-config';
import { EsriDynamicLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/esri-dynamic-layer-entry-config';
import { EsriImageLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/esri-image-layer-entry-config';
import { AbstractBaseLayerEntryConfig } from '@/core/utils/config/validation-classes/abstract-base-layer-entry-config';
import { VectorLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-layer-entry-config';
import { TileLayerEntryConfig } from '@/core/utils/config/validation-classes/tile-layer-entry-config';
import { GroupLayerEntryConfig } from '@/core/utils/config/validation-classes/group-layer-entry-config';
import { ConfigBaseClass } from '@/core/utils/config/validation-classes/config-base-class';
import { TypeJsonValue } from '@/core/types/global-types';

// #region LAYERS START
export type TypeLayerInitialSettings = {
  /** Settings for availablity of controls */
  controls?: TypeLayerControls; //! config
  /** The geographic bounding box that contains all the layer's features. */
  bounds?: Extent;
  /** The extent that constrains the view. Called with [minX, minY, maxX, maxY] extent coordinates. */
  extent?: Extent;
  /** The minimum view zoom level (exclusive) above which this layer will be visible. */
  minZoom?: number;
  /** The maximum view zoom level (inclusive) below which this layer will be visible. */
  maxZoom?: number;
  /** A CSS class name to set to the layer element. */
  className?: string;
  /** Settings for availablity of controls */
  states?: TypeLayerStates; //! config
};

// TODO: Figure out the missing types here
export type TypeVectorSourceFormats =
  | typeof CONST_LAYER_TYPES.GEOJSON
  | 'EsriJSON'
  | 'KML'
  | 'WFS'
  | 'featureAPI'
  | typeof CONST_LAYER_TYPES.GEOPACKAGE
  | typeof CONST_LAYER_TYPES.CSV;

// TODO: refactor - SWITCH to new format and fix old config and all viewer code to use new structure
export type TypeFeatureInfoLayerConfig = {
  /** Allow querying. Default = false. */
  queryable: boolean;

  /**
   * The display field (English/French) of the layer. If it is not present the viewer will make an attempt to find the first valid
   * field.
   */
  nameField?: TypeLocalizedString;
  /** A comma separated list of attribute names (English/French) that should be requested on query (all by default). */
  outfields?: TypeLocalizedString;
  /** A comma separated list of types. Type at index i is associated to the variable at index i. */
  fieldTypes?: string;
  /** A comma separated list of attribute names (English/French) that should be use for alias. If empty, no alias will be set */
  aliasFields?: TypeLocalizedString;
};

export type TypeBaseSourceVectorInitialConfig = {
  /** Path used to access the data. */
  dataAccessPath?: TypeLocalizedString;
  /** Settings to use when loading a GeoJSON layer using a POST instead of a GET */
  postSettings?: TypePostSettings;
  /** The feature format used by the XHR feature loader when url is set. */
  format?: TypeVectorSourceFormats | 'MVT';
  /** The projection code of the source. Default value is EPSG:4326. */
  dataProjection?: string;
  /** Definition of the feature information structure that will be used by the getFeatureInfo method. */
  featureInfo?: TypeFeatureInfoLayerConfig;
  /** Loading strategy to use (all or bbox). */
  strategy?: 'all' | 'bbox';
};

export interface TypeVectorSourceInitialConfig extends TypeBaseSourceVectorInitialConfig {
  /** The feature format used by the XHR feature loader when url is set. */
  format?: TypeVectorSourceFormats;
  /** The character used to separate columns of csv file */
  separator?: string;
}

export type TypeKindOfVectorSettings =
  | TypeBaseVectorConfig
  | TypeLineStringVectorConfig
  | TypePolygonVectorConfig
  | TypeSimpleSymbolVectorConfig
  | TypeIconSymbolVectorConfig;

export type TypeBaseVectorConfig = {
  /** Type of vector config */
  type: 'lineString' | 'filledPolygon' | 'simpleSymbol' | 'iconSymbol';
};

// Definition of the keys used to create the constants of the GeoView layer
export type LayerEntryTypesKey = 'VECTOR' | 'VECTOR_TILE' | 'RASTER_TILE' | 'RASTER_IMAGE' | 'GROUP' | 'GEOCORE';

/** ******************************************************************************************************************************
 * Type of Style to apply to the GeoView vector layer source at creation time.
 */
export type TypeLayerEntryType = 'vector' | 'vector-tile' | 'raster-tile' | 'raster-image' | 'group' | 'geoCore';

// Constants for the layer config types
export const CONST_LAYER_ENTRY_TYPES: Record<LayerEntryTypesKey, TypeLayerEntryType> = {
  VECTOR: 'vector',
  VECTOR_TILE: 'vector-tile',
  RASTER_TILE: 'raster-tile',
  RASTER_IMAGE: 'raster-image',
  GROUP: 'group',
  GEOCORE: 'geoCore',
};

/**
 * Definition of the GeoView layer entry types for each type of Geoview layer
 */
export const convertLayerTypeToEntry = (layerType: TypeGeoviewLayerType): TypeLayerEntryType => {
  switch (layerType) {
    case CONST_LAYER_TYPES.CSV:
    case CONST_LAYER_TYPES.GEOJSON:
    case CONST_LAYER_TYPES.GEOPACKAGE:
    case CONST_LAYER_TYPES.OGC_FEATURE:
    case CONST_LAYER_TYPES.WFS:
    case CONST_LAYER_TYPES.ESRI_FEATURE:
      return CONST_LAYER_ENTRY_TYPES.VECTOR;

    case CONST_LAYER_TYPES.IMAGE_STATIC:
    case CONST_LAYER_TYPES.ESRI_DYNAMIC:
    case CONST_LAYER_TYPES.ESRI_IMAGE:
    case CONST_LAYER_TYPES.WMS:
      return CONST_LAYER_ENTRY_TYPES.RASTER_IMAGE;
    case CONST_LAYER_TYPES.XYZ_TILES:
    case CONST_LAYER_TYPES.VECTOR_TILES:
      return CONST_LAYER_ENTRY_TYPES.RASTER_TILE;
    default:
      // Throw unsupported error
      throw new Error(`Unsupported layer type ${layerType} to convert to layer entry`);
  }
};

export const layerEntryIsGroupLayer = (verifyIfLayer: ConfigBaseClass): verifyIfLayer is GroupLayerEntryConfig => {
  return verifyIfLayer?.entryType === CONST_LAYER_ENTRY_TYPES.GROUP;
};

export const layerEntryIsVector = (verifyIfLayer: TypeLayerEntryConfig): verifyIfLayer is VectorLayerEntryConfig => {
  return verifyIfLayer?.entryType === CONST_LAYER_ENTRY_TYPES.VECTOR;
};

export const layerEntryIsVectorTile = (verifyIfLayer: TypeLayerEntryConfig): verifyIfLayer is TileLayerEntryConfig => {
  return verifyIfLayer?.entryType === CONST_LAYER_ENTRY_TYPES.VECTOR_TILE;
};

export const layerEntryIsRasterTile = (verifyIfLayer: TypeLayerEntryConfig): verifyIfLayer is TileLayerEntryConfig => {
  return verifyIfLayer?.entryType === CONST_LAYER_ENTRY_TYPES.RASTER_TILE;
};

export const layerEntryIsOgcWms = (verifyIfLayer: TypeLayerEntryConfig): verifyIfLayer is OgcWmsLayerEntryConfig => {
  return verifyIfLayer?.schemaTag === CONST_LAYER_TYPES.WMS;
};

export const layerEntryIsEsriDynamic = (verifyIfLayer: TypeLayerEntryConfig): verifyIfLayer is EsriDynamicLayerEntryConfig => {
  return verifyIfLayer?.schemaTag === CONST_LAYER_TYPES.ESRI_DYNAMIC;
};

export const layerEntryIsEsriimage = (verifyIfLayer: TypeLayerEntryConfig): verifyIfLayer is EsriImageLayerEntryConfig => {
  return verifyIfLayer?.schemaTag === CONST_LAYER_TYPES.ESRI_IMAGE;
};

export const layerEntryIsImageStatic = (verifyIfLayer: TypeLayerEntryConfig): verifyIfLayer is ImageStaticLayerEntryConfig => {
  return verifyIfLayer?.schemaTag === CONST_LAYER_TYPES.IMAGE_STATIC;
};

export type TypeLayerStatus = 'registered' | 'newInstance' | 'processing' | 'processed' | 'loading' | 'loaded' | 'error';

// TODO: Refactor - Config refactoring. The types below MUST be migrated to the config map-schema-type
export type TypeResultSetEntry = {
  layerPath: string;
  layerName: string;
  layerStatus: TypeLayerStatus;
};

export type TypeResultSet<T extends TypeResultSetEntry = TypeResultSetEntry> = {
  [layerPath: string]: T;
};

export type TypeLayerData = {
  eventListenerEnabled: boolean;
  // When property features is undefined, we are waiting for the query result.
  // when Array.isArray(features) is true, the features property contains the query result.
  // when property features is null, the query ended with an error.
  queryStatus: TypeQueryStatus;
  features: TypeFeatureInfoEntry[] | undefined | null;
};

export type QueryType = 'at_pixel' | 'at_coordinate' | 'at_long_lat' | 'using_a_bounding_box' | 'using_a_polygon' | 'all';

export type TypeLocation = null | Pixel | Coordinate | Coordinate[] | string;

export type TypeQueryStatus = 'init' | 'processing' | 'processed' | 'error';

export type TypeFeatureInfoEntry = {
  featureKey: number;
  geoviewLayerType: TypeGeoviewLayerType;
  extent: Extent | undefined;
  geometry: TypeGeometry | Feature | null;
  featureIcon: HTMLCanvasElement;
  fieldInfo: Partial<Record<string, TypeFieldEntry>>;
  nameField: string | null;
};

export interface TypeGeometry extends RenderFeature {
  ol_uid: string;
}

export type codeValueEntryType = {
  name: string;
  code: unknown;
};

export type codedValueType = {
  type: 'codedValue';
  name: string;
  description: string;
  codedValues: codeValueEntryType[];
};

export type rangeDomainType = {
  type: 'range';
  name: string;
  range: [minValue: unknown, maxValue: unknown];
};

export type TypeFieldEntry = {
  fieldKey: number;
  value: unknown;
  dataType: 'string' | 'date' | 'number';
  alias: string;
  domain: null | codedValueType | rangeDomainType;
};

/**
 * Partial definition of a TypeFeatureInfoEntry for simpler use case queries.
 * Purposely linking this simpler type to the main TypeFeatureInfoEntry type here, in case, for future we want
 * to add more information on one or the other and keep things loosely linked together.
 */
export type TypeFeatureInfoEntryPartial = Pick<TypeFeatureInfoEntry, 'fieldInfo'>;

/** The simplified layer statuses */
export type TypeLayerStatusSimplified = 'loading' | 'loaded' | 'error';

// TODO: Refactor - Layers refactoring. After migration, can get rid of this type
export type TypeLoadEndListenerType = 'features' | 'tile' | 'image';

export type TypeEsriFormatParameter = 'png' | 'jpg' | 'gif' | 'svg';

export type TypeOfServer = 'mapserver' | 'geoserver' | 'qgis';

export type TypeSourceImageInitialConfig =
  | TypeSourceImageWmsInitialConfig
  | TypeSourceImageEsriInitialConfig
  | TypeSourceImageStaticInitialConfig;

export type TypeBaseSourceImageInitialConfig = {
  /**
   * The service endpoint of the layer (English/French). If not specified, the metadataAccessPath of the GeoView parent
   * layer is used
   */
  dataAccessPath?: TypeLocalizedString;
  /**
   * The crossOrigin attribute for loaded images. Note that you must provide a crossOrigin value if you want to access pixel data
   * with the Canvas renderer.
   * */
  crossOrigin?: string;
  /** Spatial Reference EPSG code supported (https://epsg.io/). We support Web Mercator and Lambert Conical Conform Canada. */
  projection?: TypeValidMapProjectionCodes; //! config
  /** Definition of the feature information structure that will be used by the getFeatureInfo method. */
  featureInfo?: TypeFeatureInfoLayerConfig;
};

export interface TypeSourceImageWmsInitialConfig extends TypeBaseSourceImageInitialConfig {
  /** The type of the remote WMS server. The default value is mapserver. */
  serverType?: TypeOfServer;
  /** Style to apply. Default = '' */
  style?: string | string[];
}

export interface TypeSourceImageStaticInitialConfig extends Omit<TypeBaseSourceImageInitialConfig, 'featureInfo'> {
  /** Definition of the feature information structure that will be used by the getFeatureInfo method. We only use queryable and
   * it must be set to false if specified.
   */
  featureInfo?: { queryable: false };
  /** Image extent */
  extent: Extent;
}

export interface TypeSourceImageEsriInitialConfig extends TypeBaseSourceImageInitialConfig {
  /** The format used by the image layer. */
  format?: TypeEsriFormatParameter;
  /**
   * If true, the image will be exported with the background color of the map set as its transparent color. Only the .png and
   * .gif formats support transparency. Default = true.
   */
  transparent?: boolean;
}

export type TypeTileGrid = {
  /** The extent that constrains the view. Called with [minX, minY, maxX, maxY] extent coordinates. */
  extent?: Extent;
  /**
   * The tile grid origin, i.e. where the x and y axes meet ([z, 0, 0]). Tile coordinates increase left to right and downwards.
   * If not specified, extent must be provided.
   */
  origin: [number, number];
  /**
   * Resolutions. The array index of each resolution needs to match the zoom level. This means that even if a minZoom is
   * configured, the resolutions array will have a length of maxZoom + 1.
   */
  resolutions: number[];
  /**
   * The tile grid origin, i.e. where the x and y axes meet ([z, 0, 0]). Tile coordinates increase left to right and downwards.
   * If not specified, extent must be provided. Default = [256, 256].
   */
  tileSize?: [number, number];
};

export interface TypeSourceTileInitialConfig extends Omit<TypeBaseSourceImageInitialConfig, 'featureInfo'> {
  /** Definition of the feature information structure that will be used by the getFeatureInfo method. We only use queryable and
   * it must be set to false if specified.
   */
  featureInfo?: { queryable: false };
  /** Tile grid parameters to use. */
  tileGrid?: TypeTileGrid;
}

export interface TypeVectorTileSourceInitialConfig extends TypeBaseSourceVectorInitialConfig {
  /** Tile grid parameters to use. */
  tileGrid?: TypeTileGrid;
}

// TODO: Refactor - This type should be deleted and 'ConfigBaseClass' should be used instead
export type TypeLayerEntryConfig = AbstractBaseLayerEntryConfig | GroupLayerEntryConfig;

/** ******************************************************************************************************************************
 *  Definition of a single Geoview layer configuration.
 */
export type TypeGeoviewLayerConfig = {
  /** This attribute is not part of the schema. It is used to link the displayed layer to its layer entry config. */
  olLayer?: Promise<BaseLayer>;
  /** The GeoView layer identifier. */
  geoviewLayerId: string;
  /**
   * The display name of the layer (English/French). If it is not present the viewer will make an attempt to scrape this
   * information.
   */
  geoviewLayerName?: TypeLocalizedString;
  /** The GeoView layer access path (English/French). */
  metadataAccessPath?: TypeLocalizedString;
  /** Type of GeoView layer. */
  geoviewLayerType: TypeGeoviewLayerType;
  /** Date format used by the service endpoint. */
  serviceDateFormat?: string;
  /** Date format used by the getFeatureInfo to output date variable. */
  externalDateFormat?: string;
  /**
   * Initial settings to apply to the GeoView layer at creation time.
   * This attribute is allowed only if listOfLayerEntryConfig.length > 1.
   */
  initialSettings?: TypeLayerInitialSettings;

  /** The layer entries to use from the GeoView layer. */
  listOfLayerEntryConfig: TypeLayerEntryConfig[];
};

export type GeoCoreLayerConfig = {
  /** Type of GeoView layer. */
  geoviewLayerType: typeof CONST_LAYER_ENTRY_TYPES.GEOCORE;

  /** The GeoCore UUID. */
  geoviewLayerId: string;

  /**
   * The display name of the layer (English/French). This overrides the default name coming from the GeoCore API.
   */
  // TODO: Bug - The geoviewLayerName doesn't override the name from GeoCore. Fix this.
  // TO.DOCONT: On type we should have the initial setting as well. This is to override the information from service.
  // TO.DOCONT: I think it is working with other type of layer. Now having geocore not a layer type anymore, we should be able to overrides.
  // TO.DOCONT: For this we will need a little trick because when we create the config the setting are set at the root level and in our config it will take it from the layerID.
  // TO.DOCONT: There is refactor to do to make this work for all layer type. Global setting should be cascade to child of the root layer.
  geoviewLayerName: TypeLocalizedString;
};

/**
 * This type indicates the Layer entry possibilities. They can be either a regular GeoviewLayerConfig or a GeoCoreLayerConfig.
 * A {GeoCoreLayerConfig} isn't an official {TypeGeoviewLayerConfig}, but in the configuration they are treated as such.
 * This type, which presents the 2 options as 2 different types, helps to represent this and remain type safe.
 */
export type MapConfigLayerEntry = TypeGeoviewLayerConfig | GeoCoreLayerConfig;

/**
 * Returns true if the layer entry from the map configuration represents a GeoCore layer type.
 * @param {MapConfigLayerEntry} layerConfigEntryOption The layer entry config to check
 * @returns {boolean} True if the layer type if GeoCore
 */
export const mapConfigLayerEntryIsGeoCore = (layerConfigEntryOption: MapConfigLayerEntry): boolean => {
  return layerConfigEntryOption.geoviewLayerType === CONST_LAYER_ENTRY_TYPES.GEOCORE;
};

/**
 * Temporary? function to serialize a geoview layer configuration to be able to send it to the store
 * @param {TypeGeoviewLayerConfig} geoviewLayerConfig The geoviewlayer config to serialize
 * @returns TypeJsonValue The serialized config as pure JSON
 */
export const serializeTypeGeoviewLayerConfig = (geoviewLayerConfig: MapConfigLayerEntry): TypeJsonValue => {
  // TODO: Create a 'serialize()' function inside `TypeGeoviewLayerConfig` when/if it's transformed to a class.
  // TO.DOCONT: and copy this code in deleting this function here. For now, this explicit workaround function is necessary.

  // If GeoCore layer entry
  if (mapConfigLayerEntryIsGeoCore(geoviewLayerConfig)) {
    // Serialize
    return {
      geoviewLayerId: geoviewLayerConfig.geoviewLayerId,
      geoviewLayerName: geoviewLayerConfig.geoviewLayerName,
      geoviewLayerType: geoviewLayerConfig.geoviewLayerType,
    } as GeoCoreLayerConfig as never;
  }

  // Cast
  const geoviewLayerConfigCasted = geoviewLayerConfig as TypeGeoviewLayerConfig;

  // Serialize
  const serializedGeoviewLayerConfig = {
    geoviewLayerId: geoviewLayerConfigCasted.geoviewLayerId,
    geoviewLayerName: geoviewLayerConfigCasted.geoviewLayerName,
    geoviewLayerType: geoviewLayerConfigCasted.geoviewLayerType,
    metadataAccessPath: geoviewLayerConfigCasted.metadataAccessPath,
    serviceDateFormat: geoviewLayerConfigCasted.serviceDateFormat,
    externalDateFormat: geoviewLayerConfigCasted.externalDateFormat,
    initialSettings: geoviewLayerConfigCasted.initialSettings,
    listOfLayerEntryConfig: [],
  } as TypeGeoviewLayerConfig;

  // Loop on the LayerEntryConfig to serialize further
  for (let j = 0; j < (geoviewLayerConfigCasted.listOfLayerEntryConfig?.length || 0); j++) {
    // TODO: Check - #1883 why some don't have the serialize funcion in here!? Maybe a Type vs Class thing!?
    // Got to check if serialize exists, because some aren't classes!? Making it as any for now, as we can't trust it
    if ('serialize' in geoviewLayerConfigCasted.listOfLayerEntryConfig[j]) {
      // Serialize the TypeLayerEntryConfig
      const serializedLayerEntryConfig = geoviewLayerConfigCasted.listOfLayerEntryConfig[j].serialize();

      // Store as serialized
      serializedGeoviewLayerConfig.listOfLayerEntryConfig.push(serializedLayerEntryConfig as never);
    } else {
      // Store as is for now
      serializedGeoviewLayerConfig.listOfLayerEntryConfig.push(geoviewLayerConfigCasted.listOfLayerEntryConfig[j]);
    }
  }

  // Return it
  return serializedGeoviewLayerConfig as never;
};
// #endregion LAYERS END

// #region VIEWER CONFIG TYPES
/** ******************************************************************************************************************************
 *  Definition of the map feature instance according to what is specified in the schema.
 */
export type TypeMapFeaturesInstance = {
  /** map configuration. */
  map: TypeMapConfig;
  /** Service URLs. */
  serviceUrls: TypeServiceUrls; //! config
  /** Display theme, default = geo.ca. */
  theme?: TypeDisplayTheme; //! config
  /** Nav bar properies. */
  navBar?: TypeNavBarProps; //! config
  /** App bar properies. */
  appBar?: TypeAppBarProps; //! config
  /** Footer bar properies. */
  footerBar?: TypeFooterBarProps; //! config
  /** Overview map properies. */
  overviewMap?: TypeOverviewMapProps; //! config
  /** Map components. */
  components?: TypeMapComponents; //! config
  /** List of core packages. */
  corePackages?: TypeMapCorePackages; //! config
  /** List of external packages. */
  externalPackages?: TypeExternalPackages; //! config
  /**
   * The schema version used to validate the configuration file. The schema should enumerate the list of versions accepted by
   * this version of the viewer.
   */
  schemaVersionUsed?: '1.0';
};

/** ******************************************************************************************************************************
 *  Definition of the map configuration settings.
 */
export type TypeMapConfig = {
  // /** Basemap options settings for this map configuration. */
  basemapOptions: TypeBasemapOptions; //! config
  /** Type of interaction. */
  interaction: TypeInteraction; //! config
  /** List of GeoView Layers in the order which they should be added to the map. */
  listOfGeoviewLayerConfig?: MapConfigLayerEntry[];
  /** View settings. */
  viewSettings: TypeViewSettings; //! config
  /** Highlight color. */
  highlightColor?: TypeHighlightColors; //! config
  /** Additional options used for OpenLayers map options. */
  extraOptions?: Record<string, unknown>;
};

// #region STYLES TYPES
export const isLineStringVectorConfig = (verifyIfConfig: TypeBaseVectorConfig): verifyIfConfig is TypeLineStringVectorConfig => {
  return verifyIfConfig?.type === 'lineString';
};

export const isFilledPolygonVectorConfig = (verifyIfConfig: TypeBaseVectorConfig): verifyIfConfig is TypePolygonVectorConfig => {
  return verifyIfConfig?.type === 'filledPolygon';
};

export const isSimpleSymbolVectorConfig = (verifyIfConfig: TypeBaseVectorConfig): verifyIfConfig is TypeSimpleSymbolVectorConfig => {
  return verifyIfConfig?.type === 'simpleSymbol';
};

export const isIconSymbolVectorConfig = (verifyIfConfig: TypeBaseVectorConfig): verifyIfConfig is TypeIconSymbolVectorConfig => {
  return verifyIfConfig?.type === 'iconSymbol';
};

/** ******************************************************************************************************************************
 * Valid values to specify line styles.
 */
export type TypeLineStyle =
  | 'dash'
  | 'dash-dot'
  | 'dash-dot-dot'
  | 'dot'
  | 'longDash'
  | 'longDash-dot'
  | 'null'
  | 'shortDash'
  | 'shortDash-dot'
  | 'shortDash-dot-dot'
  | 'solid';

/** ******************************************************************************************************************************
 * Stroke style for vector features.
 */
export type TypeStrokeSymbolConfig = {
  /** Color to use for vector features. */
  color?: string;
  /** Line style to use for the feature. */
  lineStyle?: TypeLineStyle;
  /** Width to use for the stroke */
  width?: number;
};

/** ******************************************************************************************************************************
 * Definition of the line symbol vector settings type.
 */
export interface TypeLineStringVectorConfig extends TypeBaseVectorConfig {
  /** Type of vector config */
  type: 'lineString';
  /** Line stroke symbology */
  stroke: TypeStrokeSymbolConfig;
}

/** ******************************************************************************************************************************
 * Valid values to specify fill styles.
 */
export type TypeFillStyle =
  | 'null'
  | 'solid'
  | 'backwardDiagonal'
  | 'cross'
  | 'diagonalCross'
  | 'forwardDiagonal'
  | 'horizontal'
  | 'vertical';

/** ******************************************************************************************************************************
 * Definition of the line symbol vector settings type.
 */
export interface TypePolygonVectorConfig extends TypeBaseVectorConfig {
  /** Type of vector config */
  type: 'filledPolygon';
  /** Fill color for vector features. */
  color?: string;
  /** Line stroke symbology */
  stroke: TypeStrokeSymbolConfig;
  /** Distance between patern lines. Default = 8. */
  paternSize?: number;
  /** Patern line width.default = 1. */
  paternWidth?: number;
  /** Kind of filling  for vector features. Default = solid.  */
  fillStyle: TypeFillStyle;
}

/** ******************************************************************************************************************************
 * Valid values to specify symbol shapes.
 */
export type TypeSymbol = 'circle' | '+' | 'diamond' | 'square' | 'triangle' | 'X' | 'star';

/** ******************************************************************************************************************************
 * Definition of the circle symbol vector settings type.
 */
export interface TypeSimpleSymbolVectorConfig extends TypeBaseVectorConfig {
  /** Type of vector config */
  type: 'simpleSymbol';
  /** Symbol rotation in radians. */
  rotation?: number;
  /** Fill color for vector features. */
  color?: string;
  /** Symbol stroke symbology */
  stroke?: TypeStrokeSymbolConfig;
  /** size of the symbol. */
  size?: number;
  /** Ofset of the symbol. */
  offset?: [number, number];
  /** Symbol to draw. */
  symbol: TypeSymbol;
}

/** ******************************************************************************************************************************
 * Definition of the icon symbol vector settings type.
 */
export interface TypeIconSymbolVectorConfig extends TypeBaseVectorConfig {
  /** Type of vector config */
  type: 'iconSymbol';
  /** Mime type of the icon. */
  mimeType: string;
  /** Icon source. */
  src: string;
  /** Icon width in pixel. */
  width?: number;
  /** Icon height in pixel. */
  height?: number;
  /** Icon rotation in radians. */
  rotation?: number;
  /** Icon opacity. */
  opacity?: number;
  /** Ofset of the icon. */
  offset?: [number, number];
  /**
   * The crossOrigin attribute for loaded images. Note that you must provide a crossOrigin value if you want to access pixel data
   * with the Canvas renderer.
   */
  crossOrigin?: string;
}

/** ******************************************************************************************************************************
 * Base style configuration.
 */
export type TypeBaseStyleType = 'simple' | 'uniqueValue' | 'classBreaks';

/** ******************************************************************************************************************************
 * Base style configuration.
 */
export type TypeBaseStyleConfig = {
  /** Type of style. */
  styleType: TypeBaseStyleType;
};

/** ******************************************************************************************************************************
 * type guard function that redefines a TypeBaseStyleConfig as a TypeSimpleStyleConfig if the type attribute of the
 * verifyIfConfig parameter is 'simple'. The type ascention applies only to the true block of the if clause that use
 * this function.
 *
 * @param {TypeStyleSettings | TypeKindOfVectorSettings} verifyIfConfig Polymorphic object to test in order to determine if
 * the type ascention is valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const isSimpleStyleConfig = (
  verifyIfConfig: TypeStyleSettings | TypeKindOfVectorSettings
): verifyIfConfig is TypeSimpleStyleConfig => {
  return (verifyIfConfig as TypeStyleSettings)?.styleType === 'simple';
};

/** ******************************************************************************************************************************
 * Simple style configuration.
 */
export interface TypeSimpleStyleConfig extends TypeBaseStyleConfig {
  /** Type of style. */
  styleType: 'simple';
  /** Label associated to the style */
  label: string;
  /** options associated to the style. */
  settings: TypeKindOfVectorSettings;
}

/** ******************************************************************************************************************************
 * Unique value style information configuration.
 */
export type TypeUniqueValueStyleInfo = {
  /** Label used by the style. */
  label: string;
  /** Values associated to the style. */
  values: (string | number | Date)[];
  /** Flag used to show/hide features associated to the label (default: yes). */
  visible?: boolean;
  /** options associated to the style. */
  settings: TypeKindOfVectorSettings;
};

/** ******************************************************************************************************************************
 * type guard function that redefines a TypeStyleSettings | TypeKindOfVectorSettings as a TypeUniqueValueStyleConfig if the
 * styleType attribute of the verifyIfConfig parameter is 'uniqueValue'. The type ascention applies only to the true block of the
 * if clause that use this function.
 *
 * @param {TypeStyleSettings | TypeKindOfVectorSettings} verifyIfConfig Polymorphic object to test in order to determine if the
 * type ascention is valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const isUniqueValueStyleConfig = (
  verifyIfConfig: TypeStyleSettings | TypeKindOfVectorSettings
): verifyIfConfig is TypeUniqueValueStyleConfig => {
  return (verifyIfConfig as TypeStyleSettings)?.styleType === 'uniqueValue';
};

/** ******************************************************************************************************************************
 * Unique value style configuration.
 */
export interface TypeUniqueValueStyleConfig extends TypeBaseStyleConfig {
  /** Type of style. */
  styleType: 'uniqueValue';
  /** Label used if field/value association is not found. */
  defaultLabel?: string;
  /** Options used if field/value association is not found. */
  defaultSettings?: TypeKindOfVectorSettings;
  /** Flag used to show/hide features associated to the default label
   *  (default: no if ESRI renderer in the metadata has no default symbol defined). */
  defaultVisible?: boolean;
  /** Fields used by the style. */
  fields: string[];
  /** Unique value style information configuration. */
  uniqueValueStyleInfo: TypeUniqueValueStyleInfo[];
}

/** ******************************************************************************************************************************
 * Class break style information configuration.
 */
export type TypeClassBreakStyleInfo = {
  /** Label used by the style. */
  label: string;
  /** Minimum values associated to the style. */
  minValue: number | string | Date | undefined | null;
  /** Flag used to show/hide features associated to the label (default: yes). */
  visible?: boolean;
  /** Maximum values associated to the style. */
  maxValue: number | string | Date;
  /** options associated to the style. */
  settings: TypeKindOfVectorSettings;
};

/** ******************************************************************************************************************************
 * type guard function that redefines a TypeStyleSettings | TypeKindOfVectorSettings as a TypeClassBreakStyleConfig if the
 * styleType attribute of the verifyIfConfig parameter is 'classBreaks'. The type ascention applies only to the true block of the
 * if clause that use this function.
 *
 * @param {TypeStyleSettings | TypeKindOfVectorSettings} verifyIfConfig Polymorphic object to test in order to determine if the
 * type ascention is valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const isClassBreakStyleConfig = (
  verifyIfConfig: TypeStyleSettings | TypeKindOfVectorSettings
): verifyIfConfig is TypeClassBreakStyleConfig => {
  return (verifyIfConfig as TypeStyleSettings)?.styleType === 'classBreaks';
};

/** ******************************************************************************************************************************
 * Class break style configuration.
 */
export interface TypeClassBreakStyleConfig extends TypeBaseStyleConfig {
  /** Type of style. */
  styleType: 'classBreaks';
  /** Label used if field/value association is not found. */
  defaultLabel?: string;
  /** Options used if field/value association is not found. */
  defaultVisible?: boolean;
  /** Flag used to show/hide features associated to the default label (default: yes). */
  defaultSettings?: TypeKindOfVectorSettings;
  /** Field used by the style. */
  field: string;
  /** Class break style information configuration. */
  classBreakStyleInfo: TypeClassBreakStyleInfo[];
}

/** ******************************************************************************************************************************
 * Type of Style to apply to the GeoView vector layer source at creation time.
 */
export type TypeStyleSettings = TypeBaseStyleConfig | TypeSimpleStyleConfig | TypeUniqueValueStyleConfig | TypeClassBreakStyleConfig;

/** ******************************************************************************************************************************
 * Valid keys for the TypeStyleConfig object.
 */
export type TypeStyleGeometry = 'Point' | 'LineString' | 'Polygon';

/** ******************************************************************************************************************************
 * Type of Style to apply to the GeoView vector layer based on geometry types.
 */
export type TypeStyleConfig = Partial<Record<TypeStyleGeometry, TypeStyleSettings>>;
// #endregion STYLES TYPES
