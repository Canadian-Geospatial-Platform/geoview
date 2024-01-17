import { GeoviewStoreType } from '@/core/stores/geoview-store';
import { AbstractEventProcessor } from '../abstract-event-processor';
import { getGeoViewStore } from '@/core/stores/stores-managers';
import { TypeJsonObject } from '@/core/types/global-types';
import { api } from '@/app';
import { getLocalizedValue } from '@/core/utils/utilities';

export class GeochartEventProcessor extends AbstractEventProcessor {
  onInitialize(store: GeoviewStoreType) {
    store.getState();

    // add to arr of subscriptions so it can be destroyed later
    this.subscriptionArr.push();
  }

  // **********************************************************
  // Static functions for Typescript files to access store actions
  // **********************************************************
  //! Typescript MUST always use store action to modify store - NEVER use setState!
  //! Some action does state modifications AND map actions.
  //! ALWAYS use map event processor when an action modify store and IS NOT trap by map state event handler
  // #region
  /**
   * Set the default layers from congiuration.
   *
   * @param {string} mapId the map id
   * @param {TypeJsonObject} charts The array of JSON configuration for geochart
   */
  static setGeochartCharts(mapId: string, charts: TypeJsonObject[]): void {
    // add layerPath at the the root to retreive config faster
    const chartData: { [index: string]: TypeJsonObject } = {};
    charts.forEach((chart: TypeJsonObject) => {
      // get layer path
      const layerPath = chart.layers[0].layerId as string;

      const currLayer = api.maps[mapId].layer.registeredLayers[layerPath];
      const layerData = {
        name: getLocalizedValue(currLayer.layerName, mapId),
        tooltip: getLocalizedValue(currLayer.layerName, mapId),
        layerPath,
        layerFeatures: '0 - to be set by chart',
        numOffeatures: 0,
      };
      // eslint-disable-next-line no-param-reassign
      chart.layerData = layerData;

      chartData[layerPath] = chart;
    });

    // set store charts config
    getGeoViewStore(mapId).getState().geochartState.actions.setGeochartCharts(chartData);
  }
  // #endregion

  // **********************************************************
  // Static functions for Store Map State to action on API
  // **********************************************************
  //! NEVER add a store action who does set state AND map action at a same time.
  //! Review the action in store state to make sure
}
