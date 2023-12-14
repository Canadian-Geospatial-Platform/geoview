import { GeoviewStoreType } from '@/core/stores/geoview-store';
import { AbstractEventProcessor } from '../abstract-event-processor';
import { getGeoViewStore } from '@/core/stores/stores-managers';
import { TypeAppBarProps, TypeMapCorePackages } from '@/geo';

export class UIEventProcessor extends AbstractEventProcessor {
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
  static getAppBarComponents(mapId: string): TypeAppBarProps {
    return getGeoViewStore(mapId).getState().uiState.appBarComponents;
  }

  static getCorePackageComponents(mapId: string): TypeMapCorePackages {
    return getGeoViewStore(mapId).getState().uiState.corePackagesComponents;
  }
  // #endregion

  // **********************************************************
  // Static functions for Store Map State to action on API
  // **********************************************************
  //! NEVER add a store action who does set state AND map action at a same time.
  //! Review the action in store state to make sure
}
