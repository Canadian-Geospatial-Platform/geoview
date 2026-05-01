import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import dayjsduration, { type Duration } from 'dayjs/plugin/duration';
import dayjslocalizedFormat from 'dayjs/plugin/localizedFormat';
import dayjstimezone from 'dayjs/plugin/timezone';
import dayjscustomParseFormat from 'dayjs/plugin/customParseFormat';
import 'dayjs/locale/en';
import 'dayjs/locale/fr';

import type { TypeDisplayLanguage, DisplayDateMode } from '@/api/types/map-schema-types';
import type { TypeMetadataWMSCapabilityLayerDimension } from '@/api/types/layer-schema-types';
import { InvalidDateError, InvalidTimezoneError, InvalidTimeDimensionError } from '@/core/exceptions/core-exceptions';
import { logger } from './logger';

/** Extend the Dayjs utility. */
dayjs.extend(utc);
dayjs.extend(dayjstimezone);
dayjs.extend(dayjsduration);
dayjs.extend(dayjslocalizedFormat);
dayjs.extend(dayjscustomParseFormat);

/** Generic type to represent a date. */
export type DateLike = Date | number | string;

/** The type to specify a date format for each supported language. */
export type TypeDisplayDateFormat = Record<TypeDisplayLanguage, string>;

/** The type to specify the default date and datetime formats for each supported display date mode. */
export type TypeDisplayDateDefaults = { dateFormat: TypeDisplayDateFormat; datetimeFormat: TypeDisplayDateFormat };

/**
 * The possible time zones the date to read is at.
 * This can be any supported IANA time zone, e.g.: 'America/Toronto', 'Europe/Paris', 'UTC' or even 'local' to let the system determine the local TimeIANA on-the-fly.
 */
export type TimeIANA = string | 'local';

/**
 * Calendar mode:
 *   Interprets input as a calendar date (YYYY-MM-DD), ignoring historical timezone offsets.
 * Instant mode:
 *   Interprets input as an absolute moment in time, timezones will affect dates using this mode.
 */
export type TemporalMode = 'calendar' | 'instant';

/** Constant used to define the ESRI unit to OGC period conversion. */
const timeUnitsESRI = {
  esriTimeUnitsHours: 'H',
  esriTimeUnitsDays: 'D',
  esriTimeUnitsWeeks: 'W',
  esriTimeUnitsMonths: 'M',
  esriTimeUnitsYears: 'Y',
};

/** Type used to define the range values for an OGC time dimension. */
type RangeItems = {
  type: string;
  range: string[];
};

/** Type used to define the GeoView OGC time dimension. */
export type TimeDimension = {
  field: string;
  default: string[];
  unitSymbol?: string;
  rangeItems: RangeItems;
  nearestValues: 'discrete' | 'continuous';
  singleHandle: boolean;
  displayDateFormat?: TypeDisplayDateFormat;
  displayDateFormatShort?: TypeDisplayDateFormat;
  serviceDateTemporalMode?: TemporalMode;
  displayDateTimezone?: TimeIANA;
  isValid: boolean;
};

/** Guessed time information inferred from service date formats or time dimensions. */
export type GuessedTimeInformation = {
  displayDateFormat?: TypeDisplayDateFormat;
  displayDateFormatShort?: TypeDisplayDateFormat;
  serviceDateTemporalMode?: TemporalMode;
  displayDateTimezone?: TimeIANA;
};

/** Type used to validate the ESRI time dimension. */
export type TimeDimensionESRI = {
  startTimeField: string;
  endTimeField?: string;
  trackIdField?: string;
  timeExtent?: [number, number];
  timeInterval: number;
  hasLiveData?: boolean;
  timeIntervalUnits: 'esriTimeUnitsHours' | 'esriTimeUnitsDays' | 'esriTimeUnitsWeeks' | 'esriTimeUnitsMonths' | 'esriTimeUnitsYears';
};

/** Utility functions */
/** Discrete is when the values are all written down specifically with comma separator */
const isDiscreteRange = (ogcTimeDimension: string): boolean => ogcTimeDimension.split(',').length > 1;
/** Absolute is start/end/interval */
const isAbsoluteRange = (ogcTimeDimension: string): boolean => ogcTimeDimension.split('/').length === 3;
/** Relative is start/end without intervals */
const isRelativeRange = (ogcTimeDimension: string): boolean => ogcTimeDimension.split('/').length === 2;

/**
 * Class used to handle date as ISO 8601.
 */
export abstract class DateMgt {
  /** The milliseconds for 1 day. */
  static readonly MILLISECONDS_IN_1_DAY: number = 24 * 60 * 60 * 1000;
  /** The milliseconds for 1 year (estimation, not considering leap years). */
  static readonly MILLISECONDS_IN_1_YEAR: number = DateMgt.MILLISECONDS_IN_1_DAY * 365;

  /** The international ISO date format. */
  static readonly ISO_DATE_FORMAT = 'YYYY-MM-DD';

  /** The international ISO time format with seconds. */
  static readonly ISO_TIME_FORMAT = 'HH:mm:ss';

  /** The international ISO time format. */
  static readonly ISO_TIME_FORMAT_MINUTES = 'HH:mm';

  /** The international ISO datetime format. */
  static readonly ISO_DATETIME_FORMAT_FULL = 'YYYY-MM-DDTHH:mm:ss.SSS';

  /** The international ISO format without the milliseconds. */
  static readonly ISO_DATETIME_FORMAT_SECONDS = 'YYYY-MM-DDTHH:mm:ss';

  /** The international ISO format without the seconds. */
  static readonly ISO_DATETIME_FORMAT_MINUTES = 'YYYY-MM-DDTHH:mm';

  /** The display format for international ISO date only for English and French. */
  static readonly ISO_DISPLAY_DATE_FORMAT: TypeDisplayDateFormat = { en: 'YYYY-MM-DD', fr: 'YYYY-MM-DD' };

  /** A default year-only format for English and French. */
  static readonly ISO_DISPLAY_YEAR_ONLY_FORMAT: TypeDisplayDateFormat = { en: 'YYYY', fr: 'YYYY' };

