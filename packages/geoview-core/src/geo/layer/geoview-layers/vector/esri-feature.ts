/* eslint-disable no-param-reassign */
import axios from 'axios';

import { Icon as StyleIcon } from 'ol/style';

import { toJsonObject, TypeJsonArray, TypeJsonObject } from '../../../../core/types/global-types';
import { AbstractGeoViewLayer, CONST_LAYER_TYPES } from '../abstract-geoview-layers';
import { AbstractGeoViewVector, TypeBaseVectorLayer } from './abstract-geoview-vector';
import {
  TypeLayerEntryConfig,
  TypeVectorLayerEntryConfig,
  TypeVectorSourceInitialConfig,
  TypeGeoviewLayerConfig,
  TypeUniqueValueStyleInfo,
  TypeIconSymbolVectorConfig,
} from '../../../map/map-schema-types';

import { getLocalizedValue, getXMLHttpRequest } from '../../../../core/utils/utilities';
import { blueCircleIcon } from '../../../../core/types/marker-definitions';

export interface TypeSourceEsriFeatureInitialConfig extends Omit<TypeVectorSourceInitialConfig, 'format'> {
  format: 'EsriJSON';
}

export interface TypeEsriFeatureLayerEntryConfig extends Omit<TypeVectorLayerEntryConfig, 'source'> {
  source: TypeSourceEsriFeatureInitialConfig;
}

export interface TypeEsriFeatureLayerConfig extends Omit<TypeGeoviewLayerConfig, 'listOfLayerEntryConfig'> {
  geoviewLayerType: 'esriFeature';
  listOfLayerEntryConfig: TypeEsriFeatureLayerEntryConfig[];
}

/** *****************************************************************************************************************************
 * Type Gard function that redefines a TypeGeoviewLayerConfig as a TypeEsriFeatureLayerConfig if the geoviewLayerType attribute
 * of the verifyIfLayer parameter is ESRI_FEATURE. The type ascention applies only to the true block of the if clause that use
 * this function.
 *
 * @param {TypeGeoviewLayerConfig} verifyIfLayer Polymorphic object to test in order to determine if the type ascention is valid
 *
 * @return {boolean} true if the type ascention is valid
 */
export const layerConfigIsEsriFeature = (verifyIfLayer: TypeGeoviewLayerConfig): verifyIfLayer is TypeEsriFeatureLayerConfig => {
  return verifyIfLayer.geoviewLayerType === CONST_LAYER_TYPES.ESRI_FEATURE;
};

/** *****************************************************************************************************************************
 * Type Gard function that redefines an AbstractGeoViewLayer as an EsriFeature if the type attribute of the verifyIfGeoViewLayer
 * parameter is ESRI_FEATURE. The type ascention applies only to the true block of the if clause that use this function.
 *
 * @param {AbstractGeoViewLayer} verifyIfGeoViewLayer Polymorphic object to test in order to determine if the type ascention
 * is valid
 *
 * @return {boolean} true if the type ascention is valid
 */
export const geoviewLayerIsEsriFeature = (verifyIfGeoViewLayer: AbstractGeoViewLayer): verifyIfGeoViewLayer is EsriFeature => {
  return verifyIfGeoViewLayer.type === CONST_LAYER_TYPES.ESRI_FEATURE;
};

/** *****************************************************************************************************************************
 * Type Gard function that redefines a TypeLayerEntryConfig as a TypeEsriFeatureLayerEntryConfig if the geoviewLayerType
 * attribute of the verifyIfGeoViewEntry.geoviewRootLayer attribute is ESRI_FEATURE. The type ascention applies only to the true
 * block of the if clause that use this function.
 *
 * @param {TypeLayerEntryConfig} verifyIfGeoViewEntry Polymorphic object to test in order to determine if the type ascention
 * is valid
 *
 * @return {boolean} true if the type ascention is valid
 */
export const geoviewEntryIsEsriFeature = (
  verifyIfGeoViewEntry: TypeLayerEntryConfig
): verifyIfGeoViewEntry is TypeEsriFeatureLayerEntryConfig => {
  return verifyIfGeoViewEntry.geoviewRootLayer!.geoviewLayerType === CONST_LAYER_TYPES.ESRI_FEATURE;
};

// ******************************************************************************************************************************
// ******************************************************************************************************************************
/** *****************************************************************************************************************************
 * A class to add esri feature layer.
 *
 * @exports
 * @class EsriFeature
 */
// ******************************************************************************************************************************
export class EsriFeature extends AbstractGeoViewVector {
  // The service capabilities.
  metadata: TypeJsonObject | null = null;

  // define a default blue icon
  iconSymbols: { field: string | null; valueAndSymbol: Record<string, StyleIcon> } = {
    field: null,
    valueAndSymbol: { default: blueCircleIcon },
  };

  attribution = '';

  isFeatureLayer = true;

  /** ***************************************************************************************************************************
   * Initialize layer.
   *
   * @param {string} mapId The id of the map.
   * @param {TypeFeatureLayer} layerConfig The layer configuration.
   */
  constructor(mapId: string, layerConfig: TypeEsriFeatureLayerConfig) {
    super(CONST_LAYER_TYPES.ESRI_FEATURE, layerConfig, mapId);
  }

