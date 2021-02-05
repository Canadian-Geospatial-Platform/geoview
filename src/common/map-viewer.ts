import { Map } from 'leaflet';

import { ButtonPanel } from './ui/button-panel';

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
    // the id of the map
    id: string;

    // the leaflet map
    map: Map;

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
        this.id = mapInstance.id;

        this.map = mapInstance.map;

        this.vector = new Vector(mapInstance.map);

        this.buttonPanel = new ButtonPanel(mapInstance.map);
    }
}
