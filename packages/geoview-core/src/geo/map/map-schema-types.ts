/* eslint-disable no-underscore-dangle */
/* eslint-disable max-classes-per-file */
import { Extent } from 'ol/extent';
import BaseLayer from 'ol/layer/Base';
import LayerGroup from 'ol/layer/Group';
import { Coordinate } from 'ol/coordinate';

import { TypeBasemapOptions } from '@/geo/layer/basemap/basemap-types';
import { AbstractGeoViewLayer, TypeGeoviewLayerType } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { TypeMapMouseInfo } from '@/api/events/payloads';
import { createLocalizedString } from '@/core/utils/utilities';
import { logger } from '@/core/utils/logger';
import { Cast, LayerSetPayload, TypeJsonValue } from '@/core/types/cgpv-types';
import { api } from '@/app';

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
 *  Definition of the post settings type needed when the GeoView GeoJSON layers need to use a POST instead of a GET.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TypePostSettings = { header?: Record<string, string>; data: any };

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

/** ******************************************************************************************************************************
 * Initial settings to apply to the GeoView layer at creation time.
 */
export type TypeVisibilityFlags = 'yes' | 'no' | 'always';
export type TypeLayerInitialSettings = {
  /** Initial opacity setting. Domain = [0..1] and default = 1. */
  opacity?: number;
  /** Initial visibility setting. Default = yes. */
  visible?: TypeVisibilityFlags;
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
  /** Is the layer removable. */
  removable?: true;
  /** Is the layer hoverable. */
  hoverable?: true;
  /** Is the layer queryable. */
  queryable?: true;
};

/** ******************************************************************************************************************************
 * Type that defines the vector layer source formats.
 */
export type TypeVectorSourceFormats = 'GeoJSON' | 'EsriJSON' | 'KML' | 'WFS' | 'featureAPI' | 'GeoPackage' | 'CSV';

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
  visible?: TypeVisibilityFlags;
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
  defaultVisible?: TypeVisibilityFlags;
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
  visible?: TypeVisibilityFlags;
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
  defaultVisible?: TypeVisibilityFlags;
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

/** ******************************************************************************************************************************
 * Type of Style to apply to the GeoView vector layer source at creation time.
 */
export type TypeLayerEntryType = 'vector' | 'vector-tile' | 'vector-heatmap' | 'raster-tile' | 'raster-image' | 'geoCore' | 'group';

