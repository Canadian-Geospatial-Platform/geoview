import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';
import { Extent } from 'ol/extent';
import { Projection as OLProjection } from 'ol/proj';
import { XYZTilesLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/xyz-layer-entry-config';
import { AbstractGVTile } from '@/geo/layer/gv-layers/tile/abstract-gv-tile';
import { TypeOutfieldsType } from '@/api/config/types/map-schema-types';
/**
 * Manages a Tile<XYZ> layer.
 *
 * @exports
 * @class GVXYZTiles
 */
export declare class GVXYZTiles extends AbstractGVTile {
    /**
     * Constructs a GVXYZTiles layer to manage an OpenLayer layer.
     * @param {XYZ} olSource - The OpenLayer source.
     * @param {XYZTilesLayerEntryConfig} layerConfig - The layer configuration.
     */
    constructor(olSource: XYZ, layerConfig: XYZTilesLayerEntryConfig);
    /**
     * Overrides the parent method to return a more specific OpenLayers layer type (covariant return).
     * @override
     * @returns {TileLayer<XYZ>} The strongly-typed OpenLayers type.
     */
    getOLLayer(): TileLayer<XYZ>;
    /**
     * Overrides the parent class's method to return a more specific OpenLayers source type (covariant return).
     * @override
     * @returns {XYZ} The XYZ source instance associated with this layer.
     */
    getOLSource(): XYZ;
    /**
     * Overrides the parent class's getter to provide a more specific return type (covariant return).
     * @override
     * @returns {XYZTilesLayerEntryConfig} The strongly-typed layer configuration specific to this layer.
     */
    getLayerConfig(): XYZTilesLayerEntryConfig;
    /**
     * Overrides the return of the field type from the metadata. If the type can not be found, return 'string'.
     * @param {string} fieldName - The field name for which we want to get the type.
     * @returns {TypeOutfieldsType} The type of the field.
     */
    protected onGetFieldType(fieldName: string): TypeOutfieldsType;
    /**
     * Overrides the way to get the bounds for this layer type.
     * @param {OLProjection} projection - The projection to get the bounds into.
     * @param {number} stops - The number of stops to use to generate the extent.
     * @returns {Extent | undefined} The layer bounding box.
     */
    onGetBounds(projection: OLProjection, stops: number): Extent | undefined;
}
//# sourceMappingURL=gv-xyz-tiles.d.ts.map