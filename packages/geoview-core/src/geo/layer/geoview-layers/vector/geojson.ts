import { Options as SourceOptions } from 'ol/source/Vector';
import { GeoJSON as FormatGeoJSON } from 'ol/format';
import { ReadOptions } from 'ol/format/Feature';
import { Vector as VectorSource } from 'ol/source';
import Feature from 'ol/Feature';

import defaultsDeep from 'lodash/defaultsDeep';

import { AbstractGeoViewVector } from '@/geo/layer/geoview-layers/vector/abstract-geoview-vector';
import {
  TypeLayerEntryConfig,
  TypeGeoviewLayerConfig,
  TypeBaseVectorSourceInitialConfig,
  CONST_LAYER_ENTRY_TYPES,
  CONST_LAYER_TYPES,
  TypeMetadataGeoJSON,
} from '@/api/config/types/map-schema-types';
import { validateExtentWhenDefined } from '@/geo/utils/utilities';
import { GeoJSONLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-validation-classes/geojson-layer-entry-config';
import { VectorLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-layer-entry-config';
import { Fetch } from '@/core/utils/fetch-helper';
import { logger } from '@/core/utils/logger';
import {
  LayerEntryConfigInvalidLayerEntryConfigError,
  LayerEntryConfigLayerIdNotFoundError,
} from '@/core/exceptions/layer-entry-config-exceptions';
import { GVGeoJSON } from '@/geo/layer/gv-layers/vector/gv-geojson';
import { ConfigBaseClass, TypeLayerEntryShell } from '@/core/utils/config/validation-classes/config-base-class';

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
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   * @override
   * @returns {TypeMetadataGeoJSON | undefined} The strongly-typed layer configuration specific to this layer.
   */
  override getMetadata(): TypeMetadataGeoJSON | undefined {
    return super.getMetadata() as TypeMetadataGeoJSON | undefined;
  }

  /**
   * Overrides the way the metadata is fetched.
   * Resolves with the Json object or undefined when no metadata is to be expected for a particular layer type.
   * @returns {Promise<T = TypeMetadataGeoJSON | undefined>} A promise with the metadata or undefined when no metadata for the particular layer type.
   */
  protected override onFetchServiceMetadata<T = TypeMetadataGeoJSON | undefined>(): Promise<T> {
    // If metadataAccessPath ends with .meta, .json or .geojson
    if (
      this.metadataAccessPath.toLowerCase().endsWith('.meta') ||
      this.metadataAccessPath.toLowerCase().endsWith('.json') ||
      this.metadataAccessPath.toLowerCase().endsWith('.geojson')
    ) {
      // Fetch it
      return GeoJSON.fetchMetadata(this.metadataAccessPath) as Promise<T>;
    }

    // The metadataAccessPath didn't seem like it was containing actual metadata, so it was skipped
    logger.logWarning(
      `The metadataAccessPath '${this.metadataAccessPath}' didn't seem like it was containing actual metadata, so it was skipped`
    );

    // None
    return Promise.resolve(undefined) as Promise<T>;
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
    return Promise.resolve(GeoJSON.createGeoJsonLayerConfig(this.geoviewLayerId, this.geoviewLayerName, rootUrl, false, [{ id }]));
  }

  /**
   * Overrides the validation of a layer entry config.
   * @param {ConfigBaseClass} layerConfig - The layer entry config to validate.
   */
  protected override onValidateLayerEntryConfig(layerConfig: ConfigBaseClass): void {
    if (Array.isArray(this.getMetadata()?.listOfLayerEntryConfig)) {
      const foundEntry = this.#recursiveSearch(layerConfig.layerId, this.getMetadata()?.listOfLayerEntryConfig || []);
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
    // Get the metadata
    const metadata = this.getMetadata();

    // If metadata was previously found
    if (metadata) {
      // Search for the layer metadata
      const layerMetadataFound = this.#recursiveSearch(layerConfig.layerId, metadata.listOfLayerEntryConfig) as VectorLayerEntryConfig;

      // If the layer metadata was found
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
            layerConfig.source.dataAccessPath = layerMetadataFound.source.dataAccessPath;
          }
        }
      }

      // eslint-disable-next-line no-param-reassign
      layerConfig.initialSettings.extent = validateExtentWhenDefined(layerConfig.initialSettings.extent);
    }

    // Setting the layer metadata now with the updated config values. Setting the layer metadata with the config, directly, like it's done in CSV
    layerConfig.setLayerMetadata(layerConfig);

    // Return the layer config
    return Promise.resolve(layerConfig);
  }

  /**
   * Overrides the creation of the source configuration for the vector layer.
   * @param {VectorLayerEntryConfig} layerConfig - The layer entry configuration.
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
    sourceOptions.url = layerConfig.source!.dataAccessPath!;
    // eslint-disable-next-line no-param-reassign
    sourceOptions.format = new FormatGeoJSON();

    // Call parent
    return super.onCreateVectorSource(layerConfig, sourceOptions, readOptions);
  }

  /**
   * Overrides the creation of the GV Layer
   * @param {GeoJSONLayerEntryConfig} layerConfig - The layer entry configuration.
   * @returns {GVGeoJSON} The GV Layer
   */
  protected override onCreateGVLayer(layerConfig: GeoJSONLayerEntryConfig): GVGeoJSON {
    // Create the source
    const source = this.createVectorSource(layerConfig);
    // Create the GV Layer
    const gvLayer = new GVGeoJSON(source, layerConfig);
    // Return it
    return gvLayer;
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
      if (searchKey === layerMetadata.layerId) return layerMetadata;
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
  static fetchMetadata(url: string): Promise<TypeMetadataGeoJSON> {
    // Return it
    return Fetch.fetchJson<TypeMetadataGeoJSON>(url);
  }

  /**
   * Initializes a GeoView layer configuration for a GeoJson layer.
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
    const myLayer = new GeoJSON({ geoviewLayerId, geoviewLayerName, metadataAccessPath } as TypeGeoJSONLayerConfig);
    return myLayer.initGeoViewLayerEntries();
  }

  /**
   * Creates a configuration object for a GeoJson Feature layer.
   * This function constructs a `TypeGeoJSONLayerConfig` object that describes an GeoJson Feature layer
   * and its associated entry configurations based on the provided parameters.
   * @param {string} geoviewLayerId - A unique identifier for the GeoView layer.
   * @param {string} geoviewLayerName - The display name of the GeoView layer.
   * @param {string} metadataAccessPath - The URL or path to access metadata or feature data.
   * @param {boolean} isTimeAware - Indicates whether the layer supports time-based filtering.
   * @param {TypeLayerEntryShell[]} layerEntries - An array of layer entries objects to be included in the configuration.
   * @returns {TypeGeoJSONLayerConfig} The constructed configuration object for the GeoJson Feature layer.
   */
  static createGeoJsonLayerConfig(
    geoviewLayerId: string,
    geoviewLayerName: string,
    metadataAccessPath: string,
    isTimeAware: boolean,
    layerEntries: TypeLayerEntryShell[]
  ): TypeGeoJSONLayerConfig {
    const geoviewLayerConfig: TypeGeoJSONLayerConfig = {
      geoviewLayerId,
      geoviewLayerName,
      metadataAccessPath,
      geoviewLayerType: CONST_LAYER_TYPES.GEOJSON,
      isTimeAware,
      listOfLayerEntryConfig: [],
    };
    geoviewLayerConfig.listOfLayerEntryConfig = layerEntries.map((layerEntry) => {
      const layerEntryConfig = new GeoJSONLayerEntryConfig({
        geoviewLayerConfig,
        schemaTag: CONST_LAYER_TYPES.GEOJSON,
        entryType: CONST_LAYER_ENTRY_TYPES.VECTOR,
        layerId: `${layerEntry.id}`,
        layerName: `${layerEntry.layerName || layerEntry.id}`,
        source: {
          format: 'GeoJSON',
          dataAccessPath: metadataAccessPath,
        },
      } as unknown as GeoJSONLayerEntryConfig);
      return layerEntryConfig;
    });

    // Return it
    return geoviewLayerConfig;
  }

  /**
   * Processes a GeoJSON config returning a Promise of an array of ConfigBaseClass layer entry configurations.
   * @returns A Promise with the layer configurations.
   */
  static processGeoJsonLayerConfig(
    geoviewLayerId: string,
    geoviewLayerName: string,
    url: string,
    layerIds: string[]
  ): Promise<ConfigBaseClass[]> {
    // Create the Layer config
    const layerConfig = GeoJSON.createGeoJsonLayerConfig(
      geoviewLayerId,
      geoviewLayerName,
      url,
      false,
      layerIds.map((layerId) => {
        return { id: layerId };
      })
    );

    // Create the class from geoview-layers package
    const myLayer = new GeoJSON(layerConfig);

    // Process it
    return AbstractGeoViewVector.processConfig(myLayer);
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
