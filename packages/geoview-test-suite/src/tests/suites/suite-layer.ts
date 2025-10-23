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
    super('TestSuiteLayer', api, mapViewer);

    // Create the Geocore tester
    this.#layerTester = new LayerTester(api, mapViewer);
    this.addTester(this.#layerTester);
  }

  /**
   * Overrides the implementation to perform the tests for this Test Suite.
   * @returns {Promise<unknown>} A Promise which resolves when tests are completed.
   */
  protected override onLaunchTestSuite(): Promise<unknown> {
    // // GV START DEBUG SECTION TO NOT HAVE TO TEST EVERYTHING EVERYTIME
    // // Test DEBUG
    // // const pDevTest0 = this.#layerTester.testAddEsriDynamicBadUrl();
    // // const pDevTest1 = this.#layerTester.testAddEsriFeatureBadUrl();
    // const pDevTest2 = this.#layerTester.testAddEsriImageBadUrl();

    // // Resolve when all
    // return Promise.all([pDevTest2]);
    // // GV END DEBUG SECTION TO NOT HAVE TO TEST EVERYTHING EVERYTIME

    // Test adding layer
    const pLayerEsriDynamicHistoFloods = this.#layerTester.testAddEsriDynamicHistoFloodEvents();

    // Test adding layer
    const pLayerEsriFeatureForestIndustry = this.#layerTester.testAddEsriFeatureForestIndustry();

    // Test adding layer
    const pLayerEsriImageElevation = this.#layerTester.testAddEsriImageWithElevation();

    // Test adding layer
    const pLayerWMSOWSMundialis = this.#layerTester.testAddWMSLayerWithOWSMundialis();

    // Test adding layer
    const pLayerWMSDatacubeOWSMSI = this.#layerTester.testAddWMSLayerWithDatacubeMSI();

    // Test adding layer
    const pLayerWMSDatacubeRingFireHalifax = this.#layerTester.testAddWMSLayerWithDatacubeRingOfFire();

    // Test true negative
    const pLayerWMSBadUrl = this.#layerTester.testAddWMSBadUrl();

    // Resolve when all
    return Promise.all([
      pLayerEsriDynamicHistoFloods,
      pLayerEsriFeatureForestIndustry,
      pLayerEsriImageElevation,
      pLayerWMSOWSMundialis,
      pLayerWMSDatacubeOWSMSI,
      pLayerWMSDatacubeRingFireHalifax,
      pLayerWMSBadUrl,
    ]);
  }
}
