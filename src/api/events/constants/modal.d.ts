import { EventStringId } from '../event-types';
/**
 * This file defines the constants of the MODAL category. The constants are placed
 * in a record that associates an event key with its event string id for each event.
 */
/** Valid keys for the MODAL category */
export declare type ModalEventKey = 'EVENT_MODAL_CREATE' | 'EVENT_MODAL_OPEN' | 'EVENT_MODAL_CLOSE' | 'EVENT_MODAL_UPDATE';
/** Record that associates MODAL's event keys to their event string id */
export declare const MODAL: Record<ModalEventKey, EventStringId>;
