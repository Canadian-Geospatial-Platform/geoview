import { PayloadBaseClass } from './payload-base-class';
import { EventStringId, EVENT_NAMES } from '../event';
import { TypeLayerConfig } from '../../../core/types/cgpv-types';

const validEvents: EventStringId[] = [EVENT_NAMES.LAYER.EVENT_LAYER_ADD];

export const payloadIsALayerConfig = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is LayerConfigPayload => {
  return validEvents.includes(verifyIfPayload.event);
};

export class LayerConfigPayload extends PayloadBaseClass {
  layerConfig: TypeLayerConfig;

  constructor(event: EventStringId, handlerName: string | null, layerConfig: TypeLayerConfig) {
    if (!validEvents.includes(event)) throw new Error(`LayerConfigPayload can't be instanciated for event of type ${event}`);
    super(event, handlerName);
    this.layerConfig = layerConfig;
  }
}

export const layerConfigPayload = (event: EventStringId, handlerName: string | null, layerConfig: TypeLayerConfig): LayerConfigPayload => {
  return new LayerConfigPayload(event, handlerName, layerConfig);
};
