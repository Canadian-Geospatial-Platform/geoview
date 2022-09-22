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

import { getLocalizedValue, getXMLHttpRequest, setAlphaColor, xmlToJson } from '../../../../core/utils/utilities';

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

export interface TypeSourceWFSVectorInitialConfig extends TypeVectorSourceInitialConfig {
  format: 'WFS';
}

export interface TypeWfsLayerEntryConfig extends Omit<TypeVectorLayerEntryConfig, 'source'> {
  source: TypeSourceWFSVectorInitialConfig;
}

export interface TypeWFSLayerConfig extends Omit<TypeGeoviewLayerConfig, 'geoviewLayerType' | 'geoviewLayerType'> {
  geoviewLayerType: 'ogcWfs';
  listOfLayerEntryConfig: TypeWfsLayerEntryConfig[];
}

/** *****************************************************************************************************************************
 * Type Gard function that redefines a TypeGeoviewLayerConfig as a TypeWFSLayerConfig if the geoviewLayerType attribute of the
 * verifyIfLayer parameter is WFS. The type ascention applies only to the true block of the if clause that use this function.
 *
 * @param {TypeGeoviewLayerConfig} verifyIfLayer Polymorphic object to test in order to determine if the type ascention is valid.
 *
 * @return {boolean} true if the type ascention is valid.
 */
export const layerConfigIsWFS = (verifyIfLayer: TypeGeoviewLayerConfig): verifyIfLayer is TypeWFSLayerConfig => {
  return verifyIfLayer.geoviewLayerType === CONST_LAYER_TYPES.WFS;
};

/** *****************************************************************************************************************************
 * Type Gard function that redefines an AbstractGeoViewLayer as a WFS if the type attribute of the verifyIfGeoViewLayer parameter
 * is WFS. The type ascention applies only to the true block of the if clause that use this function.
 *
 * @param {AbstractGeoViewLayer} verifyIfGeoViewLayer Polymorphic object to test in order to determine if the type ascention is
 * valid.
 *
 * @return {boolean} true if the type ascention is valid.
 */
export const geoviewLayerIsWFS = (verifyIfGeoViewLayer: AbstractGeoViewLayer): verifyIfGeoViewLayer is WFS => {
  return verifyIfGeoViewLayer.type === CONST_LAYER_TYPES.WFS;
};

/** *****************************************************************************************************************************
 * Type Gard function that redefines a TypeLayerEntryConfig as a TypeWfsLayerEntryConfig if the geoviewLayerType attribute of the
 * verifyIfGeoViewEntry.geoviewRootLayer attribute is WFS. The type ascention applies only to the true block of
 * the if clause that use this function.
 *
 * @param {TypeLayerEntryConfig} verifyIfGeoViewEntry Polymorphic object to test in order to determine if the type ascention is
 * valid.
 *
 * @return {boolean} true if the type ascention is valid.
 */
export const geoviewEntryIsWFS = (verifyIfGeoViewEntry: TypeLayerEntryConfig): verifyIfGeoViewEntry is TypeWfsLayerEntryConfig => {
  return verifyIfGeoViewEntry.geoviewRootLayer!.geoviewLayerType === CONST_LAYER_TYPES.WFS;
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
  /** private varibale holding the wfs capabilities. */
  private metadata: TypeJsonObject = {};

  /** Feature type description obtained fy the DescribeFeatureType service call. */
  featureTypeDescripion: Record<string, TypeJsonObject> = {};

  /** private varibale holding wfs version. */
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
   * This method reads from the metadataAccessPath additional information to complete the GeoView layer configuration.
   */
  getAdditionalServiceDefinition(): Promise<void> {
    const promisedExecution = new Promise<void>((resolve) => {
      this.getWfsCapabilities().then(() => {
        if (this.listOfLayerEntryConfig.length !== 0) {
          const promiseOfFeatureDescriptions: Promise<{ layerId: string; layerMetadata: TypeJsonObject | null }>[] = [];
          this.listOfLayerEntryConfig.forEach((layerEntryConfig) => {
            promiseOfFeatureDescriptions.push(this.describeFeatureType(layerEntryConfig.layerId));
          });
          Promise.all(promiseOfFeatureDescriptions).then((listOfDescriptions) => {
            listOfDescriptions.forEach((description) => {
              if (!description.layerMetadata) this.layerLoadError.push(description.layerId);
              else this.featureTypeDescripion[description.layerId] = description.layerMetadata;
            });
            // ! To be continued???
            resolve();
          });
        } else resolve();
      });
    });
    return promisedExecution;
  }

  /** ****************************************************************************************************************************
   * Query the WFS service to get the capacities.
   */
  private async getWfsCapabilities(): Promise<void> {
    const promisedExecution = new Promise<void>((resolve) => {
      const getcapabilitiesUrl = `${getLocalizedValue(this.metadataAccessPath, this.mapId)}?service=WFS&request=getcapabilities`;
      getXMLHttpRequest(getcapabilitiesUrl).then((xmlStringCapabilities) => {
        if (xmlStringCapabilities !== '{}') {
          // need to pass a xmldom to xmlToJson
          const xmlDOMCapabilities = new DOMParser().parseFromString(xmlStringCapabilities, 'text/xml');
          const xmlJsonCapabilities = xmlToJson(xmlDOMCapabilities);

          this.metadata = xmlJsonCapabilities['wfs:WFS_Capabilities'];
          this.version = xmlJsonCapabilities['wfs:WFS_Capabilities']['@attributes'].version as string;
          resolve();
        } else {
          throw new Error(`Cant't read capabilities for layer ${this.layerId} of map ${this.mapId}.`);
        }
      });
    });
    return promisedExecution;
  }

  /** ****************************************************************************************************************************
   * Get the feature type description.
   * @param {string} layerId The layer identifier.
   *
   * @returns {Promise<{ layerId: string; layerMetadata: TypeJsonObject | null }>} The feature type description or null.
   */
  private describeFeatureType(layerId: string): Promise<{ layerId: string; layerMetadata: TypeJsonObject | null }> {
    const promisedExecution = new Promise<{ layerId: string; layerMetadata: TypeJsonObject | null }>((resolve) => {
      const describeFeatureTypeUrl = `${getLocalizedValue(
        this.metadataAccessPath,
        this.mapId
      )}?service=WFS&request=DescribeFeatureType&outputFormat=application/json&typeName=${layerId}`;
      fetch(describeFeatureTypeUrl)
        .then<TypeJsonObject>((fetchResponse): Promise<TypeJsonObject> => {
          return fetchResponse.json();
        })
        .then((jsonFeatureDescription) => {
          resolve({ layerId, layerMetadata: jsonFeatureDescription });
        })
        .catch(() => {
          resolve({ layerId, layerMetadata: null });
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
    console.log('WFS.registerToPanels: This method needs to be coded!', rasterLayer);
  }
}
