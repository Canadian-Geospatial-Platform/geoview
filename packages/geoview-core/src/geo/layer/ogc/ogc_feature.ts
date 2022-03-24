/* eslint-disable object-shorthand */
/* eslint-disable no-underscore-dangle */
import axios from 'axios';

import L, { Layer } from 'leaflet';

import { mapService as esriMapService, MapService } from 'esri-leaflet';

import { generateId } from '../../../core/utils/utilities';

import { TypeJSONObject, TypeJSONObjectLoop, TypeLayerConfig } from '../../../core/types/cgpv-types';

import { api } from '../../../api/api';

/**
 * a class to add OGC api feature layer
 *
 * @export
 * @class OgcFeature
 */
export class OgcFeature {
  // map config properties

  // layer id
  id: string;

  // layer name with default
  name = 'OGC Feature Layer';

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

  /**
   * Initialize layer
   *
   * @param {TypeLayerConfig} layerConfig the layer configuration
   */
  constructor(layerConfig: TypeLayerConfig) {
    this.id = layerConfig.id || generateId('');
    this.type = layerConfig.type;
    this.#capabilities = {};
    this.entries = layerConfig.entries?.split(',').map((item: string) => {
      return item.trim();
    });
    this.mapService = esriMapService({
      url: api.geoUtilities.getMapServerUrl(layerConfig.url, true),
    });
    this.url = layerConfig.url.trim();

    this.layer = new Layer();
  }

  /**
   * Add a OGC API feature layer to the map.
   *
   * @param {TypeLayerConfig} layer the layer configuration
   * @return {Promise<Layer | string>} layers to add to the map
   */
  async add(layer: TypeLayerConfig): Promise<Layer | string> {
    const rootUrl = this.url.slice(-1) === '/' ? this.url : `${this.url}/`;

    const featureUrl = `${rootUrl}collections/${this.entries}/items?f=json`;
    const metaUrl = `${rootUrl}collections/${this.entries}?f=json`;

    const res = await axios.get(metaUrl);
    this.#capabilities = res.data;

    const layerName = 'name' in layer ? layer.name : this.#capabilities.title;
    if (layerName) this.name = <string>layerName;

    const featRes = axios.get(featureUrl);

    const geo = new Promise<Layer | string>((resolve) => {
      featRes
        .then((result) => {
          const geojson = result.data;

          if (geojson && geojson !== '{}') {
            const featureLayer = L.geoJSON(geojson, {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              pointToLayer: (feature, latlng) => {
                if (feature.geometry.type === 'Point') {
                  return L.circleMarker(latlng);
                }

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
                  fillColor: '#0094FF',
                  fillOpacity: 0.8,
                };
              },
            });

            resolve(featureLayer);
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

        if (entries) {
          const entrySplit = entries.split(':');
          const entryName = entrySplit.length > 1 ? entrySplit[1] : entrySplit[0];

          if (entryName === fName) {
            return FeatureTypeList[i];
          }
        }
      }
    } else {
      let fName = FeatureTypeList.Name['#text'];

      const fNameSplit = fName.split(':');
      fName = fNameSplit.length > 1 ? fNameSplit[1] : fNameSplit[0];

      if (entries) {
        const entrySplit = entries.split(':');
        const entryName = entrySplit.length > 1 ? entrySplit[1] : entrySplit[0];

        if (entryName === fName) {
          return FeatureTypeList;
        }
      }
    }

    return res;
  }

  /**
   * Get capabilities of the current WFS service
   *
   * @returns {TypeJSONObjectLoop} WFS capabilities in json format
   */
  getMeta = (): TypeJSONObjectLoop => {
    return this.#capabilities;
  };
}
