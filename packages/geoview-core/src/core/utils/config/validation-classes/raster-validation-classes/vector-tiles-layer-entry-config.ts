import {
  ConfigVectorTilesClassOrType,
  CONST_LAYER_TYPES,
  TypeMetadataVectorTiles,
  TypeSourceTileInitialConfig,
} from '@/api/config/types/layer-schema-types';
import { ConfigBaseClass } from '@/core/utils/config/validation-classes/config-base-class';
import { AbstractBaseLayerEntryConfigProps } from '@/core/utils/config/validation-classes/abstract-base-layer-entry-config';
import { TileLayerEntryConfig } from '@/core/utils/config/validation-classes/tile-layer-entry-config';

export interface VectorTilesLayerEntryConfigProps extends AbstractBaseLayerEntryConfigProps {
  /** Source settings to apply to the GeoView layer source at creation time. */
  source?: TypeSourceTileInitialConfig;
  /** The style url */
  styleUrl?: string;
}

export class VectorTilesLayerEntryConfig extends TileLayerEntryConfig {
  /** Tag used to link the entry to a specific schema. */
  override schemaTag = CONST_LAYER_TYPES.VECTOR_TILES;

  declare source: TypeSourceTileInitialConfig;

  /** The style url */
  #styleUrl?: string;

  /**
   * The class constructor.
   * @param {VectorTilesLayerEntryConfigProps | VectorTilesLayerEntryConfig} layerConfig - The layer configuration we want to instanciate.
   */
  constructor(layerConfig: VectorTilesLayerEntryConfigProps | VectorTilesLayerEntryConfig) {
    super(layerConfig);

    // Keep attributes
    this.#styleUrl = VectorTilesLayerEntryConfig.getClassOrTypeStyleUrl(layerConfig);

    // Write the default properties when not specified
    this.source ??= {};
    this.source.dataAccessPath ??= layerConfig.source?.dataAccessPath ?? this.geoviewLayerConfig.metadataAccessPath;

    // Format the dataAccessPath correctly
    if (!this.source.dataAccessPath!.toLowerCase().endsWith('.pbf')) {
      this.source.dataAccessPath = this.source.dataAccessPath!.endsWith('/')
        ? `${this.source.dataAccessPath}tile/{z}/{y}/{x}.pbf`
        : `${this.source.dataAccessPath}/tile/{z}/{y}/{x}.pbf`;
    }
  }

  /**
   * Gets the style url or undefined.
   */
  getStyleUrl(): string | undefined {
    return this.#styleUrl;
  }

  /**
   * Sets the style url.
   * @param {string} styleUrl - The style url.
   */
  setStyleUrl(styleUrl: string): void {
    this.#styleUrl = styleUrl;
  }

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   * @override
   * @returns {TypeMetadataVectorTiles | undefined} The strongly-typed layer configuration specific to this layer entry config.
   */
  override getServiceMetadata(): TypeMetadataVectorTiles | undefined {
    return super.getServiceMetadata() as TypeMetadataVectorTiles | undefined;
  }

  /**
   * Helper function to support when a layerConfig is either a class instance or a regular json object.
   * @param {ConfigVectorTilesClassOrType | undefined} layerConfig - The layer config class instance or regular json object.
   * @returns {string | undefined} The style url or undefined.
   */
  static getClassOrTypeStyleUrl(layerConfig: ConfigVectorTilesClassOrType | undefined): string | undefined {
    if (layerConfig instanceof ConfigBaseClass) {
      return layerConfig.getStyleUrl();
    }
    return layerConfig?.styleUrl;
  }

  /**
   * Helper function to support when a layerConfig is either a class instance or a regular json object.
   * @param {ConfigVectorTilesClassOrType} layerConfig - The layer config class instance or regular json object.
   * @param {string} styleUrl - The style url.
   */
  static setClassOrTypeStyleUrl(layerConfig: ConfigVectorTilesClassOrType, styleUrl: string): void {
    if (layerConfig instanceof ConfigBaseClass) {
      layerConfig.setStyleUrl(styleUrl);
    } else {
      // eslint-disable-next-line no-param-reassign
      layerConfig.styleUrl = styleUrl;
    }
  }
}
