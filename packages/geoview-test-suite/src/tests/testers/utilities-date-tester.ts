import { DateMgt } from 'geoview-core/core/utils/date-mgt';

import { Test } from '../core/test';
import { GVAbstractTester } from './abstract-gv-tester';

/**
 * Date utilities testing class for cgpv.api.utilities.date (DateMgt) functions.
 */
export class UtilitiesDateTester extends GVAbstractTester {
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
}
