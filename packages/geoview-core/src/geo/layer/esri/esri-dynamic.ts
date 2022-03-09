import axios from "axios";

import { Layer } from "leaflet";

import {
  dynamicMapLayer,
  mapService as esriMapService,
  MapService,
} from "esri-leaflet";

import { getXMLHttpRequest } from "../../../core/utils/utilities";
import { TypeLayerConfig } from "../../../core/types/cgpv-types";
import { generateId } from "../../../core/utils/utilities";

import { api } from "../../../api/api";

/**
 * a class to add esri dynamic layer
 *
 * @export
 * @class EsriDynamic
 */
export class EsriDynamic {
  // layer id with default
  id: string;

  // layer name with default
  name?: string = "Esri Dynamic Layer";

  // layer type
  type: string;

  // layer from leaflet
  layer: Layer | string;

  //layer or layer service url
  url: string;

  //mapService property
  mapService: MapService;

  //service entries
  entries?: number[];

  /**
   * Initialize layer
   *
   * @param {TypeLayerConfig} layerConfig the layer configuration
   */
  constructor(layerConfig: TypeLayerConfig) {
    this.id = layerConfig.id || generateId("");
    if (layerConfig.hasOwnProperty("name")) this.name = layerConfig.name;
    this.type = layerConfig.type;
    this.url = layerConfig.url;
    this.layer = new Layer();
    let entries = layerConfig.entries?.split(",").map((item: string) => {
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
   * @return {Promise<Layer | string>} layers to add to the map
   */
  add(layer: TypeLayerConfig): Promise<Layer | string> {
    const data = getXMLHttpRequest(`${layer.url}?f=json`);

    const geo = new Promise<Layer | string>((resolve) => {
      data.then((value: string) => {
        // get layers from service and parse layer entries as number
        const { layers } = JSON.parse(value);

        // check if the entries are part of the service
        if (
          value !== "{}" &&
          layers &&
          layers.find((item: Record<string, number>) =>
            this.entries?.includes(item.id)
          )
        ) {
          const feat = dynamicMapLayer({
            url: layer.url,
            layers: this.entries,
            attribution: "",
          });

          resolve(feat);
        } else {
          resolve("{}");
        }
      });
    });

    return new Promise((resolve) => resolve(geo));
  }

  /**
   * Get metadata of the current service
   *
   @returns {Promise<Record<string, unknown>>} a json promise containing the result of the query
   */
  getMetadata = async (): Promise<Record<string, unknown>> => {
    // const feat = featureLayer({
    //   url: this.url,
    // });
    // return feat.metadata(function (error, metadata) {
    //   return metadata;
    // });
    const response = await fetch(`${this.url}?f=json`);
    const result = await response.json();

    return result;
  };

  /**
   * Get legend configuration of the current layer
   *
   * @returns {any} legend configuration in json format
   */
  getLegendJson = (): any => {
    let queryUrl = this.url.substr(-1) === "/" ? this.url : this.url + "/";
    queryUrl += "legend?f=pjson";

    const feat = dynamicMapLayer({
      url: this.url,
      layers: this.entries,
      attribution: "",
    });

    return axios.get(queryUrl).then((res) => {
      let data = res.data;
      let entryArray = feat.getLayers();

      if (entryArray.length > 0) {
        let result = data.layers.filter((item: any) => {
          return entryArray.includes(item.layerId);
        });
        return result;
      } else {
        return data.layers;
      }
    });
  };
}
