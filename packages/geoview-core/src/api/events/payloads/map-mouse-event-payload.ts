import { Coordinate } from 'ol/coordinate';

import { PayloadBaseClass } from './payload-base-class';

import { EventStringId, EVENT_NAMES } from '../event-types';

/** Valid events that can create MapMouseEventPayload */
const validEvents: EventStringId[] = [EVENT_NAMES.MAP.EVENT_MAP_SINGLE_CLICK, EVENT_NAMES.MAP.EVENT_MAP_POINTER_MOVE];

/** Type used to define the map mouse information  */
export type TypeMapMouseInfo = {
  lnglat: Coordinate;
  pixel: Coordinate;
  projected: Coordinate;
  dragging: boolean;
};

/**
 * type guard function that redefines a PayloadBaseClass as a MapMouseEventPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export const payloadIsAMapMouseEvent = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is MapMouseEventPayload => {
  return validEvents.includes(verifyIfPayload?.event);
};

/**
 * Class definition for MapMouseEventPayload
 *
 * @exports
 * @class MapMouseEventPayload
 */
export class MapMouseEventPayload extends PayloadBaseClass {
  coordinates: TypeMapMouseInfo;

  /**
   * Constructor for the class
   *
   * @param {EventStringId} event the event identifier for which the payload is constructed
   * @param {string | null} handlerName the handler Name
   * @param {TypeMapMouseInfo} coordinates the coordinates (lnglat, pixel and projected) values carried by the payload
   */
  constructor(event: EventStringId, handlerName: string | null, coordinates: TypeMapMouseInfo) {
    if (!validEvents.includes(event)) throw new Error(`MapMouseEventPayload can't be instanciated for event of type ${event}`);
    super(event, handlerName);
    this.coordinates = coordinates;
  }
}

/**
 * Helper function used to instanciate a MapMouseEventPayload object. This function
 * avoids the "new MapMouseEventPayload" syntax.
 *
 * @param {EventStringId} event the event identifier for which the payload is constructed
 * @param {string | null} handlerName the handler Name
 * @param {TypeMapMouseInfo} coordinates the long lat values carried by the payload
 *
 * @returns {MapMouseEventPayload} the MapMouseEventPayload object created
 */
export const mapMouseEventPayload = (
  event: EventStringId,
  handlerName: string | null,
  coordinates: TypeMapMouseInfo
): MapMouseEventPayload => {
  return new MapMouseEventPayload(event, handlerName, coordinates);
};
