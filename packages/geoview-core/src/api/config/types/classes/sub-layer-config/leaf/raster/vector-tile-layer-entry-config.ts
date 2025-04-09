import { CV_CONST_SUB_LAYER_TYPES, CV_CONST_LEAF_LAYER_SCHEMA_PATH } from '@/api/config/types/config-constants';
import { TypeJsonObject } from '@/api/config/types/config-types';
import {
  TypeLayerStyleConfig,
  TypeLayerEntryType,
  TypeSourceVectorTileInitialConfig,
  AbstractGeoviewLayerConfig,
  EntryConfigBaseClass,
  TypeTileGrid,
} from '@/api/config/types/map-schema-types';
import { AbstractBaseLayerEntryConfig } from '@/api/config/types/classes/sub-layer-config/leaf/abstract-base-layer-entry-config';
import { isvalidComparedToInternalSchema } from '@/api/config/utils';
import { GeoviewLayerConfigError } from '@/api/config/types/classes/config-exceptions';

import { logger } from '@/core/utils/logger';
import { VectorTileLayerConfig } from '../../../geoview-config/raster-config/vector-tile-config';

// ====================
// #region CLASS HEADER
/**
 * The vector tile geoview sublayer class.
 */

export class VectorTileLayerEntryConfig extends AbstractBaseLayerEntryConfig {
  // ==================
  // #region PROPERTIES
  /** Source settings to apply to the GeoView image layer source at creation time. */
  source?: TypeSourceVectorTileInitialConfig;

  /** Style to apply to the raster layer. */
  layerStyle?: TypeLayerStyleConfig;

  constructor(layerConfig: TypeJsonObject, geoviewConfig: AbstractGeoviewLayerConfig, parentNode: EntryConfigBaseClass | undefined) {
    super(layerConfig, geoviewConfig, parentNode);

    if (!geoviewConfig.metadataAccessPath && !this.source?.dataAccessPath) {
      throw new Error(
        `dataAccessPath is mandatory for GeoView layer ${geoviewConfig.geoviewLayerId} when the metadataAccessPath is undefined.`
      );
    }

    if (!this.source) this.source = {};
    if (!this.source.dataAccessPath) this.source.dataAccessPath = geoviewConfig.metadataAccessPath;
    if (!this.source.dataAccessPath!.toLowerCase().endsWith('.pbf')) {
      this.source.dataAccessPath = this.source.dataAccessPath!.endsWith('/')
        ? `${this.source.dataAccessPath}tile/{z}/{y}/{x}.pbf`
        : `${this.source.dataAccessPath}/tile/{z}/{y}/{x}.pbf`;
    }
  }
  // #endregion PROPERTIES

  // ===============
  // #region METHODS
  /*
   * Methods are listed in the following order: abstract, override, private, protected, public and static.
   */
  // ==========================
  // #region OVERRIDE

  /**
   * The getter method that returns the schemaPath property. Each geoview sublayer type knows what section of the schema must be
   * used to do its validation.
   *
   * @returns {string} The schemaPath associated to the sublayer.
   * @protected @override
   */
  protected override getSchemaPath(): string {
    return CV_CONST_LEAF_LAYER_SCHEMA_PATH.VECTOR_TILES;
  }

  /**
   * A method that returns the entryType property. Each sublayer knows what entry type is associated to it.
   *
   * @returns {TypeLayerEntryType} The entryType associated to the sublayer.
   * @protected @override
   */
  protected override getEntryType(): TypeLayerEntryType {
    return CV_CONST_SUB_LAYER_TYPES.RASTER_TILE;
  }

  /**
   * Shadow method used to do a cast operation on the parent method to returVectorTileLayerConfig instead of
   * AbstractGeoviewLayerConfig.
   *
   * @returns {VectorTileLayerConfig} The Geoview layer configuration that owns this vector tile layer entry config.
   * @override
   */
  override getGeoviewLayerConfig(): VectorTileLayerConfig {
    return super.getGeoviewLayerConfig() as VectorTileLayerConfig;
  }

  /**
   * This method is used to fetch, parse and extract the relevant information from the metadata of the leaf node.
   * The same method signature is used by layer group nodes and leaf nodes (layers).
   * @override @async
   */
  override fetchLayerMetadata(): Promise<void> {
    // If an error has already been detected, then the layer is unusable.
    if (this.getErrorDetectedFlag()) return Promise.resolve();

    // If the vector tile GeoView layer doesn't have service metadata, the layer metadata are set using an empty object and they
    // will be fetch on the fly by the layer api.
    if (Object.keys(this.getGeoviewLayerConfig().getServiceMetadata()).length === 0) {
      this.setLayerMetadata({});
      return Promise.resolve();
    }

    const layerMetadata = this.getGeoviewLayerConfig().findLayerMetadataEntry(this.layerId);
    if (layerMetadata) {
      this.setLayerMetadata(layerMetadata);

      // Parse the raw layer metadata and build the geoview configuration.
      this.parseLayerMetadata();

      if (!isvalidComparedToInternalSchema(this.getSchemaPath(), this, true)) {
        throw new GeoviewLayerConfigError(
          `GeoView internal configuration ${this.getLayerPath()} is invalid compared to the internal schema specification.`
        );
      }

      return Promise.resolve();
    }

    logger.logError(`Can't find layer's metadata for layerPath ${this.getLayerPath()}.`);
    this.setErrorDetectedFlag();
    return Promise.resolve();
  }

  /**
   * Apply default values. The default values will be overwritten by the values in the metadata when they are analyzed.
   * The resulting config will then be overwritten by the values provided in the user config.
   * @override
   */
  override applyDefaultValues(): void {
    super.applyDefaultValues();
    this.source = {
      crossOrigin: 'Anonymous',
      featureInfo: {
        queryable: true,
        nameField: '',
        outfields: [],
      },
    };
  }

  /**
   * This method is used to parse the layer metadata and extract the source information and other properties.
   * @override @protected
   */
  protected override parseLayerMetadata(): void {
    const layerMetadata = this.getLayerMetadata();
    // return if the layer has no metadata.
    if (Object.keys(layerMetadata).length === 0) return;

    const { tileInfo, fullExtent } = layerMetadata;
    const newTileGrid: TypeTileGrid = {
      extent: [fullExtent.xmin as number, fullExtent.ymin as number, fullExtent.xmax as number, fullExtent.ymax as number],
      origin: [tileInfo.origin.x as number, tileInfo.origin.y as number],
      resolutions: (tileInfo.lods as Array<TypeJsonObject>).map(({ resolution }) => resolution as number),
      tileSize: [tileInfo.rows as number, tileInfo.cols as number],
    };
    // eslint-disable-next-line no-param-reassign
    this.source!.tileGrid = newTileGrid;
  }

  // #endregion OVERRIDE
  // #endregion METHODS
  // #endregion CLASS HEADER
}
