import { GeoUtilities } from 'geoview-core/geo/utils/utilities';
import type { Extent } from 'ol/extent';

import { Test } from '../core/test';
import { GVAbstractTester } from './abstract-gv-tester';

/**
 * Geo utilities testing class for cgpv.api.utilities.geo (GeoUtilities) functions.
 */
export class UtilitiesGeoTester extends GVAbstractTester {
  /**
   * Returns the name of the Tester.
   *
   * @returns The name of the Tester
   */
  override getName(): string {
    return 'UtilitiesGeoTester';
  }

  // #region getBaseUrl()

  /**
   * Tests GeoUtilities.getBaseUrl() extracts origin and path.
   *
   * @returns A promise that resolves when the test completes
   */
  testGetBaseUrl(): Promise<Test<string[]>> {
    return this.test(
      'Test GeoUtilities.getBaseUrl() extracts base URL...',
      (test) => {
        test.addStep('Extracting base URLs...');
        return [
          GeoUtilities.getBaseUrl('https://example.com/path/to/resource?param=value'),
          GeoUtilities.getBaseUrl('https://maps.example.com/server/MapServer/0?f=json'),
          GeoUtilities.getBaseUrl('https://example.com'),
        ];
      },
      (test, results) => {
        test.addStep('Verifying query params removed...');
        Test.assertIsEqual(results[0], 'https://example.com/path/to/resource');

        test.addStep('Verifying MapServer URL cleaned...');
        Test.assertIsEqual(results[1], 'https://maps.example.com/server/MapServer/0');

        test.addStep('Verifying root URL returned...');
        Test.assertIsEqual(results[2], 'https://example.com/');
      }
    );
  }

  // #endregion

  // #region getMapServerUrl()

  /**
   * Tests GeoUtilities.getMapServerUrl() truncates at MapServer.
   *
   * @returns A promise that resolves when the test completes
   */
  testGetMapServerUrl(): Promise<Test<string[]>> {
    return this.test(
      'Test GeoUtilities.getMapServerUrl() truncates at MapServer...',
      (test) => {
        test.addStep('Truncating MapServer URLs...');
        return [
          GeoUtilities.getMapServerUrl('https://example.com/services/Layer/MapServer/0'),
          GeoUtilities.getMapServerUrl('https://example.com/services/Layer/FeatureServer/0'),
          GeoUtilities.getMapServerUrl('https://example.com/services/Layer/MapServer/0', true),
        ];
      },
      (test, results) => {
        test.addStep('Verifying MapServer truncation...');
        Test.assertIsEqual(results[0].endsWith('MapServer'), true);
        Test.assertIsEqual(results[0].includes('/0'), false);

        test.addStep('Verifying FeatureServer truncation...');
        Test.assertIsEqual(results[1].endsWith('FeatureServer'), true);

        test.addStep('Verifying rest=true inserts /rest/...');
        Test.assertIsEqual(results[2].includes('/rest/'), true);
      }
    );
  }

  // #endregion

  // #region coordFormatDMS()

  /**
   * Tests GeoUtilities.coordFormatDMS() converts decimal degrees.
   *
   * @returns A promise that resolves when the test completes
   */
  testCoordFormatDMS(): Promise<Test<string[]>> {
    return this.test(
      'Test GeoUtilities.coordFormatDMS() converts decimal degrees...',
      (test) => {
        test.addStep('Converting coordinates to DMS format...');
        return [GeoUtilities.coordFormatDMS(45.5), GeoUtilities.coordFormatDMS(-73.5667), GeoUtilities.coordFormatDMS(0)];
      },
      (test, results) => {
        test.addStep('Verifying positive coordinate...');
        Test.assertIsEqual(results[0].includes('45'), true);
        Test.assertIsEqual(results[0].includes('°'), true);

        test.addStep('Verifying negative coordinate...');
        Test.assertIsEqual(results[1].includes('73'), true);

        test.addStep('Verifying zero coordinate...');
        Test.assertIsEqual(results[2].includes('0'), true);
      }
    );
  }

  // #endregion

  // #region isPointInExtent()

  /**
   * Tests GeoUtilities.isPointInExtent() checks coordinate containment.
   *
   * @returns A promise that resolves when the test completes
   */
  testIsPointInExtent(): Promise<Test<boolean[]>> {
    return this.test(
      'Test GeoUtilities.isPointInExtent() checks containment...',
      (test) => {
        test.addStep('Checking points against extent...');
        const extent: Extent = [-100, 40, -60, 60];
        return [
          GeoUtilities.isPointInExtent([-75, 50], extent),
          GeoUtilities.isPointInExtent([-120, 50], extent),
          GeoUtilities.isPointInExtent([-100, 40], extent),
        ];
      },
      (test, results) => {
        test.addStep('Verifying point inside extent...');
        Test.assertIsEqual(results[0], true);

        test.addStep('Verifying point outside extent...');
        Test.assertIsEqual(results[1], false);

        test.addStep('Verifying point on boundary...');
        Test.assertIsEqual(results[2], true);
      }
    );
  }

