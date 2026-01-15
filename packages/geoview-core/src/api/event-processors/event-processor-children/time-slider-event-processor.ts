import { AbstractEventProcessor } from '@/api/event-processors/abstract-event-processor';
import type {
  ITimeSliderState,
  TimeSliderLayerSet,
  TypeTimeSliderValues,
  TypeTimeSliderProps,
} from '@/core/stores/store-interface-and-intial-values/time-slider-state';
import { WMS } from '@/geo/layer/geoview-layers/raster/wms';
import type { AbstractBaseLayerEntryConfig } from '@/api/config/validation-classes/abstract-base-layer-entry-config';
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';
import { UIEventProcessor } from '@/api/event-processors/event-processor-children/ui-event-processor';
import { GVWMS } from '@/geo/layer/gv-layers/raster/gv-wms';
import { GVEsriImage } from '@/geo/layer/gv-layers/raster/gv-esri-image';
import { AbstractGVLayer } from '@/geo/layer/gv-layers/abstract-gv-layer';
import { DateMgt } from '@/core/utils/date-mgt';
import { LayerWrongTypeError } from '@/core/exceptions/layer-exceptions';
import { PluginStateUninitializedError } from '@/core/exceptions/geoview-exceptions';

// GV Important: See notes in header of MapEventProcessor file for information on the paradigm to apply when working with UIEventProcessor vs UIState

export class TimeSliderEventProcessor extends AbstractEventProcessor {
  // **********************************************************
  // Static functions for Typescript files to access store actions
  // **********************************************************
  // GV Typescript MUST always use the defined store actions below to modify store - NEVER use setState!
  // GV Some action does state modifications AND map actions.
  // GV ALWAYS use map event processor when an action modify store and IS NOT trap by map state event handler

  // #region

  /**
   * Checks whether the Time Slider plugin is initialized and available for the specified map.
   * Attempts to retrieve the time slider state and returns true if successful, false if uninitialized.
   * Use this before calling other Time Slider methods to avoid PluginStateUninitializedError.
   * @param {string} mapId - The map identifier
   * @return {boolean} True when the Time Slider plugin is initialized and ready, false otherwise
   * @static
   */
  static isTimeSliderInitialized(mapId: string): boolean {
    try {
      // Get its state, this will throw PluginStateUninitializedError if uninitialized
      this.getTimeSliderState(mapId);
      return true;
    } catch {
      // Uninitialized
      return false;
    }
  }

  /**
   * Retrieves the time slider state slice from the store for the specified map.
   * Provides access to time slider layers, selected layer, filters, and temporal values.
   * Only available when the Time Slider plugin is active for the map.
   * @param {string} mapId - The map identifier
   * @return {ITimeSliderState} The time slider state slice
   * @throws {PluginStateUninitializedError} When the Time Slider plugin is not initialized for this map
   * @static
   * @protected
   */
  protected static getTimeSliderState(mapId: string): ITimeSliderState {
    // Get the time slider state
    const { timeSliderState } = super.getState(mapId);

    // If not found
    if (!timeSliderState) throw new PluginStateUninitializedError('TimeSlider', mapId);

    // Return it
    return timeSliderState;
  }

  /**
   * Retrieves the complete time slider layer set containing all layers with temporal dimensions.
   * Returns an object mapping layer paths to their time slider configurations and values.
   * @param {string} mapId - The map identifier
   * @return {TimeSliderLayerSet} Object containing all time slider layer configurations
   * @throws {PluginStateUninitializedError} When the Time Slider plugin is not initialized for this map
   * @static
   */
  static getTimeSliderLayers(mapId: string): TimeSliderLayerSet {
    return this.getTimeSliderState(mapId).timeSliderLayers;
  }

  /**
   * Retrieves the layer path of the currently selected time slider layer.
   * Returns the active layer whose temporal controls are displayed in the time slider UI.
   * @param {string} mapId - The map identifier
   * @return {string} The layer path of the selected time slider layer
   * @throws {PluginStateUninitializedError} When the Time Slider plugin is not initialized for this map
   * @static
   */
  static getTimeSliderSelectedLayer(mapId: string): string {
    return this.getTimeSliderState(mapId).selectedLayerPath;
  }

  /**
   * Retrieves all time slider filters for all layers.
   * Returns an object mapping layer paths to their current temporal filter strings.
   * @param {string} mapId - The map identifier
   * @return {Record<string, string>} Object with layer paths as keys and filter strings as values
   * @throws {PluginStateUninitializedError} When the Time Slider plugin is not initialized for this map
   * @static
   */
  static getTimeSliderFilters(mapId: string): Record<string, string> {
    return this.getTimeSliderState(mapId).sliderFilters;
  }

