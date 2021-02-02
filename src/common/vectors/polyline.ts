import L, { LatLngExpression } from 'leaflet';

import { GeometryType } from './vector';

/**
 * Class used to create and manage polylines
 *
 * @export
 * @class Polyline
 */
export class Polyline {
    /**
     * Create a polyline using an array of lat/lng points and add it to the layer group
     *
     * @param {string} id the id of the geometry
     * @param {LatLngExpression[] | LatLngExpression[][]} points points of lat/lng to draw a polyline
     * @param options polyline options including styling
     *
     * @returns a geometry with the id and the created polyline layer
     */
    createPolyline = (id: string, points: LatLngExpression[] | LatLngExpression[][], options: Record<string, unknown>): GeometryType => {
        const polyline = L.polyline(points, options);

        return {
            id,
            layer: polyline,
        };
    };
}
