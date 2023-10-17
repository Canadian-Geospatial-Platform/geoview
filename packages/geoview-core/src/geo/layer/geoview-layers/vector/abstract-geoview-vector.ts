/* eslint-disable no-param-reassign, no-var */
import Feature from 'ol/Feature';
import { Cluster, Vector as VectorSource } from 'ol/source';
import { Options as SourceOptions } from 'ol/source/Vector';
import { VectorImage as VectorLayer } from 'ol/layer';
import { Options as VectorLayerOptions } from 'ol/layer/VectorImage';
import { Geometry, Point } from 'ol/geom';
import { all, bbox } from 'ol/loadingstrategy';
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
} from '@/geo/map/map-schema-types';
import { api } from '@/app';
import { getLocalizedValue } from '@/core/utils/utilities';
import { TypeArrayOfFeatureInfoEntries } from '@/api/events/payloads';
import { NodeType } from '@/geo/renderer/geoview-renderer-types';

/* *******************************************************************************************************************************
 * AbstractGeoViewVector types
 */

// Base type used to keep the layer's hierarchical structure. It is similar to ol/layer/Base~BaseLayer.
export type TypeVectorLayerGroup = LayerGroup;
export type TypeVectorLayer = VectorSource<Geometry>;
export type TypeBaseVectorLayer = BaseLayer | TypeVectorLayerGroup | TypeVectorLayer;

// ******************************************************************************************************************************
// ******************************************************************************************************************************
/** *****************************************************************************************************************************
 * The AbstractGeoViewVector class is a direct descendant of AbstractGeoViewLayer. As its name indicates, it is used to
 * instanciate GeoView vector layers. It inherits from its parent class an attribute named olLayers where the vector elements
 * of the class will be kept.
 *
 * The olLayers attribute has a hierarchical structure. Its data type is TypeBaseVectorLayer. Subclasses of this type are
 * BaseLayer, TypeVectorLayerGroup and TypeVectorLayer. The TypeVectorLayerGroup is a collection of TypeBaseVectorLayer. It is
 * important to note that a TypeBaseVectorLayer attribute can polymorphically refer to a TypeVectorLayerGroup or a
 * TypeVectorLayer. Here, we must not confuse instantiation and declaration of a polymorphic attribute.
 *
 * All leaves of the tree structure stored in the olLayers attribute must be of type TypeVectorLayer. This is where the
 * features are placed and can be considered as a feature group.
 */
// ******************************************************************************************************************************
export abstract class AbstractGeoViewVector extends AbstractGeoViewLayer {
  /** ***************************************************************************************************************************
   * This method recursively validates the configuration of the layer entries to ensure that each layer is correctly defined. If
   * necessary, additional code can be executed in the child method to complete the layer configuration.
   *
   * @param {TypeListOfLayerEntryConfig} listOfLayerEntryConfig The list of layer entries configuration to validate.
   */
  protected abstract validateListOfLayerEntryConfig(listOfLayerEntryConfig: TypeListOfLayerEntryConfig): void;

