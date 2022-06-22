/* eslint-disable @typescript-eslint/no-inferrable-types */
import axios from 'axios';

import { Coordinate } from 'ol/coordinate';
import ImageLayer from 'ol/layer/Image';
import { ImageWMS } from 'ol/source';
import { Extent } from 'ol/extent';
import WMSCapabilities from 'ol/format/WMSCapabilities';

import { xmlToJson } from '../../../../core/utils/utilities';
import {
  Cast,
  CONST_LAYER_TYPES,
  AbstractWebLayersClass,
  TypeJsonObject,
  TypeWMSLayer,
  TypeJsonArray,
  toJsonObject,
  TypeBaseWebLayersConfig,
} from '../../../../core/types/cgpv-types';

import { api } from '../../../../app';

/* ******************************************************************************************************************************
 * Type Gard function that redefines a TypeBaseWebLayersConfig as a TypeWMSLayer
 * if the layerType attribute of the verifyIfLayer parameter is WMS. The type ascention
 * applies only to the the true block of the if clause that use this function.
 *
 * @param {TypeBaseWebLayersConfig} polymorphic object to test in order to determine if the type ascention is valid
 *
 * @return {boolean} true if the type ascention is valid
 */
export const layerConfigIsWMS = (verifyIfLayer: TypeBaseWebLayersConfig): verifyIfLayer is TypeWMSLayer => {
  return verifyIfLayer.layerType === CONST_LAYER_TYPES.WMS;
};

/* ******************************************************************************************************************************
 * Type Gard function that redefines an AbstractWebLayersClass as a WMS
 * if the type attribute of the verifyIfWebLayer parameter is WMS. The type ascention
 * applies only to the the true block of the if clause that use this function.
 *
 * @param {AbstractWebLayersClass} polymorphic object to test in order to determine if the type ascention is valid
 *
 * @return {boolean} true if the type ascention is valid
 */
export const webLayerIsWMS = (verifyIfWebLayer: AbstractWebLayersClass): verifyIfWebLayer is WMS => {
  return verifyIfWebLayer.type === CONST_LAYER_TYPES.WMS;
};

/**
 * a class to add wms layer
 *
 * @exports
 * @class WMS
 */
export class WMS extends AbstractWebLayersClass {
  // TODO: try to avoid getCapabilities for WMS. Use Web Presence metadata return info to store, legend image link, layer name, and other needed properties.
  // ! This will maybe not happen because geoCore may not everything we need. We may have to use getCap
  // * We may have to do getCapabilites if we want to add layers not in the catalog
  // map config properties

  // layer from openlayers
  layer!: ImageLayer<ImageWMS>;

  // private varibale holding wms capabilities
  #capabilities: TypeJsonObject = {};

  /**
   * Initialize layer
   * @param {string} mapId the id of the map
   * @param {TypeWMSLayer} layerConfig the layer configuration
   */
  constructor(mapId: string, layerConfig: TypeWMSLayer) {
    super(CONST_LAYER_TYPES.WMS, layerConfig, mapId);

    this.url = this.url.indexOf('?') === -1 ? `${this.url}?` : this.url;

    this.entries = layerConfig.layerEntries.map((item) => item.id);
  }

