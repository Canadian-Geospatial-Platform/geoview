import {
  range,
  camelCase,
  deepEqual,
  deepClone,
  deepMerge,
  deepMergeObjects,
  isNumeric,
  isObjectEmpty,
  generateId,
  isValidUUID,
  setAlphaColor,
  isJsonString,
  removeCommentsFromJSON,
  parseJSONConfig,
  escapeRegExp,
  isImage,
  shallowObjectEqual,
  shallowArrayEqual,
  stringify,
  safeStringify,
  findPropertyByRegexPath,
  formatMeasurementValue,
  formatLength,
  formatArea,
  normalizeDatacubeAccessPath,
  sanitizeHtmlContent,
  enhanceLinksAccessibility,
  getLocalizedMessage,
} from 'geoview-core/core/utils/utilities';

import { Test } from '../core/test';
import { GVAbstractTester } from './abstract-gv-tester';

/**
 * Main Utilities Core testing class for cgpv.api.utilities.core functions.
 */
export class UtilitiesCoreTester extends GVAbstractTester {
  /**
   * Returns the name of the Tester.
   *
   * @returns The name of the Tester
   */
  override getName(): string {
    return 'UtilitiesCoreTester';
  }

  // #region range()

  /**
   * Tests range() generates correct number sequences.
   *
   * @returns A promise that resolves when the test completes
   */
  testRange(): Promise<Test<number[][]>> {
    return this.test(
      'Test range() generates correct sequences...',
      (test) => {
        test.addStep('Calling range with various inputs...');
        const results: number[][] = [];
        results.push(range(0, 5));
        results.push(range(1, 4));
        results.push(range(0, 10, 2));
        results.push(range(0, 0));
        results.push(range(5, 5));
        return results;
      },
      (test, results) => {
        test.addStep('Verifying range(0, 5)...');
        Test.assertIsArrayEqual(results[0], [0, 1, 2, 3, 4]);

        test.addStep('Verifying range(1, 4)...');
        Test.assertIsArrayEqual(results[1], [1, 2, 3]);

        test.addStep('Verifying range(0, 10, 2)...');
        Test.assertIsArrayEqual(results[2], [0, 2, 4, 6, 8]);

        test.addStep('Verifying range(0, 0) returns empty...');
        Test.assertIsArrayLengthEqual(results[3], 0);

        test.addStep('Verifying range(5, 5) returns empty...');
        Test.assertIsArrayLengthEqual(results[4], 0);
      }
    );
  }

  // #endregion

  // #region camelCase()

  /**
   * Tests camelCase() converts strings correctly.
   *
   * @returns A promise that resolves when the test completes
   */
  testCamelCase(): Promise<Test<string[]>> {
    return this.test(
      'Test camelCase() converts strings...',
      (test) => {
        test.addStep('Calling camelCase with various inputs...');
        return [camelCase('hello-world'), camelCase('my_variable_name'), camelCase('UPPER-CASE'), camelCase('already'), camelCase('')];
      },
      (test, results) => {
        test.addStep('Verifying hello-world → helloWorld...');
        Test.assertIsEqual(results[0], 'helloWorld');

        test.addStep('Verifying my_variable_name → myVariableName...');
        Test.assertIsEqual(results[1], 'myVariableName');

        test.addStep('Verifying UPPER-CASE → upperCase...');
        Test.assertIsEqual(results[2], 'upperCase');

        test.addStep('Verifying single word stays unchanged...');
        Test.assertIsEqual(results[3], 'already');

        test.addStep('Verifying empty string stays empty...');
        Test.assertIsEqual(results[4], '');
      }
    );
  }

  // #endregion

  // #region deepEqual()

