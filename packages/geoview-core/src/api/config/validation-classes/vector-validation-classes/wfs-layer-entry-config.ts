import type {
  ConfigClassOrType,
  TypeGeoviewLayerConfig,
  TypeMetadataWFS,
  TypeSourceWFSVectorInitialConfig,
} from '@/api/types/layer-schema-types';
import type { TypeOutfields } from '@/api/types/map-schema-types';
import { CONST_LAYER_TYPES } from '@/api/types/layer-schema-types';
import { type TypeWFSLayerConfig } from '@/geo/layer/geoview-layers/vector/wfs';
import type { VectorLayerEntryConfigProps } from '@/api/config/validation-classes/vector-layer-entry-config';
import { VectorLayerEntryConfig } from '@/api/config/validation-classes/vector-layer-entry-config';

export interface OgcWfsLayerEntryConfigProps extends VectorLayerEntryConfigProps {
  /** Source settings to apply to the GeoView layer source at creation time. */
  source?: TypeSourceWFSVectorInitialConfig;
}

export class OgcWfsLayerEntryConfig extends VectorLayerEntryConfig {
  declare source: TypeSourceWFSVectorInitialConfig;

  /**
   * The class constructor.
   * @param {OgcWfsLayerEntryConfigProps} layerConfig - The layer configuration we want to instanciate.
   */
  constructor(layerConfig: OgcWfsLayerEntryConfigProps) {
    super(layerConfig, CONST_LAYER_TYPES.WFS);

    // Value for this.source.format can only be WFS.
    this.source.format ??= 'WFS';
  }

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   * @override
   * @returns {TypeMetadataWFS | undefined} The strongly-typed layer configuration specific to this layer entry config.
   */
  override getServiceMetadata(): TypeMetadataWFS | undefined {
    return super.getServiceMetadata() as TypeMetadataWFS | undefined;
  }

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   * @override
   * @returns {TypeOutfields[] | undefined} The strongly-typed layer metadata specific to this layer entry config.
   */
  override getLayerMetadata(): TypeOutfields[] | undefined {
    return super.getLayerMetadata() as TypeOutfields[] | undefined;
  }

  /**
   * Gets the version. Defaults to 1.3.0.
   * @returns {string} The service version as read from the metadata attribute.
   */
  getVersion(): string {
    // Redirect
    return this.getServiceMetadata()?.['@attributes'].version || '1.3.0';
  }

  /**
   * Gets if the config has specified that we should fetch the styles from the WMS.
   * @returns {boolean} True when the styles should be fetched from the WMS. True by default.
   */
  getShouldFetchStylesFromWMS(): boolean {
    return (this.getGeoviewLayerConfig() as TypeWFSLayerConfig).fetchStylesOnWMS ?? true; // default: true
  }

  /**
   * Gets the WMS styles layer id associated with this WFS layer entry config if any.
   * @returns {string} The WMS styles layer id
   */
  getWmsStylesLayerId(): string {
    return this.layerEntryProps.wmsLayerId || this.layerId;
  }

  /**
   * Type guard that checks whether the given configuration (class instance or plain object)
   * represents a WFS Feature layer type.
   * Supports `ConfigClassOrType` (class instance or plain object) and plain layer config objects (`TypeGeoviewLayerConfig`).
   * @param {ConfigClassOrType | TypeGeoviewLayerConfig} layerConfig - The layer config to check. Can be an instance of a config class or a raw config object.
   * @returns `true` if the config is for a WFS Feature layer; otherwise `false`.
   * @static
   */
  static isClassOrTypeWFSLayer(layerConfig: ConfigClassOrType | TypeGeoviewLayerConfig): layerConfig is TypeWFSLayerConfig {
    // Redirect
    return this.isClassOrTypeSchemaTag(layerConfig, CONST_LAYER_TYPES.WFS);
  }
}
