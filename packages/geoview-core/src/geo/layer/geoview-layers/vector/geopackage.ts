/* eslint-disable no-var, vars-on-top, block-scoped-var, no-param-reassign */
import { get, transformExtent } from 'ol/proj';
import { Options as SourceOptions } from 'ol/source/Vector';
import { WKB as FormatWKB } from 'ol/format';

import { ReadOptions } from 'ol/format/Feature';
import { Vector as VectorSource } from 'ol/source';
import { Geometry } from 'ol/geom';
import BaseLayer from 'ol/layer/Base';
import LayerGroup from 'ol/layer/Group';
import { Feature } from 'ol';

import initSqlJs from 'sql.js';
import * as SLDReader from '@nieuwlandgeo/sldreader';

import { cloneDeep } from 'lodash';
import { TypeJsonObject } from '@/core/types/global-types';
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
  TypeBaseSourceVectorInitialConfig,
  TypeLayerGroupEntryConfig,
  TypeSimpleSymbolVectorConfig,
  TypeStrokeSymbolConfig,
  TypeLineStringVectorConfig,
  TypePolygonVectorConfig,
  TypeFillStyle,
} from '../../../map/map-schema-types';

import { getLocalizedValue } from '@/core/utils/utilities';

import { api } from '@/app';
import { Layer } from '../../layer';

export interface TypeSourceGeoPackageInitialConfig extends TypeVectorSourceInitialConfig {
  format: 'GeoPackage';
}