  /**
   * Tests deepEqual() compares objects and primitives correctly.
   *
   * @returns A promise that resolves when the test completes
   */
  testDeepEqual(): Promise<Test<boolean[]>> {
    return this.test(
      'Test deepEqual() compares values...',
      (test) => {
        test.addStep('Calling deepEqual with various inputs...');
        const objA = { a: 1, b: { c: 2 } };
        const objB = { a: 1, b: { c: 2 } };
        const objC = { a: 1, b: { c: 3 } };
        const arrA = [1, 2, [3, 4]];
        const arrB = [1, 2, [3, 4]];
        const arrC = [1, 2, [3, 5]];

        return [
          deepEqual(objA, objB),
          deepEqual(objA, objC),
          deepEqual(arrA, arrB),
          deepEqual(arrA, arrC),
          deepEqual(42, 42),
          deepEqual('hello', 'hello'),
          deepEqual(null, null),
          deepEqual(null, undefined),
        ];
      },
      (test, results) => {
        test.addStep('Verifying identical nested objects are equal...');
        Test.assertIsEqual(results[0], true);

        test.addStep('Verifying different nested objects are not equal...');
        Test.assertIsEqual(results[1], false);

        test.addStep('Verifying identical nested arrays are equal...');
        Test.assertIsEqual(results[2], true);

        test.addStep('Verifying different nested arrays are not equal...');
        Test.assertIsEqual(results[3], false);

        test.addStep('Verifying equal primitives...');
        Test.assertIsEqual(results[4], true);
        Test.assertIsEqual(results[5], true);

        test.addStep('Verifying null equals null...');
        Test.assertIsEqual(results[6], true);

        test.addStep('Verifying null does not equal undefined...');
        Test.assertIsEqual(results[7], false);
      }
    );
  }

  // #endregion

  // #region deepClone()

  /**
   * Tests deepClone() creates independent copies.
   *
   * @returns A promise that resolves when the test completes
   */
  testDeepClone(): Promise<Test<boolean>> {
    return this.test(
      'Test deepClone() creates independent copies...',
      (test) => {
        test.addStep('Cloning a nested object and modifying the clone...');
        const original = { a: 1, b: { c: [1, 2, 3] } };
        const clone = deepClone(original);

        // Modify the clone
        clone.b.c.push(4);
        clone.a = 99;

        // Return whether original is unchanged
        return original.a === 1 && original.b.c.length === 3;
      },
      (test, result) => {
        test.addStep('Verifying original is unchanged after clone mutation...');
        Test.assertIsEqual(result, true);
      }
    );
  }

  // #endregion

  // #region deepMerge()

  /**
   * Tests deepMerge() merges objects deeply.
   *
   * @returns A promise that resolves when the test completes
   */
  testDeepMerge(): Promise<Test<Record<string, unknown>>> {
    return this.test(
      'Test deepMerge() merges objects...',
      (test) => {
        test.addStep('Merging two objects with nested properties...');
        const base = { a: 1, b: { c: 2, d: 3 }, e: 'base' };
        const target = { b: { c: 99, f: 4 }, g: 'new' };
        return deepMerge(base, target);
      },
      (test, result) => {
        test.addStep('Verifying base properties are preserved...');
        Test.assertIsEqual(result.a, 1);
        Test.assertIsEqual(result.e, 'base');

        test.addStep('Verifying target overrides...');
        Test.assertIsEqual((result.b as Record<string, unknown>).c, 99);

        test.addStep('Verifying target additions...');
        Test.assertIsEqual((result.b as Record<string, unknown>).f, 4);
        Test.assertIsEqual(result.g, 'new');

        test.addStep('Verifying base nested properties preserved...');
        Test.assertIsEqual((result.b as Record<string, unknown>).d, 3);
      }
    );
  }

  // #endregion

  // #region shallowObjectEqual() / shallowArrayEqual()

  /**
   * Tests shallowObjectEqual() and shallowArrayEqual().
   *
   * @returns A promise that resolves when the test completes
   */
  testShallowEquals(): Promise<Test<boolean[]>> {
    return this.test(
      'Test shallowObjectEqual() and shallowArrayEqual()...',
      (test) => {
        test.addStep('Comparing objects and arrays shallowly...');
        const ref = { x: 1 };
        return [
          shallowObjectEqual({ a: 1, b: 'two' }, { a: 1, b: 'two' }),
          shallowObjectEqual({ a: 1 }, { a: 2 }),
          shallowObjectEqual({ a: ref }, { a: ref }),
          shallowArrayEqual([1, 2, 3], [1, 2, 3]),
          shallowArrayEqual([1, 2], [1, 2, 3]),
          shallowArrayEqual([], []),
        ];
      },
      (test, results) => {
        test.addStep('Verifying shallow equal objects...');
        Test.assertIsEqual(results[0], true);

        test.addStep('Verifying shallow unequal objects...');
        Test.assertIsEqual(results[1], false);

        test.addStep('Verifying same reference is shallow equal...');
        Test.assertIsEqual(results[2], true);

        test.addStep('Verifying equal arrays...');
        Test.assertIsEqual(results[3], true);

        test.addStep('Verifying different length arrays...');
        Test.assertIsEqual(results[4], false);

        test.addStep('Verifying empty arrays are equal...');
        Test.assertIsEqual(results[5], true);
      }
    );
  }

