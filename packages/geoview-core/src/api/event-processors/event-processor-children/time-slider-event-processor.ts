import { AbstractEventProcessor } from '@/api/event-processors/abstract-event-processor';
import {
  ITimeSliderState,
  TimeSliderLayerSet,
  TypeTimeSliderValues,
} from '@/core/stores/store-interface-and-intial-values/time-slider-state';
import { WMS } from '@/geo/layer/geoview-layers/raster/wms';
import { TypeFeatureInfoLayerConfig, TypeLayerEntryConfig, layerEntryIsGroupLayer } from '@/api/config/types/map-schema-types';
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';
import { UIEventProcessor } from '@/api/event-processors/event-processor-children/ui-event-processor';
import { AppEventProcessor } from '@/api/event-processors/event-processor-children/app-event-processor';
import { GVWMS } from '@/geo/layer/gv-layers/raster/gv-wms';
import { GVEsriImage } from '@/geo/layer/gv-layers/raster/gv-esri-image';
import { AbstractGVLayer } from '@/geo/layer/gv-layers/abstract-gv-layer';
import { DateMgt } from '@/core/utils/date-mgt';
import { logger } from '@/core/utils/logger';

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
   * Shortcut to get the TimeSlider state for a given map id
   * @param {string} mapId - The mapId
   * @returns {ITimeSliderState | undefined} The Time Slider state. Forcing the return to also be 'undefined', because
   *                                         there will be no timeSliderState if the TimeSlider plugin isn't active.
   *                                         This helps the developers making sure the existence is checked.
   */
  protected static getTimesliderState(mapId: string): ITimeSliderState | undefined {
    // Return the time slider state
    return super.getState(mapId).timeSliderState;
  }

  /**
   * Gets time slider layers.
   * @param {string} mapId - The map id of the state to act on
   * @returns {TimeSliderLayerSet | undefined} The time slider layer set or undefined
   */
  static getTimeSliderLayers(mapId: string): TimeSliderLayerSet | undefined {
    return this.getTimesliderState(mapId)?.timeSliderLayers;
  }

  /**
   * Gets time slider selected layer path.
   * @param {string} mapId - The map id of the state to act on
   * @returns {string} The selected time slider layer path or undefined
   */
  static getTimeSliderSelectedLayer(mapId: string): string | undefined {
    return this.getTimesliderState(mapId)?.selectedLayerPath;
  }

  /**
   * Gets filter(s) for a layer.
   * @param {string} mapId - The map id of the state to act on
   * @param {string} layerPath - The path of the layer
   * @returns {string | undefined} The time slider filter(s) for the layer
   */
  static getTimeSliderFilter(mapId: string, layerPath: string): string | undefined {
    return this.getTimesliderState(mapId)?.sliderFilters[layerPath];
  }

  /**
   * Checks if the layer has time slider values. If there are, adds the time slider layer and applies filters.
   * @param {string} mapId - The map id of the state to act on
   * @param {TypeLayerEntryConfig} layerConfig - The layer path of the layer to add to the state
   */
  static checkInitTimeSliderLayerAndApplyFilters(mapId: string, layer: AbstractGVLayer, layerConfig: TypeLayerEntryConfig): void {
    // If there is no TimeSlider
    if (!this.getTimesliderState(mapId)) return;

    // Get the temporal dimension, if any
    const tempDimension = layer.getTemporalDimension();

    // If not temporal dimension or invalid
    if (!tempDimension || !tempDimension.isValid) return; // Skip

    // Get the time slider values
    const timeSliderValues = this.getInitialTimeSliderValues(mapId, layerConfig);

    // If any
    if (timeSliderValues) {
      // Add the time slider in store
      this.#addTimeSliderLayerAndApplyFilters(mapId, layerConfig.layerPath, timeSliderValues);
    }
  }

  /**
   * Adds a time slider layer to the state
   * @param {string} mapId - The map id of the state to act on
   * @param {string} layerPath - The layer path of the layer to add to the state
   * @param {TypeTimeSliderValues} timeSliderValues - The time slider values to add and apply filters
   */
  static #addTimeSliderLayerAndApplyFilters(mapId: string, layerPath: string, timeSliderValues: TypeTimeSliderValues): void {
    // If there is no TimeSlider
    if (!this.getTimesliderState(mapId)) return;

    // Create set part (because that's how it works for now)
    const timeSliderLayer = { [layerPath]: timeSliderValues };

    // Add it
    this.getTimesliderState(mapId)?.setterActions.addTimeSliderLayer(timeSliderLayer);

    const { defaultValue, field, filtering, minAndMax, values } = timeSliderLayer[layerPath];
    this.updateFilters(mapId, layerPath, defaultValue, field, filtering, minAndMax, values);

    // Make sure tab is visible
    UIEventProcessor.showTab(mapId, 'time-slider');
  }

  /**
   * Removes a time slider layer from the state
   * @param {string} mapId - The map id of the state to act on
   * @param {string} layerPath - The layer path of the layer to remove from the state
   */
  static removeTimeSliderLayer(mapId: string, layerPath: string): void {
    // Redirect
    this.getTimesliderState(mapId)?.setterActions.removeTimeSliderLayer(layerPath);

    // If there are no layers with time dimension, hide tab
    if (!this.getTimesliderState(mapId) || !Object.keys(this.getTimesliderState(mapId)!.timeSliderLayers).length)
      UIEventProcessor.hideTab(mapId, 'time-slider');
  }

  /**
   * Get initial values for a layer's time slider states
   *
   * @param {string} mapId - The id of the map
   * @param {TypeLayerEntryConfig} layerConfig - The layer path of the layer to add to the state
   * @returns {TimeSliderLayer | undefined}
   */
  static getInitialTimeSliderValues(mapId: string, layerConfig: TypeLayerEntryConfig): TypeTimeSliderValues | undefined {
    // Get the layer using the map event processor, If no temporal dimension OR layerPath, return undefined
    if (!layerConfig.layerPath) return undefined;
    const geoviewLayer = MapEventProcessor.getMapViewerLayerAPI(mapId).getGeoviewLayer(layerConfig.layerPath)!;

    // If a group
    if (layerEntryIsGroupLayer(layerConfig)) return undefined;

    // Cast the layer
    const geoviewLayerCasted = geoviewLayer as AbstractGVLayer;

    // Get the temporal dimension information
    const temporalDimensionInfo = geoviewLayerCasted.getTemporalDimension();

    // If no temporal dimension information
    if (!temporalDimensionInfo || !temporalDimensionInfo.range) return undefined;

    // Set defaults values from temporal dimension
    const { range } = temporalDimensionInfo.range;
    const defaultValueIsArray = Array.isArray(temporalDimensionInfo.default);
    const defaultValue = defaultValueIsArray ? temporalDimensionInfo.default[0] : temporalDimensionInfo.default;
    const minAndMax: number[] = [DateMgt.convertToMilliseconds(range[0]), DateMgt.convertToMilliseconds(range[range.length - 1])];
    const { field, singleHandle, nearestValues, displayPattern } = temporalDimensionInfo;

    // If the field type has an alias, use that as a label
    let fieldAlias = field;
    const { featureInfo } = layerConfig.source!;
    if (featureInfo) {
      const { outfields } = featureInfo as TypeFeatureInfoLayerConfig;
      const timeOutfield = outfields ? outfields.find((outfield) => outfield.name === field) : undefined;
      if (timeOutfield) fieldAlias = timeOutfield.alias;
    }

    // eslint-disable-next-line no-nested-ternary
    const values = singleHandle
      ? [DateMgt.convertToMilliseconds(temporalDimensionInfo.default)]
      : defaultValueIsArray
        ? [DateMgt.convertToMilliseconds(temporalDimensionInfo.default[0]), DateMgt.convertToMilliseconds(temporalDimensionInfo.default[1])]
        : [...minAndMax];

    // If using discrete axis
    let step: number | undefined;
    if (nearestValues === 'discrete') {
      // Try to guess the steps that should be used
      step = TimeSliderEventProcessor.guessEstimatedStep(minAndMax[0], minAndMax[1]);
    }

    return {
      range,
      defaultValue,
      discreteValues: nearestValues === 'discrete',
      step,
      minAndMax,
      field,
      fieldAlias,
      singleHandle,
      filtering: true,
      values,
      delay: 1000,
      locked: undefined,
      reversed: undefined,
      displayPattern,
    };
  }

  /**
   * Guesses the estimated steps that should be used by the slider, depending on the value range
   * @param {number} minValue - The minimum value
   * @param {number} maxValue - The maximum value
   * @returns The estimated stepping value based on the min and max values
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
   */
  static setSelectedLayerPath(mapId: string, layerPath: string): void {
    // Redirect
    this.getTimesliderState(mapId)?.setterActions.setSelectedLayerPath(layerPath);
  }

  /**
   * Sets the filter for the layer path
   * @param {string} mapId - The map id of the state to act on
   * @param {string} layerPath - The layer path to use
   * @param {string} filter - The filter
   */
  static addOrUpdateSliderFilter(mapId: string, layerPath: string, filter: string): void {
    const curSliderFilters = this.getTimesliderState(mapId)?.sliderFilters;
    this.getTimesliderState(mapId)?.setterActions.setSliderFilters({ ...curSliderFilters, [layerPath]: filter });
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
   * @param {string} defaultValue - The default value to use if filters are off
   * @param {string} field - The field to filter the layer by
   * @param {boolean} filtering - Whether the layer should be filtered or returned to default
   * @param {number[]} minAndMax - Minimum and maximum values of slider
   * @param {number[]} values - Filter values to apply
   * @returns {void}
   */
  static updateFilters(
    mapId: string,
    layerPath: string,
    defaultValue: string,
    field: string,
    filtering: boolean,
    minAndMax: number[],
    values: number[]
  ): void {
    // Get the layer using the map event processor
    const geoviewLayer = MapEventProcessor.getMapViewerLayerAPI(mapId).getGeoviewLayer(layerPath)!;

    let filter: string;
    if (geoviewLayer instanceof WMS || geoviewLayer instanceof GVWMS) {
      if (filtering) {
        const newValue = DateMgt.formatDateToISO(values[0]);
        if (newValue !== 'Invalid DateZ') filter = `${field}=date '${newValue}'`;
        else filter = '';
      } else {
        filter = `${field}=date '${defaultValue}'`;
      }
    } else if (geoviewLayer instanceof GVEsriImage) {
      if (filtering) {
        filter = `time=${minAndMax[0]},${values[0]}`;
      } else {
        filter = `time=${minAndMax[0]},${defaultValue}`;
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

    this.getTimesliderState(mapId)?.setterActions.setFiltering(layerPath, filtering);
    this.getTimesliderState(mapId)?.setterActions.setValues(layerPath, values);
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
