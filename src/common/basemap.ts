/**
 * A class to get a basemap for a define projection. For the moment, we a  Web Mercator and a LCC basemap.
 * We intend to have only one basemap per projection to avoid the need of a basemap switcher.
 * If we add a new projection, we need to also add a basemap.
 *
 * @export
 * @class Basemap
 */
export class Basemap {
    private language = '';

    constructor(language: string) {
        this.language = language;
    }

    // LCC url's
    private lccUrls: string[] = [
        'https://geoappext.nrcan.gc.ca/arcgis/rest/services/BaseMaps/CBMT_CBCT_GEOM_3978/MapServer/WMTS/tile/1.0.0/CBMT_CBCT_GEOM_3978/default/default028mm/{z}/{y}/{x}.jpg',
        'https://geoappext.nrcan.gc.ca/arcgis/rest/services/BaseMaps/xxxx_TXT_3978/MapServer/WMTS/tile/1.0.0/xxxx_TXT_3978/default/default028mm/{z}/{y}/{x}.jpg',
    ];

    // Web Mercator url's
    private wbUrls: string[] = [
        'https://geoappext.nrcan.gc.ca/arcgis/rest/services/BaseMaps/CBMT_CBCT_GEOM_3857/MapServer/WMTS/tile/1.0.0/BaseMaps_CBMT_CBCT_GEOM_3857/default/default028mm/{z}/{y}/{x}.jpg',
        'https://geoappext.nrcan.gc.ca/arcgis/rest/services/BaseMaps/xxxx_TXT_3857/MapServer/WMTS/tile/1.0.0/BaseMaps_xxxx_TXT_3857/default/default028mm/{z}/{y}/{x}.png',
    ];

    private basemapConfig: BasemapConfig = {
        tms: false,
        tileSize: 256,
        attribution: false,
        noWrap: false,
    };

    // LCC basemap options
    private lccParamCBMT: BasemapOptions[] = [
        {
            id: 'lccGeomCBMT',
            url: this.lccUrls[0],
            options: this.basemapConfig,
        },
        {
            id: 'lccLabelCBMT',
            url: this.lccUrls[1],
            options: this.basemapConfig,
        },
    ];

    // Web Mercator basemap options
    private wmParamCBMT: BasemapOptions[] = [
        {
            id: 'wmGeomCBMT',
            url: this.wbUrls[0],
            options: this.basemapConfig,
        },
        {
            id: 'wmLabelCBMT',
            url: this.wbUrls[1],
            options: this.basemapConfig,
        },
    ];

    // attribution to add the the map
    private attributionVal: Attribution = {
        'en-CA': '&copy Her Majesty the Queen in Right of Canada, as represented by the Minister of Natural Resources',
        'fr-CA': '&copy Sa Majesté la Reine du Chef du Canada, représentée par le ministre des Ressources naturelles',
    };

    get lccCBMT(): BasemapOptions[] {
        // get proper label url
        this.lccParamCBMT[1].url =
            this.language === 'en-CA'
                ? this.lccParamCBMT[1].url.replaceAll('xxxx', 'CBMT')
                : this.lccParamCBMT[1].url.replaceAll('xxxx', 'CBCT');
        return this.lccParamCBMT;
    }

    get wmCBMT(): BasemapOptions[] {
        // get proper label url
        this.wmParamCBMT[1].url =
            this.language === 'en-CA'
                ? this.wmParamCBMT[1].url.replaceAll('xxxx', 'CBMT')
                : this.wmParamCBMT[1].url.replaceAll('xxxx', 'CBCT');

        return this.wmParamCBMT;
    }

    get attribution(): Attribution {
        return this.attributionVal;
    }
}

interface BasemapConfig {
    tms: boolean;
    tileSize: number;
    attribution: boolean;
    noWrap: boolean;
}

export interface BasemapOptions {
    id: string;
    url: string;
    options: BasemapConfig;
}

export interface Attribution {
    'en-CA': string;
    'fr-CA': string;
}
