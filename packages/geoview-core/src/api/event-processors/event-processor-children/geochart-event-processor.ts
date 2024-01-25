import { GeoviewStoreType } from '@/core/stores/geoview-store';
import { AbstractEventProcessor } from '../abstract-event-processor';
import { getGeoViewStore } from '@/core/stores/stores-managers';
import { TypeJsonObject } from '@/core/types/global-types';
import { GeoChartStoreByLayerPath } from '@/core/stores/store-interface-and-intial-values/geochart-state';

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
   * Set the default layers from configuration.
   * In the store, the GeoChart configurations are stored in an object with layerPath as its property name
   * (to retrieve the configuration per layer faster).
   *
   * @param {string} mapId the map id
   * @param {TypeJsonObject} charts The array of JSON configuration for geochart
   */
  static setGeochartCharts(mapId: string, charts: TypeJsonObject[]): void {
    // The store object representation
    const chartData: GeoChartStoreByLayerPath = {};

    // Loop on the charts
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    charts.forEach((chartInfo: any) => {
      // For each layer path
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      chartInfo.layers.forEach((layer: any) => {
        // Get the layer path
        const layerPath = layer.layerId;
        chartData[layerPath] = chartInfo;
      });
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
