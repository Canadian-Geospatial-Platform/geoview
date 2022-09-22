import axios from 'axios';

import { Style, Stroke, Fill, Circle as StyleCircle } from 'ol/style';
import { asArray, asString } from 'ol/color';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Geometry } from 'ol/geom';

import { TypeJsonObject } from '../../../../core/types/global-types';
import { AbstractGeoViewLayer, CONST_LAYER_TYPES } from '../abstract-geoview-layers';
import { AbstractGeoViewVector, TypeBaseVectorLayer } from './abstract-geoview-vector';
import {
  TypeLayerEntryConfig,
  TypeVectorLayerEntryConfig,
  TypeVectorSourceInitialConfig,
  TypeGeoviewLayerConfig,
} from '../../../map/map-schema-types';

import { getLocalizedValue, setAlphaColor } from '../../../../core/utils/utilities';

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

export interface TypeSourceOgcFeatureInitialConfig extends TypeVectorSourceInitialConfig {
  format: 'featureAPI';
}

export interface TypeOgcFeatureLayerEntryConfig extends Omit<TypeVectorLayerEntryConfig, 'source'> {
  source: TypeSourceOgcFeatureInitialConfig;
}

export interface TypeOgcFeatureLayerConfig extends Omit<TypeGeoviewLayerConfig, 'listOfLayerEntryConfig' | 'geoviewLayerType'> {
  geoviewLayerType: 'ogcFeature';
  listOfLayerEntryConfig: TypeOgcFeatureLayerEntryConfig[];
}

/** *****************************************************************************************************************************
 * Type Gard function that redefines a TypeGeoviewLayerConfig as a TypeOgcFeatureLayerConfig if the geoviewLayerType attribute of
 * the verifyIfLayer parameter is OGC_FEATURE. The type ascention applies only to the true block of the if clause that use this
 * function.
 *
 * @param {TypeGeoviewLayerConfig} verifyIfLayer Polymorphic object to test in order to determine if the type ascention is valid.
 *
 * @return {boolean} true if the type ascention is valid.
 */
export const layerConfigIsOgcFeature = (verifyIfLayer: TypeGeoviewLayerConfig): verifyIfLayer is TypeOgcFeatureLayerConfig => {
  return verifyIfLayer.geoviewLayerType === CONST_LAYER_TYPES.OGC_FEATURE;
};

/** *****************************************************************************************************************************
 * Type Gard function that redefines an AbstractGeoViewLayer as an OgcFeature
 * if the type attribute of the verifyIfGeoViewLayer parameter is OGC_FEATURE. The type ascention
 * applies only to the true block of the if clause that use this function.
 *
 * @param {AbstractGeoViewLayer} verifyIfGeoViewLayer Polymorphic object to test in order to determine if the type ascention is
 * valid.
 *
 * @return {boolean} true if the type ascention is valid.
 */
export const geoviewLayerIsOgcFeature = (verifyIfGeoViewLayer: AbstractGeoViewLayer): verifyIfGeoViewLayer is OgcFeature => {
  return verifyIfGeoViewLayer.type === CONST_LAYER_TYPES.OGC_FEATURE;
};

/** *****************************************************************************************************************************
 * Type Gard function that redefines a TypeLayerEntryConfig as a TypeOgcFeatureLayerEntryConfig if the geoviewLayerType attribute
 * of the verifyIfGeoViewEntry.geoviewRootLayer attribute is OGC_FEATURE. The type ascention applies only to the true block of
 * the if clause that use this function.
 *
 * @param {TypeLayerEntryConfig} verifyIfGeoViewEntry Polymorphic object to test in order to determine if the type ascention is
 * valid.
 *
 * @return {boolean} true if the type ascention is valid.
 */
export const geoviewEntryIsOgcFeature = (
  verifyIfGeoViewEntry: TypeLayerEntryConfig
): verifyIfGeoViewEntry is TypeOgcFeatureLayerEntryConfig => {
  return verifyIfGeoViewEntry.geoviewRootLayer!.geoviewLayerType === CONST_LAYER_TYPES.OGC_FEATURE;
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
  // private varibale holding OGC feature capabilities.
  private metadata: TypeJsonObject = {};

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
   * This method reads from the metadataAccessPath additional information to complete the GeoView layer configuration.
   */
  getAdditionalServiceDefinition(): Promise<void> {
    const promisedExecution = new Promise<void>((resolve) => {
      this.getCapabilities().then(() => {
        if (this.metadata?.description) this.attributions.push(this.metadata.description as string);
        resolve();
      });
    });
    return promisedExecution;
  }

  /** ****************************************************************************************************************************
   * Query the OGC feature service to get the capacities.
   */
  private getCapabilities(): Promise<void> {
    const promisedExecution = new Promise<void>((resolve) => {
      const rootUrl = getLocalizedValue(this.metadataAccessPath, this.mapId)!;
      const capabilitiesUrl = rootUrl.endsWith('/') ? `${rootUrl}collections?f=json` : `${rootUrl}/collections?f=json`;

      axios.get<TypeJsonObject>(capabilitiesUrl).then((response) => {
        this.metadata = response.data;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const layerName = getLocalizedValue(this.layerName, this.mapId) || (this.metadata.title as string);
        // ! To be continued
        // const featureUrl = `${rootUrl}collections/${entries}/items?f=json`;
        resolve();
      });
    });
    return promisedExecution;
  }

  /**
   * This method associate a renderer to the GeoView layer.
   *
   * @param {TypeBaseRasterLayer} rasterLayer The GeoView layer associated to the renderer.
   */
  setRenderer(baseVectorLayer: VectorLayer<VectorSource<Geometry>> | null): Promise<TypeBaseVectorLayer | null> {
    const promiseOfBaseVectorLayer = new Promise<TypeBaseVectorLayer | null>((resolve) => {
      resolve(baseVectorLayer);
    });
    return promiseOfBaseVectorLayer;
  }

  /**
   * This method register the GeoView layer to panels that offer this possibility.
   *
   * @param {TypeBaseRasterLayer} rasterLayer The GeoView layer who wants to register.
   */
  registerToPanels(rasterLayer: TypeBaseVectorLayer): void {
    // eslint-disable-next-line no-console
    console.log('OgcFeature.registerToPanels: This method needs to be coded!', rasterLayer);
  }
}
