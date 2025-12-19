import { GVAbstractTester } from './abstract-gv-tester';
import type { ClassType } from 'geoview-core/core/types/global-types';
import { Test } from '../core/test';
import type { MapConfigLayerEntry, TypeGeoviewLayerConfig, TypeGeoviewLayerType } from 'geoview-core/api/types/layer-schema-types';
import { LayerNoCapabilitiesError, LayerServiceMetadataUnableToFetchError } from 'geoview-core/core/exceptions/layer-exceptions';
import { EsriDynamic } from 'geoview-core/geo/layer/geoview-layers/raster/esri-dynamic';
import { EsriFeature } from 'geoview-core/geo/layer/geoview-layers/vector/esri-feature';
import { EsriImage } from 'geoview-core/geo/layer/geoview-layers/raster/esri-image';
import { WMS } from 'geoview-core/geo/layer/geoview-layers/raster/wms';
import { WFS } from 'geoview-core/geo/layer/geoview-layers/vector/wfs';
import { GeoJSON } from 'geoview-core/geo/layer/geoview-layers/vector/geojson';
import { CSV } from 'geoview-core/geo/layer/geoview-layers/vector/csv';
import { OgcFeature } from 'geoview-core/geo/layer/geoview-layers/vector/ogc-feature';
import { WKB } from 'geoview-core/geo/layer/geoview-layers/vector/wkb';
import { KML } from 'geoview-core/geo/layer/geoview-layers/vector/kml';
import { GeoTIFF } from 'geoview-core/geo/layer/geoview-layers/raster/geotiff';
import { EsriImageLayerEntryConfig } from 'geoview-core/api/config/validation-classes/raster-validation-classes/esri-image-layer-entry-config';
import { EsriFeatureLayerEntryConfig } from 'geoview-core/api/config/validation-classes/vector-validation-classes/esri-feature-layer-entry-config';
import { EsriDynamicLayerEntryConfig } from 'geoview-core/api/config/validation-classes/raster-validation-classes/esri-dynamic-layer-entry-config';
import { GroupLayerEntryConfig } from 'geoview-core/api/config/validation-classes/group-layer-entry-config';
import { OgcWmsLayerEntryConfig } from 'geoview-core/api/config/validation-classes/raster-validation-classes/ogc-wms-layer-entry-config';
import { OgcWfsLayerEntryConfig } from 'geoview-core/api/config/validation-classes/vector-validation-classes/wfs-layer-entry-config';
import { GeoJSONLayerEntryConfig } from 'geoview-core/api/config/validation-classes/vector-validation-classes/geojson-layer-entry-config';
import { CsvLayerEntryConfig } from 'geoview-core/api/config/validation-classes/vector-validation-classes/csv-layer-entry-config';
import { OgcFeatureLayerEntryConfig } from 'geoview-core/api/config/validation-classes/vector-validation-classes/ogc-layer-entry-config';
import { WkbLayerEntryConfig } from 'geoview-core/api/config/validation-classes/vector-validation-classes/wkb-layer-entry-config';
import { KmlLayerEntryConfig } from 'geoview-core/api/config/validation-classes/vector-validation-classes/kml-layer-entry-config';
import { GeoTIFFLayerEntryConfig } from 'geoview-core/api/config/validation-classes/raster-validation-classes/geotiff-layer-entry-config';
import type { GeoCoreLayerConfigResponse } from 'geoview-core/api/config/geocore';
import { GeoCore } from 'geoview-core/api/config/geocore';
import { Config, getLocalizedMessage } from 'geoview-core/app';
import { logger } from 'geoview-core/core/utils/logger';

/**
 * Main Config testing class.
 * @extends {GVAbstractTester}
 */
export class ConfigTester extends GVAbstractTester {
  /**
   * Returns the name of the Tester.
   * @returns {string} The name of the Tester.
   */
  override getName(): string {
    return 'ConfigTester';
  }

  // #region ESRI DYNAMIC

  /**
   * Tests an Esri Dynamic layer configuration using Historical Flood information.
   * @returns {Promise<Test<TypeGeoviewLayerConfig>>} A Promise that resolves with a Test containing the configuration.
   */
  testEsriDynamicWithHistoricalFloodEvents(): Promise<Test<TypeGeoviewLayerConfig>> {
    // The url
    const url: string = ConfigTester.HISTORICAL_FLOOD_URL_MAP_SERVER;

    // Test the Esri Dynamic config
    return this.testEsriDynamic(
      'Test an Esri Dynamic with Historical Flood Events',
      url,
      {
        metadataAccessPath: url,
        listOfLayerEntryConfig: [{ layerEntryProps: { layerName: ConfigTester.HISTORICAL_FLOOD_LAYER_NAME } }],
      },
      EsriDynamicLayerEntryConfig
    );
  }

  /**
   * Tests an Esri Dynamic layer configuration using CESI information.
   * @returns {Promise<Test<TypeGeoviewLayerConfig>>} A Promise that resolves with a Test containing the configuration.
   */
  testEsriDynamicWithCESI(): Promise<Test<TypeGeoviewLayerConfig>> {
    // The url
    const url: string = ConfigTester.CESI_MAP_SERVER;

    // Test the Esri Dynamic config
    return this.testEsriDynamic(
      'Test an Esri Dynamic with CESI',
      url,
      {
        metadataAccessPath: url,
        listOfLayerEntryConfig: [{ layerEntryProps: { layerName: ConfigTester.CESI_GROUP_0_LAYER_NAME } }],
      },
      GroupLayerEntryConfig
    );
  }

