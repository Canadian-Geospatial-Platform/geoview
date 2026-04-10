import type { FilterNodeType } from '@/geo/utils/renderer/geoview-renderer-types';
/**
 * Aggregates and composes the different filter fragments applied at various
 * levels of the application (initial load, class-level, data table, time slider).
 * Filters are stored as raw string expressions and combined using logical AND
 * when requested.
 */
export declare class LayerFilters {
    #private;
    /**
     * Constructs a LayerFilters.
     *
     * @param initialFilter - Optional initial filter applied at the base level
     * @param classFilter - Optional filter regarding the class renderers
     * @param dataFilter - Optional filter regarding data
     * @param timeFilter - Optional filter regarding time
     */
    constructor(initialFilter?: string, classFilter?: string, dataFilter?: string, timeFilter?: string);
    /**
     * Gets the initial base filter.
     *
     * @returns The initial base filter or undefined when not set
     */
    getInitialFilter(): string | undefined;
    /**
     * Gets if the layer has an initial base filter.
     *
     * @returns True when the layer has an initial base filter
     */
    hasInitialFilter(): boolean;
    /**
     * Gets the class renderer filter.
     *
     * @returns The class renderer filter or undefined when not set
     */
    getClassFilter(): string | undefined;
    /**
     * Sets the class renderer filter.
     *
     * @param classFilter - The class renderer filter
     */
    setClassFilter(classFilter: string | undefined): void;
    /**
     * Gets if the layer has a class filter.
     *
     * @returns True when the layer has a class filter
     */
    hasClassFilter(): boolean;
    /**
     * Gets the data filter.
     *
     * @returns The data filter or undefined when not set
     */
    getDataFilter(): string | undefined;
    /**
     * Sets the data filter.
     *
     * @param dataFilter - The data filter
     */
    setDataFilter(dataFilter: string | undefined): void;
    /**
     * Gets if the layer has a data filter.
     *
     * @returns True when the layer has a data filter
     */
    hasDataFilter(): boolean;
    /**
     * Gets the time filter.
     *
     * @returns The time filter or undefined when not set
     */
    getTimeFilter(): string | undefined;
    /**
     * Sets the time filter.
     *
     * @param timeFilter - The time filter
     */
    setTimeFilter(timeFilter: string | undefined): void;
    /**
     * Gets if the layer has a time filter.
     *
     * @returns True when the layer has a time filter
     */
    hasTimeFilter(): boolean;
    /**
     * Returns all active data-related filters combined into a single expression
     * using the logical AND operator.
     *
     * @returns A combined data filter expression
     */
    getDataRelatedFilters(): string;
    /**
     * Returns all active filters (including time-based filters) combined into a
     * single expression using the logical AND operator.
     *
     * @returns A combined filter expression
     */
    getAllFilters(): string;
    /**
     * Returns the cached filter equation for this layer.
     *
     * The filter equation is represented as an array of {@link FilterNodeType}
     * produced by parsing the combined layer filters.
     * The value is cached and only recalculated when explicitly refreshed.
     *
     * @returns The cached filter equation or undefined when not set
     */
    getFilterEquation(): FilterNodeType[] | undefined;
    /**
     * Joins multiple SQL filter fragments using the AND operator.
     *
     * Ignores undefined, null, empty, or whitespace-only filters.
     * Returns an empty string if no valid filters are provided.
     * Returns the single filter as-is if only one is valid (no extra parentheses).
     * Wraps each filter in parentheses when combining multiple filters
     * to preserve logical precedence.
     *
     * @param filters - List of optional SQL filter fragments
     * @param extraSpacing - Optional extra spacing to add inside parentheses
     * @returns A combined SQL filter string joined with AND, or an empty string
     *   if no valid filters exist
     */
    static joinWithAnd(filters: (string | undefined)[], extraSpacing?: string): string;
}
//# sourceMappingURL=layer-filters.d.ts.map