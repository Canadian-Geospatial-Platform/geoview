/* eslint-disable no-param-reassign */
import axios from 'axios';
import { ImageArcGISRest } from 'ol/source';
import { Options as SourceOptions } from 'ol/source/ImageArcGISRest';
import { Options as ImageOptions } from 'ol/layer/BaseImage';
import { Image as ImageLayer } from 'ol/layer';
import { Coordinate } from 'ol/coordinate';
import { Pixel } from 'ol/pixel';

import { cloneDeep } from 'lodash';
import { transform, transformExtent } from 'ol/proj';
import { Extent } from 'ol/extent';
import { Cast, TypeJsonArray, TypeJsonObject } from '../../../../core/types/global-types';
import { getLocalizedValue, getXMLHttpRequest } from '../../../../core/utils/utilities';
import { AbstractGeoViewLayer, CONST_LAYER_TYPES } from '../abstract-geoview-layers';
import { AbstractGeoViewRaster, TypeBaseRasterLayer } from './abstract-geoview-raster';
import { EsriBaseRenderer, getStyleFromEsriRenderer } from '../../../renderer/esri-renderer';
import {
  TypeImageLayerEntryConfig,
  TypeLayerEntryConfig,
  TypeSourceImageEsriInitialConfig,
  TypeGeoviewLayerConfig,
  TypeListOfLayerEntryConfig,
  TypeLayerGroupEntryConfig,
  layerEntryIsGroupLayer,
  TypeFeatureInfoLayerConfig,
} from '../../../map/map-schema-types';
import { TypeFeatureInfoEntry, TypeArrayOfRecords } from '../../../../api/events/payloads/get-feature-info-payload';
import { api } from '../../../../app';
import { Layer } from '../../layer';

export interface TypeEsriDynamicLayerEntryConfig extends Omit<TypeImageLayerEntryConfig, 'source'> {
  source: TypeSourceImageEsriInitialConfig;
}

export interface TypeEsriDynamicLayerConfig extends Omit<TypeGeoviewLayerConfig, 'listOfLayerEntryConfig'> {
  geoviewLayerType: 'esriDynamic';
  listOfLayerEntryConfig: TypeEsriDynamicLayerEntryConfig[];
}

/** ******************************************************************************************************************************
 * type guard function that redefines a TypeGeoviewLayerConfig as a TypeEsriDynamicLayerConfig if the geoviewLayerType attribute of
 * the verifyIfLayer parameter is ESRI_DYNAMIC. The type ascention applies only to the true block of the if clause that use
 * this function.
 *
 * @param {TypeGeoviewLayerConfig} verifyIfLayer Polymorphic object to test in order to determine if the type ascention is valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const layerConfigIsEsriDynamic = (verifyIfLayer: TypeGeoviewLayerConfig): verifyIfLayer is TypeEsriDynamicLayerConfig => {
  return verifyIfLayer?.geoviewLayerType === CONST_LAYER_TYPES.ESRI_DYNAMIC;
};

/** ******************************************************************************************************************************
 * type guard function that redefines an AbstractGeoViewLayer as an EsriDynamic if the type attribute of the verifyIfGeoViewLayer
 * parameter is ESRI_DYNAMIC. The type ascention applies only to the true block of the if clause that use this function.
 *
 * @param {AbstractGeoViewLayer} verifyIfGeoViewLayer Polymorphic object to test in order to determine if the type ascention is
 * valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const geoviewLayerIsEsriDynamic = (verifyIfGeoViewLayer: AbstractGeoViewLayer): verifyIfGeoViewLayer is EsriDynamic => {
  return verifyIfGeoViewLayer?.type === CONST_LAYER_TYPES.ESRI_DYNAMIC;
};

/** ******************************************************************************************************************************
 * type guard function that redefines a TypeLayerEntryConfig as a TypeEsriDynamicLayerEntryConfig if the geoviewLayerType attribute
 * of the verifyIfGeoViewEntry.geoviewRootLayer attribute is ESRI_DYNAMIC. The type ascention applies only to the true block of
 * the if clause that use this function.
 *
 * @param {TypeLayerEntryConfig} verifyIfGeoViewEntry Polymorphic object to test in order to determine if the type ascention is
 * valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const geoviewEntryIsEsriDynamic = (
  verifyIfGeoViewEntry: TypeLayerEntryConfig
): verifyIfGeoViewEntry is TypeEsriDynamicLayerEntryConfig => {
  return verifyIfGeoViewEntry?.geoviewRootLayer?.geoviewLayerType === CONST_LAYER_TYPES.ESRI_DYNAMIC;
};

// ******************************************************************************************************************************
// ******************************************************************************************************************************
/** ******************************************************************************************************************************
 * A class to add esri dynamic layer.
 *
 * @exports
 * @class EsriDynamic
 */
