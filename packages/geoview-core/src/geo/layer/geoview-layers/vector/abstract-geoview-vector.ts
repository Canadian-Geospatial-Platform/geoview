import type Feature from 'ol/Feature';
import type { Options as SourceOptions } from 'ol/source/Vector';
import { all, bbox } from 'ol/loadingstrategy';
import type { Projection as OLProjection } from 'ol/proj';
import type { Extent } from 'ol/extent';
import { getUid } from 'ol/util';
import type { ReadOptions } from 'ol/format/Feature';

import type { TypeOutfields } from '@/api/types/map-schema-types';
import type { TypePostSettings } from '@/api/types/layer-schema-types';
import type { VectorLayerEntryConfig } from '@/api/config/validation-classes/vector-layer-entry-config';
import { AbstractGeoViewLayer } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { GVVectorSource } from '@/geo/layer/source/vector-source';
import { DateMgt } from '@/core/utils/date-mgt';
import { logger } from '@/core/utils/logger';
import { Fetch } from '@/core/utils/fetch-helper';
import { formatError } from '@/core/exceptions/core-exceptions';

/**
 * The AbstractGeoViewVector class.
 */
export abstract class AbstractGeoViewVector extends AbstractGeoViewLayer {
  /** The maximum delay to wait before we warn about the features fetch taking a long time */
  static readonly DEFAULT_WAIT_SLOW_FETCH_WARNING = 15 * 1000; // 15 seconds

  // GV Order of these keywords matter, preference will be given in this order
  static readonly EXCLUDED_HEADERS_LAT = ['latitude', 'lat', 'y', 'ycoord', 'latitude|latitude', 'latitude | latitude'];
  static readonly EXCLUDED_HEADERS_LNG = ['longitude', 'lon', 'x', 'xcoord', 'longitude|longitude', 'longitude | longitude'];
  static readonly EXCLUDED_HEADERS_GEN = ['geometry', 'geom'];
  static readonly EXCLUDED_HEADERS_STYLE = ['styleUrl'];
  static readonly EXCLUDED_HEADERS = this.EXCLUDED_HEADERS_LAT.concat(this.EXCLUDED_HEADERS_LNG)
    .concat(this.EXCLUDED_HEADERS_GEN)
    .concat(this.EXCLUDED_HEADERS_STYLE);

  static readonly NAME_FIELD_KEYWORDS = ['^name$', '^title$', '^label$'];
  static readonly MAX_ESRI_FEATURES = 200000;

  // #region OVERRIDES

  /**
   * Mustoverride function to load vector features for a layer during vector source creation.
   * This abstract method defines the contract for retrieving and converting
   * raw vector data into OpenLayers {@link Feature} instances. Concrete subclasses
   * must implement the logic required to fetch data from the underlying service
   * (e.g. WFS, GeoJSON, CSV) and transform it into features compatible with the
   * vector source.
   * The returned features are typically added to the vector source as part of
   * its initialization or loading lifecycle.
   * @param {VectorLayerEntryConfig} layerConfig -
   * The configuration object describing the vector layer, including its
   * data source and access parameters.
   * @param {SourceOptions<Feature>} sourceOptions -
   * The OpenLayers vector source options associated with the layer. This may be
   * used by implementations to customize loading behavior or source configuration.
   * @param {ReadOptions} readOptions -
   * Options controlling how features are read, including the target
   * `featureProjection`.
   * @returns {Promise<Feature[]>}
   * A promise that resolves to an array of OpenLayers features created from
   * the underlying data source.
   * @protected
   * @abstract
   */
  protected abstract onCreateVectorSourceLoadFeatures(
    layerConfig: VectorLayerEntryConfig,
    sourceOptions: SourceOptions<Feature>,
    readOptions: ReadOptions
  ): Promise<Feature[]>;

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
   * @returns {GVVectorSource} The source configuration that will be used to create the vector layer.
   */
  protected onCreateVectorSource(layerConfig: VectorLayerEntryConfig, sourceOptions: SourceOptions<Feature>): GVVectorSource {
    // If any attributions
    if (layerConfig.getAttributions()?.length || 0 > 0) {
      // eslint-disable-next-line no-param-reassign
      sourceOptions.attributions = layerConfig.getAttributions();
    }

    // Prepare the sourceOptions
    // eslint-disable-next-line prefer-const
    let vectorSource: GVVectorSource;

    // Set loading strategy option
    // eslint-disable-next-line no-param-reassign
    sourceOptions.strategy = layerConfig.getSource().strategy === 'bbox' ? bbox : all;

    // ESlint override about misused-promises, because we're using async in the loader callback instead of returning void, no worries in the end.
    // eslint-disable-next-line no-param-reassign, @typescript-eslint/no-misused-promises
    sourceOptions.loader = async (extent: Extent, resolution: number, projection: OLProjection, successCallback, failureCallback) => {
      try {
        // Clear last error if any
        vectorSource.clearLoaderError();

        // The read options
        const options: ReadOptions = { dataProjection: layerConfig.getSource().dataProjection, featureProjection: projection, extent };

        // Grab the features to load in the source
        const features = await this.onCreateVectorSourceLoadFeatures(layerConfig, sourceOptions, options);

        // Parse the feature metadata
        AbstractGeoViewVector.#processFeatureMetadata(features, layerConfig);

        // Normalize the date fields
        this.#normalizeDateFields(features, layerConfig);

        // If the strategy is 'bbox'
        if (sourceOptions.strategy === bbox) {
          // Clear the previously fetched features or they'll get stacked up.
          // GV Do this right before readding features so that the features flicker as less as possible on the map
          vectorSource.clear(true);
        }

        // Add the features in the source
        vectorSource.addFeatures(features);

        // Call the success callback with the features. This will trigger the onLoaded callback on the layer object (though it
        // seems not to call it everytime, OL issue? if issue persists, maybe we want to setLayerStatus to loaded here?)
        successCallback?.(features);
      } catch (error: unknown) {
        // Set the error
        vectorSource.setLoaderError(formatError(error));

        // Call the failed callback, this will trigger the onError callback on the layer object (which will put the layerStatus to error)
        // and this will remove the failed extent so that OpenLayers may retry loading it later.
        failureCallback?.();
      }
    };

    // Create the vector source with the source options
    vectorSource = new GVVectorSource(sourceOptions);

    // Return the vector source which is still being loaded asynchronously
    return vectorSource;
  }

