import L, { LatLngExpression } from 'leaflet';

import { TypeGeometry, ConstVectorTypes } from '../../types/cgpv-types';

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
     * @param {Record<string, unknown>} options polygon options including styling
     *
     * @returns a geometry with the id and the created polygon layer
     */
    createPolygon = (
        polygonId: string,
        points: LatLngExpression[] | LatLngExpression[][] | LatLngExpression[][][],
        options: Record<string, unknown>
    ): TypeGeometry => {
        const polygon: TypeGeometry = (L.polygon(points, options) as unknown) as TypeGeometry;
        polygon.id = polygonId;
        polygon.type = ConstVectorTypes.POLYGON;

        return polygon;
    };
}
