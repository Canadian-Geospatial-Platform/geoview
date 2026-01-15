import type {
  TypeValidAppBarCoreProps,
  TypeValidFooterBarTabsCoreProps,
  TypeValidMapCorePackageProps,
  TypeValidNavBarProps,
} from '@/api/types/map-schema-types';
import { AbstractEventProcessor } from '@/api/event-processors/abstract-event-processor';
import type { IUIState, ActiveAppBarTabType } from '@/core/stores/store-interface-and-intial-values/ui-state';

// GV Important: See notes in header of MapEventProcessor file for information on the paradigm to apply when working with UIEventProcessor vs UIState

export class UIEventProcessor extends AbstractEventProcessor {
  // **********************************************************
  // Static functions for Typescript files to access store actions
  // **********************************************************
  // GV Typescript MUST always use the defined store actions below to modify store - NEVER use setState!
  // GV Some action does state modifications AND map actions.
  // GV ALWAYS use map event processor when an action modify store and IS NOT trap by map state event handler

  /**
   * Retrieves the UI state slice from the store for the specified map.
   * Provides access to app bar, footer bar, navbar components and their visibility states.
   * Used by other processors and UI components to access current interface configuration.
   * @param {string} mapId - The map identifier
   * @return {IUIState} The UI state slice containing all interface-related data
   * @static
   * @protected
   */
  protected static getUIStateProtected(mapId: string): IUIState {
    // Return the time slider state
    return super.getState(mapId).uiState;
  }

  // #region

  /**
   * Gets the identifier of the currently active footer bar tab.
   * Returns the tab ID that is currently selected and displayed in the footer bar.
   * @param {string} mapId - The map identifier
   * @return {string | undefined} The active tab ID, or undefined if no tab is active
   * @static
   */
  static getActiveFooterBarTab(mapId: string): string | undefined {
    return this.getUIStateProtected(mapId).activeFooterBarTabId;
  }

  /**
   * Gets the array of footer bar tab components registered for the map.
   * Returns component configurations for all tabs that appear in the bottom footer bar.
   * @param {string} mapId - The map identifier
   * @return {TypeValidFooterBarTabsCoreProps[]} Array of footer bar component configurations
   * @static
   */
  static getFooterBarComponents(mapId: string): TypeValidFooterBarTabsCoreProps[] {
    return this.getUIStateProtected(mapId).footerBarComponents;
  }

  /**
   * Gets the array of app bar button components registered for the map.
   * Returns component configurations for all buttons that appear in the main app bar.
   * @param {string} mapId - The map identifier
   * @return {TypeValidAppBarCoreProps[]} Array of app bar component configurations
   * @static
   */
  static getAppBarComponents(mapId: string): TypeValidAppBarCoreProps[] {
    return this.getUIStateProtected(mapId).appBarComponents;
  }

  /**
   * Gets the array of navigation bar components registered for the map.
   * Returns component configurations for zoom, home, and other navigation controls.
   * @param {string} mapId - The map identifier
   * @return {TypeValidNavBarProps[]} Array of navbar component configurations
   * @static
   */
  static getNavBarComponents(mapId: string): TypeValidNavBarProps[] {
    return this.getUIStateProtected(mapId).navBarComponents;
  }

  /**
   * Gets the array of core package components registered for the map.
   * Returns configurations for essential GeoView core functionality packages.
   * @param {string} mapId - The map identifier
   * @return {TypeValidMapCorePackageProps[]} Array of core package component configurations
   * @static
   */
  static getCorePackageComponents(mapId: string): TypeValidMapCorePackageProps[] {
    return this.getUIStateProtected(mapId).corePackagesComponents;
  }

  /**
   * Gets the collapsed state of the footer bar.
   * Returns true if the footer bar is currently hidden/collapsed, false if expanded/visible.
   * @param {string} mapId - The map identifier
   * @return {boolean} True if footer bar is collapsed, false otherwise
   * @static
   */
  static getFooterBarIsCollapsed(mapId: string): boolean {
    return this.getUIStateProtected(mapId).footerBarIsCollapsed;
  }
  // #endregion