// ******************************************************************************************************************************
export class EsriDynamic extends AbstractGeoViewRaster {
  /** Service metadata */
  metadata: TypeJsonObject = {};

  /** ****************************************************************************************************************************
   * Initialize layer.
   * @param {string} mapId The id of the map.
   * @param {TypeEsriDynamicLayerConfig} layerConfig The layer configuration.
   */
  constructor(mapId: string, layerConfig: TypeEsriDynamicLayerConfig) {
    super(CONST_LAYER_TYPES.ESRI_DYNAMIC, layerConfig, mapId);
  }

  /** ***************************************************************************************************************************
   * This method reads the service metadata from the metadataAccessPath.
   *
   * @returns {Promise<void>} A promise that the execution is completed.
   */
  protected getServiceMetadata(): Promise<void> {
    const promisedExecution = new Promise<void>((resolve) => {
      const metadataUrl = getLocalizedValue(this.metadataAccessPath, this.mapId);
      if (metadataUrl) {
        getXMLHttpRequest(`${metadataUrl}?f=json`).then((metadataString) => {
          if (metadataString === '{}')
            throw new Error(`Cant't read service metadata for layer ${this.geoviewLayerId} of map ${this.mapId}.`);
          else {
            this.metadata = JSON.parse(metadataString) as TypeJsonObject;
            const { copyrightText } = this.metadata;
            if (copyrightText) this.attributions.push(copyrightText as string);
            resolve();
          }
        });
      } else throw new Error(`Cant't read service metadata for layer ${this.geoviewLayerId} of map ${this.mapId}.`);
    });
    return promisedExecution;
  }

