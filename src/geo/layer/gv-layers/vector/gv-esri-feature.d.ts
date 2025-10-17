import type VectorSource from 'ol/source/Vector';
import type { EsriFeatureLayerEntryConfig } from '@/api/config/validation-classes/vector-validation-classes/esri-feature-layer-entry-config';
import type { codedValueType, rangeDomainType, TypeOutfieldsType } from '@/api/types/map-schema-types';
import { AbstractGVVector } from '@/geo/layer/gv-layers/vector/abstract-gv-vector';
/**
 * Manages an Esri Feature layer.
 *
 * @exports
 * @class GVEsriFeature
 */
export declare class GVEsriFeature extends AbstractGVVector {
    /**
     * Constructs a GVEsriFeature layer to manage an OpenLayer layer.
     * @param {VectorSource} olSource - The OpenLayer source.
     * @param {EsriFeatureLayerEntryConfig} layerConfig - The layer configuration.
     */
    constructor(olSource: VectorSource, layerConfig: EsriFeatureLayerEntryConfig);
    /**
     * Overrides the parent class's getter to provide a more specific return type (covariant return).
     * @override
     * @returns {EsriFeatureLayerEntryConfig} The strongly-typed layer configuration specific to this layer.
     */
    getLayerConfig(): EsriFeatureLayerEntryConfig;
    /**
     * Overrides the return of the field type from the metadata. If the type can not be found, return 'string'.
     * @param {string} fieldName - The field name for which we want to get the type.
     * @returns {TypeOutfieldsType} The type of the field.
     */
    protected onGetFieldType(fieldName: string): TypeOutfieldsType;
    /**
     * Overrides the return of the domain of the specified field.
     * @param {string} fieldName - The field name for which we want to get the domain.
     * @returns {null | codedValueType | rangeDomainType} The domain of the field.
     */
    protected onGetFieldDomain(fieldName: string): null | codedValueType | rangeDomainType;
}
//# sourceMappingURL=gv-esri-feature.d.ts.map