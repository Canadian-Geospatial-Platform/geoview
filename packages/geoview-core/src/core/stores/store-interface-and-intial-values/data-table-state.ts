import { useStore } from 'zustand';

import type { TypeFeatureInfoEntry, TypeLayerData, TypeResultSet, TypeResultSetEntry } from '@/api/types/map-schema-types';
import { type TypeSetStore, type TypeGetStore, useStableSelector } from '@/core/stores/geoview-store';
import { getGeoViewStore, helperDeleteFromArray, useGeoViewStore } from '@/core/stores/stores-managers';
import type { TypeMapFeaturesConfig } from '@/core/types/global-types';
import { logger } from '@/core/utils/logger';

// #region INTERFACE DEFINITION

/**
 * Represents the data table Zustand store slice.
 *
 * Manages state for the feature data table including active layer data,
 * feature arrays, per-layer filter/sort settings, selected features,
 * and the currently selected layer path.
 */
export interface IDataTableState {
  /** The aggregated feature info result set entries for all layers. */
  allFeaturesDataArray: TypeAllFeatureInfoResultSetEntry[];

  /** The layer data objects currently active in the data table. */
  activeLayerData: TypeLayerData[];

  /** Per-layer data table settings keyed by layer path. */
  layersDataTableSetting: Record<string, IDataTableSettings>;

  /** The currently selected feature entry, or null if none is selected. */
  selectedFeature: TypeFeatureInfoEntry | null;

  /** The layer path of the currently selected data table layer. */
  selectedLayerPath: string;

  /** Per-layer filter expressions keyed by layer path. */
  tableFilters: Record<string, string>;

  /**
   * Applies default configuration values from the map config to the data table store.
   *
   * @param geoviewConfig - The map features configuration to extract defaults from.
   */
  setDefaultConfigValues: (geoviewConfig: TypeMapFeaturesConfig) => void;

  /** Store actions callable from adaptors. */
  actions: {
    setActiveLayersData: (layers: TypeLayerData[]) => void;
    setAllFeaturesDataArray: (allFeaturesDataArray: TypeAllFeatureInfoResultSetEntry[]) => void;
    setColumnFiltersEntry: (filtered: TypeColumnFiltersState, layerPath: string) => void;
    setColumnFilterModesEntry: (filterModes: Record<string, string>, layerPath: string) => void;
    setColumnsFiltersVisibility: (visible: boolean, layerPath: string) => void;
    setInitiallayerDataTableSetting: (layerPath: string) => void;
    setGlobalFilteredEntry: (globalFilterValue: string, layerPath: string) => void;
    setMapFilteredEntry: (mapFiltered: boolean, layerPath: string) => void;
    setFilterDataToExtent: (filterDataToExtent: boolean, layerPath: string) => void;
    setRowsFilteredEntry: (rows: number, layerPath: string) => void;
    setSelectedFeature: (feature: TypeFeatureInfoEntry) => void;
    setSelectedLayerPath: (layerPath: string) => void;
    setTableFilters(newTableFilters: Record<string, string>): void;
  };
}

// #endregion INTERFACE DEFINITION

// #region STATE INITIALIZATION

/**
 * Initializes an DataTable State and provide functions which use the get/set Zustand mechanisms.
 *
 * @param set - The setter callback to be used by this state
 * @param get - The getter callback to be used by this state
 * @returns The initialized DataTable State
 */
