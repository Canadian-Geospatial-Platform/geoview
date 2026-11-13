import type { Coordinate } from 'ol/coordinate';
import { containsExtent, getCenter } from 'ol/extent';

import { Test } from '../core/test';
import { GVAbstractTester } from './abstract-gv-tester';
import type { Extent, TypeFeatureInfoEntry } from 'geoview-core/api/types/map-schema-types';
import type { TypeGeoviewLayerType } from 'geoview-core/api/types/layer-schema-types';
import { NoExtentError } from 'geoview-core/core/exceptions/geoview-exceptions';
import { GeoUtilities } from 'geoview-core/geo/utils/utilities';
import { OL_ZOOM_FEATURE_MAX_SCALE } from 'geoview-core/core/utils/constant';
import { DomHelper } from 'geoview-core/core/utils/dom-helper';
import { MapFitPadding } from 'geoview-core/core/utils/map-fit-padding';
import { getStoreLayerItemVisibility } from 'geoview-core/core/stores/states/layer-state';
import { getStoreMapHighlightedFeatures, getStoreMapClickMarker } from 'geoview-core/core/stores/states/map-state';
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

        // Query the lonlat coordinate
        const resultsOntarioResults = await this.queryAtCoordinateRetrieveResultsForLayer(test, layer, lonlat1);

        // Select the right layer path
        test.addStep(`Selecting the details for the added layer...`);
        this.getControllersRegistry().detailsController.setSelectedLayerPath(layerPath);

        // Make the layer invisible
        test.addStep(`Make the layer invisible...`);
        layer.setVisible(false);

        // Query the lonlat coordinate
        const resultsOntarioNoResults = await this.queryAtCoordinateRetrieveResultsForLayer(test, layer, lonlat1);

        // Make the layer visible
        test.addStep(`Make the layer visible...`);
        layer.setVisible(true);

        // Query in Alberta where there should be no results
        const resultsAlbertaNoResults1 = await this.queryAtCoordinateRetrieveResultsForLayer(test, layer, lonlat2);

        // Make the Alberta polygon visible
        let item = getStoreLayerItemVisibility(this.getMapId(), layerPath, 'Alberta')!;
        await this.getControllersRegistry().layerController.toggleItemVisibility(layerPath, item, true);

        // Query where there now should be some results
        const resultsAlbertaResults = await this.queryAtCoordinateRetrieveResultsForLayer(test, layer, lonlat2);

        // Make the Alberta polygon back to invisible
        item = getStoreLayerItemVisibility(this.getMapId(), layerPath, 'Alberta')!;
        await this.getControllersRegistry().layerController.toggleItemVisibility(layerPath, item, true);

        // Query where there now should be no results
        const resultsAlbertaNoResults2 = await this.queryAtCoordinateRetrieveResultsForLayer(test, layer, lonlat2);

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
      }
    );
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
        await this.simulateMapClickWaitForBatchedQuery(test, lonlat);

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
        await this.simulateMapClickWaitForBatchedQuery(test, lonlat);

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
        const features = await this.queryAtCoordinateRetrieveResultsForLayer(test, layer, lonlat);

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
   * Tests that zoom-to-feature keeps the feature visible next to an open app-bar panel.
   *
   * @param layerPath - The layer path of the layer
   * @param lonlat - The coordinate on the map to query
   * @returns A promise resolving when the test completes
   */
  testZoomToFeatureWithPanelOffset(layerPath: string, lonlat: Coordinate): Promise<Test<TestZoomWithPanelOffset>> {
    return this.test(
      `Test Zoom to feature keeps the feature out of the open details panel on layer ${layerPath}...`,
      async (test) => {
        // Get the layer and query the coordinate to get features
        const layer = this.getControllersRegistry().layerController.getGeoviewLayerRegular(layerPath);
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
          layerPath,
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
      }
    );
  }

  /**
   * Tests zooming to the combined extent of a group of Details results (the "zoom to all results" button).
   *
   * Covers spatially distinct points, coincident points, tiny extents, polygons with lines,
   * missing/invalid extents and stale group requests.
   *
   * @param layerPath - The layer path of the layer
   * @param lonlat - The coordinate on the map to query
   * @returns A promise resolving when the test completes
   */
  testZoomToResultsGroupExtent(layerPath: string, lonlat: Coordinate): Promise<Test<TestZoomToResultsGroupExtent>> {
    return this.test(
      `Test Zoom to all results for layer ${layerPath}...`,
      async (test) => {
        const { layerController, mapController } = this.getControllersRegistry();
        const view = this.getMapViewer().getView();
        const fitOptions = { duration: GVAbstractTester.USE_ZOOM_ANIMATION ? undefined : 0 };

        // Get a real result to build the group results from
        const layer = layerController.getGeoviewLayerRegular(layerPath);
        const features = await this.queryAtCoordinateRetrieveResultsForLayer(test, layer, lonlat);
        Test.assertIsDefined('features', features);
        Test.assertIsArrayLengthMinimal(features, 1);
        const polygon = features[0];
        Test.assertIsDefined('polygon.extent', polygon.extent);
        const [cx, cy] = getCenter(polygon.extent);

        // Creates a result clone with the given extent and no oid field (no extent lookup)
        const createResult = (extent: Extent | undefined, index: number): TypeFeatureInfoEntry => ({
          ...polygon,
          uid: `${polygon.uid}-group-${index}`,
          fieldInfo: {},
          extent,
        });

        // Zooms to the given results and returns whether every expected extent is in the view after the zoom
        const zoomAndCheck = async (results: TypeFeatureInfoEntry[], expected: Extent[]): Promise<boolean> => {
          await layerController.zoomToFeaturesGroupExtent(layerPath, results, fitOptions);
          const viewExtent = view.calculateExtent(this.getMapViewer().map.getSize());
          return expected.every((extent) => containsExtent(viewExtent, extent));
        };

        // Zooms far out so the bounded zoom-in policy is exercised
        const zoomOut = (): Promise<void> =>
          mapController.zoomToExtent([cx - 3000000, cy - 3000000, cx + 3000000, cy + 3000000], false, fitOptions);

        // Five spatially distinct points
        test.addStep('Zooming to five spatially distinct points...');
        const pointOffsets = [
          [0, 0],
          [100000, 0],
          [-100000, 50000],
          [50000, -100000],
          [-50000, 100000],
        ];
        const pointExtents: Extent[] = pointOffsets.map(([dx, dy]) => [cx + dx, cy + dy, cx + dx, cy + dy]);
        const distinctPointsInView = await zoomAndCheck(
          pointExtents.map((extent, index) => createResult(extent, index)),
          pointExtents
        );

        // Coincident points, from far out
        test.addStep('Zooming to coincident points from a zoomed out view...');
        await zoomOut();
        const coincident: Extent = [cx, cy, cx, cy];
        await layerController.zoomToFeaturesGroupExtent(layerPath, [createResult(coincident, 0), createResult(coincident, 1)], fitOptions);
        const coincidentResolution = view.getResolution();

        // Tiny extent (1 map unit apart), from far out
        test.addStep('Zooming to a tiny combined extent from a zoomed out view...');
        await zoomOut();
        await layerController.zoomToFeaturesGroupExtent(
          layerPath,
          [createResult([cx, cy, cx, cy], 0), createResult([cx + 1, cy + 1, cx + 1, cy + 1], 1)],
          fitOptions
        );
        const tinyResolution = view.getResolution();

        // Polygon and line
        test.addStep('Zooming to a polygon and a line...');
        const lineExtent: Extent = [cx + 200000, cy - 10000, cx + 400000, cy + 10000];
        const polygonAndLineInView = await zoomAndCheck(
          [createResult(polygon.extent, 0), createResult(lineExtent, 1)],
          [polygon.extent, lineExtent]
        );

        // Missing and invalid extents are ignored
        test.addStep('Zooming to results with missing and invalid extents...');
        const validExtent: Extent = [cx + 10000, cy + 10000, cx + 20000, cy + 20000];
        const invalidIgnoredInView = await zoomAndCheck(
          [
            createResult(undefined, 0),
            createResult([NaN, NaN, NaN, NaN], 1),
            createResult([cx + 10, cy + 10, cx - 10, cy - 10], 2),
            createResult(validExtent, 3),
          ],
          [validExtent]
        );

        // Only invalid extents
        test.addStep('Zooming to results without any valid extent...');
        let allInvalidError: unknown;
        try {
          await layerController.zoomToFeaturesGroupExtent(
            layerPath,
            [createResult(undefined, 0), createResult([NaN, 0, NaN, 0], 1)],
            fitOptions
          );
        } catch (error: unknown) {
          allInvalidError = error;
        }

        // Pure WMS-like results: click point extent but no geometry
        test.addStep('Verifying results without geometry (pure WMS click point extents) have no group extent...');
        const clickPointResults = [0, 1].map((index) => ({ ...createResult([cx, cy, cx, cy], index), geometry: undefined }));
        const noGeometryGroupExtent = GeoUtilities.getFeaturesGeometryExtent(clickPointResults);

        // Stale request
        test.addStep('Zooming to a group that became stale...');
        const centerBeforeStale = view.getCenter();
        const staleZoomed = await layerController.zoomToFeaturesGroupExtent(
          layerPath,
          [createResult([cx + 900000, cy, cx + 900000, cy], 0), createResult([cx + 950000, cy, cx + 950000, cy], 1)],
          fitOptions,
          () => true
        );

        return {
          distinctPointsInView,
          coincidentResolution,
          tinyResolution,
          groupMinResolution: mapController.getResolutionFromScale(OL_ZOOM_FEATURE_MAX_SCALE),
          polygonAndLineInView,
          invalidIgnoredInView,
          allInvalidThrowsNoExtent: allInvalidError instanceof NoExtentError,
          noGeometryGroupExtent,
          staleZoomed,
          staleCenterUnchanged: JSON.stringify(view.getCenter()) === JSON.stringify(centerBeforeStale),
        };
      },
      (test, result) => {
        test.addStep('Verifying the five distinct points are all in view...');
        Test.assertIsEqual(result.distinctPointsInView, true);

        test.addStep('Verifying coincident points do not zoom closer than the group bound...');
        Test.assertIsDefined('groupMinResolution', result.groupMinResolution);
        Test.assertIsDefined('coincidentResolution', result.coincidentResolution);
        Test.assertIsEqual(result.coincidentResolution >= result.groupMinResolution * 0.999, true);

        test.addStep('Verifying a tiny extent does not zoom closer than the group bound...');
        Test.assertIsDefined('tinyResolution', result.tinyResolution);
        Test.assertIsEqual(result.tinyResolution >= result.groupMinResolution * 0.999, true);

        test.addStep('Verifying the polygon and line are both in view...');
        Test.assertIsEqual(result.polygonAndLineInView, true);

        test.addStep('Verifying missing/invalid extents are ignored...');
        Test.assertIsEqual(result.invalidIgnoredInView, true);

        test.addStep('Verifying a group without valid extent throws NoExtentError...');
        Test.assertIsEqual(result.allInvalidThrowsNoExtent, true);

        test.addStep('Verifying results without geometry have no group extent...');
        Test.assertIsUndefined('noGeometryGroupExtent', result.noGeometryGroupExtent);

        test.addStep('Verifying a stale group does not move the map...');
        Test.assertIsEqual(result.staleZoomed, false);
        Test.assertIsEqual(result.staleCenterUnchanged, true);
      }
    );
  }

  /**
   * Tests that zoom to feature does not zoom closer than the feature bound for a point, and that panning to
   * another feature (Details previous/next after a zoom to feature) keeps the resolution and centers the feature.
   *
   * @param layerPath - The layer path of the layer
   * @param lonlat - The coordinate on the map to query
   * @returns A promise resolving when the test completes
   */
  testZoomToFeatureBoundAndPan(layerPath: string, lonlat: Coordinate): Promise<Test<TestZoomToFeatureBoundAndPan>> {
    return this.test(
      `Test Zoom to point feature bound and pan to next feature on layer ${layerPath}...`,
      async (test) => {
        const { layerController, mapController } = this.getControllersRegistry();
        const view = this.getMapViewer().getView();
        const fitOptions = { duration: GVAbstractTester.USE_ZOOM_ANIMATION ? undefined : 0 };

        // Get a real result to build a point feature from
        const layer = layerController.getGeoviewLayerRegular(layerPath);
        const features = await this.queryAtCoordinateRetrieveResultsForLayer(test, layer, lonlat);
        Test.assertIsDefined('features', features);
        Test.assertIsArrayLengthMinimal(features, 1);
        Test.assertIsDefined('features[0].extent', features[0].extent);
        const [cx, cy] = getCenter(features[0].extent);
        const pointExtent: Extent = [cx, cy, cx, cy];

        // Zoom far out, then zoom to a point feature
        test.addStep('Zooming to a point feature from a zoomed out view...');
        await mapController.zoomToExtent([cx - 3000000, cy - 3000000, cx + 3000000, cy + 3000000], false, fitOptions);
        await layerController.zoomToExtentRestrictedAndHighlight(
          layerPath,
          { ...features[0], extent: pointExtent },
          pointExtent,
          GVAbstractTester.USE_ZOOM_ANIMATION,
          fitOptions
        );
        const pointZoomResolution = view.getResolution();

        // Pan to another feature, like previous/next does after a zoom to feature
        test.addStep('Panning to another feature...');
        const nextExtent: Extent = [cx + 2000, cy + 1000, cx + 2200, cy + 1200];
        await mapController.panToExtentAndMark(nextExtent, GVAbstractTester.USE_ZOOM_ANIMATION, fitOptions);
        const viewExtent = view.calculateExtent(this.getMapViewer().map.getSize());

        return {
          featureMinResolution: mapController.getResolutionFromScale(OL_ZOOM_FEATURE_MAX_SCALE),
          pointZoomResolution,
          panResolution: view.getResolution(),
          nextFeatureInView: containsExtent(viewExtent, nextExtent),
        };
      },
      (test, result) => {
        test.addStep('Verifying the point zoom stops at the feature bound...');
        Test.assertIsDefined('featureMinResolution', result.featureMinResolution);
        Test.assertIsDefined('pointZoomResolution', result.pointZoomResolution);
        Test.assertIsEqual(result.pointZoomResolution >= result.featureMinResolution * 0.999, true);

        test.addStep('Verifying the pan keeps the resolution...');
        Test.assertIsDefined('panResolution', result.panResolution);
        Test.assertIsEqual(Math.abs(result.panResolution - result.pointZoomResolution) <= result.pointZoomResolution * 0.001, true);

        test.addStep('Verifying the next feature is in view after the pan...');
        Test.assertIsEqual(result.nextFeatureInView, true);
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
        return this.queryAtCoordinateRetrieveResultsForLayer(test, layer, GVAbstractTester.ONTARIO_CENTER_LONLAT);
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
        return this.queryAtCoordinateRetrieveResultsForLayer(test, layer, GVAbstractTester.ONTARIO_CENTER_LONLAT);
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
        return this.queryAtCoordinateRetrieveResultsForLayer(test, layer, GVAbstractTester.ONTARIO_CENTER_LONLAT);
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
          core: ['legend', 'layers'],
        },
      },
    };

    // Replace the map!
    return this.replaceMap(test, mapId, baseConfig);
  }

  // #endregion
}

