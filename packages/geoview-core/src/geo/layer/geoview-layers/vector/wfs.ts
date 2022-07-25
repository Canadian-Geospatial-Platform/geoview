import { Style, Stroke, Fill, Circle as StyleCircle } from 'ol/style';
import { asArray, asString } from 'ol/color';

import { TypeJsonArray, TypeJsonObject } from '../../../../core/types/global-types';
import { api } from '../../../../app';
import { AbstractGeoViewLayer, CONST_LAYER_TYPES } from '../abstract-geoview-layers';
import { AbstractGeoViewVector, TypeBaseVectorLayer } from './abstract-geoview-vector';
import { TypeLayerEntryConfig, TypeVectorLayerEntryConfig, TypeVectorSourceInitialConfig } from '../schema-types';
import { TypeGeoviewLayerConfig } from '../../../map/map-types';

import { getXMLHttpRequest, setAlphaColor, xmlToJson } from '../../../../core/utils/utilities';

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

/**
 * Create a style from a renderer object
 *
 * @param {TypeJsonObject} renderer the render with the style properties
 * @returns {Style} the new style with the custom renderer
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const createStyleFromRenderer = (renderer: TypeJsonObject): Style => {
  return renderer.radius
    ? new Style({
        image: new StyleCircle({
          radius: renderer.radius as number,
          stroke: new Stroke({
            color: asString(setAlphaColor(asArray(renderer.color as string), renderer.opacity as number)),
            width: 1,
          }),
          fill: new Fill({
            color: asString(setAlphaColor(asArray(renderer.fillColor as string), renderer.fillOpacity as number)),
          }),
        }),
      })
    : new Style({
        stroke: new Stroke({
          color: asString(setAlphaColor(asArray(renderer.color as string), renderer.opacity as number)),
          width: 3,
        }),
        fill: new Fill({
          color: asString(setAlphaColor(asArray(renderer.fillColor as string), renderer.fillOpacity as number)),
        }),
      });
};

export interface TypeSourceWFSVectorInitialConfig extends Omit<TypeVectorSourceInitialConfig, 'format'> {
  format: 'WFS';
}

export interface TypeWFSLayerEntryConfig extends Omit<TypeVectorLayerEntryConfig, 'source' | 'layerEntryType'> {
  layerEntryType: 'vector';
  source: TypeSourceWFSVectorInitialConfig;
}

export interface TypeWFSLayerConfig extends Omit<TypeGeoviewLayerConfig, 'geoviewLayerType' | 'geoviewLayerType'> {
  geoviewLayerType: 'ogcWfs';
  layerEntries?: TypeWFSLayerEntryConfig[];
}

/** *****************************************************************************************************************************
 * Type Gard function that redefines a TypeGeoviewLayerConfig as a TypeWFSLayerConfig if the geoviewLayerType attribute of the
 * verifyIfLayer parameter is WFS. The type ascention applies only to the true block of the if clause that use this function.
 *
 * @param {TypeGeoviewLayerConfig} verifyIfLayer Polymorphic object to test in order to determine if the type ascention is valid
 *
 * @return {boolean} true if the type ascention is valid
 */
export const layerConfigIsWFS = (verifyIfLayer: TypeGeoviewLayerConfig): verifyIfLayer is TypeWFSLayerConfig => {
  return verifyIfLayer.geoviewLayerType === CONST_LAYER_TYPES.WFS;
};

/** *****************************************************************************************************************************
 * Type Gard function that redefines an AbstractGeoViewLayer as a WFS if the type attribute of the verifyIfGeoViewLayer parameter
 * is WFS. The type ascention applies only to the true block of the if clause that use this function.
 *
 * @param {AbstractGeoViewLayer} verifyIfGeoViewLayer Polymorphic object to test in order to determine if the type ascention is valid
 *
 * @return {boolean} true if the type ascention is valid
 */
export const geoviewLayerIsWFS = (verifyIfGeoViewLayer: AbstractGeoViewLayer): verifyIfGeoViewLayer is WFS => {
  return verifyIfGeoViewLayer.type === CONST_LAYER_TYPES.WFS;
};

/** *****************************************************************************************************************************
 * Type Gard function that redefines a TypeLayerEntryConfig as a TypeWFSLayerEntryConfig if the geoviewLayerType attribute of the
 * verifyIfGeoViewEntry.geoviewLayerParent attribute is WFS. The type ascention applies only to the true block of
 * the if clause that use this function.
 *
 * @param {TypeLayerEntryConfig} verifyIfGeoViewEntry Polymorphic object to test in order to determine if the type ascention is valid
 *
 * @return {boolean} true if the type ascention is valid
 */
