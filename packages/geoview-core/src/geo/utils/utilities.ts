import type { Feature, MapBrowserEvent } from 'ol';
import { WKT, GeoJSON } from 'ol/format';
import { WKB as FormatWkb } from 'ol/format';
import type { ReadOptions } from 'ol/format/Feature';
import type Geometry from 'ol/geom/Geometry';
import { Style, Stroke, Fill, Circle } from 'ol/style';
import type { Color } from 'ol/color';
import { getArea as getAreaOL, getLength as getLengthOL } from 'ol/sphere';
import type { Extent } from 'ol/extent';
import { containsCoordinate, buffer } from 'ol/extent';
import type { OSM, VectorTile } from 'ol/source';
import { XYZ } from 'ol/source';
import TileLayer from 'ol/layer/Tile';
import { LineString, Point, Polygon } from 'ol/geom';
import type { Coordinate } from 'ol/coordinate';
import type View from 'ol/View';

import type { TypeFeatureStyle } from '@/geo/layer/geometry/geometry-types';
import { Fetch } from '@/core/utils/fetch-helper';
import { Projection } from '@/geo/utils/projection';

import type { TypeVectorLayerStyles } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { GeoviewRenderer } from '@/geo/utils/renderer/geoview-renderer';
import type { TypeLayerStyleConfig, TypeOutfields, TypeValidMapProjectionCodes } from '@/api/types/map-schema-types';
import { CONFIG_PROXY_URL } from '@/api/types/map-schema-types';
import type { TypeMetadataWMS, TypeMetadataWMSCapabilityLayer, TypeMetadataWMSRoot, TypeStylesWMS } from '@/api/types/layer-schema-types';
import { CONST_LAYER_TYPES } from '@/api/types/layer-schema-types';

import type { TypeBasemapLayer } from '@/geo/layer/basemap/basemap-types';
import type { TypeMapMouseInfo } from '@/geo/map/map-viewer';
import { NetworkError, ResponseEmptyError } from '@/core/exceptions/core-exceptions';
import { xmlToJson } from '@/core/utils/utilities';
import GML3 from 'ol/format/GML3';

// available layer types
export const layerTypes = CONST_LAYER_TYPES;

// #region FETCH METADATA

export abstract class GeoUtilities {
  /**
   * Parses a XML string into Json.
   * @param {string} xmlContent - The XML string to parse.
   * @returns {T} A json object
   */
  static parseXMLToJson<T>(xmlContent: string): T {
    // Read the xml
    const xml = new DOMParser().parseFromString(xmlContent, 'application/xml');

    // Parse it using xmlToJson
    const jsonObject = xmlToJson(xml);

    // Simplify and return
    return this.#simplifyXmlJson(jsonObject);
  }

  /**
   * Recursively simplifies XML-to-JSON converted objects by removing wrapper
   * structures such as `{ "#text": "value" }` and replacing them with the raw value.

  * This is useful when working with XML parsers that represent text nodes using
  * `#text` objects. For example:
  * ```json
  * { "title": { "#text": "Hello" } }
  * ```
  *
  * becomes:
  *
  * ```json
  * { "title": "Hello" }
  * ```
  *
  * The function walks the object tree and:
  *  - If a value is not an object, returns it unchanged.
  *  - If an object contains only a `#text` property, returns the string inside it.
  *  - Otherwise recurses into all properties.
  * @template T
  * @param {any} obj - The object generated from XML parsing to simplify.
  * @returns {T} The simplified JSON structure with unnecessary XML wrappers removed.
  */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static #simplifyXmlJson<T>(obj: any): T {
    if (typeof obj !== 'object' || obj === null) return obj;

    // If obj has only #text, replace it with the string
    const keys = Object.keys(obj);
    if (keys.length === 1 && keys[0] === '#text') return obj['#text'];

    // Otherwise, recurse for each property
    for (const key of keys) {
      // eslint-disable-next-line no-param-reassign
      obj[key] = this.#simplifyXmlJson(obj[key]);
    }

