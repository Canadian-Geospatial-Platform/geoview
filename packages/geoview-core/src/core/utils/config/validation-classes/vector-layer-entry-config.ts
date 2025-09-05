import { CONST_LAYER_ENTRY_TYPES, TypeLayerMetadataVector, TypeVectorSourceInitialConfig } from '@/api/config/types/layer-schema-types';
import {
  AbstractBaseLayerEntryConfig,
  AbstractBaseLayerEntryConfigProps,
} from '@/core/utils/config/validation-classes/abstract-base-layer-entry-config';

export interface VectorLayerEntryConfigProps extends AbstractBaseLayerEntryConfigProps {
  /** Source settings to apply to the GeoView layer source at creation time. */
  source?: TypeVectorSourceInitialConfig;
  /** Max number of records for query */
  maxRecordCount?: number;
}

/**
 * Type used to define a GeoView vector layer to display on the map.
 */
// TODO: Refactor - This class should be named 'AbstractVectorLayerEntryConfig' to align with others
export abstract class VectorLayerEntryConfig extends AbstractBaseLayerEntryConfig {
  /** Layer entry data type. */
  override entryType = CONST_LAYER_ENTRY_TYPES.VECTOR;

  /** The layer entry props that were used in the constructor. */
  declare layerEntryProps: VectorLayerEntryConfigProps;

  /** Initial settings to apply to the GeoView vector layer source at creation time. */
  declare source?: TypeVectorSourceInitialConfig;

  /** Max number of records for query */
  maxRecordCount?: number;

  /**
   * The class constructor.
   * @param {VectorLayerEntryConfigProps} layerConfig - The layer configuration we want to instanciate.
   */
  protected constructor(layerConfig: VectorLayerEntryConfigProps | VectorLayerEntryConfig) {
    super(layerConfig);
    this.maxRecordCount = layerConfig.maxRecordCount;
  }

  /**
   * Helper function to get the layer metadata casted as TypeLayerMetadataVector.
   * @returns {TypeLayerMetadataVector | undefined} The casted layer metadata in the right type.
   */
  getLayerMetadataCasted(): TypeLayerMetadataVector | undefined {
    // TODO: Refactor - Remove this function in favor of a generic to be used by the class signature itself:
    // TO.DOCONT: `class AbstractBaseLayerEntryConfig<TLayerMetadata = unknown>`
    // TO.DOCONT: `class VectorLayerEntryConfig<TLayerMetadata = TypeLayerMetadataVector> extends AbstractBaseLayerEntryConfig<TypeLayerMetadataVector>`
    // TO.DOCONT: `class WfsLayerEntryConfig extends VectorLayerEntryConfig<TypeLayerMetadataWfs[]>`
    return super.getLayerMetadata() as TypeLayerMetadataVector | undefined;
  }
}
