/* eslint-disable no-var, vars-on-top, block-scoped-var, no-param-reassign */
// eslint-disable-next-line max-classes-per-file
import { Options as SourceOptions } from 'ol/source/Vector';
import { WKB as FormatWKB } from 'ol/format';

import { ReadOptions } from 'ol/format/Feature';
import { Vector as VectorSource } from 'ol/source';
import BaseLayer from 'ol/layer/Base';
import LayerGroup from 'ol/layer/Group';
import { Feature } from 'ol';

import initSqlJs, { SqlValue } from 'sql.js';
import * as SLDReader from '@nieuwlandgeo/sldreader';

import { cloneDeep } from 'lodash';
import { Cast, TypeJsonObject } from '@/core/types/global-types';
import { AbstractGeoViewLayer, CONST_LAYER_TYPES } from '../abstract-geoview-layers';
import { AbstractGeoViewVector } from './abstract-geoview-vector';
import {
  TypeLayerEntryConfig,
  TypeVectorLayerEntryConfig,
  TypeVectorSourceInitialConfig,
  TypeGeoviewLayerConfig,
  TypeListOfLayerEntryConfig,
  layerEntryIsGroupLayer,
  TypeBaseLayerEntryConfig,
  TypeLayerGroupEntryConfig,
  TypeSimpleSymbolVectorConfig,
  TypeStrokeSymbolConfig,
  TypeLineStringVectorConfig,
  TypePolygonVectorConfig,
  TypeFillStyle,
  TypeLocalizedString,
} from '@/geo/map/map-schema-types';

import { createLocalizedString, getLocalizedValue } from '@/core/utils/utilities';

import { api } from '@/app';
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';

export interface TypeSourceGeoPackageInitialConfig extends TypeVectorSourceInitialConfig {
  format: 'GeoPackage';
}

export class TypeGeoPackageLayerEntryConfig extends TypeVectorLayerEntryConfig {
  declare source: TypeSourceGeoPackageInitialConfig;

  /**
   * The class constructor.
   * @param {TypeGeoPackageLayerEntryConfig} layerConfig The layer configuration we want to instanciate.
   */
  constructor(layerConfig: TypeGeoPackageLayerEntryConfig) {
    super(layerConfig);
    Object.assign(this, layerConfig);

    // Attribute 'style' must exist in layerConfig even if it is undefined
    if (!('style' in this)) this.style = undefined;
    // if this.source.dataAccessPath is undefined, we assign the metadataAccessPath of the GeoView layer to it.
    // Value for this.source.format can only be GeoPackage.
    if (!this.source) this.source = { format: 'GeoPackage' };
    if (!this.source.format) this.source.format = 'GeoPackage';
    if (!this.source.dataAccessPath) {
      let { en, fr } = this.geoviewLayerConfig.metadataAccessPath!;
      en = en!.split('/').length > 1 ? en!.split('/').slice(0, -1).join('/') : './';
      fr = fr!.split('/').length > 1 ? fr!.split('/').slice(0, -1).join('/') : './';
      this.source.dataAccessPath = { en, fr } as TypeLocalizedString;
    }
    if (
      !(this.source.dataAccessPath!.en?.startsWith('blob') && !this.source.dataAccessPath!.en?.endsWith('/')) &&
      !this.source.dataAccessPath!.en?.toLowerCase().endsWith('.gpkg')
    ) {
      this.source.dataAccessPath!.en = this.source.dataAccessPath!.en!.endsWith('/')
        ? `${this.source.dataAccessPath!.en}${this.layerId}`
        : `${this.source.dataAccessPath!.en}/${this.layerId}`;
      this.source.dataAccessPath!.fr = this.source.dataAccessPath!.fr!.endsWith('/')
        ? `${this.source.dataAccessPath!.fr}${this.layerId}`
        : `${this.source.dataAccessPath!.fr}/${this.layerId}`;
    }
    if (!this?.source?.dataProjection) this.source.dataProjection = 'EPSG:4326';
  }
}

