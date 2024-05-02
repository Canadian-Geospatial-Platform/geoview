// We use _ for layerPth and olLayer all over the file. We keep it global...
import { Extent } from 'ol/extent';
import BaseLayer from 'ol/layer/Base';
import LayerGroup from 'ol/layer/Group';
import { Coordinate } from 'ol/coordinate';

import { TypeBasemapOptions } from '@/geo/layer/basemap/basemap-types';
import { AbstractGeoViewLayer, CONST_LAYER_TYPES, TypeGeoviewLayerType } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
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

// #region UTILITIES TYPES

/** ******************************************************************************************************************************
 *  Definition of the post settings type needed when the GeoView GeoJSON layers need to use a POST instead of a GET.
 */
export type TypePostSettings = { header?: Record<string, string>; data: unknown };

/** ******************************************************************************************************************************
 *  Definition of a bilingual string.
 */
export type TypeLocalizedString = TypeLocalizedStringEnAndFr | TypeLocalizedStringFr | TypeLocalizedStringEn;

/** ******************************************************************************************************************************
 *  Definition of a bilingual string, only English provided.
 */
export type TypeLocalizedStringEn = Pick<TypeLocalizedStringEnAndFr, 'en'> & Partial<Pick<TypeLocalizedStringEnAndFr, 'fr'>>;

/** ******************************************************************************************************************************
 *  Definition of a bilingual string, only French provided.
 */
export type TypeLocalizedStringFr = Pick<TypeLocalizedStringEnAndFr, 'fr'> & Partial<Pick<TypeLocalizedStringEnAndFr, 'en'>>;

/** ******************************************************************************************************************************
 *  Definition of a bilingual string, both English and French provided.
 */
export type TypeLocalizedStringEnAndFr = Required<Record<TypeDisplayLanguage, string>>;
// #endregion UTILITIES TYPES

/** ******************************************************************************************************************************
 * Initial settings to apply to the GeoView layer at creation time.
 */
export type TypeLayerInitialSettings = {
  /** Settings for availablity of controls */
  controls?: TypeLayerControls;
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
  states?: TypeLayerStates;
};

/** ******************************************************************************************************************************
 * Control settings to use in UI.
 */
export type TypeLayerControls = {
  /** Is highlight control available for layer. Default = true */
  highlight?: boolean;
  /** Is hover control available for layer. Default = true */
  hover?: boolean;
  /** Is opacity control available for layer. Default = true */
  opacity?: boolean;
  /** Is query control available for layer. Default = true */
  query?: boolean;
  /** Is remove control available for layer. Default = true */
  remove?: boolean;
  /** Is table available for layer. Default = true */
  table?: boolean;
  /** Is visibility control available for layer. Default = true */
  visibility?: boolean;
  /** Is zoom available for layer. Default = true */
  zoom?: boolean;
};

/** ******************************************************************************************************************************
 * Initial settings to apply to the GeoView layer at creation time.
 */
export type TypeLayerStates = {
  /** Is the layer initially visible. Default = true */
  visible?: boolean;
  /** Initial opacity setting. Default = 1 */
  opacity?: number;
  /** Is layer hoverable initially. Domain = [0..1] and default = 1. */
  hoverable?: boolean;
  /** Is layer queryable initially. Default = true */
  queryable?: boolean;
};

/** ******************************************************************************************************************************
 * Type that defines the vector layer source formats.
 */
// TODO: Figure out the missing types here
export type TypeVectorSourceFormats =
  | typeof CONST_LAYER_TYPES.GEOJSON
  | 'EsriJSON'
  | 'KML'
  | 'WFS'
  | 'featureAPI'
  | typeof CONST_LAYER_TYPES.GEOPACKAGE
  | typeof CONST_LAYER_TYPES.CSV;

/** ******************************************************************************************************************************
 * Type used to configure a custom parser.
 */
export type TypeDetailsLayerConfig = {
  /**
   * A path to a javascript file with a function for parsing the layers identify output. Only needed if a custom template is
   * being used.
   */
  parser?: string;
  /** A path to an html template (English/French) that will override default identify output. */
  template: TypeLocalizedString;
};

