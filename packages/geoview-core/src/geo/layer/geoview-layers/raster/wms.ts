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

import { Cast, toJsonObject, TypeJsonArray, TypeJsonObject } from '../../../../core/types/global-types';
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
  TypeSourceImageInitialConfig,
} from '../../../map/map-schema-types';
import {
  TypeFeatureInfoEntry,
  TypeArrayOfFeatureInfoEntries,
  rangeDomainType,
  codedValueType,
} from '../../../../api/events/payloads/get-feature-info-payload';
import { getLocalizedValue, xmlToJson } from '../../../../core/utils/utilities';
import { snackbarMessagePayload } from '../../../../api/events/payloads/snackbar-message-payload';
import { EVENT_NAMES } from '../../../../api/events/event-types';
import { api, TimeDimension } from '../../../../app';
import { Layer } from '../../layer';

export interface TypeWmsLayerEntryConfig extends Omit<TypeImageLayerEntryConfig, 'source'> {
  source: TypeSourceImageWmsInitialConfig;
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
   * Extract the type of the specified field from the metadata. If the type can not be found, return 'string'.
   *
   * @param {string} fieldName field name for which we want to get the type.
   * @param {TypeLayerEntryConfig} layeConfig layer configuration.
   *
   * @returns {'string' | 'date' | 'number'} The type of the field.
   */
  protected getFieldType(fieldName: string, layerConfig: TypeLayerEntryConfig): 'string' | 'date' | 'number' {
    return 'string';
  }

