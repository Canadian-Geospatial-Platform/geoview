import { PayloadBaseClass } from './payload-base-class';
import { EventStringId, EVENT_NAMES } from '../event';

const validEvents: EventStringId[] = [
  EVENT_NAMES.PANEL.EVENT_PANEL_OPEN,
  EVENT_NAMES.PANEL.EVENT_PANEL_CLOSE,
  EVENT_NAMES.PANEL.EVENT_PANEL_ADD_ACTION,
  EVENT_NAMES.PANEL.EVENT_PANEL_REMOVE_ACTION,
  EVENT_NAMES.PANEL.EVENT_PANEL_CHANGE_CONTENT,
];

const validEvents4ButtonIdAndType: EventStringId[] = [EVENT_NAMES.PANEL.EVENT_PANEL_OPEN, EVENT_NAMES.PANEL.EVENT_PANEL_CLOSE];

const validEvents4Action: EventStringId[] = [EVENT_NAMES.PANEL.EVENT_PANEL_ADD_ACTION, EVENT_NAMES.PANEL.EVENT_PANEL_REMOVE_ACTION];

const validEvents4Content: EventStringId[] = [EVENT_NAMES.PANEL.EVENT_PANEL_CHANGE_CONTENT];

export type TypeActionButton = {
  id: string;
  title?: string;
  icon?: string | React.ReactElement | Element;
  action?: () => void;
};

export const payloadHasAButtonIdAndType = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is PanelWithAButtonIdAndTypePayload => {
  return validEvents4ButtonIdAndType.includes(verifyIfPayload.event);
};

export interface PanelWithAButtonIdAndTypePayload extends PanelPayload {
  // id of the button
  buttonId: string;

  // type of panel
  type: string;
}

export const payloadIsAPanelAction = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is PanelAndActionPayload => {
  return validEvents4Action.includes(verifyIfPayload.event);
};

export interface PanelAndActionPayload extends PanelPayload {
  // id of the button
  buttonId: string;

  // action button configuration
  actionButton: TypeActionButton;
}

export const payloadIsAPanelContent = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is PanelAndContentPayload => {
  return validEvents4Content.includes(verifyIfPayload.event);
};

export interface PanelAndContentPayload extends PanelPayload {
  // id of the button
  buttonId: string;

  // action button configuration
  content: Element | React.ReactNode;
}

export const payloadIsAPanel = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is PanelPayload => {
  return validEvents.includes(verifyIfPayload.event);
};

export class PanelPayload extends PayloadBaseClass {
  // handler id, generally the map id
  handlerId: string;

  constructor(event: EventStringId, handlerName: string | null, handlerId: string) {
    if (!validEvents.includes(event)) throw new Error(`PanelPayload can't be instanciated for event of type ${event}`);
    super(event, handlerName);
    this.handlerId = handlerId;
  }

  static withButtonIdAndType = (
    event: EventStringId,
    handlerName: string | null,
    handlerId: string,
    buttonId: string,
    type: string
  ): PanelWithAButtonIdAndTypePayload => {
    if (!validEvents4ButtonIdAndType.includes(event)) throw new Error(`PanelPayload can't use withButtonIdAndType for ${event}`);
    const panelWithAButtonIdAndTypePayload = new PanelPayload(event, handlerName, handlerId) as PanelWithAButtonIdAndTypePayload;
    panelWithAButtonIdAndTypePayload.buttonId = buttonId;
    panelWithAButtonIdAndTypePayload.type = type;
    return panelWithAButtonIdAndTypePayload;
  };

  static withButtonIdAndActionButton = (
    event: EventStringId,
    handlerName: string | null,
    handlerId: string,
    buttonId: string,
    actionButton: TypeActionButton
  ): PanelAndActionPayload => {
    if (!validEvents4Action.includes(event)) throw new Error(`PanelPayload can't use withButtonIdAndActionButton for ${event}`);
    const panelAndActionPayload = new PanelPayload(event, handlerName, handlerId) as PanelAndActionPayload;
    panelAndActionPayload.buttonId = buttonId;
    panelAndActionPayload.actionButton = actionButton;
    return panelAndActionPayload;
  };

  static withButtonIdAndContent = (
    event: EventStringId,
    handlerName: string | null,
    handlerId: string,
    buttonId: string,
    content: Element | React.ReactNode
  ): PanelAndContentPayload => {
    if (!validEvents4Content.includes(event)) throw new Error(`PanelPayload can't use withButtonIdAndContent for ${event}`);
    const panelAndContentPayload = new PanelPayload(event, handlerName, handlerId) as PanelAndContentPayload;
    panelAndContentPayload.buttonId = buttonId;
    panelAndContentPayload.content = content;
    return panelAndContentPayload;
  };
}

export const panelPayload = (event: EventStringId, handlerName: string | null, handlerId: string): PanelPayload => {
  return new PanelPayload(event, handlerName, handlerId);
};
