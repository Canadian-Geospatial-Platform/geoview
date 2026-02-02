import { type FilterNodeType } from '@/geo/utils/renderer/geoview-renderer-types';
/**
 * Aggregates and composes the different filter fragments applied at various
 * levels of the application (initial load, class-level, data table, time slider).
 * Filters are stored as raw string expressions and combined using logical AND
 * when requested.
 */
export declare class LayerFilters {
    #private;
    /**
     * Constructor
     * @param {string} [initialFilter] - The initial filter applied at the base level
     * @param {string} [classFilter] - The filter regarding the class renderers
     * @param {string} [dataFilter] - The filter regarding data
     * @param {string} [timeFilter] - The filter regarding time
     */
    constructor(initialFilter?: string, classFilter?: string, dataFilter?: string, timeFilter?: string);
    /**
     * Gets the initial base filter
     * @returns {string | undefined} The initial base filter
     */
    getInitialFilter(): string | undefined;
    /**
     * Gets if the layer has an initial base filter
     * @returns {boolean} True when the layer has an initial base filter
     */
    hasInitialFilter(): boolean;
    /**
     * Gets the class renderer filter
     * @returns {string | undefined} The class renderer filter
     */
    getClassFilter(): string | undefined;
    /**
     * Sets the class renderer filter
     * @param {string | undefined} classFilter - The class renderer filter
     * @returns {void}
     */
    setClassFilter(classFilter: string | undefined): void;
    /**
     * Gets if the layer has a class filter
     * @returns {boolean} True when the layer has a class filter
     */
    hasClassFilter(): boolean;
    /**
     * Gets the data filter
     * @returns {string | undefined} The data filter
     */
    getDataFilter(): string | undefined;
    /**
     * Sets the data filter
     * @param {string | undefined} dataFilter - The data filter
     * @returns {void}
     */
    setDataFilter(dataFilter: string | undefined): void;
    /**
     * Gets if the layer has a data filter
     * @returns {boolean} True when the layer has a data filter
     */
    hasDataFilter(): boolean;
    /**
     * Gets the time filter
     * @returns {string | undefined} The time filter
     */
    getTimeFilter(): string | undefined;
    /**
     * Sets the time filter
     * @param {string | undefined} timeFilter - The time filter
     * @returns {void}
     */
    setTimeFilter(timeFilter: string | undefined): void;
    /**
     * Gets if the layer has a time filter
     * @returns {boolean} True when the layer has a time filter
     */
    hasTimeFilter(): boolean;
    /**
     * Returns all active data-related filters combined into a single expression
     * using the logical AND operator.
     * @returns {string} A combined data filter expression.
     */
    getDataRelatedFilters(): string;
    /**
     * Returns all active filters (including time-based filters) combined into a
     * single expression using the logical AND operator.
     * @returns {string} A combined filter expression.
     */
    getAllFilters(): string;
    /**
     * Returns the cached filter equation for this layer.
     * The filter equation is represented as an array of {@link FilterNodeType}
     * produced by parsing the combined layer filters.
     * The value is cached and only recalculated when explicitly refreshed.
     * @returns {FilterNodeType[] | undefined} The cached filter equation if any.
     */
    getFilterEquation(): FilterNodeType[] | undefined;
    /**
     * Joins multiple SQL filter fragments using the AND operator.
     * - Ignores undefined, null, empty, or whitespace-only filters.
     * - Returns an empty string if no valid filters are provided.
     * - Returns the single filter as-is if only one is valid (no extra parentheses).
     * - Wraps each filter in parentheses when combining multiple filters
     *   to preserve logical precedence.
     * @param {Array<string | undefined>} filters - List of optional SQL filter fragments.
     * @returns {string} A combined SQL filter string joined with AND, or an empty string
     *   if no valid filters exist.
     */
    static joinWithAnd(filters: (string | undefined)[], extraSpacing?: string): string;
}
//# sourceMappingURL=layer-filters.d.ts.map