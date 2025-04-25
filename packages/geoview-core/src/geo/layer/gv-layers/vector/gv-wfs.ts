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
   * @param {string} mapId - The map id
   * @param {VectorSource} olSource - The OpenLayer source.
   * @param {WfsLayerEntryConfig} layerConfig - The layer configuration.
   */
  public constructor(mapId: string, olSource: VectorSource, layerConfig: WfsLayerEntryConfig) {
    super(mapId, olSource, layerConfig);
  }

  /**
   * Overrides the get of the layer configuration associated with the layer.
   * @returns {WfsLayerEntryConfig} The layer configuration or undefined if not found.
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
  protected override getFieldType(fieldName: string): TypeOutfieldsType {
    const fieldDefinitions = this.getLayerConfig().getLayerMetadata() as TypeJsonArray;
    const fieldDefinition = fieldDefinitions.find((metadataEntry) => metadataEntry.name === fieldName);
    if (!fieldDefinition) return 'string';
    const fieldEntryType = (fieldDefinition.type as string).split(':').slice(-1)[0] as string;
    if (fieldEntryType === 'date') return 'date';
    if (['int', 'number'].includes(fieldEntryType)) return 'number';
    return 'string';
  }
}
