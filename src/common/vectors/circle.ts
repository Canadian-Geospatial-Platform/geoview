import L from 'leaflet';

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
     * @param {L.CircleMarkerOptions} options circle options including styling
     *
     * @returns a geometry with the id and the created circle layer
     */
    createCircle = (circleId: string, latitude: number, longitude: number, radius: number, options: L.CircleMarkerOptions): L.Circle => {
        // radius is in meters, multiply by 1000 to convert it to km
        const circle = L.circle([latitude, longitude], {
            ...options,
            radius: radius * 1000,
            id: circleId,
        });

        return circle;
    };

    /**
     * Create a new circle marker and add it to the layer group
     *
     * @param {string} circleMarkerId the id of this geometry
     * @param {number} latitude the latitude position of the circle marker
     * @param {number} longitude the longitude position of the circle marker
     * @param {number} radius the radius (in meters)
     * @param {L.CircleMarkerOptions} options circle marker options including styling
     *
     * @returns a geometry with the id and the created circle marker layer
     */
    createCircleMarker = (
        circleMarkerId: string,
        latitude: number,
        longitude: number,
        radius: number,
        options: L.CircleMarkerOptions
    ): L.CircleMarker => {
        const circleMarker = L.circleMarker([latitude, longitude], {
            ...options,
            radius,
            id: circleMarkerId,
        });

        return circleMarker;
    };
}