export interface TypeGeoPackageLayerConfig extends Omit<TypeGeoviewLayerConfig, 'listOfLayerEntryConfig' | 'geoviewLayerType'> {
  geoviewLayerType: 'GeoPackage';
  listOfLayerEntryConfig: TypeGeoPackageLayerEntryConfig[];
}

interface sldsInterface {
  [key: string | number]: string | number | Uint8Array;
}

interface layerData {
  name: string;
  source: VectorSource<Feature>;
  properties: initSqlJs.ParamsObject | undefined;
}

type tableInfo = {
  table_name: SqlValue;
  srs_id?: string;
  geometry_column_name: SqlValue;
};

/** *****************************************************************************************************************************
 * type guard function that redefines a TypeGeoviewLayerConfig as a TypeGeoPackageFeatureLayerConfig if the geoviewLayerType attribute of
 * the verifyIfLayer parameter is GEOPACKAGE. The type ascention applies only to the true block of the if clause that use this
 * function.
 *
 * @param {TypeGeoviewLayerConfig} verifyIfLayer Polymorphic object to test in order to determine if the type ascention is valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const layerConfigIsGeoPackage = (verifyIfLayer: TypeGeoviewLayerConfig): verifyIfLayer is TypeGeoPackageLayerConfig => {
  return verifyIfLayer?.geoviewLayerType === CONST_LAYER_TYPES.GEOPACKAGE;
};

/** *****************************************************************************************************************************
 * type guard function that redefines an AbstractGeoViewLayer as a GeoPackage
 * if the type attribute of the verifyIfGeoViewLayer parameter is GEOPACKAGE. The type ascention
 * applies only to the true block of the if clause that use this function.
 *
 * @param {AbstractGeoViewLayer} verifyIfGeoViewLayer Polymorphic object to test in order to determine if the type ascention is
 * valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const geoviewLayerIsGeoPackage = (verifyIfGeoViewLayer: AbstractGeoViewLayer): verifyIfGeoViewLayer is GeoPackage => {
  return verifyIfGeoViewLayer?.type === CONST_LAYER_TYPES.GEOPACKAGE;
};

/** *****************************************************************************************************************************
 * type guard function that redefines a TypeLayerEntryConfig as a TypeGeoPackageLayerEntryConfig if the geoviewLayerType attribute
 * of the verifyIfGeoViewEntry.geoviewLayerConfig attribute is GEOPACKAGE. The type ascention applies only to the true block of
 * the if clause that use this function.
 *
 * @param {TypeLayerEntryConfig} verifyIfGeoViewEntry Polymorphic object to test in order to determine if the type ascention is
 * valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const geoviewEntryIsGeoPackage = (
  verifyIfGeoViewEntry: TypeLayerEntryConfig
): verifyIfGeoViewEntry is TypeGeoPackageLayerEntryConfig => {
  return verifyIfGeoViewEntry?.geoviewLayerConfig?.geoviewLayerType === CONST_LAYER_TYPES.GEOPACKAGE;
};

// ******************************************************************************************************************************
// ******************************************************************************************************************************
/** ******************************************************************************************************************************
 * A class to add GeoPackage api feature layer.
 *
 * @exports
 * @class GeoPackage
 */
// ******************************************************************************************************************************
export class GeoPackage extends AbstractGeoViewVector {
  /** ***************************************************************************************************************************
   * Initialize layer
   *
   * @param {string} mapId the id of the map
   * @param {TypeGeoPackageFeatureLayerConfig} layerConfig the layer configuration
   */
  constructor(mapId: string, layerConfig: TypeGeoPackageLayerConfig) {
    super(CONST_LAYER_TYPES.GEOPACKAGE, layerConfig, mapId);
  }

  /** ***************************************************************************************************************************
   * Geopackages have no metadata.
   *
   * @returns {Promise<void>} A promise that the execution is completed.
   */
  protected fetchServiceMetadata(): Promise<void> {
    this.setLayerPhase('fetchServiceMetadata');
    const promisedExecution = new Promise<void>((resolve) => {
      resolve();
    });
    return promisedExecution;
  }

