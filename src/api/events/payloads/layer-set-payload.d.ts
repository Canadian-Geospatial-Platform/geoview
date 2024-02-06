import { PayloadBaseClass } from './payload-base-class';
import { EventStringId } from '../event-types';
import { TypeLayerStatus } from '@/geo/map/map-schema-types';
export type TypeResultsSet = {
    [layerPath: string]: {
        layerName?: string;
        layerStatus: TypeLayerStatus;
        layerPhase: string;
        data: any | null;
    };
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
    /** An object containing the result sets indexed using the layer path */
    resultsSet: TypeResultsSet;
    layerPath: string;
}
/**
 * type guard function that redefines a PayloadBaseClass as a TypeLayerSetChangeLayerStatusPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export declare const payloadIsLayerSetChangeLayerStatus: (verifyIfPayload: PayloadBaseClass) => verifyIfPayload is TypeLayerSetChangeLayerStatusPayload;
/**
 * type guard function that redefines a PayloadBaseClass as a TypeLayerSetChangeLayerPhasePayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export declare const payloadIsLayerSetChangeLayerPhase: (verifyIfPayload: PayloadBaseClass) => verifyIfPayload is TypeLayerSetChangeLayerPhasePayload;
/**
 * Additional attributes needed to define a TypeLayerSetChangeLayerStatusPayload
 */
export interface TypeLayerSetChangeLayerStatusPayload extends LayerSetPayload {
    layerPath: string;
    layerStatus: TypeLayerStatus;
}
/**
 * Additional attributes needed to define a TypeLayerSetChangeLayerPhasePayload
 */
export interface TypeLayerSetChangeLayerPhasePayload extends LayerSetPayload {
    layerPath: string;
    layerPhase: string;
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
     * @param {'add' | 'remove'} action the kind of layer registration (default: add)
     * @param {string | undefined} layerSetId the layer set identifier that will register the layer
     *
     * @returns {TypeLayerRegistrationPayload} the registerLayerPayload object created
     */
    static createLayerRegistrationPayload: (handlerName: string, layerPath: string, action?: 'add' | 'remove', layerSetId?: string | undefined) => TypeLayerRegistrationPayload;
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
     * Static method used to create a layer set payload when we need to change a layer status
     *
     * @param {string} handlerName the handler Name
     * @param {string} layerPath the layer path affected by the change
     * @param {TypeLayerStatus} layerStatus the value to assign to the layerStatus property
     *
     * @returns {TypelayerSetUpdatedPayload} the requestLayerInventoryPayload object created
     */
    static createLayerSetChangeLayerStatusPayload: (handlerName: string, layerPath: string, layerStatus: TypeLayerStatus) => TypeLayerSetChangeLayerStatusPayload;
    /**
     * Static method used to create a layer set payload when we need to change a layer phase
     *
     * @param {string} handlerName the handler Name
     * @param {string} layerPath the layer path affected by the change
     * @param {string} layerPhase the value to assign to the layerPhase property
     *
     * @returns {TypelayerSetUpdatedPayload} the requestLayerInventoryPayload object created
     */
    static createLayerSetChangeLayerPhasePayload: (handlerName: string, layerPath: string, layerPhase: string) => TypeLayerSetChangeLayerPhasePayload;
    /**
     * Static method used to create a layer set payload sent when a layer is updated
     *
     * @param {string | null} handlerName the handler Name
     * @param {string} LayerSetId the layer set identifier that has changed
     *
     * @returns {TypelayerSetUpdatedPayload} the requestLayerInventoryPayload object created
     */
    static createLayerSetUpdatedPayload: (handlerName: string, resultsSet: TypeResultsSet, layerPath: string) => TypelayerSetUpdatedPayload;
}
