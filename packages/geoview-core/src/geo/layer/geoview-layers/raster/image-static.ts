import axios from 'axios';

import ImageLayer from 'ol/layer/Image';
import Static, { Options as SourceOptions } from 'ol/source/ImageStatic';
import { Options as ImageOptions } from 'ol/layer/BaseImage';
import { Extent } from 'ol/extent';

// import { layerEntryIsGroupLayer } from '@config/types/type-guards';

import { Cast, TypeJsonObject } from '@/core/types/global-types';
import { AbstractGeoViewLayer, CONST_LAYER_TYPES, TypeLegend } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { AbstractGeoViewRaster, TypeBaseRasterLayer } from '@/geo/layer/geoview-layers/raster/abstract-geoview-raster';
import { TypeLayerEntryConfig, TypeGeoviewLayerConfig, layerEntryIsGroupLayer } from '@/geo/map/map-schema-types';
import { Projection } from '@/geo/utils/projection';
import { getLocalizedValue } from '@/core/utils/utilities';
import { getMinOrMaxExtents } from '@/geo/utils/utilities';
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';
import { logger } from '@/core/utils/logger';
import { ImageStaticLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/image-static-layer-entry-config';
import { AppEventProcessor } from '@/api/event-processors/event-processor-children/app-event-processor';
import { loadImage } from '@/geo/utils/renderer/geoview-renderer';

export interface TypeImageStaticLayerConfig extends Omit<TypeGeoviewLayerConfig, 'listOfLayerEntryConfig'> {
  geoviewLayerType: typeof CONST_LAYER_TYPES.IMAGE_STATIC;
  listOfLayerEntryConfig: ImageStaticLayerEntryConfig[];
}

/** *****************************************************************************************************************************
 * type guard function that redefines a TypeGeoviewLayerConfig as a TypeImageStaticLayerConfig if the geoviewLayerType attribute of the
 * verifyIfLayer parameter is ImageStatic. The type ascention applies only to the true block of the if clause that use this function.
 *
 * @param {TypeGeoviewLayerConfig} verifyIfLayer Polymorphic object to test in order to determine if the type ascention is valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const layerConfigIsImageStatic = (verifyIfLayer: TypeGeoviewLayerConfig): verifyIfLayer is TypeImageStaticLayerConfig => {
  return verifyIfLayer?.geoviewLayerType === CONST_LAYER_TYPES.IMAGE_STATIC;
};

/** *****************************************************************************************************************************
 * type guard function that redefines an AbstractGeoViewLayer as a ImageStatic if the type attribute of the verifyIfGeoViewLayer
 * parameter is ImageStatic. The type ascention applies only to the true block of the if clause that use this function.
 *
 * @param {AbstractGeoViewLayer} verifyIfGeoViewLayer Polymorphic object to test in order to determine if the type ascention is
 * valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const geoviewLayerIsImageStatic = (verifyIfGeoViewLayer: AbstractGeoViewLayer): verifyIfGeoViewLayer is ImageStatic => {
  return verifyIfGeoViewLayer?.type === CONST_LAYER_TYPES.IMAGE_STATIC;
};

/** *****************************************************************************************************************************
 * type guard function that redefines a TypeLayerEntryConfig as a ImageStaticLayerEntryConfig if the geoviewLayerType attribute of the
 * verifyIfGeoViewEntry.geoviewLayerConfig attribute is ImageStatic. The type ascention applies only to the true block of
 * the if clause that use this function.
 *
 * @param {TypeLayerEntryConfig} verifyIfGeoViewEntry Polymorphic object to test in order to determine if the type ascention is
 * valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const geoviewEntryIsImageStatic = (
  verifyIfGeoViewEntry: TypeLayerEntryConfig
): verifyIfGeoViewEntry is ImageStaticLayerEntryConfig => {
  return verifyIfGeoViewEntry?.geoviewLayerConfig?.geoviewLayerType === CONST_LAYER_TYPES.IMAGE_STATIC;
};

// ******************************************************************************************************************************
// ******************************************************************************************************************************
/** *****************************************************************************************************************************
 * A class to add image static layer.
 *
 * @exports
 * @class ImageStatic
 */
// ******************************************************************************************************************************
export class ImageStatic extends AbstractGeoViewRaster {
  /** ***************************************************************************************************************************
   * Initialize layer
   *
   * @param {string} mapId the id of the map
   * @param {TypeImageStaticLayerConfig} layerConfig the layer configuration
   */
  constructor(mapId: string, layerConfig: TypeImageStaticLayerConfig) {
    super(CONST_LAYER_TYPES.IMAGE_STATIC, layerConfig, mapId);
  }

  /** ***************************************************************************************************************************
   * Image static has no metadata.
   *
   * @returns {Promise<void>} A promise that the execution is completed.
   */
  protected override fetchServiceMetadata(): Promise<void> {
    const promisedExecution = new Promise<void>((resolve) => {
      resolve();
    });
    return promisedExecution;
  }

  /** ***************************************************************************************************************************
   * Get the legend image of a layer.
   *
   * @param {ImageStaticLayerEntryConfig} layerConfig layer configuration.
   *
   * @returns {blob} image blob
   * @private
   */
  #getLegendImage(layerConfig: ImageStaticLayerEntryConfig): Promise<string | ArrayBuffer | null> {
    const promisedImage = new Promise<string | ArrayBuffer | null>((resolve) => {
      const readImage = (blob: Blob): Promise<string | ArrayBuffer | null> =>
        // eslint-disable-next-line @typescript-eslint/no-shadow
        new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(blob);
        });

      let legendUrl: string | undefined = getLocalizedValue(
        layerConfig.source.dataAccessPath,
        AppEventProcessor.getDisplayLanguage(this.mapId)
      );

      if (legendUrl) {
        legendUrl = legendUrl.toLowerCase().startsWith('http:') ? `https${legendUrl.slice(4)}` : legendUrl;

        axios
          .get<TypeJsonObject>(legendUrl, { responseType: 'blob', withCredentials: false })
          .then((response) => {
            resolve(readImage(Cast<Blob>(response.data)));
          })
          .catch(() => resolve(null));
      } else resolve(null);
    });
    return promisedImage;
  }

  /** ***************************************************************************************************************************
   * Return the legend of the layer.This routine return null when the layerPath specified is not found. If the legend can't be
   * read, the legend property of the object returned will be null.
   *
   * @param {string} layerPath The layer path to the layer's configuration.
   *
   * @returns {Promise<TypeLegend | null>} The legend of the layer.
   */
  override async getLegend(layerPath: string): Promise<TypeLegend | null> {
    try {
      const layerConfig = this.getLayerEntryConfig(layerPath) as ImageStaticLayerEntryConfig | undefined | null;
      if (!layerConfig) return null;

      const legendImage = await this.#getLegendImage(layerConfig!);
      if (!legendImage) {
        const legend: TypeLegend = {
          type: this.type,
          layerName: layerConfig!.layerName,
          legend: null,
        };
        return legend;
      }
      const image = await loadImage(legendImage as string);
      if (image) {
        const drawingCanvas = document.createElement('canvas');
        drawingCanvas.width = image.width;
        drawingCanvas.height = image.height;
        const drawingContext = drawingCanvas.getContext('2d')!;
        drawingContext.drawImage(image, 0, 0);
        const legend: TypeLegend = {
          type: this.type,
          layerName: layerConfig!.layerName,
          legend: drawingCanvas,
        };
        return legend;
      }
      const legend: TypeLegend = {
        type: this.type,
        layerName: layerConfig!.layerName,
        legend: null,
      };
      return legend;
    } catch (error) {
      logger.logError(`Error getting legend for ${layerPath}`, error);
      return null;
    }
  }

  /** ***************************************************************************************************************************
   * This method recursively validates the layer configuration entries by filtering and reporting invalid layers. If needed,
   * extra configuration may be done here.
   *
   * @param {TypeLayerEntryConfig[]} listOfLayerEntryConfig The list of layer entries configuration to validate.
   *
   * @returns {TypeLayerEntryConfig[]} A new list of layer entries configuration with deleted error layers.
   */
  protected validateListOfLayerEntryConfig(listOfLayerEntryConfig: TypeLayerEntryConfig[]): void {
    listOfLayerEntryConfig.forEach((layerConfig: TypeLayerEntryConfig) => {
      const { layerPath } = layerConfig;
      if (layerEntryIsGroupLayer(layerConfig)) {
        this.validateListOfLayerEntryConfig(layerConfig.listOfLayerEntryConfig!);
        if (!layerConfig.listOfLayerEntryConfig.length) {
          this.layerLoadError.push({
            layer: layerPath,
            loggerMessage: `Empty layer group (mapId:  ${this.mapId}, layerPath: ${layerPath})`,
          });
          // eslint-disable-next-line no-param-reassign
          layerConfig.layerStatus = 'error';
          return;
        }
      }

      // eslint-disable-next-line no-param-reassign
      layerConfig.layerStatus = 'processing';

      // When no metadata are provided, all layers are considered valid.
      if (!this.metadata) return;

      // Note that Image Static metadata as we defined it does not contains metadata layer group. If you need geojson layer group,
      // you can define them in the configuration section.
      if (Array.isArray(this.metadata?.listOfLayerEntryConfig)) {
        const metadataLayerList = Cast<TypeLayerEntryConfig[]>(this.metadata?.listOfLayerEntryConfig);
        const foundEntry = metadataLayerList.find((layerMetadata) => layerMetadata.layerId === layerConfig.layerId);
        if (!foundEntry) {
          this.layerLoadError.push({
            layer: layerPath,
            loggerMessage: `GeoJSON layer not found (mapId:  ${this.mapId}, layerPath: ${layerPath})`,
          });
          // eslint-disable-next-line no-param-reassign
          layerConfig.layerStatus = 'error';
          return;
        }
        return;
      }

      throw new Error(
        `Invalid GeoJSON metadata (listOfLayerEntryConfig) prevent loading of layer (mapId:  ${this.mapId}, layerPath: ${layerPath})`
      );
    });
  }

  /** ****************************************************************************************************************************
   * This method creates a GeoView Image Static layer using the definition provided in the layerConfig parameter.
   *
   * @param {ImageStaticLayerEntryConfig} layerConfig Information needed to create the GeoView layer.
   *
   * @returns {Promise<TypeBaseRasterLayer | undefined>} The GeoView raster layer that has been created.
   */
  protected override async processOneLayerEntry(layerConfig: ImageStaticLayerEntryConfig): Promise<TypeBaseRasterLayer | undefined> {
    await super.processOneLayerEntry(layerConfig);

    if (!layerConfig?.source?.extent) throw new Error('Parameter extent is not defined in source element of layerConfig.');
    const sourceOptions: SourceOptions = {
      url: getLocalizedValue(layerConfig.source.dataAccessPath, AppEventProcessor.getDisplayLanguage(this.mapId)) || '',
      imageExtent: layerConfig.source.extent,
    };

    if (layerConfig?.source?.crossOrigin) {
      sourceOptions.crossOrigin = layerConfig.source.crossOrigin;
    } else {
      sourceOptions.crossOrigin = 'Anonymous';
    }

    if (layerConfig?.source?.projection) {
      sourceOptions.projection = `EPSG:${layerConfig.source.projection}`;
    } else throw new Error('Parameter projection is not define in source element of layerConfig.');

    const staticImageOptions: ImageOptions<Static> = { source: new Static(sourceOptions) };
    // layerConfig.initialSettings cannot be undefined because config-validation set it to {} if it is undefined.
    if (layerConfig.initialSettings?.extent !== undefined) staticImageOptions.extent = layerConfig.initialSettings.extent;
    if (layerConfig.initialSettings?.maxZoom !== undefined) staticImageOptions.maxZoom = layerConfig.initialSettings.maxZoom;
    if (layerConfig.initialSettings?.minZoom !== undefined) staticImageOptions.minZoom = layerConfig.initialSettings.minZoom;
    if (layerConfig.initialSettings?.states?.opacity !== undefined) staticImageOptions.opacity = layerConfig.initialSettings.states.opacity;
    // GV IMPORTANT: The initialSettings.visible flag must be set in the layerConfig.loadedFunction otherwise the layer will stall
    // GV            in the 'loading' state if the flag value is false.

    // Create the OpenLayer layer
    const olLayer = new ImageLayer(staticImageOptions);

    // TODO: Refactor - Wire it up
    this.setLayerAndLoadEndListeners(layerConfig, {
      olLayer,
      loadEndListenerType: 'image',
    });

    return Promise.resolve(olLayer);
  }

  /** ***************************************************************************************************************************
   * Get the bounds of the layer represented in the layerConfig pointed to by the layerPath, returns updated bounds
   *
   * @param {string} layerPath The Layer path to the layer's configuration.
   * @param {Extent | undefined} bounds The current bounding box to be adjusted.
   *
   * @returns {Extent} The new layer bounding box.
   */
  protected getBounds(layerPath: string, bounds?: Extent): Extent | undefined {
    const layer = this.getOLLayer(layerPath) as ImageLayer<Static> | undefined;

    const layerBounds = layer?.getSource()?.getImageExtent();
    const projection =
      layer?.getSource()?.getProjection()?.getCode().replace('EPSG:', '') || MapEventProcessor.getMapState(this.mapId).currentProjection;

    if (layerBounds) {
      let transformedBounds = layerBounds;
      if (this.metadata?.fullExtent?.spatialReference?.wkid !== MapEventProcessor.getMapState(this.mapId).currentProjection) {
        transformedBounds = Projection.transformExtent(
          layerBounds,
          `EPSG:${projection}`,
          `EPSG:${MapEventProcessor.getMapState(this.mapId).currentProjection}`
        );
      }

      // eslint-disable-next-line no-param-reassign
      if (!bounds) bounds = [transformedBounds[0], transformedBounds[1], transformedBounds[2], transformedBounds[3]];
      // eslint-disable-next-line no-param-reassign
      else bounds = getMinOrMaxExtents(bounds, transformedBounds);
    }

    return bounds;
  }
}