  /** ***************************************************************************************************************************
   * This method validates recursively the configuration of the layer entries to ensure that it is a feature layer identified
   * with a numeric layerId and creates a group entry when a layer is a group.
   *
   * @param {TypeListOfLayerEntryConfig} listOfLayerEntryConfig The list of layer entries configuration to validate.
   */
  protected validateListOfLayerEntryConfig(listOfLayerEntryConfig: TypeListOfLayerEntryConfig) {
    this.setLayerPhase('validateListOfLayerEntryConfig');
    return listOfLayerEntryConfig.forEach((layerConfig: TypeLayerEntryConfig) => {
      const { layerPath } = layerConfig;
      if (layerEntryIsGroupLayer(layerConfig)) {
        this.validateListOfLayerEntryConfig(layerConfig.listOfLayerEntryConfig!);
        if (!layerConfig.listOfLayerEntryConfig.length) {
          this.layerLoadError.push({
            layer: layerPath,
            consoleMessage: `Empty layer group (mapId:  ${this.mapId}, layerPath: ${layerPath})`,
          });
          this.setLayerStatus('error', layerPath);
          return;
        }
      }

      this.setLayerStatus('loading', layerPath);

      // When no metadata are provided, all layers are considered valid.
      if (!this.metadata) return;

      // Note that the code assumes geopackage does not contains metadata layer group. If you need layer group,
      // you can define them in the configuration section.
      if (Array.isArray(this.metadata!.collections)) {
        const foundCollection = this.metadata!.collections.find((layerMetadata) => layerMetadata.id === layerConfig.layerId);
        if (!foundCollection) {
          this.layerLoadError.push({
            layer: layerPath,
            consoleMessage: `GeoPackage feature layer not found (mapId:  ${this.mapId}, layerPath: ${layerPath})`,
          });
          this.setLayerStatus('error', layerPath);
          return;
        }

        if (foundCollection.description)
          layerConfig.layerName = {
            en: foundCollection.description as string,
            fr: foundCollection.description as string,
          };

        const { currentProjection } = MapEventProcessor.getMapState(this.mapId);
        if (layerConfig.initialSettings?.extent)
          layerConfig.initialSettings.extent = api.projection.transformExtent(
            layerConfig.initialSettings.extent,
            'EPSG:4326',
            `EPSG:${currentProjection}`
          );

        if (!layerConfig.initialSettings?.bounds && foundCollection.extent?.spatial?.bbox && foundCollection.extent?.spatial?.crs) {
          // layerConfig.initialSettings cannot be undefined because config-validation set it to {} if it is undefined.
          layerConfig.initialSettings!.bounds = api.projection.transformExtent(
            foundCollection.extent.spatial.bbox[0] as number[],
            api.projection.getProjection(foundCollection.extent.spatial.crs as string)!,
            `EPSG:${currentProjection}`
          );
        }
        return;
      }

      throw new Error(`Invalid collection's metadata prevent loading of layer (mapId:  ${this.mapId}, layerPath: ${layerPath})`);
    });
  }

