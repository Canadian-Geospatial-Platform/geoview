import type { SqlValue } from 'sql.js';
import initSqlJs from 'sql.js';
import * as SLDReader from '@nieuwlandgeo/sldreader';

import type { GeoPackageLayerConfig, TypeFeatureInfoLayerConfig } from '@/api/types/layer-schema-types';
import { CONST_LAYER_ENTRY_TYPES, CONST_LAYER_TYPES } from '@/api/types/layer-schema-types';
import type {
  TypeFillStyle,
  TypeLayerStyleConfig,
  TypeLayerStyleConfigType,
  TypeLineStringVectorConfig,
  TypeOutfields,
  TypePolygonVectorConfig,
  TypeSimpleSymbolVectorConfig,
  TypeStrokeSymbolConfig,
} from '@/api/types/map-schema-types';
import type { TypeWkbLayerConfig } from '@/geo/layer/geoview-layers/vector/wkb';
import { WkbLayerEntryConfig } from '@/api/config/validation-classes/vector-validation-classes/wkb-layer-entry-config';
import { ConfigBaseClass } from '@/api/config/validation-classes/config-base-class';
import { Fetch } from '@/core/utils/fetch-helper';
import { NotSupportedError } from '@/core/exceptions/core-exceptions';
import { Projection } from '@/geo/utils/projection';
import { logger } from '@/core/utils/logger';

interface SldsInterface {
  [key: string | number]: string | number | Uint8Array;
}

export interface GeoPackageFeature {
  geom: Uint8Array<ArrayBufferLike>;
  properties: initSqlJs.ParamsObject | undefined;
}

export interface GeoPackageLayerData {
  name: string;
  dataProjection: string;
  geoPackageFeatures: GeoPackageFeature[];
  styleSld?: string | number | Uint8Array;
}

type TableInfo = {
  tableName: SqlValue;
  srsId?: string;
  geometryColumnName: SqlValue;
};

/**
 * A class to generate a GeoView layer config from a GeoPackage.
 * @exports
 * @class GeoPackageReader
 */
