import L, { LatLngExpression } from 'leaflet';

import { TypeGeometry, ConstVectorTypes } from '../../types/cgpv-types';

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
     * @param {Record<string, unknown>} options polyline options including styling
     *
     * @returns a geometry with the id and the created polyline layer
     */
    createPolyline = (
        polylineId: string,
        points: LatLngExpression[] | LatLngExpression[][],
        options: Record<string, unknown>
    ): TypeGeometry => {
        const polyline: TypeGeometry = (L.polyline(points, options) as unknown) as TypeGeometry;
        polyline.id = polylineId;
        polyline.type = ConstVectorTypes.POLYLINE;

        return polyline;
    };
}
