import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import duration from 'dayjs/plugin/duration';
import localizedFormat from 'dayjs/plugin/localizedFormat';

import 'dayjs/locale/en-ca';
import 'dayjs/locale/fr-ca';
import type { TypeDisplayLanguage } from '@/api/types/map-schema-types';
import type { TypeMetadataWMSCapabilityLayerDimension } from '@/api/types/layer-schema-types';

dayjs.extend(duration);

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

/**
 * constant/interface used to define the precision for date object (yyyy, mm, dd).
 */
const DEFAULT_DATE_PRECISION = {
  year: 'YYYY',
  month: 'YYYY-MM',
  day: 'YYYY-MM-DD',
};

/**
 * Type used to define the date precision pattern to use.
 */
export type DatePrecision = 'year' | 'month' | 'day' | undefined;

/**
 * constant/interface used to define the precision for time object (hh, mm, ss).
 */
const DEFAULT_TIME_PRECISION = {
  hour: 'THHZ',
  minute: 'THH:mmZ',
  second: 'THH:mm:ssZ',
};

/**
 * constant used to define the ESRI unit to OGC period conversion.
 */
const timeUnitsESRI = {
  esriTimeUnitsHours: 'H',
  esriTimeUnitsDays: 'D',
  esriTimeUnitsWeeks: 'W',
  esriTimeUnitsMonths: 'M',
  esriTimeUnitsYears: 'Y',
};

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
const isValidDate = (date: string): boolean => dayjs(date).isValid();
const isValidDuration = (durationCheck: string): boolean => dayjs.isDuration(dayjs.duration(durationCheck));
const isDiscreteRange = (ogcTimeDimension: string): boolean => ogcTimeDimension.split(',').length > 1;
const isAbsoluteRange = (ogcTimeDimension: string): boolean => ogcTimeDimension.split('/').length === 3;
const isRelativeRange = (ogcTimeDimension: string): boolean => ogcTimeDimension.split('/').length === 2;

/**
 * Class used to handle date as ISO 8601
 *
 * @exports
 * @class DateMgt
 */
export abstract class DateMgt {
  /**
   * Convert a UTC date to a local date
   * @param {Date | string} date date to use
   * @returns {string} local date
   */
  static convertToLocal(date: Date | string): string {
    // check if it is a valid date
    if (typeof date === 'string' && !isValidDate(date)) throw new Error(`${INVALID_DATE} (convertToLocal)`);

    // return ISO string not UTC, conversion from locale setting
    return dayjs(date).local().format();
  }

  /**
   * Convert a date local to a UTC date
   * @param {Date | string} date date to use
   * @returns {string} UTC date or empty string if invalid date (when field value is null)
   */
  static convertToUTC(date: Date | string): string {
    // check if it is a valid date and if so, return ISO string
    return typeof date === 'string' && !isValidDate(date) ? '' : dayjs(date).utc(false).format();
  }

  /**
   * Format a date to specific format like 'YYYY-MM-DD'
   * @param {Date | string} date date to use
   * @param {string} format format of the date.
   * @returns {string} formatted date
   */
  static formatDate(date: Date | string, format: string): string {
    // check if it is a valid date
    if (typeof date === 'string' && !isValidDate(date)) throw new Error(`${INVALID_DATE} (convertToLocal)`);

    return dayjs(date).format(format);
  }

  /**
   * Format a date to a pattern
   * @param {Date | string} date date to use
   * @param {DatePrecision} datePattern the date precision pattern to use
   * @param {TimePrecision}timePattern the time precision pattern to use
   * @returns {string} formatted date
   */
  static formatDatePattern(date: Date | number | string, datePattern: DatePrecision, timePattern?: TimePrecision): string {
    // check if it is a valid date
    if (typeof date === 'string' && !isValidDate(date)) throw new Error(`${INVALID_DATE} (format)`);
    const validDate = typeof date !== 'number' ? DateMgt.convertToMilliseconds(date) : date;

    // create or reformat date in ISO format
    const pattern = `${datePattern !== undefined ? DEFAULT_DATE_PRECISION[datePattern] : ''}${
      timePattern ? DEFAULT_TIME_PRECISION[timePattern] : ''
    }`;

    // output as local by default
    return dayjs(new Date(validDate)).utc(true).format(pattern).replace('T', ' ').split('+')[0];
  }

