import { Coordinate } from 'ol/coordinate';
import { Pixel } from 'ol/pixel';

import { PayloadBaseClass } from './payload-base-class';

import { EventStringId, EVENT_NAMES } from '../event-types';

/** Valid events that can create GetFeatureInfoPayload */
const validEvents: EventStringId[] = [
  EVENT_NAMES.GET_FEATURE_INFO.QUERY_LAYER,
  EVENT_NAMES.GET_FEATURE_INFO.ALL_QUERIES_DONE,
  EVENT_NAMES.GET_FEATURE_INFO.QUERY_RESULT,
];

export type TypeQueryType = 'at pixel' | 'at coordinate' | 'at long lat' | 'using a bounding box' | 'using a polygon';

export type TypeFeatureInfoEntry = {
  featureKey: number;
  featureInfo: Record<string, string | number | null>;
};
export type TypeArrayOfFeatureInfoEntries = TypeFeatureInfoEntry[];
export type TypeFeatureInfoResultSets = { [layerPath: string]: TypeArrayOfFeatureInfoEntries | undefined };

/**
 * type guard function that redefines a PayloadBaseClass as a TypeQueryLayerPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export const payloadIsQueryLayer = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is TypeQueryLayerPayload => {
  return verifyIfPayload?.event === EVENT_NAMES.GET_FEATURE_INFO.QUERY_LAYER;
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
 * type guard function that redefines a PayloadBaseClass as a TypeAllQueriesDonePayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export const payloadIsAllQueriesDone = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is TypeAllQueriesDonePayload => {
  return verifyIfPayload?.event === EVENT_NAMES.GET_FEATURE_INFO.ALL_QUERIES_DONE;
};

/**
 * Additional attributes needed to define a GetFeatureInfoPayload
 */
export interface TypeAllQueriesDonePayload extends GetFeatureInfoPayload {
  // The layer set identifier
  layerSetId: string;
  resultSets: TypeFeatureInfoResultSets;
}

/**
 * type guard function that redefines a PayloadBaseClass as a TypeQueryResultPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export const payloadIsQueryResult = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is TypeQueryResultPayload => {
  return verifyIfPayload?.event === EVENT_NAMES.GET_FEATURE_INFO.QUERY_RESULT;
};

/**
 * Additional attributes needed to define a GetFeatureInfoPayload
 */
export interface TypeQueryResultPayload extends GetFeatureInfoPayload {
  // the layer path used by the query
  layerPath: string;
  // the resultset of the query
  arrayOfRecords: TypeArrayOfFeatureInfoEntries;
}

/**
 * type guard function that redefines a PayloadBaseClass as a GetFeatureInfoPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export const payloadIsGetFeatureInfo = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is GetFeatureInfoPayload => {
  return validEvents.includes(verifyIfPayload?.event);
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
   * Static method used to create a "get feature info" payload that will run a query on all layers in the set.
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
   * Static method used to create an "all queries done" payload.
   *
   * @param {string | null} handlerName the handler Name
   * @param {string} layerSetId the layer set identifier
   *
   * @returns {TypeAllQueriesDonePayload} the TypeAllQueriesDonePayload object created
   */
  static createAllQueriesDonePayload = (
    handlerName: string,
    layerSetId: string,
    resultSets: TypeFeatureInfoResultSets
  ): TypeAllQueriesDonePayload => {
    const allQueriesDonePayload = new GetFeatureInfoPayload(
      EVENT_NAMES.GET_FEATURE_INFO.ALL_QUERIES_DONE,
      handlerName
    ) as TypeAllQueriesDonePayload;
    allQueriesDonePayload.layerSetId = layerSetId;
    allQueriesDonePayload.resultSets = resultSets;
    return allQueriesDonePayload;
  };

  /**
   * Static method used to create a get feature info payload that will return the layer's query result
   *
   * @param {string | null} handlerName the handler Name
   * @param {string} layerPath the layer path
   * @param {TypeArrayOfFeatureInfoEntries} arrayOfRecords the resultset of the get feature info query
   *
   * @returns {TypeQueryResultPayload} the queryResultPayload object created
   */
  static createQueryResultPayload = (
    handlerName: string,
    layerPath: string,
    arrayOfRecords: TypeArrayOfFeatureInfoEntries
  ): TypeQueryResultPayload => {
    const queryResultPayload = new GetFeatureInfoPayload(EVENT_NAMES.GET_FEATURE_INFO.QUERY_RESULT, handlerName) as TypeQueryResultPayload;
    queryResultPayload.layerPath = layerPath;
    queryResultPayload.arrayOfRecords = arrayOfRecords;
    return queryResultPayload;
  };
}
