import dayjs, { Dayjs } from 'dayjs';
import utc from 'dayjs/plugin/utc';
import duration from 'dayjs/plugin/duration';
import localizedFormat from 'dayjs/plugin/localizedFormat';

import 'dayjs/locale/en-ca';
import 'dayjs/locale/fr-ca';
import { TypeLocalizedLanguages } from '../../geo/map/map-schema-types';
import { TypeJsonObject } from '../types/global-types';

/** ******************************************************************************************************************************
 * constant/interface used to define the precision for date object (yyyy, mm, dd).
 */
const DEFAULT_DATE_PRECISION = {
  year: 'YYYY',
  month: 'YYYY-MM',
  day: 'YYYY-MM-DD',
};

/** ******************************************************************************************************************************
 * Type used to define the date precision pattern to use.
 */
type DatePrecision = 'year' | 'month' | 'day';

/** ******************************************************************************************************************************
 * constant/interface used to define the precision for time object (hh, mm, ss).
 */
const DEFAULT_TIME_PRECISION = {
  hour: 'THHZ',
  minute: 'THH:mmZ',
  second: 'THH:mm:ssZ',
};

/** ******************************************************************************************************************************
 * constant used to define the ESRI unit to OGC period conversion.
 */
const timeUnitsESRI = {
  esriTimeUnitsHours: 'H',
  esriTimeUnitsDays: 'D',
  esriTimeUnitsWeeks: 'W',
  esriTimeUnitsMonths: 'M',
  esriTimeUnitsYears: 'Y',
};

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

dayjs.extend(utc);
dayjs.extend(duration);
dayjs.extend(localizedFormat);

/**
 * Create a date module to handle date format and creation who support ISO standard.
 * - https://www.iso.org/iso-8601-date-and-time-format.html
 * - https://en.wikipedia.org/wiki/ISO_8601
 * - https://www.mapserver.org/ogc/wms_time.html
 * - https://mirzaleka.medium.com/the-complete-guide-to-day-js-fb835a5d945a
 */

/**
 * IMPORTANT WMS-Time dimension Specification
 * Conformant WMS servers and clients SHALL specify all time values in Coordinated Universal Time (UTC) so that “Z” is the only
 * time zone designator allowed. Conformant WMS servers SHALL use the dimension REFERENCE_TIME only with units declared using the
 * units identifier ”ISO8601” to indicate time values conformant with the standard ISO8601:2000. The use of a DEFAULT value for
 * REFERENCE_TIME is intended for mass market clients.
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
const isValidDuration = (durationCheck: string) => dayjs.isDuration(dayjs.duration(durationCheck));
const isDiscreteRange = (ogcTimeDimension: string) => ogcTimeDimension.split(',').length > 1;
const isAbsoluteRange = (ogcTimeDimension: string) => ogcTimeDimension.split('/').length === 3;
const isRelativeRange = (ogcTimeDimension: string) => ogcTimeDimension.split('/').length === 2;

/**
 * Class used to handle date as ISO 8601
 *
 * @exports
 * @class DateMgt
 */
export class DateMgt {
  /**
   * Convert a UTC date to a local date
   * @param {Date | string} date date to use
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
   * @param {Date | string} date date to use
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
   * @param {Date | string} date date to use
   * @param {DatePrecision} datePattern the date precision pattern to use
   * @param {TimePrecision}timePattern the time precision pattern to use
   * @returns {string} formatted date
   */
  format(date: Date | string, datePattern: DatePrecision, timePattern?: TimePrecision): string {
    // check if it is a valid date
    if (typeof date === 'string' && !isValidDate(date)) throw INVALID_DATE;

    // create or reformat date in ISO format
    const pattern = `${DEFAULT_DATE_PRECISION[datePattern]}${timePattern !== undefined ? DEFAULT_TIME_PRECISION[timePattern] : ''}`;

    // output as local by default
    return dayjs(date).utc(true).format(pattern);
  }

  /**
   * Convert a date to milliseconds
   * @param {Date | string} date date to use
   * @returns {number} date as milliseconds
   */
  convertToMilliseconds(date: Date | string): number {
    // check if it is a valid date
    if (typeof date === 'string' && !isValidDate(date)) throw INVALID_DATE;

    return dayjs(date).valueOf();
  }

  /**
   * Convert a milliseconds date to string date
   * @param {number} date milliseconds date
   * @returns {string} date string
   */
  convertToDate(date: number, dateFormat = 'YYYY-MM-DDTHH:mm:ss'): string {
    // TODO check if date is in UTC or local
    return dayjs(date).utc(true).format(dateFormat);
  }

  /**
   * Extract pattern to use to format the date
   * @param {string} dateOGC date as an ISO 8601 date
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
   * Create the Geoview time dimension from ESRI dimension
   * @param {TimeDimensionESRI} timeDimensionESRI esri time dimension object
   * @returns {TimeDimension} the Geoview time dimension
   */
  createDimensionFromESRI(timeDimensionESRI: TimeDimensionESRI): TimeDimension {
    const { startTimeField, timeExtent, timeInterval, timeIntervalUnits } = timeDimensionESRI;

    // create interval string
    const calcDuration = () => {
      let interval = '';
      if (timeIntervalUnits !== undefined && timeInterval !== undefined) {
        if (timeUnitsESRI[timeIntervalUnits] !== undefined) {
          interval = `/P${timeInterval}${timeUnitsESRI[timeIntervalUnits]}`;
        }
      }

      return interval;
    };

    const dimensionValues = `${this.convertToDate(timeExtent[0])}/${this.convertToDate(timeExtent[1])}${calcDuration()}`;
    const rangeItem = this.createRangeOGC(dimensionValues);
    const timeDimension: TimeDimension = {
      field: startTimeField,
      default: rangeItem.range[0],
      unitSymbol: '',
      range: rangeItem,
      nearestValues: startTimeField === '' ? 'absolute' : 'discrete',
      singleHandle: false,
    };

    return timeDimension;
  }