  // #endregion

  // #region isNumeric()

  /**
   * Tests isNumeric() validates numeric strings.
   *
   * @returns A promise that resolves when the test completes
   */
  testIsNumeric(): Promise<Test<boolean[]>> {
    return this.test(
      'Test isNumeric() validates numeric strings...',
      (test) => {
        test.addStep('Checking various string values...');
        return [isNumeric('42'), isNumeric('3.14'), isNumeric('-7'), isNumeric('0'), isNumeric('abc'), isNumeric(''), isNumeric('12px')];
      },
      (test, results) => {
        test.addStep('Verifying integer string...');
        Test.assertIsEqual(results[0], true);

        test.addStep('Verifying decimal string...');
        Test.assertIsEqual(results[1], true);

        test.addStep('Verifying negative string...');
        Test.assertIsEqual(results[2], true);

        test.addStep('Verifying zero string...');
        Test.assertIsEqual(results[3], true);

        test.addStep('Verifying non-numeric string...');
        Test.assertIsEqual(results[4], false);

        test.addStep('Verifying empty string (Number("") is 0, so isNumeric returns true)...');
        Test.assertIsEqual(results[5], true);

        test.addStep('Verifying mixed string...');
        Test.assertIsEqual(results[6], false);
      }
    );
  }

  // #endregion

  // #region isObjectEmpty()

  /**
   * Tests isObjectEmpty() checks for empty objects.
   *
   * @returns A promise that resolves when the test completes
   */
  testIsObjectEmpty(): Promise<Test<boolean[]>> {
    return this.test(
      'Test isObjectEmpty() checks empty objects...',
      (test) => {
        test.addStep('Checking various objects...');
        return [isObjectEmpty({}), isObjectEmpty({ a: 1 }), isObjectEmpty({ a: undefined })];
      },
      (test, results) => {
        test.addStep('Verifying empty object...');
        Test.assertIsEqual(results[0], true);

        test.addStep('Verifying non-empty object...');
        Test.assertIsEqual(results[1], false);

        test.addStep('Verifying object with undefined value...');
        Test.assertIsEqual(results[2], false);
      }
    );
  }

  // #endregion

  // #region generateId() / isValidUUID()

  /**
   * Tests generateId() and isValidUUID() work together.
   *
   * @returns A promise that resolves when the test completes
   */
  testGenerateIdAndIsValidUUID(): Promise<Test<string[]>> {
    return this.test(
      'Test generateId() and isValidUUID()...',
      (test) => {
        test.addStep('Generating IDs of various lengths...');
        return [generateId(36), generateId(18), generateId(8)];
      },
      (test, results) => {
        test.addStep('Verifying 36-char ID length...');
        Test.assertIsEqual(results[0].length, 36);

        test.addStep('Verifying 36-char ID is a valid UUID...');
        Test.assertIsEqual(isValidUUID(results[0]), true);

        test.addStep('Verifying 18-char ID length...');
        Test.assertIsEqual(results[1].length, 18);

        test.addStep('Verifying 8-char ID length...');
        Test.assertIsEqual(results[2].length, 8);

        test.addStep('Verifying generated IDs are unique...');
        Test.assertIsNotEqual(results[0], results[1]);

        test.addStep('Verifying invalid UUIDs...');
        Test.assertIsEqual(isValidUUID('not-a-uuid'), false);
        Test.assertIsEqual(isValidUUID(''), false);
      }
    );
  }

  // #endregion

  // #region setAlphaColor()

