import axios from 'axios';

import { WMSCapabilities, WKT, GeoJSON } from 'ol/format';
import { ReadOptions } from 'ol/format/Feature';
import Geometry from 'ol/geom/Geometry';
import { Style, Stroke, Fill, Circle } from 'ol/style';
import { Color } from 'ol/color';
import { getArea as getAreaOL } from 'ol/sphere';
import { Extent } from 'ol/extent';
import XYZ from 'ol/source/XYZ';
import TileLayer from 'ol/layer/Tile';

import { Polygon } from 'ol/geom';
import { Cast, TypeJsonObject } from '@/core/types/global-types';
import { TypeFeatureStyle } from '@/geo/layer/geometry/geometry-types';
import { xmlToJson } from '@/core/utils/utilities';

import { CONST_LAYER_TYPES, TypeVectorLayerStyles } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { getLegendStyles } from '@/geo/utils/renderer/geoview-renderer';
import { AbstractBaseLayerEntryConfig } from '@/core/utils/config/validation-classes/abstract-base-layer-entry-config';
import { TypeStyleConfig } from '@/geo/map/map-schema-types';

import { TypeBasemapLayer } from '../layer/basemap/basemap-types';

/**
 * Interface used for css style declarations
 */
interface TypeCSSStyleDeclaration extends CSSStyleDeclaration {
  mozTransform: string;
}

// available layer types
export const layerTypes = CONST_LAYER_TYPES;

// #region FETCH METADATA
/**
 * Fetch the json response from the ESRI map server to get REST endpoint metadata
 * @function getESRIServiceMetadata
 * @param {string} url the url of the ESRI map server
 * @returns {Promise<TypeJsonObject>} a json promise containing the result of the query
 */
export async function getESRIServiceMetadata(url: string): Promise<TypeJsonObject> {
  // fetch the map server returning a json object
  const response = await fetch(`${url}?f=json`);
  const result = await response.json();

  return result;
}

/**
 * Fetch the json response from the XML response of a WMS getCapabilities request
 * @function getWMSServiceMetadata
 * @param {string} url the url the url of the WMS server
 * @param {string} layers the layers to query separate by ,
 * @returns {Promise<TypeJsonObject>} a json promise containing the result of the query
 */
export async function getWMSServiceMetadata(url: string, layers: string): Promise<TypeJsonObject> {
  const parser = new WMSCapabilities();

  let capUrl = `${url}?service=WMS&version=1.3.0&request=GetCapabilities`;
  if (layers.length > 0) capUrl = capUrl.concat(`&layers=${layers}`);

  const response = await fetch(capUrl);

  const result = parser.read(await response.text());

  return result;
}

/**
 * Fetch the json response from the XML response of a WFS getCapabilities request
 * @function getWFSServiceMetadata
 * @param {string} url the url of the WFS server
 * @returns {Promise<TypeJsonObject>} a json promise containing the result of the query
 */
export async function getWFSServiceMetadata(url: string): Promise<TypeJsonObject> {
  const res = await axios.get<TypeJsonObject>(url, {
    params: { request: 'getcapabilities', service: 'WFS' },
  });
  const xmlDOM = new DOMParser().parseFromString(res.data as string, 'text/xml');
  const json = xmlToJson(xmlDOM);
  const capabilities = json['wfs:WFS_Capabilities'];
  return capabilities;
}

/**
 * Return the map server url from a layer service
 *
 * @param {string} url the service url for a wms / dynamic or feature layers
 * @param {boolean} rest boolean value to add rest services if not present (default false)
 * @returns the map server url
 */
