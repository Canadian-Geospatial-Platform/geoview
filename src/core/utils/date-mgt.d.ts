import type { Dayjs } from 'dayjs';
import 'dayjs/locale/en';
import 'dayjs/locale/fr';
import type { TypeDisplayLanguage, DisplayDateMode } from '@/api/types/map-schema-types';
import type { TypeMetadataWMSCapabilityLayerDimension } from '@/api/types/layer-schema-types';
/** Generic type to represent a date. */
export type DateLike = Date | number | string;
/** The type to specify a date format for each supported language. */
export type TypeDisplayDateFormat = Record<TypeDisplayLanguage, string>;
/** The type to specify the default date and datetime formats for each supported display date mode. */
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
/**
 * Class used to handle date as ISO 8601.
 */
export declare abstract class DateMgt {
    #private;
    /** The milliseconds for 1 day. */
    static readonly MILLISECONDS_IN_1_DAY: number;
    /** The milliseconds for 1 year (estimation, not considering leap years). */
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
    /** The display format for international ISO date only for English and French. */
    static readonly ISO_DISPLAY_DATE_FORMAT: TypeDisplayDateFormat;
    /** A default year-only format for English and French. */
    static readonly ISO_DISPLAY_YEAR_ONLY_FORMAT: TypeDisplayDateFormat;
    /** A default time-only format for English and French. */
    static readonly ISO_DISPLAY_TIME_FORMAT_MINUTES: TypeDisplayDateFormat;
    /** A default datetime format for English and French. */
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
    /** Regular expression for matching ISO date strings. */
    static readonly REGEX_ISO_DATE: RegExp;
    /** Regular expression for matching ISO date strings with a 'date' prefix. */
    static readonly REGEX_ISO_DATE_WITH_PREFIX: RegExp;
    /** The default date format for English and French to be used by the application. */
    static DEFAULT_DATE_FORMAT: TypeDisplayDateFormat;
    /** The default date and time format for English and French to be used by the application. */
    static DEFAULT_DATETIME_FORMAT: TypeDisplayDateFormat;
    /** The default time format for English and French to be used by the application. */
    static DEFAULT_TIME_FORMAT: TypeDisplayDateFormat;
    /** The default year-only format for English and French to be used by the application. */
    static DEFAULT_DATE_YEAR_ONLY_FORMAT: TypeDisplayDateFormat;
    /** The default temporal mode to be used by the application. */
    static DEFAULT_TEMPORAL_MODE: TemporalMode;
    /**
     * Gets the default date and datetime formats based on the display date mode.
     *
     * @param displayDateMode - The display date mode, e.g., 'long' or undefined for default
     * @returns The default date and datetime formats for the given mode
     */
    static getDisplayDateDefaults(displayDateMode: DisplayDateMode | undefined): TypeDisplayDateDefaults;
    /**
     * Parses a `DateLike` input into a Dayjs object, automatically handling different types
     * of input and temporal modes.
     *
     * Supports:
     * 1. Epoch numbers and `Date` objects (treated as exact UTC instants)
     * 2. String representations as either "instant" or "calendar" dates
     * 3. Optional custom input formats, strict parsing, and timezones
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
     * @remarks
     * - If `date` is a number or `Date`, it is parsed as a UTC instant.
     * - If `date` is a string containing a timezone, it is treated as an "instant" date.
     * - If `inputTemporalMode` is `"calendar"`, the string is parsed with
     *   `parseCalendarDate` and normalized to local midnight.
     * - Otherwise, the string is parsed as an instant using `parseInstantDate`.
     * - This method automatically determines the correct parsing helper based on the input.
     */
    static parseDateToDayjs(date: DateLike, inputFormat?: string | string[], inputTimezone?: TimeIANA, temporalMode?: TemporalMode, strict?: boolean): Dayjs;
    /**
     * Parses a string as an "instant" point in time into a Dayjs object.
     *
     * Handles:
     * 1. Optional custom input formats
     * 2. Strings with or without explicit timezones
     * 3. Applying a default timezone if missing
     *
     * @param date - The input date string to parse
     * @param inputFormat - Optional format(s) for parsing.
     *   If provided, Dayjs will use these formats instead of auto-detection
     * @param inputTimezone - Optional IANA timezone string to apply if
     *   the input string has no explicit timezone
     * @param strict - Optional, if true, enforces strict parsing according to the provided `inputFormat`
     * @returns A Dayjs object representing the parsed instant
     * @throws {InvalidTimezoneError} When the time zone is not a valid or supported IANA identifier
     * @remarks
     * - If the input string contains a timezone (`hasTZ` is true), it is treated as an exact instant.
     * - If the input string lacks a timezone, `inputTimezone` is applied.
     */
    static parseInstantDate(date: string, inputFormat?: string | string[], inputTimezone?: TimeIANA, strict?: boolean): Dayjs;
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
    static parseCalendarDate(date: string, inputFormat?: string | string[], strict?: boolean): Dayjs;
    /**
     * Creates a validated Dayjs instance from a `DateLike` input.
     *
     * This is a thin wrapper around `parseDateToDayjs` that ensures the resulting
     * Dayjs object is valid, throwing an error if parsing fails.
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
     * @remarks
     * - This method guarantees that the returned Dayjs instance is valid.
     * - All parsing rules, timezone handling, and temporal logic are delegated to `parseDateToDayjs`.
     */
    static createDayjs(date: DateLike, inputFormat?: string | string[], inputTimezone?: TimeIANA, temporalMode?: TemporalMode): Dayjs;
    /**
     * Creates a native `Date` object from a `DateLike` input.
     *
     * This is a convenience wrapper around `createDayjs` that converts the validated
     * Dayjs instance into a native JavaScript `Date`.
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
     * @remarks
     * - Parsing, validation, and temporal logic are delegated to `createDayjs`.
     * - The returned `Date` represents the same instant in time as the underlying Dayjs object.
     */
    static createDate(date: DateLike, inputFormat?: string | string[], inputTimezone?: TimeIANA, temporalMode?: TemporalMode): Date;
    /**
     * Formats a `DateLike` value into a string using the specified format, locale,
     * timezone, and temporal interpretation.
     *
     * This method first normalizes the input using `parseDateToDayjs`, then applies
     * output-specific transformations such as timezone conversion, locale, and formatting.
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
     * @remarks
     * - The input is always parsed via `parseDateToDayjs`, ensuring consistent handling
     *   of `Date`, epoch, and string values.
     * - Calendar dates are normalized to local midnight and are **not** shifted to
     *   `outputTimezone`.
     * - Instant dates are converted to `outputTimezone` before formatting.
     * - The locale is applied after parsing and timezone adjustments.
     */
    static formatDate(date: DateLike, format?: string, locale?: TypeDisplayLanguage, outputTimezone?: TimeIANA, temporalMode?: TemporalMode, inputFormat?: string | string[], inputTimezone?: TimeIANA, withZ?: boolean): string;
    /**
     * Formats a date into a short ISO-like string (`YYYY-MM-DDTHH:mm:ss`).
     *
     * This is a convenience wrapper around `formatDate` that produces a compact,
     * timezone-aware ISO-style representation, optionally appending a `Z` suffix
     * when formatted in UTC.
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
     * @remarks
     * - Uses the format `YYYY-MM-DDTHH:mm:ss`.
     * - Delegates all parsing and formatting logic to `formatDate`.
     * - Appends a literal `'Z'` to the output only when `outputTimezone` is UTC.
     * - Calendar dates are not shifted by `outputTimezone`.
     */
    static formatDateISOShort(date: DateLike, outputTimezone?: TimeIANA, temporalMode?: TemporalMode, inputFormat?: string | string[], inputTimezone?: TimeIANA): string;
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
    static formatDateOrDateRange(date1: DateLike, dateFormat: TypeDisplayDateFormat, locale: TypeDisplayLanguage, outputTimezone?: TimeIANA, inputTemporalMode?: TemporalMode, date2?: DateLike): string;
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
    static formatISODateOrDateRange(date1: DateLike, referenceFormat: TypeDisplayDateFormat, inputTemporalMode?: TemporalMode, date2?: DateLike): string;
    /**
     * Convert a date to milliseconds.
     *
     * @param date - The date to use
     * @param inputFormat - Optional, one or more format strings to prioritize when parsing string inputs
     * @param inputTimezone - Optional timezone to assume for string inputs that do not explicitly include a timezone
     * @returns Date as milliseconds
     * @throws {InvalidTimezoneError} When the time zone is not a valid or supported IANA identifier
     */
    static convertToMilliseconds(date: DateLike, inputFormat?: string | string[], inputTimezone?: TimeIANA): number;
    /**
     * Checks if whatever is sent looks like it could be a date.
     *
     * @param date - The string to parse to check if it's a date
     * @param inputTimezone - Optional timezone to assume for string inputs that do not explicitly include a timezone
     * @returns A native `Date` object representing the parsed instant in UTC or `undefined` if parsing fails
     */
    static tryParseDate(date: string, inputTimezone?: TimeIANA): Date | undefined;
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
    static hasTimeComponents(format: string | undefined): boolean;
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
     *
     * @param serviceDateFormat - The date format string provided by the service
     * (e.g., `"YYYY-MM-DDTHH:mm:ss"`)
     * @returns A partial {@link GuessedTimeInformation} object containing inferred
     *          display settings if time components are detected; otherwise `undefined`
     * @remarks
     * - This function performs heuristic inference and may not be accurate
     *   for all custom or non-standard format strings.
     * - Errors during evaluation are logged and do not propagate.
     */
    static guessDisplayDateInformationFromServiceDateFormat(serviceDateFormat: string | undefined): GuessedTimeInformation | undefined;
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
     * @param dates - Array of service-provided date values to analyze
     * @returns A partially populated {@link GuessedTimeInformation} object
     *          if a confident inference can be made; otherwise `undefined`
     * @remarks
     * - All comparisons are performed in UTC.
     * - This function relies on heuristics and may not be correct for all datasets.
     * - Errors during parsing are logged and do not propagate.
     */
    static guessDisplayDateInformationFromTimeDimension(dates: DateLike[], displayDateMode: DisplayDateMode | undefined): GuessedTimeInformation | undefined;
    /**
     * Guesses the estimated steps that should be used by the slider, depending on the value range.
     *
     * @param minValue - The minimum value
     * @param maxValue - The maximum value
     * @returns The estimated stepping value based on the min and max values, or `undefined`
     */
    static guessEstimatedStep(minValue: number, maxValue: number): number | undefined;
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
    static createDimensionFromESRI(timeDimensionESRI: TimeDimensionESRI, displayDateMode: DisplayDateMode | undefined, singleHandle?: boolean): TimeDimension;
    /**
     * Create the Geoview time dimension from OGC dimension.
     *
     * @param ogcTimeDimension - The OGC time dimension object or string
     * @param displayDateMode - Optional display date mode
     * @returns The Geoview time dimension
     * @throws {InvalidTimeDimensionError} When range couldn't be computed, or when duration is invalid, or non-positive or when an infinite loop is detected
     * @throws {InvalidDateError} When input has invalid dates
     */
    static createDimensionFromOGC(ogcTimeDimension: TypeMetadataWMSCapabilityLayerDimension | string, displayDateMode: DisplayDateMode | undefined): TimeDimension;
    /**
     * Create a range of date object from OGC time dimension following ISO 8601.
     *
     * @param ogcTimeDimensionValues - OGC time dimension values
     * @returns Array of date from the dimension
     * @throws {InvalidTimeDimensionError} When range couldn't be computed, or when duration is invalid, or non-positive or when an infinite loop is detected
     * @throws {InvalidDateError} When input has invalid dates
     */
    static createRangeOGC(ogcTimeDimensionValues: string): RangeItems;
    /**
     * Validates that a given IANA time zone is supported by the runtime.
     *
     * @param timezone - IANA time zone identifier (e.g. 'America/Toronto', 'Europe/Paris', 'UTC')
     * @throws {InvalidTimezoneError} When the time zone is not a valid or supported IANA identifier
     */
    static validateTimezone(timezone: TimeIANA): void;
    /**
     * Checks whether a given IANA time zone is supported by the runtime.
     *
     * Validation is performed using Day.js with the timezone plugin, which relies
     * on the underlying `Intl` time zone database.
     *
     * @param timezone - IANA time zone identifier to check
     * @returns `true` if the time zone is valid and supported, otherwise `false`
     */
    static isValidTimezone(timezone: TimeIANA): boolean;
}
export {};
//# sourceMappingURL=date-mgt.d.ts.map