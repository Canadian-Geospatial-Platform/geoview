import type { API } from 'geoview-core/api/api';
import type { MapViewer } from 'geoview-core/geo/map/map-viewer';
import { GVAbstractTestSuite } from './abstract-gv-test-suite';
import { ConfigTester } from '../testers/config-tester';
import type { ControllerRegistry } from 'geoview-core/core/controllers/base/controller-registry';

/**
 * The GeoView Test Suite.
 */
export class GVTestSuiteConfig extends GVAbstractTestSuite {
  /** The Config Tester used in this Test Suite */
  #configTester: ConfigTester;

  /**
   * Constructs the Test Suite.
   *
   * @param api - The shared api
   * @param mapViewer - The map viewer
   * @param controllerRegistry - The controller registry
   */
  constructor(api: API, mapViewer: MapViewer, controllerRegistry: ControllerRegistry) {
    super(api, mapViewer, controllerRegistry);

    // Create the Config tester
    this.#configTester = new ConfigTester(api, mapViewer, controllerRegistry);
    this.addTester(this.#configTester);
  }

  /**
   * Returns the name of the Test Suite.
   *
   * @returns The name of the Test Suite
   */
  override getName(): string {
    return 'Config Test Suite';
  }

  /**
   * Returns the description of the Test Suite.
   *
   * @returns The description of the Test Suite
   */
  override getDescriptionAsHtml(): string {
    return `Tests layer configuration creation and validation across all supported layer types:<br/>
      <b>ESRI</b> — Dynamic, Feature, Image (happy path + bad URL)<br/>
      <b>OGC</b> — WMS, WFS, OGC Feature (happy path + bad URL + no capabilities)<br/>
      <b>File-based</b> — GeoJSON, CSV, WKB, KML, GeoTIFF (happy path + bad URL skip/error)<br/>
      <b>GeoCore</b> — Standalone UUID resolution<br/>
      <b>Settings</b> — initialSettings cascade to sublayers`;
  }

  /**
   * Gets the total number of tests including those that are planned but not yet in the pipeline nor executed.
   *
   * @returns The total number of tests including those that are planned but not yet in the pipeline nor executed.
   */
  override getTestsTotalFinal(): number {
    return 39;
  }

  /**
   * Overrides the debug hook for running a subset of tests during development.
   *
   * GV DEBUG SECTION TO NOT HAVE TO TEST EVERYTHING EVERYTIME
   *
   * @returns A promise that resolves when the debug tests are completed
   */
  protected override onLaunchTestSuiteDEBUG(): Promise<unknown> {
    // Test DEBUG
    const pDevTest0 = this.#configTester.testProcessEsriDynamicHistoricalFlood();
    const pDevTest1 = this.#configTester.testProcessEsriFeatureWithTorontoNeighbourhoods();
    const pDevTest2 = this.#configTester.testProcessWMSAirborneRadioactivity(this.getIsRunningOnVPN());
    const pDevTest3 = this.#configTester.testProcessWFSGeomet();
    const pDevTest4 = this.#configTester.testProcessGeoJsonPolygons();

    // Resolve when all
    return Promise.all([pDevTest0, pDevTest1, pDevTest2, pDevTest3, pDevTest4]);
  }

  /**
   * Overrides the implementation to perform the tests for this Test Suite.
   *
   * @returns A promise that resolves when tests are completed
   */
  protected override async onLaunchTestSuite(): Promise<unknown> {
    // Keep if running sequentially
    const isRunningSequentially = this.getIsRunningSequentially();

    // Test EsriDynamic HistoricalFlood config
    const pInitEsriDynamicHistoFlood = this.#configTester.testInitEsriDynamicWithHistoricalFlood();
    if (isRunningSequentially) await pInitEsriDynamicHistoFlood;

    // Test EsriDynamic CESI config
    const pInitEsriDynamicCESI = this.#configTester.testInitEsriDynamicWithCESI();
    if (isRunningSequentially) await pInitEsriDynamicCESI;

    // Test a true negative
    const pInitEsriDynamicBadUrl = this.#configTester.testInitEsriDynamicBadUrl();
    if (isRunningSequentially) await pInitEsriDynamicBadUrl;

    // Process the EsriDynamic Historical Flood
    const pProcessEsriDynamicHistoFlood = this.#configTester.testProcessEsriDynamicHistoricalFlood();
    if (isRunningSequentially) await pProcessEsriDynamicHistoFlood;

    // Test EsriFeature TorontoNeighbourhoods config
    const pEsriFeatureToronto = this.#configTester.testInitEsriFeatureWithTorontoNeighbourhoods();
    if (isRunningSequentially) await pEsriFeatureToronto;

    // Test EsriFeature HistoricalFloodEvents config
    const pEsriFeatureHisto = this.#configTester.testInitEsriFeatureWithHistoricalFloodEvents();
    if (isRunningSequentially) await pEsriFeatureHisto;

    // Test EsriFeature Forest Industry config
    const pEsriFeatureForest = this.#configTester.testInitEsriFeatureWithForestIndustry();
    if (isRunningSequentially) await pEsriFeatureForest;

    // Test a true negative
    const pEsriFeatureBadUrl = this.#configTester.testInitEsriFeatureBadUrl();
    if (isRunningSequentially) await pEsriFeatureBadUrl;

    // Process the EsriFeature Toronto Neighbourhoods
    const pProcessEsriFeatureToronto = this.#configTester.testProcessEsriFeatureWithTorontoNeighbourhoods();
    if (isRunningSequentially) await pProcessEsriFeatureToronto;

    // Test EsriImage Elevation config
    const pInitEsriImage = this.#configTester.testInitEsriImageWithElevation();
    if (isRunningSequentially) await pInitEsriImage;

    // Test a true negative
    const pInitEsriImageBadUrl = this.#configTester.testInitEsriImageBadUrl();
    if (isRunningSequentially) await pInitEsriImageBadUrl;

    // Test EsriImage Elevation config
    const pProcessEsriImage = this.#configTester.testInitEsriImageWithElevation();
    if (isRunningSequentially) await pProcessEsriImage;

    // Test WMS OWSMundialis config
    const pWMSMundialis = this.#configTester.testInitWMSLayerWithOWSMundialis();
    if (isRunningSequentially) await pWMSMundialis;

    // Test WMS OWSMundialis config no full sub layers
    const pWMSMundialisNoFullSubLayers = this.#configTester.testInitWMSLayerWithOWSMundialisNoFullSubLayers();
    if (isRunningSequentially) await pWMSMundialisNoFullSubLayers;

    // Test WMS DatacubeMSI config
    const pWMSDatacubeMSI = this.#configTester.testInitWMSLayerWithDatacubeMSI();
    if (isRunningSequentially) await pWMSDatacubeMSI;

    // Test WMS DatacubeMSI config
    const pWMSDatacubeMSINoFullSubLayers = this.#configTester.testInitWMSLayerWithDatacubeMSINoFullSubLayers();
    if (isRunningSequentially) await pWMSDatacubeMSINoFullSubLayers;

    // Test a true negative
    const pWMSBadUrl = this.#configTester.testInitWMSBadUrl();
    if (isRunningSequentially) await pWMSBadUrl;

    // Process the WMS Airborne Radioactivity
    const pProcessWMSAirborneRadioactivity = this.#configTester.testProcessWMSAirborneRadioactivity(this.getIsRunningOnVPN());
    if (isRunningSequentially) await pProcessWMSAirborneRadioactivity;

    // Test WFS CurrentCondition config
    const pWFSCurrentConditions = this.#configTester.testInitWFSLayerWithGeometCurrentConditions();
    if (isRunningSequentially) await pWFSCurrentConditions;

    // Test a true negative
    const pWFSBadUrl = this.#configTester.testInitWFSBadUrl();
    if (isRunningSequentially) await pWFSBadUrl;

    // Test a true negative
    const pWFSOkayUrlNoCap = this.#configTester.testInitWFSOkayUrlNoCap();
    if (isRunningSequentially) await pWFSOkayUrlNoCap;

    // Process the WFS Geomet
    const pWFSGeomet = this.#configTester.testProcessWFSGeomet();
    if (isRunningSequentially) await pWFSGeomet;

    // Test OGC Feature config
    const pOGcFeature = this.#configTester.testOGCFeatureWithPygeoapi();
    if (isRunningSequentially) await pOGcFeature;

    // Test a true negative
    const pOgcFeatureBadUrl = this.#configTester.testOGCFeatureBadUrl();
    if (isRunningSequentially) await pOgcFeatureBadUrl;

    // Test a GeoJSON Metadata.meta config
    const pGeoJson = this.#configTester.testGeojsonWithMetadataMeta();
    if (isRunningSequentially) await pGeoJson;

    // Test a GeoJSON GeometryCollection sample config
    const pGeoJsonGeometryCollection = this.#configTester.testGeojsonWithGeometryCollection();
    if (isRunningSequentially) await pGeoJsonGeometryCollection;

    // Test a skip
    const pGeoJsonBadUrlSkip = this.#configTester.testGeoJSONBadUrlExpectSkip();
    if (isRunningSequentially) await pGeoJsonBadUrlSkip;

    // Test a true negative
    const pGeoJsonBadUrlFail = this.#configTester.testGeoJSONBadUrlExpectError();
    if (isRunningSequentially) await pGeoJsonBadUrlFail;

    // Process the Geojson Polygons
    const pGeoJsonPolygons = this.#configTester.testProcessGeoJsonPolygons();
    if (isRunningSequentially) await pGeoJsonPolygons;

    // Test a CSV file
    const pCSV = this.#configTester.testCSVWithStationList();
    if (isRunningSequentially) await pCSV;

    // Test a skip
    const pCSVBadUrlSkip = this.#configTester.testCSVBadUrlExpectSkip();
    if (isRunningSequentially) await pCSVBadUrlSkip;

    // Test a WKB file
    const pWKB = this.#configTester.testWKBWithSouthAfrica();
    if (isRunningSequentially) await pWKB;

    // Test a true negative
    const pWKBBadUrlFail = this.#configTester.testWKBBadUrlExpectFail();
    if (isRunningSequentially) await pWKBBadUrlFail;

    // Test a KML file
    const pKMLTornado = this.#configTester.testKMLWithTornado();
    if (isRunningSequentially) await pKMLTornado;

    // Test a skip
    const pKMLSkip = this.#configTester.testKMLBadUrlExpectSkip();
    if (isRunningSequentially) await pKMLSkip;

    // Test a KML file
    const pLayerGeoTIFFVegetation = this.#configTester.testGeoTIFFWithVegetation();
    if (isRunningSequentially) await pLayerGeoTIFFVegetation;

    // Test a skip
    const pGeoTIFFSkip = this.#configTester.testGeoTIFFBadUrlExpectSkip();
    if (isRunningSequentially) await pGeoTIFFSkip;

    // Test a Geocore
    const pGeocoreAirborne = this.#configTester.testStandaloneGeocoreWithAirborne();
    if (isRunningSequentially) await pGeocoreAirborne;

    // Test settings cascade to sublayers
    const pSettingsCascadeToSublayers = this.#configTester.testSettingsCascadeToSublayers();
    if (isRunningSequentially) await pSettingsCascadeToSublayers;

    // Resolve when all
    return Promise.all([
      pInitEsriDynamicHistoFlood,
      pInitEsriDynamicCESI,
      pInitEsriDynamicBadUrl,
      pProcessEsriDynamicHistoFlood,
      pEsriFeatureToronto,
      pEsriFeatureHisto,
      pEsriFeatureForest,
      pEsriFeatureBadUrl,
      pProcessEsriFeatureToronto,
      pInitEsriImage,
      pInitEsriImageBadUrl,
      pProcessEsriImage,
      pWMSMundialis,
      pWMSMundialisNoFullSubLayers,
      pWMSDatacubeMSI,
      pWMSDatacubeMSINoFullSubLayers,
      pWMSBadUrl,
      pProcessWMSAirborneRadioactivity,
      pWFSCurrentConditions,
      pWFSBadUrl,
      pWFSOkayUrlNoCap,
      pWFSGeomet,
      pOGcFeature,
      pOgcFeatureBadUrl,
      pGeoJson,
      pGeoJsonGeometryCollection,
      pGeoJsonBadUrlSkip,
      pGeoJsonBadUrlFail,
      pGeoJsonPolygons,
      pCSV,
      pCSVBadUrlSkip,
      pWKB,
      pWKBBadUrlFail,
      pKMLTornado,
      pKMLSkip,
      pLayerGeoTIFFVegetation,
      pGeoTIFFSkip,
      pGeocoreAirborne,
      pSettingsCascadeToSublayers,
    ]);
  }
}
