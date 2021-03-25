import { api } from './../api/api';
/* eslint-disable global-require */
/* eslint-disable @typescript-eslint/no-var-requires */
import { Map } from 'leaflet';

import queryString from 'query-string';

import { ButtonPanel } from './ui/button-panel';
import { Vector } from './vectors/vector';
import { MapConfigProps } from '../api/config';
import { Basemap } from './basemap';
import { Layer } from './layers/layer';

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
    mapProps: MapConfigProps;

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

    // used to access layers functions
    layer: Layer;

    // get used language
    language: string;

    // get used projection
    projection: number;

    /**
     * Initialize map props and basemaps
     *
     * @param {MapConfigProps} mapProps map properties
     */
    constructor(mapProps: MapConfigProps) {
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

        // initialize layers and load the layers passed in from map config if any
        this.layer = new Layer(this.id, mapInstance.map, this.mapProps.layers);

        this.buttonPanel = new ButtonPanel(mapInstance.map);

        // check if geometries are provided from url
        this.loadGeometries();

        // init basemap and pass in the map id to be able to access the map instance
        this.basemap.init(this.id);

        // load plugins if provided in the config
        if (this.mapProps.plugins && this.mapProps.plugins.length > 0) {
            this.mapProps.plugins.forEach((plugin) => {
                api.plugin.addPlugin(plugin, null, {
                    mapId: this.id,
                });
            });
        }
    };

    /**
     * Check if geometries needs to be loaded from a URL geoms parameter
     */
    loadGeometries(): void {
        // see if a data geometry endpoint is configured and geoms param is provided then get the param value(s)
        const servEndpoint = this.map.getContainer()?.closest('.llwp-map')?.getAttribute('data-geometry-endpoint') || '';
        // eslint-disable-next-line no-restricted-globals
        const parsed = queryString.parse(location.search);

        if (parsed.geoms && servEndpoint !== '') {
            const geoms = (parsed.geoms as string).split(',');

            // for the moment, only polygon are supported but if need be, other geometries can easely be use as well
            geoms.forEach((key: string) => {
                fetch(`${servEndpoint}${key}`).then((response) => {
                    // only process valid response
                    if (response.status === 200) {
                        response.json().then((data) => {
                            if (typeof data.geometry !== 'undefined') {
                                // reverse the array because they are x, y instead of default lat long couple y, x
                                // TODO: check if we can know and set this info from outside
                                data.geometry.coordinates.forEach((r: Array<Array<number>>) =>
                                    r.forEach((c: Array<number>) => c.reverse())
                                );

                                // add the geometry
                                // TODO: use the vector as GeoJSON and add properties to by queried by the details panel
                                this.vector.addPolygon(data.geometry.coordinates, {});
                            }
                        });
                    }
                });
            });
        }
    }
}
