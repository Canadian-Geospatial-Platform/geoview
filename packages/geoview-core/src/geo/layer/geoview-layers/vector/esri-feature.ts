import axios from 'axios';

import { Icon as StyleIcon } from 'ol/style';

import { toJsonObject, TypeJsonArray, TypeJsonObject } from '../../../../core/types/global-types';
import { api } from '../../../../app';
import { AbstractGeoViewLayer, CONST_LAYER_TYPES } from '../abstract-geoview-layers';
import { AbstractGeoViewVector, TypeBaseVectorLayer } from './abstract-geoview-vector';
import { TypeLayerEntryConfig, TypeVectorLayerEntryConfig, TypeVectorSourceInitialConfig } from '../schema-types';
import { TypeGeoviewLayerConfig } from '../../../map/map-types';

import { getXMLHttpRequest } from '../../../../core/utils/utilities';
import { blueCircleIcon } from '../../../../core/types/marker-definitions';

export interface TypeSourceEsriFeatureInitialConfig extends Omit<TypeVectorSourceInitialConfig, 'format'> {
  format: 'EsriJSON';
}

export interface TypeEsriFeatureLayerEntryConfig extends Omit<TypeVectorLayerEntryConfig, 'source'> {
  source: TypeSourceEsriFeatureInitialConfig;
}

export interface TypeEsriFeatureLayerConfig extends Omit<TypeGeoviewLayerConfig, 'layerEntries' | 'geoviewLayerType'> {
  geoviewLayerType: 'esriFeature';
  layerEntries?: TypeEsriFeatureLayerEntryConfig[];
}

/** ******************************************************************************************************************************
 * Type Gard function that redefines a TypeGeoviewLayerConfig as a TypeEsriFeatureLayerConfig if the geoviewLayerType attribute of
 * the verifyIfLayer parameter is ESRI_FEATURE. The type ascention applies only to the true block of the if clause that use
 * this function.
 *
 * @param {TypeGeoviewLayerConfig} verifyIfLayer Polymorphic object to test in order to determine if the type ascention is valid
 *
 * @return {boolean} true if the type ascention is valid
 */
export const layerConfigIsEsriFeature = (verifyIfLayer: TypeGeoviewLayerConfig): verifyIfLayer is TypeEsriFeatureLayerConfig => {
  return verifyIfLayer.geoviewLayerType === CONST_LAYER_TYPES.ESRI_FEATURE;
};

/** ******************************************************************************************************************************
 * Type Gard function that redefines an AbstractGeoViewLayer as an EsriFeature if the type attribute of the verifyIfGeoViewLayer
 * parameter is ESRI_FEATURE. The type ascention applies only to the true block of the if clause that use this function.
 *
 * @param {AbstractGeoViewLayer} verifyIfGeoViewLayer Polymorphic object to test in order to determine if the type ascention is valid
 *
 * @return {boolean} true if the type ascention is valid
 */
export const geoviewLayerIsEsriFeature = (verifyIfGeoViewLayer: AbstractGeoViewLayer): verifyIfGeoViewLayer is EsriFeature => {
  return verifyIfGeoViewLayer.type === CONST_LAYER_TYPES.ESRI_FEATURE;
};

/** ******************************************************************************************************************************
 * Type Gard function that redefines a TypeLayerEntryConfig as a TypeEsriFeatureLayerEntryConfig if the geoviewLayerType attribute of
 * the verifyIfGeoViewEntry.geoviewLayerParent attribute is ESRI_FEATURE. The type ascention applies only to the true block of
 * the if clause that use this function.
 *
 * @param {TypeLayerEntryConfig} verifyIfGeoViewEntry Polymorphic object to test in order to determine if the type ascention is valid
 *
 * @return {boolean} true if the type ascention is valid
 */
export const geoviewEntryIsEsriFeature = (
  verifyIfGeoViewEntry: TypeLayerEntryConfig
): verifyIfGeoViewEntry is TypeEsriFeatureLayerEntryConfig => {
  return verifyIfGeoViewEntry.geoviewLayerParent.geoviewLayerType === CONST_LAYER_TYPES.ESRI_FEATURE;
};

// ******************************************************************************************************************************
// ******************************************************************************************************************************
/** ******************************************************************************************************************************
 * A class to add esri feature layer.
 *
 * @exports
 * @class EsriFeature
 */
