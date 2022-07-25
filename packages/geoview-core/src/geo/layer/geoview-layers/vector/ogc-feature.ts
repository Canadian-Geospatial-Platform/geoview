import axios from 'axios';

import { Style, Stroke, Fill, Circle as StyleCircle } from 'ol/style';
import { asArray, asString } from 'ol/color';

import { TypeJsonObject } from '../../../../core/types/global-types';
import { api } from '../../../../app';
import { AbstractGeoViewLayer, CONST_LAYER_TYPES } from '../abstract-geoview-layers';
import { AbstractGeoViewVector, TypeBaseVectorLayer } from './abstract-geoview-vector';
import { TypeLayerEntryConfig, TypeVectorLayerEntryConfig, TypeVectorSourceInitialConfig } from '../schema-types';
import { TypeGeoviewLayerConfig } from '../../../map/map-types';

import { setAlphaColor } from '../../../../core/utils/utilities';

// constant to define default style if not set by renderer
// TODO: put somewhere to reuse for all vector layers + maybe array so if many layer, we increase the choice
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const defaultCircleMarkerStyle = new Style({
  image: new StyleCircle({
    radius: 5,
    stroke: new Stroke({
      color: asString(setAlphaColor(asArray('#333'), 1)),
      width: 1,
    }),
    fill: new Fill({
      color: asString(setAlphaColor(asArray('#FFB27F'), 0.8)),
    }),
  }),
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const defaultLineStringStyle = new Style({
  stroke: new Stroke({
    color: asString(setAlphaColor(asArray('#000000'), 1)),
    width: 2,
  }),
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const defaultLinePolygonStyle = new Style({
  stroke: new Stroke({
    // 1 is for opacity
    color: asString(setAlphaColor(asArray('#000000'), 1)),
    width: 2,
  }),
  fill: new Fill({
    color: asString(setAlphaColor(asArray('#000000'), 0.5)),
  }),
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const defaultSelectStyle = new Style({
  stroke: new Stroke({
    color: asString(setAlphaColor(asArray('#0000FF'), 1)),
    width: 3,
  }),
  fill: new Fill({
    color: asString(setAlphaColor(asArray('#0000FF'), 0.5)),
  }),
});

export interface TypeSourceOgcFeatureInitialConfig extends Omit<TypeVectorSourceInitialConfig, 'format'> {
  format: 'featureAPI';
}

export interface TypeOgcFeatureLayerEntryConfig extends Omit<TypeVectorLayerEntryConfig, 'source'> {
  source: TypeSourceOgcFeatureInitialConfig;
}

export interface TypeOgcFeatureLayerConfig extends Omit<TypeGeoviewLayerConfig, 'layerEntries' | 'geoviewLayerType'> {
  geoviewLayerType: 'ogcFeature';
  layerEntries?: TypeOgcFeatureLayerEntryConfig[];
}

/** *****************************************************************************************************************************
 * Type Gard function that redefines a TypeGeoviewLayerConfig as a TypeOgcFeatureLayerConfig if the geoviewLayerType attribute of the
 * verifyIfLayer parameter is OGC_FEATURE. The type ascention applies only to the true block of the if clause that use
 * this function.
 *
 * @param {TypeGeoviewLayerConfig} verifyIfLayer Polymorphic object to test in order to determine if the type ascention is valid
 *
 * @return {boolean} true if the type ascention is valid
 */
export const layerConfigIsOgcFeature = (verifyIfLayer: TypeGeoviewLayerConfig): verifyIfLayer is TypeOgcFeatureLayerConfig => {
  return verifyIfLayer.geoviewLayerType === CONST_LAYER_TYPES.OGC_FEATURE;
};

/** *****************************************************************************************************************************
 * Type Gard function that redefines an AbstractGeoViewLayer as an OgcFeature
 * if the type attribute of the verifyIfGeoViewLayer parameter is OGC_FEATURE. The type ascention
 * applies only to the true block of the if clause that use this function.
 *
 * @param {AbstractGeoViewLayer} verifyIfGeoViewLayer Polymorphic object to test in order to determine if the type ascention is valid
 *
 * @return {boolean} true if the type ascention is valid
 */
export const geoviewLayerIsOgcFeature = (verifyIfGeoViewLayer: AbstractGeoViewLayer): verifyIfGeoViewLayer is OgcFeature => {
  return verifyIfGeoViewLayer.type === CONST_LAYER_TYPES.OGC_FEATURE;
};

/** *****************************************************************************************************************************
 * Type Gard function that redefines a TypeLayerEntryConfig as a TypeOgcFeatureLayerEntryConfig if the geoviewLayerType attribute of the
 * verifyIfGeoViewEntry.geoviewLayerParent attribute is OGC_FEATURE. The type ascention applies only to the true block of
 * the if clause that use this function.
 *
 * @param {TypeLayerEntryConfig} verifyIfGeoViewEntry Polymorphic object to test in order to determine if the type ascention is valid
 *
 * @return {boolean} true if the type ascention is valid
 */
export const geoviewEntryIsOgcFeature = (
  verifyIfGeoViewEntry: TypeLayerEntryConfig
): verifyIfGeoViewEntry is TypeOgcFeatureLayerEntryConfig => {
  return verifyIfGeoViewEntry.geoviewLayerParent.geoviewLayerType === CONST_LAYER_TYPES.OGC_FEATURE;
};

// ******************************************************************************************************************************
// ******************************************************************************************************************************
/** ******************************************************************************************************************************
 * A class to add OGC api feature layer.
 *
 * @exports
 * @class OgcFeature
 */
// ******************************************************************************************************************************
export class OgcFeature extends AbstractGeoViewVector {
  // private varibale holding wfs capabilities
  private capabilities: TypeJsonObject = {};

  // private varibale holding wfs version
  private version = '2.0.0';

  /** ***************************************************************************************************************************
   * Initialize layer
   *
   * @param {string} mapId the id of the map
   * @param {TypeOgcFeatureLayerConfig} layerConfig the layer configuration
   */
  constructor(mapId: string, layerConfig: TypeOgcFeatureLayerConfig) {
    super(CONST_LAYER_TYPES.OGC_FEATURE, layerConfig, mapId);
  }

  /** ****************************************************************************************************************************
   * This method reads from the accessPath additional information to complete the GeoView layer configuration.
   */
  getAdditionalServiceDefinition(): void {
    this.getCapabilities();
    if (this.capabilities && this.capabilities.description) this.attributions.push(this.capabilities.description as string);
  }

  /** ****************************************************************************************************************************
   * Query the OGC feature service to get the capacities.
   */
  private async getCapabilities(): Promise<void> {
    const rootUrl = this.accessPath[api.map(this.mapId).getLanguageCode()].endsWith('/')
      ? this.accessPath[api.map(this.mapId).getLanguageCode()]
      : `${this.accessPath[api.map(this.mapId).getLanguageCode()]}/`;

    const entries = this.layerEntries.map((item) => item.info.layerId).toString();

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const featureUrl = `${rootUrl}collections/${entries}/items?f=json`;
    const metaUrl = `${rootUrl}collections/${entries}?f=json`;

    this.capabilities = (await axios.get<TypeJsonObject>(metaUrl)).data;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const layerName = this.name[api.map(this.mapId).getLanguageCode()]
      ? this.name[api.map(this.mapId).getLanguageCode()]
      : (this.capabilities.title as string);
    // ! To be continued
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
