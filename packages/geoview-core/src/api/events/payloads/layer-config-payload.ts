import { PayloadBaseClass } from './payload-base-class';
import { EventStringId, EVENT_NAMES } from '../event';
import { TypeLayerConfig } from '../../../core/types/cgpv-types';

// Valid events that can create LayerConfigPayload
const validEvents: EventStringId[] = [EVENT_NAMES.LAYER.EVENT_LAYER_ADD];

/* ******************************************************************************************************************************
 * Type Gard function that redefines a PayloadBaseClass as a LayerConfigPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the the true block of the if clause.
 *
 * @param {PayloadBaseClass} polymorphic object to test in order to determine if the type ascention is valid
 */
export const payloadIsALayerConfig = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is LayerConfigPayload => {
  return validEvents.includes(verifyIfPayload.event);
};

/* ******************************************************************************************************************************
 * Class definition for LayerConfigPayload
 */
export class LayerConfigPayload extends PayloadBaseClass {
  // the layer configuration
  layerConfig: TypeLayerConfig;

  /*
   * Constructor for the class
   *
   * @param {EventStringId} the event identifier for which the payload is constructed
   * @param {string | null} the handler Name
   * @param {TypeLayerConfig} the layer configuration
   *
   * @returns {LayerConfigPayload} the LayerConfigPayload object created
   */
  constructor(event: EventStringId, handlerName: string | null, layerConfig: TypeLayerConfig) {
    if (!validEvents.includes(event)) throw new Error(`LayerConfigPayload can't be instanciated for event of type ${event}`);
    super(event, handlerName);
    this.layerConfig = layerConfig;
  }
}

/* ******************************************************************************************************************************
 * Helper function used to instanciate a LayerConfigPayload object. This function
 * avoids the "new LayerConfigPayload" syntax.
 *
 * @param {EventStringId} the event identifier for which the payload is constructed
 * @param {string | null} the handler Name
 * @param {TypeLayerConfig} the layer configuration
 *
 * @returns {LayerConfigPayload} the LayerConfigPayload object created
 */
export const layerConfigPayload = (event: EventStringId, handlerName: string | null, layerConfig: TypeLayerConfig): LayerConfigPayload => {
  return new LayerConfigPayload(event, handlerName, layerConfig);
};
