import { PayloadBaseClass } from './payload-base-class';

import { EventStringId, EVENT_NAMES } from '../event-types';
import { AbstractGeoViewLayer } from '../../../geo/layer/geoview-layers/abstract-geoview-layers';

/** Valid events that can create GeoViewLayerPayload */
const validEvents: EventStringId[] = [EVENT_NAMES.LAYER.EVENT_LAYER_ADDED, EVENT_NAMES.LAYER.EVENT_REMOVE_LAYER];

/**
 * type guard function that redefines a PayloadBaseClass as a GeoViewLayerPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export const payloadIsAGeoViewLayer = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is GeoViewLayerPayload => {
  return validEvents.includes(verifyIfPayload.event);
};

/**
 * Class definition for GeoViewLayerPayload
 *
 * @exports
 * @class GeoViewLayerPayload
 */
export class GeoViewLayerPayload extends PayloadBaseClass {
  geoviewLayer: AbstractGeoViewLayer;

  /**
   * Constructor for the class
   *
   * @param {EventStringId} event the event identifier for which the payload is constructed
   * @param {string | null} handlerName the handler Name
   * @param {AbstractGeoViewLayer} geoviewLayer the GeoView layer payload
   */
  constructor(event: EventStringId, handlerName: string | null, geoviewLayer: AbstractGeoViewLayer) {
    if (!validEvents.includes(event)) throw new Error(`GeoViewLayerPayload can't be instanciated for event of type ${event}`);
    super(event, handlerName);
    this.geoviewLayer = geoviewLayer;
  }
}

/**
 * Helper function used to instanciate a GeoViewLayerPayload object. This function
 * avoids the "new GeoViewLayerPayload" syntax.
 *
 * @param {EventStringId} event the event identifier for which the payload is constructed
 * @param {string | null} handlerName the handler Name
 * @param {AbstractGeoViewLayer} geoviewLayer the GeoView layer payload
 *
 * @returns {GeoViewLayerPayload} the GeoViewLayerPayload object created
 */
export const geoviewLayerPayload = (
  event: EventStringId,
  handlerName: string | null,
  geoviewLayer: AbstractGeoViewLayer
): GeoViewLayerPayload => {
  return new GeoViewLayerPayload(event, handlerName, geoviewLayer);
};
