import { EventDelegateBase } from '@/api/events/event-helper';
import { Extent } from '@/api/types/map-schema-types';
import { ConfigClassOrType, TypeGeoviewLayerConfig, TypeGeoviewLayerType, TypeLayerEntryType, TypeLayerInitialSettings, TypeLayerStatus, TypeTileGrid, TypeValidSourceProjectionCodes } from '@/api/types/layer-schema-types';
import { GroupLayerEntryConfig, GroupLayerEntryConfigProps } from './group-layer-entry-config';
import { TypeDateFragments } from '@/core/utils/date-mgt';
import { AbstractBaseLayerEntryConfig } from './abstract-base-layer-entry-config';
export interface ConfigBaseClassProps {
    /** The display name of the layer (English/French). */
    schemaTag?: TypeGeoviewLayerType;
    entryType?: TypeLayerEntryType;
    layerId: string;
    geoviewLayerConfig: TypeGeoviewLayerConfig;
    layerName?: string;
    initialSettings?: TypeLayerInitialSettings;
    minScale?: number;
    maxScale?: number;
    isMetadataLayerGroup?: boolean;
    parentLayerConfig?: GroupLayerEntryConfig;
}
/**
 * Base type used to define a GeoView layer to display on the map. Unless specified,its properties are not part of the schema.
 */
