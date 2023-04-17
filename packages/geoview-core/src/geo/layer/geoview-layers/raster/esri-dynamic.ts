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
import Feature from 'ol/Feature';
import Geometry from 'ol/geom/Geometry';

import { getLocalizedValue } from '../../../../core/utils/utilities';
import { AbstractGeoViewLayer, CONST_LAYER_TYPES, TypeLayerStyles } from '../abstract-geoview-layers';
import { AbstractGeoViewRaster, TypeBaseRasterLayer } from './abstract-geoview-raster';
import {
  TypeLayerEntryConfig,
  TypeSourceImageEsriInitialConfig,
  TypeGeoviewLayerConfig,
  TypeStyleGeometry,
  isUniqueValueStyleConfig,
  isClassBreakStyleConfig,
  TypeUniqueValueStyleConfig,
  TypeClassBreakStyleConfig,
  isSimpleStyleConfig,
  TypeListOfLayerEntryConfig,
  TypeEsriDynamicLayerEntryConfig,
} from '../../../map/map-schema-types';
import {
  TypeFeatureInfoEntry,
  TypeArrayOfFeatureInfoEntries,
  codedValueType,
  rangeDomainType,
} from '../../../../api/events/payloads/get-feature-info-payload';
import { api } from '../../../../app';
import { Layer } from '../../layer';
import { TimeDimension } from '../../../../core/utils/date-mgt';
import { EVENT_NAMES } from '../../../../api/events/event-types';
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
import { TypeJsonArray, TypeJsonObject } from '../../../../core/types/global-types';
import { TypeEsriFeatureLayerEntryConfig } from '../vector/esri-feature';

export interface TypeEsriDynamicLayerConfig extends Omit<TypeGeoviewLayerConfig, 'listOfLayerEntryConfig'> {
  geoviewLayerType: 'esriDynamic';
  listOfLayerEntryConfig: TypeEsriDynamicLayerEntryConfig[];
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
   *
   * @returns {TypeListOfLayerEntryConfig} A new list of layer entries configuration with deleted error layers.
   */
  validateListOfLayerEntryConfig(listOfLayerEntryConfig: TypeListOfLayerEntryConfig): TypeListOfLayerEntryConfig {
    return commonValidateListOfLayerEntryConfig.call(this, listOfLayerEntryConfig);
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
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        (payload) => {
          this.setVisible(layerEntryConfig.initialSettings!.visible!, layerEntryConfig);
        },
        `${this.mapId}/visibilityTest`
      );

      layerEntryConfig.gvLayer = new ImageLayer(imageLayerOptions);
      layerEntryConfig.gvLayer?.set('layerFilter', layerEntryConfig.layerFilter);
      this.applyViewFilter(layerEntryConfig);

