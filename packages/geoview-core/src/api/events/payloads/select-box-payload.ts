import L from 'leaflet';
import { PayloadBaseClass } from './payload-base-class';
import { EventStringId, EVENT_NAMES } from '../event';

// Valid events that can create SelectBoxPayload
const validEvents: EventStringId[] = [EVENT_NAMES.CLUSTER_ELEMENT.EVENT_BOX_SELECT_END];

/* ******************************************************************************************************************************
 * Type Gard function that redefines a PayloadBaseClass as a SelectBoxPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the the true block of the if clause.
 *
 * @param {PayloadBaseClass} polymorphic object to test in order to determine if the type ascention is valid
 */
export const payloadIsASelectBox = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is SelectBoxPayload => {
  return validEvents.includes(verifyIfPayload.event);
};

/* ******************************************************************************************************************************
 * Class definition for SelectBoxPayload
 */
export class SelectBoxPayload extends PayloadBaseClass {
  selectBoxBounds: L.LatLngBounds;

  /*
   * Constructor for the class
   *
   * @param {EventStringId} the event identifier for which the payload is constructed
   * @param {string | null} the handler Name
   * @param {L.LatLngBounds} the lat long bounds that define the select box
   *
   * @returns {SelectBoxPayload} the SelectBoxPayload object created
   */
  constructor(event: EventStringId, handlerName: string | null, selectBoxBounds: L.LatLngBounds) {
    if (!validEvents.includes(event)) throw new Error(`SelectBoxPayload can't be instanciated for event of type ${event}`);
    super(event, handlerName);
    this.selectBoxBounds = selectBoxBounds;
  }
}

/* ******************************************************************************************************************************
 * Helper function used to instanciate a SelectBoxPayload object. This function
 * avoids the "new SelectBoxPayload" syntax.
 *
 * @param {EventStringId} the event identifier for which the payload is constructed
 * @param {string | null} the handler Name
 * @param {L.LatLngBounds} the lat long bounds that define the select box
 *
 * @returns {SelectBoxPayload} the SelectBoxPayload object created
 */
export const selectBoxPayload = (event: EventStringId, handlerName: string | null, selectBoxBounds: L.LatLngBounds): SelectBoxPayload => {
  return new SelectBoxPayload(event, handlerName, selectBoxBounds);
};
