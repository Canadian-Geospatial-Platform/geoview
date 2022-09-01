import { EventStringId } from '../event-types';

/**
 * This file defines the constants of the NAVBAR category. The constants are placed
 * in a record that associates an event key with its event string id for each event.
 */

/** Valid keys for the NAVBAR category */
export type NavbarEventKey = 'EVENT_NAVBAR_BUTTON_PANEL_CREATE' | 'EVENT_NAVBAR_BUTTON_PANEL_REMOVE' | 'EVENT_NAVBAR_TOGGLE_CONTROLS';

/** Record that associates NAVBAR's event keys to their event string id */
export const NAVBAR: Record<NavbarEventKey, EventStringId> = {
  /**
   * Event triggered when a new navbar button or panel has been created
   */
  EVENT_NAVBAR_BUTTON_PANEL_CREATE: 'navbar/button_panel_create',

  /**
   * Event triggered when a navbar button or button panel has been removed
   */
  EVENT_NAVBAR_BUTTON_PANEL_REMOVE: 'navbar/button_panel_remove',

  // TODO there is no code linked to the following event for the moment
  /**
   * Enable / Disable controls (zoom,home,fullscreen buttons)
   */
  EVENT_NAVBAR_TOGGLE_CONTROLS: 'navbar/toggle_controls',
};
