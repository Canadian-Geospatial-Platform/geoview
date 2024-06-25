import axios from 'axios';

import { Cast, TypeJsonObject } from '@config/types/config-types';
import { AbstractBaseLayerEntryConfig } from '@config/types/classes/sub-layer-config/abstract-base-layer-entry-config';
import { AbstractGeoviewLayerConfig } from '@config/types/classes/geoview-config/abstract-geoview-layer-config';
import { TypeStyleGeometry } from '@config/types/map-schema-types';
import { layerEntryIsAbstractBaseLayerEntryConfig, layerEntryIsGroupLayer } from '@config/types/type-guards';
import { GroupLayerEntryConfig } from '@config/types/classes/sub-layer-config/group-layer-entry-config';
import { GeoviewLayerInvalidParameterError } from '@config/types/classes/config-exceptions';
import { EntryConfigBaseClass } from '@/api/config/types/classes/sub-layer-config/entry-config-base-class';

import { getXMLHttpRequest } from '@/core/utils/utilities';
import { logger } from '@/core/utils/logger';

/** The ESRI dynamic geoview layer class. */
export abstract class AbstractGeoviewEsriLayerConfig extends AbstractGeoviewLayerConfig {
  /**
   * Sets the error flag for all layers in the provided list of layer entries.
   *
   * @param {EntryConfigBaseClass[]} listOfLayerEntryConfig The list of layer entries.
   * @private
   */
  #setErrorDetectedFlagForAllLayers(listOfLayerEntryConfig: EntryConfigBaseClass[]): void {
    listOfLayerEntryConfig.forEach((layerEntry) => {
      layerEntry.setErrorDetectedFlag();
      if (layerEntryIsGroupLayer(layerEntry)) this.#setErrorDetectedFlagForAllLayers(layerEntry.listOfLayerEntryConfig);
    });
  }

  /**
   * Get the service metadata from the metadataAccessPath and store it in a protected property of the geoview layer.
   */
  override async fetchServiceMetadata(): Promise<void> {
    const serviceUrlFragments = this.metadataAccessPath.split('/');
    // The test convert to number and back to string because parseInt('10a', 10) returns 10, but '10a' is not a number
    const endingIsNumeric = parseInt(serviceUrlFragments.slice(-1)[0], 10).toString() === serviceUrlFragments.slice(-1)[0];
    const serviceUrl = endingIsNumeric ? `${serviceUrlFragments.slice(0, -1).join('/')}/` : this.metadataAccessPath;
    const layerId = endingIsNumeric ? parseInt(serviceUrlFragments.slice(-1)[0], 10) : undefined;

    const metadataString = await getXMLHttpRequest(`${serviceUrl}?f=json`);
    if (metadataString !== '{}') {
      const jsonMetadata = JSON.parse(metadataString) as TypeJsonObject;
      if ('error' in jsonMetadata) {
        this.setErrorDetectedFlag();
        logger.logError(`Error detected while reading ESRI metadata for geoview layer ${this.geoviewLayerId}.`, jsonMetadata.error);
      } else {
        this.metadata = jsonMetadata;
        // this.#validateListOfLayerEntryConfig(this.listOfLayerEntryConfig);
        this.metadataLayerTree = this.createLayerTree(this.metadata.layers as TypeJsonObject[], layerId);
        logger.logInfo(this.metadataLayerTree);
        await this.#fetchListOfLayerMetadata(this.metadataLayerTree);
        logger.logInfo(this.metadata);
      }
    } else {
      this.setErrorDetectedFlag();
      logger.logError(`Error detected while reading ESRI metadata for geoview layer ${this.geoviewLayerId}. An empty object was returned.`);
    }
  }

  /**
   * Create the layer tree from the service metadata.
   *
   * @param {TypeJsonObject[]} layersFromMetadata The layers found in the metadata.
   * @param {number} layerId An optional layer id to use for the tree creation.
   *
   * @returns {EntryConfigBaseClass[]} The layer tree created from the metadata.
   * @protected
   */
  protected createLayerTree(layers: TypeJsonObject[], layerId?: number): EntryConfigBaseClass[] {
    let layerFound = layerId !== undefined && layers.find((layer) => layer.id === layerId);
    if (layerId !== undefined && !layerFound) {
      this.setErrorDetectedFlag();
      throw new GeoviewLayerInvalidParameterError('LayerIdNotFound', [layerId?.toString()]);
    }

    // if there is only one layer in the array, it must be a leaf node.
    if (layers.length === 1) [layerFound] = layers;

    // if the layerFound is not a group layer, create a leaf.
    if (layerFound && layerFound.type !== 'Group Layer') {
      const layerConfig = Cast<TypeJsonObject>({
        layerId: layerFound.id.toString(),
        layerName: { en: layerFound.name },
        geometryType: AbstractGeoviewEsriLayerConfig.convertEsriGeometryTypeToOLGeometryType(layerFound.geometryType as string),
      });
      return [this.createLeafNode(layerConfig, this.initialSettings, this.language, this)!];
    }

    // Create the layer tree from the array of layers
    let jsonConfig = this.#createGroupNode(
      layers,
      layerFound ? parseInt(layerFound.id as string, 10) : -1,
      (layerFound ? layerFound?.name : this.metadata.mapName) as string
    );
    // If the list of layer config of the root node contains only one node, use it as the root node
    if (jsonConfig?.listOfLayerEntryConfig?.length === 1) [jsonConfig] = jsonConfig.listOfLayerEntryConfig as TypeJsonObject[];
    return [new GroupLayerEntryConfig(jsonConfig, this.initialSettings, this.language, this)];
  }

  /**
   * Create a group node for a specific layer id.
   *
   * @param {TypeJsonObject[]} layers The layers found in the metadata.
   * @param {number} parentId The layer id of the parent node.
   * @param {string} groupName The name to assign to the group node.
   *
   * @returns {TypeJsonObject} A json configuration that can be used to create the group node.
   * @private
   */
  #createGroupNode = (layers: TypeJsonObject[], parentId: number, groupName: string): TypeJsonObject => {
    const listOfLayerEntryConfig = layers.reduce((accumulator, layer) => {
      if (layer.parentLayerId === parentId) {
        if (layer.type === 'Group Layer') accumulator.push(this.#createGroupNode(layers, layer.id as number, layer.name as string));
        else {
          accumulator.push(
            Cast<TypeJsonObject>({
              layerId: layer.id.toString(),
              layerName: { en: layer.name },
              geometryType: AbstractGeoviewEsriLayerConfig.convertEsriGeometryTypeToOLGeometryType(layer.geometryType as string),
            })
          );
        }
      }
      return accumulator;
    }, [] as TypeJsonObject[]);

    return Cast<TypeJsonObject>({
      layerId: parentId === -1 ? groupName : parentId,
      initialSettings: this.initialSettings,
      layerName: { en: groupName },
      isLayerGroup: true,
      listOfLayerEntryConfig,
    });
  };

  /**
   * Fetch the metadata using the list of layer entry configuration provided.
   *
   * @param {EntryConfigBaseClass[]} listOfLayerEntryConfig The list of layer entry config to process.
   *
   * @returns {Promise<void>} A promise that will resolve when the process has completed.
   * @private
   */
  async #fetchListOfLayerMetadata(listOfLayerEntryConfig: EntryConfigBaseClass[]): Promise<void> {
    const listOfLayerMetadata: Promise<TypeJsonObject | void>[] = [];
    const listOfGroupFlag: boolean[] = [];
    listOfLayerEntryConfig.forEach((subLayerConfig) => {
      if (layerEntryIsGroupLayer(subLayerConfig)) {
        listOfGroupFlag.push(true);
        listOfLayerMetadata.push(this.#fetchListOfLayerMetadata(subLayerConfig.listOfLayerEntryConfig));
      } else if (layerEntryIsAbstractBaseLayerEntryConfig(subLayerConfig)) {
        listOfGroupFlag.push(false);
        listOfLayerMetadata.push(subLayerConfig.fetchLayerMetadata());
      }
    });

    const result = await Promise.allSettled(listOfLayerMetadata);
    logger.logInfo('listOfLayerMetadata', result);
  }

  /** ***************************************************************************************************************************
   * This method is used to process the metadata of the sub-layers. It will fill the empty properties of the configuration
   * (renderer, initial settings, fields and aliases).
   *
   * @param {TypeLayerEntryConfig} layerConfig The layer entry configuration to process.
   *
   * @returns {Promise<TypeJsonObject>} A promise that resolve when the JSON metadata are read..
   */
  async fetchEsriLayerMetadata(subLayerConfig: AbstractBaseLayerEntryConfig): Promise<TypeJsonObject> {
    const serviceUrlFragments = this.metadataAccessPath.split('/');
    // The test convert to number and back to string because parseInt('10a', 10) returns 10, but '10a' is not a number
    const endingIsNumeric = parseInt(serviceUrlFragments.slice(-1)[0], 10).toString() === serviceUrlFragments.slice(-1)[0];
    const serviceUrl = endingIsNumeric ? `${serviceUrlFragments.slice(0, -1).join('/')}/` : this.metadataAccessPath;

    const queryUrl = serviceUrl.endsWith('/') ? `${serviceUrl}${subLayerConfig.layerId}` : `${serviceUrl}/${subLayerConfig.layerId}`;

    try {
      const { data } = await axios.get<TypeJsonObject>(`${queryUrl}?f=json`);
      if ('error' in data) logger.logError('Error detected while reading layer metadata.', data.error);
      else return data;
    } catch (error) {
      logger.logError('Error detected in fetchEsriLayerMetadata while reading ESRI metadata.', error);
    }
    subLayerConfig.setErrorDetectedFlag();
    return {};

    /*
      try {
        const { data } = await axios.get<TypeJsonObject>(`${queryUrl}?f=pjson`);
        if (data?.error) {
          layerConfig.layerStatus = 'error';
          throw new Error(`Error code = ${data.error.code}, ${data.error.message}`);
        }
        layer.setLayerMetadata(layerPath, data);
        // The following line allow the type ascention of the type guard functions on the second line below
        const EsriLayerConfig = layerConfig;
        if (geoviewEntryIsEsriDynamic(EsriLayerConfig) || geoviewEntryIsEsriFeature(EsriLayerConfig)) {
          if (!EsriLayerConfig.style) {
            const renderer = Cast<EsriBaseRenderer>(data.drawingInfo?.renderer);
            if (renderer) EsriLayerConfig.style = getStyleFromEsriRenderer(renderer);
          }
          layer.processFeatureInfoConfig(
            layerConfig as EsriDynamicLayerEntryConfig & EsriFeatureLayerEntryConfig & EsriImageLayerEntryConfig
          );
          layer.processInitialSettings(layerConfig as EsriDynamicLayerEntryConfig & EsriFeatureLayerEntryConfig & EsriImageLayerEntryConfig);
        }
        commonProcessTemporalDimension(
          layer,
          data.timeInfo as TypeJsonObject,
          EsriLayerConfig as EsriDynamicLayerEntryConfig & EsriFeatureLayerEntryConfig & EsriImageLayerEntryConfig,
          layer.type === CONST_LAYER_TYPES.ESRI_IMAGE
        );
      } catch (error) {
        layerConfig.layerStatus = 'error';
        logger.logError('Error in commonProcessLayerMetadata', layerConfig, error);
      }
    }
    return layerConfig;
    */
  }

  /**
   * Converts an esri geometry type string to a TypeStyleGeometry.
   * @param {string} esriGeometryType - The esri geometry type to convert
   * @returns {TypeStyleGeometry} The corresponding TypeStyleGeometry
   */
  protected static convertEsriGeometryTypeToOLGeometryType(esriGeometryType: string): TypeStyleGeometry {
    switch (esriGeometryType) {
      case 'esriGeometryPoint':
      case 'esriGeometryMultipoint':
        return 'point';

      case 'esriGeometryPolyline':
        return 'linestring';

      case 'esriGeometryPolygon':
      case 'esriGeometryMultiPolygon':
        return 'polygon';

      default:
        throw new Error(`Unsupported geometry type: ${esriGeometryType}`);
    }
  }
}
