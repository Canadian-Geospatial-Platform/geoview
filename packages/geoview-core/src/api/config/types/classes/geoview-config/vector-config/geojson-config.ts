import { CV_CONST_LAYER_TYPES, CV_CONST_SUB_LAYER_TYPES, CV_GEOVIEW_SCHEMA_PATH } from '@config/types/config-constants';
import { AbstractGeoviewLayerConfig } from '@config/types/classes/geoview-config/abstract-geoview-layer-config';
import { GeoJsonGroupLayerConfig } from '@config/types/classes/sub-layer-config/group-node/geojson-group-layer-config';
import { toJsonObject, TypeJsonArray, TypeJsonObject } from '@config/types/config-types';
import { TypeDisplayLanguage } from '@config/types/map-schema-types';
import { GeoJsonLayerEntryConfig } from '@config/types/classes/sub-layer-config/leaf/vector/geojson-layer-entry-config';
import { EntryConfigBaseClass } from '@config/types/classes/sub-layer-config/entry-config-base-class';
import { GeoviewLayerConfigError, GeoviewLayerInvalidParameterError } from '@config/types/classes/config-exceptions';

import { layerEntryIsGroupLayer } from '@config/types/type-guards';
import { mergeWith } from 'lodash';
import { logger } from '@/core/utils/logger';
import { createLocalizedString } from '@/core/utils/utilities';
import { Cast } from '@/app';

export type TypeGeoJsonLayerNode = GeoJsonGroupLayerConfig | GeoJsonLayerEntryConfig;

// ========================
// #region CLASS HEADER

/**
 * The GeoJson geoview layer class.
 */
export class GeoJsonLayerConfig extends AbstractGeoviewLayerConfig {
  // ==================
  // #region PROPERTIES

  /**
   * Type of GeoView layer.
   */
  override geoviewLayerType = CV_CONST_LAYER_TYPES.GEOJSON;

