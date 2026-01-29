import { GeoviewRenderer } from '@/geo/utils/renderer/geoview-renderer';
import { type FilterNodeType } from '@/geo/utils/renderer/geoview-renderer-types';

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
   * Constructor
   * @param {string} [initialFilter] - The initial filter applied at the base level
   * @param {string} [classFilter] - The filter regarding the class renderers
   * @param {string} [dataFilter] - The filter regarding data
   * @param {string} [timeFilter] - The filter regarding time
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
   * Gets the initial base filter
   * @returns {string | undefined} The initial base filter
   */
  getInitialFilter(): string | undefined {
    return this.#initialFilter;
  }

  /**
   * Gets if the layer has an initial base filter
   * @returns {boolean} True when the layer has an initial base filter
   */
  hasInitialFilter(): boolean {
    return !!this.#initialFilter;
  }

  /**
   * Gets the class renderer filter
   * @returns {string | undefined} The class renderer filter
   */
  getClassFilter(): string | undefined {
    return this.#classFilter;
  }

  /**
   * Sets the class renderer filter
   * @param {string | undefined} classFilter - The class renderer filter
   * @returns {void}
   */
  setClassFilter(classFilter: string | undefined): void {
    this.#classFilter = classFilter;
    this.#refreshFilterEquation();
  }

  /**
   * Gets if the layer has a class filter
   * @returns {boolean} True when the layer has a class filter
   */
  hasClassFilter(): boolean {
    return !!this.#classFilter;
  }

  /**
   * Gets the data filter
   * @returns {string | undefined} The data filter
   */
  getDataFilter(): string | undefined {
    return this.#dataFilter;
  }

  /**
   * Sets the data filter
   * @param {string | undefined} dataFilter - The data filter
   * @returns {void}
   */
  setDataFilter(dataFilter: string | undefined): void {
    this.#dataFilter = dataFilter;
    this.#refreshFilterEquation();
  }

  /**
   * Gets if the layer has a data filter
   * @returns {boolean} True when the layer has a data filter
   */
  hasDataFilter(): boolean {
    return !!this.#dataFilter;
  }

  /**
   * Gets the time filter
   * @returns {string | undefined} The time filter
   */
  getTimeFilter(): string | undefined {
    return this.#timeFilter;
  }

  /**
   * Sets the time filter
   * @param {string | undefined} timeFilter - The time filter
   * @returns {void}
   */
  setTimeFilter(timeFilter: string | undefined): void {
    this.#timeFilter = timeFilter;
    this.#refreshFilterEquation();
  }

  /**
   * Gets if the layer has a time filter
   * @returns {boolean} True when the layer has a time filter
   */
  hasTimeFilter(): boolean {
    return !!this.#timeFilter;
  }

  /**
   * Returns all active data-related filters combined into a single expression
   * using the logical AND operator.
   * @returns {string} A combined data filter expression.
   */
  getDataRelatedFilters(): string {
    return this.#getDataRelatedFilters()
      .map((v) => `(${this.#extraSpacing}${v}${this.#extraSpacing})`)
      .join(' AND ');
  }

  /**
   * Returns all active filters (including time-based filters) combined into a
   * single expression using the logical AND operator.
   * @returns {string} A combined filter expression.
   */
  getAllFilters(): string {
    return this.#getAllFilters()
      .map((v) => `(${this.#extraSpacing}${v}${this.#extraSpacing})`)
      .join(' AND ');
  }

  /**
   * Returns the cached filter equation for this layer.
   * The filter equation is represented as an array of {@link FilterNodeType}
   * produced by parsing the combined layer filters.
   * The value is cached and only recalculated when explicitly refreshed.
   * @returns {FilterNodeType[] | undefined} The cached filter equation if any.
   */
  getFilterEquation(): FilterNodeType[] | undefined {
    return this.#cachedFilterEquation;
  }

  // #endregion PUBLIC METHODS

  // #region PRIVATE METHODS

  /**
   * Returns all defined data-related filters (excluding time-based filters).
   * Undefined or empty filters are automatically excluded.
   * @returns {string[]} An array of active data filter expressions.
   * @private
   */
  #getDataRelatedFilters(): string[] {
    return [this.#initialFilter, this.#classFilter, this.#dataFilter].filter((v) => !!v) as string[];
  }

  /**
   * Returns all defined filters, including time-based filters.
   * Undefined or empty filters are automatically excluded.
   * @returns {string[]} An array of all active filter expressions.
   * @private
   */
  #getAllFilters(): string[] {
    return [this.#initialFilter, this.#classFilter, this.#dataFilter, this.#timeFilter].filter((v) => !!v) as string[];
  }

  /**
   * Recomputes and updates the cached filter equation.
   * This method combines all active filters, analyzes them, and stores the
   * resulting filter equation for later reuse via {@link getFilterEquation}.
   * It is intended for internal use when filter inputs change.
   * @returns {void}
   * @private
   */
  #refreshFilterEquation(): void {
    // Recalculate and refresh the cached filter equation
    this.#cachedFilterEquation = GeoviewRenderer.createFilterNodeFromFilter(this.getAllFilters());
  }

  // #endregion PRIVATE METHODS
}
