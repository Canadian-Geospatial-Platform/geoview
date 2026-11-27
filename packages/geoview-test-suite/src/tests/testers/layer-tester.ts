import { TestConstants } from './constants';
import { Test } from '../core/test';
import { GVAbstractTester } from './abstract-gv-tester';
import { TestError, TestSkippedError } from '../core/exceptions';
import type { GeoJSONObject } from 'ol/format/GeoJSON';
import Point from 'ol/geom/Point';
import { Projection as OLProjection } from 'ol/proj';
import { Projection } from 'geoview-core/geo/utils/projection';
import { GVGeoJSON } from 'geoview-core/geo/layer/gv-layers/vector/gv-geojson';
import { AbstractGVVector } from 'geoview-core/geo/layer/gv-layers/vector/abstract-gv-vector';
import { GVVectorSource } from 'geoview-core/geo/layer/source/vector-source';
import { getStoreMapHoverFeatureInfo, getStoreMapStateJson } from 'geoview-core/core/stores/states/map-state';
import { getStoreDataTableFeaturesByPath } from 'geoview-core/core/stores/states/data-table-state';
import type { TypeHoverFeatureInfo } from 'geoview-core/core/stores/states/feature-info-state';
import type {
  TypeFeatureInfoResult,
  codedValueType,
  TypeFeatureInfoEntry,
  Extent,
  TypeMapFeaturesInstance,
} from 'geoview-core/api/types/map-schema-types';
import type { TypeLegendItem } from 'geoview-core/core/components/layers/types';
import {
  getStoreLayerLegendLayerByPath,
  getStoreLayerIsHiddenOnMap,
  getStoreLayerInVisibleRangeLayerPaths,
  getStoreLayerOrderedLayerPaths,
  getStoreLayerVisible,
} from 'geoview-core/core/stores/states/layer-state';
import { getStoreUIActiveAppBarTab } from 'geoview-core/core/stores/states/ui-state';
import { generateId, whenThisThen } from 'geoview-core/core/utils/utilities';
import { DomHelper } from 'geoview-core/core/utils/dom-helper';
import { CONTAINER_TYPE } from 'geoview-core/core/utils/constant';
import { LayerStatusErrorError } from 'geoview-core/core/exceptions/layer-exceptions';
import type { LayerNoCapabilitiesError } from 'geoview-core/core/exceptions/layer-exceptions';
import { LayerServiceMetadataUnableToFetchError } from 'geoview-core/core/exceptions/layer-exceptions';
import { LayerEntryNotSupportingProjectionError } from 'geoview-core/core/exceptions/layer-entry-config-exceptions';
import { NoBoundsError } from 'geoview-core/core/exceptions/geoview-exceptions';
import type { AbstractBaseGVLayer } from 'geoview-core/geo/layer/gv-layers/abstract-base-layer';
import { AbstractGVLayer } from 'geoview-core/geo/layer/gv-layers/abstract-gv-layer';
import type { GVEsriDynamic } from 'geoview-core/geo/layer/gv-layers/raster/gv-esri-dynamic';
import { GVGroupLayer } from 'geoview-core/geo/layer/gv-layers/gv-group-layer';
import { GVWMS } from 'geoview-core/geo/layer/gv-layers/raster/gv-wms';
import { EsriDynamic } from 'geoview-core/geo/layer/geoview-layers/raster/esri-dynamic';
import { EsriFeature } from 'geoview-core/geo/layer/geoview-layers/vector/esri-feature';
import { EsriImage } from 'geoview-core/geo/layer/geoview-layers/raster/esri-image';
import { WMS } from 'geoview-core/geo/layer/geoview-layers/raster/wms';
import { WMTS } from 'geoview-core/geo/layer/geoview-layers/raster/wmts';
import { XYZTiles } from 'geoview-core/geo/layer/geoview-layers/raster/xyz-tiles';
import { VectorTiles } from 'geoview-core/geo/layer/geoview-layers/raster/vector-tiles';
import { WFS } from 'geoview-core/geo/layer/geoview-layers/vector/wfs';
import { GeoJSON } from 'geoview-core/geo/layer/geoview-layers/vector/geojson';
import { GeoTIFF } from 'geoview-core/geo/layer/geoview-layers/raster/geotiff';
import { CSV } from 'geoview-core/geo/layer/geoview-layers/vector/csv';
import { OgcFeature } from 'geoview-core/geo/layer/geoview-layers/vector/ogc-feature';
import { WKB } from 'geoview-core/geo/layer/geoview-layers/vector/wkb';
import { KML } from 'geoview-core/geo/layer/geoview-layers/vector/kml';
import type { TypeGeoviewLayerConfig } from 'geoview-core/api/types/layer-schema-types';
import { AbstractBaseLayerEntryConfig } from 'geoview-core/api/config/validation-classes/abstract-base-layer-entry-config';

/**
 * Main Layer testing class.
 */
export class LayerTester extends GVAbstractTester {
  /**
   * Returns the name of the Tester.
   *
   * @returns The name of the Tester
   */
  override getName(): string {
    return 'LayerTester';
  }

  // #region ESRI DYNAMIC

