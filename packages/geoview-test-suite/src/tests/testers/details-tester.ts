import type { Coordinate } from 'ol/coordinate';
import { containsExtent, getCenter } from 'ol/extent';

import { Test } from '../core/test';
import { GVAbstractTester } from './abstract-gv-tester';
import type { Extent, TypeFeatureInfoEntry } from 'geoview-core/api/types/map-schema-types';
import { NoExtentError } from 'geoview-core/core/exceptions/geoview-exceptions';
import { GeoUtilities } from 'geoview-core/geo/utils/utilities';
import { OL_ZOOM_FEATURE_MAX_SCALE } from 'geoview-core/core/utils/constant';
import { DomHelper } from 'geoview-core/core/utils/dom-helper';
import { whenThisThen } from 'geoview-core/core/utils/utilities';
import { getStoreDetailsFeatures } from 'geoview-core/core/stores/states/feature-info-state';
import { getStoreMapHighlightedFeatures, getStoreMapClickMarker } from 'geoview-core/core/stores/states/map-state';
import { getStoreDetailsFeatures, getStoreDetailsSelectedLayerPath } from 'geoview-core/core/stores/states/feature-info-state';
import type { AbstractGVLayer } from 'geoview-core/geo/layer/gv-layers/abstract-gv-layer';
import type { AbstractBaseGVLayer } from 'geoview-core/geo/layer/gv-layers/abstract-base-layer';
import { MapFitPadding } from 'geoview-core/core/utils/map-fit-padding';
import { AbstractGVVector } from 'geoview-core/geo/layer/gv-layers/vector/abstract-gv-vector';

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
   * Restores the pre-test map extent during finalization, even if fixture removal fails.
   *
   * @param lonlat - The coordinate on the map to query
   * @returns A promise resolving when the test completes
   */
  testZoomToFeatureWithPanelOffset(lonlat: Coordinate): Promise<Test<TestZoomWithPanelOffset>> {
    const initialExtent = this.getMapViewer().getView().calculateExtent();
    let fixtureLayerPath: string | undefined;

    return this.test(
      `Test Zoom to feature keeps the feature out of the open details panel...`,
      async (test) => {
        // Add the GeoJson Polygons layer
        const fixture = this.addLayerGeoJSONWithMetadataPolygons(test);
        fixtureLayerPath = fixture.layerPath;
        const gvLayer = await fixture.promiseLayer;

        // Get the layer and query the coordinate to get features
        const features = await this.queryAtCoordinateRetrieveResultsForLayer(test, gvLayer, lonlat);

        const feature = features?.[0];
        if (!feature?.extent) return { features };

        // Make sure the details panel is open over the map and settled
        await this.toggleAppbarTab(test, 'details', true);
        await DomHelper.waitForReactIdle();

        // Compute the padding like the Details zoom button does
        test.addStep('Computing the panel-aware fit padding...');
        const mapSize = this.getControllersRegistry().mapController.getMapSize();
        const padding = DomHelper.Map.getAppBarPanelFitPadding(this.getMapId(), 'details', mapSize);

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
          basePaddingLeft: DomHelper.Map.getDefaultFitPadding()[3],
          paddingLeft: padding[3],
          basePaddingRight: DomHelper.Map.getDefaultFitPadding()[1],
          paddingRight: padding[1],
          mapWidth: mapSize?.[0],
          hasNavBar: !!DomHelper.getNavBar(this.getMapId()),
          centerPixelX: pixel ? pixel[0] : undefined,
        };
      },
      (test, result) => {
        test.addStep('Verifying feature has extent for zoom...');
        Test.assertIsDefined('features', result.features);
        Test.assertIsArrayLengthMinimal(result.features, 1);
        Test.assertIsDefined('feature.extent', result.features[0].extent);
        Test.assertIsDefined('zoom', result.zoom);

        // Verify the open panel was detected as overlapping the map
        test.addStep('Verifying the left padding includes the panel overlap...');
        Test.assertIsEqual(result.zoom.paddingLeft > result.zoom.basePaddingLeft, true);

        // Verify the navigation bar was detected as overlapping the map
        if (result.hasNavBar) {
          test.addStep('Verifying the right padding includes the navigation bar overlap...');
          Test.assertIsEqual(result.paddingRight > result.basePaddingRight, true);
        }

        // Verify the feature center is outside the area covered by the panel and the map controls
        test.addStep('Verifying the feature center is in the part of the map not covered by the panel or the map controls...');
        Test.assertIsDefined('centerPixelX', result.centerPixelX);
        Test.assertIsDefined('mapWidth', result.mapWidth);
        Test.assertIsEqual(result.centerPixelX >= result.paddingLeft, true);
        Test.assertIsEqual(result.centerPixelX <= result.mapWidth - result.paddingRight, true);
      },
      async (test) => {
        try {
          // Cleanup the map
          if (fixtureLayerPath) this.removeLayerConfigAndAssert(test, fixtureLayerPath);
        } finally {
          test.addStep('Restoring the pre-test map extent...');
          await this.getControllersRegistry().mapController.zoomToExtent(initialExtent, false);
        }
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
    let cleanupLookup: (() => void) | undefined;
    return this.test(
      `Test Zoom to all results for layer ${layerPath}...`,
      async (test) => {
        const { layerController, mapController } = this.getControllersRegistry();
        const view = this.getMapViewer().getView();
        const fitOptions = GVAbstractTester.USE_ZOOM_ANIMATION ? {} : { duration: 0 };

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
        const staleCenterUnchanged = JSON.stringify(view.getCenter()) === JSON.stringify(centerBeforeStale);

        test.addStep('Looking up a group whose embedded extents are all missing...');
        if (!(layer instanceof AbstractGVVector) || !polygon.feature) throw new Error('Expected a vector feature lookup fixture');
        const source = layer.getOLLayer().getSource();
        if (!source) throw new Error('Expected a vector source for extent lookup');
        const lookupFeature = polygon.feature.clone();
        const lookupId =
          Math.max(
            0,
            ...source
              .getFeatures()
              .map((feature) => Number(feature.getId()))
              .filter(Number.isFinite)
          ) + 1;
        lookupFeature.setId(lookupId);
        source.addFeature(lookupFeature);
        cleanupLookup = (): void => source.removeFeature(lookupFeature);
        const lookupResults: TypeFeatureInfoEntry[] = [
          {
            ...polygon,
            extent: undefined,
            geometry: undefined,
            fieldInfo: { id: { fieldKey: 0, value: lookupId, dataType: 'oid', alias: 'id' } },
          },
        ];
        const missingExtentsAvailable = layerController.canZoomToFeaturesGroupExtent(layerPath, lookupResults);
        const lookedUpZoomed = await layerController.zoomToFeaturesGroupExtent(layerPath, lookupResults, fitOptions);
        const lookedUpExtentInView = containsExtent(view.calculateExtent(this.getMapViewer().map.getSize()), polygon.extent);

        // An instant fit completes before it can be interrupted: use a long animation and cancel it as soon as it starts,
        // so the map stays in place (the next test queries by pixel at the current view)
        test.addStep('Interrupting a group zoom before it reaches its destination...');
        const interruptedZoom = layerController.zoomToFeaturesGroupExtent(
          layerPath,
          [createResult([cx + 900000, cy, cx + 950000, cy + 50000], 0)],
          { ...fitOptions, duration: 60000 }
        );
        await whenThisThen(() => view.getAnimating(), GVAbstractTester.UI_STATE_TIMEOUT_MS, 10);
        view.cancelAnimations();
        const cancelledZoomed = await interruptedZoom;

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
          staleCenterUnchanged,
          missingExtentsAvailable,
          lookedUpZoomed,
          lookedUpExtentInView,
          cancelledZoomed,
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

        test.addStep('Verifying lookup-only results can zoom and interrupted fits do not report completion...');
        Test.assertIsEqual(result.missingExtentsAvailable, true);
        Test.assertIsEqual(result.lookedUpZoomed, true);
        Test.assertIsEqual(result.lookedUpExtentInView, true);
        Test.assertIsEqual(result.cancelledZoomed, false);
      },
      () => {
        cleanupLookup?.();
      }
    );
  }

  /**
   * Tests that zoom to feature does not zoom closer than the feature bound for a point, and that bringing another
   * feature into view (Details previous/next after a zoom to feature) only pans for a small feature, zooms out for
   * a feature larger than the view, and never zooms back in.
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
        const fitOptions = GVAbstractTester.USE_ZOOM_ANIMATION ? {} : { duration: 0 };

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
        const clickMarkerAfterZoom = getStoreMapClickMarker(this.getMapId());

        // Pan to another small feature, like previous/next does after a zoom to feature
        test.addStep('Bringing a small feature into view...');
        const nextExtent: Extent = [cx + 2000, cy + 1000, cx + 2200, cy + 1200];
        const panIsFeatureZoomView = await layerController.panToExtentRestrictedAndOutline(
          layerPath,
          nextExtent,
          GVAbstractTester.USE_ZOOM_ANIMATION,
          fitOptions
        );
        const panResolution = view.getResolution();
        const nextFeatureInView = containsExtent(view.calculateExtent(this.getMapViewer().map.getSize()), nextExtent);

        // Bring a feature larger than the view into view: it must zoom out to fit it
        test.addStep('Bringing a large feature into view...');
        const largeExtent: Extent = [cx - 50000, cy - 50000, cx + 50000, cy + 50000];
        const largeIsFeatureZoomView = await layerController.panToExtentRestrictedAndOutline(
          layerPath,
          largeExtent,
          GVAbstractTester.USE_ZOOM_ANIMATION,
          fitOptions
        );
        const largeResolution = view.getResolution();
        const largeFeatureInView = containsExtent(view.calculateExtent(this.getMapViewer().map.getSize()), largeExtent);

        // Bring the small feature back: it must not zoom in again
        test.addStep('Bringing the small feature back into view...');
        const backToSmallIsFeatureZoomView = await layerController.panToExtentRestrictedAndOutline(
          layerPath,
          nextExtent,
          GVAbstractTester.USE_ZOOM_ANIMATION,
          fitOptions
        );

        return {
          featureMinResolution: mapController.getResolutionFromScale(OL_ZOOM_FEATURE_MAX_SCALE),
          pointZoomResolution,
          clickMarkerAfterZoom,
          panResolution,
          nextFeatureInView,
          largeResolution,
          largeFeatureInView,
          backToSmallResolution: view.getResolution(),
          panIsFeatureZoomView,
          largeIsFeatureZoomView,
          backToSmallIsFeatureZoomView,
        };
      },
      (test, result) => {
        test.addStep('Verifying the point zoom stops at the feature bound...');
        Test.assertIsDefined('featureMinResolution', result.featureMinResolution);
        Test.assertIsDefined('pointZoomResolution', result.pointZoomResolution);
        Test.assertIsEqual(result.pointZoomResolution >= result.featureMinResolution * 0.999, true);

        test.addStep('Verifying the zoom to feature hides the click marker...');
        Test.assertIsUndefined('clickMarkerAfterZoom', result.clickMarkerAfterZoom);

        test.addStep('Verifying a small feature only pans (keeps the resolution) and is in view...');
        Test.assertIsDefined('panResolution', result.panResolution);
        Test.assertIsEqual(Math.abs(result.panResolution - result.pointZoomResolution) <= result.pointZoomResolution * 0.001, true);
        Test.assertIsEqual(result.nextFeatureInView, true);

        test.addStep('Verifying a large feature zooms out and is fully in view...');
        Test.assertIsDefined('largeResolution', result.largeResolution);
        Test.assertIsEqual(result.largeResolution > result.panResolution, true);
        Test.assertIsEqual(result.largeFeatureInView, true);

        test.addStep('Verifying going back to a small feature does not zoom in...');
        Test.assertIsDefined('backToSmallResolution', result.backToSmallResolution);
        Test.assertIsEqual(Math.abs(result.backToSmallResolution - result.largeResolution) <= result.largeResolution * 0.001, true);

        test.addStep('Verifying when a pan already shows the zoom to feature view (zoom button would have no effect)...');
        Test.assertIsEqual(result.panIsFeatureZoomView, true);
        Test.assertIsEqual(result.largeIsFeatureZoomView, true);
        Test.assertIsEqual(result.backToSmallIsFeatureZoomView, false);
      }
    );
  }

  /**
   * Tests that the Details zoom to all results button becomes unavailable (aria-disabled) after its zoom, and
   * available again once the map view changes.
   *
   * @param layerPath - The layer path of a layer returning several results at the coordinate
   * @param lonlat - The coordinate on the map to click
   * @returns A promise resolving when the test completes
   */
  testZoomToResultsButtonUnavailableUntilViewChanges(layerPath: string, lonlat: Coordinate): Promise<Test<TestZoomButtonState>> {
    const BUTTON_SELECTOR = 'button[aria-label="Zoom to all results for this layer"]';

    return this.test(
      `Test Zoom to all results button is unavailable until the map view changes on layer ${layerPath}...`,
      async (test) => {
        const root = DomHelper.getGVRootElement(this.getMapId());

        // Vector queries use a pixel hit tolerance, so the result count depends on the view: go back to the initial view
        // (previous tests zoomed in) where the click returns several results for the layer
        test.addStep('Zooming to the initial extent...');
        await this.getControllersRegistry().mapController.zoomToInitialExtent(GVAbstractTester.USE_ZOOM_ANIMATION);

        // Click the map and select the layer, so the Details panel shows its results
        await this.getControllersRegistry().layerController.waitForLayersLoaded();
        await this.simulateMapClickWaitForBatchedQuery(test, lonlat);
        await DomHelper.waitForAppbarTabSelected(this.getMapId(), 'details');
        this.getControllersRegistry().detailsController.setSelectedLayerPath(layerPath);

        // The button only shows for several results; return early so the assertion can report a missing prerequisite
        test.addStep('Getting the number of layer results...');
        const resultCount = getStoreDetailsFeatures(this.getMapId(), layerPath)?.length ?? 0;
        if (resultCount <= 1) return { resultCount };

        // Get the button
        test.addStep('Waiting for the zoom to all results button...');
        const waitForElement = async (selector: string): Promise<Element> => {
          const element = await whenThisThen(() => root.querySelector(selector), GVAbstractTester.UI_STATE_TIMEOUT_MS, 50);
          if (!element) throw new Error(`Element not found: ${selector}`);
          return element;
        };
        const button = await waitForElement(BUTTON_SELECTOR);
        const disabledBefore = button.getAttribute('aria-disabled') ?? undefined;

        // Click it and wait for it to become unavailable once the zoom completed
        test.addStep('Clicking the zoom to all results button...');
        (button as HTMLButtonElement).click();
        const disabledAfterZoom =
          (await waitForElement(`${BUTTON_SELECTOR}[aria-disabled="true"]`)).getAttribute('aria-disabled') ?? undefined;

        // Change the map view and wait for the button to become available again
        test.addStep('Changing the map view...');
        const center = this.getMapViewer().getView().getCenter()!;
        await this.getControllersRegistry().mapController.zoomToExtent(
          [center[0] + 1000, center[1] + 1000, center[0] + 2000, center[1] + 2000],
          GVAbstractTester.USE_ZOOM_ANIMATION
        );
        const disabledAfterViewChange =
          (await waitForElement(`${BUTTON_SELECTOR}[aria-disabled="false"]`)).getAttribute('aria-disabled') ?? undefined;

        // Zoom to the feature, then leave the layer and come back: the next feature must not be followed anymore
        test.addStep('Zooming to a feature, then switching away and back to the layer...');
        const featureButton = await waitForElement('button[aria-label="Zoom to feature"]');
        (featureButton as HTMLButtonElement).click();
        await waitForElement('button[aria-label="Zoom to feature"][aria-disabled="true"]');
        const { detailsController } = this.getControllersRegistry();
        detailsController.setSelectedLayerPath('');
        await DomHelper.waitForReactIdle();
        detailsController.setSelectedLayerPath(layerPath);
        await DomHelper.waitForReactIdle();
        const centerBeforeNavigation = [...this.getMapViewer().getView().getCenter()!];
        const nextButton = await waitForElement('button[aria-label="Next feature"]');
        (nextButton as HTMLButtonElement).click();
        await DomHelper.waitForReactIdle();
        const followsAfterLayerSwitch =
          this.getMapViewer().getView().getAnimating() ||
          JSON.stringify(centerBeforeNavigation) !== JSON.stringify(this.getMapViewer().getView().getCenter());

        return { resultCount, disabledBefore, disabledAfterZoom, disabledAfterViewChange, followsAfterLayerSwitch };
      },
      (test, result) => {
        test.addStep('Verifying the layer returned several results...');
        Test.assertIsEqual(result.resultCount > 1, true);

        test.addStep('Verifying the button is available before the zoom...');
        Test.assertIsEqual(result.disabledBefore, 'false');

        test.addStep('Verifying the button is unavailable after the zoom...');
        Test.assertIsEqual(result.disabledAfterZoom, 'true');

        test.addStep('Verifying the button is available again after the map view changed...');
        Test.assertIsEqual(result.disabledAfterViewChange, 'false');

        test.addStep('Verifying returning to a layer does not restore feature-follow...');
        Test.assertIsEqual(result.followsAfterLayerSwitch, false);
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

/** Result of the button state test; button observations are absent when fewer than two results are returned. */
export type TestZoomButtonState = {
  /** The number of features returned for the layer. */
  resultCount: number;
  /** Whether feature navigation incorrectly resumed following after switching layers. */
  followsAfterLayerSwitch?: boolean;
  /** The button aria-disabled value before the zoom. */
  disabledBefore?: string;
  /** The button aria-disabled value once the zoom completed. */
  disabledAfterZoom?: string;
  /** The button aria-disabled value once the map view changed. */
  disabledAfterViewChange?: string;
};

/** Result type for the testZoomToFeatureBoundAndPan test execution. */
export type TestZoomToFeatureBoundAndPan = {
  /** The resolution matching the closest scale a feature zoom can reach. */
  featureMinResolution: number | undefined;
  /** The view resolution after zooming to a point feature. */
  pointZoomResolution: number | undefined;
  /** The click marker after the zoom to feature, expected hidden (undefined). */
  clickMarkerAfterZoom: unknown;
  /** The view resolution after bringing a small feature into view. */
  panResolution: number | undefined;
  /** Whether the small feature was in view after the pan. */
  nextFeatureInView: boolean;
  /** The view resolution after bringing a feature larger than the view into view. */
  largeResolution: number | undefined;
  /** Whether the large feature was fully in view after the zoom out. */
  largeFeatureInView: boolean;
  /** The view resolution after bringing the small feature back into view. */
  backToSmallResolution: number | undefined;
  /** Whether the small feature pan landed on its zoom to feature view (map at the feature zoom bound). */
  panIsFeatureZoomView: boolean;
  /** Whether the large feature pan landed on its zoom to feature view (pan zoomed out to fit it). */
  largeIsFeatureZoomView: boolean;
  /** Whether the pan back to the small feature landed on its zoom to feature view (expected not: a zoom would zoom in). */
  backToSmallIsFeatureZoomView: boolean;
};

/** Result type for the testZoomToResultsGroupExtent test execution. */
export type TestZoomToResultsGroupExtent = {
  /** Whether results with only lookup-capable IDs enable group zoom. */
  missingExtentsAvailable: boolean;
  /** Whether a group with no embedded extents zoomed after object-ID lookup. */
  lookedUpZoomed: boolean;
  /** Whether the looked-up geometry extent was fitted. */
  lookedUpExtentInView: boolean;
  /** Whether an interrupted animation incorrectly reported success. */
  cancelledZoomed: boolean;
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
  /** The default right padding, in map pixels, without any map controls offset. */
  basePaddingRight: number;
  /** The right padding, in map pixels, including the map controls (navigation bar, overview map) overlap. */
  paddingRight: number;
  /** The map width in map pixels. */
  mapWidth: number | undefined;
  /** Whether the navigation bar is shown on the map. */
  hasNavBar: boolean;
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
