import { PayloadBaseClass } from './payload-base-class';
import { EventStringId } from '../event-types';
import { AbstractGeoViewLayer } from '../../../geo/layer/geoview-layers/abstract-geoview-layers';
/**
 * Type Gard function that redefines a PayloadBaseClass as a GeoViewLayerPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true of the payload is valid
 */
export declare const payloadIsAGeoViewLayer: (verifyIfPayload: PayloadBaseClass) => verifyIfPayload is GeoViewLayerPayload;
/**
 * Class definition for GeoViewLayerPayload
 *
 * @exports
 * @class GeoViewLayerPayload
 */
export declare class GeoViewLayerPayload extends PayloadBaseClass {
    geoviewLayer: AbstractGeoViewLayer;
    /**
     * Constructor for the class
     *
     * @param {EventStringId} event the event identifier for which the payload is constructed
     * @param {string | null} handlerName the handler Name
     * @param {AbstractGeoViewLayer} geoviewLayer the GeoView layer payload
     */
    constructor(event: EventStringId, handlerName: string | null, geoviewLayer: AbstractGeoViewLayer);
}
/**
 * Helper function used to instanciate a GeoViewLayerPayload object. This function
 * avoids the "new GeoViewLayerPayload" syntax.
 *
 * @param {EventStringId} event the event identifier for which the payload is constructed
 * @param {string | null} handlerName the handler Name
 * @param {AbstractGeoViewLayer} geoviewLayer the GeoView layer payload
 *
 * @returns {GeoViewLayerPayload} the GeoViewLayerPayload object created
 */
export declare const geoviewLayerPayload: (event: EventStringId, handlerName: string | null, geoviewLayer: AbstractGeoViewLayer) => GeoViewLayerPayload;
