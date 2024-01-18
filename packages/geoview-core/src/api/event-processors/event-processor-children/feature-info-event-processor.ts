import { isEqual } from 'lodash';
import { AbstractEventProcessor } from '../abstract-event-processor';
import { TypeFeatureInfoResultSets, EventType, TypeLayerData, TypeArrayOfLayerData } from '@/api/events/payloads/get-feature-info-payload';
import { getGeoViewStore } from '@/core/stores/stores-managers';

export class FeatureInfoEventProcessor extends AbstractEventProcessor {
  // **********************************************************
  // Static functions for Typescript files to access store actions
  // **********************************************************
  //! Typescript MUST always use store action to modify store - NEVER use setState!
  //! Some action does state modifications AND map actions.
  //! ALWAYS use map event processor when an action modify store and IS NOT trap by map state event handler
  // #region
  /**
   * Static methode used to propagate feature info layer sets to the store..
   *
   * @param {string} mapId The map identifier of the resul set modified.
   * @param {string} layerPath The layer path that has changed.
   * @param {EventType} eventType The event type that triggered the layer set update.
   * @param {TypeFeatureInfoResultSets} resultSets The resul sets associated to the map.
   */
  static propagateFeatureInfoToStore(mapId: string, layerPath: string, eventType: EventType, resultSets: TypeFeatureInfoResultSets) {
    const store = getGeoViewStore(mapId);
    const layerPathInResultSets = Object.keys(resultSets);

    if (eventType === 'click') {
      /**
       * Create a details object for each layer which is then used to render layers in details panel.
       */
      const layerDataArray = [] as TypeArrayOfLayerData;
      layerPathInResultSets.forEach((layerPathItem) => {
        const newLayerData: TypeLayerData = {
          features: resultSets?.[layerPathItem]?.data?.[eventType]?.features ?? [],
          layerStatus: resultSets[layerPathItem].layerStatus,
          layerPath: layerPathItem,
          layerName: resultSets?.[layerPathItem]?.layerName?.[store.getState().appState.displayLanguage] ?? '',
        };
        const layerDataFound = layerDataArray.find((layerEntry) => layerEntry.layerPath === layerPathItem);
        if (layerDataFound) {
          if (!isEqual(layerDataFound, newLayerData)) {
            layerDataFound.features = newLayerData.features;
            layerDataFound.layerStatus = newLayerData.layerStatus;
            layerDataFound.layerName = newLayerData.layerName;
          }
        } else {
          layerDataArray.push(newLayerData);
        }
      });

      store.getState().detailsState.actions.setLayerDataArray(layerDataArray);
    }
  }
  // #endregion

  // **********************************************************
  // Static functions for Store Map State to action on API
  // **********************************************************
  //! NEVER add a store action who does set state AND map action at a same time.
  //! Review the action in store state to make sure
}
