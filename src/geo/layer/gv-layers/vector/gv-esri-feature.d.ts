import VectorSource from 'ol/source/Vector';
import { EsriFeatureLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-validation-classes/esri-feature-layer-entry-config';
import { codedValueType, rangeDomainType } from '@/geo/map/map-schema-types';
import { AbstractGVVector } from './abstract-gv-vector';
/**
 * Manages an Esri Feature layer.
 *
 * @exports
 * @class GVEsriFeature
 */
export declare class GVEsriFeature extends AbstractGVVector {
    /**
     * Constructs a GVEsriFeature layer to manage an OpenLayer layer.
     * @param {string} mapId - The map id
     * @param {VectorSource} olSource - The OpenLayer source.
     * @param {EsriFeatureLayerEntryConfig} layerConfig - The layer configuration.
     */
    constructor(mapId: string, olSource: VectorSource, layerConfig: EsriFeatureLayerEntryConfig);
    /**
     * Overrides the get of the layer configuration associated with the layer.
     * @returns {EsriFeatureLayerEntryConfig} The layer configuration or undefined if not found.
     */
    getLayerConfig(): EsriFeatureLayerEntryConfig;
    /**
     * Overrides the return of the field type from the metadata. If the type can not be found, return 'string'.
     * @param {string} fieldName - The field name for which we want to get the type.
     * @returns {'string' | 'date' | 'number'} The type of the field.
     */
    protected getFieldType(fieldName: string): 'string' | 'date' | 'number';
    /**
     * Overrides the return of the domain of the specified field.
     * @param {string} fieldName - The field name for which we want to get the domain.
     * @returns {null | codedValueType | rangeDomainType} The domain of the field.
     */
    protected getFieldDomain(fieldName: string): null | codedValueType | rangeDomainType;
}
