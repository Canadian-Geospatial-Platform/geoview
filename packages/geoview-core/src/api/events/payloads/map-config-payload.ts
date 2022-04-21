import { PayloadBaseClass } from './payload-base-class';
import { EventStringId, EVENT_NAMES } from '../event';
import { TypeMapConfigProps } from '../../../core/types/cgpv-types';

// Valid events that can create MapConfigPayload
const validEvents: EventStringId[] = [EVENT_NAMES.MAP.EVENT_MAP_RELOAD];

/* ******************************************************************************************************************************
 * Type Gard function that redefines a PayloadBaseClass as a MapConfigPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the the true block of the if clause.
 *
 * @param {PayloadBaseClass} polymorphic object to test in order to determine if the type ascention is valid
 */
export const payloadIsAMapConfig = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is MapConfigPayload => {
  return validEvents.includes(verifyIfPayload.event);
};

/* ******************************************************************************************************************************
 * Class definition for MapConfigPayload
 */
export class MapConfigPayload extends PayloadBaseClass {
  // the handler id
  handlerId: string;

  // the map configuration
  config: TypeMapConfigProps;

  /*
   * Constructor for the class
   *
   * @param {EventStringId} the event identifier for which the payload is constructed
   * @param {string | null} the handler Name
   * @param {string} the handler id
   * @param {TypeMapConfigProps} the map configuration
   *
   * @returns {MapConfigPayload} the MapConfigPayload object created
   */
  constructor(event: EventStringId, handlerName: string | null, handlerId: string, config: TypeMapConfigProps) {
    if (!validEvents.includes(event)) throw new Error(`MapConfigPayload can't be instanciated for event of type ${event}`);
    super(event, handlerName);
    this.handlerId = handlerId;
    this.config = config;
  }
}

/* ******************************************************************************************************************************
 * Helper function used to instanciate a MapConfigPayload object. This function
 * avoids the "new MapConfigPayload" syntax.
 *
 * @param {EventStringId} the event identifier for which the payload is constructed
 * @param {string | null} the handler Name
 * @param {string} the handler id
 * @param {TypeMapConfigProps} the map configuration
 *
 * @returns {MapConfigPayload} the MapConfigPayload object created
 */
export const mapConfigPayload = (
  event: EventStringId,
  handlerName: string | null,
  handlerId: string,
  config: TypeMapConfigProps
): MapConfigPayload => {
  return new MapConfigPayload(event, handlerName, handlerId, config);
};
