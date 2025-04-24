import { TypeMapCorePackages, TypeValidAppBarCoreProps } from '@/api/config/types/map-schema-types';
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
  protected static getUIStateProtected(mapId: string): IUIState {
    // Return the time slider state
    return super.getState(mapId).uiState;
  }

  // #region
  static getActiveFooterBarTab(mapId: string): string {
    return this.getUIStateProtected(mapId).activeFooterBarTabId;
  }

  static getAppBarComponents(mapId: string): TypeValidAppBarCoreProps[] {
    return this.getUIStateProtected(mapId).appBarComponents;
  }

  static getCorePackageComponents(mapId: string): TypeMapCorePackages {
    return this.getUIStateProtected(mapId).corePackagesComponents;
  }

  static getFooterBarIsCollapsed(mapId: string): boolean {
    return this.getUIStateProtected(mapId).footerBarIsCollapsed;
  }
  // #endregion

  // **********************************************************
  // Static functions for Store Map State to action on API
  // **********************************************************
  // GV NEVER add a store action who does set state AND map action at a same time.
  // GV Review the action in store state to make sure
  static hideTab(mapId: string, tab: string): void {
    if (!this.getUIStateProtected(mapId).hiddenTabs.includes(tab))
      this.getUIStateProtected(mapId).setterActions.setHiddenTabs([...this.getUIStateProtected(mapId).hiddenTabs, tab]);
  }

  static showTab(mapId: string, tab: string): void {
    const curHiddenTabs = this.getUIStateProtected(mapId).hiddenTabs;
    const tabIndex = curHiddenTabs.indexOf(tab);
    if (tabIndex !== -1) {
      curHiddenTabs.splice(tabIndex, 1);
      this.getUIStateProtected(mapId).setterActions.setHiddenTabs(curHiddenTabs);
    }
  }

  static setActiveFooterBarTab(mapId: string, id: string): void {
    this.getUIStateProtected(mapId).setterActions.setActiveFooterBarTab(id);
  }

  static setActiveAppBarTab(mapId: string, tabId: string, tabGroup: string, isOpen: boolean, isFocusTrapped: boolean): void {
    this.getUIStateProtected(mapId).setterActions.setActiveAppBarTab(tabId, tabGroup, isOpen, isFocusTrapped);
  }

  static getActiveAppBarTab(mapId: string): ActiveAppBarTabType {
    return this.getUIStateProtected(mapId).activeAppBarTab;
  }

  static setFooterBarIsCollapsed(mapId: string, collapsed: boolean): void {
    this.getUIStateProtected(mapId).setterActions.setFooterBarIsCollapsed(collapsed);
  }
}
