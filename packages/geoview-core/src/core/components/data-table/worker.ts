// projectionWorker.ts
import proj4 from 'proj4';
import { register } from 'ol/proj/proj4';

let sourceCRS: string;
let targetCRS: string;

proj4.defs(
  'EPSG:3978',
  '+proj=lcc +lat_1=49 +lat_2=77 +lat_0=49 +lon_0=-95 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs'
);
register(proj4);

function transformPoint(points: number[][]): number[][] {
  // initialize empty array for the converted points
  const converted: Array<Array<number>> = [];

  // if the points is an array and has some points
  if (Array.isArray(points) && points.length > 0) {
    // if the array contains another set of arrays containing points
    if (Array.isArray(points[0])) {
      // loop through each point
      for (let i = 0; i < points.length; i++) {
        // convert the points from one projection to another
        const coords = proj4(sourceCRS, targetCRS, points[i]);

        // add the converted points
        converted.push(coords);
      }
    }
  }

  return converted;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformGeometry(geometry: any) {
  if (!geometry) return null;

  const { type, coordinates } = geometry;

console.log(type, coordinates);
  switch (type) {
    case 'Point':
      return {
        type,
        coordinates: transformPoint(coordinates)[0],
      };
    case 'LineString':
      return {
        type,
        coordinates: coordinates.map(transformPoint),
      };
    case 'MultiPoint':
      return {
        type,
        coordinates: coordinates.map(transformPoint),
      };
    case 'Polygon':
      return {
        type,
        coordinates: coordinates.map((coords) => {
          return coords.map((coord) => transformPoint([coord])[0]);
        }),
      };
    case 'MultiLineString':
      return {
        type,
        coordinates: coordinates.map((coords) => {
          return coords.map((coord) => transformPoint([coord])[0]);
        }),
      };
    case 'MultiPolygon':
      return {
        type,
        coordinates: coordinates[0].map((coords) => {
          return coords.map((coord) => transformPoint([coord])[0]);
        }),
      };
    default:
      return geometry;
  }
}

// eslint-disable-next-line no-restricted-globals
self.onmessage = (event) => {
  const { type, projectionInfo, chunk, isFirst } = event.data;

  if (type === 'init') {
    sourceCRS = projectionInfo.sourceCRS;
    targetCRS = projectionInfo.targetCRS;
    return;
  }

  if (type !== 'process') return;

  let result = '';
  if (isFirst) {
    result += '{"type":"FeatureCollection","features":[';
  } else if (chunk.length > 0) {
    result += ',';
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const processedChunk = chunk.map((feature: any) => {
    const { geometry, properties } = feature;
    const transformedGeometry = transformGeometry(geometry);
    return JSON.stringify({
      type: 'Feature',
      geometry: transformedGeometry,
      properties,
    });
  });

  result += processedChunk.join(',');

  // eslint-disable-next-line no-restricted-globals
  self.postMessage(result);
};