  /**
   * Tests setAlphaColor() modifies alpha channel correctly.
   *
   * @returns A promise that resolves when the test completes
   */
  testSetAlphaColor(): Promise<Test<number[][]>> {
    return this.test(
      'Test setAlphaColor() modifies alpha channel...',
      (test) => {
        test.addStep('Setting alpha on color arrays...');
        return [setAlphaColor([255, 0, 0, 255], 0.5), setAlphaColor([0, 128, 255, 0], 1), setAlphaColor([100, 100, 100, 200], 0)];
      },
      (test, results) => {
        test.addStep('Verifying alpha set to 0.5...');
        Test.assertIsArrayEqual(results[0], [255, 0, 0, 0.5]);

        test.addStep('Verifying alpha set to 1...');
        Test.assertIsArrayEqual(results[1], [0, 128, 255, 1]);

        test.addStep('Verifying alpha set to 0...');
        Test.assertIsArrayEqual(results[2], [100, 100, 100, 0]);
      }
    );
  }

  // #endregion

  // #region isJsonString()

  /**
   * Tests isJsonString() validates JSON strings.
   *
   * @returns A promise that resolves when the test completes
   */
  testIsJsonString(): Promise<Test<boolean[]>> {
    return this.test(
      'Test isJsonString() validates JSON strings...',
      (test) => {
        test.addStep('Checking various strings...');
        return [
          isJsonString('{"a": 1}'),
          isJsonString('[1, 2, 3]'),
          isJsonString('"hello"'),
          isJsonString('not json'),
          isJsonString('{invalid}'),
          isJsonString(''),
        ];
      },
      (test, results) => {
        test.addStep('Verifying valid JSON object...');
        Test.assertIsEqual(results[0], true);

        test.addStep('Verifying valid JSON array...');
        Test.assertIsEqual(results[1], true);

        test.addStep('Verifying valid JSON string...');
        Test.assertIsEqual(results[2], true);

        test.addStep('Verifying invalid JSON text...');
        Test.assertIsEqual(results[3], false);

        test.addStep('Verifying invalid JSON object...');
        Test.assertIsEqual(results[4], false);

        test.addStep('Verifying empty string...');
        Test.assertIsEqual(results[5], false);
      }
    );
  }

  // #endregion

  // #region removeCommentsFromJSON() / parseJSONConfig()

  /**
   * Tests removeCommentsFromJSON() and parseJSONConfig().
   *
   * @returns A promise that resolves when the test completes
   */
  testJsonParsing(): Promise<Test<Record<string, unknown>>> {
    return this.test(
      'Test removeCommentsFromJSON() and parseJSONConfig()...',
      (test) => {
        test.addStep('Parsing JSON with block comments...');
        const jsonWithComments = `{
          /* This is a block comment */
          'name': 'test',
          'value': 42
        }`;
        const cleaned = removeCommentsFromJSON(jsonWithComments);
        return parseJSONConfig<Record<string, unknown>>(cleaned);
      },
      (test, result) => {
        test.addStep('Verifying comments were removed and JSON parsed...');
        Test.assertIsDefined('name', result.name);
        Test.assertIsEqual(result.name, 'test');
        Test.assertIsEqual(result.value, 42);
      }
    );
  }

  // #endregion

  // #region escapeRegExp()

  /**
   * Tests escapeRegExp() escapes special regex characters.
   *
   * @returns A promise that resolves when the test completes
   */
  testEscapeRegExp(): Promise<Test<string[]>> {
    return this.test(
      'Test escapeRegExp() escapes regex characters...',
      (test) => {
        test.addStep('Escaping strings with special characters...');
        return [escapeRegExp('hello.world'), escapeRegExp('price: $10.00'), escapeRegExp('[test]'), escapeRegExp('a+b*c?')];
      },
      (test, results) => {
        test.addStep('Verifying dot is escaped...');
        Test.assertIsEqual(results[0], 'hello\\.world');

        test.addStep('Verifying dollar, dot, and space escaped...');
        Test.assertIsEqual(results[1], 'price:\\ \\$10\\.00');

        test.addStep('Verifying brackets escaped...');
        Test.assertIsEqual(results[2], '\\[test\\]');

        test.addStep('Verifying multiple special chars escaped...');
        Test.assertIsEqual(results[3], 'a\\+b\\*c\\?');
      }
    );
  }

  // #endregion

  // #region isImage()