  /**
   * Converts a Date object to an ISO 8601 formatted string in the local time zone.
   * The resulting string will be in the format: YYYY-MM-DDTHH:mm:ss.sss
   *
   * @param {Date | number | string} date - The Date object to be formatted.
   * @returns {string} The formatted date string in ISO 8601 format.
   *
   * @throws {TypeError} If the input is not a valid Date object.
   */
  static formatDateToISO(date: Date | number | string): string {
    // check if it is a valid date
    if (typeof date === 'string' && !isValidDate(date)) throw new Error(`${INVALID_DATE} (format)`);
    const validDate = typeof date === 'number' ? DateMgt.convertMilisecondsToDate(date) : date;

    return `${dayjs(validDate).utc(true).format('YYYY-MM-DDTHH:mm:ss')}Z`;
  }

  /**
   * Attempts to guess the display pattern for a given date based on the provided format string.
   *
   * @param {(Date | number | string)[]} dates - An array of dates to analyze. Can be Date objects, timestamps (numbers), or date strings.
   * @param {boolean} [onlyMinMax=true] - If true, only considers the minimum and maximum dates in the array.
   * @returns {[DatePrecision | undefined, TimePrecision | undefined]} A tuple containing the guessed date and time precision.
   */
  static guessDisplayPattern(
    dates: Date[] | number[] | string[],
    onlyMinMax = true
  ): [DatePrecision | undefined, TimePrecision | undefined] {
    // check if it is a valid dates array
    const validDates = dates.map((date) => {
      if (typeof date === 'string' && !isValidDate(date)) throw new Error(`${INVALID_DATE} (format)`);
      return typeof date !== 'number' ? DateMgt.convertToMilliseconds(date) : date;
    });

    // Check if range occurs in a single day or year
    // TODO: we should check date pattern before and see if it should be only YYYY for example... use extractDateFormat
    const delta: [DatePrecision | undefined, TimePrecision | undefined][] = [];
    if (validDates.length === 1) {
      delta.push(['day', 'minute']);
    } else if (onlyMinMax) {
      const timeDelta = validDates[validDates.length - 1] - validDates[0];
      delta.push(timeDelta > 86400000 ? ['day', undefined] : [undefined, 'minute']);
    } else {
      for (let i = 0; i < validDates.length - 1; i++) {
        const timeDelta = validDates[i + 1] - validDates[i];
        delta.push(timeDelta > 86400000 ? ['day', undefined] : [undefined, 'minute']);
      }
    }

    return delta[0];
  }

  /**
   * Convert a date to milliseconds
   * @param {Date | string} date date to use
   * @returns {number} date as milliseconds
   */
  static convertToMilliseconds(date: Date | string): number {
    // check if it is a valid date
    if (typeof date === 'string' && !isValidDate(date)) throw new Error(`${INVALID_DATE} (convertToMilliseconds)`);

    return dayjs(date).valueOf();
  }

  /**
   * Convert a milliseconds date to string date. Date format is YYYY-MM-DDTHH:mm:ss.
   * @param {number} date milliseconds date
   * @returns {string} date string
   */
  static convertMilisecondsToDate(date: number, dateFormat = 'YYYY-MM-DDTHH:mm:ss'): string {
    return dayjs(date).utc(false).format(dateFormat);
  }

