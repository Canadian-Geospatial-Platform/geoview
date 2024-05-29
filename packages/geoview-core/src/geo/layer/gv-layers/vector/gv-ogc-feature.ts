import BaseVectorLayer from 'ol/layer/BaseVector';
import VectorSource from 'ol/source/Vector';
import { AbstractGVVector } from './abstract-gv-vector';
import { OgcFeatureLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-validation-classes/ogc-layer-entry-config';

/**
 * Manages an OGC-Feature layer.
 *
 * @exports
 * @class GVOGCFeature
 */
export class GVOGCFeature extends AbstractGVVector {
  /**
   * Constructs a GVOGCFeature layer to manage an OpenLayer layer.
   * @param {string} mapId - The map id
   * @param {BaseVectorLayer<VectorSource, any>} olLayer - The OpenLayer layer.
   * @param {OgcFeatureLayerEntryConfig} layerConfig - The layer configuration.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public constructor(mapId: string, olLayer: BaseVectorLayer<VectorSource, any>, layerConfig: OgcFeatureLayerEntryConfig) {
    super(mapId, olLayer, layerConfig);
  }

  /**
   * Overrides the get of the layer configuration associated with the layer.
   * @returns {OgcFeatureLayerEntryConfig} The layer configuration or undefined if not found.
   */
  override getLayerConfig(): OgcFeatureLayerEntryConfig {
    // Call parent and cast
    return super.getLayerConfig() as OgcFeatureLayerEntryConfig;
  }

  /**
   * Overrides the return of the field type from the metadata. If the type can not be found, return 'string'.
   * @param {string} fieldName - The field name for which we want to get the type.
   * @returns {'string' | 'date' | 'number'} The type of the field.
   */
  protected override getFieldType(fieldName: string): 'string' | 'date' | 'number' {
    const fieldDefinitions = this.getLayerConfig().getMetadata()!;
    const fieldEntryType = (fieldDefinitions[fieldName].type as string).split(':').slice(-1)[0] as string;
    if (fieldEntryType === 'date') return 'date';
    if (['int', 'number'].includes(fieldEntryType)) return 'number';
    return 'string';
  }
}
