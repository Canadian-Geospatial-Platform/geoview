/* eslint-disable @typescript-eslint/no-inferrable-types */
// import axios from 'axios';

import ImageLayer from 'ol/layer/Image';
import { Options as ImageOptions } from 'ol/layer/BaseImage';
import { ImageWMS } from 'ol/source';
import { Options as SourceOptions } from 'ol/source/ImageWMS';
import WMSCapabilities from 'ol/format/WMSCapabilities';

import {
  CONST_LAYER_TYPES,
  AbstractGeoViewLayer,
  TypeJsonObject,
  TypeGeoviewLayerConfig,
  TypeImageLayerConfig,
  TypeSourceImageWmsInitialConfig,
  TypeLayerConfig,
  TypeBaseRasterLayer,
} from '../../../../core/types/cgpv-types';

import { api } from '../../../../app';

export interface TypeImageWmsLayerConfig extends Omit<TypeImageLayerConfig, 'source'> {
  source: TypeSourceImageWmsInitialConfig;
}

export interface TypeWMSLayerConfig extends Omit<TypeGeoviewLayerConfig, 'layerEntries'> {
  layerEntries?: TypeImageWmsLayerConfig[];
}

/** *****************************************************************************************************************************
 * Type Gard function that redefines a TypeGeoviewLayerConfig as a TypeWMSLayerConfig if the layerType attribute of the
 * verifyIfLayer parameter is WMS. The type ascention applies only to the the true block of the if clause that use this function.
 *
 * @param {TypeGeoviewLayerConfig} polymorphic object to test in order to determine if the type ascention is valid
 *
 * @return {boolean} true if the type ascention is valid
 */
export const layerConfigIsWMS = (verifyIfLayer: TypeGeoviewLayerConfig): verifyIfLayer is TypeWMSLayerConfig => {
  return verifyIfLayer.layerType === CONST_LAYER_TYPES.WMS;
};

/** *****************************************************************************************************************************
 * Type Gard function that redefines an AbstractGeoViewLayer as a WMS if the type attribute of the verifyIfGeoViewLayer
 * parameter is WMS. The type ascention applies only to the the true block of the if clause that use this function.
 *
 * @param {AbstractGeoViewLayer} polymorphic object to test in order to determine if the type ascention is valid
 *
 * @return {boolean} true if the type ascention is valid
 */
export const geoviewLayerIsWMS = (verifyIfGeoViewLayer: AbstractGeoViewLayer): verifyIfGeoViewLayer is WMS => {
  return verifyIfGeoViewLayer.type === CONST_LAYER_TYPES.WMS;
};

/** ******************************************************************************************************************************
 * Type Gard function that redefines a TypeLayerConfig as a TypeImageWmsLayerConfig if the layerType attribute of the
 * verifyIfGeoViewEntry.geoviewLayerParent attribute is WMS. The type ascention applies only to the the true block of
 * the if clause that use this function.
 *
 * @param {TypeLayerConfig} polymorphic object to test in order to determine if the type ascention is valid
 *
 * @return {boolean} true if the type ascention is valid
 */
export const geoviewEntryIsWMS = (verifyIfGeoViewEntry: TypeLayerConfig): verifyIfGeoViewEntry is TypeImageWmsLayerConfig => {
  return verifyIfGeoViewEntry.geoviewLayerParent.layerType === CONST_LAYER_TYPES.WMS;
};

/** *****************************************************************************************************************************
 * A class to add wms layer.
 *
 * @exports
 * @class WMS
 */
export class WMS extends AbstractGeoViewLayer {
  // layer from openlayers
  // layer!: ImageLayer<ImageWMS>;

  // private varibale holding wms capabilities
  private capabilities: TypeJsonObject = {};

  /** ***************************************************************************************************************************
   * Initialize layer
   * @param {string} mapId the id of the map
   * @param {TypeWMSLayerConfig} layerConfig the layer configuration
   */
  constructor(mapId: string, layerConfig: TypeWMSLayerConfig) {
    super(CONST_LAYER_TYPES.WMS, layerConfig, mapId);

    if (this.accessPath.en.indexOf('?') === -1) this.accessPath.en = `${this.accessPath.en}?`;
    if (this.accessPath.fr.indexOf('?') === -1) this.accessPath.fr = `${this.accessPath.fr}?`;
  }

