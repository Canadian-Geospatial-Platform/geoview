import type { TypeGeoviewLayerType, TypeLayerMetadataVector, TypeBaseVectorSourceInitialConfig } from '@/api/types/layer-schema-types';
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
// TODO: Refactor - This class should be named 'AbstractVectorLayerEntryConfig' to align with others
export abstract class VectorLayerEntryConfig extends AbstractBaseLayerEntryConfig {
  /** Max number of records for query */
  maxRecordCount?: number;

  /**
   * The class constructor.
   * @param {VectorLayerEntryConfigProps | VectorLayerEntryConfig} layerConfig - The layer configuration we want to instanciate.
   */
  protected constructor(layerConfig: VectorLayerEntryConfigProps | VectorLayerEntryConfig, schemaTag: TypeGeoviewLayerType) {
    super(layerConfig, schemaTag, CONST_LAYER_ENTRY_TYPES.VECTOR);
    this.maxRecordCount = layerConfig.maxRecordCount;
  }

  // #region OVERRIDES

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   * @override
   * @returns {TypeBaseVectorSourceInitialConfig} The strongly-typed source configuration specific to this layer entry config.
   */
  override getSource(): TypeBaseVectorSourceInitialConfig {
    return super.getSource();
  }

  // #endregion OVERRIDES

  // #region STATIC METHODS

  /**
   * Helper function to get the layer metadata casted as TypeLayerMetadataVector.
   * @returns {TypeLayerMetadataVector | undefined} The casted layer metadata in the right type.
   */
  getLayerMetadataCasted(): TypeLayerMetadataVector | undefined {
    // TODO: Refactor - Remove this function in favor of a generic to be used by the class signature itself:
    // TO.DOCONT: `class AbstractBaseLayerEntryConfig<TLayerMetadata = unknown>`
    // TO.DOCONT: `class VectorLayerEntryConfig<TLayerMetadata = TypeLayerMetadataVector> extends AbstractBaseLayerEntryConfig<TypeLayerMetadataVector>`
    // TO.DOCONT: `class OgcWfsLayerEntryConfig extends VectorLayerEntryConfig<TypeLayerMetadataWfs[]>`
    return super.getLayerMetadata() as TypeLayerMetadataVector | undefined;
  }

  // #endregion STATIC METHODS
}