  /** ***************************************************************************************************************************
   * This method validates recursively the configuration of the layer entries to ensure that it is a feature layer identified
   * with a numeric layerId and creates a group entry when a layer is a group.
   *
   * @param {TypeListOfLayerEntryConfig} listOfLayerEntryConfig The list of layer entries configuration to validate.
   *
   * @returns {TypeListOfLayerEntryConfig} A new list of layer entries configuration with deleted error layers.
   */
  protected validateListOfLayerEntryConfig(listOfLayerEntryConfig: TypeListOfLayerEntryConfig): TypeListOfLayerEntryConfig {
    return listOfLayerEntryConfig.filter((layerEntryConfig: TypeLayerEntryConfig) => {
      if (api.map(this.mapId).layer.isRegistered(layerEntryConfig)) {
        this.layerLoadError.push({
          layer: Layer.getLayerPath(layerEntryConfig),
          consoleMessage: `Duplicate layerPath (mapId: ${this.mapId}, layerPath: ${Layer.getLayerPath(layerEntryConfig)})`,
        });
        return false;
      }

      if (!this.metadata!.supportsDynamicLayers) {
        this.layerLoadError.push({
          layer: Layer.getLayerPath(layerEntryConfig),
          consoleMessage: `Layer ${Layer.getLayerPath(layerEntryConfig)} of map ${this.mapId} does not support dynamic layers.`,
        });
        return false;
      }

      if (layerEntryIsGroupLayer(layerEntryConfig)) {
        layerEntryConfig.listOfLayerEntryConfig = this.validateListOfLayerEntryConfig(layerEntryConfig.listOfLayerEntryConfig!);
        if (layerEntryConfig.listOfLayerEntryConfig.length) {
          api.map(this.mapId).layer.registerLayerConfig(layerEntryConfig);
          return true;
        }
        this.layerLoadError.push({
          layer: Layer.getLayerPath(layerEntryConfig),
          consoleMessage: `Empty layer group (mapId:  ${this.mapId}, layerPath: ${Layer.getLayerPath(layerEntryConfig)})`,
        });
        return false;
      }

      const esriIndex = Number(layerEntryConfig.layerId);
      if (Number.isNaN(esriIndex)) {
        this.layerLoadError.push({
          layer: Layer.getLayerPath(layerEntryConfig),
          consoleMessage: `ESRI layerId must be a number (mapId:  ${this.mapId}, layerPath: ${Layer.getLayerPath(layerEntryConfig)})`,
        });
        return false;
      }

      if (this.metadata?.layers[esriIndex] === undefined) {
        this.layerLoadError.push({
          layer: Layer.getLayerPath(layerEntryConfig),
          consoleMessage: `ESRI layerId not found (mapId:  ${this.mapId}, layerPath: ${Layer.getLayerPath(layerEntryConfig)})`,
        });
        return false;
      }

      if (this.metadata!.layers[esriIndex].type === 'Group Layer') {
        const newListOfLayerEntryConfig: TypeListOfLayerEntryConfig = [];
        (this.metadata!.layers[esriIndex].subLayerIds as TypeJsonArray).forEach((layerId) => {
          const subLayerEntryConfig: TypeLayerEntryConfig = cloneDeep(layerEntryConfig);
          subLayerEntryConfig.parentLayerConfig = Cast<TypeLayerGroupEntryConfig>(layerEntryConfig);
          subLayerEntryConfig.layerId = `${layerId}`;
          subLayerEntryConfig.layerName = {
            en: this.metadata!.layers[layerId as number].name as string,
            fr: this.metadata!.layers[layerId as number].name as string,
          };
          newListOfLayerEntryConfig.push(subLayerEntryConfig);
          api.map(this.mapId).layer.registerLayerConfig(subLayerEntryConfig);
        });
        const switchToGroupLayer = Cast<TypeLayerGroupEntryConfig>(layerEntryConfig);
        switchToGroupLayer.entryType = 'group';
        switchToGroupLayer.layerName = {
          en: this.metadata!.layers[esriIndex].name as string,
          fr: this.metadata!.layers[esriIndex].name as string,
        };
        switchToGroupLayer.isMetadataLayerGroup = true;
        switchToGroupLayer.listOfLayerEntryConfig = newListOfLayerEntryConfig;
        api.map(this.mapId).layer.registerLayerConfig(layerEntryConfig);
        return true;
      }

      layerEntryConfig.layerName = {
        en: this.metadata!.layers[esriIndex].name as string,
        fr: this.metadata!.layers[esriIndex].name as string,
      };
      api.map(this.mapId).layer.registerLayerConfig(layerEntryConfig);
      return true;
    });
  }

