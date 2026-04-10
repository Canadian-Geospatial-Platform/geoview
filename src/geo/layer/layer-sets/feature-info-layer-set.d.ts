import type { Coordinate } from 'ol/coordinate';
import type { EventDelegateBase } from '@/api/events/event-helper';
import type { QueryType, TypeResultSet } from '@/api/types/map-schema-types';
import type { AbstractBaseGVLayer } from '@/geo/layer/gv-layers/abstract-base-layer';
import { AbstractLayerSet, type PropagationType } from '@/geo/layer/layer-sets/abstract-layer-set';
import { type TypeFeatureInfoResultSet, type TypeFeatureInfoResultSetEntry } from '@/core/stores/store-interface-and-intial-values/feature-info-state';
/**
 * A Layer-set working with the LayerSetController at handling a result set of registered layers and synchronizing
 * events happening on them (in this case when the user click a location on the map) with a store
 * for UI updates.
 */
export declare class FeatureInfoLayerSet extends AbstractLayerSet {
    #private;
    /** The query type */
    static QUERY_TYPE: QueryType;
    /** The resultSet object as existing in the base class, retyped here as a TypeFeatureInfoResultSet */
    resultSet: TypeFeatureInfoResultSet;
    /**
     * Overrides the behavior to apply when a feature-info-layer-set wants to check for condition to register a layer in its set.
     *
     * @param layer - The layer
     * @returns True when the layer should be registered to this feature-info-layer-set
     */
    protected onRegisterLayerCheck(layer: AbstractBaseGVLayer): boolean;
    /**
     * Overrides the behavior to apply when a feature-info-layer-set wants to register a layer in its set.
     *
     * @param layer - The layer
     */
    protected onRegisterLayer(layer: AbstractBaseGVLayer): void;
    /**
     * Overrides the behavior to apply when propagating to the store.
     *
     * @param resultSetEntry - The result set entry to propagate
     * @param type - The propagation type
     */
    protected onPropagateToStore(resultSetEntry: TypeFeatureInfoResultSetEntry, type: PropagationType): void;
    /**
     * Overrides the behavior to apply when deleting from the store.
     *
     * @param layerPath - The layer path to delete from the store
     */
    protected onDeleteFromStore(layerPath: string): void;
    /**
     * Repeats the last query if there was one.
     *
     * @returns A promise that resolves with the result of the query
     * @throws {LayerNoLastQueryToPerformError} When there's no last query to perform
     */
    repeatLastQuery(): Promise<TypeFeatureInfoResultSet>;
    /**
     * Queries the features at the provided coordinate for all the registered layers.
     *
     * @param lonLatCoordinate - The longitude/latitude coordinate where to query the features
     * @param callbackWhenFirstQueryStarted - Optional callback to be executed when the first query has started progressing.
     * @returns A promise that resolves with the result of the query
     */
    queryLayers(lonLatCoordinate: Coordinate, callbackWhenFirstQueryStarted?: () => void): Promise<TypeFeatureInfoResultSet>;
    /**
     * Clears the results for the provided layer path.
     *
     * @param layerPath - The layer path
     */
    clearResults(layerPath: string): void;
    /**
     * Registers a query ended event handler.
     *
     * @param callback - The callback to be executed whenever the event is emitted
     */
    onQueryEnded(callback: QueryEndedDelegate): void;
    /**
     * Unregisters a query ended event handler.
     *
     * @param callback - The callback to stop being called whenever the event is emitted
     */
    offQueryEnded(callback: QueryEndedDelegate): void;
}
/**
 * Define a delegate for the event handler function signature
 */
type QueryEndedDelegate = EventDelegateBase<FeatureInfoLayerSet, QueryEndedEvent, void>;
/**
 * Define an event for the delegate
 */
export type QueryEndedEvent = {
    coordinate: Coordinate;
    resultSet: TypeResultSet;
};
export {};
//# sourceMappingURL=feature-info-layer-set.d.ts.map