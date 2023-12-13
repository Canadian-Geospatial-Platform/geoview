/* eslint-disable block-scoped-var, no-var, vars-on-top, no-param-reassign */
import { transformExtent } from 'ol/proj';
import { Options as SourceOptions } from 'ol/source/Vector';
import { GeoJSON as FormatGeoJSON } from 'ol/format';
import { ReadOptions } from 'ol/format/Feature';
import { Vector as VectorSource } from 'ol/source';
import Feature from 'ol/Feature';

import defaultsDeep from 'lodash/defaultsDeep';
import { AbstractGeoViewLayer, CONST_LAYER_TYPES } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { AbstractGeoViewVector } from '@/geo/layer/geoview-layers/vector/abstract-geoview-vector';
import {
  TypeLayerEntryConfig,
  TypeVectorLayerEntryConfig,
  TypeVectorSourceInitialConfig,
  TypeGeoviewLayerConfig,
  TypeListOfLayerEntryConfig,
  layerEntryIsGroupLayer,
  TypeBaseSourceVectorInitialConfig,
  TypeBaseLayerEntryConfig,
  TypeLocalizedString,
} from '@/geo/map/map-schema-types';
import { getLocalizedValue } from '@/core/utils/utilities';
import { Cast, toJsonObject } from '@/core/types/global-types';
import { Layer } from '../../layer';
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';

export interface TypeSourceGeoJSONInitialConfig extends Omit<TypeVectorSourceInitialConfig, 'format'> {
  format: 'GeoJSON';
}

export interface TypeGeoJSONLayerEntryConfig extends Omit<TypeVectorLayerEntryConfig, 'source'> {
  source: TypeSourceGeoJSONInitialConfig;
}

