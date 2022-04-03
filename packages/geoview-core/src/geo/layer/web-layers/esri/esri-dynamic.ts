import axios from 'axios';

<<<<<<< HEAD:packages/geoview-core/src/geo/layer/web-layers/esri/esri-dynamic.ts
import L from 'leaflet';

import { DynamicMapLayer, DynamicMapLayerOptions, dynamicMapLayer, mapService as esriMapService, MapService } from 'esri-leaflet';

import { getXMLHttpRequest } from '../../../../core/utils/utilities';
import {
  Cast,
  AbstractWebLayersClass,
  TypeLayerConfig,
  TypeJSONValue,
  TypeJSONObject,
  TypeLegendJsonDynamic,
} from '../../../../core/types/cgpv-types';

import { api } from '../../../../api/api';
=======
import L, { Layer } from 'leaflet';

import { dynamicMapLayer, mapService as esriMapService, MapService } from 'esri-leaflet';

import { getXMLHttpRequest, generateId } from '../../../core/utils/utilities';
import { TypeLayerConfig, TypeJSONObject, TypeLegendJsonDynamic } from '../../../core/types/cgpv-types';

import { api } from '../../../api/api';
>>>>>>> 2494732ad4a7a2c68e059d9d1877b2d59d665d4d:packages/geoview-core/src/geo/layer/esri/esri-dynamic.ts

/**
 * a class to add esri dynamic layer
 *
 * @export
 * @class EsriDynamic
 */
<<<<<<< HEAD:packages/geoview-core/src/geo/layer/web-layers/esri/esri-dynamic.ts
export class EsriDynamic extends AbstractWebLayersClass {
=======
export class EsriDynamic {
  // layer id with default
  id: string;

  // layer name with default
  name?: string = 'Esri Dynamic Layer';

  // layer type
  type: string;

>>>>>>> 2494732ad4a7a2c68e059d9d1877b2d59d665d4d:packages/geoview-core/src/geo/layer/esri/esri-dynamic.ts
  // layer from leaflet
  layer: DynamicMapLayer | null = null;

  // mapService property
  mapService: MapService;

  // service entries
  entries?: number[];

  /**
   * Initialize layer
   *
   * @param {TypeLayerConfig} layerConfig the layer configuration
   */
  constructor(layerConfig: TypeLayerConfig) {
<<<<<<< HEAD:packages/geoview-core/src/geo/layer/web-layers/esri/esri-dynamic.ts
    super('esriDynamic', 'Esri Dynamic Layer', layerConfig);

=======
    this.id = layerConfig.id || generateId('');
    if ('name' in layerConfig) this.name = layerConfig.name;
    this.type = layerConfig.type;
    this.url = layerConfig.url;
    this.layer = new Layer();
>>>>>>> 2494732ad4a7a2c68e059d9d1877b2d59d665d4d:packages/geoview-core/src/geo/layer/esri/esri-dynamic.ts
    const entries = layerConfig.entries?.split(',').map((item: string) => {
      return parseInt(item, 10);
    });

    this.entries = entries?.filter((item) => !Number.isNaN(item));

    this.mapService = esriMapService({
      url: api.geoUtilities.getMapServerUrl(layerConfig.url),
    });
  }

