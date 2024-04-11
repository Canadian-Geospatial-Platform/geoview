// #region LAYER TREE CONFIG TYPE GUARDS

import { AbstractGeoviewLayerConfig } from './classes/geoview-config/abstract-geoview-layer-config';
import { EsriDynamicLayerConfig } from './classes/geoview-config/raster-config/esri-dynamic-config';
import { ConfigBaseClass } from './classes/layer-tree-config/config-base-class';
import { GroupLayerEntryConfig } from './classes/layer-tree-config/group-layer-entry-config';
import { EsriDynamicLayerEntryConfig } from './classes/layer-tree-config/raster-leaf/esri-dynamic-layer-entry-config';
import { CONST_LAYER_ENTRY_TYPES, CONST_LAYER_TYPES } from './config-constants';
import { TypeJsonObject } from './config-types';

/** ******************************************************************************************************************************
 * Type guard function that redefines a ConfigBaseClass as a GroupLayerEntryConfig if the entryType attribute of the verifyIfLayer
 * parameter is CONST_LAYER_ENTRY_TYPES.GROUP. The type ascention applies only to the true block of the if clause that use this
 * function.
 *
 * @param {ConfigBaseClass} verifyIfLayer Polymorphic object to test in order to determine if the type ascention is valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const layerEntryIsGroupLayer = (verifyIfLayer: ConfigBaseClass | TypeJsonObject): verifyIfLayer is GroupLayerEntryConfig => {
  return verifyIfLayer?.entryType === CONST_LAYER_ENTRY_TYPES.GROUP;
};

/** ******************************************************************************************************************************
 * Type guard function that redefines a ConfigBaseClass as a VectorLayerEntryConfig if the entryType attribute of
 * the verifyIfLayer parameter is 'vector'. The type ascention applies only to the true block of the if clause that use this
 * function.
 *
 * @param {ConfigBaseClass} verifyIfLayer Polymorphic object to test in order to determine if the type ascention is valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 * /
export const layerEntryIsVector = (verifyIfLayer: ConfigBaseClass): verifyIfLayer is VectorLayerEntryConfig => {
  return verifyIfLayer?.entryType === CONST_LAYER_ENTRY_TYPES.VECTOR;
};

/** ******************************************************************************************************************************
 * Type guard function that redefines a ConfigBaseClass as a VectorHeatmapLayerEntryConfig if the entryType attribute of
 * the verifyIfLayer parameter is 'vectorHeatmap'. The type ascention applies only to the true block of the if clause that use
 * this function.
 *
 * @param {ConfigBaseClass} verifyIfLayer Polymorphic object to test in order to determine if the type ascention is valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 * /
export const layerEntryIsVectorHeatmap = (verifyIfLayer: ConfigBaseClass): verifyIfLayer is VectorHeatmapLayerEntryConfig => {
  return verifyIfLayer?.entryType === CONST_LAYER_ENTRY_TYPES.VECTOR_HEATMAP;
};

/** ******************************************************************************************************************************
 * Type guard function that redefines a ConfigBaseClass as a VectorTileEntryConfig if the entryType attribute of the
 * verifyIfLayer parameter is 'vector' and the object has a style attribute. The type ascention applies only to the true block
 * of the if clause that use this function.
 *
 * @param {ConfigBaseClass} verifyIfLayer Polymorphic object to test in order to determine if the type ascention is valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 * /
export const layerEntryIsVectorTile = (verifyIfLayer: ConfigBaseClass): verifyIfLayer is VectorTilesLayerEntryConfig => {
  return verifyIfLayer?.entryType === CONST_LAYER_ENTRY_TYPES.VECTOR_TILE;
};

/** ******************************************************************************************************************************
 * Type guard function that redefines a ConfigBaseClass as a TileLayerEntryConfig if the entryType attribute of the verifyIfLayer
 * parameter is 'raster-tile'. The type ascention applies only to the true block of the if clause that use this function.
 *
 * @param {ConfigBaseClass} verifyIfLayer Polymorphic object to test in order to determine if the type ascention is valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 * /
export const layerEntryIsRasterTile = (verifyIfLayer: ConfigBaseClass): verifyIfLayer is TileLayerEntryConfig => {
  return verifyIfLayer?.entryType === CONST_LAYER_ENTRY_TYPES.RASTER_TILE;
};

/** ******************************************************************************************************************************
 * Type guard function that redefines a ConfigBaseClass as a OgcWmsLayerEntryConfig if the entryType attribute of the
 * verifyIfLayer parameter is CONST_LAYER_TYPES.WMS. The type ascention applies only to the true block of the if clause that use
 * this function.
 *
 * @param {ConfigBaseClass} verifyIfLayer Polymorphic object to test in order to determine if the type ascention is valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 * /
export const layerEntryIsOgcWms = (verifyIfLayer: ConfigBaseClass): verifyIfLayer is OgcWmsLayerEntryConfig => {
  return verifyIfLayer?.entryType === CONST_LAYER_TYPES.WMS;
};

/** ******************************************************************************************************************************
 * Type guard function that redefines a ConfigBaseClass as a EsriDynamicLayerEntryConfig if the entryType attribute of
 * the verifyIfLayer parameter is CONST_LAYER_TYPES.WMS. The type ascention applies only to the true block of the if clause that
 * use this function.
 *
 * @param {ConfigBaseClass} verifyIfLayer Polymorphic object to test in order to determine if the type ascention is valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const layerEntryIsEsriDynamic = (verifyIfLayer: ConfigBaseClass): verifyIfLayer is EsriDynamicLayerEntryConfig => {
  return verifyIfLayer?.geoviewLayerType === CONST_LAYER_TYPES.ESRI_DYNAMIC;
};

/** ******************************************************************************************************************************
 * type guard function that redefines a ConfigBaseClass as a EsriImageLayerEntryConfig if the entryType attribute of the
 * verifyIfLayer parameter is CONST_LAYER_TYPES.WMS. The type ascention applies only to the true block of the if clause that use
 * this function.
 *
 * @param {ConfigBaseClass} verifyIfLayer Polymorphic object to test in order to determine if the type ascention is valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 * /
export const layerEntryIsEsriImage = (verifyIfLayer: ConfigBaseClass): verifyIfLayer is EsriImageLayerEntryConfig => {
  return verifyIfLayer?.entryType === CONST_LAYER_TYPES.ESRI_IMAGE;
};

/** ******************************************************************************************************************************
 * Type guard function that redefines a ConfigBaseClass as a ImageStaticLayerEntryConfig if the entryType attribute of
 * the verifyIfLayer parameter is CONST_LAYER_TYPES.WMS. The type ascention applies only to the true block of the if clause that
 * use this function.
 *
 * @param {ConfigBaseClass} verifyIfLayer Polymorphic object to test in order to determine if the type ascention is valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 * /
export const layerEntryIsImageStatic = (verifyIfLayer: ConfigBaseClass): verifyIfLayer is ImageStaticLayerEntryConfig => {
  return verifyIfLayer?.entryType === CONST_LAYER_TYPES.IMAGE_STATIC;
};

// #region GEOVIEW CONFIG TYPE GUARDS
/** ******************************************************************************************************************************
 * Type guard function that redefines an AbstractGeoviewLayerConfig as a GeocoreConfig if the entryType attribute of the
 * verifyIfLay parameter is CONST_LAYER_TYPES.GEOCORE. The type ascention applies only to the true block of the if clause that use this
 * function.
 *
 * @param {ConfigBaseClass} verifyIfLayer Polymorphic object to test in order to determine if the type ascention is valid.
 *
 * @returns {boolean} true if the type ascention is valid.
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
  return verifyIfLayer.geoviewLayerType === CONST_LAYER_TYPES.GEOCORE;
};

/** ******************************************************************************************************************************
 * Type guard function that redefines a TypeGeoviewLayerConfig as a TypeEsriDynamicLayerConfig if the geoviewLayerType attribute
 * of the verifyIfLayer parameter is ESRI_DYNAMIC. The type ascention applies only to the true block of the if clause that use
 * this function.
 *
 * @param {TypeGeoviewLayerConfig} verifyIfLayer Polymorphic object to test in order to determine if the type ascention is valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const geoviewConfigIsEsriDynamic = (verifyIfLayer: AbstractGeoviewLayerConfig): verifyIfLayer is EsriDynamicLayerConfig => {
  return verifyIfLayer?.geoviewLayerType === CONST_LAYER_TYPES.ESRI_DYNAMIC;
};

/** *****************************************************************************************************************************
 * type guard function that redefines a CsvLayerEntryConfig as a TypeCSVLayerConfig if the geoviewLayerType attribute of the
 * verifyIfLayer parameter is CSV. The type ascention applies only to the true block of the if clause that use this
 * function.
 *
 * @param {TypeGeoviewLayerConfig} verifyIfLayer Polymorphic object to test in order to determine if the type ascention is valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 * /
export const layerConfigIsCSV = (verifyIfLayer: AbstractGeoviewLayerConfig): verifyIfLayer is CsvLayerConfig => {
  return verifyIfLayer?.geoviewLayerType === CONST_LAYER_TYPES.CSV;
};
/** ************************************************************************************************************************** */
