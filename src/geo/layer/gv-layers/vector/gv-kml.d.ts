import type VectorSource from 'ol/source/Vector';
import type { KmlLayerEntryConfig } from '@/api/config/validation-classes/vector-validation-classes/kml-layer-entry-config';
import { AbstractGVVector } from '@/geo/layer/gv-layers/vector/abstract-gv-vector';
/**
 * Manages a KML layer.
 */
export declare class GVKML extends AbstractGVVector {
    /**
     * Constructs a GVKML layer to manage an OpenLayer layer.
     *
     * @param olSource - The OpenLayer source.
     * @param layerConfig - The layer configuration.
     */
    constructor(olSource: VectorSource, layerConfig: KmlLayerEntryConfig);
    /**
     * Overrides the parent class's getter to provide a more specific return type (covariant return).
     *
     * @returns The strongly-typed layer configuration specific to this layer.
     */
    getLayerConfig(): KmlLayerEntryConfig;
}
//# sourceMappingURL=gv-kml.d.ts.map