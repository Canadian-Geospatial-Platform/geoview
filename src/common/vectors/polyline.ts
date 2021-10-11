import L, { LatLngExpression } from 'leaflet';

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
     * @param {string} polylineId the id of the geometry
     * @param {LatLngExpression[] | LatLngExpression[][]} points points of lat/lng to draw a polyline
     * @param {L.PolylineOptions} options polyline options including styling
     *
     * @returns a geometry with the id and the created polyline layer
     */
    createPolyline = (polylineId: string, points: LatLngExpression[] | LatLngExpression[][], options: L.PolylineOptions): L.Polyline => {
        const polyline = L.polyline(points, { ...options, id: polylineId });

        return polyline;
    };
}
