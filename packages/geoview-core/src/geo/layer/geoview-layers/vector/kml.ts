import type { Options as SourceOptions } from 'ol/source/Vector';
import { KML as FormatKml } from 'ol/format';
import type { Vector as VectorSource } from 'ol/source';
import type Feature from 'ol/Feature';

import { AbstractGeoViewVector } from '@/geo/layer/geoview-layers/vector/abstract-geoview-vector';
import type { TypeGeoviewLayerConfig } from '@/api/types/layer-schema-types';
import { CONST_LAYER_ENTRY_TYPES, CONST_LAYER_TYPES } from '@/api/types/layer-schema-types';
import { KmlLayerEntryConfig } from '@/api/config/validation-classes/vector-validation-classes/kml-layer-entry-config';
import type { VectorLayerEntryConfig } from '@/api/config/validation-classes/vector-layer-entry-config';
import { GVKML } from '@/geo/layer/gv-layers/vector/gv-kml';
import type { ConfigBaseClass, TypeLayerEntryShell } from '@/api/config/validation-classes/config-base-class';

export interface TypeKmlLayerConfig extends Omit<TypeGeoviewLayerConfig, 'listOfLayerEntryConfig'> {
  geoviewLayerType: typeof CONST_LAYER_TYPES.KML;
  listOfLayerEntryConfig: KmlLayerEntryConfig[];
}

/**
 * Class used to add KML layer to the map
 * @exports
 * @class KML
 */
export class KML extends AbstractGeoViewVector {
  /**
   * Constructs a KML Layer configuration processor.
   * @param {TypeKmlLayerConfig} layerConfig the layer configuration
   */
  // The constructor is not useless, it narrows down the accepted parameter type.
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(layerConfig: TypeKmlLayerConfig) {
    super(layerConfig);
  }

  /**
   * Overrides the way a geoview layer config initializes its layer entries.
   * @returns {Promise<TypeGeoviewLayerConfig>} A promise resolved once the layer entries have been initialized.
   */
  protected override async onInitLayerEntries(): Promise<TypeGeoviewLayerConfig> {
    // Get the folder url
    const idx = this.metadataAccessPath.lastIndexOf('/');
    const rootUrl = this.metadataAccessPath.substring(0, idx);
    const id = this.metadataAccessPath.substring(idx + 1);

    // Attempt a fetch of the metadata
    await this.onFetchServiceMetadata();

    // Redirect
    return Promise.resolve(KML.createGeoviewLayerConfig(this.geoviewLayerId, this.geoviewLayerName, rootUrl, false, [{ id }]));
  }

  /**
   * Overrides the way the layer metadata is processed.
   * @param {VectorLayerEntryConfig} layerConfig - The layer entry configuration to process.
   * @returns {Promise<VectorLayerEntryConfig>} A promise that the layer entry configuration has gotten its metadata processed.
   */
  protected override onProcessLayerMetadata(layerConfig: VectorLayerEntryConfig): Promise<VectorLayerEntryConfig> {
    // process the feature info configuration and attach the config to the instance for access by parent class
    layerConfig.setLayerMetadata(layerConfig);

    // Return the layer config
    return Promise.resolve(layerConfig);
  }

  /**
   * Overrides the creation of the source configuration for the vector layer.
   * @param {VectorLayerEntryConfig} layerConfig - The layer entry configuration.
   * @param {SourceOptions} sourceOptions - The source options.
   * @returns {VectorSource<Geometry>} The source configuration that will be used to create the vector layer.
   * @throws {LayerDataAccessPathMandatoryError} When the Data Access Path was undefined, likely because initDataAccessPath wasn't called.
   */
  protected override onCreateVectorSource(
    layerConfig: VectorLayerEntryConfig,
    sourceOptions: SourceOptions<Feature>
  ): VectorSource<Feature> {
    // eslint-disable-next-line no-param-reassign
    sourceOptions.url = layerConfig.getDataAccessPath();
    // eslint-disable-next-line no-param-reassign
    sourceOptions.format = new FormatKml();

    // Call parent
    return super.onCreateVectorSource(layerConfig, sourceOptions);
  }

  /**
   * Overrides the creation of the GV Layer
   * @param {KmlLayerEntryConfig} layerConfig - The layer entry configuration.
   * @returns {GVKML} The GV Layer
   */
  protected override onCreateGVLayer(layerConfig: KmlLayerEntryConfig): GVKML {
    // Create the source
    const source = this.createVectorSource(layerConfig);
    // Create the GV Layer
    const gvLayer = new GVKML(source, layerConfig);
    // Return it
    return gvLayer;
  }