export class GeoPackageReader {
  /**
   * Generates a WKB layer config from a GeoPackage.
   * @param {GeoPackageLayerConfig} layerConfig - the config to convert
   * @param {AbortSignal | undefined} abortSignal - Abort signal to handle cancelling of fetch.
   * @returns {Promise<TypeWkbLayerConfig>} A WKB layer config
   */
  static async createLayerConfigFromGeoPackage(layerConfig: GeoPackageLayerConfig, abortSignal?: AbortSignal): Promise<TypeWkbLayerConfig> {
    // Set up WKB layer config so it can be used in layer entry configs
    const geoviewLayerConfig: TypeWkbLayerConfig = {
      geoviewLayerId: layerConfig.geoviewLayerId,
      geoviewLayerName: layerConfig.geoviewLayerName,
      geoviewLayerType: CONST_LAYER_TYPES.WKB,
      metadataAccessPath: layerConfig.metadataAccessPath,
      initialSettings: layerConfig.initialSettings,
      listOfLayerEntryConfig: [],
    };

    const listOfLayerEntryConfig: WkbLayerEntryConfig[] = [];
    if (layerConfig.listOfLayerEntryConfig?.length) {
      for (let i = 0; i < layerConfig.listOfLayerEntryConfig.length; i++) {
        const layerEntryConfig = layerConfig.listOfLayerEntryConfig[i];

        // Base for URL
        let url = layerEntryConfig.source?.dataAccessPath || layerConfig.metadataAccessPath;

        // Append layerId to URL if not pointing to blob or .gpkg
        const isBlob = url.startsWith('blob') && !url.endsWith('/');
        const isGpkg = url.toLowerCase().endsWith('.gpkg');

        if (!isBlob && !isGpkg) {
          const endsWithSlash = url.endsWith('/');
          url = endsWithSlash ? `${url}${layerEntryConfig.layerId}` : `${url}/${layerEntryConfig.layerId}`;
        }

        // Read the GeoPackage
        // eslint-disable-next-line no-await-in-loop
        const layersData = await GeoPackageReader.#getGeoPackageData(url, abortSignal);

        // Compile sublayer entry configs from the list of layer entry configs
        const listOfSubLayerEntryConfig: WkbLayerEntryConfig[] = [];
        if (layerEntryConfig.listOfLayerEntryConfig?.length) {
          layerEntryConfig.listOfLayerEntryConfig.forEach((sublayerEntryConfig) => {
            // Find layer data for the sublayer
            const matchingLayerData = layersData.find((layerData) => layerData.name === sublayerEntryConfig.layerId);
            if (matchingLayerData) {
              const { layerId } = sublayerEntryConfig;
              const layerName = ConfigBaseClass.getClassOrTypeLayerName(sublayerEntryConfig);
              listOfSubLayerEntryConfig.push(
                new WkbLayerEntryConfig({
                  geoviewLayerConfig,
                  initialSettings: ConfigBaseClass.getClassOrTypeInitialSettings(sublayerEntryConfig),
                  layerId,
                  layerName: layerName || matchingLayerData.name,
                  layerStyle: matchingLayerData.styleSld ? GeoPackageReader.#processGeopackageStyle(matchingLayerData.styleSld) : undefined,
                  schemaTag: CONST_LAYER_TYPES.WKB,
                  entryType: CONST_LAYER_ENTRY_TYPES.VECTOR,
                  source: {
                    dataAccessPath: url,
                    dataProjection: matchingLayerData.dataProjection || Projection.PROJECTION_NAMES.LONLAT,
                    format: 'WKB',
                    featureInfo:
                      layerEntryConfig.source?.featureInfo ||
                      GeoPackageReader.#processFeatureInfoConfig(matchingLayerData.geoPackageFeatures[0].properties),
                    geoPackageFeatures: matchingLayerData.geoPackageFeatures,
                  },
                })
              );
            } else {
              // If no matching layer data, log error
              logger.logError(`No entry in GeoPackage matches ID ${sublayerEntryConfig.layerId}`);
            }
          });
        } else {
          // No sub layer entry configs, add all layers from GeoPackage
          layersData.forEach((layerData) => {
            const { layerId } = layerEntryConfig;
            const layerName = ConfigBaseClass.getClassOrTypeLayerName(layerEntryConfig);
            listOfSubLayerEntryConfig.push(
              new WkbLayerEntryConfig({
                geoviewLayerConfig,
                // If there is only one layer in the GeoPackage, use the ID and name from the layer entry config for it
                layerId: layersData.length === 1 ? layerId : layerData.name,
                layerName: layersData.length === 1 ? layerName : layerData.name,
                layerStyle: layerData.styleSld ? GeoPackageReader.#processGeopackageStyle(layerData.styleSld) : undefined,
                schemaTag: CONST_LAYER_TYPES.WKB,
                entryType: CONST_LAYER_ENTRY_TYPES.VECTOR,
                source: {
                  dataAccessPath: url,
                  dataProjection: layerData.dataProjection || Projection.PROJECTION_NAMES.LONLAT,
                  format: 'WKB',
                  featureInfo:
                    layerEntryConfig.source?.featureInfo ||
                    GeoPackageReader.#processFeatureInfoConfig(layerData.geoPackageFeatures[0].properties),
                  geoPackageFeatures: layerData.geoPackageFeatures,
                },
              })
            );
          });
        }

        // When the GeoPackage contains more than one layer, and we have multiple layer entry configs, we need a group layer
        if (layerConfig.listOfLayerEntryConfig.length > 1 && listOfSubLayerEntryConfig.length > 1) {
          const layerName = ConfigBaseClass.getClassOrTypeLayerName(layerEntryConfig);
          listOfLayerEntryConfig.push({
            geoviewLayerConfig,
            layerId: layerEntryConfig.layerId,
            layerName: layerName || layerEntryConfig.layerId,
            entryType: 'group',
            listOfLayerEntryConfig: listOfSubLayerEntryConfig,
          } as unknown as WkbLayerEntryConfig);
        } else listOfLayerEntryConfig.push(...listOfSubLayerEntryConfig);
      }
    } else {
      // No layer entry configs, we are just attempting to load from the metadataAccessPath
      const layersData = await GeoPackageReader.#getGeoPackageData(layerConfig.metadataAccessPath, abortSignal);
      layersData.forEach((layerData) => {
        listOfLayerEntryConfig.push(
          new WkbLayerEntryConfig({
            geoviewLayerConfig,
            layerId: layerData.name,
            layerName: layersData.length === 1 ? geoviewLayerConfig.geoviewLayerName || layerData.name : layerData.name,
            layerStyle: layerData.styleSld ? GeoPackageReader.#processGeopackageStyle(layerData.styleSld) : undefined,
            schemaTag: CONST_LAYER_TYPES.WKB,
            entryType: CONST_LAYER_ENTRY_TYPES.VECTOR,
            source: {
              dataAccessPath: layerConfig.metadataAccessPath,
              dataProjection: layerData.dataProjection || Projection.PROJECTION_NAMES.LONLAT,
              format: 'WKB',
              featureInfo: GeoPackageReader.#processFeatureInfoConfig(layerData.geoPackageFeatures[0].properties),
              geoPackageFeatures: layerData.geoPackageFeatures,
            },
          })
        );
      });
    }

    geoviewLayerConfig.listOfLayerEntryConfig = listOfLayerEntryConfig;
    return geoviewLayerConfig;
  }

