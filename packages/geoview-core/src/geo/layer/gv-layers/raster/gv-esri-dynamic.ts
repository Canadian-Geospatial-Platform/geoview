import { ImageArcGISRest } from 'ol/source';
import { Image as ImageLayer } from 'ol/layer';
import { Coordinate } from 'ol/coordinate';
import { Pixel } from 'ol/pixel';
import { EsriJSON } from 'ol/format';
import { Extent } from 'ol/extent';
import Feature from 'ol/Feature';
import Geometry from 'ol/geom/Geometry';

import { GeometryApi } from '@/geo/layer/geometry/geometry';
import { getLocalizedValue } from '@/core/utils/utilities';
import { getMinOrMaxExtents } from '@/geo/utils/utilities';
import { Projection } from '@/geo/utils/projection';
import { AppEventProcessor } from '@/api/event-processors/event-processor-children/app-event-processor';
import { logger } from '@/core/utils/logger';
import { DateMgt } from '@/core/utils/date-mgt';
import { EsriDynamicLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/esri-dynamic-layer-entry-config';
import {
  isUniqueValueStyleConfig,
  isClassBreakStyleConfig,
  TypeUniqueValueStyleConfig,
  TypeClassBreakStyleConfig,
  isSimpleStyleConfig,
  TypeFeatureInfoLayerConfig,
  TypeFeatureInfoEntry,
  rangeDomainType,
  codedValueType,
} from '@/geo/map/map-schema-types';
import { esriGetFieldType, esriGetFieldDomain } from '../utils';
import { AbstractGVRaster } from './abstract-gv-raster';

type TypeFieldOfTheSameValue = { value: string | number | Date; nbOccurence: number };
type TypeQueryTree = { fieldValue: string | number | Date; nextField: TypeQueryTree }[];

/**
 * Manages an Esri Dynamic layer.
 *
 * @exports
 * @class GVEsriDynamic
 */
export class GVEsriDynamic extends AbstractGVRaster {
  // The default hit tolerance the query should be using
  static override DEFAULT_HIT_TOLERANCE: number = 7;

  // Override the hit tolerance for a GVEsriDynamic layer
  override hitTolerance: number = GVEsriDynamic.DEFAULT_HIT_TOLERANCE;

  /**
   * Constructs a GVEsriDynamic layer to manage an OpenLayer layer.
   * @param {string} mapId - The map id
   * @param {ImageLayer<ImageArcGISRest>} olLayer - The OpenLayer layer.
   * @param {EsriDynamicLayerEntryConfig} layerConfig - The layer configuration.
   */
  public constructor(mapId: string, olLayer: ImageLayer<ImageArcGISRest>, layerConfig: EsriDynamicLayerEntryConfig) {
    super(mapId, olLayer, layerConfig);
  }

  /**
   * Overrides the get of the OpenLayers Layer
   * @returns {ImageLayer<ImageArcGISRest>} The OpenLayers Layer
   */
  override getOLLayer(): ImageLayer<ImageArcGISRest> {
    // Call parent and cast
    return super.getOLLayer() as ImageLayer<ImageArcGISRest>;
  }

  /**
   * Overrides the get of the OpenLayers Layer Source
   * @returns {ImageArcGISRest} The OpenLayers Layer Source
   */
  override getOLSource(): ImageArcGISRest | undefined {
    // Get source from OL
    return this.getOLLayer().getSource() || undefined;
  }

  /**
   * Overrides the get of the layer configuration associated with the layer.
   * @returns {EsriDynamicLayerEntryConfig} The layer configuration or undefined if not found.
   */
  override getLayerConfig(): EsriDynamicLayerEntryConfig {
    // Call parent and cast
    return super.getLayerConfig() as EsriDynamicLayerEntryConfig;
  }

  /**
   * Overrides the return of the field type from the metadata. If the type can not be found, return 'string'.
   * @param {string} fieldName - The field name for which we want to get the type.
   * @returns {'string' | 'date' | 'number'} The type of the field.
   */
  protected override getFieldType(fieldName: string): 'string' | 'date' | 'number' {
    // Redirect
    return esriGetFieldType(this.getLayerConfig(), fieldName);
  }

  /**
   * Overrides the return of the domain of the specified field.
   * @param {string} fieldName - The field name for which we want to get the domain.
   * @returns {null | codedValueType | rangeDomainType} The domain of the field.
   */
  protected override getFieldDomain(fieldName: string): null | codedValueType | rangeDomainType {
    // Redirect
    return esriGetFieldDomain(this.getLayerConfig(), fieldName);
  }

  /**
   * Overrides the get all feature information for all the features stored in the layer.
   * @returns {Promise<TypeFeatureInfoEntry[] | undefined | null>} A promise of an array of TypeFeatureInfoEntry[].
   */
  protected override async getAllFeatureInfo(): Promise<TypeFeatureInfoEntry[] | undefined | null> {
    try {
      // Get the layer config in a loaded phase
      const layerConfig = this.getLayerConfig();

      // Guess the geometry type
      const geometryType = layerConfig.getTypeGeometry();

      // Fetch the features
      let urlRoot = layerConfig.geoviewLayerConfig.metadataAccessPath![AppEventProcessor.getDisplayLanguage(this.getMapId())]!;
      if (!urlRoot.endsWith('/')) urlRoot += '/';
      // TODO: we put false so on heavy geometry, dynamic layer can load datatable. If not the featch fails.
      // TODO.CONT: fix the zoom to feature who is disable for esri because geometry is not fetched #2215
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

        // Format and return the result
        return this.formatFeatureInfoResult(features, layerConfig);
      }

      // Error
      throw new Error('Error querying service. No features were returned.');
    } catch (error) {
      // Log
      logger.logError('gv-esri-dynamic.getAllFeatureInfo()\n', error);
      return null;
    }
  }

  /**
   * Overrides the return of feature information at a given pixel location.
   * @param {Coordinate} location - The pixel coordinate that will be used by the query.
   * @returns {Promise<TypeFeatureInfoEntry[] | undefined | null>} A promise of an array of TypeFeatureInfoEntry[].
   */
  protected override getFeatureInfoAtPixel(location: Pixel): Promise<TypeFeatureInfoEntry[] | undefined | null> {
    // Redirect to getFeatureInfoAtCoordinate
    return this.getFeatureInfoAtCoordinate(this.getMapViewer().map.getCoordinateFromPixel(location));
  }

  /**
   * Overrides the return of feature information at a given coordinate.
   * @param {Coordinate} location - The coordinate that will be used by the query.
   * @returns {Promise<TypeFeatureInfoEntry[] | undefined | null>} A promise of an array of TypeFeatureInfoEntry[].
   */
  protected override getFeatureInfoAtCoordinate(location: Coordinate): Promise<TypeFeatureInfoEntry[] | undefined | null> {
    // Transform coordinate from map project to lntlat
    const projCoordinate = this.getMapViewer().convertCoordinateMapProjToLngLat(location);

    // Redirect to getFeatureInfoAtLongLat
    return this.getFeatureInfoAtLongLat(projCoordinate);
  }

  /**
   * Overrides the return of feature information at the provided long lat coordinate.
   * @param {Coordinate} lnglat - The coordinate that will be used by the query.
   * @returns {Promise<TypeFeatureInfoEntry[] | undefined | null>} A promise of an array of TypeFeatureInfoEntry[].
   */
  protected override async getFeatureInfoAtLongLat(lnglat: Coordinate): Promise<TypeFeatureInfoEntry[] | undefined | null> {
    try {
      // If invisible
      if (!this.getVisible()) return [];

      // Get the layer config in a loaded phase
      const layerConfig = this.getLayerConfig();

      // If not queryable
      if (!layerConfig.source?.featureInfo?.queryable) return [];

      let identifyUrl = getLocalizedValue(layerConfig.source?.dataAccessPath, AppEventProcessor.getDisplayLanguage(this.getMapId()));
      if (!identifyUrl) return [];

      identifyUrl = identifyUrl.endsWith('/') ? identifyUrl : `${identifyUrl}/`;

      const mapViewer = this.getMapViewer();
      const bounds = mapViewer.convertExtentMapProjToLngLat(mapViewer.getView().calculateExtent());

      const extent = { xmin: bounds[0], ymin: bounds[1], xmax: bounds[2], ymax: bounds[3] };

      const layerDefs = this.getOLSource()?.getParams()?.layerDefs || '';
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
      logger.logError('gv-esri-dynamic.getFeatureInfoAtLongLat()\n', error);
      return null;
    }
  }

  /**
   * Counts the number of times the value of a field is used by the unique value style information object. Depending on the
   * visibility of the default, we count visible or invisible settings.
   * @param {TypeUniqueValueStyleConfig} styleSettings - The unique value style settings to evaluate.
   * @returns {TypeFieldOfTheSameValue[][]} The result of the evaluation. The first index of the array correspond to the field's
   * index in the style settings and the second one to the number of different values the field may have based on visibility of
   * the feature.
   * @private
   */
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

  /**
   * Gets the layer view filter. The filter is derived from the uniqueValue or the classBreak visibility flags and a layerFilter
   * associated to the layer.
   * @returns {string} The filter associated to the layerPath
   */
  getViewFilter(): string {
    const layerConfig = this.getLayerConfig();
    const { layerFilter } = layerConfig;

    if (layerConfig?.style) {
      const setAllUndefinedVisibilityFlagsToYes = (styleConfig: TypeUniqueValueStyleConfig | TypeClassBreakStyleConfig): void => {
        // default value is true for all undefined visibility flags
        // eslint-disable-next-line no-param-reassign
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

      const styleSettings = layerConfig.getStyleSettings()!;

      if (isSimpleStyleConfig(styleSettings)) {
        return layerFilter || '(1=1)';
      }
      if (isUniqueValueStyleConfig(styleSettings)) {
        setAllUndefinedVisibilityFlagsToYes(styleSettings);
        if (featuresAreAllVisible(styleSettings.defaultVisible!, styleSettings.uniqueValueStyleInfo as { visible: boolean }[]))
          return `(1=1)${layerFilter ? ` and (${layerFilter})` : ''}`;

        // This section of code optimize the query to reduce it at it shortest expression.
        const fieldOfTheSameValue = GVEsriDynamic.#countFieldOfTheSameValue(styleSettings);
        const fieldOrder = GVEsriDynamic.#sortFieldOfTheSameValue(styleSettings, fieldOfTheSameValue);
        const queryTree = GVEsriDynamic.#getQueryTree(styleSettings, fieldOfTheSameValue, fieldOrder);
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
   * Sorts the number of times the value of a field is used by the unique value style information object. Depending on the
   * visibility of the default value, we count the visible or invisible parameters. The order goes from the highest number of
   * occurrences to the lowest number of occurrences.
   * @param {TypeUniqueValueStyleConfig} styleSettings - The unique value style settings to evaluate.
   * @param {TypeFieldOfTheSameValue[][]} fieldOfTheSameValue - The count information that contains the number of occurrences
   * of a value.
   * @returns {number[]} An array that gives the field order to use to build the query tree.
   * @private
   */
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

  /**
   * Gets the query tree. The tree structure is a representation of the optimized query we have to create. It contains the field
   * values in the order specified by the fieldOrder parameter. The optimization is based on the distributivity and associativity
   * of the Boolean algebra. The form is the following:
   *
   * (f1 = v11 and (f2 = v21 and f3 in (v31, v32) or f2 = v22 and f3 in (v31, v32, v33)) or f1 = v12 and (f2 = v21 and ...)))
   *
   * which is equivalent to:
   * f1 = v11 and f2 = v21 and f3 = v31 or f1 = v11 and f2 = v21 and f3 = v32 or f1 = v11 and f2 = v22 and f3 = v31 ...
   *
   * @param {TypeUniqueValueStyleConfig} styleSettings - The unique value style settings to evaluate.
   * @param {TypeFieldOfTheSameValue[][]} fieldOfTheSameValue - The count information that contains the number of occurrences
   * of a value.
   * @param {number[]} fieldOrder - The field order to use when building the tree.
   * @returns {TypeQueryTree} The query tree to use when building the final query string.
   * @private
   */
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

  /**
   * Builds the query using the provided query tree.
   * @param {TypeQueryTree} queryTree - The query tree to use.
   * @param {number} level - The level to use for solving the tree.
   * @param {number[]} fieldOrder - The field order to use for solving the tree.
   * @param {TypeUniqueValueStyleConfig} styleSettings - The unique value style settings to evaluate.
   * @param {TypeFeatureInfoLayerConfig} sourceFeatureInfo - The source feature information that knows the field type.
   * @returns {string} The resulting query.
   * @private
   */
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

  /**
   * Formats the field value to use in the query.
   * @param {string} fieldName - The field name.
   * @param {string | number | Date} rawValue - The unformatted field value.
   * @param {TypeFeatureInfoLayerConfig} sourceFeatureInfo - The source feature information that knows the field type.
   * @returns {string} The resulting field value.
   * @private
   */
  #formatFieldValue(fieldName: string, rawValue: string | number | Date, sourceFeatureInfo: TypeFeatureInfoLayerConfig): string {
    const fieldIndex = getLocalizedValue(sourceFeatureInfo.outfields, AppEventProcessor.getDisplayLanguage(this.getMapId()))
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

  /**
   * Overrides when the layer gets in loaded status.
   */
  override onLoaded(): void {
    // Call parent
    super.onLoaded();

    // Apply view filter immediately (no need to provide a layer path here so '' is sent (hybrid work))
    this.applyViewFilter('', this.getLayerConfig().layerFilter || '');
  }

  /**
   * Applies a view filter to the layer. When the combineLegendFilter flag is false, the filter paramater is used alone to display
   * the features. Otherwise, the legend filter and the filter parameter are combined together to define the view filter. The
   * legend filters are derived from the uniqueValue or classBreaks style of the layer. When the layer config is invalid, nothing
   * is done.
   * @param {string} filter - An optional filter to be used in place of the getViewFilter value.
   * @param {boolean} combineLegendFilter - Flag used to combine the legend filter and the filter together (default: true)
   */
  applyViewFilter(layerPath: string, filter: string, combineLegendFilter = true): void {
    // TODO: Refactor - Layers refactoring. Remove the layerPath parameter once hybrid work is done
    // Log
    logger.logTraceCore('GV-ESRI-DYNAMIC - applyViewFilter');

    const layerConfig = this.getLayerConfig();
    const olLayer = this.getOLLayer() as ImageLayer<ImageArcGISRest>;

    let filterValueToUse = filter.replaceAll(/\s{2,}/g, ' ').trim();
    layerConfig.legendFilterIsOff = !combineLegendFilter;
    layerConfig.layerFilter = filterValueToUse;
    if (combineLegendFilter) filterValueToUse = this.getViewFilter();

    // Convert date constants using the externalFragmentsOrder derived from the externalDateFormat
    const searchDateEntry = [
      ...filterValueToUse.matchAll(/(?<=^date\b\s')[\d/\-T\s:+Z]{4,25}(?=')|(?<=[(\s]date\b\s')[\d/\-T\s:+Z]{4,25}(?=')/gi),
    ];
    searchDateEntry.reverse();
    searchDateEntry.forEach((dateFound) => {
      // If the date has a time zone, keep it as is, otherwise reverse its time zone by changing its sign
      const reverseTimeZone = ![20, 25].includes(dateFound[0].length);
      let reformattedDate = DateMgt.applyInputDateFormat(dateFound[0], this.getExternalFragmentsOrder(), reverseTimeZone);
      // ESRI Dynamic layers doesn't accept the ISO date format. The time zone must be removed. The 'T' separator
      // normally placed between the date and the time must be replaced by a space.
      reformattedDate = reformattedDate.slice(0, reformattedDate.length === 20 ? -1 : -6); // drop time zone.
      reformattedDate = reformattedDate.replace('T', ' ');
      filterValueToUse = `${filterValueToUse!.slice(0, dateFound.index)}${reformattedDate}${filterValueToUse!.slice(
        dateFound.index! + dateFound[0].length
      )}`;
    });

    // TODO: Bug - The layerDefs filter being generated here fails when the filterValueToUse is for example for the historical_flood:
    // TO.DOCONT: flood_cause in ('freshet', 'heavy rain', 'coastal storm', 'beaver dam failure', 'frazil', 'dam failure', 'municipal water main break', 'unknown') and (time_slider_date >= date '1696-01-01T05:00:00.000Z' and time_slider_date <= date '2023-01-01T05:00:00.000Z')
    olLayer.getSource()!.updateParams({ layerDefs: `{"${layerConfig.layerId}": "${filterValueToUse}"}` });
    olLayer.changed();

    // Emit event
    this.emitLayerFilterApplied({
      layerPath,
      filter: filterValueToUse,
    });
  }

  /**
   * Gets the bounds of the layer and returns updated bounds
   * @param {Extent | undefined} bounds - The current bounding box to be adjusted.
   * @returns {Extent | undefined} The new layer bounding box.
   */
  protected getBounds(layerPath: string, bounds?: Extent): Extent | undefined {
    // TODO: Refactor - Layers refactoring. Remove the layerPath parameter once hybrid work is done
    const layerConfig = this.getLayerConfig();
    const layerBounds = layerConfig?.initialSettings?.bounds || [];
    const projection =
      layerConfig.getMetadata()?.fullExtent?.spatialReference?.wkid || this.getMapViewer().getProjection().getCode().replace('EPSG:', '');

    if (layerConfig.getMetadata()?.fullExtent) {
      layerBounds[0] = layerConfig.getMetadata()?.fullExtent.xmin as number;
      layerBounds[1] = layerConfig.getMetadata()?.fullExtent.ymin as number;
      layerBounds[2] = layerConfig.getMetadata()?.fullExtent.xmax as number;
      layerBounds[3] = layerConfig.getMetadata()?.fullExtent.ymax as number;
    }

    if (layerBounds) {
      let transformedBounds = layerBounds;
      if (
        layerConfig.getMetadata()?.fullExtent?.spatialReference?.wkid !== this.getMapViewer().getProjection().getCode().replace('EPSG:', '')
      ) {
        transformedBounds = this.getMapViewer().convertExtentFromProjToMapProj(layerBounds, `EPSG:${projection}`);
      }

      // eslint-disable-next-line no-param-reassign
      if (!bounds) bounds = [transformedBounds[0], transformedBounds[1], transformedBounds[2], transformedBounds[3]];
      // eslint-disable-next-line no-param-reassign
      else bounds = getMinOrMaxExtents(bounds, transformedBounds);
    }

    return bounds;
  }
}
