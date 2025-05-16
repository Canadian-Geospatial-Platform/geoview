import LayerGroup from 'ol/layer/Group';
import { AbstractBaseLayer } from '@/geo/layer/gv-layers/abstract-base-layer';
import { GroupLayerEntryConfig } from '@/core/utils/config/validation-classes/group-layer-entry-config';
/**
 * Manages a Group Layer.
 *
 * @exports
 * @class GVGroupLayer
 */
export declare class GVGroupLayer extends AbstractBaseLayer {
    /**
     * Constructs a Group layer to manage an OpenLayer Group Layer.
     * @param {LayerGroup} olLayerGroup - The OpenLayer group layer.
     * @param {GroupLayerEntryConfig} layerConfig - The layer configuration.
     */
    constructor(olLayerGroup: LayerGroup, layerConfig: GroupLayerEntryConfig);
    /**
     * Gets the layer configuration associated with the layer.
     * @returns {GroupLayerEntryConfig} The layer configuration
     */
    getLayerConfig(): GroupLayerEntryConfig;
    /**
     * Overrides the get of the OpenLayers Layer
     * @returns {Layer} The OpenLayers Layer
     */
    getOLLayer(): LayerGroup;
    /**
     * Gets the layer attributions of all layers in the group
     * @returns {string[]} The layer attributions
     */
    getAttributions(): string[];
}
