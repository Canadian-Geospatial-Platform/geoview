import { PayloadBaseClass } from './payload-base-class';
import { EventStringId, EVENT_NAMES } from '../event';

const validEvents: EventStringId[] = [
  EVENT_NAMES.MODAL.EVENT_MODAL_CREATE,
  EVENT_NAMES.MODAL.EVENT_MODAL_OPEN,
  EVENT_NAMES.MODAL.EVENT_MODAL_CLOSE,
  EVENT_NAMES.MODAL.EVENT_MODAL_UPDATE,
];

export const payloadIsAModal = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is ModalPayload => {
  return validEvents.includes(verifyIfPayload.event);
};

export class ModalPayload extends PayloadBaseClass {
  id: string;

  open?: boolean;

  constructor(event: EventStringId, handlerName: string | null, id: string, open?: boolean) {
    if (!validEvents.includes(event)) throw new Error(`ModalPayload can't be instanciated for event of type ${event}`);
    super(event, handlerName);
    this.id = id;
    this.open = open;
  }
}

export const modalPayload = (event: EventStringId, handlerName: string | null, id: string, open?: boolean): ModalPayload => {
  return new ModalPayload(event, handlerName, id, open);
};
