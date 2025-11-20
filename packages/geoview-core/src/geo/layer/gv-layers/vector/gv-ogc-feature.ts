import type VectorSource from 'ol/source/Vector';
import { AbstractGVVector } from '@/geo/layer/gv-layers/vector/abstract-gv-vector';
import type { OgcFeatureLayerEntryConfig } from '@/api/config/validation-classes/vector-validation-classes/ogc-layer-entry-config';
import type { TypeOutfieldsType } from '@/api/types/map-schema-types';
import type { TypeLayerMetadataOGC } from '@/api/types/layer-schema-types';

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
  // The constructor is not useless, it narrows down the accepted parameter type.
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(olSource: VectorSource, layerConfig: OgcFeatureLayerEntryConfig) {
    super(olSource, layerConfig);
  }

  // #region OVERRIDES

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
    // Redirect
    return GVOGCFeature.getFieldType(this.getLayerConfig().getLayerMetadata(), fieldName);
  }

  // #endregion OVERRIDES

  // #region STATIC

  /**
   * Returns field type of the given field name using the povided OGC Feature metadata.
   * @param {TypeLayerMetadataOGC} layerMetadata - The OGC Feature metadata
   * @param {string} fieldName - The field name to get the field type information
   * @returns {TypeOutfieldsType} The field type information for the given field name
   */
  static getFieldType(layerMetadata: TypeLayerMetadataOGC | undefined, fieldName: string): TypeOutfieldsType {
    const fieldEntryType = layerMetadata?.[fieldName].type.split(':').slice(-1)[0];
    if (fieldEntryType === 'date') return 'date';
    if (['int', 'number'].includes(fieldEntryType!)) return 'number';
    return 'string';
  }

  // #endregion STATIC
}