  /**
   * Tests isImage() detects image URLs.
   *
   * @returns A promise that resolves when the test completes
   */
  testIsImage(): Promise<Test<boolean[]>> {
    return this.test(
      'Test isImage() detects image URLs...',
      (test) => {
        test.addStep('Checking various items...');
        return [
          isImage('data:image/png;base64,abc'),
          isImage('https://example.com/image.png'),
          isImage('https://example.com/data.json'),
          isImage('plain text'),
        ];
      },
      (test, results) => {
        test.addStep('Verifying base64 data URI...');
        Test.assertIsEqual(results[0], true);

        test.addStep('Verifying image URL...');
        Test.assertIsEqual(results[1], true);

        test.addStep('Verifying non-image URL...');
        Test.assertIsEqual(results[2], false);

        test.addStep('Verifying plain text...');
        Test.assertIsEqual(results[3], false);
      }
    );
  }

  // #endregion

  // #region stringify()

  /**
   * Tests stringify() handles null/undefined/values.
   *
   * @returns A promise that resolves when the test completes
   */
  testStringify(): Promise<Test<unknown[]>> {
    return this.test(
      'Test stringify() handles null/undefined/values...',
      (test) => {
        test.addStep('Calling stringify with various inputs...');
        return [stringify(undefined), stringify(null), stringify('hello'), stringify(42), stringify({ a: 1 })];
      },
      (test, results) => {
        test.addStep('Verifying undefined returns empty string...');
        Test.assertIsEqual(results[0], '');

        test.addStep('Verifying null returns empty string...');
        Test.assertIsEqual(results[1], '');

        test.addStep('Verifying string passes through...');
        Test.assertIsEqual(results[2], 'hello');

        test.addStep('Verifying number passes through...');
        Test.assertIsEqual(results[3], 42);

        test.addStep('Verifying object passes through...');
        Test.assertIsDefined('result[4]', results[4]);
      }
    );
  }

  // #endregion

  // #region safeStringify()

  /**
   * Tests safeStringify() handles circular references.
   *
   * @returns A promise that resolves when the test completes
   */
  testSafeStringify(): Promise<Test<string[]>> {
    return this.test(
      'Test safeStringify() handles circular references...',
      (test) => {
        test.addStep('Stringifying objects...');

        // Normal object
        const normal = JSON.parse(safeStringify({ a: 1, b: 'two' }));

        // Circular reference — `any` needed because we intentionally create a self-referencing object to test circular handling
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const circular: any = { name: 'root' };
        circular.self = circular;
        const circularResult = safeStringify(circular);

        return [JSON.stringify(normal), circularResult];
      },
      (test, results) => {
        test.addStep('Verifying normal object stringified...');
        const parsed = JSON.parse(results[0]);
        Test.assertIsEqual(parsed.a, 1);

        test.addStep('Verifying circular reference handled...');
        Test.assertIsDefined('circularResult', results[1]);
        // Circular ref should not throw, should contain the name property
        Test.assertIsEqual(results[1].includes('root'), true);
      }
    );
  }

  // #endregion

  // #region deepMergeObjects()

  /**
   * Tests deepMergeObjects() merges multiple objects.
   *
   * @returns A promise that resolves when the test completes
   */
  testDeepMergeObjects(): Promise<Test<Record<string, unknown>>> {
    return this.test(
      'Test deepMergeObjects() merges multiple objects...',
      (test) => {
        test.addStep('Merging three objects...');
        return deepMergeObjects<Record<string, unknown>>({ a: 1 }, { b: 2 }, { c: 3, a: 99 });
      },
      (test, result) => {
        test.addStep('Verifying all properties present...');
        Test.assertIsEqual(result.b, 2);
        Test.assertIsEqual(result.c, 3);

        test.addStep('Verifying last object wins on conflict...');
        Test.assertIsEqual(result.a, 99);
      }
    );
  }

  // #endregion

  // #region findPropertyByRegexPath()

