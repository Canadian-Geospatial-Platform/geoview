import type { Vector as VectorSource } from 'ol/source';

import { AbstractGVVector } from '@/geo/layer/gv-layers/vector/abstract-gv-vector';
import type { OgcWfsLayerEntryConfig } from '@/api/config/validation-classes/vector-validation-classes/wfs-layer-entry-config';
import type { TypeOutfields, TypeOutfieldsType } from '@/api/types/map-schema-types';

/**
 * Manages a WFS layer.
 */
export class GVWFS extends AbstractGVVector {
  /**
   * Constructs a GVWFS layer to manage an OpenLayer layer.
   *
   * @param olSource - The OpenLayer source.
   * @param layerConfig - The layer configuration.
   */
  // The constructor is not useless, it narrows down the accepted parameter type.
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(olSource: VectorSource, layerConfig: OgcWfsLayerEntryConfig) {
    super(olSource, layerConfig);
  }

  // #region OVERRIDES

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   *
   * @returns The strongly-typed layer configuration specific to this layer.
   */
  override getLayerConfig(): OgcWfsLayerEntryConfig {
    // Call parent and cast
    return super.getLayerConfig() as OgcWfsLayerEntryConfig;
  }

  // #endregion OVERRIDES

  // #region STATIC

  /**
   * Returns field type of the given field name using the provided WFS metadata.
   *
   * @param layerMetadata - The WFS metadata.
   * @param fieldName - The field name to get the field type information.
   * @returns The field type information for the given field name.
   */
  static getFieldType(layerMetadata: TypeOutfields[] | undefined, fieldName: string): TypeOutfieldsType {
    const fieldDefinition = layerMetadata?.find((metadataEntry) => metadataEntry.name === fieldName);
    if (!fieldDefinition) return 'string';
    const fieldEntryType = fieldDefinition.type.split(':').slice(-1)[0];
    if (fieldEntryType === 'date') return 'date';
    if (['int', 'number'].includes(fieldEntryType)) return 'number';
    return 'string';
  }

  // #endregion STATIC
}
