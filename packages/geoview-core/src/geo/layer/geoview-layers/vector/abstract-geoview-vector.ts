/* eslint-disable no-console, no-param-reassign, no-var */
import Feature from 'ol/Feature';
import { Vector as VectorSource } from 'ol/source';
import { Options as SourceOptions } from 'ol/source/Vector';
import { VectorImage as VectorLayer } from 'ol/layer';
import { Options as VectorLayerOptions } from 'ol/layer/VectorImage';
import { all, bbox } from 'ol/loadingstrategy';
import { ReadOptions } from 'ol/format/Feature';
import BaseLayer from 'ol/layer/Base';
import LayerGroup from 'ol/layer/Group';
import { Coordinate } from 'ol/coordinate';
import { Extent } from 'ol/extent';
import { Pixel } from 'ol/pixel';
import { transform, transformExtent } from 'ol/proj';

import { AbstractGeoViewLayer } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import {
  TypeBaseLayerEntryConfig,
  TypeBaseSourceVectorInitialConfig,
  TypeLayerEntryConfig,
  TypeListOfLayerEntryConfig,
  TypeVectorLayerEntryConfig,
} from '@/geo/map/map-schema-types';
import { Layer } from '@/geo/layer/layer';
import { api } from '@/app';
import { getLocalizedValue, getMinOrMaxExtents } from '@/core/utils/utilities';
import { TypeArrayOfFeatureInfoEntries } from '@/api/events/payloads';
import { NodeType } from '@/geo/renderer/geoview-renderer-types';
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';

/* *******************************************************************************************************************************
 * AbstractGeoViewVector types
 */

