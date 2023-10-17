import { EventStringId } from '../event-types';
/**
 * This file defines the constants of the NAVBAR category. The constants are placed
 * in a record that associates an event key with its event string id for each event.
 */
/** Valid keys for the NAVBAR category */
export type NavbarEventKey = 'EVENT_NAVBAR_BUTTON_PANEL_CREATE' | 'EVENT_NAVBAR_BUTTON_PANEL_REMOVE' | 'EVENT_NAVBAR_TOGGLE_CONTROLS';
/** Record that associates NAVBAR's event keys to their event string id */
export declare const NAVBAR: Record<NavbarEventKey, EventStringId>;
