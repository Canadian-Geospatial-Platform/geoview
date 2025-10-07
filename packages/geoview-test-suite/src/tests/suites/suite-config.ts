import type { API } from 'geoview-core/api/api';
import type { MapViewer } from 'geoview-core/geo/map/map-viewer';
import { GVAbstractTestSuite } from './abstract-gv-test-suite';
import { ConfigTester } from '../testers/config-tester';

/**
 * The GeoView Test Suite.
 */
export class GVTestSuiteConfig extends GVAbstractTestSuite {
  /** The Config Tester used in this Test Suite */
  #configTester: ConfigTester;

  /**
   * Constructs the Test Suite
   * @param {API} api - The shared api
   * @param {MapViewer} mapViewer - The map viewer
   */
  constructor(api: API, mapViewer: MapViewer) {
    super('TestSuiteConfig', api, mapViewer);

    // Create the Config tester
    this.#configTester = new ConfigTester(api, mapViewer);
    this.addTester(this.#configTester);
  }

  /**
   * Overrides the implementation to perform the tests for this Test Suite.
   * @returns {Promise<unknown>} A Promise which resolves when tests are completed.
   */
  protected override onLaunchTestSuite(): Promise<unknown> {
    // Test EsriDynamic HistoricalFloodconfig
    const pEsriDynamicHistoFlood = this.#configTester.testEsriDynamicWithHistoricalFloodEvents();

    // Test EsriDynamic CESI config
    const pEsriDynamicCESI = this.#configTester.testEsriDynamicWithCESI();

    // Test EsriFeature TorontoNeighbourhoods config
    const pEsriFeatureToronto = this.#configTester.testEsriFeatureWithTorontoNeighbourhoods();

    // Test EsriFeature HistoricalFloodEvents config
    const pEsriFeatureHisto = this.#configTester.testEsriFeatureWithHistoricalFloodEvents();

    // Test EsriFeature Forest Industry config
    const pEsriFeatureForest = this.#configTester.testEsriFeatureWithForestIndustry();

    // Test EsriImage Elevation config
    const pEsriImage = this.#configTester.testEsriImageWithElevation();

    // Test WMS OWSMundialis config
    const pWMSMundialis = this.#configTester.testWMSLayerWithOWSMundialis();

    // Test WMS DatacubeMSI config
    const pWMSDatacubeMSI = this.#configTester.testWMSLayerWithDatacubeMSI();

    // Resolve when all
    return Promise.all([
      pEsriDynamicHistoFlood,
      pEsriDynamicCESI,
      pEsriFeatureToronto,
      pEsriFeatureHisto,
      pEsriFeatureForest,
      pEsriImage,
      pWMSMundialis,
      pWMSDatacubeMSI,
    ]);
  }
}
