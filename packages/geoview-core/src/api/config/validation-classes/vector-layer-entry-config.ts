import type { TypeGeoviewLayerType, TypeBaseVectorSourceInitialConfig } from '@/api/types/layer-schema-types';
import { CONST_LAYER_ENTRY_TYPES } from '@/api/types/layer-schema-types';
import type { AbstractBaseLayerEntryConfigProps } from '@/api/config/validation-classes/abstract-base-layer-entry-config';
import { AbstractBaseLayerEntryConfig } from '@/api/config/validation-classes/abstract-base-layer-entry-config';

export interface VectorLayerEntryConfigProps extends AbstractBaseLayerEntryConfigProps {
  /** Max number of records for query */
  maxRecordCount?: number;
}

/**
 * Type used to define a GeoView vector layer to display on the map.
 */
export abstract class VectorLayerEntryConfig extends AbstractBaseLayerEntryConfig {
  /** Max number of records for query */
  maxRecordCount?: number;

  /**
   * Creates an instance of VectorLayerEntryConfig.
   *
   * @param layerConfig - The layer configuration we want to instantiate
   * @param schemaTag - The GeoView layer type schema tag
   */
  protected constructor(layerConfig: VectorLayerEntryConfigProps | VectorLayerEntryConfig, schemaTag: TypeGeoviewLayerType) {
    super(layerConfig, schemaTag, CONST_LAYER_ENTRY_TYPES.VECTOR);
    this.maxRecordCount = layerConfig.maxRecordCount;
  }

  // #region OVERRIDES

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   *
   * @returns The strongly-typed source configuration specific to this layer entry config
   */
  override getSource(): TypeBaseVectorSourceInitialConfig {
    return super.getSource();
  }

  // #endregion OVERRIDES
}
