import type { ConfigBaseClass } from '@/api/config/validation-classes/config-base-class';
import { AbstractLayerSet } from '@/geo/layer/layer-sets/abstract-layer-set';
import type { ControllerRegistry } from '@/core/controllers/base/controller-registry';
import type { LayerDomain } from '@/core/domains/layer-domain';
import type { AbstractBaseGVLayer } from '@/geo/layer/gv-layers/abstract-base-layer';
import type { MapViewer } from '@/geo/map/map-viewer';
/**
 * A Layer-set working with the LayerSetController at handling a result set of registered layers and synchronizing
 * events happening on them (in this case when the layers are going through the layer statuses and legend querying) with a store
 * for UI updates.
 */
export declare class LegendsLayerSet extends AbstractLayerSet {
    #private;
    /**
     * Constructs a Legends LayerSet to manage layers legends.
     *
     * @param mapViewer - The map viewer
     * @param controllerRegistry - The controller registry
     * @param layerDomain - The layer domain
     */
    constructor(mapViewer: MapViewer, controllerRegistry: ControllerRegistry, layerDomain: LayerDomain);
    /**
     * Overrides the behavior to apply when an all-feature-info-layer-set wants to check for condition to register a layer in its set.
     *
     * @param layerConfig - The layer config
     * @returns True when the layer should be registered to this legends-layer-set
     */
    protected onRegisterLayerConfigCheck(layerConfig: ConfigBaseClass): boolean;
    /**
     * Overrides the behavior to apply when an all-feature-info-layer-set wants to check for condition to register a layer in its set.
     *
     * @param layer - The layer
     * @returns True when the layer should be registered to this legends-layer-set
     */
    protected onRegisterLayerCheck(layer: AbstractBaseGVLayer): boolean;
    /**
     * Overrides the behavior to apply when a legends-layer-set wants to register a layer in its set.
     *
     * @param layerConfig - The layer config
     */
    protected onRegisterLayerConfig(layerConfig: ConfigBaseClass): void;
    /**
     * Overrides the behavior to apply when a legends-layer-set wants to unregister a layer in its set.
     *
     * @param layerConfig - The layer config
     */
    protected onUnregisterLayerConfig(layerConfig: ConfigBaseClass | undefined): void;
    /**
     * Overrides the behavior to apply when a legends-layer-set wants to register a layer in its set.
     *
     * @param layer - The layer
     */
    protected onRegisterLayer(layer: AbstractBaseGVLayer): void;
    /**
     * Overrides the behavior to apply when deleting from the store.
     *
     * @param layerPath - The layer path to delete from the store
     */
    protected onDeleteFromStore(layerPath: string): void;
    /**
     * Queries the legend for the given layer path.
     *
     * @param layerPath - The layer path to query the legend for
     * @param forced - Whether to force the query even if already queried
     */
    queryLegend(layer: AbstractBaseGVLayer, forced?: boolean): void;
}
//# sourceMappingURL=legends-layer-set.d.ts.map