  /**
   * Extract pattern to use to format the date
   * @param {string} dateOGC date as an ISO 8601 date
   * @returns {string} the formatted date
   */
  static extractDateFormat(dateOGC: string): string {
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
   * @param {boolean} singleHandle true if it is ESRI Image
   *
   * @returns {TimeDimension} the Geoview time dimension
   */
  static createDimensionFromESRI(timeDimensionESRI: TimeDimensionESRI, singleHandle = false): TimeDimension {
    const { startTimeField, timeExtent, timeInterval, timeIntervalUnits } = timeDimensionESRI;

    // create interval string
    const calcDuration = (): string => {
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
    const rangeItems = this.createRangeOGC(dimensionValues);

    const timeDimension: TimeDimension = {
      field: startTimeField,
      default: singleHandle
        ? [rangeItems.range[rangeItems.range.length - 1]]
        : [rangeItems.range[0], rangeItems.range[rangeItems.range.length - 1]],
      unitSymbol: '',
      rangeItems,
      nearestValues: startTimeField === '' ? 'absolute' : 'discrete',
      singleHandle,
      displayPattern: DateMgt.guessDisplayPattern(rangeItems.range),
      isValid: rangeItems.range.length >= 1 && rangeItems.range[0] !== rangeItems.range[rangeItems.range.length - 1],
    };

    return timeDimension;
  }

  /**
   * Create the Geoview time dimension from OGC dimension
   * @param {TypeMetadataWMSCapabilityLayerDimension | string} ogcTimeDimension The OGC time dimension object or string
   * @returns {TimeDimension} the Geoview time dimension
   */
  static createDimensionFromOGC(ogcTimeDimension: TypeMetadataWMSCapabilityLayerDimension | string): TimeDimension {
    const dimensionObject = typeof ogcTimeDimension === 'object' ? ogcTimeDimension : JSON.parse(ogcTimeDimension);
    const rangeItems = this.createRangeOGC(dimensionObject.values);
    const timeDimension: TimeDimension = {
      field: dimensionObject.name,
      default: [dimensionObject.default || rangeItems.range[0]],
      unitSymbol: dimensionObject.unitSymbol || '',
      rangeItems,
      nearestValues: dimensionObject.nearestValues !== false ? 'absolute' : 'discrete',
      singleHandle: true,
      displayPattern: DateMgt.guessDisplayPattern(rangeItems.range),
      isValid: rangeItems.range.length >= 1 && rangeItems.range[0] !== rangeItems.range[rangeItems.range.length - 1],
    };

    return timeDimension;
  }

  /**
   * Create a range of date object from OGC time dimension following ISO 8601
   * @param {string} ogcTimeDimension OGC time dimension values following
   * @returns {RangeItems} array of date from the dimension
   */
  static createRangeOGC(ogcTimeDimensionValues: string): RangeItems {
    let rangeItems: RangeItems = { type: 'none', range: [] };

    // find what type of dimension it is:
    //    discrete = 1696, 1701, 1734, 1741
    //    relative = 2022-04-27T14:50:00Z/PT10M OR 2022-04-27T14:50:00Z/2022-04-27T17:50:00Z
    //    absolute = 2022-04-27T14:50:00Z/2022-04-27T17:50:00Z/PT10M
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
  static createDateLocaleTooltip(date: string, locale: TypeDisplayLanguage): string {
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
  static #createAbsoluteInterval(ogcTimeDimension: string): string[] {
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

    // create interval items
    const msDuration: number = dayjs.duration(durationCheck).asMilliseconds();
    const calcDuration = dayjs.duration(msDuration);
    const items: string[] = [];
    let i = 0;

    items.push(min);

    let nextDate: string;
    do {
      // When we deal with MONTH duration, dayjs doesnt know if the month is 30 or 31 days. This creates bad intervals...
      // NOTE: We do this ONLY when duration is for month and nothing else....
      if (durationCheck.endsWith('M') && !durationCheck.startsWith('PT')) {
        // Add the month duration manually and increase years if needed
        const dateValue = items[i].split('-');
        const monthValueUpdated = Number(dateValue[1]) + calcDuration.months();
        const yearValue = monthValueUpdated <= 12 ? dateValue[0] : String(Number(dateValue[0]) + 1);
        const monthValue = monthValueUpdated <= 12 ? monthValueUpdated : monthValueUpdated - 12;

        nextDate = dayjs(`${yearValue}-${String(monthValue).padStart(2, '0')}-${dateValue[2]}`)
          .utc(false)
          .format(format);
      } else {
        nextDate = dayjs(items[i]).add(calcDuration).utc(false).format(format);
      }

      // Check if we need to remove time information then push
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

    // add last item if needed
    if (items[items.length - 1] !== max) items.push(max);

    return items;
  }

  /**
   * Create range from OGC time dimension following ISO 8601 for relative interval
   * @private
   * @param ogcTimeDimension {string} OGC time dimension following ISO 8001
   * @returns {string[]} array of date from the dimension
   */
  static #createRelativeIntervale(ogcTimeDimension: string): string[] {
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
   * Returns the input/output fragment order and separators for a given date format.
   * Supports formats like "YYYY-MM-DD", "YYYY-MM-DDTHH:MM:SS", or "YYYY-MM-DDZ".
   *
   * @param {string} [dateFormat] - Optional date format string to analyze.
   * @returns {TypeDateFragments} The input/output fragment positions and separators.
   *
   * @throws {Error} When the provided date format is invalid.
   */
  static getDateFragmentsOrder(dateFormat?: string): TypeDateFragments {
    if (!dateFormat) return ISO_UTC_DATE_FRAGMENTS_ORDER;

    // Prepare
    const inputFragments = [-1, -1, -1, -1]; // [year, month, day, time]
    const outputFragments = [-1, -1, -1, -1];
    const separators: string[] = []; // [dateSep1, dateSep2, timeSep, tzSign, tzValue]
    const upperFormat = dateFormat.toUpperCase().trim();

    // Replace trailing 'Z' with '+00:00' for parsing
    const normalizedFormat = upperFormat.endsWith('Z') ? upperFormat.replace(/Z$/, '+00:00') : upperFormat;

    // Extract separators
    for (const char of normalizedFormat) {
      if (['-', '/', 'T', ' ', '+'].includes(char)) separators.push(char);
    }

    // Split date and time
    const [datePart, timePart] = normalizedFormat.split(/[T ]/);
    const dateFragments = datePart.split(/[-/]/);

    // Map input fragments
    dateFragments.forEach((frag, i) => {
      if (frag.startsWith('Y')) inputFragments[0] = i;
      else if (frag.startsWith('M')) inputFragments[1] = i;
      else if (frag.startsWith('D')) inputFragments[2] = i;
    });

    // Map output fragments in the same order
    inputFragments.forEach((pos, i) => {
      if (pos >= 0) outputFragments[pos] = i;
    });

    // Handle time
    if (timePart) {
      inputFragments[3] = 3;
      outputFragments[3] = 3;

      // Time zone value
      const tzMatch = timePart.match(/[+-](\d{2}:\d{2})/);
      if (tzMatch) separators[4] = tzMatch[1];
    }

    // Ensure consistent date separator
    if (separators[0] !== separators[1]) {
      throw new Error(`Invalid date format: inconsistent date separators in "${dateFormat}"`);
    }

    return [inputFragments, outputFragments, separators];
  }

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
  static applyInputDateFormat(
    date: string,
    dateFragmentsOrder: TypeDateFragments = ISO_UTC_DATE_FRAGMENTS_ORDER,
    reverseTimeZone: boolean = false
  ): string {
    if (!date) return date;

    // Index mapping from config
    const index = dateFragmentsOrder[0];
    const year = index[0] ?? YEAR;
    const month = index[1] ?? MONTH;
    const day = index[2] ?? DAY;
    const separators = dateFragmentsOrder[2];

    const trimmedDate = date.trim().toUpperCase();
    const originalEndsWithZ = trimmedDate.endsWith('Z');

    // Normalize separators: "/" → "-", " " → "T"
    const normalized = trimmedDate.replaceAll('/', '-').replace(' ', 'T');

    // Split into date + time components
    const rawSplit = normalized.split('T');
    let rawDate = rawSplit[0];
    const rawTime = rawSplit[1];

    // Strip trailing Z from date fragment only (string operation instead of regex)
    if (rawDate.endsWith('Z')) rawDate = rawDate.slice(0, -1);

    // Split date fragments and pad single digits
    const fragments = rawDate.split('-').map((f) => f.padStart(2, '0'));

    // Assign fragments with defaults
    let yyyy = '0000',
      mm = '01',
      dd = '01';
    if (fragments.length === 3) {
      yyyy = fragments[year];
      mm = fragments[month];
      dd = fragments[day];
    } else if (fragments.length === 2) {
      if (fragments[0].length === 4) {
        yyyy = fragments[0];
        mm = fragments[1];
      } else {
        mm = fragments[0];
        yyyy = fragments[1];
      }
    } else if (fragments.length === 1) {
      yyyy = fragments[0];
    }

    // Normalize time: default to 00:00:00
    let time = rawTime || '00:00:00';
    // Convert HH:mm to HH:mm:00 using string check instead of regex
    if (time.length === 5 && time[2] === ':') time += ':00';

    // Build ISO string
    let iso = `${yyyy}-${mm}-${dd}T${time}`;

    // Add default timezone if missing (check last char instead of regex)
    const lastChar = iso[iso.length - 1];
    const hasTZ = lastChar === 'Z' || iso.includes('+') || iso.includes('-');
    if (!hasTZ) iso += `${separators[3]}${separators[4]}`;

    // Restore Z if original input ended with Z
    if (originalEndsWithZ && iso.endsWith('+00:00')) iso = iso.slice(0, -6) + 'Z';

    // Optional reverse timezone
    if (!originalEndsWithZ && reverseTimeZone) {
      const signIndex = iso.search(/[+-]\d{2}:\d{2}$/);
      if (signIndex >= 0) {
        const sign = iso[signIndex];
        iso = iso.slice(0, signIndex) + (sign === '+' ? '-' : '+') + iso.slice(signIndex + 1);
      }
    }

    // Convert to UTC unless already Z
    if (!iso.endsWith('Z')) iso = this.convertToUTC(iso);

    if (!iso) throw new Error(`Failed to process date '${date}'`);

    return iso;
  }

  /**
   * Reorder the ISO UTC date to the output format using the output section (index = 1) of the date fragments order provided.
   * The time zone is empty since all dates shown to the user are in UTC.
   *
   * @param date {string} The ISO date to format.
   * @param dateFragmentsOrder {TypeDateFragments} The date fragments order (obtained with getDateFragmentsOrder).
   * @param reverseTimeZone {boolean} Flag indicating that we must change the time zone sign before the conversion.
   * @returns {string} The reformatted date string.
   */
  static applyOutputDateFormat(date: string, dateFragmentsOrder?: TypeDateFragments, reverseTimeZone = false): string {
    if (!date) return date;
    if (dateFragmentsOrder) {
      const index = dateFragmentsOrder[1];
      const separators = dateFragmentsOrder[2];
      let utcDate = this.convertToUTC(date);
      if (utcDate.slice(-1).toUpperCase() === 'Z') utcDate = `${utcDate.slice(0, -1)}+00:00`;
      const reverseTimeZoneSign = separators[TIME_ZONE_SEPARATOR] === '+' ? '-' : '+';
      const [dateString, timeString] = this.convertToUTC(
        `${utcDate.toUpperCase().slice(0, -6)}${reverseTimeZone ? reverseTimeZoneSign : separators[TIME_ZONE_SEPARATOR]}${
          separators[TIME_ZONE]
        }`
      ).split('T');
      const dateFragments = dateString.toUpperCase().split('-');

      // index[X] + 1 = 0 (false) means corresponding field is not used
      let returnValue = `${index[FIRST_DATE_ELEMENT] + 1 ? `${dateFragments[index[FIRST_DATE_ELEMENT]]}` : ''}`;
      if (returnValue && index[SECOND_DATE_ELEMENT] + 1) returnValue = `${returnValue}${separators[DATE]}`;
      if (index[SECOND_DATE_ELEMENT] + 1) returnValue = `${returnValue}${dateFragments[index[SECOND_DATE_ELEMENT]]}`;
      if (returnValue && index[THIRD_DATE_ELEMENT] + 1) returnValue = `${returnValue}${separators[DATE]}`;
      if (index[THIRD_DATE_ELEMENT] + 1) returnValue = `${returnValue}${dateFragments[index[THIRD_DATE_ELEMENT]]}`;
      if (index[TIME] + 1 && timeString) returnValue = `${returnValue}${separators[DATE_TIME]}${timeString.slice(0, 8)}`;

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
  static deduceDateFormat(dateString: string): string {
    let dateFormat =
      dateString !== null && dateString !== undefined ? dateString.toUpperCase().replaceAll('/', '-').replaceAll(' ', 'T') : 'YYYY-MM-DD';
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

  /**
   * Get dayjs date object for given date in number or string.
   * @param {number | string} millseconds time in milliseconds or string
   * @returns {Dayjs} dayjs date object
   */
  static getDayjsDate(date: number | string): Dayjs {
    return dayjs(date);
  }
}
