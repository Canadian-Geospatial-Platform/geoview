import type { PingResult } from 'geoview-core/core/utils/utilities';
import { validateAndPingUrl, validateAndPingUrlOGC } from 'geoview-core/core/utils/utilities';
import type { TypeLayerStyleConfig, TypePolygonVectorConfig } from 'geoview-core/api/types/map-schema-types';
import type {
  TypeMetadataWMSCapabilities,
  TypeMetadataWFSCapabilities,
  TypeMetadataWMTSCapabilities,
} from 'geoview-core/api/types/layer-schema-types';
import { GeoviewRenderer } from 'geoview-core/geo/utils/renderer/geoview-renderer';
import { GeoUtilities, type FetchWithProxyResult } from 'geoview-core/geo/utils/utilities';

import { Test } from '../core/test';
import { GVAbstractTester } from './abstract-gv-tester';
import { NetworkError } from 'geoview-core/core/exceptions/core-exceptions';

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

  // #region VALIDATE AND PING URL (SIMPLE)

  /**
   * Tests validateAndPingUrl (simple) with a directly reachable URL.
   *
   * Uses the Historical Flood MapServer URL which responds to HEAD with 2xx.
   * Asserts that the simple ping succeeds without needing OGC fallback.
   *
   * @returns A promise that resolves when the test completes
   */
  testSimplePingValidReachable(): Promise<Test<PingResult>> {
    return this.test(
      `Test validateAndPingUrl (simple) with a directly reachable URL...`,
      async (test) => {
        const url = GVAbstractTester.HISTORICAL_FLOOD_URL_MAP_SERVER;
        test.addStep(`Simple pinging valid reachable URL: ${url}...`);
        const result = await validateAndPingUrl(url);
        return result;
      },
      (test, result) => {
        test.addStep('Verifying isValid is true...');
        Test.assertIsEqual(result.isValid, true);

        test.addStep('Verifying isReachable is true...');
        Test.assertIsEqual(result.isReachable, true);

        test.addStep('Verifying needsProxy is false...');
        Test.assertIsEqual(result.needsProxy, false);

        test.addStep('Verifying no error message...');
        Test.assertIsUndefined('error', result.error);
      }
    );
  }

  /**
   * Tests validateAndPingUrl (simple) with an XYZ tile URL template.
   *
   * Verifies that XYZ placeholder tokens ({z}, {x}, {y}) are resolved before pinging.
   * Uses the OpenStreetMap tile server which is publicly reachable.
   *
   * @returns A promise that resolves when the test completes
   */
  testSimplePingXyzTileUrl(): Promise<Test<PingResult>> {
    return this.test(
      `Test validateAndPingUrl (simple) with an XYZ tile URL template...`,
      async (test) => {
        const url = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
        test.addStep(`Simple pinging XYZ tile URL: ${url}...`);
        const result = await validateAndPingUrl(url);
        return result;
      },
      (test, result) => {
        test.addStep('Verifying isValid is true (XYZ placeholders resolved)...');
        Test.assertIsEqual(result.isValid, true);

        test.addStep('Verifying isReachable is true...');
        Test.assertIsEqual(result.isReachable, true);

        test.addStep('Verifying needsProxy is false...');
        Test.assertIsEqual(result.needsProxy, false);
      }
    );
  }

  /**
   * Tests validateAndPingUrl (simple) with an XYZ tile URL that requires authentication.
   *
   * Uses the Gnosis Earth OGC API tile endpoint which returns 401 Unauthorized.
   * Asserts that the result has isValid=true but isReachable=false with a 401 status.
   *
   * @returns A promise that resolves when the test completes
   */
  testSimplePingXyzTileUrlUnauthorized(): Promise<Test<PingResult>> {
    return this.test(
      `Test validateAndPingUrl (simple) with an XYZ tile URL returning 401...`,
      async (test) => {
        const url = 'https://maps.gnosis.earth/ogcapi/collections/blueMarble/map/tiles/WebMercatorQuad/{z}/{x}/{y}.jpg';
        test.addStep(`Simple pinging XYZ tile URL requiring auth: ${url}...`);
        const result = await validateAndPingUrl(url);
        return result;
      },
      (test, result) => {
        test.addStep('Verifying isValid is true (URL format is valid)...');
        Test.assertIsEqual(result.isValid, true);

        test.addStep('Verifying isReachable is false (401 Unauthorized)...');
        Test.assertIsEqual(result.isReachable, false);

        test.addStep('Verifying status is 401...');
        Test.assertIsEqual(result.status, 401);

        test.addStep('Verifying error message exists...');
        Test.assertIsDefined('error', result.error);
      }
    );
  }

  // #endregion VALIDATE AND PING URL (SIMPLE)

  // #region VALIDATE AND PING URL (OGC)

  /**
   * Tests validateAndPingUrlOGC with an invalid URL format.
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
        const result = await validateAndPingUrlOGC(url);
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
   * Tests validateAndPingUrlOGC with a valid URL that is unreachable.
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
        const result = await validateAndPingUrlOGC(url);
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
   * Tests validateAndPingUrlOGC with a WMS service URL.
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
        const result = await validateAndPingUrlOGC(url);
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

  // #endregion VALIDATE AND PING URL (OGC)

  // #region LEGEND STYLES

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

  // #endregion LEGEND STYLES

  // #region GEO UTILITIES - SERVICE METADATA

  /**
   * Tests getWMSServiceMetadata with the Nonna WMS service (requires proxy due to CORS).
   *
   * Asserts that the proxy fallback is triggered and the parsed WMS capabilities contain the expected Capability structure.
   *
   * @returns A promise that resolves when the test completes
   */
  testProxyGetWMSServiceMetadata(): Promise<Test<FetchWithProxyResult<TypeMetadataWMSCapabilities>>> {
    return this.test(
      `Test GeoUtilities.getWMSServiceMetadata with Nonna WMS (proxy fallback)...`,
      (test) => {
        const url = GVAbstractTester.NONNA_WMS_URL;
        test.addStep(`Fetching WMS metadata from: ${url}...`);
        return GeoUtilities.getWMSServiceMetadata(url, this.getMapViewer().mapFeaturesConfig.serviceUrls.proxyUrl);
      },
      (test, result) => {
        test.addStep('Verifying the request indeed required a proxy');
        Test.assertIsDefined('proxyUsed', result.proxyUsed);

        test.addStep('Verifying Capability property exists...');
        Test.assertIsDefined('Capability', result.data.Capability);
      }
    );
  }

  /**
   * Tests getWMSServiceMetadata with an unreachable URL.
   *
   * Asserts that a NetworkError is thrown when the service cannot be reached even through the proxy.
   *
   * @returns A promise that resolves when the test completes
   */
  testProxyGetWMSServiceMetadataBadUrl(): Promise<Test<NetworkError>> {
    return this.testError(`Test GeoUtilities.getWMSServiceMetadata with bad URL...`, NetworkError, async (test) => {
      const url = GVAbstractTester.BAD_URL;
      test.addStep(`Fetching WMS metadata from bad URL: ${url}...`);
      await GeoUtilities.getWMSServiceMetadata(url, this.getMapViewer().mapFeaturesConfig.serviceUrls.proxyUrl);
    });
  }

  /**
   * Tests getWFSServiceMetadata with the Belgium WFS service (requires proxy due to CORS).
   *
   * Asserts that the proxy fallback is triggered and the parsed WFS capabilities contain the expected FeatureTypeList.
   *
   * @returns A promise that resolves when the test completes
   */
  testProxyGetWFSServiceMetadata(): Promise<Test<FetchWithProxyResult<TypeMetadataWFSCapabilities>>> {
    return this.test(
      `Test GeoUtilities.getWFSServiceMetadata with Belgium WFS (proxy fallback)...`,
      (test) => {
        const url = GVAbstractTester.BELGIUM_WFS_URL;
        test.addStep(`Fetching WFS metadata from: ${url}...`);
        return GeoUtilities.getWFSServiceMetadata(url, this.getMapViewer().mapFeaturesConfig.serviceUrls.proxyUrl);
      },
      (test, result) => {
        test.addStep('Verifying the request indeed required a proxy');
        Test.assertIsDefined('proxyUsed', result.proxyUsed);

        test.addStep('Verifying FeatureTypeList property exists...');
        Test.assertIsDefined('FeatureTypeList', result.data.FeatureTypeList);
      }
    );
  }

  /**
   * Tests getWFSServiceMetadata with an unreachable URL.
   *
   * Asserts that a NetworkError is thrown when the service cannot be reached even through the proxy.
   *
   * @returns A promise that resolves when the test completes
   */
  testProxyGetWFSServiceMetadataBadUrl(): Promise<Test<NetworkError>> {
    return this.testError(`Test GeoUtilities.getWFSServiceMetadata with bad URL...`, NetworkError, async (test) => {
      const url = GVAbstractTester.BAD_URL;
      test.addStep(`Fetching WFS metadata from bad URL: ${url}...`);
      await GeoUtilities.getWFSServiceMetadata(url, this.getMapViewer().mapFeaturesConfig.serviceUrls.proxyUrl);
    });
  }

  /**
   * Tests getWMTSServiceMetadata with the Taiwan WMTS service (requires proxy due to CORS).
   *
   * Asserts that the proxy fallback is triggered and the parsed WMTS capabilities contain the expected Contents structure.
   *
   * @returns A promise that resolves when the test completes
   */
  testProxyGetWMTSServiceMetadata(): Promise<Test<FetchWithProxyResult<TypeMetadataWMTSCapabilities>>> {
    return this.test(
      `Test GeoUtilities.getWMTSServiceMetadata with Taiwan WMTS service (proxy fallback)...`,
      (test) => {
        const url = GVAbstractTester.TAIWAN_WMTS_URL;
        test.addStep(`Fetching WMTS metadata from: ${url}...`);
        return GeoUtilities.getWMTSServiceMetadata(url, this.getMapViewer().mapFeaturesConfig.serviceUrls.proxyUrl);
      },
      (test, result) => {
        test.addStep('Verifying the request indeed required a proxy');
        Test.assertIsDefined('proxyUsed', result.proxyUsed);

        test.addStep('Verifying Contents property exists...');
        Test.assertIsDefined('Contents', result.data.Contents);
      }
    );
  }

  /**
   * Tests getWMTSServiceMetadata with an unreachable URL.
   *
   * Asserts that a NetworkError is thrown when the service cannot be reached even through the proxy.
   *
   * @returns A promise that resolves when the test completes
   */
  testProxyGetWMTSServiceMetadataBadUrl(): Promise<Test<NetworkError>> {
    return this.testError(`Test GeoUtilities.getWMTSServiceMetadata with bad URL...`, NetworkError, async (test) => {
      const url = GVAbstractTester.BAD_URL;
      test.addStep(`Fetching WMTS metadata from bad URL: ${url}...`);
      await GeoUtilities.getWMTSServiceMetadata(url, this.getMapViewer().mapFeaturesConfig.serviceUrls.proxyUrl);
    });
  }

  // #endregion GEO UTILITIES - SERVICE METADATA

  // #region GEO UTILITIES - FETCH WITH PROXY FALLBACK

  /**
   * Tests fetchJsonWithProxyFallback with a JSON endpoint that requires proxy due to CORS.
   *
   * Asserts that the proxy fallback is triggered and a valid JSON response is returned.
   *
   * @returns A promise that resolves when the test completes
   */
  testFetchJsonWithProxyFallback(): Promise<Test<FetchWithProxyResult<unknown>>> {
    return this.test(
      `Test GeoUtilities.fetchJsonWithProxyFallback with JSON endpoint...`,
      (test) => {
        const url = GVAbstractTester.PUBLIC_JSON_URL_CORS;
        test.addStep(`Fetching JSON metadata from: ${url}...`);
        return GeoUtilities.fetchJsonWithProxyFallback(url, this.getMapViewer().mapFeaturesConfig.serviceUrls.proxyUrl);
      },
      (test, result) => {
        test.addStep('Verifying the request indeed required a proxy');
        Test.assertIsDefined('proxyUsed', result.proxyUsed);

        test.addStep('Verifying response metadata...');
        Test.assertIsDefined('data', result.data);
      }
    );
  }

  /**
   * Tests fetchJsonWithProxyFallback with an unreachable URL.
   *
   * Asserts that a NetworkError is thrown when the endpoint cannot be reached even through the proxy.
   *
   * @returns A promise that resolves when the test completes
   */
  testFetchJsonWithProxyFallbackBadUrl(): Promise<Test<NetworkError>> {
    return this.testError(`Test GeoUtilities.fetchJsonWithProxyFallback with bad URL...`, NetworkError, async (test) => {
      const url = GVAbstractTester.BAD_URL;
      test.addStep(`Fetching JSON metadata from bad URL: ${url}...`);
      await GeoUtilities.fetchJsonWithProxyFallback<Record<string, unknown>>(
        url,
        this.getMapViewer().mapFeaturesConfig.serviceUrls.proxyUrl
      );
    });
  }

  // #endregion GEO UTILITIES - FETCH WITH PROXY FALLBACK
}
