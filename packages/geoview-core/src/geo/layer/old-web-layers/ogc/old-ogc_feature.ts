import axios from 'axios';

import VectorLayer from 'ol/layer/Vector';
import { Vector as VectorSource } from 'ol/source';
import { GeoJSON as GeoJSONFormat } from 'ol/format';
import { Extent } from 'ol/extent';
import { Style, Stroke, Fill, Circle as StyleCircle } from 'ol/style';
import { asArray, asString } from 'ol/color';
import { all } from 'ol/loadingstrategy';
import { transformExtent } from 'ol/proj';

import {
  AbstractGeoViewLayer,
  CONST_LAYER_TYPES,
  TypeJsonValue,
  TypeJsonObject,
  TypeOgcFeatureLayer,
  TypeJsonArray,
  TypeGeoviewLayerConfig,
} from '../../../../core/types/cgpv-types';
import { setAlphaColor } from '../../../../core/utils/utilities';

import { api } from '../../../../app';

// constant to define default style if not set by renderer
// TODO: put somewhere to reuse for all vector layers + maybe array so if many layer, we increase the choice
const defaultCircleMarkerStyle = new Style({
  image: new StyleCircle({
    radius: 5,
    stroke: new Stroke({
      color: asString(setAlphaColor(asArray('#333'), 1)),
      width: 1,
    }),
    fill: new Fill({
      color: asString(setAlphaColor(asArray('#FFB27F'), 0.8)),
    }),
  }),
});

const defaultLineStringStyle = new Style({
  stroke: new Stroke({
    color: asString(setAlphaColor(asArray('#000000'), 1)),
    width: 2,
  }),
});

const defaultLinePolygonStyle = new Style({
  stroke: new Stroke({
    // 1 is for opacity
    color: asString(setAlphaColor(asArray('#000000'), 1)),
    width: 2,
  }),
  fill: new Fill({
    color: asString(setAlphaColor(asArray('#000000'), 0.5)),
  }),
});

const defaultSelectStyle = new Style({
  stroke: new Stroke({
    color: asString(setAlphaColor(asArray('#0000FF'), 1)),
    width: 3,
  }),
  fill: new Fill({
    color: asString(setAlphaColor(asArray('#0000FF'), 0.5)),
  }),
});

/* ******************************************************************************************************************************
 * Type Gard function that redefines a TypeGeoviewLayerConfig as a TypeOgcFeatureLayer
 * if the layerType attribute of the verifyIfLayer parameter is OGC_FEATURE. The type ascention
 * applies only to the the true block of the if clause that use this function.
 *
 * @param {TypeGeoviewLayerConfig} polymorphic object to test in order to determine if the type ascention is valid
 *
 * @return {boolean} true if the type ascention is valid
 */
export const layerConfigIsOgcFeature = (verifyIfLayer: TypeGeoviewLayerConfig): verifyIfLayer is TypeOgcFeatureLayer => {
  return verifyIfLayer.layerType === CONST_LAYER_TYPES.OGC_FEATURE;
};

/* ******************************************************************************************************************************
 * Type Gard function that redefines an AbstractGeoViewLayer as an OgcFeature
 * if the type attribute of the verifyIfGeoViewLayer parameter is OGC_FEATURE. The type ascention
 * applies only to the the true block of the if clause that use this function.
 *
 * @param {AbstractGeoViewLayer} polymorphic object to test in order to determine if the type ascention is valid
 *
 * @return {boolean} true if the type ascention is valid
 */
export const geoviewLayerIsOgcFeature = (verifyIfGeoViewLayer: AbstractGeoViewLayer): verifyIfGeoViewLayer is OgcFeature => {
  return verifyIfGeoViewLayer.type === CONST_LAYER_TYPES.OGC_FEATURE;
};

/**
 * a class to add OGC api feature layer
 *
 * @exports
 * @class OgcFeature
 */
export class OgcFeature extends AbstractGeoViewLayer {
  // layer
  layer!: VectorLayer<VectorSource>;

  // private varibale holding wms capabilities
  #capabilities: TypeJsonObject = {};

  // private varibale holding wms paras
  #version = '2.0.0';

  /**
   * Initialize layer
   *
   * @param {string} mapId the id of the map
   * @param {TypeOgcFeatureLayer} layerConfig the layer configuration
   */
  constructor(mapId: string, layerConfig: TypeOgcFeatureLayer) {
    super(CONST_LAYER_TYPES.OGC_FEATURE, layerConfig, mapId);

    this.entries = layerConfig.layerEntries.map((item) => item.id);
  }

