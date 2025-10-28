import { Test } from '../core/test';
import { GVAbstractTester } from './abstract-gv-tester';
import type { MapViewer } from 'geoview-core/geo/map/map-viewer';
import { LayerStatusErrorError } from 'geoview-core/core/exceptions/layer-exceptions';
import { LayerNoCapabilitiesError, LayerServiceMetadataUnableToFetchError } from 'geoview-core/core/exceptions/layer-exceptions';
import type { TypeGeoviewLayerConfig } from 'geoview-core/api/types/layer-schema-types';
import type { AbstractGVLayer } from 'geoview-core/geo/layer/gv-layers/abstract-gv-layer';
import { EsriDynamic } from 'geoview-core/geo/layer/geoview-layers/raster/esri-dynamic';
import { generateId } from 'geoview-core/core/utils/utilities';
import { LegendEventProcessor } from 'geoview-core/api/event-processors/event-processor-children/legend-event-processor';
import { EsriFeature } from 'geoview-core/geo/layer/geoview-layers/vector/esri-feature';
import { EsriImage } from 'geoview-core/geo/layer/geoview-layers/raster/esri-image';
import { WMS } from 'geoview-core/geo/layer/geoview-layers/raster/wms';
import { WFS } from 'geoview-core/geo/layer/geoview-layers/vector/wfs';
import { GeoJSON } from 'geoview-core/geo/layer/geoview-layers/vector/geojson';
import { CSV } from 'geoview-core/geo/layer/geoview-layers/vector/csv';
import { OgcFeature } from 'geoview-core/geo/layer/geoview-layers/vector/ogc-feature';
import { WKB } from 'geoview-core/geo/layer/geoview-layers/vector/wkb';
import { KML } from 'geoview-core/geo/layer/geoview-layers/vector/kml';

/**
 * Main Layer testing class.
 * @extends {GVAbstractTester}
 */
export class LayerTester extends GVAbstractTester {
  /**
   * Returns the name of the Tester.
   * @returns {string} The name of the Tester.
   */
  override getName(): string {
    return 'LayerTester';
  }

  // #region ESRI DYNAMIC

  /**
   * Tests adding an Esri Dynamic Historical Flood Events layer on the map.
   * @returns {Promise<Test<AbstractGVLayer>>} A Promise resolving when the test completes.
   */
  testAddEsriDynamicHistoFloodEvents(): Promise<Test<AbstractGVLayer>> {
    // Create a random geoview layer id
    const gvLayerId = generateId();
    const layerUrl = GVAbstractTester.HISTORICAL_FLOOD_URL_MAP_SERVER;
    const layerPath = gvLayerId + '/' + GVAbstractTester.HISTORICAL_FLOOD_URL_LAYER_ID;
    const gvLayerName = 'Esri Dynamic Histo Flood Events';

    // Test
    return this.test(
      `Test Adding Esri Dynamic Histo Flood Events on map...`,
      (test) => {
        // Creating the configuration
        test.addStep('Creating the GeoView Layer Configuration...');

        // Create the config
        const gvConfig = EsriDynamic.createGeoviewLayerConfig(gvLayerId, gvLayerName, layerUrl, false, [
          { id: GVAbstractTester.HISTORICAL_FLOOD_URL_LAYER_ID },
        ]);

        // Redirect to helper to add the layer to the map and wait
        return LayerTester.helperStepAddLayerOnMapAndWaitForIt(gvConfig, test, this.getMapViewer(), layerPath);
      },
      (test) => {
        // Perform assertions
        // Redirect to helper to check if the layer exists
        return LayerTester.helperStepAssertLayerExists(test, this.getMapViewer(), layerPath);
      },
      (test) => {
        // Redirect to helper to clean up and assert
        LayerTester.helperFinalizeStepRemoveLayerAndAssert(test, this.getMapViewer(), layerPath);
      }
    );
  }

  /**
   * Tests the behavior of initializing an Esri Dynamic layer configuration using an invalid metadata URL.
   * This test verifies that when an Esri Dynamic layer configuration is initialized with an invalid or unreachable
   * metadata URL, the initialization process fails as expected and throws a
   * {@link LayerServiceMetadataUnableToFetchError}.
   * @returns {Promise<Test<LayerServiceMetadataUnableToFetchError>>}
   * A promise that resolves with the test result, expecting a `LayerServiceMetadataUnableToFetchError`.
   */
  testAddEsriDynamicBadUrl(): Promise<Test<LayerServiceMetadataUnableToFetchError>> {
    // Create a random geoview layer id
    const gvLayerId = generateId();
    const layerUrl = GVAbstractTester.BAD_URL;
    const layerPath = gvLayerId + '/' + GVAbstractTester.HISTORICAL_FLOOD_URL_LAYER_ID;
    const gvLayerName = 'Esri Dynamic Histo Flood Events';

    // Test
    return this.testError(
      `Test Adding Esri Dynamic with bad url...`,
      LayerServiceMetadataUnableToFetchError,
      async (test) => {
        // Creating the configuration
        test.addStep('Creating the GeoView Layer Configuration...');

        // Create the config
        const gvConfig = EsriDynamic.createGeoviewLayerConfig(gvLayerId, gvLayerName, layerUrl, false, [
          { id: GVAbstractTester.HISTORICAL_FLOOD_URL_LAYER_ID },
        ]);

        // Redirect to helper to add the layer to the map and wait
        await LayerTester.helperStepAddLayerOnMapAndWaitForIt(gvConfig, test, this.getMapViewer(), layerPath);
      },
      undefined,
      (test) => {
        // Redirect to helper to clean up and assert
        LayerTester.helperFinalizeStepRemoveLayerConfigAndAssert(test, this.getMapViewer(), layerPath);
      }
    );
  }

  /**
   * Tests the behavior of initializing a Geocore layer pointing to an Esri Dynamic layer containing Raster Layers.
   * @returns {Promise<Test<AbstractGVLayer>>}
   * A promise that resolves with the test result, expecting a `AbstractGVLayer`.
   */
  testAddEsriDynamicWithRasterLayersViaGeocore(): Promise<Test<AbstractGVLayer>> {
    const gvLayerId = GVAbstractTester.RASTER_LAYERS_UUID;
    const layerPathGroup = gvLayerId + '/0';
    const layerPath2 = gvLayerId + '/0/2';

    // Test
    return this.test(
      `Test Adding Esri Dynamic with Raster Layers via Geocore...`,
      (test) => {
        // Creating the configuration
        test.addStep('Creating the GeoView Layer Configuration...');

        // Redirect to helper to add the layer to the map and wait
        return LayerTester.helperStepAddLayerFromUUIDOnMapAndWaitForIt(gvLayerId, test, this.getMapViewer(), layerPath2);
      },
      (test) => {
        // Perform assertions
        // Redirect to helper to check if the layer exists
        return LayerTester.helperStepAssertLayerExists(test, this.getMapViewer(), layerPath2);
      },
      (test) => {
        // Redirect to helper to clean up and assert
        LayerTester.helperFinalizeStepRemoveLayerAndAssert(test, this.getMapViewer(), layerPathGroup);
      }
    );
  }

