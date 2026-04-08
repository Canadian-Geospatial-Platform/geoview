import { useStore } from 'zustand';

import type { TypeSetStore, TypeGetStore, GeoviewStoreType } from '@/core/stores/geoview-store';
import {
  getGeoViewStore,
  helperDeleteFromArray,
  helperPropagateArrayStoreBatch,
  useGeoViewStore,
  type BatchedPropagationLayerDataArrayByMap,
  type SubscriptionDelegate,
} from '@/core/stores/stores-managers';
import type {
  TypeFeatureInfoEntry,
  TypeResultSet,
  TypeResultSetEntry,
  TypeQueryStatus,
  TypeFieldEntry,
} from '@/api/types/map-schema-types';
import type { TypeGeoviewLayerType } from '@/api/types/layer-schema-types';
import type { TypeMapFeaturesConfig } from '@/core/types/global-types';
import { logger } from '@/core/utils/logger';
import { doUntil } from '@/core/utils/utilities';

// #region INTERFACE DEFINITION

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

// #endregion INTERFACE DEFINITION

// #region PUBLIC CONSTANTS

/** The layer path for the coordinate info feature. */
export const LAYER_PATH_COORDINATE_INFO = 'coordinate-info';

// #endregion PUBLIC CONSTANTS

// #region UTIL FUNCTIONS (PRIVATE)

/**
 * Gets the layer data array for one layer.
 * @param mapId - The map id.
 * @param layerPath - The path of the layer to get.
 * @returns The ordered layer info.
 */
const findLayerDataFromLayerDataArray = (
  layerPath: string,
  layerDataArray: TypeFeatureInfoResultSetEntry[]
): TypeFeatureInfoResultSetEntry | undefined => {
  return layerDataArray.find((layer) => layer.layerPath === layerPath);
};

// #endregion UTIL FUNCTIONS (PRIVATE)

// #region STATE GETTERS & HOOKS
// GV Getters should be used to get the values at a moment in time.
// GV Hooks should be used to attach to values and trigger UI components when they change.
// GV Typically they are listed in couples (getter + hook) for the same value.

/**
 * Returns the full feature info state slice for the given map.
 *
 * Internal-only selector - not exported to avoid direct store access from outside this module.
 *
 * @param mapId - The map identifier.
 * @returns The IFeatureInfoState for the given map.
 */
// GV No export for the main state!
const getStoreDetailsState = (mapId: string): IFeatureInfoState => getGeoViewStore(mapId).getState().detailsState;

/**
 * Gets the selected layer path in the details panel for the given map.
 *
 * @param mapId - The map identifier.
 * @returns The selected layer path.
 */
export const getStoreDetailsSelectedLayerPath = (mapId: string): string => {
  return getStoreDetailsState(mapId).selectedLayerPath;
};

/** Hook that returns the selected layer path in the details panel. */
export const useStoreDetailsSelectedLayerPath = (): string => useStore(useGeoViewStore(), (state) => state.detailsState.selectedLayerPath);

/**
 * Gets the layer query status for a given layer path.
 *
 * @param mapId - The map identifier.
 * @param layerPath - The layer path to get the query status for.
 * @returns The query status for the layer, or undefined if the layer is not found.
 */
export const getStoreDetailsQueryStatus = (mapId: string, layerPath: string): TypeQueryStatus | undefined => {
  return findLayerDataFromLayerDataArray(layerPath, getStoreDetailsState(mapId).layerDataArray)?.queryStatus;
};

/** Hook that returns the selected layer path in the details panel. */
export const useStoreDetailsQueryStatus = (layerPath: string): TypeQueryStatus | undefined => {
  return useStore(useGeoViewStore(), (state) => findLayerDataFromLayerDataArray(layerPath, state.detailsState.layerDataArray)?.queryStatus);
};

/**
 * Gets the coordinate info enabled state for the given map.
 *
 * @param mapId - The map identifier.
 * @returns Whether coordinate info is enabled.
 */
export const getStoreDetailsCoordinateInfoEnabled = (mapId: string): boolean => {
  return getStoreDetailsState(mapId).coordinateInfoEnabled;
};

