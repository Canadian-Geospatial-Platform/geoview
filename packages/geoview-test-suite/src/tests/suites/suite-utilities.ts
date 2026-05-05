import type { API } from 'geoview-core/api/api';
import type { MapViewer } from 'geoview-core/geo/map/map-viewer';
import type { ControllerRegistry } from 'geoview-core/core/controllers/base/controller-registry';
import { GVAbstractTestSuite } from './abstract-gv-test-suite';
import { UtilitiesCoreTester } from '../testers/utilities-core-tester';
import { UtilitiesDateTester } from '../testers/utilities-date-tester';
import { UtilitiesGeoTester } from '../testers/utilities-geo-tester';
import { UtilitiesProjectionTester } from '../testers/utilities-projection-tester';

/**
 * Test Suite for cgpv.api.utilities functions (core, date, geo, projection).
 */
export class GVTestSuiteUtilities extends GVAbstractTestSuite {
  /** The Utilities Core Tester. */
  #coreTester: UtilitiesCoreTester;

  /** The Utilities Date Tester. */
  #dateTester: UtilitiesDateTester;

  /** The Utilities Geo Tester. */
  #geoTester: UtilitiesGeoTester;

  /** The Utilities Projection Tester. */
  #projectionTester: UtilitiesProjectionTester;

