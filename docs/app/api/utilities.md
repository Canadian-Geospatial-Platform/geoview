# GeoView API Utilities Documentation

Below is a categorized list of all utility functions available in GeoView. These utilities can be used to perform common tasks in map applications.

## How to Use API Utilities

```typescript
// Access utilities through the API instance
const id = cgpv.api.utilities.core.generateId();
const dmsCoords = cgpv.api.utilities.geo.coordFormatDMS(45.4215);
const transformedPoints = cgpv.api.utilities.projection.transformPoints(
  points,
  fromProj,
  toProj
);
const formattedDate = cgpv.api.utilities.date.formatDate(
  new Date(),
  "YYYY-MM-DD"
);
```

## Utility Categories Quick Links

- [Core Utilities](#core-utilities)
- [Geo Utilities](#geo-utilities)
- [Projection Utilities](#projection-utilities)
- [Date Management Utilities](#date-management-utilities)

<a id="core-utilities"></a>

## Core Utilities

General-purpose functions for string manipulation, object handling, DOM operations, and other common programming tasks.

#### Functions Quick Links

- [replaceParams](#replaceParams)
- [getLocalizedMessage](#getLocalizedMessage)
- [deepMergeObjects](#deepMergeObjects)
- [isObjectEmpty](#isObjectEmpty)
- [getScriptAndAssetURL](#getScriptAndAssetURL)
- [generateId](#generateId)
- [isValidUUID](#isValidUUID)
- [setAlphaColor](#setAlphaColor)
- [isJsonString](#isJsonString)
- [xmlToJson](#xmlToJson)
- [addUiComponent](#addUiComponent)
- [sanitizeHtmlContent](#sanitizeHtmlContent)
- [delay](#delay)
- [escapeRegExp](#escapeRegExp)

<a id="replaceParams"></a>

#### replaceParams

```typescript
/**
 * Take string like "My string is __param__" and replace parameters (__param__) from array of values
 * @param {unknown[]} params - An array of parameters to replace, i.e. ['short']
 * @param {string} message - The original message, i.e. "My string is __param__"
 * @returns {string} Message with values replaced "My string is short"
 */
cgpv.api.utilities.core.replaceParams(params, message);
```

<a id="getLocalizedMessage"></a>

#### getLocalizedMessage

```typescript
/**
 * Return proper language Geoview localized values from map i18n instance
 * @param {TypeDisplayLanguage} language - The language to get the message in
 * @param {string} messageKey - The localize key to read the message from
 * @param {unknown[] | undefined} params - An array of parameters to replace, i.e. ['short']
 * @returns {string} The translated message with values replaced
 */
cgpv.api.utilities.core.getLocalizedMessage(language, messageKey, params);
```

<a id="deepMergeObjects"></a>

#### deepMergeObjects

```typescript
/**
 * Deep merge objects together. Latest object will overwrite value on previous one if property exists.
 * @param {Record<string, unknown>} objects - The objects to deep merge
 * @returns {Record<string, unknown>} The merged object
 */
cgpv.api.utilities.core.deepMergeObjects(...objects);
```

<a id="isObjectEmpty"></a>

#### isObjectEmpty

```typescript
/**
 * Check if an object is empty
 * @param {object} obj - The object to test
 * @returns {boolean} true if the object is empty, false otherwise
 */
cgpv.api.utilities.core.isObjectEmpty(obj);
```

<a id="getScriptAndAssetURL"></a>

#### getScriptAndAssetURL

```typescript
/**
 * Get the URL of main script cgpv-main so we can access the assets
 * @returns {string} The URL of the main script
 */
cgpv.api.utilities.core.getScriptAndAssetURL();
```

<a id="generateId"></a>

#### generateId

```typescript
/**
 * Generates a unique id of the specified length.
 * @param {8 | 18 | 36} length - Number of characters to return.
 * @returns {string} The id.
 */
cgpv.api.utilities.core.generateId(length);
```

<a id="isValidUUID"></a>

#### isValidUUID

```typescript
/**
 * Validates if a UUID respects the format.
 * @param {string} uuid The UUID to validate.
 * @returns {boolean} Returns true if the UUID respect the format.
 */
cgpv.api.utilities.core.isValidUUID(uuid);
```

<a id="setAlphaColor"></a>

#### setAlphaColor

```typescript
/**
 * Set alpha for a color
 * @param {number[]} colorArray - The array of color numbers
 * @param {number} alpha - The new alpha
 * @returns {number[]} the color with the alpha set
 */
cgpv.api.utilities.core.setAlphaColor(colorArray, alpha);
```

<a id="isJsonString"></a>

#### isJsonString

```typescript
/**
 * Validates if a JSON string is well formatted
 * @param {string} str - The string to test
 * @returns {boolean} true if the JSON is valid, false otherwise
 */
cgpv.api.utilities.core.isJsonString(str);
```

<a id="xmlToJson"></a>

#### xmlToJson

```typescript
/**
 * Converts an XML document object into a json object
 * @param {Document | Node | Element} xml - The XML document object
 * @returns The converted json object
 */
cgpv.api.utilities.core.xmlToJson(xml);
```

<a id="addUiComponent"></a>

#### addUiComponent

```typescript
/**
 * Add a UI component to a custom div. Do not listen to event from here, pass in the props
 * @param {string} targetDivId - The div id to insert the component in
 * @param {React.ReactElement} component - The UI react component
 * @return {Root} the React root element
 */
cgpv.api.utilities.core.addUiComponent(targetDivId, component);
```

<a id="sanitizeHtmlContent"></a>

#### sanitizeHtmlContent

```typescript
/**
 * Sanitize HTML to remove threat
 * @param {string} contentHtml - HTML content to sanitize
 * @returns {string} Sanitized HTML or empty string if all dirty
 */
cgpv.api.utilities.core.sanitizeHtmlContent(contentHtml);
```

<a id="delay"></a>

#### delay

```typescript
/**
 * Delay helper function.
 * @param {number} ms - The number of milliseconds to wait for.
 * @returns {Promise<void>} Promise which resolves when the delay timeout expires.
 */
cgpv.api.utilities.core.delay(ms);
```

<a id="escapeRegExp"></a>

#### escapeRegExp

```typescript
/**
 * Escape special characters from string
 * @param {string} text - The text to escape
 * @returns {string} Escaped string
 */
cgpv.api.utilities.core.escapeRegExp(text);
```

<a id="geo-utilities"></a>

## Geo Utilities

Geographic utility functions for working with maps and spatial data.

#### Functions Quick Links

- [getESRIServiceMetadata](#getESRIServiceMetadata)
- [getWMSServiceMetadata](#getWMSServiceMetadata)
- [getMapServerUrl](#getMapServerUrl)
- [geometryToWKT](#geometryToWKT)
- [wktToGeometry](#wktToGeometry)
- [getDefaultDrawingStyle](#getDefaultDrawingStyle)
- [coordFormatDMS](#coordFormatDMS)
- [getArea](#getArea)
- [getLength](#getLength)
- [calculateDistance](#calculateDistance)

<a id="getESRIServiceMetadata"></a>

#### getESRIServiceMetadata

```typescript
/**
 * Fetch the json response from the ESRI map server to get REST endpoint metadata
 * @param {string} url the url of the ESRI map server
 * @returns {Promise<Record<string, unknown>>} a json promise containing the result of the query
 */
cgpv.api.utilities.geo.getESRIServiceMetadata(url);
```

<a id="getWMSServiceMetadata"></a>

#### getWMSServiceMetadata

```typescript
/**
 * Fetch the json response from the XML response of a WMS getCapabilities request
 * @param {string} url the url the url of the WMS server
 * @param {string} layers the layers to query separate by ,
 * @returns {Promise<Record<string, unknown>>} a json promise containing the result of the query
 */
cgpv.api.utilities.geo.getWMSServiceMetadata(url, layers);
```

<a id="getMapServerUrl"></a>

#### getMapServerUrl

```typescript
/**
 * Return the map server url from a layer service
 * @param {string} url the service url for a wms / dynamic or feature layers
 * @param {boolean} rest boolean value to add rest services if not present (default false)
 * @returns the map server url
 */
cgpv.api.utilities.geo.getMapServerUrl(url, rest);
```

<a id="geometryToWKT"></a>

#### geometryToWKT

```typescript
/**
 * Returns the WKT representation of a given geometry
 * @param {string} geometry the geometry
 * @returns {string | null} the WKT representation of the geometry
 */
cgpv.api.utilities.geo.geometryToWKT(geometry);
```

<a id="wktToGeometry"></a>

#### wktToGeometry

```typescript
/**
 * Returns the Geometry representation of a given wkt
 * @param {string} wkt the well known text
 * @param {ReadOptions} readOptions read options to convert the wkt to a geometry
 * @returns {Geometry | null} the Geometry representation of the wkt
 */
cgpv.api.utilities.geo.wktToGeometry(wkt, readOptions);
```

<a id="getDefaultDrawingStyle"></a>

#### getDefaultDrawingStyle

```typescript
/**
 * Default drawing style for GeoView
 * @returns an Open Layers styling for drawing on a map
 */
cgpv.api.utilities.geo.getDefaultDrawingStyle(
  strokeColor,
  strokeWidth,
  fillColor
);
```

<a id="coordFormatDMS"></a>

#### coordFormatDMS

```typescript
/**
 * Format the coordinates for degrees - minutes - seconds (lat, long)
 * @param {number} value the value to format
 * @returns {string} the formatted value
 */
cgpv.api.utilities.geo.coordFormatDMS(value);
```

<a id="getArea"></a>

#### getArea

```typescript
/**
 * Gets the area of a given geometry
 * @param {Geometry} geometry the geometry to calculate the area
 * @returns the area of the given geometry
 */
cgpv.api.utilities.geo.getArea(geometry);
```

<a id="getLength"></a>

#### getLength

```typescript
/**
 * Gets the length of a given geometry
 * @param {Geometry} geometry the geometry to calculate the length
 * @returns the length of the given geometry
 */
cgpv.api.utilities.geo.getLength(geometry);
```

<a id="calculateDistance"></a>

#### calculateDistance

```typescript
/**
 * Calculates distance along a path define by array of Coordinates
 * @param {Coordinate[]} coordinates - Array of corrdinates
 * @param {string} inProj - Input projection (EPSG:4326, EPSG:3978, ESPG:3857)
 * @param {string} outProj - Output projection (EPSG:3978, ESPG:3857)
 * @returns { total: number; sections: number[] } - The total distance in kilometers and distance for each section
 */
cgpv.api.utilities.geo.calculateDistance(coordinates, inProj, outProj);
```

<a id="projection-utilities"></a>

## Projection Utilities

Utilities for handling map projections.

#### Functions Quick Links

- [transformAndDensifyExtent](#transformAndDensifyExtent)
- [transformPoints](#transformPoints)
- [transformFromLonLat](#transformFromLonLat)
- [transformToLonLat](#transformToLonLat)
- [transformCoordinates](#transformCoordinates)

<a id="transformAndDensifyExtent"></a>

#### transformAndDensifyExtent

```typescript
/**
 * Transforms an extent from source projection to destination projection.
 * @param {Extent} extent - The extent to transform.
 * @param {OLProjection} source - Source projection-like.
 * @param {OLProjection} destination - Destination projection-like.
 * @param {number} stops - Optional number of stops per side used for the transform. The default value is 25.
 * @returns The densified extent transformed in the destination projection.
 */
cgpv.api.utilities.projection.transformAndDensifyExtent(
  extent,
  source,
  destination,
  stops
);
```

<a id="transformPoints"></a>

#### transformPoints

```typescript
/**
 * Converts points from one projection to another using proj4
 * @param {Coordinate[]} points - Array of passed in points to convert
 * @param {string} fromProj - Projection to be converted from
 * @param {string} toProj - Projection to be converted to
 */
cgpv.api.utilities.projection.transformPoints(points, fromProj, toProj);
```

<a id="transformFromLonLat"></a>

#### transformFromLonLat

```typescript
/**
 * Wrapper around OpenLayers function to transforms a coordinate from longitude/latitude.
 * @param {Coordinate} coordinate - Longitude/latitude coordinate
 * @param {OLProjection} projection - Projection to project the coordinate
 * @return {Coordinate} Coordinate as projected
 */
cgpv.api.utilities.projection.transformFromLonLat(coordinate, projection);
```

<a id="transformToLonLat"></a>

#### transformToLonLat

```typescript
/**
 * Wrapper around OpenLayers function to transforms a coordinate to longitude/latitude.
 * @param {Coordinate} coordinate - Projected coordinate
 * @param {OLProjection} projection - Projection of the coordinate
 * @return {Coordinate} Coordinate as longitude and latitude, i.e. an array with longitude as 1st and latitude as 2nd element.
 */
cgpv.api.utilities.projection.transformToLonLat(coordinate, projection);
```

<a id="transformCoordinates"></a>

#### transformCoordinates

```typescript
/**
 * Transform coordinates between two projections
 * @param {Coordinate | Coordinate[] | Coordinate[][] | Coordinate[][][] | undefined} coordinates - The coordinates to transform
 * @param {string} startProjection - The current projection of the coordinates.
 * @param {string} endProjection - The transformed projection of the coordinates.
 * @returns {Coordinate | Coordinate[] | Coordinate[][] | Coordinate[][][] | undefined} The transformed coordinates
 */
cgpv.api.utilities.projection.transformCoordinates(
  coordinates,
  startProjection,
  endProjection
);
```

<a id="date-management-utilities"></a>

## Date Management Utilities

Utilities for handling dates and time.

#### Functions Quick Links

- [convertToLocal](#convertToLocal)
- [convertToUTC](#convertToUTC)
- [formatDate](#formatDate)
- [formatDatePattern](#formatDatePattern)
- [formatDateToISO](#formatDateToISO)
- [convertToMilliseconds](#convertToMilliseconds)
- [convertMilisecondsToDate](#convertMilisecondsToDate)

<a id="convertToLocal"></a>

#### convertToLocal

```typescript
/**
 * Convert a UTC date to a local date
 * @param {Date | string} date date to use
 * @returns {string} local date
 */
cgpv.api.utilities.date.convertToLocal(date);
```

<a id="convertToUTC"></a>

#### convertToUTC

```typescript
/**
 * Convert a date local to a UTC date
 * @param {Date | string} date date to use
 * @returns {string} UTC date or empty string if invalid date (when field value is null)
 */
cgpv.api.utilities.date.convertToUTC(date);
```

<a id="formatDate"></a>

#### formatDate

```typescript
/**
 * Format a date to specific format like 'YYYY-MM-DD'
 * @param {Date | string} date date to use
 * @param {string} format format of the date.
 * @returns {string} formatted date
 */
cgpv.api.utilities.date.formatDate(date, format);
```

<a id="formatDatePattern"></a>

#### formatDatePattern

```typescript
/**
 * Format a date to a pattern
 * @param {Date | string} date date to use
 * @param {DatePrecision} datePattern the date precision pattern to use
 * @param {TimePrecision}timePattern the time precision pattern to use
 * @returns {string} formatted date
 */
cgpv.api.utilities.date.formatDatePattern(date, datePattern, timePattern);
```

<a id="formatDateToISO"></a>

#### formatDateToISO

```typescript
/**
 * Converts a Date object to an ISO 8601 formatted string in the local time zone.
 * @param {Date | number | string} date - The Date object to be formatted.
 * @returns {string} The formatted date string in ISO 8601 format.
 */
cgpv.api.utilities.date.formatDateToISO(date);
```

<a id="convertToMilliseconds"></a>

#### convertToMilliseconds

```typescript
/**
 * Convert a date to milliseconds
 * @param {Date | string} date date to use
 * @returns {number} date as milliseconds
 */
cgpv.api.utilities.date.convertToMilliseconds(date);
```

<a id="convertMilisecondsToDate"></a>

#### convertMilisecondsToDate

```typescript
/**
 * Convert a milliseconds date to string date. Date format is YYYY-MM-DDTHH:mm:ss.
 * @param {number} date milliseconds date
 * @returns {string} date string
 */
cgpv.api.utilities.date.convertMilisecondsToDate(date, dateFormat);
```