export const geoviewEntryIsWFS = (verifyIfGeoViewEntry: TypeLayerEntryConfig): verifyIfGeoViewEntry is TypeWFSLayerEntryConfig => {
  return verifyIfGeoViewEntry.geoviewLayerParent.geoviewLayerType === CONST_LAYER_TYPES.WFS;
};

// ******************************************************************************************************************************
// ******************************************************************************************************************************
/** *****************************************************************************************************************************
 * A class to add WFS layer.
 *
 * @exports
 * @class WFS
 */
// ******************************************************************************************************************************
export class WFS extends AbstractGeoViewVector {
  // private varibale holding wfs capabilities
  private capabilities: TypeJsonObject = {};

  // private varibale holding wfs version
  private version = '2.0.0';

  /** ***************************************************************************************************************************
   * Initialize layer
   * @param {string} mapId the id of the map
   * @param {TypeWFSLayerConfig} layerConfig the layer configuration
   */
  constructor(mapId: string, layerConfig: TypeWFSLayerConfig) {
    super(CONST_LAYER_TYPES.WFS, layerConfig, mapId);
  }

  /** ****************************************************************************************************************************
   * This method reads from the accessPath additional information to complete the GeoView layer configuration.
   */
  getAdditionalServiceDefinition(): void {
    this.getWfsCapabilities();
    if (this.layerEntries.length !== 0) {
      const featTypeInfo = this.getFeatureTypeInfo(
        this.capabilities['wfs:WFS_Capabilities'].FeatureTypeList.FeatureType,
        this.layerEntries.map((item) => item.info.layerId).toString()
      );
      if (!featTypeInfo) {
        return;
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const layerName = this.name[api.map(this.mapId).getLanguageCode()]
        ? this.name[api.map(this.mapId).getLanguageCode()]
        : (featTypeInfo.Name['#text'] as string).split(':')[1];
      // ! To be continued
    }
  }

  /** ****************************************************************************************************************************
   * Query the WFS service to get the capacities.
   */
  private async getWfsCapabilities(): Promise<void> {
    let xmlStringCapabilities = '';
    getXMLHttpRequest(`${this.accessPath[api.map(this.mapId).getLanguageCode()]}?service=WFS&request=getcapabilities`).then((result) => {
      xmlStringCapabilities = result;
    });
    // need to pass a xmldom to xmlToJson
    const xmlDOMCapabilities = new DOMParser().parseFromString(xmlStringCapabilities, 'text/xml');
    const xmlJsonCapabilities = xmlToJson(xmlDOMCapabilities);

    this.capabilities = xmlJsonCapabilities['wfs:WFS_Capabilities'];
    this.version = xmlJsonCapabilities['wfs:WFS_Capabilities']['@attributes'].version as string;
  }

  /** ****************************************************************************************************************************
   * Get feature type info of a given entry
   * @param {TypeJsonObject} featureTypeList feature type list
   * @param {string} entries names(comma delimited) to check
   *
   * @returns {TypeJsonObject | null} feature type object or null
   */
  private getFeatureTypeInfo(featureTypeList: TypeJsonObject, entries?: string): TypeJsonObject | null {
    const res = null;

    if (Array.isArray(featureTypeList)) {
      const featureTypeArray: TypeJsonArray = featureTypeList;

      for (let i = 0; i < featureTypeArray.length; i += 1) {
        let fName = featureTypeArray[i].Name['#text'] as string;

        const fNameSplit = fName.split(':');
        fName = fNameSplit.length > 1 ? fNameSplit[1] : fNameSplit[0];

        const entrySplit = entries!.split(':');
        const entryName = entrySplit.length > 1 ? entrySplit[1] : entrySplit[0];

        if (entryName === fName) {
          return featureTypeArray[i];
        }
      }
    } else {
      let fName = featureTypeList.Name['#text'] as string;

      const fNameSplit = fName.split(':');
      fName = fNameSplit.length > 1 ? fNameSplit[1] : fNameSplit[0];

      const entrySplit = entries!.split(':');
      const entryName = entrySplit.length > 1 ? entrySplit[1] : entrySplit[0];

      if (entryName === fName) {
        return featureTypeList;
      }
    }
    return res;
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
