import axios from 'axios';

import L from 'leaflet';

import { mapService as esriMapService, MapService } from 'esri-leaflet';

import { xmlToJson } from '../../../../core/utils/utilities';

import { AbstractWebLayersClass, TypeJsonString, TypeJsonObject, TypeJsonValue, TypeLayerConfig } from '../../../../core/types/cgpv-types';

import { api } from '../../../../api/api';

/**
 * a class to add WFS layer
 *
 * @export
 * @class WFS
 */
export class WFS extends AbstractWebLayersClass {
  // layer from leaflet
  layer: L.GeoJSON | null = null;

  // layer entries
  entries: string[] | undefined;

  // mapService property
  mapService: MapService;

  // private varibale holding wms capabilities
  #capabilities: TypeJsonObject = {};

  // private varibale holding wms paras
  #version = '2.0.0';

  /**
   * Initialize layer
   *
   * @param {TypeLayerConfig} layerConfig the layer configuration
   */
  constructor(layerConfig: TypeLayerConfig) {
    super('ogcWFS', 'WFS Layer', layerConfig);

    this.entries = layerConfig.entries?.split(',').map((item: string) => {
      return item.trim();
    });

    this.mapService = esriMapService({
      url: api.geoUtilities.getMapServerUrl(layerConfig.url, true),
    });
  }

  /**
   * Add a WFS layer to the map.
   *
   * @param {TypeLayerConfig} layer the layer configuration
   * @return {Promise<L.GeoJSON | null>} layers to add to the map
   */
  async add(layer: TypeLayerConfig): Promise<L.GeoJSON | null> {
    // const data = getXMLHttpRequest(capUrl);
    const resCapabilities = await axios.get<TypeJsonValue>(this.url, {
      params: { request: 'getcapabilities', service: 'WFS' },
    });

    // need to pass a xmldom to xmlToJson
    const xmlDOM = new DOMParser().parseFromString(resCapabilities.data as string, 'text/xml');
    const json = xmlToJson(xmlDOM) as TypeJsonObject;

    this.#capabilities = json['wfs:WFS_Capabilities'];
    this.#version = json['wfs:WFS_Capabilities']['@attributes'].version as TypeJsonString;
    const featTypeInfo = this.getFeatyreTypeInfo(json['wfs:WFS_Capabilities'].FeatureTypeList.FeatureType, layer.entries);

    if (!featTypeInfo) {
      return null;
    }

    const layerName = 'name' in layer ? layer.name : (featTypeInfo.Name['#text'] as TypeJsonString).split(':')[1];
    if (layerName) this.name = layerName;

    const params = {
      service: 'WFS',
      version: this.#version,
      request: 'GetFeature',
      typename: layer.entries,
      srsname: 'EPSG:4326',
      outputFormat: 'application/json',
    };

    const getResponse = axios.get<L.GeoJSON | string>(this.url, { params });

    const geo = new Promise<L.GeoJSON | null>((resolve) => {
      getResponse
        .then((response) => {
          const geojson = response.data;

          if (geojson && geojson !== '{}') {
            const wfsLayer = L.geoJSON(
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
                    fillColor: '#FFB27F',
                    fillOpacity: 0.8,
                  };
                },
              } as L.GeoJSONOptions
            );

            resolve(wfsLayer);
          } else {
            resolve(null);
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
          resolve(null);
        });
    });
    return geo;
  }

  /**
   * Get feature type info of a given entry
   * @param {object} FeatureTypeList feature type list
   * @param {string} entries names(comma delimited) to check
   * @returns {TypeJsonValue | null} feature type object or null
   */
  private getFeatyreTypeInfo(FeatureTypeList: TypeJsonObject, entries?: string): TypeJsonObject | null {
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
      let fName = FeatureTypeList.Name['#text'] as TypeJsonString;

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
   * @returns {TypeJsonObject} WFS capabilities in json format
   */
  getCapabilities = (): TypeJsonObject => {
    return this.#capabilities;
  };

  /**
   * Set Layer Opacity
   * @param {number} opacity layer opacity
   */
  setOpacity = (opacity: number) => {
    type HasSetOpacity = L.GridLayer | L.ImageOverlay | L.SVGOverlay | L.VideoOverlay | L.Tooltip | L.Marker;
    (this.layer as L.GeoJSON).getLayers().forEach((layer) => {
      if ((layer as HasSetOpacity).setOpacity) (layer as HasSetOpacity).setOpacity(opacity);
      else if ((layer as L.GeoJSON).setStyle) (layer as L.GeoJSON).setStyle({ opacity, fillOpacity: opacity * 0.8 });
    });
  };

  /**
   * Get bounds through Leaflet built-in functions
   *
   * @returns {L.LatLngBounds} layer bounds
   */
  getBounds = (): L.LatLngBounds => (this.layer as L.GeoJSON).getBounds();
}
