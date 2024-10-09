import { EventDelegateBase } from '@/api/events/event-helper';
import { QueryType, TypeFeatureInfoEntry, TypeLayerEntryConfig, TypeLayerStatus, TypeLocation, TypeResultSet, TypeResultSetEntry } from '@/geo/map/map-schema-types';
import { TypeAllFeatureInfoResultSetEntry } from '@/core/stores/store-interface-and-intial-values/data-table-state';
import { TypeFeatureInfoResultSetEntry, TypeHoverResultSetEntry } from '@/core/stores/store-interface-and-intial-values/feature-info-state';
import { AbstractGeoViewLayer } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { ConfigBaseClass } from '@/core/utils/config/validation-classes/config-base-class';
import { LayerApi } from '@/geo/layer/layer';
import { AbstractGVLayer } from '../gv-layers/abstract-gv-layer';
import { AbstractBaseLayer } from '../gv-layers/abstract-base-layer';
/**
 * A class to hold a set of layers associated with a value of any type.
 * Layers are added/removed to the layer-set via the registerOrUnregisterLayer function.
 * @class LayerSet
 * @exports
 */
export declare abstract class AbstractLayerSet {
    #private;
    /** The LayerApi to work with */
    protected layerApi: LayerApi;
    /** An object containing the result sets indexed using the layer path */
    resultSet: TypeResultSet;
    /**
     * Constructs a new LayerSet instance.
     * @param {LayerApi} layerApi - The LayerApi instance to work with.
     */
    constructor(layerApi: LayerApi);
    /**
     * A must-override method called to propagate the result set entry to the store
     * @param {TypeResultSetEntry} resultSetEntry - The result set entry to propagate
     */
    protected abstract onPropagateToStore(resultSetEntry: TypeResultSetEntry, type: PropagationType): void;
    /**
     * A must-override method called to delete a result set entry from the store
     * @param {string} layerPath - The layer path to delete from store
     */
    protected abstract onDeleteFromStore(layerPath: string): void;
    protected getMapId(): string;
    /**
     * Registers the layer config in the layer-set.
     * @param {ConfigBaseClass} layerConfig - The layer config
     */
    registerLayerConfig(layerConfig: ConfigBaseClass): void;
    /**
     * An overridable registration condition function for a layer-set to check if the registration
     * should happen for a specific geoview layer and layer path.
     * @param {ConfigBaseClass} layerConfig - The layer config
     * @returns {boolean} True if the layer config should be registered, false otherwise
     */
    protected onRegisterLayerConfigCheck(layerConfig: ConfigBaseClass): boolean;
    /**
     * An overridable registration function for a layer-set that the registration process will use to
     * create a new entry in the layer set for a specific geoview layer and layer path.
     * @param {ConfigBaseClass} layerConfig - The layer config
     */
    protected onRegisterLayerConfig(layerConfig: ConfigBaseClass): void;
    /**
     * Registers the layer in the layer-set.
     * @param {AbstractGeoViewLayer | AbstractBaseLayer} layer - The layer
     */
    registerLayer(layer: AbstractGeoViewLayer | AbstractBaseLayer, layerPath: string): Promise<void>;
    /**
     * An overridable registration condition function for a layer-set to check if the registration
     * should happen for a specific geoview layer and layer path. By default, a layer-set always registers layers except when they are group layers.
     * @param {AbstractGeoViewLayer | AbstractBaseLayer} layer - The layer
     * @returns {boolean} True if the layer should be registered, false otherwise
     */
    protected onRegisterLayerCheck(layer: AbstractGeoViewLayer | AbstractBaseLayer, layerPath: string): boolean;
    /**
     * An overridable registration function for a layer-set that the registration process will use to
     * create a new entry in the layer set for a specific geoview layer and layer path.
     * @param {AbstractGeoViewLayer | AbstractBaseLayer} layer - The layer config
     */
    protected onRegisterLayer(layer: AbstractGeoViewLayer | AbstractBaseLayer, layerPath: string): void;
    /**
     * Unregisters the layer config and layer from the layer-set.
     * @param {string} layerPath - The layer path
     */
    unregister(layerPath: string): void;
    /**
     * An overridable unregistration function for a layer-set that the registration process will use to
     * unregister a specific layer config.
     * @param {ConfigBaseClass | undefined} layerConfig - The layer config
     */
    protected onUnregisterLayerConfig(layerConfig: ConfigBaseClass | undefined): void;
    /**
     * An overridable unregistration function for a layer-set that the registration process will use to
     * unregister a specific geoview layer.
     * @param {AbstractGeoViewLayer | AbstractBaseLayer | undefined} layer - The layer
     */
    protected onUnregisterLayer(layer: AbstractGeoViewLayer | AbstractBaseLayer | undefined): void;
    /**
     * An overridable function for a layer-set to process a layer status changed event.
     * @param {ConfigBaseClass} layerConfig - The layer config
     * @param {TypeLayerStatus} layerStatus - The new layer status
     */
    protected onProcessLayerStatusChanged(layerConfig: ConfigBaseClass, layerStatus: TypeLayerStatus): void;
    /**
     * An overridable function for a layer-set to process a layer name change.
     * @param {string} layerPath - The layer path being affected
     * @param {string} name - The new layer name
     */
    protected onProcessNameChanged(layerPath: string, name: string): void;
    /**
     * An overridable layer set updated function for a layer-set to indicate the layer set has been updated.
     * @param {string} layerPath - The layer path
     */
    protected onLayerSetUpdatedProcess(layerPath: string): void;
    /**
     * Processes layer data to query features on it, if the layer path can be queried.
     * @param {TypeFeatureInfoResultSetEntry | TypeAllFeatureInfoResultSetEntry | TypeHoverResultSetEntry} data - The layer data
     * @param {AbstractGeoViewLayer | AbstractGVLayer} geoviewLayer - The geoview layer
     * @param {QueryType} queryType - The query type
     * @param {TypeLocation} location - The location for the query
     * @returns {Promise<TypeFeatureInfoEntry[] | undefined | null>} A promise resolving to the query results
     */
    protected static queryLayerFeatures(data: TypeFeatureInfoResultSetEntry | TypeAllFeatureInfoResultSetEntry | TypeHoverResultSetEntry, geoviewLayer: AbstractGeoViewLayer | AbstractGVLayer, queryType: QueryType, location: TypeLocation): Promise<TypeFeatureInfoEntry[] | undefined | null>;
    /**
     * Checks if the layer is of queryable type based on its class definition
     * @param {AbstractGeoViewLayer | AbstractBaseLayer} layer - The layer
     * @returns True if the layer is of queryable type
     */
    protected static isQueryableType(layer: AbstractGeoViewLayer | AbstractBaseLayer): boolean;
    /**
     * Checks if the layer config source is queryable.
     * @param {AbstractGeoViewLayer | AbstractBaseLayer} layer - The layer
     * @returns {boolean} True if the source is queryable or undefined
     */
    protected static isSourceQueryable(layer: AbstractGeoViewLayer | AbstractBaseLayer, layerPath: string): boolean;
    /**
     * Checks if the layer config state is queryable.
     * @param {AbstractGeoViewLayer | AbstractBaseLayer} layer - The layer
     * @returns {boolean} True if the state is queryable or undefined
     */
    protected static isStateQueryable(layer: AbstractGeoViewLayer | AbstractBaseLayer, layerPath: string): boolean;
    /**
     * Align records with informatiom provided by OutFields from layer config.
     * This will update fields in and delete unwanted fields from the arrayOfRecords
     * @param {TypeLayerEntryConfig} layerPath - Path of the layer to get config from.
     * @param {TypeFeatureInfoEntry[]} arrayOfRecords - Features to delete fields from.
     * @protected
     * @static
     */
    protected static alignRecordsWithOutFields(layerEntryConfig: TypeLayerEntryConfig, arrayOfRecords: TypeFeatureInfoEntry[]): void;
    /**
     * Registers a callback to be executed whenever the layer set is updated.
     * @param {LayerSetUpdatedDelegate} callback - The callback function
     */
    onLayerSetUpdated(callback: LayerSetUpdatedDelegate): void;
    /**
     * Unregisters a callback from being called whenever the layer set is updated.
     * @param {LayerSetUpdatedDelegate} callback - The callback function to unregister
     */
    offLayerSetUpdated(callback: LayerSetUpdatedDelegate): void;
}
export type EventType = 'click' | 'hover' | 'all-features' | 'name';
export type PropagationType = 'config-registration' | 'layer-registration' | 'layerStatus' | 'layerName';
/**
 * Define a delegate for the event handler function signature
 */
type LayerSetUpdatedDelegate = EventDelegateBase<AbstractLayerSet, LayerSetUpdatedEvent, void>;
/**
 * Define an event for the delegate
 */
export type LayerSetUpdatedEvent = {
    layerPath: string;
    resultSet: TypeResultSet;
};
export {};
