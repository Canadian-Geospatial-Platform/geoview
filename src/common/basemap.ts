/* eslint-disable no-multi-assign */
/* eslint-disable lines-between-class-members */
import { api } from '../api/api';
import { BasemapOptions } from '../api/config';
import { generateId } from './constant';
import { EVENT_NAMES } from '../api/event';
import { TypeMapViewer } from '../types/cgpv-types';

/**
 * interface for basemap basic properties
 */
interface BasemapLayerOptions {
    tms: boolean;
    tileSize: number;
    attribution: boolean;
    noWrap: boolean;
}

/**
 * interface used to define a new basemap layer
 */
export interface BasemapLayer {
    id: string;
    url: string;
    type: string;
    options: BasemapLayerOptions;
    opacity: number;
    basemapPaneName: string;
}

/**
 * interface used to define zoom levels for a basemap
 */
interface ZoomLevels {
    min: number;
    max: number;
}

/**
 * interface for attribution value
 */
export interface Attribution {
    'en-CA': string;
    'fr-CA': string;
}

/**
 * interface used to define a new basemap
 */
interface BasemapProps {
    id: string;
    name: string;
    type: string;
    description: string;
    descSummary: string;
    altText: string;
    thumbnailUrl: string | Array<string>;
    layers: BasemapLayer[];
    attribution: Attribution;
    zoomLevels: ZoomLevels;
}

/**
 * A class to get a Basemap for a define projection and language. For the moment, a list maps are available and
 * can be filtered by projection (currently only WM and LCC projections are listed,
 * in case other projections needed, they need to be added to the list)
 *
 * @export
 * @class Basemap
 */
export class Basemap {
    // used to hold all created basemaps for a map
    basemaps: BasemapProps[] = [];

    // the language to use
    language: string;

    // the basemap options passed from the map config
    private basemapOptions: BasemapOptions | null | undefined;

    // the projection number
    private projection: number;

    // the map id to be used in events
    private mapId!: string;

    // Pane Name for all basemap layers
    private basemapsPaneName!: string;

    /**
     * initialize basemap
     *
     * @param {BasemapOptions} basemapOptions optional basemap option properties, passed in from map config
     * @param {string} language language to be used either en-CA or fr-CA
     * @param {number} projection projection number
     */
    constructor(basemapOptions: BasemapOptions | null | undefined, language: string, projection: number) {
        this.basemapOptions = basemapOptions;

        this.language = language;

        this.projection = projection;
    }

    /**
     * init the basemap and load default basemap layers if provided in map configs
     *
     * @param {string} mapId the map id
     */
    init = (mapId: string): void => {
        this.mapId = mapId;

        const { map } = api.map(this.mapId) as TypeMapViewer;

        // create new pane to host basemap layers
        this.basemapsPaneName = 'basemapsPane';
        map.createPane(this.basemapsPaneName).style.zIndex = '10';

        if (this.basemapOptions) {
            this.loadDefaultBasemaps();
        }
    };

    /**
     * basemap list
     */
    basemapsList: Record<number, Record<string, string>> = {
        3978: {
            transport:
                'https://geoappext.nrcan.gc.ca/arcgis/rest/services/BaseMaps/CBMT_CBCT_GEOM_3978/MapServer/WMTS/tile/1.0.0/CBMT_CBCT_GEOM_3978/default/default028mm/{z}/{y}/{x}.jpg',
            simple:
                'https://geoappext.nrcan.gc.ca/arcgis/rest/services/BaseMaps/Simple/MapServer/WMTS/tile/1.0.0/Simple/default/default028mm/{z}/{y}/{x}.jpg',
            shaded:
                'https://geoappext.nrcan.gc.ca/arcgis/rest/services/BaseMaps/CBME_CBCE_HS_RO_3978/MapServer/WMTS/tile/1.0.0/CBMT_CBCT_GEOM_3978/default/default028mm/{z}/{y}/{x}.jpg',
            label:
                'https://geoappext.nrcan.gc.ca/arcgis/rest/services/BaseMaps/xxxx_TXT_3978/MapServer/WMTS/tile/1.0.0/xxxx_TXT_3978/default/default028mm/{z}/{y}/{x}.jpg',
        },
        3857: {
            transport:
                'https://geoappext.nrcan.gc.ca/arcgis/rest/services/BaseMaps/CBMT_CBCT_GEOM_3857/MapServer/WMTS/tile/1.0.0/BaseMaps_CBMT_CBCT_GEOM_3857/default/default028mm/{z}/{y}/{x}.jpg',
            label:
                'https://geoappext.nrcan.gc.ca/arcgis/rest/services/BaseMaps/xxxx_TXT_3857/MapServer/WMTS/tile/1.0.0/BaseMaps_xxxx_TXT_3857/default/default028mm/{z}/{y}/{x}.jpg',
        },
    };

    /**
     * basemap layer configuration
     */
    private basemapLayerOptions: BasemapLayerOptions = {
        tms: false,
        tileSize: 256,
        attribution: false,
        noWrap: false,
    };

