import { EventStringId } from '../event-types';
/**
 * This file defines the constants of the PANEL category. The constants are placed
 * in a record that associates an event key with its event string id for each event.
 */
/** Valid keys for the PANEL category */
export type PanelEventKey = 'EVENT_PANEL_OPEN' | 'EVENT_PANEL_CLOSE' | 'EVENT_PANEL_CLOSE_ALL' | 'EVENT_PANEL_ADD_ACTION' | 'EVENT_PANEL_REMOVE_ACTION' | 'EVENT_PANEL_CHANGE_CONTENT';
/** Record that associates PANEL's event keys to their event string id */
export declare const PANEL: Record<PanelEventKey, EventStringId>;
