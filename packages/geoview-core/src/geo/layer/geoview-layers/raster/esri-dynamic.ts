import { ImageArcGISRest } from 'ol/source';
import { Options as SourceOptions } from 'ol/source/ImageArcGISRest';
import { Options as ImageOptions } from 'ol/layer/BaseImage';
import { Image as ImageLayer } from 'ol/layer';

import { TypeJsonObject } from '../../../../core/types/global-types';
import { getLocalizedValue, getXMLHttpRequest } from '../../../../core/utils/utilities';
import { AbstractGeoViewLayer, CONST_LAYER_TYPES } from '../abstract-geoview-layers';
import { AbstractGeoViewRaster, TypeBaseRasterLayer } from './abstract-geoview-raster';
import {
  TypeImageLayerEntryConfig,
  TypeLayerEntryConfig,
  TypeSourceImageEsriInitialConfig,
  TypeGeoviewLayerConfig,
} from '../../../map/map-schema-types';

export interface TypeEsriDynamicLayerEntryConfig extends Omit<TypeImageLayerEntryConfig, 'source'> {
  source: TypeSourceImageEsriInitialConfig;
}

export interface TypeEsriDynamicLayerConfig extends Omit<TypeGeoviewLayerConfig, 'listOfLayerEntryConfig'> {
  geoviewLayerType: 'esriDynamic';
  listOfLayerEntryConfig: TypeEsriDynamicLayerEntryConfig[];
}

/** ******************************************************************************************************************************
 * Type Gard function that redefines a TypeGeoviewLayerConfig as a TypeEsriDynamicLayerConfig if the geoviewLayerType attribute of
 * the verifyIfLayer parameter is ESRI_DYNAMIC. The type ascention applies only to the true block of the if clause that use
 * this function.
 *
 * @param {TypeGeoviewLayerConfig} verifyIfLayer Polymorphic object to test in order to determine if the type ascention is valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const layerConfigIsEsriDynamic = (verifyIfLayer: TypeGeoviewLayerConfig): verifyIfLayer is TypeEsriDynamicLayerConfig => {
  return verifyIfLayer.geoviewLayerType === CONST_LAYER_TYPES.ESRI_DYNAMIC;
};

/** ******************************************************************************************************************************
 * Type Gard function that redefines an AbstractGeoViewLayer as an EsriDynamic if the type attribute of the verifyIfGeoViewLayer
 * parameter is ESRI_DYNAMIC. The type ascention applies only to the true block of the if clause that use this function.
 *
 * @param {AbstractGeoViewLayer} verifyIfGeoViewLayer Polymorphic object to test in order to determine if the type ascention is
 * valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const geoviewLayerIsEsriDynamic = (verifyIfGeoViewLayer: AbstractGeoViewLayer): verifyIfGeoViewLayer is EsriDynamic => {
  return verifyIfGeoViewLayer.type === CONST_LAYER_TYPES.ESRI_DYNAMIC;
};

/** ******************************************************************************************************************************
 * Type Gard function that redefines a TypeLayerEntryConfig as a TypeEsriDynamicLayerEntryConfig if the geoviewLayerType attribute
 * of the verifyIfGeoViewEntry.geoviewRootLayer attribute is ESRI_DYNAMIC. The type ascention applies only to the true block of
 * the if clause that use this function.
 *
 * @param {TypeLayerEntryConfig} verifyIfGeoViewEntry Polymorphic object to test in order to determine if the type ascention is
 * valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const geoviewEntryIsEsriDynamic = (
  verifyIfGeoViewEntry: TypeLayerEntryConfig
): verifyIfGeoViewEntry is TypeEsriDynamicLayerEntryConfig => {
  return verifyIfGeoViewEntry.geoviewRootLayer!.geoviewLayerType === CONST_LAYER_TYPES.ESRI_DYNAMIC;
};

// ******************************************************************************************************************************
// ******************************************************************************************************************************
/** ******************************************************************************************************************************
 * A class to add esri dynamic layer.
 *
 * @exports
 * @class EsriDynamic
 */
// ******************************************************************************************************************************
export class EsriDynamic extends AbstractGeoViewRaster {
  /** Service metadata */
  metadata: TypeJsonObject = {};

