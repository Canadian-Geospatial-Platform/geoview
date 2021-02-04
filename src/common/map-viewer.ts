import { Map } from 'leaflet';

import { ButtonPanel } from './button-panel';

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

    // used to access button panel API to create buttons and button panels
    buttonPanel: ButtonPanel;

    /**
     * Initialize a new map instance and map APIs
     *
     * @param mapInstance map instance containing ID and Leaflet map instance
     */
    constructor(mapInstance: MapInterface) {
        this.mapInstance = mapInstance;

        this.vector = new Vector(mapInstance.map);

        this.buttonPanel = new ButtonPanel();
    }
}
