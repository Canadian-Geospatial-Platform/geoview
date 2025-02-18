/* eslint-disable no-param-reassign */
// We have many reassign for layer-layerConfig. We keep it global...
import ImageLayer from 'ol/layer/Image';
import BaseLayer from 'ol/layer/Base';
import { ImageWMS } from 'ol/source';
import { Options as SourceOptions } from 'ol/source/ImageWMS';
import WMSCapabilities from 'ol/format/WMSCapabilities';
import { Extent } from 'ol/extent';

import { TypeJsonArray, TypeJsonObject } from '@/core/types/global-types';
import { AbstractGeoViewLayer, CONST_LAYER_TYPES } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { AbstractGeoViewRaster } from '@/geo/layer/geoview-layers/raster/abstract-geoview-raster';
import { TypeLayerEntryConfig, TypeGeoviewLayerConfig, CONST_LAYER_ENTRY_TYPES, layerEntryIsGroupLayer } from '@/geo/map/map-schema-types';
import { DateMgt } from '@/core/utils/date-mgt';
import { validateExtent, validateExtentWhenDefined } from '@/geo/utils/utilities';
import { api, WMS_PROXY_URL } from '@/app';
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';
import { logger } from '@/core/utils/logger';
import { OgcWmsLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/ogc-wms-layer-entry-config';
import { AbstractBaseLayerEntryConfig } from '@/core/utils/config/validation-classes/abstract-base-layer-entry-config';
import { GroupLayerEntryConfig } from '@/core/utils/config/validation-classes/group-layer-entry-config';
import { ConfigBaseClass } from '@/core/utils/config/validation-classes/config-base-class';

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
// GV Layers Refactoring - Obsolete (in layers)
export class WMS extends AbstractGeoViewRaster {
  WMSStyles: string[];

  fullSubLayers: boolean = false;

  /** ***************************************************************************************************************************
   * Initialize layer
   * @param {string} mapId the id of the map
   * @param {TypeWMSLayerConfig} layerConfig the layer configuration
   */
  constructor(mapId: string, layerConfig: TypeWMSLayerConfig, fullSubLayers: boolean) {
    super(CONST_LAYER_TYPES.WMS, layerConfig, mapId);
    this.WMSStyles = [];
    this.fullSubLayers = fullSubLayers;
  }

  /** ***************************************************************************************************************************
   * This method reads the service metadata from the metadataAccessPath.
   *
   * @returns {Promise<void>} A promise that the execution is completed.
   */
  // GV Layers Refactoring - Obsolete (in config)
  protected override async fetchServiceMetadata(): Promise<void> {
    const metadataUrl = this.metadataAccessPath;

    // If the metadata url ends with .xml
    if (metadataUrl.toLowerCase().endsWith('.xml')) {
      // XML metadata is a special case that does not use GetCapabilities to get the metadata
      await this.#fetchXmlServiceMetadata(metadataUrl, (proxyUsed: string) => {
        // A Proxy had to be used to fetch the service metadata, update the layer config with it
        this.metadataAccessPath = `${proxyUsed}${metadataUrl}`;
      });
    } else {
      let metadataUrlGetCap = metadataUrl;
      if (!metadataUrl.includes('request=GetCapabilities')) {
        metadataUrlGetCap = `${metadataUrl}?service=WMS&version=1.3.0&request=GetCapabilities`;
      }

      const layerConfigsToQuery = this.#getLayersToQuery();
      if (layerConfigsToQuery.length === 0) {
        // Use GetCapabilities to get the metadata
        try {
          const metadata = await this.#getServiceMetadata(metadataUrlGetCap, (proxyUsed: string) => {
            // A Proxy had to be used to fetch the service metadata, update the layer config with it
            this.metadataAccessPath = `${proxyUsed}${metadataUrl}`;
          });
          this.metadata = metadata;
          this.#processMetadataInheritance();
        } catch (error) {
          // Log
          logger.logError(`Unable to read service metadata for GeoView layer ${this.geoviewLayerId} of map ${this.mapId}.`, error);
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
              this.#getServiceMetadata(`${metadataUrlGetCap}&Layers=${layerConfig.layerId}`, (proxyUsed: string) => {
                // A Proxy had to be used to fetch the service metadata, update the layer config with it
                layerConfigsToQuery[i].source!.dataAccessPath = `${proxyUsed}${metadataUrl}`;
              })
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
              else if (!this.#getLayerMetadataEntry(layerConfigsToQuery[i].layerId!)) {
                const metadataLayerPathToAdd = this.#getMetadataLayerPath(
                  layerConfigsToQuery[i].layerId!,
                  arrayOfMetadata[i]!.Capability.Layer
                );
                this.#addLayerToMetadataInstance(
                  metadataLayerPathToAdd,
                  this.metadata?.Capability?.Layer,
                  arrayOfMetadata[i]!.Capability.Layer
                );
              }
            }
          }
          this.#processMetadataInheritance();
        } catch {
          this.setAllLayerStatusTo('error', this.listOfLayerEntryConfig, 'Unable to read metadata');
        }
      }
    }
  }

  /** ***************************************************************************************************************************
   * This method reads the service metadata using a GetCapabilities request.
   *
   * @param {string} metadataUrl The GetCapabilities query to execute
   *
   * @returns {Promise<void>} A promise that the execution is completed.
   * @private
   */
  // GV Layers Refactoring - Obsolete (in config)
  async #getServiceMetadata(url: string, callbackNewMetadataUrl: (proxyUsed: string) => void): Promise<TypeJsonObject | null> {
    try {
      let response;
      try {
        // Fetch the metadata
        response = await fetch(url);
      } catch {
        // If network issue such as CORS
        // We're going to change the metadata url to use a proxy
        const newProxiedMetadataUrl = `${WMS_PROXY_URL}${url}`;
        // Try again with the proxy this time
        response = await fetch(newProxiedMetadataUrl);
        // Callback about it
        callbackNewMetadataUrl?.(WMS_PROXY_URL);
      }

      const capabilitiesString = await response.text();
      const parser = new WMSCapabilities();
      const metadata: TypeJsonObject = parser.read(capabilitiesString);
      return metadata;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      this.setAllLayerStatusTo('error', this.listOfLayerEntryConfig, 'Unable to read metadata');
      return null;
    }
  }

  /** ***************************************************************************************************************************
   * This method reads the service metadata from a XML metadataAccessPath.
   *
   * @param {string} metadataUrl The metadataAccessPath
   *
   * @returns {Promise<void>} A promise that the execution is completed.
   * @private
   */
  // GV Layers Refactoring - Obsolete (in config)
  async #fetchXmlServiceMetadata(metadataUrl: string, callbackNewMetadataUrl?: (proxyUsed: string) => void): Promise<void> {
    try {
      const parser = new WMSCapabilities();

      let response;
      try {
        // Fetch the metadata
        response = await fetch(metadataUrl);
      } catch {
        // If network issue such as CORS
        // We're going to change the metadata url to use a proxy
        const newProxiedMetadataUrl = `${WMS_PROXY_URL}${metadataUrl}`;
        // Try again with the proxy this time
        response = await fetch(newProxiedMetadataUrl);
        // Callback about it
        callbackNewMetadataUrl?.(WMS_PROXY_URL);
      }

      const capabilitiesString = await response.text();
      this.metadata = parser.read(capabilitiesString);
      if (this.metadata) {
        this.#processMetadataInheritance();
        const metadataAccessPath = this.metadata?.Capability.Request.GetMap.DCPType[0].HTTP.Get.OnlineResource as string;
        this.metadataAccessPath = metadataAccessPath;
        const dataAccessPath = this.metadata?.Capability.Request.GetMap.DCPType[0].HTTP.Get.OnlineResource as string;
        const setDataAccessPath = (listOfLayerEntryConfig: TypeLayerEntryConfig[]): void => {
          listOfLayerEntryConfig.forEach((layerConfig) => {
            if (layerEntryIsGroupLayer(layerConfig)) setDataAccessPath(layerConfig.listOfLayerEntryConfig);
            else {
              layerConfig.source!.dataAccessPath = dataAccessPath;
            }
          });
        };
        setDataAccessPath(this.listOfLayerEntryConfig);
      } else {
        this.setAllLayerStatusTo('error', this.listOfLayerEntryConfig, 'Unable to read metadata');
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
   * @param {number[]} pathToTheParentLayer The path leading to the parent of the layerProperty parameter
   *
   * @returns {number[]} An array containing the path to the layer or [] if not found.
   * @private
   */
  // GV Layers Refactoring - Obsolete (in config)
  #getMetadataLayerPath(layerName: string, layerProperty: TypeJsonObject, pathToTheParentLayer: number[] = []): number[] {
    const newLayerPath = [...pathToTheParentLayer];
    if (Array.isArray(layerProperty)) {
      for (let i = 0; i < layerProperty.length; i++) {
        newLayerPath.push(i);
        if ('Name' in layerProperty[i] && layerProperty[i].Name === layerName) return newLayerPath;
        if ('Layer' in layerProperty[i]) {
          return this.#getMetadataLayerPath(layerName, layerProperty[i].Layer, newLayerPath);
        }
      }
    } else {
      newLayerPath.push(-1);
      if ('Name' in layerProperty && layerProperty.Name === layerName) return newLayerPath;
      if ('Layer' in layerProperty) {
        return this.#getMetadataLayerPath(layerName, layerProperty.Layer, newLayerPath);
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
   * @private
   */
  // GV Layers Refactoring - Obsolete (in config)
  #addLayerToMetadataInstance(
    metadataLayerPathToAdd: number[],
    metadataLayer: TypeJsonObject | undefined,
    layerToAdd: TypeJsonObject
  ): void {
    if (metadataLayerPathToAdd.length === 0 || !metadataLayer) return;
    if (metadataLayerPathToAdd[0] === -1)
      this.#addLayerToMetadataInstance(metadataLayerPathToAdd.slice(1), metadataLayer.Layer, layerToAdd.Layer);
    else {
      const metadataLayerFound = (metadataLayer as TypeJsonArray).find(
        (layerEntry) => layerEntry.Name === layerToAdd[metadataLayerPathToAdd[0]].Name
      );
      if (metadataLayerFound)
        this.#addLayerToMetadataInstance(
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
   * @private
   */
  // GV Layers Refactoring - Obsolete (in config)
  #getLayersToQuery(): TypeLayerEntryConfig[] {
    const arrayOfLayerIds: TypeLayerEntryConfig[] = [];
    const gatherLayerIds = (listOfLayerEntryConfig = this.listOfLayerEntryConfig): void => {
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
   * @private
   */
  // GV Layers Refactoring - Obsolete (in config)
  #processMetadataInheritance(parentLayer?: TypeJsonObject, layer: TypeJsonObject | undefined = this.metadata?.Capability?.Layer): void {
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
    if (layer?.Layer !== undefined) (layer.Layer as TypeJsonArray).forEach((subLayer) => this.#processMetadataInheritance(layer, subLayer));
  }

  /** ***************************************************************************************************************************
   * This method recursively validates the configuration of the layer entries to ensure that each layer is correctly defined.
   *
   * @param {TypeLayerEntryConfig[]} listOfLayerEntryConfig The list of layer entries configuration to validate.
   */
  // GV Layers Refactoring - Obsolete (in config?)
  protected validateListOfLayerEntryConfig(listOfLayerEntryConfig: TypeLayerEntryConfig[]): void {
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

        const layerFound = this.#getLayerMetadataEntry(layerConfig.layerId!);
        if (!layerFound) {
          this.layerLoadError.push({
            layer: layerPath,
            loggerMessage: `Layer metadata not found (mapId:  ${this.mapId}, layerPath: ${layerPath})`,
          });
          layerConfig.layerStatus = 'error';
          return;
        }

        if ('Layer' in layerFound) {
          this.#createGroupLayer(layerFound, layerConfig as unknown as GroupLayerEntryConfig);
          return;
        }

        if (!layerConfig.layerName) layerConfig.layerName = layerFound.Title as string;
      }
    });
  }

  /** ***************************************************************************************************************************
   * This method create recursively dynamic group layers from the service metadata.
   *
   * @param {TypeJsonObject} layer The dynamic group layer metadata.
   * @param {GroupLayerEntryConfig} layerConfig The group layer configuration associated to the dynamic group.
   * @private
   */
  // GV Layers Refactoring - Obsolete (in config)
  #createGroupLayer(layer: TypeJsonObject, layerConfig: GroupLayerEntryConfig): void {
    // TODO: Refactor - createGroup is the same thing for all the layers type? group is a geoview structure.
    // TO.DOCONT: Should it be handle upper in abstract class to loop in structure and launch the creation of a leaf?
    // TODO: The answer is no. Even if the final structure is the same, the input structure is different for each geoview layer types.
    const newListOfLayerEntryConfig: TypeLayerEntryConfig[] = [];
    const arrayOfLayerMetadata = Array.isArray(layer.Layer) ? layer.Layer : ([layer.Layer] as TypeJsonArray);

    // GV Special WMS group layer case situation...
    // TODO: Bug - There was an issue with the layer configuration for a long time ('Private element not on object') which
    // TO.DOCONT: was causing the loop below to fail before finishing the first loop (midway deep into 'registerLayerConfigInit()').
    // TO.DOCONT: The fact that an exception was raised was actually provoking the behavior that we want with the UI display of
    // TO.DOCONT: the WMS group layers (between Layers and Details tabs).
    // TO.DOCONT: However, fixing the cloning issue and completing the loops as they should be, was causing an unwanted side-effect
    // TO.DOCONT: with the UI.
    // TO.DOCONT: Therefore, we're making it crash on purpose by raising a 'Processing cancelled' exception for now to keep
    // TO.DOCONT: the behavior the same as before..

    // Assign the layer name right away
    layerConfig.layerName = layer.Title as string;

    // Loop on the sub layers
    arrayOfLayerMetadata.forEach((subLayer) => {
      // Log for pertinent debugging purposes
      logger.logTraceCore('WMS - createGroupLayer', 'Cloning the layer config', layerConfig.layerPath);
      const subLayerEntryConfig: ConfigBaseClass = layerConfig.clone();
      subLayerEntryConfig.parentLayerConfig = layerConfig;
      subLayerEntryConfig.layerId = subLayer.Name as string;
      subLayerEntryConfig.layerName = subLayer.Title as string;
      newListOfLayerEntryConfig.push(subLayerEntryConfig as TypeLayerEntryConfig);

      // FIXME: Temporary patch to keep the behavior until those layer classes don't exist
      this.getMapViewer().layer.registerLayerConfigInit(subLayerEntryConfig);

      // If we don't want all sub layers (simulating the 'Private element not on object' error we had for long time)
      if (!this.fullSubLayers) {
        // Skip the rest on purpose (ref TODO: Bug above)
        throw new Error('Processing cancelled');
      }
    });

    // TODO: Bug - Continuation of the TODO Bug above.. Purposely don't do this anymore (the throw will cause skipping of this)
    // TO.DOCONT: in order to reproduce the old behavior now that the 'Private element' bug is fixed..
    // TO.DOCONT: Leaving the code there, uncommented, so that if/when we remove the throw of the
    // TO.DOCONT: 'Processing cancelled' this gets executed as would be expected
    layerConfig.entryType = CONST_LAYER_ENTRY_TYPES.GROUP;
    layerConfig.isMetadataLayerGroup = true;
    layerConfig.listOfLayerEntryConfig = newListOfLayerEntryConfig;
    this.validateListOfLayerEntryConfig(newListOfLayerEntryConfig);
  }

  /** ****************************************************************************************************************************
   * This method search recursively the layerId in the layer entry of the capabilities.
   *
   * @param {string} layerId The layer identifier that must exists on the server.
   * @param {TypeJsonObject | undefined} layer The layer entry from the capabilities that will be searched.
   *
   * @returns {TypeJsonObject | null} The found layer from the capabilities or null if not found.
   * @private
   */
  // TODO: Refactor - Layers Refactoring - Check here for layer metadata config vs layers
  // GV Layers Refactoring - Obsolete (in config)
  #getLayerMetadataEntry(layerId: string, layer: TypeJsonObject | undefined = this.metadata?.Capability?.Layer): TypeJsonObject | null {
    if (!layer) return null;
    if ('Name' in layer && (layer.Name as string) === layerId) return layer;
    if ('Layer' in layer) {
      if (Array.isArray(layer.Layer)) {
        for (let i = 0; i < layer.Layer.length; i++) {
          const layerFound = this.#getLayerMetadataEntry(layerId, layer.Layer[i]);
          if (layerFound) return layerFound;
        }
        return null;
      }
      return this.#getLayerMetadataEntry(layerId, layer.Layer);
    }
    return null;
  }

  /** ****************************************************************************************************************************
   * This method creates a GeoView WMS layer using the definition provided in the layerConfig parameter.
   *
   * @param {AbstractBaseLayerEntryConfig} layerConfig Information needed to create the GeoView layer.
   *
   * @returns {Promise<BaseLayer | undefined>} The GeoView raster layer that has been created.
   */
  // GV Layers Refactoring - Obsolete (in config?, in layers?)
  protected override async processOneLayerEntry(layerConfig: AbstractBaseLayerEntryConfig): Promise<BaseLayer | undefined> {
    // GV IMPORTANT: The processOneLayerEntry method must call the corresponding method of its parent to ensure that the flow of
    // GV            layerStatus values is correctly sequenced.
    await super.processOneLayerEntry(layerConfig);

    // Instance check
    if (!(layerConfig instanceof OgcWmsLayerEntryConfig)) throw new Error('Invalid layer configuration type provided');

    if (geoviewEntryIsWMS(layerConfig)) {
      const layerCapabilities = this.#getLayerMetadataEntry(layerConfig.layerId);
      if (layerCapabilities) {
        const dataAccessPath = layerConfig.source.dataAccessPath!;

        let styleToUse = '';
        if (Array.isArray(layerConfig.source?.wmsStyle) && layerConfig.source?.wmsStyle) {
          styleToUse = layerConfig.source?.wmsStyle[0];
        } else if (layerConfig.source.wmsStyle) {
          styleToUse = layerConfig.source?.wmsStyle as string;
        } else if (layerCapabilities.Style) {
          styleToUse = layerCapabilities.Style[0].Name as string;
        }

        if (Array.isArray(layerConfig.source?.wmsStyle)) {
          this.WMSStyles = layerConfig.source.wmsStyle;
        } else if (layerCapabilities.Style && (layerCapabilities.Style.length as number) > 1) {
          this.WMSStyles = [];
          for (let i = 0; i < (layerCapabilities.Style.length as number); i++) {
            this.WMSStyles.push(layerCapabilities.Style[i].Name as string);
          }
        } else this.WMSStyles = [styleToUse];

        const sourceOptions: SourceOptions = {
          url: dataAccessPath.endsWith('?') ? dataAccessPath : `${dataAccessPath}?`,
          params: { LAYERS: layerConfig.layerId, STYLES: styleToUse },
        };

        sourceOptions.attributions = this.getAttributions();
        sourceOptions.serverType = layerConfig.source.serverType;
        if (layerConfig.source.crossOrigin) {
          sourceOptions.crossOrigin = layerConfig.source.crossOrigin;
        } else {
          sourceOptions.crossOrigin = 'Anonymous';
        }
        if (layerConfig.source.projection) sourceOptions.projection = `EPSG:${layerConfig.source.projection}`;

        // Create the source
        const source = new ImageWMS(sourceOptions);

        // GV Time to request an OpenLayers layer!
        const requestResult = this.emitLayerRequesting({ config: layerConfig, source, extraConfig: { layerCapabilities } });

        // If any response
        let olLayer: ImageLayer<ImageWMS> | undefined;
        if (requestResult.length > 0) {
          // Get the OpenLayer that was created
          olLayer = requestResult[0] as ImageLayer<ImageWMS>;
        } else throw new Error('Error on layerRequesting event');

        // GV Time to emit about the layer creation!
        this.emitLayerCreation({ config: layerConfig, layer: olLayer });

        return Promise.resolve(olLayer);
      }

      // TODO: find a more centralized way to trap error and display message
      api.maps[this.mapId].notifications.showError('validation.layer.notfound', [layerConfig.layerId, this.geoviewLayerId]);
      return Promise.resolve(undefined);
    }

    logger.logError(`geoviewLayerType must be ${CONST_LAYER_TYPES.WMS}`);
    return Promise.resolve(undefined);
  }

  /** ***************************************************************************************************************************
   * This method is used to process the layer's metadata. It will fill the empty fields of the layer's configuration (renderer,
   * initial settings, fields and aliases).
   *
   * @param {AbstractBaseLayerEntryConfig} layerConfig The layer entry configuration to process.
   *
   * @returns {Promise<AbstractBaseLayerEntryConfig>} A promise that the layer configuration has its metadata processed.
   */
  // GV Layers Refactoring - Obsolete (in config?)
  protected override processLayerMetadata(layerConfig: AbstractBaseLayerEntryConfig): Promise<AbstractBaseLayerEntryConfig> {
    // Instance check
    if (!(layerConfig instanceof OgcWmsLayerEntryConfig)) throw new Error('Invalid layer configuration type provided');

    if (geoviewEntryIsWMS(layerConfig)) {
      const layerCapabilities = this.#getLayerMetadataEntry(layerConfig.layerId)!;
      this.setLayerMetadata(layerConfig.layerPath, layerCapabilities);
      if (layerCapabilities) {
        const attributions = this.getAttributions();
        if (layerCapabilities.Attribution && !attributions.includes(layerCapabilities.Attribution?.Title as string)) {
          // Add it
          attributions.push(layerCapabilities.Attribution.Title as string);
          this.setAttributions(attributions);
        }
        if (!layerConfig.source.featureInfo) layerConfig.source.featureInfo = { queryable: !!layerCapabilities.queryable };
        MapEventProcessor.setMapLayerQueryable(this.mapId, layerConfig.layerPath, layerConfig.source.featureInfo.queryable);
        // TODO: The solution implemented in the following lines is not right. scale and zoom are not the same things.
        // if (layerConfig.initialSettings?.minZoom === undefined && layerCapabilities.MinScaleDenominator !== undefined)
        //   layerConfig.initialSettings.minZoom = layerCapabilities.MinScaleDenominator as number;
        // if (layerConfig.initialSettings?.maxZoom === undefined && layerCapabilities.MaxScaleDenominator !== undefined)
        //   layerConfig.initialSettings.maxZoom = layerCapabilities.MaxScaleDenominator as number;

        layerConfig.initialSettings.extent = validateExtentWhenDefined(layerConfig.initialSettings.extent);

        if (!layerConfig.initialSettings?.bounds && layerCapabilities.EX_GeographicBoundingBox)
          layerConfig.initialSettings!.bounds = validateExtent(layerCapabilities.EX_GeographicBoundingBox as Extent);

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
  // GV Layers Refactoring - Obsolete (in config)
  protected processTemporalDimension(wmsTimeDimension: TypeJsonObject, layerConfig: OgcWmsLayerEntryConfig): void {
    if (wmsTimeDimension !== undefined) {
      this.setTemporalDimension(layerConfig.layerPath, DateMgt.createDimensionFromOGC(wmsTimeDimension));
    }
  }
}
