import { PayloadBaseClass } from './payload-base-class';
import { EventStringId } from '../event-types';
import { AbstractGeoViewLayer } from '../../../geo/layer/geoview-layers/abstract-geoview-layers';
/**
 * type guard function that redefines a PayloadBaseClass as a TypeGeoviewLayerAddedPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 *
 * @returns {boolean} returns true if the payload is valid
 */
export declare const payloadIsGeoViewLayerAdded: (verifyIfPayload: PayloadBaseClass) => verifyIfPayload is TypeGeoviewLayerAddedPayload;
/**
 * Additional attributes needed to define a TypeGeoviewLayerAddedPayload
 */
export interface TypeGeoviewLayerAddedPayload extends GeoViewLayerPayload {
    geoviewLayer: AbstractGeoViewLayer;
}
/**
 * type guard function that redefines a PayloadBaseClass as a TypeRemoveGeoviewLayerPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 *
 * @returns {boolean} returns true if the payload is valid
 */
export declare const payloadIsRemoveGeoViewLayer: (verifyIfPayload: PayloadBaseClass) => verifyIfPayload is TypeRemoveGeoviewLayerPayload;
/**
 * Additional attributes needed to define a TypeGeoviewLayerRemovedPayload
 */
export interface TypeRemoveGeoviewLayerPayload extends GeoViewLayerPayload {
    geoviewLayer: AbstractGeoViewLayer;
}
/**
 * type guard function that redefines a PayloadBaseClass as a TypeTestGeoviewLayersPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 *
 * @returns {boolean} returns true if the payload is valid
 */
export declare const payloadIsTestGeoViewLayers: (verifyIfPayload: PayloadBaseClass) => verifyIfPayload is GeoViewLayerPayload;
/**
 * Additional attributes needed to define a TypeGeoviewLayerRemovedPayload
 */
export type TypeTestGeoviewLayersPayload = GeoViewLayerPayload;
/**
 * Class definition for GeoViewLayerPayload
 *
 * @exports
 * @class GeoViewLayerPayload
 */
export declare class GeoViewLayerPayload extends PayloadBaseClass {
    geoviewLayer: AbstractGeoViewLayer | undefined;
    /**
     * Constructor for the class
     *
     * @param {EventStringId} event the event identifier for which the payload is constructed
     * @param {string} handlerName the handler Name
     * @param {AbstractGeoViewLayer} geoviewLayer the GeoView layer payload
     */
    constructor(event: EventStringId, handlerName: string, geoviewLayer?: AbstractGeoViewLayer);
    /**
     * Static method used to create a layer added payload.
     *
     * @param {string} handlerName the handler Name
     * @param {AbstractGeoViewLayer} geoviewLayer the GeoView layer to assign to the payload
     *
     * @returns {TypeGeoviewLayerAddedPayload} the GeoViewLayerPayload object created
     */
    static createGeoviewLayerAddedPayload: (handlerName: string, geoviewLayer: AbstractGeoViewLayer) => TypeGeoviewLayerAddedPayload;
    /**
     * Static method used to create a layer removed payload.
     *
     * @param {string} handlerName the handler Name
     * @param {AbstractGeoViewLayer} geoviewLayer the GeoView layer to assign to the payload
     *
     * @returns {TypeRemoveGeoviewLayerPayload} the GeoViewLayerPayload object created
     */
    static createRemoveGeoviewLayerPayload: (handlerName: string, geoviewLayer: AbstractGeoViewLayer) => TypeRemoveGeoviewLayerPayload;
    /**
     * Static method used to create a test geoview layers payload.
     *
     * @param {string} handlerName the handler Name
     *
     * @returns {TypeTestGeoviewLayersPayload} the GeoViewLayerPayload object created
     */
    static createTestGeoviewLayersPayload: (handlerName: string) => TypeTestGeoviewLayersPayload;
}
