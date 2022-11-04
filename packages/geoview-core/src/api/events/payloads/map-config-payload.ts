import { PayloadBaseClass } from './payload-base-class';

import { EventStringId, EVENT_NAMES } from '../event-types';
import { TypeMapFeaturesConfig } from '../../../core/types/global-types';

/** Valid events that can create MapFeaturesPayload */
const validEvents: EventStringId[] = [EVENT_NAMES.MAP.EVENT_MAP_RELOAD];

/**
 * type guard function that redefines a PayloadBaseClass as a MapFeaturesPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export const payloadIsAmapFeaturesConfig = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is MapFeaturesPayload => {
  return validEvents.includes(verifyIfPayload.event);
};

/**
 * Class definition for MapFeaturesPayload
 *
 * @exports
 * @class MapFeaturesPayload
 */
export class MapFeaturesPayload extends PayloadBaseClass {
  // the map configuration
  mapFeaturesConfig: TypeMapFeaturesConfig;

  /**
   * Constructor for the class
   *
   * @param {EventStringId} event the event identifier for which the payload is constructed
   * @param {string | null} handlerName the handler Name
   * @param {TypeMapFeaturesConfig} mapFeatures the map features configuration
   */
  constructor(event: EventStringId, handlerName: string | null, mapFeaturesConfig: TypeMapFeaturesConfig) {
    if (!validEvents.includes(event)) throw new Error(`MapFeaturesPayload can't be instanciated for event of type ${event}`);
    super(event, handlerName);
    this.mapFeaturesConfig = mapFeaturesConfig;
  }
}

/**
 * Helper function used to instanciate a MapFeaturesPayload object. This function
 * avoids the "new MapFeaturesPayload" syntax.
 *
 * @param {EventStringId} event the event identifier for which the payload is constructed
 * @param {string | null} handlerName the handler Name
 * @param {TypeMapFeaturesConfig} config the map configuration
 *
 * @returns {MapFeaturesPayload} the MapFeaturesPayload object created
 */
export const mapConfigPayload = (event: EventStringId, handlerName: string | null, config: TypeMapFeaturesConfig): MapFeaturesPayload => {
  return new MapFeaturesPayload(event, handlerName, config);
};
