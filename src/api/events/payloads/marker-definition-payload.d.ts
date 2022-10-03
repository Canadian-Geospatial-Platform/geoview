import { Coordinate } from 'ol/coordinate';
import { PayloadBaseClass } from './payload-base-class';
import { EventStringId } from '../event-types';
import { TypeJsonObject } from '../../../core/types/global-types';
/**
 * Type Gard function that redefines a PayloadBaseClass as a MarkerDefinitionPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true of the payload is valid
 */
export declare const payloadIsAMarkerDefinition: (verifyIfPayload: PayloadBaseClass) => verifyIfPayload is MarkerDefinitionPayload;
/**
 * Class definition for MarkerDefinitionPayload
 *
 * @exports
 * @class MarkerDefinitionPayload
 */
export declare class MarkerDefinitionPayload extends PayloadBaseClass {
    lnglat: Coordinate;
    symbology: TypeJsonObject;
    /**
     * Constructor for the class
     *
     * @param {EventStringId} event the event identifier for which the payload is constructed
     * @param {string | null} handlerName the handler Name
     * @param {Coordinate} lnglat the marker coordinate
     * @param {TypeJsonObject} symbology the marker symbology
     */
    constructor(event: EventStringId, handlerName: string | null, lnglat: Coordinate, symbology: TypeJsonObject);
}
/**
 * Helper function used to instanciate a MarkerDefinitionPayload object. This function
 * avoids the "new MarkerDefinitionPayload" syntax.
 *
 * @param {EventStringId} event the event identifier for which the payload is constructed
 * @param {string | null} handlerName the handler Name
 * @param {Coordinate} lnglat the marker coordinate
 * @param {TypeJsonObject} symbology the marker symbology
 *
 * @returns {MarkerDefinitionPayload} the MarkerDefinitionPayload object created
 */
export declare const markerDefinitionPayload: (event: EventStringId, handlerName: string | null, lnglat: Coordinate, symbology: TypeJsonObject) => MarkerDefinitionPayload;