  /**
   * Tests an Esri Dynamic Config.
   * @param {string} testName - The test name
   * @param {string} url - The url of the Esri Dynamic layer
   * @param {Record<string, unknown>} expectedConfig - The expected configuration on which the assertions will be done
   * @returns {Promise<Test<TypeGeoviewLayerConfig>>} A Promise that resolves with a Test containing the configuration.
   */
  testEsriDynamic(
    testName: string,
    url: string,
    expectedConfig: Record<string, unknown>,
    expectedTypeFirstLayerEntry: ClassType<GroupLayerEntryConfig | EsriDynamicLayerEntryConfig>
  ): Promise<Test<TypeGeoviewLayerConfig>> {
    // Dummy names
    const gvLayerId: string = 'gvLayerId';
    const gvLayerName: string = 'gvLayerName';
    const gvLayerType: TypeGeoviewLayerType = 'esriDynamic';

    // Complete the expected config by adding the geoviewLayerId and geoviewLayerName
    const expectedConfigFull = {
      ...expectedConfig,
      geoviewLayerId: gvLayerId,
      geoviewLayerName: gvLayerName,
      geoviewLayerType: gvLayerType,
    };

    // Test
    return this.test(
      testName,
      (test) => {
        // Set step
        test.addStep('Initializing config on url: ' + url);

        // Initialize the layer config
        return EsriDynamic.initGeoviewLayerConfig(gvLayerId, gvLayerName, url);
      },
      (test, result) => {
        // Perform assertions
        test.addStep('Verifying expected config...');
        Test.assertJsonObject(result, expectedConfigFull);

        // Take the first layer entry
        test.addStep('Verifying 1st layer entry config...');
        const layerEntry = result.listOfLayerEntryConfig[0];
        Test.assertIsInstance(layerEntry, expectedTypeFirstLayerEntry);
      }
    );
  }

  /**
   * Tests the behavior of an Esri Dynamic layer configuration when initialized with a bad URL.
   * This is a negative test case where the `EsriDynamic.initGeoviewLayerConfig` method is expected
   * to fail due to an unreachable or invalid service URL. The test verifies that a
   * `LayerServiceMetadataUnableToFetchError` is thrown as expected.
   * @returns {Promise<Test<LayerServiceMetadataUnableToFetchError>>}
   * A test object representing the result of the failed layer initialization attempt.
   */
  testEsriDynamicBadUrl(): Promise<Test<LayerServiceMetadataUnableToFetchError>> {
    // The bad url
    const urlBad: string = GVAbstractTester.BAD_URL;

    // Test
    return this.testError(`Test an EsriDynamic config with a bad url...`, LayerServiceMetadataUnableToFetchError, async (test) => {
      // Creating the configuration
      test.addStep('Creating the GeoView Layer Configuration...');

      // Try it and expect a fail
      await EsriDynamic.initGeoviewLayerConfig('gvLayerId', 'gvLayerName', urlBad);
    });
  }

  // #endregion ESRI DYNAMIC

  // #region ESRI FEATURE

  /**
   * Runs a test using an Esri Feature service for the Toronto Neighbourhoods layer.
   * @returns {Promise<Test<TypeGeoviewLayerConfig>>} A promise that resolves to the configured test instance.
   */
  testEsriFeatureWithTorontoNeighbourhoods(): Promise<Test<TypeGeoviewLayerConfig>> {
    // The url
    const url = ConfigTester.FEATURE_SERVER_TORONTO_NEIGHBOURHOODS_URL;

    // Test the Esri Feature config
    return this.testEsriFeature('Test an Esri Feature with Toronto Neighbourhoods', url, {
      metadataAccessPath: url,
      listOfLayerEntryConfig: [
        { layerEntryProps: { layerId: '0', layerName: ConfigTester.FEATURE_SERVER_TORONTO_NEIGHBOURHOODS_LAYER_NAME } },
      ],
    });
  }

  /**
   * Runs a test using an Esri Feature service for the Historical Flood Events layer.
   * @returns {Promise<Test<TypeGeoviewLayerConfig>>} A promise that resolves to the configured test instance.
   */
  testEsriFeatureWithHistoricalFloodEvents(): Promise<Test<TypeGeoviewLayerConfig>> {
    // The url
    const url = ConfigTester.HISTORICAL_FLOOD_URL_FEATURE_SERVER;
    const expectedUrl = ConfigTester.HISTORICAL_FLOOD_URL_MAP_SERVER;

    // Test the Esri Feature config
    return this.testEsriFeature('Test an Esri Feature with Historical Flood Events', url, {
      metadataAccessPath: expectedUrl,
      listOfLayerEntryConfig: [{ layerEntryProps: { layerId: '0', layerName: ConfigTester.HISTORICAL_FLOOD_LAYER_NAME } }],
    });
  }

  /**
   * Runs a test using an Esri Feature service for the Forest Industry layer.
   * @returns {Promise<Test<TypeGeoviewLayerConfig>>} A promise that resolves to the configured test instance.
   */
  testEsriFeatureWithForestIndustry(): Promise<Test<TypeGeoviewLayerConfig>> {
    // The url
    const url = ConfigTester.FOREST_INDUSTRY_FEATURE_SERVER;
    const expectedUrl = ConfigTester.FOREST_INDUSTRY_MAP_SERVER;

    // Test the Esri Feature config
    return this.testEsriFeature('Test an Esri Feature with Forest Industry', url, {
      metadataAccessPath: expectedUrl,
      listOfLayerEntryConfig: [{ layerEntryProps: { layerId: '0', layerName: ConfigTester.FOREST_INDUSTRY_LAYER_NAME } }],
    });
  }

  /**
   * Tests an Esri Feature Config.
   * @param {string} testName - The test name
   * @param {string} url - The url of the Esri Feature layer
   * @param {Record<string, unknown>} expectedConfig - The expected configuration on which the assertions will be done
   * @returns {Promise<Test<TypeGeoviewLayerConfig>>} A Promise that resolves with a Test containing the configuration.
   */
  testEsriFeature(testName: string, url: string, expectedConfig: Record<string, unknown>): Promise<Test<TypeGeoviewLayerConfig>> {
    // Dummy names
    const gvLayerId: string = 'gvLayerId';
    const gvLayerName: string = 'gvLayerName';
    const gvLayerType: TypeGeoviewLayerType = 'esriFeature';

    // Complete the expected config by adding the geoviewLayerId and geoviewLayerName
    const expectedConfigFull = {
      ...expectedConfig,
      geoviewLayerId: gvLayerId,
      geoviewLayerName: gvLayerName,
      geoviewLayerType: gvLayerType,
    };

    // Test
    return this.test(
      testName,
      (test) => {
        // Set step
        test.addStep('Initializing config on url: ' + url);

        // Initialize the layer config
        return EsriFeature.initGeoviewLayerConfig(gvLayerId, gvLayerName, url);
      },
      (test, result) => {
        // Perform assertions
        test.addStep('Verifying expected config...');
        Test.assertJsonObject(result, expectedConfigFull);

        // Take the first layer entry
        test.addStep('Verifying 1st layer entry config...');
        const layerEntry = result.listOfLayerEntryConfig[0];
        Test.assertIsInstance(layerEntry, EsriFeatureLayerEntryConfig);
      }
    );
  }

