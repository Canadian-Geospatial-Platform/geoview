import { EventStringId } from '../event';
/**
 * This file defines the constants of the MODAL category. The constants are placed
 * in a record that associates an event key with its event string id for each event.
 */
export declare type ModalEventKey = 'EVENT_MODAL_CREATE' | 'EVENT_MODAL_OPEN' | 'EVENT_MODAL_CLOSE' | 'EVENT_MODAL_UPDATE';
export declare const MODAL: Record<ModalEventKey, EventStringId>;
