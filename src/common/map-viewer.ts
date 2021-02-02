import { Map } from 'leaflet';

import { Vector } from './vectors/vector';

/**
 * interface used to store created maps
 */
export interface MapInterface {
    id: string;
    map: Map;
}

/**
 * Class used to manage created maps
 *
 * @export
 * @class MapViewer
 */
export class MapViewer {
    // used to access the instance of a map
    mapInstance: MapInterface;

    // used to access vector API to create and manage geometries
    vector: Vector;

    /**
     * Initialize a new map instance and map APIs
     *
     * @param mapInstance map instance containing ID and Leaflet map instance
     */
    constructor(mapInstance: MapInterface) {
        this.mapInstance = mapInstance;
        this.vector = new Vector(mapInstance.map);
    }
}
