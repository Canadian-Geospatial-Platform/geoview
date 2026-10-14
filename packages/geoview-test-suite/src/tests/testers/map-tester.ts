import type { Coordinate } from 'ol/coordinate';

import { TestError } from '../core/exceptions';
import { Test } from '../core/test';
import { GVAbstractTester } from './abstract-gv-tester';
import { generateId } from 'geoview-core/core/utils/utilities';
import {
  MAP_CENTER,
  MAP_ZOOM_LEVEL,
  type Extent,
  type TypeBasemapId,
  type TypeInteraction,
  type TypeMapState,
  type TypeValidMapProjectionCodes,
  type TypeViewportBoundaryLonLat,
} from 'geoview-core/api/types/map-schema-types';
import { InvalidViewportMidpointsError, MapViewportUnavailableError } from 'geoview-core/core/exceptions/geoview-exceptions';
import { CancelledError } from 'geoview-core/core/exceptions/core-exceptions';
import {
  getStoreDetailsFeatures,
  getStoreDetailsSelectedLayerPath,
  type TypeFeatureInfoResultSetEntry,
  type TypeHoverFeatureInfo,
} from 'geoview-core/core/stores/states/feature-info-state';
import type { AbstractGVLayer } from 'geoview-core/geo/layer/gv-layers/abstract-gv-layer';
import { Projection } from 'geoview-core/geo/utils/projection';
import { getStoreUIActiveAppBarTab, getStoreUIActiveFooterBarTab, getStoreUIFooterTabs } from 'geoview-core/core/stores/states/ui-state';
import { getStoreAppDisplayLanguage, getStoreAppNotifications } from 'geoview-core/core/stores/states/app-state';
import {
  getStoreMapConfigViewSettingsProjection,
  getStoreMapHoverFeatureInfo,
  getStoreMapStateJson,
} from 'geoview-core/core/stores/states/map-state';
import { getStoreLayerOrderedLayerPaths } from 'geoview-core/core/stores/states/layer-state';
import { VectorTiles } from 'geoview-core/geo/layer/geoview-layers/raster/vector-tiles';
import type { MapViewer } from 'geoview-core/geo/map/map-viewer';
import { getGVRootElement, getGVMapTargetElement } from 'geoview-core/core/utils/dom-helper';

/** Captured boundary samples and independent pixel/coordinate expectations. */
interface TypeViewportBoundarySnapshot {
  /** Public viewer result. */
  boundary: TypeViewportBoundaryLonLat;
  /** Second snapshot from the same rendered frame. */
  repeatedBoundary: TypeViewportBoundaryLonLat;
  /** Samples calculated from view center, resolution, rotation, and padding. */
  expected: Coordinate[];
  /** Returned coordinates projected back to viewport pixels. */
  pixels: (number[] | null)[];
  /** Expected screen positions. */
  expectedPixels: number[][];
  /** Bottom padding at sampling time. */
  bottomPadding: number;
  /** Actual map-info bar overlay height (zero for static maps). */
  infoHeight: number;
  /** Southern sample calculated at the full canvas bottom. */
  canvasSouth: Coordinate;
  /** Indicates independent objects were returned by consecutive calls. */
  freshObjects: boolean;
  /** Rendered view rotation in radians. */
  rotation: number;
  /** Rendered logical center in longitude/latitude. */
  center: Coordinate;
  /** Southern midpoint derived from the axis-aligned extent rather than the viewport. */
  extentSouth: Coordinate;
}

/** Fit outcome captured before assertion so operations stay in the execution phase. */
interface TypeViewportMidpointFitResult {
  /** Rendered geometry after fitting. */
  snapshot: TypeViewportBoundarySnapshot;
  /** Original coordinates copied before fitting. */
  original: Coordinate[];
  /** Caller-owned array after fitting. */
  input: Coordinate[];
  /** Original coordinates projected to pixels after fitting. */
  pixels: (number[] | null)[];
  /** Original pixel positions before the view was changed. */
  originalPixels: number[][];
  /** Source rotation to restore when the projection is unchanged. */
  rotation: number;
}

/**
 * Main Map testing class.
 *
 */
export class MapTester extends GVAbstractTester {
  // #region OVERRIDES

  /**
   * Returns the name of the Tester.
   *
   * @returns The name of the Tester
   */
  override getName(): string {
    return 'MapTester';
  }

  // #endregion OVERRIDES

  // #region PUBLIC METHODS - VIEWPORT BOUNDARY

  /**
   * Tests fitting midpoint coordinates in the map-config suite's existing container.
   *
   * @param projection - Source projection
   * @param rotation - Optional rotation in radians
   * @param interaction - Optional interaction mode
   * @param change - Optional change to viewport aspect ratio or projection before fitting
   * @param useAnimation - Optional animation flag
   * @param center - Optional source center in longitude/latitude
   * @returns A promise that resolves with the fit outcome
   */
  testFitViewportToMidpointsLonLat(
    projection: TypeValidMapProjectionCodes,
    rotation = 0,
    interaction: TypeInteraction = 'dynamic',
    change: 'none' | 'resize' | 'projection' = 'none',
    useAnimation = false,
    center: Coordinate = MAP_CENTER[projection]
  ): Promise<Test<TypeViewportMidpointFitResult>> {
    const host = this.#getViewportHost();
    const originalWidth = host.style.width;
    return this.test(
      `Test fitting viewport midpoints EPSG:${projection}, rotation ${rotation}, ${interaction}, ${change}, animated ${useAnimation}`,
      async (test): Promise<TypeViewportMidpointFitResult> => {
        const viewer = await this.#createViewportFixture(test, host, projection, interaction, center, rotation);
        viewer.getView().padding = interaction === 'dynamic' ? [15, 25, 60, 35] : [0, 0, 0, 0];
        viewer.map.renderSync();
        const before = MapTester.#captureViewportBoundary(viewer);
        const input = before.boundary.midpointWSENCoords;
        const original = input.map((coordinate) => [...coordinate]);
        test.addStep('Changing the view before fitting the captured WSEN coordinates...');
        if (change === 'resize') {
          host.style.width = '540px';
          viewer.map.updateSize();
        }
        if (change === 'projection') {
          viewer.setView({ projection: 3857, initialView: { zoomAndCenter: [5, MAP_CENTER[3857]] }, rotation });
        }
        const view = viewer.getView();
        view.setRotation(rotation + 0.7);
        view.setZoom(view.getZoom()! + 2);
        const currentCenter = view.getCenter()!;
        view.setCenter([currentCenter[0] + view.getResolution()! * 100, currentCenter[1]]);
        viewer.map.renderSync();
        test.addStep('Fitting the captured coordinates through the public viewer API...');
        await viewer.fitViewportToMidpointsLonLat(input, useAnimation);
        return {
          snapshot: MapTester.#captureViewportBoundary(viewer),
          original,
          input,
          pixels: original.map((coordinate) => viewer.map.getPixelFromCoordinate(viewer.convertCoordinateLonLatToMapProj(coordinate))),
          originalPixels: [before.expectedPixels[7], before.expectedPixels[6], before.expectedPixels[5], before.expectedPixels[4]],
          rotation,
        };
      },
      (test, result): void => {
        test.addStep('Verifying containment, rotation, input preservation, and exact compatible-view round trip...');
        Test.assertIsArrayEqualJsons(result.input, result.original);
        if (change !== 'projection') Test.assertIsEqualWithinTolerance(result.snapshot.rotation, result.rotation, 1e-9);
        else {
          const [west, south, east, north] = result.pixels;
          Test.assertIsDefined('west', west);
          Test.assertIsDefined('south', south);
          Test.assertIsDefined('east', east);
          Test.assertIsDefined('north', north);
          const eastAngle = Math.atan2(-(east[1] - west[1]), east[0] - west[0]);
          const northAngle = Math.atan2(-(north[1] - south[1]), north[0] - south[0]) - Math.PI / 2;
          Test.assertIsEqualWithinTolerance(eastAngle + northAngle, 0, 1e-6);
        }
        const [left, top] = result.snapshot.expectedPixels[0];
        const [right, bottom] = result.snapshot.expectedPixels[2];
        result.pixels.forEach((pixel, index): void => {
          Test.assertIsDefined('pixel', pixel);
          Test.assertIsEqual(pixel[0] >= left - 0.5 && pixel[0] <= right + 0.5, true);
          Test.assertIsEqual(pixel[1] >= top - 0.5 && pixel[1] <= bottom + 0.5, true);
          if (change === 'none')
            pixel.forEach((value, axis): void => Test.assertIsEqualWithinTolerance(value, result.originalPixels[index][axis], 0.5));
        });
        const pixels = result.pixels.filter((pixel) => pixel !== null);
        const minX = Math.min(...pixels.map((pixel) => pixel[0]));
        const maxX = Math.max(...pixels.map((pixel) => pixel[0]));
        const minY = Math.min(...pixels.map((pixel) => pixel[1]));
        const maxY = Math.max(...pixels.map((pixel) => pixel[1]));
        Test.assertIsEqual(
          (Math.abs(minX - left) < 0.5 && Math.abs(maxX - right) < 0.5) || (Math.abs(minY - top) < 0.5 && Math.abs(maxY - bottom) < 0.5),
          true
        );
      },
      (): void => {
        this.#resetViewportFixture(host, originalWidth);
      }
    );
  }

