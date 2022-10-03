import { Coordinate } from 'ol/coordinate';
import { Pixel } from 'ol/pixel';
import { PayloadBaseClass } from './payload-base-class';
import { EventStringId } from '../event-types';
/**
 * Type Gard function that redefines a PayloadBaseClass as a GetFeatureInfoPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true of the payload is valid
 */
export declare const payloadIsGetFeatureInfo: (verifyIfPayload: PayloadBaseClass) => verifyIfPayload is GetFeatureInfoPayload;
export declare type TypeQueryType = 'at pixel' | 'at coordinate' | 'using a bounding box' | 'using a polygon';
export declare type TypeFeatureInfoQuery = {
    queryType: TypeQueryType;
    location: Pixel | Coordinate | Coordinate[];
};
export declare type TypeFeatureInfoEntry = Record<string, string | number | null> | Record<string, never>;
export declare type TypeFeatureInfoResult = null | TypeFeatureInfoEntry[];
export declare type TypeFeatureInfoRegister = {
    origin: 'layer' | 'panel';
};
/**
 * Class definition for GetFeatureInfoPayload
 *
 * @exports
 * @class GetFeatureInfoPayload
 */
export declare class GetFeatureInfoPayload extends PayloadBaseClass {
    data: TypeFeatureInfoQuery | TypeFeatureInfoResult | TypeFeatureInfoRegister | undefined;
    /**
     * Constructor for the class
     *
     * @param {EventStringId} event the event identifier for which the payload is constructed
     * @param {string | null} handlerName the handler Name (mapId/layerId)
     * @param {Coordinate} lnglat the long lat values carried by the payload
     */
    constructor(event: EventStringId, handlerName: string, data?: TypeFeatureInfoQuery | TypeFeatureInfoResult | TypeFeatureInfoRegister);
}
/**
 * Helper function used to instanciate a GetFeatureInfoPayload object. This function
 * avoids the "new GetFeatureInfoPayload" syntax.
 *
 * @param {EventStringId} event the event identifier for which the payload is constructed
 * @param {string | null} handlerName the handler Name
 * @param {Coordinate} lnglat the long lat values carried by the payload
 *
 * @returns {GetFeatureInfoPayload} the GetFeatureInfoPayload object created
 */
export declare const getFeatureInfoPayload: (event: EventStringId, handlerName: string, data?: TypeFeatureInfoQuery | TypeFeatureInfoResult | TypeFeatureInfoRegister) => GetFeatureInfoPayload;
