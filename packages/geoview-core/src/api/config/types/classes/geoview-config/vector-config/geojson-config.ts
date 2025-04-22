import { mergeWith } from 'lodash';
import { CV_CONST_LAYER_TYPES, CV_CONST_SUB_LAYER_TYPES, CV_GEOVIEW_SCHEMA_PATH } from '@/api/config/types/config-constants';
import { AbstractGeoviewLayerConfig } from '@/api/config/types/classes/geoview-config/abstract-geoview-layer-config';
import { GeoJsonGroupLayerConfig } from '@/api/config/types/classes/sub-layer-config/group-node/geojson-group-layer-config';
import { toJsonObject, TypeJsonArray, TypeJsonObject } from '@/api/config/types/config-types';
import { GeoJsonLayerEntryConfig } from '@/api/config/types/classes/sub-layer-config/leaf/vector/geojson-layer-entry-config';
import { EntryConfigBaseClass } from '@/api/config/types/classes/sub-layer-config/entry-config-base-class';
import { GeoviewLayerInvalidParameterError } from '@/api/config/types/classes/config-exceptions';

import { layerEntryIsGroupLayer } from '@/api/config/types/type-guards';
import { Fetch } from '@/core/utils/fetch-helper';
import { logger } from '@/core/utils/logger';

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
   */
  constructor(geoviewLayerConfig: TypeJsonObject) {
    super(geoviewLayerConfig);
    if (this.metadataAccessPath) {
      const metadataAccessPathItems = this.metadataAccessPath.split('/');
      const pathItemLength = metadataAccessPathItems.length;
      const lastPathItem = metadataAccessPathItems[pathItemLength - 1];
      if (lastPathItem.toLowerCase().endsWith('.json') || lastPathItem.toLowerCase().endsWith('.geojson')) {
        // The metadataAccessPath ends with a layer reference. It is therefore a path to a data layer rather than a path to service metadata.
        // We therefore need to correct the configuration by separating the layer index and the path to the service metadata.
        this.metadataAccessPath = metadataAccessPathItems.slice(0, -1).join('/');
        if (this.listOfLayerEntryConfig.length) {
          this.setErrorDetectedFlag();
          logger.logError('When a GeoJson metadataAccessPath ends with a layer file name, the listOfLayerEntryConfig must be empty.');
        }
        this.listOfLayerEntryConfig = [this.createLeafNode(toJsonObject({ layerId: lastPathItem, layerName: lastPathItem }), this)!];
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
    /** The GeoView layer schema associated to GeoJsonLayerConfig */
    return CV_GEOVIEW_SCHEMA_PATH.GEOJSON;
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
    return new GeoJsonLayerEntryConfig(layerConfig, geoviewConfig, parentNode);
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
    return new GeoJsonGroupLayerConfig(layerConfig, geoviewConfig, parentNode);
  }

  /**
   * Get the service metadata from the metadataAccessPath and store it in the private property of the geoview layer.
   * @override @async
   */
  override async fetchServiceMetadata(): Promise<void> {
    let metadataUrl = this.metadataAccessPath;
    if (
      !metadataUrl.toLowerCase().endsWith('.json') &&
      !metadataUrl.toLowerCase().endsWith('f=json') &&
      !metadataUrl.toLowerCase().endsWith('.geojson') &&
      !metadataUrl.toLowerCase().endsWith('.meta')
    )
      metadataUrl = this.metadataAccessPath.endsWith('/') ? `${this.metadataAccessPath}?f=json` : `${this.metadataAccessPath}/?f=json`;
    try {
      if (metadataUrl.toLowerCase().endsWith('.meta') || metadataUrl.toLowerCase().endsWith('f=json')) {
        // This was a fetchText which was later converted to a Json, trying to fetchJson straight for simplicity
        const layerMetadata = await Fetch.fetchJsonAsObject(metadataUrl);
        this.setServiceMetadata(layerMetadata);

        this.listOfLayerEntryConfig = this.processListOfLayerEntryConfig(this.listOfLayerEntryConfig);
        await this.fetchListOfLayerMetadata();
      }

      await this.createLayerTree();
    } catch (error: unknown) {
      // GV In the case of a geojson, when the metadata fetching fails, we actually skip it with a warning only.
      // G.VCONT If we want to manage this all the way to the UI (LayerAPI), we'll need a 'addLayerLoadWarning' working
      // G.VCONT like the 'addLayerLoadError' and aggregate errors as the process happens. Okay for now.
      logger.logWarning("The service metadata for the GeoJson couldn't be read, skipped.", error);
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
    return listOfLayerEntryConfig.reduce(
      (layerFound, layerEntry) => {
        if (layerFound) return layerFound;

        if (layerEntry.layerId === layerId) {
          return layerEntry;
        }

        if (layerEntry.isLayerGroup || layerEntry.entryType === CV_CONST_SUB_LAYER_TYPES.GROUP) {
          return this.findLayerMetadataEntry(layerId, layerEntry.listOfLayerEntryConfig as TypeJsonArray);
        }

        return null;
      },
      null as TypeJsonObject | null
    );
  }

  // #endregion PUBLIC
  // #endregion METHODS
  // #endregion CLASS HEADER
}