/** ******************************************************************************************************************************
 * type guard function that redefines a TypeLayerEntryConfig as a TypeLayerGroupEntryConfig if the entryType attribute of the
 * verifyIfLayer parameter is 'group'. The type ascention applies only to the true block of the if clause that use this function.
 *
 * @param {TypeLayerEntryConfig} verifyIfLayer Polymorphic object to test in order to determine if the type ascention is valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const layerEntryIsGroupLayer = (verifyIfLayer: ConfigBaseClass): verifyIfLayer is TypeLayerGroupEntryConfig => {
  return verifyIfLayer?.entryType === 'group';
};

/** ******************************************************************************************************************************
 * type guard function that redefines a TypeLayerEntryConfig as a TypeVectorLayerEntryConfig if the entryType attribute of
 * the verifyIfLayer parameter is 'vector'. The type ascention applies only to the true block of the if clause that use this
 * function.
 *
 * @param {TypeLayerEntryConfig} verifyIfLayer Polymorphic object to test in order to determine if the type ascention is valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const layerEntryIsVector = (verifyIfLayer: TypeLayerEntryConfig): verifyIfLayer is TypeVectorLayerEntryConfig => {
  return verifyIfLayer?.entryType === 'vector';
};

/** ******************************************************************************************************************************
 * type guard function that redefines a TypeLayerEntryConfig as a TypeVectorHeatmapLayerEntryConfig if the entryType attribute of
 * the verifyIfLayer parameter is 'vectorHeatmap'. The type ascention applies only to the true block of the if clause that use this
 * function.
 *
 * @param {TypeLayerEntryConfig} verifyIfLayer Polymorphic object to test in order to determine if the type ascention is valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const layerEntryIsVectorHeatmap = (verifyIfLayer: TypeLayerEntryConfig): verifyIfLayer is TypeVectorHeatmapLayerEntryConfig => {
  return verifyIfLayer?.entryType === 'vector-heatmap';
};

/** ******************************************************************************************************************************
 * type guard function that redefines a TypeLayerEntryConfig as a TypeVectorTileLayerEntryConfig if the entryType attribute of the
 * verifyIfLayer parameter is 'vector' and the object has a style attribute. The type ascention applies only to the true block
 * of the if clause that use this function.
 *
 * @param {TypeLayerEntryConfig} verifyIfLayer Polymorphic object to test in order to determine if the type ascention is valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const layerEntryIsVectorTile = (verifyIfLayer: TypeLayerEntryConfig): verifyIfLayer is TypeVectorTileLayerEntryConfig => {
  return verifyIfLayer?.entryType === 'vector-tile';
};

/** ******************************************************************************************************************************
 * type guard function that redefines a TypeLayerEntryConfig as a TypeOgcWmsLayerEntryConfig if the schemaTag attribute of the
 * verifyIfLayer parameter is 'ogcWms'. The type ascention applies only to the true block of the if clause that use this
 * function.
 *
 * @param {TypeLayerEntryConfig} verifyIfLayer Polymorphic object to test in order to determine if the type ascention is valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const layerEntryIsOgcWms = (verifyIfLayer: TypeLayerEntryConfig): verifyIfLayer is TypeOgcWmsLayerEntryConfig => {
  return verifyIfLayer?.schemaTag === 'ogcWms';
};

/** ******************************************************************************************************************************
 * type guard function that redefines a TypeLayerEntryConfig as a TypeEsriDynamicLayerEntryConfig if the schemaTag attribute of
 * the verifyIfLayer parameter is 'ogcWms'. The type ascention applies only to the true block of the if clause that use this
 * function.
 *
 * @param {TypeLayerEntryConfig} verifyIfLayer Polymorphic object to test in order to determine if the type ascention is valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const layerEntryIsEsriDynamic = (verifyIfLayer: TypeLayerEntryConfig): verifyIfLayer is TypeEsriDynamicLayerEntryConfig => {
  return verifyIfLayer?.schemaTag === 'esriDynamic';
};

/** ******************************************************************************************************************************
 * type guard function that redefines a TypeLayerEntryConfig as a TypeEsriImageLayerEntryConfig if the schemaTag attribute of
 * the verifyIfLayer parameter is 'ogcWms'. The type ascention applies only to the true block of the if clause that use this
 * function.
 *
 * @param {TypeLayerEntryConfig} verifyIfLayer Polymorphic object to test in order to determine if the type ascention is valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const layerEntryIsEsriimage = (verifyIfLayer: TypeLayerEntryConfig): verifyIfLayer is TypeEsriImageLayerEntryConfig => {
  return verifyIfLayer?.schemaTag === 'esriImage';
};

/** ******************************************************************************************************************************
 * type guard function that redefines a TypeLayerEntryConfig as a TypeImageStaticLayerEntryConfig if the schemaTag attribute of
 * the verifyIfLayer parameter is 'ogcWms'. The type ascention applies only to the true block of the if clause that use this
 * function.
 *
 * @param {TypeLayerEntryConfig} verifyIfLayer Polymorphic object to test in order to determine if the type ascention is valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const layerEntryIsImageStatic = (verifyIfLayer: TypeLayerEntryConfig): verifyIfLayer is TypeImageStaticLayerEntryConfig => {
  return verifyIfLayer?.schemaTag === 'imageStatic';
};

/** ******************************************************************************************************************************
 * type guard function that redefines a TypeLayerEntryConfig as a TypeTileLayerEntryConfig if the entryType attribute of the
 * verifyIfLayer parameter is 'raster-tile'. The type ascention applies only to the true block of the if clause that use this
 * function.
 *
 * @param {TypeLayerEntryConfig} verifyIfLayer Polymorphic object to test in order to determine if the type ascention is valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const layerEntryIsRasterTile = (verifyIfLayer: TypeLayerEntryConfig): verifyIfLayer is TypeTileLayerEntryConfig => {
  return verifyIfLayer?.entryType === 'raster-tile';
};

/** ******************************************************************************************************************************
 * type guard function that redefines a TypeLayerEntryConfig as a TypeGeoCoreLayerEntryConfig if the entryType attribute of
 * the verifyIfLayer parameter is 'geocore'. The type ascention applies only to the true block of the if clause that use
 * this function.
 *
 * @param {TypeLayerEntryConfig} verifyIfLayer Polymorphic object to test in order to determine if the type ascention is valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const layerEntryIsGeocore = (verifyIfLayer: TypeLayerEntryConfig): verifyIfLayer is TypeGeoCoreLayerEntryConfig => {
  return verifyIfLayer?.entryType === ('geoCore' as TypeLayerEntryType);
};

/** ******************************************************************************************************************************
 * Valid values for the layerStatus property.
 */
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
type GeoviewChild = AbstractGeoViewLayer & Record<'applyViewFilter', (layerPath: string, layerFilter: string) => void>;

/** ******************************************************************************************************************************
 * Base type used to define a GeoView layer to display on the map. Unless specified,its properties are not part of the schema.
 */
export class ConfigBaseClass {
  /** The identifier of the layer to display on the map. This element is part of the schema. */
  private _layerId = '';

  /** The ending extension (element) of the layer identifier. This element is part of the schema. */
  layerIdExtension?: string;

  /** Tag used to link the entry to a specific schema. This element is part of the schema. */
  schemaTag?: TypeGeoviewLayerType;

  /** Layer entry data type. This element is part of the schema. */
  entryType?: TypeLayerEntryType;

  // TODO: There shouldn't be a coupling to a `AbstractGeoViewLayer` inside a Configuration class.
  // TO.DOCONT: That logic should be elsewhere so that the Configuration class remains portable and immutable.
  /** The geoview layer instance that contains this layer configuration. */
  geoviewLayerInstance?: AbstractGeoViewLayer;

  /** It is used to identified the process phase of the layer */
  layerPhase?: string;

  /** It is used to link the layer entry config to the GeoView layer config. */
  geoviewLayerConfig = {} as TypeGeoviewLayerConfig;

  /** It is used internally to distinguish layer groups derived from the
   * metadata. */
  isMetadataLayerGroup?: boolean;

  // TODO: There shouldn't be a coupling to a `TypeLayerGroupEntryConfig` inside a Configuration class.
  // TO.DOCONT: That logic should be elsewhere so that the Configuration class remains portable and immutable.
  /** It is used to link the layer entry config to the parent's layer config. */
  parentLayerConfig?: TypeGeoviewLayerConfig | TypeLayerGroupEntryConfig;

  /** The layer path to this instance. */
  protected _layerPath = '';

  // TODO: There shouldn't be a coupling to a `BaseLayer` (OpenLayer!) inside a Configuration class.
  // TO.DOCONT: That logic should be elsewhere so that the Configuration class remains portable and immutable.
  /** This property is used to link the displayed layer to its layer entry config. it is not part of the schema. */
  protected _olLayer: BaseLayer | LayerGroup | null = null;

  /** It is used to identified unprocessed layers and shows the final layer state */
  protected _layerStatus: TypeLayerStatus = 'newInstance';

  protected layerStatusWeight = {
    newInstance: 10,
    registered: 20,
    processing: 30,
    processed: 40,
    loading: 50,
    loaded: 60,
    error: 70,
  };

