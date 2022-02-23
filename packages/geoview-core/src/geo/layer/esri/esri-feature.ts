import axios from "axios";

import { Layer } from "leaflet";

import { featureLayer, mapService } from "esri-leaflet";

import { getXMLHttpRequest } from "../../../core/utils/utilities";
import { TypeLayerConfig } from "../../../core/types/cgpv-types";

import { api } from "../../../api/api";

/**
 * a class to add esri feature layer
 *
 * @export
 * @class EsriFeature
 */
export class EsriFeature {
  // layer name with default
  name: string = "Esri Feature Layer";
  /**
   * Add a ESRI feature layer to the map.
   *
   * @param {TypeLayerConfig} layer the layer configuration
   * @return {Promise<Layer | string>} layers to add to the map
   */
  add(layer: TypeLayerConfig): Promise<Layer | string> {
    const data = getXMLHttpRequest(`${layer.url}?f=json`);

    const geo = new Promise<Layer | string>((resolve) => {
      data.then((value: string) => {
        const { name, type } = JSON.parse(value);

        if (layer.hasOwnProperty("name")) this.name = layer.name;
        else if (name) this.name = name;

        // check if the type is define as Feature Layer. If the entrie is bad, it will request the whole service
        // if the path is bad, return will be {}
        if (
          value !== "{}" &&
          typeof type !== "undefined" &&
          type === "Feature Layer"
        ) {
          const feat = featureLayer({
            url: layer.url,
          });

          Object.defineProperties(feat, {
            mapService: {
              value: mapService({
                url: api.geoUtilities.getMapServerUrl(layer.url),
              }),
            },
            getMeta: {
              value: function _getLegendJson() {
                return feat.metadata(function (error, metadata) {
                  return metadata;
                });
              },
            },
            getLegendJson: {
              value: function _getLegendJson() {
                let queryUrl =
                  layer.url.substr(-1) === "/" ? layer.url : layer.url + "/";
                queryUrl += "legend?f=pjson";
                return axios.get(queryUrl).then((res) => {
                  return res.data;
                });
              },
            },
          });

          resolve(feat);
        } else {
          resolve("{}");
        }
      });
    });

    return new Promise((resolve) => resolve(geo));
  }
}
