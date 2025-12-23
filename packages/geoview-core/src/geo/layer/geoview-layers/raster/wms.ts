import { ImageWMS } from 'ol/source';
import type { Options as SourceOptions } from 'ol/source/ImageWMS';

import { AbstractGeoViewRaster } from '@/geo/layer/geoview-layers/raster/abstract-geoview-raster';
import type {
  TypeLayerEntryConfig,
  TypeGeoviewLayerConfig,
  TypeOfServer,
  TypeMetadataWMS,
  TypeMetadataWMSCapabilityLayer,
  TypeStylesWMS,
} from '@/api/types/layer-schema-types';
import type { TypeLayerStyleSettings, TypeStyleGeometry } from '@/api/types/map-schema-types';
import { CONST_LAYER_TYPES, CONST_LAYER_ENTRY_TYPES } from '@/api/types/layer-schema-types';
import { DateMgt } from '@/core/utils/date-mgt';
import type { CallbackNewMetadataDelegate } from '@/geo/utils/utilities';
import { GeoUtilities } from '@/geo/utils/utilities';
import type { OgcWmsLayerEntryConfigProps } from '@/api/config/validation-classes/raster-validation-classes/ogc-wms-layer-entry-config';
import { OgcWmsLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/ogc-wms-layer-entry-config';
import type { GroupLayerEntryConfigProps } from '@/api/config/validation-classes/group-layer-entry-config';
import { GroupLayerEntryConfig } from '@/api/config/validation-classes/group-layer-entry-config';
import type { TypeLayerEntryShell } from '@/api/config/validation-classes/config-base-class';
import { ConfigBaseClass } from '@/api/config/validation-classes/config-base-class';
import { CancelledError, formatError, PromiseRejectErrorWrapper } from '@/core/exceptions/core-exceptions';
import {
  LayerEntryConfigFieldsNotFoundError,
  LayerNoCapabilitiesError,
  LayerServiceMetadataUnableToFetchError,
} from '@/core/exceptions/layer-exceptions';
import {
  LayerEntryConfigLayerIdNotFoundError,
  LayerEntryConfigWMSSubLayerNotFoundError,
} from '@/core/exceptions/layer-entry-config-exceptions';
import { deepMergeObjects } from '@/core/utils/utilities';
import { AbstractGeoViewLayer } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { GVWMS } from '@/geo/layer/gv-layers/raster/gv-wms';
import type { AbstractBaseLayerEntryConfig } from '@/api/config/validation-classes/abstract-base-layer-entry-config';
import { WfsRenderer } from '@/geo/utils/renderer/wfs-renderer';
import { logger } from '@/core/utils/logger';

export interface TypeWMSLayerConfig extends Omit<TypeGeoviewLayerConfig, 'listOfLayerEntryConfig'> {
  geoviewLayerType: typeof CONST_LAYER_TYPES.WMS;
  fetchVectorsOnWFS?: boolean;
  listOfLayerEntryConfig: OgcWmsLayerEntryConfig[];
}

/**
 * A class to add wms layer.
 *
 * @exports
 * @class WMS
 */
export class WMS extends AbstractGeoViewRaster {
  fullSubLayers: boolean = false;

  /**
   * Constructs a WMS Layer configuration processor.
   * @param {TypeWMSLayerConfig} layerConfig the layer configuration
   */
  constructor(layerConfig: TypeWMSLayerConfig, fullSubLayers: boolean) {
    super(layerConfig);
    this.fullSubLayers = fullSubLayers;
  }

  // #region OVERRIDES

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   * @override
   * @returns {TypeMetadataWMS | undefined} The strongly-typed layer configuration specific to this layer.
   */
  override getMetadata(): TypeMetadataWMS | undefined {
    return super.getMetadata() as TypeMetadataWMS | undefined;
  }

  /**
   * Fetches and processes service metadata for the WMS layer.
   * Depending on whether the metadata URL points to an XML document or a standard WMS endpoint,
   * this method delegates to the appropriate metadata fetching logic.
   * - If the URL ends in `.xml`, a direct XML metadata fetch is performed.
   * - Otherwise, the method constructs a WMS GetCapabilities request.
   *   - If no specific layer configs are provided, a single metadata fetch is made.
   *   - If layer configs are present (e.g., Geomet use case), individual layer metadata is merged.
   * @param {AbortSignal | undefined} [abortSignal] - Abort signal to handle cancelling of fetch.
   * @returns {Promise<T = TypeMetadataWMS | undefined>} A promise resolving to the parsed metadata object,
   * or `undefined` if metadata could not be retrieved or no capabilities were found.
   * @throws {LayerServiceMetadataUnableToFetchError} When the metadata fetch fails or contains an error.
   */
  protected override onFetchServiceMetadata<T = TypeMetadataWMS | undefined>(abortSignal?: AbortSignal): Promise<T> {
    // If metadata is in XML format (not WMS GetCapabilities)
    const isXml = WMS.#isXmlMetadata(this.getMetadataAccessPath());
    if (isXml) {
      // Fetch the XML
      return this.#fetchXmlServiceMetadata(
        this.getMetadataAccessPath(),
        (proxyUsed) => {
          // Update the access path to use the proxy if one was required
          this.setMetadataAccessPath(`${proxyUsed}${this.getMetadataAccessPath()}`);
        },
        abortSignal
      ) as Promise<T>;
    }

    // Construct a proper WMS GetCapabilities URL
    const url = this.getMetadataAccessPath();

    // Get the layer entries we need to query
    const layerConfigsToQuery = this.#getLayersToQuery();

    if (layerConfigsToQuery.length === 0) {
      // If no specific layers to query, fetch and process metadata for the entire service
      return this.#fetchAndProcessSingleWmsMetadata(url) as Promise<T>;
    }

    // Fetch and merge metadata for each layer individually
    return this.#fetchAndMergeMultipleWmsMetadata(url, layerConfigsToQuery) as Promise<T>;
  }

  /**
   * Overrides the way a geoview layer config initializes its layer entries.
   * @param {AbortSignal | undefined} [abortSignal] - Abort signal to handle cancelling of fetch.
   * @returns {Promise<TypeGeoviewLayerConfig>} A promise resolved once the layer entries have been initialized.
   * @throws {LayerServiceMetadataUnableToFetchError} When the metadata fetch fails or contains an error.
   */
  protected override async onInitLayerEntries(abortSignal?: AbortSignal): Promise<TypeGeoviewLayerConfig> {
    // Get the metadata
    const metadata = await this.onFetchServiceMetadata(abortSignal);

    // Based on the capabilities
    const layers = metadata!.Capability.Layer.Layer!;

    // Build the layer tree
    const entries = WMS.#buildLayerTree(layers);

    // Redirect
    return WMS.createGeoviewLayerConfig(
      this.getGeoviewLayerId(),
      metadata?.Capability.Layer.Title || this.getGeoviewLayerName(),
      this.getMetadataAccessPath(),
      undefined,
      this.getGeoviewLayerConfig().isTimeAware,
      entries || [],
      true // We want all sub layers when we're initializing the layer entries (different than when we're processing)
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

    // If a group
    if (layerFound.Layer) {
      // Make sure it's an array
      let layerMetadataSubTree: TypeMetadataWMSCapabilityLayer[] = layerFound.Layer;
      if (!Array.isArray(layerFound.Layer)) layerMetadataSubTree = [layerFound.Layer];

      // Map the sub layers information
      const layerConfigMapped = layerMetadataSubTree.map((config) => {
        return { layerId: config.Name!, layerName: config.Title } as TypeLayerEntryShell;
      });

      // Cast it
      const layerConfigGroup = layerConfig as GroupLayerEntryConfig;

      // Create the group layers
      WMS.#createGroupLayerRec(layerConfigMapped, layerConfigGroup, this.fullSubLayers, (config: ConfigBaseClass) => {
        // Alert that we want to register an extra layer entry
        this.emitLayerEntryRegisterInit({ config });
      });

      // Validate the list
      this.validateListOfLayerEntryConfig(layerConfigGroup.listOfLayerEntryConfig);
      return;
    }

    // If no name and layer has a title
    if (!layerConfig.getLayerName() && layerFound.Title) layerConfig.setLayerName(layerFound.Title);
  }

  /**
   * Overrides the way the layer metadata is processed.
   * @param {OgcWmsLayerEntryConfig} layerConfig - The layer entry configuration to process.
   * @returns {Promise<OgcWmsLayerEntryConfig>} A promise that the layer entry configuration has gotten its metadata processed.
   */
  protected override async onProcessLayerMetadata(layerConfig: OgcWmsLayerEntryConfig): Promise<OgcWmsLayerEntryConfig> {
    // Get the layer capabilities
    const layerCapabilities = this.getLayerCapabilities(layerConfig.layerId)!;

    // Set the layer metadata (capabilities)
    layerConfig.setLayerMetadata(layerCapabilities);

    // If found
    if (layerCapabilities) {
      // Check if metadata says it's queryable
      const raw = layerCapabilities['@attributes'].queryable;
      const queryable = raw === '1' || raw === true;

      // Initialize the queryable
      layerConfig.initQueryableSource(queryable);

      // Set Min/Max Scale Limits (MaxScale should be set to the largest and MinScale should be set to the smallest)
      // Example: If MinScaleDenominator is 100,000 and maxScale is 50,000, then 100,000 should be used. This is because
      // the service will stop at 100,000 and if you zoom in more, you will get no data anyway.
      // GV Note: MinScaleDenominator is actually the maxScale and MaxScaleDenominator is actually the minScale
      if (layerCapabilities.MinScaleDenominator) {
        layerConfig.setMaxScale(Math.max(layerConfig.getMaxScale() ?? -Infinity, layerCapabilities.MinScaleDenominator));
      }
      if (layerCapabilities.MaxScaleDenominator) {
        layerConfig.setMinScale(Math.min(layerConfig.getMinScale() ?? Infinity, layerCapabilities.MaxScaleDenominator));
      }

      // If no bounds defined in the initial settings and an extent is defined in the layer capabilities metadata
      if (!layerConfig.getInitialSettingsBounds() && layerCapabilities.EX_GeographicBoundingBox?.extent) {
        // Validate and update the bounds initial settings
        layerConfig.initInitialSettingsBoundsFromMetadata(layerCapabilities.EX_GeographicBoundingBox.extent);
      }

      // If there's a dimension
      if (layerCapabilities.Dimension) {
        // TODO: Validate the layerCapabilities.Dimension for example if an interval is even possible

        // TODO: Validate the layerConfig.layerFilter is compatible with the layerCapabilities.Dimension and if not remove it completely like `delete layerConfig.layerFilter`

        const timeDimension = layerCapabilities.Dimension.find((dimension) => dimension.name === 'time');

        // If a temporal dimension was found
        if (timeDimension) {
          layerConfig.setTimeDimension(DateMgt.createDimensionFromOGC(timeDimension));
        }
      }

      // Try processing vectorial information on the WMS, if any
      const layerStyle = await WMS.#tryProcessLayerVectorialInformationIfAny(layerConfig);

      // Initialize the layer style by filling the blanks with the information from the metadata
      layerConfig.initLayerStyleFromMetadata(layerStyle);
    }

    // Return the layer config
    return layerConfig;
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

  // #endregion OVERRIDES

  // #region PUBLIC METHODS

  /**
   * Recursively gets the layer capability for a given layer id.
   * @param {string} layerId - The layer identifier to get the capabilities for.
   * @param {TypeMetadataWMSCapabilityLayer?} layer - The current layer entry from the capabilities that will be recursively searched.
   * @returns {TypeMetadataWMSCapabilityLayer?} The found layer from the capabilities or undefined if not found.
   */
  getLayerCapabilities(
    layerId: string,
    layer: TypeMetadataWMSCapabilityLayer | undefined = this.getMetadata()?.Capability.Layer
  ): TypeMetadataWMSCapabilityLayer | undefined {
    if (!layer) return undefined;

    // Direct match
    if (layer.Name === layerId) return layer;

    // Recurse into sublayers
    const subLayers = layer.Layer;
    if (!subLayers) return undefined;

    // For each sub layer
    for (const subLayer of subLayers) {
      const match = this.getLayerCapabilities(layerId, subLayer);
      if (match) return match;
    }

    return undefined;
  }

  /**
   * Creates an ImageWMS source from a layer config.
   * @param {OgcWmsLayerEntryConfig} layerConfig - The configuration for the WMS layer.
   * @returns A fully configured ImageWMS source.
   * @throws {LayerDataAccessPathMandatoryError} When the Data Access Path was undefined, likely because initDataAccessPath wasn't called.
   */
  createImageWMSSource(layerConfig: OgcWmsLayerEntryConfig): ImageWMS {
    // Get the layer capabilities
    const layerCapabilities = this.getLayerCapabilities(layerConfig.layerId);

    // Validate capabilities exist for the layer
    if (!layerCapabilities) {
      // Throw sub layer not found
      throw new LayerEntryConfigWMSSubLayerNotFoundError(layerConfig, this.getGeoviewLayerId());
    }

    // Create the source params
    const sourceParams: Record<string, unknown> = {
      LAYERS: layerConfig.layerId,
    };

    // Get the style to use
    const styleToUse = layerConfig.getStyleToUse();
    if (styleToUse) sourceParams.STYLES = styleToUse;

    const sourceOptions: SourceOptions = {
      url: layerConfig.getDataAccessPath(),
      params: sourceParams,
      attributions: layerConfig.getAttributions(),
      serverType: layerConfig.getServerType() ?? 'mapserver', // default: mapserver
      crossOrigin: layerConfig.getSource().crossOrigin ?? 'Anonymous',
    };

    // Optional projection override
    if (layerConfig.getSource().projection) {
      sourceOptions.projection = `EPSG:${layerConfig.getSource().projection}`;
    }

    // Create the source
    const olSource = new ImageWMS(sourceOptions);

    // Apply the filter on the source right away, before the first load
    GVWMS.applyViewFilterOnSource(
      layerConfig,
      olSource,
      layerConfig.getLayerStyle(),
      layerConfig.getExternalFragmentsOrder(),
      undefined,
      layerConfig.getLayerFilter()
    );

    // Return the source
    return olSource;
  }

  // #endregion PUBLIC METHODS

  // #region PRIVATE METHODS

  /**
   * Fetches WMS service metadata using a single GetCapabilities request,
   * and applies metadata inheritance if applicable.
   *
   * This method is used when no specific layer filtering is required — typically for standard WMS services.
   * It updates the metadata access path if a proxy is involved and ensures the metadata hierarchy is processed.
   *
   * @param {string} url - The full WMS GetCapabilities URL to fetch metadata from.
   * @returns {Promise<TypeMetadataWMS | undefined>} A promise resolving to the parsed metadata object,
   * or `undefined` if the fetch failed or metadata is invalid.
   * @throws {LayerServiceMetadataUnableToFetchError} When the metadata fetch fails or contains an error.
   * @throws {LayerNoCapabilitiesError} When the metadata is empty (no Capabilities).
   */
  async #fetchAndProcessSingleWmsMetadata(url: string): Promise<TypeMetadataWMS | undefined> {
    let metadata;
    try {
      // Fetch the WMS GetCapabilities document from the given URL
      metadata = await WMS.fetchMetadataWMS(url, (proxyUsed) => {
        // If a proxy was used, update the metadata access path accordingly
        this.setMetadataAccessPath(`${proxyUsed}${this.getMetadataAccessPath()}`);
      });
    } catch (error: unknown) {
      // Throw
      throw new LayerServiceMetadataUnableToFetchError(
        this.getGeoviewLayerId(),
        this.getLayerEntryNameOrGeoviewLayerName(),
        formatError(error)
      );
    }

    // Validate the metadata response
    if (!metadata.Capability) {
      // Throw
      throw new LayerNoCapabilitiesError(this.getGeoviewLayerId(), this.getLayerEntryNameOrGeoviewLayerName());
    }

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
   * @param {AbstractBaseLayerEntryConfig[]} layers - An array of layer configurations to fetch and merge metadata for.
   * @returns {Promise<TypeMetadataWMS | undefined>} A promise resolving to the merged metadata object,
   * or `undefined` if all requests failed.
   */
  async #fetchAndMergeMultipleWmsMetadata(url: string, layers: AbstractBaseLayerEntryConfig[]): Promise<TypeMetadataWMS | undefined> {
    // Create one metadata fetch promise per unique layerId
    const metadataPromises = this.#createLayerMetadataPromises(url, layers);

    // Wait for all requests to settle (either fulfilled or rejected)
    const results = await Promise.allSettled(metadataPromises);

    // If metadata fetching failed, flag the parent as error
    // GV: This is good to have when the metadata fails and we don't have the layer config objects fully loaded yet
    // GV: Disconnect from the VPN and try a service that requires VPN to test this.
    // TODO: Think of a better way to handle this? Improve the 'setLayerStatusError' internally to check for siblings and set the parent - instead of here?
    if (results.every((r) => r.status === 'rejected')) {
      // Set the parent in error
      layers[0].getParentLayerConfig()?.setLayerStatusError();
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
        const reason = result.reason as PromiseRejectErrorWrapper<AbstractBaseLayerEntryConfig>;
        this.addLayerLoadError(reason.error, reason.object);
      }
    }

    // Final pass to apply inheritance rules across the merged metadata tree
    this.#processMetadataInheritance(baseMetadata?.Capability.Layer);
    return baseMetadata;
  }

  /**
   * Creates a list of promises to fetch WMS metadata for a set of layer configurations.
   * This function ensures that each unique `layerId` results in only one network request,
   * even if multiple layer configs share the same ID. The resulting promises will either
   * resolve to a metadata result or reject with a wrapped error.
   * @param {string} url - The base GetCapabilities URL used to fetch layer-specific metadata.
   * @param {AbstractBaseLayerEntryConfig[]} layers - An array of layer configurations to fetch metadata for.
   * @returns {Promise<MetatadaFetchResult>[]} An array of metadata fetch promises, one per layer config.
   */
  #createLayerMetadataPromises(url: string, layers: AbstractBaseLayerEntryConfig[]): Promise<MetatadaFetchResult>[] {
    const seen = new Map<string, Promise<MetatadaFetchResult>>();

    return layers.map((layerConfig) => {
      // Avoid duplicate fetches for the same layerId
      if (!seen.has(layerConfig.layerId)) {
        const promise = new Promise<MetatadaFetchResult>((resolve, reject) => {
          // Perform the actual metadata fetch
          WMS.fetchMetadataWMSForLayer(url, layerConfig.layerId, (proxyUsed) => {
            // If a proxy was used, update the layer's data access path
            layerConfig.setDataAccessPath(`${proxyUsed}${this.getMetadataAccessPath()}`);
          })
            .then((metadata) => {
              if (metadata.Capability) {
                resolve({ metadata, layerConfig });
              } else {
                // No capabilities found in the response
                reject(
                  new PromiseRejectErrorWrapper(
                    new LayerNoCapabilitiesError(layerConfig.getGeoviewLayerId(), layerConfig.getLayerNameCascade()),
                    layerConfig
                  )
                );
              }
            })
            .catch((error) => {
              // Wrap any fetch error with additional layer context
              reject(
                new PromiseRejectErrorWrapper(
                  new LayerServiceMetadataUnableToFetchError(
                    layerConfig.getGeoviewLayerId(),
                    layerConfig.getLayerNameCascade(),
                    formatError(error)
                  ),
                  layerConfig
                )
              );
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
   * @param {AbortSignal | undefined} [abortSignal] - Abort signal to handle cancelling of fetch.
   * @returns {Promise<void>} A promise that the execution is completed.
   * @throws {LayerServiceMetadataUnableToFetchError} When the metadata fetch fails or contains an error.
   * @private
   */
  async #fetchXmlServiceMetadata(
    metadataUrl: string,
    callbackNewMetadataUrl?: (proxyUsed: string) => void,
    abortSignal?: AbortSignal
  ): Promise<TypeMetadataWMS> {
    let metadata;
    try {
      // Fetch it
      metadata = await WMS.fetchMetadataWMS(metadataUrl, callbackNewMetadataUrl, abortSignal);
    } catch (error: unknown) {
      // Throw
      throw new LayerServiceMetadataUnableToFetchError(
        this.getGeoviewLayerId(),
        this.getLayerEntryNameOrGeoviewLayerName(),
        formatError(error)
      );
    }

    // Validate the metadata response
    if (!metadata.Capability) {
      // Throw
      throw new LayerServiceMetadataUnableToFetchError(
        this.getGeoviewLayerId(),
        this.getLayerEntryNameOrGeoviewLayerName(),
        formatError('Invalid Capability response')
      );
    }

    // Process
    this.#processMetadataInheritance(metadata.Capability.Layer);

    // Set the metadata access path
    this.setMetadataAccessPath(metadata.Capability.Request.GetMap.DCPType[0].HTTP.Get.OnlineResource['@attributes']['xlink:href']);

    // Propagate the metadata access path to all data access path of the layers underneath
    this.listOfLayerEntryConfig.forEach((layerEntry) => {
      // Set the data access path, when a layer entry is a group, this goes recursive
      layerEntry.setDataAccessPath(this.getMetadataAccessPath());
    });

    // Return the metadata
    return metadata;
  }

  /**
   * This method find the layer path that lead to the layer identified by the layerName. Values stored in the array tell us which
   * direction to use to get to the layer. A value of -1 tells us that the Layer property is an object. Other values tell us that
   * the Layer property is an array and the value is the index to follow. If the layer can not be found, the returned value is
   * an empty array.
   *
   * @param {string} layerName The layer name to be found
   * @param {TypeMetadataWMSCapabilityLayer | TypeMetadataWMSCapabilityLayer[]} layerProperty The layer property from the metadata
   * @param {number[]} pathToTheParentLayer The path leading to the parent of the layerProperty parameter
   *
   * @returns {number[]} An array containing the path to the layer or [] if not found.
   * @private
   */
  #getMetadataLayerPath(
    layerName: string,
    layerProperty: TypeMetadataWMSCapabilityLayer | TypeMetadataWMSCapabilityLayer[],
    pathToTheParentLayer: number[] = []
  ): number[] {
    const newLayerPath = [...pathToTheParentLayer];
    if (Array.isArray(layerProperty)) {
      for (let i = 0; i < layerProperty.length; i++) {
        newLayerPath.push(i);
        if ('Name' in layerProperty[i] && layerProperty[i].Name === layerName) return newLayerPath;
        if ('Layer' in layerProperty[i]) {
          return this.#getMetadataLayerPath(layerName, layerProperty[i].Layer!, newLayerPath);
        }
      }
    } else {
      newLayerPath.push(-1);
      if ('Name' in layerProperty && layerProperty.Name === layerName) return newLayerPath;
      if ('Layer' in layerProperty) {
        return this.#getMetadataLayerPath(layerName, layerProperty.Layer!, newLayerPath);
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
   * @param {number[]} path - The layer name to be found
   * @param {TypeMetadataWMSCapabilityLayer | TypeMetadataWMSCapabilityLayer[] | undefined} target - The metadata layer that will receive the new layer
   * @param {TypeMetadataWMSCapabilityLayer | TypeMetadataWMSCapabilityLayer[]} source - The layer property to add
   * @private
   */
  #addLayerToMetadataInstance(
    path: number[],
    target: TypeMetadataWMSCapabilityLayer | TypeMetadataWMSCapabilityLayer[] | undefined,
    source: TypeMetadataWMSCapabilityLayer | TypeMetadataWMSCapabilityLayer[]
  ): void {
    if (!target || path.length === 0) return;

    const [currentIndex, ...nextPath] = path;

    if (currentIndex === -1) {
      // Treat both target and source as single layer objects
      const targetLayer = target as TypeMetadataWMSCapabilityLayer;
      const sourceLayer = source as TypeMetadataWMSCapabilityLayer;
      this.#addLayerToMetadataInstance(nextPath, targetLayer.Layer, sourceLayer.Layer!);
    } else {
      // Treat both target and source as arrays of layers
      const targetArray = target as TypeMetadataWMSCapabilityLayer[];
      const sourceArray = source as TypeMetadataWMSCapabilityLayer[];

      const sourceEntry = sourceArray[currentIndex];
      const existingEntry = targetArray.find((layer) => layer.Name === sourceEntry.Name);

      if (existingEntry) {
        this.#addLayerToMetadataInstance(nextPath, existingEntry.Layer, sourceEntry.Layer!);
      } else {
        targetArray.push(sourceEntry);
      }
    }
  }

  /**
   * Reads the layer identifiers from the configuration to create an array that will be used in the GetCapabilities.
   * @returns {AbstractBaseLayerEntryConfig[]} The array of layer configurations.
   * @private
   */
  #getLayersToQuery(): AbstractBaseLayerEntryConfig[] {
    const arrayOfLayerIds: AbstractBaseLayerEntryConfig[] = [];
    const gatherLayerIds = (listOfLayerEntryConfig = this.listOfLayerEntryConfig): void => {
      if (listOfLayerEntryConfig.length) {
        listOfLayerEntryConfig.forEach((layerConfig) => {
          if (ConfigBaseClass.getClassOrTypeEntryTypeIsGroup(layerConfig)) gatherLayerIds(layerConfig.listOfLayerEntryConfig);
          else arrayOfLayerIds.push(layerConfig);
        });
      }
    };
    gatherLayerIds();
    return arrayOfLayerIds;
  }

  /**
   * Propagates the WMS metadata inherited values.
   * @param {TypeMetadataWMSCapabilityLayer | undefined} layer - The layer property from the metadata that will inherit the values
   * @param {TypeMetadataWMSCapabilityLayer | undefined} parentLayer - The parent layer that contains the inherited values
   * @private
   */
  #processMetadataInheritance(layer: TypeMetadataWMSCapabilityLayer | undefined, parentLayer?: TypeMetadataWMSCapabilityLayer): void {
    if (layer && parentLayer) {
      // Table 7 — Inheritance of Layer properties specified in the standard with 'replace' behaviour.
      // eslint-disable-next-line no-param-reassign
      if (!layer['@attributes']) layer['@attributes'] = {};
      // eslint-disable-next-line no-param-reassign
      layer['@attributes'].queryable ??= parentLayer['@attributes']?.queryable;
      // eslint-disable-next-line no-param-reassign
      layer['@attributes'].cascaded ??= parentLayer['@attributes']?.cascaded;
      // eslint-disable-next-line no-param-reassign
      layer['@attributes'].opaque ??= parentLayer['@attributes']?.opaque;
      // eslint-disable-next-line no-param-reassign
      layer['@attributes'].noSubsets ??= parentLayer['@attributes']?.noSubsets;
      // eslint-disable-next-line no-param-reassign
      layer['@attributes'].fixedWidth ??= parentLayer['@attributes']?.fixedWidth;
      // eslint-disable-next-line no-param-reassign
      layer['@attributes'].fixedHeight ??= parentLayer['@attributes']?.fixedHeight;

      // eslint-disable-next-line no-param-reassign
      layer.MinScaleDenominator ??= parentLayer.MinScaleDenominator;
      // eslint-disable-next-line no-param-reassign
      layer.MaxScaleDenominator ??= parentLayer.MaxScaleDenominator;
      // eslint-disable-next-line no-param-reassign
      layer.BoundingBox ??= parentLayer.BoundingBox;
      // eslint-disable-next-line no-param-reassign, camelcase
      layer.EX_GeographicBoundingBox ??= parentLayer.EX_GeographicBoundingBox;
      // eslint-disable-next-line no-param-reassign
      layer.Dimension ??= parentLayer.Dimension;
      // eslint-disable-next-line no-param-reassign
      layer.Attribution ??= parentLayer.Attribution;

      // Table 7 — Inheritance of Layer properties specified in the standard with 'add' behaviour.
      // AuthorityURL inheritance is not implemented in the following code.
      if (parentLayer.Style) {
        // eslint-disable-next-line no-param-reassign
        if (!layer.Style) layer.Style = [];
        parentLayer.Style.forEach((parentStyle) => {
          const styleFound = layer.Style?.find((styleEntry) => styleEntry.Name === parentStyle.Name);
          if (!styleFound) layer.Style?.push(parentStyle);
        });
      }

      if (parentLayer.CRS) {
        // eslint-disable-next-line no-param-reassign
        if (!layer.CRS) layer.CRS = [];

        const layerCRSSet = new Set<string>(layer.CRS);
        for (const parentCRS of parentLayer.CRS) {
          if (!layerCRSSet.has(parentCRS)) {
            layer.CRS.push(parentCRS);
          }
        }
      }
    }
    if (layer?.Layer !== undefined) layer.Layer.forEach((subLayer) => this.#processMetadataInheritance(subLayer, layer));
  }

  // #endregion PRIVATE METHODS

  // #region STATIC METHODS

  /**
   * Fetches the metadata for WMS Capabilities.
   * @param {string} url - The url to query the metadata from.
   * @param {CallbackNewMetadataDelegate} callbackNewMetadataUrl - Callback executed when a proxy had to be used to fetch the metadata.
   * The parameter sent in the callback is the proxy prefix with the '?' at the end.
   * @param {AbortSignal | undefined} [abortSignal] - Abort signal to handle cancelling of fetch.
   * @throws {RequestTimeoutError} When the request exceeds the timeout duration.
   * @throws {RequestAbortedError} When the request was aborted by the caller's signal.
   * @throws {ResponseError} When the response is not OK (non-2xx).
   * @throws {ResponseEmptyError} When the JSON response is empty.
   * @throws {NetworkError} When a network issue happened.
   * @static
   */
  static fetchMetadataWMS(
    url: string,
    callbackNewMetadataUrl?: CallbackNewMetadataDelegate,
    abortSignal?: AbortSignal
  ): Promise<TypeMetadataWMS> {
    // Redirect
    return GeoUtilities.getWMSServiceMetadata(url, undefined, callbackNewMetadataUrl, abortSignal);
  }

  /**
   * Fetches the metadata for WMS Capabilities for particular layer(s).
   * @param {string} url - The url to query the metadata from.
   * @param {string} layers - The layers to get the capabilities for.
   * @param {CallbackNewMetadataDelegate} callbackNewMetadataUrl - Callback executed when a proxy had to be used to fetch the metadata.
   * The parameter sent in the callback is the proxy prefix with the '?' at the end.
   * @throws {RequestTimeoutError} When the request exceeds the timeout duration.
   * @throws {RequestAbortedError} When the request was aborted by the caller's signal.
   * @throws {ResponseError} When the response is not OK (non-2xx).
   * @throws {ResponseEmptyError} When the JSON response is empty.
   * @throws {NetworkError} When a network issue happened.
   * @static
   */
  static fetchMetadataWMSForLayer(
    url: string,
    layers: string,
    callbackNewMetadataUrl?: CallbackNewMetadataDelegate
  ): Promise<TypeMetadataWMS> {
    // Redirect
    return GeoUtilities.getWMSServiceMetadata(url, layers, callbackNewMetadataUrl);
  }

  /**
   * Fetches the WMS styles for the specified layer(s) from a WMS service.
   * @param {string} url - The url to query the metadata from.
   * @param {string} layers - The layers to get the capabilities for.
   * @returns {Promise<TypeStylesWMS>} A promise that resolves with a TypeStylesWMS object for the layer(s).
   * @throws {RequestTimeoutError} When the request exceeds the timeout duration.
   * @throws {RequestAbortedError} When the request was aborted by the caller's signal.
   * @throws {ResponseError} When the response is not OK (non-2xx).
   * @throws {ResponseEmptyError} When the JSON response is empty.
   * @throws {NetworkError} When a network issue happened.
   * @static
   */
  static fetchStylesForLayer(url: string, layers: string): Promise<TypeStylesWMS> {
    // Redirect
    return GeoUtilities.getWMSServiceStyles(url, layers);
  }

  /**
   * Fetches and constructs style configurations for WMS layers.
   * This method retrieves style definitions from a WMS (Web Map Service) endpoint
   * for the specified layers, processes them, and returns a mapping of geometry
   * types to their corresponding layer style settings.
   * @param {string} url - The base WMS service URL used to fetch styles.
   * @param {string} layers - A comma-separated list of WMS layer names to retrieve styles for.
   * @returns {Promise<Record<TypeStyleGeometry, TypeLayerStyleSettings>>}
   * A promise that resolves to a record mapping geometry types to layer style settings.
   * @throws {NotSupportedError} If the symbolizer type in a rule is unsupported.
   * @static
   * @async
   */
  static async createStylesFromWMS(
    url: string,
    layers: string,
    geomType: TypeStyleGeometry | undefined
  ): Promise<Record<TypeStyleGeometry, TypeLayerStyleSettings>> {
    // Fetch styles using the WMS url associated with the WFS
    const styles = await WMS.fetchStylesForLayer(url, layers);

    // Log it, leaving the logDebug for dev purposes
    // logger.logDebug('STYLES', styles);

    // Build layer style information from the WMS styles
    const layerStyle = WfsRenderer.buildLayerStyleInfo(styles, geomType);

    // Log it, leaving the logDebug for dev purposes
    // logger.logDebug('STYLES OBJ', layerStyle);

    // Return it
    return layerStyle;
  }

  /**
   * Initializes a GeoView layer configuration for a WMS layer.
   * This method creates a basic TypeGeoviewLayerConfig using the provided
   * ID, name, and metadata access path URL. It then initializes the layer entries by calling
   * `initGeoViewLayerEntries`, which may involve fetching metadata or sublayer info.
   * @param {string} geoviewLayerId - A unique identifier for the layer.
   * @param {string} geoviewLayerName - The display name of the layer.
   * @param {string} metadataAccessPath - The full service URL to the layer endpoint.
   * @param {boolean} fullSubLayers - Indicates if we want the full sublayers of all wms or grouped (default is grouped).
   * @param {boolean?} [isTimeAware] - Indicates whether the layer supports time-based filtering.
   * @returns {Promise<TypeGeoviewLayerConfig>} A promise that resolves to an initialized GeoView layer configuration with layer entries.
   * @static
   */
  static initGeoviewLayerConfig(
    geoviewLayerId: string,
    geoviewLayerName: string,
    metadataAccessPath: string,
    fullSubLayers: boolean,
    isTimeAware?: boolean
  ): Promise<TypeGeoviewLayerConfig> {
    // Create the Layer config
    const myLayer = new WMS({ geoviewLayerId, geoviewLayerName, metadataAccessPath, isTimeAware } as TypeWMSLayerConfig, fullSubLayers);
    return myLayer.initGeoViewLayerEntries();
  }

  /**
   * Creates a complete configuration object for a WMS GeoView layer.
   * This function constructs a `TypeWMSLayerConfig` object that defines a WMS layer and its associated
   * entries. It supports both individual layers and nested group layers through recursive processing.
   * @param {string} geoviewLayerId - A unique identifier for the GeoView layer.
   * @param {string} geoviewLayerName - The human-readable name of the GeoView layer.
   * @param {string} metadataAccessPath - The URL or path used to access the layer's metadata.
   * @param {TypeOfServer | undefined} serverType - The type of WMS server (e.g., 'geoserver', 'mapserver').
   * @param {boolean | undefined} isTimeAware - Indicates whether the layer supports time-based filtering.
   * @param {TypeLayerEntryShell[]} layerEntries - The root array of parsed layer entries (may include nested groups).
   * @param {boolean} fullSubLayers - If false, will simulate legacy behavior and skip deeper layers after the first.
   * @param {unknown} [customGeocoreLayerConfig={}] - Optional custom layer configuration to merge into leaf layers.
   * @returns {TypeWMSLayerConfig} The fully constructed WMS layer configuration object.
   * @static
   */
  static createGeoviewLayerConfig(
    geoviewLayerId: string,
    geoviewLayerName: string,
    metadataAccessPath: string,
    serverType: TypeOfServer | undefined,
    isTimeAware: boolean | undefined,
    layerEntries: TypeLayerEntryShell[],
    fullSubLayers: boolean,
    customGeocoreLayerConfig: unknown = {}
  ): TypeWMSLayerConfig {
    const geoviewLayerConfig: TypeWMSLayerConfig = {
      geoviewLayerId,
      geoviewLayerName,
      metadataAccessPath,
      geoviewLayerType: CONST_LAYER_TYPES.WMS,
      isTimeAware,
      listOfLayerEntryConfig: [],
    };

    // Recursively map layer entries
    geoviewLayerConfig.listOfLayerEntryConfig = layerEntries.map((layerEntry) =>
      WMS.#createLayerEntryConfig(layerEntry, geoviewLayerConfig, serverType, fullSubLayers, customGeocoreLayerConfig)
    ) as OgcWmsLayerEntryConfig[]; // Untrue 'as' operation, but we'll fix later

    // Return it
    return geoviewLayerConfig;
  }

  /**
   * Creates a WMS layer entry configuration object, handling both group and leaf layers.
   *
   * - If the given `layerEntry` contains sublayers (`listOfLayerEntryConfig`), a `GroupLayerEntryConfig` is created,
   *   and the sublayers are recursively processed and attached using `#createGroupLayerRec`.
   * - If it is a leaf (no children), a standard `OgcWmsLayerEntryConfig` is created, optionally merged with a custom Geocore config.
   *
   * This function acts as an entry point to recursively transform a WMS layer tree into fully configured layer entry objects.
   * @param {TypeLayerEntryShell} layerEntry - The WMS layer entry shell to convert (may be a group or leaf).
   * @param {TypeWMSLayerConfig} geoviewLayerConfig - The parent GeoView layer config that this entry belongs to.
   * @param {TypeOfServer | undefined} serverType - The type of WMS server (e.g., 'geoserver', 'mapserver', etc.).
   * @param {boolean} fullSubLayers - Whether to fully process sublayers (used in recursive group creation).
   * @param {unknown} customGeocoreLayerConfig - Optional custom layer configuration to merge into leaf layers.
   * @returns {OgcWmsLayerEntryConfig | GroupLayerEntryConfig} The fully constructed layer entry configuration object.
   * @private
   * @static
   */
  static #createLayerEntryConfig(
    layerEntry: TypeLayerEntryShell,
    geoviewLayerConfig: TypeWMSLayerConfig,
    serverType: TypeOfServer | undefined,
    fullSubLayers: boolean,
    customGeocoreLayerConfig: unknown
  ): OgcWmsLayerEntryConfig | GroupLayerEntryConfig {
    // Check if it's a group layer (has children)
    const isGroup = Array.isArray(layerEntry.listOfLayerEntryConfig) && layerEntry.listOfLayerEntryConfig.length > 0;

    if (isGroup) {
      // Create the group layer config object
      const groupLayer = new GroupLayerEntryConfig({
        layerId: layerEntry.id,
        layerName: layerEntry.layerName,
        geoviewLayerConfig,
        listOfLayerEntryConfig: [], // will be populated below
      } as GroupLayerEntryConfigProps);

      // Recursively build the group's tree
      WMS.#createGroupLayerRec(layerEntry.listOfLayerEntryConfig!, groupLayer, fullSubLayers);

      // Return the group layer
      return groupLayer;
    }

    // Leaf layer
    const layerEntryConfig: OgcWmsLayerEntryConfigProps = {
      geoviewLayerConfig,
      layerId: `${layerEntry.id}`,
      layerName: layerEntry.layerName || `${layerEntry.id}`,
      source: {
        serverType,
      },
    };

    // Merge with custom config if provided
    const mergedConfig = deepMergeObjects<OgcWmsLayerEntryConfigProps>(layerEntryConfig, customGeocoreLayerConfig);

    // Construct and return layer entry
    return new OgcWmsLayerEntryConfig(mergedConfig);
  }

  /**
   * Processes a WMS GeoviewLayerConfig and returns a promise
   * that resolves to an array of `ConfigBaseClass` layer entry configurations.
   *
   * This method:
   * 1. Creates a Geoview layer configuration using the provided parameters.
   * 2. Instantiates a layer with that configuration.
   * 3. Processes the layer configuration and returns the result.
   * @param {string} geoviewLayerId - The unique identifier for the GeoView layer.
   * @param {string} geoviewLayerName - The display name for the GeoView layer.
   * @param {string} url - The URL of the service endpoint.
   * @param {string[]} layerIds - An array of layer IDs to include in the configuration.
   * @param {boolean} isTimeAware - Indicates if the layer is time aware.
   * @returns {Promise<ConfigBaseClass[]>} A promise that resolves to an array of layer configurations.
   * @static
   */
  static processGeoviewLayerConfig(
    geoviewLayerId: string,
    geoviewLayerName: string,
    url: string,
    layerIds: number[],
    isTimeAware: boolean,
    fullSubLayers: boolean
  ): Promise<ConfigBaseClass[]> {
    // Create the Layer config
    const layerConfig = WMS.createGeoviewLayerConfig(
      geoviewLayerId,
      geoviewLayerName,
      url,
      undefined,
      isTimeAware,
      layerIds.map((layerId) => {
        return { id: layerId };
      }),
      fullSubLayers
    );

    // Create the class from geoview-layers package
    const myLayer = new WMS(layerConfig, false);

    // Process it
    return AbstractGeoViewLayer.processConfig(myLayer);
  }

  /**
   * Determines whether the provided metadata URL points to a raw XML document.
   * This is used to detect non-standard metadata endpoints that don't follow
   * the WMS GetCapabilities convention.
   * @param {string} path - The metadata URL to check.
   * @returns {boolean} `true` if the URL ends with `.xml`, otherwise `false`.
   * @private
   * @static
   */
  static #isXmlMetadata(path: string): boolean {
    // Normalize case and check for '.xml' suffix
    return path.toLowerCase().endsWith('.xml');
  }

  /**
   * Recursively builds a tree of layer entry configs from a hierarchical list of WMS layer entries,
   * and attaches them to a parent `GroupLayerEntryConfig`.
   *
   * This function inspects each `TypeLayerEntryShell`:
   * - If it contains nested entries (`listOfLayerEntryConfig`), it is treated as a group layer and processed recursively.
   * - If it is a leaf layer, a new `OgcWmsLayerEntryConfig` is created and added to the group's config list.
   *
   * Also handles an internal behavior toggle via `fullSubLayers`. If `false`, the loop is purposely interrupted
   * after the first leaf to simulate a legacy error behavior.
   * @param {TypeLayerEntryShell[]} layer - The list of WMS layer entry shells to process (can include nested groups).
   * @param {GroupLayerEntryConfig} layerConfig - The parent group layer config object to which the generated sublayers will be attached.
   * @param {boolean} fullSubLayers - Whether to process all sublayers or simulate legacy early-exit behavior after the first leaf.
   * @param {GroupLayerCreatedDelegate?} [callbackGroupLayerCreated] - Optional callback invoked when a leaf layer is created.
   * @private
   * @static
   */
  static #createGroupLayerRec(
    layer: TypeLayerEntryShell[],
    layerConfig: GroupLayerEntryConfig,
    fullSubLayers: boolean,
    callbackGroupLayerCreated?: GroupLayerCreatedDelegate
  ): void {
    // GV Special WMS group layer case situation...
    // TODO: WMS fullSubLayers - There was an issue with the layer configuration for a long time ('Private element not on object') which
    // TO.DOCONT: was causing the loop below to fail before finishing the first loop (midway deep into 'registerLayerConfigInit()').
    // TO.DOCONT: The fact that an exception was raised was actually provoking the behavior that we want with the UI display of
    // TO.DOCONT: the WMS group layers (between Layers and Details tabs).
    // TO.DOCONT: However, fixing the cloning issue and completing the loops as they should be, was causing an unwanted side-effect
    // TO.DOCONT: with the UI.
    // TO.DOCONT: Therefore, we're making it crash on purpose by raising a 'Processing cancelled' exception for now to keep
    // TO.DOCONT: the behavior the same as before..

    // Loop on the sub layers
    const newListOfLayerEntryConfig: ConfigBaseClass[] = [];
    layer.forEach((subLayer) => {
      // Check if subLayer is a group (has children)
      const isGroup = Array.isArray(subLayer.listOfLayerEntryConfig) && subLayer.listOfLayerEntryConfig.length > 0;

      // If is a group
      if (isGroup) {
        // Create the Group layer in preparation for recursion
        const groupLayer = new GroupLayerEntryConfig({
          ...layerConfig.cloneLayerProps(),
          layerId: `${subLayer.layerId}`,
          layerName: subLayer.layerName,
          parentLayerConfig: layerConfig,
          listOfLayerEntryConfig: [],
        });

        // Recursive call
        WMS.#createGroupLayerRec(subLayer.listOfLayerEntryConfig!, groupLayer, fullSubLayers, callbackGroupLayerCreated);

        // Cumulate
        newListOfLayerEntryConfig.push(groupLayer);
      } else {
        // Handle leaf layer
        const subLayerEntryConfig = new OgcWmsLayerEntryConfig({
          ...layerConfig.cloneLayerProps(),
          layerId: `${subLayer.layerId}`,
          layerName: subLayer.layerName!,
          parentLayerConfig: layerConfig,
        });

        // Cumulate
        newListOfLayerEntryConfig.push(subLayerEntryConfig);

        // Simulate the legacy bug behavior
        if (!fullSubLayers) {
          throw new CancelledError();
        }

        // Callback if needed
        callbackGroupLayerCreated?.(subLayerEntryConfig);
      }
    });

    // TODO: WMS fullSubLayers - Continuation of the TODO Bug above.. Purposely don't do this anymore (the throw will cause skipping of this)
    // TO.DOCONT: in order to reproduce the old behavior now that the 'Private element' bug is fixed..
    // TO.DOCONT: Leaving the code there, uncommented, so that if/when we remove the throw of the
    // TO.DOCONT: 'Processing cancelled' this gets executed as would be expected
    layerConfig.setEntryType(CONST_LAYER_ENTRY_TYPES.GROUP);
    layerConfig.setIsMetadataLayerGroup(true);
    // eslint-disable-next-line no-param-reassign
    layerConfig.listOfLayerEntryConfig = newListOfLayerEntryConfig as TypeLayerEntryConfig[];
  }

  /**
   * Recursively builds a layer entry tree from WMS metadata layers.
   * This function takes an array of WMS capability `Layer` objects and returns a corresponding tree of
   * `TypeLayerEntryShell` objects, preserving the nesting structure of sublayers.
   * @param {TypeMetadataWMSCapabilityLayer[]} layers - The list of WMS capability layers to convert.
   * @returns {TypeLayerEntryShell[]} A tree of layer entries representing the structure of the WMS layers.
   * @private
   * @static
   */
  static #buildLayerTree(layers: TypeMetadataWMSCapabilityLayer[]): TypeLayerEntryShell[] {
    return layers
      .filter((layer) => layer.Name && layer.Title)
      .map((layer) => {
        const entry: TypeLayerEntryShell = {
          id: layer.Name!,
          layerId: layer.Name!,
          layerName: layer.Title,
        };

        if (Array.isArray(layer.Layer) && layer.Layer.length > 0) {
          entry.listOfLayerEntryConfig = WMS.#buildLayerTree(layer.Layer);
        }

        return entry;
      });
  }

  /**
   * Processes and enriches vectorial (WFS-based) information for a WMS layer if available.
   * This method:
   *  - Derives a corresponding WFS layer configuration from the provided WMS layer.
   *  - Attaches the WFS config back to the original layer for later reference.
   *  - Validates and forwards WFS `featureInfo` (including `outfields`) into the WMS config.
   *  - Attempts to generate a dynamic style for the WMS layer using WMS `GetStyles`,
   *    optionally inferring geometry type from WFS field metadata.
   *  - Logs warnings if vectorial data or styles cannot be determined.
   * @param {OgcWmsLayerEntryConfig} layerConfig
   *   The WMS layer configuration being processed.
   * @returns {Promise<void>} Resolves when processing is complete.
   * @throws {LayerDataAccessPathMandatoryError} When the Data Access Path was undefined, likely because initDataAccessPath wasn't called.
   * @throws {LayerEntryConfigFieldsNotFoundError} When WFS `outfields` cannot be read from the derived config.
   * @description
   * This helper method enables a WMS layer to benefit from vector-like capabilities by:
   *  - reading attribute structure from a WFS equivalent,
   *  - reusing the WFS `featureInfo` definition,
   *  - generating styles from WMS metadata when available.
   * Failures during processing do not stop execution; they are logged as warnings.
   * @private
   * @static
   * @async
   */
  static async #tryProcessLayerVectorialInformationIfAny(
    layerConfig: OgcWmsLayerEntryConfig
  ): Promise<Record<TypeStyleGeometry, TypeLayerStyleSettings> | undefined> {
    // If should fetch vectorial information from WFS
    if (layerConfig.getShouldFetchVectorInformationFromWFS()) {
      try {
        // Get the base url
        const baseUrl = GeoUtilities.getBaseUrl(layerConfig.getDataAccessPath());

        // Create the Geoview Layer Config WFS equivalent
        const wfsLayerConfig = await layerConfig.createGeoviewLayerConfigWfs();

        // Keep it as reference
        layerConfig.setWfsLayerConfig(wfsLayerConfig);

        // Validate the outfields could be read
        const outFields = wfsLayerConfig.getOutfields();
        if (!outFields) throw new LayerEntryConfigFieldsNotFoundError(layerConfig.getGeoviewLayerId(), layerConfig.getLayerNameCascade());

        // Override the outfields of the WMS to leverage possibilities working with a WMS layer, like knowing the field types when performing WMS queries
        layerConfig.setOutfields(outFields);

        // If no layer style defined
        if (!layerConfig.getLayerStyle()) {
          // If the service metadata offers GetStyles
          if (layerConfig.getSupportsGetStyles()) {
            // Try to create dynamic style from the WMS GetStyles metadata
            return await WMS.createStylesFromWMS(baseUrl, layerConfig.layerId, wfsLayerConfig.getGeometryType());
          }

          // Log
          logger.logWarning(`WMS service ${layerConfig.layerPath} doesn't support vectorial styles via a 'GetStyles' request.`);
        }
      } catch (error: unknown) {
        // Log
        logger.logWarning(`Failed to find a vectorial representation of the WMS ${layerConfig.layerPath}`, error);
      }
    }

    // None
    return undefined;
  }

  // #endregion STATIC METHODS
}

/** Delegate type for the callback when processing group layers */
export type GroupLayerCreatedDelegate = (config: ConfigBaseClass) => void;

/** Local type to work with a metadata fetch result */
type MetatadaFetchResult = { layerConfig: AbstractBaseLayerEntryConfig; metadata: TypeMetadataWMS };