  /**
   * Tests findPropertyByRegexPath() finds nested properties.
   *
   * @returns A promise that resolves when the test completes
   */
  testFindPropertyByRegexPath(): Promise<Test<unknown[]>> {
    return this.test(
      'Test findPropertyByRegexPath() finds nested properties...',
      (test) => {
        test.addStep('Searching objects with regex patterns...');
        const obj = { layer: { settings: { opacity: 0.8 } } };
        const found = findPropertyByRegexPath<number>(obj, [/layer/i, /settings/i, /opacity/i]);
        const notFound = findPropertyByRegexPath<number>(obj, [/layer/i, /missing/i]);
        return [found, notFound];
      },
      (test, results) => {
        test.addStep('Verifying found value...');
        Test.assertIsEqual(results[0], 0.8);

        test.addStep('Verifying not found returns undefined...');
        Test.assertIsUndefined('notFound', results[1]);
      }
    );
  }

  // #endregion

  // #region formatMeasurementValue() / formatLength() / formatArea()

  /**
   * Tests formatting measurement values.
   *
   * @returns A promise that resolves when the test completes
   */
  testFormatMeasurements(): Promise<Test<string[]>> {
    return this.test(
      'Test formatMeasurementValue(), formatLength(), formatArea()...',
      (test) => {
        test.addStep('Formatting various measurements in en and fr...');
        return [
          formatMeasurementValue(1234.56, 'en'),
          formatMeasurementValue(1234.56, 'fr'),
          formatLength(50, 'en'),
          formatLength(50, 'fr'),
          formatLength(1500, 'en'),
          formatLength(1500, 'fr'),
          formatArea(500, 'en'),
          formatArea(500, 'fr'),
          formatArea(50000, 'en'),
          formatArea(50000, 'fr'),
        ];
      },
      (test, results) => {
        test.addStep('Verifying en measurement value format...');
        Test.assertIsEqual(results[0], '1,234.56');

        test.addStep('Verifying fr measurement value format...');
        Test.assertIsEqual(results[1], '1\u00a0234,56');

        test.addStep('Verifying en short length in meters...');
        Test.assertIsEqual(results[2], '50.00 m');

        test.addStep('Verifying fr short length in meters...');
        Test.assertIsEqual(results[3], '50,00 m');

        test.addStep('Verifying en long length in km...');
        Test.assertIsEqual(results[4], '1.50 km');

        test.addStep('Verifying fr long length in km...');
        Test.assertIsEqual(results[5], '1,50 km');

        test.addStep('Verifying en small area in m²...');
        Test.assertIsEqual(results[6], '500.00 m<sup>2</sup>');

        test.addStep('Verifying fr small area in m²...');
        Test.assertIsEqual(results[7], '500,00 m<sup>2</sup>');

        test.addStep('Verifying en large area in km²...');
        Test.assertIsEqual(results[8], '0.05 km<sup>2</sup>');

        test.addStep('Verifying fr large area in km²...');
        Test.assertIsEqual(results[9], '0,05 km<sup>2</sup>');
      }
    );
  }

  // #endregion

  // #region normalizeDatacubeAccessPath()

  /**
   * Tests normalizeDatacubeAccessPath() transforms datacube URLs.
   *
   * @returns A promise that resolves when the test completes
   */
  testNormalizeDatacubeAccessPath(): Promise<Test<string[]>> {
    return this.test(
      'Test normalizeDatacubeAccessPath() transforms URLs...',
      (test) => {
        test.addStep('Normalizing datacube paths...');
        return [
          normalizeDatacubeAccessPath('https://example.com/datacube/wrapper/ramp/ogc/layer'),
          normalizeDatacubeAccessPath('https://example.com/datacube/ows/service'),
          normalizeDatacubeAccessPath('https://example.com/regular/path'),
        ];
      },
      (test, results) => {
        test.addStep('Verifying ramp/ogc replaced with ogc...');
        Test.assertIsEqual(results[0].includes('ramp'), false);
        Test.assertIsEqual(results[0].includes('wrapper/ogc'), true);

        test.addStep('Verifying ows replaced...');
        Test.assertIsEqual(results[1].includes('/ows/'), false);

        test.addStep('Verifying non-datacube path unchanged...');
        Test.assertIsEqual(results[2], 'https://example.com/regular/path');
      }
    );
  }

  // #endregion

  // #region sanitizeHtmlContent()

