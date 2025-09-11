import VectorSource from 'ol/source/Vector';
import { AbstractGVVector } from '@/geo/layer/gv-layers/vector/abstract-gv-vector';
import { OgcFeatureLayerEntryConfig } from '@/api/config/validation-classes/vector-validation-classes/ogc-layer-entry-config';
import { TypeOutfieldsType } from '@/api/types/map-schema-types';

/**
 * Manages an OGC-Feature layer.
 *
 * @exports
 * @class GVOGCFeature
 */
export class GVOGCFeature extends AbstractGVVector {
  /**
   * Constructs a GVOGCFeature layer to manage an OpenLayer layer.
   * @param {VectorSource} olSource - The OpenLayer source.
   * @param {OgcFeatureLayerEntryConfig} layerConfig - The layer configuration.
   */
  public constructor(olSource: VectorSource, layerConfig: OgcFeatureLayerEntryConfig) {
    super(olSource, layerConfig);
  }

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   * @override
   * @returns {OgcFeatureLayerEntryConfig} The strongly-typed layer configuration specific to this layer.
   */
  override getLayerConfig(): OgcFeatureLayerEntryConfig {
    // Call parent and cast
    return super.getLayerConfig() as OgcFeatureLayerEntryConfig;
  }

  /**
   * Overrides the return of the field type from the metadata. If the type can not be found, return 'string'.
   * @param {string} fieldName - The field name for which we want to get the type.
   * @returns {TypeOutfieldsType} The type of the field.
   */
  protected override onGetFieldType(fieldName: string): TypeOutfieldsType {
    const fieldDefinitions = this.getLayerConfig().getLayerMetadata();
    const fieldEntryType = fieldDefinitions?.[fieldName].type.split(':').slice(-1)[0];
    if (fieldEntryType === 'date') return 'date';
    if (['int', 'number'].includes(fieldEntryType!)) return 'number';
    return 'string';
  }
}
