import { Test } from '../core/test';
import { GVAbstractTester } from './abstract-gv-tester';
import type { TypeDisplayLanguage } from 'geoview-core/api/types/map-schema-types';
import type { DateLike } from 'geoview-core/core/utils/date-mgt';
import { DateMgt } from 'geoview-core/core/utils/date-mgt';

/**
 * Main Core testing class.
 */
export class CoreTester extends GVAbstractTester {
  /** The epoch for new year 2000 midnight */
  static readonly JAN1_2000_EPOCH = 946684800000; // 2000-01-01 00:00:00 UTC
  /** The date object for new year 2000 midnight */
  static readonly JAN1_2000_DATE = new Date(CoreTester.JAN1_2000_EPOCH);
  /** The ISO string with Z for new year 2000 midnight */
  static readonly JAN1_2000_ISO_WITH_Z = '2000-01-01T00:00:00Z';
  /** 19h in Toronto on Dec 31 1999 is the same instant as midnight UTC */
  static readonly JAN1_2000_ISO_WITH_EXPLICIT_TIMEZONE = '1999-12-31T19:00:00-05:00';

  /** Epoch Results */
  static readonly JAN1_2000_0000_ISO = '2000-01-01T00:00:00.000';
  static readonly JAN1_2000_0500_ISO = '2000-01-01T05:00:00.000';
  static readonly JAN1_1999_1900_ISO = '1999-12-31T19:00:00.000';
  static readonly DEC31_1999_YYYYMMDD = '1999-12-31';
  static readonly JAN1_2000_YYYYMMDD = '2000-01-01';
  static readonly JAN2_2000_YYYYMMDD = '2000-01-02';
  static readonly JAN3_2000_YYYYMMDD = '2000-01-03';
  static readonly DEC31_1999_1900_LONG_EN = 'December 31, 1999 @ 19:00';
  static readonly DEC31_1999_1900_LONG_FR = '31 décembre, 1999 @ 19:00';
  static readonly JAN1_2000_0000_LONG_EN = 'January 1, 2000 @ 00:00';
  static readonly JAN1_2000_0000_LONG_FR = '1 janvier, 2000 @ 00:00';
  static readonly JAN1_2000_1900_LONG_EN = 'January 1, 2000 @ 19:00';
  static readonly JAN1_2000_1900_LONG_FR = '1 janvier, 2000 @ 19:00';
  static readonly JAN1_2000_2100_LONG_EN = 'January 1, 2000 @ 21:00';
  static readonly JAN1_2000_2100_LONG_FR = '1 janvier, 2000 @ 21:00';
  static readonly JAN2_2000_0000_LONG_EN = 'January 2, 2000 @ 00:00';
  static readonly JAN2_2000_0000_LONG_FR = '2 janvier, 2000 @ 00:00';
  static readonly JAN2_2000_0200_LONG_EN = 'January 2, 2000 @ 02:00';
  static readonly JAN2_2000_0200_LONG_FR = '2 janvier, 2000 @ 02:00';
  static readonly JAN2_2000_0500_LONG_EN = 'January 2, 2000 @ 05:00';
  static readonly JAN2_2000_0500_LONG_FR = '2 janvier, 2000 @ 05:00';
  static readonly JAN2_2000_0700_LONG_EN = 'January 2, 2000 @ 07:00';
  static readonly JAN2_2000_0700_LONG_FR = '2 janvier, 2000 @ 07:00';

  /** Jan 2 2000 with month first, standard */
  static readonly JAN2_2000_NOTIME_USSTANDARD = '01/02/2000';
  /** Jan 2 2000 with month first with time 10:00 */
  static readonly JAN2_2000_0200_USSTANDARD = '01/02/2000 02:00';
  /** Jan 2 2000 with month first with time 10:00 */
  static readonly JAN2_2000_1000_USSTANDARD = '01/02/2000 10:00';
  /** Jan 2 2000 with month first with time 6 PM */
  static readonly JAN2_2000_6PM_USSTANDARD = '01/02/2000 6:00 PM';
  /** Jan 2 2000 with month first with time 11 PM */
  static readonly JAN2_2000_2300_USSTANDARD = '01/02/2000 23:00';