  /** ***************************************************************************************************************************
   * This method creates a GeoView layer using the definition provided in the layerEntryConfig parameter.
   *
   * @param {TypeLayerEntryConfig} layerEntryConfig Information needed to create the GeoView layer.
   *
   * @returns {Promise<BaseLayer | null>} The GeoView base layer that has been created.
   */
  protected processOneLayerEntry(layerEntryConfig: TypeBaseLayerEntryConfig): Promise<BaseLayer | null> {
    layerEntryConfig.layerPhase = 'processOneLayerEntry';
    const promisedVectorLayer = new Promise<BaseLayer | null>((resolve) => {
      this.changeLayerPhase('processOneLayerEntry', layerEntryConfig);
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
    sourceOptions: SourceOptions = {},
    readOptions: ReadOptions = {}
  ): VectorSource<Geometry> {
    // The line below uses var because a var declaration has a wider scope than a let declaration.
    var vectorSource: VectorSource<Geometry>;
    layerEntryConfig.layerPhase = 'createVectorSource';
    if (this.attributions.length !== 0) sourceOptions.attributions = this.attributions;

    // set loading strategy option
    sourceOptions.strategy = (layerEntryConfig.source! as TypeBaseSourceVectorInitialConfig).strategy === 'bbox' ? bbox : all;

    sourceOptions.loader = (extent, resolution, projection, success, failure) => {
      let url = vectorSource.getUrl();
      if (typeof url === 'function') url = url(extent, resolution, projection);

      const xhr = new XMLHttpRequest();
      if ((layerEntryConfig?.source as TypeBaseSourceVectorInitialConfig)?.postSettings) {
        const { postSettings } = layerEntryConfig.source as TypeBaseSourceVectorInitialConfig;
        xhr.open('POST', url as string);
        if (postSettings!.header)
          Object.keys(postSettings!.header).forEach((headerParameter) => {
            xhr.setRequestHeader(headerParameter, postSettings!.header![headerParameter]);
          });
      } else xhr.open('GET', url as string);
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
          /* For vector layers, all fields of type date must be specified in milliseconds (number) that has elapsed since the epoch,
             which is defined as the midnight at the beginning of January 1, 1970, UTC (equivalent to the UNIX epoch). If the date type
             is not a number, we assume it is provided as an ISO UTC string. If not, the result is unpredictable.
          */
          if (layerEntryConfig.source?.featureInfo?.queryable) {
            const featureInfo = (layerEntryConfig.source as TypeBaseSourceVectorInitialConfig).featureInfo!;
            const fieldTypes = featureInfo.fieldTypes?.split(',');
            const fieldNames = getLocalizedValue(featureInfo.outfields, this.mapId)!.split(',');
            const dateFields = fieldTypes?.reduce<string[]>((accumulator, entryFieldType, i) => {
              if (entryFieldType === 'date') accumulator.push(fieldNames![i]);
              return accumulator;
            }, []);
            if (dateFields?.length) {
              features.forEach((feature) => {
                dateFields.forEach((fieldName) => {
                  let fieldValue = feature.get(fieldName);
                  if (typeof fieldValue === 'number') {
                    let dateString = api.dateUtilities.convertMilisecondsToDate(fieldValue);
                    dateString = api.dateUtilities.applyInputDateFormat(dateString, this.serverDateFragmentsOrder);
                    feature.set(fieldName, api.dateUtilities.convertToMilliseconds(dateString), true);
                  } else {
                    if (!this.serverDateFragmentsOrder)
                      this.serverDateFragmentsOrder = api.dateUtilities.getDateFragmentsOrder(
                        api.dateUtilities.deduceDateFormat(fieldValue)
                      );
                    fieldValue = api.dateUtilities.applyInputDateFormat(fieldValue, this.serverDateFragmentsOrder);
                    feature.set(fieldName, api.dateUtilities.convertToMilliseconds(fieldValue), true);
                  }
                });
              });
            }
          }
          vectorSource.addFeatures(features);
          if (success) success(features);
          layerEntryConfig.olLayer!.changed();
        } else {
          onError();
        }
      };
      xhr.send(JSON.stringify((layerEntryConfig.source as TypeBaseSourceVectorInitialConfig).postSettings?.data));
    };

    vectorSource = new VectorSource(sourceOptions);

    let featuresLoadErrorHandler: () => void;
    const featuresLoadEndHandler = () => {
      this.changeLayerStatus('loaded', layerEntryConfig);
      vectorSource.un('featuresloaderror', featuresLoadErrorHandler);
    };
    featuresLoadErrorHandler = () => {
      this.changeLayerStatus('error', layerEntryConfig);
      vectorSource.un('featuresloadend', featuresLoadEndHandler);
    };

    vectorSource.once('featuresloadend', featuresLoadEndHandler);
    vectorSource.once('featuresloaderror', featuresLoadErrorHandler);

    return vectorSource;
  }

