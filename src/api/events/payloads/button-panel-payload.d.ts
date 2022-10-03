import { PayloadBaseClass } from './payload-base-class';
import { EventStringId } from '../event-types';
import { TypeButtonPanel } from '../../../ui/panel/panel-types';
/**
 * Type Gard function that redefines a PayloadBaseClass as a ButtonPanelPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true of the payload is valid
 */
export declare const payloadIsAButtonPanel: (verifyIfPayload: PayloadBaseClass) => verifyIfPayload is ButtonPanelPayload;
/**
 * Class definition for ButtonPanelPayload
 *
 * @exports
 * @class ButtonPanelPayload
 */
export declare class ButtonPanelPayload extends PayloadBaseClass {
    id: string;
    groupName: string;
    buttonPanel: TypeButtonPanel;
    /**
     * Constructor for the class
     *
     * @param {EventStringId} event the event identifier for which the payload is constructed
     * @param {string | null} handlerName the handler Name
     * @param {string} id the app-bar panel identifier carried by the payload
     * @param {string} groupName the app-bar panel group name carried by the payload
     * @param {TypeButtonPanel} buttonPanel optional button panel configuration carried by the payload
     *
     */
    constructor(event: EventStringId, handlerName: string | null, id: string, groupName: string, buttonPanel: TypeButtonPanel);
}
/**
 * Helper function used to instanciate a ButtonPanelPayload object. This function
 * avoids the "new ButtonPanelPayload" syntax.
 *
 * @param {EventStringId} event the event identifier for which the payload is constructed
 * @param {string | null} handlerName the handler Name
 * @param {string} id the app-bar panel identifier carried by the payload
 * @param {string} groupName the app-bar panel group name carried by the payload
 * @param {TypeButtonPanel} buttonPanel optional button panel configuration carried by the payload
 *
 * @returns {ButtonPanelPayload} the ButtonPanelPayload object created
 */
export declare const buttonPanelPayload: (event: EventStringId, handlerName: string | null, id: string, groupName: string, buttonPanel: TypeButtonPanel) => ButtonPanelPayload;
