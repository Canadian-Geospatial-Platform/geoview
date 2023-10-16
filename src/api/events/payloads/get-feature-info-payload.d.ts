import { Extent } from 'ol/extent';
import { Coordinate } from 'ol/coordinate';
import Geometry from 'ol/geom/Geometry';
import Feature from 'ol/Feature';
import RenderFeature from 'ol/render/Feature';
import { Pixel } from 'ol/pixel';
import { PayloadBaseClass } from './payload-base-class';
import { EventStringId } from '../event-types';
import { TypeGeoviewLayerType } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { TypeLayerStatus } from '@/geo/map/map-schema-types';
export type TypeQueryType = 'at_pixel' | 'at_coordinate' | 'at_long_lat' | 'using_a_bounding_box' | 'using_a_polygon' | 'all';
export declare const ArrayOfQueryTypes: TypeQueryType[];
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
export type TypeArrayOfFeatureInfoEntries = TypeFeatureInfoEntry[] | undefined | null;
export type TypeFeatureInfoByQueryTypes = {
    [K in TypeQueryType]?: TypeArrayOfFeatureInfoEntries;
};
export type TypeFeatureInfoResultSets = {
    [layerPath: string]: {
        layerStatus: TypeLayerStatus;
        layerPhase: string;
        data: TypeFeatureInfoByQueryTypes;
    };
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
    location?: TypeLocation;
    isHover?: boolean | null;
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
 * type guard function that redefines a PayloadBaseClass as a TypeHoverQueryDonePayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export declare const payloadIsHoverQueryDone: (verifyIfPayload: PayloadBaseClass) => verifyIfPayload is TypeAllQueriesDonePayload;
/**
 * Additional attributes needed to define a GetFeatureInfoPayload
 */
export interface TypeAllQueriesDonePayload extends GetFeatureInfoPayload {
    queryType: TypeQueryType;
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
    queryType: TypeQueryType;
    arrayOfRecords: TypeArrayOfFeatureInfoEntries;
    isHover?: boolean | null;
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
     * @param {TypeQueryType} queryType the query's type to perform
     * @param {TypeLocation} location the location to query
     * @param {boolean | null} isHover the type of query
     *
     * @returns {TypeQueryLayerPayload} the queryLayerPayload object created
     */
    static createQueryLayerPayload: (handlerName: string, queryType: TypeQueryType, location?: TypeLocation, isHover?: boolean | null) => TypeQueryLayerPayload;
    /**
     * Static method used to create an "all queries done" payload.
     *
     * @param {string | null} handlerName the handler Name
     * @param {TypeQueryType} queryType the query's type done
     * @param {string} layerSetId the layer set identifier
     * @param {TypeFeatureInfoResultSets} resultSets the result set for the query
     *
     * @returns {TypeAllQueriesDonePayload} the TypeAllQueriesDonePayload object created
     */
    static createAllQueriesDonePayload: (handlerName: string, queryType: TypeQueryType, layerSetId: string, resultSets: TypeFeatureInfoResultSets) => TypeAllQueriesDonePayload;
    /**
     * Static method used to create an "hover query done" payload.
     *
     * @param {string | null} handlerName the handler Name
     * @param {TypeQueryType} queryType the resultset query type
     * @param {string} layerSetId the layer set identifier
     * @param {TypeFeatureInfoResultSets} resultSets the result set for the query
     *
     * @returns {TypeAllQueriesDonePayload} the TypeAllQueriesDonePayload object created
     */
    static createHoverQueryDonePayload: (handlerName: string, queryType: TypeQueryType, layerSetId: string, resultSets: TypeFeatureInfoResultSets) => TypeAllQueriesDonePayload;
    /**
     * Static method used to create a get feature info payload that will return the layer's query result
     *
     * @param {string | null} handlerName the handler Name
     * @param {string} layerPath the layer path
     * @param {TypeQueryType} queryType the resultset query type
     * @param {TypeArrayOfFeatureInfoEntries} arrayOfRecords the resultset of the get feature info query
     * @param {boolean | null} isHover the type of query
     *
     * @returns {TypeQueryResultPayload} the queryResultPayload object created
     */
    static createQueryResultPayload: (handlerName: string, layerPath: string, queryType: TypeQueryType, arrayOfRecords: TypeArrayOfFeatureInfoEntries, isHover?: boolean | null) => TypeQueryResultPayload;
}
