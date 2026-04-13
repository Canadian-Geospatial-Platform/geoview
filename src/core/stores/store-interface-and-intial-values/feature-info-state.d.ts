import type { TypeSetStore, TypeGetStore, GeoviewStoreType } from '@/core/stores/geoview-store';
import type { TypeFeatureInfoEntry, TypeResultSet, TypeResultSetEntry, TypeQueryStatus, TypeFieldEntry } from '@/api/types/map-schema-types';
import type { TypeGeoviewLayerType } from '@/api/types/layer-schema-types';
import type { TypeMapFeaturesConfig } from '@/core/types/global-types';
/**
 * Represents the feature info (details panel) Zustand store slice.
 *
 * Manages state for feature information including checked features,
 * layer data arrays (with optional batching), the selected layer path,
 * and coordinate info toggling.
 */
export interface IFeatureInfoState {
    /** The features currently checked/selected for export or highlighting. */
    checkedFeatures: Array<TypeFeatureInfoEntry>;
    /** The feature info result set entries for all layers. */
    layerDataArray: TypeFeatureInfoResultSetEntry[];
    /** A batched copy of layerDataArray that updates less frequently to reduce re-renders. */
    layerDataArrayBatch: TypeFeatureInfoResultSetEntry[];
    /** A layer path that bypasses the batch delay for immediate UI update. */
    layerDataArrayBatchLayerPathBypass: string;
    /** The layer path of the currently selected layer in the details panel. */
    selectedLayerPath: string;
    /** Whether the coordinate info feature is enabled. */
    coordinateInfoEnabled: boolean;
    /** Whether the coordinate info toggle switch is hidden from the UI. */
    hideCoordinateInfoSwitch: boolean;
    /**
     * Applies default configuration values from the map config to the store.
     *
     * @param geoviewConfig - The map features configuration to extract defaults from.
     */
    setDefaultConfigValues: (geoviewConfig: TypeMapFeaturesConfig) => void;
    /** Store actions callable from adaptors. */
    actions: {
        addCheckedFeature: (feature: TypeFeatureInfoEntry) => void;
        removeCheckedFeature: (feature: TypeFeatureInfoEntry | 'all') => void;
        setLayerDataArray: (layerDataArray: TypeFeatureInfoResultSetEntry[]) => void;
        setLayerDataArrayBatch: (layerDataArray: TypeFeatureInfoResultSetEntry[]) => void;
        setLayerDataArrayBatchLayerPathBypass: (layerPath: string) => void;
        setSelectedLayerPath: (selectedLayerPath: string) => void;
        setCoordinateInfoEnabled: (coordinateInfoEnabled: boolean) => void;
        updateCoordinateInfoLayer: (features: TypeFeatureInfoEntry[], queryStatus: TypeQueryStatus) => void;
    };
}
/** The layer path for the coordinate info feature. */
export declare const LAYER_PATH_COORDINATE_INFO = "coordinate-info";
/**
 * Gets the selected layer path in the details panel for the given map.
 *
 * @param mapId - The map identifier.
 * @returns The selected layer path.
 */
export declare const getStoreDetailsSelectedLayerPath: (mapId: string) => string;
/** Hook that returns the selected layer path in the details panel. */
export declare const useStoreDetailsSelectedLayerPath: () => string;
/**
 * Gets the layer query status for a given layer path.
 *
 * @param mapId - The map identifier.
 * @param layerPath - The layer path to get the query status for.
 * @returns The query status for the layer, or undefined if the layer is not found.
 */
export declare const getStoreDetailsQueryStatus: (mapId: string, layerPath: string) => TypeQueryStatus | undefined;
/** Hook that returns the selected layer path in the details panel. */
export declare const useStoreDetailsQueryStatus: (layerPath: string) => TypeQueryStatus | undefined;
/**
 * Gets the coordinate info enabled state for the given map.
 *
 * @param mapId - The map identifier.
 * @returns Whether coordinate info is enabled.
 */
export declare const getStoreDetailsCoordinateInfoEnabled: (mapId: string) => boolean;
/** Hook that returns whether coordinate info is enabled. */
export declare const useStoreDetailsCoordinateInfoEnabled: () => boolean;
/**
 * Gets the feature info entry for the coordinate info layer from the details store.
 *
 * @param mapId - The map identifier.
 * @returns The feature info entry for the coordinate info layer, or undefined if not found.
 */