  // #endregion ESRI DYNAMIC

  // #region ESRI FEATURE

  /**
   * Tests adding an Esri Feature Forest Industry layer on the map.
   * @returns {Promise<Test<AbstractGVLayer>>} A Promise resolving when the test completes.
   */
  testAddEsriFeatureForestIndustry(): Promise<Test<AbstractGVLayer>> {
    // Create a random geoview layer id
    const gvLayerId = generateId();
    const layerUrl = GVAbstractTester.FOREST_INDUSTRY_MAP_SERVER;
    const layerPath = gvLayerId + '/' + GVAbstractTester.FOREST_INDUSTRY_LAYER_ID;
    const gvLayerName = 'Esri Feature Forest Industry';

    // Test
    return this.test(
      `Test Adding Esri Feature Forest Industry on map...`,
      (test) => {
        // Creating the configuration
        test.addStep('Creating the GeoView Layer Configuration...');

        // Create the config
        const gvConfig = EsriFeature.createGeoviewLayerConfig(gvLayerId, gvLayerName, layerUrl, false, [
          { id: GVAbstractTester.FOREST_INDUSTRY_LAYER_ID },
        ]);

        // Redirect to helper to add the layer to the map and wait
        return LayerTester.helperStepAddLayerOnMapAndWaitForIt(gvConfig, test, this.getMapViewer(), layerPath);
      },
      (test) => {
        // Perform assertions
        // Redirect to helper to check if the layer exists
        return LayerTester.helperStepAssertLayerExists(test, this.getMapViewer(), layerPath);
      },
      (test) => {
        // Redirect to helper to clean up and assert
        LayerTester.helperFinalizeStepRemoveLayerAndAssert(test, this.getMapViewer(), layerPath);
      }
    );
  }

  /**
   * Tests the behavior of initializing an Esri Feature layer configuration using an invalid metadata URL.
   * This test verifies that when an Esri Feature layer configuration is initialized with an invalid or unreachable
   * metadata URL, the initialization process fails as expected and throws a
   * {@link LayerServiceMetadataUnableToFetchError}.
   * @returns {Promise<Test<LayerServiceMetadataUnableToFetchError>>}
   * A promise that resolves with the test result, expecting a `LayerServiceMetadataUnableToFetchError`.
   */
  testAddEsriFeatureBadUrl(): Promise<Test<LayerServiceMetadataUnableToFetchError>> {
    // Create a random geoview layer id
    const gvLayerId = generateId();
    const layerUrl = GVAbstractTester.BAD_URL;
    const layerPath = gvLayerId + '/' + GVAbstractTester.FOREST_INDUSTRY_LAYER_ID;
    const gvLayerName = 'Esri Feature Forest Industry';

    // Test
    return this.testError(
      `Test Adding Esri Feature with bad url...`,
      LayerServiceMetadataUnableToFetchError,
      async (test) => {
        // Creating the configuration
        test.addStep('Creating the GeoView Layer Configuration...');

        // Create the config
        const gvConfig = EsriFeature.createGeoviewLayerConfig(gvLayerId, gvLayerName, layerUrl, false, [
          { id: GVAbstractTester.FOREST_INDUSTRY_LAYER_ID },
        ]);

        // Redirect to helper to add the layer to the map and wait
        await LayerTester.helperStepAddLayerOnMapAndWaitForIt(gvConfig, test, this.getMapViewer(), layerPath);
      },
      undefined,
      (test) => {
        // Redirect to helper to clean up and assert
        LayerTester.helperFinalizeStepRemoveLayerConfigAndAssert(test, this.getMapViewer(), layerPath);
      }
    );
  }

  // #endregion ESRI FEATURE

  // #region ESRI IMAGE

  /**
   * Tests adding an Esri Feature Forest Industry layer on the map.
   * @returns {Promise<Test<AbstractGVLayer>>} A Promise resolving when the test completes.
   */
  testAddEsriImageWithElevation(): Promise<Test<AbstractGVLayer>> {
    // Create a random geoview layer id
    const gvLayerId = generateId();
    const layerUrl = GVAbstractTester.ELEVATION_IMAGE_SERVER;
    const layerPath = gvLayerId + '/' + GVAbstractTester.ELEVATION_LAYER_ID;
    const gvLayerName = 'Esri Image Elevation';

    // Test
    return this.test(
      `Test Adding Esri Image Elevation on map...`,
      (test) => {
        // Creating the configuration
        test.addStep('Creating the GeoView Layer Configuration...');

        // Create the config
        const gvConfig = EsriImage.createGeoviewLayerConfig(gvLayerId, gvLayerName, layerUrl, false);

        // Redirect to helper to add the layer to the map and wait
        return LayerTester.helperStepAddLayerOnMapAndWaitForIt(gvConfig, test, this.getMapViewer(), layerPath);
      },
      (test) => {
        // Perform assertions
        // Redirect to helper to check if the layer exists
        return LayerTester.helperStepAssertLayerExists(test, this.getMapViewer(), layerPath);
      },
      (test) => {
        // Redirect to helper to clean up and assert
        LayerTester.helperFinalizeStepRemoveLayerAndAssert(test, this.getMapViewer(), layerPath);
      }
    );
  }

  /**
   * Tests the behavior of initializing an Esri Image layer configuration using an invalid metadata URL.
   * This test verifies that when an Esri Image layer configuration is initialized with an invalid or unreachable
   * metadata URL, the initialization process fails as expected and throws a
   * {@link LayerServiceMetadataUnableToFetchError}.
   * @returns {Promise<Test<LayerServiceMetadataUnableToFetchError>>}
   * A promise that resolves with the test result, expecting a `LayerServiceMetadataUnableToFetchError`.
   */
  testAddEsriImageBadUrl(): Promise<Test<LayerServiceMetadataUnableToFetchError>> {
    // Create a random geoview layer id
    const gvLayerId = generateId();
    const layerUrl = GVAbstractTester.BAD_URL + '/' + GVAbstractTester.ELEVATION_LAYER_ID + '/ImageServer'; // Has to be formatted like this, because we're guessing the layer id with url parsing!
    const layerPath = gvLayerId + '/' + GVAbstractTester.ELEVATION_LAYER_ID;
    const gvLayerName = 'Esri Image Elevation';

    // Test
    return this.testError(
      `Test Adding Esri Image with bad url...`,
      LayerServiceMetadataUnableToFetchError,
      async (test) => {
        // Creating the configuration
        test.addStep('Creating the GeoView Layer Configuration...');

        // Create the config
        const gvConfig = EsriImage.createGeoviewLayerConfig(gvLayerId, gvLayerName, layerUrl, false);

        // Redirect to helper to add the layer to the map and wait
        await LayerTester.helperStepAddLayerOnMapAndWaitForIt(gvConfig, test, this.getMapViewer(), layerPath);
      },
      undefined,
      (test) => {
        // Redirect to helper to clean up and assert
        LayerTester.helperFinalizeStepRemoveLayerConfigAndAssert(test, this.getMapViewer(), layerPath);
      }
    );
  }

