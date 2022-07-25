import { PayloadBaseClass } from './payload-base-class';

import { EventStringId, EVENT_NAMES } from '../event-types';
import { TypeMapSchemaProps } from '../../../geo/map/map-types';

/** Valid events that can create MapConfigPayload */
const validEvents: EventStringId[] = [EVENT_NAMES.MAP.EVENT_MAP_RELOAD];

/**
 * Type Gard function that redefines a PayloadBaseClass as a MapConfigPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true of the payload is valid
 */
export const payloadIsAMapConfig = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is MapConfigPayload => {
  return validEvents.includes(verifyIfPayload.event);
};

/**
 * Class definition for MapConfigPayload
 *
 * @exports
 * @class MapConfigPayload
 */
export class MapConfigPayload extends PayloadBaseClass {
  // the map configuration
  config: TypeMapSchemaProps;

  /**
   * Constructor for the class
   *
   * @param {EventStringId} event the event identifier for which the payload is constructed
   * @param {string | null} handlerName the handler Name
   * @param {TypeMapSchemaProps} config the map configuration
   */
  constructor(event: EventStringId, handlerName: string | null, config: TypeMapSchemaProps) {
    if (!validEvents.includes(event)) throw new Error(`MapConfigPayload can't be instanciated for event of type ${event}`);
    super(event, handlerName);
    this.config = config;
  }
}

/**
 * Helper function used to instanciate a MapConfigPayload object. This function
 * avoids the "new MapConfigPayload" syntax.
 *
 * @param {EventStringId} event the event identifier for which the payload is constructed
 * @param {string | null} handlerName the handler Name
 * @param {TypeMapSchemaProps} config the map configuration
 *
 * @returns {MapConfigPayload} the MapConfigPayload object created
 */
export const mapConfigPayload = (event: EventStringId, handlerName: string | null, config: TypeMapSchemaProps): MapConfigPayload => {
  return new MapConfigPayload(event, handlerName, config);
};
