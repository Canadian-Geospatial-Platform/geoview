import type { Vector as VectorSource } from 'ol/source';
import { AbstractGVVector } from '@/geo/layer/gv-layers/vector/abstract-gv-vector';
import type { WfsLayerEntryConfig } from '@/api/config/validation-classes/vector-validation-classes/wfs-layer-entry-config';
import type { TypeOutfieldsType } from '@/api/types/map-schema-types';
/**
 * Manages a WFS layer.
 *
 * @exports
 * @class GVWFS
 */
export declare class GVWFS extends AbstractGVVector {
    /**
     * Constructs a GVWFS layer to manage an OpenLayer layer.
     * @param {VectorSource} olSource - The OpenLayer source.
     * @param {WfsLayerEntryConfig} layerConfig - The layer configuration.
     */
    constructor(olSource: VectorSource, layerConfig: WfsLayerEntryConfig);
    /**
     * Overrides the parent class's getter to provide a more specific return type (covariant return).
     * @override
     * @returns {WfsLayerEntryConfig} The strongly-typed layer configuration specific to this layer.
     */
    getLayerConfig(): WfsLayerEntryConfig;
    /**
     * Overrides the return of the field type from the metadata. If the type can not be found, return 'string'.
     * @param {string} fieldName - The field name for which we want to get the type.
     * @returns {TypeOutfieldsType} The type of the field.
     */
    protected onGetFieldType(fieldName: string): TypeOutfieldsType;
}
//# sourceMappingURL=gv-wfs.d.ts.map