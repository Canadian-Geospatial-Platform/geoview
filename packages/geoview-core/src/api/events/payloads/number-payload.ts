import { PayloadBaseClass } from './payload-base-class';
import { EventStringId, EVENT_NAMES } from '../event';

// Valid events that can create NumberPayload
const validEvents: EventStringId[] = [EVENT_NAMES.MAP.EVENT_MAP_ZOOM_END];

/* ******************************************************************************************************************************
 * Type Gard function that redefines a PayloadBaseClass as a NumberPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the the true block of the if clause.
 *
 * @param {PayloadBaseClass} polymorphic object to test in order to determine if the type ascention is valid
 */
export const payloadIsANumber = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is NumberPayload => {
  return validEvents.includes(verifyIfPayload.event);
};

/* ******************************************************************************************************************************
 * Class definition for NumberPayload
 */
export class NumberPayload extends PayloadBaseClass {
  // the value of the number carried by the payload
  value: number;

  /*
   * Constructor for the class
   *
   * @param {EventStringId} the event identifier for which the payload is constructed
   * @param {string | null} the handler Name
   * @param {number} the value of the number carried by the payload
   *
   * @returns {NumberPayload} the NumberPayload object created
   */
  constructor(event: EventStringId, handlerName: string | null, value: number) {
    if (!validEvents.includes(event)) throw new Error(`NumberPayload can't be instanciated for event of type ${event}`);
    super(event, handlerName);
    this.value = value;
  }
}

/* ******************************************************************************************************************************
 * Helper function used to instanciate a NumberPayload object. This function
 * avoids the "new NumberPayload" syntax.
 *
 * @param {EventStringId} the event identifier for which the payload is constructed
 * @param {string | null} the handler Name
 * @param {number} the value of the number carried by the payload
 *
 * @returns {NumberPayload} the NumberPayload object created
 */
export const numberPayload = (event: EventStringId, handlerName: string | null, value: number): NumberPayload => {
  return new NumberPayload(event, handlerName, value);
};