  /** A default time-only format for English and French. */
  static readonly ISO_DISPLAY_TIME_FORMAT_MINUTES: TypeDisplayDateFormat = {
    en: DateMgt.ISO_TIME_FORMAT_MINUTES,
    fr: DateMgt.ISO_TIME_FORMAT_MINUTES,
  };

  /** A default datetime format for English and French. */
  static readonly ISO_DISPLAY_DATETIME_FORMAT_MINUTES: TypeDisplayDateFormat = {
    en: DateMgt.ISO_DATETIME_FORMAT_MINUTES,
    fr: DateMgt.ISO_DATETIME_FORMAT_MINUTES,
  };

  /** The Long date format. */
  static readonly LONG_DISPLAY_DATE_FORMAT = { en: 'MMM D, YYYY', fr: 'D MMM YYYY' };

  /** The Long datetime format. */
  static readonly LONG_DISPLAY_DATETIME_FORMAT = { en: 'MMM D, YYYY @ HH:mm', fr: 'D MMM YYYY @ HH:mm' };

  /** Static constant to indicate when we interpret a date as UTC. For general purposes of UTC. */
  static readonly TIME_UTC = 'UTC';

  /** Static constant indicating the local IANA time zone. */
  static readonly TIME_IANA_LOCAL = Intl.DateTimeFormat().resolvedOptions().timeZone;

