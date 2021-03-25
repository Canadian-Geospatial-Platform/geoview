/* eslint-disable no-plusplus */
/* eslint-disable no-underscore-dangle */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable object-shorthand */
/* eslint-disable func-names */
import axios from 'axios';

import L, { Layer } from 'leaflet';

import { mapService } from 'esri-leaflet';

import WMSCapabilities from 'wms-capabilities';

import { LayerConfig } from './layer';
import { getMapServerUrl, getXMLHttpRequest, xmlToJson } from '../utilities';

// TODO: this needs cleaning some layer type like WMS are part of react-leaflet and can be use as a component

/**
 * a class to add wms layer
 *
 * @export
 * @class WMS
 */
export class WMS {
    // TODO: try to avoid getCapabilities for WMS. Use Web Presence metadata return info to store, legend image link, layer name, and other needed properties.
    // * We may have to do getCapabilites if we want to add layers not in the catalog
    /**
     * Add a WMS layer to the map.
     *
     * @param {LayerConfig} layer the layer configuration
     * @return {Promise<Layer | string>} layers to add to the map
     */
    add(layer: LayerConfig): Promise<Layer | string> {
        let { url } = layer;

        // if url has a '?' do not append to avoid errors, user must add this manually
        if (layer.url.indexOf('?') === -1) {
            url += '?service=WMS&version=1.3&request=GetCapabilities';
        }

        const data = getXMLHttpRequest(url);

        const geo = new Promise<Layer | string>((resolve) => {
            data.then((value: string) => {
                if (value !== '{}') {
                    // check if entries exist
                    let isValid = false;

                    // parse the xml string and convert to json
                    const json = new WMSCapabilities(value).toJSON();

                    // validate the entries
                    json.Capability.Layer.Layer.forEach((item) => {
                        if (layer.entries?.match(item.Name)) isValid = true;
                    });

                    if (isValid) {
                        const wms = L.tileLayer.wms(layer.url, {
                            layers: layer.entries,
                            format: 'image/png',
                            transparent: true,
                            attribution: '',
                        });

                        Object.defineProperties(wms, {
                            // add an array of the WMS layer ids / entries
                            entries: {
                                value: layer.entries?.split(',').map((item: string) => {
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
                                    const res = await axios.get(this.getFeatureInfoUrl(evt.latlng));

                                    const featureInfo = xmlToJson(res.request.responseXML);

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
                        });

                        resolve(wms);
                    } else {
                        resolve('{}');
                    }
                } else {
                    resolve('{}');
                }
            });
        });

        return new Promise((resolve) => resolve(geo));
    }
}
