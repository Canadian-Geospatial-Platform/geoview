import BaseVectorLayer from 'ol/layer/BaseVector';
import VectorSource from 'ol/source/Vector';
import { GeoJSONLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-validation-classes/geojson-layer-entry-config';
import { AbstractGVVector } from './abstract-gv-vector';

/**
 * Manages a GeoJSON layer.
 *
 * @exports
 * @class GVGeoJSON
 */
export class GVGeoJSON extends AbstractGVVector {
  /**
   * Constructs a GVGeoJSON layer to manage an OpenLayer layer.
   * @param {string} mapId - The map id
   * @param {BaseVectorLayer<VectorSource, any>} olLayer - The OpenLayer layer.
   * @param {GeoJSONLayerEntryConfig} layerConfig - The layer configuration.
   */
  // Disabling 'any', because that's how it is in OpenLayers
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public constructor(mapId: string, olLayer: BaseVectorLayer<VectorSource, any>, layerConfig: GeoJSONLayerEntryConfig) {
    super(mapId, olLayer, layerConfig);
  }

  /**
   * Overrides the get of the layer configuration associated with the layer.
   * @returns {GeoJSONLayerEntryConfig} The layer configuration or undefined if not found.
   */
  override getLayerConfig(): GeoJSONLayerEntryConfig {
    // Call parent and cast
    return super.getLayerConfig() as GeoJSONLayerEntryConfig;
  }
}
