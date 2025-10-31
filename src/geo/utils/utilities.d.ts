import type { MapBrowserEvent } from 'ol';
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
import type View from 'ol/View';
import type { TypeFeatureStyle } from '@/geo/layer/geometry/geometry-types';
import type { TypeVectorLayerStyles } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import type { TypeLayerStyleConfig, TypeValidMapProjectionCodes } from '@/api/types/map-schema-types';
import type { TypeMetadataWMS } from '@/api/types/layer-schema-types';
import type { TypeMapMouseInfo } from '@/geo/map/map-viewer';
export declare const layerTypes: Record<"CSV" | "KML" | "WKB" | "ESRI_DYNAMIC" | "ESRI_FEATURE" | "ESRI_IMAGE" | "IMAGE_STATIC" | "GEOJSON" | "XYZ_TILES" | "VECTOR_TILES" | "OGC_FEATURE" | "WFS" | "WMS", import("@/api/types/layer-schema-types").TypeGeoviewLayerType>;
/** The type for the function callback for getWMSServiceMetadata() */
export type CallbackNewMetadataDelegate = (proxyUsed: string) => void;
/**
 * Fetch the json response from the ESRI map server to get REST endpoint metadata.
 * @param {string} url - The url of the ESRI map server.
 * @returns {Promise<unknown>} A json promise containing the result of the query.
 */
export declare function getESRIServiceMetadata(url: string): Promise<unknown>;
/**
 * Fetch the json response from the XML response of a WMS getCapabilities request.
 * @param {string} url - The url the url of the WMS server.
 * @param {string} layers - The layers to query separate by.
 * @param {AbortSignal | undefined} abortSignal - Abort signal to handle cancelling of fetch.
 * @returns {Promise<TypeMetadataWMS>} A json promise containing the result of the query.
 * @throws {RequestTimeoutError} Error thrown when the request exceeds the timeout duration.
 * @throws {RequestAbortedError} Error thrown when the request was aborted by the caller's signal.
 * @throws {ResponseError} Error thrown when the response is not OK (non-2xx).
 * @throws {ResponseEmptyError} Error thrown when the JSON response is empty.
 * @throws {NetworkError} Errow thrown when a network issue happened.
 */
export declare function getWMSServiceMetadata(url: string, layers?: string, callbackNewMetadataUrl?: CallbackNewMetadataDelegate, abortSignal?: AbortSignal): Promise<TypeMetadataWMS>;
/**
 * Return the map server url from a layer service.
 * @param {string} url - The service url for a wms / dynamic or feature layers.
 * @param {boolean} rest - Boolean value to add rest services if not present (default false).
 * @returns {string} The map server url.
 */
export declare function getMapServerUrl(url: string, rest?: boolean): string;
/**
 * Return the root server url from a OGC layer service.
 * @param {string} url - The service url for an ogc layer.
 * @returns {string} The root ogc server url.
 */
export declare function getOGCServerUrl(url: string): string;
/**
 * Replaces or adds the BBOX parameter in a WMS GetMap URL.
 * @param {string} url - The original WMS GetMap URL
 * @param {string} newCRS - The new CRS
 * @param {number[]} newBBOX - The new BBOX to set, as an array of 4 numbers: [minX, minY, maxX, maxY]
 * @returns {string} A new URL string with the updated BBOX parameter
 */
export declare function replaceCRSandBBOXParam(url: string, newCRS: string, newBBOX: number[]): string;
/**
 * Returns the WKT representation of a given geometry.
 * @param {string} geometry - The geometry
 * @returns {string | undefined} The WKT representation of the geometry
 */
export declare function geometryToWKT(geometry: Geometry): string | undefined;
/**
 * Returns the Geometry representation of a given wkt.
 * @param {string} wkt - The well known text
 * @param {ReadOptions} readOptions - Read options to convert the wkt to a geometry
 * @returns {Geometry | undefined} The Geometry representation of the wkt
 */
export declare function wktToGeometry(wkt: string, readOptions: ReadOptions): Geometry | undefined;
/**
 * Returns the Geometry representation of a given geojson
 * @param {string} geojson - The geojson
 * @param {ReadOptions} readOptions - Read options to convert the geojson to a geometry
 * @returns {Geometry | undefined} - The Geometry representation of the geojson
 */
export declare function geojsonToGeometry(geojson: string, readOptions: ReadOptions): Geometry | undefined;
/**
 * Default drawing style for GeoView
 * @returns {Style} An Open Layers styling for drawing on a map
 */
export declare function getDefaultDrawingStyle(strokeColor?: Color | string, strokeWidth?: number, fillColor?: Color | string): Style;
/**
 * Create empty basemap tilelayer to use as initial basemap while we load basemap
 * so the viewer will not fails if basemap is not avialable
 *
 * @returns {TileLayer<XYZ>} The created empty basemap
 */
export declare function createEmptyBasemap(): TileLayer<XYZ | OSM | VectorTile>;
/**
 * This method gets the legend styles used by the the layer as specified by the style configuration.
 * @param {TypeLayerStyleConfig} styleConfig - Layer style configuration.
 * @returns {Promise<TypeVectorLayerStyles>} A promise that the layer styles are processed.
 */
export declare function getLegendStylesFromConfig(styleConfig: TypeLayerStyleConfig): Promise<TypeVectorLayerStyles>;
/**
 * Format the coordinates for degrees - minutes - seconds (lat, long)
 * @param {number} value the value to format
 * @returns {string} the formatted value
 */
