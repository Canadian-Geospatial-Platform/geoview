import { AbstractGeoviewLayerConfig } from '@config/types/classes/geoview-config/abstract-geoview-layer-config';
import { EsriDynamicLayerConfig } from '@config/types/classes/geoview-config/raster-config/esri-dynamic-config';
import { GroupLayerEntryConfig } from '@config/types/classes/sub-layer-config/group-node/group-layer-entry-config';
import { TypeJsonObject } from '@config/types/config-types';
import { AbstractBaseLayerEntryConfig, TypeBaseVectorGeometryConfig, TypeIconSymbolVectorConfig, TypeLineStringVectorConfig, TypePolygonVectorConfig, TypeSimpleSymbolVectorConfig } from '@config/types/map-schema-types';
import { EntryConfigBaseClass } from '@/api/config/types/classes/sub-layer-config/entry-config-base-class';
import { EsriDynamicLayerEntryConfig } from '@/api/config/types/classes/sub-layer-config/leaf/raster/esri-dynamic-layer-entry-config';
/**
 * Type guard function that redefines a EntryConfigBaseClass as a GroupLayerEntryConfig if the entryType attribute of the verifyIfLayer
 * parameter is CV_CONST_SUB_LAYER_TYPES.GROUP. The type assertion applies only to the true block of the if clause that use this
 * function.
 *
 * @param {EntryConfigBaseClass} verifyIfLayer Polymorphic object to test in order to determine if the type assertion is valid.
 *
 * @returns {boolean} true if the type assertion is valid.
 */
export declare const layerEntryIsGroupLayer: (verifyIfLayer: EntryConfigBaseClass | TypeJsonObject) => verifyIfLayer is GroupLayerEntryConfig;
/**
 * Type guard function that redefines a EntryConfigBaseClass as an AbstractBaseLayerEntryConfig if the entryType attribute of the verifyIfLayer
 * parameter is not CV_CONST_SUB_LAYER_TYPES.GROUP. The type assertion applies only to the true block of the if clause that use this
 * function.
 *
 * @param {EntryConfigBaseClass} verifyIfLayer Polymorphic object to test in order to determine if the type assertion is valid.
 *
 * @returns {boolean} true if the type assertion is valid.
 */
export declare const layerEntryIsAbstractBaseLayerEntryConfig: (verifyIfLayer: EntryConfigBaseClass | TypeJsonObject) => verifyIfLayer is AbstractBaseLayerEntryConfig;
/**
 * Type guard function that redefines a EntryConfigBaseClass as a VectorLayerEntryConfig if the entryType attribute of
 * the verifyIfLayer parameter is 'vector'. The type assertion applies only to the true block of the if clause that use this
 * function.
 *
 * @param {EntryConfigBaseClass} verifyIfLayer Polymorphic object to test in order to determine if the type assertion is valid.
 *
 * @returns {boolean} true if the type assertion is valid.
 * /
export const layerEntryIsVector = (verifyIfLayer: EntryConfigBaseClass): verifyIfLayer is VectorLayerEntryConfig => {
  return verifyIfLayer?.entryType === CV_CONST_SUB_LAYER_TYPES.VECTOR;
};

/**
 * Type guard function that redefines a EntryConfigBaseClass as a VectorTileEntryConfig if the entryType attribute of the
 * verifyIfLayer parameter is 'vector' and the object has a style attribute. The type assertion applies only to the true block
 * of the if clause that use this function.
 *
 * @param {EntryConfigBaseClass} verifyIfLayer Polymorphic object to test in order to determine if the type assertion is valid.
 *
 * @returns {boolean} true if the type assertion is valid.
 * /
export const layerEntryIsVectorTile = (verifyIfLayer: EntryConfigBaseClass): verifyIfLayer is VectorTilesLayerEntryConfig => {
  return verifyIfLayer?.entryType === CV_CONST_SUB_LAYER_TYPES.VECTOR_TILE;
};

/**
 * Type guard function that redefines a EntryConfigBaseClass as a TileLayerEntryConfig if the entryType attribute of the verifyIfLayer
 * parameter is 'raster-tile'. The type assertion applies only to the true block of the if clause that use this function.
 *
 * @param {EntryConfigBaseClass} verifyIfLayer Polymorphic object to test in order to determine if the type assertion is valid.
 *
 * @returns {boolean} true if the type assertion is valid.
 * /
export const layerEntryIsRasterTile = (verifyIfLayer: EntryConfigBaseClass): verifyIfLayer is TileLayerEntryConfig => {
  return verifyIfLayer?.entryType === CV_CONST_SUB_LAYER_TYPES.RASTER_TILE;
};

/**
 * Type guard function that redefines a EntryConfigBaseClass as a OgcWmsLayerEntryConfig if the entryType attribute of the
 * verifyIfLayer parameter is CV_CONST_LAYER_TYPES.WMS. The type assertion applies only to the true block of the if clause that use
 * this function.
 *
 * @param {EntryConfigBaseClass} verifyIfLayer Polymorphic object to test in order to determine if the type assertion is valid.
 *
 * @returns {boolean} true if the type assertion is valid.
 * /
export const layerEntryIsOgcWms = (verifyIfLayer: EntryConfigBaseClass): verifyIfLayer is OgcWmsLayerEntryConfig => {
  return verifyIfLayer?.entryType === CV_CONST_LAYER_TYPES.WMS;
};

/**
 * Type guard function that redefines a EntryConfigBaseClass as a EsriDynamicLayerEntryConfig if the entryType attribute of
 * the verifyIfLayer parameter is CV_CONST_LAYER_TYPES.WMS. The type assertion applies only to the true block of the if clause that
 * use this function.
 *
 * @param {EntryConfigBaseClass} verifyIfLayer Polymorphic object to test in order to determine if the type assertion is valid.
 *
 * @returns {boolean} true if the type assertion is valid.
 */
