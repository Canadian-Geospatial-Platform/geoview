import type { Feature, MapBrowserEvent } from 'ol';
import type { ReadOptions } from 'ol/format/Feature';
import type Geometry from 'ol/geom/Geometry';
import { Style } from 'ol/style';
import type { Color } from 'ol/color';
import type { Extent } from 'ol/extent';
import type { OSM, VectorTile } from 'ol/source';
import { XYZ } from 'ol/source';
import TileLayer from 'ol/layer/Tile';
import { Polygon } from 'ol/geom';
import type { Coordinate } from 'ol/coordinate';
import type { TypeFeatureStyle } from '@/geo/layer/geometry/geometry-types';
import type { TypeOutfields, TypeStyleGeometry, TypeValidMapProjectionCodes } from '@/api/types/map-schema-types';
import type { TypeMetadataWMS, TypeStylesWMS } from '@/api/types/layer-schema-types';
import type { TypeMapMouseInfo } from '@/geo/map/map-viewer';
export declare const layerTypes: Record<"CSV" | "ESRI_DYNAMIC" | "ESRI_FEATURE" | "ESRI_IMAGE" | "IMAGE_STATIC" | "GEOJSON" | "GEOTIFF" | "KML" | "XYZ_TILES" | "VECTOR_TILES" | "OGC_FEATURE" | "WFS" | "WKB" | "WMS", import("@/api/types/layer-schema-types").TypeGeoviewLayerType>;
export declare abstract class GeoUtilities {
    #private;
    /**
     * Extracts the base URL (origin + pathname) from a full URL string,
     * removing any query parameters, hash fragments, or authentication data.
     * @param {string} url - The full URL string to process.
     * @returns {string} The normalized base URL consisting of the origin and pathname.
     */
    static getBaseUrl(url: string): string;
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
    static ensureServiceRequestUrl(url: string, service: string, request: string, version?: string): string;
    /**
     * Builds a complete GetCapabilities URL for a specific OGC service.
     * @param {string} url - The base service URL.
     * @param {string} service - The service type (e.g., "WMS", "WFS").
     * @param {string} [layers] - Optional layer name(s) to include in the request.
     * @returns {string} A fully qualified GetCapabilities request URL.
     */
    static ensureServiceRequestUrlGetCapabilities(url: string, service: string, layers?: string): string;
    /**
     * Builds a complete GetStyles URL for a WMS service.
     * @param {string} url - The base WMS service URL.
     * @param {string} [layers] - Optional layer name(s) to include in the request.
     * @param {string} [version] - Optional WMS version.
     * @returns {string} A fully qualified GetStyles request URL.
     */
    static ensureServiceRequestUrlGetStyles(url: string, layers?: string, version?: string): string;
    /**
     * Builds a complete GetLegendGraphic URL for a WMS service.
     * @param {string} url - The base WMS service URL.
     * @param {string} layerId - The layer name for which to retrieve the legend.
     * @param {string} version - The WMS version.
     * @param {string} [format] - Optional image format for the legend (e.g., "image/png").
     * @returns {string} A fully qualified GetLegendGraphic request URL.
     */
    static ensureServiceRequestUrlGetLegendGraphic(url: string, layerId: string, version: string, format?: string): string;
    /**
     * Builds a complete DescribeFeatureType URL for a WFS service.
     * @param {string} url - The base WFS service URL.
     * @param {string} layerId - The layer or feature type name to describe.
     * @param {string} version - The WFS version.
     * @param {string} [outputFormat] - Optional output format (e.g., "application/json", "text/xml").
     * @returns {string} A fully qualified DescribeFeatureType request URL.
     */
    static ensureServiceRequestUrlDescribeFeatureType(url: string, layerId: string, version: string, outputFormat: string | undefined): string;
    /**
     * Builds a complete GetFeature URL for a WMS/WFS service.
     * @param {string} url - The base WFS service URL.
     * @param {string} layerId - The layer or feature type name to request.
     * @param {string} version - The WFS version.
     * @param {string} [outputFormat] - Optional output format (e.g., "application/json").
     * @returns {string} A fully qualified GetFeature request URL.
     */
    static ensureServiceRequestUrlGetFeature(url: string, layerId: string, version: string, outputFormat: string | undefined, outfields: TypeOutfields[] | undefined, xmlFilter: string | undefined, outputProjectionCode: string | undefined): string;
    /**
     * Fetch the json response from the ESRI map server to get REST endpoint metadata.
     * @param {string} url - The url of the ESRI map server.
     * @returns {Promise<unknown>} A json promise containing the result of the query.
     */
    static getESRIServiceMetadata(url: string): Promise<unknown>;
    /**
     * Fetch the json response from the XML response of a WMS getCapabilities request.
     * @param {string} url - The url the url of the WMS server.
     * @param {CallbackNewMetadataDelegate?} [callbackNewMetadataUrl] - Callback executed when a proxy had to be used to fetch the metadata.
     * The parameter sent in the callback is the proxy prefix with the '?' at the end.
     * @param {AbortSignal?} [abortSignal] - Abort signal to handle cancelling of the process.
     * @returns {Promise<TypeMetadataWMS>} A json promise containing the result of the query.
     * @throws {RequestTimeoutError} When the request exceeds the timeout duration.
     * @throws {RequestAbortedError} When the request was aborted by the caller's signal.
     * @throws {ResponseError} When the response is not OK (non-2xx).
     * @throws {ResponseEmptyError} When the JSON response is empty.
     * @throws {NetworkError} When a network issue happened.
     */
    static getWMSServiceString(url: string, callbackNewMetadataUrl?: CallbackNewMetadataDelegate, abortSignal?: AbortSignal): Promise<string>;
    /**
     * Fetch the json response from the XML response of a WMS getCapabilities request.
     * @param {string} url - The url the url of the WMS server.
     * @param {string} layers - The layers to query separate by.
     * @param {CallbackNewMetadataDelegate?} [callbackNewMetadataUrl] - Callback executed when a proxy had to be used to fetch the metadata.
     * The parameter sent in the callback is the proxy prefix with the '?' at the end.
     * @param {AbortSignal?} [abortSignal] - Abort signal to handle cancelling of the process.
     * @returns {Promise<TypeMetadataWMS>} A json promise containing the result of the query.
     * @throws {RequestTimeoutError} When the request exceeds the timeout duration.
     * @throws {RequestAbortedError} When the request was aborted by the caller's signal.
     * @throws {ResponseError} When the response is not OK (non-2xx).
     * @throws {ResponseEmptyError} When the JSON response is empty.
     * @throws {NetworkError} When a network issue happened.
     */
    static getWMSServiceMetadata(url: string, layers?: string, callbackNewMetadataUrl?: CallbackNewMetadataDelegate, abortSignal?: AbortSignal): Promise<TypeMetadataWMS>;
    /**
     * Fetch the json response from the XML response of a WMS getCapabilities request.
     * @param {string} url - The url the url of the WMS server.
     * @param {string} layers - The layers to query separate by.
     * @param {CallbackNewMetadataDelegate?} [callbackNewMetadataUrl] - Callback executed when a proxy had to be used to fetch the metadata.
     * The parameter sent in the callback is the proxy prefix with the '?' at the end.
     * @param {AbortSignal?} [abortSignal] - Abort signal to handle cancelling of the process.
     * @returns {Promise<TypeStylesWMS>} A json promise containing the result of the query.
     * @throws {RequestTimeoutError} When the request exceeds the timeout duration.
     * @throws {RequestAbortedError} When the request was aborted by the caller's signal.
     * @throws {ResponseError} When the response is not OK (non-2xx).
     * @throws {ResponseEmptyError} When the JSON response is empty.
     * @throws {NetworkError} When a network issue happened.
     */
    static getWMSServiceStyles(url: string, layers?: string, callbackNewMetadataUrl?: CallbackNewMetadataDelegate, abortSignal?: AbortSignal): Promise<TypeStylesWMS>;
    /**
     * Return the map server url from a layer service.
     * @param {string} url - The service url for a wms / dynamic or feature layers.
     * @param {boolean} rest - Boolean value to add rest services if not present (default false).
     * @returns {string} The map server url.
     * @deprecated
     */
    static getMapServerUrl(url: string, rest?: boolean): string;
    /**
     * Return the root server url from a OGC layer service.
     * @param {string} url - The service url for an ogc layer.
     * @returns {string} The root ogc server url.
     * @deprecated
     */
    static getOGCServerUrl(url: string): string;
    /**
     * Replaces or adds the BBOX parameter in a WMS GetMap URL.
     * @param {string} url - The original WMS GetMap URL
     * @param {string} newCRS - The new CRS
     * @param {number[]} newBBOX - The new BBOX to set, as an array of 4 numbers: [minX, minY, maxX, maxY]
     * @returns {string} A new URL string with the updated BBOX parameter
     */
    static replaceCRSandBBOXParam(url: string, newCRS: string, newBBOX: number[]): string;
    /**
     * Returns the WKT representation of a given geometry.
     * @param {string} geometry - The geometry
     * @returns {string | undefined} The WKT representation of the geometry
     */
    static geometryToWKT(geometry: Geometry): string | undefined;
    /**
     * Returns the Geometry representation of a given wkt.
     * @param {string} wkt - The well known text
     * @param {ReadOptions} readOptions - Read options to convert the wkt to a geometry
     * @returns {Geometry | undefined} The Geometry representation of the wkt
     */
    static wktToGeometry(wkt: string, readOptions: ReadOptions): Geometry | undefined;
    /**
     * Returns the Geometry representation of a given geojson
     * @param {string} geojson - The geojson
     * @param {ReadOptions} readOptions - Read options to convert the geojson to a geometry
     * @returns {Geometry | undefined} - The Geometry representation of the geojson
     */
    static geojsonToGeometry(geojson: string, readOptions: ReadOptions): Geometry | undefined;
    /**
     * Checks whether a given value is a valid GeoJSON FeatureCollection object.
     * @param {any} value - The value to test (can be any type).
     * @returns {boolean} `true` if the value appears to be a GeoJSON FeatureCollection, otherwise `false`.
     */
    static isGeoJSONObject(value: any): boolean;
    /**
     * Extracts the EPSG code from a GeoJSON object's CRS definition.
     * Accepts either a GeoJSON object or a JSON string. If the GeoJSON contains
     * a `crs` entry with a `properties.name` field in the form
     * `"urn:ogc:def:crs:EPSG::<code>"`, it is normalized to `"EPSG:<code>"`.
     * @param {object|string} geojson - A GeoJSON object or a JSON string representing one.
     * @returns {string|undefined} The normalized EPSG code (e.g., `"EPSG:3005"`), or
     * `undefined` if the CRS is not defined.
     */
    static readEPSGOfGeoJSON(geojson: any): string | undefined;
    /**
     * Extracts the EPSG code from a GeoJSON object's CRS definition.
     * Accepts either a GeoJSON object or a JSON string. If the GeoJSON contains
     * a `crs` entry with a `properties.name` field in the form
     * `"urn:ogc:def:crs:EPSG::<code>"`, it is normalized to `"EPSG:<code>"`.
     * @param {object|string} geojson - A GeoJSON object or a JSON string representing one.
     * @returns {string|undefined} The normalized EPSG code (e.g., `"EPSG:3005"`), or
     * `undefined` if the CRS is not defined.
     */
    static readEPSGOfGML(gml: any): string | undefined;
    /**
     * Reads OpenLayers features from an Esri features object.
     * @param {unknown} features - The Features data to read.
     * @param {import('ol/format/Feature').ReadOptions} [options] - Optional read options such as projection or extent.
     * @returns {import('ol/Feature').default[]} An array of parsed OpenLayers Feature instances.
     */
    static readFeaturesFromEsriJSON(features: unknown, options: ReadOptions | undefined): Feature<Geometry>[];
    /**
     * Reads OpenLayers features from a GeoJSON object.
     * @param {unknown} geojson - The GeoJSON data to read.
     * @param {import('ol/format/Feature').ReadOptions} [options] - Optional read options such as projection or extent.
     * @returns {import('ol/Feature').default[]} An array of parsed OpenLayers Feature instances.
     */
    static readFeaturesFromGeoJSON(geojson: unknown, options: ReadOptions | undefined): Feature<Geometry>[];
    /**
     * Reads OpenLayers features from an WFS features object.
     * @param {unknown} features - The Features data to read.
     * @param {import('ol/format/Feature').ReadOptions} [options] - Optional read options such as projection or extent.
     * @returns {import('ol/Feature').default[]} An array of parsed OpenLayers Feature instances.
     */
    static readFeaturesFromWFS(features: unknown, version: string, options: ReadOptions | undefined): Feature<Geometry>[];
    /**
     * Reads OpenLayers features from a WKBObject object.
     * @param {string | ArrayBuffer | ArrayBufferView<ArrayBufferLike>} wkbObject - The WKBObject data to read.
     * @param {import('ol/format/Feature').ReadOptions} [options] - Optional read options such as projection or extent.
     * @returns {import('ol/Feature').default[]} An array of parsed OpenLayers Feature instances.
     */
    static readFeaturesFromWKB(wkbObject: string | ArrayBuffer | ArrayBufferView<ArrayBufferLike>, options: ReadOptions | undefined): Feature<Geometry>[];
    /**
     * Reads OpenLayers features from a KML object.
     * @param {unknown} kmlObject - The KML data to read.
     * @param {import('ol/format/Feature').ReadOptions} [options] - Optional read options such as projection or extent.
     * @returns {import('ol/Feature').default[]} An array of parsed OpenLayers Feature instances.
     */
    static readFeaturesFromKML(kmlObject: unknown, options: ReadOptions | undefined): Feature<Geometry>[];
    /**
     * Default drawing style for GeoView
     * @returns {Style} An Open Layers styling for drawing on a map
     */
    static getDefaultDrawingStyle(strokeColor?: Color | string, strokeWidth?: number, fillColor?: Color | string): Style;
    /**
     * Create empty basemap tilelayer to use as initial basemap while we load basemap
     * so the viewer will not fails if basemap is not avialable
     *
     * @returns {TileLayer<XYZ>} The created empty basemap
     */
    static createEmptyBasemap(): TileLayer<XYZ | OSM | VectorTile>;
    /**
     * Format the coordinates for degrees - minutes - seconds (lat, long)
     * @param {number} value the value to format
     * @returns {string} the formatted value
     */
    static coordFormatDMS(value: number): string;
    /**
     * Converts a TypeFeatureStyle to an Open Layers Style object.
     * @returns an Open Layers styling for drawing on a map or undefined
     */
    static convertTypeFeatureStyleToOpenLayersStyle(style?: TypeFeatureStyle): Style;
    /**
     * Check if a point is contained in an extent
     * @param {Coordinate} point - The point
     * @param {Extent} extent - The extent
     * @returns True if point is within the extent, false otherwise
     */
    static isPointInExtent(point: Coordinate, extent: Extent): boolean;
    /**
     * Returns the union of 2 extents.
     * @param {Extent | undefined} extentA First extent
     * @param {Extent | undefined} extentB Optional second extent
     * @returns {Extent | undefined} The union of the extents
     */
    static getExtentUnion(extentA: Extent | undefined, extentB?: Extent | undefined): Extent | undefined;
    /**
     * Returns the intersection of 2 extents.
     * @param {Extent | undefined} extentA First extent
     * @param {Extent | undefined} extentB Optional second extent
     * @returns {Extent | undefined} The intersection of the extents
     */
    static getExtentIntersection(extentA: Extent | undefined, extentB?: Extent | undefined): Extent | undefined;
    /**
     * Converts an extent to a polygon
     * @param {Extent} extent - The extent to convert
     * @returns {Polygon} The created polygon
     */
    static extentToPolygon(extent: Extent): Polygon;
    /**
     * Converts a polygon to an extent
     * @param {Polygon} polygon - The polygon to convert
     * @returns {Extent} The created extent
     */
    static polygonToExtent(polygon: Polygon): Extent;
    /**
     * Checks validity of lat long, LCC, or Web Mercator extent and updates values if invalid.
     * @param {Extent} extent - The extent to validate.
     * @param {string} code - The projection code of the extent. Default EPSG:4326.
     * @returns {Extent} The validated extent
     */
    static validateExtent(extent: Extent, code?: string): Extent;
    /**
     * Validates lat long, LCC, or Web Mercator extent if it is defined.
     * @param {Extent} extent - The extent to validate.
     * @param {string} code - The projection code of the extent. Default EPSG:4326.
     * @returns {Extent | undefined} The validated extent if it was defined.
     */
    static validateExtentWhenDefined(extent: Extent | undefined, code?: string): Extent | undefined;
    /**
     * Checks if a given extent is long/lat.
     * @param {Extent} extent - The extent to check.
     * @returns {boolean} Whether or not the extent is long/lat
     */
    static isExtentLonLat(extent: Extent): boolean;
    /**
     * Gets the area of a given geometry
     * @param {Geometry} geometry the geometry to calculate the area
     * @returns the area of the given geometry
     */
    static getArea(geometry: Geometry): number;
    /**
     * Gets the length of a given geometry
     * @param {Geometry} geometry the geometry to calculate the length
     * @returns the length of the given geometry
     */
    static getLength(geometry: Geometry): number;
    /**
     * Calculates distance along a path define by array of Coordinates
     * @param  {Coordinate[]} coordinates - Array of corrdinates
     * @param {string} inProj - Input projection (EPSG:4326, EPSG:3978, ESPG:3857)
     * @param {string} outProj - Output projection (EPSG:3978, ESPG:3857)
     * @returns { total: number; sections: number[] } - The total distance in kilometers and distance for each section
     */
    static calculateDistance(coordinates: Coordinate[], inProj: string, outProj: string): {
        total: number;
        sections: number[];
    };
    /**
     * Gets meters per pixel for different projections
     * @param {TypeValidMapProjectionCodes} projection - The projection of the map
     * @param {number} resolution - The resolution of the map
     * @param {number?} lat - The latitude, only needed for Web Mercator
     * @returns {number} Number representing meters per pixel
     */
    static getMetersPerPixel(projection: TypeValidMapProjectionCodes, resolution: number, lat?: number): number;
    /**
     * Gets the pointer position information from a Map Event and a specified projection.
     * @param {MapEvent} mapEvent - The map event
     * @param {string} projCode - The map projection code
     * @returns {TypeMapMouseInfo} An object representing pointer position information
     */
    static getPointerPositionFromMapEvent(mapEvent: MapBrowserEvent, projCode: string): TypeMapMouseInfo;
    /**
     * Function for checking if two geometries have the same coordinates
     * @param {Geometry} geom1 - The first geometry
     * @param {Geometry} geom2 - The second geometry
     * @returns {boolean} Whether the two geometries are equal or not
     */
    static geometriesAreEqual(geom1: Geometry, geom2: Geometry): boolean;
    /**
     * Apply buffer to extent
     * @param extent - The extent to check and buffer
     * @param bufferSize - Buffer size in map units (default: 5000)
     * @returns Buffered extent
     */
    static bufferExtent(extent: Extent, bufferSize?: number): Extent;
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
    static writeGeometryToGML(geometry: Geometry, srsName: string): string;
    /**
     * Converts a WFS geometry type string to a TypeStyleGeometry.
     * @param {string} wfsGeometryType - The wfs geometry type to convert
     * @returns {TypeStyleGeometry} The corresponding TypeStyleGeometry
     * @throws {NotSupportedError} When the geometry type is not supported.
     */
    static wfsConvertGeometryTypeToOLGeometryType(wfsGeometryType: string): TypeStyleGeometry;
    /**
     * Converts an esri geometry type string to a TypeStyleGeometry.
     * @param {string} esriGeometryType - The esri geometry type to convert
     * @returns {TypeStyleGeometry} The corresponding TypeStyleGeometry
     * @throws {NotSupportedError} When the geometry type is not supported.
     */
    static esriConvertEsriGeometryTypeToOLGeometryType(esriGeometryType: string): TypeStyleGeometry;
}
/** The type for the function callback for getWMSServiceMetadata() */
export type CallbackNewMetadataDelegate = (proxyUsed: string) => void;
//# sourceMappingURL=utilities.d.ts.map