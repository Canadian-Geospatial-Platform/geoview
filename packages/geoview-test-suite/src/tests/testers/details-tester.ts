import type { Coordinate } from 'ol/coordinate';

import { Test } from '../core/test';
import { GVAbstractTester } from './abstract-gv-tester';
import { delay } from 'geoview-core/core/utils/utilities';
import type { TypeFeatureInfoEntry } from 'geoview-core/api/types/map-schema-types';
import { logger } from 'geoview-core/core/utils/logger';
import { getStoreUIActiveFooterBarTab } from 'geoview-core/core/stores/store-interface-and-intial-values/ui-state';
import { getStoreLayerItemVisibility } from 'geoview-core/core/stores/store-interface-and-intial-values/layer-state';
import type { AbstractGVLayer } from 'geoview-core/geo/layer/gv-layers/abstract-gv-layer';

/**
 * Main Map testing class.
 */
export class DetailsTester extends GVAbstractTester {
  /**
   * Returns the name of the Tester.
   *
   * @returns The name of the Tester
   */
  override getName(): string {
    return 'DetailsTester';
  }

  /**
   * Tests opening the Details panel for a given layer path.
   *
   * @param layerPath - The layer path of the layer
   * @param lonlat1 - The first coordinate on the map to query
   * @param lonlat2 - The second coordinate on the map to query
   * @returns A promise resolving when the test completes
   */
  testDetailsForGeoJSONOntarioAlberta(layerPath: string, lonlat1: Coordinate, lonlat2: Coordinate): Promise<Test<unknown>> {
    // Test
    return this.test(
      `Test Details on layer ${layerPath}...`,
      async (test) => {
        // Get the layer
        const layer = this.getControllersRegistry().layerController.getGeoviewLayerRegular(layerPath);

        // Query the lonlat coordinate
        const resultsOntarioResults = await this.helperStepQueryLayerAtCoordinate(test, layer, lonlat1);

        // Check that the details panel was selected for the layer
        await this.helperStepCheckDetailsPanel(test, layerPath);

        // Make the layer invisible
        layer.setVisible(false);

        // Query the lonlat coordinate
        const resultsOntarioNoResults = await this.helperStepQueryLayerAtCoordinate(test, layer, lonlat1);

        // Make the layer visible
        layer.setVisible(true);

        // Query in Alberta where there should be no results
        const resultsAlbertaNoResults1 = await this.helperStepQueryLayerAtCoordinate(test, layer, lonlat2);

        // Make the Alberta polygon visible
        let item = getStoreLayerItemVisibility(this.getMapId(), layerPath, 'Alberta')!;
        await this.getControllersRegistry().layerController.toggleItemVisibility(layerPath, item, true);

        // Query where there now should be some results
        const resultsAlbertaResults = await this.helperStepQueryLayerAtCoordinate(test, layer, lonlat2);

        // Make the Alberta polygon back to invisible
        item = getStoreLayerItemVisibility(this.getMapId(), layerPath, 'Alberta')!;
        await this.getControllersRegistry().layerController.toggleItemVisibility(layerPath, item, true);

        // Query where there now should be no results
        const resultsAlbertaNoResults2 = await this.helperStepQueryLayerAtCoordinate(test, layer, lonlat2);

        // Return the results of the queries
        return [resultsOntarioResults, resultsOntarioNoResults, resultsAlbertaNoResults1, resultsAlbertaResults, resultsAlbertaNoResults2];
      },
      (test, results) => {
        // Perform assertions
        const [resultsOntarioResults, resultsOntarioNoResults, resultsAlbertaNoResults1, resultsAlbertaResults, resultsAlbertaNoResults2] =
          results as unknown[][];

        // Check that there was 1 result for the Ontario
        test.addStep('Verifying there is 1 feature info result for the Ontario query...');
        Test.assertIsArrayLengthEqual(resultsOntarioResults, 1);

        // Check that there was 0 result for the Ontario
        test.addStep('Verifying there is 0 feature info result for the Ontario query...');
        Test.assertIsArrayLengthEqual(resultsOntarioNoResults, 0);

        // Check that there was 0 result for the Alberta
        test.addStep('Verifying there is 0 feature info result for the Alberta query...');
        Test.assertIsArrayLengthEqual(resultsAlbertaNoResults1, 0);

        // Check that there was 1 result for the Alberta
        test.addStep('Verifying there is 1 feature info result for the Alberta query...');
        Test.assertIsArrayLengthEqual(resultsAlbertaResults, 1);

        // Check that there was 0 result for the Alberta
        test.addStep('Verifying there is 0 feature info result for the Alberta query...');
        Test.assertIsArrayLengthEqual(resultsAlbertaNoResults2, 0);

        // Check that details is the active footer bar
        test.addStep("Verifying 'details' is the selected footer tab...");
        Test.assertIsEqual(getStoreUIActiveFooterBarTab(this.getMapId()).tabId, 'details');

        logger.logDebug(results);
      }
    );
  }

