import type { PingResult } from 'geoview-core/core/utils/utilities';
import { validateAndPingUrl } from 'geoview-core/core/utils/utilities';
import type { TypeLayerStyleConfig, TypePolygonVectorConfig } from 'geoview-core/api/types/map-schema-types';
import { GeoviewRenderer } from 'geoview-core/geo/utils/renderer/geoview-renderer';

import { Test } from '../core/test';
import { GVAbstractTester } from './abstract-gv-tester';

/**
 * Main Core testing class.
 */
export class CoreTester extends GVAbstractTester {
  /**
   * Returns the name of the Tester.
   *
   * @returns The name of the Tester
   */
  override getName(): string {
    return 'CoreTester';
  }

  // #region VALIDATE AND PING URL

  /**
   * Tests validateAndPingUrl with a valid and reachable URL.
   *
   * Uses the Historical Flood MapServer URL which is known to be reachable.
   * Asserts that the result has isValid=true and isReachable=true.
   *
   * @returns A promise that resolves when the test completes
   */
  testValidateAndPingUrlValidReachable(): Promise<Test<PingResult>> {
    return this.test(
      `Test validateAndPingUrl with a valid reachable URL...`,
      async (test) => {
        const url = GVAbstractTester.HISTORICAL_FLOOD_URL_MAP_SERVER;
        test.addStep(`Pinging valid reachable URL: ${url}...`);
        const result = await validateAndPingUrl(url);
        return result;
      },
      (test, result) => {
        test.addStep('Verifying isValid is true...');
        Test.assertIsEqual(result.isValid, true);

        test.addStep('Verifying isReachable is true...');
        Test.assertIsEqual(result.isReachable, true);

        test.addStep('Verifying no error message...');
        Test.assertIsUndefined('error', result.error);
      }
    );
  }

  /**
   * Tests validateAndPingUrl with an invalid URL format.
   *
   * Uses a malformed string that is not a valid URL.
   * Asserts that the result has isValid=false and isReachable=false.
   *
   * @returns A promise that resolves when the test completes
   */
  testValidateAndPingUrlInvalidFormat(): Promise<Test<PingResult>> {
    return this.test(
      `Test validateAndPingUrl with an invalid URL format...`,
      async (test) => {
        const url = 'not-a-valid-url';
        test.addStep(`Pinging invalid URL format: ${url}...`);
        const result = await validateAndPingUrl(url);
        return result;
      },
      (test, result) => {
        test.addStep('Verifying isValid is false...');
        Test.assertIsEqual(result.isValid, false);

        test.addStep('Verifying isReachable is false...');
        Test.assertIsEqual(result.isReachable, false);

        test.addStep('Verifying error message exists...');
        Test.assertIsDefined('error', result.error);

        test.addStep('Verifying error message indicates invalid URL...');
        Test.assertIsEqual(result.error, 'Invalid URL format');
      }
    );
  }

  /**
   * Tests validateAndPingUrl with a valid URL that is unreachable.
   *
   * Uses GVAbstractTester.BAD_URL which has valid URL syntax but the server does not exist.
   * Asserts that the result has isValid=true and isReachable=false.
   *
   * @returns A promise that resolves when the test completes
   */
  testValidateAndPingUrlUnreachable(): Promise<Test<PingResult>> {
    return this.test(
      `Test validateAndPingUrl with an unreachable URL...`,
      async (test) => {
        const url = GVAbstractTester.BAD_URL;
        test.addStep(`Pinging unreachable URL: ${url}...`);
        const result = await validateAndPingUrl(url);
        return result;
      },
      (test, result) => {
        test.addStep('Verifying isValid is true (URL format is valid)...');
        Test.assertIsEqual(result.isValid, true);

        test.addStep('Verifying isReachable is false...');
        Test.assertIsEqual(result.isReachable, false);

        test.addStep('Verifying error message exists...');
        Test.assertIsDefined('error', result.error);
      }
    );
  }

