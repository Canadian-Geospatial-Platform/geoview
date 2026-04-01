import type { TypeTabs } from '@/ui/tabs/tabs';

import type { EventDelegateBase } from '@/api/events/event-helper';
import EventHelper from '@/api/events/event-helper';
import type { UIController } from '@/core/controllers/ui-controller';
import { sanitizeHtmlContent } from '@/core/utils/utilities';

/**
 * API to manage tabs on the footer bar component.
 */
export class FooterBarApi {
  /** The UI controller */
  #uiController: UIController;

  /** Array that holds added tabs. */
  tabs: TypeTabs[] = [];

  /** Callback handlers for the footerbar tab created event. */
  #onFooterTabCreatedHandlers: FooterTabCreatedDelegate[] = [];

  /** Callback handlers for the footerbar tab removed event. */
  #onFooterTabRemovedHandlers: FooterTabRemovedDelegate[] = [];

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
   * Emits an event to all registered footerbar tab created event handlers.
   *
   * @param event - The event to emit
   */
  #emitFooterTabCreated(event: FooterTabCreatedEvent): void {
    // Emit the footerbar tab created event
    EventHelper.emitEvent(this, this.#onFooterTabCreatedHandlers, event);
  }

  /**
   * Registers an event handler for footerbar tab created events.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   */
  onFooterTabCreated(callback: FooterTabCreatedDelegate): void {
    // Register the footerbar tab created event callback
    EventHelper.onEvent(this.#onFooterTabCreatedHandlers, callback);
  }

  /**
   * Unregisters an event handler for footerbar tab created events.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offFooterTabCreated(callback: FooterTabCreatedDelegate): void {
    // Unregister the footerbar tab created event callback
    EventHelper.offEvent(this.#onFooterTabCreatedHandlers, callback);
  }

  /**
   * Emits an event to all registered footerbar tab removed event handlers.
   *
   * @param event - The event to emit
   */
  #emitFooterTabRemoved(event: FooterTabRemovedEvent): void {
    // Emit the footerbar tab removed event
    EventHelper.emitEvent(this, this.#onFooterTabRemovedHandlers, event);
  }

  /**
   * Registers an event handler for footerbar tab removed events.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   */
  onFooterTabRemoved(callback: FooterTabRemovedDelegate): void {
    // Register the footerbar tab removed event callback
    EventHelper.onEvent(this.#onFooterTabRemovedHandlers, callback);
  }

  /**
   * Unregisters an event handler for footerbar removed events.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offFooterTabRemoved(callback: FooterTabRemovedDelegate): void {
    // Unregister the footerbar removed event callback
    EventHelper.offEvent(this.#onFooterTabRemovedHandlers, callback);
  }

  /**
   * Creates a tab on the footer bar.
   *
   * @param tabProps - The properties of the tab to be created
   */
  createTab(tabProps: TypeTabs): void {
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
        this.#emitFooterTabCreated({ tab: tabProps });
      }
    }
  }

  /**
   * Removes a tab by id.
   *
   * @param id - The id of the tab to be removed
   */
  removeTab(id: string): void {
    // find the tab to be removed
    const tabToRemove = this.tabs.find((tab) => tab.id === id);

    if (tabToRemove) {
      // remove the tab from the footer tabs array
      this.tabs = this.tabs.filter((tab) => tab.id !== id);

      // trigger an event that a tab has been removed
      this.#emitFooterTabRemoved({ tabid: id });
    }
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

/** Event emitted when a footer tab is created. */
export type FooterTabCreatedEvent = {
  /** The tab that was created. */
  tab: TypeTabs;
};

/** Delegate for the footer tab created event handler. */
type FooterTabCreatedDelegate = EventDelegateBase<FooterBarApi, FooterTabCreatedEvent, void>;

/** Event emitted when a footer tab is removed. */
export type FooterTabRemovedEvent = {
  /** The id of the tab that was removed. */
  tabid: string;
};

/** Delegate for the footer tab removed event handler. */
type FooterTabRemovedDelegate = EventDelegateBase<FooterBarApi, FooterTabRemovedEvent, void>;