  // #endregion ESRI IMAGE

  // #region WMS

  /**
   * Tests adding an Esri Feature Forest Industry layer on the map.
   * @returns {Promise<Test<AbstractGVLayer>>} A Promise resolving when the test completes.
   */
  testAddWMSLayerWithOWSMundialis(): Promise<Test<AbstractGVLayer>> {
    // Create a random geoview layer id
    const gvLayerId = generateId();
    const layerUrl = GVAbstractTester.OWS_MUNDIALIS;
    const layerPath = gvLayerId + '/' + GVAbstractTester.OWS_MUNDIALIS_LAYER_ID;
    const gvLayerName = 'OWS Mundialis';
    const hasStyle: boolean = false;

    // Test
    return this.test(
      `Test Adding WMS Mundialis on map...`,
      (test) => {
        // Creating the configuration
        test.addStep('Creating the GeoView Layer Configuration...');

        // Create the config
        const gvConfig = WMS.createGeoviewLayerConfig(
          gvLayerId,
          gvLayerName,
          layerUrl,
          'mapserver',
          false,
          [{ id: GVAbstractTester.OWS_MUNDIALIS_LAYER_ID }],
          false
        );

        // Redirect to helper to add the layer to the map and wait
        return LayerTester.helperStepAddLayerOnMapAndWaitForIt(gvConfig, test, this.getMapViewer(), layerPath, hasStyle);
      },
      (test) => {
        // Perform assertions
        // Redirect to helper to check if the layer exists
        return LayerTester.helperStepAssertLayerExists(test, this.getMapViewer(), layerPath, hasStyle);
      },
      (test) => {
        // Redirect to helper to clean up and assert
        LayerTester.helperFinalizeStepRemoveLayerAndAssert(test, this.getMapViewer(), layerPath);
      }
    );
  }

  /**
   * Tests adding an Esri Feature Forest Industry layer on the map.
   * @returns {Promise<Test<AbstractGVLayer>>} A Promise resolving when the test completes.
   */
  testAddWMSLayerWithDatacubeMSI(): Promise<Test<AbstractGVLayer>> {
    // Create a random geoview layer id
    const gvLayerId = generateId();
    const layerUrl = GVAbstractTester.DATACUBE_MSI;
    const layerPath = gvLayerId + '/' + GVAbstractTester.DATACUBE_MSI_LAYER_NAME_MSI_OR_MORE;
    const gvLayerName = 'Datacube MSI';
    const hasStyle: boolean = false;

    // Test
    return this.test(
      `Test Adding WMS Datacube MSI on map...`,
      (test) => {
        // Creating the configuration
        test.addStep('Creating the GeoView Layer Configuration...');

        // Create the config
        const gvConfig = WMS.createGeoviewLayerConfig(
          gvLayerId,
          gvLayerName,
          layerUrl,
          'mapserver',
          false,
          [{ id: GVAbstractTester.DATACUBE_MSI_LAYER_NAME_MSI_OR_MORE }],
          false
        );

        // Redirect to helper to add the layer to the map and wait
        return LayerTester.helperStepAddLayerOnMapAndWaitForIt(gvConfig, test, this.getMapViewer(), layerPath, hasStyle);
      },
      (test) => {
        // Perform assertions
        // Redirect to helper to check if the layer exists
        return LayerTester.helperStepAssertLayerExists(test, this.getMapViewer(), layerPath, hasStyle);
      },
      (test) => {
        // Redirect to helper to clean up and assert
        LayerTester.helperFinalizeStepRemoveLayerAndAssert(test, this.getMapViewer(), layerPath);
      }
    );
  }

  /**
   * Tests adding an Esri Feature Forest Industry layer on the map.
   * @returns {Promise<Test<AbstractGVLayer>>} A Promise resolving when the test completes.
   */
  testAddWMSLayerWithDatacubeRingOfFire(): Promise<Test<AbstractGVLayer>> {
    // Create a random geoview layer id
    const gvLayerId = generateId();
    const layerUrl = GVAbstractTester.DATACUBE_RING_FIRE;
    const layerPath = gvLayerId + '/' + GVAbstractTester.DATACUBE_RING_FIRE_LAYER_ID_HALIFAX;
    const gvLayerName = 'Halifax';
    const hasStyle: boolean = false;

    // Test
    return this.test(
      `Test Adding WMS Datacube Ring of Fire XML Halifax on map...`,
      (test) => {
        // Creating the configuration
        test.addStep('Creating the GeoView Layer Configuration...');

        // Create the config
        const gvConfig = WMS.createGeoviewLayerConfig(
          gvLayerId,
          gvLayerName,
          layerUrl,
          'mapserver',
          false,
          [{ id: GVAbstractTester.DATACUBE_RING_FIRE_LAYER_ID_HALIFAX }],
          false
        );

        // Redirect to helper to add the layer to the map and wait
        return LayerTester.helperStepAddLayerOnMapAndWaitForIt(gvConfig, test, this.getMapViewer(), layerPath, hasStyle);
      },
      (test) => {
        // Perform assertions
        // Redirect to helper to check if the layer exists
        return LayerTester.helperStepAssertLayerExists(test, this.getMapViewer(), layerPath, hasStyle);
      },
      (test) => {
        // Redirect to helper to clean up and assert
        LayerTester.helperFinalizeStepRemoveLayerAndAssert(test, this.getMapViewer(), layerPath);
      }
    );
  }

