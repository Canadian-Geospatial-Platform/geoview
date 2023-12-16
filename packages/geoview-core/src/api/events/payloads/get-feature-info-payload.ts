import { Extent } from 'ol/extent';
import { Coordinate } from 'ol/coordinate';
import Geometry from 'ol/geom/Geometry';
import Feature from 'ol/Feature';
import RenderFeature from 'ol/render/Feature';
import { Pixel } from 'ol/pixel';

import { PayloadBaseClass } from './payload-base-class';

import { EventStringId, EVENT_NAMES } from '../event-types';
import { TypeGeoviewLayerType } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { TypeLayerStatus, TypeLocalizedString } from '@/geo/map/map-schema-types';

/** Valid events that can create GetFeatureInfoPayload */
const validEvents: EventStringId[] = [
  EVENT_NAMES.GET_FEATURE_INFO.QUERY_LAYER,
  EVENT_NAMES.GET_FEATURE_INFO.ALL_QUERIES_DONE,
  EVENT_NAMES.GET_FEATURE_INFO.QUERY_RESULT,
];

export type EventType = 'click' | 'hover' | 'crosshaire-enter' | 'all-features';
export const ArrayOfEventTypes: EventType[] = ['click', 'hover', 'crosshaire-enter', 'all-features'];
export type QueryType = 'at_pixel' | 'at_coordinate' | 'at_long_lat' | 'using_a_bounding_box' | 'using_a_polygon' | 'all';

export type TypeLocation = null | Pixel | Coordinate | Coordinate[];

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

export interface TypeGeometry extends RenderFeature {
  ol_uid: string;
}
export type TypeFeatureInfoEntry = {
  featureKey: number;
  geoviewLayerType: TypeGeoviewLayerType;
  extent: Extent;
  geometry: TypeGeometry | Feature<Geometry> | null;
  featureIcon: HTMLCanvasElement;
  fieldInfo: Partial<Record<string, TypeFieldEntry>>;
  nameField: string | null;
};

/**
 * Partial definition of a TypeFeatureInfoEntry for simpler use case queries.
 * Purposely linking this simpler type to the main TypeFeatureInfoEntry type here, in case, for future we want
 * to add more information on one or the other and keep things loosely linked together.
 */
export type TypeFeatureInfoEntryPartial = Pick<TypeFeatureInfoEntry, 'fieldInfo'>;

export type TypeArrayOfFeatureInfoEntries = TypeFeatureInfoEntry[] | undefined | null;

export type TypeLayerData = {
  layerPath: string;
  layerName: string;
  layerStatus: TypeLayerStatus;
  features: TypeArrayOfFeatureInfoEntries;
};
export type TypeArrayOfLayerData = TypeLayerData[];

export type TypeFeatureInfoByEventTypes = {
  [eventName in EventType]?: TypeLayerData;
};

export type TypeFeatureInfoResultSetsEntry = {
  layerStatus: TypeLayerStatus;
  layerPhase: string;
  data: TypeFeatureInfoByEventTypes;
  layerName?: TypeLocalizedString;
};

// TODO: Refactor - Should probably call this a 'ResultsSet' instead of 'ResultSets' to avoid confusion, because it's a single set of results, not multiple sets of result(s).
// https://www.totaltypescript.com/tips/how-to-name-your-types
export type TypeFeatureInfoResultSets = {
  [layerPath: string]: TypeFeatureInfoResultSetsEntry;
};

/**
 * type guard function that redefines a PayloadBaseClass as a TypeQueryLayerPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type assertion
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type assertion is valid
 * @returns {boolean} returns true if the payload is valid
 */
export const payloadIsQueryLayer = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is TypeQueryLayerPayload => {
  return verifyIfPayload?.event === EVENT_NAMES.GET_FEATURE_INFO.QUERY_LAYER;
};

/**
 * Returns true if the payload is a TypeQueryLayerPayload with queryType equal to 'at_long_lat'.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type assertion and property are valid
 * @returns {boolean} returns true if the payload is valid
 */
export const payloadIsQueryLayerQueryTypeAtLongLat = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is TypeQueryLayerPayload => {
  return payloadIsQueryLayer(verifyIfPayload) && verifyIfPayload.queryType === 'at_long_lat';
};

/**
 * Additional attributes needed to define a GetFeatureInfoPayload
 */
export interface TypeQueryLayerPayload extends GetFeatureInfoPayload {
  // The query type to perform
  queryType: QueryType;
  // the location to query, null is used when queryType is all
  location?: TypeLocation;
  // Event type that triggered the query. It can be a click, a hover, a crosshair enter, all ...
  eventType: EventType;
}

/**
 * type guard function that redefines a PayloadBaseClass as a TypeAllQueriesDonePayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type assertion
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type assertion is valid
 * @returns {boolean} returns true if the payload is valid
 */
