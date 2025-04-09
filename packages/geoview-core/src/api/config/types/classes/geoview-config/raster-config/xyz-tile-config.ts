import { mergeWith } from 'lodash';
import { CV_CONST_LAYER_TYPES, CV_GEOVIEW_SCHEMA_PATH } from '@/api/config/types/config-constants';
import { AbstractGeoviewLayerConfig } from '@/api/config/types/classes/geoview-config/abstract-geoview-layer-config';
import { XyzGroupLayerConfig } from '@/api/config/types/classes/sub-layer-config/group-node/xyz-group-layer-config';
import { toJsonObject, TypeJsonArray, TypeJsonObject } from '@/api/config/types/config-types';
import { XyzLayerEntryConfig } from '@/api/config/types/classes/sub-layer-config/leaf/raster/xyz-layer-entry-config';
import { EntryConfigBaseClass } from '@/api/config/types/classes/sub-layer-config/entry-config-base-class';
import { layerEntryIsGroupLayer } from '@/api/config/types/type-guards';
import { GeoviewLayerConfigError, GeoviewLayerInvalidParameterError } from '@/api/config/types/classes/config-exceptions';

import { logger } from '@/core/utils/logger';
import { isJsonString } from '@/core/utils/utilities';

export type TypeXyzLayerNode = XyzGroupLayerConfig | XyzLayerEntryConfig;

// ========================
// #region CLASS HEADER

/**
 * The XYZ tile geoview layer class.
 */
export class XyzLayerConfig extends AbstractGeoviewLayerConfig {
  // ==================
  // #region PROPERTIES

  /**
   * Type of GeoView layer.
   */
  override geoviewLayerType = CV_CONST_LAYER_TYPES.XYZ_TILES;

  /** The layer entries to use from the GeoView layer. */
  declare listOfLayerEntryConfig: EntryConfigBaseClass[] | TypeXyzLayerNode[];
  // #endregion PROPERTIES

  // ===================
  // #region CONSTRUCTOR
  /**
   * The class constructor.
   *
   * @param {TypeJsonObject} geoviewLayerConfig The layer configuration we want to instanciate.
   */
  constructor(geoviewLayerConfig: TypeJsonObject) {
    super(geoviewLayerConfig);

    if (this.metadataAccessPath) {
      if (this.metadataAccessPath.toLowerCase().includes('{z}/{y}/{x}')) {
        // The metadataAccessPath includes with a tile reference. It is therefore a path to a tiles rather than a path to service metadata.
        // We therefore need to correct the configuration by separating the layer index and the path to the service metadata.
        if (this.listOfLayerEntryConfig.length) {
          this.setErrorDetectedFlag();
          logger.logError('When a XYZ tile metadataAccessPath ends is a tile source, the listOfLayerEntryConfig must be empty.');
        }
      }
    }
  }

  // #endregion CONSTRUCTOR

  // ===============
  // #region METHODS
  /*
   * Methods are listed in the following order: abstract, override, private, protected, public and static.
   */

  // ================
  // #region OVERRIDE
  /**
   * The getter method that returns the geoview layer schema to use for the validation. Each geoview layer type knows what
   * section of the schema must be used to do its validation.
   *
   * @returns {string} The GeoView layer schema associated to the config.
   * @protected @override
   */
  protected override getGeoviewLayerSchema(): string {
    /** The GeoView layer schema associated to XyzLayerConfig */
    return CV_GEOVIEW_SCHEMA_PATH.XYZ_TILES;
  }

  /**
   * The method used to implement the class factory model that returns the instance of the class based on the sublayer
   * type needed.
   *
   * @param {TypeJsonObject} layerConfig The sublayer configuration.
   * @param {AbstractGeoviewLayerConfig} geoviewConfig The GeoView instance that owns the sublayer.
   * @param {EntryConfigBaseClass} parentNode The The parent node that owns this layer or undefined if it is the root layer.
   *
   * @returns {EntryConfigBaseClass} The sublayer instance or undefined if there is an error.
   * @override
   */
  override createLeafNode(
    layerConfig: TypeJsonObject,
    geoviewConfig: AbstractGeoviewLayerConfig,
    parentNode?: EntryConfigBaseClass
  ): EntryConfigBaseClass {
    return new XyzLayerEntryConfig(layerConfig, geoviewConfig, parentNode);
  }

  /**
   * The method used to implement the class factory model that returns the instance of the class based on the group
   * type needed.
   *
   * @param {TypeJsonObject} layerConfig The group node configuration.
   * @param {AbstractGeoviewLayerConfig} geoviewConfig The GeoView instance that owns the sublayer.
   * @param {EntryConfigBaseClass} parentNode The The parent node that owns this layer or undefined if it is the root layer.
   *
   * @returns {EntryConfigBaseClass} The sublayer instance or undefined if there is an error.
   * @override
   */
  override createGroupNode(
    layerConfig: TypeJsonObject,
    geoviewConfig: AbstractGeoviewLayerConfig,
    parentNode?: EntryConfigBaseClass
  ): EntryConfigBaseClass {
    return new XyzGroupLayerConfig(layerConfig, geoviewConfig, parentNode);
  }

