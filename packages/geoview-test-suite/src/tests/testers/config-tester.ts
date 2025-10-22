import { GVAbstractTester } from './abstract-gv-tester';
import type { ClassType } from '../core/test';
import { Test } from '../core/test';
import type { API } from 'geoview-core/api/api';
import type { MapViewer } from 'geoview-core/geo/map/map-viewer';
import type { TypeGeoviewLayerConfig, TypeGeoviewLayerType } from 'geoview-core/api/types/layer-schema-types';
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
import { EsriImageLayerEntryConfig } from 'geoview-core/api/config/validation-classes/raster-validation-classes/esri-image-layer-entry-config';
import { EsriFeatureLayerEntryConfig } from 'geoview-core/api/config/validation-classes/vector-validation-classes/esri-feature-layer-entry-config';
import { EsriDynamicLayerEntryConfig } from 'geoview-core/api/config/validation-classes/raster-validation-classes/esri-dynamic-layer-entry-config';
import { GroupLayerEntryConfig } from 'geoview-core/api/config/validation-classes/group-layer-entry-config';
import { OgcWmsLayerEntryConfig } from 'geoview-core/api/config/validation-classes/raster-validation-classes/ogc-wms-layer-entry-config';
import { WfsLayerEntryConfig } from 'geoview-core/api/config/validation-classes/vector-validation-classes/wfs-layer-entry-config';
import { GeoJSONLayerEntryConfig } from 'geoview-core/api/config/validation-classes/vector-validation-classes/geojson-layer-entry-config';
import { CsvLayerEntryConfig } from 'geoview-core/api/config/validation-classes/vector-validation-classes/csv-layer-entry-config';
import { OgcFeatureLayerEntryConfig } from 'geoview-core/api/config/validation-classes/vector-validation-classes/ogc-layer-entry-config';
import { WkbLayerEntryConfig } from 'geoview-core/api/config/validation-classes/vector-validation-classes/wkb-layer-entry-config';
import { KmlLayerEntryConfig } from 'geoview-core/api/config/validation-classes/vector-validation-classes/kml-layer-entry-config';

/**
 * Main Config testing class.
 * @extends {GVAbstractTester}
 */
export class ConfigTester extends GVAbstractTester {
  /**
   * Constructs a ConfigTester
   * @param {API} api - The api.
   * @param {string} mapViewer - The map viewer.
   */
  constructor(api: API, mapViewer: MapViewer) {
    super('ConfigTester', api, mapViewer);
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
    expectedTypeFirstLayerEntry: ClassType
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
    const urlBad: string = 'https://badurl/oops';

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
    const url = ConfigTester.TORONTO_NEIGHBOURHOODS_FEATURE_SERVER;

    // Test the Esri Feature config
    return this.testEsriFeature('Test an Esri Feature with Toronto Neighbourhoods', url, {
      metadataAccessPath: url,
      listOfLayerEntryConfig: [{ layerEntryProps: { layerId: '0', layerName: ConfigTester.TORONTO_NEIGHBOURHOODS_LAYER_NAME } }],
    });
  }

  /**
   * Runs a test using an Esri Feature service for the Historical Flood Events layer.
   * @returns {Promise<Test<TypeGeoviewLayerConfig>>} A promise that resolves to the configured test instance.
   */
  testEsriFeatureWithHistoricalFloodEvents(): Promise<Test<TypeGeoviewLayerConfig>> {
    // The url
    const url = ConfigTester.HISTORICAL_FLOOD_URL_MAP_SERVER_0;

    // Test the Esri Feature config
    return this.testEsriFeature('Test an Esri Feature with Historical Flood Events', url, {
      metadataAccessPath: url,
      listOfLayerEntryConfig: [{ layerEntryProps: { layerId: '0', layerName: ConfigTester.HISTORICAL_FLOOD_LAYER_NAME } }],
    });
  }

  /**
   * Runs a test using an Esri Feature service for the Forest Industry layer.
   * @returns {Promise<Test<TypeGeoviewLayerConfig>>} A promise that resolves to the configured test instance.
   */
  testEsriFeatureWithForestIndustry(): Promise<Test<TypeGeoviewLayerConfig>> {
    // The url
    const url = ConfigTester.FOREST_INDUSTRY_MAP_SERVER_0;

    // Test the Esri Feature config
    return this.testEsriFeature('Test an Esri Feature with Forest Industry', url, {
      metadataAccessPath: url,
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
    const urlBad: string = 'https://badurl/oops';

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
    const url = ConfigTester.ELEVATION_IMAGE_SERVER;

    // Test the Esri Image config
    return this.testEsriImage('Test Esri Image with Elevation', url, {
      metadataAccessPath: url,
      listOfLayerEntryConfig: [{ layerEntryProps: { layerId: ConfigTester.ELEVATION_LAYER_ID } }],
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

  testEsriImageBadUrl(): Promise<Test<LayerServiceMetadataUnableToFetchError>> {
    // The bad url
    const urlBad: string = 'https://badurl/oops';

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

  testWMSBadUrl(): Promise<Test<LayerServiceMetadataUnableToFetchError>> {
    // The bad url
    const urlBad: string = 'https://badurl/oops';

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
        Test.assertIsInstance(foundLayerEntry, WfsLayerEntryConfig);
      }
    );
  }

  testWFSBadUrl(): Promise<Test<LayerServiceMetadataUnableToFetchError>> {
    // The bad url
    const urlBad: string = 'https://badurl/oops';

    // Test
    return this.testError(`Test a WFS config with a bad url...`, LayerServiceMetadataUnableToFetchError, async (test) => {
      // Creating the configuration
      test.addStep('Creating the GeoView Layer Configuration...');

      // Try it and expect a fail
      await WFS.initGeoviewLayerConfig('gvLayerId', 'gvLayerName', urlBad);
    });
  }

  testWFSOkayUrlNoCap(): Promise<Test<LayerNoCapabilitiesError>> {
    // The bad url which still respond something (not a 404, 500, etc)
    const urlBad: string = 'https://maps.canada.ca/wmsproxy/ws/wmsproxy/executeFromProxy';

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

  testGeoJSONBadUrlExpectSkip(): Promise<Test<void>> {
    // The bad url
    const urlBad: string = 'https://badurl/oops';

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

  testCSVBadUrlExpectSkip(): Promise<Test<void>> {
    // The bad url
    const urlBad: string = 'https://badurl/oops';

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

  testOGCFeatureBadUrl(): Promise<Test<LayerServiceMetadataUnableToFetchError>> {
    // The bad url
    const urlBad: string = 'https://badurl/oops';

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
   * @returns {Promise<Test<TypeGeoviewLayerConfig>>} A Promise that resolves with a Test containing the configuration.
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

  testKMLBadUrlExpectSkip(): Promise<Test<void>> {
    // The bad url
    const urlBad: string = 'https://badurl/oops';

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
}
