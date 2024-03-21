/* eslint-disable no-param-reassign */
// We have many reassign for layer-layerConfig. We keep it global...
import axios from 'axios';

import ImageLayer from 'ol/layer/Image';
import { Coordinate } from 'ol/coordinate';
import { Pixel } from 'ol/pixel';
import { Options as ImageOptions } from 'ol/layer/BaseImage';
import { ImageWMS } from 'ol/source';
import { Options as SourceOptions } from 'ol/source/ImageWMS';
import WMSCapabilities from 'ol/format/WMSCapabilities';
import { Layer as OlLayer } from 'ol/layer';
import { Extent } from 'ol/extent';

import cloneDeep from 'lodash/cloneDeep';

import Static from 'ol/source/ImageStatic';
import { Cast, toJsonObject, TypeJsonArray, TypeJsonObject } from '@/core/types/global-types';
import {
  AbstractGeoViewLayer,
  CONST_LAYER_TYPES,
  TypeLegend,
  TypeWmsLegend,
  TypeWmsLegendStyle,
} from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { AbstractGeoViewRaster, TypeBaseRasterLayer } from '@/geo/layer/geoview-layers/raster/abstract-geoview-raster';
import {
  TypeLayerEntryConfig,
  TypeGeoviewLayerConfig,
  TypeListOfLayerEntryConfig,
  layerEntryIsGroupLayer,
  CONST_LAYER_ENTRY_TYPES,
} from '@/geo/map/map-schema-types';
import { getLocalizedValue, getMinOrMaxExtents, xmlToJson, showError, replaceParams, getLocalizedMessage } from '@/core/utils/utilities';
import { api } from '@/app';
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';
import { logger } from '@/core/utils/logger';
import { OgcWmsLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/ogc-wms-layer-entry-config';
import { AbstractBaseLayerEntryConfig } from '@/core/utils/config/validation-classes/abstract-base-layer-entry-config';
import { GroupLayerEntryConfig } from '@/core/utils/config/validation-classes/group-layer-entry-config';
import { TypeFeatureInfoEntry } from '@/geo/utils/layer-set';

export interface TypeWMSLayerConfig extends Omit<TypeGeoviewLayerConfig, 'listOfLayerEntryConfig'> {
  geoviewLayerType: typeof CONST_LAYER_TYPES.WMS;
  listOfLayerEntryConfig: OgcWmsLayerEntryConfig[];
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
 * type guard function that redefines a TypeLayerEntryConfig as a OgcWmsLayerEntryConfig if the geoviewLayerType attribute of the
 * verifyIfGeoViewEntry.geoviewLayerConfig attribute is WMS. The type ascention applies only to the true block of
 * the if clause that use this function.
 *
 * @param {TypeLayerEntryConfig} verifyIfGeoViewEntry Polymorphic object to test in order to determine if the type ascention is
 * valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const geoviewEntryIsWMS = (verifyIfGeoViewEntry: TypeLayerEntryConfig): verifyIfGeoViewEntry is OgcWmsLayerEntryConfig => {
  return verifyIfGeoViewEntry?.geoviewLayerConfig?.geoviewLayerType === CONST_LAYER_TYPES.WMS;
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
  WMSStyles: string[];

  /** ***************************************************************************************************************************
   * Initialize layer
   * @param {string} mapId the id of the map
   * @param {TypeWMSLayerConfig} layerConfig the layer configuration
   */
  constructor(mapId: string, layerConfig: TypeWMSLayerConfig) {
    super(CONST_LAYER_TYPES.WMS, layerConfig, mapId);
    this.WMSStyles = [];
  }

  /** ***************************************************************************************************************************
   * This method reads the service metadata from the metadataAccessPath.
   *
   * @returns {Promise<void>} A promise that the execution is completed.
   */
  protected async fetchServiceMetadata(): Promise<void> {
    const metadataUrl = getLocalizedValue(this.metadataAccessPath, this.mapId);
    if (metadataUrl) {
      const metadataAccessPathIsXmlFile = metadataUrl.slice(-4).toLowerCase() === '.xml';
      if (metadataAccessPathIsXmlFile) {
        // XML metadata is a special case that does not use GetCapabilities to get the metadata
        await this.fetchXmlServiceMetadata(metadataUrl);
      } else {
        const layerConfigsToQuery = this.getLayersToQuery();
        if (layerConfigsToQuery.length === 0) {
          // Use GetCapabilities to get the metadata
          try {
            const metadata = await this.getServiceMetadata(`${metadataUrl}?service=WMS&version=1.3.0&request=GetCapabilities`);
            this.metadata = metadata;
            this.processMetadataInheritance();
          } catch (error) {
            // Log
            logger.logError(`Unable to read service metadata for GeoView layer ${this.geoviewLayerId} of map ${this.mapId}.`);
          }
        } else {
          // Uses GetCapabilities to get the metadata. However, to allow geomet metadata to be retrieved using the non-standard
          // "Layers" parameter on the command line, we need to process each layer individually and merge all layer metadata at
          // the end. Even though the "Layers" parameter is ignored by other WMS servers, the drawback of this method is
          // sending unnecessary requests while only one GetCapabilities could be used when the server publishes a small set of
          // metadata. Which is not the case for the Geomet service.
          const promisedArrayOfMetadata: Promise<TypeJsonObject | null>[] = [];
          let i: number;
          layerConfigsToQuery.forEach((layerConfig: TypeLayerEntryConfig, layerIndex: number) => {
            for (i = 0; layerConfigsToQuery[i].layerId !== layerConfig.layerId; i++);
            if (i === layerIndex)
              // This is the first time we execute this query
              promisedArrayOfMetadata.push(
                this.getServiceMetadata(`${metadataUrl}?service=WMS&version=1.3.0&request=GetCapabilities&Layers=${layerConfig.layerId}`)
              );
            // query already done. Use previous returned value
            else promisedArrayOfMetadata.push(promisedArrayOfMetadata[i]);
          });
          try {
            const arrayOfMetadata = await Promise.all(promisedArrayOfMetadata);
            for (i = 0; i < arrayOfMetadata.length && !arrayOfMetadata[i]?.Capability; i++)
              this.getLayerConfig(layerConfigsToQuery[i].layerPath)!.layerStatus = 'error';
            this.metadata = i < arrayOfMetadata.length ? arrayOfMetadata[i] : null;
            if (this.metadata) {
              for (; i < arrayOfMetadata.length; i++) {
                if (!arrayOfMetadata[i]?.Capability) this.getLayerConfig(layerConfigsToQuery[i].layerPath)!.layerStatus = 'error';
                else if (!this.getLayerMetadataEntry(layerConfigsToQuery[i].layerId!)) {
                  const metadataLayerPathToAdd = this.getMetadataLayerPath(
                    layerConfigsToQuery[i].layerId!,
                    arrayOfMetadata[i]!.Capability.Layer
                  );
                  this.addLayerToMetadataInstance(
                    metadataLayerPathToAdd,
                    this.metadata?.Capability?.Layer,
                    arrayOfMetadata[i]!.Capability.Layer
                  );
                }
              }
            }
            this.processMetadataInheritance();
          } catch (error) {
            this.setAllLayerStatusTo('error', this.listOfLayerEntryConfig, 'Unable to read metadata');
          }
        }
      }
    } else {
      this.setAllLayerStatusTo('error', this.listOfLayerEntryConfig, 'Unable to read metadata');
    }
  }

  /** ***************************************************************************************************************************
   * This method reads the service metadata using a GetCapabilities request.
   *
   * @param {string} metadataUrl The GetCapabilities query to execute
   *
   * @returns {Promise<void>} A promise that the execution is completed.
   */
  private async getServiceMetadata(url: string): Promise<TypeJsonObject | null> {
    try {
      const response = await fetch(url);
      const capabilitiesString = await response.text();
      const parser = new WMSCapabilities();
      const metadata: TypeJsonObject = parser.read(capabilitiesString);
      return metadata;
    } catch (error) {
      this.setAllLayerStatusTo('error', this.listOfLayerEntryConfig, 'Unable to read metadata');
      return null;
    }
  }

  /** ***************************************************************************************************************************
   * This method reads the service metadata from a XML metadataAccessPath.
   *
   * @param {string} metadataUrl The localized value of the metadataAccessPath
   *
   * @returns {Promise<void>} A promise that the execution is completed.
   */
  private async fetchXmlServiceMetadata(metadataUrl: string): Promise<void> {
    try {
      const parser = new WMSCapabilities();
      const response = await fetch(metadataUrl);
      const capabilitiesString = await response.text();
      this.metadata = parser.read(capabilitiesString);
      if (this.metadata) {
        this.processMetadataInheritance();
        const metadataAccessPath = this.metadata.Capability.Request.GetMap.DCPType[0].HTTP.Get.OnlineResource as string;
        this.metadataAccessPath.en = metadataAccessPath;
        this.metadataAccessPath.fr = metadataAccessPath;
        const dataAccessPath = this.metadata.Capability.Request.GetMap.DCPType[0].HTTP.Get.OnlineResource as string;
        const setDataAccessPath = (listOfLayerEntryConfig: TypeListOfLayerEntryConfig) => {
          listOfLayerEntryConfig.forEach((layerConfig) => {
            if (layerEntryIsGroupLayer(layerConfig)) setDataAccessPath(layerConfig.listOfLayerEntryConfig);
            else {
              layerConfig.source!.dataAccessPath!.en = dataAccessPath;
              layerConfig.source!.dataAccessPath!.fr = dataAccessPath;
            }
          });
        };
        setDataAccessPath(this.listOfLayerEntryConfig);
      } else {
        this.setAllLayerStatusTo('error', this.listOfLayerEntryConfig, 'Unable to read metadata');
      }
    } catch (error) {
      this.setAllLayerStatusTo('error', this.listOfLayerEntryConfig, 'Unable to read metadata');
    }
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
   * @param {TypeJsonObject | undefined} metadataLayer The metadata layer that will receive the new layer
   * @param {TypeJsonObject} layerToAdd The layer property to add
   */
  private addLayerToMetadataInstance(
    metadataLayerPathToAdd: number[],
    metadataLayer: TypeJsonObject | undefined,
    layerToAdd: TypeJsonObject
  ) {
    if (metadataLayerPathToAdd.length === 0 || !metadataLayer) return;
    if (metadataLayerPathToAdd[0] === -1)
      this.addLayerToMetadataInstance(metadataLayerPathToAdd.slice(1), metadataLayer.Layer, layerToAdd.Layer);
    else {
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
   * @returns {TypeLayerEntryConfig[]} The array of layer configurations.
   */
  private getLayersToQuery(): TypeLayerEntryConfig[] {
    const arrayOfLayerIds: TypeLayerEntryConfig[] = [];
    const gatherLayerIds = (listOfLayerEntryConfig = this.listOfLayerEntryConfig) => {
      if (listOfLayerEntryConfig.length) {
        listOfLayerEntryConfig.forEach((layerConfig) => {
          if (layerEntryIsGroupLayer(layerConfig)) gatherLayerIds(layerConfig.listOfLayerEntryConfig);
          else arrayOfLayerIds.push(layerConfig);
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
   * @param {TypeJsonObject | undefined} layer The layer property from the metadata that will inherit the values
   */
  private processMetadataInheritance(parentLayer?: TypeJsonObject, layer: TypeJsonObject | undefined = this.metadata?.Capability?.Layer) {
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
    if (layer?.Layer !== undefined) (layer.Layer as TypeJsonArray).forEach((subLayer) => this.processMetadataInheritance(layer, subLayer));
  }

  /** ***************************************************************************************************************************
   * This method recursively validates the configuration of the layer entries to ensure that each layer is correctly defined.
   *
   * @param {TypeListOfLayerEntryConfig} listOfLayerEntryConfig The list of layer entries configuration to validate.
   */
  protected validateListOfLayerEntryConfig(listOfLayerEntryConfig: TypeListOfLayerEntryConfig) {
    listOfLayerEntryConfig.forEach((layerConfig: TypeLayerEntryConfig) => {
      const { layerPath } = layerConfig;
      if (layerEntryIsGroupLayer(layerConfig)) {
        this.validateListOfLayerEntryConfig(layerConfig.listOfLayerEntryConfig!);
        if (!layerConfig?.listOfLayerEntryConfig?.length) {
          this.layerLoadError.push({
            layer: layerPath,
            loggerMessage: `Empty layer group (mapId:  ${this.mapId}, layerPath: ${layerPath})`,
          });
          layerConfig.layerStatus = 'error';
        }
        return;
      }

      if ((layerConfig as AbstractBaseLayerEntryConfig).layerStatus !== 'error') {
        layerConfig.layerStatus = 'processing';

        const layerFound = this.getLayerMetadataEntry(layerConfig.layerId!);
        if (!layerFound) {
          this.layerLoadError.push({
            layer: layerPath,
            loggerMessage: `Layer metadata not found (mapId:  ${this.mapId}, layerPath: ${layerPath})`,
          });
          layerConfig.layerStatus = 'error';
          return;
        }

        if ('Layer' in layerFound) {
          this.createGroupLayer(layerFound, layerConfig as AbstractBaseLayerEntryConfig);
          return;
        }

        if (!layerConfig.layerName)
          layerConfig.layerName = {
            en: layerFound.Title as string,
            fr: layerFound.Title as string,
          };
      }
    });
  }

  /** ***************************************************************************************************************************
   * This method create recursively dynamic group layers from the service metadata.
   *
   * @param {TypeJsonObject} layer The dynamic group layer metadata.
   * @param {AbstractBaseLayerEntryConfig} layerConfig The layer configurstion associated to the dynamic group.
   */
  private createGroupLayer(layer: TypeJsonObject, layerConfig: AbstractBaseLayerEntryConfig) {
    // TODO: Refactor - createGroup is the same thing for all the layers type? group is a geoview structure.
    // TO.DOCONT: Should it be handle upper in abstract class to loop in structure and launch the creation of a leaf?
    const newListOfLayerEntryConfig: TypeListOfLayerEntryConfig = [];
    const arrayOfLayerMetadata = Array.isArray(layer.Layer) ? layer.Layer : ([layer.Layer] as TypeJsonArray);

    arrayOfLayerMetadata.forEach((subLayer) => {
      // Log for pertinent debugging purposes
      logger.logTraceCore('WMS - createGroupLayer', 'Cloning the layer config', layerConfig.layerPath);
      const subLayerEntryConfig: TypeLayerEntryConfig = cloneDeep(layerConfig);
      subLayerEntryConfig.parentLayerConfig = Cast<GroupLayerEntryConfig>(layerConfig);
      subLayerEntryConfig.layerId = subLayer.Name as string;
      subLayerEntryConfig.layerName = {
        en: subLayer.Title as string,
        fr: subLayer.Title as string,
      };
      newListOfLayerEntryConfig.push(subLayerEntryConfig);
      subLayerEntryConfig.registerLayerConfig();
    });

    const switchToGroupLayer = Cast<GroupLayerEntryConfig>(layerConfig);
    switchToGroupLayer.entryType = CONST_LAYER_ENTRY_TYPES.GROUP;
    switchToGroupLayer.layerName = {
      en: layer.Title as string,
      fr: layer.Title as string,
    };
    switchToGroupLayer.isMetadataLayerGroup = true;
    switchToGroupLayer.listOfLayerEntryConfig = newListOfLayerEntryConfig;
    this.validateListOfLayerEntryConfig(newListOfLayerEntryConfig);
  }

  /** ****************************************************************************************************************************
   * This method search recursively the layerId in the layer entry of the capabilities.
   *
   * @param {string} layerId The layer identifier that must exists on the server.
   * @param {TypeJsonObject | undefined} layer The layer entry from the capabilities that will be searched.
   *
   * @returns {TypeJsonObject | null} The found layer from the capabilities or null if not found.
   */
  private getLayerMetadataEntry(
    layerId: string,
    layer: TypeJsonObject | undefined = this.metadata?.Capability?.Layer
  ): TypeJsonObject | null {
    if (!layer) return null;
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
   * This method creates a GeoView WMS layer using the definition provided in the layerConfig parameter.
   *
   * @param {AbstractBaseLayerEntryConfig} layerConfig Information needed to create the GeoView layer.
   *
   * @returns {TypeBaseRasterLayer | null} The GeoView raster layer that has been created.
   */
  protected processOneLayerEntry(layerConfig: AbstractBaseLayerEntryConfig): Promise<TypeBaseRasterLayer | null> {
    // ! IMPORTANT: The processOneLayerEntry method must call the corresponding method of its parent to ensure that the flow of
    // !            layerStatus values is correctly sequenced.
    super.processOneLayerEntry(layerConfig);
    // Log
    logger.logTraceCore('WMS - processOneLayerEntry', layerConfig.layerPath);

    if (geoviewEntryIsWMS(layerConfig)) {
      const layerCapabilities = this.getLayerMetadataEntry(layerConfig.layerId);
      if (layerCapabilities) {
        const dataAccessPath = getLocalizedValue(layerConfig.source.dataAccessPath, this.mapId)!;

        let styleToUse = '';
        if (Array.isArray(layerConfig.source?.style) && layerConfig.source?.style) {
          styleToUse = layerConfig.source?.style[0];
        } else if (layerConfig.source.style) {
          styleToUse = layerConfig.source?.style as string;
        } else if (layerCapabilities.Style) {
          styleToUse = layerCapabilities.Style[0].Name as string;
        }

        if (Array.isArray(layerConfig.source?.style)) {
          this.WMSStyles = layerConfig.source.style;
        } else if ((layerCapabilities.Style.length as number) > 1) {
          this.WMSStyles = [];
          for (let i = 0; i < (layerCapabilities.Style.length as number); i++) {
            this.WMSStyles.push(layerCapabilities.Style[i].Name as string);
          }
        } else this.WMSStyles = [styleToUse];

        const sourceOptions: SourceOptions = {
          url: dataAccessPath.endsWith('?') ? dataAccessPath : `${dataAccessPath}?`,
          params: { LAYERS: layerConfig.layerId, STYLES: styleToUse },
        };

        sourceOptions.attributions = this.attributions;
        sourceOptions.serverType = layerConfig.source.serverType;
        if (layerConfig.source.crossOrigin) {
          sourceOptions.crossOrigin = layerConfig.source.crossOrigin;
        } else {
          sourceOptions.crossOrigin = 'Anonymous';
        }
        if (layerConfig.source.projection) sourceOptions.projection = `EPSG:${layerConfig.source.projection}`;

        const imageLayerOptions: ImageOptions<ImageWMS> = {
          source: new ImageWMS(sourceOptions),
          properties: { layerCapabilities, layerConfig },
        };
        // layerConfig.initialSettings cannot be undefined because config-validation set it to {} if it is undefined.
        if (layerConfig.initialSettings?.className !== undefined) imageLayerOptions.className = layerConfig.initialSettings?.className;
        if (layerConfig.initialSettings?.extent !== undefined) imageLayerOptions.extent = layerConfig.initialSettings?.extent;
        if (layerConfig.initialSettings?.maxZoom !== undefined) imageLayerOptions.maxZoom = layerConfig.initialSettings?.maxZoom;
        if (layerConfig.initialSettings?.minZoom !== undefined) imageLayerOptions.minZoom = layerConfig.initialSettings?.minZoom;
        if (layerConfig.initialSettings?.opacity !== undefined) imageLayerOptions.opacity = layerConfig.initialSettings?.opacity;
        // ! IMPORTANT: The initialSettings.visible flag must be set in the layerConfig.loadedFunction otherwise the layer will stall
        // !            in the 'loading' state if the flag value is 'no'.

        layerConfig.olLayerAndLoadEndListeners = {
          olLayer: new ImageLayer(imageLayerOptions),
          loadEndListenerType: 'image',
        };
        layerConfig.geoviewLayerInstance = this;

        return Promise.resolve(layerConfig.olLayer);
      }

      const message = replaceParams(
        [layerConfig.layerId, this.geoviewLayerId],
        getLocalizedMessage(this.mapId, 'validation.layer.notfound')
      );
      showError(this.mapId, message);
      return Promise.resolve(null);
    }

    logger.logError(`geoviewLayerType must be ${CONST_LAYER_TYPES.WMS}`);
    return Promise.resolve(null);
  }

  /** ***************************************************************************************************************************
   * This method is used to process the layer's metadata. It will fill the empty fields of the layer's configuration (renderer,
   * initial settings, fields and aliases).
   *
   * @returns {Promise<TypeLayerEntryConfig>} A promise that the layer configuration has its metadata processed.
   */
  protected processLayerMetadata(layerConfig: TypeLayerEntryConfig): Promise<TypeLayerEntryConfig> {
    if (geoviewEntryIsWMS(layerConfig)) {
      const layerCapabilities = this.getLayerMetadataEntry(layerConfig.layerId)!;
      this.layerMetadata[layerConfig.layerPath] = layerCapabilities;
      if (layerCapabilities) {
        if (layerCapabilities.Attribution) this.attributions.push(layerCapabilities.Attribution.Title as string);
        if (!layerConfig.source.featureInfo) layerConfig.source.featureInfo = { queryable: !!layerCapabilities.queryable };
        MapEventProcessor.setMapLayerQueryable(this.mapId, layerConfig.layerPath, layerConfig.source.featureInfo.queryable);
        // ! TODO: The solution implemented in the following lines is not right. scale and zoom are not the same things.
        // if (layerConfig.initialSettings?.minZoom === undefined && layerCapabilities.MinScaleDenominator !== undefined)
        //   layerConfig.initialSettings.minZoom = layerCapabilities.MinScaleDenominator as number;
        // if (layerConfig.initialSettings?.maxZoom === undefined && layerCapabilities.MaxScaleDenominator !== undefined)
        //   layerConfig.initialSettings.maxZoom = layerCapabilities.MaxScaleDenominator as number;
        if (layerConfig.initialSettings?.extent)
          layerConfig.initialSettings.extent = api.projection.transformExtent(
            layerConfig.initialSettings.extent,
            'EPSG:4326',
            `EPSG:${MapEventProcessor.getMapState(this.mapId).currentProjection}`
          );

        if (!layerConfig.initialSettings?.bounds && layerCapabilities.EX_GeographicBoundingBox) {
          layerConfig.initialSettings!.bounds = layerCapabilities.EX_GeographicBoundingBox as Extent;
        }

        if (layerCapabilities.Dimension) {
          const temporalDimension: TypeJsonObject | undefined = (layerCapabilities.Dimension as TypeJsonArray).find(
            (dimension) => dimension.name === 'time'
          );
          if (temporalDimension) this.processTemporalDimension(temporalDimension, layerConfig);
        }
      }
    }
    return Promise.resolve(layerConfig);
  }

  /** ***************************************************************************************************************************
   * This method will create a Geoview temporal dimension if it existds in the service metadata
   * @param {TypeJsonObject} wmsTimeDimension The WMS time dimension object
   * @param {OgcWmsLayerEntryConfig} layerConfig The layer entry to configure
   */
  protected processTemporalDimension(wmsTimeDimension: TypeJsonObject, layerConfig: OgcWmsLayerEntryConfig) {
    if (wmsTimeDimension !== undefined) {
      this.layerTemporalDimension[layerConfig.layerPath] = api.dateUtilities.createDimensionFromOGC(wmsTimeDimension);
    }
  }

  /** ***************************************************************************************************************************
   * Return feature information for all the features around the provided Pixel.
   *
   * @param {Coordinate} location The pixel coordinate that will be used by the query.
   * @param {string} layerPath The layer path to the layer's configuration.
   *
   * @returns {Promise<TypeFeatureInfoEntry[] | undefined | null>} The feature info table.
   */
  protected getFeatureInfoAtPixel(location: Pixel, layerPath: string): Promise<TypeFeatureInfoEntry[] | undefined | null> {
    const { map } = api.maps[this.mapId];
    return this.getFeatureInfoAtCoordinate(map.getCoordinateFromPixel(location), layerPath);
  }

  /** ***************************************************************************************************************************
   * Return feature information for all the features around the provided projection coordinate.
   *
   * @param {Coordinate} location The coordinate that will be used by the query.
   * @param {string} layerPath The layer path to the layer's configuration.
   *
   * @returns {Promise<TypeFeatureInfoEntry[] | undefined | null>} The promised feature info table.
   */
  protected getFeatureInfoAtCoordinate(location: Coordinate, layerPath: string): Promise<TypeFeatureInfoEntry[] | undefined | null> {
    const convertedLocation = api.projection.transform(
      location,
      `EPSG:${MapEventProcessor.getMapState(this.mapId).currentProjection}`,
      'EPSG:4326'
    );
    return this.getFeatureInfoAtLongLat(convertedLocation, layerPath);
  }

  /** ***************************************************************************************************************************
   * Return feature information for all the features around the provided coordinate.
   *
   * @param {Coordinate} lnglat The coordinate that will be used by the query.
   * @param {string} layerPath The layer path to the layer's configuration.
   *
   * @returns {Promise<TypeFeatureInfoEntry[] | undefined | null>} The promised feature info table.
   */
  protected async getFeatureInfoAtLongLat(lnglat: Coordinate, layerPath: string): Promise<TypeFeatureInfoEntry[] | undefined | null> {
    try {
      // Get the layer config in a loaded phase
      const layerConfig = this.getLayerConfig(layerPath) as OgcWmsLayerEntryConfig;
      if (!this.getVisible(layerPath)) return [];

      const viewResolution = api.maps[this.mapId].getView().getResolution() as number;
      const crs = `EPSG:${MapEventProcessor.getMapState(this.mapId).currentProjection}`;
      const clickCoordinate = api.projection.transform(lnglat, 'EPSG:4326', crs);
      if (
        lnglat[0] < layerConfig.initialSettings!.bounds![0] ||
        layerConfig.initialSettings!.bounds![2] < lnglat[0] ||
        lnglat[1] < layerConfig.initialSettings!.bounds![1] ||
        layerConfig.initialSettings!.bounds![3] < lnglat[1]
      )
        return [];

      const wmsSource = (layerConfig.olLayer as OlLayer).getSource() as ImageWMS;
      let infoFormat = '';
      const featureInfoFormat = this.metadata?.Capability?.Request?.GetFeatureInfo?.Format as TypeJsonArray;
      if (featureInfoFormat)
        if (featureInfoFormat.includes('text/xml' as TypeJsonObject)) infoFormat = 'text/xml';
        else if (featureInfoFormat.includes('text/plain' as TypeJsonObject)) infoFormat = 'text/plain';
        else throw new Error('Parameter info_format of GetFeatureInfo only support text/xml and text/plain for WMS services.');

      const featureInfoUrl = wmsSource.getFeatureInfoUrl(clickCoordinate, viewResolution, crs, {
        INFO_FORMAT: infoFormat,
      });
      if (featureInfoUrl) {
        let featureMember: TypeJsonObject | undefined;
        const response = await axios(featureInfoUrl);
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
          return featureInfoResult;
        }
      }
      return [];
    } catch (error) {
      // Log
      logger.logError('wms.getFeatureInfoAtLongLat()\n', error);
      return null;
    }
  }

  /** ***************************************************************************************************************************
   * Get the legend image URL of a layer from the capabilities. Return null if it does not exist.
   *
   * @param {OgcWmsLayerEntryConfig} layerConfig layer configuration.
   * @param {string} style the style to get the url for
   *
   * @returns {TypeJsonObject | null} URL of a Legend image in png format or null
   */
  private getLegendUrlFromCapabilities(layerConfig: OgcWmsLayerEntryConfig, chosenStyle?: string): TypeJsonObject | null {
    const layerCapabilities = this.getLayerMetadataEntry(layerConfig.layerId);
    if (Array.isArray(layerCapabilities?.Style)) {
      let legendStyle;
      if (chosenStyle) {
        [legendStyle] = layerCapabilities!.Style.filter((style) => {
          return style.Name === chosenStyle;
        });
      } else {
        legendStyle = layerCapabilities?.Style.find((style) => {
          if (layerConfig?.source?.style && !Array.isArray(layerConfig?.source?.style)) return layerConfig.source.style === style.Name;
          return style.Name === 'default';
        });
      }

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
   * @param {OgcWmsLayerEntryConfig} layerConfig layer configuration.
   * @param {striung} chosenStyle Style to get the legend image for.
   *
   * @returns {blob} image blob
   */
  private getLegendImage(layerConfig: OgcWmsLayerEntryConfig, chosenStyle?: string): Promise<string | ArrayBuffer | null> {
    const promisedImage = new Promise<string | ArrayBuffer | null>((resolve) => {
      const readImage = (blob: Blob): Promise<string | ArrayBuffer | null> =>
        new Promise((resolveImage) => {
          const reader = new FileReader();
          reader.onloadend = () => resolveImage(reader.result);
          reader.onerror = () => resolveImage(null);
          reader.readAsDataURL(blob);
        });

      let queryUrl: string | undefined;
      const legendUrlFromCapabilities = this.getLegendUrlFromCapabilities(layerConfig, chosenStyle);
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
          .catch(() => resolve(null));
      } else resolve(null);
    });
    return promisedImage;
  }

  /** ***************************************************************************************************************************
   * Get the legend info of a style.
   *
   * @param {OgcWmsLayerEntryConfig} layerConfig layer configuration.
   * @param {number} position index number of style to get
   *
   * @returns {Promise<TypeWmsLegendStylel>} The legend of the style.
   */
  private async getStyleLegend(layerConfig: OgcWmsLayerEntryConfig, position: number): Promise<TypeWmsLegendStyle> {
    try {
      const chosenStyle: string | undefined = this.WMSStyles[position];
      let styleLegend: TypeWmsLegendStyle;
      const styleLegendImage = await this.getLegendImage(layerConfig!, chosenStyle);
      if (!styleLegendImage) {
        styleLegend = {
          name: this.WMSStyles[position],
          legend: null,
        };
        return styleLegend;
      }

      const styleImage = await api.maps[this.mapId].geoviewRenderer.loadImage(styleLegendImage as string);
      if (styleImage) {
        const drawingCanvas = document.createElement('canvas');
        drawingCanvas.width = styleImage.width;
        drawingCanvas.height = styleImage.height;
        const drawingContext = drawingCanvas.getContext('2d')!;
        drawingContext.drawImage(styleImage, 0, 0);
        styleLegend = {
          name: this.WMSStyles[position],
          legend: drawingCanvas,
        };
        return styleLegend;
      }

      return {
        name: this.WMSStyles[position],
        legend: null,
      } as TypeWmsLegendStyle;
    } catch (error) {
      return {
        name: this.WMSStyles[position],
        legend: null,
      } as TypeWmsLegendStyle;
    }
  }

  /** ***************************************************************************************************************************
   * Return the legend of the layer. This routine return null when the layerPath specified is not found. If the legend can't be
   * read, the legend property of the object returned will be null.
   *
   * @param {string} layerPath The layer path to the layer's configuration.
   *
   * @returns {Promise<TypeLegend | null>} The legend of the layer or null.
   */
  async getLegend(layerPath: string): Promise<TypeLegend | null> {
    try {
      // Get the layer config in a loaded phase
      const layerConfig = this.getLayerConfig(layerPath) as OgcWmsLayerEntryConfig;

      let legend: TypeWmsLegend;
      const legendImage = await this.getLegendImage(layerConfig!);
      const styleLegends: TypeWmsLegendStyle[] = [];
      if (this.WMSStyles.length > 1) {
        for (let i = 0; i < this.WMSStyles.length; i++) {
          // TODO: refactor - does this await in a loop may haev an impact on performance?
          // TO.DOCONT: In this case here, when glancing at the code, the only reason to await would be if the order that the styleLegend
          // TO.DOCONT: get added to the styleLegends array MUST be the same order as they are in the WMSStyles array (as in they are 2 arrays with same indexes pointers).
          // TO.DOCONT: Without the await, WMSStyles[2] stuff could be associated with something in styleLegends[1] position for example (1<>2).
          // TO.DOCONT: If we remove the await, be mindful of that (maybe add this remark in the TODO?).
          // TO.DOCONT: In any case, I'd suggest to remove the await indeed, for performance, and rewrite the code to make it work (probably not 2 distinct arrays).
          // TODO: refactor - never call an explicit function with an index counter. this.WMSStyles[i] should be sent to the getStyleLegend function instead of doing the this.WMSStyles[i] in the latter. Would read a lot better and more easily reused.
          // eslint-disable-next-line no-await-in-loop
          const styleLegend = await this.getStyleLegend(layerConfig!, i);
          styleLegends.push(styleLegend);
        }
      }

      if (legendImage) {
        const image = await api.maps[this.mapId].geoviewRenderer.loadImage(legendImage as string);
        if (image) {
          const drawingCanvas = document.createElement('canvas');
          drawingCanvas.width = image.width;
          drawingCanvas.height = image.height;
          const drawingContext = drawingCanvas.getContext('2d')!;
          drawingContext.drawImage(image, 0, 0);
          legend = {
            type: this.type,
            layerPath: layerConfig.layerPath,
            layerName: layerConfig!.layerName,
            legend: drawingCanvas,
            styles: styleLegends.length ? styleLegends : undefined,
          };
          return legend;
        }
      }

      legend = {
        type: this.type,
        layerPath: layerConfig.layerPath,
        layerName: layerConfig!.layerName,
        legend: null,
        styles: styleLegends.length > 1 ? styleLegends : undefined,
      };
      return legend;
    } catch (error) {
      // Log
      logger.logError('wms.getLegend()\n', error);
      return null;
    }
  }

  /** ***************************************************************************************************************************
   * Translate the get feature information result set to the TypeFeatureInfoEntry[] used by GeoView.
   *
   * @param {TypeJsonObject} featureMember An object formatted using the query syntax.
   * @param {OgcWmsLayerEntryConfig} layerConfig The layer configuration.
   * @param {Coordinate} clickCoordinate The coordinate where the user has clicked.
   *
   * @returns {TypeFeatureInfoEntry[]} The feature info table.
   */
  private formatWmsFeatureInfoResult(
    featureMember: TypeJsonObject,
    layerConfig: OgcWmsLayerEntryConfig,
    clickCoordinate: Coordinate
  ): TypeFeatureInfoEntry[] {
    const featureInfo = layerConfig?.source?.featureInfo;
    const outfields = getLocalizedValue(featureInfo?.outfields, this.mapId)?.split(',');
    const fieldTypes = featureInfo?.fieldTypes?.split(',');
    const aliasFields = getLocalizedValue(featureInfo?.aliasFields, this.mapId)?.split(',');
    const queryResult: TypeFeatureInfoEntry[] = [];

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
      nameField: null,
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
   * Set the style to be used by the wms layer. This methode does nothing if the layer path can't be found.
   *
   * @param {string} wmsStyleId The style identifier that will be used.
   * @param {string} layerPath The layer path to the layer's configuration.
   */
  setWmsStyle(wmsStyleId: string, layerPath: string) {
    const layerConfig = this.getLayerConfig(layerPath) as OgcWmsLayerEntryConfig | undefined | null;
    // TODO: Verify if we can apply more than one style at the same time since the parameter name is STYLES
    if (layerConfig?.olLayer) (layerConfig.olLayer as ImageLayer<ImageWMS>).getSource()?.updateParams({ STYLES: wmsStyleId });
  }

  /** ***************************************************************************************************************************
   * Apply a view filter to the layer identified by the path stored in the layerPathAssociatedToTheGeoviewLayer property stored
   * in the layer instance associated to the map. The legend filters are derived from the uniqueValue or classBreaks style of the
   * layer. When the layer config is invalid, nothing is done.
   *
   * @param {string} filter An optional filter to be used in place of the getViewFilter value.
   * @param {never} notUsed1 This parameter must not be provided. It is there to allow overloading of the method signature.
   * @param {never} notUsed2 This parameter must not be provided. It is there to allow overloading of the method signature.
   */
  applyViewFilter(filter: string, notUsed1?: never, notUsed2?: never): void;

  /** ***************************************************************************************************************************
   * Apply a view filter to the layer identified by the path stored in the layerPathAssociatedToTheGeoviewLayer property stored
   * in the layer instance associated to the map. When the CombineLegendFilter flag is false, the filter paramater is used alone
   * to display the features. Otherwise, the legend filter and the filter parameter are combined together to define the view
   * filter. The legend filters are derived from the uniqueValue or classBreaks style of the layer. When the layer config is
   * invalid, nothing is done.
   *
   * @param {string} filter An optional filter to be used in place of the getViewFilter value.
   * @param {boolean} CombineLegendFilter Flag used to combine the legend filter and the filter together (default: true)
   * @param {never} notUsed This parameter must not be provided. It is there to allow overloading of the method signature.
   */
  applyViewFilter(filter: string, CombineLegendFilter: boolean, notUsed?: never): void;

  /** ***************************************************************************************************************************
   * Apply a view filter to the layer. When the CombineLegendFilter flag is false, the filter paramater is used alone to display
   * the features. Otherwise, the legend filter and the filter parameter are combined together to define the view filter. The
   * legend filters are derived from the uniqueValue or classBreaks style of the layer. When the layer config is invalid, nothing
   * is done.
   * TODO ! The combination of the legend filter and the dimension filter probably does not apply to WMS. The code can be simplified.
   *
   * @param {string} layerPath The layer path to the layer's configuration.
   * @param {string} filter An optional filter to be used in place of the getViewFilter value.
   * @param {boolean} CombineLegendFilter Flag used to combine the legend filter and the filter together (default: true)
   */
  applyViewFilter(layerPath: string, filter?: string, CombineLegendFilter?: boolean): void;

  // See above headers for signification of the parameters. The first lines of the method select the template
  // used based on the parameter types received.

  applyViewFilter(parameter1: string, parameter2?: string | boolean | never, parameter3?: boolean | never) {
    // At the beginning, we assume that:
    // 1- the layer path was saved in this.layerPathAssociatedToTheGeoviewLayer using a call to
    //    api.maps[mapId].layer.geoviewLayer(layerPath);
    // 2- the filter is empty;
    // 3- the combine legend filters is true
    let layerPath = this.layerPathAssociatedToTheGeoviewLayer;
    let filter = '';
    let CombineLegendFilter = true;

    // Method signature detection
    if (typeof parameter3 === 'boolean') {
      // Signature detected is: applyViewFilter(layerPath: string, filter?: string, combineLegendFilter?: boolean): void;
      layerPath = parameter1;
      filter = parameter2 as string;
      CombineLegendFilter = parameter3;
    } else if (parameter2 !== undefined && parameter3 === undefined) {
      if (typeof parameter2 === 'boolean') {
        // Signature detected is: applyViewFilter(filter: string, CombineLegendFilter: boolean): void;
        filter = parameter1;
        CombineLegendFilter = parameter2;
      } else {
        // Signature detected is: applyViewFilter(layerPath: string, filter: string): void;
        layerPath = parameter1;
        filter = parameter2;
      }
    } else if (parameter2 === undefined && parameter3 === undefined) {
      // Signature detected is: applyViewFilter(filter: string): void;
      filter = parameter1;
    }

    const layerConfig = this.getLayerConfig(layerPath) as OgcWmsLayerEntryConfig;
    if (!layerConfig) {
      // ! Things important to know about the applyViewFilter usage:
      logger.logError(
        `
        The applyViewFilter method must never be called by GeoView code before the layer refered by the layerPath has reached the 'loaded' status.\n
        It will never be called by the GeoView internal code except in the layerConfig.loadedFunction() that is called right after the 'loaded' signal.\n
        If you are a user, you can set the layer filter in the configuration or using code called in the cgpv.init() method of the viewer.\n
        It appeares that the layer refered by the layerPath "${layerPath} does not respect these rules.\n
      `.replace(/\s+/g, ' ')
      );
      return;
    }

    // Log
    logger.logTraceCore('WMS - applyViewFilter', layerPath);

    // Get source
    const source = (layerConfig.olLayer as ImageLayer<ImageWMS>).getSource();
    if (source) {
      let filterValueToUse = filter;
      layerConfig.olLayer!.set('legendFilterIsOff', !CombineLegendFilter);
      if (CombineLegendFilter) layerConfig.olLayer?.set('layerFilter', filter);

      if (filterValueToUse) {
        filterValueToUse = filterValueToUse.replaceAll(/\s{2,}/g, ' ').trim();
        const queryElements = filterValueToUse.split(/(?<=\b)\s*=/);
        const dimension = queryElements[0].trim();
        filterValueToUse = queryElements[1].trim();

        // Convert date constants using the externalFragmentsOrder derived from the externalDateFormat
        const searchDateEntry = [
          ...`${filterValueToUse} `.matchAll(/(?<=^date\b\s')[\d/\-T\s:+Z]{4,25}(?=')|(?<=[(\s]date\b\s')[\d/\-T\s:+Z]{4,25}(?=')/gi),
        ];
        searchDateEntry.reverse();
        searchDateEntry.forEach((dateFound) => {
          // If the date has a time zone, keep it as is, otherwise reverse its time zone by changing its sign
          const reverseTimeZone = ![20, 25].includes(dateFound[0].length);
          const reformattedDate = api.dateUtilities.applyInputDateFormat(dateFound[0], this.externalFragmentsOrder, reverseTimeZone);
          filterValueToUse = `${filterValueToUse!.slice(0, dateFound.index! - 6)}${reformattedDate}${filterValueToUse!.slice(
            dateFound.index! + dateFound[0].length + 2
          )}`;
        });
        source.updateParams({ [dimension]: filterValueToUse.replace(/\s*/g, '') });
        layerConfig.olLayer!.changed();
      }
    }
  }

  /** ***************************************************************************************************************************
   * Get the bounds of the layer represented in the layerConfig pointed to by the cached layerPath, returns updated bounds
   *
   * @param {Extent | undefined} bounds The current bounding box to be adjusted.
   * @param {never} notUsed This parameter must not be provided. It is there to allow overloading of the method signature.
   *
   * @returns {Extent} The new layer bounding box.
   */
  protected getBounds(bounds: Extent, notUsed?: never): Extent | undefined;

  /** ***************************************************************************************************************************
   * Get the bounds of the layer represented in the layerConfig pointed to by the layerPath, returns updated bounds
   *
   * @param {string} layerPath The Layer path to the layer's configuration.
   * @param {Extent | undefined} bounds The current bounding box to be adjusted.
   *
   * @returns {Extent} The new layer bounding box.
   */
  protected getBounds(layerPath: string, bounds?: Extent): Extent | undefined;

  // See above headers for signification of the parameters. The first lines of the method select the template
  // used based on the parameter types received.
  protected getBounds(parameter1?: string | Extent, parameter2?: Extent): Extent | undefined {
    const layerPath = typeof parameter1 === 'string' ? parameter1 : this.layerPathAssociatedToTheGeoviewLayer;
    let bounds = typeof parameter1 !== 'string' ? parameter1 : parameter2;
    const layerConfig = this.getLayerConfig(layerPath);
    const projection =
      (layerConfig?.olLayer as ImageLayer<Static>)?.getSource()?.getProjection()?.getCode().replace('EPSG:', '') ||
      MapEventProcessor.getMapState(this.mapId).currentProjection;
    let layerBounds = layerConfig?.initialSettings?.bounds || [];
    layerBounds = api.projection.transformExtent(layerBounds, 'EPSG:4326', `EPSG:${projection}`);
    const boundingBoxes = this.metadata?.Capability.Layer.BoundingBox;
    let bbExtent: Extent | undefined;

    if (boundingBoxes) {
      for (let i = 0; i < (boundingBoxes.length as number); i++) {
        if (boundingBoxes[i].crs === `EPSG:${projection}`)
          bbExtent = [
            boundingBoxes[i].extent[1],
            boundingBoxes[i].extent[0],
            boundingBoxes[i].extent[3],
            boundingBoxes[i].extent[2],
          ] as Extent;
      }
    }

    if (layerBounds && bbExtent) layerBounds = getMinOrMaxExtents(layerBounds, bbExtent, 'min');

    if (layerBounds) {
      if (!bounds) bounds = [layerBounds[0], layerBounds[1], layerBounds[2], layerBounds[3]];
      else bounds = getMinOrMaxExtents(bounds, layerBounds);
    }

    return bounds;
  }
}