export function initialDataTableState(set: TypeSetStore, get: TypeGetStore): IDataTableState {
  return {
    activeLayerData: [],
    allFeaturesDataArray: [],
    layersDataTableSetting: {},
    selectedFeature: null,
    selectedLayerPath: '',
    tableFilters: {},
    // Initialize default
    setDefaultConfigValues: (geoviewConfig: TypeMapFeaturesConfig) => {
      set({
        dataTableState: {
          ...get().dataTableState,
          selectedLayerPath: geoviewConfig.footerBar?.selectedDataTableLayerPath || geoviewConfig.appBar?.selectedDataTableLayerPath || '',
        },
      });
    },

    actions: {
      /**
       * Sets the active layer data array in the store.
       *
       * @param activeLayerData - The layer data objects to set as active.
       */
      setActiveLayersData: (activeLayerData: TypeLayerData[]): void => {
        set({
          dataTableState: {
            ...get().dataTableState,
            activeLayerData,
          },
        });
      },

      /**
       * Sets the aggregated feature info result set entries in the store.
       *
       * @param allFeaturesDataArray - The feature info entries for all layers.
       */
      setAllFeaturesDataArray(allFeaturesDataArray: TypeAllFeatureInfoResultSetEntry[]): void {
        set({
          dataTableState: {
            ...get().dataTableState,
            allFeaturesDataArray,
          },
        });
      },

      /**
       * Initializes default data table settings for the given layer path.
       *
       * Creates a new settings entry with default values for column filters,
       * filter modes, visibility, map filtering, row count, toolbar message,
       * and global filter.
       *
       * @param layerPath - The layer path to initialize settings for.
       */
      setInitiallayerDataTableSetting: (layerPath: string): void => {
        const layerSettings = {
          columnFiltersRecord: [],
          columnFilterModesRecord: {},
          columnsFiltersVisibility: false,
          mapFilteredRecord: true,
          filterDataToExtent: false,
          rowsFilteredRecord: 0,
          toolbarRowSelectedMessageRecord: '',
          globalFilterRecord: '',
        };

        set({
          dataTableState: {
            ...get().dataTableState,
            layersDataTableSetting: { ...get().dataTableState.layersDataTableSetting, [layerPath]: layerSettings },
          },
        });
      },

      /**
       * Updates the column filters for the specified layer in the store.
       *
       * @param filtered - The column filter state to apply.
       * @param layerPath - The target layer path.
       */
      setColumnFiltersEntry: (filtered: TypeColumnFiltersState, layerPath: string): void => {
        const layerSettings = get().dataTableState.layersDataTableSetting[layerPath];
        layerSettings.columnFiltersRecord = filtered;

        set({
          dataTableState: {
            ...get().dataTableState,
            layersDataTableSetting: { ...get().dataTableState.layersDataTableSetting, [layerPath]: layerSettings },
          },
        });
      },

      /**
       * Updates the column filter modes for the specified layer in the store.
       *
       * @param filterModes - A record mapping column ids to their filter mode.
       * @param layerPath - The target layer path.
       */
      setColumnFilterModesEntry: (filterModes: Record<string, string>, layerPath: string): void => {
        const layerSettings = get().dataTableState.layersDataTableSetting[layerPath];
        layerSettings.columnFilterModesRecord = filterModes;

        set({
          dataTableState: {
            ...get().dataTableState,
            layersDataTableSetting: { ...get().dataTableState.layersDataTableSetting, [layerPath]: layerSettings },
          },
        });
      },

      /**
       * Sets the visibility of column filters for the specified layer.
       *
       * @param visible - Whether column filters should be visible.
       * @param layerPath - The target layer path.
       */
      setColumnsFiltersVisibility: (visible: boolean, layerPath: string): void => {
        const layerSettings = get().dataTableState.layersDataTableSetting[layerPath];
        layerSettings.columnsFiltersVisibility = visible;

        set({
          dataTableState: {
            ...get().dataTableState,
            layersDataTableSetting: { ...get().dataTableState.layersDataTableSetting, [layerPath]: layerSettings },
          },
        });
      },

      /**
       * Sets whether the data table is filtered to the current map extent for the specified layer.
       *
       * @param mapFiltered - Whether map extent filtering is enabled.
       * @param layerPath - The target layer path.
       */
      setMapFilteredEntry: (mapFiltered: boolean, layerPath: string): void => {
        const layerSettings = get().dataTableState.layersDataTableSetting[layerPath];
        layerSettings.mapFilteredRecord = mapFiltered;

        set({
          dataTableState: {
            ...get().dataTableState,
            layersDataTableSetting: { ...get().dataTableState.layersDataTableSetting, [layerPath]: layerSettings },
          },
        });
      },

      /**
       * Sets the number of filtered rows for the specified layer.
       *
       * @param rows - The filtered row count.
       * @param layerPath - The target layer path.
       */
      setRowsFilteredEntry: (rows: number, layerPath: string): void => {
        const layerSettings = get().dataTableState.layersDataTableSetting[layerPath];
        layerSettings.rowsFilteredRecord = rows;

        set({
          dataTableState: {
            ...get().dataTableState,
            layersDataTableSetting: { ...get().dataTableState.layersDataTableSetting, [layerPath]: layerSettings },
          },
        });
      },

      /**
       * Replaces all table filters with the provided filter record.
       *
       * @param newTableFilters - The new table filters keyed by layer path.
       */
      setTableFilters(newTableFilters: Record<string, string>): void {
        set({
          dataTableState: {
            ...get().dataTableState,
            tableFilters: newTableFilters,
          },
        });
      },

      /**
       * Sets the selected layer path for the data table.
       *
       * @param layerPath - The layer path to select.
       */
      setSelectedLayerPath: (layerPath: string): void => {
        set({
          dataTableState: {
            ...get().dataTableState,
            selectedLayerPath: layerPath,
          },
        });
      },

      /**
       * Sets the global filter value for the specified layer.
       *
       * @param globalFilterValue - The global filter string.
       * @param layerPath - The target layer path.
       */
      setGlobalFilteredEntry: (globalFilterValue: string, layerPath: string): void => {
        const layerSettings = get().dataTableState.layersDataTableSetting[layerPath];
        layerSettings.globalFilterRecord = globalFilterValue;

        set({
          dataTableState: {
            ...get().dataTableState,
            layersDataTableSetting: { ...get().dataTableState.layersDataTableSetting, [layerPath]: layerSettings },
          },
        });
      },

      setFilterDataToExtent: (filterDataToExtent: boolean, layerPath: string) => {
        const layerSettings = get().dataTableState.layersDataTableSetting[layerPath];
        layerSettings.filterDataToExtent = filterDataToExtent;

        set({
          dataTableState: {
            ...get().dataTableState,
            layersDataTableSetting: { ...get().dataTableState.layersDataTableSetting, [layerPath]: layerSettings },
          },
        });
      },

      /**
       * Sets the currently selected feature in the data table.
       *
       * @param feature - The feature entry to select.
       */
      setSelectedFeature: (feature: TypeFeatureInfoEntry): void => {
        set({
          dataTableState: {
            ...get().dataTableState,
            selectedFeature: feature,
          },
        });
      },
    },
  } as IDataTableState;
}

