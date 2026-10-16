import { GeoviewRenderer } from '@/geo/utils/renderer/geoview-renderer';
import { NodeType, type FilterNodeType } from '@/geo/utils/renderer/geoview-renderer-types';

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

  /** Filter from the filter panel */
  #panelFilter?: string;

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
   * @param panelFilter - Optional filter from the filter panel
   */
  constructor(initialFilter?: string, classFilter?: string, dataFilter?: string, timeFilter?: string, panelFilter?: string) {
    // Keep attributes
    this.#initialFilter = initialFilter;
    this.#classFilter = classFilter;
    this.#dataFilter = dataFilter;
    this.#timeFilter = timeFilter;
    this.#panelFilter = panelFilter;
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
   * Sets the initial base filter.
   *
   * @param initialFilter - The initial base filter
   */
  setInitialFilter(initialFilter: string | undefined): void {
    this.#initialFilter = initialFilter;
    this.#refreshFilterEquation();
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
   * Gets the panel filter.
   *
   * @returns The panel filter or undefined when not set
   */
  getPanelFilter(): string | undefined {
    return this.#panelFilter;
  }

  /**
   * Sets the panel filter.
   *
   * @param panelFilter - The panel filter
   */
  setPanelFilter(panelFilter: string | undefined): void {
    this.#panelFilter = panelFilter;
    this.#refreshFilterEquation();
  }

  /**
   * Gets if the layer has a panel filter.
   *
   * @returns True when the layer has a panel filter
   */
  hasPanelFilter(): boolean {
    return !!this.#panelFilter;
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
   * @param adjustTimeFilterForVector - Whether to adjust the time filter for vector data
   * @param vectorTimeField - Optional vector field that corresponds to the time filter
   * @param dateFieldNames - Names of date-typed feature fields
   * @returns A combined filter expression
   */
  getAllFilters(adjustTimeFilterForVector = false, vectorTimeField?: string, dateFieldNames?: string[]): string {
    // Get the data related filters
    const dataRelatedFilters = this.#getDataRelatedFilters();

    // If tweaking the time filter to point on vector fields
    let timeFilter = this.#timeFilter;
    if (adjustTimeFilterForVector) {
      timeFilter = LayerFilters.adjustTimeFilterForVectorData(timeFilter, vectorTimeField, dateFieldNames ?? []);
    }

    // Return the filter clause
    return LayerFilters.joinWithAnd([...dataRelatedFilters, timeFilter], this.#extraSpacing);
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
    return [this.#initialFilter, this.#classFilter, this.#dataFilter, this.#panelFilter];
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
   * Adjusts a time filter to match fields available in associated vector data.
   *
   * The original predicate is retained when its field exists. Otherwise, the configured vector time field is preferred, followed by a sole
   * date-typed field. When neither is available, undefined is returned so unrelated client-side filters can still be applied.
   *
   * @param timeFilter - Optional time filter predicate
   * @param vectorTimeField - Optional configured vector time field
   * @param dateFieldNames - Names of date-typed feature fields
   * @returns The adjusted time filter, or undefined when no time filter can be applied
   */
  static adjustTimeFilterForVectorData(
    timeFilter: string | undefined,
    vectorTimeField: string | undefined,
    dateFieldNames: string[]
  ): string | undefined {
    if (!timeFilter) return timeFilter;

    // Create the filter nodes from the time filter
    const filterNodesFromFilter = GeoviewRenderer.createFilterNodeFromFilter(timeFilter);
    const timeFilterFieldNode = filterNodesFromFilter.find(
      (node) => node.nodeType === NodeType.variable && typeof node.nodeValue === 'string'
    );

    const timeFilterField = typeof timeFilterFieldNode?.nodeValue === 'string' ? timeFilterFieldNode.nodeValue : undefined;

    // Keep the configured filter when its field is present in the returned feature data.
    if (!timeFilterField || dateFieldNames.includes(timeFilterField)) return timeFilter;

    // Prefer the configured vector time field when it is available.
    let fallbackTimeField = vectorTimeField && dateFieldNames.includes(vectorTimeField) ? vectorTimeField : undefined;

    if (!fallbackTimeField) {
      // Infer the field by type only when there is exactly one date field.
      if (dateFieldNames.length === 1 && dateFieldNames.includes(dateFieldNames[0])) fallbackTimeField = dateFieldNames[0];
    }

    // Rewrite the missing field reference for client-side filtering.
    return fallbackTimeField ? timeFilter.replaceAll(timeFilterField, fallbackTimeField) : undefined;
  }

  /**
   * Creates a client-side filter equation from class, time, and panel filters.
   *
   * When the time filter field is unavailable, the configured vector time field is preferred if present in the feature data.
   * Otherwise, a sole date-typed feature field is used; if there are multiple or no date fields, the time filter is omitted.
   * The class and panel filters are always retained.
   *
   * @param classFilter - Optional class renderer filter
   * @param timeFilter - Optional time slider filter
   * @param panelFilter - Optional filter panel filter
   * @param vectorTimeField - Optional configured vector time field
   * @param dateFieldNames - Names of date-typed feature fields
   * @returns The parsed client-side filter equation
   */
  static createClientFilterEquation(
    classFilter: string | undefined,
    timeFilter: string | undefined,
    panelFilter: string | undefined,
    vectorTimeField: string | undefined,
    dateFieldNames: string[]
  ): FilterNodeType[] {
    // Get the time filter adjusted for the available vector data fields
    const theTimeFilter = LayerFilters.adjustTimeFilterForVectorData(timeFilter, vectorTimeField, dateFieldNames);

    // Combine all applicable filters into a single filter string
    const allFilters = LayerFilters.joinWithAnd([classFilter, theTimeFilter, panelFilter]);

    // Create the client-side filter equation from the combined filter string
    return GeoviewRenderer.createFilterNodeFromFilter(allFilters);
  }

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
  static joinWithAnd(filters: (string | undefined)[], extraSpacing = ''): string {
    const valid = filters.filter((f): f is string => !!f && f.trim().length > 0);
    return valid.length <= 1 ? (valid[0] ?? '') : valid.map((f) => `(${extraSpacing}${f}${extraSpacing})`).join(' AND ');
  }

  // #endregion STATIC METHODS
}

/** Represents the types of filters that can be composed: initial, class, data, panel, or time-based filters. */
export type FilterCategory = 'initial' | 'class' | 'data' | 'panel' | 'time';