  /**
   * Constructs the Test Suite.
   *
   * @param api - The shared api
   * @param mapViewer - The map viewer
   * @param controllerRegistry - The controller registry
   */
  constructor(api: API, mapViewer: MapViewer, controllerRegistry: ControllerRegistry) {
    super(api, mapViewer, controllerRegistry);
    this.#coreTester = new UtilitiesCoreTester(api, mapViewer, controllerRegistry);
    this.#dateTester = new UtilitiesDateTester(api, mapViewer, controllerRegistry);
    this.#geoTester = new UtilitiesGeoTester(api, mapViewer, controllerRegistry);
    this.#projectionTester = new UtilitiesProjectionTester(api, mapViewer, controllerRegistry);
    this.addTester(this.#coreTester);
    this.addTester(this.#dateTester);
    this.addTester(this.#geoTester);
    this.addTester(this.#projectionTester);
  }

  /**
   * Returns the name of the Test Suite.
   *
   * @returns The name of the Test Suite
   */
  override getName(): string {
    return 'Utilities Test Suite';
  }

  /**
   * Returns the description of the Test Suite.
   *
   * @returns The description of the Test Suite
   */
  override getDescriptionAsHtml(): string {
    return 'Test Suite for cgpv.api.utilities — core, date, geo, and projection functions.';
  }

  /**
   * Overrides the implementation to perform the tests for this Test Suite.
   *
   * @returns A promise that resolves when tests are completed
   */
  protected override onLaunchTestSuite(): Promise<unknown> {
    // Core tester tests
    const pRange = this.#coreTester.testRange();
    const pCamelCase = this.#coreTester.testCamelCase();
    const pDeepEqual = this.#coreTester.testDeepEqual();
    const pDeepClone = this.#coreTester.testDeepClone();
    const pDeepMerge = this.#coreTester.testDeepMerge();
    const pShallowEquals = this.#coreTester.testShallowEquals();
    const pIsNumeric = this.#coreTester.testIsNumeric();
    const pIsObjectEmpty = this.#coreTester.testIsObjectEmpty();
    const pGenerateIdAndIsValidUUID = this.#coreTester.testGenerateIdAndIsValidUUID();
    const pSetAlphaColor = this.#coreTester.testSetAlphaColor();
    const pIsJsonString = this.#coreTester.testIsJsonString();
    const pJsonParsing = this.#coreTester.testJsonParsing();
    const pEscapeRegExp = this.#coreTester.testEscapeRegExp();
    const pIsImage = this.#coreTester.testIsImage();
    const pStringify = this.#coreTester.testStringify();
    const pSafeStringify = this.#coreTester.testSafeStringify();
    const pDeepMergeObjects = this.#coreTester.testDeepMergeObjects();
    const pFindPropertyByRegexPath = this.#coreTester.testFindPropertyByRegexPath();
    const pFormatMeasurements = this.#coreTester.testFormatMeasurements();
    const pNormalizeDatacubeAccessPath = this.#coreTester.testNormalizeDatacubeAccessPath();
    const pSanitizeHtmlContent = this.#coreTester.testSanitizeHtmlContent();
    const pEnhanceLinksAccessibility = this.#coreTester.testEnhanceLinksAccessibility();
    const pGetLocalizedMessage = this.#coreTester.testGetLocalizedMessage();

    // Date tester tests
    const pFormatDate = this.#dateTester.testFormatDate();
    const pFormatDateISOShort = this.#dateTester.testFormatDateISOShort();
    const pConvertToMilliseconds = this.#dateTester.testConvertToMilliseconds();
    const pTryParseDate = this.#dateTester.testTryParseDate();
    const pHasTimeComponents = this.#dateTester.testHasTimeComponents();
    const pIsValidTimezone = this.#dateTester.testIsValidTimezone();
    const pCreateRangeOGC = this.#dateTester.testCreateRangeOGC();
    const pDateConstants = this.#dateTester.testDateConstants();
    const pParseDateToDayjs = this.#dateTester.testParseDateToDayjs();

    // Geo tester tests
    const pGetBaseUrl = this.#geoTester.testGetBaseUrl();
    const pGetMapServerUrl = this.#geoTester.testGetMapServerUrl();
    const pCoordFormatDMS = this.#geoTester.testCoordFormatDMS();
    const pIsPointInExtent = this.#geoTester.testIsPointInExtent();
    const pGetExtentUnion = this.#geoTester.testGetExtentUnion();
    const pIsExtentLonLat = this.#geoTester.testIsExtentLonLat();
    const pBufferExtent = this.#geoTester.testBufferExtent();
    const pIsGeoJSONObject = this.#geoTester.testIsGeoJSONObject();
    const pGeometryTypeConversions = this.#geoTester.testGeometryTypeConversions();
    const pEnsureServiceRequestUrl = this.#geoTester.testEnsureServiceRequestUrl();
    const pGetExtentIntersection = this.#geoTester.testGetExtentIntersection();

    // Projection tester tests
    const pProjectionNames = this.#projectionTester.testProjectionNames();
    const pReadEPSGNumber = this.#projectionTester.testReadEPSGNumber();
    const pGetProjectionLonLat = this.#projectionTester.testGetProjectionLonLat();
    const pTransformPoints = this.#projectionTester.testTransformPoints();
    const pTransformExtentFromProj = this.#projectionTester.testTransformExtentFromProj();
    const pGetProjectionFromString = this.#projectionTester.testGetProjectionFromString();

    return Promise.all([
      // Core
      pRange,
      pCamelCase,
      pDeepEqual,
      pDeepClone,
      pDeepMerge,
      pShallowEquals,
      pIsNumeric,
      pIsObjectEmpty,
      pGenerateIdAndIsValidUUID,
      pSetAlphaColor,
      pIsJsonString,
      pJsonParsing,
      pEscapeRegExp,
      pIsImage,
      pStringify,
      pSafeStringify,
      pDeepMergeObjects,
      pFindPropertyByRegexPath,
      pFormatMeasurements,
      pNormalizeDatacubeAccessPath,
      pSanitizeHtmlContent,
      pEnhanceLinksAccessibility,
      pGetLocalizedMessage,
      // Date
      pFormatDate,
      pFormatDateISOShort,
      pConvertToMilliseconds,
      pTryParseDate,
      pHasTimeComponents,
      pIsValidTimezone,
      pCreateRangeOGC,
      pDateConstants,
      pParseDateToDayjs,
      // Geo
      pGetBaseUrl,
      pGetMapServerUrl,
      pCoordFormatDMS,
      pIsPointInExtent,
      pGetExtentUnion,
      pIsExtentLonLat,
      pBufferExtent,
      pIsGeoJSONObject,
      pGeometryTypeConversions,
      pEnsureServiceRequestUrl,
      pGetExtentIntersection,
      // Projection
      pProjectionNames,
      pReadEPSGNumber,
      pGetProjectionLonLat,
      pTransformPoints,
      pTransformExtentFromProj,
      pGetProjectionFromString,
    ]);
  }
}