  /**
   * Tests the behavior of initializing a WMS layer configuration using an invalid metadata URL.
   * This test verifies that when an WMS layer configuration is initialized with an invalid or unreachable
   * metadata URL, the initialization process fails as expected and throws a
   * {@link LayerNoCapabilitiesError}.
   * @returns {Promise<Test<LayerNoCapabilitiesError>>}
   * A promise that resolves with the test result, expecting a `LayerNoCapabilitiesError`.
   */
  testAddWMSBadUrl(): Promise<Test<LayerNoCapabilitiesError>> {
    // GV: In the case of a WMS, since a proxy is used when the url fails, and that proxy always returns a 200 response (with an internal error inside)
    // GV: We can't really test the LayerServiceMetadataUnableToFetchError error exception.

    // Create a random geoview layer id
    const gvLayerId = generateId();
    const layerUrl = GVAbstractTester.BAD_URL;
    const layerPath = gvLayerId + '/' + GVAbstractTester.DATACUBE_MSI_LAYER_NAME_MSI_OR_MORE;
    const gvLayerName = 'Datacube MSI';

    // Test
    return this.testError(
      `Test Adding WMS with bad url...`,
      LayerNoCapabilitiesError,
      async (test) => {
        // Creating the configuration
        test.addStep('Creating the GeoView Layer Configuration...');

        // Create the config
        const gvConfig = WMS.createGeoviewLayerConfig(
          gvLayerId,
          gvLayerName,
          layerUrl,
          'mapserver',
          false,
          [{ id: GVAbstractTester.DATACUBE_MSI_LAYER_NAME_MSI_OR_MORE }],
          false
        );

        // Redirect to helper to add the layer to the map and wait
        await LayerTester.helperStepAddLayerOnMapAndWaitForIt(gvConfig, test, this.getMapViewer(), layerPath);
      },
      undefined,
      (test) => {
        // Redirect to helper to clean up and assert
        LayerTester.helperFinalizeStepRemoveLayerConfigAndAssert(test, this.getMapViewer(), layerPath);
      }
    );
  }

  // #endregion WMS

  // #region WFS

  /**
   * Tests adding an WFS with Geomet Current Conditions layer on the map.
   * @returns {Promise<Test<AbstractGVLayer>>} A Promise resolving when the test completes.
   */
  testAddWFSLayerWithWithGeometCurrentConditions(): Promise<Test<AbstractGVLayer>> {
    // Create a random geoview layer id
    const gvLayerId = generateId();
    const layerUrl = GVAbstractTester.GEOMET_URL;
    const layerPath = gvLayerId + '/' + GVAbstractTester.GEOMET_URL_CURRENT_COND_LAYER_ID;
    const gvLayerName = 'Current Conditions';

    // Test
    return this.test(
      `Test Adding WFS with Geomet Current Conditions layer on map...`,
      (test) => {
        // Creating the configuration
        test.addStep('Creating the GeoView Layer Configuration...');

        // Create the config
        const gvConfig = WFS.createGeoviewLayerConfig(gvLayerId, gvLayerName, layerUrl, false, 'all', [
          { id: GVAbstractTester.GEOMET_URL_CURRENT_COND_LAYER_ID },
        ]);

        // Redirect to helper to add the layer to the map and wait
        return LayerTester.helperStepAddLayerOnMapAndWaitForIt(gvConfig, test, this.getMapViewer(), layerPath);
      },
      (test) => {
        // Perform assertions
        // Redirect to helper to check if the layer exists
        return LayerTester.helperStepAssertLayerExists(test, this.getMapViewer(), layerPath);
      },
      (test) => {
        // Redirect to helper to clean up and assert
        LayerTester.helperFinalizeStepRemoveLayerAndAssert(test, this.getMapViewer(), layerPath);
      }
    );
  }

  /**
   * Tests the behavior of initializing a WMS layer configuration using an invalid metadata URL.
   * This test verifies that when an WMS layer configuration is initialized with an invalid or unreachable
   * metadata URL, the initialization process fails as expected and throws a
   * {@link LayerServiceMetadataUnableToFetchError}.
   * @returns {Promise<Test<LayerServiceMetadataUnableToFetchError>>}
   * A promise that resolves with the test result, expecting a `LayerServiceMetadataUnableToFetchError`.
   */
  testAddWFSBadUrl(): Promise<Test<LayerServiceMetadataUnableToFetchError>> {
    // Create a random geoview layer id
    const gvLayerId = generateId();
    const layerUrl = GVAbstractTester.BAD_URL;
    const layerPath = gvLayerId + '/' + GVAbstractTester.GEOMET_URL_CURRENT_COND_LAYER_ID;
    const gvLayerName = 'Current Conditions';

    // Test
    return this.testError(
      `Test Adding WFS with bad url...`,
      LayerServiceMetadataUnableToFetchError,
      async (test) => {
        // Creating the configuration
        test.addStep('Creating the GeoView Layer Configuration...');

        // Create the config
        const gvConfig = WFS.createGeoviewLayerConfig(gvLayerId, gvLayerName, layerUrl, false, 'all', [
          { id: GVAbstractTester.GEOMET_URL_CURRENT_COND_LAYER_ID },
        ]);

        // Redirect to helper to add the layer to the map and wait
        await LayerTester.helperStepAddLayerOnMapAndWaitForIt(gvConfig, test, this.getMapViewer(), layerPath);
      },
      undefined,
      (test) => {
        // Redirect to helper to clean up and assert
        LayerTester.helperFinalizeStepRemoveLayerConfigAndAssert(test, this.getMapViewer(), layerPath);
      }
    );
  }

  /**
   * Tests the behavior of initializing a WFS layer configuration using an invalid metadata URL.
   * This test verifies that when an WFS layer configuration is initialized with an invalid or unreachable
   * metadata URL, the initialization process fails as expected and throws a
   * {@link LayerNoCapabilitiesError}.
   * @returns {Promise<Test<LayerNoCapabilitiesError>>}
   * A promise that resolves with the test result, expecting a `LayerNoCapabilitiesError`.
   */
  testAddWFSOkayUrlNoCap(): Promise<Test<LayerNoCapabilitiesError>> {
    // Create a random geoview layer id
    const gvLayerId = generateId();
    const layerUrl = GVAbstractTester.FAKE_URL_ALWAYS_RETURNING_RESPONSE_INSTEAD_OF_NETWORK_ERROR;
    const layerPath = gvLayerId + '/' + GVAbstractTester.GEOMET_URL_CURRENT_COND_LAYER_ID;
    const gvLayerName = 'Current Conditions';

    // Test
    return this.testError(
      `Test Adding WFS with okay url no capabilities...`,
      LayerNoCapabilitiesError,
      async (test) => {
        // Creating the configuration
        test.addStep('Creating the GeoView Layer Configuration...');

        // Create the config
        const gvConfig = WFS.createGeoviewLayerConfig(gvLayerId, gvLayerName, layerUrl, false, 'all', [
          { id: GVAbstractTester.GEOMET_URL_CURRENT_COND_LAYER_ID },
        ]);

        // Redirect to helper to add the layer to the map and wait
        await LayerTester.helperStepAddLayerOnMapAndWaitForIt(gvConfig, test, this.getMapViewer(), layerPath);
      },
      undefined,
      (test) => {
        // Redirect to helper to clean up and assert
        LayerTester.helperFinalizeStepRemoveLayerConfigAndAssert(test, this.getMapViewer(), layerPath);
      }
    );
  }