    // Return the simplified json object
    return obj;
  }

  /**
   * Extracts the base URL (origin + pathname) from a full URL string,
   * removing any query parameters, hash fragments, or authentication data.
   * @param {string} url - The full URL string to process.
   * @returns {string} The normalized base URL consisting of the origin and pathname.
   */
  static getBaseUrl(url: string): string {
    // Create the URL object
    const urlValue = new URL(url);

    // Rebuild final URL with normalized parameters
    return `${urlValue.origin}${urlValue.pathname}`;
  }

  /**
   * Ensures a service URL includes standardized OGC parameters (`SERVICE`, `REQUEST`, `VERSION`),
   * overriding any existing ones with the correct casing and values.
   * The function normalizes query parameter keys, removes lowercase variants (`service`, `request`),
   * and ensures the final URL contains correctly capitalized parameters with the specified values.
   * If the `VERSION` parameter is missing, a default value is added.
   * @param {string} url - The input service URL, which may be absolute or relative.
   * @param {string} service - The OGC service type (e.g., `"WMS"`, `"WFS"`, `"WMTS"`).
   * @param {string} request - The OGC request type (e.g., `"GetMap"`, `"GetFeature"`, `"GetCapabilities"`).
   * @param {string} [version='1.3.0'] - The default service version to enforce if not already present.
   * @returns {string} The normalized and fully qualified service request URL.
   */
  static ensureServiceRequestUrl(url: string, service: string, request: string, version: string = '1.3.0'): string {
    const parsedUrl = new URL(url, window.location.href); // fallback base if relative
    const params = parsedUrl.searchParams;

    // Normalize keys for comparison
    const keysLower = Array.from(params.keys()).map((k) => k.toLowerCase());

    // Fill the correct parameter
    if (keysLower.includes('service')) {
      params.delete('service');
    }
    params.set('SERVICE', service);

    // Fill the correct parameter
    if (keysLower.includes('request')) {
      params.delete('request');
    }
    params.set('REQUEST', request);

    // Add required parameters if missing
    if (!keysLower.includes('version') && version && version.length > 0) params.set('VERSION', version);

    // Return the parsed string
    return parsedUrl.toString();
  }

  /**
   * Builds a complete GetCapabilities URL for a specific OGC service.
   * @param {string} url - The base service URL.
   * @param {string} service - The service type (e.g., "WMS", "WFS").
   * @param {string} [layers] - Optional layer name(s) to include in the request.
   * @returns {string} A fully qualified GetCapabilities request URL.
   */
  static ensureServiceRequestUrlGetCapabilities(url: string, service: string, layers?: string): string {
    // Redirect
    const layersClause = layers ? `&Layers=${encodeURIComponent(layers)}` : '';
    // Send version='' on purpose to let the server respond with its latest version
    return `${this.ensureServiceRequestUrl(url, service, 'GetCapabilities', '')}${layersClause}`;
  }

  /**
   * Builds a complete GetStyles URL for a WMS service.
   * @param {string} url - The base WMS service URL.
   * @param {string} [layers] - Optional layer name(s) to include in the request.
   * @param {string} [version] - Optional WMS version.
   * @returns {string} A fully qualified GetStyles request URL.
   */
  static ensureServiceRequestUrlGetStyles(url: string, layers?: string, version?: string): string {
    // Redirect
    const layersClause = layers ? `&Layers=${encodeURIComponent(layers)}` : '';
    return `${this.ensureServiceRequestUrl(url, 'WMS', 'GetStyles', version)}${layersClause}`;
  }

  /**
   * Builds a complete GetLegendGraphic URL for a WMS service.
   * @param {string} url - The base WMS service URL.
   * @param {string} layerId - The layer name for which to retrieve the legend.
   * @param {string} version - The WMS version.
   * @param {string} [format] - Optional image format for the legend (e.g., "image/png").
   * @returns {string} A fully qualified GetLegendGraphic request URL.
   */
  static ensureServiceRequestUrlGetLegendGraphic(url: string, layerId: string, version: string, format: string = 'image/png'): string {
    // Redirect
    return `${this.ensureServiceRequestUrl(url, 'WMS', 'GetLegendGraphic', version)}&LAYER=${encodeURIComponent(layerId)}&FORMAT=${encodeURIComponent(format)}`;
  }

  /**
   * Builds a complete DescribeFeatureType URL for a WFS service.
   * @param {string} url - The base WFS service URL.
   * @param {string} layerId - The layer or feature type name to describe.
   * @param {string} version - The WFS version.
   * @param {string} [outputFormat] - Optional output format (e.g., "application/json", "text/xml").
   * @returns {string} A fully qualified DescribeFeatureType request URL.
   */
  static ensureServiceRequestUrlDescribeFeatureType(
    url: string,
    layerId: string,
    version: string,
    outputFormat: string | undefined
  ): string {
    // Redirect
    const outputFormatClause = outputFormat ? `&outputFormat=${encodeURIComponent(outputFormat)}` : '';
    return `${this.ensureServiceRequestUrl(url, 'WFS', 'DescribeFeatureType', version)}&typeName=${encodeURIComponent(layerId)}${outputFormatClause}`;
  }

  /**
   * Builds a complete GetFeature URL for a WMS/WFS service.
   * @param {string} url - The base WFS service URL.
   * @param {string} layerId - The layer or feature type name to request.
   * @param {string} version - The WFS version.
   * @param {string} [outputFormat] - Optional output format (e.g., "application/json").
   * @returns {string} A fully qualified GetFeature request URL.
   */
  static ensureServiceRequestUrlGetFeature(
    url: string,
    layerId: string,
    version: string,
    outputFormat: string | undefined,
    outfields: TypeOutfields[] | undefined,
    xmlFilter: string | undefined,
    outputProjectionCode: string | undefined
  ): string {
    // Redirect
    const outputFormatClause = outputFormat ? `&outputFormat=${encodeURIComponent(outputFormat)}` : '';
    const outfieldsClause = outfields ? `&propertyName=${encodeURIComponent(outfields.map((f) => f.name).join(','))}` : '';
    const xmlFilterClause = xmlFilter ? `&filter=${encodeURIComponent(xmlFilter)}` : '';
    const outputProjectionCodeClause = outputProjectionCode ? `&srsName=${encodeURIComponent(outputProjectionCode)}` : '';
    return `${this.ensureServiceRequestUrl(url, 'WFS', 'GetFeature', version)}&typeName=${encodeURIComponent(layerId)}${outputFormatClause}${outfieldsClause}${xmlFilterClause}${outputProjectionCodeClause}`;
  }

  /**
   * Fetch the json response from the ESRI map server to get REST endpoint metadata.
   * @param {string} url - The url of the ESRI map server.
   * @returns {Promise<unknown>} A json promise containing the result of the query.
   */
  static getESRIServiceMetadata(url: string): Promise<unknown> {
    // fetch the map server returning a json object
    return Fetch.fetchJson(`${url}?f=json`);
  }

  /**
   * Fetch the json response from the XML response of a WMS getCapabilities request.
   * @param {string} url - The url the url of the WMS server.
   * @param {AbortSignal | undefined} abortSignal - Abort signal to handle cancelling of fetch.
   * @returns {Promise<TypeMetadataWMS>} A json promise containing the result of the query.
   * @throws {RequestTimeoutError} When the request exceeds the timeout duration.
   * @throws {RequestAbortedError} When the request was aborted by the caller's signal.
   * @throws {ResponseError} When the response is not OK (non-2xx).
   * @throws {ResponseEmptyError} When the JSON response is empty.
   * @throws {NetworkError} When a network issue happened.
   */
  static async getWMSServiceString(
    url: string,
    callbackNewMetadataUrl?: CallbackNewMetadataDelegate,
    abortSignal?: AbortSignal
  ): Promise<string> {
    let capabilitiesString;
    try {
      // Fetch the metadata
      capabilitiesString = await Fetch.fetchText(url, { signal: abortSignal });

      // Return it
      return capabilitiesString;
    } catch (error: unknown) {
      // If a network error such as CORS
      if (error instanceof NetworkError) {
        // We're going to change the metadata url to use a proxy
        const newProxiedMetadataUrl = `${CONFIG_PROXY_URL}?${url}`;

        // Try again with the proxy this time
        capabilitiesString = await Fetch.fetchText(newProxiedMetadataUrl);

        // Callback about it
        callbackNewMetadataUrl?.(`${CONFIG_PROXY_URL}?`);

        // Return it
        return capabilitiesString;
      } else {
        // Unknown error, throw it
        throw error;
      }
    }
  }

  /**
   * Fetch the json response from the XML response of a WMS getCapabilities request.
   * @param {string} url - The url the url of the WMS server.
   * @param {string} layers - The layers to query separate by.
   * @param {AbortSignal | undefined} abortSignal - Abort signal to handle cancelling of fetch.
   * @returns {Promise<TypeMetadataWMS>} A json promise containing the result of the query.
   * @throws {RequestTimeoutError} When the request exceeds the timeout duration.
   * @throws {RequestAbortedError} When the request was aborted by the caller's signal.
   * @throws {ResponseError} When the response is not OK (non-2xx).
   * @throws {ResponseEmptyError} When the JSON response is empty.
   * @throws {NetworkError} When a network issue happened.
   */
  static async getWMSServiceMetadata(
    url: string,
    layers?: string,
    callbackNewMetadataUrl?: CallbackNewMetadataDelegate,
    abortSignal?: AbortSignal
  ): Promise<TypeMetadataWMS> {
    // Make sure the URL has necessary information
    const capUrl = this.ensureServiceRequestUrlGetCapabilities(url, 'WMS', layers);

    // Redirect
    const metadataRaw = await this.getWMSServiceString(capUrl, callbackNewMetadataUrl, abortSignal);

    // Parse it
    const metadataParsed = this.parseXMLToJson<TypeMetadataWMSRoot>(metadataRaw);

    // Result to be returned
    let metadataResult = metadataParsed.WMS_Capabilities || metadataParsed.WMT_MS_Capabilities;

    // Weird case, if it's an array, find the best object in the array
    if (Array.isArray(metadataResult)) {
      metadataResult = metadataResult.find((obj) => (obj as TypeMetadataWMS).Capability);
    }

    // If nothing
    if (!metadataResult) throw new ResponseEmptyError();

    // Read the version
    metadataResult.version = metadataResult['@attributes']?.version;

    // Try to guess the server type
    metadataResult.serverType = this.#isQgisServer(metadataRaw) ? 'qgis' : undefined;

    // If server type not determined, check geoserver
    if (!metadataResult.serverType) {
      metadataResult.serverType = this.#isGeoServer(metadataRaw) ? 'geoserver' : undefined;
    }

    // If server type not determined, check mapserver
    if (!metadataResult.serverType) {
      metadataResult.serverType = this.#isMapServer(metadataRaw) ? 'mapserver' : undefined;
    }

    // Normalize the Json to make it more uniform, simulating what ol/Format/WMSCapabilities was doing before being replaced
    this.#helperParseCapabilityNormalizeArray(metadataResult.Capability.Request.GetMap, 'DCPType');
    this.#helperParseCapabilityNormalizeArray(metadataResult.Capability.Request.GetFeatureInfo, 'Format');
    this.#helperParseCapabilityLayer(metadataResult.Capability.Layer);

    // Return it
    return metadataResult;
  }

  /**
   * Detects whether a WMS GetCapabilities document was produced by QGIS Server.
   * QGIS Server responses can be identified by:
   * - The presence of the QGIS-specific namespace (`xmlns:qgs="http://www.qgis.org/wms"`)
   * - Or schema references to `qgis.org/wms` in the `xsi:schemaLocation`
   * @param {string | Document} xml - The GetCapabilities XML string or parsed XML Document.
   * @returns {boolean} True if the capabilities document appears to be from QGIS Server.
   */
  static #isQgisServer(xml: string | Document): boolean {
    let xmlDoc: Document;

    if (typeof xml === 'string') {
      const parser = new DOMParser();
      xmlDoc = parser.parseFromString(xml, 'application/xml');
    } else {
      xmlDoc = xml;
    }

    // Check for QGIS namespace
    const root = xmlDoc.documentElement;
    const xmlnsQgs = root.getAttribute('xmlns:qgs');
    if (xmlnsQgs?.includes('qgis.org/wms')) return true;

    // Check for QGIS schema location
    const schemaLocation = root.getAttribute('xsi:schemaLocation');
    if (schemaLocation?.includes('qgis.org/wms')) return true;

    // Check for any qgs-prefixed elements just in case
    if (xmlDoc.getElementsByTagNameNS('http://www.qgis.org/wms', '*').length > 0) return true;

    return false;
  }

  /**
   * Detects whether a WMS GetCapabilities XML response was generated by GeoServer.
   * Detection logic looks for:
   * - GeoServer namespaces (e.g., "http://geoserver.org")
   * - Schema locations referencing GeoServer (e.g., "/geoserver/")
   * - GeoServer-specific Service metadata (keywords, OnlineResource, etc.)
   * @param {string} xml - The raw WMS GetCapabilities XML string.
   * @returns {boolean} True if the response appears to be from GeoServer, false otherwise.
   */
  static #isGeoServer(xml: string): boolean {
    // Quick check for obvious GeoServer signatures
    const lowerXml = xml.toLowerCase();

    // 1. Check for GeoServer namespace or schema location
    if (lowerXml.includes('http://geoserver.org') || lowerXml.includes('/geoserver/')) {
      return true;
    }

    // 2. GeoServer sometimes adds its own xmlns:gs or xmlns:gml in a GeoServer-specific context
    if (lowerXml.includes('xmlns:gs=') || lowerXml.includes('xmlns:geoserver=')) {
      return true;
    }

    // 3. Check for a Service > Keyword referencing GeoServer
    if (lowerXml.includes('<keyword>geoserver</keyword>')) {
      return true;
    }

    // 4. Check for GeoServer-specific schema extensions
    if (lowerXml.includes('geoserver/wms')) {
      return true;
    }

    // 5. Sometimes the OnlineResource or metadata link includes "geoserver"
    if (lowerXml.includes('<onlineresource xlink:href="') && lowerXml.includes('geoserver')) {
      return true;
    }

    // No clear indicators of GeoServer found
    return false;
  }

  /**
   * Detects whether a WMS GetCapabilities XML response was generated by MapServer.
   * Detection logic looks for:
   * - MapServer-specific namespaces or schema URLs
   * - Service metadata fields referencing MapServer
   * - MapServer URLs in OnlineResource or schemaLocation
   * @param {string} xml - The raw WMS GetCapabilities XML string.
   * @returns {boolean} True if the response appears to be from MapServer, false otherwise.
   */
  static #isMapServer(xml: string): boolean {
    const lowerXml = xml.toLowerCase();

    // 1. Check for the MapServer namespace (common indicator)
    if (lowerXml.includes('http://mapserver.gis.umn.edu/mapserver')) {
      return true;
    }

    // 2. Check for URLs that include "mapserv" (typical CGI endpoint)
    if (lowerXml.includes('mapserv?') || lowerXml.includes('/mapserver')) {
      return true;
    }

    // 3. Check for schema locations referencing mapserver
    if (lowerXml.includes('schemas.mapserver') || lowerXml.includes('mapserver.xsd')) {
      return true;
    }

    // 4. Check for a service title or abstract mentioning MapServer
    if (lowerXml.includes('<title>mapserver') || lowerXml.includes('<abstract>mapserver')) {
      return true;
    }

    // 5. Check for contact organization mentioning MapServer
    if (lowerXml.includes('<contactorganization>mapserver')) {
      return true;
    }

    // 6. Sometimes appears as a generator keyword in comments or metadata
    if (lowerXml.includes('<!-- mapserver') || lowerXml.includes('generated by mapserver')) {
      return true;
    }

    // No clear indicators of MapServer found
    return false;
  }

  /**
   * Normalizes a property of an object so that its value is always an array.
   * This helper is used when parsing WMS Capabilities documents, where
   * some fields may be expressed as a single object or as an array of objects.
   * Ensuring array form simplifies processing logic elsewhere.
   * @param {any} object - The object containing the property to normalize.
   * @param {string} property - The property name whose value should be normalized.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static #helperParseCapabilityNormalizeArray(object: any, property: string): void {
    // Check BoundingBox property
    if (object[property]) {
      // If not an array, make it so
      if (!Array.isArray(object[property])) {
        // eslint-disable-next-line no-param-reassign
        object[property] = [object[property]];
      }
    }
  }

  /**
   * Recursively normalizes a WMS Capability Layer object so its structure is
   * consistent and easier to work with. This function was created to **simulate
   * the normalizations previously performed by OpenLayers' `WMSCapabilities`
   * parser (`ol/format/WMSCapabilities`) before that logic was replaced**.
   * The function:
   * - Recursively normalizes nested `Layer` elements.
   * - Ensures certain properties are always arrays (`Layer`, `BoundingBox`, `Style`, `CRS`, `Dimension`).
   * - Normalizes `SRS` to `CRS` when only `SRS` is provided (as OpenLayers used to do).
   * - Generates convenience `extent` arrays for `BoundingBox` and `EX_GeographicBoundingBox`,
   *   again mimicking old OpenLayers parsing behavior.
   * @param {TypeMetadataWMSCapabilityLayer} layer - A WMS capability layer object.
   */
  static #helperParseCapabilityLayer(layer: TypeMetadataWMSCapabilityLayer): void {
    // Check for recursion
    if (layer.Layer) {
      // Normalize the 'Layer' to be always be an array
      this.#helperParseCapabilityNormalizeArray(layer, 'Layer');

      // Loop
      layer.Layer.forEach((lyr) => {
        // Recursion
        this.#helperParseCapabilityLayer(lyr);
      });
    }

    // If the service uses SRS instead of CRS, normalize to CRS for practicality (simulating what ol/Format/WMSCapabilities was doing before)
    if (!layer.CRS) {
      // eslint-disable-next-line no-param-reassign, @typescript-eslint/no-explicit-any
      layer.CRS = (layer as any).SRS;
    }

    // Normalize a couple properties to always be arrays (simulating what ol/Format/WMSCapabilities was doing before)
    this.#helperParseCapabilityNormalizeArray(layer, 'BoundingBox');
    this.#helperParseCapabilityNormalizeArray(layer, 'Style');
    // For each style
    layer.Style?.forEach((style) => {
      this.#helperParseCapabilityNormalizeArray(style, 'LegendURL');
    });
    this.#helperParseCapabilityNormalizeArray(layer, 'CRS');
    this.#helperParseCapabilityNormalizeArray(layer, 'Dimension');

    // Write the extents for the bboxes for practicality (simulating what ol/Format/WMSCapabilities was doing before)
    layer.BoundingBox?.forEach((bbox) => {
      if (bbox['@attributes'].minx || bbox['@attributes'].maxx) {
        // eslint-disable-next-line no-param-reassign
        bbox['@attributes'].extent = [
          Number(bbox['@attributes'].minx),
          Number(bbox['@attributes'].miny),
          Number(bbox['@attributes'].maxx),
          Number(bbox['@attributes'].maxy),
        ];
      }
    });

    // Write the extents for the bboxes for practicality (simulating what ol/Format/WMSCapabilities was doing before)
    if (layer.EX_GeographicBoundingBox) {
      if (layer.EX_GeographicBoundingBox.eastBoundLongitude || layer.EX_GeographicBoundingBox.northBoundLatitude) {
        // eslint-disable-next-line no-param-reassign
        layer.EX_GeographicBoundingBox.extent = [
          Number(layer.EX_GeographicBoundingBox.westBoundLongitude),
          Number(layer.EX_GeographicBoundingBox.southBoundLatitude),
          Number(layer.EX_GeographicBoundingBox.eastBoundLongitude),
          Number(layer.EX_GeographicBoundingBox.northBoundLatitude),
        ];
      }
    }

    // Write the Dimension for practicality (simulating what ol/Format/WMSCapabilities was doing before)
    layer.Dimension?.forEach((dimension) => {
      // eslint-disable-next-line no-param-reassign
      dimension.name ??= dimension['@attributes'].name;
      // eslint-disable-next-line no-param-reassign
      dimension.default ??= dimension['@attributes'].default;
      // eslint-disable-next-line no-param-reassign
      dimension.units ??= dimension['@attributes'].units;
      // eslint-disable-next-line no-param-reassign
      dimension.values ??= dimension['#text'];
    });
  }

  /**
   * Fetch the json response from the XML response of a WMS getCapabilities request.
   * @param {string} url - The url the url of the WMS server.
   * @param {string} layers - The layers to query separate by.
   * @param {AbortSignal | undefined} abortSignal - Abort signal to handle cancelling of fetch.
   * @returns {Promise<TypeStylesWMS>} A json promise containing the result of the query.
   * @throws {RequestTimeoutError} When the request exceeds the timeout duration.
   * @throws {RequestAbortedError} When the request was aborted by the caller's signal.
   * @throws {ResponseError} When the response is not OK (non-2xx).
   * @throws {ResponseEmptyError} When the JSON response is empty.
   * @throws {NetworkError} When a network issue happened.
   */
  static async getWMSServiceStyles(
    url: string,
    layers?: string,
    callbackNewMetadataUrl?: CallbackNewMetadataDelegate,
    abortSignal?: AbortSignal
  ): Promise<TypeStylesWMS> {
    // Make sure the URL has necessary information
    const stylesUrl = this.ensureServiceRequestUrlGetStyles(url, layers);

    // Redirect
    const responseXML = await this.getWMSServiceString(stylesUrl, callbackNewMetadataUrl, abortSignal);

    // Read the styles
    return this.parseXMLToJson(responseXML);
  }

  /**
   * Return the map server url from a layer service.
   * @param {string} url - The service url for a wms / dynamic or feature layers.
   * @param {boolean} rest - Boolean value to add rest services if not present (default false).
   * @returns {string} The map server url.
   * @deprecated
   */
  static getMapServerUrl(url: string, rest: boolean = false): string {
    let mapServerUrl = url;
    if (mapServerUrl.includes('MapServer')) {
      mapServerUrl = mapServerUrl.slice(0, mapServerUrl.indexOf('MapServer') + 'MapServer'.length);
    }
    if (mapServerUrl.includes('FeatureServer')) {
      mapServerUrl = mapServerUrl.slice(0, mapServerUrl.indexOf('FeatureServer') + 'FeatureServer'.length);
    }

    if (rest) {
      const urlRightSide = mapServerUrl.slice(mapServerUrl.indexOf('/services/'));
      mapServerUrl = `${mapServerUrl.slice(0, url.indexOf('services/'))}rest${urlRightSide}`;
    }

    return mapServerUrl;
  }

  /**
   * Return the root server url from a OGC layer service.
   * @param {string} url - The service url for an ogc layer.
   * @returns {string} The root ogc server url.
   * @deprecated
   */
  static getOGCServerUrl(url: string): string {
    let ogcServerUrl = url;
    if (ogcServerUrl.includes('collections')) {
      ogcServerUrl = ogcServerUrl.slice(0, ogcServerUrl.indexOf('collections'));
    }
    return ogcServerUrl;
  }

  /**
   * Replaces or adds the BBOX parameter in a WMS GetMap URL.
   * @param {string} url - The original WMS GetMap URL
   * @param {string} newCRS - The new CRS
   * @param {number[]} newBBOX - The new BBOX to set, as an array of 4 numbers: [minX, minY, maxX, maxY]
   * @returns {string} A new URL string with the updated BBOX parameter
   */
  static replaceCRSandBBOXParam(url: string, newCRS: string, newBBOX: number[]): string {
    const urlObj = new URL(url);

    // Format the new BBOX as a comma-separated string
    const bboxString = newBBOX.join(',');

    // Replace or add the BBOX parameter
    urlObj.searchParams.set('BBOX', bboxString);
    urlObj.searchParams.set('CRS', newCRS);

    return urlObj.toString();
  }

  // #endregion FETCH METADATA

  // #region GEOMETRY

  /**
   * Returns the WKT representation of a given geometry.
   * @param {string} geometry - The geometry
   * @returns {string | undefined} The WKT representation of the geometry
   */
  static geometryToWKT(geometry: Geometry): string | undefined {
    if (geometry) {
      // Get the wkt for the geometry
      const format = new WKT();
      return format.writeGeometry(geometry);
    }
    return undefined;
  }

  /**
   * Returns the Geometry representation of a given wkt.
   * @param {string} wkt - The well known text
   * @param {ReadOptions} readOptions - Read options to convert the wkt to a geometry
   * @returns {Geometry | undefined} The Geometry representation of the wkt
   */
  static wktToGeometry(wkt: string, readOptions: ReadOptions): Geometry | undefined {
    if (wkt) {
      // Get the feature for the wkt
      const format = new WKT();
      return format.readGeometry(wkt, readOptions);
    }
    return undefined;
  }

  /**
   * Returns the Geometry representation of a given geojson
   * @param {string} geojson - The geojson
   * @param {ReadOptions} readOptions - Read options to convert the geojson to a geometry
   * @returns {Geometry | undefined} - The Geometry representation of the geojson
   */
  static geojsonToGeometry(geojson: string, readOptions: ReadOptions): Geometry | undefined {
    if (geojson) {
      // Get the feature for the geojson
      const format = new GeoJSON();
      return format.readGeometry(geojson, readOptions);
    }
    return undefined;
  }

  /**
   * Checks whether a given value is a valid GeoJSON FeatureCollection object.
   * @param {any} value - The value to test (can be any type).
   * @returns {boolean} `true` if the value appears to be a GeoJSON FeatureCollection, otherwise `false`.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static isGeoJSONObject(value: any): boolean {
    return typeof value === 'object' && value !== null && value['type'] === 'FeatureCollection' && Array.isArray(value['features']);
  }

  /**
   * Extracts the EPSG code from a GeoJSON object's CRS definition.
   * Accepts either a GeoJSON object or a JSON string. If the GeoJSON contains
   * a `crs` entry with a `properties.name` field in the form
   * `"urn:ogc:def:crs:EPSG::<code>"`, it is normalized to `"EPSG:<code>"`.
   * @param {object|string} geojson - A GeoJSON object or a JSON string representing one.
   * @returns {string|undefined} The normalized EPSG code (e.g., `"EPSG:3005"`), or
   * `undefined` if the CRS is not defined.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static readEPSGOfGeoJSON(geojson: any): string | undefined {
    // Convert string to geoJSON if necessary
    const geojsonObject = typeof geojson === 'string' ? JSON.parse(geojson) : geojson;

    // Create features from geoJSON
    const name = geojsonObject.crs?.properties?.name;

    // If found a name
    if (name) {
      return this.#parseEPSGFromName(name);
    }

    // Return the EPSG
    return name;
  }

  /**
   * Extracts the EPSG code from a GeoJSON object's CRS definition.
   * Accepts either a GeoJSON object or a JSON string. If the GeoJSON contains
   * a `crs` entry with a `properties.name` field in the form
   * `"urn:ogc:def:crs:EPSG::<code>"`, it is normalized to `"EPSG:<code>"`.
   * @param {object|string} geojson - A GeoJSON object or a JSON string representing one.
   * @returns {string|undefined} The normalized EPSG code (e.g., `"EPSG:3005"`), or
   * `undefined` if the CRS is not defined.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static readEPSGOfGML(gml: any): string | undefined {
    const xml = typeof gml === 'string' ? new DOMParser().parseFromString(gml, 'text/xml') : gml;

    // Search for any element with srsName
    const nodes = xml.querySelectorAll('[srsName]');
    for (const node of nodes) {
      const srsName = node.getAttribute('srsName');

      // If found a name
      if (srsName) {
        return this.#parseEPSGFromName(srsName);
      }
    }

    return undefined;
  }

  /**
   * Extracts an EPSG code from a SRS/CRS standard string.
   * Supports common formats used in GeoJSON/WFS/GML.
   */
  static #parseEPSGFromName(name: string): string | undefined {
    // Standard forms
    // "EPSG:4326" → EPSG:4326
    // "urn:ogc:def:crs:EPSG::4326" → EPSG:4326
    // "http://www.opengis.net/gml/srs/epsg.xml#4326" → EPSG:4326
    // "urn:x-ogc:def:crs:EPSG:6.6:4326" → EPSG:4326

    // Direct "EPSG:xxxx"
    if (name.startsWith('EPSG:')) return name;

    // URN formats
    const match = name.match(/EPSG[:/]+(\d+)/i);
    if (match) return `EPSG:${match[1]}`;

    return undefined;
  }

  /**
   * Reads OpenLayers features from a GeoJSON object.
   * @param {unknown} geojson - The GeoJSON data to read.
   * @param {import('ol/format/Feature').ReadOptions} [options] - Optional read options such as projection or extent.
   * @returns {import('ol/Feature').default[]} An array of parsed OpenLayers Feature instances.
   */
  static readFeaturesFromGeoJSON(geojson: unknown, options: ReadOptions | undefined): Feature<Geometry>[] {
    // Read the features
    return new GeoJSON().readFeatures(geojson, options);
  }

  /**
   * Reads OpenLayers features from a WKBObject object.
   * @param {unknown} wkbObject - The WKBObject data to read.
   * @param {import('ol/format/Feature').ReadOptions} [options] - Optional read options such as projection or extent.
   * @returns {import('ol/Feature').default[]} An array of parsed OpenLayers Feature instances.
   */
  static readFeaturesFromWKB(wkbObject: unknown, options: ReadOptions | undefined): Feature<Geometry>[] {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new FormatWkb().readFeatures(wkbObject as any, options);
  }

  /**
   * Default drawing style for GeoView
   * @returns {Style} An Open Layers styling for drawing on a map
   */
  static getDefaultDrawingStyle(strokeColor?: Color | string, strokeWidth?: number, fillColor?: Color | string): Style {
    return new Style({
      stroke: new Stroke({
        color: strokeColor || 'orange',
        width: strokeWidth || 2,
      }),
      fill: new Fill({
        color: fillColor || 'transparent',
      }),
      image: new Circle({
        radius: 4,
        fill: new Fill({
          color: fillColor || 'orange',
        }),
        stroke: new Stroke({
          color: strokeColor || 'orange',
          width: strokeWidth || 2,
        }),
      }),
    });
  }

  // #endregion GEOMETRY

  /**
   * Create empty basemap tilelayer to use as initial basemap while we load basemap
   * so the viewer will not fails if basemap is not avialable
   *
   * @returns {TileLayer<XYZ>} The created empty basemap
   */
  static createEmptyBasemap(): TileLayer<XYZ | OSM | VectorTile> {
    // create empty tilelayer to use as initial basemap while we load basemap
    const emptyBasemap: TypeBasemapLayer = {
      basemapId: 'empty',
      source: new XYZ(),
      type: 'empty',
      opacity: 0,
      resolutions: [],
      origin: [],
      minScale: 0,
      maxScale: 17,
      extent: [0, 0, 0, 0],
    };
    const emptyLayer = new TileLayer(emptyBasemap);
    emptyLayer.set('mapId', 'basemap');

    return emptyLayer;
  }

  /**
   * This method gets the legend styles used by the the layer as specified by the style configuration.
   * @param {TypeLayerStyleConfig} styleConfig - Layer style configuration.
   * @returns {Promise<TypeVectorLayerStyles>} A promise that the layer styles are processed.
   */
  // TODO: Cleanup - This function doesn't seem to be used anywhere?
  static getLegendStylesFromConfig(styleConfig: TypeLayerStyleConfig): Promise<TypeVectorLayerStyles> {
    return GeoviewRenderer.getLegendStyles(styleConfig);
  }

  /**
   * Format the coordinates for degrees - minutes - seconds (lat, long)
   * @param {number} value the value to format
   * @returns {string} the formatted value
   */
  static coordFormatDMS(value: number): string {
    // degree char
    const deg = String.fromCharCode(176);

    const d = Math.floor(Math.abs(value)) * (value < 0 ? -1 : 1);
    const m = Math.floor(Math.abs((value - d) * 60));
    const s = Math.round((Math.abs(value) - Math.abs(d) - m / 60) * 3600);
    return `${Math.abs(d)}${deg} ${m >= 10 ? `${m}` : `0${m}`}' ${s >= 10 ? `${s}` : `0${s}`}"`;
  }

  /**
   * Converts a TypeFeatureStyle to an Open Layers Style object.
   * @returns an Open Layers styling for drawing on a map or undefined
   */
  static convertTypeFeatureStyleToOpenLayersStyle(style?: TypeFeatureStyle): Style {
    // TODO: Refactor - This function could also be used by vector class when it works with the styling
    // GV So I'm putting it in this utilities class so that it eventually becomes shared between vector
    // GV class and interactions classes.
    // Redirect
    return this.getDefaultDrawingStyle(style?.strokeColor, style?.strokeWidth, style?.fillColor);
  }

  // #region EXTENT
  /**
   * Check if a point is contained in an extent
   * @param {Coordinate} point - The point
   * @param {Extent} extent - The extent
   * @returns True if point is within the extent, false otherwise
   */
  static isPointInExtent(point: Coordinate, extent: Extent): boolean {
    return containsCoordinate(extent, point);
  }

  /**
   * Returns the union of 2 extents.
   * @param {Extent | undefined} extentA First extent
   * @param {Extent | undefined} extentB Optional second extent
   * @returns {Extent | undefined} The union of the extents
   */
  static getExtentUnion(extentA: Extent | undefined, extentB?: Extent | undefined): Extent | undefined {
    // If no A, return B which may be undefined too
    if (!extentA) return extentB;

    // If no B, return A
    if (!extentB) return extentA;

    // Return the union of A and B
    return [
      Math.min(extentA[0], extentB[0]),
      Math.min(extentA[1], extentB[1]),
      Math.max(extentA[2], extentB[2]),
      Math.max(extentA[3], extentB[3]),
    ];
  }

  /**
   * Returns the intersection of 2 extents.
   * @param {Extent | undefined} extentA First extent
   * @param {Extent | undefined} extentB Optional second extent
   * @returns {Extent | undefined} The intersection of the extents
   */
  static getExtentIntersection(extentA: Extent | undefined, extentB?: Extent | undefined): Extent | undefined {
    // If no B, return A
    if (!extentB) return extentA;

    // If no A, return B which may be undefined too
    if (!extentA) return extentB;

    // Return the intersection of A and B
    return [
      Math.max(extentA[0], extentB[0]),
      Math.max(extentA[1], extentB[1]),
      Math.min(extentA[2], extentB[2]),
      Math.min(extentA[3], extentB[3]),
    ];
  }

  /**
   * Converts an extent to a polygon
   * @param {Extent} extent - The extent to convert
   * @returns {Polygon} The created polygon
   */
  static extentToPolygon(extent: Extent): Polygon {
    const polygon = new Polygon([
      [
        [extent[0], extent[1]],
        [extent[0], extent[3]],
        [extent[2], extent[3]],
        [extent[2], extent[1]],
      ],
    ]);
    return polygon;
  }

  /**
   * Converts a polygon to an extent
   * @param {Polygon} polygon - The polygon to convert
   * @returns {Extent} The created extent
   */
  static polygonToExtent(polygon: Polygon): Extent {
    const outerRing = polygon.getCoordinates()[0];
    let minx = outerRing[0][0];
    let miny = outerRing[0][1];
    let maxx = outerRing[0][0];
    let maxy = outerRing[0][1];
    for (let i = 1; i < outerRing.length; i++) {
      minx = Math.min(outerRing[i][0], minx);
      miny = Math.min(outerRing[i][1], miny);
      maxx = Math.max(outerRing[i][0], maxx);
      maxy = Math.max(outerRing[i][1], maxy);
    }
    const extent: Extent = [minx, miny, maxx, maxy];
    return extent;
  }

  /**
   * Checks validity of lat long, LCC, or Web Mercator extent and updates values if invalid.
   * @param {Extent} extent - The extent to validate.
   * @param {string} code - The projection code of the extent. Default EPSG:4326.
   * @returns {Extent} The validated extent
   */
  static validateExtent(extent: Extent, code: string = 'EPSG:4326'): Extent {
    // Max extents for projections
    const maxExtents: Record<string, number[]> = {
      'EPSG:4326': [-180, -90, 180, 90],
      'EPSG:3857': [-20037508.3427892, -20037508.3427892, 20037508.3427892, 20037508.3427892],
      'EPSG:3978': [-7192737.96, -3004297.73, 5183275.29, 4484204.83],
    };

    let validatedExtent: Extent;
    // In rare cases, services return 'NaN' as extents, not picked up by Number.isNan
    if (typeof extent[0] !== 'number') validatedExtent = maxExtents[code];
    else {
      // Replace any invalid entries with maximum value
      const minX = extent[0] < maxExtents[code][0] || extent[0] === -Infinity || Number.isNaN(extent[0]) ? maxExtents[code][0] : extent[0];
      const minY = extent[1] < maxExtents[code][1] || extent[1] === -Infinity || Number.isNaN(extent[1]) ? maxExtents[code][1] : extent[1];
      const maxX = extent[2] > maxExtents[code][2] || extent[2] === Infinity || Number.isNaN(extent[2]) ? maxExtents[code][2] : extent[2];
      const maxY = extent[3] > maxExtents[code][3] || extent[3] === Infinity || Number.isNaN(extent[3]) ? maxExtents[code][3] : extent[3];

      // Check the order
      validatedExtent = [minX < maxX ? minX : maxX, minY < maxY ? minY : maxY, maxX > minX ? maxX : minX, maxY > minY ? maxY : minY];
    }

    return validatedExtent;
  }

  /**
   * Validates lat long, LCC, or Web Mercator extent if it is defined.
   * @param {Extent} extent - The extent to validate.
   * @param {string} code - The projection code of the extent. Default EPSG:4326.
   * @returns {Extent | undefined} The validated extent if it was defined.
   */
  static validateExtentWhenDefined(extent: Extent | undefined, code: string = 'EPSG:4326'): Extent | undefined {
    // Validate extent if it is defined
    if (extent) return this.validateExtent(extent, code);
    return undefined;
  }

  /**
   * Checks if a given extent is long/lat.
   * @param {Extent} extent - The extent to check.
   * @returns {boolean} Whether or not the extent is long/lat
   */
  static isExtentLonLat(extent: Extent): boolean {
    if (
      extent.length === 4 &&
      extent[0] >= -180 &&
      extent[0] <= 180 &&
      extent[1] >= -90 &&
      extent[1] <= 90 &&
      extent[2] >= -180 &&
      extent[2] <= 180 &&
      extent[3] >= -90 &&
      extent[3] <= 90
    )
      return true;
    return false;
  }

  // #endregion EXTENT

  /**
   * Gets the area of a given geometry
   * @param {Geometry} geometry the geometry to calculate the area
   * @returns the area of the given geometry
   */
  static getArea(geometry: Geometry): number {
    // Note that the geometry.getLength() and geometry.getArea() methods return measures of projected (planar) geometries.
    // These can be very different than on-the-ground measures in certain situations — in northern and southern latitudes
    // using Web Mercator for example. For better results, use the functions in the ol/sphere module.
    return getAreaOL(geometry);
  }

  /**
   * Gets the length of a given geometry
   * @param {Geometry} geometry the geometry to calculate the length
   * @returns the length of the given geometry
   */
  static getLength(geometry: Geometry): number {
    // Note that the geometry.getLength() and geometry.getArea() methods return measures of projected (planar) geometries.
    // These can be very different than on-the-ground measures in certain situations — in northern and southern latitudes
    // using Web Mercator for example. For better results, use the functions in the ol/sphere module.
    return getLengthOL(geometry);
  }

  /**
   * Calculates distance along a path define by array of Coordinates
   * @param  {Coordinate[]} coordinates - Array of corrdinates
   * @param {string} inProj - Input projection (EPSG:4326, EPSG:3978, ESPG:3857)
   * @param {string} outProj - Output projection (EPSG:3978, ESPG:3857)
   * @returns { total: number; sections: number[] } - The total distance in kilometers and distance for each section
   */
  static calculateDistance(coordinates: Coordinate[], inProj: string, outProj: string): { total: number; sections: number[] } {
    const arr = Projection.transformPoints(coordinates, inProj, outProj);

    const geom = new LineString(arr);
    const sections: number[] = [];
    geom.forEachSegment((start, end) => {
      sections.push(Math.round((this.getLength(new LineString([start, end])) / 1000) * 100) / 100);
    });

    return { total: Math.round((this.getLength(geom) / 1000) * 100) / 100, sections };
  }

  /**
   * Gets meters per pixel for different projections
   * @param {TypeValidMapProjectionCodes} projection - The projection of the map
   * @param {number} resolution - The resolution of the map
   * @param {number?} lat - The latitude, only needed for Web Mercator
   * @returns {number} Number representing meters per pixel
   */
  static getMetersPerPixel(projection: TypeValidMapProjectionCodes, resolution: number, lat?: number): number {
    if (!resolution) return 0;

    // Web Mercator needs latitude correction because of severe distortion at high latitudes
    // At latitude 60°N, the scale distortion factor is about 2:1
    if (projection === 3857 && lat !== undefined) {
      const latitudeCorrection = Math.cos((lat * Math.PI) / 180);
      return resolution * latitudeCorrection;
    }

    // LCC (and other meter-based projections) can use resolution directly
    return resolution;
  }

  /**
   * Converts a map scale to zoom level
   * @param view The view for converting the scale
   * @param targetScale The desired scale (e.g. 50000 for 1:50,000)
   * @returns number representing the closest zoom level for the given scale
   */
  static getZoomFromScale(view: View, targetScale: number | undefined, dpiValue?: number): number | undefined {
    if (!targetScale) return undefined;
    const projection = view.getProjection();
    const mpu = projection.getMetersPerUnit();
    const dpi = dpiValue ?? 25.4 / 0.28; // OpenLayers default DPI

    // Calculate resolution from scale
    if (!mpu) return undefined;
    // Resolution = Scale / ( metersPerUnit * inchesPerMeter * DPI )
    const targetResolution = targetScale / (mpu * 39.37 * dpi);

    return view.getZoomForResolution(targetResolution) || undefined;
  }

  /**
   * Converts a map scale to zoom level
   * @param view The view for converting the zoom
   * @param zoom The desired zoom (e.g. 50000 for 1:50,000)
   * @returns number representing the closest scale for the given zoom number
   */
  // TODO: Cleanup - This function doesn't seem to be used anywhere?
  static getScaleFromZoom(view: View, zoom: number): number | undefined {
    const projection = view.getProjection();
    const mpu = projection.getMetersPerUnit();
    if (!mpu) return undefined;

    const dpi = 25.4 / 0.28; // OpenLayers default DPI

    // Get resolution for zoom level
    const resolution = view.getResolutionForZoom(zoom);

    // Calculate scale from resolution
    // Scale = Resolution * metersPerUnit * inchesPerMeter * DPI
    return resolution * mpu * 39.37 * dpi;
  }

  /**
   * Gets map scale for Web Mercator or Lambert Conformal Conic projections
   * @param view The view to get the current scale from
   * @returns number representing scale (e.g. 50000 for 1:50,000)
   */
  // TODO: Cleanup - This function doesn't seem to be used anywhere?
  static getMapScale(view: View): number | undefined {
    return this.getScaleFromZoom(view, view.getZoom() || 0);
  }

  /**
   * Gets the pointer position information from a Map Event and a specified projection.
   * @param {MapEvent} mapEvent - The map event
   * @param {string} projCode - The map projection code
   * @returns {TypeMapMouseInfo} An object representing pointer position information
   */
  static getPointerPositionFromMapEvent(mapEvent: MapBrowserEvent, projCode: string): TypeMapMouseInfo {
    // Return an object representing pointer position information
    return {
      projected: mapEvent.coordinate,
      pixel: mapEvent.pixel,
      lonlat: Projection.transformPoints([mapEvent.coordinate], projCode, Projection.PROJECTION_NAMES.LONLAT)[0],
      dragging: mapEvent.dragging,
    };
  }

  /**
   * Function for checking if two geometries have the same coordinates
   * @param {Geometry} geom1 - The first geometry
   * @param {Geometry} geom2 - The second geometry
   * @returns {boolean} Whether the two geometries are equal or not
   */
  static geometriesAreEqual(geom1: Geometry, geom2: Geometry): boolean {
    if (geom1.getType() !== geom2.getType()) return false;

    if (geom1 instanceof Point || geom1 instanceof LineString || geom1 instanceof Polygon) {
      const coords1 = geom1.getCoordinates();
      const coords2 = (geom2 as Point | LineString | Polygon).getCoordinates();
      return JSON.stringify(coords1) === JSON.stringify(coords2);
    }

    return false;
  }

  /**
   * Apply buffer to extent
   * @param extent - The extent to check and buffer
   * @param bufferSize - Buffer size in map units (default: 5000)
   * @returns Buffered extent
   */
  static bufferExtent(extent: Extent, bufferSize: number = 5000): Extent {
    return buffer(extent, bufferSize);
  }

  /**
   * Serializes an OpenLayers geometry into a GML3 string.
   * This method uses the OpenLayers `GML3` format to convert the provided
   * `Geometry` object into a GML XML string, using the specified spatial
   * reference system (`srsName`).
   * @param {Geometry} geometry - The OpenLayers geometry to serialize.
   * @param {string} srsName - The spatial reference system (e.g., 'EPSG:3857')
   *                            to assign to the GML geometry.
   * @returns {string} The serialized GML geometry as a string.
   */
  static writeGeometryToGML(geometry: Geometry, srsName: string): string {
    // GV I've tried a simplified approach for this function, even some suggested by AI, and they all failed to some degree.
    // GV Sometimes doubling nodes like <Polygon> or sometimes adding extra node level like <geom> or sometimes forgetting the srsName attribute at the root.
    // GV This iteration seems the most stable.

    // Serialize to GML
    const gmlFormat = new GML3({ srsName });

    // Create a dummy parent node
    const doc = document.implementation.createDocument('http://www.opengis.net/gml', 'dummy', null);

    // Write geometry inside the dummy node
    gmlFormat.writeGeometryElement(doc.documentElement, geometry, []);

    // Grab the actual geometry node (first child of dummy)
    const geomNode = doc.documentElement.firstChild as Element;

    if (!geomNode) {
      throw new Error('Failed to generate GML geometry');
    }

    // Explicitly set the srsName on the geometry element
    geomNode.setAttribute('srsName', srsName);

    // Serialize and return
    return new XMLSerializer().serializeToString(geomNode);
  }
}

/** The type for the function callback for getWMSServiceMetadata() */
export type CallbackNewMetadataDelegate = (proxyUsed: string) => void;
