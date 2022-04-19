import { PayloadBaseClass } from './payload-base-class';
import { EventStringId, EVENT_NAMES } from '../event';
import { AbstractWebLayersClass } from '../../../core/types/abstract/abstract-web-layers';

const validEvents: EventStringId[] = [EVENT_NAMES.LAYER.EVENT_LAYER_ADDED, EVENT_NAMES.LAYER.EVENT_REMOVE_LAYER];

export const payloadIsAWebLayer = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is WebLayerPayload => {
  return validEvents.includes(verifyIfPayload.event);
};

export class WebLayerPayload extends PayloadBaseClass {
  webLayer: AbstractWebLayersClass;

  constructor(event: EventStringId, handlerName: string | null, webLayer: AbstractWebLayersClass) {
    if (!validEvents.includes(event)) throw new Error(`WebLayerPayload can't be instanciated for event of type ${event}`);
    super(event, handlerName);
    this.webLayer = webLayer;
  }
}

export const webLayerPayload = (event: EventStringId, handlerName: string | null, webLayer: AbstractWebLayersClass): WebLayerPayload => {
  return new WebLayerPayload(event, handlerName, webLayer);
};
