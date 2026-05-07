import type { DateLike } from 'geoview-core/core/utils/date-mgt';
import { DateMgt } from 'geoview-core/core/utils/date-mgt';
import type { TypeDisplayLanguage } from 'geoview-core/api/types/map-schema-types';

import { Test } from '../core/test';
import { GVAbstractTester } from './abstract-gv-tester';

/**
 * Date utilities testing class for cgpv.api.utilities.date (DateMgt) functions.
 */
export class UtilitiesDateTester extends GVAbstractTester {
  // #region STATIC DATE CONSTANTS

  /** The epoch for new year 2000 midnight */
  static readonly JAN1_2000_EPOCH = 946684800000; // 2000-01-01 00:00:00 UTC
  /** The date object for new year 2000 midnight */
  static readonly JAN1_2000_DATE = new Date(UtilitiesDateTester.JAN1_2000_EPOCH);
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

  // #endregion STATIC DATE CONSTANTS

  /**
   * Returns the name of the Tester.
   *
   * @returns The name of the Tester
   */
  override getName(): string {
    return 'UtilitiesDateTester';
  }

  // #region formatDate()

  /**
   * Tests DateMgt.formatDate() formats dates correctly.
   *
   * @returns A promise that resolves when the test completes
   */
  testFormatDate(): Promise<Test<string[]>> {
    return this.test(
      'Test DateMgt.formatDate() formats dates...',
      (test) => {
        test.addStep('Formatting dates with various formats...');
        return [
          DateMgt.formatDate('2024-06-15T12:30:00Z', 'YYYY-MM-DD', 'en'),
          DateMgt.formatDate('2024-06-15T12:30:00Z', 'DD/MM/YYYY', 'fr'),
          DateMgt.formatDate(new Date('2024-01-01T00:00:00Z'), 'YYYY', 'en'),
          DateMgt.formatDate(946684800000, 'YYYY-MM-DD', 'en'),
          DateMgt.formatDate('2026-02-20', 'll', 'en'),
          DateMgt.formatDate('2026-02-20', 'll', 'fr'),
        ];
      },
      (test, results) => {
        test.addStep('Verifying ISO date format...');
        Test.assertIsEqual(results[0], '2024-06-15');

        test.addStep('Verifying French date format...');
        Test.assertIsEqual(results[1], '15/06/2024');

        test.addStep('Verifying year-only format from Date object...');
        Test.assertIsEqual(results[2], '2024');

        test.addStep('Verifying format from epoch number...');
        Test.assertIsEqual(results[3], '2000-01-01');

        test.addStep('Verifying short localized date in English...');
        Test.assertIsEqual(results[4], 'Feb 20, 2026');

        test.addStep('Verifying short localized date in French...');
        Test.assertIsEqual(results[5], '20 févr. 2026');
      }
    );
  }

  // #endregion

  // #region formatDateISOShort()

  /**
   * Tests DateMgt.formatDateISOShort() returns short ISO format.
   *
   * @returns A promise that resolves when the test completes
   */
  testFormatDateISOShort(): Promise<Test<string[]>> {
    return this.test(
      'Test DateMgt.formatDateISOShort() returns short ISO...',
      (test) => {
        test.addStep('Formatting dates to short ISO...');
        return [DateMgt.formatDateISOShort('2024-06-15T12:30:00Z'), DateMgt.formatDateISOShort(946684800000)];
      },
      (test, results) => {
        test.addStep('Verifying ISO short format from string...');
        Test.assertIsEqual(results[0].startsWith('2024-06-15'), true);

        test.addStep('Verifying ISO short format from epoch...');
        Test.assertIsEqual(results[1].startsWith('2000-01-01'), true);
      }
    );
  }

  // #endregion

  // #region convertToMilliseconds()