  /** ***************************************************************************************************************************
   * This method is used to process the layer's metadata. It will fill the empty fields of the layer's configuration (renderer,
   * initial settings, fields and aliases).
   *
   * @param {TypeLayerEntryConfig} layerEntryConfig The layer entry configuration to process.
   *
   * @returns {Promise<void>} A promise that the layer configuration has its metadata processed.
   */
  protected processLayerMetadata(layerEntryConfig: TypeLayerEntryConfig): Promise<void> {
    const promiseOfExecution = new Promise<void>((resolve) => {
      // User-defined groups do not have metadata provided by the service endpoint.
      if (layerEntryIsGroupLayer(layerEntryConfig) && !layerEntryConfig.isMetadataLayerGroup) resolve();
      else {
        let queryUrl = getLocalizedValue(this.metadataAccessPath, this.mapId);
        if (queryUrl) {
          queryUrl = queryUrl.endsWith('/') ? `${queryUrl}${layerEntryConfig.layerId}` : `${queryUrl}/${layerEntryConfig.layerId}`;
          const queryResult = axios.get<TypeJsonObject>(`${queryUrl}?f=pjson`);
          queryResult.then((response) => {
            // layers must have a fields attribute except if it is an dynamic layer group.
            if (!response.data.fields && !(layerEntryConfig as TypeLayerGroupEntryConfig).isMetadataLayerGroup)
              throw new Error(`Despite a return code of 200, an error was detected with this query (${queryUrl}?f=pjson)`);
            if (geoviewEntryIsEsriDynamic(layerEntryConfig)) {
              if (!(layerEntryConfig as TypeImageLayerEntryConfig).style) {
                const renderer = Cast<EsriBaseRenderer>(response.data.drawingInfo?.renderer);
                if (renderer) layerEntryConfig.style = getStyleFromEsriRenderer(this.mapId, layerEntryConfig, renderer);
              }
              this.processFeatureInfoConfig(
                response.data.capabilities as string,
                response.data.displayField as string,
                response.data.geometryField.name as string,
                response.data.fields as TypeJsonArray,
                layerEntryConfig
              );
              this.processInitialSettings(
                response.data.defaultVisibility as boolean,
                response.data.minScale as number,
                response.data.maxScale as number,
                response.data.extent,
                layerEntryConfig
              );
            }
            resolve();
          });
        } else resolve();
      }
    });
    return promiseOfExecution;
  }

  /** ***************************************************************************************************************************
   * This method set the initial settings based on the service metadata. Priority is given to the layer configuration.
   *
   * @param {boolean} visibility The metadata initial visibility of the layer.
   * @param {number} minScale The metadata minScale of the layer.
   * @param {number} maxScale The metadata maxScale of the layer.
   * @param {TypeJsonObject} extent The metadata layer extent.
   * @param {TypeEsriDynamicLayerEntryConfig} layerEntryConfig The vector layer entry to configure.
   */
  private processInitialSettings(
    visibility: boolean,
    minScale: number,
    maxScale: number,
    extent: TypeJsonObject,
    layerEntryConfig: TypeEsriDynamicLayerEntryConfig
  ) {
    if (!layerEntryConfig.initialSettings) layerEntryConfig.initialSettings = {};
    // ! TODO: TThe solution implemented in the following two lines is not right. scale and zoom are not the same things.
    // ! if (layerEntryConfig.initialSettings?.minZoom === undefined && minScale !== 0) layerEntryConfig.initialSettings.minZoom = minScale;
    // ! if (layerEntryConfig.initialSettings?.maxZoom === undefined && maxScale !== 0) layerEntryConfig.initialSettings.maxZoom = maxScale;
    if (layerEntryConfig.initialSettings?.visible === undefined) layerEntryConfig.initialSettings.visible = visibility;
    if (!layerEntryConfig.initialSettings?.extent) {
      const layerExtent: Extent = [extent.xmin as number, extent.ymin as number, extent.xmax as number, extent.ymax as number];
      layerEntryConfig.initialSettings.extent = transformExtent(
        layerExtent,
        `EPSG:${extent.spatialReference.wkid as number}`,
        `EPSG:${api.map(this.mapId).currentProjection}`
      ) as Extent;
    }
  }

