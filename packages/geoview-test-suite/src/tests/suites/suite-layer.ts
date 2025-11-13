import type { API } from 'geoview-core/api/api';
import type { MapViewer } from 'geoview-core/geo/map/map-viewer';
import { GVAbstractTestSuite } from './abstract-gv-test-suite';
import { LayerTester } from '../testers/layer-tester';

/**
 * The GeoView Test Suite.
 */
export class GVTestSuiteLayer extends GVAbstractTestSuite {
  /** The Layer Tester used in this Test Suite */
  #layerTester: LayerTester;

  /**
   * Constructs the Test Suite
   * @param {API} api - The shared api
   * @param {MapViewer} mapViewer - The map viewer
   */
  constructor(api: API, mapViewer: MapViewer) {
    super(api, mapViewer);

    // Create the Geocore tester
    this.#layerTester = new LayerTester(api, mapViewer);
    this.addTester(this.#layerTester);
  }

  /**
   * Returns the name of the Test Suite.
   * @returns {string} The name of the Test Suite.
   */
  override getName(): string {
    return 'Layer Test Suite';
  }

  /**
   * Returns the description of the Test Suite.
   * @returns {string} The description of the Test Suite.
   */
  override getDescriptionAsHtml(): string {
    return 'Test Suite to perform various layer related tests.';
  }

  /**
   * Overrides the implementation to perform the tests for this Test Suite.
   * @returns {Promise<unknown>} A Promise which resolves when tests are completed.
   */
  protected override onLaunchTestSuite(): Promise<unknown> {
    // // GV START DEBUG SECTION TO NOT HAVE TO TEST EVERYTHING EVERYTIME
    // // Test DEBUG
    // const pDevTest0 = this.#layerTester.testAddEsriDynamicWithRasterLayersViaGeocore();
    // // const pDevTest1 = this.#layerTester.testAddWKBWithBadUrl();
    // // const pDevTest2 = this.#layerTester.testAddOGCFeatureWithPygeoapi();

    // // Resolve when all
    // return Promise.all([pDevTest0]);
    // // GV END DEBUG SECTION TO NOT HAVE TO TEST EVERYTHING EVERYTIME

    // Test adding layer
    const pLayerEsriDynamicHistoFloods = this.#layerTester.testAddEsriDynamicHistoFloodEvents();

    // Test adding layer EsriDynamic with Raster Layer inside, via Geocore UUID
    const pLayerEsriDynamicWithRasterLayersViaGeocore = this.#layerTester.testAddEsriDynamicWithRasterLayersViaGeocore();

    // Test true negative
    const pLayerEsriDynamicBadUrl = this.#layerTester.testAddEsriDynamicBadUrl();

    // Test adding layer
    const pLayerEsriFeatureForestIndustry = this.#layerTester.testAddEsriFeatureForestIndustry();

    // Test true negative
    const pLayerEsriFeatureBadUrl = this.#layerTester.testAddEsriFeatureBadUrl();

    // Test adding layer
    const pLayerEsriImageElevation = this.#layerTester.testAddEsriImageWithElevation();

    // Test true negative
    const pLayerEsriImageBadUrl = this.#layerTester.testAddEsriImageBadUrl();

    // Test adding layer
    const pLayerWMSOWSMundialis = this.#layerTester.testAddWMSLayerWithOWSMundialis();

    // Test adding layer
    const pLayerWMSDatacubeOWSMSI = this.#layerTester.testAddWMSLayerWithDatacubeMSI();

    // Test adding layer
    const pLayerWMSDatacubeRingFireHalifax = this.#layerTester.testAddWMSLayerWithDatacubeRingOfFire();

    // Test true negative
    const pLayerWMSBadUrl = this.#layerTester.testAddWMSBadUrl();

    // Test adding layer
    const pLayerWFSWithGeometCurrentConditions = this.#layerTester.testAddWFSLayerWithWithGeometCurrentConditions();

    // Test true negative
    const pLayerWFSBadUrl = this.#layerTester.testAddWFSBadUrl();

    // Test true negative
    const pLayerWFSOkayUrlNoCap = this.#layerTester.testAddWFSOkayUrlNoCap();

    // Test adding layer
    const pLayerGeoJSONWithPolygons = this.#layerTester.testAddGeoJSONWithMetadataPolygons();

    // Test true negative
    const pLayerGeoJSonBadUrl = this.#layerTester.testAddGeoJSONBadUrl();

    // Test adding layer
    const pLayerCSVStationList = this.#layerTester.testAddCSVWithStationList();

    // Test true negative
    const pLayerCSVBadUrl = this.#layerTester.testAddCSVWithBadUrl();

    // Test adding layer
    const pLayerOGCFeatureWithPygeoapi = this.#layerTester.testAddOGCFeatureWithPygeoapi();

    // Test true negative
    const pLayerOGCFeatureBadUrl = this.#layerTester.testAddOGCFeatureWithBadUrl();

    // Test adding layer
    const pLayerWKBWithSouthAfrica = this.#layerTester.testAddWKBWithSouthAfrica();

    // Test true negative
    const pLayerWKBBadUrl = this.#layerTester.testAddWKBWithBadUrl();

    // Test adding layer
    const pLayerKMLWithTornado = this.#layerTester.testAddKMLWithTornado();

    // Test true negative
    const pLayerKMLBadUrl = this.#layerTester.testAddKMLWithBadUrl();

    // Test adding layer
    const pLayerGeoTIFFVegetation = this.#layerTester.testAddGeotiffLayerWithDatacubeVegetation();

    // Resolve when all
    return Promise.all([
      pLayerEsriDynamicHistoFloods,
      pLayerEsriDynamicWithRasterLayersViaGeocore,
      pLayerEsriDynamicBadUrl,
      pLayerEsriFeatureForestIndustry,
      pLayerEsriFeatureBadUrl,
      pLayerEsriImageElevation,
      pLayerEsriImageBadUrl,
      pLayerWMSOWSMundialis,
      pLayerWMSDatacubeOWSMSI,
      pLayerWMSDatacubeRingFireHalifax,
      pLayerWMSBadUrl,
      pLayerWFSWithGeometCurrentConditions,
      pLayerWFSBadUrl,
      pLayerWFSOkayUrlNoCap,
      pLayerGeoJSONWithPolygons,
      pLayerGeoJSonBadUrl,
      pLayerCSVStationList,
      pLayerCSVBadUrl,
      pLayerOGCFeatureWithPygeoapi,
      pLayerOGCFeatureBadUrl,
      pLayerWKBWithSouthAfrica,
      pLayerWKBBadUrl,
      pLayerKMLWithTornado,
      pLayerKMLBadUrl,
      pLayerGeoTIFFVegetation,
    ]);
  }
}
