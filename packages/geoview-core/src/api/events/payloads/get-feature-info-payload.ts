import { Coordinate } from 'ol/coordinate';
import { Pixel } from 'ol/pixel';

import { PayloadBaseClass } from './payload-base-class';

import { EventStringId, EVENT_NAMES } from '../event-types';

/** Valid events that can create GetFeatureInfoPayload */
const validEvents: EventStringId[] = [
  EVENT_NAMES.GET_FEATURE_INFO.QUERY_LAYER,
  EVENT_NAMES.GET_FEATURE_INFO.QUERY_RESULT,
  EVENT_NAMES.GET_FEATURE_INFO.REGISTER_LAYER,
  EVENT_NAMES.GET_FEATURE_INFO.REQUEST_LAYER_INVENTORY,
];

export type TypeQueryType = 'at pixel' | 'at coordinate' | 'at long lat' | 'using a bounding box' | 'using a polygon';

export type TypeFeatureInfoEntry = Record<string, string | number | null> | Record<string, never>;
export type TypeArrayOfRecords = TypeFeatureInfoEntry[];

export type TypeFeatureInfoRegister = {
  layerPath?: string;
};

/**
 * Type Gard function that redefines a PayloadBaseClass as a TypeQueryLayerPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export const payloadIsQueryLayer = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is TypeQueryLayerPayload => {
  return verifyIfPayload.event === EVENT_NAMES.GET_FEATURE_INFO.QUERY_LAYER;
};

/**
 * Additional attributes needed to define a GetFeatureInfoPayload
 */
export interface TypeQueryLayerPayload extends GetFeatureInfoPayload {
  // The query type to perform
  queryType: TypeQueryType;
  // the location to query
  location: Pixel | Coordinate | Coordinate[];
}

/**
 * Type Gard function that redefines a PayloadBaseClass as a TypeQueryResultPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export const payloadIsQueryResult = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is TypeQueryResultPayload => {
  return verifyIfPayload.event === EVENT_NAMES.GET_FEATURE_INFO.QUERY_LAYER;
};

/**
 * Additional attributes needed to define a GetFeatureInfoPayload
 */
export interface TypeQueryResultPayload extends GetFeatureInfoPayload {
  // the layer path used by the query
  layerPath: string;
  // the resultset of the query
  arrayOfRecords: TypeArrayOfRecords;
}

/**
 * Type Gard function that redefines a PayloadBaseClass as a TypeRegisterLayerPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export const payloadIsRegisterLayer = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is TypeRegisterLayerPayload => {
  return verifyIfPayload.event === EVENT_NAMES.GET_FEATURE_INFO.REQUEST_LAYER_INVENTORY;
};

/**
 * Additional attribute needed to define a TypeRegisterLayerPayload
 */
export interface TypeRegisterLayerPayload extends GetFeatureInfoPayload {
  // the layer path to add to or remove from the inventory
  action: 'add' | 'remove';
  layerPath: string;
}

/**
 * Type Gard function that redefines a PayloadBaseClass as a TypeRequestLayerInventoryPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export const payloadIsRequestLayerInventory = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is TypeRequestLayerInventoryPayload => {
  return verifyIfPayload.event === EVENT_NAMES.GET_FEATURE_INFO.REQUEST_LAYER_INVENTORY;
};

/**
 * Additional attribute needed to define a TypeRequestLayerInventoryPayload
 */
export interface TypeRequestLayerInventoryPayload extends GetFeatureInfoPayload {
  // The object identifier that will receive the inventory
  objectId: string;
}

/**
 * Type Gard function that redefines a PayloadBaseClass as a GetFeatureInfoPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export const payloadIsGetFeatureInfo = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is GetFeatureInfoPayload => {
  return validEvents.includes(verifyIfPayload.event);
};

/**
 * Class definition for GetFeatureInfoPayload
 *
 * @exports
 * @class GetFeatureInfoPayload
 */