// Base type used to keep the layer's hierarchical structure. It is similar to ol/layer/Base~BaseLayer.
export type TypeVectorLayerGroup = LayerGroup;
export type TypeVectorLayer = VectorSource<Feature>;
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
   * This method creates a GeoView layer using the definition provided in the layerConfig parameter.
   *
   * @param {TypeLayerEntryConfig} layerConfig Information needed to create the GeoView layer.
   *
   * @returns {Promise<BaseLayer | null>} The GeoView base layer that has been created.
   */
  protected processOneLayerEntry(layerConfig: TypeBaseLayerEntryConfig): Promise<BaseLayer | null> {
    this.setLayerPhase('processOneLayerEntry', Layer.getLayerPath(layerConfig));
    const vectorSource = this.createVectorSource(layerConfig);
    const vectorLayer = this.createVectorLayer(layerConfig as TypeVectorLayerEntryConfig, vectorSource);
    return Promise.resolve(vectorLayer);
  }

  /** ***************************************************************************************************************************
   * Create a source configuration for the vector layer.
   *
   * @param {TypeBaseLayerEntryConfig} layerConfig The layer entry configuration.
   * @param {SourceOptions} sourceOptions The source options (default: { strategy: all }).
   * @param {ReadOptions} readOptions The read options (default: {}).
   *
   * @returns {VectorSource<Geometry>} The source configuration that will be used to create the vector layer.
   */
  protected createVectorSource(
    layerConfig: TypeBaseLayerEntryConfig,
    sourceOptions: SourceOptions = {},
    readOptions: ReadOptions = {}
  ): VectorSource<Feature> {
    const layerPath = Layer.getLayerPath(layerConfig);
    // The line below uses var because a var declaration has a wider scope than a let declaration.
    var vectorSource: VectorSource<Feature>;
    this.setLayerPhase('createVectorSource', layerPath);
    if (this.attributions.length !== 0) sourceOptions.attributions = this.attributions;

    // set loading strategy option
    sourceOptions.strategy = (layerConfig.source! as TypeBaseSourceVectorInitialConfig).strategy === 'bbox' ? bbox : all;

    sourceOptions.loader = (extent, resolution, projection, success, failure) => {
      let url = vectorSource.getUrl();
      if (typeof url === 'function') url = url(extent, resolution, projection);

      const xhr = new XMLHttpRequest();
      if ((layerConfig?.source as TypeBaseSourceVectorInitialConfig)?.postSettings) {
        const { postSettings } = layerConfig.source as TypeBaseSourceVectorInitialConfig;
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
          }) as Feature[];
          /* For vector layers, all fields of type date must be specified in milliseconds (number) that has elapsed since the epoch,
             which is defined as the midnight at the beginning of January 1, 1970, UTC (equivalent to the UNIX epoch). If the date type
             is not a number, we assume it is provided as an ISO UTC string. If not, the result is unpredictable.
          */
          if (layerConfig.source?.featureInfo?.queryable) {
            const featureInfo = (layerConfig.source as TypeBaseSourceVectorInitialConfig).featureInfo!;
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
                    (feature as Feature).set(fieldName, api.dateUtilities.convertToMilliseconds(dateString), true);
                  } else {
                    if (!this.serverDateFragmentsOrder)
                      this.serverDateFragmentsOrder = api.dateUtilities.getDateFragmentsOrder(
                        api.dateUtilities.deduceDateFormat(fieldValue)
                      );
                    fieldValue = api.dateUtilities.applyInputDateFormat(fieldValue, this.serverDateFragmentsOrder);
                    (feature as Feature).set(fieldName, api.dateUtilities.convertToMilliseconds(fieldValue), true);
                  }
                });
              });
            }
          }
          vectorSource.addFeatures(features);
          if (success) success(features as Feature[]);
          layerConfig.olLayer!.changed();
        } else {
          onError();
        }
      };
      xhr.send(JSON.stringify((layerConfig.source as TypeBaseSourceVectorInitialConfig).postSettings?.data));
    };

    vectorSource = new VectorSource(sourceOptions);

    let featuresLoadErrorHandler: () => void;
    const featuresLoadEndHandler = () => {
      this.setLayerStatus('loaded', layerPath);
      vectorSource.un('featuresloaderror', featuresLoadErrorHandler);
    };
    featuresLoadErrorHandler = () => {
      this.setLayerStatus('error', layerPath);
      vectorSource.un('featuresloadend', featuresLoadEndHandler);
    };

    vectorSource.once('featuresloadend', featuresLoadEndHandler);
    vectorSource.once('featuresloaderror', featuresLoadErrorHandler);

    return vectorSource;
  }

  /** ***************************************************************************************************************************
   * Create a vector layer. The layer has in its properties a reference to the layer configuration used at creation time.
   * The layer entry configuration keeps a reference to the layer in the olLayer attribute.
   *
   * @param {TypeBaseLayerEntryConfig} layerConfig The layer entry configuration used by the source.
   * @param {VectorSource<Feature>} vectorSource The source configuration for the vector layer.
   *
   * @returns {VectorLayer<VectorSource>} The vector layer created.
   */
  protected createVectorLayer(layerConfig: TypeVectorLayerEntryConfig, vectorSource: VectorSource<Feature>): VectorLayer<VectorSource> {
    const layerPath = Layer.getLayerPath(layerConfig);
    this.setLayerPhase('createVectorLayer');

    const layerOptions: VectorLayerOptions<VectorSource> = {
      properties: { layerConfig },
      source: vectorSource as VectorSource<Feature>,
      style: (feature) => {
        if ('style' in layerConfig) {
          const { geoviewRenderer } = api.maps[this.mapId];
          return geoviewRenderer.getFeatureStyle(feature as Feature, layerConfig);
        }

        return undefined;
      },
    };

    layerConfig.olLayer = new VectorLayer(layerOptions);

    if (layerConfig.initialSettings?.extent !== undefined) this.setExtent(layerConfig.initialSettings?.extent, layerPath);
    if (layerConfig.initialSettings?.maxZoom !== undefined) this.setMaxZoom(layerConfig.initialSettings?.maxZoom, layerPath);
    if (layerConfig.initialSettings?.minZoom !== undefined) this.setMinZoom(layerConfig.initialSettings?.minZoom, layerPath);
    if (layerConfig.initialSettings?.opacity !== undefined) this.setOpacity(layerConfig.initialSettings?.opacity, layerPath);
    if (layerConfig.initialSettings?.visible !== undefined) this.setVisible(layerConfig.initialSettings?.visible !== 'no', layerPath);
    this.applyViewFilter(layerPath, layerConfig.layerFilter ? layerConfig.layerFilter : '');

    return layerConfig.olLayer as VectorLayer<VectorSource>;
  }

  /** ***************************************************************************************************************************
   * Return feature information for all the features stored in the layer.
   *
   * @param {string} layerPath The layer path to the layer's configuration.
   *
   * @returns {TypeArrayOfFeatureInfoEntries} The feature info table.
   */
  protected async getAllFeatureInfo(layerPath: string): Promise<TypeArrayOfFeatureInfoEntries> {
    const layerConfig = this.getLayerConfig(layerPath) as TypeLayerEntryConfig;
    if (!layerConfig?.olLayer) return [];

    try {
      const arrayOfFeatureInfoEntries = await this.formatFeatureInfoResult(
        (layerConfig.olLayer as VectorLayer<VectorSource>).getSource()!.getFeatures(),
        layerConfig as TypeVectorLayerEntryConfig
      );
      return arrayOfFeatureInfoEntries;
    } catch (error) {
      console.log(error);
      return [];
    }
  }

  /** ***************************************************************************************************************************
   * Return feature information for all the features around the provided Pixel.
   *
   * @param {Coordinate} location The pixel coordinate that will be used by the query.
   * @param {string} layerPath The layer path to the layer's configuration.
   *
   * @returns {Promise<TypeArrayOfFeatureInfoEntries>} The feature info table.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected async getFeatureInfoAtPixel(location: Pixel, layerPath: string): Promise<TypeArrayOfFeatureInfoEntries> {
    try {
      const layerConfig = this.getLayerConfig(layerPath) as TypeLayerEntryConfig;
      const layerFilter = (layer: BaseLayer) => {
        const layerSource = layer.get('layerConfig')?.source;
        const configSource = layerConfig?.source;
        return layerSource !== undefined && configSource !== undefined && layerSource === configSource;
      };
      const { map } = api.maps[this.mapId];
      const features = map.getFeaturesAtPixel(location, { hitTolerance: 4, layerFilter });
      return await this.formatFeatureInfoResult(features as Feature[], layerConfig as TypeVectorLayerEntryConfig);
    } catch (error) {
      console.log('abstract-geoview-vector.getFeatureInfoAtPixel\n', error);
      return null;
    }
  }

  /** ***************************************************************************************************************************
   * Return feature information for all the features around the provided projected coordinate.
   *
   * @param {Coordinate} location The pixel coordinate that will be used by the query.
   * @param {string} layerPath The layer path to the layer's configuration.
   *
   * @returns {Promise<TypeArrayOfFeatureInfoEntries>} The feature info table.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected getFeatureInfoAtCoordinate(location: Coordinate, layerPath: string): Promise<TypeArrayOfFeatureInfoEntries> {
    const { map } = api.maps[this.mapId];
    return this.getFeatureInfoAtPixel(map.getPixelFromCoordinate(location as Coordinate), layerPath);
  }

  /** ***************************************************************************************************************************
   * Return feature information for all the features around the provided longitude latitude.
   *
   * @param {Coordinate} location The coordinate that will be used by the query.
   * @param {string} layerPath The layer path to the layer's configuration.
   *
   * @returns {Promise<TypeArrayOfFeatureInfoEntries>} The feature info table.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected getFeatureInfoAtLongLat(location: Coordinate, layerPath: string): Promise<TypeArrayOfFeatureInfoEntries> {
    const { map } = api.maps[this.mapId];
    const convertedLocation = transform(location, 'EPSG:4326', `EPSG:${MapEventProcessor.getMapState(this.mapId).currentProjection}`);
    return this.getFeatureInfoAtPixel(map.getPixelFromCoordinate(convertedLocation as Coordinate), layerPath);
  }

  /** ***************************************************************************************************************************
   * Get the bounds of the layer represented in the layerConfig, returns updated bounds
   *
   * @param {string} layerPath The Layer path to the layer's configuration.
   * @param {Extent | undefined} bounds The current bounding box to be adjusted.
   *
   * @returns {Extent} The layer bounding box.
   */
  getBounds(layerPath: string, bounds: Extent | undefined): Extent | undefined {
    const layerConfig = this.getLayerConfig(layerPath);
    const layerBounds = (layerConfig?.olLayer as VectorLayer<VectorSource>)?.getExtent();
    const projection =
      (layerConfig?.olLayer as VectorLayer<VectorSource>).getSource()?.getProjection()?.getCode().replace('EPSG:', '') ||
      MapEventProcessor.getMapState(this.mapId).currentProjection;

    if (layerBounds) {
      const transformedBounds = transformExtent(layerBounds, `EPSG:${projection}`, `EPSG:4326`);
      if (!bounds) bounds = [transformedBounds[0], transformedBounds[1], transformedBounds[2], transformedBounds[3]];
      else bounds = getMinOrMaxExtents(bounds, transformedBounds);
    }

    return bounds;
  }

  /** ***************************************************************************************************************************
   * Apply a view filter to the layer. When the CombineLegendFilter flag is false, the filter paramater is used alone to display
   * the features. Otherwise, the legend filter and the filter parameter are combined together to define the view filter. The
   * legend filters are derived from the uniqueValue or classBreaks style of the layer. When the layer config is invalid, nothing
   * is done.
   *
   * @param {string} layerPath The layer path to the layer's configuration.
   * @param {string} filter An optional filter to be used in place of the getViewFilter value.
   * @param {boolean} CombineLegendFilter Flag used to combine the legend filter and the filter together (default: true)
   */
  applyViewFilter(layerPath?: string, filter = '', CombineLegendFilter = true) {
    layerPath = layerPath || api.maps[this.mapId].layer.layerPathAssociatedToTheGeoviewInstance;
    const layerConfig = this.getLayerConfig(layerPath) as TypeVectorLayerEntryConfig;
    if (!layerConfig?.olLayer) return; // We must wait for the layer to be created.

    let filterValueToUse = filter;
    layerConfig.olLayer!.set('legendFilterIsOff', !CombineLegendFilter);
    if (CombineLegendFilter) layerConfig.olLayer?.set('layerFilter', filter);

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
      layerConfig.olLayer?.set('filterEquation', filterEquation);
    } catch (error) {
      throw new Error(
        `Invalid vector layer filter (${(error as { message: string }).message}).\nfilter = ${this.getLayerFilter(
          layerPath
        )}\ninternal filter = ${filterValueToUse}`
      );
    }

    layerConfig.olLayer?.changed();
  }
}
