import type VectorSource from 'ol/source/Vector';
import type { EsriFeatureLayerEntryConfig } from '@/api/config/validation-classes/vector-validation-classes/esri-feature-layer-entry-config';
import { AbstractGVVector } from '@/geo/layer/gv-layers/vector/abstract-gv-vector';
/**
 * Manages an Esri Feature layer.
 */
export declare class GVEsriFeature extends AbstractGVVector {
    /**
     * Constructs a GVEsriFeature layer to manage an OpenLayer layer.
     *
     * @param olSource - The OpenLayer source.
     * @param layerConfig - The layer configuration.
     */
    constructor(olSource: VectorSource, layerConfig: EsriFeatureLayerEntryConfig);
    /**
     * Overrides the parent class's getter to provide a more specific return type (covariant return).
     *
     * @returns The strongly-typed layer configuration specific to this layer.
     */
    getLayerConfig(): EsriFeatureLayerEntryConfig;
}
//# sourceMappingURL=gv-esri-feature.d.ts.map