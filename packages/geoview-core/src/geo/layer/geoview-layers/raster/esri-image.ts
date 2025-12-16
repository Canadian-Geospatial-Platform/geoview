import { ImageArcGISRest } from 'ol/source';
import type { Options as SourceOptions } from 'ol/source/ImageArcGISRest';

import { EsriImageLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/esri-image-layer-entry-config';
import { AbstractGeoViewLayer } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { AbstractGeoViewRaster } from '@/geo/layer/geoview-layers/raster/abstract-geoview-raster';
import type { TypeGeoviewLayerConfig } from '@/api/types/layer-schema-types';
import { CONST_LAYER_TYPES } from '@/api/types/layer-schema-types';

import { EsriUtilities } from '@/geo/layer/geoview-layers/esri-layer-common';
import { GVEsriImage } from '@/geo/layer/gv-layers/raster/gv-esri-image';
import { GVWMS } from '@/geo/layer/gv-layers/raster/gv-wms';
import type { ConfigBaseClass, TypeLayerEntryShell } from '@/api/config/validation-classes/config-base-class';

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
    // TODO: Check - Rework this serviceDateFormat, serverDateFragmentsOrder, externalDateFormat and DateMgt.getDateFragmentsOrder stuff
    // TO.DOCONT: Why are we setting serviceDateFormat to default only in esri dynamic and esri image?
    // TO.DOCONT: I've added getters/setters in ConfigBaseClass in preparation to simplify these dates processing
    // eslint-disable-next-line no-param-reassign
    layerConfig.serviceDateFormat ??= 'DD/MM/YYYY HH:MM:SSZ';
    super(layerConfig);
  }

  // #region OVERRIDES

  /**
   * Overrides the way a geoview layer config initializes its layer entries.
   * @returns {Promise<TypeGeoviewLayerConfig>} A promise resolved once the layer entries have been initialized.
   */
  protected override async onInitLayerEntries(): Promise<TypeGeoviewLayerConfig> {
    // Attempt a fetch of the metadata
    await this.onFetchServiceMetadata();

    // Redirect
    return Promise.resolve(
      EsriImage.createGeoviewLayerConfigSimple(
        this.getGeoviewLayerId(),
        this.getGeoviewLayerName(),
        this.getMetadataAccessPath(),
        this.getGeoviewLayerConfig().isTimeAware
      )
    );
  }

  /**
   * Overrides the way the layer metadata is processed.
   * @param {EsriImageLayerEntryConfig} layerConfig - The layer entry configuration to process.
   * @param {AbortSignal | undefined} [abortSignal] - Abort signal to handle cancelling of fetch.
   * @returns {Promise<EsriImageLayerEntryConfig>} A promise that the layer entry configuration has gotten its metadata processed.
   */
  protected override onProcessLayerMetadata(
    layerConfig: EsriImageLayerEntryConfig,
    abortSignal?: AbortSignal
  ): Promise<EsriImageLayerEntryConfig> {
    return EsriUtilities.commonProcessLayerMetadata(this, layerConfig, abortSignal);
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

  // #endregion OVERRIDES

  // #region STATIC METHODS

  /**
   * Initializes a GeoView layer configuration for an Esri Image layer.
   * This method creates a basic TypeGeoviewLayerConfig using the provided
   * ID, name, and metadata access path URL. It then initializes the layer entries by calling
   * `initGeoViewLayerEntries`, which may involve fetching metadata or sublayer info.
   * @param {string} geoviewLayerId - A unique identifier for the layer.
   * @param {string} geoviewLayerName - The display name of the layer.
   * @param {string} metadataAccessPath - The full service URL to the layer endpoint.
   * @param {boolean?} [isTimeAware] - Indicates whether the layer supports time-based filtering.
   * @returns {Promise<TypeGeoviewLayerConfig>} A promise that resolves to an initialized GeoView layer configuration with layer entries.
   * @static
   */
  static initGeoviewLayerConfig(
    geoviewLayerId: string,
    geoviewLayerName: string,
    metadataAccessPath: string,
    isTimeAware?: boolean
  ): Promise<TypeGeoviewLayerConfig> {
    // Create the Layer config
    const myLayer = new EsriImage({ geoviewLayerId, geoviewLayerName, metadataAccessPath, isTimeAware } as TypeEsriImageLayerConfig);
    return myLayer.initGeoViewLayerEntries();
  }

  /**
   * Creates a configuration object for a Esri Image layer.
   * This function constructs a `TypeEsriImageLayerConfig` object that describes an Esri Image layer
   * and its associated entry configurations based on the provided parameters.
   * @param {string} geoviewLayerId - A unique identifier for the GeoView layer.
   * @param {string} geoviewLayerName - The display name of the GeoView layer.
   * @param {string} metadataAccessPath - The URL or path to access metadata.
   * @param {boolean | undefined} isTimeAware - Indicates whether the layer supports time-based filtering.
   * @returns {TypeEsriImageLayerConfig} The constructed configuration object for the Esri Image layer.
   * @static
   */
  static createGeoviewLayerConfigSimple(
    geoviewLayerId: string,
    geoviewLayerName: string,
    metadataAccessPath: string,
    isTimeAware: boolean | undefined
  ): TypeEsriImageLayerConfig {
    const geoviewLayerConfig: TypeEsriImageLayerConfig = {
      geoviewLayerId,
      geoviewLayerName,
      metadataAccessPath,
      geoviewLayerType: CONST_LAYER_TYPES.ESRI_IMAGE,
      isTimeAware,
      listOfLayerEntryConfig: [],
    };

    let trimmedPath = metadataAccessPath;
    while (trimmedPath.endsWith('/')) {
      trimmedPath = trimmedPath.slice(0, -1);
    }

    geoviewLayerConfig.listOfLayerEntryConfig = [
      new EsriImageLayerEntryConfig({
        geoviewLayerConfig,
        layerId: trimmedPath.split('/').slice(-2, -1)[0],
      }),
    ];

    // Return it
    return geoviewLayerConfig;
  }

  /**
   * Creates a configuration object for a Esri Image layer.
   * This function constructs a `TypeEsriImageLayerConfig` object that describes an Esri Image layer
   * and its associated entry configurations based on the provided parameters.
   * @param {string} geoviewLayerId - A unique identifier for the GeoView layer.
   * @param {string} geoviewLayerName - The display name of the GeoView layer.
   * @param {string} metadataAccessPath - The URL or path to access metadata.
   * @param {boolean | undefined} isTimeAware - Indicates whether the layer supports time-based filtering.
   * @param {TypeLayerEntryShell[]} layerEntries - An array of layer entries objects to be included in the configuration.
   * @returns {TypeEsriImageLayerConfig} The constructed configuration object for the Esri Image layer.
   * @static
   */
  static createGeoviewLayerConfig(
    geoviewLayerId: string,
    geoviewLayerName: string,
    metadataAccessPath: string,
    isTimeAware: boolean | undefined,
    layerEntries: TypeLayerEntryShell[]
  ): TypeEsriImageLayerConfig {
    const geoviewLayerConfig: TypeEsriImageLayerConfig = {
      geoviewLayerId,
      geoviewLayerName,
      metadataAccessPath,
      geoviewLayerType: CONST_LAYER_TYPES.ESRI_IMAGE,
      isTimeAware,
      listOfLayerEntryConfig: [],
    };

    // Recursively map layer entries
    geoviewLayerConfig.listOfLayerEntryConfig = layerEntries.map((layerEntry) => {
      return new EsriImageLayerEntryConfig({
        geoviewLayerConfig: geoviewLayerConfig,
        layerId: `${layerEntry.index || layerEntry.id}`,
        layerName: layerEntry.layerName,
      });
    });

    // Return it
    return geoviewLayerConfig;
  }

  /**
   * Processes an Esri Image GeoviewLayerConfig and returns a promise
   * that resolves to an array of `ConfigBaseClass` layer entry configurations.
   *
   * This method:
   * 1. Creates a Geoview layer configuration using the provided parameters.
   * 2. Instantiates a layer with that configuration.
   * 3. Processes the layer configuration and returns the result.
   * @param {string} geoviewLayerId - The unique identifier for the GeoView layer.
   * @param {string} geoviewLayerName - The display name for the GeoView layer.
   * @param {string} url - The URL of the service endpoint.
   * @param {boolean} isTimeAware - Indicates if the layer is time aware.
   * @returns {Promise<ConfigBaseClass[]>} A promise that resolves to an array of layer configurations.
   * @static
   */
  static processGeoviewLayerConfig(
    geoviewLayerId: string,
    geoviewLayerName: string,
    url: string,
    isTimeAware: boolean
  ): Promise<ConfigBaseClass[]> {
    // Create the Layer config
    const layerConfig = EsriImage.createGeoviewLayerConfigSimple(geoviewLayerId, geoviewLayerName, url, isTimeAware);

    // Create the class from geoview-layers package
    const myLayer = new EsriImage(layerConfig);

    // Process it
    return AbstractGeoViewLayer.processConfig(myLayer);
  }

  /**
   * Creates an ImageArcGISRest source from a layer config.
   * @param {EsriImageLayerEntryConfig} layerConfig - The configuration for the EsriImage layer.
   * @returns A fully configured ImageArcGISRest source.
   * @throws {LayerDataAccessPathMandatoryError} When the Data Access Path was undefined, likely because initDataAccessPath wasn't called.
   * @static
   */
  static createEsriImageSource(layerConfig: EsriImageLayerEntryConfig): ImageArcGISRest {
    const sourceOptions: SourceOptions = {
      url: layerConfig.getDataAccessPath(),
      attributions: layerConfig.getAttributions(),
      params: {
        LAYERS: `show:${layerConfig.layerId}`,
        ...(layerConfig.source.transparent !== undefined && { transparent: layerConfig.source.transparent }),
        ...(layerConfig.source.format && { format: layerConfig.source.format }),
      },
      crossOrigin: layerConfig.source.crossOrigin ?? 'Anonymous',
      projection: layerConfig.source.projection ? `EPSG:${layerConfig.source.projection}` : undefined,
    };

    // Create the source
    const olSource = new ImageArcGISRest(sourceOptions);

    // Apply the filter on the source right away, before the first load
    GVWMS.applyViewFilterOnSource(
      layerConfig,
      olSource,
      undefined,
      layerConfig.getExternalFragmentsOrder(),
      undefined,
      layerConfig.getLayerFilter()
    );

    // Return the source
    return olSource;
  }

  // #endregion STATIC METHODS
}
