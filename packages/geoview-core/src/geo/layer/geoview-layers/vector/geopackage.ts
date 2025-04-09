import { Options as SourceOptions } from 'ol/source/Vector';
import { WKB as FormatWKB } from 'ol/format';
import { ReadOptions } from 'ol/format/Feature';
import { Vector as VectorSource } from 'ol/source';
import BaseLayer from 'ol/layer/Base';
import LayerGroup from 'ol/layer/Group';
import { Feature } from 'ol';

import initSqlJs, { SqlValue } from 'sql.js';
import * as SLDReader from '@nieuwlandgeo/sldreader';

import { Cast, TypeJsonObject } from '@/core/types/global-types';
import { CONST_LAYER_TYPES } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { AbstractGeoViewVector } from '@/geo/layer/geoview-layers/vector/abstract-geoview-vector';
import {
  TypeLayerEntryConfig,
  TypeVectorSourceInitialConfig,
  TypeGeoviewLayerConfig,
  TypeSimpleSymbolVectorConfig,
  TypeStrokeSymbolConfig,
  TypeLineStringVectorConfig,
  TypePolygonVectorConfig,
  TypeFillStyle,
  CONST_LAYER_ENTRY_TYPES,
} from '@/geo/map/map-schema-types';
import { GeoPackageLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-validation-classes/geopackage-layer-config-entry';
import { AbstractBaseLayerEntryConfig } from '@/core/utils/config/validation-classes/abstract-base-layer-entry-config';
import { VectorLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-layer-entry-config';
import { GroupLayerEntryConfig } from '@/core/utils/config/validation-classes/group-layer-entry-config';
import { logger } from '@/core/utils/logger';
import { TypeOutfields } from '@/api/config/types/map-schema-types';

export interface TypeSourceGeoPackageInitialConfig extends TypeVectorSourceInitialConfig {
  format: 'GeoPackage';
}

export interface TypeGeoPackageLayerConfig extends Omit<TypeGeoviewLayerConfig, 'listOfLayerEntryConfig' | 'geoviewLayerType'> {
  geoviewLayerType: typeof CONST_LAYER_TYPES.GEOPACKAGE;
  listOfLayerEntryConfig: GeoPackageLayerEntryConfig[];
}

interface SldsInterface {
  [key: string | number]: string | number | Uint8Array;
}

interface LayerData {
  name: string;
  source: VectorSource<Feature>;
  properties: initSqlJs.ParamsObject | undefined;
}

type TableInfo = {
  table_name: SqlValue;
  srs_id?: string;
  geometry_column_name: SqlValue;
};

/**
 * A class to add GeoPackage api feature layer.
 *
 * @exports
 * @class GeoPackage
 */
export class GeoPackage extends AbstractGeoViewVector {
  /**
   * Constructs a GeoPackage Layer configuration processor.
   *
   * @param {string} mapId the id of the map
   * @param {TypeGeoPackageFeatureLayerConfig} layerConfig the layer configuration
   */
  constructor(mapId: string, layerConfig: TypeGeoPackageLayerConfig) {
    super(CONST_LAYER_TYPES.GEOPACKAGE, layerConfig, mapId);
  }

  /**
   * Create a source configuration for the vector layer.
   *
   * @param {AbstractBaseLayerEntryConfig} layerConfig The layer entry configuration.
   * @param {SourceOptions} sourceOptions The source options (default: {}).
   * @param {ReadOptions} readOptions The read options (default: {}).
   */
  protected extractGeopackageData(
    layerConfig: AbstractBaseLayerEntryConfig,
    sourceOptions: SourceOptions<Feature> = {},
    readOptions: ReadOptions = {}
  ): Promise<[LayerData[], SldsInterface]> {
    const promisedGeopackageData = new Promise<[LayerData[], SldsInterface]>((resolve) => {
      const url = layerConfig.source!.dataAccessPath!;
      const attributions = this.getAttributions();
      // eslint-disable-next-line no-param-reassign
      if (attributions.length > 0) sourceOptions.attributions = attributions;
      const layersInfo: LayerData[] = [];
      const styleSlds: SldsInterface = {};

      const xhr = new XMLHttpRequest();
      xhr.responseType = 'arraybuffer';

      initSqlJs({
        locateFile: (file) => `https://sql.js.org/dist/${file}`,
      })
        .then((SQL) => {
          xhr.open('GET', url as string);
          xhr.onload = () => {
            if (xhr.status === 200) {
              const db = new SQL.Database(new Uint8Array(xhr.response as ArrayBuffer));
              const tables: TableInfo[] = [];

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
                  const feature = GeoPackage.parseGpkgGeom(geomProp);
                  const formattedFeature = format.readFeatures(feature, {
                    ...readOptions,
                    dataProjection: tableDataProjection,
                    featureProjection: this.getMapViewer().getProjection().getCode(),
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
              }

              db.close();
              resolve([layersInfo, styleSlds]);
            }
          };
          xhr.send();
        })
        .catch((error) => {
          // Log
          logger.logPromiseFailed('initSqlJs in extractGeopackageData in GeoPackage', error);
        });
    });

    return promisedGeopackageData;
  }

  /**
   * This method creates a GeoView layer using the definition provided in the layerConfig parameter.
   *
   * @param {AbstractBaseLayerEntryConfig} layerConfig Information needed to create the GeoView layer.
   * @param {string | number | Uint8Array} sld The SLD style associated with the layer
   */
  protected static processGeopackageStyle(layerConfig: AbstractBaseLayerEntryConfig, sld: string | number | Uint8Array): void {
    // Extract layer styles if they exist
    const { rules } = SLDReader.Reader(sld).layers[0].styles[0].featuretypestyles[0];
    // eslint-disable-next-line no-param-reassign
    if ((layerConfig as VectorLayerEntryConfig).layerStyle === undefined) (layerConfig as VectorLayerEntryConfig).layerStyle = {};

    for (let i = 0; i < rules.length; i++) {
      Object.keys(rules[i]).forEach((key) => {
        // Polygon style
        if (key.toLowerCase() === 'polygonsymbolizer' && !(layerConfig as VectorLayerEntryConfig).layerStyle!.Polygon) {
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
          // eslint-disable-next-line no-param-reassign
          layerConfig.layerStyle!.Polygon = {
            type: 'simple',
            fields: [],
            hasDefault: false,
            info: [{ visible: true, label: '', values: [], settings: styles }],
          };
          // LineString style
        } else if (key.toLowerCase() === 'linesymbolizer' && !(layerConfig as VectorLayerEntryConfig).layerStyle!.LineString) {
          const lineStyles = rules[i].linesymbolizer[0];

          const stroke: TypeStrokeSymbolConfig = {};
          if (lineStyles.stroke) {
            if (lineStyles.stroke.styling?.stroke) stroke.color = lineStyles.stroke.styling.stroke;
            if (lineStyles.stroke.styling?.strokeWidth) stroke.width = lineStyles.stroke.styling.strokeWidth;
          }

          const styles: TypeLineStringVectorConfig = { type: 'lineString', stroke };
          // eslint-disable-next-line no-param-reassign
          (layerConfig as VectorLayerEntryConfig).layerStyle!.LineString = {
            type: 'simple',
            fields: [],
            hasDefault: false,
            info: [{ visible: true, label: '', values: [], settings: styles }],
          };
          // Point style
        } else if (key.toLowerCase() === 'pointsymbolizer' && !(layerConfig as VectorLayerEntryConfig).layerStyle!.Point) {
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

              // eslint-disable-next-line no-param-reassign
              (layerConfig as VectorLayerEntryConfig).layerStyle!.Point = {
                type: 'simple',
                fields: [],
                hasDefault: false,
                info: [{ visible: true, label: '', values: [], settings: styles }],
              };
            }
          }
        }
      });
    }
  }

  /**
   * This method creates a GeoView layer using the definition provided in the layerConfig parameter.
   *
   * @param {AbstractLayerEntryConfig} layerConfig Information needed to create the GeoView layer.
   * @param {sldsInterface} sld The SLD style associated with the layers geopackage, if any
   *
   * @returns {Promise<BaseLayer | undefined>} The GeoView base layer that has been created.
   */
  protected processOneGeopackageLayer(
    layerConfig: AbstractBaseLayerEntryConfig,
    layerInfo: LayerData,
    sld?: SldsInterface
  ): Promise<BaseLayer | undefined> {
    // FIXME: Temporary patch to keep the behavior until those layer classes don't exist
    this.getMapViewer().layer.registerLayerConfigInit(layerConfig);

    const { name, source } = layerInfo;

    // Extract layer styles if they exist
    if (sld && sld[name]) {
      GeoPackage.processGeopackageStyle(layerConfig, sld[name]);
    }

    if (layerInfo.properties) {
      const { properties } = layerInfo;
      GeoPackage.#processFeatureInfoConfig(properties as TypeJsonObject, layerConfig as VectorLayerEntryConfig);
    }

    const vectorLayer = this.createVectorLayer(layerConfig as VectorLayerEntryConfig, source);

    // Set the layer status to processed
    layerConfig.setLayerStatusProcessed();

    return Promise.resolve(vectorLayer);
  }

  /**
   * Overrides the way the layer entry is processed to generate an Open Layer Base Layer object.
   * @param {AbstractBaseLayerEntryConfig} layerConfig - The layer entry config needed to create the Open Layer object.
   * @param {LayerGroup} layerGroup Optional layer group for multiple layers.
   * @returns {Promise<BaseLayer>} The GeoView base layer that has been created.
   */
  protected override onProcessOneLayerEntry(layerConfig: AbstractBaseLayerEntryConfig, layerGroup?: LayerGroup): Promise<BaseLayer> {
    // TODO: Refactor - This function implementation needs revision, because it doesn't return a single 'BaseLayer', it can
    // TO.DOCONT: create more than one layer which seems to differ from the other layer classes.

    // Prepare a promise
    const promisedLayers = new Promise<BaseLayer>((resolve, reject) => {
      this.extractGeopackageData(layerConfig)
        .then(async ([layers, slds]) => {
          if (layers.length === 1) {
            this.processOneGeopackageLayer(layerConfig, layers[0], slds)
              .then((baseLayer) => {
                if (baseLayer) {
                  // Set the layer status to processed
                  layerConfig.setLayerStatusProcessed();

                  if (layerGroup) layerGroup.getLayers().push(baseLayer);
                  resolve(layerGroup || baseLayer);
                } else {
                  // Add a layer load error
                  this.addLayerLoadError(layerConfig, `Unable to create layer ${layerConfig.layerPath} on map ${this.mapId}`);
                  reject();
                }
              })
              .catch((error) => {
                // Log
                logger.logPromiseFailed('processOneGeopackageLayer (1) in processOneLayerEntry in GeoPackage', error);
                reject();
              });
          } else {
            // eslint-disable-next-line no-param-reassign
            layerConfig.entryType = CONST_LAYER_ENTRY_TYPES.GROUP;
            // eslint-disable-next-line no-param-reassign
            (layerConfig as TypeLayerEntryConfig).listOfLayerEntryConfig = [];
            const newLayerGroup = this.createLayerGroup(layerConfig, layerConfig.initialSettings!);

            // For each layer
            const promises: Promise<BaseLayer>[] = [];
            for (let i = 0; i < layers.length; i++) {
              promises.push(
                new Promise<BaseLayer>((resolve2, reject2) => {
                  // "Clone" the config, patch until that layer type logic is rebuilt
                  const newLayerEntryConfig = layerConfig.clone() as AbstractBaseLayerEntryConfig;
                  newLayerEntryConfig.layerId = layers[i].name;
                  newLayerEntryConfig.layerName = layers[i].name;
                  newLayerEntryConfig.entryType = CONST_LAYER_ENTRY_TYPES.VECTOR;
                  newLayerEntryConfig.parentLayerConfig = Cast<GroupLayerEntryConfig>(layerConfig);

                  this.processOneGeopackageLayer(newLayerEntryConfig, layers[i], slds)
                    .then((baseLayer) => {
                      if (baseLayer) {
                        (layerConfig as unknown as GroupLayerEntryConfig).listOfLayerEntryConfig!.push(newLayerEntryConfig);
                        newLayerGroup.getLayers().push(baseLayer);

                        // Set the layer status to processed
                        layerConfig.setLayerStatusProcessed();

                        resolve2(baseLayer);
                      } else {
                        // Add a layer load error
                        this.addLayerLoadError(layerConfig, `Unable to create layer ${layerConfig.layerPath} on map ${this.mapId}`);
                        reject2();
                      }
                    })
                    .catch((error) => {
                      // Log
                      logger.logPromiseFailed('processOneGeopackageLayer (2) in processOneLayerEntry in GeoPackage', error);

                      // Set the layer status to error
                      layerConfig.setLayerStatusError();
                      reject2();
                    });
                })
              );
            }

            // Wait for all layer to be resolved
            await Promise.all(promises);

            // Resolve the OpenLayer layer
            resolve(newLayerGroup);
          }
        })
        .catch((error) => {
          // Log
          logger.logPromiseFailed('extractGeopackageData in processOneLayerEntry in GeoPackage', error);

          // Set the layer status to error
          layerConfig.setLayerStatusError();
          reject();
        });
    });

    return promisedLayers;
  }

  /**
   * This method sets the outfields and aliasFields of the source feature info.
   *
   * @param {TypeJsonArray} fields An array of field names and its aliases.
   * @param {VectorLayerEntryConfig} layerConfig The vector layer entry to configure.
   * @private
   */
  static #processFeatureInfoConfig(fields: TypeJsonObject, layerConfig: VectorLayerEntryConfig): void {
    // eslint-disable-next-line no-param-reassign
    if (!layerConfig.source) layerConfig.source = {};
    // eslint-disable-next-line no-param-reassign
    if (!layerConfig.source.featureInfo) layerConfig.source.featureInfo = { queryable: true };

    // Process undefined outfields or aliasFields
    if (!layerConfig.source.featureInfo.outfields?.length) {
      // eslint-disable-next-line no-param-reassign
      if (!layerConfig.source.featureInfo.outfields) layerConfig.source.featureInfo.outfields = [];

      Object.keys(fields).forEach((fieldEntryKey) => {
        if (!fields[fieldEntryKey]) return;

        const fieldEntry = fields[fieldEntryKey];
        if (fieldEntry.type === 'Geometry') return;

        let fieldType = 'string';
        if (fieldEntry.type === 'date') fieldType = 'date';
        else if (['bigint', 'number'].includes(typeof fieldEntry)) fieldType = 'number';

        const newOutfield: TypeOutfields = {
          name: fieldEntryKey,
          alias: fieldEntryKey,
          type: fieldType as 'string' | 'number' | 'date',
          domain: null,
        };
        layerConfig.source!.featureInfo!.outfields!.push(newOutfield);
      });
    }

    layerConfig.source.featureInfo!.outfields.forEach((outfield) => {
      // eslint-disable-next-line no-param-reassign
      if (!outfield.alias) outfield.alias = outfield.name;
    });

    // Set name field to first value
    if (!layerConfig.source.featureInfo.nameField)
      // eslint-disable-next-line no-param-reassign
      layerConfig.source.featureInfo.nameField = layerConfig.source.featureInfo!.outfields[0].name;
  }

  /**
   * Create a source configuration for the vector layer.
   *
   * @param {Uint8Array} gpkgBinGeom Binary geometry array to be parsed.
   *
   * @returns {Uint8Array} Uint8Array Subarray of inputted binary geoametry array.
   */
  protected static parseGpkgGeom(gpkgBinGeom: Uint8Array): Uint8Array {
    const flags = gpkgBinGeom[3];
    // eslint-disable-next-line no-bitwise
    const eFlags: number = (flags >> 1) & 7;
    let envelopeSize: number;
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

/**
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

/**
 * type guard function that redefines a TypeLayerEntryConfig as a GeoPackageLayerEntryConfig if the geoviewLayerType attribute
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
): verifyIfGeoViewEntry is GeoPackageLayerEntryConfig => {
  return verifyIfGeoViewEntry?.geoviewLayerConfig?.geoviewLayerType === CONST_LAYER_TYPES.GEOPACKAGE;
};
