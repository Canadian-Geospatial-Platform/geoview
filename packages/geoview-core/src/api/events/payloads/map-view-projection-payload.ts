import { PayloadBaseClass } from './payload-base-class';

import { EventStringId, EVENT_NAMES } from '../event-types';
import { TypeProjectionCodes } from '../../../geo/map/map-schema-types';

/** Valid events that can create MapViewProjectionPayload */
const validEvents: EventStringId[] = [EVENT_NAMES.MAP.EVENT_MAP_VIEW_PROJECTION_CHANGE];

/**
 * Type Gard function that redefines a PayloadBaseClass as a MapViewProjectionPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export const payloadIsAMapViewProjection = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is MapViewProjectionPayload => {
  return validEvents.includes(verifyIfPayload.event);
};

/**
 * Class definition for MapViewProjectionPayload
 *
 * @exports
 * @class MapViewProjectionPayload
 */
export class MapViewProjectionPayload extends PayloadBaseClass {
  // the map configuration
  projection: TypeProjectionCodes;

  /**
   * Constructor for the class
   *
   * @param {EventStringId} event the event identifier for which the payload is constructed
   * @param {string | null} handlerName the handler Name
   * @param {number} projection the map view projection
   */
  constructor(event: EventStringId, handlerName: string | null, projection: TypeProjectionCodes) {
    if (!validEvents.includes(event)) throw new Error(`MapViewProjectionPayload can't be instanciated for event of type ${event}`);
    super(event, handlerName);
    this.projection = projection;
  }
}

/**
 * Helper function used to instanciate a MapViewProjectionPayload object. This function
 * avoids the "new MapViewProjectionPayload" syntax.
 *
 * @param {EventStringId} event the event identifier for which the payload is constructed
 * @param {string | null} handlerName the handler Name
 * @param {number} projection the map view projection
 *
 * @returns {MapViewProjectionPayload} the MapViewProjectionPayload object created
 */
export const mapViewProjectionPayload = (
  event: EventStringId,
  handlerName: string | null,
  projection: TypeProjectionCodes
): MapViewProjectionPayload => {
  return new MapViewProjectionPayload(event, handlerName, projection);
};
