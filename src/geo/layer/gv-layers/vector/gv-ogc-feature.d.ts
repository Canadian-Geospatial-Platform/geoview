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
}
//# sourceMappingURL=gv-ogc-feature.d.ts.map