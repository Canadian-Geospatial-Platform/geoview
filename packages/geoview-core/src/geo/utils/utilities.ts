import type { MapBrowserEvent } from 'ol';
import { WMSCapabilities, WKT, GeoJSON } from 'ol/format';
import type { ReadOptions } from 'ol/format/Feature';
import type Geometry from 'ol/geom/Geometry';
import { Style, Stroke, Fill, Circle } from 'ol/style';
import type { Color } from 'ol/color';
import { getArea as getAreaOL, getLength as getLengthOL } from 'ol/sphere';
import type { Extent } from 'ol/extent';
import { containsCoordinate } from 'ol/extent';
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
import { getLegendStyles } from '@/geo/utils/renderer/geoview-renderer';
import type { TypeLayerStyleConfig, TypeValidMapProjectionCodes } from '@/api/types/map-schema-types';
import { CONFIG_PROXY_URL } from '@/api/types/map-schema-types';
import type { TypeMetadataWMS } from '@/api/types/layer-schema-types';
import { CONST_LAYER_TYPES } from '@/api/types/layer-schema-types';

import type { TypeBasemapLayer } from '@/geo/layer/basemap/basemap-types';
import type { TypeMapMouseInfo } from '@/geo/map/map-viewer';
import { NetworkError } from '@/core/exceptions/core-exceptions';

// available layer types
export const layerTypes = CONST_LAYER_TYPES;

// #region FETCH METADATA

/** The type for the function callback for getWMSServiceMetadata() */
export type CallbackNewMetadataDelegate = (proxyUsed: string) => void;

/**
 * Fetch the json response from the ESRI map server to get REST endpoint metadata.
 * @param {string} url - The url of the ESRI map server.
 * @returns {Promise<unknown>} A json promise containing the result of the query.
 */
export function getESRIServiceMetadata(url: string): Promise<unknown> {
  // fetch the map server returning a json object
  return Fetch.fetchJson(`${url}?f=json`);
}

/**
 * Fetch the json response from the XML response of a WMS getCapabilities request.
 * @param {string} url - The url the url of the WMS server.
 * @param {string} layers - The layers to query separate by.
 * @param {AbortSignal | undefined} abortSignal - Abort signal to handle cancelling of fetch.
 * @returns {Promise<TypeMetadataWMS>} A json promise containing the result of the query.
 */
export async function getWMSServiceMetadata(
  url: string,
  layers?: string,
  callbackNewMetadataUrl?: CallbackNewMetadataDelegate,
  abortSignal?: AbortSignal
): Promise<TypeMetadataWMS> {
  let capUrl = url.toLowerCase().includes('request=getcapabilities') ? url : `${url}?service=WMS&version=1.3.0&request=GetCapabilities`;
  let capabilitiesString;
  try {
    // If any layers
    if (layers) capUrl = `${capUrl}&Layers=${layers}`;

    // Fetch the metadata
    capabilitiesString = await Fetch.fetchText(capUrl, { signal: abortSignal });
  } catch (error: unknown) {
    // If a network error such as CORS
    if (error instanceof NetworkError) {
      // We're going to change the metadata url to use a proxy
      const newProxiedMetadataUrl = `${CONFIG_PROXY_URL}?${capUrl}`;

      // Try again with the proxy this time
      capabilitiesString = await Fetch.fetchText(newProxiedMetadataUrl);

      // Callback about it
      callbackNewMetadataUrl?.(`${CONFIG_PROXY_URL}?`);
    } else {
      // Unknown error, throw it
      throw error;
    }
  }

  // Continue reading the metadata to return it
  const parser = new WMSCapabilities();
  return parser.read(capabilitiesString);
}

/**
 * Return the map server url from a layer service.
 * @param {string} url - The service url for a wms / dynamic or feature layers.
 * @param {boolean} rest - Boolean value to add rest services if not present (default false).
 * @returns The map server url.
 */
