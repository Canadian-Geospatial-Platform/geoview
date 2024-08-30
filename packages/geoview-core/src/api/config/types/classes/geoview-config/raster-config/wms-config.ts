import WMSCapabilities from 'ol/format/WMSCapabilities';

import { CV_CONST_LAYER_TYPES, CV_GEOVIEW_SCHEMA_PATH } from '@config/types/config-constants';
import { AbstractGeoviewLayerConfig } from '@config/types/classes/geoview-config/abstract-geoview-layer-config';
import { WmsGroupLayerConfig } from '@config/types/classes/sub-layer-config/group-node/wms-group-layer-config';
import { toJsonObject, TypeJsonArray, TypeJsonObject } from '@config/types/config-types';
import { TypeDisplayLanguage } from '@config/types/map-schema-types';
import { WmsLayerEntryConfig } from '@config/types/classes/sub-layer-config/leaf/raster/wms-layer-entry-config';
import { EntryConfigBaseClass } from '@config/types/classes/sub-layer-config/entry-config-base-class';
import { layerEntryIsGroupLayer } from '@config/types/type-guards';
import { ConfigError, GeoviewLayerConfigError, GeoviewLayerInvalidParameterError } from '@config/types/classes/config-exceptions';

import { logger } from '@/core/utils/logger';
import { xmlToJson } from '@/app';

export type TypeWmsLayerNode = WmsGroupLayerConfig | WmsLayerEntryConfig;

/**
 * The WMS geoview layer class.
 */
export class WmsLayerConfig extends AbstractGeoviewLayerConfig {
  /**
   * Type of GeoView layer.
   */
  override geoviewLayerType = CV_CONST_LAYER_TYPES.WMS;

  /** The layer entries to use from the GeoView layer. */
  declare listOfLayerEntryConfig: TypeWmsLayerNode[];

  /*
   * Methods are listed in the following order: abstract, override, private, protected and public.
   */

  /**
   * @protected @override
   * The getter method that returns the geoview layer schema to use for the validation. Each geoview layer type knows what
   * section of the schema must be used to do its validation.
   *
   * @returns {string} The GeoView layer schema associated to the config.
   */
  protected override getGeoviewLayerSchema(): string {
    /** The GeoView layer schema associated to WmsLayerConfig */
    return CV_GEOVIEW_SCHEMA_PATH.WMS;
  }

  /**
   * @override
   * The method used to implement the class factory model that returns the instance of the class based on the sublayer
   * type needed.
   *
   * @param {TypeJsonObject} layerConfig The sublayer configuration.
   * @param {TypeDisplayLanguage} language The initial language to use when interacting with the geoview layer.
   * @param {AbstractGeoviewLayerConfig} geoviewConfig The GeoView instance that owns the sublayer.
   * @param {EntryConfigBaseClass} parentNode The The parent node that owns this layer or undefined if it is the root layer..
   *
   * @returns {EntryConfigBaseClass} The sublayer instance or undefined if there is an error.
   */
  override createLeafNode(
    layerConfig: TypeJsonObject,
    language: TypeDisplayLanguage,
    geoviewConfig: AbstractGeoviewLayerConfig,
    parentNode?: EntryConfigBaseClass
  ): EntryConfigBaseClass {
    return new WmsLayerEntryConfig(layerConfig, language, geoviewConfig, parentNode);
  }

  /**
   * @override
   * The method used to implement the class factory model that returns the instance of the class based on the group
   * type needed.
   *
   * @param {TypeJsonObject} layerConfig The group node configuration.
   * @param {TypeDisplayLanguage} language The initial language to use when interacting with the geoview layer.
   * @param {AbstractGeoviewLayerConfig} geoviewConfig The GeoView instance that owns the sublayer.
   * @param {EntryConfigBaseClass} parentNode The The parent node that owns this layer or undefined if it is the root layer..
   *
   * @returns {EntryConfigBaseClass} The sublayer instance or undefined if there is an error.
   */
  override createGroupNode(
    layerConfig: TypeJsonObject,
    language: TypeDisplayLanguage,
    geoviewConfig: AbstractGeoviewLayerConfig,
    parentNode?: EntryConfigBaseClass
  ): EntryConfigBaseClass {
    return new WmsGroupLayerConfig(layerConfig, language, geoviewConfig, parentNode);
  }