  /** Flag indicating that the loaded signal arrived before the processed one */
  protected waitForProcessedBeforeSendingLoaded = false;

  /**
   * The class constructor.
   * @param {ConfigBaseClass} layerConfig The layer configuration we want to instanciate.
   */
  constructor(layerConfig: ConfigBaseClass) {
    if (layerConfig.entryType === 'geoCore') {
      this._layerPath = '';
      this.geoviewLayerConfig = {} as TypeGeoviewLayerConfig;
      return;
    }
    Object.assign(this, layerConfig);
    if (this.geoviewLayerConfig) this._layerPath = ConfigBaseClass.evaluateLayerPath(layerConfig);
    else logger.logError("Couldn't calculate layerPath because geoviewLayerConfig has an invalid value");
  }

  /**
   * The layerPath getter method for the ConfigBaseClass class and its descendant classes.
   */
  get layerPath() {
    this._layerPath = ConfigBaseClass.evaluateLayerPath(this);
    return this._layerPath;
  }

  /**
   * Getter for the layer Path of the layer configuration parameter.
   * @param {ConfigBaseClass} layerConfig The layer configuration for which we want to get the layer path.
   * @param {string} layerPath Internal parameter used to build the layer path (should not be used by the user).
   *
   * @returns {string} Returns the layer path.
   */
  static evaluateLayerPath(layerConfig: ConfigBaseClass, layerPath?: string): string {
    let pathEnding = layerPath;
    if (pathEnding === undefined)
      pathEnding =
        layerConfig.layerIdExtension === undefined ? layerConfig.layerId : `${layerConfig.layerId}.${layerConfig.layerIdExtension}`;
    if (!layerConfig.parentLayerConfig) return `${layerConfig.geoviewLayerConfig!.geoviewLayerId!}/${pathEnding}`;
    return this.evaluateLayerPath(
      layerConfig.parentLayerConfig as TypeLayerGroupEntryConfig,
      `${(layerConfig.parentLayerConfig as TypeLayerGroupEntryConfig).layerId}/${pathEnding}`
    );
  }

  /**
   * The layerId getter method for the ConfigBaseClass class and its descendant classes.
   */
  get layerId() {
    return this._layerId;
  }

  /**
   * The layerId setter method for the ConfigBaseClass class and its descendant classes.
   * @param {string} newLayerId The new layerId value.
   */
  set layerId(newLayerId: string) {
    this._layerId = newLayerId;
    this._layerPath = ConfigBaseClass.evaluateLayerPath(this);
  }

  /**
   * The layerId getter method for the ConfigBaseClass class and its descendant classes.
   */
  get layerStatus() {
    return this._layerStatus;
  }

  /**
   * The layerStatus setter method for the ConfigBaseClass class and its descendant classes.
   * @param {string} newLayerStatus The new layerId value.
   */
  set layerStatus(newLayerStatus: TypeLayerStatus) {
    if (
      newLayerStatus === 'loaded' &&
      !layerEntryIsGroupLayer(this) &&
      !this.IsGreaterThanOrEqualTo('loading') &&
      !this.waitForProcessedBeforeSendingLoaded
    ) {
      this.waitForProcessedBeforeSendingLoaded = true;
      return;
    }
    if (!this.IsGreaterThanOrEqualTo(newLayerStatus)) {
      this._layerStatus = newLayerStatus;
      // TODO: layerPhase property will be removed soon. We must not use it anymore.
      this.geoviewLayerInstance!.setLayerPhase(newLayerStatus, this.layerPath);
      api.event.emit(
        // TODO: Change createLayerSetChangeLayerStatusPayload events for a direct function call.
        LayerSetPayload.createLayerSetChangeLayerStatusPayload(this.geoviewLayerInstance!.mapId, this.layerPath, newLayerStatus)
      );
    }
    if (newLayerStatus === 'processed' && this.waitForProcessedBeforeSendingLoaded) this.layerStatus = 'loaded';

    if (
      this._layerStatus === 'loaded' &&
      this.parentLayerConfig &&
      this.geoviewLayerInstance!.allLayerStatusAreGreaterThanOrEqualTo('loaded', [this.parentLayerConfig as TypeLayerGroupEntryConfig])
    )
      (this.parentLayerConfig as TypeLayerGroupEntryConfig).layerStatus = 'loaded';
  }

  /**
   * Register the layer identifier. Duplicate identifier are not allowed.
   *
   * @returns {boolean} Returns false if the layer configuration can't be registered.
   */

  registerLayerConfig(): boolean {
    const { registeredLayers } = api.maps[this.geoviewLayerInstance!.mapId].layer;
    if (registeredLayers[this.layerPath]) return false;
    (registeredLayers[this.layerPath] as ConfigBaseClass) = this;
    if (this.entryType !== 'group')
      (this.geoviewLayerInstance as AbstractGeoViewLayer).registerToLayerSets(Cast<TypeBaseLayerEntryConfig>(this));
    this.layerStatus = 'registered';
    return true;
  }

  /**
   * This method returns the GeoView instance associated to a specific layer path. The first element of the layerPath
   * is the geoviewLayerId.
   * @param {string} layerPath The layer path to the layer's configuration.
   *
   * @returns {AbstractGeoViewLayer} Returns the geoview instance associated to the layer path.
   */
  // TODO: Check - Is this still used? Remove it and favor the homonymous method in `layer`?
  geoviewLayer(layerPath?: string): AbstractGeoViewLayer {
    this.geoviewLayerInstance!.layerPathAssociatedToTheGeoviewLayer = layerPath || this.layerPath;
    return this.geoviewLayerInstance!;
  }

