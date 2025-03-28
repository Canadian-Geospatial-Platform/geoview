import axios from 'axios';

import { Options as SourceOptions } from 'ol/source/Vector';
import { GeoJSON as FormatGeoJSON } from 'ol/format';
import { ReadOptions } from 'ol/format/Feature';
import { Vector as VectorSource } from 'ol/source';
import Feature from 'ol/Feature';

import { TypeJsonObject } from '@/core/types/global-types';
import { CONST_LAYER_TYPES } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { AbstractGeoViewVector } from '@/geo/layer/geoview-layers/vector/abstract-geoview-vector';
import {
  TypeLayerEntryConfig,
  TypeVectorSourceInitialConfig,
  TypeGeoviewLayerConfig,
  TypeBaseSourceVectorInitialConfig,
} from '@/geo/map/map-schema-types';
import { validateExtentWhenDefined } from '@/geo/utils/utilities';
import { Projection } from '@/geo/utils/projection';
import { OgcFeatureLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-validation-classes/ogc-layer-entry-config';
import { VectorLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-layer-entry-config';
import { AbstractBaseLayerEntryConfig } from '@/core/utils/config/validation-classes/abstract-base-layer-entry-config';
import { TypeOutfields } from '@/api/config/types/map-schema-types';
import { fetchJson } from '@/core/utils/utilities';
import { GeoViewError } from '@/core/exceptions/geoview-exceptions';

export interface TypeSourceOgcFeatureInitialConfig extends TypeVectorSourceInitialConfig {
  format: 'featureAPI';
}

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
   *
   * @param {string} mapId the id of the map
   * @param {TypeOgcFeatureLayerConfig} layerConfig the layer configuration
   */
  constructor(mapId: string, layerConfig: TypeOgcFeatureLayerConfig) {
    super(CONST_LAYER_TYPES.OGC_FEATURE, layerConfig, mapId);
  }

  /**
   * Fetches the metadata for a typical OGCFeature class.
   * @param {string} url - The url to query the metadata from.
   */
  static fetchMetadata(url: string): Promise<TypeJsonObject> {
    // The url
    const queryUrl = url.endsWith('/') ? `${url}collections?f=json` : `${url}/collections?f=json`;

    // Set it
    return fetchJson(queryUrl);
  }

  /**
   * Overrides the way the metadata is fetched and set in the 'metadata' property. Resolves when done.
   * @returns {Promise<void>} A promise that the execution is completed.
   */
  protected override async onFetchAndSetServiceMetadata(): Promise<void> {
    // Fetch it
    const responseJson = await OgcFeature.fetchMetadata(this.metadataAccessPath);

    // Set it
    this.metadata = responseJson;
  }

  /**
   * Overrides the validation of a layer entry config.
   * @param {TypeLayerEntryConfig} layerConfig - The layer entry config to validate.
   */
  protected override onValidateLayerEntryConfig(layerConfig: TypeLayerEntryConfig): void {
    // Note that the code assumes ogc-feature collections does not contains metadata layer group. If you need layer group,
    // you can define them in the configuration section.
    if (Array.isArray(this.metadata!.collections)) {
      const foundCollection = this.metadata!.collections.find((layerMetadata) => layerMetadata.id === layerConfig.layerId);
      if (!foundCollection) {
        // Add a layer load error
        this.addLayerLoadError(layerConfig, `OGC feature layer not found (mapId:  ${this.mapId}, layerPath: ${layerConfig.layerPath})`);
        return;
      }

      // eslint-disable-next-line no-param-reassign
      if (foundCollection.description) layerConfig.layerName = foundCollection.description as string;

      // eslint-disable-next-line no-param-reassign
      layerConfig.initialSettings.extent = validateExtentWhenDefined(layerConfig.initialSettings.extent);

      if (!layerConfig.initialSettings.bounds && foundCollection.extent?.spatial?.bbox && foundCollection.extent?.spatial?.crs) {
        const latlonExtent = Projection.transformExtentFromProj(
          foundCollection.extent.spatial.bbox[0] as number[],
          Projection.getProjectionFromProj(foundCollection.extent.spatial.crs as string)!,
          Projection.PROJECTION_NAMES.LNGLAT
        );
        // eslint-disable-next-line no-param-reassign
        layerConfig.initialSettings.bounds = latlonExtent;
      }

      // eslint-disable-next-line no-param-reassign
      layerConfig.initialSettings.bounds = validateExtentWhenDefined(layerConfig.initialSettings.bounds);
      return;
    }

    throw new GeoViewError(
      this.mapId,
      `Invalid collection's metadata prevent loading of layer (mapId:  ${this.mapId}, layerPath: ${layerConfig.layerPath})`
    );
  }

  /**
   * Overrides the way the layer metadata is processed.
   * @param {AbstractBaseLayerEntryConfig} layerConfig - The layer entry configuration to process.
   * @returns {Promise<AbstractBaseLayerEntryConfig>} A promise that the layer entry configuration has gotten its metadata processed.
   */
  protected override async onProcessLayerMetadata(layerConfig: AbstractBaseLayerEntryConfig): Promise<AbstractBaseLayerEntryConfig> {
    // Instance check
    if (!(layerConfig instanceof VectorLayerEntryConfig)) throw new GeoViewError(this.mapId, 'Invalid layer configuration type provided');

    const metadataUrl = this.metadataAccessPath;
    if (metadataUrl) {
      const queryUrl = metadataUrl.endsWith('/')
        ? `${metadataUrl}collections/${layerConfig.layerId}/queryables?f=json`
        : `${metadataUrl}/collections/${layerConfig.layerId}/queryables?f=json`;
      const queryResult = await axios.get<TypeJsonObject>(queryUrl);
      if (queryResult.data.properties) {
        this.setLayerMetadata(layerConfig.layerPath, queryResult.data.properties);
        OgcFeature.#processFeatureInfoConfig(queryResult.data.properties, layerConfig);
      }
    }

    // Return the layer config
    return layerConfig;
  }

  /**
   * This method sets the outfields and aliasFields of the source feature info.
   *
   * @param {TypeJsonArray} fields An array of field names and its aliases.
   * @param {VectorLayerEntryConfig} layerConfig The vector layer entry to configure.
   * @private
   */
  static #processFeatureInfoConfig(fields: TypeJsonObject, layerConfig: VectorLayerEntryConfig): void {
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

    layerConfig.source.featureInfo!.outfields.forEach((outfield) => {
      // eslint-disable-next-line no-param-reassign
      if (!outfield.alias) outfield.alias = outfield.name;
    });

    // Set name field to first value
    if (!layerConfig.source.featureInfo.nameField) {
      // eslint-disable-next-line no-param-reassign
      layerConfig.source.featureInfo.nameField = layerConfig.source.featureInfo!.outfields[0].name;
    }
  }

  /**
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
    // eslint-disable-next-line no-param-reassign
    readOptions.dataProjection = (layerConfig.source as TypeBaseSourceVectorInitialConfig).dataProjection;
    // eslint-disable-next-line no-param-reassign
    sourceOptions.url = layerConfig.source!.dataAccessPath!;
    // eslint-disable-next-line no-param-reassign
    sourceOptions.url = `${sourceOptions.url}/collections/${layerConfig.layerId}/items?f=json`;
    // eslint-disable-next-line no-param-reassign
    sourceOptions.format = new FormatGeoJSON();
    const vectorSource = super.createVectorSource(layerConfig, sourceOptions, readOptions);
    return vectorSource;
  }
}

/**
 * type guard function that redefines a TypeGeoviewLayerConfig as a TypeOgcFeatureLayerConfig if the geoviewLayerType attribute of
 * the verifyIfLayer parameter is OGC_FEATURE. The type ascention applies only to the true block of the if clause that use this
 * function.
 *
 * @param {TypeGeoviewLayerConfig} verifyIfLayer Polymorphic object to test in order to determine if the type ascention is valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const layerConfigIsOgcFeature = (verifyIfLayer: TypeGeoviewLayerConfig): verifyIfLayer is TypeOgcFeatureLayerConfig => {
  return verifyIfLayer?.geoviewLayerType === CONST_LAYER_TYPES.OGC_FEATURE;
};

/**
 * type guard function that redefines a TypeLayerEntryConfig as a OgcFeatureLayerEntryConfig if the geoviewLayerType attribute
 * of the verifyIfGeoViewEntry.geoviewLayerConfig attribute is OGC_FEATURE. The type ascention applies only to the true block of
 * the if clause that use this function.
 *
 * @param {TypeLayerEntryConfig} verifyIfGeoViewEntry Polymorphic object to test in order to determine if the type ascention is
 * valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const geoviewEntryIsOgcFeature = (
  verifyIfGeoViewEntry: TypeLayerEntryConfig
): verifyIfGeoViewEntry is OgcFeatureLayerEntryConfig => {
  return verifyIfGeoViewEntry?.geoviewLayerConfig?.geoviewLayerType === CONST_LAYER_TYPES.OGC_FEATURE;
};