  /**
   * Get the service metadata from the metadataAccessPath and store it in a protected property of the geoview layer.
   */
  override async fetchServiceMetadata(): Promise<void> {
    const metadataAccessPathIsXmlFile = this.metadataAccessPath.slice(-4).toLowerCase() === '.xml';
    if (metadataAccessPathIsXmlFile) {
      // XML metadata is a special case that does not use GetCapabilities to get the metadata
      await this.#fetchXmlServiceMetadata(this.metadataAccessPath);
    } else {
      const layerConfigsToQuery = this.#getLayersToQuery(this.listOfLayerEntryConfig);
      if (layerConfigsToQuery.length === 0) {
        // Use 'request=GetCapabilities' to get the service metadata
        await this.#fetchUsingGetCapabilities();
      } else {
        // Uses 'request=GetCapabilities&Layers=' to get the service metadata.
        await this.#fetchUsingGetCapabilitiesAndLayers(layerConfigsToQuery);
      }
    }

    (this.listOfLayerEntryConfig as EntryConfigBaseClass[]) = this.#processListOfLayerEntryConfig(this.listOfLayerEntryConfig);

    // When a list of layer entries is specified, the layer tree is the same as the resulting listOfLayerEntryConfig of the geoview instance.
    // Otherwise, a layer tree is built using all the layers that compose the metadata.
    this.setMetadataLayerTree(this.listOfLayerEntryConfig.length ? this.listOfLayerEntryConfig : this.createLayerTree());
    await this.fetchListOfLayerMetadata();
  }

