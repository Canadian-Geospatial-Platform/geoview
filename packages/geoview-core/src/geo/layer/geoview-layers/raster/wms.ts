import type { Options as SourceOptions } from 'ol/source/ImageWMS';
import type { Projection as OLProjection } from 'ol/proj';
import { ImageWMS } from 'ol/source';

import { AbstractGeoViewRaster } from '@/geo/layer/geoview-layers/raster/abstract-geoview-raster';
import type {
  TypeLayerEntryConfig,
  TypeGeoviewLayerConfig,
  TypeOfServer,
  TypeMetadataWMS,
  TypeMetadataWMSCapabilityLayer,
  TypeStylesWMS,
} from '@/api/types/layer-schema-types';
import type { DisplayDateMode, TypeLayerStyleSettings, TypeStyleGeometry } from '@/api/types/map-schema-types';
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
import { formatError, PromiseRejectErrorWrapper } from '@/core/exceptions/core-exceptions';
import {
  LayerEntryConfigFieldsNotFoundError,
  LayerNoCapabilitiesError,
  LayerServiceMetadataUnableToFetchError,
} from '@/core/exceptions/layer-exceptions';
import {
  LayerEntryConfigLayerIdNotFoundError,
  LayerEntryConfigWMSSubLayerNotFoundError,
} from '@/core/exceptions/layer-entry-config-exceptions';
import { deepMergeObjects, generateId, normalizeDatacubeAccessPath } from '@/core/utils/utilities';
import { AbstractGeoViewLayer } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { GVWMS } from '@/geo/layer/gv-layers/raster/gv-wms';
import type { AbstractBaseLayerEntryConfig } from '@/api/config/validation-classes/abstract-base-layer-entry-config';
import { WfsRenderer } from '@/geo/utils/renderer/wfs-renderer';
import { logger } from '@/core/utils/logger';

export interface TypeWMSLayerConfig extends Omit<TypeGeoviewLayerConfig, 'listOfLayerEntryConfig'> {
  geoviewLayerType: typeof CONST_LAYER_TYPES.WMS;
  fetchVectorsOnWFS?: boolean;
  useFullWmsSublayers?: boolean;
  listOfLayerEntryConfig: OgcWmsLayerEntryConfig[];
}

/**
 * A class to add wms layer.
 */
export class WMS extends AbstractGeoViewRaster {
  /** Default setting for the WMS layer group processing (true will explode the group in many wms layers) */
  static readonly DEFAULT_WMS_LAYER_GROUP_FULL_SUB_LAYERS = true;

  /**
   * Constructs a WMS Layer configuration processor.
   *
   * @param layerConfig - The layer configuration
   */
  // The constructor is not useless, it narrows down the accepted parameter type.
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(layerConfig: TypeWMSLayerConfig) {
    super(layerConfig);
  }

  // #region OVERRIDES

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   *
   * @returns The strongly-typed layer configuration specific to this layer.
   */
  override getGeoviewLayerConfig(): TypeWMSLayerConfig {
    return super.getGeoviewLayerConfig() as TypeWMSLayerConfig;
  }

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   *
   * @returns The strongly-typed metadata specific to this layer.
   */
  override getMetadata(): TypeMetadataWMS | undefined {
    return super.getMetadata() as TypeMetadataWMS | undefined;
  }

