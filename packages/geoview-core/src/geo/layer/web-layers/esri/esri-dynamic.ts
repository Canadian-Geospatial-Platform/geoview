import axios from 'axios';

import { ImageArcGISRest } from 'ol/source';
import { Image as ImageLayer } from 'ol/layer';
import { extend, Extent } from 'ol/extent';

import { getXMLHttpRequest } from '../../../../core/utils/utilities';
import {
  AbstractWebLayersClass,
  CONST_LAYER_TYPES,
  TypeDynamicLayer,
  TypeJsonObject,
  TypeJsonArray,
  TypeLegendJsonDynamic,
  TypeBaseWebLayersConfig,
} from '../../../../core/types/cgpv-types';

import { api } from '../../../../app';

/* ******************************************************************************************************************************
 * Type Gard function that redefines a TypeBaseWebLayersConfig as a TypeDynamicLayer
 * if the layerType attribute of the verifyIfLayer parameter is ESRI_DYNAMIC. The type ascention
 * applies only to the the true block of the if clause that use this function.
 *
 * @param {TypeBaseWebLayersConfig} polymorphic object to test in order to determine if the type ascention is valid
 *
 * @return {boolean} true if the type ascention is valid
 */
export const layerConfigIsEsriDynamic = (verifyIfLayer: TypeBaseWebLayersConfig): verifyIfLayer is TypeDynamicLayer => {
  return verifyIfLayer.layerType === CONST_LAYER_TYPES.ESRI_DYNAMIC;
};

/* ******************************************************************************************************************************
 * Type Gard function that redefines an AbstractWebLayersClass as an EsriDynamic
 * if the type attribute of the verifyIfWebLayer parameter is ESRI_DYNAMIC. The type ascention
 * applies only to the the true block of the if clause that use this function.
 *
 * @param {AbstractWebLayersClass} polymorphic object to test in order to determine if the type ascention is valid
 *
 * @return {boolean} true if the type ascention is valid
 */
export const webLayerIsEsriDynamic = (verifyIfWebLayer: AbstractWebLayersClass): verifyIfWebLayer is EsriDynamic => {
  return verifyIfWebLayer.type === CONST_LAYER_TYPES.ESRI_DYNAMIC;
};

/**
 * a class to add esri dynamic layer
 *
 * @exports
 * @class EsriDynamic
 */
export class EsriDynamic extends AbstractWebLayersClass {
  // layer
  layer: ImageLayer<ImageArcGISRest> | null = null;

  /**
   * Initialize layer
   * @param {string} mapId the id of the map
   * @param {TypeDynamicLayer} layerConfig the layer configuration
   */
  constructor(mapId: string, layerConfig: TypeDynamicLayer) {
    super(CONST_LAYER_TYPES.ESRI_DYNAMIC, layerConfig, mapId);

    const entries = layerConfig.layerEntries.map((item) => item.index);
    this.entries = entries?.filter((item) => !Number.isNaN(item));
  }

  /**
   * Add a ESRI dynamic layer to the map.
   *
   * @param {TypeDynamicLayer} layer the layer configuration
   * @return {Promise<ImageLayer<ImageArcGISRest> | null>} layers to add to the map
   */
  add(layer: TypeDynamicLayer): Promise<ImageLayer<ImageArcGISRest> | null> {
    const data = getXMLHttpRequest(`${layer.url[api.map(this.mapId).getLanguageCode()]}?f=json`);

    const geo = new Promise<ImageLayer<ImageArcGISRest> | null>((resolve) => {
      data.then((value) => {
        if (value !== '{}') {
          const feature = new ImageLayer({
            source: new ImageArcGISRest({
              url: layer.url[api.map(this.mapId).getLanguageCode()],
              params: { LAYERS: `show:${this.entries}` },
            }),
          });

          resolve(feature);
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
   * @returns {TypeJsonValue} legend configuration in json format
   */
  getLegendJson = (): Promise<TypeJsonArray> => {
    let queryUrl = this.url.substr(-1) === '/' ? this.url : `${this.url}/`;
    queryUrl += 'legend?f=pjson';

    return axios.get<TypeJsonObject>(queryUrl).then<TypeJsonArray>((res) => {
      const { data } = res;

      if (this.entries && this.entries.length > 0) {
        const result = (data.layers as TypeJsonArray).filter((item) => {
          const layerId = item.layerId as string;

          return (this.entries as string[])?.includes(layerId) as TypeJsonArray;
        });
        return result as TypeJsonArray;
      }
      return data.layers as TypeJsonArray;
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
   * Fetch the bounds for an entry
   *
   * @param {number} entry
   * @returns {TypeJsonValue} the result of the fetch
   */
  private getEntry = async (entry: number): Promise<TypeLegendJsonDynamic> => {
    const response = await fetch(`${this.url}/${entry}?f=json`);
    const meta = await response.json();

    return meta;
  };

  /**
   * Get bounds through external metadata
   *
   * @returns {Promise<Extent>} layer bounds
   */
  getBounds = async (): Promise<Extent> => {
    // eslint-disable-next-line no-async-promise-executor
    let bounds: Extent | undefined;

    if (this.entries) {
      for (let entryIndex = 0; entryIndex < this.entries.length; entryIndex++) {
        const entry = this.entries[entryIndex] as number;

        // eslint-disable-next-line no-await-in-loop
        const meta = await this.getEntry(entry);

        const { xmin, xmax, ymin, ymax } = meta.extent;

        if (!bounds) bounds = [xmin, ymin, xmax, ymax];

        bounds = extend(bounds, [xmin, ymin, xmax, ymax]);
      }
    }

    return bounds || [];
  };

  /**
   * Sets Layer entries to toggle sublayers
   *
   * @param entries MapServer layer IDs
   */
  setEntries = (entries: number[]) => {
    this.layer?.setSource(
      new ImageArcGISRest({
        url: this.url,
        params: { LAYERS: `show:${entries}` },
      })
    );

    this.layer?.changed();
  };
}