/** Hook that returns whether coordinate info is enabled. */
export const useStoreDetailsCoordinateInfoEnabled = (): boolean =>
  useStore(useGeoViewStore(), (state) => state.detailsState.coordinateInfoEnabled);

/**
 * Gets the feature info entry for the coordinate info layer from the details store.
 *
 * @param mapId - The map identifier.
 * @returns The feature info entry for the coordinate info layer, or undefined if not found.
 */
export const getStoreDetailsLayerDataArrayFeature = (mapId: string): TypeFeatureInfoEntry | undefined => {
  return findLayerDataFromLayerDataArray(LAYER_PATH_COORDINATE_INFO, getStoreDetailsState(mapId).layerDataArray)?.features?.[0];
};

/** Hook that returns the feature info for the coordinate info layer data array. */
export const useStoreDetailsLayerDataArrayFeature = (): TypeFeatureInfoEntry | undefined =>
  useStore(
    useGeoViewStore(),
    (state) => findLayerDataFromLayerDataArray(LAYER_PATH_COORDINATE_INFO, state.detailsState.layerDataArray)?.features?.[0]
  );

// #endregion STATE GETTERS & HOOKS

// #region STATE GETTERS & HOOKS - OTHERS (no match between getter-hook)

/**
 * Gets the feature info entries for a specific layer.
 *
 * @param mapId - The map identifier.
 * @param layerPath - The layer path to get features for.
 * @returns The feature info entries, or undefined if the layer is not found.
 */
export const getStoreDetailsFeatures = (mapId: string, layerPath: string): TypeFeatureInfoEntry[] | undefined => {
  const { layerDataArray } = getStoreDetailsState(mapId);
  return findLayerDataFromLayerDataArray(layerPath, layerDataArray)?.features;
};

/** Hook that returns the list of checked/selected features. */
export const useStoreDetailsCheckedFeatures = (): TypeFeatureInfoEntry[] =>
  useStore(useGeoViewStore(), (state) => state.detailsState.checkedFeatures);

/** Hook that returns the batched feature info layer data array. */
export const useStoreDetailsLayerDataArrayBatch = (): TypeFeatureInfoResultSetEntry[] =>
  useStore(useGeoViewStore(), (state) => state.detailsState.layerDataArrayBatch);

/** Hook that returns whether the coordinate info switch is hidden. */
export const useStoreDetailsHideCoordinateInfoSwitch = (): boolean =>
  useStore(useGeoViewStore(), (state) => state.detailsState.hideCoordinateInfoSwitch);

// #endregion STATE GETTERS & HOOKS - OTHERS (no match between getter-hook)

// #region STATE ADAPTORS

/**
 * Sets the feature info layer data array in the store.
 *
 * @param mapId - The map identifier.
 * @param layerDataArray - The feature info result set entries to set.
 */
export const setStoreDetailsLayerDataArray = (mapId: string, layerDataArray: TypeFeatureInfoResultSetEntry[]): void => {
  getStoreDetailsState(mapId).actions.setLayerDataArray(layerDataArray);
};

/**
 * Sets the batched feature info layer data array in the store.
 *
 * @param mapId - The map identifier.
 * @param layerDataArrayBatch - The batched feature info result set entries to set.
 */
export const setStoreDetailsLayerDataArrayBatch = (mapId: string, layerDataArrayBatch: TypeFeatureInfoResultSetEntry[]): void => {
  getStoreDetailsState(mapId).actions.setLayerDataArrayBatch(layerDataArrayBatch);
};

/**
 * Sets the layer path that bypasses the batch propagation delay.
 *
 * @param mapId - The map identifier.
 * @param layerDataArrayBatchLayerPathBypass - The layer path to bypass.
 */
export const setStoreDetailsLayerDataArrayBatchLayerPathBypass = (mapId: string, layerDataArrayBatchLayerPathBypass: string): void => {
  getStoreDetailsState(mapId).actions.setLayerDataArrayBatchLayerPathBypass(layerDataArrayBatchLayerPathBypass);
};

/**
 * Sets the selected layer path in the details panel store.
 *
 * @param mapId - The map identifier.
 * @param selectedLayerPath - The layer path to select.
 */