  // **********************************************************
  // Static functions for Store Map State to action on API
  // **********************************************************
  // GV NEVER add a store action who does set state AND map action at a same time.
  // GV Review the action in store state to make sure

  /**
   * Hides a footer bar tab by adding it to the hidden tabs list.
   * The tab will be removed from the footer bar UI until showTab is called.
   * If the tab is already hidden, no action is taken.
   * @param {string} mapId - The map identifier
   * @param {string} tab - The tab identifier to hide
   * @return {void}
   * @static
   */
  static hideTab(mapId: string, tab: string): void {
    if (!this.getUIStateProtected(mapId).hiddenTabs.includes(tab))
      this.getUIStateProtected(mapId).setterActions.setHiddenTabs([...this.getUIStateProtected(mapId).hiddenTabs, tab]);
  }

  /**
   * Shows a previously hidden footer bar tab by removing it from the hidden tabs list.
   * The tab will be restored to the footer bar UI.
   * If the tab is already visible, no action is taken.
   * @param {string} mapId - The map identifier
   * @param {string} tab - The tab identifier to show
   * @return {void}
   * @static
   */
  static showTab(mapId: string, tab: string): void {
    const curHiddenTabs = this.getUIStateProtected(mapId).hiddenTabs;
    const tabIndex = curHiddenTabs.indexOf(tab);
    if (tabIndex !== -1) {
      curHiddenTabs.splice(tabIndex, 1);
      this.getUIStateProtected(mapId).setterActions.setHiddenTabs(curHiddenTabs);
    }
  }

  /**
   * Sets the active tab in the footer bar.
   * Switches the currently displayed footer bar tab to the specified tab ID.
   * @param {string} mapId - The map identifier
   * @param {string} id - The footer bar tab ID to activate
   * @return {void}
   * @static
   */
  static setActiveFooterBarTab(mapId: string, id: string): void {
    this.getUIStateProtected(mapId).setterActions.setActiveFooterBarTab(id);
  }

  /**
   * Sets the active app bar tab and its state.
   * Controls which app bar button is active, whether its panel is open, and focus trap state.
   * Used when clicking app bar buttons to show/hide their associated panels.
   * @param {string} mapId - The map identifier
   * @param {string} tabId - The app bar tab ID to activate
   * @param {boolean} isOpen - Whether the tab's panel should be open
   * @param {boolean} isFocusTrapped - Whether focus should be trapped in the panel for accessibility
   * @return {void}
   * @static
   */
  static setActiveAppBarTab(mapId: string, tabId: string, isOpen: boolean, isFocusTrapped: boolean): void {
    this.getUIStateProtected(mapId).setterActions.setActiveAppBarTab(tabId, isOpen, isFocusTrapped);
  }

  /**
   * Gets the currently active app bar tab and its state.
   * Returns an object containing the tab ID, whether it's open, and focus trap state.
   * @param {string} mapId - The map identifier
   * @return {ActiveAppBarTabType} Object with tabId, isOpen, and isFocusTrapped properties
   * @static
   */
  static getActiveAppBarTab(mapId: string): ActiveAppBarTabType {
    return this.getUIStateProtected(mapId).activeAppBarTab;
  }

  /**
   * Sets whether the footer bar is collapsed (hidden) or expanded (visible).
   * Used to toggle the footer bar's visibility, typically via a collapse/expand button.
   * @param {string} mapId - The map identifier
   * @param {boolean} collapsed - True to collapse the footer bar, false to expand it
   * @return {void}
   * @static
   */
  static setFooterBarIsCollapsed(mapId: string, collapsed: boolean): void {
    this.getUIStateProtected(mapId).setterActions.setFooterBarIsCollapsed(collapsed);
  }
}
