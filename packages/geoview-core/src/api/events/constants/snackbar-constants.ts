import { EventStringId } from '@/api/events/event-types';

/**
 * This file defines the constants of the SNACKBAR category. The constants are placed
 * in a record that associates an event key with its event string id for each event.
 */

/** Valid keys for the SNACKBAR category */
export type SnackbarEventKey = 'EVENT_SNACKBAR_OPEN';

/** Record that associates SNACKBAR's event keys to their event string id */
export const SNACKBAR: Record<SnackbarEventKey, EventStringId> = {
  /**
   * Event is triggered when a snackbar notification opens
   */
  EVENT_SNACKBAR_OPEN: 'snackbar/open',
};
