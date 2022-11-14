import { PayloadBaseClass } from './payload-base-class';

import { EventStringId, EVENT_NAMES } from '../event-types';
import { TypeLegend } from '../../../geo/layer/geoview-layers/abstract-geoview-layers';

/** Valid events that can create GetLegendsPayload */
const validEvents: EventStringId[] = [
  EVENT_NAMES.GET_LEGENDS.ALL_LEGENDS_DONE,
  EVENT_NAMES.GET_LEGENDS.LEGEND_INFO,
  EVENT_NAMES.GET_LEGENDS.QUERY_LEGEND,
  EVENT_NAMES.GET_LEGENDS.TRIGGER,
];

export type TypeLegendResultSets = { [layerPath: string]: TypeLegend | undefined | null };

/**
 * type guard function that redefines a PayloadBaseClass as a TypeAllLegendsDonePayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export const payloadIsAllLegendsDone = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is TypeAllLegendsDonePayload => {
  return verifyIfPayload?.event === EVENT_NAMES.GET_LEGENDS.ALL_LEGENDS_DONE;
};

/**
 * Additional attributes needed to define a TypeAllLegendsDonePayload
 */
export interface TypeAllLegendsDonePayload extends GetLegendsPayload {
  // The layer set identifier
  layerSetId: string;
  // The result set containing all the legends of the active layers on the map.
  resultSets: TypeLegendResultSets;
}

/**
 * type guard function that redefines a PayloadBaseClass as a TypeLegendInfoPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export const payloadIsLegendInfo = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is TypeLegendInfoPayload => {
  return verifyIfPayload?.event === EVENT_NAMES.GET_LEGENDS.LEGEND_INFO;
};

/**
 * Additional attributes needed to define a TypeLegendInfoPayload
 */
export interface TypeLegendInfoPayload extends GetLegendsPayload {
  // the layer path used by the query
  layerPath: string;
  // the resultset of the query
  legendInfo: TypeLegend | null;
}

/**
 * type guard function that redefines a PayloadBaseClass as a TypeQueryLegendPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export const payloadIsQueryLegend = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is TypeQueryLegendPayload => {
  return verifyIfPayload?.event === EVENT_NAMES.GET_LEGENDS.QUERY_LEGEND;
};

/**
 * Additional attributes needed to define a TypeQueryLegendPayload
 */
export interface TypeQueryLegendPayload extends GetLegendsPayload {
  // The layer path on which the get legend will be executed.
  layerPath: string;
}

/**
 * type guard function that redefines a PayloadBaseClass as a TypeTriggerLegendsPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export const payloadIsTriggerLegend = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is TypeTriggerLegendsPayload => {
  return verifyIfPayload?.event === EVENT_NAMES.GET_LEGENDS.TRIGGER;
};

/**
 * Additional attributes needed to define a TypeTriggerLegendsPayload
 */
export interface TypeTriggerLegendsPayload extends GetLegendsPayload {
  // The layer set identifier
  layerSetId: string;
}

/**
 * type guard function that redefines a PayloadBaseClass as a GetLegendsPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export const payloadIsGetLegends = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is GetLegendsPayload => {
  return validEvents.includes(verifyIfPayload?.event);
};

/**
 * Class definition for GetLegendsPayload
 *
 * @exports
 * @class GetLegendsPayload
 */
export class GetLegendsPayload extends PayloadBaseClass {
  /**
   * Constructor for the class
   *
   * @param {EventStringId} event the event identifier for which the payload is constructed
   * @param {string | null} handlerName the handler Name
   */
  constructor(event: EventStringId, handlerName: string) {
    if (!validEvents.includes(event)) throw new Error(`GetLegendsPayload can't be instanciated for event of type ${event}`);
    super(event, handlerName);
  }

  /**
   * Static method used to create an "all legends done" payload.
   *
   * @param {string | null} handlerName the handler Name
   * @param {string} layerSetId the layer set identifier
   *
   * @returns {TypeAlllegendsDonePayload} the TypeAllQueriesDonePayload object created
   */
  static createAllQueriesDonePayload = (
    handlerName: string,
    layerSetId: string,
    resultSets: TypeLegendResultSets
  ): TypeAllLegendsDonePayload => {
    const allLegendsDonePayload = new GetLegendsPayload(EVENT_NAMES.GET_LEGENDS.ALL_LEGENDS_DONE, handlerName) as TypeAllLegendsDonePayload;
    allLegendsDonePayload.layerSetId = layerSetId;
    allLegendsDonePayload.resultSets = resultSets;
    return allLegendsDonePayload;
  };

  /**
   * Static method used to create a get legends payload that will return the legend's query result
   *
   * @param {string | null} handlerName the handler Name
   * @param {string} layerPath the layer path
   * @param {TypeLegend} arrayOfRecords the resultset of the get feature info query
   *
   * @returns {TypeQueryResultPayload} the queryResultPayload object created
   */
  static createLegendInfoPayload = (handlerName: string, layerPath: string, legend: TypeLegend | null): TypeLegendInfoPayload => {
    const legendInfoPayload = new GetLegendsPayload(EVENT_NAMES.GET_LEGENDS.LEGEND_INFO, handlerName) as TypeLegendInfoPayload;
    legendInfoPayload.layerPath = layerPath;
    legendInfoPayload.legendInfo = legend;
    return legendInfoPayload;
  };

  /**
   * Static method used to create a get legends payload that will run a get legend on the specified layer path.
   *
   * @param {string | null} handlerName the handler name
   * @param {string} layerPath layer path to query
   * the set.
   *
   * @returns {TypeQueryLegendPayload} the queryLegendPayload object created
   */
  static createQueryLegendPayload = (handlerName: string, layerPath: string): TypeQueryLegendPayload => {
    const queryLayerPayload = new GetLegendsPayload(EVENT_NAMES.GET_LEGENDS.QUERY_LEGEND, handlerName) as TypeQueryLegendPayload;
    queryLayerPayload.layerPath = layerPath;
    return queryLayerPayload;
  };

  /**
   * Static method used to create a get legends payload that will trigger the get legends event processing to continuously keep
   * the legends layer up to date.
   *
   * @param {string | null} handlerName the handler Name
   * @param {string} layerSetId the layer set identifier
   * the set.
   *
   * @returns {TypeTriggerLegendsPayload} the triggerLegendsPayload object created
   */
  static createTriggerLegendPayload = (handlerName: string, layerSetId: string): TypeTriggerLegendsPayload => {
    const triggerLegendsPayload = new GetLegendsPayload(EVENT_NAMES.GET_LEGENDS.QUERY_LEGEND, handlerName) as TypeTriggerLegendsPayload;
    triggerLegendsPayload.layerSetId = layerSetId;
    return triggerLegendsPayload;
  };
}
