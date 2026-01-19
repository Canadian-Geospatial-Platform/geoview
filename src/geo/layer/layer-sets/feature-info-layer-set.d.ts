import type { Coordinate } from 'ol/coordinate';
import type { EventDelegateBase } from '@/api/events/event-helper';
import type { QueryType, TypeResultSet } from '@/api/types/map-schema-types';
import type { AbstractBaseGVLayer } from '@/geo/layer/gv-layers/abstract-base-layer';
import type { PropagationType } from '@/geo/layer/layer-sets/abstract-layer-set';
import { AbstractLayerSet } from '@/geo/layer/layer-sets/abstract-layer-set';
import type { LayerApi } from '@/geo/layer/layer';
import type { TypeFeatureInfoResultSet, TypeFeatureInfoResultSetEntry } from '@/core/stores/store-interface-and-intial-values/feature-info-state';
/**
 * A Layer-set working with the LayerApi at handling a result set of registered layers and synchronizing
 * events happening on them (in this case when the user click a location on the map) with a store
 * for UI updates.
 * @class FeatureInfoLayerSet
 */
export declare class FeatureInfoLayerSet extends AbstractLayerSet {
    #private;
    /** The query type */
    static QUERY_TYPE: QueryType;
    /** The resultSet object as existing in the base class, retyped here as a TypeFeatureInfoResultSet */
    resultSet: TypeFeatureInfoResultSet;
    /**
     * The class constructor that instanciate a set of layer.
     * @param {LayerApi} layerApi - The layer Api to work with.
     */
    constructor(layerApi: LayerApi);
    /**
     * Overrides the behavior to apply when a feature-info-layer-set wants to check for condition to register a layer in its set.
     * @param {AbstractBaseGVLayer} layer - The layer
     * @returns {boolean} True when the layer should be registered to this feature-info-layer-set.
     */
    protected onRegisterLayerCheck(layer: AbstractBaseGVLayer): boolean;
    /**
     * Overrides the behavior to apply when a feature-info-layer-set wants to register a layer in its set.
     * @param {AbstractBaseGVLayer} layer - The layer
     */
    protected onRegisterLayer(layer: AbstractBaseGVLayer): void;
    /**
     * Overrides the behavior to apply when propagating to the store
     * @param {TypeFeatureInfoResultSetEntry} resultSetEntry - The result set entry to propagate
     * @param {PropagationType} type - The propagation type
     */
    protected onPropagateToStore(resultSetEntry: TypeFeatureInfoResultSetEntry, type: PropagationType): void;
    /**
     * Overrides the behavior to apply when deleting from the store
     * @param {string} layerPath - The layer path to delete from the store
     */
    protected onDeleteFromStore(layerPath: string): void;
    /**
     * Repeats the last query if there was one.
     * @returns {void}
     */
    repeatLastQuery(): void;
    /**
     * Queries the features at the provided coordinate for all the registered layers.
     * @param {Coordinate} lonLatCoordinate - The longitude/latitude coordinate where to query the features
     * @param {boolean} fromClick - True if the query is from a user click, false otherwise.
     * @returns {Promise<TypeFeatureInfoResultSet>} A promise which will hold the result of the query
     * @throws {LayerNotFoundError} When the layer couldn't be found at the given layer path.
     */
    queryLayers(lonLatCoordinate: Coordinate, fromClick?: boolean): Promise<TypeFeatureInfoResultSet>;
    /**
     * Clears the results for the provided layer path.
     * @param {string} layerPath - The layer path
     */
    clearResults(layerPath: string): void;
    /**
     * Registers a query ended event handler.
     * @param {QueryEndedDelegate} callback - The callback to be executed whenever the event is emitted
     */
    onQueryEnded(callback: QueryEndedDelegate): void;
    /**
     * Unregisters a query ended event handler.
     * @param {QueryEndedDelegate} callback - The callback to stop being called whenever the event is emitted
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