  /**
   * Fetches and processes service metadata for the WMS layer.
   *
   * Depending on whether the metadata URL points to an XML document or a standard WMS endpoint,
   * this method delegates to the appropriate metadata fetching logic.
   * - If the URL ends in `.xml`, a direct XML metadata fetch is performed.
   * - Otherwise, the method constructs a WMS GetCapabilities request.
   *   - If no specific layer configs are provided, a single metadata fetch is made.
   *   - If layer configs are present (e.g., Geomet use case), individual layer metadata is merged.
   *
   * @param abortSignal - Optional {@link AbortSignal} used to cancel the layer creation process.
   * @returns A promise that resolves to the parsed metadata object,
   * or `undefined` if metadata could not be retrieved or no capabilities were found.
   * @throws {LayerServiceMetadataUnableToFetchError} When the metadata fetch fails or contains an error.
   */
  protected override onFetchServiceMetadata<T = TypeMetadataWMS | undefined>(abortSignal?: AbortSignal): Promise<T> {
    // If metadata is in XML format (not WMS GetCapabilities)
    const isXml = this.getMetadataAccessPath().toLowerCase().endsWith('.xml');
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
   *
   * @param abortSignal - Optional {@link AbortSignal} used to cancel the layer creation process.
   * @returns A promise that resolves once the layer entries have been initialized.
   * @throws {LayerServiceMetadataUnableToFetchError} When the metadata fetch fails or contains an error.
   */
  protected override async onInitLayerEntries(abortSignal?: AbortSignal): Promise<TypeGeoviewLayerConfig> {
    // Get the metadata
    const metadata = await this.onFetchServiceMetadata(abortSignal);

    // Based on the capabilities
    const layers = metadata!.Capability.Layer.Layer;

    // Build the layer tree
    const entries = layers?.length ? WMS.#buildLayerTree(layers) : [];

    // Create the root entry
    const entry: TypeLayerEntryShell[] = [
      {
        id: metadata!.Capability.Layer.Name || generateId(18),
        layerName: metadata!.Capability.Layer.Title || metadata!.Capability.Layer.Name!,
        listOfLayerEntryConfig: entries,
      },
    ];

    // Redirect
    return WMS.createGeoviewLayerConfig(
      this.getGeoviewLayerId(),
      metadata?.Capability.Layer.Title || this.getGeoviewLayerName(),
      this.getMetadataAccessPath(),
      undefined,
      this.getGeoviewLayerConfig().isTimeAware,
      entry,
      this.getGeoviewLayerConfig().useFullWmsSublayers
    );
  }

  /**
   * Overrides the validation of a layer entry config.
   *
   * @param layerConfig - The layer entry config to validate.
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
      WMS.#createGroupLayerRec(layerConfigMapped, layerConfigGroup, (config: ConfigBaseClass) => {
        // Alert that we want to register an extra layer entry
        this.emitLayerEntryRegisterInit({ config });
      });

      // Validate the list
      this.validateListOfLayerEntryConfig(layerConfigGroup.listOfLayerEntryConfig);
      return;
    }

    // Initialize the layer name by filling the blanks with the name from the metadata
    layerConfig.initLayerNameFromMetadata(layerFound.Title);
  }

  /**
   * Overrides the way the layer metadata is processed.
   *
   * @param layerConfig - The layer entry configuration to process.
   * @param displayDateMode - The display date mode to use for processing time dimensions in the metadata.
   * @param mapProjection - Optional map projection.
   * @param abortSignal - Optional {@link AbortSignal} used to cancel the layer creation process.
   * @returns A promise that resolves once the layer entry configuration has gotten its metadata processed.
   * @throws {InvalidTimeDimensionError} When range couldn't be computed, or when duration is invalid, or non-positive or when an infinite loop is detected.
   * @throws {InvalidDateError} When input has invalid dates.
   */
  protected override async onProcessLayerMetadata(
    layerConfig: OgcWmsLayerEntryConfig,
    displayDateMode: DisplayDateMode,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    mapProjection?: OLProjection,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    abortSignal?: AbortSignal
  ): Promise<OgcWmsLayerEntryConfig> {
    // Get the layer capabilities
    const layerCapabilities = this.getLayerCapabilities(layerConfig.layerId)!;

    // Set the layer metadata (capabilities)
    layerConfig.setLayerMetadata(layerCapabilities);

    // If found
    if (layerCapabilities) {
      // Check if metadata says it's queryable
      const raw = layerCapabilities['@attributes']?.queryable;
      const queryable = raw === '1' || raw === true;

      // Initialize the queryable
      layerConfig.initQueryableSource(queryable);

      // Set Min/Max Scale Limits (MaxScale should be set to the largest and MinScale should be set to the smallest)
      // Example: If MinScaleDenominator is 100,000 and maxScale is 50,000, then 100,000 should be used. This is because
      // the service will stop at 100,000 and if you zoom in more, you will get no data anyway.
      // GV MinScaleDenominator is actually the maxScale and MaxScaleDenominator is actually the minScale
      layerConfig.initMinScaleFromMetadata(layerCapabilities.MaxScaleDenominator);
      layerConfig.initMaxScaleFromMetadata(layerCapabilities.MinScaleDenominator);

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
          try {
            // Try to create the time dimension value
            const layerTimeDimension = DateMgt.createDimensionFromOGC(timeDimension, displayDateMode);

            // Set the time dimension
            layerConfig.setTimeDimension(layerTimeDimension);
          } catch (error: unknown) {
            // Log and continue
            logger.logError(error);
          }
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
   *
   * @param layerConfig - The layer entry configuration.
   * @returns The GV Layer
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
   *
   * @param layerId - The layer identifier to get the capabilities for.
   * @param layer - Optional current layer entry from the capabilities that will be recursively searched.
   * @returns The found layer from the capabilities or undefined if not found.
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
   *
   * @param layerConfig - The configuration for the WMS layer.
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
      VERSION: layerConfig.getVersion(),
    };

    // Get the style to use
    const styleToUse = layerConfig.getStyleToUse();
    if (styleToUse) sourceParams.STYLES = styleToUse;

    // Get the data access path
    let dataAccessPathUrl = layerConfig.getDataAccessPath();

    // Strip down parameters that should not be in the OL param url
    // -> 'request' and 'service' shouldn't be there, OL will write them automatically
    // -> 'layers' and 'version' are already defined in the sourceParams variable above
    dataAccessPathUrl = GeoUtilities.ensureURLForOpenLayersSource(dataAccessPathUrl, ['request', 'service', 'layers', 'version']);

    // Create the source options
    const sourceOptions: SourceOptions = {
      url: dataAccessPathUrl,
      params: sourceParams,
      attributions: layerConfig.getAttributions(),
      serverType: layerConfig.getServerType() ?? 'mapserver', // default: mapserver
      crossOrigin: layerConfig.getSource().crossOrigin ?? 'Anonymous',
    };

    // Optional projection override
    sourceOptions.projection = layerConfig.getProjectionWithEPSG();

    // Create the source
    const olSource = new ImageWMS(sourceOptions);

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
   * @param url - The full WMS GetCapabilities URL to fetch metadata from.
   * @returns A promise that resolves to the parsed metadata object,
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
   *
   * This method is typically used in cases like GeoMet where individual layer metadata must be requested
   * separately using the `Layers` parameter in the GetCapabilities URL. It avoids duplicate requests for the
   * same `layerId`, handles proxy path updates, merges the individual metadata results into a single
   * base structure, and processes metadata inheritance afterward.
   *
   * @param url - The base WMS GetCapabilities URL used to fetch metadata.
   * @param layers - An array of layer configurations to fetch and merge metadata for.
   * @returns A promise that resolves to the merged metadata object,
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
        // Log and track metadata fetch failure. Search id: 8c97d776
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
   *
   * This function ensures that each unique `layerId` results in only one network request,
   * even if multiple layer configs share the same ID. The resulting promises will either
   * resolve to a metadata result or reject with a wrapped error.
   *
   * @param url - The base GetCapabilities URL used to fetch layer-specific metadata.
   * @param layers - An array of layer configurations to fetch metadata for.
   * @returns A promise that resolves to an array of metadata fetch promises, one per layer config.
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
                // Wrap error about no capabilities found. Search id: 8c97d776.
                reject(
                  new PromiseRejectErrorWrapper(
                    new LayerNoCapabilitiesError(layerConfig.getGeoviewLayerId(), layerConfig.getLayerNameCascade()),
                    layerConfig
                  )
                );
              }
            })
            .catch((error) => {
              // Wrap error with additional layer context. Search id: 8c97d776.
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
   *
   * @param metadataUrl - The metadataAccessPath
   * @param callbackNewMetadataUrl - Optional callback executed when a proxy had to be used to fetch the metadata.
   * The parameter sent in the callback is the proxy prefix with the '?' at the end.
   * @param abortSignal - Optional {@link AbortSignal} used to cancel the layer creation process.
   * @returns A promise that resolves once the execution is completed.
   * @throws {LayerServiceMetadataUnableToFetchError} When the metadata fetch fails or contains an error.
   */
  async #fetchXmlServiceMetadata(
    metadataUrl: string,
    callbackNewMetadataUrl?: CallbackNewMetadataDelegate,
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

    // Normalize metadataAccessPath - datacube specific normalization
    this.setMetadataAccessPath(normalizeDatacubeAccessPath(this.getMetadataAccessPath()));

    // Set the data access path of the layers underneath
    this.listOfLayerEntryConfig.forEach((layerEntry) => {
      // Normalize and set the data access path, when a layer entry is a group, this goes recursive
      layerEntry.setDataAccessPath(
        normalizeDatacubeAccessPath(metadata.Capability.Request.GetMap.DCPType[0].HTTP.Get.OnlineResource['@attributes']['xlink:href'])
      );
    });

    // Return the metadata
    return metadata;
  }

  /**
   * This method find the layer path that lead to the layer identified by the layerName.
   *
   * Values stored in the array tell us which direction to use to get to the layer. A value of -1 tells us that
   * the Layer property is an object. Other values tell us that the Layer property is an array and the value is
   * the index to follow. If the layer can not be found, the returned value is an empty array.
   *
   * @param layerName - The layer name to be found
   * @param layerProperty - The layer property from the metadata
   * @param pathToTheParentLayer - The path leading to the parent of the layerProperty parameter
   * @returns An array containing the path to the layer or [] if not found.
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
   * the WMS instance.
   *
   * Values stored in the path array tell us which direction to use to get to the layer. A value of -1 tells us
   * that the Layer property is an object. In this case, it is assumed that the metadata objects at this level only differ by the
   * layer property to add. Other values tell us that the Layer property is an array and the value is the index to follow. If at
   * this level in the path the layers have the same name, we move to the next level. Otherwise, the layer can be added.
   *
   * @param path - The layer name to be found
   * @param target - The metadata layer that will receive the new layer
   * @param source - The layer property to add
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
   *
   * @returns The array of layer configurations.
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
   *
   * @param layer - The layer property from the metadata that will inherit the values
   * @param parentLayer - Optional parent layer that contains the inherited values
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
   *
   * @param url - The url to query the metadata from.
   * @param callbackNewMetadataUrl - Optional callback executed when a proxy had to be used to fetch the metadata.
   * The parameter sent in the callback is the proxy prefix with the '?' at the end.
   * @param abortSignal - Optional {@link AbortSignal} used to cancel the layer creation process.
   * @throws {RequestTimeoutError} When the request exceeds the timeout duration.
   * @throws {RequestAbortedError} When the request was aborted by the caller's signal.
   * @throws {ResponseError} When the response is not OK (non-2xx).
   * @throws {ResponseEmptyError} When the JSON response is empty.
   * @throws {NetworkError} When a network issue happened.
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
   *
   * @param url - The url to query the metadata from.
   * @param layers - The layers to get the capabilities for.
   * @param callbackNewMetadataUrl - Optional callback executed when a proxy had to be used to fetch the metadata.
   * The parameter sent in the callback is the proxy prefix with the '?' at the end.
   * @throws {RequestTimeoutError} When the request exceeds the timeout duration.
   * @throws {RequestAbortedError} When the request was aborted by the caller's signal.
   * @throws {ResponseError} When the response is not OK (non-2xx).
   * @throws {ResponseEmptyError} When the JSON response is empty.
   * @throws {NetworkError} When a network issue happened.
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
   *
   * @param url - The url to query the metadata from.
   * @param layers - The layers to get the capabilities for.
   * @returns A promise that resolves with a TypeStylesWMS object for the layer(s).
   * @throws {RequestTimeoutError} When the request exceeds the timeout duration.
   * @throws {RequestAbortedError} When the request was aborted by the caller's signal.
   * @throws {ResponseError} When the response is not OK (non-2xx).
   * @throws {ResponseEmptyError} When the JSON response is empty.
   * @throws {NetworkError} When a network issue happened.
   */
  static fetchStylesForLayer(url: string, layers: string): Promise<TypeStylesWMS> {
    // Redirect
    return GeoUtilities.getWMSServiceStyles(url, layers);
  }

  /**
   * Fetches and constructs style configurations for WMS layers.
   *
   * This method retrieves style definitions from a WMS (Web Map Service) endpoint
   * for the specified layers, processes them, and returns a mapping of geometry
   * types to their corresponding layer style settings.
   *
   * @param url - The base WMS service URL used to fetch styles.
   * @param layers - A comma-separated list of WMS layer names to retrieve styles for.
   * @param geomType - Optional geometry type.
   * @returns A promise that resolves to a record mapping geometry types to layer style settings.
   * @throws {NotSupportedError} When the symbolizer type in a rule is unsupported.
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
   *
   * This method creates a basic TypeGeoviewLayerConfig using the provided
   * ID, name, and metadata access path URL. It then initializes the layer entries by calling
   * `initGeoViewLayerEntries`, which may involve fetching metadata or sublayer info.
   *
   * @param geoviewLayerId - A unique identifier for the layer.
   * @param geoviewLayerName - The display name of the layer.
   * @param metadataAccessPath - The full service URL to the layer endpoint.
   * @param isTimeAware - Optional to indicates whether the layer supports time-based filtering.
   * @param useFullWmsSublayers - Optional to indicates if we want the full sublayers of all wms or grouped (default is all sublayers).
   * @returns A promise that resolves to an initialized GeoView layer configuration with layer entries.
   */
  static initGeoviewLayerConfig(
    geoviewLayerId: string,
    geoviewLayerName: string,
    metadataAccessPath: string,
    isTimeAware?: boolean,
    useFullWmsSublayers: boolean = this.DEFAULT_WMS_LAYER_GROUP_FULL_SUB_LAYERS
  ): Promise<TypeGeoviewLayerConfig> {
    // Create the Layer config
    const myLayer = new WMS({
      geoviewLayerId,
      geoviewLayerName,
      metadataAccessPath,
      isTimeAware,
      useFullWmsSublayers,
    } as TypeWMSLayerConfig);
    return myLayer.initGeoViewLayerEntries();
  }

  /**
   * Creates a complete configuration object for a WMS GeoView layer.
   *
   * This function constructs a `TypeWMSLayerConfig` object that defines a WMS layer and its associated
   * entries. It supports both individual layers and nested group layers through recursive processing.
   *
   * @param geoviewLayerId - A unique identifier for the GeoView layer.
   * @param geoviewLayerName - The display name of the GeoView layer.
   * @param metadataAccessPath - The full service URL to the layer endpoint.
   * @param serverType - The type of WMS server (e.g., 'geoserver', 'mapserver').
   * @param isTimeAware - Indicates whether the layer supports time-based filtering.
   * @param layerEntries - The root array of parsed layer entries (may include nested groups).
   * @param useFullWmsSublayers - Optional to indicates if we want the full sublayers of all wms or grouped (default is all sublayers).
   * @param customGeocoreLayerConfig - Optional custom layer configuration to merge into leaf layers.
   * @returns The fully constructed WMS layer configuration object.
   */
  static createGeoviewLayerConfig(
    geoviewLayerId: string,
    geoviewLayerName: string,
    metadataAccessPath: string,
    serverType: TypeOfServer | undefined,
    isTimeAware: boolean | undefined,
    layerEntries: TypeLayerEntryShell[],
    useFullWmsSublayers: boolean = this.DEFAULT_WMS_LAYER_GROUP_FULL_SUB_LAYERS,
    customGeocoreLayerConfig: unknown = {}
  ): TypeWMSLayerConfig {
    const geoviewLayerConfig: TypeWMSLayerConfig = {
      geoviewLayerId,
      geoviewLayerName,
      metadataAccessPath,
      geoviewLayerType: CONST_LAYER_TYPES.WMS,
      useFullWmsSublayers,
      isTimeAware,
      listOfLayerEntryConfig: [],
    };

    // Recursively map layer entries
    geoviewLayerConfig.listOfLayerEntryConfig = layerEntries.map((layerEntry) =>
      WMS.#createLayerEntryConfig(layerEntry, geoviewLayerConfig, serverType, customGeocoreLayerConfig)
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
   * This function acts as an entry point to recursively transform a WMS layer tree into fully configured layer entry objects.
   *
   * @param {TypeLayerEntryShell} layerEntry - The WMS layer entry shell to convert (may be a group or leaf).
   * @param {TypeWMSLayerConfig} geoviewLayerConfig - The parent GeoView layer config that this entry belongs to.
   * @param serverType - The type of WMS server (e.g., 'geoserver', 'mapserver', etc.).
   * @param customGeocoreLayerConfig - Optional custom layer configuration to merge into leaf layers.
   * @returns The fully constructed layer entry configuration object.
   */
  static #createLayerEntryConfig(
    layerEntry: TypeLayerEntryShell,
    geoviewLayerConfig: TypeWMSLayerConfig,
    serverType: TypeOfServer | undefined,
    customGeocoreLayerConfig: unknown
  ): OgcWmsLayerEntryConfig | GroupLayerEntryConfig {
    // Check if it's a group layer (has children)
    const isGroup = Array.isArray(layerEntry.listOfLayerEntryConfig) && layerEntry.listOfLayerEntryConfig.length > 0;

    if (isGroup) {
      // Create the group layer config object
      const groupLayer = new GroupLayerEntryConfig({
        geoviewLayerConfig,
        layerId: layerEntry.id,
        ...(layerEntry.layerName && { layerName: `${layerEntry.layerName}` }),
        listOfLayerEntryConfig: [], // will be populated below
      } as GroupLayerEntryConfigProps);

      // Recursively build the group's tree
      WMS.#createGroupLayerRec(layerEntry.listOfLayerEntryConfig!, groupLayer);

      // Return the group layer
      return groupLayer;
    }

    // Leaf layer
    const layerEntryConfig: OgcWmsLayerEntryConfigProps = {
      geoviewLayerConfig,
      layerId: `${layerEntry.id}`,
      ...(layerEntry.layerName && { layerName: `${layerEntry.layerName}` }),
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
   *
   * @param geoviewLayerId - The unique identifier for the GeoView layer.
   * @param geoviewLayerName - The display name for the GeoView layer.
   * @param url - The URL of the service endpoint.
   * @param layerIds - An array of layer IDs to include in the configuration.
   * @param isTimeAware - Indicates if the layer is time aware.
   * @param useFullWmsSublayers - Optional - Indicates if we want the full sublayers of all wms or grouped (default is all sublayers).
   * @returns A promise that resolves to an array of layer configurations.
   */
  static processGeoviewLayerConfig(
    geoviewLayerId: string,
    geoviewLayerName: string,
    url: string,
    layerIds: number[],
    isTimeAware: boolean,
    useFullWmsSublayers?: boolean
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
      useFullWmsSublayers
    );

    // Create the class from geoview-layers package
    const myLayer = new WMS(layerConfig);

    // Process it
    return AbstractGeoViewLayer.processConfig(myLayer);
  }

  /**
   * Recursively builds a tree of layer entry configs from a hierarchical list of WMS layer entries,
   * and attaches them to a parent `GroupLayerEntryConfig`.
   *
   * This function inspects each `TypeLayerEntryShell`:
   * - If it contains nested entries (`listOfLayerEntryConfig`), it is treated as a group layer and processed recursively.
   * - If it is a leaf layer, a new `OgcWmsLayerEntryConfig` is created and added to the group's config list.
   * The function respects the `useFullWmsSublayers` setting from the parent layer config to determine
   * whether to include leaf layers or only group layers.
   *
   * @param layer - The list of WMS layer entry shells to process (can include nested groups).
   * @param layerConfig - The parent group layer config object to which the generated sublayers will be attached.
   * @param callbackGroupLayerCreated - Optional callback invoked when a leaf layer is created.
   */
  static #createGroupLayerRec(
    layer: TypeLayerEntryShell[],
    layerConfig: GroupLayerEntryConfig,
    callbackGroupLayerCreated?: GroupLayerCreatedDelegate
  ): void {
    const fullSubLayers =
      (layerConfig.getGeoviewLayerConfig() as TypeWMSLayerConfig).useFullWmsSublayers ?? this.DEFAULT_WMS_LAYER_GROUP_FULL_SUB_LAYERS;

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
        this.#createGroupLayerRec(subLayer.listOfLayerEntryConfig!, groupLayer, callbackGroupLayerCreated);

        // Cumulate
        newListOfLayerEntryConfig.push(groupLayer);
      } else if (fullSubLayers) {
        // Handle leaf layer - we ignore these if not fullSubLayers
        const subLayerEntryConfig = new OgcWmsLayerEntryConfig({
          ...layerConfig.cloneLayerProps(),
          layerId: `${subLayer.layerId}`,
          layerName: subLayer.layerName!,
          parentLayerConfig: layerConfig,
        });

        // Cumulate
        newListOfLayerEntryConfig.push(subLayerEntryConfig);

        // Callback if needed
        callbackGroupLayerCreated?.(subLayerEntryConfig);
      }
    });

    // We only want these set as a group layer if full sublayers are requested, otherwise the service handles the group
    if (fullSubLayers) {
      layerConfig.setEntryType(CONST_LAYER_ENTRY_TYPES.GROUP);
      layerConfig.setIsMetadataLayerGroup(true);
    }

    // eslint-disable-next-line no-param-reassign
    layerConfig.listOfLayerEntryConfig = newListOfLayerEntryConfig as TypeLayerEntryConfig[];
  }

  /**
   * Recursively builds a layer entry tree from WMS metadata layers.
   *
   * This function takes an array of WMS capability `Layer` objects and returns a corresponding tree of
   * `TypeLayerEntryShell` objects, preserving the nesting structure of sublayers.
   *
   * @param layers - The list of WMS capability layers to convert.
   * @returns A tree of layer entries representing the structure of the WMS layers.
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
   *
   * This method:
   *  - Derives a corresponding WFS layer configuration from the provided WMS layer.
   *  - Attaches the WFS config back to the original layer for later reference.
   *  - Validates and forwards WFS `featureInfo` (including `outfields`) into the WMS config.
   *  - Attempts to generate a dynamic style for the WMS layer using WMS `GetStyles`,
   *    optionally inferring geometry type from WFS field metadata.
   *  - Logs warnings if vectorial data or styles cannot be determined.
   *
   * This helper method enables a WMS layer to benefit from vector-like capabilities by:
   *  - reading attribute structure from a WFS equivalent,
   *  - reusing the WFS `featureInfo` definition,
   *  - generating styles from WMS metadata when available.
   * Failures during processing do not stop execution; they are logged as warnings.
   *
   * @param layerConfig - The WMS layer configuration being processed.
   * @returns A promise that resolves when processing is complete.
   * @throws {LayerDataAccessPathMandatoryError} When the Data Access Path was undefined, likely because initDataAccessPath wasn't called.
   * @throws {LayerEntryConfigFieldsNotFoundError} When WFS `outfields` cannot be read from the derived config.
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
