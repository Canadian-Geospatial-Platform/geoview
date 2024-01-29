import { GeoviewStoreType } from '@/core/stores/geoview-store';
import {
  AbstractGeoViewVector,
  EsriDynamic,
  ITimeSliderState,
  TypeFeatureInfoLayerConfig,
  TypeTimeSliderValues,
  WMS,
  api,
  getLocalizedValue,
} from '@/app';

import { AbstractEventProcessor } from '../abstract-event-processor';

export class TimeSliderEventProcessor extends AbstractEventProcessor {
  /**
   * Override the initialization process to wire subscriptions and return them so they can be destroyed later.
   */
  protected onInitialize(store: GeoviewStoreType) {
    const { mapId } = store.getState();

    api.event.once(
      api.eventNames.MAP.EVENT_MAP_LOADED,
      () => {
        const orderedLayers = store.getState().mapState.layerOrder;
        const initialTimeSliderLayerPaths = TimeSliderEventProcessor.filterTimeSliderLayers(mapId, orderedLayers);
        if (initialTimeSliderLayerPaths) {
          initialTimeSliderLayerPaths.forEach((layerPath) => {
            const timeSliderLayer = TimeSliderEventProcessor.getInitialTimeSliderValues(mapId, layerPath);
            store.getState().timeSliderState.actions.addTimeSliderLayer(timeSliderLayer);
          });
        }
        const { visibleLayers } = store.getState().mapState;
        const initialVisibleLayers = TimeSliderEventProcessor.filterTimeSliderLayers(mapId, visibleLayers);
        store.getState().timeSliderState.actions.setVisibleTimeSliderLayers(initialVisibleLayers);
      },
      mapId
    );

    // Checks for added and removed layers with time dimension
    const unsubLayerOrder = store.subscribe(
      (state) => state.mapState.layerOrder,
      (cur, prev) => {
        const newTimeSliderLayerPaths = TimeSliderEventProcessor.filterTimeSliderLayers(mapId, cur);
        const oldTimeSliderLayerPaths = TimeSliderEventProcessor.filterTimeSliderLayers(mapId, prev);
        const addedLayers = newTimeSliderLayerPaths.filter((layerPath) => !oldTimeSliderLayerPaths.includes(layerPath));
        const removedLayers = oldTimeSliderLayerPaths.filter((layerPath) => !newTimeSliderLayerPaths.includes(layerPath));
        if (addedLayers.length) {
          addedLayers.forEach((layerPath) => {
            const timeSliderLayer = TimeSliderEventProcessor.getInitialTimeSliderValues(mapId, layerPath);
            store.getState().timeSliderState.actions.addTimeSliderLayer(timeSliderLayer);
          });
        }
        if (removedLayers.length)
          removedLayers.forEach((layerPath) => store.getState().timeSliderState.actions.removeTimeSliderLayer(layerPath));
      }
    );

    const unsubVisibleLayers = store.subscribe(
      (state) => state.mapState.visibleLayers,
      (cur) => {
        const visibleLayers = TimeSliderEventProcessor.filterTimeSliderLayers(mapId, cur);
        const prevVisibleTimeLayers = [...store.getState().timeSliderState.visibleTimeSliderLayers];
        if (JSON.stringify(prevVisibleTimeLayers) !== JSON.stringify(visibleLayers))
          store.getState().timeSliderState.actions.setVisibleTimeSliderLayers(visibleLayers);
      }
    );

    // Return the array of subscriptions so they can be destroyed later
    return [unsubLayerOrder, unsubVisibleLayers];
  }

  // **********************************************************
  // Static functions for Typescript files to access store actions
  // **********************************************************
  //! Typescript MUST always use the defined store actions below to modify store - NEVER use setState!
  //! Some action does state modifications AND map actions.
  //! ALWAYS use map event processor when an action modify store and IS NOT trap by map state event handler

  // #region
  /**
   * Shortcut to get the TimeSlider state for a given map id
   * @param {string} mapId The mapId
   * @returns {ITimeSliderState | undefined} The Time Slider state. Forcing the return to also be 'undefined', because
   *                                         there will be no timeSliderState if the TimeSlider plugin isn't active.
   *                                         This helps the developers making sure the existence is checked.
   */
  public static getTimesliderState(mapId: string): ITimeSliderState | undefined {
    // Return the time slider state
    return super.getState(mapId).timeSliderState;
  }

  /**
   * Filter array of legend layers to get usable time slider layer paths
   *
   * @param {string} mapId The id of the map
   * @param {TypeLegendLayer[]} legendLayers Array of legend layers to filter
   * @returns {string[]} A list of usable layer paths
   */
  private static filterTimeSliderLayers(mapId: string, layerPaths: string[]): string[] {
    const filteredLayerPaths = layerPaths.filter(
      (layerPath) => api.maps[mapId].layer.geoviewLayers[layerPath.split('/')[0]].layerTemporalDimension[layerPath]
    );
    return filteredLayerPaths;
  }