  /** The layer entries to use from the GeoView layer. */
  declare listOfLayerEntryConfig: EntryConfigBaseClass[] | TypeGeoJsonLayerNode[];
  // #endregion PROPERTIES

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
    if (lastPathItem.toLowerCase().endsWith('.json') || lastPathItem.toLowerCase().endsWith('.geojson')) {
      // The metadataAccessPath ends with a layer reference. It is therefore a path to a data layer rather than a path to service metadata.
      // We therefore need to correct the configuration by separating the layer index and the path to the service metadata.
      this.metadataAccessPath = metadataAccessPathItems.slice(0, -1).join('/');
      if (this.listOfLayerEntryConfig.length) {
        this.setErrorDetectedFlag();
        logger.logError('When a GeoJson metadataAccessPath ends with a layer file name, the listOfLayerEntryConfig must be  empty.');
      }
      this.listOfLayerEntryConfig = [
        this.createLeafNode(toJsonObject({ layerId: lastPathItem, layerName: createLocalizedString(lastPathItem) }), language, this)!,
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
    /** The GeoView layer schema associated to GeoJsonLayerConfig */
    return CV_GEOVIEW_SCHEMA_PATH.GEOJSON;
  }

  /**
   * The method used to implement the class factory model that returns the instance of the class based on the sublayer
   * type needed.
   *
   * @param {TypeJsonObject} layerConfig The sublayer configuration.
   * @param {TypeDisplayLanguage} language The initial language to use when interacting with the geoview layer.
   * @param {AbstractGeoviewLayerConfig} geoviewConfig The GeoView instance that owns the sublayer.
   * @param {EntryConfigBaseClass} parentNode The The parent node that owns this layer or undefined if it is the root layer.
   *
   * @returns {EntryConfigBaseClass} The sublayer instance or undefined if there is an error.
   * @override
   */
  override createLeafNode(
    layerConfig: TypeJsonObject,
    language: TypeDisplayLanguage,
    geoviewConfig: AbstractGeoviewLayerConfig,
    parentNode?: EntryConfigBaseClass
  ): EntryConfigBaseClass {
    return new GeoJsonLayerEntryConfig(layerConfig, language, geoviewConfig, parentNode);
  }

  /**
   * The method used to implement the class factory model that returns the instance of the class based on the group
   * type needed.
   *
   * @param {TypeJsonObject} layerConfig The group node configuration.
   * @param {TypeDisplayLanguage} language The initial language to use when interacting with the geoview layer.
   * @param {AbstractGeoviewLayerConfig} geoviewConfig The GeoView instance that owns the sublayer.
   * @param {EntryConfigBaseClass} parentNode The The parent node that owns this layer or undefined if it is the root layer.
   *
   * @returns {EntryConfigBaseClass} The sublayer instance or undefined if there is an error.
   * @override
   */
  override createGroupNode(
    layerConfig: TypeJsonObject,
    language: TypeDisplayLanguage,
    geoviewConfig: AbstractGeoviewLayerConfig,
    parentNode?: EntryConfigBaseClass
  ): EntryConfigBaseClass {
    return new GeoJsonGroupLayerConfig(layerConfig, language, geoviewConfig, parentNode);
  }

  /**
   * Get the service metadata from the metadataAccessPath and store it in the private property of the geoview layer.
   * @override @async
   */
  override async fetchServiceMetadata(): Promise<void> {
    try {
      if (this.metadataAccessPath.toLowerCase().endsWith('.meta')) {
        const fetchResponse = await fetch(this.metadataAccessPath);
        if (fetchResponse.status === 404) throw new GeoviewLayerConfigError('The service metadata fetch returned a 404 status (Not Found)');
        const layerMetadata = (await fetchResponse.json()) as TypeJsonObject;
        if (layerMetadata) this.setServiceMetadata(layerMetadata);
        else throw new GeoviewLayerConfigError('The metadata object returned is undefined');

        this.listOfLayerEntryConfig = this.processListOfLayerEntryConfig(this.listOfLayerEntryConfig);
        await this.fetchListOfLayerMetadata();
      }

      await this.createLayerTree();
    } catch (error) {
      // In the event of a service metadata reading error, we report the geoview layer and all its sublayers as being in error.
      this.setErrorDetectedFlag();
      this.setErrorDetectedFlagForAllLayers(this.listOfLayerEntryConfig);
      logger.logError(`Error detected while reading GeoJson metadata for geoview layer ${this.geoviewLayerId}.\n`, error);
    }
  }

  /**
   * Create a layer entry node for a specific layerId using the service metadata. The node returned can only be a
   * layer leaf or a layer group.
   *
   * @param {string} layerId The layer id to use for the subLayer creation.
   * @param {EntryConfigBaseClass | undefined} parentNode The layer's parent node.
   *
   * @returns {EntryConfigBaseClass} The subLayer created from the metadata.
   * @protected @override
   */
  protected override createLayerEntryNode(layerId: string, parentNode: EntryConfigBaseClass | undefined): EntryConfigBaseClass {
    // GV: To determine if service metadata exists, we must verify that the object is not empty.
    if (Object.keys(this.getServiceMetadata()).length === 0)
      return this.createLeafNode(
        toJsonObject({ layerId, layerName: createLocalizedString(layerId) }),
        this.getLanguage(),
        this,
        parentNode
      )!;

    // If we cannot find the layerId in the layer definitions, throw an error.
    const layerFound = this.findLayerMetadataEntry(layerId);
    if (!layerFound) {
      throw new GeoviewLayerInvalidParameterError('LayerIdNotFound', [layerId?.toString()]);
    }

    const layerConfig = mergeWith({}, layerFound, (destValue, sourceValue, key) => {
      if (key === 'layerName') return createLocalizedString(sourceValue);
      return undefined;
    });

    if (layerEntryIsGroupLayer(layerFound)) return this.createGroupNode(layerConfig, this.getLanguage(), this, parentNode);
    return this.createLeafNode(layerConfig, this.getLanguage(), this, parentNode)!;
  }

  /**
   * Create the layer tree using the service metadata.
   *
   * @returns {TypeJsonObject[]} The layer tree created from the metadata.
   * @protected @override
   */
  protected override createLayerTreeFromServiceMetadata(): EntryConfigBaseClass[] {
    let layerTree = this.getServiceMetadata()?.listOfLayerEntryConfig as TypeJsonArray;
    if (!layerTree) return [];
    if (layerTree.length > 1)
      layerTree = Cast<TypeJsonArray>({
        layerId: this.geoviewLayerId,
        layerName: 'Layer Tree',
        isLayerGroup: true,
        listOfLayerEntryConfig: layerTree,
      });

    const layerConfig = mergeWith({}, layerTree, (destValue, sourceValue, key) => {
      if (key === 'layerName') return createLocalizedString(sourceValue);
      return undefined;
    }) as TypeJsonObject;

    if (layerEntryIsGroupLayer(layerConfig)) return [this.createGroupNode(layerConfig, this.getLanguage(), this)];
    return [this.createLeafNode(layerConfig, this.getLanguage(), this)!];
  }
  // #endregion OVERRIDE

  // ==============
  // #region PUBLIC
  /** ****************************************************************************************************************************
   * This method search recursively the layerId in the layer entry of the service metadata.
   *
   * @param {string} layerId The layer identifier that must exists on the server.
   *
   * @returns {TypeJsonObject | null} The found layer from the capabilities or null if not found.
   */
  findLayerMetadataEntry(
    layerId: string,
    listOfLayerEntryConfig = this.getServiceMetadata()?.listOfLayerEntryConfig as TypeJsonArray
  ): TypeJsonObject | null {
    if (listOfLayerEntryConfig === undefined) return null;
    return listOfLayerEntryConfig.reduce((layerFound, layerEntry) => {
      if (layerFound) return layerFound;

      if (layerEntry.layerId === layerId) {
        return layerEntry;
      }

      if (layerEntry.isLayerGroup || layerEntry.entryType === CV_CONST_SUB_LAYER_TYPES.GROUP) {
        return this.findLayerMetadataEntry(layerId, layerEntry.listOfLayerEntryConfig as TypeJsonArray);
      }

      return null;
    }, null as TypeJsonObject | null);
  }

  // #endregion PUBLIC
  // #endregion METHODS
  // #endregion CLASS HEADER
}
