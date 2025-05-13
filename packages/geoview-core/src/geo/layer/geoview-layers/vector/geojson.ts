import { Options as SourceOptions } from 'ol/source/Vector';
import { GeoJSON as FormatGeoJSON } from 'ol/format';
import { ReadOptions } from 'ol/format/Feature';
import { Vector as VectorSource } from 'ol/source';
import Feature from 'ol/Feature';

import defaultsDeep from 'lodash/defaultsDeep';

import { AbstractGeoViewVector } from '@/geo/layer/geoview-layers/vector/abstract-geoview-vector';
import {
  TypeLayerEntryConfig,
  TypeVectorSourceInitialConfig,
  TypeGeoviewLayerConfig,
  TypeBaseVectorSourceInitialConfig,
  CONST_LAYER_ENTRY_TYPES,
  CONST_LAYER_TYPES,
} from '@/api/config/types/map-schema-types';
import { validateExtentWhenDefined } from '@/geo/utils/utilities';
import { Cast, TypeJsonArray, TypeJsonObject } from '@/api/config/types/config-types';
import { GeoJSONLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-validation-classes/geojson-layer-entry-config';
import { VectorLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-layer-entry-config';
import { Fetch } from '@/core/utils/fetch-helper';
import { logger } from '@/core/utils/logger';
import {
  LayerEntryConfigInvalidLayerEntryConfigError,
  LayerEntryConfigLayerIdNotFoundError,
} from '@/core/exceptions/layer-entry-config-exceptions';

export interface TypeSourceGeoJSONInitialConfig extends Omit<TypeVectorSourceInitialConfig, 'format'> {
  format: 'GeoJSON';
}

export interface TypeGeoJSONLayerConfig extends Omit<TypeGeoviewLayerConfig, 'listOfLayerEntryConfig'> {
  geoviewLayerType: typeof CONST_LAYER_TYPES.GEOJSON;
  listOfLayerEntryConfig: GeoJSONLayerEntryConfig[];
}

/**
 * Class used to add GeoJSON layer to the map
 *
 * @exports
 * @class GeoJSON
 */
export class GeoJSON extends AbstractGeoViewVector {
  /**
   * Constructs a GeoJSON Layer configuration processor.
   * @param {TypeGeoJSONLayerConfig} layerConfig the layer configuration
   */
  constructor(layerConfig: TypeGeoJSONLayerConfig) {
    super(CONST_LAYER_TYPES.GEOJSON, layerConfig);
  }

  /**
   * Overrides the way the metadata is fetched and set in the 'metadata' property. Resolves when done.
   * @returns {Promise<void>} A promise that the execution is completed.
   */
  protected override async onFetchAndSetServiceMetadata(): Promise<void> {
    // If metadataAccessPath ends with .meta, .json or .geojson
    if (
      this.metadataAccessPath.toLowerCase().endsWith('.meta') ||
      this.metadataAccessPath.toLowerCase().endsWith('.json') ||
      this.metadataAccessPath.toLowerCase().endsWith('.geojson')
    ) {
      // Fetch it
      const metadataJson = await GeoJSON.fetchMetadata(this.metadataAccessPath);

      // Set it
      this.metadata = metadataJson;
    } else {
      // The metadataAccessPath didn't seem like it was containing actual metadata, so it was skipped
      logger.logWarning(
        `The metadataAccessPath '${this.metadataAccessPath}' didn't seem like it was containing actual metadata, so it was skipped`
      );
    }
  }

  /**
   * Overrides the validation of a layer entry config.
   * @param {TypeLayerEntryConfig} layerConfig - The layer entry config to validate.
   */
  protected override onValidateLayerEntryConfig(layerConfig: TypeLayerEntryConfig): void {
    if (Array.isArray(this.metadata?.listOfLayerEntryConfig)) {
      const foundEntry = this.#recursiveSearch(
        `${layerConfig.layerId}${layerConfig.layerIdExtension ? `.${layerConfig.layerIdExtension}` : ''}`,
        Cast<TypeLayerEntryConfig[]>(this.metadata?.listOfLayerEntryConfig)
      );
      if (!foundEntry) {
        // Add a layer load error
        this.addLayerLoadError(new LayerEntryConfigLayerIdNotFoundError(layerConfig), layerConfig);
      }
      return;
    }

    // Throw an invalid layer entry config error
    throw new LayerEntryConfigInvalidLayerEntryConfigError(layerConfig);
  }

  /**
   * Overrides the way the layer metadata is processed.
   * @param {VectorLayerEntryConfig} layerConfig - The layer entry configuration to process.
   * @returns {Promise<VectorLayerEntryConfig>} A promise that the layer entry configuration has gotten its metadata processed.
   */
  protected override onProcessLayerMetadata(layerConfig: VectorLayerEntryConfig): Promise<VectorLayerEntryConfig> {
    if (this.metadata) {
      const layerMetadataFound = this.#recursiveSearch(
        `${layerConfig.layerId}${layerConfig.layerIdExtension ? `.${layerConfig.layerIdExtension}` : ''}`,
        Cast<TypeLayerEntryConfig[]>(this.metadata?.listOfLayerEntryConfig)
      ) as VectorLayerEntryConfig;
      if (layerMetadataFound) {
        // eslint-disable-next-line no-param-reassign
        layerConfig.layerName = layerConfig.layerName || layerMetadataFound.layerName;
        // eslint-disable-next-line no-param-reassign
        layerConfig.source = defaultsDeep(layerConfig.source, layerMetadataFound.source);
        // eslint-disable-next-line no-param-reassign
        layerConfig.initialSettings = defaultsDeep(layerConfig.initialSettings, layerMetadataFound.initialSettings);
        // eslint-disable-next-line no-param-reassign
        layerConfig.layerStyle = defaultsDeep(layerConfig.layerStyle, layerMetadataFound.layerStyle);
        if (layerMetadataFound.maxScale) {
          // eslint-disable-next-line no-param-reassign
          layerConfig.maxScale = Math.min(layerConfig.maxScale || Infinity, layerMetadataFound.maxScale);
        }
        if (layerMetadataFound.minScale) {
          // eslint-disable-next-line no-param-reassign
          layerConfig.minScale = Math.max(layerConfig.minScale || 0, layerMetadataFound.minScale);
        }
        // When the dataAccessPath stored in the layerConfig.source object is equal to the root of the metadataAccessPath with a
        // layerId ending, chances are that it was set by the config-validation because of an empty dataAcessPath value in the config.
        // This situation means that we want to use the dataAccessPath found in the metadata if it is set, otherwise we will keep the
        // config dataAccessPath value.
        let metadataAccessPathRoot = layerConfig.geoviewLayerConfig?.metadataAccessPath;
        if (metadataAccessPathRoot) {
          metadataAccessPathRoot =
            metadataAccessPathRoot.split('/').length > 1 ? metadataAccessPathRoot.split('/').slice(0, -1).join('/') : './';
          const metadataAccessPathRootPlusLayerId = `${metadataAccessPathRoot}/${layerConfig.layerId}`;
          if (metadataAccessPathRootPlusLayerId === layerConfig.source?.dataAccessPath && layerMetadataFound.source?.dataAccessPath) {
            // eslint-disable-next-line no-param-reassign
            layerConfig.source!.dataAccessPath = layerMetadataFound.source!.dataAccessPath;
          }
        }
      }

      // eslint-disable-next-line no-param-reassign
      layerConfig.initialSettings.extent = validateExtentWhenDefined(layerConfig.initialSettings.extent);
    }

    // Setting the layer metadata now with the updated config values. Setting the layer metadata with the config, directly, like it's done in CSV
    layerConfig.setLayerMetadata(layerConfig as unknown as TypeJsonObject);

    // Return the layer config
    return Promise.resolve(layerConfig);
  }

  /**
   * Overrides the creation of the source configuration for the vector layer.
   * @param {VectorLayerEntryConfig} layerConfig The layer entry configuration.
   * @param {SourceOptions} sourceOptions The source options.
   * @param {ReadOptions} readOptions The read options.
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
    sourceOptions.url = layerConfig.source!.dataAccessPath!;
    // eslint-disable-next-line no-param-reassign
    sourceOptions.format = new FormatGeoJSON();

    // Call parent
    return super.onCreateVectorSource(layerConfig, sourceOptions, readOptions);
  }

  /**
   * This method is used to do a recursive search in the array of layer entry config.
   *
   * @param {string} searchKey The layer list to search.
   * @param {TypeLayerEntryConfig[]} metadataLayerList The layer list to search.
   *
   * @returns {TypeLayerEntryConfig | undefined} The found layer or undefined if not found.
   * @private
   */
  #recursiveSearch(searchKey: string, metadataLayerList: TypeLayerEntryConfig[]): TypeLayerEntryConfig | undefined {
    for (const layerMetadata of metadataLayerList) {
      if (searchKey === `${layerMetadata.layerId}${layerMetadata.layerIdExtension ? `.${layerMetadata.layerIdExtension}` : ''}`)
        return layerMetadata;
      if ('isLayerGroup' in layerMetadata && (layerMetadata.isLayerGroup as boolean)) {
        const foundLayer = this.#recursiveSearch(searchKey, layerMetadata.listOfLayerEntryConfig);
        if (foundLayer) return foundLayer;
      }
    }
    return undefined;
  }

  /**
   * Fetches the metadata for a typical GeoJson class.
   * @param {string} url - The url to query the metadata from.
   */
  static fetchMetadata(url: string): Promise<TypeJsonObject> {
    // Return it
    return Fetch.fetchJsonAsObject(url);
  }

  /**
   * Creates a configuration object for a GeoJson Feature layer.
   * This function constructs a `TypeGeoJSONLayerConfig` object that describes an GeoJson Feature layer
   * and its associated entry configurations based on the provided parameters.
   * @param {string} geoviewLayerId - A unique identifier for the GeoView layer.
   * @param {string} geoviewLayerName - The display name of the GeoView layer.
   * @param {string} metadataAccessPath - The URL or path to access metadata or feature data.
   * @param {boolean} isTimeAware - Indicates whether the layer supports time-based filtering.
   * @param {TypeJsonArray} layerEntries - An array of layer entries objects to be included in the configuration.
   * @returns {TypeGeoJSONLayerConfig} The constructed configuration object for the GeoJson Feature layer.
   */
  static createGeoJsonLayerConfig(
    geoviewLayerId: string,
    geoviewLayerName: string,
    metadataAccessPath: string,
    isTimeAware: boolean,
    layerEntries: TypeJsonArray
  ): TypeGeoJSONLayerConfig {
    const geoviewLayerConfig: TypeGeoJSONLayerConfig = {
      geoviewLayerId,
      geoviewLayerName,
      metadataAccessPath,
      geoviewLayerType: CONST_LAYER_TYPES.OGC_FEATURE,
      isTimeAware,
      listOfLayerEntryConfig: [],
    };
    geoviewLayerConfig.listOfLayerEntryConfig = layerEntries.map((layerEntry) => {
      const layerEntryConfig = new GeoJSONLayerEntryConfig({
        geoviewLayerConfig,
        schemaTag: CONST_LAYER_TYPES.GEOJSON,
        entryType: CONST_LAYER_ENTRY_TYPES.VECTOR,
        layerId: layerEntry.id as string,
        source: {
          format: 'GeoJSON',
          dataAccessPath: metadataAccessPath,
        },
      } as GeoJSONLayerEntryConfig);
      return layerEntryConfig;
    });

    // Return it
    return geoviewLayerConfig;
  }
}

