import type { Coordinate } from 'ol/coordinate';
import { Test } from '../core/test';
import { GVAbstractTester } from './abstract-gv-tester';
import { LayerTester } from './layer-tester';
import { delay } from 'geoview-core/core/utils/utilities';
import type { MapViewer } from 'geoview-core/geo/map/map-viewer';
import type { AbstractGVLayer } from 'geoview-core/geo/layer/gv-layers/abstract-gv-layer';
import { GeochartEventProcessor } from 'geoview-core/api/event-processors/event-processor-children/geochart-event-processor';
import { UIEventProcessor } from 'geoview-core/api/event-processors/event-processor-children/ui-event-processor';

/**
 * Main Map testing class.
 * @extends {GVAbstractTester}
 */
export class GeochartTester extends GVAbstractTester {
  /**
   * Returns the name of the Tester.
   * @returns {string} The name of the Tester.
   */
  override getName(): string {
    return 'GeochartTester';
  }

  /**
   * Tests opening the Geochart for a given layer path.
   * @param {string} layerPath - The layer path of the layer.
   * @param {Coordinate} lonlat - The coordinate on the map to query.
   * @returns {Promise<Test<AbstractGVLayer>>} A Promise resolving when the test completes.
   */
  testGeochartOpenForLayerMapClick(layerPath: string, lonlat: Coordinate): Promise<Test<AbstractGVLayer>> {
    // Test
    return this.test(
      `Test Geochart on layer ${layerPath}...`,
      (test) => {
        // Continue the test and return the layer
        return GeochartTester.helperStepLayerWithGeochart(test, this.getMapViewer(), layerPath, lonlat);
      },
      (test) => {
        // Perform assertions
        // Check that geochart is the active footer bar
        test.addStep("Verifying 'geochart' is the selected footer tab...");
        Test.assertIsEqual(UIEventProcessor.getActiveFooterBarTab(this.getMapId()), 'geochart');

        // Check that layer path is selected
        test.addStep('Verifying ' + layerPath + ' is the selected layer for the geochart...');
        Test.assertIsEqual(GeochartEventProcessor.getSingleGeochartState(this.getMapId(), 'selectedLayerPath'), layerPath);
      }
    );
  }

