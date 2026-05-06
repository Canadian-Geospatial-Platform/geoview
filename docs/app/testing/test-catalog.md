# Test Catalog

> **Auto-maintained** — This file must be updated each time a test is added, removed, or renamed in the `geoview-test-suite` package.

This catalog lists every test in the GeoView test suite, organized by suite and tester. Each entry shows the test method name, type (`test` for happy-path, `testError` for true-negative), and the runtime description string.

---

## Table of Contents

- [1. Suite: `suite-config` — Config Validation](#1-suite-suite-config--config-validation)
  - [1.1 Esri Dynamic](#11-esri-dynamic)
  - [1.2 Esri Feature](#12-esri-feature)
  - [1.3 Esri Image](#13-esri-image)
  - [1.4 WMS](#14-wms)
  - [1.5 WFS](#15-wfs)
  - [1.6 GeoJSON](#16-geojson)
  - [1.7 CSV](#17-csv)
  - [1.8 OGC Feature](#18-ogc-feature)
  - [1.9 WKB](#19-wkb)
  - [1.10 KML](#110-kml)
  - [1.11 GeoTIFF](#111-geotiff)
  - [1.12 Geocore](#112-geocore)
  - [1.13 Settings Cascade](#113-settings-cascade)
- [2. Suite: `suite-core` — Core Framework](#2-suite-suite-core--core-framework)
- [3. Suite: `suite-utilities` — Utility Functions](#3-suite-suite-utilities--utility-functions)
  - [3.1 UtilitiesCoreTester](#31-utilitiescoretester)
  - [3.2 UtilitiesDateTester](#32-utilitiesdatetester)
  - [3.3 UtilitiesGeoTester](#33-utilitiesgeotester)
  - [3.4 UtilitiesProjectionTester](#34-utilitiesprojectiontester)
- [4. Suite: `suite-layer` — Layer Lifecycle](#4-suite-suite-layer--layer-lifecycle)
  - [4.1 Esri Dynamic — Lifecycle](#41-esri-dynamic--lifecycle)
  - [4.2 Esri Feature — Lifecycle](#42-esri-feature--lifecycle)
  - [4.3 Esri Image — Lifecycle](#43-esri-image--lifecycle)
  - [4.4 WMS — Lifecycle](#44-wms--lifecycle)
  - [4.5 WFS — Lifecycle](#45-wfs--lifecycle)
  - [4.6 GeoJSON — Lifecycle](#46-geojson--lifecycle)
  - [4.7 GeoTIFF — Lifecycle](#47-geotiff--lifecycle)
  - [4.8 CSV — Lifecycle](#48-csv--lifecycle)
  - [4.9 OGC Feature — Lifecycle](#49-ogc-feature--lifecycle)
  - [4.10 WKB — Lifecycle](#410-wkb--lifecycle)
  - [4.11 KML — Lifecycle](#411-kml--lifecycle)
  - [4.12 Initial Settings](#412-initial-settings)
  - [4.13 Domain Fields (sequential)](#413-domain-fields-sequential)
  - [4.14 Domain Field Query (sequential)](#414-domain-field-query-sequential)
- [5. Suite: `suite-map-varia` — Map Interactions](#5-suite-suite-map-varia--map-interactions)
- [6. Suite: `suite-map-config` — Map Config Overrides](#6-suite-suite-map-config--map-config-overrides)
  - [6.1 Footer Bar / App Bar / Nav Bar](#61-footer-bar--app-bar--nav-bar)
  - [6.2 Initial View](#62-initial-view)
  - [6.3 Overlay Objects](#63-overlay-objects)
  - [6.4 View Settings](#64-view-settings)
  - [6.5 Overview Map](#65-overview-map)
  - [6.6 Initial Settings — Controls](#66-initial-settings--controls)
  - [6.7 Initial Settings — States](#67-initial-settings--states)
  - [6.8 Initial Settings — Opacity Cascading](#68-initial-settings--opacity-cascading)
  - [6.9 Initial Settings — Cascading (Controls & Visibility)](#69-initial-settings--cascading-controls--visibility)
  - [6.10 Initial Settings — Combo Tests](#610-initial-settings--combo-tests)
- [7. Suite: `suite-details` — Details Panel](#7-suite-suite-details--details-panel)
- [8. Suite: `suite-geochart` — Geochart Plugin](#8-suite-suite-geochart--geochart-plugin)
- [9. Suite: `suite-swiper` — Swiper Plugin](#9-suite-suite-swiper--swiper-plugin)
- [10. Suite: `suite-ui` — UI / DOM](#10-suite-suite-ui--ui--dom)
- [Summary](#summary)

---

### Summary

| Suite              | Tester(s)                                                                                       | Test Count | Execution                   |
| ------------------ | ----------------------------------------------------------------------------------------------- | ---------- | --------------------------- |
| `suite-config`     | `ConfigTester`                                                                                  | 33         | Parallel                    |
| `suite-core`       | `CoreTester`                                                                                    | 8          | Parallel                    |
| `suite-utilities`  | `UtilitiesCoreTester`, `UtilitiesDateTester`, `UtilitiesGeoTester`, `UtilitiesProjectionTester` | 49         | Parallel                    |
| `suite-layer`      | `LayerTester`                                                                                   | 34         | Mixed parallel + sequential |
| `suite-map-varia`  | `MapTester`                                                                                     | 15         | Complex mixed               |
| `suite-map-config` | `MapConfigTester`                                                                               | 25         | Fully sequential            |
| `suite-details`    | `DetailsTester`                                                                                 | 1          | Guarded sequential          |
| `suite-geochart`   | `GeochartTester`                                                                                | 3          | Guarded sequential          |
| `suite-swiper`     | `SwiperTester`                                                                                  | 1          | Guarded                     |
| `suite-ui`         | `UITester`                                                                                      | 1          | Parallel                    |
| **Total**          |                                                                                                 | **170**    |                             |

---

## 1. Suite: `suite-config` — Config Validation

[↑ Back to top](#table-of-contents)

**File:** `tests/suites/suite-config.ts` · **Tester:** `ConfigTester` (`tests/testers/config-tester.ts`)
**Execution:** Fully parallel (`Promise.all`) · **Guard:** None

### 1.1 Esri Dynamic

[↑ Back to top](#table-of-contents)

| #   | Method                                     | Type      | Description                                                                                       |
| --- | ------------------------------------------ | --------- | ------------------------------------------------------------------------------------------------- |
| 1   | `testEsriDynamicWithHistoricalFloodEvents` | test      | Test an Esri Dynamic with Historical Flood Events                                                 |
| 2   | `testEsriDynamicWithCESI`                  | test      | Test an Esri Dynamic with CESI                                                                    |
| 3   | `testEsriDynamicBadUrl`                    | testError | Test an EsriDynamic config with a bad url... _(expects `LayerServiceMetadataUnableToFetchError`)_ |

### 1.2 Esri Feature

[↑ Back to top](#table-of-contents)

| #   | Method                                     | Type      | Description                                                                                       |
| --- | ------------------------------------------ | --------- | ------------------------------------------------------------------------------------------------- |
| 4   | `testEsriFeatureWithTorontoNeighbourhoods` | test      | Test an Esri Feature with Toronto Neighbourhoods                                                  |
| 5   | `testEsriFeatureWithHistoricalFloodEvents` | test      | Test an Esri Feature with Historical Flood Events                                                 |
| 6   | `testEsriFeatureWithForestIndustry`        | test      | Test an Esri Feature with Forest Industry                                                         |
| 7   | `testEsriFeatureBadUrl`                    | testError | Test an EsriFeature config with a bad url... _(expects `LayerServiceMetadataUnableToFetchError`)_ |

### 1.3 Esri Image

[↑ Back to top](#table-of-contents)

| #   | Method                       | Type      | Description                                                                                     |
| --- | ---------------------------- | --------- | ----------------------------------------------------------------------------------------------- |
| 8   | `testEsriImageWithElevation` | test      | Test an Esri Image with Elevation                                                               |
| 9   | `testEsriImageBadUrl`        | testError | Test an EsriImage config with a bad url... _(expects `LayerServiceMetadataUnableToFetchError`)_ |

### 1.4 WMS

[↑ Back to top](#table-of-contents)

| #   | Method                                        | Type      | Description                                                                              |
| --- | --------------------------------------------- | --------- | ---------------------------------------------------------------------------------------- |
| 10  | `testWMSLayerWithOWSMundialis`                | test      | Test a WMS with OWS Mundialis                                                            |
| 11  | `testWMSLayerWithOWSMundialisNoFullSubLayers` | test      | Test a WMS with OWS Mundialis no full sub layers                                         |
| 12  | `testWMSLayerWithDatacubeMSI`                 | test      | Test a WMS with Datacube MSI                                                             |
| 13  | `testWMSLayerWithDatacubeMSINoFullSubLayers`  | test      | Test a WMS with Datacube MSI                                                             |
| 14  | `testWMSBadUrl`                               | testError | Test a WMS config with a bad url... _(expects `LayerServiceMetadataUnableToFetchError`)_ |

### 1.5 WFS

[↑ Back to top](#table-of-contents)

| #   | Method                                    | Type      | Description                                                                                     |
| --- | ----------------------------------------- | --------- | ----------------------------------------------------------------------------------------------- |
| 15  | `testWFSLayerWithGeometCurrentConditions` | test      | Test a WFS with Geomet Current Conditions                                                       |
| 16  | `testWFSBadUrl`                           | testError | Test a WFS config with a bad url... _(expects `LayerServiceMetadataUnableToFetchError`)_        |
| 17  | `testWFSOkayUrlNoCap`                     | testError | Test a WFS config with a okay url but no capabilities... _(expects `LayerNoCapabilitiesError`)_ |

### 1.6 GeoJSON

[↑ Back to top](#table-of-contents)

| #   | Method                              | Type      | Description                                                                                                   |
| --- | ----------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------- |
| 18  | `testGeojsonWithMetadataMeta`       | test      | Test a Geojson with metadata.meta file                                                                        |
| 19  | `testGeojsonWithGeometryCollection` | test      | Test a Geojson with GeometryCollection sample file                                                            |
| 20  | `testGeoJSONBadUrlExpectSkip`       | test      | Test a GeoJSON config with a bad url expecting a skip...                                                      |
| 21  | `testGeoJSONBadUrlExpectError`      | testError | Test a GeoJSON config with a bad url expecting a fail... _(expects `LayerServiceMetadataUnableToFetchError`)_ |

### 1.7 CSV

[↑ Back to top](#table-of-contents)

| #   | Method                    | Type | Description                                          |
| --- | ------------------------- | ---- | ---------------------------------------------------- |
| 22  | `testCSVWithStationList`  | test | Test a CSV with CSV file                             |
| 23  | `testCSVBadUrlExpectSkip` | test | Test a CSV config with a bad url expecting a skip... |

### 1.8 OGC Feature

[↑ Back to top](#table-of-contents)

| #   | Method                       | Type      | Description                                                                                       |
| --- | ---------------------------- | --------- | ------------------------------------------------------------------------------------------------- |
| 24  | `testOGCFeatureWithPygeoapi` | test      | Test an OGC Feature with Pygeoapi                                                                 |
| 25  | `testOGCFeatureBadUrl`       | testError | Test an OGC Feature config with a bad url... _(expects `LayerServiceMetadataUnableToFetchError`)_ |

### 1.9 WKB

[↑ Back to top](#table-of-contents)

| #   | Method                    | Type      | Description                                                                              |
| --- | ------------------------- | --------- | ---------------------------------------------------------------------------------------- |
| 26  | `testWKBWithSouthAfrica`  | test      | Test a WKB with South Africa                                                             |
| 27  | `testWKBBadUrlExpectFail` | testError | Test a WKB config with a bad url... _(expects `LayerServiceMetadataUnableToFetchError`)_ |

### 1.10 KML

[↑ Back to top](#table-of-contents)

| #   | Method                    | Type | Description                                          |
| --- | ------------------------- | ---- | ---------------------------------------------------- |
| 28  | `testKMLWithTornado`      | test | Test a KML with Tornado file                         |
| 29  | `testKMLBadUrlExpectSkip` | test | Test a KML config with a bad url expecting a skip... |

### 1.11 GeoTIFF

[↑ Back to top](#table-of-contents)

| #   | Method                        | Type | Description                                              |
| --- | ----------------------------- | ---- | -------------------------------------------------------- |
| 30  | `testGeoTIFFWithVegetation`   | test | Test a GeoTIFF with Vegetation                           |
| 31  | `testGeoTIFFBadUrlExpectSkip` | test | Test a GeoTIFF config with a bad url expecting a skip... |

### 1.12 Geocore

[↑ Back to top](#table-of-contents)

| #   | Method                              | Type | Description                |
| --- | ----------------------------------- | ---- | -------------------------- |
| 32  | `testStandaloneGeocoreWithAirborne` | test | Test Geocore with Airborne |

### 1.13 Settings Cascade

[↑ Back to top](#table-of-contents)

| #   | Method                           | Type | Description                        |
| --- | -------------------------------- | ---- | ---------------------------------- |
| 33  | `testSettingsCascadeToSublayers` | test | Test Settings Cascade to Sublayers |

---

## 2. Suite: `suite-core` — Core Framework

[↑ Back to top](#table-of-contents)

**File:** `tests/suites/suite-core.ts` · **Tester:** `CoreTester` (`tests/testers/core-tester.ts`)
**Execution:** Fully parallel (`Promise.all`) · **Guard:** None

| #   | Method                               | Type | Description                                           |
| --- | ------------------------------------ | ---- | ----------------------------------------------------- |
| 1   | `testValidateAndPingUrlReachable`    | test | Test validateAndPingUrl with a valid reachable URL... |
| 2   | `testValidateAndPingUrlInvalid`      | test | Test validateAndPingUrl with an invalid URL format... |
| 3   | `testValidateAndPingUrlUnreachable`  | test | Test validateAndPingUrl with an unreachable URL...    |
| 4   | `testValidateAndPingUrlWMS`          | test | Test validateAndPingUrl with a WMS service URL...     |
| 5   | `testGeometryCollectionLegendStyles` | test | Test GeometryCollection legend style generation...    |
| 6   | `testDatesFromEpoch`                 | test | Test Dates from Epoch Timestamps and Dates...         |
| 7   | `testDatesFromUS`                    | test | Test Dates from US Standards...                       |
| 8   | `testDatesFromCustom`                | test | Test Dates from Custom Formats...                     |

---

## 3. Suite: `suite-utilities` — Utility Functions

[↑ Back to top](#table-of-contents)

**File:** `tests/suites/suite-utilities.ts` · **Guard:** None
**Execution:** Fully parallel (`Promise.all`)

### 3.1 UtilitiesCoreTester

[↑ Back to top](#table-of-contents)

**File:** `tests/testers/utilities-core-tester.ts`

| #   | Method                            | Type | Description                                                    |
| --- | --------------------------------- | ---- | -------------------------------------------------------------- |
| 1   | `testRange`                       | test | Test range() generates correct sequences...                    |
| 2   | `testCamelCase`                   | test | Test camelCase() converts strings...                           |
| 3   | `testDeepEqual`                   | test | Test deepEqual() compares values...                            |
| 4   | `testDeepClone`                   | test | Test deepClone() creates independent copies...                 |
| 5   | `testDeepMerge`                   | test | Test deepMerge() merges objects...                             |
| 6   | `testShallowEquals`               | test | Test shallowObjectEqual() and shallowArrayEqual()...           |
| 7   | `testIsNumeric`                   | test | Test isNumeric() validates numeric strings...                  |
| 8   | `testIsObjectEmpty`               | test | Test isObjectEmpty() checks empty objects...                   |
| 9   | `testGenerateIdAndIsValidUUID`    | test | Test generateId() and isValidUUID()...                         |
| 10  | `testSetAlphaColor`               | test | Test setAlphaColor() modifies alpha channel...                 |
| 11  | `testIsJsonString`                | test | Test isJsonString() validates JSON strings...                  |
| 12  | `testJsonParsing`                 | test | Test removeCommentsFromJSON() and parseJSONConfig()...         |
| 13  | `testEscapeRegExp`                | test | Test escapeRegExp() escapes regex characters...                |
| 14  | `testIsImage`                     | test | Test isImage() detects image URLs...                           |
| 15  | `testStringify`                   | test | Test stringify() handles null/undefined/values...              |
| 16  | `testSafeStringify`               | test | Test safeStringify() handles circular references...            |
| 17  | `testDeepMergeObjects`            | test | Test deepMergeObjects() merges multiple objects...             |
| 18  | `testFindPropertyByRegexPath`     | test | Test findPropertyByRegexPath() finds nested properties...      |
| 19  | `testFormatMeasurements`          | test | Test formatMeasurementValue(), formatLength(), formatArea()... |
| 20  | `testNormalizeDatacubeAccessPath` | test | Test normalizeDatacubeAccessPath() transforms URLs...          |
| 21  | `testSanitizeHtmlContent`         | test | Test sanitizeHtmlContent() strips dangerous HTML...            |
| 22  | `testEnhanceLinksAccessibility`   | test | Test enhanceLinksAccessibility() adds screen reader text...    |
| 23  | `testGetLocalizedMessage`         | test | Test getLocalizedMessage() returns translated strings...       |

### 3.2 UtilitiesDateTester

[↑ Back to top](#table-of-contents)

**File:** `tests/testers/utilities-date-tester.ts`

| #   | Method                      | Type | Description                                               |
| --- | --------------------------- | ---- | --------------------------------------------------------- |
| 1   | `testFormatDate`            | test | Test DateMgt.formatDate() formats dates...                |
| 2   | `testFormatDateISOShort`    | test | Test DateMgt.formatDateISOShort() returns short ISO...    |
| 3   | `testConvertToMilliseconds` | test | Test DateMgt.convertToMilliseconds() converts to epoch... |
| 4   | `testTryParseDate`          | test | Test DateMgt.tryParseDate() parses valid dates...         |
| 5   | `testHasTimeComponents`     | test | Test DateMgt.hasTimeComponents() detects time tokens...   |
| 6   | `testIsValidTimezone`       | test | Test DateMgt.isValidTimezone() validates timezones...     |
| 7   | `testCreateRangeOGC`        | test | Test DateMgt.createRangeOGC() parses OGC time values...   |
| 8   | `testDateConstants`         | test | Test DateMgt static constants are defined...              |
| 9   | `testParseDateToDayjs`      | test | Test DateMgt.parseDateToDayjs() parses date inputs...     |

### 3.3 UtilitiesGeoTester

[↑ Back to top](#table-of-contents)

**File:** `tests/testers/utilities-geo-tester.ts`

| #   | Method                        | Type | Description                                                        |
| --- | ----------------------------- | ---- | ------------------------------------------------------------------ |
| 1   | `testGetBaseUrl`              | test | Test GeoUtilities.getBaseUrl() extracts base URL...                |
| 2   | `testGetMapServerUrl`         | test | Test GeoUtilities.getMapServerUrl() truncates at MapServer...      |
| 3   | `testCoordFormatDMS`          | test | Test GeoUtilities.coordFormatDMS() converts decimal degrees...     |
| 4   | `testIsPointInExtent`         | test | Test GeoUtilities.isPointInExtent() checks containment...          |
| 5   | `testGetExtentUnion`          | test | Test GeoUtilities.getExtentUnion() computes union...               |
| 6   | `testIsExtentLonLat`          | test | Test GeoUtilities.isExtentLonLat() validates lon/lat...            |
| 7   | `testBufferExtent`            | test | Test GeoUtilities.bufferExtent() expands extent...                 |
| 8   | `testIsGeoJSONObject`         | test | Test GeoUtilities.isGeoJSONObject() detects GeoJSON...             |
| 9   | `testGeometryTypeConversions` | test | Test geometry type conversions...                                  |
| 10  | `testEnsureServiceRequestUrl` | test | Test GeoUtilities.ensureServiceRequestUrl() normalizes params...   |
| 11  | `testGetExtentIntersection`   | test | Test GeoUtilities.getExtentIntersection() computes intersection... |

### 3.4 UtilitiesProjectionTester

[↑ Back to top](#table-of-contents)

**File:** `tests/testers/utilities-projection-tester.ts`

| #   | Method                        | Type | Description                                                       |
| --- | ----------------------------- | ---- | ----------------------------------------------------------------- |
| 1   | `testProjectionNames`         | test | Test Projection.PROJECTION_NAMES contains expected entries...     |
| 2   | `testReadEPSGNumber`          | test | Test Projection.readEPSGNumber() extracts EPSG codes...           |
| 3   | `testGetProjectionLonLat`     | test | Test Projection.getProjectionLonLat() returns EPSG:4326...        |
| 4   | `testTransformPoints`         | test | Test Projection.transformPoints() transforms coordinates...       |
| 5   | `testTransformExtentFromProj` | test | Test Projection.transformExtentFromProj() transforms extents...   |
| 6   | `testGetProjectionFromString` | test | Test Projection.getProjectionFromString() resolves projections... |

---

## 4. Suite: `suite-layer` — Layer Lifecycle

[↑ Back to top](#table-of-contents)

**File:** `tests/suites/suite-layer.ts` · **Tester:** `LayerTester` (`tests/testers/layer-tester.ts`)
**Execution:** Mixed — parallel for add/remove tests, then sequential for query tests (they change zoom level) · **Guard:** None

### 4.1 Esri Dynamic — Lifecycle

[↑ Back to top](#table-of-contents)

| #   | Method                                         | Type      | Description                                                                                   |
| --- | ---------------------------------------------- | --------- | --------------------------------------------------------------------------------------------- |
| 1   | `testAddEsriDynamicHistoFloodEvents`           | test      | Test Adding Esri Dynamic Histo Flood Events on map...                                         |
| 2   | `testAddEsriDynamicWithRasterLayersViaGeocore` | test      | Test Adding Esri Dynamic with Raster Layers via Geocore...                                    |
| 3   | `testAddEsriDynamicBadUrl`                     | testError | Test Adding Esri Dynamic with bad url... _(expects `LayerServiceMetadataUnableToFetchError`)_ |

### 4.2 Esri Feature — Lifecycle

[↑ Back to top](#table-of-contents)

| #   | Method                              | Type      | Description                                                                                   |
| --- | ----------------------------------- | --------- | --------------------------------------------------------------------------------------------- |
| 4   | `testAddEsriFeatureForestIndustry`  | test      | Test Adding Esri Feature Forest Industry on map...                                            |
| 5   | `testAddEsriFeatureBadUrl`          | testError | Test Adding Esri Feature with bad url... _(expects `LayerServiceMetadataUnableToFetchError`)_ |
| 6   | `testAddEsriFeatureInvalidGeometry` | test      | Test Adding 'Yukon Low head' on map...                                                        |

### 4.3 Esri Image — Lifecycle

[↑ Back to top](#table-of-contents)

| #   | Method                          | Type      | Description                                                                                 |
| --- | ------------------------------- | --------- | ------------------------------------------------------------------------------------------- |
| 7   | `testAddEsriImageWithElevation` | test      | Test Adding Esri Image Elevation on map...                                                  |
| 8   | `testAddEsriImageWithUSA`       | test      | Test Adding Esri Image USA on map...                                                        |
| 9   | `testAddEsriImageBadUrl`        | testError | Test Adding Esri Image with bad url... _(expects `LayerServiceMetadataUnableToFetchError`)_ |

### 4.4 WMS — Lifecycle

[↑ Back to top](#table-of-contents)

| #   | Method                                  | Type      | Description                                                                          |
| --- | --------------------------------------- | --------- | ------------------------------------------------------------------------------------ |
| 10  | `testAddWMSLayerWithOWSMundialis`       | test      | Test Adding WMS Mundialis on map...                                                  |
| 11  | `testAddWMSLayerWithDatacubeMSI`        | test      | Test Adding WMS Datacube MSI on map...                                               |
| 12  | `testAddWMSLayerWithDatacubeRingOfFire` | test      | Test Adding WMS Datacube Ring of Fire XML Halifax on map...                          |
| 13  | `testAddWMSBadUrl`                      | testError | Test Adding WMS with bad url... _(expects `LayerServiceMetadataUnableToFetchError`)_ |

### 4.5 WFS — Lifecycle

[↑ Back to top](#table-of-contents)

| #   | Method                                           | Type      | Description                                                                             |
| --- | ------------------------------------------------ | --------- | --------------------------------------------------------------------------------------- |
| 14  | `testAddWFSLayerWithWithGeometCurrentConditions` | test      | Test Adding WFS with Geomet Current Conditions layer on map...                          |
| 15  | `testAddWFSBadUrl`                               | testError | Test Adding WFS with bad url... _(expects `LayerServiceMetadataUnableToFetchError`)_    |
| 16  | `testAddWFSOkayUrlNoCap`                         | testError | Test Adding WFS with okay url no capabilities... _(expects `LayerNoCapabilitiesError`)_ |

### 4.6 GeoJSON — Lifecycle

[↑ Back to top](#table-of-contents)

| #   | Method                                 | Type      | Description                                                             |
| --- | -------------------------------------- | --------- | ----------------------------------------------------------------------- |
| 17  | `testAddGeoJSONWithMetadataPolygons`   | test      | Test Adding GeoJSON with Metadata layer on map...                       |
| 18  | `testAddGeoJSONWithGeometryCollection` | test      | Test Adding GeoJSON GeometryCollection layer on map...                  |
| 19  | `testAddGeoJSONBadUrl`                 | testError | Test Adding GeoJSON with bad url... _(expects `LayerStatusErrorError`)_ |

### 4.7 GeoTIFF — Lifecycle

[↑ Back to top](#table-of-contents)

| #   | Method                                      | Type      | Description                                                             |
| --- | ------------------------------------------- | --------- | ----------------------------------------------------------------------- |
| 20  | `testAddGeotiffLayerWithDatacubeVegetation` | test      | Test Adding GeoTIFF Datacube Vegetation on map...                       |
| 21  | `testAddGeoTIFFWithBadUrl`                  | testError | Test Adding GeoTIFF with bad url... _(expects `LayerStatusErrorError`)_ |

### 4.8 CSV — Lifecycle

[↑ Back to top](#table-of-contents)

| #   | Method                      | Type      | Description                                                         |
| --- | --------------------------- | --------- | ------------------------------------------------------------------- |
| 22  | `testAddCSVWithStationList` | test      | Test Adding a CSV with Station List layer on map...                 |
| 23  | `testAddCSVWithBadUrl`      | testError | Test Adding CSV with bad url... _(expects `LayerStatusErrorError`)_ |

### 4.9 OGC Feature — Lifecycle

[↑ Back to top](#table-of-contents)

| #   | Method                          | Type      | Description                                                                                  |
| --- | ------------------------------- | --------- | -------------------------------------------------------------------------------------------- |
| 24  | `testAddOGCFeatureWithPygeoapi` | test      | Test Adding an OGC Feature with Pygeoapi layer on map...                                     |
| 25  | `testAddOGCFeatureWithBadUrl`   | testError | Test Adding OGC Feature with bad url... _(expects `LayerServiceMetadataUnableToFetchError`)_ |

### 4.10 WKB — Lifecycle

[↑ Back to top](#table-of-contents)

| #   | Method                      | Type      | Description                                                         |
| --- | --------------------------- | --------- | ------------------------------------------------------------------- |
| 26  | `testAddWKBWithSouthAfrica` | test      | Test Adding a WKB with South Africa layer on map...                 |
| 27  | `testAddWKBWithBadUrl`      | testError | Test Adding WKB with bad url... _(expects `LayerStatusErrorError`)_ |

### 4.11 KML — Lifecycle

[↑ Back to top](#table-of-contents)

| #   | Method                  | Type      | Description                                                         |
| --- | ----------------------- | --------- | ------------------------------------------------------------------- |
| 28  | `testAddKMLWithTornado` | test      | Test Adding a KML with Tornado layer on map...                      |
| 29  | `testAddKMLWithBadUrl`  | testError | Test Adding KML with bad url... _(expects `LayerStatusErrorError`)_ |

### 4.12 Initial Settings

[↑ Back to top](#table-of-contents)

| #   | Method                       | Type | Description                   |
| --- | ---------------------------- | ---- | ----------------------------- |
| 30  | `testInitialSettingsCascade` | test | Test initial settings cascade |

### 4.13 Domain Fields (sequential)

[↑ Back to top](#table-of-contents)

| #   | Method                              | Type | Description                                                         |
| --- | ----------------------------------- | ---- | ------------------------------------------------------------------- |
| 31  | `testAddEsriDynamicWithDomainField` | test | Test Adding Esri Dynamic Water Network and checking domain field... |
| 32  | `testAddEsriFeatureWithDomainField` | test | Test Adding Esri Feature Water Network and checking domain field... |

### 4.14 Domain Field Query (sequential)

[↑ Back to top](#table-of-contents)

| #   | Method                                 | Type | Description                                                             |
| --- | -------------------------------------- | ---- | ----------------------------------------------------------------------- |
| 33  | `testEsriDynamicDomainFieldQueryValue` | test | Test Esri Dynamic Water Network domain field query value translation... |
| 34  | `testEsriFeatureDomainFieldQueryValue` | test | Test Esri Feature Water Network domain field query value translation... |

---

## 5. Suite: `suite-map-varia` — Map Interactions

[↑ Back to top](#table-of-contents)

**File:** `tests/suites/suite-map-varia.ts` · **Tester:** `MapTester` (`tests/testers/map-tester.ts`)
**Execution:** Complex mixed — sequential `await` for state-modifying tests · **Guard:** None

| #   | Method                                 | Type | Description                                                            |
| --- | -------------------------------------- | ---- | ---------------------------------------------------------------------- |
| 1   | `testInitialMapState`                  | test | Test projection                                                        |
| 2   | `testMapZoom`                          | test | Test zoom                                                              |
| 3   | `testSwitchProjectionAndExtent`        | test | Test switch projection back and forth, zoom and zoom to initial extent |
| 4   | `testGeometryGroupZIndex`              | test | Test geometry group z-index get/set operations                         |
| 5   | `testZoomToExtent`                     | test | Test zoom to lon/lat extent                                            |
| 6   | `testZoomToCoordinate`                 | test | Test zoom to lon/lat coordinate                                        |
| 7   | `testFooterBarSelectTab`               | test | Test footer bar select tab                                             |
| 8   | `testAppBarSelectTab`                  | test | Test app bar select tab                                                |
| 9   | `testFooterBarCreateTab`               | test | Test footer bar create custom tab                                      |
| 10  | `testSetLanguage`                      | test | Test set language to French                                            |
| 11  | `testCreateAndSetBasemap`              | test | Test create and set basemap                                            |
| 12  | `testNorthArrowRotationLCC`            | test | Test north arrow rotation in LCC projection for British Columbia       |
| 13  | `testNonQueryableLayerNotInDetails`    | test | Test non-queryable layer not in details after map click                |
| 14  | `testLayerHoverableState`              | test | Test layer hoverable state in hoverFeatureInfoLayerSet                 |
| 15  | `testDetailsLayerSelectionPersistence` | test | Test details layer selection persistence across map clicks             |

---

## 6. Suite: `suite-map-config` — Map Config Overrides

[↑ Back to top](#table-of-contents)

**File:** `tests/suites/suite-map-config.ts` · **Tester:** `MapConfigTester` (`tests/testers/map-config-tester.ts`)
**Execution:** Fully sequential (`await` each test) — each test creates/destroys a fresh map · **Guard:** None

### 6.1 Footer Bar / App Bar / Nav Bar

[↑ Back to top](#table-of-contents)

| #   | Method                                    | Type | Description                                                                                                             |
| --- | ----------------------------------------- | ---- | ----------------------------------------------------------------------------------------------------------------------- |
| 1   | `testDataTableSelectedTabFooterBar`       | test | Test DataTable in footer bar with selectedDataTableLayerPath                                                            |
| 2   | `testDataTableSelectedTabAppBar`          | test | Test DataTable in app bar with selectedDataTableLayerPath                                                               |
| 3   | `testNoFooterBarAppBarConfigHasDefaults`  | test | Test no footerBar or app bar config creates default tabs (layers, data-table) and (geolocator, legend, details, export) |
| 4   | `testEmptyFooterBarAppBarTabsHasNoFooter` | test | Test footerBar with empty tabs array has no footer bar                                                                  |
| 5   | `testNoNavBarHasDefaults`                 | test | Test no navBar config value creates default navigation controls                                                         |
| 6   | `testEmptyNavBarHasZoomRotate`            | test | Test navBar with empty array has only zoom and rotate                                                                   |

### 6.2 Initial View

[↑ Back to top](#table-of-contents)

| #   | Method                             | Type | Description                                                     |
| --- | ---------------------------------- | ---- | --------------------------------------------------------------- |
| 7   | `testInitialViewLayerIdsSetExtent` | test | Test initial view with layerIds sets map extent to layer extent |

### 6.3 Overlay Objects

[↑ Back to top](#table-of-contents)

| #   | Method                           | Type | Description                                       |
| --- | -------------------------------- | ---- | ------------------------------------------------- |
| 8   | `testOverlayObjectsPointMarkers` | test | Test overlayObjects with pointMarkers are created |

### 6.4 View Settings

[↑ Back to top](#table-of-contents)

| #   | Method                            | Type | Description                                       |
| --- | --------------------------------- | ---- | ------------------------------------------------- |
| 9   | `testViewSettingsZoomConstraints` | test | Test viewSettings minZoom and maxZoom constraints |

### 6.5 Overview Map

[↑ Back to top](#table-of-contents)

| #   | Method                                      | Type | Description                                                           |
| --- | ------------------------------------------- | ---- | --------------------------------------------------------------------- |
| 10  | `testOverviewMapPresent`                    | test | Test overview map is present when configured in components            |
| 11  | `testOverviewMapAbsent`                     | test | Test overview map is absent when not in components                    |
| 12  | `testOverviewMapHideOnZoom`                 | test | Test overview map hideOnZoom hides at low zoom, shows above threshold |
| 13  | `testOverviewMapHideOnZoomWithReprojection` | test | Test overview map hideOnZoom with reprojection preserves visibility   |

### 6.6 Initial Settings — Controls

[↑ Back to top](#table-of-contents)

| #   | Method                                | Type | Description                                  |
| --- | ------------------------------------- | ---- | -------------------------------------------- |
| 14  | `testInitialSettingsControlsAllFalse` | test | Test initialSettings all controls = false... |

### 6.7 Initial Settings — States

[↑ Back to top](#table-of-contents)

| #   | Method                                   | Type | Description                                      |
| --- | ---------------------------------------- | ---- | ------------------------------------------------ |
| 15  | `testInitialSettingsStateVisibleFalse`   | test | Test initialSettings states.visible = false...   |
| 16  | `testInitialSettingsStateOpacity`        | test | Test initialSettings states.opacity = 0.5...     |
| 17  | `testInitialSettingsStateQueryableFalse` | test | Test initialSettings states.queryable = false... |
| 18  | `testInitialSettingsStateHoverableFalse` | test | Test initialSettings states.hoverable = false... |

### 6.8 Initial Settings — Opacity Cascading

[↑ Back to top](#table-of-contents)

| #   | Method                                                   | Type | Description                                                                   |
| --- | -------------------------------------------------------- | ---- | ----------------------------------------------------------------------------- |
| 19  | `testInitialSettingsOpacityCascadingChildCappedByParent` | test | Test opacity cascading: child (1.0) capped by parent (0.5) = effective 0.5... |
| 20  | `testInitialSettingsOpacityCascadingChildBelowParent`    | test | Test opacity cascading: child (0.3) below parent (0.5) = effective 0.3...     |
| 21  | `testInitialSettingsOpacityCascadingRuntimeParentChange` | test | Test opacity cascading: runtime parent change cascades to children...         |

### 6.9 Initial Settings — Cascading (Controls & Visibility)

[↑ Back to top](#table-of-contents)

| #   | Method                                                   | Type | Description                                                                                                      |
| --- | -------------------------------------------------------- | ---- | ---------------------------------------------------------------------------------------------------------------- |
| 22  | `testInitialSettingsControlRemoveCascadingToDescendants` | test | Test controls.remove cascading: parent false cascades unless child explicitly overrides with true...             |
| 23  | `testInitialSettingsStateVisibleCascadingToDescendants`  | test | Test states.visible cascading: parent false hides all descendants on map, children keep visible true in store... |

### 6.10 Initial Settings — Combo Tests

[↑ Back to top](#table-of-contents)

| #   | Method                                                        | Type | Description                                                              |
| --- | ------------------------------------------------------------- | ---- | ------------------------------------------------------------------------ |
| 24  | `testInitialSettingsComboQueryControlTrueStateQueryableFalse` | test | Test initialSettings controls.query = true + states.queryable = false... |
| 25  | `testInitialSettingsComboHoverControlTrueStateHoverableFalse` | test | Test initialSettings controls.hover = true + states.hoverable = false... |

---

## 7. Suite: `suite-details` — Details Panel

[↑ Back to top](#table-of-contents)

**File:** `tests/suites/suite-details.ts` · **Tester:** `DetailsTester` (`tests/testers/details-tester.ts`)
**Execution:** Sequential + parallel · **Guard:** `details` must be in `footerBar.tabs.core`

| #   | Method               | Type | Description                             |
| --- | -------------------- | ---- | --------------------------------------- |
| 1   | `testDetailsOnLayer` | test | Test Details on layer _{layerPath}_ ... |

---

## 8. Suite: `suite-geochart` — Geochart Plugin

[↑ Back to top](#table-of-contents)

**File:** `tests/suites/suite-geochart.ts` · **Tester:** `GeochartTester` (`tests/testers/geochart-tester.ts`)
**Execution:** Sequential + parallel · **Guard:** `geochart` must be in `footerBar.tabs.core`

| #   | Method                                       | Type | Description                              |
| --- | -------------------------------------------- | ---- | ---------------------------------------- |
| 1   | `testGeochartOpenForLayerMapClick`           | test | Test Geochart on layer _{layerPath}_ ... |
| 2   | `testAddGeocoreLayerUUIDForGeochartAirborne` | test | Test Geochart (Geocore Airborne)         |
| 3   | `testAddGeocoreLayerUUIDForGeochart`         | test | Test Geochart (Geocore UUID)             |

---

## 9. Suite: `suite-swiper` — Swiper Plugin

[↑ Back to top](#table-of-contents)

**File:** `tests/suites/suite-swiper.ts` · **Tester:** `SwiperTester` (`tests/testers/swiper-tester.ts`)
**Execution:** Single test · **Guard:** `swiper` must be in `corePackages` and swiper controller must exist

| #   | Method                | Type | Description                                                                              |
| --- | --------------------- | ---- | ---------------------------------------------------------------------------------------- |
| 1   | `testSwiperLifecycle` | test | Test Swiper lifecycle: activate, deactivate, multi-layer, orientation, deactivate all... |

---

## 10. Suite: `suite-ui` — UI / DOM

[↑ Back to top](#table-of-contents)

**File:** `tests/suites/suite-ui.ts` · **Tester:** `UITester` (`tests/testers/ui-tester.ts`)
**Execution:** Fully parallel (`Promise.all`) · **Guard:** None

| #   | Method                           | Type | Description                                     |
| --- | -------------------------------- | ---- | ----------------------------------------------- |
| 1   | `testGuideDetailsPanelTopAnchor` | test | Test Details Panel - Select and Find Top Anchor |
