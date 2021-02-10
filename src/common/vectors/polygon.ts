import L, { LatLngExpression } from 'leaflet';

import { GeometryType, VectorTypes } from './vector';

/**
 * Class used to create and manage polygons
 *
 * @export
 * @class Polygon
 */
export class Polygon {
    /**
     * Create a new polygon and add it to the layer group
     *
     * @param {string} id the id of this geometry
     * @param {LatLngExpression[] | LatLngExpression[][] | LatLngExpression[][][]} points an array of points to create the polygon
     * @param {Record<string, unknown>} options polygon options including styling
     *
     * @returns a geometry with the id and the created polygon layer
     */
    createPolygon = (
        id: string,
        points: LatLngExpression[] | LatLngExpression[][] | LatLngExpression[][][],
        options: Record<string, unknown>
    ): GeometryType => {
        const polygon = L.polygon(points, options);

        return {
            id,
            layer: polygon,
            type: VectorTypes.POLYGON,
        };
    };
}
