import { Vector as VectorSource } from 'ol/source';
import { AbstractGVVector } from './abstract-gv-vector';
import { WfsLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-validation-classes/wfs-layer-entry-config';
import { TypeOutfieldsType } from '@/api/config/types/map-schema-types';
/**
 * Manages a WFS layer.
 *
 * @exports
 * @class GVWFS
 */
export declare class GVWFS extends AbstractGVVector {
    /**
     * Constructs a GVWFS layer to manage an OpenLayer layer.
     * @param {string} mapId - The map id
     * @param {VectorSource} olSource - The OpenLayer source.
     * @param {WfsLayerEntryConfig} layerConfig - The layer configuration.
     */
    constructor(mapId: string, olSource: VectorSource, layerConfig: WfsLayerEntryConfig);
    /**
     * Overrides the get of the layer configuration associated with the layer.
     * @returns {WfsLayerEntryConfig} The layer configuration or undefined if not found.
     */
    getLayerConfig(): WfsLayerEntryConfig;
    /**
     * Overrides the return of the field type from the metadata. If the type can not be found, return 'string'.
     * @param {string} fieldName - The field name for which we want to get the type.
     * @returns {TypeOutfieldsType} The type of the field.
     */
    protected getFieldType(fieldName: string): TypeOutfieldsType;
}
