import { GeoviewRenderer } from '@/geo/utils/renderer/geoview-renderer';
import type { FilterNodeType } from '@/geo/utils/renderer/geoview-renderer-types';

/**
 * Aggregates and composes the different filter fragments applied at various
 * levels of the application (initial load, class-level, data table, time slider).
 * Filters are stored as raw string expressions and combined using logical AND
 * when requested.
 */
export class LayerFilters {
  /** Filter applied at the base level (always) */
  #initialFilter?: string;

  /** Filter applied at the rendering class level */
  #classFilter?: string;

  /** Filter on data */
  #dataFilter?: string;

  /** Filter on time */
  #timeFilter?: string;

  /** The cached filter equation which changes every filter change */
  #cachedFilterEquation?: FilterNodeType[];

  /** Indicates the extra spacing to add, if any */
  #extraSpacing = '';

  /**
   * Constructs a LayerFilters.
   *
   * @param initialFilter - Optional initial filter applied at the base level
   * @param classFilter - Optional filter regarding the class renderers
   * @param dataFilter - Optional filter regarding data
   * @param timeFilter - Optional filter regarding time
   */
  constructor(initialFilter?: string, classFilter?: string, dataFilter?: string, timeFilter?: string) {
    // Keep attributes
    this.#initialFilter = initialFilter;
    this.#classFilter = classFilter;
    this.#dataFilter = dataFilter;
    this.#timeFilter = timeFilter;
    this.#refreshFilterEquation();
  }

  // #region PUBLIC METHODS

  /**
   * Gets the initial base filter.
   *
   * @returns The initial base filter or undefined when not set
   */
  getInitialFilter(): string | undefined {
    return this.#initialFilter;
  }

  /**
   * Gets if the layer has an initial base filter.
   *
   * @returns True when the layer has an initial base filter
   */
  hasInitialFilter(): boolean {
    return !!this.#initialFilter;
  }

  /**
   * Gets the class renderer filter.
   *
   * @returns The class renderer filter or undefined when not set
   */
  getClassFilter(): string | undefined {
    return this.#classFilter;
  }

  /**
   * Sets the class renderer filter.
   *
   * @param classFilter - The class renderer filter
   */
  setClassFilter(classFilter: string | undefined): void {
    this.#classFilter = classFilter;
    this.#refreshFilterEquation();
  }

  /**
   * Gets if the layer has a class filter.
   *
   * @returns True when the layer has a class filter
   */
  hasClassFilter(): boolean {
    return !!this.#classFilter;
  }

  /**
   * Gets the data filter.
   *
   * @returns The data filter or undefined when not set
   */
  getDataFilter(): string | undefined {
    return this.#dataFilter;
  }

  /**
   * Sets the data filter.
   *
   * @param dataFilter - The data filter
   */
  setDataFilter(dataFilter: string | undefined): void {
    this.#dataFilter = dataFilter;
    this.#refreshFilterEquation();
  }

  /**
   * Gets if the layer has a data filter.
   *
   * @returns True when the layer has a data filter
   */
  hasDataFilter(): boolean {
    return !!this.#dataFilter;
  }

  /**
   * Gets the time filter.
   *
   * @returns The time filter or undefined when not set
   */
  getTimeFilter(): string | undefined {
    return this.#timeFilter;
  }

  /**
   * Sets the time filter.
   *
   * @param timeFilter - The time filter
   */
  setTimeFilter(timeFilter: string | undefined): void {
    this.#timeFilter = timeFilter;
    this.#refreshFilterEquation();
  }

  /**
   * Gets if the layer has a time filter.
   *
   * @returns True when the layer has a time filter
   */
  hasTimeFilter(): boolean {
    return !!this.#timeFilter;
  }

  /**
   * Returns all active data-related filters combined into a single expression
   * using the logical AND operator.
   *
   * @returns A combined data filter expression
   */
  getDataRelatedFilters(): string {
    return LayerFilters.joinWithAnd(this.#getDataRelatedFilters(), this.#extraSpacing);
  }

  /**
   * Returns all active filters (including time-based filters) combined into a
   * single expression using the logical AND operator.
   *
   * @returns A combined filter expression
   */
  getAllFilters(): string {
    return LayerFilters.joinWithAnd(this.#getAllFilters(), this.#extraSpacing);
  }

  /**
   * Returns the cached filter equation for this layer.
   *
   * The filter equation is represented as an array of {@link FilterNodeType}
   * produced by parsing the combined layer filters.
   * The value is cached and only recalculated when explicitly refreshed.
   *
   * @returns The cached filter equation or undefined when not set
   */
  getFilterEquation(): FilterNodeType[] | undefined {
    return this.#cachedFilterEquation;
  }

  // #endregion PUBLIC METHODS

  // #region PRIVATE METHODS

  /**
   * Returns all defined data-related filters (excluding time-based filters).
   *
   * Undefined or empty filters are automatically excluded.
   *
   * @returns An array of active data filter expressions
   */
  #getDataRelatedFilters(): (string | undefined)[] {
    return [this.#initialFilter, this.#classFilter, this.#dataFilter];
  }

  /**
   * Returns all defined filters, including time-based filters.
   *
   * Undefined or empty filters are automatically excluded.
   *
   * @returns An array of all active filter expressions
   */
  #getAllFilters(): (string | undefined)[] {
    return [this.#initialFilter, this.#classFilter, this.#dataFilter, this.#timeFilter];
  }

  /**
   * Recomputes and updates the cached filter equation.
   *
   * This method combines all active filters, analyzes them, and stores the
   * resulting filter equation for later reuse via {@link getFilterEquation}.
   * It is intended for internal use when filter inputs change.
   */
  #refreshFilterEquation(): void {
    // Recalculate and refresh the cached filter equation
    this.#cachedFilterEquation = GeoviewRenderer.createFilterNodeFromFilter(this.getAllFilters());
  }

  // #endregion PRIVATE METHODS

  // #region STATIC METHODS

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
  static joinWithAnd(filters: (string | undefined)[], extraSpacing: string = ''): string {
    const valid = filters.filter((f): f is string => !!f && f.trim().length > 0);
    return valid.length <= 1 ? (valid[0] ?? '') : valid.map((f) => `(${extraSpacing}${f}${extraSpacing})`).join(' AND ');
  }

  // #endregion STATIC METHODS
}
