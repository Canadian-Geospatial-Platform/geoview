import { PayloadBaseClass } from './payload-base-class';

import { EventStringId, EVENT_NAMES } from '../event-types';
import { TypeGeoviewLayerConfig } from '@/geo/map/map-schema-types';

/** Valid events that can create LayerConfigPayload */
const validEvents: EventStringId[] = [EVENT_NAMES.LAYER.EVENT_ADD_LAYER];

/**
 * type guard function that redefines a PayloadBaseClass as a LayerConfigPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export const payloadIsALayerConfig = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is LayerConfigPayload => {
  return validEvents.includes(verifyIfPayload?.event);
};

/**
 * Class definition for LayerConfigPayload
 *
 * @exports
 * @class LayerConfigPayload
 */
export class LayerConfigPayload extends PayloadBaseClass {
  // the layer configuration
  layerConfig: TypeGeoviewLayerConfig;

  /**
   * Constructor for the class
   *
   * @param {EventStringId} event the event identifier for which the payload is constructed
   * @param {string | null} handlerName the handler Name
   * @param {TypeGeoviewLayerConfig} layerConfig the layer configuration
   */
  constructor(event: EventStringId, handlerName: string | null, layerConfig: TypeGeoviewLayerConfig) {
    if (!validEvents.includes(event)) throw new Error(`LayerConfigPayload can't be instanciated for event of type ${event}`);
    super(event, handlerName);
    this.layerConfig = layerConfig;
  }
}

/**
 * Helper function used to instanciate a LayerConfigPayload object. This function
 * avoids the "new LayerConfigPayload" syntax.
 *
 * @param {EventStringId} event the event identifier for which the payload is constructed
 * @param {string | null} handlerName the handler Name
 * @param {TypeGeoviewLayerConfig} layerConfig the layer configuration
 *
 * @returns {LayerConfigPayload} the LayerConfigPayload object created
 */
export const layerConfigPayload = (
  event: EventStringId,
  handlerName: string | null,
  layerConfig: TypeGeoviewLayerConfig
): LayerConfigPayload => {
  return new LayerConfigPayload(event, handlerName, layerConfig);
};
