import { AbstractMapViewerController } from '@/core/controllers/base/abstract-map-viewer-controller';
import {
  addOrUpdateStoreTimeSliderFilter,
  addStoreTimeSliderLayer,
  getStoreTimeSliderLayer,
  isStoreTimeSliderInitialized,
  setStoreTimeSliderFiltering,
  setStoreTimeSliderValues,
  type TypeTimeSliderProps,
  type TypeTimeSliderValues,
} from '@/core/stores/store-interface-and-intial-values/time-slider-state';
import type { MapViewer } from '@/geo/map/map-viewer';
import type { AbstractGVLayer } from '@/geo/layer/gv-layers/abstract-gv-layer';
import { DateMgt, type TimeDimension } from '@/core/utils/date-mgt';
import type { AbstractBaseLayerEntryConfig } from '@/api/config/validation-classes/abstract-base-layer-entry-config';
import { GVWMS } from '@/geo/layer/gv-layers/raster/gv-wms';
import { GVEsriImage } from '@/geo/layer/gv-layers/raster/gv-esri-image';

/**
 * Controller responsible for time slider interactions, keyboard shortcuts, and
 * bridging the time slider state with the UI domain and map projection changes.
 */
export class TimeSliderController extends AbstractMapViewerController {
  /**
   * Creates an instance of TimeSliderController.
   *
   * @param mapViewer - The map viewer instance to associate with this controller
   */
  // GV Leave the constructor here, because we'll likely need it soon to inject dependencies.
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(mapViewer: MapViewer) {
    super(mapViewer);
  }

  // #region OVERRIDES

  // #endregion OVERRIDES

  // #region PUBLIC METHODS

  /**
   * Checks if the layer has time slider values. If there are, adds the time slider layer and applies filters.
   *
   * @param layer - The layer to add to the state
   * @param timesliderConfig - Optional time slider configuration
   */
  checkInitTimeSliderLayerAndApplyFilters(layer: AbstractGVLayer, timesliderConfig?: TypeTimeSliderProps): void {
    // If there is no Time Slider, ignore
    if (!isStoreTimeSliderInitialized(this.getMapId())) return;

    // Get the temporal dimension, if any
    const layerTimeDimension = layer.getTimeDimension();

    // If no temporal dimension or invalid
    if (!layerTimeDimension || !layerTimeDimension.isValid) return; // Skip

    // Get the time slider values
    const timeSliderValues = TimeSliderController.#getInitialTimeSliderValues(layer.getLayerConfig(), layerTimeDimension, timesliderConfig);

    // If any
    if (timeSliderValues) {
      // Add it to the store
      addStoreTimeSliderLayer(this.getMapId(), layer.getLayerPath(), timeSliderValues);

      // Update the filters on the layer in question and potential additional ones
      this.#updateAndApplyTimeFiltersForAll(layer, timeSliderValues, timeSliderValues.filtering, timeSliderValues.values);

      // Make sure tab is visible
      this.getControllersRegistry().uiController.showTabButton('time-slider');
    }
  }

  /**
   * Updates the time slider values for a layer path and re-applies the temporal filters.
   *
   * @param layerPath - The layer path
   * @param values - The new slider values (timestamps in milliseconds)
   */
  updateTimeSliderValues(layerPath: string, values: number[]): void {
    // Get the store values
    const timeSliderValues = getStoreTimeSliderLayer(this.getMapId(), layerPath);
    if (!timeSliderValues) return;

    // Get the corresponding layer
    const layer = this.getControllersRegistry().layerController.getGeoviewLayerRegular(layerPath);

    // Update the filters on the layer in question and potential additional ones
    this.#updateAndApplyTimeFiltersForAll(layer, timeSliderValues, timeSliderValues.filtering, values);
  }

  /**
   * Updates the filtering state for a layer path and re-applies the temporal filters.
   *
   * @param layerPath - The layer path
   * @param filtering - Whether temporal filtering is active
   */
  updateTimeSliderFiltering(layerPath: string, filtering: boolean): void {
    // Get the store values
    const timeSliderValues = getStoreTimeSliderLayer(this.getMapId(), layerPath);
    if (!timeSliderValues) return;

    // Get the corresponding layer
    const layer = this.getControllersRegistry().layerController.getGeoviewLayerRegular(layerPath);

    // Update the filters on the layer in question and potential additional ones
    this.#updateAndApplyTimeFiltersForAll(layer, timeSliderValues, filtering, timeSliderValues.values);
  }