  /**
   * This method compares the internal layer status of the config with the layer status passed as a parameter and it
   * returns true if the internal value is greater or equal to the value of the parameter.
   *
   * @param {TypeLayerStatus} layerStatus The layer status to compare with the internal value of the config.
   *
   * @returns {boolean} Returns true if the internal value is greater or equal than the value of the parameter.
   */
  IsGreaterThanOrEqualTo(layerStatus: TypeLayerStatus): boolean {
    return this.layerStatusWeight[this.layerStatus] >= this.layerStatusWeight[layerStatus];
  }

  /**
   * Serializes the ConfigBaseClass class
   * @returns {TypeJsonValue} The serialized ConfigBaseClass
   */
  serialize(): TypeJsonValue {
    // Redirect
    return this.onSerialize();
  }

  /**
   * Overridable function to serialize a ConfigBaseClass
   * @returns {TypeJsonValue} The serialized ConfigBaseClass
   */
  onSerialize(): TypeJsonValue {
    return {
      layerIdExtension: this.layerIdExtension,
      schemaTag: this.schemaTag,
      entryType: this.entryType,
      layerStatus: this.layerStatus,
      layerPhase: this.layerPhase,
      isMetadataLayerGroup: this.isMetadataLayerGroup,
    } as unknown as TypeJsonValue;
  }
}

/** ******************************************************************************************************************************
 * Base type used to define a GeoView layer to display on the map.
 */
export abstract class TypeBaseLayerEntryConfig extends ConfigBaseClass {
  /** The ending element of the layer configuration path. */
  layerIdExtension?: string | undefined = undefined;

  /** The display name of the layer (English/French). */
  layerName?: TypeLocalizedString;

  /**
   * Initial settings to apply to the GeoView layer entry at creation time. Initial settings are inherited from the parent in the
   * configuration tree.
   */
  initialSettings?: TypeLayerInitialSettings = {};

  /** Source settings to apply to the GeoView vector layer source at creation time. */
  source?:
    | TypeBaseSourceVectorInitialConfig
    | TypeSourceTileInitialConfig
    | TypeVectorSourceInitialConfig
    | TypeVectorTileSourceInitialConfig
    | TypeSourceImageInitialConfig
    | TypeSourceImageWmsInitialConfig
    | TypeSourceImageEsriInitialConfig
    | TypeSourceImageStaticInitialConfig;

  /** The listOfLayerEntryConfig attribute is not used by child of TypeBaseLayerEntryConfig. */
  declare listOfLayerEntryConfig: never;

  /**
   * The class constructor.
   * @param {TypeBaseLayerEntryConfig} layerConfig The layer configuration we want to instanciate.
   */
  constructor(layerConfig: TypeBaseLayerEntryConfig) {
    super(layerConfig);
    Object.assign(this, layerConfig);
  }

  /**
   * The olLayerAndLoadEndListeners setter method for the ConfigBaseClass class and its descendant classes.
   * @param {TypeLayerAndListenerType} layerAndListenerType The layer configuration we want to instanciate
   *                                                        and its listener type.
   */
  set olLayerAndLoadEndListeners(layerAndListenerType: TypeLayerAndListenerType) {
    const { olLayer, loadEndListenerType } = layerAndListenerType;
    this._olLayer = olLayer;
    // Group layers have no listener
    if (olLayer && this.entryType !== 'group') {
      if (loadEndListenerType) {
        let loadErrorListener: () => void;

        // Definition of the load end listener functions
        const loadEndListener = () => {
          this.loadedFunction();
          this.geoviewLayerInstance!.setLayerPhase('loaded', this.layerPath);
          this.layerStatus = 'loaded';
          this._olLayer!.get('source').un(`${loadEndListenerType}loaderror`, loadErrorListener);
        };

        loadErrorListener = () => {
          this.layerStatus = 'error';
          this._olLayer!.get('source').un(`${loadEndListenerType}loadend`, loadEndListener);
        };

        // Activation of the load end listeners
        this._olLayer!.get('source').once(`${loadEndListenerType}loaderror`, loadErrorListener);
        this._olLayer!.get('source').once(`${loadEndListenerType}loadend`, loadEndListener);
      } else logger.logError(`Provision of a load end listener type is mandatory for layer path "${this.layerPath}".`);
    }
  }

  /**
   * The olLayer getter method for the ConfigBaseClass class and its descendant classes.
   * All layerConfig has an olLayer property, but the olLayer setter can only be use on group layers.
   */
  get olLayer() {
    return this._olLayer;
  }

  /**
   * The olLayer setter method for the ConfigBaseClass class and its descendant classes.
   * All layerConfig has an olLayer property, but the olLayer setter can only be use on group layers.
   * If you want to set the olLayer property for a descendant of TypeBaseLayerEntryConfig, you must
   * use its olLayerAndLoadEndListeners because it enforce the creation of the load end listeners.
   * @param {LayerGroup} olLayerValue The new olLayerd value.
   */
  set olLayer(olLayerValue: BaseLayer | LayerGroup | null) {
    if (layerEntryIsGroupLayer(this)) this._olLayer = olLayerValue;
    else logger.logError(`The olLayer setter can only be used on layer group and layerPath refers to a layer of type "${this.entryType}".`);
  }

  /**
   * Method to execute when the layer is loaded.
   */
  loadedFunction() {
    // Update registration based on metadata that were read since the first registration.
    this.geoviewLayerInstance?.registerToLayerSets(this);
    this.geoviewLayerInstance?.setVisible(this.initialSettings?.visible !== 'no', this.layerPath);
    if (this._layerStatus === 'loaded')
      api.event.emit(LayerSetPayload.createLayerSetChangeLayerStatusPayload(this.geoviewLayerInstance!.mapId, this.layerPath, 'loaded'));
  }

