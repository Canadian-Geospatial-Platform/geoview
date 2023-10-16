import { EventStringId } from '../event-types';
/**
 * This file defines the constants of the FOOTER_TABS category. The constants are placed
 * in a record that associates an event key with its event string id for each event.
 */
/** Valid keys for the FOOTER_TABS category */
export type FooterTabsEventKey = 'EVENT_FOOTER_TABS_TAB_CREATE' | 'EVENT_FOOTER_TABS_TAB_REMOVE' | 'EVENT_FOOTER_TABS_TAB_SELECT';
/** Record that associates FOOTER_TABS's event keys to their event string id */
export declare const FOOTER_TABS: Record<FooterTabsEventKey, EventStringId>;
