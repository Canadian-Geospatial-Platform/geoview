import L from 'leaflet';
import 'proj4leaflet';

/**
 * A class to get the projection object if not Web Mercator. By default leaflet support only EPSG: 3857.
 * We made it support 3978. For every new projection, add to this class and add a new basemap to the Basemap class as well.
 *
 * @export
 * @class Projection
 */
export class Projection {
    /**
     * Get the proper projection paramters to set for the map.
     *
     * @param {string} epsg
     * @returns {projection is L.CRS}
     */
    static getProjection(epsg: number): L.CRS {
        let projection: L.CRS = L.CRS.EPSG3857;
        if (epsg === 3978) {
            projection = this.getLCCProjection();
        }

        return projection;
    }

    /**
     * Get the LCC project paramters to set for the map.
     *
     * @returns {projection is object}
     */
    private static getLCCProjection(): L.CRS {
        // tile layer extent, expressed in local projection
        const bbox = [-4282638.061501402, -5153821.09213678, 4852210.175566408, 4376714.442097411];

        // tile layer scale and resolution
        const scale = [
            145000000,
            85000000,
            50000000,
            30000000,
            17500000,
            10000000,
            6000000,
            3500000,
            2000000,
            1200000,
            700000,
            420000,
            250000,
            145000,
            85000,
            50000,
            30000,
            17500,
            10000,
            6000,
        ];
        const resolutions = [
            38364.660062653464,
            22489.62831258996,
            13229.193125052918,
            7937.5158750317505,
            4630.2175937685215,
            2645.8386250105837,
            1587.5031750063501,
            926.0435187537042,
            529.1677250021168,
            317.50063500127004,
            185.20870375074085,
            111.12522225044451,
            66.1459656252646,
            38.36466006265346,
            22.48962831258996,
            13.229193125052918,
            7.9375158750317505,
            4.6302175937685215,
            2.6458386250105836,
            1.5875031750063502,
        ];

        // transformation matrix
        const transformation = new L.Transformation(1, -bbox[0], -1, bbox[3]);
        const p1 = L.point(4376714.442097411, -4282638.061501402);
        const p2 = L.point(-5153821.09213678, 4852210.175566408);

        // LCC projection
        const projection = new (L as unknown).Proj.CRS(
            'EPSG:3978',
            '+proj=lcc +lat_1=49 +lat_2=77 +lat_0=49 +lon_0=-95 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
            {
                resolutions,
                origin: [-3.46558e7, 3.931e7],
                bounds: L.bounds(p1, p2),
                transformation,
                scale,
            }
        );

        return projection;
    }
}