// #endregion STATE INITIALIZATION

// #region STATE GETTERS & HOOKS
// GV Getters should be used to get the values at a moment in time.
// GV Hooks should be used to attach to values and trigger UI components when they change.
// GV Typically they are listed in couples (getter + hook) for the same value.

/**
 * Returns the full data table state slice for the given map.
 *
 * Internal-only selector - not exported to avoid direct store access from outside this module.
 *
 * @param mapId - The map identifier.
 * @returns The IDataTableState for the given map.
 */
// GV No export for the main state!
const getStoreDataTableState = (mapId: string): IDataTableState => getGeoViewStore(mapId).getState().dataTableState;

/**
 * Gets filter(s) for a layer.
 * @param mapId - The map id of the state to act on
 * @param layerPath - The path of the layer
 * @returns The data table filter(s) for the layer
 */
export const getStoreDataTableFilters = (mapId: string): Record<string, string> | undefined => {
  return getStoreDataTableState(mapId)?.tableFilters;
};

/** Hook that returns the table filters record keyed by layer path. */
export const useStoreDataTableFilters = (): Record<string, string> =>
  useStore(useGeoViewStore(), (state) => state.dataTableState.tableFilters);

/**
 * Gets filter(s) for a layer.
 * @param mapId - The map id of the state to act on
 * @param layerPath - The path of the layer
 * @returns The data table filter(s) for the layer
 */
export const getStoreTableFilter = (mapId: string, layerPath: string): string | undefined => {
  return getStoreDataTableState(mapId)?.tableFilters?.[layerPath];
};