  /** ***************************************************************************************************************************
   * This method reads from the metadataAccessPath additional information to complete the GeoView layer configuration.
   */
  getAdditionalServiceDefinition(): Promise<void> {
    const promisedExecution = new Promise<void>((resolve) => {
      this.getCapabilities().then(() => {
        if (this.metadata) {
          // if layerEntry.layerId is not defined, use the dataAccessPath ending as value for layerEntry.layerId.
          this.listOfLayerEntryConfig.forEach((layerEntry) => {
            const esriIndex = Number(layerEntry.layerId);
            if (!layerEntry.layerName) {
              layerEntry.layerName = {
                en: this.metadata!.layers[esriIndex].name as string,
                fr: this.metadata!.layers[esriIndex].name as string,
              };
            }
            this.getDrawingInfo(esriIndex, layerEntry as TypeVectorLayerEntryConfig);
          });
        }
        resolve();
      });
    });
    return promisedExecution;
  }

  /** ***************************************************************************************************************************
   * This method reads the service metadata from the metadataAccessPath.
   */
  private async getCapabilities(): Promise<void> {
    const promisedExecution = new Promise<void>((resolve) => {
      const capabilitiesUrl = `${getLocalizedValue(this.metadataAccessPath, this.mapId)}?f=json`;
      const promisedCapabilitiesString = getXMLHttpRequest(capabilitiesUrl);
      promisedCapabilitiesString.then((capabilitiesString) => {
        if (capabilitiesString !== '{}') {
          this.metadata = toJsonObject(JSON.parse(capabilitiesString));
          const { type, copyrightText } = this.metadata;
          this.attribution = copyrightText ? (copyrightText as string) : '';
          // check if the type is define as Feature Layer.
          this.isFeatureLayer = type && type === 'Feature Layer';
          resolve();
        }
      });
    });
    return promisedExecution;
  }

  /** ***************************************************************************************************************************
   * This method reads the service metadata from the metadataAccessPath.
   */
  private async getDrawingInfo(esriIndex: number, layerEntry: TypeVectorLayerEntryConfig): Promise<void> {
    if (!layerEntry.style) {
      let queryUrl = getLocalizedValue(this.metadataAccessPath, this.mapId);
      queryUrl = queryUrl!.endsWith('/') ? `${queryUrl}${esriIndex}?f=pjson` : `${queryUrl}/${esriIndex}?f=pjson`;

      const queryResult = (await axios.get<TypeJsonObject>(queryUrl)).data;

      const renderer = queryResult.drawingInfo?.renderer;
      if (renderer) {
        if (renderer.type === 'uniqueValue') {
          const id = `${esriIndex}`;
          const styleType = 'uniqueValue';
          const label = renderer.defaultLabel ? (renderer.defaultLabel as string) : '';
          const fields = [renderer.field1 as string];
          if (renderer.field2) fields.push(renderer.field2 as string);
          if (renderer.field3) fields.push(renderer.field3 as string);
          const uniqueValueStyleInfo: TypeUniqueValueStyleInfo[] = [];
          (renderer.uniqueValueInfos as TypeJsonArray).forEach((symbolInfo) => {
            const options: TypeIconSymbolVectorConfig = {
              src: `data:${symbolInfo.symbol.contentType};base64,${symbolInfo.symbol.imageData}`,
              height: symbolInfo.symbol.height as number,
              width: symbolInfo.symbol.width as number,
              rotation: ((symbolInfo.symbol.angle as number) * Math.PI) / 180.0, // convert to radians
              opacity: 1,
            };
            uniqueValueStyleInfo.push({
              label: symbolInfo.label as string,
              values: (symbolInfo.value as string).split(renderer.fieldDelimiter as string),
              options,
            });
          });
          layerEntry.style = { id, styleType, label, fields, uniqueValueStyleInfo };
        } else if (renderer.symbol) {
          const symbolInfo = renderer.symbol;
          this.iconSymbols.valueAndSymbol.default = new StyleIcon({
            src: `data:${symbolInfo.contentType};base64,${symbolInfo.imageData}`,
            scale: (symbolInfo.height as number) / (symbolInfo.width as number),
          });
        }
      }
    }
  }

  /** ***************************************************************************************************************************
   * This method associate a renderer to the GeoView layer.
   *
   * @param {TypeBaseVectorLayer} rasterLayer The GeoView layer associated to the renderer.
   */
  setRenderer(rasterLayer: TypeBaseVectorLayer): void {
    // eslint-disable-next-line no-console
    console.log('This method needs to be coded!', rasterLayer);
  }

  /** ***************************************************************************************************************************
   * This method register the GeoView layer to panels that offer this possibility.
   *
   * @param {TypeBaseVectorLayer} rasterLayer The GeoView layer who wants to register.
   */
  registerToPanels(rasterLayer: TypeBaseVectorLayer): void {
    // eslint-disable-next-line no-console
    console.log('This method needs to be coded!', rasterLayer);
  }
}