  /** US Standard Results */
  static readonly JAN1_2000_1900_ISO = '2000-01-01T19:00:00.000';
  static readonly JAN1_2000_2100_ISO = '2000-01-01T21:00:00.000';
  static readonly JAN2_2000_0000_ISO = '2000-01-02T00:00:00.000';
  static readonly JAN2_2000_0200_ISO = '2000-01-02T02:00:00.000';
  static readonly JAN2_2000_0500_ISO = '2000-01-02T05:00:00.000';
  static readonly JAN2_2000_0700_ISO = '2000-01-02T07:00:00.000';
  static readonly JAN2_2000_1000_ISO = '2000-01-02T10:00:00.000';
  static readonly JAN2_2000_1300_ISO = '2000-01-02T13:00:00.000';
  static readonly JAN2_2000_1500_ISO = '2000-01-02T15:00:00.000';
  static readonly JAN2_2000_1800_ISO = '2000-01-02T18:00:00.000';
  static readonly JAN2_2000_2300_ISO = '2000-01-02T23:00:00.000';
  static readonly JAN3_2000_0400_ISO = '2000-01-03T04:00:00.000';

  /** Jan 2 2000 with day first, odd format */
  static readonly JAN2_2000_NOTIME_DAY_FIRST = '02/01/2000';
  static readonly JAN2_2000_6PM_DAY_FIRST = '02/01/2000 6:00 PM';
  static readonly JAN2_2000_1800_DAY_FIRST = '02/01/2000 18:00';

  /** Toronto IANA */
  static readonly TorontoIANA = 'America/Toronto';

  /**
   * Returns the name of the Tester.
   *
   * @returns The name of the Tester
   */
  override getName(): string {
    return 'CoreTester';
  }

  // #region STATIC METHODS PUBLIC

  /**
   * Tests dates from epoch timestamps.
   *
   * @returns A promise resolving when the test completes
   */
  testDatesEpochTimestamps(): Promise<Test<DatesSet[]>> {
    // Test
    return this.test(
      `Test Dates from Epoch Timestamps and Dates...`,
      (test) => {
        test.addStep('Creating a set of dates from epoch timestamps...');
        const newYearEpoch = CoreTester.#formatDates(CoreTester.JAN1_2000_EPOCH, undefined, undefined, undefined);

        test.addStep('Creating a set of dates from dates...');
        const newYearDate = CoreTester.#formatDates(CoreTester.JAN1_2000_DATE, undefined, undefined, undefined);

        test.addStep('Creating a set of dates from date ISO with Z');
        const datesISOZ = CoreTester.#formatDates(CoreTester.JAN1_2000_ISO_WITH_Z, undefined, undefined, undefined);

        test.addStep('Creating a set of dates from date ISO with explicit TZ');
        const datesISOExplicitTZ = CoreTester.#formatDates(
          CoreTester.JAN1_2000_ISO_WITH_EXPLICIT_TIMEZONE,
          undefined,
          undefined,
          undefined
        );

        test.addStep('Creating a set of dates from epoch timestamps with long format...');
        const newYearEpochLongFormat = CoreTester.#formatDates(CoreTester.JAN1_2000_EPOCH, 'MMMM D, YYYY @ HH:mm', 'en', undefined);

        test.addStep('Creating a set of dates from epoch timestamps with long format French...');
        const newYearEpochLongFormatFrench = CoreTester.#formatDates(CoreTester.JAN1_2000_EPOCH, 'D MMMM, YYYY @ HH:mm', 'fr', undefined);

        test.addStep('Creating a set of dates from date ISO with Z with long format...');
        const newYearISOZLongFormat = CoreTester.#formatDates(CoreTester.JAN1_2000_ISO_WITH_Z, 'MMMM D, YYYY @ HH:mm', 'en', undefined);

        test.addStep('Creating a set of dates from date ISO with explicit TZ with long format...');
        const newYearISOExplicitTZLongFormat = CoreTester.#formatDates(
          CoreTester.JAN1_2000_ISO_WITH_EXPLICIT_TIMEZONE,
          'MMMM D, YYYY @ HH:mm',
          'en',
          undefined
        );

        test.addStep('Creating a set of dates from epoch timestamps with date-only format...');
        const newYearEpochYYYYMMDD = CoreTester.#formatDates(CoreTester.JAN1_2000_EPOCH, 'YYYY-MM-DD', undefined, undefined);

        test.addStep('Creating a set of dates from dates with date-only format...');
        const newYearDateYYYYMMDD = CoreTester.#formatDates(CoreTester.JAN1_2000_DATE, 'YYYY-MM-DD', undefined, undefined);

        test.addStep('Creating a set of dates from date ISO with Z with date-only format');
        const datesISOZYYYYMMDD = CoreTester.#formatDates(CoreTester.JAN1_2000_ISO_WITH_Z, 'YYYY-MM-DD', undefined, undefined);

        test.addStep('Creating a set of dates from date ISO with explicit TZ with date-only format...');
        const newYearISOExplicitTZYYYYMMDD = CoreTester.#formatDates(
          CoreTester.JAN1_2000_ISO_WITH_EXPLICIT_TIMEZONE,
          'YYYY-MM-DD',
          undefined,
          undefined
        );