  // #endregion WFS

  // #region GeoJSON

  /**
   * Tests adding a GeoJSON with Polygons layer on the map.
   * @returns {Promise<Test<AbstractGVLayer>>} A Promise resolving when the test completes.
   */
  testAddGeoJSONWithMetadataPolygons(): Promise<Test<AbstractGVLayer>> {
    // Create a random geoview layer id
    const gvLayerId = generateId();
    const layerUrl = GVAbstractTester.GEOJSON_METADATA_META;
    const layerPath = gvLayerId + '/' + GVAbstractTester.GEOJSON_POLYGONS;
    const gvLayerName = 'Polygons JSON';

    // Test
    return this.test(
      `Test Adding GeoJSON with Metadata layer on map...`,
      (test) => {
        // Creating the configuration
        test.addStep('Creating the GeoView Layer Configuration...');

        // Create the config
        const gvConfig = GeoJSON.createGeoviewLayerConfig(gvLayerId, gvLayerName, layerUrl, false, [
          { id: GVAbstractTester.GEOJSON_POLYGONS },
        ]);

        // Redirect to helper to add the layer to the map and wait
        return LayerTester.helperStepAddLayerOnMapAndWaitForIt(gvConfig, test, this.getMapViewer(), layerPath);
      },
      (test) => {
        // Perform assertions
        // Redirect to helper to check if the layer exists
        return LayerTester.helperStepAssertLayerExists(test, this.getMapViewer(), layerPath);
      },
      (test) => {
        // Redirect to helper to clean up and assert
        LayerTester.helperFinalizeStepRemoveLayerAndAssert(test, this.getMapViewer(), layerPath);
      }
    );
  }

  /**
   * Tests the behavior of initializing a GeoJSON layer configuration using an invalid metadata URL.
   * This test verifies that when a GeoJSON layer configuration is initialized with an invalid or unreachable
   * metadata URL, the initialization process fails as expected and throws a
   * {@link LayerStatusErrorError}.
   * @returns {Promise<Test<LayerStatusErrorError>>}
   * A promise that resolves with the test result, expecting a `LayerStatusErrorError`.
   */
  testAddGeoJSONBadUrl(): Promise<Test<LayerStatusErrorError>> {
    // GV: In the case of a GeoJSON, since we don't validate the url until we try to fetch the data,
    // GV: we have to wait until the layer gets on the map and throws an error, which will since the layer can't reach the data.
    // Create a random geoview layer id
    const gvLayerId = generateId();
    const layerUrl = GVAbstractTester.BAD_URL;
    const layerPath = gvLayerId + '/' + GVAbstractTester.GEOJSON_POLYGONS;
    const gvLayerName = 'Polygons JSON';

    // Test
    return this.testError(
      `Test Adding GeoJSON with bad url...`,
      LayerStatusErrorError,
      async (test) => {
        // Creating the configuration
        test.addStep('Creating the GeoView Layer Configuration...');

        // Create the config
        const gvConfig = GeoJSON.createGeoviewLayerConfig(gvLayerId, gvLayerName, layerUrl, false, [
          { id: GVAbstractTester.GEOJSON_POLYGONS },
        ]);

        // Redirect to helper to add the layer to the map and wait
        await LayerTester.helperStepAddLayerOnMapAndWaitForIt(gvConfig, test, this.getMapViewer(), layerPath);
      },
      undefined,
      (test) => {
        // Redirect to helper to clean up and assert
        LayerTester.helperFinalizeStepRemoveLayerConfigAndAssert(test, this.getMapViewer(), layerPath);
      }
    );
  }

  // #endregion GeoJSON

  // #region CSV

  /**
   * Tests adding a CSV with Station List layer on the map.
   * @returns {Promise<Test<AbstractGVLayer>>} A Promise resolving when the test completes.
   */
  testAddCSVWithStationList(): Promise<Test<AbstractGVLayer>> {
    // Create a random geoview layer id
    const gvLayerId = generateId();
    const layerUrl = GVAbstractTester.CSV_STATION_LIST;
    const layerPath = gvLayerId + '/' + GVAbstractTester.CSV_STATION_LIST_FILE;
    const gvLayerName = 'Station List CSV';

    // Test
    return this.test(
      `Test Adding a CSV with Station List layer on map...`,
      (test) => {
        // Creating the configuration
        test.addStep('Creating the GeoView Layer Configuration...');

        // Create the config
        const gvConfig = CSV.createGeoviewLayerConfig(gvLayerId, gvLayerName, layerUrl, false, [
          { id: GVAbstractTester.CSV_STATION_LIST_FILE },
        ]);

        // Redirect to helper to add the layer to the map and wait
        return LayerTester.helperStepAddLayerOnMapAndWaitForIt(gvConfig, test, this.getMapViewer(), layerPath);
      },
      (test) => {
        // Perform assertions
        // Redirect to helper to check if the layer exists
        return LayerTester.helperStepAssertLayerExists(test, this.getMapViewer(), layerPath);
      },
      (test) => {
        // Redirect to helper to clean up and assert
        LayerTester.helperFinalizeStepRemoveLayerAndAssert(test, this.getMapViewer(), layerPath);
      }
    );
  }

  /**
   * Tests the behavior of initializing a CSV layer configuration using an invalid metadata URL.
   * This test verifies that when a CSV layer configuration is initialized with an invalid or unreachable
   * metadata URL, the initialization process fails as expected and throws a
   * {@link LayerStatusErrorError}.
   * @returns {Promise<Test<LayerStatusErrorError>>}
   * A promise that resolves with the test result, expecting a `LayerStatusErrorError`.
   */
  testAddCSVWithBadUrl(): Promise<Test<LayerStatusErrorError>> {
    // GV: In the case of a CSV, since we don't validate the url until we try to fetch the data,
    // GV: we have to wait until the layer gets on the map and throws an error, which will since the layer can't reach the data.
    // Create a random geoview layer id
    const gvLayerId = generateId();
    const layerUrl = GVAbstractTester.BAD_URL;
    const layerPath = gvLayerId + '/' + GVAbstractTester.CSV_STATION_LIST_FILE;
    const gvLayerName = 'Station List CSV';

    // Test
    return this.testError(
      `Test Adding CSV with bad url...`,
      LayerStatusErrorError,
      async (test) => {
        // Creating the configuration
        test.addStep('Creating the GeoView Layer Configuration...');

        // Create the config
        const gvConfig = CSV.createGeoviewLayerConfig(gvLayerId, gvLayerName, layerUrl, false, [
          { id: GVAbstractTester.CSV_STATION_LIST_FILE },
        ]);

        // Redirect to helper to add the layer to the map and wait
        await LayerTester.helperStepAddLayerOnMapAndWaitForIt(gvConfig, test, this.getMapViewer(), layerPath);
      },
      undefined,
      (test) => {
        // Redirect to helper to clean up and assert
        LayerTester.helperFinalizeStepRemoveLayerConfigAndAssert(test, this.getMapViewer(), layerPath);
      }
    );
  }

