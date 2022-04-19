import { PayloadBaseClass } from './payload-base-class';
import { EventStringId, EVENT_NAMES } from '../event';

const validEvents: EventStringId[] = [
  EVENT_NAMES.MAP.EVENT_MAP_CROSSHAIR_ENABLE_DISABLE,
  EVENT_NAMES.OVERVIEW_MAP.EVENT_OVERVIEW_MAP_TOGGLE,
];

export const payloadIsABoolean = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is BooleanPayload => {
  return validEvents.includes(verifyIfPayload.event);
};

export class BooleanPayload extends PayloadBaseClass {
  status: boolean;

  constructor(event: EventStringId, handlerName: string | null, status: boolean) {
    if (!validEvents.includes(event)) throw new Error(`BooleanPayload can't be instanciated for event of type ${event}`);
    super(event, handlerName);
    this.status = status;
  }
}

export const booleanPayload = (event: EventStringId, handlerName: string | null, status: boolean): BooleanPayload => {
  return new BooleanPayload(event, handlerName, status);
};
