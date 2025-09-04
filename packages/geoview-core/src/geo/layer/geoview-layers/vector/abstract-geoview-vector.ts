import Feature from 'ol/Feature';
import { Vector as VectorSource } from 'ol/source';
import { Options as SourceOptions } from 'ol/source/Vector';
import { all, bbox } from 'ol/loadingstrategy';
import { ReadOptions } from 'ol/format/Feature';
import { Projection as OLProjection, ProjectionLike } from 'ol/proj';
import { Point } from 'ol/geom';
import { Extent } from 'ol/extent';
import { getUid } from 'ol/util';

import {
  CONST_LAYER_TYPES,
  TypeBaseVectorSourceInitialConfig,
  TypeFeatureInfoLayerConfig,
  TypeOutfields,
} from '@/api/config/types/map-schema-types';

import { AbstractGeoViewLayer } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { DateMgt } from '@/core/utils/date-mgt';
import { logger } from '@/core/utils/logger';
import { VectorLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-layer-entry-config';
import { AbstractBaseLayerEntryConfig } from '@/core/utils/config/validation-classes/abstract-base-layer-entry-config';
import { Projection } from '@/geo/utils/projection';
import { Fetch } from '@/core/utils/fetch-helper';
import {
  LayerDataAccessPathMandatoryError,
  LayerNoGeographicDataInCSVError,
  LayerTooManyEsriFeatures,
} from '@/core/exceptions/layer-exceptions';
import { LayerEntryConfigVectorSourceURLNotDefinedError } from '@/core/exceptions/layer-entry-config-exceptions';
import { WkbLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-validation-classes/wkb-layer-entry-config';

// Some constants
const EXCLUDED_HEADERS_LAT = ['latitude', 'lat', 'y', 'ycoord', 'latitude|latitude', 'latitude | latitude'];
const EXCLUDED_HEADERS_LNG = ['longitude', 'lon', 'x', 'xcoord', 'longitude|longitude', 'longitude | longitude'];
const EXCLUDED_HEADERS_GEN = ['geometry', 'geom'];
const EXCLUDED_HEADERS = EXCLUDED_HEADERS_LAT.concat(EXCLUDED_HEADERS_LNG).concat(EXCLUDED_HEADERS_GEN);
// GV Order of these keywords matter, preference will be given in this order
const NAME_FIELD_KEYWORDS = ['^name$', '^title$', '^label$'];
const MAX_ESRI_FEATURES = 200000;

/**
 * The AbstractGeoViewVector class.
 */
export abstract class AbstractGeoViewVector extends AbstractGeoViewLayer {
  /** The maximum delay to wait before we warn about the features fetch taking a long time */
  static readonly DEFAULT_WAIT_SLOW_FETCH_WARNING = 15 * 1000; // 15 seconds

  /**
   * Creates a VectorSource from a layer config.
   * @param {VectorTilesLayerEntryConfig} layerConfig - Configuration object for the vector tile layer.
   * @returns An initialized VectorSource ready for use in a layer.
   */
  createVectorSource(layerConfig: VectorLayerEntryConfig): VectorSource<Feature> {
    // Validate the dataAccessPath exists
    if (!layerConfig.source?.dataAccessPath) {
      // Throw error missing dataAccessPath
      throw new LayerDataAccessPathMandatoryError(layerConfig.layerPath, layerConfig.getLayerName());
    }

    // Redirect
    return this.onCreateVectorSource(layerConfig, {}, {});
  }

  /**
   * Overrides the way the metadata is fetched.
   * Resolves with the Json object or undefined when no metadata is to be expected for a particular layer type.
   * @returns {Promise<T>} A promise with the metadata or undefined when no metadata for the particular layer type.
   */
  protected override onFetchServiceMetadata<T>(): Promise<T> {
    // None
    return Promise.resolve(undefined as T);
  }

  /**
   * Overridable function to create a source configuration for the vector layer.
   * @param {VectorLayerEntryConfig} layerConfig - The layer entry configuration.
   * @param {SourceOptions} sourceOptions - The source options (default: { strategy: all }).
   * @param {ReadOptions} readOptions - The read options (default: {}).
   * @returns {VectorSource<Geometry>} The source configuration that will be used to create the vector layer.
   */
  protected onCreateVectorSource(
    layerConfig: VectorLayerEntryConfig,
    sourceOptions: SourceOptions<Feature>,
    readOptions: ReadOptions
  ): VectorSource<Feature> {
    // If any attributions
    if (layerConfig.getAttributions().length > 0) {
      // eslint-disable-next-line no-param-reassign
      sourceOptions.attributions = layerConfig.getAttributions();
    }

    // Read strategy
    const sourceConfig = layerConfig.source as TypeBaseVectorSourceInitialConfig;
    const strategy = sourceConfig.strategy === 'bbox' ? bbox : all;

    // Prepare the sourceOptions
    let vectorSource: VectorSource<Feature>;

    // Set loading strategy option
    // eslint-disable-next-line no-param-reassign
    sourceOptions.strategy = strategy;

    // ESlint override about misused-promises, because we're using async in the loader callback instead of returning void, no worries in the end.
    // eslint-disable-next-line no-param-reassign, @typescript-eslint/no-misused-promises
    sourceOptions.loader = async (extent: Extent, resolution: number, projection: OLProjection, successCallback, failureCallback) => {
      try {
        let responseText;

        // TODO: Refactor - Here, the url is resolved by eventually grabbing it back from the OpenLayer source object.
        // TO.DOCONT: The url should probably never have been 'set' in the OpenLayer Source in the first place.
        // TO.DOCONT: Refactor this for a cleaner getUrl override per layer type class.
        // TO.DOCONT: Later in here, inside #parseFeatures and inside #getEsriFeatures, there's a url.replace which replaces the
        // TO.DOCONT: 'returnCountOnly=true' that was set in the onCreateVectorSource override. The fact that the source has a url is
        // TO.DOCONT: making us think that it's used when actually it's not. The source.url property is ignored by OpenLayers when the
        // TO.DOCONT: sourceOptions.loader callback is used like in our case here. Code should be rewritten more clearly.
        // Resolve the url
        const url = AbstractGeoViewVector.#resolveUrl(layerConfig, vectorSource, extent, resolution, projection);

        if (layerConfig.schemaTag !== 'WKB') {
          // Fetch the data, or use passed geoJSON if present
          responseText =
            layerConfig.getSchemaTagGeoJSON() && layerConfig.source?.geojson
              ? layerConfig.source.geojson
              : await AbstractGeoViewVector.#fetchData(url, sourceConfig);
        } else responseText = layerConfig.source!.dataAccessPath as string;

        // If Esri Feature
        if (layerConfig.getSchemaTagEsriFeature()) {
          // Check and throw exception if the content actually contains an embedded error
          // (EsriFeature type of response might return an embedded error inside a 200 HTTP OK)
          Fetch.throwIfResponseHasEmbeddedError(responseText);

          // Check if feature count is too large
          if (JSON.parse(responseText).count > MAX_ESRI_FEATURES) {
            this.emitMessage(
              'validation.layer.tooManyEsriFeatures',
              [layerConfig.getLayerName(), JSON.parse(responseText).count],
              'error',
              true
            );

            // Throw
            throw new LayerTooManyEsriFeatures(layerConfig.layerId, layerConfig.getLayerName(), JSON.parse(responseText).count);
          }
        }

        // Parse the result of the fetch to read the features
        const features = await AbstractGeoViewVector.#parseFeatures(
          url,
          responseText,
          layerConfig,
          vectorSource,
          projection,
          extent,
          readOptions
        );

        // If no features read, alright, let's put the layer to loaded right away as it's never going to get loaded otherwise
        if (!features || features.length === 0) {
          successCallback?.([]);
          return;
        }

        // Parse the feature metadata
        AbstractGeoViewVector.#processFeatureMetadata(features, layerConfig);

        // Normalize the date fields
        this.#normalizeDateFields(features, layerConfig);

        // Add the features in the source
        vectorSource.addFeatures(features);

        // Call the success callback with the features. This will trigger the onLoaded callback on the layer object (though it
        // seems not to call it everytime, OL issue? if issue persists, maybe we want to setLayerStatus to loaded here?)
        successCallback?.(features);

        // TODO: Check - Commenting this out, check if it still works
        // Refresh the OL layer
        // this.getOLLayer(layerConfig.layerPath)?.changed();
      } catch (error: unknown) {
        // Log the failure to fetch the vector features
        logger.logError(error);

        // Call the failed callback, this will trigger the onError callback on the layer object (which will put the layerStatus to error)
        // and this will remove the failed extent so that OpenLayers may retry loading it later.
        failureCallback?.();

        // Notify listeners about the error
        // Commenting it for now (2025-05-08), because we are already emitting in the onError callback now
        // this.emitMessage('validation.layer.vectorFeaturesFailed', [layerConfig.layerPath], 'error', true);
      }
    };

    // Create the vector source with the source options
    vectorSource = new VectorSource(sourceOptions);

    // Return the vector source which is still being loaded asynchronously
    return vectorSource;
  }

  /**
   * Parses raw response text into OpenLayers features based on the layer's schema type.
   * Handles CSV, ESRI feature services, and default formats supported by the vector source.
   * @param {string} url - The URL used to retrieve the data (relevant for ESRI_FEATURE schema).
   * @param {string} responseText - The raw text response from the data request.
   * @param {VectorLayerEntryConfig} layerConfig - The configuration object for the layer.
   * @param {VectorSource<Feature>} source - The vector source containing format information for parsing.
   * @param {ProjectionLike} projection - The projection to use when reading features.
   * @param {Extent} extent - The geographic extent associated with the request.
   * @param {ReadOptions} readOptions - Options for controlling how features are read from the data.
   * @returns {Promise<Feature[] | undefined>} A promise resolving to the parsed features or undefined if parsing fails.
   * @private
   */
  static async #parseFeatures(
    url: string,
    responseText: string,
    layerConfig: VectorLayerEntryConfig,
    source: VectorSource<Feature>,
    projection: ProjectionLike,
    extent: Extent,
    readOptions: ReadOptions
  ): Promise<Feature[] | undefined> {
    // TODO: Refactor - Consider changing the return type to Promise<Feature[]>

    switch (layerConfig.getSchemaTag()) {
      case CONST_LAYER_TYPES.CSV:
        // Attempt to convert CSV text to OpenLayers features
        return AbstractGeoViewVector.#convertCsv(responseText, layerConfig, Projection.getProjectionFromString(projection));

      case CONST_LAYER_TYPES.ESRI_FEATURE: {
        // Parse the count of features from the initial ESRI response
        const { count } = JSON.parse(responseText);

        // Determine the maximum number of records allowed
        const maxRecords = layerConfig.getLayerMetadataCasted()?.maxRecordCount;

        // Retrieve the full ESRI feature data
        const esriData = await AbstractGeoViewVector.#getEsriFeatures(url, count, maxRecords);

        // Convert each ESRI response chunk to features and flatten the result
        return esriData.flatMap((json) =>
          source.getFormat()!.readFeatures(json, {
            ...readOptions,
            featureProjection: projection,
            extent,
          })
        );
      }

      case CONST_LAYER_TYPES.WKB: {
        if ((layerConfig as WkbLayerEntryConfig).source.geoPackageFeatures?.length) {
          const { geoPackageFeatures, dataProjection } = (layerConfig as WkbLayerEntryConfig).source;
          const features = geoPackageFeatures!.map(({ geom, properties }) => {
            const feature = source.getFormat()!.readFeatures(geom, {
              ...readOptions,
              dataProjection,
              featureProjection: projection,
            })[0];
            if (properties) feature.setProperties(properties);

            return feature;
          });

          return features;
        }

        return source.getFormat()!.readFeatures(responseText, {
          ...readOptions,
          featureProjection: projection,
          extent,
        });
      }

      default:
        // Fallback to using the format's default read method
        return source.getFormat()!.readFeatures(responseText, {
          ...readOptions,
          featureProjection: projection,
          extent,
        });
    }
  }

  /**
   * Normalizes all date fields in the provided features to a standard millisecond timestamp format.
   * @param {Feature[]} features - The features whose date fields should be normalized.
   * @param {VectorLayerEntryConfig} layerConfig - The layer configuration containing metadata about the date fields.
   * @private
   */
  #normalizeDateFields(features: Feature[], layerConfig: VectorLayerEntryConfig): void {
    // Extract the vector source configuration
    const config = layerConfig.source as TypeBaseVectorSourceInitialConfig;

    // Get all fields declared as type 'date' in the feature info config
    const dateFields = config.featureInfo?.outfields?.filter((f) => f.type === 'date');
    if (!dateFields?.length) return;

    // Iterate over each feature to normalize its date fields
    features.forEach((feature) => {
      dateFields.forEach((field) => {
        const value = feature.get(field.name);

        // If the value is already a number, treat it as a timestamp and reformat
        if (typeof value === 'number') {
          const dateStr = DateMgt.applyInputDateFormat(DateMgt.convertMilisecondsToDate(value), this.serverDateFragmentsOrder);
          feature.set(field.name, DateMgt.convertToMilliseconds(dateStr), true);
        } else {
          // If the value is a string, determine or reuse the date fragment order
          if (!this.serverDateFragmentsOrder) {
            this.serverDateFragmentsOrder = DateMgt.getDateFragmentsOrder(DateMgt.deduceDateFormat(value));
          }

          const dateStr = DateMgt.applyInputDateFormat(value, this.serverDateFragmentsOrder);
          feature.set(field.name, DateMgt.convertToMilliseconds(dateStr), true);
        }
      });
    });
  }

  /**
   * Fetches features from ESRI Feature services with query and feature limits.
   * @param {string} url - The base url for the service.
   * @param {number} featureCount - The number of features in the layer.
   * @param {number} maxRecordCount - The max features per query from the service.
   * @param {number} featureLimit - The maximum number of features to fetch per query.
   * @returns {Promise<unknown[]>} An array of the response text for the features.
   * @private
   */
  // GV: featureLimit ideal amount varies with the service and with maxAllowableOffset.
  // TODO: Add options for featureLimit to config
  // TODO: Will need to move with onCreateVectorSource
  static #getEsriFeatures(url: string, featureCount: number, maxRecordCount?: number, featureLimit: number = 1000): Promise<unknown[]> {
    // Update url
    const baseUrl = url.replace('&returnCountOnly=true', `&outfields=*&geometryPrecision=1&maxAllowableOffset=5`);
    const featureFetchLimit = maxRecordCount && maxRecordCount < featureLimit ? maxRecordCount : featureLimit;

    // GV: Web worker does not improve the performance of this fetching
    // Create array of url's to call
    const urlArray: string[] = [];
    for (let i = 0; i < featureCount; i += featureFetchLimit) {
      urlArray.push(`${baseUrl}&resultOffset=${i}&resultRecordCount=${featureFetchLimit}`);
    }

    // Get array of all the promises
    const promises = urlArray.map((featureUrl) => Fetch.fetchEsriJson(featureUrl));

    // Return the all promise
    return Promise.all(promises);
  }

  /**
   * Resolves the URL for the vector source, potentially calling a function if the URL is dynamic.
   * @param {VectorLayerEntryConfig} layerConfig - The layer entry configuration used by the source.
   * @param {VectorSource<Feature>} source - The vector source from which to resolve the URL.
   * @param {Extent} extent - The geographic extent used in the URL resolution.
   * @param {number} resolution - The resolution of the map view, used for dynamic URL generation.
   * @param {OLProjection} projection - The projection system to be used for the URL resolution.
   * @returns {string} The resolved URL for the vector source.
   * @throws {Error} If the URL cannot be determined.
   * @private
   */
  static #resolveUrl(
    layerConfig: VectorLayerEntryConfig,
    source: VectorSource<Feature>,
    extent: Extent,
    resolution: number,
    projection: OLProjection
  ): string {
    // Get the raw URL from the vector source.
    const rawUrl = source.getUrl();

    // If the raw URL is a function, call it to retrieve the URL, else return the URL as is.
    const url = typeof rawUrl === 'function' ? rawUrl(extent, resolution, projection) : rawUrl;

    // If no URL is found, throw an error.
    if (!url) throw new LayerEntryConfigVectorSourceURLNotDefinedError(layerConfig);

    // Return the resolved URL.
    return url;
  }

  /**
   * Fetches text data from the given URL using settings defined in the vector source configuration.
   * Supports both GET and POST requests depending on the presence of `postSettings`.
   * @param {string} url - The URL to fetch data from.
   * @param {TypeBaseVectorSourceInitialConfig} config - The vector source configuration that may define custom POST settings.
   * @returns {Promise<string>} A promise that resolves to the fetched text response.
   * @private
   */
  static #fetchData(url: string, config: TypeBaseVectorSourceInitialConfig): Promise<string> {
    // Default to a GET request
    const fetchOptions: RequestInit = { method: 'GET' };

    // If postSettings are defined, switch to POST and include headers and body
    if (config.postSettings) {
      fetchOptions.method = 'POST';
      fetchOptions.headers = config.postSettings.header;
      fetchOptions.body = JSON.stringify(config.postSettings.data);
    }

    // Execute the fetch using the provided options and return the response text
    return Fetch.fetchText(url, fetchOptions);
  }

  /**
   * Processes metadata for a set of features by assigning unique IDs and initializing feature info configuration if needed.
   * @param {Feature[]} features - The array of vector features to process.
   * @param {VectorLayerEntryConfig} layerConfig - The configuration object for the vector layer.
   * @private
   */
  static #processFeatureMetadata(features: Feature[], layerConfig: VectorLayerEntryConfig): void {
    // Get the field name that uniquely identifies each feature (OID) from the layer configuration.
    const oidField = AbstractGeoViewVector.#getEsriOidField(layerConfig);

    // Assign a unique ID to each feature using the OID field if available, otherwise fall back to OpenLayers' getUid().
    features.forEach((feature) => {
      const id = feature.get(oidField) ?? getUid(feature);
      feature.setId(id);
    });

    // If the featureInfo config is not defined, generate it from the first feature's properties.
    if (!layerConfig.source?.featureInfo) {
      const sample = features[0];
      const props = sample.getProperties();

      // Use the sample feature's keys and values to infer featureInfo configuration, excluding any blacklisted headers.
      AbstractGeoViewVector.#processFeatureInfoConfig(Object.keys(props), Object.values(props), EXCLUDED_HEADERS, layerConfig);
    }
  }

  /**
   * Converts csv text to feature array.
   * @param {string} csvData The data from the .csv file.
   * @param {VectorLayerEntryConfig} layerConfig The config of the layer.
   * @returns {Feature[]} The array of features.
   * @private
   */
  static #convertCsv(csvData: string, layerConfig: VectorLayerEntryConfig, outProjection: OLProjection): Feature[] | undefined {
    // GV: This function and the below private static ones used to be in the CSV class directly, but something wasn't working with a 'Private element not accessible' error.
    // GV: After moving the code to the mother class, it worked. It'll remain here for now until the config refactoring can take care of it in its re-writing

    const inProjection: string = layerConfig.source!.dataProjection || Projection.PROJECTION_NAMES.LONLAT;
    const inProjectionConv: OLProjection = Projection.getProjectionFromString(inProjection);

    const features: Feature[] = [];
    let latIndex: number | undefined;
    let lonIndex: number | undefined;
    const csvRows = AbstractGeoViewVector.#csvStringToArray(csvData, layerConfig.source!.separator || ',');
    const headers: string[] = csvRows[0];
    for (let i = 0; i < headers.length; i++) {
      if (EXCLUDED_HEADERS_LAT.includes(headers[i].toLowerCase())) latIndex = i;
      if (EXCLUDED_HEADERS_LNG.includes(headers[i].toLowerCase())) lonIndex = i;
    }

    if (latIndex === undefined || lonIndex === undefined) {
      // Failed
      throw new LayerNoGeographicDataInCSVError(layerConfig.layerPath, layerConfig.getLayerName());
    }

    AbstractGeoViewVector.#processFeatureInfoConfig(headers, csvRows[1], EXCLUDED_HEADERS, layerConfig);

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
          inProjectionConv.getCode() !== outProjection.getCode()
            ? Projection.transform([lon, lat], inProjectionConv, outProjection)
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

  /**
   * This method sets the outfields and aliasFields of the source feature info.
   *
   * @param {string[]} headers - An array of field names.
   * @param {string[]} firstRow - The first row of data.
   * @param {string[]} excludedHeaders - The headers to exclude from feature info.
   * @param {VectorLayerEntryConfig} layerConfig The vector layer entry to configure.
   * @private
   */
  static #processFeatureInfoConfig(
    headers: string[],
    firstRow: string[],
    excludedHeaders: string[],
    layerConfig: VectorLayerEntryConfig
  ): void {
    // eslint-disable-next-line no-param-reassign
    if (!layerConfig.source) layerConfig.source = {};
    // eslint-disable-next-line no-param-reassign
    if (!layerConfig.source.featureInfo) layerConfig.source.featureInfo = { queryable: true };

    // Process undefined outfields or aliasFields
    if (!layerConfig.source.featureInfo.outfields?.length) {
      // eslint-disable-next-line no-param-reassign
      if (!layerConfig.source.featureInfo.outfields) layerConfig.source.featureInfo.outfields = [];

      headers.forEach((header, index) => {
        // If not excluded
        if (!excludedHeaders.includes(header)) {
          // Skip complex fields
          if (firstRow[index] && typeof firstRow[index] === 'object' && !Array.isArray(firstRow[index])) {
            logger.logWarning(`Skipping field '${header}' as it is a complex field`);
            return;
          }

          let type = 'string';
          if (firstRow[index] && firstRow[index] !== '' && Number(firstRow[index])) type = 'number';

          const newOutfield: TypeOutfields = {
            name: header,
            alias: header,
            type: type as 'string' | 'number',
            domain: null,
          };
          layerConfig.source!.featureInfo!.outfields!.push(newOutfield);
        }
      });
    }

    layerConfig.source.featureInfo.outfields.forEach((outfield) => {
      // eslint-disable-next-line no-param-reassign
      if (!outfield.alias) outfield.alias = outfield.name;
    });

    // Set name field to first value
    if (!layerConfig.source.featureInfo.nameField) {
      // Try to set nameField to a name field
      const nameField = NAME_FIELD_KEYWORDS.reduce<TypeOutfields | undefined>((found, keyword) => {
        if (found) return found;
        return layerConfig.source!.featureInfo!.outfields!.find((field) => {
          return new RegExp(keyword, 'i').test(field.name);
        });
      }, undefined);

      if (nameField || layerConfig.source?.featureInfo?.outfields?.length)
        // eslint-disable-next-line no-param-reassign
        layerConfig.source.featureInfo.nameField = nameField ? nameField.name : layerConfig.source.featureInfo.outfields[0].name;
    }

    // eslint-disable-next-line no-param-reassign
    if (!layerConfig.source.featureInfo.outfields.length) layerConfig.source.featureInfo.queryable = false;
  }

  /**
   * Gets the Object ID field name from the layer configuration
   * @param {AbstractBaseLayerEntryConfig} layerConfig - The layer configuration object
   * @returns {string} The name of the OID field if found, otherwise returns 'OBJECTID' as default
   * @description Extracts the Object ID field name from the layer configuration. An OID (Object ID) is a
   * standardized identifier used to uniquely identify features in a layer. If no OID field is specified
   * in the configuration, it defaults to 'OBJECTID'.
   * @private
   */
  // TODO: We should have this function in abstract-base-layer to be called like layerConfig.getEsriOidField() - issue 2699
  // TO.DOCONT: This should be renamed without the esri. The oid type should be mandatory and if not present, we should crate one.
  // TO.DOCONT: We already create the internalGeoviewId but we should make this more officiel by assigning a type of oid
  static #getEsriOidField(layerConfig: AbstractBaseLayerEntryConfig): string {
    // Get oid field
    const featureInfo = layerConfig.source?.featureInfo as TypeFeatureInfoLayerConfig;
    const outfields = featureInfo?.outfields;

    if (featureInfo && outfields && outfields.length > 0) {
      const oidField = outfields.find((field) => field.type === 'oid');
      return oidField?.name ?? 'OBJECTID';
    }

    return 'OBJECTID';
  }
}