  /** ***************************************************************************************************************************
   * Process recursively the list of layer Entries to create the layers and the layer groups.
   *
   * @param {TypeListOfLayerEntryConfig} listOfLayerEntryConfig The list of layer entries to process.
   * @param {LayerGroup} layerGroup Optional layer group to use when we have many layers. The very first call to
   *  processListOfLayerEntryConfig must not provide a value for this parameter. It is defined for internal use.
   *
   * @returns {Promise<BaseLayer | null>} The promise that the layers were processed.
   */
  processListOfLayerEntryConfig(listOfLayerEntryConfig: TypeListOfLayerEntryConfig, layerGroup?: LayerGroup): Promise<BaseLayer | null> {
    this.setLayerPhase('processListOfLayerEntryConfig');
    const promisedListOfLayerEntryProcessed = new Promise<BaseLayer | null>((resolve) => {
      // Single group layer handled recursively
      if (listOfLayerEntryConfig.length === 1 && layerEntryIsGroupLayer(listOfLayerEntryConfig[0])) {
        const newLayerGroup = this.createLayerGroup(listOfLayerEntryConfig[0], listOfLayerEntryConfig[0].initialSettings!);

        this.processListOfLayerEntryConfig(listOfLayerEntryConfig[0].listOfLayerEntryConfig!, newLayerGroup).then((groupReturned) => {
          if (groupReturned) {
            if (layerGroup) layerGroup.getLayers().push(groupReturned);
            resolve(groupReturned);
          } else {
            this.layerLoadError.push({
              layer: listOfLayerEntryConfig[0].layerPath,
              consoleMessage: `Unable to create group layer ${listOfLayerEntryConfig[0].layerPath} on map ${this.mapId}`,
            });
            resolve(null);
          }
        });
        // Multiple layer configs are processed individually and added to layer group
      } else if (listOfLayerEntryConfig.length > 1) {
        if (!layerGroup)
          layerGroup = this.createLayerGroup(
            listOfLayerEntryConfig[0].parentLayerConfig as TypeLayerEntryConfig,
            listOfLayerEntryConfig[0].initialSettings!
          );

        listOfLayerEntryConfig.forEach((layerConfig) => {
          const { layerPath } = layerConfig;
          if (layerEntryIsGroupLayer(layerConfig)) {
            const newLayerGroup = this.createLayerGroup(layerConfig, layerConfig.initialSettings!);
            this.processListOfLayerEntryConfig(layerConfig.listOfLayerEntryConfig!, newLayerGroup).then((groupReturned) => {
              if (groupReturned) {
                layerGroup!.getLayers().push(groupReturned);
              } else {
                this.layerLoadError.push({
                  layer: listOfLayerEntryConfig[0].layerPath,
                  consoleMessage: `Unable to create group layer ${layerConfig.layerPath} on map ${this.mapId}`,
                });
                resolve(null);
              }
            });
          } else {
            this.processOneGeopackage(layerConfig as TypeBaseLayerEntryConfig).then((layers) => {
              if (layers) {
                layerGroup!.getLayers().push(layers);
                this.setLayerStatus('processed', layerPath);
              } else {
                this.layerLoadError.push({
                  layer: listOfLayerEntryConfig[0].layerPath,
                  consoleMessage: `Unable to create layer ${layerConfig.layerPath} on map ${this.mapId}`,
                });
                this.setLayerStatus('error', layerPath);
              }
            });
          }
        });
        if (layerGroup) resolve(layerGroup);
        // Single non-group config
      } else {
        this.processOneGeopackage(listOfLayerEntryConfig[0] as TypeBaseLayerEntryConfig, layerGroup).then((layer) => {
          const layerPath0 = listOfLayerEntryConfig[0].layerPath;
          if (layer) {
            this.setLayerStatus('processed', layerPath0);
            resolve(layer);
          } else {
            this.layerLoadError.push({
              layer: listOfLayerEntryConfig[0].layerPath,
              consoleMessage: `Unable to create layer ${listOfLayerEntryConfig[0].layerPath} on map ${this.mapId}`,
            });
            this.setLayerStatus('error', layerPath0);
          }
        });
      }
    });

    return promisedListOfLayerEntryProcessed;
  }

