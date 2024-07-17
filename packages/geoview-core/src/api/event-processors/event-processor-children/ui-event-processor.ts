import { TypeMapCorePackages, TypeValidAppBarCoreProps } from '@config/types/map-schema-types';
import { AbstractEventProcessor } from '@/api/event-processors/abstract-event-processor';
import { IUIState, ActiveAppBarTabType } from '@/core/stores/store-interface-and-intial-values/ui-state';

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

  static getAppBarComponents(mapId: string): TypeValidAppBarCoreProps[] {
    return this.getUIState(mapId).appBarComponents;
  }

  static getCorePackageComponents(mapId: string): TypeMapCorePackages {
    return this.getUIState(mapId).corePackagesComponents;
  }

  static getFooterBarIsCollapsed(mapId: string): boolean {
    return this.getUIState(mapId).footerBarIsCollapsed;
  }
  // #endregion

  // **********************************************************
  // Static functions for Store Map State to action on API
  // **********************************************************
  // GV NEVER add a store action who does set state AND map action at a same time.
  // GV Review the action in store state to make sure
  static addHiddenTab(mapId: string, tab: string): void {
    if (!this.getUIState(mapId).hiddenTabs.includes(tab))
      this.getUIState(mapId).setterActions.setHiddenTabs([...this.getUIState(mapId).hiddenTabs, tab]);
  }

  static removeHiddenTab(mapId: string, tab: string): void {
    const curHiddenTabs = this.getUIState(mapId).hiddenTabs;
    const tabIndex = curHiddenTabs.indexOf(tab);
    if (tabIndex !== -1) {
      curHiddenTabs.splice(tabIndex, 1);
      this.getUIState(mapId).setterActions.setHiddenTabs(curHiddenTabs);
    }
  }

  static setActiveFooterBarTab(mapId: string, id: string): void {
    this.getUIState(mapId).setterActions.setActiveFooterBarTab(id);
  }

  static setActiveAppBarTab(mapId: string, tabId: string, tabGroup: string, isOpen: boolean): void {
    this.getUIState(mapId).setterActions.setActiveAppBarTab(tabId, tabGroup, isOpen);
  }

  static getActiveAppBarTab(mapId: string): ActiveAppBarTabType {
    return this.getUIState(mapId).activeAppBarTab;
  }

  static setFooterBarIsCollapsed(mapId: string, collapsed: boolean): void {
    this.getUIState(mapId).setterActions.setFooterBarIsCollapsed(collapsed);
  }
}
