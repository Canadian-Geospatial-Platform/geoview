import dayjs, { Dayjs } from 'dayjs';
import utc from 'dayjs/plugin/utc';
import duration from 'dayjs/plugin/duration';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import 'dayjs/locale/en-ca'
import 'dayjs/locale/fr-ca'
dayjs.extend(utc);
dayjs.extend(duration);
dayjs.extend(localizedFormat);

import { DatePrecision, DEFAULT_DATE_PRECISION, TimePrecision, DEFAULT_TIME_PRECISION, TypeLocalizedLanguages } from '../types/cgpv-types';

/**
 * Create a date module to handle date format and creation who support ISO standard.
 * - https://www.iso.org/iso-8601-date-and-time-format.html
 * - https://en.wikipedia.org/wiki/ISO_8601
 * - https://www.mapserver.org/ogc/wms_time.html
 * - https://mirzaleka.medium.com/the-complete-guide-to-day-js-fb835a5d945a
 */

/**
 * IMPORANT WMS-Time dimension Specification
 * Conformant WMS servers and clients SHALL specify all time values in Coordinated Universal Time (UTC) so that “Z” is the only time zone designator allowed.
 * Conformant WMS servers SHALL use the dimension REFERENCE_TIME only with units declared using the units identifier ”ISO8601” to indicate time values conformant with the standard ISO8601:2000
 * The use of a DEFAULT value for REFERENCE_TIME is intended for mass market clients.
 */

/**
 * Times follow the general format: yyyy-MM-ddThh:mm:ss.SSSZ
 * where: yyyy: 4-digit year
 *        MM: 2-digit month
 *        dd: 2-digit day
 *        hh: 2-digit hour
 *        mm: 2-digit minute
 *        ss: 2-digit second
 *        SSS: 3-digit millisecond
 *        T: date time separator
 *        Z: Zulu time zone (UTC) (The WMS specification does not provide for other time zones)
 * 
 * Time Patterns | Examples
 *    YYYY-MM-DDTHH:MM:SSZ | 2004-10-12T13:55:20Z
 *    YYYY-MM-DDTHH:MM:SS | 2004-10-12T13:55:20
 *    YYYY-MM-DD HH:MM:SS | 2004-10-12 13:55:20
 *    YYYY-MM-DDTHH:MM | 2004-10-12T13:55
 *    YYYY-MM-DD HH:MM | 2004-10-12 13:55
 *    YYYY-MM-DDTHH | 2004-10-12T13
 *    YYYY-MM-DD HH | 2004-10-12 13
 *    YYYY-MM-DD | 2004-10-12
 *    YYYY-MM | 2004-10
 *    YYYY | 2004
 *    THH:MM:SSZ | T13:55:20Z
 *    THH:MM:SS | T13:55:20
 */

/**
 * Time durations define the amount of intervening time in a time interval and are
 * represented by the format P[n]Y[n]M[n]DT[n]H[n]M[n]S or P[n]W as shown on the aside
 *  P is the duration designator (for period) placed at the start of the duration representation.
 *    Y is the year designator that follows the value for the number of calendar years.
 *    M is the month designator that follows the value for the number of calendar months.
 *    D is the day designator that follows the value for the number of calendar days.
 *  T is the time designator that precedes the time components of the representation.
 *    W is the week designator that follows the value for the number of weeks,
 *    H is the hour designator that follows the value for the number of hours.
 *    M is the minute designator that follows the value for the number of minutes.
 *    S is the second designator that follows the value for the number of seconds.
 * 
 * For example, "P3Y6M4DT12H30M5S" represents a duration of "three years, six months, four days, twelve hours, thirty minutes, and five seconds"
 */

