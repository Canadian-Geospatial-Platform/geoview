import { EventStringId } from '../event';

/**
 * Constant that contains navbar event types
 */

type NavbarEventKey = 'EVENT_NAVBAR_BUTTON_PANEL_CREATE' | 'EVENT_NAVBAR_BUTTON_PANEL_REMOVE' | 'EVENT_NAVBAR_TOGGLE_CONTROLS';

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
