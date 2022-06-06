import L from 'leaflet';

import { PayloadBaseClass } from './payload-base-class';

import { EventStringId, EVENT_NAMES } from '../event';

/** Valid events that can create LatLngPayload */
const validEvents: EventStringId[] = [EVENT_NAMES.DETAILS_PANEL.EVENT_DETAILS_PANEL_CROSSHAIR_ENTER, EVENT_NAMES.MAP.EVENT_MAP_MOVE_END];

/**
 * Type Gard function that redefines a PayloadBaseClass as a LatLngPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true of the payload is valid
 */
export const payloadIsALatLng = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is LatLngPayload => {
  return validEvents.includes(verifyIfPayload.event);
};

/**
 * Class definition for LatLngPayload
 *
 * @exports
 * @class LatLngPayload
 */
export class LatLngPayload extends PayloadBaseClass {
  latLng: L.LatLng;

  /**
   * Constructor for the class
   *
   * @param {EventStringId} event the event identifier for which the payload is constructed
   * @param {string | null} handlerName the handler Name
   * @param {L.LatLng} latLng the lat long values carried by the payload
   */
  constructor(event: EventStringId, handlerName: string | null, latLng: L.LatLng) {
    if (!validEvents.includes(event)) throw new Error(`LatLngPayload can't be instanciated for event of type ${event}`);
    super(event, handlerName);
    this.latLng = latLng;
  }
}

/**
 * Helper function used to instanciate a LatLngPayload object. This function
 * avoids the "new LatLngPayload" syntax.
 *
 * @param {EventStringId} event the event identifier for which the payload is constructed
 * @param {string | null} handlerName the handler Name
 * @param {L.LatLng} latLng the lat long values carried by the payload
 *
 * @returns {LatLngPayload} the LatLngPayload object created
 */
export const latLngPayload = (event: EventStringId, handlerName: string | null, latLng: L.LatLng): LatLngPayload => {
  return new LatLngPayload(event, handlerName, latLng);
};