const INVALID_DATE = 'Invalid Date';
const INVALID_TIME_DIMENSION = 'Invalid Time Dimension';
const INVALID_TIME_DIMENSION_DURATION = 'Invalid Time Dimension Duration';
const isValidDate = (date: string) => dayjs(date).isValid();
const isValidDuration = (duration: string) => dayjs.isDuration(dayjs.duration(duration));
const isDiscreteRange = (ogcTimeDimension: string) => ogcTimeDimension.split(',').length > 1;
const isAbsoluteRange = (ogcTimeDimension: string) => ogcTimeDimension.split('/').length > 1;
const isRelativeRange = (ogcTimeDimension: string) => ogcTimeDimension.split('/')[1].substring(0,1) === 'P';

/**
 * Class used to handle date as ISO 8601
 *
 * @export
 * @class DateMgt
 */
export class DateMgt {
  /**
   * Convert a UTC date to a local date
   * @param date {Date | string} date to use
   * @returns {string} local date
   */
  convertToLocal(date: Date | string): string {
    // check if it is a valid date
    if (typeof date === 'string' && !isValidDate(date)) throw INVALID_DATE;

    // return ISO string not UTC, conversion from locale setting
    return dayjs(date).local().format();
  }

  /**
   * Convert a date local to a UTC date
   * @param date {Date | string} date to use
   * @returns {string} UTC date
   */
  convertToUTC(date: Date | string): string {
    // check if it is a valid date
    if (typeof date === 'string' && !isValidDate(date)) throw INVALID_DATE;

    // return ISO string
    return dayjs(date).utc(true).format();
  }

  /**
   * Format a date to a pattern
   * @param date {Date | string} date to use
   * @param datePattern {DatePrecision} the date precision pattern to use
   * @param timePattern {TimePrecision} the time precision pattern to use
   * @returns {string} formatted date
   */
  format(date: Date | string, datePattern: DatePrecision, timePattern?: TimePrecision): string {
    // check if it is a valid date
    if (typeof date === 'string' && !isValidDate(date)) throw INVALID_DATE;

    // create or reformat date in ISO format
    const pattern = `${datePattern}${timePattern !== undefined ? timePattern : ''}`;

    // output as local by default
    return dayjs(date).utc(true).format(pattern);
  }

  /**
   * Convert a date to milliseconds
   * @param date {Date | string} date to use
   * @returns {number} date as milliseconds
   */
  convertToMilliseconds(date: Date | string): number {
    // check if it is a valid date
    if (typeof date === 'string' && !isValidDate(date)) throw INVALID_DATE;

    return dayjs(date).valueOf();
  }

  /**
   * Convert a milliseconds date to string date
   * @param date {number} milliseconds date
   * @returns {string} date string
   */
  convertToDate(date: number): string {
    // TODO check if date is in UTC or local
    return dayjs(date).utc(true).format();
  }

  /**
   * Extract pattern to use to format the date
   * @param dateOGC {string} date as an ISO 8601 date
   * @returns {string} the formatted date
   */
  extractDateFormat(dateOGC: string): string {
    // check if it is a valid date
    if (typeof dateOGC === 'string' && !isValidDate(dateOGC)) throw INVALID_DATE;

    // extract date pattern
    const [date, time]: string[] = dateOGC.split('T');

    // get date format
    let datePrecision: DatePrecision;
    if (date.split('-').length === 3) datePrecision = 'day';
    else if (date.split('-').length === 2) datePrecision = 'month';
    else datePrecision = 'year';

    // get time format
    let timePrecision: TimePrecision;
    if (time !== undefined && time.split(':').length === 3) timePrecision = 'second';
    else if (time !== undefined && time.split(':').length === 2) timePrecision = 'minute';
    else timePrecision = 'hour';

    // full format
    const fullFormat = `${DEFAULT_DATE_PRECISION[datePrecision]}${time !== undefined ? DEFAULT_TIME_PRECISION[timePrecision] : ''}`;

    return fullFormat;
  }

