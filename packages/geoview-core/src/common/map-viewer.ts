/* eslint-disable global-require */
/* eslint-disable @typescript-eslint/no-var-requires */
// import L from 'leaflet';
import queryString from 'query-string';

import { ButtonPanel } from './ui/button-panel';
import { Vector } from './layers/vector';
import { Basemap } from './basemap';
import { Layer } from './layers/layer';
import { MarkerCluster } from './layers/marker-cluster';
import '../types/cgp-leaflet-config';

import { api } from '../api/api';
import { Cast, TypeWindow, TypeMapConfigProps } from '../types/cgpv-types';
import { generateId } from './constant';

/**
 * Class used to manage created maps
 *
 * @export
 * @class MapViewer
 */
export class MapViewer {
    // map config properties
    mapProps: TypeMapConfigProps;

    // the id of the map
    id!: string;

    // the leaflet map
    map!: L.Map;

    // used to access vector API to create and manage geometries
    vector!: Vector;

    // used to access marker cluster API to create and manage marker cluster groups
    markerCluster!: MarkerCluster;

    // used to access button panel API to create buttons and button panels
    buttonPanel!: ButtonPanel;

    // used to access basemap functions
    basemap: Basemap;

    // used to access layers functions
    layer!: Layer;

    // get used language
    language: string;

    // get used projection
    projection: number;

    /**
     * Initialize map props and basemaps
     *
     * @param {TypeMapConfigProps} mapProps map properties
     */
    constructor(mapProps: TypeMapConfigProps, cgpMap: L.Map) {
        // add map viewer instance to api
        api.maps.push(this);

        this.mapProps = mapProps;

        this.language = mapProps.language;
        this.projection = mapProps.projection;

        this.id = cgpMap.id as string;
        this.map = cgpMap;

        this.markerCluster = new MarkerCluster(cgpMap);

        this.vector = new Vector(cgpMap);

        // initialize layers and load the layers passed in from map config if any
        this.layer = new Layer(cgpMap, this.mapProps.layers);

        this.buttonPanel = new ButtonPanel(cgpMap);

        // check if geometries are provided from url
        this.loadGeometries();

        // create basemap and pass in the map id to be able to access the map instance
        this.basemap = new Basemap(mapProps.basemapOptions, mapProps.language, mapProps.projection, this.id);

        // load plugins if provided in the config
        if (this.mapProps.plugins && this.mapProps.plugins.length > 0) {
            this.mapProps.plugins.forEach((plugin) => {
                const { plugins } = Cast<TypeWindow>(window);
                if (plugins && plugins[plugin]) {
                    api.plugin.addPlugin(plugin, plugins[plugin], {
                        mapId: this.id,
                    });
                } else {
                    api.plugin.addPlugin(plugin, null, {
                        mapId: this.id,
                    });
                }
            });
        }
    }

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
                                this.vector.addPolygon(data.geometry.coordinates, { id: generateId('') });
                            }
                        });
                    }
                });
            });
        }
    }
}
