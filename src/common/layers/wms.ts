/* eslint-disable no-plusplus */
/* eslint-disable no-underscore-dangle */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable object-shorthand */
/* eslint-disable func-names */
import axios from 'axios';

import L, { Map } from 'leaflet';

import { mapService } from 'esri-leaflet';

import { LayerConfig, LayerData } from './layer';
import { getMapServerUrl } from '../utilities';

// TODO: this needs cleaning some layer type like WMS are part of react-leaflet and can be use as a component

/**
 * a class to add wms layer
 *
 * @export
 * @class WMS
 */
export class WMS {
    // TODO: try to avoid getCapabilities for WMS. Use Web Presence metadata return info to store, legend image link, layer name, and other needed properties.
    // in fact, to this for all the layer type
    /**
     * Add a WMS layer to the map.
     *
     * @param {object} map the Leaflet map
     * @param {LayerConfig} layer the layer configuration
     * @param {string} layerID the layer id
     * @param {Array<LayerData>} layers a reference to the layers array
     */
    add(map: Map, layer: LayerConfig, layerID: string, layers: Array<LayerData>): void {
        const options = {
            layers: layer.entries,
            format: 'image/png',
            transparent: true,
            attribution: '',
        };

        const wms = L.tileLayer.wms(layer.url, options);

        // add layer to map
        wms.addTo(map);

        layers.push({
            id: layerID,
            type: layer.type,
            layer: Object.defineProperties(wms, {
                // add an array of the WMS layer ids / entries
                entries: {
                    value: layer.entries.split(',').map((item: string) => {
                        return item;
                    }),
                },
                mapService: {
                    value: mapService({
                        url: getMapServerUrl(layer.url, true),
                    }),
                },
                // add support for a getFeatureInfo to WMS Layer
                getFeatureInfo: {
                    /**
                     * Get feature info from a WMS Layer
                     *
                     * @param {Event} evt Event received on any interaction with the map
                     * @param {Function} callback a callback function that will return the result json object
                     * @returns a promise that returns the feature info in a json format
                     */
                    value: async function (evt: any): Promise<any> {
                        const url = this.getFeatureInfoUrl(evt.latlng);

                        const res = await axios.get(url);

                        const featureInfo = this.xmlToJson(res.request.responseXML);

                        if (
                            featureInfo.FeatureInfoResponse &&
                            featureInfo.FeatureInfoResponse.FIELDS &&
                            featureInfo.FeatureInfoResponse.FIELDS['@attributes']
                        ) {
                            return featureInfo.FeatureInfoResponse.FIELDS['@attributes'];
                        }

                        return null;
                    },
                },
                getFeatureInfoUrl: {
                    /**
                     * Get feature info url from a lat lng point
                     *
                     * @param {LatLng} latlng a latlng point to generate the feature url from
                     * @returns the map service url including the feature query
                     */
                    value: function (latlng: L.LatLng): string {
                        // Construct a GetFeatureInfo request URL given a point
                        const point = this._map.latLngToContainerPoint(latlng);

                        const size = this._map.getSize();

                        const params: Record<string, unknown> = {
                            request: 'GetFeatureInfo',
                            service: 'WMS',
                            srs: 'EPSG:4326',
                            styles: this.wmsParams.styles,
                            transparent: this.wmsParams.transparent,
                            version: this.wmsParams.version,
                            format: this.wmsParams.format,
                            bbox: this._map.getBounds().toBBoxString(),
                            height: size.y,
                            width: size.x,
                            layers: this.wmsParams.layers,
                            query_layers: this.wmsParams.layers,
                            info_format: 'text/xml',
                        };

                        params[params.version === '1.3.0' ? 'i' : 'x'] = point.x;
                        params[params.version === '1.3.0' ? 'j' : 'y'] = point.y;

                        return this._url + L.Util.getParamString(params, this._url, true);
                    },
                },
                xmlToJson: {
                    /**
                     * Convert an XML document object into a json object
                     *
                     * @param {any} xml the XML document object
                     * @returns the converted json object
                     */
                    value: function (xml: any) {
                        // Create the return object
                        let obj: Record<string, any> = {};

                        // check for node type if it's an element, attribute, text, comment...
                        if (xml.nodeType === 1) {
                            // if it's an element, check the element's attributes to convert to json
                            if (xml.attributes) {
                                if (xml.attributes.length > 0) {
                                    obj['@attributes'] = {};
                                    for (let j = 0; j < xml.attributes.length; j++) {
                                        const attribute = xml.attributes.item(j);
                                        obj['@attributes'][attribute.nodeName] = attribute.nodeValue;
                                    }
                                }
                            }
                        } else if (xml.nodeType === 3) {
                            // text
                            obj = xml.nodeValue;
                        }

                        // do children
                        if (xml.hasChildNodes()) {
                            for (let i = 0; i < xml.childNodes.length; i++) {
                                const item = xml.childNodes.item(i);
                                const { nodeName } = item;
                                if (typeof obj[nodeName] === 'undefined') {
                                    obj[nodeName] = this.xmlToJson(item);
                                } else {
                                    if (typeof obj[nodeName].push === 'undefined') {
                                        const old = obj[nodeName];
                                        obj[nodeName] = [];
                                        obj[nodeName].push(old);
                                    }
                                    obj[nodeName].push(this.xmlToJson(item));
                                }
                            }
                        }
                        return obj;
                    },
                },
            }),
        });
    }
}
