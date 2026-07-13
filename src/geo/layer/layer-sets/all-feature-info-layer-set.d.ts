import type { QueryType, TypeFeatureInfoResult } from '@/api/types/map-schema-types';
import type { EventDelegateBase } from '@/api/events/event-helper';
import type { AbstractBaseGVLayer } from '@/geo/layer/gv-layers/abstract-base-layer';
import { AbstractLayerSet } from '@/geo/layer/layer-sets/abstract-layer-set';
/**
 * A Layer-set working with the LayerSetController at handling a result set of registered layers and synchronizing
 * events happening on them (in this case when the user queries for all records within a layer) with a store
 * for UI updates.
 */
export declare class AllFeatureInfoLayerSet extends AbstractLayerSet {
    #private;
    /** The query type */
    static QUERY_TYPE: QueryType;
    /**
     * Overrides the behavior to apply when a feature-info-layer-set wants to check for condition to register a layer in its set.
     *
     * @param layer - The layer
     * @returns True when the layer should be registered to this all-feature-info-layer-set
     */
    protected onRegisterLayerCheck(layer: AbstractBaseGVLayer): boolean;
    /**
     * Overrides the behavior to apply when an all-feature-info-layer-set wants to register a layer in its set.
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
     * Helper function used to launch the query on a layer to get all of its feature information.
     *
     * @param layerPath - The layerPath that will be queried
     * @param queryType - The query type, default: AllFeatureInfoLayerSet.QUERY_TYPE
     * @returns A promise that resolves with the result of the query
     * @throws {NotSupportedError} When `queryType` is not one of the supported query types
     */
    queryLayer(layerPath: string, queryType?: QueryType): Promise<TypeFeatureInfoResult>;
    /**
     * Clears all stored features for a specific layer in the Feature Info result set.
     *
     * If the given `layerPath` exists in the internal `resultSet`, this method:
     * - Sets its `features` property to `null`, effectively removing all features.
     * - Propagates the updated layer result to the external store.
     * If the layer path does not exist in the result set, the method does nothing.
     *
     * @param layerPath - The unique path identifying the layer to clear
     */
    clearLayerFeatures(layerPath: string): void;
    /**
     * Waits for the query associated with a specific layer path to finish processing.
     *
     * This method returns a promise that resolves when the query status for the given `layerPath` in the store is 'processed'.
     *
     * @param layerPath - The unique path identifying the layer to check
     * @returns A promise that resolves when the query status is 'processed'
     */
    waitForLayerQueryToFinish(layerPath: string): Promise<void>;
    /**
     * Returns a promise that resolves the next time the layer queried event fires.
     *
     * @param filter - Optional filter predicate. When provided, only events passing the filter resolve the promise
     * @returns A promise that resolves with the event payload when layer queried fires (and passes the filter)
     */
    onceLayerQueried(filter?: (event: LayerQueriedEvent) => boolean): Promise<LayerQueriedEvent>;
    /**
     * Registers a layer queried event handler.
     *
     * @param callback - The callback to be executed whenever the event is emitted
     */
    onLayerQueried(callback: LayerQueriedDelegate): void;
    /**
     * Unregisters a layer queried event handler.
     *
     * @param callback - The callback to stop being called whenever the event is emitted
     */
    offLayerQueried(callback: LayerQueriedDelegate): void;
}
/**
 * Define an event for the delegate
 */
export interface LayerQueriedEvent {
    /** The layer path that was queried. */
    layerPath: string;
    /** The result of the query. */
    result: TypeFeatureInfoResult;
}
/**
 * Define a delegate for the event handler function signature
 */
export type LayerQueriedDelegate = EventDelegateBase<AllFeatureInfoLayerSet, LayerQueriedEvent, void>;
//# sourceMappingURL=all-feature-info-layer-set.d.ts.map