  /**
   * Tests that invalid midpoint input rejects without modifying the view.
   *
   * @param condition - Invalid input condition
   * @returns A promise that resolves with the expected typed error
   */
  testErrorFitViewportMidpoints(
    condition: 'count' | 'nonfinite' | 'latitude' | 'coincident' | 'orientation'
  ): Promise<Test<InvalidViewportMidpointsError>> {
    const host = this.#getViewportHost();
    const originalWidth = host.style.width;
    let viewer: MapViewer | undefined;
    let original: TypeViewportBoundaryLonLat | undefined;
    return this.testError(
      `Test invalid viewport midpoint input: ${condition}`,
      InvalidViewportMidpointsError,
      async (test): Promise<void> => {
        viewer = await this.#createViewportFixture(test, host, 3978, 'dynamic', MAP_CENTER[3978], 0);
        original = viewer.getViewportBoundaryLonLat();
        const input = original.midpointWSENCoords.map((coordinate) => [...coordinate]);
        test.addStep(`Passing invalid midpoint coordinates (${condition})...`);
        if (condition === 'count') input.pop();
        else if (condition === 'nonfinite') input[0][0] = Number.NaN;
        else if (condition === 'latitude') input[0][1] = 91;
        else if (condition === 'orientation') [input[1], input[3]] = [input[3], input[1]];
        else input.fill(input[0]);
        await viewer.fitViewportToMidpointsLonLat(input, false);
      },
      (): void => {
        Test.assertIsDefined('viewer', viewer);
        Test.assertJsonObject(viewer.getViewportBoundaryLonLat(), original!);
      },
      (): void => {
        this.#resetViewportFixture(host, originalWidth);
      }
    );
  }

  /**
   * Tests that an interrupted animation rejects instead of reporting a completed fit.
   *
   * @returns A promise that resolves with the expected cancellation error
   */
  testErrorFitViewportMidpointsCancelled(): Promise<Test<CancelledError>> {
    const host = this.#getViewportHost();
    const originalWidth = host.style.width;
    return this.testError(
      'Test viewport midpoint fit interrupted by another interaction',
      CancelledError,
      async (test): Promise<void> => {
        const viewer = await this.#createViewportFixture(test, host, 3978, 'dynamic', MAP_CENTER[3978], 0);
        const input = viewer.getViewportBoundaryLonLat().midpointWSENCoords;
        viewer.getView().setZoom(8);
        viewer.getView().setRotation(1);
        viewer.map.renderSync();
        test.addStep('Starting and immediately cancelling the animated fit...');
        const fitting = viewer.fitViewportToMidpointsLonLat(input);
        viewer.getView().cancelAnimations();
        await fitting;
      },
      undefined,
      (): void => {
        this.#resetViewportFixture(host, originalWidth);
      }
    );
  }

  /**
   * Tests padded viewport samples in a fresh, network-independent map.
   *
   * @param projection - Projection to test
   * @param rotation - Optional view rotation in radians
   * @param interaction - Optional interaction mode
   * @param center - Optional center in longitude/latitude
   * @returns A promise that resolves with the boundary test
   */
  testViewportBoundaryLonLat(
    projection: TypeValidMapProjectionCodes,
    rotation = 0,
    interaction: TypeInteraction = 'dynamic',
    center: Coordinate = MAP_CENTER[projection]
  ): Promise<Test<TypeViewportBoundarySnapshot>> {
    const host = this.#getViewportHost();
    const originalWidth = host.style.width;
    return this.test(
      `Test viewport boundary EPSG:${projection}, rotation ${rotation}, ${interaction}, center ${center}`,
      async (test): Promise<TypeViewportBoundarySnapshot> => {
        test.addStep('Replacing the suite map and sampling the public viewer API...');
        const viewer = await this.#createViewportFixture(test, host, projection, interaction, center, rotation);
        return MapTester.#captureViewportBoundary(viewer);
      },
      (test, result): void => {
        test.addStep('Checking eight samples against independent view geometry and CSS pixels...');
        MapTester.#assertViewportBoundary(result);
        Test.assertIsEqualWithinTolerance(result.bottomPadding, result.infoHeight, 0.5);
        Test.assertIsEqualWithinTolerance(result.rotation, rotation, 1e-9);
        Test.assertIsArrayEqual(result.center, center, 6);
        if (rotation !== 0) Test.assertIsEqual(Math.abs(result.boundary.midpoints.s[1] - result.extentSouth[1]) > 0.1, true);
        if (projection === 3978 && rotation === 0 && center === MAP_CENTER[3978]) {
          Test.assertIsEqual(result.boundary.midpoints.s[1] - result.boundary.corners.sw[1] > 0.1, true);
          Test.assertIsEqual(result.boundary.midpoints.s[1] - result.boundary.corners.se[1] > 0.1, true);
        }
        if (projection === 3857 && rotation === 0) {
          const { corners, midpoints } = result.boundary;
          Test.assertIsEqualWithinTolerance(midpoints.w[0], corners.nw[0], 1e-6);
          Test.assertIsEqualWithinTolerance(midpoints.e[0], corners.se[0], 1e-6);
          Test.assertIsEqualWithinTolerance(midpoints.n[1], corners.ne[1], 1e-6);
          Test.assertIsEqualWithinTolerance(midpoints.s[1], corners.sw[1], 1e-6);
          if (center === GVAbstractTester.VIEWPORT_ANTIMERIDIAN_LONLAT) Test.assertIsEqual(midpoints.e[0] > 180, true);
        }
        if (interaction === 'dynamic') Test.assertIsNotEqual(result.boundary.midpoints.s[1], result.canvasSouth[1]);
        else Test.assertIsArrayEqual(result.boundary.midpoints.s, result.canvasSouth, 6);
      },
      (): void => {
        this.#resetViewportFixture(host, originalWidth);
      }
    );
  }

