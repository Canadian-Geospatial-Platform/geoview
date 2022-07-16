import { PayloadBaseClass } from './payload-base-class';

import { EventStringId, EVENT_NAMES } from '../event';
import { AbstractGeoViewLayer } from '../../../geo/layer/geoview-layers/abstract-geoview-layers';

/** Valid events that can create GeoViewLayerPayload */
const validEvents: EventStringId[] = [EVENT_NAMES.LAYER.EVENT_LAYER_ADDED, EVENT_NAMES.LAYER.EVENT_REMOVE_LAYER];

/**
 * Type Gard function that redefines a PayloadBaseClass as a GeoViewLayerPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true of the payload is valid
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
  geoViewLayer: AbstractGeoViewLayer;

  /**
   * Constructor for the class
   *
   * @param {EventStringId} event the event identifier for which the payload is constructed
   * @param {string | null} handlerName the handler Name
   * @param {AbstractGeoViewLayer} geoViewLayer the GeoView layer payload
   */
  constructor(event: EventStringId, handlerName: string | null, geoViewLayer: AbstractGeoViewLayer) {
    if (!validEvents.includes(event)) throw new Error(`GeoViewLayerPayload can't be instanciated for event of type ${event}`);
    super(event, handlerName);
    this.geoViewLayer = geoViewLayer;
  }
}

/**
 * Helper function used to instanciate a GeoViewLayerPayload object. This function
 * avoids the "new GeoViewLayerPayload" syntax.
 *
 * @param {EventStringId} event the event identifier for which the payload is constructed
 * @param {string | null} handlerName the handler Name
 * @param {AbstractGeoViewLayer} geoViewLayer the GeoView layer payload
 *
 * @returns {GeoViewLayerPayload} the GeoViewLayerPayload object created
 */
export const geoViewLayerPayload = (
  event: EventStringId,
  handlerName: string | null,
  geoViewLayer: AbstractGeoViewLayer
): GeoViewLayerPayload => {
  return new GeoViewLayerPayload(event, handlerName, geoViewLayer);
};