  /** ***************************************************************************************************************************
   * This method verifies if the layer is queryable and sets the outfields and aliasFields of the source feature info.
   *
   * @param {string} capabilities The capabilities that will say if the layer is queryable.
   * @param {string} nameField The display field associated to the layer.
   * @param {string} geometryFieldName The field name of the geometry property.
   * @param {TypeJsonArray} fields An array of field names and its aliases.
   * @param {TypeEsriDynamicLayerEntryConfig} layerEntryConfig The vector layer entry to configure.
   */
  private processFeatureInfoConfig(
    capabilities: string,
    nameField: string,
    geometryFieldName: string,
    fields: TypeJsonArray,
    layerEntryConfig: TypeEsriDynamicLayerEntryConfig
  ) {
    if (!layerEntryConfig.source.featureInfo) layerEntryConfig.source.featureInfo = { queryable: capabilities.includes('Query') };
    // dynamic group layer doesn't have fields definition
    if (!layerEntryConfig.isMetadataLayerGroup) {
      if (!layerEntryConfig.source.featureInfo.nameField)
        layerEntryConfig.source.featureInfo.nameField = {
          en: nameField,
          fr: nameField,
        };

      // Process undefined outfields or aliasFields ('' = false and !'' = true)
      if (!layerEntryConfig.source.featureInfo.outfields?.en || !layerEntryConfig.source.featureInfo.aliasFields?.en) {
        const processOutField = !layerEntryConfig.source.featureInfo.outfields?.en;
        const processAliasFields = !layerEntryConfig.source.featureInfo.aliasFields?.en;
        if (processOutField) layerEntryConfig.source.featureInfo.outfields = { en: '' };
        if (processAliasFields) layerEntryConfig.source.featureInfo.aliasFields = { en: '' };
        fields.forEach((fieldEntry, i) => {
          if (fieldEntry.name === geometryFieldName) return;
          if (processOutField) this.addFieldEntryToSourceFeatureInfo(layerEntryConfig, 'outfields', fieldEntry.name as string, i);
          if (processAliasFields)
            this.addFieldEntryToSourceFeatureInfo(
              layerEntryConfig,
              'aliasFields',
              (fieldEntry.alias ? fieldEntry.alias : fieldEntry.name) as string,
              i
            );
        });
        layerEntryConfig.source.featureInfo!.outfields!.fr = layerEntryConfig.source.featureInfo!.outfields?.en;
        layerEntryConfig.source.featureInfo!.aliasFields!.fr = layerEntryConfig.source.featureInfo!.aliasFields?.en;
      }
    }
  }

  /** ****************************************************************************************************************************
   * This method creates a GeoView EsriDynamic layer using the definition provided in the layerEntryConfig parameter.
   *
   * @param {TypeEsriDynamicLayerEntryConfig} layerEntryConfig Information needed to create the GeoView layer.
   *
   * @returns {TypeBaseRasterLayer} The GeoView raster layer that has been created.
   */
  processOneLayerEntry(layerEntryConfig: TypeEsriDynamicLayerEntryConfig): Promise<TypeBaseRasterLayer | null> {
    const promisedVectorLayer = new Promise<TypeBaseRasterLayer | null>((resolve) => {
      const sourceOptions: SourceOptions = {};
      sourceOptions.attributions = [(this.metadata.copyrightText ? this.metadata.copyrightText : '') as string];
      sourceOptions.url = getLocalizedValue(layerEntryConfig.source.dataAccessPath!, this.mapId);
      sourceOptions.params = { LAYERS: `show:${layerEntryConfig.layerId}` };
      if (layerEntryConfig.source.transparent)
        Object.defineProperty(sourceOptions.params, 'transparent', layerEntryConfig.source.transparent!);
      if (layerEntryConfig.source.format) Object.defineProperty(sourceOptions.params, 'format', layerEntryConfig.source.format!);
      if (layerEntryConfig.source.crossOrigin) sourceOptions.crossOrigin = layerEntryConfig.source.crossOrigin;
      if (layerEntryConfig.source.projection) sourceOptions.projection = `EPSG:${layerEntryConfig.source.projection}`;

      const imageLayerOptions: ImageOptions<ImageArcGISRest> = {
        source: new ImageArcGISRest(sourceOptions),
        properties: { layerEntryConfig },
      };
      if (layerEntryConfig.initialSettings?.className !== undefined)
        imageLayerOptions.className = layerEntryConfig.initialSettings?.className;
      if (layerEntryConfig.initialSettings?.extent !== undefined) imageLayerOptions.extent = layerEntryConfig.initialSettings?.extent;
      if (layerEntryConfig.initialSettings?.maxZoom !== undefined) imageLayerOptions.maxZoom = layerEntryConfig.initialSettings?.maxZoom;
      if (layerEntryConfig.initialSettings?.minZoom !== undefined) imageLayerOptions.minZoom = layerEntryConfig.initialSettings?.minZoom;
      if (layerEntryConfig.initialSettings?.opacity !== undefined) imageLayerOptions.opacity = layerEntryConfig.initialSettings?.opacity;
      if (layerEntryConfig.initialSettings?.visible !== undefined) imageLayerOptions.visible = layerEntryConfig.initialSettings?.visible;

      layerEntryConfig.gvLayer = new ImageLayer(imageLayerOptions);

      resolve(layerEntryConfig.gvLayer);
    });
    return promisedVectorLayer;
  }

