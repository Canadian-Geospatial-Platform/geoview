import axios from 'axios';

<<<<<<< HEAD:packages/geoview-core/src/geo/layer/web-layers/esri/esri-feature.ts
import L from 'leaflet';

import { FeatureLayer, FeatureLayerOptions, featureLayer, mapService as esriMapService, MapService } from 'esri-leaflet';

import { AbstractWebLayersClass, TypeLayerConfig, TypeJSONValue, TypeJSONObject } from '../../../../core/types/cgpv-types';
import { generateId, getXMLHttpRequest } from '../../../../core/utils/utilities';
import { blueCircleIcon } from '../../../../core/types/marker-definitions';

import { api } from '../../../../api/api';
=======
import L, { Layer } from 'leaflet';

import { featureLayer, mapService as esriMapService, MapService } from 'esri-leaflet';

import { TypeLayerConfig, TypeJSONObject } from '../../../core/types/cgpv-types';
import { generateId, getXMLHttpRequest } from '../../../core/utils/utilities';
import { blueCircleIcon } from '../../../core/types/marker-definitions';

import { api } from '../../../api/api';
>>>>>>> 2494732ad4a7a2c68e059d9d1877b2d59d665d4d:packages/geoview-core/src/geo/layer/esri/esri-feature.ts

/**
 * a class to add esri feature layer
 *
 * @export
 * @class EsriFeature
 */
<<<<<<< HEAD:packages/geoview-core/src/geo/layer/web-layers/esri/esri-feature.ts
export class EsriFeature extends AbstractWebLayersClass {
=======
export class EsriFeature {
  // layer id with default
  id: string;

  // layer name with default
  name?: string = 'Esri Feature Layer';

  // layer type
  type: string;

>>>>>>> 2494732ad4a7a2c68e059d9d1877b2d59d665d4d:packages/geoview-core/src/geo/layer/esri/esri-feature.ts
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
<<<<<<< HEAD:packages/geoview-core/src/geo/layer/web-layers/esri/esri-feature.ts
    super('esriFeature', 'Esri Feature Layer', layerConfig);

=======
    this.id = layerConfig.id || generateId('');
    if ('name' in layerConfig) this.name = layerConfig.name;
    this.type = layerConfig.type;
    this.url = layerConfig.url;
    this.layer = new Layer();
>>>>>>> 2494732ad4a7a2c68e059d9d1877b2d59d665d4d:packages/geoview-core/src/geo/layer/esri/esri-feature.ts
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
<<<<<<< HEAD:packages/geoview-core/src/geo/layer/web-layers/esri/esri-feature.ts
  async add(layer: TypeLayerConfig): Promise<FeatureLayer | null> {
=======
  async add(layer: TypeLayerConfig): Promise<Layer | string> {
>>>>>>> 2494732ad4a7a2c68e059d9d1877b2d59d665d4d:packages/geoview-core/src/geo/layer/esri/esri-feature.ts
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
<<<<<<< HEAD:packages/geoview-core/src/geo/layer/web-layers/esri/esri-feature.ts
          const feature = featureLayer({
=======
          const feat = featureLayer({
>>>>>>> 2494732ad4a7a2c68e059d9d1877b2d59d665d4d:packages/geoview-core/src/geo/layer/esri/esri-feature.ts
            url: layer.url,
            pointToLayer: (aFeature, latlng) => {
              return L.marker(latlng, { icon: iconSymbol, id: generateId() });
            },
          } as FeatureLayerOptions);

          resolve(feature);
        } else {
<<<<<<< HEAD:packages/geoview-core/src/geo/layer/web-layers/esri/esri-feature.ts
          resolve(null);
=======
          resolve('{}');
>>>>>>> 2494732ad4a7a2c68e059d9d1877b2d59d665d4d:packages/geoview-core/src/geo/layer/esri/esri-feature.ts
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
<<<<<<< HEAD:packages/geoview-core/src/geo/layer/web-layers/esri/esri-feature.ts
  getLegendJson = (): Promise<TypeJSONValue> => {
=======
  getLegendJson = (): Promise<TypeJSONObject> => {
>>>>>>> 2494732ad4a7a2c68e059d9d1877b2d59d665d4d:packages/geoview-core/src/geo/layer/esri/esri-feature.ts
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