  /**
   * Retrieves the temporal filter string for a specific layer.
   * Returns the current time-based filter expression applied to the layer.
   * @param {string} mapId - The map identifier
   * @param {string} layerPath - The unique path identifying the layer
   * @return {string} The temporal filter string for the specified layer
   * @throws {PluginStateUninitializedError} When the Time Slider plugin is not initialized for this map
   * @static
   */
  static getTimeSliderFilter(mapId: string, layerPath: string): string {
    return this.getTimeSliderFilters(mapId)[layerPath];
  }

  /**
   * Checks if the layer has time slider values. If there are, adds the time slider layer and applies filters.
   * @param {string} mapId - The map id of the state to act on
   * @param {AbstractGVLayer} layer - The layer to add to the state
   * @param {TypeTimeSliderProps} [timesliderConfig] - Optional time slider configuration
   * @static
   */
  static checkInitTimeSliderLayerAndApplyFilters(mapId: string, layer: AbstractGVLayer, timesliderConfig?: TypeTimeSliderProps): void {
    // If there is no Time Slider, ignore
    if (!this.isTimeSliderInitialized(mapId)) return;

    // Get the temporal dimension, if any
    const tempDimension = layer.getTimeDimension();

    // If no temporal dimension or invalid
    if (!tempDimension || !tempDimension.isValid) return; // Skip

    // Get the time slider values
    const timeSliderValues = this.getInitialTimeSliderValues(mapId, layer.getLayerConfig(), timesliderConfig);

    // If any
    if (timeSliderValues) {
      // Add the time slider in store
      this.#addTimeSliderLayerAndApplyFilters(mapId, layer.getLayerPath(), timeSliderValues);
    }
  }

  /**
   * Adds a time slider layer to the state
   * @param {string} mapId - The map id of the state to act on
   * @param {string} layerPath - The layer path of the layer to add to the state
   * @param {TypeTimeSliderValues} timeSliderValues - The time slider values to add and apply filters
   * @throws {PluginStateUninitializedError} When the Time Slider plugin is uninitialized.
   * @static
   */
  static #addTimeSliderLayerAndApplyFilters(mapId: string, layerPath: string, timeSliderValues: TypeTimeSliderValues): void {
    // Get the timeslider state which is only initialized if the TimeSlider Plugin exists.
    const timeSliderState = this.getTimeSliderState(mapId);

    // Create set part (because that's how it works for now)
    const timeSliderLayer = { [layerPath]: timeSliderValues };

    // Add it
    timeSliderState.setterActions.addTimeSliderLayer(timeSliderLayer);

    const { field, filtering, minAndMax, values } = timeSliderLayer[layerPath];
    this.updateFilters(mapId, layerPath, field, filtering, minAndMax, values);

