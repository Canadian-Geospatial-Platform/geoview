import L from 'leaflet';
import { PayloadBaseClass } from './payload-base-class';
import { EventStringId, EVENT_NAMES } from '../event';

const validEvents: EventStringId[] = [EVENT_NAMES.DETAILS_PANEL.EVENT_DETAILS_PANEL_CROSSHAIR_ENTER, EVENT_NAMES.MAP.EVENT_MAP_MOVE_END];

export const payloadIsALatLng = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is LatLngPayload => {
  return validEvents.includes(verifyIfPayload.event);
};

export class LatLngPayload extends PayloadBaseClass {
  latLng: L.LatLng;

  constructor(event: EventStringId, handlerName: string | null, latLng: L.LatLng) {
    if (!validEvents.includes(event)) throw new Error(`LatLngPayload can't be instanciated for event of type ${event}`);
    super(event, handlerName);
    this.latLng = latLng;
  }
}

export const latLngPayload = (event: EventStringId, handlerName: string | null, latLng: L.LatLng): LatLngPayload => {
  return new LatLngPayload(event, handlerName, latLng);
};