  /**
   * Serializes the TypeBaseLayerEntryConfig class
   * @returns {TypeJsonValue} The serialized TypeBaseLayerEntryConfig
   */
  serialize(): TypeJsonValue {
    // Redirect
    return this.onSerialize();
  }

  /**
   * Overrides the serialization of the mother class
   * @returns {TypeJsonValue} The serialized TypeBaseLayerEntryConfig
   */
  onSerialize(): TypeJsonValue {
    // Call parent
    const serialized = super.onSerialize() as unknown as TypeBaseLayerEntryConfig;

    // Copy values
    serialized.layerIdExtension = this.layerIdExtension;
    serialized.layerName = this.layerName;
    serialized.initialSettings = this.initialSettings;

    // Return it
    return serialized as unknown as TypeJsonValue;
  }
}

/** ******************************************************************************************************************************
 * Type used to define a GeoView vector layer to display on the map.
 */
export class TypeVectorLayerEntryConfig extends TypeBaseLayerEntryConfig {
  /** Layer entry data type. */
  entryType = 'vector' as TypeLayerEntryType;

  /** Filter to apply on feature of this layer. */
  layerFilter?: string;

  /** Initial settings to apply to the GeoView vector layer source at creation time. */
  declare source?: TypeVectorSourceInitialConfig;

  /** Style to apply to the vector layer. */
  style?: TypeStyleConfig;

  /**
   * The class constructor.
   * @param {TypeVectorLayerEntryConfig} layerConfig The layer configuration we want to instanciate.
   */
  constructor(layerConfig: TypeVectorLayerEntryConfig) {
    super(layerConfig);
    Object.assign(this, layerConfig);
  }

  /**
   * Method to execute when the layer is loaded.
   */
  loadedFunction() {
    super.loadedFunction();
    if ('applyViewFilter' in this.geoviewLayerInstance!)
      (this.geoviewLayerInstance as GeoviewChild).applyViewFilter(this.layerPath, this.layerFilter || '');
  }
}

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
 * Type used to identify a GeoView vector heamap layer to display on the map.
 */
export class TypeVectorHeatmapLayerEntryConfig extends TypeBaseLayerEntryConfig {
  /** Layer entry data type. */
  entryType = 'vector-heatmap' as TypeLayerEntryType;

  /** Initial settings to apply to the GeoView vector layer source at creation time. */
  declare source?: TypeVectorSourceInitialConfig;

  /**
   * Color gradient of the heatmap, specified as an array of CSS color strings.
   * Default = ["#00f", "#0ff", "#0f0", "#ff0", "#f00"].
   */
  gradient?: string[];

  /** Radius size in pixels. Default = 8px. */
  radius?: number;

  /** Blur size in pixels. Default = 15px. */
  blur?: number;

  /** Feature attribute to use for the weight or a function (ADD FORMAT) that returns a weight from a feature. */
  weight?: string;

  /**
   * The class constructor.
   * @param {TypeVectorHeatmapLayerEntryConfig} layerConfig The layer configuration we want to instanciate.
   */
  constructor(layerConfig: TypeVectorHeatmapLayerEntryConfig) {
    super(layerConfig);
    Object.assign(this, layerConfig);
  }

  /**
   * Method to execute when the layer is loaded.
   */
  loadedFunction() {
    super.loadedFunction();
  }
}

/** ******************************************************************************************************************************
 * Initial settings to apply to the GeoView vector tile layer source at creation time.
 */
export interface TypeVectorTileSourceInitialConfig extends TypeBaseSourceVectorInitialConfig {
  /** Tile grid parameters to use. */
  tileGrid?: TypeTileGrid;
}

/** ******************************************************************************************************************************
 * Type used to define a GeoView vector tile layer to display on the map. The vector data is divided into a tile grid.
 */
export class TypeVectorTileLayerEntryConfig extends TypeBaseLayerEntryConfig {
  /** Layer entry data type. */
  entryType = 'vector-tile' as TypeLayerEntryType;

  /** Filter to apply on feature of this layer. */
  layerFilter?: string;

  /** Source settings to apply to the GeoView vector layer source at creation time. */
  declare source?: TypeVectorTileSourceInitialConfig;

  /** Style to apply to the vector layer. */
  style?: TypeStyleConfig;

  /**
   * The class constructor.
   * @param {TypeVectorTileLayerEntryConfig} layerConfig The layer configuration we want to instanciate.
   */
  constructor(layerConfig: TypeVectorTileLayerEntryConfig) {
    super(layerConfig);
    Object.assign(this, layerConfig);
  }

  /**
   * Method to execute when the layer is loaded.
   */
  loadedFunction() {
    super.loadedFunction();
    if ('applyViewFilter' in this.geoviewLayerInstance!)
      (this.geoviewLayerInstance as GeoviewChild).applyViewFilter(this.layerPath, this.layerFilter || '');
  }
}

/** ******************************************************************************************************************************
 * Type used to define a GeoView image layer to display on the map.
 */
export class TypeOgcWmsLayerEntryConfig extends TypeBaseLayerEntryConfig {
  /** Tag used to link the entry to a specific schema. */
  schemaTag = 'ogcWms' as TypeGeoviewLayerType;

  /** Layer entry data type. */
  entryType = 'raster-image' as TypeLayerEntryType;

  /** Filter to apply on feature of this layer. */
  layerFilter?: string;

  /** Source settings to apply to the GeoView image layer source at creation time. */
  declare source: TypeSourceImageWmsInitialConfig;

  /** Style to apply to the raster layer. */
  style?: TypeStyleConfig;

