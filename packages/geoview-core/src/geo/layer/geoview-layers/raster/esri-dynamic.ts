/* eslint-disable no-param-reassign */
// We have many reassign for layerPath-layerConfig. We keep it global...
import { ImageArcGISRest } from 'ol/source';
import { Options as SourceOptions } from 'ol/source/ImageArcGISRest';
import { Options as ImageOptions } from 'ol/layer/BaseImage';
import BaseLayer from 'ol/layer/Base';
import { Image as ImageLayer } from 'ol/layer';
import { Coordinate } from 'ol/coordinate';
import { Pixel } from 'ol/pixel';
import { EsriJSON } from 'ol/format';
import { Extent } from 'ol/extent';
import Feature from 'ol/Feature';
import Geometry from 'ol/geom/Geometry';

import { GeometryApi } from '@/geo/layer/geometry/geometry';
import { getLocalizedValue } from '@/core/utils/utilities';
import { AbstractGeoViewLayer, CONST_LAYER_TYPES } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { AbstractGeoViewRaster } from '@/geo/layer/geoview-layers/raster/abstract-geoview-raster';
import { validateExtent, getMinOrMaxExtents } from '@/geo/utils/utilities';
import { Projection } from '@/geo/utils/projection';
import { TypeJsonObject } from '@/core/types/global-types';
import { logger } from '@/core/utils/logger';
import { DateMgt } from '@/core/utils/date-mgt';
import { EsriDynamicLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/esri-dynamic-layer-entry-config';
import {
  TypeLayerEntryConfig,
  TypeGeoviewLayerConfig,
  isUniqueValueStyleConfig,
  isClassBreakStyleConfig,
  TypeUniqueValueStyleConfig,
  TypeClassBreakStyleConfig,
  isSimpleStyleConfig,
  TypeFeatureInfoLayerConfig,
  codedValueType,
  rangeDomainType,
  TypeFeatureInfoEntry,
} from '@/geo/map/map-schema-types';

import {
  commonGetFieldDomain,
  commonGetFieldType,
  commonfetchServiceMetadata,
  commonProcessFeatureInfoConfig,
  commonProcessInitialSettings,
  commonProcessLayerMetadata,
  commonProcessTemporalDimension,
  commonValidateListOfLayerEntryConfig,
} from '@/geo/layer/geoview-layers/esri-layer-common';
import { AppEventProcessor } from '@/api/event-processors/event-processor-children/app-event-processor';
import { AbstractBaseLayerEntryConfig } from '@/core/utils/config/validation-classes/abstract-base-layer-entry-config';

type TypeFieldOfTheSameValue = { value: string | number | Date; nbOccurence: number };
type TypeQueryTree = { fieldValue: string | number | Date; nextField: TypeQueryTree }[];

// GV: CONFIG EXTRACTION
// GV: This section of code was extracted and copied to the geoview config section
// GV: |||||
// GV: vvvvv

export interface TypeEsriDynamicLayerConfig extends TypeGeoviewLayerConfig {
  geoviewLayerType: typeof CONST_LAYER_TYPES.ESRI_DYNAMIC;
  listOfLayerEntryConfig: EsriDynamicLayerEntryConfig[];
}

/** ******************************************************************************************************************************
 * type guard function that redefines a TypeGeoviewLayerConfig as a TypeEsriDynamicLayerConfig if the geoviewLayerType attribute of
 * the verifyIfLayer parameter is ESRI_DYNAMIC. The type ascention applies only to the true block of the if clause that use
 * this function.
 *
 * @param {TypeGeoviewLayerConfig} verifyIfLayer Polymorphic object to test in order to determine if the type ascention is valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const layerConfigIsEsriDynamic = (verifyIfLayer: TypeGeoviewLayerConfig): verifyIfLayer is TypeEsriDynamicLayerConfig => {
  return verifyIfLayer?.geoviewLayerType === CONST_LAYER_TYPES.ESRI_DYNAMIC;
};

// GV: ^^^^^
// GV: |||||

/** ******************************************************************************************************************************
 * type guard function that redefines an AbstractGeoViewLayer as an EsriDynamic if the type attribute of the verifyIfGeoViewLayer
 * parameter is ESRI_DYNAMIC. The type ascention applies only to the true block of the if clause that use this function.
 *
 * @param {AbstractGeoViewLayer} verifyIfGeoViewLayer Polymorphic object to test in order to determine if the type ascention is
 * valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const geoviewLayerIsEsriDynamic = (verifyIfGeoViewLayer: AbstractGeoViewLayer): verifyIfGeoViewLayer is EsriDynamic => {
  return verifyIfGeoViewLayer?.type === CONST_LAYER_TYPES.ESRI_DYNAMIC;
};
// GV: CONFIG EXTRACTION
// GV: This section of code must be deleted because we already have another type guard that does the same thing
// GV: |||||
// GV: vvvvv

/** ******************************************************************************************************************************
 * type guard function that redefines a TypeLayerEntryConfig as a EsriDynamicLayerEntryConfig if the geoviewLayerType attribute
 * of the verifyIfGeoViewEntry.geoviewLayerConfig attribute is ESRI_DYNAMIC. The type ascention applies only to the true block of
 * the if clause that use this function.
 *
 * @param {TypeLayerEntryConfig} verifyIfGeoViewEntry Polymorphic object to test in order to determine if the type ascention is
 * valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const geoviewEntryIsEsriDynamic = (
  verifyIfGeoViewEntry: TypeLayerEntryConfig
): verifyIfGeoViewEntry is EsriDynamicLayerEntryConfig => {
  return verifyIfGeoViewEntry?.geoviewLayerConfig?.geoviewLayerType === CONST_LAYER_TYPES.ESRI_DYNAMIC;
};

// GV: ^^^^^
// GV: |||||

// ******************************************************************************************************************************
// ******************************************************************************************************************************
/** ******************************************************************************************************************************
 * A class to add esri dynamic layer.
 *
 * @exports
 * @class EsriDynamic
 */
// ******************************************************************************************************************************
// GV Layers Refactoring - Obsolete (in layers)
export class EsriDynamic extends AbstractGeoViewRaster {
  // The default hit tolerance the query should be using
  static override DEFAULT_HIT_TOLERANCE: number = 7;

  // Override the hit tolerance for a EsriDynamic layer
  override hitTolerance: number = EsriDynamic.DEFAULT_HIT_TOLERANCE;

  /** ****************************************************************************************************************************
   * Initialize layer.
   * @param {string} mapId The id of the map.
   * @param {TypeEsriDynamicLayerConfig} layerConfig The layer configuration.
   */
  constructor(mapId: string, layerConfig: TypeEsriDynamicLayerConfig) {
    if (!layerConfig.serviceDateFormat) layerConfig.serviceDateFormat = 'DD/MM/YYYY HH:MM:SSZ';
    super(CONST_LAYER_TYPES.ESRI_DYNAMIC, layerConfig, mapId);
  }

  /** ***************************************************************************************************************************
   * This method reads the service metadata from the metadataAccessPath.
   *
   * @returns {Promise<void>} A promise that the execution is completed.
   */
  // GV Layers Refactoring - Obsolete (in config?)
  protected override fetchServiceMetadata(): Promise<void> {
    return commonfetchServiceMetadata(this);
  }

  /** ***************************************************************************************************************************
   * This method validates recursively the configuration of the layer entries to ensure that it is a feature layer identified
   * with a numeric layerId and creates a group entry when a layer is a group.
   *
   * @param {TypeLayerEntryConfig[]} listOfLayerEntryConfig The list of layer entries configuration to validate.
   */
  // GV Layers Refactoring - Obsolete (in config?)
  validateListOfLayerEntryConfig(listOfLayerEntryConfig: TypeLayerEntryConfig[]): void {
    commonValidateListOfLayerEntryConfig(this, listOfLayerEntryConfig);
  }

  /** ***************************************************************************************************************************
   * This method perform specific validation that can only be done by the child of the AbstractGeoViewEsriLayer class.
   *
   * @param {number} esriIndex The index of the current layer in the metadata.
   *
   * @returns {boolean} true if an error is detected.
   */
  // GV Layers Refactoring - Obsolete (in config?)
  esriChildHasDetectedAnError(layerConfig: TypeLayerEntryConfig): boolean {
    if (!this.metadata!.supportsDynamicLayers) {
      this.layerLoadError.push({
        layer: layerConfig.layerPath,
        loggerMessage: `Layer ${layerConfig.layerPath} of map ${this.mapId} does not support dynamic layers.`,
      });
      return true;
    }
    return false;
  }

  /** ***************************************************************************************************************************
   * Extract the type of the specified field from the metadata. If the type can not be found, return 'string'.
   *
   * @param {string} fieldName field name for which we want to get the type.
   * @param {AbstractBaseLayerEntryConfig} layerConfig layer configuration.
   *
   * @returns {'string' | 'date' | 'number'} The type of the field.
   */
  // GV Layers Refactoring - Obsolete (in config?)
  protected override getFieldType(fieldName: string, layerConfig: AbstractBaseLayerEntryConfig): 'string' | 'date' | 'number' {
    return commonGetFieldType(this, fieldName, layerConfig);
  }

  /** ***************************************************************************************************************************
   * Return the domain of the specified field.
   *
   * @param {string} fieldName field name for which we want to get the domain.
   * @param {AbstractBaseLayerEntryConfig} layerConfig layer configuration.
   *
   * @returns {null | codedValueType | rangeDomainType} The domain of the field.
   */
  // GV Layers Refactoring - Obsolete (in config?)
  protected override getFieldDomain(fieldName: string, layerConfig: AbstractBaseLayerEntryConfig): null | codedValueType | rangeDomainType {
    return commonGetFieldDomain(this, fieldName, layerConfig);
  }

  /** ***************************************************************************************************************************
   * This method will create a Geoview temporal dimension if it exist in the service metadata
   * @param {TypeJsonObject} esriTimeDimension The ESRI time dimension object
   * @param {EsriDynamicLayerEntryConfig} layerConfig The layer entry to configure
   */
  // GV Layers Refactoring - Obsolete (in config?)
  protected processTemporalDimension(esriTimeDimension: TypeJsonObject, layerConfig: EsriDynamicLayerEntryConfig): void {
    commonProcessTemporalDimension(this, esriTimeDimension, layerConfig);
  }

  /** ***************************************************************************************************************************
   * This method verifies if the layer is queryable and sets the outfields and aliasFields of the source feature info.
   *
   * @param {EsriDynamicLayerEntryConfig} layerConfig The layer entry to configure.
   */
  // GV Layers Refactoring - Obsolete (in config?)
  processFeatureInfoConfig(layerConfig: EsriDynamicLayerEntryConfig): void {
    commonProcessFeatureInfoConfig(this, layerConfig);
  }

  /** ***************************************************************************************************************************
   * This method set the initial settings based on the service metadata. Priority is given to the layer configuration.
   *
   * @param {EsriDynamic} this The ESRI layer instance pointer.
   * @param {EsriDynamicLayerEntryConfig} layerConfig The layer entry to configure.
   */
  // GV Layers Refactoring - Obsolete (in config?)
  processInitialSettings(layerConfig: EsriDynamicLayerEntryConfig): void {
    commonProcessInitialSettings(this, layerConfig);
  }

  /** ***************************************************************************************************************************
   * This method is used to process the layer's metadata. It will fill the empty fields of the layer's configuration (renderer,
   * initial settings, fields and aliases).
   *
   * @param {AbstractBaseLayerEntryConfig} layerConfig The layer entry configuration to process.
   *
   * @returns {Promise<AbstractBaseLayerEntryConfig>} A promise that the layer configuration has its metadata processed.
   */
  // GV Layers Refactoring - Obsolete (in config?)
  protected override processLayerMetadata(layerConfig: AbstractBaseLayerEntryConfig): Promise<AbstractBaseLayerEntryConfig> {
    // Instance check
    if (!(layerConfig instanceof EsriDynamicLayerEntryConfig)) throw new Error('Invalid layer configuration type provided');
    return commonProcessLayerMetadata(this, layerConfig);
  }

  /** ****************************************************************************************************************************
   * This method creates a GeoView EsriDynamic layer using the definition provided in the layerConfig parameter.
   *
   * @param {AbstractBaseLayerEntryConfig} layerConfig Information needed to create the GeoView layer.
   *
   * @returns {Promise<BaseLayer | undefined>} The GeoView raster layer that has been created.
   */
  // GV Layers Refactoring - Obsolete (in config?, in layers?)
  protected override async processOneLayerEntry(layerConfig: AbstractBaseLayerEntryConfig): Promise<BaseLayer | undefined> {
    // GV IMPORTANT: The processOneLayerEntry method must call the corresponding method of its parent to ensure that the flow of
    // GV            layerStatus values is correctly sequenced.
    await super.processOneLayerEntry(layerConfig);

    // Instance check
    if (!(layerConfig instanceof EsriDynamicLayerEntryConfig)) throw new Error('Invalid layer configuration type provided');

    const sourceOptions: SourceOptions = {};
    sourceOptions.attributions = [(this.metadata?.copyrightText ? this.metadata?.copyrightText : '') as string];
    sourceOptions.url = getLocalizedValue(layerConfig.source.dataAccessPath!, AppEventProcessor.getDisplayLanguage(this.mapId));
    sourceOptions.params = { LAYERS: `show:${layerConfig.layerId}` };
    if (layerConfig.source.transparent) sourceOptions.params.transparent = layerConfig.source.transparent!;
    if (layerConfig.source.format) sourceOptions.params.format = layerConfig.source.format!;
    if (layerConfig.source.crossOrigin) {
      sourceOptions.crossOrigin = layerConfig.source.crossOrigin;
    } else {
      sourceOptions.crossOrigin = 'Anonymous';
    }
    if (layerConfig.source.projection) sourceOptions.projection = `EPSG:${layerConfig.source.projection}`;

    // Create the source
    const source = new ImageArcGISRest(sourceOptions);

    // GV Time to request an OpenLayers layer!
    const requestResult = this.emitLayerRequesting({ config: layerConfig, source });

    // If any response
    let olLayer: ImageLayer<ImageArcGISRest> | undefined;
    if (requestResult.length > 0) {
      // Get the OpenLayer that was created
      olLayer = requestResult[0] as ImageLayer<ImageArcGISRest>;
    }

    // If no olLayer was obtained
    if (!olLayer) {
      // We're working in old LAYERS_HYBRID_MODE (in the new mode the code below is handled in the new classes)
      const imageLayerOptions: ImageOptions<ImageArcGISRest> = {
        source,
        properties: { layerConfig },
      };
      // layerConfig.initialSettings cannot be undefined because config-validation set it to {} if it is undefined.
      if (layerConfig.initialSettings?.className !== undefined) imageLayerOptions.className = layerConfig.initialSettings.className;
      if (layerConfig.initialSettings?.extent !== undefined) imageLayerOptions.extent = layerConfig.initialSettings.extent;
      if (layerConfig.initialSettings?.maxZoom !== undefined) imageLayerOptions.maxZoom = layerConfig.initialSettings.maxZoom;
      if (layerConfig.initialSettings?.minZoom !== undefined) imageLayerOptions.minZoom = layerConfig.initialSettings.minZoom;
      if (layerConfig.initialSettings?.states?.opacity !== undefined)
        imageLayerOptions.opacity = layerConfig.initialSettings.states.opacity;
      // If a layer on the map has an initialSettings.visible set to false, its status will never reach the status 'loaded' because
      // nothing is drawn on the map. We must wait until the 'loaded' status is reached to set the visibility to false. The call
      // will be done in the layerConfig.loadedFunction() which is called right after the 'loaded' signal.

      // Create the OpenLayer layer
      olLayer = new ImageLayer(imageLayerOptions);

      // Hook the loaded event
      this.setLayerAndLoadEndListeners(layerConfig, olLayer, 'image');
    }

    // GV Time to emit about the layer creation!
    this.emitLayerCreation({ config: layerConfig, layer: olLayer });

    return Promise.resolve(olLayer);
  }

  /** ***************************************************************************************************************************
   * Returns feature information for all the features stored in the layer.
   * @param {string} layerPath - The layer path to the layer's configuration.
   * @returns {Promise<TypeFeatureInfoEntry[] | undefined | null>} The feature info table.
   */
  // GV Layers Refactoring - Obsolete (in layers)
  protected override async getAllFeatureInfo(layerPath: string): Promise<TypeFeatureInfoEntry[] | undefined | null> {
    try {
      // Get the layer config in a loaded phase
      const layerConfig = this.getLayerConfig(layerPath)! as EsriDynamicLayerEntryConfig;

      // Guess the geometry type by taking the first style key
      // TODO: Refactor - Layers migration. Johann: This will be modified with new schema, there is no more geometry on style
      const [geometryType] = layerConfig.getTypeGeometries();

      // Fetch the features
      let urlRoot = layerConfig.geoviewLayerConfig.metadataAccessPath![AppEventProcessor.getDisplayLanguage(this.mapId)]!;
      if (!urlRoot.endsWith('/')) urlRoot += '/';
      // TODO: we put false so on heavy geometry, dynamic layer can load datatable. If not the fetch fails.
      const url = `${urlRoot}${layerConfig.layerId}/query?where=1=1&outFields=*&f=json&returnGeometry=false`;

      const response = await fetch(url);
      const jsonResponse = await response.json();

      // If any features
      if (jsonResponse.features) {
        // Parse the JSON response and create features
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const features = jsonResponse.features.map((featureData: any) => {
          let geometry;

          if (featureData.geometry) {
            const coordinates = featureData.geometry.points ||
              featureData.geometry.paths ||
              featureData.geometry.rings || [featureData.geometry.x, featureData.geometry.y]; // MultiPoint or Line or Polygon or Point schema
            geometry = GeometryApi.createGeometryFromType(geometryType, coordinates);
          }

          const properties = featureData.attributes;
          return new Feature({ ...properties, geometry });
        });

        // Check if there are additional features and get them
        if (jsonResponse.exceededTransferLimit) {
          // Get response json for additional features
          const getAdditionalFeaturesArray = await this.#getAdditionalFeatures(layerConfig, url, features.length);

          // Parse them and add features
          getAdditionalFeaturesArray.forEach((responseJson) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const additionalFeatures: Feature[] = (responseJson as any).features.map((featureData: any) => {
              let geometry;

              if (featureData.geometry) {
                const coordinates = featureData.geometry.points ||
                  featureData.geometry.paths ||
                  featureData.geometry.rings || [featureData.geometry.x, featureData.geometry.y]; // MultiPoint or Line or Polygon or Point schema
                geometry = GeometryApi.createGeometryFromType(geometryType, coordinates);
              }

              const properties = featureData.attributes;
              return new Feature({ ...properties, geometry });
            });

            features.push(...additionalFeatures);
          });
        }

        // Format and return the result
        return this.formatFeatureInfoResult(features, layerConfig);
      }

      // Error
      throw new Error('Error querying service. No features were returned.');
    } catch (error) {
      // Log
      logger.logError('esri-dynamic.getAllFeatureInfo()\n', error);
      return null;
    }
  }

  /** ***************************************************************************************************************************
   * Fetch additional features from service with a max record count.
   *
   * @param {AbstractBaseLayerEntryConfig} layerConfig - The layer entry configuration.
   * @param {string} url - The base url for the service.
   * @param {number} maxRecordCount - The max record count from the service.
   * @param {number} resultOffset - The current offset to use for the features.
   * @returns {Promise<[]>} An array of the response text for the features.
   * @private
   */
  async #getAdditionalFeatures(
    layerConfig: AbstractBaseLayerEntryConfig,
    url: string,
    maxRecordCount: number,
    resultOffset?: number
  ): Promise<unknown[]> {
    const responseArray: unknown[] = [];
    // Add resultOffset to layer query
    const nextUrl = `${url}&resultOffset=${resultOffset || maxRecordCount}`;
    try {
      // Fetch response text and push to array
      const response = await fetch(nextUrl);
      const jsonResponse = await response.json();
      responseArray.push(jsonResponse);
      // Check if there are additional features to fetch
      if (jsonResponse.exceededTransferLimit)
        responseArray.push(
          ...(await this.#getAdditionalFeatures(
            layerConfig,
            url,
            maxRecordCount,
            resultOffset ? resultOffset + maxRecordCount : 2 * maxRecordCount
          ))
        );
    } catch (error) {
      logger.logError(`Error loading additional features for ${layerConfig.layerPath} from ${nextUrl}`, error);
    }
    return responseArray;
  }

  /** ***************************************************************************************************************************
   * Return feature information for all the features around the provided Pixel.
   *
   * @param {Coordinate} location The pixel coordinate that will be used by the query.
   * @param {string} layerPath The layer path to the layer's configuration.
   *
   * @returns {Promise<TypeFeatureInfoEntry[] | undefined | null>} The feature info table.
   */
  // GV Layers Refactoring - Obsolete (in layers)
  protected override getFeatureInfoAtPixel(location: Pixel, layerPath: string): Promise<TypeFeatureInfoEntry[] | undefined | null> {
    // Redirect to getFeatureInfoAtCoordinate
    return this.getFeatureInfoAtCoordinate(this.getMapViewer().map.getCoordinateFromPixel(location), layerPath);
  }

  /** ***************************************************************************************************************************
   * Return feature information for all the features around the provided projection coordinate.
   *
   * @param {Coordinate} location The coordinate that will be used by the query.
   * @param {string} layerPath The layer path to the layer's configuration.
   *
   * @returns {Promise<TypeFeatureInfoEntry[] | undefined | null>} The promised feature info table.
   */
  // GV Layers Refactoring - Obsolete (in layers)
  protected override getFeatureInfoAtCoordinate(
    location: Coordinate,
    layerPath: string
  ): Promise<TypeFeatureInfoEntry[] | undefined | null> {
    // Transform coordinate from map project to lntlat
    const projCoordinate = this.getMapViewer().convertCoordinateMapProjToLngLat(location);

    // Redirect to getFeatureInfoAtLongLat
    return this.getFeatureInfoAtLongLat(projCoordinate, layerPath);
  }

  /** ***************************************************************************************************************************
   * Return feature information for all the features around the provided coordinate.
   *
   * @param {Coordinate} lnglat The coordinate that will be used by the query.
   * @param {string} layerPath The layer path to the layer's configuration.
   *
   * @returns {Promise<TypeFeatureInfoEntry[] | undefined | null>} The promised feature info table.
   */
  // GV Layers Refactoring - Obsolete (in layers)
  protected override async getFeatureInfoAtLongLat(
    lnglat: Coordinate,
    layerPath: string
  ): Promise<TypeFeatureInfoEntry[] | undefined | null> {
    try {
      // If invisible
      if (!this.getVisible(layerPath)) return [];

      // Get the layer config in a loaded phase
      const layerConfig = this.getLayerConfig(layerPath) as EsriDynamicLayerEntryConfig;
      const layer = this.getOLLayer(layerPath) as ImageLayer<ImageArcGISRest>;

      // If not queryable
      if (!layerConfig.source?.featureInfo?.queryable) return [];

      let identifyUrl = getLocalizedValue(layerConfig.source?.dataAccessPath, AppEventProcessor.getDisplayLanguage(this.mapId));
      if (!identifyUrl) return [];

      identifyUrl = identifyUrl.endsWith('/') ? identifyUrl : `${identifyUrl}/`;

      // GV: We cannot directly use the view extent and reproject. If we do so some layers (issue #2413) identify will return empty resultset
      // GV-CONT: This happen with max extent as initial extent and 3978 projection. If we use only the LL and UP corners for the repojection it works
      const mapViewer = this.getMapViewer();
      const mapExtent = mapViewer.getView().calculateExtent();
      const boundsLL = mapViewer.convertCoordinateMapProjToLngLat([mapExtent[0], mapExtent[1]]);
      const boundsUR = mapViewer.convertCoordinateMapProjToLngLat([mapExtent[2], mapExtent[3]]);
      const extent = { xmin: boundsLL[0], ymin: boundsLL[1], xmax: boundsUR[0], ymax: boundsUR[1] };

      const source = layer.getSource();
      const layerDefs = source?.getParams().layerDefs || '';
      const size = mapViewer.map.getSize()!;

      identifyUrl =
        `${identifyUrl}identify?f=json&tolerance=${this.hitTolerance}` +
        `&mapExtent=${extent.xmin},${extent.ymin},${extent.xmax},${extent.ymax}` +
        `&imageDisplay=${size[0]},${size[1]},96` +
        `&layers=visible:${layerConfig.layerId}` +
        `&layerDefs=${layerDefs}` +
        `&returnFieldName=true&sr=4326&returnGeometry=true` +
        `&geometryType=esriGeometryPoint&geometry=${lnglat[0]},${lnglat[1]}`;

      const response = await fetch(identifyUrl);
      const jsonResponse = await response.json();
      if (jsonResponse.error) {
        logger.logInfo('There is a problem with this query: ', identifyUrl);
        throw new Error(`Error code = ${jsonResponse.error.code} ${jsonResponse.error.message}` || '');
      }
      const features = new EsriJSON().readFeatures(
        { features: jsonResponse.results },
        { dataProjection: Projection.PROJECTION_NAMES.LNGLAT, featureProjection: mapViewer.getProjection().getCode() }
      ) as Feature<Geometry>[];
      const arrayOfFeatureInfoEntries = await this.formatFeatureInfoResult(features, layerConfig);
      return arrayOfFeatureInfoEntries;
    } catch (error) {
      // Log
      logger.logError('esri-dynamic.getFeatureInfoAtLongLat()\n', error);
      return null;
    }
  }

  /** ***************************************************************************************************************************
   * Count the number of times the value of a field is used by the unique value style information object. Depending on the
   * visibility of the default, we count visible or invisible settings.
   *
   * @param {TypeUniqueValueStyleConfig} styleSettings The unique value style settings to evaluate.
   *
   * @returns {TypeFieldOfTheSameValue[][]} The result of the evaluation. The first index of the array correspond to the field's
   * index in the style settings and the second one to the number of different values the field may have based on visibility of
   * the feature.
   * @private
   */
  // GV Layers Refactoring - Obsolete (in layers)
  static #countFieldOfTheSameValue(styleSettings: TypeUniqueValueStyleConfig): TypeFieldOfTheSameValue[][] {
    return styleSettings.uniqueValueStyleInfo.reduce<TypeFieldOfTheSameValue[][]>(
      (counter, styleEntry): TypeFieldOfTheSameValue[][] => {
        if (
          (styleEntry.visible === false && styleSettings.defaultVisible !== false) ||
          (styleEntry.visible !== false && styleSettings.defaultVisible === false)
        ) {
          styleEntry.values.forEach((styleValue, i) => {
            const valueExist = counter[i].find((counterEntry) => counterEntry.value === styleValue);
            if (valueExist) valueExist.nbOccurence++;
            else counter[i].push({ value: styleValue, nbOccurence: 1 });
          });
        }
        return counter;
      },
      styleSettings.fields.map<TypeFieldOfTheSameValue[]>(() => [])
    );
  }

  /** ***************************************************************************************************************************
   * Sort the number of times the value of a field is used by the unique value style information object. Depending on the
   * visibility of the default value, we count the visible or invisible parameters. The order goes from the highest number of
   * occurrences to the lowest number of occurrences.
   *
   * @param {TypeUniqueValueStyleConfig} styleSettings The unique value style settings to evaluate.
   * @param {TypeFieldOfTheSameValue[][]} fieldOfTheSameValue The count information that contains the number of occurrences
   * of a value.
   *
   * @returns {number[]} An array that gives the field order to use to build the query tree.
   * @private
   */
  // GV Layers Refactoring - Obsolete (in layers)
  static #sortFieldOfTheSameValue(styleSettings: TypeUniqueValueStyleConfig, fieldOfTheSameValue: TypeFieldOfTheSameValue[][]): number[] {
    const fieldNotUsed = styleSettings.fields.map(() => true);
    const fieldOrder: number[] = [];
    for (let entrySelected = 0; entrySelected !== -1; entrySelected = fieldNotUsed.findIndex((flag) => flag)) {
      let entrySelectedTotalEntryCount = fieldOfTheSameValue[entrySelected].reduce((accumulator, fieldEntry) => {
        return accumulator + fieldEntry.nbOccurence;
      }, 0);
      for (let i = 0; i < styleSettings.fields.length; i++) {
        if (fieldNotUsed[i] && i !== entrySelected) {
          const newEntrySelectedTotalEntryCount = fieldOfTheSameValue[i].reduce((accumulator, fieldEntry) => {
            return accumulator + fieldEntry.nbOccurence;
          }, 0);
          if (
            fieldOfTheSameValue[entrySelected].length > fieldOfTheSameValue[i].length ||
            (fieldOfTheSameValue[entrySelected].length === fieldOfTheSameValue[i].length &&
              entrySelectedTotalEntryCount < newEntrySelectedTotalEntryCount)
          ) {
            entrySelected = i;
            entrySelectedTotalEntryCount = newEntrySelectedTotalEntryCount;
          }
        }
      }
      fieldNotUsed[entrySelected] = false;
      fieldOrder.push(entrySelected);
    }
    return fieldOrder;
  }

  /** ***************************************************************************************************************************
   * Get the query tree. The tree structure is a representation of the optimized query we have to create. It contains the field
   * values in the order specified by the fieldOrder parameter. The optimization is based on the distributivity and associativity
   * of the Boolean algebra. The form is the following:
   *
   * (f1 = v11 and (f2 = v21 and f3 in (v31, v32) or f2 = v22 and f3 in (v31, v32, v33)) or f1 = v12 and (f2 = v21 and ...)))
   *
   * which is equivalent to:
   *
   * f1 = v11 and f2 = v21 and f3 = v31 or f1 = v11 and f2 = v21 and f3 = v32 or f1 = v11 and f2 = v22 and f3 = v31 ...
   *
   * @param {TypeUniqueValueStyleConfig} styleSettings The unique value style settings to evaluate.
   * @param {TypeFieldOfTheSameValue[][]} fieldOfTheSameValue The count information that contains the number of occurrences
   * of a value.
   * @param {number[]} fieldOrder The field order to use when building the tree.
   *
   * @returns {TypeQueryTree} The query tree to use when building the final query string.
   * @private
   */
  // GV Layers Refactoring - Obsolete (in layers)
  static #getQueryTree(
    styleSettings: TypeUniqueValueStyleConfig,
    fieldOfTheSameValue: TypeFieldOfTheSameValue[][],
    fieldOrder: number[]
  ): TypeQueryTree {
    const queryTree: TypeQueryTree = [];
    styleSettings.uniqueValueStyleInfo.forEach((styleEntry) => {
      if (
        (styleEntry.visible === false && styleSettings.defaultVisible !== false) ||
        (styleEntry.visible !== false && styleSettings.defaultVisible === false)
      ) {
        let levelToSearch = queryTree;
        for (let i = 0; i < fieldOrder.length; i++) {
          if (fieldOfTheSameValue[fieldOrder[i]].find((field) => field.value === styleEntry.values[fieldOrder[i]])) {
            const treeElementFound = levelToSearch.find((treeElement) => styleEntry.values[fieldOrder[i]] === treeElement.fieldValue);
            if (!treeElementFound) {
              levelToSearch.push({ fieldValue: styleEntry.values[fieldOrder[i]], nextField: [] });
              levelToSearch = levelToSearch[levelToSearch.length - 1].nextField;
            } else levelToSearch = treeElementFound.nextField;
          }
        }
      }
    });
    return queryTree;
  }

  /** ***************************************************************************************************************************
   * format the field value to use in the query.
   *
   * @param {string} fieldName The field name.
   * @param {string | number | Date} rawValue The unformatted field value.
   * @param {TypeFeatureInfoLayerConfig} sourceFeatureInfo The source feature information that knows the field type.
   *
   * @returns {string} The resulting field value.
   * @private
   */
  // GV Layers Refactoring - Obsolete (in layers)
  #formatFieldValue(fieldName: string, rawValue: string | number | Date, sourceFeatureInfo: TypeFeatureInfoLayerConfig): string {
    const fieldIndex = getLocalizedValue(sourceFeatureInfo.outfields, AppEventProcessor.getDisplayLanguage(this.mapId))
      ?.split(',')
      .indexOf(fieldName);
    const fieldType = sourceFeatureInfo.fieldTypes?.split(',')[fieldIndex!];
    switch (fieldType) {
      case 'date':
        return `date '${rawValue}'`;
      case 'string':
        return `'${rawValue}'`;
      default:
        return `${rawValue}`;
    }
  }

  /** ***************************************************************************************************************************
   * Build the query using the provided query tree.
   *
   * @param {TypeQueryTree} queryTree The query tree to use.
   * @param {number} level The level to use for solving the tree.
   * @param {number[]} fieldOrder The field order to use for solving the tree.
   * @param {TypeUniqueValueStyleConfig} styleSettings The unique value style settings to evaluate.
   * @param {TypeFeatureInfoLayerConfig} sourceFeatureInfo The source feature information that knows the field type.
   *
   * @returns {string} The resulting query.
   * @private
   */
  // GV Layers Refactoring - Obsolete (in layers)
  #buildQuery(
    queryTree: TypeQueryTree,
    level: number,
    fieldOrder: number[],
    styleSettings: TypeUniqueValueStyleConfig,
    sourceFeatureInfo: TypeFeatureInfoLayerConfig
  ): string {
    let queryString = styleSettings.defaultVisible !== false && !level ? 'not (' : '(';
    for (let i = 0; i < queryTree.length; i++) {
      const value = this.#formatFieldValue(styleSettings.fields[fieldOrder[level]], queryTree[i].fieldValue, sourceFeatureInfo);
      // The nextField array is not empty, then it is is not the last field
      if (queryTree[i].nextField.length) {
        // If i > 0 (true) then we add a OR clause
        if (i) queryString = `${queryString} or `;
        // Add to the query the 'fieldName = value and ' + the result of the recursive call to buildQuery using the next field and level
        queryString = `${queryString}${styleSettings.fields[fieldOrder[level]]} = ${value} and ${this.#buildQuery(
          queryTree[i].nextField,
          level + 1,
          fieldOrder,
          styleSettings,
          sourceFeatureInfo
        )}`;
      } else {
        // We have reached the last field and i = 0 (false) we concatenate 'fieldName in (value' else we concatenate ', value'
        queryString = i ? `${queryString}, ${value}` : `${styleSettings.fields[fieldOrder[level]]} in (${value}`;
      }
      // If i points to the last element of the queryTree, close the parenthesis.
      if (i === queryTree.length - 1) queryString = `${queryString})`;
    }
    return queryString === '(' ? '(1=0)' : queryString;
  }

  /** ***************************************************************************************************************************
   * Get the layer view filter. The filter is derived from the uniqueValue or the classBreak visibility flags and a layerFilter
   * associated to the layer.
   *
   * @param {string} layerPath The layer path to the layer's configuration.
   *
   * @returns {string} the filter associated to the layerPath
   */
  // GV Layers Refactoring - Obsolete (in layers)
  getViewFilter(layerPath: string): string {
    const layerConfig = this.getLayerConfig(layerPath) as EsriDynamicLayerEntryConfig;
    const { layerFilter } = layerConfig;

    // Get the style
    const style = this.getStyle(layerConfig.layerPath);

    if (style) {
      const setAllUndefinedVisibilityFlagsToYes = (styleConfig: TypeUniqueValueStyleConfig | TypeClassBreakStyleConfig): void => {
        // default value is true for all undefined visibility flags
        if (styleConfig.defaultVisible === undefined) styleConfig.defaultVisible = true;
        const settings = isUniqueValueStyleConfig(styleConfig) ? styleConfig.uniqueValueStyleInfo : styleConfig.classBreakStyleInfo;
        for (let i = 0; i < settings.length; i++) if (settings[i].visible === undefined) settings[i].visible = true;
      };

      const featuresAreAllVisible = (defaultVisibility: boolean, settings: { visible: boolean }[]): boolean => {
        let allVisible = defaultVisibility !== false;
        for (let i = 0; i < settings.length; i++) {
          allVisible &&= settings[i].visible !== false;
        }
        return allVisible;
      };

      // Get the first style settings
      const styleSettings = layerConfig.getFirstStyleSettings()!;

      if (isSimpleStyleConfig(styleSettings)) {
        return layerFilter || '(1=1)';
      }
      if (isUniqueValueStyleConfig(styleSettings)) {
        setAllUndefinedVisibilityFlagsToYes(styleSettings);
        if (featuresAreAllVisible(styleSettings.defaultVisible!, styleSettings.uniqueValueStyleInfo as { visible: boolean }[]))
          return `(1=1)${layerFilter ? ` and (${layerFilter})` : ''}`;

        // This section of code optimize the query to reduce it at it shortest expression.
        const fieldOfTheSameValue = EsriDynamic.#countFieldOfTheSameValue(styleSettings);
        const fieldOrder = EsriDynamic.#sortFieldOfTheSameValue(styleSettings, fieldOfTheSameValue);
        const queryTree = EsriDynamic.#getQueryTree(styleSettings, fieldOfTheSameValue, fieldOrder);
        // TODO: Refactor - Layers refactoring. We should use the source.featureInfo from the layer, not the layerConfig anymore, here and below
        const query = this.#buildQuery(queryTree, 0, fieldOrder, styleSettings, layerConfig.source.featureInfo!);
        return `${query}${layerFilter ? ` and (${layerFilter})` : ''}`;
      }

      if (isClassBreakStyleConfig(styleSettings)) {
        setAllUndefinedVisibilityFlagsToYes(styleSettings);
        if (featuresAreAllVisible(styleSettings.defaultVisible!, styleSettings.classBreakStyleInfo as { visible: boolean }[]))
          return `(1=1)${layerFilter ? ` and (${layerFilter})` : ''}`;

        const filterArray: string[] = [];
        let visibleWhenGreatherThisIndex = -1;
        for (let i = 0; i < styleSettings.classBreakStyleInfo.length; i++) {
          if (filterArray.length % 2 === 0) {
            if (i === 0) {
              if (styleSettings.classBreakStyleInfo[0].visible !== false && styleSettings.defaultVisible === false)
                filterArray.push(
                  `${styleSettings.field} >= ${this.#formatFieldValue(
                    styleSettings.field,
                    styleSettings.classBreakStyleInfo[0].minValue!,
                    layerConfig.source.featureInfo!
                  )}`
                );
              else if (styleSettings.classBreakStyleInfo[0].visible === false && styleSettings.defaultVisible !== false) {
                filterArray.push(
                  `${styleSettings.field} < ${this.#formatFieldValue(
                    styleSettings.field,
                    styleSettings.classBreakStyleInfo[0].minValue!,
                    layerConfig.source.featureInfo!
                  )}`
                );
                visibleWhenGreatherThisIndex = i;
              }
            } else if (styleSettings.classBreakStyleInfo[i].visible !== false && styleSettings.defaultVisible === false) {
              filterArray.push(
                `${styleSettings.field} > ${this.#formatFieldValue(
                  styleSettings.field,
                  styleSettings.classBreakStyleInfo[i].minValue!,
                  layerConfig.source.featureInfo!
                )}`
              );
              if (i + 1 === styleSettings.classBreakStyleInfo.length)
                filterArray.push(
                  `${styleSettings.field} <= ${this.#formatFieldValue(
                    styleSettings.field,
                    styleSettings.classBreakStyleInfo[i].maxValue!,
                    layerConfig.source.featureInfo!
                  )}`
                );
            } else if (styleSettings.classBreakStyleInfo[i].visible === false && styleSettings.defaultVisible !== false) {
              filterArray.push(
                `${styleSettings.field} <= ${this.#formatFieldValue(
                  styleSettings.field,
                  styleSettings.classBreakStyleInfo[i].minValue!,
                  layerConfig.source.featureInfo!
                )}`
              );
              visibleWhenGreatherThisIndex = i;
            }
          } else if (styleSettings.defaultVisible === false) {
            if (styleSettings.classBreakStyleInfo[i].visible === false) {
              filterArray.push(
                `${styleSettings.field} <= ${this.#formatFieldValue(
                  styleSettings.field,
                  styleSettings.classBreakStyleInfo[i - 1].maxValue!,
                  layerConfig.source.featureInfo!
                )}`
              );
            } else if (i + 1 === styleSettings.classBreakStyleInfo.length) {
              filterArray.push(
                `${styleSettings.field} <= ${this.#formatFieldValue(
                  styleSettings.field,
                  styleSettings.classBreakStyleInfo[i].maxValue!,
                  layerConfig.source.featureInfo!
                )}`
              );
            }
          } else if (styleSettings.classBreakStyleInfo[i].visible !== false) {
            filterArray.push(
              `${styleSettings.field} > ${this.#formatFieldValue(
                styleSettings.field,
                styleSettings.classBreakStyleInfo[i - 1].maxValue!,
                layerConfig.source.featureInfo!
              )}`
            );
            visibleWhenGreatherThisIndex = -1;
          } else {
            visibleWhenGreatherThisIndex = i;
          }
        }
        if (visibleWhenGreatherThisIndex !== -1)
          filterArray.push(
            `${styleSettings.field} > ${this.#formatFieldValue(
              styleSettings.field,
              styleSettings.classBreakStyleInfo[visibleWhenGreatherThisIndex].maxValue!,
              layerConfig.source.featureInfo!
            )}`
          );

        if (styleSettings.defaultVisible !== false) {
          const filterValue = `${filterArray.slice(0, -1).reduce((previousFilterValue, filterNode, i) => {
            if (i === 0) return `(${filterNode} or `;
            if (i % 2 === 0) return `${previousFilterValue} and ${filterNode}) or `;
            return `${previousFilterValue}(${filterNode}`;
          }, '')}${filterArray.slice(-1)[0]})`;
          return `${filterValue}${layerFilter ? ` and (${layerFilter})` : ''}`;
        }

        const filterValue = filterArray.length
          ? `${filterArray.reduce((previousFilterValue, filterNode, i) => {
              if (i === 0) return `((${filterNode} and `;
              if (i % 2 === 0) return `${previousFilterValue} or (${filterNode} and `;
              return `${previousFilterValue}${filterNode})`;
            }, '')})`
          : // We use '(1=0)' as false to select nothing
            '(1=0)';
        return `${filterValue}${layerFilter ? ` and (${layerFilter})` : ''}`;
      }
    }
    return '(1=1)';
  }

  /**
   * Overrides when the layer gets in loaded status.
   */
  // GV Layers Refactoring - Obsolete (in layers)
  override onLoaded(layerConfig: AbstractBaseLayerEntryConfig): void {
    // Call parent
    super.onLoaded(layerConfig);

    // Apply view filter immediately
    this.applyViewFilter(layerConfig.layerPath, (layerConfig as EsriDynamicLayerEntryConfig).layerFilter || '');
  }

  /** ***************************************************************************************************************************
   * Applies a view filter to the layer. When the combineLegendFilter flag is false, the filter paramater is used alone to display
   * the features. Otherwise, the legend filter and the filter parameter are combined together to define the view filter. The
   * legend filters are derived from the uniqueValue or classBreaks style of the layer. When the layer config is invalid, nothing
   * is done.
   *
   * @param {string} layerPath The layer path to the layer's configuration.
   * @param {string} filter An optional filter to be used in place of the getViewFilter value.
   * @param {boolean} combineLegendFilter Flag used to combine the legend filter and the filter together (default: true)
   */
  // GV Layers Refactoring - Obsolete (in layers)
  applyViewFilter(layerPath: string, filter: string, combineLegendFilter = true): void {
    // Log
    logger.logTraceCore('ESRI-DYNAMIC - applyViewFilter', layerPath);

    const layerConfig = this.getLayerConfig(layerPath) as EsriDynamicLayerEntryConfig;
    const olLayer = this.getOLLayer(layerPath) as ImageLayer<ImageArcGISRest> | undefined;

    let filterValueToUse = filter.replaceAll(/\s{2,}/g, ' ').trim();
    layerConfig.legendFilterIsOff = !combineLegendFilter;
    layerConfig.layerFilter = filterValueToUse;
    if (combineLegendFilter) filterValueToUse = this.getViewFilter(layerPath);

    // Convert date constants using the externalFragmentsOrder derived from the externalDateFormat
    // TODO: Standardize the regex across all layer types
    const searchDateEntry = [
      ...`${filterValueToUse?.replaceAll(/\s{2,}/g, ' ').trim()} `.matchAll(
        /(?<=^date\b\s')[\d/\-T\s:+Z]{4,25}(?=')|(?<=[(\s]date\b\s')[\d/\-T\s:+Z]{4,25}(?=')/gi
      ),
    ];
    searchDateEntry.reverse();
    searchDateEntry.forEach((dateFound) => {
      // If the date has a time zone, keep it as is, otherwise reverse its time zone by changing its sign
      const reverseTimeZone = ![20, 25].includes(dateFound[0].length);
      let reformattedDate = DateMgt.applyInputDateFormat(dateFound[0], this.externalFragmentsOrder, reverseTimeZone);
      // GV ESRI Dynamic layers doesn't accept the ISO date format. The time zone must be removed. The 'T' separator
      // GV normally placed between the date and the time must be replaced by a space.
      reformattedDate = reformattedDate.slice(0, reformattedDate.length === 20 ? -1 : -6); // drop time zone.
      reformattedDate = reformattedDate.replace('T', ' ');
      filterValueToUse = `${filterValueToUse!.slice(0, dateFound.index)}${reformattedDate}${filterValueToUse!.slice(
        dateFound.index! + dateFound[0].length
      )}`;
    });

    olLayer?.getSource()!.updateParams({ layerDefs: `{"${layerConfig.layerId}": "${filterValueToUse}"}` });
    olLayer?.changed();

    // Emit event
    this.emitLayerFilterApplied({
      layerPath,
      filter: filterValueToUse,
    });
  }

  /** ***************************************************************************************************************************
   * Get the bounds of the layer represented in the layerConfig pointed to by the layerPath, returns updated bounds
   *
   * @param {string} layerPath The Layer path to the layer's configuration.
   *
   * @returns {Extent | undefined} The new layer bounding box.
   */
  // GV Layers Refactoring - Obsolete (in layers)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  override getBounds(layerPath: string): Extent | undefined {
    // Get the metadata extent
    const metadataExtent = this.getMetadataExtent();

    // If found
    let layerBounds;
    if (metadataExtent) {
      // Get the metadata projection
      const metadataProjection = this.getMetadataProjection();
      layerBounds = this.getMapViewer().convertExtentFromProjToMapProj(metadataExtent, metadataProjection);
      layerBounds = validateExtent(layerBounds, this.getMapViewer().getProjection().getCode());
    }

    // Return the calculated layer bounds
    return layerBounds;
  }

  /**
   * Sends a query to get ESRI Dynamic feature geometries and calculates an extent from them.
   * @param {string} layerPath - The layer path.
   * @param {string[]} objectIds - The IDs of the features to calculate the extent from.
   * @returns {Promise<Extent | undefined>} The extent of the features, if available.
   */
  override async getExtentFromFeatures(layerPath: string, objectIds: string[]): Promise<Extent | undefined> {
    // Get url for service from layer entry config
    const layerEntryConfig = this.getLayerConfig(layerPath)! as EsriDynamicLayerEntryConfig;
    let baseUrl = getLocalizedValue(layerEntryConfig.source.dataAccessPath, AppEventProcessor.getDisplayLanguage(this.mapId));

    const idString = objectIds.join('%2C');
    if (baseUrl) {
      // Construct query
      if (!baseUrl.endsWith('/')) baseUrl += '/';
      const queryUrl = `${baseUrl}${layerEntryConfig.layerId}/query?&f=json&where=&objectIds=${idString}&returnGeometry=true`;

      try {
        const response = await fetch(queryUrl);
        const responseJson = await response.json();

        // Convert response json to OL features
        const responseFeatures = new EsriJSON().readFeatures(
          { features: responseJson.features },
          {
            dataProjection: `EPSG:${responseJson.spatialReference.wkid}`,
            featureProjection: this.getMapViewer().getProjection().getCode(),
          }
        );

        // Determine max extent from features
        let calculatedExtent: Extent | undefined;
        responseFeatures.forEach((feature) => {
          const extent = feature.getGeometry()?.getExtent();

          if (extent) {
            // If extent has not been defined, set it to extent
            if (!calculatedExtent) calculatedExtent = extent;
            else getMinOrMaxExtents(calculatedExtent, extent);
          }
        });

        return calculatedExtent;
      } catch (error) {
        logger.logError(`Error fetching geometry from ${queryUrl}`, error);
      }
    }
    return undefined;
  }
}