  /**
   * Get initial values for a layer's time slider states
   *
   * @param {string} mapId The id of the map
   * @param {string} layerPath The path of the layer to add to time slider
   * @returns {{ [index: string]: TypeTimeSliderValues }}
   */
  static getInitialTimeSliderValues(mapId: string, layerPath: string): { [index: string]: TypeTimeSliderValues } {
    const name = getLocalizedValue(api.maps[mapId].layer.geoviewLayers[layerPath.split('/')[0]].geoviewLayerName, mapId) || layerPath;
    const temporalDimensionInfo = api.maps[mapId].layer.geoviewLayer(layerPath).getTemporalDimension();
    const { range } = temporalDimensionInfo.range;
    const defaultValue = temporalDimensionInfo.default;
    const minAndMax: number[] = [new Date(range[0]).getTime(), new Date(range[range.length - 1]).getTime()];
    const { field, singleHandle } = temporalDimensionInfo;
    // If the field type has an alias, use that as a label
    let fieldAlias = field;
    const { featureInfo } = api.maps[mapId].layer.registeredLayers[layerPath].source!;
    const { aliasFields, outfields } = featureInfo as TypeFeatureInfoLayerConfig;
    const localizedOutFields = getLocalizedValue(outfields, mapId)?.split(',');
    const localizedAliasFields = getLocalizedValue(aliasFields, mapId)?.split(',');
    const fieldIndex = localizedOutFields ? localizedOutFields.indexOf(field) : -1;
    if (fieldIndex !== -1 && localizedAliasFields?.length === localizedOutFields?.length) fieldAlias = localizedAliasFields![fieldIndex];

    const values = singleHandle ? [new Date(temporalDimensionInfo.default).getTime()] : [...minAndMax];
    const sliderData: { [index: string]: TypeTimeSliderValues } = {
      [layerPath]: {
        name,
        range,
        defaultValue,
        minAndMax,
        field,
        fieldAlias,
        singleHandle,
        filtering: true,
        values,
        delay: 1000,
        locked: undefined,
        reversed: undefined,
      },
    };
    return sliderData;
  }
  // #endregion

  // **********************************************************
  // Static functions for Store Map State to action on API
  // **********************************************************
  //! NEVER add a store action who does set state AND map action at a same time.
  //! Review the action in store state to make sure

  // #region
  /**
   * Filter the layer provided in the layerPath variable according to current states (filtering and values)
   *
   * @param {string} mapId The map to filter
   * @param {string} layerPath The path of the layer to filter
   * @param {string} defaultValue The default value to use if filters are off
   * @param {string} field The field to filter the layer by
   * @param {boolean} filtering Whether the layer should be filtered or returned to default
   * @param {number[]} minAndMax Minimum and maximum values of slider
   * @param {number[]} values Filter values to apply
   * @returns {void}
   */
  static applyFilters(
    mapId: string,
    layerPath: string,
    defaultValue: string,
    field: string,
    filtering: boolean,
    minAndMax: number[],
    values: number[]
  ): void {
    const layerType = api.maps[mapId].layer.geoviewLayer(layerPath).type;
    if (layerType === 'ogcWms') {
      if (filtering) {
        const newValue = `${new Date(values[0]).toISOString().slice(0, new Date(values[0]).toISOString().length - 5)}Z`;
        const filter = `${field}=date '${newValue}'`;
        (api.maps[mapId].layer.geoviewLayer(layerPath) as WMS).applyViewFilter(filter);
      } else {
        const filter = `${field}=date '${defaultValue}'`;
        (api.maps[mapId].layer.geoviewLayer(layerPath) as WMS).applyViewFilter(filter);
      }
    } else if (filtering) {
      let filter = `${field} >= date '${new Date(values[0]).toISOString()}'`;
      if (values.length > 1) {
        filter += ` and ${field} <= date '${new Date(values[1]).toISOString()}'`;
      }
      (api.maps[mapId].layer.geoviewLayer(layerPath) as AbstractGeoViewVector | EsriDynamic).applyViewFilter(filter);
    } else {
      let filter = `${field} >= date '${new Date(minAndMax[0]).toISOString()}'`;
      if (values.length > 1) {
        filter += `and ${field} <= date '${new Date(minAndMax[1]).toISOString()}'`;
      }
      (api.maps[mapId].layer.geoviewLayer(layerPath) as AbstractGeoViewVector | EsriDynamic).applyViewFilter(filter);
    }
  }
  // #endregion
}
