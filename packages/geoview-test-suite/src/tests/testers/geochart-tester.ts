import type { Coordinate } from 'ol/coordinate';

import { TestConstants } from './constants';
import { Test } from '../core/test';
import { TestError } from '../core/exceptions';
import { GVAbstractTester } from './abstract-gv-tester';
import type { AbstractGVLayer } from 'geoview-core/geo/layer/gv-layers/abstract-gv-layer';
import type { GeoViewGeoChartConfig } from 'geoview-core/api/config/reader/uuid-config-reader';
import { DomHelper } from 'geoview-core/core/utils/dom-helper';
import { getStoreUIActiveFooterBarTab } from 'geoview-core/core/stores/states/ui-state';
import { getStoreGeochartChartsConfig, getStoreGeochartSelectedLayerPath } from 'geoview-core/core/stores/states/geochart-state';
import type { AbstractBaseGVLayer } from 'geoview-core/geo/layer/gv-layers/abstract-base-layer';

/**
 * Main Map testing class.
 */
export class GeochartTester extends GVAbstractTester {
  /**
   * Returns the name of the Tester.
   *
   * @returns The name of the Tester
   */
  override getName(): string {
    return 'GeochartTester';
  }

  /**
   * Tests opening the polygon layer's chart after querying an Ontario coordinate.
   *
   * @returns A promise that resolves with the queried polygon layer
   */
  testGeochartPolygonsClick(): Promise<Test<AbstractGVLayer>> {
    const geochartConfig = {
      layers: [
        {
          layerId: 'TBD-BELOW',
          propertyValue: 'data',
          propertyDisplay: 'label',
        },
      ],
      chart: 'pie',
      geochart: {
        xAxis: {
          property: 'label',
        },
        yAxis: {
          property: 'data',
        },
      },
      category: {
        property: 'location',
      },
      datasources: [
        {
          display: 'Feature',
          items: [
            {
              data: 92,
              label: 'Hockey',
              location: 'Victoria',
            },
            {
              data: 43.54,
              label: 'Baseball',
              location: 'Victoria',
            },
            {
              data: 12.3,
              label: 'Basketball',
              location: 'Victoria',
            },
            {
              data: 66,
              label: 'Football',
              location: 'Victoria',
            },
            {
              data: 75,
              label: 'Soccer',
              location: 'Victoria',
            },
            {
              data: 553,
              label: 'Hockey',
              location: 'Toronto',
            },
            {
              data: 54,
              label: 'Baseball',
              location: 'Toronto',
            },
          ],
        },
      ],
    } as GeoViewGeoChartConfig;

    // Test
    let gvLayer: AbstractBaseGVLayer;
    let rootLayerPath: string | undefined;
    return this.test(
      `Test Geochart on GeoJSON Polygons...`,
      async (test) => {
        const { geoChartController, uiController } = this.getControllersRegistry();
        if (!geoChartController) throw new TestError('The GeoChart controller is unavailable.');

        // Add the Polygons layer
        gvLayer = await this.addLayerGeoJSONWithMetadataPolygons(test, {
          onLayerPath: (rootPath): void => {
            rootLayerPath = rootPath;
          },
        });

        // Set the layer path in the geochart configuration
        geochartConfig.layers[0].layerId = gvLayer.getLayerPath();

        // Make sure the configuration is set
        geoChartController.addChart(gvLayer.getLayerPath(), geochartConfig);
        uiController.showTabButton('geochart');

        // Continue the test and return the layer
        return this.queryLonLatSelectLayerInPanel(test, gvLayer.getLayerPath(), TestConstants.ONTARIO_CENTER_LONLAT);
      },
      (test) => {
        // Perform assertions
        // Check that geochart is the active footer bar
        test.addStep("Verifying 'geochart' is the selected footer tab...");
        Test.assertIsEqual(getStoreUIActiveFooterBarTab(this.getMapId()).tabId, 'geochart');

        // Check that layer path is selected
        test.addStep(`Verifying ${gvLayer.getLayerPath()} is the selected layer for the geochart...`);
        Test.assertIsEqual(getStoreGeochartSelectedLayerPath(this.getMapId()), gvLayer.getLayerPath());
      },
      (test) => {
        // Clear the layer from the map and assert it was removed
        if (rootLayerPath) this.removeLayerConfigAndAssert(test, rootLayerPath);
      }
    );
  }

