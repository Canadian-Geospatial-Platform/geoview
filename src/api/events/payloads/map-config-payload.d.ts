import { PayloadBaseClass } from './payload-base-class';
import { EventStringId } from '../event-types';
import { TypeMapFeaturesConfig } from '@/core/types/global-types';
/**
 * type guard function that redefines a PayloadBaseClass as a MapFeaturesPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export declare const payloadIsAmapFeaturesConfig: (verifyIfPayload: PayloadBaseClass) => verifyIfPayload is MapFeaturesPayload;
/**
 * Class definition for MapFeaturesPayload
 *
 * @exports
 * @class MapFeaturesPayload
 */
export declare class MapFeaturesPayload extends PayloadBaseClass {
    mapFeaturesConfig: TypeMapFeaturesConfig;
    /**
     * Constructor for the class
     *
     * @param {EventStringId} event the event identifier for which the payload is constructed
     * @param {string | null} handlerName the handler Name
     * @param {TypeMapFeaturesConfig} mapFeatures the map features configuration
     */
    constructor(event: EventStringId, handlerName: string | null, mapFeaturesConfig: TypeMapFeaturesConfig);
}
/**
 * Helper function used to instanciate a MapFeaturesPayload object. This function
 * avoids the "new MapFeaturesPayload" syntax.
 *
 * @param {EventStringId} event the event identifier for which the payload is constructed
 * @param {string | null} handlerName the handler Name
 * @param {TypeMapFeaturesConfig} config the map configuration
 *
 * @returns {MapFeaturesPayload} the MapFeaturesPayload object created
 */
export declare const mapConfigPayload: (event: EventStringId, handlerName: string | null, config: TypeMapFeaturesConfig) => MapFeaturesPayload;
