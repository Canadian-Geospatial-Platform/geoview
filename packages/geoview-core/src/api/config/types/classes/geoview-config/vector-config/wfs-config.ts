import { CV_CONST_LAYER_TYPES, CV_GEOVIEW_SCHEMA_PATH } from '@config/types/config-constants';
import { AbstractGeoviewLayerConfig } from '@config/types/classes/geoview-config/abstract-geoview-layer-config';
import { WfsGroupLayerConfig } from '@config/types/classes/sub-layer-config/group-node/wfs-group-layer-config';
import { toJsonObject, TypeJsonArray, TypeJsonObject } from '@config/types/config-types';
import { TypeDisplayLanguage } from '@config/types/map-schema-types';
import { WfsLayerEntryConfig } from '@config/types/classes/sub-layer-config/leaf/vector/wfs-layer-entry-config';
import { EntryConfigBaseClass } from '@config/types/classes/sub-layer-config/entry-config-base-class';
import { GeoviewLayerConfigError, GeoviewLayerInvalidParameterError } from '@config/types/classes/config-exceptions';

import { logger } from '@/core/utils/logger';
import { findPropertyNameByRegex, getXMLHttpRequest, xmlToJson } from '@/core/utils/utilities';

export type TypeWfsLayerNode = WfsGroupLayerConfig | WfsLayerEntryConfig;

// ========================
// #region CLASS HEADER

/**
 * The WFS geoview layer class.
 */
export class WfsLayerConfig extends AbstractGeoviewLayerConfig {
  // ==================
  // #region PROPERTIES

  /**
   * Type of GeoView layer.
   */
  override geoviewLayerType = CV_CONST_LAYER_TYPES.WFS;

  /** The layer entries to use from the GeoView layer. */
  declare listOfLayerEntryConfig: EntryConfigBaseClass[] | TypeWfsLayerNode[];
  // #endregion PROPERTIES

  // ===============
  // #region METHODS
  /*
   * Methods are listed in the following order: abstract, override, private, protected, public and static.
   */

  // ================
  // #region OVERRIDE
  /**
   * The getter method that returns the geoview layer schema to use for the validation. Each geoview layer type knows what
   * section of the schema must be used to do its validation.
   *
   * @returns {string} The GeoView layer schema associated to the config.
   * @protected @override
   */
  protected override getGeoviewLayerSchema(): string {
    /** The GeoView layer schema associated to WfsLayerConfig */
    return CV_GEOVIEW_SCHEMA_PATH.WFS;
  }

  /**
   * The method used to implement the class factory model that returns the instance of the class based on the sublayer
   * type needed.
   *
   * @param {TypeJsonObject} layerConfig The sublayer configuration.
   * @param {TypeDisplayLanguage} language The initial language to use when interacting with the geoview layer.
   * @param {AbstractGeoviewLayerConfig} geoviewConfig The GeoView instance that owns the sublayer.
   * @param {EntryConfigBaseClass} parentNode The The parent node that owns this layer or undefined if it is the root layer.
   *
   * @returns {EntryConfigBaseClass} The sublayer instance or undefined if there is an error.
   * @override
   */
  override createLeafNode(
    layerConfig: TypeJsonObject,
    language: TypeDisplayLanguage,
    geoviewConfig: AbstractGeoviewLayerConfig,
    parentNode?: EntryConfigBaseClass
  ): EntryConfigBaseClass {
    return new WfsLayerEntryConfig(layerConfig, language, geoviewConfig, parentNode);
  }

  /**
   * The method used to implement the class factory model that returns the instance of the class based on the group
   * type needed.
   *
   * @param {TypeJsonObject} layerConfig The group node configuration.
   * @param {TypeDisplayLanguage} language The initial language to use when interacting with the geoview layer.
   * @param {AbstractGeoviewLayerConfig} geoviewConfig The GeoView instance that owns the sublayer.
   * @param {EntryConfigBaseClass} parentNode The The parent node that owns this layer or undefined if it is the root layer.
   *
   * @returns {EntryConfigBaseClass} The sublayer instance or undefined if there is an error.
   * @override
   */
  override createGroupNode(
    layerConfig: TypeJsonObject,
    language: TypeDisplayLanguage,
    geoviewConfig: AbstractGeoviewLayerConfig,
    parentNode?: EntryConfigBaseClass
  ): EntryConfigBaseClass {
    return new WfsGroupLayerConfig(layerConfig, language, geoviewConfig, parentNode);
  }