  /**
   * Tests adding a the Airborne Geocore layer, launching a query layers at a given lonlat, set the active footerbar tab to geochart and select the layer in the geochart panel.
   *
   * @returns A promise that resolves when the test completes.
   */
  testAddGeocoreLayerUUIDForGeochartAirborne(): Promise<Test<AbstractGVLayer>> {
    const expectedGeochartChartsConfig = {
      [TestConstants.AIRBORNE_RADIOACTIVITY_UUID_WITH_SUFFIX]: {
        layers: [
          {
            layerId: TestConstants.AIRBORNE_RADIOACTIVITY_UUID_WITH_SUFFIX,
            propertyValue: 'OBJECTID',
            propertyDisplay: 'Location_Emplacement',
          },
        ],
        chart: 'line',
        query: {
          type: 'esriRegular',
          url: 'https://maps-cartes.services.geo.ca/server_serveur/rest/services/HC/airborne_radioactivity_en/MapServer/3',
          queryOptions: {
            whereClauses: [
              {
                field: 'Location_Emplacement',
                prefix: "'",
                valueFrom: 'Location_Emplacement',
                suffix: "'",
              },
            ],
            orderByField: 'CollectionStart_DebutPrelevement',
          },
        },
      },
    };

    // Test
    let rootLayerPath: string | undefined;
    let configLayerPath: string | undefined;
    return this.test(
      'Test Geochart',
      async (test) => {
        // Add the geoview layer by geocore uuid
        const addedLayer = await this.addLayerEsriDynamicAirborneViaGeocore(test, undefined, undefined, {
          onLayerPath: (rootPath, configPath): void => {
            rootLayerPath = rootPath;
            configLayerPath = configPath;
          },
        });

        // Continue the test and return the layer
        return this.queryLonLatSelectLayerInPanel(test, addedLayer.getLayerPath(), TestConstants.OTTAWA_LONLAT);
      },
      (test) => {
        // Perform assertions
        test.addStep('Verifying expected geochart config...');
        const geochartsConfig = getStoreGeochartChartsConfig(this.getMapId());
        Test.assertJsonObject(geochartsConfig, expectedGeochartChartsConfig);

        // Check that geochart is the active footer bar
        test.addStep("Verifying 'geochart' is the selected footer tab...");
        Test.assertIsEqual(getStoreUIActiveFooterBarTab(this.getMapId()).tabId, 'geochart');

        // Check that layer path is selected
        test.addStep(`Verifying ${configLayerPath} is the selected layer for the geochart...`);
        Test.assertIsEqual(getStoreGeochartSelectedLayerPath(this.getMapId()), configLayerPath);
      },
      (test) => {
        // Clear the layer from the map and assert it was removed
        if (rootLayerPath) this.removeLayerConfigAndAssert(test, rootLayerPath);
      }
    );
  }

  /**
   * Retrieves a layer from the map, performs a feature info query at a specific coordinate,
   * and sets up the geochart UI with that layer. Steps are logged to the provided test instance.
   *
   * @template T - The type parameter for the test instance
   * @param test - The test instance used to log each step of the geochart setup process
   * @param layerPath - The unique path or ID of the layer to interact with
   * @param lonlat - The longitude/latitude coordinate at which to query the layer
   * @returns A promise that resolves to the layer after setup is complete
   * @throws {LayerNotFoundError} When the layer couldn't be found at the given layer path
   * @throws {LayerWrongTypeError} When the layer is of wrong type at the given layer path
   * @throws {TestError} When the controller is unavailable or the query returns no processed features
   * @throws {Error} When the current query does not reach the batched GeoChart data before the timeout
   */
  async queryLonLatSelectLayerInPanel<T>(test: Test<T>, layerPath: string, lonlat: Coordinate): Promise<AbstractGVLayer> {
    const { layerController, uiController, geoChartController } = this.getControllersRegistry();

    // Get the layer
    test.addStep(`Getting the layer with the geochart ${layerPath}...`);
    const layer = layerController.getGeoviewLayerRegular(layerPath);

    // Query the layer at the given coordinates
    await this.queryAtCoordinateRetrieveResultsForLayer(test, layer, lonlat);

    // Wait for the batched query to propagate to the store
    await GVAbstractTester.waitForBatchedQueryPropagation(test);

    // Set the footer tab to Geochart
    test.addStep(`Setting active footerbar tab to geochart and wait for UI to refresh...`);
    uiController.setActiveFooterBarTab('geochart', true);
    await DomHelper.waitForFooterTabSelected(this.getMapId(), 'geochart');
    await DomHelper.waitForReactIdle();

    // Select the right layer path
    test.addStep(`Selecting the geochart for the added layer...`);
    geoChartController?.setSelectedLayerPath(layerPath);
    await DomHelper.waitForReactIdle();

    // Wait for fun so that we can see the actual chart in the UI before terminating the test
    await test.waitForFun();

    // Return the layer
    return layer;
  }
}