  /** ****************************************************************************************************************************
   * This method reads from the accessPath additional information to complete the GeoView layer configuration.
   */
  getAdditionalServiceDefinition(): void {
    this.getCapabilities().then((capabilities) => {
      this.capabilities = capabilities;
    });
  }

  /** ****************************************************************************************************************************
   * Get capabilities of the current WMS service.
   *
   * @returns {TypeJsonObject} WMS capabilities in json format
   */
  private async getCapabilities(): Promise<TypeJsonObject> {
    const parser = new WMSCapabilities();
    const capUrl = `${this.accessPath[api.map(this.mapId).getLanguageCode()]}service=WMS&version=1.3.0&request=GetCapabilities`;
    const response = await fetch(capUrl);
    const result = parser.read(await response.text());

    this.capabilities = result;

    return result;
  }

  /** ****************************************************************************************************************************
   * This method creates a GeoView WMS layer using the definition provided in the layerEntry parameter.
   *
   * @param {TypeImageWmsLayerConfig} layerEntry Information needed to create the GeoView layer.
   *
   * @returns {TypeBaseRasterLayer} The GeoView raster layer that has been created.
   */
  processOneLayerEntry(layerEntry: TypeImageWmsLayerConfig): TypeBaseRasterLayer {
    const sourceOptions: SourceOptions = {
      url: layerEntry.source.accesPath[api.map(this.mapId).getLanguageCode()],
      params: { LAYERS: `show:${layerEntry.info.layerId}` },
    };
    sourceOptions.attributions = '';
    if (this.capabilities && this.capabilities.Service && this.capabilities.Service.Abstract) {
      sourceOptions.attributions = this.capabilities.Service.Abstract as string;
    }
    if (typeof layerEntry.source.crossOrigin !== undefined) sourceOptions.crossOrigin = layerEntry.source.crossOrigin;
    if (typeof layerEntry.source.projection !== undefined) sourceOptions.projection = `EPSG:${layerEntry.source.projection}`;

    const imageLayerOptions: ImageOptions<ImageWMS> = { source: new ImageWMS(sourceOptions) };
    if (typeof layerEntry.initialSettings?.className !== undefined) imageLayerOptions.className = layerEntry.initialSettings?.className;
    if (typeof layerEntry.initialSettings?.extent !== undefined) imageLayerOptions.extent = layerEntry.initialSettings?.extent;
    if (typeof layerEntry.initialSettings?.maxZoom !== undefined) imageLayerOptions.maxZoom = layerEntry.initialSettings?.maxZoom;
    if (typeof layerEntry.initialSettings?.minZoom !== undefined) imageLayerOptions.minZoom = layerEntry.initialSettings?.minZoom;
    if (typeof layerEntry.initialSettings?.opacity !== undefined) imageLayerOptions.opacity = layerEntry.initialSettings?.opacity;
    if (typeof layerEntry.initialSettings?.visible !== undefined) imageLayerOptions.visible = layerEntry.initialSettings?.visible;

    const wmsLayer = new ImageLayer(imageLayerOptions);

    return wmsLayer;
  }

  /**
   * This method associate a renderer to the GeoView layer.
   *
   * @param {TypeLayerConfig} layerEntry Information needed to create the renderer.
   * @param {TypeBaseRasterLayer} rasterLayer The GeoView layer associated to the renderer.
   */
  setRenderer(layerEntry: TypeLayerConfig, rasterLayer: TypeBaseRasterLayer): void {
    // eslint-disable-next-line no-console
    console.log('This method needs to be coded!');
    // eslint-disable-next-line no-console
    console.log(layerEntry, rasterLayer);
  }

  /**
   * This method register the GeoView layer to panels that offer this possibility.
   *
   * @param {TypeLayerConfig} layerEntry Information needed to create the renderer.
   * @param {TypeBaseRasterLayer} rasterLayer The GeoView layer who wants to register.
   */
  registerToPanels(layerEntry: TypeLayerConfig, rasterLayer: TypeBaseRasterLayer): void {
    // eslint-disable-next-line no-console
    console.log('This method needs to be coded!');
    // eslint-disable-next-line no-console
    console.log(layerEntry, rasterLayer);
  }
}