        // Return the dates
        return [
          newYearEpoch,
          newYearDate,
          datesISOZ,
          datesISOExplicitTZ,
          newYearEpochLongFormat,
          newYearISOZLongFormat,
          newYearISOExplicitTZLongFormat,
          newYearEpochLongFormatFrench,
          newYearEpochYYYYMMDD,
          newYearDateYYYYMMDD,
          datesISOZYYYYMMDD,
          newYearISOExplicitTZYYYYMMDD,
        ];
      },
      (test, result) => {
        // Perform assertions
        const [
          newYearEpoch,
          newYearDate,
          datesISOZ,
          datesISOExplicitTZ,
          newYearEpochLongFormat,
          newYearISOZLongFormat,
          newYearISOExplicitTZLongFormat,
          newYearEpochLongFormatFrench,
          newYearEpochYYYYMMDD,
          newYearDateYYYYMMDD,
          datesISOZYYYYMMDD,
          newYearISOExplicitTZYYYYMMDD,
        ] = result;

        test.addStep(`-> Verifying dates from epoch timestamps... ${newYearEpoch.input}`);
        CoreTester.#assertDatesFromEpochDatesStringWithTZ(test, newYearEpoch, CoreTester.JAN1_2000_0000_ISO, CoreTester.JAN1_1999_1900_ISO);

        test.addStep(`-> Verifying dates from date object... ${newYearDate.input}`);
        CoreTester.#assertDatesFromEpochDatesStringWithTZ(test, newYearDate, CoreTester.JAN1_2000_0000_ISO, CoreTester.JAN1_1999_1900_ISO);

        test.addStep(`-> Verifying dates from date ISO with Z... ${datesISOZ.input}`);
        CoreTester.#assertDatesFromEpochDatesStringWithTZ(test, datesISOZ, CoreTester.JAN1_2000_0000_ISO, CoreTester.JAN1_1999_1900_ISO);

        test.addStep(`-> Verifying dates from date ISO with explicit TZ... ${datesISOExplicitTZ.input}`);
        CoreTester.#assertDatesFromEpochDatesStringWithTZ(
          test,
          datesISOExplicitTZ,
          CoreTester.JAN1_2000_0000_ISO,
          CoreTester.JAN1_1999_1900_ISO
        );

        test.addStep(`-> Verifying dates from epoch timestamps with long output format... ${newYearEpochLongFormat.input}`);
        CoreTester.#assertDatesFromEpochDatesStringWithTZ(
          test,
          newYearEpochLongFormat,
          CoreTester.JAN1_2000_0000_LONG_EN,
          CoreTester.DEC31_1999_1900_LONG_EN
        );

        test.addStep(`-> Verifying dates from epoch timestamps with long output format French... ${newYearEpochLongFormatFrench.input}`);
        CoreTester.#assertDatesFromEpochDatesStringWithTZ(
          test,
          newYearEpochLongFormatFrench,
          CoreTester.JAN1_2000_0000_LONG_FR,
          CoreTester.DEC31_1999_1900_LONG_FR
        );

        test.addStep(`-> Verifying dates from date ISO with Z with long output format... ${newYearISOZLongFormat.input}`);
        CoreTester.#assertDatesFromEpochDatesStringWithTZ(
          test,
          newYearISOZLongFormat,
          CoreTester.JAN1_2000_0000_LONG_EN,
          CoreTester.DEC31_1999_1900_LONG_EN
        );

        test.addStep(
          `-> Verifying dates from date ISO with explicit TZ with long output format... ${newYearISOExplicitTZLongFormat.input}`
        );
        CoreTester.#assertDatesFromEpochDatesStringWithTZ(
          test,
          newYearISOExplicitTZLongFormat,
          CoreTester.JAN1_2000_0000_LONG_EN,
          CoreTester.DEC31_1999_1900_LONG_EN
        );

        test.addStep(`-> Verifying dates from epoch timestamps with YYYY-MM-DD output format... ${newYearEpochYYYYMMDD.input}`);
        CoreTester.#assertDatesFromEpochDatesStringWithTZ(
          test,
          newYearEpochYYYYMMDD,
          CoreTester.JAN1_2000_YYYYMMDD,
          CoreTester.DEC31_1999_YYYYMMDD
        );

        test.addStep(`-> Verifying dates from date object with YYYY-MM-DD output format... ${newYearDateYYYYMMDD.input}`);
        CoreTester.#assertDatesFromEpochDatesStringWithTZ(
          test,
          newYearDateYYYYMMDD,
          CoreTester.JAN1_2000_YYYYMMDD,
          CoreTester.DEC31_1999_YYYYMMDD
        );

        test.addStep(`-> Verifying dates from date ISO with Z with YYYY-MM-DD output format... ${datesISOZYYYYMMDD.input}`);
        CoreTester.#assertDatesFromEpochDatesStringWithTZ(
          test,
          datesISOZYYYYMMDD,
          CoreTester.JAN1_2000_YYYYMMDD,
          CoreTester.DEC31_1999_YYYYMMDD
        );

        test.addStep(
          `-> Verifying dates from date ISO with explicit TZ with YYYY-MM-DD output format... ${newYearISOExplicitTZYYYYMMDD.input}`
        );
        CoreTester.#assertDatesFromEpochDatesStringWithTZ(
          test,
          newYearISOExplicitTZYYYYMMDD,
          CoreTester.JAN1_2000_YYYYMMDD,
          CoreTester.DEC31_1999_YYYYMMDD
        );
      }
    );
  }

  /**
   * Tests dates from US standards.
   *
   * @returns A promise resolving when the test completes
   */
  testDatesUSStandard(): Promise<Test<DatesSet[]>> {
    // Test
    return this.test(
      `Test Dates from US Standards...`,
      (test) => {
        test.addStep('Creating a set of dates from date without time...');
        const datesNoTime = CoreTester.#formatDates(CoreTester.JAN2_2000_NOTIME_USSTANDARD, undefined, undefined, undefined);

        test.addStep('Creating a set of dates from date with time 02:00...');
        const datesWith0200 = CoreTester.#formatDates(CoreTester.JAN2_2000_0200_USSTANDARD, undefined, undefined, undefined);

        test.addStep('Creating a set of dates from date with time 10:00...');
        const datesWith1000 = CoreTester.#formatDates(CoreTester.JAN2_2000_1000_USSTANDARD, undefined, undefined, undefined);

        test.addStep('Creating a set of dates from date with time 6:00 PM...');
        const datesWith6PM = CoreTester.#formatDates(CoreTester.JAN2_2000_6PM_USSTANDARD, undefined, undefined, undefined);

        test.addStep('Creating a set of dates from date with time 23:00...');
        const datesWith2300 = CoreTester.#formatDates(CoreTester.JAN2_2000_2300_USSTANDARD, undefined, undefined, undefined);

        test.addStep('Creating a set of dates from date without time with long format...');
        const datesNoTimeLongFormat = CoreTester.#formatDates(
          CoreTester.JAN2_2000_NOTIME_USSTANDARD,
          'MMMM D, YYYY @ HH:mm',
          'en',
          undefined
        );

        test.addStep('Creating a set of dates from date without time with long format French...');
        const datesNoTimeLongFormatFrench = CoreTester.#formatDates(
          CoreTester.JAN2_2000_NOTIME_USSTANDARD,
          'D MMMM, YYYY @ HH:mm',
          'fr',
          undefined
        );

        test.addStep('Creating a set of dates from date with time with long format...');
        const datesWith0200LongFormat = CoreTester.#formatDates(
          CoreTester.JAN2_2000_0200_USSTANDARD,
          'MMMM D, YYYY @ HH:mm',
          'en',
          undefined
        );

        // Return the dates
        return [
          datesNoTime,
          datesWith0200,
          datesWith1000,
          datesWith6PM,
          datesWith2300,
          datesNoTimeLongFormat,
          datesNoTimeLongFormatFrench,
          datesWith0200LongFormat,
        ];
      },
      (test, result) => {
        // Perform assertions
        const [
          datesNoTime,
          datesWith0200,
          datesWith1000,
          datesWith6PM,
          datesWith2300,
          datesNoTimeLongFormat,
          datesNoTimeLongFormatFrench,
          datesWith0200LongFormat,
        ] = result;

        // Redirect
        test.addStep(`-> Verifying dates from date no time... ${datesNoTime.input}`);
        CoreTester.#assertDatesFromStringWithoutZ(
          test,
          datesNoTime,
          CoreTester.JAN2_2000_0000_ISO,
          CoreTester.JAN1_2000_1900_ISO,
          CoreTester.JAN2_2000_0500_ISO
        );

        // Redirect
        test.addStep(`-> Verifying dates from date 02:00... ${datesWith0200.input}`);
        CoreTester.#assertDatesFromStringWithoutZ(
          test,
          datesWith0200,
          CoreTester.JAN2_2000_0200_ISO,
          CoreTester.JAN1_2000_2100_ISO,
          CoreTester.JAN2_2000_0700_ISO
        );

        // Redirect
        test.addStep(`-> Verifying dates from date 10:00... ${datesWith1000.input}`);
        CoreTester.#assertDatesFromStringWithoutZ(
          test,
          datesWith1000,
          CoreTester.JAN2_2000_1000_ISO,
          CoreTester.JAN2_2000_0500_ISO,
          CoreTester.JAN2_2000_1500_ISO
        );

        // Redirect
        test.addStep(`-> Verifying dates from date 18:00... ${datesWith6PM.input}`);
        CoreTester.#assertDatesFromStringWithoutZ(
          test,
          datesWith6PM,
          CoreTester.JAN2_2000_1800_ISO,
          CoreTester.JAN2_2000_1300_ISO,
          CoreTester.JAN2_2000_2300_ISO
        );

        // Redirect
        test.addStep(`-> Verifying dates from date 23:00... ${datesWith2300.input}`);
        CoreTester.#assertDatesFromStringWithoutZ(
          test,
          datesWith2300,
          CoreTester.JAN2_2000_2300_ISO,
          CoreTester.JAN2_2000_1800_ISO,
          CoreTester.JAN3_2000_0400_ISO
        );

        // Redirect
        test.addStep(`-> Verifying dates from date no time long format... ${datesNoTimeLongFormat.input}`);
        CoreTester.#assertDatesFromStringWithoutZ(
          test,
          datesNoTimeLongFormat,
          CoreTester.JAN2_2000_0000_LONG_EN,
          CoreTester.JAN1_2000_1900_LONG_EN,
          CoreTester.JAN2_2000_0500_LONG_EN
        );

        // Redirect
        test.addStep(`-> Verifying dates from date no time long format French... ${datesNoTimeLongFormatFrench.input}`);
        CoreTester.#assertDatesFromStringWithoutZ(
          test,
          datesNoTimeLongFormatFrench,
          CoreTester.JAN2_2000_0000_LONG_FR,
          CoreTester.JAN1_2000_1900_LONG_FR,
          CoreTester.JAN2_2000_0500_LONG_FR
        );

        // Redirect
        test.addStep(`-> Verifying dates from date with time long format... ${datesWith0200LongFormat.input}`);
        CoreTester.#assertDatesFromStringWithoutZ(
          test,
          datesWith0200LongFormat,
          CoreTester.JAN2_2000_0200_LONG_EN,
          CoreTester.JAN1_2000_2100_LONG_EN,
          CoreTester.JAN2_2000_0700_LONG_EN
        );
      }
    );
  }

  /**
   * Tests dates from special formats.
   *
   * @returns A promise resolving when the test completes
   */
  testDatesSpecialFormats(): Promise<Test<DatesSet[]>> {
    // Test
    return this.test(
      `Test Dates from Custom Formats...`,
      (test) => {
        // Create a date from a string
        test.addStep('Creating a set of dates with day first...');
        const dayFirstNoTime = CoreTester.#formatDates(CoreTester.JAN2_2000_NOTIME_DAY_FIRST, undefined, undefined, 'DD/MM/YYYY');

        // Create a date from a string
        test.addStep('Creating a set of dates with day first and 18:00...');
        const dayFirst1800 = CoreTester.#formatDates(CoreTester.JAN2_2000_1800_DAY_FIRST, undefined, undefined, 'DD/MM/YYYY HH:mm');

        // Create a date from a string
        test.addStep('Creating a set of dates with day first and AM/PM string...');
        const dayFirst6PM = CoreTester.#formatDates(CoreTester.JAN2_2000_6PM_DAY_FIRST, undefined, undefined, 'DD/MM/YYYY H:mm A');

        return [dayFirstNoTime, dayFirst1800, dayFirst6PM];
      },
      (test, result) => {
        // Perform assertions
        const [dayFirstNoTime, dayFirst1800, dayFirst6PM] = result;

        test.addStep(`-> Verifying dates with day first no time... ${dayFirstNoTime.input}`);
        CoreTester.#assertDatesFromStringWithoutZ(
          test,
          dayFirstNoTime,
          CoreTester.JAN2_2000_0000_ISO,
          CoreTester.JAN1_2000_1900_ISO,
          CoreTester.JAN2_2000_0500_ISO
        );

        test.addStep(`-> Verifying dates with day first and 18:00... ${dayFirst1800.input}`);
        CoreTester.#assertDatesFromStringWithoutZ(
          test,
          dayFirst1800,
          CoreTester.JAN2_2000_1800_ISO,
          CoreTester.JAN2_2000_1300_ISO,
          CoreTester.JAN2_2000_2300_ISO
        );

        test.addStep(`-> Verifying dates with day first and AM/PM string... ${dayFirst6PM.input}`);
        CoreTester.#assertDatesFromStringWithoutZ(
          test,
          dayFirst6PM,
          CoreTester.JAN2_2000_1800_ISO,
          CoreTester.JAN2_2000_1300_ISO,
          CoreTester.JAN2_2000_2300_ISO
        );
      }
    );
  }

  // #endregion STATIC METHODS PUBLIC

  // #region STATIC METHODS PRIVATE

  /**
   * Formats a single input date across all combinations of:
   * - output timezone (UTC vs America/Toronto)
   * - temporal interpretation (calendar vs instant)
   * - input timezone context (UTC vs America/Toronto)
   * Where:
   * - OutputTZ is the timezone used when formatting the date
   * - TemporalMode indicates whether the date is interpreted as a
   *   calendar date (timezone-invariant) or an instant (timezone-aware)
   * - InputTZ is the timezone context the input date is read from
   * This helper is used by test cases to exhaustively validate that date parsing
   * and formatting semantics behave correctly for all supported combinations,
   * and that calendar dates do not shift due to timezone conversions.
   *
   * @param date - Input date value to format (string, number, or Date)
   * @param outputFormat - Output format string passed to
   * `formatDate`; when undefined, the default ISO format is used
   * @param language - Locale used when formatting
   * the date; when undefined, the default locale is 'en'
   * @param inputFormat - Optional input format used when
   * parsing string dates
   * @returns Object containing the formatted date values for every
   * output timezone / temporal mode / input timezone combination, plus the
   * original input string
   */
  static #formatDates(
    date: DateLike,
    outputFormat: string | undefined,
    language: TypeDisplayLanguage | undefined,
    inputFormat: string | undefined
  ): DatesSet {
    // Create a date from a string

    // The input
    const input = date.toString();

    // Step Epoch timestamps
    const dateUTCCalendarUTC = DateMgt.formatDate(
      date,
      outputFormat,
      language,
      undefined, // UTC
      'calendar',
      inputFormat, // inputFormat
      undefined // inputTimezone
    );

    const dateUTCCalendarToronto = DateMgt.formatDate(
      date,
      outputFormat,
      language,
      undefined, // UTC
      'calendar',
      inputFormat, // inputFormat
      CoreTester.TorontoIANA
    );

    const dateTorontoCalendarUTC = DateMgt.formatDate(
      date,
      outputFormat,
      language,
      CoreTester.TorontoIANA,
      'calendar',
      inputFormat, // inputFormat
      undefined // inputTimezone
    );

    const dateTorontoCalendarToronto = DateMgt.formatDate(
      date,
      outputFormat,
      language,
      CoreTester.TorontoIANA,
      'calendar',
      inputFormat, // inputFormat
      CoreTester.TorontoIANA
    );

    const dateUTCInstantUTC = DateMgt.formatDate(
      date,
      outputFormat,
      language,
      undefined, // UTC
      'instant',
      inputFormat, // inputFormat
      undefined // inputTimezone
    );

    const dateUTCInstantToronto = DateMgt.formatDate(
      date,
      outputFormat,
      language,
      undefined, // UTC
      'instant',
      inputFormat, // inputFormat
      CoreTester.TorontoIANA
    );

    const dateTorontoInstantUTC = DateMgt.formatDate(
      date,
      outputFormat,
      language,
      CoreTester.TorontoIANA,
      'instant',
      inputFormat, // inputFormat
      undefined // inputTimezone
    );

    const dateTorontoInstantToronto = DateMgt.formatDate(
      date,
      outputFormat,
      language,
      CoreTester.TorontoIANA,
      'instant',
      inputFormat, // inputFormat
      CoreTester.TorontoIANA
    );

    // Return the dates
    return {
      input,
      dateUTCCalendarUTC,
      dateUTCCalendarToronto,
      dateTorontoCalendarUTC,
      dateTorontoCalendarToronto,
      dateUTCInstantUTC,
      dateUTCInstantToronto,
      dateTorontoInstantUTC,
      dateTorontoInstantToronto,
    };
  }

  /**
   * Asserts expected date outputs when parsing epoch values, actual Dates or ISO date strings
   * that include an explicit UTC timezone indicator (`Z`).
   *
   * In this scenario:
   * - The input represents an absolute instant in UTC.
   * - Calendar temporal mode must ignore timezone context and preserve the
   *   calendar day as-is.
   * - Instant temporal mode must respect timezone conversion when formatting,
   *   which may shift the rendered calendar day depending on the output timezone.
   * The two expected values represent:
   * - dateUTC: the canonical UTC calendar day derived from the instant
   * - dateToronto: the formatted date when the instant is rendered in
   *   America/Toronto, potentially resulting in a previous calendar day
   *
   * @param test - Test instance used to record assertion steps
   * @param result - Map of actual formatted date outputs,
   * keyed by scenario name
   * @param dateUTC - Expected formatted date when the output timezone is
   * UTC (calendar mode and instant mode without timezone-induced shift)
   * @param dateBefore - Expected formatted date when the output timezone
   * is America/Toronto in instant mode, where the instant may resolve to an
   * earlier calendar day
   */
  static #assertDatesFromEpochDatesStringWithTZ(test: Test, result: DatesSet, dateUTC: string, dateBefore: string): void {
    CoreTester.#assertDates(
      test,
      result,
      dateUTC, // UTC read from UTC, calendar mode => using UTC value as-is
      dateUTC, // UTC read from Toronto, calendar mode => using UTC value as-is
      dateUTC, // Toronto read from UTC, calendar mode => using UTC value as-is
      dateUTC, // Toronto read from Toronto, calendar mode => using UTC value as-is
      dateUTC, // UTC read from UTC, instant mode => using UTC value as-is
      dateUTC, // UTC read from Toronto, instant mode => Toronto ignored because of epoch/date inherent UTC timezone
      dateBefore, // Toronto read from UTC, instant mode => earlier, the day before
      dateBefore // Toronto read from Toronto, instant mode => Toronto ignored because of epoch/date inherent UTC timezone
    );
  }

  /**
   * Asserts expected date outputs when parsing a date-time string **without**
   * an explicit timezone indicator. Coming from Epoch timestamp, actual Date or string without trailing `Z` or offset tz.
   *
   * In this scenario:
   * - Calendar temporal mode must treat the input as a pure calendar day,
   *   producing the same output regardless of input or output timezone.
   * - Instant temporal mode must interpret the input as originating from the
   *   provided input timezone, which may shift the rendered date earlier or
   *   later depending on the output timezone.
   * The three expected values represent:
   * - dateUTC: the canonical calendar-day result (no shift)
   * - dateBefore: the instant result when the timezone conversion moves the
   *   instant to an earlier civil date
   * - dateLater: the instant result when the timezone conversion moves the
   *   instant to a later civil date
   *
   * @param test - Test instance used to record assertion steps
   * @param result - Map of actual formatted date outputs,
   * keyed by scenario name
   * @param dateUTC - Expected formatted date when no day-shift occurs
   * (calendar mode, or instant mode without timezone-induced change)
   * @param dateBefore - Expected formatted date when instant-mode
   * conversion shifts the result to an earlier day
   * @param dateLater - Expected formatted date when instant-mode
   * conversion shifts the result to a later day
   */
  static #assertDatesFromStringWithoutZ(test: Test, result: DatesSet, dateUTC: string, dateBefore: string, dateLater: string): void {
    CoreTester.#assertDates(
      test,
      result,
      dateUTC, // UTC read from UTC, calendar mode => using UTC value as-is
      dateUTC, // UTC read from Toronto, calendar mode => using UTC value as-is
      dateUTC, // Toronto read from UTC, calendar mode => using UTC value as-is
      dateUTC, // Toronto read from Toronto, calendar mode => using UTC value as-is
      dateUTC, // UTC read from UTC, instant mode => using UTC value as-is
      dateLater, // UTC read from Toronto, instant mode => later, the same day or day after
      dateBefore, // Toronto read from UTC, instant mode => earlier, the same day or day before
      dateUTC // Toronto read from Toronto, instant mode => day as-is
    );
  }

  /**
   * Asserts formatted date outputs for all combinations of:
   * - output timezone
   * - temporal interpretation (calendar vs instant)
   * - input timezone
   * Where:
   * - OutputTZ is the timezone used when formatting the date
   *   (e.g. UTC, Toronto)
   * - TemporalMode indicates whether the date is interpreted as a
   *   calendar date (timezone-invariant) or an instant (timezone-aware)
   * - InputTZ is the timezone context the original date is read from
   * Example:
   *   dateTorontoCalendarUTC
   *   → date formatted in America/Toronto,
   *     interpreted as a calendar date,
   *     read as originating from UTC
   *
   * @param test - Test instance used to record assertion steps
   * @param result - Map of actual formatted date outputs, keyed by scenario name
   * @param dateUTCCalendarUTC - Expected value when formatting in UTC, using
   * calendar semantics, with the input date originating from UTC
   * @param dateUTCCalendarToronto - Expected value when formatting in UTC, using
   * calendar semantics, with the input date originating from America/Toronto
   * @param dateTorontoCalendarUTC - Expected value when formatting in
   * America/Toronto, using calendar semantics, with the input date
   * originating from UTC
   * @param dateTorontoCalendarToronto - Expected value when formatting in
   * America/Toronto, using calendar semantics, with the input date
   * originating from America/Toronto
   * @param dateUTCInstantUTC - Expected value when formatting in UTC, using
   * instant semantics, with the input date originating from UTC
   * @param dateUTCInstantToronto - Expected value when formatting in UTC, using
   * instant semantics, with the input date originating from America/Toronto
   * @param dateTorontoInstantUTC - Expected value when formatting in
   * America/Toronto, using instant semantics, with the input date
   * originating from UTC
   * @param dateTorontoInstantToronto - Expected value when formatting in
   * America/Toronto, using instant semantics, with the input date
   * originating from America/Toronto
   */
  static #assertDates(
    test: Test,
    result: DatesSet,
    dateUTCCalendarUTC: string,
    dateUTCCalendarToronto: string,
    dateTorontoCalendarUTC: string,
    dateTorontoCalendarToronto: string,
    dateUTCInstantUTC: string,
    dateUTCInstantToronto: string,
    dateTorontoInstantUTC: string,
    dateTorontoInstantToronto: string
  ): void {
    // Check
    test.addStep(`Verifying dateUTCCalendarUTC... ${dateUTCCalendarUTC}`);
    Test.assertIsEqual(result.dateUTCCalendarUTC, dateUTCCalendarUTC);

    // Check
    test.addStep(`Verifying dateUTCCalendarToronto... ${dateUTCCalendarToronto}`);
    Test.assertIsEqual(result.dateUTCCalendarToronto, dateUTCCalendarToronto);

    // Check
    test.addStep(`Verifying dateTorontoCalendarUTC... ${dateTorontoCalendarUTC}`);
    Test.assertIsEqual(result.dateTorontoCalendarUTC, dateTorontoCalendarUTC);

    // Check
    test.addStep(`Verifying dateTorontoCalendarToronto... ${dateTorontoCalendarToronto}`);
    Test.assertIsEqual(result.dateTorontoCalendarToronto, dateTorontoCalendarToronto);

    // Check
    test.addStep(`Verifying dateUTCInstantUTC... ${dateUTCInstantUTC}`);
    Test.assertIsEqual(result.dateUTCInstantUTC, dateUTCInstantUTC);

    // Check
    test.addStep(`Verifying dateUTCInstantToronto... ${dateUTCInstantToronto}`);
    Test.assertIsEqual(result.dateUTCInstantToronto, dateUTCInstantToronto);

    // Check
    test.addStep(`Verifying dateTorontoInstantUTC... ${dateTorontoInstantUTC}`);
    Test.assertIsEqual(result.dateTorontoInstantUTC, dateTorontoInstantUTC);

    // Check
    test.addStep(`Verifying dateTorontoInstantToronto... ${dateTorontoInstantToronto}`);
    Test.assertIsEqual(result.dateTorontoInstantToronto, dateTorontoInstantToronto);
  }

  // #endregion STATIC METHODS PRIVATE
}

/**
 * Holds a set of formatted date results.
 */
type DatesSet = {
  input: string;
  dateUTCCalendarUTC: string;
  dateUTCCalendarToronto: string;
  dateTorontoCalendarUTC: string;
  dateTorontoCalendarToronto: string;
  dateUTCInstantUTC: string;
  dateUTCInstantToronto: string;
  dateTorontoInstantUTC: string;
  dateTorontoInstantToronto: string;
};
