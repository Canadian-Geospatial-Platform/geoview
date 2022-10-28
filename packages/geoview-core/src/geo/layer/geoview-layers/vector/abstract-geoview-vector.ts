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
import { transform } from 'ol/proj';

import { AbstractGeoViewLayer } from '../abstract-geoview-layers';
import {
  TypeBaseLayerEntryConfig,
  TypeBaseSourceVectorInitialConfig,
  TypeFeatureInfoLayerConfig,
  TypeLayerEntryConfig,
  TypeListOfLayerEntryConfig,
  TypeVectorLayerEntryConfig,
} from '../../../map/map-schema-types';
import { api } from '../../../../app';
import { getLocalizedValue } from '../../../../core/utils/utilities';
import { TypeFeatureInfoEntry, TypeArrayOfRecords } from '../../../../api/events/payloads/get-feature-info-payload';

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
          return geoviewRenderer.getFeatureStyle(feature, layerEntryConfig);
        }
        return undefined;
      },
    };

    // eslint-disable-next-line no-param-reassign
    layerEntryConfig.gvLayer = new VectorLayer(layerOptions);
    return layerEntryConfig.gvLayer as VectorLayer<VectorSource>;
  }

  /** ***************************************************************************************************************************
   * Convert the feature information to an array of TypeArrayOfRecords.
   *
   * @param {Feature<Geometry>[]} features The array of features to convert.
   * @param {TypeFeatureInfoLayerConfig} featureInfo The featureInfo configuration.
   *
   * @returns {TypeArrayOfRecords} The Array of feature information.
   */
  private formatFeatureInfoResult(features: Feature<Geometry>[], featureInfo?: TypeFeatureInfoLayerConfig): TypeArrayOfRecords {
    if (!features.length) return [];
    const outfields = getLocalizedValue(featureInfo?.outfields, this.mapId)?.split(',');
    const queryResult: TypeArrayOfRecords = [];
    features.forEach((feature) => {
      const featureFields = feature.getKeys();
      const featureInfoEntry: TypeFeatureInfoEntry = {};
      featureFields.forEach((fieldName) => {
        if (fieldName !== 'geometry' && (!outfields || outfields.includes(fieldName))) featureInfoEntry[fieldName] = feature.get(fieldName);
      });
      queryResult.push(featureInfoEntry);
    });
    return queryResult;
  }

  /** ***************************************************************************************************************************
   * Return feature information for all the features stored in the layer.
   *
   * @param {string | TypeLayerEntryConfig | null} layerPathOrConfig Optional layer path or configuration.
   *
   * @returns {TypeArrayOfRecords} The feature info table.
   */
  getAllFeatureInfo(layerPathOrConfig: string | TypeLayerEntryConfig | null | undefined = this.activeLayer): TypeArrayOfRecords {
    const layerConfig = typeof layerPathOrConfig === 'string' ? this.getLayerConfig(layerPathOrConfig) : layerPathOrConfig;
    if (!layerConfig?.gvLayer) return [];
    return this.formatFeatureInfoResult(
      (layerConfig.gvLayer as VectorLayer<VectorSource<Geometry>>).getSource()!.getFeatures(),
      (layerConfig.source as TypeBaseSourceVectorInitialConfig)?.featureInfo
    );
  }

  /** ***************************************************************************************************************************
   * Return feature information for all the features around the provided Pixel.
   *
   * @param {Coordinate} location The pixel coordinate that will be used by the query.
   * @param {TypeLayerEntryConfig} layerConfig The layer configuration.
   *
   * @returns {Promise<TypeArrayOfRecords>} The feature info table.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected getFeatureInfoAtPixel(location: Pixel, layerConfig: TypeLayerEntryConfig): Promise<TypeArrayOfRecords> {
    const promisedQueryResult = new Promise<TypeArrayOfRecords>((resolve) => {
      const layerFilter = (layer: BaseLayer) => {
        const layerSource = layer.get('layerEntryConfig')?.source;
        const configSource = layerConfig?.source;
        return layerSource !== undefined && configSource !== undefined && layerSource === configSource;
      };
      const { map } = api.map(this.mapId);
      const features = map.getFeaturesAtPixel(location, { hitTolerance: 4, layerFilter });
      resolve(
        this.formatFeatureInfoResult(features as Feature<Geometry>[], (layerConfig as TypeVectorLayerEntryConfig).source?.featureInfo)
      );
    });
    return promisedQueryResult;
  }

  /** ***************************************************************************************************************************
   * Return feature information for all the features around the provided projected coordinate.
   *
   * @param {Coordinate} location The pixel coordinate that will be used by the query.
   * @param {TypeLayerEntryConfig} layerConfig The layer configuration.
   *
   * @returns {Promise<TypeArrayOfRecords>} The feature info table.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected getFeatureInfoAtCoordinate(location: Coordinate, layerConfig: TypeLayerEntryConfig): Promise<TypeArrayOfRecords> {
    const promisedQueryResult = new Promise<TypeArrayOfRecords>((resolve) => {
      const { map } = api.map(this.mapId);
      resolve(this.getFeatureInfoAtPixel(map.getPixelFromCoordinate(location as Coordinate), layerConfig));
    });
    return promisedQueryResult;
  }

  /** ***************************************************************************************************************************
   * Return feature information for all the features around the provided longitude latitude.
   *
   * @param {Coordinate} location The coordinate that will be used by the query.
   * @param {TypeLayerEntryConfig} layerConfig The layer configuration.
   *
   * @returns {Promise<TypeArrayOfRecords>} The feature info table.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected getFeatureInfoAtLongLat(location: Coordinate, layerConfig: TypeLayerEntryConfig): Promise<TypeArrayOfRecords> {
    const promisedQueryResult = new Promise<TypeArrayOfRecords>((resolve) => {
      const { map } = api.map(this.mapId);
      const convertedLocation = transform(location, 'EPSG:4326', `EPSG:${api.map(this.mapId).currentProjection}`);
      resolve(this.getFeatureInfoAtPixel(map.getPixelFromCoordinate(convertedLocation as Coordinate), layerConfig));
    });
    return promisedQueryResult;
  }

  /** ***************************************************************************************************************************
   * Return feature information for all the features in the provided bounding box.
   *
   * @param {Coordinate} location The coordinate that will be used by the query.
   * @param {TypeLayerEntryConfig} layerConfig The layer configuration.
   *
   * @returns {Promise<TypeArrayOfRecords>} The feature info table.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected getFeatureInfoUsingBBox(location: Coordinate[], layerConfig: TypeLayerEntryConfig): Promise<TypeArrayOfRecords> {
    const promisedQueryResult = new Promise<TypeArrayOfRecords>((resolve) => {
      resolve([]);
    });
    return promisedQueryResult;
  }

  /** ***************************************************************************************************************************
   * Return feature information for all the features in the provided polygon.
   *
   * @param {Coordinate} location The coordinate that will be used by the query.
   * @param {TypeLayerEntryConfig} layerConfig The layer configuration.
   *
   * @returns {Promise<TypeArrayOfRecords>} The feature info table.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected getFeatureInfoUsingPolygon(location: Coordinate[], layerConfig: TypeLayerEntryConfig): Promise<TypeArrayOfRecords> {
    const promisedQueryResult = new Promise<TypeArrayOfRecords>((resolve) => {
      resolve([]);
    });
    return promisedQueryResult;
  }
}
