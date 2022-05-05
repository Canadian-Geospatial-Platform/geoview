import axios from 'axios';

import L from 'leaflet';

import { mapService as esriMapService, MapService } from 'esri-leaflet';

import {
  AbstractWebLayersClass,
  CONST_LAYER_TYPES,
  TypeJsonValue,
  TypeJsonObject,
  TypeOgcFeatureLayer,
  TypeJsonArray,
  TypeBaseWebLayersConfig,
} from '../../../../core/types/cgpv-types';

import { api } from '../../../../app';

/* ******************************************************************************************************************************
 * Type Gard function that redefines a TypeBaseWebLayersConfig as a TypeOgcFeatureLayer
 * if the layerType attribute of the verifyIfLayer parameter is OGC_FEATURE. The type ascention
 * applies only to the the true block of the if clause that use this function.
 *
 * @param {TypeBaseWebLayersConfig} polymorphic object to test in order to determine if the type ascention is valid
 *
 * @return {boolean} true if the type ascention is valid
 */
export const layerConfigIsOgcFeature = (verifyIfLayer: TypeBaseWebLayersConfig): verifyIfLayer is TypeOgcFeatureLayer => {
  return verifyIfLayer.layerType === CONST_LAYER_TYPES.OGC_FEATURE;
};

/* ******************************************************************************************************************************
 * Type Gard function that redefines an AbstractWebLayersClass as an OgcFeature
 * if the type attribute of the verifyIfWebLayer parameter is OGC_FEATURE. The type ascention
 * applies only to the the true block of the if clause that use this function.
 *
 * @param {AbstractWebLayersClass} polymorphic object to test in order to determine if the type ascention is valid
 *
 * @return {boolean} true if the type ascention is valid
 */
export const webLayerIsOgcFeature = (verifyIfWebLayer: AbstractWebLayersClass): verifyIfWebLayer is OgcFeature => {
  return verifyIfWebLayer.type === CONST_LAYER_TYPES.OGC_FEATURE;
};

/**
 * a class to add OGC api feature layer
 *
 * @export
 * @class OgcFeature
 */
export class OgcFeature extends AbstractWebLayersClass {
  // layer from leaflet
  layer: L.GeoJSON | null = null;

  // mapService property
  mapService: MapService;

  // private varibale holding wms capabilities
  #capabilities: TypeJsonObject = {};

  // private varibale holding wms paras
  #version = '2.0.0';

  /**
   * Initialize layer
   *
   * @param {string} mapId the id of the map
   * @param {TypeOgcFeatureLayer} layerConfig the layer configuration
   */
  constructor(mapId: string, layerConfig: TypeOgcFeatureLayer) {
    super(CONST_LAYER_TYPES.OGC_FEATURE, layerConfig, mapId);

    this.entries = layerConfig.layerEntries.map((item) => item.id);

    this.mapService = esriMapService({
      url: api.geoUtilities.getMapServerUrl(this.url, true),
    });
  }

  /**
   * Add a OGC API feature layer to the map.
   *
   * @param {TypeOgcFeatureLayer} layer the layer configuration
   *
   * @return {Promise<L.GeoJSON | null>} layers to add to the map
   */
  async add(layer: TypeOgcFeatureLayer): Promise<L.GeoJSON | null> {
    const rootUrl = this.url.slice(-1) === '/' ? this.url : `${this.url}/`;

    const featureUrl = `${rootUrl}collections/${this.entries}/items?f=json`;
    const metaUrl = `${rootUrl}collections/${this.entries}?f=json`;

    const res = await axios.get<TypeJsonObject>(metaUrl);
    this.#capabilities = res.data;

    const layerName = layer.name ? layer.name[api.map(this.mapId).getLanguageCode()] : (this.#capabilities.title as string);
    if (layerName) this.name = layerName;

    const getResponse = axios.get<L.GeoJSON | string>(featureUrl);

    const geo = new Promise<L.GeoJSON | null>((resolve) => {
      getResponse
        .then((result) => {
          const geojson = result.data;

          if (geojson && geojson !== '{}') {
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
  private getFeatureTypeInfo(featureTypeList: TypeJsonObject, entries?: string): TypeJsonObject | null {
    const res = null;

    if (Array.isArray(featureTypeList)) {
      const featureTypeArray = featureTypeList as TypeJsonArray;
      for (let i = 0; i < featureTypeArray.length; i += 1) {
        let fName = featureTypeArray[i].Name['#text'] as string;
        const fNameSplit = fName.split(':');
        fName = fNameSplit.length > 1 ? fNameSplit[1] : fNameSplit[0];

        if (entries) {
          const entrySplit = entries.split(':');
          const entryName = entrySplit.length > 1 ? entrySplit[1] : entrySplit[0];

          if (entryName === fName) {
            return featureTypeArray[i];
          }
        }
      }
    } else {
      let fName = featureTypeList.Name && (featureTypeList.Name['#text'] as string);

      if (fName) {
        const fNameSplit = fName.split(':');
        fName = fNameSplit.length > 1 ? fNameSplit[1] : fNameSplit[0];

        if (entries) {
          const entrySplit = entries.split(':');
          const entryName = entrySplit.length > 1 ? entrySplit[1] : entrySplit[0];

          if (entryName === fName) {
            return featureTypeList;
          }
        }
      }
    }

    return res;
  }

  /**
   * Get capabilities of the current WFS service
   *
   * @returns {TypeJsonObject} WFS capabilities in json format
   */
  getMeta = (): TypeJsonValue => {
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
  getBounds = (): L.LatLngBounds => this.layer!.getBounds();
}
