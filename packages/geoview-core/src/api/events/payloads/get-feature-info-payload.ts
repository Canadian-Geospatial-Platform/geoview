import { Extent } from 'ol/extent';
import { Coordinate } from 'ol/coordinate';
import { FeatureLike } from 'ol/Feature';
import { Pixel } from 'ol/pixel';

import { PayloadBaseClass } from './payload-base-class';

import { EventStringId, EVENT_NAMES } from '../event-types';
import { TypeGeoviewLayerType } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { TypeLayerStatus } from '../../../geo/map/map-schema-types';

/** Valid events that can create GetFeatureInfoPayload */
const validEvents: EventStringId[] = [
  EVENT_NAMES.GET_FEATURE_INFO.QUERY_LAYER,
  EVENT_NAMES.GET_FEATURE_INFO.ALL_QUERIES_DONE,
  EVENT_NAMES.GET_FEATURE_INFO.HOVER_QUERY_DONE,
  EVENT_NAMES.GET_FEATURE_INFO.QUERY_RESULT,
];

export type TypeQueryType = 'at pixel' | 'at coordinate' | 'at long lat' | 'using a bounding box' | 'using a polygon';

export type codeValueEntryType = {
  name: string;
  code: unknown;
};

export type codedValueType = {
  type: 'codedValue';
  name: string;
  description: string;
  codedValues: codeValueEntryType[];
};

export type rangeDomainType = {
  type: 'range';
  name: string;
  range: [minValue: unknown, maxValue: unknown];
};

export type TypeFieldEntry = {
  fieldKey: number;
  value: unknown;
  dataType: 'string' | 'date' | 'number';
  alias: string;
  domain: null | codedValueType | rangeDomainType;
};

export type TypeFeatureInfoEntry = {
  featureKey: number;
  geoviewLayerType: TypeGeoviewLayerType;
  extent: Extent;
  geometry: FeatureLike | null;
  featureIcon: HTMLCanvasElement;
  fieldInfo: Partial<Record<string, TypeFieldEntry>>;
  nameField: string | null;
};

export type TypeArrayOfFeatureInfoEntries = TypeFeatureInfoEntry[];
export type TypeFeatureInfoResultSets = {
  [layerPath: string]: { layerStatus: TypeLayerStatus; data: TypeArrayOfFeatureInfoEntries | undefined | null };
};

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
  // know if is a click or hover query
  isHover: boolean;
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
 * type guard function that redefines a PayloadBaseClass as a TypeHoverQueryDonePayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export const payloadIsHoverQueryDone = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is TypeAllQueriesDonePayload => {
  return verifyIfPayload?.event === EVENT_NAMES.GET_FEATURE_INFO.HOVER_QUERY_DONE;
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
  // know if is a click or hover query
  isHover: boolean;
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
   * @param {boolean} isHover the type of query
   *
   * @returns {TypeQueryLayerPayload} the queryLayerPayload object created
   */
  static createQueryLayerPayload = (
    handlerName: string,
    queryType: TypeQueryType,
    location: Pixel | Coordinate | Coordinate[],
    isHover: boolean
  ): TypeQueryLayerPayload => {
    const queryLayerPayload = new GetFeatureInfoPayload(EVENT_NAMES.GET_FEATURE_INFO.QUERY_LAYER, handlerName) as TypeQueryLayerPayload;
    queryLayerPayload.queryType = queryType;
    queryLayerPayload.location = location;
    queryLayerPayload.isHover = isHover;
    return queryLayerPayload;
  };

  /**
   * Static method used to create an "all queries done" payload.
   *
   * @param {string | null} handlerName the handler Name
   * @param {string} layerSetId the layer set identifier
   * @param {TypeFeatureInfoResultSets} resultSets the result set for the query
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
   * Static method used to create an "hover query done" payload.
   *
   * @param {string | null} handlerName the handler Name
   * @param {string} layerSetId the layer set identifier
   * @param {TypeFeatureInfoResultSets} resultSets the result set for the query
   *
   * @returns {TypeAllQueriesDonePayload} the TypeAllQueriesDonePayload object created
   */
  static createHoverQueryDonePayload = (
    handlerName: string,
    layerSetId: string,
    resultSets: TypeFeatureInfoResultSets
  ): TypeAllQueriesDonePayload => {
    const hoverQueryDonePayload = new GetFeatureInfoPayload(
      EVENT_NAMES.GET_FEATURE_INFO.HOVER_QUERY_DONE,
      handlerName
    ) as TypeAllQueriesDonePayload;
    hoverQueryDonePayload.layerSetId = layerSetId;
    hoverQueryDonePayload.resultSets = resultSets;
    return hoverQueryDonePayload;
  };

  /**
   * Static method used to create a get feature info payload that will return the layer's query result
   *
   * @param {string | null} handlerName the handler Name
   * @param {string} layerPath the layer path
   * @param {TypeArrayOfFeatureInfoEntries} arrayOfRecords the resultset of the get feature info query
   * @param {boolean} isHover the type of query
   *
   * @returns {TypeQueryResultPayload} the queryResultPayload object created
   */
  static createQueryResultPayload = (
    handlerName: string,
    layerPath: string,
    arrayOfRecords: TypeArrayOfFeatureInfoEntries,
    isHover: boolean
  ): TypeQueryResultPayload => {
    const queryResultPayload = new GetFeatureInfoPayload(EVENT_NAMES.GET_FEATURE_INFO.QUERY_RESULT, handlerName) as TypeQueryResultPayload;
    queryResultPayload.layerPath = layerPath;
    queryResultPayload.arrayOfRecords = arrayOfRecords;
    queryResultPayload.isHover = isHover;
    return queryResultPayload;
  };
}
