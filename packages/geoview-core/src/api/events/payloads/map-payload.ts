import L from 'leaflet';
import { PayloadBaseClass } from './payload-base-class';
import { EventStringId, EVENT_NAMES } from '../event';

const validEvents: EventStringId[] = [EVENT_NAMES.MAP.EVENT_MAP_LOADED];

export const payloadIsAMap = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is MapPayload => {
  return validEvents.includes(verifyIfPayload.event);
};

export class MapPayload extends PayloadBaseClass {
  map: L.Map;

  constructor(event: EventStringId, handlerName: string | null, map: L.Map) {
    if (!validEvents.includes(event)) throw new Error(`MapPayload can't be instanciated for event of type ${event}`);
    super(event, handlerName);
    this.map = map;
  }
}

export const mapPayload = (event: EventStringId, handlerName: string | null, map: L.Map): MapPayload => {
  return new MapPayload(event, handlerName, map);
};