  /** ****************************************************************************************************************************
   * Initialize layer.
   * @param {string} mapId The id of the map.
   * @param {TypeEsriDynamicLayerConfig} layerConfig The layer configuration.
   */
  constructor(mapId: string, layerConfig: TypeEsriDynamicLayerConfig) {
    super(CONST_LAYER_TYPES.ESRI_DYNAMIC, layerConfig, mapId);
  }

  /** ****************************************************************************************************************************
   * This method reads from the metadataAccessPath additional information to complete the GeoView layer configuration.
   */
  getAdditionalServiceDefinition(): Promise<void> {
    const promisedExecution = new Promise<void>((resolve) => {
      const data = getXMLHttpRequest(`${getLocalizedValue(this.metadataAccessPath, this.mapId)}?f=json`);
      data.then((value) => {
        if (value !== '{}') {
          this.metadata = JSON.parse(value) as TypeJsonObject;
        }
        resolve();
      });
    });
    return promisedExecution;
  }

  /** ****************************************************************************************************************************
   * This method creates a GeoView EsriDynamic layer using the definition provided in the layerEntryConfig parameter.
   *
   * @param {TypeEsriDynamicLayerEntryConfig} layerEntryConfig Information needed to create the GeoView layer.
   *
   * @returns {TypeBaseRasterLayer} The GeoView raster layer that has been created.
   */
  processOneLayerEntry(layerEntryConfig: TypeEsriDynamicLayerEntryConfig): Promise<TypeBaseRasterLayer | null> {
    const promisedVectorLayer = new Promise<TypeBaseRasterLayer | null>((resolve) => {
      const sourceOptions: SourceOptions = {};
      sourceOptions.attributions = [(this.metadata.copyrightText ? this.metadata.copyrightText : '') as string];
      sourceOptions.url = getLocalizedValue(layerEntryConfig.source.dataAccessPath!, this.mapId);
      sourceOptions.params = { LAYERS: `show:${[Number(layerEntryConfig.layerId)]}` };
      if (layerEntryConfig.source.transparent)
        Object.defineProperty(sourceOptions.params, 'transparent', layerEntryConfig.source.transparent!);
      if (layerEntryConfig.source.format) Object.defineProperty(sourceOptions.params, 'format', layerEntryConfig.source.format!);
      if (layerEntryConfig.source.crossOrigin) sourceOptions.crossOrigin = layerEntryConfig.source.crossOrigin;
      if (layerEntryConfig.source.projection) sourceOptions.projection = `EPSG:${layerEntryConfig.source.projection}`;

      const imageLayerOptions: ImageOptions<ImageArcGISRest> = {
        source: new ImageArcGISRest(sourceOptions),
        properties: { layerEntryConfig },
      };
      if (layerEntryConfig.initialSettings?.className) imageLayerOptions.className = layerEntryConfig.initialSettings?.className;
      if (layerEntryConfig.initialSettings?.extent) imageLayerOptions.extent = layerEntryConfig.initialSettings?.extent;
      if (layerEntryConfig.initialSettings?.maxZoom) imageLayerOptions.maxZoom = layerEntryConfig.initialSettings?.maxZoom;
      if (layerEntryConfig.initialSettings?.minZoom) imageLayerOptions.minZoom = layerEntryConfig.initialSettings?.minZoom;
      if (layerEntryConfig.initialSettings?.opacity) imageLayerOptions.opacity = layerEntryConfig.initialSettings?.opacity;
      if (layerEntryConfig.initialSettings?.visible) imageLayerOptions.visible = layerEntryConfig.initialSettings?.visible;

      const esriLayer = new ImageLayer(imageLayerOptions);

      resolve(esriLayer);
    });
    return promisedVectorLayer;
  }

  /**
   * This method associate a renderer to the GeoView layer.
   *
   * @param {TypeBaseRasterLayer} rasterLayer The GeoView layer associated to the renderer.
   */
  processLayerMetadata(rasterLayer: TypeBaseRasterLayer): void {
    // eslint-disable-next-line no-console
    console.log('EsriDynamic.processLayerMetadata: This method needs to be coded!', rasterLayer);
  }

  /**
   * This method register the GeoView layer to panels that offer this possibility.
   *
   * @param {TypeBaseRasterLayer} rasterLayer The GeoView layer who wants to register.
   */
  registerToPanels(rasterLayer: TypeBaseRasterLayer): void {
    // eslint-disable-next-line no-console
    console.log('EsriDynamic.registerToPanels: This method needs to be coded!', rasterLayer);
  }
}