export declare abstract class ConfigBaseClass {
    #private;
    /** Tag used to link the entry to a specific schema. This element is part of the schema. */
    abstract schemaTag: TypeGeoviewLayerType;
    /** Layer entry data type. This element is part of the schema. */
    abstract entryType: TypeLayerEntryType;
    /** The layer entry properties used to create the layer entry config */
    layerEntryProps: ConfigBaseClassProps;
    /** The identifier of the layer to display on the map. This element is part of the schema. */
    layerId: string;
    /** It is used to link the layer entry config to the GeoView layer config. */
    geoviewLayerConfig: TypeGeoviewLayerConfig;
    /** It is used to link the layer entry config to the parent's layer config. */
    parentLayerConfig: GroupLayerEntryConfig | undefined;
    /**
     * Initial settings to apply to the GeoView layer entry at creation time. Initial settings are inherited from the parent in the
     * configuration tree.
     */
    initialSettings: TypeLayerInitialSettings;
    /**
     * The class constructor.
     * @param {ConfigClassOrType} layerConfig - The layer configuration we want to instanciate.
     */
    protected constructor(layerConfig: ConfigClassOrType);
    /**
     * The layerPath getter method for the ConfigBaseClass class and its descendant classes.
     * @returns {string} The layer path
     */
    get layerPath(): string;
    /**
     * The layerId getter method for the ConfigBaseClass class and its descendant classes.
     * @retuns {TypeLayerStatus} The layer status
     */
    get layerStatus(): TypeLayerStatus;
    /**
     * Gets the layer name of the entry layer or
     * fallbacks on the geoviewLayerName from the GeoViewLayerConfig or
     * fallbacks on the geoviewLayerId from the GeoViewLayerConfig or
     * fallsback on the layerPath.
     */
    getLayerNameCascade(): string;
    /**
     * Gets the layer name of the entry layer if any.
     */
    getLayerName(): string | undefined;
    /**
     * Sets the layer name of the entry layer.
     * @param {string} layerName - The layer name.
     */
    setLayerName(layerName: string): void;
    /**
     * Type guard that checks if this entry is a group layer entry.
     * @returns {boolean} True if this is a GroupLayerEntryConfig.
     */
    getEntryTypeIsGroup(): this is GroupLayerEntryConfig;
    /**
     * Gets the layer indication for the metadata layer group.
     */
    getIsMetadataLayerGroup(): boolean;
    /**
     * Sets the layer is metadata layer group indication.
     * @param {boolean} isMetadataLayerGroup - The indication if it's a metadata layer group.
     */
    setIsMetadataLayerGroup(isMetadataLayerGroup: boolean): void;
    /**
     * Type guard that checks if this entry is a regular layer entry (not a group layer entry).
     * @returns {boolean} True if this is a AbstractBaseLayerEntryConfig.
     */
    getEntryTypeIsRegular(): this is AbstractBaseLayerEntryConfig;
    /**
     * Gets the layer min scale if any.
     * @returns {number | undefined} The layer min scale if any.
     */
    getMinScale(): number | undefined;
    /**
     * Sets the layer min scale.
     * @param {number?} minScale - The layer min scale or undefined.
     */
    setMinScale(minScale?: number): void;
    /**
     * Gets the layer max scale if any.
     * @returns {number | undefined} The layer max scale if any.
     */
    getMaxScale(): number | undefined;
    /**
     * Sets the layer max scale.
     * @param {number?} maxScale - The layer max scale or undefined.
     */
    setMaxScale(maxScale?: number): void;
    /**
     * Returns the sibling layer configurations of the current layer.
     * If the current layer has a parent, this method retrieves all layer entry
     * configs under the same parent. It can optionally exclude layers of type 'group'.
     * @param {boolean} includeGroups - Whether to include entries of type 'group' in the result. False by default.
     * @returns {ConfigBaseClass[]} An array of sibling layer configurations. Returns an empty array if there is no parent.
     */
    getSiblings(includeGroups?: boolean): ConfigBaseClass[];
    /**
     * Gets the external fragments order if specified by the config, defaults to ISO_UTC.
     * @returns {TypeDateFragments} The Date Fragments
     */
    getExternalFragmentsOrder(): TypeDateFragments;
    /**
     * Sets the data access path for this layer entry.
     * This is the public entry point for updating the data access path.
     * Internally, it delegates the behavior to the `onSetDataAccessPath` method,
     * which can be overridden by subclasses to implement custom logic.
     * @param {string} dataAccessPath - The new path to be used for accessing data.
     */
    setDataAccessPath(dataAccessPath: string): void;
    /**
     * Overridable method to apply the data access path to this layer entry and its children.
     * Subclasses should override this method to implement the logic needed
     * to update the data access path on the current layer entry, including
     * any recursive behavior for child entries or associated sources.
     * @param {string} dataAccessPath - The data access path to set.
     * @protected
     * @abstract
     */
    protected abstract onSetDataAccessPath(dataAccessPath: string): void;
    /**
     * Sets the layer status to registered.
     */
    setLayerStatusRegistered(): void;
    /**
     * Sets the layer status to processing.
     */
    setLayerStatusProcessing(): void;
    /**
     * Sets the layer status to processed.
     */
    setLayerStatusProcessed(): void;
    /**
     * Sets the layer status to loading.
     */
    setLayerStatusLoading(): void;
    /**
     * Sets the layer status to loaded.
     */
    setLayerStatusLoaded(): void;
    /**
     * Sets the layer status to error.
     */
    setLayerStatusError(): void;
    /**
     * Sets the layer status and emits an event when changed.
     * @param {string} newLayerStatus - The new layerId value.
     */
    setLayerStatus(newLayerStatus: TypeLayerStatus): void;
    /**
     * Updates the status of all parents layers based on the status of their sibling layers.
     * This method checks the statuses of sibling layers (layers sharing the same parent).
     * - If at least one sibling is in a 'loading' state, it sets the parent layer status to 'loading'.
     * - If all siblings are in a 'loaded' state, it sets the parent layer status to 'loaded'.
     * - If all siblings are in an 'error' state, it sets the parent layer status to 'error'.
     * - If neither condition is met, the parent status remains unchanged.
     */
    updateLayerStatusParent(): void;
    /**
     * This method compares the internal layer status of the config with the layer status passed as a parameter and it
     * returns true if the internal value is greater or equal to the value of the parameter.
     * @param {TypeLayerStatus} layerStatus - The layer status to compare with the internal value of the config.
     * @returns {boolean} Returns true if the internal value is greater or equal than the value of the parameter.
     */
    isGreaterThanOrEqualTo(layerStatus: TypeLayerStatus): boolean;
    /**
     * Creates and returns a deep clone of the layer entry configuration properties.
     * This method returns a cloned copy of the original properties (`layerEntryProps`)
     * that were used to create this layer entry configuration. Modifying the returned
     * object will not affect the internal state of the layer.
     * @returns {ConfigBaseClassProps} A deep-cloned copy of the layer entry properties.
     */
    cloneLayerProps(): ConfigBaseClassProps;
    /**
     * Overridable function to create and return a deep clone of the layer entry configuration properties.
     * This method returns a cloned copy of the original properties (`layerEntryProps`)
     * that were used to create this layer entry configuration. Modifying the returned
     * object will not affect the internal state of the layer.
     * @returns {ConfigBaseClassProps} A deep-cloned copy of the layer entry properties.
     */
    protected onCloneLayerProps(): ConfigBaseClassProps;
    /**
     * Writes the instance as Json.
     * @returns {T} The Json representation of the instance.
     */
    toJson<T>(): T;
    /**
     * Overridable function to write the instance as Json.
     * @returns {unknown} The Json representation of the instance.
     * @protected
     */
    protected onToJson<T>(): T;
    /**
     * Converts the current layer config instance into a `GroupLayerEntryConfigProps` object.
     * This method serializes the current layer into a configuration object used
     * to represent a group layer within a GeoView configuration. It populates
     * essential properties such as the layer ID, name, configuration references,
     * and initializes it as a metadata layer group.
     * @param {string?} name - The layer name. Will use this.getLayerName() when undefined.
     * @returns {GroupLayerEntryConfigProps} The configuration object representing the group layer.
     */
    toGroupLayerConfig(name?: string): GroupLayerEntryConfigProps;
    /**
     * Clones the configuration class.
     * @returns {ConfigBaseClass} The cloned ConfigBaseClass object.
     */
    clone(): ConfigBaseClass;
    /**
     * Overridable function to clone a child of a ConfigBaseClass.
     * @returns {ConfigBaseClass} The cloned child object of a ConfigBaseClass.
     */
    protected onClone(): ConfigBaseClass;
    /**
     * Recursively checks the list of layer entries to see if all of them are greater than or equal to the provided layer status.
     *
     * @param {TypeLayerStatus} layerStatus - The layer status to compare with the internal value of the config.
     * @param {ConfigBaseClass[]} listOfLayerEntryConfig - The list of layer's configuration (default: this.listOfLayerEntryConfig).
     *
     * @returns {boolean} true when all layers are greater than or equal to the layerStatus parameter.
     */
    static allLayerStatusAreGreaterThanOrEqualTo(layerStatus: TypeLayerStatus, listOfLayerEntryConfig: ConfigBaseClass[]): boolean;
    /**
     * Helper function to support when a layerConfig is either a class instance or a regular json object.
     * @param {ConfigClassOrType | undefined} layerConfig - The layer config class instance or regular json object.
     * @returns {string | undefined} The layer name or undefined.
     */
    static getClassOrTypeLayerName(layerConfig: ConfigClassOrType | undefined): string | undefined;
    /**
     * Helper function to support when a layerConfig is either a class instance or a regular json object.
     * @param {ConfigClassOrType | undefined} layerConfig - The layer config class instance or regular json object.
     * @returns {number | undefined} The minimum scale or undefined.
     */
    static getClassOrTypeMinScale(layerConfig: ConfigClassOrType | undefined): number | undefined;
    /**
     * Helper function to support when a layerConfig is either a class instance or a regular json object.
     * @param {ConfigClassOrType} layerConfig - The layer config class instance or regular json object.
     * @param {number} minScale - The minimum scale to apply.
     */
    static setClassOrTypeMinScale(layerConfig: ConfigClassOrType, minScale: number): void;
    /**
     * Helper function to support when a layerConfig is either a class instance or a regular json object.
     * @param {ConfigClassOrType | undefined} layerConfig - The layer config class instance or regular json object.
     * @returns {number | undefined} The maximum scale or undefined.
     */
    static getClassOrTypeMaxScale(layerConfig: ConfigClassOrType | undefined): number | undefined;
    /**
     * Helper function to support when a layerConfig is either a class instance or a regular json object.
     * @param {ConfigClassOrType} layerConfig - The layer config class instance or regular json object.
     * @param {number} maxScale - The maximum scale to apply.
     */
    static setClassOrTypeMaxScale(layerConfig: ConfigClassOrType, maxScale: number): void;
    /**
     * Helper function to support when a layerConfig is either a class instance or a regular json object.
     * @param {ConfigClassOrType | undefined} layerConfig - The layer config class instance or regular json object.
     * @returns {boolean} The indication if the layer config is metadata layer group.
     */
    static getClassOrTypeIsMetadataLayerGroup(layerConfig: ConfigClassOrType | undefined): boolean;
    /**
     * Helper function to support when a layerConfig is either a class instance or a regular json object.
     * @param {ConfigClassOrType} layerConfig - The layer config class instance or regular json object.
     * @param {boolean} isMetadataLayerGroup - The indication if the layer config is metadata layer group.
     */
    static setClassOrTypeIsMetadataLayerGroup(layerConfig: ConfigClassOrType, isMetadataLayerGroup: boolean): void;
    /**
     * Registers a layer status changed event handler.
     * @param {LayerStatusChangedDelegate} callback - The callback to be executed whenever the event is emitted
     */
    onLayerStatusChanged(callback: LayerStatusChangedDelegate): void;
    /**
     * Unregisters a layer status changed event handler.
     * @param {LayerStatusChangedDelegate} callback - The callback to stop being called whenever the event is emitted
     */
    offLayerStatusChanged(callback: LayerStatusChangedDelegate): void;
}
export type TypeLayerEntryShell = {
    id: number | string;
    index?: number;
    layerId?: number | string;
    layerName?: string;
    tileGrid?: TypeTileGrid;
    subLayers?: TypeLayerEntryShell[];
    source?: TypeLayerEntryShellSource;
    geoviewLayerConfig?: TypeGeoviewLayerConfig;
    listOfLayerEntryConfig?: TypeLayerEntryShell[];
};
export type TypeLayerEntryShellSource = {
    dataAccessPath?: string;
    extent?: Extent;
    projection?: TypeValidSourceProjectionCodes;
};
/**
 * Define an event for the delegate.
 */
export type LayerStatusChangedEvent = {
    layerStatus: TypeLayerStatus;
};
/**
 * Define a delegate for the event handler function signature.
 */
export type LayerStatusChangedDelegate = EventDelegateBase<ConfigBaseClass, LayerStatusChangedEvent, void>;
//# sourceMappingURL=config-base-class.d.ts.map