  /**
   * The class constructor.
   * @param {TypeOgcWmsLayerEntryConfig} layerConfig The layer configuration we want to instanciate.
   */
  constructor(layerConfig: TypeOgcWmsLayerEntryConfig) {
    super(layerConfig);
    Object.assign(this, layerConfig);

    // if layerConfig.source.dataAccessPath is undefined, the metadataAccessPath defined on the root is used.
    if (!this.source) this.source = {};
    if (!this.source.dataAccessPath) {
      // When the dataAccessPath is undefined and the metadataAccessPath ends with ".xml", the dataAccessPath is temporarilly
      // set to '' and will be filled in the fetchServiceMetadata method of the class WMS. So, we begin with the assumption
      // that both en and fr end with ".xml". Be aware that in metadataAccessPath, one language can ends with ".xml" and the
      // other not.
      this.source.dataAccessPath = createLocalizedString('');
      // When the dataAccessPath is undefined and the metadataAccessPath does not end with ".xml", the dataAccessPath is set
      // to the same value of the corresponding metadataAccessPath.
      if (this.geoviewLayerConfig.metadataAccessPath!.en!.slice(-4).toLowerCase() !== '.xml')
        this.source.dataAccessPath.en = this.geoviewLayerConfig.metadataAccessPath!.en;
      if (this.geoviewLayerConfig.metadataAccessPath!.fr!.slice(-4).toLowerCase() !== '.xml')
        this.source.dataAccessPath.fr = this.geoviewLayerConfig.metadataAccessPath!.fr;
    }
    // Default value for layerConfig.source.serverType is 'mapserver'.
    if (!this.source.serverType) this.source.serverType = 'mapserver';
  }

  /**
   * Method to execute when the layer is loaded.
   */
  loadedFunction() {
    super.loadedFunction();
    if ('applyViewFilter' in this.geoviewLayerInstance!)
      (this.geoviewLayerInstance as GeoviewChild).applyViewFilter(this.layerPath, this.layerFilter || '');
  }
}

/** ******************************************************************************************************************************
 * Type used to define a GeoView image layer to display on the map.
 */
export class TypeEsriDynamicLayerEntryConfig extends TypeBaseLayerEntryConfig {
  /** Tag used to link the entry to a specific schema. */
  schemaTag = 'esriDynamic' as TypeGeoviewLayerType;

  /** Layer entry data type. */
  entryType = 'raster-image' as TypeLayerEntryType;

  /** Filter to apply on feature of this layer. */
  layerFilter?: string;

  /** Source settings to apply to the GeoView image layer source at creation time. */
  declare source: TypeSourceImageEsriInitialConfig;

  /** Style to apply to the raster layer. */
  style?: TypeStyleConfig;

  /**
   * The class constructor.
   * @param {TypeEsriDynamicLayerEntryConfig} layerConfig The layer configuration we want to instanciate.
   */
  constructor(layerConfig: TypeEsriDynamicLayerEntryConfig) {
    super(layerConfig);
    Object.assign(this, layerConfig);
    // if layerConfig.source.dataAccessPath is undefined, we assign the metadataAccessPath of the GeoView layer to it.
    if (!this.source) this.source = {};
    if (!this.source.dataAccessPath) this.source.dataAccessPath = { ...this.geoviewLayerConfig.metadataAccessPath } as TypeLocalizedString;
  }

  /**
   * Method to execute when the layer is loaded.
   */
  loadedFunction() {
    super.loadedFunction();
    if ('applyViewFilter' in this.geoviewLayerInstance!)
      (this.geoviewLayerInstance as GeoviewChild).applyViewFilter(this.layerPath, this.layerFilter || '');
  }
}

/** ******************************************************************************************************************************
 * Type used to define a GeoView image layer to display on the map.
 */
export class TypeEsriImageLayerEntryConfig extends TypeBaseLayerEntryConfig {
  /** Tag used to link the entry to a specific schema. */
  schemaTag = 'esriImage' as TypeGeoviewLayerType;

  /** Layer entry data type. */
  entryType = 'raster-image' as TypeLayerEntryType;

  /** Filter to apply on feature of this layer. */
  layerFilter?: string;

  /** Source settings to apply to the GeoView image layer source at creation time. */
  declare source: TypeSourceImageEsriInitialConfig;

  /** Style to apply to the raster layer. */
  style?: TypeStyleConfig;

  /**
   * The class constructor.
   * @param {TypeEsriImageLayerEntryConfig} layerConfig The layer configuration we want to instanciate.
   */
  constructor(layerConfig: TypeEsriImageLayerEntryConfig) {
    super(layerConfig);
    Object.assign(this, layerConfig);

    if (Number.isNaN(this.layerId)) {
      throw new Error(`The layer entry with layerId equal to ${this.layerPath} must be an integer string`);
    }
    // if layerConfig.source.dataAccessPath is undefined, we assign the metadataAccessPath of the GeoView layer to it.
    if (!this.source) this.source = {};
    if (!this.source.dataAccessPath) this.source.dataAccessPath = { ...this.geoviewLayerConfig.metadataAccessPath } as TypeLocalizedString;
  }

  /**
   * Method to execute when the layer is loaded.
   */
  loadedFunction() {
    super.loadedFunction();
    if ('applyViewFilter' in this.geoviewLayerInstance!)
      (this.geoviewLayerInstance as GeoviewChild).applyViewFilter(this.layerPath, this.layerFilter || '');
  }
}

/** ******************************************************************************************************************************
 * Type used to define a GeoView image layer to display on the map.
 */
export class TypeImageStaticLayerEntryConfig extends TypeBaseLayerEntryConfig {
  /** Tag used to link the entry to a specific schema. */
  schemaTag = 'imageStatic' as TypeGeoviewLayerType;

  /** Layer entry data type. */
  entryType = 'raster-image' as TypeLayerEntryType;

  /** Filter to apply on feature of this layer. */
  layerFilter?: string;

  /** Source settings to apply to the GeoView image layer source at creation time. */
  declare source: TypeSourceImageStaticInitialConfig;

