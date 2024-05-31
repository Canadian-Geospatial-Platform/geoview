/* eslint-disable no-param-reassign */
// We have many reassign for layerPath-sourceOptions. We keep it global...
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

import { TypeLocalizedString } from '@config/types/map-schema-types';

import { AbstractGeoViewLayer, CONST_LAYER_TYPES } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { TypeBaseSourceVectorInitialConfig, TypeFeatureInfoEntry, TypeLayerEntryConfig } from '@/geo/map/map-schema-types';
import { getLocalizedValue } from '@/core/utils/utilities';
import { DateMgt } from '@/core/utils/date-mgt';
import { getMinOrMaxExtents } from '@/geo/utils/utilities';
import { NodeType } from '@/geo/utils/renderer/geoview-renderer-types';
import { VECTOR_LAYER } from '@/core/utils/constant';
import { logger } from '@/core/utils/logger';
import { CSV } from './csv';
import { VectorLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-layer-entry-config';
import { AbstractBaseLayerEntryConfig } from '@/core/utils/config/validation-classes/abstract-base-layer-entry-config';
import { Cast } from '@/core/types/global-types';
import { AppEventProcessor } from '@/api/event-processors/event-processor-children/app-event-processor';
import { analyzeLayerFilter, getFeatureStyle } from '@/geo/utils/renderer/geoview-renderer';

/* *******************************************************************************************************************************
 * AbstractGeoViewVector types
 */

// Base type used to keep the layer's hierarchical structure. It is similar to ol/layer/Base~BaseLayer.
export type TypeVectorLayerGroup = LayerGroup;
export type TypeVectorLayer = VectorSource<Feature>;
export type TypeBaseVectorLayer = BaseLayer | TypeVectorLayerGroup | TypeVectorLayer;

/**
 * Determine if layer instance is a vector layer
 *
 * @param {AbstractGeoViewLayer} layer the layer to check
 * @returns {boolean} true if layer is a vector layer
 */
export const isVectorLayer = (layer: AbstractGeoViewLayer): boolean => {
  return layer?.type in VECTOR_LAYER;
};

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
// GV Layers Refactoring - Obsolete (in layers)
export abstract class AbstractGeoViewVector extends AbstractGeoViewLayer {
  /** ***************************************************************************************************************************
   * This method recursively validates the configuration of the layer entries to ensure that each layer is correctly defined. If
   * necessary, additional code can be executed in the child method to complete the layer configuration.
   *
   * @param {TypeLayerEntryConfig[]} listOfLayerEntryConfig The list of layer entries configuration to validate.
   */
  // GV Layers Refactoring - Obsolete (in config?)
  protected abstract override validateListOfLayerEntryConfig(listOfLayerEntryConfig: TypeLayerEntryConfig[]): void;

  /** ***************************************************************************************************************************
   * Extract the type of the specified field from the metadata. If the type can not be found, return 'string'.
   *
   * @param {string} fieldName field name for which we want to get the type.
   * @param {AbstractBaseLayerEntryConfig} layerConfig layer configuration.
   *
   * @returns {'string' | 'date' | 'number'} The type of the field.
   */
  // GV Layers Refactoring - Obsolete (in layers)
  protected override getFieldType(fieldName: string, layerConfig: AbstractBaseLayerEntryConfig): 'string' | 'date' | 'number' {
    const fieldDefinitions = this.getLayerMetadata(layerConfig.layerPath).source.featureInfo;
    const fieldIndex = getLocalizedValue(
      Cast<TypeLocalizedString>(fieldDefinitions.outfields),
      AppEventProcessor.getDisplayLanguage(this.mapId)
    )
      ?.split(',')
      .indexOf(fieldName);
    if (!fieldIndex || fieldIndex === -1) return 'string';
    return (fieldDefinitions.fieldTypes as string).split(',')[fieldIndex!] as 'string' | 'date' | 'number';
  }

  /** ***************************************************************************************************************************
   * This method creates a GeoView layer using the definition provided in the layerConfig parameter.
   *
   * @param {TypeLayerEntryConfig} layerConfig Information needed to create the GeoView layer.
   *
   * @returns {Promise<BaseLayer | undefined>} The GeoView base layer that has been created.
   */
  // GV Layers Refactoring - Obsolete (in config?, in layers?)
  protected override async processOneLayerEntry(layerConfig: AbstractBaseLayerEntryConfig): Promise<BaseLayer | undefined> {
    // TODO: Refactor - Convert the return type to Promise<VectorLayer<VectorSource> | undefined> once the GeoPackage.processOneLayerEntry is fixed
    // GV IMPORTANT: The processOneLayerEntry method must call the corresponding method of its parent to ensure that the flow of
    // GV            layerStatus values is correctly sequenced.
    await super.processOneLayerEntry(layerConfig);
    const vectorSource = this.createVectorSource(layerConfig);
    const vectorLayer = this.createVectorLayer(layerConfig as VectorLayerEntryConfig, vectorSource);
    return Promise.resolve(vectorLayer);
  }

  /** ***************************************************************************************************************************
   * Create a source configuration for the vector layer.
   *
   * @param {AbstractBaseLayerEntryConfig} layerConfig The layer entry configuration.
   * @param {SourceOptions} sourceOptions The source options (default: { strategy: all }).
   * @param {ReadOptions} readOptions The read options (default: {}).
   *
   * @returns {VectorSource<Geometry>} The source configuration that will be used to create the vector layer.
   */
  // GV Layers Refactoring - Obsolete (in config? in layers?)
  protected createVectorSource(
    layerConfig: AbstractBaseLayerEntryConfig,
    sourceOptions: SourceOptions<Feature> = {},
    readOptions: ReadOptions = {}
  ): VectorSource<Feature> {
    const { layerPath } = layerConfig;
    // The line below uses var because a var declaration has a wider scope than a let declaration.
    let vectorSource: VectorSource<Feature>;
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
      const onError = (): void => {
        vectorSource.removeLoadedExtent(extent);
        if (failure) failure();
      };
      xhr.onerror = onError;
      xhr.onload = () => {
        if (xhr.status === 200) {
          let features: Feature[] | null;
          if (layerConfig.schemaTag === CONST_LAYER_TYPES.CSV) {
            // TODO Refactor - Layers refactoring. There needs to be a convertCsv on both CSV and GVCSV (old layer and new layer) to complete the layers migration
            features = (this.getMapViewer().layer.getGeoviewLayer(layerPath) as CSV).convertCsv(
              xhr.responseText,
              layerConfig as VectorLayerEntryConfig
            );
          } else {
            features = vectorSource.getFormat()!.readFeatures(xhr.responseText, {
              ...readOptions,
              featureProjection: projection,
              extent,
            }) as Feature[];
          }
          /* For vector layers, all fields of type date must be specified in milliseconds (number) that has elapsed since the epoch,
             which is defined as the midnight at the beginning of January 1, 1970, UTC (equivalent to the UNIX epoch). If the date type
             is not a number, we assume it is provided as an ISO UTC string. If not, the result is unpredictable.
          */
          if (layerConfig.source?.featureInfo?.queryable && features) {
            const featureInfo = (layerConfig.source as TypeBaseSourceVectorInitialConfig).featureInfo!;
            const fieldTypes = featureInfo.fieldTypes?.split(',');
            const fieldNames = getLocalizedValue(featureInfo.outfields, AppEventProcessor.getDisplayLanguage(this.mapId))!.split(',');
            const dateFields = fieldTypes?.reduce<string[]>((accumulator, entryFieldType, i) => {
              if (entryFieldType === 'date') accumulator.push(fieldNames![i]);
              return accumulator;
            }, []);
            if (dateFields?.length) {
              features.forEach((feature) => {
                dateFields.forEach((fieldName) => {
                  let fieldValue = feature.get(fieldName);
                  if (typeof fieldValue === 'number') {
                    let dateString = DateMgt.convertMilisecondsToDate(fieldValue);
                    dateString = DateMgt.applyInputDateFormat(dateString, this.serverDateFragmentsOrder);
                    (feature as Feature).set(fieldName, DateMgt.convertToMilliseconds(dateString), true);
                  } else {
                    if (!this.serverDateFragmentsOrder)
                      this.serverDateFragmentsOrder = DateMgt.getDateFragmentsOrder(DateMgt.deduceDateFormat(fieldValue));
                    fieldValue = DateMgt.applyInputDateFormat(fieldValue, this.serverDateFragmentsOrder);
                    (feature as Feature).set(fieldName, DateMgt.convertToMilliseconds(fieldValue), true);
                  }
                });
              });
            }
          }
          if (features) {
            vectorSource.addFeatures(features);
            if (success) success(features as Feature[]);
            const layer = this.getOLLayer(layerConfig.layerPath);
            layer?.changed();
          }
        } else {
          onError();
        }
      };
      xhr.send(JSON.stringify((layerConfig.source as TypeBaseSourceVectorInitialConfig).postSettings?.data));
    };

    vectorSource = new VectorSource(sourceOptions);

    return vectorSource;
  }

  /** ***************************************************************************************************************************
   * Create a vector layer. The layer has in its properties a reference to the layer configuration used at creation time.
   * The layer entry configuration keeps a reference to the layer in the olLayer attribute.
   *
   * @param {VectorLayerEntryConfig} layerConfig The layer entry configuration used by the source.
   * @param {VectorSource<Feature>} vectorSource The source configuration for the vector layer.
   *
   * @returns {VectorLayer<VectorSource>} The vector layer created.
   */
  // GV Layers Refactoring - Obsolete (in config? in layers?)
  protected createVectorLayer(layerConfig: VectorLayerEntryConfig, vectorSource: VectorSource<Feature>): VectorLayer<VectorSource> {
    // TODO: remove link to language, layer should be created in one language and recreated if needed to change
    const language = AppEventProcessor.getDisplayLanguage(this.mapId);

    const layerOptions: VectorLayerOptions<VectorSource> = {
      properties: { layerConfig },
      source: vectorSource as VectorSource<Feature>,
      style: (feature) => {
        if ('style' in layerConfig) {
          return getFeatureStyle(feature as Feature, layerConfig, language);
        }

        return undefined;
      },
    };

    // Create the OpenLayer layer
    const olLayer = new VectorLayer(layerOptions);

    // TODO: Refactor - Wire it up
    this.setLayerAndLoadEndListeners(layerConfig, olLayer, 'features');

    if (layerConfig.initialSettings?.extent !== undefined) this.setExtent(layerConfig.initialSettings.extent, layerConfig.layerPath);
    if (layerConfig.initialSettings?.maxZoom !== undefined) this.setMaxZoom(layerConfig.initialSettings.maxZoom, layerConfig.layerPath);
    if (layerConfig.initialSettings?.minZoom !== undefined) this.setMinZoom(layerConfig.initialSettings.minZoom, layerConfig.layerPath);
    if (layerConfig.initialSettings?.states?.opacity !== undefined)
      this.setOpacity(layerConfig.initialSettings.states.opacity, layerConfig.layerPath);
    // If a layer on the map has an initialSettings.visible set to false, its status will never reach the status 'loaded' because
    // nothing is drawn on the map. We must wait until the 'loaded' status is reached to set the visibility to false. The call
    // will be done in the layerConfig.loadedFunction() which is called right after the 'loaded' signal.

    return olLayer;
  }

  /** ***************************************************************************************************************************
   * Return feature information for all the features stored in the layer.
   *
   * @param {string} layerPath The layer path to the layer's configuration.
   *
   * @returns {Promise<TypeFeatureInfoEntry[] | undefined | null>} The feature info table.
   */
  // GV Layers Refactoring - Obsolete (in layers)
  protected override async getAllFeatureInfo(layerPath: string): Promise<TypeFeatureInfoEntry[] | undefined | null> {
    try {
      // Get the layer config in a loaded phase
      const layerConfig = this.getLayerConfig(layerPath) as VectorLayerEntryConfig;
      const layer = this.getOLLayer(layerPath) as VectorLayer<VectorSource>;
      const features = layer.getSource()!.getFeatures();
      const arrayOfFeatureInfoEntries = await this.formatFeatureInfoResult(features, layerConfig);
      return arrayOfFeatureInfoEntries;
    } catch (error) {
      // Log
      logger.logError('abstract-geoview-vector.getAllFeatureInfo()\n', error);
      return null;
    }
  }

  /** ***************************************************************************************************************************
   * Return feature information for all the features around the provided Pixel.
   *
   * @param {Coordinate} location - The pixel coordinate that will be used by the query.
   * @param {string} layerPath - The layer path to the layer's configuration.
   *
   * @returns {Promise<TypeFeatureInfoEntry[] | undefined | null>} The feature info table or null if an error occured.
   */
  // GV Layers Refactoring - Obsolete (in layers)
  protected override getFeatureInfoAtPixel(location: Pixel, layerPath: string): Promise<TypeFeatureInfoEntry[] | undefined | null> {
    try {
      // Get the layer source
      const layerSource = this.getOLLayer(layerPath)?.get('source');

      // Prepare a filter by layer to know on which layer we want to query features
      const layerFilter = (layerCandidate: BaseLayer): boolean => {
        // We know it's the right layer to query on if the source is the same as the current layer
        const candidateSource = layerCandidate.get('source');
        return layerSource && candidateSource && layerSource === candidateSource;
      };

      // Query the map using the layer filter and a hit tolerance
      const features = this.getMapViewer().map.getFeaturesAtPixel(location, { hitTolerance: this.hitTolerance, layerFilter }) as Feature[];

      // Format and return the features
      return this.formatFeatureInfoResult(features, this.getLayerConfig(layerPath) as VectorLayerEntryConfig);
    } catch (error) {
      // Log
      logger.logError('abstract-geoview-vector.getFeatureInfoAtPixel()\n', error);
      return Promise.resolve(null);
    }
  }

  /** ***************************************************************************************************************************
   * Return feature information for all the features around the provided projected coordinate.
   *
   * @param {Coordinate} location - The pixel coordinate that will be used by the query.
   * @param {string} layerPath - The layer path to the layer's configuration.
   *
   * @returns {Promise<TypeFeatureInfoEntry[] | undefined | null>} The feature info table.
   */
  // GV Layers Refactoring - Obsolete (in layers)
  protected override getFeatureInfoAtCoordinate(
    location: Coordinate,
    layerPath: string
  ): Promise<TypeFeatureInfoEntry[] | undefined | null> {
    // Redirect to getFeatureInfoAtPixel
    return this.getFeatureInfoAtPixel(this.getMapViewer().map.getPixelFromCoordinate(location), layerPath);
  }

  /** ***************************************************************************************************************************
   * Return feature information for all the features around the provided longitude latitude.
   *
   * @param {Coordinate} lnglat - The coordinate that will be used by the query.
   * @param {string} layerPath - The layer path to the layer's configuration.
   *
   * @returns {Promise<TypeFeatureInfoEntry[] | undefined | null>} The feature info table.
   */
  // GV Layers Refactoring - Obsolete (in layers)
  protected override getFeatureInfoAtLongLat(lnglat: Coordinate, layerPath: string): Promise<TypeFeatureInfoEntry[] | undefined | null> {
    // Convert Coordinates LngLat to map projection
    const projCoordinate = this.getMapViewer().convertCoordinateLngLatToMapProj(lnglat);

    // Redirect to getFeatureInfoAtPixel
    return this.getFeatureInfoAtPixel(this.getMapViewer().map.getPixelFromCoordinate(projCoordinate), layerPath);
  }

  /** ***************************************************************************************************************************
   * Get the bounds of the layer represented in the layerConfig pointed to by the layerPath, returns updated bounds
   *
   * @param {string} layerPath The Layer path to the layer's configuration.
   * @param {Extent | undefined} bounds The current bounding box to be adjusted.
   *
   * @returns {Extent | undefined} The new layer bounding box.
   */
  // GV Layers Refactoring - Obsolete (in layers)
  protected getBounds(layerPath: string, bounds?: Extent): Extent | undefined {
    const layer = this.getOLLayer(layerPath) as VectorLayer<VectorSource> | undefined;
    const layerBounds = layer?.getSource()?.getExtent();

    if (layerBounds) {
      if (!bounds) bounds = [layerBounds[0], layerBounds[1], layerBounds[2], layerBounds[3]];
      else bounds = getMinOrMaxExtents(bounds, layerBounds);
    }

    return bounds;
  }

  /**
   * Overrides when the layer gets in loaded status.
   */
  // GV Layers Refactoring - Obsolete (in layers)
  override onLoaded(layerConfig: AbstractBaseLayerEntryConfig): void {
    // Call parent
    super.onLoaded(layerConfig);

    // Apply view filter immediately
    this.applyViewFilter(layerConfig.layerPath, (layerConfig as VectorLayerEntryConfig).layerFilter || '');
  }

  /** ***************************************************************************************************************************
   * Applies a view filter to the layer. When the combineLegendFilter flag is false, the filter parameter is used alone to display
   * the features. Otherwise, the legend filter and the filter parameter are combined together to define the view filter. The
   * legend filters are derived from the uniqueValue or classBreaks style of the layer. When the layer config is invalid, nothing
   * is done.
   *
   * @param {string} layerPath The layer path to the layer's configuration.
   * @param {string} filter A filter to be used in place of the getViewFilter value.
   * @param {boolean} combineLegendFilter Flag used to combine the legend filter and the filter together (default: true)
   */
  // GV Layers Refactoring - Obsolete (in layers)
  applyViewFilter(layerPath: string, filter: string, combineLegendFilter = true): void {
    // Log
    logger.logTraceCore('ABSTRACT-GEOVIEW-VECTOR - applyViewFilter', layerPath);

    const layerConfig = this.getLayerConfig(layerPath) as VectorLayerEntryConfig;
    const olLayer = this.getOLLayer(layerPath);

    let filterValueToUse = filter.replaceAll(/\s{2,}/g, ' ').trim();
    layerConfig.legendFilterIsOff = !combineLegendFilter;
    if (combineLegendFilter) layerConfig.layerFilter = filter;

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
      const reformattedDate = DateMgt.applyInputDateFormat(dateFound[0], this.externalFragmentsOrder, reverseTimeZone);
      filterValueToUse = `${filterValueToUse!.slice(0, dateFound.index)}${reformattedDate}${filterValueToUse!.slice(
        dateFound.index! + dateFound[0].length
      )}`;
    });

    try {
      const filterEquation = analyzeLayerFilter([{ nodeType: NodeType.unprocessedNode, nodeValue: filterValueToUse }]);
      layerConfig.filterEquation = filterEquation;
    } catch (error) {
      throw new Error(
        `Invalid vector layer filter (${(error as { message: string }).message}).\nfilter = ${this.getLayerFilter(
          layerPath
        )}\ninternal filter = ${filterValueToUse}`
      );
    }

    olLayer?.changed();

    // Emit event
    this.emitLayerFilterApplied({
      layerPath,
      filter: filterValueToUse,
    });
  }
}
