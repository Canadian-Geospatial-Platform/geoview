import { AbstractEventProcessor } from '@/api/event-processors/abstract-event-processor';
import type {
  ITimeSliderState,
  TimeSliderLayerSet,
  TypeTimeSliderValues,
  TypeTimeSliderProps,
} from '@/core/stores/store-interface-and-intial-values/time-slider-state';
import type { AbstractBaseLayerEntryConfig } from '@/api/config/validation-classes/abstract-base-layer-entry-config';
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';
import { UIEventProcessor } from '@/api/event-processors/event-processor-children/ui-event-processor';
import { GVWMS } from '@/geo/layer/gv-layers/raster/gv-wms';
import { GVEsriImage } from '@/geo/layer/gv-layers/raster/gv-esri-image';
import { AbstractGVLayer } from '@/geo/layer/gv-layers/abstract-gv-layer';
import { DateMgt, type TimeIANA, type TypeDisplayDateFormat } from '@/core/utils/date-mgt';
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
   * Checks if the Time Slider plugin is iniitialized for the given map.
   * @param {string} mapId - The map id
   * @returns {boolean} True when the Time lider plugin is initialized.
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
   * Shortcut to get the TimeSlider state for a given map id
   * @param {string} mapId - The mapId
   * @returns {ITimeSliderState} The Time Slider state.
   * @throws {PluginStateUninitializedError} When the Time Slider plugin is uninitialized.
   * @static
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
   * Gets time slider layers.
   * @param {string} mapId - The map id of the state to act on
   * @returns {TimeSliderLayerSet} The time slider layer set or undefined
   * @throws {PluginStateUninitializedError} When the Time Slider plugin is uninitialized.
   * @static
   */
  static getTimeSliderLayers(mapId: string): TimeSliderLayerSet {
    return this.getTimeSliderState(mapId).timeSliderLayers;
  }

  /**
   * Gets time slider selected layer path.
   * @param {string} mapId - The map id of the state to act on
   * @returns {string} The selected time slider layer path
   * @throws {PluginStateUninitializedError} When the Time Slider plugin is uninitialized.
   * @static
   */
  static getTimeSliderSelectedLayer(mapId: string): string {
    return this.getTimeSliderState(mapId).selectedLayerPath;
  }

  /**
   * Gets filter(s) for all layers.
   * @param {string} mapId - The map id of the state to act on
   * @returns {string} The time slider filter(s) for the layer
   * @throws {PluginStateUninitializedError} When the Time Slider plugin is uninitialized.
   * @static
   */
  static getTimeSliderFilters(mapId: string): Record<string, string> {
    return this.getTimeSliderState(mapId).sliderFilters;
  }

  /**
   * Gets filter(s) for a specific layer path.
   * @param {string} mapId - The map id of the state to act on
   * @param {string} layerPath - The path of the layer
   * @returns {string} The time slider filter(s) for the layer
   * @throws {PluginStateUninitializedError} When the Time Slider plugin is uninitialized.
   * @static
   */
  static getTimeSliderFilter(mapId: string, layerPath: string): string {
    return this.getTimeSliderFilters(mapId)[layerPath];
  }

  /**
   * Checks if the layer has time slider values. If there are, adds the time slider layer and applies filters.
   * @param {string} mapId - The map id of the state to act on
   * @param {AbstractGVLayer} layer - The layer to add to the state
   * @param {TypeTimeSliderProps?} timesliderConfig - Optional time slider configuration
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

    // Update the filters
    this.updateFilters(mapId, layerPath, field, filtering, minAndMax, values);

    // Make sure tab is visible
    UIEventProcessor.showTabButton(mapId, 'time-slider');
  }

  /**
   * Removes a time slider layer from the state
   * @param {string} mapId - The map id of the state to act on
   * @param {string} layerPath - The layer path of the layer to remove from the state
   * @throws {PluginStateUninitializedError} When the TimeSlider plugin is uninitialized.
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
      UIEventProcessor.hideTabButton(mapId, 'time-slider');
    }
  }

  /**
   * Get initial values for a layer's time slider states
   *
   * @param {string} mapId - The id of the map
   * @param {AbstractBaseLayerEntryConfig} layerConfig - The layer path of the layer to add to the state
   * @returns {TimeSliderLayer | undefined}
   * @throws {LayerNotFoundError} When the layer couldn't be found at the given layer path.
   * @throws {LayerWrongTypeError} When the specified layer is of wrong type.
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

    // Get the temporal dimension information from metadata
    const timeDimensionInfo = geoviewLayer.getTimeDimension();

    // Get temporal dimension info from plugin config
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
    const singleHandle = configTimeDimension?.singleHandle ?? timeDimensionInfo?.singleHandle ?? false;
    const nearestValues = configTimeDimension?.nearestValues ?? timeDimensionInfo?.nearestValues;

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

    // If using absolute axis
    let step: number | undefined;
    if (nearestValues === 'continuous') {
      // Try to guess the steps that should be used
      step = DateMgt.guessEstimatedStep(minAndMax[0], minAndMax[1]);
    }

    return {
      additionalLayerpaths,
      delay: timesliderConfig?.delay || 1000,
      discreteValues: nearestValues === 'discrete',
      description: timesliderConfig?.description,
      displayDateFormat: configTimeDimension?.displayDateFormat,
      displayDateFormatShort: configTimeDimension?.displayDateFormatShort,
      serviceDateTemporalMode: configTimeDimension?.serviceDateTemporalMode,
      displayDateTimezone: configTimeDimension?.displayDateTimezone,
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
   * Sets the selected layer path
   * @param {string} mapId - The map id of the state to act on
   * @param {string} layerPath - The layer path to use
   * @throws {PluginStateUninitializedError} When the TimeSlider plugin is uninitialized.
   * @static
   */
  static setSelectedLayerPath(mapId: string, layerPath: string): void {
    // Redirect
    this.getTimeSliderState(mapId).setterActions.setSelectedLayerPath(layerPath);
  }

  /**
   * Sets the filter for the layer path
   * @param {string} mapId - The map id of the state to act on
   * @param {string} layerPath - The layer path to use
   * @param {string} filter - The filter
   * @throws {PluginStateUninitializedError} When the TimeSlider plugin is uninitialized.
   * @static
   */
  static addOrUpdateSliderFilter(mapId: string, layerPath: string, filter: string): void {
    const curSliderFilters = this.getTimeSliderFilters(mapId);
    this.getTimeSliderState(mapId).setterActions.setSliderFilters({ ...curSliderFilters, [layerPath]: filter });
  }

  /**
   * Updates the display date format for a specific layer in the time slider state.
   * @param mapId - Identifier of the map viewer instance
   * @param layerPath - Path identifying the target layer
   * @param displayDateFormat - Date format configuration to store
   */
  static setDisplayDateFormat(mapId: string, layerPath: string, displayDateFormat: TypeDisplayDateFormat): void {
    this.getTimeSliderState(mapId).setterActions.setDisplayDateFormat(layerPath, displayDateFormat);
  }

  /**
   * Updates the display date format for a specific layer in the time slider state.
   * @param mapId - Identifier of the map viewer instance
   * @param layerPath - Path identifying the target layer
   * @param displayDateFormatShort - Date format configuration to store
   */
  static setDisplayDateFormatShort(mapId: string, layerPath: string, displayDateFormatShort: TypeDisplayDateFormat): void {
    this.getTimeSliderState(mapId).setterActions.setDisplayDateFormatShort(layerPath, displayDateFormatShort);
  }

  /**
   * Updates the display time zone for date rendering of a specific layer
   * in the time slider state.
   * @param mapId - Identifier of the map viewer instance
   * @param layerPath - Path identifying the target layer
   * @param displayDateTimezone - IANA time zone identifier to store
   */
  static setDisplayDateTimezone(mapId: string, layerPath: string, displayDateTimezone: TimeIANA): void {
    this.getTimeSliderState(mapId).setterActions.setDisplayDateTimezone(layerPath, displayDateTimezone);
  }

  // #endregion

  // **********************************************************
  // Static functions for Store Map State to action on API
  // **********************************************************
  // GV NEVER add a store action who does set state AND map action at a same time.
  // GV Review the action in store state to make sure

  // #region

  /**
   * Applies or resets a time-based filter on the specified layer based on the
   * current Time Slider state.
   * The generated filter expression varies depending on the layer type
   * (WMS, ESRI Image, or vector layers) and whether filtering is enabled.
   * Date values are normalized and formatted before being injected into
   * the filter expression.
   * @param {string} mapId - The unique identifier of the map.
   * @param {string} layerPath - The path of the layer to which the filter is applied.
   * @param {string} field - The name of the date/time attribute used for filtering.
   * @param {boolean} filtering - Whether filtering is enabled (`true`) or the layer
   * should be reset to its default (unfiltered) state (`false`).
   * @param {number[]} minAndMax - The minimum and maximum values representing the
   * full temporal extent of the layer (typically epoch milliseconds).
   * @param {number[]} values - The active filter values (typically epoch milliseconds)
   * selected by the time slider.
   * @throws {PluginStateUninitializedError} Thrown when the Time Slider plugin state
   * has not been initialized for the specified map.
   * @static
   */
  static updateFilters(mapId: string, layerPath: string, field: string, filtering: boolean, minAndMax: number[], values: number[]): void {
    let filter = '';

    // If filtering
    if (filtering) {
      // Get the layer
      const geoviewLayer = MapEventProcessor.getMapViewerLayerAPI(mapId).getGeoviewLayer(layerPath);

      // ---- GVWMS ----
      if (geoviewLayer instanceof GVWMS) {
        filter = `${field} = date '${DateMgt.formatDateISOShort(values[0])}'`;
      } else if (geoviewLayer instanceof GVEsriImage) {
        // ---- Esri Image ----
        // Esri Image layers expect the date to be an Epoch timestamp, not an ISO format
        if (values.length > 1) {
          filter = `time=${values[0]},${values[1]}`;
        } else {
          filter = `time=${values[0]}`;
        }
      } else {
        // TODO: CHECK - There's a lot of convertToMilliseconds and formatDateISOShort going on, clean up?
        // ---- Other layers (Dynamic / Vector) ----
        // Esri Dynamic and Vector layers expect the date to be in ISO format
        const timeSliderValues = this.getTimeSliderLayers(mapId)[layerPath];
        const startDate = DateMgt.formatDateISOShort(values[0]);

        if (values.length > 1) {
          // Range mode (two handles)
          filter = `${field} >= date '${startDate}' and ${field} <= date '${DateMgt.formatDateISOShort(values[1])}'`;
        } else if (timeSliderValues.discreteValues) {
          // Discrete mode (single handle)
          const { range } = timeSliderValues;
          const nextIdx = range.findIndex((entry) => DateMgt.convertToMilliseconds(entry) > values[0]);

          if (nextIdx !== -1 && nextIdx < range.length) {
            const nextDate = typeof range[nextIdx] === 'string' ? range[nextIdx] : DateMgt.formatDateISOShort(range[nextIdx]);
            filter = `${field} >= date '${startDate}' and ${field} < date '${nextDate}'`;
          } else {
            filter = `${field} >= date '${startDate}'`;
          }
        } else {
          // Absolute mode (single handle)
          const step = timeSliderValues.step ?? DateMgt.guessEstimatedStep(minAndMax[0], minAndMax[1]);

          if (step) {
            filter = `${field} >= date '${startDate}' and ${field} < date '${DateMgt.formatDateISOShort(values[0] + step)}'`;
          } else {
            filter = `${field} = date '${startDate}'`;
          }
        }
      }
    }

    // ---- Always applied ----
    this.getTimeSliderState(mapId).setterActions.setFiltering(layerPath, filtering);
    this.getTimeSliderState(mapId).setterActions.setValues(layerPath, values);
    this.addOrUpdateSliderFilter(mapId, layerPath, filter);
    MapEventProcessor.applyLayerFilters(mapId, layerPath);
  }

  // #endregion
}