  /**
   * Create a range of date object from OGC time dimension following ISO 8601
   * @param ogcTimeDimension {string} OGC time dimension following ISO 8001
   * @returns {string[]} array of date from the dimension
   */
  createRangeOGC(ogcTimeDimension: string): string[] {
    let rangeItems: string[] = [];

    // find what type of dimension it is:
    //    discrete = 1696, 1701, 1734, 1741
    //    absolute 2022-04-27T14:50:00Z/2022-04-27T17:50:00Z/PT10M or 2022-04-27T14:50:00Z/2022-04-27T17:50:00Z
    //    relative 2022-04-27T14:50:00Z/PT10M
    // and create the range object
    if (isDiscreteRange(ogcTimeDimension)) rangeItems = ogcTimeDimension.split(',');
    else if (isRelativeRange(ogcTimeDimension)) rangeItems = this.#createRelativeIntervale(ogcTimeDimension);
    else if (isAbsoluteRange(ogcTimeDimension)) rangeItems = this.#createAbsoluteInterval(ogcTimeDimension);
    
    // cheak if dimension is valid
    if (rangeItems.length === 0) throw INVALID_TIME_DIMENSION;

    // create marker array from OGC time dimension
    return rangeItems
  }

  /**
   * Create locale tooltip (fr-CA or en-CA)
   * @param date {string} date to use
   * @param locale {string} locale to use (fr-CA or en-CA)
   * @returns {string} locale tooltip
   */
  createDateLocaleTooltip(date: string, locale: TypeLocalizedLanguages): string {
    // Handle locale for date label
    const tooltips = dayjs(date).locale(locale).format(`${date.split('T').length > 1 ? 'LLL' : 'LL'}`);

    return tooltips;
  }

  /**
   * Create range and the markers interval from OGC time dimension following ISO 8601 for absolute with period
   * @private
   * @param ogcTimeDimension {string} OGC time dimension following ISO 8001
   * @returns {string[]} array of date from the dimension
   */
  #createAbsoluteInterval(ogcTimeDimension: string): string[] {
    // Absolute interval:
    // A client may request information over a continuous interval instead of a single instant by specifying a start and end time, separated by a / character.
    // 2002-09-01T00:00:00.0Z/2002-09-30T23:59:59.999Z
    const [date1, date2, duration]: string[] = ogcTimeDimension.split('/');

    // check if dates are valid
    if (!isValidDate(date1)) throw INVALID_DATE;
    if (!isValidDate(date2)) throw INVALID_DATE;
    if (!isValidDuration(duration)) throw INVALID_TIME_DIMENSION_DURATION;

    // get the date format
    const format: string = this.extractDateFormat(date1);

    // set min and max
    const min: string = dayjs(date1).format(format);
    const max: string = dayjs(date2).format(format);

    // create intervalle items
    const msDuration: number = dayjs.duration(duration).asMilliseconds();
    const items: string[] = [];
    let i = 0;

    // TODO: handle leap year
    do {
      let calcDuration = i * msDuration;
      items.push(dayjs(min).add(calcDuration).format(format));
      i++
    } while (dayjs(items[items.length -1]).isBefore(max));

    // add last item
    items.push(max);

    return items;
  }

  /**
   * Create range from OGC time dimension following ISO 8601 for relative interval
   * @private
   * @param ogcTimeDimension {string} OGC time dimension following ISO 8001
   * @returns {string[]} array of date from the dimension
   */
  #createRelativeIntervale(ogcTimeDimension: string): string[] {
    // Relative interval:
    // A client may request information over a relative time interval instead of a set time range by specifying a start or end time with an associated duration, separated by a / character.
    // One end of the interval must be a time value, but the other may be a duration
    // 2002-09-01T00:00:00.0Z/P1M or !!! NOT SUPPORTED FOR NOW PT36H/PRESENT
    const [date, duration]: string[] = ogcTimeDimension.split('/');

    // check if date and duration are valid
    if (!isValidDuration(duration)) throw INVALID_TIME_DIMENSION_DURATION;
    if (!isValidDate(date)) throw INVALID_DATE;

    // get the date format
    const format: string = this.extractDateFormat(date);

    // set min and max
    const msDuration = dayjs.duration(duration);
    const min: string = dayjs(date).format(format);
    const max: Dayjs = dayjs(date).add(msDuration);

    return [min, dayjs(max).format(format)];
  }
}
