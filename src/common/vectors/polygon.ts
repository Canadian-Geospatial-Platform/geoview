import L from 'leaflet';

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
     * @param {string} polygonId the id of this geometry
     * @param {LatLngExpression[] | LatLngExpression[][] | LatLngExpression[][][]} points an array of points to create the polygon
     * @param {L.PolylineOptions} options polygon options including styling
     *
     * @returns a geometry with the id and the created polygon layer
     */
    createPolygon = (
        polygonId: string,
        points: L.LatLngExpression[] | L.LatLngExpression[][] | L.LatLngExpression[][][],
        options: L.PolylineOptions
    ): L.Polygon => {
        const polygon = L.polygon(points, { ...options, id: polygonId });

        return polygon;
    };
}
