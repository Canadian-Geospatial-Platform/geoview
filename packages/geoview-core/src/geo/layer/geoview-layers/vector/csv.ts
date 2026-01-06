import { Feature } from 'ol';
import { Point } from 'ol/geom';
import type { ReadOptions } from 'ol/format/Feature';
import type { Projection as OLProjection, ProjectionLike } from 'ol/proj';
import type { Options as SourceOptions } from 'ol/source/Vector';

import type { ConfigBaseClass, TypeLayerEntryShell } from '@/api/config/validation-classes/config-base-class';
import { AbstractGeoViewLayer } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { AbstractGeoViewVector } from '@/geo/layer/geoview-layers/vector/abstract-geoview-vector';
import type { TypeGeoviewLayerConfig } from '@/api/types/layer-schema-types';
import { CONST_LAYER_TYPES } from '@/api/types/layer-schema-types';
import { CsvLayerEntryConfig } from '@/api/config/validation-classes/vector-validation-classes/csv-layer-entry-config';
import type { VectorLayerEntryConfig } from '@/api/config/validation-classes/vector-layer-entry-config';
import { GVCSV } from '@/geo/layer/gv-layers/vector/gv-csv';
import { Projection } from '@/geo/utils/projection';
import { LayerNoGeographicDataInCSVError } from '@/core/exceptions/layer-exceptions';
import { logger } from '@/core/utils/logger';

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
  // The constructor is not useless, it narrows down the accepted parameter type.
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(layerConfig: TypeCSVLayerConfig) {
    super(layerConfig);
  }

  // #region OVERRIDES

  /**
   * Overrides the way a geoview layer config initializes its layer entries.
   * @returns {Promise<TypeGeoviewLayerConfig>} A promise resolved once the layer entries have been initialized.
   */
  protected override onInitLayerEntries(): Promise<TypeGeoviewLayerConfig> {
    // Get the folder url
    const idx = this.getMetadataAccessPath().lastIndexOf('/');
    const rootUrl = this.getMetadataAccessPath().substring(0, idx);
    const id = this.getMetadataAccessPath().substring(idx + 1);

    // Redirect
    return Promise.resolve(CSV.createGeoviewLayerConfig(this.getGeoviewLayerId(), this.getGeoviewLayerName(), rootUrl, false, [{ id }]));
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
   * Overrides the loading of the vector features for the layer by fetching CSV data and converting it
   * into OpenLayers {@link Feature} feature instances.
   * @param {VectorLayerEntryConfig} layerConfig -
   * The configuration object for the vector layer, containing source and
   * data access information.
   * @param {SourceOptions<Feature>} sourceOptions -
   * The OpenLayers vector source options associated with the layer. This may be
   * used by implementations to customize loading behavior or source configuration.
   * @param {ReadOptions} readOptions -
   * Options controlling how features are read, including the target
   * `featureProjection`.
   * @returns {Promise<Feature[]>}
   * A promise that resolves to an array of OpenLayers features.
   * @protected
   * @override
   */
  protected override async onCreateVectorSourceLoadFeatures(
    layerConfig: VectorLayerEntryConfig,
    sourceOptions: SourceOptions<Feature>,
    readOptions: ReadOptions
  ): Promise<Feature[]> {
    // Query
    const responseData = await AbstractGeoViewVector.fetchText(layerConfig.getDataAccessPath(false), layerConfig.getSource().postSettings);

    // Attempt to convert CSV text to OpenLayers features
    return CSV.convertCsv(responseData, layerConfig as CsvLayerEntryConfig, readOptions.featureProjection);
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

  // #endregion OVERRIDES

  // #region STATIC METHODS

  /**
   * Initializes a GeoView layer configuration for a CSV layer.
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
    const myLayer = new CSV({ geoviewLayerId, geoviewLayerName, metadataAccessPath, isTimeAware } as TypeCSVLayerConfig);
    return myLayer.initGeoViewLayerEntries();
  }

  /**
   * Creates a configuration object for a CSV Feature layer.
   * This function constructs a `TypeCSVLayerConfig` object that describes a CSV Feature layer
   * and its associated entry configurations based on the provided parameters.
   * @param {string} geoviewLayerId - A unique identifier for the GeoView layer.
   * @param {string} geoviewLayerName - The display name of the GeoView layer.
   * @param {string} metadataAccessPath - The URL or path to access metadata or feature data.
   * @param {boolean | undefined} isTimeAware - Indicates whether the layer supports time-based filtering.
   * @param {TypeLayerEntryShell[]} layerEntries - An array of layer entries objects to be included in the configuration.
   * @returns {TypeCSVLayerConfig} The constructed configuration object for the CSV Feature layer.
   * @static
   */
  static createGeoviewLayerConfig(
    geoviewLayerId: string,
    geoviewLayerName: string,
    metadataAccessPath: string,
    isTimeAware: boolean | undefined,
    layerEntries: TypeLayerEntryShell[]
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
        layerId: `${layerEntry.id}`,
        layerName: layerEntry.layerName || (layerEntries.length === 1 ? geoviewLayerName : `${layerEntry.id}`),
      });
      return layerEntryConfig;
    });

    // Return it
    return geoviewLayerConfig;
  }

  /**
   * Processes a CSV GeoviewLayerConfig and returns a promise
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
   * @static
   */
  static processGeoviewLayerConfig(
    geoviewLayerId: string,
    geoviewLayerName: string,
    url: string,
    layerIds: string[],
    isTimeAware: boolean
  ): Promise<ConfigBaseClass[]> {
    // Create the Layer config
    const layerConfig = CSV.createGeoviewLayerConfig(
      geoviewLayerId,
      geoviewLayerName,
      url,
      isTimeAware,
      layerIds.map((layerId) => {
        return { id: layerId };
      })
    );

    // Create the class from geoview-layers package
    const myLayer = new CSV(layerConfig);

    // Process it
    return AbstractGeoViewLayer.processConfig(myLayer);
  }

  /**
   * Converts csv text to feature array.
   * @param {string} csvData - The data from the .csv file.
   * @param {CsvLayerEntryConfig} layerConfig - The config of the layer.
   * @param {ProjectionLike} outProjection - The output projection for the features.
   * @returns {Feature[]} The array of features.
   * @private
   * @static
   */
  static convertCsv(csvData: string, layerConfig: CsvLayerEntryConfig, outProjection: ProjectionLike): Feature[] {
    const inProjection: string = layerConfig.getSource().dataProjection || Projection.PROJECTION_NAMES.LONLAT; // default: LONLAT
    const inProjectionConv: OLProjection = Projection.getProjectionFromString(inProjection);
    const outProjectionConv: OLProjection = Projection.getProjectionFromString(outProjection);

    const features: Feature[] = [];
    let latIndex: number | undefined;
    let lonIndex: number | undefined;
    const csvRows = this.#csvStringToArray(csvData, layerConfig.getSource().separator || ',');
    const headers: string[] = csvRows[0];
    for (let i = 0; i < headers.length; i++) {
      if (this.EXCLUDED_HEADERS_LAT.includes(headers[i].toLowerCase())) latIndex = i;
      if (this.EXCLUDED_HEADERS_LNG.includes(headers[i].toLowerCase())) lonIndex = i;
    }

    if (latIndex === undefined || lonIndex === undefined) {
      // Failed
      throw new LayerNoGeographicDataInCSVError(layerConfig.layerPath, layerConfig.getLayerNameCascade());
    }

    this.processFeatureInfoConfig(headers, csvRows[1], this.EXCLUDED_HEADERS, layerConfig);

    for (let i = 1; i < csvRows.length; i++) {
      const currentRow = csvRows[i];
      const properties: { [key: string]: string | number } = {};
      for (let j = 0; j < headers.length; j++) {
        if (j !== latIndex && j !== lonIndex && currentRow[j]) {
          properties[headers[j]] = currentRow[j] !== '' && Number(currentRow[j]) ? Number(currentRow[j]) : currentRow[j];
        }
      }

      const lon = currentRow[lonIndex] ? Number(currentRow[lonIndex]) : Infinity;
      const lat = currentRow[latIndex] ? Number(currentRow[latIndex]) : Infinity;
      if (Number.isFinite(lon) && Number.isFinite(lat)) {
        const coordinates =
          inProjectionConv.getCode() !== outProjectionConv.getCode()
            ? Projection.transform([lon, lat], inProjectionConv, outProjectionConv)
            : [lon, lat];
        const feature = new Feature({
          geometry: new Point(coordinates),
          ...properties,
        });
        features.push(feature);
      }
    }

    return features;
  }

  /**
   * Converts csv to array of rows of separated values.
   * @param {string} csvData The raw csv text.
   * @param {string} separator The character used to separate the values.
   * @returns {string[][]} An array of the rows of the csv, split by separator.
   * @private
   * @static
   */
  static #csvStringToArray(csvData: string, separator: string): string[][] {
    const regex = new RegExp(`(\\${separator}|\\r?\\n|\\r|^)(?:"([^"]*(?:""[^"]*)*)"|([^\\${separator}\\r\\n]*))`, 'gi');
    let matches;
    const parsedData: string[][] = [[]];

    // eslint-disable-next-line no-cond-assign
    while ((matches = regex.exec(csvData))) {
      if (matches[1].length && matches[1] !== separator) parsedData.push([]);
      parsedData[parsedData.length - 1].push(matches[2] !== undefined ? matches[2].replace(/""/g, '"') : matches[3]);
    }

    // These characters are removed from the headers as they break the data table filtering (Issue #2693).
    parsedData[0].forEach((header, i) => {
      if (header.includes("'")) logger.logWarning("Header included illegal character (') replaced with (_)");
      parsedData[0][i] = header.replaceAll("'", '_');
      if (header.includes('/')) logger.logWarning('Header included illegal character (/) replaced with (|)');
      parsedData[0][i] = parsedData[0][i].replaceAll('/', '|');
      if (header.includes('+')) logger.logWarning('Header included illegal character (+) replaced with (plus)');
      parsedData[0][i] = parsedData[0][i].replaceAll('+', 'plus');
      if (header.includes('-')) logger.logWarning('Header included illegal character (-) replaced with (_)');
      parsedData[0][i] = parsedData[0][i].replaceAll('-', '_');
      if (header.includes('*')) logger.logWarning('Header included illegal character (*) replaced with (x)');
      parsedData[0][i] = parsedData[0][i].replaceAll('*', 'x');
      if (header.includes('(')) logger.logWarning('Header included illegal character (() replaced with ([)');
      parsedData[0][i] = parsedData[0][i].replaceAll('(', '[');
      if (header.includes(')')) logger.logWarning('Header included illegal character ()) replaced with (])');
      parsedData[0][i] = parsedData[0][i].replaceAll(')', ']');
    });

    return parsedData;
  }

  // #endregion STATIC METHODS
}
