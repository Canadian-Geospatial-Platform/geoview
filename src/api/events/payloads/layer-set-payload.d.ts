import { PayloadBaseClass } from './payload-base-class';
import { EventStringId } from '../event-types';
export type TypeResultSets = {
    [layerPath: string]: any | null;
};
/**
 * type guard function that redefines a PayloadBaseClass as a TypeLayerRegistrationPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export declare const payloadIsLayerRegistration: (verifyIfPayload: PayloadBaseClass) => verifyIfPayload is TypeLayerRegistrationPayload;
/**
 * Additional attribute needed to define a TypeLayerRegistrationPayload
 */
export interface TypeLayerRegistrationPayload extends LayerSetPayload {
    layerPath: string;
    layerSetId?: string;
    action: 'add' | 'remove';
}
/**
 * type guard function that redefines a PayloadBaseClass as a TypeRequestLayerInventoryPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export declare const payloadIsRequestLayerInventory: (verifyIfPayload: PayloadBaseClass) => verifyIfPayload is TypeRequestLayerInventoryPayload;
/**
 * Additional attribute needed to define a TypeRequestLayerInventoryPayload
 */
export interface TypeRequestLayerInventoryPayload extends LayerSetPayload {
    layerSetId: string;
}
/**
 * type guard function that redefines a PayloadBaseClass as a TypelayerSetUpdatedPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export declare const payloadIsLayerSetUpdated: (verifyIfPayload: PayloadBaseClass) => verifyIfPayload is TypelayerSetUpdatedPayload;
/**
 * Additional attribute needed to define a TypelayerSetUpdatedPayload
 */
export interface TypelayerSetUpdatedPayload extends LayerSetPayload {
    layerSetId: string;
}
/**
 * type guard function that redefines a PayloadBaseClass as a LayerSetPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export declare const payloadIsLayerSet: (verifyIfPayload: PayloadBaseClass) => verifyIfPayload is LayerSetPayload;
/**
 * Class definition for LayerSetPayload
 *
 * @exports
 * @class LayerSetPayload
 */
export declare class LayerSetPayload extends PayloadBaseClass {
    /**
     * Constructor for the class
     *
     * @param {EventStringId} event the event identifier for which the payload is constructed
     * @param {string | null} handlerName the handler Name (mapId/layerPath)
     */
    constructor(event: EventStringId, handlerName: string);
    /**
     * Static method used to create a layer set payload that will register a new layer in the layer set inventory
     *
     * @param {string | null} handlerName the handler Name
     * @param {string} layerPath the layer path to add to the inventory
     *
     * @returns {TypeLayerRegistrationPayload} the registerLayerPayload object created
     */
    static createLayerRegistrationPayload: (handlerName: string, layerPath: string, action?: 'add' | 'remove' | undefined, layerSetId?: string | undefined) => TypeLayerRegistrationPayload;
    /**
     * Static method used to create a layer set payload requesting a layer inventory
     *
     * @param {string | null} handlerName the handler Name
     * @param {string} layerSetId the layer set identifier that will receive the inventory
     *
     * @returns {TypeRequestLayerInventoryPayload} the requestLayerInventoryPayload object created
     */
    static createRequestLayerInventoryPayload: (handlerName: string, layerSetId: string) => TypeRequestLayerInventoryPayload;
    /**
     * Static method used to create a layer set payload sent when a layer is updated
     *
     * @param {string | null} handlerName the handler Name
     * @param {string} LayerSetId the layer set identifier that has changed
     *
     * @returns {TypelayerSetUpdatedPayload} the requestLayerInventoryPayload object created
     */
    static createLayerSetUpdatedPayload: (handlerName: string, layerSetId: string) => TypelayerSetUpdatedPayload;
}