  /**
   * The class constructor.
   * @param {TypeImageStaticLayerEntryConfig} layerConfig The layer configuration we want to instanciate.
   */
  constructor(layerConfig: TypeImageStaticLayerEntryConfig) {
    super(layerConfig);
    Object.assign(this, layerConfig);

    if (!this.source.dataAccessPath) {
      throw new Error(
        `source.dataAccessPath on layer entry ${this.layerPath} is mandatory for GeoView layer ${this.geoviewLayerConfig.geoviewLayerId} of type ${this.geoviewLayerConfig.geoviewLayerType}`
      );
    }
  }

  /**
   * Method to execute when the layer is loaded.
   */
  loadedFunction() {
    super.loadedFunction();
    if ('applyViewFilter' in this.geoviewLayerInstance!)
      (this.geoviewLayerInstance as GeoviewChild).applyViewFilter(this.layerPath, this.layerFilter || '');
  }
}

/** ******************************************************************************************************************************
 * Type used to define a GeoView image layer to display on the map.
 */
export class TypeTileLayerEntryConfig extends TypeBaseLayerEntryConfig {
  /** Layer entry data type. */
  entryType = 'raster-tile' as TypeLayerEntryType;

  /** Initial settings to apply to the GeoView image layer source at creation time. */
  declare source?: TypeSourceTileInitialConfig;

  /**
   * The class constructor.
   * @param {TypeTileLayerEntryConfig} layerConfig The layer configuration we want to instanciate.
   */
  constructor(layerConfig: TypeTileLayerEntryConfig) {
    super(layerConfig);
    Object.assign(this, layerConfig);
  }

  /**
   * Method to execute when the layer is loaded.
   */
  loadedFunction() {
    super.loadedFunction();
  }
}

/** ******************************************************************************************************************************
 * Type used to define a GeoView layer where configration is extracted by a configuration snippet stored on a server. The server
 * configuration will handle bilangual informations.
 */
export class TypeGeoCoreLayerEntryConfig extends ConfigBaseClass {
  /** This attribute from ConfigBaseClass is not used by groups. */
  declare isMetadataLayerGroup: never;

  /** Tag used to link the entry to a specific schema. */
  schemaTag = 'geoCore' as TypeGeoviewLayerType;

  /** Layer entry data type. */
  entryType = 'geoCore' as TypeLayerEntryType;

  /** The layerIdExtension is not used by geocore layers. */
  declare layerIdExtension: never;

  /** The display name of a geocore layer is in geocoreLayerName. */
  declare layerName: never;

  /** The display name of the layer (English/French). */
  geocoreLayerName?: TypeLocalizedString;

  /** The access path to the geoCore endpoint (optional, this value should be embeded in the GeoView API). */
  source?: TypeSourceGeocoreConfig;

  /**
   * Initial settings to apply to the GeoView layer entry at creation time. Initial settings are inherited from the parent in the
   * configuration tree.
   */
  initialSettings?: TypeLayerInitialSettings;

  /** The list of layer entry configurations to use from the Geocore layer. */
  listOfLayerEntryConfig?: TypeListOfLayerEntryConfig;

  /**
   * The class constructor.
   * @param {TypeGeoCoreLayerEntryConfig} layerConfig The layer configuration we want to instanciate.
   */
  constructor(layerConfig: TypeGeoCoreLayerEntryConfig) {
    super(layerConfig);
    Object.assign(this, layerConfig);
  }

  /**
   * The olLayer getter method for the ConfigBaseClass class and its descendant classes.
   * All layerConfig has an olLayer property, but the olLayer setter can only be use on group layers.
   */
  get olLayer() {
    return this._olLayer;
  }

  /**
   * The olLayer setter method for the ConfigBaseClass class and its descendant classes.
   * All layerConfig has an olLayer property, but the olLayer setter can only be use on group layers.
   * If you want to set the olLayer property for a descendant of TypeBaseLayerEntryConfig, you must
   * use its olLayerAndLoadEndListeners because it enforce the creation of the load end listeners.
   * @param {LayerGroup} olLayerValue The new olLayerd value.
   */
  set olLayer(olLayerValue: BaseLayer | LayerGroup | null) {
    if (layerEntryIsGroupLayer(this)) this._olLayer = olLayerValue;
    else logger.logError(`The olLayer setter can only be used on layer group and layerPath refers to a layer of type "${this.entryType}".`);
  }
}

/** ******************************************************************************************************************************
 * Initial settings to apply to the GeoView vector layer source at creation time.
 */
export type TypeSourceGeocoreConfig = {
  /** Definition of the feature information structure that will be used by the getFeatureInfo method. We only use queryable and
   * it must be set to false if specified.
   */
  featureInfo?: { queryable: false };
  /** Path used to access the data. */
  dataAccessPath: TypeLocalizedString;
};

/** ******************************************************************************************************************************
 * Type used to define a layer group.
 */
export class TypeLayerGroupEntryConfig extends ConfigBaseClass {
  /** Tag used to link the entry to a specific schema is not used by groups. */
  declare schemaTag: never;

  /** Layer entry data type. */
  entryType = 'group' as TypeLayerEntryType;

  /** The ending element of the layer configuration path is not used on groups. */
  declare layerIdExtension: never;

  /** The display name of the layer (English/French). */
  layerName?: TypeLocalizedString;

  /**
   * Initial settings to apply to the GeoView layer entry at creation time. Initial settings are inherited from the parent in the
   * configuration tree.
   */
  initialSettings?: TypeLayerInitialSettings;

  /** Source settings to apply to the GeoView vector layer source at creation time is not used by groups. */
  declare source: never;

  /** The list of layer entry configurations to use from the GeoView layer group. */
  listOfLayerEntryConfig: TypeListOfLayerEntryConfig = [];

