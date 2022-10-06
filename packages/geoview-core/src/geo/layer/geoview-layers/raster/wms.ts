/* eslint-disable @typescript-eslint/no-inferrable-types */
import ImageLayer from 'ol/layer/Image';
import { Coordinate } from 'ol/coordinate';
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
  TypeListOfLayerEntryConfig,
  TypeBaseLayerEntryConfig,
} from '../../../map/map-schema-types';
import { TypeFeatureInfoResult } from '../../../../api/events/payloads/get-feature-info-payload';
import { getLocalizedValue } from '../../../../core/utils/utilities';
import { snackbarMessagePayload } from '../../../../api/events/payloads/snackbar-message-payload';
import { EVENT_NAMES } from '../../../../api/events/event-types';
import { api } from '../../../../app';

export interface TypeWmsLayerEntryConfig extends Omit<TypeImageLayerEntryConfig, 'source'> {
  source: TypeSourceImageWmsInitialConfig;
}

export interface TypeWMSLayerConfig extends Omit<TypeGeoviewLayerConfig, 'listOfLayerEntryConfig'> {
  geoviewLayerType: 'ogcWms';
  listOfLayerEntryConfig: TypeWmsLayerEntryConfig[];
}

/** *****************************************************************************************************************************
 * Type Gard function that redefines a TypeGeoviewLayerConfig as a TypeWMSLayerConfig if the geoviewLayerType attribute of the
 * verifyIfLayer parameter is WMS. The type ascention applies only to the true block of the if clause that use this function.
 *
 * @param {TypeGeoviewLayerConfig} verifyIfLayer Polymorphic object to test in order to determine if the type ascention is valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const layerConfigIsWMS = (verifyIfLayer: TypeGeoviewLayerConfig): verifyIfLayer is TypeWMSLayerConfig => {
  return verifyIfLayer.geoviewLayerType === CONST_LAYER_TYPES.WMS;
};

/** *****************************************************************************************************************************
 * Type Gard function that redefines an AbstractGeoViewLayer as a WMS if the type attribute of the verifyIfGeoViewLayer
 * parameter is WMS. The type ascention applies only to the true block of the if clause that use this function.
 *
 * @param {AbstractGeoViewLayer} verifyIfGeoViewLayer Polymorphic object to test in order to determine if the type ascention is
 * valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const geoviewLayerIsWMS = (verifyIfGeoViewLayer: AbstractGeoViewLayer): verifyIfGeoViewLayer is WMS => {
  return verifyIfGeoViewLayer.type === CONST_LAYER_TYPES.WMS;
};

/** *****************************************************************************************************************************
 * Type Gard function that redefines a TypeLayerEntryConfig as a TypeWmsLayerEntryConfig if the geoviewLayerType attribute of the
 * verifyIfGeoViewEntry.geoviewRootLayer attribute is WMS. The type ascention applies only to the true block of
 * the if clause that use this function.
 *
 * @param {TypeLayerEntryConfig} verifyIfGeoViewEntry Polymorphic object to test in order to determine if the type ascention is
 * valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const geoviewEntryIsWMS = (verifyIfGeoViewEntry: TypeLayerEntryConfig): verifyIfGeoViewEntry is TypeWmsLayerEntryConfig => {
  return verifyIfGeoViewEntry.geoviewRootLayer!.geoviewLayerType === CONST_LAYER_TYPES.WMS;
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
  /** ***************************************************************************************************************************
   * Initialize layer
   * @param {string} mapId the id of the map
   * @param {TypeWMSLayerConfig} layerConfig the layer configuration
   */
  constructor(mapId: string, layerConfig: TypeWMSLayerConfig) {
    super(CONST_LAYER_TYPES.WMS, layerConfig, mapId);
  }

  /** ***************************************************************************************************************************
   * This method reads the service metadata from the metadataAccessPath.
   *
   * @returns {Promise<void>} A promise that the execution is completed.
   */
  protected getServiceMetadata(): Promise<void> {
    const promisedExecution = new Promise<void>((resolve) => {
      const parser = new WMSCapabilities();
      let metadataUrl = getLocalizedValue(this.metadataAccessPath, this.mapId);
      if (metadataUrl) {
        metadataUrl = `${metadataUrl}?service=WMS&version=1.3.0&request=GetCapabilities`;
        fetch(metadataUrl).then((response) => {
          response.text().then((capabilitiesString) => {
            this.metadata = parser.read(capabilitiesString);
            if (this.metadata?.Service?.Abstract) this.attributions.push(this.metadata.Service.Abstract as string);
            resolve();
          });
        });
      } else throw new Error(`Cant't read service metadata for layer ${this.layerId} of map ${this.mapId}.`);
    });
    return promisedExecution;
  }

  /** ***************************************************************************************************************************
   * This method recursively validates the configuration of the layer entries to ensure that each layer is correctly defined.
   *
   * @param {TypeListOfLayerEntryConfig} listOfLayerEntryConfig The list of layer entries configuration to validate.
   *
   * @returns {TypeListOfLayerEntryConfig} A new layer configuration list with layers in error removed.
   */
  protected validateListOfLayerEntryConfig(listOfLayerEntryConfig: TypeListOfLayerEntryConfig): TypeListOfLayerEntryConfig {
    return listOfLayerEntryConfig;
  }

  /** ***************************************************************************************************************************
   * This method processes recursively the metadata of each layer in the list of layer configuration.
   *
   *  @param {TypeListOfLayerEntryConfig} listOfLayerEntryConfig The list of layers to process.
   *
   * @returns {Promise<void>} A promise that the execution is completed.
   */
  protected processListOfLayerEntryMetadata(listOfLayerEntryConfig: TypeListOfLayerEntryConfig): Promise<void> {
    const promisedExecution = new Promise<void>((resolve) => {
      // eslint-disable-next-line no-console
      console.log('WMS.processListOfLayerEntryMetadata: The method needs to be coded!', listOfLayerEntryConfig);
      resolve();
    });
    return promisedExecution;
  }

  /** ****************************************************************************************************************************
   * This method creates a GeoView WMS layer using the definition provided in the layerEntryConfig parameter.
   *
   * @param {TypeWmsLayerEntryConfig} layerEntryConfig Information needed to create the GeoView layer.
   *
   * @returns {TypeBaseRasterLayer} The GeoView raster layer that has been created.
   */
  processOneLayerEntry(layerEntryConfig: TypeWmsLayerEntryConfig): Promise<TypeBaseRasterLayer | null> {
    const promisedVectorLayer = new Promise<TypeBaseRasterLayer | null>((resolve) => {
      const layerCapabilities = this.findLayerCapabilities(layerEntryConfig.layerId, this.metadata!.Capability.Layer);
      if (layerCapabilities) {
        const dataAccessPath = getLocalizedValue(layerEntryConfig.source.dataAccessPath!, this.mapId)!;
        const sourceOptions: SourceOptions = {
          url: dataAccessPath.endsWith('?') ? dataAccessPath : `${dataAccessPath}?`,
          params: { LAYERS: layerEntryConfig.layerId },
        };
        sourceOptions.attributions = this.attributions;
        sourceOptions.serverType = layerEntryConfig.source.serverType;
        if (layerEntryConfig.source.crossOrigin) sourceOptions.crossOrigin = layerEntryConfig.source.crossOrigin;
        if (layerEntryConfig.source.projection) sourceOptions.projection = `EPSG:${layerEntryConfig.source.projection}`;

        const imageLayerOptions: ImageOptions<ImageWMS> = {
          source: new ImageWMS(sourceOptions),
          properties: { layerCapabilities, layerEntryConfig },
        };
        if (!layerEntryConfig.initialSettings && layerEntryConfig.geoviewRootLayer?.initialSettings)
          // eslint-disable-next-line no-param-reassign
          layerEntryConfig.initialSettings = layerEntryConfig.geoviewRootLayer?.initialSettings;
        if (layerEntryConfig.initialSettings?.className !== undefined)
          imageLayerOptions.className = layerEntryConfig.initialSettings?.className;
        if (layerEntryConfig.initialSettings?.extent !== undefined) imageLayerOptions.extent = layerEntryConfig.initialSettings?.extent;
        if (layerEntryConfig.initialSettings?.maxZoom !== undefined) imageLayerOptions.maxZoom = layerEntryConfig.initialSettings?.maxZoom;
        if (layerEntryConfig.initialSettings?.minZoom !== undefined) imageLayerOptions.minZoom = layerEntryConfig.initialSettings?.minZoom;
        if (layerEntryConfig.initialSettings?.opacity !== undefined) imageLayerOptions.opacity = layerEntryConfig.initialSettings?.opacity;
        if (layerEntryConfig.initialSettings?.visible !== undefined) imageLayerOptions.visible = layerEntryConfig.initialSettings?.visible;

        resolve(new ImageLayer(imageLayerOptions));
      } else {
        api.event.emit(
          snackbarMessagePayload(EVENT_NAMES.SNACKBAR.EVENT_SNACKBAR_OPEN, this.mapId, {
            type: 'key',
            value: 'validation.layer.notfound',
            params: [layerEntryConfig.layerId, this.layerId],
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

  /** ***************************************************************************************************************************
   * This method is used to process the layer's metadata. It will fill the empty fields of the layer's configuration (renderer,
   * initial settings, fields and aliases).
   *
   * @param {TypeBaseLayerEntryConfig} layerEntryConfig The layer entry configuration to process.
   *
   * @returns {Promise<void>} A promise that the layer configuration has its metadata processed.
   */
  protected processLayerMetadata(layerEntryConfig: TypeBaseLayerEntryConfig): Promise<void> {
    const promiseOfExecution = new Promise<void>((resolve) => {
      // eslint-disable-next-line no-console
      console.log('WMS.processLayerMetadata: The method needs to be coded!', layerEntryConfig);
      resolve();
    });
    return promiseOfExecution;
  }

  /** ***************************************************************************************************************************
   * Return feature information for all the features around the provided coordinate.
   *
   * @param {Coordinate} lnglat The coordinate that will be used by the query.
   * @param {string} layerId Optional layer identifier. If undefined, this.activeLayer is used.
   *
   * @returns {Promise<TypeFeatureInfoResult>} The promised feature info table.
   */
  protected getFeatureInfoAtCoordinate(lnglat: Coordinate, layerId?: string): Promise<TypeFeatureInfoResult> {
    const promisedQueryResult = new Promise<TypeFeatureInfoResult>((resolve) => {
      // eslint-disable-next-line no-console
      console.log('WMS.getFeatureInfoAtCoordinate: The method needs to be coded!', lnglat, layerId);
      resolve(null);
    });
    return promisedQueryResult;
  }
}
