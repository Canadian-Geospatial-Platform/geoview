/* eslint-disable lines-between-class-members */
/**
 * A class to get a Basemap for a define projection and language. For the moment, a list maps are available and
 * can be filtered by projection (currently only WM and LCC projections are listed,
 *  in case other projections needed, they need to be added to the list)
 * * @export
 * @class Basemap
 */
/**
 * basemap basic properties
 */
interface BasemapLayerOptions {
    tms: boolean;
    tileSize: number;
    attribution: boolean;
    noWrap: boolean;
}

/**
 * single basemap to be added to the map
 */
interface BasemapLayer {
    id: string;
    url: string;
    options: BasemapLayerOptions;
    opacity: number;
}

/**
 * Attribution value
 */
export interface Attribution {
    'en-CA': string;
    'fr-CA': string;
}

/**
 * basemap options interface
 */
export interface BasemapOptions {
    id: string;
    shaded: boolean;
    labeled: boolean;
}

/**
 * basemap calss
 */
export class Basemap {
    private basemapOptions: BasemapOptions;

    /**
     * basemap constructor properties
     */
    constructor(basemapOptions: BasemapOptions) {
        this.basemapOptions = basemapOptions;
    }

    basemapsList = {
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
     * @param {string} language the language for the map
     * @param {number} csrID the projection id
     * @return {BasemapLayer[]} basemapLayers the array of basemap layer
     */
    getBasemapLayers(language: string, crsID: number): BasemapLayer[] {
        const basemapLayers: BasemapLayer[] = [];
        let mainBasemapOpacity = 1;

        if (this.basemapOptions.shaded !== false) {
            basemapLayers.push({
                id: 'shaded',
                url: this.basemapsList[crsID].shaded,
                options: this.basemapLayerOptions,
                opacity: mainBasemapOpacity,
            });
            mainBasemapOpacity = 0.75;
        }

        basemapLayers.push({
            id: this.basemapOptions.id || 'transport',
            url: this.basemapsList[crsID][this.basemapOptions.id] || this.basemapsList[crsID].transport,
            options: this.basemapLayerOptions,
            opacity: mainBasemapOpacity,
        });

        if (this.basemapOptions.labeled !== false) {
            // get proper label url
            language === 'en-CA'
                ? basemapLayers.push({
                      id: 'label',
                      url: this.basemapsList[crsID].label.replaceAll('xxxx', 'CBMT'),
                      options: this.basemapLayerOptions,
                      opacity: 1,
                  })
                : basemapLayers.push({
                      id: 'label',
                      url: this.basemapsList[crsID].label.replaceAll('xxxx', 'CBCT'),
                      options: this.basemapLayerOptions,
                      opacity: 1,
                  });
        }

        return basemapLayers;
    }

    /**
     * get attribution value to add the the map
     */
    get attribution(): Attribution {
        return this.attributionVal;
    }
}
