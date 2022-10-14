import { Coordinate } from 'ol/coordinate';
import { Pixel } from 'ol/pixel';

import { PayloadBaseClass } from './payload-base-class';

import { EventStringId, EVENT_NAMES } from '../event-types';

/** Valid events that can create GetFeatureInfoPayload */
const validEvents: EventStringId[] = [
  EVENT_NAMES.GET_FEATURE_INFO.REGISTER,
  EVENT_NAMES.GET_FEATURE_INFO.QUERY_LAYER,
  EVENT_NAMES.GET_FEATURE_INFO.QUERY_RESULT,
];

/**
 * Type Gard function that redefines a PayloadBaseClass as a GetFeatureInfoPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true of the payload is valid
 */
export const payloadIsGetFeatureInfo = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is GetFeatureInfoPayload => {
  return validEvents.includes(verifyIfPayload.event);
};

export type TypeQueryType = 'at pixel' | 'at coordinate' | 'at long lat' | 'using a bounding box' | 'using a polygon';

export type TypeFeatureInfoQuery = {
  queryType: TypeQueryType;
  location: Pixel | Coordinate | Coordinate[];
};

export type TypeFeatureInfoEntry = Record<string, string | number | null> | Record<string, never>;

export type TypeFeatureInfoResult = null | TypeFeatureInfoEntry[];

export type TypeFeatureInfoRegister = { origin: 'layer' | 'panel' };

/**
 * Class definition for GetFeatureInfoPayload
 *
 * @exports
 * @class GetFeatureInfoPayload
 */
export class GetFeatureInfoPayload extends PayloadBaseClass {
  data: TypeFeatureInfoQuery | TypeFeatureInfoResult | TypeFeatureInfoRegister | undefined;

  /**
   * Constructor for the class
   *
   * @param {EventStringId} event the event identifier for which the payload is constructed
   * @param {string | null} handlerName the handler Name (mapId/layerId)
   * @param {Coordinate} lnglat the long lat values carried by the payload
   */
  constructor(event: EventStringId, handlerName: string, data?: TypeFeatureInfoQuery | TypeFeatureInfoResult | TypeFeatureInfoRegister) {
    if (!validEvents.includes(event)) throw new Error(`GetFeatureInfoPayload can't be instanciated for event of type ${event}`);
    super(event, handlerName);
    this.data = data;
  }
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
export const getFeatureInfoPayload = (
  event: EventStringId,
  handlerName: string,
  data?: TypeFeatureInfoQuery | TypeFeatureInfoResult | TypeFeatureInfoRegister
): GetFeatureInfoPayload => {
  return new GetFeatureInfoPayload(event, handlerName, data);
};
