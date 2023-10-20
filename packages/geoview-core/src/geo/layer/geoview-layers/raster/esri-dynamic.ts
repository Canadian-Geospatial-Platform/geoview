/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-param-reassign */
import { ImageArcGISRest } from 'ol/source';
import { Options as SourceOptions } from 'ol/source/ImageArcGISRest';
import { Options as ImageOptions } from 'ol/layer/BaseImage';
import { Image as ImageLayer } from 'ol/layer';
import { Coordinate } from 'ol/coordinate';
import { Pixel } from 'ol/pixel';
import { transform, transformExtent } from 'ol/proj';
import { EsriJSON } from 'ol/format';
import { Extent } from 'ol/extent';

import cloneDeep from 'lodash/cloneDeep';
import { getLocalizedValue, getMinOrMaxExtents } from '@/core/utils/utilities';
import { AbstractGeoViewLayer, CONST_LAYER_TYPES, TypeLayerStyles } from '../abstract-geoview-layers';
import { AbstractGeoViewRaster, TypeBaseRasterLayer } from './abstract-geoview-raster';
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
  TypeEsriDynamicLayerEntryConfig,
  TypeUniqueValueStyleInfo,
  TypeFeatureInfoLayerConfig,
  layerEntryIsGroupLayer,
} from '@/geo/map/map-schema-types';
import { LayerSetPayload, TypeArrayOfFeatureInfoEntries, codedValueType, rangeDomainType } from '@/api/events/payloads';
import { api } from '@/app';
import { Layer } from '../../layer';
import { EVENT_NAMES } from '@/api/events/event-types';
import {
  commonGetFieldDomain,
  commonGetFieldType,
  commonGetServiceMetadata,
  commonProcessFeatureInfoConfig,
  commonProcessInitialSettings,
  commonProcessLayerMetadata,
  commonProcessTemporalDimension,
  commonValidateListOfLayerEntryConfig,
} from '../esri-layer-common';
import { TypeJsonArray, TypeJsonObject } from '@/core/types/global-types';
import { TypeEsriFeatureLayerEntryConfig } from '../vector/esri-feature';