  /**
   * Tests adding an Esri Dynamic Historical Flood Events layer on the map.
   *
   * @returns A promise that resolves when the test completes
   */
  testAddEsriDynamicHistoFloodEvents(): Promise<Test<AbstractBaseGVLayer>> {
    let rootLayerPath: string | undefined;
    let configLayerPath: string | undefined;
    let registeredLayerName: string | undefined;
    // Test
    return this.test(
      `Test Adding Esri Dynamic Histo Flood Events on map...`,
      (test) => {
        // Add the layer and return the added layer instance
        return this.addLayerEsriDynamicHistoFloodEvents(test, {
          onLayerPath: (rootPath, confLayerPath): void => {
            rootLayerPath = rootPath;
            configLayerPath = confLayerPath;
          },
          onConfig: (config): Promise<void> => {
            // Keep track of the layer name at the time the config has been registered
            registeredLayerName = config.getLayerNameCascade();
            return Promise.resolve();
          },
        });
      },
      (test, result) => {
        // Perform assertions
        test.addStep('Verifying the registered configuration callback completed for the loaded layer...');
        Test.assertIsEqual(result.getGeoviewLayerId(), rootLayerPath);
        Test.assertIsEqual(result.getLayerPath(), configLayerPath);

        test.addStep(`Verifying the layer name at config creation default to layer path, as it's unread from metadata yet...`);
        Test.assertIsEqual(registeredLayerName, rootLayerPath);

        test.addStep('Verifying the layer name of the loaded layer is the name from the metadata...');
        Test.assertIsEqual(result.getLayerName(), 'Historical Flood Events');

        // Redirect to helper to check if the layer exists
        LayerTester.#assertCheckLayerExistsInStore(
          test,
          this.getMapId(),
          result.getLayerPath(),
          result.getLayerName(),
          undefined,
          TestConstants.HISTORICAL_FLOOD_ICON_LIST
        );
      },
      (test) => {
        // Clear the layer from the map and assert it was removed
        if (rootLayerPath) this.removeLayerConfigAndAssert(test, rootLayerPath);
      }
    );
  }

  /**
   * Tests a case-sensitive ESRI export service through its GeoCore record and actual image loader.
   *
   * @returns A promise that resolves with the loaded layer, export parameters, and requested/returned image dimensions
   */
  testAddEsriDynamicCaseSensitiveExport(): Promise<Test<AbstractBaseGVLayer>> {
    let rootLayerPath: string | undefined;

    return this.test(
      'Test GeoCore ESRI Dynamic export with case-sensitive bbox and size parameters...',
      (test) => {
        // Add the layer using the UUID
        return this.addLayerEsriDynamicCaseSensitiveExportViaGeocore(test, {
          onLayerPath: (rootPath): void => {
            rootLayerPath = rootPath;
          },
        });
      },
      (test, result) => {
        // At this point, the layer successfully loaded
        LayerTester.#assertCheckLayerExistsInStore(test, this.getMapId(), result.getLayerPath(), result.getLayerName());
      },
      (test) => {
        // Clear the layer from the map and assert it was removed
        if (rootLayerPath) this.removeLayerConfigAndAssert(test, rootLayerPath);
      }
    );
  }

  /**
   * Tests the behavior of initializing an Esri Dynamic layer configuration using an invalid metadata URL.
   *
   * This test verifies that when an Esri Dynamic layer configuration is initialized with an invalid or unreachable
   * metadata URL, the initialization process fails as expected and throws a
   * {@link LayerServiceMetadataUnableToFetchError}.
   *
   * @returns A promise that resolves with the test result
   */
  testAddEsriDynamicBadUrl(): Promise<Test<LayerServiceMetadataUnableToFetchError>> {
    // Create a random geoview layer id
    const gvLayerId = generateId();
    const layerUrl = TestConstants.BAD_URL;
    const layerPath = `${gvLayerId}/${TestConstants.HISTORICAL_FLOOD_LAYER_ID}`;
    const gvLayerName = 'Esri Dynamic Histo Flood Events';

    // Test
    return this.testError(
      `Test Adding Esri Dynamic with bad url...`,
      LayerServiceMetadataUnableToFetchError,
      async (test) => {
        // Create the config
        test.addStep('Creating the GeoView Layer Configuration...');
        const gvConfig = EsriDynamic.createGeoviewLayerConfig(gvLayerId, gvLayerName, layerUrl, false, [
          { id: TestConstants.HISTORICAL_FLOOD_LAYER_ID },
        ]);

        // Redirect to helper to add the layer to the map and wait
        await this.addLayerOnMap(test, gvConfig, layerPath);
      },
      undefined,
      (test) => {
        // Redirect to helper to clean up and assert
        this.removeLayerConfigAndAssert(test, layerPath);
      }
    );
  }

  // #endregion ESRI DYNAMIC

  // #region ESRI FEATURE

  /**
   * Tests adding an Esri Feature Forest Industry layer on the map.
   *
   * @returns A promise that resolves when the test completes
   */
  testAddEsriFeatureForestIndustry(): Promise<Test<AbstractBaseGVLayer>> {
    let rootLayerPath: string | undefined;
    // Test
    return this.test(
      `Test Adding Esri Feature Forest Industry on map...`,
      (test) => {
        // Add the fixture and wait for its selected layer to be ready
        return this.addLayerEsriFeatureForestIndustry(test, {
          onLayerPath: (rootPath): void => {
            rootLayerPath = rootPath;
          },
        });
      },
      (test, result) => {
        // Perform assertions
        // Redirect to helper to check if the layer exists
        LayerTester.#assertCheckLayerExistsInStore(
          test,
          this.getMapId(),
          result.getLayerPath(),
          result.getLayerName(),
          undefined,
          TestConstants.FOREST_INDUSTRY_ICON_LIST
        );
      },
      (test) => {
        // Clear the layer from the map and assert it was removed
        if (rootLayerPath) this.removeLayerConfigAndAssert(test, rootLayerPath);
      }
    );
  }

  /**
   * Tests the behavior of initializing an Esri Feature layer configuration using an invalid metadata URL.
   *
   * This test verifies that when an Esri Feature layer configuration is initialized with an invalid or unreachable
   * metadata URL, the initialization process fails as expected and throws a
   * {@link LayerServiceMetadataUnableToFetchError}.
   *
   * @returns A promise that resolves with the test result
   */
  testAddEsriFeatureBadUrl(): Promise<Test<LayerServiceMetadataUnableToFetchError>> {
    // Create a random geoview layer id
    const gvLayerId = generateId();
    const layerUrl = TestConstants.BAD_URL;
    const layerPath = `${gvLayerId}/${TestConstants.FOREST_INDUSTRY_LAYER_ID}`;
    const gvLayerName = 'Esri Feature Forest Industry';

    // Test
    return this.testError(
      `Test Adding Esri Feature with bad url...`,
      LayerServiceMetadataUnableToFetchError,
      async (test) => {
        // Create the config
        test.addStep('Creating the GeoView Layer Configuration...');
        const gvConfig = EsriFeature.createGeoviewLayerConfig(gvLayerId, gvLayerName, layerUrl, false, [
          { id: TestConstants.FOREST_INDUSTRY_LAYER_ID },
        ]);

        // Redirect to helper to add the layer to the map and wait
        await this.addLayerOnMap(test, gvConfig, layerPath);
      },
      undefined,
      (test) => {
        // Redirect to helper to clean up and assert
        this.removeLayerConfigAndAssert(test, layerPath);
      }
    );
  }

  /**
   * Tests adding an Esri Feature service that contains some invalid geometries.
   *
   * @returns A promise that resolves when the test completes
   */
  testAddEsriFeatureInvalidGeometry(): Promise<Test<AbstractBaseGVLayer>> {
    let rootLayerPath: string | undefined;
    // Test
    return this.test(
      `Test Adding 'Yukon Low head' on map...`,
      (test) => {
        // Add the fixture and wait for its selected layer to be ready
        return this.addLayerEsriFeatureInvalidGeometry(test, {
          onLayerPath: (rootPath): void => {
            rootLayerPath = rootPath;
          },
        });
      },
      (test, result) => {
        // Perform assertions
        // Redirect to helper to check if the layer exists
        LayerTester.#assertCheckLayerExistsInStore(
          test,
          this.getMapId(),
          result.getLayerPath(),
          result.getLayerName(),
          undefined,
          undefined
        );
      },
      (test) => {
        // Clear the layer from the map and assert it was removed
        if (rootLayerPath) this.removeLayerConfigAndAssert(test, rootLayerPath);
      }
    );
  }

  // #endregion ESRI FEATURE

  // #region ESRI IMAGE

  /**
   * Tests adding an EsriImage with Elevation layer on the map.
   *
   * @returns A promise that resolves when the test completes
   */
  testAddEsriImageWithElevation(): Promise<Test<AbstractBaseGVLayer>> {
    let rootLayerPath: string | undefined;
    // Test
    return this.test(
      `Test Adding Esri Image Elevation on map...`,
      (test) => {
        // Add the fixture and wait for its selected layer to be ready
        return this.addLayerEsriImageWithElevation(test, {
          onLayerPath: (rootPath): void => {
            rootLayerPath = rootPath;
          },
        });
      },
      (test, result) => {
        // Perform assertions
        // Redirect to helper to check if the layer exists
        LayerTester.#assertCheckLayerExistsInStore(test, this.getMapId(), result.getLayerPath(), result.getLayerName());
      },
      (test) => {
        // Clear the layer from the map and assert it was removed
        if (rootLayerPath) this.removeLayerConfigAndAssert(test, rootLayerPath);
      }
    );
  }

  /**
   * Tests adding an EsriImage with USA layer on the map.
   *
   * @returns A promise that resolves when the test completes
   */
  testAddEsriImageWithUSA(): Promise<Test<AbstractBaseGVLayer>> {
    let rootLayerPath: string | undefined;
    // Test
    return this.test(
      `Test Adding Esri Image USA on map...`,
      (test) => {
        // Add the fixture and wait for its selected layer to be ready
        return this.addLayerEsriImageWithUSA(test, {
          onLayerPath: (rootPath): void => {
            rootLayerPath = rootPath;
          },
        });
      },
      (test, result) => {
        // Perform assertions
        const group = result.getParentRoot();
        Test.assertIsDefined('group', group);
        const layerPathCities = `${group.getLayerPath()}/${TestConstants.IMAGE_SERVER_USA_LAYER_ID_CITIES}`;

        // Redirect to helper to check if the layer exists
        LayerTester.#assertCheckLayerExistsInStore(
          test,
          this.getMapId(),
          layerPathCities,
          this.getControllersRegistry().layerController.getGeoviewLayer(layerPathCities).getLayerName()
        );
        LayerTester.#assertCheckLayerExistsInStore(test, this.getMapId(), result.getLayerPath(), result.getLayerName());
      },
      (test) => {
        // Clear the layer from the map and assert it was removed
        if (rootLayerPath) this.removeLayerConfigAndAssert(test, rootLayerPath);
      }
    );
  }

  /**
   * Tests the behavior of initializing an Esri Image layer configuration using an invalid metadata URL.
   *
   * This test verifies that when an Esri Image layer configuration is initialized with an invalid or unreachable
   * metadata URL, the initialization process fails as expected and throws a
   * {@link LayerServiceMetadataUnableToFetchError}.
   *
   * @returns A promise that resolves with the test result
   */
  testAddEsriImageBadUrl(): Promise<Test<LayerServiceMetadataUnableToFetchError>> {
    // Create a random geoview layer id
    const gvLayerId = generateId();
    const layerUrl = `${TestConstants.BAD_URL}/${TestConstants.IMAGE_SERVER_ELEVATION_LAYER_ID}/ImageServer`; // Has to be formatted like this, because we're guessing the layer id with url parsing!
    const layerPath = `${gvLayerId}/${TestConstants.IMAGE_SERVER_ELEVATION_LAYER_ID}`;
    const gvLayerName = 'Esri Image Elevation';

    // Test
    return this.testError(
      `Test Adding Esri Image with bad url...`,
      LayerServiceMetadataUnableToFetchError,
      async (test) => {
        // Creating the configuration
        test.addStep('Creating the GeoView Layer Configuration...');

        // Create the config
        const gvConfig = EsriImage.createGeoviewLayerConfigSimple(gvLayerId, gvLayerName, layerUrl, false);

        // Redirect to helper to add the layer to the map and wait
        await this.addLayerOnMap(test, gvConfig, layerPath);

        // Wait for the layer to be loaded
        await this.waitLayerAtLayerPath(test, layerPath);
      },
      undefined,
      (test) => {
        // Redirect to helper to clean up and assert
        this.removeLayerConfigAndAssert(test, layerPath);
      }
    );
  }

  // #endregion ESRI IMAGE

  // #region WMS

  /**
   * Tests adding a WMS Layer from OWS Terrestris on the map.
   *
   * @returns A promise that resolves when the test completes
   */
  testAddWMSLayerWithOWSTerrestris(): Promise<Test<AbstractBaseGVLayer>> {
    let rootLayerPath: string | undefined;
    // Test
    return this.test(
      `Test Adding WMS Terrestris on map...`,
      (test) => {
        // Add the fixture and wait for its selected layer to be ready
        return this.addLayerWMSWithOWSTerrestris(test, {
          onLayerPath: (rootPath): void => {
            rootLayerPath = rootPath;
          },
        });
      },
      (test, result) => {
        // Perform assertions
        // Redirect to helper to check if the layer exists
        LayerTester.#assertCheckLayerExistsInStore(
          test,
          this.getMapId(),
          result.getLayerPath(),
          result.getLayerName(),
          TestConstants.OWS_TERRESTRIS_ICON_IMAGE
        );
      },
      (test) => {
        // Redirect to helper to clean up and assert
        if (rootLayerPath) this.removeLayerConfigAndAssert(test, rootLayerPath);
      }
    );
  }

  /**
   * Tests adding a WMS Layer with Datacube MSI on the map.
   *
   * @returns A promise that resolves when the test completes
   */
  testAddWMSLayerWithDatacubeMSI(): Promise<Test<AbstractBaseGVLayer>> {
    let rootLayerPath: string | undefined;
    // Test
    return this.test(
      `Test Adding WMS Datacube MSI on map...`,
      (test) => {
        // Add the fixture and wait for its selected layer to be ready
        return this.addLayerWMSWithDatacubeMSI(test, {
          onLayerPath: (rootPath): void => {
            rootLayerPath = rootPath;
          },
        });
      },
      (test, result) => {
        // Perform assertions
        // Redirect to helper to check if the layer exists
        LayerTester.#assertCheckLayerExistsInStore(
          test,
          this.getMapId(),
          result.getLayerPath(),
          result.getLayerName(),
          TestConstants.DATACUBE_MSI_ICON_IMAGE
        );
      },
      (test) => {
        // Clear the layer from the map and assert it was removed
        if (rootLayerPath) this.removeLayerConfigAndAssert(test, rootLayerPath);
      }
    );
  }

  /**
   * Tests adding a WMS Layer with Datacube Ring of Fire on the map.
   *
   * @returns A promise that resolves when the test completes
   */
  testAddWMSLayerWithDatacubeRingOfFire(): Promise<Test<AbstractBaseGVLayer>> {
    let rootLayerPath: string | undefined;
    // Test
    return this.test(
      `Test Adding WMS Datacube Ring of Fire XML Halifax on map...`,
      (test) => {
        // Add the fixture and wait for its selected layer to be ready
        return this.addLayerWMSWithDatacubeRingOfFire(test, {
          onLayerPath: (rootPath): void => {
            rootLayerPath = rootPath;
          },
        });
      },
      (test, result) => {
        // Perform assertions
        // Redirect to helper to check if the layer exists
        LayerTester.#assertCheckLayerExistsInStore(
          test,
          this.getMapId(),
          result.getLayerPath(),
          result.getLayerName(),
          TestConstants.DATACUBE_RING_FIRE_HALIFAX_ICON_IMAGE
        );
      },
      (test) => {
        // Clear the layer from the map and assert it was removed
        if (rootLayerPath) this.removeLayerConfigAndAssert(test, rootLayerPath);
      }
    );
  }

  /**
   * Tests that adding the WMS landcover group creates a group-dimension layer.
   *
   * The test verifies that the selected group expands into WMS child layers and that the first child is marked as
   * having been added through a group with a group time dimension.
   *
   * @param isRunningOnVPN Indicates whether the test is running on a VPN
   * @returns A promise that resolves when the test completes
   */
  testAddWMSLayerLandcoverGroupDimension(isRunningOnVPN: boolean): Promise<Test<AbstractBaseGVLayer>> {
    let rootLayerPath: string | undefined;
    // Test
    return this.test(
      `Test Adding WMS Landcover pointing to a group layer with a group time dimension...`,
      (test) => {
        // If not running on VPN, skip it
        if (!isRunningOnVPN) {
          throw new TestSkippedError('Not running on VPN');
        }

        // Add the fixture and wait for its selected layer to be ready
        return this.addLayerWMSLandcoverGroupDimensions(test, {
          onLayerPath: (rootPath): void => {
            rootLayerPath = rootPath;
          },
        });
      },
      (test, result) => {
        // Perform assertions
        // Redirect to helper to check if the layer exists
        LayerTester.#assertCheckLayerExistsInStore(test, this.getMapId(), result.getLayerPath(), result.getLayerName());

        // Validate the layer is a group layer
        Test.assertIsInstance(result, GVGroupLayer);

        // Validate the group layer has at least 1 child
        Test.assertIsArrayLengthMinimal(result.getLayers(), 1);

        // Get the first child
        const firstChild = result.getLayers()[0];

        // Validate the first child is a WMS layer
        Test.assertIsInstance(firstChild, GVWMS);

        // Validate the layer has the 'was added as group' flag set
        test.addStep('Validating the layer is flagged as it was added via a group and time dimension is a group dimension');
        Test.assertIsEqual(firstChild.getLayerConfig().getAddedViaAGroup(), true);
        Test.assertIsEqual(firstChild.getLayerConfig().getTimeDimension()?.isGroupDimension, true);
      },
      (test) => {
        // If the test was running
        if (isRunningOnVPN) {
          // Clear the layer from the map and assert it was removed
          if (rootLayerPath) this.removeLayerConfigAndAssert(test, rootLayerPath);
        }
      }
    );
  }

  /**
   * Tests that adding the WMS landcover sub-layers directly does not create a group dimension.
   *
   * The test verifies that directly selected sub-layers remain regular WMS layers and are not marked as having been
   * added through a group.
   *
   * @param isRunningOnVPN Indicates whether the test is running on a VPN
   * @returns A promise that resolves when the test completes
   */
  testAddWMSLayerLandcoverGroupDimensionNegative(isRunningOnVPN: boolean): Promise<Test<AbstractBaseGVLayer>> {
    let rootLayerPath: string | undefined;
    // Test
    return this.test(
      `Test Adding WMS Landcover pointing to sub-layers directly, negating the group time dimension...`,
      (test) => {
        // If not running on VPN, skip it
        if (!isRunningOnVPN) {
          throw new TestSkippedError('Not running on VPN');
        }

        // Add the fixture and wait for its selected layer to be ready
        return this.addLayerWMSLandcoverSubLayers(test, {
          onLayerPath: (rootPath): void => {
            rootLayerPath = rootPath;
          },
        });
      },
      (test, result) => {
        // Perform assertions
        // Redirect to helper to check if the layer exists
        LayerTester.#assertCheckLayerExistsInStore(test, this.getMapId(), result.getLayerPath(), result.getLayerName());

        // Validate the layer is a group layer
        Test.assertIsInstance(result, GVGroupLayer);

        // Validate the group layer has at least 1 child
        Test.assertIsArrayLengthMinimal(result.getLayers(), 1);

        // Get the first child
        const firstChild = result.getLayers()[0];

        // Validate the first child is a WMS layer
        Test.assertIsInstance(firstChild, GVWMS);

        // Validate the layer has the 'was added as group' flag set
        test.addStep('Validating the layer is NOT flagged as it was added via a group and time dimension is NOT a group dimension');
        Test.assertIsEqual(firstChild.getLayerConfig().getAddedViaAGroup(), false);
        Test.assertIsEqual(firstChild.getLayerConfig().getTimeDimension()?.isGroupDimension, false);
      },
      (test) => {
        // If the test was running
        if (isRunningOnVPN) {
          // Clear the layer from the map and assert it was removed
          if (rootLayerPath) this.removeLayerConfigAndAssert(test, rootLayerPath);
        }
      }
    );
  }

  /**
   * Tests adding a WMS layer from the Nonna service (CORS blocked, requires proxy fallback).
   *
   * @returns A promise that resolves when the test completes
   */
  testAddWMSNonna(): Promise<Test<AbstractBaseGVLayer>> {
    let rootLayerPath: string | undefined;
    // Test
    return this.test(
      `Test Adding WMS Nonna on map (proxy fallback)...`,
      (test) => {
        // Add the fixture and wait for its selected layer to be ready
        return this.addLayerWMSNonna(test, {
          onLayerPath: (rootPath): void => {
            rootLayerPath = rootPath;
          },
        });
      },
      (test, result) => {
        // Perform assertions
        LayerTester.#assertCheckLayerExistsInStore(test, this.getMapId(), result.getLayerPath(), result.getLayerName());
      },
      (test) => {
        // Clear the layer from the map and assert it was removed
        if (rootLayerPath) this.removeLayerConfigAndAssert(test, rootLayerPath);
      }
    );
  }

  /**
   * Tests the behavior of initializing a WMS layer configuration using an invalid metadata URL.
   *
   * This test verifies that when a WMS layer configuration is initialized with an invalid or unreachable
   * metadata URL, the initialization process fails as expected and throws a
   * {@link LayerNoCapabilitiesError}.
   *
   * @returns A promise that resolves with the test result
   */
  testAddWMSBadUrl(): Promise<Test<LayerNoCapabilitiesError>> {
    // GV: In the case of a WMS, since a proxy is used when the url fails, and that proxy always returns a 200 response (with an internal error inside)
    // GV: We can't really test the LayerServiceMetadataUnableToFetchError error exception.

    // Create a random geoview layer id
    const gvLayerId = generateId();
    const layerUrl = TestConstants.BAD_URL;
    const layerPath = `${gvLayerId}/${TestConstants.DATACUBE_MSI_LAYER_NAME_MSI_OR_MORE}`;
    const gvLayerName = 'Datacube MSI';

    // Test
    return this.testError(
      `Test Adding WMS with bad url...`,
      LayerServiceMetadataUnableToFetchError,
      async (test) => {
        // Create the config
        test.addStep('Creating the GeoView Layer Configuration...');
        const gvConfig = WMS.createGeoviewLayerConfig(
          gvLayerId,
          gvLayerName,
          layerUrl,
          undefined,
          false,
          [{ id: TestConstants.DATACUBE_MSI_LAYER_NAME_MSI_OR_MORE }],
          false
        );

        // Redirect to helper to add the layer to the map and wait
        await this.addLayerOnMap(test, gvConfig, layerPath);

        // Wait for the layer to be loaded
        await this.waitLayerAtLayerPath(test, layerPath);
      },
      undefined,
      (test) => {
        // Clear the layer from the map and assert it was removed
        this.removeLayerConfigAndAssert(test, layerPath);
      }
    );
  }

  /**
   * Tests adding a WMS layer whose service nests groups sharing the same `<Name>` at different levels (issue #3521).
   *
   * The `canimage_en` service nests a `canimage` group inside a `canimage` group. Adding it by the top group id
   * `canimage` must build unique deepened paths (`.../canimage/canimage/<leaf>`) and load without infinite-looping.
   *
   * @returns A promise that resolves when the test completes
   */
  testAddWMSDuplicateGroupNames(): Promise<Test<AbstractBaseGVLayer>> {
    let rootLayerPath: string | undefined;
    // Test
    return this.test(
      `Test Adding CanImage WMS with duplicate nested group names on map...`,
      (test) => {
        // Add the fixture and wait for its selected layer to be ready
        return this.addLayerWMSDuplicateGroupNames(test, {
          onLayerPath: (rootPath): void => {
            rootLayerPath = rootPath;
          },
        });
      },
      (test, result) => {
        const groupPath = `${result.getGeoviewLayerId()}/${TestConstants.CANIMAGE_WMS_GROUP_ID}`;
        const duplicateGroupPath = `${groupPath}/${TestConstants.CANIMAGE_WMS_GROUP_ID}`;
        // Perform assertions
        test.addStep('Verifying the duplicate nested group path was created...');

        // The duplicate nested group path must exist (the core of issue #3521)
        Test.assertArrayIncludes(this.getControllersRegistry().layerController.getGeoviewLayerPaths(), duplicateGroupPath);

        // The deeply-nested leaf must exist and have loaded
        LayerTester.#assertCheckLayerExistsInStore(test, this.getMapId(), result.getLayerPath(), result.getLayerName());
      },
      (test) => {
        // Clear the layer from the map and assert it was removed
        if (rootLayerPath) this.removeLayerConfigAndAssert(test, rootLayerPath);
      }
    );
  }

  /**
   * Tests WMS metadata group names when ZPEGT is selected alongside a sibling layer.
   *
   * @returns A promise that resolves when the test completes
   */
  testAddWMSZpegtGroupWithSiblingLayer(): Promise<Test<AbstractBaseGVLayer>> {
    return this.#testAddWMSZpegtGroup(
      'Test WMS ZPEGT metadata names with a sibling layer...',
      'Transports',
      true,
      'Zone potentiellement exposée aux glissements de terrain (ZPEGT)',
      'Transports'
    );
  }

  /**
   * Tests the configured GeoView layer name when ZPEGT is the only selected WMS group.
   *
   * @returns A promise that resolves when the test completes
   */
  testAddWMSZpegtGroupWithGeoviewLayerName(): Promise<Test<AbstractBaseGVLayer>> {
    return this.#testAddWMSZpegtGroup(
      'Test WMS ZPEGT group name with a configured GeoView layer name...',
      'Transports',
      false,
      'Transports'
    );
  }

  /**
   * Tests the metadata-derived GeoView layer name when no configured name is provided for the ZPEGT group.
   *
   * @returns A promise that resolves when the test completes
   */
  testAddWMSZpegtGroupWithoutGeoviewLayerName(): Promise<Test<AbstractBaseGVLayer>> {
    return this.#testAddWMSZpegtGroup(
      'Test WMS ZPEGT group name without a configured GeoView layer name...',
      undefined,
      false,
      'Zone potentiellement exposée aux glissements de terrain (ZPEGT)'
    );
  }

  // #endregion WMS

  // #region WMTS

  /**
   * Tests adding a WMTS layer with World Timezones on the map.
   *
   * @returns A promise that resolves when the test completes
   */
  testAddWMTSWorldTimezones(): Promise<Test<AbstractBaseGVLayer>> {
    let rootLayerPath: string | undefined;
    // Test
    return this.test(
      `Test Adding WMTS World Timezones on map...`,
      (test) => {
        // Add the fixture and wait for its selected layer to be ready
        return this.addLayerWMTSWorldTimezones(test, {
          onLayerPath: (rootPath): void => {
            rootLayerPath = rootPath;
          },
        });
      },
      (test, result) => {
        // Perform assertions
        LayerTester.#assertCheckLayerExistsInStore(test, this.getMapId(), result.getLayerPath(), result.getLayerName());
      },
      (test) => {
        // Clear the layer from the map and assert it was removed
        if (rootLayerPath) this.removeLayerConfigAndAssert(test, rootLayerPath);
      }
    );
  }

  /**
   * Tests the behavior of initializing a WMTS layer configuration using an invalid metadata URL.
   *
   * This test verifies that when a WMTS layer configuration is initialized with an invalid or unreachable
   * metadata URL, the initialization process fails as expected and throws a
   * {@link LayerServiceMetadataUnableToFetchError}.
   *
   * @returns A promise that resolves with the test result
   */
  testAddWMTSBadUrl(): Promise<Test<LayerServiceMetadataUnableToFetchError>> {
    // Create a random geoview layer id
    const gvLayerId = generateId();
    const layerUrl = TestConstants.BAD_URL;
    const layerPath = `${gvLayerId}/${TestConstants.WORLD_TIMEZONES_WMTS_URL_LAYER_ID}`;
    const gvLayerName = 'World Timezones WMTS';

    // Test
    return this.testError(
      `Test Adding WMTS with bad url...`,
      LayerServiceMetadataUnableToFetchError,
      async (test) => {
        // Create the config
        test.addStep('Creating the GeoView Layer Configuration...');
        const gvConfig = WMTS.createGeoviewLayerConfig(gvLayerId, gvLayerName, layerUrl, false, [
          {
            id: TestConstants.WORLD_TIMEZONES_WMTS_URL_LAYER_ID,
            tileMatrixSet: TestConstants.WORLD_TIMEZONES_WMTS_URL_MATRIX_SET_ID,
          },
        ]);

        // Redirect to helper to add the layer to the map and wait
        await this.addLayerOnMap(test, gvConfig, layerPath);

        // Wait for the layer to be loaded
        await this.waitLayerAtLayerPath(test, layerPath);
      },
      undefined,
      (test) => {
        // Redirect to helper to clean up and assert
        this.removeLayerConfigAndAssert(test, layerPath);
      }
    );
  }

  // #endregion WMTS

  // #region XYZ TILES

  /**
   * Tests adding an XYZ Tiles layer with OpenStreetMap on the map.
   *
   * @returns A promise that resolves when the test completes
   */
  testAddXYZTilesOSM(): Promise<Test<AbstractBaseGVLayer>> {
    let rootLayerPath: string | undefined;
    // Test
    return this.test(
      `Test Adding XYZ Tiles OSM on map...`,
      (test) => {
        // Add the fixture and wait for its selected layer to be ready
        return this.addLayerXYZTilesOSM(test, {
          onLayerPath: (rootPath): void => {
            rootLayerPath = rootPath;
          },
        });
      },
      (test, result) => {
        // Perform assertions
        LayerTester.#assertCheckLayerExistsInStore(test, this.getMapId(), result.getLayerPath(), result.getLayerName());
      },
      (test) => {
        // Clear the layer from the map and assert it was removed
        if (rootLayerPath) this.removeLayerConfigAndAssert(test, rootLayerPath);
      }
    );
  }

  /**
   * Tests the behavior of initializing an XYZ Tiles layer configuration using an invalid metadata URL.
   *
   * This test verifies that when an XYZ Tiles layer configuration is initialized with an invalid or unreachable
   * metadata URL, the initialization process fails as expected and throws a
   * {@link LayerServiceMetadataUnableToFetchError}.
   *
   * @returns A promise that resolves with the test result
   */
  testAddXYZTilesBadUrl(): Promise<Test<LayerServiceMetadataUnableToFetchError>> {
    // Create a random geoview layer id
    const gvLayerId = generateId();
    const layerUrl = TestConstants.BAD_URL;
    const layerPath = `${gvLayerId}/${TestConstants.XYZ_TILES_OSM_LAYER_ID}`;
    const gvLayerName = TestConstants.XYZ_TILES_OSM_LAYER_ID;

    // Test
    return this.testError(
      `Test Adding XYZ Tiles with bad url...`,
      LayerServiceMetadataUnableToFetchError,
      async (test) => {
        // Create the config
        test.addStep('Creating the GeoView Layer Configuration...');
        const gvConfig = XYZTiles.createGeoviewLayerConfig(gvLayerId, gvLayerName, layerUrl, false, [
          { id: TestConstants.XYZ_TILES_OSM_LAYER_ID },
        ]);

        // Redirect to helper to add the layer to the map and wait
        await this.addLayerOnMap(test, gvConfig, layerPath);

        // Wait for the layer to be loaded
        await this.waitLayerAtLayerPath(test, layerPath);
      },
      undefined,
      (test) => {
        // Redirect to helper to clean up and assert
        this.removeLayerConfigAndAssert(test, layerPath);
      }
    );
  }

  // #endregion XYZ TILES

  // #region VECTOR TILES

  /**
   * Tests adding a Vector Tiles layer with CBMT 3978 on the map.
   *
   * @returns A promise that resolves when the test completes
   */
  testAddVectorTilesCBMT(): Promise<Test<AbstractBaseGVLayer | LayerEntryNotSupportingProjectionError>> {
    let rootLayerPath: string | undefined;
    // If the map projection is 3978
    if (this.getMapViewer().getProjectionNumber() === 3978) {
      // Test a true positive
      return this.test<AbstractBaseGVLayer>(
        `Test Adding Vector Tiles CBMT 3978 on map...`,
        (test) => {
          // Add the fixture and wait for its selected layer to be ready
          return this.addLayerVectorTilesCBMT(test, {
            onLayerPath: (rootPath): void => {
              rootLayerPath = rootPath;
            },
          });
        },
        (test, result) => {
          // Perform assertions
          LayerTester.#assertCheckLayerExistsInStore(test, this.getMapId(), result.getLayerPath(), result.getLayerName());
        },
        (test) => {
          // Clear the layer from the map and assert it was removed
          if (rootLayerPath) this.removeLayerConfigAndAssert(test, rootLayerPath);
        }
      );
    }

    // Create a random geoview layer id
    const gvLayerId = generateId();
    const layerUrl = TestConstants.VECTOR_TILES_CBMT_3978_URL;
    const layerPath = `${gvLayerId}/${TestConstants.VECTOR_TILES_CBMT_3978_LAYER_NAME}`;
    const gvLayerName = TestConstants.VECTOR_TILES_CBMT_3978_LAYER_NAME;

    // Create the config
    const gvConfig = VectorTiles.createGeoviewLayerConfig(gvLayerId, gvLayerName, layerUrl, false, [
      { id: TestConstants.VECTOR_TILES_CBMT_3978_LAYER_NAME },
    ]);

    // Test a true negative, it's supposed to crash
    return this.testError(
      `Test Adding Vector Tiles CBMT 3978 on map with wrong projection...`,
      LayerEntryNotSupportingProjectionError,
      async (test) => {
        // Redirect to helper to add the layer to the map and wait
        await this.addLayerOnMap(test, gvConfig, layerPath);

        // Wait for the layer to be loaded
        await this.waitLayerAtLayerPath(test, layerPath);
      },
      undefined,
      (test) => {
        // Clear the layer from the map and assert it was removed
        this.removeLayerConfigAndAssert(test, layerPath);
      }
    );
  }

  /**
   * Tests the behavior of initializing a Vector Tiles layer configuration using an invalid metadata URL.
   *
   * This test verifies that when a Vector Tiles layer configuration is initialized with an invalid or unreachable
   * metadata URL, the initialization process fails as expected and throws a
   * {@link LayerServiceMetadataUnableToFetchError}.
   *
   * @returns A promise that resolves with the test result
   */
  testAddVectorTilesBadUrl(): Promise<Test<LayerServiceMetadataUnableToFetchError>> {
    // Create a random geoview layer id
    const gvLayerId = generateId();
    const layerUrl = TestConstants.BAD_URL;
    const layerPath = `${gvLayerId}/${TestConstants.VECTOR_TILES_CBMT_3978_LAYER_NAME}`;
    const gvLayerName = TestConstants.VECTOR_TILES_CBMT_3978_LAYER_NAME;

    // Test
    return this.testError(
      `Test Adding Vector Tiles with bad url...`,
      LayerServiceMetadataUnableToFetchError,
      async (test) => {
        // Create the config
        test.addStep('Creating the GeoView Layer Configuration...');
        const gvConfig = VectorTiles.createGeoviewLayerConfig(gvLayerId, gvLayerName, layerUrl, false, [
          { id: TestConstants.VECTOR_TILES_CBMT_3978_LAYER_NAME },
        ]);

        // Redirect to helper to add the layer to the map and wait
        await this.addLayerOnMap(test, gvConfig, layerPath);

        // Wait for the layer to be loaded
        await this.waitLayerAtLayerPath(test, layerPath);
      },
      undefined,
      (test) => {
        // Clear the layer from the map and assert it was removed
        this.removeLayerConfigAndAssert(test, layerPath);
      }
    );
  }

  // #endregion VECTOR TILES

  // #region WFS

  /**
   * Tests adding a WFS with Geomet Current Conditions layer on the map.
   *
   * @returns A promise that resolves when the test completes
   */
  testAddWFSLayerWithWithGeometCurrentConditions(): Promise<Test<AbstractBaseGVLayer>> {
    let rootLayerPath: string | undefined;
    // Test
    return this.test(
      `Test Adding WFS with Geomet Current Conditions layer on map...`,
      (test) => {
        // Add the fixture and wait for its selected layer to be ready
        return this.addLayerWFSGeometCurrentConditions(test, {
          onLayerPath: (rootPath): void => {
            rootLayerPath = rootPath;
          },
        });
      },
      (test, result) => {
        // Perform assertions
        // Redirect to helper to check if the layer exists
        // GV Current Conditions isn't returning a legend for us anymore, sending checkIconsList = undefined now
        LayerTester.#assertCheckLayerExistsInStore(
          test,
          this.getMapId(),
          result.getLayerPath(),
          result.getLayerName(),
          undefined,
          undefined
        );
      },
      (test) => {
        // Clear the layer from the map and assert it was removed
        if (rootLayerPath) this.removeLayerConfigAndAssert(test, rootLayerPath);
      }
    );
  }

  /**
   * Tests the behavior of initializing a WFS layer configuration using an invalid metadata URL.
   *
   * This test verifies that when a WFS layer configuration is initialized with an invalid or unreachable
   * metadata URL, the initialization process fails as expected and throws a
   * {@link LayerServiceMetadataUnableToFetchError}.
   *
   * @returns A promise that resolves with the test result
   */
  testAddWFSBadUrl(): Promise<Test<LayerServiceMetadataUnableToFetchError>> {
    // Create a random geoview layer id
    const gvLayerId = generateId();
    const layerUrl = TestConstants.BAD_URL;
    const layerPath = `${gvLayerId}/${TestConstants.GEOMET_URL_CURRENT_COND_LAYER_ID}`;
    const gvLayerName = 'Current Conditions';

    // Test
    return this.testError(
      `Test Adding WFS with bad url...`,
      LayerServiceMetadataUnableToFetchError,
      async (test) => {
        // Create the config
        test.addStep('Creating the GeoView Layer Configuration...');
        const gvConfig = WFS.createGeoviewLayerConfig(gvLayerId, gvLayerName, layerUrl, false, 'all', [
          { id: TestConstants.GEOMET_URL_CURRENT_COND_LAYER_ID },
        ]);

        // Redirect to helper to add the layer to the map and wait
        await this.addLayerOnMap(test, gvConfig, layerPath);

        // Wait for the layer to be loaded
        await this.waitLayerAtLayerPath(test, layerPath);
      },
      undefined,
      (test) => {
        // Clear the layer from the map and assert it was removed
        this.removeLayerConfigAndAssert(test, layerPath);
      }
    );
  }

  /**
   * Tests the behavior of initializing a WFS layer configuration using a valid URL but without a GetCapabilities response.
   *
   * This test verifies that when a WFS layer configuration is initialized and the initialization process fails as expected and throws a
   * {@link LayerNoCapabilitiesError}.
   *
   * @returns A promise that resolves with the test result
   */
  testAddWFSOkayUrlNoCap(): Promise<Test<LayerNoCapabilitiesError>> {
    // Create a random geoview layer id
    const gvLayerId = generateId();
    const layerUrl = TestConstants.FAKE_URL_ALWAYS_RETURNING_RESPONSE_INSTEAD_OF_NETWORK_ERROR;
    const layerPath = `${gvLayerId}/${TestConstants.GEOMET_URL_CURRENT_COND_LAYER_ID}`;
    const gvLayerName = 'Current Conditions';

    // Test
    return this.testError(
      `Test Adding WFS with okay url no capabilities...`,
      LayerServiceMetadataUnableToFetchError,
      async (test) => {
        // Create the config
        test.addStep('Creating the GeoView Layer Configuration...');
        const gvConfig = WFS.createGeoviewLayerConfig(gvLayerId, gvLayerName, layerUrl, false, 'all', [
          { id: TestConstants.GEOMET_URL_CURRENT_COND_LAYER_ID },
        ]);

        // Redirect to helper to add the layer to the map and wait
        await this.addLayerOnMap(test, gvConfig, layerPath);

        // Wait for the layer to be loaded
        await this.waitLayerAtLayerPath(test, layerPath);
      },
      undefined,
      (test) => {
        // Redirect to helper to clean up and assert
        this.removeLayerConfigAndAssert(test, layerPath);
      }
    );
  }

  // #endregion WFS

  // #region GEOJSON

  /**
   * Tests adding a GeoJSON with Polygons layer on the map.
   *
   * @returns A promise that resolves when the test completes
   */
  testAddGeoJSONWithMetadataPolygons(): Promise<Test<AbstractBaseGVLayer>> {
    let rootLayerPath: string | undefined;
    // Test
    return this.test(
      `Test Adding GeoJSON with Metadata layer on map...`,
      (test) => {
        // Add the fixture and wait for its selected layer to be ready
        return this.addLayerGeoJSONWithMetadataPolygons(test, {
          onLayerPath: (rootPath): void => {
            rootLayerPath = rootPath;
          },
        });
      },
      (test, result) => {
        // Perform assertions
        // Redirect to helper to check if the layer exists
        LayerTester.#assertCheckLayerExistsInStore(
          test,
          this.getMapId(),
          result.getLayerPath(),
          result.getLayerName(),
          undefined,
          TestConstants.GEOJSON_POLYGONS_ICON_LIST
        );
      },
      (test) => {
        // Clear the layer from the map and assert it was removed
        if (rootLayerPath) this.removeLayerConfigAndAssert(test, rootLayerPath);
      }
    );
  }

  /**
   * Tests adding a GeoJSON GeometryCollection layer on the map.
   *
   * @returns A promise that resolves when the test completes
   */
  testAddGeoJSONWithGeometryCollection(): Promise<Test<AbstractBaseGVLayer>> {
    let rootLayerPath: string | undefined;
    // Test
    return this.test(
      `Test Adding GeoJSON GeometryCollection layer on map...`,
      (test) => {
        // Add the fixture and wait for its selected layer to be ready
        return this.addLayerGeoJSONWithGeometryCollection(test, {
          onLayerPath: (rootPath): void => {
            rootLayerPath = rootPath;
          },
        });
      },
      (test, result) => {
        // Verify the layer exists and legend information was created
        LayerTester.#assertCheckLayerExistsInStore(test, this.getMapId(), result.getLayerPath(), result.getLayerName());
      },
      (test) => {
        // Clear the layer from the map and assert it was removed
        if (rootLayerPath) this.removeLayerConfigAndAssert(test, rootLayerPath);
      }
    );
  }

  /**
   * Tests the behavior of initializing a GeoJSON layer configuration using an invalid metadata URL.
   *
   * This test verifies that when a GeoJSON layer configuration is initialized with an invalid or unreachable
   * metadata URL, the initialization process fails as expected and throws a
   * {@link LayerStatusErrorError}.
   *
   * @returns A promise that resolves with the test result
   */
  testAddGeoJSONBadUrl(): Promise<Test<LayerStatusErrorError>> {
    // GV: In the case of a GeoJSON, since we don't validate the url until we try to fetch the data,
    // GV: we have to wait until the layer gets on the map and throws an error, which will since the layer can't reach the data.
    // Create a random geoview layer id
    const gvLayerId = generateId();
    const layerUrl = TestConstants.BAD_URL;
    const layerPath = `${gvLayerId}/${TestConstants.GEOJSON_POLYGONS}`;
    const gvLayerName = 'Polygons JSON';

    // Test
    return this.testError(
      `Test Adding GeoJSON with bad url...`,
      LayerStatusErrorError,
      async (test) => {
        // Create the config
        test.addStep('Creating the GeoView Layer Configuration...');
        const gvConfig = GeoJSON.createGeoviewLayerConfig(gvLayerId, gvLayerName, layerUrl, false, [
          { id: TestConstants.GEOJSON_POLYGONS },
        ]);

        // Redirect to helper to add the layer to the map and wait
        await this.addLayerOnMap(test, gvConfig, layerPath);

        // Find the layer and wait until its ready
        await this.waitLayerAtLayerPath(test, layerPath);
      },
      undefined,
      (test) => {
        // Clear the layer from the map and assert it was removed
        this.removeLayerConfigAndAssert(test, layerPath);
      }
    );
  }

  // #endregion GEOJSON

  // #region GEOTIFF

  /**
   * Tests adding a GeoTIFF layer on the map.
   *
   * @returns A promise resolving when the test completes
   */
  testAddGeotiffLayerWithDatacubeVegetation(): Promise<Test<AbstractBaseGVLayer>> {
    let rootLayerPath: string | undefined;
    // Test
    return this.test(
      `Test Adding GeoTIFF Datacube Vegetation on map...`,
      (test) => {
        // Add the fixture and wait for its selected layer to be ready
        return this.addLayerGeoTIFFWithDatacubeVegetation(test, {
          onLayerPath: (rootPath): void => {
            rootLayerPath = rootPath;
          },
        });
      },
      (test, result) => {
        // Perform assertions
        // Redirect to helper to check if the layer exists
        return LayerTester.#assertCheckLayerExistsInStore(test, this.getMapId(), result.getLayerPath(), result.getLayerName());
      },
      (test) => {
        // Clear the layer from the map and assert it was removed
        if (rootLayerPath) this.removeLayerConfigAndAssert(test, rootLayerPath);
      }
    );
  }

  /**
   * Tests the behavior of initializing a GeoTIFF layer configuration using an invalid metadata URL.
   *
   * This test verifies that when a GeoTIFF layer configuration is initialized with an invalid or unreachable
   * metadata URL, the initialization process fails as expected and throws a
   * {@link LayerStatusErrorError}.
   *
   * @returns A promise that resolves with the test result
   */
  testAddGeoTIFFWithBadUrl(): Promise<Test<LayerStatusErrorError>> {
    // GV: In the case of a GeoTIFF, since we don't validate the url until we try to fetch the data,
    // GV: we have to wait until the layer gets on the map and throws an error, which will since the layer can't reach the data.
    // Create a random geoview layer id
    const gvLayerId = generateId();
    const layerUrl = TestConstants.BAD_URL;
    const layerPath = `${gvLayerId}/${TestConstants.GEOTIFF_VEGETATION_FILE}`;
    const gvLayerName = 'GeoTIFF Vegetation';

    // Test
    return this.testError(
      `Test Adding GeoTIFF with bad url...`,
      LayerStatusErrorError,
      async (test) => {
        // Create the config
        test.addStep('Creating the GeoView Layer Configuration...');
        const gvConfig = GeoTIFF.createGeoviewLayerConfig(gvLayerId, gvLayerName, layerUrl, false, [
          { id: TestConstants.GEOTIFF_VEGETATION_FILE },
        ]);

        // Redirect to helper to add the layer to the map and wait
        await this.addLayerOnMap(test, gvConfig, layerPath);

        // Find the layer and wait until its ready
        await this.waitLayerAtLayerPath(test, layerPath);
      },
      undefined,
      (test) => {
        // Clear the layer from the map and assert it was removed
        this.removeLayerConfigAndAssert(test, layerPath);
      }
    );
  }

  // #endregion GEOTIFF

  // #region CSV

  /**
   * Tests adding a CSV with Station List layer on the map.
   *
   * @returns A promise that resolves when the test completes
   */
  testAddCSVWithStationList(): Promise<Test<AbstractBaseGVLayer>> {
    let rootLayerPath: string | undefined;
    // Test
    return this.test(
      `Test Adding a CSV with Station List layer on map...`,
      (test) => {
        // Add the fixture and wait for its selected layer to be ready
        return this.addLayerCSVWithStationList(test, {
          onLayerPath: (rootPath): void => {
            rootLayerPath = rootPath;
          },
        });
      },
      (test, result) => {
        // Perform assertions
        // Redirect to helper to check if the layer exists
        LayerTester.#assertCheckLayerExistsInStore(
          test,
          this.getMapId(),
          result.getLayerPath(),
          result.getLayerName(),
          undefined,
          TestConstants.CSV_STATION_ICON_LIST
        );
      },
      (test) => {
        // Clear the layer from the map and assert it was removed
        if (rootLayerPath) this.removeLayerConfigAndAssert(test, rootLayerPath);
      }
    );
  }

  /**
   * Tests the behavior of initializing a CSV layer configuration using an invalid metadata URL.
   *
   * This test verifies that when a CSV layer configuration is initialized with an invalid or unreachable
   * metadata URL, the initialization process fails as expected and throws a
   * {@link LayerStatusErrorError}.
   *
   * @returns A promise that resolves with the test result
   */
  testAddCSVWithBadUrl(): Promise<Test<LayerStatusErrorError>> {
    // GV: In the case of a CSV, since we don't validate the url until we try to fetch the data,
    // GV: we have to wait until the layer gets on the map and throws an error, which will since the layer can't reach the data.
    // Create a random geoview layer id
    const gvLayerId = generateId();
    const layerUrl = TestConstants.BAD_URL;
    const layerPath = `${gvLayerId}/${TestConstants.CSV_STATION_LIST_FILE}`;
    const gvLayerName = 'Station List CSV';

    // Test
    return this.testError(
      `Test Adding CSV with bad url...`,
      LayerStatusErrorError,
      async (test) => {
        // Create the config
        test.addStep('Creating the GeoView Layer Configuration...');
        const gvConfig = CSV.createGeoviewLayerConfig(gvLayerId, gvLayerName, layerUrl, false, [
          { id: TestConstants.CSV_STATION_LIST_FILE },
        ]);

        // Redirect to helper to add the layer to the map and wait
        await this.addLayerOnMap(test, gvConfig, layerPath);

        // Find the layer and wait until its ready
        await this.waitLayerAtLayerPath(test, layerPath);
      },
      undefined,
      (test) => {
        // Clear the layer from the map and assert it was removed
        this.removeLayerConfigAndAssert(test, layerPath);
      }
    );
  }

  // #endregion CSV

  // #region OGC FEATURE

  /**
   * Tests adding an OGC Feature layer with Pygeoapi on the map.
   *
   * @returns A promise that resolves when the test completes
   */
  testAddOGCFeatureLakes(): Promise<Test<AbstractBaseGVLayer>> {
    let rootLayerPath: string | undefined;
    // Test
    return this.test(
      `Test Adding an OGC Feature with Pygeoapi layer on map...`,
      (test) => {
        // Add the fixture and wait for its selected layer to be ready
        return this.addLayerOGCFeatureLakes(test, {
          onLayerPath: (rootPath): void => {
            rootLayerPath = rootPath;
          },
        });
      },
      (test, result) => {
        // Perform assertions
        // Redirect to helper to check if the layer exists
        LayerTester.#assertCheckLayerExistsInStore(
          test,
          this.getMapId(),
          result.getLayerPath(),
          result.getLayerName(),
          undefined,
          TestConstants.PYGEOAPI_B6RYUVAKK5_LAKES_ICON_LIST
        );
      },
      (test) => {
        // Clear the layer from the map and assert it was removed
        if (rootLayerPath) this.removeLayerConfigAndAssert(test, rootLayerPath);
      }
    );
  }

  /**
   * Tests the behavior of initializing an OGC Feature layer configuration using an invalid metadata URL.
   *
   * This test verifies that when an OGC Feature layer configuration is initialized with an invalid or unreachable
   * metadata URL, the initialization process fails as expected and throws a
   * {@link LayerServiceMetadataUnableToFetchError}.
   *
   * @returns A promise that resolves with the test result
   */
  testAddOGCFeatureWithBadUrl(): Promise<Test<LayerServiceMetadataUnableToFetchError>> {
    // Create a random geoview layer id
    const gvLayerId = generateId();
    const layerUrl = TestConstants.BAD_URL;
    const layerPath = `${gvLayerId}/${TestConstants.PYGEOAPI_B6RYUVAKK5_LAKES}`;
    const gvLayerName = TestConstants.PYGEOAPI_B6RYUVAKK5_LAKES;

    // Test
    return this.testError(
      `Test Adding OGC Feature with bad url...`,
      LayerServiceMetadataUnableToFetchError,
      async (test) => {
        // Create the config
        test.addStep('Creating the GeoView Layer Configuration...');
        const gvConfig = OgcFeature.createGeoviewLayerConfig(gvLayerId, gvLayerName, layerUrl, false, [
          { id: TestConstants.PYGEOAPI_B6RYUVAKK5_LAKES },
        ]);

        // Redirect to helper to add the layer to the map and wait
        await this.addLayerOnMap(test, gvConfig, layerPath);

        // Wait for the layer to be loaded
        await this.waitLayerAtLayerPath(test, layerPath);
      },
      undefined,
      (test) => {
        // Clear the layer from the map and assert it was removed
        this.removeLayerConfigAndAssert(test, layerPath);
      }
    );
  }

  // #endregion OGC Feature

  // #region WKB

  /**
   * Tests adding a WKB with South Africa on the map.
   *
   * @returns A promise that resolves when the test completes
   */
  testAddWKBWithSouthAfrica(): Promise<Test<AbstractBaseGVLayer>> {
    let rootLayerPath: string | undefined;
    // Test
    return this.test(
      `Test Adding a WKB with South Africa layer on map...`,
      (test) => {
        // Add the fixture and wait for its selected layer to be ready
        return this.addLayerWKBWithSouthAfrica(test, {
          onLayerPath: (rootPath): void => {
            rootLayerPath = rootPath;
          },
        });
      },
      (test, result) => {
        // Perform assertions
        // Redirect to helper to check if the layer exists
        LayerTester.#assertCheckLayerExistsInStore(test, this.getMapId(), result.getLayerPath(), result.getLayerName());
      },
      (test) => {
        // Clear the layer from the map and assert it was removed
        if (rootLayerPath) this.removeLayerConfigAndAssert(test, rootLayerPath);
      }
    );
  }

  /**
   * Tests the behavior of initializing a WKB layer configuration using an invalid metadata URL.
   *
   * This test verifies that when a WKB layer configuration is initialized with an invalid or unreachable
   * metadata URL, the initialization process fails as expected and throws a
   * {@link LayerStatusErrorError}.
   *
   * @returns A promise that resolves with the test result
   */
  testAddWKBWithBadUrl(): Promise<Test<LayerStatusErrorError>> {
    // GV: In the case of a WKB, since we don't validate the url until we try to fetch the data,
    // GV: we have to wait until the layer gets on the map and throws an error, which will since the layer can't reach the data.
    // Create a random geoview layer id
    const gvLayerId = generateId();
    const layerUrl = TestConstants.BAD_URL;
    const layerPath = `${gvLayerId}/${TestConstants.WKB_SOUTH_AFRICA}`;
    const gvLayerName = TestConstants.WKB_SOUTH_AFRICA;

    // Test
    return this.testError(
      `Test Adding WKB with bad url...`,
      LayerStatusErrorError,
      async (test) => {
        // Create the config
        test.addStep('Creating the GeoView Layer Configuration...');
        const gvConfig = WKB.createGeoviewLayerConfig(gvLayerId, gvLayerName, layerUrl, false, [{ id: TestConstants.WKB_SOUTH_AFRICA }]);

        // Redirect to helper to add the layer to the map and wait
        await this.addLayerOnMap(test, gvConfig, layerPath);

        // Wait for the layer to be loaded
        await this.waitLayerAtLayerPath(test, layerPath);
      },
      undefined,
      (test) => {
        // Clear the layer from the map and assert it was removed
        this.removeLayerConfigAndAssert(test, layerPath);
      }
    );
  }

  // #endregion WKB

  // #region KML

  /**
   * Tests adding a KML with Tornado on the map.
   *
   * @returns A promise that resolves when the test completes
   */
  testAddKMLWithTornado(): Promise<Test<AbstractBaseGVLayer>> {
    let rootLayerPath: string | undefined;
    // Test
    return this.test(
      `Test Adding a KML with Tornado layer on map...`,
      (test) => {
        // Add the fixture and wait for its selected layer to be ready
        return this.addLayerKMLWithTornado(test, {
          onLayerPath: (rootPath): void => {
            rootLayerPath = rootPath;
          },
        });
      },
      (test, result) => {
        // Perform assertions
        // Redirect to helper to check if the layer exists
        LayerTester.#assertCheckLayerExistsInStore(test, this.getMapId(), result.getLayerPath(), result.getLayerName());
      },
      (test) => {
        // Clear the layer from the map and assert it was removed
        if (rootLayerPath) this.removeLayerConfigAndAssert(test, rootLayerPath);
      }
    );
  }

  /**
   * Tests the behavior of initializing a KML layer configuration using an invalid metadata URL.
   *
   * This test verifies that when a KML layer configuration is initialized with an invalid or unreachable
   * metadata URL, the initialization process fails as expected and throws a
   * {@link LayerStatusErrorError}.
   *
   * @returns A promise that resolves with the test result
   */
  testAddKMLWithBadUrl(): Promise<Test<LayerStatusErrorError>> {
    // GV: In the case of a KML, since we don't validate the url until we try to fetch the data,
    // GV: we have to wait until the layer gets on the map and throws an error, which will since the layer can't reach the data.
    // Create a random geoview layer id
    const gvLayerId = generateId();
    const layerUrl = TestConstants.BAD_URL;
    const layerPath = `${gvLayerId}/${TestConstants.KML_TORNADO_FILE}`;
    const gvLayerName = TestConstants.KML_TORNADO_FILE;

    // Test
    return this.testError(
      `Test Adding KML with bad url...`,
      LayerStatusErrorError,
      async (test) => {
        // Create the config
        test.addStep('Creating the GeoView Layer Configuration...');
        const gvConfig = KML.createGeoviewLayerConfig(gvLayerId, gvLayerName, layerUrl, false, [{ id: TestConstants.KML_TORNADO_FILE }]);

        // Redirect to helper to add the layer to the map and wait
        await this.addLayerOnMap(test, gvConfig, layerPath);

        // Find the layer and wait until its ready
        await this.waitLayerAtLayerPath(test, layerPath);
      },
      undefined,
      (test) => {
        // Clear the layer from the map and assert it was removed
        this.removeLayerConfigAndAssert(test, layerPath);
      }
    );
  }

  // #endregion KML

  // #region SETTINGS

  /**
   * Tests initial settings properly cascading to sub layers.
   *
   * @returns A promise that resolves with the fixture layer and generated map configuration
   */
  testInitialSettingsCascade(): Promise<Test<LayerTestResult<TypeMapFeaturesInstance | undefined>>> {
    let rootLayerPath: string | undefined;
    // Expected config
    const expectedResults = {
      groupHighlight: false,
      groupRemove: false,
      childHighlight: true,
      childRemove: false,
      childZoom: false,
    };

    // Test the WMS
    return this.test(
      'Test initial settings cascade',
      async (test) => {
        // Add the fixture and wait for its selected layer to be ready
        const gvLayer = await this.addLayerGeoJSONPointsSettingsUnderGroup(test, {
          onLayerPath: (rootPath): void => {
            rootLayerPath = rootPath;
          },
        });

        // Return created map config
        return { gvLayer, data: this.getControllersRegistry().mapController.createMapConfigFromMapState() };
      },
      (test, result) => {
        const layer = result.data?.map?.listOfGeoviewLayerConfig.find(
          (geoviewLayer) => geoviewLayer.geoviewLayerId === result.gvLayer.getGeoviewLayerId()
        ) as TypeGeoviewLayerConfig;

        // Perform assertions
        test.addStep('Verifying group layer highlight control...');
        Test.assertIsEqual(layer?.initialSettings?.controls?.highlight, expectedResults.groupHighlight);

        test.addStep('Verifying group layer remove control...');
        Test.assertIsEqual(
          AbstractBaseLayerEntryConfig.getClassOrTypeInitialSettings(layer?.listOfLayerEntryConfig?.[0])?.controls?.remove,
          expectedResults.groupRemove
        );

        test.addStep('Verifying child layer highlight control...');
        Test.assertIsEqual(
          AbstractBaseLayerEntryConfig.getClassOrTypeInitialSettings(layer?.listOfLayerEntryConfig?.[0]?.listOfLayerEntryConfig?.[0])
            ?.controls?.highlight,
          expectedResults.childHighlight
        );
      },
      (test) => {
        // Clear the layer from the map and assert it was removed
        if (rootLayerPath) this.removeLayerConfigAndAssert(test, rootLayerPath);
      }
    );
  }

  // #endregion SETTINGS

  // #region DOMAIN FIELDS

  /**
   * Tests adding an Esri Dynamic layer that has fields with coded value domains and verifies
   * that the "material" field on layer 16 has a domain in the generated config.
   *
   * @returns A promise that resolves when the test completes
   */
  testAddEsriDynamicWithDomainField(): Promise<Test<AbstractBaseGVLayer>> {
    let rootLayerPath: string | undefined;
    return this.test(
      `Test Adding Esri Dynamic Water Network and checking domain field...`,
      (test) => {
        // Add the fixture and wait for its selected layer to be ready
        return this.addLayerEsriDynamicWaterNetwork(test, undefined, {
          onLayerPath: (rootPath): void => {
            rootLayerPath = rootPath;
          },
        });
      },
      (test, result) => {
        // Verify the layer exists
        LayerTester.#assertCheckLayerExistsInStore(test, this.getMapId(), result.getLayerPath(), result.getLayerName());

        // Get the layer entry config to check for the domain on the "material" field
        test.addStep('Getting the layer entry config...');
        const layerEntryConfig = this.getMapViewer().layer.getLayerEntryConfigRegular(result.getLayerPath());
        Test.assertIsDefined('layerEntryConfig', layerEntryConfig);

        // Get the outfields
        test.addStep('Getting the outfields from the config...');
        const outfields = layerEntryConfig.getOutfields();
        Test.assertIsDefined('outfields', outfields);
        Test.assertIsArrayLengthMinimal(outfields, 1);

        // Find the "material" field
        test.addStep(`Finding the "${TestConstants.WATER_NETWORK_DOMAIN_FIELD_NAME}" field...`);
        const materialField = outfields.find((f) => f.name === TestConstants.WATER_NETWORK_DOMAIN_FIELD_NAME);
        Test.assertIsDefined('materialField', materialField);

        // Verify it has a domain
        test.addStep('Verifying the field has a domain...');
        Test.assertIsDefined('materialField.domain', materialField.domain);

        // Verify the domain type is codedValue
        test.addStep('Verifying the domain type is codedValue...');
        Test.assertIsEqual(materialField.domain.type, 'codedValue');

        // Verify the domain has coded values
        test.addStep('Verifying the domain has coded values...');
        const codedDomain = materialField.domain as { type: string; codedValues: unknown[] };
        Test.assertIsDefined('codedValues', codedDomain.codedValues);
        Test.assertIsArrayLengthMinimal(codedDomain.codedValues, 1);
      },
      (test) => {
        // Clear the layer from the map and assert it was removed
        if (rootLayerPath) this.removeLayerConfigAndAssert(test, rootLayerPath);
      }
    );
  }

  /**
   * Tests adding an Esri Feature layer that has fields with coded value domains and verifies
   * that the "material" field on layer 16 has a domain in the generated config.
   *
   * @returns A promise that resolves when the test completes
   */
  testAddEsriFeatureWithDomainField(): Promise<Test<AbstractBaseGVLayer>> {
    let rootLayerPath: string | undefined;
    return this.test(
      `Test Adding Esri Feature Water Network and checking domain field...`,
      (test) => {
        // Add the fixture and wait for its selected layer to be ready
        return this.addLayerEsriFeatureWaterNetwork(test, undefined, {
          onLayerPath: (rootPath): void => {
            rootLayerPath = rootPath;
          },
        });
      },
      (test, result) => {
        // Verify the layer exists
        LayerTester.#assertCheckLayerExistsInStore(test, this.getMapId(), result.getLayerPath(), result.getLayerName());

        // Get the layer entry config to check for the domain on the "material" field
        test.addStep('Getting the layer entry config...');
        const layerEntryConfig = this.getMapViewer().layer.getLayerEntryConfigRegular(result.getLayerPath());
        Test.assertIsDefined('layerEntryConfig', layerEntryConfig);

        // Get the outfields
        test.addStep('Getting the outfields from the config...');
        const outfields = layerEntryConfig.getOutfields();
        Test.assertIsDefined('outfields', outfields);
        Test.assertIsArrayLengthMinimal(outfields, 1);

        // Find the "material" field
        test.addStep(`Finding the "${TestConstants.WATER_NETWORK_DOMAIN_FIELD_NAME}" field...`);
        const materialField = outfields.find((f) => f.name === TestConstants.WATER_NETWORK_DOMAIN_FIELD_NAME);
        Test.assertIsDefined('materialField', materialField);

        // Verify it has a domain
        test.addStep('Verifying the field has a domain...');
        Test.assertIsDefined('materialField.domain', materialField.domain);

        // Verify the domain type is codedValue
        test.addStep('Verifying the domain type is codedValue...');
        Test.assertIsEqual(materialField.domain.type, 'codedValue');

        // Verify the domain has coded values
        test.addStep('Verifying the domain has coded values...');
        const codedDomain = materialField.domain as { type: string; codedValues: unknown[] };
        Test.assertIsDefined('codedValues', codedDomain.codedValues);
        Test.assertIsArrayLengthMinimal(codedDomain.codedValues, 1);
      },
      (test) => {
        // Clear the layer from the map and assert it was removed
        if (rootLayerPath) this.removeLayerConfigAndAssert(test, rootLayerPath);
      }
    );
  }

  /**
   * Tests adding an Esri Dynamic layer with domain fields, querying all features,
   * and verifying that the "material" field value in the query results is the
   * domain-translated value (human-readable name) rather than the raw code.
   *
   * @returns A promise that resolves with the fixture layer and domain-translated query results
   */
  testEsriDynamicDomainFieldQueryValue(): Promise<Test<LayerTestResult<TypeFeatureInfoResult>>> {
    let rootLayerPath: string | undefined;
    const gvLayerName = 'Esri Dynamic Water Network Query';

    return this.test(
      `Test Esri Dynamic Water Network domain field query value translation...`,
      async (test) => {
        // Add the fixture and wait for its selected layer to be ready
        const gvLayer = await this.addLayerEsriDynamicWaterNetwork(test, gvLayerName, {
          onLayerPath: (rootPath): void => {
            rootLayerPath = rootPath;
          },
        });
        const layerPath = gvLayer.getLayerPath();

        // Wait for the layer to be registered in the allFeatureInfoLayerSet
        test.addStep('Waiting for the layer to be registered in the allFeatureInfoLayerSet...');
        await this.getControllersRegistry().layerSetController.allFeatureInfoLayerSet.waitForLayerToGetRegistered(layerPath);

        // Set the zoom to 17.4 so the layer is within its visible scale range for the query
        test.addStep('Setting zoom to 17.4 for the layer visible range...');
        await this.getControllersRegistry().mapController.zoomMap(17.4, TestConstants.USE_ZOOM_ANIMATION);

        // Query all features
        test.addStep('Triggering getAllFeatureInfo query...');
        const result = await this.getControllersRegistry().layerSetController.triggerGetAllFeatureInfo(layerPath);
        return { gvLayer, data: result };
      },
      (test, result) => {
        // Verify we got results
        test.addStep('Verifying query returned results...');
        Test.assertIsDefined('result', result.data);
        Test.assertIsDefined('result.results', result.data.results);
        Test.assertIsArrayLengthMinimal(result.data.results, 1);

        // Get the first feature's fieldInfo
        test.addStep('Getting the first feature fieldInfo...');
        const firstFeature = result.data.results[0];
        Test.assertIsDefined('firstFeature.fieldInfo', firstFeature.fieldInfo);

        // Get the material field value
        const fieldName = TestConstants.WATER_NETWORK_DOMAIN_FIELD_NAME;
        test.addStep(`Getting the "${fieldName}" field from the feature...`);
        const materialFieldEntry = firstFeature.fieldInfo[fieldName];
        Test.assertIsDefined('materialFieldEntry', materialFieldEntry);
        Test.assertIsDefined('materialFieldEntry.value', materialFieldEntry.value);

        // Get the coded values from the domain on the field entry
        test.addStep('Verifying the field has a codedValue domain...');
        Test.assertIsDefined('materialFieldEntry.domain', materialFieldEntry.domain);
        Test.assertIsEqual(materialFieldEntry.domain.type, 'codedValue');

        const codedDomain = materialFieldEntry.domain as codedValueType;
        const codedValueNames = codedDomain.codedValues.map((cv) => cv.name);
        const codedValueCodes = codedDomain.codedValues.map((cv) => cv.code);

        // Verify the value is one of the translated names, not a raw code
        test.addStep('Verifying the value is a domain-translated name...');
        Test.assertArrayIncludes(codedValueNames, materialFieldEntry.value as string);

        // Verify the value is NOT a raw code (unless name === code, which is unlikely)
        test.addStep('Verifying the value is not a raw code...');
        // Only assert if the translated name differs from the code for this value
        const matchingEntry = codedDomain.codedValues.find((cv) => cv.name === materialFieldEntry.value);
        if (matchingEntry && matchingEntry.code !== matchingEntry.name) {
          Test.assertArrayExcludes(codedValueCodes as string[], materialFieldEntry.value as string);
        }
      },
      (test) => {
        // Clear the layer from the map and assert it was removed
        if (rootLayerPath) this.removeLayerConfigAndAssert(test, rootLayerPath);
      }
    );
  }

  /**
   * Tests adding an Esri Feature layer with domain fields, querying all features,
   * and verifying that the "material" field value in the query results is the
   * domain-translated value (human-readable name) rather than the raw code.
   *
   * @returns A promise that resolves with the fixture layer and domain-translated query results
   */
  testEsriFeatureDomainFieldQueryValue(): Promise<Test<LayerTestResult<TypeFeatureInfoResult>>> {
    let rootLayerPath: string | undefined;
    const gvLayerName = 'Esri Feature Water Network Query';

    return this.test(
      `Test Esri Feature Water Network domain field query value translation...`,
      async (test) => {
        // Add the fixture and wait for its selected layer to be ready
        const gvLayer = await this.addLayerEsriFeatureWaterNetwork(test, gvLayerName, {
          onLayerPath: (rootPath): void => {
            rootLayerPath = rootPath;
          },
        });
        const layerPath = gvLayer.getLayerPath();

        // Wait for the layer to be registered in the allFeatureInfoLayerSet
        test.addStep('Waiting for the layer to be registered in the allFeatureInfoLayerSet...');
        await this.getControllersRegistry().layerSetController.allFeatureInfoLayerSet.waitForLayerToGetRegistered(layerPath);

        // Set the zoom to 17.4 so the layer is within its visible scale range for the query
        test.addStep('Setting zoom to 17.4 for the layer visible range...');
        await this.getControllersRegistry().mapController.zoomMap(17.4, TestConstants.USE_ZOOM_ANIMATION);

        // Query all features
        test.addStep('Triggering getAllFeatureInfo query...');
        const result = await this.getControllersRegistry().layerSetController.triggerGetAllFeatureInfo(layerPath);
        return { gvLayer, data: result };
      },
      (test, result) => {
        // Verify we got results
        test.addStep('Verifying query returned results...');
        Test.assertIsDefined('result', result.data);
        Test.assertIsDefined('result.results', result.data.results);
        Test.assertIsArrayLengthMinimal(result.data.results, 1);

        // Get the first feature's fieldInfo
        test.addStep('Getting the first feature fieldInfo...');
        const firstFeature = result.data.results[0];
        Test.assertIsDefined('firstFeature.fieldInfo', firstFeature.fieldInfo);

        // Get the material field value
        const fieldName = TestConstants.WATER_NETWORK_DOMAIN_FIELD_NAME;
        test.addStep(`Getting the "${fieldName}" field from the feature...`);
        const materialFieldEntry = firstFeature.fieldInfo[fieldName];
        Test.assertIsDefined('materialFieldEntry', materialFieldEntry);
        Test.assertIsDefined('materialFieldEntry.value', materialFieldEntry.value);

        // Get the coded values from the domain on the field entry
        test.addStep('Verifying the field has a codedValue domain...');
        Test.assertIsDefined('materialFieldEntry.domain', materialFieldEntry.domain);
        Test.assertIsEqual(materialFieldEntry.domain.type, 'codedValue');

        const codedDomain = materialFieldEntry.domain as codedValueType;
        const codedValueNames = codedDomain.codedValues.map((cv) => cv.name);
        const codedValueCodes = codedDomain.codedValues.map((cv) => cv.code);

        // Verify the value is one of the translated names, not a raw code
        test.addStep('Verifying the value is a domain-translated name...');
        Test.assertArrayIncludes(codedValueNames, materialFieldEntry.value as string);

        // Verify the value is NOT a raw code (unless name === code, which is unlikely)
        test.addStep('Verifying the value is not a raw code...');
        const matchingEntry = codedDomain.codedValues.find((cv) => cv.name === materialFieldEntry.value);
        if (matchingEntry && matchingEntry.code !== matchingEntry.name) {
          Test.assertArrayExcludes(codedValueCodes as string[], materialFieldEntry.value as string);
        }
      },
      (test) => {
        // Clear the layer from the map and assert it was removed
        if (rootLayerPath) this.removeLayerConfigAndAssert(test, rootLayerPath);
      }
    );
  }

  // #endregion DOMAIN FIELDS

  /**
   * Tests repeated layer renaming through the public LayerApi and synchronization with the legend store and Layers panel.
   *
   * @returns A promise that resolves with runtime, store, and DOM name snapshots after each rename
   */
  testSetLayerName(): Promise<Test<LayerTestResult<(string | undefined)[]>>> {
    let rootLayerPath: string | undefined;
    const firstName = 'Renamed points layer';
    const secondName = 'Renamed points layer again';
    const mapId = this.getMapId();

    return this.test(
      'Test LayerApi.setLayerName updates the runtime layer, legend store, and Layers panel...',
      async (test) => {
        // Capture the cleanup path before loading so finalization can remove even a partially loaded fixture.
        const gvLayer = await this.addLayerGeoJSONPointsSettingsUnderGroup(test, {
          onLayerPath: (rootPath): void => {
            rootLayerPath = rootPath;
          },
        });

        const layerPathPoints = gvLayer.getLayerPath();

        test.addStep('Opening the Layers footer panel to observe the rendered layer name...');
        this.getControllersRegistry().uiController.setActiveFooterBarTab('layers');
        await DomHelper.waitForFooterTabSelected(mapId, 'layers');
        const snapshots: (string | undefined)[] = [];

        for (const name of [firstName, secondName]) {
          test.addStep(`Renaming the layer to '${name}' through LayerApi.setLayerName...`);

          // Observe a stable ancestor before the update because renaming can remount the layer row.
          const domChanged = DomHelper.waitForDomChange(DomHelper.getMapContainer(mapId), undefined, 10000);
          this.getMapViewer().layer.setLayerName(layerPathPoints, name);

          // Get the store layer name
          const storeLayerName = getStoreLayerLegendLayerByPath(mapId, layerPathPoints)?.layerName;

          // eslint-disable-next-line no-await-in-loop
          await domChanged;

          // Let React finish rendering, then snapshot the label without checking its expected value.
          // eslint-disable-next-line no-await-in-loop
          await DomHelper.waitForReactIdle();
          const domName = DomHelper.getLayerBoxLayerName(mapId, layerPathPoints, CONTAINER_TYPE.FOOTER_BAR);
          snapshots.push(gvLayer.getLayerName(), storeLayerName, domName);
        }

        return { gvLayer, data: snapshots };
      },
      (test, result) => {
        test.addStep('Verifying both renames update runtime, store, and rendered layer names...');
        Test.assertIsArrayEqual(result.data, [firstName, firstName, firstName, secondName, secondName, secondName]);
      },
      (test) => {
        // Clear the layer from the map and assert it was removed
        if (rootLayerPath) this.removeLayerConfigAndAssert(test, rootLayerPath);
      }
    );
  }

  // #region LAYER VISIBILITY

  /**
   * Tests adding a geocore layer that has group layers with defaultVisibility set to false.
   * Verifies that the groups are loaded with visible=false and their children are not effectively visible.
   *
   * @returns A promise that resolves when the test completes
   */
  testAddGeocoreWithGroupDefaultVisibilityFalse(isRunningHeavyTests: boolean): Promise<Test<AbstractBaseGVLayer>> {
    let rootLayerPath: string | undefined;
    // Test
    return this.test(
      `Test Adding layer with group layer defaultVisibility to false...`,
      (test) => {
        // If we're not running the heavy tests actually, skip it
        if (!isRunningHeavyTests) {
          throw new TestSkippedError('Not running the heavy tests');
        }

        return this.addLayerEsriDynamicMarineFisheriesViaGeocore(test, {
          onLayerPath: (rootPath): void => {
            rootLayerPath = rootPath;
          },
        });
      },
      (test, result) => {
        // Verify the layer exists
        LayerTester.#assertCheckLayerExistsInPanels(test, this.getMapId(), result.getLayerPath());

        const gvLayerPathWithGroupVisibilityFalse = result.getLayerPath();
        // Get the root layer (group)
        const rootLayer = this.getControllersRegistry().layerController.getGeoviewLayerIfExists(gvLayerPathWithGroupVisibilityFalse);

        // The root group should exist
        Test.assertIsDefined('rootLayer', rootLayer);

        // The root group should have visible=false (defaultVisibility=false in the service metadata)
        test.addStep('Checking that group layer with defaultVisibility=false is not visible in its property...');
        Test.assertIsEqual(rootLayer.getVisible(), false);

        // Check in the store as well
        const storeLayer = getStoreLayerLegendLayerByPath(this.getMapId(), gvLayerPathWithGroupVisibilityFalse);

        // The store layer should exist
        Test.assertIsDefined('storeLayer', storeLayer);

        // The store layer should be not visible
        test.addStep('Checking that group layer with defaultVisibility=false is not visible in the store...');
        Test.assertIsEqual(storeLayer?.visible, false);
      },
      (test) => {
        // If the test was running
        if (isRunningHeavyTests) {
          // Clear the layer from the map and assert it was removed
          if (rootLayerPath) this.removeLayerConfigAndAssert(test, rootLayerPath);
        }
      }
    );
  }

  /**
   * Tests explicit visibility updates and implicit toggles through the public LayerApi.
   *
   * @returns A promise that resolves with the fixture layer and visibility snapshots in operation order
   */
  testSetOrToggleLayerVisibility(): Promise<Test<LayerTestResult<boolean[]>>> {
    let rootLayerPath: string | undefined;
    const mapId = this.getMapId();

    // Preserve the app-bar selection and focus-trap state for restoration after the test.
    const previousActiveAppBarTab = getStoreUIActiveAppBarTab(mapId);

    return this.test(
      'Test LayerApi.setOrToggleLayerVisibility sets and toggles layer visibility...',
      async (test) => {
        // Add the fixture and wait for its selected layer to be ready
        const gvLayer = await this.addLayerGeoJSONPointsSettingsUnderGroup(test, {
          onLayerPath: (rootPath): void => {
            rootLayerPath = rootPath;
          },
        });
        const layerPathPoints = gvLayer.getLayerPath();

        // Render the Layers panel so each API change can also be observed through its eye control.
        test.addStep('Opening the Layers panel to inspect the layer visibility control...');
        this.getControllersRegistry().uiController.setActiveFooterBarTab('layers');

        // Wait for both tab activation and the layer's DOM entry before reading UI state.
        await DomHelper.waitForFooterTabSelected(mapId, 'layers');

        // Get the layer api
        const layerApi = this.getMapViewer().layer;

        // Explicit false establishes a hidden starting state independently of the fixture's default.
        test.addStep('Explicitly hide the layer and wait for eye-control state to update...');
        layerApi.setOrToggleLayerVisibility(layerPathPoints, false);

        // Wait until the UI visibility updates
        await DomHelper.waitVisibleButtonVisibility(mapId, layerPathPoints, CONTAINER_TYPE.FOOTER_BAR, false);
        const visibilityState1 = getStoreLayerVisible(mapId, layerPathPoints);

        // Explicit true must restore visibility after the preceding hide operation.
        test.addStep('Explicitly showing the layer and capturing the store and eye-control state...');
        layerApi.setOrToggleLayerVisibility(layerPathPoints, true);

        // Wait until the UI visibility updates
        await DomHelper.waitVisibleButtonVisibility(mapId, layerPathPoints, CONTAINER_TYPE.FOOTER_BAR, true);
        const visibilityState2 = getStoreLayerVisible(mapId, layerPathPoints);

        // Omitting the visibility argument exercises the toggle branch from visible to hidden.
        test.addStep('Toggling the visible layer off and capturing the store and eye-control state...');
        layerApi.setOrToggleLayerVisibility(layerPathPoints);

        // Wait until the UI visibility updates
        await DomHelper.waitVisibleButtonVisibility(mapId, layerPathPoints, CONTAINER_TYPE.FOOTER_BAR, false);
        const visibilityState3 = getStoreLayerVisible(mapId, layerPathPoints);

        // Repeat the implicit toggle from the opposite state to cover both transition directions.
        test.addStep('Toggling the hidden layer on and capturing the store and eye-control state...');
        layerApi.setOrToggleLayerVisibility(layerPathPoints);

        // Wait until the UI visibility updates
        await DomHelper.waitVisibleButtonVisibility(mapId, layerPathPoints, CONTAINER_TYPE.FOOTER_BAR, true);
        const visibilityState4 = getStoreLayerVisible(mapId, layerPathPoints);

        // Keep snapshots in operation order so assertions consume observations without repeating API calls.
        return { gvLayer, data: [visibilityState1, visibilityState2, visibilityState3, visibilityState4] };
      },
      (test, result) => {
        // The assertions expect six booleans per snapshot; slices follow the operation order above.
        test.addStep('Verifying all visibility states happened correctly in the store...');
        Test.assertIsArrayEqual(result.data, [false, true, false, true]);
      },
      async (test) => {
        try {
          // Clear the layer from the map and assert it was removed
          if (rootLayerPath) this.removeLayerConfigAndAssert(test, rootLayerPath);
        } finally {
          // Restore app-bar state even if fixture removal fails, avoiding contamination of later tests.
          this.getControllersRegistry().uiController.setActiveAppBarTab(
            previousActiveAppBarTab.tabId,
            previousActiveAppBarTab.isOpen,
            previousActiveAppBarTab.isFocusTrapped ?? false
          );

          // Let restoration render before the next test begins interacting with the shared viewer.
          await DomHelper.waitForReactIdle();
        }
      }
    );
  }

  /**
   * Tests that a child layer hidden only because its parent group is hidden is flagged hidden on the map (so it would
   * appear in the panels' "Hidden layers" section) while staying in scale range, and that walking the parent chain
   * with setLayerVisibleIncludingParents makes it visible again (moving it back to the available list).
   *
   * @returns A promise that resolves when the test completes
   */
  testSetLayerVisibleIncludingParents(): Promise<Test<ParentCrawlVisibilityResult>> {
    let rootLayerPath: string | undefined;

    // Test
    return this.test(
      `Test hidden-by-parent child and setLayerVisibleIncludingParents parent crawl...`,
      async (test) => {
        // Add the fixture and wait for its selected layer to be ready
        const gvLayer = await this.addLayerGeoJSONPointsSettingsUnderGroup(test, {
          onLayerPath: (rootPath): void => {
            rootLayerPath = rootPath;
          },
        });
        const layerPathPoints = gvLayer.getLayerPath();
        const parent = gvLayer.getParentRoot();
        const groupPath = parent?.getLayerPath();

        const { layerController } = this.getControllersRegistry();
        const groupLayer = groupPath ? layerController.getGeoviewLayerIfExists(groupPath) : undefined;
        const childLayer = layerController.getGeoviewLayerIfExists(layerPathPoints);
        if (!parent || !groupPath || !groupLayer || !childLayer) return { gvLayer, parent, groupLayer, childLayer };

        // Make sure both start visible
        test.addStep('Ensuring the group and child start visible...');
        layerController.setOrToggleLayerVisibility(groupPath, true);
        layerController.setOrToggleLayerVisibility(layerPathPoints, true);

        // Hide the parent group only (the child keeps its own visibility but is masked by the hidden group)
        test.addStep('Hiding the parent group...');
        layerController.setOrToggleLayerVisibility(groupPath, false);

        const afterHide = {
          groupVisible: groupLayer.getVisible(),
          childOwnVisible: childLayer.getVisible(),
          childEffectiveVisible: childLayer.getVisibleIncludingParents(),
          childHidden: getStoreLayerIsHiddenOnMap(this.getMapId(), layerPathPoints),
          childInRange: getStoreLayerInVisibleRangeLayerPaths(this.getMapId()).includes(layerPathPoints),
        };

        // Walk the parent chain to make the hidden child visible again (what the inline eye toggle does)
        test.addStep('Calling setLayerVisibleIncludingParents on the hidden child...');
        layerController.setLayerVisibleIncludingParents(layerPathPoints);

        const afterShow = {
          groupVisible: groupLayer.getVisible(),
          childEffectiveVisible: childLayer.getVisibleIncludingParents(),
          childHidden: getStoreLayerIsHiddenOnMap(this.getMapId(), layerPathPoints),
        };

        return { gvLayer, parent, groupLayer, childLayer, afterHide, afterShow };
      },
      (test, result) => {
        test.addStep('Verifying the parent group and child layers exist...');
        Test.assertIsDefined('parent', result.parent);
        Test.assertIsDefined('groupLayer', result.groupLayer);
        Test.assertIsDefined('childLayer', result.childLayer);
        Test.assertIsDefined('afterHide', result.afterHide);
        Test.assertIsDefined('afterShow', result.afterShow);

        // While the parent group is hidden, the child is masked but keeps its own visibility (it would show in the
        // "Hidden layers" section) and stays in scale range (so it is NOT filtered out as out-of-range)
        test.addStep('Verifying the child is hidden by its parent while staying in range...');
        Test.assertIsEqual(result.afterHide.groupVisible, false);
        Test.assertIsEqual(result.afterHide.childOwnVisible, true);
        Test.assertIsEqual(result.afterHide.childEffectiveVisible, false);
        Test.assertIsEqual(result.afterHide.childHidden, true);
        Test.assertIsEqual(result.afterHide.childInRange, true);

        // After the parent crawl, both the group and the child are visible again (child moves back to the available list)
        test.addStep('Verifying the parent crawl restored the child visibility...');
        Test.assertIsEqual(result.afterShow.groupVisible, true);
        Test.assertIsEqual(result.afterShow.childEffectiveVisible, true);
        Test.assertIsEqual(result.afterShow.childHidden, false);
      },
      (test) => {
        // Clear the layer from the map and assert it was removed
        if (rootLayerPath) this.removeLayerConfigAndAssert(test, rootLayerPath);
      }
    );
  }

  // #endregion LAYER VISIBILITY

  /**
   * Tests parent/child opacity propagation, independent child updates, and parent caps through the public LayerApi.
   *
   * @returns A promise that resolves with runtime and legend-store snapshots after each parent or child update
   */
  testSetLayerOpacity(): Promise<Test<LayerTestResult<LayerOpacitySnapshot[]>>> {
    let rootLayerPath: string | undefined;

    return this.test(
      'Test LayerApi.setLayerOpacity propagates parent opacity and caps independent child updates...',
      async (test) => {
        // Capture the cleanup path before loading so a failed setup still removes the fixture.
        const gvLayer = await this.addLayerGeoJSONPointsSettingsUnderGroup(test, {
          onLayerPath: (rootPath): void => {
            rootLayerPath = rootPath;
          },
        });

        const parent = gvLayer.getParent();
        if (!parent) throw new TestError('The opacity fixture must have a parent group');
        const data: LayerOpacitySnapshot[] = [];

        const updates = [
          // Parent updates must cascade to the child and update the child's legend opacity limit.
          { layer: parent, opacity: 1 },
          { layer: parent, opacity: 0.4 },

          // Lowering a child must leave its parent unchanged; a later parent update replaces the child's value.
          { layer: gvLayer, opacity: 0.2 },
          { layer: parent, opacity: 0.6 },

          // Requests above the parent cap affect the requested store value, but not the child's capped runtime opacity.
          { layer: gvLayer, opacity: 0.9 },

          // Zero opacity must propagate, prevent a child from becoming opaque, and remain reversible.
          { layer: parent, opacity: 0 },
          { layer: gvLayer, opacity: 1 },
          { layer: parent, opacity: 1 },

          // With the parent fully opaque, a child can again take an independent fractional value.
          { layer: gvLayer, opacity: 0.4 },
        ];

        for (const { layer, opacity } of updates) {
          test.addStep(`Setting opacity of '${layer.getLayerPath()}' to ${opacity}...`);
          this.getMapViewer().layer.setLayerOpacity(layer.getLayerPath(), opacity);

          // Capture both layers before the next operation changes them.
          const parentStore = getStoreLayerLegendLayerByPath(this.getMapId(), parent.getLayerPath());
          const childStore = getStoreLayerLegendLayerByPath(this.getMapId(), gvLayer.getLayerPath());
          data.push({
            parentOpacity: parent.getOpacity(),
            childOpacity: gvLayer.getOpacity(),
            parentStoreOpacity: parentStore?.opacity,
            childStoreOpacity: childStore?.opacity,
            childMaxFromParent: childStore?.opacityMaxFromParent,
          });
        }

        return { gvLayer, data };
      },
      (test, result) => {
        // Expected tuples are parent runtime, child runtime, parent store, child store, and child limit.
        const expected = [
          [1, 1, 1, 1, 1],
          [0.4, 0.4, 0.4, 0.4, 0.4],
          [0.4, 0.2, 0.4, 0.2, 0.4],
          [0.6, 0.6, 0.6, 0.6, 0.6],
          [0.6, 0.6, 0.6, 0.9, 0.6],
          [0, 0, 0, 0, 0],
          [0, 0, 0, 1, 0],
          [1, 1, 1, 1, 1],
          [1, 0.4, 1, 0.4, 1],
        ];
        Test.assertIsEqual(result.data.length, expected.length);
        for (const [index, snapshot] of result.data.entries()) {
          test.addStep(`Verifying parent/child runtime opacity, store opacity, and parent limit after update ${index + 1}...`);
          Test.assertIsArrayEqual(
            [
              snapshot.parentOpacity,
              snapshot.childOpacity,
              snapshot.parentStoreOpacity,
              snapshot.childStoreOpacity,
              snapshot.childMaxFromParent,
            ],
            expected[index]
          );
        }
      },
      (test) => {
        // Clear the layer from the map and assert it was removed
        if (rootLayerPath) this.removeLayerConfigAndAssert(test, rootLayerPath);
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
   * @returns A promise that resolves with the layer and feature arrays before disabling queries, while disabled, and after re-enabling
   */
  testNonQueryableLayerNotInDetails(): Promise<Test<LayerWithBeforeAfterFeature<GVGeoJSON>>> {
    const lonlat = [-88, 52];
    let gvLayer: GVGeoJSON | undefined;
    let rootLayerPath: string | undefined;
    return this.test(
      'Test non-queryable layer not in details after map click',
      async (test) => {
        // Make sure the map has no pre-existing layers
        this.getControllersRegistry().layerCreatorController.removeAllGeoviewLayers();

        // Add GeoJson Polygons layer
        gvLayer = await this.addLayerGeoJSONWithMetadataPolygons(test, {
          onLayerPath: (rootPath): void => {
            rootLayerPath = rootPath;
          },
        });

        // The layer should be initially queryable
        if (!gvLayer.getQueryable())
          throw new TestError(`False precondition, the layer ${gvLayer.getLayerPath()} wasn't initially queryable.`);

        // Wait for the layer to be loaded after the zoom, a guarantee
        await gvLayer.waitForLoadedStatus();

        // Query the layer at the given coordinates
        const layerDataOn = await this.queryAtCoordinateRetrieveResultsForLayer(test, gvLayer, lonlat);

        // Set layer non queryable, this will also clear the result set automatically
        test.addStep(`Setting layer '${gvLayer.getLayerPath()}' as non-queryable...`);
        gvLayer.setQueryable(false);

        // Query the layer at the given coordinates
        const layerDataOff = await this.queryAtCoordinateRetrieveResultsForLayer(test, gvLayer, lonlat);

        // Set layer queryable again
        test.addStep(`Setting layer '${gvLayer.getLayerPath()}' as queryable again...`);
        gvLayer.setQueryable(true);

        // Query the layer at the given coordinates
        const layerDataOn2 = await this.queryAtCoordinateRetrieveResultsForLayer(test, gvLayer, lonlat);

        // Return the test results
        return { layer: gvLayer, results: [layerDataOn, layerDataOff, layerDataOn2] };
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
      (test) => {
        // Clear the layer from the map and assert it was removed
        if (rootLayerPath) this.removeLayerConfigAndAssert(test, rootLayerPath);
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
   * @returns A promise that resolves with the Test containing the hover states
   */
  testLayerHoverableState(): Promise<Test<LayerWithBeforeAfterHover<AbstractGVLayer>>> {
    const lonlat = [-88, 52];
    let gvLayer: AbstractGVLayer | undefined;
    let rootLayerPath: string | undefined;
    return this.test(
      'Test layer hoverable state in hoverFeatureInfoLayerSet',
      async (test) => {
        // Make sure the map has no pre-existing layers
        this.getControllersRegistry().layerCreatorController.removeAllGeoviewLayers();

        // Add GeoJson Polygons layer
        gvLayer = await this.addLayerGeoJSONWithMetadataPolygons(test, {
          onLayerPath: (rootPath): void => {
            rootLayerPath = rootPath;
          },
        });

        // The layer should be initially hoverable
        if (!gvLayer.getHoverable())
          throw new TestError(`False precondition, the layer ${gvLayer.getLayerPath()} wasn't initially hoverable.`);

        // Wait for the layer to be loaded after the zoom, a guarantee
        await gvLayer.waitForLoadedStatus();

        // Get the hover info layer set
        const hoverInfoLayerSet = this.getControllersRegistry().layerSetController.hoverFeatureInfoLayerSet;

        // Perform a hover query using the hover feature info layer set
        test.addStep(`Perform query operation at given coordinates...`);
        await hoverInfoLayerSet.queryLayers(lonlat, 'at_lon_lat');

        // Check if there is feature selected from the layer
        test.addStep(`Checking for features from layer '${gvLayer.getLayerPath()}'...`);
        const layerDataOnTemp = getStoreMapHoverFeatureInfo(this.getMapId());

        // Store a deep copy of the data before clearing to preserve it
        const layerDataOn = layerDataOnTemp ? { ...layerDataOnTemp } : undefined;

        // Set layer non queryable, this will also clear the result set automatically
        test.addStep(`Setting layer '${gvLayer.getLayerPath()}' as non-hoverable...`);
        gvLayer.setHoverable(false);

        // Perform a hover query using the feature info layer set
        test.addStep(`Perform query operation at given coordinates...`);
        await hoverInfoLayerSet.queryLayers(lonlat, 'at_lon_lat');

        // Check if there is feature selected from the layer
        test.addStep(`Checking for features from layer '${gvLayer.getLayerPath()}'...`);
        const layerDataOffTemp = getStoreMapHoverFeatureInfo(this.getMapId());

        // Store a deep copy of the data before clearing to preserve it
        const layerDataOff = layerDataOffTemp ? { ...layerDataOffTemp } : undefined;

        // Set layer hoverable again
        test.addStep(`Setting layer '${gvLayer.getLayerPath()}' as hoverable again...`);
        gvLayer.setHoverable(true);

        // Perform a hover query using the feature info layer set
        test.addStep(`Perform query operation at given coordinates...`);
        await hoverInfoLayerSet.queryLayers(lonlat, 'at_lon_lat');

        // Check if there is feature selected from the layer
        test.addStep(`Checking for features from layer '${gvLayer.getLayerPath()}'...`);
        const layerDataOn2Temp = getStoreMapHoverFeatureInfo(this.getMapId());

        // Store a deep copy of the data before clearing to preserve it
        const layerDataOn2 = layerDataOn2Temp ? { ...layerDataOn2Temp } : undefined;

        // Return the test results
        return { layer: gvLayer, results: { layerDataOn, layerDataOff, layerDataOn2 } };
      },
      (test, result) => {
        test.addStep('Verifying layer data features when hoverable...');
        Test.assertJsonObject(result.results.layerDataOn, { fieldInfo: { value: 'Ontario' } });

        test.addStep('Verifying layer data features when not hoverable...');
        Test.assertIsUndefined('result.layerDataOff', result.results.layerDataOff);

        test.addStep('Verifying layer data features when hoverable again...');
        Test.assertJsonObject(result.results.layerDataOn2, { fieldInfo: { value: 'Ontario' } });
      },
      (test) => {
        // Clear the layer from the map and assert it was removed
        if (rootLayerPath) this.removeLayerConfigAndAssert(test, rootLayerPath);
      }
    );
  }

  /**
   * Tests text visibility updates through the layer controller and synchronization with the legend store.
   *
   * @returns A promise that resolves with runtime and store text-visibility snapshots
   */
  testSetLayerTextVisibility(): Promise<Test<LayerTestResult<(boolean | undefined)[]>>> {
    let rootLayerPath: string | undefined;

    return this.test(
      'Test LayerController.setLayerTextVisibility updates runtime and store flags...',
      async (test) => {
        // Add layer and retain the cleanup scope even if loading fails before the vector layer is available.
        const gvLayer = await this.addLayerGeoJSONPointsSettingsUnderGroup(test, {
          onLayerPath: (rootPath): void => {
            rootLayerPath = rootPath;
          },
        });

        if (!(gvLayer instanceof AbstractGVVector)) throw new TestError('The text visibility fixture must be a vector layer');
        const layerPath = gvLayer.getLayerPath();
        const snapshots: (boolean | undefined)[] = [];

        // Exercise both transition directions and repeated assignments of the independent text flag.
        for (const visible of [true, false, false, true]) {
          test.addStep(`Setting layer text visibility to ${visible} through LayerController.setLayerTextVisibility...`);
          this.getControllersRegistry().layerController.setLayerTextVisibility(layerPath, visible);
          const storeLayer = getStoreLayerLegendLayerByPath(this.getMapId(), layerPath);

          // Capture runtime and store values before the next text-visibility update.
          snapshots.push(gvLayer.getTextVisible(), storeLayer?.textVisible);
        }

        return { gvLayer, data: snapshots };
      },
      (test, result) => {
        test.addStep('Verifying runtime and store text-visibility transitions and repeated assignments...');
        Test.assertIsArrayEqual(result.data, [true, true, false, false, false, false, true, true]);
      },
      (test) => {
        // Clear the layer from the map and assert it was removed
        if (rootLayerPath) this.removeLayerConfigAndAssert(test, rootLayerPath);
      }
    );
  }

  /**
   * Tests WMS style assignments and ignored empty selections through the layer controller.
   *
   * @returns Runtime, source parameter, and legend-store style snapshots
   */
  testSetLayerWmsStyle(): Promise<Test<LayerTestResult<(string | undefined)[]>>> {
    let rootLayerPath: string | undefined;
    const style = TestConstants.DATACUBE_MSI_THRESHOLD_STYLE;

    return this.test(
      'Test LayerController.setLayerWmsStyle synchronizes runtime, WMS source, and legend store...',
      async (test) => {
        const gvLayer = await this.addLayerWMSWithDatacubeMSI(test, {
          onLayerPath: (rootPath): void => {
            rootLayerPath = rootPath;
          },
        });
        if (!(gvLayer instanceof GVWMS)) throw new TestError('The WMS style fixture must be a WMS layer');
        const source = gvLayer.getOLLayer().getSource();
        if (!source) throw new TestError('The WMS style fixture must have an OpenLayers source');
        const layerPath = gvLayer.getLayerPath();
        // Start from the WMS default so a no-op controller cannot pass by retaining the initial named style.
        gvLayer.setWmsStyle('');
        const snapshots: (string | undefined)[] = [
          gvLayer.getWmsStyle(),
          source.getParams().STYLES,
          getStoreLayerLegendLayerByPath(this.getMapId(), layerPath)?.wmsStyle,
        ];

        // Repeat the advertised style, then ensure empty selections preserve the active style.
        for (const selection of [style, style, undefined, '']) {
          test.addStep(`Setting WMS style to '${selection}' through LayerController.setLayerWmsStyle...`);
          this.getControllersRegistry().layerController.setLayerWmsStyle(layerPath, selection);
          const sourceStyle: unknown = source.getParams().STYLES;
          if (typeof sourceStyle !== 'string') throw new TestError('The WMS STYLES parameter must be a string');
          snapshots.push(gvLayer.getWmsStyle(), sourceStyle, getStoreLayerLegendLayerByPath(this.getMapId(), layerPath)?.wmsStyle);
        }

        return { gvLayer, data: snapshots };
      },
      (test, result) => {
        test.addStep('Verifying runtime, WMS STYLES, and legend-store values after each assignment...');
        Test.assertIsArrayEqual(result.data, ['', '', '', ...Array<string>(12).fill(style)]);
      },
      (test) => {
        // Clear the layer from the map and assert it was removed
        if (rootLayerPath) this.removeLayerConfigAndAssert(test, rootLayerPath);
      }
    );
  }
  /**
   * Tests the combined extent of GeoJSON, Esri Feature, Esri Dynamic, and WMS fixtures.
   *
   * @returns A promise resolving with individual bounds and combined extent observations
   */
  testGetExtentOfMultipleLayers(): Promise<Test<MultipleLayersExtentResult>> {
    const rootLayerPaths: string[] = [];
    const expectedExtentAll = [-19541079.422498688, 4268968.397697891, -1200639.4449692357, 18780693.365674984];
    const expectedExtentVectors = [-15490107.081926208, 5653062.530474714, -6097718.768649618, 10332401.648523508];
    const expectedExtentRasters = [-19541079.422498688, 4268968.397697891, -1200639.4449692357, 18780693.365674984];

    return this.test(
      'Test getExtentOfMultipleLayers with GeoJSON, Esri Feature, Esri Dynamic and WMS...',
      async (test) => {
        // Capture each cleanup path before awaiting loading, including partially loaded fixtures.
        const polygons = await this.addLayerGeoJSONWithMetadataPolygons(test, {
          onLayerPath: (rootPath): void => {
            rootLayerPaths.push(rootPath);
          },
        });

        const projects = await this.addLayerEsriFeatureTopProjects(test, {
          onLayerPath: (rootPath): void => {
            rootLayerPaths.push(rootPath);
          },
        });

        // Include a raster-backed ESRI layer alongside the two vector fixtures.
        const boundaries = await this.addLayerEsriDynamicGNWTBoundaries(test, {
          onLayerPath: (rootPath): void => {
            rootLayerPaths.push(rootPath);
          },
        });

        // Use a regional WMS fixture rather than the global Cities layer.
        const halifax = await this.addLayerWMSWithDatacubeRingOfFire(test, {
          onLayerPath: (rootPath): void => {
            rootLayerPaths.push(rootPath);
          },
        });

        // Loaded layers may still be initializing bounds; wait for each projected extent.
        const layers = [polygons, projects, boundaries, halifax];
        const bounds = await Promise.all(layers.map((layer) => layer.waitForBounds()));
        const { layerController } = this.getControllersRegistry();

        test.addStep('Combining the bounds of four different layer types...');
        const allExtent = await layerController.getExtentOfMultipleLayers([
          polygons.getLayerPath(),
          projects.getLayerPath(),
          boundaries.getLayerPath(),
          halifax.getLayerPath(),
        ]);

        // Check the vector pair separately so raster bounds cannot mask missing vector contributions.
        const vectorExtent = await layerController.getExtentOfMultipleLayers([polygons.getLayerPath(), projects.getLayerPath()]);

        // Check the vector pair separately so raster bounds cannot mask missing vector contributions.
        const rasterExtent = await layerController.getExtentOfMultipleLayers([boundaries.getLayerPath(), halifax.getLayerPath()]);

        // Return test results
        return { bounds, allExtent, vectorExtent, rasterExtent };
      },
      (test, result) => {
        test.addStep('Verifying four distinct layer types have finite bounds...');
        Test.assertIsEqual(result.bounds.length, 4);
        const validBounds: Extent[] = [];
        result.bounds.forEach((bounds) => {
          Test.assertIsDefined('fixture bounds', bounds);
          Test.assertIsEqual(bounds.length, 4);
          Test.assertIsEqual(bounds.every(Number.isFinite), true);
          Test.assertIsEqual(bounds[0] <= bounds[2] && bounds[1] <= bounds[3], true);
          validBounds.push(bounds);
        });

        test.addStep('Verifying the combined extent matches the union of all fixture bounds...');
        Test.assertIsDefined('combined extent', result.allExtent);
        Test.assertIsArrayEqual(result.allExtent, expectedExtentAll);
        Test.assertIsDefined('vector extent', result.vectorExtent);
        Test.assertIsArrayEqual(result.vectorExtent, expectedExtentVectors);
        Test.assertIsDefined('raster extent', result.rasterExtent);
        Test.assertIsArrayEqual(result.rasterExtent, expectedExtentRasters);
      },
      (test) => {
        // Clear the layer from the map and assert it was removed
        rootLayerPaths.reverse().forEach((layerPath) => this.removeLayerConfigAndAssert(test, layerPath));
      }
    );
  }
  /**
   * Tests object injection followed by JSON-string replacement through the public API.
   *
   * @returns Source and query snapshots after both injections
   */
  testSetGeojsonSourceReplacesFeatures(): Promise<Test<GeojsonInjectionResult>> {
    return this.#testGeojsonSource(false);
  }

  /**
   * Tests that injected replacement features survive a map projection change.
   *
   * @returns Injection snapshots including the reprojected source
   */
  testSetGeojsonSourceReprojectsFeatures(): Promise<Test<GeojsonInjectionResult>> {
    return this.#testGeojsonSource(true);
  }

  // #region GEOCORE CUSTOM CONFIG

  /**
   * Tests adding a geocore layer with an inline listOfLayerEntryConfig override.
   *
   * @returns A promise that resolves when the test completes
   */
  testAddGeocoreWithInlineListOfLayerEntryConfigOverride(): Promise<Test<string>> {
    const customGeoviewLayerName = 'Issue 3548 - Inline GeoCore Override';
    const customLayerNameGroup = 'Issue 3548 - Main Group';
    const customLayerNameChild = 'Issue 3548 - Child Layer';
    const customLayerEntryConfig = JSON.stringify([
      {
        geoviewLayerName: customGeoviewLayerName,
        listOfLayerEntryConfig: [
          {
            layerId: '0',
            entryType: 'group',
            layerName: customLayerNameGroup,
            listOfLayerEntryConfig: [
              {
                layerId: '1',
                layerName: customLayerNameChild,
                initialSettings: {
                  states: {
                    visible: false,
                  },
                },
              },
            ],
          },
        ],
      },
    ]);

    let rootLayerPath: string | undefined;
    return this.test(
      'Test geocore inline listOfLayerEntryConfig override',
      async (test) => {
        // Add the geoview layer by geocore uuid
        const layer = await this.addLayerEsriDynamicAirborneViaGeocore(test, customLayerEntryConfig, undefined, {
          onLayerPath: (rootPath): void => {
            rootLayerPath = rootPath;
          },
        }); // `${TestConstants.AIRBORNE_RADIOACTIVITY_UUID}/0/1`

        // Create map config from map state
        return layer.getLayerPath();
      },
      (test, result) => {
        // Verify the layer exists
        LayerTester.#assertCheckLayerExistsInPanels(test, this.getMapId(), result);

        // Get the layer
        const childLayer = this.getControllersRegistry().layerController.getGeoviewLayer(result);

        Test.assertIsDefined('childLayer', childLayer);
        Test.assertIsEqual(childLayer.getLayerConfig().layerId, '1');
        Test.assertIsEqual(childLayer.getGeoviewLayerName(), customGeoviewLayerName);
        Test.assertIsEqual(childLayer.getLayerName(), customLayerNameChild);
        Test.assertIsEqual(childLayer.getVisible(), false);

        // Get the parent
        const parentLayer = childLayer.getParent();

        test.addStep('Verifying custom geoviewLayerName override is applied...');
        Test.assertIsDefined('parentLayer', parentLayer);
        Test.assertIsEqual(parentLayer.getLayerConfig().layerId, '0');
        Test.assertIsEqual(parentLayer.getGeoviewLayerName(), customGeoviewLayerName);
        Test.assertIsEqual(parentLayer.getLayerName(), customLayerNameGroup);
      },
      (test) => {
        // Clear the layer from the map and assert it was removed
        if (rootLayerPath) this.removeLayerConfigAndAssert(test, rootLayerPath);
      }
    );
  }

  /**
   * Tests adding a geocore layer with a simplified inline name override.
   *
   * @returns A promise that resolves when the test completes
   */
  testAddGeocoreWithSimplifiedInlineLayerNameOverride(): Promise<Test<string>> {
    const customLayerName = 'Issue 3548 - Simplified Inline Name';
    const customLayerEntryConfig = JSON.stringify([
      {
        layerName: customLayerName,
      },
    ]);

    let rootLayerPath: string | undefined;
    return this.test(
      'Test geocore simplified inline layerName override precedence',
      async (test) => {
        // Add the geoview layer by geocore uuid
        const addedLayer = await this.addLayerWMSMajorEconomicPointViaGeocore(test, customLayerEntryConfig, undefined, {
          onLayerPath: (rootPath): void => {
            rootLayerPath = rootPath;
          },
        });

        // Create map config from map state
        return addedLayer.getLayerPath();
      },
      (test, result) => {
        // Verify the layer exists
        LayerTester.#assertCheckLayerExistsInPanels(test, this.getMapId(), result);

        // Get the layer
        const layer = this.getControllersRegistry().layerController.getGeoviewLayer(result);

        test.addStep('Verifying simplified inline layerName override is applied...');
        Test.assertIsEqual(layer.getLayerName(), customLayerName);
      },
      (test) => {
        // Clear the layer from the map and assert it was removed
        if (rootLayerPath) this.removeLayerConfigAndAssert(test, rootLayerPath);
      }
    );
  }

  /**
   * Tests an inline GeoCore land-cover entry override with a custom name and collapsed, hidden initial states.
   *
   * @returns A promise resolving with the selected layer and its initial store and configuration observations
   */
  testAddGeocoreWithInlineLandCoverEntryOverride(): Promise<Test<LayerTestResult<LandCoverOverrideResult>>> {
    const layerId = TestConstants.GEOCORE_LAND_COVER_LAYER_ID;
    const layerName = '2010 Land Cover of Canada';
    const customLayerEntryConfig = JSON.stringify([
      {
        layerId,
        layerName,
        initialSettings: {
          states: {
            legendCollapsed: true,
            visible: false,
          },
        },
      },
    ]);
    let rootLayerPath: string | undefined;

    return this.test(
      'Test GeoCore land-cover inline layer entry name and initial states...',
      async (test) => {
        test.addStep('Adding the GeoCore land-cover record with the inline entry configuration...');
        const gvLayer = await this.addLayerWMSLancoverViaGeocore(test, customLayerEntryConfig, undefined, {
          onLayerPath: (rootPath): void => {
            rootLayerPath = rootPath;
          },
        });

        const layerPath = gvLayer.getLayerPath();

        test.addStep(`Waiting for the selected land-cover entry '${layerPath}' and its legend store entry...`);
        await whenThisThen(() => getStoreLayerLegendLayerByPath(this.getMapId(), layerPath), TestConstants.UI_STATE_TIMEOUT_MS);

        // Inspect the store directly rather than requiring the panel boxes to be rendered.
        const legendLayer = getStoreLayerLegendLayerByPath(this.getMapId(), layerPath);
        return {
          gvLayer,
          data: {
            layerId: gvLayer.getLayerConfig().layerId,
            layerName: gvLayer.getLayerName(),
            visible: gvLayer.getVisible(),
            legendName: legendLayer?.layerName,
            legendVisible: legendLayer?.visible,
            legendCollapsed: legendLayer?.legendCollapsed,
            initialStates: gvLayer.getLayerConfig().getInitialSettings()?.states,
          },
        };
      },
      (test, result) => {
        test.addStep('Verifying the selected entry and custom layer name...');
        Test.assertIsEqual(result.data.layerId, layerId);
        Test.assertIsEqual(result.data.layerName, layerName);
        Test.assertIsEqual(result.data.legendName, layerName);

        // Check the configured values as well as runtime and store state, without changing either state.
        test.addStep('Verifying the configured and applied hidden and collapsed states...');
        Test.assertIsEqual(result.data.initialStates?.visible, false);
        Test.assertIsEqual(result.data.initialStates?.legendCollapsed, true);
        Test.assertIsEqual(result.data.visible, false);
        Test.assertIsEqual(result.data.legendVisible, false);
        Test.assertIsEqual(result.data.legendCollapsed, true);
      },
      (test) => {
        // Clear the layer from the map and assert it was removed
        if (rootLayerPath) this.removeLayerConfigAndAssert(test, rootLayerPath);
      }
    );
  }

  /**
   * Tests a GeoCore CESI override containing two named groups and nested initial states.
   *
   * @returns A promise resolving with the group structure and initial-state observations
   */
  testAddGeocoreWithInlineCesiGroupOverrides(): Promise<Test<CesiGroupOverrideResult>> {
    const quantityName = 'CESI - Water Quantity Group';
    const qualityName = 'CESI - Water Quality Group';
    const customLayerEntryConfig = JSON.stringify([
      {
        layerId: '0',
        entryType: 'group',
        layerName: quantityName,
        listOfLayerEntryConfig: [{ layerId: '1', initialSettings: { states: { visible: false } } }],
      },
      {
        layerId: '4',
        entryType: 'group',
        layerName: qualityName,
        initialSettings: { states: { visible: false, legendCollapsed: true } },
        listOfLayerEntryConfig: [{ layerId: '5' }],
      },
    ]);
    const customLayerPathWaterQuantity = `${TestConstants.GEOCORE_CESI_UUID}/base-group/0/1`;

    let rootLayerPath: string | undefined;
    return this.test(
      'Test GeoCore CESI inline group names, children and initial states...',
      async (test) => {
        const layerWaterQuantity = await this.addLayerEsriDynamicCESIViaGeocore(
          test,
          customLayerEntryConfig,
          customLayerPathWaterQuantity,
          {
            onLayerPath: (rootPath): void => {
              rootLayerPath = rootPath;
            },
          }
        );
        const customLayerPathWaterQuality = `${layerWaterQuantity.getGeoviewLayerId()}/base-group/4/5`;
        const layerWaterQuality = await this.waitLayerAtLayerPath<GVEsriDynamic>(test, customLayerPathWaterQuality);
        const layerWaterQuantityGroup = layerWaterQuantity.getParent()!;
        const layerWaterQualityGroup = layerWaterQuality.getParent()!;

        test.addStep('Waiting for the quality group to apply its initial visibility...');
        await whenThisThen(() => {
          if (layerWaterQualityGroup.getLayerStatus() === 'error') throw new TestError('CESI quality group failed to load');
          return layerWaterQualityGroup.loadedOnce;
        }, TestConstants.UI_STATE_TIMEOUT_MS);

        const layerPathQuantity = layerWaterQuantity.getLayerPath();
        const layerPathQuantityGroup = layerWaterQuantityGroup.getLayerPath();
        const layerPathQuality = layerWaterQuality.getLayerPath();
        const layerPathQualityGroup = layerWaterQualityGroup.getLayerPath();

        // Inspect the store without changing the configured collapsed state.
        await whenThisThen(
          () =>
            [layerPathQuantity, layerPathQuantityGroup, layerPathQuality, layerPathQualityGroup].every(
              (path) => getStoreLayerLegendLayerByPath(this.getMapId(), path) !== undefined
            ),
          TestConstants.UI_STATE_TIMEOUT_MS
        );
        const storeWaterQuantity = getStoreLayerLegendLayerByPath(this.getMapId(), layerPathQuantity);
        const storeWaterQuantityGroup = getStoreLayerLegendLayerByPath(this.getMapId(), layerPathQuantityGroup);
        const storeWaterQuality = getStoreLayerLegendLayerByPath(this.getMapId(), layerPathQuality);
        const storeWaterQualityGroup = getStoreLayerLegendLayerByPath(this.getMapId(), layerPathQualityGroup);

        return {
          quantityName: layerWaterQuantity.getLayerName(),
          quantityGroupName: layerWaterQuantityGroup.getLayerName(),
          quantityInitialVisible: layerWaterQuantity.getLayerConfig().getInitialSettings()?.states?.visible,
          quantityVisible: layerWaterQuantity.getVisible(),
          quantityStoreVisible: storeWaterQuantity?.visible,
          quantityInitialCollapsed: layerWaterQuantityGroup.getLayerConfig().getInitialSettings()?.states?.legendCollapsed,
          quantityCollapsed: storeWaterQuantityGroup?.legendCollapsed,
          quantityStoreCollapsed: storeWaterQuantity?.legendCollapsed,
          qualityName: layerWaterQuality.getLayerName(),
          qualityGroupName: layerWaterQualityGroup.getLayerName(),
          qualityInitialVisible: layerWaterQualityGroup.getLayerConfig().getInitialSettings()?.states?.visible,
          qualityVisible: layerWaterQualityGroup.getVisible(),
          qualityStoreVisible: storeWaterQualityGroup?.visible,
          qualityInitialCollapsed: layerWaterQualityGroup.getLayerConfig().getInitialSettings()?.states?.legendCollapsed,
          qualityCollapsed: storeWaterQualityGroup?.legendCollapsed,
          qualityStoreCollapsed: storeWaterQuality?.legendCollapsed,
        };
      },
      (test, result) => {
        test.addStep('Verifying the two group names and the exact configured child hierarchy...');
        Test.assertIsEqual(result.quantityGroupName, quantityName);
        Test.assertIsEqual(result.qualityGroupName, qualityName);

        test.addStep('Verifying configured, runtime and legend-store visibility and collapsed state...');
        Test.assertIsEqual(result.quantityInitialVisible, false);
        Test.assertIsEqual(result.quantityVisible, false);
        Test.assertIsEqual(result.quantityStoreVisible, false);
        Test.assertIsEqual(result.qualityInitialVisible, false);
        Test.assertIsEqual(result.qualityInitialCollapsed, true);
        Test.assertIsEqual(result.qualityVisible, false);
        Test.assertIsEqual(result.qualityStoreVisible, false);
        Test.assertIsEqual(result.qualityCollapsed, true);
      },
      (test) => {
        // Clear the layer from the map and assert it was removed
        if (rootLayerPath) this.removeLayerConfigAndAssert(test, rootLayerPath);
      }
    );
  }

  /**
   * Tests an inline GeoCore IAAC group override and the distinct initial states of its three children.
   *
   * @returns A promise resolving with the group and child state observations
   */
  testAddGeocoreWithInlineIAACGroupOverride(): Promise<Test<IaacGroupOverrideResult>> {
    const groupName = 'IAAC Projects';
    const customLayerEntryConfig = JSON.stringify([
      {
        entryType: 'group',
        layerName: groupName,
        listOfLayerEntryConfig: [
          { layerId: '0', initialSettings: { states: { legendCollapsed: true, visible: false } } },
          { layerId: '1', initialSettings: { states: { legendCollapsed: false, visible: true } } },
          { layerId: '2', initialSettings: { states: { legendCollapsed: true, visible: false } } },
        ],
      },
    ]);

    let rootLayerPath: string | undefined;
    return this.test(
      'Test GeoCore IAAC inline group name and child initial states...',
      async (test) => {
        test.addStep('Adding the IAAC GeoCore record with the custom group and three child entries...');
        const group = await this.addLayerIAACInlineViaGeocore(test, customLayerEntryConfig, {
          onLayerPath: (root) => {
            rootLayerPath = root;
          },
        });

        // Get the group
        const childPaths = group.getLayersAllLeafs().map((layer) => layer.getLayerPath());

        // The API supplies base-group when the inline group has no explicit layerId.
        test.addStep('Waiting for the configured children...');
        const children = await Promise.all(childPaths.map((path) => this.waitLayerAtLayerPath(test, path)));

        // Inspect the store directly without changing the requested collapsed states.
        test.addStep('Waiting for the group and child legend entries...');
        await whenThisThen(
          () => [group.getLayerPath(), ...childPaths].every((path) => getStoreLayerLegendLayerByPath(this.getMapId(), path) !== undefined),
          TestConstants.UI_STATE_TIMEOUT_MS
        );

        return {
          groupId: group.getLayerConfig().layerId,
          groupName: group.getLayerName(),
          groupLegendName: getStoreLayerLegendLayerByPath(this.getMapId(), group.getLayerPath())?.layerName,
          childIds: group.getLayers().map((child) => child.getLayerConfig().layerId),
          children: children.map((child) => {
            const legend = getStoreLayerLegendLayerByPath(this.getMapId(), child.getLayerPath());
            return {
              id: child.getLayerConfig().layerId,
              initialVisible: child.getLayerConfig().getInitialSettings()?.states?.visible,
              initialCollapsed: child.getLayerConfig().getInitialSettings()?.states?.legendCollapsed,
              visible: child.getVisible(),
              storeVisible: legend?.visible,
              storeCollapsed: legend?.legendCollapsed,
            };
          }),
        };
      },
      (test, result) => {
        test.addStep('Verifying the generated group, custom name, and exact child order...');
        Test.assertIsEqual(result.groupId, 'base-group');
        Test.assertIsEqual(result.groupName, groupName);
        Test.assertIsEqual(result.groupLegendName, groupName);
        Test.assertIsArrayEqual(result.childIds, ['0', '1', '2']);
        Test.assertIsArrayLengthEqual(result.children, 3);

        // Check each explicitly supplied true and false value against configuration, runtime and store.
        test.addStep('Verifying each child initial visibility and legend collapsed state...');
        result.children.forEach((child, index) => {
          const expectedVisible = index === 1;
          Test.assertIsEqual(child.id, String(index));
          Test.assertIsEqual(child.initialVisible, expectedVisible);
          Test.assertIsEqual(child.initialCollapsed, !expectedVisible);
          Test.assertIsEqual(child.visible, expectedVisible);
          Test.assertIsEqual(child.storeVisible, expectedVisible);
          Test.assertIsEqual(child.storeCollapsed, !expectedVisible);
        });
      },
      (test) => {
        // Clear the layer from the map and assert it was removed
        if (rootLayerPath) this.removeLayerConfigAndAssert(test, rootLayerPath);
      }
    );
  }

  // #endregion GEOCORE CUSTOM CONFIG

  // #region LAYER FUNCTIONS

  /**
   * Tests that zooming to the extent of a GeoJSON layer with one point feature succeeds.
   *
   * @returns A promise that resolves with the loaded GeoJSON layer
   */
  testZoomExtentWithOneFeature(): Promise<Test<AbstractBaseGVLayer>> {
    let rootLayerPath: string | undefined;
    // Test
    return this.test(
      `Test zoom to extent on GeoJSON with only one point feature...`,
      async (test) => {
        // Add the fixture and wait for its selected layer to be ready
        const layer = await this.addLayerGeoJSONSinglePoint(test, {
          onLayerPath: (rootPath): void => {
            rootLayerPath = rootPath;
          },
        });
        const layerPath = layer.getLayerPath();

        // Wait for the bounds to be processed
        await layer.waitForBounds();

        // Call zoom to layer extent, it should work
        await this.getControllersRegistry().layerController.zoomToLayerExtent(layerPath, TestConstants.USE_ZOOM_ANIMATION);

        // Return the layer
        return layer;
      },
      (test, result) => {
        // Check the bounds on the layer
        test.addStep('Reading the bounds on the layer...');
        Test.assertIsDefined('bounds', result.getBounds());
      },
      (test) => {
        // Clear the layer from the map and assert it was removed
        if (rootLayerPath) this.removeLayerConfigAndAssert(test, rootLayerPath);
      }
    );
  }

  /**
   * Tests that zooming to the extent of a GeoJSON layer without features throws a NoBoundsError.
   *
   * @returns A promise that resolves when the test completes
   */
  testZoomExtentWithoutFeatures(): Promise<Test<NoBoundsError>> {
    let rootLayerPath: string | undefined;

    // Test
    return this.testError(
      `Test zoom to extent on GeoJSON without features...`,
      NoBoundsError,
      async (test) => {
        // Capture the cleanup path before either fixture readiness promise can reject.
        const fixtureLayer = await this.addLayerGeoJSONBlank(test, {
          onLayerPath: (rootPath): void => {
            rootLayerPath = rootPath;
          },
        });

        // Call zoom to layer extent, it should throw a NoBoundsError
        await this.getControllersRegistry().layerController.zoomToLayerExtent(
          fixtureLayer.getLayerPath(),
          TestConstants.USE_ZOOM_ANIMATION
        );
      },
      undefined,
      (test) => {
        // Clear the layer from the map and assert it was removed
        if (rootLayerPath) this.removeLayerConfigAndAssert(test, rootLayerPath);
      }
    );
  }

  /**
   * Tests that zooming to the extent of a featureless GeoJSON layer succeeds when an extent is configured.
   *
   * @returns A promise that resolves with the loaded GeoJSON layer
   */
  testZoomExtentWithoutFeaturesWithConfiguredExtent(): Promise<Test<AbstractBaseGVLayer>> {
    let rootLayerPath: string | undefined;
    // Test
    return this.test(
      `Test zoom to extent on GeoJSON without features but a configured extent...`,
      async (test) => {
        // Add the fixture and wait for its selected layer to be ready
        const layer = await this.addLayerGeoJSONBlankWithConfiguredExtent(test, {
          onLayerPath: (rootPath): void => {
            rootLayerPath = rootPath;
          },
        });
        const layerPath = layer.getLayerPath();

        // Wait for the bounds to be processed
        await layer.waitForBounds();

        // Call zoom to layer extent, it should work
        await this.getControllersRegistry().layerController.zoomToLayerExtent(layerPath, TestConstants.USE_ZOOM_ANIMATION);

        // Return the layer
        return layer;
      },
      (test, result) => {
        // Check the bounds on the layer
        test.addStep('Reading the bounds on the layer...');
        Test.assertIsDefined('bounds', result.getBounds());
      },
      (test) => {
        // Clear the layer from the map and assert it was removed
        if (rootLayerPath) this.removeLayerConfigAndAssert(test, rootLayerPath);
      }
    );
  }

  /**
   * Tests that feature-info queries still populate feature geometry when configured outfields omit geometry fields.
   *
   * The queried feature must retain an extent so zoom-to-feature workflows keep working with restricted outfield configs.
   *
   * @returns A promise that resolves with the fixture layer and feature results, or undefined data when no results are available
   */
  testFeatureHasGeometryWhenOutfieldsHasNoGeometryField(): Promise<Test<LayerTestResult<TypeFeatureInfoEntry[] | undefined>>> {
    let rootLayerPath: string | undefined;
    const clickCoordinate = [-86.395, 52.737];

    return this.test(
      `Test feature has geometry even when outfields configuration has no geometry field...`,
      async (test) => {
        // Add the fixture and wait for its selected layer to be ready
        const gvLayer = await this.addLayerEsriDynamicTopProjectsWithRestrictedOutfields(test, {
          onLayerPath: (rootPath): void => {
            rootLayerPath = rootPath;
          },
        });
        const layer = this.getControllersRegistry().layerController.getGeoviewLayerRegular(gvLayer.getLayerPath());

        // Query the layer at the given coordinates
        const data = await this.queryAtCoordinateRetrieveResultsForLayer(test, layer, clickCoordinate);
        return { gvLayer, data };
      },
      (test, result) => {
        // Check if the feature has a valid extent property
        test.addStep('Checking if the feature has a valid extent property...');
        const feature = result.data?.[0];
        Test.assertIsDefined('feature', feature);
        Test.assertIsDefined('feature.extent', feature.extent);
      },
      (test) => {
        // Clear the layer from the map and assert it was removed
        if (rootLayerPath) this.removeLayerConfigAndAssert(test, rootLayerPath);
      }
    );
  }

  /**
   * Tests that getGeoviewLayerByRootId resolves the first layer registered under a root id (issue #3633).
   *
   * When only a root id is known (e.g. a GeoCore UUID whose `uuid/<layerId>` path is resolved at runtime), an exact
   * lookup by the bare id fails, but getGeoviewLayerByRootId must return the first layer under that root id — which is
   * what lets the configured `selectedLayersLayerPath` pre-select a GeoCore layer.
   *
   * @returns A promise that resolves with the fixture layer and the layer resolved by its root ID
   */
  testGetGeoviewLayerByRootId(): Promise<Test<LayerTestResult<AbstractBaseGVLayer>>> {
    let rootLayerPath: string | undefined;
    return this.test(
      `Test getGeoviewLayerByRootId resolves the first layer under a root id...`,
      async (test) => {
        // Add the fixture and wait for its selected layer to be ready
        const gvLayer = await this.addLayerEsriDynamicHistoFloodEvents(test, {
          onLayerPath: (rootPath): void => {
            rootLayerPath = rootPath;
          },
        });

        // Root-id resolution must return the first layer under that id (this is the function under test)
        test.addStep('Resolving the first layer under the root id...');
        return { gvLayer, data: this.getMapViewer().layer.getGeoviewLayerByRootId(gvLayer.getGeoviewLayerId()) };
      },
      (test, result) => {
        // An exact lookup by the bare root id must not resolve (the real path is `${gvLayerId}/<layerId>`)
        test.addStep('Verifying the bare root id has no exact layer...');
        Test.assertIsUndefined('exactByRootId', this.getMapViewer().layer.getGeoviewLayerIfExists(result.gvLayer.getGeoviewLayerId()));

        // The resolved layer must be the first layer under the root id
        test.addStep('Verifying getGeoviewLayerByRootId resolved the first layer under the root id...');
        Test.assertIsDefined('resolved', result.data);
        Test.assertIsEqual(result.data.getLayerPath(), result.gvLayer.getLayerPath());
      },
      (test) => {
        // Clear the layer from the map and assert it was removed
        if (rootLayerPath) this.removeLayerConfigAndAssert(test, rootLayerPath);
      }
    );
  }

  /**
   * Tests that reloading a layer rebuilds it from scratch and keeps it at the same position in the layer order (issue #3666).
   *
   * Reload re-fetches metadata, re-validates the config, and recreates the GV layer. The previous implementation
   * re-added the rebuilt layer at the top of the ordered layers; this asserts the ordered layer paths are unchanged
   * after a middle layer is reloaded, and that the reloaded layer is present and loaded again.
   *
   * @returns A promise that resolves with the rebuilt layer, neighboring fixtures, and layer order snapshots
   */
  testReloadLayerPreservesPosition(): Promise<Test<LayerReloadPositionResult>> {
    const rootLayerPaths: string[] = [];

    return this.test(
      `Test reloading a layer preserves its position in the layer order...`,
      async (test) => {
        // Add three layers so there is a layer before and after the one being reloaded
        test.addStep('Adding three layers on the map...');
        const onLayerPath = (path: string): void => {
          rootLayerPaths.push(path);
        };
        const precedingLayer = await this.addLayerEsriDynamicHistoFloodEvents(test, { onLayerPath });
        const layerToReload = await this.addLayerEsriDynamicHistoFloodEvents(test, { onLayerPath });
        const followingLayer = await this.addLayerEsriDynamicHistoFloodEvents(test, { onLayerPath });

        // Get the layer of the layer to reload
        const layerPath = layerToReload.getLayerPath();

        // Capture the order before reloading (navigation to a value, the reload below is the act under test)
        const before = [...getStoreLayerOrderedLayerPaths(this.getMapId())];

        // The act: reload the middle layer and wait for the rebuild to finish
        test.addStep('Reloading the middle layer from scratch...');
        await this.getControllersRegistry().layerCreatorController.reloadLayer(layerPath);

        // Wait for the rebuilt layer to be registered and loaded again
        const gvLayer = await this.waitLayerAtLayerPath(test, layerPath);

        // Return the ordered layer paths after the reload
        return { gvLayer, precedingLayer, followingLayer, before, after: [...getStoreLayerOrderedLayerPaths(this.getMapId())] };
      },
      (test, result) => {
        // The reload must not change the layer order (the middle layer stays in the middle)
        test.addStep('Verifying the ordered layer paths are unchanged after the reload...');
        Test.assertIsArrayEqual(result.after, result.before);

        // The reloaded layer must have been rebuilt and be present again
        test.addStep('Verifying the reloaded layer is present and loaded...');
        const layerPath = result.gvLayer.getLayerPath();
        Test.assertIsDefined('reloadedLayer', this.getMapViewer().layer.getGeoviewLayerIfExists(layerPath));
        Test.assertArrayIncludes(this.getControllersRegistry().layerController.getGeoviewLayerPaths(), layerPath);
      },
      (test) => {
        // Clear the layer from the map and assert it was removed
        rootLayerPaths.forEach((layerPath) => this.removeLayerConfigAndAssert(test, layerPath));
      }
    );
  }

  /**
   * Tests that ESRI Dynamic identify pairs each returned feature's geometry to its own OBJECTID (issue #3636).
   *
   * At a shared boundary/junction, identify returns multiple coincident polygons while the separate geometry query
   * returns them in OBJECTID order. A previous positional assignment gave each entry a neighbour's geometry, so the
   * highlighted polygon didn't match the attributes shown in Details. This queries a known junction and asserts that
   * each returned entry's geometry matches the ground-truth geometry independently fetched for that entry's own
   * OBJECTID (extent centers within tolerance — far below inter-territory distances).
   *
   * @returns A promise that resolves with the fixture layer and per-feature geometry comparisons
   */
  testEsriDynamicJunctionGeometryPairing(): Promise<Test<LayerTestResult<{ comparisons: { oid: number; distance: number }[] }>>> {
    let rootLayerPath: string | undefined;
    const junctionLonLat = TestConstants.GNWT_BOUNDARIES_JUNCTION_LONLAT;

    return this.test(
      `Test ESRI Dynamic junction geometry pairs to its own OBJECTID...`,
      async (test) => {
        // Add the fixture and wait for its selected layer to be ready
        const gvLayer = await this.addLayerEsriDynamicGNWTBoundaries(test, {
          onLayerPath: (rootPath): void => {
            rootLayerPath = rootPath;
          },
        });
        const layer = this.getControllersRegistry().layerController.getGeoviewLayerRegular(gvLayer.getLayerPath()) as GVEsriDynamic;

        // Use the map's non-zoomed home extent so the identify pixel tolerance sweeps a wide enough ground area to
        // return all the coincident polygons meeting at the junction (a tight zoom returns only the closest 2)
        test.addStep('Zooming to the initial (home) extent...');
        await this.getControllersRegistry().mapController.zoomToInitialExtent(false);

        // Query exactly at the shared boundary/junction
        test.addStep('Querying at the junction coordinate...');
        const results = (await this.queryAtCoordinateRetrieveResultsForLayer(test, layer, junctionLonLat)) ?? [];

        // Ground truth: fetch each returned OBJECTID's own geometry (in the map projection) and measure the distance
        // between its extent center and the paired entry's extent center
        test.addStep('Fetching ground-truth geometry per OBJECTID and measuring pairing...');
        const outSR = this.getMapViewer().getProjectionNumber();
        const oidField = layer.getLayerConfig().getOutfieldsPKNameOrDefault('OBJECTID');

        const comparisons = await Promise.all(
          results.map(async (entry) => {
            const oid = Number(String(entry.feature?.get(oidField) ?? entry.fieldInfo?.[oidField]?.value).replace(',', ''));

            // Independently fetch this OBJECTID's true geometry in the same projection as the map
            const truth = await layer.getRecordsByOIDs([oid], outSR);
            const truthExtent = truth[0]?.geometry?.getExtent();
            const entryExtent = entry.extent;

            // Distance between extent centers (missing extents -> Infinity so the assertion fails loudly)
            let distance = Number.POSITIVE_INFINITY;
            if (truthExtent && entryExtent) {
              const truthCenterX = (truthExtent[0] + truthExtent[2]) / 2;
              const truthCenterY = (truthExtent[1] + truthExtent[3]) / 2;
              const entryCenterX = (entryExtent[0] + entryExtent[2]) / 2;
              const entryCenterY = (entryExtent[1] + entryExtent[3]) / 2;
              distance = Math.hypot(entryCenterX - truthCenterX, entryCenterY - truthCenterY);
            }
            return { oid, distance };
          })
        );

        return { gvLayer, data: { comparisons } };
      },
      (test, result) => {
        // The junction must return multiple coincident features to exercise the pairing
        test.addStep('Verifying the junction returned multiple coincident features...');
        Test.assertIsArrayLengthMinimal(result.data.comparisons, 2);

        // Each entry's paired geometry must belong to its own OBJECTID (center within tolerance of ground truth)
        result.data.comparisons.forEach((comparison) => {
          test.addStep(`Verifying geometry pairing for OBJECTID ${comparison.oid} (distance ${Math.round(comparison.distance)} m)...`);
          Test.assertIsEqualWithinTolerance(comparison.distance, 0, TestConstants.JUNCTION_PAIRING_TOLERANCE_METERS);
        });
      },
      async (test) => {
        // Restore the initial view then remove the layer
        await this.getControllersRegistry().mapController.zoomToInitialExtent(false);

        // Clear the layer from the map and assert it was removed
        if (rootLayerPath) this.removeLayerConfigAndAssert(test, rootLayerPath);
      }
    );
  }

  /**
   * Tests querying a WMS layer through its associated WFS service for a city feature.
   *
   * The test configures the WMS layer with its corresponding WFS layer identifier,
   * performs a map query at a known Quebec coordinate, and verifies that the returned
   * feature result includes both feature data and geometry.
   *
   * @returns A promise that resolves with the fixture layer and WMS feature-query results
   */
  testQueryWMSLayerForWFSFeaturesCities(): Promise<Test<LayerTestResult<TypeFeatureInfoEntry[] | undefined>>> {
    let rootLayerPath: string | undefined;
    const layerName = 'Cities';
    const clickCoordinate = [-71.35, 46.7]; // Quebec

    return this.test(
      `Test WMS query at lon/lat via associated WFS service ${layerName}...`,
      async (test) => {
        // Add the fixture and wait for its selected layer to be ready
        const gvLayer = await this.addLayerWMSCitiesWithWFS(test, {
          onLayerPath: (rootPath): void => {
            rootLayerPath = rootPath;
          },
        });
        const layer = this.getControllersRegistry().layerController.getGeoviewLayerRegular(gvLayer.getLayerPath());

        // Query the layer at the given coordinates
        const data = await this.queryAtCoordinateRetrieveResultsForLayer(test, layer, clickCoordinate);
        return { gvLayer, data };
      },
      (test, result) => {
        const resultCities = result.data;

        // Check if the feature has a valid extent property
        test.addStep('Checking for results in the query...');
        Test.assertIsDefined('resultCities', resultCities);
        Test.assertIsArrayLengthMinimal(resultCities, 1);
        Test.assertIsDefined('resultCities[0]', resultCities[0]);
        Test.assertIsDefined('resultCities[0].geometry', resultCities[0].geometry);
      },
      (test) => {
        // Clear the layer from the map and assert it was removed
        if (rootLayerPath) this.removeLayerConfigAndAssert(test, rootLayerPath);
      }
    );
  }

  /**
   * Tests querying the airborne radioactivity WMS layer through its associated WFS service.
   *
   * The test is skipped when the test environment is not connected to the required VPN.
   * When the VPN is available, it adds the WMS layer, queries a known Quebec coordinate,
   * and verifies the feature-query response shape.
   *
   * @param isRunningOnVPN - Whether the test environment can access the VPN-only service
   * @returns A promise that resolves with the fixture layer and WMS feature-query results
   */
  testQueryWMSLayerForWFSFeaturesAirborne(isRunningOnVPN: boolean): Promise<Test<LayerTestResult<TypeFeatureInfoEntry[] | undefined>>> {
    let rootLayerPath: string | undefined;
    const layerName = 'Airborne Radioactivity';
    const clickCoordinate = [-71.35, 46.7]; // Quebec

    // Test
    return this.test(
      `Test WMS query at lon/lat via associated WFS service ${layerName}...`,
      async (test) => {
        // If not running on VPN, skip it
        if (!isRunningOnVPN) {
          throw new TestSkippedError('Not running on VPN');
        }

        // Add the fixture and wait for its selected layer to be ready
        const gvLayer = await this.addLayerWMSAirborneWithWFS(test, {
          onLayerPath: (rootPath): void => {
            rootLayerPath = rootPath;
          },
        });

        // This layer is only visible within a certain zoom range, so zoom in before interacting with it.
        await this.getControllersRegistry().mapController.zoomMap(4, TestConstants.USE_ZOOM_ANIMATION);

        // Get the layer
        const layer = this.getControllersRegistry().layerController.getGeoviewLayerRegular(gvLayer.getLayerPath());

        // Query the layer at the given coordinates
        const data = await this.queryAtCoordinateRetrieveResultsForLayer(test, layer, clickCoordinate);
        return { gvLayer, data };
      },
      (test, result) => {
        const resultAirborne = result.data;

        // Check if the feature has a valid extent property
        test.addStep('Checking for results in the query...');
        Test.assertIsDefined('resultAirborne', resultAirborne);
        Test.assertIsArrayLengthMinimal(resultAirborne, 1);
        Test.assertIsDefined('resultAirborne[0]', resultAirborne[0]);
        Test.assertIsDefined('resultAirborne[0].geometry', resultAirborne[0].geometry);
      },
      (test) => {
        // If the test was running
        if (isRunningOnVPN) {
          // Clear the layer from the map and assert it was removed
          if (rootLayerPath) this.removeLayerConfigAndAssert(test, rootLayerPath);
        }
      }
    );
  }

  // #endregion LAYER FUNCTIONS

  // #region PRIVATE METHODS

  /**
   * Adds the ZPEGT WMS group and verifies its resolved name and metadata-derived sublayer names.
   *
   * @param description - Test description shown in the test results
   * @param geoviewLayerName - Optional configured display name for the GeoView layer
   * @param includeAirport - Whether to include the airport layer as a sibling of ZPEGT
   * @param expectedGroupName - Expected runtime name of the resolved ZPEGT group
   * @param expectedParentName - Optional expected name of the immediate parent group
   * @returns A promise that resolves when the test completes
   */
  #testAddWMSZpegtGroup(
    description: string,
    geoviewLayerName: string | undefined,
    includeAirport: boolean,
    expectedGroupName: string,
    expectedParentName?: string
  ): Promise<Test<AbstractBaseGVLayer>> {
    let rootLayerPath: string | undefined;
    return this.test(
      description,
      (test) => {
        // Add the fixture and wait for its selected layer to be ready
        return this.addLayerWMSZpegtGroup(test, geoviewLayerName, includeAirport, {
          onLayerPath: (rootPath): void => {
            rootLayerPath = rootPath;
          },
        });
      },
      (test, result) => {
        // Verify the layer exists
        LayerTester.#assertCheckLayerExistsInStore(test, this.getMapId(), result.getLayerPath(), result.getLayerName());

        test.addStep('Verifying the resolved ZPEGT group name and metadata-derived sublayer names...');
        Test.assertIsInstance(result, GVGroupLayer);
        Test.assertIsEqual(result.getLayerName(), expectedGroupName);

        // Each direct child should have a metadata name, and those names should identify distinct sublayers.
        const children = result.getLayers();
        const childMetadataNames = children.map((childLayer) => childLayer.getLayerConfig().getLayerName());
        Test.assertIsArrayLengthMinimal(childMetadataNames, 2);
        childMetadataNames.forEach((name, index) => Test.assertIsDefined(`childMetadataNames[${index}]`, name));
        Test.assertIsEqual(new Set(childMetadataNames).size, childMetadataNames.length);

        const parents = result.getParents();
        if (expectedParentName) {
          // The sibling variant places ZPEGT beneath the named Transports group.
          Test.assertIsArrayLengthEqual(parents, 1);
          Test.assertIsEqual(parents[0].getLayerName(), expectedParentName);
        } else {
          Test.assertIsArrayLengthEqual(parents, 0);
        }
      },
      (test) => {
        // Clear the layer from the map and assert it was removed
        if (rootLayerPath) this.removeLayerConfigAndAssert(test, rootLayerPath);
      }
    );
  }
  /**
   * Exercises isolated public injections, optionally changing the shared map projection.
   *
   * @param reproject - Whether to switch map projection after replacement
   * @returns Immutable feature and query results for assertion
   */
  #testGeojsonSource(reproject: boolean): Promise<Test<GeojsonInjectionResult>> {
    let rootLayerPath: string | undefined;
    const mapViewer = this.getMapViewer();
    const initialProjection = getStoreMapStateJson(this.getMapId()).currentProjection;

    // The test switches only between projections supported by its coordinate fixtures.
    if (initialProjection !== 3978 && initialProjection !== 3857) throw new TestError('Unsupported test map projection');

    // Snapshot the shared map view because the projection variant must leave the map as it found it.
    const initialCenter = mapViewer.getView().getCenter()?.slice();
    const initialZoom = mapViewer.getView().getZoom();
    const initialRotation = mapViewer.getView().getRotation();

    // The first injection has two distinguishable features so replacement can be checked exactly.
    const originalCoordinates1 = [-75, 45];
    const originalCoordinates2 = [-80, 50];
    const original: GeoJSONObject = {
      type: 'FeatureCollection',
      features: [
        { type: 'Feature', id: 'original-1', properties: { Red: 11 }, geometry: { type: 'Point', coordinates: originalCoordinates1 } },
        { type: 'Feature', id: 'original-2', properties: { Red: 12 }, geometry: { type: 'Point', coordinates: originalCoordinates2 } },
      ],
    };

    // A single replacement makes stale features obvious in both the source and query results.
    const replacementCoordinates = [-100, 55];
    const replacement: GeoJSONObject = {
      type: 'FeatureCollection',
      features: [
        { type: 'Feature', id: 'replacement', properties: { Red: 33 }, geometry: { type: 'Point', coordinates: replacementCoordinates } },
      ],
    };

    let layer: AbstractBaseGVLayer | undefined;
    let loadedEvents = 0;
    // Count public injection completion events separately from the layer's initial load.
    const loadedHandler = (): void => {
      loadedEvents++;
    };

    return this.test(
      reproject
        ? 'Test public GeoJSON replacement features reproject after a map projection change...'
        : 'Test public GeoJSON object injection and JSON-string replacement...',
      async (test) => {
        // Add the fixture and wait for its selected layer to be ready
        layer = await this.addLayerGeoJSONBlank(test, {
          onLayerPath: (rootPath): void => {
            rootLayerPath = rootPath;
          },
        });
        if (!(layer instanceof GVGeoJSON)) throw new TestError('Expected a GeoJSON layer for injection');
        const layerPath = layer.getLayerPath();

        // Subscribe after initial layer setup so this count reflects the two injections and optional reinjection.
        layer.onLayerLoaded(loadedHandler);
        const allFeatureInfo = this.getControllersRegistry().layerSetController.allFeatureInfoLayerSet;

        // Wait until the query layer exists before triggering source updates that should refresh its results.
        await allFeatureInfo.waitForLayerToGetRegistered(layerPath);

        // The public API accepts a GeoJSON object; wait for its asynchronous query refresh before taking a snapshot.
        test.addStep('Awaiting public object injection and its asynchronous feature-info refresh...');
        await mapViewer.layer.setGeojsonSource(layerPath, original);
        await allFeatureInfo.waitForLayerQueryToFinish(layerPath);

        // Get the initial Geojson injection
        const initial = this.#snapshotGeojsonInjection(layer, loadedEvents);

        // Replace through the string overload to verify parsing and replacement, not feature accumulation.
        test.addStep('Replacing features using JSON-string input and the stored source projection...');
        await mapViewer.layer.setGeojsonSource(layerPath, JSON.stringify(replacement));
        await allFeatureInfo.waitForLayerQueryToFinish(layerPath);

        // Prepare the result object with the initial and replacement snapshots.
        const result: GeojsonInjectionResult = {
          gvLayer: layer,
          initial,
          replacement: this.#snapshotGeojsonInjection(layer, loadedEvents),
        };

        // If reprojecting
        if (reproject) {
          // The helper listens for the next loaded event before changing projection, avoiding a missed fast completion.
          test.addStep('Changing map projection and waiting for the injected layer to finish reinjection...');
          await LayerTester.#withGeojsonLoaded(layer, () =>
            this.getControllersRegistry().mapController.setProjection(initialProjection === 3978 ? 3857 : 3978)
          );
          // Projection switches reset table results, so query the reprojected source explicitly before snapshotting.
          await this.getControllersRegistry().layerSetController.triggerGetAllFeatureInfo(layerPath);
          result.reprojected = this.#snapshotGeojsonInjection(layer, loadedEvents);
        }

        // Return the final result of the GeoJSON injection, including any reprojected snapshot if applicable.
        return result;
      },
      (test, result) => {
        // Compare identities, values, coordinates, query contents, status, projection metadata, and completion counts.
        test.addStep('Verifying exact feature identities, properties, positions, loaded events and query replacement...');
        LayerTester.#assertGeojsonInjection(
          result.initial,
          [String(original.features[0].id ?? ''), String(original.features[1].id ?? '')],
          [original.features[0].properties?.Red, original.features[1].properties?.Red],
          [originalCoordinates1, originalCoordinates2],
          1
        );
        LayerTester.#assertGeojsonInjection(
          result.replacement,
          ['replacement'],
          [replacement.features[0].properties?.Red],
          [[-100, 55]],
          2
        );

        if (reproject) {
          Test.assertIsDefined('reprojected', result.reprojected);
          LayerTester.#assertGeojsonInjection(
            result.reprojected,
            ['replacement'],
            [replacement.features[0].properties?.Red],
            [replacementCoordinates],
            3
          );
        }
      },
      async (test, result) => {
        const gvLayer = result?.gvLayer ?? layer;
        // Remove the observer before teardown so layer removal cannot affect the injection event count.
        if (gvLayer instanceof AbstractGVLayer) {
          gvLayer.offLayerLoaded(loadedHandler);
        }

        try {
          // Clear the layer from the map and assert it was removed
          if (rootLayerPath) this.removeLayerConfigAndAssert(test, rootLayerPath);
        } finally {
          if (reproject) {
            // Restore the shared map state even when injection, assertions, or layer cleanup failed.
            await this.getControllersRegistry().mapController.setProjection(initialProjection);
            const view = mapViewer.getView();
            view.setCenter(initialCenter);
            if (initialZoom !== undefined) view.setZoom(initialZoom);
            this.getControllersRegistry().mapController.rotate(initialRotation, false);
            // Wait for rendering to settle before another test uses this map.
            await mapViewer.waitForRender();
          }
        }
      }
    );
  }

  /**
   * Captures source coordinates in longitude/latitude and the asynchronously refreshed query result.
   *
   * @param layer - Injected layer to inspect
   * @param loadedEvents - Number of injection completion events observed
   * @returns An immutable snapshot
   */
  #snapshotGeojsonInjection(layer: GVGeoJSON, loadedEvents: number): GeojsonInjectionSnapshot {
    const source = layer.getOLLayer().getSource();
    if (!(source instanceof GVVectorSource)) throw new TestError('Injected layer has no GeoView vector source');
    return {
      features: source.getFeatures().map((feature) => {
        const geometry = feature.getGeometry();
        if (!(geometry instanceof Point)) throw new TestError('Injected feature must have point geometry');
        return {
          id: feature.getId(),
          value: feature.get('Red'),
          lonlat: Projection.transformToLonLat(geometry.getCoordinates(), this.getMapViewer().getProjection()),
        };
      }),
      queryValues: (getStoreDataTableFeaturesByPath(this.getMapId(), layer.getLayerPath()) ?? []).map(
        (feature) => feature.fieldInfo.Red?.value
      ),
      status: layer.getLayerStatus(),
      sourceProjection: layer.getDataProjection()?.getCode(),
      storedProjectionIsObject: source.getDataProjection() instanceof OLProjection,
      loadedEvents,
    };
  }

  // #endregion PRIVATE METHODS

  // #region STATIC METHODS

  /**
   * Asserts that a layer has mounted entries in both the Legend and Layers panels.
   *
   * @param test - The test instance used to record the verification steps
   * @param mapId - The map identifier
   * @param layerPath - The full path of the layer to verify
   */
  static #assertCheckLayerExistsInPanels(test: Test, mapId: string, layerPath: string): void {
    // Use full paths rather than labels, which may be duplicated across concurrent fixtures.
    test.addStep(`Verifying layer '${layerPath}' exists in the Layers panel...`);
    Test.assertIsDefined(
      'layers panel layer',
      DomHelper.getLayerBoxInLayersPanel(mapId, layerPath, CONTAINER_TYPE.APP_BAR) ??
        DomHelper.getLayerBoxInLayersPanel(mapId, layerPath, CONTAINER_TYPE.FOOTER_BAR)
    );

    test.addStep(`Verifying layer '${layerPath}' exists in the Legend panel...`);
    Test.assertIsDefined(
      'legend panel layer',
      DomHelper.getLayerBoxInLegendPanel(mapId, layerPath, CONTAINER_TYPE.APP_BAR) ??
        DomHelper.getLayerBoxInLegendPanel(mapId, layerPath, CONTAINER_TYPE.FOOTER_BAR)
    );
  }

  /**
   * Asserts that a layer exists in the legend store and in both rendered panels.
   *
   * Logs the verification step in the test instance.
   * If `checkIconImage` or `checkIconsList` is provided, this method will also
   * verify that the layer's style has been applied by delegating to
   * `assertStyleApplied`.
   *
   * @param test - The test instance used to record the verification steps
   * @param mapId - The map id
   * @param layerPath - The path or ID of the layer to verify
   * @param layerName - Expected display name in the Layers panel
   * @param checkIconImage - Optional expected icon image.
   *   If provided, the function will additionally check that the legend contains a matching icon
   * @param checkIconsList - Optional list of expected legend icon items.
   *   If provided, the function will additionally verify that the legend's icon list matches this array
   */
  static #assertCheckLayerExistsInStore(
    test: Test<AbstractBaseGVLayer>,
    mapId: string,
    layerPath: string,
    layerName: string,
    checkIconImage?: string,
    checkIconsList?: Partial<TypeLegendItem>[]
  ): void {
    // Get the layer legend
    const legendLayer = getStoreLayerLegendLayerByPath(mapId, layerPath);

    // Verify the layer has a legend information
    test.addStep(`Verify the layer ${layerPath} has legend information...`);
    Test.assertIsDefined('legendLayer', legendLayer);

    // Store registration alone does not prove that either React panel rendered the layer.
    this.#assertCheckLayerExistsInPanels(test, mapId, layerPath);

    // Read the primary label rather than the whole row, which also contains controls and status text.
    test.addStep(`Verifying layer '${layerPath}' is named '${layerName}' in the Layers panel...`);
    Test.assertIsEqual(
      DomHelper.getLayerBoxLayerName(mapId, layerPath, CONTAINER_TYPE.APP_BAR) ??
        DomHelper.getLayerBoxLayerName(mapId, layerPath, CONTAINER_TYPE.FOOTER_BAR),
      layerName
    );

    // If checking the style
    if (checkIconImage || checkIconsList) {
      // Redirect
      this.#assertStyleApplied(test, mapId, layerPath, checkIconImage, checkIconsList);
    }
  }

  /**
   * Asserts that a layer with the given path has icons for its style.
   *
   * Logs the verification step in the test instance.
   * This validates that the layer's legend contains at least one icon and that the
   * first icon indicates a valid style (i.e., the icon image is present and not `"no data"`).
   * Optionally validates:
   * - that the first icon's image matches `checkIconImage`
   * - that the first icon's list of legend items matches `checkIconsList`
   *
   * @param test - The test instance used to record the verification steps
   * @param mapId - The map id
   * @param layerPath - The path or ID of the layer whose style icons are being verified
   * @param checkIconImage - Optional expected icon image to validate against the legend
   * @param checkIconsList - Optional expected list of legend icon items
   */
  static #assertStyleApplied(
    test: Test<AbstractBaseGVLayer>,
    mapId: string,
    layerPath: string,
    checkIconImage?: string,
    checkIconsList?: Partial<TypeLegendItem>[]
  ): void {
    // Get the layer legend from the store
    const legendLayer = getStoreLayerLegendLayerByPath(mapId, layerPath);

    // Verify the icon were also loaded for the layer
    test.addStep(`Verify the icons were loaded for the layer...`);
    Test.assertIsArrayLengthMinimal(legendLayer?.icons, 1);

    // Take the first one
    const firstIcon = legendLayer!.icons[0];
    const hasStyleIcon = firstIcon.iconImage && firstIcon.iconImage !== 'no data';
    Test.assertIsEqual(hasStyleIcon, true);

    // If checking the icon image
    if (checkIconImage) {
      // Verify the layer has icon image
      test.addStep(`Verify the legend has an icon image...`);
      Test.assertIsEqual(firstIcon.iconImage, checkIconImage);
    }

    // If comparing the icons list
    if (checkIconsList && firstIcon.iconList) {
      // Verify the layer has icons list
      test.addStep(`Verify each legend icon information...`);
      Test.assertIsArrayEqualJsons(firstIcon.iconList, checkIconsList);
    }
  }

  /**
   * Verifies an injection snapshot without repeating the injection operation.
   *
   * @param snapshot - Observed source and query state
   * @param ids - Expected feature identifiers
   * @param values - Expected Red properties
   * @param coordinates - Expected longitude/latitude positions
   * @param loadedEvents - Minimum expected completion events
   */
  static #assertGeojsonInjection(
    snapshot: GeojsonInjectionSnapshot,
    ids: string[],
    values: number[],
    coordinates: number[][],
    loadedEvents: number
  ): void {
    Test.assertIsArrayEqual(
      snapshot.features.map((feature) => feature.id),
      ids
    );
    Test.assertIsArrayEqual(
      snapshot.features.map((feature) => feature.value),
      values
    );
    Test.assertIsArrayEqual([...snapshot.queryValues].sort(), [...values].sort());
    Test.assertIsEqual(snapshot.status, 'loaded');
    Test.assertIsEqual(snapshot.sourceProjection, 'EPSG:4326');
    Test.assertIsEqual(snapshot.storedProjectionIsObject, true);
    Test.assertIsEqual(snapshot.loadedEvents >= loadedEvents, true);
    snapshot.features.forEach((feature, index) => {
      Test.assertIsEqualWithinTolerance(feature.lonlat[0], coordinates[index][0], 1e-6);
      Test.assertIsEqualWithinTolerance(feature.lonlat[1], coordinates[index][1], 1e-6);
    });
  }

  /**
   * Subscribes before a projection change so an already-loaded status cannot mask unfinished reinjection.
   *
   * @param layer - Layer whose next loading completion is required
   * @param action - Operation that starts reinjection
   */
  static async #withGeojsonLoaded(layer: GVGeoJSON, action: () => Promise<void>): Promise<void> {
    const completion = Promise.withResolvers<void>();
    const loaded = (): void => completion.resolve();
    const failed = (): void => completion.reject(new TestError('GeoJSON reinjection emitted a layer error'));
    const signal = AbortSignal.timeout(10000); // TODO: Fix this timeout
    const timedOut = (): void => completion.reject(new TestError('Timed out waiting for GeoJSON reinjection'));
    layer.onLayerLoaded(loaded);
    layer.onLayerError(failed);
    signal.addEventListener('abort', timedOut, { once: true });
    try {
      await Promise.all([action(), completion.promise]);
    } finally {
      layer.offLayerLoaded(loaded);
      layer.offLayerError(failed);
      signal.removeEventListener('abort', timedOut);
    }
  }

  // #endregion STATIC METHODS
}

