import type { MapViewer } from '@/geo/map/map-viewer';
import { AbstractMapViewerController } from '@/core/controllers/base/abstract-map-viewer-controller';
import type { ControllerRegistry } from '@/core/controllers/base/controller-registry';
import { logger } from '@/core/utils/logger';
import { DateMgt, type ManipulateType } from '@/core/utils/date-mgt';
import {
  getStoreFilterPanelLayerConfig,
  getStoreFilterPanelFilterState,
  getStoreFilterPanelLayerFilterState,
  setStoreFilterPanelFilterState,
  setStoreFilterPanelLayerFieldFilter,
  setStoreFilterPanelFilterExpression,
  clearStoreFilterPanelLayerFilters,
  clearStoreFilterPanelAllFilters,
  type TypeFilterValue,
  type TypeFilterState,
  type TypeRangeValue,
  type TypeDateRangeValue,
  type TypeFilterAttribute,
} from '@/core/stores/states/filter-panel-state';
import { getStoreDataTableFeaturesByPath } from '@/core/stores/states/data-table-state';
import { getStoreLayerStatus } from '@/core/stores/states/layer-state';
import { LayerFilterPanelClearError, LayerFilterPanelQueryError } from '@/core/exceptions/geoview-exceptions';

// #region TYPES (minimal config types for reading filter panel configuration)

/** Minimal filter layer config for reading layer paths from map config. */
interface TypeFilterLayerConfig {
  layerPath: string;
  enabled: boolean;
}

/** Minimal filter panel config for reading configured layers from map config. */
interface TypeFilterPanelConfig {
  layers?: TypeFilterLayerConfig[];
}

// #endregion TYPES

/**
 * Controller responsible for filter panel interactions and bridging
 * the filter state with the layer filtering system.
 *
 * This controller manages filter state in the store and applies filter
 * expressions to layers using GeoView's LayerFilters system.
 */
export class FilterPanelController extends AbstractMapViewerController {
  /**
   * Creates an instance of FilterPanelController.
   *
   * @param mapViewer - The map viewer instance to associate with this controller
   * @param controllerRegistry - The controller registry for accessing sibling controllers
   */
  // GV Leave the constructor here, because we'll likely need it soon to inject dependencies.
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(mapViewer: MapViewer, controllerRegistry: ControllerRegistry) {
    super(mapViewer, controllerRegistry);
  }

  // #region PUBLIC METHODS - FILTER STATE MANAGEMENT

  /**
   * Sets the complete filter state for all layers.
   *
   * @param filterState - The new filter state
   */
  setFilterState(filterState: TypeFilterState): void {
    setStoreFilterPanelFilterState(this.getMapId(), filterState);
  }

  /**
   * Updates a filter value for a specific layer and field.
   *
   * @param layerPath - The layer path
   * @param fieldName - The field name
   * @param value - The filter value
   */
  updateLayerFieldFilter(layerPath: string, fieldName: string, value: TypeFilterValue): void {
    setStoreFilterPanelLayerFieldFilter(this.getMapId(), layerPath, fieldName, value);
  }

  /**
   * Initializes empty filter state for a layer.
   *
   * @param layerPath - The layer path
   */
  initializeLayerFilterState(layerPath: string): void {
    const currentState = getStoreFilterPanelFilterState(this.getMapId());

    setStoreFilterPanelFilterState(this.getMapId(), {
      ...currentState,
      [layerPath]: {},
    });
  }

  // #endregion PUBLIC METHODS - FILTER STATE MANAGEMENT

  // #region PUBLIC METHODS - FILTER APPLICATION

  /**
   * Checks if a layer is ready to have filters applied.
   *
   * @param layerPath - The layer path
   * @returns True if the layer is in a 'processed' or 'loaded' state
   */
  isLayerReady(layerPath: string): boolean {
    const status = getStoreLayerStatus(this.getMapId(), layerPath);
    return status === 'processed' || status === 'loaded';
  }