  /**
   * Tests the behavior of an Esri Feature layer configuration when initialized with a bad URL.
   * This is a negative test case where the `EsriFeature.initGeoviewLayerConfig` method is expected
   * to fail due to an unreachable or invalid service URL. The test verifies that a
   * `LayerServiceMetadataUnableToFetchError` is thrown as expected.
   * @returns {Promise<Test<LayerServiceMetadataUnableToFetchError>>}
   * A test object representing the result of the failed layer initialization attempt.
   */
  testEsriFeatureBadUrl(): Promise<Test<LayerServiceMetadataUnableToFetchError>> {
    // The bad url
    const urlBad: string = GVAbstractTester.BAD_URL;

    // Test
    return this.testError(`Test an EsriFeature config with a bad url...`, LayerServiceMetadataUnableToFetchError, async (test) => {
      // Creating the configuration
      test.addStep('Creating the GeoView Layer Configuration...');

      // Try it and expect a fail
      await EsriFeature.initGeoviewLayerConfig('gvLayerId', 'gvLayerName', urlBad);
    });
  }

  // #endregion ESRI FEATURE

  // #region ESRI IMAGE

  /**
   * Tests an Esri Image using the Elevation Image Server service.
   * @returns
   */
  testEsriImageWithElevation(): Promise<Test<TypeGeoviewLayerConfig>> {
    // The url
    const url = ConfigTester.IMAGE_SERVER_ELEVATION_URL;

    // Test the Esri Image config
    return this.testEsriImage('Test Esri Image with Elevation', url, {
      metadataAccessPath: url,
      listOfLayerEntryConfig: [{ layerEntryProps: { layerId: ConfigTester.IMAGE_SERVER_ELEVATION_LAYER_ID } }],
    });
  }

  /**
   * Tests an Esri Image Config.
   * @param {string} testName - The test name
   * @param {string} url - The url of the Esri Image layer
   * @param {Record<string, unknown>} expectedConfig - The expected configuration on which the assertions will be done
   * @returns {Promise<Test<TypeGeoviewLayerConfig>>} A Promise that resolves with a Test containing the configuration.
   */
  testEsriImage(testName: string, url: string, expectedConfig: Record<string, unknown>): Promise<Test<TypeGeoviewLayerConfig>> {
    // Dummy names
    const gvLayerId: string = 'gvLayerId';
    const gvLayerName: string = 'gvLayerName';
    const gvLayerType: TypeGeoviewLayerType = 'esriImage';

    // Complete the expected config by adding the geoviewLayerId and geoviewLayerName
    const expectedConfigFull = {
      ...expectedConfig,
      geoviewLayerId: gvLayerId,
      geoviewLayerName: gvLayerName,
      geoviewLayerType: gvLayerType,
    };

    // Test
    return this.test(
      testName,
      (test) => {
        // Set step
        test.addStep('Initializing config on url: ' + url);

        // Initialize the layer config
        return EsriImage.initGeoviewLayerConfig(gvLayerId, gvLayerName, url);
      },
      (test, result) => {
        // Perform assertions
        test.addStep('Verifying expected config...');
        Test.assertJsonObject(result, expectedConfigFull);

        // Take the first layer entry
        test.addStep('Verifying 1st layer entry config...');
        const layerEntry = result.listOfLayerEntryConfig[0];
        Test.assertIsInstance(layerEntry, EsriImageLayerEntryConfig);
      }
    );
  }

  /**
   * Tests the behavior of initializing an Esri Image layer configuration using an invalid metadata URL.
   * This test verifies that when an Esri Image layer configuration is initialized with an invalid or unreachable
   * metadata URL, the initialization process fails as expected and throws a
   * {@link LayerServiceMetadataUnableToFetchError}.
   * @returns {Promise<Test<LayerServiceMetadataUnableToFetchError>>}
   * A promise that resolves with the test result, expecting a `LayerServiceMetadataUnableToFetchError`.
   */
  testEsriImageBadUrl(): Promise<Test<LayerServiceMetadataUnableToFetchError>> {
    // The bad url
    const urlBad: string = GVAbstractTester.BAD_URL;

    // Test
    return this.testError(`Test an EsriImage config with a bad url...`, LayerServiceMetadataUnableToFetchError, async (test) => {
      // Creating the configuration
      test.addStep('Creating the GeoView Layer Configuration...');

      // Try it and expect a fail
      await EsriImage.initGeoviewLayerConfig('gvLayerId', 'gvLayerName', urlBad);
    });
  }

  // #endregion ESRI IMAGE

  // #region WMS

  /**
   * Tests an WMS Config using OWS Mundialis.
   * @returns {Promise<Test<TypeGeoviewLayerConfig>>} A Promise that resolves with a Test containing the configuration.
   */
  testWMSLayerWithOWSMundialis(): Promise<Test<TypeGeoviewLayerConfig>> {
    // The url
    const url = ConfigTester.OWS_MUNDIALIS;

    // Dummy names
    const gvLayerId: string = 'gvLayerId';
    const gvLayerType: TypeGeoviewLayerType = 'ogcWms';
    const gvLayerName: string = 'OpenStreetMap WMS';
    const fullSubLayers: boolean = false;

    // Expected config
    const expectedConfig = {
      geoviewLayerId: gvLayerId,
      geoviewLayerType: gvLayerType,
      geoviewLayerName: gvLayerName,
    };

    // Test the Esri Feature config
    return this.test(
      'Test a WMS with OWS Mundialis',
      (test) => {
        // Set step
        test.addStep('Initializing config on url: ' + url);

        // Initialize the layer config
        return WMS.initGeoviewLayerConfig(gvLayerId, gvLayerName, url, fullSubLayers);
      },
      (test, result) => {
        // Perform assertions
        test.addStep('Verifying expected config...');
        Test.assertJsonObject(result, expectedConfig);

        // Supposedly 11 layer entries
        test.addStep('Verifying 11 layer entries in the config...');
        Test.assertIsArrayLengthEqual(result.listOfLayerEntryConfig, 11);

        // Take the first layer entry
        test.addStep('Verifying 1st layer entry config...');
        const layerEntry = result.listOfLayerEntryConfig[0];
        Test.assertIsInstance(layerEntry, OgcWmsLayerEntryConfig);
        Test.assertIsEqual(layerEntry.layerId, 'OSM-WMS');
      }
    );
  }