  /**
   * Tests DateMgt.convertToMilliseconds() converts dates to epoch.
   *
   * @returns A promise that resolves when the test completes
   */
  testConvertToMilliseconds(): Promise<Test<number[]>> {
    return this.test(
      'Test DateMgt.convertToMilliseconds() converts to epoch...',
      (test) => {
        test.addStep('Converting dates to milliseconds...');
        return [
          DateMgt.convertToMilliseconds('2000-01-01T00:00:00Z'),
          DateMgt.convertToMilliseconds(new Date('2000-01-01T00:00:00Z')),
          DateMgt.convertToMilliseconds(946684800000),
        ];
      },
      (test, results) => {
        test.addStep('Verifying epoch from ISO string...');
        Test.assertIsEqual(results[0], 946684800000);

        test.addStep('Verifying epoch from Date object...');
        Test.assertIsEqual(results[1], 946684800000);

        test.addStep('Verifying epoch from number passes through...');
        Test.assertIsEqual(results[2], 946684800000);
      }
    );
  }

  // #endregion

  // #region tryParseDate()

  /**
   * Tests DateMgt.tryParseDate() parses valid dates and rejects invalid.
   *
   * @returns A promise that resolves when the test completes
   */
  testTryParseDate(): Promise<Test<(Date | undefined)[]>> {
    return this.test(
      'Test DateMgt.tryParseDate() parses valid dates...',
      (test) => {
        test.addStep('Parsing various date strings...');
        return [
          DateMgt.tryParseDate('2024-06-15'),
          DateMgt.tryParseDate('2024-06-15T12:30:00Z'),
          DateMgt.tryParseDate('not-a-date'),
          DateMgt.tryParseDate(''),
        ];
      },
      (test, results) => {
        test.addStep('Verifying valid date parsed...');
        Test.assertIsDefined('isoDate', results[0]);

        test.addStep('Verifying ISO datetime parsed...');
        Test.assertIsDefined('isoDatetime', results[1]);

        test.addStep('Verifying invalid string returns undefined...');
        Test.assertIsUndefined('invalidDate', results[2]);

        test.addStep('Verifying empty string returns undefined...');
        Test.assertIsUndefined('emptyDate', results[3]);
      }
    );
  }

  // #endregion

  // #region hasTimeComponents()

  /**
   * Tests DateMgt.hasTimeComponents() detects time tokens.
   *
   * @returns A promise that resolves when the test completes
   */
  testHasTimeComponents(): Promise<Test<boolean[]>> {
    return this.test(
      'Test DateMgt.hasTimeComponents() detects time tokens...',
      (test) => {
        test.addStep('Checking format strings for time components...');
        return [
          DateMgt.hasTimeComponents('YYYY-MM-DD'),
          DateMgt.hasTimeComponents('YYYY-MM-DDTHH:mm:ss'),
          DateMgt.hasTimeComponents('HH:mm'),
          DateMgt.hasTimeComponents(undefined),
        ];
      },
      (test, results) => {
        test.addStep('Verifying date-only format has no time...');
        Test.assertIsEqual(results[0], false);

        test.addStep('Verifying datetime format has time...');
        Test.assertIsEqual(results[1], true);

        test.addStep('Verifying time-only format has time...');
        Test.assertIsEqual(results[2], true);

        test.addStep('Verifying undefined returns false...');
        Test.assertIsEqual(results[3], false);
      }
    );
  }

  // #endregion

  // #region isValidTimezone()

