import { ImageArcGISRest } from 'ol/source';
import { Options as SourceOptions } from 'ol/source/ImageArcGISRest';

import { EsriImageLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/esri-image-layer-entry-config';
import { AbstractGeoViewRaster } from '@/geo/layer/geoview-layers/raster/abstract-geoview-raster';
import {
  TypeLayerEntryConfig,
  TypeGeoviewLayerConfig,
  CONST_LAYER_ENTRY_TYPES,
  CONST_LAYER_TYPES,
} from '@/api/config/types/map-schema-types';

import { commonProcessLayerMetadata } from '@/geo/layer/geoview-layers/esri-layer-common';
import { LayerDataAccessPathMandatoryError } from '@/core/exceptions/layer-exceptions';
import { GVEsriImage } from '@/geo/layer/gv-layers/raster/gv-esri-image';

export interface TypeEsriImageLayerConfig extends TypeGeoviewLayerConfig {
  geoviewLayerType: typeof CONST_LAYER_TYPES.ESRI_IMAGE;
  listOfLayerEntryConfig: EsriImageLayerEntryConfig[];
}

/**
 * A class to add an EsriImage layer.
 *
 * @exports
 * @class EsriImage
 */
export class EsriImage extends AbstractGeoViewRaster {
  /**
   * Constructs an EsriImage Layer configuration processor.
   * @param {TypeEsriImageLayerConfig} layerConfig The layer configuration.
   */
  constructor(layerConfig: TypeEsriImageLayerConfig) {
    // eslint-disable-next-line no-param-reassign
    if (!layerConfig.serviceDateFormat) layerConfig.serviceDateFormat = 'DD/MM/YYYY HH:MM:SSZ';
    super(CONST_LAYER_TYPES.ESRI_IMAGE, layerConfig);
  }

  /**
   * Overrides the way the layer metadata is processed.
   * @param {EsriImageLayerEntryConfig} layerConfig - The layer entry configuration to process.
   * @returns {Promise<EsriImageLayerEntryConfig>} A promise that the layer entry configuration has gotten its metadata processed.
   */
  protected override onProcessLayerMetadata(layerConfig: EsriImageLayerEntryConfig): Promise<EsriImageLayerEntryConfig> {
    return commonProcessLayerMetadata(this, layerConfig);
  }

  /**
   * Overrides the creation of the GV Layer
   * @param {EsriImageLayerEntryConfig} layerConfig - The layer entry configuration.
   * @returns {GVEsriImage} The GV Layer
   */
  protected override onCreateGVLayer(layerConfig: EsriImageLayerEntryConfig): GVEsriImage {
    // Create the source
    const source = EsriImage.createEsriImageSource(layerConfig);

    // Create the GV Layer
    const gvLayer = new GVEsriImage(source, layerConfig);

    // Return it
    return gvLayer;
  }

  /**
   * Creates a configuration object for a Esri Image layer.
   * This function constructs a `TypeEsriImageLayerConfig` object that describes an Esri Image layer
   * and its associated entry configurations based on the provided parameters.
   * @param {string} geoviewLayerId - A unique identifier for the GeoView layer.
   * @param {string} geoviewLayerName - The display name of the GeoView layer.
   * @param {string} metadataAccessPath - The URL or path to access metadata.
   * @param {boolean} isTimeAware - Indicates whether the layer supports time-based filtering.
   * @returns {TypeEsriImageLayerConfig} The constructed configuration object for the Esri Image layer.
   */
  static createEsriImageLayerConfig(
    geoviewLayerId: string,
    geoviewLayerName: string,
    metadataAccessPath: string,
    isTimeAware: boolean
  ): TypeEsriImageLayerConfig {
    const geoviewLayerConfig: TypeEsriImageLayerConfig = {
      geoviewLayerId,
      geoviewLayerName,
      metadataAccessPath,
      geoviewLayerType: CONST_LAYER_TYPES.ESRI_IMAGE,
      isTimeAware,
      listOfLayerEntryConfig: [],
    };
    geoviewLayerConfig.listOfLayerEntryConfig = [
      new EsriImageLayerEntryConfig({
        geoviewLayerConfig,
        schemaTag: CONST_LAYER_TYPES.ESRI_IMAGE,
        entryType: CONST_LAYER_ENTRY_TYPES.RASTER_IMAGE,
        layerId: metadataAccessPath.split('/').slice(-2, -1)[0],
      } as EsriImageLayerEntryConfig),
    ];

    // Return it
    return geoviewLayerConfig;
  }

  /**
   * Creates an ImageArcGISRest source from a layer config.
   * @param {EsriImageLayerEntryConfig} layerConfig - The configuration for the EsriImage layer.
   * @returns A fully configured ImageArcGISRest source.
   * @throws If required config fields like dataAccessPath are missing.
   */
  static createEsriImageSource(layerConfig: EsriImageLayerEntryConfig): ImageArcGISRest {
    const { source } = layerConfig;

    if (!source?.dataAccessPath) {
      throw new LayerDataAccessPathMandatoryError(layerConfig.layerPath);
    }

    const sourceOptions: SourceOptions = {
      url: source.dataAccessPath,
      attributions: layerConfig.getAttributions(),
      params: {
        LAYERS: `show:${layerConfig.layerId}`,
        ...(source.transparent !== undefined && { transparent: source.transparent }),
        ...(source.format && { format: source.format }),
      },
      crossOrigin: source.crossOrigin ?? 'Anonymous',
      projection: source.projection ? `EPSG:${source.projection}` : undefined,
    };

    return new ImageArcGISRest(sourceOptions);
  }
}

/**
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

/**
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
