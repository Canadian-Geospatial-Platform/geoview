import type VectorSource from 'ol/source/Vector';
import { AbstractGVVector } from '@/geo/layer/gv-layers/vector/abstract-gv-vector';
import type { OgcFeatureLayerEntryConfig } from '@/api/config/validation-classes/vector-validation-classes/ogc-layer-entry-config';
import type { TypeOutfieldsType } from '@/api/types/map-schema-types';
import type { TypeLayerMetadataOGC } from '@/api/types/layer-schema-types';
/**
 * Manages an OGC-Feature layer.
 */
export declare class GVOGCFeature extends AbstractGVVector {
    /**
     * Constructs a GVOGCFeature layer to manage an OpenLayer layer.
     *
     * @param olSource - The OpenLayer source.
     * @param layerConfig - The layer configuration.
     */
    constructor(olSource: VectorSource, layerConfig: OgcFeatureLayerEntryConfig);
    /**
     * Overrides the parent class's getter to provide a more specific return type (covariant return).
     *
     * @returns The strongly-typed layer configuration specific to this layer.
     */
    getLayerConfig(): OgcFeatureLayerEntryConfig;
    /**
     * Returns field type of the given field name using the provided OGC Feature metadata.
     *
     * @param layerMetadata - The OGC Feature metadata.
     * @param fieldName - The field name to get the field type information.
     * @returns The field type information for the given field name.
     */
    static getFieldType(layerMetadata: TypeLayerMetadataOGC | undefined, fieldName: string): TypeOutfieldsType;
}
//# sourceMappingURL=gv-ogc-feature.d.ts.map