import { ReadOptions } from 'ol/format/Feature';
import Geometry from 'ol/geom/Geometry';
import { Style } from 'ol/style';
import { Color } from 'ol/color';
import { Extent } from 'ol/extent';
import XYZ from 'ol/source/XYZ';
import TileLayer from 'ol/layer/Tile';
import { Polygon } from 'ol/geom';
import { TypeJsonObject } from '@/core/types/global-types';
import { TypeFeatureStyle } from '@/geo/layer/geometry/geometry-types';
import { TypeVectorLayerStyles } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { TypeStyleConfig } from '@/geo/map/map-schema-types';
export declare const layerTypes: Record<"CSV" | "ESRI_DYNAMIC" | "ESRI_FEATURE" | "ESRI_IMAGE" | "IMAGE_STATIC" | "GEOJSON" | "GEOPACKAGE" | "XYZ_TILES" | "VECTOR_TILES" | "OGC_FEATURE" | "WFS" | "WMS", import("@/geo/layer/geoview-layers/abstract-geoview-layers").TypeGeoviewLayerType>;
/**
 * Fetch the json response from the ESRI map server to get REST endpoint metadata
 * @function getESRIServiceMetadata
 * @param {string} url the url of the ESRI map server
 * @returns {Promise<TypeJsonObject>} a json promise containing the result of the query
 */
export declare function getESRIServiceMetadata(url: string): Promise<TypeJsonObject>;
/**
 * Fetch the json response from the XML response of a WMS getCapabilities request
 * @function getWMSServiceMetadata
 * @param {string} url the url the url of the WMS server
 * @param {string} layers the layers to query separate by ,
 * @returns {Promise<TypeJsonObject>} a json promise containing the result of the query
 */
export declare function getWMSServiceMetadata(url: string, layers: string): Promise<TypeJsonObject>;
/**
 * Fetch the json response from the XML response of a WFS getCapabilities request
 * @function getWFSServiceMetadata
 * @param {string} url the url of the WFS server
 * @returns {Promise<TypeJsonObject>} a json promise containing the result of the query
 */
export declare function getWFSServiceMetadata(url: string): Promise<TypeJsonObject>;
/**
 * Return the map server url from a layer service
 *
 * @param {string} url the service url for a wms / dynamic or feature layers
 * @param {boolean} rest boolean value to add rest services if not present (default false)
 * @returns the map server url
 */
export declare function getMapServerUrl(url: string, rest?: boolean): string;
/**
 * Return the root server url from a OGC layer service
 *
 * @param {string} url the service url for an ogc layer
 * @returns the root ogc server url
 */
export declare function getOGCServerUrl(url: string): string;
/**
 * Returns the WKT representation of a given geometry
 * @function geometryToWKT
 * @param {string} geometry the geometry
 * @returns {string | null} the WKT representation of the geometry
 */
export declare function geometryToWKT(geometry: Geometry): string | null;
/**
 * Returns the Geometry representation of a given wkt
 * @function wktToGeometry
 * @param {string} wkt the well known text
 * @param {ReadOptions} readOptions read options to convert the wkt to a geometry
 * @returns {Geometry | null} the Geometry representation of the wkt
 */
export declare function wktToGeometry(wkt: string, readOptions: ReadOptions): Geometry | null;
/**
 * Returns the Geometry representation of a given geojson
 * @function geojsonToGeometry
 * @param {string} geojson the geojson
 * @param {ReadOptions} readOptions read options to convert the geojson to a geometry
 * @returns {Geometry | null} the Geometry representation of the geojson
 */
export declare function geojsonToGeometry(geojson: string, readOptions: ReadOptions): Geometry | null;
/**
 * Gets the area of a given geometry
 * @param {Geometry} geometry the geometry to calculate the area
 * @returns the area of the given geometry
 */
export declare function getArea(geometry: Geometry): number;
/**
 * Default drawing style for GeoView
 * @returns an Open Layers styling for drawing on a map
 */
export declare function getDefaultDrawingStyle(strokeColor?: Color | string, strokeWidth?: number, fillColor?: Color | string): Style;
/**
 * Create empty basemap tilelayer to use as initial basemap while we load basemap
 * so the viewer will not fails if basemap is not avialable
 *
 * @returns {TileLayer<XYZ>} return the created basemap
 */
export declare function createEmptyBasemap(): TileLayer<XYZ>;
/** ***************************************************************************************************************************
 * This method gets the legend styles used by the the layer as specified by the style configuration.
 *
 * @param {TypeStyleConfig} styleConfig - Layer style configuration.
 *
 * @returns {Promise<TypeVectorLayerStyles>} A promise that the layer styles are processed.
 */
export declare function getLegendStylesFromConfig(styleConfig: TypeStyleConfig): Promise<TypeVectorLayerStyles>;
/**
 * Gets computed translate values
 * https://zellwk.com/blog/css-translate-values-in-javascript/
 * @param {HTMLElement} element the HTML element to get value for
 * @returns {Object} the x, y and z translation values
 */
export declare function getTranslateValues(element: HTMLElement): {
    x: number;
    y: number;
    z: number;
};
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
 * Compare sets of extents of the same projection and return the smallest or largest set.
 * Extents must be in OpenLayers extent format - [minx, miny, maxx, maxy]
 *
 * @param {Extent} extentsA First set of extents
 * @param {Extent} extentsB Second set of extents
 * @param {string} minmax Decides whether to get smallest or largest extent
 * @returns {Extent} the smallest or largest set from the extents
 */
export declare function getMinOrMaxExtents(extentsA: Extent, extentsB: Extent, minmax?: string): Extent;
/**
 * Returns the union of 2 extents.
 * @param {Extent} extentA First extent
 * @param {Extent} extentB Optional second extent
 * @returns {Extent} The union of the extents
 */
export declare function getExtentUnion(extentA: Extent, extentB?: Extent): Extent;
/**
 * Returns the union of 2 extents supporting the case where extentA might be undefined.
 * @param {Extent | undefined} extentA First extent or undefined
 * @param {Extent | undefined} extentB Optional second extent
 * @returns {Extent | undefined} The union of the extents
 */
export declare function getExtentUnionMaybe(extentA: Extent | undefined, extentB?: Extent): Extent | undefined;
/**
 * Returns the intersection of 2 extents.
 * @param {Extent} extentA First extent
 * @param {Extent} extentB Optional second extent
 * @returns {Extent} The intersection of the extents
 */
export declare function getExtentIntersection(extentA: Extent, extentB?: Extent): Extent;
/**
 * Returns the intersection of 2 extents supporting the case where extentA might be undefined.
 * @param {Extent | undefined} extentA First extent or undefined
 * @param {Extent | undefined} extentB Optional second extent
 * @returns {Extent | undefined} The intersection of the extents
 */
export declare function getExtentIntersectionMaybe(extentA: Extent | undefined, extentB?: Extent): Extent | undefined;
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
