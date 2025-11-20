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
import { GeoTIFF } from 'geoview-core/geo/layer/geoview-layers/raster/geotiff';
import { CSV } from 'geoview-core/geo/layer/geoview-layers/vector/csv';
import { OgcFeature } from 'geoview-core/geo/layer/geoview-layers/vector/ogc-feature';
import { WKB } from 'geoview-core/geo/layer/geoview-layers/vector/wkb';
import { KML } from 'geoview-core/geo/layer/geoview-layers/vector/kml';
import type { GeoViewLayerAddedResult } from 'geoview-core/geo/layer/layer';
import type { TypeLegendItem } from 'geoview-core/core/components/layers/types';

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
      async (test) => {
        // Creating the configuration
        test.addStep('Creating the GeoView Layer Configuration...');

        // Create the config
        const gvConfig = EsriDynamic.createGeoviewLayerConfig(gvLayerId, gvLayerName, layerUrl, false, [
          { id: GVAbstractTester.HISTORICAL_FLOOD_URL_LAYER_ID },
        ]);

        // Redirect to helper to add the layer to the map and wait
        await LayerTester.helperStepAddLayerOnMap(test, this.getMapViewer(), gvConfig);

        // Find the layer and wait until its ready
        return LayerTester.helperStepCheckLayerAtLayerPath(test, this.getMapViewer(), layerPath);
      },
      (test) => {
        // Perform assertions
        // Redirect to helper to check if the layer exists
        LayerTester.helperStepAssertLayerExists(
          test,
          this.getMapViewer(),
          layerPath,
          undefined,
          GVAbstractTester.HISTORICAL_FLOOD_ICON_LIST
        );
      },
      (test) => {
        // Redirect to helper to clean up and assert
        LayerTester.helperFinalizeStepRemoveLayerAndAssert(test, this.getMapViewer(), layerPath);
      }
    );
  }

  /**
   * Tests the behavior of initializing a Geocore layer pointing to an Esri Dynamic layer containing Raster Layers.
   * @returns {Promise<Test<AbstractGVLayer>>}
   * A promise that resolves with the test result, expecting a `AbstractGVLayer`.
   */
  testAddEsriDynamicWithRasterLayersViaGeocore(): Promise<Test<AbstractGVLayer>> {
    const gvLayerId = GVAbstractTester.ESRI_DYNAMIC_LABOUR_FORCE_UUID;
    const layerPathGroup = gvLayerId + '/' + GVAbstractTester.ESRI_DYNAMIC_LABOUR_FORCE_GROUP;
    const layerPathPetroleum = gvLayerId + '/' + GVAbstractTester.ESRI_DYNAMIC_LABOUR_FORCE_PETROLEUM;
    const layerPathMinerals = gvLayerId + '/' + GVAbstractTester.ESRI_DYNAMIC_LABOUR_FORCE_MINERALS;
    const layerPathForestry = gvLayerId + '/' + GVAbstractTester.ESRI_DYNAMIC_LABOUR_FORCE_FORESTRY;
    const layerPathFisheries = gvLayerId + '/' + GVAbstractTester.ESRI_DYNAMIC_LABOUR_FORCE_FISHERIES;
    const layerPathAgriculture = gvLayerId + '/' + GVAbstractTester.ESRI_DYNAMIC_LABOUR_FORCE_AGRICULTURE;
    const layerPathCanecumene = gvLayerId + '/' + GVAbstractTester.ESRI_DYNAMIC_LABOUR_FORCE_CANECUMENE;

    // Test
    return this.test(
      `Test Adding Esri Dynamic with Raster Layers via Geocore...`,
      async (test) => {
        // Creating the configuration
        test.addStep('Creating the GeoView Layer Configuration...');

        // Redirect to helper to add the layer to the map and wait
        await LayerTester.helperStepAddLayerOnMapFromUUID(test, this.getMapViewer(), gvLayerId);

        // Find the layer and wait until its ready
        await LayerTester.helperStepCheckLayerAtLayerPath(test, this.getMapViewer(), layerPathPetroleum);
        await LayerTester.helperStepCheckLayerAtLayerPath(test, this.getMapViewer(), layerPathMinerals);
        await LayerTester.helperStepCheckLayerAtLayerPath(test, this.getMapViewer(), layerPathForestry);
        await LayerTester.helperStepCheckLayerAtLayerPath(test, this.getMapViewer(), layerPathFisheries);
        await LayerTester.helperStepCheckLayerAtLayerPath(test, this.getMapViewer(), layerPathAgriculture);
        return LayerTester.helperStepCheckLayerAtLayerPath(test, this.getMapViewer(), layerPathCanecumene);
      },
      (test) => {
        // Perform assertions
        // Redirect to helper to check if the layer exists
        LayerTester.helperStepAssertLayerExists(
          test,
          this.getMapViewer(),
          layerPathPetroleum,
          undefined,
          GVAbstractTester.ESRI_DYNAMIC_LABOUR_FORCE_PETROLEUM_ICON_LIST
        );
        LayerTester.helperStepAssertLayerExists(
          test,
          this.getMapViewer(),
          layerPathMinerals,
          undefined,
          GVAbstractTester.ESRI_DYNAMIC_LABOUR_FORCE_MINERALS_ICON_LIST
        );
        LayerTester.helperStepAssertLayerExists(
          test,
          this.getMapViewer(),
          layerPathForestry,
          undefined,
          GVAbstractTester.ESRI_DYNAMIC_LABOUR_FORCE_FORESTRY_ICON_LIST
        );
        LayerTester.helperStepAssertLayerExists(
          test,
          this.getMapViewer(),
          layerPathFisheries,
          undefined,
          GVAbstractTester.ESRI_DYNAMIC_LABOUR_FORCE_FISHERIES_ICON_LIST
        );
        LayerTester.helperStepAssertLayerExists(
          test,
          this.getMapViewer(),
          layerPathAgriculture,
          undefined,
          GVAbstractTester.ESRI_DYNAMIC_LABOUR_FORCE_AGRICULTURE_ICON_LIST
        );
        LayerTester.helperStepAssertLayerExists(
          test,
          this.getMapViewer(),
          layerPathCanecumene,
          undefined,
          GVAbstractTester.ESRI_DYNAMIC_LABOUR_FORCE_CANECUMENE_ICON_LIST
        );
      },
      (test) => {
        // Redirect to helper to clean up and assert
        LayerTester.helperFinalizeStepRemoveLayerAndAssert(test, this.getMapViewer(), layerPathGroup);
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
        await LayerTester.helperStepAddLayerOnMap(test, this.getMapViewer(), gvConfig);
      },
      undefined,
      (test) => {
        // Redirect to helper to clean up and assert
        LayerTester.helperFinalizeStepRemoveLayerConfigAndAssert(test, this.getMapViewer(), layerPath);
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
      async (test) => {
        // Creating the configuration
        test.addStep('Creating the GeoView Layer Configuration...');

        // Create the config
        const gvConfig = EsriFeature.createGeoviewLayerConfig(gvLayerId, gvLayerName, layerUrl, false, [
          { id: GVAbstractTester.FOREST_INDUSTRY_LAYER_ID },
        ]);

        // Redirect to helper to add the layer to the map and wait
        await LayerTester.helperStepAddLayerOnMap(test, this.getMapViewer(), gvConfig);

        // Find the layer and wait until its ready
        return LayerTester.helperStepCheckLayerAtLayerPath(test, this.getMapViewer(), layerPath);
      },
      (test) => {
        // Perform assertions
        // Redirect to helper to check if the layer exists
        LayerTester.helperStepAssertLayerExists(
          test,
          this.getMapViewer(),
          layerPath,
          undefined,
          GVAbstractTester.FOREST_INDUSTRY_ICON_LIST
        );
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
        await LayerTester.helperStepAddLayerOnMap(test, this.getMapViewer(), gvConfig);
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
    const layerUrl = GVAbstractTester.IMAGE_SERVER_ELEVATION_URL;
    const layerPath = gvLayerId + '/' + GVAbstractTester.IMAGE_SERVER_ELEVATION_LAYER_ID;
    const gvLayerName = 'Esri Image Elevation';

    // Test
    return this.test(
      `Test Adding Esri Image Elevation on map...`,
      async (test) => {
        // Creating the configuration
        test.addStep('Creating the GeoView Layer Configuration...');

        // Create the config
        const gvConfig = EsriImage.createGeoviewLayerConfigSimple(gvLayerId, gvLayerName, layerUrl, false);

        // Redirect to helper to add the layer to the map and wait
        await LayerTester.helperStepAddLayerOnMap(test, this.getMapViewer(), gvConfig);

        // Find the layer and wait until its ready
        return LayerTester.helperStepCheckLayerAtLayerPath(test, this.getMapViewer(), layerPath);
      },
      (test) => {
        // Perform assertions
        // Redirect to helper to check if the layer exists
        LayerTester.helperStepAssertLayerExists(test, this.getMapViewer(), layerPath);
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
  testAddEsriImageWithUSA(): Promise<Test<AbstractGVLayer>> {
    // Create a random geoview layer id
    const gvLayerId = generateId();
    const layerUrl = GVAbstractTester.IMAGE_SERVER_USA_URL;
    const layerPathGroup = gvLayerId + '/base-group';
    const layerPathCities = gvLayerId + '/base-group/' + GVAbstractTester.IMAGE_SERVER_USA_LAYER_ID_CITIES;
    const layerPathRoads = gvLayerId + '/base-group/' + GVAbstractTester.IMAGE_SERVER_USA_LAYER_ID_ROADS;
    const gvLayerName = 'Esri Image USA';

    // Test
    return this.test(
      `Test Adding Esri Image USA on map...`,
      async (test) => {
        // Creating the configuration
        test.addStep('Creating the GeoView Layer Configuration...');

        // Create the config
        const gvConfig = EsriImage.createGeoviewLayerConfig(gvLayerId, gvLayerName, layerUrl, false, [
          {
            id: GVAbstractTester.IMAGE_SERVER_USA_LAYER_ID_CITIES,
            layerName: 'Cities',
          },
          {
            id: GVAbstractTester.IMAGE_SERVER_USA_LAYER_ID_ROADS,
            layerName: 'Roads',
          },
        ]);

        // Redirect to helper to add the layer to the map and wait
        await LayerTester.helperStepAddLayerOnMap(test, this.getMapViewer(), gvConfig);

        // Find the layer and wait until its ready
        await LayerTester.helperStepCheckLayerAtLayerPath(test, this.getMapViewer(), layerPathCities);
        return LayerTester.helperStepCheckLayerAtLayerPath(test, this.getMapViewer(), layerPathRoads);
      },
      (test) => {
        // Perform assertions
        // Redirect to helper to check if the layer exists
        LayerTester.helperStepAssertLayerExists(test, this.getMapViewer(), layerPathCities);
        LayerTester.helperStepAssertLayerExists(test, this.getMapViewer(), layerPathRoads);
      },
      (test) => {
        // Redirect to helper to clean up and assert
        LayerTester.helperFinalizeStepRemoveLayerAndAssert(test, this.getMapViewer(), layerPathGroup);
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
    const layerUrl = GVAbstractTester.BAD_URL + '/' + GVAbstractTester.IMAGE_SERVER_ELEVATION_LAYER_ID + '/ImageServer'; // Has to be formatted like this, because we're guessing the layer id with url parsing!
    const layerPath = gvLayerId + '/' + GVAbstractTester.IMAGE_SERVER_ELEVATION_LAYER_ID;
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
        await LayerTester.helperStepAddLayerOnMap(test, this.getMapViewer(), gvConfig);
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

    // Test
    return this.test(
      `Test Adding WMS Mundialis on map...`,
      async (test) => {
        // Creating the configuration
        test.addStep('Creating the GeoView Layer Configuration...');

        // Create the config
        const gvConfig = WMS.createGeoviewLayerConfig(
          gvLayerId,
          gvLayerName,
          layerUrl,
          undefined,
          false,
          [{ id: GVAbstractTester.OWS_MUNDIALIS_LAYER_ID }],
          false
        );

        // Redirect to helper to add the layer to the map and wait
        await LayerTester.helperStepAddLayerOnMap(test, this.getMapViewer(), gvConfig);

        // Find the layer and wait until its ready
        return LayerTester.helperStepCheckLayerAtLayerPath(test, this.getMapViewer(), layerPath, undefined, false);
      },
      (test) => {
        // Perform assertions
        // Redirect to helper to check if the layer exists
        LayerTester.helperStepAssertLayerExists(test, this.getMapViewer(), layerPath, GVAbstractTester.OWS_MUNDIALIS_ICON_IMAGE);
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

    // Test
    return this.test(
      `Test Adding WMS Datacube MSI on map...`,
      async (test) => {
        // Creating the configuration
        test.addStep('Creating the GeoView Layer Configuration...');

        // Create the config
        const gvConfig = WMS.createGeoviewLayerConfig(
          gvLayerId,
          gvLayerName,
          layerUrl,
          undefined,
          false,
          [{ id: GVAbstractTester.DATACUBE_MSI_LAYER_NAME_MSI_OR_MORE }],
          false
        );

        // Redirect to helper to add the layer to the map and wait
        await LayerTester.helperStepAddLayerOnMap(test, this.getMapViewer(), gvConfig);

        // Find the layer and wait until its ready
        return LayerTester.helperStepCheckLayerAtLayerPath(test, this.getMapViewer(), layerPath, undefined, false);
      },
      (test) => {
        // Perform assertions
        // Redirect to helper to check if the layer exists
        LayerTester.helperStepAssertLayerExists(test, this.getMapViewer(), layerPath, GVAbstractTester.DATACUBE_MSI_ICON_IMAGE);
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

    // Test
    return this.test(
      `Test Adding WMS Datacube Ring of Fire XML Halifax on map...`,
      async (test) => {
        // Creating the configuration
        test.addStep('Creating the GeoView Layer Configuration...');

        // Create the config
        const gvConfig = WMS.createGeoviewLayerConfig(
          gvLayerId,
          gvLayerName,
          layerUrl,
          undefined,
          false,
          [{ id: GVAbstractTester.DATACUBE_RING_FIRE_LAYER_ID_HALIFAX }],
          false
        );

        // Redirect to helper to add the layer to the map and wait
        await LayerTester.helperStepAddLayerOnMap(test, this.getMapViewer(), gvConfig);

        // Find the layer and wait until its ready
        return LayerTester.helperStepCheckLayerAtLayerPath(test, this.getMapViewer(), layerPath, undefined, false);
      },
      (test) => {
        // Perform assertions
        // Redirect to helper to check if the layer exists
        LayerTester.helperStepAssertLayerExists(
          test,
          this.getMapViewer(),
          layerPath,
          GVAbstractTester.DATACUBE_RING_FIRE_HALIFAX_ICON_IMAGE
        );
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
      LayerServiceMetadataUnableToFetchError,
      async (test) => {
        // Creating the configuration
        test.addStep('Creating the GeoView Layer Configuration...');

        // Create the config
        const gvConfig = WMS.createGeoviewLayerConfig(
          gvLayerId,
          gvLayerName,
          layerUrl,
          undefined,
          false,
          [{ id: GVAbstractTester.DATACUBE_MSI_LAYER_NAME_MSI_OR_MORE }],
          false
        );

        // Redirect to helper to add the layer to the map and wait
        await LayerTester.helperStepAddLayerOnMap(test, this.getMapViewer(), gvConfig);
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
      async (test) => {
        // Creating the configuration
        test.addStep('Creating the GeoView Layer Configuration...');

        // Create the config
        const gvConfig = WFS.createGeoviewLayerConfig(gvLayerId, gvLayerName, layerUrl, false, 'all', [
          { id: GVAbstractTester.GEOMET_URL_CURRENT_COND_LAYER_ID },
        ]);

        // Redirect to helper to add the layer to the map and wait
        await LayerTester.helperStepAddLayerOnMap(test, this.getMapViewer(), gvConfig);

        // Find the layer and wait until its ready
        return LayerTester.helperStepCheckLayerAtLayerPath(test, this.getMapViewer(), layerPath);
      },
      (test) => {
        // Perform assertions
        // Redirect to helper to check if the layer exists
        LayerTester.helperStepAssertLayerExists(test, this.getMapViewer(), layerPath, undefined, GVAbstractTester.GEOMET_ICON_LIST);
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
        await LayerTester.helperStepAddLayerOnMap(test, this.getMapViewer(), gvConfig);
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
        await LayerTester.helperStepAddLayerOnMap(test, this.getMapViewer(), gvConfig);
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
      async (test) => {
        // Creating the configuration
        test.addStep('Creating the GeoView Layer Configuration...');

        // Create the config
        const gvConfig = GeoJSON.createGeoviewLayerConfig(gvLayerId, gvLayerName, layerUrl, false, [
          { id: GVAbstractTester.GEOJSON_POLYGONS },
        ]);

        // Redirect to helper to add the layer to the map and wait
        await LayerTester.helperStepAddLayerOnMap(test, this.getMapViewer(), gvConfig);

        // Find the layer and wait until its ready
        return LayerTester.helperStepCheckLayerAtLayerPath(test, this.getMapViewer(), layerPath);
      },
      (test) => {
        // Perform assertions
        // Redirect to helper to check if the layer exists
        LayerTester.helperStepAssertLayerExists(
          test,
          this.getMapViewer(),
          layerPath,
          undefined,
          GVAbstractTester.GEOJSON_POLYGONS_ICON_LIST
        );
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
        await LayerTester.helperStepAddLayerOnMap(test, this.getMapViewer(), gvConfig);

        // Find the layer and wait until its ready
        await LayerTester.helperStepCheckLayerAtLayerPath(test, this.getMapViewer(), layerPath);
      },
      undefined,
      (test) => {
        // Redirect to helper to clean up and assert
        LayerTester.helperFinalizeStepRemoveLayerConfigAndAssert(test, this.getMapViewer(), layerPath);
      }
    );
  }

  // #endregion GeoJSON

  // #region GeoTIFF

  /**
   * Tests adding a GeoTIFF layer on the map.
   * @returns {Promise<Test<AbstractGVLayer>>} A Promise resolving when the test completes.
   */
  testAddGeotiffLayerWithDatacubeVegetation(): Promise<Test<AbstractGVLayer>> {
    // Create a random geoview layer id
    const gvLayerId = generateId();
    const layerUrl = GVAbstractTester.GEOTIFF_VEGETATION;
    const gvLayerName = 'Datacube Vegetation';
    const layerPath = gvLayerId + '/' + GVAbstractTester.GEOTIFF_VEGETATION_FILE;

    // Test
    return this.test(
      `Test Adding GeoTIFF Datacube Vegetation on map...`,
      async (test) => {
        // Creating the configuration
        test.addStep('Creating the GeoView Layer Configuration...');

        // Create the config
        const gvConfig = GeoTIFF.createGeoviewLayerConfig(gvLayerId, gvLayerName, layerUrl, false, [
          { id: GVAbstractTester.GEOTIFF_VEGETATION_FILE },
        ]);

        // Redirect to helper to add the layer to the map and wait
        await LayerTester.helperStepAddLayerOnMap(test, this.getMapViewer(), gvConfig);

        // Find the layer and wait until its ready, wait longer than default timeout, because TIFF
        return LayerTester.helperStepCheckLayerAtLayerPath(test, this.getMapViewer(), layerPath, 60000, false);
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
   * Tests the behavior of initializing a GeoTIFF layer configuration using an invalid metadata URL.
   * This test verifies that when a GeoTIFF layer configuration is initialized with an invalid or unreachable
   * metadata URL, the initialization process fails as expected and throws a
   * {@link LayerStatusErrorError}.
   * @returns {Promise<Test<LayerStatusErrorError>>}
   * A promise that resolves with the test result, expecting a `LayerStatusErrorError`.
   */
  testAddGeoTIFFWithBadUrl(): Promise<Test<LayerStatusErrorError>> {
    // GV: In the case of a GeoTIFF, since we don't validate the url until we try to fetch the data,
    // GV: we have to wait until the layer gets on the map and throws an error, which will since the layer can't reach the data.
    // Create a random geoview layer id
    const gvLayerId = generateId();
    const layerUrl = GVAbstractTester.BAD_URL;
    const layerPath = gvLayerId + '/' + GVAbstractTester.GEOTIFF_VEGETATION_FILE;
    const gvLayerName = 'GeoTIFF Vegetation';

    // Test
    return this.testError(
      `Test Adding GeoTIFF with bad url...`,
      LayerStatusErrorError,
      async (test) => {
        // Creating the configuration
        test.addStep('Creating the GeoView Layer Configuration...');

        // Create the config
        const gvConfig = GeoTIFF.createGeoviewLayerConfig(gvLayerId, gvLayerName, layerUrl, false, [
          { id: GVAbstractTester.GEOTIFF_VEGETATION_FILE },
        ]);

        // Redirect to helper to add the layer to the map and wait
        await LayerTester.helperStepAddLayerOnMap(test, this.getMapViewer(), gvConfig);

        // Find the layer and wait until its ready
        await LayerTester.helperStepCheckLayerAtLayerPath(test, this.getMapViewer(), layerPath);
      },
      undefined,
      (test) => {
        // Redirect to helper to clean up and assert
        LayerTester.helperFinalizeStepRemoveLayerConfigAndAssert(test, this.getMapViewer(), layerPath);
      }
    );
  }

  // #endregion GeoTIFF

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
      async (test) => {
        // Creating the configuration
        test.addStep('Creating the GeoView Layer Configuration...');

        // Create the config
        const gvConfig = CSV.createGeoviewLayerConfig(gvLayerId, gvLayerName, layerUrl, false, [
          { id: GVAbstractTester.CSV_STATION_LIST_FILE },
        ]);

        // Redirect to helper to add the layer to the map and wait
        await LayerTester.helperStepAddLayerOnMap(test, this.getMapViewer(), gvConfig);

        // Find the layer and wait until its ready
        return LayerTester.helperStepCheckLayerAtLayerPath(test, this.getMapViewer(), layerPath);
      },
      (test) => {
        // Perform assertions
        // Redirect to helper to check if the layer exists
        LayerTester.helperStepAssertLayerExists(test, this.getMapViewer(), layerPath, undefined, GVAbstractTester.CSV_STATION_ICON_LIST);
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
        await LayerTester.helperStepAddLayerOnMap(test, this.getMapViewer(), gvConfig);

        // Find the layer and wait until its ready
        await LayerTester.helperStepCheckLayerAtLayerPath(test, this.getMapViewer(), layerPath);
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
      async (test) => {
        // Creating the configuration
        test.addStep('Creating the GeoView Layer Configuration...');

        // Create the config
        const gvConfig = OgcFeature.createGeoviewLayerConfig(gvLayerId, gvLayerName, layerUrl, false, [
          { id: GVAbstractTester.PYGEOAPI_B6RYUVAKK5_LAKES },
        ]);

        // Redirect to helper to add the layer to the map and wait
        await LayerTester.helperStepAddLayerOnMap(test, this.getMapViewer(), gvConfig);

        // Find the layer and wait until its ready
        return LayerTester.helperStepCheckLayerAtLayerPath(test, this.getMapViewer(), layerPath);
      },
      (test) => {
        // Perform assertions
        // Redirect to helper to check if the layer exists
        LayerTester.helperStepAssertLayerExists(
          test,
          this.getMapViewer(),
          layerPath,
          undefined,
          GVAbstractTester.PYGEOAPI_B6RYUVAKK5_LAKES_ICON_LIST
        );
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
        await LayerTester.helperStepAddLayerOnMap(test, this.getMapViewer(), gvConfig);
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

    // Test
    return this.test(
      `Test Adding a WKB with South Africa layer on map...`,
      async (test) => {
        // Creating the configuration
        test.addStep('Creating the GeoView Layer Configuration...');

        // Create the config
        const gvConfig = WKB.createGeoviewLayerConfig(gvLayerId, gvLayerName, layerUrl, false, [{ id: GVAbstractTester.WKB_SOUTH_AFRICA }]);

        // Redirect to helper to add the layer to the map and wait
        await LayerTester.helperStepAddLayerOnMap(test, this.getMapViewer(), gvConfig);

        // Find the layer and wait until its ready
        return LayerTester.helperStepCheckLayerAtLayerPath(test, this.getMapViewer(), layerPath, undefined, false);
      },
      (test) => {
        // Perform assertions
        // Redirect to helper to check if the layer exists
        LayerTester.helperStepAssertLayerExists(test, this.getMapViewer(), layerPath);
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
        await LayerTester.helperStepAddLayerOnMap(test, this.getMapViewer(), gvConfig);

        // Find the layer and wait until its ready
        await LayerTester.helperStepCheckLayerAtLayerPath(test, this.getMapViewer(), layerPath);
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

    // Test
    return this.test(
      `Test Adding a KML with Tornado layer on map...`,
      async (test) => {
        // Creating the configuration
        test.addStep('Creating the GeoView Layer Configuration...');

        // Create the config
        const gvConfig = KML.createGeoviewLayerConfig(gvLayerId, gvLayerName, layerUrl, false, [{ id: GVAbstractTester.KML_TORNADO_FILE }]);

        // Redirect to helper to add the layer to the map and wait
        await LayerTester.helperStepAddLayerOnMap(test, this.getMapViewer(), gvConfig);

        // Find the layer and wait until its ready
        return LayerTester.helperStepCheckLayerAtLayerPath(test, this.getMapViewer(), layerPath, undefined, false);
      },
      (test) => {
        // Perform assertions
        // Redirect to helper to check if the layer exists
        LayerTester.helperStepAssertLayerExists(test, this.getMapViewer(), layerPath);
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
        await LayerTester.helperStepAddLayerOnMap(test, this.getMapViewer(), gvConfig);

        // Find the layer and wait until its ready
        await LayerTester.helperStepCheckLayerAtLayerPath(test, this.getMapViewer(), layerPath);
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
   * @param {Test<AbstractGVLayer>} test - The test instance used to log each step in the layer setup process.
   * @param {MapViewer} mapViewer - The map viewer to which the layer will be added.
   * @param {TypeGeoviewLayerConfig} gvConfig - The configuration object defining the GeoView layer to be added.
   * @returns {Promise<GeoViewLayerAddedResult>} A promise that resolves to the fully loaded GeoView layer instance.
   * @static
   */
  static async helperStepAddLayerOnMap<T>(
    test: Test<T>,
    mapViewer: MapViewer,
    gvConfig: TypeGeoviewLayerConfig
  ): Promise<GeoViewLayerAddedResult> {
    // Adding the layer on the map
    test.addStep('Adding the layer on the map...');

    // Add the geoview layer by geocore uuid
    const result = mapViewer.layer.addGeoviewLayer(gvConfig);

    // Creating the configuration
    test.addStep('Waiting for the layer to be added...');

    // Wait for the layer to be fully added on the map
    await result.promiseLayer;

    // Return the layer
    return result;
  }

  /**
   * Adds a GeoView layer to the map, waits for it to load completely, and returns the loaded layer instance.
   * Each step of the process is logged into the provided test instance for traceability and debugging.
   * @param {Test<AbstractGVLayer>} test - The test instance used to log each step in the layer setup process.
   * @param {MapViewer} mapViewer - The map viewer to which the layer will be added.
   * @param {TypeGeoviewLayerConfig} gvConfig - The configuration object defining the GeoView layer to be added.
   * @returns {Promise<GeoViewLayerAddedResult | void>} A promise that resolves to the fully loaded GeoView layer instance.
   * @static
   */
  static async helperStepAddLayerOnMapFromUUID<T>(
    test: Test<T>,
    mapViewer: MapViewer,
    uuid: string
  ): Promise<GeoViewLayerAddedResult | void> {
    // Adding the layer on the map
    test.addStep('Adding the layer on the map...');

    // Add the geoview layer by geocore uuid
    const result = await mapViewer.layer.addGeoviewLayerByGeoCoreUUID(uuid);

    // Creating the configuration
    test.addStep('Waiting for the layer to be added...');

    // Wait for the layer to be fully added on the map
    await result?.promiseLayer;

    // Return the layer
    return result;
  }

  /**
   * Adds a GeoView layer to the map, waits for it to load completely, and returns the loaded layer instance.
   * Each step of the process is logged into the provided test instance for traceability and debugging.
   * @param {Test<AbstractGVLayer>} test - The test instance used to log each step in the layer setup process.
   * @param {MapViewer} mapViewer - The map viewer to which the layer will be added.
   * @param {string} layerPath - The unique path or ID used to retrieve the added layer from the map viewer.
   * @param {number} timeoutOnLoad - A timeout for the period to wait for the layer to be loaded. Defaults to 30,000 ms.
   * @param {boolean} [waitStyle] - Indicates if should wait for the style to be applied (expecting a style icon). Default: true.
   * @returns {Promise<AbstractGVLayer>} A promise that resolves to the fully loaded GeoView layer instance.
   * @static
   */
  static async helperStepCheckLayerAtLayerPath<T>(
    test: Test<T>,
    mapViewer: MapViewer,
    layerPath: string,
    timeoutOnLoad: number = 30000,
    waitStyle: boolean = true
  ): Promise<AbstractGVLayer> {
    // Creating the configuration
    test.addStep(`Find the layer ${layerPath} on the map...`);

    // Get the layer
    const layer = mapViewer.layer.getGeoviewLayer(layerPath) as AbstractGVLayer;

    // Creating the configuration
    test.addStep(`Waiting for the layer to be loaded...`);

    // Wait until the layer has at least loaded once
    await layer.waitLoadedOnce(timeoutOnLoad);

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
   * Asserts that a layer with the given path exists in the map's legend store.
   * Logs the verification step in the test instance.
   * If `checkIconImage` or `checkIconsList` is provided, this method will also
   * verify that the layer's style has been applied by delegating to
   * `helperStepAssertStyleApplied`.
   * @param {Test<AbstractGVLayer>} test - The test instance used to record the verification steps.
   * @param {MapViewer} mapViewer - The map viewer instance containing the layer store.
   * @param {string} layerPath - The path or ID of the layer to verify.
   * @param {string} [checkIconImage] - Optional expected icon image.
   *   If provided, the function will additionally check that the legend contains a matching icon.
   * @param {TypeLegendItem[]} [checkIconsList] - Optional list of expected legend icon items.
   *   If provided, the function will additionally verify that the legend's icon list matches this array.
   * @static
   */
  static helperStepAssertLayerExists(
    test: Test<AbstractGVLayer>,
    mapViewer: MapViewer,
    layerPath: string,
    checkIconImage?: string,
    checkIconsList?: Partial<TypeLegendItem>[]
  ): void {
    // Get the layer legend
    const legendLayer = LegendEventProcessor.getLegendLayerInfo(mapViewer.mapId, layerPath);

    // Verify the layer has a legend information
    test.addStep(`Verify the layer ${layerPath} has legend information...`);
    Test.assertIsDefined('legendLayer', legendLayer);

    // If checking the style
    if (checkIconImage || checkIconsList) {
      // Redirect
      this.helperStepAssertStyleApplied(test, mapViewer, layerPath, checkIconImage, checkIconsList);
    }
  }

  /**
   * Asserts that a layer with the given path has icons for its style.
   * Logs the verification step in the test instance.
   * This validates that the layer's legend contains at least one icon and that the
   * first icon indicates a valid style (i.e., the icon image is present and not `"no data"`).
   * Optionally validates:
   * - that the first icon's image matches `checkIconImage`
   * - that the first icon's list of legend items matches `checkIconsList`
   *
   * @param {Test<AbstractGVLayer>} test - The test instance used to record the verification steps.
   * @param {MapViewer} mapViewer - The map viewer instance containing the layer store.
   * @param {string} layerPath - The path or ID of the layer whose style icons are being verified.
   * @param {string} [checkIconImage] - Optional expected icon image to validate against the legend.
   * @param {TypeLegendItem[]} [checkIconsList] - Optional expected list of legend icon items.
   * @static
   */
  static helperStepAssertStyleApplied(
    test: Test<AbstractGVLayer>,
    mapViewer: MapViewer,
    layerPath: string,
    checkIconImage?: string,
    checkIconsList?: Partial<TypeLegendItem>[]
  ): void {
    // Get the layer legend from the store
    const legendLayer = LegendEventProcessor.getLegendLayerInfo(mapViewer.mapId, layerPath);

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
    if (checkIconsList) {
      // Verify the layer has icons list
      test.addStep(`Verify each legend icon information...`);
      Test.assertIsArrayEqualJsons(firstIcon.iconList!, checkIconsList);
    }
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
