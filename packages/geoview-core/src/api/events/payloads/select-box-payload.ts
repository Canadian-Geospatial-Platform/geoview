import L from 'leaflet';
import { PayloadBaseClass } from './payload-base-class';
import { EventStringId, EVENT_NAMES } from '../event';

const validEvents: EventStringId[] = [EVENT_NAMES.CLUSTER_ELEMENT.EVENT_BOX_SELECT_END];

export const payloadIsASelectBox = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is SelectBoxPayload => {
  return validEvents.includes(verifyIfPayload.event);
};

export class SelectBoxPayload extends PayloadBaseClass {
  selectBoxBounds: L.LatLngBounds;

  constructor(event: EventStringId, handlerName: string | null, selectBoxBounds: L.LatLngBounds) {
    if (!validEvents.includes(event)) throw new Error(`SelectBoxPayload can't be instanciated for event of type ${event}`);
    super(event, handlerName);
    this.selectBoxBounds = selectBoxBounds;
  }
}

export const selectBoxPayload = (event: EventStringId, handlerName: string | null, selectBoxBounds: L.LatLngBounds): SelectBoxPayload => {
  return new SelectBoxPayload(event, handlerName, selectBoxBounds);
};
