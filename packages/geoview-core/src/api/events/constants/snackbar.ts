import { EventStringId } from '../event';

/**
 * Snackbar event types
 */

export type SnackbarEventKey = 'EVENT_SNACKBAR_OPEN';

export const SNACKBAR: Record<SnackbarEventKey, EventStringId> = {
  /**
   * Event is triggered when a snackbar notification opens
   */
  EVENT_SNACKBAR_OPEN: 'snackbar/open',
};
