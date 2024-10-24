import { toJsonObject, TypeJsonObject, TypeJsonArray } from '@config/types/config-types';
import { AbstractGeoviewLayerConfig } from '@config/types/classes/geoview-config/abstract-geoview-layer-config';
import { TypeDisplayLanguage, TypeStyleGeometry } from '@config/types/map-schema-types';
import { EsriGroupLayerConfig } from '@config/types/classes/sub-layer-config/group-node/esri-group-layer-config';
import { GeoviewLayerConfigError, GeoviewLayerInvalidParameterError } from '@config/types/classes/config-exceptions';
import { EntryConfigBaseClass } from '@/api/config/types/classes/sub-layer-config/entry-config-base-class';

import { createLocalizedString, getXMLHttpRequest } from '@/core/utils/utilities';
import { logger } from '@/core/utils/logger';

// ========================
// #region CLASS HEADER
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
          this.listOfLayerEntryConfig = this.processListOfLayerEntryConfig(this.listOfLayerEntryConfig);
          await this.fetchListOfLayerMetadata();

          await this.createLayerTree();
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

  /**
   * Create a layer entry node for a specific layerId using the service metadata. The node returned can be a
   * layer or a group layer.
   *
   * @param {string} layerId The layer id to use for the subLayer creation.
   * @param {EntryConfigBaseClass | undefined} parentNode The layer's parent node.
   *
   * @returns {EntryConfigBaseClass} The subLayer created from the metadata.
   * @protected @override
   */
  protected override createLayerEntryNode(layerId: string, parentNode: EntryConfigBaseClass | undefined): EntryConfigBaseClass {
    let layerFound: TypeJsonObject | null = null;

    // test to find if the GeoView layer is linked to an ESRI Image service.
    const serviceMetadata = this.getServiceMetadata();
    if ((serviceMetadata?.serviceDataType as string)?.toLowerCase?.().includes?.('esriimageservice')) {
      // If it is the case, the layer's metadata are the service metadata.
      if (layerId !== (serviceMetadata.name as string)) throw new GeoviewLayerInvalidParameterError('LayerIdNotFound', [layerId]);
      const layerConfig = toJsonObject({
        layerId,
        layerName: createLocalizedString(layerId),
      });
      return this.createLeafNode(layerConfig, this.getLanguage(), this, parentNode)!;
    }

    // If we cannot find the layerId in the layer definitions, throw an error.
    layerFound = this.#findLayerMetadataEntry(Number(layerId));
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
   * Create the layer tree using the service metadata.
   *
   * @returns {TypeJsonObject[]} The layer tree created from the metadata.
   * @protected @override
   */
  protected override createLayerTreeFromServiceMetadata(): EntryConfigBaseClass[] {
    // test to find if the GeoView layer is linked to an ESRI Image service.
    const serviceMetadata = this.getServiceMetadata();
    if ((serviceMetadata?.serviceDataType as string)?.toLowerCase?.().includes?.('esriimageservice')) {
      // If it is the case, the layer's metadata are the service metadata.
      return [
        this.createLeafNode(
          toJsonObject({
            layerId: serviceMetadata.name,
            layerName: createLocalizedString(serviceMetadata.name)!,
          }),
          this.getLanguage(),
          this
        )!,
      ];
    }

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
  // #endregion OVERRIDE

  // ================
  // #region PRIVATE
  /** ****************************************************************************************************************************
   * This method search the layerId in the layer entry of the capabilities.
   *
   * @param {number} layerId The layer identifier that must exists on the server.
   * @param {TypeJsonObject | undefined} layerd The layer entry from the service metadata that will be searched.
   *
   * @returns {TypeJsonObject | null} The found layer from the capabilities or null if not found.
   * @private
   */
  #findLayerMetadataEntry(layerId: number, layers = this.getServiceMetadata().layers as TypeJsonArray | undefined): TypeJsonObject | null {
    if (layerId === undefined) return null;

    // If we cannot find the layerId in the layer definitions, return a null value.
    return layers?.find?.((layer) => layer.id === layerId) || null;
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

  // ==============
  // #region STATIC
  /**
   * Converts an esri geometry type string to a TypeStyleGeometry.
   * @param {string} esriGeometryType - The esri geometry type to convert
   * @returns {TypeStyleGeometry} The corresponding TypeStyleGeometry
   * @static
   */
  static convertEsriGeometryTypeToOLGeometryType(esriGeometryType: string): TypeStyleGeometry {
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
  // #endregion STATIC
  // #endregion METHODS
  // #endregion CLASS HEADER
}
