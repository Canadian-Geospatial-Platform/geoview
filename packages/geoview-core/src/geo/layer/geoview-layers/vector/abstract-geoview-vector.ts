/* eslint-disable no-param-reassign, no-var */
import Feature from 'ol/Feature';
import { Cluster, Vector as VectorSource } from 'ol/source';
import { Options as SourceOptions } from 'ol/source/Vector';
import { VectorImage as VectorLayer } from 'ol/layer';
import { Options as VectorLayerOptions } from 'ol/layer/VectorImage';
import { Geometry, Point, Polygon, LineString, MultiPoint } from 'ol/geom';
import { all } from 'ol/loadingstrategy';
import { ReadOptions } from 'ol/format/Feature';
import BaseLayer from 'ol/layer/Base';
import LayerGroup from 'ol/layer/Group';
import { Coordinate } from 'ol/coordinate';
import { getCenter, Extent } from 'ol/extent';
import { Pixel } from 'ol/pixel';
import { transform } from 'ol/proj';

import { AbstractGeoViewLayer } from '../abstract-geoview-layers';
import {
  TypeBaseLayerEntryConfig,
  TypeBaseSourceVectorInitialConfig,
  TypeLayerEntryConfig,
  TypeListOfLayerEntryConfig,
  TypeVectorLayerEntryConfig,
  layerEntryIsGroupLayer,
} from '../../../map/map-schema-types';
import { api } from '../../../../app';
import { TypeArrayOfFeatureInfoEntries } from '../../../../api/events/payloads/get-feature-info-payload';
import { NodeType } from '../../../renderer/geoview-renderer-types';

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
      const vectorLayer = this.createVectorLayer(layerEntryConfig as TypeVectorLayerEntryConfig, vectorSource);
      resolve(vectorLayer);
    });
    return promisedVectorLayer;
  }

  /** ***************************************************************************************************************************
   * Create a source configuration for the vector layer.
   *
   * @param {TypeBaseLayerEntryConfig} layerEntryConfig The layer entry configuration.
   * @param {SourceOptions} sourceOptions The source options (default: { strategy: all }).
   * @param {ReadOptions} readOptions The read options (default: {}).
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
   * The layer entry configuration keeps a reference to the layer in the gvLayer attribute. If clustering is enabled, creates a
   * cluster source and uses that to create the layer.
   *
   * @param {TypeBaseLayerEntryConfig} layerEntryConfig The layer entry configuration used by the source.
   * @param {VectorSource<Geometry>} vectorSource The source configuration for the vector layer.
   *
   * @returns {VectorLayer<VectorSource>} The vector layer created.
   */
  private createVectorLayer(layerEntryConfig: TypeVectorLayerEntryConfig, vectorSource: VectorSource<Geometry>): VectorLayer<VectorSource> {
    let configSource: TypeBaseSourceVectorInitialConfig = {};
    if (layerEntryConfig.source !== undefined) {
      configSource = layerEntryConfig.source as TypeBaseSourceVectorInitialConfig;
      if (configSource.cluster === undefined) {
        configSource.cluster = { enable: false };
      }
    } else {
      configSource = { cluster: { enable: false } };
    }

    const layerOptions: VectorLayerOptions<VectorSource> = {
      properties: { layerEntryConfig },
      source: configSource.cluster!.enable
        ? new Cluster({
            source: vectorSource,
            distance: configSource.cluster!.distance,
            minDistance: configSource.cluster!.minDistance,
            geometryFunction: ((feature): Point | null => {
              if (feature.getGeometry() instanceof Polygon) {
                const geometry = feature.getGeometry() as Polygon;
                return geometry.getInteriorPoint() !== undefined ? geometry.getInteriorPoint() : null;
              }

              if (feature.getGeometry() instanceof LineString) {
                const geometry = feature.getGeometry() as LineString;
                return geometry.getCoordinateAt(0.5) !== undefined ? new Point(geometry.getCoordinateAt(0.5)) : null;
              }

              if (feature.getGeometry() instanceof Point) {
                return feature.getGeometry() !== undefined ? (feature.getGeometry() as Point) : null;
              }

              if (feature.getGeometry() instanceof MultiPoint) {
                const geometry = feature.getGeometry() as MultiPoint;
                const center = getCenter(geometry.getExtent() as Extent) as Coordinate;
                return center !== undefined ? new Point(center) : null;
              }

              return null;
            }) as (arg0: Feature<Geometry>) => Point,
          })
        : vectorSource,
      style: (feature) => {
        const { geoviewRenderer } = api.map(this.mapId);

        if (configSource.cluster!.enable) {
          return geoviewRenderer.getClusterStyle(feature, layerEntryConfig);
        }

        if ('style' in layerEntryConfig) {
          return geoviewRenderer.getFeatureStyle(feature, layerEntryConfig);
        }

        return undefined;
      },
    };

    layerEntryConfig.gvLayer = new VectorLayer(layerOptions);
    layerEntryConfig.gvLayer?.set('layerFilter', layerEntryConfig.layerFilter);
    this.applyViewFilter(layerEntryConfig);

    return layerEntryConfig.gvLayer as VectorLayer<VectorSource>;
  }

  /** ***************************************************************************************************************************
   * Return feature information for all the features stored in the layer.
   *
   * @param {string | TypeLayerEntryConfig | null} layerPathOrConfig Optional layer path or configuration.
   *
   * @returns {TypeArrayOfFeatureInfoEntries} The feature info table.
   */
  getAllFeatureInfo(
    layerPathOrConfig: string | TypeLayerEntryConfig | null | undefined = this.activeLayer
  ): Promise<TypeArrayOfFeatureInfoEntries> {
    const promisedQueryResult = new Promise<TypeArrayOfFeatureInfoEntries>((resolve) => {
      const layerConfig = typeof layerPathOrConfig === 'string' ? this.getLayerConfig(layerPathOrConfig) : layerPathOrConfig;
      if (!layerConfig?.gvLayer) resolve([]);
      else
        this.formatFeatureInfoResult(
          (layerConfig.gvLayer as VectorLayer<VectorSource<Geometry>>).getSource()!.getFeatures(),
          layerConfig as TypeVectorLayerEntryConfig
        ).then((arrayOfFeatureInfoEntries) => {
          resolve(arrayOfFeatureInfoEntries);
        });
    });
    return promisedQueryResult;
  }

  /** ***************************************************************************************************************************
   * Return feature information for all the features around the provided Pixel.
   *
   * @param {Coordinate} location The pixel coordinate that will be used by the query.
   * @param {TypeLayerEntryConfig} layerConfig The layer configuration.
   *
   * @returns {Promise<TypeArrayOfFeatureInfoEntries>} The feature info table.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected getFeatureInfoAtPixel(location: Pixel, layerConfig: TypeLayerEntryConfig): Promise<TypeArrayOfFeatureInfoEntries> {
    const promisedQueryResult = new Promise<TypeArrayOfFeatureInfoEntries>((resolve) => {
      const layerFilter = (layer: BaseLayer) => {
        const layerSource = layer.get('layerEntryConfig')?.source;
        const configSource = layerConfig?.source;
        return layerSource !== undefined && configSource !== undefined && layerSource === configSource;
      };
      const { map } = api.map(this.mapId);
      const features = map.getFeaturesAtPixel(location, { hitTolerance: 4, layerFilter });
      this.formatFeatureInfoResult(features as Feature<Geometry>[], layerConfig as TypeVectorLayerEntryConfig).then(
        (arrayOfFeatureInfoEntries) => {
          resolve(arrayOfFeatureInfoEntries);
        }
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
   * @returns {Promise<TypeArrayOfFeatureInfoEntries>} The feature info table.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected getFeatureInfoAtCoordinate(location: Coordinate, layerConfig: TypeLayerEntryConfig): Promise<TypeArrayOfFeatureInfoEntries> {
    const { map } = api.map(this.mapId);
    return this.getFeatureInfoAtPixel(map.getPixelFromCoordinate(location as Coordinate), layerConfig);
  }

  /** ***************************************************************************************************************************
   * Return feature information for all the features around the provided longitude latitude.
   *
   * @param {Coordinate} location The coordinate that will be used by the query.
   * @param {TypeLayerEntryConfig} layerConfig The layer configuration.
   *
   * @returns {Promise<TypeArrayOfFeatureInfoEntries>} The feature info table.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected getFeatureInfoAtLongLat(location: Coordinate, layerConfig: TypeLayerEntryConfig): Promise<TypeArrayOfFeatureInfoEntries> {
    const { map } = api.map(this.mapId);
    const convertedLocation = transform(location, 'EPSG:4326', `EPSG:${api.map(this.mapId).currentProjection}`);
    return this.getFeatureInfoAtPixel(map.getPixelFromCoordinate(convertedLocation as Coordinate), layerConfig);
  }

  /** ***************************************************************************************************************************
   * Return feature information for all the features in the provided bounding box.
   *
   * @param {Coordinate} location The coordinate that will be used by the query.
   * @param {TypeLayerEntryConfig} layerConfig The layer configuration.
   *
   * @returns {Promise<TypeArrayOfFeatureInfoEntries>} The feature info table.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected getFeatureInfoUsingBBox(location: Coordinate[], layerConfig: TypeLayerEntryConfig): Promise<TypeArrayOfFeatureInfoEntries> {
    const promisedQueryResult = new Promise<TypeArrayOfFeatureInfoEntries>((resolve) => {
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
   * @returns {Promise<TypeArrayOfFeatureInfoEntries>} The feature info table.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected getFeatureInfoUsingPolygon(location: Coordinate[], layerConfig: TypeLayerEntryConfig): Promise<TypeArrayOfFeatureInfoEntries> {
    const promisedQueryResult = new Promise<TypeArrayOfFeatureInfoEntries>((resolve) => {
      resolve([]);
    });
    return promisedQueryResult;
  }

  /** ***************************************************************************************************************************
   * Compute the layer bounds or undefined if the result can not be obtained from le feature extents that compose the layer. If
   * layerPathOrConfig is undefined, the active layer is used. If projectionCode is defined, returns the bounds in the specified
   * projection otherwise use the map projection. The bounds are different from the extent. They are mainly used for display
   * purposes to show the bounding box in which the data resides and to zoom in on the entire layer data. It is not used by
   * openlayer to limit the display of data on the map.
   *
   * @param {string | TypeLayerEntryConfig | TypeListOfLayerEntryConfig | null} layerPathOrConfig Optional layer path or
   * configuration.
   * @param {string | number | undefined} projectionCode Optional projection code to use for the returned bounds.
   *
   * @returns {Extent} The layer bounding box.
   */
  calculateBounds(
    layerPathOrConfig: string | TypeLayerEntryConfig | TypeListOfLayerEntryConfig | null = this.activeLayer,
    projectionCode: string | number | undefined = undefined
  ): Extent | undefined {
    let bounds: Extent | undefined;
    const processGroupLayerBounds = (listOfLayerEntryConfig: TypeListOfLayerEntryConfig) => {
      listOfLayerEntryConfig.forEach((layerConfig) => {
        if (layerEntryIsGroupLayer(layerConfig)) processGroupLayerBounds(layerConfig.listOfLayerEntryConfig);
        else {
          (layerConfig.gvLayer as VectorLayer<VectorSource<Geometry>>).getSource()?.forEachFeature((feature) => {
            const coordinates = feature.get('geometry').flatCoordinates;
            for (let i = 0; i < coordinates.length; i += 2) {
              const geographicCoordinate = transform(
                [coordinates[i], coordinates[i + 1]],
                `EPSG:${api.map(this.mapId).currentProjection}`,
                `EPSG:4326`
              );
              if (geographicCoordinate) {
                if (!bounds) bounds = [geographicCoordinate[0], geographicCoordinate[1], geographicCoordinate[0], geographicCoordinate[1]];
                else {
                  bounds = [
                    Math.min(geographicCoordinate[0], bounds[0]),
                    Math.min(geographicCoordinate[1], bounds[1]),
                    Math.max(geographicCoordinate[0], bounds[2]),
                    Math.max(geographicCoordinate[1], bounds[3]),
                  ];
                }
              }
            }
          });
        }
      });
    };
    const rootLayerConfig = typeof layerPathOrConfig === 'string' ? this.getLayerConfig(layerPathOrConfig) : layerPathOrConfig;
    if (rootLayerConfig) {
      if (Array.isArray(rootLayerConfig)) processGroupLayerBounds(rootLayerConfig);
      else processGroupLayerBounds([rootLayerConfig]);
      if (projectionCode && bounds) {
        const minXY = transform([bounds[0], bounds[1]], `EPSG:4326`, `EPSG:${projectionCode}`);
        const maxXY = transform([bounds[2], bounds[3]], `EPSG:4326`, `EPSG:${projectionCode}`);
        bounds = [minXY[0], minXY[1], maxXY[0], maxXY[1]];
      }
    }
    return bounds;
  }

  /** ***************************************************************************************************************************
   * Apply a view filter to the layer. When the optional filter parameter is not empty (''), it is used alone to display the
   * features. Otherwise, the legend filter and the layerFilter are used to define the view filter and the resulting filter is
   * (legend filters) and (layerFilter). The legend filters are derived from the uniqueValue or classBreaks style of the layer.
   * When the layer config is invalid, nothing is done.
   *
   * @param {string | TypeLayerEntryConfig | null} layerPathOrConfig Optional layer path or configuration.
   * @param {string} filter An optional filter to be used in place of the getViewFilter value.
   */
  applyViewFilter(layerPathOrConfig: string | TypeLayerEntryConfig | null = this.activeLayer, filter = '') {
    const layerEntryConfig = (
      typeof layerPathOrConfig === 'string' ? this.getLayerConfig(layerPathOrConfig) : layerPathOrConfig
    ) as TypeVectorLayerEntryConfig;
    if (layerEntryConfig) {
      try {
        const layerFilter = this.getLayerFilter(layerEntryConfig);
        const nodeValue = filter || layerFilter || '';
        const { geoviewRenderer } = api.map(this.mapId);
        const filterEquation = geoviewRenderer.analyzeLayerFilter([{ nodeType: NodeType.unprocessedNode, nodeValue }]);
        layerEntryConfig.gvLayer!.set('filterEquation', filterEquation);
      } catch (error) {
        throw new Error(`Invalid vector layer filter (${(error as { message: string }).message}).\nfilter = ${filter}`);
      }
      layerEntryConfig.gvLayer!.set('legendFilterIsOff', !!filter);
      layerEntryConfig.gvLayer?.changed();
    }
  }

  /** ***************************************************************************************************************************
   * Set the layerFilter that will be applied with the legend filters derived from the uniqueValue or classBreabs style of
   * the layer. The resulting filter will be (legend filters) and (layerFilter). When the layer config is invalid, nothing is
   * done.
   *
   * @param {string} filterValue The filter to associate to the layer.
   * @param {string | TypeLayerEntryConfig | null} layerPathOrConfig Optional layer path or configuration.
   */
  setLayerFilter(filterValue: string, layerPathOrConfig: string | TypeLayerEntryConfig | null = this.activeLayer) {
    const layerEntryConfig = (
      typeof layerPathOrConfig === 'string' ? this.getLayerConfig(layerPathOrConfig) : layerPathOrConfig
    ) as TypeVectorLayerEntryConfig;
    if (layerEntryConfig) {
      try {
        const filterEquation = api
          .map(this.mapId)
          .geoviewRenderer.analyzeLayerFilter([{ nodeType: NodeType.unprocessedNode, nodeValue: filterValue }]);
        layerEntryConfig.gvLayer?.set('filterEquation', filterEquation);
      } catch (error) {
        throw new Error(`Invalid vector layer filter (${(error as { message: string }).message}).\nfilter = ${filterValue}`);
      }
      layerEntryConfig.gvLayer?.set('layerFilter', filterValue);
    }
  }

  /** ***************************************************************************************************************************
   * Get the layerFilter that is associated to the layer. Returns undefined when the layer config is invalid.
   * If layerPathOrConfig is undefined, this.activeLayer is used.
   *
   * @param {string | TypeLayerEntryConfig | null} layerPathOrConfig Optional layer path or configuration.
   *
   * @returns {string | undefined} The filter associated to the layer or undefined.
   */
  getLayerFilter(layerPathOrConfig: string | TypeLayerEntryConfig | null = this.activeLayer): string | undefined {
    const layerEntryConfig = (
      typeof layerPathOrConfig === 'string' ? this.getLayerConfig(layerPathOrConfig) : layerPathOrConfig
    ) as TypeVectorLayerEntryConfig;
    if (layerEntryConfig) return layerEntryConfig.gvLayer?.get('layerFilter');
    return undefined;
  }
}
