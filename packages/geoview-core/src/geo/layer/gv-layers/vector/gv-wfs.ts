import type { Vector as VectorSource } from 'ol/source';

import { AbstractGVVector } from '@/geo/layer/gv-layers/vector/abstract-gv-vector';
import type { WfsLayerEntryConfig } from '@/api/config/validation-classes/vector-validation-classes/wfs-layer-entry-config';
import type { TypeOutfields, TypeOutfieldsType } from '@/api/types/map-schema-types';

/**
 * Manages a WFS layer.
 *
 * @exports
 * @class GVWFS
 */
export class GVWFS extends AbstractGVVector {
  /**
   * Constructs a GVWFS layer to manage an OpenLayer layer.
   * @param {VectorSource} olSource - The OpenLayer source.
   * @param {WfsLayerEntryConfig} layerConfig - The layer configuration.
   */
  // The constructor is not useless, it narrows down the accepted parameter type.
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(olSource: VectorSource, layerConfig: WfsLayerEntryConfig) {
    super(olSource, layerConfig);
  }

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   * @override
   * @returns {WfsLayerEntryConfig} The strongly-typed layer configuration specific to this layer.
   */
  override getLayerConfig(): WfsLayerEntryConfig {
    // Call parent and cast
    return super.getLayerConfig() as WfsLayerEntryConfig;
  }

  /**
   * Overrides the return of the field type from the metadata. If the type can not be found, return 'string'.
   * @param {string} fieldName - The field name for which we want to get the type.
   * @returns {TypeOutfieldsType} The type of the field.
   */
  protected override onGetFieldType(fieldName: string): TypeOutfieldsType {
    // Redirect
    return GVWFS.getFieldType(this.getLayerConfig().getLayerMetadata(), fieldName);
  }

  /**
   * Returns field type of the given field name using the povided WFS metadata.
   * @param {TypeOutfields[]} layerMetadata - The WFS metadata
   * @param {string} fieldName - The field name to get the field type information
   * @returns {TypeOutfieldsType} The field type information for the given field name
   */
  static getFieldType(layerMetadata: TypeOutfields[] | undefined, fieldName: string): TypeOutfieldsType {
    const fieldDefinition = layerMetadata?.find((metadataEntry) => metadataEntry.name === fieldName);
    if (!fieldDefinition) return 'string';
    const fieldEntryType = fieldDefinition.type.split(':').slice(-1)[0];
    if (fieldEntryType === 'date') return 'date';
    if (['int', 'number'].includes(fieldEntryType)) return 'number';
    return 'string';
  }
}