// #region TYPES AND INTERFACES

/** IAAC group hierarchy and child initial-state snapshots. */
type IaacGroupOverrideResult = {
  groupId: string;
  groupName: string;
  groupLegendName: string | undefined;
  childIds: string[];
  children: {
    id: string;
    initialVisible: boolean | undefined;
    initialCollapsed: boolean | undefined;
    visible: boolean;
    storeVisible: boolean | undefined;
    storeCollapsed: boolean | undefined;
  }[];
};

/** CESI group hierarchy and initial-state snapshots. */
type CesiGroupOverrideResult = {
  quantityName: string;
  quantityGroupName: string;
  quantityInitialVisible: boolean | undefined;
  quantityVisible: boolean;
  quantityStoreVisible: boolean | undefined;
  quantityInitialCollapsed: boolean | undefined;
  /** Group legend state. */
  quantityCollapsed: boolean | undefined;
  /** Child legend state. */
  quantityStoreCollapsed: boolean | undefined;

  qualityName: string;
  qualityGroupName: string;
  qualityInitialVisible: boolean | undefined;
  qualityVisible: boolean;
  qualityStoreVisible: boolean | undefined;
  qualityInitialCollapsed: boolean | undefined;
  /** Group legend state. */
  qualityCollapsed: boolean | undefined;
  /** Child legend state. */
  qualityStoreCollapsed: boolean | undefined;
};