// ******************************************************************************************************************************
export class EsriFeature extends AbstractGeoViewVector {
  // layer
  // layer!: VectorLayer<VectorSource>;

  // define a default blue icon
  iconSymbols: { field: string | null; valueAndSymbol: Record<string, StyleIcon> } = {
    field: null,
    valueAndSymbol: { default: blueCircleIcon },
  };

  attribution = '';

  isFeatureLayer = true;

  /** ****************************************************************************************************************************
   * Initialize layer.
   *
   * @param {string} mapId The id of the map.
   * @param {TypeFeatureLayer} layerConfig The layer configuration.
   */
  constructor(mapId: string, layerConfig: TypeEsriFeatureLayerConfig) {
    super(CONST_LAYER_TYPES.ESRI_FEATURE, layerConfig, mapId);
  }

  /** ****************************************************************************************************************************
   * This method reads from the accessPath additional information to complete the GeoView layer configuration.
   */
  getAdditionalServiceDefinition(): void {
    // ! NOTE: This method is not realy the implementation expected. The way it is right now is the old code reformatted to have no error.
    this.legendQuery();
  }

  private async legendQuery(): Promise<void> {
    let queryUrl = this.accessPath[api.map(this.mapId).getLanguageCodePrefix()];
    queryUrl = queryUrl.endsWith('/') ? `${queryUrl}legend?f=pjson` : `${queryUrl}/legend?f=pjson`;

    const queryResult = (await axios.get<TypeJsonObject>(queryUrl)).data;

    const renderer = queryResult.drawingInfo && queryResult.drawingInfo.renderer;
    if (renderer) {
      if (renderer.type === 'uniqueValue') {
        this.iconSymbols.field = renderer.field1 as string;
        (renderer.uniqueValueInfos as TypeJsonArray).forEach((symbolInfo) => {
          this.iconSymbols.valueAndSymbol[symbolInfo.value as string] = new StyleIcon({
            src: `data:${symbolInfo.symbol.contentType};base64,${symbolInfo.symbol.imageData}`,
            scale: (symbolInfo.symbol.height as number) / (symbolInfo.symbol.width as number),
            // anchor: [Math.round((symbolInfo.symbol.width as number) / 2), Math.round((symbolInfo.symbol.height as number) / 2)],
          });
        });
      } else if (renderer.symbol) {
        const symbolInfo = renderer.symbol;
        this.iconSymbols.valueAndSymbol.default = new StyleIcon({
          src: `data:${symbolInfo.contentType};base64,${symbolInfo.imageData}`,
          scale: (symbolInfo.height as number) / (symbolInfo.width as number),
          // anchor: [Math.round((symbolInfo.width as number) / 2), Math.round((symbolInfo.height as number) / 2)],
        });
      }
    }

    getXMLHttpRequest(`${this.accessPath[api.map(this.mapId).getLanguageCodePrefix()]}?f=json`).then(async (value) => {
      if (value !== '{}') {
        const { type, copyrightText } = toJsonObject(JSON.parse(value));
        this.attribution = copyrightText ? (copyrightText as string) : '';
        // check if the type is define as Feature Layer.
        this.isFeatureLayer = typeof type !== 'undefined' && type === 'Feature Layer';
      }
    });
  }

  /**
   * This method associate a renderer to the GeoView layer.
   *
   * @param {TypeLayerEntryConfig} layerEntry Information needed to create the renderer.
   * @param {TypeBaseRasterLayer} rasterLayer The GeoView layer associated to the renderer.
   */
  setRenderer(layerEntry: TypeLayerEntryConfig, rasterLayer: TypeBaseVectorLayer): void {
    // eslint-disable-next-line no-console
    console.log('This method needs to be coded!');
    // eslint-disable-next-line no-console
    console.log(layerEntry, rasterLayer);
  }

  /**
   * This method register the GeoView layer to panels that offer this possibility.
   *
   * @param {TypeLayerEntryConfig} layerEntry Information needed to create the renderer.
   * @param {TypeBaseRasterLayer} rasterLayer The GeoView layer who wants to register.
   */
  registerToPanels(layerEntry: TypeLayerEntryConfig, rasterLayer: TypeBaseVectorLayer): void {
    // eslint-disable-next-line no-console
    console.log('This method needs to be coded!');
    // eslint-disable-next-line no-console
    console.log(layerEntry, rasterLayer);
  }
}
