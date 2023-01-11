/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-param-reassign */
import axios from 'axios';

import ImageLayer from 'ol/layer/Image';
import { Coordinate } from 'ol/coordinate';
import { Pixel } from 'ol/pixel';
import { Options as ImageOptions } from 'ol/layer/BaseImage';
import { ImageWMS } from 'ol/source';
import { Options as SourceOptions } from 'ol/source/ImageWMS';
import WMSCapabilities from 'ol/format/WMSCapabilities';
import { Layer as gvLayer } from 'ol/layer';
import { Extent } from 'ol/extent';
import { transform, transformExtent } from 'ol/proj';

import cloneDeep from 'lodash/cloneDeep';

import { Cast, TypeJsonArray, TypeJsonObject } from '../../../../core/types/global-types';
import { AbstractGeoViewLayer, CONST_LAYER_TYPES, TypeLegend } from '../abstract-geoview-layers';
import { AbstractGeoViewRaster, TypeBaseRasterLayer } from './abstract-geoview-raster';
import {
  TypeImageLayerEntryConfig,
  TypeLayerEntryConfig,
  TypeSourceImageWmsInitialConfig,
  TypeGeoviewLayerConfig,
  TypeListOfLayerEntryConfig,
  layerEntryIsGroupLayer,
  TypeLayerGroupEntryConfig,
  TypeFeatureInfoLayerConfig,
} from '../../../map/map-schema-types';
import { TypeFeatureInfoEntry, TypeArrayOfFeatureInfoEntries } from '../../../../api/events/payloads/get-feature-info-payload';
import { getLocalizedValue, xmlToJson } from '../../../../core/utils/utilities';
import { snackbarMessagePayload } from '../../../../api/events/payloads/snackbar-message-payload';
import { EVENT_NAMES } from '../../../../api/events/event-types';
import { api, TimeDimension } from '../../../../app';
import { Layer } from '../../layer';

export interface TypeWmsLayerEntryConfig extends Omit<TypeImageLayerEntryConfig, 'source'> {
  source: TypeSourceImageWmsInitialConfig;
  temporalDimension?: TimeDimension;
}

export interface TypeWMSLayerConfig extends Omit<TypeGeoviewLayerConfig, 'listOfLayerEntryConfig'> {
  geoviewLayerType: 'ogcWms';
  listOfLayerEntryConfig: TypeWmsLayerEntryConfig[];
}

/** *****************************************************************************************************************************
 * type guard function that redefines a TypeGeoviewLayerConfig as a TypeWMSLayerConfig if the geoviewLayerType attribute of the
 * verifyIfLayer parameter is WMS. The type ascention applies only to the true block of the if clause that use this function.
 *
 * @param {TypeGeoviewLayerConfig} verifyIfLayer Polymorphic object to test in order to determine if the type ascention is valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const layerConfigIsWMS = (verifyIfLayer: TypeGeoviewLayerConfig): verifyIfLayer is TypeWMSLayerConfig => {
  return verifyIfLayer?.geoviewLayerType === CONST_LAYER_TYPES.WMS;
};

/** *****************************************************************************************************************************
 * type guard function that redefines an AbstractGeoViewLayer as a WMS if the type attribute of the verifyIfGeoViewLayer
 * parameter is WMS. The type ascention applies only to the true block of the if clause that use this function.
 *
 * @param {AbstractGeoViewLayer} verifyIfGeoViewLayer Polymorphic object to test in order to determine if the type ascention is
 * valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const geoviewLayerIsWMS = (verifyIfGeoViewLayer: AbstractGeoViewLayer): verifyIfGeoViewLayer is WMS => {
  return verifyIfGeoViewLayer?.type === CONST_LAYER_TYPES.WMS;
};

/** *****************************************************************************************************************************
 * type guard function that redefines a TypeLayerEntryConfig as a TypeWmsLayerEntryConfig if the geoviewLayerType attribute of the
 * verifyIfGeoViewEntry.geoviewRootLayer attribute is WMS. The type ascention applies only to the true block of
 * the if clause that use this function.
 *
 * @param {TypeLayerEntryConfig} verifyIfGeoViewEntry Polymorphic object to test in order to determine if the type ascention is
 * valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const geoviewEntryIsWMS = (verifyIfGeoViewEntry: TypeLayerEntryConfig): verifyIfGeoViewEntry is TypeWmsLayerEntryConfig => {
  return verifyIfGeoViewEntry?.geoviewRootLayer?.geoviewLayerType === CONST_LAYER_TYPES.WMS;
};

// ******************************************************************************************************************************
// ******************************************************************************************************************************
/** *****************************************************************************************************************************
 * A class to add wms layer.
 *
 * @exports
 * @class WMS
 */
