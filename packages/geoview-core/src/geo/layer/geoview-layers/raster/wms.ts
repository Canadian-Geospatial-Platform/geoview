/* eslint-disable @typescript-eslint/no-inferrable-types */
// import axios from 'axios';

import ImageLayer from 'ol/layer/Image';
import { Options as ImageOptions } from 'ol/layer/BaseImage';
import { ImageWMS } from 'ol/source';
import { Options as SourceOptions } from 'ol/source/ImageWMS';
import WMSCapabilities from 'ol/format/WMSCapabilities';

import { TypeJsonObject } from '../../../../core/types/global-types';
import { AbstractGeoViewLayer, CONST_LAYER_TYPES } from '../abstract-geoview-layers';
import { AbstractGeoViewRaster, TypeBaseRasterLayer } from './abstract-geoview-raster';
import {
  TypeImageLayerEntryConfig,
  TypeLayerEntryConfig,
  TypeSourceImageWmsInitialConfig,
  TypeGeoviewLayerConfig,
} from '../../../map/map-schema-types';
import { getLocalisezValue } from '../../../../core/utils/utilities';
import { snackbarMessagePayload } from '../../../../api/events/payloads/snackbar-message-payload';
import { EVENT_NAMES } from '../../../../api/events/event-types';
import { api } from '../../../../app';

export interface TypeWmsLayerEntryConfig extends Omit<TypeImageLayerEntryConfig, 'source'> {
  source: TypeSourceImageWmsInitialConfig;
}

export interface TypeWMSLayerConfig extends Omit<TypeGeoviewLayerConfig, 'listOfLayerEntryConfig' | 'geoviewLayerType'> {
  geoviewLayerType: 'ogcWms';
  listOfLayerEntryConfig: TypeWmsLayerEntryConfig[];
}

/** *****************************************************************************************************************************
 * Type Gard function that redefines a TypeGeoviewLayerConfig as a TypeWMSLayerConfig if the geoviewLayerType attribute of the
 * verifyIfLayer parameter is WMS. The type ascention applies only to the true block of the if clause that use this function.
 *
 * @param {TypeGeoviewLayerConfig} verifyIfLayer Polymorphic object to test in order to determine if the type ascention is valid
 *
 * @return {boolean} true if the type ascention is valid
 */
export const layerConfigIsWMS = (verifyIfLayer: TypeGeoviewLayerConfig): verifyIfLayer is TypeWMSLayerConfig => {
  return verifyIfLayer.geoviewLayerType === CONST_LAYER_TYPES.WMS;
};

/** *****************************************************************************************************************************
 * Type Gard function that redefines an AbstractGeoViewLayer as a WMS if the type attribute of the verifyIfGeoViewLayer
 * parameter is WMS. The type ascention applies only to the true block of the if clause that use this function.
 *
 * @param {AbstractGeoViewLayer} verifyIfGeoViewLayer Polymorphic object to test in order to determine if the type ascention is valid
 *
 * @return {boolean} true if the type ascention is valid
 */
export const geoviewLayerIsWMS = (verifyIfGeoViewLayer: AbstractGeoViewLayer): verifyIfGeoViewLayer is WMS => {
  return verifyIfGeoViewLayer.type === CONST_LAYER_TYPES.WMS;
};

/** *****************************************************************************************************************************
 * Type Gard function that redefines a TypeLayerEntryConfig as a TypeWmsLayerEntryConfig if the geoviewLayerType attribute of the
 * verifyIfGeoViewEntry.geoviewLayerParent attribute is WMS. The type ascention applies only to the true block of
 * the if clause that use this function.
 *
 * @param {TypeLayerEntryConfig} verifyIfGeoViewEntry Polymorphic object to test in order to determine if the type ascention is valid
 *
 * @return {boolean} true if the type ascention is valid
 */
export const geoviewEntryIsWMS = (verifyIfGeoViewEntry: TypeLayerEntryConfig): verifyIfGeoViewEntry is TypeWmsLayerEntryConfig => {
  return verifyIfGeoViewEntry.geoviewLayerParent!.geoviewLayerType === CONST_LAYER_TYPES.WMS;
};

// ******************************************************************************************************************************
// ******************************************************************************************************************************
/** *****************************************************************************************************************************
 * A class to add wms layer.
 *
 * @exports
 * @class WMS
 */
// ******************************************************************************************************************************
export class WMS extends AbstractGeoViewRaster {
  // private varibale holding wms capabilities
  private capabilities: TypeJsonObject = {};

  // private varibale holding wms capabilities
  private attributions: string[] = [];

  /** ***************************************************************************************************************************
   * Initialize layer
   * @param {string} mapId the id of the map
   * @param {TypeWMSLayerConfig} layerConfig the layer configuration
   */
  constructor(mapId: string, layerConfig: TypeWMSLayerConfig) {
    super(CONST_LAYER_TYPES.WMS, layerConfig, mapId);
  }

  /** ****************************************************************************************************************************
   * This method reads from the metadataAccessPath additional information to complete the GeoView layer configuration.
   */
  getAdditionalServiceDefinition(): Promise<void> {
    const promisedExecution = new Promise<void>((resolve) => {
      const parser = new WMSCapabilities();
      const getCapabilitiesUrl = `${getLocalisezValue(
        this.metadataAccessPath,
        this.mapId
      )}?service=WMS&version=1.3.0&request=GetCapabilities`;
      fetch(getCapabilitiesUrl).then((response) => {
        response.text().then((capabilitiesString) => {
          this.capabilities = parser.read(capabilitiesString);
          if (this.capabilities?.Service?.Abstract) this.attributions.push(this.capabilities.Service.Abstract as string);
          resolve();
        });
      });
    });
    return promisedExecution;
  }

