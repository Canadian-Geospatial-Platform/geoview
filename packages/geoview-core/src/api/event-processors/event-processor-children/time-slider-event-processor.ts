import { AbstractEventProcessor } from '@/api/event-processors/abstract-event-processor';
import { AbstractGeoViewVector } from '@/geo/layer/geoview-layers/vector/abstract-geoview-vector';
import { ITimeSliderState, TypeTimeSliderValues } from '@/core/stores/store-interface-and-intial-values/time-slider-state';
import { getLocalizedValue } from '@/core/utils/utilities';
import { AbstractGeoViewLayer, CONST_LAYER_TYPES } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { EsriDynamic } from '@/geo/layer/geoview-layers/raster/esri-dynamic';
import { WMS } from '@/geo/layer/geoview-layers/raster/wms';
import { TypeFeatureInfoLayerConfig, TypeLayerEntryConfig } from '@/geo/map/map-schema-types';
import { EsriImage } from '@/geo/layer/geoview-layers/raster/esri-image';
import { AppEventProcessor } from './app-event-processor';

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
   * Checks if the layer has time slider values. If there are, adds the time slider layer and applies filters.
   * @param {string} mapId - The map id of the state to act on
   * @param {AbstractGeoViewLayer} geoviewLayer - The GeoView layer to act on
   * @param {TypeLayerEntryConfig} layerConfig - The layer path of the layer to add to the state
   */
  static checkInitTimeSliderLayerAndApplyFilters(
    mapId: string,
    geoviewLayer: AbstractGeoViewLayer,
    layerConfig: TypeLayerEntryConfig
  ): void {
    // If there is no TimeSlider
    if (!this.getTimesliderState(mapId)) return;

    // Get the time slider values
    const timeSliderValues = this.getInitialTimeSliderValues(mapId, geoviewLayer, layerConfig);

    // If any
    if (timeSliderValues) {
      // Add the time slider in store
      this.addTimeSliderLayerAndApplyFilters(mapId, geoviewLayer, layerConfig.layerPath, timeSliderValues);
    }
  }

  /**
   * Adds a time slider layer to the state
   * @param {string} mapId - The map id of the state to act on
   * @param {AbstractGeoViewLayer} geoviewLayer - The GeoView layer to act on
   * @param {string} layerPath - The layer path of the layer to add to the state
   * @param {TypeTimeSliderValues} timeSliderValues - The time slider values to add and apply filters
   */
  static addTimeSliderLayerAndApplyFilters(
    mapId: string,
    geoviewLayer: AbstractGeoViewLayer,
    layerPath: string,
    timeSliderValues: TypeTimeSliderValues
  ): void {
    // If there is no TimeSlider
    if (!this.getTimesliderState(mapId)) return;

    // Create set part (because that's how it works for now)
    const timeSliderLayer = { [layerPath]: timeSliderValues };

    // Add it
    this.getTimesliderState(mapId)?.setterActions.addTimeSliderLayer(timeSliderLayer);

    const { defaultValue, field, filtering, minAndMax, values } = timeSliderLayer[layerPath];
    this.applyFilters(geoviewLayer, layerPath, defaultValue, field, filtering, minAndMax, values);
  }

  /**
   * Removes a time slider layer from the state
   * @param {string} mapId - The map id of the state to act on
   * @param {string} layerPath - The layer path of the layer to remove from the state
   */
  static removeTimeSliderLayer(mapId: string, layerPath: string): void {
    // Redirect
    this.getTimesliderState(mapId)?.setterActions.removeTimeSliderLayer(layerPath);
  }

  /**
   * Get initial values for a layer's time slider states
   *
   * @param {string} mapId - The id of the map
   * @param {AbstractGeoViewLayer} geoviewLayer - The GeoView layer to act on
   * @param {TypeLayerEntryConfig} layerConfig - The layer path of the layer to add to the state
   * @returns {TimeSliderLayer | undefined}
   */
  static getInitialTimeSliderValues(
    mapId: string,
    geoviewLayer: AbstractGeoViewLayer,
    layerConfig: TypeLayerEntryConfig
  ): TypeTimeSliderValues | undefined {
    const name = getLocalizedValue(layerConfig.layerName, AppEventProcessor.getDisplayLanguage(mapId)) || layerConfig.layerId;
    const temporalDimensionInfo = geoviewLayer.getTemporalDimension(layerConfig.layerPath);
    if (!temporalDimensionInfo || !temporalDimensionInfo.range) return undefined;
    const { range } = temporalDimensionInfo.range;
    const defaultValueIsArray = Array.isArray(temporalDimensionInfo.default);
    const defaultValue = defaultValueIsArray ? temporalDimensionInfo.default[0] : temporalDimensionInfo.default;
    const minAndMax: number[] = [new Date(range[0]).getTime(), new Date(range[range.length - 1]).getTime()];
    const { field, singleHandle, nearestValues } = temporalDimensionInfo;

    // If the field type has an alias, use that as a label
    let fieldAlias = field;
    let localizedAliasFields;
    let localizedOutFields;
    const { featureInfo } = layerConfig.source!;
    if (featureInfo) {
      const { aliasFields, outfields } = featureInfo as TypeFeatureInfoLayerConfig;
      localizedOutFields = getLocalizedValue(outfields, AppEventProcessor.getDisplayLanguage(mapId))?.split(',');
      localizedAliasFields = getLocalizedValue(aliasFields, AppEventProcessor.getDisplayLanguage(mapId))?.split(',');
    }
    const fieldIndex = localizedOutFields ? localizedOutFields.indexOf(field) : -1;
    if (fieldIndex !== -1 && localizedAliasFields && localizedOutFields && localizedAliasFields?.length === localizedOutFields?.length)
      fieldAlias = localizedAliasFields![fieldIndex];

    // eslint-disable-next-line no-nested-ternary
    const values = singleHandle
      ? [new Date(temporalDimensionInfo.default).getTime()]
      : defaultValueIsArray
      ? [new Date(temporalDimensionInfo.default[0]).getTime(), new Date(temporalDimensionInfo.default[1]).getTime()]
      : [...minAndMax];

    return {
      name,
      range,
      defaultValue,
      discreteValues: nearestValues === 'discrete',
      minAndMax,
      field,
      fieldAlias,
      singleHandle,
      filtering: true,
      values,
      delay: 1000,
      locked: undefined,
      reversed: undefined,
    };
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
   * @param {AbstractGeoViewLayer} geoviewLayer - The GeoView layer to act on
   * @param {string} layerPath - The path of the layer to filter
   * @param {string} defaultValue - The default value to use if filters are off
   * @param {string} field - The field to filter the layer by
   * @param {boolean} filtering - Whether the layer should be filtered or returned to default
   * @param {number[]} minAndMax - Minimum and maximum values of slider
   * @param {number[]} values - Filter values to apply
   * @returns {void}
   */
  static applyFilters(
    geoviewLayer: AbstractGeoViewLayer,
    layerPath: string,
    defaultValue: string,
    field: string,
    filtering: boolean,
    minAndMax: number[],
    values: number[]
  ): void {
    const layerType = geoviewLayer.type;
    if (layerType === CONST_LAYER_TYPES.WMS) {
      if (filtering) {
        const newValue = `${new Date(values[0]).toISOString().slice(0, new Date(values[0]).toISOString().length - 5)}Z`;
        const filter = `${field}=date '${newValue}'`;
        (geoviewLayer as WMS).applyViewFilter(layerPath, filter);
      } else {
        const filter = `${field}=date '${defaultValue}'`;
        (geoviewLayer as WMS).applyViewFilter(layerPath, filter);
      }
    } else if (layerType === CONST_LAYER_TYPES.ESRI_IMAGE) {
      if (filtering) {
        const filter = `time=${minAndMax[0]},${values[0]}`;
        (geoviewLayer as EsriImage).applyViewFilter(layerPath, filter);
      } else {
        const filter = `time=${minAndMax[0]},${defaultValue}`;
        (geoviewLayer as EsriImage).applyViewFilter(layerPath, filter);
      }
    } else if (filtering) {
      let filter = `${field} >= date '${new Date(values[0]).toISOString()}'`;
      if (values.length > 1) {
        filter += ` and ${field} <= date '${new Date(values[1]).toISOString()}'`;
      }
      (geoviewLayer as AbstractGeoViewVector | EsriDynamic).applyViewFilter(layerPath, filter);
    } else {
      let filter = `${field} >= date '${new Date(minAndMax[0]).toISOString()}'`;
      if (values.length > 1) {
        filter += `and ${field} <= date '${new Date(minAndMax[1]).toISOString()}'`;
      }
      (geoviewLayer as AbstractGeoViewVector | EsriDynamic).applyViewFilter(layerPath, filter);
    }
  }
  // #endregion
}
