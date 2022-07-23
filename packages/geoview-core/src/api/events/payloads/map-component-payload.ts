import { PayloadBaseClass } from './payload-base-class';

import { EventStringId, EVENT_NAMES } from '../event';

/** Valid events that can create MapComponentPayload */
const validEvents: EventStringId[] = [EVENT_NAMES.MAP.EVENT_MAP_ADD_COMPONENT, EVENT_NAMES.MAP.EVENT_MAP_REMOVE_COMPONENT];

/**
 * Type Gard function that redefines a PayloadBaseClass as a MapComponentPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true of the payload is valid
 */
export const payloadIsAMapComponent = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is MapComponentPayload => {
  return validEvents.includes(verifyIfPayload.event);
};

/**
 * Class definition for MapComponentPayload
 *
 * @exports
 * @class MapComponentPayload
 */
export class MapComponentPayload extends PayloadBaseClass {
  // the map component identifier
  id: string;

  // the map component element
  component?: JSX.Element;

  /**
   * Constructor for the class
   *
   * @param {EventStringId} event the event identifier for which the payload is constructed
   * @param {string | null} handlerName the handler Name
   * @param {string} id the map component identifier
   * @param {JSX.Element} component the map component element
   */
  constructor(event: EventStringId, handlerName: string | null, id: string, component?: JSX.Element) {
    if (!validEvents.includes(event)) throw new Error(`MapComponentPayload can't be instanciated for event of type ${event}`);
    super(event, handlerName);
    this.id = id;
    this.component = component;
  }
}

/**
 * Helper function used to instanciate a MapComponentPayload object. This function
 * avoids the "new MapComponentPayload" syntax.
 *
 * @param {EventStringId} event the event identifier for which the payload is constructed
 * @param {string | null} handlerName the handler Name
 * @param {string} id the map component identifier
 * @param {JSX.Element} component the map component element
 *
 * @returns {MapComponentPayload} the MapComponentPayload object created
 */
export const mapComponentPayload = (
  event: EventStringId,
  handlerName: string | null,
  id: string,
  component?: JSX.Element
): MapComponentPayload => {
  return new MapComponentPayload(event, handlerName, id, component);
};
