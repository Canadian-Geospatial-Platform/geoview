import type { VectorLayerEntryConfigProps } from '@/api/config/validation-classes/vector-layer-entry-config';
import { VectorLayerEntryConfig } from '@/api/config/validation-classes/vector-layer-entry-config';
import type { TypeCSVLayerConfig } from '@/geo/layer/geoview-layers/vector/csv';
import type { ConfigClassOrType, TypeGeoviewLayerConfig, TypeSourceCSVInitialConfig } from '@/api/types/layer-schema-types';
import { CONST_LAYER_TYPES } from '@/api/types/layer-schema-types';

export interface CsvLayerEntryConfigProps extends VectorLayerEntryConfigProps {
  // TODO: Think of using a TypeSourceCSVInitialConfigProps, because it can be different properties than the resulting 'source' object stored.
  // TO.DOCONT: e.g.: this.source.format, format isn't necessary to provide as input props here.
  /** Source settings to apply to the GeoView layer source at creation time. */
  source?: TypeSourceCSVInitialConfig;
  /** Character separating values in csv file */
  valueSeparator?: string;
}

export class CsvLayerEntryConfig extends VectorLayerEntryConfig {
  /** Source settings to apply to the GeoView layer source at creation time. */
  declare source: TypeSourceCSVInitialConfig;

  /** Character separating values in csv file */
  valueSeparator?: string;

  /**
   * The class constructor.
   * @param {CsvLayerEntryConfigProps} layerConfig - The layer configuration we want to instanciate.
   */
  constructor(layerConfig: CsvLayerEntryConfigProps) {
    super(layerConfig, CONST_LAYER_TYPES.CSV);
    this.valueSeparator = layerConfig.valueSeparator;

    // Write the default properties when not specified
    this.source.separator ??= ',';

    // Normalize dataAccessPath if needed
    const path = this.getDataAccessPath();
    const isBlob = path.startsWith('blob') && !path.endsWith('/');
    const isCsvFile = path.toUpperCase().endsWith('.CSV');
    const hasCsvQuery = path.toUpperCase().includes('.CSV?');

    if (!isBlob && !isCsvFile && !hasCsvQuery) {
      const endsWithSlash = path.endsWith('/');
      let normalizedPath = endsWithSlash ? `${path}${this.layerId}` : `${path}/${this.layerId}`;

      if (!normalizedPath.toUpperCase().endsWith('.CSV')) {
        normalizedPath += '.csv';
      }
      this.setDataAccessPath(normalizedPath);
    }
  }

  /**
   * Type guard that checks whether the given configuration (class instance or plain object)
   * represents a CSV layer type.
   * Supports `ConfigClassOrType` (class instance or plain object) and plain layer config objects (`TypeGeoviewLayerConfig`).
   * @param {ConfigClassOrType | TypeGeoviewLayerConfig} layerConfig - The layer config to check. Can be an instance of a config class or a raw config object.
   * @returns `true` if the config is for a CSV layer; otherwise `false`.
   * @static
   */
  static isClassOrTypeCSV(layerConfig: ConfigClassOrType | TypeGeoviewLayerConfig): layerConfig is TypeCSVLayerConfig {
    // Redirect
    return this.isClassOrTypeSchemaTag(layerConfig, CONST_LAYER_TYPES.CSV);
  }
}
