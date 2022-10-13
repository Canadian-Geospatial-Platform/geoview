import { Coordinate } from 'ol/coordinate';

import { PayloadBaseClass } from './payload-base-class';

import { EventStringId, EVENT_NAMES } from '../event-types';

/** Valid events that can create MapSingleClickPayload */
const validEvents: EventStringId[] = [EVENT_NAMES.MAP.EVENT_MAP_SINGLE_CLICK];

/** Type used to define an map single click action  */
export type TypeMapSingleClick = {
  lnglat: Coordinate;
  pixel: Coordinate;
  projected: Coordinate;
};

/**
 * Type Gard function that redefines a PayloadBaseClass as a MapSingleClickPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true of the payload is valid
 */
export const payloadIsAMapSingleClick = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is MapSingleClickPayload => {
  return validEvents.includes(verifyIfPayload.event);
};

/**
 * Class definition for MapSingleClick
 *
 * @exports
 * @class MapSingleClick
 */
export class MapSingleClickPayload extends PayloadBaseClass {
  coordinates: TypeMapSingleClick;

  /**
   * Constructor for the class
   *
   * @param {EventStringId} event the event identifier for which the payload is constructed
   * @param {string | null} handlerName the handler Name
   * @param {TypeMapSingleClick} coordinates the coordinates (lnglat, pixel and projected) values carried by the payload
   */
  constructor(event: EventStringId, handlerName: string | null, coordinates: TypeMapSingleClick) {
    if (!validEvents.includes(event)) throw new Error(`MapSingleClickPayload can't be instanciated for event of type ${event}`);
    super(event, handlerName);
    this.coordinates = coordinates;
  }
}

/**
 * Helper function used to instanciate a MapSingleClickPayload object. This function
 * avoids the "new MapSingleClickPayload" syntax.
 *
 * @param {EventStringId} event the event identifier for which the payload is constructed
 * @param {string | null} handlerName the handler Name
 * @param {TypeMapSingleClick} coordinates the long lat values carried by the payload
 *
 * @returns {MapSingleClickPayload} the MapSingleClickPayload object created
 */
export const mapSingleClickPayload = (
  event: EventStringId,
  handlerName: string | null,
  coordinates: TypeMapSingleClick
): MapSingleClickPayload => {
  return new MapSingleClickPayload(event, handlerName, coordinates);
};