  /** Regular expression for matching ISO date strings. */
  static readonly REGEX_ISO_DATE = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})/gi;
  /** Regular expression for matching ISO date strings with a 'date' prefix. */
  static readonly REGEX_ISO_DATE_WITH_PREFIX =
    /date\s*'(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d(?::[0-5]\d(?:\.\d+)?)?(?:Z|[+-][0-2]\d:[0-5]\d)?)'/gi;

  /** Regex used to spot a timezone inside a date input. */
  static readonly #REGEX_HAS_TIMEZONE_IN_DATE = /([Zz]|[+-]\d{2}:\d{2})$/;

  /** Array of time tokens used for parsing and identifying time components in dates. */
  static readonly #TIME_TOKENS = ['H', 'HH', 'h', 'hh', 'k', 'kk', 'm', 'mm', 's', 'ss', 'S', 'SS', 'SSS', 'A', 'a', 'X', 'x'];

  /** The default input formats to append to the specific input formats when trying to read a date in a non-ISO format. */
  static readonly #DEFAULT_INPUT_FORMATS = [
    'YYYY-MM-DDTHH:mm:ss.SSS[Z]',
    'YYYY-MM-DDTHH:mm:ss.SSSZ',
    'YYYY-MM-DDTHH:mm:ss.SSS',
    'YYYY-MM-DDTHH:mm:ss[Z]',
    'YYYY-MM-DDTHH:mm:ssZ',
    'YYYY-MM-DDTHH:mm:ss',
    'YYYY-MM-DDTHH:mm',
    'YYYY-MM-DD HH:mm',
    'YYYY-MM-DD',
  ];

  /** The default date format for English and French to be used by the application. */
  static DEFAULT_DATE_FORMAT: TypeDisplayDateFormat = DateMgt.LONG_DISPLAY_DATE_FORMAT;

  /** The default date and time format for English and French to be used by the application. */
  static DEFAULT_DATETIME_FORMAT: TypeDisplayDateFormat = DateMgt.LONG_DISPLAY_DATETIME_FORMAT;

  /** The default time format for English and French to be used by the application. */
  static DEFAULT_TIME_FORMAT: TypeDisplayDateFormat = DateMgt.ISO_DISPLAY_TIME_FORMAT_MINUTES;

  /** The default year-only format for English and French to be used by the application. */
  static DEFAULT_DATE_YEAR_ONLY_FORMAT = DateMgt.ISO_DISPLAY_YEAR_ONLY_FORMAT;

  /** The default temporal mode to be used by the application. */
  static DEFAULT_TEMPORAL_MODE: TemporalMode = 'calendar';

  // #region STATIC PUBLIC METHODS

  /**
   * Gets the default date and datetime formats based on the display date mode.
   *
   * @param displayDateMode - The display date mode, e.g., 'long' or undefined for default
   * @returns The default date and datetime formats for the given mode
   */
  static getDisplayDateDefaults(displayDateMode: DisplayDateMode | undefined): TypeDisplayDateDefaults {
    // Depending on the display date mode
    switch (displayDateMode) {
      case 'long':
        return { dateFormat: DateMgt.LONG_DISPLAY_DATE_FORMAT, datetimeFormat: DateMgt.LONG_DISPLAY_DATETIME_FORMAT };

      default:
        return {
          dateFormat: DateMgt.ISO_DISPLAY_DATE_FORMAT,
          datetimeFormat: DateMgt.ISO_DISPLAY_DATETIME_FORMAT_MINUTES,
        };
    }
  }

  /**
   * Parses a `DateLike` input into a Dayjs object, automatically handling different types
   * of input and temporal modes.
   *
   * Supports:
   * 1. Epoch numbers and `Date` objects (treated as exact UTC instants)
   * 2. String representations as either "instant" or "calendar" dates
   * 3. Optional custom input formats, strict parsing, and timezones
   *
   * If `date` is a number or `Date`, it is parsed as a UTC instant. If `date` is a string
   * containing a timezone, it is treated as an "instant" date. If `inputTemporalMode` is
   * `"calendar"`, the string is parsed with `parseCalendarDate` and normalized to local midnight.
   * Otherwise, the string is parsed as an instant using `parseInstantDate`.
   *
   * @param date - The input date. Can be:
   *   - A `Date` object
   *   - A timestamp number
   *   - A string (ISO, custom format, or calendar date)
   * @param inputFormat - Optional format(s) for parsing string inputs.
   *   If provided, Dayjs will use these formats instead of auto-detection
   * @param inputTimezone - Optional IANA timezone to apply if the input string
   *   does not have an explicit timezone. Defaults to `TIME_UTC` in `parseInstantDate`
   * @param temporalMode - Determines how string inputs are interpreted:
   *   - `"instant"`: exact point in time
   *   - `"calendar"`: normalized to midnight local time
   * @param strict - Optional, if true, enforces strict parsing according to the
   *   provided `inputFormat`
   * @returns A Dayjs object representing the parsed date
   */
  static parseDateToDayjs(
    date: DateLike,
    inputFormat?: string | string[],
    inputTimezone?: TimeIANA,
    temporalMode: TemporalMode = this.DEFAULT_TEMPORAL_MODE,
    strict: boolean = false
  ): Dayjs {
    // Epoch / Date inputs
    if (typeof date === 'number' || date instanceof Date) {
      // Instant semantics
      return dayjs.utc(date);
    }

    // Here, string processing..

    // If temporal mode is calendar
    if (temporalMode === 'calendar') {
      return this.parseCalendarDate(date, inputFormat, strict);
    }

    // Temporal mode is instant date
    return this.parseInstantDate(date, inputFormat, inputTimezone, strict);
  }

  /**
   * Parses a string as an "instant" point in time into a Dayjs object.
   *
   * Handles:
   * 1. Optional custom input formats
   * 2. Strings with or without explicit timezones
   * 3. Applying a default timezone if missing
   *
   * If the input string contains a timezone (`hasTZ` is true), it is treated as an exact instant.
   * If the input string lacks a timezone, `inputTimezone` is applied.
   *
   * @param date - The input date string to parse
   * @param inputFormat - Optional format(s) for parsing.
   *   If provided, Dayjs will use these formats instead of auto-detection
   * @param inputTimezone - Optional IANA timezone string to apply if
   *   the input string has no explicit timezone
   * @param strict - Optional, if true, enforces strict parsing according to the provided `inputFormat`
   * @returns A Dayjs object representing the parsed instant
   * @throws {InvalidTimezoneError} When the time zone is not a valid or supported IANA identifier
   */
  static parseInstantDate(
    date: string,
    inputFormat?: string | string[],
    inputTimezone: TimeIANA = this.TIME_UTC,
    strict: boolean = false
  ): Dayjs {
    let formats = undefined;
    if (inputFormat) {
      formats = this.#buildInputFormats(inputFormat);
    }

    // Create dayjs
    let parsed = this.#createDayjsFixCustomParser(date, formats, strict);

    // Check if the date string has an explicit timezone
    const hasTZ = this.#REGEX_HAS_TIMEZONE_IN_DATE.test(date);

    // If no explicit timezone, assign the one in input
    if (!hasTZ) {
      this.validateTimezone(inputTimezone);
      parsed = parsed.tz(inputTimezone, true);
    }

    // Return the parsed instant date
    return parsed;
  }

  /**
   * Parses a date string as a **calendar date**, ignoring any timezone or offset
   * semantics and preserving the civil date and time fields as-is.
   *
   * This function interprets the input purely in terms of its calendar
   * components (year, month, day, and optional time), then normalizes those
   * components by re-anchoring them in UTC. No timezone conversion is applied.
   * This guarantees that calendar-based dates do not shift days due to timezone
   * offsets, DST, or environment locale.
   *
   * @param date - Date string to parse
   * @param inputFormat - Optional format or list of formats used to parse the input date string
   * @param strict - Optional, whether to enforce strict parsing when using custom formats
   * @returns Dayjs instance normalized to UTC using calendar semantics
   */
  static parseCalendarDate(date: string, inputFormat?: string | string[], strict: boolean = false): Dayjs {
    let formats = undefined;
    if (inputFormat) {
      formats = this.#buildInputFormats(inputFormat);
    }

    // Create dayjs
    let parsed = this.#createDayjsFixCustomParser(date, formats, strict);

    // Check if the date string has an explicit timezone
    const hasTZ = this.#REGEX_HAS_TIMEZONE_IN_DATE.test(date);

    // If has explicit timezone, transform to UTC timezone for the calendar mode
    if (hasTZ) {
      parsed = parsed.utc();
    }

    // Normalize calendar date
    return this.#readCalendarDay(parsed);
  }

  /**
   * Reconstructs a Dayjs instance as a UTC date using the calendar fields
   * (year, month, day, time components) of the provided Dayjs object.
   *
   * This function discards any timezone or offset information carried by the
   * input and treats the extracted calendar fields as if they were already
   * expressed in UTC. No timezone conversion is performed.
   * This is primarily used to normalize calendar-based dates so that their
   * civil components remain stable and are not affected by timezone shifts.
   *
   * @param date - Dayjs instance whose calendar fields will be read and reinterpreted as UTC
   * @returns New Dayjs instance representing the same calendar fields anchored in UTC
   */
  static #readCalendarDay(date: Dayjs): Dayjs {
    // Return the UTC equivalent
    return dayjs.utc(Date.UTC(date.year(), date.month(), date.date(), date.hour(), date.minute(), date.second(), date.millisecond()));
  }

  /**
   * Creates a validated Dayjs instance from a `DateLike` input.
   *
   * This is a thin wrapper around `parseDateToDayjs` that ensures the resulting
   * Dayjs object is valid, throwing an error if parsing fails.
   * This method guarantees that the returned Dayjs instance is valid.
   * All parsing rules, timezone handling, and temporal logic are delegated to `parseDateToDayjs`.
   *
   * @param date - The input date to parse. Can be:
   *   - A `Date` object
   *   - A timestamp number
   *   - A string (ISO, custom format, or calendar/instant date)
   * @param inputFormat - Optional format(s) for parsing string inputs.
   *   Passed directly to `parseDateToDayjs`
   * @param inputTimezone - Optional IANA timezone to apply if the input string
   *   has no explicit timezone and is parsed as an instant
   * @param temporalMode - Optional, determines how string inputs are interpreted:
   *   - `"calendar"`: parsed as a calendar date
   *   - `"instant"`: parsed as an exact point in time
   *   - Defaults to `DEFAULT_TEMPORAL_MODE`
   * @returns A valid Dayjs object representing the parsed date
   * @throws {InvalidDateError} When input has invalid date
   */
  static createDayjs(date: DateLike, inputFormat?: string | string[], inputTimezone?: TimeIANA, temporalMode?: TemporalMode): Dayjs {
    // Parse the date
    const value = this.parseDateToDayjs(date, inputFormat, inputTimezone, temporalMode);

    // Check if valid
    if (!value.isValid()) throw new InvalidDateError(date?.toString());

    // Return
    return value;
  }

  /**
   * Creates a native `Date` object from a `DateLike` input.
   *
   * This is a convenience wrapper around `createDayjs` that converts the validated
   * Dayjs instance into a native JavaScript `Date`.
   *
   * Parsing, validation, and temporal logic are delegated to `createDayjs`.
   * The returned `Date` represents the same instant in time as the underlying Dayjs object.
   *
   * @param date - The input date to convert. Can be:
   *   - A `Date` object
   *   - A timestamp number
   *   - A string (ISO, custom format, or calendar/instant date)
   * @param inputFormat - Optional format(s) for parsing string inputs. Passed directly to `createDayjs`
   * @param inputTimezone - Optional IANA timezone to apply if the input string
   *   has no explicit timezone and is parsed as an instant
   * @param temporalMode - Optional, determines how string inputs are interpreted:
   *   - `"calendar"`: parsed as a calendar date
   *   - `"instant"`: parsed as an exact point in time
   *   - Defaults to `DEFAULT_TEMPORAL_MODE`
   * @returns A native JavaScript `Date` object representing the parsed date
   * @throws {Error} When the input cannot be parsed into a valid date
   */
  static createDate(date: DateLike, inputFormat?: string | string[], inputTimezone?: TimeIANA, temporalMode?: TemporalMode): Date {
    // Redirect
    return this.createDayjs(date, inputFormat, inputTimezone, temporalMode).toDate();
  }

  /**
   * Formats a `DateLike` value into a string using the specified format, locale,
   * timezone, and temporal interpretation.
   *
   * This method first normalizes the input using `parseDateToDayjs`, then applies
   * output-specific transformations such as timezone conversion, locale, and formatting.
   * The input is always parsed via `parseDateToDayjs`, ensuring consistent handling of `Date`,
   * epoch, and string values. Calendar dates are normalized to local midnight and are **not**
   * shifted to `outputTimezone`. Instant dates are converted to `outputTimezone` before formatting.
   * The locale is applied after parsing and timezone adjustments.
   *
   * @param date - The input date to format. Can be:
   *   - A `Date` object
   *   - A timestamp number
   *   - A string (ISO, custom format, or calendar date)
   * @param format - Optional, the Dayjs format string used to produce the output
   * @param locale - Optional locale used for formatting (e.g. month and weekday names)
   * @param outputTimezone - Optional IANA timezone applied to the output
   *   when formatting instant dates
   * @param temporalMode - Optional, determines how the input is interpreted:
   *   - `"calendar"`: treated as a whole calendar day
   *   - `"instant"`: treated as an exact point in time
   * @param inputFormat - Optional format(s) for parsing string inputs.
   *   If provided, these are passed through to `parseDateToDayjs`
   * @param inputTimezone - Optional IANA timezone to apply if the input string
   *   has no explicit timezone and is parsed as an instant
   * @param withZ - Optional, whether to append a literal `'Z'` to the formatted output string
   * @returns The formatted date string
   */
  static formatDate(
    date: DateLike,
    format: string = this.ISO_DATETIME_FORMAT_FULL,
    locale: TypeDisplayLanguage = 'en',
    outputTimezone: TimeIANA = this.TIME_UTC,
    temporalMode: TemporalMode = this.DEFAULT_TEMPORAL_MODE,
    inputFormat?: string | string[],
    inputTimezone?: TimeIANA,
    withZ: boolean = false
  ): string {
    // Parse the output timezone
    let theOutputTimezone = outputTimezone;
    if (theOutputTimezone === 'local') {
      // Set to the local IANA of the user
      theOutputTimezone = DateMgt.TIME_IANA_LOCAL;
    }

    // Always parse the input DateLike correctly first
    let parsed = this.parseDateToDayjs(date, inputFormat, inputTimezone, temporalMode, false);

    // If date is instant, offset the date based on the timezone
    if (temporalMode === 'instant') {
      // Instant dates are allowed to shift across timezones
      parsed = parsed.tz(theOutputTimezone);
    }

    // Assign the locale
    parsed = parsed.locale(locale);

    // Format and return it
    let formatted = parsed.format(format);
    if (withZ) formatted += 'Z';
    return formatted;
  }

  /**
   * Formats a date into a short ISO-like string (`YYYY-MM-DDTHH:mm:ss`).
   *
   * This is a convenience wrapper around `formatDate` that produces a compact,
   * timezone-aware ISO-style representation, optionally appending a `Z` suffix
   * when formatted in UTC.
   * Uses the format `YYYY-MM-DDTHH:mm:ss`. Delegates all parsing and formatting logic to `formatDate`.
   * Appends a literal `'Z'` to the output only when `outputTimezone` is UTC.
   * Calendar dates are not shifted by `outputTimezone`.
   *
   * @param date - The input date to format. Can be:
   *   - A `Date` object
   *   - A timestamp number
   *   - A string (ISO, custom format, or calendar/instant date)
   * @param outputTimezone - Optional IANA timezone applied to the
   *   output when formatting instant dates
   * @param temporalMode - Optional, determines how the input is interpreted:
   *   - `"calendar"`: treated as a calendar date
   *   - `"instant"`: treated as an exact point in time
   * @param inputFormat - Optional format(s) for parsing string inputs. Passed through to `formatDate`
   * @param inputTimezone - Optional IANA timezone to apply if the input
   *   string has no explicit timezone and is parsed as an instant
   * @returns A short ISO-like formatted date string
   */
  static formatDateISOShort(
    date: DateLike,
    outputTimezone: TimeIANA = this.TIME_UTC,
    temporalMode?: TemporalMode,
    inputFormat?: string | string[],
    inputTimezone: TimeIANA = this.TIME_UTC
  ): string {
    // Redirect
    return this.formatDate(
      date,
      DateMgt.ISO_DATETIME_FORMAT_SECONDS,
      'en',
      outputTimezone,
      temporalMode,
      inputFormat,
      inputTimezone,
      outputTimezone === this.TIME_UTC
    );
  }

  /**
   * Formats a single date or a date range according to the specified
   * display format, language, timezone, and temporal mode.
   *
   * If a second date is provided, the function returns a string
   * representing the range in the format "date1 / date2".
   *
   * @param date1 - The first date (or the only date) to format
   * @param dateFormat - Object containing the display format for each language
   * @param locale - Language code to select the correct format from `dateFormat`
   * @param outputTimezone - Optional IANA timezone to use for output formatting
   * @param inputTemporalMode - Optional, whether to interpret the input as 'calendar' or 'instant'
   * @param date2 - Optional second date for formatting a date range
   * @returns A formatted date string or a formatted date range string
   */
  static formatDateOrDateRange(
    date1: DateLike,
    dateFormat: TypeDisplayDateFormat,
    locale: TypeDisplayLanguage,
    outputTimezone?: TimeIANA,
    inputTemporalMode?: TemporalMode,
    date2?: DateLike
  ): string {
    // Read the display date format
    const format = dateFormat[locale];

    // If no second date
    if (!date2) {
      return `${DateMgt.formatDate(date1, format, locale, outputTimezone, inputTemporalMode)}`;
    }

    // Return a range
    return `${DateMgt.formatDate(date1, format, locale, outputTimezone, inputTemporalMode)} / ${DateMgt.formatDate(date2, format, locale, outputTimezone, inputTemporalMode)}`;
  }

  /**
   * Formats a single date or a date range according to the specified
   * display format, language, timezone, and temporal mode.
   *
   * If a second date is provided, the function returns a string
   * representing the range in the format "date1 / date2".
   *
   * @param date1 - The first date (or the only date) to format
   * @param dateFormat - Object containing the display format for each language
   * @param inputTemporalMode - Optional, whether to interpret the input as 'calendar' or 'instant'
   * @param date2 - Optional second date for formatting a date range
   * @returns A formatted date string or a formatted date range string
   */
  static formatISODateOrDateRange(
    date1: DateLike,
    referenceFormat: TypeDisplayDateFormat,
    inputTemporalMode?: TemporalMode,
    date2?: DateLike
  ): string {
    // If the reference format has time components
    let isoFormat = DateMgt.ISO_DISPLAY_DATE_FORMAT;
    if (this.hasTimeComponents(referenceFormat.en) || this.hasTimeComponents(referenceFormat.fr)) {
      // We want an iso format with time components
      isoFormat = DateMgt.ISO_DISPLAY_DATETIME_FORMAT_MINUTES;
    }

    // Redirect
    return this.formatDateOrDateRange(date1, isoFormat, 'en', DateMgt.TIME_UTC, inputTemporalMode, date2);
  }

  /**
   * Convert a date to milliseconds.
   *
   * @param date - The date to use
   * @param inputFormat - Optional, one or more format strings to prioritize when parsing string inputs
   * @param inputTimezone - Optional timezone to assume for string inputs that do not explicitly include a timezone
   * @returns Date as milliseconds
   * @throws {InvalidTimezoneError} When the time zone is not a valid or supported IANA identifier
   */
  static convertToMilliseconds(date: DateLike, inputFormat?: string | string[], inputTimezone?: TimeIANA): number {
    // Read it
    const parsed = this.createDayjs(date, inputFormat, inputTimezone, 'instant');
    return parsed.valueOf();
  }

  /**
   * Checks if whatever is sent looks like it could be a date.
   *
   * @param date - The string to parse to check if it's a date
   * @param inputTimezone - Optional timezone to assume for string inputs that do not explicitly include a timezone
   * @returns A native `Date` object representing the parsed instant in UTC or `undefined` if parsing fails
   */
  static tryParseDate(date: string, inputTimezone?: TimeIANA): Date | undefined {
    // Try to create a date with the value
    const value = this.parseDateToDayjs(date, this.#DEFAULT_INPUT_FORMATS, inputTimezone, this.DEFAULT_TEMPORAL_MODE, true);
    if (value.isValid()) {
      // Return the date
      return value.toDate();
    }
    return undefined;
  }

  /**
   * Determines whether a date/time format string contains any supported
   * time-related tokens.
   *
   * The method performs a simple substring check against a predefined
   * list of time tokens (e.g. hours, minutes, seconds, meridiem, Unix time).
   * If the format is `undefined`, the method safely returns `false`.
   *
   * @param format - The date/time format string to evaluate. May be `undefined`
   * @returns `true` if the format contains at least one recognized time token;
   * otherwise `false`
   */
  static hasTimeComponents(format: string | undefined): boolean {
    return this.#TIME_TOKENS.some((token) => format?.includes(token));
  }

  /**
   * Attempts to infer display date configuration from a service-provided
   * date format string.
   *
   * The function inspects the format string to determine whether it contains
   * time-related components (e.g., hours, minutes, seconds, timezone tokens).
   * If time components are detected, it assumes:
   * - The date represents an **instant** (not a calendar-only date).
   * - The display timezone should default to **local**.
   * If no time components are detected or the format is undefined,
   * no assumptions are made and `undefined` is returned.
   * This function performs heuristic inference and may not be accurate for all custom
   * or non-standard format strings. Errors during evaluation are logged and do not propagate.
   *
   * @param serviceDateFormat - The date format string provided by the service
   * (e.g., `"YYYY-MM-DDTHH:mm:ss"`)
   * @returns A partial {@link GuessedTimeInformation} object containing inferred
   *          display settings if time components are detected; otherwise `undefined`
   */
  static guessDisplayDateInformationFromServiceDateFormat(serviceDateFormat: string | undefined): GuessedTimeInformation | undefined {
    try {
      // If the serviceDateFormat has time components
      if (serviceDateFormat && this.hasTimeComponents(serviceDateFormat)) {
        // We assume it's in local time and instant temporal mode
        return {
          serviceDateTemporalMode: 'instant',
        };
      }
    } catch (error: unknown) {
      // Log
      logger.logError('Failed to guess the display date information from service date format.', error);
    }

    // Couldn't guess
    return undefined;
  }

  /**
   * Attempts to infer display date configuration from a service time dimension.
   *
   * This function analyzes an array of date values and applies heuristics
   * based on the overall time span and time-of-day consistency to determine:
   * - Whether the dates should be treated as `instant` or `calendar` values.
   * - Which display format is most appropriate.
   * - Whether a timezone assumption should be applied.
   * Heuristic rules:
   * 1. If the total time span between the first and last date is ≤ 1 day:
   *    - Assume the values represent instants within a single day.
   *    - Use full datetime formatting.
   *    - Default display timezone to `local`.
   *    - Set temporal mode to `instant`.
   * 2. If the total time span is ≥ 10 years:
   *    - Assume a long-term dataset where year-level precision is sufficient.
   *    - Use year-only short formatting.
   * 3. If all dates share the exact same UTC time-of-day
   *    (same hours, minutes, seconds):
   *    - Assume the time component is not meaningful.
   *    - Use date-only formatting.
   * If none of the heuristics apply, the function returns `undefined`.
   *
   * All comparisons are performed in UTC. This function relies on heuristics and may not
   * be correct for all datasets. Errors during parsing are logged and do not propagate.
   *
   * @param dates - Array of service-provided date values to analyze
   * @returns A partially populated {@link GuessedTimeInformation} object
   *          if a confident inference can be made; otherwise `undefined`
   */
  static guessDisplayDateInformationFromTimeDimension(
    dates: DateLike[],
    displayDateMode: DisplayDateMode | undefined
  ): GuessedTimeInformation | undefined {
    try {
      // Check if it is a valid dates array
      const validDates = dates.map((date) => {
        return this.createDate(date);
      });

      // Get the defaults for the displayDateMode
      const defaults = this.getDisplayDateDefaults(displayDateMode);

      // If more than 1 date
      if (validDates.length > 1) {
        // Calculate the time delta between the min and max dates
        const timeDelta = validDates[validDates.length - 1].getTime() - validDates[0].getTime();

        // If there's less than 1 day in the time delta
        if (timeDelta <= this.MILLISECONDS_IN_1_DAY) {
          // We assume it's in local time and instant temporal mode and only hours:minutes that we're interested in
          return {
            displayDateFormat: defaults.datetimeFormat,
            displayDateFormatShort: this.DEFAULT_TIME_FORMAT,
            serviceDateTemporalMode: 'instant',
          };
        }

        // If there's more than 10 years in the time delta
        if (timeDelta >= this.MILLISECONDS_IN_1_YEAR * 10) {
          // We assume we want the years only, not caring about the months
          return {
            displayDateFormat: defaults.dateFormat,
            displayDateFormatShort: this.DEFAULT_DATE_YEAR_ONLY_FORMAT,
          };
        }

        // Check if all dates are on the same time
        const first = validDates[0];
        const allSameTimeOfDay = validDates.every((date) => {
          return (
            date.getUTCHours() === first.getUTCHours() &&
            date.getUTCMinutes() === first.getUTCMinutes() &&
            date.getUTCSeconds() === first.getUTCSeconds()
          );
        });

        // If all dates share the exact same time-of-day
        if (allSameTimeOfDay) {
          return {
            displayDateFormat: defaults.dateFormat,
          };
        }
      }
    } catch (error: unknown) {
      // Log
      logger.logError('Failed to guess the display date information from the time dimension.', error);
    }

    // Couldn't guess
    return undefined;
  }

  /**
   * Guesses the estimated steps that should be used by the slider, depending on the value range.
   *
   * @param minValue - The minimum value
   * @param maxValue - The maximum value
   * @returns The estimated stepping value based on the min and max values, or `undefined`
   */
  static guessEstimatedStep(minValue: number, maxValue: number): number | undefined {
    const day1 = 86400000; // 24h x 60m x 60s x 1000ms = 86,400,000ms in a day
    const month1 = day1 * 30; // 2,592,000,000ms in 1 month
    const year1 = day1 * 365; // 31,536,000,000ms in 1 year
    const years2 = year1 * 2; // 63,072,000,000ms in 2 years
    const years10 = year1 * 10; // 63,072,000,000ms in 2 years
    const months2 = month1 * 2; // 315,360,000,000 in 10 years
    const intervalDiff = maxValue - minValue;

    let step: number | undefined;
    if (intervalDiff > months2) step = day1; // Daily stepping
    if (intervalDiff > years2) step = month1; // Monthly stepping
    if (intervalDiff > years10) step = year1; // Yearly stepping
    return step;
  }

  /**
   * Create the Geoview time dimension from ESRI dimension.
   *
   * @param timeDimensionESRI - Esri time dimension object
   * @param displayDateMode - Optional display date mode
   * @param singleHandle - Optional, true if it is ESRI Image
   * @returns The Geoview time dimension
   * @throws {InvalidTimeDimensionError} When range couldn't be computed, or when duration is invalid, or non-positive or when an infinite loop is detected
   * @throws {InvalidDateError} When input has invalid dates
   */
  static createDimensionFromESRI(
    timeDimensionESRI: TimeDimensionESRI,
    displayDateMode: DisplayDateMode | undefined,
    singleHandle: boolean = false
  ): TimeDimension {
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

    // Read the dates in the service and change them to UTC if they're not already
    const dimensionValues = `${this.formatDateISOShort(timeExtent![0])}/${this.formatDateISOShort(timeExtent![1])}${calcDuration()}`;
    const rangeItems = this.createRangeOGC(dimensionValues);

    // Guess the display time information
    const guessedInfo = this.guessDisplayDateInformationFromTimeDimension(rangeItems.range, displayDateMode);

    const defaultValues = singleHandle
      ? [rangeItems.range[rangeItems.range.length - 1]]
      : [rangeItems.range[0], rangeItems.range[rangeItems.range.length - 1]];

    const timeDimension: TimeDimension = {
      field: startTimeField,
      default: defaultValues,
      unitSymbol: '',
      rangeItems,
      nearestValues: rangeItems.type === 'relative' ? 'continuous' : 'discrete',
      singleHandle,
      displayDateFormat: guessedInfo?.displayDateFormat,
      displayDateFormatShort: guessedInfo?.displayDateFormatShort,
      displayDateTimezone: guessedInfo?.displayDateTimezone,
      serviceDateTemporalMode: guessedInfo?.serviceDateTemporalMode,
      isValid: rangeItems.range.length >= 1 && rangeItems.range[0] !== rangeItems.range[rangeItems.range.length - 1],
    };

    return timeDimension;
  }

  /**
   * Create the Geoview time dimension from OGC dimension.
   *
   * @param ogcTimeDimension - The OGC time dimension object or string
   * @param displayDateMode - Optional display date mode
   * @returns The Geoview time dimension
   * @throws {InvalidTimeDimensionError} When range couldn't be computed, or when duration is invalid, or non-positive or when an infinite loop is detected
   * @throws {InvalidDateError} When input has invalid dates
   */
  static createDimensionFromOGC(
    ogcTimeDimension: TypeMetadataWMSCapabilityLayerDimension | string,
    displayDateMode: DisplayDateMode | undefined
  ): TimeDimension {
    const dimensionObject = typeof ogcTimeDimension === 'object' ? ogcTimeDimension : JSON.parse(ogcTimeDimension);
    const rangeItems = this.createRangeOGC(dimensionObject.values);

    // Guess the display time information
    const guessedInfo = this.guessDisplayDateInformationFromTimeDimension(rangeItems.range, displayDateMode);

    const timeDimension: TimeDimension = {
      field: dimensionObject.name,
      default: [dimensionObject.default || rangeItems.range[0]],
      unitSymbol: dimensionObject.unitSymbol || '',
      rangeItems,
      nearestValues: rangeItems.type === 'relative' ? 'continuous' : 'discrete',
      singleHandle: true, // TODO: WMS time dimensions enhancements to support dual handles? Would need to also update the TimeSliderEventProcessor.updateFilters function accordingly
      displayDateFormat: guessedInfo?.displayDateFormat,
      displayDateFormatShort: guessedInfo?.displayDateFormatShort,
      displayDateTimezone: guessedInfo?.displayDateTimezone,
      serviceDateTemporalMode: guessedInfo?.serviceDateTemporalMode,
      isValid: rangeItems.range.length >= 1 && rangeItems.range[0] !== rangeItems.range[rangeItems.range.length - 1],
    };

    return timeDimension;
  }

  /**
   * Create a range of date object from OGC time dimension following ISO 8601.
   *
   * @param ogcTimeDimensionValues - OGC time dimension values
   * @returns Array of date from the dimension
   * @throws {InvalidTimeDimensionError} When range couldn't be computed, or when duration is invalid, or non-positive or when an infinite loop is detected
   * @throws {InvalidDateError} When input has invalid dates
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
      rangeItems = { type: 'relative', range: this.#createRelativeInterval(ogcTimeDimensionValues) };
    else if (isAbsoluteRange(ogcTimeDimensionValues))
      rangeItems = { type: 'discrete', range: this.#createAbsoluteInterval(ogcTimeDimensionValues) };

    // Check if dimension is valid
    if (rangeItems.range.length === 0) throw new InvalidTimeDimensionError(ogcTimeDimensionValues);

    // Return the dates range
    return rangeItems;
  }

  /**
   * Validates that a given IANA time zone is supported by the runtime.
   *
   * @param timezone - IANA time zone identifier (e.g. 'America/Toronto', 'Europe/Paris', 'UTC')
   * @throws {InvalidTimezoneError} When the time zone is not a valid or supported IANA identifier
   */
  static validateTimezone(timezone: TimeIANA): void {
    if (!this.isValidTimezone(timezone)) {
      throw new InvalidTimezoneError(timezone);
    }
  }

  /**
   * Checks whether a given IANA time zone is supported by the runtime.
   *
   * Validation is performed using Day.js with the timezone plugin, which relies
   * on the underlying `Intl` time zone database.
   *
   * @param timezone - IANA time zone identifier to check
   * @returns `true` if the time zone is valid and supported, otherwise `false`
   */
  static isValidTimezone(timezone: TimeIANA): boolean {
    // If meant to be 'local', that's okay
    if (timezone === 'local') return true;

    try {
      dayjs.tz('2020-01-01', timezone);
      return true;
    } catch {
      return false;
    }
  }

  // #endregion STATIC PUBLIC METHODS

  // #region STATIC PRIVATE METHODS

  /**
   * Fixes an issue when using the customParser plugin and the 'Z' suffix in the date input not being recognized as meaning UTC timezone.
   *
   * To reproduce the issue, try calling:
   * const test1 = dayjs('2026-01-19T17:54:00Z', this.DEFAULT_INPUT_FORMATS).toDate();
   * const test2 = dayjs('2026-01-19T17:54:00Z').toDate();
   * test1 will be read as 17:54 local time, whereas test2 will be read correctly as 17h54 UTC time.
   *
   * @param date - The date string to parse
   * @param formats - Optional array of format strings for custom parsing
   * @param strict - Whether to enforce strict parsing
   * @returns A Dayjs instance parsed with the UTC fix applied when needed
   */
  static #createDayjsFixCustomParser(date: string, formats: string[] | undefined, strict: boolean): Dayjs {
    // If it's the UTC timezone ('Z')
    if (/Z$/i.test(date)) {
      // Force dayjs to use utc
      return dayjs.utc(date);
    }

    // Trust dayjs to use the TZ from the input
    return dayjs(date, formats, strict);
  }

  /**
   * Expands an absolute OGC time dimension interval into discrete UTC ISO date values.
   *
   * Supported format:
   *   `start/end/period`
   * Example:
   *   "2002-09-01T00:00:00Z/2002-09-03T00:00:00Z/P1D"
   *   -> [
   *       "2002-09-01T00:00:00.000Z",
   *       "2002-09-02T00:00:00.000Z",
   *       "2002-09-03T00:00:00.000Z"
   *     ]
   * Behavior:
   * - Parses start and end as UTC instants.
   * - Expands the interval by repeatedly adding the provided ISO-8601 duration.
   * - The end value is included if it aligns with the step progression.
   * - Duration increments are applied using calendar-safe logic
   *   (see `#addDurationSafely`) to properly handle month and year periods.
   * Safety:
   * - A guard limit prevents infinite loops caused by malformed or
   *   non-progressing durations.
   *
   * @param ogcTimeDimension - An OGC absolute time dimension string in the form `start/end/period`
   * @returns An array of UTC ISO-8601 strings representing each step from start to end (inclusive when aligned)
   * @throws {InvalidTimeDimensionError} When input does not contain exactly three segments, or when duration is
   *                                     invalid, or non-positive, or when an infinite loop is detected
   * @throws {InvalidDateError} When input has invalid dates
   */
  static #createAbsoluteInterval(ogcTimeDimension: string): string[] {
    const parts = ogcTimeDimension.split('/');
    if (parts.length !== 3) {
      throw new InvalidTimeDimensionError(ogcTimeDimension);
    }

    const [startStr, endStr, periodStr] = parts;

    const start = dayjs.utc(startStr);
    if (!start.isValid()) {
      throw new InvalidDateError(startStr);
    }

    const end = dayjs.utc(endStr);
    if (!end.isValid()) {
      throw new InvalidDateError(endStr);
    }

    const step = dayjs.duration(periodStr);
    if (!step || step.asMilliseconds() <= 0) {
      throw new InvalidTimeDimensionError(periodStr);
    }

    const results: string[] = [];
    let current = start;

    // Safety guard against infinite loops
    let guard = 0;

    while (current.isBefore(end) || current.isSame(end)) {
      results.push(current.toISOString());

      current = this.#addDurationSafely(current, step, periodStr);

      if (++guard > 10000) {
        throw new InvalidTimeDimensionError('Infinite loop detected while expanding OGC interval');
      }
    }

    return results;
  }

  /**
   * Parses and expands a relative OGC time dimension into a concrete UTC
   * start/end interval.
   *
   * Supported formats:
   * - `start/end`
   *   Example: `"2002-09-01T00:00:00Z/2022-12-01T00:00:00Z"`
   * - `start/duration`
   *   Example: `"2002-09-01T00:00:00Z/P1M"`
   * The function always returns a tuple containing ISO-8601 UTC strings
   * (`toISOString()`), inclusive of the computed end.
   * Notes:
   * - All parsing is performed in UTC.
   * - If the second segment is a valid date, it is treated as the end date.
   * - Otherwise, it is interpreted as an ISO-8601 duration and added to the start.
   * - Duration addition is performed using calendar-safe logic
   *   (see `#addDurationSafely`) to correctly handle month and year increments.
   * Not supported:
   * - `duration/end` forms (e.g. `"P1M/2002-09-01T00:00:00Z"`)
   * - Open-ended intervals (e.g. `"PT36H/PRESENT"`)
   *
   * @param ogcTimeDimension - A relative OGC time dimension string (`start/end` or `start/duration`)
   * @returns A two-element array: `[startISO, endISO]`, both formatted as UTC ISO strings
   * @throws {InvalidTimeDimensionError} When input does not contain exactly two segments, or when duration is
   *                                     invalid, or non-positive
   * @throws {InvalidDateError} When input has invalid dates
   */
  static #createRelativeInterval(ogcTimeDimension: string): string[] {
    const parts = ogcTimeDimension.split('/');

    if (parts.length !== 2) {
      throw new InvalidTimeDimensionError(ogcTimeDimension);
    }

    const [startStr, secondPart] = parts;

    const start = dayjs.utc(startStr);
    if (!start.isValid()) {
      throw new InvalidDateError(startStr);
    }

    // Case 1: start/end
    const endAsDate = dayjs.utc(secondPart);
    if (endAsDate.isValid()) {
      return [start.toISOString(), endAsDate.toISOString()];
    }

    // Case 2: start/duration
    const duration = dayjs.duration(secondPart);
    if (!duration || duration.asMilliseconds() <= 0) {
      throw new InvalidTimeDimensionError(secondPart);
    }

    const end = this.#addDurationSafely(start, duration, secondPart);

    return [start.toISOString(), end.toISOString()];
  }

  /**
   * Adds a duration to a Dayjs instance using calendar-safe semantics.
   *
   * This helper ensures that variable-length calendar units (months and years)
   * are added using explicit unit-based operations rather than relying solely
   * on millisecond arithmetic. This avoids drift issues when expanding OGC
   * time intervals that use periods such as `P1M` or `P1Y`.
   * Behavior:
   * - Month-based durations (e.g. `P1M`, `P2M`) are added using `.add(n, 'month')`
   *   to preserve correct month boundaries.
   * - Year-based durations (e.g. `P1Y`, `P2Y`) are added using `.add(n, 'year')`
   *   to correctly handle leap years.
   * - All other durations (days, hours, minutes, seconds, etc.) are added
   *   directly via `.add(duration)` since they are fixed-length units.
   *
   * @param current - The current UTC Dayjs instance to increment
   * @param step - The parsed Dayjs duration representing the increment step
   * @param periodStr - The original ISO-8601 period string (e.g. "P1M", "P1Y", "P1D").
   *                    Used to determine whether the duration represents
   *                    a calendar-based unit (month/year) or a fixed-length unit
   * @returns A new Dayjs instance incremented by the specified duration
   */
  static #addDurationSafely(current: Dayjs, step: Duration, periodStr: string): dayjs.Dayjs {
    // Month-based duration (P1M, P2M, etc.)
    if (periodStr.endsWith('M') && !periodStr.startsWith('PT')) {
      return current.add(step.months(), 'month');
    }

    // Year-based duration (P1Y, P2Y, etc.)
    if (periodStr.endsWith('Y')) {
      return current.add(step.years(), 'year');
    }

    // All fixed-length durations (days, hours, minutes, etc.)
    return current.add(step);
  }

  /**
   * Builds the ordered list of date input formats used for Day.js parsing.
   *
   * This helper prioritizes service-specific date formats while preserving
   * compatibility with a canonical set of default formats.
   * Behavior:
   * - If no `inputFormat` is provided, returns {@link DEFAULT_INPUT_FORMATS}.
   * - If a single format string is provided, it is placed first, followed by
   *   the default formats.
   * - If an array of format strings is provided, all custom formats are placed
   *   first (in order), followed by the default formats.
   * This ordering ensures that more specific or ambiguous formats (e.g. `DD/MM/YYYY`)
   * are attempted before generic ISO or fallback formats.
   *
   * @param inputFormat - Optional custom input format(s) to prioritize during parsing
   * @returns An ordered array of Day.js-compatible format strings, with custom formats evaluated before the defaults
   */
  static #buildInputFormats(inputFormat?: string | string[]): string[] {
    if (!inputFormat) return this.#DEFAULT_INPUT_FORMATS;
    if (inputFormat === this.#DEFAULT_INPUT_FORMATS) return this.#DEFAULT_INPUT_FORMATS;
    return Array.isArray(inputFormat) ? [...inputFormat, ...this.#DEFAULT_INPUT_FORMATS] : [inputFormat, ...this.#DEFAULT_INPUT_FORMATS];
  }

  // #endregion STATIC PRIVATE METHODS
}
