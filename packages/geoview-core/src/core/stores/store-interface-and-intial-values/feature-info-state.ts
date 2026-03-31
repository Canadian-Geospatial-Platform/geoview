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
  TypeUtmZoneResponse,
  TypeAltitudeResponse,
  TypeNtsResponse,
  TypeServiceUrls,
  TypeMapMouseInfo,
} from '@/api/types/map-schema-types';
import type { TypeGeoviewLayerType } from '@/api/types/layer-schema-types';
import type { TypeMapFeaturesConfig } from '@/core/types/global-types';
import { logger } from '@/core/utils/logger';
import { Projection } from '@/geo/utils/projection';
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
    toggleCoordinateInfoEnabled: () => void;
  };
}

// #endregion INTERFACE DEFINITION

// #region STATE HOOKS
// GV To be used by React components

/** Hook that returns the list of checked/selected features. */
export const useDetailsCheckedFeatures = (): TypeFeatureInfoEntry[] =>
  useStore(useGeoViewStore(), (state) => state.detailsState.checkedFeatures);

/** Hook that returns the feature info layer data array. */
export const useDetailsLayerDataArray = (): TypeFeatureInfoResultSetEntry[] =>
  useStore(useGeoViewStore(), (state) => state.detailsState.layerDataArray);

/** Hook that returns the batched feature info layer data array. */
export const useDetailsLayerDataArrayBatch = (): TypeFeatureInfoResultSetEntry[] =>
  useStore(useGeoViewStore(), (state) => state.detailsState.layerDataArrayBatch);

/** Hook that returns the selected layer path in the details panel. */
export const useDetailsSelectedLayerPath = (): string => useStore(useGeoViewStore(), (state) => state.detailsState.selectedLayerPath);

/** Hook that returns whether coordinate info is enabled. */
export const useDetailsCoordinateInfoEnabled = (): boolean =>
  useStore(useGeoViewStore(), (state) => state.detailsState.coordinateInfoEnabled);

/** Hook that returns whether the coordinate info switch is hidden. */
export const useMapHideCoordinateInfoSwitch = (): boolean =>
  useStore(useGeoViewStore(), (state) => state.detailsState.hideCoordinateInfoSwitch);

// #endregion STATE HOOKS

// #region STATE SELECTORS
// GV Should only be used specifically to access the Store.
// GV Use sparingly and only if you are sure of what you are doing.
// GV DO NOT USE this technique in React components, use the hooks above instead.

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
 * Gets the layer data array for one layer.
 * @param mapId - The map id.
 * @param layerPath - The path of the layer to get.
 * @returns The ordered layer info.
 */
const findLayerDataFromLayerDataArray = (
  mapId: string,
  layerPath: string,
  layerDataArray: TypeFeatureInfoResultSetEntry[] = getStoreDetailsState(mapId).layerDataArray
): TypeFeatureInfoResultSetEntry | undefined => {
  return layerDataArray.find((layer) => layer.layerPath === layerPath);
};

/**
 * Gets the selected layer path in the details panel for the given map.
 *
 * @param mapId - The map identifier.
 * @returns The selected layer path.
 */
export const getStoreDetailsSelectedLayerPath = (mapId: string): string => {
  return getStoreDetailsState(mapId).selectedLayerPath;
};

/**
 * Gets the feature info entries for a specific layer.
 *
 * @param mapId - The map identifier.
 * @param layerPath - The layer path to get features for.
 * @returns The feature info entries, or undefined if the layer is not found.
 */
export const getStoreDetailsFeatures = (mapId: string, layerPath: string): TypeFeatureInfoEntry[] | undefined => {
  return findLayerDataFromLayerDataArray(mapId, layerPath)?.features;
};

// #endregion STATE SELECTORS

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
 * Toggles the coordinate info enabled state in the store.
 *
 * @param mapId - The map identifier.
 */
