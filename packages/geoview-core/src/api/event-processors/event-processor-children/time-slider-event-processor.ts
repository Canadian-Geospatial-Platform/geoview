import { AbstractEventProcessor } from '@/api/event-processors/abstract-event-processor';
import {
  ITimeSliderState,
  TimeSliderLayerSet,
  TypeTimeSliderValues,
  TypeTimeSliderProps,
} from '@/core/stores/store-interface-and-intial-values/time-slider-state';
import { WMS } from '@/geo/layer/geoview-layers/raster/wms';
import { AbstractBaseLayerEntryConfig } from '@/api/config/validation-classes/abstract-base-layer-entry-config';
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';
import { UIEventProcessor } from '@/api/event-processors/event-processor-children/ui-event-processor';
import { AppEventProcessor } from '@/api/event-processors/event-processor-children/app-event-processor';
import { GVWMS } from '@/geo/layer/gv-layers/raster/gv-wms';
import { GVEsriImage } from '@/geo/layer/gv-layers/raster/gv-esri-image';
import { AbstractGVLayer } from '@/geo/layer/gv-layers/abstract-gv-layer';
import { DateMgt } from '@/core/utils/date-mgt';
import { logger } from '@/core/utils/logger';
import { LayerNotFoundError, LayerWrongTypeError } from '@/core/exceptions/layer-exceptions';
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
    this.updateFilters(mapId, layerPath, field, filtering, minAndMax, values);

    // Make sure tab is visible
    UIEventProcessor.showTab(mapId, 'time-slider');
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
      UIEventProcessor.hideTab(mapId, 'time-slider');
    }
  }

  /**
   * Get initial values for a layer's time slider states
   *
   * @param {string} mapId - The id of the map
   * @param {AbstractBaseLayerEntryConfig} layerConfig - The layer path of the layer to add to the state
   * @returns {TimeSliderLayer | undefined}
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

    // If not found
    if (!geoviewLayer) throw new LayerNotFoundError(layerConfig.layerPath);

    // If not of right type
    if (!(geoviewLayer instanceof AbstractGVLayer)) throw new LayerWrongTypeError(layerConfig.layerPath, layerConfig.getLayerNameCascade());

    // Get the temporal dimension information
    const timeDimensionInfo = geoviewLayer.getTimeDimension();

    // Get temporal dimension info from config, if there is any
    const configTimeDimension = timesliderConfig?.timeDimension;

    // If no temporal dimension information
    if ((!timeDimensionInfo || !timeDimensionInfo.rangeItems) && (!configTimeDimension || !configTimeDimension.rangeItems))
      return undefined;

    // Set defaults values from temporal dimension
    const { range } = timesliderConfig?.timeDimension?.rangeItems || timeDimensionInfo!.rangeItems;

    const defaultDates = configTimeDimension?.default || timeDimensionInfo!.default;

    const minAndMax: number[] = [DateMgt.convertToMilliseconds(range[0]), DateMgt.convertToMilliseconds(range[range.length - 1])];
    const field = configTimeDimension?.field || timeDimensionInfo!.field;
    const singleHandle = configTimeDimension?.singleHandle || timeDimensionInfo!.singleHandle;
    const nearestValues = configTimeDimension?.nearestValues || timeDimensionInfo!.nearestValues;
    const displayPattern = configTimeDimension?.displayPattern || timeDimensionInfo!.displayPattern;

    // If the field type has an alias, use that as a label
    let fieldAlias = field;
    const featureInfo = layerConfig.source?.featureInfo;
    if (featureInfo) {
      const { outfields } = featureInfo;
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
      range,
      discreteValues: nearestValues === 'discrete',
      step,
      minAndMax,
      field,
      fieldAlias,
      singleHandle,
      filtering: timesliderConfig?.filtering !== false,
      values,
      delay: timesliderConfig?.delay || 1000,
      locked: timesliderConfig?.locked,
      reversed: timesliderConfig?.reversed,
      displayPattern,
    };
  }

  /**
   * Guesses the estimated steps that should be used by the slider, depending on the value range
   * @param {number} minValue - The minimum value
   * @param {number} maxValue - The maximum value
   * @returns The estimated stepping value based on the min and max values
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

  // #endregion

  // **********************************************************
  // Static functions for Store Map State to action on API
  // **********************************************************
  // GV NEVER add a store action who does set state AND map action at a same time.
  // GV Review the action in store state to make sure

  // #region
  /**
   * Filter the layer provided in the layerPath variable according to current states (filtering and values)
   *
   * @param {string} mapId - The id of the map
   * @param {string} layerPath - The path of the layer to filter
   * @param {string} field - The field to filter the layer by
   * @param {boolean} filtering - Whether the layer should be filtered or returned to default
   * @param {number[]} minAndMax - Minimum and maximum values of slider
   * @param {number[]} values - Filter values to apply
   * @returns {void}
   * @throws {PluginStateUninitializedError} When the TimeSlider plugin is uninitialized.
   * @static
   */
  static updateFilters(mapId: string, layerPath: string, field: string, filtering: boolean, minAndMax: number[], values: number[]): void {
    // Get the layer using the map event processor
    const geoviewLayer = MapEventProcessor.getMapViewerLayerAPI(mapId).getGeoviewLayer(layerPath);

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

    // If we aren't showing unsymbolized features, then we need to update the feature info layer set
    // so the data table matches the features from the time slider filter
    if (!AppEventProcessor.getShowUnsymbolizedFeatures(mapId)) {
      MapEventProcessor.getMapViewerLayerAPI(mapId)
        .allFeatureInfoLayerSet.queryLayer(layerPath, 'all')
        .catch((error) => logger.logError(error));
    }
  }
  // #endregion
}
