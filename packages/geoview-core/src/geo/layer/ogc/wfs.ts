/* eslint-disable object-shorthand */
/* eslint-disable no-underscore-dangle */
import axios from "axios";

import L, { LeafletMouseEvent, Layer, version } from "leaflet";

import { mapService as esriMapService, MapService } from "esri-leaflet";

import { xmlToJson } from "../../../core/utils/utilities";

import {
  Cast,
  TypeJSONObject,
  TypeJSONObjectLoop,
  TypeLayerConfig,
} from "../../../core/types/cgpv-types";
import { generateId } from "../../../core/utils/utilities";

import { api } from "../../../api/api";

/**
 * a class to add WFS layer
 *
 * @export
 * @class WFS
 */
export class WFS {
  // map config properties

  // layer id with default
  id: string;

  // layer name with default
  name: string = "WFS Layer";

  // layer type
  type: string;

  // layer from leaflet
  layer: Layer | string;

  //layer entries
  entries: string[] | undefined;

  //layer or layer service url
  url: string;

  //mapService property
  mapService: MapService;

  // private varibale holding wms capabilities
  #capabilities: TypeJSONObjectLoop;

  // private varibale holding wms paras
  #version: string = "2.0.0";

  /**
   * Initialize layer
   *
   * @param {TypeLayerConfig} layerConfig the layer configuration
   */
  constructor(layerConfig: TypeLayerConfig) {
    this.id = layerConfig.id || generateId("");
    this.type = layerConfig.type;
    this.#capabilities = {};
    this.entries = layerConfig.entries?.split(",").map((item: string) => {
      return item.trim();
    });
    this.mapService = esriMapService({
      url: api.geoUtilities.getMapServerUrl(layerConfig.url, true),
    });
    this.url = layerConfig.url;

    this.layer = new Layer();
  }

  /**
   * Add a WFS layer to the map.
   *
   * @param {TypeLayerConfig} layer the layer configuration
   * @return {Promise<Layer | string>} layers to add to the map
   */
  async add(layer: TypeLayerConfig): Promise<Layer | string> {
    let capUrl = this.url + "request=getcapabilities&service=WFS";

    //const data = getXMLHttpRequest(capUrl);
    const res = await axios.get(this.url, {
      params: { request: "getcapabilities", service: "WFS" },
    });

    //need to pass a xmldom to xmlToJson
    var xmlDOM = new DOMParser().parseFromString(res.data, "text/xml");
    const json = xmlToJson(xmlDOM) as TypeJSONObjectLoop;

    this.#capabilities = json["wfs:WFS_Capabilities"];
    this.#version = json["wfs:WFS_Capabilities"]["@attributes"]["version"];
    let featTypeInfo = this.getFeatyreTypeInfo(
      json["wfs:WFS_Capabilities"].FeatureTypeList.FeatureType,
      layer.entries
    );

    if (!featTypeInfo) {
      return new Promise((resolve) => resolve("{}"));
    }

    this.name = featTypeInfo.Name["#text"].split(":")[1] as string;
    let layerEPSG = featTypeInfo.DefaultCRS["#text"].split("crs:")[1];
    layerEPSG = layerEPSG.replace("::", ":");

    let params = {
      service: "WFS",
      version: this.#version,
      request: "GetFeature",
      typename: layer.entries,
      srsname: "EPSG:4326",
      outputFormat: "application/json",
    };

    const featRes = axios.get(this.url, { params: params });

    const geo = new Promise<Layer | string>((resolve) => {
      featRes
        .then((res) => {
          let geojson = res.data;

          if (geojson && geojson !== "{}") {
            const wfs = L.geoJSON(geojson, {
              pointToLayer: function (feature, latlng) {
                if (feature.geometry.type == "Point") {
                  const lId = generateId("");
                  return L.circleMarker(latlng);
                }
                //if need to use specific style for point
                //return L.circleMarker(latlng, {
                //  ...geojsonMarkerOptions,
                //  id: lId,
                //});
              },
              style: function (feature) {
                return {
                  stroke: true,
                  color: "#333",
                  fillColor: "#FFB27F",
                  fillOpacity: 0.8,
                };
              },
            });

            resolve(wfs);
          } else {
            resolve("{}");
          }
        })
        .catch(function (error) {
          if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            //console.log(error.response.data);
            //console.log(error.response.status);
            //console.log(error.response.headers);
          } else if (error.request) {
            // The request was made but no response was received
            // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
            // http.ClientRequest in node.js
            //console.log(error.request);
          } else {
            // Something happened in setting up the request that triggered an Error
            //console.log("Error", error.message);
          }
          //console.log(error.config);
          resolve("{}");
        });
    });
    return new Promise((resolve) => resolve(geo));
  }

  /**
   * Get feature type info of a given entry
   * @param {object} FeatureTypeList feature type list
   * @param {string} entries names(comma delimited) to check
   * @returns {TypeJSONObject | null} feature type object or null
   */
  private getFeatyreTypeInfo(
    FeatureTypeList: TypeJSONObject,
    entries?: string
  ): TypeJSONObject | null {
    let res = null;

    if (Array.isArray(FeatureTypeList)) {
      for (let i = 0; i < FeatureTypeList.length; i++) {
        let fName = FeatureTypeList[i].Name["#text"];
        let fNameSplit = fName.split(":");
        fName = fNameSplit.length > 1 ? fNameSplit[1] : fNameSplit[0];

        let entrySplit = entries!.split(":");
        let entryName = entrySplit.length > 1 ? entrySplit[1] : entrySplit[0];

        if (entryName == fName) {
          return FeatureTypeList[i];
        }
      }
    } else {
      let fName = FeatureTypeList["Name"]["#text"];

      let fNameSplit = fName.split(":");
      fName = fNameSplit.length > 1 ? fNameSplit[1] : fNameSplit[0];

      let entrySplit = entries!.split(":");
      let entryName = entrySplit.length > 1 ? entrySplit[1] : entrySplit[0];

      if (entryName == fName) {
        return FeatureTypeList;
      }
    }

    return res;
  }

  /**
   * Get capabilities of the current WFS service
   *
   * @returns {TypeJSONObjectLoop} WFS capabilities in json format
   */
  getCapabilities = (): TypeJSONObjectLoop => {
    return this.#capabilities;
  };
}
