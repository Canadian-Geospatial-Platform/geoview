import { Coordinate } from 'ol/coordinate';
import { EventDelegateBase } from '@/api/events/event-helper';
import { TypeResultSet } from '@/api/config/types/map-schema-types';
import { AbstractBaseLayer } from '@/geo/layer/gv-layers/abstract-base-layer';
import { EventType, AbstractLayerSet, PropagationType } from '@/geo/layer/layer-sets/abstract-layer-set';
import { LayerApi } from '@/geo/layer/layer';
import { TypeFeatureInfoResultSet, TypeFeatureInfoResultSetEntry } from '@/core/stores/store-interface-and-intial-values/feature-info-state';
/**
 * A Layer-set working with the LayerApi at handling a result set of registered layers and synchronizing
 * events happening on them (in this case when the user click a location on the map) with a store
 * for UI updates.
 * @class FeatureInfoLayerSet
 */
export declare class FeatureInfoLayerSet extends AbstractLayerSet {
    #private;
    /** The resultSet object as existing in the base class, retyped here as a TypeFeatureInfoResultSet */
    resultSet: TypeFeatureInfoResultSet;
    /**
     * The class constructor that instanciate a set of layer.
     * @param {LayerApi} layerApi - The layer Api to work with.
     */
    constructor(layerApi: LayerApi);
    /**
     * Overrides the behavior to apply when a feature-info-layer-set wants to check for condition to register a layer in its set.
     * @param {AbstractBaseLayer} layer - The layer
     * @returns {boolean} True when the layer should be registered to this feature-info-layer-set.
     */
    protected onRegisterLayerCheck(layer: AbstractBaseLayer): boolean;
    /**
     * Overrides the behavior to apply when a feature-info-layer-set wants to register a layer in its set.
     * @param {AbstractBaseLayer} layer - The layer
     */
    protected onRegisterLayer(layer: AbstractBaseLayer): void;
    /**
     * Overrides the behavior to apply when propagating to the store
     * @param {TypeFeatureInfoResultSetEntry} resultSetEntry - The result set entry to propagate
     */
    protected onPropagateToStore(resultSetEntry: TypeFeatureInfoResultSetEntry, type: PropagationType): void;
    /**
     * Overrides the behavior to apply when deleting from the store
     * @param {string} layerPath - The layer path to delete from the store
     */
    protected onDeleteFromStore(layerPath: string): void;
    /**
     * Queries the features at the provided coordinate for all the registered layers.
     * @param {Coordinate} longLatCoordinate - The longitude/latitude coordinate where to query the features
     * @returns {Promise<TypeFeatureInfoResultSet>} A promise which will hold the result of the query
     */
    queryLayers(longLatCoordinate: Coordinate): Promise<TypeFeatureInfoResultSet>;
    /**
     * Function used to enable listening of click events. When a layer path is not provided,
     * click events listening is enabled for all layers
     * @param {string} layerPath - Optional parameter used to enable only one layer
     */
    enableClickListener(layerPath?: string): void;
    /**
     * Function used to disable listening of click events. When a layer path is not provided,
     * click events listening is disable for all layers
     * @param {string} layerPath - Optional parameter used to disable only one layer
     */
    disableClickListener(layerPath?: string): void;
    /**
     * Function used to determine whether click events are disabled for a layer. When a layer path is not provided,
     * the value returned is undefined if the map flags are a mixture of true and false values.
     * @param {string} layerPath - Optional parameter used to get the flag value of a layer.
     * @returns {boolean | undefined} The flag value for the map or layer.
     */
    isClickListenerEnabled(layerPath?: string): boolean | undefined;
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
    eventType: EventType;
};
export {};