/** ******************************************************************************************************************************
 * Type used to configure the feature info for a layer.
 */
export type TypeFeatureInfoLayerConfig = {
  /** Allow querying. Default = false. */
  queryable: boolean;
  customParser?: TypeDetailsLayerConfig;
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

/** ******************************************************************************************************************************
 * Initial settings to apply to the GeoView vector layer source at creation time.
 */
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

/** ******************************************************************************************************************************
 * Initial settings to apply to the GeoView vector layer source at creation time.
 */
export interface TypeVectorSourceInitialConfig extends TypeBaseSourceVectorInitialConfig {
  /** The feature format used by the XHR feature loader when url is set. */
  format?: TypeVectorSourceFormats;
  /** The character used to separate columns of csv file */
  separator?: string;
}

/** ******************************************************************************************************************************
 * Kind of symbol vector settings.
 */
export type TypeKindOfVectorSettings =
  | TypeBaseVectorConfig
  | TypeLineStringVectorConfig
  | TypePolygonVectorConfig
  | TypeSimpleSymbolVectorConfig
  | TypeIconSymbolVectorConfig;

/** ******************************************************************************************************************************
 * Definition of the line symbol vector settings type.
 */
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

/** ******************************************************************************************************************************
 * type guard function that redefines a TypeLayerEntryConfig as a GroupLayerEntryConfig if the entryType attribute of the
 * verifyIfLayer parameter is CONST_LAYER_ENTRY_TYPES.GROUP. The type ascention applies only to the true block of the if clause that use this function.
 *
 * @param {TypeLayerEntryConfig} verifyIfLayer Polymorphic object to test in order to determine if the type ascention is valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const layerEntryIsGroupLayer = (verifyIfLayer: ConfigBaseClass): verifyIfLayer is GroupLayerEntryConfig => {
  return verifyIfLayer?.entryType === CONST_LAYER_ENTRY_TYPES.GROUP;
};

/** ******************************************************************************************************************************
 * type guard function that redefines a TypeLayerEntryConfig as a VectorLayerEntryConfig if the entryType attribute of
 * the verifyIfLayer parameter is 'vector'. The type ascention applies only to the true block of the if clause that use this
 * function.
 *
 * @param {TypeLayerEntryConfig} verifyIfLayer Polymorphic object to test in order to determine if the type ascention is valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const layerEntryIsVector = (verifyIfLayer: TypeLayerEntryConfig): verifyIfLayer is VectorLayerEntryConfig => {
  return verifyIfLayer?.entryType === CONST_LAYER_ENTRY_TYPES.VECTOR;
};

/** ******************************************************************************************************************************
 * type guard function that redefines a TypeLayerEntryConfig as a VectorTileLayerEntryConfig if the entryType attribute of the
 * verifyIfLayer parameter is 'vector' and the object has a style attribute. The type ascention applies only to the true block
 * of the if clause that use this function.
 *
 * @param {TypeLayerEntryConfig} verifyIfLayer Polymorphic object to test in order to determine if the type ascention is valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const layerEntryIsVectorTile = (verifyIfLayer: TypeLayerEntryConfig): verifyIfLayer is TileLayerEntryConfig => {
  return verifyIfLayer?.entryType === CONST_LAYER_ENTRY_TYPES.VECTOR_TILE;
};

/** ******************************************************************************************************************************
 * type guard function that redefines a TypeLayerEntryConfig as a TileLayerEntryConfig if the entryType attribute of the
 * verifyIfLayer parameter is 'raster-tile'. The type ascention applies only to the true block of the if clause that use this
 * function.
 *
 * @param {TypeLayerEntryConfig} verifyIfLayer Polymorphic object to test in order to determine if the type ascention is valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const layerEntryIsRasterTile = (verifyIfLayer: TypeLayerEntryConfig): verifyIfLayer is TileLayerEntryConfig => {
  return verifyIfLayer?.entryType === CONST_LAYER_ENTRY_TYPES.RASTER_TILE;
};

/** ******************************************************************************************************************************
 * type guard function that redefines a TypeLayerEntryConfig as a OgcWmsLayerEntryConfig if the schemaTag attribute of the
 * verifyIfLayer parameter is CONST_LAYER_TYPES.WMS. The type ascention applies only to the true block of the if clause that use this
 * function.
 *
 * @param {TypeLayerEntryConfig} verifyIfLayer Polymorphic object to test in order to determine if the type ascention is valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const layerEntryIsOgcWms = (verifyIfLayer: TypeLayerEntryConfig): verifyIfLayer is OgcWmsLayerEntryConfig => {
  return verifyIfLayer?.schemaTag === CONST_LAYER_TYPES.WMS;
};

/** ******************************************************************************************************************************
 * type guard function that redefines a TypeLayerEntryConfig as a EsriDynamicLayerEntryConfig if the schemaTag attribute of
 * the verifyIfLayer parameter is CONST_LAYER_TYPES.WMS. The type ascention applies only to the true block of the if clause that use this
 * function.
 *
 * @param {TypeLayerEntryConfig} verifyIfLayer Polymorphic object to test in order to determine if the type ascention is valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const layerEntryIsEsriDynamic = (verifyIfLayer: TypeLayerEntryConfig): verifyIfLayer is EsriDynamicLayerEntryConfig => {
  return verifyIfLayer?.schemaTag === CONST_LAYER_TYPES.ESRI_DYNAMIC;
};

/** ******************************************************************************************************************************
 * type guard function that redefines a TypeLayerEntryConfig as a EsriImageLayerEntryConfig if the schemaTag attribute of
 * the verifyIfLayer parameter is CONST_LAYER_TYPES.WMS. The type ascention applies only to the true block of the if clause that use this
 * function.
 *
 * @param {TypeLayerEntryConfig} verifyIfLayer Polymorphic object to test in order to determine if the type ascention is valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const layerEntryIsEsriimage = (verifyIfLayer: TypeLayerEntryConfig): verifyIfLayer is EsriImageLayerEntryConfig => {
  return verifyIfLayer?.schemaTag === CONST_LAYER_TYPES.ESRI_IMAGE;
};

/** ******************************************************************************************************************************
 * type guard function that redefines a TypeLayerEntryConfig as a ImageStaticLayerEntryConfig if the schemaTag attribute of
 * the verifyIfLayer parameter is CONST_LAYER_TYPES.WMS. The type ascention applies only to the true block of the if clause that use this
 * function.
 *
 * @param {TypeLayerEntryConfig} verifyIfLayer Polymorphic object to test in order to determine if the type ascention is valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const layerEntryIsImageStatic = (verifyIfLayer: TypeLayerEntryConfig): verifyIfLayer is ImageStaticLayerEntryConfig => {
  return verifyIfLayer?.schemaTag === CONST_LAYER_TYPES.IMAGE_STATIC;
};

/** ******************************************************************************************************************************
 * Valid values for the layerStatus property.
 */
// TODO: refactor - are all these statuses still good?
export type TypeLayerStatus = 'registered' | 'newInstance' | 'processing' | 'processed' | 'loading' | 'loaded' | 'error';

/** ******************************************************************************************************************************
 * Valid values for the loadEndListenerType.
 */
export type TypeLoadEndListenerType = 'features' | 'tile' | 'image';

/** ******************************************************************************************************************************
 * Type used to initialize the olLayer property and to setup the listeners.
 */
export type TypeLayerAndListenerType = {
  olLayer: BaseLayer | LayerGroup | null;
  loadEndListenerType?: TypeLoadEndListenerType;
};

/** ******************************************************************************************************************************
 * Type used to allow a call to applyViewFilter from an AbstractGeoViewLayer.
 */
export type GeoviewChild = AbstractGeoViewLayer & Record<'applyViewFilter', (layerPath: string, layerFilter: string) => void>;

/** ******************************************************************************************************************************
 * Type that defines the domain of valid values for the ESRI format parameter.
 */
export type TypeEsriFormatParameter = 'png' | 'jpg' | 'gif' | 'svg';

/** ******************************************************************************************************************************
 * Type of server.
 */
export type TypeOfServer = 'mapserver' | 'geoserver' | 'qgis';

/** ******************************************************************************************************************************
 * Initial settings for image sources.
 */
export type TypeSourceImageInitialConfig =
  | TypeSourceImageWmsInitialConfig
  | TypeSourceImageEsriInitialConfig
  | TypeSourceImageStaticInitialConfig;

/** ******************************************************************************************************************************
 * Initial settings for image sources.
 */
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
  projection?: TypeValidMapProjectionCodes;
  /** Definition of the feature information structure that will be used by the getFeatureInfo method. */
  featureInfo?: TypeFeatureInfoLayerConfig;
};