/**
 * Hook that returns the table filter for a specific layer.
 *
 * @param layerPath - The layer path to get the filter for.
 * @returns The filter string for the layer, or undefined if not set.
 */
export const useStoreTableFilter = (layerPath: string): string | undefined => {
  return useStore(useGeoViewStore(), (state) => state.dataTableState.tableFilters[layerPath]);
};

/**
 * Gets the selected data table layer path for the given map.
 *
 * @param mapId - The map identifier.
 * @returns The selected layer path, or an empty string if none is selected.
 */
export const getStoreDataTableSelectedLayerPath = (mapId: string): string => {
  return getStoreDataTableState(mapId)?.selectedLayerPath ?? '';
};

/** Hook that returns the currently selected data table layer path. */
export const useStoreDataTableSelectedLayerPath = (): string =>
  useStore(useGeoViewStore(), (state) => state.dataTableState.selectedLayerPath);

/**
 * Gets the aggregated feature info array for all layers in the data table.
 *
 * @param mapId - The map identifier.
 * @returns The array of feature info result set entries.
 */
export const getStoreDataTableAllFeaturesDataArray = (mapId: string): TypeAllFeatureInfoResultSetEntry[] => {
  return getStoreDataTableState(mapId)?.allFeaturesDataArray ?? [];
};

/** Hook that returns the aggregated feature info result set entries for all layers. */
export const useStoreDataTableAllFeaturesDataArray = (): TypeAllFeatureInfoResultSetEntry[] =>
  useStore(useGeoViewStore(), (state) => state.dataTableState.allFeaturesDataArray);

// #endregion STATE GETTERS & HOOKS

// #region STATE GETTERS & HOOKS - OTHERS (no match between getter-hook)

/**
 * Gets whether the data table is filtered to the current map extent for a specific layer.
 *
 * @param mapId - The map identifier.
 * @param layerPath - The layer path to check.
 * @returns True if map extent filtering is enabled, or undefined if the layer has no settings.
 */
export const getStoreMapFilteredRecord = (mapId: string, layerPath: string): boolean | undefined => {
  return getStoreDataTableState(mapId)?.layersDataTableSetting?.[layerPath]?.mapFilteredRecord;
};

/** Hook that returns the per-layer data table settings record. */
export const useStoreDataTableLayerSettings = (): Record<string, IDataTableSettings> => {
  return useStableSelector(useGeoViewStore(), (state) => state.dataTableState.layersDataTableSetting);
};

/** Hook that returns the currently selected feature in the data table. */
export const useStoreDataTableSelectedFeature = (): TypeFeatureInfoEntry | null =>
  useStore(useGeoViewStore(), (state) => state.dataTableState.selectedFeature);

/**
 * Gets whether the data table is filtered to the current map extent for a specific layer.
 *
 * @param mapId - The map identifier.
 * @param layerPath - The layer path to check.
 * @returns True if map extent filtering is enabled, or undefined if the layer has no settings.
 */
export const getStoreDataTableFilterDataToExtent = (mapId: string, layerPath: string): boolean | undefined => {
  return getStoreDataTableState(mapId)?.layersDataTableSetting?.[layerPath]?.filterDataToExtent;
};

// #endregion STATE GETTERS & HOOKS - OTHERS (no match between getter-hook)

// #region STATE ADAPTORS
// GV These methods should be called from a State Adaptor class listening on domain events triggered by controllers.

/**
 * Initializes default data table settings for a layer in the store.
 *
 * @param mapId - The map identifier.
 * @param layerPath - The layer path to initialize settings for.
 */
export const setStoreInitialSettings = (mapId: string, layerPath: string): void => {
  getStoreDataTableState(mapId).actions.setInitiallayerDataTableSetting(layerPath);
};

/**
 * Sets the selected data table layer path in the store.
 *
 * @param mapId - The map identifier.
 * @param layerPath - The layer path to select.
 */
export const setStoreSelectedLayerPath = (mapId: string, layerPath: string): void => {
  getStoreDataTableState(mapId).actions.setSelectedLayerPath(layerPath);
};

/**
 * Sets the selected feature in the data table store.
 *
 * @param mapId - The map identifier.
 * @param feature - The feature entry to select.
 */