  /**
   * Tests DateMgt.isValidTimezone() validates timezone strings.
   *
   * @returns A promise that resolves when the test completes
   */
  testIsValidTimezone(): Promise<Test<boolean[]>> {
    return this.test(
      'Test DateMgt.isValidTimezone() validates timezones...',
      (test) => {
        test.addStep('Checking timezone strings...');
        return [
          DateMgt.isValidTimezone('UTC'),
          DateMgt.isValidTimezone('America/Toronto'),
          DateMgt.isValidTimezone('Europe/Paris'),
          DateMgt.isValidTimezone('local'),
          DateMgt.isValidTimezone('Invalid/Timezone'),
        ];
      },
      (test, results) => {
        test.addStep('Verifying UTC is valid...');
        Test.assertIsEqual(results[0], true);

        test.addStep('Verifying America/Toronto is valid...');
        Test.assertIsEqual(results[1], true);

        test.addStep('Verifying Europe/Paris is valid...');
        Test.assertIsEqual(results[2], true);

        test.addStep('Verifying local is valid...');
        Test.assertIsEqual(results[3], true);

        test.addStep('Verifying invalid timezone is rejected...');
        Test.assertIsEqual(results[4], false);
      }
    );
  }

  // #endregion

  // #region createRangeOGC()

  /**
   * Tests DateMgt.createRangeOGC() parses OGC time dimension values.
   *
   * @returns A promise that resolves when the test completes
   */
  testCreateRangeOGC(): Promise<Test<{ type: string; range: string[] }[]>> {
    return this.test(
      'Test DateMgt.createRangeOGC() parses OGC time values...',
      (test) => {
        test.addStep('Parsing OGC time dimension strings...');
        // Discrete range (comma-separated)
        const discrete = DateMgt.createRangeOGC('2020-01-01,2020-06-01,2021-01-01');
        // Relative range (start/end)
        const relative = DateMgt.createRangeOGC('2020-01-01/2021-01-01');
        return [discrete, relative];
      },
      (test, results) => {
        test.addStep('Verifying discrete range parsed...');
        Test.assertIsEqual(results[0].type, 'discrete');
        Test.assertIsArrayLengthEqual(results[0].range, 3);
        Test.assertIsEqual(results[0].range[0], '2020-01-01');

        test.addStep('Verifying relative range parsed...');
        Test.assertIsEqual(results[1].type, 'relative');
        Test.assertIsArrayLengthMinimal(results[1].range, 2);
      }
    );
  }

  // #endregion

  // #region Constants

  /**
   * Tests DateMgt static constants are defined.
   *
   * @returns A promise that resolves when the test completes
   */
  testDateConstants(): Promise<Test<boolean>> {
    return this.test(
      'Test DateMgt static constants are defined...',
      (test) => {
        test.addStep('Checking static constants...');
        return true;
      },
      (test) => {
        test.addStep('Verifying ISO_DATE_FORMAT...');
        Test.assertIsDefined('ISO_DATE_FORMAT', DateMgt.ISO_DATE_FORMAT);
        Test.assertIsEqual(typeof DateMgt.ISO_DATE_FORMAT, 'string');

        test.addStep('Verifying ISO_DATETIME_FORMAT_FULL...');
        Test.assertIsDefined('ISO_DATETIME_FORMAT_FULL', DateMgt.ISO_DATETIME_FORMAT_FULL);

        test.addStep('Verifying MILLISECONDS_IN_1_DAY...');
        Test.assertIsEqual(DateMgt.MILLISECONDS_IN_1_DAY, 86400000);

        test.addStep('Verifying MILLISECONDS_IN_1_YEAR...');
        Test.assertIsEqual(DateMgt.MILLISECONDS_IN_1_YEAR, 31536000000);

        test.addStep('Verifying DEFAULT_TEMPORAL_MODE...');
        Test.assertIsDefined('DEFAULT_TEMPORAL_MODE', DateMgt.DEFAULT_TEMPORAL_MODE);
      }
    );
  }

  // #endregion

  // #region parseDateToDayjs()