  /** ***************************************************************************************************************************
   * Returns null. WMS services don't have domains.
   *
   * @param {string} fieldName field name for which we want to get the domain.
   * @param {TypeLayerEntryConfig} layeConfig layer configuration.
   *
   * @returns {null | codedValueType | rangeDomainType} The domain of the field.
   */
  protected getFieldDomain(fieldName: string, layerConfig: TypeLayerEntryConfig): null | codedValueType | rangeDomainType {
    return null;
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
        const metadataAccessPathIsXmlFile = metadataUrl.slice(-4).toLowerCase() === '.xml';
        if (metadataAccessPathIsXmlFile) {
          // XML metadata is a special case that does not use GetCapabilities to get the metadata
          this.getXmlServiceMetadata(metadataUrl).then(() => {
            resolve();
          });
        } else {
          const layersToQuery = this.getLayersToQuery();
          if (layersToQuery.length === 0) {
            // Use GetCapabilities to get the metadata
            this.fetchServiceMetadata(`${metadataUrl}?service=WMS&version=1.3.0&request=GetCapabilities`).then((metadata) => {
              if (metadata) {
                this.metadata = metadata;
                this.processMetadataInheritance();
                resolve();
              }
            });
          } else {
            // Uses GetCapabilities to get the metadata. However, to allow geomet metadata to be retrieved using the non-standard
            // "Layers" parameter on the command line, we need to process each layer individually and merge all layer metadata at
            // the end. Even though the "Layers" parameter is ignored by other WMS servers, the drawback of this method is
            // sending unnecessary requests while only one GetCapabilities could be used when the server publishes a small set of
            // metadata. Which is not the case for the Geomet service.
            const promisedArrayOfMetadata: Promise<TypeJsonObject | null>[] = [];
            layersToQuery.forEach((layerName: string) => {
              promisedArrayOfMetadata.push(
                this.fetchServiceMetadata(`${metadataUrl}?service=WMS&version=1.3.0&request=GetCapabilities&Layers=${layerName}`)
              );
            });
            Promise.all(promisedArrayOfMetadata).then((arrayOfMetadata) => {
              [this.metadata] = arrayOfMetadata;
              if (this.metadata) {
                for (let i = 1; i < arrayOfMetadata.length; i++) {
                  if (!this.getLayerMetadataEntry(layersToQuery[i])) {
                    if (arrayOfMetadata[i]) {
                      const metadataLayerPathToAdd = this.getMetadataLayerPath(layersToQuery[i], arrayOfMetadata[i]!.Capability.Layer);
                      this.addLayerToMetadataInstance(
                        metadataLayerPathToAdd,
                        this.metadata!.Capability.Layer,
                        arrayOfMetadata[i]!.Capability.Layer
                      );
                    }
                  }
                }
              }
              this.processMetadataInheritance();
              resolve();
            });
          }
        }
      } else throw new Error(`Cant't read service metadata for layer ${this.geoviewLayerId} of map ${this.mapId}.`);
    });
    return promisedExecution;
  }

  /** ***************************************************************************************************************************
   * This method reads the service metadata using a GetCapabilities request.
   *
   * @param {string} metadataUrl The GetCapabilities query to execute
   *
   * @returns {Promise<void>} A promise that the execution is completed.
   */
  private fetchServiceMetadata(url: string): Promise<TypeJsonObject | null> {
    const promisedJsonObject = new Promise<TypeJsonObject | null>((resolve) => {
      fetch(url).then((response) => {
        response.text().then((capabilitiesString) => {
          const parser = new WMSCapabilities();
          const metadata: TypeJsonObject = parser.read(capabilitiesString);
          resolve(metadata);
        });
      });
    });
    return promisedJsonObject;
  }

  /** ***************************************************************************************************************************
   * This method reads the service metadata from a XML metadataAccessPath.
   *
   * @param {string} metadataUrl The localized value of the metadataAccessPath
   *
   * @returns {Promise<void>} A promise that the execution is completed.
   */
  private getXmlServiceMetadata(metadataUrl: string): Promise<void> {
    const promisedExecution = new Promise<void>((resolve) => {
      const parser = new WMSCapabilities();
      fetch(metadataUrl).then((response) => {
        response.text().then((capabilitiesString) => {
          this.metadata = parser.read(capabilitiesString);
          if (this.metadata) {
            this.processMetadataInheritance();
            const metadataAccessPath = this.metadata.Capability.Request.GetMap.DCPType[0].HTTP.Get.OnlineResource as string;
            this.metadataAccessPath.en = metadataAccessPath;
            this.metadataAccessPath.fr = metadataAccessPath;
            const dataAccessPath = this.metadata.Capability.Request.GetMap.DCPType[0].HTTP.Get.OnlineResource as string;
            const setDataAccessPath = (listOfLayerEntryConfig: TypeListOfLayerEntryConfig) => {
              listOfLayerEntryConfig.forEach((layerEntryConfig) => {
                if (layerEntryIsGroupLayer(layerEntryConfig)) setDataAccessPath(layerEntryConfig.listOfLayerEntryConfig);
                else {
                  layerEntryConfig.source!.dataAccessPath!.en = dataAccessPath;
                  layerEntryConfig.source!.dataAccessPath!.fr = dataAccessPath;
                }
              });
            };
            setDataAccessPath(this.listOfLayerEntryConfig);
          }
          resolve();
        });
      });
    });
    return promisedExecution;
  }

  /** ***************************************************************************************************************************
   * This method find the layer path that lead to the layer identified by the layerName. Values stored in the array tell us which
   * direction to use to get to the layer. A value of -1 tells us that the Layer property is an object. Other values tell us that
   * the Layer property is an array and the value is the index to follow. If the layer can not be found, the returned value is
   * an empty array.
   *
   * @param {string} layerName The layer name to be found
   * @param {TypeJsonObject} layerProperty The layer property from the metadata
   * @param {number[]} pathToTheLayerProperty The path leading to the parent of the layerProperty parameter
   *
   * @returns {number[]} An array containing the path to the layer or [] if not found.
   */
  private getMetadataLayerPath(layerName: string, layerProperty: TypeJsonObject, pathToTheParentLayer: number[] = []): number[] {
    const newLayerPath = [...pathToTheParentLayer];
    if (Array.isArray(layerProperty)) {
      for (let i = 0; i < layerProperty.length; i++) {
        newLayerPath.push(i);
        if ('Name' in layerProperty[i] && layerProperty[i].Name === layerName) return newLayerPath;
        if ('Layer' in layerProperty[i]) {
          return this.getMetadataLayerPath(layerName, layerProperty[i].Layer, newLayerPath);
        }
      }
    } else {
      newLayerPath.push(-1);
      if ('Name' in layerProperty && layerProperty.Name === layerName) return newLayerPath;
      if ('Layer' in layerProperty) {
        return this.getMetadataLayerPath(layerName, layerProperty.Layer, newLayerPath);
      }
    }
    return [];
  }

  /** ***************************************************************************************************************************
   * This method merge the layer identified by the path stored in the metadataLayerPathToAdd array to the metadata property of
   * the WMS instance. Values stored in the path array tell us which direction to use to get to the layer. A value of -1 tells us
   * that the Layer property is an object. In this case, it is assumed that the metadata objects at this level only differ by the
   * layer property to add. Other values tell us that the Layer property is an array and the value is the index to follow. If at
   * this level in the path the layers have the same name, we move to the next level. Otherwise, the layer can be added.
   *
   * @param {number[]} metadataLayerPathToAdd The layer name to be found
   * @param {TypeJsonObject} metadataLayer The metadata layer that will receive the new layer
   * @param {TypeJsonObject} layerToAdd The layer property to add
   */
  private addLayerToMetadataInstance(metadataLayerPathToAdd: number[], metadataLayer: TypeJsonObject, layerToAdd: TypeJsonObject) {
    if (metadataLayerPathToAdd.length === 0) return;
    if (metadataLayerPathToAdd[0] === -1)
      this.addLayerToMetadataInstance(metadataLayerPathToAdd.slice(1), metadataLayer.Layer, layerToAdd.Layer);
    else {
      let i: number;
      const metadataLayerFound = (metadataLayer as TypeJsonArray).find(
        (layerEntry) => layerEntry.Name === layerToAdd[metadataLayerPathToAdd[0]].Name
      );
      if (metadataLayerFound)
        this.addLayerToMetadataInstance(
          metadataLayerPathToAdd.slice(1),
          metadataLayerFound.Layer,
          layerToAdd[metadataLayerPathToAdd[0]].Layer
        );
      else (metadataLayer as TypeJsonArray).push(layerToAdd[metadataLayerPathToAdd[0]]);
    }
  }

  /** ***************************************************************************************************************************
   * This method reads the layer identifiers from the configuration to create an array that will be used in the GetCapabilities.
   *
   * @returns {string[]} The array of layer identifiers.
   */
  private getLayersToQuery(): string[] {
    const arrayOfLayerIds: string[] = [];
    const gatherLayerIds = (listOfLayerEntryConfig = this.listOfLayerEntryConfig) => {
      if (listOfLayerEntryConfig.length) {
        listOfLayerEntryConfig.forEach((layerEntryConfig) => {
          if (layerEntryIsGroupLayer(layerEntryConfig)) gatherLayerIds(layerEntryConfig.listOfLayerEntryConfig);
          else arrayOfLayerIds.push(layerEntryConfig.layerId);
        });
      }
    };
    gatherLayerIds();
    return arrayOfLayerIds;
  }

  /** ***************************************************************************************************************************
   * This method propagate the WMS metadata inherited values.
   *
   * @param {TypeJsonObject} parentLayer The parent layer that contains the inherited values
   * @param {TypeJsonObject} layer The layer property from the metadata that will inherit the values
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
          const styleFound = (layer.Style as TypeJsonArray).find((styleEntry) => styleEntry.Name === parentStyle.Name);
          if (!styleFound) (layer.Style as TypeJsonArray).push(parentStyle);
        });
      }
      if (parentLayer.CRS) {
        if (!layer.CRS as TypeJsonArray) (layer.CRS as TypeJsonArray) = [];
        (parentLayer.CRS as TypeJsonArray).forEach((parentCRS) => {
          const crsFound = (layer.CRS as TypeJsonArray).find((crsEntry) => crsEntry.Name === parentCRS);
          if (!crsFound) (layer.CRS as TypeJsonArray).push(parentCRS);
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

      if (!layerEntryConfig.layerName)
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
        const styleToUse =
          Array.isArray(layerEntryConfig.source?.style) && layerEntryConfig.source?.style
            ? layerEntryConfig.source?.style[0]
            : layerEntryConfig.source?.style;
        const sourceOptions: SourceOptions = {
          url: dataAccessPath.endsWith('?') ? dataAccessPath : `${dataAccessPath}?`,
          params: { LAYERS: layerEntryConfig.layerId, STYLES: styleToUse || '' },
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
        // layerEntryConfig.initialSettings cannot be undefined because config-validation set it to {} if it is undefined.
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
        const layerCapabilities = this.getLayerMetadataEntry(layerEntryConfig.layerId)!;
        this.layerMetadata[Layer.getLayerPath(layerEntryConfig)] = layerCapabilities;
        if (layerCapabilities) {
          if (layerCapabilities.Attribution) this.attributions.push(layerCapabilities.Attribution as string);
          if (!layerEntryConfig.source.featureInfo) layerEntryConfig.source.featureInfo = { queryable: !!layerCapabilities.queryable };
          // ! TODO: The solution implemented in the following lines is not right. scale and zoom are not the same things.
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

          if (!layerEntryConfig.initialSettings?.bounds && layerCapabilities.EX_GeographicBoundingBox) {
            layerEntryConfig.initialSettings!.bounds = layerCapabilities.EX_GeographicBoundingBox as Extent;
          }

          if (layerCapabilities.Dimension) {
            const temporalDimension: TypeJsonObject | undefined = (layerCapabilities.Dimension as TypeJsonArray).find(
              (dimension) => dimension.name === 'time'
            );
            if (temporalDimension) this.processTemporalDimension(temporalDimension, layerEntryConfig);
          }
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
      this.layerTemporalDimension[Layer.getLayerPath(layerEntryConfig)] = api.dateUtilities.createDimensionFromOGC(wmsTimeDimension);
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
          lnglat[0] < layerConfig.initialSettings!.bounds![0] ||
          layerConfig.initialSettings!.bounds![2] < lnglat[0] ||
          lnglat[1] < layerConfig.initialSettings!.bounds![1] ||
          layerConfig.initialSettings!.bounds![3] < lnglat[1]
        )
          resolve([]);
        else {
          const wmsSource = (layerConfig.gvLayer as gvLayer).getSource() as ImageWMS;
          let infoFormat = 'text/xml';
          if (!(this.metadata!.Capability.Request.GetFeatureInfo.Format as TypeJsonArray).includes('text/xml' as TypeJsonObject))
            if ((this.metadata!.Capability.Request.GetFeatureInfo.Format as TypeJsonArray).includes('text/plain' as TypeJsonObject))
              infoFormat = 'text/plain';
            else throw new Error('Parameter info_format of GetFeatureInfo only support text/xml and text/plain for WMS services.');

          const featureInfoUrl = wmsSource.getFeatureInfoUrl(clickCoordinate, viewResolution, crs, {
            INFO_FORMAT: infoFormat,
          });
          if (featureInfoUrl) {
            let featureMember: TypeJsonObject | undefined;
            axios(featureInfoUrl).then((response) => {
              if (infoFormat === 'text/xml') {
                const xmlDomResponse = new DOMParser().parseFromString(response.data, 'text/xml');
                const jsonResponse = xmlToJson(xmlDomResponse);
                // ! TODO: We should use a WMS format setting in the schema to decide what feature info response interpreter to use
                // ! For the moment, we try to guess the response format based on properties returned from the query
                const featureCollection = this.getAttribute(jsonResponse, 'FeatureCollection');
                if (featureCollection) featureMember = this.getAttribute(featureCollection, 'featureMember');
                else {
                  const featureInfoResponse = this.getAttribute(jsonResponse, 'GetFeatureInfoResponse');
                  if (featureInfoResponse?.Layer) {
                    featureMember = {};
                    const layerName =
                      featureInfoResponse.Layer['@attributes'] && featureInfoResponse.Layer['@attributes'].name
                        ? (featureInfoResponse.Layer['@attributes'].name as string)
                        : 'undefined';
                    featureMember['Layer name'] = toJsonObject({ '#text': layerName });
                    if (featureInfoResponse.Layer.Attribute && featureInfoResponse.Layer.Attribute['@attributes']) {
                      const fieldName = featureInfoResponse.Layer.Attribute['@attributes'].name
                        ? (featureInfoResponse.Layer.Attribute['@attributes'].name as string)
                        : 'undefined';
                      const fieldValue = featureInfoResponse.Layer.Attribute['@attributes'].value
                        ? (featureInfoResponse.Layer.Attribute['@attributes'].value as string)
                        : 'undefined';
                      featureMember[fieldName] = toJsonObject({ '#text': fieldValue });
                    }
                  }
                }
              } else featureMember = { plain_text: { '#text': response.data } };
              if (featureMember) {
                const featureInfoResult = this.formatWmsFeatureInfoResult(featureMember, layerConfig, clickCoordinate);
                resolve(featureInfoResult);
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
   * @param {TypeWmsLayerEntryConfig} layerConfig layer configuration.
   *
   * @returns {TypeJsonObject | null} URL of a Legend image in png format or null
   */
  private getLegendUrlFromCapabilities(layerConfig: TypeWmsLayerEntryConfig): TypeJsonObject | null {
    const layerCapabilities = this.getLayerMetadataEntry(layerConfig.layerId);
    if (Array.isArray(layerCapabilities?.Style)) {
      const legendStyle = layerCapabilities?.Style.find((style) => {
        if (layerConfig?.source?.style && !Array.isArray(layerConfig?.source?.style)) return layerConfig.source.style === style.Name;
        return style.Name === 'default';
      });
      if (Array.isArray(legendStyle?.LegendURL)) {
        const legendUrl = legendStyle!.LegendURL.find((urlEntry) => {
          if (urlEntry.Format === 'image/png') return true;
          return false;
        });
        return legendUrl || null;
      }
    }
    return null;
  }

  /** ***************************************************************************************************************************
   * Get the legend image of a layer.
   *
   * @param {TypeWmsLayerEntryConfig} layerConfig layer configuration.
   *
   * @returns {blob} image blob
   */
  private getLegendImage(layerConfig: TypeWmsLayerEntryConfig): Promise<string | ArrayBuffer | null> {
    const promisedImage = new Promise<string | ArrayBuffer | null>((resolve) => {
      const readImage = (blob: Blob): Promise<string | ArrayBuffer | null> =>
        // eslint-disable-next-line @typescript-eslint/no-shadow
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(blob);
        });

      let queryUrl: string | undefined;
      const legendUrlFromCapabilities = this.getLegendUrlFromCapabilities(layerConfig);
      if (legendUrlFromCapabilities) queryUrl = legendUrlFromCapabilities.OnlineResource as string;
      else if (Object.keys(this.metadata!.Capability.Request).includes('GetLegendGraphic'))
        queryUrl = `${getLocalizedValue(
          this.metadataAccessPath,
          this.mapId
        )!}service=WMS&version=1.3.0&request=GetLegendGraphic&FORMAT=image/png&layer=${layerConfig.layerId}`;

      if (queryUrl) {
        queryUrl = queryUrl.toLowerCase().startsWith('http:') ? `https${queryUrl.slice(4)}` : queryUrl;
        axios
          .get<TypeJsonObject>(queryUrl, { responseType: 'blob' })
          .then((response) => {
            if (response.data.type === 'text/xml') {
              resolve(null);
            }
            resolve(readImage(Cast<Blob>(response.data)));
          })
          .catch((error) => resolve(null));
      } else resolve(null);
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
      const layerConfig = Cast<TypeWmsLayerEntryConfig | undefined | null>(
        typeof layerPathOrConfig === 'string' ? this.getLayerConfig(layerPathOrConfig) : layerPathOrConfig
      );
      if (!layerConfig) resolve(null);

      this.getLegendImage(layerConfig!).then((legendImage) => {
        if (!legendImage)
          resolve({
            type: this.type,
            layerPath: Layer.getLayerPath(layerConfig!),
            layerName: layerConfig!.layerName,
            legend: null,
          });
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
              } else
                resolve({
                  type: this.type,
                  layerPath: Layer.getLayerPath(layerConfig!),
                  layerName: layerConfig!.layerName,
                  legend: null,
                });
            });
        }
      });
    });
    return promisedLegend;
  }

  /** ***************************************************************************************************************************
   * Translate the get feature information result set to the TypeArrayOfFeatureInfoEntries used by GeoView.
   *
   * @param {TypeJsonObject} featureMember An object formatted using the query syntax.
   * @param {TypeWmsLayerEntryConfig} layerEntryConfig The layer configuration.
   * @param {Coordinate} clickCoordinate The coordinate where the user has clicked.
   *
   * @returns {TypeArrayOfFeatureInfoEntries} The feature info table.
   */
  formatWmsFeatureInfoResult(
    featureMember: TypeJsonObject,
    layerEntryConfig: TypeWmsLayerEntryConfig,
    clickCoordinate: Coordinate
  ): TypeArrayOfFeatureInfoEntries {
    const featureInfo = layerEntryConfig?.source?.featureInfo;
    const outfields = getLocalizedValue(featureInfo?.outfields, this.mapId)?.split(',');
    const fieldTypes = featureInfo?.fieldTypes?.split(',');
    const aliasFields = getLocalizedValue(featureInfo?.aliasFields, this.mapId)?.split(',');
    const queryResult: TypeArrayOfFeatureInfoEntries = [];

    let featureKeyCounter = 0;
    let fieldKeyCounter = 0;
    const featureInfoEntry: TypeFeatureInfoEntry = {
      // feature key for building the data-grid
      featureKey: featureKeyCounter++,
      geoviewLayerType: this.type,
      extent: [clickCoordinate[0], clickCoordinate[1], clickCoordinate[0], clickCoordinate[1]],
      geometry: null,
      featureIcon: document.createElement('canvas'),
      fieldInfo: {},
    };
    const createFieldEntries = (entry: TypeJsonObject, prefix = '') => {
      const keys = Object.keys(entry);
      keys.forEach((key) => {
        if (!key.endsWith('Geometry') && !key.startsWith('@')) {
          const splitedKey = key.split(':');
          const fieldName = splitedKey.slice(-1)[0];
          if ('#text' in entry[key])
            featureInfoEntry.fieldInfo[`${prefix}${prefix ? '.' : ''}${fieldName}`] = {
              fieldKey: fieldKeyCounter++,
              value: entry[key]['#text'] as string,
              dataType: 'string',
              alias: `${prefix}${prefix ? '.' : ''}${fieldName}`,
              domain: null,
            };
          else createFieldEntries(entry[key], fieldName);
        }
      });
    };
    createFieldEntries(featureMember);

    if (!outfields) queryResult.push(featureInfoEntry);
    else {
      fieldKeyCounter = 0;
      const fieldsToDelete = Object.keys(featureInfoEntry.fieldInfo).filter((fieldName) => {
        if (outfields?.includes(fieldName)) {
          const fieldIndex = outfields.indexOf(fieldName);
          featureInfoEntry.fieldInfo[fieldName]!.fieldKey = fieldKeyCounter++;
          featureInfoEntry.fieldInfo[fieldName]!.alias = aliasFields![fieldIndex];
          featureInfoEntry.fieldInfo[fieldName]!.dataType = fieldTypes![fieldIndex] as 'string' | 'date' | 'number';
          return false; // keep this entry
        }
        return true; // delete this entry
      });
      fieldsToDelete.forEach((entryToDelete) => {
        delete featureInfoEntry.fieldInfo[entryToDelete];
      });
      queryResult.push(featureInfoEntry);
    }
    return queryResult;
  }

  /** ***************************************************************************************************************************
   * Return the attribute of an object that ends with the specified ending string or null if not found.
   *
   * @param {TypeJsonObject} jsonObject The object that is supposed to have the needed attribute.
   * @param {string} attribute The attribute searched.
   *
   * @returns {TypeJsonObject | undefined} The promised feature info table.
   */
  private getAttribute(jsonObject: TypeJsonObject, attributeEnding: string): TypeJsonObject | undefined {
    const keyFound = Object.keys(jsonObject).find((key) => key.endsWith(attributeEnding));
    return keyFound ? jsonObject[keyFound] : undefined;
  }

  /** ***************************************************************************************************************************
   * Return the attribute of an object that ends with the specified ending string or null if not found.
   *
   * @param {TypeJsonObject} jsonObject The object that is supposed to have the needed attribute.
   * @param {string} attribute The attribute searched.
   *
   * @returns {TypeJsonObject | undefined} The promised feature info table.
   */
  setStyle(StyleId: string, layerPathOrConfig: string | TypeLayerEntryConfig | null = this.activeLayer) {
    const layerConfig = Cast<TypeWmsLayerEntryConfig | undefined | null>(
      typeof layerPathOrConfig === 'string' ? this.getLayerConfig(layerPathOrConfig) : layerPathOrConfig
    );
    if (layerConfig?.gvLayer) (layerConfig.gvLayer as ImageLayer<ImageWMS>).getSource()?.updateParams({ STYLES: StyleId });
  }
}
