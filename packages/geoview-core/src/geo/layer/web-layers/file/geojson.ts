import L from 'leaflet';

import { getXMLHttpRequest } from '../../../../core/utils/utilities';
import {
  AbstractWebLayersClass,
  CONST_LAYER_TYPES,
  TypeWebLayers,
  TypeGeoJSONLayer,
  toJsonObject,
  Cast,
  TypeBaseWebLayersConfig,
} from '../../../../core/types/cgpv-types';

import { api } from '../../../../app';

/* ******************************************************************************************************************************
 * Type Gard function that redefines a TypeBaseWebLayersConfig as a TypeGeoJSONLayer
 * if the layerType attribute of the verifyIfLayer parameter is GEOJSON. The type ascention
 * applies only to the the true block of the if clause that use this function.
 *
 * @param {TypeBaseWebLayersConfig} polymorphic object to test in order to determine if the type ascention is valid
 *
 * @return {boolean} true if the type ascention is valid
 */
export const layerConfigIsGeoJSON = (verifyIfLayer: TypeBaseWebLayersConfig): verifyIfLayer is TypeGeoJSONLayer => {
  return verifyIfLayer.layerType === CONST_LAYER_TYPES.GEOJSON;
};

/* ******************************************************************************************************************************
 * Type Gard function that redefines an AbstractWebLayersClass as a GeoJSON
 * if the type attribute of the verifyIfWebLayer parameter is GEOJSON. The type ascention
 * applies only to the the true block of the if clause that use this function.
 *
 * @param {AbstractWebLayersClass} polymorphic object to test in order to determine if the type ascention is valid
 *
 * @return {boolean} true if the type ascention is valid
 */
export const webLayerIsGeoJSON = (verifyIfWebLayer: AbstractWebLayersClass): verifyIfWebLayer is GeoJSON => {
  return verifyIfWebLayer.type === CONST_LAYER_TYPES.GEOJSON;
};

/**
 * Class used to add geojson layer to the map
 *
 * @export
 * @class GeoJSON
 */
export class GeoJSON extends AbstractWebLayersClass {
  // layer from leaflet
  layer: L.GeoJSON | null = null;

  /**
   * Initialize layer
   *
   * @param {string} mapId the id of the map
   * @param {TypeGeoJSONLayer} layerConfig the layer configuration
   */
  constructor(mapId: string, layerConfig: TypeGeoJSONLayer) {
    super(CONST_LAYER_TYPES.GEOJSON as TypeWebLayers, layerConfig, mapId);
  }

  /**
   * Add a GeoJSON layer to the map.
   *
   * @param {TypeGeoJSONLayer} layer the layer configuration
   * @return {Promise<L.GeoJSON | null>} layers to add to the map
   */
  add(layer: TypeGeoJSONLayer): Promise<L.GeoJSON | null> {
    const data = getXMLHttpRequest(layer.url[api.map(this.mapId).getLanguageCode()]);

    const geo = new Promise<L.GeoJSON | null>((resolve) => {
      data.then((value) => {
        if (value !== '{}') {
          // parse the json string and convert it to a json object
          const featureCollection = toJsonObject(JSON.parse(value));

          // add the geojson to the map
          const geojson = L.geoJSON(Cast<GeoJSON.GeoJsonObject>(featureCollection), {
            // TODO classes will be created to style the elements, it may get the info from theming
            // add styling
            style: (feature) => {
              if (feature?.geometry.type === 'Polygon') {
                switch (feature.properties.number) {
                  case 'One':
                    return { color: '#ff0000' };
                  case 'Two':
                    return { color: '#0000ff' };
                  default:
                    return { color: '#696969' };
                }
              } else if (feature?.geometry.type === 'LineString') {
                return {
                  color: '#000000',
                  weight: 5,
                  opacity: 0.65,
                };
              }
              return {};
            },
          } as L.GeoJSONOptions);

          resolve(geojson);
        } else {
          resolve(null);
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
    type SetOpacityLayers = L.GridLayer | L.ImageOverlay | L.SVGOverlay | L.VideoOverlay | L.Tooltip | L.Marker;
    this.layer!.getLayers().forEach((layer) => {
      if ((layer as SetOpacityLayers).setOpacity) (layer as SetOpacityLayers).setOpacity(opacity);
      else if ((layer as L.GeoJSON).setStyle) (layer as L.GeoJSON).setStyle({ opacity, fillOpacity: opacity * 0.2 });
    });
  };

  /**
   * Get bounds through Leaflet built-in functions
   *
   * @returns {L.LatLngBounds} layer bounds
   */
  getBounds = (): L.LatLngBounds => this.layer!.getBounds();
}