  /**
   * Add a ESRI dynamic layer to the map.
   *
   * @param {TypeLayerConfig} layer the layer configuration
   * @return {Promise<DynamicMapLayer | null>} layers to add to the map
   */
  add(layer: TypeLayerConfig): Promise<DynamicMapLayer | null> {
    const data = getXMLHttpRequest(`${layer.url}?f=json`);

    const geo = new Promise<DynamicMapLayer | null>((resolve) => {
      data.then((value: string) => {
        // get layers from service and parse layer entries as number
        const { layers } = JSON.parse(value) as TypeJSONObject;

        // check if the entries are part of the service
<<<<<<< HEAD:packages/geoview-core/src/geo/layer/web-layers/esri/esri-dynamic.ts
        if (
          value !== '{}' &&
          layers &&
          Cast<TypeJSONValue[]>(layers).find((item) => {
            const searchedItem = (item as { [key: string]: { id: string } }).id;
            return this.entries?.includes(Cast<number>(searchedItem));
          })
        ) {
          const feature = dynamicMapLayer({
            url: layer.url,
            layers: this.entries,
            attribution: '',
          } as DynamicMapLayerOptions);
=======
        if (value !== '{}' && layers && layers.find((item: Record<string, number>) => this.entries?.includes(item.id))) {
          const feat = dynamicMapLayer({
            url: layer.url,
            layers: this.entries,
            attribution: '',
          });
>>>>>>> 2494732ad4a7a2c68e059d9d1877b2d59d665d4d:packages/geoview-core/src/geo/layer/esri/esri-dynamic.ts

          resolve(feature);
        } else {
<<<<<<< HEAD:packages/geoview-core/src/geo/layer/web-layers/esri/esri-dynamic.ts
          resolve(null);
=======
          resolve('{}');
>>>>>>> 2494732ad4a7a2c68e059d9d1877b2d59d665d4d:packages/geoview-core/src/geo/layer/esri/esri-dynamic.ts
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
    // const feat = featureLayer({
    //   url: this.url,
    // });
    // return feat.metadata(function (error, metadata) {
    //   return metadata;
    // });
    const response = await fetch(`${this.url}?f=json`);
    const result: TypeJSONObject = await response.json();

    return result;
  };

  /**
   * Get legend configuration of the current layer
   *
   * @returns {TypeJSONValue} legend configuration in json format
   */
<<<<<<< HEAD:packages/geoview-core/src/geo/layer/web-layers/esri/esri-dynamic.ts
  getLegendJson = (): Promise<TypeJSONObject> => {
=======
  getLegendJson = (): TypeJSONObject => {
>>>>>>> 2494732ad4a7a2c68e059d9d1877b2d59d665d4d:packages/geoview-core/src/geo/layer/esri/esri-dynamic.ts
    let queryUrl = this.url.substr(-1) === '/' ? this.url : `${this.url}/`;
    queryUrl += 'legend?f=pjson';

    const feat = dynamicMapLayer({
      url: this.url,
      layers: this.entries,
      attribution: '',
    });

    return axios.get<TypeJSONObject>(queryUrl).then<TypeJSONObject>((res) => {
      const { data } = res;
      const entryArray = feat.getLayers();

      if (entryArray.length > 0) {
        const result = (data.layers as TypeJSONValue as TypeJSONValue[]).filter((item) => {
          return entryArray.includes((item as TypeJSONObject).layerId);
        });
        return result as TypeJSONValue as TypeJSONObject;
      }
      return data.layers as TypeJSONObject;
    });
  };

  /**
   * Set Layer Opacity
   * @param {number} opacity layer opacity
   */
  setOpacity = (opacity: number) => {
    (this.layer as DynamicMapLayer).setOpacity(opacity);
  };

  /**
   * Fetch the bounds for an entry
   *
   * @param {number} entry
   * @returns {TypeJSONValue} the result of the fetch
   */
  private getEntry = async (entry: number): Promise<TypeLegendJsonDynamic> => {
    const response = await fetch(`${this.url}/${entry}?f=json`);
    const meta = await response.json();

    return meta;
  };

  /**
   * Get bounds through external metadata
   *
   * @returns {Promise<L.LatLngBounds>} layer bounds
   */
  getBounds = async (): Promise<L.LatLngBounds> => {
    const bounds = L.latLngBounds([]);
    if (this.entries) {
      this.entries.forEach(async (entry: number) => {
        const meta = await this.getEntry(entry);

        const { xmin, xmax, ymin, ymax } = meta.extent;
        bounds.extend([
          [ymin, xmin],
          [ymax, xmax],
        ]);
      });
    }

    return bounds;
  };

  /**
   * Sets Layer entries to toggle sublayers
   *
   * @param entries MapServer layer IDs
   */
  setEntries = (entries: number[]) => {
    (this.layer as DynamicMapLayer).options.layers = entries;
    (this.layer as DynamicMapLayer).redraw();
  };
}