      resolve(layerEntryConfig.gvLayer);
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
    const { map } = api.map(this.mapId);
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
    const convertedLocation = transform(location, `EPSG:${api.map(this.mapId).currentProjection}`, 'EPSG:4326');
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
      if (!this.getVisible(layerConfig) || !layerConfig.gvLayer) resolve([]);
      else {
        if (!(layerConfig as TypeEsriDynamicLayerEntryConfig).source.featureInfo?.queryable) resolve([]);
        let identifyUrl = getLocalizedValue(layerConfig.source?.dataAccessPath, this.mapId);
        if (!identifyUrl) resolve([]);
        else {
          identifyUrl = identifyUrl.endsWith('/') ? identifyUrl : `${identifyUrl}/`;
          const mapLayer = api.map(this.mapId).map;
          const { currentProjection } = api.map(this.mapId);
          const size = mapLayer.getSize()!;
          let bounds = mapLayer.getView().calculateExtent();
          bounds = transformExtent(bounds, `EPSG:${currentProjection}`, 'EPSG:4326');

          const extent = { xmin: bounds[0], ymin: bounds[1], xmax: bounds[2], ymax: bounds[3] };

          identifyUrl =
            `${identifyUrl}identify?f=json&tolerance=7` +
            `&mapExtent=${extent.xmin},${extent.ymin},${extent.xmax},${extent.ymax}` +
            `&imageDisplay=${size[0]},${size[1]},96` +
            `&layers=visible:${layerConfig.layerId}` +
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
   * Return feature information for all the features in the provided bounding box.
   *
   * @param {Coordinate} location The coordinate that will be used by the query.
   * @param {TypeEsriDynamicLayerEntryConfig} layerConfig The layer configuration.
   *
   * @returns {Promise<TypeArrayOfFeatureInfoEntries>} The feature info table.
   */
  protected getFeatureInfoUsingBBox(
    location: Coordinate[],
    layerConfig: TypeEsriDynamicLayerEntryConfig
  ): Promise<TypeArrayOfFeatureInfoEntries> {
    const promisedQueryResult = new Promise<TypeArrayOfFeatureInfoEntries>((resolve) => {
      resolve([]);
    });
    return promisedQueryResult;
  }

  /** ***************************************************************************************************************************
   * Return feature information for all the features in the provided polygon.
   *
   * @param {Coordinate} location The coordinate that will be used by the query.
   * @param {TypeEsriDynamicLayerEntryConfig} layerConfig The layer configuration.
   *
   * @returns {Promise<TypeArrayOfFeatureInfoEntries>} The feature info table.
   */
  protected getFeatureInfoUsingPolygon(
    location: Coordinate[],
    layerConfig: TypeEsriDynamicLayerEntryConfig
  ): Promise<TypeArrayOfFeatureInfoEntries> {
    const promisedQueryResult = new Promise<TypeArrayOfFeatureInfoEntries>((resolve) => {
      resolve([]);
    });
    return promisedQueryResult;
  }

  /** ***************************************************************************************************************************
   * Get the layer view filter. The filter is derived fron the uniqueValue or the classBreak visibility flags and an layerFilter
   * associated to the layer.
   *
   * @param {string | TypeLayerEntryConfig | null} layerPathOrConfig Optional layer path or configuration.
   *
   * @returns {string} the filter associated to the layerPath
   */
  getViewFilter(layerPathOrConfig: string | TypeLayerEntryConfig | null = this.activeLayer): string {
    const layerEntryConfig = (
      typeof layerPathOrConfig === 'string' ? this.getLayerConfig(layerPathOrConfig) : layerPathOrConfig
    ) as TypeEsriDynamicLayerEntryConfig;
    const layerFilter = layerEntryConfig.gvLayer?.get('layerFilter');

    if (layerEntryConfig.style) {
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

        const fieldNames = styleSettings.fields
          .reduce((fieldConcatenation, fieldName) => {
            const fieldFound = (this.layerMetadata[Layer.getLayerPath(layerEntryConfig)].fields as TypeJsonArray).find(
              (metadataFieldEntry) => metadataFieldEntry.name === fieldName
            );
            if (fieldFound!.type === 'esriFieldTypeString') return `${fieldConcatenation}||'~+~'||${fieldName}`;
            return `${fieldConcatenation}||'~+~'||cast(${fieldName} as char(25))`;
          }, '')
          .slice(9);

        const fieldValues = styleSettings.uniqueValueStyleInfo
          .reduce((valueConcatenation, fieldEntry) => {
            if (
              (fieldEntry.visible === 'no' && styleSettings.defaultVisible !== 'no') ||
              (fieldEntry.visible !== 'no' && styleSettings.defaultVisible === 'no')
            ) {
              const fieldEntryValues: string = fieldEntry.values
                .reduce((fieldValuesConcatenation, nextFieldValue) => {
                  return `${fieldValuesConcatenation}~+~${nextFieldValue}`;
                }, '')
                .slice(3);
              return `${valueConcatenation},'${fieldEntryValues}'`;
            }
            return valueConcatenation;
          }, '')
          .slice(1);

        const selectionOperator = styleSettings.defaultVisible !== 'no' ? 'not in' : 'in';
        const filterValue = `(${fieldNames} ${selectionOperator} (${fieldValues || "''"}))`;

        return `${filterValue}${layerFilter ? ` and (${layerFilter})` : ''}`;
      }

      if (isClassBreakStyleConfig(styleSettings)) {
        setAllUndefinedVisibilityFlagsToYes(styleSettings);
        if (
          featuresAreAllVisible(styleSettings.defaultVisible!, styleSettings.classBreakStyleInfo as { visible: 'yes' | 'no' | 'always' }[])
        )
          return `(1=1)${layerFilter ? ` and (${layerFilter})` : ''}`;

        const filterArray = [];
        let visibleWhenGreatherThisIndex = -1;
        for (let i = 0; i < styleSettings.classBreakStyleInfo.length; i++) {
          if (filterArray.length % 2 === 0) {
            if (i === 0) {
              if (styleSettings.classBreakStyleInfo[0].visible !== 'no' && styleSettings.defaultVisible === 'no')
                filterArray.push(`${styleSettings.field} >= ${styleSettings.classBreakStyleInfo[0].minValue}`);
              else if (styleSettings.classBreakStyleInfo[0].visible === 'no' && styleSettings.defaultVisible !== 'no') {
                filterArray.push(`${styleSettings.field} < ${styleSettings.classBreakStyleInfo[0].minValue}`);
                visibleWhenGreatherThisIndex = i;
              }
            } else if (styleSettings.classBreakStyleInfo[i].visible !== 'no' && styleSettings.defaultVisible === 'no') {
              filterArray.push(`${styleSettings.field} > ${styleSettings.classBreakStyleInfo[i].minValue}`);
              if (i + 1 === styleSettings.classBreakStyleInfo.length)
                filterArray.push(`${styleSettings.field} <= ${styleSettings.classBreakStyleInfo[i].maxValue}`);
            } else if (styleSettings.classBreakStyleInfo[i].visible === 'no' && styleSettings.defaultVisible !== 'no') {
              filterArray.push(`${styleSettings.field} <= ${styleSettings.classBreakStyleInfo[i].minValue}`);
              visibleWhenGreatherThisIndex = i;
            }
          } else if (styleSettings.defaultVisible === 'no') {
            if (styleSettings.classBreakStyleInfo[i].visible === 'no') {
              filterArray.push(`${styleSettings.field} <= ${styleSettings.classBreakStyleInfo[i - 1].maxValue}`);
            } else if (i + 1 === styleSettings.classBreakStyleInfo.length) {
              filterArray.push(`${styleSettings.field} <= ${styleSettings.classBreakStyleInfo[i].maxValue}`);
            }
          } else if (styleSettings.classBreakStyleInfo[i].visible !== 'no') {
            filterArray.push(`${styleSettings.field} > ${styleSettings.classBreakStyleInfo[i - 1].maxValue}`);
            visibleWhenGreatherThisIndex = -1;
          } else {
            visibleWhenGreatherThisIndex = i;
          }
        }
        if (visibleWhenGreatherThisIndex !== -1)
          filterArray.push(`${styleSettings.field} > ${styleSettings.classBreakStyleInfo[visibleWhenGreatherThisIndex].maxValue}`);

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
   * Apply a view filter to the layer. When the filter parameter is not empty (''), the view filter does not use the legend
   * filter. Otherwise, the getViewFilter method is used to define the view filter and the resulting filter is
   * (legend filters) and (layerFilter). The legend filters are derived from the uniqueValue or classBreaks style of the layer.
   * When the layer config is invalid, nothing is done.
   *
   * @param {string | TypeLayerEntryConfig | null} layerPathOrConfig Optional layer path or configuration.
   * @param {string} filter An optional filter to be used in place of the getViewFilter value.
   */
  applyViewFilter(layerPathOrConfig: string | TypeLayerEntryConfig | null = this.activeLayer, filter = '') {
    const layerEntryConfig = (
      typeof layerPathOrConfig === 'string' ? this.getLayerConfig(layerPathOrConfig) : layerPathOrConfig
    ) as TypeEsriDynamicLayerEntryConfig;
    if ((layerEntryConfig.gvLayer as ImageLayer<ImageArcGISRest>).getSource()) {
      const source = (layerEntryConfig.gvLayer as ImageLayer<ImageArcGISRest>).getSource()!;
      source.updateParams({ layerDefs: `{"${layerEntryConfig.layerId}": "${filter || this.getViewFilter(layerEntryConfig)}"}` });
      layerEntryConfig.gvLayer!.set('legendFilterIsOff', !!filter);
      layerEntryConfig.gvLayer!.changed();
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
    ) as TypeEsriDynamicLayerEntryConfig;
    if (layerEntryConfig) layerEntryConfig.gvLayer?.set('layerFilter', filterValue);
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
    ) as TypeEsriDynamicLayerEntryConfig;
    if (layerEntryConfig) return layerEntryConfig.gvLayer?.get('layerFilter');
    return undefined;
  }
}
