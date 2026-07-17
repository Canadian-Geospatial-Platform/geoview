import type { MapViewer } from '@/geo/map/map-viewer';
import { AbstractMapViewerController } from '@/core/controllers/base/abstract-map-viewer-controller';
import type { ControllerRegistry } from '@/core/controllers/base/controller-registry';
import { type TypeFilterValue, type TypeFilterState, type TypeRangeValue, type TypeDateRangeValue, type TypeFilterAttribute } from '@/core/stores/states/filter-panel-state';
/**
 * Controller responsible for filter panel interactions and bridging
 * the filter state with the layer filtering system.
 *
 * This controller manages filter state in the store and applies filter
 * expressions to layers using GeoView's LayerFilters system.
 */
export declare class FilterPanelController extends AbstractMapViewerController {
    #private;
    /**
     * Creates an instance of FilterPanelController.
     *
     * @param mapViewer - The map viewer instance to associate with this controller
     * @param controllerRegistry - The controller registry for accessing sibling controllers
     */
    constructor(mapViewer: MapViewer, controllerRegistry: ControllerRegistry);
    /**
     * Sets the complete filter state for all layers.
     *
     * @param filterState - The new filter state
     */
    setFilterState(filterState: TypeFilterState): void;
    /**
     * Updates a filter value for a specific layer and field.
     *
     * @param layerPath - The layer path
     * @param fieldName - The field name
     * @param value - The filter value
     */
    updateLayerFieldFilter(layerPath: string, fieldName: string, value: TypeFilterValue): void;
    /**
     * Initializes empty filter state for a layer.
     *
     * @param layerPath - The layer path
     */
    initializeLayerFilterState(layerPath: string): void;
    /**
     * Checks if a layer is ready to have filters applied.
     *
     * @param layerPath - The layer path
     * @returns True if the layer is in a 'processed' or 'loaded' state
     */
    isLayerReady(layerPath: string): boolean;
    /**
     * Builds a SQL-like filter expression for a layer based on its current filter state.
     *
     * Includes both domain base filters (for attributes with filterMissingDomainValues)
     * and user selection filters.
     *
     * @param layerPath - The layer path
     * @returns SQL-like filter expression, or undefined if no filters active
     */
    buildFilterExpression(layerPath: string): string | undefined;
    /**
     * Applies filters to a specific layer.
     *
     * Builds the filter expression from the current filter state and applies it
     * to the layer. Only applies if the layer is ready and exists.
     *
     * @param layerPath - The layer path
     * @throws {LayerFilterPanelQueryError} If the layer is not found or an error occurs during application
     */
    applyLayerFilter(layerPath: string): void;
    /**
     * Applies filters to all configured layers that are ready.
     *
     * Skips layers that are not yet loaded.
     */
    applyAllFilters(): void;
    /**
     * Clears filters for a specific layer.
     *
     * Resets the filter state and removes the panel filter from the layer's filter system.
     *
     * @param layerPath - The layer path
     * @throws {LayerFilterPanelClearError} If the layer is not found or an error occurs during clearing
     */
    clearLayerFilters(layerPath: string): void;
    /**
     * Clears all filters for all layers.
     */
    clearAllFilters(): void;
    /**
     * Checks if a layer has any active filters.
     *
     * @param layerPath - The layer path
     * @returns Whether the layer has active filters
     */
    hasActiveFilters(layerPath: string): boolean;
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
    ensureLayerQueried(layerPath: string): Promise<void>;
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
    getLayerFieldUniqueValues(layerPath: string, attribute: TypeFilterAttribute): (string | number)[];
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
    processDomainForUniqueValues(uniqueValues: (string | number)[], attribute: TypeFilterAttribute): (string | number)[];
    /**
     * Gets the display label for a value using the attribute's domain mapping.
     *
     * @param attribute - The attribute configuration
     * @param value - The raw value from the layer
     * @returns The display label from the domain, or the stringified value if no domain match
     */
    getDisplayLabel(attribute: TypeFilterAttribute, value: string | number): string;
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
    ensureLayerFeaturesQueried(): Promise<void>;
    /**
     * Computes timestamp bounds from unique date values.
     *
     * Parses date values (strings or epoch numbers) using DateMgt and returns
     * the min/max timestamps along with formatted display dates.
     *
     * @param uniqueValues - Array of date values from layer features
     * @returns Object with min/max timestamps and formatted display dates, or null if no valid dates
     */
    getDateBounds(uniqueValues: (string | number)[]): {
        min: number;
        max: number;
        minDate: string;
        maxDate: string;
    } | null;
    /**
     * Formats a timestamp value for display in the UI.
     *
     * Uses DateMgt to format timestamps consistently across the application.
     *
     * @param timestamp - Milliseconds since epoch
     * @returns Formatted date string (e.g., "Jan 15, 2020")
     */
    formatDateForDisplay(timestamp: number): string;
    /**
     * Converts a timestamp to a YYYY-MM-DD date string for filter expressions.
     *
     * Uses DateMgt to ensure consistent date formatting in SQL filter strings.
     *
     * @param timestamp - Milliseconds since epoch
     * @returns Date string in YYYY-MM-DD format
     */
    formatDateForFilter(timestamp: number): string;
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
    applyDateStep(timestamp: number, dateStep: string, direction: 1 | -1): number;
    /**
     * Checks if a filter value is a range value.
     *
     * @param value - Filter value to check
     * @returns Whether the value is a TypeRangeValue
     */
    static isRangeValue(value: TypeFilterValue): value is TypeRangeValue;
    /**
     * Checks if a filter value is a date range value.
     *
     * @param value - Filter value to check
     * @returns Whether the value is a TypeDateRangeValue
     */
    static isDateRangeValue(value: TypeFilterValue): value is TypeDateRangeValue;
    /**
     * Escapes single quotes in strings for SQL expressions.
     *
     * @param str - String to escape
     * @returns Escaped string
     */
    static escapeString(str: string): string;
}
//# sourceMappingURL=filter-panel-controller.d.ts.map