  /** ***************************************************************************************************************************
   * Create a source configuration for the vector layer.
   *
   * @param {TypeBaseLayerEntryConfig} layerConfig The layer entry configuration.
   * @param {SourceOptions} sourceOptions The source options (default: {}).
   * @param {ReadOptions} readOptions The read options (default: {}).
   */
  protected extractGeopackageData(
    layerConfig: TypeBaseLayerEntryConfig,
    sourceOptions: SourceOptions = {},
    readOptions: ReadOptions = {}
  ): Promise<[layerData[], sldsInterface]> {
    const promisedGeopackageData = new Promise<[layerData[], sldsInterface]>((resolve) => {
      const url = getLocalizedValue(layerConfig.source!.dataAccessPath!, this.mapId);
      if (this.attributions.length !== 0) sourceOptions.attributions = this.attributions;
      const layersInfo: layerData[] = [];
      const styleSlds: sldsInterface = {};

      const xhr = new XMLHttpRequest();
      xhr.responseType = 'arraybuffer';

      initSqlJs({
        locateFile: (file) => `https://sql.js.org/dist/${file}`,
      }).then((SQL) => {
        xhr.open('GET', url as string);
        xhr.onload = () => {
          if (xhr.status === 200) {
            const db = new SQL.Database(new Uint8Array(xhr.response as ArrayBuffer));
            var tables: tableInfo[] = [];

            let stmt = db.prepare(`
            SELECT gpkg_contents.table_name, gpkg_contents.srs_id,
                gpkg_geometry_columns.column_name
            FROM gpkg_contents JOIN gpkg_geometry_columns
            WHERE gpkg_contents.data_type='features' AND
                gpkg_contents.table_name=gpkg_geometry_columns.table_name;
                `);

            while (stmt.step()) {
              const row = stmt.get();
              tables.unshift({
                table_name: row[0],
                srs_id: row[1]?.toString(),
                geometry_column_name: row[2],
              });
            }

            // Extract styles
            stmt = db.prepare(`
            SELECT gpkg_contents.table_name
            FROM gpkg_contents
            WHERE gpkg_contents.table_name='layer_styles'
            `);

            if (stmt.step()) {
              stmt = db.prepare('SELECT f_table_name, styleSLD FROM layer_styles');
              while (stmt.step()) {
                const row = stmt.get();
                if (row[1]) [, styleSlds[row[0] as string]] = row;
              }
            }

            const format = new FormatWKB();

            // Turn each table's geometries into a vector source
            for (let i = 0; i < tables.length; i++) {
              const table = tables[i];
              const tableName = table.table_name;
              const tableDataProjection = `EPSG:${table.srs_id}`;
              const columnName = table.geometry_column_name as string;
              const features: Feature[] = [];
              let properties;

              stmt = db.prepare(`SELECT * FROM '${tableName}'`);
              while (stmt.step()) {
                properties = stmt.getAsObject();
                const geomProp = properties[columnName] as Uint8Array;
                delete properties[columnName];
                const feature = this.parseGpkgGeom(geomProp);
                const formattedFeature = format.readFeatures(feature, {
                  ...readOptions,
                  dataProjection: tableDataProjection,
                  featureProjection: `EPSG:${MapEventProcessor.getMapState(this.mapId).currentProjection}`,
                });
                formattedFeature[0].setProperties(properties);
                features.push(formattedFeature[0]);
              }

              const vectorSource = new VectorSource({
                ...sourceOptions,
                loader(extent, resolution, projection, success, failure) {
                  if (features !== undefined) {
                    vectorSource.addFeatures(features);
                    success!(features);
                  } else failure!();
                },
              });

              layersInfo.push({
                name: tableName as string,
                source: vectorSource,
                properties,
              });

              const { layerPath } = layerConfig;
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
            }

            db.close();
            resolve([layersInfo, styleSlds]);
          }
        };
        xhr.send();
      });
    });

    return promisedGeopackageData;
  }

