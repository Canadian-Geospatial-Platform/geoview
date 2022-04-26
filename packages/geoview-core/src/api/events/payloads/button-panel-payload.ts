import { PayloadBaseClass } from './payload-base-class';
import { EventStringId, EVENT_NAMES } from '../event';
import { TypeButtonPanel } from '../../../core/types/cgpv-types';

// Valid events that can create ButtonPanelPayload
const validEvents: EventStringId[] = [
  EVENT_NAMES.APPBAR.EVENT_APPBAR_PANEL_CREATE,
  EVENT_NAMES.APPBAR.EVENT_APPBAR_PANEL_REMOVE,
  EVENT_NAMES.NAVBAR.EVENT_NAVBAR_BUTTON_PANEL_CREATE,
  EVENT_NAMES.NAVBAR.EVENT_NAVBAR_BUTTON_PANEL_REMOVE,
];

/* ******************************************************************************************************************************
 * Type Gard function that redefines a PayloadBaseClass as a ButtonPanelPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the the true block of the if clause.
 *
 * @param {PayloadBaseClass} polymorphic object to test in order to determine if the type ascention is valid
 */
export const payloadIsAButtonPanel = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is ButtonPanelPayload => {
  return validEvents.includes(verifyIfPayload.event);
};

/* ******************************************************************************************************************************
 * Class definition for ButtonPanelPayload
 */
export class ButtonPanelPayload extends PayloadBaseClass {
  // id of the appbar panel
  id: string;

  // group name for this appbar panel
  groupName: string;

  // button panel configuration
  buttonPanel: TypeButtonPanel;

  /*
   * Constructor for the class
   *
   * @param {EventStringId} the event identifier for which the payload is constructed
   * @param {string | null} the handler Name
   * @param {string} the the appbar panel identifier carried by the payload
   * @param {string} the the appbar panel group name carried by the payload
   * @param {TypeButtonPanel} optional button panel configuration carried by the payload
   *
   * @returns {ButtonPanelPayload} the ButtonPanelPayload object created
   */
  constructor(event: EventStringId, handlerName: string | null, id: string, groupName: string, buttonPanel: TypeButtonPanel) {
    if (!validEvents.includes(event)) throw new Error(`ButtonPanelPayload can't be instanciated for event of type ${event}`);
    super(event, handlerName);
    this.id = id;
    this.groupName = groupName;
    this.buttonPanel = buttonPanel;
  }
}

/* ******************************************************************************************************************************
 * Helper function used to instanciate a ButtonPanelPayload object. This function
 * avoids the "new ButtonPanelPayload" syntax.
 *
 * @param {EventStringId} the event identifier for which the payload is constructed
 * @param {string | null} the handler Name
 * @param {string} the the appbar panel identifier carried by the payload
 * @param {string} the the appbar panel group name carried by the payload
 * @param {TypeButtonPanel} optional button panel configuration carried by the payload
 *
 * @returns {ButtonPanelPayload} the ButtonPanelPayload object created
 */
export const buttonPanelPayload = (
  event: EventStringId,
  handlerName: string | null,
  id: string,
  groupName: string,
  buttonPanel: TypeButtonPanel
): ButtonPanelPayload => {
  return new ButtonPanelPayload(event, handlerName, id, groupName, buttonPanel);
};
