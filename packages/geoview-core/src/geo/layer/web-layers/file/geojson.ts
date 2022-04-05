import L from 'leaflet';

import { getXMLHttpRequest } from '../../../../core/utils/utilities';
import { AbstractWebLayersClass, TypeLayerConfig, CONST_LAYER_TYPES } from '../../../../core/types/cgpv-types';

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
   * @param {TypeLayerConfig} layerConfig the layer configuration
   */
  constructor(layerConfig: TypeLayerConfig) {
    super(CONST_LAYER_TYPES.GEOJSON, 'GeoJson Layer', layerConfig);
  }

  /**
   * Add a GeoJSON layer to the map.
   *
   * @param {TypeLayerConfig} layer the layer configuration
   * @return {Promise<L.GeoJSON | null>} layers to add to the map
   */
  add(layer: TypeLayerConfig): Promise<L.GeoJSON | null> {
    const data = getXMLHttpRequest(layer.url);

    const geo = new Promise<L.GeoJSON | null>((resolve) => {
      data.then((value: string) => {
        if (value !== '{}') {
          // parse the json string and convert it to a json object
          const featureCollection = JSON.parse(value);

          // add the geojson to the map
          const geojson = L.geoJSON(featureCollection, {
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
    type HasSetOpacity = L.GridLayer | L.ImageOverlay | L.SVGOverlay | L.VideoOverlay | L.Tooltip | L.Marker;
    (this.layer as L.GeoJSON).getLayers().forEach((layer) => {
      if ((layer as HasSetOpacity).setOpacity) (layer as HasSetOpacity).setOpacity(opacity);
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
