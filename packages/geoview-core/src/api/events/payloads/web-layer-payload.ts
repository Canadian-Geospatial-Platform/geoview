import { PayloadBaseClass } from './payload-base-class';

import { EventStringId, EVENT_NAMES } from '../event';

import { AbstractGeoViewLayer } from '../../../core/types/abstract/abstract-web-layers';

/** Valid events that can create WebLayerPayload */
const validEvents: EventStringId[] = [EVENT_NAMES.LAYER.EVENT_LAYER_ADDED, EVENT_NAMES.LAYER.EVENT_REMOVE_LAYER];

/**
 * Type Gard function that redefines a PayloadBaseClass as a WebLayerPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true of the payload is valid
 */
export const payloadIsAWebLayer = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is WebLayerPayload => {
  return validEvents.includes(verifyIfPayload.event);
};

/**
 * Class definition for WebLayerPayload
 *
 * @exports
 * @class WebLayerPayload
 */
export class WebLayerPayload extends PayloadBaseClass {
  webLayer: AbstractGeoViewLayer;

  /**
   * Constructor for the class
   *
   * @param {EventStringId} event the event identifier for which the payload is constructed
   * @param {string | null} handlerName the handler Name
   * @param {AbstractGeoViewLayer} webLayer the WEB layer payload
   */
  constructor(event: EventStringId, handlerName: string | null, webLayer: AbstractGeoViewLayer) {
    if (!validEvents.includes(event)) throw new Error(`WebLayerPayload can't be instanciated for event of type ${event}`);
    super(event, handlerName);
    this.webLayer = webLayer;
  }
}

/**
 * Helper function used to instanciate a WebLayerPayload object. This function
 * avoids the "new WebLayerPayload" syntax.
 *
 * @param {EventStringId} event the event identifier for which the payload is constructed
 * @param {string | null} handlerName the handler Name
 * @param {AbstractGeoViewLayer} webLayer the WEB layer payload
 *
 * @returns {WebLayerPayload} the WebLayerPayload object created
 */
export const webLayerPayload = (event: EventStringId, handlerName: string | null, webLayer: AbstractGeoViewLayer): WebLayerPayload => {
  return new WebLayerPayload(event, handlerName, webLayer);
};
