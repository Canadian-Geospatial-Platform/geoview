import 'dayjs/locale/en-ca';
import 'dayjs/locale/fr-ca';
import { TypeLocalizedLanguages } from '../../geo/map/map-schema-types';
import { TypeJsonObject } from '../types/global-types';
/** ******************************************************************************************************************************
 * Type used to define the date precision pattern to use.
 */
type DatePrecision = 'year' | 'month' | 'day';
/** ******************************************************************************************************************************
 * Type used to define the time precision pattern to use.
 */
type TimePrecision = 'hour' | 'minute' | 'second';
/** ******************************************************************************************************************************
 * Type used to define the range values for an OGC time dimension.
 */
type RangeItems = {
    type: string;
    range: string[];
};
/** ******************************************************************************************************************************
 * Type used to define the GeoView OGC time dimension.
 */
export type TimeDimension = {
    field: string;
    default: string;
    unitSymbol?: string;
    range: RangeItems;
    nearestValues: 'discrete' | 'absolute';
    singleHandle: boolean;
};
/** ******************************************************************************************************************************
 * Type used to validate the ESRI time dimension.
 */
export type TimeDimensionESRI = {
    startTimeField: string;
    timeExtent: number[];
    timeInterval: number;
    timeIntervalUnits: 'esriTimeUnitsHours' | 'esriTimeUnitsDays' | 'esriTimeUnitsWeeks' | 'esriTimeUnitsMonths' | 'esriTimeUnitsYears';
};
/**
 * Class used to handle date as ISO 8601
 *
 * @exports
 * @class DateMgt
 */
export declare class DateMgt {
    #private;
    /**
     * Convert a UTC date to a local date
     * @param {Date | string} date date to use
     * @returns {string} local date
     */
    convertToLocal(date: Date | string): string;
    /**
     * Convert a date local to a UTC date
     * @param {Date | string} date date to use
     * @returns {string} UTC date
     */
    convertToUTC(date: Date | string): string;
    /**
     * Format a date to a pattern
     * @param {Date | string} date date to use
     * @param {DatePrecision} datePattern the date precision pattern to use
     * @param {TimePrecision}timePattern the time precision pattern to use
     * @returns {string} formatted date
     */
    format(date: Date | string, datePattern: DatePrecision, timePattern?: TimePrecision): string;
    /**
     * Convert a date to milliseconds
     * @param {Date | string} date date to use
     * @returns {number} date as milliseconds
     */
    convertToMilliseconds(date: Date | string): number;
    /**
     * Convert a milliseconds date to string date
     * @param {number} date milliseconds date
     * @returns {string} date string
     */
    convertToDate(date: number, dateFormat?: string): string;
    /**
     * Extract pattern to use to format the date
     * @param {string} dateOGC date as an ISO 8601 date
     * @returns {string} the formatted date
     */
    extractDateFormat(dateOGC: string): string;
    /**
     * Create the Geoview time dimension from ESRI dimension
     * @param {TimeDimensionESRI} timeDimensionESRI esri time dimension object
     * @returns {TimeDimension} the Geoview time dimension
     */
    createDimensionFromESRI(timeDimensionESRI: TimeDimensionESRI): TimeDimension;
    /**
     * Create the Geoview time dimension from OGC dimension
     * @param {TypeJsonObject | string} ogcTimeDimension The OGC time dimension object or string
     * @returns {TimeDimension} the Geoview time dimension
     */
    createDimensionFromOGC(ogcTimeDimension: TypeJsonObject | string): TimeDimension;
    /**
     * Create a range of date object from OGC time dimension following ISO 8601
     * @param {string} ogcTimeDimension OGC time dimension values following
     * @returns {RangeItems} array of date from the dimension
     */
    createRangeOGC(ogcTimeDimensionValues: string): RangeItems;
    /**
     * Create locale tooltip (fr-CA or en-CA)
     * @param date {string} date to use
     * @param locale {string} locale to use (fr-CA or en-CA)
     * @returns {string} locale tooltip
     */
    createDateLocaleTooltip(date: string, locale: TypeLocalizedLanguages): string;
}
export {};