  /**
   * The class constructor.
   * @param {TypeLayerGroupEntryConfig} layerConfig The layer configuration we want to instanciate.
   */
  constructor(layerConfig: TypeLayerGroupEntryConfig) {
    super(layerConfig);
    Object.assign(this, layerConfig);
  }

  /**
   * The olLayer getter method for the ConfigBaseClass class and its descendant classes.
   * All layerConfig has an olLayer property, but the olLayer setter can only be use on group layers.
   */
  get olLayer() {
    return this._olLayer;
  }

  /**
   * The olLayer setter method for the ConfigBaseClass class and its descendant classes.
   * All layerConfig has an olLayer property, but the olLayer setter can only be use on group layers.
   * If you want to set the olLayer property for a descendant of TypeBaseLayerEntryConfig, you must
   * use its olLayerAndLoadEndListeners because it enforce the creation of the load end listeners.
   * @param {LayerGroup} olLayerValue The new olLayerd value.
   */
  set olLayer(olLayerValue: BaseLayer | LayerGroup | null) {
    const { entryType } = this;
    if (layerEntryIsGroupLayer(this)) this._olLayer = olLayerValue;
    else logger.logError(`The olLayer setter can only be used on layer group and layerPath refers to a layer of type "${entryType}".`);
  }
}

/** ******************************************************************************************************************************
 * Layer config type.
 */
export type TypeLayerEntryConfig =
  | TypeBaseLayerEntryConfig
  | TypeVectorHeatmapLayerEntryConfig
  | TypeVectorTileLayerEntryConfig
  | TypeVectorLayerEntryConfig
  | TypeOgcWmsLayerEntryConfig
  | TypeEsriDynamicLayerEntryConfig
  | TypeEsriImageLayerEntryConfig
  | TypeImageStaticLayerEntryConfig
  | TypeTileLayerEntryConfig
  | TypeLayerGroupEntryConfig
  | TypeGeoCoreLayerEntryConfig;

/** ******************************************************************************************************************************
 * List of layers. Corresponds to the layerList defined in the schema.
 */
export type TypeListOfLayerEntryConfig = TypeLayerEntryConfig[];

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

/** ******************************************************************************************************************************
 *  Definition of the map configuration settings.
 */
export type TypeMapConfig = {
  /** Basemap options settings for this map configuration. */
  basemapOptions: TypeBasemapOptions;
  /** Type of interaction. */
  interaction: TypeInteraction;
  /** List of GeoView Layers in the order which they should be added to the map. */
  listOfGeoviewLayerConfig?: TypeListOfGeoviewLayerConfig;
  /** View settings. */
  viewSettings: TypeViewSettings;
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
 *  Definition of the Geoview layer list.
 */
export type TypeListOfGeoviewLayerConfig = TypeGeoviewLayerConfig[];

/** ******************************************************************************************************************************
 *  Definition of a single Geoview layer configuration.
 */
// TODO: Convert this type to a class
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
 * Temporary? function to serialize a geoview layer configuration to be able to send it to the store
 * @param {TypeGeoviewLayerConfig} geoviewLayerConfig The geoviewlayer config to serialize
 * @returns TypeJsonValue The serialized config as pure JSON
 */
export const serializeTypeGeoviewLayerConfig = (geoviewLayerConfig: TypeGeoviewLayerConfig): TypeJsonValue => {
  // TODO: Create a 'serialize()' function inside `TypeGeoviewLayerConfig` when/if it's transformed to a class.
  // TO.DOCONT: and copy this code in deleting this function here. For now, this explicit workaround function is necessary.
  const serializedGeoviewLayerConfig = {
    geoviewLayerId: geoviewLayerConfig.geoviewLayerId,
    geoviewLayerName: geoviewLayerConfig.geoviewLayerName,
    metadataAccessPath: geoviewLayerConfig.metadataAccessPath,
    geoviewLayerType: geoviewLayerConfig.geoviewLayerType,
    serviceDateFormat: geoviewLayerConfig.serviceDateFormat,
    externalDateFormat: geoviewLayerConfig.externalDateFormat,
    initialSettingss: geoviewLayerConfig.initialSettings,
    listOfLayerEntryConfig: [],
  } as TypeGeoviewLayerConfig;

  // Loop on the LayerEntryConfig to serialize further
  for (let j = 0; j < (geoviewLayerConfig.listOfLayerEntryConfig?.length || 0); j++) {
    // Serialize the TypeLayerEntryConfig
    const serializedLayerEntryConfig = geoviewLayerConfig.listOfLayerEntryConfig[j].serialize();

    // Store
    serializedGeoviewLayerConfig.listOfLayerEntryConfig.push(serializedLayerEntryConfig as never);
  }

  // Return it
  return serializedGeoviewLayerConfig as never;
};

/** ******************************************************************************************************************************
 *  Definition of the view settings.
 */
export type TypeViewSettings = {
  /**
   * Center of the map defined as [longitude, latitude]. Longitude domaine = [-160..160], default = -106.
   * Latitude domaine = [-80..80], default = 60. */
  center: [number, number];
  /** Enable rotation. If false, a rotation constraint that always sets the rotation to zero is used. Default = true. */
  enableRotation?: boolean;
  /**
   * The initial rotation for the view in degree (positive rotation clockwise, 0 means North). Will be converted to radiant by
   * the viewer. Domaine = [0..360], default = 0.
   */
  rotation?: number;
  /** The extent that constrains the view. Called with [minX, minY, maxX, maxY] extent coordinates. */
  extent?: Extent;
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
  /** Initial map zoom level. Zoom level are define by the basemap zoom levels. Domaine = [0..28], default = 12. */
  zoom: number;
};

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
export type TypeNavBarProps = Array<'zoom' | 'fullscreen' | 'home' | 'location' | 'export'>;

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