  /** ***************************************************************************************************************************
   * This method creates a GeoView layer using the definition provided in the layerConfig parameter.
   *
   * @param {TypeLayerEntryConfig} layerConfig Information needed to create the GeoView layer.
   * @param {sldsInterface} sld The SLD style associated with the layers geopackage, if any
   *
   * @returns {Promise<BaseLayer | null>} The GeoView base layer that has been created.
   */
  protected processOneGeopackageLayer(
    layerConfig: TypeBaseLayerEntryConfig,
    layerInfo: layerData,
    sld?: sldsInterface
  ): Promise<BaseLayer | null> {
    const promisedVectorLayer = new Promise<BaseLayer | null>((resolve) => {
      api.maps[this.mapId].layer.registerLayerConfig(layerConfig);
      this.registerToLayerSets(layerConfig);

      const { name, source } = layerInfo;
      // entryType will be group if copied from group parent
      layerConfig.entryType = 'vector';

      // Extract layer styles if they exist
      if (sld && sld[name]) {
        const { rules } = SLDReader.Reader(sld[name]).layers[0].styles[0].featuretypestyles[0];
        if ((layerConfig as TypeVectorLayerEntryConfig).style === undefined) (layerConfig as TypeVectorLayerEntryConfig).style = {};

        for (let i = 0; i < rules.length; i++) {
          Object.keys(rules[i]).forEach((key) => {
            // Polygon style
            if (key.toLowerCase() === 'polygonsymbolizer' && !(layerConfig as TypeVectorLayerEntryConfig).style!.Polygon) {
              const polyStyles = rules[i].polygonsymbolizer[0];
              let color: string | undefined;
              let graphicSize: number | undefined;
              let patternWidth: number | undefined;
              let fillStyle: TypeFillStyle | undefined;
              if ('fill' in polyStyles && polyStyles.fill.styling?.fill) color = polyStyles.fill.styling.fill;

              const stroke: TypeStrokeSymbolConfig = {};
              if (polyStyles.stroke) {
                if (polyStyles.stroke.styling?.stroke) stroke.color = polyStyles.stroke.styling.stroke;
                if (polyStyles.stroke.styling?.strokeWidth) stroke.width = polyStyles.stroke.styling.strokeWidth;
              }

              if ('fill' in polyStyles && 'graphicfill' in polyStyles.fill) {
                if (
                  polyStyles.fill.graphicfill.graphic &&
                  polyStyles.fill.graphicfill.graphic.mark &&
                  polyStyles.fill.graphicfill.graphic.mark.stroke
                ) {
                  if (polyStyles.fill.graphicfill.graphic.mark.stroke.styling?.stroke) color = polyStyles.stroke.styling.stroke;
                  if (polyStyles.fill.graphicfill.graphic.mark.stroke.styling?.strokeWidth)
                    patternWidth = polyStyles.stroke.styling.strokeWidth;
                }

                if (polyStyles.fill.graphicfill.graphic) {
                  if (polyStyles.fill.graphicfill.graphic.size) graphicSize = polyStyles.fill.graphicfill.graphic.size;
                  if (polyStyles.fill.graphicfill.graphic.mark && polyStyles.fill.graphicfill.graphic.mark.wellknownname) {
                    const fillName = polyStyles.fill.graphicfill.graphic.mark.wellknownname;
                    // Translate sld fill styles to geoview versions
                    switch (fillName) {
                      case 'vertline':
                        fillStyle = 'vertical';
                        break;
                      case 'horline':
                        fillStyle = 'horizontal';
                        break;
                      case 'slash':
                        fillStyle = 'forwardDiagonal';
                        break;
                      case 'backslash':
                        fillStyle = 'backwardDiagonal';
                        break;
                      case 'plus':
                        fillStyle = 'cross';
                        break;
                      case 'times':
                        fillStyle = 'diagonalCross';
                        break;
                      default:
                        fillStyle = 'solid';
                    }
                  }
                }
              }

              const styles: TypePolygonVectorConfig = {
                type: 'filledPolygon',
                color,
                stroke,
                paternSize: graphicSize || 8,
                paternWidth: patternWidth || 1,
                fillStyle: fillStyle || 'solid',
              };
              (layerConfig as TypeVectorLayerEntryConfig).style!.Polygon = { styleType: 'simple', settings: styles };
              // LineString style
            } else if (key.toLowerCase() === 'linesymbolizer' && !(layerConfig as TypeVectorLayerEntryConfig).style!.LineString) {
              const lineStyles = rules[i].linesymbolizer[0];

              const stroke: TypeStrokeSymbolConfig = {};
              if (lineStyles.stroke) {
                if (lineStyles.stroke.styling?.stroke) stroke.color = lineStyles.stroke.styling.stroke;
                if (lineStyles.stroke.styling?.strokeWidth) stroke.width = lineStyles.stroke.styling.strokeWidth;
              }

              const styles: TypeLineStringVectorConfig = { type: 'lineString', stroke };
              (layerConfig as TypeVectorLayerEntryConfig).style!.LineString = { styleType: 'simple', settings: styles };
              // Point style
            } else if (key.toLowerCase() === 'pointsymbolizer' && !(layerConfig as TypeVectorLayerEntryConfig).style!.Point) {
              const { graphic } = rules[i].pointsymbolizer[0];

              let offset: [number, number] | null = null;
              if ('displacement' in graphic) {
                offset = [
                  graphic.displacement.displacementx ? graphic.displacement.displacementx : 0,
                  graphic.displacement.displacementx ? graphic.displacement.displacementx : 0,
                ];
              }

              const { size, rotation } = graphic;

              if ('mark' in graphic) {
                let color: string | null = null;
                if ('fill' in graphic.mark && graphic.mark.fill.styling.fill) color = graphic.mark.fill.styling.fill;
                if ('wellknownname' in graphic.mark) {
                  let symbol;
                  if (graphic.mark.wellknownname === 'cross') symbol = '+';
                  else if (graphic.mark.wellknownname === 'x') symbol = 'X';
                  else symbol = graphic.mark.wellknownname;

                  const styles: TypeSimpleSymbolVectorConfig = {
                    type: 'simpleSymbol',
                    symbol,
                  };

                  if (color) styles.color = color;
                  if (rotation) styles.rotation = rotation;
                  if (size) styles.size = size;
                  if (offset) styles.offset = offset;

                  const stroke: TypeStrokeSymbolConfig = {};
                  if (graphic.mark.stroke) {
                    if (graphic.mark.stroke.styling?.stroke) stroke.color = graphic.mark.stroke.styling.stroke;
                    if (graphic.mark.stroke.styling?.strokeWidth) stroke.width = graphic.mark.stroke.styling.strokeWidth;
                  }

                  (layerConfig as TypeVectorLayerEntryConfig).style!.Point = { styleType: 'simple', settings: styles };
                }
              }
            }
          });
        }
      }

      if (layerInfo.properties) {
        const { properties } = layerInfo;
        this.processFeatureInfoConfig(properties as TypeJsonObject, layerConfig as TypeVectorLayerEntryConfig);
      }

      const { layerPath } = layerConfig;
      let loadErrorHandler: () => void;
      const loadEndHandler = () => {
        this.setLayerStatus('loaded', layerPath);
        source.un('featuresloaderror', loadErrorHandler);
      };
      loadErrorHandler = () => {
        this.setLayerStatus('error', layerPath);
        source.un('featuresloadend', loadEndHandler);
      };

      source.once('featuresloadend', loadEndHandler);
      source.once('featuresloaderror', loadErrorHandler);

      const vectorLayer = this.createVectorLayer(layerConfig as TypeVectorLayerEntryConfig, source);
      this.setLayerStatus('processed', layerPath);

      resolve(vectorLayer);
    });

    return promisedVectorLayer;
  }

