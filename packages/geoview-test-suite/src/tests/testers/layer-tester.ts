import { Test } from '../core/test';
import { GVAbstractTester } from './abstract-gv-tester';
import { LayerStatusErrorError } from 'geoview-core/core/exceptions/layer-exceptions';
import { LayerNoCapabilitiesError, LayerServiceMetadataUnableToFetchError } from 'geoview-core/core/exceptions/layer-exceptions';
import type { TypeGeoviewLayerConfig } from 'geoview-core/api/types/layer-schema-types';
import type { AbstractGVLayer } from 'geoview-core/geo/layer/gv-layers/abstract-gv-layer';
import { EsriDynamic } from 'geoview-core/geo/layer/geoview-layers/raster/esri-dynamic';
import { generateId } from 'geoview-core/core/utils/utilities';
import { AbstractBaseLayerEntryConfig } from 'geoview-core/api/config/validation-classes/abstract-base-layer-entry-config';
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
import type { GeoViewLayerAddedResult } from 'geoview-core/core/controllers/layer-creator-controller';
import type { TypeMapFeaturesInstance } from 'geoview-core/api/types/map-schema-types';
import type { TypeLegendItem } from 'geoview-core/core/components/layers/types';
import { getStoreLayerStateLegendLayerByPath } from 'geoview-core/core/stores/store-interface-and-intial-values/layer-state';

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
        await this.helperStepAddLayerOnMap(test, gvConfig);

        // Find the layer and wait until its ready
        return this.helperStepCheckLayerAtLayerPath(test, layerPath);
      },
      (test) => {
        // Perform assertions
        // Redirect to helper to check if the layer exists
        LayerTester.helperStepAssertLayerExists(test, this.getMapId(), layerPath, undefined, GVAbstractTester.HISTORICAL_FLOOD_ICON_LIST);
      },
      (test) => {
        // Redirect to helper to clean up and assert
        this.helperFinalizeStepRemoveLayerAndAssert(test, layerPath);
      }
    );
  }

  /**
   * Tests the behavior of initializing a Geocore layer pointing to an Esri Dynamic layer containing Raster Layers.
   *
   * @returns A promise that resolves with the test result
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
        await this.helperStepAddLayerOnMapFromUUID(test, gvLayerId);

        // Find the layer and wait until its ready
        await this.helperStepCheckLayerAtLayerPath(test, layerPathPetroleum);
        await this.helperStepCheckLayerAtLayerPath(test, layerPathMinerals);
        await this.helperStepCheckLayerAtLayerPath(test, layerPathForestry);
        await this.helperStepCheckLayerAtLayerPath(test, layerPathFisheries);
        await this.helperStepCheckLayerAtLayerPath(test, layerPathAgriculture);
        return this.helperStepCheckLayerAtLayerPath(test, layerPathCanecumene);
      },
      (test) => {
        // Perform assertions
        // Redirect to helper to check if the layer exists
        LayerTester.helperStepAssertLayerExists(
          test,
          this.getMapId(),
          layerPathPetroleum,
          undefined,
          GVAbstractTester.ESRI_DYNAMIC_LABOUR_FORCE_PETROLEUM_ICON_LIST
        );
        LayerTester.helperStepAssertLayerExists(
          test,
          this.getMapId(),
          layerPathMinerals,
          undefined,
          GVAbstractTester.ESRI_DYNAMIC_LABOUR_FORCE_MINERALS_ICON_LIST
        );
        LayerTester.helperStepAssertLayerExists(
          test,
          this.getMapId(),
          layerPathForestry,
          undefined,
          GVAbstractTester.ESRI_DYNAMIC_LABOUR_FORCE_FORESTRY_ICON_LIST
        );
        LayerTester.helperStepAssertLayerExists(
          test,
          this.getMapId(),
          layerPathFisheries,
          undefined,
          GVAbstractTester.ESRI_DYNAMIC_LABOUR_FORCE_FISHERIES_ICON_LIST
        );
        LayerTester.helperStepAssertLayerExists(
          test,
          this.getMapId(),
          layerPathAgriculture,
          undefined,
          GVAbstractTester.ESRI_DYNAMIC_LABOUR_FORCE_AGRICULTURE_ICON_LIST
        );
        LayerTester.helperStepAssertLayerExists(
          test,
          this.getMapId(),
          layerPathCanecumene,
          undefined,
          GVAbstractTester.ESRI_DYNAMIC_LABOUR_FORCE_CANECUMENE_ICON_LIST
        );
      },
      (test) => {
        // Redirect to helper to clean up and assert
        this.helperFinalizeStepRemoveLayerAndAssert(test, layerPathGroup);
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
        await this.helperStepAddLayerOnMap(test, gvConfig);
      },
      undefined,
      (test) => {
        // Redirect to helper to clean up and assert
        this.helperFinalizeStepRemoveLayerConfigAndAssert(test, layerPath);
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
        await this.helperStepAddLayerOnMap(test, gvConfig);

        // Find the layer and wait until its ready
        return this.helperStepCheckLayerAtLayerPath(test, layerPath);
      },
      (test) => {
        // Perform assertions
        // Redirect to helper to check if the layer exists
        LayerTester.helperStepAssertLayerExists(test, this.getMapId(), layerPath, undefined, GVAbstractTester.FOREST_INDUSTRY_ICON_LIST);
      },
      (test) => {
        // Redirect to helper to clean up and assert
        this.helperFinalizeStepRemoveLayerAndAssert(test, layerPath);
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
        await this.helperStepAddLayerOnMap(test, gvConfig);
      },
      undefined,
      (test) => {
        // Redirect to helper to clean up and assert
        this.helperFinalizeStepRemoveLayerConfigAndAssert(test, layerPath);
      }
    );
  }

  /**
   * Tests adding an Esri Feature service that contains some invalid geometries.
   *
   * @returns A promise that resolves when the test completes
   */
  testAddEsriFeatureInvalidGeometry(): Promise<Test<AbstractGVLayer>> {
    // Create a random geoview layer id
    const gvLayerId = generateId();
    const layerUrl = GVAbstractTester.LOW_HEAD_HYDRO_DATABASE;
    const layerPath = gvLayerId + '/' + GVAbstractTester.LOW_HEAD_HYDRO_DATABASE_YUKON_ID;
    const gvLayerName = 'Yukon Low Head Hydro';

    // Test
    return this.test(
      `Test Adding 'Yukon Low head' on map...`,
      async (test) => {
        // Creating the configuration
        test.addStep('Creating the GeoView Layer Configuration...');

        // Create the config
        const gvConfig = EsriFeature.createGeoviewLayerConfig(gvLayerId, gvLayerName, layerUrl, false, [
          { id: GVAbstractTester.LOW_HEAD_HYDRO_DATABASE_YUKON_ID },
        ]);

        // Redirect to helper to add the layer to the map and wait
        await this.helperStepAddLayerOnMap(test, gvConfig);

        // Find the layer and wait until its ready
        return this.helperStepCheckLayerAtLayerPath(test, layerPath);
      },
      (test) => {
        // Perform assertions
        // Redirect to helper to check if the layer exists
        LayerTester.helperStepAssertLayerExists(test, this.getMapId(), layerPath, undefined, undefined);
      },
      (test) => {
        // Redirect to helper to clean up and assert
        this.helperFinalizeStepRemoveLayerAndAssert(test, layerPath);
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
        await this.helperStepAddLayerOnMap(test, gvConfig);

        // Find the layer and wait until its ready
        return this.helperStepCheckLayerAtLayerPath(test, layerPath);
      },
      (test) => {
        // Perform assertions
        // Redirect to helper to check if the layer exists
        LayerTester.helperStepAssertLayerExists(test, this.getMapId(), layerPath);
      },
      (test) => {
        // Redirect to helper to clean up and assert
        this.helperFinalizeStepRemoveLayerAndAssert(test, layerPath);
      }
    );
  }

  /**
   * Tests adding an EsriImage with USA layer on the map.
   *
   * @returns A promise that resolves when the test completes
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
        await this.helperStepAddLayerOnMap(test, gvConfig);

        // Find the layer and wait until its ready
        await this.helperStepCheckLayerAtLayerPath(test, layerPathCities);
        return this.helperStepCheckLayerAtLayerPath(test, layerPathRoads);
      },
      (test) => {
        // Perform assertions
        // Redirect to helper to check if the layer exists
        LayerTester.helperStepAssertLayerExists(test, this.getMapId(), layerPathCities);
        LayerTester.helperStepAssertLayerExists(test, this.getMapId(), layerPathRoads);
      },
      (test) => {
        // Redirect to helper to clean up and assert
        this.helperFinalizeStepRemoveLayerAndAssert(test, layerPathGroup);
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
        await this.helperStepAddLayerOnMap(test, gvConfig);
      },
      undefined,
      (test) => {
        // Redirect to helper to clean up and assert
        this.helperFinalizeStepRemoveLayerConfigAndAssert(test, layerPath);
      }
    );
  }

  // #endregion ESRI IMAGE

  // #region WMS

  /**
   * Tests adding a WMS Layer from OWS Mundialis on the map.
   *
   * @returns A promise that resolves when the test completes
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
        const gvConfig = WMS.createGeoviewLayerConfig(gvLayerId, gvLayerName, layerUrl, undefined, false, [
          { id: GVAbstractTester.OWS_MUNDIALIS_LAYER_ID },
        ]);

        // Redirect to helper to add the layer to the map and wait
        await this.helperStepAddLayerOnMap(test, gvConfig);

        // Find the layer and wait until its ready
        return this.helperStepCheckLayerAtLayerPath(test, layerPath, undefined, false);
      },
      (test) => {
        // Perform assertions
        // Redirect to helper to check if the layer exists
        LayerTester.helperStepAssertLayerExists(test, this.getMapId(), layerPath, GVAbstractTester.OWS_MUNDIALIS_ICON_IMAGE);
      },
      (test) => {
        // Redirect to helper to clean up and assert
        this.helperFinalizeStepRemoveLayerAndAssert(test, layerPath);
      }
    );
  }

  /**
   * Tests adding a WMS Layer with Datacube MSI on the map.
   *
   * @returns A promise that resolves when the test completes
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
        await this.helperStepAddLayerOnMap(test, gvConfig);

        // Find the layer and wait until its ready
        return this.helperStepCheckLayerAtLayerPath(test, layerPath, undefined, false);
      },
      (test) => {
        // Perform assertions
        // Redirect to helper to check if the layer exists
        LayerTester.helperStepAssertLayerExists(test, this.getMapId(), layerPath, GVAbstractTester.DATACUBE_MSI_ICON_IMAGE);
      },
      (test) => {
        // Redirect to helper to clean up and assert
        this.helperFinalizeStepRemoveLayerAndAssert(test, layerPath);
      }
    );
  }

  /**
   * Tests adding a WMS Layer with Datacube Ring of Fire on the map.
   *
   * @returns A promise that resolves when the test completes
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
        await this.helperStepAddLayerOnMap(test, gvConfig);

        // Find the layer and wait until its ready
        return this.helperStepCheckLayerAtLayerPath(test, layerPath, undefined, false);
      },
      (test) => {
        // Perform assertions
        // Redirect to helper to check if the layer exists
        LayerTester.helperStepAssertLayerExists(test, this.getMapId(), layerPath, GVAbstractTester.DATACUBE_RING_FIRE_HALIFAX_ICON_IMAGE);
      },
      (test) => {
        // Redirect to helper to clean up and assert
        this.helperFinalizeStepRemoveLayerAndAssert(test, layerPath);
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
        await this.helperStepAddLayerOnMap(test, gvConfig);
      },
      undefined,
      (test) => {
        // Redirect to helper to clean up and assert
        this.helperFinalizeStepRemoveLayerConfigAndAssert(test, layerPath);
      }
    );
  }

  // #endregion WMS

  // #region WFS

  /**
   * Tests adding a WFS with Geomet Current Conditions layer on the map.
   *
   * @returns A promise that resolves when the test completes
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
        await this.helperStepAddLayerOnMap(test, gvConfig);

        // Find the layer and wait until its ready
        return this.helperStepCheckLayerAtLayerPath(test, layerPath);
      },
      (test) => {
        // Perform assertions
        // Redirect to helper to check if the layer exists
        LayerTester.helperStepAssertLayerExists(test, this.getMapId(), layerPath, undefined, GVAbstractTester.GEOMET_ICON_LIST);
      },
      (test) => {
        // Redirect to helper to clean up and assert
        this.helperFinalizeStepRemoveLayerAndAssert(test, layerPath);
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
        await this.helperStepAddLayerOnMap(test, gvConfig);
      },
      undefined,
      (test) => {
        // Redirect to helper to clean up and assert
        this.helperFinalizeStepRemoveLayerConfigAndAssert(test, layerPath);
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
        await this.helperStepAddLayerOnMap(test, gvConfig);
      },
      undefined,
      (test) => {
        // Redirect to helper to clean up and assert
        this.helperFinalizeStepRemoveLayerConfigAndAssert(test, layerPath);
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

        // Set the service date format, because Polygons date have weirdly formatted dates
        gvConfig.serviceDateFormat = 'DD/MM/YYYYTHH:mm:ss';

        // Redirect to helper to add the layer to the map and wait
        await this.helperStepAddLayerOnMap(test, gvConfig);

        // Find the layer and wait until its ready
        return this.helperStepCheckLayerAtLayerPath(test, layerPath);
      },
      (test) => {
        // Perform assertions
        // Redirect to helper to check if the layer exists
        LayerTester.helperStepAssertLayerExists(test, this.getMapId(), layerPath, undefined, GVAbstractTester.GEOJSON_POLYGONS_ICON_LIST);
      },
      (test) => {
        // Redirect to helper to clean up and assert
        this.helperFinalizeStepRemoveLayerAndAssert(test, layerPath);
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
        await this.helperStepAddLayerOnMap(test, gvConfig);

        // Find the layer and wait until its ready
        await this.helperStepCheckLayerAtLayerPath(test, layerPath);
      },
      undefined,
      (test) => {
        // Redirect to helper to clean up and assert
        this.helperFinalizeStepRemoveLayerConfigAndAssert(test, layerPath);
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
        await this.helperStepAddLayerOnMap(test, gvConfig);

        // Find the layer and wait until its ready, wait longer than default timeout, because TIFF
        return this.helperStepCheckLayerAtLayerPath(test, layerPath, 60000, false);
      },
      (test) => {
        // Perform assertions
        // Redirect to helper to check if the layer exists
        return LayerTester.helperStepAssertLayerExists(test, this.getMapId(), layerPath);
      },
      (test) => {
        // Redirect to helper to clean up and assert
        this.helperFinalizeStepRemoveLayerAndAssert(test, layerPath);
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
        await this.helperStepAddLayerOnMap(test, gvConfig);

        // Find the layer and wait until its ready
        await this.helperStepCheckLayerAtLayerPath(test, layerPath);
      },
      undefined,
      (test) => {
        // Redirect to helper to clean up and assert
        this.helperFinalizeStepRemoveLayerConfigAndAssert(test, layerPath);
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
        await this.helperStepAddLayerOnMap(test, gvConfig);

        // Find the layer and wait until its ready
        return this.helperStepCheckLayerAtLayerPath(test, layerPath);
      },
      (test) => {
        // Perform assertions
        // Redirect to helper to check if the layer exists
        LayerTester.helperStepAssertLayerExists(test, this.getMapId(), layerPath, undefined, GVAbstractTester.CSV_STATION_ICON_LIST);
      },
      (test) => {
        // Redirect to helper to clean up and assert
        this.helperFinalizeStepRemoveLayerAndAssert(test, layerPath);
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
        await this.helperStepAddLayerOnMap(test, gvConfig);

        // Find the layer and wait until its ready
        await this.helperStepCheckLayerAtLayerPath(test, layerPath);
      },
      undefined,
      (test) => {
        // Redirect to helper to clean up and assert
        this.helperFinalizeStepRemoveLayerConfigAndAssert(test, layerPath);
      }
    );
  }

  // #endregion CSV

  // #region OGC Feature

  /**
   * Tests adding an OGC Feature layer with Pygeoapi on the map.
   *
   * @returns A promise that resolves when the test completes
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
        await this.helperStepAddLayerOnMap(test, gvConfig);

        // Find the layer and wait until its ready
        return this.helperStepCheckLayerAtLayerPath(test, layerPath);
      },
      (test) => {
        // Perform assertions
        // Redirect to helper to check if the layer exists
        LayerTester.helperStepAssertLayerExists(
          test,
          this.getMapId(),
          layerPath,
          undefined,
          GVAbstractTester.PYGEOAPI_B6RYUVAKK5_LAKES_ICON_LIST
        );
      },
      (test) => {
        // Redirect to helper to clean up and assert
        this.helperFinalizeStepRemoveLayerAndAssert(test, layerPath);
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
        await this.helperStepAddLayerOnMap(test, gvConfig);
      },
      undefined,
      (test) => {
        // Redirect to helper to clean up and assert
        this.helperFinalizeStepRemoveLayerConfigAndAssert(test, layerPath);
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
        await this.helperStepAddLayerOnMap(test, gvConfig);

        // Find the layer and wait until its ready
        return this.helperStepCheckLayerAtLayerPath(test, layerPath, undefined, false);
      },
      (test) => {
        // Perform assertions
        // Redirect to helper to check if the layer exists
        LayerTester.helperStepAssertLayerExists(test, this.getMapId(), layerPath);
      },
      (test) => {
        // Redirect to helper to clean up and assert
        this.helperFinalizeStepRemoveLayerAndAssert(test, layerPath);
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
        await this.helperStepAddLayerOnMap(test, gvConfig);

        // Find the layer and wait until its ready
        await this.helperStepCheckLayerAtLayerPath(test, layerPath);
      },
      undefined,
      (test) => {
        // Redirect to helper to clean up and assert
        this.helperFinalizeStepRemoveLayerConfigAndAssert(test, layerPath);
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
        await this.helperStepAddLayerOnMap(test, gvConfig);

        // Find the layer and wait until its ready
        return this.helperStepCheckLayerAtLayerPath(test, layerPath, undefined, false);
      },
      (test) => {
        // Perform assertions
        // Redirect to helper to check if the layer exists
        LayerTester.helperStepAssertLayerExists(test, this.getMapId(), layerPath);
      },
      (test) => {
        // Redirect to helper to clean up and assert
        this.helperFinalizeStepRemoveLayerAndAssert(test, layerPath);
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
        await this.helperStepAddLayerOnMap(test, gvConfig);

        // Find the layer and wait until its ready
        await this.helperStepCheckLayerAtLayerPath(test, layerPath);
      },
      undefined,
      (test) => {
        // Redirect to helper to clean up and assert
        this.helperFinalizeStepRemoveLayerConfigAndAssert(test, layerPath);
      }
    );
  }

  // #endregion KML

  // #region SETTINGS

  /**
   * Tests initial settings properly cascading to sub layers.
   *
   * @returns A promise that resolves when the test completes
   */
  testInitialSettingsCascade(): Promise<Test<TypeMapFeaturesInstance | undefined>> {
    // The config
    const config = GVAbstractTester.INITIAL_SETTINGS_CONFIG;

    // Expected config
    const expectedResults = {
      groupHighlight: false,
      groupRemove: false,
      childHighlight: true,
    };

    // Test the WMS
    return this.test(
      'Test initial settings cascade',
      async (test) => {
        // Add the layer to the map and get the AbstractGeoViewLayer
        await this.helperStepAddLayerOnMap(test, config as unknown as TypeGeoviewLayerConfig);

        // Return created map config
        return this.getMapViewer().createMapConfigFromMapState();
      },
      (test, result) => {
        const layer = result?.map?.listOfGeoviewLayerConfig.find(
          (geoviewLayer) => geoviewLayer.geoviewLayerId === config.geoviewLayerId
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
        // Redirect to helper to clean up and assert
        this.helperFinalizeStepRemoveLayerConfigAndAssert(test, 'geojsonLYR1/point-feature-group');
      }
    );
  }

  // #endregion SETTINGS

  // #region HELPERS

  /**
   * Adds a GeoView layer to the map, waits for it to load completely, and returns the loaded layer instance.
   *
   * Each step of the process is logged into the provided test instance for traceability and debugging.
   *
   * @param test - The test instance used to log each step in the layer setup process
   * @param mapViewer - The map viewer to which the layer will be added
   * @param gvConfig - The configuration object defining the GeoView layer to be added
   * @returns A promise that resolves to the fully loaded GeoView layer instance
   */
  async helperStepAddLayerOnMap<T>(test: Test<T>, gvConfig: TypeGeoviewLayerConfig): Promise<GeoViewLayerAddedResult> {
    // Adding the layer on the map
    test.addStep('Adding the layer on the map...');

    // Add the geoview layer by geocore uuid
    const result = this.getControllersRegistry().layerCreatorController.addGeoviewLayer(gvConfig);

    // Creating the configuration
    test.addStep('Waiting for the layer to be added...');

    // Wait for the layer to be fully added on the map
    await result.promiseLayer;

    // Return the layer
    return result;
  }

  /**
   * Adds a GeoView layer to the map by GeoCore UUID, waits for it to load completely, and returns the loaded layer instance.
   *
   * Each step of the process is logged into the provided test instance for traceability and debugging.
   *
   * @param test - The test instance used to log each step in the layer setup process
   * @param mapViewer - The map viewer to which the layer will be added
   * @param uuid - The GeoCore UUID used to add the layer
   * @returns A promise that resolves to the fully loaded GeoView layer instance
   */
  async helperStepAddLayerOnMapFromUUID<T>(test: Test<T>, uuid: string): Promise<GeoViewLayerAddedResult | void> {
    // Adding the layer on the map
    test.addStep('Adding the layer on the map...');

    // Add the geoview layer by geocore uuid
    const result = await this.getControllersRegistry().layerCreatorController.addGeoviewLayerByGeoCoreUUID(uuid);

    // Creating the configuration
    test.addStep('Waiting for the layer to be added...');

    // Wait for the layer to be fully added on the map
    await result?.promiseLayer;

    // Return the layer
    return result;
  }

  /**
   * Checks that a layer exists at the given layer path and waits for it to be fully loaded.
   *
   * Each step of the process is logged into the provided test instance for traceability and debugging.
   *
   * @param test - The test instance used to log each step in the layer setup process
   * @param mapViewer - The map viewer to which the layer will be added
   * @param layerPath - The unique path or ID used to retrieve the added layer from the map viewer
   * @param timeoutOnLoad - A timeout for the period to wait for the layer to be loaded. Defaults to 30,000 ms
   * @param waitStyle - Optional indicates if should wait for the style to be applied (expecting a style icon). Default: true
   * @returns A promise that resolves to the fully loaded GeoView layer instance
   * @throws {LayerNotFoundError} When the layer couldn't be found at the given layer path
   * @throws {LayerWrongTypeError} When the layer is of wrong type at the given layer path
   */
  async helperStepCheckLayerAtLayerPath<T>(
    test: Test<T>,
    layerPath: string,
    timeoutOnLoad: number = 30000,
    waitStyle: boolean = true
  ): Promise<AbstractGVLayer> {
    // Creating the configuration
    test.addStep(`Find the layer ${layerPath} on the map...`);

    // Get the layer
    const layer = this.getControllersRegistry().layerController.getGeoviewLayerRegular(layerPath);

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
   *
   * Logs the verification step in the test instance.
   * If `checkIconImage` or `checkIconsList` is provided, this method will also
   * verify that the layer's style has been applied by delegating to
   * `helperStepAssertStyleApplied`.
   *
   * @param test - The test instance used to record the verification steps
   * @param mapId - The map id
   * @param layerPath - The path or ID of the layer to verify
   * @param checkIconImage - Optional expected icon image.
   *   If provided, the function will additionally check that the legend contains a matching icon
   * @param checkIconsList - Optional list of expected legend icon items.
   *   If provided, the function will additionally verify that the legend's icon list matches this array
   */
  static helperStepAssertLayerExists(
    test: Test<AbstractGVLayer>,
    mapId: string,
    layerPath: string,
    checkIconImage?: string,
    checkIconsList?: Partial<TypeLegendItem>[]
  ): void {
    // Get the layer legend
    const legendLayer = getStoreLayerStateLegendLayerByPath(mapId, layerPath);

    // Verify the layer has a legend information
    test.addStep(`Verify the layer ${layerPath} has legend information...`);
    Test.assertIsDefined('legendLayer', legendLayer);

    // If checking the style
    if (checkIconImage || checkIconsList) {
      // Redirect
      this.helperStepAssertStyleApplied(test, mapId, layerPath, checkIconImage, checkIconsList);
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
  static helperStepAssertStyleApplied(
    test: Test<AbstractGVLayer>,
    mapId: string,
    layerPath: string,
    checkIconImage?: string,
    checkIconsList?: Partial<TypeLegendItem>[]
  ): void {
    // Get the layer legend from the store
    const legendLayer = getStoreLayerStateLegendLayerByPath(mapId, layerPath);

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
   * Removes a layer from the map using its path and asserts that it no longer exists in the legend store.
   *
   * Each step is logged to the provided test instance for traceability.
   *
   * @param test - The test instance used to record each step of the removal process
   * @param mapViewer - The map viewer instance from which the layer is removed
   * @param geoviewLayerId - The geoview layer id of the layer config to be removed
   */
  helperFinalizeStepRemoveLayerConfigAndAssert<T>(test: Test<T>, geoviewLayerId: string): void {
    // Check that the layer is indeed there
    test.addStep(`Checking the geoview layer ${geoviewLayerId} exists on the map...`);
    Test.assertIsDefined(
      'layerEntryConfig ' + geoviewLayerId,
      this.getControllersRegistry().layerController.getLayerEntryConfigIfExists(geoviewLayerId)
    );

    // Remove the added layer
    test.addStep(`Removing the geoview layer ${geoviewLayerId} from the map...`);
    this.getControllersRegistry().layerCreatorController.removeLayerUsingPath(geoviewLayerId);

    // Validate that it's gone
    test.addStep(`Validate that the layer is indeed gone...`);
    Test.assertIsUndefined(
      'layerEntryConfig ' + geoviewLayerId,
      this.getControllersRegistry().layerController.getLayerEntryConfigIfExists(geoviewLayerId)
    );
  }

  // #endregion HELPERS
}
