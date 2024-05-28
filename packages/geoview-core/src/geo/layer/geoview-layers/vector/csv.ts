/* eslint-disable no-param-reassign */
// We have many reassign for sourceOptions-layerConfig. We keep it global...
import { Options as SourceOptions } from 'ol/source/Vector';
import { GeoJSON as FormatGeoJSON } from 'ol/format';
import { ReadOptions } from 'ol/format/Feature';
import { Vector as VectorSource } from 'ol/source';
import Feature from 'ol/Feature';

import { Point } from 'ol/geom';
import { ProjectionLike } from 'ol/proj';

// import { layerEntryIsGroupLayer } from '@config/types/type-guards';

import { Cast, TypeJsonObject } from '@config/types/config-types';
import { AbstractGeoViewLayer, CONST_LAYER_TYPES } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { AbstractGeoViewVector } from '@/geo/layer/geoview-layers/vector/abstract-geoview-vector';
import { Projection } from '@/geo/utils/projection';
import {
  TypeLayerEntryConfig,
  TypeVectorSourceInitialConfig,
  TypeGeoviewLayerConfig,
  TypeBaseSourceVectorInitialConfig,
  layerEntryIsGroupLayer,
} from '@/geo/map/map-schema-types';
import { api } from '@/app';
import { logger } from '@/core/utils/logger';
import { getLocalizedValue } from '@/core/utils/utilities';
import { CsvLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-validation-classes/csv-layer-entry-config';
import { VectorLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-layer-entry-config';
import { AbstractBaseLayerEntryConfig } from '@/core/utils/config/validation-classes/abstract-base-layer-entry-config';
import { AppEventProcessor } from '@/api/event-processors/event-processor-children/app-event-processor';

// GV: CONFIG EXTRACTION
// GV: This section of code was extracted and copied to the geoview config section
// GV: |||||
// GV: vvvvv

export interface TypeSourceCSVInitialConfig extends Omit<TypeVectorSourceInitialConfig, 'format'> {
  format: 'CSV';
  separator?: ',';
}

export interface TypeCSVLayerConfig extends Omit<TypeGeoviewLayerConfig, 'listOfLayerEntryConfig'> {
  geoviewLayerType: typeof CONST_LAYER_TYPES.CSV;
  listOfLayerEntryConfig: CsvLayerEntryConfig[];
}

/** *****************************************************************************************************************************
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

// GV: ^^^^^
// GV: |||||

/** *****************************************************************************************************************************
 * type guard function that redefines an AbstractGeoViewLayer as a CSV if the type attribute of the verifyIfGeoViewLayer
 * parameter is CSV. The type ascention applies only to the true block of the if clause that use this function.
 *
 * @param {AbstractGeoViewLayer} verifyIfGeoViewLayer Polymorphic object to test in order to determine if the type ascention is
 * valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const geoviewLayerIsCSV = (verifyIfGeoViewLayer: AbstractGeoViewLayer): verifyIfGeoViewLayer is CSV => {
  return verifyIfGeoViewLayer?.type === CONST_LAYER_TYPES.CSV;
};

/** *****************************************************************************************************************************
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

// ******************************************************************************************************************************
// ******************************************************************************************************************************
/** *****************************************************************************************************************************
 * Class used to add CSV layer to the map
 *
 * @exports
 * @class CSV
 */
// ******************************************************************************************************************************
export class CSV extends AbstractGeoViewVector {
  /** ***************************************************************************************************************************
   * Initialize layer
   *
   * @param {string} mapId the id of the map
   * @param {TypeCSVLayerConfig} layerConfig the layer configuration
   */
  constructor(mapId: string, layerConfig: TypeCSVLayerConfig) {
    super(CONST_LAYER_TYPES.CSV, layerConfig, mapId);
  }

  /** ***************************************************************************************************************************
   * CSV has no metadata.
   *
   * @returns {Promise<void>} A promise that the execution is completed.
   */
  protected override fetchServiceMetadata(): Promise<void> {
    // Return resolved promise
    return Promise.resolve();
  }

  /** ***************************************************************************************************************************
   * This method recursively validates the layer configuration entries by filtering and reporting invalid layers. If needed,
   * extra configuration may be done here.
   *
   * @param {TypeLayerEntryConfig[]} listOfLayerEntryConfig The list of layer entries configuration to validate.
   */
  protected validateListOfLayerEntryConfig(listOfLayerEntryConfig: TypeLayerEntryConfig[]): void {
    listOfLayerEntryConfig.forEach((layerConfig: TypeLayerEntryConfig) => {
      const { layerPath } = layerConfig;
      if (layerEntryIsGroupLayer(layerConfig)) {
        this.validateListOfLayerEntryConfig(layerConfig.listOfLayerEntryConfig!);
        if (!layerConfig.listOfLayerEntryConfig.length) {
          this.layerLoadError.push({
            layer: layerPath,
            loggerMessage: `Empty layer group (mapId:  ${this.mapId}, layerPath: ${layerPath})`,
          });
          layerConfig.layerStatus = 'error';
        }
        return;
      }

      // When no metadata are provided, all layers are considered valid.
      if (!this.metadata) return;

      throw new Error(
        `Invalid CSV metadata (listOfLayerEntryConfig) prevent loading of layer (mapId:  ${this.mapId}, layerPath: ${layerPath})`
      );
    });
  }

  /** ***************************************************************************************************************************
   * Metadata is processed when parsing the file.
   *
   * @param {VectorLayerEntryConfig} layerConfig The layer entry configuration to process.
   *
   * @returns {Promise<TypeLayerEntryConfig>} A promise that the vector layer configuration has its metadata processed.
   */
  protected override processLayerMetadata(layerConfig: VectorLayerEntryConfig): Promise<TypeLayerEntryConfig> {
    // process the feature info configuration and attach the config to the instance for access by parent class
    this.setLayerMetadata(layerConfig.layerPath, Cast<TypeJsonObject>(layerConfig));
    return Promise.resolve(layerConfig);
  }

  /** ***************************************************************************************************************************
   * Converts csv to array of rows of separated values.
   *
   * @param {string} csvData The raw csv text.
   * @param {string} separator The character used to separate the values.
   *
   * @returns {string[][]} An array of the rows of the csv, split by separator.
   * @private
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
    return parsedData;
  }

  /** ***************************************************************************************************************************
   * This method sets the outfields and aliasFields of the source feature info.
   *
   * @param {string[]} headers An array of field names.
   * @param {string[]} firstRow The first row of data.
   * @param {number[]} lonLatIndices The index of lon and lat in the array.
   * @param {VectorLayerEntryConfig} layerConfig The vector layer entry to configure.
   * @private
   */
  static #processFeatureInfoConfig(
    headers: string[],
    firstRow: string[],
    lonLatIndices: number[],
    layerConfig: VectorLayerEntryConfig
  ): void {
    if (!layerConfig.source) layerConfig.source = {};
    if (!layerConfig.source.featureInfo) layerConfig.source.featureInfo = { queryable: true };
    // Process undefined outfields or aliasFields ('' = false and !'' = true). Also, if en is undefined, then fr is also undefined.
    // when en and fr are undefined, we set both en and fr to the same value.
    if (!layerConfig.source.featureInfo.outfields?.en || !layerConfig.source.featureInfo.aliasFields?.en) {
      const processOutField = !layerConfig.source.featureInfo.outfields?.en;
      const processAliasFields = !layerConfig.source.featureInfo.aliasFields?.en;
      if (processOutField) {
        layerConfig.source.featureInfo.outfields = { en: '' };
        layerConfig.source.featureInfo.fieldTypes = '';
      }
      if (processAliasFields) layerConfig.source.featureInfo.aliasFields = { en: '' };
      headers.forEach((header) => {
        const index = headers.indexOf(header);
        if (index !== lonLatIndices[0] && index !== lonLatIndices[1]) {
          let type = 'string';
          if (firstRow[index] && firstRow[index] !== '' && Number(firstRow[index])) type = 'number';
          if (processOutField) {
            layerConfig.source!.featureInfo!.outfields!.en = `${layerConfig.source!.featureInfo!.outfields!.en}${header},`;
            layerConfig.source!.featureInfo!.fieldTypes = `${layerConfig.source!.featureInfo!.fieldTypes}${type},`;
          }
          layerConfig.source!.featureInfo!.aliasFields!.en = `${layerConfig.source!.featureInfo!.outfields!.en}${header},`;
        }
      });
      // Remove commas from end of strings
      layerConfig.source.featureInfo!.outfields!.en = layerConfig.source.featureInfo!.outfields?.en?.slice(0, -1);
      layerConfig.source.featureInfo!.fieldTypes = layerConfig.source.featureInfo!.fieldTypes?.slice(0, -1);
      layerConfig.source.featureInfo!.aliasFields!.en = layerConfig.source.featureInfo!.aliasFields?.en?.slice(0, -1);
      layerConfig.source!.featureInfo!.outfields!.fr = layerConfig.source!.featureInfo!.outfields?.en;
      layerConfig.source!.featureInfo!.aliasFields!.fr = layerConfig.source!.featureInfo!.aliasFields?.en;
    }
    if (!layerConfig.source.featureInfo.nameField) {
      const en =
        layerConfig.source.featureInfo!.outfields!.en?.split(',')[0] || layerConfig.source.featureInfo!.outfields!.fr?.split(',')[0];
      const fr = en;
      if (en) layerConfig.source.featureInfo.nameField = { en, fr };
    }
  }

  /** ***************************************************************************************************************************
   * Converts csv text to feature array.
   *
   * @param {string} csvData The data from the .csv file.
   * @param {VectorLayerEntryConfig} layerConfig The config of the layer.
   *
   * @returns {Feature[]} The array of features.
   */
  convertCsv(csvData: string, layerConfig: VectorLayerEntryConfig): Feature[] | null {
    const inProjection: ProjectionLike = layerConfig.source!.dataProjection || Projection.PROJECTION_NAMES.LNGLAT;
    const outProjection: ProjectionLike = this.getMapViewer().getProjection().getCode();
    const latList = ['latitude', 'lat', 'y', 'ycoord', 'latitude/latitude', 'latitude / latitude'];
    const lonList = ['longitude', 'lon', 'x', 'xcoord', 'longitude/longitude', 'longitude / longitude'];

    const features: Feature[] = [];
    let latIndex: number | undefined;
    let lonIndex: number | undefined;
    const csvRows = CSV.#csvStringToArray(csvData, layerConfig.source!.separator || ',');
    const headers: string[] = csvRows[0];
    for (let i = 0; i < headers.length; i++) {
      if (latList.includes(headers[i].toLowerCase())) latIndex = i;
      if (lonList.includes(headers[i].toLowerCase())) lonIndex = i;
    }

    if (latIndex === undefined || lonIndex === undefined) {
      logger.logError(
        `Could not find geographic data for ${getLocalizedValue(this.geoviewLayerName, AppEventProcessor.getDisplayLanguage(this.mapId))}`
      );
      // TODO: find a more centralized way to trap error and display message
      api.maps[this.mapId].notifications.showError(
        `Could not find geographic data for ${getLocalizedValue(this.geoviewLayerName, AppEventProcessor.getDisplayLanguage(this.mapId))}`
      );
      layerConfig.layerStatus = 'error';
      return null;
    }

    CSV.#processFeatureInfoConfig(headers, csvRows[1], [latIndex, lonIndex], layerConfig);

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
        const coordinates = inProjection !== outProjection ? Projection.transform([lon, lat], inProjection, outProjection) : [lon, lat];
        const feature = new Feature({
          geometry: new Point(coordinates),
          ...properties,
        });
        features.push(feature);
      }
    }

    return features;
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
    readOptions.dataProjection = (layerConfig.source as TypeBaseSourceVectorInitialConfig).dataProjection;
    sourceOptions.url = getLocalizedValue(layerConfig.source!.dataAccessPath!, AppEventProcessor.getDisplayLanguage(this.mapId));
    sourceOptions.format = new FormatGeoJSON();
    const vectorSource = super.createVectorSource(layerConfig, sourceOptions, readOptions);
    return vectorSource;
  }
}
