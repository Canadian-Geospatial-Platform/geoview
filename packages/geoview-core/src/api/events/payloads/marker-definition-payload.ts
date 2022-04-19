import L from 'leaflet';
import { PayloadBaseClass } from './payload-base-class';
import { EventStringId, EVENT_NAMES } from '../event';
import { TypeJsonObject } from '../../../core/types/cgpv-types';

const validEvents: EventStringId[] = [EVENT_NAMES.MARKER_ICON.EVENT_MARKER_ICON_SHOW];

export const payloadIsAMarkerDefinition = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is MarkerDefinitionPayload => {
  return validEvents.includes(verifyIfPayload.event);
};

export class MarkerDefinitionPayload extends PayloadBaseClass {
  latlng: L.LatLng;

  symbology: TypeJsonObject;

  constructor(event: EventStringId, handlerName: string | null, latlng: L.LatLng, symbology: TypeJsonObject) {
    if (!validEvents.includes(event)) throw new Error(`MarkerIconPayload can't be instanciated for event of type ${event}`);
    super(event, handlerName);
    this.latlng = latlng;
    this.symbology = symbology;
  }
}

export const markerDefinitionPayload = (
  event: EventStringId,
  handlerName: string | null,
  latlng: L.LatLng,
  symbology: TypeJsonObject
): MarkerDefinitionPayload => {
  return new MarkerDefinitionPayload(event, handlerName, latlng, symbology);
};
