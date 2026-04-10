import type { TypeFeatureInfoEntry, TypeLayerData, TypeResultSet, TypeResultSetEntry } from '@/api/types/map-schema-types';
import type { TypeSetStore, TypeGetStore } from '@/core/stores/geoview-store';
import type { TypeMapFeaturesConfig } from '@/core/types/global-types';
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
        setRowsFilteredEntry: (rows: number, layerPath: string) => void;
        setSelectedFeature: (feature: TypeFeatureInfoEntry) => void;
        setSelectedLayerPath: (layerPath: string) => void;
        setTableFilters(newTableFilters: Record<string, string>): void;
        setToolbarRowSelectedMessageEntry: (message: string, layerPath: string) => void;
    };
}
/**
 * Initializes an DataTable State and provide functions which use the get/set Zustand mechanisms.
 *
 * @param set - The setter callback to be used by this state
 * @param get - The getter callback to be used by this state
 * @returns The initialized DataTable State
 */
export declare function initialDataTableState(set: TypeSetStore, get: TypeGetStore): IDataTableState;
/**
 * Gets filter(s) for a layer.
 * @param mapId - The map id of the state to act on
 * @param layerPath - The path of the layer
 * @returns The data table filter(s) for the layer
 */
export declare const getStoreDataTableFilters: (mapId: string) => Record<string, string> | undefined;
/** Hook that returns the table filters record keyed by layer path. */
export declare const useStoreDataTableFilters: () => Record<string, string>;
/**
 * Gets filter(s) for a layer.
 * @param mapId - The map id of the state to act on
 * @param layerPath - The path of the layer
 * @returns The data table filter(s) for the layer
 */
export declare const getStoreTableFilter: (mapId: string, layerPath: string) => string | undefined;
/**
 * Hook that returns the table filter for a specific layer.
 *
 * @param layerPath - The layer path to get the filter for.
 * @returns The filter string for the layer, or undefined if not set.
 */
export declare const useStoreTableFilter: (layerPath: string) => string | undefined;
/**
 * Gets the selected data table layer path for the given map.
 *
 * @param mapId - The map identifier.
 * @returns The selected layer path, or an empty string if none is selected.
 */
export declare const getStoreDataTableSelectedLayerPath: (mapId: string) => string;
/** Hook that returns the currently selected data table layer path. */
export declare const useStoreDataTableSelectedLayerPath: () => string;
/**
 * Gets the aggregated feature info array for all layers in the data table.
 *
 * @param mapId - The map identifier.
 * @returns The array of feature info result set entries.
 */
export declare const getStoreDataTableAllFeaturesDataArray: (mapId: string) => TypeAllFeatureInfoResultSetEntry[];
/** Hook that returns the aggregated feature info result set entries for all layers. */
export declare const useStoreDataTableAllFeaturesDataArray: () => TypeAllFeatureInfoResultSetEntry[];
/**
 * Gets whether the data table is filtered to the current map extent for a specific layer.
 *
 * @param mapId - The map identifier.
 * @param layerPath - The layer path to check.
 * @returns True if map extent filtering is enabled, or undefined if the layer has no settings.
 */
export declare const getStoreMapFilteredRecord: (mapId: string, layerPath: string) => boolean | undefined;
/** Hook that returns the per-layer data table settings record. */
export declare const useStoreDataTableLayerSettings: () => Record<string, IDataTableSettings>;
/** Hook that returns the currently selected feature in the data table. */
export declare const useStoreDataTableSelectedFeature: () => TypeFeatureInfoEntry | null;
/**
 * Initializes default data table settings for a layer in the store.
 *
 * @param mapId - The map identifier.
 * @param layerPath - The layer path to initialize settings for.
 */
export declare const setStoreInitialSettings: (mapId: string, layerPath: string) => void;
/**
 * Sets the selected data table layer path in the store.
 *
 * @param mapId - The map identifier.
 * @param layerPath - The layer path to select.
 */
export declare const setStoreSelectedLayerPath: (mapId: string, layerPath: string) => void;
/**
 * Sets the selected feature in the data table store.
 *
 * @param mapId - The map identifier.
 * @param feature - The feature entry to select.
 */