export interface TypeGeoJSONLayerConfig extends Omit<TypeGeoviewLayerConfig, 'listOfLayerEntryConfig'> {
  geoviewLayerType: 'GeoJSON';
  listOfLayerEntryConfig: TypeGeoJSONLayerEntryConfig[];
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
 * type guard function that redefines a TypeLayerEntryConfig as a TypeGeoJSONLayerEntryConfig if the geoviewLayerType attribute of
 * the verifyIfGeoViewEntry.geoviewRootLayer attribute is GEOJSON. The type ascention applies only to the true block of the if
 * clause that use this function.
 *
 * @param {TypeLayerEntryConfig} verifyIfGeoViewEntry Polymorphic object to test in order to determine if the type ascention is
 * valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const geoviewEntryIsGeoJSON = (verifyIfGeoViewEntry: TypeLayerEntryConfig): verifyIfGeoViewEntry is TypeGeoJSONLayerEntryConfig => {
  return verifyIfGeoViewEntry?.geoviewRootLayer?.geoviewLayerType === CONST_LAYER_TYPES.GEOJSON;
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
   * Extract the type of the specified field from the metadata. If the type can not be found, return 'string'.
   *
   * @param {string} fieldName field name for which we want to get the type.
   * @param {TypeLayerEntryConfig} layerConfig layer configuration.
   *
   * @returns {'string' | 'date' | 'number'} The type of the field.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected getFieldType(fieldName: string, layerConfig: TypeLayerEntryConfig): 'string' | 'date' | 'number' {
    const fieldDefinitions = this.layerMetadata[Layer.getLayerPath(layerConfig)].source.featureInfo;
    const fieldIndex = getLocalizedValue(Cast<TypeLocalizedString>(fieldDefinitions.outfields), this.mapId)?.split(',').indexOf(fieldName);
    if (!fieldIndex || fieldIndex === -1) return 'string';
    return (fieldDefinitions.fieldTypes as string).split(',')[fieldIndex!] as 'string' | 'date' | 'number';
  }

  /** ***************************************************************************************************************************
   * This method recursively validates the layer configuration entries by filtering and reporting invalid layers. If needed,
   * extra configuration may be done here.
   *
   * @param {TypeListOfLayerEntryConfig} listOfLayerEntryConfig The list of layer entries configuration to validate.
   */
  protected validateListOfLayerEntryConfig(listOfLayerEntryConfig: TypeListOfLayerEntryConfig) {
    this.setLayerPhase('validateListOfLayerEntryConfig');
    listOfLayerEntryConfig.forEach((layerConfig: TypeLayerEntryConfig) => {
      const layerPath = Layer.getLayerPath(layerConfig);
      if (layerEntryIsGroupLayer(layerConfig)) {
        this.validateListOfLayerEntryConfig(layerConfig.listOfLayerEntryConfig!);
        if (!layerConfig.listOfLayerEntryConfig.length) {
          this.layerLoadError.push({
            layer: layerPath,
            consoleMessage: `Empty layer group (mapId:  ${this.mapId}, layerPath: ${layerPath})`,
          });
          this.setLayerStatus('error', layerPath);
        }
        return;
      }

      this.setLayerStatus('loading', layerPath);

      // When no metadata are provided, all layers are considered valid.
      if (!this.metadata) return;

      // Note that geojson metadata as we defined it does not contains layer group. If you need geogson layer group,
      // you can define them in the configuration section.
      if (Array.isArray(this.metadata?.listOfLayerEntryConfig)) {
        const metadataLayerList = Cast<TypeLayerEntryConfig[]>(this.metadata?.listOfLayerEntryConfig);
        const foundEntry = metadataLayerList.find(
          (layerMetadata) => layerMetadata.layerId === layerConfig.layerId && layerMetadata.layerPathEnding === layerConfig.layerPathEnding
        );
        if (!foundEntry) {
          this.layerLoadError.push({
            layer: layerPath,
            consoleMessage: `GeoJSON layer not found (mapId:  ${this.mapId}, layerPath: ${layerPath})`,
          });
          this.setLayerStatus('error', layerPath);
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
   * This method is used to process the layer's metadata. It will fill the empty fields of the layer's configuration (renderer,
   * initial settings, fields and aliases).
   *
   * @param {TypeVectorLayerEntryConfig} layerConfig The layer entry configuration to process.
   *
   * @returns {Promise<void>} A promise that the vector layer configuration has its metadata processed.
   */
  protected processLayerMetadata(layerConfig: TypeVectorLayerEntryConfig): Promise<void> {
    const promiseOfExecution = new Promise<void>((resolve) => {
      if (!this.metadata) resolve();
      else {
        const metadataLayerList = Cast<TypeVectorLayerEntryConfig[]>(this.metadata?.listOfLayerEntryConfig);
        const layerMetadataFound = metadataLayerList.find(
          (layerMetadata) => layerMetadata.layerId === layerConfig.layerId && layerMetadata.layerPathEnding === layerConfig.layerPathEnding
        );
        if (layerMetadataFound) {
          this.layerMetadata[Layer.getLayerPath(layerConfig)] = toJsonObject(layerMetadataFound);
          layerConfig.layerName = layerConfig.layerName || layerMetadataFound.layerName;
          layerConfig.source = defaultsDeep(layerConfig.source, layerMetadataFound.source);
          layerConfig.initialSettings = defaultsDeep(layerConfig.initialSettings, layerMetadataFound.initialSettings);
          layerConfig.style = defaultsDeep(layerConfig.style, layerMetadataFound.style);
          // When the dataAccessPath stored in the layerConfig.source objet is equal to the root of the metadataAccessPath with a
          // layerId ending, chances are that it was set by the config-validation because of an empty dataAcessPath value in the config.
          // This situation means that we want to use the dataAccessPath found in the metadata if it is set, otherwise we will keep the
          // config dataAccessPath value.
          let metadataAccessPathRoot = getLocalizedValue(layerConfig.geoviewRootLayer?.metadataAccessPath, this.mapId);
          if (metadataAccessPathRoot) {
            metadataAccessPathRoot =
              metadataAccessPathRoot.split('/').length > 1 ? metadataAccessPathRoot.split('/').slice(0, -1).join('/') : './';
            const metadataAccessPathRootPlusLayerId = `${metadataAccessPathRoot}/${layerConfig.layerId}`;
            if (
              metadataAccessPathRootPlusLayerId === getLocalizedValue(layerConfig.source?.dataAccessPath, this.mapId) &&
              getLocalizedValue(layerMetadataFound.source?.dataAccessPath, this.mapId)
            ) {
              layerConfig.source!.dataAccessPath = { ...layerMetadataFound.source!.dataAccessPath } as TypeLocalizedString;
            }
          }
        }

        if (layerConfig.initialSettings?.extent)
          layerConfig.initialSettings.extent = transformExtent(
            layerConfig.initialSettings.extent,
            'EPSG:4326',
            `EPSG:${MapEventProcessor.getMapState(this.mapId).currentProjection}`
          );

        resolve();
      }
    });
    return promiseOfExecution;
  }

  /** ***************************************************************************************************************************
   * Create a source configuration for the vector layer.
   *
   * @param {TypeBaseLayerEntryConfig} layerConfig The layer entry configuration.
   * @param {SourceOptions} sourceOptions The source options (default: {}).
   * @param {ReadOptions} readOptions The read options (default: {}).
   *
   * @returns {VectorSource<Geometry>} The source configuration that will be used to create the vector layer.
   */
  protected createVectorSource(
    layerConfig: TypeBaseLayerEntryConfig,
    sourceOptions: SourceOptions = {},
    readOptions: ReadOptions = {}
  ): VectorSource<Feature> {
    readOptions.dataProjection = (layerConfig.source as TypeBaseSourceVectorInitialConfig).dataProjection;
    sourceOptions.url = getLocalizedValue(layerConfig.source!.dataAccessPath!, this.mapId);
    sourceOptions.format = new FormatGeoJSON();
    const vectorSource = super.createVectorSource(layerConfig, sourceOptions, readOptions);
    return vectorSource;
  }
}