export declare const layerEntryIsEsriDynamic: (verifyIfLayer: EntryConfigBaseClass) => verifyIfLayer is EsriDynamicLayerEntryConfig;
/**
 * type guard function that redefines a EntryConfigBaseClass as a EsriImageLayerEntryConfig if the entryType attribute of the
 * verifyIfLayer parameter is CV_CONST_LAYER_TYPES.WMS. The type assertion applies only to the true block of the if clause that use
 * this function.
 *
 * @param {EntryConfigBaseClass} verifyIfLayer Polymorphic object to test in order to determine if the type assertion is valid.
 *
 * @returns {boolean} true if the type assertion is valid.
 * /
export const layerEntryIsEsriImage = (verifyIfLayer: EntryConfigBaseClass): verifyIfLayer is EsriImageLayerEntryConfig => {
  return verifyIfLayer?.entryType === CV_CONST_LAYER_TYPES.ESRI_IMAGE;
};

/**
 * Type guard function that redefines a EntryConfigBaseClass as a ImageStaticLayerEntryConfig if the entryType attribute of
 * the verifyIfLayer parameter is CV_CONST_LAYER_TYPES.WMS. The type assertion applies only to the true block of the if clause that
 * use this function.
 *
 * @param {EntryConfigBaseClass} verifyIfLayer Polymorphic object to test in order to determine if the type assertion is valid.
 *
 * @returns {boolean} true if the type assertion is valid.
 * /
export const layerEntryIsImageStatic = (verifyIfLayer: EntryConfigBaseClass): verifyIfLayer is ImageStaticLayerEntryConfig => {
  return verifyIfLayer?.entryType === CV_CONST_LAYER_TYPES.IMAGE_STATIC;
};

// #region GEOVIEW CONFIG TYPE GUARDS
/**
 * Type guard function that redefines an AbstractGeoviewLayerConfig as a GeocoreConfig if the entryType attribute of the
 * verifyIfLay parameter is CV_CONST_LAYER_TYPES.GEOCORE. The type assertion applies only to the true block of the if clause that use this
 * function.
 *
 * @param {EntryConfigBaseClass} verifyIfLayer Polymorphic object to test in order to determine if the type assertion is valid.
 *
 * @returns {boolean} true if the type assertion is valid.
 * /
// GV: We must decide how we want to process geocore layers. We need to specify how the viewer handles geocores. Do we want them to be
// GV: specified at the highest level (GeoviewLayerType) or further down the layer tree (layerEntryConfig)?
// GV: If specified at the highest level, all layerEntryConfig are geocore and you can't mix IDs in the tree that return different
// GV: types, like EsriDynamic and GeoJSON.
// GV: If specified at the lowest level, it is possible to put a geocore entry in the tree with entries of a particular type, as
// GV: long as all the resulting types are the same.
// GV: The simplest implementation is the second. By specifying geocore layers at tree level, all you need to do is give a layerId
// GV: and a geocoreId, and the validator will fetch the layer definition to fill in the field value at leaf level in the tree.
// GV: The presence of a value in the geocoreId property indicates the origin of the layer.
export const mapConfigLayerEntryIsGeoCore = (verifyIfLayer: AbstractGeoviewLayerConfig): verifyIfLayer is GeocoreConfig => {
  return verifyIfLayer.geoviewLayerType === CV_CONST_LAYER_TYPES.GEOCORE;
};

/**
 * Type guard function that redefines a TypeGeoviewLayerConfig as a TypeEsriDynamicLayerConfig if the geoviewLayerType attribute
 * of the verifyIfLayer parameter is ESRI_DYNAMIC. The type assertion applies only to the true block of the if clause that use
 * this function.
 *
 * @param {TypeGeoviewLayerConfig} verifyIfLayer Polymorphic object to test in order to determine if the type assertion is valid.
 *
 * @returns {boolean} true if the type assertion is valid.
 */
