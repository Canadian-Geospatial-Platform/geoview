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
import { OgcWmsLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/ogc-wms-layer-entry-config';
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

/** Local type to work with a metadata fetch result */
type MetatadaFetchResult = { layerConfig: TypeLayerEntryConfig; metadata: TypeJsonObject };

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
   * Overrides the way the metadata is fetched and set in the 'metadata' property. Resolves when done.
   * @returns {Promise<void>} A promise that the execution is completed.
   */
  protected override async onFetchAndSetServiceMetadata(): Promise<void> {
    // If the metadata url ends with .xml
    // GV Not checking if 'includes' .xml, because an url like 'my_url/metadata.xml?request=GetCapabilities' shouldn't exist.
    if (this.metadataAccessPath.toLowerCase().endsWith('.xml')) {
      // XML metadata is a special case that does not use GetCapabilities to get the metadata
      await this.#fetchXmlServiceMetadata(this.metadataAccessPath, (proxyUsed: string) => {
        // A Proxy had to be used to fetch the service metadata, update the layer config with it
        this.metadataAccessPath = `${proxyUsed}${this.metadataAccessPath}`;
      });
    } else {
      let metadataUrlGetCap = this.metadataAccessPath;
      if (!this.metadataAccessPath.includes('request=GetCapabilities')) {
        metadataUrlGetCap = `${this.metadataAccessPath}?service=WMS&version=1.3.0&request=GetCapabilities`;
      }

      const layerConfigsToQuery = this.#getLayersToQuery();
      if (layerConfigsToQuery.length === 0) {
        // Use GetCapabilities to get the metadata
        const metadata = await WMS.fetchMetadata(metadataUrlGetCap, (proxyUsed: string) => {
          // A Proxy had to be used to fetch the service metadata, update the layer config with it
          this.metadataAccessPath = `${proxyUsed}${this.metadataAccessPath}`;
        });

        // Set the metadata
        // TODO: Check - without validating if they have Capability property?
        this.metadata = metadata;

        this.#processMetadataInheritance();
      } else {
        // Uses GetCapabilities to get the metadata. However, to allow geomet metadata to be retrieved using the non-standard
        // "Layers" parameter on the command line, we need to process each layer individually and merge all layer metadata at
        // the end. Even though the "Layers" parameter is ignored by other WMS servers, the drawback of this method is
        // sending unnecessary requests while only one GetCapabilities could be used when the server publishes a small set of
        // metadata. Which is not the case for the Geomet service.
        const promisedArrayOfMetadata: Promise<MetatadaFetchResult>[] = [];
        layerConfigsToQuery.forEach((layerConfig: TypeLayerEntryConfig, currentIndex: number) => {
          // Find the first index where a layer with the same ID appears
          const firstOccurrenceIndex = layerConfigsToQuery.findIndex((entry) => entry.layerId === layerConfig.layerId);

          // If first time we see this layerId
          if (firstOccurrenceIndex === currentIndex) {
            // Create a promise of a metadata fetch
            const promise = new Promise<MetatadaFetchResult>((resolve, reject) => {
              const promiseMetadata = WMS.fetchMetadata(`${metadataUrlGetCap}&Layers=${layerConfig.layerId}`, (proxyUsed: string) => {
                // A proxy was used; update the data access path accordingly
                // eslint-disable-next-line no-param-reassign
                layerConfig.source!.dataAccessPath = `${proxyUsed}${this.metadataAccessPath}`;
              });

              // When done, resolve with information or reject with information
              promiseMetadata
                .then((metadata) => {
                  // If there is indeed a Capability property
                  if (metadata.Capability) {
                    // Resolve the metadata GetCap
                    resolve({ metadata, layerConfig });
                  } else {
                    // No Capability property
                    reject(
                      new PromiseRejectErrorWrapper(
                        new LayerNoCapabilitiesError(layerConfig.geoviewLayerConfig.geoviewLayerId, layerConfig.getLayerName()),
                        layerConfig
                      )
                    );
                  }
                })
                .catch((error: unknown) => {
                  reject(new PromiseRejectErrorWrapper(error, layerConfig));
                });
            });

            // Add the promise in the list
            promisedArrayOfMetadata.push(promise);
          } else {
            // This layerId has already been queried; reuse the previous promise
            promisedArrayOfMetadata.push(promisedArrayOfMetadata[firstOccurrenceIndex]);
          }
        });

        // Wait for all promises to resolve
        const arrayOfMetadata = await Promise.allSettled(promisedArrayOfMetadata);

        // If no layers metadata fetch fulfilled (all failed)
        if (arrayOfMetadata.filter((promise) => promise.status === 'fulfilled').length === 0) {
          // Set the parent in error status
          layerConfigsToQuery[0].parentLayerConfig?.setLayerStatusError();
        }

        // For each settled promise
        arrayOfMetadata.forEach((promise) => {
          // If the promise fulfilled
          if (promise.status === 'fulfilled') {
            // GV This section has been rewritten, in this commit, trying to keep the logic intact best I could and
            // GV keeping the private functions call too (still seems confusing to me though)

            // If the metadata hasn't been set yet
            if (!this.metadata) this.metadata = promise.value.metadata;

            const layerId = promise.value.layerConfig.layerId!;
            const alreadyExists = this.getLayerCapabilities(layerId);

            // If not already loaded
            if (!alreadyExists) {
              const metadataLayerPathToAdd = this.#getMetadataLayerPath(layerId, promise.value.metadata.Capability.Layer);

              this.#addLayerToMetadataInstance(
                metadataLayerPathToAdd,
                this.metadata.Capability.Layer,
                promise.value.metadata.Capability?.Layer
              );
            }
          } else {
            // Get the reason
            const reason = promise.reason as PromiseRejectErrorWrapper<TypeLayerEntryConfig>;

            // Track the error
            this.addLayerLoadError(reason.error, reason.object);
          }
        });

        this.#processMetadataInheritance();
      }
    }
  }

  /**
   * Overrides the validation of a layer entry config.
   * @param {TypeLayerEntryConfig} layerConfig - The layer entry config to validate.
   */
  protected override onValidateLayerEntryConfig(layerConfig: TypeLayerEntryConfig): void {
    const layerFound = this.getLayerCapabilities(layerConfig.layerId!);
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
        layerConfig.initialSettings!.bounds = validateExtent(layerCapabilities.EX_GeographicBoundingBox as Extent);
      }

      // If there's a dimension
      if (layerCapabilities.Dimension) {
        // TODO: Validate the layerCapabilities.Dimension for example if an interval is even possible

        // TODO: Validate the layerConfig.layerFilter is compatible with the layerCapabilities.Dimension and if not remove it completely like `delete layerConfig.layerFilter`

        const temporalDimension: TypeJsonObject | undefined = (layerCapabilities.Dimension as TypeJsonArray).find(
          (dimension) => dimension.name === 'time'
        );

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
   * Recursively finds gets the layer capability for a given layer id.
   * @param {string} layerId - The layer identifier to get the capabilities for.
   * @param {TypeJsonObject | undefined} layer - The current layer entry from the capabilities that will be recursively searched.
   * @returns {TypeJsonObject?} The found layer from the capabilities or undefined if not found.
   */
  getLayerCapabilities(
    layerId: string,
    currentLayerEntry: TypeJsonObject | undefined = this.metadata?.Capability?.Layer
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
   * This method reads the service metadata from a XML metadataAccessPath.
   * @param {string} metadataUrl The metadataAccessPath
   * @param {Function} callbackNewMetadataUrl - Callback executed when a proxy had to be used to fetch the metadata.
   *                                            The parameter sent in the callback is the proxy prefix with the '?' at the end.
   * @returns {Promise<void>} A promise that the execution is completed.
   * @private
   */
  async #fetchXmlServiceMetadata(metadataUrl: string, callbackNewMetadataUrl?: (proxyUsed: string) => void): Promise<void> {
    // Fetch it
    const capabilities = await WMS.fetchMetadata(metadataUrl, callbackNewMetadataUrl);

    // Set the metadata
    // TODO: Check - without validating if they have Capability property?
    this.metadata = capabilities;

    this.#processMetadataInheritance();
    const metadataAccessPath = this.metadata?.Capability.Request.GetMap.DCPType[0].HTTP.Get.OnlineResource as string;
    this.metadataAccessPath = metadataAccessPath;
    const dataAccessPath = this.metadata?.Capability.Request.GetMap.DCPType[0].HTTP.Get.OnlineResource as string;
    const setDataAccessPath = (listOfLayerEntryConfig: TypeLayerEntryConfig[]): void => {
      listOfLayerEntryConfig.forEach((layerConfig) => {
        if (layerEntryIsGroupLayer(layerConfig)) setDataAccessPath(layerConfig.listOfLayerEntryConfig);
        else {
          // eslint-disable-next-line no-param-reassign
          layerConfig.source!.dataAccessPath = dataAccessPath;
        }
      });
    };
    setDataAccessPath(this.listOfLayerEntryConfig);
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
   * This method reads the layer identifiers from the configuration to create an array that will be used in the GetCapabilities.
   *
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
   * This method propagate the WMS metadata inherited values.
   *
   * @param {TypeJsonObject} parentLayer The parent layer that contains the inherited values
   * @param {TypeJsonObject | undefined} layer The layer property from the metadata that will inherit the values
   * @private
   */
  #processMetadataInheritance(parentLayer?: TypeJsonObject, layer: TypeJsonObject | undefined = this.metadata?.Capability?.Layer): void {
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
   * This method create recursively dynamic group layers from the service metadata.
   *
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

  /**
   * Fetches the metadata for a typical WFS class.
   * @param {string} url - The url to query the metadata from.
   * @param {Function} callbackNewMetadataUrl - Callback executed when a proxy had to be used to fetch the metadata.
   *                                            The parameter sent in the callback is the proxy prefix with the '?' at the end.
   */
  static override async fetchMetadata(url: string, callbackNewMetadataUrl?: (proxyUsed: string) => void): Promise<TypeJsonObject> {
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
   * Creates a configuration object for a WMS layer.
   * This function constructs a `TypeWMSLayerConfig` object that describes an WMS layer
   * and its associated entry configurations based on the provided parameters.
   * @param {string} geoviewLayerId - A unique identifier for the GeoView layer.
   * @param {string} geoviewLayerName - The display name of the GeoView layer.
   * @param {string} metadataAccessPath - The URL or path to access metadata.
   * @param {TypeOfServer} serverType - The server type.
   * @param {boolean} isTimeAware - Indicates whether the layer supports time-based filtering.
   * @param {TypeJsonArray} layerEntries - An array of layer entries objects to be included in the configuration.
   * @returns {TypeWMSLayerConfig} The constructed configuration object for the WMS layer.
   */
  static createWMSLayerConfig(
    geoviewLayerId: string,
    geoviewLayerName: string,
    metadataAccessPath: string,
    serverType: TypeOfServer,
    isTimeAware: boolean,
    layerEntries: TypeJsonArray,
    customGeocoreLayerConfig: TypeJsonObject
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
        layerId: layerEntry.id as string,
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