export class GetFeatureInfoPayload extends PayloadBaseClass {
  /**
   * Constructor for the class
   *
   * @param {EventStringId} event the event identifier for which the payload is constructed
   * @param {string | null} handlerName the handler Name (mapId/layerPath)
   */
  constructor(event: EventStringId, handlerName: string) {
    if (!validEvents.includes(event)) throw new Error(`GetFeatureInfoPayload can't be instanciated for event of type ${event}`);
    super(event, handlerName);
  }

  /**
   * Static method used to create a get feature info payload that will initiate a layer's query
   *
   * @param {string | null} handlerName the handler Name
   * @param {TypeQueryType} queryType the query type to perform
   * @param {Pixel | Coordinate | Coordinate[]} location the location to query
   *
   * @returns {TypeQueryLayerPayload} the queryLayerPayload object created
   */
  static createQueryLayerPayload = (
    handlerName: string,
    queryType: TypeQueryType,
    location: Pixel | Coordinate | Coordinate[]
  ): TypeQueryLayerPayload => {
    const queryLayerPayload = new GetFeatureInfoPayload(EVENT_NAMES.GET_FEATURE_INFO.QUERY_LAYER, handlerName) as TypeQueryLayerPayload;
    queryLayerPayload.queryType = queryType;
    queryLayerPayload.location = location;
    return queryLayerPayload;
  };

  /**
   * Static method used to create a get feature info payload that will return the layer's query result
   *
   * @param {string | null} handlerName the handler Name
   * @param {string} layerPath the layer path
   * @param {TypeArrayOfRecords} arrayOfRecords the resultset of the get feature info query
   *
   * @returns {TypeQueryResultPayload} the queryResultPayload object created
   */
  static createQueryResultPayload = (
    handlerName: string,
    layerPath: string,
    arrayOfRecords: TypeArrayOfRecords
  ): TypeQueryResultPayload => {
    const queryResultPayload = new GetFeatureInfoPayload(EVENT_NAMES.GET_FEATURE_INFO.QUERY_RESULT, handlerName) as TypeQueryResultPayload;
    queryResultPayload.layerPath = layerPath;
    queryResultPayload.arrayOfRecords = arrayOfRecords;
    return queryResultPayload;
  };

  /**
   * Static method used to create a get feature info payload that will register a new layer in the layer inventory
   *
   * @param {string | null} handlerName the handler Name
   * @param {string} layerPath the layer path to add to the inventory
   *
   * @returns {TypeRegisterLayerPayload} the registerLayerPayload object created
   */
  static createRegisterLayerPayload = (
    handlerName: string,
    layerPath: string,
    action: 'add' | 'remove' = 'add'
  ): TypeRegisterLayerPayload => {
    const registerLayerPayload = new GetFeatureInfoPayload(
      EVENT_NAMES.GET_FEATURE_INFO.REGISTER_LAYER,
      handlerName
    ) as TypeRegisterLayerPayload;
    registerLayerPayload.layerPath = layerPath;
    registerLayerPayload.action = action;
    return registerLayerPayload;
  };

  /**
   * Static method used to create a get feature info payload requesting a layer inventory
   *
   * @param {string | null} handlerName the handler Name
   * @param {string} objectId the object identifier that will receive the inventory
   *
   * @returns {TypeRequestLayerInventoryPayload} the requestLayerInventoryPayload object created
   */
  static createRequestLayerInventoryPayload = (handlerName: string, objectId: string): TypeRequestLayerInventoryPayload => {
    const requestLayerInventoryPayload = new GetFeatureInfoPayload(
      EVENT_NAMES.GET_FEATURE_INFO.REQUEST_LAYER_INVENTORY,
      handlerName
    ) as TypeRequestLayerInventoryPayload;
    requestLayerInventoryPayload.objectId = objectId;
    return requestLayerInventoryPayload;
  };
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
export const getFeatureInfoPayload = (event: EventStringId, handlerName: string): GetFeatureInfoPayload => {
  return new GetFeatureInfoPayload(event, handlerName);
};
