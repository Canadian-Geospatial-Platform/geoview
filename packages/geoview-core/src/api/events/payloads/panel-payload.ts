import { ReactNode } from 'react';

import { PayloadBaseClass } from './payload-base-class';
import { EventStringId, EVENT_NAMES } from '../event-types';

/** Valid events that can create PanelPayload */
const validEvents: EventStringId[] = [EVENT_NAMES.PANEL.EVENT_PANEL_ADD_ACTION, EVENT_NAMES.PANEL.EVENT_PANEL_REMOVE_ACTION];

/** Valid events that can create PanelAndActionPayload  */
const validEvents4Action: EventStringId[] = [EVENT_NAMES.PANEL.EVENT_PANEL_ADD_ACTION, EVENT_NAMES.PANEL.EVENT_PANEL_REMOVE_ACTION];

/** Type used to define an action button  */
export type TypeActionButton = {
  actionButtonId: string;
  title?: string;
  children?: string | React.ReactElement | Element;
  action?: () => void;
};

/**
 * Additional attributes needed to define a PanelWithAButtonIdAndTypePayload
 */
export interface PanelWithAButtonIdAndTypePayload extends PanelPayload {
  // id of the button
  buttonId: string;

  // type of panel
  type: string;
}

/**
 * type guard function that redefines a PayloadBaseClass as a PanelAndActionPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export const payloadIsAPanelAction = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is PanelAndActionPayload => {
  return validEvents4Action.includes(verifyIfPayload?.event);
};

/**
 * Additional attributes needed to define a PanelAndActionPayload
 */
export interface PanelAndActionPayload extends PanelPayload {
  // id of the button
  buttonId: string;

  // action button configuration
  actionButton: TypeActionButton;
}

/**
 * Additional attributes needed to define a PanelAndContentPayload
 */
export interface PanelAndContentPayload extends PanelPayload {
  // id of the button
  buttonId: string;

  // action button configuration
  content: ReactNode;
}

/**
 * type guard function that redefines a PayloadBaseClass as a PanelPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export const payloadIsAPanel = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is PanelPayload => {
  return validEvents.includes(verifyIfPayload?.event);
};

/**
 * Class definition for PanelPayload
 *
 * @exports
 * @class PanelPayload
 */
export class PanelPayload extends PayloadBaseClass {
  /**
   * Constructor for the class
   *
   * @param {EventStringId} event the event identifier for which the payload is constructed
   * @param {string | null} handlerName the handler Name
   */
  constructor(event: EventStringId, handlerName: string | null) {
    if (!validEvents.includes(event)) throw new Error(`PanelPayload can't be instanciated for event of type ${event}`);
    super(event, handlerName);
  }

  /**
   * Static method used to create a panel payload with additional buton ID and panel type information
   *
   * @param {EventStringId} event the event identifier for which the payload is constructed
   * @param {string | null} handlerName the handler Name
   * @param {string} buttonId the panel buton id
   * @param {string} type the panel type
   *
   * @returns {PanelWithAButtonIdAndTypePayload} the PanelWithAButtonIdAndTypePayload object created
   */
  static withButtonIdAndType = (
    event: EventStringId,
    handlerName: string | null,
    buttonId: string,
    type: string
  ): PanelWithAButtonIdAndTypePayload => {
    const panelWithAButtonIdAndTypePayload = new PanelPayload(event, handlerName) as PanelWithAButtonIdAndTypePayload;
    panelWithAButtonIdAndTypePayload.buttonId = buttonId;
    panelWithAButtonIdAndTypePayload.type = type;
    return panelWithAButtonIdAndTypePayload;
  };

  /**
   * Static method used to create a panel payload with additional buton ID and action buton information
   *
   * @param {EventStringId} event the event identifier for which the payload is constructed
   * @param {string | null} handlerName the handler Name
   * @param {string} buttonId the panel buton id
   * @param {TypeActionButton} actionButton the action buton information
   *
   * @returns {PanelAndActionPayload} the PanelAndActionPayload object created
   */
  static withButtonIdAndActionButton = (
    event: EventStringId,
    handlerName: string | null,
    buttonId: string,
    actionButton: TypeActionButton
  ): PanelAndActionPayload => {
    if (!validEvents4Action.includes(event)) throw new Error(`PanelPayload can't use withButtonIdAndActionButton for ${event}`);
    const panelAndActionPayload = new PanelPayload(event, handlerName) as PanelAndActionPayload;
    panelAndActionPayload.buttonId = buttonId;
    panelAndActionPayload.actionButton = actionButton;
    return panelAndActionPayload;
  };

  /**
   * Static method used to create a panel payload with additional buton ID and content information
   *
   * @param {EventStringId} event the event identifier for which the payload is constructed
   * @param {string | null} handlerName the handler Name
   * @param {string} buttonId the panel buton id
   * @param {ReactNode} content the content object
   *
   * @returns {PanelAndContentPayload} the PanelAndContentPayload object created
   */
  static withButtonIdAndContent = (
    event: EventStringId,
    handlerName: string | null,
    buttonId: string,
    content: ReactNode
  ): PanelAndContentPayload => {
    const panelAndContentPayload = new PanelPayload(event, handlerName) as PanelAndContentPayload;
    panelAndContentPayload.buttonId = buttonId;
    panelAndContentPayload.content = content;
    return panelAndContentPayload;
  };
}

/**
 * Helper function used to instanciate a PanelPayload object. This function
 * avoids the "new PanelPayload" syntax.
 *
 * @param {EventStringId} event the event identifier for which the payload is constructed
 * @param {string | null} handlerName the handler Name
 *
 * @returns {PanelPayload} the PanelPayload object created
 */
export const panelPayload = (event: EventStringId, handlerName: string | null): PanelPayload => {
  return new PanelPayload(event, handlerName);
};