  /**
   * Add a OGC API feature layer to the map.
   *
   * @param {TypeOgcFeatureLayer} layer the layer configuration
   *
   * @return {Promise<VectorLayer<VectorSource> | null>} layers to add to the map
   */
  async add(layer: TypeOgcFeatureLayer): Promise<VectorLayer<VectorSource> | null> {
    const rootUrl = this.url.slice(-1) === '/' ? this.url : `${this.url}/`;

    const featureUrl = `${rootUrl}collections/${this.entries}/items?f=json`;
    const metaUrl = `${rootUrl}collections/${this.entries}?f=json`;

    const res = await axios.get<TypeJsonObject>(metaUrl);
    this.#capabilities = res.data;

    const layerName = layer.name ? layer.name[api.map(this.mapId).getLanguageCode()] : (this.#capabilities.title as string);
    if (layerName) this.name = layerName;

    const style: Record<string, Style> = {
      Polygon: defaultLinePolygonStyle,
      LineString: defaultLineStringStyle,
      Point: defaultCircleMarkerStyle,
    };

    const getResponse = await axios.get<VectorLayer<VectorSource> | string>(featureUrl);

    const geo = new Promise<VectorLayer<VectorSource> | null>((resolve) => {
      const attribution = (this.#capabilities && this.#capabilities.description ? this.#capabilities.description : '') as string;

      const vectorSource = new VectorSource({
        attributions: [attribution],
        loader: (extent, resolution, projection, success, failure) => {
          // TODO check for failure of getResponse then call failure
          const features = new GeoJSONFormat().readFeatures(getResponse.data, {
            extent,
            featureProjection: projection,
          });
          if (features.length > 0) {
            vectorSource.addFeatures(features);
          }
          if (success) success(features);
        },
        strategy: all,
      });

      const ogcFeatureLayer = new VectorLayer({
        source: vectorSource,
        style: (feature) => {
          const geometryType = feature.getGeometry()?.getType();

          return style[geometryType] ? style[geometryType] : defaultSelectStyle;
        },
      });

      resolve(ogcFeatureLayer);
    });

    return geo;
  }

  /**
   * Get feature type info of a given entry
   * @param {object} featureTypeList feature type list
   * @param {string} entries names(comma delimited) to check
   * @returns {TypeJsonValue | null} feature type object or null
   */
  private getFeatureTypeInfo(featureTypeList: TypeJsonObject, entries?: string): TypeJsonObject | null {
    const res = null;

    if (Array.isArray(featureTypeList)) {
      const featureTypeArray = featureTypeList as TypeJsonArray;
      for (let i = 0; i < featureTypeArray.length; i += 1) {
        let fName = featureTypeArray[i].Name['#text'] as string;
        const fNameSplit = fName.split(':');
        fName = fNameSplit.length > 1 ? fNameSplit[1] : fNameSplit[0];

        if (entries) {
          const entrySplit = entries.split(':');
          const entryName = entrySplit.length > 1 ? entrySplit[1] : entrySplit[0];

          if (entryName === fName) {
            return featureTypeArray[i];
          }
        }
      }
    } else {
      let fName = featureTypeList.Name && (featureTypeList.Name['#text'] as string);

      if (fName) {
        const fNameSplit = fName.split(':');
        fName = fNameSplit.length > 1 ? fNameSplit[1] : fNameSplit[0];

        if (entries) {
          const entrySplit = entries.split(':');
          const entryName = entrySplit.length > 1 ? entrySplit[1] : entrySplit[0];

          if (entryName === fName) {
            return featureTypeList;
          }
        }
      }
    }

    return res;
  }

  /**
   * Get capabilities of the current WFS service
   *
   * @returns {TypeJsonObject} WFS capabilities in json format
   */
  getMeta = (): TypeJsonValue => {
    return this.#capabilities;
  };

  /**
   * Set Layer Opacity
   * @param {number} opacity layer opacity
   */
  setOpacity = (opacity: number) => {
    this.layer?.setOpacity(opacity);
  };

  /**
   * Get bounds
   *
   * @returns {Extent} layer bounds
   */
  getBounds = (): Extent => {
    const transformedExtent = transformExtent(
      this.layer?.getSource()?.getExtent() || [],
      api.projection.projections[api.map(this.mapId).currentProjection],
      'EPSG:4326'
    );

    return transformedExtent || [];
  };
}