  /**
   * Tests sanitizeHtmlContent() strips dangerous HTML.
   *
   * @returns A promise that resolves when the test completes
   */
  testSanitizeHtmlContent(): Promise<Test<string[]>> {
    return this.test(
      'Test sanitizeHtmlContent() strips dangerous HTML...',
      (test) => {
        test.addStep('Sanitizing various HTML strings...');
        return [
          sanitizeHtmlContent('<p>Safe content</p>'),
          sanitizeHtmlContent('<script>alert("xss")</script><p>Content</p>'),
          sanitizeHtmlContent('<a href="https://example.com">Link</a>'),
        ];
      },
      (test, results) => {
        test.addStep('Verifying safe HTML preserved...');
        Test.assertIsEqual(results[0].includes('Safe content'), true);

        test.addStep('Verifying script tags removed...');
        Test.assertIsEqual(results[1].includes('script'), false);
        Test.assertIsEqual(results[1].includes('Content'), true);

        test.addStep('Verifying links preserved...');
        Test.assertIsEqual(results[2].includes('href'), true);
      }
    );
  }

  // #endregion

  // #region enhanceLinksAccessibility()

  /**
   * Tests enhanceLinksAccessibility() adds screen reader text.
   *
   * @returns A promise that resolves when the test completes
   */
  testEnhanceLinksAccessibility(): Promise<Test<string[]>> {
    return this.test(
      'Test enhanceLinksAccessibility() adds screen reader text...',
      (test) => {
        test.addStep('Enhancing links with accessibility text...');
        return [
          enhanceLinksAccessibility('<a href="https://example.com" target="_blank">Link</a>', 'Opens in new tab'),
          enhanceLinksAccessibility('<a href="https://example.com">No target</a>', 'Opens in new tab'),
        ];
      },
      (test, results) => {
        test.addStep('Verifying target=_blank link enhanced...');
        Test.assertIsEqual(results[0].includes('visually-hidden'), true);
        Test.assertIsEqual(results[0].includes('Opens in new tab'), true);

        test.addStep('Verifying non-target link unchanged...');
        Test.assertIsEqual(results[1].includes('visually-hidden'), false);
      }
    );
  }

  // #endregion

  // #region getLocalizedMessage()

  /**
   * Tests getLocalizedMessage() returns translated strings.
   *
   * @returns A promise that resolves when the test completes
   */
  testGetLocalizedMessage(): Promise<Test<string[]>> {
    return this.test(
      'Test getLocalizedMessage() returns translated strings...',
      (test) => {
        test.addStep('Getting localized messages...');
        return [
          getLocalizedMessage('en', 'general.close'),
          getLocalizedMessage('fr', 'general.close'),
          getLocalizedMessage('en', 'general.panelLabel', { title: 'Legend' }),
          getLocalizedMessage('fr', 'general.panelLabel', { title: 'Légende' }),
          getLocalizedMessage('en', 'legend.subLayersCount', { count: 5 }),
          getLocalizedMessage('fr', 'legend.subLayersCount', { count: 5 }),
          getLocalizedMessage('en', 'general.processing', { count: 3, total: 10 }),
          getLocalizedMessage('fr', 'general.processing', { count: 3, total: 10 }),
        ];
      },
      (test, results) => {
        test.addStep('Verifying English message returned...');
        Test.assertIsDefined('enMessage', results[0]);
        Test.assertIsEqual(typeof results[0], 'string');

        test.addStep('Verifying French message returned...');
        Test.assertIsDefined('frMessage', results[1]);
        Test.assertIsEqual(typeof results[1], 'string');

        test.addStep('Verifying translations differ...');
        Test.assertIsNotEqual(results[0], results[1]);

        test.addStep('Verifying single param interpolation (en)...');
        Test.assertIsEqual(results[2], 'Legend panel');

        test.addStep('Verifying single param interpolation (fr)...');
        Test.assertIsEqual(results[3], 'Panneau de Légende');

        test.addStep('Verifying numeric param interpolation (en)...');
        Test.assertIsEqual(results[4], '5 sublayers');

        test.addStep('Verifying numeric param interpolation (fr)...');
        Test.assertIsEqual(results[5], '5 sous-couches');

        test.addStep('Verifying multi-param interpolation (en)...');
        Test.assertIsEqual(results[6], 'Processing 3 element(s) of 10');

        test.addStep('Verifying multi-param interpolation (fr)...');
        Test.assertIsEqual(results[7], 'Traitement de 3 élément(s) sur 10');
      }
    );
  }

  // #endregion
}
