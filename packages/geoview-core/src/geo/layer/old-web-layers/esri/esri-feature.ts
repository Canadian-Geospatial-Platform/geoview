import axios from 'axios';

import Feature from 'ol/Feature';
import { Vector as VectorSource } from 'ol/source';
import { VectorImage as VectorLayer } from 'ol/layer';
import { EsriJSON } from 'ol/format';
import { Icon as StyleIcon, Style } from 'ol/style';
import { StyleLike } from 'ol/style/Style';
import { all } from 'ol/loadingstrategy';
import { Extent } from 'ol/extent';
import { Pixel } from 'ol/pixel';
import { transformExtent } from 'ol/proj';

import {
  AbstractGeoViewLayer,
  CONST_LAYER_TYPES,
  TypeFeatureLayer,
  TypeJsonValue,
  TypeJsonObject,
  TypeJsonArray,
  toJsonObject,
  TypeBaseGeoViewLayersConfig,
} from '../../../../core/types/cgpv-types';
import { getXMLHttpRequest } from '../../../../core/utils/utilities';
import { blueCircleIcon } from '../../../../core/types/marker-definitions';

import { api } from '../../../../app';

/* ******************************************************************************************************************************
 * Type Gard function that redefines a TypeBaseGeoViewLayersConfig as a TypeFeatureLayer
 * if the layerType attribute of the verifyIfLayer parameter is ESRI_FEATURE. The type ascention
 * applies only to the the true block of the if clause that use this function.
 *
 * @param {TypeBaseGeoViewLayersConfig} polymorphic object to test in order to determine if the type ascention is valid
 *
 * @return {boolean} true if the type ascention is valid
 */
export const layerConfigIsEsriFeature = (verifyIfLayer: TypeBaseGeoViewLayersConfig): verifyIfLayer is TypeFeatureLayer => {
  return verifyIfLayer.layerType === CONST_LAYER_TYPES.ESRI_FEATURE;
};

/* ******************************************************************************************************************************
 * Type Gard function that redefines an AbstractGeoViewLayer as an EsriFeature
 * if the type attribute of the verifyIfWebLayer parameter is ESRI_FEATURE. The type ascention
 * applies only to the the true block of the if clause that use this function.
 *
 * @param {AbstractGeoViewLayer} polymorphic object to test in order to determine if the type ascention is valid
 *
 * @return {boolean} true if the type ascention is valid
 */
export const webLayerIsEsriFeature = (verifyIfWebLayer: AbstractGeoViewLayer): verifyIfWebLayer is EsriFeature => {
  return verifyIfWebLayer.type === CONST_LAYER_TYPES.ESRI_FEATURE;
};

/**
 * a class to add esri feature layer
 *
 * @exports
 * @class EsriFeature
 */
export class EsriFeature extends AbstractGeoViewLayer {
  // layer
  layer!: VectorLayer<VectorSource>;

  /**
   * Initialize layer
   *
   * @param {string} mapId the id of the map
   * @param {TypeFeatureLayer} layerConfig the layer configuration
   */
  constructor(mapId: string, layerConfig: TypeFeatureLayer) {
    super(CONST_LAYER_TYPES.ESRI_FEATURE, layerConfig, mapId);
  }