  // #endregion CSV

  // #region OGC Feature

  /**
   * Tests adding an OGC Feature layer with Pygeoapi on the map.
   * @returns {Promise<Test<AbstractGVLayer>>} A Promise resolving when the test completes.
   */
  testAddOGCFeatureWithPygeoapi(): Promise<Test<AbstractGVLayer>> {
    // Create a random geoview layer id
    const gvLayerId = generateId();
    const layerUrl = GVAbstractTester.PYGEOAPI_B6RYUVAKK5;
    const layerPath = gvLayerId + '/' + GVAbstractTester.PYGEOAPI_B6RYUVAKK5_LAKES;
    const gvLayerName = GVAbstractTester.PYGEOAPI_B6RYUVAKK5_LAKES;

    // Test
    return this.test(
      `Test Adding an OGC Feature with Pygeoapi layer on map...`,
      (test) => {
        // Creating the configuration
        test.addStep('Creating the GeoView Layer Configuration...');

        // Create the config
        const gvConfig = OgcFeature.createGeoviewLayerConfig(gvLayerId, gvLayerName, layerUrl, false, [
          { id: GVAbstractTester.PYGEOAPI_B6RYUVAKK5_LAKES },
        ]);

        // Redirect to helper to add the layer to the map and wait
        return LayerTester.helperStepAddLayerOnMapAndWaitForIt(gvConfig, test, this.getMapViewer(), layerPath);
      },
      (test) => {
        // Perform assertions
        // Redirect to helper to check if the layer exists
        return LayerTester.helperStepAssertLayerExists(test, this.getMapViewer(), layerPath);
      },
      (test) => {
        // Redirect to helper to clean up and assert
        LayerTester.helperFinalizeStepRemoveLayerAndAssert(test, this.getMapViewer(), layerPath);
      }
    );
  }

  /**
   * Tests the behavior of initializing an OGC Feature layer configuration using an invalid metadata URL.
   * This test verifies that when an OGC Feature layer configuration is initialized with an invalid or unreachable
   * metadata URL, the initialization process fails as expected and throws a
   * {@link LayerServiceMetadataUnableToFetchError}.
   * @returns {Promise<Test<LayerServiceMetadataUnableToFetchError>>}
   * A promise that resolves with the test result, expecting a `LayerServiceMetadataUnableToFetchError`.
   */
  testAddOGCFeatureWithBadUrl(): Promise<Test<LayerServiceMetadataUnableToFetchError>> {
    // Create a random geoview layer id
    const gvLayerId = generateId();
    const layerUrl = GVAbstractTester.BAD_URL;
    const layerPath = gvLayerId + '/' + GVAbstractTester.PYGEOAPI_B6RYUVAKK5_LAKES;
    const gvLayerName = GVAbstractTester.PYGEOAPI_B6RYUVAKK5_LAKES;

    // Test
    return this.testError(
      `Test Adding OGC Feature with bad url...`,
      LayerServiceMetadataUnableToFetchError,
      async (test) => {
        // Creating the configuration
        test.addStep('Creating the GeoView Layer Configuration...');

        // Create the config
        const gvConfig = OgcFeature.createGeoviewLayerConfig(gvLayerId, gvLayerName, layerUrl, false, [
          { id: GVAbstractTester.PYGEOAPI_B6RYUVAKK5_LAKES },
        ]);

        // Redirect to helper to add the layer to the map and wait
        await LayerTester.helperStepAddLayerOnMapAndWaitForIt(gvConfig, test, this.getMapViewer(), layerPath);
      },
      undefined,
      (test) => {
        // Redirect to helper to clean up and assert
        LayerTester.helperFinalizeStepRemoveLayerConfigAndAssert(test, this.getMapViewer(), layerPath);
      }
    );
  }

  // #endregion OGC Feature

  // #region WKB

  /**
   * Tests adding a WKB with South Africa on the map.
   * @returns {Promise<Test<AbstractGVLayer>>} A Promise resolving when the test completes.
   */
  testAddWKBWithSouthAfrica(): Promise<Test<AbstractGVLayer>> {
    // Create a random geoview layer id
    const gvLayerId = generateId();
    const layerUrl = GVAbstractTester.WKB_SOUTH_AFRICA;
    const layerPath = gvLayerId + '/' + GVAbstractTester.WKB_SOUTH_AFRICA;
    const gvLayerName = 'WKB South Africa';
    const hasStyle: boolean = false;

    // Test
    return this.test(
      `Test Adding a WKB with South Africa layer on map...`,
      (test) => {
        // Creating the configuration
        test.addStep('Creating the GeoView Layer Configuration...');

        // Create the config
        const gvConfig = WKB.createGeoviewLayerConfig(gvLayerId, gvLayerName, layerUrl, false, [{ id: GVAbstractTester.WKB_SOUTH_AFRICA }]);

        // Redirect to helper to add the layer to the map and wait
        return LayerTester.helperStepAddLayerOnMapAndWaitForIt(gvConfig, test, this.getMapViewer(), layerPath, hasStyle);
      },
      (test) => {
        // Perform assertions
        // Redirect to helper to check if the layer exists
        return LayerTester.helperStepAssertLayerExists(test, this.getMapViewer(), layerPath, hasStyle);
      },
      (test) => {
        // Redirect to helper to clean up and assert
        LayerTester.helperFinalizeStepRemoveLayerAndAssert(test, this.getMapViewer(), layerPath);
      }
    );
  }

