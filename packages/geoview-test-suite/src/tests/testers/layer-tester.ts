import { Test } from '../core/test';
import { TestError } from '../core/exceptions';
import { GVAbstractTester } from './abstract-gv-tester';
import type { API } from 'geoview-core/api/api';
import { formatError } from 'geoview-core/core/exceptions/core-exceptions';
import { LayerEntryNotSupportingProjectionError } from 'geoview-core/core/exceptions/layer-entry-config-exceptions';
import type { MapViewer } from 'geoview-core/geo/map/map-viewer';
import type { TypeGeoviewLayerConfig } from 'geoview-core/api/types/layer-schema-types';
import type { AbstractGVLayer } from 'geoview-core/geo/layer/gv-layers/abstract-gv-layer';
import { EsriDynamic } from 'geoview-core/geo/layer/geoview-layers/raster/esri-dynamic';
import { generateId } from 'geoview-core/core/utils/utilities';
import { LegendEventProcessor } from 'geoview-core/api/event-processors/event-processor-children/legend-event-processor';
import { EsriFeature } from 'geoview-core/geo/layer/geoview-layers/vector/esri-feature';
import { EsriImage } from 'geoview-core/geo/layer/geoview-layers/raster/esri-image';
import { WMS } from 'geoview-core/geo/layer/geoview-layers/raster/wms';

/**
 * Main Layer testing class.
 * @extends {GVAbstractTester}
 */
export class LayerTester extends GVAbstractTester {
  /**
   * Constructs a LayerTester
   * @param {API} api - The api.
   * @param {string} mapViewer - The map viewer.
   */
  constructor(api: API, mapViewer: MapViewer) {
    super('LayerTester', api, mapViewer);
  }

  /**
   * Tests adding an Esri Dynamic Historical Flood Events layer on the map.
   * @returns {Promise<Test<AbstractGVLayer>>} A Promise resolving when the test completes.
   */
  testAddEsriDynamicHistoFloodEvents(): Promise<Test<AbstractGVLayer>> {
    // Create a random geoview layer id
    const gvLayerId = generateId();
    const layerUrl = GVAbstractTester.HISTORICAL_FLOOD_URL_MAP_SERVER;
    const layerPath = gvLayerId + '/0';
    const gvLayerName = 'Esri Dynamic Histo Flood Events';

    // Test
    return this.test(
      `Test Adding Esri Dynamic Histo Flood Events on map...`,
      (test) => {
        // Creating the configuration
        test.addStep('Creating the GeoView Layer Configuration...');

        // Create the config
        const gvConfig = EsriDynamic.createGeoviewLayerConfig(gvLayerId, gvLayerName, layerUrl, false, [{ id: 0, index: 0 }]);

        // Redirect to helper to add the layer to the map and wait
        return LayerTester.helperStepAddLayerOnMapAndWaitForIt(gvConfig, test, this.getMapViewer(), layerPath);
      },
      (test) => {
        // Perform assertions
        // Redirect to helper to check if the layer exists
        LayerTester.helperStepAssertLayerExists(test, this.getMapViewer(), layerPath);
      },
      (test) => {
        // Redirect to helper to clean up and assert
        LayerTester.helperFinalizeStepRemoveLayerAndAssert(test, this.getMapViewer(), layerPath);
      }
    );
  }

  /**
   * Tests adding an Esri Feature Forest Industry layer on the map.
   * @returns {Promise<Test<AbstractGVLayer>>} A Promise resolving when the test completes.
   */
  testAddEsriFeatureForestIndustry(): Promise<Test<AbstractGVLayer>> {
    // Create a random geoview layer id
    const gvLayerId = generateId();
    const layerUrl = GVAbstractTester.FOREST_INDUSTRY_MAP_SERVER;
    const layerPath = gvLayerId + '/0';
    const gvLayerName = 'Esri Feature Forest Industry';

    // Test
    return this.test(
      `Test Adding Esri Feature Forest Industry on map...`,
      (test) => {
        // Creating the configuration
        test.addStep('Creating the GeoView Layer Configuration...');

        // Create the config
        const gvConfig = EsriFeature.createGeoviewLayerConfig(gvLayerId, gvLayerName, layerUrl, false, [{ id: 0, index: 0 }]);

        // Redirect to helper to add the layer to the map and wait
        return LayerTester.helperStepAddLayerOnMapAndWaitForIt(gvConfig, test, this.getMapViewer(), layerPath);
      },
      (test) => {
        // Perform assertions
        // Redirect to helper to check if the layer exists
        LayerTester.helperStepAssertLayerExists(test, this.getMapViewer(), layerPath);
      },
      (test) => {
        // Redirect to helper to clean up and assert
        LayerTester.helperFinalizeStepRemoveLayerAndAssert(test, this.getMapViewer(), layerPath);
      }
    );
  }

