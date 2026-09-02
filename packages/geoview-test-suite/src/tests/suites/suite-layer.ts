import type { API } from 'geoview-core/api/api';
import { GVAbstractTestSuite } from './abstract-gv-test-suite';
import { LayerTester } from '../testers/layer-tester';
import { GVAbstractTester } from '../testers/abstract-gv-tester';
import type { MapViewer } from 'geoview-core/geo/map/map-viewer';
import type { ControllerRegistry } from 'geoview-core/core/controllers/base/controller-registry';

/**
 * The GeoView Test Suite.
 */
export class GVTestSuiteLayer extends GVAbstractTestSuite {
  /** The Layer Tester used in this Test Suite */
  #layerTester: LayerTester;

  /**
   * Constructs the Test Suite.
   *
   * @param api - The shared api
   * @param mapViewer - The map viewer
   * @param controllerRegistry - The controller registry
   */
  constructor(api: API, mapViewer: MapViewer, controllerRegistry: ControllerRegistry) {
    super(api, mapViewer, controllerRegistry);

    // Create the Geocore tester
    this.#layerTester = new LayerTester(api, mapViewer, controllerRegistry);
    this.addTester(this.#layerTester);
  }

  /**
   * Returns the name of the Test Suite.
   *
   * @returns The name of the Test Suite
   */
  override getName(): string {
    return 'Layer Test Suite';
  }

  /**
   * Returns the description of the Test Suite.
   *
   * @returns The description of the Test Suite
   */
  override getDescriptionAsHtml(): string {
    return `Tests adding layers to the map, verifying load status and legend icons:<br/>
      <b>ESRI</b> — Dynamic, Feature, Image (+ bad URL, invalid geometry, domain fields)<br/>
      <b>OGC</b> — WMS (multiple services + CORS proxy), WFS, WMTS (+ bad URLs)<br/>
      <b>File-based</b> — GeoJSON, CSV, OGC Feature, WKB, KML, GeoTIFF (+ bad URLs)<br/>
      <b>Tiles</b> — XYZ (OSM), Vector Tiles (CBMT) (+ bad URLs)<br/>
      <b>GeoCore</b> — Inline override, simplified name override, group visibility<br/>
      <b>Settings</b> — initialSettings cascade on added layers<br/>
      <b>Queries</b> — Domain field value translation (sequential)`;
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
    const pDevTest0 = this.#layerTester.testAddEsriDynamicHistoFloodEvents();

    // Resolve when all
    return Promise.all([pDevTest0]);
  }

  /**
   * Overrides the implementation to perform the tests for this Test Suite.
   *
   * @returns A promise that resolves when tests are completed
   */
  protected override async onLaunchTestSuite(): Promise<unknown> {
    // Test adding layer
    const pLayerEsriDynamicHistoFloods = this.#layerTester.testAddEsriDynamicHistoFloodEvents();
    if (this.getIsRunningSequentially()) await pLayerEsriDynamicHistoFloods;

    // Test adding layer EsriDynamic with Raster Layer inside, via Geocore UUID
    // GV Commented out for now, because the layer uuid has changed and the NRCan catalog is broken to go find the new uuid for this test
    // const pLayerEsriDynamicWithRasterLayersViaGeocore = this.#layerTester.testAddEsriDynamicWithRasterLayersViaGeocore();

    // Test true negative
    const pLayerEsriDynamicBadUrl = this.#layerTester.testAddEsriDynamicBadUrl();
    if (this.getIsRunningSequentially()) await pLayerEsriDynamicBadUrl;

    // Test adding layer
    const pLayerEsriFeatureForestIndustry = this.#layerTester.testAddEsriFeatureForestIndustry();
    if (this.getIsRunningSequentially()) await pLayerEsriFeatureForestIndustry;

    // Test true negative
    const pLayerEsriFeatureBadUrl = this.#layerTester.testAddEsriFeatureBadUrl();
    if (this.getIsRunningSequentially()) await pLayerEsriFeatureBadUrl;

    // Test adding layer
    const playerEsriFeatureInvalidGeometry = this.#layerTester.testAddEsriFeatureInvalidGeometry();
    if (this.getIsRunningSequentially()) await playerEsriFeatureInvalidGeometry;

    // Test adding layer
    const pLayerEsriImageElevation = this.#layerTester.testAddEsriImageWithElevation();
    if (this.getIsRunningSequentially()) await pLayerEsriImageElevation;

    // Test true negative
    const pLayerEsriImageBadUrl = this.#layerTester.testAddEsriImageBadUrl();
    if (this.getIsRunningSequentially()) await pLayerEsriImageBadUrl;

    // Test adding layer OWS Mundialis
    const pLayerWMSOWSMundialis = this.#layerTester.testAddWMSLayerWithOWSMundialis();
    if (this.getIsRunningSequentially()) await pLayerWMSOWSMundialis;

    // Test adding layer
    const pLayerWMSDatacubeOWSMSI = this.#layerTester.testAddWMSLayerWithDatacubeMSI();
    if (this.getIsRunningSequentially()) await pLayerWMSDatacubeOWSMSI;

    // Test adding layer
    const pLayerWMSDatacubeRingFireHalifax = this.#layerTester.testAddWMSLayerWithDatacubeRingOfFire();
    if (this.getIsRunningSequentially()) await pLayerWMSDatacubeRingFireHalifax;

    // Test adding layer
    const pLayerNonnaWithCors = this.#layerTester.testAddWMSNonna();
    if (this.getIsRunningSequentially()) await pLayerNonnaWithCors;

    // Test true negative
    const pLayerWMSBadUrl = this.#layerTester.testAddWMSBadUrl();
    if (this.getIsRunningSequentially()) await pLayerWMSBadUrl;

    // Test adding layer
    const pLayerWFSWithGeometCurrentConditions = this.#layerTester.testAddWFSLayerWithWithGeometCurrentConditions();
    if (this.getIsRunningSequentially()) await pLayerWFSWithGeometCurrentConditions;

    // Test true negative
    const pLayerWFSBadUrl = this.#layerTester.testAddWFSBadUrl();
    if (this.getIsRunningSequentially()) await pLayerWFSBadUrl;

    // Test true negative
    const pLayerWFSOkayUrlNoCap = this.#layerTester.testAddWFSOkayUrlNoCap();
    if (this.getIsRunningSequentially()) await pLayerWFSOkayUrlNoCap;

    // Test adding layer
    const pLayerGeoJSONWithPolygons = this.#layerTester.testAddGeoJSONWithMetadataPolygons();
    if (this.getIsRunningSequentially()) await pLayerGeoJSONWithPolygons;

    // Test true negative
    const pLayerGeoJSonBadUrl = this.#layerTester.testAddGeoJSONBadUrl();
    if (this.getIsRunningSequentially()) await pLayerGeoJSonBadUrl;

    // Test adding layer
    const pLayerCSVStationList = this.#layerTester.testAddCSVWithStationList();
    if (this.getIsRunningSequentially()) await pLayerCSVStationList;

    // Test true negative
    const pLayerCSVBadUrl = this.#layerTester.testAddCSVWithBadUrl();
    if (this.getIsRunningSequentially()) await pLayerCSVBadUrl;

    // Test adding layer
    const pLayerOGCFeatureWithPygeoapi = this.#layerTester.testAddOGCFeatureWithPygeoapi();
    if (this.getIsRunningSequentially()) await pLayerOGCFeatureWithPygeoapi;

    // Test true negative
    const pLayerOGCFeatureBadUrl = this.#layerTester.testAddOGCFeatureWithBadUrl();
    if (this.getIsRunningSequentially()) await pLayerOGCFeatureBadUrl;

    // Test adding layer
    const pLayerWKBWithSouthAfrica = this.#layerTester.testAddWKBWithSouthAfrica();
    if (this.getIsRunningSequentially()) await pLayerWKBWithSouthAfrica;

    // Test true negative
    const pLayerWKBBadUrl = this.#layerTester.testAddWKBWithBadUrl();
    if (this.getIsRunningSequentially()) await pLayerWKBBadUrl;

    // Test adding layer
    const pLayerKMLWithTornado = this.#layerTester.testAddKMLWithTornado();
    if (this.getIsRunningSequentially()) await pLayerKMLWithTornado;

    // Test true negative
    const pLayerKMLBadUrl = this.#layerTester.testAddKMLWithBadUrl();
    if (this.getIsRunningSequentially()) await pLayerKMLBadUrl;

    // Test adding layer
    const pLayerGeoTIFFVegetation = this.#layerTester.testAddGeotiffLayerWithDatacubeVegetation();
    if (this.getIsRunningSequentially()) await pLayerGeoTIFFVegetation;

    // Test true negative
    const pLayerGeoTIFFBadUrl = this.#layerTester.testAddGeoTIFFWithBadUrl();
    if (this.getIsRunningSequentially()) await pLayerGeoTIFFBadUrl;

    // Test adding layer
    const pLayerWMTSWorldTimezones = this.#layerTester.testAddWMTSWorldTimezones();
    if (this.getIsRunningSequentially()) await pLayerWMTSWorldTimezones;

    // Test true negative
    const pLayerWMTSBadUrl = this.#layerTester.testAddWMTSBadUrl();
    if (this.getIsRunningSequentially()) await pLayerWMTSBadUrl;

    // Test adding layer
    const pLayerXYZTilesOSM = this.#layerTester.testAddXYZTilesOSM();
    if (this.getIsRunningSequentially()) await pLayerXYZTilesOSM;

    // Test true negative
    const pLayerXYZTilesBadUrl = this.#layerTester.testAddXYZTilesBadUrl();
    if (this.getIsRunningSequentially()) await pLayerXYZTilesBadUrl;

    // Test adding layer
    const pLayerVectorTilesCBMT = this.#layerTester.testAddVectorTilesCBMT();
    if (this.getIsRunningSequentially()) await pLayerVectorTilesCBMT;

    // Test true negative
    const pLayerVectorTilesBadUrl = this.#layerTester.testAddVectorTilesBadUrl();
    if (this.getIsRunningSequentially()) await pLayerVectorTilesBadUrl;

    // Test initial settings cascade
    const pInitialSettingsCascade = this.#layerTester.testInitialSettingsCascade();
    if (this.getIsRunningSequentially()) await pInitialSettingsCascade;

    // Test geocore custom inline override scenarios
    const pGeocoreInlineListOverride = this.#layerTester.testAddGeocoreWithInlineListOfLayerEntryConfigOverride();
    if (this.getIsRunningSequentially()) await pGeocoreInlineListOverride;

    const pGeocoreSimplifiedNameOverride = this.#layerTester.testAddGeocoreWithSimplifiedInlineLayerNameOverride();
    if (this.getIsRunningSequentially()) await pGeocoreSimplifiedNameOverride;

    // Test domain fields
    const pEsriDynamicDomainField = this.#layerTester.testAddEsriDynamicWithDomainField();
    if (this.getIsRunningSequentially()) await pEsriDynamicDomainField;

    const pEsriFeatureDomainField = this.#layerTester.testAddEsriFeatureWithDomainField();
    if (this.getIsRunningSequentially()) await pEsriFeatureDomainField;

    // Resolve when all parallel tests are done
    await Promise.all([
      pLayerEsriDynamicHistoFloods,
      // pLayerEsriDynamicWithRasterLayersViaGeocore,
      pLayerEsriDynamicBadUrl,
      pLayerEsriFeatureForestIndustry,
      pLayerEsriFeatureBadUrl,
      playerEsriFeatureInvalidGeometry,
      pLayerEsriImageElevation,
      pLayerEsriImageBadUrl,
      pLayerWMSOWSMundialis,
      pLayerWMSDatacubeOWSMSI,
      pLayerWMSDatacubeRingFireHalifax,
      pLayerNonnaWithCors,
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
      pLayerGeoTIFFBadUrl,
      pLayerWMTSWorldTimezones,
      pLayerWMTSBadUrl,
      pLayerXYZTilesOSM,
      pLayerXYZTilesBadUrl,
      pLayerVectorTilesCBMT,
      pLayerVectorTilesBadUrl,
      pInitialSettingsCascade,
      pGeocoreInlineListOverride,
      pGeocoreSimplifiedNameOverride,
      pEsriDynamicDomainField,
      pEsriFeatureDomainField,
    ]);

    // Test domain field query value translation — run sequentially at the end
    // because they change the zoom level to 17.4 which would affect other tests
    await this.#layerTester.testEsriDynamicDomainFieldQueryValue();
    await this.#layerTester.testEsriFeatureDomainFieldQueryValue();

    // Make sure the map is reset in its initial extent after the zooms
    await this.getControllersRegistry().mapController.zoomToInitialExtent(GVAbstractTester.USE_ZOOM_ANIMATION);

    // Run the GeometryCollection layer test last to avoid perturbing icon color ordering used by earlier strict icon assertions.
    await this.#layerTester.testAddGeoJSONWithGeometryCollection();

    // If running heavy tests
    if (this.getIsRunningHeavyTests()) {
      // Test geocore group with defaultVisibility=false
      await this.#layerTester.testAddGeocoreWithGroupDefaultVisibilityFalse();
    }

    // Done
    return;
  }
}