export const setStoreDetailsSelectedLayerPath = (mapId: string, selectedLayerPath: string): void => {
  getStoreDetailsState(mapId).actions.setSelectedLayerPath(selectedLayerPath);
};

/**
 * Adds a feature to the checked features list in the store.
 *
 * @param mapId - The map identifier.
 * @param feature - The feature entry to add.
 */
export const addStoreDetailsCheckedFeature = (mapId: string, feature: TypeFeatureInfoEntry): void => {
  getStoreDetailsState(mapId).actions.addCheckedFeature(feature);
};

/**
 * Removes a feature from the checked features list in the store, or clears all.
 *
 * @param mapId - The map identifier.
 * @param feature - The feature to remove, or 'all' to clear the list.
 */
export const removeStoreDetailsCheckedFeature = (mapId: string, feature: TypeFeatureInfoEntry | 'all'): void => {
  getStoreDetailsState(mapId).actions.removeCheckedFeature(feature);
};

/**
 * Sets whether the coordinate info feature is enabled in the store.
 *
 * @param mapId - The map identifier.
 */
export const setStoreDetailsCoordinateInfoEnabled = (mapId: string, coordinateInfoEnabled: boolean): void => {
  getStoreDetailsState(mapId).actions.setCoordinateInfoEnabled(coordinateInfoEnabled);
};

/**
 * Propagates a feature info result set entry to the details store.
 *
 * If an entry for the same layer path does not already exist in the
 * layerDataArray, it is appended.
 *
 * @param mapId - The map identifier.
 * @param resultSetEntry - The feature info result set entry to propagate.
 */
export const propagateStoreFeatureInfoDetails = (mapId: string, resultSetEntry: TypeFeatureInfoResultSetEntry): void => {
  // The feature info state
  const featureInfoState = getStoreDetailsState(mapId);

  // Create a details object for each layer which is then used to render layers in details panel.
  const layerDataArray = [...featureInfoState.layerDataArray];
  if (!layerDataArray.find((layerEntry) => layerEntry.layerPath === resultSetEntry.layerPath)) layerDataArray.push(resultSetEntry);

  // Update the layer data array in the store
  featureInfoState.actions.setLayerDataArray(layerDataArray);
};

/**
 * Deletes feature info for a layer from the details store.
 *
 * Clears the selected layer path and batch bypass if they match the removed layer.
 * Removes the entry from layerDataArray via the helper function.
 *
 * @param mapId - The map identifier.
 * @param layerPath - The layer path whose feature info should be removed.
 */
export const deleteStoreDetailsFeatureInfo = (mapId: string, layerPath: string): void => {
  // The feature info state
  const featureInfoState = getStoreDetailsState(mapId);

  // Clear selected layer path and layer data array patch layer path bypass if they are the current path
  if (layerPath === featureInfoState.selectedLayerPath) {
    featureInfoState.actions.setSelectedLayerPath('');
  }

  if (layerPath === featureInfoState.layerDataArrayBatchLayerPathBypass) {
    featureInfoState.actions.setLayerDataArrayBatchLayerPathBypass('');
  }

  // Redirect to helper function
  helperDeleteFromArray(featureInfoState.layerDataArray, layerPath, (layerArrayResult) => {
    // Update the layer data array in the store
    featureInfoState.actions.setLayerDataArray(layerArrayResult);

    // Log
    logger.logInfo('Removed Feature Info in stores for layer path:', layerPath);
  });
};

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
export const updateStoreCoordinateInfoLayer = (mapId: string, features: TypeFeatureInfoEntry[], queryStatus: TypeQueryStatus): void => {
  getStoreDetailsState(mapId).actions.updateCoordinateInfoLayer(features, queryStatus);
};

// #region STATE ADAPTORS - BATCH PROPAGATION

/** Holds the list of layer data arrays being buffered in the propagation process for the batch. */
const batchedPropagationLayerDataArray: BatchedPropagationLayerDataArrayByMap<TypeFeatureInfoResultSetEntry> = {};

/**
 * The time delay (in ms) between propagations in the batch layer data array.
 *
 * The longer the delay, the more layers will have a chance to reach a loaded
 * state before the layerDataArray changes. The delay can be bypassed using
 * the layer path bypass method.
 */
