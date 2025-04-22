import { CONST_LAYER_ENTRY_TYPES, TypeVectorSourceInitialConfig } from '@/api/config/types/map-schema-types';
import { AbstractBaseLayerEntryConfig } from './abstract-base-layer-entry-config';

/**
 * Type used to define a GeoView vector layer to display on the map.
 */
// TODO: Refactor - This class should be named 'AbstractVectorLayerEntryConfig' to align with others
export abstract class VectorLayerEntryConfig extends AbstractBaseLayerEntryConfig {
  /** Layer entry data type. */
  override entryType = CONST_LAYER_ENTRY_TYPES.VECTOR;

  /** Filter to apply on feature of this layer. */
  layerFilter?: string;

  /** Initial settings to apply to the GeoView vector layer source at creation time. */
  declare source?: TypeVectorSourceInitialConfig;

  /**
   * The class constructor.
   * @param {VectorLayerEntryConfig} layerConfig - The layer configuration we want to instanciate.
   */
  protected constructor(layerConfig: VectorLayerEntryConfig) {
    super(layerConfig);
    Object.assign(this, layerConfig);
  }
}