// #region TYPES AND INTERFACES

/** Result type for the testZoomToFeatureBoundAndPan test execution. */
export type TestZoomToFeatureBoundAndPan = {
  /** The resolution matching the closest scale a feature zoom can reach. */
  featureMinResolution: number | undefined;
  /** The view resolution after zooming to a point feature. */
  pointZoomResolution: number | undefined;
  /** The view resolution after panning to another feature. */
  panResolution: number | undefined;
  /** Whether the other feature was in view after the pan. */
  nextFeatureInView: boolean;
};

/** Result type for the testZoomToResultsGroupExtent test execution. */
export type TestZoomToResultsGroupExtent = {
  /** Whether the five distinct points were all in view after the group zoom. */
  distinctPointsInView: boolean;
  /** The view resolution after zooming to coincident points. */
  coincidentResolution: number | undefined;
  /** The view resolution after zooming to a tiny combined extent. */
  tinyResolution: number | undefined;
  /** The resolution matching the closest scale a group zoom can reach. */
  groupMinResolution: number | undefined;
  /** Whether the polygon and the line were both in view after the group zoom. */
  polygonAndLineInView: boolean;
  /** Whether the valid extent was in view when mixed with missing/invalid extents. */
  invalidIgnoredInView: boolean;
  /** Whether a group without any valid extent threw a NoExtentError. */
  allInvalidThrowsNoExtent: boolean;
  /** The group extent of results without geometry (pure WMS click point extents), expected undefined. */
  noGeometryGroupExtent: Extent | undefined;
  /** Whether the stale group zoom reported a zoom. */
  staleZoomed: boolean;
  /** Whether the map center was unchanged by the stale group zoom. */
  staleCenterUnchanged: boolean;
};

/** Result type for the testZoomToFeatureWithPanelOffset test execution. */
export type TestZoomWithPanelOffset = {
  /** The default left padding, in map pixels, without any panel offset. */
  basePaddingLeft: number;
  /** The left padding, in map pixels, including the open panel overlap. */
  paddingLeft: number;
  /** The x map pixel of the feature center after the zoom. */
  centerPixelX: number | undefined;
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
