import { TypeAppBarProps, TypeMapCorePackages } from '@/geo';
import { IUIState, api } from '@/app';

import { AbstractEventProcessor } from '../abstract-event-processor';

export class UIEventProcessor extends AbstractEventProcessor {
  // **********************************************************
  // Static functions for Typescript files to access store actions
  // **********************************************************
  //! Typescript MUST always use the defined store actions below to modify store - NEVER use setState!
  //! Some action does state modifications AND map actions.
  //! ALWAYS use map event processor when an action modify store and IS NOT trap by map state event handler

  /**
   * Shortcut to get the UI state for a given map id
   * @param {string} mapId The mapId
   * @returns {IUIState} The UI state.
   */
  public static getUIState(mapId: string): IUIState {
    // Return the time slider state
    return super.getState(mapId).uiState;
  }

  // #region
  static getAppBarComponents(mapId: string): TypeAppBarProps {
    return this.getUIState(mapId).appBarComponents;
  }

  static getCorePackageComponents(mapId: string): TypeMapCorePackages {
    return this.getUIState(mapId).corePackagesComponents;
  }
  // #endregion

  // **********************************************************
  // Static functions for Store Map State to action on API
  // **********************************************************
  //! NEVER add a store action who does set state AND map action at a same time.
  //! Review the action in store state to make sure
  static setActiveFooterTab(mapId: string, id: string): void {
    api.maps[mapId].footerTabs.selectFooterTab(id);
  }
}
