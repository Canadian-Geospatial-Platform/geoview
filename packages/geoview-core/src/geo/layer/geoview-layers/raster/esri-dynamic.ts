import { ImageArcGISRest } from 'ol/source';
import { Options as SourceOptions } from 'ol/source/ImageArcGISRest';
import { Image as ImageLayer } from 'ol/layer';

import { AbstractGeoViewRaster } from '@/geo/layer/geoview-layers/raster/abstract-geoview-raster';
import { EsriDynamicLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/esri-dynamic-layer-entry-config';
import {
  TypeLayerEntryConfig,
  TypeGeoviewLayerConfig,
  CONST_LAYER_ENTRY_TYPES,
  CONST_LAYER_TYPES,
} from '@/api/config/types/map-schema-types';

import {
  commonFetchAndSetServiceMetadata,
  commonProcessLayerMetadata,
  commonValidateListOfLayerEntryConfig,
} from '@/geo/layer/geoview-layers/esri-layer-common';
import { logger } from '@/core/utils/logger';
import { LayerDataAccessPathMandatoryError } from '@/core/exceptions/layer-exceptions';
import { TypeJsonArray, TypeJsonObject } from '@/api/config/types/config-types';
import { deepMergeObjects } from '@/core/utils/utilities';
import { LayerEntryConfigNoLayerProvidedError } from '@/core/exceptions/layer-entry-config-exceptions';

// GV: CONFIG EXTRACTION
// GV: This section of code was extracted and copied to the geoview config section
// GV: |||||
// GV: vvvvv

export interface TypeEsriDynamicLayerConfig extends TypeGeoviewLayerConfig {
  geoviewLayerType: typeof CONST_LAYER_TYPES.ESRI_DYNAMIC;
  listOfLayerEntryConfig: EsriDynamicLayerEntryConfig[];
}

// GV: ^^^^^
// GV: |||||

/**
 * A class to add an EsriDynamic layer.
 *
 * @exports
 * @class EsriDynamic
 */
export class EsriDynamic extends AbstractGeoViewRaster {
  // The default hit tolerance the query should be using
  static override DEFAULT_HIT_TOLERANCE: number = 7;

  // Override the hit tolerance for a EsriDynamic layer
  override hitTolerance: number = EsriDynamic.DEFAULT_HIT_TOLERANCE;

  /**
   * Constructs an EsriDynamic Layer configuration processor.
   * @param {string} mapId The id of the map.
   * @param {TypeEsriDynamicLayerConfig} layerConfig The layer configuration.
   */
  constructor(mapId: string, layerConfig: TypeEsriDynamicLayerConfig) {
    // eslint-disable-next-line no-param-reassign
    if (!layerConfig.serviceDateFormat) layerConfig.serviceDateFormat = 'DD/MM/YYYY HH:MM:SSZ';
    super(CONST_LAYER_TYPES.ESRI_DYNAMIC, layerConfig, mapId);
  }

  /**
   * Overrides the way the metadata is fetched and set in the 'metadata' property. Resolves when done.
   * @returns {Promise<void>} A promise that the execution is completed.
   */
  protected override onFetchAndSetServiceMetadata(): Promise<void> {
    // Redirect
    return commonFetchAndSetServiceMetadata(this);
  }

  /**
   * Overrides the way the validation of the list of layer entry config happens.
   * @param {TypeLayerEntryConfig[]} listOfLayerEntryConfig The list of layer entries configuration to validate.
   */
  protected override onValidateListOfLayerEntryConfig(listOfLayerEntryConfig: TypeLayerEntryConfig[]): void {
    commonValidateListOfLayerEntryConfig(this, listOfLayerEntryConfig);
  }

  /**
   * Overrides the way the layer metadata is processed.
   * @param {EsriDynamicLayerEntryConfig} layerConfig - The layer entry configuration to process.
   * @returns {Promise<EsriDynamicLayerEntryConfig>} A promise that the layer entry configuration has gotten its metadata processed.
   */
  protected override onProcessLayerMetadata(layerConfig: EsriDynamicLayerEntryConfig): Promise<EsriDynamicLayerEntryConfig> {
    return commonProcessLayerMetadata(this, layerConfig);
  }

  /**
   * Overrides the way the layer entry is processed to generate an Open Layer Base Layer object.
   * @param {EsriDynamicLayerEntryConfig} layerConfig - The layer entry config needed to create the Open Layer object.
   * @returns {Promise<ImageLayer<ImageArcGISRest>>} The created Open Layer object.
   */
  protected override onProcessOneLayerEntry(layerConfig: EsriDynamicLayerEntryConfig): Promise<ImageLayer<ImageArcGISRest>> {
    // GV Time to request an OpenLayers layer!
    const requestResult = this.emitLayerRequesting({ config: layerConfig });

    // If any response
    let olLayer: ImageLayer<ImageArcGISRest>;
    if (requestResult.length > 0) {
      // Get the OpenLayer that was created
      olLayer = requestResult[0] as ImageLayer<ImageArcGISRest>;
    } else throw new LayerEntryConfigNoLayerProvidedError(layerConfig);

    // Return the OpenLayer layer
    return Promise.resolve(olLayer);
  }

  /**
   * Creates an ImageArcGISRest source from a layer config.
   * @param {EsriDynamicLayerEntryConfig} layerConfig - The configuration for the EsriDynamic layer.
   * @returns A fully configured ImageArcGISRest source.
   * @throws If required config fields like dataAccessPath are missing.
   */
  createEsriDynamicSource(layerConfig: EsriDynamicLayerEntryConfig): ImageArcGISRest {
    const { source } = layerConfig;

    if (!source?.dataAccessPath) {
      throw new LayerDataAccessPathMandatoryError(layerConfig.layerPath);
    }

    const sourceOptions: SourceOptions = {
      url: source.dataAccessPath,
      attributions: this.getAttributions(),
      params: {
        LAYERS: `show:${layerConfig.layerId}`,
        ...(source.transparent !== undefined && { transparent: source.transparent }),
        ...(source.format && { format: source.format }),
      },
      crossOrigin: source.crossOrigin ?? 'Anonymous',
      projection: source.projection ? `EPSG:${source.projection}` : undefined,
    };

    const arcgisSource = new ImageArcGISRest(sourceOptions);

    // Raster layers do not accept layerDefs — must be cleared
    if (layerConfig.getServiceMetadata()?.layers?.[0]?.type === 'Raster Layer') {
      const params = arcgisSource.getParams();
      arcgisSource.updateParams({ ...params, layerDefs: '' });
    }

    return arcgisSource;
  }

  /**
   * Performs specific validation that can only be done by the child of the AbstractGeoViewEsriLayer class.
   * @param {TypeLayerEntryConfig} layerConfig - The layer config to check.
   * @returns {boolean} true if an error is detected.
   */
  esriChildHasDetectedAnError(layerConfig: TypeLayerEntryConfig): boolean {
    if (this.metadata?.supportsDynamicLayers === false) {
      // Log a warning, but continue
      logger.logWarning(`Layer ${layerConfig.layerPath} does not technically support dynamic layers per its metadata.`);
    }
    return false;
  }

  /**
   * Creates a configuration object for a Esri Dynamic layer.
   * This function constructs a `TypeEsriDynamicLayerConfig` object that describes an Esri Dynamic layer
   * and its associated entry configurations based on the provided parameters.
   * @param {string} geoviewLayerId - A unique identifier for the GeoView layer.
   * @param {string} geoviewLayerName - The display name of the GeoView layer.
   * @param {string} metadataAccessPath - The URL or path to access metadata.
   * @param {boolean} isTimeAware - Indicates whether the layer supports time-based filtering.
   * @param {TypeJsonArray} layerEntries - An array of layer entries objects to be included in the configuration.
   * @returns {TypeEsriDynamicLayerConfig} The constructed configuration object for the Esri Dynamic layer.
   */
  static createEsriDynamicLayerConfig(
    geoviewLayerId: string,
    geoviewLayerName: string,
    metadataAccessPath: string,
    isTimeAware: boolean,
    layerEntries: TypeJsonArray,
    customGeocoreLayerConfig: TypeJsonObject
  ): TypeEsriDynamicLayerConfig {
    const geoviewLayerConfig: TypeEsriDynamicLayerConfig = {
      geoviewLayerId,
      geoviewLayerName,
      metadataAccessPath,
      geoviewLayerType: CONST_LAYER_TYPES.ESRI_DYNAMIC,
      isTimeAware,
      listOfLayerEntryConfig: [],
    };
    geoviewLayerConfig.listOfLayerEntryConfig = layerEntries.map((layerEntry) => {
      const layerEntryConfig = {
        geoviewLayerConfig,
        schemaTag: CONST_LAYER_TYPES.ESRI_DYNAMIC,
        entryType: CONST_LAYER_ENTRY_TYPES.RASTER_IMAGE,
        layerId: layerEntry.index as string,
        source: {
          dataAccessPath: metadataAccessPath,
        },
      };

      // Overwrite default from geocore custom config
      const mergedConfig = deepMergeObjects(layerEntryConfig as unknown as TypeJsonObject, customGeocoreLayerConfig);

      // Reconstruct
      return new EsriDynamicLayerEntryConfig(mergedConfig as unknown as EsriDynamicLayerEntryConfig);
    });

    // Return it
    return geoviewLayerConfig;
  }
}

/**
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

/**
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