  /** ***************************************************************************************************************************
   * This method creates all layers from a single geopackage
   *
   * @param {TypeLayerEntryConfig} layerConfig Information needed to create the GeoView layer.
   * @param {LayerGroup} layerGroup Optional layer group for multiple layers.
   *
   * @returns {Promise<BaseLayer | null>} The GeoView base layer that has been created.
   */
  protected processOneGeopackage(layerConfig: TypeBaseLayerEntryConfig, layerGroup?: LayerGroup): Promise<BaseLayer | null> {
    const promisedLayers = new Promise<BaseLayer | LayerGroup | null>((resolve) => {
      const { layerPath } = layerConfig;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      this.extractGeopackageData(layerConfig).then(([layers, slds]) => {
        if (layers.length === 1) {
          this.processOneGeopackageLayer(layerConfig, layers[0], slds).then((baseLayer) => {
            if (baseLayer) {
              this.setLayerStatus('processed', layerPath);
              if (layerGroup) layerGroup.getLayers().push(baseLayer);
              resolve(layerGroup || baseLayer);
            } else {
              this.layerLoadError.push({
                layer: layerConfig.layerPath,
                consoleMessage: `Unable to create layer ${layerConfig.layerPath} on map ${this.mapId}`,
              });
              this.setLayerStatus('error', layerPath);
              resolve(null);
            }
          });
        } else {
          layerConfig.entryType = 'group';
          (layerConfig as TypeLayerEntryConfig).listOfLayerEntryConfig = [];
          const newLayerGroup = this.createLayerGroup(layerConfig, layerConfig.initialSettings!);
          for (let i = 0; i < layers.length; i++) {
            const newLayerEntryConfig = cloneDeep(layerConfig) as TypeBaseLayerEntryConfig;
            newLayerEntryConfig.layerId = layers[i].name;
            newLayerEntryConfig.layerName = createLocalizedString(layers[i].name);
            newLayerEntryConfig.entryType = 'vector';
            newLayerEntryConfig.parentLayerConfig = Cast<TypeLayerGroupEntryConfig>(layerConfig);

            this.processOneGeopackageLayer(newLayerEntryConfig, layers[i], slds).then((baseLayer) => {
              const newLayerPath = newLayerEntryConfig.layerPath;
              if (baseLayer) {
                (layerConfig as unknown as TypeLayerGroupEntryConfig).listOfLayerEntryConfig!.push(newLayerEntryConfig);
                newLayerGroup.getLayers().push(baseLayer);
                this.setLayerStatus('processed', newLayerPath);
              } else {
                this.layerLoadError.push({
                  layer: layerConfig.layerPath,
                  consoleMessage: `Unable to create layer ${layerConfig.layerPath} on map ${this.mapId}`,
                });
                this.setLayerStatus('error', newLayerPath);
                resolve(null);
              }
            });
          }
          resolve(newLayerGroup);
        }
      });
    });
    return promisedLayers;
  }

