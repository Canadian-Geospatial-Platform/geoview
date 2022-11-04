import { PayloadBaseClass } from './payload-base-class';

import { EventStringId, EVENT_NAMES } from '../event-types';
import { TypeBasemapLayer } from '../../../geo/layer/basemap/basemap-types';

/** Valid events that can create BasemapLayerArrayPayload */
const validEvents: EventStringId[] = [EVENT_NAMES.BASEMAP.EVENT_BASEMAP_LAYERS_UPDATE];

/**
 * type guard function that redefines a PayloadBaseClass as a BasemapLayerArrayPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export const payloadIsABasemapLayerArray = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is BasemapLayerArrayPayload => {
  return validEvents.includes(verifyIfPayload.event);
};

/**
 * Class definition for BasemapLayerArrayPayload
 *
 * @exports
 * @class BasemapLayerArrayPayload
 */
export class BasemapLayerArrayPayload extends PayloadBaseClass {
  layers: TypeBasemapLayer[];

  /**
   * Constructor for the class
   *
   * @param {EventStringId} event the event identifier for which the payload is constructed
   * @param {string | null} handlerName the handler Name
   * @param {TypeBasemapLayer[]} layers the layer array payload
   *
   */
  constructor(event: EventStringId, handlerName: string | null, layers: TypeBasemapLayer[]) {
    if (!validEvents.includes(event)) throw new Error(`BasemapLayerArrayPayload can't be instanciated for event of type ${event}`);
    super(event, handlerName);
    this.layers = layers;
  }
}

/**
 * Helper function used to instanciate a BasemapLayerArrayPayload object. This function
 * avoids the "new BasemapLayerArrayPayload" syntax.
 *
 * @param {EventStringId} event the event identifier for which the payload is constructed
 * @param {string | null} handlerName the handler Name
 * @param {TypeBasemapLayer[]} layers the layer array payload
 *
 * @returns {BasemapLayerArrayPayload} the BasemapLayerArrayPayload object created
 */
export const basemapLayerArrayPayload = (
  event: EventStringId,
  handlerName: string | null,
  layers: TypeBasemapLayer[]
): BasemapLayerArrayPayload => {
  return new BasemapLayerArrayPayload(event, handlerName, layers);
};