export declare const setStoreSelectedFeature: (mapId: string, feature: TypeFeatureInfoEntry) => void;
/**
 * Sets the active layer data in the data table store.
 *
 * @param mapId - The map identifier.
 * @param activeLayerData - The layer data objects to set as active.
 */
export declare const setStoreActiveLayersData: (mapId: string, activeLayerData: TypeLayerData[]) => void;
/**
 * Sets the column filters for a specific layer in the store.
 *
 * @param mapId - The map identifier.
 * @param filtered - The column filter state to apply.
 * @param layerPath - The target layer path.
 */
export declare const setStoreColumnFiltersEntry: (mapId: string, filtered: TypeColumnFiltersState, layerPath: string) => void;
/**
 * Sets the column filter modes for a specific layer in the store.
 *
 * @param mapId - The map identifier.
 * @param filterModes - A record mapping column ids to their filter mode.
 * @param layerPath - The target layer path.
 */
export declare const setStoreColumnFilterModesEntry: (mapId: string, filterModes: Record<string, string>, layerPath: string) => void;
/**
 * Sets the column filters visibility for a specific layer in the store.
 *
 * @param mapId - The map identifier.
 * @param visible - Whether column filters should be visible.
 * @param layerPath - The target layer path.
 */
export declare const setStoreColumnsFiltersVisibility: (mapId: string, visible: boolean, layerPath: string) => void;
/**
 * Sets the global filter value for a specific layer in the store.
 *
 * @param mapId - The map identifier.
 * @param globalFilterValue - The global filter string.
 * @param layerPath - The target layer path.
 */
export declare const setStoreGlobalFilteredEntry: (mapId: string, globalFilterValue: string, layerPath: string) => void;
/**
 * Sets whether the data table is filtered to the current map extent for a layer in the store.
 *
 * @param mapId - The map identifier.
 * @param mapFiltered - Whether map extent filtering is enabled.
 * @param layerPath - The target layer path.
 */
export declare const setStoreMapFilteredEntry: (mapId: string, mapFiltered: boolean, layerPath: string) => void;
/**
 * Sets the filtered row count for a specific layer in the store.
 *
 * @param mapId - The map identifier.
 * @param rows - The filtered row count.
 * @param layerPath - The target layer path.
 */
export declare const setStoreRowsFilteredEntry: (mapId: string, rows: number, layerPath: string) => void;
/**
 * Sets the toolbar row-selected message for a specific layer in the store.
 *
 * @param mapId - The map identifier.
 * @param message - The message to display.
 * @param layerPath - The target layer path.
 */
export declare const setStoreToolbarRowSelectedMessageEntry: (mapId: string, message: string, layerPath: string) => void;
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
export declare const addOrUpdateStoreTableFilter: (mapId: string, layerPath: string, filter: string) => void;
/**
 * Propagates a feature info result set entry to the data table store.
 *
 * If an entry for the same layer path does not already exist in the
 * allFeaturesDataArray, it is appended.
 *
 * @param mapId - The map identifier.
 * @param resultSetEntry - The feature info result set entry to propagate.
 */
export declare const propagateFeatureInfoDataTableToStore: (mapId: string, resultSetEntry: TypeAllFeatureInfoResultSetEntry) => void;
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
export declare const deleteStoreFeatureAllInfo: (mapId: string, layerPath: string, callbackWhenEmpty: () => void) => void;
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
    /** Whether the table is filtered to the current map extent. */
    mapFilteredRecord: boolean;
    /** The number of rows matching the current filters. */
    rowsFilteredRecord: number;
    /** The toolbar message shown when rows are selected. */
    toolbarRowSelectedMessageRecord: string;
    /** The current global filter string applied across all columns. */
    globalFilterRecord: string;
}
/** A feature info result set entry that combines result set entry metadata with layer data. */
export type TypeAllFeatureInfoResultSetEntry = TypeResultSetEntry & TypeLayerData;
/** A full result set of feature info entries for all layers. */
export type TypeAllFeatureInfoResultSet = TypeResultSet<TypeAllFeatureInfoResultSetEntry>;
//# sourceMappingURL=data-table-state.d.ts.map