export const toggleStoreDetailsCoordinateInfoEnabled = (mapId: string): void => {
  getStoreDetailsState(mapId).actions.toggleCoordinateInfoEnabled();
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
 * Creates (or replaces) the coordinate-info layer entry in the details store.
 *
 * Builds a synthetic layer data entry with a 'coordinate-info' layer path
 * and appends it to the current layer data array.
 *
 * @param mapId - The map identifier.
 * @param features - Optional feature entries to include in the coordinate info layer.
 */
export const createStoreCoordinateInfoLayer = (mapId: string, features: TypeFeatureInfoEntry[] = []): void => {
  const coordinateInfoLayer = {
    layerPath: 'coordinate-info',
    layerName: 'Coordinate Information',
    eventListenerEnabled: false,
    queryStatus: 'processed',
    layerStatus: 'processed',
    numOffeature: 1,
    features,
  } as unknown as TypeFeatureInfoResultSetEntry & { numOffeatures: number };

  // Get layer array, minus the coordinate-info layer
  const featureInfoState = getStoreDetailsState(mapId);
  const currentLayerDataArray = [...featureInfoState.layerDataArray].filter((layer) => layer.layerPath !== 'coordinate-info');

  // Add the new coordinate info layer
  currentLayerDataArray.push(coordinateInfoLayer);

  // Update the store directly
  featureInfoState.actions.setLayerDataArray(currentLayerDataArray);
};

/**
 * Creates or deletes coordinate info based on the current enabled state.
 *
 * When coordinate info is enabled, fetches UTM zone, NTS sheet, and altitude
 * data from the configured service URLs and creates a coordinate info layer
 * entry in the store. When disabled, removes any existing coordinate info.
 *
 * @param mapId - The map identifier.
 * @param coordinates - The map mouse info containing click coordinates.
 * @param serviceUrls - Optional service URLs for UTM, NTS, and altitude lookups.
 */
export const createOrDeleteStoreCoordinateInfo = (
  mapId: string,
  coordinates: TypeMapMouseInfo,
  serviceUrls: TypeServiceUrls | undefined
): void => {
  // If the coordinate info is not enabled, clear any existing info
  const state = getStoreDetailsState(mapId);
  if (!state.coordinateInfoEnabled) {
    deleteStoreDetailsFeatureInfo(mapId, 'coordinate-info');
    return;
  }

  const [lng, lat] = coordinates.lonlat;

  if (!serviceUrls) return;

  const { utmZoneUrl, ntsSheetUrl, altitudeUrl } = serviceUrls;
  Promise.allSettled([
    fetch(`${utmZoneUrl}?bbox=${lng}%2C${lat}%2C${lng}%2C${lat}`).then((r) => r.json()) as Promise<TypeUtmZoneResponse>,
    fetch(`${ntsSheetUrl}?bbox=${lng}%2C${lat}%2C${lng}%2C${lat}`).then((r) => r.json()) as Promise<TypeNtsResponse>,
    fetch(`${altitudeUrl}?lat=${lat}&lon=${lng}`).then((r) => r.json()) as Promise<TypeAltitudeResponse>,
  ])
    .then(([utmResult, ntsResult, elevationResult]) => {
      const utmData = utmResult.status === 'fulfilled' ? utmResult.value : undefined;
      const ntsData = ntsResult.status === 'fulfilled' ? ntsResult.value : undefined;
      const elevationData = elevationResult.status === 'fulfilled' ? elevationResult.value : undefined;

      const utmIdentifier = utmData?.features[0].properties.identifier;
      const [easting, northing] = utmIdentifier
        ? Projection.transformToUTMNorthingEasting(coordinates.lonlat, utmIdentifier)
        : [undefined, undefined];

      // Create coordinate info layer entry
      const coordinateFeature: TypeFeatureInfoEntry[] = [
        {
          uid: 'coordinate-info-feature',
          fieldInfo: {
            latitude: { value: lat.toFixed(6), fieldKey: 0, dataType: 'number', alias: 'Latitude' },
            longitude: { value: lng.toFixed(6), fieldKey: 1, dataType: 'number', alias: 'Longitude' },
            utmZone: { value: utmIdentifier, fieldKey: 2, dataType: 'string', alias: 'UTM Identifier' },
            easting: { value: easting?.toFixed(2), fieldKey: 3, dataType: 'number', alias: 'Easting' },
            northing: { value: northing?.toFixed(2), fieldKey: 4, dataType: 'number', alias: 'Northing' },
            ntsMapsheet: {
              value: ntsData?.features
                .filter((f) => f.properties.name !== '')
                .sort((f) => f.properties.scale)
                .map((f) => {
                  const scale = `${f.properties.scale / 1000}K`;
                  return `${f.properties.identifier} - ${f.properties.name} - ${scale}`;
                })
                .join('\n'),
              fieldKey: 5,
              dataType: 'string',
              alias: 'NTS Mapsheets',
            },
            elevation: {
              value: elevationData?.altitude ? `${elevationData.altitude} m` : undefined,
              fieldKey: 6,
              dataType: 'string',
              alias: 'Elevation',
            },
          },
          extent: undefined,
          geometry: undefined,
          featureKey: 0,
          geoviewLayerType: 'CSV',
          supportZoomTo: true,
          layerPath: 'coordinate-info',
        },
      ];

      // Create it in the store
      createStoreCoordinateInfoLayer(mapId, coordinateFeature);
    })
    .catch((error: unknown) => {
      // Log
      logger.logPromiseFailed('Failed to get coordinate info', error);
    });
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
       * Toggles the coordinate info enabled state.
       *
       * When enabling, also triggers coordinate info creation if click coordinates exist.
       */
      toggleCoordinateInfoEnabled: () => {
        const { coordinateInfoEnabled } = get().detailsState;
        set({
          detailsState: {
            ...get().detailsState,
            coordinateInfoEnabled: !coordinateInfoEnabled,
          },
        });
        const { clickCoordinates } = get().mapState;
        if (!coordinateInfoEnabled && clickCoordinates) {
          createOrDeleteStoreCoordinateInfo(get().mapId, clickCoordinates, get().mapConfig?.serviceUrls);
        }
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

  const clickCoordinates = store.subscribe(
    (state) => state.mapState.clickCoordinates,
    (coords) => {
      if (!coords) return;
      // Log
      logger.logTraceCoreStoreSubscription('FEATURE-INFO STATE - clickCoordinates', coords);

      createOrDeleteStoreCoordinateInfo(mapId, coords, store.getState().mapConfig?.serviceUrls);
    }
  );

  const coordinateInfoEnabledSubscription = store.subscribe(
    (state) => state.detailsState.coordinateInfoEnabled,
    (enabled) => {
      if (enabled) {
        // Create empty coordinate info layer when enabled
        createStoreCoordinateInfoLayer(mapId);
      } else {
        // Remove coordinate info layer when disabled
        deleteStoreDetailsFeatureInfo(mapId, 'coordinate-info');
      }
    }
  );

  // Check initial state and create coordinate info layer if neeeded
  if (store.getState().detailsState.coordinateInfoEnabled) {
    doUntil(() => {
      if (mapId) {
        createStoreCoordinateInfoLayer(mapId);
        return true;
      }
      return false;
    }, 1000);
  }

  // Add subscriptions to the list of subscriptions to be used by the state
  subscriptions[mapId] = [];
  subscriptions[mapId].push(...[layerDataArrayUpdateBatch, clickCoordinates, coordinateInfoEnabledSubscription]);
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
