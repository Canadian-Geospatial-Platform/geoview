import { PayloadBaseClass } from './payload-base-class';
import { EventStringId, EVENT_NAMES } from '../event';
import { TypeButtonPanel } from '../../../core/types/cgpv-types';

const validEvents: EventStringId[] = [
  EVENT_NAMES.APPBAR.EVENT_APPBAR_PANEL_CREATE,
  EVENT_NAMES.APPBAR.EVENT_APPBAR_PANEL_REMOVE,
  EVENT_NAMES.NAVBAR.EVENT_NAVBAR_BUTTON_PANEL_CREATE,
  EVENT_NAMES.NAVBAR.EVENT_NAVBAR_BUTTON_PANEL_REMOVE,
];

export const payloadIsAButtonPanel = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is ButtonPanelPayload => {
  return validEvents.includes(verifyIfPayload.event);
};

export class ButtonPanelPayload extends PayloadBaseClass {
  // handler id, generally the map id
  handlerId: string;

  // id of the appbar panel
  id: string;

  // group name for this appbar panel
  groupName: string;

  // button panel configuration
  buttonPanel?: TypeButtonPanel;

  constructor(
    event: EventStringId,
    handlerName: string | null,
    handlerId: string,
    id: string,
    groupName: string,
    buttonPanel?: TypeButtonPanel
  ) {
    if (!validEvents.includes(event)) throw new Error(`ButtonPanelPayload can't be instanciated for event of type ${event}`);
    super(event, handlerName);
    this.handlerId = handlerId;
    this.id = id;
    this.groupName = groupName;
    this.buttonPanel = buttonPanel;
  }
}

export const buttonPanelPayload = (
  event: EventStringId,
  handlerName: string | null,
  handlerId: string,
  id: string,
  groupName: string,
  buttonPanel?: TypeButtonPanel
): ButtonPanelPayload => {
  return new ButtonPanelPayload(event, handlerName, handlerId, id, groupName, buttonPanel);
};
