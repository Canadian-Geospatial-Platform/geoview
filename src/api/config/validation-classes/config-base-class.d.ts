import type { EventDelegateBase } from '@/api/events/event-helper';
import type { Extent, TypeLayerStyleConfig } from '@/api/types/map-schema-types';
import type { ConfigClassOrType, TypeBaseSourceInitialConfig, TypeGeoviewLayerConfig, TypeGeoviewLayerType, TypeLayerEntryType, TypeLayerInitialSettings, TypeLayerStatus, TypeTileGrid, TypeValidSourceProjectionCodes } from '@/api/types/layer-schema-types';
import type { GroupLayerEntryConfig, GroupLayerEntryConfigProps } from './group-layer-entry-config';
import type { TimeDimension } from '@/core/utils/date-mgt';
import type { AbstractBaseLayerEntryConfig } from '@/api/config/validation-classes/abstract-base-layer-entry-config';
export interface ConfigBaseClassProps {
    layerId: string;
    geoviewLayerConfig: TypeGeoviewLayerConfig;
    schemaTag?: TypeGeoviewLayerType;
    entryType?: TypeLayerEntryType;
    layerPath?: string;
    layerName?: string;
    initialSettings?: TypeLayerInitialSettings;
    source?: TypeBaseSourceInitialConfig;
    minScale?: number;
    maxScale?: number;
    isMetadataLayerGroup?: boolean;
    parentLayerConfig?: GroupLayerEntryConfig;
    attributions?: string[];
    bounds?: number[];
    timeDimension?: TimeDimension;
    layerStyle?: TypeLayerStyleConfig;
    wmsLayerId?: string;
    wfsLayerId?: string;
}
/**
 * Base type used to define a GeoView layer to display on the map. Unless specified, its properties are not part of the schema.
 */