/**
 * type guard function that redefines a TypeGeoviewLayerConfig as a TypeGeoJSONLayerConfig if the geoviewLayerType attribute of the
 * verifyIfLayer parameter is GEOJSON. The type ascention applies only to the true block of the if clause that use this
 * function.
 *
 * @param {TypeGeoviewLayerConfig} verifyIfLayer Polymorphic object to test in order to determine if the type ascention is valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const layerConfigIsGeoJSON = (verifyIfLayer: TypeGeoviewLayerConfig): verifyIfLayer is TypeGeoJSONLayerConfig => {
  return verifyIfLayer?.geoviewLayerType === CONST_LAYER_TYPES.GEOJSON;
};

/**
 * type guard function that redefines a TypeLayerEntryConfig as a GeoJSONLayerEntryConfig if the geoviewLayerType attribute of
 * the verifyIfGeoViewEntry.geoviewLayerConfig attribute is GEOJSON. The type ascention applies only to the true block of the if
 * clause that use this function.
 *
 * @param {TypeLayerEntryConfig} verifyIfGeoViewEntry Polymorphic object to test in order to determine if the type ascention is
 * valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const geoviewEntryIsGeoJSON = (verifyIfGeoViewEntry: TypeLayerEntryConfig): verifyIfGeoViewEntry is GeoJSONLayerEntryConfig => {
  return verifyIfGeoViewEntry?.geoviewLayerConfig?.geoviewLayerType === CONST_LAYER_TYPES.GEOJSON;
};
