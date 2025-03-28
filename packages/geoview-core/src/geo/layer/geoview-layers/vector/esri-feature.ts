import { Vector as VectorSource } from 'ol/source';
import { Options as SourceOptions } from 'ol/source/Vector';
import { EsriJSON } from 'ol/format';
import { ReadOptions } from 'ol/format/Feature';
import Feature from 'ol/Feature';

import { AbstractGeoViewVector } from '@/geo/layer/geoview-layers/vector/abstract-geoview-vector';
import { EsriFeatureLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-validation-classes/esri-feature-layer-entry-config';
import { AbstractBaseLayerEntryConfig } from '@/core/utils/config/validation-classes/abstract-base-layer-entry-config';
import { TypeLayerEntryConfig, TypeVectorSourceInitialConfig, TypeGeoviewLayerConfig } from '@/geo/map/map-schema-types';
import { CONST_LAYER_TYPES } from '@/geo/layer/geoview-layers/abstract-geoview-layers';

import {
  commonFetchAndSetServiceMetadata,
  commonProcessLayerMetadata,
  commonValidateListOfLayerEntryConfig,
} from '@/geo/layer/geoview-layers/esri-layer-common';

export interface TypeSourceEsriFeatureInitialConfig extends Omit<TypeVectorSourceInitialConfig, 'format'> {
  format: 'EsriJSON';
}

export interface TypeEsriFeatureLayerConfig extends TypeGeoviewLayerConfig {
  geoviewLayerType: typeof CONST_LAYER_TYPES.ESRI_FEATURE;
  listOfLayerEntryConfig: EsriFeatureLayerEntryConfig[];
}

/**
 * A class to add an EsriFeature layer.
 *
 * @exports
 * @class EsriFeature
 */
export class EsriFeature extends AbstractGeoViewVector {
  /**
   * Constructs an EsriFeature Layer configuration processor.
   *
   * @param {string} mapId The id of the map.
   * @param {TypeEsriFeatureLayerConfig} layerConfig The layer configuration.
   */
  constructor(mapId: string, layerConfig: TypeEsriFeatureLayerConfig) {
    super(CONST_LAYER_TYPES.ESRI_FEATURE, layerConfig, mapId);
  }

  /**
   * Overrides the way the metadata is fetched and set in the 'metadata' property. Resolves when done.
   * @returns {Promise<void>} A promise that the execution is completed.
   */
  protected override onFetchAndSetServiceMetadata(): Promise<void> {
    // Redirect
    return commonFetchAndSetServiceMetadata(this);
  }

  /** ***************************************************************************************************************************
   * This method validates recursively the configuration of the layer entries to ensure that it is a feature layer identified
   * with a numeric layerId and creates a group entry when a layer is a group.
   *
   * @param {TypeLayerEntryConfig[]} listOfLayerEntryConfig The list of layer entries configuration to validate.
   */
  protected override onValidateListOfLayerEntryConfig(listOfLayerEntryConfig: TypeLayerEntryConfig[]): void {
    commonValidateListOfLayerEntryConfig(this, listOfLayerEntryConfig);
  }

  /**
   * Performs specific validation that can only be done by the child of the AbstractGeoViewEsriLayer class.
   * @param {TypeLayerEntryConfig} layerConfig - The layer config to check.
   * @param {esriIndex} esriIndex - The esri layer index config to check.
   * @returns {boolean} true if an error is detected.
   */
  esriChildHasDetectedAnError(layerConfig: TypeLayerEntryConfig, esriIndex: number): boolean {
    if (this.metadata!.layers[esriIndex].type !== 'Feature Layer') {
      // Add a layer load error
      this.addLayerLoadError(layerConfig, `LayerId ${layerConfig.layerPath} of map ${this.mapId} is not a feature layer`);
      return true;
    }
    return false;
  }

  /**
   * Overrides the way the layer metadata is processed.
   * @param {AbstractBaseLayerEntryConfig} layerConfig - The layer entry configuration to process.
   * @returns {Promise<AbstractBaseLayerEntryConfig>} A promise that the layer entry configuration has gotten its metadata processed.
   */
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
