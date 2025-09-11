import { Options as SourceOptions } from 'ol/source/Vector';
import { GeoJSON as FormatGeoJSON } from 'ol/format';
import { ReadOptions } from 'ol/format/Feature';
import { Vector as VectorSource } from 'ol/source';
import Feature from 'ol/Feature';

import { AbstractGeoViewVector } from '@/geo/layer/geoview-layers/vector/abstract-geoview-vector';
import { TypeOutfields } from '@/api/config/types/map-schema-types';
import {
  TypeGeoviewLayerConfig,
  CONST_LAYER_TYPES,
  TypeMetadataOGCFeature,
  TypeLayerMetadataQueryables,
  TypeLayerMetadataOGC,
} from '@/api/config/types/layer-schema-types';
import { validateExtentWhenDefined } from '@/geo/utils/utilities';
import { Projection } from '@/geo/utils/projection';
import { OgcFeatureLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-validation-classes/ogc-layer-entry-config';
import { VectorLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-layer-entry-config';
import { Fetch } from '@/core/utils/fetch-helper';
import {
  LayerEntryConfigInvalidLayerEntryConfigError,
  LayerEntryConfigLayerIdNotFoundError,
} from '@/core/exceptions/layer-entry-config-exceptions';
import { GVOGCFeature } from '@/geo/layer/gv-layers/vector/gv-ogc-feature';
import { ConfigBaseClass, TypeLayerEntryShell } from '@/core/utils/config/validation-classes/config-base-class';

export interface TypeOgcFeatureLayerConfig extends Omit<TypeGeoviewLayerConfig, 'listOfLayerEntryConfig' | 'geoviewLayerType'> {
  geoviewLayerType: typeof CONST_LAYER_TYPES.OGC_FEATURE;
  listOfLayerEntryConfig: OgcFeatureLayerEntryConfig[];
}

/**
 * A class to add OGC api feature layer.
 *
 * @exports
 * @class OgcFeature
 */
export class OgcFeature extends AbstractGeoViewVector {
  /**
   * Constructs a OgcFeature Layer configuration processor.
   * @param {TypeOgcFeatureLayerConfig} layerConfig the layer configuration
   */
  // The constructor is not useless, it narrows down the accepted parameter type.
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(layerConfig: TypeOgcFeatureLayerConfig) {
    super(layerConfig);
  }

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   * @override
   * @returns {TypeMetadataOGCFeature | undefined} The strongly-typed layer configuration specific to this layer.
   */
  override getMetadata(): TypeMetadataOGCFeature | undefined {
    return super.getMetadata() as TypeMetadataOGCFeature | undefined;
  }

  /**
   * Overrides the way the metadata is fetched.
   * Resolves with the Json object or undefined when no metadata is to be expected for a particular layer type.
   * @returns {Promise<T = TypeMetadataOGCFeature>} A promise with the metadata or undefined when no metadata for the particular layer type.
   */
  protected override onFetchServiceMetadata<T = TypeMetadataOGCFeature>(): Promise<T> {
    // Fetch it
    return OgcFeature.fetchMetadata(this.metadataAccessPath) as Promise<T>;
  }

  /**
   * Overrides the way a geoview layer config initializes its layer entries.
   * @returns {Promise<TypeGeoviewLayerConfig>} A promise resolved once the layer entries have been initialized.
   */
  protected override async onInitLayerEntries(): Promise<TypeGeoviewLayerConfig> {
    // Get the folder url
    const sep = '/collections/';
    const idx = this.metadataAccessPath.lastIndexOf(sep);
    let rootUrl = this.metadataAccessPath;
    let id: string | undefined;
    let entries: TypeLayerEntryShell[] = [];
    if (idx > 0) {
      rootUrl = this.metadataAccessPath.substring(0, idx);
      id = this.metadataAccessPath.substring(idx + sep.length);
      entries = [{ id }];
    }

    // If no id
    if (!id) {
      // Fetch the metadata
      const metadata = await OgcFeature.fetchMetadata(this.metadataAccessPath);

      // Now that we have metadata
      entries = metadata.collections.map((collection) => {
        return { id: collection.id, layerId: collection.id, layerName: collection.description };
      });
    }

    // Redirect
    // TODO: Check - Check if there's a way to better determine the isTimeAware flag, defaults to false, how is it used here?
    return OgcFeature.createGeoviewLayerConfig(this.geoviewLayerId, this.geoviewLayerName, rootUrl, false, entries);
  }

  /**
   * Overrides the validation of a layer entry config.
   * @param {ConfigBaseClass} layerConfig - The layer entry config to validate.
   */
  protected override onValidateLayerEntryConfig(layerConfig: ConfigBaseClass): void {
    // Note that the code assumes ogc-feature collections does not contains metadata layer group. If you need layer group,
    // you can define them in the configuration section.

    // Get the metadata
    const metadata = this.getMetadata();

    if (Array.isArray(metadata?.collections)) {
      const foundCollection = metadata.collections.find((layerMetadata) => layerMetadata.id === layerConfig.layerId);
      if (!foundCollection) {
        // Add a layer load error
        this.addLayerLoadError(new LayerEntryConfigLayerIdNotFoundError(layerConfig), layerConfig);
        return;
      }

      // If found description, replace the name
      if (foundCollection.description) layerConfig.setLayerName(foundCollection.description);

      // eslint-disable-next-line no-param-reassign
      layerConfig.initialSettings.extent = validateExtentWhenDefined(layerConfig.initialSettings.extent);

      if (!layerConfig.initialSettings.bounds && foundCollection.extent?.spatial?.bbox && foundCollection.extent?.spatial?.crs) {
        const latlonExtent = Projection.transformExtentFromProj(
          foundCollection.extent.spatial.bbox[0],
          Projection.getProjectionFromString(foundCollection.extent.spatial.crs),
          Projection.getProjectionLonLat()
        );
        // eslint-disable-next-line no-param-reassign
        layerConfig.initialSettings.bounds = latlonExtent;
      }

      // eslint-disable-next-line no-param-reassign
      layerConfig.initialSettings.bounds = validateExtentWhenDefined(layerConfig.initialSettings.bounds);
      return;
    }

    // Failed
    throw new LayerEntryConfigInvalidLayerEntryConfigError(layerConfig);
  }

  /**
   * Overrides the way the layer metadata is processed.
   * @param {VectorLayerEntryConfig} layerConfig - The layer entry configuration to process.
   * @returns {Promise<VectorLayerEntryConfig>} A promise that the layer entry configuration has gotten its metadata processed.
   */
  protected override async onProcessLayerMetadata(layerConfig: VectorLayerEntryConfig): Promise<VectorLayerEntryConfig> {
    const metadataUrl = this.metadataAccessPath;
    if (metadataUrl) {
      const queryUrl = metadataUrl.endsWith('/')
        ? `${metadataUrl}collections/${layerConfig.layerId}/queryables?f=json`
        : `${metadataUrl}/collections/${layerConfig.layerId}/queryables?f=json`;
      const queryResultData = await Fetch.fetchJson<TypeLayerMetadataQueryables>(queryUrl);
      if (queryResultData.properties) {
        layerConfig.setLayerMetadata(queryResultData.properties);
        OgcFeature.#processFeatureInfoConfig(queryResultData.properties, layerConfig);
      }
    }

    // Return the layer config
    return layerConfig;
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
    readOptions.dataProjection = layerConfig.source?.dataProjection;
    // eslint-disable-next-line no-param-reassign
    sourceOptions.url = `${layerConfig.source!.dataAccessPath}/collections/${layerConfig.layerId}/items?f=json`;
    // eslint-disable-next-line no-param-reassign
    sourceOptions.format = new FormatGeoJSON();

    // Call parent
    return super.onCreateVectorSource(layerConfig, sourceOptions, readOptions);
  }

  /**
   * Overrides the creation of the GV Layer
   * @param {OgcFeatureLayerEntryConfig} layerConfig - The layer entry configuration.
   * @returns {GVOGCFeature} The GV Layer
   */
  protected override onCreateGVLayer(layerConfig: OgcFeatureLayerEntryConfig): GVOGCFeature {
    // Create the source
    const source = this.createVectorSource(layerConfig);
    // Create the GV Layer
    const gvLayer = new GVOGCFeature(source, layerConfig);
    // Return it
    return gvLayer;
  }

  /**
   * This method sets the outfields and aliasFields of the source feature info.
   *
   * @param {TypeLayerMetadataOGC} fields An array of field names and its aliases.
   * @param {VectorLayerEntryConfig} layerConfig The vector layer entry to configure.
   * @private
   */
  static #processFeatureInfoConfig(fields: TypeLayerMetadataOGC, layerConfig: VectorLayerEntryConfig): void {
    // eslint-disable-next-line no-param-reassign
    if (!layerConfig.source) layerConfig.source = {};
    // eslint-disable-next-line no-param-reassign
    if (!layerConfig.source.featureInfo) layerConfig.source.featureInfo = { queryable: true };

    // Process undefined outfields or aliasFields
    if (!layerConfig.source.featureInfo.outfields?.length) {
      // eslint-disable-next-line no-param-reassign
      if (!layerConfig.source.featureInfo.outfields) layerConfig.source.featureInfo.outfields = [];

      Object.keys(fields).forEach((fieldEntryKey) => {
        if (fields[fieldEntryKey].type === 'Geometry') return;

        if (!fields[fieldEntryKey]) return;
        const fieldEntry = fields[fieldEntryKey];
        if (fieldEntry.type === 'Geometry') return;

        let fieldType = 'string';
        if (fieldEntry.type === 'date') fieldType = 'date';
        else if (['bigint', 'number'].includes(typeof fieldEntry)) fieldType = 'number';

        const newOutfield: TypeOutfields = {
          name: fieldEntryKey,
          alias: fieldEntryKey,
          type: fieldType as 'string' | 'number' | 'date',
          domain: null,
        };
        layerConfig.source!.featureInfo!.outfields!.push(newOutfield);
      });
    }

    layerConfig.source.featureInfo.outfields.forEach((outfield) => {
      // eslint-disable-next-line no-param-reassign
      if (!outfield.alias) outfield.alias = outfield.name;
    });

    // Set name field to first value
    if (!layerConfig.source.featureInfo.nameField) {
      // eslint-disable-next-line no-param-reassign
      layerConfig.source.featureInfo.nameField = layerConfig.source.featureInfo.outfields[0].name;
    }
  }

  /**
   * Fetches the metadata for a typical OGCFeature class.
   * @param {string} url - The url to query the metadata from.
   */
  static fetchMetadata(url: string): Promise<TypeMetadataOGCFeature> {
    // The url
    const queryUrl = url.endsWith('/') ? `${url}collections?f=json` : `${url}/collections?f=json`;

    // Set it
    return Fetch.fetchJson<TypeMetadataOGCFeature>(queryUrl);
  }

  /**
   * Initializes a GeoView layer configuration for an OGC Feature layer.
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
    const myLayer = new OgcFeature({ geoviewLayerId, geoviewLayerName, metadataAccessPath } as TypeOgcFeatureLayerConfig);
    return myLayer.initGeoViewLayerEntries();
  }

  /**
   * Creates a configuration object for an OGC Feature layer.
   * This function constructs a `TypeOgcFeatureLayerConfig` object that describes an OGC Feature layer
   * and its associated entry configurations based on the provided parameters.
   * @param {string} geoviewLayerId - A unique identifier for the GeoView layer.
   * @param {string} geoviewLayerName - The display name of the GeoView layer.
   * @param {string} metadataAccessPath - The URL or path to access metadata or feature data.
   * @param {boolean} isTimeAware - Indicates whether the layer supports time-based filtering.
   * @param {TypeLayerEntryShell[]} layerEntries - An array of layer entries objects to be included in the configuration.
   * @returns {TypeOgcFeatureLayerConfig} The constructed configuration object for the OGC Feature layer.
   */
  static createGeoviewLayerConfig(
    geoviewLayerId: string,
    geoviewLayerName: string,
    metadataAccessPath: string,
    isTimeAware: boolean,
    layerEntries: TypeLayerEntryShell[]
  ): TypeOgcFeatureLayerConfig {
    const geoviewLayerConfig: TypeOgcFeatureLayerConfig = {
      geoviewLayerId,
      geoviewLayerName,
      metadataAccessPath,
      geoviewLayerType: CONST_LAYER_TYPES.OGC_FEATURE,
      isTimeAware,
      listOfLayerEntryConfig: [],
    };
    geoviewLayerConfig.listOfLayerEntryConfig = layerEntries.map((layerEntry) => {
      const layerEntryConfig = new OgcFeatureLayerEntryConfig({
        geoviewLayerConfig,
        layerId: `${layerEntry.id}`,
        layerName: layerEntry.layerName || `${layerEntry.id}`,
      });
      return layerEntryConfig;
    });

    // Return it
    return geoviewLayerConfig;
  }

  /**
   * Processes an OGC Feature GeoviewLayerConfig and returns a promise
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
    const layerConfig = OgcFeature.createGeoviewLayerConfig(
      geoviewLayerId,
      geoviewLayerName,
      url,
      isTimeAware,
      layerIds.map((layerId) => {
        return { id: layerId };
      })
    );

    // Create the class from geoview-layers package
    const myLayer = new OgcFeature(layerConfig);

    // Process it
    return AbstractGeoViewVector.processConfig(myLayer);
  }
}