  // #endregion OVERRIDES

  // #region METHODS

  /**
   * Creates a VectorSource from a layer config.
   * @param {VectorTilesLayerEntryConfig} layerConfig - Configuration object for the vector tile layer.
   * @returns An initialized VectorSource ready for use in a layer.
   */
  createVectorSource(layerConfig: VectorLayerEntryConfig): GVVectorSource {
    // Redirect
    return this.onCreateVectorSource(layerConfig, {});
  }

  /**
   * Normalizes all date fields in the provided features to a standard millisecond timestamp format.
   * @param {Feature[]} features - The features whose date fields should be normalized.
   * @param {VectorLayerEntryConfig} layerConfig - The layer configuration containing metadata about the date fields.
   * @private
   */
  #normalizeDateFields(features: Feature[], layerConfig: VectorLayerEntryConfig): void {
    // Get all fields declared as type 'date' in the feature info config
    const dateFields = layerConfig.getOutfields()?.filter((f) => f.type === 'date');
    if (!dateFields?.length) return;

    // Iterate over each feature to normalize its date fields
    features.forEach((feature) => {
      dateFields.forEach((field) => {
        const value = feature.get(field.name);

        // If the value is already a number, treat it as a timestamp and reformat
        if (typeof value === 'number') {
          const dateStr = DateMgt.applyInputDateFormat(DateMgt.convertMilisecondsToDate(value), this.getServerDateFragmentsOrder());
          feature.set(field.name, DateMgt.convertToMilliseconds(dateStr), true);
        } else {
          // If the value is a string, determine or reuse the date fragment order
          this.initServerDateFragmentsOrderFromServiceDateFormat(DateMgt.deduceDateFormat(value));
          const dateStr = DateMgt.applyInputDateFormat(value, this.getServerDateFragmentsOrder());
          feature.set(field.name, DateMgt.convertToMilliseconds(dateStr), true);
        }
      });
    });
  }

  // #endregion METHODS

  // #region STATIC METHODS

  /**
   * Fetches text data from the given URL using settings defined in the vector source configuration.
   * Supports both GET and POST requests depending on the presence of `postSettings`.
   * @param {string} url - The URL to fetch data from.
   * @param {TypePostSettings} [postSettings] - The possible POST settings from the layer config.
   * @returns {Promise<string>} A promise that resolves to the fetched text response.
   * @static
   */
  static fetchText(url: string, postSettings?: TypePostSettings): Promise<string> {
    // Default to a GET request
    const fetchOptions: RequestInit = { method: 'GET' };

    // If postSettings are defined, switch to POST and include headers and body
    if (postSettings) {
      fetchOptions.method = 'POST';
      fetchOptions.headers = postSettings.header;
      fetchOptions.body = JSON.stringify(postSettings.data);
    }

    // Execute the fetch using the provided options and return the response text
    return Fetch.fetchText(url, fetchOptions);
  }

  /**
   * Fetches json data from the given URL using settings defined in the vector source configuration.
   * Supports both GET and POST requests depending on the presence of `postSettings`.
   * @param {string} url - The URL to fetch data from.
   * @param {TypePostSettings} [postSettings] - The possible POST settings from the layer config.
   * @returns {Promise<string>} A promise that resolves to the fetched text response.
   * @static
   */
  static fetchJson(url: string, postSettings?: TypePostSettings): Promise<unknown> {
    // Default to a GET request
    const fetchOptions: RequestInit = { method: 'GET' };

    // If postSettings are defined, switch to POST and include headers and body
    if (postSettings) {
      fetchOptions.method = 'POST';
      fetchOptions.headers = postSettings.header;
      fetchOptions.body = JSON.stringify(postSettings.data);
    }

    // Execute the fetch using the provided options and return the response text
    return Fetch.fetchJson(url, fetchOptions);
  }

  /**
   * This method sets the outfields and aliasFields of the source feature info.
   *
   * @param {string[]} headers - An array of field names.
   * @param {string[]} firstRow - The first row of data.
   * @param {string[]} excludedHeaders - The headers to exclude from feature info.
   * @param {VectorLayerEntryConfig} layerConfig The vector layer entry to configure.
   * @private
   * @static
   */
  protected static processFeatureInfoConfig(
    headers: string[],
    firstRow: string[],
    excludedHeaders: string[],
    layerConfig: VectorLayerEntryConfig
  ): void {
    // Get the outfields
    let outfields = layerConfig.getOutfields();

    // Process undefined outfields or aliasFields
    if (!outfields?.length) {
      // Create it
      outfields = [];

      // Loop
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
          outfields!.push(newOutfield);
        }
      });

      // Set it
      layerConfig.setOutfields(outfields);
    }

    // Initialize the aliases
    layerConfig.initOutfieldsAliases();

    // If no name field
    const nameField = layerConfig.getNameField();
    if (!nameField) {
      // Try to set nameField to a name field
      const newNameField = this.NAME_FIELD_KEYWORDS.reduce<TypeOutfields | undefined>((found, keyword) => {
        if (found) return found;
        return outfields.find((field) => {
          return new RegExp(keyword, 'i').test(field.name);
        });
      }, undefined);

      // Set the name field to the first attribute by default if no nameField is specified already
      layerConfig.initNameField(newNameField?.name ?? outfields?.[0]?.name);
    }

    // Vector layer only queryable if there are fields
    layerConfig.initQueryableSource(outfields.length > 0);
  }

  /**
   * Processes metadata for a set of features by assigning unique IDs and initializing feature info configuration if needed.
   * @param {Feature[]} features - The array of vector features to process.
   * @param {VectorLayerEntryConfig} layerConfig - The configuration object for the vector layer.
   * @private
   * @static
   */
  static #processFeatureMetadata(features: Feature[], layerConfig: VectorLayerEntryConfig): void {
    // Process feature info from config using the first feature properties.
    // GV This is essentially a second attempt to fill the outFields and various feature info
    // GV information in case those weren't initialized with the metadata and are still missing
    if (features.length > 0) {
      const sample = features[0];
      const props = sample.getProperties();

      // Use the sample feature's keys and values to infer featureInfo configuration, excluding any blacklisted headers.
      this.processFeatureInfoConfig(Object.keys(props), Object.values(props), this.EXCLUDED_HEADERS, layerConfig);
    }

    // Get the field name that uniquely identifies each feature (OID) from the layer configuration.
    // TODO: Check - OBJECTID should likely not be sent here by default for an abstract-geoview-vector class which
    // TO.DOCONT: might very well not be Esri based (leaving it as it was for now, because #getEsriOidField (replaced) was doing this).
    const oidField = layerConfig.getOutfieldsPKNameOrDefault('OBJECTID');

    // Assign a unique ID to each feature using the OID field if available, otherwise fall back to OpenLayers' getUid().
    features.forEach((feature) => {
      const id = feature.get(oidField) ?? getUid(feature);
      feature.setId(id);
    });
  }

  // #endregion STATIC METHODS
}
