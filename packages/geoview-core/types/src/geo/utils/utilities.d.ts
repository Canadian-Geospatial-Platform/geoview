import { TypeJsonObject } from '../../core/types/cgpv-types';
export declare class GeoUtilities {
    /**
     * Fetch the json response from the ESRI map server to get REST endpoint metadata
     * @function getESRIServiceMetadata
     * @param {string} url the url of the ESRI map server
     * @returns {Promise<TypeJsonObject>} a json promise containing the result of the query
     */
    getESRIServiceMetadata: (url: string) => Promise<TypeJsonObject>;
    /**
     * Fetch the json response from the XML response of a WMS getCapabilities request
     * @function getWMSServiceMetadata
     * @param {string} url the url the url of the WMS server
     * @param {string} layers the layers to query separate by ,
     * @returns {Promise<TypeJsonObject>} a json promise containing the result of the query
     */
    getWMSServiceMetadata: (url: string, layers: string) => Promise<TypeJsonObject>;
    /**
     * Fetch the json response from the XML response of a WFS getCapabilities request
     * @function getWFSServiceMetadata
     * @param {string} url the url of the WFS server
     * @returns {Promise<TypeJsonObject>} a json promise containing the result of the query
     */
    getWFSServiceMetadata: (url: string) => Promise<TypeJsonObject>;
    /**
     * Apply outline to elements when keyboard is use to navigate
     * Issue in Leaflet... not implemented in the current release: Leaflet/Leaflet#7259
     * Code from: https://github.com/MaxMaeder/keyboardFocus.js
     */
    manageKeyboardFocus: () => void;
    /**
     * Return the map server url from a layer service
     *
     * @param {string} url the service url for a wms / dynamic or feature layers
     * @param {boolean} rest boolean value to add rest services if not present (default false)
     * @returns the map server url
     */
    getMapServerUrl: (url: string, rest?: boolean) => string;
    /**
     * Gets computed translate values
     * https://zellwk.com/blog/css-translate-values-in-javascript/
     * @param {HTMLElement} element the HTML element to get value for
     * @returns {Object} the x, y and z translation values
     */
    getTranslateValues: (element: HTMLElement) => {
        x: number;
        y: number;
        z: number;
    };
}