  /**
   * Create the Geoview time dimension from OGC dimension
   * @param {TypeJsonObject | string} ogcTimeDimension The OGC time dimension object or string
   * @returns {TimeDimension} the Geoview time dimension
   */
  createDimensionFromOGC(ogcTimeDimension: TypeJsonObject | string): TimeDimension {
    const dimensionObject = typeof ogcTimeDimension === 'object' ? ogcTimeDimension : JSON.parse(<string>ogcTimeDimension);
    const timeDimension: TimeDimension = {
      field: dimensionObject.name,
      default: dimensionObject.default,
      unitSymbol: dimensionObject.unitSymbol || '',
      range: this.createRangeOGC(dimensionObject.values),
      nearestValues: dimensionObject.nearestValues ? 'absolute' : 'discrete',
      singleHandle: false,
    };

    return timeDimension;
  }

  /**
   * Create a range of date object from OGC time dimension following ISO 8601
   * @param {string} ogcTimeDimension OGC time dimension values following
   * @returns {RangeItems} array of date from the dimension
   */
  createRangeOGC(ogcTimeDimensionValues: string): RangeItems {
    let rangeItems: RangeItems = { type: 'none', range: [] };

    // find what type of dimension it is:
    //    discrete = 1696, 1701, 1734, 1741
    //    discrete 2022-04-27T14:50:00Z/2022-04-27T17:50:00Z/PT10M
    //    relative 2022-04-27T14:50:00Z/PT10M OR 2022-04-27T14:50:00Z/2022-04-27T17:50:00Z
    // and create the range object
    if (isDiscreteRange(ogcTimeDimensionValues))
      rangeItems = { type: 'discrete', range: ogcTimeDimensionValues.replace(/\s/g, '').split(',') };
    else if (isRelativeRange(ogcTimeDimensionValues))
      rangeItems = { type: 'relative', range: this.#createRelativeIntervale(ogcTimeDimensionValues) };
    else if (isAbsoluteRange(ogcTimeDimensionValues))
      rangeItems = { type: 'discrete', range: this.#createAbsoluteInterval(ogcTimeDimensionValues) };

    // check if dimension is valid
    if (rangeItems.range.length === 0) throw INVALID_TIME_DIMENSION;

    // create marker array from OGC time dimension
    return rangeItems;
  }

  /**
   * Create locale tooltip (fr-CA or en-CA)
   * @param date {string} date to use
   * @param locale {string} locale to use (fr-CA or en-CA)
   * @returns {string} locale tooltip
   */
  createDateLocaleTooltip(date: string, locale: TypeLocalizedLanguages): string {
    // Handle locale for date label
    const tooltips = dayjs(date)
      .locale(`${locale}-CA`)
      .format(`${date.split('T').length > 1 ? 'LLL' : 'LL'}`);

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
    // A client may request information over an interval instead of a single instant by specifying a start and end time, separated by a / character with a duration.
    // 2002-09-01T00:00:00.0Z/2002-09-30T23:59:59.999Z/P1D
    const [date1, date2, durationCheck]: string[] = ogcTimeDimension.split('/');

    // check if dates are valid
    if (!isValidDate(date1)) throw INVALID_DATE;
    if (!isValidDate(date2)) throw INVALID_DATE;
    if (!isValidDuration(durationCheck)) throw INVALID_TIME_DIMENSION_DURATION;

    // get the date format
    const format: string = this.extractDateFormat(date1);

    // set min and max
    const min: string = dayjs(date1).format(format);
    const max: string = dayjs(date2).format(format);

    // create intervalle items
    const msDuration: number = dayjs.duration(durationCheck).asMilliseconds();
    const items: string[] = [];
    let i = 1;

    // TODO: handle leap year
    items.push(min);
    do {
      const calcDuration = dayjs.duration({ milliseconds: i * msDuration });
      items.push(dayjs(min).add(calcDuration).format(format));
      i++;
    } while (dayjs(items[items.length - 1]).isBefore(max));

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
    // A client may request information over a continuous interval instead of a single instant by specifying a start and end time, separated by a / character.
    // One end of the interval must be a time value, but the other may be a duration
    // 2002-09-01T00:00:00.0Z/P1M or 2002-09-01T00:00:00.0Z/2022-12-01T00:00:00.0Z !!! NOT SUPPORTED FOR NOW PT36H/PRESENT
    const [date, durationCheck]: string[] = ogcTimeDimension.split('/');

    // check if date and duration are valid
    if (!isValidDuration(durationCheck) && !isValidDate(durationCheck)) throw INVALID_TIME_DIMENSION_DURATION;
    if (!isValidDate(date)) throw INVALID_DATE;

    // get the date format
    const format: string = this.extractDateFormat(date);

    // set min and max (from duration or date)
    const msDuration = dayjs.duration(durationCheck);
    const min: string = dayjs(date).format(format);
    const max: Dayjs = !isValidDate(durationCheck) ? dayjs(date).add(msDuration) : dayjs(durationCheck);

    return [min, dayjs(max).format(format)];
  }
}
