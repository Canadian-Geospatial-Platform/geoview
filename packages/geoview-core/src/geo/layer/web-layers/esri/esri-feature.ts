import axios from 'axios';

import L from 'leaflet';

import { FeatureLayer, FeatureLayerOptions, featureLayer, mapService as esriMapService, MapService } from 'esri-leaflet';

import {
  AbstractWebLayersClass,
  CONST_LAYER_TYPES,
  TypeFeatureLayer,
  TypeJsonValue,
  TypeJsonObject,
  TypeJsonArray,
  toJsonObject,
  TypeBaseWebLayersConfig,
} from '../../../../core/types/cgpv-types';
import { generateId, getXMLHttpRequest } from '../../../../core/utils/utilities';
import { blueCircleIcon } from '../../../../core/types/marker-definitions';

import { api } from '../../../../app';

/* ******************************************************************************************************************************
 * Type Gard function that redefines a TypeBaseWebLayersConfig as a TypeFeatureLayer
 * if the layerType attribute of the verifyIfLayer parameter is ESRI_FEATURE. The type ascention
 * applies only to the the true block of the if clause that use this function.
 *
 * @param {TypeBaseWebLayersConfig} polymorphic object to test in order to determine if the type ascention is valid
 *
 * @return {boolean} true if the type ascention is valid
 */
export const layerConfigIsEsriFeature = (verifyIfLayer: TypeBaseWebLayersConfig): verifyIfLayer is TypeFeatureLayer => {
  return verifyIfLayer.layerType === CONST_LAYER_TYPES.ESRI_FEATURE;
};

/* ******************************************************************************************************************************
 * Type Gard function that redefines an AbstractWebLayersClass as an EsriFeature
 * if the type attribute of the verifyIfWebLayer parameter is ESRI_FEATURE. The type ascention
 * applies only to the the true block of the if clause that use this function.
 *
 * @param {AbstractWebLayersClass} polymorphic object to test in order to determine if the type ascention is valid
 *
 * @return {boolean} true if the type ascention is valid
 */
export const webLayerIsEsriFeature = (verifyIfWebLayer: AbstractWebLayersClass): verifyIfWebLayer is EsriFeature => {
  return verifyIfWebLayer.type === CONST_LAYER_TYPES.ESRI_FEATURE;
};

/**
 * a class to add esri feature layer
 *
 * @export
 * @class EsriFeature
 */
export class EsriFeature extends AbstractWebLayersClass {
  // layer from leaflet
  layer: FeatureLayer | null = null;

  // mapService property
  mapService: MapService;

  /**
   * Initialize layer
   *
   * @param {string} mapId the id of the map
   * @param {TypeFeatureLayer} layerConfig the layer configuration
   */
  constructor(mapId: string, layerConfig: TypeFeatureLayer) {
    super(CONST_LAYER_TYPES.ESRI_FEATURE, layerConfig, mapId);

    this.mapService = esriMapService({
      url: api.geoUtilities.getMapServerUrl(this.url),
    });
  }

