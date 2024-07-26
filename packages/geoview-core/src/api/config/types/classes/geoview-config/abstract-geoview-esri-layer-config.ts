import { toJsonObject, TypeJsonObject, TypeJsonArray } from '@config/types/config-types';
import { AbstractGeoviewLayerConfig } from '@config/types/classes/geoview-config/abstract-geoview-layer-config';
import { TypeDisplayLanguage, TypeStyleGeometry } from '@config/types/map-schema-types';
import { EsriGroupLayerConfig } from '@config/types/classes/sub-layer-config/group-node/esri-group-layer-config';
import { layerEntryIsAbstractBaseLayerEntryConfig, layerEntryIsGroupLayer } from '@config/types/type-guards';
import { ConfigError, GeoviewLayerInvalidParameterError } from '@config/types/classes/config-exceptions';
import { EntryConfigBaseClass } from '@/api/config/types/classes/sub-layer-config/entry-config-base-class';

import { getXMLHttpRequest } from '@/core/utils/utilities';
import { logger } from '@/core/utils/logger';

// #region CLASS HEADER
/**
 * The ESRI dynamic geoview layer class.
 */
export abstract class AbstractGeoviewEsriLayerConfig extends AbstractGeoviewLayerConfig {
  // #region CONSTRUCTOR
  /**
   * The class constructor.
   *
   * @param {TypeJsonObject} geoviewLayerConfig The layer configuration we want to instanciate.
   * @param {TypeDisplayLanguage} language The initial language to use when interacting with the map feature configuration.
   */
  constructor(geoviewLayerConfig: TypeJsonObject, language: TypeDisplayLanguage) {
    super(geoviewLayerConfig, language);
    const metadataAccessPathItems = this.metadataAccessPath.split('/');
    const pathItemLength = metadataAccessPathItems.length;
    const lastPathItem = metadataAccessPathItems[pathItemLength - 1];
    // GV: Important - Testing for NaN after parseInt is not a good way to check whether a string is a number, as parseInt('1a2', 10)
    // GV: returns 1 instead of NaN. To be detected as NaN, the string passed to parseInt must not begin with a number.
    // GV: Regex /^\d+$/ is used instead to check whether a string is a number.
    if (/^\d+$/.test(lastPathItem)) {
      // The metadataAccessPath ends with a layer index. It is therefore a path to a data layer rather than a path to service metadata.
      // We therefore need to correct the configuration by separating the layer index and the path to the service metadata.
      this.metadataAccessPath = metadataAccessPathItems.slice(0, -1).join('/');
      if (this.listOfLayerEntryConfig.length) {
        this.setErrorDetectedFlag();
        logger.logError('When an ESRI metadataAccessPath ends with a layer index, the listOfLayerEntryConfig must be  empty.');
      }
      this.listOfLayerEntryConfig = [this.createLeafNode(toJsonObject({ layerId: lastPathItem }), language, this)!];
    }
  }

  // #region PRIVATE METHODS
  /**
   * Create a layer entry node for a specific layerId using the service metadata.
   *
   * @param {number} layerId The layer id to use for the subLayer creation.
   *
   * @returns {EntryConfigBaseClass[]} The subLayer created from the metadata.
   */
  #createLayerEntryNode(layerId: number, parentNode: EntryConfigBaseClass | undefined): EntryConfigBaseClass {
    // Extract the layer definitions from the metadata.
    const layers = this.getServiceMetadata().layers as TypeJsonObject[];

    // If we cannot find the layerId in the layer definitions, throw an error.
    const layerFound = layerId !== undefined && layers.find((layer) => layer.id === layerId);
    if (!layerFound) {
      throw new GeoviewLayerInvalidParameterError('LayerIdNotFound', [layerId?.toString()]);
    }

    // if the layerFound is not a group layer, create a leaf.
    if (layerFound && layerFound.type !== 'Group Layer') {
      const layerConfig = toJsonObject({
        layerId: layerFound.id.toString(),
        layerName: { en: layerFound.name, fr: layerFound.name },
        geometryType: AbstractGeoviewEsriLayerConfig.convertEsriGeometryTypeToOLGeometryType(layerFound.geometryType as string),
      });
      return this.createLeafNode(layerConfig, this.getLanguage(), this, parentNode)!;
    }

