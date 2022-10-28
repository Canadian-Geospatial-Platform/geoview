import { PayloadBaseClass } from './payload-base-class';

import { EventStringId, EVENT_NAMES } from '../event-types';
import { TypeLegend } from '../../../geo/layer/geoview-layers/abstract-geoview-layers';

/** Valid events that can create GetLegendsPayload */
const validEvents: EventStringId[] = [
  EVENT_NAMES.GET_LEGENDS.QUERY_LEGENDS,
  EVENT_NAMES.GET_LEGENDS.ALL_LEGENDS_DONE,
  EVENT_NAMES.GET_LEGENDS.LEGEND_INFO,
];

export type TypeLegendResultSets = { [layerPath: string]: TypeLegend | undefined | null };

/**
 * Type Gard function that redefines a PayloadBaseClass as a TypeQueryLegendsPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export const payloadIsQueryLegends = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is TypeQueryLegendsPayload => {
  return verifyIfPayload.event === EVENT_NAMES.GET_LEGENDS.QUERY_LEGENDS;
};

/**
 * Additional attributes needed to define a GetLegendsPayload
 */
export type TypeQueryLegendsPayload = GetLegendsPayload;

/**
 * Type Gard function that redefines a PayloadBaseClass as a TypeAllLegendsDonePayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export const payloadIsAllLegendsDone = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is TypeAllLegendsDonePayload => {
  return verifyIfPayload.event === EVENT_NAMES.GET_LEGENDS.ALL_LEGENDS_DONE;
};

/**
 * Additional attributes needed to define a GetLegendsPayload
 */
export interface TypeAllLegendsDonePayload extends GetLegendsPayload {
  // The layer set identifier
  layerSetId: string;
  resultSets: TypeLegendResultSets;
}

/**
 * Type Gard function that redefines a PayloadBaseClass as a TypeLegendInfoPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export const payloadIsLegendInfo = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is TypeLegendInfoPayload => {
  return verifyIfPayload.event === EVENT_NAMES.GET_LEGENDS.LEGEND_INFO;
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
 * Type Gard function that redefines a PayloadBaseClass as a GetLegendsPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export const payloadIsGetLegends = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is GetLegendsPayload => {
  return validEvents.includes(verifyIfPayload.event);
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
   * Static method used to create a "get legends" payload that will run a query on all layers in the set.
   *
   * @param {string | null} handlerName the handler Name
   *
   * @returns {TypeQueryLegendsPayload} the queryLegendsPayload object created
   */
  static createQueryLegendsPayload = (handlerName: string): TypeQueryLegendsPayload => {
    const queryLayerPayload = new GetLegendsPayload(EVENT_NAMES.GET_LEGENDS.QUERY_LEGENDS, handlerName) as TypeQueryLegendsPayload;
    return queryLayerPayload;
  };

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
}
