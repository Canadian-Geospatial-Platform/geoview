import type { Coordinate } from 'ol/coordinate';
import { getCenter } from 'ol/extent';

import { Test } from '../core/test';
import { GVAbstractTester } from './abstract-gv-tester';
import type { TypeFeatureInfoEntry } from 'geoview-core/api/types/map-schema-types';
import { DomHelper } from 'geoview-core/core/utils/dom-helper';
import { getStoreMapHighlightedFeatures, getStoreMapClickMarker } from 'geoview-core/core/stores/states/map-state';
import { getStoreDetailsFeatures, getStoreDetailsSelectedLayerPath } from 'geoview-core/core/stores/states/feature-info-state';
import type { AbstractGVLayer } from 'geoview-core/geo/layer/gv-layers/abstract-gv-layer';
import type { AbstractBaseGVLayer } from 'geoview-core/geo/layer/gv-layers/abstract-base-layer';
import { MapFitPadding } from 'geoview-core/core/utils/map-fit-padding';

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
   * Tests that clearing all highlights removes highlighted features from the store.
   *
   * @returns A promise resolving when the test completes
   */
  testClearAllHighlights(): Promise<Test<TestDetailsHighlights>> {
    let fixtureLayerPath: string | undefined;

    return this.test(
      `Test Clear all highlights across multiple layers...`,
      async (test) => {
        // Add the Commemorative layer
        const fixture = this.addLayerCommemorativeViaGeocore(test);
        fixtureLayerPath = fixture.layerPath;
        await fixture.promiseLayer;

        // Wait for the layers to be loaded
        await this.getControllersRegistry().layerController.waitForLayersLoaded();

        // Simulate a map click — this queries ALL layers and auto-highlights the first feature from each layer with results
        await this.simulateMapClickWaitForBatchedQuery(test, GVAbstractTester.ONTARIO_CENTER_LONLAT);

        // Wait for the React UI to actually pick up on the store update
        test.addStep(`Waiting on UI to refresh and the details panel to open...`);
        await DomHelper.waitForAppbarTabSelected(this.getMapId(), 'details');

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
        await this.simulateMapClickWaitForBatchedQuery(test, GVAbstractTester.ONTARIO_CENTER_LONLAT);

        // Wait for the React UI to actually pick up on the store update
        test.addStep(`Waiting on UI to refresh and the details panel to open (should already be open in fact)...`);
        await DomHelper.waitForAppbarTabSelected(this.getMapId(), 'details');

        // Keep track of the store state
        const highlighted2Before = getStoreMapHighlightedFeatures(this.getMapId());

        // Close the details panel which will remove the highlight
        await this.toggleAppbarTab(test, 'details', false);

        // Keep track of the store state
        const highlighted2After = getStoreMapHighlightedFeatures(this.getMapId());

        // Reshowing the details panel which will re-add the highlight
        await this.toggleAppbarTab(test, 'details', true);

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
      },
      (test) => {
        // Cleanup the map
        if (fixtureLayerPath) this.removeLayerConfigAndAssert(test, fixtureLayerPath);
      }
    );
  }

  /**
   * Tests that zoom-to-feature keeps the feature visible next to an open app-bar panel.
   *
   * @param layerPath - The layer path of the layer
   * @param lonlat - The coordinate on the map to query
   * @returns A promise resolving when the test completes
   */
  testZoomToFeatureWithPanelOffset(lonlat: Coordinate): Promise<Test<TestZoomWithPanelOffset>> {
    let fixtureLayerPath: string | undefined;

    return this.test(
      `Test Zoom to feature keeps the feature out of the open details panel...`,
      async (test) => {
        // Add the GeoJson Polygons layer
        const fixture = this.addLayerGeoJSONWithMetadataPolygons(test);
        fixtureLayerPath = fixture.layerPath;

        // Get the layer and query the coordinate to get features
        const layer = this.getControllersRegistry().layerController.getGeoviewLayerRegular(fixtureLayerPath);
        const features = await this.queryAtCoordinateRetrieveResultsForLayer(test, layer, lonlat);

        // Verify we have features with extent
        test.addStep('Verifying feature has extent for zoom...');
        Test.assertIsDefined('features', features);
        Test.assertIsArrayLengthMinimal(features, 1);
        const feature = features[0];
        Test.assertIsDefined('feature.extent', feature.extent);

        // Make sure the details panel is open over the map and settled
        await this.toggleAppbarTab(test, 'details', true);
        await DomHelper.waitForReactIdle();

        // Compute the padding like the Details zoom button does
        test.addStep('Computing the panel-aware fit padding...');
        const mapSize = this.getControllersRegistry().mapController.getMapSize();
        const padding = MapFitPadding.getAppBarPanelPadding(this.getMapId(), 'details', mapSize);

        // Zoom to the feature with the computed padding
        test.addStep('Zooming to feature extent with the panel-aware padding...');
        await this.getControllersRegistry().layerController.zoomToExtentRestrictedAndHighlight(
          fixtureLayerPath,
          feature,
          feature.extent,
          GVAbstractTester.USE_ZOOM_ANIMATION,
          { padding }
        );

        // Locate the feature center on screen
        const pixel = this.getMapViewer().map.getPixelFromCoordinate(getCenter(feature.extent));

        // Return the test execution results
        return {
          basePaddingLeft: MapFitPadding.getDefaultPadding()[3],
          paddingLeft: padding[3],
          centerPixelX: pixel ? pixel[0] : undefined,
        };
      },
      (test, result) => {
        // Verify the open panel was detected as overlapping the map
        test.addStep('Verifying the left padding includes the panel overlap...');
        Test.assertIsEqual(result.paddingLeft > result.basePaddingLeft, true);

        // Verify the feature center is outside the area covered by the panel
        test.addStep('Verifying the feature center is in the part of the map not covered by the panel...');
        Test.assertIsDefined('centerPixelX', result.centerPixelX);
        Test.assertIsEqual(result.centerPixelX >= result.paddingLeft, true);
      },
      (test) => {
        // Cleanup the map
        if (fixtureLayerPath) this.removeLayerConfigAndAssert(test, fixtureLayerPath);
      }
    );
  }

  /**
   * Tests that nameField configuration controls the feature display label.
   *
   * @returns The original and persisted layer paths and the persisted layer's feature count
   */
  testLayerSelectionPersistence(): Promise<Test<DetailsLayerSelectionResult>> {
    // Retain each fixture independently so cleanup can run even if adding the second layer fails.
    let polygons: AbstractGVLayer | undefined;
    let projects: AbstractBaseGVLayer | undefined;
    let polygonLayerPath: string | undefined;
    let projectLayerPath: string | undefined;
    return this.test(
      'Test details layer selection persistence across map clicks',
      async (test) => {
        // Create the candidates here rather than relying on layers configured by the host page.
        const polygonsFixture = this.addLayerGeoJSONWithMetadataPolygons(test);
        polygonLayerPath = polygonsFixture.layerPath;
        polygons = await polygonsFixture.promiseLayer;

        const projectsFixture = this.addLayerEsriFeatureTopProjects(test);
        projectLayerPath = projectsFixture.layerPath;
        projects = await projectsFixture.promiseLayer;

        // Fixture IDs are generated, so selection and cleanup must use the returned runtime paths.
        const layerPath1 = polygons.getLayerPath();
        const layerPath2 = projects.getLayerPath();

        // Let the first completed map query establish the automatic Details selection.
        await this.simulateMapClickWaitForBatchedQuery(test, [-87.4, 52.9]);
        test.addStep('Checking selected layer after first click...');
        const originalLayerPath = getStoreDetailsSelectedLayerPath(this.getMapId());
        test.addStep(`First selected layer: ${originalLayerPath}`);
        // Select a different candidate regardless of which fixture was automatically selected first.
        const expectedLayerPath = originalLayerPath === layerPath1 ? layerPath2 : layerPath1;

        // A subsequent query must respect this explicit selection instead of auto-selecting another result.
        test.addStep(`Manually selecting the other layer '${expectedLayerPath}'...`);
        this.getControllersRegistry().detailsController.setSelectedLayerPath(expectedLayerPath);
        // Wait for the second batch to settle before observing selection persistence and refreshed features.
        await this.simulateMapClickWaitForBatchedQuery(test, [-73.9, 46.5]);

        test.addStep('Checking selected layer after second click...');
        const alternateLayerPath = getStoreDetailsSelectedLayerPath(this.getMapId());
        test.addStep(`Second selected layer: ${alternateLayerPath}`);
        // Read features for the actual selected layer, not merely the layer we intended to select.
        const secondFeatureCount = getStoreDetailsFeatures(this.getMapId(), alternateLayerPath)?.length ?? 0;
        test.addStep(`Second layer feature count: ${secondFeatureCount}`);
        return { originalLayerPath, expectedLayerPath, alternateLayerPath, secondFeatureCount };
      },
      (test, result) => {
        // A different layer alone is insufficient: it must be exactly the manually selected candidate.
        test.addStep('Verifying the manually selected layer persisted...');
        Test.assertIsEqual(result.alternateLayerPath, result.expectedLayerPath);
        test.addStep('Verifying first and second layers were different...');
        Test.assertIsNotEqual(result.originalLayerPath, result.alternateLayerPath);

        // Persistence must retain useful query results, not just a selected path with no features.
        test.addStep('Verifying second layer has exactly 1 feature...');
        Test.assertIsEqual(result.secondFeatureCount, 1);
      },
      (test) => {
        try {
          if (projectLayerPath) this.removeLayerConfigAndAssert(test, projectLayerPath);
        } finally {
          // Attempt polygon cleanup even if removing Top Projects fails.
          if (polygonLayerPath) this.removeLayerConfigAndAssert(test, polygonLayerPath);
        }
      }
    );
  }
}

// #region TYPES AND INTERFACES

/** Result type for the testZoomToFeatureWithPanelOffset test execution. */
export type TestZoomWithPanelOffset = {
  /** The default left padding, in map pixels, without any panel offset. */
  basePaddingLeft: number;
  /** The left padding, in map pixels, including the open panel overlap. */
  paddingLeft: number;
  /** The x map pixel of the feature center after the zoom. */
  centerPixelX: number | undefined;
};

/** Details layer selection before and after a second map click. */
type DetailsLayerSelectionResult = {
  originalLayerPath: string;
  expectedLayerPath: string;
  alternateLayerPath: string;
  secondFeatureCount: number;
};

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

// #endregion TYPES AND INTERFACES
