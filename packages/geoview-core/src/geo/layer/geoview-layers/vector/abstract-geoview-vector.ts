/* eslint-disable no-param-reassign */
// We have many reassign for layerPath-sourceOptions. We keep it global...
import Feature from 'ol/Feature';
import { Vector as VectorSource } from 'ol/source';
import { Options as SourceOptions } from 'ol/source/Vector';
import { VectorImage as VectorLayer } from 'ol/layer';
import { GeoJSON as FormatGeoJSON } from 'ol/format';
import { all, bbox } from 'ol/loadingstrategy';
import { ReadOptions } from 'ol/format/Feature';
import BaseLayer from 'ol/layer/Base';
import LayerGroup from 'ol/layer/Group';
import { ProjectionLike } from 'ol/proj';
import { Geometry, Point } from 'ol/geom';
import { getUid } from 'ol/util';

import { TypeFeatureInfoLayerConfig, TypeOutfields } from '@config/types/map-schema-types';

import { api } from '@/app';
import { AbstractGeoViewLayer, CONST_LAYER_TYPES } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { TypeBaseSourceVectorInitialConfig, TypeLayerEntryConfig } from '@/geo/map/map-schema-types';
import { DateMgt } from '@/core/utils/date-mgt';
import { VECTOR_LAYER } from '@/core/utils/constant';
import { logger } from '@/core/utils/logger';
import { VectorLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-layer-entry-config';
import { AbstractBaseLayerEntryConfig } from '@/core/utils/config/validation-classes/abstract-base-layer-entry-config';
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';
import { Projection } from '@/geo/utils/projection';

/* *******************************************************************************************************************************
 * AbstractGeoViewVector types
 */

// Base type used to keep the layer's hierarchical structure. It is similar to ol/layer/Base~BaseLayer.
export type TypeVectorLayerGroup = LayerGroup;
export type TypeVectorLayer = VectorSource<Feature>;
export type TypeBaseVectorLayer = BaseLayer | TypeVectorLayerGroup | TypeVectorLayer;

const EXCLUDED_HEADERS_LAT = ['latitude', 'lat', 'y', 'ycoord', 'latitude|latitude', 'latitude | latitude'];
const EXCLUDED_HEADERS_LNG = ['longitude', 'lon', 'x', 'xcoord', 'longitude|longitude', 'longitude | longitude'];
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
            // Get oid field
            const oidField = AbstractGeoViewVector.#getEsriOidField(layerConfig);

            // Fetch the features text array
            const esriFeaturesArray = await AbstractGeoViewVector.getEsriFeatures(
              layerConfig.layerPath,
              url as string,
              JSON.parse(xhr.responseText).count,
              oidField,
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
            // Get oid field
            const oidField = AbstractGeoViewVector.#getEsriOidField(layerConfig);

            features.forEach((feature) => {
              const featureId = feature.get(oidField) ? feature.get(oidField) : getUid(feature);
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
              const { outfields } = (layerConfig.source as TypeBaseSourceVectorInitialConfig).featureInfo!;
              const dateFields = outfields?.filter((outfield) => outfield.type === 'date');
              if (dateFields?.length) {
                features.forEach((feature) => {
                  dateFields.forEach((dateField) => {
                    let fieldValue = feature.get(dateField.name);
                    if (typeof fieldValue === 'number') {
                      let dateString = DateMgt.convertMilisecondsToDate(fieldValue);
                      dateString = DateMgt.applyInputDateFormat(dateString, this.serverDateFragmentsOrder);
                      (feature as Feature).set(dateField.name, DateMgt.convertToMilliseconds(dateString), true);
                    } else {
                      if (!this.serverDateFragmentsOrder)
                        this.serverDateFragmentsOrder = DateMgt.getDateFragmentsOrder(DateMgt.deduceDateFormat(fieldValue));
                      fieldValue = DateMgt.applyInputDateFormat(fieldValue, this.serverDateFragmentsOrder);
                      (feature as Feature).set(dateField.name, DateMgt.convertToMilliseconds(fieldValue), true);
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
   * @param {string} oidField - The unique identifier field name.
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
    oidField: string,
    maxRecordCount?: number,
    featureLimit: number = 500,
    queryLimit: number = 10
  ): Promise<string[]> {
    // Update url
    // TODO: Performance - Check if we should add &maxAllowableOffset=10 to the url. It creates small sliver but download size if 18mb compare to 50mb for outlier-election-2019
    // TODO.CONT: Download time is 90 seconds compare to 130 seconds. It may worth the loss of precision...
    const baseUrl = url.replace('&where=1%3D1&returnCountOnly=true', `&outfields=*&geometryPrecision=1`);
    const featureFetchLimit = maxRecordCount && maxRecordCount < featureLimit ? maxRecordCount : featureLimit;

    // Create array of url's to call
    const urlArray: string[] = [];
    for (let i = 0; i < featureCount; i += featureFetchLimit) {
      urlArray.push(`${baseUrl}&where=${oidField}+<=+${i + featureFetchLimit}&resultOffset=${i}`);
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
   * @returns {VectorSource<Feature<Geometry>>} The vector layer created.
   */
  // GV Layers Refactoring - Obsolete (this is bridging between config and layers, okay)
  protected createVectorLayer(
    layerConfig: VectorLayerEntryConfig,
    vectorSource: VectorSource
  ): VectorLayer<VectorSource<Feature<Geometry>>> {
    // GV Time to request an OpenLayers layer!
    // TODO: There may be some additional enhancements to be done now that we can notice how emitLayerRequesting and emitLayerCreation are getting "close" to each other.
    // TODO.CONT: This whole will be removed when migration to config api... do we invest time in it?
    const requestResult = this.emitLayerRequesting({ config: layerConfig, source: vectorSource });

    // If any response
    let olLayer: VectorLayer<VectorSource<Feature<Geometry>>> | undefined;
    if (requestResult.length > 0) {
      // Get the OpenLayer that was created
      olLayer = requestResult[0] as VectorLayer<VectorSource<Feature<Geometry>>>;
    } else throw new Error('Error on layerRequesting event');

    // GV Time to emit about the layer creation!
    this.emitLayerCreation({ config: layerConfig, layer: olLayer });

    // If a layer on the map has an initialSettings.visible set to false, its status will never reach the status 'loaded' because
    // nothing is drawn on the map. We must wait until the 'loaded' status is reached to set the visibility to false. The call
    // will be done in the layerConfig.loadedFunction() which is called right after the 'loaded' signal.
    return olLayer;
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
    const geoJsonStr = format.writeFeatures(
      (this.getOLLayer(layerPath) as VectorLayer<VectorSource<Feature<Geometry>>>).getSource()!.getFeatures(),
      {
        dataProjection: 'EPSG:4326', // Output projection,
        featureProjection: mapProjection,
      }
    );

    return JSON.parse(geoJsonStr);
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

    // These characters are removed from the headers as they break the data table filtering (Issue #2693).
    parsedData[0].forEach((header, i) => {
      if (header.includes("'")) logger.logWarning("Header included illegal character (') replaced with (_)");
      parsedData[0][i] = header.replaceAll("'", '_');
      if (header.includes('/')) logger.logWarning('Header included illegal character (/) replaced with (|)');
      parsedData[0][i] = parsedData[0][i].replaceAll('/', '|');
      if (header.includes('+')) logger.logWarning('Header included illegal character (+) replaced with (plus)');
      parsedData[0][i] = parsedData[0][i].replaceAll('+', 'plus');
      if (header.includes('-')) logger.logWarning('Header included illegal character (-) replaced with (_)');
      parsedData[0][i] = parsedData[0][i].replaceAll('-', '_');
      if (header.includes('*')) logger.logWarning('Header included illegal character (*) replaced with (x)');
      parsedData[0][i] = parsedData[0][i].replaceAll('*', 'x');
      if (header.includes('(')) logger.logWarning('Header included illegal character (() replaced with ([)');
      parsedData[0][i] = parsedData[0][i].replaceAll('(', '[');
      if (header.includes(')')) logger.logWarning('Header included illegal character ()) replaced with (])');
      parsedData[0][i] = parsedData[0][i].replaceAll(')', ']');
    });

    return parsedData;
  }

  /** ***************************************************************************************************************************
   * This method sets the outfields and aliasFields of the source feature info.
   *
   * @param {string[]} headers - An array of field names.
   * @param {string[]} firstRow - The first row of data.
   * @param {string[]} excludedHeaders - The headers to exclude from feature info.
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

    // Process undefined outfields or aliasFields
    if (!layerConfig.source.featureInfo.outfields?.length) {
      if (!layerConfig.source.featureInfo.outfields) layerConfig.source.featureInfo.outfields = [];

      headers.forEach((header, index) => {
        // If not excluded
        if (!excludedHeaders.includes(header)) {
          let type = 'string';
          if (firstRow[index] && firstRow[index] !== '' && Number(firstRow[index])) type = 'number';

          const newOutfield: TypeOutfields = {
            name: header,
            alias: header,
            type: type as 'string' | 'number',
            domain: null,
          };
          layerConfig.source!.featureInfo!.outfields!.push(newOutfield);
        }
      });
    }

    layerConfig.source.featureInfo!.outfields.forEach((outfield) => {
      if (!outfield.alias) outfield.alias = outfield.name;
    });

    // Set name field to first value
    if (!layerConfig.source.featureInfo.nameField)
      layerConfig.source.featureInfo.nameField = layerConfig.source.featureInfo!.outfields[0].name;
  }

  /**
   * Gets the Object ID field name from the layer configuration
   * @param {AbstractBaseLayerEntryConfig} layerConfig - The layer configuration object
   * @returns {string} The name of the OID field if found, otherwise returns 'OBJECTID' as default
   * @description Extracts the Object ID field name from the layer configuration. An OID (Object ID) is a
   * standardized identifier used to uniquely identify features in a layer. If no OID field is specified
   * in the configuration, it defaults to 'OBJECTID'.
   * @private
   */
  // TODO: We should have this function in abstract-base-layer to be called like layerConfig.getEsriOidField() - issue 2699
  // TODO.CONT: This should be rename without the esri. The oid type should be mandatory and if not present, we should crate one.
  // TODO.CONT: We already create the internalGeoviewId but we should make this more officiel by assigning a type of oid
  static #getEsriOidField(layerConfig: AbstractBaseLayerEntryConfig): string {
    // Get oid field
    return layerConfig.source?.featureInfo && (layerConfig.source.featureInfo as TypeFeatureInfoLayerConfig).outfields !== undefined
      ? (layerConfig.source.featureInfo as TypeFeatureInfoLayerConfig).outfields.filter((field) => field.type === 'oid')[0]?.name
      : 'OBJECTID';
  }
}
