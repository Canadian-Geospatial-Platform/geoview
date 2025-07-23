import { ImageWMS } from 'ol/source';
import { Options as SourceOptions } from 'ol/source/ImageWMS';
import WMSCapabilities from 'ol/format/WMSCapabilities';
import { Extent } from 'ol/extent';

import { TypeJsonArray, TypeJsonObject } from '@/api/config/types/config-types';
import { AbstractGeoViewRaster } from '@/geo/layer/geoview-layers/raster/abstract-geoview-raster';
import {
  TypeLayerEntryConfig,
  TypeGeoviewLayerConfig,
  CONST_LAYER_ENTRY_TYPES,
  layerEntryIsGroupLayer,
  TypeOfServer,
  CONST_LAYER_TYPES,
} from '@/api/config/types/map-schema-types';
import { DateMgt } from '@/core/utils/date-mgt';
import { validateExtent, validateExtentWhenDefined } from '@/geo/utils/utilities';
import { CV_CONFIG_PROXY_URL } from '@/api/config/types/config-constants';
import { logger } from '@/core/utils/logger';
import {
  OgcWmsLayerEntryConfig,
  TypeMetadataWMS,
} from '@/core/utils/config/validation-classes/raster-validation-classes/ogc-wms-layer-entry-config';
import { GroupLayerEntryConfig } from '@/core/utils/config/validation-classes/group-layer-entry-config';
import { ConfigBaseClass } from '@/core/utils/config/validation-classes/config-base-class';
import { CancelledError, NetworkError, PromiseRejectErrorWrapper } from '@/core/exceptions/core-exceptions';
import { LayerDataAccessPathMandatoryError, LayerNoCapabilitiesError } from '@/core/exceptions/layer-exceptions';
import {
  LayerEntryConfigLayerIdNotFoundError,
  LayerEntryConfigWMSSubLayerNotFoundError,
} from '@/core/exceptions/layer-entry-config-exceptions';
import { Fetch } from '@/core/utils/fetch-helper';
import { deepMergeObjects } from '@/core/utils/utilities';
import { GVWMS } from '@/geo/layer/gv-layers/raster/gv-wms';

export interface TypeWMSLayerConfig extends Omit<TypeGeoviewLayerConfig, 'listOfLayerEntryConfig'> {
  geoviewLayerType: typeof CONST_LAYER_TYPES.WMS;
  listOfLayerEntryConfig: OgcWmsLayerEntryConfig[];
}

/**
 * A class to add wms layer.
 *
 * @exports
 * @class WMS
 */
export class WMS extends AbstractGeoViewRaster {
  WMSStyles: string[];

  fullSubLayers: boolean = false;

  /**
   * Constructs a WMS Layer configuration processor.
   * @param {TypeWMSLayerConfig} layerConfig the layer configuration
   */
  constructor(layerConfig: TypeWMSLayerConfig, fullSubLayers: boolean) {
    super(CONST_LAYER_TYPES.WMS, layerConfig);
    this.WMSStyles = [];
    this.fullSubLayers = fullSubLayers;
  }

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   * @override
   * @returns {TypeMetadataWMS | undefined} The strongly-typed layer configuration specific to this layer.
   */
  override getMetadata(): TypeMetadataWMS | undefined {
    return super.getMetadata() as TypeMetadataWMS | undefined;
  }

  /**
   * Recursively gets the layer capability for a given layer id.
   * @param {string} layerId - The layer identifier to get the capabilities for.
   * @param {TypeJsonObject | undefined} currentLayerEntry - The current layer entry from the capabilities that will be recursively searched.
   * @returns {TypeJsonObject?} The found layer from the capabilities or undefined if not found.
   */
  getLayerCapabilities(
    layerId: string,
    currentLayerEntry: TypeJsonObject | undefined = this.getMetadata()?.Capability.Layer
  ): TypeJsonObject | undefined {
    if (!currentLayerEntry) return undefined;
    if ('Name' in currentLayerEntry && (currentLayerEntry.Name as string) === layerId) return currentLayerEntry;
    if ('Layer' in currentLayerEntry) {
      if (Array.isArray(currentLayerEntry.Layer)) {
        for (let i = 0; i < currentLayerEntry.Layer.length; i++) {
          const layerFound = this.getLayerCapabilities(layerId, currentLayerEntry.Layer[i]);
          if (layerFound) return layerFound;
        }
        return undefined;
      }
      return this.getLayerCapabilities(layerId, currentLayerEntry.Layer);
    }
    return undefined;
  }

