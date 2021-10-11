import L from 'leaflet';

/**
 * Class used to create and manage markers
 *
 * @export
 * @class Marker
 */
export class MarkerCGP {
    /**
     * Create a new marker
     *
     * @param {string} markerId the id of this geometry
     * @param {number} latitude the latitude position of the circle
     * @param {number} longitude the longitude position of the circle
     * @param {Record<string, unknown>} options marker options including styling
     *
     * @returns a geometry with the id and the created marker layer
     */
    createMarker = (markerId: string, latitude: number, longitude: number, options: Record<string, unknown>): L.Marker => {
        const marker = L.marker([latitude, longitude], {
            ...options,
            id: markerId,
        });

        return marker;
    };
}
