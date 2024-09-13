/* eslint-disable no-param-reassign */
// We have many reassign for layerPath-sourceOptions. We keep it global...
import Feature from 'ol/Feature';
import { Vector as VectorSource } from 'ol/source';
import { Options as SourceOptions } from 'ol/source/Vector';
import { VectorImage as VectorLayer } from 'ol/layer';
import { Options as VectorLayerOptions } from 'ol/layer/VectorImage';
import { GeoJSON as FormatGeoJSON } from 'ol/format';
import { all, bbox } from 'ol/loadingstrategy';
import { ReadOptions } from 'ol/format/Feature';
import BaseLayer from 'ol/layer/Base';
import LayerGroup from 'ol/layer/Group';
import { Coordinate } from 'ol/coordinate';
import { Extent } from 'ol/extent';
import { Pixel } from 'ol/pixel';
import { ProjectionLike } from 'ol/proj';
import { Point } from 'ol/geom';
import { getUid } from 'ol/util';

import { TypeLocalizedString } from '@config/types/map-schema-types';

import { api } from '@/app';
import { AbstractGeoViewLayer, CONST_LAYER_TYPES } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { TypeBaseSourceVectorInitialConfig, TypeFeatureInfoEntry, TypeLayerEntryConfig } from '@/geo/map/map-schema-types';
import { getLocalizedValue } from '@/core/utils/utilities';
import { DateMgt } from '@/core/utils/date-mgt';
import { NodeType } from '@/geo/utils/renderer/geoview-renderer-types';
import { VECTOR_LAYER } from '@/core/utils/constant';
import { logger } from '@/core/utils/logger';
import { VectorLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-layer-entry-config';
import { AbstractBaseLayerEntryConfig } from '@/core/utils/config/validation-classes/abstract-base-layer-entry-config';
import { Cast } from '@/core/types/global-types';
import { AppEventProcessor } from '@/api/event-processors/event-processor-children/app-event-processor';
import { analyzeLayerFilter } from '@/geo/utils/renderer/geoview-renderer';
import { AbstractGVVector } from '../../gv-layers/vector/abstract-gv-vector';
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';
import { Projection } from '@/geo/utils/projection';
import { getMinOrMaxExtents } from '@/geo/utils/utilities';

/* *******************************************************************************************************************************
 * AbstractGeoViewVector types
 */

// Base type used to keep the layer's hierarchical structure. It is similar to ol/layer/Base~BaseLayer.
export type TypeVectorLayerGroup = LayerGroup;
export type TypeVectorLayer = VectorSource<Feature>;
export type TypeBaseVectorLayer = BaseLayer | TypeVectorLayerGroup | TypeVectorLayer;

const EXCLUDED_HEADERS_LAT = ['latitude', 'lat', 'y', 'ycoord', 'latitude/latitude', 'latitude / latitude'];
const EXCLUDED_HEADERS_LNG = ['longitude', 'lon', 'x', 'xcoord', 'longitude/longitude', 'longitude / longitude'];
const EXCLUDED_HEADERS_GEN = ['geometry', 'geom'];
const EXCLUDED_HEADERS = EXCLUDED_HEADERS_LAT.concat(EXCLUDED_HEADERS_LNG).concat(EXCLUDED_HEADERS_GEN);

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

    // Instance check
    if (!(layerConfig instanceof VectorLayerEntryConfig)) throw new Error('Invalid layer configuration type provided');

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
  // TODO: createVectorSource should be eventually moved to new layers as well,
  // TODO: so that the new GV Layers receive something else than a OLSource in their constructor
  protected createVectorSource(
    layerConfig: AbstractBaseLayerEntryConfig,
    sourceOptions: SourceOptions<Feature> = {},
    readOptions: ReadOptions = {}
  ): VectorSource<Feature> {
    // The line below uses var because a var declaration has a wider scope than a let declaration.
    let vectorSource: VectorSource<Feature>;
    if (this.getAttributions().length > 0) sourceOptions.attributions = this.getAttributions();

    // set loading strategy option
    sourceOptions.strategy = (layerConfig.source! as TypeBaseSourceVectorInitialConfig).strategy === 'bbox' ? bbox : all;

    sourceOptions.loader = (extent, resolution, projection, success, failure) => {
      let url = vectorSource.getUrl();
      if (typeof url === 'function') url = url(extent, resolution, projection);

      const xhr = new XMLHttpRequest();
      if ((layerConfig.source as TypeBaseSourceVectorInitialConfig)?.postSettings) {
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
      xhr.onload = async () => {
        if (xhr.status === 200) {
          let features: Feature[] | undefined;
          if (layerConfig.schemaTag === CONST_LAYER_TYPES.CSV) {
            // Convert the CSV to features
            features = AbstractGeoViewVector.convertCsv(this.mapId, xhr.responseText, layerConfig as VectorLayerEntryConfig);
          } else if (layerConfig.schemaTag === CONST_LAYER_TYPES.ESRI_FEATURE) {
            // Fetch the features text array
            const esriFeaturesArray = await AbstractGeoViewVector.getEsriFeatures(
              layerConfig.layerPath,
              url as string,
              JSON.parse(xhr.responseText).count,
              this.getLayerMetadata(layerConfig.layerPath)?.maxRecordCount as number | undefined
            );

            // Convert to features
            features = [];
            esriFeaturesArray.forEach((responseText: string) => {
              features!.push(
                ...(vectorSource.getFormat()!.readFeatures(responseText, {
                  ...readOptions,
                  featureProjection: projection,
                  extent,
                }) as Feature[])
              );
            });
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
          if (features) {
            features.forEach((feature) => {
              const featureId = feature.get('OBJECTID') ? feature.get('OBJECTID') : getUid(feature);
              feature.setId(featureId);
            });
            // If there's no feature info, build it from features
            if (!layerConfig.source?.featureInfo && features.length > 0) {
              // Grab first feature as example
              const feature = features[0];
              const headers = Object.keys(feature.getProperties());
              const values = Object.values(feature.getProperties());
              AbstractGeoViewVector.#processFeatureInfoConfig(headers, values, EXCLUDED_HEADERS, layerConfig as VectorLayerEntryConfig);
            }

            // If feature info is queryable
            if (layerConfig.source?.featureInfo?.queryable) {
              const featureInfo = (layerConfig.source as TypeBaseSourceVectorInitialConfig).featureInfo!;
              const fieldTypes = featureInfo.fieldTypes?.split(',') || [];
              const fieldNames =
                getLocalizedValue(featureInfo.outfields, AppEventProcessor.getDisplayLanguage(this.mapId))?.split(',') || [];
              const dateFields = fieldTypes?.reduce<string[]>((accumulator, entryFieldType, i) => {
                if (entryFieldType === 'date') accumulator.push(fieldNames[i]);
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

            // Add the features to the source
            vectorSource.addFeatures(features);
          }

          if (success) success(features as Feature[]);
          const layer = this.getOLLayer(layerConfig.layerPath);
          layer?.changed();
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
   * Fetch features from ESRI Feature services with query and feature limits.
   *
   * @param {string} layerPath - The layer path of the layer.
   * @param {string} url - The base url for the service.
   * @param {number} featureCount - The number of features in the layer.
   * @param {number} maxRecordCount - The max features per query from the service.
   * @param {number} featureLimit - The maximum number of features to fetch per query.
   * @param {number} queryLimit - The maximum number of queries to run at once.
   * @returns {Promise<string[]>} An array of the response text for the features.
   * @private
   */
  // GV: featureLimit and queryLimit ideals vary with the service, 500/10 was a good middle ground for large layers tested
  // TODO: Add options for featureLimit and queryLimit to config
  // TODO: Will need to move with createVectorSource
  static getEsriFeatures(
    layerPath: string,
    url: string,
    featureCount: number,
    maxRecordCount?: number,
    featureLimit: number = 500,
    queryLimit: number = 10
  ): Promise<string[]> {
    // Update url
    const baseUrl = url.replace('&where=1%3D1&returnCountOnly=true', `&outfields=*`);
    const featureFetchLimit = maxRecordCount && maxRecordCount < featureLimit ? maxRecordCount : featureLimit;

    // Create array of url's to call
    const urlArray: string[] = [];
    for (let i = 0; i < featureCount; i += featureFetchLimit) {
      urlArray.push(`${baseUrl}&where=OBJECTID+<=+${i + featureFetchLimit}&resultOffset=${i}`);
    }

    const promises: Promise<string>[] = [];
    let currentIndex = 0;

    // Gets the next set of features, and reruns on completion
    const fetchNext = (): void => {
      if (currentIndex >= urlArray.length) return;

      // Get next url and update index
      const currentUrl = urlArray[currentIndex];
      currentIndex++;

      // Fetch from current url and initiate next fetch when complete
      try {
        const result = fetch(currentUrl).then((response) => response.text());
        promises.push(result);
      } catch (error) {
        logger.logError(`Error loading features for ${layerPath} from ${currentUrl}`, error);
      } finally {
        fetchNext();
      }
    };

    // Start fetching queryLimit number of times
    for (let i = 0; i < queryLimit; i++) fetchNext();

    return Promise.all(promises);
  }

  /** ***************************************************************************************************************************
   * Create a vector layer. The layer has in its properties a reference to the layer configuration used at creation time.
   * The layer entry configuration keeps a reference to the layer in the olLayer attribute.
   *
   * @param {VectorLayerEntryConfig} layerConfig The layer entry configuration used by the source.
   * @param {VectorSource} vectorSource The source configuration for the vector layer.
   *
   * @returns {VectorLayer<Feature>} The vector layer created.
   */
  // GV Layers Refactoring - Obsolete (this is bridging between config and layers, okay)
  protected createVectorLayer(layerConfig: VectorLayerEntryConfig, vectorSource: VectorSource): VectorLayer<Feature> {
    // TODO: remove link to language, layer should be created in one language and recreated if needed to change
    const language = AppEventProcessor.getDisplayLanguage(this.mapId);

    // Get the style label
    const label = getLocalizedValue(layerConfig.layerName, language) || layerConfig.layerId;

    // GV Time to request an OpenLayers layer!
    const requestResult = this.emitLayerRequesting({ config: layerConfig, source: vectorSource });

    // If any response
    let olLayer: VectorLayer<Feature> | undefined;
    if (requestResult.length > 0) {
      // Get the OpenLayer that was created
      olLayer = requestResult[0] as VectorLayer<Feature>;
    }

    // If no olLayer was obtained
    if (!olLayer) {
      // We're working in old LAYERS_HYBRID_MODE (in the new mode the code below is handled in the new classes)
      // Create the vector layer options.
      const layerOptions: VectorLayerOptions<Feature, VectorSource> = {
        properties: { layerConfig },
        source: vectorSource,
        style: (feature) => {
          return AbstractGVVector.calculateStyleForFeature(
            this,
            feature,
            label,
            layerConfig.layerPath,
            layerConfig.filterEquation,
            layerConfig.legendFilterIsOff
          );
        },
      };

      if (layerConfig.initialSettings?.extent !== undefined) layerOptions.extent = layerConfig.initialSettings.extent;
      if (layerConfig.initialSettings?.maxZoom !== undefined) layerOptions.maxZoom = layerConfig.initialSettings.maxZoom;
      if (layerConfig.initialSettings?.minZoom !== undefined) layerOptions.minZoom = layerConfig.initialSettings.minZoom;
      if (layerConfig.initialSettings?.states?.opacity !== undefined) layerOptions.opacity = layerConfig.initialSettings.states.opacity;

      // Create the OpenLayer layer
      olLayer = new VectorLayer(layerOptions);

      // Hook the loaded event
      this.setLayerAndLoadEndListeners(layerConfig, olLayer, 'features');
    }

    // GV Time to emit about the layer creation!
    this.emitLayerCreation({ config: layerConfig, layer: olLayer });

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
      const layer = this.getOLLayer(layerPath) as VectorLayer<Feature>;
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
   *
   * @returns {Extent | undefined} The new layer bounding box.
   */
  // GV Layers Refactoring - Obsolete (in layers)
  override getBounds(layerPath: string): Extent | undefined {
    const layer = this.getOLLayer(layerPath) as VectorLayer<Feature> | undefined;
    const layerBounds = layer?.getSource()?.getExtent();

    // Return the calculated layer bounds
    return layerBounds;
  }

  /**
   * Gets the extent of an array of features.
   * @param {string} layerPath - The layer path.
   * @param {string[]} objectIds - The uids of the features to calculate the extent from.
   * @returns {Promise<Extent | undefined>} The extent of the features, if available.
   */
  // Added eslint-disable here, because we do want to override this method in children and keep 'this'.
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  override getExtentFromFeatures(layerPath: string, objectIds: string[]): Promise<Extent | undefined> {
    // Get array of features
    const requestedFeatures = objectIds.map((id) => (this.getOLLayer(layerPath) as VectorLayer<Feature>).getSource()?.getFeatureById(id));

    if (requestedFeatures) {
      // Determine max extent from features
      let calculatedExtent: Extent | undefined;
      requestedFeatures.forEach((feature) => {
        if (feature?.getGeometry()) {
          const extent = feature.getGeometry()?.getExtent();
          if (extent) {
            // If calculatedExtent has not been defined, set it to extent
            if (!calculatedExtent) calculatedExtent = extent;
            else getMinOrMaxExtents(calculatedExtent, extent);
          }
        }
      });

      return Promise.resolve(calculatedExtent);
    }
    return Promise.resolve(undefined);
  }

  /**
   * Return the vector layer as a GeoJSON object
   * @param {string} layerPath - Layer path to get GeoJSON
   * @returns {JSON} Layer's features as GeoJSON
   */
  getFeaturesAsGeoJSON(layerPath: string): JSON {
    // Get map projection
    const mapProjection: ProjectionLike = this.getMapViewer().getProjection().getCode();

    const format = new FormatGeoJSON();
    const geoJsonStr = format.writeFeatures((this.getOLLayer(layerPath) as VectorLayer<Feature>).getSource()!.getFeatures(), {
      dataProjection: 'EPSG:4326', // Output projection,
      featureProjection: mapProjection,
    });

    return JSON.parse(geoJsonStr);
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
  applyViewFilter(layerPath: string, filter: string, combineLegendFilter: boolean = true): void {
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

  /** ***************************************************************************************************************************
   * Converts csv text to feature array.
   *
   * @param {string} csvData The data from the .csv file.
   * @param {VectorLayerEntryConfig} layerConfig The config of the layer.
   *
   * @returns {Feature[]} The array of features.
   */
  static convertCsv(mapId: string, csvData: string, layerConfig: VectorLayerEntryConfig): Feature[] | undefined {
    // GV: This function and the below private static ones used to be in the CSV class directly, but something wasn't working with a 'Private element not accessible' error.
    // GV: After moving the code to the mother class, it worked. It'll remain here for now until the config refactoring can take care of it in its re-writing

    const inProjection: ProjectionLike = layerConfig.source!.dataProjection || Projection.PROJECTION_NAMES.LNGLAT;
    const outProjection: ProjectionLike = MapEventProcessor.getMapViewer(mapId).getProjection().getCode();

    const features: Feature[] = [];
    let latIndex: number | undefined;
    let lonIndex: number | undefined;
    const csvRows = AbstractGeoViewVector.#csvStringToArray(csvData, layerConfig.source!.separator || ',');
    const headers: string[] = csvRows[0];
    for (let i = 0; i < headers.length; i++) {
      if (EXCLUDED_HEADERS_LAT.includes(headers[i].toLowerCase())) latIndex = i;
      if (EXCLUDED_HEADERS_LNG.includes(headers[i].toLowerCase())) lonIndex = i;
    }

    if (latIndex === undefined || lonIndex === undefined) {
      const errorMsg = `Could not find geographic data in the CSV`;
      logger.logError(errorMsg);
      // TODO: find a more centralized way to trap error and display message
      api.maps[mapId].notifications.showError(errorMsg);
      layerConfig.layerStatus = 'error';
      return undefined;
    }

    AbstractGeoViewVector.#processFeatureInfoConfig(headers, csvRows[1], EXCLUDED_HEADERS, layerConfig);

    for (let i = 1; i < csvRows.length; i++) {
      const currentRow = csvRows[i];
      const properties: { [key: string]: string | number } = {};
      for (let j = 0; j < headers.length; j++) {
        if (j !== latIndex && j !== lonIndex && currentRow[j]) {
          properties[headers[j]] = currentRow[j] !== '' && Number(currentRow[j]) ? Number(currentRow[j]) : currentRow[j];
        }
      }

      const lon = currentRow[lonIndex] ? Number(currentRow[lonIndex]) : Infinity;
      const lat = currentRow[latIndex] ? Number(currentRow[latIndex]) : Infinity;
      if (Number.isFinite(lon) && Number.isFinite(lat)) {
        const coordinates = inProjection !== outProjection ? Projection.transform([lon, lat], inProjection, outProjection) : [lon, lat];
        const feature = new Feature({
          geometry: new Point(coordinates),
          ...properties,
        });
        features.push(feature);
      }
    }

    return features;
  }

  /** ***************************************************************************************************************************
   * Converts csv to array of rows of separated values.
   *
   * @param {string} csvData The raw csv text.
   * @param {string} separator The character used to separate the values.
   *
   * @returns {string[][]} An array of the rows of the csv, split by separator.
   * @private
   */
  static #csvStringToArray(csvData: string, separator: string): string[][] {
    const regex = new RegExp(`(\\${separator}|\\r?\\n|\\r|^)(?:"([^"]*(?:""[^"]*)*)"|([^\\${separator}\\r\\n]*))`, 'gi');
    let matches;
    const parsedData: string[][] = [[]];
    // eslint-disable-next-line no-cond-assign
    while ((matches = regex.exec(csvData))) {
      if (matches[1].length && matches[1] !== separator) parsedData.push([]);
      parsedData[parsedData.length - 1].push(matches[2] !== undefined ? matches[2].replace(/""/g, '"') : matches[3]);
    }
    return parsedData;
  }

  /** ***************************************************************************************************************************
   * This method sets the outfields and aliasFields of the source feature info.
   *
   * @param {string[]} headers An array of field names.
   * @param {string[]} firstRow The first row of data.
   * @param {number[]} lonLatIndices The index of lon and lat in the array.
   * @param {VectorLayerEntryConfig} layerConfig The vector layer entry to configure.
   * @private
   */
  static #processFeatureInfoConfig(
    headers: string[],
    firstRow: string[],
    excludedHeaders: string[],
    layerConfig: VectorLayerEntryConfig
  ): void {
    if (!layerConfig.source) layerConfig.source = {};
    if (!layerConfig.source.featureInfo) layerConfig.source.featureInfo = { queryable: true };
    // Process undefined outfields or aliasFields ('' = false and !'' = true). Also, if en is undefined, then fr is also undefined.
    // when en and fr are undefined, we set both en and fr to the same value.
    if (!layerConfig.source.featureInfo.outfields?.en || !layerConfig.source.featureInfo.aliasFields?.en) {
      const processOutField = !layerConfig.source.featureInfo.outfields?.en;
      const processAliasFields = !layerConfig.source.featureInfo.aliasFields?.en;
      if (processOutField) {
        layerConfig.source.featureInfo.outfields = { en: '' };
        layerConfig.source.featureInfo.fieldTypes = '';
      }
      if (processAliasFields) layerConfig.source.featureInfo.aliasFields = { en: '' };
      headers.forEach((header, index) => {
        // If not excluded
        if (!excludedHeaders.includes(header)) {
          let type = 'string';
          if (firstRow[index] && firstRow[index] !== '' && Number(firstRow[index])) type = 'number';
          if (processOutField) {
            layerConfig.source!.featureInfo!.outfields!.en = `${layerConfig.source!.featureInfo!.outfields!.en}${header},`;
            layerConfig.source!.featureInfo!.fieldTypes = `${layerConfig.source!.featureInfo!.fieldTypes}${type},`;
          }
          layerConfig.source!.featureInfo!.aliasFields!.en = `${layerConfig.source!.featureInfo!.outfields!.en}${header},`;
        }
      });
      // Remove commas from end of strings
      layerConfig.source.featureInfo!.outfields!.en = layerConfig.source.featureInfo!.outfields?.en?.slice(0, -1);
      layerConfig.source.featureInfo!.fieldTypes = layerConfig.source.featureInfo!.fieldTypes?.slice(0, -1);
      layerConfig.source.featureInfo!.aliasFields!.en = layerConfig.source.featureInfo!.aliasFields?.en?.slice(0, -1);
      layerConfig.source!.featureInfo!.outfields!.fr = layerConfig.source!.featureInfo!.outfields?.en;
      layerConfig.source!.featureInfo!.aliasFields!.fr = layerConfig.source!.featureInfo!.aliasFields?.en;
    }
    if (!layerConfig.source.featureInfo.nameField) {
      const en =
        layerConfig.source.featureInfo!.outfields!.en?.split(',')[0] || layerConfig.source.featureInfo!.outfields!.fr?.split(',')[0];
      const fr = en;
      if (en) layerConfig.source.featureInfo.nameField = { en, fr };
    }
  }
}
