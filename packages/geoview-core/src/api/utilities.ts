import WMSCapabilities from 'wms-capabilities';

import { getXMLHttpRequest } from '../common/utilities';

export class Utilities {
    /**
     * Fetch the json response from the ESRI map server to get REST endpoint metadata
     * @function getESRIServiceMetadata
     * @param {string} url the url of the ESRI map server
     * @returns {Promise<Record<string, unknown>>} a json promise containing the result of the query
     */
    getESRIServiceMetadata = async (url: string): Promise<Record<string, unknown>> => {
        // fetch the map server returning a json object
        const response = await fetch(`${url}?f=json`);
        const result = await response.json();

        return result;
    };

    /**
     * Fetch the json response from the XML response of a WMS getCapabilities request
     * @function getWMSServiceMetadata
     * @param {string} url the url the url of the WMS server
     * @param {string} layers the layers to query separate by ,
     * @returns {Promise<Record<string, unknown>>} a json promise containing the result of the query
     */
    getWMSServiceMetadata = async (url: string, layers: string): Promise<Record<string, unknown>> => {
        // query the WMS server
        const response = await getXMLHttpRequest(`${url}?SERVICE=WMS&REQUEST=GetCapabilities&VERSION=1.3.0&layer=${layers}`);

        // parse the xml string and convert to json
        const result = new WMSCapabilities(response).toJSON();

        return result;
    };
}