export const TIME_DELAY_BETWEEN_PROPAGATION_FOR_BATCH = 1000;

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
export const propagateStoreFeatureInfoBatch = (mapId: string, layerDataArray: TypeFeatureInfoResultSetEntry[]): Promise<void> => {
  // The feature info state
  const featureInfoState = getStoreDetailsState(mapId);

  // Redirect to batch propagate
  return helperPropagateArrayStoreBatch(
    mapId,
    layerDataArray,
    batchedPropagationLayerDataArray,
    TIME_DELAY_BETWEEN_PROPAGATION_FOR_BATCH,
    featureInfoState.actions.setLayerDataArrayBatch,
    'feature-info-processor',
    featureInfoState.layerDataArrayBatchLayerPathBypass,
    featureInfoState.actions.setLayerDataArrayBatchLayerPathBypass
  );
};

// #endregion STATE ADAPTORS - BATCH PROPAGATION

// #endregion STATE ADAPTORS

// #region STATE INITIALIZATION

/**
 * Initializes an FeatureInfo State and provide functions which use the get/set Zustand mechanisms.
 *
 * @param set - The setter callback to be used by this state
 * @param get - The getter callback to be used by this state
 * @returns The initialized FeatureInfo State
 */
export function initFeatureInfoState(set: TypeSetStore, get: TypeGetStore): IFeatureInfoState {
  // Wait for the state to be ready and initialize the coordinate info layer
  // GV There may be a better way to do this, but it's what we were doing at the time of this refactor
  doUntil(() => {
    // Once the details state is ready in the store
    if (get().detailsState) {
      // Updates the store coodinate info layer if it needs to be there
      if (get().detailsState.coordinateInfoEnabled) updateStoreCoordinateInfoLayer(get().mapId, [], 'init');

      // We did it
      return true;
    }

    // Keep waiting
    return false;
  }, 1000);

  return {
    checkedFeatures: [],
    layerDataArray: [],
    layerDataArrayBatch: [],
    layerDataArrayBatchLayerPathBypass: '',
    selectedLayerPath: '',
    coordinateInfoEnabled: false,
    hideCoordinateInfoSwitch: false,

    // Initialize default
    setDefaultConfigValues: (geoviewConfig: TypeMapFeaturesConfig) => {
      set({
        detailsState: {
          ...get().detailsState,
          coordinateInfoEnabled:
            (geoviewConfig.globalSettings?.coordinateInfoEnabled && !geoviewConfig.globalSettings?.hideCoordinateInfoSwitch) || false,
          hideCoordinateInfoSwitch: geoviewConfig.globalSettings?.hideCoordinateInfoSwitch || false,
        },
      });
    },

    actions: {
      /**
       * Adds a feature to the checked features list.
       *
       * @param feature - The feature entry to add.
       */
      addCheckedFeature: (feature: TypeFeatureInfoEntry) => {
        set({
          detailsState: {
            ...get().detailsState,
            checkedFeatures: [...get().detailsState.checkedFeatures, feature],
          },
        });
      },

      /**
       * Removes a feature from the checked features list, or clears all.
       *
       * @param feature - The feature to remove, or 'all' to clear the entire list.
       */
      removeCheckedFeature: (feature: TypeFeatureInfoEntry | 'all') => {
        set({
          detailsState: {
            ...get().detailsState,
            checkedFeatures:
              feature === 'all'
                ? []
                : get().detailsState.checkedFeatures.filter((featureInfoEntry) => featureInfoEntry.uid !== feature.uid),
          },
        });
      },

      /**
       * Sets the layer data array in the store.
       *
       * @param layerDataArray - The feature info result set entries to set.
       */
      setLayerDataArray(layerDataArray: TypeFeatureInfoResultSetEntry[]) {
        set({
          detailsState: {
            ...get().detailsState,
            layerDataArray,
          },
        });
      },

      /**
       * Sets the batched layer data array in the store.
       *
       * @param layerDataArrayBatch - The batched feature info result set entries to set.
       */
      setLayerDataArrayBatch(layerDataArrayBatch: TypeFeatureInfoResultSetEntry[]) {
        set({
          detailsState: {
            ...get().detailsState,
            layerDataArrayBatch,
          },
        });
      },

      /**
       * Sets the layer path that bypasses the batch propagation delay.
       *
       * @param layerDataArrayBatchLayerPathBypass - The layer path to bypass.
       */
      setLayerDataArrayBatchLayerPathBypass(layerDataArrayBatchLayerPathBypass: string) {
        set({
          detailsState: {
            ...get().detailsState,
            layerDataArrayBatchLayerPathBypass,
          },
        });
      },

      /**
       * Sets the selected layer path in the details panel.
       *
       * @param selectedLayerPath - The layer path to select.
       */
      setSelectedLayerPath(selectedLayerPath: string) {
        set({
          detailsState: {
            ...get().detailsState,
            selectedLayerPath,
          },
        });
      },

      /**
       * Sets whether the coordinate info feature is enabled in the store.
       *
       * @param coordinateInfoEnabled - Whether coordinate info is enabled.
       */
      setCoordinateInfoEnabled: (coordinateInfoEnabled: boolean) => {
        set({
          detailsState: {
            ...get().detailsState,
            coordinateInfoEnabled,
          },
        });
      },

      /**
       * Updates (creates/replaces) the coordinate-info synthetic layer entry.
       *
       * @param features - Optional feature entries to include in the coordinate info layer.
       */
      updateCoordinateInfoLayer: (features: TypeFeatureInfoEntry[], queryStatus: TypeQueryStatus) => {
        const coordinateInfoLayer = {
          layerPath: LAYER_PATH_COORDINATE_INFO,
          queryStatus,
          features,
          featuresHaveGeometry: true,
        } as TypeFeatureInfoResultSetEntry;

        // Get layer array, minus the coordinate-info layer
        const currentLayerDataArray = [...get().detailsState.layerDataArray].filter(
          (layer) => layer.layerPath !== LAYER_PATH_COORDINATE_INFO
        );

        // Add the new coordinate info layer
        currentLayerDataArray.push(coordinateInfoLayer);

        // Update the store
        set({
          detailsState: {
            ...get().detailsState,
            layerDataArray: currentLayerDataArray,
          },
        });
      },
    },
  } as IFeatureInfoState;
}

