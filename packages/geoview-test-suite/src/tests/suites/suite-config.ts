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
    // Test EsriDynamic HistoricalFlood config
    const pInitEsriDynamicHistoFlood = this.#configTester.testInitEsriDynamicWithHistoricalFlood();
    if (this.getIsRunningSequentially()) await pInitEsriDynamicHistoFlood;

    // Test EsriDynamic CESI config
    const pInitEsriDynamicCESI = this.#configTester.testInitEsriDynamicWithCESI();
    if (this.getIsRunningSequentially()) await pInitEsriDynamicCESI;

    // Test a true negative
    const pInitEsriDynamicBadUrl = this.#configTester.testInitEsriDynamicBadUrl();
    if (this.getIsRunningSequentially()) await pInitEsriDynamicBadUrl;

    // Process the EsriDynamic Historical Flood
    const pProcessEsriDynamicHistoFlood = this.#configTester.testProcessEsriDynamicHistoricalFlood();
    if (this.getIsRunningSequentially()) await pProcessEsriDynamicHistoFlood;

    // Test EsriFeature TorontoNeighbourhoods config
    const pEsriFeatureToronto = this.#configTester.testInitEsriFeatureWithTorontoNeighbourhoods();
    if (this.getIsRunningSequentially()) await pEsriFeatureToronto;

    // Test EsriFeature HistoricalFloodEvents config
    const pEsriFeatureHisto = this.#configTester.testInitEsriFeatureWithHistoricalFloodEvents();
    if (this.getIsRunningSequentially()) await pEsriFeatureHisto;

    // Test EsriFeature Forest Industry config
    const pEsriFeatureForest = this.#configTester.testInitEsriFeatureWithForestIndustry();
    if (this.getIsRunningSequentially()) await pEsriFeatureForest;

    // Test a true negative
    const pEsriFeatureBadUrl = this.#configTester.testInitEsriFeatureBadUrl();
    if (this.getIsRunningSequentially()) await pEsriFeatureBadUrl;

    // Process the EsriFeature Toronto Neighbourhoods
    const pProcessEsriFeatureToronto = this.#configTester.testProcessEsriFeatureWithTorontoNeighbourhoods();
    if (this.getIsRunningSequentially()) await pProcessEsriFeatureToronto;

    // Test EsriImage Elevation config
    const pInitEsriImage = this.#configTester.testInitEsriImageWithElevation();
    if (this.getIsRunningSequentially()) await pInitEsriImage;

    // Test a true negative
    const pInitEsriImageBadUrl = this.#configTester.testInitEsriImageBadUrl();
    if (this.getIsRunningSequentially()) await pInitEsriImageBadUrl;

    // Test EsriImage Elevation config
    const pProcessEsriImage = this.#configTester.testInitEsriImageWithElevation();
    if (this.getIsRunningSequentially()) await pProcessEsriImage;

    // Test WMS OWSMundialis config
    const pWMSMundialis = this.#configTester.testInitWMSLayerWithOWSMundialis();
    if (this.getIsRunningSequentially()) await pWMSMundialis;

    // Test WMS OWSMundialis config no full sub layers
    const pWMSMundialisNoFullSubLayers = this.#configTester.testInitWMSLayerWithOWSMundialisNoFullSubLayers();
    if (this.getIsRunningSequentially()) await pWMSMundialisNoFullSubLayers;

    // Test WMS DatacubeMSI config
    const pWMSDatacubeMSI = this.#configTester.testInitWMSLayerWithDatacubeMSI();
    if (this.getIsRunningSequentially()) await pWMSDatacubeMSI;

    // Test WMS DatacubeMSI config
    const pWMSDatacubeMSINoFullSubLayers = this.#configTester.testInitWMSLayerWithDatacubeMSINoFullSubLayers();
    if (this.getIsRunningSequentially()) await pWMSDatacubeMSINoFullSubLayers;

    // Test a true negative
    const pWMSBadUrl = this.#configTester.testInitWMSBadUrl();
    if (this.getIsRunningSequentially()) await pWMSBadUrl;

    // Process the WMS Airborne Radioactivity
    const pProcessWMSAirborneRadioactivity = this.#configTester.testProcessWMSAirborneRadioactivity(this.getIsRunningOnVPN());
    if (this.getIsRunningSequentially()) await pProcessWMSAirborneRadioactivity;

    // Test WFS CurrentCondition config
    const pWFSCurrentConditions = this.#configTester.testInitWFSLayerWithGeometCurrentConditions();
    if (this.getIsRunningSequentially()) await pWFSCurrentConditions;

    // Test a true negative
    const pWFSBadUrl = this.#configTester.testInitWFSBadUrl();
    if (this.getIsRunningSequentially()) await pWFSBadUrl;

    // Test a true negative
    const pWFSOkayUrlNoCap = this.#configTester.testInitWFSOkayUrlNoCap();
    if (this.getIsRunningSequentially()) await pWFSOkayUrlNoCap;

    // Process the WFS Geomet
    const pWFSGeomet = this.#configTester.testProcessWFSGeomet();
    if (this.getIsRunningSequentially()) await pWFSGeomet;

    // Test OGC Feature config
    const pOGcFeature = this.#configTester.testOGCFeatureWithPygeoapi();
    if (this.getIsRunningSequentially()) await pOGcFeature;

    // Test a true negative
    const pOgcFeatureBadUrl = this.#configTester.testOGCFeatureBadUrl();
    if (this.getIsRunningSequentially()) await pOgcFeatureBadUrl;

    // Test a GeoJSON Metadata.meta config
    const pGeoJson = this.#configTester.testGeojsonWithMetadataMeta();
    if (this.getIsRunningSequentially()) await pGeoJson;

    // Test a GeoJSON GeometryCollection sample config
    const pGeoJsonGeometryCollection = this.#configTester.testGeojsonWithGeometryCollection();
    if (this.getIsRunningSequentially()) await pGeoJsonGeometryCollection;

    // Test a skip
    const pGeoJsonBadUrlSkip = this.#configTester.testGeoJSONBadUrlExpectSkip();
    if (this.getIsRunningSequentially()) await pGeoJsonBadUrlSkip;

    // Test a true negative
    const pGeoJsonBadUrlFail = this.#configTester.testGeoJSONBadUrlExpectError();
    if (this.getIsRunningSequentially()) await pGeoJsonBadUrlFail;

    // Process the Geojson Polygons
    const pGeoJsonPolygons = this.#configTester.testProcessGeoJsonPolygons();
    if (this.getIsRunningSequentially()) await pGeoJsonPolygons;

    // Test a CSV file
    const pCSV = this.#configTester.testCSVWithStationList();
    if (this.getIsRunningSequentially()) await pCSV;

    // Test a skip
    const pCSVBadUrlSkip = this.#configTester.testCSVBadUrlExpectSkip();
    if (this.getIsRunningSequentially()) await pCSVBadUrlSkip;

    // Test a WKB file
    const pWKB = this.#configTester.testWKBWithSouthAfrica();
    if (this.getIsRunningSequentially()) await pWKB;

    // Test a true negative
    const pWKBBadUrlFail = this.#configTester.testWKBBadUrlExpectFail();
    if (this.getIsRunningSequentially()) await pWKBBadUrlFail;

    // Test a KML file
    const pKMLTornado = this.#configTester.testKMLWithTornado();
    if (this.getIsRunningSequentially()) await pKMLTornado;

    // Test a skip
    const pKMLSkip = this.#configTester.testKMLBadUrlExpectSkip();
    if (this.getIsRunningSequentially()) await pKMLSkip;

    // Test a KML file
    const pLayerGeoTIFFVegetation = this.#configTester.testGeoTIFFWithVegetation();
    if (this.getIsRunningSequentially()) await pLayerGeoTIFFVegetation;

    // Test a skip
    const pGeoTIFFSkip = this.#configTester.testGeoTIFFBadUrlExpectSkip();
    if (this.getIsRunningSequentially()) await pGeoTIFFSkip;

    // Test a Geocore
    const pGeocoreAirborne = this.#configTester.testStandaloneGeocoreWithAirborne();
    if (this.getIsRunningSequentially()) await pGeocoreAirborne;

    // Test settings cascade to sublayers
    const pSettingsCascadeToSublayers = this.#configTester.testSettingsCascadeToSublayers();
    if (this.getIsRunningSequentially()) await pSettingsCascadeToSublayers;

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
