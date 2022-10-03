import { PayloadBaseClass } from './payload-base-class';
import { EventStringId } from '../event-types';
import { TypeBasemapLayer } from '../../../geo/layer/basemap/basemap-types';
/**
 * Type Gard function that redefines a PayloadBaseClass as a BasemapLayerArrayPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true of the payload is valid
 */
export declare const payloadIsABasemapLayerArray: (verifyIfPayload: PayloadBaseClass) => verifyIfPayload is BasemapLayerArrayPayload;
/**
 * Class definition for BasemapLayerArrayPayload
 *
 * @exports
 * @class BasemapLayerArrayPayload
 */
export declare class BasemapLayerArrayPayload extends PayloadBaseClass {
    layers: TypeBasemapLayer[];
    /**
     * Constructor for the class
     *
     * @param {EventStringId} event the event identifier for which the payload is constructed
     * @param {string | null} handlerName the handler Name
     * @param {TypeBasemapLayer[]} layers the layer array payload
     *
     */
    constructor(event: EventStringId, handlerName: string | null, layers: TypeBasemapLayer[]);
}
/**
 * Helper function used to instanciate a BasemapLayerArrayPayload object. This function
 * avoids the "new BasemapLayerArrayPayload" syntax.
 *
 * @param {EventStringId} event the event identifier for which the payload is constructed
 * @param {string | null} handlerName the handler Name
 * @param {TypeBasemapLayer[]} layers the layer array payload
 *
 * @returns {BasemapLayerArrayPayload} the BasemapLayerArrayPayload object created
 */
export declare const basemapLayerArrayPayload: (event: EventStringId, handlerName: string | null, layers: TypeBasemapLayer[]) => BasemapLayerArrayPayload;