  /**
   * Overrides the way the metadata is fetched and set in the 'metadata' property. Resolves when done.
   * @returns {Promise<void>} A promise that the execution is completed.
   */
  override async fetchServiceMetadata(): Promise<void> {
    let metadataUrl = this.metadataAccessPath;
    if (!metadataUrl.toLowerCase().endsWith('.meta') && !metadataUrl.toLowerCase().endsWith('json'))
      metadataUrl = this.metadataAccessPath.endsWith('/') ? `${this.metadataAccessPath}?f=json` : `${this.metadataAccessPath}/?f=json`;
    try {
      if (metadataUrl.toLowerCase().endsWith('.meta') || metadataUrl.toLowerCase().endsWith('f=json')) {
        const fetchResponse = await fetch(metadataUrl);
        if (fetchResponse.status === 404) throw new GeoviewLayerConfigError('The service metadata fetch returned a 404 status (Not Found)');
        const layerMetadataString = await fetchResponse.text();
        let layerMetadata = null;
        // Check if the response text is valid json. isJsonString will throw an error if it is not, and we want to catch it separately.
        try {
          if (isJsonString(layerMetadataString)) layerMetadata = toJsonObject(JSON.parse(layerMetadataString));
        } catch (err) {
          logger.logError('Response from metadataAccessPath was not JSON', err);
        }
        if (layerMetadata) this.setServiceMetadata(layerMetadata);
        else throw new GeoviewLayerConfigError('The metadata object returned is undefined');

        this.listOfLayerEntryConfig = this.processListOfLayerEntryConfig(this.listOfLayerEntryConfig);
        await this.fetchListOfLayerMetadata();
      }

      await this.createLayerTree();
    } catch (error) {
      logger.logWarning("The service metadata for the XYZ tile couldn't be read, skipped.", error);
    }
  }

  /**
   * Create a layer entry node for a specific layerId using the service metadata. The node returned can be a
   * layer or a group layer.
   *
   * @param {string} layerId The layer id to use for the subLayer creation.
   * @param {TypeXyzLayerNode | undefined} parentNode The layer's parent node.
   *
   * @returns {TypeXyzLayerNode} The subLayer created from the metadata.
   * @protected @override
   */
  protected override createLayerEntryNode(layerId: string, parentNode: EntryConfigBaseClass | undefined): EntryConfigBaseClass {
    // GV: To determine if service metadata exists, we must verify that the object is not empty.
    if (Object.keys(this.getServiceMetadata()).length === 0)
      return this.createLeafNode(toJsonObject({ layerId, layerName: layerId }), this, parentNode)!;

    // If we cannot find the layerId in the layer definitions, throw an error.
    const layerFound = this.findLayerMetadataEntry(layerId);
    if (!layerFound) {
      throw new GeoviewLayerInvalidParameterError('LayerIdNotFound', [layerId?.toString()]);
    }

    const layerConfig = mergeWith({}, layerFound, (destValue, sourceValue, key) => {
      if (key === 'layerName') return sourceValue;
      return undefined;
    });

    if (layerEntryIsGroupLayer(layerFound)) return this.createGroupNode(layerConfig, this, parentNode);

    return this.createLeafNode(layerConfig, this, parentNode)!;
  }

  /**
   * Create the layer tree using the service metadata.
   *
   * @returns {TypeJsonObject[]} The layer tree created from the metadata.
   * @protected @override
   */
  protected override createLayerTreeFromServiceMetadata(): EntryConfigBaseClass[] {
    const listOfLayerEntryConfig: TypeJsonObject[] | undefined = this.getServiceMetadata()?.listOfLayerEntryConfig as TypeJsonObject[];
    if (!listOfLayerEntryConfig) return [];

    const layerTree: EntryConfigBaseClass[] = [];
    listOfLayerEntryConfig.forEach((layerEntryConfig) => {
      const layerConfig = mergeWith({}, layerEntryConfig, (destValue, sourceValue, key) => {
        if (key === 'layerName') return sourceValue;
        return undefined;
      }) as TypeJsonObject;

      if (layerEntryIsGroupLayer(layerConfig)) layerTree.push(this.createGroupNode(layerConfig, this));
      else layerTree.push(this.createLeafNode(layerConfig, this));
    });

    return layerTree;
  }
  // #endregion OVERRIDE

  // ==============
  // #region PUBLIC
  /** ****************************************************************************************************************************
   * This method search recursively the layerId in the layer entry of the capabilities.
   *
   * @param {string} layerId The layer identifier that must exists on the server.
   * @param {TypeJsonObject | undefined} layer The layer entry from the capabilities that will be searched.
   *
   * @returns {TypeJsonObject | null} The found layer from the capabilities or null if not found.
   */
  findLayerMetadataEntry(layerId: string, metadata: TypeJsonObject | undefined = this.getServiceMetadata()): TypeJsonObject | null {
    let metadataLayerConfigFound: TypeJsonObject | undefined | null = null;
    if (metadata?.listOfLayerEntryConfig) {
      metadataLayerConfigFound = (metadata?.listOfLayerEntryConfig as TypeJsonArray).find(
        (metadataLayerConfig) => metadataLayerConfig.layerId === layerId
      );
    }

    // For ESRI MapServer XYZ Tiles
    if (metadata?.layers) {
      metadataLayerConfigFound = (metadata?.layers as TypeJsonArray).find(
        (metadataLayerConfig) => metadataLayerConfig.id.toString() === layerId
      );
    }

    if (metadataLayerConfigFound === undefined) metadataLayerConfigFound = null;

    return metadataLayerConfigFound;
  }

  // #endregion PUBLIC
  // #endregion METHODS
  // #endregion CLASS HEADER
}