  /**
   * Tests an WMS Config using Datacube MSI.
   * @returns {Promise<Test<TypeGeoviewLayerConfig>>} A Promise that resolves with a Test containing the configuration.
   */
  testWMSLayerWithDatacubeMSI(): Promise<Test<TypeGeoviewLayerConfig>> {
    // The url
    const url = GVAbstractTester.DATACUBE_MSI;

    // Dummy names
    const gvLayerId: string = 'gvLayerId';
    const gvLayerType: TypeGeoviewLayerType = 'ogcWms';
    const gvLayerName: string = 'Layers / Couches';
    const fullSubLayers: boolean = false;

    // Expected config
    const expectedConfig = {
      geoviewLayerId: gvLayerId,
      geoviewLayerType: gvLayerType,
      geoviewLayerName: gvLayerName,
    };

    // Test the WMS
    return this.test(
      'Test a WMS with Datacube MSI',
      (test) => {
        // Set step
        test.addStep('Initializing config on url: ' + url);

        // Initialize the layer config
        return WMS.initGeoviewLayerConfig(gvLayerId, gvLayerName, url, fullSubLayers);
      },
      (test, result) => {
        // Perform assertions
        test.addStep('Verifying expected config...');
        Test.assertJsonObject(result, expectedConfig);

        // Supposedly 2 layer entries
        test.addStep('Verifying 2 layer entries in the config...');
        Test.assertIsArrayLengthEqual(result.listOfLayerEntryConfig, 2);

        // Take the first layer entry
        test.addStep('Verifying 1st layer entry...');
        const layerEntryFirst = result.listOfLayerEntryConfig[0];
        Test.assertIsInstance(layerEntryFirst, OgcWmsLayerEntryConfig);
        Test.assertIsEqual(layerEntryFirst.layerId, GVAbstractTester.DATACUBE_MSI_LAYER_NAME_MSI);

        // Take the second layer entry
        test.addStep('Verifying 2nd layer entry...');
        const layerEntrySecond = result.listOfLayerEntryConfig[1];
        Test.assertIsInstance(layerEntrySecond, OgcWmsLayerEntryConfig);
        Test.assertIsEqual(layerEntrySecond.layerId, GVAbstractTester.DATACUBE_MSI_LAYER_NAME_MSI_OR_MORE);
      }
    );
  }

  /**
   * Tests the behavior of initializing a WMS layer configuration using an invalid metadata URL.
   * This test verifies that when a WMS layer configuration is initialized with an invalid or unreachable
   * metadata URL, the initialization process fails as expected and throws a
   * {@link LayerNoCapabilitiesError}.
   * @returns {Promise<Test<LayerNoCapabilitiesError>>}
   * A promise that resolves with the test result, expecting a `LayerNoCapabilitiesError`.
   */
  testWMSBadUrl(): Promise<Test<LayerNoCapabilitiesError>> {
    // GV: In the case of a WMS, since a proxy is used when the url fails, and that proxy always returns a 200 response (with an internal error inside)
    // GV: We can't really test the LayerServiceMetadataUnableToFetchError error exception.

    // The bad url
    const urlBad: string = GVAbstractTester.BAD_URL;

    // Test
    return this.testError(`Test a WMS config with a bad url...`, LayerServiceMetadataUnableToFetchError, async (test) => {
      // Creating the configuration
      test.addStep('Creating the GeoView Layer Configuration...');

      // Try it and expect a fail
      await WMS.initGeoviewLayerConfig('gvLayerId', 'gvLayerName', urlBad, false);
    });
  }

  // #endregion WMS

  // #region WFS

  /**
   * Tests an WFS Config using Geomet Current Conditions layer.
   * @returns {Promise<Test<TypeGeoviewLayerConfig>>} A Promise that resolves with a Test containing the configuration.
   */
  testWFSLayerWithGeometCurrentConditions(): Promise<Test<TypeGeoviewLayerConfig>> {
    // The url
    const url = GVAbstractTester.GEOMET_URL;

    // Dummy names
    const gvLayerId: string = 'gvLayerId';
    const gvLayerType: TypeGeoviewLayerType = 'ogcWfs';
    const gvLayerName: string = 'Current Conditions';

    // Expected config
    const expectedConfig = {
      geoviewLayerId: gvLayerId,
      geoviewLayerType: gvLayerType,
      geoviewLayerName: gvLayerName,
    };

    // Test the WMS
    return this.test(
      'Test a WFS with Geomet Current Conditions',
      (test) => {
        // Set step
        test.addStep('Initializing config on url: ' + url);

        // Initialize the layer config
        return WFS.initGeoviewLayerConfig(gvLayerId, gvLayerName, url);
      },
      (test, result) => {
        // Perform assertions
        test.addStep('Verifying expected config...');
        Test.assertJsonObject(result, expectedConfig);

        // Supposedly 92 layer entries
        test.addStep('Verifying 92 layer entries in the config...');
        Test.assertIsArrayLengthEqual(result.listOfLayerEntryConfig, 92);

        // Check at least one has the correct layerId
        test.addStep('Verifying Current Conditions in the list...');
        const foundLayerEntry = result.listOfLayerEntryConfig.find(
          (layerEntry) => layerEntry.layerId === GVAbstractTester.GEOMET_URL_CURRENT_COND_LAYER_ID
        );
        Test.assertIsDefined('listOfLayerEntryConfig with Current Conditions', foundLayerEntry);

        // Check it's the right type
        test.addStep('Verifying layer entry is of the right type...');
        Test.assertIsInstance(foundLayerEntry, OgcWfsLayerEntryConfig);
      }
    );
  }

