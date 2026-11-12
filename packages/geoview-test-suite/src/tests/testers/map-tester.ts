import type { Coordinate } from 'ol/coordinate';
import type { Size } from 'ol/size';
import { Draw } from 'geoview-core/geo/interaction/draw';

import { TestError } from '../core/exceptions';
import { Test } from '../core/test';
import { GVAbstractTester } from './abstract-gv-tester';
import { delay, generateId, whenThisThen } from 'geoview-core/core/utils/utilities';
import {
  MAP_CENTER,
  MAP_ZOOM_LEVEL,
  type Extent,
  type TypeBasemapId,
  type TypeInteraction,
  type TypeMapState,
  type TypeMapMouseInfo,
  type TypeValidMapProjectionCodes,
  type TypeViewportBoundaryLonLat,
  type TypeFeatureInfoEntry,
} from 'geoview-core/api/types/map-schema-types';
import { InvalidViewportMidpointsError, MapViewportUnavailableError } from 'geoview-core/core/exceptions/geoview-exceptions';
import { CancelledError } from 'geoview-core/core/exceptions/core-exceptions';
import { MAP_SECTION_SCROLL_GAP_PX } from 'geoview-core/core/utils/constant';
import { DomHelper } from 'geoview-core/core/utils/dom-helper';
import {
  getStoreDetailsFeatures,
  getStoreDetailsSelectedLayerPath,
  type TypeHoverFeatureInfo,
} from 'geoview-core/core/stores/states/feature-info-state';
import { getStoreUIActiveAppBarTab, getStoreUIActiveFooterBarTab, getStoreUIFooterTabs } from 'geoview-core/core/stores/states/ui-state';
import {
  getStoreAppHeight,
  getStoreAppDisplayLanguage,
  getStoreAppIsCrosshairsActive,
  getStoreAppIsFullscreenActive,
  getStoreAppNotifications,
} from 'geoview-core/core/stores/states/app-state';
import {
  getStoreMapConfigViewSettingsProjection,
  getStoreMapHoverFeatureInfo,
  getStoreMapPointerPosition,
  getStoreMapStateJson,
  setStoreMapPointerPosition,
} from 'geoview-core/core/stores/states/map-state';
import { getStoreLayerOrderedLayerPaths } from 'geoview-core/core/stores/states/layer-state';
import type { AbstractGVLayer } from 'geoview-core/geo/layer/gv-layers/abstract-gv-layer';
import { Projection } from 'geoview-core/geo/utils/projection';
import { VectorTiles } from 'geoview-core/geo/layer/geoview-layers/raster/vector-tiles';
import type { MapViewer } from 'geoview-core/geo/map/map-viewer';

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
   * @param useRotation - Whether the fit should restore the source rotation or preserve the changed rotation
   * @returns A promise that resolves with the fit outcome
   */
  testFitViewportToMidpointsLonLat(
    projection: TypeValidMapProjectionCodes,
    rotation = 0,
    interaction: TypeInteraction = 'dynamic',
    change: 'none' | 'resize' | 'projection' = 'none',
    useAnimation = false,
    center: Coordinate = MAP_CENTER[projection],
    useRotation = true
  ): Promise<Test<TypeViewportMidpointFitResult>> {
    const gvRootElement = DomHelper.getGVRootElement(this.getMapId());
    const originalWidth = gvRootElement.style.width;
    return this.test(
      `Test fitting viewport midpoints EPSG:${projection}, rotation ${rotation}, ${interaction}, ${change}, animated ${useAnimation}, align ${useRotation}`,
      async (test): Promise<TypeViewportMidpointFitResult> => {
        const viewer = await this.#createViewportFixture(test, gvRootElement, projection, interaction, center, rotation);
        viewer.getView().padding = interaction === 'dynamic' ? [15, 25, 60, 35] : [0, 0, 0, 0];
        viewer.map.renderSync();
        const before = MapTester.#captureViewportBoundary(viewer);
        const input = before.boundary.midpointWSENCoords;
        const original = input.map((coordinate) => [...coordinate]);
        test.addStep('Changing the view before fitting the captured WSEN coordinates...');
        if (change === 'resize') {
          gvRootElement.style.width = '540px';
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
        await viewer.fitViewportToMidpointsLonLat(input, useRotation, useAnimation);
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
        if (!useRotation) Test.assertIsEqualWithinTolerance(result.snapshot.rotation, result.rotation + 0.7, 1e-9);
        else if (change !== 'projection') Test.assertIsEqualWithinTolerance(result.snapshot.rotation, result.rotation, 1e-9);
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
          if (change === 'none' && useRotation)
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
        this.#resetViewportFixture(gvRootElement, originalWidth);
      }
    );
  }

  /**
   * Tests that invalid midpoint input rejects without modifying the view.
   *
   * @returns A promise that resolves with errors and unchanged boundaries for each invalid input
   */
  testInvalidViewportMidpoints(): Promise<
    Test<{ error: InvalidViewportMidpointsError | undefined; boundary: TypeViewportBoundaryLonLat }[]>
  > {
    const gvRootElement = DomHelper.getGVRootElement(this.getMapId());
    const originalWidth = gvRootElement.style.width;
    let original: TypeViewportBoundaryLonLat | undefined;
    return this.test(
      'Test invalid viewport midpoint inputs without recreating the map',
      async (test): Promise<{ error: InvalidViewportMidpointsError | undefined; boundary: TypeViewportBoundaryLonLat }[]> => {
        const viewer = await this.#createViewportFixture(test, gvRootElement, 3978, 'dynamic', MAP_CENTER[3978], 0);
        original = viewer.getViewportBoundaryLonLat();
        const results: { error: InvalidViewportMidpointsError | undefined; boundary: TypeViewportBoundaryLonLat }[] = [];
        for (const condition of ['count', 'nonfinite', 'latitude', 'coincident', 'orientation']) {
          const input = original.midpointWSENCoords.map((coordinate) => [...coordinate]);
          test.addStep(`Passing invalid midpoint coordinates (${condition})...`);
          if (condition === 'count') input.pop();
          else if (condition === 'nonfinite') input[0][0] = Number.NaN;
          else if (condition === 'latitude') input[0][1] = 91;
          else if (condition === 'orientation') [input[1], input[3]] = [input[3], input[1]];
          else input.fill(input[0]);
          let error: InvalidViewportMidpointsError | undefined;
          try {
            // eslint-disable-next-line no-await-in-loop -- Verify each rejection and unchanged view before reusing the fixture.
            await viewer.fitViewportToMidpointsLonLat(input, true, false);
          } catch (caught: unknown) {
            if (!(caught instanceof InvalidViewportMidpointsError)) throw caught;
            error = caught;
          }
          results.push({ error, boundary: viewer.getViewportBoundaryLonLat() });
        }
        return results;
      },
      (_test, results): void => {
        Test.assertIsArrayLengthEqual(results, 5);
        results.forEach((result): void => {
          Test.assertIsInstance(result.error, InvalidViewportMidpointsError);
          Test.assertJsonObject(result.boundary, original);
        });
      },
      (): void => {
        this.#resetViewportFixture(gvRootElement, originalWidth);
      }
    );
  }

  /**
   * Tests that an interrupted animation rejects instead of reporting a completed fit.
   *
   * @returns A promise that resolves with the expected cancellation error
   */
  testErrorFitViewportMidpointsCancelled(): Promise<Test<CancelledError>> {
    const gvRootElement = DomHelper.getGVRootElement(this.getMapId());
    const originalWidth = gvRootElement.style.width;
    return this.testError(
      'Test viewport midpoint fit interrupted by another interaction',
      CancelledError,
      async (test): Promise<void> => {
        const viewer = await this.#createViewportFixture(test, gvRootElement, 3978, 'dynamic', MAP_CENTER[3978], 0);
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
        this.#resetViewportFixture(gvRootElement, originalWidth);
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
    const gvRootElement = DomHelper.getGVRootElement(this.getMapId());
    const originalWidth = gvRootElement.style.width;
    return this.test(
      `Test viewport boundary EPSG:${projection}, rotation ${rotation}, ${interaction}, center ${center}`,
      async (test): Promise<TypeViewportBoundarySnapshot> => {
        test.addStep('Replacing the suite map and sampling the public viewer API...');
        const viewer = await this.#createViewportFixture(test, gvRootElement, projection, interaction, center, rotation);
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
        this.#resetViewportFixture(gvRootElement, originalWidth);
      }
    );
  }

  /**
   * Tests map-info height changes, asymmetric padding, and viewport resizing.
   *
   * @returns A promise that resolves with the boundary snapshots before and after each change
   */
  testViewportBoundaryPaddingAndResize(): Promise<Test<TypeViewportBoundarySnapshot[]>> {
    const gvRootElement = DomHelper.getGVRootElement(this.getMapId());
    const originalWidth = gvRootElement.style.width;
    return this.test(
      'Test viewport boundary after map-info height, padding, and size changes',
      async (test): Promise<TypeViewportBoundarySnapshot[]> => {
        const viewer = await this.#createViewportFixture(test, gvRootElement, 3978, 'dynamic', MAP_CENTER[3978], 0);
        const snapshots = [MapTester.#captureViewportBoundary(viewer)];
        test.addStep('Increasing map-info bar height and updating view padding...');
        const info = DomHelper.getMapInfo(viewer.mapId);
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
        gvRootElement.style.width = '640px';
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
        this.#resetViewportFixture(gvRootElement, originalWidth);
      }
    );
  }

  /**
   * Tests unavailable viewport conditions using one fixture, restoring it after every condition.
   *
   * @returns A promise that resolves with the captured typed errors
   */
  testViewportBoundaryUnavailable(): Promise<Test<(MapViewportUnavailableError | undefined)[]>> {
    const gvRootElement = DomHelper.getGVRootElement(this.getMapId());
    const originalWidth = gvRootElement.style.width;
    return this.test(
      'Test unavailable viewport conditions without recreating the map',
      async (test): Promise<(MapViewportUnavailableError | undefined)[]> => {
        const viewer = await this.#createViewportFixture(test, gvRootElement, 3978, 'dynamic', MAP_CENTER[3978], 0);
        const results: (MapViewportUnavailableError | undefined)[] = [];
        for (const condition of ['size', 'padding', 'nonfinite', 'negative-padding', 'unrendered']) {
          viewer.getViewportBoundaryLonLat();
          test.addStep(`Making viewport unavailable (${condition}) and sampling...`);
          let error: MapViewportUnavailableError | undefined;
          try {
            if (condition === 'size') viewer.map.setSize([0, 0]);
            else if (condition === 'padding') viewer.getView().padding = [0, 0, viewer.map.getSize()![1], 0];
            else if (condition === 'nonfinite') viewer.map.setSize([Number.NaN, 600]);
            else if (condition === 'negative-padding') viewer.getView().padding = [0, 0, -10, 0];
            else viewer.map.setTarget(undefined);
            viewer.getViewportBoundaryLonLat();
          } catch (caught: unknown) {
            if (!(caught instanceof MapViewportUnavailableError)) throw caught;
            error = caught;
          } finally {
            this.#resetViewportFixture(gvRootElement, '800px');
          }
          results.push(error);
        }
        return results;
      },
      (_test, results): void => {
        Test.assertIsArrayLengthEqual(results, 5);
        results.forEach((error): void => Test.assertIsInstance(error, MapViewportUnavailableError));
      },
      (): void => {
        this.#resetViewportFixture(gvRootElement, originalWidth);
      }
    );
  }

  /**
   * Tests that fitting propagates an unavailable viewport error.
   *
   * @returns A promise that resolves with the expected typed error
   */
  testErrorFitViewportUnavailable(): Promise<Test<MapViewportUnavailableError>> {
    const gvRootElement = DomHelper.getGVRootElement(this.getMapId());
    const originalWidth = gvRootElement.style.width;
    return this.testError(
      'Test fitting an unavailable viewport',
      MapViewportUnavailableError,
      async (test): Promise<void> => {
        const viewer = await this.#createViewportFixture(test, gvRootElement, 3978, 'dynamic', MAP_CENTER[3978], 0);
        const input = viewer.getViewportBoundaryLonLat().midpointWSENCoords;
        test.addStep('Removing the usable viewport size and fitting...');
        viewer.map.setSize([0, 0]);
        await viewer.fitViewportToMidpointsLonLat(input, true, false);
      },
      undefined,
      (): void => {
        this.#resetViewportFixture(gvRootElement, originalWidth);
      }
    );
  }

  // #endregion PUBLIC METHODS - VIEWPORT BOUNDARY

  // #region PUBLIC METHODS - MAP FUNCTIONS

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
   * Tests keyboard crosshair coordinates with collapsed/expanded padding, rotation, and stale mouse positions.
   *
   * @returns A promise that resolves with the activation and drawing observations
   */
  testCrosshairCoordinates(): Promise<Test<TypeCrosshairCoordinateResult[]>> {
    const viewer = this.getMapViewer();
    const view = viewer.getView();
    const { mapController, uiController } = this.getControllersRegistry();
    const mapId = this.getMapId();
    const originalPadding = view.padding?.slice();
    const originalCenter = view.getCenter()?.slice();
    const originalRotation = view.getRotation();
    const originalPointer = getStoreMapPointerPosition(mapId);
    const originalActive = getStoreAppIsCrosshairsActive(mapId);
    const originalDraw = mapController.getActiveMeasurementDraw();
    const originalFocus = document.activeElement;
    const geometryGroupKey = generateId();
    const draw = new Draw({ mapViewer: viewer, geometryGroupKey, type: 'LineString' }, this.getGeometryApi());
    const coordinates: Coordinate[] = [];
    draw.appendCoordinates = (points: Coordinate[]): void => {
      coordinates.push(...points.map((point) => [...point]));
    };

    return this.test(
      'Test crosshair pixel coordinates for Enter/Space with view padding and rotation',
      async (test): Promise<TypeCrosshairCoordinateResult[]> => {
        const target = DomHelper.getMapTargetElement(mapId);
        const svg = DomHelper.queryGVSelector<SVGSVGElement>(mapId, 'svg[viewBox="0 0 275 275"]');
        if (!target || !svg) throw new TestError('Crosshair and map target must be mounted');
        const results: TypeCrosshairCoordinateResult[] = [];
        mapController.setActiveMeasurementDraw(draw);
        target.focus();

        for (const rotation of [0, 0.65]) {
          // Return to collapsed padding after expansion to catch cached pixel/coordinate transforms.
          for (const bottom of [0, 35, 100, 35]) {
            test.addStep(`Testing bottom padding ${bottom}px at rotation ${rotation}...`);
            uiController.setCrosshairActive(false);

            // eslint-disable-next-line no-await-in-loop -- Each case must commit crosshair deactivation before reactivation.
            await delay(50);
            view.padding = [0, 0, bottom, 0];
            view.setRotation(rotation);
            const center = view.getCenter()!;
            view.setCenter([center[0] + view.getResolution()! * 20, center[1]]);
            viewer.map.renderSync();
            const stale = mapController.getMapPositionFromPixel([10, 10]);
            if (!stale) throw new TestError('Rendered map coordinate transform must be available');
            setStoreMapPointerPosition(mapId, stale);
            uiController.setCrosshairActive(true);

            // eslint-disable-next-line no-await-in-loop -- Observe the activation effect before dispatching this case's keys.
            await delay(50);

            const size = viewer.map.getSize()!;
            const mapRect = target.getBoundingClientRect();
            const artworkBounds = svg.getBBox();
            const screenTransform = svg.getScreenCTM();
            if (!screenTransform) throw new TestError('Crosshair screen transform must be available');
            const artworkCenter = new DOMPoint(
              artworkBounds.x + artworkBounds.width / 2,
              artworkBounds.y + artworkBounds.height / 2
            ).matrixTransform(screenTransform);
            const pixel = [
              ((artworkCenter.x - mapRect.left) * size[0]) / mapRect.width,
              ((artworkCenter.y - mapRect.top) * size[1]) / mapRect.height,
            ];
            const pointer = getStoreMapPointerPosition(mapId);
            const position = mapController.getMapPositionFromPixel(pixel);
            const expected = viewer.map.getCoordinateFromPixel(pixel);
            const viewportCenter = [size[0] / 2, size[1] / 2];
            const expectedCenter = viewer.map.getCoordinateFromPixel(viewportCenter);
            coordinates.length = 0;
            const prevented = ['Enter', ' '].map((key): boolean => {
              // Activation reset alone is insufficient: each key must resolve the current rendered pixel.
              setStoreMapPointerPosition(mapId, stale);
              const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
              target.dispatchEvent(event);
              return event.defaultPrevented;
            });
            results.push({
              pixel,
              viewportCenter,
              pointer,
              expected,
              expectedCenter,
              expectedLonLat: Projection.transformToLonLat(expected, viewer.getProjection()),
              position,
              drawnPixels: coordinates.map((coordinate) => viewer.map.getPixelFromCoordinate(coordinate)),
              prevented,
            });
          }
        }
        return results;
      },
      (test, results): void => {
        test.addStep('Verifying rendered alignment, activation reset, and both keyboard drawing coordinates...');
        Test.assertIsEqual(results.length, 8);

        for (const result of results) {
          Test.assertIsDefined('activation pointer', result.pointer);
          Test.assertIsDefined('converted position', result.position);
          Test.assertIsEqual(result.position.dragging, false);
          Test.assertIsEqual(result.drawnPixels.length, 2);
          Test.assertIsArrayEqual(result.prevented, [true, true]);
          for (const axis of [0, 1]) {
            Test.assertIsEqualWithinTolerance(result.pixel[axis], result.viewportCenter[axis], 0.01);
            Test.assertIsEqualWithinTolerance(result.pointer.pixel[axis], result.pixel[axis], 0.01);
            // The pointer comes from the viewport center; layout can leave the SVG a fraction of a pixel off, so compare that exact pixel.
            Test.assertIsEqualWithinTolerance(result.pointer.projected[axis], result.expectedCenter[axis], 0.01);
            Test.assertIsEqualWithinTolerance(result.position.projected[axis], result.expected[axis], 0.01);
            Test.assertIsEqualWithinTolerance(result.position.lonlat[axis], result.expectedLonLat[axis], 1e-9);
            for (const drawnPixel of result.drawnPixels) {
              Test.assertIsDefined('drawn pixel', drawnPixel);
              Test.assertIsEqualWithinTolerance(drawnPixel[axis], result.pixel[axis], 0.01);
            }
          }
        }
      },
      (): void => {
        uiController.setCrosshairActive(false);
        mapController.setActiveMeasurementDraw(originalDraw);
        draw.stopInteraction();
        this.getGeometryApi().deleteGeometryGroup(geometryGroupKey);
        view.padding = originalPadding;
        view.setRotation(originalRotation);
        view.setCenter(originalCenter);
        viewer.map.renderSync();
        setStoreMapPointerPosition(mapId, originalPointer ?? mapController.getMapCenterPosition());
        if (originalFocus instanceof HTMLElement) originalFocus.focus();
        uiController.setCrosshairActive(originalActive);
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
   * Tests that fullscreen exit restores the original view when there was no interaction,
   * and keeps a changed center and resolution when the user interacted.
   *
   * Simulates browser fullscreen events and map size changes so the test does not depend
   * on transient user activation or an actual fullscreen browser window.
   * Renders synchronously to process view changes without waiting for map sources to finish loading.
   *
   * @returns A promise that resolves with the view states observed for each exit scenario
   */
  testFullscreenViewRestoration(): Promise<Test<TypeFullscreenViewRestorationResult>> {
    const mapViewer = this.getMapViewer();
    const { map } = mapViewer;
    const view = mapViewer.getView();
    const shellElement = DomHelper.getShellElement(this.getMapId());
    const originalSize = map.getSize();
    const originalCenter = view.getCenter();
    const originalResolution = view.getResolution();
    const originalRotation = view.getRotation();

    let originalFullscreenElementDescriptor: PropertyDescriptor | undefined;
    let originalExitFullscreenDescriptor: PropertyDescriptor | undefined;
    let originalRequestFullscreenDescriptor: PropertyDescriptor | undefined;
    let mockedFullscreenElement: Element | null = null;
    let shouldRejectFullscreenRequest = false;

    const getViewState = (): TypeFullscreenViewState => {
      const center = view.getCenter();
      const resolution = view.getResolution();
      if (!center || resolution === undefined) throw new TestError('The map view center and resolution must be defined.');
      return { center: [...center], resolution, rotation: view.getRotation() };
    };

    const dispatchFullscreenChange = (fullscreenElement: Element | null): void => {
      mockedFullscreenElement = fullscreenElement;
      document.dispatchEvent(new Event('fullscreenchange'));
    };

    return this.test(
      'Test fullscreen view restoration and interaction preservation',
      async (test) => {
        if (!shellElement) throw new TestError(`The map shell for '${this.getMapId()}' was not found.`);
        if (!originalSize || !originalCenter || originalResolution === undefined) {
          throw new TestError('The map size, center and resolution must be defined before testing fullscreen.');
        }

        originalFullscreenElementDescriptor = Object.getOwnPropertyDescriptor(document, 'fullscreenElement');
        originalExitFullscreenDescriptor = Object.getOwnPropertyDescriptor(document, 'exitFullscreen');
        originalRequestFullscreenDescriptor = Object.getOwnPropertyDescriptor(shellElement, 'requestFullscreen');

        Object.defineProperty(document, 'fullscreenElement', {
          configurable: true,
          get: () => mockedFullscreenElement,
        });
        Object.defineProperty(document, 'exitFullscreen', {
          configurable: true,
          value: (): Promise<void> => {
            dispatchFullscreenChange(null);
            return Promise.resolve();
          },
        });
        Object.defineProperty(shellElement, 'requestFullscreen', {
          configurable: true,
          value: (): Promise<void> => {
            if (shouldRejectFullscreenRequest) return Promise.reject(new Error('Fullscreen request rejected.'));
            dispatchFullscreenChange(shellElement);
            return Promise.resolve();
          },
        });

        const initial = getViewState();
        const fullscreenSize: Size = [Math.max(originalSize[0] * 2, 1200), Math.max(originalSize[1] * 0.75, 500)];

        test.addStep('Entering fullscreen, changing map size, and exiting through the fullscreen API...');
        this.getControllersRegistry().uiController.setFullScreen(true, shellElement);
        await delay(50); // TODO: Fix the delay call here, or explain it with a GV comment or use a defined shared constant value
        map.setSize([...fullscreenSize]);
        this.getControllersRegistry().uiController.setFullScreen(false);
        await delay(50); // TODO: Fix the delay call here, or explain it with a GV comment or use a defined shared constant value
        map.renderSync();
        const afterButtonExit = getViewState();

        test.addStep('Repeating fullscreen with an Esc-style fullscreenchange exit...');
        this.getControllersRegistry().uiController.setFullScreen(true, shellElement);
        await delay(50); // TODO: Fix the delay call here, or explain it with a GV comment or use a defined shared constant value
        map.setSize([...fullscreenSize]);
        dispatchFullscreenChange(null);
        await delay(50); // TODO: Fix the delay call here, or explain it with a GV comment or use a defined shared constant value
        map.renderSync();
        const afterEscExit = getViewState();

        test.addStep('Changing the view while fullscreen, then exiting...');
        this.getControllersRegistry().uiController.setFullScreen(true, shellElement);
        await delay(50); // TODO: Fix the delay call here, or explain it with a GV comment or use a defined shared constant value
        map.setSize([...fullscreenSize]);
        const centerBeforeInteraction = view.getCenter();
        const resolutionBeforeInteraction = view.getResolution();
        if (!centerBeforeInteraction || resolutionBeforeInteraction === undefined) {
          throw new TestError('The map view center and resolution must remain defined while fullscreen.');
        }
        view.setCenter([
          centerBeforeInteraction[0] + resolutionBeforeInteraction * 5,
          centerBeforeInteraction[1] + resolutionBeforeInteraction * 3,
        ]);
        view.setResolution(resolutionBeforeInteraction / 2);
        const expectedInteractiveView = getViewState();
        dispatchFullscreenChange(null);
        await delay(50); // TODO: Fix the delay call here, or explain it with a GV comment or use a defined shared constant value
        map.renderSync();
        const afterInteractiveExit = getViewState();

        test.addStep('Changing the view while fullscreen, resizing again (e.g. footer resize), then exiting...');
        this.getControllersRegistry().uiController.setFullScreen(true, shellElement);
        await delay(50); // TODO: Fix the delay call here, or explain it with a GV comment or use a defined shared constant value
        map.setSize([...fullscreenSize]);
        map.renderSync();
        const centerBeforeResizeInteraction = view.getCenter();
        const resolutionBeforeResizeInteraction = view.getResolution();
        if (!centerBeforeResizeInteraction || resolutionBeforeResizeInteraction === undefined) {
          throw new TestError('The map view center and resolution must remain defined while fullscreen.');
        }
        view.setCenter([
          centerBeforeResizeInteraction[0] - resolutionBeforeResizeInteraction * 5,
          centerBeforeResizeInteraction[1] - resolutionBeforeResizeInteraction * 3,
        ]);
        view.setResolution(resolutionBeforeResizeInteraction / 2);
        // Let the 'moveend' for the interaction fire before the next size change
        await delay(50); // TODO: Fix the delay call here, or explain it with a GV comment or use a defined shared constant value
        map.renderSync();
        map.setSize([fullscreenSize[0], fullscreenSize[1] - 100]);
        const expectedInteractiveResizeView = getViewState();
        dispatchFullscreenChange(null);
        await delay(50); // TODO: Fix the delay call here, or explain it with a GV comment or use a defined shared constant value
        map.renderSync();
        const afterInteractiveResizeExit = getViewState();

        test.addStep('Rejecting a fullscreen request and verifying fullscreen state cleanup...');
        shouldRejectFullscreenRequest = true;
        this.getControllersRegistry().uiController.setFullScreen(true, shellElement);
        await delay(50); // TODO: Fix the delay call here, or explain it with a GV comment or use a defined shared constant value
        const rejectedRequestIsInactive = !getStoreAppIsFullscreenActive(this.getMapId());
        shouldRejectFullscreenRequest = false;

        return {
          initial,
          afterButtonExit,
          afterEscExit,
          expectedInteractiveView,
          afterInteractiveExit,
          expectedInteractiveResizeView,
          afterInteractiveResizeExit,
          rejectedRequestIsInactive,
        };
      },
      (test, result) => {
        const assertViewStateEqual = (label: string, actual: TypeFullscreenViewState, expected: TypeFullscreenViewState): void => {
          test.addStep(`Verifying ${label} center, resolution and rotation...`);
          Test.assertIsEqual(actual.center[0], expected.center[0]);
          Test.assertIsEqual(actual.center[1], expected.center[1]);
          Test.assertIsEqual(actual.resolution, expected.resolution);
          Test.assertIsEqual(actual.rotation, expected.rotation);
        };

        test.addStep('Verifying the fullscreen interaction changed the center and resolution...');
        Test.assertIsNotEqual(result.expectedInteractiveView.center[0], result.initial.center[0]);
        Test.assertIsNotEqual(result.expectedInteractiveView.resolution, result.initial.resolution);
        assertViewStateEqual('button exit without interaction restores the original', result.afterButtonExit, result.initial);
        assertViewStateEqual('Esc exit without interaction restores the original', result.afterEscExit, result.initial);
        assertViewStateEqual(
          'fullscreen exit after interaction keeps the current view',
          result.afterInteractiveExit,
          result.expectedInteractiveView
        );
        Test.assertIsNotEqual(result.expectedInteractiveResizeView.resolution, result.initial.resolution);
        assertViewStateEqual(
          'fullscreen exit after interaction then resize keeps the current view',
          result.afterInteractiveResizeExit,
          result.expectedInteractiveResizeView
        );
        Test.assertIsEqual(result.rejectedRequestIsInactive, true);
      },
      (test) => {
        test.addStep('Restoring fullscreen APIs, map size and view...');
        shouldRejectFullscreenRequest = false;
        if (mockedFullscreenElement) dispatchFullscreenChange(null);
        if (getStoreAppIsFullscreenActive(this.getMapId())) this.getControllersRegistry().uiController.setFullScreen(false);
        if (originalFullscreenElementDescriptor) {
          Object.defineProperty(document, 'fullscreenElement', originalFullscreenElementDescriptor);
        } else {
          Reflect.deleteProperty(document, 'fullscreenElement');
        }
        if (originalExitFullscreenDescriptor) {
          Object.defineProperty(document, 'exitFullscreen', originalExitFullscreenDescriptor);
        } else {
          Reflect.deleteProperty(document, 'exitFullscreen');
        }
        if (shellElement) {
          if (originalRequestFullscreenDescriptor) {
            Object.defineProperty(shellElement, 'requestFullscreen', originalRequestFullscreenDescriptor);
          } else {
            Reflect.deleteProperty(shellElement, 'requestFullscreen');
          }
        }
        if (originalSize) map.setSize(originalSize);
        if (originalCenter && originalResolution !== undefined) {
          view.setRotation(originalRotation);
          view.setResolution(originalResolution);
          view.setCenter(originalCenter);
        }
        map.renderSync();
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
   * Test selecting details panel and finding the "Top" anchor in the guide container.
   *
   * @returns A promise that resolves when the test completes
   */
  testGuideDetailsPanelTopAnchor(): Promise<Test<HTMLAnchorElement | null>> {
    const mapId = this.getMapId();

    return this.test(
      'Test Details Panel - Select and Find Top Anchor',
      async (test) => {
        test.addStep('Selecting details panel and wait for the UI to refresh...');
        this.getControllersRegistry().uiController.setActiveAppBarTab('details', true, false);
        await DomHelper.waitForAppbarTabSelected(mapId, 'details');

        test.addStep('Finding guide-container div...');
        const guideContainer = DomHelper.getGuideContainer(mapId);
        if (!guideContainer) throw new Error('guide-container div not found');

        test.addStep('Searching for "Top" anchor tag within guide-container...');
        const anchorElements = guideContainer.querySelectorAll('a');
        let foundTopAnchor: HTMLAnchorElement | null = null;

        for (let index = 0; index < anchorElements.length; index++) {
          const anchor = anchorElements[index];
          if (anchor.textContent?.trim() === 'Top') {
            foundTopAnchor = anchor;
            break;
          }
        }

        return foundTopAnchor;
      },
      (test, result) => {
        test.addStep('Verifying "Top" anchor tag was not found...');
        Test.assertIsEqual(result, null);
      }
    );
  }

  /**
   * Test that a non-React consumer can read the footer height through the UI controller.
   *
   * @returns A promise that resolves when the test completes
   */
  testControllerGetFooterHeight(): Promise<Test<string>> {
    return this.test(
      'Test UIController.getFooterHeight (non-React consumer)',
      (test) => {
        test.addStep('Calling getFooterHeight via the controller registry (non-React path)...');
        return DomHelper.getDataFooterHeight(this.getMapId(), getStoreAppHeight(this.getMapId()));
      },
      (test, result) => {
        test.addStep('Verifying a CSS length string was returned...');
        Test.assertIsDefined('footerHeight', result);
        Test.assertIsEqual(/(px|%)$/.test(result), true);
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
   * @returns A promise that resolves with the layer and feature arrays before disabling queries, while disabled, and after re-enabling
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

        // Query the layer at the given coordinates
        const layerDataOn = await this.queryAtCoordinateRetrieveResultsForLayer(test, layer, lonlat);

        // Set layer non queryable, this will also clear the result set automatically
        test.addStep(`Setting layer '${layerPath}' as non-queryable...`);
        layer.setQueryable(false);

        // Query the layer at the given coordinates
        const layerDataOff = await this.queryAtCoordinateRetrieveResultsForLayer(test, layer, lonlat);

        // Set layer queryable again
        test.addStep(`Setting layer '${layerPath}' as queryable again...`);
        layer.setQueryable(true);

        // Query the layer at the given coordinates
        const layerDataOn2 = await this.queryAtCoordinateRetrieveResultsForLayer(test, layer, lonlat);

        // Return the test results
        return { layer, results: [layerDataOn, layerDataOff, layerDataOn2] };
      },
      (test, result) => {
        // Get the results
        const [layerDataOn, layerDataOff, layerDataOn2] = result.results;

        test.addStep('Verifying layer data features when queryable...');
        Test.assertIsArray(layerDataOn);
        Test.assertIsArrayLengthEqual(layerDataOn, 2);

        test.addStep('Verifying no layer data features when non-queryable...');
        Test.assertIsUndefined('features', layerDataOff);

        test.addStep('Verifying layer data features when queryable again...');
        Test.assertIsArray(layerDataOn2);
        Test.assertIsArrayLengthEqual(layerDataOn2, 2);
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

  /**
   * Exercises delegated scrolling through real controls in an isolated, scrollable viewer.
   *
   * @param scenario - The viewport regression to exercise
   * @returns The test with preconditions and final browser geometry
   */
  testMapSectionScroll(scenario: TypeScrollScenario): Promise<Test<TypeScrollResult>> {
    // Unique ID so the fixture never collides with the suite map or another scroll test
    const mapId = `scroll-${generateId(8)}`;

    // Captured up front so cleanup can leave the page where the next test expects it
    const originalScroll = { x: window.scrollX, y: window.scrollY };

    // Built now but only mounted when the test runs, and always removed in cleanup
    const fixture = MapTester.#createScrollFixture(mapId);

    return this.test(
      `Test map-section scroll - ${scenario}`,
      async (test): Promise<TypeScrollResult> => {
        // Mount the host in the page, then render the viewer into it
        test.addStep('Creating an isolated viewer with app-bar, map-info and footer controls...');
        document.body.appendChild(fixture);
        await this.#createScrollViewer(mapId, scenario);

        // Locate the rendered controls and let the initial layout settle before touching anything
        const context = await MapTester.#createScrollContext(test, mapId);

        // Drive the scenario; it records preconditions and measurements on the context
        await MapTester.#runScrollScenario(context, scenario);

        // Return evidence only; every assertion lives in the verification callback
        return { preconditions: context.preconditions, measurements: context.measurements, viewportHeight: window.innerHeight };
      },
      (test, result): void => MapTester.#verifyScroll(test, scenario, result),
      (): Promise<void> => this.#cleanupScrollFixture(mapId, fixture, originalScroll)
    );
  }

  // #endregion PUBLIC METHODS - MAP FUNCTIONS

  // #region PRIVATE METHODS - MAP SECTION SCROLL

  /**
   * Renders the isolated viewer with app-bar, map-info and footer controls.
   *
   * @param mapId - The isolated viewer ID
   * @param scenario - The viewport regression, which selects the viewer height
   * @returns A promise that resolves once the viewer is created
   */
  async #createScrollViewer(mapId: string, scenario: TypeScrollScenario): Promise<void> {
    // The oversized scenario needs a map taller than the viewport; the others must fit inside it
    const height = Math.round(window.innerHeight * (scenario === 'oversized' ? 1.5 : 0.7));

    // Layer-free map with one app-bar tab and two footer tabs: just enough controls to drive the delegated scrolling
    await this.getApi().createMapFromConfigFast(
      mapId,
      JSON.stringify({
        map: {
          interaction: 'dynamic',
          viewSettings: { projection: 3978, initialView: { zoomAndCenter: [4, [-90, 60]] } },
          basemapOptions: { basemapId: 'nogeom', shaded: false, labeled: false },
          listOfGeoviewLayerConfig: [],
        },
        appBar: { tabs: { core: ['legend'] } },
        footerBar: { tabs: { core: ['layers', 'details'] } },
        navBar: ['fullscreen'],
        corePackages: [],
      }),
      height
    );
  }

  /**
   * Deletes the isolated viewer, removes its host and restores the page scroll position.
   *
   * @param mapId - The isolated viewer ID
   * @param fixture - The host element mounted in the page
   * @param originalScroll - The page scroll position captured before the test
   * @returns A promise that resolves once the page is back to its original state
   */
  async #cleanupScrollFixture(mapId: string, fixture: HTMLElement, originalScroll: { x: number; y: number }): Promise<void> {
    try {
      // The viewer may not exist when setup failed early, so check before deleting
      if (this.getApi().hasMapViewer(mapId)) await this.getApi().deleteMapViewer(mapId, true);
    } finally {
      // Runs even if deleting the viewer throws, so a failure never leaves the page scrolled or the host mounted
      fixture.remove();
      window.scrollTo({ left: originalScroll.x, top: originalScroll.y, behavior: 'instant' });
    }
  }

  // #endregion PRIVATE METHODS - MAP SECTION SCROLL

  // #region STATIC PRIVATE METHODS - MAP SECTION SCROLL

  /**
   * Creates the host element that makes the page scrollable around the isolated viewer.
   *
   * @param mapId - The ID given to the viewer's target element
   * @returns The host element, not yet attached to the page
   */
  static #createScrollFixture(mapId: string): HTMLElement {
    const fixture = document.createElement('div');
    const target = document.createElement('div');
    target.id = mapId;

    // One viewport of padding above and two below lets the section be scrolled to any position, including clipped at either edge
    fixture.style.cssText = `padding-top: ${window.innerHeight}px; padding-bottom: ${window.innerHeight * 2}px; width: min(900px, 100%);`;
    fixture.appendChild(target);
    return fixture;
  }

  /**
   * Resolves the rendered controls once the viewer shell is ready.
   *
   * @param test - The running test, used to record steps
   * @param mapId - The isolated viewer ID
   * @returns A promise that resolves with the controls and empty evidence collections
   */
  static async #createScrollContext(test: Test, mapId: string): Promise<TypeScrollContext> {
    // The app-bar button only exists once the shell has rendered, so it doubles as the readiness signal
    const button = await DomHelper.waitForLegendPanelButton(mapId, 'appBar', GVAbstractTester.UI_SCROLL_TIMEOUT_MS);

    // Fail fast with a clear message if any control is missing, rather than a null error mid-scenario
    const section = MapTester.#requireElement(mapId, 'map');
    const info = MapTester.#requireElement(mapId, 'mapInfo');
    const footer = MapTester.#requireElement(mapId, 'tabsContainer');

    // Measurements taken before the initial layout settles would be unstable
    await MapTester.#waitForScrollLayout(section);

    // Baseline preconditions: the map-info bar belongs to the section and the section is actually rendered
    const preconditions: boolean[] = [section.contains(info), section.getBoundingClientRect().height > 0];
    return { test, mapId, section, info, button, footer, preconditions, measurements: [] };
  }

  /**
   * Runs the scroll sequence matching the scenario.
   *
   * @param context - The rendered controls and evidence collections
   * @param scenario - The viewport regression to exercise
   * @returns A promise that resolves once the sequence has finished
   */
  static async #runScrollScenario(context: TypeScrollContext, scenario: TypeScrollScenario): Promise<void> {
    switch (scenario) {
      case 'partial':
        await MapTester.#runPartialScroll(context);
        break;
      case 'transitions':
        await MapTester.#runTransitionsScroll(context);
        break;
      case 'visible':
        await MapTester.#runVisibleScroll(context);
        break;
      default:
        // 'oversized'
        await MapTester.#runOversizedScroll(context);
    }
  }

  /**
   * Runs the partial scenario: a section shorter than the viewport with its map-info bar clipped below the fold.
   *
   * @param context - The rendered controls and evidence collections
   * @returns A promise that resolves once the sequence has finished
   */
  static async #runPartialScroll(context: TypeScrollContext): Promise<void> {
    const { test, section, info, button, preconditions } = context;
    const { height } = section.getBoundingClientRect();

    // Push the section down so its top is on screen while the map-info bar at its bottom falls below the viewport
    await MapTester.#positionSection(context, window.innerHeight - height + 40);
    const buttonRect = button.getBoundingClientRect();
    preconditions.push(
      // The section must fit the viewport, otherwise this would be the oversized case
      height < window.innerHeight,
      // The app-bar button must be on screen so the click is a plausible user action
      buttonRect.top >= 0 && buttonRect.bottom <= window.innerHeight,
      // The map-info bar must be clipped, which is the condition the delegated scroll has to repair
      info.getBoundingClientRect().bottom > window.innerHeight
    );

    test.addStep('Activating a visible app-bar button with map-info clipped below the viewport...');

    // First click opens the panel and second closes it; the page must not move between the two activations
    await MapTester.#activateAppBar(context);
    await MapTester.#activateAppBar(context);

    // Clip the top of the section instead and activate again to cover the opposite edge
    await MapTester.#positionSection(context, -40);
    await MapTester.#activateAppBar(context);
  }

  /**
   * Runs the transitions scenario: footer tab, app bar from the footer view, then the map-info bar.
   *
   * @param context - The rendered controls and evidence collections
   * @returns A promise that resolves once the sequence has finished
   */
  static async #runTransitionsScroll(context: TypeScrollContext): Promise<void> {
    const { test, section, footer, preconditions } = context;

    // Footer first: its tab scrolls the footer into view and leaves the map section clipped above
    await MapTester.#activateFooterTab(context);

    // Activate the app bar from that clipped position, which the delegated scroll must repair
    await MapTester.#activateAppBarFromClosed(context);

    test.addStep('Returning from the footer-view position through the app bar...');

    // Scroll until the section's bottom edge reaches the viewport top, i.e. the footer-view position
    await MapTester.#positionSection(context, -section.getBoundingClientRect().height);

    // The footer must still be on screen, otherwise this is not the footer-view position
    preconditions.push(footer.getBoundingClientRect().top >= -GVAbstractTester.UI_SCROLL_TOLERANCE_PX);
    await MapTester.#activateAppBarFromClosed(context);

    // Last transition: the map-info bar while the map is clipped at the top
    await MapTester.#activateMapInfo(context);
  }

  /**
   * Runs the visible scenario: a section already fully on screen must not be moved.
   *
   * @param context - The rendered controls and evidence collections
   * @returns A promise that resolves once the sequence has finished
   */
  static async #runVisibleScroll(context: TypeScrollContext): Promise<void> {
    const { section, info, preconditions, measurements } = context;

    // Place the whole section comfortably inside the viewport
    await MapTester.#positionSection(context, 60);

    // Baseline taken before any activation so the later measurements can be compared with an untouched page
    measurements.push(MapTester.#measureScroll(section, info));

    // Both edges of the section must be on screen, otherwise nothing proves the "no unnecessary scroll" behavior
    preconditions.push(measurements[0].top >= 0, measurements[0].bottom <= window.innerHeight);

    // Open then close the panel; the page must stay where it is
    await MapTester.#activateAppBar(context);
    await MapTester.#activateAppBar(context);
  }

  /**
   * Runs the oversized scenario: a section taller than the viewport is aligned to its top edge.
   *
   * @param context - The rendered controls and evidence collections
   * @returns A promise that resolves once the sequence has finished
   */
  static async #runOversizedScroll(context: TypeScrollContext): Promise<void> {
    const { section, preconditions } = context;

    // Start slightly below the top so the delegated scroll has something to correct
    await MapTester.#positionSection(context, 40);

    // The section must really be taller than the viewport, otherwise it could not exercise the oversized path
    preconditions.push(section.getBoundingClientRect().height > window.innerHeight);

    // Open then close the panel; the top alignment must be stable across both activations
    await MapTester.#activateAppBar(context);
    await MapTester.#activateAppBar(context);
  }

  /**
   * Activates the layers footer tab while the footer sits inside the scroll helper's top clearance.
   *
   * @param context - The rendered controls and evidence collections
   * @returns A promise that resolves once the footer has settled
   */
  static async #activateFooterTab(context: TypeScrollContext): Promise<void> {
    const { test, mapId, section, footer, preconditions } = context;
    const helperOffset = GVAbstractTester.UI_SCROLL_HELPER_OFFSET_PX;

    // Keep the footer control visible but inside the helper's top clearance
    await MapTester.#positionSection(context, helperOffset / 2 - section.getBoundingClientRect().height);
    test.addStep('Activating a footer tab through its delegated click path...');
    const initialFooterRect = footer.getBoundingClientRect();

    // The footer must start inside the clearance zone, otherwise the activation would have nothing to scroll
    preconditions.push(initialFooterRect.top >= 0 && initialFooterRect.top < helperOffset);

    // Click the real tab so the delegated click handler, not a direct scroll call, performs the scroll
    MapTester.#requireElement(mapId, 'tab-layers').click();
    await MapTester.#waitForScrollLayout(footer);

    // Log the final footer bounds so a failed alignment check can be diagnosed from the report
    const footerRect = footer.getBoundingClientRect();
    test.addStep(`Footer bounds after activation: top=${footerRect.top}, bottom=${footerRect.bottom}, viewport=${window.innerHeight}`);

    // The helper must leave the footer's bottom edge at the viewport bottom minus its clearance
    preconditions.push(Math.abs(footerRect.bottom - (window.innerHeight - helperOffset)) <= GVAbstractTester.UI_SCROLL_TOLERANCE_PX);
  }

  /**
   * Activates the map-info bar while the map is clipped at the top.
   *
   * @param context - The rendered controls and evidence collections
   * @returns A promise that resolves once the geometry has been recorded
   */
  static async #activateMapInfo(context: TypeScrollContext): Promise<void> {
    const { test, section, info, preconditions, measurements } = context;

    test.addStep('Activating the map-info bar while the map is clipped at the top...');

    // Clip the top of the section; the bar itself stays on screen below it
    await MapTester.#positionSection(context, -40);

    // The bar must be fully visible, otherwise the click would not be the on-screen user action under test
    const infoRect = info.getBoundingClientRect();
    preconditions.push(infoRect.top >= 0 && infoRect.bottom <= window.innerHeight);

    // Map-info buttons (expand, attribution, position, scale) stop propagation by design; click the bar itself
    info.click();
    await MapTester.#waitForScrollLayout(section);
    measurements.push(MapTester.#measureScroll(section, info));
  }

  /**
   * Positions the section without smooth scrolling, then waits for browser layout.
   *
   * @param context - The rendered controls and evidence collections
   * @param top - Desired viewport top of the section
   * @returns A promise that resolves once the section layout has settled
   */
  static async #positionSection(context: TypeScrollContext, top: number): Promise<void> {
    const { section } = context;

    // Instant rather than smooth, so the next measurement is never taken mid-animation
    window.scrollTo({ top: window.scrollY + section.getBoundingClientRect().top - top, behavior: 'instant' });
    await MapTester.#waitForScrollLayout(section);
  }

  /**
   * Activates the delegated app-bar callback and records the settled map geometry.
   *
   * @param context - The rendered controls and evidence collections
   * @returns A promise that resolves once the geometry has been recorded
   */
  static async #activateAppBar(context: TypeScrollContext): Promise<void> {
    const { section, info, button, measurements } = context;

    // A real click exercises the delegated handler exactly as a user would
    button.click();

    // Measure only after scrolling and layout have settled, or the reading would be transient
    await MapTester.#waitForScrollLayout(section);
    measurements.push(MapTester.#measureScroll(section, info));
  }

  /**
   * Opens the app-bar panel from a clipped section, then closes it while the section is visible.
   *
   * @param context - The rendered controls and evidence collections
   * @returns A promise that resolves once the panel is closed and the section has settled
   */
  static async #activateAppBarFromClosed(context: TypeScrollContext): Promise<void> {
    const { section, button } = context;

    // Open the panel and record the geometry the delegated scroll produced
    await MapTester.#activateAppBar(context);

    // Close it again while the section is visible: closing restores focus to the toggle, and doing it
    // off-screen would let the browser's focus scroll re-center the button and override the scroll under test
    button.click();
    await MapTester.#waitForScrollLayout(section);
  }

  /**
   * Asserts the scenario preconditions, every recorded measurement and repeated-activation stability.
   *
   * @param test - The running test, used to record steps
   * @param scenario - The viewport regression that was exercised
   * @param result - The evidence returned by the scenario
   */
  static #verifyScroll(test: Test, scenario: TypeScrollScenario, result: TypeScrollResult): void {
    test.addStep('Verifying setup preconditions, final bounds and repeated-activation stability...');

    // A failed precondition means the fixture was not in the intended state, so fail before judging the geometry
    result.preconditions.forEach((condition, index): void => {
      if (!condition) Test.assertFail(`Scroll scenario "${scenario}" setup/transition check ${index + 1} failed.`);
    });

    // Every recorded measurement must satisfy the scenario's geometry rules
    result.measurements.forEach((measurement, index): void => {
      test.addStep(`Activation ${index + 1}: ${JSON.stringify(measurement)}, viewport=${result.viewportHeight}`);
      MapTester.#assertScrollMeasurement(scenario, measurement, result.viewportHeight);
    });

    // The second activation must not move the page; the transitions scenario scrolls between activations on purpose
    if (scenario !== 'transitions') {
      Test.assertIsEqualWithinTolerance(
        result.measurements[1].scrollY,
        result.measurements[0].scrollY,
        GVAbstractTester.UI_SCROLL_TOLERANCE_PX
      );
    }
  }

  /**
   * Asserts one measurement against the geometry expected for the scenario.
   *
   * @param scenario - The viewport regression that was exercised
   * @param measurement - The geometry captured after an activation
   * @param viewportHeight - The viewport height when the test ran
   */
  static #assertScrollMeasurement(scenario: TypeScrollScenario, measurement: TypeScrollMeasurement, viewportHeight: number): void {
    const tolerance = GVAbstractTester.UI_SCROLL_TOLERANCE_PX;
    const gap = MAP_SECTION_SCROLL_GAP_PX;

    // A section taller than the viewport cannot fit, so it is aligned with its top at the standard gap and nothing else applies
    if (scenario === 'oversized') {
      Test.assertIsEqualWithinTolerance(measurement.top, gap, tolerance);
      return;
    }

    // A section that was already visible keeps its position, so only the clipped scenarios assert an exact top offset
    if (scenario !== 'visible') {
      // The top lands at the standard gap, or at the remaining space when gap plus section height would overflow the viewport
      const expectedOffset = Math.min(gap, viewportHeight - (measurement.bottom - measurement.top));
      Test.assertIsEqualWithinTolerance(measurement.top, expectedOffset, tolerance);
    }

    // The whole section must end up inside the viewport...
    Test.assertIsEqual(measurement.top >= -tolerance, true);
    Test.assertIsEqual(measurement.bottom <= viewportHeight + tolerance, true);

    // ...and so must the map-info bar, which is the control that used to be clipped
    Test.assertIsEqual(measurement.infoTop >= -tolerance, true);
    Test.assertIsEqual(measurement.infoBottom <= viewportHeight + tolerance, true);
  }

  /**
   * Gets a required fixture element or fails explicitly when setup is incomplete.
   *
   * @param mapId - The isolated viewer ID
   * @param suffix - The element ID suffix
   * @returns The rendered element
   */
  static #requireElement(mapId: string, suffix: string): HTMLElement {
    const element = DomHelper.getGVElementById(mapId, suffix);
    if (!element) throw new Error(`Scroll fixture element not found: ${mapId}-${suffix}`);
    return element;
  }

  /**
   * Waits for page scrolling and the measured element's layout to remain stable, with a bounded timeout.
   *
   * @param element - The element whose geometry must settle
   * @returns A promise resolving after scrolling and layout settle
   */
  static async #waitForScrollLayout(element: HTMLElement): Promise<void> {
    let previous = '';
    let stableSince = performance.now();
    await whenThisThen(
      (): boolean => {
        const rect = element.getBoundingClientRect();
        const current = `${window.scrollY},${rect.top},${rect.height}`;
        if (current !== previous) {
          previous = current;
          stableSince = performance.now();
        }
        return performance.now() - stableSince >= GVAbstractTester.UI_SCROLL_SETTLE_MS;
      },
      GVAbstractTester.UI_SCROLL_TIMEOUT_MS,
      50
    );
  }

  /**
   * Captures the map section and map-info viewport bounds after an activation.
   *
   * @param section - The complete map section
   * @param info - The map-info bar contained in the section
   * @returns Geometry and page scroll measurements
   */
  static #measureScroll(section: HTMLElement, info: HTMLElement): TypeScrollMeasurement {
    const rect = section.getBoundingClientRect();
    const infoRect = info.getBoundingClientRect();
    return { top: rect.top, bottom: rect.bottom, infoTop: infoRect.top, infoBottom: infoRect.bottom, scrollY: window.scrollY };
  }

  // #endregion STATIC PRIVATE METHODS - MAP SECTION SCROLL

  // #region PRIVATE METHODS - VIEWPORT BOUNDARY

  /**
   * Restores layout and a usable viewport after a test, including detached and invalid-size cases.
   *
   * @param host - The suite's existing map root
   * @param originalWidth - Inline width before the test
   */
  #resetViewportFixture(host: HTMLElement, originalWidth: string): void {
    host.style.setProperty('width', originalWidth);
    const viewer = this.getMapViewer();
    viewer.map.setTarget(DomHelper.getMapTargetElement(this.getMapId()));
    DomHelper.getMapInfo(this.getMapId())?.style.removeProperty('height');
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
      infoHeight: viewer.mapFeaturesConfig.map.interaction === 'static' ? 0 : DomHelper.getMapInfoOffsetHeight(viewer.mapId),
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