/** ******************************************************************************************************************************
 * Initial settings for WMS image sources.
 */
export interface TypeSourceImageWmsInitialConfig extends TypeBaseSourceImageInitialConfig {
  /** The type of the remote WMS server. The default value is mapserver. */
  serverType?: TypeOfServer;
  /** Style to apply. Default = '' */
  style?: string | string[];
}

/** ******************************************************************************************************************************
 * Initial settings for static image sources.
 */
export interface TypeSourceImageStaticInitialConfig extends Omit<TypeBaseSourceImageInitialConfig, 'featureInfo'> {
  /** Definition of the feature information structure that will be used by the getFeatureInfo method. We only use queryable and
   * it must be set to false if specified.
   */
  featureInfo?: { queryable: false };
  /** Image extent */
  extent: Extent;
}

/** ******************************************************************************************************************************
 * Initial settings for WMS image sources.
 */
export interface TypeSourceImageEsriInitialConfig extends TypeBaseSourceImageInitialConfig {
  /** The format used by the image layer. */
  format?: TypeEsriFormatParameter;
  /**
   * If true, the image will be exported with the background color of the map set as its transparent color. Only the .png and
   * .gif formats support transparency. Default = true.
   */
  transparent?: boolean;
}

/** ******************************************************************************************************************************
 * Definition of the tile grid structure.
 */
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

