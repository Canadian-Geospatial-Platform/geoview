import type {
  TypeFilterValue,
  TypeRangeValue,
  TypeDateRangeValue,
  TypeLayerFilterState,
} from 'geoview-core/core/stores/states/filter-panel-state';

/**
 * Utility class for building and managing layer filter expressions.
 *
 * Generates SQL-like filter expressions compatible with GeoView's LayerFilters system.
 */
export class FilterManager {
  /**
   * Builds a SQL-like filter expression for a layer based on filter state.
   *
   * @param layerFilterState - Filter state for the layer (field name to value mapping)
   * @returns SQL-like filter expression, or undefined if no filters active
   */
  static buildFilterExpression(layerFilterState: TypeLayerFilterState): string | undefined {
    const expressions: string[] = [];

    Object.entries(layerFilterState).forEach(([fieldName, value]) => {
      // Skip empty filters
      if (value === null || value === undefined || value === '') {
        return;
      }

      // Handle multiselect (arrays)
      if (Array.isArray(value)) {
        if (value.length === 0) {
          return; // Skip empty arrays
        }
        const valueList = value
          .map((v) => {
            if (typeof v === 'string') {
              return `'${FilterManager.#escapeString(v)}'`;
            }
            return v;
          })
          .join(', ');
        expressions.push(`${fieldName} IN (${valueList})`);
      }
      // Handle range filters (objects with min/max)
      else if (FilterManager.#isRangeValue(value)) {
        if (value.min !== null && value.max !== null) {
          expressions.push(`${fieldName} BETWEEN ${value.min} AND ${value.max}`);
        } else if (value.min !== null) {
          expressions.push(`${fieldName} >= ${value.min}`);
        } else if (value.max !== null) {
          expressions.push(`${fieldName} <= ${value.max}`);
        }
      }
      // Handle date range filters (objects with start/end)
      else if (FilterManager.#isDateRangeValue(value)) {
        if (value.start !== null && value.end !== null) {
          expressions.push(`${fieldName} BETWEEN '${value.start}' AND '${value.end}'`);
        } else if (value.start !== null) {
          expressions.push(`${fieldName} >= '${value.start}'`);
        } else if (value.end !== null) {
          expressions.push(`${fieldName} <= '${value.end}'`);
        }
      }
      // Handle single value filters
      else {
        if (typeof value === 'string') {
          expressions.push(`${fieldName} = '${FilterManager.#escapeString(value)}'`);
        } else {
          expressions.push(`${fieldName} = ${value}`);
        }
      }
    });

    // Combine expressions with AND
    return expressions.length > 0 ? expressions.join(' AND ') : undefined;
  }

  /**
   * Checks if a filter value is a range value.
   *
   * @param value - Filter value to check
   * @returns Whether the value is a TypeRangeValue
   */
  static #isRangeValue(value: TypeFilterValue): value is TypeRangeValue {
    return (
      typeof value === 'object' &&
      value !== null &&
      !Array.isArray(value) &&
      ('min' in value || 'max' in value) &&
      !('start' in value) &&
      !('end' in value)
    );
  }

  /**
   * Checks if a filter value is a date range value.
   *
   * @param value - Filter value to check
   * @returns Whether the value is a TypeDateRangeValue
   */
  static #isDateRangeValue(value: TypeFilterValue): value is TypeDateRangeValue {
    return typeof value === 'object' && value !== null && !Array.isArray(value) && ('start' in value || 'end' in value);
  }

  /**
   * Escapes single quotes in strings for SQL expressions.
   *
   * @param str - String to escape
   * @returns Escaped string
   */
  static #escapeString(str: string): string {
    return str.replace(/'/g, "''");
  }

  /**
   * Checks if a layer has any active filters.
   *
   * @param layerFilterState - Filter state for the layer
   * @returns Whether the layer has active filters
   */
  static hasActiveFilters(layerFilterState: TypeLayerFilterState): boolean {
    return Object.values(layerFilterState).some((value) => {
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'object' && value !== null) {
        return Object.values(value).some((v) => v !== null && v !== undefined);
      }
      return value !== null && value !== undefined && value !== '';
    });
  }

  /**
   * Gets a summary of active filters for display.
   *
   * @param layerFilterState - Filter state for the layer
   * @returns Array of filter summary strings
   */
  static getFilterSummary(layerFilterState: TypeLayerFilterState): string[] {
    const activeFilters: string[] = [];

    Object.entries(layerFilterState).forEach(([fieldName, value]) => {
      if (Array.isArray(value) && value.length > 0) {
        activeFilters.push(`${fieldName}: ${value.length} selected`);
      } else if (FilterManager.#isRangeValue(value)) {
        const parts: string[] = [];
        if (value.min !== null) parts.push(`min: ${value.min}`);
        if (value.max !== null) parts.push(`max: ${value.max}`);
        if (parts.length > 0) {
          activeFilters.push(`${fieldName}: ${parts.join(', ')}`);
        }
      } else if (FilterManager.#isDateRangeValue(value)) {
        const parts: string[] = [];
        if (value.start !== null) parts.push(`from: ${value.start}`);
        if (value.end !== null) parts.push(`to: ${value.end}`);
        if (parts.length > 0) {
          activeFilters.push(`${fieldName}: ${parts.join(', ')}`);
        }
      } else if (value !== null && value !== undefined && value !== '') {
        activeFilters.push(`${fieldName}: ${value}`);
      }
    });

    return activeFilters;
  }

  /**
   * Initializes empty filter state for a layer configuration.
   *
   * @param attributes - Array of filter attributes
   * @returns Initial filter state
   */
  static initializeFilterState(
    attributes: { fieldName: string; filterType: string; defaultValues?: TypeFilterValue }[]
  ): TypeLayerFilterState {
    const state: TypeLayerFilterState = {};

    attributes.forEach((attr) => {
      if (attr.filterType === 'multiselect') {
        state[attr.fieldName] = attr.defaultValues || [];
      } else if (attr.filterType === 'range') {
        state[attr.fieldName] = attr.defaultValues || { min: null, max: null };
      } else if (attr.filterType === 'date') {
        state[attr.fieldName] = attr.defaultValues || { start: null, end: null };
      } else {
        state[attr.fieldName] = attr.defaultValues || null;
      }
    });

    return state;
  }
}