  /**
   * Add a WMS layer to the map.
   *
   * @param {TypeWMSLayer} layer the layer configuration
   * @return {Promise<ImageLayer<ImageWMS> | null>} layers to add to the map
   */
  add(layer: TypeWMSLayer): Promise<ImageLayer<ImageWMS> | null> {
    // TODO: only work with a single layer value, parse the entries and create new layer for each of the entries
    // TODO: in the legend regroup these layers

    const entries = layer.layerEntries.map((item) => item.id).toString();

    this.getCapabilities();

    const geo = new Promise<ImageLayer<ImageWMS> | null>((resolve) => {
      this.name = layer.name ? layer.name[api.map(this.mapId).getLanguageCode()] : (this.#capabilities.Service.Name as string);

      const wms = new ImageLayer({
        source: new ImageWMS({
          url: this.url,
          params: { LAYERS: entries },
        }),
      });

      resolve(wms);
    });
    return geo;
  }

  /**
   * Get capabilities of the current WMS service
   *
   * @returns {TypeJsonObject} WMS capabilities in json format
   */
  getCapabilities = async (): Promise<TypeJsonObject> => {
    const parser = new WMSCapabilities();

    const capUrl = `${this.url}service=WMS&version=1.3.0&request=GetCapabilities&layers=${this.entries}`;

    const response = await fetch(capUrl);

    const result = parser.read(await response.text());

    this.#capabilities = result;

    return result;
  };

  /**
   * Get the legend image of a layer from the capabilities. Return undefined if it does not exist
   *
   * @returns {string | undefined} URL of a Legend image in png format or undefined
   */
  getLegendUrl = (): string | undefined => {
    return this.layer?.getSource()?.getLegendUrl(api.map(this.mapId).map.getView().getResolution(), {
      LAYERS: this.entries,
    });
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

    let legendUrl = this.getLegendUrl();

    if (!legendUrl) {
      legendUrl = `${this.url}service=WMS&version=1.3.0&request=GetLegendGraphic&FORMAT=image/png&layer=${this.entries}`;
    }

    const response = await axios.get<TypeJsonObject>(legendUrl, { responseType: 'blob' });

    return readAsyncFile(Cast<Blob>(response.data));
  };

  /**
   * Get feature info given a latlng
   *
   * @param {Coordinate} lnglat lat/lng coordinates received on any interaction with the map
   * @param {number} featureCount feature count to return
   *
   * @returns {Promise<TypeJsonArray | null>} a promise that returns the feature info in a json format
   */
  getFeatureInfo = async (lnglat: Coordinate, featureCount: number = 10): Promise<TypeJsonArray | null> => {
    let infoFormat = 'text/xml';

    if (this.#capabilities.Capability.Request.GetFeatureInfo) {
      const formatArray = this.#capabilities.Capability.Request.GetFeatureInfo.Format;
      if ((formatArray as string[]).includes('application/geojson')) infoFormat = 'application/geojson';
    }

    const featureUrl = this.layer
      ?.getSource()
      ?.getFeatureInfoUrl(
        lnglat,
        api.map(this.mapId).map.getView().getResolution()!,
        api.projection.projections[api.map(this.mapId).currentProjection],
        {
          LAYERS: this.entries,
          info_format: infoFormat,
          feature_count: featureCount,
        }
      );

    const response = await axios.get<TypeJsonObject>(featureUrl!);

    if (infoFormat === 'application/geojson') {
      const dataFeatures = response.data.features as TypeJsonArray;

      if (dataFeatures.length > 0) {
        const results: TypeJsonArray = [];
        dataFeatures.forEach((jsonValue) => {
          const element = jsonValue;
          results.push(
            toJsonObject({
              attributes: element.properties,
              geometry: element.geometry,
              layerId: this.id,
              layerName: element.layerName,
              // displayFieldName: "OBJECTID",
              // value: element.properties.OBJECTID,
              geometryType: element.type,
            })
          );
        });

        return results;
      }
      return null;
    }

    const featureInfoResponse = xmlToJson(response.request.responseXML).FeatureInfoResponse;

    if (featureInfoResponse && featureInfoResponse.FIELDS) {
      const results: TypeJsonArray = [];
      // only one feature
      if (featureInfoResponse.FIELDS['@attributes']) {
        results.push(
          toJsonObject({
            attributes: featureInfoResponse.FIELDS['@attributes'],
            geometry: null,
            layerId: this.id,
            layerName: this.name,
            // displayFieldName: "OBJECTID",
            // value: element.properties.OBJECTID,
            geometryType: null,
          })
        );
      } else {
        const arrayOfFeature = featureInfoResponse.FIELDS as TypeJsonArray;
        arrayOfFeature.forEach((element) => {
          results.push(
            toJsonObject({
              attributes: element['@attributes'],
              geometry: null,
              layerId: this.id,
              layerName: this.name,
              // displayFieldName: "OBJECTID",
              // value: element.properties.OBJECTID,
              geometryType: null,
            })
          );
        });
      }

      return results;
    }
    return null;
  };

  // /**
  //  * Get the parameters used to query feature info url from a lat lng point
  //  *
  //  * @param {LatLng} latlng a latlng point to generate the feature url from
  //  * @param {L.Map} map the map odject
  //  * @returns the map service url including the feature query
  //  */
  // private getFeatureInfoParams(latlng: L.LatLng, map: L.Map): TypeJsonObject {
  //   const point = map.latLngToContainerPoint(latlng);

  //   const size = map.getSize();

  //   const { crs } = map.options;

  //   // these are the SouthWest and NorthEast points
  //   // projected from LatLng into used crs
  //   const sw = crs!.project(map.getBounds().getSouthWest());
  //   const ne = crs!.project(map.getBounds().getNorthEast());

  //   const params = toJsonObject({
  //     request: 'GetFeatureInfo',
  //     service: 'WMS',
  //     version: this.#wmsParams!.version!,
  //     layers: this.#wmsParams!.layers!,
  //     query_layers: this.#wmsParams!.layers,
  //     height: size.y,
  //     width: size.x,
  //   });

  //   // Define version-related request parameters.
  //   const version = window.parseFloat(this.#wmsParams!.version!);
  //   (params[version >= 1.3 ? 'crs' : 'srs'] as string) = crs!.code!;
  //   (params.bbox as string) = `${sw.x},${sw.y},${ne.x},${ne.y}`;
  //   (params.bbox as string) =
  //     version >= 1.3 && crs!.code === 'EPSG:4326' ? `${sw.y},${sw.x},${ne.y},${ne.x}` : `${sw.x},${sw.y},${ne.x},${ne.y}`;
  //   (params[version >= 1.3 ? 'i' : 'x'] as number) = point.x;
  //   (params[version >= 1.3 ? 'j' : 'y'] as number) = point.y;

  //   return params;
  // }

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
   * @returns {Promise<Extent>} layer bounds
   */
  getBounds = async (): Promise<Extent> => {
    const bbox = Cast<[number, number, number, number]>(this.#capabilities.Capability.Layer.EX_GeographicBoundingBox);
    const [xmin, ymin, xmax, ymax] = bbox;
    return [xmin, ymin, xmax, ymax];
  };
}