  /**
   * A recursive method to process the listOfLayerEntryConfig. The goal is to process each valid sublayer, searching the service's
   * metadata to verify the layer's existence and whether it is a layer group, in order to determine the node's final structure.
   * If it is a layer group, it will be created.
   *
   * @param {TypeWmsLayerNode[]} listOfLayerEntryConfig the list of sublayers to process.
   *
   * @returns {TypeWmsLayerNode[]} the new list of sublayer configurations.
   * @private
   */
  #processListOfLayerEntryConfig(listOfLayerEntryConfig: TypeWmsLayerNode[]): EntryConfigBaseClass[] {
    return listOfLayerEntryConfig.map((subLayer) => {
      if (subLayer.getErrorDetectedFlag()) return subLayer;

      if (layerEntryIsGroupLayer(subLayer)) {
        // The next line replace the listOfLayerEntryConfig stored in the subLayer parameter
        // Since subLayer is the function parameter, we must disable the eslint no-param-reassign
        // eslint-disable-next-line no-param-reassign
        subLayer.listOfLayerEntryConfig = this.#processListOfLayerEntryConfig(subLayer.listOfLayerEntryConfig as TypeWmsLayerNode[]);
        return subLayer;
      }

      try {
        return this.#createLayerEntryNode(subLayer.layerId, subLayer.getParentNode());
      } catch (error) {
        subLayer.setErrorDetectedFlag();
        logger.logError((error as ConfigError).message, error);
        return subLayer;
      }
    });
  }

  /**
   * Create a layer entry node for a specific layerId using the service metadata. The node returned can be a
   * layer or a group layer.
   *
   * @param {string} layerId The layer id to use for the subLayer creation.
   * @param {TypeWmsLayerNode | undefined} parentNode The layer's parent node.
   *
   * @returns {TypeWmsLayerNode} The subLayer created from the metadata.
   * @private
   */
  #createLayerEntryNode(layerId: string, parentNode: EntryConfigBaseClass | undefined): EntryConfigBaseClass {
    // If we cannot find the layerId in the layer definitions, throw an error.
    const layerFound = WmsLayerConfig.getLayerMetadataEntry(layerId, this.getServiceMetadata().Capability.Layer);
    if (!layerFound) {
      throw new GeoviewLayerInvalidParameterError('LayerIdNotFound', [layerId?.toString()]);
    }

    // if the layerFound is a group layer, create a the layer group.
    if ('Layer' in layerFound) {
      const jsonConfig = this.#createGroupNodeJsonConfig(layerId, layerFound.Layer as TypeJsonObject[]);
      return this.createGroupNode(jsonConfig, this.getLanguage(), this, parentNode)!;
    }

    // Create the layer using the metadata
    const layerConfig = toJsonObject({
      layerId,
      layerName: { en: layerFound.Title, fr: layerFound.Title },
    });
    return this.createLeafNode(layerConfig, this.getLanguage(), this, parentNode)!;
  }

  /**
   * Create a group node JSON config for a specific layer id.
   *
   * @param {string} groupId The layer group id of the node.
   * @param {TypeJsonObject[]} metadataLayerArray The metadata array of layer to assign to the group node.
   *
   * @returns {TypeJsonObject} A json configuration that can be used to create the group node.
   * @private
   */
  #createGroupNodeJsonConfig = (groupId: string, metadataLayerArray: TypeJsonObject[]): TypeJsonObject => {
    const listOfLayerEntryConfig = metadataLayerArray.reduce((accumulator, layer) => {
      if ('Layer' in layer) accumulator.push(this.#createGroupNodeJsonConfig(layer.Name as string, layer.Layer as TypeJsonObject[]));
      else {
        accumulator.push(
          toJsonObject({
            layerId: layer.Name,
            layerName: { en: layer.Name, fr: layer.Name },
          })
        );
      }
      return accumulator;
    }, [] as TypeJsonObject[]);

    return toJsonObject({
      layerId: groupId,
      layerName: { en: groupId, fr: groupId },
      isLayerGroup: true,
      listOfLayerEntryConfig,
    });
  };

  /** ***************************************************************************************************************************
   * This method reads the service metadata from a XML metadataAccessPath.
   *
   * @param {string} metadataUrl The localized value of the metadataAccessPath
   *
   * @returns {Promise<void>} A promise that the execution is completed.
   * @private
   */
  async #fetchXmlServiceMetadata(metadataUrl: string): Promise<void> {
    try {
      const parser = new WMSCapabilities();
      const response = await fetch(metadataUrl);
      const capabilitiesString = await response.text();
      this.setServiceMetadata(parser.read(capabilitiesString));
      if (this.getServiceMetadata()) {
        this.#processMetadataInheritance();
        this.metadataAccessPath = this.getServiceMetadata().Capability.Request.GetMap.DCPType[0].HTTP.Get.OnlineResource as string;
      } else throw new GeoviewLayerConfigError('Unable to read the metadata, value returned is empty.');
    } catch (error) {
      // In the event of a service metadata reading error, we report the geoview layer and all its sublayers as being in error.
      this.setErrorDetectedFlag();
      this.setErrorDetectedFlagForAllLayers(this.listOfLayerEntryConfig);
      logger.logError(`Error detected while reading WMS metadata for geoview layer ${this.geoviewLayerId}.`);
    }
  }

  /** ***************************************************************************************************************************
   * This method converts the tree structure of the listOfLayerEntreyConfig to a one dimensionnal array of layers
   * that will be used in the GetCapabilities.
   *
   * @param {TypeWmsLayerNode[]} The list of layer entry config.
   *
   * @returns {WmsLayerEntryConfig[]} The array of layer configurations.
   * @private
   */
  #getLayersToQuery(listOfLayerEntryConfig: TypeWmsLayerNode[]): WmsLayerEntryConfig[] {
    const returnValue = listOfLayerEntryConfig.reduce((accumulator, layerConfig) => {
      if (layerEntryIsGroupLayer(layerConfig))
        // eslint-disable-next-line no-param-reassign
        accumulator = accumulator.concat(this.#getLayersToQuery(layerConfig.listOfLayerEntryConfig as TypeWmsLayerNode[]));
      else accumulator.push(layerConfig);
      return accumulator;
    }, [] as WmsLayerEntryConfig[]);
    return returnValue;
  }

  /** ***************************************************************************************************************************
   * This method fetch the service metadata using a getCapabilities request.
   * @private
   */
  async #fetchUsingGetCapabilities(): Promise<void> {
    try {
      const serviceMetadata = await WmsLayerConfig.#executeServiceMetadataRequest(
        `${this.metadataAccessPath}?service=WMS&version=1.3.0&request=GetCapabilities`
      );
      this.setServiceMetadata(serviceMetadata);
      this.#processMetadataInheritance();
    } catch (error) {
      // In the event of a service metadata reading error, we report the geoview layer and all its sublayers as being in error.
      this.setErrorDetectedFlag();
      this.setErrorDetectedFlagForAllLayers(this.listOfLayerEntryConfig);
      logger.logError(`Error detected while reading WMS metadata for geoview layer ${this.geoviewLayerId}.`);
    }
  }

  /** ***************************************************************************************************************************
   * This method reads service metadata using the URL provided. The syntax can be “request=GetCapabilities” or
   * “request=GetCapabilities&Layers=layerId”. Callers are responsible for handling any errors that occur here.
   *
   * @param {string} url The GetCapabilities request to execute
   *
   * @returns {Promise<void>} A promise that the execution is completed.
   * @private
   */
  static async #executeServiceMetadataRequest(url: string): Promise<TypeJsonObject> {
    const response = await fetch(url);
    const capabilitiesString = await response.text();

    const xmlDomResponse = new DOMParser().parseFromString(capabilitiesString, 'text/xml');
    const errorObject = xmlToJson(xmlDomResponse)?.['ogc:ServiceExceptionReport']?.['ogc:ServiceException'];
    if (errorObject) throw new GeoviewLayerConfigError(errorObject['#text'] as string)

    const parser = new WMSCapabilities();
    const serviceMetadata: TypeJsonObject = parser.read(capabilitiesString);
    if (serviceMetadata?.Capability?.Layer) return serviceMetadata;
    throw new GeoviewLayerConfigError(`Unable to read the metadata, value returned doesn't contain Capability, Layer or is empty.`);
  }

  /** ***************************************************************************************************************************
   * This method fetch the service metadata using a getCapabilities&Layers= request. To allow geomet service metadata to be
   * retrieved using the "Layers" parameter in the request URL, we need to process each layer individually and merge all layer
   * metadata at the end. Even though the "Layers" parameter is ignored by other WMS servers, the drawback of this method is
   * sending unnecessary requests while only one GetCapabilities could be used when the server publishes a small set of metadata.
   * Which is not the case for the Geomet service.
   *
   * @param {WmsLayerEntryConfig} layerConfigsToQuery The array of layers to process.
   * @private
   */
  async #fetchUsingGetCapabilitiesAndLayers(layerConfigsToQuery: WmsLayerEntryConfig[]): Promise<void> {
    try {
      const promisedArrayOfMetadata: Promise<TypeJsonObject>[] = [];
      let i: number;
      layerConfigsToQuery.forEach((layerConfig: WmsLayerEntryConfig, layerIndex: number) => {
        // verify if the a request with the same layerId has already been sent up to now.
        for (i = 0; layerConfigsToQuery[i].layerId !== layerConfig.layerId; i++);
        if (i === layerIndex)
          // if the layer found is the same as the current layer index,
          // this is the first time we execute this request
          promisedArrayOfMetadata.push(
            WmsLayerConfig.#executeServiceMetadataRequest(
              `${this.metadataAccessPath}?service=WMS&version=1.3.0&request=GetCapabilities&Layers=${layerConfig.layerId}`
            )
          );
        // otherwise, we are already waiting for the same request and we will wait for it to finish.
        else promisedArrayOfMetadata.push(promisedArrayOfMetadata[i]);
      });

      // Since we use Promise.all, If one of the Promise awaited fails, then the whole service metadata fetching will fail.
      const arrayOfMetadata = await Promise.all(promisedArrayOfMetadata);

      // Initialize service metadata using index 0 of arrayOfMetadata as a starting point. Other indexes will be added to it.
      this.setServiceMetadata(arrayOfMetadata[0]);
      for (i = 1; i < arrayOfMetadata.length; i++) {
        if (!WmsLayerConfig.getLayerMetadataEntry(layerConfigsToQuery[i].layerId, this.getServiceMetadata().Capability.Layer)) {
          const metadataLayerPathToAdd = this.#getMetadataLayerPath(layerConfigsToQuery[i].layerId!, arrayOfMetadata[i]!.Capability.Layer);
          this.#addLayerToMetadataInstance(
            metadataLayerPathToAdd,
            this.getServiceMetadata().Capability.Layer,
            arrayOfMetadata[i]!.Capability.Layer
          );
        }
      }
      this.#processMetadataInheritance();
    } catch (error) {
      // In the event of a service metadata reading error, we report the geoview layer and all its sublayers as being in error.
      this.setErrorDetectedFlag();
      this.setErrorDetectedFlagForAllLayers(this.listOfLayerEntryConfig);
      logger.logError(`Error detected while reading WMS metadata for geoview layer ${this.geoviewLayerId}.\n${(error as GeoviewLayerConfigError).message || ''}`, error);
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
   * @private
   */
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
   * This method propagate the WMS metadata inherited values.
   *
   * @param {TypeJsonObject} parentLayer The parent layer that contains the inherited values
   * @param {TypeJsonObject | undefined} layer The layer property from the metadata that will inherit the values
   * @private
   */
  #processMetadataInheritance(
    parentLayer?: TypeJsonObject,
    layer: TypeJsonObject | undefined = this.getServiceMetadata().Capability.Layer
  ): void {
    if (parentLayer && layer) {
      // Table 7 — Inheritance of Layer properties specified in the standard with 'replace' behaviour.
      // eslint-disable-next-line no-param-reassign
      if (layer.EX_GeographicBoundingBox === undefined) layer.EX_GeographicBoundingBox = parentLayer.EX_GeographicBoundingBox;
      // eslint-disable-next-line no-param-reassign
      if (layer.queryable === undefined) layer.queryable = parentLayer.queryable;
      // eslint-disable-next-line no-param-reassign
      if (layer.cascaded === undefined) layer.cascaded = parentLayer.cascaded;
      // eslint-disable-next-line no-param-reassign
      if (layer.opaque === undefined) layer.opaque = parentLayer.opaque;
      // eslint-disable-next-line no-param-reassign
      if (layer.noSubsets === undefined) layer.noSubsets = parentLayer.noSubsets;
      // eslint-disable-next-line no-param-reassign
      if (layer.fixedWidth === undefined) layer.fixedWidth = parentLayer.fixedWidth;
      // eslint-disable-next-line no-param-reassign
      if (layer.fixedHeight === undefined) layer.fixedHeight = parentLayer.fixedHeight;
      // eslint-disable-next-line no-param-reassign
      if (layer.MinScaleDenominator === undefined) layer.MinScaleDenominator = parentLayer.MinScaleDenominator;
      // eslint-disable-next-line no-param-reassign
      if (layer.MaxScaleDenominator === undefined) layer.MaxScaleDenominator = parentLayer.MaxScaleDenominator;
      // eslint-disable-next-line no-param-reassign
      if (layer.BoundingBox === undefined) layer.BoundingBox = parentLayer.BoundingBox;
      // eslint-disable-next-line no-param-reassign
      if (layer.Dimension === undefined) layer.Dimension = parentLayer.Dimension;
      // eslint-disable-next-line no-param-reassign
      if (layer.Attribution === undefined) layer.Attribution = parentLayer.Attribution;
      // eslint-disable-next-line no-param-reassign
      if (layer.MaxScaleDenominator === undefined) layer.MaxScaleDenominator = parentLayer.MaxScaleDenominator;
      // eslint-disable-next-line no-param-reassign
      if (layer.MaxScaleDenominator === undefined) layer.MaxScaleDenominator = parentLayer.MaxScaleDenominator;
      // Table 7 — Inheritance of Layer properties specified in the standard with 'add' behaviour.
      // AuthorityURL inheritance is not implemented in the following code.
      if (parentLayer.Style) {
        // eslint-disable-next-line no-param-reassign
        if (!layer.Style as TypeJsonArray) (layer.Style as TypeJsonArray) = [];
        (parentLayer.Style as TypeJsonArray).forEach((parentStyle) => {
          const styleFound = (layer.Style as TypeJsonArray).find((styleEntry) => styleEntry.Name === parentStyle.Name);
          if (!styleFound) (layer.Style as TypeJsonArray).push(parentStyle);
        });
      }
      if (parentLayer.CRS) {
        // eslint-disable-next-line no-param-reassign
        if (!layer.CRS as TypeJsonArray) (layer.CRS as TypeJsonArray) = [];
        (parentLayer.CRS as TypeJsonArray).forEach((parentCRS) => {
          const crsFound = (layer.CRS as TypeJsonArray).find((crsEntry) => crsEntry.Name === parentCRS);
          if (!crsFound) (layer.CRS as TypeJsonArray).push(parentCRS);
        });
      }
    }
    if (layer?.Layer !== undefined) (layer.Layer as TypeJsonArray).forEach((subLayer) => this.#processMetadataInheritance(layer, subLayer));
  }

  /**
   * Create the layer tree using the service metadata.
   *
   * @returns {TypeJsonObject[]} The layer tree created from the metadata.
   * @protected
   */
  protected createLayerTree(): EntryConfigBaseClass[] {
    const metadataLayer = this.getServiceMetadata().Capability.Layer;
    // If it is a group layer, then create it.
    if ('Layer' in metadataLayer) {
      // Sometime, the Name property is undefined. However, the Title property is mandatory.
      const groupId = (metadataLayer.Name || metadataLayer.Title) as string;
      const jsonConfig = this.#createGroupNodeJsonConfig(groupId, metadataLayer.Layer as TypeJsonArray);
      return [this.createGroupNode(jsonConfig, this.getLanguage(), this)!];
    }

    // Create a single layer using the metadata
    const layerConfig = toJsonObject({
      layerId: metadataLayer.Name,
      layerName: { en: metadataLayer.Name, fr: metadataLayer.Name },
    });
    return [this.createLeafNode(layerConfig, this.getLanguage(), this)!];
  }

  /** ****************************************************************************************************************************
   * This method search recursively the layerId in the layer entry of the capabilities.
   *
   * @param {string} layerId The layer identifier that must exists on the server.
   * @param {TypeJsonObject | undefined} layer The layer entry from the capabilities that will be searched.
   *
   * @returns {TypeJsonObject | null} The found layer from the capabilities or null if not found.
   * @static
   */
  static getLayerMetadataEntry(layerId: string, layer: TypeJsonObject | undefined): TypeJsonObject | null {
    // return null if the metadata doesn't have a Layer property in Capability (metadata fetch failed).
    if (!layer) return null;

    // if we have a named layer with the right name, return the layer found.
    if ('Name' in layer && (layer.Name as string) === layerId) return layer;

    if ('Layer' in layer) {
      // if we have a layer group, search recursively in it.
      if (Array.isArray(layer.Layer)) {
        for (let i = 0; i < layer.Layer.length; i++) {
          const layerFound = WmsLayerConfig.getLayerMetadataEntry(layerId, layer.Layer[i]);
          // return the layer if it has been found.
          if (layerFound) return layerFound;
        }
        // the recursive search failed, we return a null.
        return null;
      }
      // If the Layer property is not an array, use a single call to the getLayerMetadataEntryto test the layer's existance.
      return WmsLayerConfig.getLayerMetadataEntry(layerId, layer.Layer);
    }

    // If we get here, the layer doesn't exist, we return a null.
    return null;
  }
}
