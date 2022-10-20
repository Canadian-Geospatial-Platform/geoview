import { PayloadBaseClass } from './payload-base-class';

import { EventStringId, EVENT_NAMES } from '../event-types';

/** Valid events that can create DataGridPayload */
const validEvents: EventStringId[] = [EVENT_NAMES.DATA_GRID.REGISTER, EVENT_NAMES.DATA_GRID.CREATE];

/**
 * Type Gard function that redefines a PayloadBaseClass as a DataGridPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true of the payload is valid
 */
export const payloadIsDataGrid = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is DataGridPayload => {
  return validEvents.includes(verifyIfPayload.event);
};

export type TypeDataGridCreate = {
  data: Object;
};

export type TypeDataGridRegister = { origin: 'layer' | 'panel' };

/**
 * Class definition for DataGridPayload
 *
 * @exports
 * @class DataGridPayload
 */
export class DataGridPayload extends PayloadBaseClass {
  data: TypeDataGridCreate | TypeDataGridRegister | undefined;

  /**
   * Constructor for the class
   *
   * @param {EventStringId} event the event identifier for which the payload is constructed
   * @param {string | null} handlerName the handler Name (mapId/layerId)
   * @param {Coordinate} lnglat the long lat values carried by the payload
   */
  constructor(event: EventStringId, handlerName: string, data?: TypeDataGridCreate | TypeDataGridRegister) {
    if (!validEvents.includes(event)) throw new Error(`DataGridPayload can't be instanciated for event of type ${event}`);
    super(event, handlerName);
    this.data = data;
  }
}

/**
 * Helper function used to instanciate a DataGridPayload object. This function
 * avoids the "new DataGridPayload" syntax.
 *
 * @param {EventStringId} event the event identifier for which the payload is constructed
 * @param {string | null} handlerName the handler Name
 *
 * @returns {DataGridPayload} the DataGridPayload object created
 */
export const getDataGridPayload = (
  event: EventStringId,
  handlerName: string,
  data?: TypeDataGridCreate | TypeDataGridRegister
): DataGridPayload => {
  return new DataGridPayload(event, handlerName, data);
};