export const setStoreSelectedFeature = (mapId: string, feature: TypeFeatureInfoEntry): void => {
  getStoreDataTableState(mapId).actions.setSelectedFeature(feature);
};

/**
 * Sets the active layer data in the data table store.
 *
 * @param mapId - The map identifier.
 * @param activeLayerData - The layer data objects to set as active.
 */
export const setStoreActiveLayersData = (mapId: string, activeLayerData: TypeLayerData[]): void => {
  getStoreDataTableState(mapId).actions.setActiveLayersData(activeLayerData);
};

/**
 * Sets the column filters for a specific layer in the store.
 *
 * @param mapId - The map identifier.
 * @param filtered - The column filter state to apply.
 * @param layerPath - The target layer path.
 */
export const setStoreColumnFiltersEntry = (mapId: string, filtered: TypeColumnFiltersState, layerPath: string): void => {
  getStoreDataTableState(mapId).actions.setColumnFiltersEntry(filtered, layerPath);
};

/**
 * Sets the column filter modes for a specific layer in the store.
 *
 * @param mapId - The map identifier.
 * @param filterModes - A record mapping column ids to their filter mode.
 * @param layerPath - The target layer path.
 */
export const setStoreColumnFilterModesEntry = (mapId: string, filterModes: Record<string, string>, layerPath: string): void => {
  getStoreDataTableState(mapId).actions.setColumnFilterModesEntry(filterModes, layerPath);
};

/**
 * Sets the column filters visibility for a specific layer in the store.
 *
 * @param mapId - The map identifier.
 * @param visible - Whether column filters should be visible.
 * @param layerPath - The target layer path.
 */
export const setStoreColumnsFiltersVisibility = (mapId: string, visible: boolean, layerPath: string): void => {
  getStoreDataTableState(mapId).actions.setColumnsFiltersVisibility(visible, layerPath);
};

/**
 * Sets the global filter value for a specific layer in the store.
 *
 * @param mapId - The map identifier.
 * @param globalFilterValue - The global filter string.
 * @param layerPath - The target layer path.
 */
export const setStoreGlobalFilteredEntry = (mapId: string, globalFilterValue: string, layerPath: string): void => {
  getStoreDataTableState(mapId).actions.setGlobalFilteredEntry(globalFilterValue, layerPath);
};

/**
 * Sets whether the map feature is filtered to the data table filters for a specific layer in the store.
 *
 * @param mapId - The map identifier.
 * @param mapFiltered - Whether map extent filtering is enabled.
 * @param layerPath - The target layer path.
 */
export const setStoreMapFilteredEntry = (mapId: string, mapFiltered: boolean, layerPath: string): void => {
  getStoreDataTableState(mapId).actions.setMapFilteredEntry(mapFiltered, layerPath);
};

/**
 * Sets whether the data table is filtered to the current map extent for a layer in the store.
 *
 * @param mapId - The map identifier.
 * @param filterDataToExtent - Whether filtering data to extent is enabled.
 * @param layerPath - The target layer path.
 */
export const setStoreFilterDataToExtent = (mapId: string, filterDataToExtent: boolean, layerPath: string): void => {
  getStoreDataTableState(mapId).actions.setFilterDataToExtent(filterDataToExtent, layerPath);
};

/**
 * Sets the filtered row count for a specific layer in the store.
 *
 * @param mapId - The map identifier.
 * @param rows - The filtered row count.
 * @param layerPath - The target layer path.
 */
export const setStoreRowsFilteredEntry = (mapId: string, rows: number, layerPath: string): void => {
  getStoreDataTableState(mapId).actions.setRowsFilteredEntry(rows, layerPath);
};

/**
 * Adds or updates a table filter for a specific layer in the store.
 *
 * Merges the provided filter with existing filters, overwriting
 * the entry for the given layer path.
 *
 * @param mapId - The map identifier.
 * @param layerPath - The layer path to set the filter for.
 * @param filter - The filter expression string.
 */
