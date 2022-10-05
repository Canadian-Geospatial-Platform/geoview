/* eslint-disable no-param-reassign, no-var */
import Feature from 'ol/Feature';
import { Vector as VectorSource } from 'ol/source';
import { Options as SourceOptions } from 'ol/source/Vector';
import { VectorImage as VectorLayer } from 'ol/layer';
import { Options as VectorLayerOptions } from 'ol/layer/VectorImage';
import { Geometry } from 'ol/geom';
import { all } from 'ol/loadingstrategy';
import { ReadOptions } from 'ol/format/Feature';
import BaseLayer from 'ol/layer/Base';
import LayerGroup from 'ol/layer/Group';
import { Coordinate } from 'ol/coordinate';
import { Pixel } from 'ol/pixel';

import { AbstractGeoViewLayer } from '../abstract-geoview-layers';
import {
  TypeBaseLayerEntryConfig,
  TypeBaseVectorSourceInitialConfig,
  TypeFeatureInfoLayerConfig,
  TypeListOfLayerEntryConfig,
} from '../../../map/map-schema-types';
import { api } from '../../../../app';
import { getLocalizedValue } from '../../../../core/utils/utilities';
import { TypeFeatureInfoEntry, TypeFeatureInfoResult, TypeQueryType } from '../../../../api/events/payloads/get-feature-info-payload';

/* *******************************************************************************************************************************
 * AbstractGeoViewVector types
 */

// Base type used to keep the layer's hierarchical structure. It is similar to ol/layer/Base~BaseLayer.
export type TypeVectorLayerGroup = LayerGroup;
export type TypeVectorLayer = VectorSource<Geometry>;
export type TypeBaseVectorLayer = BaseLayer | TypeVectorLayerGroup | TypeVectorLayer;

// ******************************************************************************************************************************
// ******************************************************************************************************************************
/** ******************************************************************************************************************************
 * The AbstractGeoViewVector class is a direct descendant of AbstractGeoViewLayer. As its name indicates, it is used to
 * instanciate GeoView vector layers. It inherits from its parent class an attribute named gvLayers where the vector elements
 * of the class will be kept.
 *
 * The gvLayers attribute has a hierarchical structure. Its data type is TypetBaseVectorLayer. Subclasses of this type
 * are TypeVectorLayerGroup and TypeVectorLayer. The TypeVectorLayerGroup is a collection of TypetBaseVectorLayer. It is
 * important to note that a TypetBaseVectorLayer attribute can polymorphically refer to a TypeVectorLayerGroup or a
 * TypeVectorLayer. Here, we must not confuse instantiation and declaration of a polymorphic attribute.
 *
 * All leaves of the tree structure stored in the gvLayers attribute must be of type TypeVectorLayer. This is where the
 * features are placed and can be considered as a feature group.
 */
// ******************************************************************************************************************************
export abstract class AbstractGeoViewVector extends AbstractGeoViewLayer {
  /** ***************************************************************************************************************************
   * This method reads the service metadata from the metadataAccessPath.
   *
   * @returns {Promise<void>} A promise that the execution is completed.
   */
  protected abstract getServiceMetadata(): Promise<void>;

  /** ***************************************************************************************************************************
   * This method recursively validates the configuration of the layer entries to ensure that each layer is correctly defined. If
   * necessary, additional code can be executed in the child method to complete the layer configuration.
   *
   * @param {TypeListOfLayerEntryConfig} listOfLayerEntryConfig The list of layer entries configuration to validate.
   *
   * @returns {TypeListOfLayerEntryConfig} A new layer configuration list with layers in error removed.
   */
  protected abstract validateListOfLayerEntryConfig(listOfLayerEntryConfig: TypeListOfLayerEntryConfig): TypeListOfLayerEntryConfig;

