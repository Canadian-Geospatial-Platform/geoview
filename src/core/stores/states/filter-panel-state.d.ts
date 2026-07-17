import type { TypeSetStore, TypeGetStore } from '@/core/stores/geoview-store';
import type { TypeMapFeaturesConfig } from '@/core/types/global-types';
/** Configuration for the filter panel plugin. */
export interface TypeFilterPanelConfig {
    /** Array of layer configurations for filtering. */
    layers?: TypeFilterLayerConfig[];
}
/** Range value for numeric filters. */
export interface TypeRangeValue {
    /** Minimum value. */
    min: number | null;
    /** Maximum value. */
    max: number | null;
}
/** Date range value for date filters. */
export interface TypeDateRangeValue {
    /** Start date. */
    start: string | null;
    /** End date. */
    end: string | null;
}
/** Domain value mapping for attribute values. */
export interface TypeDomainValue {
    /** The raw value from the layer. */
    value: string | number;
    /** The display label for this value. */
    label: string;
}
/** Attribute configuration for filtering. */
export interface TypeFilterAttribute {
    /** Field name in the layer. */
    fieldName: string;
    /** Display label for the filter. */
    displayLabel: string;
    /** Type of filter control. */
    filterType: TypeFilterType;
    /** Whether this attribute is enabled. */
    enabled: boolean;
    /** Default filter values. */
    defaultValues?: TypeFilterValue;
    /** Optional custom options (if not fetching from layer). */
    options?: (string | number)[];
    /** Optional domain mapping for value labels. Only applies to 'select' and 'multiselect' filter types. */
    domain?: TypeDomainValue[];
    /** If true, filter out values not in the domain. If false, show them with raw value. Only applies when domain is defined and filterType is 'select' or 'multiselect'. */
    filterMissingDomainValues?: boolean;
    /** Optional step interval for date filters. Only applies when filterType is 'date'. */
    dateStep?: 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year';
    /** Optional step interval for range filters. Only applies when filterType is 'range'. */
    rangeStep?: number;
}
/** Filter type enumeration. */
export type TypeFilterType = 'select' | 'multiselect' | 'range' | 'date';
/** Filter value type - can be single value, array, or range object. */
export type TypeFilterValue = string | number | (string | number)[] | TypeRangeValue | TypeDateRangeValue;
/** Filter state for a single layer - maps field names to their current filter values. */
export type TypeLayerFilterState = Record<string, TypeFilterValue>;
/** Complete filter state for all layers - maps layer paths to their filter states. */
export type TypeFilterState = Record<string, TypeLayerFilterState>;
/** Layer configuration for filtering. */
export interface TypeFilterLayerConfig {
    /** Unique identifier for the layer (layer path). */
    layerPath: string;
    /** Display name for the layer. */
    layerName?: string;
    /** Whether filtering is enabled for this layer. */
    enabled: boolean;
    /** Whether layer sections are collapsible. */
    collapsible?: boolean;
    /** Default collapsed state for layer sections. */
    defaultCollapsed?: boolean;
    /** Array of filterable attributes. */
    attributes: TypeFilterAttribute[];
}
/**
 * Represents the Filter Panel Zustand store slice.
 *
 * Manages state for the filter panel including layer filter states.
 */
export interface IFilterPanelState {
    /** The current filter state for all layers (layerPath -> field filters). */
    filterState: TypeFilterState;
    /** Tracks collapsed state for each layer (layerPath -> isCollapsed). */
    collapsedLayers: Record<string, boolean>;
    /** Tracks the current filter expression values for the panel as a string */
    panelFilterExpressions: Record<string, string>;
    /** Sets default filter panel configuration values from the map features config. */
    setDefaultConfigValues: (geoviewConfig: TypeMapFeaturesConfig) => void;
    /** Actions to mutate the Filter Panel state. */
    actions: {
        /** Sets the complete filter state for all layers. */
        setFilterState: (filterState: TypeFilterState) => void;
        /** Updates filter state for a specific layer and field. */
        updateLayerFieldFilter: (layerPath: string, fieldName: string, value: TypeFilterValue) => void;
        /** Clears all filters for a specific layer. */
        clearLayerFilters: (layerPath: string) => void;
        /** Clears all filters for all layers. */
        clearAllFilters: () => void;
        /** Sets the collapsed state for a specific layer. */
        setLayerCollapsed: (layerPath: string, collapsed: boolean) => void;
        /** Sets the panel filter value for a specific layer. */
        setPanelFilterExpression: (layerPath: string, filter: string) => void;
    };
}
/**
 * Initializes a Filter Panel state object.
 *
 * @param set - The store set callback function
 * @param get - The store get callback function
 * @returns The Filter Panel state object
 */
