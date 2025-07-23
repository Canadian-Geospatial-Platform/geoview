import { Options as SourceOptions } from 'ol/source/Vector';
import { GeoJSON as FormatGeoJSON } from 'ol/format';
import { ReadOptions } from 'ol/format/Feature';
import { Vector as VectorSource } from 'ol/source';
import Feature from 'ol/Feature';

import { TypeJsonArray, TypeJsonObject } from '@/api/config/types/config-types';
import { AbstractGeoViewVector } from '@/geo/layer/geoview-layers/vector/abstract-geoview-vector';
import {
  TypeVectorSourceInitialConfig,
  TypeGeoviewLayerConfig,
  TypeBaseVectorSourceInitialConfig,
  TypeLayerEntryConfig,
  CONST_LAYER_TYPES,
  CONST_LAYER_ENTRY_TYPES,
} from '@/api/config/types/map-schema-types';
import { CsvLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-validation-classes/csv-layer-entry-config';
import { VectorLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-layer-entry-config';
import { GVCSV } from '@/geo/layer/gv-layers/vector/gv-csv';

export interface TypeSourceCSVInitialConfig extends Omit<TypeVectorSourceInitialConfig, 'format'> {
  format: 'CSV';
  separator?: ',';
}

export interface TypeCSVLayerConfig extends Omit<TypeGeoviewLayerConfig, 'listOfLayerEntryConfig'> {
  geoviewLayerType: typeof CONST_LAYER_TYPES.CSV;
  listOfLayerEntryConfig: CsvLayerEntryConfig[];
}

/**
 * Class used to add a CSV layer to the map
 *
 * @exports
 * @class CSV
 */
export class CSV extends AbstractGeoViewVector {
  /**
   * Constructs a CSV Layer configuration processor.
   * @param {TypeCSVLayerConfig} layerConfig the layer configuration
   */
  constructor(layerConfig: TypeCSVLayerConfig) {
    super(CONST_LAYER_TYPES.CSV, layerConfig);
  }

  /**
   * Overrides the way a geoview layer config initializes its layer entries.
   * @returns {Promise<TypeGeoviewLayerConfig>} A promise resolved once the layer entries have been initialized.
   */
  protected override onInitLayerEntries(): Promise<TypeGeoviewLayerConfig> {
    // Get the folder url
    const idx = this.metadataAccessPath.lastIndexOf('/');
    const rootUrl = this.metadataAccessPath.substring(0, idx);
    const id = this.metadataAccessPath.substring(idx + 1);

    // Redirect
    return Promise.resolve(
      CSV.createCSVLayerConfig(this.geoviewLayerId, this.geoviewLayerName, rootUrl, false, [{ id }] as unknown as TypeJsonArray)
    );
  }

  /**
   * Overrides the way the layer metadata is processed.
   * @param {VectorLayerEntryConfig} layerConfig - The layer entry configuration to process.
   * @returns {Promise<VectorLayerEntryConfig>} A promise that the layer entry configuration has gotten its metadata processed.
   */
  protected override onProcessLayerMetadata(layerConfig: VectorLayerEntryConfig): Promise<VectorLayerEntryConfig> {
    // process the feature info configuration and attach the config to the instance for access by parent class
    layerConfig.setLayerMetadata(layerConfig as unknown as TypeJsonObject);

    // Return the layer config
    return Promise.resolve(layerConfig);
  }

  /**
   * Overrides the creation of the source configuration for the vector layer
   * @param {AbstractBaseLayerEntryConfig} layerConfig - The layer entry configuration.
   * @param {SourceOptions} sourceOptions - The source options.
   * @param {ReadOptions} readOptions - The read options.
   * @returns {VectorSource<Geometry>} The source configuration that will be used to create the vector layer.
   */
  protected override onCreateVectorSource(
    layerConfig: VectorLayerEntryConfig,
    sourceOptions: SourceOptions<Feature>,
    readOptions: ReadOptions
  ): VectorSource<Feature> {
    // eslint-disable-next-line no-param-reassign
    readOptions.dataProjection = (layerConfig.source as TypeBaseVectorSourceInitialConfig).dataProjection;
    // eslint-disable-next-line no-param-reassign
    sourceOptions.url = layerConfig.source!.dataAccessPath;
    // eslint-disable-next-line no-param-reassign
    sourceOptions.format = new FormatGeoJSON();

    // Call parent
    return super.onCreateVectorSource(layerConfig, sourceOptions, readOptions);
  }

  /**
   * Overrides the creation of the GV Layer
   * @param {CsvLayerEntryConfig} layerConfig - The layer entry configuration.
   * @returns {GVCSV} The GV Layer
   */
  protected override onCreateGVLayer(layerConfig: CsvLayerEntryConfig): GVCSV {
    // Create the source
    const source = this.createVectorSource(layerConfig);
    // Create the GV Layer
    const gvLayer = new GVCSV(source, layerConfig);
    // Return it
    return gvLayer;
  }

  /**
   * Initializes a GeoView layer configuration for a CSV layer.
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
    const myLayer = new CSV({ geoviewLayerId, geoviewLayerName, metadataAccessPath } as TypeCSVLayerConfig);
    return myLayer.initGeoViewLayerEntries();
  }

  /**
   * Creates a configuration object for a CSV Feature layer.
   * This function constructs a `TypeCSVLayerConfig` object that describes a CSV Feature layer
   * and its associated entry configurations based on the provided parameters.
   * @param {string} geoviewLayerId - A unique identifier for the GeoView layer.
   * @param {string} geoviewLayerName - The display name of the GeoView layer.
   * @param {string} metadataAccessPath - The URL or path to access metadata or feature data.
   * @param {boolean} isTimeAware - Indicates whether the layer supports time-based filtering.
   * @param {TypeJsonArray} layerEntries - An array of layer entries objects to be included in the configuration.
   * @returns {TypeCSVLayerConfig} The constructed configuration object for the CSV Feature layer.
   */
  static createCSVLayerConfig(
    geoviewLayerId: string,
    geoviewLayerName: string,
    metadataAccessPath: string,
    isTimeAware: boolean,
    layerEntries: TypeJsonArray
  ): TypeCSVLayerConfig {
    const geoviewLayerConfig: TypeCSVLayerConfig = {
      geoviewLayerId,
      geoviewLayerName,
      metadataAccessPath,
      geoviewLayerType: CONST_LAYER_TYPES.CSV,
      isTimeAware,
      listOfLayerEntryConfig: [],
    };
    geoviewLayerConfig.listOfLayerEntryConfig = layerEntries.map((layerEntry) => {
      const layerEntryConfig = new CsvLayerEntryConfig({
        geoviewLayerConfig,
        schemaTag: CONST_LAYER_TYPES.CSV,
        entryType: CONST_LAYER_ENTRY_TYPES.VECTOR,
        layerId: `${layerEntry.id}`,
        layerName: `${layerEntry.layerName || layerEntry.id}`,
        source: {
          dataAccessPath: metadataAccessPath,
        },
      } as CsvLayerEntryConfig);
      return layerEntryConfig;
    });

    // Return it
    return geoviewLayerConfig;
  }
}

/**
 * type guard function that redefines a CsvLayerEntryConfig as a TypeCSVLayerConfig if the geoviewLayerType attribute of the
 * verifyIfLayer parameter is CSV. The type ascention applies only to the true block of the if clause that use this
 * function.
 *
 * @param {TypeGeoviewLayerConfig} verifyIfLayer Polymorphic object to test in order to determine if the type ascention is valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const layerConfigIsCSV = (verifyIfLayer: TypeGeoviewLayerConfig): verifyIfLayer is TypeCSVLayerConfig => {
  return verifyIfLayer?.geoviewLayerType === CONST_LAYER_TYPES.CSV;
};

/**
 * type guard function that redefines a TypeLayerEntryConfig as a TypeCsvLayerEntryConfig if the geoviewLayerType attribute of
 * the verifyIfGeoViewEntry.geoviewLayerConfig attribute is CSV. The type ascention applies only to the true block of the if
 * clause that use this function.
 *
 * @param {TypeLayerEntryConfig} verifyIfGeoViewEntry Polymorphic object to test in order to determine if the type ascention is
 * valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const geoviewEntryIsCSV = (verifyIfGeoViewEntry: TypeLayerEntryConfig): verifyIfGeoViewEntry is CsvLayerEntryConfig => {
  return verifyIfGeoViewEntry?.geoviewLayerConfig?.geoviewLayerType === CONST_LAYER_TYPES.CSV;
};
