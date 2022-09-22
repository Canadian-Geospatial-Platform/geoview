import { api } from '../../../app';

import { EVENT_NAMES } from '../../../api/events/event-types';

import { tabPayload } from '../../../api/events/payloads/footer-tab-payload';

import { TypeTabs } from '../../../ui/tabs/tabs';

/**
 * API to manage tabs on the tabs component
 *
 * @exports
 * @class
 */
export class FooterTabsApi {
  mapId!: string;

  // array that hold added tabs
  tabs: TypeTabs[] = [];

  /**
   * initialize the footer tabs api
   *
   * @param mapId the id of the map this appbar belongs to
   */
  constructor(mapId: string) {
    this.mapId = mapId;
  }

  /**
   * Create a tab on the footer tabs
   *
   * @param {TypeTabs} tabProps the properties of the tab to be created
   *
   */
  createFooterTab = (tabProps: TypeTabs) => {
    if (tabProps) {
      // find if tab value exists
      const tab = this.tabs.find((t) => t.value === tabProps.value);

      // if tab does not exist, create it
      if (!tab) {
        // add the new tab to the footer tabs array
        this.tabs.push(tabProps);

        // trigger an event that a new tab has been created
        api.event.emit(tabPayload(EVENT_NAMES.FOOTER_TABS.EVENT_FOOTER_TABS_TAB_CREATE, this.mapId, tabProps));
      }
    }
  };

  /**
   * Remove a tab by value
   *
   * @param {number} value the value of the tab to be removed
   */
  removeFooterTab = (value: number): void => {
    // find the tab to be removed
    const tabToRemove = this.tabs.find((tab) => tab.value === value);

    if (tabToRemove) {
      // remove the tab from the footer tabs array
      this.tabs = this.tabs.filter((tab) => tab.value !== value);

      // trigger an event that a tab has been removed
      api.event.emit(tabPayload(EVENT_NAMES.FOOTER_TABS.EVENT_FOOTER_TABS_TAB_REMOVE, this.mapId, tabToRemove));
    }
  };
}