  /**
   * Tests adding an Esri Feature Forest Industry layer on the map.
   * @returns {Promise<Test<AbstractGVLayer>>} A Promise resolving when the test completes.
   */
  testAddEsriImageWithElevation(): Promise<Test<AbstractGVLayer>> {
    // Create a random geoview layer id
    const gvLayerId = generateId();
    const layerUrl = GVAbstractTester.ELEVATION_IMAGE_SERVER;
    const layerPath = gvLayerId + '/' + GVAbstractTester.ELEVATION_LAYER_ID;
    const gvLayerName = 'Esri Image Elevation';

    // Test
    return this.test(
      `Test Adding Esri Image Elevation on map...`,
      (test) => {
        // Creating the configuration
        test.addStep('Creating the GeoView Layer Configuration...');

        // Create the config
        const gvConfig = EsriImage.createGeoviewLayerConfig(gvLayerId, gvLayerName, layerUrl, false);

        // Redirect to helper to add the layer to the map and wait
        return LayerTester.helperStepAddLayerOnMapAndWaitForIt(gvConfig, test, this.getMapViewer(), layerPath);
      },
      (test) => {
        // Perform assertions
        // Redirect to helper to check if the layer exists
        LayerTester.helperStepAssertLayerExists(test, this.getMapViewer(), layerPath);
      },
      (test) => {
        // Redirect to helper to clean up and assert
        LayerTester.helperFinalizeStepRemoveLayerAndAssert(test, this.getMapViewer(), layerPath);
      }
    );
  }

  /**
   * Tests adding an Esri Feature Forest Industry layer on the map.
   * @returns {Promise<Test<AbstractGVLayer>>} A Promise resolving when the test completes.
   */
  testAddWMSLayerWithOWSMundialis(): Promise<Test<AbstractGVLayer>> {
    // Create a random geoview layer id
    const gvLayerId = generateId();
    const layerUrl = GVAbstractTester.OWS_MUNDIALIS;
    const layerPath = gvLayerId + '/Dark';
    const gvLayerName = 'OWS Mundialis';

    // Test
    return this.test(
      `Test Adding WMS Mundialis on map...`,
      (test) => {
        // Creating the configuration
        test.addStep('Creating the GeoView Layer Configuration...');

        // Create the config
        const gvConfig = WMS.createGeoviewLayerConfig(gvLayerId, gvLayerName, layerUrl, 'mapserver', false, [{ id: 'Dark' }], false);

        // Redirect to helper to add the layer to the map and wait
        return LayerTester.helperStepAddLayerOnMapAndWaitForIt(gvConfig, test, this.getMapViewer(), layerPath);
      },
      (test) => {
        // Perform assertions
        // Redirect to helper to check if the layer exists
        LayerTester.helperStepAssertLayerExists(test, this.getMapViewer(), layerPath);
      },
      (test) => {
        // Redirect to helper to clean up and assert
        LayerTester.helperFinalizeStepRemoveLayerAndAssert(test, this.getMapViewer(), layerPath);
      }
    );
  }

