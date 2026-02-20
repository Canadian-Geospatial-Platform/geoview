import type { Dayjs } from 'dayjs';
import 'dayjs/locale/en';
import 'dayjs/locale/fr';
import type { TypeDisplayLanguage, DisplayDateMode } from '@/api/types/map-schema-types';
import type { TypeMetadataWMSCapabilityLayerDimension } from '@/api/types/layer-schema-types';
/**
 * Generic type to represent a date.
 */
export type DateLike = Date | number | string;
/** The type to specify a date format for each supported language */
export type TypeDisplayDateFormat = Record<TypeDisplayLanguage, string>;
/** The type to specify the default date and datetime formats for each supported display date mode */
export type TypeDisplayDateDefaults = {
    dateFormat: TypeDisplayDateFormat;
    datetimeFormat: TypeDisplayDateFormat;
};
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
    nearestValues: 'discrete' | 'continuous';
    singleHandle: boolean;
    displayDateFormat?: TypeDisplayDateFormat;
    displayDateFormatShort?: TypeDisplayDateFormat;
    serviceDateTemporalMode?: TemporalMode;
    displayDateTimezone?: TimeIANA;
    isValid: boolean;
};
export type GuessedTimeInformation = {
    displayDateFormat?: TypeDisplayDateFormat;
    displayDateFormatShort?: TypeDisplayDateFormat;
    serviceDateTemporalMode?: TemporalMode;
    displayDateTimezone?: TimeIANA;
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
    static readonly MILLISECONDS_IN_1_DAY: number;
    static readonly MILLISECONDS_IN_1_YEAR: number;
    /** The international ISO date format. */
    static readonly ISO_DATE_FORMAT = "YYYY-MM-DD";
    /** The international ISO time format with seconds. */
    static readonly ISO_TIME_FORMAT = "HH:mm:ss";
    /** The international ISO time format. */
    static readonly ISO_TIME_FORMAT_MINUTES = "HH:mm";
    /** The international ISO datetime format. */
    static readonly ISO_DATETIME_FORMAT_FULL = "YYYY-MM-DDTHH:mm:ss.SSS";
    /** The international ISO format without the milliseconds. */
    static readonly ISO_DATETIME_FORMAT_SECONDS = "YYYY-MM-DDTHH:mm:ss";
    /** The international ISO format without the seconds. */
    static readonly ISO_DATETIME_FORMAT_MINUTES = "YYYY-MM-DDTHH:mm";
    /** The display format for international ISO date only for English and French */
    static readonly ISO_DISPLAY_DATE_FORMAT: TypeDisplayDateFormat;
    /** A Default time only format for English and French */
    static readonly ISO_DISPLAY_YEAR_ONLY_FORMAT: TypeDisplayDateFormat;
    /** A Default time only format for English and French */
    static readonly ISO_DISPLAY_TIME_FORMAT_MINUTES: TypeDisplayDateFormat;
    /** A Default time only format for English and French */
    static readonly ISO_DISPLAY_DATETIME_FORMAT_MINUTES: TypeDisplayDateFormat;
    /** The Long date format. */
    static readonly LONG_DISPLAY_DATE_FORMAT: {
        en: string;
        fr: string;
    };
    /** The Long datetime format. */
    static readonly LONG_DISPLAY_DATETIME_FORMAT: {
        en: string;
        fr: string;
    };
    /** Static constant to indicate when we interpret a date as UTC. For general purposes of UTC. */
    static readonly TIME_UTC = "UTC";
    /** Static constant indicating the local IANA time zone. */
    static readonly TIME_IANA_LOCAL: string;
    /** Regular expression for matching ISO date strings */
    static readonly REGEX_ISO_DATE: RegExp;
    static readonly REGEX_ISO_DATE_WITH_PREFIX: RegExp;
    /** The Default date format for English and French to be used by the application */
    static DEFAULT_DATE_FORMAT: TypeDisplayDateFormat;
    /** The Default date and time format for English and French to be used by the application */
    static DEFAULT_DATETIME_FORMAT: TypeDisplayDateFormat;
    /** The Default time format for English and French to be used by the application */
    static DEFAULT_TIME_FORMAT: TypeDisplayDateFormat;
    /** The Default time format for English and French to be used by the application */
    static DEFAULT_DATE_YEAR_ONLY_FORMAT: TypeDisplayDateFormat;
    /** The default temporal mode to be used by the application */
    static DEFAULT_TEMPORAL_MODE: TemporalMode;
    /**
     * Gets the default date and datetime formats based on the display date mode.
     * @param {DisplayDateMode | undefined} displayDateMode - The display date mode, e.g., 'long' or undefined for default.
     * @returns {TypeDisplayDateDefaults} The default date and datetime formats for the given mode.
     * @static
     */
    static getDisplayDateDefaults(displayDateMode: DisplayDateMode | undefined): TypeDisplayDateDefaults;
    /**
     * Parses a `DateLike` input into a Dayjs object, automatically handling different types
     * of input and temporal modes.
     * Supports:
     * 1. Epoch numbers and `Date` objects (treated as exact UTC instants)
     * 2. String representations as either "instant" or "calendar" dates
     * 3. Optional custom input formats, strict parsing, and timezones
     * @param {DateLike} date - The input date. Can be:
     *   - A `Date` object
     *   - A timestamp number
     *   - A string (ISO, custom format, or calendar date)
     * @param {string | string[]} [inputFormat] - Optional format(s) for parsing string inputs.
     *   If provided, Dayjs will use these formats instead of auto-detection.
     * @param {TimeIANA} [inputTimezone] - Optional IANA timezone to apply if the input string
     *   does not have an explicit timezone. Defaults to `TIME_UTC` in `parseInstantDate`.
     * @param {TemporalMode} [temporalMode=this.DEFAULT_TEMPORAL_MODE] - Determines
     *   how string inputs are interpreted:
     *   - `"instant"`: exact point in time
     *   - `"calendar"`: normalized to midnight local time
     * @param {boolean} [strict=false] - If true, enforces strict parsing according to the
     *   provided `inputFormat`.
     * @returns {Dayjs} A Dayjs object representing the parsed date.
     * @remarks
     * - If `date` is a number or `Date`, it is parsed as a UTC instant.
     * - If `date` is a string containing a timezone, it is treated as an "instant" date.
     * - If `inputTemporalMode` is `"calendar"`, the string is parsed with
     *   `parseCalendarDate` and normalized to local midnight.
     * - Otherwise, the string is parsed as an instant using `parseInstantDate`.
     * - This method automatically determines the correct parsing helper based on the input.
     * @static
     */
    static parseDateToDayjs(date: DateLike, inputFormat?: string | string[], inputTimezone?: TimeIANA, temporalMode?: TemporalMode, strict?: boolean): Dayjs;
    /**
     * Parses a string as an "instant" point in time into a Dayjs object.
     * Handles:
     * 1. Optional custom input formats
     * 2. Strings with or without explicit timezones
     * 3. Applying a default timezone if missing
     * @param {string} date - The input date string to parse.
     * @param {string | string[]} [inputFormat] - Optional format(s) for parsing.
     *   If provided, Dayjs will use these formats instead of auto-detection.
     * @param {TimeIANA} [inputTimezone=this.TIME_UTC] - IANA timezone string to apply if
     *   the input string has no explicit timezone.
     * @param {boolean} [strict=false] - If true, enforces strict parsing according to the
     *   provided `inputFormat`.
     * @returns {Dayjs} A Dayjs object representing the parsed instant.
     * @throws {InvalidTimezoneError} If the time zone is not a valid or supported IANA identifier.
     * @remarks
     * - If the input string contains a timezone (`hasTZ` is true), it is treated as an exact instant.
     * - If the input string lacks a timezone, `inputTimezone` is applied.
     * @static
     */
    static parseInstantDate(date: string, inputFormat?: string | string[], inputTimezone?: TimeIANA, strict?: boolean): Dayjs;
    /**
     * Parses a date string as a **calendar date**, ignoring any timezone or offset
     * semantics and preserving the civil date and time fields as-is.
     * This function interprets the input purely in terms of its calendar
     * components (year, month, day, and optional time), then normalizes those
     * components by re-anchoring them in UTC. No timezone conversion is applied.
     * This guarantees that calendar-based dates do not shift days due to timezone
     * offsets, DST, or environment locale.
     * @param {string} date - Date string to parse
     * @param {string | string[] | undefined} [inputFormat] - Optional format or list
     * of formats used to parse the input date string
     * @param {boolean} [strict=false] - Whether to enforce strict parsing when using
     * custom formats
     * @returns {Dayjs} Dayjs instance normalized to UTC using calendar semantics
     * @static
     */
    static parseCalendarDate(date: string, inputFormat?: string | string[], strict?: boolean): Dayjs;
    /**
     * Creates a validated Dayjs instance from a `DateLike` input.
     * This is a thin wrapper around `parseDateToDayjs` that ensures the resulting
     * Dayjs object is valid, throwing an error if parsing fails.
     * @param {DateLike} date - The input date to parse. Can be:
     *   - A `Date` object
     *   - A timestamp number
     *   - A string (ISO, custom format, or calendar/instant date)
     * @param {string | string[]} [inputFormat] - Optional format(s) for parsing string inputs.
     *   Passed directly to `parseDateToDayjs`.
     * @param {TimeIANA} [inputTimezone] - Optional IANA timezone to apply if the input string
     *   has no explicit timezone and is parsed as an instant.
     * @param {TemporalMode} [temporalMode] - Determines how string inputs are interpreted:
     *   - `"calendar"`: parsed as a calendar date
     *   - `"instant"`: parsed as an exact point in time
     *   Defaults to `DEFAULT_TEMPORAL_MODE`.
     * @returns {Dayjs} A valid Dayjs object representing the parsed date.
     * @throws {InvalidDateError} When input has invalid date.
     * @remarks
     * - This method guarantees that the returned Dayjs instance is valid.
     * - All parsing rules, timezone handling, and temporal logic are delegated to `parseDateToDayjs`.
     * @static
     */
    static createDayjs(date: DateLike, inputFormat?: string | string[], inputTimezone?: TimeIANA, temporalMode?: TemporalMode): Dayjs;
    /**
     * Creates a native `Date` object from a `DateLike` input.
     * This is a convenience wrapper around `createDayjs` that converts the validated
     * Dayjs instance into a native JavaScript `Date`.
     * @param {DateLike} date - The input date to convert. Can be:
     *   - A `Date` object
     *   - A timestamp number
     *   - A string (ISO, custom format, or calendar/instant date)
     * @param {string | string[]} [inputFormat] - Optional format(s) for parsing string inputs.
     *   Passed directly to `createDayjs`.
     * @param {TimeIANA} [inputTimezone] - Optional IANA timezone to apply if the input string
     *   has no explicit timezone and is parsed as an instant.
     * @param {TemporalMode} [temporalMode] - Determines how string inputs are interpreted:
     *   - `"calendar"`: parsed as a calendar date
     *   - `"instant"`: parsed as an exact point in time
     *   Defaults to `DEFAULT_TEMPORAL_MODE`.
     * @returns {Date} A native JavaScript `Date` object representing the parsed date.
     * @throws {Error} Throws an error if the input cannot be parsed into a valid date.
     * @remarks
     * - Parsing, validation, and temporal logic are delegated to `createDayjs`.
     * - The returned `Date` represents the same instant in time as the underlying Dayjs object.
     * @static
     */
    static createDate(date: DateLike, inputFormat?: string | string[], inputTimezone?: TimeIANA, temporalMode?: TemporalMode): Date;
    /**
     * Formats a `DateLike` value into a string using the specified format, locale,
     * timezone, and temporal interpretation.
     * This method first normalizes the input using `parseDateToDayjs`, then applies
     * output-specific transformations such as timezone conversion, locale, and formatting.
     * @param {DateLike} date - The input date to format. Can be:
     *   - A `Date` object
     *   - A timestamp number
     *   - A string (ISO, custom format, or calendar date)
     * @param {string} [format=this.ISO_FORMAT] - The Dayjs format string used to produce
     *   the output.
     * @param {TypeDisplayLanguage} [locale='en'] - Locale used for formatting (e.g. month
     *   and weekday names).
     * @param {TimeIANA} [outputTimezone=this.TIME_UTC] - IANA timezone applied to the output
     *   when formatting instant dates.
     * @param {TemporalMode} [temporalMode='calendar'] - Determines how the input is interpreted:
     *   - `"calendar"`: treated as a whole calendar day
     *   - `"instant"`: treated as an exact point in time
     * @param {string | string[]} [inputFormat] - Optional format(s) for parsing string inputs.
     *   If provided, these are passed through to `parseDateToDayjs`.
     * @param {TimeIANA} [inputTimezone] - Optional IANA timezone to apply if the input string
     *   has no explicit timezone and is parsed as an instant.
     * @param {boolean} [withZ=false] - Whether to append a literal `'Z'` to the formatted
     *   output string.
     * @returns {string} The formatted date string.
     * @remarks
     * - The input is always parsed via `parseDateToDayjs`, ensuring consistent handling
     *   of `Date`, epoch, and string values.
     * - Calendar dates are normalized to local midnight and are **not** shifted to
     *   `outputTimezone`.
     * - Instant dates are converted to `outputTimezone` before formatting.
     * - The locale is applied after parsing and timezone adjustments.
     * @static
     */
    static formatDate(date: DateLike, format?: string, locale?: TypeDisplayLanguage, outputTimezone?: TimeIANA, temporalMode?: TemporalMode, inputFormat?: string | string[], inputTimezone?: TimeIANA, withZ?: boolean): string;
    /**
     * Formats a date into a short ISO-like string (`YYYY-MM-DDTHH:mm:ss`).
     * This is a convenience wrapper around `formatDate` that produces a compact,
     * timezone-aware ISO-style representation, optionally appending a `Z` suffix
     * when formatted in UTC.
     * @param {DateLike} date - The input date to format. Can be:
     *   - A `Date` object
     *   - A timestamp number
     *   - A string (ISO, custom format, or calendar/instant date)
     * @param {TimeIANA} [outputTimezone=this.TIME_UTC] - IANA timezone applied to the
     *   output when formatting instant dates.
     * @param {TemporalMode} [temporalMode='calendar'] - Determines how the input is interpreted:
     *   - `"calendar"`: treated as a calendar date
     *   - `"instant"`: treated as an exact point in time
     * @param {string | string[]} [inputFormat] - Optional format(s) for parsing string inputs.
     *   Passed through to `formatDate`.
     * @param {TimeIANA} [inputTimezone=this.TIME_UTC] - IANA timezone to apply if the input
     *   string has no explicit timezone and is parsed as an instant.
     * @returns {string} A short ISO-like formatted date string.
     * @remarks
     * - Uses the format `YYYY-MM-DDTHH:mm:ss`.
     * - Delegates all parsing and formatting logic to `formatDate`.
     * - Appends a literal `'Z'` to the output only when `outputTimezone` is UTC.
     * - Calendar dates are not shifted by `outputTimezone`.
     * @static
     */
    static formatDateISOShort(date: DateLike, outputTimezone?: TimeIANA, temporalMode?: TemporalMode, inputFormat?: string | string[], inputTimezone?: TimeIANA): string;
    /**
     * Formats a single date or a date range according to the specified
     * display format, language, timezone, and temporal mode.
     * If a second date is provided, the function returns a string
     * representing the range in the format "date1 / date2".
     * @param {DateLike} date1 - The first date (or the only date) to format.
     * @param {TypeDisplayDateFormat} dateFormat - Object containing the display format for each language.
     * @param {TypeDisplayLanguage} locale - Language code to select the correct format from `dateFormat`.
     * @param {TimeIANA} outputTimezone - The IANA timezone to use for output formatting.
     * @param {TemporalMode} inputTemporalMode - Whether to interpret the input as 'calendar' or 'instant'.
     * @param {DateLike} [date2] - Optional second date for formatting a date range.
     * @returns {string} A formatted date string or a formatted date range string.
     * @static
     */
    static formatDateOrDateRange(date1: DateLike, dateFormat: TypeDisplayDateFormat, locale: TypeDisplayLanguage, outputTimezone?: TimeIANA, inputTemporalMode?: TemporalMode, date2?: DateLike): string;
    /**
     * Formats a single date or a date range according to the specified
     * display format, language, timezone, and temporal mode.
     * If a second date is provided, the function returns a string
     * representing the range in the format "date1 / date2".
     * @param {DateLike} date1 - The first date (or the only date) to format.
     * @param {TypeDisplayDateFormat} dateFormat - Object containing the display format for each language.
     * @param {TemporalMode} inputTemporalMode - Whether to interpret the input as 'calendar' or 'instant'.
     * @param {DateLike} [date2] - Optional second date for formatting a date range.
     * @returns {string} A formatted date string or a formatted date range string.
     * @static
     */
    static formatISODateOrDateRange(date1: DateLike, referenceFormat: TypeDisplayDateFormat, inputTemporalMode?: TemporalMode, date2?: DateLike): string;
    /**
     * Convert a date to milliseconds.
     * @param {DateLike} date - The date to use
     * @param {string | string[]} [inputFormat] - One or more format strings to prioritize when parsing string inputs.
     * @param {TimeIANA} [inputTimezone] - The timezone to assume for string inputs that do not explicitly include a timezone.
     * @returns {number} Date as milliseconds
     * @throws {InvalidTimezoneError} If the time zone is not a valid or supported IANA identifier.
     * @static
     */
    static convertToMilliseconds(date: DateLike, inputFormat?: string | string[], inputTimezone?: TimeIANA): number;
    /**
     * Checks if whatever is sent looks like it could be a date.
     * @param {string} date - The string to parse to check if it's a date.
     * @param {TimeIANA} [inputTimezone] - The timezone to assume for string inputs that do not explicitly include a timezone.
     * @returns {Date} A native `Date` object representing the parsed instant in UTC or `undefined` if parsing fails.
     * @static
     */
    static tryParseDate(date: string, inputTimezone?: TimeIANA): Date | undefined;
    /**
     * Determines whether a date/time format string contains any supported
     * time-related tokens.
     * The method performs a simple substring check against a predefined
     * list of time tokens (e.g. hours, minutes, seconds, meridiem, Unix time).
     * If the format is `undefined`, the method safely returns `false`.
     * @param {string | undefined} format - The date/time format string to evaluate. May be `undefined`.
     * @returns `true` if the format contains at least one recognized time token;
     * otherwise `false`.
     */
    static hasTimeComponents(format: string | undefined): boolean;
    /**
     * Attempts to infer display date configuration from a service-provided
     * date format string.
     * The function inspects the format string to determine whether it contains
     * time-related components (e.g., hours, minutes, seconds, timezone tokens).
     * If time components are detected, it assumes:
     * - The date represents an **instant** (not a calendar-only date).
     * - The display timezone should default to **local**.
     * If no time components are detected or the format is undefined,
     * no assumptions are made and `undefined` is returned.
     * @param {string | undefined} serviceDateFormat - The date format string provided by the service
     * (e.g., `"YYYY-MM-DDTHH:mm:ss"`).
     * @returns {GuessedTimeInformation | undefined} A partial {@link GuessedTimeInformation} object containing inferred
     *          display settings if time components are detected; otherwise `undefined`.
     * @remarks
     * - This function performs heuristic inference and may not be accurate
     *   for all custom or non-standard format strings.
     * - Errors during evaluation are logged and do not propagate.
     */
    static guessDisplayDateInformationFromServiceDateFormat(serviceDateFormat: string | undefined): GuessedTimeInformation | undefined;
    /**
     * Attempts to infer display date configuration from a service time dimension.
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
     * @param {DateLike[]} dates - Array of service-provided date values to analyze.
     * @returns {GuessedTimeInformation | undefined} A partially populated {@link GuessedTimeInformation} object
     *          if a confident inference can be made; otherwise `undefined`.
     * @remarks
     * - All comparisons are performed in UTC.
     * - This function relies on heuristics and may not be correct for all datasets.
     * - Errors during parsing are logged and do not propagate.
     */
    static guessDisplayDateInformationFromTimeDimension(dates: DateLike[], displayDateMode: DisplayDateMode | undefined): GuessedTimeInformation | undefined;
    /**
     * Guesses the estimated steps that should be used by the slider, depending on the value range
     * @param {number} minValue - The minimum value
     * @param {number} maxValue - The maximum value
     * @returns {number | undefined} The estimated stepping value based on the min and max values
     * @static
     */
    static guessEstimatedStep(minValue: number, maxValue: number): number | undefined;
    /**
     * Create the Geoview time dimension from ESRI dimension
     * @param {TimeDimensionESRI} timeDimensionESRI - Esri time dimension object
     * @param {boolean} singleHandle - True if it is ESRI Image
     * @returns {TimeDimension} The Geoview time dimension
     * @throws {InvalidTimeDimensionError} When range couldn't be computed, or when duration is invalid, or non-positive or when an infinite loop is detected.
     * @throws {InvalidDateError} When input has invalid dates.
     * @static
     */
    static createDimensionFromESRI(timeDimensionESRI: TimeDimensionESRI, displayDateMode: DisplayDateMode | undefined, singleHandle?: boolean): TimeDimension;
    /**
     * Create the Geoview time dimension from OGC dimension
     * @param {TypeMetadataWMSCapabilityLayerDimension | string} ogcTimeDimension - The OGC time dimension object or string
     * @returns {TimeDimension} - The Geoview time dimension
     * @throws {InvalidTimeDimensionError} When range couldn't be computed, or when duration is invalid, or non-positive or when an infinite loop is detected.
     * @throws {InvalidDateError} When input has invalid dates.
     * @static
     */
    static createDimensionFromOGC(ogcTimeDimension: TypeMetadataWMSCapabilityLayerDimension | string, displayDateMode: DisplayDateMode | undefined): TimeDimension;
    /**
     * Create a range of date object from OGC time dimension following ISO 8601
     * @param {string} ogcTimeDimensionValues - OGC time dimension values following
     * @returns {RangeItems} array of date from the dimension
     * @throws {InvalidTimeDimensionError} When range couldn't be computed, or when duration is invalid, or non-positive or when an infinite loop is detected.
     * @throws {InvalidDateError} When input has invalid dates.
     * @static
     */
    static createRangeOGC(ogcTimeDimensionValues: string): RangeItems;
    /**
     * Validates that a given IANA time zone is supported by the runtime.
     * @param timezone - IANA time zone identifier (e.g. 'America/Toronto', 'Europe/Paris', 'UTC')
     * @throws {InvalidTimezoneError} If the time zone is not a valid or supported IANA identifier.
     * @static
     */
    static validateTimezone(timezone: TimeIANA): void;
    /**
     * Checks whether a given IANA time zone is supported by the runtime.
     * Validation is performed using Day.js with the timezone plugin, which relies
     * on the underlying `Intl` time zone database.
     * @param timezone - IANA time zone identifier to check
     * @returns `true` if the time zone is valid and supported, otherwise `false`
     * @static
     */
    static isValidTimezone(timezone: TimeIANA): boolean;
}
export {};
//# sourceMappingURL=date-mgt.d.ts.map