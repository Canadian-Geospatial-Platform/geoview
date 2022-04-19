import L from 'leaflet';
import { PayloadBaseClass } from './payload-base-class';
import { EventStringId, EVENT_NAMES } from '../event';

const validEvents: EventStringId[] = [EVENT_NAMES.CLUSTER_ELEMENT.EVENT_CLUSTER_ELEMENT_ADD];

export const payloadIsAMarkerClusterConfig = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is MarkerClusterConfigPayload => {
  return validEvents.includes(verifyIfPayload.event);
};

export class MarkerClusterConfigPayload extends PayloadBaseClass {
  id?: string;

  latitude: number;

  longitude: number;

  options: L.MarkerClusterElementOptions;

  constructor(
    event: EventStringId,
    handlerName: string | null,
    latitude: number,
    longitude: number,
    options: L.MarkerClusterElementOptions,
    id?: string
  ) {
    if (!validEvents.includes(event)) throw new Error(`MarkerClusterConfigPayload can't be instanciated for event of type ${event}`);
    super(event, handlerName);
    this.latitude = latitude;
    this.longitude = longitude;
    this.options = options;
    this.id = id;
  }
}

export const markerClusterConfigPayload = (
  event: EventStringId,
  handlerName: string | null,
  latitude: number,
  longitude: number,
  options: L.MarkerClusterElementOptions,
  id?: string
): MarkerClusterConfigPayload => {
  return new MarkerClusterConfigPayload(event, handlerName, latitude, longitude, options, id);
};