  testAddWMSLayerWithOWSMundialisTrueNegative(): Promise<Test<Error>> {
    // Create a random geoview layer id
    const gvLayerId = generateId();
    const layerUrl = GVAbstractTester.OWS_MUNDIALIS;
    const layerPath = gvLayerId + '/Dark';
    const gvLayerName = 'OWS Mundialis';

    // Test
    return this.test(
      `Test Adding WMS Mundialis on map which should fail...`,
      async (test) => {
        // Creating the configuration
        test.addStep('Creating the GeoView Layer Configuration...');

        // Create the config
        const gvConfig = WMS.createGeoviewLayerConfig(gvLayerId, gvLayerName, layerUrl, 'mapserver', false, [{ id: 'Dark' }], false);

        let theError: Error | undefined;
        try {
          // Redirect to helper to add the layer to the map and wait
          await LayerTester.helperStepAddLayerOnMapAndWaitForIt(gvConfig, test, this.getMapViewer(), layerPath);
        } catch (error: unknown) {
          // Expected error happened
          theError = formatError(error);
        }

        // Return the error
        return theError || new TestError('True negative failed');
      },
      (test, result) => {
        // Perform assertions
        // Verify the error is the correct one
        test.addStep('Verify the error result is the expected one...');
        Test.assertIsErrorInstance(result, LayerEntryNotSupportingProjectionError);
      },
      (test) => {
        // Redirect to helper to clean up and assert
        LayerTester.helperFinalizeStepRemoveLayerAndAssert(test, this.getMapViewer(), layerPath);
      }
    );
  }

  /**
   * Tests adding an Esri Feature Forest Industry layer on the map.
   * @returns {Promise<Test<AbstractGVLayer>>} A Promise resolving when the test completes.
   */
  testAddWMSLayerWithDatacubeMSI(): Promise<Test<AbstractGVLayer>> {
    // Create a random geoview layer id
    const gvLayerId = generateId();
    const layerUrl = GVAbstractTester.DATACUBE_MSI;
    const layerPath = gvLayerId + '/' + GVAbstractTester.DATACUBE_MSI_LAYER_NAME_MSI_OR_MORE;
    const gvLayerName = 'Datacube MSI';

    // Test
    return this.test(
      `Test Adding Datacube MSI on map...`,
      (test) => {
        // Creating the configuration
        test.addStep('Creating the GeoView Layer Configuration...');

        // Create the config
        const gvConfig = WMS.createGeoviewLayerConfig(
          gvLayerId,
          gvLayerName,
          layerUrl,
          'mapserver',
          false,
          [{ id: GVAbstractTester.DATACUBE_MSI_LAYER_NAME_MSI_OR_MORE }],
          false
        );

        // Redirect to helper to add the layer to the map and wait
        return LayerTester.helperStepAddLayerOnMapAndWaitForIt(gvConfig, test, this.getMapViewer(), layerPath);
      },
      (test) => {
        // Perform assertions
        // Redirect to helper to check if the layer exists
        LayerTester.helperStepAssertLayerExists(test, this.getMapViewer(), layerPath);
      },
      (test) => {
        // Redirect to helper to clean up and assert
        LayerTester.helperFinalizeStepRemoveLayerAndAssert(test, this.getMapViewer(), layerPath);
      }
    );
  }

  /**
   * Tests adding an Esri Feature Forest Industry layer on the map.
   * @returns {Promise<Test<AbstractGVLayer>>} A Promise resolving when the test completes.
   */
  testAddWMSLayerWithDatacubeRingOfFire(): Promise<Test<AbstractGVLayer>> {
    // Create a random geoview layer id
    const gvLayerId = generateId();
    const layerUrl = GVAbstractTester.DATACUBE_RING_FIRE;
    const layerPath = gvLayerId + '/' + GVAbstractTester.DATACUBE_RING_FIRE_LAYER_ID_HALIFAX;
    const gvLayerName = 'Halifax';

    // Test
    return this.test(
      `Test Adding Datacube Ring of Fire XML Halifax on map...`,
      (test) => {
        // Creating the configuration
        test.addStep('Creating the GeoView Layer Configuration...');

        // Create the config
        const gvConfig = WMS.createGeoviewLayerConfig(
          gvLayerId,
          gvLayerName,
          layerUrl,
          'mapserver',
          false,
          [{ id: GVAbstractTester.DATACUBE_RING_FIRE_LAYER_ID_HALIFAX }],
          false
        );

        // Redirect to helper to add the layer to the map and wait
        return LayerTester.helperStepAddLayerOnMapAndWaitForIt(gvConfig, test, this.getMapViewer(), layerPath);
      },
      (test) => {
        // Perform assertions
        // Redirect to helper to check if the layer exists
        LayerTester.helperStepAssertLayerExists(test, this.getMapViewer(), layerPath);
      },
      (test) => {
        // Redirect to helper to clean up and assert
        LayerTester.helperFinalizeStepRemoveLayerAndAssert(test, this.getMapViewer(), layerPath);
      }
    );
  }

