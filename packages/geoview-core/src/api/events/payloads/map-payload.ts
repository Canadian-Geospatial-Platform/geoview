import OLMap from 'ol/Map';

import { PayloadBaseClass } from './payload-base-class';

import { EventStringId, EVENT_NAMES } from '../event';

/** Valid events that can create MapPayload */
const validEvents: EventStringId[] = [EVENT_NAMES.MAP.EVENT_MAP_LOADED];

/**
 * Type Gard function that redefines a PayloadBaseClass as a MapPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true of the payload is valid
 */
export const payloadIsAMap = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is MapPayload => {
  return validEvents.includes(verifyIfPayload.event);
};

/**
 * Class definition for MapPayload
 *
 * @exports
 * @class MapPayload
 */
export class MapPayload extends PayloadBaseClass {
  map: OLMap;

  /**
   * Constructor for the class
   *
   * @param {EventStringId} event the event identifier for which the payload is constructed
   * @param {string | null} handlerName the handler Name
   * @param {OLMap} map the map payload
   */
  constructor(event: EventStringId, handlerName: string | null, map: OLMap) {
    if (!validEvents.includes(event)) throw new Error(`MapPayload can't be instanciated for event of type ${event}`);
    super(event, handlerName);
    this.map = map;
  }
}

/**
 * Helper function used to instanciate a MapPayload object. This function
 * avoids the "new MapPayload" syntax.
 *
 * @param {EventStringId} event the event identifier for which the payload is constructed
 * @param {string | null} handlerName the handler Name
 * @param {OLMap} map the map payload
 *
 * @returns {MapPayload} the MapPayload object created
 */
export const mapPayload = (event: EventStringId, handlerName: string | null, map: OLMap): MapPayload => {
  return new MapPayload(event, handlerName, map);
};
