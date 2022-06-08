import axios from 'axios';

import L from 'leaflet';

import { Extent } from 'ol/extent';

import { mapService as esriMapService, MapService } from 'esri-leaflet';

import WMSCapabilities from 'wms-capabilities';

import { getXMLHttpRequest, xmlToJson } from '../../../../core/utils/utilities';
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

// TODO: this needs cleaning some layer type like WMS are part of react-leaflet and can be use as a component

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

  // layer from leaflet
  layer: L.TileLayer.WMS | null = null;

  // mapService property
  mapService: MapService;

  // private varibale holding wms capabilities
  #capabilities: TypeJsonObject = {};

  // private varibale holding wms paras
  #wmsParams?: L.WMSParams;

  /**
   * Initialize layer
   * @param {string} mapId the id of the map
   * @param {TypeWMSLayer} layerConfig the layer configuration
   */
  constructor(mapId: string, layerConfig: TypeWMSLayer) {
    super(CONST_LAYER_TYPES.WMS, layerConfig, mapId);

    this.url = this.url.indexOf('?') === -1 ? `${this.url}?` : this.url;

    this.entries = layerConfig.layerEntries.map((item) => item.id);

    this.mapService = esriMapService({
      url: api.geoUtilities.getMapServerUrl(layerConfig.url[api.map(this.mapId).getLanguageCode()], true),
    });
  }

  /**
   * Add a WMS layer to the map.
   *
   * @param {TypeWMSLayer} layer the layer configuration
   * @return {Promise<Layer | null>} layers to add to the map
   */
  add(layer: TypeWMSLayer): Promise<L.TileLayer.WMS | null> {
    // TODO: only work with a single layer value, parse the entries and create new layer for each of the entries
    // TODO: in the legend regroup these layers

    const entries = layer.layerEntries.map((item) => item.id).toString();

    const capUrl = `${this.url}service=WMS&version=1.3.0&request=GetCapabilities&layers=${entries}`;

    const data = getXMLHttpRequest(capUrl);

    const geo = new Promise<L.TileLayer.WMS | null>((resolve) => {
      data.then((value) => {
        if (value !== '{}') {
          // check if entries exist
          let isValid = true;

          // parse the xml string and convert to json
          this.#capabilities = new WMSCapabilities(value).toJSON();

          isValid = this.validateEntries(this.#capabilities.Capability.Layer, entries);

          this.name = layer.name ? layer.name[api.map(this.mapId).getLanguageCode()] : (this.#capabilities.Service.Name as string);

          if (isValid) {
            const wms = L.tileLayer.wms(layer.url[api.map(this.mapId).getLanguageCode()], {
              layers: entries,
              format: 'image/png',
              transparent: true,
              attribution: '',
              version: this.#capabilities.version as string,
            });
            this.#wmsParams = wms.wmsParams;

            resolve(wms);
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
   * Check if the entries we try to create a layer exist in the getCapabilities layer object
   * @param {object} layer layer of capability of a WMS object
   * @param {string} entries names(comma delimited) to check
   * @returns {boolean} entry is valid
   */
  private validateEntries(layer: TypeJsonObject, entries: string): boolean {
    let isValid = true;
    // eslint-disable-next-line no-prototype-builtins

    // Added support of multiple entries
    const allNames = this.findAllByKey(layer, 'Name');

    const entryArray = entries.split(',').map((s) => s.trim()) as TypeJsonArray;
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
  private findAllByKey(obj: { [key: string]: TypeJsonObject }, keyToFind: string): TypeJsonArray {
    const reduceFunction = (accumulator: TypeJsonArray, [key, value]: [string, TypeJsonObject]): TypeJsonArray => {
      if (key === keyToFind) {
        return accumulator.concat(value);
      }
      if (typeof value === 'object') {
        return accumulator.concat(this.findAllByKey(value, keyToFind));
      }
      return accumulator;
    };

    if (obj) {
      return Object.entries(obj).reduce(reduceFunction, []);
    }
    return [];
  }

  /**
   * Get capabilities of the current WMS service
   *
   * @returns {TypeJsonObject} WMS capabilities in json format
   */
  getCapabilities = (): TypeJsonObject => {
    return this.#capabilities;
  };

  /**
   * Get the legend image of a layer from the capabilities. Return null if it does not exist,,
   *
   * @returns {TypeJsonObject | null} URL of a Legend image in png format or null
   */
  getLegendUrlFromCapabilities = (): TypeJsonObject | null => {
    const layerNames = this.layer!.options.layers!.split(',');
    let legendUrl = null;
    (this.#capabilities.Capability.Layer.Layer as TypeJsonArray).forEach((currentLayer) => {
      if (layerNames.includes(currentLayer.Name as string) && currentLayer.Style) {
        (currentLayer.Style as TypeJsonArray).forEach((currentStyle) => {
          if (currentStyle.LegendURL) {
            (currentStyle.LegendURL as TypeJsonArray).forEach((currentLegend) => {
              if (currentLegend.Format === 'image/png') legendUrl = currentLegend;
            });
          }
        });
      }
    });
    return legendUrl;
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

    const legendUrlFromCapabilities = this.getLegendUrlFromCapabilities();
    let legendUrl: string;
    if (legendUrlFromCapabilities) {
      legendUrl = legendUrlFromCapabilities.OnlineResource as string;
    } else {
      legendUrl = `${this.url}service=WMS&version=1.3.0&request=GetLegendGraphic&FORMAT=image/png&layer=${this.entries}`;
    }
    const response = await axios.get<TypeJsonObject>(legendUrl, { responseType: 'blob' });
    return readAsyncFile(Cast<Blob>(response.data));
  };

  /**
   * Get feature info given a latlng
   *
   * @param {L.LatLng} latlng lat/lng coordinates received on any interaction with the map
   * @param {L.Map} map the map odject
   * @param {number} featureCount the map odject
   *
   * @returns {Promise<TypeJsonArray | null>} a promise that returns the feature info in a json format
   */
  getFeatureInfo = async (latlng: L.LatLng, map: L.Map, featureCount = 10): Promise<TypeJsonArray | null> => {
    let infoFormat = 'text/xml';

    if (this.#capabilities.Capability.Request.GetFeatureInfo) {
      const formatArray = this.#capabilities.Capability.Request.GetFeatureInfo.Format;
      if ((formatArray as string[]).includes('application/geojson')) infoFormat = 'application/geojson';
    }

    const params = this.getFeatureInfoParams(latlng, map);
    (params.info_format as string) = infoFormat;
    (params.feature_count as number) = featureCount;

    const response = await axios.get<TypeJsonObject>(this.url, { params });

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

  /**
   * Get the parameters used to query feature info url from a lat lng point
   *
   * @param {LatLng} latlng a latlng point to generate the feature url from
   * @param {L.Map} map the map odject
   * @returns the map service url including the feature query
   */
  private getFeatureInfoParams(latlng: L.LatLng, map: L.Map): TypeJsonObject {
    const point = map.latLngToContainerPoint(latlng);

    const size = map.getSize();

    const { crs } = map.options;

    // these are the SouthWest and NorthEast points
    // projected from LatLng into used crs
    const sw = crs!.project(map.getBounds().getSouthWest());
    const ne = crs!.project(map.getBounds().getNorthEast());

    const params = toJsonObject({
      request: 'GetFeatureInfo',
      service: 'WMS',
      version: this.#wmsParams!.version!,
      layers: this.#wmsParams!.layers!,
      query_layers: this.#wmsParams!.layers,
      height: size.y,
      width: size.x,
    });

    // Define version-related request parameters.
    const version = window.parseFloat(this.#wmsParams!.version!);
    (params[version >= 1.3 ? 'crs' : 'srs'] as string) = crs!.code!;
    (params.bbox as string) = `${sw.x},${sw.y},${ne.x},${ne.y}`;
    (params.bbox as string) =
      version >= 1.3 && crs!.code === 'EPSG:4326' ? `${sw.y},${sw.x},${ne.y},${ne.x}` : `${sw.x},${sw.y},${ne.x},${ne.y}`;
    (params[version >= 1.3 ? 'i' : 'x'] as number) = point.x;
    (params[version >= 1.3 ? 'j' : 'y'] as number) = point.y;

    return params;
  }

  /**
   * Set Layer Opacity
   * @param {number} opacity layer opacity
   */
  setOpacity = (opacity: number) => {
    this.layer!.setOpacity(opacity);
  };

  /**
   * Get bounds through Leaflet built-in functions
   *
   * @returns {Extent} layer bounds
   */
  getBounds = (): Extent => {
    const capabilities = this.getCapabilities();
    const bbox = Cast<[number, number, number, number]>(capabilities.Capability.Layer.EX_GeographicBoundingBox);
    const [xmin, ymin, xmax, ymax] = bbox;
    return [xmin, ymin, xmax, ymax];
  };
}
