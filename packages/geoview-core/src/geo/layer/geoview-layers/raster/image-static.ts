/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable block-scoped-var, no-var, vars-on-top, no-param-reassign */
import axios from 'axios';

import ImageLayer from 'ol/layer/Image';
import Static, { Options as SourceOptions } from 'ol/source/ImageStatic';
import { Options as ImageOptions } from 'ol/layer/BaseImage';
import { Extent } from 'ol/extent';
import { transformExtent } from 'ol/proj';

import { Cast, TypeJsonObject } from '@/core/types/global-types';
import { AbstractGeoViewLayer, CONST_LAYER_TYPES, TypeLegend } from '../abstract-geoview-layers';
import { AbstractGeoViewRaster, TypeBaseRasterLayer } from './abstract-geoview-raster';
import {
  TypeLayerEntryConfig,
  TypeGeoviewLayerConfig,
  TypeListOfLayerEntryConfig,
  layerEntryIsGroupLayer,
  TypeImageStaticLayerEntryConfig,
} from '@/geo/map/map-schema-types';
import { getLocalizedValue, getMinOrMaxExtents } from '@/core/utils/utilities';
import { api } from '@/app';
import { Layer } from '../../layer';
import { LayerSetPayload } from '@/api/events/payloads';

export interface TypeImageStaticLayerConfig extends Omit<TypeGeoviewLayerConfig, 'listOfLayerEntryConfig'> {
  geoviewLayerType: 'imageStatic';
  listOfLayerEntryConfig: TypeImageStaticLayerEntryConfig[];
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
 * type guard function that redefines a TypeLayerEntryConfig as a TypeImageStaticLayerEntryConfig if the geoviewLayerType attribute of the
 * verifyIfGeoViewEntry.geoviewRootLayer attribute is ImageStatic. The type ascention applies only to the true block of
 * the if clause that use this function.
 *
 * @param {TypeLayerEntryConfig} verifyIfGeoViewEntry Polymorphic object to test in order to determine if the type ascention is
 * valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const geoviewEntryIsImageStatic = (
  verifyIfGeoViewEntry: TypeLayerEntryConfig
): verifyIfGeoViewEntry is TypeImageStaticLayerEntryConfig => {
  return verifyIfGeoViewEntry?.geoviewRootLayer?.geoviewLayerType === CONST_LAYER_TYPES.IMAGE_STATIC;
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
  protected getServiceMetadata(): Promise<void> {
    this.changeLayerPhase('getServiceMetadata');
    const promisedExecution = new Promise<void>((resolve) => {
      resolve();
    });
    return promisedExecution;
  }

  /** ***************************************************************************************************************************
   * Get the legend image of a layer.
   *
   * @param {TypeImageStaticLayerEntryConfig} layerConfig layer configuration.
   *
   * @returns {blob} image blob
   */
  private getLegendImage(layerConfig: TypeImageStaticLayerEntryConfig): Promise<string | ArrayBuffer | null> {
    const promisedImage = new Promise<string | ArrayBuffer | null>((resolve) => {
      const readImage = (blob: Blob): Promise<string | ArrayBuffer | null> =>
        // eslint-disable-next-line @typescript-eslint/no-shadow
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(blob);
        });

      let legendUrl: string | undefined = getLocalizedValue(layerConfig.source.dataAccessPath, this.mapId);

      if (legendUrl) {
        legendUrl = legendUrl.toLowerCase().startsWith('http:') ? `https${legendUrl.slice(4)}` : legendUrl;

        axios
          .get<TypeJsonObject>(legendUrl, { responseType: 'blob', withCredentials: false })
          .then((response) => {
            resolve(readImage(Cast<Blob>(response.data)));
          })
          .catch((error) => resolve(null));
      } else resolve(null);
    });
    return promisedImage;
  }

  /** ***************************************************************************************************************************
   * Return the legend of the layer.This routine return null when the layerPath specified is not found. If the legend can't be
   * read, the legend property of the object returned will be null.
   *
   * @param {string | TypeLayerEntryConfig} layerPathOrConfig Layer path or configuration.
   *
   * @returns {Promise<TypeLegend | null>} The legend of the layer.
   */
  getLegend(layerPathOrConfig: string | TypeLayerEntryConfig): Promise<TypeLegend | null> {
    const promisedLegend = new Promise<TypeLegend | null>((resolve) => {
      const layerConfig = Cast<TypeImageStaticLayerEntryConfig | undefined | null>(
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
          api.maps[this.mapId].geoviewRenderer.loadImage(legendImage as string).then((image) => {
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
   * This method recursively validates the layer configuration entries by filtering and reporting invalid layers. If needed,
   * extra configuration may be done here.
   *
   * @param {TypeListOfLayerEntryConfig} listOfLayerEntryConfig The list of layer entries configuration to validate.
   *
   * @returns {TypeListOfLayerEntryConfig} A new list of layer entries configuration with deleted error layers.
   */
  protected validateListOfLayerEntryConfig(listOfLayerEntryConfig: TypeListOfLayerEntryConfig) {
    this.changeLayerPhase('validateListOfLayerEntryConfig');
    listOfLayerEntryConfig.forEach((layerEntryConfig: TypeLayerEntryConfig) => {
      const layerPath = Layer.getLayerPath(layerEntryConfig);
      if (layerEntryIsGroupLayer(layerEntryConfig)) {
        this.validateListOfLayerEntryConfig(layerEntryConfig.listOfLayerEntryConfig!);
        if (!layerEntryConfig.listOfLayerEntryConfig.length) {
          this.layerLoadError.push({
            layer: layerPath,
            consoleMessage: `Empty layer group (mapId:  ${this.mapId}, layerPath: ${layerPath})`,
          });
          this.changeLayerStatus('error', layerEntryConfig);
          return;
        }
      }

      this.changeLayerStatus('loading', layerEntryConfig);

      // When no metadata are provided, all layers are considered valid.
      if (!this.metadata) return;

      // Note that Image Static metadata as we defined it does not contains metadata layer group. If you need geojson layer group,
      // you can define them in the configuration section.
      if (Array.isArray(this.metadata?.listOfLayerEntryConfig)) {
        const metadataLayerList = Cast<TypeLayerEntryConfig[]>(this.metadata?.listOfLayerEntryConfig);
        const foundEntry = metadataLayerList.find((layerMetadata) => layerMetadata.layerId === layerEntryConfig.layerId);
        if (!foundEntry) {
          this.layerLoadError.push({
            layer: layerPath,
            consoleMessage: `GeoJSON layer not found (mapId:  ${this.mapId}, layerPath: ${layerPath})`,
          });
          this.changeLayerStatus('error', layerEntryConfig);
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
   * This method creates a GeoView Image Static layer using the definition provided in the layerEntryConfig parameter.
   *
   * @param {TypeImageStaticLayerEntryConfig} layerEntryConfig Information needed to create the GeoView layer.
   *
   * @returns {TypeBaseRasterLayer} The GeoView raster layer that has been created.
   */
  processOneLayerEntry(layerEntryConfig: TypeImageStaticLayerEntryConfig): Promise<TypeBaseRasterLayer | null> {
    const promisedVectorLayer = new Promise<TypeBaseRasterLayer | null>((resolve) => {
      this.changeLayerPhase('processOneLayerEntry', layerEntryConfig);

      if (!layerEntryConfig.source.extent) throw new Error('Parameter extent is not defined in source element of layerEntryConfig.');
      const sourceOptions: SourceOptions = {
        url: getLocalizedValue(layerEntryConfig.source.dataAccessPath, this.mapId) || '',
        imageExtent: layerEntryConfig.source.extent,
      };

      if (layerEntryConfig.source.crossOrigin) {
        sourceOptions.crossOrigin = layerEntryConfig.source.crossOrigin;
      } else {
        sourceOptions.crossOrigin = 'Anonymous';
      }

      if (layerEntryConfig.source.projection) {
        sourceOptions.projection = `EPSG:${layerEntryConfig.source.projection}`;
      } else throw new Error('Parameter projection is not define in source element of layerEntryConfig.');

      const staticImageOptions: ImageOptions<Static> = { source: new Static(sourceOptions) };
      // layerEntryConfig.initialSettings cannot be undefined because config-validation set it to {} if it is undefined.
      if (layerEntryConfig.initialSettings?.extent !== undefined) staticImageOptions.extent = layerEntryConfig.initialSettings?.extent;
      if (layerEntryConfig.initialSettings?.maxZoom !== undefined) staticImageOptions.maxZoom = layerEntryConfig.initialSettings?.maxZoom;
      if (layerEntryConfig.initialSettings?.minZoom !== undefined) staticImageOptions.minZoom = layerEntryConfig.initialSettings?.minZoom;
      if (layerEntryConfig.initialSettings?.opacity !== undefined) staticImageOptions.opacity = layerEntryConfig.initialSettings?.opacity;
      if (layerEntryConfig.initialSettings?.visible !== undefined)
        staticImageOptions.visible =
          layerEntryConfig.initialSettings?.visible === 'yes' || layerEntryConfig.initialSettings?.visible === 'always';

      layerEntryConfig.olLayer = new ImageLayer(staticImageOptions);

      super.addLoadendListener(layerEntryConfig, 'image');

      resolve(layerEntryConfig.olLayer);
    });

    return promisedVectorLayer;
  }

  /** ***************************************************************************************************************************
   * Get the bounds of the layer represented in the layerConfig, returns updated bounds
   *
   * @param {TypeLayerEntryConfig} layerConfig Layer config to get bounds from.
   * @param {Extent | undefined} bounds The current bounding box to be adjusted.
   *
   * @returns {Extent} The layer bounding box.
   */
  protected getBounds(layerConfig: TypeLayerEntryConfig, bounds: Extent | undefined): Extent | undefined {
    const layerBounds = (layerConfig.olLayer as ImageLayer<Static>).getSource()?.getImageExtent();
    const projection =
      (layerConfig.olLayer as ImageLayer<Static>).getSource()?.getProjection()?.getCode().replace('EPSG:', '') ||
      api.maps[this.mapId].currentProjection;

    if (layerBounds) {
      const transformedBounds = transformExtent(layerBounds, `EPSG:${projection}`, `EPSG:4326`);
      if (!bounds) bounds = [transformedBounds[0], transformedBounds[1], transformedBounds[2], transformedBounds[3]];
      else bounds = getMinOrMaxExtents(bounds, transformedBounds);
    }

    return bounds;
  }
}
