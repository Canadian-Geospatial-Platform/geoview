import axios from "axios";

import L, { Layer } from "leaflet";

import {
  featureLayer,
  mapService as esriMapService,
  MapService,
} from "esri-leaflet";

import { getXMLHttpRequest } from "../../../core/utils/utilities";
import { TypeLayerConfig } from "../../../core/types/cgpv-types";
import { generateId } from "../../../core/utils/utilities";

import { api } from "../../../api/api";

/**
 * a class to add esri feature layer
 *
 * @export
 * @class EsriFeature
 */
export class EsriFeature {
  // layer id with default
  id: string;

  // layer name with default
  name?: string = "Esri Feature Layer";

  // layer type
  type: string;

  // layer from leaflet
  layer: Layer | string;

  //layer or layer service url
  url: string;

  //mapService property
  mapService: MapService;

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
    this.mapService = esriMapService({
      url: api.geoUtilities.getMapServerUrl(layerConfig.url),
    });
  }

  /**
   * Add a ESRI feature layer to the map.
   *
   * @param {TypeLayerConfig} layer the layer configuration
   * @return {Promise<Layer | string>} layers to add to the map
   */
  async add(layer: TypeLayerConfig): Promise<Layer | string> {
    let queryUrl = this.url.substr(-1) === "/" ? this.url : this.url + "/";
    queryUrl += "legend?f=pjson";
    // define a default blue icon
    let iconSymbol = L.icon({
      //iconUrl: 'http://services.arcgis.com/SgB3dZDkkUxpEHxu/ArcGIS/rest/services/huc17_accesses/FeatureServer/0/images/d66f4bf18356e409c6221a46633b935a',
      iconUrl:
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAILSURBVDhPpZRNSBRhGMf/M5u5KtnJ1TVBNizdox8giODBQwuxRkinzZMfhwgRRT14DzIKvHgRFEEFTe0gHRShQ2HmRxCU5Ucgy+JhBQ20ZNfN1//z7iQttmrODx6ed56Z/e07M88z+BdKKScjwBjfi6rNtV0V+/5DxSIxtSk165zTujwBw8on8MLa8AF6+r7gxug68HmHNetcigmUZwN1hTpCaVfQYhjGhHVacyKkSNbPhlfR1vwW2InE68kouA4MVgMVbjznYTvF+n//Fj59soSOrg9W4QKkcscvfYDfg24KO6WmhZTdHVrFVN3s6UdwHk4HMFcLVZwFP6WvDcoc4V9Y847g5nm3mYzSLGDhAdZNA15uGr6+lcvLhOVtYCaIW1z6ROiXt2mX0Q2d/OZeFGXSGnZZDOtUYoZ+IudPn9khtK+Ty3QY+K2XNqFHiJn51xCUCbCLJ1OnLTPVgfcyTnapdOs0L3ublNm0i+WYNNnd84HbmJPZvCz3PGxuF96JSz+9jBQ8GqjGoczm/+JOB3qrEOXysRxrBc2f+AwaxnxQMpsXRWQzNVC5GWgUh9QSPgac68DHbfQ3vcFVGaezkNvkziKU1VM2bJVPf10o9R4pvJgO4s7YBgyZAGla6TNpDXmbDwuhylyY5uWtlH2N/zJO0s8VxUVM9xmljDypkRBjmfGKom+6kgBwDEZ2r0wFzVAoAAAAAElFTkSuQmCC",
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });

    let res = await axios.get(queryUrl);

    if (res.data.drawingInfo.renderer && res.data.drawingInfo.renderer.symbol) {
      let symbolInfo = res.data.drawingInfo.renderer.symbol;
      iconSymbol = L.icon({
        //iconUrl: 'http://services.arcgis.com/SgB3dZDkkUxpEHxu/ArcGIS/rest/services/huc17_accesses/FeatureServer/0/images/d66f4bf18356e409c6221a46633b935a',
        iconUrl: `data:${symbolInfo.contentType};base64,${symbolInfo.imageData}`,
        iconSize: [symbolInfo.width, symbolInfo.height],
        iconAnchor: [
          Math.round(symbolInfo.width / 2),
          Math.round(symbolInfo.height / 2),
        ],
      });
    }

    const data = getXMLHttpRequest(`${layer.url}?f=json`);

    const geo = new Promise<Layer | string>((resolve) => {
      data.then((value: string) => {
        const { type } = JSON.parse(value);

        // check if the type is define as Feature Layer. If the entrie is bad, it will request the whole service
        // if the path is bad, return will be {}
        if (
          value !== "{}" &&
          typeof type !== "undefined" &&
          type === "Feature Layer"
        ) {
          const feat = featureLayer({
            url: layer.url,
            pointToLayer: function (feature, latlng) {
              return L.marker(latlng, { icon: iconSymbol });
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

  /**
   * Get metadata of the current service
   *
   @returns {Promise<Record<string, unknown>>} a json promise containing the result of the query
   */
  getMetadata = async (): Promise<Record<string, unknown>> => {
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
    return axios.get(queryUrl).then((res) => {
      console.log(res.data);
      return res.data;
    });
  };

  /**
   * Set Layer Opacity
   * @param {number} opacity layer opacity
   */
  setOpacity = (opacity: number) => {
    this.layer.eachFeature((x) => {
      if (x.setOpacity) x.setOpacity(opacity);
      else if (x.setStyle) x.setStyle({ opacity, fillOpacity: opacity * 0.2 });
    });
  };

  /**
   * Get bounds through external metadata
   *
   * @returns {Promise<L.LatLngBounds>} layer bounds
   */
  getBounds = async (): Promise<L.LatLngBounds> => {
    const meta = await this.getMetadata();
    const { xmin, xmax, ymin, ymax } = meta.extent;
    return L.latLngBounds([
      [ymin, xmin],
      [ymax, xmax],
    ]);
  };
}
