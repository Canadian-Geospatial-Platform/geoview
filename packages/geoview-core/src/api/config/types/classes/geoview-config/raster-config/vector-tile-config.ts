import { mergeWith } from 'lodash';
import { CV_CONST_LAYER_TYPES, CV_GEOVIEW_SCHEMA_PATH } from '@/api/config/types/config-constants';
import { AbstractGeoviewLayerConfig } from '@/api/config/types/classes/geoview-config/abstract-geoview-layer-config';
import { toJsonObject, TypeJsonArray, TypeJsonObject } from '@/api/config/types/config-types';
import { VectorTileLayerEntryConfig } from '@/api/config/types/classes/sub-layer-config/leaf/raster/vector-tile-layer-entry-config';
import { VectorTileGroupLayerConfig } from '@/api/config/types/classes/sub-layer-config/group-node/vector-tile-group-layer-config';
import { Projection } from '@/geo/utils/projection';
import { EntryConfigBaseClass } from '@/api/config/types/classes/sub-layer-config/entry-config-base-class';
import { layerEntryIsGroupLayer } from '@/api/config/types/type-guards';
import { GeoviewLayerConfigError, GeoviewLayerInvalidParameterError } from '@/api/config/types/classes/config-exceptions';

import { logger } from '@/core/utils/logger';

export type TypeVectorTileLayerNode = VectorTileGroupLayerConfig | VectorTileLayerEntryConfig;

// ========================
// #region CLASS HEADER

/**
 * The vector tile geoview layer class.
 */
export class VectorTileLayerConfig extends AbstractGeoviewLayerConfig {
  // ==================
  // #region PROPERTIES

  /**
   * Type of GeoView layer.
   */
  override geoviewLayerType = CV_CONST_LAYER_TYPES.VECTOR_TILES;

  /** The layer entries to use from the GeoView layer. */
  declare listOfLayerEntryConfig: EntryConfigBaseClass[] | TypeVectorTileLayerNode[];
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
      if (this.metadataAccessPath.toLowerCase().endsWith('tile/{z}/{y}/{x}.pbf')) {
        // The metadataAccessPath ends with a tile reference. It is therefore a path to a tiles rather than a path to service metadata.
        // We therefore need to correct the configuration by separating the layer index and the path to the service metadata.
        this.metadataAccessPath = this.metadataAccessPath.toLowerCase().replace('tile/{z}/{y}/{x}.pbf', '');
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
    /** The GeoView layer schema associated to VectorTileLayerConfig */
    return CV_GEOVIEW_SCHEMA_PATH.VECTOR_TILES;
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
    return new VectorTileLayerEntryConfig(layerConfig, geoviewConfig, parentNode);
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
    return new VectorTileGroupLayerConfig(layerConfig, geoviewConfig, parentNode);
  }

  /**
   * Overrides the way the metadata is fetched and set in the 'metadata' property. Resolves when done.
   * @returns {Promise<void>} A promise that the execution is completed.
   */
  override async fetchServiceMetadata(): Promise<void> {
    try {
      const metadataUrl = this.metadataAccessPath.endsWith('/')
        ? `${this.metadataAccessPath}?f=json`
        : `${this.metadataAccessPath}/?f=json`;
      const metadataResponse = await fetch(metadataUrl);
      if (metadataResponse) {
        const jsonMetadata = await metadataResponse.json();
        // Other than the error generated above, if the returned JSON object is valid and contains the error property, something went wrong
        if ('error' in jsonMetadata) {
          logger.logError('The service metadata request returned an an error object.\n', jsonMetadata.error);
          throw new GeoviewLayerConfigError('See error description above');
        } else {
          this.setServiceMetadata(jsonMetadata);

          // Add projection definition if not already included
          if (jsonMetadata?.tileInfo?.spatialReference) {
            try {
              Projection.getProjectionFromObj(jsonMetadata.tileInfo.spatialReference);
            } catch (error) {
              logger.logError('Unsupported projection, attempting to add projection now.', error);
              await Projection.addProjection(jsonMetadata.tileInfo.spatialReference);
            }
          }

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
      logger.logError(`Error detected while reading metadata for geoview layer ${this.geoviewLayerId}.\n`, error);
    }
  }

  /**
   * Create a layer entry node for a specific layerId using the service metadata. The node returned can be a
   * layer or a group layer.
   *
   * @param {string} layerId The layer id to use for the subLayer creation.
   * @param {TypeVectorTileLayerNode | undefined} parentNode The layer's parent node.
   *
   * @returns {TypeVectorTileLayerNode} The subLayer created from the metadata.
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

    if (metadataLayerConfigFound === undefined) metadataLayerConfigFound = null;

    return metadataLayerConfigFound;
  }

  // #endregion PUBLIC
  // #endregion METHODS
  // #endregion CLASS HEADER
}
