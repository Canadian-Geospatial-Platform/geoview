import VectorSource from 'ol/source/Vector';
import { AbstractGVVector } from '@/geo/layer/gv-layers/vector/abstract-gv-vector';
import { OgcFeatureLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-validation-classes/ogc-layer-entry-config';
import { TypeOutfieldsType } from '@/api/config/types/map-schema-types';
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
     * Overrides the get of the layer configuration associated with the layer.
     * @returns {OgcFeatureLayerEntryConfig} The layer configuration or undefined if not found.
     */
    getLayerConfig(): OgcFeatureLayerEntryConfig;
    /**
     * Overrides the return of the field type from the metadata. If the type can not be found, return 'string'.
     * @param {string} fieldName - The field name for which we want to get the type.
     * @returns {TypeOutfieldsType} The type of the field.
     */
    protected getFieldType(fieldName: string): TypeOutfieldsType;
}