/** Land-cover entry configuration and initial runtime/store state. */
type LandCoverOverrideResult = {
  layerId: string;
  layerName: string;
  visible: boolean;
  legendName: string | undefined;
  legendVisible: boolean | undefined;
  legendCollapsed: boolean | undefined;
  initialStates: { visible?: boolean; legendCollapsed?: boolean } | undefined;
};

/** Individual fixture bounds and controller extent-union observations. */
type MultipleLayersExtentResult = {
  bounds: (Extent | undefined)[];
  allExtent?: Extent;
  rasterExtent?: Extent;
  vectorExtent?: Extent;
};

/** Runtime and legend-store observations after one parent or child opacity update. */
type LayerOpacitySnapshot = {
  /** Parent group's runtime opacity. */
  parentOpacity: number;
  /** Child's runtime opacity, capped by its parent. */
  childOpacity: number;
  /** Parent group's opacity in the legend store. */
  parentStoreOpacity: number | undefined;
  /** Requested child opacity in the legend store, which may exceed the runtime parent cap. */
  childStoreOpacity: number | undefined;
  /** Child's legend opacity limit inherited from its parent. */
  childMaxFromParent: number | undefined;
};

/** Fixture layer and observations returned by a layer behavior test. */
type LayerTestResult<T> = {
  /** Layer used to derive runtime paths for assertions and cleanup. */
  gvLayer: AbstractBaseGVLayer;

  /** Observations produced by the behavior under test. */
  data: T;
};

