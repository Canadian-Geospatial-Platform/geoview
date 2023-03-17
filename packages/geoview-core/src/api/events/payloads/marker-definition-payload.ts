import { Coordinate } from 'ol/coordinate';

import { PayloadBaseClass } from './payload-base-class';

import { EventStringId, EVENT_NAMES } from '../event-types';
import { TypeJsonObject } from '../../../core/types/global-types';

/** Valid events that can create MarkerDefinitionPayload */
const validEvents: EventStringId[] = [EVENT_NAMES.MARKER_ICON.EVENT_MARKER_ICON_SHOW];

/**
 * type guard function that redefines a PayloadBaseClass as a MarkerDefinitionPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export const payloadIsAMarkerDefinition = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is MarkerDefinitionPayload => {
  return validEvents.includes(verifyIfPayload?.event);
};

/**
 * Class definition for MarkerDefinitionPayload
 *
 * @exports
 * @class MarkerDefinitionPayload
 */
export class MarkerDefinitionPayload extends PayloadBaseClass {
  // the marker coordinate
  lnglat: Coordinate;

  // the marker symbology
  symbology: TypeJsonObject;

  /**
   * Constructor for the class
   *
   * @param {EventStringId} event the event identifier for which the payload is constructed
   * @param {string | null} handlerName the handler Name
   * @param {Coordinate} lnglat the marker coordinate
   * @param {TypeJsonObject} symbology the marker symbology
   */
  constructor(event: EventStringId, handlerName: string | null, lnglat: Coordinate, symbology?: TypeJsonObject) {
    if (!validEvents.includes(event)) throw new Error(`MarkerIconPayload can't be instanciated for event of type ${event}`);
    super(event, handlerName);
    this.lnglat = lnglat;
    this.symbology = symbology || ({} as TypeJsonObject);
  }
}

/**
 * Helper function used to instanciate a MarkerDefinitionPayload object. This function
 * avoids the "new MarkerDefinitionPayload" syntax.
 *
 * @param {EventStringId} event the event identifier for which the payload is constructed
 * @param {string | null} handlerName the handler Name
 * @param {Coordinate} lnglat the marker coordinate
 * @param {TypeJsonObject} symbology the marker symbology
 *
 * @returns {MarkerDefinitionPayload} the MarkerDefinitionPayload object created
 */
export const markerDefinitionPayload = (
  event: EventStringId,
  handlerName: string | null,
  lnglat: Coordinate,
  symbology?: TypeJsonObject
): MarkerDefinitionPayload => {
  return new MarkerDefinitionPayload(event, handlerName, lnglat, symbology);
};
