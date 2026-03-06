import type { EventDelegateBase } from '@/api/events/event-helper';
import type { QueryType, TypeFeatureInfoEntry, TypeFeatureInfoResult, TypeLocation, TypeResultSet, TypeResultSetEntry } from '@/api/types/map-schema-types';
import type { ConfigBaseClass } from '@/api/config/validation-classes/config-base-class';
import type { AbstractBaseLayerEntryConfig } from '@/api/config/validation-classes/abstract-base-layer-entry-config';
import type { LayerApi } from '@/geo/layer/layer';
import type { AbstractGVLayer } from '@/geo/layer/gv-layers/abstract-gv-layer';
import type { AbstractBaseGVLayer } from '@/geo/layer/gv-layers/abstract-base-layer';
/**
 * A class to hold a set of layers associated with a value of any type.
 * Layers are added/removed to the layer-set via the registerOrUnregisterLayer function.
 * @class AbstractLayerSet
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
     * @param {PropagationType} type - The propagation type
     * @returns {void}
     * @protected
     */
    protected abstract onPropagateToStore(resultSetEntry: TypeResultSetEntry, type: PropagationType): void;
    /**
     * A must-override method called to delete a result set entry from the store
     * @param {string} layerPath - The layer path to delete from store
     * @returns {void}
     * @protected
     */
    protected abstract onDeleteFromStore(layerPath: string): void;
    /**
     * An overridable registration condition function for a layer-set to check if the registration
     * should happen for a specific geoview layer and layer path.
     *
     * @param layerConfig - The layer config
     * @returns True if the layer config should be registered, false otherwise
     */
    protected onRegisterLayerConfigCheck(layerConfig: ConfigBaseClass): boolean;
    /**
     * An overridable registration function for a layer-set that the registration process will use to
     * create a new entry in the layer set for a specific geoview layer and layer path.
     *
     * @param layerConfig - The layer config
     */
    protected onRegisterLayerConfig(layerConfig: ConfigBaseClass): void;
    /**
     * An overridable unregistration function for a layer-set that the registration process will use to
     * unregister a specific layer config.
     * @param {ConfigBaseClass | undefined} layerConfig - The layer config
     * @returns {void}
     * @protected
     */
    protected onUnregisterLayerConfig(layerConfig: ConfigBaseClass | undefined): void;
    /**
     * An overridable registration condition function for a layer-set to check if the registration
     * should happen for a specific geoview layer and layer path. By default, a layer-set always registers layers except when they are group layers.
     * @param {AbstractBaseGVLayer} layer - The layer
     * @returns {boolean} True if the layer should be registered, false otherwise
     * @protected
     */
    protected onRegisterLayerCheck(layer: AbstractBaseGVLayer): boolean;
    /**
     * An overridable registration function for a layer-set that the registration process will use to
     * create a new entry in the layer set for a specific geoview layer and layer path.
     * @param {AbstractBaseGVLayer} layer - The layer config
     * @returns {void}
     * @protected
     */
    protected onRegisterLayer(layer: AbstractBaseGVLayer): void;
    /**
     * An overridable layer set updated function for a layer-set to indicate the layer set has been updated.
     * @param {string} layerPath - The layer path
     * @returns {void}
     * @protected
     */
    protected onLayerSetUpdatedProcess(layerPath: string): void;
    /**
     * A quick getter to help identify which layerset class the current instance is coming from.
     */
    getClassName(): string;
    /**
     * Gets the registered layer paths based on the registered layers
     * @returns {string[]} An array of layer paths
     */
    getRegisteredLayerPaths(): string[];
    /**
     * Registers the layer config in the layer-set.
     * @param {ConfigBaseClass} layerConfig - The layer config
     */
    registerLayerConfig(layerConfig: ConfigBaseClass): void;
    /**
     * Registers the layer in the layer-set.
     * If the layer is already registered, the function returns immediately.
     * @param {AbstractBaseGVLayer} layer - The layer to register
     */
    registerLayer(layer: AbstractBaseGVLayer): Promise<void>;
    /**
     * Unregisters the layer config and layer from the layer-set.
     * @param {string} layerPath - The layer path
     */
    unregister(layerPath: string): void;
    /**
     * Gets the MapId for the layer set
     * @returns
     */
    protected getMapId(): string;
    /**
     * Processes layer data to query features on it, if the layer path can be queried.
     * @param {AbstractGVLayer} geoviewLayer - The geoview layer
     * @param {QueryType} queryType - The query type
     * @param {TypeLocation} location - The location for the query
     * @param {boolean} queryGeometry - The query geometry boolean
     * @param {AbortController?} [abortController] - The optional abort controller.
     * @returns {Promise<TypeFeatureInfoResult>} A promise resolving to the query results
     */
    protected queryLayerFeatures(geoviewLayer: AbstractGVLayer, queryType: QueryType, location: TypeLocation, queryGeometry?: boolean, abortController?: AbortController): Promise<TypeFeatureInfoResult>;
    /**
     * Checks if the layer is of queryable type based on its class definition
     * @param {AbstractBaseGVLayer} layer - The layer
     * @returns True if the layer is of queryable type
     */
    protected static isQueryableType(layer: AbstractBaseGVLayer): boolean;
    /**
     * Checks if the layer config source is queryable.
     * @param {AbstractBaseGVLayer} layer - The layer
     * @returns {boolean} True if the source is queryable or undefined
     */
    protected static isSourceQueryable(layer: AbstractBaseGVLayer): boolean;
    /**
     * Align records with informatiom provided by OutFields from layer config.
     * This will update fields in and delete unwanted fields from the arrayOfRecords
     * @param {AbstractBaseLayerEntryConfig} layerEntryConfig - The layer entry config object.
     * @param {TypeFeatureInfoEntry[]} arrayOfRecords - Features to delete fields from.
     * @static
     * @protected
     */
    protected static alignRecordsWithOutFields(layerEntryConfig: AbstractBaseLayerEntryConfig, arrayOfRecords: TypeFeatureInfoEntry[]): void;
    /**
     * Determines whether the retrieved feature info records contain real attribute fields
     * (i.e., key-value properties) or whether they were returned in a fallback
     * HTML/plain-text form, which commonly occurs with WMS `GetFeatureInfo` responses.
     * This is used primarily to detect when a WMS service cannot return structured
     * feature attributes and instead provides the feature data as a single HTML or
     * plain-text block.
     * **Logic summary:**
     * - For WMS layers (`OgcWmsLayerEntryConfig`):
     *   - If the first record contains exactly one property and that property is
     *     either `html` or `plain_text`, the method considers the response *not*
     *     to contain actual fields.
     * - For all other cases, the method assumes records contain valid structured attributes.
     * @param {AbstractBaseLayerEntryConfig} layerConfig
     *   The layer configuration used to determine whether special WMS handling applies.
     * @param {TypeFeatureInfoEntry[]} arrayOfRecords
     *   The retrieved feature info entries representing attributes or raw text content.
     * @returns {boolean}
     *   `true` if the feature info records contain real attribute fields;
     *   `false` if they consist only of fallback HTML or plain-text content.
     * @static
     * @protected
     */
    protected static recordsContainActualFields(layerConfig: AbstractBaseLayerEntryConfig, arrayOfRecords: TypeFeatureInfoEntry[]): boolean;
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
/** The propagation type, notably for the store */
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
//# sourceMappingURL=abstract-layer-set.d.ts.map