import { PayloadBaseClass } from './payload-base-class';
import { EventStringId, EVENT_NAMES } from '../event';

// Valid events that can create PanelPayload
const validEvents: EventStringId[] = [
  EVENT_NAMES.PANEL.EVENT_PANEL_OPEN,
  EVENT_NAMES.PANEL.EVENT_PANEL_CLOSE,
  EVENT_NAMES.PANEL.EVENT_PANEL_ADD_ACTION,
  EVENT_NAMES.PANEL.EVENT_PANEL_REMOVE_ACTION,
  EVENT_NAMES.PANEL.EVENT_PANEL_CHANGE_CONTENT,
];

// Valid events that can create PanelWithAButtonIdAndTypePayload
const validEvents4ButtonIdAndType: EventStringId[] = [EVENT_NAMES.PANEL.EVENT_PANEL_OPEN, EVENT_NAMES.PANEL.EVENT_PANEL_CLOSE];

// Valid events that can create PanelAndActionPayload
const validEvents4Action: EventStringId[] = [EVENT_NAMES.PANEL.EVENT_PANEL_ADD_ACTION, EVENT_NAMES.PANEL.EVENT_PANEL_REMOVE_ACTION];

// Valid events that can create PanelAndContentPayload
const validEvents4Content: EventStringId[] = [EVENT_NAMES.PANEL.EVENT_PANEL_CHANGE_CONTENT];

// Type used to define an action button
export type TypeActionButton = {
  id: string;
  title?: string;
  icon?: string | React.ReactElement | Element;
  action?: () => void;
};

/* ******************************************************************************************************************************
 * Type Gard function that redefines a PayloadBaseClass as a PanelWithAButtonIdAndTypePayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the the true block of the if clause.
 *
 * @param {PayloadBaseClass} polymorphic object to test in order to determine if the type ascention is valid
 */
export const payloadHasAButtonIdAndType = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is PanelWithAButtonIdAndTypePayload => {
  return validEvents4ButtonIdAndType.includes(verifyIfPayload.event);
};

/*
 * Additional attributes needed to define a PanelWithAButtonIdAndTypePayload
 */
export interface PanelWithAButtonIdAndTypePayload extends PanelPayload {
  // id of the button
  buttonId: string;

  // type of panel
  type: string;
}

/* ******************************************************************************************************************************
 * Type Gard function that redefines a PayloadBaseClass as a PanelAndActionPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the the true block of the if clause.
 *
 * @param {PayloadBaseClass} polymorphic object to test in order to determine if the type ascention is valid
 */
export const payloadIsAPanelAction = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is PanelAndActionPayload => {
  return validEvents4Action.includes(verifyIfPayload.event);
};

/*
 * Additional attributes needed to define a PanelAndActionPayload
 */
export interface PanelAndActionPayload extends PanelPayload {
  // id of the button
  buttonId: string;

  // action button configuration
  actionButton: TypeActionButton;
}

/* ******************************************************************************************************************************
 * Type Gard function that redefines a PayloadBaseClass as a PanelAndContentPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the the true block of the if clause.
 *
 * @param {PayloadBaseClass} polymorphic object to test in order to determine if the type ascention is valid
 */
export const payloadIsAPanelContent = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is PanelAndContentPayload => {
  return validEvents4Content.includes(verifyIfPayload.event);
};

/*
 * Additional attributes needed to define a PanelAndContentPayload
 */
export interface PanelAndContentPayload extends PanelPayload {
  // id of the button
  buttonId: string;

  // action button configuration
  content: Element | React.ReactNode;
}

/* ******************************************************************************************************************************
 * Type Gard function that redefines a PayloadBaseClass as a PanelPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the the true block of the if clause.
 *
 * @param {PayloadBaseClass} polymorphic object to test in order to determine if the type ascention is valid
 */
export const payloadIsAPanel = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is PanelPayload => {
  return validEvents.includes(verifyIfPayload.event);
};

/* ******************************************************************************************************************************
 * Class definition for PanelPayload
 */
export class PanelPayload extends PayloadBaseClass {
  // handler id, generally the map id
  handlerId: string;

  /*
   * Constructor for the class
   *
   * @param {EventStringId} the event identifier for which the payload is constructed
   * @param {string | null} the handler Name
   * @param {string} the panel handler id
   *
   * @returns {PanelPayload} the PanelPayload object created
   */
  constructor(event: EventStringId, handlerName: string | null, handlerId: string) {
    if (!validEvents.includes(event)) throw new Error(`PanelPayload can't be instanciated for event of type ${event}`);
    super(event, handlerName);
    this.handlerId = handlerId;
  }

  /*
   * Static method used to create a panel payload with additional buton ID and panel type information
   *
   * @param {EventStringId} the event identifier for which the payload is constructed
   * @param {string | null} the handler Name
   * @param {string} the panel handler id
   * @param {string} the panel buton id
   * @param {string} the panel type
   *
   * @returns {PanelWithAButtonIdAndTypePayload} the PanelWithAButtonIdAndTypePayload object created
   */
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

  /*
   * Static method used to create a panel payload with additional buton ID and action buton information
   *
   * @param {EventStringId} the event identifier for which the payload is constructed
   * @param {string | null} the handler Name
   * @param {string} the panel handler id
   * @param {string} the panel buton id
   * @param {TypeActionButton} the action buton information
   *
   * @returns {PanelAndActionPayload} the PanelAndActionPayload object created
   */
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

  /*
   * Static method used to create a panel payload with additional buton ID and content information
   *
   * @param {EventStringId} the event identifier for which the payload is constructed
   * @param {string | null} the handler Name
   * @param {string} the panel handler id
   * @param {string} the panel buton id
   * @param {Element | React.ReactNode} the content object
   *
   * @returns {PanelAndContentPayload} the PanelAndContentPayload object created
   */
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

/* ******************************************************************************************************************************
 * Helper function used to instanciate a PanelPayload object. This function
 * avoids the "new PanelPayload" syntax.
 *
 * @param {EventStringId} the event identifier for which the payload is constructed
 * @param {string | null} the handler Name
 * @param {handlerId} the panel handler id
 *
 * @returns {PanelPayload} the PanelPayload object created
 */
export const panelPayload = (event: EventStringId, handlerName: string | null, handlerId: string): PanelPayload => {
  return new PanelPayload(event, handlerName, handlerId);
};