  /**
   * Add a ESRI feature layer to the map.
   *
   * @param {TypeFeatureLayer} layer the layer configuration
   * @return {Promise<VectorLayer<VectorSource> | null>} layers to add to the map
   */
  async add(layer: TypeFeatureLayer): Promise<VectorLayer<VectorSource> | null> {
    let queryUrl = this.url.substr(-1) === '/' ? this.url : `${this.url}/`;
    queryUrl += 'legend?f=pjson';
    // define a default blue icon
    const iconSymbols: { field: string | null; valueAndSymbol: Record<string, StyleIcon> } = {
      field: null,
      valueAndSymbol: { default: blueCircleIcon },
    };

    const res = await axios.get<TypeJsonObject>(queryUrl);

    const renderer = res.data.drawingInfo && res.data.drawingInfo.renderer;
    if (renderer) {
      if (renderer.type === 'uniqueValue') {
        iconSymbols.field = renderer.field1 as string;
        (renderer.uniqueValueInfos as TypeJsonArray).forEach((symbolInfo) => {
          iconSymbols.valueAndSymbol[symbolInfo.value as string] = new StyleIcon({
            src: `data:${symbolInfo.symbol.contentType};base64,${symbolInfo.symbol.imageData}`,
            scale: (symbolInfo.symbol.height as number) / (symbolInfo.symbol.width as number),
            // anchor: [Math.round((symbolInfo.symbol.width as number) / 2), Math.round((symbolInfo.symbol.height as number) / 2)],
          });
        });
      } else if (renderer.symbol) {
        const symbolInfo = renderer.symbol;
        iconSymbols.valueAndSymbol.default = new StyleIcon({
          src: `data:${symbolInfo.contentType};base64,${symbolInfo.imageData}`,
          scale: (symbolInfo.height as number) / (symbolInfo.width as number),
          // anchor: [Math.round((symbolInfo.width as number) / 2), Math.round((symbolInfo.height as number) / 2)],
        });
      }
    }

    const data = getXMLHttpRequest(`${layer.url[api.map(this.mapId).getLanguageCode()]}?f=json`);

    const geo = new Promise<VectorLayer<VectorSource> | null>((resolve) => {
      data.then(async (value) => {
        if (value !== '{}') {
          const { type, copyrightText } = toJsonObject(JSON.parse(value));

          const attribution = copyrightText ? (copyrightText as string) : '';

          // check if the type is define as Feature Layer. If the entrie is bad, it will request the whole service
          // if the path is bad, return will be {}
          if (typeof type !== 'undefined' && type === 'Feature Layer') {
            const serviceUrl = this.url.substr(-1) === '/' ? this.url : `${this.url}/query?f=pjson&outfields=*&where=1%3D1`;

            const esrijsonFormat = new EsriJSON();

            const response = (await axios.get(serviceUrl)).data;

            const vectorSource = new VectorSource({
              attributions: [attribution],
              loader: (extent, resolution, projection, success, failure) => {
                if (response.error) {
                  if (failure) failure();
                } else {
                  // dataProjection will be read from document
                  const features = esrijsonFormat.readFeatures(response, {
                    extent,
                    featureProjection: projection,
                  });

                  if (features.length > 0) {
                    vectorSource.addFeatures(features);
                  }

                  if (success) success(features);
                }
              },
              // url: serviceUrl,
              strategy: all,
            });

            const featureStyle = (feature: Feature) => {
              const featureProperties = feature.getProperties();

              const iconToUse =
                iconSymbols.field && featureProperties[iconSymbols.field] in iconSymbols.valueAndSymbol
                  ? iconSymbols.valueAndSymbol[featureProperties[iconSymbols.field]]
                  : iconSymbols.valueAndSymbol.default;

              const style = new Style({
                image: iconToUse,
              });

              // add style to feature
              feature.setStyle(style);

              return style;
            };

            const feature = new VectorLayer({
              source: vectorSource,
              style: featureStyle as StyleLike,
            });

            const featureHover = (pixel: Pixel) => {
              const featureAtPixel = api.map(this.mapId).map.forEachFeatureAtPixel(pixel, (featurePixel) => {
                return featurePixel;
              });

              if (featureAtPixel) {
                api.map(this.mapId).map.getTargetElement().style.cursor = 'pointer';
              } else {
                api.map(this.mapId).map.getTargetElement().style.cursor = '';
              }
            };

            api.map(this.mapId).map.on('pointermove', (evt) => {
              if (evt.dragging) {
                return;
              }
              const pixel = api.map(this.mapId).map.getEventPixel(evt.originalEvent);

              featureHover(pixel);
            });

            resolve(feature);
          } else {
            resolve(null);
          }
        } else {
          resolve(null);
        }
      });
    });

    return geo;
  }

  /**
   * Get metadata of the current service
   *
   @returns {Promise<TypeJsonValue>} a json promise containing the result of the query
   */
  getMetadata = async (): Promise<TypeJsonObject> => {
    const response = await fetch(`${this.url}?f=json`);
    const result: TypeJsonObject = await response.json();

    return result;
  };

  /**
   * Get legend configuration of the current layer
   *
   * @returns {Promise<TypeJsonValue> } legend configuration in json format
   */
  getLegendJson = (): Promise<TypeJsonValue> => {
    let queryUrl = this.url.substr(-1) === '/' ? this.url : `${this.url}/`;
    queryUrl += 'legend?f=pjson';
    return axios.get(queryUrl).then((res) => {
      return res.data;
    });
  };

  /**
   * Set Layer Opacity
   * @param {number} opacity layer opacity
   */
  setOpacity = (opacity: number) => {
    this.layer?.setOpacity(opacity);
  };

  /**
   * Get bounds through external metadata
   *
   * @returns {Promise<Extent>} layer bounds
   */
  getBounds = async (): Promise<Extent> => {
    const transformedExtent = transformExtent(
      this.layer?.getSource()?.getExtent() || [],
      api.projection.projections[api.map(this.mapId).currentProjection],
      'EPSG:4326'
    );

    return transformedExtent || [];
  };
}
