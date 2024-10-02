/* eslint-disable no-param-reassign */
// We have many reassign for sourceOptions-layerConfig. We keep it global...
import { Options as SourceOptions } from 'ol/source/Vector';
import { GeoJSON as FormatGeoJSON } from 'ol/format';
import { ReadOptions } from 'ol/format/Feature';
import { Vector as VectorSource } from 'ol/source';
import Feature from 'ol/Feature';

import defaultsDeep from 'lodash/defaultsDeep';

import { TypeLocalizedString } from '@config/types/map-schema-types';

import VectorLayer from 'ol/layer/Vector';
import { GeoJSONObject } from 'ol/format/GeoJSON';
import { AbstractGeoViewLayer, CONST_LAYER_TYPES } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { AbstractGeoViewVector } from '@/geo/layer/geoview-layers/vector/abstract-geoview-vector';
import {
  TypeLayerEntryConfig,
  TypeVectorSourceInitialConfig,
  TypeGeoviewLayerConfig,
  layerEntryIsGroupLayer,
  TypeBaseSourceVectorInitialConfig,
} from '@/geo/map/map-schema-types';
import { validateExtentWhenDefined } from '@/geo/utils/utilities';
import { Cast, TypeJsonObject } from '@/core/types/global-types';
import { getLocalizedValue } from '@/core/utils/utilities';
import { logger } from '@/core/utils/logger';
import { GeoJSONLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-validation-classes/geojson-layer-entry-config';
import { VectorLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-layer-entry-config';
import { AbstractBaseLayerEntryConfig } from '@/core/utils/config/validation-classes/abstract-base-layer-entry-config';
import { AppEventProcessor } from '@/api/event-processors/event-processor-children/app-event-processor';
import { Projection } from '@/geo/utils/projection';
import { LegendEventProcessor } from '@/api/event-processors/event-processor-children/legend-event-processor';
import { DataTableEventProcessor } from '@/api/event-processors/event-processor-children/data-table-event-processor';
import { FeatureInfoEventProcessor } from '@/api/event-processors/event-processor-children/feature-info-event-processor';

export interface TypeSourceGeoJSONInitialConfig extends Omit<TypeVectorSourceInitialConfig, 'format'> {
  format: 'GeoJSON';
}

export interface TypeGeoJSONLayerConfig extends Omit<TypeGeoviewLayerConfig, 'listOfLayerEntryConfig'> {
  geoviewLayerType: typeof CONST_LAYER_TYPES.GEOJSON;
  listOfLayerEntryConfig: GeoJSONLayerEntryConfig[];
}

/** *****************************************************************************************************************************
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

/** *****************************************************************************************************************************
 * type guard function that redefines an AbstractGeoViewLayer as a GeoJSON if the type attribute of the verifyIfGeoViewLayer
 * parameter is GEOJSON. The type ascention applies only to the true block of the if clause that use this function.
 *
 * @param {AbstractGeoViewLayer} verifyIfGeoViewLayer Polymorphic object to test in order to determine if the type ascention is
 * valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const geoviewLayerIsGeoJSON = (verifyIfGeoViewLayer: AbstractGeoViewLayer): verifyIfGeoViewLayer is GeoJSON => {
  return verifyIfGeoViewLayer?.type === CONST_LAYER_TYPES.GEOJSON;
};

/** *****************************************************************************************************************************
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

// ******************************************************************************************************************************
// ******************************************************************************************************************************
/** *****************************************************************************************************************************
 * Class used to add geojson layer to the map
 *
 * @exports
 * @class GeoJSON
 */
// ******************************************************************************************************************************
// GV Layers Refactoring - Obsolete (in layers)
export class GeoJSON extends AbstractGeoViewVector {
  /** ***************************************************************************************************************************
   * Initialize layer
   *
   * @param {string} mapId the id of the map
   * @param {TypeGeoJSONLayerConfig} layerConfig the layer configuration
   */
  constructor(mapId: string, layerConfig: TypeGeoJSONLayerConfig) {
    super(CONST_LAYER_TYPES.GEOJSON, layerConfig, mapId);
  }

  /** ***************************************************************************************************************************
   * This method recursively validates the layer configuration entries by filtering and reporting invalid layers. If needed,
   * extra configuration may be done here.
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
        }
        return;
      }

      layerConfig.layerStatus = 'processing';

      // When no metadata are provided, all layers are considered valid.
      if (!this.metadata) return;

      if (Array.isArray(this.metadata?.listOfLayerEntryConfig)) {
        const foundEntry = this.#recursiveSearch(
          `${layerConfig.layerId}${layerConfig.layerIdExtension ? `.${layerConfig.layerIdExtension}` : ''}`,
          Cast<TypeLayerEntryConfig[]>(this.metadata?.listOfLayerEntryConfig)
        );
        if (!foundEntry) {
          this.layerLoadError.push({
            layer: layerPath,
            loggerMessage: `GeoJSON layer not found (mapId:  ${this.mapId}, layerPath: ${layerPath})`,
          });
          layerConfig.layerStatus = 'error';
          return;
        }
        return;
      }

      throw new Error(
        `Invalid GeoJSON metadata (listOfLayerEntryConfig) prevent loading of layer (mapId:  ${this.mapId}, layerPath: ${layerPath})`
      );
    });
  }

  /** ***************************************************************************************************************************
   * This method is used to do a recursive search in the array of layer entry config.
   *
   * @param {string} layerId The layer list to search.
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

  /** ***************************************************************************************************************************
   * This method is used to process the layer's metadata. It will fill the empty fields of the layer's configuration (renderer,
   * initial settings, fields and aliases).
   *
   * @param {AbstractBaseLayerEntryConfig} layerConfig The layer entry configuration to process.
   *
   * @returns {Promise<AbstractBaseLayerEntryConfig>} A promise that the vector layer configuration has its metadata processed.
   */
  // GV Layers Refactoring - Obsolete (in config?)
  protected override processLayerMetadata(layerConfig: AbstractBaseLayerEntryConfig): Promise<AbstractBaseLayerEntryConfig> {
    // Instance check
    if (!(layerConfig instanceof VectorLayerEntryConfig)) throw new Error('Invalid layer configuration type provided');

    if (this.metadata) {
      const layerMetadataFound = this.#recursiveSearch(
        `${layerConfig.layerId}${layerConfig.layerIdExtension ? `.${layerConfig.layerIdExtension}` : ''}`,
        Cast<TypeLayerEntryConfig[]>(this.metadata?.listOfLayerEntryConfig)
      ) as VectorLayerEntryConfig;
      if (layerMetadataFound) {
        layerConfig.layerName = layerConfig.layerName || layerMetadataFound.layerName;
        layerConfig.source = defaultsDeep(layerConfig.source, layerMetadataFound.source);
        layerConfig.initialSettings = defaultsDeep(layerConfig.initialSettings, layerMetadataFound.initialSettings);
        layerConfig.style = defaultsDeep(layerConfig.style, layerMetadataFound.style);
        // When the dataAccessPath stored in the layerConfig.source object is equal to the root of the metadataAccessPath with a
        // layerId ending, chances are that it was set by the config-validation because of an empty dataAcessPath value in the config.
        // This situation means that we want to use the dataAccessPath found in the metadata if it is set, otherwise we will keep the
        // config dataAccessPath value.
        let metadataAccessPathRoot = getLocalizedValue(
          layerConfig.geoviewLayerConfig?.metadataAccessPath as TypeLocalizedString,
          AppEventProcessor.getDisplayLanguage(this.mapId)
        );
        if (metadataAccessPathRoot) {
          metadataAccessPathRoot =
            metadataAccessPathRoot.split('/').length > 1 ? metadataAccessPathRoot.split('/').slice(0, -1).join('/') : './';
          const metadataAccessPathRootPlusLayerId = `${metadataAccessPathRoot}/${layerConfig.layerId}`;
          if (
            metadataAccessPathRootPlusLayerId ===
              getLocalizedValue(
                layerConfig.source?.dataAccessPath as TypeLocalizedString,
                AppEventProcessor.getDisplayLanguage(this.mapId)
              ) &&
            getLocalizedValue(
              layerMetadataFound.source?.dataAccessPath as TypeLocalizedString,
              AppEventProcessor.getDisplayLanguage(this.mapId)
            )
          ) {
            layerConfig.source!.dataAccessPath = { ...layerMetadataFound.source!.dataAccessPath } as TypeLocalizedString;
          }
        }
      }

      layerConfig.initialSettings.extent = validateExtentWhenDefined(layerConfig.initialSettings.extent);
    }

    // Setting the layer metadata now with the updated config values. Setting the layer metadata with the config, directly, like it's done in CSV
    this.setLayerMetadata(layerConfig.layerPath, Cast<TypeJsonObject>(layerConfig));

    return Promise.resolve(layerConfig);
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
    sourceOptions.url = getLocalizedValue(
      layerConfig.source!.dataAccessPath! as TypeLocalizedString,
      AppEventProcessor.getDisplayLanguage(this.mapId)
    );
    sourceOptions.format = new FormatGeoJSON();
    const vectorSource = super.createVectorSource(layerConfig, sourceOptions, readOptions);
    return vectorSource;
  }

  /** ***************************************************************************************************************************
   * Override the features of a geojson layer with new geojson.
   * @param {string} layerPath - The path of the layer to override.
   * @param {GeoJSONObject | string} geojson - The new geoJSON.
   */
  overrideGeojsonSource(layerPath: string, geojson: GeoJSONObject | string): void {
    // Convert string to geoJSON if necessary
    const geojsonObject = typeof geojson === 'string' ? JSON.parse(geojson) : geojson;

    // Create features from geoJSON
    const dataProjection = geojsonObject.crs?.properties?.name || Projection.PROJECTION_NAMES.LNGLAT;
    const features = new FormatGeoJSON().readFeatures(geojsonObject, {
      dataProjection,
      featureProjection: this.getMapViewer().getProjection(),
    });

    const olLayer = this.getOLLayer(layerPath) as VectorLayer<VectorSource<Feature>>;

    if (olLayer && features.length) {
      // Remove current features and add new ones
      olLayer!.getSource()?.clear();
      olLayer!.getSource()?.addFeatures(features);
      olLayer.changed();

      // TODO: This is coupled with the processor. Maybe we should have a processor event to trigger this and
      // TODO.CONT: keep this functio not tie with UI.
      // Update the bounds in the store
      const bounds = this.getBounds(layerPath);
      if (bounds) {
        LegendEventProcessor.setLayerBounds(this.mapId, layerPath, bounds);
      }

      // Reset the feature info result set
      FeatureInfoEventProcessor.resetResultSet(this.mapId, layerPath);

      // Update feature info
      DataTableEventProcessor.triggerGetAllFeatureInfo(this.mapId, layerPath).catch((error) => {
        // Log
        logger.logPromiseFailed(`Update all feature info in overrideGeojsonSource failed for layer ${layerPath}`, error);
      });
    }
  }
}
