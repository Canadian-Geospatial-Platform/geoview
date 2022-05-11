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
  TypeFilterFeatures,
  TypeFilterQuery,
  FILTER_OPERATOR,
  TypeJsonObject,
} from '../../../../core/types/cgpv-types';

import { api } from '../../../../app';

// constant to define default style if not set by renderer
// TODO: put somewhere to reuse for all vector layers + maybe array so if many layer, we increase the choice
const defaultCircleMarkerStyle: L.CircleMarkerOptions = {
  radius: 5,
  fillColor: '#000000',
  color: '#000000',
  weight: 1,
  opacity: 1,
  fillOpacity: 0.4
}
const defaultLineStringStyle: L.PathOptions = {
  color: '#000000',
  weight: 2,
  opacity: 1,
}
const defaultLinePolygonStyle: L.PathOptions = {
  color: '#000000',
  weight: 2,
  opacity: 1,
  fillColor: '#000000',
  fillOpacity: 0.5,
}
const defaultSelectStyle: L.PathOptions = {
  color: '#0000FF',
  weight: 3,
  opacity: 1,
  fillColor: '#0000FF',
  fillOpacity: 0.5,
}
const defaultStyle: any = {
  'Point': defaultCircleMarkerStyle,
  'Line': defaultLineStringStyle,
  'Polygon': defaultLinePolygonStyle,
}

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
  features: Object[] = []

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
  add(geoLayer: TypeGeoJSONLayer): Promise<L.GeoJSON | null> {
    const data = getXMLHttpRequest(geoLayer.url[api.map(this.mapId).getLanguageCode()]);

    const geo = new Promise<L.GeoJSON | null>((resolve) => {
      data.then((value) => {
        if (value !== '{}') {
          // parse the json string and convert it to a json object
          const featureCollection = toJsonObject(JSON.parse(value));

          // add the geojson to the map
          const geojson = L.geoJSON(Cast<GeoJSON.GeoJsonObject>(featureCollection), {
            pointToLayer: (feature, latlng): L.Layer | undefined => {
              return L.circleMarker(latlng, geoLayer.renderer || defaultCircleMarkerStyle);
            },
            onEachFeature: (feature, layer) => {
              this.features.push({ layer });

              layer.on({
                // highlight on hover
                'mouseover': function(e) {
                    const layer = e.target;
                    if (layer.options.opacity !== 0 || layer.options.fillOpacity !== 0) {
                      layer.setStyle(defaultSelectStyle);
                      layer.bringToFront();
                    }
                },
                // remove highlight when hover stops
                'mouseout': function(e) {
                    const layer = e.target;
                    if (layer.options.opacity !== 0 || layer.options.fillOpacity !== 0)
                      layer.setStyle(geoLayer.renderer || defaultStyle[layer.feature?.geometry.type]);
                }
            })
            },
            // TODO classes will be created to style the elements, it may get the info from theming
            // add styling
            style: (feature) => {
              if (feature?.geometry.type === 'Polygon') {
                return geoLayer.renderer || defaultLinePolygonStyle;
              } else if (feature?.geometry.type === 'LineString') {
                return geoLayer.renderer || defaultLineStringStyle;
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

  filterFeatures(filters: TypeFilterQuery[]): TypeFilterFeatures {
    const result: TypeFilterFeatures = { pass: [], fail: [] };

    // get type of values
    const typeOfValue = filters.map(item => typeof item.value);

    // loop all layer features
    for (let feature of this.features as TypeJsonObject[]) {
          // for each field, check value type associtaed and cast if needed
          let featValues: (string | number)[] = [];
          filters.forEach((filter: TypeFilterQuery, i: number) => {
            let tmpValue = (typeOfValue[i] === 'string') ?
              String(feature.layer.feature.properties[filter.field]) : Number(feature.layer.feature.properties[filter.field]);
            featValues.push(tmpValue);
          });

          // apply the filters
          let pass: boolean[] = [];
          filters.forEach((filter: TypeFilterQuery, i: number) => {
            pass.push(FILTER_OPERATOR[filter.operator as string](featValues[i], filter.value));
          });

          // check if pass
          // TODO: redevelop to have unlimited number of filters
          if (!pass.includes(false) && filters[1].connector === '&&' || pass.includes(true) && filters[1].connector === '||') {
            result.pass.push(feature);
          } else {
            result.fail.push(feature);
          }
    }

    return result;
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