export interface TypeEsriDynamicLayerConfig extends Omit<TypeGeoviewLayerConfig, 'listOfLayerEntryConfig'> {
  geoviewLayerType: 'esriDynamic';
  listOfLayerEntryConfig: TypeEsriDynamicLayerEntryConfig[];
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
 * type guard function that redefines a TypeLayerEntryConfig as a TypeEsriDynamicLayerEntryConfig if the geoviewLayerType attribute
 * of the verifyIfGeoViewEntry.geoviewRootLayer attribute is ESRI_DYNAMIC. The type ascention applies only to the true block of
 * the if clause that use this function.
 *
 * @param {TypeLayerEntryConfig} verifyIfGeoViewEntry Polymorphic object to test in order to determine if the type ascention is
 * valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const geoviewEntryIsEsriDynamic = (
  verifyIfGeoViewEntry: TypeLayerEntryConfig
): verifyIfGeoViewEntry is TypeEsriDynamicLayerEntryConfig => {
  return verifyIfGeoViewEntry?.geoviewRootLayer?.geoviewLayerType === CONST_LAYER_TYPES.ESRI_DYNAMIC;
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
  getServiceMetadata(): Promise<void> {
    const promisedExecution = new Promise<void>((resolve) => {
      commonGetServiceMetadata.call(this, resolve);
    });
    return promisedExecution;
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
  esriChildHasDetectedAnError(layerEntryConfig: TypeLayerEntryConfig, esriIndex: number): boolean {
    if (!this.metadata!.supportsDynamicLayers) {
      this.layerLoadError.push({
        layer: Layer.getLayerPath(layerEntryConfig),
        consoleMessage: `Layer ${Layer.getLayerPath(layerEntryConfig)} of map ${this.mapId} does not support dynamic layers.`,
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
  getFieldType(fieldName: string, layerConfig: TypeLayerEntryConfig): 'string' | 'date' | 'number' {
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
  getFieldDomain(fieldName: string, layerConfig: TypeLayerEntryConfig): null | codedValueType | rangeDomainType {
    return commonGetFieldDomain.call(this, fieldName, layerConfig);
  }

  /** ***************************************************************************************************************************
   * This method will create a Geoview temporal dimension if it exist in the service metadata
   * @param {TypeJsonObject} esriTimeDimension The ESRI time dimension object
   * @param {TypeEsriFeatureLayerEntryConfig | TypeEsriDynamicLayerEntryConfig} layerEntryConfig The layer entry to configure
   */
  processTemporalDimension(
    esriTimeDimension: TypeJsonObject,
    layerEntryConfig: TypeEsriFeatureLayerEntryConfig | TypeEsriDynamicLayerEntryConfig
  ) {
    return commonProcessTemporalDimension.call(this, esriTimeDimension, layerEntryConfig);
  }

  /** ***************************************************************************************************************************
   * This method verifies if the layer is queryable and sets the outfields and aliasFields of the source feature info.
   *
   * @param {string} capabilities The capabilities that will say if the layer is queryable.
   * @param {string} nameField The display field associated to the layer.
   * @param {string} geometryFieldName The field name of the geometry property.
   * @param {TypeJsonArray} fields An array of field names and its aliases.
   * @param {TypeEsriFeatureLayerEntryConfig | TypeEsriDynamicLayerEntryConfig} layerEntryConfig The layer entry to configure.
   */
  processFeatureInfoConfig = (
    capabilities: string,
    nameField: string,
    geometryFieldName: string,
    fields: TypeJsonArray,
    layerEntryConfig: TypeEsriFeatureLayerEntryConfig | TypeEsriDynamicLayerEntryConfig
  ) => {
    return commonProcessFeatureInfoConfig.call(this, capabilities, nameField, geometryFieldName, fields, layerEntryConfig);
  };

  /** ***************************************************************************************************************************
   * This method set the initial settings based on the service metadata. Priority is given to the layer configuration.
   *
   * @param {string} mapId The map identifier.
   * @param {boolean} visibility The metadata initial visibility of the layer.
   * @param {number} minScale The metadata minScale of the layer.
   * @param {number} maxScale The metadata maxScale of the layer.
   * @param {TypeJsonObject} extent The metadata layer extent.
   * @param {TypeEsriFeatureLayerEntryConfig | TypeEsriDynamicLayerEntryConfig} layerEntryConfig The layer entry to configure.
   */
  processInitialSettings(
    visibility: boolean,
    minScale: number,
    maxScale: number,
    extent: TypeJsonObject,
    layerEntryConfig: TypeEsriFeatureLayerEntryConfig | TypeEsriDynamicLayerEntryConfig
  ) {
    return commonProcessInitialSettings.call(this, visibility, minScale, maxScale, extent, layerEntryConfig);
  }

  /** ***************************************************************************************************************************
   * This method is used to process the layer's metadata. It will fill the empty fields of the layer's configuration (renderer,
   * initial settings, fields and aliases).
   *
   * @param {TypeLayerEntryConfig} layerEntryConfig The layer entry configuration to process.
   *
   * @returns {Promise<void>} A promise that the layer configuration has its metadata processed.
   */
  protected processLayerMetadata(layerEntryConfig: TypeLayerEntryConfig): Promise<void> {
    const promiseOfExecution = new Promise<void>((resolve) => {
      commonProcessLayerMetadata.call(this, resolve, layerEntryConfig);
    });
    return promiseOfExecution;
  }

  /** ****************************************************************************************************************************
   * This method creates a GeoView EsriDynamic layer using the definition provided in the layerEntryConfig parameter.
   *
   * @param {TypeEsriDynamicLayerEntryConfig} layerEntryConfig Information needed to create the GeoView layer.
   *
   * @returns {TypeBaseRasterLayer} The GeoView raster layer that has been created.
   */
  processOneLayerEntry(layerEntryConfig: TypeEsriDynamicLayerEntryConfig): Promise<TypeBaseRasterLayer | null> {
    const promisedVectorLayer = new Promise<TypeBaseRasterLayer | null>((resolve) => {
      this.changeLayerPhase('processOneLayerEntry', layerEntryConfig);
      const sourceOptions: SourceOptions = {};
      sourceOptions.attributions = [(this.metadata!.copyrightText ? this.metadata!.copyrightText : '') as string];
      sourceOptions.url = getLocalizedValue(layerEntryConfig.source.dataAccessPath!, this.mapId);
      sourceOptions.params = { LAYERS: `show:${layerEntryConfig.layerId}` };
      if (layerEntryConfig.source.transparent)
        Object.defineProperty(sourceOptions.params, 'transparent', layerEntryConfig.source.transparent!);
      if (layerEntryConfig.source.format) Object.defineProperty(sourceOptions.params, 'format', layerEntryConfig.source.format!);
      if (layerEntryConfig.source.crossOrigin) {
        sourceOptions.crossOrigin = layerEntryConfig.source.crossOrigin;
      } else {
        sourceOptions.crossOrigin = 'Anonymous';
      }
      if (layerEntryConfig.source.projection) sourceOptions.projection = `EPSG:${layerEntryConfig.source.projection}`;

      const imageLayerOptions: ImageOptions<ImageArcGISRest> = {
        source: new ImageArcGISRest(sourceOptions),
        properties: { layerEntryConfig },
      };
      // layerEntryConfig.initialSettings cannot be undefined because config-validation set it to {} if it is undefined.
      if (layerEntryConfig.initialSettings?.className !== undefined)
        imageLayerOptions.className = layerEntryConfig.initialSettings?.className;
      if (layerEntryConfig.initialSettings?.extent !== undefined) imageLayerOptions.extent = layerEntryConfig.initialSettings?.extent;
      if (layerEntryConfig.initialSettings?.maxZoom !== undefined) imageLayerOptions.maxZoom = layerEntryConfig.initialSettings?.maxZoom;
      if (layerEntryConfig.initialSettings?.minZoom !== undefined) imageLayerOptions.minZoom = layerEntryConfig.initialSettings?.minZoom;
      if (layerEntryConfig.initialSettings?.opacity !== undefined) imageLayerOptions.opacity = layerEntryConfig.initialSettings?.opacity;
      // If all layers on the map have an initialSettings.visible set to false, a loading error occurs because nothing is drawn on the
      // map and the 'change' or 'prerender' events are never sent to the addToMap method of the layer.ts file. The workaround is to
      // postpone the setVisible action until all layers have been loaded on the map.
      api.event.once(
        EVENT_NAMES.LAYER.EVENT_IF_CONDITION,
        (payload) => {
          this.setVisible(
            layerEntryConfig.initialSettings!.visible! === 'yes' || layerEntryConfig.initialSettings!.visible! === 'always',
            layerEntryConfig
          );
        },
        `${this.mapId}/visibilityTest`
      );

      layerEntryConfig.olLayer = new ImageLayer(imageLayerOptions);
      this.applyViewFilter(layerEntryConfig, layerEntryConfig.layerFilter ? layerEntryConfig.layerFilter : '');

      super.addLoadendListener(layerEntryConfig, 'image');

      resolve(layerEntryConfig.olLayer);
    });

    return promisedVectorLayer;
  }

  /** ***************************************************************************************************************************
   * Return feature information for all the features around the provided Pixel.
   *
   * @param {Coordinate} location The pixel coordinate that will be used by the query.
   * @param {TypeEsriDynamicLayerEntryConfig} layerConfig The layer configuration.
   *
   * @returns {Promise<TypeArrayOfFeatureInfoEntries>} The feature info table.
   */
  protected getFeatureInfoAtPixel(location: Pixel, layerConfig: TypeEsriDynamicLayerEntryConfig): Promise<TypeArrayOfFeatureInfoEntries> {
    const { map } = api.maps[this.mapId];
    return this.getFeatureInfoAtCoordinate(map.getCoordinateFromPixel(location), layerConfig);
  }

  /** ***************************************************************************************************************************
   * Return feature information for all the features around the provided projection coordinate.
   *
   * @param {Coordinate} location The coordinate that will be used by the query.
   * @param {TypeEsriDynamicLayerEntryConfig} layerConfig The layer configuration.
   *
   * @returns {Promise<TypeArrayOfFeatureInfoEntries>} The promised feature info table.
   */
  protected getFeatureInfoAtCoordinate(
    location: Coordinate,
    layerConfig: TypeEsriDynamicLayerEntryConfig
  ): Promise<TypeArrayOfFeatureInfoEntries> {
    const convertedLocation = transform(location, `EPSG:${api.maps[this.mapId].currentProjection}`, 'EPSG:4326');
    return this.getFeatureInfoAtLongLat(convertedLocation, layerConfig);
  }

  /** ***************************************************************************************************************************
   * Return feature information for all the features around the provided coordinate.
   *
   * @param {Coordinate} lnglat The coordinate that will be used by the query.
   * @param {TypeEsriDynamicLayerEntryConfig} layerConfig The layer configuration.
   *
   * @returns {Promise<TypeArrayOfFeatureInfoEntries>} The promised feature info table.
   */
  protected getFeatureInfoAtLongLat(
    lnglat: Coordinate,
    layerConfig: TypeEsriDynamicLayerEntryConfig
  ): Promise<TypeArrayOfFeatureInfoEntries> {
    const promisedQueryResult = new Promise<TypeArrayOfFeatureInfoEntries>((resolve) => {
      if (!this.getVisible(layerConfig) || !layerConfig.olLayer) resolve([]);
      else {
        if (!(layerConfig as TypeEsriDynamicLayerEntryConfig).source.featureInfo?.queryable) resolve([]);
        let identifyUrl = getLocalizedValue(layerConfig.source?.dataAccessPath, this.mapId);
        if (!identifyUrl) resolve([]);
        else {
          identifyUrl = identifyUrl.endsWith('/') ? identifyUrl : `${identifyUrl}/`;
          const mapLayer = api.maps[this.mapId].map;
          const { currentProjection } = api.maps[this.mapId];
          const size = mapLayer.getSize()!;
          let bounds = mapLayer.getView().calculateExtent();
          bounds = transformExtent(bounds, `EPSG:${currentProjection}`, 'EPSG:4326');

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

          fetch(identifyUrl).then((response) => {
            response.json().then((jsonResponse) => {
              const features = new EsriJSON().readFeatures(
                { features: jsonResponse.results },
                { dataProjection: 'EPSG:4326', featureProjection: `EPSG:${currentProjection}` }
              );
              this.formatFeatureInfoResult(features, layerConfig).then((arrayOfFeatureInfoEntries) => {
                resolve(arrayOfFeatureInfoEntries);
              });
            });
          });
        }
      }
    });
    return promisedQueryResult;
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
          (styleEntry.visible === 'no' && styleSettings.defaultVisible !== 'no') ||
          (styleEntry.visible !== 'no' && styleSettings.defaultVisible === 'no')
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
    const query = '';
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
        (styleEntry.visible === 'no' && styleSettings.defaultVisible !== 'no') ||
        (styleEntry.visible !== 'no' && styleSettings.defaultVisible === 'no')
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
    let queryString = styleSettings.defaultVisible !== 'no' && !level ? 'not (' : '(';
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
   * Get the layer view filter. The filter is derived fron the uniqueValue or the classBreak visibility flags and a layerFilter
   * associated to the layer.
   *
   * @param {string | TypeLayerEntryConfig} layerPathOrConfig Layer path or configuration.
   *
   * @returns {string} the filter associated to the layerPath
   */
  getViewFilter(layerPathOrConfig: string | TypeLayerEntryConfig): string {
    const layerEntryConfig = (
      typeof layerPathOrConfig === 'string' ? this.getLayerConfig(layerPathOrConfig) : layerPathOrConfig
    ) as TypeEsriDynamicLayerEntryConfig;
    const layerFilter = layerEntryConfig.olLayer?.get('layerFilter');

    if (layerEntryConfig?.style) {
      const setAllUndefinedVisibilityFlagsToYes = (styleConfig: TypeUniqueValueStyleConfig | TypeClassBreakStyleConfig) => {
        // default value is true for all undefined visibility flags
        if (styleConfig.defaultVisible === undefined) styleConfig.defaultVisible = 'yes';
        const settings = isUniqueValueStyleConfig(styleConfig) ? styleConfig.uniqueValueStyleInfo : styleConfig.classBreakStyleInfo;
        for (let i = 0; i < settings.length; i++) if (settings[i].visible === undefined) settings[i].visible = 'yes';
      };

      const featuresAreAllVisible = (
        defaultVisibility: 'yes' | 'no' | 'always',
        settings: { visible: 'yes' | 'no' | 'always' }[]
      ): boolean => {
        let allVisible = defaultVisibility !== 'no';
        for (let i = 0; i < settings.length; i++) {
          allVisible &&= settings[i].visible !== 'no';
        }
        return allVisible;
      };

      const styleSettings = layerEntryConfig.style[Object.keys(layerEntryConfig.style)[0] as TypeStyleGeometry]!;

      if (isSimpleStyleConfig(styleSettings)) {
        return layerFilter || '(1=1)';
      }
      if (isUniqueValueStyleConfig(styleSettings)) {
        setAllUndefinedVisibilityFlagsToYes(styleSettings);
        if (
          featuresAreAllVisible(styleSettings.defaultVisible!, styleSettings.uniqueValueStyleInfo as { visible: 'yes' | 'no' | 'always' }[])
        )
          return `(1=1)${layerFilter ? ` and (${layerFilter})` : ''}`;

        // This section of code optimize the query to reduce it at it shortest expression.
        const fieldOfTheSameValue = this.countFieldOfTheSameValue(styleSettings);
        const fieldOrder = this.sortFieldOfTheSameValue(styleSettings, fieldOfTheSameValue);
        const queryTree = this.getQueryTree(styleSettings, fieldOfTheSameValue, fieldOrder);
        const query = this.buildQuery(queryTree, 0, fieldOrder, styleSettings, layerEntryConfig.source.featureInfo!);
        return `${query}${layerFilter ? ` and (${layerFilter})` : ''}`;
      }

      if (isClassBreakStyleConfig(styleSettings)) {
        setAllUndefinedVisibilityFlagsToYes(styleSettings);
        if (
          featuresAreAllVisible(styleSettings.defaultVisible!, styleSettings.classBreakStyleInfo as { visible: 'yes' | 'no' | 'always' }[])
        )
          return `(1=1)${layerFilter ? ` and (${layerFilter})` : ''}`;

        const filterArray: string[] = [];
        let visibleWhenGreatherThisIndex = -1;
        for (let i = 0; i < styleSettings.classBreakStyleInfo.length; i++) {
          if (filterArray.length % 2 === 0) {
            if (i === 0) {
              if (styleSettings.classBreakStyleInfo[0].visible !== 'no' && styleSettings.defaultVisible === 'no')
                filterArray.push(
                  `${styleSettings.field} >= ${this.formatFieldValue(
                    styleSettings.field,
                    styleSettings.classBreakStyleInfo[0].minValue!,
                    layerEntryConfig.source.featureInfo!
                  )}`
                );
              else if (styleSettings.classBreakStyleInfo[0].visible === 'no' && styleSettings.defaultVisible !== 'no') {
                filterArray.push(
                  `${styleSettings.field} < ${this.formatFieldValue(
                    styleSettings.field,
                    styleSettings.classBreakStyleInfo[0].minValue!,
                    layerEntryConfig.source.featureInfo!
                  )}`
                );
                visibleWhenGreatherThisIndex = i;
              }
            } else if (styleSettings.classBreakStyleInfo[i].visible !== 'no' && styleSettings.defaultVisible === 'no') {
              filterArray.push(
                `${styleSettings.field} > ${this.formatFieldValue(
                  styleSettings.field,
                  styleSettings.classBreakStyleInfo[i].minValue!,
                  layerEntryConfig.source.featureInfo!
                )}`
              );
              if (i + 1 === styleSettings.classBreakStyleInfo.length)
                filterArray.push(
                  `${styleSettings.field} <= ${this.formatFieldValue(
                    styleSettings.field,
                    styleSettings.classBreakStyleInfo[i].maxValue!,
                    layerEntryConfig.source.featureInfo!
                  )}`
                );
            } else if (styleSettings.classBreakStyleInfo[i].visible === 'no' && styleSettings.defaultVisible !== 'no') {
              filterArray.push(
                `${styleSettings.field} <= ${this.formatFieldValue(
                  styleSettings.field,
                  styleSettings.classBreakStyleInfo[i].minValue!,
                  layerEntryConfig.source.featureInfo!
                )}`
              );
              visibleWhenGreatherThisIndex = i;
            }
          } else if (styleSettings.defaultVisible === 'no') {
            if (styleSettings.classBreakStyleInfo[i].visible === 'no') {
              filterArray.push(
                `${styleSettings.field} <= ${this.formatFieldValue(
                  styleSettings.field,
                  styleSettings.classBreakStyleInfo[i - 1].maxValue!,
                  layerEntryConfig.source.featureInfo!
                )}`
              );
            } else if (i + 1 === styleSettings.classBreakStyleInfo.length) {
              filterArray.push(
                `${styleSettings.field} <= ${this.formatFieldValue(
                  styleSettings.field,
                  styleSettings.classBreakStyleInfo[i].maxValue!,
                  layerEntryConfig.source.featureInfo!
                )}`
              );
            }
          } else if (styleSettings.classBreakStyleInfo[i].visible !== 'no') {
            filterArray.push(
              `${styleSettings.field} > ${this.formatFieldValue(
                styleSettings.field,
                styleSettings.classBreakStyleInfo[i - 1].maxValue!,
                layerEntryConfig.source.featureInfo!
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
              layerEntryConfig.source.featureInfo!
            )}`
          );

        if (styleSettings.defaultVisible !== 'no') {
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
   * Apply a view filter to the layer. When the CombineLegendFilter flag is false, the filter paramater is used alone to display
   * the features. Otherwise, the legend filter and the filter parameter are combined together to define the view filter. The
   * legend filters are derived from the uniqueValue or classBreaks style of the layer. When the layer config is invalid, nothing
   * is done.
   *
   * @param {string | TypeLayerEntryConfig} layerPathOrConfig Layer path or configuration.
   * @param {string} filter An optional filter to be used in place of the getViewFilter value.
   * @param {boolean} CombineLegendFilter Flag used to combine the legend filter and the filter together (default: true)
   */
  applyViewFilter(layerPathOrConfig: string | TypeLayerEntryConfig, filter = '', CombineLegendFilter = true) {
    const layerEntryConfig = (
      typeof layerPathOrConfig === 'string' ? this.getLayerConfig(layerPathOrConfig) : layerPathOrConfig
    ) as TypeEsriDynamicLayerEntryConfig;
    const source = (layerEntryConfig.olLayer as ImageLayer<ImageArcGISRest>).getSource();
    if (source) {
      let filterValueToUse = filter.replaceAll(/\s{2,}/g, ' ').trim();
      layerEntryConfig.olLayer!.set('legendFilterIsOff', !CombineLegendFilter);
      if (CombineLegendFilter) {
        layerEntryConfig.olLayer?.set('layerFilter', filterValueToUse);
        filterValueToUse = this.getViewFilter(layerEntryConfig);
      }

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
      source.updateParams({ layerDefs: `{"${layerEntryConfig.layerId}": "${filterValueToUse}"}` });
      layerEntryConfig.olLayer!.changed();
    }
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
    const layerBounds = layerConfig!.initialSettings?.bounds || [];
    const projection = this.metadata?.fullExtent?.spatialReference?.wkid || api.maps[this.mapId].currentProjection;

    if (this.metadata?.fullExtent) {
      layerBounds[0] = this.metadata?.fullExtent.xmin as number;
      layerBounds[1] = this.metadata?.fullExtent.ymin as number;
      layerBounds[2] = this.metadata?.fullExtent.xmax as number;
      layerBounds[3] = this.metadata?.fullExtent.ymax as number;
    }

    if (layerBounds) {
      const transformedBounds = transformExtent(layerBounds, `EPSG:${projection}`, `EPSG:4326`);
      if (!bounds) bounds = [transformedBounds[0], transformedBounds[1], transformedBounds[2], transformedBounds[3]];
      else bounds = getMinOrMaxExtents(bounds, transformedBounds);
    }

    return bounds;
  }
}
