import { TypeMapCorePackages, TypeValidAppBarCoreProps } from '@/api/config/types/map-schema-types';
import { AbstractEventProcessor } from '@/api/event-processors/abstract-event-processor';
import { IUIState } from '@/core/stores/store-interface-and-intial-values/ui-state';

// GV Important: See notes in header of MapEventProcessor file for information on the paradigm to apply when working with UIEventProcessor vs UIState

export class UIEventProcessor extends AbstractEventProcessor {
  // **********************************************************
  // Static functions for Typescript files to access store actions
  // **********************************************************
  // GV Typescript MUST always use the defined store actions below to modify store - NEVER use setState!
  // GV Some action does state modifications AND map actions.
  // GV ALWAYS use map event processor when an action modify store and IS NOT trap by map state event handler

  /**
   * Shortcut to get the UI state for a given map id
   * @param {string} mapId The mapId
   * @returns {IUIState} The UI state.
   */
  protected static getUIState(mapId: string): IUIState {
    // Return the time slider state
    return super.getState(mapId).uiState;
  }

  // #region
  static getActiveFooterBarTab(mapId: string): string {
    return this.getUIState(mapId).activeFooterBarTabId;
  }

  static getActiveAppBarTabId(mapId: string): string {
    return this.getUIState(mapId).activeAppBarTabId;
  }

  static getAppBarComponents(mapId: string): TypeValidAppBarCoreProps[] {
    return this.getUIState(mapId).appBarComponents;
  }

  static getCorePackageComponents(mapId: string): TypeMapCorePackages {
    return this.getUIState(mapId).corePackagesComponents;
  }
  // #endregion

  // **********************************************************
  // Static functions for Store Map State to action on API
  // **********************************************************
  // GV NEVER add a store action who does set state AND map action at a same time.
  // GV Review the action in store state to make sure
  static setActiveFooterBarTab(mapId: string, id: string): void {
    this.getUIState(mapId).setterActions.setActiveFooterBarTab(id);
  }

  static setActiveAppBarTabId(mapId: string, id: string): void {
    this.getUIState(mapId).setterActions.setActiveAppBarTabId(id);
  }
}
