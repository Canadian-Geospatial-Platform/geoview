import type { Coordinate } from 'ol/coordinate';

import { Test } from '../core/test';
import { GVAbstractTester } from './abstract-gv-tester';
import type { TypeFeatureInfoEntry } from 'geoview-core/api/types/map-schema-types';
import type { TypeGeoviewLayerType } from 'geoview-core/api/types/layer-schema-types';
import { getStoreUIActiveFooterBarTab } from 'geoview-core/core/stores/states/ui-state';
import { getStoreLayerItemVisibility } from 'geoview-core/core/stores/states/layer-state';
import { getStoreMapHighlightedFeatures, getStoreMapClickMarker } from 'geoview-core/core/stores/states/map-state';
import type { AbstractGVLayer } from 'geoview-core/geo/layer/gv-layers/abstract-gv-layer';
import type { MapViewer } from 'geoview-core/geo/map/map-viewer';

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
        await layer.waitForLoadedOnce();

        // Query the lonlat coordinate
        const resultsOntarioResults = await this.helperStepQueryLayerAtCoordinate(test, layer, lonlat1);

        // Select the right layer path
        test.addStep(`Selecting the details for the added layer...`);
        this.getControllersRegistry().detailsController.setSelectedLayerPath(layerPath);

        // Make the layer invisible
        test.addStep(`Make the layer invisible...`);
        layer.setVisible(false);

        // Query the lonlat coordinate
        const resultsOntarioNoResults = await this.helperStepQueryLayerAtCoordinate(test, layer, lonlat1);

        // Make the layer visible
        test.addStep(`Make the layer visible...`);
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
        test.addStep('Verifying there is 2 feature info result for the Ontario query...');
        Test.assertIsArrayLengthEqual(resultsOntarioResults, 2);

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
      }
    );
  }

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
    await layer.waitForLoadedOnce();

    // Update the step
    test.addStep(`Perform query operation at given coordinates...`);

    // Perform a map click using the feature info layer set
    return (await this.getControllersRegistry().layerSetController.queryAtLonLat(lonlat))[layer.getLayerPath()].features;
  }

  /**
   * Tests that clearing all highlights removes highlighted features from the store.
   *
   * @param lonlat - The coordinate on the map to query
   * @returns A promise resolving when the test completes
   */
  testClearAllHighlights(lonlat: Coordinate): Promise<Test<TestDetailsHighlights>> {
    return this.test(
      `Test Clear all highlights across multiple layers...`,
      async (test) => {
        // Wait for the layers to be loaded
        await this.getControllersRegistry().layerController.waitForLayersLoaded();

        // Simulate a map click — this queries ALL layers and auto-highlights the first feature from each layer with results
        test.addStep('Simulating map click to trigger highlight on all queryable layers...');
        this.getMapViewer().simulateMapClick(lonlat);

        // Wait for the React UI to actually pick up on the store update
        test.addStep(`Waiting on UI to refresh and the details panel to open...`);
        await GVAbstractTester.waitForUI();

        // Wait for the React UI to actually pick up on the store update
        // GV The highlight only happens through a React render effect so we can't wait for a particular event
        test.addStep(`Waiting on highlights to happen via react rendering...`);
        await GVAbstractTester.waitForCondition(() => getStoreMapHighlightedFeatures(this.getMapId()).length > 0);

        // Keep track of the store state
        const clickMarkerBefore = getStoreMapClickMarker(this.getMapId());
        const highlightedBefore = getStoreMapHighlightedFeatures(this.getMapId());

        // Clear all highlights
        test.addStep('Clearing all highlighted features...');
        this.getControllersRegistry().mapController.removeHighlightedFeature('all');

        // Keep track of the store state
        const highlightedAfter = getStoreMapHighlightedFeatures(this.getMapId());

        // Also hide the click marker explicitly (closing the panel does not auto-clear the click marker)
        test.addStep('Hiding click marker...');
        this.getControllersRegistry().mapController.clickMarkerIconHide();

        // Keep track of the store state
        const clickMarkerAfter = getStoreMapClickMarker(this.getMapId());

        // Simulate a map click — this queries ALL layers and auto-highlights the first feature from each layer with results
        test.addStep('Simulating map click to trigger highlight again...');
        this.getMapViewer().simulateMapClick(lonlat);

        // Wait for the React UI to actually pick up on the store update
        test.addStep(`Waiting on UI to refresh and the details panel to open (again)...`);
        await GVAbstractTester.waitForUI();

        // Wait for the React UI to actually pick up on the store update
        // GV The highlight only happens through a React render effect so we can't wait for a particular event
        test.addStep(`Waiting on highlights to happen via react rendering...`);
        await GVAbstractTester.waitForCondition(() => getStoreMapHighlightedFeatures(this.getMapId()).length > 0);

        // Keep track of the store state
        const highlighted2Before = getStoreMapHighlightedFeatures(this.getMapId());

        // Close the details panel which will remove the highlight
        test.addStep('Closing details app bar panel...');
        this.getControllersRegistry().uiController.setActiveAppBarTab('details', false, false);

        // Wait for the React UI to actually pick up on the store update
        test.addStep(`Waiting on UI to refresh and the details panel to close...`);
        await GVAbstractTester.waitForUI();

        // Wait for the React UI to actually pick up on the store update
        // GV The highlight only happens through a React render effect so we can't wait for a particular event
        test.addStep(`Waiting on highlights to be cleared via react rendering...`);
        await GVAbstractTester.waitForCondition(() => getStoreMapHighlightedFeatures(this.getMapId()).length === 0);

        // Keep track of the store state
        const highlighted2After = getStoreMapHighlightedFeatures(this.getMapId());

        // Reshowing the details panel which will re-add the highlight
        test.addStep('Reopening details app bar panel...');
        this.getControllersRegistry().uiController.setActiveAppBarTab('details', true, false);

        // Wait for the React UI to actually pick up on the store update
        test.addStep(`Waiting on UI to refresh and the details panel to reopen...`);
        await GVAbstractTester.waitForUI();

        // Wait for the React UI to actually pick up on the store update
        // GV The highlight only happens through a React render effect so we can't wait for a particular event
        test.addStep(`Waiting on highlights to happen via react rendering...`);
        await GVAbstractTester.waitForCondition(() => getStoreMapHighlightedFeatures(this.getMapId()).length > 0);

        // Keep track of the store state
        const highlighted3After = getStoreMapHighlightedFeatures(this.getMapId());

        // Return the test execution results
        return {
          clickMarkerBefore,
          clickMarkerAfter,
          highlightedBefore,
          highlightedAfter,
          highlighted2Before,
          highlighted2After,
          highlighted3After,
        };
      },
      (test, result) => {
        // Verify click marker is defined
        test.addStep('Verifying click marker existed after the first map click...');
        Test.assertIsDefined('clickMarkerBefore', result.clickMarkerBefore);

        // Verify click marker is undefined (cleared)
        test.addStep('Verifying click marker was removed after explicit hide...');
        Test.assertIsUndefined('clickMarker', result.clickMarkerAfter);

        // Verify highlights existed after the map click
        test.addStep('Verifying highlighted features existed after the first map click...');
        Test.assertIsArrayLengthMinimal(result.highlightedBefore, 1);

        // Verify highlights were cleared while details panel was still open
        test.addStep('Verifying highlighted features were cleared after explicit removal...');
        Test.assertIsArrayLengthEqual(result.highlightedAfter, 0);

        // Verify highlights existed after the map click
        test.addStep('Verifying highlighted features existed after the second map click...');
        Test.assertIsArrayLengthMinimal(result.highlighted2Before, 1);

        // Verify highlights were cleared while details panel was still open
        test.addStep('Verifying highlighted features were cleared after panel was closed...');
        Test.assertIsArrayLengthEqual(result.highlighted2After, 0);

        // Verify highlights were cleared while details panel was still open
        test.addStep('Verifying highlighted features were cleared after panel was reopened...');
        Test.assertIsArrayLengthEqual(result.highlighted3After, 1);
      }
    );
  }

  /**
   * Tests that zoom-to-feature changes the map extent.
   *
   * @param layerPath - The layer path of the layer
   * @param lonlat - The coordinate on the map to query
   * @returns A promise resolving when the test completes
   */
  testZoomToFeature(
    layerPath: string,
    lonlat: Coordinate
  ): Promise<Test<{ initialZoom: number | undefined; finalZoom: number | undefined }>> {
    return this.test(
      `Test Zoom to feature on layer ${layerPath}...`,
      async (test) => {
        // Get the layer
        const layer = this.getControllersRegistry().layerController.getGeoviewLayerRegular(layerPath);

        // Record initial zoom
        test.addStep('Recording initial zoom level...');
        const initialZoom = this.getMapViewer().getView().getZoom();

        // Query the coordinate to get features
        const features = await this.helperStepQueryLayerAtCoordinate(test, layer, lonlat);

        // Verify we have features with extent
        test.addStep('Verifying feature has extent for zoom...');
        Test.assertIsDefined('features', features);
        Test.assertIsArrayLengthMinimal(features, 1);
        const feature = features[0];
        Test.assertIsDefined('feature.extent', feature.extent);

        // Zoom to the feature extent (no animation = instant, no await needed)
        test.addStep('Zooming to feature extent...');
        await this.getControllersRegistry().mapController.zoomToExtent(feature.extent, GVAbstractTester.USE_ZOOM_ANIMATION, {
          maxZoom: 13,
        });

        // Return the zoom level after zooming
        return { initialZoom, finalZoom: this.getMapViewer().getView().getZoom() };
      },
      (test, result) => {
        // Verify zoom level changed
        test.addStep('Verifying zoom level changed...');
        Test.assertIsNotEqual(result.initialZoom, result.finalZoom);
      }
    );
  }

  /**
   * Tests that nameField configuration controls the feature display label.
   *
   * @returns A promise resolving when the test completes
   */
  testNameFieldAsLabel(): Promise<Test<TypeFeatureInfoEntry[] | undefined>> {
    const mapId = this.getMapId();
    const LAYER_PATH = 'geojsonLYR5/polygons.json';
    const NAME_FIELD = 'creationDate';

    return this.test(
      'Test nameField as label in query results...',
      async (test) => {
        // Create map with custom featureInfo nameField config using a date field
        test.addStep('Creating map with nameField configuration (date field)...');
        await this.#helperCreateMapWithFeatureInfoConfig(test, mapId, {
          queryable: true,
          nameField: NAME_FIELD,
        });

        // Get the layer
        test.addStep('Getting the layer...');
        const layer = this.getControllersRegistry().layerController.getGeoviewLayerRegular(LAYER_PATH);

        // Query at Ontario coordinates
        return this.helperStepQueryLayerAtCoordinate(test, layer, GVAbstractTester.ONTARIO_CENTER_LONLAT);
      },
      (test, result) => {
        // Verify we got results
        test.addStep('Verifying query returned features...');
        Test.assertIsDefined('features', result);
        Test.assertIsArrayLengthMinimal(result, 1);

        // Verify the nameField is set correctly on the result
        test.addStep('Verifying nameField is set on result...');
        Test.assertIsEqual(result[0].nameField, NAME_FIELD);
      }
    );
  }

  /**
   * Tests that fields with summary: false are excluded from query results.
   *
   * @returns A promise resolving when the test completes
   */
  testSummaryFalseHidesField(): Promise<Test<TypeFeatureInfoEntry[] | undefined>> {
    const mapId = this.getMapId();
    const LAYER_PATH = 'geojsonLYR5/polygons.json';
    const NAME_FIELD = 'Province';
    const HIDDEN_FIELD = 'creationDate';

    return this.test(
      'Test summary false hides field from query results...',
      async (test) => {
        // Create map with outfields config where creationDate has summary: false
        test.addStep('Creating map with outfields summary:false configuration...');
        await this.#helperCreateMapWithFeatureInfoConfig(test, mapId, {
          queryable: true,
          nameField: NAME_FIELD,
          outfields: [
            { name: NAME_FIELD, type: 'string' },
            { name: HIDDEN_FIELD, type: 'date', summary: false },
          ],
        });

        // Get the layer
        test.addStep('Getting the layer...');
        const layer = this.getControllersRegistry().layerController.getGeoviewLayerRegular(LAYER_PATH);

        // Query at Ontario coordinates
        return this.helperStepQueryLayerAtCoordinate(test, layer, GVAbstractTester.ONTARIO_CENTER_LONLAT);
      },
      (test, result) => {
        // Verify we got results
        test.addStep('Verifying query returned features...');
        Test.assertIsDefined('features', result);
        Test.assertIsArrayLengthMinimal(result, 1);

        // Verify the hidden field is NOT in fieldInfo
        test.addStep(`Verifying field '${HIDDEN_FIELD}' is excluded from fieldInfo...`);
        Test.assertIsUndefined(`fieldInfo.${HIDDEN_FIELD}`, result[0].fieldInfo[HIDDEN_FIELD]);

        // Verify that Province field IS present
        test.addStep('Verifying Province field IS present in fieldInfo...');
        Test.assertIsDefined('fieldInfo.Province', result[0].fieldInfo.Province);
      }
    );
  }

  /**
   * Tests that field alias configuration is applied in query results.
   *
   * @returns A promise resolving when the test completes
   */
  testFieldAliasRenamesField(): Promise<Test<TypeFeatureInfoEntry[] | undefined>> {
    const mapId = this.getMapId();
    const LAYER_PATH = 'geojsonLYR5/polygons.json';
    const ALIAS_VALUE = 'Custom Province Name';

    return this.test(
      'Test field alias renames field in query results...',
      async (test) => {
        // Create map with outfields config where Province has a custom alias
        test.addStep('Creating map with outfields alias configuration...');
        await this.#helperCreateMapWithFeatureInfoConfig(test, mapId, {
          queryable: true,
          nameField: 'Province',
          outfields: [{ name: 'Province', alias: ALIAS_VALUE, type: 'string' }],
        });

        // Get the layer
        test.addStep('Getting the layer...');
        const layer = this.getControllersRegistry().layerController.getGeoviewLayerRegular(LAYER_PATH);

        // Query at Ontario coordinates
        return this.helperStepQueryLayerAtCoordinate(test, layer, GVAbstractTester.ONTARIO_CENTER_LONLAT);
      },
      (test, result) => {
        // Verify we got results
        test.addStep('Verifying query returned features...');
        Test.assertIsDefined('features', result);
        Test.assertIsArrayLengthMinimal(result, 1);

        // Verify the alias is applied
        test.addStep(`Verifying Province field alias is '${ALIAS_VALUE}'...`);
        Test.assertIsDefined('fieldInfo.Province', result[0].fieldInfo.Province);
        Test.assertIsEqual(result[0].fieldInfo.Province.alias, ALIAS_VALUE);
      }
    );
  }

  // #region PRIVATE HELPERS

  /**
   * Creates a map with a GeoJSON polygons layer configured with custom featureInfo settings.
   *
   * @param test - The test instance used to log steps
   * @param mapId - The map identifier
   * @param featureInfoConfig - The featureInfo configuration to apply to the layer
   * @returns A promise that resolves when the map is created and layers are loaded
   */
  #helperCreateMapWithFeatureInfoConfig<T>(test: Test<T>, mapId: string, featureInfoConfig: Record<string, unknown>): Promise<MapViewer> {
    const baseConfig = {
      map: {
        interaction: 'dynamic',
        viewSettings: { projection: 3978, initialView: { zoomAndCenter: [4.5, [-90, 60]] } },
        basemapOptions: { basemapId: 'transport', shaded: true, labeled: true },
        listOfGeoviewLayerConfig: [
          {
            geoviewLayerId: 'geojsonLYR5',
            geoviewLayerName: 'GeoJSON Sample',
            metadataAccessPath: GVAbstractTester.GEOJSON_METADATA_META,
            geoviewLayerType: 'GeoJSON' as TypeGeoviewLayerType,
            serviceDateFormat: 'DD/MM/YYYYTHH:mm:ss',
            listOfLayerEntryConfig: [
              {
                layerId: 'polygons.json',
                layerName: 'Polygons',
                source: {
                  featureInfo: featureInfoConfig,
                },
              },
            ],
          },
        ],
      },
      components: [],
      corePackages: ['test-suite'],
      corePackagesConfig: [{ 'test-suite': { suites: ['suite-details'] } }],
      theme: 'geo.ca',
      footerBar: {
        tabs: {
          core: ['legend', 'layers', 'details'],
        },
      },
    };

    // Replace the map!
    return this.replaceMap(test, mapId, baseConfig);
  }

  // #endregion
}

/** Result type for the testClearAllHighlights test execution. */
export type TestDetailsHighlights = {
  /** The click marker state after the first map click (before any cleanup). */
  clickMarkerBefore: unknown;
  /** The click marker state after explicit hide. */
  clickMarkerAfter: unknown;
  /** The highlighted features after the first map click. */
  highlightedBefore: TypeFeatureInfoEntry[];
  /** The highlighted features after explicit removal via removeHighlightedFeature('all'). */
  highlightedAfter: TypeFeatureInfoEntry[];
  /** The highlighted features after the second map click. */
  highlighted2Before: TypeFeatureInfoEntry[];
  /** The highlighted features after the details panel is closed. */
  highlighted2After: TypeFeatureInfoEntry[];
  /** The highlighted features after the details panel is reopened. */
  highlighted3After: TypeFeatureInfoEntry[];
};