/** ******************************************************************************************************************************
 * Initial settings for tile image sources.
 */
export interface TypeSourceTileInitialConfig extends Omit<TypeBaseSourceImageInitialConfig, 'featureInfo'> {
  /** Definition of the feature information structure that will be used by the getFeatureInfo method. We only use queryable and
   * it must be set to false if specified.
   */
  featureInfo?: { queryable: false };
  /** Tile grid parameters to use. */
  tileGrid?: TypeTileGrid;
}

/** ******************************************************************************************************************************
 * Initial settings to apply to the GeoView vector tile layer source at creation time.
 */
export interface TypeVectorTileSourceInitialConfig extends TypeBaseSourceVectorInitialConfig {
  /** Tile grid parameters to use. */
  tileGrid?: TypeTileGrid;
}

/** ******************************************************************************************************************************
 * Layer config type.
 */
export type TypeLayerEntryConfig =
  | AbstractBaseLayerEntryConfig
  | VectorLayerEntryConfig
  | VectorLayerEntryConfig
  | OgcWmsLayerEntryConfig
  | EsriDynamicLayerEntryConfig
  | EsriImageLayerEntryConfig
  | ImageStaticLayerEntryConfig
  | TileLayerEntryConfig
  | GroupLayerEntryConfig;

/** ******************************************************************************************************************************
 * List of layers. Corresponds to the layerList defined in the schema.
 */
// TODO: Suggestion - Get rid of this type. Simply use TypeLayerEntryConfig[]. It'd simplify types management accross the source code.
export type TypeListOfLayerEntryConfig = TypeLayerEntryConfig[];

/** ******************************************************************************************************************************
 *  Definition of the Geoview layer list.
 */
// TODO: Suggestion - Get rid of this type. Simply use TypeGeoviewLayerConfig[]. It'd simplify types management accross the source code.
export type TypeListOfGeoviewLayerConfig = TypeGeoviewLayerConfig[];

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
  listOfLayerEntryConfig: TypeListOfLayerEntryConfig;
};

/**
 * Definition of a GeoCore layer configuration
 */
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
    initialSettingss: geoviewLayerConfigCasted.initialSettings,
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

