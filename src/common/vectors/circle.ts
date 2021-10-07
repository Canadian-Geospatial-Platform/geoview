import L from 'leaflet';

import { TypeGeometry, ConstVectorTypes } from '../../types/cgpv-types';

/**
 * Class used to create and manage circles and circle markers
 *
 * @export
 * @class Circle
 */
export class Circle {
    /**
     * Create a new circle and add it to the layer group
     *
     * @param {string} circleId the id of this geometry
     * @param {number} latitude the latitude position of the circle
     * @param {number} longitude the longitude position of the circle
     * @param {number} radius the radius (in kilometers)
     * @param {Record<string, unknown>} options circle options including styling
     *
     * @returns a geometry with the id and the created circle layer
     */
    createCircle = (
        circleId: string,
        latitude: number,
        longitude: number,
        radius: number,
        options: Record<string, unknown>
    ): TypeGeometry => {
        // radius is in meters, multiply by 1000 to convert it to km
        const circle: TypeGeometry = (L.circle([latitude, longitude], {
            ...options,
            radius: radius * 1000,
        }) as unknown) as TypeGeometry;
        circle.id = circleId;
        circle.type = ConstVectorTypes.CIRCLE;

        return circle;
    };

    /**
     * Create a new circle marker and add it to the layer group
     *
     * @param {string} circleMarkerId the id of this geometry
     * @param {number} latitude the latitude position of the circle marker
     * @param {number} longitude the longitude position of the circle marker
     * @param {number} radius the radius (in meters)
     * @param {Record<string, unknown>} options circle marker options including styling
     *
     * @returns a geometry with the id and the created circle marker layer
     */
    createCircleMarker = (
        circleMarkerId: string,
        latitude: number,
        longitude: number,
        radius: number,
        options: Record<string, unknown>
    ): TypeGeometry => {
        const circleMarker: TypeGeometry = (L.circleMarker([latitude, longitude], {
            ...options,
            radius,
        }) as unknown) as TypeGeometry;
        circleMarker.id = circleMarkerId;
        circleMarker.type = ConstVectorTypes.CIRCLE_MARKER;

        return circleMarker;
    };
}
