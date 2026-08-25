import { AbstractMapViewerController } from '@/core/controllers/base/abstract-map-viewer-controller';
import type { ControllerRegistry } from '@/core/controllers/base/controller-registry';
import {
  addStoreTimeSliderLayer,
  getStoreTimeSliderLayer,
  isStoreTimeSliderInitialized,
  setStoreTimeSliderDelay,
  setStoreTimeSliderDisplayDateFormat,
  setStoreTimeSliderDisplayDateFormatShort,
  setStoreTimeSliderDisplayDateTimezone,
  setStoreTimeSliderFiltering,
  setStoreTimeSliderLocked,
  setStoreTimeSliderReversed,
  setStoreTimeSliderSelectedLayerPath,
  setStoreTimeSliderStep,
  setStoreTimeSliderValues,
  type TypeTimeSliderProps,
  type TypeTimeSliderValues,
} from '@/core/stores/states/time-slider-state';
import { logger } from '@/core/utils/logger';
import type { MapViewer } from '@/geo/map/map-viewer';
import type { AbstractGVLayer } from '@/geo/layer/gv-layers/abstract-gv-layer';
import { DateMgt, type TimeDimension, type TypeDisplayDateFormat } from '@/core/utils/date-mgt';
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
   * @param controllerRegistry - The controller registry for accessing sibling controllers
   */
  // GV Leave the constructor here, because we'll likely need it soon to inject dependencies.
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(mapViewer: MapViewer, controllerRegistry: ControllerRegistry) {
    super(mapViewer, controllerRegistry);
  }

  // #region OVERRIDES

  // #endregion OVERRIDES

  // #region PUBLIC METHODS

  /**
   * Sets the selected layer path in the time-slider panel.
   *
   * @param layerPath - The layer path to select
   */
  setSelectedLayerPathTimeSlider(layerPath: string): void {
    // Save in the store
    setStoreTimeSliderSelectedLayerPath(this.getMapId(), layerPath);
  }

  /**
   * Checks if the layer has time slider values. If there are, adds the time slider layer and applies filters.
   *
   * @param layer - The layer to add to the state
   * @param timesliderConfig - Optional time slider configuration
   */
  checkInitTimeSliderLayerAndApplyFilters(layer: AbstractGVLayer, timesliderConfig?: TypeTimeSliderProps): void {
    // If there is no Time Slider, ignore
    if (!isStoreTimeSliderInitialized(this.getMapId())) return;

    // Try to get the temporal dimension from the layer's metadata
    let layerTimeDimension = layer.getTimeDimension();

    // If the config provides a timeDimension, overlay it on the metadata-derived one except for the field property
    if (timesliderConfig?.timeDimension) {
      layerTimeDimension = {
        ...layerTimeDimension,
        ...timesliderConfig.timeDimension,
        field: layerTimeDimension?.field ?? timesliderConfig.timeDimension.field,
        isValid: !!(timesliderConfig.timeDimension.rangeItems ?? layerTimeDimension?.rangeItems)?.range?.length,
      };

      // The field property is overridden if it actually exists in the outfields
      const fieldAsConfigured = timesliderConfig?.timeDimension.field;
      if (fieldAsConfigured) {
        const outfields = layer.getLayerConfig().getOutfields();
        if (outfields && outfields.some((outfield) => outfield.name === fieldAsConfigured)) {
          layerTimeDimension.field = fieldAsConfigured;
        }
      }
    }

    // If still no temporal dimension or invalid
    if (!layerTimeDimension || !layerTimeDimension.isValid) return; // Skip

    // Get the time slider values
    const timeSliderValues = TimeSliderController.#getInitialTimeSliderValues(layer.getLayerConfig(), layerTimeDimension, timesliderConfig);

    // If any
    if (timeSliderValues) {
      // Save in the store
      addStoreTimeSliderLayer(this.getMapId(), layer.getLayerPath(), timeSliderValues);

      // Update the filters on the layer in question and potential additional ones
      this.#updateAndApplyTimeFiltersForAll(layer, timeSliderValues, timeSliderValues.filtering, timeSliderValues.values);

      // Save in the store
      setStoreTimeSliderFiltering(this.getMapId(), layer.getLayerPath(), timeSliderValues.filtering);
      setStoreTimeSliderValues(this.getMapId(), layer.getLayerPath(), timeSliderValues.values);

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

    // Save in the store
    setStoreTimeSliderValues(this.getMapId(), layer.getLayerPath(), values);
  }

  /**
   * Resets the time slider values for a layer path to their registration defaults.
   *
   * @param layerPath - The layer path
   */
  resetValues(layerPath: string): void {
    const timeSliderValues = getStoreTimeSliderLayer(this.getMapId(), layerPath);
    if (!timeSliderValues) return;

    this.updateTimeSliderValues(layerPath, [...timeSliderValues.defaultValues]);
  }

  /**
   * Constrains dual-handle values to keep one valid increment between the handles.
   *
   * @param layerPath - The layer path
   * @param values - The proposed slider values
   * @param activeThumb - The index of the thumb being moved
   * @returns The constrained slider values
   */
  constrainValues(layerPath: string, values: number[], activeThumb: number): number[] {
    const timeSliderValues = getStoreTimeSliderLayer(this.getMapId(), layerPath);
    if (!timeSliderValues) return values;

    const timeStampRange = timeSliderValues.range.map((date) => DateMgt.convertToMilliseconds(date));
    return TimeSliderController.#constrainValues(
      values,
      activeThumb,
      timeSliderValues.discreteValues,
      timeStampRange,
      timeSliderValues.step,
      timeSliderValues.minAndMax
    );
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

    // Save in the store
    setStoreTimeSliderFiltering(this.getMapId(), layer.getLayerPath(), filtering);
  }

  /**
   * Sets the step value for a layer path in the time-slider panel.
   *
   * @param layerPath - The layer path
   * @param step - The step value
   */
  setStep(layerPath: string, step: number): void {
    // Save in the store
    setStoreTimeSliderStep(this.getMapId(), layerPath, step);
  }

  /**
   * Sets the delay value for a layer path in the time-slider panel.
   *
   * @param layerPath - The layer path
   * @param delay - The delay value
   */
  setDelay(layerPath: string, delay: number): void {
    // Save in the store
    setStoreTimeSliderDelay(this.getMapId(), layerPath, delay);
  }

  /**
   * Sets the locked state for a layer path in the time-slider panel.
   *
   * @param layerPath - The layer path
   * @param locked - The locked state
   */
  setLocked(layerPath: string, locked: boolean): void {
    // Save in the store
    setStoreTimeSliderLocked(this.getMapId(), layerPath, locked);
  }

  /**
   * Sets the reversed state for a layer path in the time-slider panel.
   *
   * @param layerPath - The layer path
   * @param reversed - The reversed state
   */
  setReversed(layerPath: string, reversed: boolean): void {
    // Save in the store
    setStoreTimeSliderReversed(this.getMapId(), layerPath, reversed);
  }

  /**
   * Sets the display date format for a layer path in the time-slider panel.
   *
   * @param layerPath - The layer path
   * @param displayDateFormat - The display date format
   */
  setDisplayDateFormat(layerPath: string, displayDateFormat: TypeDisplayDateFormat): void {
    // Save in the store
    setStoreTimeSliderDisplayDateFormat(this.getMapId(), layerPath, displayDateFormat);
  }

  /**
   * Sets the short display date format for a layer path in the time-slider panel.
   *
   * @param layerPath - The layer path
   * @param displayDateFormat - The short display date format
   */
  setDisplayDateFormatShort(layerPath: string, displayDateFormat: TypeDisplayDateFormat): void {
    // Save in the store
    setStoreTimeSliderDisplayDateFormatShort(this.getMapId(), layerPath, displayDateFormat);
  }

  /**
   * Sets the display date timezone for a layer path in the time-slider panel.
   *
   * @param layerPath - The layer path
   * @param displayDateTimezone - The display date timezone
   */
  setDisplayDateTimezone(layerPath: string, displayDateTimezone: string): void {
    // Save in the store
    setStoreTimeSliderDisplayDateTimezone(this.getMapId(), layerPath, displayDateTimezone);
  }

  /**
   * Attempts to register a layer with the time slider if it has a temporal dimension and time slider values.
   *
   * @param layer - The layer to attempt registration for
   */
  tryRegisterLayer(layer: AbstractGVLayer): void {
    try {
      // Get time slider config if present in map config (read from mapFeaturesConfig, not store, because GeoCore merges at runtime)
      const timeSliderConfigs = this.getMapViewer().mapFeaturesConfig.corePackagesConfig?.find((config) =>
        Object.keys(config).includes('time-slider')
      )?.['time-slider'] as Record<'sliders', TypeTimeSliderProps[]>;

      const layerSliderConfig = timeSliderConfigs?.sliders?.find((slider: TypeTimeSliderProps) =>
        slider.layerPaths.includes(layer.getLayerPath())
      );

      // Only register the layer when there is a VCS config for it or the layer has a time dimension from metadata.
      // The timeSliderController?. optional chaining ensures no registration happens when time-slider is not
      // in the footer bar (the controller is only created when the plugin is configured).
      if (layerSliderConfig || (layer.getIsTimeAware() && layer.getTimeDimension())) {
        // Check (if dimension is valid) and add time slider layer when needed
        this.getControllersRegistry().timeSliderController?.checkInitTimeSliderLayerAndApplyFilters(layer, layerSliderConfig);
      }
    } catch (error: unknown) {
      // Log error
      logger.logError(error);
      // Layer failed to load, abandon it for the TimeSlider registration, too bad.
      // Here, we haven't even made it to a possible layer registration for a possible Time Slider, because we couldn't even get the layer to load anyways.
    }
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
    TimeSliderController.#updateAndApplyTimeFiltersForOne(layer, timeSliderValues, timeSliderValues.field, filtering, values);

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
      TimeSliderController.#updateAndApplyTimeFiltersForOne(
        additionalLayer,
        timeSliderValues,
        additionalTimeSliderValues.field,
        filtering,
        values
      );
    });
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
    // Get temporal dimension info from plugin config
    const configTimeDimension = timesliderConfig?.timeDimension;

    // Get index of layerPath, if mutliple exist
    const index =
      timesliderConfig && timesliderConfig.layerPaths.length > 1 ? timesliderConfig.layerPaths.indexOf(layerConfig.layerPath) : undefined;

    // If no temporal dimension information
    if (!layerTimeDimensionInfo.rangeItems && (!configTimeDimension || !configTimeDimension.rangeItems)) return undefined;

    // Set defaults values from temporal dimension
    const { range } = timesliderConfig?.timeDimension?.rangeItems || layerTimeDimensionInfo.rangeItems;

    const minAndMax: number[] = [DateMgt.convertToMilliseconds(range[0]), DateMgt.convertToMilliseconds(range[range.length - 1])];
    const singleHandle = configTimeDimension?.singleHandle ?? layerTimeDimensionInfo?.singleHandle ?? false;
    const defaultDates = configTimeDimension?.default?.length ? configTimeDimension.default : layerTimeDimensionInfo.default;
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

    // If using absolute axis
    let step: number | undefined;
    if (nearestValues === 'continuous') {
      // Try to guess the steps that should be used
      step = DateMgt.guessEstimatedStep(minAndMax[0], minAndMax[1]);
    }

    const timeStampRange = range.map((date) => DateMgt.convertToMilliseconds(date));
    let initialValues = singleHandle ? [minAndMax[1]] : [...minAndMax];
    if (defaultDates?.length) initialValues = defaultDates.map((date) => DateMgt.convertToMilliseconds(date));
    const values = TimeSliderController.#constrainValues(initialValues, 1, nearestValues === 'discrete', timeStampRange, step, minAndMax);

    return {
      additionalLayerpaths,
      delay: timesliderConfig?.delay || 1000,
      defaultValues: [...values],
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
   * Constrains dual-handle values according to the slider mode and selected step.
   *
   * Absolute dual-handle sliders use the selected step as their minimum separation.
   * For discrete sliders, the active thumb is moved to the nearest available timestamp
   * on its valid side of the other thumb. A range with fewer than two distinct timestamps
   * cannot be separated and is returned unchanged.
   *
   * @param values - The proposed slider values
   * @param activeThumb - The index of the thumb being moved
   * @param discreteValues - Whether the slider uses discrete values
   * @param timeStampRange - The available timestamps for a discrete slider
   * @param step - Optional minimum separation for an absolute slider
   * @param minAndMax - The minimum and maximum slider values
   * @returns The constrained slider values
   */
  static #constrainValues(
    values: number[],
    activeThumb: number,
    discreteValues: boolean,
    timeStampRange: number[],
    step?: number,
    minAndMax?: number[]
  ): number[] {
    // Single-handle sliders and incomplete ranges do not require separation.
    if (values.length !== 2) return values;

    // Absolute sliders use the selected or estimated step to keep dual handles separable.
    if (!discreteValues) {
      const minimumDistance = step ?? (minAndMax ? (minAndMax[1] - minAndMax[0]) / 20 : 0);
      if (minimumDistance <= 0 || values[1] - values[0] >= minimumDistance) return values;
      if (activeThumb === 0) return [Math.max(values[1] - minimumDistance, minAndMax?.[0] ?? Number.NEGATIVE_INFINITY), values[1]];
      return [values[0], Math.min(values[0] + minimumDistance, minAndMax?.[1] ?? Number.POSITIVE_INFINITY)];
    }

    // Preserve already ordered discrete values.
    if (values[0] < values[1]) return values;

    // Remove duplicate timestamps before finding an adjacent value.
    const distinctTimeStampRange = [...new Set(timeStampRange)].sort((first, second) => first - second);
    if (distinctTimeStampRange.length < 2) return values;

    if (activeThumb === 0) {
      // Move the left thumb to the closest timestamp below the right thumb.
      const previousValue = distinctTimeStampRange.findLast((timeStamp) => timeStamp < values[1]);
      if (previousValue !== undefined) return [previousValue, values[1]];
      return [distinctTimeStampRange[0], distinctTimeStampRange[1]];
    }

    // Move the right thumb to the closest timestamp above the left thumb.
    const nextValue = distinctTimeStampRange.find((timeStamp) => timeStamp > values[0]);
    if (nextValue !== undefined) return [values[0], nextValue];
    return [distinctTimeStampRange[distinctTimeStampRange.length - 2], distinctTimeStampRange[distinctTimeStampRange.length - 1]];
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
  static #updateAndApplyTimeFiltersForOne(
    layer: AbstractGVLayer,
    timeSliderValues: TypeTimeSliderValues,
    field: string,
    filtering: boolean,
    values: number[]
  ): void {
    // Generate the filter string
    const filter = this.#generateFilterString(layer, timeSliderValues, field, filtering, values);

    // Set the filter on time on the layer
    layer.setLayerFiltersTime(filter);
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

    // Helper function to format dates Esri way
    const helperEsriDate = (ms: number): string => `date '${DateMgt.formatDateISOShort(ms)}'`;

    // If filtering
    if (filtering) {
      // ---- GVWMS ----
      if (layer instanceof GVWMS) {
        if (values.length > 1) {
          filter = `${field} = ${helperEsriDate(values[0])}/${helperEsriDate(values[1])}`;
        } else {
          filter = `${field} = ${helperEsriDate(values[0])}`;
        }
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