  /**
   * Tests adding a the Airborne Geocore layer, launching a query layers at a given lonlat, set the active footerbar tab to geochart and select the layer in the geochart panel.
   * @returns {Promise<Test<AbstractGVLayer>>} A Promise resolving when the test completes.
   */
  testAddGeocoreLayerUUIDForGeochartAirborne(): Promise<Test<AbstractGVLayer>> {
    // Test it
    return this.testAddGeocoreLayerUUIDForGeochart(
      GVAbstractTester.AIRBORNE_RADIOACTIVITY_UUID,
      GVAbstractTester.AIRBORNE_RADIOACTIVITY_UUID_WITH_SUFFIX,
      GVAbstractTester.AIRBORNE_RADIOACTIVITY_GROUP,
      GVAbstractTester.QUEBEC_LONLAT,
      {
        [GVAbstractTester.AIRBORNE_RADIOACTIVITY_UUID_WITH_SUFFIX]: {
          layers: [
            {
              layerId: GVAbstractTester.AIRBORNE_RADIOACTIVITY_UUID_WITH_SUFFIX,
              propertyValue: 'Location_Emplacement',
              propertyDisplay: 'OBJECTID',
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
      }
    );
  }

  /**
   * Tests adding a Geocore layer, launching a query layers at a given lonlat, set the active footerbar tab to geochart and select the layer in the geochart panel.
   * @param {string} uuid - The uuid of the Gecoore layer
   * @param {string} layerPathAdd - The layer path of the layer that was added
   * @param {string} layerPathRemove - The layer path of the layer to remove once the test terminates.
   * @param {Coordinate} lonlat - The coordinate on the map to query.
   * @param {Record<string, unknown>} expectedGeochartChartsConfig - The expected geochart charts configuration to validate.
   * @returns
   */
  testAddGeocoreLayerUUIDForGeochart(
    uuid: string,
    layerPathAdd: string,
    layerPathRemove: string,
    lonlat: Coordinate,
    expectedGeochartChartsConfig: Record<string, unknown>
  ): Promise<Test<AbstractGVLayer>> {
    // Test
    return this.test(
      'Test Geochart',
      async (test) => {
        // Update the step
        test.addStep(`Adding the layer on the map for ${uuid}`);

        // Add the geoview layer by geocore uuid
        const result = await this.getMapViewer().layer.addGeoviewLayerByGeoCoreUUID(uuid);

        // Update the step
        test.addStep(`Adding the layer on the map...`);

        // Wait for the layer to be processed (bit optional)
        await result!.promiseLayer;

        // Continue the test and return the layer
        return GeochartTester.helperStepLayerWithGeochart(test, this.getMapViewer(), layerPathAdd, lonlat);
      },
      (test) => {
        // Perform assertions
        test.addStep('Verifying expected geochart config...');
        const geochartsConfig = GeochartEventProcessor.getSingleGeochartState(this.getMapId(), 'geochartChartsConfig');
        Test.assertJsonObject(geochartsConfig, expectedGeochartChartsConfig);

        // Check that geochart is the active footer bar
        test.addStep("Verifying 'geochart' is the selected footer tab...");
        Test.assertIsEqual(UIEventProcessor.getActiveFooterBarTab(this.getMapId()), 'geochart');

        // Check that layer path is selected
        test.addStep('Verifying ' + layerPathAdd + ' is the selected layer for the geochart...');
        Test.assertIsEqual(GeochartEventProcessor.getSingleGeochartState(this.getMapId(), 'selectedLayerPath'), layerPathAdd);
      },
      (test) => {
        // Redirect to LayerTest to help test the removal of the layer
        LayerTester.helperFinalizeStepRemoveLayerAndAssert(test, this.getMapViewer(), layerPathRemove);
      }
    );
  }

  /**
   * Retrieves a layer from the map, performs a feature info query at a specific coordinate,
   * and sets up the geochart UI with that layer. Steps are logged to the provided test instance.
   * @template T - The type parameter for the test instance.
   * @param {Test<T>} test - The test instance used to log each step of the geochart setup process.
   * @param {MapViewer} mapViewer - The map viewer containing the layer and UI context.
   * @param {string} layerPath - The unique path or ID of the layer to interact with.
   * @param {Coordinate} lonlat - The longitude/latitude coordinate at which to query the layer.
   * @returns {Promise<AbstractGVLayer>} A promise that resolves to the layer after setup is complete.
   * @static
   */
  static async helperStepLayerWithGeochart<T>(
    test: Test<T>,
    mapViewer: MapViewer,
    layerPath: string,
    lonlat: Coordinate
  ): Promise<AbstractGVLayer> {
    // Update the step
    test.addStep(`Getting the layer with the geochart ${layerPath}...`);

    // Get the layer
    const layer = mapViewer.layer.getGeoviewLayer(layerPath) as AbstractGVLayer;

    // Update the step
    test.addStep(`Waiting for its layer 'loaded' status...`);

    // Wait until the layer has at least loaded once
    await layer.waitLoadedOnce();

    // Update the step
    test.addStep(`Perform query operation at given coordinates...`);

    // Perform a map click using the feature info layer set
    await mapViewer.layer.featureInfoLayerSet.queryLayers(lonlat);

    // Update the step
    test.addStep(`Setting active footerbar tab to geochart...`);

    // Set the footer tab to Geochart
    UIEventProcessor.setActiveFooterBarTab(mapViewer.mapId, 'geochart');

    // Update the step
    test.addStep(`Waiting on UI to refresh...`);

    // Wait purposely on the UI, 2 seconds seem to be the minimum.. 1 second fails sometimes..
    await delay(2000);

    // Update the step
    test.addStep(`Selecting the geochart for the added layer...`);

    // Select the right layer path
    GeochartEventProcessor.setSelectedGeochartLayerPath(mapViewer.mapId, layerPath);

    // Wait purposely on the UI, this waiting period isn't necessary for the test, but it's good to see it happen in real-time
    await delay(1000);

    // Return the layer
    return layer;
  }
}
