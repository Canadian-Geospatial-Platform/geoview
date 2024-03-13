/* eslint-disable no-param-reassign */
// We have many reassign for layerPath-layerConfig. We keep it global...
import { ImageArcGISRest } from 'ol/source';
import { Options as SourceOptions } from 'ol/source/ImageArcGISRest';
import { Options as ImageOptions } from 'ol/layer/BaseImage';
import { Image as ImageLayer } from 'ol/layer';
import { Coordinate } from 'ol/coordinate';
import { Pixel } from 'ol/pixel';
import { EsriJSON } from 'ol/format';
import { Extent } from 'ol/extent';
import Feature from 'ol/Feature';
import Geometry from 'ol/geom/Geometry';

import { getLocalizedValue, getMinOrMaxExtents } from '@/core/utils/utilities';
import { AbstractGeoViewLayer, CONST_LAYER_TYPES } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { AbstractGeoViewRaster, TypeBaseRasterLayer } from '@/geo/layer/geoview-layers/raster/abstract-geoview-raster';
import { api } from '@/app';
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';
import { TypeJsonObject } from '@/core/types/global-types';
import { logger } from '@/core/utils/logger';
import { EsriFeatureLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-validation-classes/esri-feature-layer-entry-config';
import { EsriDynamicLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/esri-dynamic-layer-entry-config';
import {
  TypeLayerEntryConfig,
  TypeGeoviewLayerConfig,
  TypeStyleGeometry,
  isUniqueValueStyleConfig,
  isClassBreakStyleConfig,
  TypeUniqueValueStyleConfig,
  TypeClassBreakStyleConfig,
  isSimpleStyleConfig,
  TypeListOfLayerEntryConfig,
  TypeFeatureInfoLayerConfig,
} from '@/geo/map/map-schema-types';
import { TypeFeatureInfoEntry, codedValueType, rangeDomainType } from '@/geo/utils/layer-set';

import {
  commonGetFieldDomain,
  commonGetFieldType,
  commonfetchServiceMetadata,
  commonProcessFeatureInfoConfig,
  commonProcessInitialSettings,
  commonProcessLayerMetadata,
  commonProcessTemporalDimension,
  commonValidateListOfLayerEntryConfig,
} from '../esri-layer-common';

export interface TypeEsriDynamicLayerConfig extends Omit<TypeGeoviewLayerConfig, 'listOfLayerEntryConfig'> {
  geoviewLayerType: typeof CONST_LAYER_TYPES.ESRI_DYNAMIC;
  listOfLayerEntryConfig: EsriDynamicLayerEntryConfig[];
}

type TypeFieldOfTheSameValue = { value: string | number | Date; nbOccurence: number };
type TypeQueryTree = { fieldValue: string | number | Date; nextField: TypeQueryTree }[];

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

// ******************************************************************************************************************************
// ******************************************************************************************************************************
/** ******************************************************************************************************************************
 * A class to add esri dynamic layer.
 *
 * @exports
 * @class EsriDynamic
 */
// ******************************************************************************************************************************
export class EsriDynamic extends AbstractGeoViewRaster {
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
  protected fetchServiceMetadata(): Promise<void> {
    return commonfetchServiceMetadata.call(this);
  }

  /** ***************************************************************************************************************************
   * This method validates recursively the configuration of the layer entries to ensure that it is a feature layer identified
   * with a numeric layerId and creates a group entry when a layer is a group.
   *
   * @param {TypeListOfLayerEntryConfig} listOfLayerEntryConfig The list of layer entries configuration to validate.
   */
  validateListOfLayerEntryConfig(listOfLayerEntryConfig: TypeListOfLayerEntryConfig) {
    commonValidateListOfLayerEntryConfig.call(this, listOfLayerEntryConfig);
  }

  /** ***************************************************************************************************************************
   * This method perform specific validation that can only be done by the child of the AbstractGeoViewEsriLayer class.
   *
   * @param {number} esriIndex The index of the current layer in the metadata.
   *
   * @returns {boolean} true if an error is detected.
   */
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
   * @param {TypeLayerEntryConfig} layerConfig layer configuration.
   *
   * @returns {'string' | 'date' | 'number'} The type of the field.
   */
  protected getFieldType(fieldName: string, layerConfig: TypeLayerEntryConfig): 'string' | 'date' | 'number' {
    return commonGetFieldType.call(this, fieldName, layerConfig);
  }

  /** ***************************************************************************************************************************
   * Return the domain of the specified field.
   *
   * @param {string} fieldName field name for which we want to get the domain.
   * @param {TypeLayerEntryConfig} layerConfig layer configuration.
   *
   * @returns {null | codedValueType | rangeDomainType} The domain of the field.
   */
  protected getFieldDomain(fieldName: string, layerConfig: TypeLayerEntryConfig): null | codedValueType | rangeDomainType {
    return commonGetFieldDomain.call(this, fieldName, layerConfig);
  }

  /** ***************************************************************************************************************************
   * This method will create a Geoview temporal dimension if it exist in the service metadata
   * @param {TypeJsonObject} esriTimeDimension The ESRI time dimension object
   * @param {EsriFeatureLayerEntryConfig | EsriDynamicLayerEntryConfig} layerConfig The layer entry to configure
   */
  protected processTemporalDimension(
    esriTimeDimension: TypeJsonObject,
    layerConfig: EsriFeatureLayerEntryConfig | EsriDynamicLayerEntryConfig // TODO: why feature layer is dynamic config not in common
  ) {
    commonProcessTemporalDimension.call(this, esriTimeDimension, layerConfig);
  }

  /** ***************************************************************************************************************************
   * This method verifies if the layer is queryable and sets the outfields and aliasFields of the source feature info.
   *
   * @param {EsriDynamicLayerEntryConfig} layerConfig The layer entry to configure.
   */
  processFeatureInfoConfig = (layerConfig: EsriDynamicLayerEntryConfig) => {
    commonProcessFeatureInfoConfig.call(this, layerConfig);
  };

  /** ***************************************************************************************************************************
   * This method set the initial settings based on the service metadata. Priority is given to the layer configuration.
   *
   * @param {EsriDynamic} this The ESRI layer instance pointer.
   * @param {EsriDynamicLayerEntryConfig} layerConfig The layer entry to configure.
   */
  processInitialSettings(layerConfig: EsriDynamicLayerEntryConfig) {
    commonProcessInitialSettings.call(this, layerConfig);
  }

  /** ***************************************************************************************************************************
   * This method is used to process the layer's metadata. It will fill the empty fields of the layer's configuration (renderer,
   * initial settings, fields and aliases).
   *
   * @param {TypeLayerEntryConfig} layerConfig The layer entry configuration to process.
   *
   * @returns {Promise<TypeLayerEntryConfig>} A promise that the layer configuration has its metadata processed.
   */
  protected processLayerMetadata(layerConfig: TypeLayerEntryConfig): Promise<TypeLayerEntryConfig> {
    return commonProcessLayerMetadata.call(this, layerConfig);
  }

  /** ****************************************************************************************************************************
   * This method creates a GeoView EsriDynamic layer using the definition provided in the layerConfig parameter.
   *
   * @param {EsriDynamicLayerEntryConfig} layerConfig Information needed to create the GeoView layer.
   *
   * @returns {TypeBaseRasterLayer} The GeoView raster layer that has been created.
   */
  protected processOneLayerEntry(layerConfig: EsriDynamicLayerEntryConfig): Promise<TypeBaseRasterLayer | null> {
    // GV IMPORTANT: The processOneLayerEntry method must call the corresponding method of its parent to ensure that the flow of
    // GV            layerStatus values is correctly sequenced.
    super.processOneLayerEntry(layerConfig);
    const sourceOptions: SourceOptions = {};
    sourceOptions.attributions = [(this.metadata!.copyrightText ? this.metadata!.copyrightText : '') as string];
    sourceOptions.url = getLocalizedValue(layerConfig.source.dataAccessPath!, this.mapId);
    sourceOptions.params = { LAYERS: `show:${layerConfig.layerId}` };
    if (layerConfig.source.transparent) Object.defineProperty(sourceOptions.params, 'transparent', layerConfig.source.transparent!);
    if (layerConfig.source.format) Object.defineProperty(sourceOptions.params, 'format', layerConfig.source.format!);
    if (layerConfig.source.crossOrigin) {
      sourceOptions.crossOrigin = layerConfig.source.crossOrigin;
    } else {
      sourceOptions.crossOrigin = 'Anonymous';
    }
    if (layerConfig.source.projection) sourceOptions.projection = `EPSG:${layerConfig.source.projection}`;

    const imageLayerOptions: ImageOptions<ImageArcGISRest> = {
      source: new ImageArcGISRest(sourceOptions),
      properties: { layerConfig },
    };
    // layerConfig.initialSettings cannot be undefined because config-validation set it to {} if it is undefined.
    if (layerConfig.initialSettings?.className !== undefined) imageLayerOptions.className = layerConfig.initialSettings.className;
    if (layerConfig.initialSettings?.extent !== undefined) imageLayerOptions.extent = layerConfig.initialSettings.extent;
    if (layerConfig.initialSettings?.maxZoom !== undefined) imageLayerOptions.maxZoom = layerConfig.initialSettings.maxZoom;
    if (layerConfig.initialSettings?.minZoom !== undefined) imageLayerOptions.minZoom = layerConfig.initialSettings.minZoom;
    if (layerConfig.initialSettings?.states?.opacity !== undefined) imageLayerOptions.opacity = layerConfig.initialSettings.states.opacity;
    // If a layer on the map has an initialSettings.visible set to false, its status will never reach the status 'loaded' because
    // nothing is drawn on the map. We must wait until the 'loaded' status is reached to set the visibility to false. The call
    // will be done in the layerConfig.loadedFunction() which is called right after the 'loaded' signal.

    layerConfig.olLayerAndLoadEndListeners = {
      olLayer: new ImageLayer(imageLayerOptions),
      loadEndListenerType: 'image',
    };
    layerConfig.geoviewLayerInstance = this;

    return Promise.resolve(layerConfig.olLayer);
  }

  /** ***************************************************************************************************************************
   * Return feature information for all the features around the provided Pixel.
   *
   * @param {Coordinate} location The pixel coordinate that will be used by the query.
   * @param {string} layerPath The layer path to the layer's configuration.
   *
   * @returns {Promise<TypeFeatureInfoEntry[] | undefined | null>} The feature info table.
   */
  protected getFeatureInfoAtPixel(location: Pixel, layerPath: string): Promise<TypeFeatureInfoEntry[] | undefined | null> {
    const { map } = api.maps[this.mapId];
    return this.getFeatureInfoAtCoordinate(map.getCoordinateFromPixel(location), layerPath);
  }

  /** ***************************************************************************************************************************
   * Return feature information for all the features around the provided projection coordinate.
   *
   * @param {Coordinate} location The coordinate that will be used by the query.
   * @param {string} layerPath The layer path to the layer's configuration.
   *
   * @returns {Promise<TypeFeatureInfoEntry[] | undefined | null>} The promised feature info table.
   */
  protected getFeatureInfoAtCoordinate(location: Coordinate, layerPath: string): Promise<TypeFeatureInfoEntry[] | undefined | null> {
    const convertedLocation = api.projection.transform(
      location,
      `EPSG:${MapEventProcessor.getMapState(this.mapId).currentProjection}`,
      'EPSG:4326'
    );
    return this.getFeatureInfoAtLongLat(convertedLocation, layerPath);
  }

  /** ***************************************************************************************************************************
   * Return feature information for all the features around the provided coordinate.
   *
   * @param {Coordinate} lnglat The coordinate that will be used by the query.
   * @param {string} layerPath The layer path to the layer's configuration.
   *
   * @returns {Promise<TypeFeatureInfoEntry[] | undefined | null>} The promised feature info table.
   */
  protected async getFeatureInfoAtLongLat(lnglat: Coordinate, layerPath: string): Promise<TypeFeatureInfoEntry[] | undefined | null> {
    try {
      // Get the layer config in a loaded phase
      const layerConfig = (await this.getLayerConfig(layerPath)) as EsriDynamicLayerEntryConfig;
      if (!this.getVisible(layerPath)) return [];
      if (!layerConfig.source?.featureInfo?.queryable) return [];

      let identifyUrl = getLocalizedValue(layerConfig.source?.dataAccessPath, this.mapId);
      if (!identifyUrl) return [];

      identifyUrl = identifyUrl.endsWith('/') ? identifyUrl : `${identifyUrl}/`;
      const mapLayer = api.maps[this.mapId].map;
      const { currentProjection } = MapEventProcessor.getMapState(this.mapId);
      const size = mapLayer.getSize()!;
      let bounds = mapLayer.getView().calculateExtent();
      bounds = api.projection.transformExtent(bounds, `EPSG:${currentProjection}`, 'EPSG:4326');

      const extent = { xmin: bounds[0], ymin: bounds[1], xmax: bounds[2], ymax: bounds[3] };

      const source = (layerConfig.olLayer as ImageLayer<ImageArcGISRest>).getSource()!;
      const { layerDefs } = source.getParams();

      identifyUrl =
        `${identifyUrl}identify?f=json&tolerance=7` +
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
        { dataProjection: 'EPSG:4326', featureProjection: `EPSG:${currentProjection}` }
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
   */
  private countFieldOfTheSameValue(styleSettings: TypeUniqueValueStyleConfig): TypeFieldOfTheSameValue[][] {
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
   */
  private sortFieldOfTheSameValue(styleSettings: TypeUniqueValueStyleConfig, fieldOfTheSameValue: TypeFieldOfTheSameValue[][]): number[] {
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
   */
  private getQueryTree(
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
   */
  private formatFieldValue(fieldName: string, rawValue: string | number | Date, sourceFeatureInfo: TypeFeatureInfoLayerConfig): string {
    const fieldIndex = getLocalizedValue(sourceFeatureInfo.outfields, this.mapId)?.split(',').indexOf(fieldName);
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
   */
  private buildQuery(
    queryTree: TypeQueryTree,
    level: number,
    fieldOrder: number[],
    styleSettings: TypeUniqueValueStyleConfig,
    sourceFeatureInfo: TypeFeatureInfoLayerConfig
  ): string {
    let queryString = styleSettings.defaultVisible !== false && !level ? 'not (' : '(';
    for (let i = 0; i < queryTree.length; i++) {
      const value = this.formatFieldValue(styleSettings.fields[fieldOrder[level]], queryTree[i].fieldValue, sourceFeatureInfo);
      // The nextField array is not empty, then it is is not the last field
      if (queryTree[i].nextField.length) {
        // If i > 0 (true) then we add a OR clause
        if (i) queryString = `${queryString} or `;
        // Add to the query the 'fieldName = value and ' + the result of the recursive call to buildQuery using the next field and level
        queryString = `${queryString}${styleSettings.fields[fieldOrder[level]]} = ${value} and ${this.buildQuery(
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
  getViewFilter(layerPath: string): string {
    layerPath = layerPath || this.layerPathAssociatedToTheGeoviewLayer;
    const layerConfig = this.getLayerConfig(layerPath) as EsriDynamicLayerEntryConfig;
    const layerFilter = layerConfig.olLayer?.get('layerFilter');

    if (layerConfig?.style) {
      const setAllUndefinedVisibilityFlagsToYes = (styleConfig: TypeUniqueValueStyleConfig | TypeClassBreakStyleConfig) => {
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

      const styleSettings = layerConfig.style[Object.keys(layerConfig.style)[0] as TypeStyleGeometry]!;

      if (isSimpleStyleConfig(styleSettings)) {
        return layerFilter || '(1=1)';
      }
      if (isUniqueValueStyleConfig(styleSettings)) {
        setAllUndefinedVisibilityFlagsToYes(styleSettings);
        if (featuresAreAllVisible(styleSettings.defaultVisible!, styleSettings.uniqueValueStyleInfo as { visible: boolean }[]))
          return `(1=1)${layerFilter ? ` and (${layerFilter})` : ''}`;

        // This section of code optimize the query to reduce it at it shortest expression.
        const fieldOfTheSameValue = this.countFieldOfTheSameValue(styleSettings);
        const fieldOrder = this.sortFieldOfTheSameValue(styleSettings, fieldOfTheSameValue);
        const queryTree = this.getQueryTree(styleSettings, fieldOfTheSameValue, fieldOrder);
        const query = this.buildQuery(queryTree, 0, fieldOrder, styleSettings, layerConfig.source.featureInfo!);
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
                  `${styleSettings.field} >= ${this.formatFieldValue(
                    styleSettings.field,
                    styleSettings.classBreakStyleInfo[0].minValue!,
                    layerConfig.source.featureInfo!
                  )}`
                );
              else if (styleSettings.classBreakStyleInfo[0].visible === false && styleSettings.defaultVisible !== false) {
                filterArray.push(
                  `${styleSettings.field} < ${this.formatFieldValue(
                    styleSettings.field,
                    styleSettings.classBreakStyleInfo[0].minValue!,
                    layerConfig.source.featureInfo!
                  )}`
                );
                visibleWhenGreatherThisIndex = i;
              }
            } else if (styleSettings.classBreakStyleInfo[i].visible !== false && styleSettings.defaultVisible === false) {
              filterArray.push(
                `${styleSettings.field} > ${this.formatFieldValue(
                  styleSettings.field,
                  styleSettings.classBreakStyleInfo[i].minValue!,
                  layerConfig.source.featureInfo!
                )}`
              );
              if (i + 1 === styleSettings.classBreakStyleInfo.length)
                filterArray.push(
                  `${styleSettings.field} <= ${this.formatFieldValue(
                    styleSettings.field,
                    styleSettings.classBreakStyleInfo[i].maxValue!,
                    layerConfig.source.featureInfo!
                  )}`
                );
            } else if (styleSettings.classBreakStyleInfo[i].visible === false && styleSettings.defaultVisible !== false) {
              filterArray.push(
                `${styleSettings.field} <= ${this.formatFieldValue(
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
                `${styleSettings.field} <= ${this.formatFieldValue(
                  styleSettings.field,
                  styleSettings.classBreakStyleInfo[i - 1].maxValue!,
                  layerConfig.source.featureInfo!
                )}`
              );
            } else if (i + 1 === styleSettings.classBreakStyleInfo.length) {
              filterArray.push(
                `${styleSettings.field} <= ${this.formatFieldValue(
                  styleSettings.field,
                  styleSettings.classBreakStyleInfo[i].maxValue!,
                  layerConfig.source.featureInfo!
                )}`
              );
            }
          } else if (styleSettings.classBreakStyleInfo[i].visible !== false) {
            filterArray.push(
              `${styleSettings.field} > ${this.formatFieldValue(
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
            `${styleSettings.field} > ${this.formatFieldValue(
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

  /** ***************************************************************************************************************************
   * Apply a view filter to the layer identified by the path stored in the layerPathAssociatedToTheGeoviewLayer property stored
   * in the layer instance associated to the map. The legend filters are derived from the uniqueValue or classBreaks style of the
   * layer. When the layer config is invalid, nothing is done.
   *
   * @param {string} filter An optional filter to be used in place of the getViewFilter value.
   * @param {never} notUsed1 This parameter must not be provided. It is there to allow overloading of the method signature.
   * @param {never} notUsed2 This parameter must not be provided. It is there to allow overloading of the method signature.
   */
  applyViewFilter(filter: string, notUsed1?: never, notUsed2?: never): void;

  /** ***************************************************************************************************************************
   * Apply a view filter to the layer identified by the path stored in the layerPathAssociatedToTheGeoviewLayer property stored
   * in the layer instance associated to the map. When the CombineLegendFilter flag is false, the filter paramater is used alone
   * to display the features. Otherwise, the legend filter and the filter parameter are combined together to define the view
   * filter. The legend filters are derived from the uniqueValue or classBreaks style of the layer. When the layer config is
   * invalid, nothing is done.
   *
   * @param {string} filter An optional filter to be used in place of the getViewFilter value.
   * @param {boolean} CombineLegendFilter Flag used to combine the legend filter and the filter together (default: true)
   * @param {never} notUsed This parameter must not be provided. It is there to allow overloading of the method signature.
   */
  applyViewFilter(filter: string, CombineLegendFilter: boolean, notUsed?: never): void;

  /** ***************************************************************************************************************************
   * Apply a view filter to the layer. When the CombineLegendFilter flag is false, the filter paramater is used alone to display
   * the features. Otherwise, the legend filter and the filter parameter are combined together to define the view filter. The
   * legend filters are derived from the uniqueValue or classBreaks style of the layer. When the layer config is invalid, nothing
   * is done.
   *
   * @param {string} layerPath The layer path to the layer's configuration.
   * @param {string} filter An optional filter to be used in place of the getViewFilter value.
   * @param {boolean} combineLegendFilter Flag used to combine the legend filter and the filter together (default: true)
   */
  applyViewFilter(layerPath: string, filter?: string, combineLegendFilter?: boolean): void;

  // See above headers for signification of the parameters. The first lines of the method select the template
  // used based on the parameter types received.

  applyViewFilter(parameter1: string, parameter2?: string | boolean | never, parameter3?: boolean | never) {
    // At the beginning, we assume that:
    // 1- the layer path was saved in this.layerPathAssociatedToTheGeoviewLayer using a call to
    //    api.maps[mapId].layer.geoviewLayer(layerPath);
    // 2- the filter is empty;
    // 3- the combine legend filters is true
    let layerPath = this.layerPathAssociatedToTheGeoviewLayer;
    let filter = '';
    let CombineLegendFilter = true;

    // Method signature detection
    if (typeof parameter3 === 'boolean') {
      // Signature detected is: applyViewFilter(layerPath: string, filter?: string, combineLegendFilter?: boolean): void;
      layerPath = parameter1;
      filter = parameter2 as string;
      CombineLegendFilter = parameter3;
    } else if (parameter2 !== undefined && parameter3 === undefined) {
      if (typeof parameter2 === 'boolean') {
        // Signature detected is: applyViewFilter(filter: string, CombineLegendFilter: boolean): void;
        filter = parameter1;
        CombineLegendFilter = parameter2;
      } else {
        // Signature detected is: applyViewFilter(layerPath: string, filter: string): void;
        layerPath = parameter1;
        filter = parameter2;
      }
    } else if (parameter2 === undefined && parameter3 === undefined) {
      // Signature detected is: applyViewFilter(filter: string): void;
      filter = parameter1;
    }

    const layerConfig = this.getLayerConfig(layerPath) as EsriDynamicLayerEntryConfig;
    if (!layerConfig) {
      // GV Things important to know about the applyViewFilter usage:
      logger.logError(
        `
        The applyViewFilter method must never be called by GeoView code before the layer refered by the layerPath has reached the 'loaded' status.\n
        It will never be called by the GeoView internal code except in the layerConfig.loadedFunction() that is called right after the 'loaded' signal.\n
        If you are a user, you can set the layer filter in the configuration or using code called in the cgpv.init() method of the viewer.\n
        It appeares that the layer refered by the layerPath "${layerPath} does not respect these rules.\n
      `.replace(/\s+/g, ' ')
      );
      return;
    }

    // Log
    logger.logTraceCore('ESRI-DYNAMIC - applyViewFilter', layerPath);

    let filterValueToUse = filter.replaceAll(/\s{2,}/g, ' ').trim();
    layerConfig.olLayer!.set('legendFilterIsOff', !CombineLegendFilter);
    layerConfig.olLayer?.set('layerFilter', filterValueToUse);
    if (CombineLegendFilter) filterValueToUse = this.getViewFilter(layerPath);

    // Convert date constants using the externalFragmentsOrder derived from the externalDateFormat
    const searchDateEntry = [
      ...filterValueToUse.matchAll(/(?<=^date\b\s')[\d/\-T\s:+Z]{4,25}(?=')|(?<=[(\s]date\b\s')[\d/\-T\s:+Z]{4,25}(?=')/gi),
    ];
    searchDateEntry.reverse();
    searchDateEntry.forEach((dateFound) => {
      // If the date has a time zone, keep it as is, otherwise reverse its time zone by changing its sign
      const reverseTimeZone = ![20, 25].includes(dateFound[0].length);
      let reformattedDate = api.dateUtilities.applyInputDateFormat(dateFound[0], this.externalFragmentsOrder, reverseTimeZone);
      // ESRI Dynamic layers doesn't accept the ISO date format. The time zone must be removed. The 'T' separator
      // normally placed between the date and the time must be replaced by a space.
      reformattedDate = reformattedDate.slice(0, reformattedDate.length === 20 ? -1 : -6); // drop time zone.
      reformattedDate = reformattedDate.replace('T', ' ');
      filterValueToUse = `${filterValueToUse!.slice(0, dateFound.index)}${reformattedDate}${filterValueToUse!.slice(
        dateFound.index! + dateFound[0].length
      )}`;
    });
    (layerConfig.olLayer as ImageLayer<ImageArcGISRest>)
      .getSource()!
      .updateParams({ layerDefs: `{"${layerConfig.layerId}": "${filterValueToUse}"}` });
    layerConfig.olLayer!.changed();
  }

  /** ***************************************************************************************************************************
   * Get the bounds of the layer represented in the layerConfig pointed to by the cached layerPath, returns updated bounds
   *
   * @param {Extent | undefined} bounds The current bounding box to be adjusted.
   * @param {never} notUsed This parameter must not be provided. It is there to allow overloading of the method signature.
   *
   * @returns {Extent} The new layer bounding box.
   */
  protected getBounds(bounds: Extent, notUsed?: never): Extent | undefined;

  /** ***************************************************************************************************************************
   * Get the bounds of the layer represented in the layerConfig pointed to by the layerPath, returns updated bounds
   *
   * @param {string} layerPath The Layer path to the layer's configuration.
   * @param {Extent | undefined} bounds The current bounding box to be adjusted.
   *
   * @returns {Extent} The new layer bounding box.
   */
  protected getBounds(layerPath: string, bounds?: Extent): Extent | undefined;

  // See above headers for signification of the parameters. The first lines of the method select the template
  // used based on the parameter types received.
  protected getBounds(parameter1?: string | Extent, parameter2?: Extent): Extent | undefined {
    const layerPath = typeof parameter1 === 'string' ? parameter1 : this.layerPathAssociatedToTheGeoviewLayer;
    let bounds = typeof parameter1 !== 'string' ? parameter1 : parameter2;
    const layerConfig = this.getLayerConfig(layerPath);
    const layerBounds = layerConfig?.initialSettings?.bounds || [];
    const projection = this.metadata?.fullExtent?.spatialReference?.wkid || MapEventProcessor.getMapState(this.mapId).currentProjection;

    if (this.metadata?.fullExtent) {
      layerBounds[0] = this.metadata?.fullExtent.xmin as number;
      layerBounds[1] = this.metadata?.fullExtent.ymin as number;
      layerBounds[2] = this.metadata?.fullExtent.xmax as number;
      layerBounds[3] = this.metadata?.fullExtent.ymax as number;
    }

    if (layerBounds) {
      let transformedBounds = layerBounds;
      if (this.metadata?.fullExtent?.spatialReference?.wkid !== MapEventProcessor.getMapState(this.mapId).currentProjection) {
        transformedBounds = api.projection.transformExtent(
          layerBounds,
          `EPSG:${projection}`,
          `EPSG:${MapEventProcessor.getMapState(this.mapId).currentProjection}`
        );
      }

      if (!bounds) bounds = [transformedBounds[0], transformedBounds[1], transformedBounds[2], transformedBounds[3]];
      else bounds = getMinOrMaxExtents(bounds, transformedBounds);
    }

    return bounds;
  }
}
