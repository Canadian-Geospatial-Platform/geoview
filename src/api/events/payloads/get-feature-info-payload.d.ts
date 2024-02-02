import { Extent } from 'ol/extent';
import { Coordinate } from 'ol/coordinate';
import Feature from 'ol/Feature';
import RenderFeature from 'ol/render/Feature';
import { Pixel } from 'ol/pixel';
import { PayloadBaseClass } from './payload-base-class';
import { EventStringId } from '../event-types';
import { TypeGeoviewLayerType } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { TypeLayerStatus } from '@/geo/map/map-schema-types';
export type EventType = 'click' | 'hover' | 'crosshaire-enter' | 'all-features';
export declare const ArrayOfEventTypes: EventType[];
export type QueryType = 'at_pixel' | 'at_coordinate' | 'at_long_lat' | 'using_a_bounding_box' | 'using_a_polygon' | 'all';
export type TypeLocation = null | Pixel | Coordinate | Coordinate[] | string;
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
    geometry: TypeGeometry | Feature | null;
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
export type TypeQueryStatus = 'processing' | 'processed' | 'error';
export type TypeLayerData = {
    layerPath: string;
    layerName: string;
    layerStatus: TypeLayerStatus;
    eventListenerEnabled: boolean;
    queryStatus: TypeQueryStatus;
    features: TypeArrayOfFeatureInfoEntries;
};
export type TypeArrayOfLayerData = TypeLayerData[];
export type TypeFeatureInfoByEventTypes = {
    [eventName in EventType]?: TypeLayerData;
};
export type TypeFeatureInfoResultsSetEntry = {
    layerStatus: TypeLayerStatus;
    layerPhase: string;
    data: TypeFeatureInfoByEventTypes;
    layerName?: string;
};
export type TypeFeatureInfoResultsSet = {
    [layerPath: string]: TypeFeatureInfoResultsSetEntry;
};
/**
 * type guard function that redefines a PayloadBaseClass as a TypeQueryLayerPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type assertion
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type assertion is valid
 * @returns {boolean} returns true if the payload is valid
 */
export declare const payloadIsQueryLayer: (verifyIfPayload: PayloadBaseClass) => verifyIfPayload is TypeQueryLayerPayload;
/**
 * Returns true if the payload is a TypeQueryLayerPayload with queryType equal to 'at_long_lat'.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type assertion and property are valid
 * @returns {boolean} returns true if the payload is valid
 */
export declare const payloadIsQueryLayerQueryTypeAtLongLat: (verifyIfPayload: PayloadBaseClass) => verifyIfPayload is TypeQueryLayerPayload;
/**
 * Additional attributes needed to define a GetFeatureInfoPayload
 */
export interface TypeQueryLayerPayload extends GetFeatureInfoPayload {
    queryType: QueryType;
    location?: TypeLocation | string;
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
export declare const payloadIsAllQueriesDone: (verifyIfPayload: PayloadBaseClass) => verifyIfPayload is TypeAllQueriesDonePayload;
/**
 * Returns true if the payload is a TypeAllQueriesDonePayload with eventType equal to 'click'.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type assertion and property are valid
 * @returns {boolean} returns true if the payload is valid
 */
export declare const payloadIsAllQueriesDoneEventClick: (verifyIfPayload: PayloadBaseClass) => verifyIfPayload is TypeAllQueriesDonePayload;
/**
 * Additional attributes needed to define a GetFeatureInfoPayload
 */
export interface TypeAllQueriesDonePayload extends GetFeatureInfoPayload {
    eventType: EventType;
    layerPath: string;
    queryType: QueryType;
    layerSetId: string;
    resultsSet: TypeFeatureInfoResultsSet;
}
/**
 * type guard function that redefines a PayloadBaseClass as a TypeQueryResultPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type assertion
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type assertion is valid
 * @returns {boolean} returns true if the payload is valid
 */
export declare const payloadIsQueryResult: (verifyIfPayload: PayloadBaseClass) => verifyIfPayload is TypeQueryResultPayload;
/**
 * Additional attributes needed to define a GetFeatureInfoPayload
 */
export interface TypeQueryResultPayload extends GetFeatureInfoPayload {
    layerPath: string;
    queryType: QueryType;
    arrayOfRecords: TypeArrayOfFeatureInfoEntries;
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
     * @param {QueryType} queryType the query's type to perform
     * @param {TypeLocation} location the location to query
     * @param {EventType} eventType the type of event that triggered the query
     *
     * @returns {TypeQueryLayerPayload} the queryLayerPayload object created
     */
    static createQueryLayerPayload: (handlerName: string, queryType: QueryType, location?: TypeLocation, eventType?: EventType) => TypeQueryLayerPayload;
    /**
     * Static method used to create a "get all layer features info" payload that will run a query on a specific layer in the set.
     *
     * @param {string | null} handlerName the handler Name
     * @param {QueryType} queryType the query's type to perform
     * @param {string} location the location to query
     * @param {EventType} eventType the type of event that triggered the query
     *
     * @returns {TypeQueryLayerPayload} the queryLayerPayload object created
     */
    static createGetAllLayerFeaturesPayload: (handlerName: string, queryType: QueryType, location: string) => TypeQueryLayerPayload;
    /**
     * Static method used to create an "all queries done" payload.
     *
     * @param {string | null} handlerName the handler Name
     * @param {EventType} eventType the type of event that triggered the query
     * @param {string} layerPath the layer path updated
     * @param {QueryType} queryType the query's type done
     * @param {string} layerSetId the layer set identifier
     * @param {TypeFeatureInfoResultsSet} resultsSet the result set for the query
     *
     * @returns {TypeAllQueriesDonePayload} the TypeAllQueriesDonePayload object created
     */
    static createAllQueriesDonePayload: (handlerName: string, eventType: EventType, layerPath: string, queryType: QueryType, layerSetId: string, resultsSet: TypeFeatureInfoResultsSet) => TypeAllQueriesDonePayload;
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
    static createQueryResultPayload: (handlerName: string, layerPath: string, queryType: QueryType, arrayOfRecords: TypeArrayOfFeatureInfoEntries, eventType: EventType) => TypeQueryResultPayload;
}
