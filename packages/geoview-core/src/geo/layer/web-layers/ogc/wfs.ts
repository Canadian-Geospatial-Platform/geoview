import axios from 'axios';

import L from 'leaflet';

import { xmlToJson } from '../../../../core/utils/utilities';
import {
  AbstractWebLayersClass,
  CONST_LAYER_TYPES,
  TypeJsonObject,
  TypeWFSLayer,
  TypeJsonArray,
  TypeBaseWebLayersConfig,
} from '../../../../core/types/cgpv-types';

import { api } from '../../../../app';

/* ******************************************************************************************************************************
 * Type Gard function that redefines a TypeBaseWebLayersConfig as a TypeWFSLayer
 * if the layerType attribute of the verifyIfLayer parameter is WFS. The type ascention
 * applies only to the the true block of the if clause that use this function.
 *
 * @param {TypeBaseWebLayersConfig} polymorphic object to test in order to determine if the type ascention is valid
 *
 * @return {boolean} true if the type ascention is valid
 */
export const layerConfigIsWFS = (verifyIfLayer: TypeBaseWebLayersConfig): verifyIfLayer is TypeWFSLayer => {
  return verifyIfLayer.layerType === CONST_LAYER_TYPES.WFS;
};

/* ******************************************************************************************************************************
 * Type Gard function that redefines an AbstractWebLayersClass as a WFS
 * if the type attribute of the verifyIfWebLayer parameter is WFS. The type ascention
 * applies only to the the true block of the if clause that use this function.
 *
 * @param {AbstractWebLayersClass} polymorphic object to test in order to determine if the type ascention is valid
 *
 * @return {boolean} true if the type ascention is valid
 */
export const webLayerIsWFS = (verifyIfWebLayer: AbstractWebLayersClass): verifyIfWebLayer is WFS => {
  return verifyIfWebLayer.type === CONST_LAYER_TYPES.WFS;
};

/**
 * a class to add WFS layer
 *
 * @exports
 * @class WFS
 */
export class WFS extends AbstractWebLayersClass {
  // layer from leaflet
  layer: L.GeoJSON | null = null;

  // private varibale holding wms capabilities
  #capabilities: TypeJsonObject = {};

  // private varibale holding wms paras
  #version = '2.0.0';

  /**
   * Initialize layer
   * @param {string} mapId the id of the map
   * @param {TypeWFSLayer} layerConfig the layer configuration
   */
  constructor(mapId: string, layerConfig: TypeWFSLayer) {
    super(CONST_LAYER_TYPES.WFS, layerConfig, mapId);

    this.entries = layerConfig.layerEntries.map((item) => item.id);
  }

  /**
   * Add a WFS layer to the map.
   *
   * @param {TypeWFSLayer} layer the layer configuration
   * @return {Promise<L.GeoJSON | null>} layers to add to the map
   */
  async add(layer: TypeWFSLayer): Promise<L.GeoJSON | null> {
    // const data = getXMLHttpRequest(capUrl);
    const resCapabilities = await axios.get<TypeJsonObject>(this.url, {
      params: { request: 'getcapabilities', service: 'WFS' },
    });

    // need to pass a xmldom to xmlToJson
    const xmlDOM = new DOMParser().parseFromString(resCapabilities.data as string, 'text/xml');
    const json = xmlToJson(xmlDOM);

    this.#capabilities = json['wfs:WFS_Capabilities'];
    this.#version = json['wfs:WFS_Capabilities']['@attributes'].version as string;
    const featTypeInfo = this.getFeatyreTypeInfo(
      json['wfs:WFS_Capabilities'].FeatureTypeList.FeatureType,
      layer.layerEntries.map((item) => item.id).toString()
    );

    if (!featTypeInfo) {
      return null;
    }

    const layerName = layer.name ? layer.name[api.map(this.mapId).getLanguageCode()] : (featTypeInfo.Name['#text'] as string).split(':')[1];

    if (layerName) this.name = layerName;

    const params = {
      service: 'WFS',
      version: this.#version,
      request: 'GetFeature',
      typename: layer.layerEntries.map((item) => item.id).toString(),
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
   * @param {object} featureTypeList feature type list
   * @param {string} entries names(comma delimited) to check
   * @returns {TypeJsonValue | null} feature type object or null
   */
  private getFeatyreTypeInfo(featureTypeList: TypeJsonObject, entries?: string): TypeJsonObject | null {
    const res = null;

    if (Array.isArray(featureTypeList)) {
      const featureTypeArray: TypeJsonArray = featureTypeList;
      for (let i = 0; i < featureTypeArray.length; i += 1) {
        let fName = featureTypeArray[i].Name['#text'] as string;
        const fNameSplit = fName.split(':');
        fName = fNameSplit.length > 1 ? fNameSplit[1] : fNameSplit[0];

        const entrySplit = entries!.split(':');
        const entryName = entrySplit.length > 1 ? entrySplit[1] : entrySplit[0];

        if (entryName === fName) {
          return featureTypeArray[i];
        }
      }
    } else {
      let fName = featureTypeList.Name['#text'] as string;

      const fNameSplit = fName.split(':');
      fName = fNameSplit.length > 1 ? fNameSplit[1] : fNameSplit[0];

      const entrySplit = entries!.split(':');
      const entryName = entrySplit.length > 1 ? entrySplit[1] : entrySplit[0];

      if (entryName === fName) {
        return featureTypeList;
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
    type SetOpacityLayers = L.GridLayer | L.ImageOverlay | L.SVGOverlay | L.VideoOverlay | L.Tooltip | L.Marker;
    this.layer!.getLayers().forEach((layer) => {
      if ((layer as SetOpacityLayers).setOpacity) (layer as SetOpacityLayers).setOpacity(opacity);
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
