import { PayloadBaseClass } from './payload-base-class';

import { EventStringId, EVENT_NAMES } from '../event-types';
import { TypeButtonPanel } from '@/ui/panel/panel-types';

/** Valid events that can create ButtonPanelPayload */
const validEvents: EventStringId[] = [
  EVENT_NAMES.APPBAR.EVENT_APPBAR_PANEL_CREATE,
  EVENT_NAMES.APPBAR.EVENT_APPBAR_PANEL_REMOVE,
  EVENT_NAMES.NAVBAR.EVENT_NAVBAR_BUTTON_PANEL_CREATE,
  EVENT_NAMES.NAVBAR.EVENT_NAVBAR_BUTTON_PANEL_REMOVE,
];

/**
 * type guard function that redefines a PayloadBaseClass as a ButtonPanelPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export const payloadIsAButtonPanel = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is ButtonPanelPayload => {
  return validEvents.includes(verifyIfPayload?.event);
};

/**
 * Class definition for ButtonPanelPayload
 *
 * @exports
 * @class ButtonPanelPayload
 */
export class ButtonPanelPayload extends PayloadBaseClass {
  // id of the app-bar panel
  appBarId: string;

  // group name for this app-bar panel
  appBarGroupName: string;

  // button panel configuration
  buttonPanel: TypeButtonPanel;

  /**
   * Constructor for the class
   *
   * @param {EventStringId} event the event identifier for which the payload is constructed
   * @param {string | null} handlerName the handler Name
   * @param {string} appBarId the app-bar panel identifier carried by the payload
   * @param {string} appBarGroupName the app-bar panel group name carried by the payload
   * @param {TypeButtonPanel} buttonPanel optional button panel configuration carried by the payload
   *
   */
  constructor(event: EventStringId, handlerName: string | null, appBarId: string, appBarGroupName: string, buttonPanel: TypeButtonPanel) {
    if (!validEvents.includes(event)) throw new Error(`ButtonPanelPayload can't be instanciated for event of type ${event}`);
    super(event, handlerName);
    this.appBarId = appBarId;
    this.appBarGroupName = appBarGroupName;
    this.buttonPanel = buttonPanel;
  }
}

/**
 * Helper function used to instanciate a ButtonPanelPayload object. This function
 * avoids the "new ButtonPanelPayload" syntax.
 *
 * @param {EventStringId} event the event identifier for which the payload is constructed
 * @param {string | null} handlerName the handler Name
 * @param {string} appBarId the app-bar panel identifier carried by the payload
 * @param {string} appBarGroupName the app-bar panel group name carried by the payload
 * @param {TypeButtonPanel} buttonPanel optional button panel configuration carried by the payload
 *
 * @returns {ButtonPanelPayload} the ButtonPanelPayload object created
 */
export const buttonPanelPayload = (
  event: EventStringId,
  handlerName: string | null,
  appBarId: string,
  appBarGroupName: string,
  buttonPanel: TypeButtonPanel
): ButtonPanelPayload => {
  return new ButtonPanelPayload(event, handlerName, appBarId, appBarGroupName, buttonPanel);
};