  /**
   * Fetches and processes service metadata for the WMS layer.
   * Depending on whether the metadata URL points to an XML document or a standard WMS endpoint,
   * this method delegates to the appropriate metadata fetching logic.
   * - If the URL ends in `.xml`, a direct XML metadata fetch is performed.
   * - Otherwise, the method constructs a WMS GetCapabilities request.
   *   - If no specific layer configs are provided, a single metadata fetch is made.
   *   - If layer configs are present (e.g., Geomet use case), individual layer metadata is merged.
   * @returns {Promise<TypeMetadataWMS | undefined>} A promise resolving to the parsed metadata object,
   * or `undefined` if metadata could not be retrieved or no capabilities were found.
   */
  protected override onFetchServiceMetadata(): Promise<TypeMetadataWMS | undefined> {
    // If metadata is in XML format (not WMS GetCapabilities)
    const isXml = WMS.#isXmlMetadata(this.metadataAccessPath);
    if (isXml) {
      // Fetch the XML
      return this.#fetchXmlServiceMetadata(this.metadataAccessPath, (proxyUsed) => {
        // Update the access path to use the proxy if one was required
        this.metadataAccessPath = `${proxyUsed}${this.metadataAccessPath}`;
      });
    }

    // Construct a proper WMS GetCapabilities URL
    const url = WMS.#buildGetCapabilitiesUrl(this.metadataAccessPath);

    // Get the layer entries we need to query
    const layerConfigsToQuery = this.#getLayersToQuery();

    if (layerConfigsToQuery.length === 0) {
      // If no specific layers to query, fetch and process metadata for the entire service
      return this.#fetchAndProcessSingleWmsMetadata(url);
    }

    // Fetch and merge metadata for each layer individually
    return this.#fetchAndMergeMultipleWmsMetadata(url, layerConfigsToQuery);
  }

  /**
   * Overrides the way a geoview layer config initializes its layer entries.
   * @returns {Promise<TypeGeoviewLayerConfig>} A promise resolved once the layer entries have been initialized.
   */
  protected override async onInitLayerEntries(): Promise<TypeGeoviewLayerConfig> {
    // Get the metadata
    const metadata = await this.onFetchServiceMetadata();

    // Based on the capabilities
    const layers = metadata!.Capability.Layer.Layer as TypeJsonArray;

    // Now that we have metadata
    const entries = layers.map((layer) => {
      return { id: layer.Name, layerId: layer.Name, layerName: layer.Title };
    });

    // Redirect
    return WMS.createWMSLayerConfig(
      this.geoviewLayerId,
      metadata?.Capability.Layer.Title || this.geoviewLayerName,
      this.metadataAccessPath,
      'mapserver',
      false,
      entries as unknown as TypeJsonArray
    );
  }

  /**
   * Overrides the validation of a layer entry config.
   * @param {ConfigBaseClass} layerConfig - The layer entry config to validate.
   */
  protected override onValidateLayerEntryConfig(layerConfig: ConfigBaseClass): void {
    const layerFound = this.getLayerCapabilities(layerConfig.layerId);
    if (!layerFound) {
      // Add a layer load error
      this.addLayerLoadError(new LayerEntryConfigLayerIdNotFoundError(layerConfig), layerConfig);
      return;
    }

    if ('Layer' in layerFound) {
      this.#createGroupLayer(layerFound, layerConfig as unknown as GroupLayerEntryConfig);
      return;
    }

    // eslint-disable-next-line no-param-reassign
    if (!layerConfig.layerName) layerConfig.layerName = layerFound.Title as string;
  }

  /**
   * Overrides the way the layer metadata is processed.
   * @param {OgcWmsLayerEntryConfig} layerConfig - The layer entry configuration to process.
   * @returns {Promise<OgcWmsLayerEntryConfig>} A promise that the layer entry configuration has gotten its metadata processed.
   */
  protected override onProcessLayerMetadata(layerConfig: OgcWmsLayerEntryConfig): Promise<OgcWmsLayerEntryConfig> {
    // Get the layer capabilities
    const layerCapabilities = this.getLayerCapabilities(layerConfig.layerId)!;

    // Set the layer metadata (capabilities)
    layerConfig.setLayerMetadata(layerCapabilities);

    // If found
    if (layerCapabilities) {
      const attributions = layerConfig.getAttributions();
      if (layerCapabilities.Attribution && !attributions.includes(layerCapabilities.Attribution?.Title as string)) {
        // Add it
        attributions.push(layerCapabilities.Attribution.Title as string);
        layerConfig.setAttributions(attributions);
      }

      // eslint-disable-next-line no-param-reassign
      if (!layerConfig.source.featureInfo) layerConfig.source.featureInfo = { queryable: !!layerCapabilities.queryable };

      // Set Min/Max Scale Limits (MaxScale should be set to the largest and MinScale should be set to the smallest)
      // Example: If MinScaleDenominator is 100,000 and maxScale is 50,000, then 100,000 should be used. This is because
      // the service will stop at 100,000 and if you zoom in more, you will get no data anyway.
      // GV Note: MinScaleDenominator is actually the maxScale and MaxScaleDenominator is actually the minScale
      if (layerCapabilities.MinScaleDenominator) {
        // eslint-disable-next-line no-param-reassign
        layerConfig.maxScale = Math.max(layerConfig.maxScale ?? -Infinity, layerCapabilities.MinScaleDenominator as number);
      }
      if (layerCapabilities.MaxScaleDenominator) {
        // eslint-disable-next-line no-param-reassign
        layerConfig.minScale = Math.min(layerConfig.minScale ?? Infinity, layerCapabilities.MaxScaleDenominator as number);
      }

      // eslint-disable-next-line no-param-reassign
      layerConfig.initialSettings.extent = validateExtentWhenDefined(layerConfig.initialSettings.extent);

      if (!layerConfig.initialSettings?.bounds && layerCapabilities.EX_GeographicBoundingBox) {
        // eslint-disable-next-line no-param-reassign
        layerConfig.initialSettings.bounds = validateExtent(layerCapabilities.EX_GeographicBoundingBox as Extent);
      }

      // If there's a dimension
      if (layerCapabilities.Dimension) {
        // TODO: Validate the layerCapabilities.Dimension for example if an interval is even possible

        // TODO: Validate the layerConfig.layerFilter is compatible with the layerCapabilities.Dimension and if not remove it completely like `delete layerConfig.layerFilter`

        const temporalDimension = (layerCapabilities.Dimension as TypeJsonArray).find((dimension) => dimension.name === 'time');

        // If a temporal dimension was found
        if (temporalDimension) {
          layerConfig.setTemporalDimension(DateMgt.createDimensionFromOGC(temporalDimension));
        }
      }
    }

    // Return the layer config
    return Promise.resolve(layerConfig);
  }

  /**
   * Overrides the creation of the GV Layer
   * @param {OgcWmsLayerEntryConfig} layerConfig - The layer entry configuration.
   * @returns {GVWMS} The GV Layer
   */
  protected override onCreateGVLayer(layerConfig: OgcWmsLayerEntryConfig): GVWMS {
    // Create the source
    const source = this.createImageWMSSource(layerConfig);

    // Create the GV Layer
    const gvLayer = new GVWMS(source, layerConfig);

    // Return it
    return gvLayer;
  }

  /**
   * Creates an ImageWMS source from a layer config.
   * @param {OgcWmsLayerEntryConfig} layerConfig - The configuration for the WMS layer.
   * @returns A fully configured ImageWMS source.
   * @throws If required config fields like dataAccessPath are missing.
   */
  createImageWMSSource(layerConfig: OgcWmsLayerEntryConfig): ImageWMS {
    const { source } = layerConfig;

    // Validate required data access path
    if (!source?.dataAccessPath) {
      throw new LayerDataAccessPathMandatoryError(layerConfig.layerPath, layerConfig.getLayerName());
    }

    const { dataAccessPath } = source;

    // Get the layer capabilities
    const layerCapabilities = this.getLayerCapabilities(layerConfig.layerId);

    if (!layerCapabilities) {
      // Throw sub layer not found
      throw new LayerEntryConfigWMSSubLayerNotFoundError(layerConfig, this.geoviewLayerId);
    }

    // Update internal style list for UI or info
    if (Array.isArray(layerConfig.source?.wmsStyle)) {
      this.WMSStyles = layerConfig.source.wmsStyle;
    } else if ((layerCapabilities.Style?.length as number) > 1) {
      this.WMSStyles = (layerCapabilities.Style as TypeJsonArray).map((style: TypeJsonObject) => style.Name as string);
    } else {
      const fallbackStyle =
        layerConfig.source?.wmsStyle ||
        ((layerCapabilities.Style?.length as number) > 0 && (layerCapabilities.Style?.[0]?.Name as string)) ||
        '';
      this.WMSStyles = [fallbackStyle];
    }

    // Determine the style to use (layer config > capabilities fallback)
    let styleToUse = '';
    if (Array.isArray(source.wmsStyle) && source.wmsStyle.length > 0) {
      [styleToUse] = source.wmsStyle;
    } else if (typeof source.wmsStyle === 'string') {
      styleToUse = source.wmsStyle;
    } else if (layerCapabilities?.Style && (layerCapabilities.Style.length as number) > 0) {
      styleToUse = layerCapabilities.Style[0].Name as string;
    }

    const sourceOptions: SourceOptions = {
      url: dataAccessPath,
      params: {
        LAYERS: layerConfig.layerId,
        STYLES: styleToUse,
      },
      attributions: layerConfig.getAttributions(),
      serverType: source.serverType,
      crossOrigin: source.crossOrigin ?? 'Anonymous',
    };

    // Optional projection override
    if (source.projection) {
      sourceOptions.projection = `EPSG:${source.projection}`;
    }

    // Create the source
    const olSource = new ImageWMS(sourceOptions);

    // Apply the filter on the source right away, before the first load
    GVWMS.applyViewFilterOnSource(layerConfig, olSource, layerConfig.getExternalFragmentsOrder(), undefined, layerConfig.layerFilter);

    // Return the source
    return olSource;
  }

  /**
   * Fetches WMS service metadata using a single GetCapabilities request,
   * and applies metadata inheritance if applicable.
   *
   * This method is used when no specific layer filtering is required — typically for standard WMS services.
   * It updates the metadata access path if a proxy is involved and ensures the metadata hierarchy is processed.
   *
   * @param {string} url - The full WMS GetCapabilities URL to fetch metadata from.
   * @returns {Promise<TypeJsonObject | undefined>} A promise resolving to the parsed metadata object,
   * or `undefined` if the fetch failed or metadata is invalid.
   */
  async #fetchAndProcessSingleWmsMetadata(url: string): Promise<TypeMetadataWMS | undefined> {
    // Fetch the WMS GetCapabilities document from the given URL
    const metadata = await WMS.fetchMetadataWMS(url, (proxyUsed) => {
      // If a proxy was used, update the metadata access path accordingly
      this.metadataAccessPath = `${proxyUsed}${this.metadataAccessPath}`;
    });

    // Apply metadata inheritance to ensure nested layer structures are properly populated
    this.#processMetadataInheritance(metadata?.Capability?.Layer);
    return metadata;
  }

  /**
   * Fetches WMS metadata for each unique layer individually and merges them into a single metadata structure.
   * This method is typically used in cases like GeoMet where individual layer metadata must be requested
   * separately using the `Layers` parameter in the GetCapabilities URL. It avoids duplicate requests for the
   * same `layerId`, handles proxy path updates, merges the individual metadata results into a single
   * base structure, and processes metadata inheritance afterward.
   * @param {string} url - The base WMS GetCapabilities URL used to fetch metadata.
   * @param {TypeLayerEntryConfig[]} layers - An array of layer configurations to fetch and merge metadata for.
   * @returns {Promise<TypeJsonObject | undefined>} A promise resolving to the merged metadata object,
   * or `undefined` if all requests failed.
   */
  async #fetchAndMergeMultipleWmsMetadata(url: string, layers: TypeLayerEntryConfig[]): Promise<TypeMetadataWMS | undefined> {
    // Create one metadata fetch promise per unique layerId
    const metadataPromises = this.#createLayerMetadataPromises(url, layers);

    // Wait for all requests to settle (either fulfilled or rejected)
    const results = await Promise.allSettled(metadataPromises);

    // If all metadata fetches failed, flag the first layer's parent as errored and abort
    if (results.every((r) => r.status === 'rejected')) {
      layers[0].parentLayerConfig?.setLayerStatusError();
      return undefined;
    }

    // Merge metadata results
    let baseMetadata: TypeMetadataWMS | undefined;
    for (const result of results) {
      if (result.status === 'fulfilled') {
        const { metadata, layerConfig } = result.value;

        // Use the first successful metadata as the base structure
        if (!baseMetadata) {
          baseMetadata = metadata;
        }

        // Check if this layer's metadata is already included in the base structure
        const alreadyExists = this.getLayerCapabilities(layerConfig.layerId, baseMetadata?.Capability?.Layer);
        if (!alreadyExists) {
          const layerPath = this.#getMetadataLayerPath(layerConfig.layerId, metadata.Capability.Layer);

          // Add the layer's metadata into the base structure
          this.#addLayerToMetadataInstance(layerPath, baseMetadata.Capability.Layer, metadata.Capability.Layer);
        }
      } else {
        // Log and track metadata fetch failure
        const reason = result.reason as PromiseRejectErrorWrapper<TypeLayerEntryConfig>;
        this.addLayerLoadError(reason.error, reason.object);
      }
    }

    // Final pass to apply inheritance rules across the merged metadata tree
    this.#processMetadataInheritance(baseMetadata!.Capability.Layer);
    return baseMetadata;
  }

  /**
   * Creates a list of promises to fetch WMS metadata for a set of layer configurations.
   * This function ensures that each unique `layerId` results in only one network request,
   * even if multiple layer configs share the same ID. The resulting promises will either
   * resolve to a metadata result or reject with a wrapped error.
   * @param {string} url - The base GetCapabilities URL used to fetch layer-specific metadata.
   * @param {TypeLayerEntryConfig[]} layers - An array of layer configurations to fetch metadata for.
   * @returns {Promise<MetatadaFetchResult>[]} An array of metadata fetch promises, one per layer config.
   */
  #createLayerMetadataPromises(url: string, layers: TypeLayerEntryConfig[]): Promise<MetatadaFetchResult>[] {
    const seen = new Map<string, Promise<MetatadaFetchResult>>();

    return layers.map((layerConfig) => {
      // Avoid duplicate fetches for the same layerId
      if (!seen.has(layerConfig.layerId)) {
        const promise = new Promise<MetatadaFetchResult>((resolve, reject) => {
          // Perform the actual metadata fetch
          WMS.fetchMetadataWMS(`${url}&Layers=${layerConfig.layerId}`, (proxyUsed) => {
            // If a proxy was used, update the layer's data access path
            // eslint-disable-next-line no-param-reassign
            layerConfig.source!.dataAccessPath = `${proxyUsed}${this.metadataAccessPath}`;
          })
            .then((metadata) => {
              if (metadata.Capability) {
                resolve({ metadata, layerConfig });
              } else {
                // No capabilities found in the response
                reject(
                  new PromiseRejectErrorWrapper(
                    new LayerNoCapabilitiesError(layerConfig.geoviewLayerConfig.geoviewLayerId, layerConfig.getLayerName()),
                    layerConfig
                  )
                );
              }
            })
            .catch((error) => {
              // Wrap any fetch error with additional layer context
              reject(new PromiseRejectErrorWrapper(error, layerConfig));
            });
        });

        // Store the promise for this layerId to avoid duplicate requests
        seen.set(layerConfig.layerId, promise);
      }

      // Return the cached or newly created promise
      return seen.get(layerConfig.layerId)!;
    });
  }

  /**
   * This method reads the service metadata from a XML metadataAccessPath.
   * @param {string} metadataUrl The metadataAccessPath
   * @param {Function} callbackNewMetadataUrl - Callback executed when a proxy had to be used to fetch the metadata.
   *                                            The parameter sent in the callback is the proxy prefix with the '?' at the end.
   * @returns {Promise<void>} A promise that the execution is completed.
   * @private
   */
  async #fetchXmlServiceMetadata(metadataUrl: string, callbackNewMetadataUrl?: (proxyUsed: string) => void): Promise<TypeMetadataWMS> {
    // Fetch it
    const capabilities = await WMS.fetchMetadataWMS(metadataUrl, callbackNewMetadataUrl);

    this.#processMetadataInheritance(capabilities.Capability.Layer);
    const metadataAccessPath = capabilities?.Capability.Request.GetMap.DCPType[0].HTTP.Get.OnlineResource as string;

    // TODO: Remove this setting from this fetch function
    this.metadataAccessPath = metadataAccessPath;

    const dataAccessPath = capabilities?.Capability.Request.GetMap.DCPType[0].HTTP.Get.OnlineResource as string;
    const setDataAccessPath = (listOfLayerEntryConfig: TypeLayerEntryConfig[]): void => {
      listOfLayerEntryConfig.forEach((layerConfig) => {
        if (layerEntryIsGroupLayer(layerConfig)) setDataAccessPath(layerConfig.listOfLayerEntryConfig);
        else {
          // eslint-disable-next-line no-param-reassign
          layerConfig.source!.dataAccessPath = dataAccessPath;
        }
      });
    };

    // TODO: Remove this setting from this fetch function
    setDataAccessPath(this.listOfLayerEntryConfig);

    // Return the metadata
    return capabilities;
  }

  /**
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

  /**
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

  /**
   * Reads the layer identifiers from the configuration to create an array that will be used in the GetCapabilities.
   * @returns {TypeLayerEntryConfig[]} The array of layer configurations.
   * @private
   */
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

  /**
   * Propagates the WMS metadata inherited values.
   * @param {TypeJsonObject} layer The layer property from the metadata that will inherit the values
   * @param {TypeJsonObject | undefined} parentLayer The parent layer that contains the inherited values
   * @private
   */
  #processMetadataInheritance(layer: TypeJsonObject, parentLayer?: TypeJsonObject): void {
    if (layer && parentLayer) {
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
    if (layer?.Layer !== undefined) (layer.Layer as TypeJsonArray).forEach((subLayer) => this.#processMetadataInheritance(subLayer, layer));
  }

  /**
   * Recursively creates dynamic group layers from the service metadata.
   * @param {TypeJsonObject} layer The dynamic group layer metadata.
   * @param {GroupLayerEntryConfig} layerConfig The group layer configuration associated to the dynamic group.
   * @private
   */
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

    // Loop on the sub layers
    arrayOfLayerMetadata.forEach((subLayer) => {
      // Log for pertinent debugging purposes
      logger.logTraceCore('WMS - createGroupLayer', 'Cloning the layer config', layerConfig.layerPath);
      const subLayerEntryConfig: ConfigBaseClass = layerConfig.clone();
      subLayerEntryConfig.parentLayerConfig = layerConfig;
      subLayerEntryConfig.layerId = subLayer.Name as string;
      subLayerEntryConfig.layerName = subLayer.Title as string;
      newListOfLayerEntryConfig.push(subLayerEntryConfig as TypeLayerEntryConfig);

      // If we don't want all sub layers (simulating the 'Private element not on object' error we had for long time)
      if (!this.fullSubLayers) {
        // Skip the rest on purpose (ref TODO: Bug above)
        throw new CancelledError();
      }

      // Alert that we want to register an extra layer entry
      this.emitLayerEntryRegisterInit({ config: subLayerEntryConfig });
    });

    // TODO: Bug - Continuation of the TODO Bug above.. Purposely don't do this anymore (the throw will cause skipping of this)
    // TO.DOCONT: in order to reproduce the old behavior now that the 'Private element' bug is fixed..
    // TO.DOCONT: Leaving the code there, uncommented, so that if/when we remove the throw of the
    // TO.DOCONT: 'Processing cancelled' this gets executed as would be expected
    // eslint-disable-next-line no-param-reassign
    layerConfig.entryType = CONST_LAYER_ENTRY_TYPES.GROUP;
    // eslint-disable-next-line no-param-reassign
    layerConfig.isMetadataLayerGroup = true;
    // eslint-disable-next-line no-param-reassign
    layerConfig.listOfLayerEntryConfig = newListOfLayerEntryConfig;
    this.validateListOfLayerEntryConfig(newListOfLayerEntryConfig);
  }

  // #region STATIC

  /**
   * Fetches the metadata for a typical WMS class.
   * @param {string} url - The url to query the metadata from.
   * @param {Function} callbackNewMetadataUrl - Callback executed when a proxy had to be used to fetch the metadata.
   *                                            The parameter sent in the callback is the proxy prefix with the '?' at the end.
   */
  static async fetchMetadataWMS(url: string, callbackNewMetadataUrl?: (proxyUsed: string) => void): Promise<TypeMetadataWMS> {
    let capabilitiesString;
    try {
      // Fetch the metadata
      capabilitiesString = await Fetch.fetchText(url);
    } catch (error: unknown) {
      // If a network error such as CORS
      if (error instanceof NetworkError) {
        // We're going to change the metadata url to use a proxy
        const newProxiedMetadataUrl = `${CV_CONFIG_PROXY_URL}?${url}`;

        // Try again with the proxy this time
        capabilitiesString = await Fetch.fetchText(newProxiedMetadataUrl);

        // Callback about it
        callbackNewMetadataUrl?.(`${CV_CONFIG_PROXY_URL}?`);
      } else {
        // Unknown error, throw it
        throw error;
      }
    }

    // Continue reading the metadata to return it
    const parser = new WMSCapabilities();
    return parser.read(capabilitiesString);
  }

  /**
   * Initializes a GeoView layer configuration for a WMS layer.
   * This method creates a basic TypeGeoviewLayerConfig using the provided
   * ID, name, and metadata access path URL. It then initializes the layer entries by calling
   * `initGeoViewLayerEntries`, which may involve fetching metadata or sublayer info.
   * @param {string} geoviewLayerId - A unique identifier for the layer.
   * @param {string} geoviewLayerName - The display name of the layer.
   * @param {string} metadataAccessPath - The full service URL to the layer endpoint.
   * @returns {Promise<TypeGeoviewLayerConfig>} A promise that resolves to an initialized GeoView layer configuration with layer entries.
   */
  static initGeoviewLayerConfig(
    geoviewLayerId: string,
    geoviewLayerName: string,
    metadataAccessPath: string,
    fullSubLayers: boolean
  ): Promise<TypeGeoviewLayerConfig> {
    // Create the Layer config
    const myLayer = new WMS({ geoviewLayerId, geoviewLayerName, metadataAccessPath } as TypeWMSLayerConfig, fullSubLayers);
    return myLayer.initGeoViewLayerEntries();
  }

  /**
   * Creates a configuration object for a WMS layer.
   * This function constructs a `TypeWMSLayerConfig` object that describes an WMS layer
   * and its associated entry configurations based on the provided parameters.
   * @param {string} geoviewLayerId - A unique identifier for the GeoView layer.
   * @param {string} geoviewLayerName - The display name of the GeoView layer.
   * @param {string} metadataAccessPath - The URL or path to access metadata.
   * @param {TypeOfServer} serverType - The server type.
   * @param {boolean} isTimeAware - Indicates whether the layer supports time-based filtering.
   * @param {TypeJsonArray} layerEntries - An array of layer entries objects to be included in the configuration.
   * @param {TypeJsonObject} customGeocoreLayerConfig - An optional layer config from Geocore.
   * @returns {TypeWMSLayerConfig} The constructed configuration object for the WMS layer.
   */
  static createWMSLayerConfig(
    geoviewLayerId: string,
    geoviewLayerName: string,
    metadataAccessPath: string,
    serverType: TypeOfServer,
    isTimeAware: boolean,
    layerEntries: TypeJsonArray,
    customGeocoreLayerConfig: TypeJsonObject = {}
  ): TypeWMSLayerConfig {
    const geoviewLayerConfig: TypeWMSLayerConfig = {
      geoviewLayerId,
      geoviewLayerName,
      metadataAccessPath,
      geoviewLayerType: CONST_LAYER_TYPES.WMS,
      isTimeAware,
      listOfLayerEntryConfig: [],
    };
    geoviewLayerConfig.listOfLayerEntryConfig = layerEntries.map((layerEntry) => {
      const layerEntryConfig = {
        geoviewLayerConfig,
        schemaTag: CONST_LAYER_TYPES.WMS,
        entryType: CONST_LAYER_ENTRY_TYPES.RASTER_IMAGE,
        layerId: `${layerEntry.id}`,
        layerName: (layerEntry.layerName as string) || (layerEntry.id as string),
        source: {
          serverType: serverType ?? 'mapserver',
          dataAccessPath: metadataAccessPath,
        },
      };

      // Overwrite default from geocore custom config
      const mergedConfig = deepMergeObjects(layerEntryConfig as unknown as TypeJsonObject, customGeocoreLayerConfig);

      // Reconstruct
      return new OgcWmsLayerEntryConfig(mergedConfig as unknown as OgcWmsLayerEntryConfig);
    });

    // Return it
    return geoviewLayerConfig;
  }

  /**
   * Determines whether the provided metadata URL points to a raw XML document.
   *
   * This is used to detect non-standard metadata endpoints that don't follow
   * the WMS GetCapabilities convention.
   *
   * @param {string} path - The metadata URL to check.
   * @returns {boolean} `true` if the URL ends with `.xml`, otherwise `false`.
   */
  static #isXmlMetadata(path: string): boolean {
    // Normalize case and check for '.xml' suffix
    return path.toLowerCase().endsWith('.xml');
  }

  /**
   * Constructs a full WMS GetCapabilities request URL from a base metadata path.
   * If the input URL already includes a `request=GetCapabilities` parameter,
   * it is returned as-is. Otherwise, the standard query string is appended.
   * @param {string} baseUrl - The base URL to convert.
   * @returns {string} A properly formatted WMS GetCapabilities URL.
   */
  static #buildGetCapabilitiesUrl(baseUrl: string): string {
    // Avoid adding the query string if it's already present
    return baseUrl.includes('request=GetCapabilities') ? baseUrl : `${baseUrl}?service=WMS&version=1.3.0&request=GetCapabilities`;
  }

  // #endregion
}

/**
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

/**
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

/** Local type to work with a metadata fetch result */
type MetatadaFetchResult = { layerConfig: TypeLayerEntryConfig; metadata: TypeMetadataWMS };
