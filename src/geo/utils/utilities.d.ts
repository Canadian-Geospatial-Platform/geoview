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
import type { TypeMapMouseInfo, TypeOutfields, TypeStyleGeometry, TypeValidMapProjectionCodes } from '@/api/types/map-schema-types';
import type { TypeGeoviewLayerType, TypeMetadataWMS, TypeStylesWMS } from '@/api/types/layer-schema-types';
import type { TypeMetadataWMTS } from '@/api/config/validation-classes/raster-validation-classes/ogc-wmts-layer-entry-config';
import type { TypeLegend } from '@/core/stores/store-interface-and-intial-values/layer-state';
import type { TypeLegendItem, TypeLegendLayerItem } from '@/core/components/layers/types';
import type { TypeVectorLayerStyles } from './renderer/geoview-renderer';
export declare const layerTypes: Record<"CSV" | "KML" | "WKB" | "ESRI_DYNAMIC" | "ESRI_FEATURE" | "ESRI_IMAGE" | "IMAGE_STATIC" | "GEOJSON" | "GEOTIFF" | "XYZ_TILES" | "VECTOR_TILES" | "OGC_FEATURE" | "WFS" | "WMS" | "WMTS", TypeGeoviewLayerType>;
interface EsriJSONReadResult {
    features: Feature<Geometry>[];
    hadInvalidGeometries: boolean;
}
export declare abstract class GeoUtilities {
    #private;
    /**
     * Extracts the base URL (origin + pathname) from a full URL string,
     * removing any query parameters, hash fragments, or authentication data.
     *
     * @param url - The full URL string to process
     * @returns The normalized base URL consisting of the origin and pathname
     */
    static getBaseUrl(url: string): string;
    /**
     * Ensures a service URL includes standardized OGC parameters (`SERVICE`, `REQUEST`, `VERSION`),
     * overriding any existing ones with the correct casing and values.
     *
     * The function normalizes query parameter keys, removes lowercase variants (`service`, `request`),
     * and ensures the final URL contains correctly capitalized parameters with the specified values.
     * If the `VERSION` parameter is missing, a default value is added.
     *
     * @param url - The input service URL, which may be absolute or relative
     * @param service - The OGC service type (e.g., `"WMS"`, `"WFS"`, `"WMTS"`)
     * @param request - The OGC request type (e.g., `"GetMap"`, `"GetFeature"`, `"GetCapabilities"`)
     * @param version - The default service version to enforce if not already present
     * @returns The normalized and fully qualified service request URL
     */
    static ensureServiceRequestUrl(url: string, service: string, request: string, version?: string): string;
    /**
     * Builds a complete GetCapabilities URL for a specific OGC service.
     *
     * @param url - The base service URL
     * @param service - The service type (e.g., "WMS", "WFS")
     * @param layers - Optional layer name(s) to include in the request
     * @returns A fully qualified GetCapabilities request URL
     */
    static ensureServiceRequestUrlGetCapabilities(url: string, service: string, layers?: string): string;
    /**
     * Builds a complete GetStyles URL for a WMS service.
     *
     * @param url - The base WMS service URL
     * @param layers - Optional layer name(s) to include in the request
     * @param version - Optional WMS version
     * @returns A fully qualified GetStyles request URL
     */
    static ensureServiceRequestUrlGetStyles(url: string, layers?: string, version?: string): string;
    /**
     * Builds a complete GetLegendGraphic URL for a WMS service.
     *
     * @param url - The base WMS service URL
     * @param layerId - The layer name for which to retrieve the legend
     * @param version - The WMS version
     * @param format - Optional image format for the legend (e.g., "image/png")
     * @returns A fully qualified GetLegendGraphic request URL
     */
    static ensureServiceRequestUrlGetLegendGraphic(url: string, layerId: string, version: string, format?: string): string;
    /**
     * Builds a complete DescribeFeatureType URL for a WFS service.
     *
     * @param url - The base WFS service URL
     * @param layerId - The layer or feature type name to describe
     * @param version - The WFS version
     * @param outputFormat - Optional output format (e.g., "application/json", "text/xml")
     * @returns A fully qualified DescribeFeatureType request URL
     */
    static ensureServiceRequestUrlDescribeFeatureType(url: string, layerId: string, version: string, outputFormat: string | undefined): string;
    /**
     * Builds a complete GetFeature URL for a WMS/WFS service.
     *
     * @param url - The base WFS service URL
     * @param layerId - The layer or feature type name to request
     * @param version - The WFS version
     * @param outputFormat - Optional output format (e.g., "application/json")
     * @returns A fully qualified GetFeature request URL
     */
    static ensureServiceRequestUrlGetFeature(url: string, layerId: string, version: string, outputFormat: string | undefined, outfields: TypeOutfields[] | undefined, xmlFilter: string | undefined, outputProjectionCode: string | undefined): string;
    /**
     * Removes specified query parameters from a URL, preserving all others.
     *
     * This method normalizes a URL by stripping out any query parameters whose
     * keys match the ones provided in `removeParams`. It works even if the URL
     * contains multiple `?` or `&` characters (e.g., proxy-wrapped URLs).
     *
     * @param url - The URL to normalize
     * @param removeParams - Array of parameter names (case-insensitive)
     *   to remove from the URL
     * @returns The normalized URL with the specified parameters removed
     */
    static ensureURLForOpenLayersSource(url: string, removeParams: string[]): string;
    /**
     * Fetch the json response from the ESRI map server to get REST endpoint metadata.
     *
     * @param url - The url of the ESRI map server
     * @returns A promise that resolves with the JSON metadata from the server
     */
    static getESRIServiceMetadata(url: string): Promise<unknown>;
    /**
     * Fetch the json response from the XML response of a WMS getCapabilities request.
     *
     * @param url - The url the url of the WMS server
     * @param callbackNewMetadataUrl - Optional callback executed when a proxy had to be used to fetch the metadata.
     * The parameter sent in the callback is the proxy prefix with the '?' at the end.
     * @param abortSignal - Optional {@link AbortSignal} used to cancel the layer creation process
     * @returns A promise that resolves with the capabilities XML as a string
     * @throws {RequestTimeoutError} When the request exceeds the timeout duration.
     * @throws {RequestAbortedError} When the request was aborted by the caller's signal.
     * @throws {ResponseError} When the response is not OK (non-2xx).
     * @throws {ResponseEmptyError} When the JSON response is empty.
     * @throws {NetworkError} When a network issue happened.
     */
    static getWMSServiceString(url: string, callbackNewMetadataUrl?: CallbackNewMetadataDelegate, abortSignal?: AbortSignal): Promise<string>;
    /**
     * Fetch the json response from the XML response of a WMS getCapabilities request.
     *
     * @param url - The url the url of the WMS server
     * @param layers - The layers to query separate by
     * @param callbackNewMetadataUrl - Optional callback executed when a proxy had to be used to fetch the metadata.
     * The parameter sent in the callback is the proxy prefix with the '?' at the end.
     * @param abortSignal - Optional {@link AbortSignal} used to cancel the layer creation process
     * @returns A promise that resolves with the parsed WMS metadata
     * @throws {RequestTimeoutError} When the request exceeds the timeout duration.
     * @throws {RequestAbortedError} When the request was aborted by the caller's signal.
     * @throws {ResponseError} When the response is not OK (non-2xx).
     * @throws {ResponseEmptyError} When the JSON response is empty.
     * @throws {NetworkError} When a network issue happened.
     */
    static getWMSServiceMetadata(url: string, layers?: string, callbackNewMetadataUrl?: CallbackNewMetadataDelegate, abortSignal?: AbortSignal): Promise<TypeMetadataWMS>;
    /**
     * Fetch the json response from the XML response of a WMS getCapabilities request.
     *
     * @param url - The url the url of the WMS server.
     * @param layers - The layers to query separate by.
     * @param abortSignal - Optional abort signal to handle cancelling of the process.
     * @returns A promise that resolves with the parsed WMTS metadata
     * @throws {RequestTimeoutError} When the request exceeds the timeout duration.
     * @throws {RequestAbortedError} When the request was aborted by the caller's signal.
     * @throws {ResponseError} When the response is not OK (non-2xx).
     * @throws {ResponseEmptyError} When the JSON response is empty.
     * @throws {NetworkError} When a network issue happened.
     */
    static getWMTSServiceMetadata(url: string, layers?: string, abortSignal?: AbortSignal): Promise<TypeMetadataWMTS>;
    /**
     * Fetch the json response from the XML response of a WMS getCapabilities request.
     *
     * @param url - The url the url of the WMS server
     * @param layers - The layers to query separate by
     * @param callbackNewMetadataUrl - Optional callback executed when a proxy had to be used to fetch the metadata.
     * The parameter sent in the callback is the proxy prefix with the '?' at the end.
     * @param abortSignal - Optional {@link AbortSignal} used to cancel the layer creation process
     * @returns A promise that resolves with the parsed WMS styles
     * @throws {RequestTimeoutError} When the request exceeds the timeout duration.
     * @throws {RequestAbortedError} When the request was aborted by the caller's signal.
     * @throws {ResponseError} When the response is not OK (non-2xx).
     * @throws {ResponseEmptyError} When the JSON response is empty.
     * @throws {NetworkError} When a network issue happened.
     */
    static getWMSServiceStyles(url: string, layers?: string, callbackNewMetadataUrl?: CallbackNewMetadataDelegate, abortSignal?: AbortSignal): Promise<TypeStylesWMS>;
    /**
     * Return the map server url from a layer service.
     *
     * @param url - The service url for a wms / dynamic or feature layers
     * @param rest - Boolean value to add rest services if not present (default false)
     * @returns The map server url
     * @deprecated
     */
    static getMapServerUrl(url: string, rest?: boolean): string;
    /**
     * Return the root server url from a OGC layer service.
     *
     * @param url - The service url for an ogc layer
     * @returns The root ogc server url
     * @deprecated
     */
    static getOGCServerUrl(url: string): string;
    /**
     * Replaces or adds the BBOX parameter in a WMS GetMap URL.
     *
     * @param url - The original WMS GetMap URL
     * @param newCRS - The new CRS
     * @param newBBOX - The new BBOX to set, as an array of 4 numbers: [minX, minY, maxX, maxY]
     * @returns A new URL string with the updated BBOX parameter
     */
    static replaceCRSandBBOXParam(url: string, newCRS: string, newBBOX: number[]): string;
    /**
     * Generates legend layer icon metadata from a layer legend definition.
     *
     * This method extracts icon imagery and legend item details from the provided
     * `layerLegend`, handling both vector and non-vector legends.
     * Behavior:
     * - **Vector legends**:
     *   - Iterates through each geometry type in the legend definition.
     *   - Generates icon images from HTML canvas elements using `toDataURL()`.
     *   - Supports both `simple` and categorized style configurations.
     *   - Builds an `iconList` of {@link TypeLegendItem} entries per geometry type.
     *   - Assigns:
     *     - `iconImage` as the primary icon (first legend item)
     *     - `iconImageStacked` as the secondary icon when multiple entries exist
     * - **Non-vector legends**:
     *   - Attempts to extract a canvas image directly from `layerLegend.legend`.
     *   - Falls back to `'no data'` if no canvas is available.
     * Notes:
     * - Duplicate legend labels within categorized styles are filtered out.
     * - Visibility defaults to `true` unless explicitly set to `false`.
     * - Returns `undefined` if `layerLegend` is `null` or `undefined`.
     *
     * @param schemaTag - The layer schema type used to determine whether the legend should be interpreted as vector-based.
     * @param layerLegend - The legend configuration object associated with the layer.
     * @returns An array of legend layer item metadata containing icon images and legend entries,
     * or `undefined` if no legend is provided.
     */
    static getLayerIconImage(schemaTag: TypeGeoviewLayerType, layerLegend: TypeLegend | null | undefined): TypeLegendLayerItem[] | undefined;
    /**
     * Extracts and normalizes legend items from a collection of legend layer icons.
     *
     * This method:
     * - Flattens all `iconList` entries from the provided legend layer items.
     * - Handles special layer types (`imageStatic` and `GeoTIFF`) by dynamically
     *   creating a legend item using the `iconImage` property.
     * For `imageStatic` and `GeoTIFF` schema tags, if at least one icon is present,
     * an additional legend item is created with:
     * - `geometryType` set to `'Point'`
     * - `name` set to `'image'`
     * - `icon` set from `icons[0].iconImage`
     * - `isVisible` set to `true`
     *
     * @param schemaTag - The layer schema type used to determine
     * special handling logic (e.g., `'imageStatic'`, `'GeoTIFF'`).
     * @param icons - The list of legend layer items containing
     * optional `iconList` collections and optional `iconImage` values.
     * @returns A flattened array of legend items derived from the
     * provided icons, including any dynamically generated items for special layer types.
     */
    static getLayerItemsFromIcons(schemaTag: TypeGeoviewLayerType, icons: TypeLegendLayerItem[]): TypeLegendItem[];
    /**
     * Type guard function that redefines a TypeLegend as a TypeVectorLegend
     * if the type attribute of the verifyIfLegend parameter is valid.
     *
     * The type ascention applies only to the true block of the if clause.
     *
     * @param verifyIfLegend - Object to test in order to determine if the type ascention is valid
     * @returns True if the payload is valid
     */
    static isVectorLegend(verifyIfLegend: TypeLegend, schemaTag: TypeGeoviewLayerType): verifyIfLegend is TypeVectorLegend;
    /**
     * Returns the WKT representation of a given geometry.
     *
     * @param geometry - The geometry
     * @returns The WKT representation of the geometry, or undefined if no geometry is provided
     */
    static geometryToWKT(geometry: Geometry): string | undefined;
    /**
     * Returns the Geometry representation of a given wkt.
     *
     * @param wkt - The well known text
     * @param readOptions - Read options to convert the wkt to a geometry
     * @returns The Geometry representation of the wkt, or undefined if no wkt is provided
     */
    static wktToGeometry(wkt: string, readOptions: ReadOptions): Geometry | undefined;
    /**
     * Returns the Geometry representation of a given geojson.
     *
     * @param geojson - The geojson
     * @param readOptions - Read options to convert the geojson to a geometry
     * @returns The Geometry representation of the geojson, or undefined if no geojson is provided
     */
    static geojsonToGeometry(geojson: string, readOptions: ReadOptions): Geometry | undefined;
    /**
     * Checks whether a given value is a valid GeoJSON FeatureCollection object.
     *
     * @param value - The value to test (can be any type)
     * @returns True if the value appears to be a GeoJSON FeatureCollection, otherwise false
     */
    static isGeoJSONObject(value: any): boolean;
    /**
     * Extracts the EPSG code from a GeoJSON object's CRS definition.
     *
     * Accepts either a GeoJSON object or a JSON string. If the GeoJSON contains
     * a `crs` entry with a `properties.name` field in the form
     * `"urn:ogc:def:crs:EPSG::<code>"`, it is normalized to `"EPSG:<code>"`.
     *
     * @param geojson - A GeoJSON object or a JSON string representing one
     * @returns The normalized EPSG code (e.g., `"EPSG:3005"`), or undefined if the CRS is not defined
     */
    static readEPSGOfGeoJSON(geojson: any): string | undefined;
    /**
     * Extracts the EPSG code from a GML object's CRS definition.
     *
     * Accepts either a GML object or an XML string. If the GML contains
     * an element with a `srsName` attribute in the form
     * `"urn:ogc:def:crs:EPSG::<code>"`, it is normalized to `"EPSG:<code>"`.
     *
     * @param gml - A GML object or an XML string representing one
     * @returns The normalized EPSG code (e.g., `"EPSG:3005"`), or undefined if the CRS is not defined
     */
    static readEPSGOfGML(gml: any): string | undefined;
    /**
     * Reads OpenLayers features from an Esri features object.
     *
     * @param features - The Features data to read
     * @param options - Optional read options such as projection or extent
     * @returns An array of parsed OpenLayers Feature and whether there were any invalid geometries
     * @throws {Error} When the EsriJSON data is invalid and cannot be parsed, even after attempting to clean invalid geometries.
     */
    static readFeaturesFromEsriJSON(features: unknown, options: ReadOptions | undefined): EsriJSONReadResult;
    /**
     * Reads OpenLayers features from a GeoJSON object.
     *
     * @param geojson - The GeoJSON data to read
     * @param options - Optional read options such as projection or extent
     * @returns An array of parsed OpenLayers Feature instances
     */
    static readFeaturesFromGeoJSON(geojson: unknown, options: ReadOptions | undefined): Feature<Geometry>[];
    /**
     * Reads OpenLayers features from an WFS features object.
     *
     * @param features - The Features data to read
     * @param version - The WFS version
     * @param options - Optional read options such as projection or extent
     * @returns An array of parsed OpenLayers Feature instances
     */
    static readFeaturesFromWFS(features: unknown, version: string, options: ReadOptions | undefined): Feature<Geometry>[];
    /**
     * Reads OpenLayers features from a WKBObject object.
     *
     * @param wkbObject - The WKBObject data to read
     * @param options - Optional read options such as projection or extent
     * @returns An array of parsed OpenLayers Feature instances
     */
    static readFeaturesFromWKB(wkbObject: string | ArrayBuffer | ArrayBufferView<ArrayBufferLike>, options: ReadOptions | undefined): Feature<Geometry>[];
    /**
     * Reads OpenLayers features from a KML object.
     *
     * @param kmlObject - The KML data to read
     * @param options - Optional read options such as projection or extent
     * @returns An array of parsed OpenLayers Feature instances
     */
    static readFeaturesFromKML(kmlObject: unknown, options: ReadOptions | undefined): Feature<Geometry>[];
    /**
     * Default drawing style for GeoView.
     *
     * @param strokeColor - Optional stroke color
     * @param strokeWidth - Optional stroke width
     * @param fillColor - Optional fill color
     * @returns An Open Layers styling for drawing on a map
     */
    static getDefaultDrawingStyle(strokeColor?: Color | string, strokeWidth?: number, fillColor?: Color | string): Style;
    /**
     * Create empty basemap tilelayer to use as initial basemap while we load basemap
     * so the viewer will not fails if basemap is not avialable.
     *
     * @returns The created empty basemap
     */
    static createEmptyBasemap(): TileLayer<XYZ | OSM | VectorTile>;
    /**
     * Format the coordinates for degrees - minutes - seconds (lat, long).
     *
     * @param value - The value to format
     * @returns The formatted value
     */
    static coordFormatDMS(value: number): string;
    /**
     * Converts a TypeFeatureStyle to an Open Layers Style object.
     *
     * @param style - Optional feature style to convert
     * @returns An Open Layers styling for drawing on a map
     */
    static convertTypeFeatureStyleToOpenLayersStyle(style?: TypeFeatureStyle): Style;
    /**
     * Check if a point is contained in an extent.
     *
     * @param point - The point
     * @param extent - The extent
     * @returns True if point is within the extent, false otherwise
     */
    static isPointInExtent(point: Coordinate, extent: Extent): boolean;
    /**
     * Returns the union of 2 extents.
     *
     * @param extentA - First extent
     * @param extentB - Optional second extent
     * @returns The union of the extents, or undefined if both are undefined
     */
    static getExtentUnion(extentA: Extent | undefined, extentB?: Extent | undefined): Extent | undefined;
    /**
     * Returns the intersection of 2 extents.
     *
     * @param extentA - First extent
     * @param extentB - Optional second extent
     * @returns The intersection of the extents, or undefined if both are undefined
     */
    static getExtentIntersection(extentA: Extent | undefined, extentB?: Extent | undefined): Extent | undefined;
    /**
     * Converts an extent to a polygon.
     *
     * @param extent - The extent to convert
     * @returns The created polygon
     */
    static extentToPolygon(extent: Extent): Polygon;
    /**
     * Converts a polygon to an extent.
     *
     * @param polygon - The polygon to convert
     * @returns The created extent
     */
    static polygonToExtent(polygon: Polygon): Extent;
    /**
     * Checks validity of lat long, LCC, or Web Mercator extent and updates values if invalid.
     *
     * @param extent - The extent to validate
     * @param code - The projection code of the extent. Default EPSG:4326
     * @returns The validated extent
     */
    static validateExtent(extent: Extent, code?: string): Extent;
    /**
     * Validates lat long, LCC, or Web Mercator extent if it is defined.
     *
     * @param extent - The extent to validate
     * @param code - The projection code of the extent. Default EPSG:4326
     * @returns The validated extent if it was defined, or undefined
     */
    static validateExtentWhenDefined(extent: Extent | undefined, code?: string): Extent | undefined;
    /**
     * Checks if a given extent is long/lat.
     *
     * @param extent - The extent to check
     * @returns Whether or not the extent is long/lat
     */
    static isExtentLonLat(extent: Extent): boolean;
    /**
     * Gets the area of a given geometry.
     *
     * @param geometry - The geometry to calculate the area
     * @returns The area of the given geometry
     */
    static getArea(geometry: Geometry): number;
    /**
     * Gets the length of a given geometry.
     *
     * @param geometry - The geometry to calculate the length
     * @returns The length of the given geometry
     */
    static getLength(geometry: Geometry): number;
    /**
     * Calculates distance along a path define by array of Coordinates.
     *
     * @param coordinates - Array of coordinates
     * @param inProj - Input projection (EPSG:4326, EPSG:3978, ESPG:3857)
     * @param outProj - Output projection (EPSG:3978, ESPG:3857)
     * @returns The total distance in kilometers and distance for each section
     */
    static calculateDistance(coordinates: Coordinate[], inProj: string, outProj: string): {
        total: number;
        sections: number[];
    };
    /**
     * Gets meters per pixel for different projections.
     *
     * @param projection - The projection of the map
     * @param resolution - The resolution of the map
     * @param lat - Optional latitude, only needed for Web Mercator
     * @returns Number representing meters per pixel
     */
    static getMetersPerPixel(projection: TypeValidMapProjectionCodes, resolution: number, lat?: number): number;
    /**
     * Gets the pointer position information from a Map Event and a specified projection.
     *
     * @param mapEvent - The map event
     * @param projCode - The map projection code
     * @returns An object representing pointer position information
     */
    static getPointerPositionFromMapEvent(mapEvent: MapBrowserEvent, projCode: string): TypeMapMouseInfo;
    /**
     * Function for checking if two geometries have the same coordinates.
     *
     * @param geom1 - The first geometry
     * @param geom2 - The second geometry
     * @returns Whether the two geometries are equal or not
     */
    static geometriesAreEqual(geom1: Geometry | undefined, geom2: Geometry | undefined): boolean;
    /**
     * Apply buffer to extent.
     *
     * @param extent - The extent to check and buffer
     * @param bufferSize - Buffer size in map units (default: 5000)
     * @returns Buffered extent
     */
    static bufferExtent(extent: Extent, bufferSize?: number): Extent;
    /**
     * Serializes an OpenLayers geometry into a GML3 string.
     *
     * This method uses the OpenLayers `GML3` format to convert the provided
     * `Geometry` object into a GML XML string, using the specified spatial
     * reference system (`srsName`).
     *
     * @param geometry - The OpenLayers geometry to serialize
     * @param srsName - The spatial reference system (e.g., 'EPSG:3857') to assign to the GML geometry
     * @returns The serialized GML geometry as a string
     */
    static writeGeometryToGML(geometry: Geometry, srsName: string): string;
    /**
     * Converts a WFS geometry type string to a TypeStyleGeometry.
     *
     * @param wfsGeometryType - The wfs geometry type to convert
     * @returns The corresponding TypeStyleGeometry
     * @throws {NotSupportedError} When the geometry type is not supported.
     */
    static wfsConvertGeometryTypeToOLGeometryType(wfsGeometryType: string): TypeStyleGeometry;
    /**
     * Converts an esri geometry type string to a TypeStyleGeometry.
     *
     * @param esriGeometryType - The esri geometry type to convert
     * @returns The corresponding TypeStyleGeometry
     * @throws {NotSupportedError} When the geometry type is not supported.
     */
    static esriConvertEsriGeometryTypeToOLGeometryType(esriGeometryType: string): TypeStyleGeometry;
}
/** The type for the function callback for getWMSServiceMetadata() */
export type CallbackNewMetadataDelegate = (proxyUsed: string) => void;
export interface TypeVectorLegend extends TypeLegend {
    legend: TypeVectorLayerStyles;
}
export {};
//# sourceMappingURL=utilities.d.ts.map