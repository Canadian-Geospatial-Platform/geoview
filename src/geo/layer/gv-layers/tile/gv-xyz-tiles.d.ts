import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';
import { Extent } from 'ol/extent';
import { XYZTilesLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/xyz-layer-entry-config';
import { AbstractGVTile } from './abstract-gv-tile';
/**
 * Manages a Tile<XYZ> layer.
 *
 * @exports
 * @class GVXYZTiles
 */
export declare class GVXYZTiles extends AbstractGVTile {
    /**
     * Constructs a GVXYZTiles layer to manage an OpenLayer layer.
     * @param {string} mapId - The map id
     * @param {XYZ} olSource - The OpenLayer source.
     * @param {XYZTilesLayerEntryConfig} layerConfig - The layer configuration.
     */
    constructor(mapId: string, olSource: XYZ, layerConfig: XYZTilesLayerEntryConfig);
    /**
     * Overrides the get of the OpenLayers Layer
     * @returns {TileLayer<XYZ>} The OpenLayers Layer
     */
    getOLLayer(): TileLayer<XYZ>;
    /**
     * Overrides the get of the OpenLayers Layer Source
     * @returns {XYZ} The OpenLayers Layer Source
     */
    getOLSource(): XYZ;
    /**
     * Overrides the get of the layer configuration associated with the layer.
     * @returns {XYZTilesLayerEntryConfig} The layer configuration or undefined if not found.
     */
    getLayerConfig(): XYZTilesLayerEntryConfig;
    /**
     * Overrides the return of the field type from the metadata. If the type can not be found, return 'string'.
     * @param {string} fieldName - The field name for which we want to get the type.
     * @returns {'string' | 'date' | 'number'} The type of the field.
     */
    protected getFieldType(fieldName: string): 'string' | 'date' | 'number';
    /**
     * Gets the bounds of the layer and returns updated bounds.
     * @returns {Extent | undefined} The layer bounding box.
     */
    getBounds(layerPath: string): Extent | undefined;
}
