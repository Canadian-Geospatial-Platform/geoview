import { PayloadBaseClass } from './payload-base-class';
import { EventStringId, EVENT_NAMES } from '../event';
import { TypeBasemapLayer } from '../../../core/types/cgpv-types';

const validEvents: EventStringId[] = [EVENT_NAMES.BASEMAP.EVENT_BASEMAP_LAYERS_UPDATE];

export const payloadIsABasemapLayerArray = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is BasemapLayerArrayPayload => {
  return validEvents.includes(verifyIfPayload.event);
};

export class BasemapLayerArrayPayload extends PayloadBaseClass {
  layers: TypeBasemapLayer[];

  constructor(event: EventStringId, handlerName: string | null, layers: TypeBasemapLayer[]) {
    if (!validEvents.includes(event)) throw new Error(`BasemapLayerArrayPayload can't be instanciated for event of type ${event}`);
    super(event, handlerName);
    this.layers = layers;
  }
}

export const basemapLayerArrayPayload = (
  event: EventStringId,
  handlerName: string | null,
  layers: TypeBasemapLayer[]
): BasemapLayerArrayPayload => {
  return new BasemapLayerArrayPayload(event, handlerName, layers);
};
