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
export declare class GVOGCFeature extends AbstractGVVector {
    /**
     * Constructs a GVOGCFeature layer to manage an OpenLayer layer.
     * @param {VectorSource} olSource - The OpenLayer source.
     * @param {OgcFeatureLayerEntryConfig} layerConfig - The layer configuration.
     */
    constructor(olSource: VectorSource, layerConfig: OgcFeatureLayerEntryConfig);
    /**
     * Overrides the parent class's getter to provide a more specific return type (covariant return).
     * @override
     * @returns {OgcFeatureLayerEntryConfig} The strongly-typed layer configuration specific to this layer.
     */
    getLayerConfig(): OgcFeatureLayerEntryConfig;
    /**
     * Overrides the return of the field type from the metadata. If the type can not be found, return 'string'.
     * @param {string} fieldName - The field name for which we want to get the type.
     * @returns {TypeOutfieldsType} The type of the field.
     */
    protected onGetFieldType(fieldName: string): TypeOutfieldsType;
    /**
     * Returns field type of the given field name using the povided OGC Feature metadata.
     * @param {TypeLayerMetadataOGC} layerMetadata - The OGC Feature metadata
     * @param {string} fieldName - The field name to get the field type information
     * @returns {TypeOutfieldsType} The field type information for the given field name
     */
    static getFieldType(layerMetadata: TypeLayerMetadataOGC | undefined, fieldName: string): TypeOutfieldsType;
}
//# sourceMappingURL=gv-ogc-feature.d.ts.map