import { PayloadBaseClass } from './payload-base-class';
import { EventStringId } from '../event-types';
import { TypeLegend } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { TypeLayerStatus } from '@/geo/map/map-schema-types';
import { TypeResultSets } from './layer-set-payload';
export type TypeLegendResultSetsEntry = {
    layerStatus: TypeLayerStatus;
    layerPhase: string;
    querySent: boolean;
    data: TypeLegend | undefined | null;
};
/** The legend resultset type associate a layer path to a legend object. The undefined value indicate that the get legend query
 * hasn't been run and the null value indicate that there was a get legend error.
 */
export type TypeLegendResultSets = {
    [layerPath: string]: TypeLegendResultSetsEntry;
};
/**
 * type guard function that redefines a PayloadBaseClass as a TypeLegendsLayersetUpdatedPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export declare const payloadIsLegendsLayersetUpdated: (verifyIfPayload: PayloadBaseClass) => verifyIfPayload is TypeLegendsLayersetUpdatedPayload;
/**
 * Additional attributes needed to define a TypeAllLegendsDonePayload
 */
export interface TypeLegendsLayersetUpdatedPayload extends GetLegendsPayload {
    layerPath: string;
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
export declare const payloadIsLegendInfo: (verifyIfPayload: PayloadBaseClass) => verifyIfPayload is TypeLegendInfoPayload;
/**
 * Additional attributes needed to define a TypeLegendInfoPayload
 */
export interface TypeLegendInfoPayload extends GetLegendsPayload {
    layerPath: string;
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
export declare const payloadIsQueryLegend: (verifyIfPayload: PayloadBaseClass) => verifyIfPayload is TypeQueryLegendPayload;
/**
 * Additional attributes needed to define a TypeQueryLegendPayload
 */
export interface TypeQueryLegendPayload extends GetLegendsPayload {
    layerPath: string;
}
/**
 * Additional attributes needed to define a TypeTriggerLegendsPayload
 */
export type TypeTriggerLegendsPayload = GetLegendsPayload;
/**
 * type guard function that redefines a PayloadBaseClass as a GetLegendsPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export declare const payloadIsGetLegends: (verifyIfPayload: PayloadBaseClass) => verifyIfPayload is GetLegendsPayload;
/**
 * Class definition for GetLegendsPayload
 *
 * @exports
 * @class GetLegendsPayload
 */
export declare class GetLegendsPayload extends PayloadBaseClass {
    /**
     * Constructor for the class
     *
     * @param {EventStringId} event the event identifier for which the payload is constructed
     * @param {string | null} handlerName the handler Name
     */
    constructor(event: EventStringId, handlerName: string);
    /**
     * Static method used to create a "legend updated" payload.
     *
     * @param {string | null} handlerName the handler Name
     * @param {string} layerPath the layer path updated
     * @param {TypeResultSets | TypeLegendResultSets} resultSets the legend resultset
     *
     * @returns {TypeLegendsLayersetUpdatedPayload} the TypeLegendsLayersetUpdatedPayload object created
     */
    static createLegendsLayersetUpdatedPayload: (handlerName: string, layerPath: string, resultSets: TypeResultSets | TypeLegendResultSets) => TypeLegendsLayersetUpdatedPayload;
    /**
     * Static method used to create a get legends payload that will return the legend's query result
     *
     * @param {string | null} handlerName the handler Name
     * @param {string} layerPath the layer path
     * @param {TypeLegend} arrayOfRecords the resultset of the get feature info query
     *
     * @returns {TypeQueryResultPayload} the queryResultPayload object created
     */
    static createLegendInfoPayload: (handlerName: string, layerPath: string, legend: TypeLegend | null) => TypeLegendInfoPayload;
    /**
     * Static method used to create a get legends payload that will run a get legend on the specified layer path.
     *
     * @param {string | null} handlerName the handler name
     * @param {string} layerPath layer path to query
     * the set.
     *
     * @returns {TypeQueryLegendPayload} the queryLegendPayload object created
     */
    static createQueryLegendPayload: (handlerName: string, layerPath: string) => TypeQueryLegendPayload;
}