  /** ***************************************************************************************************************************
   * Translate the get feature information at coordinate result set to the TypeArrayOfRecords used by GeoView.
   *
   * @param {TypeJsonArray} features An array of found features formatted using the query syntax.
   * @param {TypeFeatureInfoLayerConfig} featureInfo Feature information describing the user's desired output format.
   *
   * @returns {TypeArrayOfRecords} The feature info table.
   */
  private formatFeatureInfoAtCoordinateResult(features: TypeJsonArray, featureInfo?: TypeFeatureInfoLayerConfig): TypeArrayOfRecords {
    if (!features.length) return [];
    const outfields = getLocalizedValue(featureInfo?.outfields, this.mapId)?.split(',');
    const aliasFields = getLocalizedValue(featureInfo?.aliasFields, this.mapId)?.split(',');
    const queryResult: TypeArrayOfRecords = [];
    features.forEach((feature) => {
      const featureFields = Object.keys(feature.attributes);
      const featureInfoEntry: TypeFeatureInfoEntry = {};
      featureFields.forEach((fieldName) => {
        if (outfields?.includes(fieldName)) {
          const aliasfieldIndex = outfields.indexOf(fieldName);
          featureInfoEntry[aliasFields![aliasfieldIndex]] = feature.attributes[fieldName] as string | number | null;
        } else if (!outfields) featureInfoEntry[fieldName] = feature.attributes[fieldName] as string | number | null;
      });
      queryResult.push(featureInfoEntry);
    });
    return queryResult;
  }

  /** ***************************************************************************************************************************
   * Return feature information for all the features around the provided Pixel.
   *
   * @param {Coordinate} location The pixel coordinate that will be used by the query.
   * @param {TypeEsriDynamicLayerEntryConfig} layerConfig The layer configuration.
   *
   * @returns {Promise<TypeArrayOfRecords>} The feature info table.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected getFeatureInfoAtPixel(location: Pixel, layerConfig: TypeEsriDynamicLayerEntryConfig): Promise<TypeArrayOfRecords> {
    const promisedQueryResult = new Promise<TypeArrayOfRecords>((resolve) => {
      const { map } = api.map(this.mapId);
      resolve(this.getFeatureInfoAtCoordinate(map.getCoordinateFromPixel(location), layerConfig));
    });
    return promisedQueryResult;
  }

  /** ***************************************************************************************************************************
   * Return feature information for all the features around the provided projection coordinate.
   *
   * @param {Coordinate} location The coordinate that will be used by the query.
   * @param {TypeEsriDynamicLayerEntryConfig} layerConfig The layer configuration.
   *
   * @returns {Promise<TypeArrayOfRecords>} The promised feature info table.
   */
  protected getFeatureInfoAtCoordinate(location: Coordinate, layerConfig: TypeEsriDynamicLayerEntryConfig): Promise<TypeArrayOfRecords> {
    const convertedLocation = transform(location, `EPSG:${api.map(this.mapId).currentProjection}`, 'EPSG:4326');
    return this.getFeatureInfoAtLongLat(convertedLocation, layerConfig);
  }