// ******************************************************************************************************************************
export class WMS extends AbstractGeoViewRaster {
  /** ***************************************************************************************************************************
   * Initialize layer
   * @param {string} mapId the id of the map
   * @param {TypeWMSLayerConfig} layerConfig the layer configuration
   */
  constructor(mapId: string, layerConfig: TypeWMSLayerConfig) {
    super(CONST_LAYER_TYPES.WMS, layerConfig, mapId);
  }

  /** ***************************************************************************************************************************
   * This method reads the service metadata from the metadataAccessPath.
   *
   * @returns {Promise<void>} A promise that the execution is completed.
   */
  protected getServiceMetadata(): Promise<void> {
    const promisedExecution = new Promise<void>((resolve) => {
      const parser = new WMSCapabilities();
      let metadataUrl = getLocalizedValue(this.metadataAccessPath, this.mapId);
      if (metadataUrl) {
        const layersToQuery = this.getLayersToQuery();
        const metadataAccessPathIsXmlFile = metadataUrl.slice(-4).toLowerCase() === '.xml';
        if (!metadataAccessPathIsXmlFile) {
          if (layersToQuery) metadataUrl = `${metadataUrl}?service=WMS&version=1.3.0&request=GetCapabilities&Layers=${layersToQuery}`;
          else metadataUrl = `${metadataUrl}?service=WMS&version=1.3.0&request=GetCapabilities`;
        }
        fetch(metadataUrl).then((response) => {
          response.text().then((capabilitiesString) => {
            this.metadata = parser.read(capabilitiesString);
            if (this.metadata) {
              this.processMetadataInheritance();
              if (metadataAccessPathIsXmlFile) {
                const dataAccessPath = this.metadata.Capability.Request.GetMap.DCPType[0].HTTP.Get.OnlineResource as string;
                const setDataAccessPath = (listOfLayerEntryConfig: TypeListOfLayerEntryConfig) => {
                  listOfLayerEntryConfig.forEach((layerEntryConfig) => {
                    if (layerEntryIsGroupLayer(layerEntryConfig)) setDataAccessPath(layerEntryConfig.listOfLayerEntryConfig);
                    else {
                      layerEntryConfig.source!.dataAccessPath![api.map(this.mapId).displayLanguage] = dataAccessPath;
                    }
                  });
                };
                setDataAccessPath(this.listOfLayerEntryConfig);
              }
            }
            resolve();
          });
        });
      } else throw new Error(`Cant't read service metadata for layer ${this.geoviewLayerId} of map ${this.mapId}.`);
    });
    return promisedExecution;
  }

  /** ***************************************************************************************************************************
   * This method reads the layer identifiers from the configuration to create a coma seperated string that will be used in the
   * GetCapabilities.
   *
   * @returns {Promise<void>} A promise that the execution is completed.
   */
  private getLayersToQuery(): string {
    const gatherLayerIds = (listOfLayerEntryConfig = this.listOfLayerEntryConfig) => {
      let comaSeparatedList = '';
      if (listOfLayerEntryConfig.length) {
        listOfLayerEntryConfig.forEach((layerEntryConfig) => {
          if (layerEntryIsGroupLayer(layerEntryConfig)) comaSeparatedList += gatherLayerIds(layerEntryConfig.listOfLayerEntryConfig);
          else comaSeparatedList += `${layerEntryConfig.layerId},`;
        });
      }
      return comaSeparatedList;
    };
    return gatherLayerIds().slice(0, -1);
  }