  /** ***************************************************************************************************************************
   * This method sets the outfields and aliasFields of the source feature info.
   *
   * @param {TypeJsonArray} fields An array of field names and its aliases.
   * @param {TypeVectorLayerEntryConfig} layerConfig The vector layer entry to configure.
   */
  private processFeatureInfoConfig(fields: TypeJsonObject, layerConfig: TypeVectorLayerEntryConfig) {
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

      Object.keys(fields).forEach((fieldEntry) => {
        if (!fields[fieldEntry]) return;
        if (fields[fieldEntry].type === 'Geometry') return;
        if (processOutField) {
          layerConfig.source!.featureInfo!.outfields!.en = `${layerConfig.source!.featureInfo!.outfields!.en}${fieldEntry},`;
          let fieldType: 'string' | 'date' | 'number';
          if (fields[fieldEntry].type === 'date') fieldType = 'date';
          else if (['int', 'number'].includes(fields[fieldEntry].type as string)) fieldType = 'number';
          else fieldType = 'string';
          layerConfig.source!.featureInfo!.fieldTypes = `${layerConfig.source!.featureInfo!.fieldTypes}${fieldType},`;
        }
        layerConfig.source!.featureInfo!.aliasFields!.en = `${layerConfig.source!.featureInfo!.aliasFields!.en}${fieldEntry},`;
      });
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

  /** ***************************************************************************************************************************
   * Create a source configuration for the vector layer.
   *
   * @param {Uint8Array} gpkgBinGeom Binary geometry array to be parsed.
   *
   * @returns {Uint8Array} Uint8Array Subarray of inputted binary geoametry array.
   */
  protected parseGpkgGeom(gpkgBinGeom: Uint8Array): Uint8Array {
    var flags = gpkgBinGeom[3];
    // eslint-disable-next-line no-bitwise
    var eFlags: number = (flags >> 1) & 7;
    var envelopeSize: number;
    switch (eFlags) {
      case 0:
        envelopeSize = 0;
        break;
      case 1:
        envelopeSize = 32;
        break;
      case 2:
      case 3:
        envelopeSize = 48;
        break;
      case 4:
        envelopeSize = 64;
        break;
      default:
        throw new Error('Invalid geometry envelope size flag in GeoPackage');
    }
    return gpkgBinGeom.subarray(envelopeSize + 8);
  }
}
