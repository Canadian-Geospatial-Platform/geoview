import 'dayjs/locale/en-ca';
import 'dayjs/locale/fr-ca';
import { TypeLocalizedLanguages } from '@/geo/map/map-schema-types';
import { TypeJsonObject } from '../types/global-types';
export type TypeDateFragments = [number[], number[], string[]];
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
     * Format a date to specific format like 'YYYY-MM-DD'
     * @param {Date | string} date date to use
     * @param {string} format format of the date.
     * @returns {string} formatted date
     */
    formatDate(date: Date | string, format: string): string;
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
     * Convert a milliseconds date to string date. Date format is YYYY-MM-DDTHH:mm:ss.
     * @param {number} date milliseconds date
     * @returns {string} date string
     */
    convertMilisecondsToDate(date: number, dateFormat?: string): string;
    /**
     * Extract pattern to use to format the date
     * @param {string} dateOGC date as an ISO 8601 date
     * @returns {string} the formatted date
     */
    extractDateFormat(dateOGC: string): string;
    /**
     * Create the Geoview time dimension from ESRI dimension
     * @param {TimeDimensionESRI} timeDimensionESRI esri time dimension object
     *
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
    /**
     * Get the date fragments order. Normaly, the order is year followed by month followed by day.
     * @param dateFormat {string} The date format to be analyzed.
     * @returns {TypeDateFragments} array of index indicating the field position in the format. index 0 is for
     * year, 1 for month, 2 for day and 4 for time. A value of -1 indicates theat the fragment is missing.
     */
    getDateFragmentsOrder(dateFormat?: string): TypeDateFragments;
    /**
     * Reorder the date to the ISO UTC format using the input section (index = 0) of the date fragments order provided.
     * This routine is used to convert the dates returned by the server to the internal ISO UTC format. It is also used
     * to convert the date constants (date '...') found in the layer filter string using a reverse time zone to return
     * the date to the same time zone the server use since the filter string will be sent to the server to perform the
     * query.
     *
     * @param date {string} The date to format.
     * @param dateFragmentsOrder {TypeDateFragments} The date fragments order (obtained with getDateFragmentsOrder).
     * @param reverseTimeZone {boolean} Flag indicating that we must change the time zone sign before the conversion.
     * @returns {string} The reformatted date string.
     */
    applyInputDateFormat(date: string, dateFragmentsOrder?: TypeDateFragments, reverseTimeZone?: boolean): string;
    /**
     * Reorder the ISO UTC date to the output format using the output section (index = 1) of the date fragments order provided.
     * The time zone is empty since all dates shown to the user are in UTC.
     *
     * @param date {string} The ISO date to format.
     * @param dateFragmentsOrder {TypeDateFragments} The date fragments order (obtained with getDateFragmentsOrder).
     * @param reverseTimeZone {boolean} Flag indicating that we must change the time zone sign before the conversion.
     * @returns {string} The reformatted date string.
     */
    applyOutputDateFormat(date: string, dateFragmentsOrder?: TypeDateFragments, reverseTimeZone?: boolean): string;
    /**
     * Deduce the date format using a date value.
     *
     * @param date {string} The date value to be used to deduce the format.
     *
     * @returns {string} The date format.
     */
    deduceDateFormat(dateString: string): string;
}
export {};
