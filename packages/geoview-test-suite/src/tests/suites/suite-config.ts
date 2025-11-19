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
    super(api, mapViewer);

    // Create the Config tester
    this.#configTester = new ConfigTester(api, mapViewer);
    this.addTester(this.#configTester);
  }

  /**
   * Returns the name of the Test Suite.
   * @returns {string} The name of the Test Suite.
   */
  override getName(): string {
    return 'Config Test Suite';
  }

  /**
   * Returns the description of the Test Suite.
   * @returns {string} The description of the Test Suite.
   */
  override getDescriptionAsHtml(): string {
    return 'Test Suite to perform various layer config related tests.';
  }

  /**
   * Overrides the implementation to perform the tests for this Test Suite.
   * @returns {Promise<unknown>} A Promise which resolves when tests are completed.
   */
  protected override onLaunchTestSuite(): Promise<unknown> {
    // // GV START DEBUG SECTION TO NOT HAVE TO TEST EVERYTHING EVERYTIME
    // // Test DEBUG
    // const pDevTest0 = this.#configTester.testEsriFeatureWithForestIndustry();
    // // const pDevTest2 = this.#configTester.testKMLBadUrlExpectSkip();

    // // Resolve when all
    // return Promise.all([pDevTest0]);
    // // GV END DEBUG SECTION TO NOT HAVE TO TEST EVERYTHING EVERYTIME

    // Test EsriDynamic HistoricalFloodconfig
    const pEsriDynamicHistoFlood = this.#configTester.testEsriDynamicWithHistoricalFloodEvents();

    // Test EsriDynamic CESI config
    const pEsriDynamicCESI = this.#configTester.testEsriDynamicWithCESI();

    // Test a true negative
    const pEsriDynamicBadUrl = this.#configTester.testEsriDynamicBadUrl();

    // Test EsriFeature TorontoNeighbourhoods config
    const pEsriFeatureToronto = this.#configTester.testEsriFeatureWithTorontoNeighbourhoods();

    // Test EsriFeature HistoricalFloodEvents config
    const pEsriFeatureHisto = this.#configTester.testEsriFeatureWithHistoricalFloodEvents();

    // Test EsriFeature Forest Industry config
    const pEsriFeatureForest = this.#configTester.testEsriFeatureWithForestIndustry();

    // Test a true negative
    const pEsriFeatureBadUrl = this.#configTester.testEsriFeatureBadUrl();

    // Test EsriImage Elevation config
    const pEsriImage = this.#configTester.testEsriImageWithElevation();

    // Test a true negative
    const pEsriImageBadUrl = this.#configTester.testEsriImageBadUrl();

    // Test WMS OWSMundialis config
    const pWMSMundialis = this.#configTester.testWMSLayerWithOWSMundialis();

    // Test WMS DatacubeMSI config
    const pWMSDatacubeMSI = this.#configTester.testWMSLayerWithDatacubeMSI();

    // Test a true negative
    const pWMSBadUrl = this.#configTester.testWMSBadUrl();

    // Test WFS CurrentCondition config
    const pWFSCurrentConditions = this.#configTester.testWFSLayerWithGeometCurrentConditions();

    // Test a true negative
    const pWFSBadUrl = this.#configTester.testWFSBadUrl();

    // Test a true negative
    const pWFSOkayUrlNoCap = this.#configTester.testWFSOkayUrlNoCap();

    // Test OGC Feature config
    const pOGcFeature = this.#configTester.testOGCFeatureWithPygeoapi();

    // Test a true negative
    const pOgcFeatureBadUrl = this.#configTester.testOGCFeatureBadUrl();

    // Test a GeoJSON Metadata.meta config
    const pGeoJson = this.#configTester.testGeojsonWithMetadataMeta();

    // Test a skip
    const pGeoJsonBadUrlSkip = this.#configTester.testGeoJSONBadUrlExpectSkip();

    // Test a true negative
    const pGeoJsonBadUrlFail = this.#configTester.testGeoJSONBadUrlExpectError();

    // Test a CSV file
    const pCSV = this.#configTester.testCSVWithStationList();

    // Test a skip
    const pCSVBadUrlSkip = this.#configTester.testCSVBadUrlExpectSkip();

    // Test a WKB file
    const pWKB = this.#configTester.testWKBWithSouthAfrica();

    // Test a true negative
    const pWKBBadUrlFail = this.#configTester.testWKBBadUrlExpectFail();

    // Test a KML file
    const pKMLTornado = this.#configTester.testKMLWithTornado();

    // Test a skip
    const pKMLSkip = this.#configTester.testKMLBadUrlExpectSkip();

    // Test a KML file
    const pLayerGeoTIFFVegetation = this.#configTester.testGeoTIFFWithVegetation();

    // Test a skip
    const pGeoTIFFSkip = this.#configTester.testGeoTIFFBadUrlExpectSkip();

    // Test a Geocore
    const pGeocoreAirborne = this.#configTester.testStandaloneGeocoreWithAirborne();

    // Resolve when all
    return Promise.all([
      pEsriDynamicHistoFlood,
      pEsriDynamicCESI,
      pEsriDynamicBadUrl,
      pEsriFeatureToronto,
      pEsriFeatureHisto,
      pEsriFeatureForest,
      pEsriFeatureBadUrl,
      pEsriImage,
      pEsriImageBadUrl,
      pWMSMundialis,
      pWMSDatacubeMSI,
      pWMSBadUrl,
      pWFSCurrentConditions,
      pWFSBadUrl,
      pWFSOkayUrlNoCap,
      pOGcFeature,
      pOgcFeatureBadUrl,
      pGeoJson,
      pGeoJsonBadUrlSkip,
      pGeoJsonBadUrlFail,
      pCSV,
      pCSVBadUrlSkip,
      pWKB,
      pWKBBadUrlFail,
      pKMLTornado,
      pKMLSkip,
      pLayerGeoTIFFVegetation,
      pGeoTIFFSkip,
      pGeocoreAirborne,
    ]);
  }
}