  // #endregion

  // #region getExtentUnion()

  /**
   * Tests GeoUtilities.getExtentUnion() computes union of extents.
   *
   * @returns A promise that resolves when the test completes
   */
  testGetExtentUnion(): Promise<Test<(Extent | undefined)[]>> {
    return this.test(
      'Test GeoUtilities.getExtentUnion() computes union...',
      (test) => {
        test.addStep('Computing extent unions...');
        const extentA: Extent = [-100, 40, -80, 50];
        const extentB: Extent = [-90, 45, -70, 55];
        return [
          GeoUtilities.getExtentUnion(extentA, extentB),
          GeoUtilities.getExtentUnion(extentA, undefined),
          GeoUtilities.getExtentUnion(undefined, undefined),
        ];
      },
      (test, results) => {
        test.addStep('Verifying union of overlapping extents...');
        Test.assertIsDefined('union', results[0]);
        Test.assertIsEqual(results[0][0], -100);
        Test.assertIsEqual(results[0][1], 40);
        Test.assertIsEqual(results[0][2], -70);
        Test.assertIsEqual(results[0][3], 55);

        test.addStep('Verifying union with undefined returns the other...');
        Test.assertIsDefined('singleExtent', results[1]);
        Test.assertIsEqual(results[1][0], -100);

        test.addStep('Verifying both undefined returns undefined...');
        Test.assertIsUndefined('bothUndefined', results[2]);
      }
    );
  }

  // #endregion

  // #region isExtentLonLat()

  /**
   * Tests GeoUtilities.isExtentLonLat() validates lon/lat bounds.
   *
   * @returns A promise that resolves when the test completes
   */
  testIsExtentLonLat(): Promise<Test<boolean[]>> {
    return this.test(
      'Test GeoUtilities.isExtentLonLat() validates lon/lat...',
      (test) => {
        test.addStep('Checking extents for lon/lat validity...');
        return [
          GeoUtilities.isExtentLonLat([-75, 45, -60, 55]),
          GeoUtilities.isExtentLonLat([-200, 45, -60, 55]),
          GeoUtilities.isExtentLonLat([-75, 45, -60, 100]),
          GeoUtilities.isExtentLonLat([-8000000, 5000000, -7000000, 6000000]),
        ];
      },
      (test, results) => {
        test.addStep('Verifying valid lon/lat extent...');
        Test.assertIsEqual(results[0], true);

        test.addStep('Verifying lon out of range...');
        Test.assertIsEqual(results[1], false);

        test.addStep('Verifying lat out of range...');
        Test.assertIsEqual(results[2], false);

        test.addStep('Verifying projected coordinates rejected...');
        Test.assertIsEqual(results[3], false);
      }
    );
  }

  // #endregion

  // #region bufferExtent()

  /**
   * Tests GeoUtilities.bufferExtent() expands an extent.
   *
   * @returns A promise that resolves when the test completes
   */
  testBufferExtent(): Promise<Test<Extent>> {
    return this.test(
      'Test GeoUtilities.bufferExtent() expands extent...',
      (test) => {
        test.addStep('Buffering an extent by 1000...');
        return GeoUtilities.bufferExtent([-100, 40, -80, 50], 1000);
      },
      (test, result) => {
        test.addStep('Verifying extent expanded...');
        Test.assertIsEqual(result[0], -1100);
        Test.assertIsEqual(result[1], -960);
        Test.assertIsEqual(result[2], 920);
        Test.assertIsEqual(result[3], 1050);
      }
    );
  }

  // #endregion

  // #region isGeoJSONObject()

  /**
   * Tests GeoUtilities.isGeoJSONObject() detects GeoJSON.
   *
   * @returns A promise that resolves when the test completes
   */
  testIsGeoJSONObject(): Promise<Test<boolean[]>> {
    return this.test(
      'Test GeoUtilities.isGeoJSONObject() detects GeoJSON...',
      (test) => {
        test.addStep('Checking objects for GeoJSON structure...');
        return [
          GeoUtilities.isGeoJSONObject({ type: 'FeatureCollection', features: [] }),
          GeoUtilities.isGeoJSONObject({ type: 'FeatureCollection', features: [{ type: 'Feature' }] }),
          GeoUtilities.isGeoJSONObject({ type: 'Feature', geometry: {} }),
          GeoUtilities.isGeoJSONObject({ name: 'not geojson' }),
          GeoUtilities.isGeoJSONObject(null),
        ];
      },
      (test, results) => {
        test.addStep('Verifying empty FeatureCollection...');
        Test.assertIsEqual(results[0], true);

        test.addStep('Verifying FeatureCollection with features...');
        Test.assertIsEqual(results[1], true);

        test.addStep('Verifying single Feature is not FeatureCollection...');
        Test.assertIsEqual(results[2], false);

        test.addStep('Verifying non-GeoJSON object...');
        Test.assertIsEqual(results[3], false);

        test.addStep('Verifying null...');
        Test.assertIsEqual(results[4], false);
      }
    );
  }