  /**
   * Tests the behavior of initializing a WFS layer configuration using an invalid metadata URL.
   * This test verifies that when a WFS layer configuration is initialized with an invalid or unreachable
   * metadata URL, the initialization process fails as expected and throws a
   * {@link LayerServiceMetadataUnableToFetchError}.
   * @returns {Promise<Test<LayerServiceMetadataUnableToFetchError>>}
   * A promise that resolves with the test result, expecting a `LayerServiceMetadataUnableToFetchError`.
   */
  testWFSBadUrl(): Promise<Test<LayerServiceMetadataUnableToFetchError>> {
    // The bad url
    const urlBad: string = GVAbstractTester.BAD_URL;

    // Test
    return this.testError(`Test a WFS config with a bad url...`, LayerServiceMetadataUnableToFetchError, async (test) => {
      // Creating the configuration
      test.addStep('Creating the GeoView Layer Configuration...');

      // Try it and expect a fail
      await WFS.initGeoviewLayerConfig('gvLayerId', 'gvLayerName', urlBad);
    });
  }

  /**
   * Tests the behavior of initializing a WFS layer configuration using a 'valid' URL, but without a GetCapabilities response.
   * This test verifies that when a WFS layer configuration is initialized and the initialization process fails as expected and throws a
   * {@link getcaoa}.
   * @returns {Promise<Test<LayerNoCapabilitiesError>>}
   * A promise that resolves with the test result, expecting a `LayerNoCapabilitiesError`.
   */
  testWFSOkayUrlNoCap(): Promise<Test<LayerNoCapabilitiesError>> {
    // The bad url which still respond something (not a 404, 500, etc)
    const urlBad: string = GVAbstractTester.FAKE_URL_ALWAYS_RETURNING_RESPONSE_INSTEAD_OF_NETWORK_ERROR;

    // Test
    return this.testError(`Test a WFS config with a okay url but no capabilities...`, LayerNoCapabilitiesError, async (test) => {
      // Creating the configuration
      test.addStep('Creating the GeoView Layer Configuration...');

      // Try it and expect a fail
      await WFS.initGeoviewLayerConfig('gvLayerId', 'gvLayerName', urlBad);
    });
  }

  // #endregion WFS

  // #region GeoJSON

  /**
   * Tests a GeoJson Config using datasets/geojson/metadata.meta file.
   * @returns {Promise<Test<TypeGeoviewLayerConfig>>} A Promise that resolves with a Test containing the configuration.
   */
  testGeojsonWithMetadataMeta(): Promise<Test<TypeGeoviewLayerConfig>> {
    // The url
    const url = GVAbstractTester.GEOJSON_METADATA_META;

    // Dummy names
    const gvLayerId: string = 'gvLayerId';
    const gvLayerType: TypeGeoviewLayerType = 'GeoJSON';
    const gvLayerName: string = 'GeojsonLayer';

    // Expected config
    const expectedConfig = {
      geoviewLayerId: gvLayerId,
      geoviewLayerType: gvLayerType,
      geoviewLayerName: gvLayerName,
    };

    // Test the WMS
    return this.test(
      'Test a Geojson with metadata.meta file',
      (test) => {
        // Set step
        test.addStep('Initializing config on url: ' + url);

        // Initialize the layer config
        return GeoJSON.initGeoviewLayerConfig(gvLayerId, gvLayerName, url);
      },
      (test, result) => {
        // Perform assertions
        test.addStep('Verifying expected config...');
        Test.assertJsonObject(result, expectedConfig);

        // Supposedly 1 layer entry
        test.addStep('Verifying 1 layer entry in the config...');
        Test.assertIsArrayLengthEqual(result.listOfLayerEntryConfig, 1);

        // Check at least one has the correct layerId
        test.addStep('Verifying layer id in the list...');
        Test.assertIsEqual(result.listOfLayerEntryConfig[0].layerId, GVAbstractTester.GEOJSON_METADATA_META_FILE);

        // Check it's the right type
        test.addStep('Verifying layer entry is of the right type...');
        Test.assertIsInstance(result.listOfLayerEntryConfig[0], GeoJSONLayerEntryConfig);
      }
    );
  }

  /**
   * Tests the behavior of initializing a GeoJSON layer configuration using an invalid data URL
   * that does not point to a valid metadata file.
   * This test verifies that when a GeoJSON layer configuration is initialized with an invalid or
   * unreachable URL (without a `.meta` suffix), the initialization process does not throw an error,
   * but instead correctly **skips** metadata loading as intended.
   * @returns {Promise<Test<void>>} A promise that resolves with nothing.
   */
  testGeoJSONBadUrlExpectSkip(): Promise<Test<void>> {
    // The bad url
    const urlBad: string = GVAbstractTester.BAD_URL;

    // Test
    return this.test(
      `Test a GeoJSON config with a bad url expecting a skip...`,
      async (test) => {
        // Creating the configuration
        test.addStep('Creating the GeoView Layer Configuration...');

        // Try it and expect a fail
        await GeoJSON.initGeoviewLayerConfig('gvLayerId', 'gvLayerName', urlBad);
      },
      (test) => {
        // Perform assertions
        test.addStep(`At this point, the metadata was skipped and that's as intended...`);
      }
    );
  }

  /**
   * Tests the behavior of initializing a GeoJSON layer configuration using an invalid metadata URL.
   * This test verifies that when a GeoJSON layer configuration is initialized with a metadata URL
   * ending in `.meta` that is invalid or unreachable, the initialization process correctly **fails**
   * and throws a {@link LayerServiceMetadataUnableToFetchError}.
   * @returns {Promise<Test<LayerServiceMetadataUnableToFetchError>>}
   * A promise that resolves with the test result, expecting a {@link LayerServiceMetadataUnableToFetchError}.
   */
  testGeoJSONBadUrlExpectError(): Promise<Test<LayerServiceMetadataUnableToFetchError>> {
    // The bad url ending in .meta
    const urlBad: string = 'https://badurl/oops/metadata.meta';

    // Test
    return this.testError(
      `Test a GeoJSON config with a bad url expecting a fail...`,
      LayerServiceMetadataUnableToFetchError,
      async (test) => {
        // Creating the configuration
        test.addStep('Creating the GeoView Layer Configuration...');

        // Try it and expect a fail
        await GeoJSON.initGeoviewLayerConfig('gvLayerId', 'gvLayerName', urlBad);
      }
    );
  }

