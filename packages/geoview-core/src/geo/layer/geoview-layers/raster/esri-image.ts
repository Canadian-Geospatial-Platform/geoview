import { ImageArcGISRest } from 'ol/source';
import { Options as SourceOptions } from 'ol/source/ImageArcGISRest';
import { Image as ImageLayer } from 'ol/layer';

import { TypeJsonObject } from '@/core/types/global-types';
import { EsriImageLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/esri-image-layer-entry-config';
import { AbstractBaseLayerEntryConfig } from '@/core/utils/config/validation-classes/abstract-base-layer-entry-config';
import { AbstractGeoViewLayer, CONST_LAYER_TYPES } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { AbstractGeoViewRaster } from '@/geo/layer/geoview-layers/raster/abstract-geoview-raster';
import { TypeLayerEntryConfig, TypeGeoviewLayerConfig, layerEntryIsGroupLayer } from '@/geo/map/map-schema-types';

import {
  commonProcessFeatureInfoConfig,
  commonProcessInitialSettings,
  commonProcessLayerMetadata,
  commonProcessTemporalDimension,
} from '@/geo/layer/geoview-layers/esri-layer-common';

export interface TypeEsriImageLayerConfig extends TypeGeoviewLayerConfig {
  geoviewLayerType: typeof CONST_LAYER_TYPES.ESRI_IMAGE;
  listOfLayerEntryConfig: EsriImageLayerEntryConfig[];
}

/** ******************************************************************************************************************************
 * type guard function that redefines a TypeGeoviewLayerConfig as a TypeEsriImageLayerConfig if the geoviewLayerType attribute of
 * the verifyIfLayer parameter is ESRI_IMAGE. The type ascention applies only to the true block of the if clause that use
 * this function.
 *
 * @param {TypeGeoviewLayerConfig} verifyIfLayer Polymorphic object to test in order to determine if the type ascention is valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const layerConfigIsEsriImage = (verifyIfLayer: TypeGeoviewLayerConfig): verifyIfLayer is TypeEsriImageLayerConfig => {
  return verifyIfLayer?.geoviewLayerType === CONST_LAYER_TYPES.ESRI_IMAGE;
};

/** ******************************************************************************************************************************
 * type guard function that redefines an AbstractGeoViewLayer as an EsriImage if the type attribute of the verifyIfGeoViewLayer
 * parameter is ESRI_IMAGE. The type ascention applies only to the true block of the if clause that use this function.
 *
 * @param {AbstractGeoViewLayer} verifyIfGeoViewLayer Polymorphic object to test in order to determine if the type ascention is
 * valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const geoviewLayerIsEsriImage = (verifyIfGeoViewLayer: AbstractGeoViewLayer): verifyIfGeoViewLayer is EsriImage => {
  return verifyIfGeoViewLayer?.type === CONST_LAYER_TYPES.ESRI_IMAGE;
};

/** ******************************************************************************************************************************
 * type guard function that redefines a TypeLayerEntryConfig as a EsriImageLayerEntryConfig if the geoviewLayerType attribute
 * of the verifyIfGeoViewEntry.geoviewLayerConfig attribute is ESRI_IMAGE. The type ascention applies only to the true block of
 * the if clause that use this function.
 *
 * @param {TypeLayerEntryConfig} verifyIfGeoViewEntry Polymorphic object to test in order to determine if the type ascention is
 * valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const geoviewEntryIsEsriImage = (verifyIfGeoViewEntry: TypeLayerEntryConfig): verifyIfGeoViewEntry is EsriImageLayerEntryConfig => {
  return verifyIfGeoViewEntry?.geoviewLayerConfig?.geoviewLayerType === CONST_LAYER_TYPES.ESRI_IMAGE;
};

/** ******************************************************************************************************************************
 * A class to add esri image layer.
 *
 * @exports
 * @class EsriImage
 */
export class EsriImage extends AbstractGeoViewRaster {
  /** ****************************************************************************************************************************
   * Initialize layer.
   * @param {string} mapId The id of the map.
   * @param {TypeEsriImageLayerConfig} layerConfig The layer configuration.
   */
  constructor(mapId: string, layerConfig: TypeEsriImageLayerConfig) {
    // eslint-disable-next-line no-param-reassign
    if (!layerConfig.serviceDateFormat) layerConfig.serviceDateFormat = 'DD/MM/YYYY HH:MM:SSZ';
    super(CONST_LAYER_TYPES.ESRI_IMAGE, layerConfig, mapId);
  }

  /** ***************************************************************************************************************************
   * This method recursively validates the layer configuration entries by filtering and reporting invalid layers. If needed,
   * extra configuration may be done here.
   *
   * @param {TypeLayerEntryConfig[]} listOfLayerEntryConfig The list of layer entries configuration to validate.
   *
   * @returns {TypeLayerEntryConfig[]} A new list of layer entries configuration with deleted error layers.
   */
  // GV Layers Refactoring - Obsolete (in config?)
  protected validateListOfLayerEntryConfig(listOfLayerEntryConfig: TypeLayerEntryConfig[]): void {
    listOfLayerEntryConfig.forEach((layerConfig: TypeLayerEntryConfig) => {
      const { layerPath } = layerConfig;
      if (layerEntryIsGroupLayer(layerConfig)) {
        this.validateListOfLayerEntryConfig(layerConfig.listOfLayerEntryConfig!);
        if (!layerConfig.listOfLayerEntryConfig.length) {
          // Add a layer load error
          this.addLayerLoadError(layerConfig, `Empty layer group (mapId:  ${this.mapId}, layerPath: ${layerPath})`);
        }
      }
    });
  }

  /** ***************************************************************************************************************************
   * This method will create a Geoview temporal dimension if it exist in the service metadata
   * @param {TypeJsonObject} esriTimeDimension The ESRI time dimension object
   * @param {EsriImageLayerEntryConfig} layerConfig The layer entry to configure
   */
  // GV Layers Refactoring - Obsolete (in config?)
  protected processTemporalDimension(esriTimeDimension: TypeJsonObject, layerConfig: EsriImageLayerEntryConfig): void {
    commonProcessTemporalDimension(this, esriTimeDimension, layerConfig, true);
  }

  /** ***************************************************************************************************************************
   * This method verifies if the layer is queryable and sets the outfields and aliasFields of the source feature info.
   *
   * @param {EsriImageLayerEntryConfig} layerConfig The layer entry to configure.
   */
  // GV Layers Refactoring - Obsolete (in config?)
  processFeatureInfoConfig(layerConfig: EsriImageLayerEntryConfig): void {
    commonProcessFeatureInfoConfig(this, layerConfig);
  }

  /** ***************************************************************************************************************************
   * This method set the initial settings based on the service metadata. Priority is given to the layer configuration.
   *
   * @param {EsriImage} this The ESRI layer instance pointer.
   * @param {EsriImageLayerEntryConfig} layerConfig The layer entry to configure.
   */
  // GV Layers Refactoring - Obsolete (in config?)
  processInitialSettings(layerConfig: EsriImageLayerEntryConfig): void {
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
    if (!(layerConfig instanceof EsriImageLayerEntryConfig)) throw new Error('Invalid layer configuration type provided');
    return commonProcessLayerMetadata(this, layerConfig);
  }

  /** ****************************************************************************************************************************
   * This method creates a GeoView Esri Image layer using the definition provided in the layerConfig parameter.
   *
   * @param {AbstractBaseLayerEntryConfig} layerConfig Information needed to create the GeoView layer.
   *
   * @returns {Promise<ImageLayer<ImageArcGISRest>>} The GeoView raster layer that has been created.
   */
  // GV Layers Refactoring - Obsolete (in config)
  protected override onProcessOneLayerEntry(layerConfig: AbstractBaseLayerEntryConfig): Promise<ImageLayer<ImageArcGISRest>> {
    // Instance check
    if (!(layerConfig instanceof EsriImageLayerEntryConfig)) throw new Error('Invalid layer configuration type provided');

    const sourceOptions: SourceOptions = {};
    sourceOptions.attributions = [(this.metadata!.copyrightText ? this.metadata!.copyrightText : '') as string];
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
    let olLayer: ImageLayer<ImageArcGISRest>;
    if (requestResult.length > 0) {
      // Get the OpenLayer that was created
      olLayer = requestResult[0] as ImageLayer<ImageArcGISRest>;
    } else throw new Error('Error on layerRequesting event');

    // GV Time to emit about the layer creation!
    this.emitLayerCreation({ config: layerConfig, layer: olLayer });

    return Promise.resolve(olLayer);
  }
}
