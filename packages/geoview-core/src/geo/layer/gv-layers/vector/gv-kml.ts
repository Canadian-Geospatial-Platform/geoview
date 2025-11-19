import type VectorSource from 'ol/source/Vector';

import type { KmlLayerEntryConfig } from '@/api/config/validation-classes/vector-validation-classes/kml-layer-entry-config';
import { AbstractGVVector } from '@/geo/layer/gv-layers/vector/abstract-gv-vector';

/**
 * Manages a KML layer.
 *
 * @exports
 * @class GVKML
 */
export class GVKML extends AbstractGVVector {
  /**
   * Constructs a GVKML layer to manage an OpenLayer layer.
   * @param {VectorSource} olSource - The OpenLayer source.
   * @param {KmlLayerEntryConfig} layerConfig - The layer configuration.
   */
  // The constructor is not useless, it narrows down the accepted parameter type.
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(olSource: VectorSource, layerConfig: KmlLayerEntryConfig) {
    super(olSource, layerConfig);
  }

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   * @override
   * @returns {KmlLayerEntryConfig} The strongly-typed layer configuration specific to this layer.
   */
  override getLayerConfig(): KmlLayerEntryConfig {
    // Call parent and cast
    return super.getLayerConfig() as KmlLayerEntryConfig;
  }
}