  // #endregion GeoJSON

  // #region CSV

  /**
   * Tests a CSV Config using csv file.
   * @returns {Promise<Test<TypeGeoviewLayerConfig>>} A Promise that resolves with a Test containing the configuration.
   */
  testCSVWithStationList(): Promise<Test<TypeGeoviewLayerConfig>> {
    // The url
    const url = GVAbstractTester.CSV_STATION_LIST;

    // Dummy names
    const gvLayerId: string = 'gvLayerId';
    const gvLayerType: TypeGeoviewLayerType = 'CSV';
    const gvLayerName: string = 'CSVLayer';

    // Expected config
    const expectedConfig = {
      geoviewLayerId: gvLayerId,
      geoviewLayerType: gvLayerType,
      geoviewLayerName: gvLayerName,
    };

    // Test the WMS
    return this.test(
      'Test a CSV with CSV file',
      (test) => {
        // Set step
        test.addStep('Initializing config on url: ' + url);

        // Initialize the layer config
        return CSV.initGeoviewLayerConfig(gvLayerId, gvLayerName, url);
      },
      (test, result) => {
        // Perform assertions
        test.addStep('Verifying expected config...');
        Test.assertJsonObject(result, expectedConfig);

        // Supposedly 1 layer entry
        test.addStep('Verifying 1 layer entry in the config...');
        Test.assertIsArrayLengthEqual(result.listOfLayerEntryConfig, 1);

        // Check at least one has the correct layerId
        test.addStep('Verifying layer id in the list...');
        Test.assertIsEqual(result.listOfLayerEntryConfig[0].layerId, GVAbstractTester.CSV_STATION_LIST_FILE);

        // Check it's the right type
        test.addStep('Verifying layer entry is of the right type...');
        Test.assertIsInstance(result.listOfLayerEntryConfig[0], CsvLayerEntryConfig);
      }
    );
  }

  /**
   * Tests the behavior of initializing a CSV layer configuration using an invalid metadata URL.
   * This test verifies that when a CSV layer configuration is initialized with an invalid or unreachable
   * metadata URL, the initialization process fails as expected and throws a
   * {@link LayerServiceMetadataUnableToFetchError}.
   * @returns {Promise<Test<LayerServiceMetadataUnableToFetchError>>}
   * A promise that resolves with the test result, expecting a `LayerServiceMetadataUnableToFetchError`.
   */
  testCSVBadUrlExpectSkip(): Promise<Test<void>> {
    // The bad url
    const urlBad: string = GVAbstractTester.BAD_URL;

    // Test
    return this.test(
      `Test a CSV config with a bad url expecting a skip...`,
      async (test) => {
        // Creating the configuration
        test.addStep('Creating the GeoView Layer Configuration...');

        // Try it and expect a fail
        await CSV.initGeoviewLayerConfig('gvLayerId', 'gvLayerName', urlBad);
      },
      (test) => {
        // Perform assertions
        test.addStep(`At this point, the metadata was skipped and that's as intended...`);
      }
    );
  }

  // #endregion CSV

  // #region OGC Feature

  /**
   * Tests an OGC Feature Config using a Pygeoapi service.
   * @returns {Promise<Test<TypeGeoviewLayerConfig>>} A Promise that resolves with a Test containing the configuration.
   */
  testOGCFeatureWithPygeoapi(): Promise<Test<TypeGeoviewLayerConfig>> {
    // The url
    const url = GVAbstractTester.PYGEOAPI_B6RYUVAKK5;

    // Dummy names
    const gvLayerId: string = 'gvLayerId';
    const gvLayerType: TypeGeoviewLayerType = 'ogcFeature';
    const gvLayerName: string = 'OGCLayer';

    // Expected config
    const expectedConfig = {
      geoviewLayerId: gvLayerId,
      geoviewLayerType: gvLayerType,
      geoviewLayerName: gvLayerName,
    };

    // Test the WMS
    return this.test(
      'Test an OGC Feature with Pygeoapi',
      (test) => {
        // Set step
        test.addStep('Initializing config on url: ' + url);

        // Initialize the layer config
        return OgcFeature.initGeoviewLayerConfig(gvLayerId, gvLayerName, url);
      },
      (test, result) => {
        // Perform assertions
        test.addStep('Verifying expected config...');
        Test.assertJsonObject(result, expectedConfig);

        // Supposedly 1 layer entry
        test.addStep('Verifying 2 layer entry in the config...');
        Test.assertIsArrayLengthEqual(result.listOfLayerEntryConfig, 2);

        // Check at least one has the correct layerId
        test.addStep('Verifying layer id in the list...');
        Test.assertIsEqual(result.listOfLayerEntryConfig[0].layerId, GVAbstractTester.PYGEOAPI_B6RYUVAKK5_LAKES);

        // Check it's the right type
        test.addStep('Verifying layer entry is of the right type...');
        Test.assertIsInstance(result.listOfLayerEntryConfig[0], OgcFeatureLayerEntryConfig);
      }
    );
  }

  /**
   * Tests the behavior of initializing an OGC Feature layer configuration using an invalid metadata URL.
   * This test verifies that when an OGC Feature layer configuration is initialized with an invalid or unreachable
   * metadata URL, the initialization process fails as expected and throws a
   * {@link LayerServiceMetadataUnableToFetchError}.
   * @returns {Promise<Test<LayerServiceMetadataUnableToFetchError>>}
   * A promise that resolves with the test result, expecting a `LayerServiceMetadataUnableToFetchError`.
   */
  testOGCFeatureBadUrl(): Promise<Test<LayerServiceMetadataUnableToFetchError>> {
    // The bad url
    const urlBad: string = GVAbstractTester.BAD_URL;

    // Test
    return this.testError(`Test an OGC Feature config with a bad url...`, LayerServiceMetadataUnableToFetchError, async (test) => {
      // Creating the configuration
      test.addStep('Creating the GeoView Layer Configuration...');

      // Try it and expect a fail
      await OgcFeature.initGeoviewLayerConfig('gvLayerId', 'gvLayerName', urlBad);
    });
  }

