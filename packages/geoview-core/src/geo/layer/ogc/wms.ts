/* eslint-disable object-shorthand */
/* eslint-disable no-underscore-dangle */
import axios from "axios";

import L, { LeafletMouseEvent, Layer, version } from "leaflet";

import { mapService } from "esri-leaflet";

import WMSCapabilities from "wms-capabilities";

import { getXMLHttpRequest, xmlToJson } from "../../../core/utils/utilities";

import {
  Cast,
  TypeJSONObject,
  TypeJSONObjectLoop,
  TypeLayerConfig,
} from "../../../core/types/cgpv-types";

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

  // layer name with default
  name: string = "WMS Layer";

  /**
   * Add a WMS layer to the map.
   *
   * @param {TypeLayerConfig} layer the layer configuration
   * @return {Promise<Layer | string>} layers to add to the map
   */
  add(layer: TypeLayerConfig): Promise<Layer | string> {
    let { url } = layer;

    // if url has a '?' do not append to avoid errors, user must add this manually
    // TODO: only work with a single layer value, parse the entries and create new layer for each of the entries
    // TODO: in the legend regroup these layers
    if (layer.url.indexOf("?") === -1) {
      url += "?";
    }
    let capUrl =
      url +
      `service=WMS&version=1.3.0&request=GetCapabilities&layers=${layer.entries}`;
    let legendUrl =
      url +
      "service=WMS&version=1.3.0&request=GetLegendGraphic&FORMAT=image/png&layer=";

    const data = getXMLHttpRequest(capUrl);

    const geo = new Promise<Layer | string>((resolve) => {
      data.then((value: string) => {
        if (value !== "{}") {
          // check if entries exist
          let isValid = true;
          var boolArray: boolean[] = [true];

          // parse the xml string and convert to json
          const json = new WMSCapabilities(
            value
          ).toJSON() as TypeJSONObjectLoop;

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

            Object.defineProperties(wms, {
              //add name
              name: {
                value: layer.hasOwnProperty("name")
                  ? layer.name
                  : json.Service.Name,
              },
              // add an array of the WMS layer ids / entries
              entries: {
                value: layer.entries?.split(",").map((item: string) => {
                  return item.trim();
                }),
              },
              mapService: {
                value: mapService({
                  url: api.geoUtilities.getMapServerUrl(layer.url, true),
                }),
              },
              // add support for a getFeatureInfo to WMS Layer
              getFeatureInfo: {
                /**
                 * Get feature info from a WMS Layer
                 *
                 * @param {LeafletMouseEvent} evt Event received on any interaction with the map
                 * @returns {Promise<TypeJSONObject | null>} a promise that returns the feature info in a json format
                 */
                value: async function _getFeatureInfo(
                  evt: LeafletMouseEvent
                ): Promise<TypeJSONObject | null> {
                  const res = await axios.get(
                    this.getFeatureInfoUrl(evt.latlng)
                  );
                  const featureInfoResponse = (
                    xmlToJson(res.request.responseXML) as TypeJSONObjectLoop
                  ).FeatureInfoResponse;
                  if (
                    featureInfoResponse &&
                    featureInfoResponse.FIELDS &&
                    featureInfoResponse.FIELDS["@attributes"]
                  ) {
                    return featureInfoResponse.FIELDS[
                      "@attributes"
                    ] as TypeJSONObject;
                  }

                  return null;
                },
              },
              getFeatureInfoUrl: {
                /**
                 * Get feature info url from a lat lng point
                 *
                 * @param {LatLng} latlng a latlng point to generate the feature url from
                 * @returns the map service url including the feature query
                 */
                value: function _getFeatureInfoUrl(latlng: L.LatLng): string {
                  // Construct a GetFeatureInfo request URL given a point
                  const point = this._map.latLngToContainerPoint(latlng);

                  const size = this._map.getSize();

                  const params: Record<string, unknown> = {
                    request: "GetFeatureInfo",
                    service: "WMS",
                    srs: "EPSG:4326",
                    styles: this.wmsParams.styles,
                    transparent: this.wmsParams.transparent,
                    version: this.wmsParams.version,
                    format: this.wmsParams.format,
                    bbox: this._map.getBounds().toBBoxString(),
                    height: size.y,
                    width: size.x,
                    layers: this.wmsParams.layers,
                    query_layers: this.wmsParams.layers,
                    info_format: "text/xml",
                  };

                  params[params.version === "1.3.0" ? "i" : "x"] = point.x;
                  params[params.version === "1.3.0" ? "j" : "y"] = point.y;

                  return (
                    this._url + L.Util.getParamString(params, this._url, true)
                  );
                },
              },
              getCapabilities: {
                /**
                 * Get capabilities of the current WMS service
                 *
                 * @returns {object} WMS capabilities in json format
                 */
                value: function _getCapabilities(): TypeJSONObjectLoop {
                  return json;
                },
              },
              getLegendGraphic: {
                /**
                 * Get the legend image of a layer
                 *
                 * @param {layerName} string the name of the layer to get the legend image for
                 * @returns {blob} image blob
                 */
                value: function _getLegendGraphic(layerName: string): any {
                  return axios
                    .get(legendUrl + layerName, { responseType: "blob" })
                    .then((response) => {
                      return response.data;
                    });
                },
              },
            });

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
}