export const payloadIsAllQueriesDone = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is TypeAllQueriesDonePayload => {
  return verifyIfPayload?.event === EVENT_NAMES.GET_FEATURE_INFO.ALL_QUERIES_DONE;
};

/**
 * Returns true if the payload is a TypeAllQueriesDonePayload with eventType equal to 'click'.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type assertion and property are valid
 * @returns {boolean} returns true if the payload is valid
 */
export const payloadIsAllQueriesDoneEventClick = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is TypeAllQueriesDonePayload => {
  return payloadIsAllQueriesDone(verifyIfPayload) && verifyIfPayload.eventType === 'click';
};

/**
 * Additional attributes needed to define a GetFeatureInfoPayload
 */
export interface TypeAllQueriesDonePayload extends GetFeatureInfoPayload {
  // The type of event that triggered the query
  eventType: EventType;
  // the layer path updated
  layerPath: string;
  // The query type that was performed
  queryType: QueryType;
  // The layer set identifier
  layerSetId: string;
  // the resultSets that contains the query results
  resultSets: TypeFeatureInfoResultSets;
}

/**
 * type guard function that redefines a PayloadBaseClass as a TypeQueryResultPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type assertion
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type assertion is valid
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
  // the type of query to perform
  queryType: QueryType;
  // the resultset of the query
  arrayOfRecords: TypeArrayOfFeatureInfoEntries;
  // The type of event that triggered the query
  eventType: EventType;
}

/**
 * type guard function that redefines a PayloadBaseClass as a GetFeatureInfoPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type assertion
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type assertion is valid
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
   * @param {QueryType} queryType the query's type to perform
   * @param {TypeLocation} location the location to query
   * @param {EventType} eventType the type of event that triggered the query
   *
   * @returns {TypeQueryLayerPayload} the queryLayerPayload object created
   */
  static createQueryLayerPayload = (
    handlerName: string,
    queryType: QueryType,
    location?: TypeLocation,
    eventType: EventType = 'all-features'
  ): TypeQueryLayerPayload => {
    const queryLayerPayload = new GetFeatureInfoPayload(EVENT_NAMES.GET_FEATURE_INFO.QUERY_LAYER, handlerName) as TypeQueryLayerPayload;
    queryLayerPayload.queryType = queryType;
    queryLayerPayload.location = location;
    queryLayerPayload.eventType = eventType;
    return queryLayerPayload;
  };

  /**
   * Static method used to create an "all queries done" payload.
   *
   * @param {string | null} handlerName the handler Name
   * @param {EventType} eventType the type of event that triggered the query
   * @param {string} layerPath the layer path updated
   * @param {QueryType} queryType the query's type done
   * @param {string} layerSetId the layer set identifier
   * @param {TypeFeatureInfoResultSets} resultSets the result set for the query
   *
   * @returns {TypeAllQueriesDonePayload} the TypeAllQueriesDonePayload object created
   */
  static createAllQueriesDonePayload = (
    handlerName: string,
    eventType: EventType,
    layerPath: string,
    queryType: QueryType,
    layerSetId: string,
    resultSets: TypeFeatureInfoResultSets
  ): TypeAllQueriesDonePayload => {
    const allQueriesDonePayload = new GetFeatureInfoPayload(
      EVENT_NAMES.GET_FEATURE_INFO.ALL_QUERIES_DONE,
      handlerName
    ) as TypeAllQueriesDonePayload;
    allQueriesDonePayload.eventType = eventType;
    allQueriesDonePayload.layerPath = layerPath;
    allQueriesDonePayload.queryType = queryType;
    allQueriesDonePayload.layerSetId = layerSetId;
    allQueriesDonePayload.resultSets = resultSets;
    return allQueriesDonePayload;
  };

  /**
   * Static method used to create a get feature info payload that will return the layer's query result
   *
   * @param {string | null} handlerName the handler Name
   * @param {string} layerPath the layer path
   * @param {QueryType} queryType the resultset query type
   * @param {TypeArrayOfFeatureInfoEntries} arrayOfRecords the resultset of the get feature info query
   * @param {EventType} eventType the type of event that triggered the query
   *
   * @returns {TypeQueryResultPayload} the queryResultPayload object created
   */
  static createQueryResultPayload = (
    handlerName: string,
    layerPath: string,
    queryType: QueryType,
    arrayOfRecords: TypeArrayOfFeatureInfoEntries,
    eventType: EventType
  ): TypeQueryResultPayload => {
    const queryResultPayload = new GetFeatureInfoPayload(EVENT_NAMES.GET_FEATURE_INFO.QUERY_RESULT, handlerName) as TypeQueryResultPayload;
    queryResultPayload.layerPath = layerPath;
    queryResultPayload.queryType = queryType;
    queryResultPayload.arrayOfRecords = arrayOfRecords;
    queryResultPayload.eventType = eventType;
    return queryResultPayload;
  };
}