// #region VIEWER CONFIG TYPES
/** ******************************************************************************************************************************
 * List of supported geoview theme.
 */
export type TypeDisplayTheme = 'dark' | 'light' | 'geo.ca';
export const VALID_DISPLAY_THEME: TypeDisplayTheme[] = ['dark', 'light', 'geo.ca'];

/** ******************************************************************************************************************************
 *  Definition of the map feature instance according to what is specified in the schema.
 */
export type TypeMapFeaturesInstance = {
  /** map configuration. */
  map: TypeMapConfig;
  /** Service URLs. */
  serviceUrls: TypeServiceUrls;
  /** Display theme, default = geo.ca. */
  theme?: TypeDisplayTheme;
  /** Nav bar properies. */
  navBar?: TypeNavBarProps;
  /** App bar properies. */
  appBar?: TypeAppBarProps;
  /** Footer bar properies. */
  footerBar?: TypeFooterBarProps;
  /** Overview map properies. */
  overviewMap?: TypeOverviewMapProps;
  /** Map components. */
  components?: TypeMapComponents;
  /** List of core packages. */
  corePackages?: TypeMapCorePackages;
  /** List of external packages. */
  externalPackages?: TypeExternalPackages;
  /**
   * ISO 639-1 code indicating the languages supported by the configuration file. It will use value(s) provided here to
   * access bilangual configuration nodes. For value(s) provided here, each bilingual configuration node MUST provide a value.
   * */
  suportedLanguages: TypeListOfLocalizedLanguages;
  /**
   * The schema version used to validate the configuration file. The schema should enumerate the list of versions accepted by
   * this version of the viewer.
   */
  schemaVersionUsed?: '1.0';
};

/* *******************************************************************************************************************************
/** ISO 639-1  language code prefix. */
export type TypeDisplayLanguage = 'en' | 'fr';
/** Constante mainly use for language prefix validation. */
export const VALID_DISPLAY_LANGUAGE: TypeDisplayLanguage[] = ['en', 'fr'];
/** ******************************************************************************************************************************
 * ISO 639-1 code indicating the languages supported by the configuration file. It will use value(s) provided here to access
 * bilangual nodes. For value(s) provided here, each bilingual node MUST provide a value.
 */
export type TypeLocalizedLanguages = 'en' | 'fr';
/** List of languages supported by the map. */
export type TypeListOfLocalizedLanguages = TypeLocalizedLanguages[];
/** Constante mainly use for language code validation. */
export const VALID_LOCALIZED_LANGUAGES: TypeListOfLocalizedLanguages = ['en', 'fr'];

/* *******************************************************************************************************************************
/** Valid version number. */
export type TypeValidVersions = '1.0';
/** Constante mainly use for version validation. */
export const VALID_VERSIONS: TypeValidVersions[] = ['1.0'];

/** Type used to define the map mouse information  */
export type TypeMapMouseInfo = {
  lnglat: Coordinate;
  pixel: Coordinate;
  projected: Coordinate;
  dragging: boolean;
};

/** ******************************************************************************************************************************
 *  Definition of map state to attach to the map object for reference.
 */
export type TypeMapState = {
  currentProjection: number;
  currentZoom: number;
  mapCenterCoordinates: Coordinate;
  singleClickedPosition: TypeMapMouseInfo;
  pointerPosition: TypeMapMouseInfo;
};

/** ******************************************************************************************************************************
 *  Definition of the map configuration settings.
 */
export type TypeMapConfig = {
  /** Basemap options settings for this map configuration. */
  basemapOptions: TypeBasemapOptions;
  /** Type of interaction. */
  interaction: TypeInteraction;
  /** List of GeoView Layers in the order which they should be added to the map. */
  listOfGeoviewLayerConfig?: MapConfigLayerEntry[];
  /** View settings. */
  viewSettings: TypeViewSettings;
  /** Highlight color. */
  highlightColor?: TypeHighlightColors;
  /** Additional options used for OpenLayers map options. */
  extraOptions?: Record<string, unknown>;
};

