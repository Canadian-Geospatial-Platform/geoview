import type { API } from 'geoview-core/api/api';
import type { MapViewer } from 'geoview-core/geo/map/map-viewer';
import type { ControllerRegistry } from 'geoview-core/core/controllers/base/controller-registry';
import { GVAbstractTestSuite } from './abstract-gv-test-suite';
import { LayerTester } from '../testers/layer-tester';
import { GVAbstractTester } from '../testers/abstract-gv-tester';

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
   * @param controllerRegistry - The controller registry for the map viewer
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
      <b>ESRI</b> — Dynamic, Feature, Image (+ bad URL, invalid geometry, domain fields); case-sensitive export bbox/size and returned image dimensions<br/>
      <b>OGC</b> — WMS (multiple services + CORS proxy), WFS, WMTS (+ bad URLs)<br/>
      <b>File-based</b> — GeoJSON, CSV, OGC Feature, WKB, KML, GeoTIFF (+ bad URLs)<br/>
      <b>Tiles</b> — XYZ (OSM), Vector Tiles (CBMT) (+ bad URLs)<br/>
      <b>GeoCore</b> — Inline override, simplified name override, group visibility<br/>
      <b>Settings</b> — initialSettings cascade on added layers<br/>
      <b>Queries</b> — Domain field value translation (sequential)`;
  }

  /**
   * Gets the number of active tests launched by the full suite.
   *
   * @returns The number of active full-suite tester calls, excluding debug-only calls
   */
  override getTestsTotalFinal(): number {
    return 50;
  }

  /**
   * Overrides the debug hook for running a subset of tests during development.
   *
   * GV DEBUG SECTION TO NOT HAVE TO TEST EVERYTHING EVERYTIME, search for DEBUG_RUN_ONLY_DEBUG_FUNCTION for the flag.
   *
   * @returns A promise that resolves when the debug tests are completed
   */
  protected override async onLaunchTestSuiteDEBUG(): Promise<unknown> {
    await this.#layerTester.testAddEsriDynamicCaseSensitiveExport();

    // Resolve
    return;
  }

  /**
   * Overrides the implementation to perform the tests for this Test Suite.
   *
   * @returns A promise that resolves when tests are completed
   */
  protected override async onLaunchTestSuite(): Promise<unknown> {
    // Test adding layer
    const pLayerEsriDynamicHistoFloods = this.#layerTester.testAddEsriDynamicHistoFloodEvents();

    // Test canonical export parameters against the case-sensitive Quebec service.
    const pLayerEsriDynamicCaseSensitive = this.#layerTester.testAddEsriDynamicCaseSensitiveExport();

    // Test adding layer EsriDynamic with Raster Layer inside, via Geocore UUID
    // GV Commented out for now, because the layer uuid has changed and the NRCan catalog is broken to go find the new uuid for this test
    // const pLayerEsriDynamicWithRasterLayersViaGeocore = this.#layerTester.testAddEsriDynamicWithRasterLayersViaGeocore();

    // Test true negative
    const pLayerEsriDynamicBadUrl = this.#layerTester.testAddEsriDynamicBadUrl();

    // Test adding layer
    const pLayerEsriFeatureForestIndustry = this.#layerTester.testAddEsriFeatureForestIndustry();

    // Test true negative
    const pLayerEsriFeatureBadUrl = this.#layerTester.testAddEsriFeatureBadUrl();

    // Test adding layer
    const playerEsriFeatureInvalidGeometry = this.#layerTester.testAddEsriFeatureInvalidGeometry();

    // Test adding layer
    const pLayerEsriImageElevation = this.#layerTester.testAddEsriImageWithElevation();

    // Test true negative
    const pLayerEsriImageBadUrl = this.#layerTester.testAddEsriImageBadUrl();

    // Test adding layer OWS Mundialis
    const pLayerWMSOWSMundialis = this.#layerTester.testAddWMSLayerWithOWSMundialis();

    // Test adding layer
    const pLayerWMSDatacubeOWSMSI = this.#layerTester.testAddWMSLayerWithDatacubeMSI();

    // Test adding layer
    const pLayerWMSDatacubeRingFireHalifax = this.#layerTester.testAddWMSLayerWithDatacubeRingOfFire();

    // Test adding layer
    const pLayerWMSLandcoverGroupDimension = this.#layerTester.testAddWMSLayerLandcoverGroupDimension(this.getIsRunningOnVPN());

    // Test adding layer
    const pLayerWMSLandcoverGroupDimensionNegative = this.#layerTester.testAddWMSLayerLandcoverGroupDimensionNegative(
      this.getIsRunningOnVPN()
    );

    // Test adding layer
    const pLayerNonnaWithCors = this.#layerTester.testAddWMSNonna();

    // Test WMS metadata and configured names for the ZPEGT group with aeroport sibling
    const pLayerZpegtSibling = this.#layerTester.testAddWMSZpegtGroupWithSiblingLayer();

    // Test WMS metadata and configured names for the ZPEGT group with Geoview layer name
    const pLayerZpegtGVLayerName = this.#layerTester.testAddWMSZpegtGroupWithGeoviewLayerName();

    // Test WMS metadata and configured names for the ZPEGT group without Geoview layer name
    const pLayerZpegtGVLayerNameMissing = this.#layerTester.testAddWMSZpegtGroupWithoutGeoviewLayerName();

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

    // Test true negative
    const pLayerGeoTIFFBadUrl = this.#layerTester.testAddGeoTIFFWithBadUrl();

    // Test adding layer
    const pLayerWMTSWorldTimezones = this.#layerTester.testAddWMTSWorldTimezones();

    // Test true negative
    const pLayerWMTSBadUrl = this.#layerTester.testAddWMTSBadUrl();

    // Test adding layer
    const pLayerXYZTilesOSM = this.#layerTester.testAddXYZTilesOSM();

    // Test true negative
    const pLayerXYZTilesBadUrl = this.#layerTester.testAddXYZTilesBadUrl();

    // Test adding layer
    const pLayerVectorTilesCBMT = this.#layerTester.testAddVectorTilesCBMT();

    // Test true negative
    const pLayerVectorTilesBadUrl = this.#layerTester.testAddVectorTilesBadUrl();

    // Test initial settings cascade
    const pInitialSettingsCascade = this.#layerTester.testInitialSettingsCascade();

    // Test geocore custom inline override scenarios
    const pGeocoreInlineListOverride = this.#layerTester.testAddGeocoreWithInlineListOfLayerEntryConfigOverride();

    const pGeocoreSimplifiedNameOverride = this.#layerTester.testAddGeocoreWithSimplifiedInlineLayerNameOverride();

    // Test domain fields
    const pEsriDynamicDomainField = this.#layerTester.testAddEsriDynamicWithDomainField();

    const pEsriFeatureDomainField = this.#layerTester.testAddEsriFeatureWithDomainField();

    // Resolve when all parallel tests are done
    await Promise.all([
      pLayerEsriDynamicHistoFloods,
      pLayerEsriDynamicCaseSensitive,
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
      pLayerWMSLandcoverGroupDimension,
      pLayerWMSLandcoverGroupDimensionNegative,
      pLayerNonnaWithCors,
      pLayerZpegtSibling,
      pLayerZpegtGVLayerName,
      pLayerZpegtGVLayerNameMissing,
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

    // Test geocore group with defaultVisibility=false
    await this.#layerTester.testAddGeocoreWithGroupDefaultVisibilityFalse(this.getIsRunningHeavyTests());

    // Test hidden-by-parent child + setLayerVisibleIncludingParents parent crawl (drives the panels' hidden/available lists)
    await this.#layerTester.testSetLayerVisibleIncludingParents();

    // Test ESRI Dynamic junction geometry pairs to its own OBJECTID (#3636) — changes zoom, resets to initial extent in finalize
    await this.#layerTester.testEsriDynamicJunctionGeometryPairing();

    // Done
    return;
  }
}
