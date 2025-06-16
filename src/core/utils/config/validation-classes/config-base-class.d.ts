import { EventDelegateBase } from '@/api/events/event-helper';
import { TypeGeoviewLayerConfig, TypeGeoviewLayerType, TypeLayerEntryType, TypeLayerInitialSettings, TypeLayerStatus } from '@/api/config/types/map-schema-types';
import { TypeJsonObject } from '@/api/config/types/config-types';
import { GroupLayerEntryConfig } from './group-layer-entry-config';
import { TypeDateFragments } from '@/core/utils/date-mgt';
/**
 * Base type used to define a GeoView layer to display on the map. Unless specified,its properties are not part of the schema.
 */
export declare abstract class ConfigBaseClass {
    #private;
    /** The identifier of the layer to display on the map. This element is part of the schema. */
    private _layerId;
    /** The layer path to this instance. */
    private _layerPath;
    /** It is used to identified unprocessed layers and shows the final layer state */
    private _layerStatus;
    /** The display name of the layer (English/French). */
    layerName?: string;
    /** Tag used to link the entry to a specific schema. This element is part of the schema. */
    schemaTag?: TypeGeoviewLayerType;
    /** Layer entry data type. This element is part of the schema. */
    entryType?: TypeLayerEntryType;
    /** It is used to link the layer entry config to the GeoView layer config. */
    geoviewLayerConfig: TypeGeoviewLayerConfig;
    /** The min scale that can be reach by the layer. */
    minScale?: number;
    /** The max scale that can be reach by the layer. */
    maxScale?: number;
    /**
     * Initial settings to apply to the GeoView layer entry at creation time. Initial settings are inherited from the parent in the
     * configuration tree.
     */
    initialSettings: TypeLayerInitialSettings;
    /** It is used internally to distinguish layer groups derived from the
     * metadata. */
    isMetadataLayerGroup?: boolean;
    /** It is used to link the layer entry config to the parent's layer config. */
    parentLayerConfig?: GroupLayerEntryConfig;
    /**
     * The class constructor.
     * @param {ConfigBaseClass} layerConfig - The layer configuration we want to instanciate.
     */
    protected constructor(layerConfig: ConfigBaseClass);
    /**
     * The layerId getter method for the ConfigBaseClass class and its descendant classes.
     * @retuns {string} The layer id
     */
    get layerId(): string;
    /**
     * The layerId setter method for the ConfigBaseClass class and its descendant classes.
     * @param {string} newLayerId - The new layerId value.
     */
    set layerId(newLayerId: string);
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
    getLayerName(): string;
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
     *
     * @param {TypeLayerStatus} layerStatus - The layer status to compare with the internal value of the config.
     *
     * @returns {boolean} Returns true if the internal value is greater or equal than the value of the parameter.
     */
    isGreaterThanOrEqualTo(layerStatus: TypeLayerStatus): boolean;
    /**
     * Serializes the ConfigBaseClass class
     * @returns {TypeJsonObject} The serialized ConfigBaseClass
     */
    serialize(): TypeJsonObject;
    /**
     * Overridable function to serialize a ConfigBaseClass
     * @returns {TypeJsonObject} The serialized ConfigBaseClass
     */
    onSerialize(): TypeJsonObject;
    /**
     * Clones the configuration class.
     *
     * @returns {ConfigBaseClass} The cloned ConfigBaseClass object.
     */
    clone(): ConfigBaseClass;
    /**
     * Overridable function to clone a child of a ConfigBaseClass.
     *
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