  // #endregion OGC Feature

  // #region WKB

  /**
   * Tests a WKB using South Africa.
   * @returns {Promise<Test<TypeGeoviewLayerConfig>>} A Promise that resolves with a Test containing the configuration.
   */
  testWKBWithSouthAfrica(): Promise<Test<TypeGeoviewLayerConfig>> {
    // The url
    const url = GVAbstractTester.WKB_SOUTH_AFRICA;

    // Dummy names
    const gvLayerId: string = 'gvLayerId';
    const gvLayerType: TypeGeoviewLayerType = 'WKB';
    const gvLayerName: string = 'WKBLayer';

    // Expected config
    const expectedConfig = {
      geoviewLayerId: gvLayerId,
      geoviewLayerType: gvLayerType,
      geoviewLayerName: gvLayerName,
    };

    // Test the WMS
    return this.test(
      'Test a WKB with South Africa',
      (test) => {
        // Set step
        test.addStep('Initializing config on url: ' + url);

        // Initialize the layer config
        return WKB.initGeoviewLayerConfig(gvLayerId, gvLayerName, url);
      },
      (test, result) => {
        // Perform assertions
        test.addStep('Verifying expected config...');
        Test.assertJsonObject(result, expectedConfig);

        // Supposedly 1 layer entry
        test.addStep('Verifying 1 layer entry in the config...');
        Test.assertIsArrayLengthEqual(result.listOfLayerEntryConfig, 1);

        // Check at least one has the correct layerId
        test.addStep('Verifying layer id in the list...');
        Test.assertIsEqual(result.listOfLayerEntryConfig[0].layerId, GVAbstractTester.WKB_SOUTH_AFRICA);

        // Check it's the right type
        test.addStep('Verifying layer entry is of the right type...');
        Test.assertIsInstance(result.listOfLayerEntryConfig[0], WkbLayerEntryConfig);
      }
    );
  }

  /**
   * Tests the behavior of initializing a WKB GeoView layer configuration using an invalid metadata URL.
   * This test verifies that when a WKB layer configuration is initialized with an invalid or unreachable
   * metadata URL, the initialization process fails as expected and throws a
   * {@link LayerServiceMetadataUnableToFetchError}.
   * @returns {Promise<Test<LayerServiceMetadataUnableToFetchError>>}
   * A promise that resolves with the test result, expecting a `LayerServiceMetadataUnableToFetchError`.
   */
  testWKBBadUrlExpectFail(): Promise<Test<LayerServiceMetadataUnableToFetchError>> {
    // The bad url
    const urlBad: string = 'https://badurl/oops/metadata.meta';

    // Test
    return this.testError(`Test a WKB config with a bad url...`, LayerServiceMetadataUnableToFetchError, async (test) => {
      // Creating the configuration
      test.addStep('Creating the GeoView Layer Configuration...');

      // Try it and expect a fail
      await WKB.initGeoviewLayerConfig('gvLayerId', 'gvLayerName', urlBad);
    });
  }

  // #endregion WKB

  // #region KML

  /**
   * Tests a KML using Tornado.
   * @returns {Promise<Test<TypeGeoviewLayerConfig>>} A Promise that resolves when the test completes successfully.
   */
  testKMLWithTornado(): Promise<Test<TypeGeoviewLayerConfig>> {
    // The url
    const url = GVAbstractTester.KML_TORNADO;

    // Dummy names
    const gvLayerId: string = 'gvLayerId';
    const gvLayerType: TypeGeoviewLayerType = 'KML';
    const gvLayerName: string = 'KMLLayer';

    // Expected config
    const expectedConfig = {
      geoviewLayerId: gvLayerId,
      geoviewLayerType: gvLayerType,
      geoviewLayerName: gvLayerName,
    };

    // Test the WMS
    return this.test(
      'Test a KML with Tornado file',
      (test) => {
        // Set step
        test.addStep('Initializing config on url: ' + url);

        // Initialize the layer config
        return KML.initGeoviewLayerConfig(gvLayerId, gvLayerName, url);
      },
      (test, result) => {
        // Perform assertions
        test.addStep('Verifying expected config...');
        Test.assertJsonObject(result, expectedConfig);

        // Supposedly 1 layer entry
        test.addStep('Verifying 1 layer entry in the config...');
        Test.assertIsArrayLengthEqual(result.listOfLayerEntryConfig, 1);

        // Check at least one has the correct layerId
        test.addStep('Verifying layer id in the list...');
        Test.assertIsEqual(result.listOfLayerEntryConfig[0].layerId, GVAbstractTester.KML_TORNADO_FILE);

        // Check it's the right type
        test.addStep('Verifying layer entry is of the right type...');
        Test.assertIsInstance(result.listOfLayerEntryConfig[0], KmlLayerEntryConfig);
      }
    );
  }

  /**
   * Tests the behavior of initializing a KML GeoView layer configuration using an invalid URL.
   * This test ensures that when the provided KML URL is invalid or unreachable, the initialization
   * process correctly skips metadata loading instead of throwing an unhandled error or proceeding incorrectly.
   * @returns {Promise<Test<void>>} A promise that resolves when the test completes successfully.
   */
  testKMLBadUrlExpectSkip(): Promise<Test<void>> {
    // The bad url
    const urlBad: string = GVAbstractTester.BAD_URL;

    // Test
    return this.test(
      `Test a KML config with a bad url expecting a skip...`,
      async (test) => {
        // Creating the configuration
        test.addStep('Creating the GeoView Layer Configuration...');

        // Try it and expect a fail
        await KML.initGeoviewLayerConfig('gvLayerId', 'gvLayerName', urlBad);
      },
      (test) => {
        // Perform assertions
        test.addStep(`At this point, the metadata was skipped and that's as intended...`);
      }
    );
  }

  // #endregion KML

  // #region GeoTIFF