export declare const getStoreDetailsLayerDataArrayFeature: (mapId: string) => TypeFeatureInfoEntry | undefined;
/** Hook that returns the feature info for the coordinate info layer data array. */
export declare const useStoreDetailsLayerDataArrayFeature: () => TypeFeatureInfoEntry | undefined;
/**
 * Gets the feature info entries for a specific layer.
 *
 * @param mapId - The map identifier.
 * @param layerPath - The layer path to get features for.
 * @returns The feature info entries, or undefined if the layer is not found.
 */
export declare const getStoreDetailsFeatures: (mapId: string, layerPath: string) => TypeFeatureInfoEntry[] | undefined;
/** Hook that returns the list of checked/selected features. */
export declare const useStoreDetailsCheckedFeatures: () => TypeFeatureInfoEntry[];
/** Hook that returns the batched feature info layer data array. */
export declare const useStoreDetailsLayerDataArrayBatch: () => TypeFeatureInfoResultSetEntry[];
/** Hook that returns whether the coordinate info switch is hidden. */
export declare const useStoreDetailsHideCoordinateInfoSwitch: () => boolean;
/**
 * Sets the feature info layer data array in the store.
 *
 * @param mapId - The map identifier.
 * @param layerDataArray - The feature info result set entries to set.
 */
export declare const setStoreDetailsLayerDataArray: (mapId: string, layerDataArray: TypeFeatureInfoResultSetEntry[]) => void;
/**
 * Sets the batched feature info layer data array in the store.
 *
 * @param mapId - The map identifier.
 * @param layerDataArrayBatch - The batched feature info result set entries to set.
 */
export declare const setStoreDetailsLayerDataArrayBatch: (mapId: string, layerDataArrayBatch: TypeFeatureInfoResultSetEntry[]) => void;
/**
 * Sets the layer path that bypasses the batch propagation delay.
 *
 * @param mapId - The map identifier.
 * @param layerDataArrayBatchLayerPathBypass - The layer path to bypass.
 */
export declare const setStoreDetailsLayerDataArrayBatchLayerPathBypass: (mapId: string, layerDataArrayBatchLayerPathBypass: string) => void;
/**
 * Sets the selected layer path in the details panel store.
 *
 * @param mapId - The map identifier.
 * @param selectedLayerPath - The layer path to select.
 */
export declare const setStoreDetailsSelectedLayerPath: (mapId: string, selectedLayerPath: string) => void;
/**
 * Adds a feature to the checked features list in the store.
 *
 * @param mapId - The map identifier.
 * @param feature - The feature entry to add.
 */
export declare const addStoreDetailsCheckedFeature: (mapId: string, feature: TypeFeatureInfoEntry) => void;
/**
 * Removes a feature from the checked features list in the store, or clears all.
 *
 * @param mapId - The map identifier.
 * @param feature - The feature to remove, or 'all' to clear the list.
 */
export declare const removeStoreDetailsCheckedFeature: (mapId: string, feature: TypeFeatureInfoEntry | "all") => void;
/**
 * Sets whether the coordinate info feature is enabled in the store.
 *
 * @param mapId - The map identifier.
 */
export declare const setStoreDetailsCoordinateInfoEnabled: (mapId: string, coordinateInfoEnabled: boolean) => void;
/**
 * Propagates a feature info result set entry to the details store.
 *
 * If an entry for the same layer path does not already exist in the
 * layerDataArray, it is appended.
 *
 * @param mapId - The map identifier.
 * @param resultSetEntry - The feature info result set entry to propagate.
 */
export declare const propagateStoreFeatureInfoDetails: (mapId: string, resultSetEntry: TypeFeatureInfoResultSetEntry) => void;
/**
 * Deletes feature info for a layer from the details store.
 *
 * Clears the selected layer path and batch bypass if they match the removed layer.
 * Removes the entry from layerDataArray via the helper function.
 *
 * @param mapId - The map identifier.
 * @param layerPath - The layer path whose feature info should be removed.
 */
export declare const deleteStoreDetailsFeatureInfo: (mapId: string, layerPath: string) => void;
/**
 * Updates (creates/replaces) the specific coordinate information layer entry in the details store.
 *
 * Builds a synthetic layer data entry with a specific layer path
 * and appends it to the current layer data array.
 *
 * @param mapId - The map identifier.
 * @param features - Optional feature entries to include in the coordinate info layer.
 * @param queryStatus - The status of the query.
 */