  /**
   * Initializes a GeoView layer configuration for a KML layer.
   * This method creates a basic TypeGeoviewLayerConfig using the provided
   * ID, name, and metadata access path URL. It then initializes the layer entries by calling
   * `initGeoViewLayerEntries`, which may involve fetching metadata or sublayer info.
   * @param {string} geoviewLayerId - A unique identifier for the layer.
   * @param {string} geoviewLayerName - The display name of the layer.
   * @param {string} metadataAccessPath - The full service URL to the layer endpoint.
   * @returns {Promise<TypeGeoviewLayerConfig>} A promise that resolves to an initialized GeoView layer configuration with layer entries.
   */
  static initGeoviewLayerConfig(
    geoviewLayerId: string,
    geoviewLayerName: string,
    metadataAccessPath: string
  ): Promise<TypeGeoviewLayerConfig> {
    // Create the Layer config
    const myLayer = new KML({ geoviewLayerId, geoviewLayerName, metadataAccessPath } as TypeKmlLayerConfig);
    return myLayer.initGeoViewLayerEntries();
  }

  /**
   * Creates a configuration object for a KML Feature layer.
   * This function constructs a `TypeKmlLayerConfig` object that describes an KML Feature layer
   * and its associated entry configurations based on the provided parameters.
   * @param {string} geoviewLayerId - A unique identifier for the GeoView layer.
   * @param {string} geoviewLayerName - The display name of the GeoView layer.
   * @param {string} metadataAccessPath - The URL or path to access metadata or feature data.
   * @param {boolean} isTimeAware - Indicates whether the layer supports time-based filtering.
   * @param {TypeLayerEntryShell[]} layerEntries - An array of layer entries objects to be included in the configuration.
   * @returns {TypeKmlLayerConfig} The constructed configuration object for the KML Feature layer.
   */
  static createGeoviewLayerConfig(
    geoviewLayerId: string,
    geoviewLayerName: string,
    metadataAccessPath: string,
    isTimeAware: boolean,
    layerEntries: TypeLayerEntryShell[]
  ): TypeKmlLayerConfig {
    const geoviewLayerConfig: TypeKmlLayerConfig = {
      geoviewLayerId,
      geoviewLayerName,
      metadataAccessPath,
      geoviewLayerType: CONST_LAYER_TYPES.KML,
      isTimeAware,
      listOfLayerEntryConfig: [],
    };
    geoviewLayerConfig.listOfLayerEntryConfig = layerEntries.map((layerEntry) => {
      const layerEntryConfig = new KmlLayerEntryConfig({
        geoviewLayerConfig,
        schemaTag: CONST_LAYER_TYPES.KML,
        entryType: CONST_LAYER_ENTRY_TYPES.VECTOR,
        layerId: `${layerEntry.id}`,
        layerName: `${layerEntries.length === 1 && !layerEntry.layerName ? geoviewLayerName : layerEntry.layerName || layerEntry.id}`,
        source: {
          format: 'KML',
          dataAccessPath: layerEntry.source?.dataAccessPath,
        },
      });
      return layerEntryConfig;
    });

    // Return it
    return geoviewLayerConfig;
  }

  /**
   * Processes a KML GeoviewLayerConfig and returns a promise
   * that resolves to an array of `ConfigBaseClass` layer entry configurations.
   *
   * This method:
   * 1. Creates a Geoview layer configuration using the provided parameters.
   * 2. Instantiates a layer with that configuration.
   * 3. Processes the layer configuration and returns the result.
   * @param {string} geoviewLayerId - The unique identifier for the GeoView layer.
   * @param {string} geoviewLayerName - The display name for the GeoView layer.
   * @param {string} url - The URL of the service endpoint.
   * @param {string[]} layerIds - An array of layer IDs to include in the configuration.
   * @param {boolean} isTimeAware - Indicates if the layer is time aware.
   * @returns {Promise<ConfigBaseClass[]>} A promise that resolves to an array of layer configurations.
   */
  static processGeoviewLayerConfig(
    geoviewLayerId: string,
    geoviewLayerName: string,
    url: string,
    layerIds: string[],
    isTimeAware: boolean
  ): Promise<ConfigBaseClass[]> {
    // Create the Layer config
    const layerConfig = KML.createGeoviewLayerConfig(
      geoviewLayerId,
      geoviewLayerName,
      url,
      isTimeAware,
      layerIds.map((layerId) => {
        return { id: layerId };
      })
    );

    // Create the class from geoview-layers package
    const myLayer = new KML(layerConfig);

    // Process it
    return AbstractGeoViewVector.processConfig(myLayer);
  }
}