  // #endregion PUBLIC METHODS

  // #region PRIVATE METHODS

  /**
   * Updates and applies temporal filters for the given layer and all its additional linked layers.
   *
   * @param layer - The main GeoView layer
   * @param timeSliderValues - The time slider values for this layer
   * @param filtering - Whether temporal filtering is active
   * @param values - The current slider values (timestamps in milliseconds)
   */
  #updateAndApplyTimeFiltersForAll(
    layer: AbstractGVLayer,
    timeSliderValues: TypeTimeSliderValues,
    filtering: boolean,
    values: number[]
  ): void {
    // Update the filters on the layer in question
    this.#updateAndApplyTimeFiltersForOne(layer, timeSliderValues, timeSliderValues.field, filtering, values);

    // Many layer paths of layers to adjust
    // For each layer paths extra, apply the same filter
    timeSliderValues.additionalLayerpaths?.forEach((additionalLayerPath) => {
      // Get the time slider layer state if exists
      const additionalTimeSliderValues = getStoreTimeSliderLayer(this.getMapId(), additionalLayerPath);

      // If not exist, skip
      if (!additionalTimeSliderValues) return;

      // Get the corresponding additional layer
      const additionalLayer = this.getControllersRegistry().layerController.getGeoviewLayerRegular(additionalLayerPath);

      // Update the filters on the additional layer
      this.#updateAndApplyTimeFiltersForOne(additionalLayer, timeSliderValues, additionalTimeSliderValues.field, filtering, values);
    });
  }

  /**
   * Updates and applies the temporal filter for a single layer.
   *
   * Generates the filter string, stores the filter and values in the store,
   * and applies the filters on the map.
   *
   * @param layer - The GeoView layer to apply the filter on
   * @param timeSliderValues - The time slider values for this layer
   * @param field - The temporal field name to filter on
   * @param filtering - Whether temporal filtering is active
   * @param values - The current slider values (timestamps in milliseconds)
   */
  #updateAndApplyTimeFiltersForOne(
    layer: AbstractGVLayer,
    timeSliderValues: TypeTimeSliderValues,
    field: string,
    filtering: boolean,
    values: number[]
  ): void {
    // Generate the filter string
    const filter = TimeSliderController.#generateFilterString(layer, timeSliderValues, field, filtering, values);

    // ---- Always applied ----
    addOrUpdateStoreTimeSliderFilter(this.getMapId(), layer.getLayerPath(), filter);
    setStoreTimeSliderFiltering(this.getMapId(), layer.getLayerPath(), filtering);
    setStoreTimeSliderValues(this.getMapId(), layer.getLayerPath(), values);

    // Apply filters on the map
    this.getControllersRegistry().layerController.applyLayerFilters(layer.getLayerPath());
  }

  // #endregion PRIVATE METHODS

  // #region DOMAIN HANDLERS
  // GV Eventually, these should be moved to a store adaptor or similar construct that directly connects the domain to the store without going through the controller
  // GV.CONT but for now this allows us to keep domain-store interactions in one place and call application-level processes as needed during migration.

  // #endregion DOMAIN HANDLERS

  // #region STATIC METHODS

  /**
   * Computes the initial time slider values from the layer configuration and temporal dimension metadata.
   *
   * @param layerConfig - The layer entry configuration
   * @param layerTimeDimensionInfo - The temporal dimension information of the layer
   * @param timesliderConfig - Optional time slider configuration from the plugin
   * @returns The computed time slider values, or undefined if no valid temporal dimension is available
   */
  static #getInitialTimeSliderValues(
    layerConfig: AbstractBaseLayerEntryConfig,
    layerTimeDimensionInfo: TimeDimension,
    timesliderConfig?: TypeTimeSliderProps
  ): TypeTimeSliderValues | undefined {
    // If no layerPath, return undefined
    // TODO: CHECK - Can this truly happen, a layerConfig without a layerPath!?
    if (!layerConfig.layerPath) return undefined;

    // Get temporal dimension info from plugin config
    const configTimeDimension = timesliderConfig?.timeDimension;

    // Get index of layerPath, if mutliple exist
    const index =
      timesliderConfig && timesliderConfig.layerPaths.length > 1 ? timesliderConfig.layerPaths.indexOf(layerConfig.layerPath) : undefined;

    // If no temporal dimension information
    if (!layerTimeDimensionInfo.rangeItems && (!configTimeDimension || !configTimeDimension.rangeItems)) return undefined;

    // Set defaults values from temporal dimension
    const { range } = timesliderConfig?.timeDimension?.rangeItems || layerTimeDimensionInfo.rangeItems;

    const defaultDates = configTimeDimension?.default || layerTimeDimensionInfo.default;

    const minAndMax: number[] = [DateMgt.convertToMilliseconds(range[0]), DateMgt.convertToMilliseconds(range[range.length - 1])];
    const singleHandle = configTimeDimension?.singleHandle ?? layerTimeDimensionInfo?.singleHandle ?? false;
    const nearestValues = configTimeDimension?.nearestValues ?? layerTimeDimensionInfo?.nearestValues;

    // Check if the time slider info is associated with another time slider
    const isMainLayerPath = timesliderConfig ? timesliderConfig.layerPaths[0] === layerConfig.layerPath : true;

    // Only use the field from the config if this is the main layer of the slider
    let field = isMainLayerPath && configTimeDimension?.field ? configTimeDimension?.field : layerTimeDimensionInfo.field;

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
   * Generates the filter expression string for temporal filtering on a layer.
   *
   * Handles different layer types (WMS, Esri Image, Dynamic/Vector) with their
   * respective date formatting conventions, and supports single-handle, range,
   * discrete, and absolute slider modes.
   *
   * @param layer - The GeoView layer
   * @param timeSliderValues - The time slider configuration values
   * @param field - The temporal field name
   * @param filtering - Whether filtering is active (returns empty string when false)
   * @param values - The current slider values (timestamps in milliseconds)
   * @returns The filter expression string, or an empty string when filtering is inactive
   */
  static #generateFilterString(
    layer: AbstractGVLayer,
    timeSliderValues: TypeTimeSliderValues,
    field: string,
    filtering: boolean,
    values: number[]
  ): string {
    let filter = '';

    /** Helper function to format dates Esri way */
    const helperEsriDate = (ms: number): string => `date '${DateMgt.formatDateISOShort(ms)}'`;

    // If filtering
    if (filtering) {
      // ---- GVWMS ----
      if (layer instanceof GVWMS) {
        filter = `${field} = ${helperEsriDate(values[0])}`;
      } else if (layer instanceof GVEsriImage) {
        // ---- Esri Image ----
        // Esri Image layers expect the date to be an Epoch timestamp, not an ISO format
        if (values.length > 1) {
          filter = `time=${values[0]},${values[1]}`;
        } else {
          filter = `time=${values[0]}`;
        }
      } else {
        // ---- Other layers (Dynamic / Vector) ----
        // Esri Dynamic and Vector layers expect the date to be in ISO format
        const startDate = helperEsriDate(values[0]);

        // If range mode
        if (values.length > 1) {
          // Range mode (double handle)
          const endDate = helperEsriDate(values[1]);
          filter = `${field} >= ${startDate} and ${field} <= ${endDate}`;
        } else if (timeSliderValues.discreteValues) {
          // Discrete mode (single handle)
          const { range } = timeSliderValues;

          const rangeMs = range.map((entry) => (typeof entry === 'number' ? entry : DateMgt.convertToMilliseconds(entry)));

          const nextIdx = rangeMs.findIndex((entry) => entry > values[0]);

          if (nextIdx !== -1) {
            const nextDate = helperEsriDate(rangeMs[nextIdx]);
            filter = `${field} >= ${startDate} and ${field} < ${nextDate}`;
          } else {
            filter = `${field} >= ${startDate}`;
          }
        } else {
          // Absolute mode (single handle)
          const step = timeSliderValues.step ?? DateMgt.guessEstimatedStep(timeSliderValues.minAndMax[0], timeSliderValues.minAndMax[1]);

          if (step) {
            const endDate = helperEsriDate(values[0] + step);
            filter = `${field} >= ${startDate} and ${field} < ${endDate}`;
          } else {
            filter = `${field} = ${startDate}`;
          }
        }
      }
    }

    // Return the filter
    return filter;
  }

  // #endregion STATIC METHODS
}