  /**
   * Tests the behavior of initializing an WKB layer configuration using an invalid metadata URL.
   * This test verifies that when an WKB layer configuration is initialized with an invalid or unreachable
   * metadata URL, the initialization process fails as expected and throws a
   * {@link LayerStatusErrorError}.
   * @returns {Promise<Test<LayerStatusErrorError>>}
   * A promise that resolves with the test result, expecting a `LayerStatusErrorError`.
   */
  testAddWKBWithBadUrl(): Promise<Test<LayerStatusErrorError>> {
    // GV: In the case of a WKB, since we don't validate the url until we try to fetch the data,
    // GV: we have to wait until the layer gets on the map and throws an error, which will since the layer can't reach the data.
    // Create a random geoview layer id
    const gvLayerId = generateId();
    const layerUrl = GVAbstractTester.BAD_URL;
    const layerPath = gvLayerId + '/' + GVAbstractTester.WKB_SOUTH_AFRICA;
    const gvLayerName = GVAbstractTester.WKB_SOUTH_AFRICA;

    // Test
    return this.testError(
      `Test Adding WKB with bad url...`,
      LayerStatusErrorError,
      async (test) => {
        // Creating the configuration
        test.addStep('Creating the GeoView Layer Configuration...');

        // Create the config
        const gvConfig = WKB.createGeoviewLayerConfig(gvLayerId, gvLayerName, layerUrl, false, [{ id: GVAbstractTester.WKB_SOUTH_AFRICA }]);

        // Redirect to helper to add the layer to the map and wait
        await LayerTester.helperStepAddLayerOnMapAndWaitForIt(gvConfig, test, this.getMapViewer(), layerPath);
      },
      undefined,
      (test) => {
        // Redirect to helper to clean up and assert
        LayerTester.helperFinalizeStepRemoveLayerConfigAndAssert(test, this.getMapViewer(), layerPath);
      }
    );
  }

  // #endregion WKB

  // #region KML

  /**
   * Tests adding a KML with Tornado on the map.
   * @returns {Promise<Test<AbstractGVLayer>>} A Promise resolving when the test completes.
   */
  testAddKMLWithTornado(): Promise<Test<AbstractGVLayer>> {
    // Create a random geoview layer id
    const gvLayerId = generateId();
    const layerUrl = GVAbstractTester.KML_TORNADO;
    const layerPath = gvLayerId + '/' + GVAbstractTester.KML_TORNADO_FILE;
    const gvLayerName = 'KML Tornado';
    const hasStyle: boolean = false;

    // Test
    return this.test(
      `Test Adding a KML with Tornado layer on map...`,
      (test) => {
        // Creating the configuration
        test.addStep('Creating the GeoView Layer Configuration...');

        // Create the config
        const gvConfig = KML.createGeoviewLayerConfig(gvLayerId, gvLayerName, layerUrl, false, [{ id: GVAbstractTester.KML_TORNADO_FILE }]);

        // Redirect to helper to add the layer to the map and wait
        return LayerTester.helperStepAddLayerOnMapAndWaitForIt(gvConfig, test, this.getMapViewer(), layerPath, hasStyle);
      },
      (test) => {
        // Perform assertions
        // Redirect to helper to check if the layer exists
        return LayerTester.helperStepAssertLayerExists(test, this.getMapViewer(), layerPath, hasStyle);
      },
      (test) => {
        // Redirect to helper to clean up and assert
        LayerTester.helperFinalizeStepRemoveLayerAndAssert(test, this.getMapViewer(), layerPath);
      }
    );
  }

  /**
   * Tests the behavior of initializing a KML layer configuration using an invalid metadata URL.
   * This test verifies that when a KML layer configuration is initialized with an invalid or unreachable
   * metadata URL, the initialization process fails as expected and throws a
   * {@link LayerStatusErrorError}.
   * @returns {Promise<Test<LayerStatusErrorError>>}
   * A promise that resolves with the test result, expecting a `LayerStatusErrorError`.
   */
  testAddKMLWithBadUrl(): Promise<Test<LayerStatusErrorError>> {
    // GV: In the case of a KML, since we don't validate the url until we try to fetch the data,
    // GV: we have to wait until the layer gets on the map and throws an error, which will since the layer can't reach the data.
    // Create a random geoview layer id
    const gvLayerId = generateId();
    const layerUrl = GVAbstractTester.BAD_URL;
    const layerPath = gvLayerId + '/' + GVAbstractTester.KML_TORNADO_FILE;
    const gvLayerName = GVAbstractTester.KML_TORNADO_FILE;

    // Test
    return this.testError(
      `Test Adding KML with bad url...`,
      LayerStatusErrorError,
      async (test) => {
        // Creating the configuration
        test.addStep('Creating the GeoView Layer Configuration...');

        // Create the config
        const gvConfig = KML.createGeoviewLayerConfig(gvLayerId, gvLayerName, layerUrl, false, [{ id: GVAbstractTester.KML_TORNADO_FILE }]);

        // Redirect to helper to add the layer to the map and wait
        await LayerTester.helperStepAddLayerOnMapAndWaitForIt(gvConfig, test, this.getMapViewer(), layerPath);
      },
      undefined,
      (test) => {
        // Redirect to helper to clean up and assert
        LayerTester.helperFinalizeStepRemoveLayerConfigAndAssert(test, this.getMapViewer(), layerPath);
      }
    );
  }

  // #endregion KML

  // #region HELPERS

  /**
   * Adds a GeoView layer to the map, waits for it to load completely, and returns the loaded layer instance.
   * Each step of the process is logged into the provided test instance for traceability and debugging.
   * @param {TypeGeoviewLayerConfig} gvConfig - The configuration object defining the GeoView layer to be added.
   * @param {Test<AbstractGVLayer>} test - The test instance used to log each step in the layer setup process.
   * @param {MapViewer} mapViewer - The map viewer to which the layer will be added.
   * @param {string} layerPath - The unique path or ID used to retrieve the added layer from the map viewer.
   * @returns {Promise<AbstractGVLayer>} A promise that resolves to the fully loaded GeoView layer instance.
   * @static
   */
  static async helperStepAddLayerOnMapAndWaitForIt<T>(
    gvConfig: TypeGeoviewLayerConfig,
    test: Test<T>,
    mapViewer: MapViewer,
    layerPath: string,
    waitStyle: boolean = true
  ): Promise<AbstractGVLayer> {
    // Adding the layer on the map
    test.addStep('Adding the layer on the map...');

    // Add the geoview layer by geocore uuid
    const result = mapViewer.layer.addGeoviewLayer(gvConfig);

    // Creating the configuration
    test.addStep('Waiting for the layer to be added...');

    // Wait for the layer to be fully added on the map
    await result.promiseLayer;

    // Throw if errors
    result.layer.throwAggregatedLayerLoadErrors();

    // Creating the configuration
    test.addStep(`Find the layer ${layerPath} on the map...`);

    // Get the layer
    const layer = mapViewer.layer.getGeoviewLayer(layerPath) as AbstractGVLayer;

    // Creating the configuration
    test.addStep(`Waiting for the layer to be loaded...`);

    // Wait until the layer has at least loaded once
    await layer.waitLoadedOnce();

    // Wait until the legend has been fetched
    test.addStep(`Wait for the legend to be fetched...`);
    await layer.waitLegendFetched();

    // Wait until the style has been applied
    if (waitStyle) {
      test.addStep(`Wait for the style to be applied...`);
      await layer.waitStyleApplied();
    }

    // Return the layer
    return layer;
  }

