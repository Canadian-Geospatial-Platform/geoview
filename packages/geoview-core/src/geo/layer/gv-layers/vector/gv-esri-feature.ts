import type VectorSource from 'ol/source/Vector';

import type { EsriFeatureLayerEntryConfig } from '@/api/config/validation-classes/vector-validation-classes/esri-feature-layer-entry-config';
import { AbstractGVVector } from '@/geo/layer/gv-layers/vector/abstract-gv-vector';

/**
 * Manages an Esri Feature layer.
 *
 * @exports
 * @class GVEsriFeature
 */
export class GVEsriFeature extends AbstractGVVector {
  /**
   * Constructs a GVEsriFeature layer to manage an OpenLayer layer.
   * @param {VectorSource} olSource - The OpenLayer source.
   * @param {EsriFeatureLayerEntryConfig} layerConfig - The layer configuration.
   */
  // The constructor is not useless, it narrows down the accepted parameter type.
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(olSource: VectorSource, layerConfig: EsriFeatureLayerEntryConfig) {
    super(olSource, layerConfig);
  }

  // #region OVERRIDES

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   * @returns {EsriFeatureLayerEntryConfig} The strongly-typed layer configuration specific to this layer.
   * @override
   * @protected
   */
  override getLayerConfig(): EsriFeatureLayerEntryConfig {
    // Call parent and cast
    return super.getLayerConfig() as EsriFeatureLayerEntryConfig;
  }

  // #endregion OVERRIDES
}