export declare abstract class ConfigBaseClass {
    #private;
    /** The identifier of the layer to display on the map. This element is part of the schema. */
    layerId: string;
    /** The layer entry properties used to create the layer entry config */
    protected layerEntryProps: ConfigBaseClassProps;
    /**
     * Creates an instance of ConfigBaseClass.
     *
     * @param layerConfig - The layer configuration we want to instantiate
     * @param schemaTag - The GeoView layer type schema tag
     * @param entryType - The layer entry type
     */
    protected constructor(layerConfig: ConfigClassOrType, schemaTag: TypeGeoviewLayerType, entryType: TypeLayerEntryType);
    /**
     * Overridable method to apply the service metadata to this layer entry and its children.
     *
     * Subclasses should override this method to implement the logic needed
     * to update the service metadata on the current layer entry, including
     * any recursive behavior for child entries or associated sources.
     *
     * @param metadata - The service metadata to set.
     */
    protected abstract onSetServiceMetadata(metadata: unknown): void;
    /**
     * Overridable method to apply the data access path to this layer entry and its children.
     *
     * Subclasses should override this method to implement the logic needed
     * to update the data access path on the current layer entry, including
     * any recursive behavior for child entries or associated sources.
     *
     * @param dataAccessPath - The data access path to set.
     */
    protected abstract onSetDataAccessPath(dataAccessPath: string): void;
    /**
     * The layerPath getter method for the ConfigBaseClass class and its descendant classes.
     *
     * @returns The layer path
     */
    get layerPath(): string;
    /**
     * Gets the layer status.
     *
     * @returns The layer status
     */
    get layerStatus(): TypeLayerStatus;
    /**
     * Gets the layer name of the entry layer or
     * fallbacks on the geoviewLayerName from the GeoViewLayerConfig or
     * fallbacks on the geoviewLayerId from the GeoViewLayerConfig or
     * fallsback on the layerPath.
     *
     * @returns The layer name based on the priority.
     */
    getLayerNameCascade(): string;
    /**
     * Gets the layer name of the entry layer if any.
     *
     * @returns The layer name.
     */
    getLayerName(): string | undefined;
    /**
     * Sets the layer name of the entry layer.
     *
     * @param layerName - The layer name
     */
    setLayerName(layerName: string): void;
    /**
     * Sets the layer name from the metadata layer name, except if the layer entry already had a layer name.
     *
     * @param layerName - The layer name if any.
     */
    initLayerNameFromMetadata(layerName: string | undefined): void;
    /**
     * Gets the schema tag for the layer entry config.
     *
     * @returns The schema tag (or undefined, e.g. groups)
     */
    getSchemaTag(): TypeGeoviewLayerType;
    /**
     * Sets the schema tag for the layer entry config.
     *
     * @param schemaTag - The schema tag
     */
    setSchemaTag(schemaTag: TypeGeoviewLayerType): void;
    /**
     * Gets the layer entry type for the layer entry config.
     *
     * @returns The layer entry type
     */
    getEntryType(): TypeLayerEntryType;
    /**
     * Sets the layer entry type for the layer entry config.
     *
     * @param entryType - The layer entry type
     */
    setEntryType(entryType: TypeLayerEntryType): void;
    /**
     * Type guard that checks if this entry is a group layer entry.
     *
     * @returns True if this is a GroupLayerEntryConfig
     */
    getEntryTypeIsGroup(): this is GroupLayerEntryConfig;
    /**
     * Returns the GeoView layer configuration associated with this layer entry.
     *
     * @returns The GeoView layer configuration object
     */
    getGeoviewLayerConfig(): TypeGeoviewLayerConfig;
    /**
     * Retrieves the parent layer configuration if this layer is part of a group.
     *
     * @returns The parent group layer config, or undefined if not in a group
     */
    getParentLayerConfig(): GroupLayerEntryConfig | undefined;
    /**
     * Sets the parent layer configuration for this layer.
     *
     * @param parentLayerConfig - The parent group layer configuration to assign
     */
    setParentLayerConfig(parentLayerConfig: GroupLayerEntryConfig): void;
    /**
     * Returns the unique GeoView layer ID associated with this layer entry.
     *
     * @returns The GeoView layer ID
     */
    getGeoviewLayerId(): string;
    /**
     * Returns the display name of the GeoView layer, if defined.
     *
     * @returns The GeoView layer name, or undefined if not set
     */
    getGeoviewLayerName(): string | undefined;
    /**
     * Retrieves the metadata access path used by this GeoView layer.
     *
     * @returns The metadata access path, or undefined if not set
     */
    getMetadataAccessPath(): string | undefined;
    /**
     * Updates the metadata access path for this GeoView layer.
     *
     * @param metadataAccessPath - The new metadata access path to assign
     */
    setMetadataAccessPath(metadataAccessPath: string): void;
    /**
     * Gets the layer indication for the metadata layer group.
     */
    getIsMetadataLayerGroup(): boolean;
    /**
     * Sets the layer is metadata layer group indication.
     *
     * @param isMetadataLayerGroup - The indication if it's a metadata layer group
     */
    setIsMetadataLayerGroup(isMetadataLayerGroup: boolean): void;
    /**
     * Type guard that checks if this entry is a regular layer entry (not a group layer entry).
     *
     * @returns True if this is an AbstractBaseLayerEntryConfig
     */
    getEntryTypeIsRegular(): this is AbstractBaseLayerEntryConfig;
    /**
     * Gets the layer min scale if any.
     *
     * @returns The layer min scale if any
     */
    getMinScale(): number | undefined;
    /**
     * Sets the layer min scale.
     *
     * @param minScale - Optional the layer min scale or undefined
     */
    setMinScale(minScale?: number): void;
    /**
     * Initializes the minimum scale from metadata when available.
     *
     * If a minimum scale is already defined on the layer, the most restrictive
     * (smallest) value between the existing scale and the metadata value is kept.
     * This ensures metadata does not loosen an already constrained scale range.
     *
     * @param minScaleMetadata - Optional the minimum scale value derived from metadata
     */
    initMinScaleFromMetadata(minScaleMetadata?: number): void;
    /**
     * Gets the layer max scale if any.
     *
     * @returns The layer max scale if any
     */
    getMaxScale(): number | undefined;
    /**
     * Sets the layer max scale.
     *
     * @param maxScale - Optional the layer max scale or undefined
     */
    setMaxScale(maxScale?: number): void;
    /**
     * Initializes the maximum scale from metadata when available.
     *
     * If a maximum scale is already defined on the layer, the most restrictive
     * (largest) value between the existing scale and the metadata value is kept.
     * This ensures metadata does not tighten an already constrained scale range.
     *
     * @param maxScaleMetadata - Optional the maximum scale value derived from metadata
     */
    initMaxScaleFromMetadata(maxScaleMetadata?: number): void;
    /**
     * Gets the initial settings.
     *
     * @returns The initial settings
     */
    getInitialSettings(): TypeLayerInitialSettings | undefined;
    /**
     * Returns a shallow-copy of the initialSettings object.
     *
     * @returns The shallow-copy of the initialSettings object
     */
    cloneInitialSettings(): TypeLayerInitialSettings;
    /**
     * Gets the initial settings extent, if any.
     *
     * @returns The initial settings extent, if any
     */
    getInitialSettingsExtent(): Extent | undefined;
    /**
     * Gets the initial settings bounds, if any.
     *
     * @returns The initial settings bounds, if any
     */
    getInitialSettingsBounds(): Extent | undefined;
    /**
     * Gets the initial settings className, if any.
     *
     * @returns The initial settings className, if any
     */
    getInitialSettingsClassName(): string | undefined;
    /**
     * Initializes the initial settings configuration by filling the blanks in our config with the information from the metadata, if necessary.
     *
     * @param initialSettingsMetadata - Optional the initialSettings metadata to use to help fill the blanks in our initialSettings config
     */
    initInitialSettingsFromMetadata(initialSettingsMetadata: TypeLayerInitialSettings | undefined): void;
    /**
     * Validates and initializes the `visible` value in the `initialSettings` object, if necessary.
     *
     * @param visible - Optional the candidate `visible` value to validate against the current setting
     */
    initInitialSettingsStatesVisibleFromMetadata(visible: boolean | undefined): void;
    /**
     * Initializes the minimum zoom level in the initial settings using metadata.
     *
     * @param minZoomMetadata - Optional the minimum zoom value from metadata
     */
    initInitialSettingsMinZoomFromMetadata(minZoomMetadata: number | undefined): void;
    /**
     * Initializes the maximum zoom level in the initial settings using metadata.
     *
     * @param maxZoomMetadata - Optional the maximum zoom value from metadata
     */
    initInitialSettingsMaxZoomFromMetadata(maxZoomMetadata: number | undefined): void;
    /**
     * Initializes the extent in the initial settings using the layer configuration, if any.
     */
    initInitialSettingsExtentAndBoundsFromConfig(): void;
    /**
     * Initializes the extent in the initial settings using metadata.
     *
     * @param extentToValidate - Optional the extent from metadata to validate and apply
     */
    initInitialSettingsExtentFromMetadata(extentToValidate: Extent | undefined): void;
    /**
     * Initializes the bounds in the initial settings using metadata.
     *
     * @param extentToValidate - Optional the bounds from metadata to validate and apply
     */
    initInitialSettingsBoundsFromMetadata(extentToValidate: Extent | undefined): void;
    /**
     * Returns the sibling layer configurations of the current layer.
     *
     * If the current layer has a parent, this method retrieves all layer entry
     * configs under the same parent. It can optionally exclude layers of type 'group'.
     *
     * @param includeGroups - Whether to include entries of type 'group' in the result. False by default
     * @returns An array of sibling layer configurations. Returns an empty array if there is no parent
     */
    getSiblings(includeGroups?: boolean): ConfigBaseClass[];
    /**
     * Sets the service metadata for this layer entry.
     *
     * This is the public entry point for updating the service metadata.
     * Internally, it delegates the behavior to the `onSetServiceMetadata` method,
     * which can be overridden by subclasses to implement custom logic.
     *
     * @param metadata - The new service metadata to be used
     */
    setServiceMetadata(metadata: unknown): void;
    /**
     * Sets the data access path for this layer entry.
     *
     * This is the public entry point for updating the data access path.
     * Internally, it delegates the behavior to the `onSetDataAccessPath` method,
     * which can be overridden by subclasses to implement custom logic.
     *
     * @param dataAccessPath - The new path to be used for accessing data
     */
    setDataAccessPath(dataAccessPath: string): void;
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
     *
     * @param newLayerStatus - The new layer status value
     */
    setLayerStatus(newLayerStatus: TypeLayerStatus): void;
    /**
     * Updates the status of all parents layers based on the status of their sibling layers.
     *
     * This method checks the statuses of sibling layers (layers sharing the same parent).
     * - If at least one sibling is in a 'loading' state, it sets the parent layer status to 'loading'.
     * - If all siblings are in a 'loaded' state, it sets the parent layer status to 'loaded'.
     * - If all siblings are in an 'error' state, it sets the parent layer status to 'error'.
     * - If neither condition is met, the parent status remains unchanged.
     */
    updateLayerStatusParent(): void;
    /**
     * This method compares the internal layer status of the config with the layer status passed as a parameter.
     *
     * @param layerStatus - The layer status to compare with the internal value of the config
     * @returns True if the internal value is greater or equal than the value of the parameter
     */
    isGreaterThanOrEqualTo(layerStatus: TypeLayerStatus): boolean;
    /**
     * Creates and returns a deep clone of the layer entry configuration properties.
     *
     * This method returns a cloned copy of the original properties (`layerEntryProps`)
     * that were used to create this layer entry configuration. Modifying the returned
     * object will not affect the internal state of the layer.
     *
     * @returns A deep-cloned copy of the layer entry properties
     */
    cloneLayerProps(): ConfigBaseClassProps;
    /**
     * Writes the instance as Json.
     *
     * @returns The Json representation of the instance
     */
    toJson<T>(): T;
    /**
     * Converts the current layer config instance into a `GroupLayerEntryConfigProps` object.
     *
     * This method serializes the current layer into a configuration object used
     * to represent a group layer within a GeoView configuration. It populates
     * essential properties such as the layer ID, name, configuration references,
     * and initializes it as a metadata layer group.
     *
     * @param name - Optional the layer name. Will use this.getLayerName() when undefined
     * @returns The configuration object representing the group layer
     */
    toGroupLayerConfigProps(name?: string): GroupLayerEntryConfigProps;
    /**
     * Overridable function to create and return a deep clone of the layer entry configuration properties.
     *
     * This method returns a cloned copy of the original properties (`layerEntryProps`)
     * that were used to create this layer entry configuration. Modifying the returned
     * object will not affect the internal state of the layer.
     *
     * @returns A deep-cloned copy of the layer entry properties
     */
    protected onCloneLayerProps(): ConfigBaseClassProps;
    /**
     * Overridable function to write the instance as Json.
     *
     * This is used to set properties for the layerEntryConfigs when initially setting the mapConfig in the store
     *
     * @returns The Json representation of the instance
     */
    protected onToJson<T>(): T;
    /**
     * Recursively checks the list of layer entries to see if all of them are greater than or equal to the provided layer status.
     *
     * @param layerStatus - The layer status to compare with the internal value of the config
     * @param listOfLayerEntryConfig - The list of layer's configuration (default: this.listOfLayerEntryConfig)
     * @returns True when all layers are greater than or equal to the layerStatus parameter
     */
    static allLayerStatusAreGreaterThanOrEqualTo(layerStatus: TypeLayerStatus, listOfLayerEntryConfig: ConfigBaseClass[]): boolean;
    /**
     * Returns the corresponding layer entry type for a given GeoView layer type.
     *
     * This method maps a `TypeGeoviewLayerType` (e.g., CSV, WMS, XYZ_TILES)
     * to its associated `TypeLayerEntryType` (e.g., VECTOR, RASTER_IMAGE, RASTER_TILE).
     * Useful for determining how a layer should be handled/rendered internally.
     *
     * @param layerType - The GeoView layer type to convert
     * @returns The corresponding layer entry type
     * @throws {NotSupportedError} When the provided `layerType` is not supported for conversion
     */
    static getLayerEntryTypeFromLayerType(layerType: TypeGeoviewLayerType): TypeLayerEntryType;
    /**
     * Helper function to support when a layerConfig is either a class instance or a regular json object.
     *
     * @param layerConfig - The layer config class instance or regular json object
     * @returns The schema tag or undefined
     */
    static getClassOrTypeSchemaTag(layerConfig: ConfigClassOrType | undefined): TypeGeoviewLayerType | undefined;
    /**
     * Helper function to support when a layerConfig is either a class instance or a regular json object.
     *
     * @param layerConfig - The layer config class instance or regular json object
     * @param schemaTag - The schema tag
     */
    static setClassOrTypeSchemaTag(layerConfig: ConfigClassOrType, schemaTag: TypeGeoviewLayerType): void;
    /**
     * Helper function to support when a layerConfig is either a class instance or a regular json object.
     *
     * @param layerConfig - The layer config class instance or regular json object
     * @returns The layer entry type or undefined
     */
    static getClassOrTypeEntryType(layerConfig: ConfigClassOrType | undefined): TypeLayerEntryType | undefined;
    /**
     * Helper function to support when a layerConfig is either a class instance or a regular json object.
     *
     * @param layerConfig - The layer config class instance or regular json object
     * @param entryType - The entry type
     */
    static setClassOrTypeEntryType(layerConfig: ConfigClassOrType, entryType: TypeLayerEntryType): void;
    /**
     * Helper typeguard function to support when a layerConfig is either a class instance or a regular json object.
     *
     * @param layerConfig - The layer config class instance or regular json object
     * @returns The group layer entry config when the layerConfig is a group entry type
     */
    static getClassOrTypeEntryTypeIsGroup(layerConfig: ConfigClassOrType | undefined): layerConfig is GroupLayerEntryConfig;
    /**
     * Extracts the `layerEntryProps` from either a class instance (`ConfigBaseClass`) or a plain configuration object.
     *
     * This function acts as a type guard and converter to ensure consistent access to `layerEntryProps`,
     * whether the input is a class or a raw configuration type.
     *
     * @template T - A subtype of `ConfigBaseClassProps`
     * @param layerConfig - The configuration, which may be a class or a plain object
     * @returns The extracted `layerEntryProps` cast to the expected type
     */
    static getClassOrTypeLayerEntryProps<T extends ConfigBaseClassProps>(layerConfig: ConfigClassOrType | TypeGeoviewLayerConfig): T;
    /**
     * Retrieves the `geoviewLayerConfig` from a layer configuration object or class.
     *
     * Internally uses `getClassOrTypeLayerEntryProps()` to normalize access to the configuration structure.
     *
     * @param layerConfig - The configuration, which may be a class instance or a plain object
     * @returns The `geoviewLayerConfig` associated with the provided configuration
     */
    static getClassOrTypeGeoviewLayerConfig(layerConfig: ConfigClassOrType | TypeGeoviewLayerConfig): TypeGeoviewLayerConfig;
    /**
     * Helper function to support when a layerConfig is either a class instance or a regular json object.
     *
     * @param layerConfig - The layer config class instance or regular json object
     * @param geoviewLayerConfig - The geoviewLayerConfig to apply
     */
    static setClassOrTypeGeoviewLayerConfig(layerConfig: ConfigClassOrType, geoviewLayerConfig: TypeGeoviewLayerConfig): void;
    /**
     * Retrieves the `parentLayerConfig` from the provided layer configuration, whether it's a class instance or a plain object.
     *
     * This allows consistent access to the parent group layer config regardless of whether the input is an instance of
     * `ConfigBaseClass` or a raw config type.
     *
     * @param layerConfig - The layer configuration to extract the parent from
     * @returns The parent group layer config, or `undefined` if this layer has no parent
     */
    static getClassOrTypeParentLayerConfig(layerConfig: ConfigClassOrType): GroupLayerEntryConfig | undefined;
    /**
     * Helper function to support when a layerConfig is either a class instance or a regular json object.
     *
     * @param layerConfig - The layer config class instance or regular json object
     * @param parentLayerConfig - The parentLayerConfig to apply
     */
    static setClassOrTypeParentLayerConfig(layerConfig: ConfigClassOrType, parentLayerConfig: GroupLayerEntryConfig | undefined): void;
    /**
     * Helper function to support when a layerConfig is either a class instance or a regular json object.
     *
     * @param layerConfig - The layer config class instance or regular json object
     * @returns The layer name or undefined
     */
    static getClassOrTypeLayerName(layerConfig: ConfigClassOrType | TypeGeoviewLayerConfig | undefined): string | undefined;
    /**
     * Helper function to support when a layerConfig is either a class instance or a regular json object.
     *
     * @param layerConfig - The layer config class instance or regular json object
     * @param layerName - The layer name to apply
     */
    static setClassOrTypeLayerName(layerConfig: ConfigClassOrType | TypeGeoviewLayerConfig | undefined, layerName: string): void;
    /**
     * Helper function to support when a layerConfig is either a class instance or a regular json object.
     *
     * @param layerConfig - The layer config class instance or regular json object
     * @returns The minimum scale or undefined
     */
    static getClassOrTypeMinScale(layerConfig: ConfigClassOrType | undefined): number | undefined;
    /**
     * Helper function to support when a layerConfig is either a class instance or a regular json object.
     *
     * @param layerConfig - The layer config class instance or regular json object
     * @param minScale - The minimum scale to apply
     */
    static setClassOrTypeMinScale(layerConfig: ConfigClassOrType, minScale: number): void;
    /**
     * Helper function to support when a layerConfig is either a class instance or a regular json object.
     *
     * @param layerConfig - The layer config class instance or regular json object
     * @returns The maximum scale or undefined
     */
    static getClassOrTypeMaxScale(layerConfig: ConfigClassOrType | undefined): number | undefined;
    /**
     * Helper function to support when a layerConfig is either a class instance or a regular json object.
     *
     * @param layerConfig - The layer config class instance or regular json object
     * @param maxScale - The maximum scale to apply
     */
    static setClassOrTypeMaxScale(layerConfig: ConfigClassOrType, maxScale: number): void;
    /**
     * Helper function to support when a layerConfig is either a class instance or a regular json object.
     *
     * @param layerConfig - The layer config class instance or regular json object
     * @returns The initial settings in the layer config or undefined
     */
    static getClassOrTypeInitialSettings(layerConfig: ConfigClassOrType | TypeGeoviewLayerConfig | undefined): TypeLayerInitialSettings | undefined;
    /**
     * Helper function to support when a layerConfig is either a class instance or a regular json object.
     *
     * @param layerConfig - The layer config class instance or regular json object
     * @param initialSettings - The initial settings to apply
     */
    static setClassOrTypeInitialSettings(layerConfig: ConfigClassOrType, initialSettings: TypeLayerInitialSettings): void;
    /**
     * Helper function to support when a layerConfig is either a class instance or a regular json object.
     *
     * @param layerConfig - The layer config class instance or regular json object
     * @returns The indication if the layer config is metadata layer group
     */
    static getClassOrTypeIsMetadataLayerGroup(layerConfig: ConfigClassOrType | undefined): boolean;
    /**
     * Utility type guard that checks whether the given configuration (class instance or plain object) represents a particular layer type.
     *
     * Supports `ConfigClassOrType` (class instance or plain object) and plain layer config objects (`TypeGeoviewLayerConfig`).
     *
     * @param layerConfig - The layer config to check. Can be an instance of a config class or a raw config object
     * @param layerType - The GeoView layer type to check against
     * @returns `true` if the config is for a particular layer; otherwise `false`
     */
    protected static isClassOrTypeSchemaTag<T extends ConfigClassOrType | TypeGeoviewLayerConfig>(layerConfig: T, layerType: TypeGeoviewLayerType): layerConfig is T;
    /**
     * Registers a layer status changed event handler.
     *
     * @param callback - The callback to be executed whenever the event is emitted
     */
    onLayerStatusChanged(callback: LayerStatusChangedDelegate): void;
    /**
     * Unregisters a layer status changed event handler.
     *
     * @param callback - The callback to stop being called whenever the event is emitted
     */
    offLayerStatusChanged(callback: LayerStatusChangedDelegate): void;
}
export type TypeLayerEntryShell = {
    id: number | string;
    index?: number;
    layerId?: number | string;
    layerName?: string;
    tileGrid?: TypeTileGrid;
    tileMatrixSet?: string;
    subLayers?: TypeLayerEntryShell[];
    source?: TypeLayerEntryShellSource;
    geoviewLayerConfig?: TypeGeoviewLayerConfig;
    wmsLayerId?: string;
    wfsLayerId?: string;
    listOfLayerEntryConfig?: TypeLayerEntryShell[];
};
export type TypeLayerEntryShellSource = {
    dataAccessPath?: string;
    extent?: Extent;
    projection?: TypeValidSourceProjectionCodes;
};
/** Defines an event for the delegate. */
export type LayerStatusChangedEvent = {
    layerStatus: TypeLayerStatus;
};
/** Defines a delegate for the event handler function signature. */
export type LayerStatusChangedDelegate = EventDelegateBase<ConfigBaseClass, LayerStatusChangedEvent, void>;
//# sourceMappingURL=config-base-class.d.ts.map