import { Extent } from 'ol/extent';
import { Coordinate } from 'ol/coordinate';
import { FeatureLike } from 'ol/Feature';
import { Pixel } from 'ol/pixel';
import { PayloadBaseClass } from './payload-base-class';
import { EventStringId } from '../event-types';
import { TypeGeoviewLayerType } from '../../../geo/layer/geoview-layers/abstract-geoview-layers';
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
};
export type TypeArrayOfFeatureInfoEntries = TypeFeatureInfoEntry[];
export type TypeFeatureInfoResultSets = {
    [layerPath: string]: TypeArrayOfFeatureInfoEntries | undefined | null;
};
/**
 * type guard function that redefines a PayloadBaseClass as a TypeQueryLayerPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export declare const payloadIsQueryLayer: (verifyIfPayload: PayloadBaseClass) => verifyIfPayload is TypeQueryLayerPayload;
/**
 * Additional attributes needed to define a GetFeatureInfoPayload
 */
export interface TypeQueryLayerPayload extends GetFeatureInfoPayload {
    queryType: TypeQueryType;
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
export declare const payloadIsAllQueriesDone: (verifyIfPayload: PayloadBaseClass) => verifyIfPayload is TypeAllQueriesDonePayload;
/**
 * Additional attributes needed to define a GetFeatureInfoPayload
 */
export interface TypeAllQueriesDonePayload extends GetFeatureInfoPayload {
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
export declare const payloadIsQueryResult: (verifyIfPayload: PayloadBaseClass) => verifyIfPayload is TypeQueryResultPayload;
/**
 * Additional attributes needed to define a GetFeatureInfoPayload
 */
export interface TypeQueryResultPayload extends GetFeatureInfoPayload {
    layerPath: string;
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
export declare const payloadIsGetFeatureInfo: (verifyIfPayload: PayloadBaseClass) => verifyIfPayload is GetFeatureInfoPayload;
/**
 * Class definition for GetFeatureInfoPayload
 *
 * @exports
 * @class GetFeatureInfoPayload
 */
export declare class GetFeatureInfoPayload extends PayloadBaseClass {
    /**
     * Constructor for the class
     *
     * @param {EventStringId} event the event identifier for which the payload is constructed
     * @param {string | null} handlerName the handler Name (mapId/layerPath)
     */
    constructor(event: EventStringId, handlerName: string);
    /**
     * Static method used to create a "get feature info" payload that will run a query on all layers in the set.
     *
     * @param {string | null} handlerName the handler Name
     * @param {TypeQueryType} queryType the query type to perform
     * @param {Pixel | Coordinate | Coordinate[]} location the location to query
     *
     * @returns {TypeQueryLayerPayload} the queryLayerPayload object created
     */
    static createQueryLayerPayload: (handlerName: string, queryType: TypeQueryType, location: Pixel | Coordinate | Coordinate[]) => TypeQueryLayerPayload;
    /**
     * Static method used to create an "all queries done" payload.
     *
     * @param {string | null} handlerName the handler Name
     * @param {string} layerSetId the layer set identifier
     *
     * @returns {TypeAllQueriesDonePayload} the TypeAllQueriesDonePayload object created
     */
    static createAllQueriesDonePayload: (handlerName: string, layerSetId: string, resultSets: TypeFeatureInfoResultSets) => TypeAllQueriesDonePayload;
    /**
     * Static method used to create a get feature info payload that will return the layer's query result
     *
     * @param {string | null} handlerName the handler Name
     * @param {string} layerPath the layer path
     * @param {TypeArrayOfFeatureInfoEntries} arrayOfRecords the resultset of the get feature info query
     *
     * @returns {TypeQueryResultPayload} the queryResultPayload object created
     */
    static createQueryResultPayload: (handlerName: string, layerPath: string, arrayOfRecords: TypeArrayOfFeatureInfoEntries) => TypeQueryResultPayload;
}