  /**
   * Tests map-info height changes, asymmetric padding, and viewport resizing.
   *
   * @returns A promise that resolves with the boundary snapshots before and after each change
   */
  testViewportBoundaryPaddingAndResize(): Promise<Test<TypeViewportBoundarySnapshot[]>> {
    const host = this.#getViewportHost();
    const originalWidth = host.style.width;
    return this.test(
      'Test viewport boundary after map-info height, padding, and size changes',
      async (test): Promise<TypeViewportBoundarySnapshot[]> => {
        const viewer = await this.#createViewportFixture(test, host, 3978, 'dynamic', MAP_CENTER[3978], 0);
        const snapshots = [MapTester.#captureViewportBoundary(viewer)];
        test.addStep('Increasing map-info bar height and updating view padding...');
        const info = viewer.getHTMLElementMapInfo();
        if (!info) throw new TestError('Viewport fixture has no map-info bar');
        info.style.height = `${info.offsetHeight + 30}px`;
        viewer.updateViewPadding();
        viewer.map.renderSync();
        snapshots.push(MapTester.#captureViewportBoundary(viewer));
        test.addStep('Applying padding on all four sides...');
        viewer.getView().padding = [20, 30, 70, 40];
        viewer.map.renderSync();
        snapshots.push(MapTester.#captureViewportBoundary(viewer));
        test.addStep('Resizing the host and resampling...');
        host.style.width = '640px';
        viewer.map.updateSize();
        viewer.map.renderSync();
        snapshots.push(MapTester.#captureViewportBoundary(viewer));
        return snapshots;
      },
      (test, result): void => {
        test.addStep('Verifying fresh geometry after each layout change...');
        result.forEach(MapTester.#assertViewportBoundary);
        Test.assertIsEqualWithinTolerance(result[1].bottomPadding, result[1].infoHeight, 0.5);
        Test.assertIsEqual(result[1].bottomPadding > result[0].bottomPadding, true);
        Test.assertIsNotEqual(result[2].expectedPixels[1][0], result[3].expectedPixels[1][0]);
        Test.assertIsNotEqual(result[2].boundary.midpoints.e[0], result[3].boundary.midpoints.e[0]);
      },
      (): void => {
        this.#resetViewportFixture(host, originalWidth);
      }
    );
  }

  /**
   * Tests explicit failure instead of partial boundary results.
   *
   * @param condition - Unavailable viewport condition to exercise
   * @param fit - Optional flag to exercise the fit API instead of the boundary getter
   * @returns A promise that resolves with the expected typed error
   */
  testErrorViewportBoundaryUnavailable(
    condition: 'size' | 'padding' | 'unrendered' | 'nonfinite' | 'negative-padding',
    fit = false
  ): Promise<Test<MapViewportUnavailableError>> {
    const host = this.#getViewportHost();
    const originalWidth = host.style.width;
    return this.testError(
      `Test viewport ${fit ? 'fit' : 'boundary'} unavailable: ${condition}`,
      MapViewportUnavailableError,
      async (test): Promise<void> => {
        const viewer = await this.#createViewportFixture(test, host, 3978, 'dynamic', MAP_CENTER[3978], 0);
        const input = viewer.getViewportBoundaryLonLat().midpointWSENCoords;
        test.addStep(`Making viewport unavailable (${condition}) and invoking the API...`);
        if (condition === 'size') viewer.map.setSize([0, 0]);
        else if (condition === 'padding') viewer.getView().padding = [0, 0, viewer.map.getSize()![1], 0];
        else if (condition === 'nonfinite') viewer.map.setSize([Number.NaN, 600]);
        else if (condition === 'negative-padding') viewer.getView().padding = [0, 0, -10, 0];
        else viewer.map.setTarget(undefined);
        if (fit) await viewer.fitViewportToMidpointsLonLat(input, false);
        else viewer.getViewportBoundaryLonLat();
      },
      undefined,
      (): void => {
        this.#resetViewportFixture(host, originalWidth);
      }
    );
  }

  // #endregion PUBLIC METHODS - VIEWPORT BOUNDARY

  /**
   * Tests the map state upon initial loading.
   *
   * @returns A promise that resolves with the Test containing the map state
   */
  testInitialMapState(): Promise<Test<TypeMapState>> {
    // Get the projection
    const projection = getStoreMapConfigViewSettingsProjection(this.getMapId());

    // The expected map state configuration including the current projection
    const expectedConfig: Record<string, unknown> = {
      currentProjection: projection,
    };

    // Test the map state
    return this.test(
      'Test projection',
      () => {
        // Return the map state
        return getStoreMapStateJson(this.getMapId());
      },
      (test, result) => {
        // Perform assertions
        test.addStep('Verifying expected projection config...');
        Test.assertJsonObject(result, expectedConfig);
      }
    );
  }

  /**
   * Tests a zoom operation on the map.
   *
   * @param zoomEnd - The zoom target
   * @returns A promise that resolves with the Test containing the zoom destination
   */
  testMapZoom(zoomEnd: number): Promise<Test<number>> {
    // Get the current zoom
    const { currentZoom } = getStoreMapStateJson(this.getMapId());

    // Test the projection
    return this.test(
      'Test zoom',
      async (test) => {
        // Test the zoom value
        if (currentZoom === zoomEnd) throw new TestError(`False precondition, map zoom was already at zoom destination ${zoomEnd}`);

        // Perform a zoom
        test.addStep('Performing zoom...');
        await this.getControllersRegistry().mapController.zoomMap(zoomEnd, GVAbstractTester.USE_ZOOM_ANIMATION);

        // Return the result
        return getStoreMapStateJson(this.getMapId()).currentZoom;
      },
      (test, result) => {
        // Perform assertions
        test.addStep('Verifying expected zoom in the store...');
        Test.assertIsEqual(result, zoomEnd);
      },
      async (test) => {
        // Unzooms to original position
        test.addStep('Unzooms to the original zoom...');
        await this.getControllersRegistry().mapController.zoomMap(currentZoom, GVAbstractTester.USE_ZOOM_ANIMATION);
      }
    );
  }

  /**
   * Tests switching between projections, zooming, and returning to initial extent.
   *
   * This test performs the following operations:
   * 1. Switches projection to the second projection
   * 2. Zooms to a specified level
   * 3. Switches back to the initial projection
   * 4. Zooms back to the initial extent
   * 5. Verifies the map extent matches the original extent
   *
   * @param initialProjection - The initial projection code
   * @param secondProjection - The target projection code to switch to
   * @param zoomLevel - The zoom level to test during projection switch
   * @returns A promise that resolves with the Test containing the final map extent
   */
  async testSwitchProjectionAndExtent(
    initialProjection: TypeValidMapProjectionCodes,
    secondProjection: TypeValidMapProjectionCodes,
    zoomLevel: number
  ): Promise<Test<Extent>> {
    // Zoom to initial extent
    await this.getControllersRegistry().mapController.zoomToInitialExtent(GVAbstractTester.USE_ZOOM_ANIMATION);

    // Get the current init extent
    const { mapExtent, currentProjection } = getStoreMapStateJson(this.getMapId());

    // Test the projection/initial extent
    return this.test(
      'Test switch projection back and forth, zoom and zoom to initial extent',
      async (test) => {
        // Test the projection value
        if (currentProjection === secondProjection)
          throw new TestError(`False precondition, map projection was already at projection destination ${secondProjection}`);

        // Perform a projection switch
        test.addStep(`Performing projection switch to ${secondProjection}...`);
        await this.getControllersRegistry().mapController.setProjection(secondProjection);

        // Update the step
        test.addStep(`Performing zoom to level ${zoomLevel}...`);

        // Perform a zoom
        await this.getControllersRegistry().mapController.zoomMap(zoomLevel, GVAbstractTester.USE_ZOOM_ANIMATION);

        // Update the step
        test.addStep('Performing projection switch to original...');

        // Perform a projection switch
        await this.getControllersRegistry().mapController.setProjection(initialProjection);

        // Update the step
        test.addStep('Performing zomm to inital extent...');

        // Zoom to initial extent
        await this.getControllersRegistry().mapController.zoomToInitialExtent(GVAbstractTester.USE_ZOOM_ANIMATION);

        // Wait for render
        await this.getMapViewer().waitForRender();

        // Return the result
        return getStoreMapStateJson(this.getMapId()).mapExtent;
      },
      (test, result) => {
        // Perform assertions
        test.addStep('Verifying expected map extent in the store...');
        Test.assertIsArrayEqual<number>(mapExtent, result, 0);
      }
    );
  }

  /**
   * Tests geometry group z-index operations.
   *
   * This test performs the following operations:
   * 1. Creates a circle geometry in a new test group
   * 2. Gets the initial z-index value
   * 3. Sets the z-index to 0
   * 4. Gets the z-index again
   * 5. Verifies both values match expectations
   *
   * @returns A promise that resolves with the Test containing the z-index values
   */
  testGeometryGroupZIndex(): Promise<Test<{ initialZIndex: number | undefined; finalZIndex: number | undefined }>> {
    const testGroupId = 'testZIndexGroup';
    const circleCoords: [number, number] = [-75.6972, 45.4215]; // Ottawa

    return this.test(
      'Test geometry group z-index get/set operations',
      (test) => {
        // Add a circle to a new geometry group
        test.addStep('Adding circle to test group...');
        this.getGeometryApi().addCircle(
          circleCoords,
          {
            projection: 4326,
            style: {
              radius: 5,
              fillColor: '#ff0000',
              fillOpacity: 0.3,
              strokeColor: '#ff0000',
              strokeWidth: 2,
            },
          },
          'testCircle',
          testGroupId
        );

        // Get the initial z-index
        test.addStep('Getting initial z-index...');
        const initialZIndex = this.getGeometryApi().getGeometryGroupZIndex(testGroupId);

        // Set z-index to 0
        test.addStep(`Initial z-index: ${initialZIndex}`);
        test.addStep('Setting z-index to 0...');
        this.getGeometryApi().setGeometryGroupZIndex(testGroupId, 0);

        // Get the z-index again
        test.addStep('Getting final z-index...');
        const finalZIndex = this.getGeometryApi().getGeometryGroupZIndex(testGroupId);

        // Return both values
        test.addStep(`Final z-index: ${finalZIndex}`);
        return { initialZIndex, finalZIndex };
      },
      (test, result) => {
        // Perform assertions
        test.addStep('Verifying initial z-index is 9999...');
        Test.assertIsEqual(result.initialZIndex, 9999);

        test.addStep('Verifying final z-index is 0...');
        Test.assertIsEqual(result.finalZIndex, 0);
      },
      (test) => {
        // Cleanup: remove the test group
        test.addStep('Cleaning up test geometry group...');
        this.getGeometryApi().deleteGeometryGroup(testGroupId);
      }
    );
  }

  /**
   * Tests zooming to a lon/lat extent using zoomToLonLatExtentOrCoordinate.
   *
   * Note: the map doesn't return to original extent after this test.
   *
   * @param extent - The extent to zoom to
   * @param expectedExtent - The expected extent after zooming (due to map restrictions)
   * @returns A promise that resolves with the Test containing the resulting map extent
   */
  testZoomToExtent(extent: Extent, expectedExtent: Extent): Promise<Test<Extent>> {
    return this.test(
      'Test zoom to lon/lat extent',
      async (test) => {
        // Zoom to extent
        test.addStep(`Zooming to extent ${extent.join(',')}...`);
        await this.getControllersRegistry().mapController.zoomToLonLatExtentOrCoordinate(extent, GVAbstractTester.USE_ZOOM_ANIMATION);

        // Wait for render
        await this.getMapViewer().waitForRender();

        // Transform extent and handle potential undefined return
        return Projection.transformExtentFromProj(
          getStoreMapStateJson(this.getMapId()).mapExtent,
          this.getMapViewer().getProjection(),
          Projection.getProjectionLonLat()
        );
      },
      (test, result) => {
        // The map adjusts extent to fit viewport aspect ratio, compare with tolerance for aspect ratio adjustment
        test.addStep('Verifying map zoomed to extent (with aspect ratio tolerance)...');
        Test.assertIsArrayEqual(result, expectedExtent, 0);
      }
    );
  }

  /**
   * Tests zooming to a lon/lat coordinate using zoomToLonLatExtentOrCoordinate.
   *
   * Note: the map doesn't return to original extent after this test.
   *
   * @param coordinates - The coordinates to zoom to
   * @returns A promise that resolves with the Test containing the resulting map extent
   */
  testZoomToCoordinate(coordinates: Coordinate): Promise<Test<Coordinate>> {
    return this.test(
      'Test zoom to lon/lat coordinate',
      async (test) => {
        test.addStep(`Zooming to coordinates ${coordinates.join(',')}...`);

        // Zoom to coordinate
        this.getMapViewer().setMapZoomLevel(8);
        await this.getControllersRegistry().mapController.zoomToLonLatExtentOrCoordinate(coordinates, GVAbstractTester.USE_ZOOM_ANIMATION);

        // Wait for render
        await this.getMapViewer().waitForRender();

        // Transform coordinates
        return Promise.resolve(
          Projection.transformCoordinates(
            getStoreMapStateJson(this.getMapId()).mapCenterCoordinates,
            this.getMapViewer().getProjection().getCode(),
            'EPSG:4326'
          ) as Coordinate
        );
      },
      (test, result) => {
        test.addStep('Verifying map centered on coordinate...');
        Test.assertIsArrayEqual(result, coordinates, 0);
      }
    );
  }

  /**
   * Tests selecting a footer bar tab.
   *
   * @returns A promise that resolves with the Test containing the selected tab id
   */
  testFooterBarSelectTab(): Promise<Test<string>> {
    const targetTab = 'data-table';

    return this.test(
      'Test footer bar select tab',
      async (test) => {
        test.addStep(`Selecting footer bar tab '${targetTab}'...`);

        // Select the tab
        await this.toggleFooterbarTab(test, targetTab, true);

        return targetTab;
      },
      (test, result) => {
        test.addStep('Verifying tab is selected...');
        const { tabId } = getStoreUIActiveFooterBarTab(this.getMapId());
        Test.assertIsEqual(tabId, result);
      }
    );
  }

  /**
   * Tests selecting an app bar tab.
   *
   * @returns A promise that resolves with the Test containing the selected tab id
   */
  testAppBarSelectTab(): Promise<Test<string>> {
    const targetTab = 'geolocator';

    return this.test(
      'Test app bar select tab',
      async (test) => {
        test.addStep(`Selecting app bar tab '${targetTab}'...`);

        // Select the tab
        await this.toggleAppbarTab(test, targetTab, true);

        return targetTab;
      },
      (test, result) => {
        test.addStep('Verifying tab is selected...');
        const activeTab = getStoreUIActiveAppBarTab(this.getMapId());
        Test.assertIsEqual(activeTab?.tabId, result);
      }
    );
  }

  /**
   * Tests creating a custom footer bar tab.
   *
   * @returns A promise that resolves with the Test containing the created tab id
   */
  testFooterBarCreateTab(): Promise<Test<string>> {
    const customTabId = 'custom-test-tab';
    const customTabConfig = {
      id: customTabId,
      value: 0,
      label: 'My Custom Tab',
      content: '<br><div><ul><li>How to export map coordinate data to: GeoJSON, or CSV.</li></ul></div>',
    };

    return this.test(
      'Test footer bar create custom tab',
      (test) => {
        test.addStep('Creating custom footer bar tab...');

        // Create the tab
        this.getMapViewer().footerBarApi.createTab(customTabConfig);

        return customTabId;
      },
      (test, result) => {
        test.addStep('Verifying custom tab exists in store...');
        const footerTabs = getStoreUIFooterTabs(this.getMapId());
        const customTab = footerTabs.find((tab) => tab.id === result);
        Test.assertIsDefined('customTab', customTab);

        test.addStep('Verifying custom tab id...');
        Test.assertIsEqual(customTab?.id, result);
      }
    );
  }

  /**
   * Tests changing the language.
   *
   * @returns A promise that resolves with the Test containing the new language
   */
  testSetLanguage(): Promise<Test<string>> {
    const targetLanguage = 'fr';
    const originalLanguage = 'en';

    return this.test(
      'Test set language to French',
      async (test) => {
        test.addStep(`Changing language to '${targetLanguage}'...`);

        // If either the domain or the store language is set to 'fr'.
        // We typically only need to check the domain, but in this test we can check both too as we'll be asserting the result in the store later.
        if (this.getMapViewer().getDisplayLanguage() === 'fr' || getStoreAppDisplayLanguage(this.getMapId()) === 'fr') {
          throw new TestError(`False precondition, language is already set to '${targetLanguage}'`);
        }

        // Set language
        await this.getMapViewer().setLanguage(targetLanguage);

        // Return the display language as read from the store
        return getStoreAppDisplayLanguage(this.getMapId());
      },
      (test, result) => {
        test.addStep('Verifying language changed...');
        Test.assertIsEqual(result, targetLanguage);
      },
      async (test) => {
        // Restore original language
        test.addStep(`Restoring language to '${originalLanguage}'...`);
        await this.getMapViewer().setLanguage(originalLanguage);
      }
    );
  }

  /**
   * Tests creating and setting a basemap.
   *
   * Note: The basemap stays changed after this test.
   *
   * @returns A promise that resolves with the Test containing the basemap id
   */
  testCreateAndSetBasemap(): Promise<Test<string>> {
    const targetBasemapId: TypeBasemapId = 'simple';
    const originalBasemap = this.getMapViewer().basemap.activeBasemap;

    return this.test(
      'Test create and set basemap',
      async (test) => {
        test.addStep(`Creating basemap with id '${targetBasemapId}'...`);

        if (originalBasemap?.basemapId === targetBasemapId) {
          throw new TestError(`False precondition, basemap is already set to '${targetBasemapId}'`);
        }

        // Create the basemap
        const basemapOptions = { basemapId: targetBasemapId, shaded: false, labeled: false };
        const basemap = await this.getMapViewer().basemap.createCoreBasemap(basemapOptions);

        test.addStep('Setting the new basemap...');

        // Set the basemap
        this.getMapViewer().basemap.setBasemap(basemap);

        const activeBasemapId = this.getMapViewer().basemap.activeBasemap?.basemapId;
        if (!activeBasemapId) {
          throw new TestError('Failed to get active basemap ID after setting basemap');
        }
        return activeBasemapId;
      },
      (test, result) => {
        test.addStep('Verifying basemap changed...');
        Test.assertIsEqual(result, targetBasemapId);
      }
    );
  }

  /**
   * Tests north arrow rotation in LCC projection when zoomed to British Columbia.
   *
   * This test performs the following operations:
   * 1. Switches to LCC projection (3978)
   * 2. Zooms to British Columbia extent
   * 3. Gets the north arrow rotation from DOM element
   * 4. Verifies the rotation matches expected value
   *
   * @returns A promise that resolves with the Test containing the north arrow angle
   */
  testNorthArrowRotationLCC(): Promise<Test<number>> {
    // British Columbia approximate extent in lon/lat (EPSG:4326)
    // West: -139°, South: 48°, East: -114°, North: 60°
    const bcExtent: Extent = [-139, 48, -114, 60];
    const expectedArrowAngle = 33; // Expected north arrow angle over BC in LCC

    return this.test(
      'Test north arrow rotation in LCC projection for British Columbia',
      async (test) => {
        // Get current projection
        const { currentProjection } = getStoreMapStateJson(this.getMapId());

        // Switch to LCC projection if not already there
        if (currentProjection !== 3978) {
          test.addStep('Switching to LCC projection (3978)...');
          await this.getControllersRegistry().mapController.setProjection(3978);
        }

        test.addStep('Zooming to British Columbia extent...');
        await this.getControllersRegistry().mapController.zoomToLonLatExtentOrCoordinate(bcExtent, GVAbstractTester.USE_ZOOM_ANIMATION);

        // Wait for render
        await this.getMapViewer().waitForRender();

        // Force OL to recalculate viewport dimensions (needed when the map tab is hidden, e.g., during "Run All Tests")
        test.addStep('Updating map size and getting north arrow angle...');
        this.getMapViewer().map.updateSize();

        // Wait for render after size update
        await this.getMapViewer().waitForRender();

        // Get the angle directly from MapViewer's programmatic calculation (returns a geographic bearing 0-360, where 180 = north up)
        const bearing = this.getMapViewer().getNorthArrowAngle();

        // Convert bearing to the visual CSS rotation used by the north arrow component: bearing - 180
        const angleValue = Math.round(bearing - 180);

        test.addStep(`North arrow rotation: ${angleValue}° (bearing: ${bearing}°)`);

        return angleValue;
      },
      (test, result) => {
        // In LCC projection over BC, the north arrow should match expected rotation
        test.addStep('Verifying north arrow rotation is calculated...');
        Test.assertIsEqualWithinTolerance(result, expectedArrowAngle, 1);
      }
    );
  }

  /**
   * Tests that non-queryable layers do not appear in details state when clicking on the map.
   *
   * This test performs the following operations:
   * 1. Gets the first layer from the map
   * 2. Sets the layer as non-queryable
   * 3. Simulates a map click
   * 4. Verifies that the layer results does not appear in the details state
   *
   * @param layerPath - The layer path to test
   * @param lonlat - The coordinates to query
   * @returns A promise that resolves with the Test containing the number of layers in details state
   */
  testNonQueryableLayerNotInDetails(layerPath: string, lonlat: Coordinate): Promise<Test<LayerWithBeforeAfterFeature<AbstractGVLayer>>> {
    return this.test(
      'Test non-queryable layer not in details after map click',
      async (test) => {
        // Get the layer
        const layer = this.getControllersRegistry().layerController.getGeoviewLayerRegular(layerPath);

        // The layer should be initially queryable
        if (!layer.getQueryable()) throw new TestError(`False precondition, the layer ${layerPath} wasn't initially queryable.`);

        // Wait for the layer to be loaded after the zoom, a guarantee
        await layer.waitForLoadedStatus();

        // Perform a map click using the feature info layer set
        test.addStep(`Perform query operation at given coordinates...`);
        const results1 = await this.getControllersRegistry().layerSetController.queryAtLonLat(lonlat);

        // Check if there is feature selected from the layer
        test.addStep(`Checking for features from layer '${layerPath}'...`);
        const layerDataOnTemp = results1[layerPath];

        // Store a deep copy of the data before clearing to preserve it
        const layerDataOn = layerDataOnTemp ? { ...layerDataOnTemp } : undefined;

        // Set layer non queryable, this will also clear the result set automatically
        test.addStep(`Setting layer '${layerPath}' as non-queryable...`);
        layer.setQueryable(false);

        // Perform a map click using the feature info layer set
        test.addStep(`Perform query operation at given coordinates...`);
        const results2 = await this.getControllersRegistry().layerSetController.queryAtLonLat(lonlat);

        // Check if there is feature selected from the layer
        test.addStep(`Checking for features from layer '${layerPath}'...`);
        const layerDataOffTemp = results2[layerPath];

        // Store a deep copy of the data before clearing to preserve it
        const layerDataOff = layerDataOffTemp ? { ...layerDataOffTemp } : undefined;

        // Set layer queryable again
        test.addStep(`Setting layer '${layerPath}' as queryable again...`);
        layer.setQueryable(true);

        // Perform a map click using the feature info layer set
        test.addStep(`Perform query operation at given coordinates...`);
        const results3 = await this.getControllersRegistry().layerSetController.queryAtLonLat(lonlat);

        // Check if there is feature selected from the layer
        test.addStep(`Checking for features from layer '${layerPath}'...`);
        const layerDataOn2Temp = results3[layerPath];

        // Store a deep copy of the data before clearing to preserve it
        const layerDataOn2 = layerDataOn2Temp ? { ...layerDataOn2Temp } : undefined;

        // Return the test results
        return { layer, results: [layerDataOn, layerDataOff, layerDataOn2] };
      },
      (test, result) => {
        // Get the results
        const [layerDataOn, layerDataOff, layerDataOn2] = result.results;

        test.addStep('Verifying layer data features when queryable...');
        Test.assertIsArray(layerDataOn?.features);
        Test.assertIsArrayLengthEqual(layerDataOn.features, 2);

        test.addStep('Verifying no layer data features when non-queryable...');
        Test.assertIsUndefined('features', layerDataOff?.features);

        test.addStep('Verifying layer data features when queryable again...');
        Test.assertIsArray(layerDataOn2?.features);
        Test.assertIsArrayLengthEqual(layerDataOn2.features, 2);
      },
      (_test, result) => {
        // Make sure to turn it back to queryable
        result.layer.setQueryable(true);
      }
    );
  }

  /**
   * Tests that non-hoverable layers do not appear in hover state when hovering on the map.
   *
   * This test performs the following operations:
   * 1. Gets the first layer from the map
   * 2. Sets the layer as non-hoverable
   * 3. Simulates a map hover
   * 4. Verifies that the layer results does not appear in the hover state
   *
   * @param layerPath - The layer path to test
   * @param lonlat - The coordinates to query
   * @returns A promise that resolves with the Test containing the hover states
   */
  testLayerHoverableState(layerPath: string, lonlat: Coordinate): Promise<Test<LayerWithBeforeAfterHover<AbstractGVLayer>>> {
    return this.test(
      'Test layer hoverable state in hoverFeatureInfoLayerSet',
      async (test) => {
        // Get the layer
        const layer = this.getControllersRegistry().layerController.getGeoviewLayerRegular(layerPath);

        // The layer should be initially hoverable
        if (!layer.getHoverable()) throw new TestError(`False precondition, the layer ${layerPath} wasn't initially hoverable.`);

        // Wait for the layer to be loaded after the zoom, a guarantee
        await layer.waitForLoadedStatus();

        // Perform a hover query using the hover feature info layer set
        test.addStep(`Perform query operation at given coordinates...`);
        await this.getControllersRegistry().layerSetController.hoverFeatureInfoLayerSet.queryLayers(lonlat, 'at_lon_lat');

        // Check if there is feature selected from the layer
        test.addStep(`Checking for features from layer '${layerPath}'...`);
        const layerDataOnTemp = getStoreMapHoverFeatureInfo(this.getMapId());

        // Store a deep copy of the data before clearing to preserve it
        const layerDataOn = layerDataOnTemp ? { ...layerDataOnTemp } : undefined;

        // Set layer non queryable, this will also clear the result set automatically
        test.addStep(`Setting layer '${layerPath}' as non-hoverable...`);
        layer.setHoverable(false);

        // Perform a hover query using the feature info layer set
        test.addStep(`Perform query operation at given coordinates...`);
        await this.getControllersRegistry().layerSetController.hoverFeatureInfoLayerSet.queryLayers(lonlat, 'at_lon_lat');

        // Check if there is feature selected from the layer
        test.addStep(`Checking for features from layer '${layerPath}'...`);
        const layerDataOffTemp = getStoreMapHoverFeatureInfo(this.getMapId());

        // Store a deep copy of the data before clearing to preserve it
        const layerDataOff = layerDataOffTemp ? { ...layerDataOffTemp } : undefined;

        // Set layer hoverable again
        test.addStep(`Setting layer '${layerPath}' as hoverable again...`);
        layer.setHoverable(true);

        // Perform a hover query using the feature info layer set
        test.addStep(`Perform query operation at given coordinates...`);
        await this.getControllersRegistry().layerSetController.hoverFeatureInfoLayerSet.queryLayers(lonlat, 'at_lon_lat');

        // Check if there is feature selected from the layer
        test.addStep(`Checking for features from layer '${layerPath}'...`);
        const layerDataOn2Temp = getStoreMapHoverFeatureInfo(this.getMapId());

        // Store a deep copy of the data before clearing to preserve it
        const layerDataOn2 = layerDataOn2Temp ? { ...layerDataOn2Temp } : undefined;

        // Return the test results
        return { layer, results: [layerDataOn, layerDataOff, layerDataOn2] };
      },
      (test, result) => {
        test.addStep('Verifying layer data features when hoverable...');
        Test.assertJsonObject(result.results[0], { fieldInfo: { value: 'Ontario' } });

        test.addStep('Verifying layer data features when not hoverable...');
        Test.assertIsUndefined('result.after', result.results[1]);

        test.addStep('Verifying layer data features when hoverable again...');
        Test.assertJsonObject(result.results[2], { fieldInfo: { value: 'Ontario' } });
      },
      (_test, result) => {
        // Make sure to turn it back to hoverable
        result.layer.setHoverable(true);
      }
    );
  }

  /**
   * Tests that switching projection with a vector tile layer loaded emits a warning notification.
   *
   * This test performs the following operations:
   * 1. Adds a vector tile layer (EPSG:3978) to the map
   * 2. Verifies the layer loads and appears in ordered layers
   * 3. Records the notification count before projection switch
   * 4. Switches projection to 3857
   * 5. Verifies a warning notification about vector tiles was emitted
   * 6. Restores projection to 3978 and removes the layer
   *
   * @returns A promise that resolves with the Test containing the MapViewer instance
   */
  testVectorTileProjectionWarning(): Promise<Test<MapViewer>> {
    const gvLayerId = generateId();
    const layerUrl = GVAbstractTester.VECTOR_TILES_CBMT_3978_URL;
    const gvLayerName = GVAbstractTester.VECTOR_TILES_CBMT_3978_LAYER_NAME;

    return this.test<MapViewer>(
      'Test vector tile projection warning on projection switch',
      async (test) => {
        // Ensure the map starts in 3978
        const { currentProjection } = getStoreMapStateJson(this.getMapId());
        if (currentProjection !== 3978) {
          test.addStep('Switching to LCC projection (3978) as precondition...');
          await this.getControllersRegistry().mapController.setProjection(3978);
        }

        // Create the VT layer config
        test.addStep('Creating Vector Tiles layer configuration...');
        const gvConfig = VectorTiles.createGeoviewLayerConfig(gvLayerId, gvLayerName, layerUrl, false, [{ id: '' }]);

        // Add the layer to the map
        test.addStep('Adding the Vector Tiles layer on the map...');
        const result = this.getControllersRegistry().layerCreatorController.addGeoviewLayer(gvConfig);

        // Wait for the layer to be added
        test.addStep('Waiting for the layer to be added...');
        await result.promiseLayer;

        // Verify the layer appears in ordered layers
        test.addStep('Verifying the layer is present in ordered layers...');
        const orderedLayersBefore = getStoreLayerOrderedLayerPaths(this.getMapId());
        const layerPresent = orderedLayersBefore.some((path) => path.startsWith(gvLayerId));

        if (!layerPresent) {
          throw new TestError(`Vector tile layer ${gvLayerId} was not found in ordered layers after adding.`);
        }

        // Switch projection to 3857
        test.addStep('Switching projection to Web Mercator (3857)...');
        await this.getControllersRegistry().mapController.setProjection(3857);

        // Wait for render after projection change
        await this.getMapViewer().waitForRender();

        // Return the map viewer for assertions
        return this.getMapViewer();
      },
      (test, _result) => {
        // Verify a warning notification was emitted about vector tiles
        test.addStep('Verifying warning notification was emitted about vector tiles...');
        const notificationsAfter = getStoreAppNotifications(this.getMapId());

        // Check that at least one notification mentions vector tile projection
        const vtWarning = notificationsAfter.find(
          (n) => n.notificationType === 'warning' && n.message.toLowerCase().includes('vector tile')
        );
        Test.assertIsDefined('vtWarning', vtWarning);
      },
      async (test) => {
        // Cleanup: switch back to 3978 and remove the layer
        test.addStep('Restoring projection to LCC (3978)...');
        await this.getControllersRegistry().mapController.setProjection(3978);

        // Remove the layer using its path prefix
        test.addStep('Removing the Vector Tiles layer...');
        const orderedLayers = getStoreLayerOrderedLayerPaths(this.getMapId());
        const vtLayerPath = orderedLayers.find((path) => path.startsWith(gvLayerId));
        if (vtLayerPath) {
          this.getControllersRegistry().layerCreatorController.removeLayerUsingPath(vtLayerPath);
        }
      }
    );
  }

  /**
   * Tests that the selected layer in the details panel persists correctly
   * when clicking on different map locations.
   *
   * Test flow:
   * 1. Clicks on the map at the first location and verifies the auto-selected layer.
   * 2. Manually switches selection to the alternate layer.
   * 3. Clicks on a second map location.
   * 4. Verifies the manually selected layer remains selected and that its
   *    feature count is correct.
   *
   * @param layerPath1 - The path of the first candidate layer that may be auto-selected after the initial click
   * @param layerPath2 - The path of the second candidate layer used as the alternate manual selection
   * @param clickCoordinates1 - The map coordinates used for the first simulated click
   * @param clickCoordinates2 - The map coordinates used for the second simulated click
   * @returns A promise that resolves with details about the original selected layer,
   * the persisted alternate layer, and the feature count after the second click
   */
  testDetailsLayerSelectionPersistence(
    layerPath1: string,
    layerPath2: string,
    clickCoordinates1: Coordinate,
    clickCoordinates2: Coordinate
  ): Promise<Test<LayerDetails>> {
    return this.test(
      'Test details layer selection persistence across map clicks',
      async (test) => {
        // Simulate a map click at first location
        await this.simulateMapClickWaitForBatchedQuery(test, clickCoordinates1);

        // Check which layer is selected after first click
        test.addStep('Checking selected layer after first click...');
        const originalLayerPath = getStoreDetailsSelectedLayerPath(this.getMapId());
        test.addStep(`First selected layer: ${originalLayerPath}`);

        // The alternate layer
        const altLayerPath = originalLayerPath === layerPath1 ? layerPath2 : layerPath1;

        // Manually select the alternate layer
        test.addStep(`Manually selecting the other layer '${altLayerPath}'...`);
        this.getControllersRegistry().detailsController.setSelectedLayerPath(altLayerPath);

        // Simulate a map click at second location
        await this.simulateMapClickWaitForBatchedQuery(test, clickCoordinates2);

        // Check which layer is still selected after second click
        test.addStep('Checking selected layer after second click...');
        const alternateLayerPath = getStoreDetailsSelectedLayerPath(this.getMapId());
        test.addStep(`Second selected layer: ${alternateLayerPath}`);

        // Get feature count for second layer
        const secondLayerDataFeatures = getStoreDetailsFeatures(this.getMapId(), alternateLayerPath);
        const secondFeatureCount = secondLayerDataFeatures?.length || 0;
        test.addStep(`Second layer feature count: ${secondFeatureCount}`);

        return {
          originalLayerPath,
          alternateLayerPath,
          secondFeatureCount,
        };
      },
      (test, result) => {
        test.addStep('Verifying first and second layers were different...');
        Test.assertIsNotEqual(result.originalLayerPath, result.alternateLayerPath);

        test.addStep('Verifying second layer has exactly 1 feature...');
        Test.assertIsEqual(result.secondFeatureCount, 1);
      }
    );
  }

  // #region PRIVATE METHODS - VIEWPORT BOUNDARY

  /**
   * Gets the suite's existing map container instead of adding maps to the test runner page.
   *
   * @returns The current suite's map root
   * @throws {TestError} When the suite's map container is missing
   */
  #getViewportHost(): HTMLElement {
    const host = getGVRootElement(this.getMapId());
    if (!host) throw new TestError('Viewport test suite has no map container');
    return host;
  }

  /**
   * Restores layout and a usable viewport after a test, including detached and invalid-size cases.
   *
   * @param host - The suite's existing map root
   * @param originalWidth - Inline width before the test
   */
  #resetViewportFixture(host: HTMLElement, originalWidth: string): void {
    host.style.setProperty('width', originalWidth);
    const viewer = this.getMapViewer();
    viewer.map.setTarget(getGVMapTargetElement(this.getMapId()));
    viewer.getHTMLElementMapInfo()?.style.removeProperty('height');
    viewer.setView({ projection: 3978, initialView: { zoomAndCenter: [MAP_ZOOM_LEVEL[3978], MAP_CENTER[3978]] } });
    viewer.map.updateSize();
    viewer.updateViewPadding();
    viewer.map.renderSync();
  }

  /**
   * Replaces the suite map with a fixed-size, layer-free map using the standard config-test lifecycle.
   *
   * @param test - Test instance used to record lifecycle steps
   * @param host - The suite's existing map root
   * @param projection - View projection
   * @param interaction - Interaction mode
   * @param center - Initial longitude/latitude center
   * @param rotation - View rotation in radians
   * @returns A promise that resolves with the rendered fixture
   */
  async #createViewportFixture(
    test: Test,
    host: HTMLElement,
    projection: TypeValidMapProjectionCodes,
    interaction: TypeInteraction,
    center: Coordinate,
    rotation: number
  ): Promise<MapViewer> {
    host.style.setProperty('width', '800px');
    // Keep the near-pole round-trip fixture below the projection singularity.
    const zoom = center === GVAbstractTester.VIEWPORT_POLAR_LONLAT ? 8 : MAP_ZOOM_LEVEL[projection];
    const viewer = await this.replaceMap(test, host.id, {
      map: {
        interaction,
        viewSettings: {
          projection,
          initialView: { zoomAndCenter: [zoom, center] },
        },
        basemapOptions: { basemapId: 'nogeom', shaded: false, labeled: false },
        listOfGeoviewLayerConfig: [],
      },
      components: [],
      navBar: [],
      appBar: { tabs: { core: [] } },
      footerBar: { tabs: { core: [] } },
    });
    // Remove extent constraints so edge/polar fixtures test the requested center rather than a clamped Canada view.
    viewer.setView({
      projection,
      initialView: { zoomAndCenter: [zoom, [center[0], center[1]]] },
      rotation,
    });
    viewer.map.updateSize();
    viewer.updateViewPadding();
    await viewer.waitForRender();
    return viewer;
  }

  // #endregion PRIVATE METHODS - VIEWPORT BOUNDARY

  // #region STATIC METHODS - VIEWPORT BOUNDARY

  /**
   * Captures actual samples and an independent affine view-geometry oracle.
   *
   * @param viewer - Rendered fixture
   * @returns Snapshot used exclusively for assertions
   */
  static #captureViewportBoundary(viewer: MapViewer): TypeViewportBoundarySnapshot {
    const boundary = viewer.getViewportBoundaryLonLat();
    const repeatedBoundary = viewer.getViewportBoundaryLonLat();
    const view = viewer.getView();
    const [width, height] = viewer.map.getSize()!;
    const [top, padRight, padBottom, left] = view.padding ?? [0, 0, 0, 0];
    const right = width - padRight;
    const bottom = height - padBottom;
    const x = (left + right) / 2;
    const y = (top + bottom) / 2;
    const expectedPixels = [
      [left, top],
      [right, top],
      [right, bottom],
      [left, bottom],
      [x, top],
      [right, y],
      [x, bottom],
      [left, y],
    ];
    const center = view.getCenter()!;
    const resolution = view.getResolution()!;
    const cos = Math.cos(view.getRotation());
    const sin = Math.sin(view.getRotation());
    const expected = expectedPixels.map(([px, py]): Coordinate =>
      viewer.convertCoordinateMapProjToLonLat([
        center[0] + resolution * ((px - x) * cos + (py - y) * sin),
        center[1] + resolution * ((px - x) * sin - (py - y) * cos),
      ])
    );
    const coordinates = [...Object.values(boundary.corners), ...Object.values(boundary.midpoints)];
    const extent = view.calculateExtent();
    return {
      boundary,
      repeatedBoundary,
      expected,
      pixels: coordinates.map((coordinate) => viewer.map.getPixelFromCoordinate(viewer.convertCoordinateLonLatToMapProj(coordinate))),
      expectedPixels,
      bottomPadding: padBottom,
      infoHeight: viewer.mapFeaturesConfig.map.interaction === 'static' ? 0 : viewer.getHTMLElementMapInfo()!.offsetHeight,
      canvasSouth: viewer.convertCoordinateMapProjToLonLat(viewer.map.getCoordinateFromPixel([x, height])),
      freshObjects: boundary !== repeatedBoundary && boundary.corners.nw !== repeatedBoundary.corners.nw,
      rotation: view.getRotation(),
      center: viewer.convertCoordinateMapProjToLonLat(center),
      extentSouth: viewer.convertCoordinateMapProjToLonLat([(extent[0] + extent[2]) / 2, extent[1]]),
    };
  }

  /**
   * Verifies exact output shape, finite coordinates, and boundary positions.
   *
   * @param snapshot - Captured API result and independent expectations
   */
  static #assertViewportBoundary(snapshot: TypeViewportBoundarySnapshot): void {
    Test.assertIsArrayEqual(Object.keys(snapshot.boundary), ['corners', 'midpoints', 'midpointWSENCoords']);
    Test.assertIsArrayEqual(Object.keys(snapshot.boundary.corners), ['nw', 'ne', 'se', 'sw']);
    Test.assertIsArrayEqual(Object.keys(snapshot.boundary.midpoints), ['n', 'e', 's', 'w']);
    Test.assertJsonObject(snapshot.boundary, snapshot.repeatedBoundary);
    Test.assertIsEqual(snapshot.freshObjects, true);
    const { w, s, e, n } = snapshot.boundary.midpoints;
    Test.assertIsArrayEqualJsons(snapshot.boundary.midpointWSENCoords, [w, s, e, n]);
    const coordinates = [...Object.values(snapshot.boundary.corners), ...Object.values(snapshot.boundary.midpoints)];
    coordinates.forEach((coordinate, index): void => {
      Test.assertIsArrayLengthEqual(coordinate, 2);
      Test.assertIsEqual(coordinate.every(Number.isFinite), true);
      coordinate.forEach((value, axis): void => Test.assertIsEqualWithinTolerance(value, snapshot.expected[index][axis], 1e-6));
      const pixel = snapshot.pixels[index];
      Test.assertIsDefined('pixel', pixel);
      pixel.forEach((value, axis): void => Test.assertIsEqualWithinTolerance(value, snapshot.expectedPixels[index][axis], 0.5));
    });
  }

  // #endregion STATIC METHODS - VIEWPORT BOUNDARY
}

/** Represents a layer paired with feature information results collected before and after an operation (e.g., filtering, ordering, or updates). */
type LayerWithBeforeAfterFeature<T> = LayerWithResults<T, (TypeFeatureInfoResultSetEntry | undefined)[]>;

/** Represents a layer paired with hover feature information results collected before and after an operation. */
type LayerWithBeforeAfterHover<T> = LayerWithResults<T, (TypeHoverFeatureInfo | undefined)[]>;

/** Generic structure associating a layer with a set of related results. */
type LayerWithResults<T, U> = {
  /** The layer instance. */
  layer: T;
  /** The results associated with the layer. */
  results: U;
};

/** Describes layer path information and comparison metadata used when evaluating differences between layers. */
type LayerDetails = {
  /** The path identifying the original layer. */
  originalLayerPath: string;
  /** The path identifying the alternate or comparison layer. */
  alternateLayerPath: string;
  /** The number of features found in the alternate layer. */
  secondFeatureCount: number;
};
