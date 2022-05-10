import { DatePrecision, TimePrecision, TypeLocalizedLanguages } from '../types/cgpv-types';
import 'dayjs/locale/en-ca';
import 'dayjs/locale/fr-ca';
/**
 * Class used to handle date as ISO 8601
 *
 * @export
 * @class DateMgt
 */
export declare class DateMgt {
    #private;
    /**
     * Convert a UTC date to a local date
     * @param date {Date | string} date to use
     * @returns {string} local date
     */
    convertToLocal(date: Date | string): string;
    /**
     * Convert a date local to a UTC date
     * @param date {Date | string} date to use
     * @returns {string} UTC date
     */
    convertToUTC(date: Date | string): string;
    /**
     * Format a date to a pattern
     * @param date {Date | string} date to use
     * @param datePattern {DatePrecision} the date precision pattern to use
     * @param timePattern {TimePrecision} the time precision pattern to use
     * @returns {string} formatted date
     */
    format(date: Date | string, datePattern: DatePrecision, timePattern?: TimePrecision): string;
    /**
     * Convert a date to milliseconds
     * @param date {Date | string} date to use
     * @returns {number} date as milliseconds
     */
    convertToMilliseconds(date: Date | string): number;
    /**
     * Convert a milliseconds date to string date
     * @param date {number} milliseconds date
     * @returns {string} date string
     */
    convertToDate(date: number): string;
    /**
     * Extract pattern to use to format the date
     * @param dateOGC {string} date as an ISO 8601 date
     * @returns {string} the formatted date
     */
    extractDateFormat(dateOGC: string): string;
    /**
     * Create a range of date object from OGC time dimension following ISO 8601
     * @param ogcTimeDimension {string} OGC time dimension following ISO 8001
     * @returns {string[]} array of date from the dimension
     */
    createRangeOGC(ogcTimeDimension: string): string[];
    /**
     * Create locale tooltip (fr-CA or en-CA)
     * @param date {string} date to use
     * @param locale {string} locale to use (fr-CA or en-CA)
     * @returns {string} locale tooltip
     */
    createDateLocaleTooltip(date: string, locale: TypeLocalizedLanguages): string;
}