  /**
   * Tests a GeoTIFF using  datacube vegetation.
   * @returns {Promise<Test<TypeGeoviewLayerConfig>>} A Promise that resolves when the test completes successfully.
   */
  testGeoTIFFWithVegetation(): Promise<Test<TypeGeoviewLayerConfig>> {
    // The url
    const url = GVAbstractTester.GEOTIFF_VEGETATION;

    // Dummy names
    const gvLayerId: string = 'gvLayerId';
    const gvLayerType: TypeGeoviewLayerType = 'GeoTIFF';
    const gvLayerName: string = 'GeoTIFFLayer';

    // Expected config
    const expectedConfig = {
      geoviewLayerId: gvLayerId,
      geoviewLayerType: gvLayerType,
      geoviewLayerName: gvLayerName,
    };

    // Test the GeoTIFF
    return this.test(
      'Test a GeoTIFF with Vegetation',
      (test) => {
        // Set step
        test.addStep('Initializing config on url: ' + url);

        // Initialize the layer config
        return GeoTIFF.initGeoviewLayerConfig(gvLayerId, gvLayerName, url);
      },
      (test, result) => {
        // Perform assertions
        test.addStep('Verifying expected config...');
        Test.assertJsonObject(result, expectedConfig);

        // Supposedly 1 layer entry
        test.addStep('Verifying 1 layer entry in the config...');
        Test.assertIsArrayLengthEqual(result.listOfLayerEntryConfig, 1);

        // Check at least one has the correct layerId
        test.addStep('Verifying layer id in the list...');
        Test.assertIsEqual(result.listOfLayerEntryConfig[0].layerId, GVAbstractTester.GEOTIFF_VEGETATION_FILE);

        // Check it's the right type
        test.addStep('Verifying layer entry is of the right type...');
        Test.assertIsInstance(result.listOfLayerEntryConfig[0], GeoTIFFLayerEntryConfig);
      }
    );
  }

  /**
   * Tests the behavior of initializing a KML GeoView layer configuration using an invalid URL.
   * This test ensures that when the provided KML URL is invalid or unreachable, the initialization
   * process correctly skips metadata loading instead of throwing an unhandled error or proceeding incorrectly.
   * @returns {Promise<Test<void>>} A promise that resolves when the test completes successfully.
   */
  testGeoTIFFBadUrlExpectSkip(): Promise<Test<void>> {
    // The bad url
    const urlBad: string = GVAbstractTester.BAD_URL;

    // Test
    return this.test(
      `Test a GeoTIFF config with a bad url expecting a skip...`,
      async (test) => {
        // Creating the configuration
        test.addStep('Creating the GeoView Layer Configuration...');

        // Try it and expect a fail
        await GeoTIFF.initGeoviewLayerConfig('gvLayerId', 'gvLayerName', urlBad);
      },
      (test) => {
        // Perform assertions
        test.addStep(`At this point, the metadata was skipped and that's as intended...`);
      }
    );
  }

  // #endregion GeoTIFF

  // #region Geocore

  /**
   * Tests the Geocore service using Airborne Radioactivity information.
   * @returns {Promise<Test<GeoCoreLayerConfigResponse>>} A Promise that resolves with the Test containing the response from Geocore.
   */
  testStandaloneGeocoreWithAirborne(): Promise<Test<GeoCoreLayerConfigResponse>> {
    // The values
    const uuid = GVAbstractTester.AIRBORNE_RADIOACTIVITY_UUID;
    const language = 'en';
    const expectedConfig = {
      config: {
        geoviewLayerId: GVAbstractTester.AIRBORNE_RADIOACTIVITY_UUID,
        geoviewLayerType: 'esriDynamic',
        geoviewLayerName: GVAbstractTester.AIRBORNE_RADIOACTIVITY_LAYER_GROUP_NAME,
      },
      geocharts: {
        [GVAbstractTester.AIRBORNE_RADIOACTIVITY_UUID_WITH_SUFFIX]: {
          layers: [],
          chart: 'line',
        },
      },
    };

    // Perform the test
    return this.test(
      'Test Geocore with Airborne',
      () => {
        // Create a layer config from UUID using Geocore
        return GeoCore.createLayerConfigFromUUID(uuid, language, undefined, undefined);
      },
      (test, result) => {
        // Perform assertions
        test.addStep('Verifying expected geoview geocore config...');
        Test.assertJsonObject(result, expectedConfig);
      }
    );
  }

  // #endregion Geocore

  // #region Settings

  /**
   * Tests the settings cascade properly to the sublayers.
   * @returns {Promise<Test<MapConfigLayerEntry>>} A Promise that resolves with the Test containing the response from Geocore.
   */
  testSettingsCascadeToSublayers(): Promise<Test<MapConfigLayerEntry>> {
    // The values
    const config = GVAbstractTester.INITIAL_SETTINGS_CONFIG;

    // Expected config
    const expectedResults = {
      geoviewLayer: { highlight: false, zoom: false },
      group: { highlight: false, remove: false, zoom: false },
      child: { highlight: true, remove: false, zoom: false },
    };

    // Perform the test
    return this.test(
      'Test Settings Cascade to Sublayers',
      () => {
        // Use the config to convert simplified layer config into proper layer config
        const configObj = Config.initializeMapConfig(
          this.getMapId(),
          [config as unknown as MapConfigLayerEntry],
          (errorKey: string, params: string[]) => {
            // Get the message for the logger
            const message = getLocalizedMessage('en', errorKey, params);

            // Log it
            logger.logWarning(`- Map ${this.getMapId()}: ${message}`);

            // Show the error using its key (which will get translated)
            this.getMapViewer().notifications.showError(errorKey, params);
          }
        );

        if (!configObj || !configObj[0]) {
          throw new Error('Failed to initialize map config');
        }

        return configObj[0];
      },
      (test, result) => {
        // Perform assertions on specific properties only
        test.addStep('Verifying geoview layer controls...');
        Test.assertJsonObject(result.initialSettings?.controls, expectedResults.geoviewLayer);

        test.addStep('Verifying group layer controls...');
        Test.assertJsonObject(result.listOfLayerEntryConfig?.[0].getInitialSettings()?.controls, expectedResults.group);

        test.addStep('Verifying child layer controls...');
        Test.assertJsonObject(
          result.listOfLayerEntryConfig?.[0].listOfLayerEntryConfig?.[0].getInitialSettings()?.controls,
          expectedResults.child
        );
      }
    );
  }

  // #endregion Settings
}