export declare const updateStoreCoordinateInfoLayer: (mapId: string, features: TypeFeatureInfoEntry[], queryStatus: TypeQueryStatus) => void;
/**
 * The time delay (in ms) between propagations in the batch layer data array.
 *
 * The longer the delay, the more layers will have a chance to reach a loaded
 * state before the layerDataArray changes. The delay can be bypassed using
 * the layer path bypass method.
 */
export declare const TIME_DELAY_BETWEEN_PROPAGATION_FOR_BATCH = 1000;
/**
 * Propagates feature info layer sets to the store in a batched manner, every 'timeDelayBetweenPropagationsForBatch' millisecond.
 * This is used to provide another 'layerDataArray', in the store, which updates less often so that we save a couple 'layerDataArray'
 * update triggers in the components that are listening to the store array.
 * The propagation can be bypassed using the store 'layerDataArrayBatchLayerPathBypass' state which tells the process to
 * immediately batch out the array in the store for faster triggering of the state, for faster updating of the UI.
 *
 * @param mapId - The map id
 * @param layerDataArray - The layer data array to batch on
 * @returns Promise which resolves upon completion
 */
export declare const propagateStoreFeatureInfoBatch: (mapId: string, layerDataArray: TypeFeatureInfoResultSetEntry[]) => Promise<void>;
/**
 * Initializes an FeatureInfo State and provide functions which use the get/set Zustand mechanisms.
 *
 * @param set - The setter callback to be used by this state
 * @param get - The getter callback to be used by this state
 * @returns The initialized FeatureInfo State
 */
export declare function initFeatureInfoState(set: TypeSetStore, get: TypeGetStore): IFeatureInfoState;
/**
 * Initializes Zustand store subscriptions for the details (feature info) state.
 *
 * Sets up watchers for layerDataArray changes (to propagate batches),
 * click coordinate changes (to create/delete coordinate info), and
 * coordinateInfoEnabled toggling.
 *
 * @param store - The GeoView Zustand store instance.
 */
export declare function initDetailsStateSubscriptions(store: GeoviewStoreType): void;
/**
 * Clears all active Zustand subscriptions for the details state.
 */
export declare function clearDetailsStateSubscriptions(mapId: string): void;
/**
 * Represents a single feature info set entry with query status and feature data.
 */
export type TypeFeatureInfoSetEntry = {
    /** The current query status for this entry. */
    queryStatus: TypeQueryStatus;
    /** The feature info entries returned by the query. */
    features?: TypeFeatureInfoEntry[];
    /** Whether the features in this entry have associated geometry. */
    featuresHaveGeometry: boolean;
};
/** A feature info result set entry combining result set metadata with feature info set data. */
export type TypeFeatureInfoResultSetEntry = TypeResultSetEntry & TypeFeatureInfoSetEntry;
/** A full result set of feature info entries for all layers. */
export type TypeFeatureInfoResultSet = TypeResultSet<TypeFeatureInfoResultSetEntry>;
/**
 * Represents hover feature information displayed in the map tooltip.
 *
 * Can be an object with layer type and field info, undefined, or null.
 */
export type TypeHoverFeatureInfo = {
    /** The layer path. */
    layerPath: string;
    /** The GeoView layer type of the hovered feature. */
    geoviewLayerType: TypeGeoviewLayerType;
    /** The icon associated with the feature, if any. */
    featureIcon?: string;
    /** The field entry displayed in the tooltip. */
    fieldInfo?: TypeFieldEntry;
    /** The name field used as the tooltip label. */
    nameField?: string;
} | undefined | null;
/**
 * Represents a hover set entry with query status and hover feature data.
 */
export type TypeHoverSetEntry = {
    /** The current query status for this hover entry. */
    queryStatus: TypeQueryStatus;
    /** The hover feature info. */
    feature: TypeHoverFeatureInfo;
};
/** A hover result set entry combining result set metadata with hover set data. */
export type TypeHoverResultSetEntry = TypeResultSetEntry & TypeHoverSetEntry;
/** A full result set of hover entries for all layers. */
export type TypeHoverResultSet = TypeResultSet<TypeHoverResultSetEntry>;
//# sourceMappingURL=feature-info-state.d.ts.map