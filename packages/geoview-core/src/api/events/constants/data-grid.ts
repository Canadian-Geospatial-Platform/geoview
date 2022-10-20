import { EventStringId } from '../event-types';

/**
 * This file defines the constants of the DATA_GRID category. The constants are placed
 * in a record that associates an event key with its event string id for each event.
 */

/** Valid keys for the DATA_GRID category */
export type DataGridEventKey = 'REGISTER' | 'CREATE';

/** Record that associates DATA_GRID's event keys to their event string id */
export const DATA_GRID: Record<DataGridEventKey, EventStringId> = {
  /**
   * Event triggered when a layer wants to register to a panel
   */
  REGISTER: 'data_grid/register',

  /**
   * Event triggered to execute to create a table component for a layer
   */
  CREATE: 'data_grid/create',
};