  /** ***************************************************************************************************************************
   * This method processes recursively the metadata of each layer in the list of layer configuration.
   *
   *  @param {TypeListOfLayerEntryConfig} listOfLayerEntryConfig The list of layers to process.
   *
   * @returns {Promise<void>} A promise that the execution is completed.
   */
  protected abstract processListOfLayerEntryMetadata(listOfLayerEntryConfig: TypeListOfLayerEntryConfig): Promise<void>;

  /** ***************************************************************************************************************************
   * This method creates a GeoView layer using the definition provided in the layerEntryConfig parameter.
   *
   * @param {TypeLayerEntryConfig} layerEntryConfig Information needed to create the GeoView layer.
   *
   * @returns {Promise<BaseLayer | null>} The GeoView base layer that has been created.
   */
  protected processOneLayerEntry(layerEntryConfig: TypeBaseLayerEntryConfig): Promise<BaseLayer | null> {
    const promisedVectorLayer = new Promise<BaseLayer | null>((resolve) => {
      const vectorSource = this.createVectorSource(layerEntryConfig);
      const vectorLayer = this.createVectorLayer(layerEntryConfig, vectorSource);
      resolve(vectorLayer);
    });
    return promisedVectorLayer;
  }

  /** ***************************************************************************************************************************
   * Create a source configuration for the vector layer.
   *
   * @param {TypeBaseLayerEntryConfig} layerEntryConfig The layer entry configuration.
   *
   * @returns {VectorSource<Geometry>} The source configuration that will be used to create the vector layer.
   */
  protected createVectorSource(
    layerEntryConfig: TypeBaseLayerEntryConfig,
    sourceOptions: SourceOptions = { strategy: all },
    readOptions: ReadOptions = {}
  ): VectorSource<Geometry> {
    var vectorSource: VectorSource<Geometry>;
    if (this.attributions.length !== 0) sourceOptions.attributions = this.attributions;

    sourceOptions.loader = (extent, resolution, projection, success, failure) => {
      const url = vectorSource.getUrl();
      const xhr = new XMLHttpRequest();
      xhr.open('GET', url as string);
      const onError = () => {
        vectorSource.removeLoadedExtent(extent);
        if (failure) failure();
      };
      xhr.onerror = onError;
      xhr.onload = () => {
        if (xhr.status === 200) {
          const features = vectorSource.getFormat()!.readFeatures(xhr.responseText, {
            ...readOptions,
            featureProjection: projection,
            extent,
          }) as Feature<Geometry>[];
          vectorSource.addFeatures(features);
          if (success) success(features);
        } else {
          onError();
        }
      };
      xhr.send();
    };

    vectorSource = new VectorSource(sourceOptions);
    return vectorSource;
  }

  /** ***************************************************************************************************************************
   * Create a vector layer. The layer has in its properties a reference to the layer entry configuration used at creation time.
   * The layer entry configuration keeps a reference to the layer in the gvLayer attribute.
   *
   * @param {TypeBaseLayerEntryConfig} layerEntryConfig The layer entry configuration used by the source.
   * @param {VectorSource<Geometry>} vectorSource The source configuration for the vector layer.
   *
   * @returns {VectorLayer<VectorSource>} The vector layer created.
   */
  private createVectorLayer(layerEntryConfig: TypeBaseLayerEntryConfig, vectorSource: VectorSource<Geometry>): VectorLayer<VectorSource> {
    const layerOptions: VectorLayerOptions<VectorSource> = {
      properties: { layerEntryConfig },
      source: vectorSource,
      style: (feature) => {
        if ('style' in layerEntryConfig) {
          const { geoviewRenderer } = api.map(this.mapId);
          return geoviewRenderer.getStyle(feature, layerEntryConfig);
        }
        return undefined;
      },
    };

    // eslint-disable-next-line no-param-reassign
    layerEntryConfig.gvlayer = new VectorLayer(layerOptions);
    return layerEntryConfig.gvlayer as VectorLayer<VectorSource>;
  }

