import { PayloadBaseClass } from './payload-base-class';
import { EventStringId, EVENT_NAMES } from '../event';

const validEvents: EventStringId[] = [EVENT_NAMES.MAP.EVENT_MAP_IN_KEYFOCUS];

export const payloadIsAInKeyfocus = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is InKeyfocusPayload => {
  return validEvents.includes(verifyIfPayload.event);
};

export class InKeyfocusPayload extends PayloadBaseClass {
  constructor(event: EventStringId, handlerName: string | null) {
    if (!validEvents.includes(event)) throw new Error(`InKeyfocusPayload can't be instanciated for event of type ${event}`);
    super(event, handlerName);
  }
}

export const inKeyfocusPayload = (event: EventStringId, handlerName: string | null): InKeyfocusPayload => {
  return new InKeyfocusPayload(event, handlerName);
};
