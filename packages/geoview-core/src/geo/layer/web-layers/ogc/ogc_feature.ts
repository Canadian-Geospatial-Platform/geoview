<<<<<<< HEAD:packages/geoview-core/src/geo/layer/web-layers/ogc/ogc_feature.ts
import axios from 'axios';

import L from 'leaflet';

import { mapService as esriMapService, MapService } from 'esri-leaflet';

import { AbstractWebLayersClass, TypeJSONValue, TypeJSONObject, TypeLayerConfig } from '../../../../core/types/cgpv-types';

import { api } from '../../../../api/api';
=======
/* eslint-disable object-shorthand */
/* eslint-disable no-underscore-dangle */
import axios from 'axios';

import L, { Layer } from 'leaflet';

import { mapService as esriMapService, MapService } from 'esri-leaflet';

import { generateId } from '../../../core/utils/utilities';

import { TypeJSONObject, TypeJSONObjectLoop, TypeLayerConfig } from '../../../core/types/cgpv-types';

import { api } from '../../../api/api';
>>>>>>> 2494732ad4a7a2c68e059d9d1877b2d59d665d4d:packages/geoview-core/src/geo/layer/ogc/ogc_feature.ts

/**
 * a class to add OGC api feature layer
 *
 * @export
 * @class OgcFeature
 */
<<<<<<< HEAD:packages/geoview-core/src/geo/layer/web-layers/ogc/ogc_feature.ts
export class OgcFeature extends AbstractWebLayersClass {
=======
export class OgcFeature {
  // map config properties

  // layer id
  id: string;

  // layer name with default
  name = 'OGC Feature Layer';

  // layer type
  type: string;

>>>>>>> 2494732ad4a7a2c68e059d9d1877b2d59d665d4d:packages/geoview-core/src/geo/layer/ogc/ogc_feature.ts
  // layer from leaflet
  layer: L.GeoJSON | null = null;

  // layer entries
  entries: string[] | undefined;

  // mapService property
  mapService: MapService;

  // private varibale holding wms capabilities
  #capabilities: TypeJSONObject;

  // private varibale holding wms paras
  #version = '2.0.0';

  /**
   * Initialize layer
   *
   * @param {TypeLayerConfig} layerConfig the layer configuration
   */
  constructor(layerConfig: TypeLayerConfig) {
<<<<<<< HEAD:packages/geoview-core/src/geo/layer/web-layers/ogc/ogc_feature.ts
    super('ogcFeature', 'OGC Feature Layer', layerConfig);

    this.#capabilities = {};

=======
    this.id = layerConfig.id || generateId('');
    this.type = layerConfig.type;
    this.#capabilities = {};
>>>>>>> 2494732ad4a7a2c68e059d9d1877b2d59d665d4d:packages/geoview-core/src/geo/layer/ogc/ogc_feature.ts
    this.entries = layerConfig.entries?.split(',').map((item: string) => {
      return item.trim();
    });

    this.mapService = esriMapService({
      url: api.geoUtilities.getMapServerUrl(layerConfig.url, true),
    });
  }

  /**
   * Add a OGC API feature layer to the map.
   *
   * @param {TypeLayerConfig} layer the layer configuration
   * @return {Promise<L.GeoJSON | null>} layers to add to the map
   */
<<<<<<< HEAD:packages/geoview-core/src/geo/layer/web-layers/ogc/ogc_feature.ts
  async add(layer: TypeLayerConfig): Promise<L.GeoJSON | null> {
=======
  async add(layer: TypeLayerConfig): Promise<Layer | string> {
>>>>>>> 2494732ad4a7a2c68e059d9d1877b2d59d665d4d:packages/geoview-core/src/geo/layer/ogc/ogc_feature.ts
    const rootUrl = this.url.slice(-1) === '/' ? this.url : `${this.url}/`;

    const featureUrl = `${rootUrl}collections/${this.entries}/items?f=json`;
    const metaUrl = `${rootUrl}collections/${this.entries}?f=json`;

    const res = await axios.get<TypeJSONObject>(metaUrl);
    this.#capabilities = res.data;

    const layerName = 'name' in layer ? layer.name : this.#capabilities.title;
    if (layerName) this.name = <string>layerName;

    const getResponse = axios.get<L.GeoJSON | string>(featureUrl);

    const geo = new Promise<L.GeoJSON | null>((resolve) => {
      getResponse
        .then((result) => {
          const geojson = result.data;

          if (geojson && geojson !== '{}') {
<<<<<<< HEAD:packages/geoview-core/src/geo/layer/web-layers/ogc/ogc_feature.ts
            const featureLayer = L.geoJSON(
              geojson as GeoJSON.GeoJsonObject,
              {
                pointToLayer: (feature, latlng): L.Layer | undefined => {
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
                    fillColor: '#0094FF',
                    fillOpacity: 0.8,
                  };
                },
              } as L.GeoJSONOptions
            );

            resolve(featureLayer);
          } else {
            resolve(null);
=======
            const featureLayer = L.geoJSON(geojson, {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
                  fillColor: '#0094FF',
                  fillOpacity: 0.8,
                };
              },
            });

            resolve(featureLayer);
          } else {
            resolve('{}');
>>>>>>> 2494732ad4a7a2c68e059d9d1877b2d59d665d4d:packages/geoview-core/src/geo/layer/ogc/ogc_feature.ts
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
<<<<<<< HEAD:packages/geoview-core/src/geo/layer/web-layers/ogc/ogc_feature.ts
          resolve(null);
=======
          resolve('{}');
>>>>>>> 2494732ad4a7a2c68e059d9d1877b2d59d665d4d:packages/geoview-core/src/geo/layer/ogc/ogc_feature.ts
        });
    });
    return geo;
  }

  /**
   * Get feature type info of a given entry
   * @param {object} FeatureTypeList feature type list
   * @param {string} entries names(comma delimited) to check
   * @returns {TypeJSONValue | null} feature type object or null
   */
  private getFeatureTypeInfo(FeatureTypeList: TypeJSONObject, entries?: string): TypeJSONObject | null {
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
<<<<<<< HEAD:packages/geoview-core/src/geo/layer/web-layers/ogc/ogc_feature.ts
      let fName = FeatureTypeList.Name && (FeatureTypeList.Name['#text'] as TypeJSONValue as string);
=======
      let fName = FeatureTypeList.Name && FeatureTypeList.Name['#text'];
>>>>>>> 2494732ad4a7a2c68e059d9d1877b2d59d665d4d:packages/geoview-core/src/geo/layer/ogc/ogc_feature.ts

      if (fName) {
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
    }

    return res;
  }

  /**
   * Get capabilities of the current WFS service
   *
   * @returns {TypeJSONObject} WFS capabilities in json format
   */
  getMeta = (): TypeJSONValue => {
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
