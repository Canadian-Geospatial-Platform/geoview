/* eslint-disable prefer-destructuring */
import dayjs, { Dayjs } from 'dayjs';
import utc from 'dayjs/plugin/utc';
import duration from 'dayjs/plugin/duration';
import localizedFormat from 'dayjs/plugin/localizedFormat';

import 'dayjs/locale/en-ca';
import 'dayjs/locale/fr-ca';
import { TypeLocalizedLanguages } from '../../geo/map/map-schema-types';
import { TypeJsonObject } from '../types/global-types';

export type TypeDateFragments = [number[], number[], string[]];

const FIRST_DATE_ELEMENT = 0;
const DATE = 0;
const SECOND_DATE_ELEMENT = 1;
const THIRD_DATE_ELEMENT = 2;
const DATE_TIME = 2;
const TIME = 3;
const YEAR = 0;
const MONTH = 1;
const DAY = 2;
const TIME_ZONE_SEPARATOR = 3;
const TIME_ZONE = 4;

const ISO_UTC_DATE_FRAGMENTS_ORDER: TypeDateFragments = [
  [0, 1, 2, 3],
  [0, 1, 2, 3],
  ['-', '-', 'T', '+', '00:00'],
];

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
    if (typeof date === 'string' && !isValidDate(date)) throw new Error(`${INVALID_DATE} (convertToLocal)`);

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
    if (typeof date === 'string' && !isValidDate(date)) throw new Error(`${INVALID_DATE} (convertToUTC)`);

    // return ISO string
    return dayjs(date).utc(false).format();
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
    if (typeof date === 'string' && !isValidDate(date)) throw new Error(`${INVALID_DATE} (format)`);

    // create or reformat date in ISO format
    const pattern = `${DEFAULT_DATE_PRECISION[datePattern]}${timePattern !== undefined ? DEFAULT_TIME_PRECISION[timePattern] : ''}`;

    // output as local by default
    return dayjs(date).utc(false).format(pattern);
  }

  /**
   * Convert a date to milliseconds
   * @param {Date | string} date date to use
   * @returns {number} date as milliseconds
   */
  convertToMilliseconds(date: Date | string): number {
    // check if it is a valid date
    if (typeof date === 'string' && !isValidDate(date)) throw new Error(`${INVALID_DATE} (convertToMilliseconds)`);

    return dayjs(date).valueOf();
  }

  /**
   * Convert a milliseconds date to string date. Date format is YYYY-MM-DDTHH:mm:ss.
   * @param {number} date milliseconds date
   * @returns {string} date string
   */
  convertMilisecondsToDate(date: number, dateFormat = 'YYYY-MM-DDTHH:mm:ss'): string {
    return dayjs(date).utc(false).format(dateFormat);
  }

  /**
   * Extract pattern to use to format the date
   * @param {string} dateOGC date as an ISO 8601 date
   * @returns {string} the formatted date
   */
  extractDateFormat(dateOGC: string): string {
    // check if it is a valid date
    if (typeof dateOGC === 'string' && !isValidDate(dateOGC)) throw new Error(`${INVALID_DATE} (extractDateFormat)`);

    // extract date pattern
    const [date, time]: string[] = dateOGC.split('T');

    // get date format
    let datePrecision: DatePrecision;
    if (date.split('-').length === 3) datePrecision = 'day';
    else if (date.split('-').length === 2) datePrecision = 'month';
    else datePrecision = 'year';

    // get time format
    let timePrecision: TimePrecision;
    if (time) {
      const numberOfTimeElements = time.slice(0, 8).split(':').length;
      if (numberOfTimeElements === 3) timePrecision = 'second';
      else if (numberOfTimeElements === 2) timePrecision = 'minute';
      else timePrecision = 'hour';
      return `${DEFAULT_DATE_PRECISION[datePrecision]}${DEFAULT_TIME_PRECISION[timePrecision]}`;
    }

    return DEFAULT_DATE_PRECISION[datePrecision];
  }

  /**
   * Create the Geoview time dimension from ESRI dimension
   * @param {TimeDimensionESRI} timeDimensionESRI esri time dimension object
   *
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

    const dimensionValues = `${this.convertMilisecondsToDate(timeExtent[0])}Z/${this.convertMilisecondsToDate(
      timeExtent[1]
    )}Z${calcDuration()}`;
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
    if (!isValidDate(date1)) throw new Error(`${INVALID_DATE} (createAbsoluteInterval)`);
    if (!isValidDate(date2)) throw new Error(`${INVALID_DATE} (createAbsoluteInterval)`);
    if (!isValidDuration(durationCheck)) throw INVALID_TIME_DIMENSION_DURATION;
    const endsWithZ = date1.slice(-1).toUpperCase() === 'Z';

    // get the date format
    const format: string = this.extractDateFormat(date1);

    // set min and max
    const min: string = endsWithZ ? `${dayjs(date1).utc(false).format(format).slice(0, -6)}Z` : dayjs(date1).utc(false).format(format);
    const max: string = endsWithZ ? `${dayjs(date2).utc(false).format(format).slice(0, -6)}Z` : dayjs(date2).utc(false).format(format);

    // create intervalle items
    const msDuration: number = dayjs.duration(durationCheck).asMilliseconds();
    const calcDuration = dayjs.duration({ milliseconds: msDuration });
    const items: string[] = [];
    let i = 0;

    items.push(min);
    do {
      let nextDate: string = dayjs(items[i]).add(calcDuration).utc(false).format(format);
      if (endsWithZ) nextDate = `${nextDate.slice(0, -6)}Z`;
      items.push(nextDate);
      // Apply a correction if it is a leap year
      if (msDuration === 31536000000 && items[i].slice(4, 10) !== items[i + 1].slice(4, 10)) {
        nextDate = dayjs(items[i])
          .add(dayjs.duration({ milliseconds: 31622400000 }))
          .utc(false)
          .format(format);
        if (endsWithZ) nextDate = `${nextDate.slice(0, -6)}Z`;
        items[i + 1] = nextDate;
      }
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
    if (!isValidDate(date)) throw new Error(`${INVALID_DATE} (createRelativeIntervale)`);

    // get the date format
    const format: string = this.extractDateFormat(date);

    // set min and max (from duration or date)
    const msDuration = dayjs.duration(durationCheck);
    const min: string = dayjs(date).utc(false).format(format);
    const max: Dayjs = !isValidDate(durationCheck) ? dayjs(date).add(msDuration) : dayjs(durationCheck);

    return [min, dayjs(max).utc(false).format(format)];
  }

  /**
   * Get the date fragments order. Normaly, the order is year followed by month followed by day.
   * @param dateFormat {string} The date format to be analyzed.
   * @returns {TypeDateFragments} array of index indicating the field position in the format. index 0 is for
   * year, 1 for month, 2 for day and 4 for time. A value of -1 indicates theat the fragment is missing.
   */
  getDateFragmentsOrder(dateFormat?: string): TypeDateFragments {
    /*
      The structure of the date fragments is:
        index 0 for the input format;
        index 1 for the output format;
        index 2 for the date separators and the time zone extracted from the dateFormat parameter. These values are
        used to format the output dates. Input dates are converted to UTC ISO format.
        The meaning of the dateFragmentsOrder elements are as follow:
        [
          [year position, month position, day position, time position], <- input format
          [fist date element position, second date element position, third date element position, time position], <- output format
          [first date separator, second date separator, time separator, time zone separator, absolute value of time zone]
        ]
        Date separator are '/' or '-', time separator is either ' ' or 'T' and time zone separator is the sign ('+' or '-')
        to apply to the absolute value of time zone. Note that inputFragments (dateFragmentsOrder[0]) is only used for
        internal formatting and outputFragments (dateFragmentsOrder[1]) for output formatting.
    */
    const inputFragments = [-1, -1, -1, -1];
    const outputFragments = [-1, -1, -1, -1];
    const separators: string[] = [];
    const dateFragmentsOrder: TypeDateFragments = [inputFragments, outputFragments, separators];

    if (dateFormat) {
      let formatToAnalyze = dateFormat.toUpperCase().replace(/Z/, '+00:00').replace(/[[\]]/g, '');
      // Vallid date time formats match one of the following regular expression.
      formatToAnalyze = formatToAnalyze.replace(/YYYY[-/]MM[-/]DD[\sT]HH:MM:SS[+-]\d\d:\d\d/, '');
      formatToAnalyze = formatToAnalyze.replace(/MM[-/]DD[-/]YYYY[\sT]HH:MM:SS[+-]\d\d:\d\d/, '');
      formatToAnalyze = formatToAnalyze.replace(/DD[-/]MM[-/]YYYY[\sT]HH:MM:SS[+-]\d\d:\d\d/, '');
      if (formatToAnalyze) throw new Error(`The string "${dateFormat}" is an invalid date format.`);

      formatToAnalyze = dateFormat.toUpperCase().replace(/Z/, '+00:00');
      for (let i = 0; i < formatToAnalyze.length; i++) {
        if (['/', '-', ' ', 'T', '+'].includes(formatToAnalyze[i])) separators.push(formatToAnalyze[i]);
      }

      if (separators[DATE] !== separators[DATE + 1]) throw new Error(`The string "${dateFormat}" is an invalid date format.`);

      const [dateString, timeString] = formatToAnalyze.replace(/[[\]]/g, '').replaceAll(' ', 'T').replaceAll('/', '-').split('T');
      const dateFragments = dateString.split('-');
      ['Y', 'M', 'D'].forEach((fragmentType, i) => {
        inputFragments[i] = dateFragments.findIndex((fragment) => fragment[0] === fragmentType);
        if (inputFragments[i] >= 0) outputFragments[inputFragments[i]] = i;
      });

      if (timeString) {
        inputFragments[TIME] = 3;
        outputFragments[TIME] = 3;
        // Get time zone.
        separators[TIME_ZONE] = timeString.split(/[+-]/)[1];
      }

      const outputFields = formatToAnalyze.replace(/\[[YMDHMS\d\-/\sT:]*\]/, '').split(/-|\/|\s|T|\+/g);
      for (let i = outputFields.length; i < 4; i++) outputFragments[i] = -1;
      return dateFragmentsOrder;
    }
    return ISO_UTC_DATE_FRAGMENTS_ORDER;
  }

  /**
   * Reorder the date to the ISO UTC format using the input section (index = 0) of the date fragments order provided.
   * This routine is used to convert the dates returned by the server to the internal ISO UTC format. It is also used
   * to convert the date constants (date '...') found in the layer filter string using a reverse time zone to return
   * the date to the same time zone the server use since the filter string will be sent to the server to perform the
   * query.
   *
   * @param date {string} The date to format.
   * @param dateFragmentsOrder {TypeDateFragments} The date fragments order (obtained with getDateFragmentsOrder).
   * @returns {string} The reformatted date string.
   */
  applyInputDateFormat(date: string, dateFragmentsOrder = ISO_UTC_DATE_FRAGMENTS_ORDER, reverseTimeZone = false): string {
    const index = dateFragmentsOrder[0];
    const separators = dateFragmentsOrder[2];
    // eslint-disable-next-line prefer-const
    let [dateString, timeString] = date.toUpperCase().replace('Z', '+00:00').replaceAll(' ', 'T').split('T');
    if (!timeString) timeString = '00:00:00';

    const dateFragments = dateString
      .replaceAll('/', '-')
      .toUpperCase()
      .split('-')
      .map((fragment) => {
        return fragment.length === 1 ? `0${fragment}` : fragment;
      });

    let outputDateFragments: string[] = [];
    if (dateFragments.length === 3) outputDateFragments = dateFragments;
    else {
      // We assume the smallest date value are the year alone or the year with the month
      if (dateFragments[FIRST_DATE_ELEMENT].length < 3) outputDateFragments[index[MONTH]] = dateFragments[FIRST_DATE_ELEMENT];
      else outputDateFragments[index[YEAR]] = dateFragments[FIRST_DATE_ELEMENT];
      if (!dateFragments[SECOND_DATE_ELEMENT]) outputDateFragments[index[MONTH]] = '01';
      else if (dateFragments[SECOND_DATE_ELEMENT].length < 3) outputDateFragments[index[MONTH]] = dateFragments[SECOND_DATE_ELEMENT];
      else outputDateFragments[index[YEAR]] = dateFragments[SECOND_DATE_ELEMENT];
      outputDateFragments[index[DAY]] = '01';
    }

    let returnValue = `${outputDateFragments[index[YEAR]]}-${outputDateFragments[index[MONTH]]}-${
      outputDateFragments[index[DAY]]
    }T${timeString}`;

    if (returnValue.length === 19) returnValue = `${returnValue}${separators[TIME_ZONE_SEPARATOR]}${separators[TIME_ZONE]}`;
    if (returnValue.endsWith('+00:00')) {
      if (date.slice(-1).toUpperCase() === 'Z') returnValue = returnValue.replace('+00:00', 'Z');
    } else {
      if (reverseTimeZone)
        returnValue = `${returnValue.slice(0, 19)}${returnValue.slice(19, 20) === '+' ? '-' : '+'}${returnValue.slice(20)}`;
      returnValue = this.convertToUTC(returnValue);
    }
    return returnValue;
  }

  /**
   * Reorder the ISO UTC date to the output format using the output section (index = 1) of the date fragments order provided.
   * The time zone is empty since all dates shown to the user are in UTC.
   *
   * @param date {string} The ISO date to format.
   * @param dateFragmentsOrder {TypeDateFragments} The date fragments order (obtained with getDateFragmentsOrder).
   * @returns {string} The reformatted date string.
   */
  applyOutputDateFormat(date: string, dateFragmentsOrder?: TypeDateFragments): string {
    if (dateFragmentsOrder) {
      const index = dateFragmentsOrder[1];
      const separators = dateFragmentsOrder[2];
      const [dateString, timeString] = this.convertToUTC(
        `${date.toUpperCase().slice(0, -6)}${separators[TIME_ZONE_SEPARATOR]}${separators[TIME_ZONE]}`
      ).split('T');
      const dateFragments = dateString.toUpperCase().split('-');

      // index[X] + 1 = 0 (false) means corresponding field is not used
      const returnValue = `${dateFragments[index[FIRST_DATE_ELEMENT]]}${
        index[SECOND_DATE_ELEMENT] + 1 ? `${separators[DATE]}${dateFragments[index[SECOND_DATE_ELEMENT]]}` : ''
      }${index[THIRD_DATE_ELEMENT] + 1 ? `${separators[DATE]}${dateFragments[index[THIRD_DATE_ELEMENT]]}` : ''}${
        index[TIME] + 1 ? `${separators[DATE_TIME]}${timeString.slice(0, 8)}` : ''
      }`;

      return returnValue;
    }
    return date;
  }

  /**
   * Deduce the date format using a date value.
   *
   * @param date {string} The date value to be used to deduce the format.
   *
   * @returns {string} The date format.
   */
  deduceDateFormat(dateString: string): string {
    let dateFormat = dateString.toUpperCase().replaceAll('/', '-').replaceAll(' ', 'T');
    dateFormat = dateFormat
      .replace(/\d{4}/, 'YYYY')
      .replace(/^\d{1,2}(?=-\d{1,2}-YYYY)|((?<=^YYYY-\d-)|(?<=^YYYY-\d\d-))\d{1,2}/, 'DD')
      .replace(/(?<=^DD-)\d{1,2}(?=-YYYY)|(?<=^YYYY-)\d{1,2}(?=-DD)/, 'MM')
      .replace(/(?<=T)\d{1,2}/, 'HH')
      .replace(/(?<=THH:)\d{1,2}/, 'MM')
      .replace(/(?<=THH:MM:)\d{1,2}/, 'SS');
    if (dateFormat.length === 4) dateFormat = `${dateFormat}-MM-DDTHH:MM:SSZ`;
    else if (dateFormat.length === 7)
      dateFormat = dateFormat.startsWith('YYYY') ? `${dateFormat}-DDTHH:MM:SSZ` : `DD-${dateFormat}THH:MM:SSZ`;
    else if (dateFormat.length === 10) dateFormat = `${dateFormat}THH:MM:SSZ`;
    else if (dateFormat.length === 19) dateFormat = `${dateFormat}Z`;
    return dateFormat;
  }
}