  // #endregion

  // #region wfsConvertGeometryTypeToOLGeometryType()

  /**
   * Tests GeoUtilities geometry type conversion methods.
   *
   * @returns A promise that resolves when the test completes
   */
  testGeometryTypeConversions(): Promise<Test<string[]>> {
    return this.test(
      'Test geometry type conversions...',
      (test) => {
        test.addStep('Converting WFS and ESRI geometry types...');
        return [
          GeoUtilities.wfsConvertGeometryTypeToOLGeometryType('gml:PointPropertyType'),
          GeoUtilities.wfsConvertGeometryTypeToOLGeometryType('gml:MultiPolygonPropertyType'),
          GeoUtilities.esriConvertEsriGeometryTypeToOLGeometryType('esriGeometryPoint'),
          GeoUtilities.esriConvertEsriGeometryTypeToOLGeometryType('esriGeometryPolygon'),
        ];
      },
      (test, results) => {
        test.addStep('Verifying WFS Point conversion...');
        Test.assertIsEqual(results[0], 'Point');

        test.addStep('Verifying WFS MultiPolygon conversion...');
        Test.assertIsEqual(results[1], 'MultiPolygon');

        test.addStep('Verifying ESRI Point conversion...');
        Test.assertIsEqual(results[2], 'Point');

        test.addStep('Verifying ESRI Polygon conversion...');
        Test.assertIsEqual(results[3], 'Polygon');
      }
    );
  }

  // #endregion

  // #region ensureServiceRequestUrl()

  /**
   * Tests GeoUtilities.ensureServiceRequestUrl() normalizes OGC params.
   *
   * @returns A promise that resolves when the test completes
   */
  testEnsureServiceRequestUrl(): Promise<Test<string[]>> {
    return this.test(
      'Test GeoUtilities.ensureServiceRequestUrl() normalizes params...',
      (test) => {
        test.addStep('Normalizing OGC service URLs...');
        return [
          GeoUtilities.ensureServiceRequestUrl('https://example.com/wms', 'WMS', 'GetCapabilities'),
          GeoUtilities.ensureServiceRequestUrl('https://example.com/wms?service=wms&request=getcapabilities', 'WMS', 'GetCapabilities'),
        ];
      },
      (test, results) => {
        test.addStep('Verifying params added to clean URL...');
        Test.assertIsEqual(results[0].includes('SERVICE=WMS'), true);
        Test.assertIsEqual(results[0].includes('REQUEST=GetCapabilities'), true);
        Test.assertIsEqual(results[0].includes('VERSION='), true);

        test.addStep('Verifying existing params normalized...');
        Test.assertIsEqual(results[1].includes('SERVICE=WMS'), true);
        Test.assertIsEqual(results[1].includes('service=wms'), false);
      }
    );
  }

  // #endregion

  // #region getExtentIntersection()

  /**
   * Tests GeoUtilities.getExtentIntersection() computes intersection.
   *
   * @returns A promise that resolves when the test completes
   */
  testGetExtentIntersection(): Promise<Test<(Extent | undefined)[]>> {
    return this.test(
      'Test GeoUtilities.getExtentIntersection() computes intersection...',
      (test) => {
        test.addStep('Computing extent intersections...');
        const extentA: Extent = [-100, 40, -80, 50];
        const extentB: Extent = [-90, 45, -70, 55];
        const extentC: Extent = [-60, 60, -50, 70];
        return [
          GeoUtilities.getExtentIntersection(extentA, extentB),
          GeoUtilities.getExtentIntersection(extentA, extentC),
          GeoUtilities.getExtentIntersection(extentA, undefined),
        ];
      },
      (test, results) => {
        test.addStep('Verifying intersection of overlapping extents...');
        Test.assertIsDefined('intersection', results[0]);
        Test.assertIsEqual(results[0][0], -90);
        Test.assertIsEqual(results[0][1], 45);
        Test.assertIsEqual(results[0][2], -80);
        Test.assertIsEqual(results[0][3], 50);

        test.addStep('Verifying non-overlapping extents return degenerate extent...');
        Test.assertIsDefined('noOverlap', results[1]);
        Test.assertIsEqual(results[1][0], -60);
        Test.assertIsEqual(results[1][1], 60);
        Test.assertIsEqual(results[1][2], -80);
        Test.assertIsEqual(results[1][3], 50);

        test.addStep('Verifying undefined extentB returns extentA...');
        Test.assertIsDefined('undefinedInput', results[2]);
        Test.assertIsEqual(results[2][0], -100);
        Test.assertIsEqual(results[2][1], 40);
        Test.assertIsEqual(results[2][2], -80);
        Test.assertIsEqual(results[2][3], 50);
      }
    );
  }

  // #endregion
}
