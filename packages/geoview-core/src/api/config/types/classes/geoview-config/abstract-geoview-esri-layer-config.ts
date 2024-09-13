import { toJsonObject, TypeJsonObject, TypeJsonArray, Cast } from '@config/types/config-types';
import { AbstractGeoviewLayerConfig } from '@config/types/classes/geoview-config/abstract-geoview-layer-config';
import { TypeDisplayLanguage, TypeStyleGeometry } from '@config/types/map-schema-types';
import { EsriGroupLayerConfig } from '@config/types/classes/sub-layer-config/group-node/esri-group-layer-config';
import { layerEntryIsGroupLayer } from '@config/types/type-guards';
import { ConfigError, GeoviewLayerConfigError, GeoviewLayerInvalidParameterError } from '@config/types/classes/config-exceptions';
import { EntryConfigBaseClass } from '@/api/config/types/classes/sub-layer-config/entry-config-base-class';

import { createLocalizedString, getXMLHttpRequest } from '@/core/utils/utilities';
import { logger } from '@/core/utils/logger';

// ========================
// #region CLASS DEFINITION
/**
 * The ESRI dynamic geoview layer class.
 */
export abstract class AbstractGeoviewEsriLayerConfig extends AbstractGeoviewLayerConfig {
  // ===================
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
  // #endregion CONSTRUCTOR

  // ===============
  // #region METHODS
  /*
   * Methods are listed in the following order: abstract, override, private, protected and public.
   */
  // ================
  // #region OVERRIDE
  /**
   * Get the service metadata from the metadataAccessPath and store it in a protected property of the geoview layer.
   * Verify that all sublayers defined in the listOfLayerEntryConfig exist in the metadata and fetch all sublayers metadata.
   * If the metadata layer tree property is defined, build it using the service metadata.
   * @override @async
   */
  override async fetchServiceMetadata(): Promise<void> {
    try {
      const metadataString = await getXMLHttpRequest(`${this.metadataAccessPath}?f=json`);
      if (metadataString && metadataString !== '{}') {
        let jsonMetadata: TypeJsonObject;
        try {
          // On rare occasions, the value returned is not a JSON string, but rather an HTML string, which is an error.
          jsonMetadata = JSON.parse(metadataString);
        } catch (error) {
          logger.logError('The service metadata request returned an invalid JSON string.\n', error);
          throw new GeoviewLayerConfigError('Invalid JSON string');
        }
        // Other than the error generated above, if the returned JSON object is valid and contains the error property, something went wrong
        if ('error' in jsonMetadata) {
          logger.logError('The service metadata request returned an an error object.\n', jsonMetadata.error);
          throw new GeoviewLayerConfigError('See error description above');
        } else {
          this.setServiceMetadata(jsonMetadata);
          this.listOfLayerEntryConfig = this.#processListOfLayerEntryConfig(this.listOfLayerEntryConfig);
          await this.fetchListOfLayerMetadata();

          await this.#createLayerTree();
        }
      } else {
        throw new GeoviewLayerConfigError('An empty metadata object was returned');
      }
    } catch (error) {
      // In the event of a service metadata reading error, we report the geoview layer and all its sublayers as being in error.
      this.setErrorDetectedFlag();
      this.setErrorDetectedFlagForAllLayers(this.listOfLayerEntryConfig);
      logger.logError(`Error detected while reading ESRI metadata for geoview layer ${this.geoviewLayerId}.\n`, error);
    }
  }
  // #endregion OVERRIDE
  // #region PRIVATE