export declare function coordFormatDMS(value: number): string;
/**
 * Converts a TypeFeatureStyle to an Open Layers Style object.
 * @returns an Open Layers styling for drawing on a map or undefined
 */
export declare function convertTypeFeatureStyleToOpenLayersStyle(style?: TypeFeatureStyle): Style;
/**
 * Check if a point is contained in an extent
 * @param {Coordinate} point - The point
 * @param {Extent} extent - The extent
 * @returns True if point is within the extent, false otherwise
 */
export declare function isPointInExtent(point: Coordinate, extent: Extent): boolean;
/**
 * Returns the union of 2 extents.
 * @param {Extent | undefined} extentA First extent
 * @param {Extent | undefined} extentB Optional second extent
 * @returns {Extent | undefined} The union of the extents
 */
export declare function getExtentUnion(extentA: Extent | undefined, extentB?: Extent | undefined): Extent | undefined;
/**
 * Returns the intersection of 2 extents.
 * @param {Extent | undefined} extentA First extent
 * @param {Extent | undefined} extentB Optional second extent
 * @returns {Extent | undefined} The intersection of the extents
 */
export declare function getExtentIntersection(extentA: Extent | undefined, extentB?: Extent | undefined): Extent | undefined;
/**
 * Converts an extent to a polygon
 * @param {Extent} extent - The extent to convert
 * @returns {Polygon} The created polygon
 */
export declare function extentToPolygon(extent: Extent): Polygon;
/**
 * Converts a polygon to an extent
 * @param {Polygon} polygon - The polygon to convert
 * @returns {Extent} The created extent
 */
export declare function polygonToExtent(polygon: Polygon): Extent;
/**
 * Checks validity of lat long, LCC, or Web Mercator extent and updates values if invalid.
 * @param {Extent} extent - The extent to validate.
 * @param {string} code - The projection code of the extent. Default EPSG:4326.
 * @returns {Extent} The validated extent
 */
export declare function validateExtent(extent: Extent, code?: string): Extent;
/**
 * Validates lat long, LCC, or Web Mercator extent if it is defined.
 * @param {Extent} extent - The extent to validate.
 * @param {string} code - The projection code of the extent. Default EPSG:4326.
 * @returns {Extent | undefined} The validated extent if it was defined.
 */
export declare function validateExtentWhenDefined(extent: Extent | undefined, code?: string): Extent | undefined;
/**
 * Checks if a given extent is long/lat.
 * @param {Extent} extent - The extent to check.
 * @returns {boolean} Whether or not the extent is long/lat
 */
export declare function isExtentLonLat(extent: Extent): boolean;
/**
 * Gets the area of a given geometry
 * @param {Geometry} geometry the geometry to calculate the area
 * @returns the area of the given geometry
 */
export declare function getArea(geometry: Geometry): number;
/**
 * Gets the length of a given geometry
 * @param {Geometry} geometry the geometry to calculate the length
 * @returns the length of the given geometry
 */
export declare function getLength(geometry: Geometry): number;
/**
 * Calculates distance along a path define by array of Coordinates
 * @param  {Coordinate[]} coordinates - Array of corrdinates
 * @param {string} inProj - Input projection (EPSG:4326, EPSG:3978, ESPG:3857)
 * @param {string} outProj - Output projection (EPSG:3978, ESPG:3857)
 * @returns { total: number; sections: number[] } - The total distance in kilometers and distance for each section
 */
export declare function calculateDistance(coordinates: Coordinate[], inProj: string, outProj: string): {
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
export declare function getMetersPerPixel(projection: TypeValidMapProjectionCodes, resolution: number, lat?: number): number;
/**
 * Converts a map scale to zoom level
 * @param view The view for converting the scale
 * @param targetScale The desired scale (e.g. 50000 for 1:50,000)
 * @returns number representing the closest zoom level for the given scale
 */
export declare const getZoomFromScale: (view: View, targetScale: number | undefined, dpiValue?: number) => number | undefined;
/**
 * Converts a map scale to zoom level
 * @param view The view for converting the zoom
 * @param zoom The desired zoom (e.g. 50000 for 1:50,000)
 * @returns number representing the closest scale for the given zoom number
 */
export declare const getScaleFromZoom: (view: View, zoom: number) => number | undefined;
/**
 * Gets map scale for Web Mercator or Lambert Conformal Conic projections
 * @param view The view to get the current scale from
 * @returns number representing scale (e.g. 50000 for 1:50,000)
 */
export declare const getMapScale: (view: View) => number | undefined;
/**
 * Gets the pointer position information from a Map Event and a specified projection.
 * @param {MapEvent} mapEvent - The map event
 * @param {string} projCode - The map projection code
 * @returns {TypeMapMouseInfo} An object representing pointer position information
 */
export declare const getPointerPositionFromMapEvent: (mapEvent: MapBrowserEvent, projCode: string) => TypeMapMouseInfo;
/**
 * Function for checking if two geometries have the same coordinates
 * @param {Geometry} geom1 - The first geometry
 * @param {Geometry} geom2 - The second geometry
 * @returns {boolean} Whether the two geometries are equal or not
 */
export declare const geometriesAreEqual: (geom1: Geometry, geom2: Geometry) => boolean;
//# sourceMappingURL=utilities.d.ts.map