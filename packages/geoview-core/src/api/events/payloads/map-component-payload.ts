import { PayloadBaseClass } from './payload-base-class';
import { EventStringId, EVENT_NAMES } from '../event';

const validEvents: EventStringId[] = [EVENT_NAMES.MAP.EVENT_MAP_ADD_COMPONENT, EVENT_NAMES.MAP.EVENT_MAP_REMOVE_COMPONENT];

export const payloadIsAMapComponent = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is MapComponentPayload => {
  return validEvents.includes(verifyIfPayload.event);
};

export class MapComponentPayload extends PayloadBaseClass {
  id: string;

  component?: JSX.Element;

  constructor(event: EventStringId, handlerName: string | null, id: string, component?: JSX.Element) {
    if (!validEvents.includes(event)) throw new Error(`MapComponentPayload can't be instanciated for event of type ${event}`);
    super(event, handlerName);
    this.id = id;
    this.component = component;
  }
}

export const mapComponentPayload = (
  event: EventStringId,
  handlerName: string | null,
  id: string,
  component?: JSX.Element
): MapComponentPayload => {
  return new MapComponentPayload(event, handlerName, id, component);
};
