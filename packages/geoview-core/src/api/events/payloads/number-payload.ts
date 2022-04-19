import { PayloadBaseClass } from './payload-base-class';
import { EventStringId, EVENT_NAMES } from '../event';

const validEvents: EventStringId[] = [EVENT_NAMES.MAP.EVENT_MAP_ZOOM_END];

export const payloadIsANumber = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is NumberPayload => {
  return validEvents.includes(verifyIfPayload.event);
};

export class NumberPayload extends PayloadBaseClass {
  value: number;

  constructor(event: EventStringId, handlerName: string | null, value: number) {
    if (!validEvents.includes(event)) throw new Error(`NumberPayload can't be instanciated for event of type ${event}`);
    super(event, handlerName);
    this.value = value;
  }
}

export const numberPayload = (event: EventStringId, handlerName: string | null, value: number): NumberPayload => {
  return new NumberPayload(event, handlerName, value);
};