  /**
   * Tests DateMgt.parseDateToDayjs() parses various date inputs.
   *
   * @returns A promise that resolves when the test completes
   */
  testParseDateToDayjs(): Promise<Test<boolean[]>> {
    return this.test(
      'Test DateMgt.parseDateToDayjs() parses date inputs...',
      (test) => {
        test.addStep('Parsing various date inputs to Dayjs...');
        const fromString = DateMgt.parseDateToDayjs('2024-06-15T12:30:00Z');
        const fromNumber = DateMgt.parseDateToDayjs(946684800000);
        const fromDate = DateMgt.parseDateToDayjs(new Date('2024-01-01T00:00:00Z'));
        return [fromString.isValid(), fromNumber.isValid(), fromDate.isValid()];
      },
      (test, results) => {
        test.addStep('Verifying string parsed to valid Dayjs...');
        Test.assertIsEqual(results[0], true);

        test.addStep('Verifying number parsed to valid Dayjs...');
        Test.assertIsEqual(results[1], true);

        test.addStep('Verifying Date parsed to valid Dayjs...');
        Test.assertIsEqual(results[2], true);
      }
    );
  }

  // #endregion

  // #region formatDate() timezone/temporal matrix

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
        const newYearEpoch = UtilitiesDateTester.#formatDates(UtilitiesDateTester.JAN1_2000_EPOCH, undefined, undefined, undefined);

        test.addStep('Creating a set of dates from dates...');
        const newYearDate = UtilitiesDateTester.#formatDates(UtilitiesDateTester.JAN1_2000_DATE, undefined, undefined, undefined);

        test.addStep('Creating a set of dates from date ISO with Z');
        const datesISOZ = UtilitiesDateTester.#formatDates(UtilitiesDateTester.JAN1_2000_ISO_WITH_Z, undefined, undefined, undefined);