  /** ***************************************************************************************************************************
   * This method propagate the WMS metadata inherited values.
   */
  private processMetadataInheritance(parentLayer?: TypeJsonObject, layer: TypeJsonObject = this.metadata!.Capability.Layer) {
    if (parentLayer && layer) {
      // Table 7 — Inheritance of Layer properties specified in the standard with 'replace' behaviour.
      if (layer.EX_GeographicBoundingBox === undefined) layer.EX_GeographicBoundingBox = parentLayer.EX_GeographicBoundingBox;
      if (layer.queryable === undefined) layer.queryable = parentLayer.queryable;
      if (layer.cascaded === undefined) layer.cascaded = parentLayer.cascaded;
      if (layer.opaque === undefined) layer.opaque = parentLayer.opaque;
      if (layer.noSubsets === undefined) layer.noSubsets = parentLayer.noSubsets;
      if (layer.fixedWidth === undefined) layer.fixedWidth = parentLayer.fixedWidth;
      if (layer.fixedHeight === undefined) layer.fixedHeight = parentLayer.fixedHeight;
      if (layer.MinScaleDenominator === undefined) layer.MinScaleDenominator = parentLayer.MinScaleDenominator;
      if (layer.MaxScaleDenominator === undefined) layer.MaxScaleDenominator = parentLayer.MaxScaleDenominator;
      if (layer.BoundingBox === undefined) layer.BoundingBox = parentLayer.BoundingBox;
      if (layer.Dimension === undefined) layer.Dimension = parentLayer.Dimension;
      if (layer.Attribution === undefined) layer.Attribution = parentLayer.Attribution;
      if (layer.MaxScaleDenominator === undefined) layer.MaxScaleDenominator = parentLayer.MaxScaleDenominator;
      if (layer.MaxScaleDenominator === undefined) layer.MaxScaleDenominator = parentLayer.MaxScaleDenominator;
      // Table 7 — Inheritance of Layer properties specified in the standard with 'add' behaviour.
      // AuthorityURL inheritance is not implemented in the following code.
      if (parentLayer.Style) {
        if (!layer.Style as TypeJsonArray) (layer.Style as TypeJsonArray) = [];
        (parentLayer.Style as TypeJsonArray).forEach((parentStyle) => {
          // eslint-disable-next-line vars-on-top, no-var
          for (var found = false, i = 0; i < layer.Style.length && !found; i++) found = layer.Style[i].Name === parentStyle.Name;
          // eslint-disable-next-line block-scoped-var
          if (!found) (layer.Style as TypeJsonArray).push(parentStyle);
        });
      }
      if (parentLayer.CRS) {
        if (!layer.CRS as TypeJsonArray) (layer.CRS as TypeJsonArray) = [];
        (parentLayer.CRS as TypeJsonArray).forEach((parentCRS) => {
          // eslint-disable-next-line vars-on-top, no-var
          for (var found = false, i = 0; i < layer.CRS.length && !found; i++) found = layer.CRS[i] === parentCRS;
          // eslint-disable-next-line block-scoped-var
          if (!found) (layer.CRS as TypeJsonArray).push(parentCRS);
        });
      }
    }
    if (layer.Layer !== undefined) (layer.Layer as TypeJsonArray).forEach((subLayer) => this.processMetadataInheritance(layer, subLayer));
  }