/** ******************************************************************************************************************************
 *  Definition of the valid map interactiom values. If map is dynamic (pan/zoom) or static to act as a thumbnail (no nav bar).
 */
export type TypeInteraction = 'static' | 'dynamic';
/** Constante mainly use for interaction validation. */
export const VALID_INTERACTION: TypeInteraction[] = ['static', 'dynamic'];

/** ******************************************************************************************************************************
 *  Definition of the initial view settings.
 */
export type TypeInitialViewSettings = {
  /**
   * Option to set the zoom and center of initial view.
   * Zoom and center of the map defined as [zoom, [longitude, latitude]]. Longitude domaine = [-160..160],
   * Latitude domaine = [-80..80]. */
  zoomAndCenter?: [number, [number, number]];
  /**
   * Option to set initial view by extent.
   * Called with [minX, minY, maxX, maxY] extent coordinates. */
  extent?: Extent;
  /** IDs of layers to use for initial map extent. */
  layerIds?: string[];
};

/** ******************************************************************************************************************************
 *  Definition of the view settings.
 */
export type TypeViewSettings = {
  /** Settings for the initial view for map, default is zoomAndCenter of [3.5, [-90, 65]] */
  initialView?: TypeInitialViewSettings;
  /** Enable rotation. If false, a rotation constraint that always sets the rotation to zero is used. Default = true. */
  enableRotation?: boolean;
  /**
   * The initial rotation for the view in degree (positive rotation clockwise, 0 means North). Will be converted to radiant by
   * the viewer. Domaine = [0..360], default = 0.
   */
  rotation?: number;
  /** The extent that constrains the view. Called with [minX, minY, maxX, maxY] extent coordinates.
   * Default [-125, 30, -60, 89].
   */
  maxExtent?: Extent;
  /**
   * The minimum zoom level used to determine the resolution constraint. If not set, will use default from basemap.
   * Domaine = [0..50].
   */
  minZoom?: number;
  /**
   * The maximum zoom level used to determine the resolution constraint. If not set, will use default from basemap.
   * Domaine = [0..50].
   */
  maxZoom?: number;
  /**
   * Spatial Reference EPSG code supported (https://epsg.io/). We support Web Mercator and Lambert Conical Conform Canada.
   * Default = 3978.
   */
  projection: TypeValidMapProjectionCodes;
};

/** ******************************************************************************************************************************
 *  Type used to define valid highlight colors.
 */
export type TypeHighlightColors = 'black' | 'white' | 'red' | 'green';

/** ******************************************************************************************************************************
 *  Type used to define valid projection codes.
 */
export type TypeValidMapProjectionCodes = 3978 | 3857;

/** ******************************************************************************************************************************
 *  Constant mainly used to test if a TypeValidMapProjectionCodes variable is a valid projection codes.
 */
export const VALID_PROJECTION_CODES = [3978, 3857];

/** ******************************************************************************************************************************
 * Controls available on the navigation bar. Default = ['zoom', 'fullscreen', 'home'].
 */
export type TypeNavBarProps = Array<'zoom' | 'fullscreen' | 'home' | 'location'>;

/** ******************************************************************************************************************************
 * Configuration available on the application bar. Default = ['geolocator']. The about GeoView and notification are always there.
 */
export type TypeAppBarProps = {
  tabs: {
    core: TypeValidAppBarCoreProps;
  };
};
export type TypeValidAppBarCoreProps = Array<'geolocator' | 'export' | 'basemap-panel' | 'geochart' | 'guide' | 'legend' | 'details'>;

/** ******************************************************************************************************************************
 * Configuration available for the footer bar component.
 */
export type TypeFooterBarProps = {
  tabs: {
    core: TypeValidFooterBarTabsCoreProps;
    custom: Array<string>; // TODO: support custom tab by creating a Typeobject for it
  };
  collapsed: boolean;
};
export type TypeValidFooterBarTabsCoreProps = Array<'legend' | 'layers' | 'details' | 'data-table' | 'time-slider' | 'geochart' | 'guide'>;

/** ******************************************************************************************************************************
 *  Overview map options. Default none.
 */
