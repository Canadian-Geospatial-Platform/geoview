import type { ReactNode } from 'react';

import type { TypeTabs } from '@/ui/tabs/tabs';

import type { UIController } from '@/core/controllers/ui-controller';
import { sanitizeHtmlContent } from '@/core/utils/utilities';

/** Content entry for a footer tab (icon and content are ReactNodes kept outside the store). */
export type FooterTabContent = {
  /** The tab icon element. */
  icon?: ReactNode;
  /** The tab content element. */
  content?: ReactNode;
};

/**
 * API to manage tabs on the footer bar component.
 */
export class FooterBarApi {
  /** The UI controller. */
  #uiController: UIController;

  /** Registry of tab content keyed by tab id (kept outside the store because ReactNodes are not serializable). */
  #contentRegistry: Map<string, FooterTabContent> = new Map();

  /**
   * Instantiates a FooterBarApi class.
   *
   * @param uiController - The UI controller this footer bar api belongs to
   */
  constructor(uiController: UIController) {
    // Keep the controller, for actions.
    this.#uiController = uiController;
  }

  /**
   * Creates a tab on the footer bar.
   *
   * @param tabProps - The properties of the tab to be created
   */
  createTab(tabProps: TypeTabs): void {
    if (tabProps) {
      // Check if tab already exists in registry
      if (this.#contentRegistry.has(tabProps.id)) return;

      // if tab content is string HTML, sanitize
      // eslint-disable-next-line no-param-reassign
      if (typeof tabProps.content === 'string') tabProps.content = sanitizeHtmlContent(tabProps.content);

      // Register content in the side registry (ReactNodes stay outside the store)
      this.#contentRegistry.set(tabProps.id, { icon: tabProps.icon, content: tabProps.content });

      // Write serializable metadata to the store so the UI reacts immediately
      this.#uiController.addFooterTab({ id: tabProps.id, label: tabProps.label });
    }
  }

  /**
   * Removes a tab by id.
   *
   * @param id - The id of the tab to be removed
   */
  removeTab(id: string): void {
    if (this.#contentRegistry.has(id)) {
      // Remove from content registry
      this.#contentRegistry.delete(id);

      // Remove from the store
      this.#uiController.removeFooterTab(id);
    }
  }

  /**
   * Gets the content entry for a tab by id.
   *
   * @param id - The tab id to look up
   * @returns The tab content entry, or undefined if not registered
   */
  getTabContent(id: string): FooterTabContent | undefined {
    return this.#contentRegistry.get(id);
  }

  /**
   * Shows a tab by id.
   *
   * @param id - The id of the tab to be shown
   * @deprecated Legacy support. Should use uiController.showTabButton directly instead.
   */
  showTabButton(id: string): void {
    // Redirect to ui controller
    this.#uiController.showTabButton(id);
  }

  /**
   * Selects a tab by id, if the id is not a tab, the footer bar will close.
   *
   * @param id - The id of the tab to be selected
   * @deprecated Legacy support. Should use uiController.setActiveFooterBarTab directly instead.
   */
  selectTab(id: string): void {
    // Redirect to ui controller
    this.#uiController.setActiveFooterBarTab(id);
  }
}