  /**
   * Get the service metadata from the metadataAccessPath and store it in the private property of the geoview layer.
   * @override @async
   */
  override async fetchServiceMetadata(): Promise<void> {
    try {
      const metadataUrl = this.processUrlParameters();
      const metadataString = await getXMLHttpRequest(metadataUrl);
      if (metadataString && metadataString !== '{}') {
        // Convert XML to JSON.
        const xmlDOMCapabilities = new DOMParser().parseFromString(metadataString, 'text/xml');
        const jsonCapabilities = xmlToJson(xmlDOMCapabilities);

        const capabilitiesObject = findPropertyNameByRegex(jsonCapabilities, /(?:WFS_Capabilities)/);
        if (capabilitiesObject) this.setServiceMetadata(capabilitiesObject);
        else throw new GeoviewLayerConfigError('Capabilities object is undefined');
      } else throw new GeoviewLayerConfigError('An empty metadata object was returned');

      this.listOfLayerEntryConfig = this.processListOfLayerEntryConfig(this.listOfLayerEntryConfig);
      await this.fetchListOfLayerMetadata();

      await this.createLayerTree();
    } catch (error) {
      // In the event of a service metadata reading error, we report the geoview layer and all its sublayers as being in error.
      this.setErrorDetectedFlag();
      this.setErrorDetectedFlagForAllLayers(this.listOfLayerEntryConfig);
      logger.logError(`Error detected while reading WFS metadata for geoview layer ${this.geoviewLayerId}.\n`, error);
    }
  }

  /**
   * Create the layer tree using the service metadata.
   *
   * @returns {TypeJsonObject[]} The layer tree created from the metadata.
   * @protected @override
   */
  protected override createLayerTreeFromServiceMetadata(): EntryConfigBaseClass[] {
    // Extract FeatureType array that list all available layers.
    const featureType = findPropertyNameByRegex(this.getServiceMetadata(), [/(?:FeatureTypeList)/, /(?:FeatureType)/]) as TypeJsonArray;

    // If the feature list contains more than one layer, create a group node.
    if (featureType.length > 1) {
      const groupConfig = toJsonObject({
        layerId: this.geoviewLayerId,
        layerName: this.getLanguage() === 'en' ? 'Layer Group' : 'Groupe de couches',
        isLayerGroup: true,
        listOfLayerEntryConfig: featureType.map((layerMetadata) => {
          return toJsonObject({
            layerId: layerMetadata.Name['#text'],
            layerName: layerMetadata.Title['#text'],
          });
        }),
      });
      return [this.createGroupNode(groupConfig, this.getLanguage(), this)!];
    }

    // Create a single layer using the metadata.
    const layerConfig = toJsonObject({
      layerId: featureType[0].Name['#text'],
      layerName: featureType[0].Title['#text'],
    });
    return [this.createLeafNode(layerConfig, this.getLanguage(), this)!];
  }

  /**
   * Create a layer entry node for a specific layerId using the service metadata. The node returned can only be a
   * layer because the concept of group layer doesn't exist in WFS.
   *
   * @param {string} layerId The layer id to use for the subLayer creation.
   * @param {EntryConfigBaseClass | undefined} parentNode The layer's parent node.
   *
   * @returns {EntryConfigBaseClass} The subLayer created from the metadata.
   * @protected @override
   */
  protected override createLayerEntryNode(layerId: string, parentNode: EntryConfigBaseClass | undefined): EntryConfigBaseClass {
    // If we cannot find the layerId in the layer definitions, throw an error.
    const layerFound = this.findLayerMetadataEntry(layerId);
    if (!layerFound) {
      throw new GeoviewLayerInvalidParameterError('LayerIdNotFound', [layerId?.toString()]);
    }

    // Create the layer using the metadata. WFS metadata has no layer group definition.
    const layerConfig = toJsonObject({
      layerId,
      layerName: layerFound.Title['#text'],
    });
    return this.createLeafNode(layerConfig, this.getLanguage(), this, parentNode)!;
  }