export interface TypeGeoPackageLayerEntryConfig extends Omit<TypeVectorLayerEntryConfig, 'source'> {
  source: TypeSourceGeoPackageInitialConfig;
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
  source: VectorSource<Geometry>;
  properties: initSqlJs.ParamsObject | undefined;
}

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
 * of the verifyIfGeoViewEntry.geoviewRootLayer attribute is GEOPACKAGE. The type ascention applies only to the true block of
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
  return verifyIfGeoViewEntry?.geoviewRootLayer?.geoviewLayerType === CONST_LAYER_TYPES.GEOPACKAGE;
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
   * This method validates recursively the configuration of the layer entries to ensure that it is a feature layer identified
   * with a numeric layerId and creates a group entry when a layer is a group.
   *
   * @param {TypeListOfLayerEntryConfig} listOfLayerEntryConfig The list of layer entries configuration to validate.
   *
   * @returns {TypeListOfLayerEntryConfig} A new list of layer entries configuration with deleted error layers.
   */
  protected validateListOfLayerEntryConfig(listOfLayerEntryConfig: TypeListOfLayerEntryConfig): TypeListOfLayerEntryConfig {
    return listOfLayerEntryConfig.filter((layerEntryConfig: TypeLayerEntryConfig) => {
      if (api.map(this.mapId).layer.isRegistered(layerEntryConfig)) {
        this.layerLoadError.push({
          layer: Layer.getLayerPath(layerEntryConfig),
          consoleMessage: `Duplicate layerPath (mapId:  ${this.mapId}, layerPath: ${Layer.getLayerPath(layerEntryConfig)})`,
        });
        return false;
      }

      if (layerEntryIsGroupLayer(layerEntryConfig)) {
        layerEntryConfig.listOfLayerEntryConfig = this.validateListOfLayerEntryConfig(layerEntryConfig.listOfLayerEntryConfig!);
        if (layerEntryConfig.listOfLayerEntryConfig.length) {
          api.map(this.mapId).layer.registerLayerConfig(layerEntryConfig);
          return true;
        }
        this.layerLoadError.push({
          layer: Layer.getLayerPath(layerEntryConfig),
          consoleMessage: `Empty layer group (mapId:  ${this.mapId}, layerPath: ${Layer.getLayerPath(layerEntryConfig)})`,
        });
        return false;
      }

      // When no metadata are provided, all layers are considered valid.
      if (!this.metadata) {
        api.map(this.mapId).layer.registerLayerConfig(layerEntryConfig);
        return true;
      }

      // Note that the code assumes geopackage does not contains metadata layer group. If you need layer group,
      // you can define them in the configuration section.
      if (Array.isArray(this.metadata!.collections)) {
        for (var i = 0; i < this.metadata!.collections.length; i++)
          if (this.metadata!.collections[i].id === layerEntryConfig.layerId) break;
        if (i === this.metadata!.collections.length) {
          this.layerLoadError.push({
            layer: Layer.getLayerPath(layerEntryConfig),
            consoleMessage: `GeoPackage feature layer not found (mapId:  ${this.mapId}, layerPath: ${Layer.getLayerPath(
              layerEntryConfig
            )})`,
          });
          return false;
        }

        if (this.metadata!.collections[i].description)
          layerEntryConfig.layerName = {
            en: this.metadata!.collections[i].description as string,
            fr: this.metadata!.collections[i].description as string,
          };

        if (layerEntryConfig.initialSettings?.extent)
          layerEntryConfig.initialSettings.extent = transformExtent(
            layerEntryConfig.initialSettings.extent,
            'EPSG:4326',
            `EPSG:${api.map(this.mapId).currentProjection}`
          );

        if (
          !layerEntryConfig.initialSettings?.bounds &&
          this.metadata?.collections[i].extent?.spatial?.bbox &&
          this.metadata?.collections[i].extent?.spatial?.crs
        ) {
          // layerEntryConfig.initialSettings cannot be undefined because config-validation set it to {} if it is undefined.
          layerEntryConfig.initialSettings!.bounds = transformExtent(
            this.metadata.collections[i].extent.spatial.bbox[0] as number[],
            get(this.metadata.collections[i].extent.spatial.crs as string)!,
            `EPSG:${api.map(this.mapId).currentProjection}`
          );
        }

        api.map(this.mapId).layer.registerLayerConfig(layerEntryConfig);
        return true;
      }

      this.layerLoadError.push({
        layer: Layer.getLayerPath(layerEntryConfig),
        consoleMessage: `Invalid collection's metadata prevent loading of layer (mapId:  ${this.mapId}, layerPath: ${Layer.getLayerPath(
          layerEntryConfig
        )})`,
      });
      return false;
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
  protected processListOfLayerEntryConfig(
    listOfLayerEntryConfig: TypeListOfLayerEntryConfig,
    layerGroup?: LayerGroup
  ): Promise<BaseLayer | null> {
    const promisedListOfLayerEntryProcessed = new Promise<BaseLayer | null>((resolve) => {
      // Single group layer handled recursively
      if (listOfLayerEntryConfig.length === 1 && layerEntryIsGroupLayer(listOfLayerEntryConfig[0])) {
        const newLayerGroup = this.createLayerGroup(listOfLayerEntryConfig[0]);

        this.processListOfLayerEntryConfig(listOfLayerEntryConfig[0].listOfLayerEntryConfig!, newLayerGroup).then((groupReturned) => {
          if (groupReturned) {
            if (layerGroup) layerGroup.getLayers().push(groupReturned);
            resolve(groupReturned);
          } else {
            this.layerLoadError.push({
              layer: Layer.getLayerPath(listOfLayerEntryConfig[0]),
              consoleMessage: `Unable to create group layer ${Layer.getLayerPath(listOfLayerEntryConfig[0])} on map ${this.mapId}`,
            });
            resolve(null);
          }
        });
        // Multiple layer configs are processed individually and added to layer group
      } else if (listOfLayerEntryConfig.length > 1) {
        if (!layerGroup) layerGroup = this.createLayerGroup(listOfLayerEntryConfig[0].parentLayerConfig as TypeLayerEntryConfig);

        listOfLayerEntryConfig.forEach((layerEntryConfig) => {
          if (layerEntryIsGroupLayer(layerEntryConfig)) {
            const newLayerGroup = this.createLayerGroup(layerEntryConfig);
            this.processListOfLayerEntryConfig(layerEntryConfig.listOfLayerEntryConfig!, newLayerGroup).then((groupReturned) => {
              if (groupReturned) {
                layerGroup!.getLayers().push(groupReturned);
              } else {
                this.layerLoadError.push({
                  layer: Layer.getLayerPath(listOfLayerEntryConfig[0]),
                  consoleMessage: `Unable to create group layer ${Layer.getLayerPath(layerEntryConfig)} on map ${this.mapId}`,
                });
                resolve(null);
              }
            });
          } else {
            this.processOneGeopackage(layerEntryConfig as TypeBaseLayerEntryConfig).then((layers) => {
              if (layers) {
                layerGroup!.getLayers().push(layers);
              } else {
                this.layerLoadError.push({
                  layer: Layer.getLayerPath(listOfLayerEntryConfig[0]),
                  consoleMessage: `Unable to create group layer ${Layer.getLayerPath(layerEntryConfig)} on map ${this.mapId}`,
                });
              }
            });
          }
        });
        if (layerGroup) resolve(layerGroup);
        // Single non-group config
      } else {
        this.processOneGeopackage(listOfLayerEntryConfig[0] as TypeBaseLayerEntryConfig, layerGroup).then((layer) => {
          if (layer) {
            resolve(layer);
          } else {
            this.layerLoadError.push({
              layer: Layer.getLayerPath(listOfLayerEntryConfig[0]),
              consoleMessage: `Unable to create group layer ${Layer.getLayerPath(listOfLayerEntryConfig[0])} on map ${this.mapId}`,
            });
          }
        });
      }
    });

    return promisedListOfLayerEntryProcessed;
  }

  /** ***************************************************************************************************************************
   * Create a source configuration for the vector layer.
   *
   * @param {TypeBaseLayerEntryConfig} layerEntryConfig The layer entry configuration.
   * @param {SourceOptions} sourceOptions The source options (default: {}).
   * @param {ReadOptions} readOptions The read options (default: {}).
   */
  protected extractGeopackageData(
    layerEntryConfig: TypeBaseLayerEntryConfig,
    sourceOptions: SourceOptions = {},
    readOptions: ReadOptions = {}
  ): Promise<[layerData[], sldsInterface]> {
    const promisedGeopackageData = new Promise<[layerData[], sldsInterface]>((resolve) => {
      const url = getLocalizedValue(layerEntryConfig.source!.dataAccessPath!, this.mapId);
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
            var tables = [];

            let stmt = db.prepare(`
            SELECT gpkg_contents.table_name, gpkg_contents.srs_id,
                gpkg_geometry_columns.column_name
            FROM gpkg_contents JOIN gpkg_geometry_columns
            WHERE gpkg_contents.data_type='features' AND
                gpkg_contents.table_name=gpkg_geometry_columns.table_name;
                `);

            while (stmt.step()) {
              const row = stmt.get();
              tables.push({
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

            var format = new FormatWKB();

            // Turn each table's geometries into a vector source
            for (let i = 0; i < tables.length; i++) {
              const vectorSource = new VectorSource(sourceOptions);
              const table = tables[i];
              const tableName = table.table_name;
              const tableDataProjection = `EPSG:${table.srs_id}`;
              const columnName = table.geometry_column_name as string;
              const features: Feature<Geometry>[] = [];
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
                  featureProjection: `EPSG:${api.map(this.mapId).currentProjection}`,
                });
                formattedFeature[0].setProperties(properties);
                features.push(formattedFeature[0]);
              }

              vectorSource.addFeatures(features);
              layersInfo.push({
                name: tableName as string,
                source: vectorSource,
                properties,
              });
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
   * This method creates a GeoView layer using the definition provided in the layerEntryConfig parameter.
   *
   * @param {TypeLayerEntryConfig} layerEntryConfig Information needed to create the GeoView layer.
   * @param {sldsInterface} sld The SLD style associated with the layers geopackage, if any
   *
   * @returns {Promise<BaseLayer | null>} The GeoView base layer that has been created.
   */
  protected processOneGeopackageLayer(
    layerEntryConfig: TypeBaseLayerEntryConfig,
    layerInfo: layerData,
    sld?: sldsInterface
  ): Promise<BaseLayer | null> {
    const promisedVectorLayer = new Promise<BaseLayer | null>((resolve) => {
      const { name, source } = layerInfo;
      // entryType will be group if copied from group parent
      layerEntryConfig.entryType = 'vector';

      // Extract layer styles if they exist
      if (sld && sld[name]) {
        const { rules } = SLDReader.Reader(sld[name]).layers[0].styles[0].featuretypestyles[0];
        if ((layerEntryConfig as TypeVectorLayerEntryConfig).style === undefined)
          (layerEntryConfig as TypeVectorLayerEntryConfig).style = {};

        for (let i = 0; i < rules.length; i++) {
          Object.keys(rules[i]).forEach((key) => {
            // Polygon style
            if (key.toLowerCase() === 'polygonsymbolizer' && !(layerEntryConfig as TypeVectorLayerEntryConfig).style!.Polygon) {
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
              (layerEntryConfig as TypeVectorLayerEntryConfig).style!.Polygon = { styleType: 'simple', settings: styles };
              // LineString style
            } else if (key.toLowerCase() === 'linesymbolizer' && !(layerEntryConfig as TypeVectorLayerEntryConfig).style!.LineString) {
              const lineStyles = rules[i].linesymbolizer[0];

              const stroke: TypeStrokeSymbolConfig = {};
              if (lineStyles.stroke) {
                if (lineStyles.stroke.styling?.stroke) stroke.color = lineStyles.stroke.styling.stroke;
                if (lineStyles.stroke.styling?.strokeWidth) stroke.width = lineStyles.stroke.styling.strokeWidth;
              }

              const styles: TypeLineStringVectorConfig = { type: 'lineString', stroke };
              (layerEntryConfig as TypeVectorLayerEntryConfig).style!.LineString = { styleType: 'simple', settings: styles };
              // Point style
            } else if (key.toLowerCase() === 'pointsymbolizer' && !(layerEntryConfig as TypeVectorLayerEntryConfig).style!.Point) {
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

                  (layerEntryConfig as TypeVectorLayerEntryConfig).style!.Point = { styleType: 'simple', settings: styles };
                }
              }
            }
          });
        }
      }

      if (layerInfo.properties) {
        const { properties } = layerInfo;
        this.processFeatureInfoConfig(properties as TypeJsonObject, layerEntryConfig as TypeVectorLayerEntryConfig);
      }

      const vectorLayer = this.createVectorLayer(layerEntryConfig as TypeVectorLayerEntryConfig, source);
      if (vectorLayer) api.maps[this.mapId].layer.registerLayerConfig(layerEntryConfig);

      resolve(vectorLayer);
    });

    this.registerToLayerSets(layerEntryConfig);

    return promisedVectorLayer;
  }

  /** ***************************************************************************************************************************
   * This method creates all layers from a single geopackage
   *
   * @param {TypeLayerEntryConfig} layerEntryConfig Information needed to create the GeoView layer.
   * @param {LayerGroup} layerGroup Optional layer group for multiple layers.
   *
   * @returns {Promise<BaseLayer | null>} The GeoView base layer that has been created.
   */
  protected processOneGeopackage(layerEntryConfig: TypeBaseLayerEntryConfig, layerGroup?: LayerGroup): Promise<BaseLayer | null> {
    const promisedLayers = new Promise<BaseLayer | LayerGroup | null>((resolve) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      this.extractGeopackageData(layerEntryConfig).then(([layers, slds]) => {
        if (layers.length === 1) {
          if ((layerEntryConfig.source as TypeBaseSourceVectorInitialConfig)?.cluster?.enable) {
            const unclusteredLayerConfig = cloneDeep(layerEntryConfig) as TypeVectorLayerEntryConfig;
            unclusteredLayerConfig.layerId = `${layerEntryConfig.layerId}-unclustered`;
            unclusteredLayerConfig.source!.cluster!.enable = false;

            this.processOneGeopackageLayer(unclusteredLayerConfig as TypeBaseLayerEntryConfig, layers[0], slds).then((baseLayer) => {
              if (baseLayer) {
                baseLayer.setVisible(false);
                if (!layerGroup) layerGroup = this.createLayerGroup(unclusteredLayerConfig.parentLayerConfig as TypeLayerEntryConfig);
                layerGroup.getLayers().push(baseLayer);
              }
            });

            (layerEntryConfig.source as TypeBaseSourceVectorInitialConfig)!.cluster!.settings =
              unclusteredLayerConfig.source!.cluster!.settings;
          }

          this.processOneGeopackageLayer(layerEntryConfig, layers[0], slds).then((baseLayer) => {
            if (baseLayer) {
              if (layerGroup) {
                layerGroup.getLayers().push(baseLayer);
                resolve(layerGroup);
              } else resolve(baseLayer);
            } else {
              this.layerLoadError.push({
                layer: Layer.getLayerPath(layerEntryConfig),
                consoleMessage: `Unable to create layer ${Layer.getLayerPath(layerEntryConfig)} on map ${this.mapId}`,
              });
              resolve(null);
            }
          });
        } else {
          layerEntryConfig.entryType = 'group';
          (layerEntryConfig as TypeLayerEntryConfig).listOfLayerEntryConfig = [];
          const newLayerGroup = this.createLayerGroup(layerEntryConfig);
          for (let i = 0; i < layers.length; i++) {
            const newLayerEntryConfig = cloneDeep(layerEntryConfig) as TypeBaseLayerEntryConfig;
            newLayerEntryConfig.layerId = layers[i].name;
            newLayerEntryConfig.layerName = { en: layers[i].name, fr: layers[i].name };
            newLayerEntryConfig.parentLayerConfig = layerEntryConfig as unknown as TypeLayerGroupEntryConfig;
            if ((newLayerEntryConfig.source as TypeBaseSourceVectorInitialConfig)?.cluster?.enable) {
              const unclusteredLayerConfig = cloneDeep(newLayerEntryConfig) as TypeVectorLayerEntryConfig;
              unclusteredLayerConfig.layerId = `${layerEntryConfig.layerId}-unclustered`;
              unclusteredLayerConfig.source!.cluster!.enable = false;

              this.processOneGeopackageLayer(unclusteredLayerConfig as TypeBaseLayerEntryConfig, layers[0], slds).then((baseLayer) => {
                if (baseLayer) {
                  baseLayer.setVisible(false);
                  newLayerGroup.getLayers().push(baseLayer);
                }
              });

              (newLayerEntryConfig.source as TypeBaseSourceVectorInitialConfig)!.cluster!.settings =
                unclusteredLayerConfig.source!.cluster!.settings;
            }

            this.processOneGeopackageLayer(newLayerEntryConfig, layers[i], slds).then((baseLayer) => {
              if (baseLayer) {
                (layerEntryConfig as unknown as TypeLayerGroupEntryConfig).listOfLayerEntryConfig!.push(newLayerEntryConfig);
                newLayerGroup.getLayers().push(baseLayer);
              } else {
                this.layerLoadError.push({
                  layer: Layer.getLayerPath(layerEntryConfig),
                  consoleMessage: `Unable to create layer ${Layer.getLayerPath(layerEntryConfig)} on map ${this.mapId}`,
                });
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
   * @param {TypeVectorLayerEntryConfig} layerEntryConfig The vector layer entry to configure.
   */
  private processFeatureInfoConfig(fields: TypeJsonObject, layerEntryConfig: TypeVectorLayerEntryConfig) {
    if (!layerEntryConfig.source) layerEntryConfig.source = {};
    if (!layerEntryConfig.source.featureInfo) layerEntryConfig.source.featureInfo = { queryable: true };
    // Process undefined outfields or aliasFields ('' = false and !'' = true). Also, if en is undefined, then fr is also undefined.
    // when en and fr are undefined, we set both en and fr to the same value.
    if (!layerEntryConfig.source.featureInfo.outfields?.en || !layerEntryConfig.source.featureInfo.aliasFields?.en) {
      const processOutField = !layerEntryConfig.source.featureInfo.outfields?.en;
      const processAliasFields = !layerEntryConfig.source.featureInfo.aliasFields?.en;
      if (processOutField) {
        layerEntryConfig.source.featureInfo.outfields = { en: '' };
        layerEntryConfig.source.featureInfo.fieldTypes = '';
      }
      if (processAliasFields) layerEntryConfig.source.featureInfo.aliasFields = { en: '' };

      Object.keys(fields).forEach((fieldEntry) => {
        if (!fields[fieldEntry]) return;
        if (fields[fieldEntry].type === 'Geometry') return;
        if (processOutField) {
          layerEntryConfig.source!.featureInfo!.outfields!.en = `${layerEntryConfig.source!.featureInfo!.outfields!.en}${fieldEntry},`;
          let fieldType: 'string' | 'date' | 'number';
          if (fields[fieldEntry].type === 'date') fieldType = 'date';
          else if (['int', 'number'].includes(fields[fieldEntry].type as string)) fieldType = 'number';
          else fieldType = 'string';
          layerEntryConfig.source!.featureInfo!.fieldTypes = `${layerEntryConfig.source!.featureInfo!.fieldTypes}${fieldType},`;
        }
        layerEntryConfig.source!.featureInfo!.aliasFields!.en = `${layerEntryConfig.source!.featureInfo!.aliasFields!.en}${fieldEntry},`;
      });
      layerEntryConfig.source.featureInfo!.outfields!.en = layerEntryConfig.source.featureInfo!.outfields?.en?.slice(0, -1);
      layerEntryConfig.source.featureInfo!.fieldTypes = layerEntryConfig.source.featureInfo!.fieldTypes?.slice(0, -1);
      layerEntryConfig.source.featureInfo!.aliasFields!.en = layerEntryConfig.source.featureInfo!.aliasFields?.en?.slice(0, -1);
      layerEntryConfig.source!.featureInfo!.outfields!.fr = layerEntryConfig.source!.featureInfo!.outfields?.en;
      layerEntryConfig.source!.featureInfo!.aliasFields!.fr = layerEntryConfig.source!.featureInfo!.aliasFields?.en;
    }
    if (!layerEntryConfig.source.featureInfo.nameField) {
      const en =
        layerEntryConfig.source.featureInfo!.outfields!.en?.split(',')[0] ||
        layerEntryConfig.source.featureInfo!.outfields!.fr?.split(',')[0];
      const fr = en;
      if (en) layerEntryConfig.source.featureInfo.nameField = { en, fr };
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