export function getMapServerUrl(url: string, rest = false): string {
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
 * Return the root server url from a OGC layer service
 *
 * @param {string} url the service url for an ogc layer
 * @returns the root ogc server url
 */
export function getOGCServerUrl(url: string): string {
  let ogcServerUrl = url;
  if (ogcServerUrl.includes('collections')) {
    ogcServerUrl = ogcServerUrl.slice(0, ogcServerUrl.indexOf('collections'));
  }
  return ogcServerUrl;
}
// #endregion FETCH METADATA

// #region GEOMETRY
/**
 * Returns the WKT representation of a given geometry
 * @function geometryToWKT
 * @param {string} geometry the geometry
 * @returns {string | null} the WKT representation of the geometry
 */
export function geometryToWKT(geometry: Geometry): string | null {
  if (geometry) {
    // Get the wkt for the geometry
    const format = new WKT();
    return format.writeGeometry(geometry);
  }
  return null;
}

/**
 * Returns the Geometry representation of a given wkt
 * @function wktToGeometry
 * @param {string} wkt the well known text
 * @param {ReadOptions} readOptions read options to convert the wkt to a geometry
 * @returns {Geometry | null} the Geometry representation of the wkt
 */
export function wktToGeometry(wkt: string, readOptions: ReadOptions): Geometry | null {
  if (wkt) {
    // Get the feature for the wkt
    const format = new WKT();
    return format.readGeometry(wkt, readOptions);
  }
  return null;
}

/**
 * Returns the Geometry representation of a given geojson
 * @function geojsonToGeometry
 * @param {string} geojson the geojson
 * @param {ReadOptions} readOptions read options to convert the geojson to a geometry
 * @returns {Geometry | null} the Geometry representation of the geojson
 */
export function geojsonToGeometry(geojson: string, readOptions: ReadOptions): Geometry | null {
  if (geojson) {
    // Get the feature for the geojson
    const format = new GeoJSON();
    return format.readGeometry(geojson, readOptions);
  }
  return null;
}

/**
 * Gets the area of a given geometry
 * @param {Geometry} geometry the geometry to calculate the area
 * @returns the area of the given geometry
 */
export function getArea(geometry: Geometry): number {
  return getAreaOL(geometry);
}

/**
 * Default drawing style for GeoView
 * @returns an Open Layers styling for drawing on a map
 */
export function getDefaultDrawingStyle(strokeColor?: Color | string, strokeWidth?: number, fillColor?: Color | string): Style {
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
 * @returns {TileLayer<XYZ>} return the created basemap
 */
export function createEmptyBasemap(): TileLayer<XYZ> {
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

/** ***************************************************************************************************************************
 * This method gets the legend styles used by the the layer as specified by the style configuration.
 *
 * @param {AbstractBaseLayerEntryConfig & {style: TypeStyleConfig;}} layerConfig - Layer configuration.
 *
 * @returns {Promise<TypeVectorLayerStyles>} A promise that the layer styles are processed.
 */
export function getLegendStylesFromConfig(
  layerConfig: AbstractBaseLayerEntryConfig & {
    style: TypeStyleConfig;
  }
): Promise<TypeVectorLayerStyles> {
  return getLegendStyles(layerConfig);
}

/**
 * Gets computed translate values
 * https://zellwk.com/blog/css-translate-values-in-javascript/
 * @param {HTMLElement} element the HTML element to get value for
 * @returns {Object} the x, y and z translation values
 */
export function getTranslateValues(element: HTMLElement): {
  x: number;
  y: number;
  z: number;
} {
  const style = Cast<TypeCSSStyleDeclaration>(window.getComputedStyle(element));
  const matrix = style.transform || style.webkitTransform || style.mozTransform;
  const values = { x: 0, y: 0, z: 0 };

  // No transform property. Simply return 0 values.
  if (matrix === 'none' || matrix === undefined) return values;

  // Can either be 2d or 3d transform
  const matrixType = matrix.includes('3d') ? '3d' : '2d';
  const matrixMatch = matrix.match(/matrix.*\((.+)\)/);
  const matrixValues = matrixMatch && matrixMatch[1].split(', ');

  // 2d matrices have 6 values
  // Last 2 values are X and Y.
  // 2d matrices does not have Z value.
  if (matrixType === '2d') {
    return {
      x: Number(matrixValues && matrixValues[4]),
      y: Number(matrixValues && matrixValues[5]),
      z: 0,
    };
  }

  // 3d matrices have 16 values
  // The 13th, 14th, and 15th values are X, Y, and Z
  if (matrixType === '3d') {
    return {
      x: Number(matrixValues && matrixValues[12]),
      y: Number(matrixValues && matrixValues[13]),
      z: Number(matrixValues && matrixValues[14]),
    };
  }

  return values;
}

/**
 * Format the coordinates for degrees - minutes - seconds (lat, long)
 * @param {number} value the value to format
 * @returns {string} the formatted value
 */
export function coordFormatDMS(value: number): string {
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
export function convertTypeFeatureStyleToOpenLayersStyle(style?: TypeFeatureStyle): Style {
  // TODO: Refactor - This function could also be used by vector class when it works with the styling
  // GV So I'm putting it in this utilities class so that it eventually becomes shared between vector
  // GV class and interactions classes.
  // Redirect
  return getDefaultDrawingStyle(style?.strokeColor, style?.strokeWidth, style?.fillColor);
}

/**
 * Compare sets of extents of the same projection and return the smallest or largest set.
 * Extents must be in OpenLayers extent format - [minx, miny, maxx, maxy]
 *
 * @param {Extent} extentsA First set of extents
 * @param {Extent} extentsB Second set of extents
 * @param {string} minmax Decides whether to get smallest or largest extent
 * @returns {Extent} the smallest or largest set from the extents
 */
export function getMinOrMaxExtents(extentsA: Extent, extentsB: Extent, minmax = 'max'): Extent {
  let bounds: Extent = [];
  if (minmax === 'max')
    bounds = [
      Math.min(extentsA[0], extentsB[0]),
      Math.min(extentsA[1], extentsB[1]),
      Math.max(extentsA[2], extentsB[2]),
      Math.max(extentsA[3], extentsB[3]),
    ];
  else if (minmax === 'min')
    bounds = [
      Math.max(extentsA[0], extentsB[0]),
      Math.max(extentsA[1], extentsB[1]),
      Math.min(extentsA[2], extentsB[2]),
      Math.min(extentsA[3], extentsB[3]),
    ];
  return bounds;
}

/**
 * Convert an extent to a polygon
 *
 * @param {Extent} extent - The extent to convert
 * @returns {Polygon} The created polygon
 */
export function extentToPolygon(extent: Extent): Polygon {
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
 * Convert an polygon to an extent
 *
 * @param {Polygon} polygon - The polygon to convert
 * @returns {Extent} The created extent
 */
export function polygonToExtent(polygon: Polygon): Extent {
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