  /** ***************************************************************************************************************************
   * Return feature information for all the features around the provided coordinate.
   *
   * @param {Coordinate} lnglat The coordinate that will be used by the query.
   * @param {TypeEsriDynamicLayerEntryConfig} layerConfig The layer configuration.
   *
   * @returns {Promise<TypeArrayOfRecords>} The promised feature info table.
   */
  protected getFeatureInfoAtLongLat(lnglat: Coordinate, layerConfig: TypeEsriDynamicLayerEntryConfig): Promise<TypeArrayOfRecords> {
    const promisedQueryResult = new Promise<TypeArrayOfRecords>((resolve) => {
      if (!this.getVisible(layerConfig) || !layerConfig.gvLayer) resolve([]);
      else {
        if (!(layerConfig as TypeEsriDynamicLayerEntryConfig).source.featureInfo?.queryable) resolve([]);
        let identifyUrl = getLocalizedValue(layerConfig.source?.dataAccessPath, this.mapId);
        if (!identifyUrl) resolve([]);
        else {
          identifyUrl = identifyUrl.endsWith('/') ? identifyUrl : `${identifyUrl}/`;
          const mapLayer = api.map(this.mapId).map;
          const { currentProjection } = api.map(this.mapId);
          const size = mapLayer.getSize()!;
          let bounds = mapLayer.getView().calculateExtent();
          bounds = transformExtent(bounds, `EPSG:${currentProjection}`, 'EPSG:4326');

          const extent = { xmin: bounds[0], ymin: bounds[1], xmax: bounds[2], ymax: bounds[3] };

          identifyUrl =
            `${identifyUrl}identify?f=json&tolerance=7` +
            `&mapExtent=${extent.xmin},${extent.ymin},${extent.xmax},${extent.ymax}` +
            `&imageDisplay=${size[0]},${size[1]},96` +
            `&layers=visible:${layerConfig.layerId}` +
            `&returnFieldName=true&sr=4326&returnGeometry=true` +
            `&geometryType=esriGeometryPoint&geometry=${lnglat[0]},${lnglat[1]}`;

          fetch(identifyUrl).then((response) => {
            response.json().then((jsonResponse) => {
              resolve(
                this.formatFeatureInfoAtCoordinateResult(
                  jsonResponse.results as TypeJsonArray,
                  (layerConfig as TypeEsriDynamicLayerEntryConfig).source.featureInfo
                )
              );
            });
          });
        }
      }
    });
    return promisedQueryResult;
  }

  /** ***************************************************************************************************************************
   * Return feature information for all the features in the provided bounding box.
   *
   * @param {Coordinate} location The coordinate that will be used by the query.
   * @param {TypeEsriDynamicLayerEntryConfig} layerConfig The layer configuration.
   *
   * @returns {Promise<TypeArrayOfRecords>} The feature info table.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected getFeatureInfoUsingBBox(location: Coordinate[], layerConfig: TypeEsriDynamicLayerEntryConfig): Promise<TypeArrayOfRecords> {
    const promisedQueryResult = new Promise<TypeArrayOfRecords>((resolve) => {
      resolve([]);
    });
    return promisedQueryResult;
  }

  /** ***************************************************************************************************************************
   * Return feature information for all the features in the provided polygon.
   *
   * @param {Coordinate} location The coordinate that will be used by the query.
   * @param {TypeEsriDynamicLayerEntryConfig} layerConfig The layer configuration.
   *
   * @returns {Promise<TypeArrayOfRecords>} The feature info table.
   */
  protected getFeatureInfoUsingPolygon(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    location: Coordinate[],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    layerConfig: TypeEsriDynamicLayerEntryConfig
  ): Promise<TypeArrayOfRecords> {
    const promisedQueryResult = new Promise<TypeArrayOfRecords>((resolve) => {
      resolve([]);
    });
    return promisedQueryResult;
  }
}