  /**
   * A recursive method to process the listOfLayerEntryConfig. The goal is to process each valid sublayer, searching the service's
   * metadata to verify the layer's existence and whether it is a layer group, in order to determine the node's final structure.
   * If it is a layer group, it will be created.
   *
   * @param {EntryConfigBaseClass[]} listOfLayerEntryConfig the list of sublayers to process.
   *
   * @returns {EntryConfigBaseClass[]} the new list of sublayer configurations.
   * @private
   */
  #processListOfLayerEntryConfig(listOfLayerEntryConfig: EntryConfigBaseClass[]): EntryConfigBaseClass[] {
    return listOfLayerEntryConfig.map((subLayer) => {
      if (subLayer.getErrorDetectedFlag()) return subLayer;

      if (layerEntryIsGroupLayer(subLayer)) {
        // The next line replace the listOfLayerEntryConfig stored in the subLayer parameter
        // Since subLayer is the function parameter, we must disable the eslint no-param-reassign
        // eslint-disable-next-line no-param-reassign
        subLayer.listOfLayerEntryConfig = this.#processListOfLayerEntryConfig(subLayer.listOfLayerEntryConfig);
        return subLayer;
      }

      try {
        return this.#createLayerEntryNode(parseInt(subLayer.layerId, 10), subLayer.getParentNode());
      } catch (error) {
        subLayer.setErrorDetectedFlag();
        logger.logError((error as ConfigError).message, error);
        return subLayer;
      }
    });
  }

  /**
   * Create a layer entry node for a specific layerId using the service metadata. The node returned can be a
   * layer or a group layer.
   *
   * @param {number} layerId The layer id to use for the subLayer creation.
   * @param {EntryConfigBaseClass | undefined} parentNode The layer's parent node.
   *
   * @returns {EntryConfigBaseClass} The subLayer created from the metadata.
   * @private
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
        layerName: createLocalizedString(layerFound.name),
        geometryType: AbstractGeoviewEsriLayerConfig.convertEsriGeometryTypeToOLGeometryType(layerFound.geometryType as string),
      });
      return this.createLeafNode(layerConfig, this.getLanguage(), this, parentNode)!;
    }

    // Create the layer group from the array of layers
    const jsonConfig = this.#createGroupNodeJsonConfig(parseInt(layerFound.id as string, 10), layerFound?.name as string);
    return this.createGroupNode(jsonConfig, this.getLanguage(), this, parentNode)!;
  }

  /**
   * Create a group node JSON configuration for a specific layer id.
   *
   * @param {number} parentId The layer id of the parent node.
   * @param {string} groupName The name to assign to the group node.
   *
   * @returns {TypeJsonObject} A json configuration that can be used to create the group node.
   * @private
   */
  #createGroupNodeJsonConfig = (parentId: number, groupName: string): TypeJsonObject => {
    const layersArray = this.getServiceMetadata().layers as TypeJsonObject[];
    const listOfLayerEntryConfig = layersArray.reduce((accumulator, layer) => {
      if (layer.parentLayerId === parentId) {
        if (layer.type === 'Group Layer') accumulator.push(this.#createGroupNodeJsonConfig(layer.id as number, layer.name as string));
        else {
          accumulator.push(
            toJsonObject({
              layerId: layer.id.toString(),
              layerName: createLocalizedString(layer.name),
              geometryType: AbstractGeoviewEsriLayerConfig.convertEsriGeometryTypeToOLGeometryType(layer.geometryType as string),
            })
          );
        }
      }
      return accumulator;
    }, [] as TypeJsonObject[]);

    return toJsonObject({
      layerId: parentId === -1 ? groupName : `${parentId}`,
      layerName: createLocalizedString(groupName),
      isLayerGroup: true,
      listOfLayerEntryConfig,
    });
  };
  // #endregion PRIVATE
  // #region PROTECTED

  /**
   * Converts an esri geometry type string to a TypeStyleGeometry.
   * @param {string} esriGeometryType - The esri geometry type to convert
   * @returns {TypeStyleGeometry} The corresponding TypeStyleGeometry
   * @protected @static
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

  /**
   * Create the layer tree associated to the GeoView layer if the layer tree filter stored in the metadataLayerTree private property
   * is set.
   * @private
   */
  async #createLayerTree(): Promise<void> {
    let layerTreeFilter = this.getMetadataLayerTree();
    if (layerTreeFilter !== undefined) {
      if (layerTreeFilter.length === 0) {
        this.setMetadataLayerTree(this.#processListOfLayerEntryConfig(this.#createLayerTreeFromServiceMetadata()));
      } else {
        if (layerTreeFilter.length > 1) {
          layerTreeFilter = [
            Cast<EntryConfigBaseClass>({
              layerId: this.geoviewLayerId,
              layerName: createLocalizedString(this.geoviewLayerName),
              isLayerGroup: true,
              listOfLayerEntryConfig: layerTreeFilter,
            }),
          ];
        }

        // Instanciate the sublayer list.
        layerTreeFilter = layerTreeFilter
          ?.map((layerFilter) => {
            if (layerEntryIsGroupLayer(layerFilter))
              return this.createGroupNode(Cast<TypeJsonObject>(layerFilter), this.getLanguage(), this);
            return this.createLeafNode(Cast<TypeJsonObject>(layerFilter), this.getLanguage(), this);
          })
          // When a sublayer cannot be created, the value returned is undefined. These values will be filtered.
          ?.filter((subLayerConfig) => {
            return subLayerConfig;
          }) as EntryConfigBaseClass[];

        this.applyDefaultValues();
        this.setMetadataLayerTree(this.#processListOfLayerEntryConfig(layerTreeFilter));
      }
      await this.fetchListOfLayerMetadata(this.getMetadataLayerTree());
    }
  }

  /**
   * Create the layer tree using the service metadata.
   *
   * @returns {TypeJsonObject[]} The layer tree created from the metadata.
   * @private
   */
  #createLayerTreeFromServiceMetadata(): EntryConfigBaseClass[] {
    const layers = this.getServiceMetadata().layers as TypeJsonArray;
    if (layers.length > 1) {
      const groupName = this.getServiceMetadata().mapName as string;
      return [new EsriGroupLayerConfig(this.#createGroupNodeJsonConfig(-1, groupName), this.getLanguage(), this)];
    }

    if (layers.length === 1)
      return [
        this.createLeafNode(
          toJsonObject({
            layerId: layers[0].id.toString(),
            layerName: createLocalizedString(layers[0].name)!,
            geometryType: AbstractGeoviewEsriLayerConfig.convertEsriGeometryTypeToOLGeometryType(layers[0].geometryType as string),
          }),
          this.getLanguage(),
          this
        )!,
      ];

    return [];
  }
  // #endregion PROTECTED
  // #endregion METHODS
  // #endregion CLASS DEFINITION
}