    // Make sure tab is visible
    UIEventProcessor.showTab(mapId, 'time-slider');
  }

  /**
   * Removes a layer from the time slider state.
   * Removes the layer's time slider configuration and hides the time slider tab if no layers remain.
   * @param {string} mapId - The map identifier
   * @param {string} layerPath - The unique path identifying the layer to remove
   * @return {void}
   * @throws {PluginStateUninitializedError} When the Time Slider plugin is not initialized for this map
   * @static
   */
  static removeTimeSliderLayer(mapId: string, layerPath: string): void {
    // Get the timeslider state which is only initialized if the TimeSlider Plugin exists.
    const timeSliderState = this.getTimeSliderState(mapId);

    // Redirect
    timeSliderState.setterActions.removeTimeSliderLayer(layerPath);

    // If there are no more layers with time dimension
    if (!Object.keys(timeSliderState.timeSliderLayers).length) {
      // Hide tab
      UIEventProcessor.hideTab(mapId, 'time-slider');
    }
  }

  /**
   * Generates initial time slider configuration values for a layer.
   * Combines layer metadata with optional config overrides to create time slider settings.
   * Determines temporal field, range, step size, and default values.
   * @param {string} mapId - The map identifier
   * @param {AbstractBaseLayerEntryConfig} layerConfig - The layer configuration containing temporal metadata
   * @param {TypeTimeSliderProps} timesliderConfig - Optional configuration overrides from map config
   * @return {TypeTimeSliderValues | undefined} Time slider configuration object, or undefined if layer has no temporal data
   * @throws {LayerNotFoundError} When the layer couldn't be found at the layer path in config
   * @throws {LayerWrongTypeError} When the specified layer is not a GV Layer type
   * @static
   */
  static getInitialTimeSliderValues(
    mapId: string,
    layerConfig: AbstractBaseLayerEntryConfig,
    timesliderConfig?: TypeTimeSliderProps
  ): TypeTimeSliderValues | undefined {
    // Get the layer using the map event processor, If no temporal dimension OR layerPath, return undefined
    if (!layerConfig.layerPath) return undefined;

    // Cast the layer
    const geoviewLayer = MapEventProcessor.getMapViewerLayerAPI(mapId).getGeoviewLayer(layerConfig.layerPath);

    // If not of right type
    if (!(geoviewLayer instanceof AbstractGVLayer)) throw new LayerWrongTypeError(layerConfig.layerPath, layerConfig.getLayerNameCascade());

    // Get the temporal dimension information
    const timeDimensionInfo = geoviewLayer.getTimeDimension();

    // Get temporal dimension info from config, if there is any
    const configTimeDimension = timesliderConfig?.timeDimension;

    // Get index of layerPath, if mutliple exist
    const index =
      timesliderConfig && timesliderConfig.layerPaths.length > 1 ? timesliderConfig.layerPaths.indexOf(layerConfig.layerPath) : undefined;

    // If no temporal dimension information
    if ((!timeDimensionInfo || !timeDimensionInfo.rangeItems) && (!configTimeDimension || !configTimeDimension.rangeItems))
      return undefined;

    // Set defaults values from temporal dimension
    const { range } = timesliderConfig?.timeDimension?.rangeItems || timeDimensionInfo!.rangeItems;

    const defaultDates = configTimeDimension?.default || timeDimensionInfo!.default;

    const minAndMax: number[] = [DateMgt.convertToMilliseconds(range[0]), DateMgt.convertToMilliseconds(range[range.length - 1])];
    const singleHandle = configTimeDimension?.singleHandle || timeDimensionInfo!.singleHandle;
    const nearestValues = configTimeDimension?.nearestValues || timeDimensionInfo!.nearestValues;
    const displayPattern = configTimeDimension?.displayPattern || timeDimensionInfo!.displayPattern;

    // Check if the time slider info is associated with another time slider
    const isMainLayerPath = timesliderConfig ? timesliderConfig.layerPaths[0] === layerConfig.layerPath : true;

    // Only use the field from the config if this is the main layer of the slider
    let field = isMainLayerPath && configTimeDimension?.field ? configTimeDimension?.field : timeDimensionInfo!.field;

    // Use fields from config if they are provided
    if (timesliderConfig?.fields && index) field = timesliderConfig.fields[index];

    // Paths of layers tied to this time slider, if any
    const additionalLayerpaths =
      isMainLayerPath && timesliderConfig && timesliderConfig.layerPaths.length > 1 ? timesliderConfig.layerPaths.slice(1) : undefined;

    // If the field type has an alias, use that as a label
    let fieldAlias = field;
    const outfields = layerConfig.getOutfields();
    if (outfields) {
      const timeOutfield = outfields ? outfields.find((outfield) => outfield.name === field) : undefined;
      if (timeOutfield) fieldAlias = timeOutfield.alias;
    }

    const values = defaultDates.map((date) => DateMgt.convertToMilliseconds(date));

    // If using discrete axis
    let step: number | undefined;
    if (nearestValues === 'discrete') {
      // Try to guess the steps that should be used
      step = TimeSliderEventProcessor.guessEstimatedStep(minAndMax[0], minAndMax[1]);
    }

    return {
      additionalLayerpaths,
      delay: timesliderConfig?.delay || 1000,
      discreteValues: nearestValues === 'discrete',
      description: timesliderConfig?.description,
      displayPattern,
      field,
      fieldAlias,
      filtering: timesliderConfig?.filtering !== false,
      isMainLayerPath,
      locked: timesliderConfig?.locked,
      minAndMax,
      range,
      reversed: timesliderConfig?.reversed,
      singleHandle,
      step,
      title: timesliderConfig?.title,
      values,
    };
  }

  /**
   * Calculates an appropriate step interval for the time slider based on the temporal range.
   * Analyzes the difference between min and max values to determine if daily, monthly, or yearly steps are appropriate.
   * Returns undefined for ranges less than 2 months (continuous slider).
   * @param {number} minValue - The minimum temporal value in milliseconds
   * @param {number} maxValue - The maximum temporal value in milliseconds
   * @return {number | undefined} The estimated step size in milliseconds, or undefined for continuous ranges
   * @static
   */
  static guessEstimatedStep(minValue: number, maxValue: number): number | undefined {
    const day1 = 86400000; // 24h x 60m x 60s x 1000ms = 86,400,000ms in a day
    const month1 = day1 * 30; // 2,592,000,000ms in 1 month
    const year1 = day1 * 365; // 31,536,000,000ms in 1 year
    const years2 = year1 * 2; // 63,072,000,000ms in 2 years
    const years10 = year1 * 10; // 63,072,000,000ms in 2 years
    const months2 = month1 * 2; // 315,360,000,000 in 10 years
    const intervalDiff = maxValue - minValue;

    let step: number | undefined;
    if (intervalDiff > months2) step = day1; // Daily stepping
    if (intervalDiff > years2) step = month1; // Monthly stepping
    if (intervalDiff > years10) step = year1; // Yearly stepping
    return step;
  }

  /**
   * Sets which layer is currently selected and active in the time slider UI.
   * The selected layer's temporal controls are displayed and can be adjusted by the user.
   * @param {string} mapId - The map identifier
   * @param {string} layerPath - The unique path identifying the layer to select
   * @return {void}
   * @throws {PluginStateUninitializedError} When the Time Slider plugin is not initialized for this map
   * @static
   */
  static setSelectedLayerPath(mapId: string, layerPath: string): void {
    // Redirect
    this.getTimeSliderState(mapId).setterActions.setSelectedLayerPath(layerPath);
  }

  /**
   * Adds or updates the temporal filter string for a layer.
   * Stores the filter expression that will be applied to filter layer features by time.
   * @param {string} mapId - The map identifier
   * @param {string} layerPath - The unique path identifying the layer
   * @param {string} filter - The temporal filter expression to store
   * @return {void}
   * @throws {PluginStateUninitializedError} When the Time Slider plugin is not initialized for this map
   * @static
   */
  static addOrUpdateSliderFilter(mapId: string, layerPath: string, filter: string): void {
    const curSliderFilters = this.getTimeSliderFilters(mapId);
    this.getTimeSliderState(mapId).setterActions.setSliderFilters({ ...curSliderFilters, [layerPath]: filter });
  }

  // #endregion

  // **********************************************************
  // Static functions for Store Map State to action on API
  // **********************************************************
  // GV NEVER add a store action who does set state AND map action at a same time.
  // GV Review the action in store state to make sure

  // #region
  /**
   * Updates and applies temporal filters for a layer based on time slider state.
   * Constructs appropriate filter strings for different layer types (WMS, EsriImage, vector).
   * Updates the store with new filter values and triggers map filtering to show/hide features.
   * @param {string} mapId - The map identifier
   * @param {string} layerPath - The unique path identifying the layer to filter
   * @param {string} field - The temporal field name to filter on
   * @param {boolean} filtering - Whether filtering is active or should revert to full temporal range
   * @param {number[]} minAndMax - Array containing min and max temporal values in milliseconds [min, max]
   * @param {number[]} values - Current slider values in milliseconds (1 or 2 values for single/range)
   * @return {void}
   * @throws {PluginStateUninitializedError} When the Time Slider plugin is not initialized for this map
   * @static
   */
  static updateFilters(mapId: string, layerPath: string, field: string, filtering: boolean, minAndMax: number[], values: number[]): void {
    // Get the layer using the map event processor
    const geoviewLayer = MapEventProcessor.getMapViewerLayerAPI(mapId).getGeoviewLayerIfExists(layerPath);

    let filter: string;
    if (geoviewLayer instanceof WMS || geoviewLayer instanceof GVWMS) {
      if (filtering) {
        const newValue = DateMgt.formatDateToISO(values[0]);
        if (newValue !== 'Invalid DateZ') filter = `${field}=date '${newValue}'`;
        else filter = '';
      } else {
        filter = `${field}=date '${DateMgt.formatDateToISO(minAndMax[0])}'`;
      }
    } else if (geoviewLayer instanceof GVEsriImage) {
      if (filtering) {
        filter = `time=${minAndMax[0]},${DateMgt.formatDateToISO(values[0])}`;
      } else {
        filter = `time=${minAndMax[0]},${DateMgt.formatDateToISO(minAndMax[1])}`;
      }
    } else if (filtering) {
      filter = `${field} >= date '${DateMgt.formatDateToISO(values[0])}'`;
      if (values.length > 1) {
        filter += ` and ${field} <= date '${DateMgt.formatDateToISO(values[1])}'`;
      }
    } else {
      filter = `${field} >= date '${DateMgt.formatDateToISO(minAndMax[0])}'`;
      if (values.length > 1) {
        filter += `and ${field} <= date '${DateMgt.formatDateToISO(minAndMax[1])}'`;
      }
    }

    this.getTimeSliderState(mapId).setterActions.setFiltering(layerPath, filtering);
    this.getTimeSliderState(mapId).setterActions.setValues(layerPath, values);
    this.addOrUpdateSliderFilter(mapId, layerPath, filter);

    MapEventProcessor.applyLayerFilters(mapId, layerPath);
  }
  // #endregion
}
