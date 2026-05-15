import type { QueryType, TypeDisplayLanguage, TypeFeatureInfoEntry, TypeFeatureInfoResult, TypeLocation } from '@/api/types/map-schema-types';
import type { LayerDomain } from '@/core/domains/layer-domain';
import type { ConfigBaseClass } from '@/api/config/validation-classes/config-base-class';
import type { AbstractBaseLayerEntryConfig } from '@/api/config/validation-classes/abstract-base-layer-entry-config';
import type { ControllerRegistry } from '@/core/controllers/base/controller-registry';
import type { MapViewer } from '@/geo/map/map-viewer';
import type { AbstractGVLayer } from '@/geo/layer/gv-layers/abstract-gv-layer';
import type { AbstractBaseGVLayer } from '@/geo/layer/gv-layers/abstract-base-layer';
/**
 * A class to hold a set of layers associated with a value of any type.
 *
 * Layers are added/removed to the layer-set via the registerOrUnregisterLayer function.
 */
export declare abstract class AbstractLayerSet {
    #private;
    /** The LayerDomain to work with */
    protected layerDomain: LayerDomain;
    /** The MapViewer to work with */
    protected mapViewer: MapViewer;
    /** The controller registry to work with */
    protected controllerRegistry: ControllerRegistry;
    /**
     * Constructs a new LayerSet instance.
     *
     * @param mapViewer - The MapViewer instance to work with
     * @param controllerRegistry - The ControllerRegistry instance to work with
     * @param layerDomain - The LayerDomain instance to work with
     */
    constructor(mapViewer: MapViewer, controllerRegistry: ControllerRegistry, layerDomain: LayerDomain);
    /**
     * A must-override method called to delete a result set entry from the store.
     *
     * @param layerPath - The layer path to delete from store
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
     *
     * @param layerConfig - The layer config
     */
    protected onUnregisterLayerConfig(layerConfig: ConfigBaseClass | undefined): void;
    /**
     * An overridable registration condition function for a layer-set to check if the registration
     * should happen for a specific geoview layer and layer path. By default, a layer-set always registers layers except when they are group layers.
     *
     * @param layer - The layer
     * @returns True if the layer should be registered, false otherwise
     */
    protected onRegisterLayerCheck(layer: AbstractBaseGVLayer): boolean;
    /**
     * An overridable registration function for a layer-set that the registration process will use to
     * create a new entry in the layer set for a specific geoview layer and layer path.
     *
     * @param layer - The layer config
     */
    protected onRegisterLayer(layer: AbstractBaseGVLayer): void;
    /**
     * A quick getter to help identify which layerset class the current instance is coming from.
     *
     * @returns The constructor name of the current layerset class instance
     */
    getClassName(): string;
    /**
     * Gets the registered layer config paths based on the registered layer configs.
     *
     * @returns An array of layer config paths
     */
    getRegisteredLayerConfigPaths(): string[];
    /**
     * Gets the registered layer paths based on the registered layers.
     *
     * @returns An array of layer paths
     */
    getRegisteredLayerPaths(): string[];
    /**
     * Registers the layer config in the layer-set.
     *
     * @param layerConfig - The layer config
     */
    registerLayerConfig(layerConfig: ConfigBaseClass): void;
    /**
     * Registers the layer in the layer-set.
     *
     * If the layer is already registered, the function returns immediately.
     *
     * @param layer - The layer to register
     */
    registerLayer(layer: AbstractBaseGVLayer): Promise<void>;
    /**
     * Unregisters the layer config and layer from the layer-set.
     *
     * @param layerPath - The layer path
     */
    unregister(layerPath: string): void;
    /**
     * Gets the MapId for the layer set.
     *
     * @returns The map id
     */
    protected getMapId(): string;
    /**
     * Processes layer data to query features on it, if the layer path can be queried.
     *
     * @param geoviewLayer - The geoview layer
     * @param queryType - The query type
     * @param location - The location for the query
     * @param queryGeometry - Optional whether to query geometry
     * @param language - The display language to use for the query
     * @param abortController - Optional abort controller
     * @returns A promise that resolves with the query results
     */
    protected queryLayerFeatures(geoviewLayer: AbstractGVLayer, queryType: QueryType, location: TypeLocation, queryGeometry: boolean | undefined, language: TypeDisplayLanguage, abortController?: AbortController): Promise<TypeFeatureInfoResult>;
    /**
     * Checks if the layer is of queryable type based on its class definition.
     *
     * @param layer - The layer
     * @returns True if the layer is of queryable type
     */
    protected static isQueryableType(layer: AbstractBaseGVLayer): boolean;
    /**
     * Checks if the layer config source is queryable.
     *
     * @param layer - The layer
     * @returns True if the source is queryable or undefined
     */
    protected static isSourceQueryable(layer: AbstractBaseGVLayer): boolean;
    /**
     * Aligns records with information provided by OutFields from layer config.
     *
     * This will update fields in and delete unwanted fields from the arrayOfRecords.
     *
     * @param layerEntryConfig - The layer entry config object
     * @param arrayOfRecords - Features to delete fields from
     */
    protected static alignRecordsWithOutFields(layerEntryConfig: AbstractBaseLayerEntryConfig, arrayOfRecords: TypeFeatureInfoEntry[]): void;
    /**
     * Determines whether the retrieved feature info records contain real attribute fields
     *
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
     *
     * @param layerConfig - The layer configuration used to determine whether special WMS handling applies
     * @param arrayOfRecords - The retrieved feature info entries representing attributes or raw text content
     * @returns `true` if the feature info records contain real attribute fields;
     *   `false` if they consist only of fallback HTML or plain-text content
     */
    protected static recordsContainActualFields(layerConfig: AbstractBaseLayerEntryConfig, arrayOfRecords: TypeFeatureInfoEntry[]): boolean;
}
//# sourceMappingURL=abstract-layer-set.d.ts.map