import { api } from '@/app';

import { EVENT_NAMES } from '@/api/events/event-types';
import { sanitizeHtmlContent } from '../../utils/utilities';

import { footerTabPayload } from '@/api/events/payloads';

import { TypeTabs } from '@/ui/tabs/tabs';

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
   * @param mapId the id of the map this footer tabs belongs to
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
      const tab = this.tabs.find((t) => t.id === tabProps.id);

      // if tab does not exist, create it
      if (!tab) {
        // if tab content is string HTML, sanitize
        // eslint-disable-next-line no-param-reassign
        if (typeof tabProps.content === 'string') tabProps.content = sanitizeHtmlContent(tabProps.content);

        // add the new tab to the footer tabs array
        this.tabs.push(tabProps);

        // trigger an event that a new tab has been created
        api.event.emit(footerTabPayload(EVENT_NAMES.FOOTER_TABS.EVENT_FOOTER_TABS_TAB_CREATE, this.mapId, tabProps));
      }
    }
  };

  /**
   * Remove a tab by value
   *
   * @param {string} id the id of the tab to be removed
   */
  removeFooterTab = (id: string): void => {
    // find the tab to be removed
    const tabToRemove = this.tabs.find((tab) => tab.id === id);

    if (tabToRemove) {
      // remove the tab from the footer tabs array
      this.tabs = this.tabs.filter((tab) => tab.id !== id);

      // trigger an event that a tab has been removed
      api.event.emit(footerTabPayload(EVENT_NAMES.FOOTER_TABS.EVENT_FOOTER_TABS_TAB_REMOVE, this.mapId, tabToRemove));
    }
  };

  /**
   * Select a tab by id
   *
   * @param {string} id the id of the tab to be selected
   */
  selectFooterTab = (id: string): void => {
    // find the tab to be selected
    const tabToSelect = this.tabs.find((tab) => tab.id === id);
    if (tabToSelect) {
      // trigger an event to select the tab
      api.event.emit(footerTabPayload(EVENT_NAMES.FOOTER_TABS.EVENT_FOOTER_TABS_TAB_SELECT, this.mapId, tabToSelect));
    }
  };
}