  private formatFeatureInfoResult(features: Feature<Geometry>[], featureInfo?: TypeFeatureInfoLayerConfig): TypeFeatureInfoResult {
    if (!features.length) return null;
    const outfields = getLocalizedValue(featureInfo?.outfields, this.mapId)?.split(',');
    const queryResult: TypeFeatureInfoResult = [];
    features.forEach((feature) => {
      const featureFields = feature.getKeys();
      const featureInfoEntry: TypeFeatureInfoEntry = {};
      featureFields.forEach((fieldName) => {
        if (!outfields || outfields.includes(fieldName)) featureInfoEntry[fieldName] = feature.get(fieldName);
      });
      queryResult.push(featureInfoEntry);
    });
    return queryResult;
  }

  /** ***************************************************************************************************************************
   * Return feature information for all the features stored in the layer.
   *
   * @param {string} layerId Optional layer identifier. If undefined, this.activeLayer is used.
   *
   * @returns {TypeFeatureInfoResult} The feature info table.
   */
  getAllFeatureInfo(layerId?: string): TypeFeatureInfoResult {
    const gvLayer = this.getBaseLayer(layerId) as VectorLayer<VectorSource>;
    if (!gvLayer) return null;
    return this.formatFeatureInfoResult(
      gvLayer.getSource()!.getFeatures(),
      ((gvLayer?.get('layerEntryConfig') as TypeBaseLayerEntryConfig).source as TypeBaseVectorSourceInitialConfig)?.featureInfo
    );
  }

  /** ***************************************************************************************************************************
   * Return feature information for all the features stored in the layer.
   *
   * @param {Pixel | Coordinate | Coordinate[]} location A pixel, a coordinate or a polygon that will be used by the query.
   * @param {string} layerId Optional layer identifier. If undefined, this.activeLayer is used.
   * @param {TypeQueryType} queryType Optional query type, default value is 'at pixel'.
   *
   * @returns {Promise<TypeFeatureInfoResult>} The feature info table.
   */
  getFeatureInfo(
    location: Pixel | Coordinate | Coordinate[],
    layerId?: string,
    queryType: TypeQueryType = 'at pixel'
  ): Promise<TypeFeatureInfoResult> {
    const queryResult = new Promise<TypeFeatureInfoResult>((resolve) => {
      let layer: BaseLayer | null = null;
      switch (queryType) {
        case 'at pixel':
          layer = layerId ? this.getBaseLayer(layerId) : this.activeLayer;
          if (!layer) resolve(null);
          (layer as VectorLayer<VectorSource>).getFeatures(location as Pixel).then((features) => {
            resolve(
              this.formatFeatureInfoResult(
                features,
                ((layer?.get('layerEntryConfig') as TypeBaseLayerEntryConfig).source as TypeBaseVectorSourceInitialConfig)?.featureInfo
              )
            );
          });
          break;
        case 'at coordinate':
          layer = layerId ? this.getBaseLayer(layerId) : this.activeLayer;
          if (!layer) resolve(null);
          (layer as VectorLayer<VectorSource>)
            .getFeatures(api.map(this.mapId).map.getPixelFromCoordinate(location as Coordinate))
            .then((features) => {
              resolve(
                this.formatFeatureInfoResult(
                  features,
                  ((layer?.get('layerEntryConfig') as TypeBaseLayerEntryConfig).source as TypeBaseVectorSourceInitialConfig)?.featureInfo
                )
              );
            });
          break;
        case 'using a bounding box':
          // eslint-disable-next-line no-console
          console.log('Queries using bounding box are not implemented.');
          resolve(null);
          break;
        case 'using a polygon':
          // eslint-disable-next-line no-console
          console.log('Queries using polygon are not implemented.');
          resolve(null);
          break;
        default:
          // eslint-disable-next-line no-console
          console.log(`Queries using ${queryType} are invalid.`);
          resolve(null);
      }
    });
    return queryResult;
  }
}
