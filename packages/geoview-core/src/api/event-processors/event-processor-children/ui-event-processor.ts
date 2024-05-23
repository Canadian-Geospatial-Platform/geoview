import { TypeMapCorePackages, TypeValidAppBarCoreProps } from '@config/types/map-schema-types';
import { AbstractEventProcessor } from '@/api/event-processors/abstract-event-processor';
import { IUIState } from '@/core/stores/store-interface-and-intial-values/ui-state';

// GV The paradigm when working with UIEventProcessor vs UIState goes like this:
// GV UIState provides: 'state values', 'actions' and 'setterActions'.
// GV Whereas Zustand would suggest having 'state values' and 'actions', in GeoView, we have a 'UIEventProcessor' in the middle.
// GV This is because we wanted to have centralized code between UI actions and backend actions via a UIEventProcessor.
// GV In summary:
// GV The UI components should use UIState's 'state values' to read and 'actions' to set states (which simply redirect to UIEventProcessor).
// GV The back-end code should use UIEventProcessor which uses 'state values' and 'setterActions'
// GV Essentially 3 main call-stacks:
// GV   - UIEventProcessor ---calls---> UIState.setterActions
// GV   - UI Component ---calls---> UIState.actions ---calls---> UIEventProcessor ---calls---> UIState.setterActions
// GV   - UIEventProcessor ---triggers---> UIViewer events ---calls---> UIState.setterActions
// GV The reason for this pattern is so that UI components and processes performing back-end code
// GV both end up running code in UIEventProcessor (UI: via 'actions' and back-end code via 'UIEventProcessor')

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
  // #endregion

  // **********************************************************
  // Static functions for Store Map State to action on API
  // **********************************************************
  // GV NEVER add a store action who does set state AND map action at a same time.
  // GV Review the action in store state to make sure
  static setActiveFooterBarTab(mapId: string, id: string): void {
    this.getUIState(mapId).setterActions.setActiveFooterBarTab(id);
  }
}