  /**
   * Tests validateAndPingUrl with a WMS service URL.
   *
   * Uses the Geomet WMS URL. WMS services often require query params to respond properly,
   * so this validates that the OGC GetCapabilities fallback logic works.
   * Asserts that the result has isValid=true and isReachable=true.
   *
   * @returns A promise that resolves when the test completes
   */
  testValidateAndPingUrlWmsService(): Promise<Test<PingResult>> {
    return this.test(
      `Test validateAndPingUrl with a WMS service URL...`,
      async (test) => {
        const url = GVAbstractTester.GEOMET_URL;
        test.addStep(`Pinging WMS service URL: ${url}...`);
        const result = await validateAndPingUrl(url);
        return result;
      },
      (test, result) => {
        test.addStep('Verifying isValid is true...');
        Test.assertIsEqual(result.isValid, true);

        test.addStep('Verifying isReachable is true (OGC GetCapabilities should succeed)...');
        Test.assertIsEqual(result.isReachable, true);
      }
    );
  }

  /**
   * Tests GeometryCollection legend generation through the renderer.
   *
   * @returns A promise that resolves when the test completes
   */
  testGeometryCollectionLegendStyles(): Promise<Test<Awaited<ReturnType<typeof GeoviewRenderer.getLegendStyles>>>> {
    return this.test(
      `Test GeometryCollection legend style generation...`,
      (test) => {
        const createPolygonSettings = (fillColor: string, strokeColor: string): TypePolygonVectorConfig => ({
          type: 'filledPolygon',
          color: fillColor,
          stroke: {
            color: strokeColor,
            lineStyle: 'solid',
            width: 2,
          },
          fillStyle: 'solid',
        });

        const styleConfig: TypeLayerStyleConfig = {
          GeometryCollection: {
            type: 'uniqueValue',
            fields: ['status'],
            hasDefault: true,
            info: [
              {
                label: 'Active',
                visible: true,
                values: ['active'],
                settings: createPolygonSettings('rgba(46, 204, 113, 0.35)', 'rgba(39, 174, 96, 1)'),
              },
              {
                label: 'Inactive',
                visible: true,
                values: ['inactive'],
                settings: createPolygonSettings('rgba(231, 76, 60, 0.35)', 'rgba(192, 57, 43, 1)'),
              },
              {
                label: 'Maintenance',
                visible: true,
                values: ['maintenance'],
                settings: createPolygonSettings('rgba(241, 196, 15, 0.35)', 'rgba(243, 156, 18, 1)'),
              },
              {
                label: 'Other',
                visible: true,
                values: [],
                settings: createPolygonSettings('rgba(149, 165, 166, 0.25)', 'rgba(127, 140, 141, 1)'),
              },
            ],
          },
        };

        test.addStep('Generating legend styles for GeometryCollection renderer settings...');
        return GeoviewRenderer.getLegendStyles(styleConfig);
      },
      (test, result) => {
        test.addStep('Verifying GeometryCollection legend styles exist...');
        Test.assertIsDefined('result.GeometryCollection', result.GeometryCollection);

        test.addStep('Verifying GeometryCollection default canvas exists...');
        Test.assertIsDefined('result.GeometryCollection.defaultCanvas', result.GeometryCollection?.defaultCanvas);

        test.addStep('Verifying GeometryCollection legend entries were generated...');
        Test.assertIsDefined('result.GeometryCollection.arrayOfCanvas', result.GeometryCollection?.arrayOfCanvas);
        Test.assertIsArrayLengthEqual(result.GeometryCollection?.arrayOfCanvas, 3);

        test.addStep('Verifying generated GeometryCollection canvases have width...');
        Test.assertIsEqual((result.GeometryCollection?.defaultCanvas?.width ?? 0) > 0, true);

        test.addStep('Verifying generated GeometryCollection canvases have height...');
        Test.assertIsEqual((result.GeometryCollection?.defaultCanvas?.height ?? 0) > 0, true);
      }
    );
  }

  // #endregion VALIDATE AND PING URL
}
