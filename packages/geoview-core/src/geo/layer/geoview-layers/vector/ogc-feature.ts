/* eslint-disable no-param-reassign */
// We have many reassign for sourceOptions-layerConfig. We keep it global...
import axios from 'axios';

import { Options as SourceOptions } from 'ol/source/Vector';
import { GeoJSON as FormatGeoJSON } from 'ol/format';
import { ReadOptions } from 'ol/format/Feature';
import { Vector as VectorSource } from 'ol/source';
import Feature from 'ol/Feature';

// import { layerEntryIsGroupLayer } from '@config/types/type-guards';

import { TypeJsonObject } from '@/core/types/global-types';
import { AbstractGeoViewLayer, CONST_LAYER_TYPES } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { AbstractGeoViewVector } from '@/geo/layer/geoview-layers/vector/abstract-geoview-vector';
import {
  TypeLayerEntryConfig,
  TypeVectorSourceInitialConfig,
  TypeGeoviewLayerConfig,
  TypeBaseSourceVectorInitialConfig,
  layerEntryIsGroupLayer,
} from '@/geo/map/map-schema-types';
import { validateExtentWhenDefined } from '@/geo/utils/utilities';
import { Projection } from '@/geo/utils/projection';
import { logger } from '@/core/utils/logger';
import { OgcFeatureLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-validation-classes/ogc-layer-entry-config';
import { VectorLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-layer-entry-config';
import { AbstractBaseLayerEntryConfig } from '@/core/utils/config/validation-classes/abstract-base-layer-entry-config';
import { getLocalizedValue } from '@/core/utils/utilities';
import { AppEventProcessor } from '@/api/event-processors/event-processor-children/app-event-processor';

export interface TypeSourceOgcFeatureInitialConfig extends TypeVectorSourceInitialConfig {
  format: 'featureAPI';
}

export interface TypeOgcFeatureLayerConfig extends Omit<TypeGeoviewLayerConfig, 'listOfLayerEntryConfig' | 'geoviewLayerType'> {
  geoviewLayerType: typeof CONST_LAYER_TYPES.OGC_FEATURE;
  listOfLayerEntryConfig: OgcFeatureLayerEntryConfig[];
}

/** *****************************************************************************************************************************
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

/** *****************************************************************************************************************************
 * type guard function that redefines an AbstractGeoViewLayer as an OgcFeature
 * if the type attribute of the verifyIfGeoViewLayer parameter is OGC_FEATURE. The type ascention
 * applies only to the true block of the if clause that use this function.
 *
 * @param {AbstractGeoViewLayer} verifyIfGeoViewLayer Polymorphic object to test in order to determine if the type ascention is
 * valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const geoviewLayerIsOgcFeature = (verifyIfGeoViewLayer: AbstractGeoViewLayer): verifyIfGeoViewLayer is OgcFeature => {
  return verifyIfGeoViewLayer?.type === CONST_LAYER_TYPES.OGC_FEATURE;
};

/** *****************************************************************************************************************************
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

// ******************************************************************************************************************************
// ******************************************************************************************************************************
/** ******************************************************************************************************************************
 * A class to add OGC api feature layer.
 *
 * @exports
 * @class OgcFeature
 */
// ******************************************************************************************************************************
// GV Layers Refactoring - Obsolete (in layers)
export class OgcFeature extends AbstractGeoViewVector {
  // TODO: Check - If this still used?
  // private variable holding wfs version
  // private version = '2.0.0';

  /** ***************************************************************************************************************************
   * Initialize layer
   *
   * @param {string} mapId the id of the map
   * @param {TypeOgcFeatureLayerConfig} layerConfig the layer configuration
   */
  constructor(mapId: string, layerConfig: TypeOgcFeatureLayerConfig) {
    super(CONST_LAYER_TYPES.OGC_FEATURE, layerConfig, mapId);
  }

  /** ***************************************************************************************************************************
   * Extract the type of the specified field from the metadata. If the type can not be found, return 'string'.
   *
   * @param {string} fieldName field name for which we want to get the type.
   * @param {AbstractBaseLayerEntryConfig} layerConfig layer configuration.
   *
   * @returns {'string' | 'date' | 'number'} The type of the field.
   */
  // GV Layers Refactoring - Obsolete (in layers)
  protected override getFieldType(fieldName: string, layerConfig: AbstractBaseLayerEntryConfig): 'string' | 'date' | 'number' {
    const fieldDefinitions = this.getLayerMetadata(layerConfig.layerPath);
    const fieldEntryType = (fieldDefinitions[fieldName].type as string).split(':').slice(-1)[0] as string;
    if (fieldEntryType === 'date') return 'date';
    if (['int', 'number'].includes(fieldEntryType)) return 'number';
    return 'string';
  }

  /** ***************************************************************************************************************************
   * This method reads the service metadata from the metadataAccessPath.
   *
   * @returns {Promise<void>} A promise that the execution is completed.
   */
  // GV Layers Refactoring - Obsolete (in config?)
  protected override fetchServiceMetadata(): Promise<void> {
    const promisedExecution = new Promise<void>((resolve) => {
      const metadataUrl = getLocalizedValue(this.metadataAccessPath, AppEventProcessor.getDisplayLanguage(this.mapId));
      if (metadataUrl) {
        const queryUrl = metadataUrl.endsWith('/') ? `${metadataUrl}collections?f=json` : `${metadataUrl}/collections?f=json`;
        axios
          .get<TypeJsonObject>(queryUrl)
          .then((response) => {
            this.metadata = response.data;
            resolve();
          })
          .catch((reason) => {
            this.setAllLayerStatusTo('error', this.listOfLayerEntryConfig, 'Unable to read metadata');
            logger.logError('Unable to fetch metadata', this.metadataAccessPath, reason);
            resolve();
          });
      } else {
        this.setAllLayerStatusTo('error', this.listOfLayerEntryConfig, 'Unable to read metadata');
      }
    });
    return promisedExecution;
  }

  /** ***************************************************************************************************************************
   * This method validates recursively the configuration of the layer entries to ensure that it is a feature layer identified
   * with a numeric layerId and creates a group entry when a layer is a group.
   *
   * @param {TypeLayerEntryConfig[]} listOfLayerEntryConfig The list of layer entries configuration to validate.
   */
  // GV Layers Refactoring - Obsolete (in config?)
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
          return;
        }
      }

      layerConfig.layerStatus = 'processing';

      // Note that the code assumes ogc-feature collections does not contains metadata layer group. If you need layer group,
      // you can define them in the configuration section.
      if (Array.isArray(this.metadata!.collections)) {
        const foundCollection = this.metadata!.collections.find((layerMetadata) => layerMetadata.id === layerConfig.layerId);
        if (!foundCollection) {
          this.layerLoadError.push({
            layer: layerPath,
            loggerMessage: `OGC feature layer not found (mapId:  ${this.mapId}, layerPath: ${layerPath})`,
          });
          layerConfig.layerStatus = 'error';
          return;
        }

        if (foundCollection.description)
          layerConfig.layerName = {
            en: foundCollection.description as string,
            fr: foundCollection.description as string,
          };

        layerConfig.initialSettings.extent = validateExtentWhenDefined(layerConfig.initialSettings.extent);

        if (!layerConfig.initialSettings.bounds && foundCollection.extent?.spatial?.bbox && foundCollection.extent?.spatial?.crs) {
          const latlonExtent = Projection.transformExtent(
            foundCollection.extent.spatial.bbox[0] as number[],
            Projection.getProjection(foundCollection.extent.spatial.crs as string)!,
            Projection.PROJECTION_NAMES.LNGLAT
          );
          layerConfig.initialSettings.bounds = latlonExtent;
        }
        layerConfig.initialSettings.bounds = validateExtentWhenDefined(layerConfig.initialSettings.bounds);
        return;
      }

      throw new Error(`Invalid collection's metadata prevent loading of layer (mapId:  ${this.mapId}, layerPath: ${layerPath})`);
    });
  }

  /** ***************************************************************************************************************************
   * This method is used to process the layer's metadata. It will fill the empty outfields and aliasFields properties of the
   * layer's configuration.
   *
   * @param {AbstractBaseLayerEntryConfig} layerConfig The layer entry configuration to process.
   *
   * @returns {Promise<AbstractBaseLayerEntryConfig>} A promise that the vector layer configuration has its metadata processed.
   */
  // GV Layers Refactoring - Obsolete (in config?)
  protected override async processLayerMetadata(layerConfig: AbstractBaseLayerEntryConfig): Promise<AbstractBaseLayerEntryConfig> {
    // Instance check
    if (!(layerConfig instanceof VectorLayerEntryConfig)) throw new Error('Invalid layer configuration type provided');

    try {
      const metadataUrl = getLocalizedValue(this.metadataAccessPath, AppEventProcessor.getDisplayLanguage(this.mapId));
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
    } catch (error) {
      logger.logError(`Error processing layer metadata for layer path "${layerConfig.layerPath}`, error);
      layerConfig.layerStatus = 'error';
    }
    return layerConfig;
  }

  /** ***************************************************************************************************************************
   * This method sets the outfields and aliasFields of the source feature info.
   *
   * @param {TypeJsonArray} fields An array of field names and its aliases.
   * @param {VectorLayerEntryConfig} layerConfig The vector layer entry to configure.
   * @private
   */
  // GV Layers Refactoring - Obsolete (in config?)
  static #processFeatureInfoConfig(fields: TypeJsonObject, layerConfig: VectorLayerEntryConfig): void {
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

      // TODO: check if this is a duplicate of getField function. Clean in other classes as well
      Object.keys(fields).forEach((fieldEntry) => {
        if (fields[fieldEntry].type === 'Geometry') return;
        if (processOutField) {
          layerConfig.source!.featureInfo!.outfields!.en = `${layerConfig.source!.featureInfo!.outfields!.en}${fieldEntry},`;
          let fieldType: 'string' | 'date' | 'number';
          if (fields[fieldEntry].type === 'date') fieldType = 'date';
          else if (['int', 'number'].includes(fields[fieldEntry].type as string)) fieldType = 'number';
          else fieldType = 'string';
          layerConfig.source!.featureInfo!.fieldTypes = `${layerConfig.source!.featureInfo!.fieldTypes}${fieldType},`;
        }
        layerConfig.source!.featureInfo!.aliasFields!.en = `${layerConfig.source!.featureInfo!.aliasFields!.en}${fieldEntry},`;
      });
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
   * Create a source configuration for the vector layer.
   *
   * @param {AbstractBaseLayerEntryConfig} layerConfig The layer entry configuration.
   * @param {SourceOptions} sourceOptions The source options (default: {}).
   * @param {ReadOptions} readOptions The read options (default: {}).
   *
   * @returns {VectorSource<Geometry>} The source configuration that will be used to create the vector layer.
   */
  // GV Layers Refactoring - Obsolete (in config?, in layers?)
  protected override createVectorSource(
    layerConfig: AbstractBaseLayerEntryConfig,
    sourceOptions: SourceOptions<Feature> = {},
    readOptions: ReadOptions = {}
  ): VectorSource<Feature> {
    readOptions.dataProjection = (layerConfig.source as TypeBaseSourceVectorInitialConfig).dataProjection;
    sourceOptions.url = getLocalizedValue(layerConfig.source!.dataAccessPath!, AppEventProcessor.getDisplayLanguage(this.mapId));
    sourceOptions.url = `${sourceOptions.url}/collections/${layerConfig.layerId}/items?f=json`;
    sourceOptions.format = new FormatGeoJSON();
    const vectorSource = super.createVectorSource(layerConfig, sourceOptions, readOptions);
    return vectorSource;
  }
}