export type TypeOverviewMapProps = { hideOnZoom: number } | undefined;

/** ******************************************************************************************************************************
 * Core components to initialize on viewer load. Default = ['north-arrow', 'overview-map'].
 */
export type TypeMapComponents = Array<'north-arrow' | 'overview-map'>;

/** ******************************************************************************************************************************
 * Core packages to initialize on viewer load. The schema for those are on their own package. NOTE: config from packages are in
 * the same loaction as core config (<<core config name>>-<<package name>>.json).
 * Default = [].
 */
export type TypeMapCorePackages = Array<'swiper'>;

/** ******************************************************************************************************************************
 * List of external packages to initialize on viewer load. Default = [].
 */
export type TypeExternalPackages = {
  /** External Package name. The name must be identical to the window external package object to load. */
  name: string;
  /**
   * The url to the external package configuration setting. The core package will read the configuration and pass it inside
   * the package.
   */
  configUrl?: string;
}[];

// ?: Is this type realy needed, it is used nowhere in our code.
/** ******************************************************************************************************************************
 * Service endpoint urls. Default = 'https://geocore.api.geo.ca'.
 */
export type TypeServiceUrls = {
  /**
   * Service end point to access API for layers specification (loading and plugins parameters). By default it is GeoCore but can
   * be another endpoint with similar output.
   */
  geocoreUrl: string;
  /**
   * An optional proxy to be used for dealing with same-origin issues.  URL must either be a relative path on the same server
   * or an absolute path on a server which sets CORS headers.
   */
  proxyUrl?: string;
  /**
   * An optional geolocator service end point url, which will be used to call to get geo location of address.
   */
  geolocator?: string;
};
// #endregion VIEWER CONFIG TYPES

// #region STYLES TYPES
/** ******************************************************************************************************************************
 * type guard function that redefines a TypeBaseVectorConfig as a TypeLineStringVectorConfig if the type attribute of the
 * verifyIfConfig parameter is 'lineString'. The type ascention applies only to the true block of the if clause that use
 * this function.
 *
 * @param {TypeBaseVectorConfig} verifyIfConfig Polymorphic object to test in order to determine if the type ascention is valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const isLineStringVectorConfig = (verifyIfConfig: TypeBaseVectorConfig): verifyIfConfig is TypeLineStringVectorConfig => {
  return verifyIfConfig?.type === 'lineString';
};

/** ******************************************************************************************************************************
 * type guard function that redefines a TypeBaseVectorConfig as a TypePolygonVectorConfig if the type attribute of the
 * verifyIfConfig parameter is 'filledPolygon'. The type ascention applies only to the true block of the if clause that use
 * this function.
 *
 * @param {TypeBaseVectorConfig} verifyIfConfig Polymorphic object to test in order to determine if the type ascention is valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const isFilledPolygonVectorConfig = (verifyIfConfig: TypeBaseVectorConfig): verifyIfConfig is TypePolygonVectorConfig => {
  return verifyIfConfig?.type === 'filledPolygon';
};

/** ******************************************************************************************************************************
 * type guard function that redefines a TypeBaseVectorConfig as a TypeSimpleSymbolVectorConfig if the type attribute of the
 * verifyIfConfig parameter is 'simpleSymbol'. The type ascention applies only to the true block of the if clause that use
 * this function.
 *
 * @param {TypeBaseVectorConfig} verifyIfConfig Polymorphic object to test in order to determine if the type ascention is valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const isSimpleSymbolVectorConfig = (verifyIfConfig: TypeBaseVectorConfig): verifyIfConfig is TypeSimpleSymbolVectorConfig => {
  return verifyIfConfig?.type === 'simpleSymbol';
};

/** ******************************************************************************************************************************
 * type guard function that redefines a TypeBaseVectorConfig as a TypeIconSymbolVectorConfig if the type attribute of the
 * verifyIfConfig parameter is 'iconSymbol'. The type ascention applies only to the true block of the if clause that use
 * this function.
 *
 * @param {TypeBaseVectorConfig} verifyIfConfig Polymorphic object to test in order to determine if the type ascention is valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
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
