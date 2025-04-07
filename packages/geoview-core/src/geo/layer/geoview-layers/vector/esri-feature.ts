import { Vector as VectorSource } from 'ol/source';
import { Options as SourceOptions } from 'ol/source/Vector';
import { EsriJSON } from 'ol/format';
import { ReadOptions } from 'ol/format/Feature';
import Feature from 'ol/Feature';

import { AbstractGeoViewVector } from '@/geo/layer/geoview-layers/vector/abstract-geoview-vector';
import { TypeJsonObject } from '@/core/types/global-types';
import { EsriFeatureLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-validation-classes/esri-feature-layer-entry-config';
import { AbstractBaseLayerEntryConfig } from '@/core/utils/config/validation-classes/abstract-base-layer-entry-config';
import { TypeLayerEntryConfig, TypeVectorSourceInitialConfig, TypeGeoviewLayerConfig } from '@/geo/map/map-schema-types';
import { AbstractGeoViewLayer, CONST_LAYER_TYPES } from '@/geo/layer/geoview-layers/abstract-geoview-layers';

import {
  commonfetchServiceMetadata,
  commonProcessFeatureInfoConfig,
  commonProcessInitialSettings,
  commonProcessLayerMetadata,
  commonProcessTemporalDimension,
  commonValidateListOfLayerEntryConfig,
} from '@/geo/layer/geoview-layers/esri-layer-common';

export interface TypeSourceEsriFeatureInitialConfig extends Omit<TypeVectorSourceInitialConfig, 'format'> {
  format: 'EsriJSON';
}

export interface TypeEsriFeatureLayerConfig extends TypeGeoviewLayerConfig {
  geoviewLayerType: typeof CONST_LAYER_TYPES.ESRI_FEATURE;
  listOfLayerEntryConfig: EsriFeatureLayerEntryConfig[];
}

/** *****************************************************************************************************************************
 * type guard function that redefines a TypeGeoviewLayerConfig as a TypeEsriFeatureLayerConfig if the geoviewLayerType attribute
 * of the verifyIfLayer parameter is ESRI_FEATURE. The type ascention applies only to the true block of the if clause that use
 * this function.
 *
 * @param {TypeGeoviewLayerConfig} verifyIfLayer Polymorphic object to test in order to determine if the type ascention is valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const layerConfigIsEsriFeature = (verifyIfLayer: TypeGeoviewLayerConfig): verifyIfLayer is TypeEsriFeatureLayerConfig => {
  return verifyIfLayer?.geoviewLayerType === CONST_LAYER_TYPES.ESRI_FEATURE;
};

/** *****************************************************************************************************************************
 * type guard function that redefines an AbstractGeoViewLayer as an EsriFeature if the type attribute of the verifyIfGeoViewLayer
 * parameter is ESRI_FEATURE. The type ascention applies only to the true block of the if clause that use this function.
 *
 * @param {AbstractGeoViewLayer} verifyIfGeoViewLayer Polymorphic object to test in order to determine if the type ascention
 * is valid
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const geoviewLayerIsEsriFeature = (verifyIfGeoViewLayer: AbstractGeoViewLayer): verifyIfGeoViewLayer is EsriFeature => {
  return verifyIfGeoViewLayer?.type === CONST_LAYER_TYPES.ESRI_FEATURE;
};

/** *****************************************************************************************************************************
 * type guard function that redefines a TypeLayerEntryConfig as a EsriFeatureLayerEntryConfig if the geoviewLayerType
 * attribute of the verifyIfGeoViewEntry.geoviewLayerConfig attribute is ESRI_FEATURE. The type ascention applies only to the true
 * block of the if clause that use this function.
 *
 * @param {TypeLayerEntryConfig} verifyIfGeoViewEntry Polymorphic object to test in order to determine if the type ascention
 * is valid
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const geoviewEntryIsEsriFeature = (
  verifyIfGeoViewEntry: TypeLayerEntryConfig
): verifyIfGeoViewEntry is EsriFeatureLayerEntryConfig => {
  return verifyIfGeoViewEntry?.geoviewLayerConfig?.geoviewLayerType === CONST_LAYER_TYPES.ESRI_FEATURE;
};

/** *****************************************************************************************************************************
 * A class to add esri feature layer.
 *
 * @exports
 * @class EsriFeature
 */
export class EsriFeature extends AbstractGeoViewVector {
  /** ***************************************************************************************************************************
   * Initialize layer.
   *
   * @param {string} mapId The id of the map.
   * @param {TypeEsriFeatureLayerConfig} layerConfig The layer configuration.
   */
  constructor(mapId: string, layerConfig: TypeEsriFeatureLayerConfig) {
    super(CONST_LAYER_TYPES.ESRI_FEATURE, layerConfig, mapId);
  }

  /** ***************************************************************************************************************************
   * This method reads the service metadata from the metadataAccessPath.
   *
   * @returns {Promise<void>} A promise that the execution is completed.
   */
  // GV Layers Refactoring - Obsolete (in config?)
  protected override fetchServiceMetadata(): Promise<void> {
    return commonfetchServiceMetadata(this);
  }

  /** ***************************************************************************************************************************
   * This method validates recursively the configuration of the layer entries to ensure that it is a feature layer identified
   * with a numeric layerId and creates a group entry when a layer is a group.
   *
   * @param {TypeLayerEntryConfig[]} listOfLayerEntryConfig The list of layer entries configuration to validate.
   */
  // GV Layers Refactoring - Obsolete (in config?)
  validateListOfLayerEntryConfig(listOfLayerEntryConfig: TypeLayerEntryConfig[]): void {
    commonValidateListOfLayerEntryConfig(this, listOfLayerEntryConfig);
  }

  /** ***************************************************************************************************************************
   * This method perform specific validation that can only be done by the child of the AbstractGeoViewEsriLayer class.
   *
   * @param {number} esriIndex The index of the current layer in the metadata.
   *
   * @returns {boolean} true if an error is detected.
   */
  // GV Layers Refactoring - Obsolete (in config?)
  esriChildHasDetectedAnError(layerConfig: TypeLayerEntryConfig, esriIndex: number): boolean {
    if (this.metadata!.layers[esriIndex].type !== 'Feature Layer') {
      // Add a layer load error
      this.addLayerLoadError(layerConfig, `LayerId ${layerConfig.layerPath} of map ${this.mapId} is not a feature layer`);
      return true;
    }
    return false;
  }

  /** ***************************************************************************************************************************
   * This method will create a Geoview temporal dimension if it exist in the service metadata
   * @param {TypeJsonObject} esriTimeDimension The ESRI time dimension object
   * @param {EsriFeatureLayerEntryConfig} layerConfig The layer entry to configure
   */
  // GV Layers Refactoring - Obsolete (in config?)
  protected processTemporalDimension(esriTimeDimension: TypeJsonObject, layerConfig: EsriFeatureLayerEntryConfig): void {
    commonProcessTemporalDimension(this, esriTimeDimension, layerConfig);
  }

  /** ***************************************************************************************************************************
   * This method verifies if the layer is queryable and sets the outfields and aliasFields of the source feature info.
   *
   * @param {EsriFeatureLayerEntryConfig} layerConfig The layer entry to configure.
   */
  // GV Layers Refactoring - Obsolete (in config?)
  processFeatureInfoConfig(layerConfig: EsriFeatureLayerEntryConfig): void {
    commonProcessFeatureInfoConfig(this, layerConfig);
  }

  /** ***************************************************************************************************************************
   * This method set the initial settings based on the service metadata. Priority is given to the layer configuration.
   *
   * @param {EsriFeature} this The ESRI layer instance pointer.
   * @param {EsriFeatureLayerEntryConfig} layerConfig The layer entry to configure.
   */
  // GV Layers Refactoring - Obsolete (in config?)
  processInitialSettings(layerConfig: EsriFeatureLayerEntryConfig): void {
    commonProcessInitialSettings(this, layerConfig);
  }

  /** ***************************************************************************************************************************
   * This method is used to process the layer's metadata. It will fill the empty fields of the layer's configuration (renderer,
   * initial settings, fields and aliases).
   *
   * @param {AbstractBaseLayerEntryConfig} layerConfig The layer entry configuration to process.
   *
   * @returns {Promise<AbstractBaseLayerEntryConfig>} A promise that the layer configuration has its metadata processed.
   */
  // GV Layers Refactoring - Obsolete (in config?)
  protected override onProcessLayerMetadata(layerConfig: AbstractBaseLayerEntryConfig): Promise<AbstractBaseLayerEntryConfig> {
    // Instance check
    if (!(layerConfig instanceof EsriFeatureLayerEntryConfig)) throw new Error('Invalid layer configuration type provided');
    return commonProcessLayerMetadata(this, layerConfig);
  }

  /** ***************************************************************************************************************************
   * Create a source configuration for the vector layer.
   *
   * @param {AbstractBaseLayerEntryConfig} layerConfig The layer entry configuration.
   * @param {SourceOptions} sourceOptions The source options (default: {}).
   * @param {ReadOptions} readOptions The read options (default: {}).
   *
   * @returns {VectorSource<Geometry>} The source configuration that will be used to create the vector layer.
   */
  // GV Layers Refactoring - Obsolete (in config?, in layers?)
  protected override createVectorSource(
    layerConfig: AbstractBaseLayerEntryConfig,
    sourceOptions: SourceOptions<Feature> = {},
    readOptions: ReadOptions = {}
  ): VectorSource<Feature> {
    // ? The line below uses var because a var declaration has a wider scope than a let declaration.
    // eslint-disable-next-line no-var
    var vectorSource: VectorSource<Feature>;
    // eslint-disable-next-line no-param-reassign
    sourceOptions.url = layerConfig.source!.dataAccessPath!;
    // eslint-disable-next-line no-param-reassign
    sourceOptions.url = `${sourceOptions.url}${layerConfig.layerId}/query?f=json&where=1%3D1&returnCountOnly=true`;
    // eslint-disable-next-line no-param-reassign
    sourceOptions.format = new EsriJSON();

    vectorSource = super.createVectorSource(layerConfig, sourceOptions, readOptions);
    return vectorSource;
  }
}