export declare function initializeFilterPanelState(set: TypeSetStore, get: TypeGetStore): IFilterPanelState;
/**
 * Gets the filter panel configuration from the map config.
 *
 * @param mapId - The map id
 * @returns The filter panel configuration, or undefined if not found
 */
export declare const getStoreFilterPanelConfig: (mapId: string) => {
    layers?: TypeFilterLayerConfig[];
} | undefined;
/**
 * Gets the configuration for a specific layer from the filter panel config.
 *
 * @param mapId - The map id
 * @param layerPath - The layer path
 * @returns The layer configuration, or undefined if not found
 */
export declare const getStoreFilterPanelLayerConfig: (mapId: string, layerPath: string) => TypeFilterLayerConfig | undefined;
/**
 * Checks whether the Filter Panel plugin state has been initialized for the given map.
 *
 * @param mapId - The map id to check
 * @returns True if the Filter Panel state is initialized, false otherwise
 */
export declare const isStoreFilterPanelInitialized: (mapId: string) => boolean;
/**
 * Gets the complete filter state from the store.
 *
 * @param mapId - The map id to read filter state from
 * @returns The filter state for all layers
 * @throws {PluginStateUninitializedError} When the Filter Panel plugin is uninitialized
 */
export declare const getStoreFilterPanelFilterState: (mapId: string) => TypeFilterState;
/** Hooks the complete filter state from the store. */
export declare const useStoreFilterPanelFilterState: () => TypeFilterState;
/**
 * Gets the filter state for a specific layer from the store.
 *
 * @param mapId - The map id
 * @param layerId - The layer id
 * @returns The filter state for the layer or an empty object if not found
 * @throws {PluginStateUninitializedError} When the Filter Panel plugin is uninitialized
 */
export declare const getStoreFilterPanelLayerFilterState: (mapId: string, layerId: string) => TypeLayerFilterState;
/** Hooks the filter state for a specific layer from the store. */
export declare const useStoreFilterPanelLayerFilterState: (layerId: string) => TypeLayerFilterState;
/**
 * Gets the collapsed state for a specific layer from the store.
 *
 * @param mapId - The map id
 * @param layerPath - The layer path
 * @returns The collapsed state, or false if not found
 * @throws {PluginStateUninitializedError} When the Filter Panel plugin is uninitialized
 */
export declare const getStoreFilterPanelLayerCollapsed: (mapId: string, layerPath: string) => boolean;
/** Hooks the collapsed state for a specific layer from the store. */
export declare const useStoreFilterPanelLayerCollapsed: (layerPath: string) => boolean;
/** Gets the panel filter for a specific layer from the store. */
export declare const useStoreFilterPanelFilterExpression: (layerPath: string) => string | undefined;
/** Sets the panel filter for a specific layer in the store. */
export declare const setStoreFilterPanelFilterExpression: (mapId: string, layerPath: string, filter: string) => void;
/**
 * Sets the complete filter state in the store.
 *
 * @param mapId - The map id
 * @param filterState - The new filter state
 * @throws {PluginStateUninitializedError} When the Filter Panel plugin is uninitialized
 */
export declare const setStoreFilterPanelFilterState: (mapId: string, filterState: TypeFilterState) => void;
/**
 * Updates filter state for a specific layer and field in the store.
 *
 * @param mapId - The map id
 * @param layerId - The layer id
 * @param fieldName - The field name
 * @param value - The filter value
 * @throws {PluginStateUninitializedError} When the Filter Panel plugin is uninitialized
 */
export declare const setStoreFilterPanelLayerFieldFilter: (mapId: string, layerId: string, fieldName: string, value: TypeFilterValue) => void;
/**
 * Clears all filters for a specific layer in the store.
 *
 * @param mapId - The map id
 * @param layerId - The layer id
 * @throws {PluginStateUninitializedError} When the Filter Panel plugin is uninitialized
 */
export declare const clearStoreFilterPanelLayerFilters: (mapId: string, layerId: string) => void;
/**
 * Clears all filters for all layers in the store.
 *
 * @param mapId - The map id
 * @throws {PluginStateUninitializedError} When the Filter Panel plugin is uninitialized
 */
export declare const clearStoreFilterPanelAllFilters: (mapId: string) => void;
/**
 * Sets the collapsed state for a specific layer in the store.
 *
 * @param mapId - The map id
 * @param layerPath - The layer path
 * @param collapsed - The collapsed state
 * @throws {PluginStateUninitializedError} When the Filter Panel plugin is uninitialized
 */
export declare const setStoreFilterPanelLayerCollapsed: (mapId: string, layerPath: string, collapsed: boolean) => void;
//# sourceMappingURL=filter-panel-state.d.ts.map