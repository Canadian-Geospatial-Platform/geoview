import { expose } from 'comlink';
import proj4 from 'proj4';
import { register } from 'ol/proj/proj4';
import { Coordinate } from 'ol/coordinate';

import { createWorkerLogger } from '@/core/workers/helper/logger-worker';
import { TypeJsonObject } from '@/api/config/types/config-types';

/**
 * This worker script is designed to be used with the JsonExportWorker class.
 * It handles the transformation of GeoJSON features from one coordinate system to another.
 *
 * The main operations are:
 * 1. Initialization: Set up the source and target coordinate reference systems.
 * 2. Processing: Transform chunks of GeoJSON features, converting their geometries.
 *
 * The worker uses proj4 for coordinate transformations and includes a custom
 * definition for the EPSG:3978 projection.
 */

type TypeWorkerExportGeometry = {
  type: string;
  coordinates: Coordinate | Coordinate[] | Coordinate[][] | Coordinate[][][];
};

// Type related to the worker
export type TypeWorkerExportChunk = {
  geometry: TypeJsonObject;
  properties: {
    [k: string]: unknown;
  };
};
export type TypeWorkerExportProjectionInfo = {
  sourceCRS: string;
  targetCRS: string;
};

// Initialize the worker logger
const logger = createWorkerLogger('json-export-worker');

// Variables to store the source and target coordinate reference systems
let sourceCRS: string;
let targetCRS: string;

// Register the EPSG:3978 projection. This is needed because wroker does not work on same thread as main
// and do not have access to our already define proj4 version.
proj4.defs(
  'EPSG:3978',
  '+proj=lcc +lat_1=49 +lat_2=77 +lat_0=49 +lon_0=-95 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs'
);
register(proj4);

/**
 * Transforms an array of points from the source CRS to the target CRS.
 * @param {Coordinate[]} points - Array of points coordinates to transform.
 * @returns {Coordinate[]} Array of transformed points coordinates.
 */
function transformPoints(points: Coordinate[]): Coordinate[] {
  const converted: Array<Array<number>> = [];

  if (Array.isArray(points) && points.length > 0) {
    if (Array.isArray(points[0])) {
      for (let i = 0; i < points.length; i++) {
        const coords = proj4(sourceCRS, targetCRS, points[i]);
        converted.push(coords);
      }
    }
  }

  return converted;
}

/**
 * Transforms the geometry of a GeoJSON feature.
 * @param {TypeWorkerExportGeometry} geometry - The geometry to transform.
 * @returns {TypeJsonObject} The transformed geometry.
 */
function transformGeometry(geometry: TypeWorkerExportGeometry): TypeJsonObject {
  const { type, coordinates } = geometry;

  let transformedGeometry = {};
  if (type === 'Polygon') {
    // coordinates are in the form of Coordinate[][]
    transformedGeometry = {
      type: 'Polygon',
      coordinates: (coordinates as Coordinate[][]).map((coords: Coordinate[]) => {
        return coords.map((coord: Coordinate) => transformPoints([coord])[0]);
      }),
    };
  } else if (type === 'MultiPolygon') {
    // coordinates are in the form of Coordinate[][][]
    transformedGeometry = {
      type: 'MultiPolygon',
      coordinates: (coordinates as Coordinate[][][]).map((coords1: Coordinate[][]) => {
        return coords1.map((coords2: Coordinate[]) => {
          return coords2.map((coord: Coordinate) => transformPoints([coord])[0]);
        });
      }),
    };
  } else if (type === 'LineString') {
    // coordinates are in the form of Coordinate[]
    transformedGeometry = {
      type: 'LineString',
      coordinates: (coordinates as Coordinate[]).map((coord: Coordinate) => transformPoints([coord])[0]),
    };
  } else if (type === 'MultiLineString') {
    // coordinates are in the form of Coordinate[][]
    transformedGeometry = {
      type: 'MultiLineString',
      coordinates: (coordinates as Coordinate[][]).map((coords: Coordinate[]) => {
        return coords.map((coord: Coordinate) => transformPoints([coord])[0]);
      }),
    };
  } else if (type === 'Point') {
    // coordinates are in the form of Coordinate
    transformedGeometry = { type: 'Point', coordinates: transformPoints([coordinates as Coordinate])[0] };
  } else if (type === 'MultiPoint') {
    // coordinates are in the form of Coordinate[]
    transformedGeometry = {
      type: 'MultiPoint',
      coordinates: (coordinates as Coordinate[]).map((coord: Coordinate) => transformPoints([coord])[0]),
    };
  }

  return transformedGeometry;
}

/**
 * The main worker object containing methods for initialization and processing.
 */
const worker = {
  /**
   * Initializes the worker with projection information.
   * @param {TypeWorkerExportProjectionInfo} projectionInfo - The projection information.
   */
  init(projectionInfo: TypeWorkerExportProjectionInfo) {
    try {
      sourceCRS = projectionInfo.sourceCRS;
      targetCRS = projectionInfo.targetCRS;
      logger.logTrace('init worker', `Worker initialized with sourceCRS: ${sourceCRS}, targetCRS: ${targetCRS}`);
    } catch (error: unknown) {
      logger.logError('init worker', error);
    }
  },

  /**
   * Processes a chunk of GeoJSON features, transforming their geometries.
   * @param {TypeWorkerExportChunk[]} chunk - The chunk of GeoJSON features to process.
   * @param {boolean} isFirst - Indicates if this is the first chunk of the dataset.
   * @returns {string} A JSON string of the processed features.
   */
  process(chunk: TypeWorkerExportChunk[], isFirst: boolean): string {
    try {
      logger.logTrace('process worker', `Processing chunk of ${chunk.length} items`);
      let result = '';
      if (isFirst) {
        result += '{"type":"FeatureCollection","features":[';
      } else if (chunk.length > 0) {
        result += ',';
      }

      const processedChunk = chunk.map((feature: TypeWorkerExportChunk) => {
        const { geometry, properties } = feature;
        const transformedGeometry = transformGeometry(geometry as unknown as TypeWorkerExportGeometry);
        return JSON.stringify({
          type: 'Feature',
          geometry: transformedGeometry,
          properties,
        });
      });

      result += processedChunk.join(',');

      logger.logTrace('process worker', `Finished processing`);
      return result;
    } catch (error: unknown) {
      logger.logError('process worker', error);
      return '';
    }
  },
};

// Expose the worker methods to be accessible from the main thread
expose(worker);
export default {} as typeof Worker & { new (): Worker };