  /**
   * Add a ESRI feature layer to the map.
   *
   * @param {TypeFeatureLayer} layer the layer configuration
   * @return {Promise<FeatureLayer | null>} layers to add to the map
   */
  async add(layer: TypeFeatureLayer): Promise<FeatureLayer | null> {
    let queryUrl = this.url.substr(-1) === '/' ? this.url : `${this.url}/`;
    queryUrl += 'legend?f=pjson';
    // define a default blue icon
    const iconSymbols: { field: string | null; valueAndSymbol: Record<string, L.Icon> } = {
      field: null,
      valueAndSymbol: { default: blueCircleIcon },
    };

    const res = await axios.get<TypeJsonObject>(queryUrl);

    const renderer = res.data.drawingInfo && res.data.drawingInfo.renderer;
    if (renderer) {
      if (renderer.type === 'uniqueValue') {
        iconSymbols.field = renderer.field1 as string;
        (renderer.uniqueValueInfos as TypeJsonArray).forEach((symbolInfo) => {
          iconSymbols.valueAndSymbol[symbolInfo.value as string] = new L.Icon({
            iconUrl: `data:${symbolInfo.symbol.contentType};base64,${symbolInfo.symbol.imageData}`,
            iconSize: [symbolInfo.symbol.width as number, symbolInfo.symbol.height as number],
            iconAnchor: [Math.round((symbolInfo.symbol.width as number) / 2), Math.round((symbolInfo.symbol.height as number) / 2)],
          });
        });
      } else if (renderer.symbol) {
        const symbolInfo = renderer.symbol;
        iconSymbols.valueAndSymbol.default = new L.Icon({
          iconUrl: `data:${symbolInfo.contentType};base64,${symbolInfo.imageData}`,
          iconSize: [symbolInfo.width as number, symbolInfo.height as number],
          iconAnchor: [Math.round((symbolInfo.width as number) / 2), Math.round((symbolInfo.height as number) / 2)],
        });
      }
    }

    const data = getXMLHttpRequest(`${layer.url[api.map(this.mapId).getLanguageCode()]}?f=json`);

    const geo = new Promise<FeatureLayer | null>((resolve) => {
      data.then((value) => {
        if (value !== '{}') {
          const { type } = toJsonObject(JSON.parse(value));

          // check if the type is define as Feature Layer. If the entrie is bad, it will request the whole service
          // if the path is bad, return will be {}
          if (typeof type !== 'undefined' && type === 'Feature Layer') {
            const feature = featureLayer({
              url: layer.url[api.map(this.mapId).getLanguageCode()],
              pointToLayer: (aFeature, latlng) => {
                const iconToUse =
                  iconSymbols.field && aFeature.properties[iconSymbols.field] in iconSymbols.valueAndSymbol
                    ? iconSymbols.valueAndSymbol[aFeature.properties[iconSymbols.field]]
                    : iconSymbols.valueAndSymbol.default;
                return L.marker(latlng, { icon: iconToUse, id: generateId() });
              },
            } as FeatureLayerOptions);

            resolve(feature);
          } else {
            resolve(null);
          }
        } else {
          resolve(null);
        }
      });
    });

    return geo;
  }

  /**
   * Get metadata of the current service
   *
   @returns {Promise<TypeJsonValue>} a json promise containing the result of the query
   */
  getMetadata = async (): Promise<TypeJsonObject> => {
    const response = await fetch(`${this.url}?f=json`);
    const result: TypeJsonObject = await response.json();

    return result;
  };

  /**
   * Get legend configuration of the current layer
   *
   * @returns {Promise<TypeJsonValue> } legend configuration in json format
   */
  getLegendJson = (): Promise<TypeJsonValue> => {
    let queryUrl = this.url.substr(-1) === '/' ? this.url : `${this.url}/`;
    queryUrl += 'legend?f=pjson';
    return axios.get(queryUrl).then((res) => {
      return res.data;
    });
  };

  /**
   * Set Layer Opacity
   * @param {number} opacity layer opacity
   */
  setOpacity = (opacity: number) => {
    (this.layer as FeatureLayer).eachFeature((feature) => {
      if (feature.setOpacity) feature.setOpacity(opacity);
      else if (feature.setStyle) feature.setStyle({ opacity, fillOpacity: opacity * 0.2 });
    });
  };

  /**
   * Get bounds through external metadata
   *
   * @returns {Promise<L.LatLngBounds>} layer bounds
   */
  getBounds = async (): Promise<L.LatLngBounds> => {
    const meta = await this.getMetadata();
    const xmin = meta.extent.xmin as number;
    const xmax = meta.extent.xmax as number;
    const ymin = meta.extent.ymin as number;
    const ymax = meta.extent.ymax as number;
    return L.latLngBounds([
      [ymin, xmin],
      [ymax, xmax],
    ]);
  };
}