  /**
   * Builds a SQL-like filter expression for a layer based on its current filter state.
   *
   * Includes both domain base filters (for attributes with filterMissingDomainValues)
   * and user selection filters.
   *
   * @param layerPath - The layer path
   * @returns SQL-like filter expression, or undefined if no filters active
   */
  buildFilterExpression(layerPath: string): string | undefined {
    const layerFilterState = getStoreFilterPanelLayerFilterState(this.getMapId(), layerPath);
    const expressions: string[] = [];

    // Add domain base filters (always active if configured)
    const domainBaseFilters = this.#buildDomainBaseFilters(layerPath);
    if (domainBaseFilters) {
      expressions.push(`(${domainBaseFilters})`);
    }

    // Add user selection filters
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
              return `'${FilterPanelController.escapeString(v)}'`;
            }
            return v;
          })
          .join(', ');
        expressions.push(`${fieldName} IN (${valueList})`);
      }
      // Handle range filters (objects with min/max)
      else if (FilterPanelController.isRangeValue(value)) {
        if (value.min !== null && value.max !== null) {
          expressions.push(`${fieldName} >= ${value.min} AND ${fieldName} <= ${value.max}`);
        } else if (value.min !== null) {
          expressions.push(`${fieldName} >= ${value.min}`);
        } else if (value.max !== null) {
          expressions.push(`${fieldName} <= ${value.max}`);
        }
      }
      // Handle date range filters (objects with start/end)
      else if (FilterPanelController.isDateRangeValue(value)) {
        if (value.start !== null && value.end !== null) {
          expressions.push(`${fieldName} >= '${value.start}' AND ${fieldName} <= '${value.end}'`);
        } else if (value.start !== null) {
          expressions.push(`${fieldName} >= '${value.start}'`);
        } else if (value.end !== null) {
          expressions.push(`${fieldName} <= '${value.end}'`);
        }
      }
      // Handle single value filters
      else {
        if (typeof value === 'string') {
          expressions.push(`${fieldName} = '${FilterPanelController.escapeString(value)}'`);
        } else {
          expressions.push(`${fieldName} = ${value}`);
        }
      }
    });

    // Combine expressions with AND
    return expressions.length > 0 ? expressions.join(' AND ') : undefined;
  }

  /**
   * Applies filters to a specific layer.
   *
   * Builds the filter expression from the current filter state and applies it
   * to the layer. Only applies if the layer is ready and exists.
   *
   * @param layerPath - The layer path
   * @throws {LayerFilterPanelQueryError} If the layer is not found or an error occurs during application
   */
  applyLayerFilter(layerPath: string): void {
    // Check if layer is ready
    if (!this.isLayerReady(layerPath)) {
      logger.logDebug(`Layer ${layerPath} is not ready yet - skipping filter application`);
      return;
    }

    // Get the layer
    const gvLayer = this.getControllersRegistry().layerController.getGeoviewLayerRegularIfExists(layerPath);
    if (!gvLayer) {
      logger.logWarning(`Layer not found: ${layerPath}`);
      return;
    }

    // Build the filter expression from the current filter state
    const expression = this.buildFilterExpression(layerPath);

    // Apply or clear the panel filter using the proper LayerFilters API
    try {
      gvLayer.setLayerFiltersPanel(expression);
      setStoreFilterPanelFilterExpression(this.getMapId(), layerPath, expression || '');
    } catch (err) {
      logger.logError(`Error applying filter panel filter for layer ${layerPath}:`, err);
      throw new LayerFilterPanelQueryError(layerPath);
    }
  }

  /**
   * Applies filters to all configured layers that are ready.
   *
   * Skips layers that are not yet loaded.
   */
  applyAllFilters(): void {
    const filterState = getStoreFilterPanelFilterState(this.getMapId());

    // Apply filters for each layer that has filter state
    Object.keys(filterState).forEach((layerPath) => {
      this.applyLayerFilter(layerPath);
    });
  }

  /**
   * Clears filters for a specific layer.
   *
   * Resets the filter state and removes the panel filter from the layer's filter system.
   *
   * @param layerPath - The layer path
   * @throws {LayerFilterPanelClearError} If the layer is not found or an error occurs during clearing
   */
  clearLayerFilters(layerPath: string): void {
    // Clear the filter state
    clearStoreFilterPanelLayerFilters(this.getMapId(), layerPath);

    // Try to get the gvLayer
    const gvLayer = this.getControllersRegistry().layerController.getGeoviewLayerRegularIfExists(layerPath);
    if (!gvLayer) return;

    // Try to remove the panel filter from the layer using the proper LayerFilters API
    try {
      gvLayer.setLayerFiltersPanel(undefined);
      logger.logInfo(`Cleared filter panel filters for layer ${layerPath}`);
    } catch (err) {
      logger.logError(`Error clearing filter panel filter for layer ${layerPath}:`, err);
      throw new LayerFilterPanelClearError(layerPath);
    }
  }

  /**
   * Clears all filters for all layers.
   */
  clearAllFilters(): void {
    const filterState = getStoreFilterPanelFilterState(this.getMapId());

    // Clear filter state
    clearStoreFilterPanelAllFilters(this.getMapId());

    // Remove panel filters from all layers using the proper LayerFilters API
    Object.keys(filterState).forEach((layerPath) => {
      const gvLayer = this.getControllersRegistry().layerController.getGeoviewLayerRegularIfExists(layerPath);
      if (!gvLayer) return;

      // Try to clear the panel filter for this layer
      try {
        gvLayer.setLayerFiltersPanel(undefined);
      } catch (err) {
        logger.logError(`Error clearing filter panel filter for layer ${layerPath}:`, err);
        throw new LayerFilterPanelClearError(layerPath);
      }
    });
  }

  // #endregion PUBLIC METHODS - FILTER APPLICATION

  // #region PUBLIC METHODS - UTILITIES

  /**
   * Checks if a layer has any active filters.
   *
   * @param layerPath - The layer path
   * @returns Whether the layer has active filters
   */
  hasActiveFilters(layerPath: string): boolean {
    const layerFilterState = getStoreFilterPanelLayerFilterState(this.getMapId(), layerPath);
    return Object.values(layerFilterState).some((value) => {
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'object' && value !== null) {
        return Object.values(value).some((v) => v !== null && v !== undefined);
      }
      return value !== null && value !== undefined && value !== '';
    });
  }

  /**
   * Ensures that a specific layer has been registered in AllFeatureInfoLayerSet and queried.
   *
   * Waits for the layer to appear in the registered layer paths, then triggers
   * a feature query if features aren't already available.
   *
   * @param layerPath - The layer path
   * @returns A promise that resolves when the layer is registered and queried
   * @throws {LayerRegistrationTimeoutError} When the timeout is reached before registration
   */
  async ensureLayerQueried(layerPath: string): Promise<void> {
    const { allFeatureInfoLayerSet } = this.getControllersRegistry().layerSetController;

    // Wait for the layer to be registered in AllFeatureInfoLayerSet
    await allFeatureInfoLayerSet.waitForLayerToGetRegistered(layerPath);

    // Layer is now registered - check if we need to trigger a query
    const existingFeatures = getStoreDataTableFeaturesByPath(this.getMapId(), layerPath);

    if (existingFeatures && existingFeatures.length > 0) {
      logger.logDebug(`Layer ${layerPath} already has ${existingFeatures.length} features`);
      return;
    }

    // Trigger the query
    logger.logInfo(`Triggering feature query for layer: ${layerPath}`);
    await this.getControllersRegistry().layerSetController.triggerGetAllFeatureInfo(layerPath);
    logger.logDebug(`Feature query completed for layer: ${layerPath}`);
  }

  /**
   * Gets unique values for a field from a layer's features.
   *
   * This method integrates with GeoView's AllFeatureInfoLayerSet infrastructure
   * rather than directly accessing OpenLayers sources. It retrieves features that
   * have already been queried and stored in the data table state.
   *
   * If the attribute has a domain defined and the filterType is 'select' or 'multiselect',
   * the values are processed through the domain (filtered and ordered).
   *
   * **Important**: This only works for layers that are queryable (vector sources,
   * WMS with WFS config, etc.). Raster-only layers without feature data will return
   * an empty array.
   *
   * @param layerPath - The layer path
   * @param attribute - The attribute configuration
   * @returns An array of unique values (processed through domain if applicable), or empty array if the layer is not queryable or has not been queried yet
   */
  getLayerFieldUniqueValues(layerPath: string, attribute: TypeFilterAttribute): (string | number)[] {
    // Check if the layer is registered in the AllFeatureInfoLayerSet
    const { allFeatureInfoLayerSet } = this.getControllersRegistry().layerSetController;
    const isQueryable = allFeatureInfoLayerSet.getRegisteredLayerPaths().includes(layerPath);

    if (!isQueryable) {
      logger.logDebug(`Layer ${layerPath} is not queryable - cannot get unique values`);
      return [];
    }

    // Get features from the data table store
    const features = getStoreDataTableFeaturesByPath(this.getMapId(), layerPath);

    if (!features || features.length === 0) {
      logger.logDebug(`No features available yet for layer ${layerPath} - may need to query first`);
      return [];
    }

    // Extract unique values from the feature field info
    try {
      const uniqueSet = new Set<string | number>();

      features.forEach((feature) => {
        const fieldEntry = feature.fieldInfo[attribute.fieldName];
        if (fieldEntry) {
          const { value } = fieldEntry;
          if (value !== null && value !== undefined) {
            if (typeof value === 'string' || typeof value === 'number') {
              uniqueSet.add(value);
            } else {
              uniqueSet.add(String(value));
            }
          }
        }
      });

      let uniqueValues = Array.from(uniqueSet).sort();

      // Apply domain processing if applicable
      uniqueValues = this.processDomainForUniqueValues(uniqueValues, attribute);

      return uniqueValues;
    } catch (err) {
      logger.logError(`Error extracting unique values for layer ${layerPath}, field ${attribute.fieldName}:`, err);
      return [];
    }
  }

  /**
   * Processes unique values through domain mapping if applicable.
   *
   * Domain processing only applies to 'select' and 'multiselect' filter types.
   * When a domain is defined:
   * - Optionally filters out values not in the domain (if filterMissingDomainValues is true)
   * - Orders values according to the domain order (not alphabetical)
   *
   * @param uniqueValues - Array of unique values from the layer (alphabetically sorted)
   * @param attribute - The attribute configuration
   * @returns Filtered and ordered array of values
   */
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  processDomainForUniqueValues(uniqueValues: (string | number)[], attribute: TypeFilterAttribute): (string | number)[] {
    // Domain only applies to select and multiselect filter types
    if (
      !attribute.domain ||
      attribute.domain.length === 0 ||
      (attribute.filterType !== 'select' && attribute.filterType !== 'multiselect')
    ) {
      return uniqueValues;
    }

    // Step 1: Filter values if filterMissingDomainValues is true
    let processedValues = uniqueValues;
    if (attribute.filterMissingDomainValues) {
      const domainValueSet = new Set(attribute.domain.map((d) => d.value));
      processedValues = uniqueValues.filter((val) => domainValueSet.has(val));
    }

    // Step 2: Order values according to domain order (not alphabetical)
    const domainOrderMap = new Map<string | number, number>();
    attribute.domain.forEach((domainEntry, index) => {
      domainOrderMap.set(domainEntry.value, index);
    });

    return processedValues.sort((a, b) => {
      const aIndex = domainOrderMap.get(a);
      const bIndex = domainOrderMap.get(b);

      // Both have domain order - use domain order
      if (aIndex !== undefined && bIndex !== undefined) {
        return aIndex - bIndex;
      }

      // Only a has domain order - a comes first
      if (aIndex !== undefined) return -1;

      // Only b has domain order - b comes first
      if (bIndex !== undefined) return 1;

      // Neither has domain order - alphabetical fallback
      return String(a).localeCompare(String(b));
    });
  }

  /**
   * Gets the display label for a value using the attribute's domain mapping.
   *
   * @param attribute - The attribute configuration
   * @param value - The raw value from the layer
   * @returns The display label from the domain, or the stringified value if no domain match
   */
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  getDisplayLabel(attribute: TypeFilterAttribute, value: string | number): string {
    if (!attribute.domain) return String(value);

    const domainEntry = attribute.domain.find((d) => d.value === value);
    return domainEntry ? domainEntry.label : String(value);
  }

  /**
   * Ensures that all configured layers have their features queried.
   *
   * This method reads the filter panel configuration and triggers feature queries
   * for any enabled layers that:
   * - Are registered in the AllFeatureInfoLayerSet (queryable layers)
   * - Have not yet had their features queried
   *
   * This is typically called when the filter panel is opened to ensure unique
   * field values can be populated for filter dropdowns.
   *
   * @returns A promise that resolves when all queries have been triggered (or skipped if not needed)
   */
  async ensureLayerFeaturesQueried(): Promise<void> {
    // Get the filter panel config from mapFeaturesConfig (not store, to support runtime config merges)
    const filterPanelConfig = this.getMapViewer().mapFeaturesConfig.corePackagesConfig?.find((config) =>
      Object.keys(config).includes('filter-panel')
    )?.['filter-panel'] as TypeFilterPanelConfig | undefined;

    if (!filterPanelConfig?.layers) {
      logger.logDebug('No filter panel config found or no layers configured');
      return;
    }

    // Get the layer set controller for querying
    const { allFeatureInfoLayerSet } = this.getControllersRegistry().layerSetController;

    // Trigger queries for each enabled layer that needs it
    const queryPromises: Promise<unknown>[] = [];

    filterPanelConfig.layers.forEach((layerConfig: TypeFilterLayerConfig) => {
      // Skip disabled layers
      if (!layerConfig.enabled) return;

      const { layerPath } = layerConfig;

      // Check if the layer is queryable (registered in AllFeatureInfoLayerSet)
      const isQueryable = allFeatureInfoLayerSet.getRegisteredLayerPaths().includes(layerPath);

      if (!isQueryable) {
        logger.logDebug(`Layer ${layerPath} is not queryable - skipping feature query`);
        return;
      }

      // Check if features are already available in the store
      const existingFeatures = getStoreDataTableFeaturesByPath(this.getMapId(), layerPath);

      if (existingFeatures && existingFeatures.length > 0) {
        logger.logDebug(`Layer ${layerPath} already has ${existingFeatures.length} features - skipping query`);
        return;
      }

      // Trigger the query
      logger.logInfo(`Triggering feature query for filter panel layer: ${layerPath}`);
      const queryPromise = this.getControllersRegistry()
        .layerSetController.triggerGetAllFeatureInfo(layerPath)
        .catch((error: unknown) => {
          logger.logError(`Error querying features for layer ${layerPath}:`, error);
        });

      queryPromises.push(queryPromise);
    });

    // Wait for all queries to complete
    await Promise.all(queryPromises);
    logger.logDebug('Filter panel feature queries completed');
  }

  /**
   * Computes timestamp bounds from unique date values.
   *
   * Parses date values (strings or epoch numbers) using DateMgt and returns
   * the min/max timestamps along with formatted display dates.
   *
   * @param uniqueValues - Array of date values from layer features
   * @returns Object with min/max timestamps and formatted display dates, or null if no valid dates
   */
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  getDateBounds(uniqueValues: (string | number)[]): { min: number; max: number; minDate: string; maxDate: string } | null {
    if (!uniqueValues.length) {
      return null;
    }

    // Convert values to timestamps using DateMgt
    const timestamps: number[] = [];

    uniqueValues.forEach((val) => {
      try {
        const timestamp = DateMgt.convertToMilliseconds(val);
        if (!Number.isNaN(timestamp)) {
          timestamps.push(timestamp);
        }
      } catch (err) {
        logger.logWarning(`Failed to parse date value: ${val}`, err);
      }
    });

    if (!timestamps.length) {
      return null;
    }

    // Find min and max timestamps
    const minTimestamp = Math.min(...timestamps);
    const maxTimestamp = Math.max(...timestamps);

    // Format as YYYY-MM-DD using DateMgt
    const formatDateForDisplay = (timestamp: number): string => {
      return DateMgt.formatDate(timestamp, DateMgt.ISO_DATE_FORMAT, 'en', DateMgt.TIME_UTC);
    };

    return {
      min: minTimestamp,
      max: maxTimestamp,
      minDate: formatDateForDisplay(minTimestamp),
      maxDate: formatDateForDisplay(maxTimestamp),
    };
  }

  /**
   * Formats a timestamp value for display in the UI.
   *
   * Uses DateMgt to format timestamps consistently across the application.
   *
   * @param timestamp - Milliseconds since epoch
   * @returns Formatted date string (e.g., "Jan 15, 2020")
   */
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  formatDateForDisplay(timestamp: number): string {
    return DateMgt.formatDate(timestamp, DateMgt.LONG_DISPLAY_DATE_FORMAT.en, 'en', DateMgt.TIME_UTC);
  }

  /**
   * Converts a timestamp to a YYYY-MM-DD date string for filter expressions.
   *
   * Uses DateMgt to ensure consistent date formatting in SQL filter strings.
   *
   * @param timestamp - Milliseconds since epoch
   * @returns Date string in YYYY-MM-DD format
   */
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  formatDateForFilter(timestamp: number): string {
    return DateMgt.formatDate(timestamp, DateMgt.ISO_DATE_FORMAT, 'en', DateMgt.TIME_UTC);
  }

  /**
   * Applies a calendar-aware date step to a timestamp.
   *
   * Uses Day.js (via DateMgt) to handle calendar arithmetic correctly,
   * including variable-length months and leap years.
   *
   * @param timestamp - The starting timestamp in milliseconds
   * @param dateStep - The step type from attribute config (day, week, month, year, etc.)
   * @param direction - 1 for forward (right arrow), -1 for backward (left arrow)
   * @returns The adjusted timestamp in milliseconds
   */
  applyDateStep(timestamp: number, dateStep: string, direction: 1 | -1): number {
    const stepUnit = this.#getDateStepUnit(dateStep);
    const date = DateMgt.createDayjs(timestamp);
    const adjustedDate = date.add(direction, stepUnit);
    return adjustedDate.valueOf();
  }

  // #endregion PUBLIC METHODS - UTILITIES

  // #region PRIVATE HELPER METHODS

  /**
   * Builds domain base filters for attributes with filterMissingDomainValues enabled.
   *
   * These filters restrict the layer to only show features with values in the domain,
   * regardless of user filter selections.
   *
   * @param layerPath - The layer path
   * @returns SQL-like filter expression for domain restrictions, or undefined if no domain filters
   */

  #buildDomainBaseFilters(layerPath: string): string | undefined {
    const layerConfig = getStoreFilterPanelLayerConfig(this.getMapId(), layerPath);
    if (!layerConfig?.attributes) return undefined;

    const domainExpressions: string[] = [];

    layerConfig.attributes.forEach((attr) => {
      // Only apply domain base filter if filterMissingDomainValues is true
      // and filterType is select or multiselect
      if (
        attr.filterMissingDomainValues &&
        attr.domain &&
        attr.domain.length > 0 &&
        (attr.filterType === 'select' || attr.filterType === 'multiselect')
      ) {
        // Build IN clause with all domain values
        const valueList = attr.domain
          .map((d) => {
            if (typeof d.value === 'string') {
              return `'${FilterPanelController.escapeString(d.value)}'`;
            }
            return d.value;
          })
          .join(', ');

        domainExpressions.push(`${attr.fieldName} IN (${valueList})`);
      }
    });

    return domainExpressions.length > 0 ? domainExpressions.join(' AND ') : undefined;
  }

  /**
   * Checks if a filter value is a range value.
   *
   * @param value - Filter value to check
   * @returns Whether the value is a TypeRangeValue
   */
  static isRangeValue(value: TypeFilterValue): value is TypeRangeValue {
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
  static isDateRangeValue(value: TypeFilterValue): value is TypeDateRangeValue {
    return typeof value === 'object' && value !== null && !Array.isArray(value) && ('start' in value || 'end' in value);
  }

  /**
   * Escapes single quotes in strings for SQL expressions.
   *
   * @param str - String to escape
   * @returns Escaped string
   */
  static escapeString(str: string): string {
    return str.replace(/'/g, "''");
  }

  /**
   * Maps dateStep config values to Day.js duration units.
   *
   * @param dateStep - The step type from attribute config
   * @returns The corresponding Day.js ManipulateType
   */
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  #getDateStepUnit(dateStep: string): ManipulateType {
    const units: Record<string, ManipulateType> = {
      second: 'second',
      minute: 'minute',
      hour: 'hour',
      day: 'day',
      week: 'week',
      month: 'month',
      year: 'year',
    };
    return units[dateStep] ?? 'day';
  }

  // #endregion PRIVATE HELPER METHODS
}
