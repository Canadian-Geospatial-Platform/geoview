import type { ConfigBaseClass } from '@/api/config/validation-classes/config-base-class';
import { type EventDelegateBase } from '@/api/events/event-helper';
import type { TypeLayerStyleConfig } from '@/api/types/map-schema-types';
import type { TypeGeoviewLayerType } from '@/api/types/layer-schema-types';
import type { TypeLegendItem, TypeLegendLayerItem } from '@/core/components/layers/types';
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
    /**
     * Waits for the legend of the given layer path to be queried.
     *
     * Sync-checks the store first and resolves immediately when the legend query status is already `queried`.
     * Otherwise, subscribes to the legend-queried event and resolves when a valid legend payload arrives.
     * Payloads without a legend are ignored, and `no data` icon payloads are also ignored unless `acceptNoData`
     * is true, allowing the waiter to keep listening until a real legend is available.
     *
     * @param layerPath - The layer path to wait on
     * @param acceptNoIconsOrNoData - Optional flag. When true, a legend whose first icon is `no data` is treated as a valid resolution. Defaults to false
     * @returns A promise that resolves once the layer legend has been queried
     */
    waitForLegendQueried(layerPath: string, acceptNoIconsOrNoData?: boolean): Promise<LegendQueriedEvent>;
    /**
     * Registers a one-shot legend queried event handler that resolves a promise.
     *
     * @param filter - Optional filter predicate to skip non-matching events without unsubscribing
     * @returns A promise that resolves with the legend queried event
     */
    onceLegendQueried(filter?: (event: LegendQueriedEvent) => boolean): Promise<LegendQueriedEvent>;
    /**
     * Registers a legend queried event handler.
     *
     * @param callback - The callback to be executed whenever the event is emitted
     */
    onLegendQueried(callback: LegendQueriedDelegate): void;
    /**
     * Unregisters a legend queried event handler.
     *
     * @param callback - The callback to stop being called whenever the event is emitted
     */
    offLegendQueried(callback: LegendQueriedDelegate): void;
}
/** Event payload emitted when a layer legend has been queried successfully. */
export interface LegendQueriedEvent {
    /** The layer path for which the legend was queried. */
    layerPath: string;
    /** Optional legend schema tag. */
    legendSchemaTag?: TypeGeoviewLayerType;
    /** Optional style configuration associated with the legend. */
    styleConfig?: TypeLayerStyleConfig;
    /** Optional icons associated with the legend */
    icons?: TypeLegendLayerItem[];
    /** Optional items associated with the legend */
    items?: TypeLegendItem[];
}
/** Delegate for the {@link LegendQueriedEvent} handler. */
export type LegendQueriedDelegate = EventDelegateBase<LegendsLayerSet, LegendQueriedEvent, void>;
//# sourceMappingURL=legends-layer-set.d.ts.map