// #region TYPES AND INTERFACES

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

/** Crosshair activation and drawing observations from a rendered view. */
interface TypeCrosshairCoordinateResult {
  /** Crosshair SVG center in map pixels. */
  pixel: Coordinate;
  /** Full viewport center, independent of view padding. */
  viewportCenter: Coordinate;
  /** Pointer position immediately after keyboard activation. */
  pointer: TypeMapMouseInfo | undefined;
  /** Coordinate expected under the rendered crosshair. */
  expected: Coordinate;
  /** Coordinate at the full viewport center, which the keyboard position must resolve to. */
  expectedCenter: Coordinate;
  /** Expected longitude/latitude at that coordinate. */
  expectedLonLat: Coordinate;
  /** Position converted by the controller. */
  position: TypeMapMouseInfo | undefined;
  /** Coordinates submitted by Enter and Space, converted back to pixels. */
  drawnPixels: (Coordinate | null)[];
  /** Whether both keyboard events were handled. */
  prevented: boolean[];
}

/** The center, resolution and rotation of a map view. */
type TypeFullscreenViewState = {
  /** The view center. */
  center: Coordinate;
  /** The view resolution. */
  resolution: number;
  /** The view rotation in radians. */
  rotation: number;
};

/** The view states observed across fullscreen exit scenarios. */
type TypeFullscreenViewRestorationResult = {
  /** The view before entering fullscreen. */
  initial: TypeFullscreenViewState;
  /** The view after exiting by the fullscreen button without interaction. */
  afterButtonExit: TypeFullscreenViewState;
  /** The view after an Esc-style fullscreenchange without interaction. */
  afterEscExit: TypeFullscreenViewState;
  /** The view changed by the test while fullscreen. */
  expectedInteractiveView: TypeFullscreenViewState;
  /** The view after exiting fullscreen following interaction. */
  afterInteractiveExit: TypeFullscreenViewState;
  /** The view after an interaction followed by a fullscreen size change, just before exiting. */
  expectedInteractiveResizeView: TypeFullscreenViewState;
  /** The view after exiting fullscreen following an interaction and a later size change. */
  afterInteractiveResizeExit: TypeFullscreenViewState;
  /** Whether a rejected fullscreen request restored the inactive state. */
  rejectedRequestIsInactive: boolean;
};

/** Represents a layer paired with feature information results collected before and after an operation (e.g., filtering, ordering, or updates). */
type LayerWithBeforeAfterFeature<T> = LayerWithResults<T, (TypeFeatureInfoEntry[] | undefined)[]>;

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

/** Isolated viewer scrolling regressions, scheduled sequentially by the UI suite. */
type TypeScrollScenario = 'partial' | 'transitions' | 'visible' | 'oversized';

/** Browser geometry captured after a real control activation. */
type TypeScrollMeasurement = { top: number; bottom: number; infoTop: number; infoBottom: number; scrollY: number };

/** Setup preconditions and geometry returned for assertion-only verification. */
type TypeScrollResult = { preconditions: boolean[]; measurements: TypeScrollMeasurement[]; viewportHeight: number };

/** Rendered fixture controls plus the evidence a scroll scenario accumulates while it runs. */
type TypeScrollContext = {
  test: Test;
  mapId: string;
  section: HTMLElement;
  info: HTMLElement;
  button: HTMLElement;
  footer: HTMLElement;
  preconditions: boolean[];
  measurements: TypeScrollMeasurement[];
};

// #endregion TYPES AND INTERFACES
