import type LayerGroup from 'ol/layer/Group';
import type { Projection as OLProjection } from 'ol/proj';
import type { GroupLayerEntryConfig } from '@/api/config/validation-classes/group-layer-entry-config';
import { AbstractBaseGVLayer } from '@/geo/layer/gv-layers/abstract-base-layer';
/**
 * Manages a Group Layer.
 *
 * @exports
 * @class GVGroupLayer
 */
export declare class GVGroupLayer extends AbstractBaseGVLayer {
    #private;
    /**
     * Constructs a Group layer to manage an OpenLayer Group Layer.
     * @param {LayerGroup} olLayerGroup - The OpenLayer group layer.
     * @param {GroupLayerEntryConfig} layerConfig - The layer configuration.
     */
    constructor(olLayerGroup: LayerGroup, layerConfig: GroupLayerEntryConfig);
    /**
     * Overrides the parent class's getter to provide a more specific return type (covariant return).
     * @override
     * @returns {GroupLayerEntryConfig} The strongly-typed layer configuration specific to this group layer.
     */
    getLayerConfig(): GroupLayerEntryConfig;
    /**
     * Overrides the parent method to return a more specific OpenLayers layer type (covariant return).
     * @override
     * @returns {LayerGroup} The strongly-typed OpenLayers type.
     */
    getOLLayer(): LayerGroup;
    /**
     * Overrides the way the attributions are retrieved.
     * @override
     * @returns {string[]} The layer attributions.
     */
    onGetAttributions(): string[];
    /**
     * Overrides the refresh function to refresh each layer in the group.
     * @param {OLProjection | undefined} projection - Optional, the projection to refresh to.
     * @override
     */
    onRefresh(projection: OLProjection | undefined): void;
    /**
     * Gets the layers in the group.
     * @returns {AbstractBaseGVLayer[]} The layers in the group.
     */
    getLayers(): AbstractBaseGVLayer[];
    /**
     * Adds a layer to the group layer.
     * @param {AbstractBaseGVLayer} layer - The layer to add.
     */
    addLayer(layer: AbstractBaseGVLayer): void;
    /**
     * Removes a layer from the group layer.
     * @param {AbstractBaseGVLayer} layer - The layer to remove.
     */
    removeLayer(layer: AbstractBaseGVLayer): void;
}
//# sourceMappingURL=gv-group-layer.d.ts.map