  /** ***************************************************************************************************************************
   * This method recursively validates the configuration of the layer entries to ensure that each layer is correctly defined.
   *
   * @param {TypeListOfLayerEntryConfig} listOfLayerEntryConfig The list of layer entries configuration to validate.
   *
   * @returns {TypeListOfLayerEntryConfig} A new layer configuration list with layers in error removed.
   */
  protected validateListOfLayerEntryConfig(listOfLayerEntryConfig: TypeListOfLayerEntryConfig): TypeListOfLayerEntryConfig {
    return listOfLayerEntryConfig.filter((layerEntryConfig: TypeLayerEntryConfig) => {
      if (api.map(this.mapId).layer.isRegistered(layerEntryConfig)) {
        this.layerLoadError.push({
          layer: Layer.getLayerPath(layerEntryConfig),
          consoleMessage: `Duplicate layerPath (mapId:  ${this.mapId}, layerPath: ${Layer.getLayerPath(layerEntryConfig)})`,
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

      const layerFound = this.getLayerMetadataEntry(layerEntryConfig.layerId);
      if (!layerFound) {
        this.layerLoadError.push({
          layer: Layer.getLayerPath(layerEntryConfig),
          consoleMessage: `Layer metadata not found (mapId:  ${this.mapId}, layerPath: ${Layer.getLayerPath(layerEntryConfig)})`,
        });
        return false;
      }

      if ('Layer' in layerFound) {
        this.createGroupLayer(layerFound, layerEntryConfig);
        return true;
      }

      layerEntryConfig.layerName = {
        en: layerFound.Title as string,
        fr: layerFound.Title as string,
      };

      api.map(this.mapId).layer.registerLayerConfig(layerEntryConfig);
      return true;
    });
  }

  /** ***************************************************************************************************************************
   * This method create recursively dynamic group layers from the service metadata.
   *
   * @param {TypeJsonObject} layer The dynamic group layer metadata.
   * @param {TypeLayerEntryConfig} layerEntryConfig The layer configurstion associated to the dynamic group.
   */
  private createGroupLayer(layer: TypeJsonObject, layerEntryConfig: TypeLayerEntryConfig) {
    const newListOfLayerEntryConfig: TypeListOfLayerEntryConfig = [];
    const arrayOfLayerMetadata = Array.isArray(layer.Layer) ? layer.Layer : ([layer.Layer] as TypeJsonArray);

    arrayOfLayerMetadata.forEach((subLayer) => {
      const subLayerEntryConfig: TypeLayerEntryConfig = cloneDeep(layerEntryConfig);
      subLayerEntryConfig.parentLayerConfig = Cast<TypeLayerGroupEntryConfig>(layerEntryConfig);
      subLayerEntryConfig.layerId = subLayer.Name as string;
      subLayerEntryConfig.layerName = {
        en: subLayer.Title as string,
        fr: subLayer.Title as string,
      };
      newListOfLayerEntryConfig.push(subLayerEntryConfig);
    });

    const switchToGroupLayer = Cast<TypeLayerGroupEntryConfig>(layerEntryConfig);
    switchToGroupLayer.entryType = 'group';
    switchToGroupLayer.layerName = {
      en: layer.Title as string,
      fr: layer.Title as string,
    };
    switchToGroupLayer.isMetadataLayerGroup = true;
    switchToGroupLayer.listOfLayerEntryConfig = newListOfLayerEntryConfig;
    api.map(this.mapId).layer.registerLayerConfig(layerEntryConfig);
    this.validateListOfLayerEntryConfig(newListOfLayerEntryConfig);
    return true;
  }

  /** ****************************************************************************************************************************
   * This method search recursively the layerId in the layer entry of the capabilities.
   *
   * @returns {TypeJsonObject} layerFromCapabilities The layer entry from the capabilities that will be searched.
   * @param {string} layerId The layer identifier that must exists on the server.
   *
   * @returns {TypeJsonObject | null} The found layer from the capabilities or null if not found.
   */
  private getLayerMetadataEntry(layerId: string, layer: TypeJsonObject = this.metadata!.Capability.Layer): TypeJsonObject | null {
    if ('Name' in layer && (layer.Name as string) === layerId) return layer;
    if ('Layer' in layer) {
      if (Array.isArray(layer.Layer)) {
        for (let i = 0; i < layer.Layer.length; i++) {
          const layerFound = this.getLayerMetadataEntry(layerId, layer.Layer[i]);
          if (layerFound) return layerFound;
        }
        return null;
      }
      return this.getLayerMetadataEntry(layerId, layer.Layer);
    }
    return null;
  }

  /** ****************************************************************************************************************************
   * This method creates a GeoView WMS layer using the definition provided in the layerEntryConfig parameter.
   *
   * @param {TypeWmsLayerEntryConfig} layerEntryConfig Information needed to create the GeoView layer.
   *
   * @returns {TypeBaseRasterLayer} The GeoView raster layer that has been created.
   */
  processOneLayerEntry(layerEntryConfig: TypeWmsLayerEntryConfig): Promise<TypeBaseRasterLayer | null> {
    const promisedVectorLayer = new Promise<TypeBaseRasterLayer | null>((resolve) => {
      const layerCapabilities = this.getLayerMetadataEntry(layerEntryConfig.layerId);
      if (layerCapabilities) {
        const dataAccessPath = getLocalizedValue(layerEntryConfig.source.dataAccessPath!, this.mapId)!;
        const sourceOptions: SourceOptions = {
          url: dataAccessPath.endsWith('?') ? dataAccessPath : `${dataAccessPath}?`,
          params: { LAYERS: layerEntryConfig.layerId },
        };
        sourceOptions.attributions = this.attributions;
        sourceOptions.serverType = layerEntryConfig.source.serverType;
        if (layerEntryConfig.source.crossOrigin) {
          sourceOptions.crossOrigin = layerEntryConfig.source.crossOrigin;
        } else {
          sourceOptions.crossOrigin = 'Anonymous';
        }
        if (layerEntryConfig.source.projection) sourceOptions.projection = `EPSG:${layerEntryConfig.source.projection}`;

        const imageLayerOptions: ImageOptions<ImageWMS> = {
          source: new ImageWMS(sourceOptions),
          properties: { layerCapabilities, layerEntryConfig },
        };
        if (!layerEntryConfig.initialSettings && layerEntryConfig.geoviewRootLayer?.initialSettings)
          // eslint-disable-next-line no-param-reassign
          layerEntryConfig.initialSettings = layerEntryConfig.geoviewRootLayer?.initialSettings;
        if (layerEntryConfig.initialSettings?.className !== undefined)
          imageLayerOptions.className = layerEntryConfig.initialSettings?.className;
        if (layerEntryConfig.initialSettings?.extent !== undefined) imageLayerOptions.extent = layerEntryConfig.initialSettings?.extent;
        if (layerEntryConfig.initialSettings?.maxZoom !== undefined) imageLayerOptions.maxZoom = layerEntryConfig.initialSettings?.maxZoom;
        if (layerEntryConfig.initialSettings?.minZoom !== undefined) imageLayerOptions.minZoom = layerEntryConfig.initialSettings?.minZoom;
        if (layerEntryConfig.initialSettings?.opacity !== undefined) imageLayerOptions.opacity = layerEntryConfig.initialSettings?.opacity;
        if (layerEntryConfig.initialSettings?.visible !== undefined) imageLayerOptions.visible = layerEntryConfig.initialSettings?.visible;

        layerEntryConfig.gvLayer = new ImageLayer(imageLayerOptions);
        resolve(layerEntryConfig.gvLayer);
      } else {
        api.event.emit(
          snackbarMessagePayload(EVENT_NAMES.SNACKBAR.EVENT_SNACKBAR_OPEN, this.mapId, {
            type: 'key',
            value: 'validation.layer.notfound',
            params: [layerEntryConfig.layerId, this.geoviewLayerId],
          })
        );
        resolve(null);
      }
    });
    return promisedVectorLayer;
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
      if (geoviewEntryIsWMS(layerEntryConfig)) {
        const layerCapabilities = this.getLayerMetadataEntry(layerEntryConfig.layerId);
        if (layerCapabilities) {
          if (!layerEntryConfig.initialSettings) layerEntryConfig.initialSettings = {};
          if (layerCapabilities.Attribution) this.attributions.push(layerCapabilities.Attribution as string);
          if (!layerEntryConfig.source.featureInfo) layerEntryConfig.source.featureInfo = { queryable: !!layerCapabilities.queryable };
          // ! TODO: The solution implemented in the following 5 lines is not right. scale and zoom are not the same things.
          // if (layerEntryConfig.initialSettings?.minZoom === undefined && layerCapabilities.MinScaleDenominator !== undefined)
          //   layerEntryConfig.initialSettings.minZoom = layerCapabilities.MinScaleDenominator as number;
          // if (layerEntryConfig.initialSettings?.maxZoom === undefined && layerCapabilities.MaxScaleDenominator !== undefined)
          //   layerEntryConfig.initialSettings.maxZoom = layerCapabilities.MaxScaleDenominator as number;
          if (layerEntryConfig.initialSettings?.extent)
            layerEntryConfig.initialSettings.extent = transformExtent(
              layerEntryConfig.initialSettings.extent,
              'EPSG:4326',
              `EPSG:${api.map(this.mapId).currentProjection}`
            );

          if (layerEntryConfig.initialSettings?.bounds)
            layerEntryConfig.initialSettings.bounds = transformExtent(
              layerEntryConfig.initialSettings.bounds,
              'EPSG:4326',
              `EPSG:${api.map(this.mapId).currentProjection}`
            );
          else if (layerCapabilities.EX_GeographicBoundingBox) {
            layerEntryConfig.initialSettings.bounds = transformExtent(
              layerCapabilities.EX_GeographicBoundingBox as Extent,
              'EPSG:4326',
              `EPSG:${api.map(this.mapId).currentProjection}`
            );
          }

          this.processTemporalDimension(layerCapabilities.Dimension as TypeJsonObject, layerEntryConfig);
        }
      }
      resolve();
    });
    return promiseOfExecution;
  }

  /** ***************************************************************************************************************************
   * This method will create a Geoview temporal dimension if ot exist in the service metadata
   * @param {TypeJsonObject} wmsTimeDimension The WMS time dimension object
   * @param {TypeLayerEntryConfig} layerEntryConfig The layer entry to configure
   */
  private processTemporalDimension(wmsTimeDimension: TypeJsonObject, layerEntryConfig: TypeWmsLayerEntryConfig) {
    if (wmsTimeDimension !== undefined) {
      layerEntryConfig.temporalDimension = api.dateUtilities.createDimensionFromOGC(wmsTimeDimension[0]);
    }
  }

  /** ***************************************************************************************************************************
   * Return feature information for all the features around the provided Pixel.
   *
   * @param {Coordinate} location The pixel coordinate that will be used by the query.
   * @param {TypeWmsLayerEntryConfig} layerConfig The layer configuration.
   *
   * @returns {Promise<TypeArrayOfFeatureInfoEntries>} The feature info table.
   */
  protected getFeatureInfoAtPixel(location: Pixel, layerConfig: TypeWmsLayerEntryConfig): Promise<TypeArrayOfFeatureInfoEntries> {
    const promisedQueryResult = new Promise<TypeArrayOfFeatureInfoEntries>((resolve) => {
      const { map } = api.map(this.mapId);
      resolve(this.getFeatureInfoAtCoordinate(map.getCoordinateFromPixel(location), layerConfig));
    });
    return promisedQueryResult;
  }

  /** ***************************************************************************************************************************
   * Return feature information for all the features around the provided projection coordinate.
   *
   * @param {Coordinate} location The coordinate that will be used by the query.
   * @param {TypeWmsLayerEntryConfig} layerConfig The layer configuration.
   *
   * @returns {Promise<TypeArrayOfFeatureInfoEntries>} The promised feature info table.
   */
  protected getFeatureInfoAtCoordinate(location: Coordinate, layerConfig: TypeWmsLayerEntryConfig): Promise<TypeArrayOfFeatureInfoEntries> {
    const convertedLocation = transform(location, `EPSG:${api.map(this.mapId).currentProjection}`, 'EPSG:4326');
    return this.getFeatureInfoAtLongLat(convertedLocation, layerConfig);
  }

  /** ***************************************************************************************************************************
   * Return feature information for all the features around the provided coordinate.
   *
   * @param {Coordinate} lnglat The coordinate that will be used by the query.
   * @param {TypeWmsLayerEntryConfig} layerConfig The layer configuration.
   *
   * @returns {Promise<TypeArrayOfFeatureInfoEntries>} The promised feature info table.
   */
  protected getFeatureInfoAtLongLat(lnglat: Coordinate, layerConfig: TypeWmsLayerEntryConfig): Promise<TypeArrayOfFeatureInfoEntries> {
    const promisedQueryResult = new Promise<TypeArrayOfFeatureInfoEntries>((resolve) => {
      if (!this.getVisible(layerConfig) || !layerConfig.gvLayer) resolve([]);
      else {
        const viewResolution = api.map(this.mapId).getView().getResolution() as number;
        const crs = `EPSG:${api.map(this.mapId).currentProjection}`;
        const clickCoordinate = transform(lnglat, 'EPSG:4326', crs);
        if (
          clickCoordinate[0] < layerConfig.initialSettings!.bounds![0] ||
          layerConfig.initialSettings!.bounds![2] < clickCoordinate[0] ||
          clickCoordinate[1] < layerConfig.initialSettings!.bounds![1] ||
          layerConfig.initialSettings!.bounds![3] < clickCoordinate[1]
        )
          resolve([]);
        else {
          const wmsSource = (layerConfig.gvLayer as gvLayer).getSource() as ImageWMS;
          const featureInfoUrl = wmsSource.getFeatureInfoUrl(clickCoordinate, viewResolution, crs, {
            INFO_FORMAT: 'text/xml',
          });
          if (featureInfoUrl) {
            axios(featureInfoUrl).then((response) => {
              const xmlDomResponse = new DOMParser().parseFromString(response.data, 'text/xml');
              const xmlJsonResponse = xmlToJson(xmlDomResponse);
              const featureCollection = this.getAttribute(xmlJsonResponse, 'FeatureCollection');
              if (featureCollection) {
                const featureMember = this.getAttribute(featureCollection, 'featureMember');
                if (featureMember) resolve(this.formatFeatureInfoAtCoordinateResult(featureMember, layerConfig.source.featureInfo));
              }
            });
          } else resolve([]);
        }
      }
    });
    return promisedQueryResult;
  }

  /** ***************************************************************************************************************************
   * Return feature information for all the features in the provided bounding box.
   *
   * @param {Coordinate} location The coordinate that will be used by the query.
   * @param {TypeWmsLayerEntryConfig} layerConfig The layer configuration.
   *
   * @returns {Promise<TypeArrayOfFeatureInfoEntries>} The feature info table.
   */
  protected getFeatureInfoUsingBBox(location: Coordinate[], layerConfig: TypeWmsLayerEntryConfig): Promise<TypeArrayOfFeatureInfoEntries> {
    const promisedQueryResult = new Promise<TypeArrayOfFeatureInfoEntries>((resolve) => {
      resolve([]);
    });
    return promisedQueryResult;
  }

  /** ***************************************************************************************************************************
   * Return feature information for all the features in the provided polygon.
   *
   * @param {Coordinate} location The coordinate that will be used by the query.
   * @param {TypeWmsLayerEntryConfig} layerConfig The layer configuration.
   *
   * @returns {Promise<TypeArrayOfFeatureInfoEntries>} The feature info table.
   */
  protected getFeatureInfoUsingPolygon(
    location: Coordinate[],
    layerConfig: TypeWmsLayerEntryConfig
  ): Promise<TypeArrayOfFeatureInfoEntries> {
    const promisedQueryResult = new Promise<TypeArrayOfFeatureInfoEntries>((resolve) => {
      resolve([]);
    });
    return promisedQueryResult;
  }

  /** ***************************************************************************************************************************
   * Get the legend image URL of a layer from the capabilities. Return null if it does not exist.
   *
   * @param {string} layerId The layer identifier for which we are looking for the legend URL.
   *
   * @returns {TypeJsonObject | null} URL of a Legend image in png format or null
   */
  private getLegendUrlFromCapabilities(layerId: string): TypeJsonObject | null {
    const layerCapabilities = this.getLayerMetadataEntry(layerId);
    if (layerCapabilities?.Style) {
      for (let i = 0; i < layerCapabilities.Style.length; i++) {
        if (layerCapabilities.Style[i].LegendURL) {
          for (let j = 0; j < layerCapabilities.Style[i].LegendURL.length; j++) {
            if (layerCapabilities.Style[i].LegendURL[j].Format === 'image/png') return layerCapabilities.Style[i].LegendURL[j];
          }
        }
      }
    }
    return null;
  }

  /** ***************************************************************************************************************************
   * Get the legend image of a layer.
   *
   * @param {string} layerId The layer identifier for which we are looking for the legend.
   *
   * @returns {blob} image blob
   */
  private getLegendImage(layerId: string): Promise<string | ArrayBuffer | null> {
    const promisedImage = new Promise<string | ArrayBuffer | null>((resolve) => {
      const readImage = (blob: Blob): Promise<string | ArrayBuffer | null> =>
        // eslint-disable-next-line @typescript-eslint/no-shadow
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });

      const legendUrlFromCapabilities = this.getLegendUrlFromCapabilities(layerId);
      let queryUrl: string;
      if (legendUrlFromCapabilities) queryUrl = legendUrlFromCapabilities.OnlineResource as string;
      else queryUrl = `${this.metadataAccessPath}service=WMS&version=1.3.0&request=GetLegendGraphic&FORMAT=image/png&layer=${layerId}`;

      axios.get<TypeJsonObject>(queryUrl, { responseType: 'blob' }).then((response) => {
        resolve(readImage(Cast<Blob>(response.data)));
      });
    });
    return promisedImage;
  }

  /** ***************************************************************************************************************************
   * Return the legend of the layer. When layerPathOrConfig is undefined, the activeLayer of the class is used. This routine
   * return null when the layerPath specified is not found or when the layerPathOrConfig is undefined and the active layer
   * is null or the selected layerConfig is undefined or null.
   *
   * @param {string | TypeLayerEntryConfig | null} layerPathOrConfig Optional layer path or configuration.
   *
   * @returns {Promise<TypeLegend | null>} The legend of the layer.
   */
  getLegend(layerPathOrConfig: string | TypeLayerEntryConfig | null = this.activeLayer): Promise<TypeLegend | null> {
    const promisedLegend = new Promise<TypeLegend | null>((resolve) => {
      const layerConfig = typeof layerPathOrConfig === 'string' ? this.getLayerConfig(layerPathOrConfig) : layerPathOrConfig;
      if (!layerConfig) resolve(null);

      this.getLegendImage(layerConfig!.layerId).then((legendImage) => {
        if (!legendImage) resolve(null);
        else {
          api
            .map(this.mapId)
            .geoviewRenderer.loadImage(legendImage as string)
            .then((image) => {
              if (image) {
                const drawingCanvas = document.createElement('canvas');
                drawingCanvas.width = image.width;
                drawingCanvas.height = image.height;
                const drawingContext = drawingCanvas.getContext('2d')!;
                drawingContext.drawImage(image, 0, 0);
                const legend: TypeLegend = {
                  type: this.type,
                  layerPath: Layer.getLayerPath(layerConfig!),
                  layerName: layerConfig!.layerName,
                  legend: drawingCanvas,
                };
                resolve(legend);
              } else resolve(null);
            });
        }
      });
    });
    return promisedLegend;
  }

  /** ***************************************************************************************************************************
   * Translate the get feature information at coordinate result set to the TypeArrayOfFeatureInfoEntries used by GeoView.
   *
   * @param {TypeJsonObject} featureMember An object formatted using the query syntax.
   * @param {TypeFeatureInfoLayerConfig} featureInfo Feature information describing the user's desired output format.
   *
   * @returns {TypeArrayOfFeatureInfoEntries} The feature info table.
   */
  private formatFeatureInfoAtCoordinateResult(
    featureMember: TypeJsonObject,
    featureInfo?: TypeFeatureInfoLayerConfig
  ): TypeArrayOfFeatureInfoEntries {
    const outfields = getLocalizedValue(featureInfo?.outfields, this.mapId)?.split(',');
    const aliasFields = getLocalizedValue(featureInfo?.aliasFields, this.mapId)?.split(',');
    const queryResult: TypeArrayOfFeatureInfoEntries = [];

    const featureInfoEntry: TypeFeatureInfoEntry = {
      // feature key for building the data-grid
      featureKey: 0,
      featureInfo: {},
    };
    const createFieldEntries = (entry: TypeJsonObject, prefix = '') => {
      const keys = Object.keys(entry);
      keys.forEach((key) => {
        if (!key.endsWith('Geometry') && !key.startsWith('@')) {
          const splitedKey = key.split(':');
          const fieldName = splitedKey[splitedKey.length - 1];
          if ('#text' in entry[key])
            featureInfoEntry.featureInfo[`${prefix}${prefix ? '.' : ''}${fieldName}`] = entry[key]['#text'] as string;
          else createFieldEntries(entry[key], fieldName);
        }
      });
    };
    createFieldEntries(featureMember);

    if (!outfields) queryResult.push(featureInfoEntry);
    else {
      const filteredFeatureInfoEntry: TypeFeatureInfoEntry = {
        // feature key for building the data-grid
        featureKey: 0,
        featureInfo: {},
      };
      Object.keys(featureInfoEntry).forEach((fieldName) => {
        if (outfields?.includes(fieldName)) {
          const aliasfieldIndex = outfields.indexOf(fieldName);
          filteredFeatureInfoEntry.featureInfo[aliasFields![aliasfieldIndex]] = featureInfoEntry.featureInfo[fieldName];
        }
      });
      queryResult.push(filteredFeatureInfoEntry);
    }
    return queryResult;
  }

  /** ***************************************************************************************************************************
   * Return the attribute of an object that ends with the specified ending string or null if not found.
   *
   * @param {TypeJsonObject} jsonObject The object that is supposed to have the needed attribute.
   * @param {string} attribute The attribute searched.
   *
   * @returns {TypeJsonObject | null} The promised feature info table.
   */
  private getAttribute(jsonObject: TypeJsonObject, attributeEnding: string): TypeJsonObject | null {
    const keys = Object.keys(jsonObject);
    for (let i = 0; i < keys.length; i++) if (keys[i].endsWith(attributeEnding)) return jsonObject[keys[i]];
    return null;
  }
}
