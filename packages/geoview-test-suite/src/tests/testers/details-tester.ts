import { containsExtent, getCenter } from 'ol/extent';

import { Test } from '../core/test';
import { TestSkippedError } from '../core/exceptions';
import { GVAbstractTester } from './abstract-gv-tester';
import type { Extent, TypeFeatureInfoEntry } from 'geoview-core/api/types/map-schema-types';
import { NoExtentError } from 'geoview-core/core/exceptions/geoview-exceptions';
import { GeoUtilities } from 'geoview-core/geo/utils/utilities';
import { OL_ZOOM_FEATURE_MAX_SCALE } from 'geoview-core/core/utils/constant';
import { DomHelper } from 'geoview-core/core/utils/dom-helper';
import { whenThisThen } from 'geoview-core/core/utils/utilities';
import {
  getStoreDetailsCurrentFeatureIndex,
  getStoreDetailsFeatures,
  getStoreDetailsSelectedLayerPath,
  getStoreDetailsCoordinateInfoEnabled,
  getStoreDetailsLayerDataArrayFeature,
  getStoreDetailsQueryStatus,
  LAYER_PATH_COORDINATE_INFO,
} from 'geoview-core/core/stores/states/feature-info-state';
import {
  getStoreAppDisplayDateFormatDefault,
  getStoreAppDisplayDateTimezone,
  getStoreAppDisplayLanguage,
} from 'geoview-core/core/stores/states/app-state';
import { getStoreLayerLegendLayerByPath } from 'geoview-core/core/stores/states/layer-state';
import { DateMgt, type TypeDisplayDateFormat } from 'geoview-core/core/utils/date-mgt';
import {
  getStoreMapHighlightedFeatures,
  getStoreMapClickMarker,
  getStoreMapClickCoordinates,
} from 'geoview-core/core/stores/states/map-state';
import type { AbstractGVLayer } from 'geoview-core/geo/layer/gv-layers/abstract-gv-layer';
import type { AbstractBaseGVLayer } from 'geoview-core/geo/layer/gv-layers/abstract-base-layer';
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
   * Tests the coordinate information toggle, rendered coordinates, and updates after map clicks.
   *
   * @returns A promise resolving with the observed toggle states and coordinate content
   */
  testShowCoordinateInfoToggle(): Promise<Test<CoordinateInfoToggleResult>> {
    const mapId = this.getMapId();

    // Preserve the user's toggle, last click, layer selection, and panel visibility for cleanup.
    const initialEnabled = getStoreDetailsCoordinateInfoEnabled(mapId);
    const initialClick = getStoreMapClickCoordinates(mapId);
    const initialSelectedLayer = getStoreDetailsSelectedLayerPath(mapId);
    const initialPanelOpen = DomHelper.getAppBarButtonDetailsActive(mapId);

    return this.test(
      'Test Show coordinate info toggle and updates after map clicks...',
      async (test) => {
        // Open the panel before accessing its controls, without changing the map view.
        await this.toggleAppbarTabDetails(test, true);
        const toggle = DomHelper.Details.getCoordinateInfoToggle(mapId);
        if (!toggle) throw new Error('Coordinate information toggle was not rendered');
        // The switch should be unavailable only when the map has no previous click.
        const disabledBeforeClick = toggle.disabled;

        // A map click enables the switch; establish an unchecked baseline through the UI.
        if (toggle.checked) {
          toggle.click();
          await DomHelper.waitForReactIdle();
        }

        // Store an Ottawa click while coordinate information is off; no coordinate content should appear yet.
        await this.simulateMapClickWaitForBatchedQuery(test, GVAbstractTester.OTTAWA_LONLAT);
        await DomHelper.waitForReactIdle();
        const enabledAfterClick = !toggle.disabled;
        const hiddenBeforeEnable = !DomHelper.Details.getCoordinateInfoContent(mapId);

        // Use the actual input so the test exercises the UI toggle handler, not just a store update.
        test.addStep('Enabling coordinate information through the toggle...');
        toggle.click();
        await DomHelper.waitForReactIdle();
        const first = await this.#readCoordinateInfo(GVAbstractTester.OTTAWA_LONLAT, toggle);

        // Keep the toggle enabled and verify that a different click replaces the displayed coordinates.
        test.addStep('Clicking another location and reading the updated coordinate information...');
        await this.simulateMapClickWaitForBatchedQuery(test, GVAbstractTester.QUEBEC_LONLAT);
        const second = await this.#readCoordinateInfo(GVAbstractTester.QUEBEC_LONLAT, toggle);

        test.addStep('Disabling coordinate information and clicking while it is disabled...');
        toggle.click();
        await DomHelper.waitForReactIdle();

        // Capture both DOM removal and coordinate-feature removal after switching off.
        const uncheckedAfterDisable = !toggle.checked;
        const hiddenAfterDisable = !DomHelper.Details.getCoordinateInfoContent(mapId);
        const featureRemoved = !getStoreDetailsLayerDataArrayFeature(mapId);

        // Clicking while disabled must not recreate either the coordinate feature or its content.
        await this.simulateMapClickWaitForBatchedQuery(test, GVAbstractTester.ALBERTA_CENTER_LONLAT);
        await DomHelper.waitForReactIdle();
        const hiddenAfterDisabledClick = !DomHelper.Details.getCoordinateInfoContent(mapId);
        const featureAbsentAfterDisabledClick = !getStoreDetailsLayerDataArrayFeature(mapId);

        // Re-enabling must use the Alberta click recorded while off, rather than the previous Quebec click.
        test.addStep('Re-enabling coordinate information for the latest clicked location...');
        toggle.click();
        const reenabled = await this.#readCoordinateInfo(GVAbstractTester.ALBERTA_CENTER_LONLAT, toggle);

        // Return observations only; all behavioral assertions belong in the assertion callback.
        return {
          disabledBeforeClick,
          enabledAfterClick,
          hiddenBeforeEnable,
          first,
          second,
          uncheckedAfterDisable,
          hiddenAfterDisable,
          featureRemoved,
          hiddenAfterDisabledClick,
          featureAbsentAfterDisabledClick,
          reenabled,
        };
      },
      (test, result) => {
        // Check switch availability and ensure disabling removes both the UI and its backing feature.
        test.addStep('Verifying toggle availability and show/hide behavior...');
        Test.assertIsEqual(result.disabledBeforeClick, !initialClick);
        Test.assertIsEqual(result.enabledAfterClick, true);
        Test.assertIsEqual(result.hiddenBeforeEnable, true);
        Test.assertIsEqual(result.uncheckedAfterDisable, true);
        Test.assertIsEqual(result.hiddenAfterDisable, true);
        Test.assertIsEqual(result.featureRemoved, true);
        Test.assertIsEqual(result.hiddenAfterDisabledClick, true);
        Test.assertIsEqual(result.featureAbsentAfterDisabledClick, true);

        test.addStep('Verifying decimal and DMS coordinates match each clicked location...');
        // Pair each captured state with the click that should have produced it.
        const coordinates = [GVAbstractTester.OTTAWA_LONLAT, GVAbstractTester.QUEBEC_LONLAT, GVAbstractTester.ALBERTA_CENTER_LONLAT];
        [result.first, result.second, result.reenabled].forEach((observation, index) => {
          const [longitude, latitude] = coordinates[index];

          // Native input state, accessible state, and store state must agree that the toggle is enabled.
          Test.assertIsEqual(observation.checked, true);
          Test.assertIsEqual(observation.ariaChecked, 'true');
          Test.assertIsEqual(observation.enabled, true);

          // Check the backing feature independently from the text rendered in the panel.
          Test.assertIsDefined('coordinate feature', observation.feature);
          Test.assertIsEqual(observation.feature.fieldInfo.latitude?.value, latitude.toFixed(6));
          Test.assertIsEqual(observation.feature.fieldInfo.longitude?.value, longitude.toFixed(6));

          // Decimal coordinates include hemisphere markers; DMS coordinates use the shared geo formatter.
          Test.assertIsEqual(observation.text.includes(`${latitude.toFixed(6)}\u00b0 N`), true);
          Test.assertIsEqual(observation.text.includes(`${Math.abs(longitude).toFixed(6)}\u00b0 W`), true);
          Test.assertIsEqual(observation.text.includes(GeoUtilities.coordFormatDMS(latitude)), true);
          Test.assertIsEqual(observation.text.includes(GeoUtilities.coordFormatDMS(longitude)), true);
        });

        // Catch stale panel content even when the toggle remains checked across successive clicks.
        Test.assertIsEqual(result.first.text !== result.second.text, true);
      },
      async (test) => {
        // Restore the toggle and previous selection without fitting or zooming the map.
        const { mapController, detailsController } = this.getControllersRegistry();

        // Disable first so restoring the old click does not start an intermediate coordinate lookup.
        if (getStoreDetailsCoordinateInfoEnabled(mapId)) mapController.toggleCoordinateInfoEnabled(new AbortController().signal);
        if (initialClick) mapController.setClickCoordinates(initialClick);

        // Refresh the original coordinate information only if it was enabled before this test.
        if (initialEnabled) {
          mapController.toggleCoordinateInfoEnabled(new AbortController().signal);
          await whenThisThen(
            () => getStoreDetailsQueryStatus(mapId, LAYER_PATH_COORDINATE_INFO) === 'processed',
            GVAbstractTester.UI_STATE_TIMEOUT_MS,
            50
          );
        }

        // Restore the selected layer after the coordinate lookup has settled.
        detailsController.setSelectedLayerPath(initialSelectedLayer);
        await DomHelper.waitForReactIdle();

        // Leave an initially open panel open; close it only when the test opened it.
        if (!initialPanelOpen) await this.toggleAppbarTabDetails(test, false);
      }
    );
  }

  /**
   * Tests the rendered polygon feature details and the map's configured date display format.
   *
   * @returns A promise resolving with the observed feature and rendered table fields
   */
  testPolygonFeatureDetailsTable(): Promise<Test<DetailsFeatureTableResult>> {
    let rootLayerPath: string | undefined;

    return this.test(
      'Test polygon feature details table and configured date format...',
      async (test) => {
        // Save the cleanup path before loading, so a failed load can still be cleaned up.
        const layer = await this.addLayerGeoJSONWithMetadataPolygons(test, {
          onLayerPath: (rootPath): void => {
            rootLayerPath = rootPath;
          },
        });

        const layerPath = layer.getLayerPath();
        const mapId = this.getMapId();

        test.addStep('Returning to the initial extent and querying the polygon fixture...');
        await this.simulateMapClickWaitForBatchedQuery(test, GVAbstractTester.ONTARIO_CENTER_LONLAT);
        await this.toggleAppbarTabDetails(test, true);
        this.getControllersRegistry().detailsController.setSelectedLayerPath(layerPath);
        await DomHelper.waitForReactIdle();

        // Capture the selected feature's raw values for comparison with the rendered table.
        const selectedLayerPath = getStoreDetailsSelectedLayerPath(mapId);
        const features = getStoreDetailsFeatures(mapId, layerPath);
        const feature = features?.[getStoreDetailsCurrentFeatureIndex(mapId)];
        const dateValue = feature?.fieldInfo.creationDate?.value;
        const imageValue = feature?.fieldInfo.myImages?.value;
        const legend = getStoreLayerLegendLayerByPath(mapId, layerPath);
        const language = getStoreAppDisplayLanguage(mapId);

        // Use the map's localized format and the effective layer timezone and temporal mode.
        const dateFormat = getStoreAppDisplayDateFormatDefault(mapId).datetimeFormat[language];
        const expectedDate =
          dateValue instanceof Date
            ? DateMgt.formatDate(
                dateValue,
                dateFormat,
                language,
                legend?.displayDateTimezone ?? getStoreAppDisplayDateTimezone(mapId),
                legend?.dateTemporalMode ?? DateMgt.DEFAULT_TEMPORAL_MODE
              )
            : undefined;

        test.addStep('Reading the rendered Details feature table...');
        const panel = DomHelper.getAppBarPanelDetails(mapId);

        // Only wait for a table when a feature exists; the assertion callback reports missing data.
        const table = panel && feature ? await DomHelper.Details.waitForFeatureInfoTable(mapId) : undefined;
        const rows = table ? DomHelper.Details.getFeatureInfoRows(table) : [];

        return {
          layerPath,
          selectedLayerPath,
          features,
          feature,
          dateValue,
          imageValue,
          expectedDate,
          layerDateFormat: legend?.displayDateFormat,
          rows,
        };
      },
      (test, result) => {
        test.addStep('Verifying the fixture feature is selected...');
        Test.assertIsEqual(result.selectedLayerPath, result.layerPath);
        Test.assertIsDefined('features', result.features);
        Test.assertIsArrayLengthMinimal(result.features, 1);
        Test.assertIsDefined('selected feature', result.feature);
        Test.assertIsEqual(result.feature.fieldInfo.Province?.value, 'Ontario');

        test.addStep('Verifying the rendered field labels and province...');
        Test.assertIsArrayEqual(
          result.rows.map((row) => row.label),
          ['Province', 'Creation Date', 'My Images']
        );
        Test.assertIsEqual(result.rows[0].value, 'Ontario');

        test.addStep('Verifying the date uses the map display format...');
        Test.assertIsUndefined('layer display date format override', result.layerDateFormat);
        Test.assertIsEqual(result.dateValue instanceof Date, true);
        Test.assertIsDefined('expected formatted date', result.expectedDate);
        Test.assertIsEqual(result.expectedDate.length > 0, true);
        Test.assertIsEqual(result.rows[1].value, result.expectedDate);

        test.addStep('Verifying the image field displays all fixture images...');
        Test.assertIsEqual(typeof result.imageValue, 'string');
        Test.assertIsEqual(result.rows[2].images.length, 3);
        Test.assertIsArrayEqual(result.rows[2].images, typeof result.imageValue === 'string' ? result.imageValue.split(';') : []);
      },
      (test) => {
        // Clear the layer from the map and assert it was removed
        if (rootLayerPath) this.removeLayerConfigAndAssert(test, rootLayerPath);
      }
    );
  }

  /**
   * Tests the rendered Airborne WMS feature details obtained through WFS.
   *
   * @param isRunningOnVPN - Whether the VPN-only service can be accessed
   * @returns A promise resolving with the observed feature and rendered table fields
   */
  testAirborneFeatureDetailsTable(isRunningOnVPN: boolean): Promise<Test<WmsFeatureTableResult>> {
    let rootLayerPath: string | undefined;
    let initialExtent: Extent | undefined;
    const clickCoordinate = [-71.35, 46.7]; // Quebec

    return this.test(
      'Test Airborne WMS feature details table via WFS...',
      async (test) => {
        if (!isRunningOnVPN) throw new TestSkippedError('Not running on VPN');

        // The Airborne fixture changes the zoom before adding the layer.
        initialExtent = this.getMapViewer().getView().calculateExtent();
        const layer = await this.addLayerWMSAirborneWithWFS(test, {
          onLayerPath: (rootPath): void => {
            rootLayerPath = rootPath;
          },
        });
        const layerPath = layer.getLayerPath();
        const mapId = this.getMapId();

        // This layer is only visible within a certain zoom range, so zoom in before interacting with it.
        await this.getControllersRegistry().mapController.zoomMap(4, GVAbstractTester.USE_ZOOM_ANIMATION);

        // Synchronize the render before querying, then wait for the Details store update.
        await this.simulateMapClickWaitForBatchedQuery(test, clickCoordinate);
        await this.toggleAppbarTabDetails(test, true);
        this.getControllersRegistry().detailsController.setSelectedLayerPath(layerPath);
        await DomHelper.waitForReactIdle();

        const selectedLayerPath = getStoreDetailsSelectedLayerPath(mapId);
        const features = getStoreDetailsFeatures(mapId, layerPath);
        const feature = features?.[getStoreDetailsCurrentFeatureIndex(mapId)];

        test.addStep('Reading the rendered Airborne Details feature table...');
        const table = await DomHelper.Details.waitForFeatureInfoTable(mapId);
        const rows = DomHelper.Details.getFeatureInfoRows(table);

        return { layerPath, selectedLayerPath, features, feature, rows };
      },
      (test, result) => {
        test.addStep('Verifying the Airborne fixture feature is selected...');
        Test.assertIsEqual(result.selectedLayerPath, result.layerPath);
        Test.assertIsDefined('features', result.features);
        Test.assertIsArrayLengthMinimal(result.features, 1);
        Test.assertIsDefined('selected feature', result.feature);
        const { feature } = result;

        // The service advertises its date fields as strings, not formatted date values.
        test.addStep('Verifying rendered location, province and date fields...');
        ['Location_Emplacement', 'Province', 'StartDate_DateDebut', 'EndDate_DateFin'].forEach((name) => {
          const field = feature.fieldInfo[name];
          Test.assertIsDefined(name, field);
          Test.assertIsEqual(field.alias, name);
          Test.assertIsEqual(typeof field.value, 'string');
          const row = result.rows.find((entry) => entry.label === name);
          Test.assertIsDefined(`rendered row ${name}`, row);
          Test.assertIsEqual(row.value, typeof field.value === 'string' ? field.value.trim() : undefined);
        });
      },
      async (test) => {
        try {
          // Clear the layer from the map and assert it was removed
          if (rootLayerPath) this.removeLayerConfigAndAssert(test, rootLayerPath);
        } finally {
          if (initialExtent) {
dddd
            test.addStep('Restoring the pre-test map extent...');
            await this.getControllersRegistry().mapController.zoomToExtent(initialExtent, false);
          }
        }
      }
    );
  }

  /**
   * Tests the rendered Cities WMS feature details obtained through WFS.
   *
   * @returns A promise resolving with the observed feature and rendered table fields
   */
  testCitiesFeatureDetailsTable(): Promise<Test<WmsFeatureTableResult>> {
    let rootLayerPath: string | undefined;
    const clickCoordinate = [-71.25, 46.8]; // Quebec city in the Cities WFS

    return this.test(
      'Test Cities WMS feature details table via WFS...',
      async (test) => {
        // Capture the fixture path before waiting for the layer to load.
        const layer = await this.addLayerWMSCitiesWithWFS(test, {
          onLayerPath: (rootPath): void => {
            rootLayerPath = rootPath;
          },
        });
        const layerPath = layer.getLayerPath();
        const mapId = this.getMapId();

        // Query after rendering and wait for the results to reach the Details store.
        await this.queryAtCoordinateRetrieveResultsForLayer(test, layer, clickCoordinate);
        await GVAbstractTester.waitForBatchedQueryPropagation(test);
        await this.toggleAppbarTabDetails(test, true);
        this.getControllersRegistry().detailsController.setSelectedLayerPath(layerPath);
        await DomHelper.waitForReactIdle();

        const selectedLayerPath = getStoreDetailsSelectedLayerPath(mapId);
        const features = getStoreDetailsFeatures(mapId, layerPath);
        const feature = features?.[getStoreDetailsCurrentFeatureIndex(mapId)];

        test.addStep('Reading the rendered Cities Details feature table...');
        const table = await DomHelper.Details.waitForFeatureInfoTable(mapId);
        const rows = DomHelper.Details.getFeatureInfoRows(table);

        return { layerPath, selectedLayerPath, features, feature, rows };
      },
      (test, result) => {
        test.addStep('Verifying the Cities fixture feature is selected...');
        Test.assertIsEqual(result.selectedLayerPath, result.layerPath);
        Test.assertIsDefined('features', result.features);
        Test.assertIsArrayLengthMinimal(result.features, 1);
        Test.assertIsDefined('selected feature', result.feature);
        const name = result.feature.fieldInfo.NAME;
        const population = result.feature.fieldInfo.POPULATION;
        Test.assertIsDefined('NAME field', name);
        Test.assertIsDefined('POPULATION field', population);
        Test.assertIsEqual(name.value, 'Quebec');
        Test.assertIsEqual(String(population.value), '641568');

        test.addStep('Verifying the rendered city name and population...');
        const nameRow = result.rows.find((row) => row.label === name.alias);
        const populationRow = result.rows.find((row) => row.label === population.alias);
        Test.assertIsDefined('rendered city name', nameRow);
        Test.assertIsDefined('rendered population', populationRow);
        Test.assertIsEqual(nameRow.value, 'Quebec');
        Test.assertIsEqual(populationRow.value, '641568');
      },
      (test) => {
        // Clear the layer from the map and assert it was removed
        if (rootLayerPath) this.removeLayerConfigAndAssert(test, rootLayerPath);
      }
    );
  }

  /**
   * Tests that clearing all highlights removes highlighted features from the store.
   *
   * @returns A promise resolving when the test completes
   */
  testClearAllHighlights(): Promise<Test<TestDetailsHighlights>> {
    let rootLayerPath: string | undefined;

    return this.test(
      `Test Clear all highlights across multiple layers...`,
      async (test) => {
        // Add the Commemorative layer
        await this.addLayerCommemorativeViaGeocore(test, {
          onLayerPath: (rootPath): void => {
            rootLayerPath = rootPath;
          },
        });

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
        await this.toggleAppbarTabDetails(test, false);

        // Keep track of the store state
        const highlighted2After = getStoreMapHighlightedFeatures(this.getMapId());

        // Reshowing the details panel which will re-add the highlight
        await this.toggleAppbarTabDetails(test, true);

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
        // Clear the layer from the map and assert it was removed
        if (rootLayerPath) this.removeLayerConfigAndAssert(test, rootLayerPath);
      }
    );
  }

  /**
   * Tests that zoom-to-feature keeps the feature visible next to an open app-bar panel.
   * Restores the pre-test map extent during finalization, even if fixture removal fails.
   *
   * @returns A promise resolving when the test completes
   */
  testZoomToFeatureWithPanelOffset(): Promise<Test<TestZoomWithPanelOffset>> {
    const initialExtent = this.getMapViewer().getView().calculateExtent();
    let rootLayerPath: string | undefined;

    return this.test(
      `Test Zoom to feature keeps the feature out of the open details panel...`,
      async (test) => {
        // Add the GeoJson Polygons layer
        const gvLayer = await this.addLayerGeoJSONWithMetadataPolygons(test, {
          onLayerPath: (rootPath): void => {
            rootLayerPath = rootPath;
          },
        });

        // Get the layer and query the coordinate to get features
        const features = await this.queryAtCoordinateRetrieveResultsForLayer(test, gvLayer, GVAbstractTester.ONTARIO_CENTER_LONLAT);

        const feature = features?.[0];
        if (!feature?.extent) return { features };

        // Make sure the details panel is open over the map and settled
        await this.toggleAppbarTabDetails(test, true);
        await DomHelper.waitForReactIdle();

        // Compute the padding like the Details zoom button does
        test.addStep('Computing the panel-aware fit padding...');
        const mapSize = this.getControllersRegistry().mapController.getMapSize();
        const padding = DomHelper.Map.getAppBarPanelFitPadding(this.getMapId(), 'details', mapSize);

        // Zoom to the feature with the computed padding
        test.addStep('Zooming to feature extent with the panel-aware padding...');
        await this.getControllersRegistry().layerController.zoomToExtentRestrictedAndHighlight(
          gvLayer.getLayerPath(),
          feature,
          feature.extent,
          GVAbstractTester.USE_ZOOM_ANIMATION,
          { padding }
        );

        // Locate the feature center on screen
        const pixel = this.getMapViewer().map.getPixelFromCoordinate(getCenter(feature.extent));

        // Return the test execution results
        return {
          features,
          zoom: {
            basePaddingLeft: DomHelper.Map.getDefaultFitPadding()[3],
            basePaddingRight: DomHelper.Map.getDefaultFitPadding()[1],
            paddingLeft: padding[3],
            paddingRight: padding[1],
            mapWidth: mapSize?.[0],
            hasNavBar: !!DomHelper.getNavBar(this.getMapId()),
            centerPixelX: pixel ? pixel[0] : undefined,
          },
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
        if (result.zoom.hasNavBar) {
          test.addStep('Verifying the right padding includes the navigation bar overlap...');
          Test.assertIsEqual(result.zoom.paddingRight > result.zoom.basePaddingRight, true);
        }

        // Verify the feature center is outside the area covered by the panel and the map controls
        test.addStep('Verifying the feature center is in the part of the map not covered by the panel or the map controls...');
        Test.assertIsDefined('centerPixelX', result.zoom.centerPixelX);
        Test.assertIsDefined('mapWidth', result.zoom.mapWidth);
        Test.assertIsEqual(result.zoom.centerPixelX >= result.zoom.paddingLeft, true);
        Test.assertIsEqual(result.zoom.centerPixelX <= result.zoom.mapWidth - result.zoom.paddingRight, true);
      },
      async (test) => {
ddddd
        try {
          // Clear the layer from the map and assert it was removed
          if (rootLayerPath) this.removeLayerConfigAndAssert(test, rootLayerPath);
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
   * @returns A promise resolving when the test completes
   */
  testZoomToResultsGroupExtent(): Promise<Test<TestZoomToResultsGroupExtent>> {
    const initialExtent = this.getMapViewer().getView().calculateExtent();
    let rootLayerPath: string | undefined;
    let cleanupLookup: (() => void) | undefined;
    return this.test(
      'Test Zoom to all results for a polygon fixture layer...',
      async (test) => {
        const layer = await this.addLayerGeoJSONWithMetadataPolygons(test, {
          onLayerPath: (rootPath): void => {
            rootLayerPath = rootPath;
          },
        });
        const layerPath = layer.getLayerPath();

        const { layerController, mapController } = this.getControllersRegistry();
        const view = this.getMapViewer().getView();
        const fitOptions = GVAbstractTester.USE_ZOOM_ANIMATION ? {} : { duration: 0 };

        // Get a real result to build the group results from
        const features = await this.queryAtCoordinateRetrieveResultsForLayer(test, layer, GVAbstractTester.ONTARIO_CENTER_LONLAT);
        const polygon = features?.[0];
        if (!polygon?.extent) return { features };
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
          features,
          zoom: {
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
          },
        };
      },
      (test, result) => {
        test.addStep('Verifying the queried feature and group zoom observations...');
        Test.assertIsDefined('features', result.features);
        Test.assertIsArrayLengthMinimal(result.features, 1);
        Test.assertIsDefined('polygon.extent', result.features[0].extent);
        Test.assertIsDefined('zoom', result.zoom);
        const { zoom } = result;

        test.addStep('Verifying the five distinct points are all in view...');
        Test.assertIsEqual(zoom.distinctPointsInView, true);

        test.addStep('Verifying coincident points do not zoom closer than the group bound...');
        Test.assertIsDefined('groupMinResolution', zoom.groupMinResolution);
        Test.assertIsDefined('coincidentResolution', zoom.coincidentResolution);
        Test.assertIsEqual(zoom.coincidentResolution >= zoom.groupMinResolution * 0.999, true);

        test.addStep('Verifying a tiny extent does not zoom closer than the group bound...');
        Test.assertIsDefined('tinyResolution', zoom.tinyResolution);
        Test.assertIsEqual(zoom.tinyResolution >= zoom.groupMinResolution * 0.999, true);

        test.addStep('Verifying the polygon and line are both in view...');
        Test.assertIsEqual(zoom.polygonAndLineInView, true);

        test.addStep('Verifying missing/invalid extents are ignored...');
        Test.assertIsEqual(zoom.invalidIgnoredInView, true);

        test.addStep('Verifying a group without valid extent throws NoExtentError...');
        Test.assertIsEqual(zoom.allInvalidThrowsNoExtent, true);

        test.addStep('Verifying results without geometry have no group extent...');
        Test.assertIsUndefined('noGeometryGroupExtent', zoom.noGeometryGroupExtent);

        test.addStep('Verifying a stale group does not move the map...');
        Test.assertIsEqual(zoom.staleZoomed, false);
        Test.assertIsEqual(zoom.staleCenterUnchanged, true);

        test.addStep('Verifying lookup-only results can zoom and interrupted fits do not report completion...');
        Test.assertIsEqual(zoom.missingExtentsAvailable, true);
        Test.assertIsEqual(zoom.lookedUpZoomed, true);
        Test.assertIsEqual(zoom.lookedUpExtentInView, true);
        Test.assertIsEqual(zoom.cancelledZoomed, false);
      },
      async (test) => {
        try {
          try {
            cleanupLookup?.();
          } finally {
            // Clear the layer from the map and assert it was removed
            if (rootLayerPath) this.removeLayerConfigAndAssert(test, rootLayerPath);
          }
        } finally {
          test.addStep('Restoring the pre-test map extent...');
          await this.getControllersRegistry().mapController.zoomToExtent(initialExtent, false);
        }
      }
    );
  }

  /**
   * Tests that zoom to feature does not zoom closer than the feature bound for a point, and that bringing another
   * feature into view (Details previous/next after a zoom to feature) only pans for a small feature, zooms out for
   * a feature larger than the view, and never zooms back in.
   *
   * @returns A promise resolving when the test completes
   */
  testZoomToFeatureBoundAndPan(): Promise<Test<TestZoomToFeatureBoundAndPan>> {
    const initialExtent = this.getMapViewer().getView().calculateExtent();
    let rootLayerPath: string | undefined;
    return this.test(
      'Test Zoom to point feature bound and pan to next feature on a polygon fixture layer...',
      async (test) => {
        const layer = await this.addLayerGeoJSONWithMetadataPolygons(test, {
          onLayerPath: (rootPath): void => {
            rootLayerPath = rootPath;
          },
        });
        const layerPath = layer.getLayerPath();

        const { layerController, mapController } = this.getControllersRegistry();
        const view = this.getMapViewer().getView();
        const fitOptions = GVAbstractTester.USE_ZOOM_ANIMATION ? {} : { duration: 0 };

        // Get a real result to build a point feature from
        const features = await this.queryAtCoordinateRetrieveResultsForLayer(test, layer, GVAbstractTester.ONTARIO_CENTER_LONLAT);
        const feature = features?.[0];
        if (!feature?.extent) return { features };
        const [cx, cy] = getCenter(feature.extent);
        const pointExtent: Extent = [cx, cy, cx, cy];

        // Zoom far out, then zoom to a point feature
        test.addStep('Zooming to a point feature from a zoomed out view...');
        await mapController.zoomToExtent([cx - 3000000, cy - 3000000, cx + 3000000, cy + 3000000], false, fitOptions);
        await layerController.zoomToExtentRestrictedAndHighlight(
          layerPath,
          { ...feature, extent: pointExtent },
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
          features,
          zoom: {
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
          },
        };
      },
      (test, result) => {
        test.addStep('Verifying the queried feature and feature zoom observations...');
        Test.assertIsDefined('features', result.features);
        Test.assertIsArrayLengthMinimal(result.features, 1);
        Test.assertIsDefined('feature.extent', result.features[0].extent);
        Test.assertIsDefined('zoom', result.zoom);
        const { zoom } = result;

        test.addStep('Verifying the point zoom stops at the feature bound...');
        Test.assertIsDefined('featureMinResolution', zoom.featureMinResolution);
        Test.assertIsDefined('pointZoomResolution', zoom.pointZoomResolution);
        Test.assertIsEqual(zoom.pointZoomResolution >= zoom.featureMinResolution * 0.999, true);

        test.addStep('Verifying the zoom to feature hides the click marker...');
        Test.assertIsUndefined('clickMarkerAfterZoom', zoom.clickMarkerAfterZoom);

        test.addStep('Verifying a small feature only pans (keeps the resolution) and is in view...');
        Test.assertIsDefined('panResolution', zoom.panResolution);
        Test.assertIsEqual(Math.abs(zoom.panResolution - zoom.pointZoomResolution) <= zoom.pointZoomResolution * 0.001, true);
        Test.assertIsEqual(zoom.nextFeatureInView, true);

        test.addStep('Verifying a large feature zooms out and is fully in view...');
        Test.assertIsDefined('largeResolution', zoom.largeResolution);
        Test.assertIsEqual(zoom.largeResolution > zoom.panResolution, true);
        Test.assertIsEqual(zoom.largeFeatureInView, true);

        test.addStep('Verifying going back to a small feature does not zoom in...');
        Test.assertIsDefined('backToSmallResolution', zoom.backToSmallResolution);
        Test.assertIsEqual(Math.abs(zoom.backToSmallResolution - zoom.largeResolution) <= zoom.largeResolution * 0.001, true);

        test.addStep('Verifying when a pan already shows the zoom to feature view (zoom button would have no effect)...');
        Test.assertIsEqual(zoom.panIsFeatureZoomView, true);
        Test.assertIsEqual(zoom.largeIsFeatureZoomView, true);
        Test.assertIsEqual(zoom.backToSmallIsFeatureZoomView, false);
      },
      async (test) => {
ddd
        try {
          // Clear the layer from the map and assert it was removed
          if (rootLayerPath) this.removeLayerConfigAndAssert(test, rootLayerPath);
        } finally {
          test.addStep('Restoring the pre-test map extent...');
          await this.getControllersRegistry().mapController.zoomToExtent(initialExtent, false);
        }
      }
    );
  }

  /**
   * Tests that the Details zoom to all results button becomes unavailable (aria-disabled) after its zoom, and
   * available again once the map view changes.
   *
   * @returns A promise resolving when the test completes
   */
  testZoomToResultsButtonUnavailableUntilViewChanges(): Promise<Test<TestZoomButtonState>> {
    const BUTTON_SELECTOR = 'button[aria-label="Zoom to all results for this layer"]';
    const initialExtent = this.getMapViewer().getView().calculateExtent();
    let rootLayerPath: string | undefined;

    return this.test(
      'Test Zoom to all results button is unavailable until the map view changes on a polygon fixture layer...',
      async (test) => {
        const fixtureLayer = await this.addLayerGeoJSONWithMetadataPolygons(test, {
          onLayerPath: (rootPath): void => {
            rootLayerPath = rootPath;
          },
        });
        const layerPath = fixtureLayer.getLayerPath();
        const root = DomHelper.getGVRootElement(this.getMapId());

        // Vector queries use a pixel hit tolerance, so the result count depends on the view: go back to the initial view
        // (previous tests zoomed in) where the click returns several results for the layer
        test.addStep('Zooming to the initial extent...');
        await this.getControllersRegistry().mapController.zoomToInitialExtent(GVAbstractTester.USE_ZOOM_ANIMATION);

        // Click the map and select the layer, so the Details panel shows its results
        await this.getControllersRegistry().layerController.waitForLayersLoaded();
        await this.simulateMapClickWaitForBatchedQuery(test, GVAbstractTester.ONTARIO_CENTER_LONLAT);
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
      },
      async (test) => {
ddd
        try {
          // Clear the layer from the map and assert it was removed
          if (rootLayerPath) this.removeLayerConfigAndAssert(test, rootLayerPath);
        } finally {
          test.addStep('Restoring the pre-test map extent...');
          await this.getControllersRegistry().mapController.zoomToExtent(initialExtent, false);
        }
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
    let polygonRootLayerPath: string | undefined;
    let projectRootLayerPath: string | undefined;
    return this.test(
      'Test details layer selection persistence across map clicks',
      async (test) => {
        // Create the candidates here rather than relying on layers configured by the host page.
        polygons = await this.addLayerGeoJSONWithMetadataPolygons(test, {
          onLayerPath: (rootPath): void => {
            polygonRootLayerPath = rootPath;
          },
        });

        projects = await this.addLayerEsriFeatureTopProjects(test, {
          onLayerPath: (rootPath): void => {
            projectRootLayerPath = rootPath;
          },
        });

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
ddd
        try {
          // Clear the layer from the map and assert it was removed
          if (projectRootLayerPath) this.removeLayerConfigAndAssert(test, projectRootLayerPath);
        } finally {
          // Clear the layer from the map and assert it was removed
          if (polygonRootLayerPath) this.removeLayerConfigAndAssert(test, polygonRootLayerPath);
        }
      }
    );
  }
  /**
   * Waits for fresh coordinate data and captures the corresponding rendered content.
   *
   * @param coordinate - The longitude/latitude expected from the most recent map click
   * @param toggle - The coordinate information toggle whose state is observed
   * @returns The settled store values and rendered coordinate information
   */
  async #readCoordinateInfo(coordinate: number[], toggle: HTMLInputElement): Promise<CoordinateInfoObservation> {
    const mapId = this.getMapId();
    await whenThisThen(
      () => {
        const feature = getStoreDetailsLayerDataArrayFeature(mapId);
        return (
          getStoreDetailsQueryStatus(mapId, LAYER_PATH_COORDINATE_INFO) === 'processed' &&
          feature?.fieldInfo.latitude?.value === coordinate[1].toFixed(6) &&
          feature?.fieldInfo.longitude?.value === coordinate[0].toFixed(6)
        );
      },
      GVAbstractTester.UI_STATE_TIMEOUT_MS,
      50
    );
    this.getControllersRegistry().detailsController.setSelectedLayerPath(LAYER_PATH_COORDINATE_INFO);
    await DomHelper.waitForReactIdle();
    const content = await whenThisThen(() => DomHelper.Details.getCoordinateInfoContent(mapId), GVAbstractTester.UI_STATE_TIMEOUT_MS, 50);
    if (!content) throw new Error('Coordinate information content was not rendered');
    return {
      checked: toggle.checked,
      ariaChecked: toggle.getAttribute('aria-checked') ?? undefined,
      enabled: getStoreDetailsCoordinateInfoEnabled(mapId),
      feature: getStoreDetailsLayerDataArrayFeature(mapId),
      text: content.textContent ?? '',
    };
  }
}

// #region TYPES AND INTERFACES

/** Coordinate information captured after a settled lookup and React render. */
type CoordinateInfoObservation = {
  checked: boolean;
  ariaChecked: string | undefined;
  enabled: boolean;
  feature: TypeFeatureInfoEntry | undefined;
  text: string;
};

/** Observations for coordinate information toggle and map-click updates. */
type CoordinateInfoToggleResult = {
  disabledBeforeClick: boolean;
  enabledAfterClick: boolean;
  hiddenBeforeEnable: boolean;
  first: CoordinateInfoObservation;
  second: CoordinateInfoObservation;
  uncheckedAfterDisable: boolean;
  hiddenAfterDisable: boolean;
  featureRemoved: boolean;
  hiddenAfterDisabledClick: boolean;
  featureAbsentAfterDisabledClick: boolean;
  reenabled: CoordinateInfoObservation;
};

/** Captured Details feature and its rendered field rows. */
type DetailsFeatureTableResult = {
  layerPath: string;
  selectedLayerPath: string;
  features: TypeFeatureInfoEntry[] | undefined;
  feature: TypeFeatureInfoEntry | undefined;
  dateValue: unknown;
  imageValue: unknown;
  expectedDate: string | undefined;
  layerDateFormat: TypeDisplayDateFormat | undefined;
  rows: { label: string | undefined; value: string | undefined; images: (string | undefined)[] }[];
};

/** Captured WMS feature and its rendered field rows. */
type WmsFeatureTableResult = {
  layerPath: string;
  selectedLayerPath: string;
  features: TypeFeatureInfoEntry[] | undefined;
  feature: TypeFeatureInfoEntry | undefined;
  rows: { label: string | undefined; value: string | undefined }[];
};

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
  /** Queried features, retained when zoom prerequisites are missing. */
  features: TypeFeatureInfoEntry[] | undefined;
  /** Zoom observations, available only when the queried feature has an extent. */
  zoom?: {
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
};

/** Result type for the testZoomToResultsGroupExtent test execution. */
export type TestZoomToResultsGroupExtent = {
  /** Queried features, retained when zoom prerequisites are missing. */
  features: TypeFeatureInfoEntry[] | undefined;
  /** Zoom observations, available only when the queried feature has an extent. */
  zoom?: {
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
};

/** Result type for the testZoomToFeatureWithPanelOffset test execution. */
export type TestZoomWithPanelOffset = {
  /** Features returned by the fixture query, including missing results for assertion diagnostics. */
  features: TypeFeatureInfoEntry[] | undefined;
  /** Zoom observations, available only when the queried feature has an extent. */
  zoom?: {
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