    // Create the layer group from the array of layers
    const jsonConfig = this.#createGroupNode(parseInt(layerFound.id as string, 10), layerFound?.name as string);
    return this.createGroupNode(jsonConfig, this.getLanguage(), this, parentNode)!;
  }

  /**
   * Create a group node for a specific layer id.
   *
   * @param {number} parentId The layer id of the parent node.
   * @param {string} groupName The name to assign to the group node.
   *
   * @returns {TypeJsonObject} A json configuration that can be used to create the group node.
   * @private
   */
  #createGroupNode = (parentId: number, groupName: string): TypeJsonObject => {
    const layers = this.getServiceMetadata().layers as TypeJsonObject[];
    const listOfLayerEntryConfig = layers.reduce((accumulator, layer) => {
      if (layer.parentLayerId === parentId) {
        if (layer.type === 'Group Layer') accumulator.push(this.#createGroupNode(layer.id as number, layer.name as string));
        else {
          accumulator.push(
            toJsonObject({
              layerId: layer.id.toString(),
              layerName: { en: layer.name, fr: layer.name },
              geometryType: AbstractGeoviewEsriLayerConfig.convertEsriGeometryTypeToOLGeometryType(layer.geometryType as string),
            })
          );
        }
      }
      return accumulator;
    }, [] as TypeJsonObject[]);

    return toJsonObject({
      layerId: parentId === -1 ? groupName : `${parentId}`,
      layerName: { en: groupName, fr: groupName },
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
    listOfLayerEntryConfig.forEach((subLayerConfig) => {
      if (layerEntryIsGroupLayer(subLayerConfig)) {
        listOfLayerMetadata.push(subLayerConfig.fetchLayerMetadata());
        listOfLayerMetadata.push(this.#fetchListOfLayerMetadata(subLayerConfig.listOfLayerEntryConfig));
      } else if (layerEntryIsAbstractBaseLayerEntryConfig(subLayerConfig)) {
        listOfLayerMetadata.push(subLayerConfig.fetchLayerMetadata());
      }
    });

    await Promise.allSettled(listOfLayerMetadata);
    logger.logDebug(listOfLayerEntryConfig);
  }

  // #region PROTECTED METHODS
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

  // #region PUBLIC METHODS
  /**
   * Get the service metadata from the metadataAccessPath and store it in a protected property of the geoview layer.
   */
  override async fetchServiceMetadata(): Promise<void> {
    const metadataString = await getXMLHttpRequest(`${this.metadataAccessPath}?f=json`);
    if (metadataString !== '{}') {
      let jsonMetadata: TypeJsonObject;
      try {
        // On rare occasions, the value returned is not a JSON string, but rather an HTML string, which is an error.
        jsonMetadata = JSON.parse(metadataString);
      } catch (error) {
        jsonMetadata = toJsonObject({ error });
      }
      // Other than the error generated above, if the returned JSON object is valid and contains the error property, something went wrong
      if ('error' in jsonMetadata) {
        // In the event of a service metadata reading error, we report the geoview layer and all its sublayers as being in error.
        this.setErrorDetectedFlag();
        this.setErrorDetectedFlagForAllLayers(this.listOfLayerEntryConfig);
        logger.logError(`Error detected while reading ESRI metadata for geoview layer ${this.geoviewLayerId}.`, jsonMetadata.error);
      } else {
        this.setServiceMetadata(jsonMetadata);

        // Define a recursive function to process the listOfLayerEntryConfig. The goal is to process each valid sublayer, searching the
        // service's metadata to verify the layer's existence and determine whether it is a layer group, in order to determine the node's
        // final structure. If it is a layer group, it will be created.
        const processListOfLayerEntryConfig = (listOfLayerEntryConfig: EntryConfigBaseClass[]): void => {
          listOfLayerEntryConfig.forEach((subLayer, i) => {
            if (!subLayer.getErrorDetectedFlag()) {
              if (layerEntryIsGroupLayer(subLayer)) processListOfLayerEntryConfig(subLayer.listOfLayerEntryConfig);
              else {
                try {
                  // The next line instanciate a new node that will replace the one currently stored in the listOfLayerEntryConfig[i]
                  // Since listOfLayerEntryConfig is the function parameter, we must disable the eslint no-param-reassign
                  // eslint-disable-next-line no-param-reassign
                  listOfLayerEntryConfig[i] = this.#createLayerEntryNode(parseInt(subLayer.layerId, 10), subLayer.getParentNode());
                } catch (error) {
                  listOfLayerEntryConfig[i].setErrorDetectedFlag();
                  logger.logError((error as ConfigError).message, error);
                }
              }
            }
          });
        };

        // Call the function defined above.
        processListOfLayerEntryConfig(this.listOfLayerEntryConfig);
        // When a list of layer entries is specified, the layer tree is the same as the resulting listOfLayerEntryConfig of the geoview instance.
        // Otherwise, a layer tree is built using all the layers that compose the metadata.
        this.setMetadataLayerTree(this.listOfLayerEntryConfig.length ? this.listOfLayerEntryConfig : this.createLayerTree());
        await this.#fetchListOfLayerMetadata(this.listOfLayerEntryConfig);
      }
    } else {
      this.setErrorDetectedFlag();
      this.setErrorDetectedFlagForAllLayers(this.listOfLayerEntryConfig);
      logger.logError(`Error detected while reading ESRI metadata for geoview layer ${this.geoviewLayerId}. An empty object was returned.`);
    }
  }

  /**
   * Create the layer tree using the service metadata.
   *
   * @returns {TypeJsonObject[]} The layer tree created from the metadata.
   * @protected
   */
  protected createLayerTree(): EntryConfigBaseClass[] {
    const layers = this.getServiceMetadata().layers as TypeJsonArray;
    if (layers.length > 1) {
      const groupName = this.getServiceMetadata().mapName as string;
      return [new EsriGroupLayerConfig(this.#createGroupNode(-1, groupName), this.getLanguage(), this)];
    }

    if (layers.length === 1)
      return [
        this.createLeafNode(
          toJsonObject({
            layerId: layers[0].id.toString(),
            layerName: { en: layers[0].name, fr: layers[0].name },
            geometryType: AbstractGeoviewEsriLayerConfig.convertEsriGeometryTypeToOLGeometryType(layers[0].geometryType as string),
          }),
          this.getLanguage(),
          this
        )!,
      ];

    return [];
  }
}