  /** ****************************************************************************************************************************
   * This method creates a GeoView WMS layer using the definition provided in the layerEntry parameter.
   *
   * @param {TypeWmsLayerEntryConfig} layerEntry Information needed to create the GeoView layer.
   *
   * @returns {TypeBaseRasterLayer} The GeoView raster layer that has been created.
   */
  processOneLayerEntry(layerEntryConfig: TypeWmsLayerEntryConfig): Promise<TypeBaseRasterLayer | null> {
    const promisedVectorLayer = new Promise<TypeBaseRasterLayer | null>((resolve) => {
      const layerCapabilities = this.findLayerCapabilities(layerEntryConfig.info!.layerId, this.capabilities.Capability.Layer);
      if (layerCapabilities) {
        const dataAccessPath = getLocalisezValue(layerEntryConfig.source.dataAccessPath, this.mapId)!;
        const sourceOptions: SourceOptions = {
          url: dataAccessPath.endsWith('?') ? dataAccessPath : `${dataAccessPath}?`,
          params: { LAYERS: layerEntryConfig.info!.layerId },
        };
        sourceOptions.attributions = this.attributions;
        sourceOptions.serverType = layerEntryConfig.source.serverType;
        if (layerEntryConfig.source.crossOrigin) sourceOptions.crossOrigin = layerEntryConfig.source.crossOrigin;
        if (layerEntryConfig.source.projection) sourceOptions.projection = `EPSG:${layerEntryConfig.source.projection}`;

        const imageLayerOptions: ImageOptions<ImageWMS> = {
          source: new ImageWMS(sourceOptions),
          properties: { layerCapabilities, layerEntryConfig },
        };
        if (layerEntryConfig.initialSettings?.className) imageLayerOptions.className = layerEntryConfig.initialSettings?.className;
        if (layerEntryConfig.initialSettings?.extent) imageLayerOptions.extent = layerEntryConfig.initialSettings?.extent;
        if (layerEntryConfig.initialSettings?.maxZoom) imageLayerOptions.maxZoom = layerEntryConfig.initialSettings?.maxZoom;
        if (layerEntryConfig.initialSettings?.minZoom) imageLayerOptions.minZoom = layerEntryConfig.initialSettings?.minZoom;
        if (layerEntryConfig.initialSettings?.opacity) imageLayerOptions.opacity = layerEntryConfig.initialSettings?.opacity;
        if (layerEntryConfig.initialSettings?.visible) imageLayerOptions.visible = layerEntryConfig.initialSettings?.visible;

        resolve(new ImageLayer(imageLayerOptions));
      } else {
        api.event.emit(
          snackbarMessagePayload(EVENT_NAMES.SNACKBAR.EVENT_SNACKBAR_OPEN, this.mapId, {
            type: 'key',
            value: 'validation.layer.notfound',
            params: [layerEntryConfig.info!.layerId, this.id],
          })
        );
        resolve(null);
      }
    });
    return promisedVectorLayer;
  }

  /**
   * This method search recursively the layerId in the layer entry of the capabilities.
   *
   * @param {string} layerId The layer identifier that must exists on the server.
   * @param {TypeJsonObject} layerFromCapabilities The layer entry found in the capabilities.
   */
  findLayerCapabilities(layerId: string, layerFromCapabilities: TypeJsonObject): TypeJsonObject | null {
    if (!layerId) return null;
    if (Array.isArray(layerFromCapabilities)) {
      for (let i = 0; i < layerFromCapabilities.length; i++) {
        if (layerFromCapabilities[i]?.Name === layerId) return layerFromCapabilities[i];
      }
      for (let i = 0; i < layerFromCapabilities.length; i++) {
        if (layerFromCapabilities[i]?.Layer) {
          const layerFound = this.findLayerCapabilities(layerId, layerFromCapabilities[i]?.Layer);
          if (layerFound) return layerFound;
        }
      }
    } else {
      if (layerFromCapabilities?.Name === layerId) return layerFromCapabilities;
      if (layerFromCapabilities?.Layer) {
        const layerFound = this.findLayerCapabilities(layerId, layerFromCapabilities?.Layer);
        if (layerFound) return layerFound;
      }
    }
    return null;
  }

  /**
   * This method associate a renderer to the GeoView layer.
   *
   * @param {TypeBaseRasterLayer} rasterLayer The GeoView layer associated to the renderer.
   */
  setRenderer(rasterLayer: TypeBaseRasterLayer): void {
    // eslint-disable-next-line no-console
    console.log('This method needs to be coded!', rasterLayer);
  }

  /**
   * This method register the GeoView layer to panels that offer this possibility.
   *
   * @param {TypeBaseRasterLayer} rasterLayer The GeoView layer who wants to register.
   */
  registerToPanels(rasterLayer: TypeBaseRasterLayer): void {
    // eslint-disable-next-line no-console
    console.log('This method needs to be coded!', rasterLayer);
  }
}