        test.addStep('Creating a set of dates from date ISO with explicit TZ');
        const datesISOExplicitTZ = UtilitiesDateTester.#formatDates(
          UtilitiesDateTester.JAN1_2000_ISO_WITH_EXPLICIT_TIMEZONE,
          undefined,
          undefined,
          undefined
        );

        test.addStep('Creating a set of dates from epoch timestamps with long format...');
        const newYearEpochLongFormat = UtilitiesDateTester.#formatDates(
          UtilitiesDateTester.JAN1_2000_EPOCH,
          'MMMM D, YYYY @ HH:mm',
          'en',
          undefined
        );

        test.addStep('Creating a set of dates from epoch timestamps with long format French...');
        const newYearEpochLongFormatFrench = UtilitiesDateTester.#formatDates(
          UtilitiesDateTester.JAN1_2000_EPOCH,
          'D MMMM, YYYY @ HH:mm',
          'fr',
          undefined
        );

        test.addStep('Creating a set of dates from date ISO with Z with long format...');
        const newYearISOZLongFormat = UtilitiesDateTester.#formatDates(
          UtilitiesDateTester.JAN1_2000_ISO_WITH_Z,
          'MMMM D, YYYY @ HH:mm',
          'en',
          undefined
        );

        test.addStep('Creating a set of dates from date ISO with explicit TZ with long format...');
        const newYearISOExplicitTZLongFormat = UtilitiesDateTester.#formatDates(
          UtilitiesDateTester.JAN1_2000_ISO_WITH_EXPLICIT_TIMEZONE,
          'MMMM D, YYYY @ HH:mm',
          'en',
          undefined
        );

        test.addStep('Creating a set of dates from epoch timestamps with date-only format...');
        const newYearEpochYYYYMMDD = UtilitiesDateTester.#formatDates(
          UtilitiesDateTester.JAN1_2000_EPOCH,
          'YYYY-MM-DD',
          undefined,
          undefined
        );

        test.addStep('Creating a set of dates from dates with date-only format...');
        const newYearDateYYYYMMDD = UtilitiesDateTester.#formatDates(
          UtilitiesDateTester.JAN1_2000_DATE,
          'YYYY-MM-DD',
          undefined,
          undefined
        );

        test.addStep('Creating a set of dates from date ISO with Z with date-only format');
        const datesISOZYYYYMMDD = UtilitiesDateTester.#formatDates(
          UtilitiesDateTester.JAN1_2000_ISO_WITH_Z,
          'YYYY-MM-DD',
          undefined,
          undefined
        );

        test.addStep('Creating a set of dates from date ISO with explicit TZ with date-only format...');
        const newYearISOExplicitTZYYYYMMDD = UtilitiesDateTester.#formatDates(
          UtilitiesDateTester.JAN1_2000_ISO_WITH_EXPLICIT_TIMEZONE,
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
        UtilitiesDateTester.#assertDatesFromEpochDatesStringWithTZ(
          test,
          newYearEpoch,
          UtilitiesDateTester.JAN1_2000_0000_ISO,
          UtilitiesDateTester.JAN1_1999_1900_ISO
        );

        test.addStep(`-> Verifying dates from date object... ${newYearDate.input}`);
        UtilitiesDateTester.#assertDatesFromEpochDatesStringWithTZ(
          test,
          newYearDate,
          UtilitiesDateTester.JAN1_2000_0000_ISO,
          UtilitiesDateTester.JAN1_1999_1900_ISO
        );

        test.addStep(`-> Verifying dates from date ISO with Z... ${datesISOZ.input}`);
        UtilitiesDateTester.#assertDatesFromEpochDatesStringWithTZ(
          test,
          datesISOZ,
          UtilitiesDateTester.JAN1_2000_0000_ISO,
          UtilitiesDateTester.JAN1_1999_1900_ISO
        );

        test.addStep(`-> Verifying dates from date ISO with explicit TZ... ${datesISOExplicitTZ.input}`);
        UtilitiesDateTester.#assertDatesFromEpochDatesStringWithTZ(
          test,
          datesISOExplicitTZ,
          UtilitiesDateTester.JAN1_2000_0000_ISO,
          UtilitiesDateTester.JAN1_1999_1900_ISO
        );

        test.addStep(`-> Verifying dates from epoch timestamps with long output format... ${newYearEpochLongFormat.input}`);
        UtilitiesDateTester.#assertDatesFromEpochDatesStringWithTZ(
          test,
          newYearEpochLongFormat,
          UtilitiesDateTester.JAN1_2000_0000_LONG_EN,
          UtilitiesDateTester.DEC31_1999_1900_LONG_EN
        );

        test.addStep(`-> Verifying dates from epoch timestamps with long output format French... ${newYearEpochLongFormatFrench.input}`);
        UtilitiesDateTester.#assertDatesFromEpochDatesStringWithTZ(
          test,
          newYearEpochLongFormatFrench,
          UtilitiesDateTester.JAN1_2000_0000_LONG_FR,
          UtilitiesDateTester.DEC31_1999_1900_LONG_FR
        );

        test.addStep(`-> Verifying dates from date ISO with Z with long output format... ${newYearISOZLongFormat.input}`);
        UtilitiesDateTester.#assertDatesFromEpochDatesStringWithTZ(
          test,
          newYearISOZLongFormat,
          UtilitiesDateTester.JAN1_2000_0000_LONG_EN,
          UtilitiesDateTester.DEC31_1999_1900_LONG_EN
        );

        test.addStep(
          `-> Verifying dates from date ISO with explicit TZ with long output format... ${newYearISOExplicitTZLongFormat.input}`
        );
        UtilitiesDateTester.#assertDatesFromEpochDatesStringWithTZ(
          test,
          newYearISOExplicitTZLongFormat,
          UtilitiesDateTester.JAN1_2000_0000_LONG_EN,
          UtilitiesDateTester.DEC31_1999_1900_LONG_EN
        );

        test.addStep(`-> Verifying dates from epoch timestamps with YYYY-MM-DD output format... ${newYearEpochYYYYMMDD.input}`);
        UtilitiesDateTester.#assertDatesFromEpochDatesStringWithTZ(
          test,
          newYearEpochYYYYMMDD,
          UtilitiesDateTester.JAN1_2000_YYYYMMDD,
          UtilitiesDateTester.DEC31_1999_YYYYMMDD
        );

        test.addStep(`-> Verifying dates from date object with YYYY-MM-DD output format... ${newYearDateYYYYMMDD.input}`);
        UtilitiesDateTester.#assertDatesFromEpochDatesStringWithTZ(
          test,
          newYearDateYYYYMMDD,
          UtilitiesDateTester.JAN1_2000_YYYYMMDD,
          UtilitiesDateTester.DEC31_1999_YYYYMMDD
        );

        test.addStep(`-> Verifying dates from date ISO with Z with YYYY-MM-DD output format... ${datesISOZYYYYMMDD.input}`);
        UtilitiesDateTester.#assertDatesFromEpochDatesStringWithTZ(
          test,
          datesISOZYYYYMMDD,
          UtilitiesDateTester.JAN1_2000_YYYYMMDD,
          UtilitiesDateTester.DEC31_1999_YYYYMMDD
        );

        test.addStep(
          `-> Verifying dates from date ISO with explicit TZ with YYYY-MM-DD output format... ${newYearISOExplicitTZYYYYMMDD.input}`
        );
        UtilitiesDateTester.#assertDatesFromEpochDatesStringWithTZ(
          test,
          newYearISOExplicitTZYYYYMMDD,
          UtilitiesDateTester.JAN1_2000_YYYYMMDD,
          UtilitiesDateTester.DEC31_1999_YYYYMMDD
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
        const datesNoTime = UtilitiesDateTester.#formatDates(
          UtilitiesDateTester.JAN2_2000_NOTIME_USSTANDARD,
          undefined,
          undefined,
          undefined
        );

        test.addStep('Creating a set of dates from date with time 02:00...');
        const datesWith0200 = UtilitiesDateTester.#formatDates(
          UtilitiesDateTester.JAN2_2000_0200_USSTANDARD,
          undefined,
          undefined,
          undefined
        );

        test.addStep('Creating a set of dates from date with time 10:00...');
        const datesWith1000 = UtilitiesDateTester.#formatDates(
          UtilitiesDateTester.JAN2_2000_1000_USSTANDARD,
          undefined,
          undefined,
          undefined
        );

        test.addStep('Creating a set of dates from date with time 6:00 PM...');
        const datesWith6PM = UtilitiesDateTester.#formatDates(
          UtilitiesDateTester.JAN2_2000_6PM_USSTANDARD,
          undefined,
          undefined,
          undefined
        );

        test.addStep('Creating a set of dates from date with time 23:00...');
        const datesWith2300 = UtilitiesDateTester.#formatDates(
          UtilitiesDateTester.JAN2_2000_2300_USSTANDARD,
          undefined,
          undefined,
          undefined
        );

        test.addStep('Creating a set of dates from date without time with long format...');
        const datesNoTimeLongFormat = UtilitiesDateTester.#formatDates(
          UtilitiesDateTester.JAN2_2000_NOTIME_USSTANDARD,
          'MMMM D, YYYY @ HH:mm',
          'en',
          undefined
        );

        test.addStep('Creating a set of dates from date without time with long format French...');
        const datesNoTimeLongFormatFrench = UtilitiesDateTester.#formatDates(
          UtilitiesDateTester.JAN2_2000_NOTIME_USSTANDARD,
          'D MMMM, YYYY @ HH:mm',
          'fr',
          undefined
        );

        test.addStep('Creating a set of dates from date with time with long format...');
        const datesWith0200LongFormat = UtilitiesDateTester.#formatDates(
          UtilitiesDateTester.JAN2_2000_0200_USSTANDARD,
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
        UtilitiesDateTester.#assertDatesFromStringWithoutZ(
          test,
          datesNoTime,
          UtilitiesDateTester.JAN2_2000_0000_ISO,
          UtilitiesDateTester.JAN1_2000_1900_ISO,
          UtilitiesDateTester.JAN2_2000_0500_ISO
        );

        // Redirect
        test.addStep(`-> Verifying dates from date 02:00... ${datesWith0200.input}`);
        UtilitiesDateTester.#assertDatesFromStringWithoutZ(
          test,
          datesWith0200,
          UtilitiesDateTester.JAN2_2000_0200_ISO,
          UtilitiesDateTester.JAN1_2000_2100_ISO,
          UtilitiesDateTester.JAN2_2000_0700_ISO
        );

        // Redirect
        test.addStep(`-> Verifying dates from date 10:00... ${datesWith1000.input}`);
        UtilitiesDateTester.#assertDatesFromStringWithoutZ(
          test,
          datesWith1000,
          UtilitiesDateTester.JAN2_2000_1000_ISO,
          UtilitiesDateTester.JAN2_2000_0500_ISO,
          UtilitiesDateTester.JAN2_2000_1500_ISO
        );

        // Redirect
        test.addStep(`-> Verifying dates from date 18:00... ${datesWith6PM.input}`);
        UtilitiesDateTester.#assertDatesFromStringWithoutZ(
          test,
          datesWith6PM,
          UtilitiesDateTester.JAN2_2000_1800_ISO,
          UtilitiesDateTester.JAN2_2000_1300_ISO,
          UtilitiesDateTester.JAN2_2000_2300_ISO
        );

        // Redirect
        test.addStep(`-> Verifying dates from date 23:00... ${datesWith2300.input}`);
        UtilitiesDateTester.#assertDatesFromStringWithoutZ(
          test,
          datesWith2300,
          UtilitiesDateTester.JAN2_2000_2300_ISO,
          UtilitiesDateTester.JAN2_2000_1800_ISO,
          UtilitiesDateTester.JAN3_2000_0400_ISO
        );

        // Redirect
        test.addStep(`-> Verifying dates from date no time long format... ${datesNoTimeLongFormat.input}`);
        UtilitiesDateTester.#assertDatesFromStringWithoutZ(
          test,
          datesNoTimeLongFormat,
          UtilitiesDateTester.JAN2_2000_0000_LONG_EN,
          UtilitiesDateTester.JAN1_2000_1900_LONG_EN,
          UtilitiesDateTester.JAN2_2000_0500_LONG_EN
        );

        // Redirect
        test.addStep(`-> Verifying dates from date no time long format French... ${datesNoTimeLongFormatFrench.input}`);
        UtilitiesDateTester.#assertDatesFromStringWithoutZ(
          test,
          datesNoTimeLongFormatFrench,
          UtilitiesDateTester.JAN2_2000_0000_LONG_FR,
          UtilitiesDateTester.JAN1_2000_1900_LONG_FR,
          UtilitiesDateTester.JAN2_2000_0500_LONG_FR
        );

        // Redirect
        test.addStep(`-> Verifying dates from date with time long format... ${datesWith0200LongFormat.input}`);
        UtilitiesDateTester.#assertDatesFromStringWithoutZ(
          test,
          datesWith0200LongFormat,
          UtilitiesDateTester.JAN2_2000_0200_LONG_EN,
          UtilitiesDateTester.JAN1_2000_2100_LONG_EN,
          UtilitiesDateTester.JAN2_2000_0700_LONG_EN
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
        const dayFirstNoTime = UtilitiesDateTester.#formatDates(
          UtilitiesDateTester.JAN2_2000_NOTIME_DAY_FIRST,
          undefined,
          undefined,
          'DD/MM/YYYY'
        );

        // Create a date from a string
        test.addStep('Creating a set of dates with day first and 18:00...');
        const dayFirst1800 = UtilitiesDateTester.#formatDates(
          UtilitiesDateTester.JAN2_2000_1800_DAY_FIRST,
          undefined,
          undefined,
          'DD/MM/YYYY HH:mm'
        );

        // Create a date from a string
        test.addStep('Creating a set of dates with day first and AM/PM string...');
        const dayFirst6PM = UtilitiesDateTester.#formatDates(
          UtilitiesDateTester.JAN2_2000_6PM_DAY_FIRST,
          undefined,
          undefined,
          'DD/MM/YYYY H:mm A'
        );

        return [dayFirstNoTime, dayFirst1800, dayFirst6PM];
      },
      (test, result) => {
        // Perform assertions
        const [dayFirstNoTime, dayFirst1800, dayFirst6PM] = result;

        test.addStep(`-> Verifying dates with day first no time... ${dayFirstNoTime.input}`);
        UtilitiesDateTester.#assertDatesFromStringWithoutZ(
          test,
          dayFirstNoTime,
          UtilitiesDateTester.JAN2_2000_0000_ISO,
          UtilitiesDateTester.JAN1_2000_1900_ISO,
          UtilitiesDateTester.JAN2_2000_0500_ISO
        );

        test.addStep(`-> Verifying dates with day first and 18:00... ${dayFirst1800.input}`);
        UtilitiesDateTester.#assertDatesFromStringWithoutZ(
          test,
          dayFirst1800,
          UtilitiesDateTester.JAN2_2000_1800_ISO,
          UtilitiesDateTester.JAN2_2000_1300_ISO,
          UtilitiesDateTester.JAN2_2000_2300_ISO
        );

        test.addStep(`-> Verifying dates with day first and AM/PM string... ${dayFirst6PM.input}`);
        UtilitiesDateTester.#assertDatesFromStringWithoutZ(
          test,
          dayFirst6PM,
          UtilitiesDateTester.JAN2_2000_1800_ISO,
          UtilitiesDateTester.JAN2_2000_1300_ISO,
          UtilitiesDateTester.JAN2_2000_2300_ISO
        );
      }
    );
  }

  // #endregion

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
      UtilitiesDateTester.TorontoIANA
    );

    const dateTorontoCalendarUTC = DateMgt.formatDate(
      date,
      outputFormat,
      language,
      UtilitiesDateTester.TorontoIANA,
      'calendar',
      inputFormat, // inputFormat
      undefined // inputTimezone
    );

    const dateTorontoCalendarToronto = DateMgt.formatDate(
      date,
      outputFormat,
      language,
      UtilitiesDateTester.TorontoIANA,
      'calendar',
      inputFormat, // inputFormat
      UtilitiesDateTester.TorontoIANA
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
      UtilitiesDateTester.TorontoIANA
    );

    const dateTorontoInstantUTC = DateMgt.formatDate(
      date,
      outputFormat,
      language,
      UtilitiesDateTester.TorontoIANA,
      'instant',
      inputFormat, // inputFormat
      undefined // inputTimezone
    );

    const dateTorontoInstantToronto = DateMgt.formatDate(
      date,
      outputFormat,
      language,
      UtilitiesDateTester.TorontoIANA,
      'instant',
      inputFormat, // inputFormat
      UtilitiesDateTester.TorontoIANA
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
    UtilitiesDateTester.#assertDates(
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
    UtilitiesDateTester.#assertDates(
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
  /** The original input string. */
  input: string;
  /** Formatted in UTC, calendar mode, input from UTC. */
  dateUTCCalendarUTC: string;
  /** Formatted in UTC, calendar mode, input from Toronto. */
  dateUTCCalendarToronto: string;
  /** Formatted in Toronto, calendar mode, input from UTC. */
  dateTorontoCalendarUTC: string;
  /** Formatted in Toronto, calendar mode, input from Toronto. */
  dateTorontoCalendarToronto: string;
  /** Formatted in UTC, instant mode, input from UTC. */
  dateUTCInstantUTC: string;
  /** Formatted in UTC, instant mode, input from Toronto. */
  dateUTCInstantToronto: string;
  /** Formatted in Toronto, instant mode, input from UTC. */
  dateTorontoInstantUTC: string;
  /** Formatted in Toronto, instant mode, input from Toronto. */
  dateTorontoInstantToronto: string;
};
