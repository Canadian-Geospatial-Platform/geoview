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
   * Gets the class renderer filter
   * @returns {string | undefined} The class renderer filter
   */
  getClassFilter(): string | undefined {
    return this.#classFilter;
  }

  /**
   * Gets the data filter
   * @returns {string | undefined} The data filter
   */
  getDataFilter(): string | undefined {
    return this.#dataFilter;
  }

  /**
   * Gets the time filter
   * @returns {string | undefined} The time filter
   */
  getTimeFilter(): string | undefined {
    return this.#timeFilter;
  }

  /**
   * Returns all active data-related filters combined into a single expression
   * using the logical AND operator.
   * @returns {string} A combined data filter expression.
   */
  getDataFilters(): string {
    return this.#getDataFilters()
      .map((v) => `( ${v} )`)
      .join(' AND ');
  }

  /**
   * Returns all active filters (including time-based filters) combined into a
   * single expression using the logical AND operator.
   * @returns {string} A combined filter expression.
   */
  getAllFilters(): string {
    return this.#getAllFilters()
      .map((v) => `( ${v} )`)
      .join(' AND ');
  }

  // #endregion PUBLIC METHODS

  // #region PRIVATE METHODS

  /**
   * Returns all defined data-related filters (excluding time-based filters).
   * Undefined or empty filters are automatically excluded.
   * @returns {string[]} An array of active data filter expressions.
   * @private
   */
  #getDataFilters(): string[] {
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

  // #endregion PRIVATE METHODS
}
