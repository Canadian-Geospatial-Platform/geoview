import type { API } from 'geoview-core/api/api';
import type { MapViewer } from 'geoview-core/geo/map/map-viewer';
import { CoreTester } from '../testers/core-tester';
import { GVAbstractTestSuite } from './abstract-gv-test-suite';
import type { ControllerRegistry } from 'geoview-core/core/controllers/base/controller-registry';

/**
 * The GeoView Test Suite.
 */
export class GVTestSuiteCore extends GVAbstractTestSuite {
  /** The Tester used in this Test Suite */
  #coreTester: CoreTester;

  /**
   * Constructs the Test Suite.
   *
   * @param api - The shared api
   * @param mapViewer - The map viewer
   * @param controllerRegistry - The controller registry
   */
  constructor(api: API, mapViewer: MapViewer, controllerRegistry: ControllerRegistry) {
    super(api, mapViewer, controllerRegistry);

    // Create the Geochart tester
    this.#coreTester = new CoreTester(api, mapViewer, controllerRegistry);
    this.addTester(this.#coreTester);
  }

  /**
   * Returns the name of the Test Suite.
   *
   * @returns The name of the Test Suite
   */
  override getName(): string {
    return 'Core Test Suite';
  }

  /**
   * Returns the description of the Test Suite.
   *
   * @returns The description of the Test Suite
   */
  override getDescriptionAsHtml(): string {
    return `Tests core framework utilities and service metadata fetching:<br/>
      <b>URL validation</b> — Simple ping, XYZ tiles, invalid format, unreachable, WMS service<br/>
      <b>Service metadata</b> — WMS, WFS, WMTS GetCapabilities (happy path + bad URL)<br/>
      <b>Proxy fallback</b> — JSON fetch with CORS proxy retry (happy path + bad URL)<br/>
      <b>Rendering</b> — GeometryCollection legend style generation`;
  }

  /**
   * Overrides the debug hook for running a subset of tests during development.
   *
   * GV DEBUG SECTION TO NOT HAVE TO TEST EVERYTHING EVERYTIME
   *
   * @returns A promise that resolves when the debug tests are completed
   */
  protected override onLaunchTestSuiteDEBUG(): Promise<unknown> {
    const pDevTest0 = this.#coreTester.testProxyGetWMTSServiceMetadata();
    const pDevTest1 = this.#coreTester.testProxyGetWMTSServiceMetadataBadUrl();

    // Resolve when all
    return Promise.all([pDevTest0, pDevTest1]);
  }

  /**
   * Overrides the implementation to perform the tests for this Test Suite.
   *
   * @returns A promise that resolves when tests are completed
   */
  protected override async onLaunchTestSuite(): Promise<unknown> {
    // Test validateAndPingUrl (simple)
    const pSimplePingValid = this.#coreTester.testSimplePingValidReachable();
    if (this.getIsRunningSequentially()) await pSimplePingValid;

    const pSimplePingXyz = this.#coreTester.testSimplePingXyzTileUrl();
    if (this.getIsRunningSequentially()) await pSimplePingValid;

    const pSimplePingXyz401 = this.#coreTester.testSimplePingXyzTileUrlUnauthorized();
    if (this.getIsRunningSequentially()) await pSimplePingXyz401;

    // Test validateAndPingUrlOGC (OGC-aware)
    const pPingInvalidFormat = this.#coreTester.testValidateAndPingUrlInvalidFormat();
    if (this.getIsRunningSequentially()) await pPingInvalidFormat;

    const pPingUnreachable = this.#coreTester.testValidateAndPingUrlUnreachable();
    if (this.getIsRunningSequentially()) await pPingUnreachable;

    const pPingWmsService = this.#coreTester.testValidateAndPingUrlWmsService();
    if (this.getIsRunningSequentially()) await pPingWmsService;

    const pGeometryCollectionLegendStyles = this.#coreTester.testGeometryCollectionLegendStyles();
    if (this.getIsRunningSequentially()) await pGeometryCollectionLegendStyles;

    // Test GeoUtilities service metadata functions
    const pWmsMetadata = this.#coreTester.testProxyGetWMSServiceMetadata();
    if (this.getIsRunningSequentially()) await pWmsMetadata;

    const pWmsMetadataBadUrl = this.#coreTester.testProxyGetWMSServiceMetadataBadUrl();
    if (this.getIsRunningSequentially()) await pWmsMetadataBadUrl;

    const pWfsMetadata = this.#coreTester.testProxyGetWFSServiceMetadata();
    if (this.getIsRunningSequentially()) await pWfsMetadata;

    const pWfsMetadataBadUrl = this.#coreTester.testProxyGetWFSServiceMetadataBadUrl();
    if (this.getIsRunningSequentially()) await pWfsMetadataBadUrl;

    const pWmtsMetadata = this.#coreTester.testProxyGetWMTSServiceMetadata();
    if (this.getIsRunningSequentially()) await pWmtsMetadata;

    const pWmtsMetadataBadUrl = this.#coreTester.testProxyGetWMTSServiceMetadataBadUrl();
    if (this.getIsRunningSequentially()) await pWmtsMetadataBadUrl;

    // Test GeoUtilities fetch with proxy fallback
    // const pFetchJsonProxy = this.#coreTester.testFetchJsonWithProxyFallback();
    const pFetchJsonProxyBadUrl = this.#coreTester.testFetchJsonWithProxyFallbackBadUrl();
    if (this.getIsRunningSequentially()) await pFetchJsonProxyBadUrl;

    // Resolve when all
    return Promise.all([
      pSimplePingValid,
      pSimplePingXyz,
      pSimplePingXyz401,
      pPingInvalidFormat,
      pPingUnreachable,
      pPingWmsService,
      pGeometryCollectionLegendStyles,
      pWmsMetadata,
      pWmsMetadataBadUrl,
      pWfsMetadata,
      pWfsMetadataBadUrl,
      pWmtsMetadata,
      pWmtsMetadataBadUrl,
      // pFetchJsonProxy,
      pFetchJsonProxyBadUrl,
    ]);
  }
}
