# Test Catalog

> **Auto-maintained** — This file must be updated each time a test is added, removed, or renamed in the `geoview-test-suite` package.

This catalog lists every test by group, suite, and tester. Each entry gives the method name, test type (`test` for happy-path, `testError` for true-negative), and runtime description. Use the automated checklist to track suite pass status.

---

## Table of Contents

- [1. Core / Utility](#1-core--utility)
  - [1.1 Core (EPSG: 3978)](#11-core-epsg-3978)
  - [1.2 Config Validation](#12-config-validation)
    - [1.2.1 Esri Dynamic](#121-esri-dynamic)
    - [1.2.2 Esri Feature](#122-esri-feature)
    - [1.2.3 Esri Image](#123-esri-image)
    - [1.2.4 WMS](#124-wms)
    - [1.2.5 WFS](#125-wfs)
    - [1.2.6 GeoJSON](#126-geojson)
    - [1.2.7 CSV](#127-csv)
    - [1.2.8 OGC Feature](#128-ogc-feature)
    - [1.2.9 WKB](#129-wkb)
    - [1.2.10 KML](#1210-kml)
    - [1.2.11 GeoTIFF](#1211-geotiff)
    - [1.2.12 Geocore](#1212-geocore)
    - [1.2.13 Settings Cascade](#1213-settings-cascade)
  - [1.3 Utilities](#13-utilities)
    - [1.3.1 UtilitiesCoreTester](#131-utilitiescoretester)
    - [1.3.2 UtilitiesDateTester](#132-utilitiesdatetester)
    - [1.3.3 UtilitiesGeoTester](#133-utilitiesgeotester)
    - [1.3.4 UtilitiesProjectionTester](#134-utilitiesprojectiontester)
- [2. Layers](#2-layers)
  - [2.1 Layers (EPSG: 3978 & 3857)](#21-layers-epsg-3978--3857)
    - [2.1.1 Esri Dynamic — Lifecycle](#211-esri-dynamic--lifecycle)
    - [2.1.2 Esri Feature — Lifecycle](#212-esri-feature--lifecycle)
    - [2.1.3 Esri Image — Lifecycle](#213-esri-image--lifecycle)
    - [2.1.4 WMS — Lifecycle](#214-wms--lifecycle)
    - [2.1.5 WFS — Lifecycle](#215-wfs--lifecycle)
    - [2.1.6 GeoJSON — Lifecycle](#216-geojson--lifecycle)
    - [2.1.7 GeoTIFF — Lifecycle](#217-geotiff--lifecycle)
    - [2.1.8 CSV — Lifecycle](#218-csv--lifecycle)
    - [2.1.9 OGC Feature — Lifecycle](#219-ogc-feature--lifecycle)
    - [2.1.10 WKB — Lifecycle](#2110-wkb--lifecycle)
    - [2.1.11 KML — Lifecycle](#2111-kml--lifecycle)
    - [2.1.12 Initial Settings](#2112-initial-settings)
    - [2.1.13 Domain Fields (sequential)](#2113-domain-fields-sequential)
    - [2.1.14 Domain Field Query (sequential)](#2114-domain-field-query-sequential)
- [3. Map](#3-map)
  - [3.1 Map Functions](#31-map-functions)
  - [3.2 Map Config](#32-map-config)
    - [Viewport Boundary and Fitting](#viewport-boundary-and-fitting)
    - [3.2.1 Footer Bar / App Bar / Nav Bar](#321-footer-bar--app-bar--nav-bar)
    - [3.2.2 Initial View](#322-initial-view)
    - [3.2.3 Overlay Objects](#323-overlay-objects)
    - [3.2.4 View Settings](#324-view-settings)
    - [3.2.5 Overview Map](#325-overview-map)
    - [3.2.6 Initial Settings — Controls](#326-initial-settings--controls)
    - [3.2.7 Initial Settings — States](#327-initial-settings--states)
    - [3.2.8 Initial Settings — Opacity Cascading](#328-initial-settings--opacity-cascading)
    - [3.2.9 Initial Settings — Cascading (Controls & Visibility)](#329-initial-settings--cascading-controls--visibility)
    - [3.2.10 Initial Settings — Combo Tests](#3210-initial-settings--combo-tests)
- [4. Components](#4-components)
  - [4.1 Details](#41-details)
  - [4.2 Data Table](#42-data-table)
- [5. Packages](#5-packages)
  - [5.1 Geochart](#51-geochart)
  - [5.2 Swiper](#52-swiper)
  - [5.3 Time Slider](#53-time-slider)
- [Summary](#summary)

---

### Summary

| Group             | Suite                   | Tester(s)                                                                                       | Execution                   |
| ----------------- | ----------------------- | ----------------------------------------------------------------------------------------------- | --------------------------- |
| 1. Core / Utility | `suite-core`            | `CoreTester`                                                                                    | Parallel                    |
| 1. Core / Utility | `suite-config`          | `ConfigTester`                                                                                  | Parallel                    |
| 1. Core / Utility | `suite-utilities`       | `UtilitiesCoreTester`, `UtilitiesDateTester`, `UtilitiesGeoTester`, `UtilitiesProjectionTester` | Parallel                    |
| 2. Layers         | `suite-layer`           | `LayerTester`                                                                                   | Mixed parallel + sequential |
| 2. Layers         | `suite-layer-functions` | `LayerTester`                                                                                   | Mixed parallel + sequential |
| 3. Map            | `suite-map`             | `MapTester`                                                                                     | Complex mixed; UI checks last |
| 3. Map            | `suite-map-config`      | `MapConfigTester`, `MapTester`                                                                  | Fully sequential            |
| 4. Components     | `suite-details`         | `DetailsTester`                                                                                 | Guarded sequential          |
| 4. Components     | `suite-data-table`      | `DataTableTester`                                                                               | Guarded sequential          |
| 5. Packages       | `suite-geochart`        | `GeochartTester`                                                                                | Guarded sequential          |
| 5. Packages       | `suite-swiper`          | `SwiperTester`                                                                                  | Guarded sequential          |
| 5. Packages       | `suite-time-slider`     | `TimeSliderTester`                                                                              | Guarded sequential          |

---

## 1. Core / Utility

[↑ Back to top](#table-of-contents)

### 1.1 Core (EPSG: 3978)

[↑ Back to top](#table-of-contents)

**Suite:** `suite-core` · **File:** `tests/suites/suite-core.ts` · **Tester:** `CoreTester` (`tests/testers/core-tester.ts`)
**Execution:** Fully parallel (`Promise.all`) · **Guard:** None

| Method                                  | Type      | Description                                                                           |
| --------------------------------------- | --------- | ------------------------------------------------------------------------------------- |
| `testSimplePingValidReachable`          | test      | Test validateAndPingUrl (simple) with a directly reachable URL...                     |
| `testSimplePingXyzTileUrl`              | test      | Test validateAndPingUrl (simple) with an XYZ tile URL template...                     |
| `testSimplePingXyzTileUrlUnauthorized`  | test      | Test validateAndPingUrl (simple) with an XYZ tile URL returning 401...                |
| `testValidateAndPingUrlInvalidFormat`   | test      | Test validateAndPingUrl with an invalid URL format...                                 |
| `testValidateAndPingUrlUnreachable`     | test      | Test validateAndPingUrl with an unreachable URL...                                    |
| `testValidateAndPingUrlWmsService`      | test      | Test validateAndPingUrl with a WMS service URL...                                     |
| `testGeometryCollectionLegendStyles`    | test      | Test GeometryCollection legend style generation...                                    |
| `testEsriPictureFillLegendStyles`       | test      | Test ESRI picture fill legend style generation...                                     |
| `testWfsStyleWithTextOnlyRule`          | test      | Test WFS SLD conversion with a text-only rule...                                      |
| `testProxyGetWMSServiceMetadata`        | test      | Test GeoUtilities.getWMSServiceMetadata with Forest Burn (proxy fallback)...          |
| `testProxyGetWMSServiceMetadataBadUrl`  | testError | Test GeoUtilities.getWMSServiceMetadata with bad URL...                               |
| `testProxyGetWFSServiceMetadata`        | test      | Test GeoUtilities.getWFSServiceMetadata with Belgium WFS (proxy fallback)...          |
| `testProxyGetWFSServiceMetadataBadUrl`  | testError | Test GeoUtilities.getWFSServiceMetadata with bad URL...                               |
| `testProxyGetWMTSServiceMetadata`       | test      | Test GeoUtilities.getWMTSServiceMetadata with Taiwan WMTS service (proxy fallback)... |
| `testProxyGetWMTSServiceMetadataBadUrl` | testError | Test GeoUtilities.getWMTSServiceMetadata with bad URL...                              |
| `testFetchJsonWithProxyFallbackBadUrl`  | testError | Test GeoUtilities.fetchJsonWithProxyFallback with bad URL...                          |

---

### 1.2 Config Validation

[↑ Back to top](#table-of-contents)

**Suite:** `suite-config` · **File:** `tests/suites/suite-config.ts` · **Tester:** `ConfigTester` (`tests/testers/config-tester.ts`)
**Execution:** Fully parallel (`Promise.all`) · **Guard:** None

#### 1.2.1 Esri Dynamic

[↑ Back to top](#table-of-contents)

| Method                                     | Type      | Description                                                                                       |
| ------------------------------------------ | --------- | ------------------------------------------------------------------------------------------------- |
| `testEsriDynamicWithHistoricalFloodEvents` | test      | Test an Esri Dynamic with Historical Flood Events                                                 |
| `testEsriDynamicWithCESI`                  | test      | Test an Esri Dynamic with CESI                                                                    |
| `testEsriDynamicBadUrl`                    | testError | Test an EsriDynamic config with a bad url... _(expects `LayerServiceMetadataUnableToFetchError`)_ |

#### 1.2.2 Esri Feature

[↑ Back to top](#table-of-contents)

| Method                                     | Type      | Description                                                                                       |
| ------------------------------------------ | --------- | ------------------------------------------------------------------------------------------------- |
| `testEsriFeatureWithTorontoNeighbourhoods` | test      | Test an Esri Feature with Toronto Neighbourhoods                                                  |
| `testEsriFeatureWithHistoricalFloodEvents` | test      | Test an Esri Feature with Historical Flood Events                                                 |
| `testEsriFeatureWithForestIndustry`        | test      | Test an Esri Feature with Forest Industry                                                         |
| `testEsriFeatureBadUrl`                    | testError | Test an EsriFeature config with a bad url... _(expects `LayerServiceMetadataUnableToFetchError`)_ |

#### 1.2.3 Esri Image

[↑ Back to top](#table-of-contents)

| Method                       | Type      | Description                                                                                     |
| ---------------------------- | --------- | ----------------------------------------------------------------------------------------------- |
| `testEsriImageWithElevation` | test      | Test an Esri Image with Elevation                                                               |
| `testEsriImageBadUrl`        | testError | Test an EsriImage config with a bad url... _(expects `LayerServiceMetadataUnableToFetchError`)_ |

#### 1.2.4 WMS

[↑ Back to top](#table-of-contents)

| Method                                        | Type      | Description                                                                              |
| --------------------------------------------- | --------- | ---------------------------------------------------------------------------------------- |
| `testWMSLayerWithOWSMundialis`                | test      | Test a WMS with OWS Mundialis                                                            |
| `testWMSLayerWithOWSMundialisNoFullSubLayers` | test      | Test a WMS with OWS Mundialis no full sub layers                                         |
| `testWMSLayerWithDatacubeMSI`                 | test      | Test a WMS with Datacube MSI                                                             |
| `testWMSLayerWithDatacubeMSINoFullSubLayers`  | test      | Test a WMS with Datacube MSI                                                             |
| `testWMSBadUrl`                               | testError | Test a WMS config with a bad url... _(expects `LayerServiceMetadataUnableToFetchError`)_ |

#### 1.2.5 WFS

[↑ Back to top](#table-of-contents)

| Method                                    | Type      | Description                                                                                     |
| ----------------------------------------- | --------- | ----------------------------------------------------------------------------------------------- |
| `testWFSLayerWithGeometCurrentConditions` | test      | Test a WFS with Geomet Current Conditions                                                       |
| `testWFSBadUrl`                           | testError | Test a WFS config with a bad url... _(expects `LayerServiceMetadataUnableToFetchError`)_        |
| `testWFSOkayUrlNoCap`                     | testError | Test a WFS config with a okay url but no capabilities... _(expects `LayerNoCapabilitiesError`)_ |

#### 1.2.6 GeoJSON

[↑ Back to top](#table-of-contents)

| Method                              | Type      | Description                                                                                                   |
| ----------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------- |
| `testGeojsonWithMetadataMeta`       | test      | Test a Geojson with metadata.meta file                                                                        |
| `testGeojsonWithGeometryCollection` | test      | Test a Geojson with GeometryCollection sample file                                                            |
| `testGeoJSONBadUrlExpectSkip`       | test      | Test a GeoJSON config with a bad url expecting a skip...                                                      |
| `testGeoJSONBadUrlExpectError`      | testError | Test a GeoJSON config with a bad url expecting a fail... _(expects `LayerServiceMetadataUnableToFetchError`)_ |

#### 1.2.7 CSV

[↑ Back to top](#table-of-contents)

| Method                    | Type | Description                                          |
| ------------------------- | ---- | ---------------------------------------------------- |
| `testCSVWithStationList`  | test | Test a CSV with CSV file                             |
| `testCSVBadUrlExpectSkip` | test | Test a CSV config with a bad url expecting a skip... |

#### 1.2.8 OGC Feature

[↑ Back to top](#table-of-contents)

| Method                       | Type      | Description                                                                                       |
| ---------------------------- | --------- | ------------------------------------------------------------------------------------------------- |
| `testOGCFeatureWithPygeoapi` | test      | Test an OGC Feature with Pygeoapi                                                                 |
| `testOGCFeatureBadUrl`       | testError | Test an OGC Feature config with a bad url... _(expects `LayerServiceMetadataUnableToFetchError`)_ |

#### 1.2.9 WKB

[↑ Back to top](#table-of-contents)

| Method                    | Type      | Description                                                                              |
| ------------------------- | --------- | ---------------------------------------------------------------------------------------- |
| `testWKBWithSouthAfrica`  | test      | Test a WKB with South Africa                                                             |
| `testWKBBadUrlExpectFail` | testError | Test a WKB config with a bad url... _(expects `LayerServiceMetadataUnableToFetchError`)_ |

#### 1.2.10 KML

[↑ Back to top](#table-of-contents)

| Method                    | Type | Description                                          |
| ------------------------- | ---- | ---------------------------------------------------- |
| `testKMLWithTornado`      | test | Test a KML with Tornado file                         |
| `testKMLBadUrlExpectSkip` | test | Test a KML config with a bad url expecting a skip... |

#### 1.2.11 GeoTIFF

[↑ Back to top](#table-of-contents)

| Method                        | Type | Description                                              |
| ----------------------------- | ---- | -------------------------------------------------------- |
| `testGeoTIFFWithVegetation`   | test | Test a GeoTIFF with Vegetation                           |
| `testGeoTIFFBadUrlExpectSkip` | test | Test a GeoTIFF config with a bad url expecting a skip... |

#### 1.2.12 Geocore

[↑ Back to top](#table-of-contents)

| Method                              | Type | Description                |
| ----------------------------------- | ---- | -------------------------- |
| `testStandaloneGeocoreWithAirborne` | test | Test Geocore with Airborne |

#### 1.2.13 Settings Cascade

[↑ Back to top](#table-of-contents)

| Method                           | Type | Description                        |
| -------------------------------- | ---- | ---------------------------------- |
| `testSettingsCascadeToSublayers` | test | Test Settings Cascade to Sublayers |

---

### 1.3 Utilities

[↑ Back to top](#table-of-contents)

**Suite:** `suite-utilities` · **File:** `tests/suites/suite-utilities.ts` · **Guard:** None
**Execution:** Parallel (`Promise.all`), followed by sequential projection definition-request observation

#### 1.3.1 UtilitiesCoreTester

[↑ Back to top](#table-of-contents)

**File:** `tests/testers/utilities-core-tester.ts`

| Method                            | Type | Description                                                    |
| --------------------------------- | ---- | -------------------------------------------------------------- |
| `testRange`                       | test | Test range() generates correct sequences...                    |
| `testCamelCase`                   | test | Test camelCase() converts strings...                           |
| `testDeepEqual`                   | test | Test deepEqual() compares values...                            |
| `testDeepClone`                   | test | Test deepClone() creates independent copies...                 |
| `testDeepMerge`                   | test | Test deepMerge() merges objects...                             |
| `testShallowEquals`               | test | Test shallowObjectEqual() and shallowArrayEqual()...           |
| `testIsNumeric`                   | test | Test isNumeric() validates numeric strings...                  |
| `testIsObjectEmpty`               | test | Test isObjectEmpty() checks empty objects...                   |
| `testGenerateIdAndIsValidUUID`    | test | Test generateId() and isValidUUID()...                         |
| `testSetAlphaColor`               | test | Test setAlphaColor() modifies alpha channel...                 |
| `testIsJsonString`                | test | Test isJsonString() validates JSON strings...                  |
| `testJsonParsing`                 | test | Test removeCommentsFromJSON() and parseJSONConfig()...         |
| `testEscapeRegExp`                | test | Test escapeRegExp() escapes regex characters...                |
| `testIsImage`                     | test | Test isImage() detects image URLs...                           |
| `testStringify`                   | test | Test stringify() handles null/undefined/values...              |
| `testSafeStringify`               | test | Test safeStringify() handles circular references...            |
| `testDeepMergeObjects`            | test | Test deepMergeObjects() merges multiple objects...             |
| `testFindPropertyByRegexPath`     | test | Test findPropertyByRegexPath() finds nested properties...      |
| `testFormatMeasurements`          | test | Test formatMeasurementValue(), formatLength(), formatArea()... |
| `testNormalizeDatacubeAccessPath` | test | Test normalizeDatacubeAccessPath() transforms URLs...          |
| `testSanitizeHtmlContent`         | test | Test sanitizeHtmlContent() strips dangerous HTML...            |
| `testEnhanceLinksAccessibility`   | test | Test enhanceLinksAccessibility() adds screen reader text...    |
| `testGetLocalizedMessage`         | test | Test getLocalizedMessage() returns translated strings...       |

#### 1.3.2 UtilitiesDateTester

[↑ Back to top](#table-of-contents)

**File:** `tests/testers/utilities-date-tester.ts`

| Method                      | Type | Description                                               |
| --------------------------- | ---- | --------------------------------------------------------- |
| `testFormatDate`            | test | Test DateMgt.formatDate() formats dates...                |
| `testFormatDateISOShort`    | test | Test DateMgt.formatDateISOShort() returns short ISO...    |
| `testConvertToMilliseconds` | test | Test DateMgt.convertToMilliseconds() converts to epoch... |
| `testTryParseDate`          | test | Test DateMgt.tryParseDate() parses valid dates...         |
| `testHasTimeComponents`     | test | Test DateMgt.hasTimeComponents() detects time tokens...   |
| `testIsValidTimezone`       | test | Test DateMgt.isValidTimezone() validates timezones...     |
| `testCreateRangeOGC`        | test | Test DateMgt.createRangeOGC() parses OGC time values...   |
| `testDateConstants`         | test | Test DateMgt static constants are defined...              |
| `testParseDateToDayjs`      | test | Test DateMgt.parseDateToDayjs() parses date inputs...     |
| `testDatesEpochTimestamps`  | test | Test Dates from Epoch Timestamps and Dates...             |
| `testDatesUSStandard`       | test | Test Dates from US Standards...                           |
| `testDatesSpecialFormats`   | test | Test Dates from Custom Formats...                         |

#### 1.3.3 UtilitiesGeoTester

[↑ Back to top](#table-of-contents)

**File:** `tests/testers/utilities-geo-tester.ts`

| #   | Method                                             | Type | Description                                                                      |
| --- | -------------------------------------------------- | ---- | -------------------------------------------------------------------------------- |
| 1   | `testGetBaseUrl`                                   | test | Test GeoUtilities.getBaseUrl() extracts base URL...                              |
| 2   | `testGetMapServerUrl`                              | test | Test GeoUtilities.getMapServerUrl() truncates at MapServer...                    |
| 3   | `testCoordFormatDMS`                               | test | Test GeoUtilities.coordFormatDMS() converts decimal degrees...                   |
| 4   | `testIsPointInExtent`                              | test | Test GeoUtilities.isPointInExtent() checks containment...                        |
| 5   | `testGetExtentUnion`                               | test | Test GeoUtilities.getExtentUnion() computes union...                             |
| 6   | `testIsExtentLonLat`                               | test | Test GeoUtilities.isExtentLonLat() validates lon/lat...                          |
| 7   | `testBufferExtent`                                 | test | Test GeoUtilities.bufferExtent() expands extent...                               |
| 8   | `testIsGeoJSONObject`                              | test | Test GeoUtilities.isGeoJSONObject() detects GeoJSON...                           |
| 9   | `testGeometryTypeConversions`                      | test | Test geometry type conversions...                                                |
| 10  | `testEnsureServiceRequestUrl`                      | test | Test GeoUtilities.ensureServiceRequestUrl() normalizes params...                 |
| 11  | `testGetExtentIntersection`                        | test | Test GeoUtilities.getExtentIntersection() computes intersection...               |
| 12  | `testReadFeaturesFromGeoJSONProjectionObject`      | test | Test GeoJSON reader transforms features using an OpenLayers source projection... |
| 13  | `testReadFeaturesFromGeoJSONEmbeddedCRSPrecedence` | test | Test embedded GeoJSON CRS overrides a conflicting source projection...           |
| 14  | `testReadFeaturesFromEsriJSONProjectionObject`     | test | Test EsriJSON reader accepts an OpenLayers source projection...                  |

#### 1.3.4 UtilitiesProjectionTester

[↑ Back to top](#table-of-contents)

**File:** `tests/testers/utilities-projection-tester.ts`

| #   | Method                             | Type | Description                                                                                          |
| --- | ---------------------------------- | ---- | ---------------------------------------------------------------------------------------------------- |
| 1   | `testProjectionNames`              | test | Test Projection.PROJECTION_NAMES contains expected entries...                                        |
| 2   | `testReadEPSGNumber`               | test | Test Projection.readEPSGNumber() extracts EPSG codes...                                              |
| 3   | `testGetProjectionLonLat`          | test | Test Projection.getProjectionLonLat() returns EPSG:4326...                                           |
| 4   | `testTransformPoints`              | test | Test Projection.transformPoints() transforms coordinates...                                          |
| 5   | `testTransformExtentFromProj`      | test | Test Projection.transformExtentFromProj() transforms extents...                                      |
| 6   | `testGetProjectionFromString`      | test | Test Projection.getProjectionFromString() resolves projections...                                    |
| 7   | `testAddProjectionIfMissingInputs` | test | Test addProjectionIfMissing accepts projection objects, identifiers and metadata without fetching... |

---

## 2. Layers

[↑ Back to top](#table-of-contents)

### 2.1 Layers (EPSG: 3978 & 3857)

[↑ Back to top](#table-of-contents)

**Suite:** `suite-layer` · **File:** `tests/suites/suite-layer.ts` · **Tester:** `LayerTester` (`tests/testers/layer-tester.ts`)
**Execution:** Mixed — parallel for add/remove tests, then sequential for query tests (they change zoom level) · **Guard:** None

> **Note:** This suite runs on two separate maps — one with EPSG: 3978 and one with EPSG: 3857 — executing the same tests under both projections.

#### 2.1.1 Esri Dynamic — Lifecycle

[↑ Back to top](#table-of-contents)

| Method                                         | Type      | Description                                                                                   |
| ---------------------------------------------- | --------- | --------------------------------------------------------------------------------------------- |
| `testAddEsriDynamicHistoFloodEvents`           | test      | Test Adding Esri Dynamic Histo Flood Events on map...                                         |
| `testAddEsriDynamicWithRasterLayersViaGeocore` | test      | Test Adding Esri Dynamic with Raster Layers via Geocore...                                    |
| `testAddEsriDynamicBadUrl`                     | testError | Test Adding Esri Dynamic with bad url... _(expects `LayerServiceMetadataUnableToFetchError`)_ |

#### 2.1.2 Esri Feature — Lifecycle

[↑ Back to top](#table-of-contents)

| Method                              | Type      | Description                                                                                   |
| ----------------------------------- | --------- | --------------------------------------------------------------------------------------------- |
| `testAddEsriFeatureForestIndustry`  | test      | Test Adding Esri Feature Forest Industry on map...                                            |
| `testAddEsriFeatureBadUrl`          | testError | Test Adding Esri Feature with bad url... _(expects `LayerServiceMetadataUnableToFetchError`)_ |
| `testAddEsriFeatureInvalidGeometry` | test      | Test Adding 'Yukon Low head' on map...                                                        |

#### 2.1.3 Esri Image — Lifecycle

[↑ Back to top](#table-of-contents)

| Method                          | Type      | Description                                                                                 |
| ------------------------------- | --------- | ------------------------------------------------------------------------------------------- |
| `testAddEsriImageWithElevation` | test      | Test Adding Esri Image Elevation on map...                                                  |
| `testAddEsriImageWithUSA`       | test      | Test Adding Esri Image USA on map...                                                        |
| `testAddEsriImageBadUrl`        | testError | Test Adding Esri Image with bad url... _(expects `LayerServiceMetadataUnableToFetchError`)_ |

#### 2.1.4 WMS — Lifecycle

[↑ Back to top](#table-of-contents)

| Method                                           | Type      | Description                                                                          |
| ------------------------------------------------ | --------- | ------------------------------------------------------------------------------------ |
| `testAddWMSLayerWithOWSMundialis`                | test      | Test Adding WMS Mundialis on map...                                                  |
| `testAddWMSLayerWithDatacubeMSI`                 | test      | Test Adding WMS Datacube MSI on map...                                               |
| `testAddWMSLayerWithDatacubeRingOfFire`          | test      | Test Adding WMS Datacube Ring of Fire XML Halifax on map...                          |
| `testAddWMSLayerLandcoverGroupDimension`         | test      | Test Adding WMS Landcover group with a group time dimension...                       |
| `testAddWMSLayerLandcoverGroupDimensionNegative` | test      | Test Adding WMS Landcover sub-layers without a group time dimension...               |
| `testAddWMSDuplicateGroupNames`                  | test      | Test Adding WMS with duplicate nested group names on map... (issue #3521)            |
| `testAddWMSBadUrl`                               | testError | Test Adding WMS with bad url... _(expects `LayerServiceMetadataUnableToFetchError`)_ |

#### 2.1.5 WFS — Lifecycle

[↑ Back to top](#table-of-contents)

| Method                                           | Type      | Description                                                                             |
| ------------------------------------------------ | --------- | --------------------------------------------------------------------------------------- |
| `testAddWFSLayerWithWithGeometCurrentConditions` | test      | Test Adding WFS with Geomet Current Conditions layer on map...                          |
| `testAddWFSBadUrl`                               | testError | Test Adding WFS with bad url... _(expects `LayerServiceMetadataUnableToFetchError`)_    |
| `testAddWFSOkayUrlNoCap`                         | testError | Test Adding WFS with okay url no capabilities... _(expects `LayerNoCapabilitiesError`)_ |

#### 2.1.6 GeoJSON — Lifecycle

[↑ Back to top](#table-of-contents)

| Method                                 | Type      | Description                                                             |
| -------------------------------------- | --------- | ----------------------------------------------------------------------- |
| `testAddGeoJSONWithMetadataPolygons`   | test      | Test Adding GeoJSON with Metadata layer on map...                       |
| `testAddGeoJSONWithGeometryCollection` | test      | Test Adding GeoJSON GeometryCollection layer on map...                  |
| `testAddGeoJSONBadUrl`                 | testError | Test Adding GeoJSON with bad url... _(expects `LayerStatusErrorError`)_ |

#### 2.1.7 GeoTIFF — Lifecycle

[↑ Back to top](#table-of-contents)

| Method                                      | Type      | Description                                                             |
| ------------------------------------------- | --------- | ----------------------------------------------------------------------- |
| `testAddGeotiffLayerWithDatacubeVegetation` | test      | Test Adding GeoTIFF Datacube Vegetation on map...                       |
| `testAddGeoTIFFWithBadUrl`                  | testError | Test Adding GeoTIFF with bad url... _(expects `LayerStatusErrorError`)_ |

#### 2.1.8 CSV — Lifecycle

[↑ Back to top](#table-of-contents)

| Method                      | Type      | Description                                                         |
| --------------------------- | --------- | ------------------------------------------------------------------- |
| `testAddCSVWithStationList` | test      | Test Adding a CSV with Station List layer on map...                 |
| `testAddCSVWithBadUrl`      | testError | Test Adding CSV with bad url... _(expects `LayerStatusErrorError`)_ |

#### 2.1.9 OGC Feature — Lifecycle

[↑ Back to top](#table-of-contents)

| Method                          | Type      | Description                                                                                  |
| ------------------------------- | --------- | -------------------------------------------------------------------------------------------- |
| `testAddOGCFeatureWithPygeoapi` | test      | Test Adding an OGC Feature with Pygeoapi layer on map...                                     |
| `testAddOGCFeatureWithBadUrl`   | testError | Test Adding OGC Feature with bad url... _(expects `LayerServiceMetadataUnableToFetchError`)_ |

#### 2.1.10 WKB — Lifecycle

[↑ Back to top](#table-of-contents)

| Method                      | Type      | Description                                                         |
| --------------------------- | --------- | ------------------------------------------------------------------- |
| `testAddWKBWithSouthAfrica` | test      | Test Adding a WKB with South Africa layer on map...                 |
| `testAddWKBWithBadUrl`      | testError | Test Adding WKB with bad url... _(expects `LayerStatusErrorError`)_ |

#### 2.1.11 KML — Lifecycle

[↑ Back to top](#table-of-contents)

| Method                  | Type      | Description                                                         |
| ----------------------- | --------- | ------------------------------------------------------------------- |
| `testAddKMLWithTornado` | test      | Test Adding a KML with Tornado layer on map...                      |
| `testAddKMLWithBadUrl`  | testError | Test Adding KML with bad url... _(expects `LayerStatusErrorError`)_ |

#### 2.1.12 Initial Settings

[↑ Back to top](#table-of-contents)

| Method                       | Type | Description                   |
| ---------------------------- | ---- | ----------------------------- |
| `testInitialSettingsCascade` | test | Test initial settings cascade |

#### 2.1.13 Domain Fields (sequential)

[↑ Back to top](#table-of-contents)

| Method                              | Type | Description                                                         |
| ----------------------------------- | ---- | ------------------------------------------------------------------- |
| `testAddEsriDynamicWithDomainField` | test | Test Adding Esri Dynamic Water Network and checking domain field... |
| `testAddEsriFeatureWithDomainField` | test | Test Adding Esri Feature Water Network and checking domain field... |

#### 2.1.14 Domain Field Query (sequential)

[↑ Back to top](#table-of-contents)

| Method                                 | Type | Description                                                             |
| -------------------------------------- | ---- | ----------------------------------------------------------------------- |
| `testEsriDynamicDomainFieldQueryValue` | test | Test Esri Dynamic Water Network domain field query value translation... |
| `testEsriFeatureDomainFieldQueryValue` | test | Test Esri Feature Water Network domain field query value translation... |

#### 2.1.15 Group Layer Visibility

[↑ Back to top](#table-of-contents)

| Method                                | Type | Description                                                                                        |
| ------------------------------------- | ---- | -------------------------------------------------------------------------------------------------- |
| `testSetLayerVisibleIncludingParents` | test | Test hidden-by-parent child and setLayerVisibleIncludingParents parent crawl (hidden/available)... |

#### 2.1.16 ESRI Dynamic Junction Geometry Pairing

[↑ Back to top](#table-of-contents)

| Method                                   | Type | Description                                                                                                        |
| ---------------------------------------- | ---- | ------------------------------------------------------------------------------------------------------------------ |
| `testEsriDynamicJunctionGeometryPairing` | test | Test ESRI Dynamic junction: each returned feature's geometry pairs to its own OBJECTID, not a neighbour (#3636)... |

#### 2.1.17 WMS Group Layer Name Resolution

[↑ Back to top](#table-of-contents)

| Method                                        | Type | Description                                                          |
| --------------------------------------------- | ---- | -------------------------------------------------------------------- |
| `testAddWMSZpegtGroupWithSiblingLayer`        | test | Test WMS ZPEGT metadata names with a sibling layer...                |
| `testAddWMSZpegtGroupWithGeoviewLayerName`    | test | Test WMS ZPEGT group name with a configured GeoView layer name...    |
| `testAddWMSZpegtGroupWithoutGeoviewLayerName` | test | Test WMS ZPEGT group name without a configured GeoView layer name... |

---

### 2.2 Layer Functions (EPSG: 3857)

[↑ Back to top](#table-of-contents)

**Suite:** `suite-layer-functions` · **File:** `tests/suites/suite-layer-functions.ts` · **Tester:** `LayerTester` (`tests/testers/layer-tester.ts`)
**Execution:** Mixed — parallel for the duplicate-group-names test, then sequential for zoom/query tests; injection/projection tests run after all parallel work settles · **Guard:** None

> **Note:** This suite runs on a single map with EPSG: 3857, testing layer controller functions and feature-query behavior.

#### 2.2.1 Layer Path Resolution

[↑ Back to top](#table-of-contents)

| Method                          | Type | Description                                                                                                          |
| ------------------------------- | ---- | -------------------------------------------------------------------------------------------------------------------- |
| `testAddWMSDuplicateGroupNames` | test | Test WMS with duplicate nested group names loads without ambiguous paths or recursion loops (#3521)...               |
| `testGetGeoviewLayerByRootId`   | test | Test getGeoviewLayerByRootId resolves the first layer under a root id (e.g. a GeoCore UUID) for selection (#3633)... |

#### 2.2.2 Zoom To Extent (sequential)

[↑ Back to top](#table-of-contents)

| Method                                              | Type | Description                                                           |
| --------------------------------------------------- | ---- | --------------------------------------------------------------------- |
| `testZoomExtentWithOneFeature`                      | test | Test zoom to extent of a layer with only one point feature...         |
| `testZoomExtentWithoutFeatures`                     | test | Test zoom to extent of a layer without features...                    |
| `testZoomExtentWithoutFeaturesWithConfiguredExtent` | test | Test zoom to extent falls back to the configured extent when empty... |

#### 2.2.3 Feature Query (sequential)

[↑ Back to top](#table-of-contents)

| Method                                                  | Type | Description                                                                   |
| ------------------------------------------------------- | ---- | ----------------------------------------------------------------------------- |
| `testFeatureHasGeometryWhenOutfieldsHasNoGeometryField` | test | Test feature query still retrieves geometry when outfields omit geometry...   |
| `testQueryWMSLayerForWFSFeaturesCities`                 | test | Test WMS layer retrieves feature results via its associated WFS (Cities)...   |
| `testQueryWMSLayerForWFSFeaturesAirborne`               | test | Test WMS layer retrieves feature results via its associated WFS (Airborne)... |

#### 2.2.4 Layer Reload (sequential)

[↑ Back to top](#table-of-contents)

| Method                             | Type | Description                                                                                     |
| ---------------------------------- | ---- | ----------------------------------------------------------------------------------------------- |
| `testReloadLayerPreservesPosition` | test | Test reloading a layer rebuilds it from scratch and keeps it at the same layer order (#3666)... |

#### 2.2.5 GeoJSON Injection (sequential)

[↑ Back to top](#table-of-contents)

| #   | Method                                   | Type | Description                                                                         |
| --- | ---------------------------------------- | ---- | ----------------------------------------------------------------------------------- |
| 10  | `testSetGeojsonSourceReplacesFeatures`   | test | Test public GeoJSON object injection and JSON-string replacement...                 |
| 11  | `testSetGeojsonSourceReprojectsFeatures` | test | Test public GeoJSON replacement features reproject after a map projection change... |

---

#### 2.2.5 Layer Visibility (sequential)

[↑ Back to top](#table-of-contents)

| Method                            | Type | Description                                                                                             |
| --------------------------------- | ---- | ------------------------------------------------------------------------------------------------------- |
| `testSetOrToggleLayerVisibility` | test | Test explicit visibility values and no-argument toggles through `LayerApi.setOrToggleLayerVisibility` |

---

## 3. Map

[↑ Back to top](#table-of-contents)

### 3.1 Map Functions

[↑ Back to top](#table-of-contents)

**Suite:** `suite-map` · **File:** `tests/suites/suite-map-functions.ts` · **Tester:** `MapTester` (`tests/testers/map-tester.ts`)
**Execution:** Complex mixed — sequential `await` for state-modifying tests · **Guard:** None

| Method                                 | Type | Description                                                                                  |
| -------------------------------------- | ---- | -------------------------------------------------------------------------------------------- |
| `testInitialMapState`                  | test | Test projection                                                                              |
| `testMapZoom`                          | test | Test zoom                                                                                    |
| `testSwitchProjectionAndExtent`        | test | Test switch projection back and forth, zoom and zoom to initial extent                       |
| `testGeometryGroupZIndex`              | test | Test geometry group z-index get/set operations                                               |
| `testZoomToExtent`                     | test | Test zoom to lon/lat extent                                                                  |
| `testZoomToCoordinate`                 | test | Test zoom to lon/lat coordinate                                                              |
| `testFooterBarSelectTab`               | test | Test footer bar select tab                                                                   |
| `testAppBarSelectTab`                  | test | Test app bar select tab                                                                      |
| `testFooterBarCreateTab`               | test | Test footer bar create custom tab                                                            |
| `testSetLanguage`                      | test | Test set language to French                                                                  |
| `testCreateAndSetBasemap`              | test | Test create and set basemap                                                                  |
| `testNorthArrowRotationLCC`            | test | Test north arrow rotation in LCC projection for British Columbia                             |
| `testNonQueryableLayerNotInDetails`    | test | Test non-queryable layer not in details after map click                                      |
| `testLayerHoverableState`              | test | Test layer hoverable state in hoverFeatureInfoLayerSet                                       |
| `testDetailsLayerSelectionPersistence` | test | Test details layer selection persistence across map clicks                                   |
| `testVectorTileProjectionWarning`      | test | Test vector tile projection warning on projection switch                                     |
| `testFullscreenViewRestoration`        | test | Test exact view restoration without interaction and current view retention after interaction |
| `testGuideDetailsPanelTopAnchor`       | test | Test selecting the Details panel and verifying the guide’s Top anchor behavior               |
| `testControllerGetFooterHeight`        | test | Test `UIController.getFooterHeight()` from a non-React consumer                              |
| 18  | `testCrosshairCoordinates`             | test | Test SVG artwork center alignment, stale pointer reset, and Enter/Space drawing with padding, panning, and rotation |

---

### 3.2 Map Config

[↑ Back to top](#table-of-contents)

**Suite:** `suite-map-config` · **File:** `tests/suites/suite-map-config.ts` · **Testers:** `MapConfigTester` (`tests/testers/map-config-tester.ts`), `MapTester` (`tests/testers/map-tester.ts`)
**Execution:** Fully sequential (`await` each test) — each test replaces the map in the suite's existing container using `replaceMap()`, without appending maps to the runner page · **Guard:** None

#### Viewport Boundary and Fitting

These 16 executions use `MapTester` with the map-config lifecycle. Each validation group shares
one fixture across five conditions; unexpected errors propagate, and every condition must produce
its expected error. Finalizers restore the host width, map target, and usable viewport.

| Method                                                           | Type      | Description                                                                                                        |
| ---------------------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------ |
| `testFitViewportToMidpointsLonLat` (LCC, rotation disabled)      | test      | Preserves rotation while tightly fitting without animation                                                         |
| `testFitViewportToMidpointsLonLat` (Mercator, rotation disabled) | test      | Preserves rotation during animated fitting                                                                         |
| `testFitViewportToMidpointsLonLat(3978, PI/4)`                   | test      | Restores rotated LCC center, resolution, orientation, and input                                                    |
| `testFitViewportToMidpointsLonLat` (resize)                      | test      | Fits after an aspect-ratio change with asymmetric padding                                                          |
| `testFitViewportToMidpointsLonLat` (projection)                  | test      | Fits LCC samples in Web Mercator with balanced WSEN alignment                                                      |
| `testFitViewportToMidpointsLonLat` (animated antimeridian)       | test      | Restores Mercator samples while preserving unwrapped longitudes                                                    |
| `testInvalidViewportMidpoints`                                   | test      | Rejects count, non-finite, latitude, coincident, and orientation errors without changing the view                  |
| `testErrorFitViewportMidpointsCancelled`                         | testError | Rejects interrupted animated rotation                                                                              |
| `testErrorFitViewportUnavailable`                                | testError | Rejects fitting a zero-sized viewport                                                                              |
| `testViewportBoundaryLonLat(3978)`                               | test      | Checks default Canada LCC geometry, dynamic padding, and fresh snapshots                                           |
| `testViewportBoundaryLonLat(3978, PI/4)`                         | test      | Checks rotated LCC against independent geometry and CSS pixels                                                     |
| `testViewportBoundaryLonLat(3857)`                               | test      | Checks midpoint sides against corner sides in Web Mercator                                                         |
| `testViewportBoundaryLonLat(3978, 0, 'static')`                  | test      | Uses the full canvas bottom in static mode                                                                         |
| `testViewportBoundaryLonLat` (antimeridian)                      | test      | Preserves longitude beyond 180 degrees                                                                             |
| `testViewportBoundaryPaddingAndResize`                           | test      | Checks map-info height changes, four-sided padding, and resizing                                                   |
| `testViewportBoundaryUnavailable`                                | test      | Rejects zero/non-finite size, excessive/negative padding, and detached viewport; restores state between conditions |

#### 3.2.1 Footer Bar / App Bar / Nav Bar

[↑ Back to top](#table-of-contents)

| Method                                    | Type | Description                                                                                                             |
| ----------------------------------------- | ---- | ----------------------------------------------------------------------------------------------------------------------- |
| `testDataTableSelectedTabFooterBar`       | test | Test DataTable in footer bar with selectedDataTableLayerPath                                                            |
| `testDataTableSelectedTabAppBar`          | test | Test DataTable in app bar with selectedDataTableLayerPath                                                               |
| `testNoFooterBarAppBarConfigHasDefaults`  | test | Test no footerBar or app bar config creates default tabs (layers, data-table) and (geolocator, legend, details, export) |
| `testEmptyFooterBarAppBarTabsHasNoFooter` | test | Test footerBar with empty tabs array has no footer bar                                                                  |
| `testDuplicatedPanelsRemovedFromFooter`   | test | Test panels declared in both appBar and footerBar are removed from the footer bar (kept in app bar)                     |
| `testNoNavBarHasDefaults`                 | test | Test no navBar config value creates default navigation controls                                                         |
| `testEmptyNavBarHasZoomRotate`            | test | Test navBar with empty array has only zoom and rotate                                                                   |

#### 3.2.2 Initial View

[↑ Back to top](#table-of-contents)

| Method                             | Type | Description                                                     |
| ---------------------------------- | ---- | --------------------------------------------------------------- |
| `testInitialViewLayerIdsSetExtent` | test | Test initial view with layerIds sets map extent to layer extent |

#### 3.2.3 Overlay Objects

[↑ Back to top](#table-of-contents)

| Method                           | Type | Description                                       |
| -------------------------------- | ---- | ------------------------------------------------- |
| `testOverlayObjectsPointMarkers` | test | Test overlayObjects with pointMarkers are created |

#### 3.2.4 View Settings

[↑ Back to top](#table-of-contents)

| Method                                          | Type | Description                                                                                    |
| ----------------------------------------------- | ---- | ---------------------------------------------------------------------------------------------- |
| `testViewSettingsZoomConstraints`               | test | Test viewSettings minZoom and maxZoom constraints                                              |
| `testViewSettingsInitialViewVsHomeView`         | test | Test initialView sets zoom = 7, zoomToInitialExtent() changes zoom to 4 (homeView)             |
| `testViewSettingsHomeButtonNavigatesToHomeView` | test | Test zoomToInitialExtent() navigates center to homeView coordinates ≈ [-95, 60] with tolerance |

#### 3.2.5 Overview Map

[↑ Back to top](#table-of-contents)

| Method                                      | Type | Description                                                           |
| ------------------------------------------- | ---- | --------------------------------------------------------------------- |
| `testOverviewMapPresent`                    | test | Test overview map is present when configured in components            |
| `testOverviewMapAbsent`                     | test | Test overview map is absent when not in components                    |
| `testOverviewMapHideOnZoom`                 | test | Test overview map hideOnZoom hides at low zoom, shows above threshold |
| `testOverviewMapHideOnZoomWithReprojection` | test | Test overview map hideOnZoom with reprojection preserves visibility   |

#### 3.2.6 North Arrow

[↑ Back to top](#table-of-contents)

| Method                  | Type | Description                                               |
| ----------------------- | ---- | --------------------------------------------------------- |
| `testNorthArrowPresent` | test | Test north arrow is present when configured in components |
| `testNorthArrowAbsent`  | test | Test north arrow is absent when not in components         |

#### 3.2.7 Initial Settings — Controls

[↑ Back to top](#table-of-contents)

| Method                                | Type | Description                                  |
| ------------------------------------- | ---- | -------------------------------------------- |
| `testInitialSettingsControlsAllFalse` | test | Test initialSettings all controls = false... |

#### 3.2.8 Initial Settings — States

[↑ Back to top](#table-of-contents)

| Method                                   | Type | Description                                      |
| ---------------------------------------- | ---- | ------------------------------------------------ |
| `testInitialSettingsStateVisibleFalse`   | test | Test initialSettings states.visible = false...   |
| `testInitialSettingsStateOpacity`        | test | Test initialSettings states.opacity = 0.5...     |
| `testInitialSettingsStateQueryableFalse` | test | Test initialSettings states.queryable = false... |
| `testInitialSettingsStateHoverableFalse` | test | Test initialSettings states.hoverable = false... |

#### 3.2.9 Initial Settings — Opacity Cascading

[↑ Back to top](#table-of-contents)

| Method                                                   | Type | Description                                                                   |
| -------------------------------------------------------- | ---- | ----------------------------------------------------------------------------- |
| `testInitialSettingsOpacityCascadingChildCappedByParent` | test | Test opacity cascading: child (1.0) capped by parent (0.5) = effective 0.5... |
| `testInitialSettingsOpacityCascadingChildBelowParent`    | test | Test opacity cascading: child (0.3) below parent (0.5) = effective 0.3...     |
| `testInitialSettingsOpacityCascadingRuntimeParentChange` | test | Test opacity cascading: runtime parent change cascades to children...         |

#### 3.2.10 Initial Settings — Cascading (Controls & Visibility)

[↑ Back to top](#table-of-contents)

| Method                                                   | Type | Description                                                                                                      |
| -------------------------------------------------------- | ---- | ---------------------------------------------------------------------------------------------------------------- |
| `testInitialSettingsControlRemoveCascadingToDescendants` | test | Test controls.remove cascading: parent false cascades unless child explicitly overrides with true...             |
| `testInitialSettingsStateVisibleCascadingToDescendants`  | test | Test states.visible cascading: parent false hides all descendants on map, children keep visible true in store... |

#### 3.2.11 Initial Settings — Combo Tests

[↑ Back to top](#table-of-contents)

| Method                                                        | Type | Description                                                              |
| ------------------------------------------------------------- | ---- | ------------------------------------------------------------------------ |
| `testInitialSettingsComboQueryControlTrueStateQueryableFalse` | test | Test initialSettings controls.query = true + states.queryable = false... |
| `testInitialSettingsComboHoverControlTrueStateHoverableFalse` | test | Test initialSettings controls.hover = true + states.hoverable = false... |

#### 3.2.12 Initial Settings — Legend Collapsed

[↑ Back to top](#table-of-contents)

| Method                               | Type | Description                                                          |
| ------------------------------------ | ---- | -------------------------------------------------------------------- |
| `testInitialSettingsLegendCollapsed` | test | Test initialSettings states.legendCollapsed = true on group layer... |

#### 3.2.13 Initial Settings — Controls Cascading (All Controls)

[↑ Back to top](#table-of-contents)

| Method                                         | Type | Description                                                                                                                |
| ---------------------------------------------- | ---- | -------------------------------------------------------------------------------------------------------------------------- |
| `testInitialSettingsControlsCascadeToChildren` | test | Test parent controls { highlight: false, zoom: false, hover: false, query: false } cascade to children...                  |
| `testInitialSettingsControlsGroupOverride`     | test | Test group-level override: parent { highlight: false, zoom: false }, subgroup overrides { highlight: true, zoom: true }... |

#### 3.2.14 Initial Settings — Filters

[↑ Back to top](#table-of-contents)

| Method                                  | Type | Description                                                             |
| --------------------------------------- | ---- | ----------------------------------------------------------------------- |
| `testInitialSettingsFilters`            | test | Test GeoJSON layerFilter is stored and accessible after loading...      |
| `testInitialSettingsFiltersOgcFeature`  | test | Test OGC Feature layerFilter is stored and accessible after loading...  |
| `testInitialSettingsFiltersWfs`         | test | Test WFS layerFilter is stored and accessible after loading...          |
| `testInitialSettingsFiltersEsriDynamic` | test | Test Esri Dynamic layerFilter is stored and accessible after loading... |
| `testInitialSettingsFiltersEsriFeature` | test | Test Esri Feature layerFilter is stored and accessible after loading... |

#### 3.2.15 Selected Layer Path Resolution

[↑ Back to top](#table-of-contents)

| Method                                         | Type | Description                                                                                                       |
| ---------------------------------------------- | ---- | ----------------------------------------------------------------------------------------------------------------- |
| `testSelectedLayersLayerPathGeoCoreResolution` | test | Test selectedLayersLayerPath with a GeoCore UUID resolves to the first layer path (`uuid/0`) in the store (#3633) |

---

## 4. Components

[↑ Back to top](#table-of-contents)

---

### 4.1 Details

[↑ Back to top](#table-of-contents)

**Suite:** `suite-details` · **File:** `tests/suites/suite-details.ts` · **Tester:** `DetailsTester` (`tests/testers/details-tester.ts`)
**Execution:** Sequential + parallel · **Guard:** `details` must be in `footerBar.tabs.core`

| Method                       | Type | Description                                          |
| ---------------------------- | ---- | ---------------------------------------------------- |
| `testDetailsOnLayer`         | test | Test Details on layer _{layerPath}_ ...              |
| `testClearAllHighlights`     | test | Test Clear all highlights on layer _{layerPath}_ ... |
| `testZoomToFeature`          | test | Test Zoom to feature on layer _{layerPath}_ ...      |
| `testNameFieldAsLabel`       | test | Test nameField as label in query results...          |
| `testSummaryFalseHidesField` | test | Test summary false hides field from query results... |
| `testFieldAliasRenamesField` | test | Test field alias renames field in query results...   |

---

### 4.2 Data Table

[↑ Back to top](#table-of-contents)

**Suite:** `suite-data-table` · **File:** `tests/suites/suite-data-table.ts` · **Tester:** `DataTableTester` (`tests/testers/data-table-tester.ts`)
**Execution:** Sequential · **Guard:** `data-table` must be in `footerBar.tabs.core`

| Method                                             | Type | Description                                                                      |
| -------------------------------------------------- | ---- | -------------------------------------------------------------------------------- |
| `testAllFeaturesDataArrayPopulated`                | test | Test allFeaturesDataArray is populated for GeoJSON layer...                      |
| `testAllFeaturesDataArrayPopulated`                | test | Test allFeaturesDataArray is populated for the 600-feature Esri layer...         |
| `testGeoviewIdColumnHiddenByDefault`               | test | Test geoviewID column hidden by default...                                       |
| `testEmptyFieldNameDoesNotCrashDataTable`          | test | Test a layer with an empty field name renders the data table without crashing... |
| `testMapFilteredRecordDefault`                     | test | Test mapFilteredRecord is true by default...                                     |
| `testSetMapFilteredRecordFalse`                    | test | Test setting mapFilteredRecord to false...                                       |
| `testGlobalFilterRecord`                           | test | Test global filter record updates store...                                       |
| `testCitiesNameFilterCount`                        | test | Test Cities name filter for "mo" returns 30; population minimum 1,000,000 returns 6; maximum 1,750,000 returns 3... |
| `testClearFiltersResetsState`                      | test | Test clear filters resets columnFiltersRecord...                                 |
| `testColumnVisibilityToggle`                       | test | Test column visibility toggle updates store...                                  |
| `testRowsFilteredRecordCount`                      | test | Test rowsFilteredRecord updates in store...                                      |
| `testFilterByExtentUnavailableForEsriDynamic`      | test | Test filter-by-extent toggle absent for Esri Dynamic layer...                    |
| `testFilterByExtentOnGeoJSONOntario`               | test | Test filter-by-extent on GeoJSON layer (zoom to Ontario)...                     |
| `testShowUnsymbolizedFeaturesFalsePrefiltersTable` | test | Test showUnsymbolizedFeatures false pre-filters data table...                    |
| `testTemporaryZoomHighlightExpires`                | test | Test temporary zoom highlight is removed automatically...                        |

---

## 5. Packages

[↑ Back to top](#table-of-contents)

### 5.1 Geochart

[↑ Back to top](#table-of-contents)

**Suite:** `suite-geochart` · **File:** `tests/suites/suite-geochart.ts` · **Tester:** `GeochartTester` (`tests/testers/geochart-tester.ts`)
**Execution:** Sequential + parallel · **Guard:** `geochart` must be in `footerBar.tabs.core`

| Method                                       | Type | Description                              |
| -------------------------------------------- | ---- | ---------------------------------------- |
| `testGeochartOpenForLayerMapClick`           | test | Test Geochart on layer _{layerPath}_ ... |
| `testAddGeocoreLayerUUIDForGeochartAirborne` | test | Test Geochart (Geocore Airborne)         |
| `testAddGeocoreLayerUUIDForGeochart`         | test | Test Geochart (Geocore UUID)             |

---

### 5.2 Swiper

[↑ Back to top](#table-of-contents)

**Suite:** `suite-swiper` · **File:** `tests/suites/suite-swiper.ts` · **Tester:** `SwiperTester` (`tests/testers/swiper-tester.ts`)
**Execution:** Sequential · **Guard:** `swiper` must be in `corePackages` and swiper controller must exist

| Method                              | Type | Description                                                                              |
| ----------------------------------- | ---- | ---------------------------------------------------------------------------------------- |
| `testSwiperRenderIsolation`         | test | Test Swiper rendering isolation with a higher-level layer selector...                    |
| `testSwiperLifecycle`               | test | Test Swiper lifecycle: activate, deactivate, multi-layer, orientation, deactivate all... |
| `testSwiperPerLayerSides`           | test | Test Swiper per-layer side semantics...                                                  |
| `testSwiperProgressiveRegistration` | test | Test Swiper progressive layer registration...                                            |
| `testSwiperConfigPersistence`       | test | Test Swiper interactive configuration persistence...                                     |
| `testSwiperHoverSuppression`        | test | Test Swiper hover-query suppression over the bar and handle...                           |
| `testSwiperSettingsGating`          | test | Test Swiper settings-panel gating...                                                     |

---

### 5.3 Time Slider

[↑ Back to top](#table-of-contents)

**Suite:** `suite-time-slider` · **File:** `tests/suites/suite-time-slider.ts` · **Tester:** `TimeSliderTester` (`tests/testers/time-slider-tester.ts`)
**Execution:** Sequential · **Guard:** `time-slider` must be in `footerBar.tabs.core` and time-slider controller must exist

| Method                                     | Type | Description                                                                                      |
| ------------------------------------------ | ---- | ------------------------------------------------------------------------------------------------ |
| `testResetValues`                          | test | Test Time Slider reset restores registered default values...                                     |
| `testConstrainValues`                      | test | Test Time Slider prevents dual-handle overlap for discrete and continuous ranges...              |
| `testWMSLayerLandcoverGroupDimensionFlags` | test | Test WMS Landcover group dimension flags are set in the store on the group and its sub-layers... |
