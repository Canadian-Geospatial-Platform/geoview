/* eslint-disable global-require */
/* eslint-disable @typescript-eslint/no-var-requires */
import { Map } from 'leaflet';

import { ButtonPanel } from './ui/button-panel';
import { Vector } from './vectors/vector';
import { MapProps } from '../components/map/map';
import { Basemap } from './basemap';

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
    // map config properties
    mapProps: MapProps;

    // the id of the map
    id!: string;

    // the leaflet map
    map!: Map;

    // used to access vector API to create and manage geometries
    vector!: Vector;

    // used to access button panel API to create buttons and button panels
    buttonPanel!: ButtonPanel;

    // used to access basemap functions
    basemap: Basemap;

    // get used language
    language: string;

    // get used projection
    projection: number;

    /**
     * Initialize map props and basemaps
     *
     * @param {MapProps} mapProps map properties
     */
    constructor(mapProps: MapProps) {
        this.mapProps = mapProps;

        this.language = mapProps.language;
        this.projection = mapProps.projection;

        this.basemap = new Basemap(mapProps.basemapOptions, mapProps.language, mapProps.projection);
    }

    /**
     * initialize the map interface, map apis and load plugins
     *
     * @param {MapInterface} mapInstance map instance containing ID and Leaflet map instance
     */
    init = (mapInstance: MapInterface): void => {
        this.id = mapInstance.id;

        this.map = mapInstance.map;

        this.vector = new Vector(mapInstance.map);

        this.buttonPanel = new ButtonPanel(mapInstance.map);

        // init basemap
        this.basemap.init(this.id);
    };
}