    /**
     * attribution to add the the map
     */
    private attributionVal: Attribution = {
        'en-CA': '© Her Majesty the Queen in Right of Canada, as represented by the Minister of Natural Resources',
        'fr-CA': '© Sa Majesté la Reine du Chef du Canada, représentée par le ministre des Ressources naturelles',
    };

    /**
     * Build basemap array using projection and language...
     *
     * @return {BasemapLayer[]} basemapLayers the array of basemap layer
     */
    getBasemapLayers(): BasemapLayer[] {
        const basemapLayers: BasemapLayer[] = [];
        let mainBasemapOpacity = 1;

        if (this.basemapOptions) {
            if (this.basemapOptions.shaded !== false) {
                basemapLayers.push({
                    id: 'shaded',
                    type: 'shaded',
                    url: this.basemapsList[this.projection].shaded,
                    options: this.basemapLayerOptions,
                    opacity: mainBasemapOpacity,
                    basemapPaneName: this.basemapsPaneName,
                });
                mainBasemapOpacity = 0.75;
            }

            basemapLayers.push({
                id: this.basemapOptions.id || 'transport',
                type: 'transport',
                url: this.basemapsList[this.projection][this.basemapOptions.id] || this.basemapsList[this.projection].transport,
                options: this.basemapLayerOptions,
                opacity: mainBasemapOpacity,
                basemapPaneName: this.basemapsPaneName,
            });

            if (this.basemapOptions.labeled !== false) {
                // get proper label url
                basemapLayers.push({
                    id: 'label',
                    type: 'label',
                    url: this.basemapsList[this.projection].label.replaceAll('xxxx', this.language === 'en-CA' ? 'CBMT' : 'CBCT'),
                    options: this.basemapLayerOptions,
                    opacity: 1,
                    basemapPaneName: this.basemapsPaneName,
                });
            }
        }

        return basemapLayers;
    }

    /**
     * load the default basemaps that was passed in the map config
     */
    loadDefaultBasemaps = (): void => {
        const layers = this.getBasemapLayers();

        // emit an event to update the basemap layers on the map
        api.event.emit(EVENT_NAMES.EVENT_BASEMAP_LAYERS_UPDATE, this.mapId, {
            layers,
        });
    };

    /**
     * Create a new basemap
     *
     * @param {BasemapProps} basemapProps basemap properties
     */
    createBasemap = (basemapProps: BasemapProps): void => {
        // generate an id if none provided
        // eslint-disable-next-line no-param-reassign
        if (!basemapProps.id) basemapProps.id = generateId(basemapProps.id);

        const thumbnailUrls: string[] = [];

        // set thumbnail if not provided
        if (!basemapProps.thumbnailUrl || basemapProps.thumbnailUrl.length === 0) {
            basemapProps.layers.forEach((layer) => {
                const { type } = layer;

                // eslint-disable-next-line no-param-reassign
                layer.basemapPaneName = this.basemapsPaneName;

                if (type === 'transport') {
                    thumbnailUrls.push(
                        this.basemapsList[this.projection].transport
                            .replace('{z}', '8')
                            .replace('{y}', this.projection === 3978 ? '285' : '91')
                            .replace('{x}', this.projection === 3978 ? '268' : '74')
                    );
                }

                if (type === 'shaded') {
                    thumbnailUrls.push(
                        this.basemapsList[this.projection].shaded
                            .replace('{z}', '8')
                            .replace('{y}', this.projection === 3978 ? '285' : '91')
                            .replace('{x}', this.projection === 3978 ? '268' : '74')
                    );
                }

                if (type === 'label') {
                    thumbnailUrls.push(
                        this.basemapsList[this.projection].label
                            .replace('xxxx', this.language === 'en-CA' ? 'CBMT' : 'CBCT')
                            .replace('{z}', '8')
                            .replace('{y}', this.projection === 3978 ? '285' : '91')
                            .replace('{x}', this.projection === 3978 ? '268' : '74')
                    );
                }
            });

            // eslint-disable-next-line no-param-reassign
            basemapProps.thumbnailUrl = thumbnailUrls;
        }

        // add the basemap to the basemaps
        this.basemaps.push(basemapProps);

        if (this.basemaps.length === 1) this.setBasemap(basemapProps.id);
    };

    /**
     * Set the current basemap and update the basemap layers on the map
     *
     * @param {string} id the id of the basemap
     */
    setBasemap = (id: string): void => {
        // get basemap by id
        const basemap = this.basemaps.filter((basemapType: BasemapProps) => basemapType.id === id)[0];

        // emit an event to update the basemap layers on the map
        api.event.emit(EVENT_NAMES.EVENT_BASEMAP_LAYERS_UPDATE, this.mapId, {
            layers: basemap.layers,
        });
    };

    /**
     * get attribution value to add the the map
     *
     * @returns returns the attribution value
     */
    get attribution(): Attribution {
        return this.attributionVal;
    }
}