/** Reloaded layer, neighboring fixtures, and layer order snapshots. */
type LayerReloadPositionResult = {
  /** Rebuilt middle layer used to derive its runtime path. */
  gvLayer: AbstractBaseGVLayer;

  /** Fixture before the reloaded layer. */
  precedingLayer: AbstractBaseGVLayer;

  /** Fixture after the reloaded layer. */
  followingLayer: AbstractBaseGVLayer;

  /** Ordered paths captured before reloading. */
  before: string[];

  /** Ordered paths captured after reloading. */
  after: string[];
};

/** Immutable source and query snapshots after an injection. */
type GeojsonInjectionSnapshot = {
  features: { id: string | number | undefined; value: unknown; lonlat: number[] }[];
  queryValues: unknown[];
  status: string;
  sourceProjection: string | undefined;
  storedProjectionIsObject: boolean;
  loadedEvents: number;
};

/** Results before and after replacement, and optionally after reprojection. */
type GeojsonInjectionResult = {
  /** Fixture layer used for injection and cleanup. */
  gvLayer: AbstractBaseGVLayer;

  initial: GeojsonInjectionSnapshot;
  replacement: GeojsonInjectionSnapshot;
  reprojected?: GeojsonInjectionSnapshot;
};

/** Result captured by the parent-crawl visibility test at each stage. */
type ParentCrawlVisibilityResult = {
  /** Point child used to exercise visibility through its parent group. */
  gvLayer: AbstractBaseGVLayer;

  /** Root parent observed before exercising visibility. */
  parent: GVGroupLayer | undefined;

  /** Registered parent group observed before exercising visibility. */
  groupLayer: AbstractBaseGVLayer | undefined;

  /** Registered child observed before exercising visibility. */
  childLayer: AbstractBaseGVLayer | undefined;

  /** State snapshot taken after the parent group has been hidden. */
  afterHide?: {
    groupVisible: boolean;
    childOwnVisible: boolean;
    childEffectiveVisible: boolean;
    childHidden: boolean;
    childInRange: boolean;
  };

  /** State snapshot taken after setLayerVisibleIncludingParents walked the parents. */
  afterShow?: {
    groupVisible: boolean;
    childEffectiveVisible: boolean;
    childHidden: boolean;
  };
};

/** Represents a layer paired with feature information results collected before and after an operation (e.g., filtering, ordering, or updates). */
type LayerWithBeforeAfterFeature<T> = LayerWithResults<T, (TypeFeatureInfoEntry[] | undefined)[]>;

/** Represents a layer paired with hover feature information results collected before and after an operation. */
type LayerWithBeforeAfterHover<T> = LayerWithResults<
  T,
  {
    layerDataOn: TypeHoverFeatureInfo | undefined;
    layerDataOff: TypeHoverFeatureInfo | undefined;
    layerDataOn2: TypeHoverFeatureInfo | undefined;
  }
>;

/** Generic structure associating a layer with a set of related results. */
type LayerWithResults<T, U> = {
  /** The layer instance. */
  layer: T;
  /** The results associated with the layer. */
  results: U;
};

// #endregion TYPES AND INTERFACES