export function getMapServerUrl(url: string, rest: boolean = false): string {
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
 * @returns The root ogc server url.
 */
export function getOGCServerUrl(url: string): string {
  let ogcServerUrl = url;
  if (ogcServerUrl.includes('collections')) {
    ogcServerUrl = ogcServerUrl.slice(0, ogcServerUrl.indexOf('collections'));
  }
  return ogcServerUrl;
}

/**
 * Replaces or adds the BBOX parameter in a WMS GetMap URL.
 * @param url - The original WMS GetMap URL
 * @param newBBOX - The new BBOX to set, as an array of 4 numbers: [minX, minY, maxX, maxY]
 * @returns A new URL string with the updated BBOX parameter
 */
export function replaceCRSAndBBOXParam(url: string, newCRS: string, newBBOX: number[]): string {
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
 * @returns {string | null} The WKT representation of the geometry
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
 * Returns the Geometry representation of a given wkt.
 * @param {string} wkt - The well known text
 * @param {ReadOptions} readOptions - Read options to convert the wkt to a geometry
 * @returns {Geometry | null} The Geometry representation of the wkt
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
 * @param {string} geojson - The geojson
 * @param {ReadOptions} readOptions - Read options to convert the geojson to a geometry
 * @returns {Geometry | null} - The Geometry representation of the geojson
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
export function createEmptyBasemap(): TileLayer<XYZ | OSM | VectorTile> {
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
export function getLegendStylesFromConfig(styleConfig: TypeLayerStyleConfig): Promise<TypeVectorLayerStyles> {
  return getLegendStyles(styleConfig);
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

// #region EXTENT
/**
 * Check if a point is contained in an extent
 * @param {Coordinate} point - The point
 * @param {Extent} extent - The extent
 * @returns True if point is within the extent, false otherwise
 */
export function isPointInExtent(point: Coordinate, extent: Extent): boolean {
  return containsCoordinate(extent, point);
}

/**
 * Returns the union of 2 extents.
 * @param {Extent | undefined} extentA First extent
 * @param {Extent | undefined} extentB Optional second extent
 * @returns {Extent | undefined} The union of the extents
 */
export function getExtentUnion(extentA: Extent | undefined, extentB?: Extent | undefined): Extent | undefined {
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
export function getExtentIntersection(extentA: Extent | undefined, extentB?: Extent | undefined): Extent | undefined {
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
 * Converts a polygon to an extent
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

/**
 * Checks validity of lat long, LCC, or Web Mercator extent and updates values if invalid.
 * @param {Extent} extent - The extent to validate.
 * @param {string} code - The projection code of the extent. Default EPSG:4326.
 * @returns {Extent} The validated extent
 */
export function validateExtent(extent: Extent, code: string = 'EPSG:4326'): Extent {
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
export function validateExtentWhenDefined(extent: Extent | undefined, code: string = 'EPSG:4326'): Extent | undefined {
  // Validate extent if it is defined
  if (extent) return validateExtent(extent, code);
  return undefined;
}

/**
 * Checks if a given extent is long/lat.
 * @param {Extent} extent - The extent to check.
 * @returns {boolean} Whether or not the extent is long/lat
 */
export function isExtentLonLat(extent: Extent): boolean {
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
export function getArea(geometry: Geometry): number {
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
export function getLength(geometry: Geometry): number {
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
export function calculateDistance(coordinates: Coordinate[], inProj: string, outProj: string): { total: number; sections: number[] } {
  const arr = Projection.transformPoints(coordinates, inProj, outProj);

  const geom = new LineString(arr);
  const sections: number[] = [];
  geom.forEachSegment((start, end) => {
    sections.push(Math.round((getLength(new LineString([start, end])) / 1000) * 100) / 100);
  });

  return { total: Math.round((getLength(geom) / 1000) * 100) / 100, sections };
}

/**
 * Gets meters per pixel for different projections
 * @param {TypeValidMapProjectionCodes} projection - The projection of the map
 * @param {number} resolution - The resolution of the map
 * @param {number?} lat - The latitude, only needed for Web Mercator
 * @returns {number} Number representing meters per pixel
 */
export function getMetersPerPixel(projection: TypeValidMapProjectionCodes, resolution: number, lat?: number): number {
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
export const getZoomFromScale = (view: View, targetScale: number | undefined, dpiValue?: number): number | undefined => {
  if (!targetScale) return undefined;
  const projection = view.getProjection();
  const mpu = projection.getMetersPerUnit();
  const dpi = dpiValue ?? 25.4 / 0.28; // OpenLayers default DPI

  // Calculate resolution from scale
  if (!mpu) return undefined;
  // Resolution = Scale / ( metersPerUnit * inchesPerMeter * DPI )
  const targetResolution = targetScale / (mpu * 39.37 * dpi);

  return view.getZoomForResolution(targetResolution) || undefined;
};

/**
 * Converts a map scale to zoom level
 * @param view The view for converting the zoom
 * @param zoom The desired zoom (e.g. 50000 for 1:50,000)
 * @returns number representing the closest scale for the given zoom number
 */
export const getScaleFromZoom = (view: View, zoom: number): number | undefined => {
  const projection = view.getProjection();
  const mpu = projection.getMetersPerUnit();
  if (!mpu) return undefined;

  const dpi = 25.4 / 0.28; // OpenLayers default DPI

  // Get resolution for zoom level
  const resolution = view.getResolutionForZoom(zoom);

  // Calculate scale from resolution
  // Scale = Resolution * metersPerUnit * inchesPerMeter * DPI
  return resolution * mpu * 39.37 * dpi;
};

/**
 * Gets map scale for Web Mercator or Lambert Conformal Conic projections
 * @param view The view to get the current scale from
 * @returns number representing scale (e.g. 50000 for 1:50,000)
 */
export const getMapScale = (view: View): number | undefined => {
  return getScaleFromZoom(view, view.getZoom() || 0);
};

/**
 * Gets the pointer position information from a Map Event and a specified projection.
 * @param {MapEvent} mapEvent - The map event
 * @param {string} projCode - The map projection code
 * @returns {TypeMapMouseInfo} An object representing pointer position information
 */
export const getPointerPositionFromMapEvent = (mapEvent: MapBrowserEvent, projCode: string): TypeMapMouseInfo => {
  // Return an object representing pointer position information
  return {
    projected: mapEvent.coordinate,
    pixel: mapEvent.pixel,
    lonlat: Projection.transformPoints([mapEvent.coordinate], projCode, Projection.PROJECTION_NAMES.LONLAT)[0],
    dragging: mapEvent.dragging,
  };
};

/**
 * Function for checking if two geometries have the same coordinates
 * @param {Geometry} geom1 - The first geometry
 * @param {Geometry} geom2 - The second geometry
 * @returns {boolean} Whether the two geometries are equal or not
 */
export const geometriesAreEqual = (geom1: Geometry, geom2: Geometry): boolean => {
  if (geom1.getType() !== geom2.getType()) return false;

  if (geom1 instanceof Point || geom1 instanceof LineString || geom1 instanceof Polygon) {
    const coords1 = geom1.getCoordinates();
    const coords2 = (geom2 as Point | LineString | Polygon).getCoordinates();
    return JSON.stringify(coords1) === JSON.stringify(coords2);
  }

  return false;
};
