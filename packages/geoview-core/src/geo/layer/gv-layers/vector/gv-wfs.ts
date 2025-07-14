import { Vector as VectorSource } from 'ol/source';
import { TypeJsonArray } from '@/api/config/types/config-types';
import { AbstractGVVector } from '@/geo/layer/gv-layers/vector/abstract-gv-vector';
import { WfsLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-validation-classes/wfs-layer-entry-config';
import { TypeOutfieldsType } from '@/api/config/types/map-schema-types';

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
  public constructor(olSource: VectorSource, layerConfig: WfsLayerEntryConfig) {
    super(olSource, layerConfig);
  }

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   * @override
   * @returns {WfsLayerEntryConfig} The strongly-typed layer configuration specific to this group layer.
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
    const fieldDefinitions = this.getLayerConfig().getLayerMetadata() as TypeJsonArray;
    const fieldDefinition = fieldDefinitions.find((metadataEntry) => metadataEntry.name === fieldName);
    if (!fieldDefinition) return 'string';
    const fieldEntryType = (fieldDefinition.type as string).split(':').slice(-1)[0];
    if (fieldEntryType === 'date') return 'date';
    if (['int', 'number'].includes(fieldEntryType)) return 'number';
    return 'string';
  }
}
