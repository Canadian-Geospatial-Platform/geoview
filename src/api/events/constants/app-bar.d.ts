import { EventStringId } from '../event-types';
/**
 * This file defines the constants of the APPBAR category. The constants are placed
 * in a record that associates an event key with its event string id for each event.
 */
/** Valid keys for the APPBAR category */
export declare type AppbarEventKey = 'EVENT_APPBAR_PANEL_CREATE' | 'EVENT_APPBAR_PANEL_REMOVE';
/** Record that associates APPBAR's event keys to their event string id */
export declare const APPBAR: Record<AppbarEventKey, EventStringId>;
