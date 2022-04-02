import axios from 'axios';

import L from 'leaflet';

import { FeatureLayer, FeatureLayerOptions, featureLayer, mapService as esriMapService, MapService } from 'esri-leaflet';

import { AbstractWebLayersClass, TypeLayerConfig, TypeJSONValue, TypeJSONObject } from '../../../../core/types/cgpv-types';
import { generateId, getXMLHttpRequest } from '../../../../core/utils/utilities';
import { blueCircleIcon } from '../../../../core/types/marker-definitions';

import { api } from '../../../../api/api';

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
   * @param {TypeLayerConfig} layerConfig the layer configuration
   */
  constructor(layerConfig: TypeLayerConfig) {
    super('esriFeature', 'Esri Feature Layer', layerConfig);

    this.mapService = esriMapService({
      url: api.geoUtilities.getMapServerUrl(layerConfig.url),
    });
  }

  /**
   * Add a ESRI feature layer to the map.
   *
   * @param {TypeLayerConfig} layer the layer configuration
   * @return {Promise<FeatureLayer | null>} layers to add to the map
   */
  async add(layer: TypeLayerConfig): Promise<FeatureLayer | null> {
    let queryUrl = this.url.substr(-1) === '/' ? this.url : `${this.url}/`;
    queryUrl += 'legend?f=pjson';
    // define a default blue icon
    let iconSymbol = blueCircleIcon;

    const res = await axios.get(queryUrl);

    if (res.data.drawingInfo.renderer && res.data.drawingInfo.renderer.symbol) {
      const symbolInfo = res.data.drawingInfo.renderer.symbol;
      iconSymbol = new L.Icon({
        iconUrl: `data:${symbolInfo.contentType};base64,${symbolInfo.imageData}`,
        iconSize: [symbolInfo.width, symbolInfo.height],
        iconAnchor: [Math.round(symbolInfo.width / 2), Math.round(symbolInfo.height / 2)],
      });
    }

    const data = getXMLHttpRequest(`${layer.url}?f=json`);

    const geo = new Promise<FeatureLayer | null>((resolve) => {
      data.then((value: string) => {
        const { type } = JSON.parse(value);

        // check if the type is define as Feature Layer. If the entrie is bad, it will request the whole service
        // if the path is bad, return will be {}
        if (value !== '{}' && typeof type !== 'undefined' && type === 'Feature Layer') {
          const feature = featureLayer({
            url: layer.url,
            pointToLayer: (aFeature, latlng) => {
              return L.marker(latlng, { icon: iconSymbol, id: generateId() });
            },
          } as FeatureLayerOptions);

          resolve(feature);
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
   @returns {Promise<TypeJSONValue>} a json promise containing the result of the query
   */
  getMetadata = async (): Promise<TypeJSONObject> => {
    const response = await fetch(`${this.url}?f=json`);
    const result: TypeJSONObject = await response.json();

    return result;
  };

  /**
   * Get legend configuration of the current layer
   *
   * @returns {Promise<TypeJSONValue> } legend configuration in json format
   */
  getLegendJson = (): Promise<TypeJSONValue> => {
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
    const xmin = meta.extent.xmin as TypeJSONValue as number;
    const xmax = meta.extent.xmax as TypeJSONValue as number;
    const ymin = meta.extent.ymin as TypeJSONValue as number;
    const ymax = meta.extent.ymax as TypeJSONValue as number;
    return L.latLngBounds([
      [ymin, xmin],
      [ymax, xmax],
    ]);
  };
}
