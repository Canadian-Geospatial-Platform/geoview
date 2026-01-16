import type { Dayjs } from 'dayjs';
import 'dayjs/locale/en-ca';
import 'dayjs/locale/fr-ca';
import type { TypeDisplayLanguage } from '@/api/types/map-schema-types';
import type { TypeMetadataWMSCapabilityLayerDimension } from '@/api/types/layer-schema-types';
export type TypeDateFragments = [number[], number[], string[]];
/**
 * Type used to define the date precision pattern to use.
 */
export type DatePrecision = 'year' | 'month' | 'day' | undefined;
/**
 * Type used to define the time precision pattern to use.
 */
export type TimePrecision = 'hour' | 'minute' | 'second' | undefined;
/**
 * Type used to define the range values for an OGC time dimension.
 */
type RangeItems = {
    type: string;
    range: string[];
};
/**
 * Type used to define the GeoView OGC time dimension.
 */
export type TimeDimension = {
    field: string;
    default: string[];
    unitSymbol?: string;
    rangeItems: RangeItems;
    nearestValues: 'discrete' | 'absolute';
    singleHandle: boolean;
    displayPattern: [DatePrecision | undefined, TimePrecision | undefined];
    isValid: boolean;
};
/**
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
export declare abstract class DateMgt {
    #private;
    /**
     * Convert a UTC date to a local date
     * @param {Date | string} date date to use
     * @returns {string} local date
     */
    static convertToLocal(date: Date | string): string;
    /**
     * Convert a date local to a UTC date
     * @param {Date | string} date date to use
     * @returns {string} UTC date or empty string if invalid date (when field value is null)
     */
    static convertToUTC(date: Date | string): string;
    /**
     * Format a date to specific format like 'YYYY-MM-DD'
     * @param {Date | string} date date to use
     * @param {string} format format of the date.
     * @returns {string} formatted date
     */
    static formatDate(date: Date | string, format: string): string;
    /**
     * Format a date to a pattern
     * @param {Date | string} date date to use
     * @param {DatePrecision} datePattern the date precision pattern to use
     * @param {TimePrecision}timePattern the time precision pattern to use
     * @returns {string} formatted date
     */
    static formatDatePattern(date: Date | number | string, datePattern: DatePrecision, timePattern?: TimePrecision): string;
    /**
     * Converts a Date object to an ISO 8601 formatted string in the local time zone.
     * The resulting string will be in the format: YYYY-MM-DDTHH:mm:ss.sss
     *
     * @param {Date | number | string} date - The Date object to be formatted.
     * @returns {string} The formatted date string in ISO 8601 format.
     *
     * @throws {TypeError} If the input is not a valid Date object.
     */
    static formatDateToISO(date: Date | number | string): string;
    /**
     * Attempts to guess the display pattern for a given date based on the provided format string.
     *
     * @param {(Date | number | string)[]} dates - An array of dates to analyze. Can be Date objects, timestamps (numbers), or date strings.
     * @param {boolean} [onlyMinMax=true] - If true, only considers the minimum and maximum dates in the array.
     * @returns {[DatePrecision | undefined, TimePrecision | undefined]} A tuple containing the guessed date and time precision.
     */
    static guessDisplayPattern(dates: Date[] | number[] | string[], onlyMinMax?: boolean): [DatePrecision | undefined, TimePrecision | undefined];
    /**
     * Convert a date to milliseconds
     * @param {Date | string} date date to use
     * @returns {number} date as milliseconds
     */
    static convertToMilliseconds(date: Date | string): number;
    /**
     * Convert a milliseconds date to string date. Date format is YYYY-MM-DDTHH:mm:ss.
     * @param {number} date milliseconds date
     * @returns {string} date string
     */
    static convertMilisecondsToDate(date: number, dateFormat?: string): string;
    /**
     * Extract pattern to use to format the date
     * @param {string} dateOGC date as an ISO 8601 date
     * @returns {string} the formatted date
     */
    static extractDateFormat(dateOGC: string): string;
    /**
     * Create the Geoview time dimension from ESRI dimension
     * @param {TimeDimensionESRI} timeDimensionESRI esri time dimension object
     * @param {boolean} singleHandle true if it is ESRI Image
     *
     * @returns {TimeDimension} the Geoview time dimension
     */
    static createDimensionFromESRI(timeDimensionESRI: TimeDimensionESRI, singleHandle?: boolean): TimeDimension;
    /**
     * Create the Geoview time dimension from OGC dimension
     * @param {TypeMetadataWMSCapabilityLayerDimension | string} ogcTimeDimension The OGC time dimension object or string
     * @returns {TimeDimension} the Geoview time dimension
     */
    static createDimensionFromOGC(ogcTimeDimension: TypeMetadataWMSCapabilityLayerDimension | string): TimeDimension;
    /**
     * Create a range of date object from OGC time dimension following ISO 8601
     * @param {string} ogcTimeDimension OGC time dimension values following
     * @returns {RangeItems} array of date from the dimension
     */
    static createRangeOGC(ogcTimeDimensionValues: string): RangeItems;
    /**
     * Create locale tooltip (fr-CA or en-CA)
     * @param date {string} date to use
     * @param locale {string} locale to use (fr-CA or en-CA)
     * @returns {string} locale tooltip
     */
    static createDateLocaleTooltip(date: string, locale: TypeDisplayLanguage): string;
    /**
     * Returns the input/output fragment order and separators for a given date format.
     * Supports formats like "YYYY-MM-DD", "YYYY-MM-DDTHH:MM:SS", or "YYYY-MM-DDZ".
     *
     * @param {string} [dateFormat] - Optional date format string to analyze.
     * @returns {TypeDateFragments} The input/output fragment positions and separators.
     *
     * @throws {Error} When the provided date format is invalid.
     */
    static getDateFragmentsOrder(dateFormat?: string): TypeDateFragments;
    /**
     * Converts and normalizes a date string into a standard ISO8601 UTC-based format.
     * This function supports a variety of input formats:
     * - Partial dates: "YYYY", "YYYY-MM", "YYYY-MM-DD"
     * - Dates with or without time: "YYYY-MM-DD", "YYYY-MM-DDTHH:mm", etc.
     * - UTC "Z" suffix: "1988-09-13Z"
     * - Flexible separators: "/" → "-", space → "T"
     * It applies defaults for missing components:
     * - Missing month/day defaults to "01"
     * - Missing time defaults to "00:00:00"
     * - Missing timezone defaults to the configured separator and offset (typically "+00:00")
     * Optional features:
     * - reverseTimeZone: flips the sign of the timezone offset if provided
     * @param {string} date - The input date string to normalize.
     * @param {TypeDateFragments} [dateFragmentsOrder=ISO_UTC_DATE_FRAGMENTS_ORDER] - Configuration array
     *   defining the index order of year, month, day, and separator characters.
     * @param {boolean} [reverseTimeZone=false] - If true, reverses the sign of the timezone offset.
     * @returns {string} The normalized ISO8601 date string, e.g., "1988-09-13T00:00:00Z".
     * @throws {Error} Throws an error if the input cannot be parsed or normalized into a valid ISO date.
     * @example
     * applyInputDateFormat("1988-09-13Z");
     * // returns "1988-09-13T00:00:00Z"
     * @example
     * applyInputDateFormat("1988-9-3 14:5");
     * // returns "1988-09-03T14:05:00+00:00" (assuming default separators)
     * @example
     * applyInputDateFormat("1988-09", ISO_UTC_DATE_FRAGMENTS_ORDER, true);
     * // returns "1988-09-01T00:00:00+00:00" (timezone reversed if needed)
     */
    static applyInputDateFormat(date: string, dateFragmentsOrder?: TypeDateFragments, reverseTimeZone?: boolean): string;
    /**
     * Reorder the ISO UTC date to the output format using the output section (index = 1) of the date fragments order provided.
     * The time zone is empty since all dates shown to the user are in UTC.
     *
     * @param date {string} The ISO date to format.
     * @param dateFragmentsOrder {TypeDateFragments} The date fragments order (obtained with getDateFragmentsOrder).
     * @param reverseTimeZone {boolean} Flag indicating that we must change the time zone sign before the conversion.
     * @returns {string} The reformatted date string.
     */
    static applyOutputDateFormat(date: string, dateFragmentsOrder?: TypeDateFragments, reverseTimeZone?: boolean): string;
    /**
     * Deduce the date format using a date value.
     *
     * @param date {string} The date value to be used to deduce the format.
     *
     * @returns {string} The date format.
     */
    static deduceDateFormat(dateString: string): string;
    /**
     * Get dayjs date object for given date in number or string.
     * @param {number | string} millseconds time in milliseconds or string
     * @returns {Dayjs} dayjs date object
     */
    static getDayjsDate(date: number | string): Dayjs;
}
export {};
//# sourceMappingURL=date-mgt.d.ts.map