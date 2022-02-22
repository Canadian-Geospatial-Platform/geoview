import axios from "axios";

import { Layer } from "leaflet";

import { dynamicMapLayer, mapService } from "esri-leaflet";

import { getXMLHttpRequest } from "../../../core/utils/utilities";
import { TypeLayerConfig } from "../../../core/types/cgpv-types";

import { api } from "../../../api/api";

/**
 * a class to add esri dynamic layer
 *
 * @export
 * @class EsriDynamic
 */
export class EsriDynamic {
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
        let entries = layer.entries?.split(",").map((item: string) => {
          return parseInt(item, 10);
        });
        entries = entries?.filter((item) => !Number.isNaN(item));

        // check if the entries are part of the service
        if (
          value !== "{}" &&
          layers &&
          layers.find((item: Record<string, number>) =>
            entries?.includes(item.id)
          )
        ) {
          const feat = dynamicMapLayer({
            url: layer.url,
            layers: entries,
            attribution: "",
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
