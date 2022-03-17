/* eslint-disable object-shorthand */
/* eslint-disable no-underscore-dangle */
import axios from "axios";

import L, { LeafletMouseEvent, Layer, version } from "leaflet";

import { mapService as esriMapService, MapService } from "esri-leaflet";

import WMSCapabilities from "wms-capabilities";

import { getXMLHttpRequest, xmlToJson } from "../../../core/utils/utilities";

import {
  Cast,
  TypeJSONObject,
  TypeJSONObjectLoop,
  TypeLayerConfig,
} from "../../../core/types/cgpv-types";
import { generateId } from "../../../core/utils/utilities";

import { api } from "../../../api/api";

// TODO: this needs cleaning some layer type like WMS are part of react-leaflet and can be use as a component

/**
 * a class to add wms layer
 *
 * @export
 * @class WMS
 */
export class WMS {
  // TODO: try to avoid getCapabilities for WMS. Use Web Presence metadata return info to store, legend image link, layer name, and other needed properties.
  // ! This will maybe not happen because geoCore may not everything we need. We may have to use getCap
  // * We may have to do getCapabilites if we want to add layers not in the catalog
  // map config properties

  // layer id with default
  id: string;

  // layer name with default
  name: string = "WMS Layer";

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
  #wmsParams: any;

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
    this.url =
      layerConfig.url.indexOf("?") === -1
        ? layerConfig.url + "?"
        : layerConfig.url;
    this.layer = new Layer();
  }

  /**
   * Add a WMS layer to the map.
   *
   * @param {TypeLayerConfig} layer the layer configuration
   * @return {Promise<Layer | string>} layers to add to the map
   */
  add(layer: TypeLayerConfig): Promise<Layer | string> {
    // TODO: only work with a single layer value, parse the entries and create new layer for each of the entries
    // TODO: in the legend regroup these layers

    let capUrl =
      this.url +
      `service=WMS&version=1.3.0&request=GetCapabilities&layers=${layer.entries}`;

    const data = getXMLHttpRequest(capUrl);

    const geo = new Promise<Layer | string>((resolve) => {
      data.then((value: string) => {
        if (value !== "{}") {
          // check if entries exist
          let isValid = true;

          // parse the xml string and convert to json
          const json = new WMSCapabilities(
            value
          ).toJSON() as TypeJSONObjectLoop;
          this.#capabilities = json;

          isValid = this.validateEntries(
            json.Capability.Layer,
            layer.entries as string
          );

          let layerName = layer.hasOwnProperty("name")
            ? layer.name
            : json.Service.Name;
          if (layerName) this.name = <string>layerName;

          if (isValid) {
            const wms = L.tileLayer.wms(layer.url, {
              layers: layer.entries,
              format: "image/png",
              transparent: true,
              attribution: "",
            });
            this.#wmsParams = wms.wmsParams;

            resolve(wms);
          } else {
            resolve("{}");
          }
        } else {
          resolve("{}");
        }
      });
    });
    return new Promise((resolve) => resolve(geo));
  }

  /**
   * Check if the entries we try to create a layer exist in the getCapabilities layer object
   * @param {object} layer layer of capability of a WMS object
   * @param {string} entries names(comma delimited) to check
   * @returns {boolean} entry is valid
   */
  private validateEntries(layer: TypeJSONObjectLoop, entries: string): boolean {
    let isValid = true;
    // eslint-disable-next-line no-prototype-builtins

    //Added support of multiple entries
    let allNames = this.findAllByKey(layer, "Name");
    const entryArray = entries.split(",").map((s) => s.trim());
    for (let i = 0; i < entryArray.length; i++) {
      isValid = isValid && allNames.includes(entryArray[i]);
    }

    return isValid;
  }
  /**
   * Helper function. Find all values of a given key form a nested object
   * @param {object} obj a object/nested object
   * @param {string} keyToFind key to check
   * @returns {any} all values found
   */
  private findAllByKey(obj: object, keyToFind: string): any {
    if (obj) {
      return Object.entries(obj).reduce(
        (acc, [key, v]) =>
          key === keyToFind
            ? acc.concat(v)
            : typeof v === "object"
            ? acc.concat(this.findAllByKey(v, keyToFind))
            : acc,
        []
      );
    } else {
      return [];
    }
  }

  /**
   * Get capabilities of the current WMS service
   *
   * @returns {TypeJSONObjectLoop} WMS capabilities in json format
   */
  getCapabilities = (): TypeJSONObjectLoop => {
    return this.#capabilities;
  };

  /**
   * Get the legend image of a layer
   *
   * @param {layerName} string the name of the layer to get the legend image for
   * @returns {blob} image blob
   */
  getLegendGraphic = async (): Promise<string | ArrayBuffer | null> => {
    const readAsyncFile = (blob: Blob): Promise<string | ArrayBuffer | null> =>
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

    let legendUrl =
      this.url +
      "service=WMS&version=1.3.0&request=GetLegendGraphic&FORMAT=image/png&layer=" +
      this.entries;
    const response = await axios.get(legendUrl, { responseType: "blob" });
    return readAsyncFile(response.data);
  };

  /**
   * Get feature info given a latlng
   *
   * @param {L.LatLng} latlng lat/lng coordinates received on any interaction with the map
   * @param {L.Map} map the map odject
   * @param {number} featureCount the map odject
   * @returns {Promise<TypeJSONObject | null>} a promise that returns the feature info in a json format
   */
  getFeatureInfo = async (
    latlng: L.LatLng,
    map: L.Map,
    featureCount = 10
  ): Promise<TypeJSONObject | null> => {
    let inforFormat = "text/xml";

    if (this.#capabilities.Capability.Request.GetFeatureInfo) {
      let formatArray = this.#capabilities.Capability.Request.GetFeatureInfo
        .Format as any;
      if (formatArray.includes("application/geojson"))
        inforFormat = "application/geojson";
    }

    let params = this.getFeatureInfoParams(latlng, map);
    params["info_format"] = inforFormat;
    params["feature_count"] = featureCount;

    const res = await axios.get(this.url, { params: params });

    if (inforFormat == "application/geojson") {
      if (res.data.features.length > 0) {
        let results: any[] = [];
        res.data.features.forEach((element) => {
          results.push({
            attributes: element.properties,
            geometry: element.geometry,
            layerId: this.id,
            layerName: element.layerName,
            //displayFieldName: "OBJECTID",
            //value: element.properties.OBJECTID,
            geometryType: element.type,
          });
        });

        return { results: results };
      } else {
        return null;
      }
    } else {
      const featureInfoResponse = (
        xmlToJson(res.request.responseXML) as TypeJSONObjectLoop
      ).FeatureInfoResponse;

      if (featureInfoResponse && featureInfoResponse.FIELDS) {
        let results: any[] = [];
        // only one feature
        if (featureInfoResponse.FIELDS["@attributes"]) {
          results.push({
            attributes: featureInfoResponse.FIELDS["@attributes"],
            geometry: null,
            layerId: this.id,
            layerName: this.name,
            //displayFieldName: "OBJECTID",
            //value: element.properties.OBJECTID,
            geometryType: null,
          });
        } else {
          featureInfoResponse.FIELDS.forEach((element) => {
            results.push({
              attributes: element["@attributes"],
              geometry: null,
              layerId: this.id,
              layerName: this.name,
              //displayFieldName: "OBJECTID",
              //value: element.properties.OBJECTID,
              geometryType: null,
            });
          });
        }
        return { results: results };
      } else {
        return null;
      }
    }
  };

  /**
   * Get the parameters used ro query feature info url from a lat lng point
   *
   * @param {LatLng} latlng a latlng point to generate the feature url from
   * @param {L.Map} map the map odject
   * @returns the map service url including the feature query
   */
  private getFeatureInfoParams(latlng: L.LatLng, map: L.Map): any {
    const point = map.latLngToContainerPoint(latlng);

    const size = map.getSize();

    let crs = map.options.crs;

    // these are the SouthWest and NorthEast points
    // projected from LatLng into used crs
    let sw = crs.project(map.getBounds().getSouthWest());
    let ne = crs.project(map.getBounds().getNorthEast());

    const params: Record<string, unknown> = {
      request: "GetFeatureInfo",
      service: "WMS",
      version: this.#wmsParams.version,
      layers: this.#wmsParams.layers,
      query_layers: this.#wmsParams.layers,
      height: size.y,
      width: size.x,
    };

    // Define version-related request parameters.
    var version = window.parseFloat(this.#wmsParams.version);
    params[version >= 1.3 ? "crs" : "srs"] = crs.code;
    params["bbox"] = sw.x + "," + sw.y + "," + ne.x + "," + ne.y;
    params["bbox"] =
      version >= 1.3 && crs.code === "EPSG:4326"
        ? sw.y + "," + sw.x + "," + ne.y + "," + ne.x
        : sw.x + "," + sw.y + "," + ne.x + "," + ne.y;
    params[version >= 1.3 ? "i" : "x"] = point.x;
    params[version >= 1.3 ? "j" : "y"] = point.y;

    return params;
  }
}
