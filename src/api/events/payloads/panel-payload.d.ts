/// <reference types="react" />
import { PayloadBaseClass } from './payload-base-class';
import { EventStringId } from '../event-types';
/** Type used to define an action button  */
export declare type TypeActionButton = {
    id: string;
    title?: string;
    children?: string | React.ReactElement | Element;
    action?: () => void;
};
/**
 * Type Gard function that redefines a PayloadBaseClass as a PanelWithAButtonIdAndTypePayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true of the payload is valid
 */
export declare const payloadHasAButtonIdAndType: (verifyIfPayload: PayloadBaseClass) => verifyIfPayload is PanelWithAButtonIdAndTypePayload;
/**
 * Additional attributes needed to define a PanelWithAButtonIdAndTypePayload
 */
export interface PanelWithAButtonIdAndTypePayload extends PanelPayload {
    buttonId: string;
    type: string;
}
/**
 * Type Gard function that redefines a PayloadBaseClass as a PanelAndActionPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true of the payload is valid
 */
export declare const payloadIsAPanelAction: (verifyIfPayload: PayloadBaseClass) => verifyIfPayload is PanelAndActionPayload;
/**
 * Additional attributes needed to define a PanelAndActionPayload
 */
export interface PanelAndActionPayload extends PanelPayload {
    buttonId: string;
    actionButton: TypeActionButton;
}
/**
 * Type Gard function that redefines a PayloadBaseClass as a PanelAndContentPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true of the payload is valid
 */
export declare const payloadIsAPanelContent: (verifyIfPayload: PayloadBaseClass) => verifyIfPayload is PanelAndContentPayload;
/**
 * Additional attributes needed to define a PanelAndContentPayload
 */
export interface PanelAndContentPayload extends PanelPayload {
    buttonId: string;
    content: Element | React.ReactNode;
}
/**
 * Type Gard function that redefines a PayloadBaseClass as a PanelPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true of the payload is valid
 */
export declare const payloadIsAPanel: (verifyIfPayload: PayloadBaseClass) => verifyIfPayload is PanelPayload;
/**
 * Class definition for PanelPayload
 *
 * @exports
 * @class PanelPayload
 */
export declare class PanelPayload extends PayloadBaseClass {
    /**
     * Constructor for the class
     *
     * @param {EventStringId} event the event identifier for which the payload is constructed
     * @param {string | null} handlerName the handler Name
     */
    constructor(event: EventStringId, handlerName: string | null);
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
    static withButtonIdAndType: (event: EventStringId, handlerName: string | null, buttonId: string, type: string) => PanelWithAButtonIdAndTypePayload;
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
    static withButtonIdAndActionButton: (event: EventStringId, handlerName: string | null, buttonId: string, actionButton: TypeActionButton) => PanelAndActionPayload;
    /**
     * Static method used to create a panel payload with additional buton ID and content information
     *
     * @param {EventStringId} event the event identifier for which the payload is constructed
     * @param {string | null} handlerName the handler Name
     * @param {string} buttonId the panel buton id
     * @param {Element | React.ReactNode} content the content object
     *
     * @returns {PanelAndContentPayload} the PanelAndContentPayload object created
     */
    static withButtonIdAndContent: (event: EventStringId, handlerName: string | null, buttonId: string, content: Element | React.ReactNode) => PanelAndContentPayload;
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
export declare const panelPayload: (event: EventStringId, handlerName: string | null) => PanelPayload;