  // #endregion OVERRIDE

  // ==============
  // #region PUBLIC
  /**
   * Process URL parameters. If a parameter is not provided by the user, a default value will be used.
   * Defaults are: service=WFS
   *               request=GetCapabilities
   *               version=2.0.0
   *
   * @param {string} requestToExecute The request to execute (default=GetCapabilities).
   *
   * @returns {string} The new URL.
   * @public
   */
  processUrlParameters(requestToExecute = 'GetCapabilities'): string {
    // Use user-provided parameters, if applicable.
    const metadataAccessPathItems = this.metadataAccessPath.split('?');
    if (metadataAccessPathItems.length === 2) {
      const [metadataAccessPath, metadataAccessParameters] = metadataAccessPathItems;
      // Get the list of parameters (a lower case version).
      const lowerParameters = metadataAccessParameters.toLowerCase().split('&');
      // Get the list of parameters (as provided by the user).
      const originalParameters = metadataAccessParameters.split('&');
      // Find parameters index.
      const serviceIndex = lowerParameters.findIndex((parameter) => parameter.startsWith('service'));
      const versionIndex = lowerParameters.findIndex((parameter) => parameter.startsWith('version'));
      // Get user-provided value or default value
      const service = serviceIndex !== -1 ? originalParameters[serviceIndex] : 'service=WFS';
      const version = versionIndex !== -1 ? originalParameters[versionIndex] : 'version=2.0.0';
      const request = `request=${requestToExecute}`;
      // URL reconstruction using calculated values.
      return `${metadataAccessPath}?${service}&${version}&${request}`;
    }

    // If no parameter was specified, use default values.
    return `${this.metadataAccessPath}?service=WFS&version=2.0.0&request=${requestToExecute}`;
  }

  /**
   * Extract the WFS version from the URL provided by the user. If version is unspecified, version 2.0.0 will be used.
   *
   * @returns {string} The version number.
   * @public
   */
  getWfsVersion(): string {
    // Use user-provided parameters, if applicable.
    const metadataAccessPathItems = this.metadataAccessPath.split('?');
    if (metadataAccessPathItems.length === 2) {
      const [, metadataAccessParameters] = metadataAccessPathItems;
      // Get the list of parameters (a lower case version).
      const parameters = metadataAccessParameters.toLowerCase().split('&');
      // Find version index.
      const versionIndex = parameters.findIndex((parameter) => parameter.startsWith('version'));
      // Get user-provided value or default value
      return versionIndex !== -1 ? parameters[versionIndex] : 'version=2.0.0';
    }

    // If no parameter was specified, use default values.
    return '2.0.0';
  }

  /** ****************************************************************************************************************************
   * This method search recursively the layerId in the layer entry of the capabilities.
   *
   * @param {string} layerId The layer identifier that must exists on the server.
   *
   * @returns {TypeJsonObject | null} The found layer from the capabilities or null if not found.
   */
  findLayerMetadataEntry(layerId: string): TypeJsonObject | null {
    const serviceMetadata = this.getServiceMetadata();
    if (serviceMetadata) {
      const featureType = findPropertyNameByRegex(serviceMetadata, [/(?:FeatureTypeList)/, /(?:FeatureType)/]) as TypeJsonArray;
      // If we cannot find the layerId in the layer definitions, return null.
      const layerFound = featureType.find((layerMetadata) => layerMetadata.Name['#text'] === layerId) as TypeJsonObject | undefined;
      return layerFound || null;
    }
    return null;
  }

  // #endregion PUBLIC
  // #endregion METHODS
  // #endregion CLASS HEADER
}