export const addOrUpdateStoreTableFilter = (mapId: string, layerPath: string, filter: string): void => {
  const dataTableState = getStoreDataTableState(mapId);
  const curTableFilters = dataTableState?.tableFilters;
  dataTableState?.actions.setTableFilters({ ...curTableFilters, [layerPath]: filter });
};

/**
 * Propagates a feature info result set entry to the data table store.
 *
 * If an entry for the same layer path does not already exist in the
 * allFeaturesDataArray, it is appended.
 *
 * @param mapId - The map identifier.
 * @param resultSetEntry - The feature info result set entry to propagate.
 */
export const propagateFeatureInfoDataTableToStore = (mapId: string, resultSetEntry: TypeAllFeatureInfoResultSetEntry): void => {
  const dataTableState = getStoreDataTableState(mapId);

  // Create a get all features info object for each layer which is then used to render layers
  const allFeaturesDataArray = [...dataTableState.allFeaturesDataArray];
  if (!allFeaturesDataArray.find((layerEntry) => layerEntry.layerPath === resultSetEntry.layerPath)) {
    allFeaturesDataArray.push(resultSetEntry);
  }

  // Update the layer data array in the store
  dataTableState.actions.setAllFeaturesDataArray(allFeaturesDataArray);
};

/**
 * Removes all feature info for a layer from the data table store.
 *
 * Uses the helper to delete the entry matching the given layer path.
 * If the resulting array is empty, invokes the provided callback to
 * hide the data table tab.
 *
 * @param mapId - The map identifier.
 * @param layerPath - The layer path whose feature info should be removed.
 * @param callbackWhenEmpty - Callback invoked when no layer data remains.
 */
export const deleteStoreFeatureAllInfo = (mapId: string, layerPath: string, callbackWhenEmpty: () => void): void => {
  // Redirect to helper function
  helperDeleteFromArray(getStoreDataTableState(mapId).allFeaturesDataArray, layerPath, (layerArrayResult) => {
    // Update the layer data array in the store
    getStoreDataTableState(mapId).actions.setAllFeaturesDataArray(layerArrayResult);

    // If no more layer data, hide the data table tab
    if (layerArrayResult.length === 0) {
      callbackWhenEmpty();
    }

    // Log
    logger.logInfo('Removed Data Table Info in stores for layer path:', layerPath);
  });
};

// #endregion STATE ADAPTORS

// Import { MRTColumnFiltersState } from 'material-react-table' fails - This is likely not portable. a type annotation is necessary
// Create a type to mimic

/** An array of column filter entries, mimicking MRTColumnFiltersState from material-react-table. */
export type TypeColumnFiltersState = ColumnFilter[];

/**
 * Represents a single column filter entry.
 *
 * Mimics the ColumnFilter type from material-react-table since
 * importing it directly is not portable.
 */
export interface ColumnFilter {
  /** The column identifier that this filter applies to. */
  id: string;

  /** The filter value for the column. */
  value: unknown;
}

/**
 * Per-layer data table settings.
 *
 * Tracks column filters, filter modes, visibility, map filtering,
 * row count, toolbar messages, and the global filter for a single layer.
 */
export interface IDataTableSettings {
  /** The active column filter entries for the layer. */
  columnFiltersRecord: TypeColumnFiltersState;

  /** A record mapping column ids to their current filter mode. */
  columnFilterModesRecord: Record<string, string>;

  /** Whether column filter inputs are visible. */
  columnsFiltersVisibility: boolean;

  /** Whether the features in the map should reflect the filters applied in the data table. */
  mapFilteredRecord: boolean;

  /** Whether the data table is filtered to the current map extent. */
  filterDataToExtent: boolean;

  /** The number of rows matching the current filters. */
  rowsFilteredRecord: number;

  /** The current global filter string applied across all columns. */
  globalFilterRecord: string;
}

/** A feature info result set entry that combines result set entry metadata with layer data. */
export type TypeAllFeatureInfoResultSetEntry = TypeResultSetEntry & TypeLayerData;

/** A full result set of feature info entries for all layers. */
export type TypeAllFeatureInfoResultSet = TypeResultSet<TypeAllFeatureInfoResultSetEntry>;
