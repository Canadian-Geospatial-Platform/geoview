import { CV_CONST_LAYER_TYPES, CV_GEOVIEW_SCHEMA_PATH } from '@/api/config/types/config-constants';
import { AbstractGeoviewLayerConfig } from '@/api/config/types/classes/geoview-config/abstract-geoview-layer-config';
import { OgcFeatureGroupLayerConfig } from '@/api/config/types/classes/sub-layer-config/group-node/ogc-feature-group-layer-config';
import { toJsonObject, TypeJsonObject } from '@/api/config/types/config-types';
import { OgcFeatureLayerEntryConfig } from '@/api/config/types/classes/sub-layer-config/leaf/vector/ogc-feature-layer-entry-config';
import { EntryConfigBaseClass } from '@/api/config/types/classes/sub-layer-config/entry-config-base-class';
import { GeoviewLayerConfigError, GeoviewLayerInvalidParameterError } from '@/api/config/types/classes/config-exceptions';

import { logger } from '@/core/utils/logger';
import { Fetch } from '@/core/utils/fetch-helper';

export type TypeOgcFeatureLayerNode = OgcFeatureGroupLayerConfig | OgcFeatureLayerEntryConfig;

// ========================
// #region CLASS HEADER

/**
 * The OGC geoview layer class.
 */
export class OgcFeatureLayerConfig extends AbstractGeoviewLayerConfig {
  // ==================
  // #region PROPERTIES

  /**
   * Type of GeoView layer.
   */
  override geoviewLayerType = CV_CONST_LAYER_TYPES.OGC_FEATURE;

  /** The layer entries to use from the GeoView layer. */
  declare listOfLayerEntryConfig: EntryConfigBaseClass[] | TypeOgcFeatureLayerNode[];
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
      const splitMetaDataAccessPath = this.metadataAccessPath.split('collections');
      [this.metadataAccessPath] = splitMetaDataAccessPath;
      if (splitMetaDataAccessPath[1]?.replaceAll('/', ''))
        this.listOfLayerEntryConfig = [
          this.createLeafNode(toJsonObject({ layerId: splitMetaDataAccessPath[1].replaceAll('/', '') }), this)!,
        ];
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
    /** The GeoView layer schema associated to OgcFeatureLayerConfig */
    return CV_GEOVIEW_SCHEMA_PATH.OGC_FEATURE;
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
    return new OgcFeatureLayerEntryConfig(layerConfig, geoviewConfig, parentNode);
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
    return new OgcFeatureGroupLayerConfig(layerConfig, geoviewConfig, parentNode);
  }

  /**
   * Get the service metadata from the metadataAccessPath and store it in the private property of the geoview layer.
   * @override @async
   */
  override async fetchServiceMetadata(): Promise<void> {
    try {
      // The url
      const queryUrl = this.metadataAccessPath.endsWith('/')
        ? `${this.metadataAccessPath}collections?f=json`
        : `${this.metadataAccessPath}/collections?f=json`;

      // Set it
      const metadataJson = await Fetch.fetchJsonAsObject(queryUrl);

      if (metadataJson && metadataJson !== '{}') {
        this.setServiceMetadata(metadataJson);
      } else throw new GeoviewLayerConfigError('An empty metadata object was returned');

      this.listOfLayerEntryConfig = this.processListOfLayerEntryConfig(this.listOfLayerEntryConfig);
      await this.fetchListOfLayerMetadata();

      await this.createLayerTree();
    } catch (error) {
      // In the event of a service metadata reading error, we report the geoview layer and all its sublayers as being in error.
      this.setErrorDetectedFlag();
      this.setErrorDetectedFlagForAllLayers(this.listOfLayerEntryConfig);
      logger.logError(`Error detected while reading OGC metadata for geoview layer ${this.geoviewLayerId}.\n`, error);
    }
  }

  /**
   * Create the layer tree using the service metadata.
   *
   * @returns {TypeJsonObject[]} The layer tree created from the metadata.
   * @protected @override
   */
  protected override createLayerTreeFromServiceMetadata(): EntryConfigBaseClass[] {
    // Extract FeatureType array that list all available layers.
    const layers = this.getServiceMetadata().collections;

    const layerTree: EntryConfigBaseClass[] = [];
    if (Array.isArray(layers))
      layers.forEach((layer) => {
        const layerConfig = toJsonObject({
          layerId: layer.id,
          layerName: layer.description,
        });
        layerTree.push(this.createLeafNode(layerConfig, this));
      });

    return layerTree;
  }

  /**
   * Create a layer entry node for a specific layerId using the service metadata. The node returned can only be a
   * layer because the concept of group layer doesn't exist in WFS.
   *
   * @param {string} layerId The layer id to use for the subLayer creation.
   * @param {EntryConfigBaseClass | undefined} parentNode The layer's parent node.
   *
   * @returns {EntryConfigBaseClass} The subLayer created from the metadata.
   * @protected @override
   */
  protected override createLayerEntryNode(layerId: string, parentNode: EntryConfigBaseClass | undefined): EntryConfigBaseClass {
    // If we cannot find the layerId in the layer definitions, throw an error.
    const layerFound = this.findLayerMetadataEntry(layerId);
    if (!layerFound) {
      throw new GeoviewLayerInvalidParameterError('LayerIdNotFound', [layerId?.toString()]);
    }

    // Create the layer using the metadata. WFS metadata has no layer group definition.
    const layerConfig = toJsonObject({
      layerId,
      layerName: layerFound.description,
    });
    return this.createLeafNode(layerConfig, this, parentNode)!;
  }

  // #endregion OVERRIDE

  // ==============
  // #region PUBLIC

  /** ****************************************************************************************************************************
   * This method search recursively the layerId in the layer entry of the capabilities.
   *
   * @param {string} layerId The layer identifier that must exists on the server.
   *
   * @returns {TypeJsonObject | null} The found layer from the capabilities or null if not found.
   */
  findLayerMetadataEntry(layerId: string): TypeJsonObject | null {
    const serviceMetadata = this.getServiceMetadata();
    if (serviceMetadata && Array.isArray(serviceMetadata.collections)) {
      const layerFound = serviceMetadata.collections.find((layerMetadata) => layerMetadata.id === layerId);
      return layerFound || null;
    }
    return null;
  }

  // #endregion PUBLIC
  // #endregion METHODS
  // #endregion CLASS HEADER
}