  /**
   * Fetches a GeoPackage and creates layer data from it.
   * @param {string} url - The URL of the GeoPackage.
   * @param {AbortSignal | undefined} abortSignal - Abort signal to handle cancelling of fetch.
   * @returns {Promise<LayerData[]>} Promise of the layer data.
   * @private
   */
  static async #getGeoPackageData(url: string, abortSignal?: AbortSignal): Promise<GeoPackageLayerData[]> {
    // Load the GeoPackage and SqlJs at the same time
    const promises = [
      Fetch.fetchArrayBuffer(url, { signal: abortSignal }),
      initSqlJs({
        locateFile: (file) => `https://sql.js.org/dist/${file}`,
      }),
    ];
    const [arrayBufferResponse, SQL] = await Promise.all(promises);

    // Load GeoPackage into a database
    const db = new (SQL as initSqlJs.SqlJsStatic).Database(new Uint8Array(arrayBufferResponse as ArrayBuffer));

    // Arrays to add feature information and style to
    const layersData: GeoPackageLayerData[] = [];
    const styleSlds: SldsInterface = {};

    // Get all feature tables
    let stmt = db.prepare(`
              SELECT gpkg_contents.table_name, gpkg_contents.srs_id, gpkg_geometry_columns.column_name
              FROM gpkg_contents
              JOIN gpkg_geometry_columns
                ON gpkg_contents.table_name = gpkg_geometry_columns.table_name
              WHERE gpkg_contents.data_type = 'features';
            `);

    // Get the names and projection from each table
    const tables: TableInfo[] = [];
    while (stmt.step()) {
      const row = stmt.get();
      tables.push({
        tableName: row[0],
        srsId: row[1]?.toString(),
        geometryColumnName: row[2],
      });
    }

    try {
      // Load layer_styles table if present
      stmt = db.prepare(`SELECT f_table_name, styleSLD FROM layer_styles`);
      while (stmt.step()) {
        const [tableName, sld] = stmt.get();
        if (sld) styleSlds[tableName as string] = sld as string;
      }
    } catch (error) {
      logger.logError(error);
    }

    // Process each feature table
    for (const { tableName, srsId, geometryColumnName } of tables) {
      const dataProjection = `EPSG:${srsId}`;
      const geoPackageFeatures: { geom: Uint8Array<ArrayBufferLike>; properties: initSqlJs.ParamsObject | undefined }[] = [];

      stmt = db.prepare(`SELECT * FROM '${tableName}'`);
      while (stmt.step()) {
        const row = stmt.getAsObject();
        const geomBuffer = GeoPackageReader.#parseGpkgGeom(row[geometryColumnName as string] as Uint8Array);
        geoPackageFeatures.push({ geom: geomBuffer, properties: row });
        delete row[geometryColumnName as string];
      }

      layersData.push({
        name: tableName as string,
        dataProjection,
        geoPackageFeatures,
        styleSld: styleSlds[tableName as string] || undefined,
      });
    }

