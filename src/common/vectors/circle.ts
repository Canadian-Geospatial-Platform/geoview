import L from 'leaflet';

import { GeometryType, VectorTypes } from './vector';

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
     * @param {string} id the id of this geometry
     * @param {number} latitude the latitude position of the circle
     * @param {number} longitude the longitude position of the circle
     * @param {number} radius the radius (in kilometers)
     * @param {Record<string, unknown>} options circle options including styling
     *
     * @returns a geometry with the id and the created circle layer
     */
    createCircle = (id: string, latitude: number, longitude: number, radius: number, options: Record<string, unknown>): GeometryType => {
        // radius is in meters, multiply by 1000 to convert it to km
        const circle = L.circle([latitude, longitude], {
            ...options,
            radius: radius * 1000,
        });

        return {
            id,
            layer: circle,
            type: VectorTypes.CIRCLE,
        };
    };

    /**
     * Create a new circle marker and add it to the layer group
     *
     * @param {string} id the id of this geometry
     * @param {number} latitude the latitude position of the circle marker
     * @param {number} longitude the longitude position of the circle marker
     * @param {number} radius the radius (in meters)
     * @param {Record<string, unknown>} options circle marker options including styling
     *
     * @returns a geometry with the id and the created circle marker layer
     */
    createCircleMarker = (
        id: string,
        latitude: number,
        longitude: number,
        radius: number,
        options: Record<string, unknown>
    ): GeometryType => {
        const circleMarker = L.circleMarker([latitude, longitude], {
            ...options,
            radius,
        });

        return {
            id,
            layer: circleMarker,
            type: VectorTypes.CIRCLE_MARKER,
        };
    };
}
