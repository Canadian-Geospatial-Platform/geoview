import { Projection } from 'geoview-core/geo/utils/projection';

import { Test } from '../core/test';
import { GVAbstractTester } from './abstract-gv-tester';

/**
 * Projection utilities testing class for cgpv.api.utilities.projection (Projection) functions.
 */
export class UtilitiesProjectionTester extends GVAbstractTester {
  /**
   * Returns the name of the Tester.
   *
   * @returns The name of the Tester
   */
  override getName(): string {
    return 'UtilitiesProjectionTester';
  }

  // #region PROJECTION_NAMES

  /**
   * Tests Projection.PROJECTION_NAMES contains expected entries.
   *
   * @returns A promise that resolves when the test completes
   */
  testProjectionNames(): Promise<Test<boolean>> {
    return this.test(
      'Test Projection.PROJECTION_NAMES contains expected entries...',
      (test) => {
        test.addStep('Checking PROJECTION_NAMES...');
        return true;
      },
      (test) => {
        test.addStep('Verifying LCC maps to EPSG:3978...');
        Test.assertIsEqual(Projection.PROJECTION_NAMES.LCC, 'EPSG:3978');

        test.addStep('Verifying WM maps to EPSG:3857...');
        Test.assertIsEqual(Projection.PROJECTION_NAMES.WM, 'EPSG:3857');

        test.addStep('Verifying LONLAT maps to EPSG:4326...');
        Test.assertIsEqual(Projection.PROJECTION_NAMES.LONLAT, 'EPSG:4326');

        test.addStep('Verifying 3857 maps to EPSG:3857...');
        Test.assertIsEqual(Projection.PROJECTION_NAMES['3857'], 'EPSG:3857');

        test.addStep('Verifying CRS84 maps to CRS:84...');
        Test.assertIsEqual(Projection.PROJECTION_NAMES.CRS84, 'CRS:84');
      }
    );
  }

  // #endregion

  // #region readEPSGNumber()

  /**
   * Tests Projection.readEPSGNumber() extracts EPSG codes.
   *
   * @returns A promise that resolves when the test completes
   */
  testReadEPSGNumber(): Promise<Test<(number | undefined)[]>> {
    return this.test(
      'Test Projection.readEPSGNumber() extracts EPSG codes...',
      (test) => {
        test.addStep('Reading EPSG numbers from strings...');
        return [
          Projection.readEPSGNumber('EPSG:3978'),
          Projection.readEPSGNumber('EPSG:4326'),
          Projection.readEPSGNumber('epsg:3857'),
          Projection.readEPSGNumber('EPSG : 3005'),
          Projection.readEPSGNumber('invalid'),
          Projection.readEPSGNumber('CRS:84'),
        ];
      },
      (test, results) => {
        test.addStep('Verifying EPSG:3978...');
        Test.assertIsEqual(results[0], 3978);

        test.addStep('Verifying EPSG:4326...');
        Test.assertIsEqual(results[1], 4326);

        test.addStep('Verifying lowercase epsg:3857...');
        Test.assertIsEqual(results[2], 3857);

        test.addStep('Verifying EPSG with spaces...');
        Test.assertIsEqual(results[3], 3005);

        test.addStep('Verifying invalid returns undefined...');
        Test.assertIsUndefined('invalid', results[4]);

        test.addStep('Verifying CRS:84 returns undefined (not EPSG)...');
        Test.assertIsUndefined('crs84', results[5]);
      }
    );
  }

  // #endregion

  // #region getProjectionLonLat()

  /**
   * Tests Projection.getProjectionLonLat() returns EPSG:4326.
   *
   * @returns A promise that resolves when the test completes
   */
  testGetProjectionLonLat(): Promise<Test<string>> {
    return this.test(
      'Test Projection.getProjectionLonLat() returns EPSG:4326...',
      (test) => {
        test.addStep('Getting the lon/lat projection...');
        const proj = Projection.getProjectionLonLat();
        return proj.getCode();
      },
      (test, result) => {
        test.addStep('Verifying projection code is EPSG:4326...');
        Test.assertIsEqual(result, 'EPSG:4326');
      }
    );
  }

  // #endregion

  // #region transformPoints()

  /**
   * Tests Projection.transformPoints() transforms coordinate arrays.
   *
   * @returns A promise that resolves when the test completes
   */
  testTransformPoints(): Promise<Test<number[][]>> {
    return this.test(
      'Test Projection.transformPoints() transforms coordinates...',
      (test) => {
        test.addStep('Transforming lon/lat points to EPSG:3857...');
        const points = [
          [-75, 45],
          [-73, 46],
        ];
        return Projection.transformPoints(points, 'EPSG:4326', 'EPSG:3857');
      },
      (test, results) => {
        test.addStep('Verifying two points transformed...');
        Test.assertIsArrayLengthEqual(results, 2);

        test.addStep('Verifying first point is in projected coordinates...');
        // EPSG:3857 x values for -75 lon should be around -8350000
        Test.assertIsEqual(results[0][0] < -8000000, true);
        Test.assertIsEqual(results[0][1] > 5000000, true);

        test.addStep('Verifying second point differs from first...');
        Test.assertIsNotEqual(results[0][0], results[1][0]);
      }
    );
  }

  // #endregion

  // #region transformExtentFromProj()

  /**
   * Tests Projection.transformExtentFromProj() transforms extents.
   *
   * @returns A promise that resolves when the test completes
   */
  testTransformExtentFromProj(): Promise<Test<number[]>> {
    return this.test(
      'Test Projection.transformExtentFromProj() transforms extents...',
      (test) => {
        test.addStep('Transforming extent from EPSG:4326 to EPSG:3857...');
        const lonLatProj = Projection.getProjectionFromString('EPSG:4326');
        const wmProj = Projection.getProjectionFromString('EPSG:3857');
        return Projection.transformExtentFromProj([-75, 45, -60, 55], lonLatProj, wmProj);
      },
      (test, result) => {
        test.addStep('Verifying result is a 4-element extent...');
        Test.assertIsArrayLengthEqual(result, 4);

        test.addStep('Verifying x-values are in Web Mercator range...');
        Test.assertIsEqual(result[0] < -6000000, true);
        Test.assertIsEqual(result[2] < -6000000, true);

        test.addStep('Verifying y-values are in Web Mercator range...');
        Test.assertIsEqual(result[1] > 5000000, true);
        Test.assertIsEqual(result[3] > 5000000, true);
      }
    );
  }

  // #endregion

  // #region getProjectionFromString()

  /**
   * Tests Projection.getProjectionFromString() resolves projections.
   *
   * @returns A promise that resolves when the test completes
   */
  testGetProjectionFromString(): Promise<Test<string[]>> {
    return this.test(
      'Test Projection.getProjectionFromString() resolves projections...',
      (test) => {
        test.addStep('Getting projections from string codes...');
        const proj4326 = Projection.getProjectionFromString('EPSG:4326');
        const proj3857 = Projection.getProjectionFromString('EPSG:3857');
        const proj3978 = Projection.getProjectionFromString('EPSG:3978');
        return [proj4326.getCode(), proj3857.getCode(), proj3978.getCode()];
      },
      (test, results) => {
        test.addStep('Verifying EPSG:4326 resolved...');
        Test.assertIsEqual(results[0], 'EPSG:4326');

        test.addStep('Verifying EPSG:3857 resolved...');
        Test.assertIsEqual(results[1], 'EPSG:3857');

        test.addStep('Verifying EPSG:3978 resolved...');
        Test.assertIsEqual(results[2], 'EPSG:3978');
      }
    );
  }

  // #endregion
}