  /**
   * Adds a GeoView layer to the map, waits for it to load completely, and returns the loaded layer instance.
   * Each step of the process is logged into the provided test instance for traceability and debugging.
   * @param {TypeGeoviewLayerConfig} gvConfig - The configuration object defining the GeoView layer to be added.
   * @param {Test<AbstractGVLayer>} test - The test instance used to log each step in the layer setup process.
   * @param {MapViewer} mapViewer - The map viewer to which the layer will be added.
   * @param {string} layerPath - The unique path or ID used to retrieve the added layer from the map viewer.
   * @returns {Promise<AbstractGVLayer>} A promise that resolves to the fully loaded GeoView layer instance.
   * @static
   */
  static async helperStepAddLayerOnMapAndWaitForIt<T>(
    gvConfig: TypeGeoviewLayerConfig,
    test: Test<T>,
    mapViewer: MapViewer,
    layerPath: string
  ): Promise<AbstractGVLayer> {
    // Adding the layer on the map
    test.addStep('Adding the layer on the map...');

    // Add the geoview layer by geocore uuid
    const result = mapViewer.layer.addGeoviewLayer(gvConfig);

    // Creating the configuration
    test.addStep('Waiting for the layer to be added...');

    // Wait for the layer to be fully added on the map
    await result.promiseLayer;

    // Throw if errors
    result.layer.throwAggregatedLayerLoadErrors();

    // Creating the configuration
    test.addStep(`Find the layer ${layerPath} on the map...`);

    // Get the layer
    const layer = mapViewer.layer.getGeoviewLayer(layerPath) as AbstractGVLayer;

    // Creating the configuration
    test.addStep(`Waiting for the layer to be loaded...`);

    // Wait until the layer has at least loaded once
    await layer.waitLoadedOnce();

    // Return the layer
    return layer;
  }

  /**
   * Asserts that a layer with the given path exists in the map's legend store.
   * Logs the verification step in the test instance.
   * @param {Test<AbstractGVLayer>} test - The test instance used to record the verification step.
   * @param {MapViewer} mapViewer - The map viewer instance containing the layer store.
   * @param {string} layerPath - The path or ID of the layer to verify.
   * @returns {void}
   * @static
   */
  static helperStepAssertLayerExists<T>(test: Test<T>, mapViewer: MapViewer, layerPath: string): void {
    // Verify the layer is in the api
    test.addStep("Verify the store 'legendLayers' state...");
    const legendLayers = LegendEventProcessor.getLegendLayers(mapViewer.mapId);
    Test.assertArrayIncludes(
      legendLayers.map((legendLayer) => legendLayer.layerPath),
      layerPath
    );
  }

  /**
   * Removes a layer from the map using its path and asserts that it no longer exists in the legend store.
   * Each step is logged to the provided test instance for traceability.
   * @param {Test<AbstractGVLayer>} test - The test instance used to record each step of the removal process.
   * @param {MapViewer} mapViewer - The map viewer instance from which the layer is removed.
   * @param {string} layerPath - The unique path or ID of the layer to be removed.
   * @returns {void}
   * @static
   */
  static helperFinalizeStepRemoveLayerAndAssert<T>(test: Test<T>, mapViewer: MapViewer, layerPath: string): void {
    // Remove the added layer
    test.addStep(`Removing the layer ${layerPath} from the map...`);
    mapViewer.layer.removeLayerUsingPath(layerPath);

    // Check the removal worked
    test.addStep(`Check that the layer is indeed removed...`);
    const legendLayers = LegendEventProcessor.getLegendLayers(mapViewer.mapId);
    Test.assertArrayExcludes(
      legendLayers.map((legendLayer) => legendLayer.layerPath),
      layerPath
    );
  }
}