  /**
   * Adds a GeoView layer to the map, waits for it to load completely, and returns the loaded layer instance.
   * Each step of the process is logged into the provided test instance for traceability and debugging.
   * @param {TypeGeoviewLayerConfig} gvConfig - The configuration object defining the GeoView layer to be added.
   * @param {Test<AbstractGVLayer>} test - The test instance used to log each step in the layer setup process.
   * @param {MapViewer} mapViewer - The map viewer to which the layer will be added.
   * @param {string} layerPath - The unique path or ID used to retrieve the added layer from the map viewer.
   * @returns {Promise<AbstractGVLayer>} A promise that resolves to the fully loaded GeoView layer instance.
   * @static
   */
  static async helperStepAddLayerFromUUIDOnMapAndWaitForIt<T>(
    uuid: string,
    test: Test<T>,
    mapViewer: MapViewer,
    layerPath: string
  ): Promise<AbstractGVLayer> {
    // Adding the layer on the map
    test.addStep('Adding the layer on the map...');

    // Add the geoview layer by geocore uuid
    const result = await mapViewer.layer.addGeoviewLayerByGeoCoreUUID(uuid);

    // Creating the configuration
    test.addStep('Waiting for the layer to be added...');

    // Wait for the layer to be fully added on the map
    await result!.promiseLayer;

    // Throw if errors
    result!.layer.throwAggregatedLayerLoadErrors();

    // Creating the configuration
    test.addStep(`Find the layer ${layerPath} on the map...`);

    // Get the layer
    const layer = mapViewer.layer.getGeoviewLayer(layerPath) as AbstractGVLayer;

    // Creating the configuration
    test.addStep(`Waiting for the layer to be loaded...`);

    // Wait until the layer has at least loaded once
    await layer.waitLoadedOnce();

    // Return the layer
    return layer;
  }

  /**
   * Asserts that a layer with the given path exists in the map's legend store.
   * Logs the verification step in the test instance.
   * @param {Test<AbstractGVLayer>} test - The test instance used to record the verification step.
   * @param {MapViewer} mapViewer - The map viewer instance containing the layer store.
   * @param {string} layerPath - The path or ID of the layer to verify.
   * @static
   */
  static helperStepAssertLayerExists(
    test: Test<AbstractGVLayer>,
    mapViewer: MapViewer,
    layerPath: string,
    checkStyle: boolean = true
  ): void {
    // Get the layer legend
    const legendLayer = LegendEventProcessor.getLegendLayerInfo(mapViewer.mapId, layerPath);

    // Verify the layer has a legend information
    test.addStep(`Verify the layer has legend information...`);
    Test.assertIsDefined('legendLayer', legendLayer);

    // If checking the style
    if (checkStyle) {
      // Redirect
      this.helperStepAssertStyleApplied(test, mapViewer, layerPath);
    }
  }

  /**
   * Asserts that a layer with the given path has icons for its style.
   * Logs the verification step in the test instance.
   * @param {Test<AbstractGVLayer>} test - The test instance used to record the verification step.
   * @param {MapViewer} mapViewer - The map viewer instance containing the layer store.
   * @param {string} layerPath - The path or ID of the layer to verify.
   * @static
   */
  static helperStepAssertStyleApplied(test: Test<AbstractGVLayer>, mapViewer: MapViewer, layerPath: string): void {
    // Get the layer legend from the store
    const legendLayer = LegendEventProcessor.getLegendLayerInfo(mapViewer.mapId, layerPath);

    // Verify the icon were also loaded for the layer
    test.addStep(`Verify the icons were loaded for the layer...`);
    Test.assertIsArrayLengthMinimal(legendLayer?.icons, 1);

    // Take the first one
    const firstIcon = legendLayer!.icons[0];
    const hasStyleIcon = firstIcon.iconImage && firstIcon.iconImage !== 'no data';
    Test.assertIsEqual(hasStyleIcon, true);
  }

  /**
   * Removes a layer from the map using its path and asserts that it no longer exists in the legend store.
   * Each step is logged to the provided test instance for traceability.
   * @param {Test<AbstractGVLayer>} test - The test instance used to record each step of the removal process.
   * @param {MapViewer} mapViewer - The map viewer instance from which the layer is removed.
   * @param {string} layerPath - The unique path or ID of the layer to be removed.
   * @static
   */
  static helperFinalizeStepRemoveLayerAndAssert<T>(test: Test<T>, mapViewer: MapViewer, layerPath: string): void {
    // Check that the layer is indeed there
    test.addStep(`Checking the layer path ${layerPath} exists on the map...`);
    Test.assertArrayIncludes(mapViewer.layer.getGeoviewLayerPaths(), layerPath);

    // Remove the added layer
    test.addStep(`Removing the layer ${layerPath} from the map...`);
    mapViewer.layer.removeLayerUsingPath(layerPath);

    // Check the removal worked
    test.addStep(`Check that the layer is indeed removed...`);
    const legendLayers = LegendEventProcessor.getLegendLayers(mapViewer.mapId);
    Test.assertArrayExcludes(
      legendLayers.map((legendLayer) => legendLayer.layerPath),
      layerPath
    );
  }

  /**
   * Removes a layer from the map using its path and asserts that it no longer exists in the legend store.
   * Each step is logged to the provided test instance for traceability.
   * @param {Test<AbstractGVLayer>} test - The test instance used to record each step of the removal process.
   * @param {MapViewer} mapViewer - The map viewer instance from which the layer is removed.
   * @param {string} geoviewLayerId - The geoview layer id of the layer config to be removed.
   * @static
   */
  static helperFinalizeStepRemoveLayerConfigAndAssert<T>(test: Test<T>, mapViewer: MapViewer, geoviewLayerId: string): void {
    // Check that the layer is indeed there
    test.addStep(`Checking the geoview layer ${geoviewLayerId} exists on the map...`);
    Test.assertIsDefined('layerEntryConfig ' + geoviewLayerId, mapViewer.layer.getLayerEntryConfigIfExists(geoviewLayerId));

    // Remove the added layer
    test.addStep(`Removing the geoview layer ${geoviewLayerId} from the map...`);
    mapViewer.layer.removeLayerUsingPath(geoviewLayerId);

    // Validate that it's gone
    test.addStep(`Validate that the layer is indeed gone...`);
    Test.assertIsUndefined('layerEntryConfig ' + geoviewLayerId, mapViewer.layer.getLayerEntryConfigIfExists(geoviewLayerId));
  }

  // #endregion HELPERS
}