    db.close();
    return layersData;
  }

  /**
   * Creates a GeoView style config from the provided SLD style.
   * @param {string | number | Uint8Array} sld - The SLD style associated with the layer
   * @returns {TypeLayerStyleConfig} The created style config
   * @private
   */
  static #processGeopackageStyle(sld: string | number | Uint8Array): TypeLayerStyleConfig {
    // Extract layer styles if they exist
    const { rules } = SLDReader.Reader(sld).layers[0].styles[0].featuretypestyles[0];
    const layerStyle: TypeLayerStyleConfig = {};

    // Convert styles to geoview styles
    for (let i = 0; i < rules.length; i++) {
      const styleInfo = rules[i];

      Object.keys(styleInfo).forEach((key) => {
        // Polygon style
        if (key.toLowerCase() === 'polygonsymbolizer') {
          // Create the polygon layer style settings if it is not already created
          if (!layerStyle.Polygon) {
            let type: TypeLayerStyleConfigType = 'simple';
            if (styleInfo.name !== 'Single symbol' && styleInfo.filter?.operator === 'propertyisequalto') type = 'uniqueValue';
            else if (styleInfo.name !== 'Single symbol') type = 'classBreaks';

            layerStyle.Polygon = {
              type,
              fields: [styleInfo.filter?.predicates?.[0]?.expression1?.value || styleInfo.filter?.expression1?.value || null],
              hasDefault: false,
              info: [],
            };
          }

          const polyStyles = styleInfo.polygonsymbolizer[0];
          let color: string | undefined;
          let graphicSize: number | undefined;
          let patternWidth: number | undefined;
          let fillStyle: TypeFillStyle | undefined;
          if (polyStyles.fill?.styling?.fill) color = polyStyles.fill.styling.fill;

          const stroke: TypeStrokeSymbolConfig = {};
          if (polyStyles.stroke) {
            if (polyStyles.stroke.styling?.stroke) stroke.color = polyStyles.stroke.styling.stroke;
            if (polyStyles.stroke.styling?.strokeDasharray) stroke.lineDash = polyStyles.stroke.styling.strokeDasharray.split(' ');
            if (polyStyles.stroke.styling?.strokeLinecap) stroke.lineCap = polyStyles.stroke.styling.strokeLinecap;
            if (polyStyles.stroke.styling?.strokeLinejoin) stroke.lineJoin = polyStyles.stroke.styling.strokeLinejoin;
            if (polyStyles.stroke.styling?.strokeWidth) stroke.width = polyStyles.stroke.styling.strokeWidth;
          }

          if (polyStyles.fill?.graphicfill) {
            if (polyStyles.fill.graphicfill.graphic?.mark?.stroke) {
              if (polyStyles.fill.graphicfill.graphic.mark.stroke.styling?.stroke)
                stroke.color = polyStyles.fill.graphicfill.graphic.mark.stroke.styling.stroke;
              if (polyStyles.fill.graphicfill.graphic.mark.stroke.styling?.strokeWidth)
                stroke.width = polyStyles.fill.graphicfill.graphic.mark.stroke.styling.strokeWidth;
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
            patternSize: graphicSize || 8,
            patternWidth: patternWidth || 1,
            fillStyle: fillStyle || 'solid',
          };

          // Get values according to style type
          let values: number[] = [];
          if (layerStyle.Polygon.type === 'classBreaks' && styleInfo.filter?.predicates?.length) {
            if (styleInfo.filter.predicates.length === 2) {
              values = [styleInfo.filter.predicates[0].expression2 as number, styleInfo.filter.predicates[1].expression2 as number];
            } else if (styleInfo.filter.predicates.length === 1) {
              if (
                styleInfo.filter.predicates[0].operator === 'propertyislessthan' ||
                styleInfo.filter.predicates[0].operator === 'propertyislessthanorequalto'
              )
                values = [0, styleInfo.filter.predicates[0].expression2 as number];
              if (
                styleInfo.filter.predicates[0].operator === 'propertyisgreaterthan' ||
                styleInfo.filter.predicates[0].operator === 'propertyisgreaterthanorequalto'
              )
                values = [styleInfo.filter.predicates[0].expression2 as number];
            }
          } else if (layerStyle.Polygon.type === 'classBreaks' && styleInfo.filter?.expression2)
            values = [styleInfo.filter.expression2 as number];

          const label = styleInfo.name === 'Single symbol' ? '' : styleInfo.filter?.expression2 || styleInfo.name || '';

          // Build out info and push to polygon style
          const info = {
            visible: true,
            label,
            values,
            settings: styles,
          };

          layerStyle.Polygon.info.push(info);
        } else if (key.toLowerCase() === 'linesymbolizer') {
          // Create the line string layer style settings if it is not already created
          if (!layerStyle.LineString) {
            let type: TypeLayerStyleConfigType = 'simple';
            if (styleInfo.name !== 'Single symbol' && styleInfo.filter?.operator === 'propertyisequalto') type = 'uniqueValue';
            else if (styleInfo.name !== 'Single symbol') type = 'classBreaks';

            layerStyle.LineString = {
              type,
              fields: styleInfo.filter?.expression1?.value ? [styleInfo.filter.expression1.value] : [],
              hasDefault: false,
              info: [],
            };
          }

          const lineStyles = styleInfo.linesymbolizer[0];

          const stroke: TypeStrokeSymbolConfig = {};
          if (lineStyles.stroke) {
            if (lineStyles.stroke.styling?.stroke) stroke.color = lineStyles.stroke.styling.stroke;
            if (lineStyles.stroke.styling?.strokeDasharray) stroke.lineDash = lineStyles.stroke.styling.strokeDasharray.split(' ');
            if (lineStyles.stroke.styling?.strokeLinecap) stroke.lineCap = lineStyles.stroke.styling.strokeLinecap;
            if (lineStyles.stroke.styling?.strokeLinejoin) stroke.lineJoin = lineStyles.stroke.styling.strokeLinejoin;
            if (lineStyles.stroke.styling?.strokeWidth) stroke.width = lineStyles.stroke.styling.strokeWidth;
          }

          const styles: TypeLineStringVectorConfig = { type: 'lineString', stroke };

          let values: number[] = [];
          if (layerStyle.LineString.type === 'classBreaks' && styleInfo.filter?.predicates?.length) {
            if (styleInfo.filter.predicates.length === 2) {
              values = [styleInfo.filter.predicates[0].expression2 as number, styleInfo.filter.predicates[1].expression2 as number];
            } else if (styleInfo.filter.predicates.length === 1) {
              if (
                styleInfo.filter.predicates[0].operator === 'propertyislessthan' ||
                styleInfo.filter.predicates[0].operator === 'propertyislessthanorequalto'
              )
                values = [0, styleInfo.filter.predicates[0].expression2 as number];
              if (
                styleInfo.filter.predicates[0].operator === 'propertyisgreaterthan' ||
                styleInfo.filter.predicates[0].operator === 'propertyisgreaterthanorequalto'
              )
                values = [styleInfo.filter.predicates[0].expression2 as number];
            }
          } else if (layerStyle.LineString.type === 'classBreaks' && styleInfo.filter?.expression2)
            values = [styleInfo.filter.expression2 as number];

          const label = styleInfo.name === 'Single symbol' ? '' : styleInfo.filter?.expression2 || styleInfo.name || '';

          // Build out info and push to polygon style
          const info = {
            visible: true,
            label,
            values,
            settings: styles,
          };

          layerStyle.LineString.info.push(info);
        } else if (key.toLowerCase() === 'pointsymbolizer') {
          // Create the point layer style settings if it is not already created
          if (!layerStyle.Point) {
            let type: TypeLayerStyleConfigType = 'simple';
            if (styleInfo.name !== 'Single symbol' && styleInfo.filter?.operator === 'propertyisequalto') type = 'uniqueValue';
            else if (styleInfo.name !== 'Single symbol') type = 'classBreaks';

            layerStyle.Point = {
              type,
              fields: styleInfo.filter?.expression1?.value ? [styleInfo.filter.expression1.value] : [],
              hasDefault: false,
              info: [],
            };
          }
          const { graphic } = styleInfo.pointsymbolizer[0];

          let offset: [number, number] | null = null;

          if (graphic.displacement) {
            offset = [
              graphic.displacement.displacementx ? graphic.displacement.displacementx : 0,
              graphic.displacement.displacementx ? graphic.displacement.displacementx : 0,
            ];
          }

          const { size, rotation } = graphic;

          if (graphic.mark) {
            let color: string | null = null;
            if (graphic.mark.fill?.styling?.fill) color = graphic.mark.fill.styling.fill;
            if (graphic.mark.wellknownname) {
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
                if (graphic.mark.stroke.styling?.strokeDasharray) stroke.lineDash = graphic.mark.stroke.styling.strokeWidth.split(' ');
                if (graphic.mark.stroke.styling?.strokeLinecap) stroke.lineCap = graphic.mark.stroke.styling.strokeLinecap;
                if (graphic.mark.stroke.styling?.strokeLinejoin) stroke.lineJoin = graphic.mark.stroke.styling.strokeLinejoin;
                if (graphic.mark.stroke.styling?.strokeWidth) stroke.width = graphic.mark.stroke.styling.strokeWidth;
              }

              let values: number[] = [];
              if (layerStyle.Point.type === 'classBreaks' && styleInfo.filter?.predicates?.length) {
                if (styleInfo.filter.predicates.length === 2) {
                  values = [styleInfo.filter.predicates[0].expression2 as number, styleInfo.filter.predicates[1].expression2 as number];
                } else if (styleInfo.filter.predicates.length === 1) {
                  if (
                    styleInfo.filter.predicates[0].operator === 'propertyislessthan' ||
                    styleInfo.filter.predicates[0].operator === 'propertyislessthanorequalto'
                  )
                    values = [0, styleInfo.filter.predicates[0].expression2 as number];
                  if (
                    styleInfo.filter.predicates[0].operator === 'propertyisgreaterthan' ||
                    styleInfo.filter.predicates[0].operator === 'propertyisgreaterthanorequalto'
                  )
                    values = [styleInfo.filter.predicates[0].expression2 as number];
                }
              } else if (layerStyle.Point.type === 'classBreaks' && styleInfo.filter?.expression2)
                values = [styleInfo.filter.expression2 as number];

              const label = styleInfo.name === 'Single symbol' ? '' : styleInfo.filter?.expression2 || styleInfo.name || '';

              // Build out info and push to polygon style
              const info = {
                visible: true,
                label,
                values,
                settings: styles,
              };

              layerStyle.Point.info.push(info);
            }
          }
        }
      });
    }

    return layerStyle;
  }

  /**
   * Creates a feature info config from provided fields.
   * @param {initSqlJs.ParamsObject | undefined} fields An array of field names and its aliases.
   * @returns {TypeFeatureInfoLayerConfig} The feature info config.
   * @private
   */
  static #processFeatureInfoConfig(fields: initSqlJs.ParamsObject | undefined): TypeFeatureInfoLayerConfig {
    if (!fields) return { queryable: false };

    const featureInfo: TypeFeatureInfoLayerConfig = { queryable: true };

    // Process undefined outfields or aliasFields
    const outfields: TypeOutfields[] = [];

    Object.keys(fields).forEach((fieldEntryKey) => {
      if (!fields[fieldEntryKey]) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fieldEntry = fields[fieldEntryKey] as any;
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

      outfields.push(newOutfield);
    });

    if (outfields.length) {
      // Set name field to first value
      featureInfo.nameField = outfields[0].name;
      featureInfo.outfields = outfields;
    } else featureInfo.queryable = false;

    return featureInfo;
  }

  /**
   * Create a source configuration for the vector layer.
   * @param {Uint8Array} gpkgBinGeom - Binary geometry array to be parsed.
   * @returns {Uint8Array} A subarray of inputted binary geometry array.
   */
  static #parseGpkgGeom(gpkgBinGeom: Uint8Array): Uint8Array {
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
        throw new NotSupportedError('Invalid geometry envelope size flag in GeoPackage');
    }
    return gpkgBinGeom.subarray(envelopeSize + 8);
  }
}
