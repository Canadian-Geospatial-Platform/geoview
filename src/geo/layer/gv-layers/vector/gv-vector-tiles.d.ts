import { VectorTile } from 'ol/source';
import { VectorTilesLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/vector-tiles-layer-entry-config';
import { AbstractGVVectorTile } from '@/geo/layer/gv-layers/vector/abstract-gv-vector-tile';
import { TypeOutfieldsType } from '@/api/config/types/map-schema-types';
/**
 * Manages a Vector Tiles layer.
 *
 * @exports
 * @class GVVectorTiles
 */
export declare class GVVectorTiles extends AbstractGVVectorTile {
    /**
     * Constructs a GVVectorTiles layer to manage an OpenLayer layer.
     * @param {VectorTile} olSource - The OpenLayer source.
     * @param {VectorTilesLayerEntryConfig} layerConfig - The layer configuration.
     */
    constructor(olSource: VectorTile, layerConfig: VectorTilesLayerEntryConfig);
    /**
     * Overrides the get of the layer configuration associated with the layer.
     * @returns {VectorTilesLayerEntryConfig} The layer configuration or undefined if not found.
     */
    getLayerConfig(): VectorTilesLayerEntryConfig;
    /**
     * Overrides the return of the field type from the metadata. If the type can not be found, return 'string'.
     * @param {string} fieldName - The field name for which we want to get the type.
     * @returns {TypeOutfieldsType} The type of the field.
     */
    protected getFieldType(fieldName: string): TypeOutfieldsType;
    /**
     * Used to change the style of the vector tile layer.
     * @param styleUrl The style URL to apply to the layer
     * @returns Promise<void>
     */
    changeStyle(styleUrl: string): Promise<void>;
}
//# sourceMappingURL=gv-vector-tiles.d.ts.map