  /** ***************************************************************************************************************************
   * Create a vector layer. The layer has in its properties a reference to the layer entry configuration used at creation time.
   * The layer entry configuration keeps a reference to the layer in the olLayer attribute. If clustering is enabled, creates a
   * cluster source and uses that to create the layer.
   *
   * @param {TypeBaseLayerEntryConfig} layerEntryConfig The layer entry configuration used by the source.
   * @param {VectorSource<Geometry>} vectorSource The source configuration for the vector layer.
   *
   * @returns {VectorLayer<VectorSource>} The vector layer created.
   */
  createVectorLayer(layerEntryConfig: TypeVectorLayerEntryConfig, vectorSource: VectorSource<Geometry>): VectorLayer<VectorSource> {
    layerEntryConfig.layerPhase = 'createVectorLayer';
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
              const geometryExtent = feature.getGeometry()?.getExtent();
              if (geometryExtent) {
                const center = getCenter(geometryExtent) as Coordinate;
                return new Point(center);
              }
              return null;
            }) as (arg0: Feature<Geometry>) => Point,
          })
        : vectorSource,
      style: (feature) => {
        const { geoviewRenderer } = api.maps[this.mapId];

        if (configSource.cluster!.enable) {
          return geoviewRenderer.getClusterStyle(layerEntryConfig, feature);
        }

        if ('style' in layerEntryConfig) {
          return geoviewRenderer.getFeatureStyle(feature, layerEntryConfig);
        }

        return undefined;
      },
    };

    layerEntryConfig.olLayer = new VectorLayer(layerOptions);

    if (layerEntryConfig.initialSettings?.extent !== undefined) this.setExtent(layerEntryConfig.initialSettings?.extent, layerEntryConfig);
    if (layerEntryConfig.initialSettings?.maxZoom !== undefined)
      this.setMaxZoom(layerEntryConfig.initialSettings?.maxZoom, layerEntryConfig);
    if (layerEntryConfig.initialSettings?.minZoom !== undefined)
      this.setMinZoom(layerEntryConfig.initialSettings?.minZoom, layerEntryConfig);
    if (layerEntryConfig.initialSettings?.opacity !== undefined)
      this.setOpacity(layerEntryConfig.initialSettings?.opacity, layerEntryConfig);
    if (layerEntryConfig.initialSettings?.visible !== undefined)
      this.setVisible(
        !!(layerEntryConfig.initialSettings?.visible === 'yes' || layerEntryConfig.initialSettings?.visible === 'always'),
        layerEntryConfig
      );
    this.applyViewFilter(layerEntryConfig, layerEntryConfig.layerFilter ? layerEntryConfig.layerFilter : '');

    return layerEntryConfig.olLayer as VectorLayer<VectorSource>;
  }

  /** ***************************************************************************************************************************
   * Return feature information for all the features stored in the layer.
   *
   * @param {TypeLayerEntryConfig} layerEntryConfig The layer configuration.
   *
   * @returns {TypeArrayOfFeatureInfoEntries} The feature info table.
   */
  protected getAllFeatureInfo(layerEntryConfig: TypeLayerEntryConfig): Promise<TypeArrayOfFeatureInfoEntries> {
    const promisedQueryResult = new Promise<TypeArrayOfFeatureInfoEntries>((resolve) => {
      if (!layerEntryConfig?.olLayer) resolve([]);
      else
        this.formatFeatureInfoResult(
          (layerEntryConfig.olLayer as VectorLayer<VectorSource<Geometry>>).getSource()!.getFeatures(),
          layerEntryConfig as TypeVectorLayerEntryConfig
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
      const { map } = api.maps[this.mapId];
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
    const { map } = api.maps[this.mapId];
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
    const { map } = api.maps[this.mapId];
    const convertedLocation = transform(location, 'EPSG:4326', `EPSG:${api.maps[this.mapId].currentProjection}`);
    return this.getFeatureInfoAtPixel(map.getPixelFromCoordinate(convertedLocation as Coordinate), layerConfig);
  }

  /** ***************************************************************************************************************************
   * Get the bounds of the layer represented in the layerConfig, returns updated bounds
   *
   * @param {TypeLayerEntryConfig} layerConfig Layer config to get bounds from.
   * @param {Extent | undefined} bounds The current bounding box to be adjusted.
   *
   * @returns {Extent} The layer bounding box.
   */
  protected getBounds(layerConfig: TypeLayerEntryConfig, bounds: Extent | undefined): Extent | undefined {
    (layerConfig.olLayer as VectorLayer<VectorSource<Geometry>>).getSource()?.forEachFeature((feature) => {
      const coordinates = feature.get('geometry').flatCoordinates;
      for (let i = 0; i < coordinates.length; i += 2) {
        const geographicCoordinate = transform(
          [coordinates[i], coordinates[i + 1]],
          `EPSG:${api.maps[this.mapId].currentProjection}`,
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
    return bounds;
  }

  /** ***************************************************************************************************************************
   * Apply a view filter to the layer. When the CombineLegendFilter flag is false, the filter paramater is used alone to display
   * the features. Otherwise, the legend filter and the filter parameter are combined together to define the view filter. The
   * legend filters are derived from the uniqueValue or classBreaks style of the layer. When the layer config is invalid, nothing
   * is done.
   *
   * @param {string | TypeLayerEntryConfig} layerPathOrConfig Layer path or configuration.
   * @param {string} filter An optional filter to be used in place of the getViewFilter value.
   * @param {boolean} CombineLegendFilter Flag used to combine the legend filter and the filter together (default: true)
   * @param {boolean} checkCluster An optional value to see if we check for clustered layers.
   */
  applyViewFilter(layerPathOrConfig: string | TypeLayerEntryConfig, filter = '', CombineLegendFilter = true, checkCluster = true) {
    const layerEntryConfig = (
      typeof layerPathOrConfig === 'string' ? this.getLayerConfig(layerPathOrConfig) : layerPathOrConfig
    ) as TypeVectorLayerEntryConfig;
    if (layerEntryConfig) {
      const layerPath = layerEntryConfig.geoviewRootLayer
        ? `${layerEntryConfig.geoviewRootLayer.geoviewLayerId}/${String(layerEntryConfig.layerId).replace('-unclustered', '')}`
        : String(layerEntryConfig.layerId).replace('-unclustered', '');
      const unclusteredLayerPath = `${layerPath}-unclustered`;
      const cluster = !!api.maps[this.mapId].layer.registeredLayers[unclusteredLayerPath];
      if (cluster && checkCluster) {
        this.applyViewFilter(
          api.maps[this.mapId].layer.registeredLayers[layerPath] as TypeVectorLayerEntryConfig,
          filter,
          CombineLegendFilter,
          false
        );
        this.applyViewFilter(
          api.maps[this.mapId].layer.registeredLayers[unclusteredLayerPath] as TypeVectorLayerEntryConfig,
          filter,
          CombineLegendFilter,
          false
        );
        return;
      }
      if (!layerEntryConfig.olLayer) return; // We must wait for the layer to be created.
      let filterValueToUse = filter;
      layerEntryConfig.olLayer!.set('legendFilterIsOff', !CombineLegendFilter);
      if (CombineLegendFilter) layerEntryConfig.olLayer?.set('layerFilter', filter);

      // Convert date constants using the externalFragmentsOrder derived from the externalDateFormat
      const searchDateEntry = [
        ...`${filterValueToUse?.replaceAll(/\s{2,}/g, ' ').trim()} `.matchAll(
          /(?<=^date\b\s')[\d/\-T\s:+Z]{4,25}(?=')|(?<=[(\s]date\b\s')[\d/\-T\s:+Z]{4,25}(?=')/gi
        ),
      ];
      searchDateEntry.reverse();
      searchDateEntry.forEach((dateFound) => {
        // If the date has a time zone, keep it as is, otherwise reverse its time zone by changing its sign
        const reverseTimeZone = ![20, 25].includes(dateFound[0].length);
        const reformattedDate = api.dateUtilities.applyInputDateFormat(dateFound[0], this.externalFragmentsOrder, reverseTimeZone);
        filterValueToUse = `${filterValueToUse!.slice(0, dateFound.index)}${reformattedDate}${filterValueToUse!.slice(
          dateFound.index! + dateFound[0].length
        )}`;
      });

      try {
        const filterEquation = api.maps[this.mapId].geoviewRenderer.analyzeLayerFilter([
          { nodeType: NodeType.unprocessedNode, nodeValue: filterValueToUse },
        ]);
        layerEntryConfig.olLayer?.set('filterEquation', filterEquation);
      } catch (error) {
        throw new Error(
          `Invalid vector layer filter (${(error as { message: string }).message}).\nfilter = ${this.getLayerFilter(
            layerEntryConfig
          )}\ninternal filter = ${filterValueToUse}`
        );
      }

      layerEntryConfig.olLayer?.changed();
    }
  }
}