// #endregion STATE INITIALIZATION

// #region STATE INITIALIZATION - SUBSCRIPTIONS

/** The list of active Zustand subscriptions for the details state. */
const subscriptions: Record<string, SubscriptionDelegate[]> = {};

/**
 * Initializes Zustand store subscriptions for the details (feature info) state.
 *
 * Sets up watchers for layerDataArray changes (to propagate batches),
 * click coordinate changes (to create/delete coordinate info), and
 * coordinateInfoEnabled toggling.
 *
 * @param store - The GeoView Zustand store instance.
 */
export function initDetailsStateSubscriptions(store: GeoviewStoreType): void {
  const { mapId } = store.getState();

  // Checks for updated layers in layer data array and update the batched array consequently
  const layerDataArrayUpdateBatch = store.subscribe(
    (state) => state.detailsState.layerDataArray,
    (cur) => {
      // Log
      logger.logTraceCoreStoreSubscription('FEATURE-INFO STATE - layerDataArray', cur);

      // Also propagate in the batched array
      propagateStoreFeatureInfoBatch(mapId, cur).catch((error: unknown) => {
        // Log
        logger.logPromiseFailed('propagateStoreFeatureInfoBatch in layerDataArrayUpdateBatch subscribe in feature-info-state', error);
      });
    }
  );

  // Add subscriptions to the list of subscriptions to be used by the state
  subscriptions[mapId] = [layerDataArrayUpdateBatch];
}

/**
 * Clears all active Zustand subscriptions for the details state.
 */
export function clearDetailsStateSubscriptions(mapId: string): void {
  subscriptions[mapId].forEach((unsubscribe) => unsubscribe());
  subscriptions[mapId].length = 0;
}

// #endregion STATE INITIALIZATION - SUBSCRIPTIONS

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
export type TypeHoverFeatureInfo =
  | {
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
    }
  | undefined
  | null;

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
