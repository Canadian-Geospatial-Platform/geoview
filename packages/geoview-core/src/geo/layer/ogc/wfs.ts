/* eslint-disable object-shorthand */
/* eslint-disable no-underscore-dangle */
import axios from 'axios';

import L, { Layer } from 'leaflet';

import { mapService as esriMapService, MapService } from 'esri-leaflet';

import { xmlToJson, generateId } from '../../../core/utils/utilities';

import { TypeJSONObject, TypeJSONObjectLoop, TypeWFSLayer } from '../../../core/types/cgpv-types';

import { api } from '../../../api/api';

/**
 * a class to add WFS layer
 *
 * @export
 * @class WFS
 */
export class WFS {
  // map config properties

  // layer id with default
  id: string;

  // layer name with default
  name = 'WFS Layer';

  // layer type
  type: string;

  // layer from leaflet
  layer: Layer | string;

  // layer entries
  entries: string[] | undefined;

  // layer or layer service url
  url: string;

  // mapService property
  mapService: MapService;

  // private varibale holding wms capabilities
  #capabilities: TypeJSONObjectLoop;

  // private varibale holding wms paras
  #version = '2.0.0';

  // map id
  #mapId: string;

  /**
   * Initialize layer
   * @param {string} mapId the id of the map
   * @param {TypeWFSLayer} layerConfig the layer configuration
   */
  constructor(mapId: string, layerConfig: TypeWFSLayer) {
    this.#mapId = mapId;

    this.id = layerConfig.id || generateId('');
    this.type = layerConfig.layerType;
    this.#capabilities = {};
    this.entries = layerConfig.layerEntries.map((item) => item.id);
    this.url = layerConfig.url[api.map(this.#mapId).getLanguageCode()];
    this.mapService = esriMapService({
      url: api.geoUtilities.getMapServerUrl(this.url, true),
    });

    this.layer = new Layer();
  }

  /**
   * Add a WFS layer to the map.
   *
   * @param {TypeWFSLayer} layer the layer configuration
   * @return {Promise<Layer | string>} layers to add to the map
   */
  async add(layer: TypeWFSLayer): Promise<Layer | string> {
    // const data = getXMLHttpRequest(capUrl);
    const resCapabilities = await axios.get(this.url, {
      params: { request: 'getcapabilities', service: 'WFS' },
    });

    // need to pass a xmldom to xmlToJson
    const xmlDOM = new DOMParser().parseFromString(resCapabilities.data, 'text/xml');
    const json = xmlToJson(xmlDOM) as TypeJSONObjectLoop;

    this.#capabilities = json['wfs:WFS_Capabilities'];
    this.#version = json['wfs:WFS_Capabilities']['@attributes'].version;
    const featTypeInfo = this.getFeatyreTypeInfo(
      json['wfs:WFS_Capabilities'].FeatureTypeList.FeatureType,
      layer.layerEntries.map((item) => item.id).toString()
    );

    if (!featTypeInfo) {
      return '{}';
    }

    const layerName = layer.name ? layer.name[api.map(this.#mapId).getLanguageCode()] : featTypeInfo.Name['#text'].split(':')[1];
    if (layerName) this.name = <string>layerName;

    const params = {
      service: 'WFS',
      version: this.#version,
      request: 'GetFeature',
      typename: layer.layerEntries.map((item) => item.id).toString(),
      srsname: 'EPSG:4326',
      outputFormat: 'application/json',
    };

    const featRes = axios.get(this.url, { params: params });

    const geo = new Promise<Layer | string>((resolve) => {
      featRes
        .then((res) => {
          const geojson = res.data;

          if (geojson && geojson !== '{}') {
            const wfs = L.geoJSON(geojson, {
              pointToLayer: (feature, latlng): Layer | undefined => {
                if (feature.geometry.type === 'Point') {
                  return L.circleMarker(latlng);
                }

                return undefined;
                // if need to use specific style for point
                // return L.circleMarker(latlng, {
                //  ...geojsonMarkerOptions,
                //  id: lId,
                // });
              },
              style: () => {
                return {
                  stroke: true,
                  color: '#333',
                  fillColor: '#FFB27F',
                  fillOpacity: 0.8,
                };
              },
            });

            resolve(wfs);
          } else {
            resolve('{}');
          }
        })
        .catch((error) => {
          if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            // console.log(error.response.data);
            // console.log(error.response.status);
            // console.log(error.response.headers);
          } else if (error.request) {
            // The request was made but no response was received
            // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
            // http.ClientRequest in node.js
            // console.log(error.request);
          } else {
            // Something happened in setting up the request that triggered an Error
            // console.log("Error", error.message);
          }
          // console.log(error.config);
          resolve('{}');
        });
    });
    return geo;
  }

  /**
   * Get feature type info of a given entry
   * @param {object} FeatureTypeList feature type list
   * @param {string} entries names(comma delimited) to check
   * @returns {TypeJSONObject | null} feature type object or null
   */
  private getFeatyreTypeInfo(FeatureTypeList: TypeJSONObject, entries?: string): TypeJSONObject | null {
    const res = null;

    if (Array.isArray(FeatureTypeList)) {
      for (let i = 0; i < FeatureTypeList.length; i += 1) {
        let fName = FeatureTypeList[i].Name['#text'];
        const fNameSplit = fName.split(':');
        fName = fNameSplit.length > 1 ? fNameSplit[1] : fNameSplit[0];

        const entrySplit = entries!.split(':');
        const entryName = entrySplit.length > 1 ? entrySplit[1] : entrySplit[0];

        if (entryName === fName) {
          return FeatureTypeList[i];
        }
      }
    } else {
      let fName = FeatureTypeList.Name['#text'];

      const fNameSplit = fName.split(':');
      fName = fNameSplit.length > 1 ? fNameSplit[1] : fNameSplit[0];

      const entrySplit = entries!.split(':');
      const entryName = entrySplit.length > 1 ? entrySplit[1] : entrySplit[0];

      if (entryName === fName) {
        return FeatureTypeList;
      }
    }

    return res;
  }

  /**
   * Get capabilities of the current WFS service
   *
   * @returns {TypeJSONObjectLoop} WFS capabilities in json format
   */
  getCapabilities = (): TypeJSONObjectLoop => {
    return this.#capabilities;
  };

  /**
   * Set Layer Opacity
   * @param {number} opacity layer opacity
   */
  setOpacity = (opacity: number) => {
    this.layer.getLayers().forEach((x) => {
      if (x.setOpacity) x.setOpacity(opacity);
      else if (x.setStyle) x.setStyle({ opacity, fillOpacity: opacity * 0.8 });
    });
  };

  /**
   * Get bounds through Leaflet built-in functions
   *
   * @returns {L.LatLngBounds} layer bounds
   */
  getBounds = (): L.LatLngBounds => this.layer.getBounds();
}