  // /**
  //  * Tests adding a the Airborne Geocore layer, launching a query layers at a given lonlat, set the active footerbar tab to geochart and select the layer in the geochart panel.
  //  * @returns A Promise resolving when the test completes.
  //  */
  // testAddGeocoreLayerUUIDForGeochartAirborne(): Promise<Test<AbstractGVLayer>> {
  //   // Test it
  //   return this.testAddGeocoreLayerUUIDForGeochart(
  //     GVAbstractTester.AIRBORNE_RADIOACTIVITY_UUID,
  //     GVAbstractTester.AIRBORNE_RADIOACTIVITY_UUID_WITH_SUFFIX,
  //     GVAbstractTester.AIRBORNE_RADIOACTIVITY_GROUP,
  //     GVAbstractTester.QUEBEC_LONLAT,
  //     {
  //       [GVAbstractTester.AIRBORNE_RADIOACTIVITY_UUID_WITH_SUFFIX]: {
  //         layers: [
  //           {
  //             layerId: GVAbstractTester.AIRBORNE_RADIOACTIVITY_UUID_WITH_SUFFIX,
  //             propertyValue: 'OBJECTID',
  //             propertyDisplay: 'Location_Emplacement',
  //           },
  //         ],
  //         chart: 'line',
  //         query: {
  //           type: 'esriRegular',
  //           url: 'https://maps-cartes.services.geo.ca/server_serveur/rest/services/HC/airborne_radioactivity_en/MapServer/3',
  //           queryOptions: {
  //             whereClauses: [
  //               {
  //                 field: 'Location_Emplacement',
  //                 prefix: "'",
  //                 valueFrom: 'Location_Emplacement',
  //                 suffix: "'",
  //               },
  //             ],
  //             orderByField: 'CollectionStart_DebutPrelevement',
  //           },
  //         },
  //       },
  //     }
  //   );
  // }

  // /**
  //  * Tests adding a Geocore layer, launching a query layers at a given lonlat, set the active footerbar tab to geochart and select the layer in the geochart panel.
  //  * @param uuid - The uuid of the Gecoore layer
  //  * @param layerPathAdd - The layer path of the layer that was added
  //  * @param layerPathRemove - The layer path of the layer to remove once the test terminates.
  //  * @param lonlat - The coordinate on the map to query.
  //  * @param expectedGeochartChartsConfig - The expected geochart charts configuration to validate.
  //  * @returns
  //  */
  // testAddGeocoreLayerUUIDForGeochart(
  //   uuid: string,
  //   layerPathAdd: string,
  //   layerPathRemove: string,
  //   lonlat: Coordinate,
  //   expectedGeochartChartsConfig: Record<string, unknown>
  // ): Promise<Test<AbstractGVLayer>> {
  //   // Test
  //   return this.test(
  //     'Test Geochart',
  //     async (test) => {
  //       // Update the step
  //       test.addStep(`Adding the layer on the map for ${uuid}`);

  //       // Add the geoview layer by geocore uuid
  //       const result = await this.getMapViewer().layer.addGeoviewLayerByGeoCoreUUID(uuid);

  //       // Update the step
  //       test.addStep(`Adding the layer on the map...`);

  //       // Wait for the layer to be processed (bit optional)
  //       await result!.promiseLayer;

  //       // Continue the test and return the layer
  //       return GeochartTester.helperStepLayerWithGeochart(test, this.getMapViewer(), layerPathAdd, lonlat);
  //     },
  //     (test) => {
  //       // Perform assertions
  //       test.addStep('Verifying expected geochart config...');
  //       const geochartsConfig = GeochartEventProcessor.getSingleGeochartState(this.getMapId(), 'geochartChartsConfig');
  //       Test.assertJsonObject(geochartsConfig, expectedGeochartChartsConfig);

  //       // Check that geochart is the active footer bar
  //       test.addStep("Verifying 'geochart' is the selected footer tab...");
  //       Test.assertIsEqual(UIEventProcessor.getActiveFooterBarTab(this.getMapId()), 'geochart');

  //       // Check that layer path is selected
  //       test.addStep(`Verifying ${layerPathAdd} is the selected layer for the geochart...`);
  //       Test.assertIsEqual(GeochartEventProcessor.getSingleGeochartState(this.getMapId(), 'selectedLayerPath'), layerPathAdd);
  //     },
  //     (test) => {
  //       // Redirect to LayerTest to help test the removal of the layer
  //       LayerTester.helperFinalizeStepRemoveLayerAndAssert(test, this.getMapViewer(), layerPathRemove);
  //     }
  //   );
  // }

  /**
   * Retrieves a layer from the map, performs a feature info query at a specific coordinate,
   * and sets up the details UI with that layer. Steps are logged to the provided test instance.
   *
   * @template T - The type parameter for the test instance
   * @param test - The test instance used to log each step of the details setup process
   * @param layerPath - The unique path or ID of the layer to interact with
   * @param lonlat - The longitude/latitude coordinate at which to query the layer
   * @returns A promise that resolves to the layer after setup is complete
   * @throws {LayerNotFoundError} When the layer couldn't be found at the given layer path
   * @throws {LayerWrongTypeError} When the layer is of wrong type at the given layer path
   */
  async helperStepQueryLayerAtCoordinate<T>(
    test: Test<T>,
    layer: AbstractGVLayer,
    lonlat: Coordinate
  ): Promise<TypeFeatureInfoEntry[] | undefined> {
    // Get the layer and make sure it's in loaded status
    await layer.waitLoadedOnce();

    // Update the step
    test.addStep(`Perform query operation at given coordinates...`);

    // Perform a map click using the feature info layer set
    return (await this.getControllersRegistry().layerSetController.queryAtLonLat(lonlat))[layer.getLayerPath()].features;
  }

  /**
   * Checks that the details panel is selected for the given layer path.
   *
   * @template T - The type parameter for the test instance
   * @param test - The test instance used to log each step
   * @param layerPath - The unique path or ID of the layer to check
   * @returns A promise that resolves when the check is complete
   */
  async helperStepCheckDetailsPanel<T>(test: Test<T>, layerPath: string): Promise<void> {
    // Update the step
    test.addStep(`Waiting on UI to refresh...`);

    // Wait purposely on the UI, 2 seconds seem to be the minimum.. 1 second fails sometimes..
    await delay(2000);

    // Update the step
    test.addStep(`Selecting the details for the added layer...`);

    // Select the right layer path
    this.getControllersRegistry().detailsController.setSelectedLayerPath(layerPath);
  }
}