export declare const geoviewConfigIsEsriDynamic: (verifyIfLayer: AbstractGeoviewLayerConfig) => verifyIfLayer is EsriDynamicLayerConfig;
/**
 * type guard function that redefines a CsvLayerEntryConfig as a TypeCSVLayerConfig if the geoviewLayerType attribute of the
 * verifyIfLayer parameter is CSV. The type assertion applies only to the true block of the if clause that use this
 * function.
 *
 * @param {TypeGeoviewLayerConfig} verifyIfLayer Polymorphic object to test in order to determine if the type assertion is valid.
 *
 * @returns {boolean} true if the type assertion is valid.
 * /
export const layerConfigIsCSV = (verifyIfLayer: AbstractGeoviewLayerConfig): verifyIfLayer is CsvLayerConfig => {
  return verifyIfLayer?.geoviewLayerType === CV_CONST_LAYER_TYPES.CSV;
}; */
/**
 * type guard function that redefines a TypeBaseVectorGeometryConfig as a TypeLineStringVectorConfig if the type attribute of the
 * verifyIfConfig parameter is 'lineString'. The type assertion applies only to the true block of the if clause that use
 * this function.
 *
 * @param {TypeBaseVectorGeometryConfig} verifyIfConfig Polymorphic object to test in order to determine if the type assertion is valid.
 *
 * @returns {boolean} true if the type assertion is valid.
 */
export declare const isLineStringVectorConfig: (verifyIfConfig: TypeBaseVectorGeometryConfig) => verifyIfConfig is TypeLineStringVectorConfig;
/**
 * type guard function that redefines a TypeBaseVectorGeometryConfig as a TypePolygonVectorConfig if the type attribute of the
 * verifyIfConfig parameter is 'filledPolygon'. The type assertion applies only to the true block of the if clause that use
 * this function.
 *
 * @param {TypeBaseVectorGeometryConfig} verifyIfConfig Polymorphic object to test in order to determine if the type assertion is valid.
 *
 * @returns {boolean} true if the type assertion is valid.
 */
export declare const isFilledPolygonVectorConfig: (verifyIfConfig: TypeBaseVectorGeometryConfig) => verifyIfConfig is TypePolygonVectorConfig;
/**
 * type guard function that redefines a TypeBaseVectorGeometryConfig as a TypeSimpleSymbolVectorConfig if the type attribute of the
 * verifyIfConfig parameter is 'simpleSymbol'. The type assertion applies only to the true block of the if clause that use
 * this function.
 *
 * @param {TypeBaseVectorGeometryConfig} verifyIfConfig Polymorphic object to test in order to determine if the type assertion is valid.
 *
 * @returns {boolean} true if the type assertion is valid.
 */
export declare const isSimpleSymbolVectorConfig: (verifyIfConfig: TypeBaseVectorGeometryConfig) => verifyIfConfig is TypeSimpleSymbolVectorConfig;
/**
 * type guard function that redefines a TypeBaseVectorGeometryConfig as a TypeIconSymbolVectorConfig if the type attribute of the
 * verifyIfConfig parameter is 'iconSymbol'. The type assertion applies only to the true block of the if clause that use
 * this function.
 *
 * @param {TypeBaseVectorGeometryConfig} verifyIfConfig Polymorphic object to test in order to determine if the type assertion is valid.
 *
 * @returns {boolean} true if the type assertion is valid.
 */
export declare const isIconSymbolVectorConfig: (verifyIfConfig: TypeBaseVectorGeometryConfig) => verifyIfConfig is TypeIconSymbolVectorConfig;
