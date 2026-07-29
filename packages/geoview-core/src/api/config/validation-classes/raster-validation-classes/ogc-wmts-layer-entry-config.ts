import type {
  ConfigClassOrType,
  TypeGeoviewLayerConfig,
  TypeMetadataWMTSCapabilities,
  TypeWMTSLayerParsedInfo,
} from '@/api/types/layer-schema-types';
import { CONST_LAYER_ENTRY_TYPES, CONST_LAYER_TYPES } from '@/api/types/layer-schema-types';
import type { DisplayDateMode } from '@/api/types/map-schema-types';
import type { AbstractBaseLayerEntryConfigProps } from '@/api/config/validation-classes/abstract-base-layer-entry-config';
import { TileLayerEntryConfig } from '@/api/config/validation-classes/tile-layer-entry-config';
import { WMTS, type TypeSourceImageWMTSInitialConfig, type TypeWmtsLayerConfig } from '@/geo/layer/geoview-layers/raster/wmts';

export interface OgcWmtsLayerEntryConfigProps extends AbstractBaseLayerEntryConfigProps {
  /** The tile matrix set identifier to use for this WMTS layer. If not provided, the first TileMatrixSet found in the metadata will be used by default. */
  tileMatrixSet?: string;
  /** Source settings to apply to the GeoView layer source at creation time. */
  source?: TypeSourceImageWMTSInitialConfig;
}

export class OgcWmtsLayerEntryConfig extends TileLayerEntryConfig {
  tileMatrixSet?: string;

  /**
   * Creates an instance of OgcWmtsLayerEntryConfig.
   *
   * @param layerConfig - The layer configuration we want to instantiate
   */
  constructor(layerConfig: OgcWmtsLayerEntryConfigProps) {
    super(layerConfig, CONST_LAYER_TYPES.WMTS, CONST_LAYER_ENTRY_TYPES.RASTER_IMAGE);
    this.tileMatrixSet = layerConfig.tileMatrixSet;
    // Override dataAcessPath if one is not provided in config - the WMTS source will set it from the metadata during layer creation.
    // The parent constructor will set it to the metadataAccessPath, and we only want it if provided by the config.
    if (!layerConfig.source?.dataAccessPath) this.setDataAccessPath('');
  }

  // #region OVERRIDES

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   *
   * @returns The strongly-typed layer configuration specific to this layer.
   */
  override getGeoviewLayerConfig(): TypeWmtsLayerConfig {
    return super.getGeoviewLayerConfig() as TypeWmtsLayerConfig;
  }

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   *
   * @returns The strongly-typed source configuration specific to this layer entry config.
   */
  override getSource(): TypeSourceImageWMTSInitialConfig {
    return super.getSource();
  }

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   *
   * @returns The strongly-typed service metadata specific to this layer entry config.
   */
  override getServiceMetadata(): TypeMetadataWMTSCapabilities | undefined {
    return super.getServiceMetadata() as TypeMetadataWMTSCapabilities | undefined;
  }

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   *
   * @returns The strongly-typed layer metadata specific to this layer entry config.
   */
  override getLayerMetadata(): TypeWMTSLayerParsedInfo | undefined {
    return super.getLayerMetadata() as TypeWMTSLayerParsedInfo | undefined;
  }

  /**
   * Refreshes the layer metadata information by re-fetching the WMTS GetCapabilities response and updating the layer configuration accordingly.
   *
   * This method is typically used when the display date mode changes, as the metadata may contain time-sensitive information that needs to be updated on-the-fly.
   *
   * @param displayDateMode - The display date mode that should be used
   * @returns A promise that resolves when the metadata refresh operation has completed
   * @throws {LayerWMTSMetadataError} When the metadata is missing necessary information
   * @throws {ResponseEmptyError} When the capabilities response is empty
   * @throws {NetworkError} When a network issue happened
   */
  override async onRefreshMetadata(_displayDateMode: DisplayDateMode): Promise<void> {
    // Refetch the metadata again with the new date mode and update the config
    const layerMetadata = await WMTS.fetchMetadataWMTS(this.getMetadataAccessPath()!, this.getProxyUrl());

    // Init the layer metadata
    await WMTS.initLayerMetadata(this, layerMetadata);
  }

  // #endregion OVERRIDES

  // #region METHODS

  /**
   * Gets the version.
   *
   * @returns The service version as read from the metadata attribute
   */
  getVersion(): string | undefined {
    // Read the version from the metadata information
    return this.getServiceMetadata()?.version;
  }

  /**
   * Gets the version and defaults to 1.0.0 when couldn't be determined as it's the most stable in testing.
   *
   * @returns The service version as read from the metadata attribute, or '1.0.0' if not available
   */
  getVersionOrDefault(): string {
    // Redirect
    return this.getVersion() ?? '1.0.0';
  }

  // #endregion METHODS

  // #region STATIC METHODS

  /**
   * Type guard that checks whether the given configuration (class instance or plain object) represents a WMTS layer type.
   *
   * Supports `ConfigClassOrType` (class instance or plain object) and plain layer config objects (`TypeGeoviewLayerConfig`).
   *
   * @param layerConfig - The layer config to check. Can be an instance of a config class or a raw config object.
   * @returns `true` if the config is for a WMTS layer; otherwise `false`.
   */
  static isClassOrTypeWMTS(layerConfig: ConfigClassOrType | TypeGeoviewLayerConfig): layerConfig is TypeWmtsLayerConfig {
    // Redirect
    return this.isClassOrTypeSchemaTag(layerConfig, CONST_LAYER_TYPES.WMTS);
  }

  // #endregion STATIC METHODS
}
