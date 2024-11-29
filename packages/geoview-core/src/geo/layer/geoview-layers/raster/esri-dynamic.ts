/* eslint-disable no-param-reassign */
// We have many reassign for layerPath-layerConfig. We keep it global...
import { ImageArcGISRest } from 'ol/source';
import { Options as SourceOptions } from 'ol/source/ImageArcGISRest';
import BaseLayer from 'ol/layer/Base';
import { Image as ImageLayer } from 'ol/layer';

import { AbstractGeoViewLayer, CONST_LAYER_TYPES } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { AbstractGeoViewRaster } from '@/geo/layer/geoview-layers/raster/abstract-geoview-raster';
import { TypeJsonObject } from '@/core/types/global-types';
import { EsriDynamicLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/esri-dynamic-layer-entry-config';
import { TypeLayerEntryConfig, TypeGeoviewLayerConfig } from '@/geo/map/map-schema-types';

import {
  commonfetchServiceMetadata,
  commonProcessFeatureInfoConfig,
  commonProcessInitialSettings,
  commonProcessLayerMetadata,
  commonProcessTemporalDimension,
  commonValidateListOfLayerEntryConfig,
} from '@/geo/layer/geoview-layers/esri-layer-common';
import { AbstractBaseLayerEntryConfig } from '@/core/utils/config/validation-classes/abstract-base-layer-entry-config';

// GV: CONFIG EXTRACTION
// GV: This section of code was extracted and copied to the geoview config section
// GV: |||||
// GV: vvvvv

export interface TypeEsriDynamicLayerConfig extends TypeGeoviewLayerConfig {
  geoviewLayerType: typeof CONST_LAYER_TYPES.ESRI_DYNAMIC;
  listOfLayerEntryConfig: EsriDynamicLayerEntryConfig[];
}

/** ******************************************************************************************************************************
 * type guard function that redefines a TypeGeoviewLayerConfig as a TypeEsriDynamicLayerConfig if the geoviewLayerType attribute of
 * the verifyIfLayer parameter is ESRI_DYNAMIC. The type ascention applies only to the true block of the if clause that use
 * this function.
 *
 * @param {TypeGeoviewLayerConfig} verifyIfLayer Polymorphic object to test in order to determine if the type ascention is valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const layerConfigIsEsriDynamic = (verifyIfLayer: TypeGeoviewLayerConfig): verifyIfLayer is TypeEsriDynamicLayerConfig => {
  return verifyIfLayer?.geoviewLayerType === CONST_LAYER_TYPES.ESRI_DYNAMIC;
};

// GV: ^^^^^
// GV: |||||

/** ******************************************************************************************************************************
 * type guard function that redefines an AbstractGeoViewLayer as an EsriDynamic if the type attribute of the verifyIfGeoViewLayer
 * parameter is ESRI_DYNAMIC. The type ascention applies only to the true block of the if clause that use this function.
 *
 * @param {AbstractGeoViewLayer} verifyIfGeoViewLayer Polymorphic object to test in order to determine if the type ascention is
 * valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const geoviewLayerIsEsriDynamic = (verifyIfGeoViewLayer: AbstractGeoViewLayer): verifyIfGeoViewLayer is EsriDynamic => {
  return verifyIfGeoViewLayer?.type === CONST_LAYER_TYPES.ESRI_DYNAMIC;
};
// GV: CONFIG EXTRACTION
// GV: This section of code must be deleted because we already have another type guard that does the same thing
// GV: |||||
// GV: vvvvv

/** ******************************************************************************************************************************
 * type guard function that redefines a TypeLayerEntryConfig as a EsriDynamicLayerEntryConfig if the geoviewLayerType attribute
 * of the verifyIfGeoViewEntry.geoviewLayerConfig attribute is ESRI_DYNAMIC. The type ascention applies only to the true block of
 * the if clause that use this function.
 *
 * @param {TypeLayerEntryConfig} verifyIfGeoViewEntry Polymorphic object to test in order to determine if the type ascention is
 * valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const geoviewEntryIsEsriDynamic = (
  verifyIfGeoViewEntry: TypeLayerEntryConfig
): verifyIfGeoViewEntry is EsriDynamicLayerEntryConfig => {
  return verifyIfGeoViewEntry?.geoviewLayerConfig?.geoviewLayerType === CONST_LAYER_TYPES.ESRI_DYNAMIC;
};

// GV: ^^^^^
// GV: |||||

// ******************************************************************************************************************************
// ******************************************************************************************************************************
/** ******************************************************************************************************************************
 * A class to add esri dynamic layer.
 *
 * @exports
 * @class EsriDynamic
 */
// ******************************************************************************************************************************
// GV Layers Refactoring - Obsolete (in layers)
export class EsriDynamic extends AbstractGeoViewRaster {
  // The default hit tolerance the query should be using
  static override DEFAULT_HIT_TOLERANCE: number = 7;

  // Override the hit tolerance for a EsriDynamic layer
  override hitTolerance: number = EsriDynamic.DEFAULT_HIT_TOLERANCE;

  /** ****************************************************************************************************************************
   * Initialize layer.
   * @param {string} mapId The id of the map.
   * @param {TypeEsriDynamicLayerConfig} layerConfig The layer configuration.
   */
  constructor(mapId: string, layerConfig: TypeEsriDynamicLayerConfig) {
    if (!layerConfig.serviceDateFormat) layerConfig.serviceDateFormat = 'DD/MM/YYYY HH:MM:SSZ';
    super(CONST_LAYER_TYPES.ESRI_DYNAMIC, layerConfig, mapId);
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
  esriChildHasDetectedAnError(layerConfig: TypeLayerEntryConfig): boolean {
    if (!this.metadata!.supportsDynamicLayers) {
      this.layerLoadError.push({
        layer: layerConfig.layerPath,
        loggerMessage: `Layer ${layerConfig.layerPath} of map ${this.mapId} does not support dynamic layers.`,
      });
      return true;
    }
    return false;
  }

  /** ***************************************************************************************************************************
   * This method will create a Geoview temporal dimension if it exist in the service metadata
   * @param {TypeJsonObject} esriTimeDimension The ESRI time dimension object
   * @param {EsriDynamicLayerEntryConfig} layerConfig The layer entry to configure
   */
  // GV Layers Refactoring - Obsolete (in config?)
  protected processTemporalDimension(esriTimeDimension: TypeJsonObject, layerConfig: EsriDynamicLayerEntryConfig): void {
    commonProcessTemporalDimension(this, esriTimeDimension, layerConfig);
  }

  /** ***************************************************************************************************************************
   * This method verifies if the layer is queryable and sets the outfields and aliasFields of the source feature info.
   *
   * @param {EsriDynamicLayerEntryConfig} layerConfig The layer entry to configure.
   */
  // GV Layers Refactoring - Obsolete (in config?)
  processFeatureInfoConfig(layerConfig: EsriDynamicLayerEntryConfig): void {
    commonProcessFeatureInfoConfig(this, layerConfig);
  }

  /** ***************************************************************************************************************************
   * This method set the initial settings based on the service metadata. Priority is given to the layer configuration.
   *
   * @param {EsriDynamic} this The ESRI layer instance pointer.
   * @param {EsriDynamicLayerEntryConfig} layerConfig The layer entry to configure.
   */
  // GV Layers Refactoring - Obsolete (in config?)
  processInitialSettings(layerConfig: EsriDynamicLayerEntryConfig): void {
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
  protected override processLayerMetadata(layerConfig: AbstractBaseLayerEntryConfig): Promise<AbstractBaseLayerEntryConfig> {
    // Instance check
    if (!(layerConfig instanceof EsriDynamicLayerEntryConfig)) throw new Error('Invalid layer configuration type provided');
    return commonProcessLayerMetadata(this, layerConfig);
  }

  /** ****************************************************************************************************************************
   * This method creates a GeoView EsriDynamic layer using the definition provided in the layerConfig parameter.
   *
   * @param {AbstractBaseLayerEntryConfig} layerConfig Information needed to create the GeoView layer.
   *
   * @returns {Promise<BaseLayer | undefined>} The GeoView raster layer that has been created.
   */
  // GV Layers Refactoring - Obsolete (in config?, in layers?)
  protected override async processOneLayerEntry(layerConfig: AbstractBaseLayerEntryConfig): Promise<BaseLayer | undefined> {
    // GV IMPORTANT: The processOneLayerEntry method must call the corresponding method of its parent to ensure that the flow of
    // GV            layerStatus values is correctly sequenced.
    await super.processOneLayerEntry(layerConfig);

    // Instance check
    if (!(layerConfig instanceof EsriDynamicLayerEntryConfig)) throw new Error('Invalid layer configuration type provided');

    const sourceOptions: SourceOptions = {};
    sourceOptions.attributions = [(this.metadata?.copyrightText ? this.metadata?.copyrightText : '') as string];
    sourceOptions.url = layerConfig.source.dataAccessPath!;
    sourceOptions.params = { LAYERS: `show:${layerConfig.layerId}` };
    if (layerConfig.source.transparent) sourceOptions.params.transparent = layerConfig.source.transparent!;
    if (layerConfig.source.format) sourceOptions.params.format = layerConfig.source.format!;
    if (layerConfig.source.crossOrigin) {
      sourceOptions.crossOrigin = layerConfig.source.crossOrigin;
    } else {
      sourceOptions.crossOrigin = 'Anonymous';
    }
    if (layerConfig.source.projection) sourceOptions.projection = `EPSG:${layerConfig.source.projection}`;

    // Create the source
    const source = new ImageArcGISRest(sourceOptions);

    // GV Time to request an OpenLayers layer!
    const requestResult = this.emitLayerRequesting({ config: layerConfig, source });

    // If any response
    let olLayer: ImageLayer<ImageArcGISRest> | undefined;
    if (requestResult.length > 0) {
      // Get the OpenLayer that was created
      olLayer = requestResult[0] as ImageLayer<ImageArcGISRest>;
    } else throw new Error('Error on layerRequesting event');

    // GV Time to emit about the layer creation!
    this.emitLayerCreation({ config: layerConfig, layer: olLayer });

    return Promise.resolve(olLayer);
  }
}
