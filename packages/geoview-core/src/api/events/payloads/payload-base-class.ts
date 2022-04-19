import { EventStringId } from '../event';

export class PayloadBaseClass {
  // Type of payload
  event: EventStringId;

  // the event handler name of the payload
  handlerName: string | null;

  constructor(event: EventStringId, handlerName: string | null) {
    this.event = event;
    this.handlerName = handlerName;
  }
}

export const payloadBaseClass = (event: EventStringId, handlerName: string | null): PayloadBaseClass => {
  return new PayloadBaseClass(event, handlerName);
};
