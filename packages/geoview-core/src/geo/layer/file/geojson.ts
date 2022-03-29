import L, { Layer } from "leaflet";

import { getXMLHttpRequest, generateId } from "../../../core/utils/utilities";
import { TypeLayerConfig } from "../../../core/types/cgpv-types";

/**
 * Class used to add geojson layer to the map
 *
 * @export
 * @class GeoJSON
 */
export class GeoJSON {
  // layer id with default
  id: string;

  // layer name with default
  name?: string = "GeoJson Layer";

  // layer type
  type: string;

  // layer from leaflet
  layer: Layer | string;

  // layer or layer service url
  url: string;

  /**
   * Initialize layer
   *
   * @param {TypeLayerConfig} layerConfig the layer configuration
   */
  constructor(layerConfig: TypeLayerConfig) {
    this.id = layerConfig.id || generateId("");
    if ("name" in layerConfig) this.name = layerConfig.name;
    this.type = layerConfig.type;
    this.url = layerConfig.url;
    this.layer = new Layer();
  }

  /**
   *
   * Add a GeoJSON layer to the map.
   *
   * @param {TypeLayerConfig} layer the layer configuration
   * @return {Promise<Layer | string>} layers to add to the map
   */
  add(layer: TypeLayerConfig): Promise<Layer | string> {
    const data = getXMLHttpRequest(layer.url);

    const geo = new Promise<Layer | string>((resolve) => {
      data.then((value: string) => {
        if (value !== "{}") {
          // parse the json string and convert it to a json object
          const featureCollection = JSON.parse(value);

          // add the geojson to the map
          const geojson = L.geoJSON(featureCollection, {
            // TODO classes will be created to style the elements, it may get the info from theming
            // add styling
            style: (feature) => {
              if (feature?.geometry.type === "Polygon") {
                switch (feature.properties.number) {
                  case "One":
                    return { color: "#ff0000" };
                  case "Two":
                    return { color: "#0000ff" };
                  default:
                    return { color: "#696969" };
                }
              } else if (feature?.geometry.type === "LineString") {
                return {
                  color: "#000000",
                  weight: 5,
                  opacity: 0.65,
                };
              }

              return {};
            },
          });

          resolve(geojson);
        } else {
          resolve(value);
        }
      });
    });

    return geo;
  }

  /**
   * Set Layer Opacity
   * @param {number} opacity layer opacity
   */
  setOpacity = (opacity: number) => {
    this.layer.getLayers().forEach((x) => {
      if (x.setOpacity) x.setOpacity(opacity);
      else if (x.setStyle) x.setStyle({ opacity, fillOpacity: opacity * 0.2 });
    });
  };

  /**
   * Get bounds through Leaflet built-in functions
   *
   * @returns {L.LatLngBounds} layer bounds
   */
  getBounds = (): L.LatLngBounds => this.layer.getBounds();
}
