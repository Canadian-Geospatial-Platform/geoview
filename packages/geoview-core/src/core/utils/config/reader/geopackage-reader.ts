import initSqlJs, { SqlValue } from 'sql.js';
import * as SLDReader from '@nieuwlandgeo/sldreader';

import {
  CONST_LAYER_ENTRY_TYPES,
  CONST_LAYER_TYPES,
  GeoPackageLayerConfig,
  TypeFeatureInfoLayerConfig,
  TypeFillStyle,
  TypeLayerStyleConfig,
  TypeLineStringVectorConfig,
  TypeOutfields,
  TypePolygonVectorConfig,
  TypeSimpleSymbolVectorConfig,
  TypeStrokeSymbolConfig,
} from '@/api/config/types/map-schema-types';
import { TypeWkbLayerConfig } from '@/geo/layer/geoview-layers/vector/wkb';
import { WkbLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-validation-classes/wkb-layer-entry-config';
import { Fetch } from '@/core/utils/fetch-helper';
import { NotSupportedError } from '@/core/exceptions/core-exceptions';
import { Projection } from '@/geo/utils/projection';
import { logger } from '../../logger';

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
   * @returns {Promise<TypeWkbLayerConfig>} A WKB layer config
   */
  static async crateLayerConfigFromGeoPackage(layerConfig: GeoPackageLayerConfig): Promise<TypeWkbLayerConfig> {
    // Set up WKB layer config so it can be used in layer entry configs
    const geoviewLayerConfig: TypeWkbLayerConfig = {
      geoviewLayerId: layerConfig.geoviewLayerId,
      geoviewLayerName: layerConfig.geoviewLayerName,
      geoviewLayerType: CONST_LAYER_TYPES.WKB,
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
        const layersData = await GeoPackageReader.#getGeoPackageData(url);

        // Compile sublayer entry configs from the list of layer entry configs
        const listOfSubLayerEntryConfig: WkbLayerEntryConfig[] = [];
        if (layerEntryConfig.listOfLayerEntryConfig?.length) {
          layerEntryConfig.listOfLayerEntryConfig.forEach((sublayerEntryConfig) => {
            // Find layer data for the sublayer
            const matchingLayerData = layersData.find((layerData) => layerData.name === sublayerEntryConfig.layerId);
            if (matchingLayerData) {
              const { layerId, layerName, initialSettings } = sublayerEntryConfig;
              listOfSubLayerEntryConfig.push(
                new WkbLayerEntryConfig({
                  geoviewLayerConfig,
                  initialSettings,
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
                } as unknown as WkbLayerEntryConfig)
              );
            } else {
              // If no matching layer data, log error
              logger.logError(`No entry in GeoPackage matches ID ${sublayerEntryConfig.layerId}`);
            }
          });
        } else {
          // No sub layer entry configs, add all layers from GeoPackage
          layersData.forEach((layerData) => {
            const { layerId, layerName } = layerEntryConfig;
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
              } as unknown as WkbLayerEntryConfig)
            );
          });
        }

        // When the GeoPackage contains more than one layer, and we have multiple layer entry configs, we need a group layer
        if (layerConfig.listOfLayerEntryConfig.length > 1 && listOfSubLayerEntryConfig.length > 1) {
          listOfLayerEntryConfig.push({
            geoviewLayerConfig,
            layerId: layerEntryConfig.layerId,
            layerName: layerEntryConfig.layerName || layerEntryConfig.layerId,
            entryType: 'group',
            listOfLayerEntryConfig: listOfSubLayerEntryConfig,
          } as unknown as WkbLayerEntryConfig);
        } else listOfLayerEntryConfig.push(...listOfSubLayerEntryConfig);
      }
    } else {
      // No layer entry configs, we are just attempting to load from the metadataAccessPath
      const layersData = await GeoPackageReader.#getGeoPackageData(layerConfig.metadataAccessPath);
      layersData.forEach((layerData) => {
        listOfLayerEntryConfig.push(
          new WkbLayerEntryConfig({
            geoviewLayerConfig,
            layerId: layerData.name,
            layerName: layerData.name,
            layerStyle: layerData.styleSld ? GeoPackageReader.#processGeopackageStyle(layerData.styleSld) : undefined,
            schemaTag: CONST_LAYER_TYPES.WKB,
            entryType: CONST_LAYER_ENTRY_TYPES.VECTOR,
            source: {
              dataProjection: layerData.dataProjection || Projection.PROJECTION_NAMES.LONLAT,
              format: 'WKB',
              featureInfo: GeoPackageReader.#processFeatureInfoConfig(layerData.geoPackageFeatures[0].properties),
              geoPackageFeatures: layerData.geoPackageFeatures,
            },
          } as unknown as WkbLayerEntryConfig)
        );
      });
    }

    geoviewLayerConfig.listOfLayerEntryConfig = listOfLayerEntryConfig;
    return geoviewLayerConfig;
  }

  /**
   * Fetches a GeoPackage and creates layer data from it.
   * @param {string} url - The URL of the GeoPackage
   * @returns {Promise<LayerData[]>} Promise of the layer data
   * @private
   */
  static async #getGeoPackageData(url: string): Promise<GeoPackageLayerData[]> {
    // Load the GeoPackage and SqlJs at the same time
    const promises = [
      Fetch.fetchArrayBuffer(url),
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

    for (let i = 0; i < rules.length; i++) {
      Object.keys(rules[i]).forEach((key) => {
        // Polygon style
        if (key.toLowerCase() === 'polygonsymbolizer' && !layerStyle.Polygon) {
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
          layerStyle.Polygon = {
            type: 'simple',
            fields: [],
            hasDefault: false,
            info: [{ visible: true, label: '', values: [], settings: styles }],
          };
          // LineString style
        } else if (key.toLowerCase() === 'linesymbolizer' && !layerStyle.LineString) {
          const lineStyles = rules[i].linesymbolizer[0];

          const stroke: TypeStrokeSymbolConfig = {};
          if (lineStyles.stroke) {
            if (lineStyles.stroke.styling?.stroke) stroke.color = lineStyles.stroke.styling.stroke;
            if (lineStyles.stroke.styling?.strokeWidth) stroke.width = lineStyles.stroke.styling.strokeWidth;
          }

          const styles: TypeLineStringVectorConfig = { type: 'lineString', stroke };
          layerStyle.LineString = {
            type: 'simple',
            fields: [],
            hasDefault: false,
            info: [{ visible: true, label: '', values: [], settings: styles }],
          };
          // Point style
        } else if (key.toLowerCase() === 'pointsymbolizer' && !layerStyle.Point) {
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

              layerStyle.Point = {
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
