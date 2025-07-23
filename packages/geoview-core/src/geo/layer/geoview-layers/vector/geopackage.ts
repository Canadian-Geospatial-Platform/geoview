import { Options as SourceOptions } from 'ol/source/Vector';
import { WKB as FormatWKB } from 'ol/format';
import { ReadOptions } from 'ol/format/Feature';
import { Vector as VectorSource } from 'ol/source';
import { Feature } from 'ol';
import { ProjectionLike } from 'ol/proj';

import initSqlJs, { ParamsObject, SqlValue } from 'sql.js';
import * as SLDReader from '@nieuwlandgeo/sldreader';

import { TypeJsonArray, TypeJsonObject } from '@/api/config/types/config-types';
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
  TypeOutfields,
  CONST_LAYER_TYPES,
} from '@/api/config/types/map-schema-types';
import { GeoPackageLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-validation-classes/geopackage-layer-config-entry';
import { VectorLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-layer-entry-config';
import { GroupLayerEntryConfig } from '@/core/utils/config/validation-classes/group-layer-entry-config';
import { logger } from '@/core/utils/logger';
import { LayerNotCreatedError } from '@/core/exceptions/layer-exceptions';
import { formatError, NotImplementedError, NotSupportedError } from '@/core/exceptions/core-exceptions';
import { AbstractBaseLayer } from '@/geo/layer/gv-layers/abstract-base-layer';
import { AbstractGVLayer } from '@/geo/layer/gv-layers/abstract-gv-layer';
import { GVGroupLayer } from '@/geo/layer/gv-layers/gv-group-layer';

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
  tableName: SqlValue;
  srsId?: string;
  geometryColumnName: SqlValue;
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
   * @param {TypeGeoPackageFeatureLayerConfig} layerConfig the layer configuration
   */
  constructor(layerConfig: TypeGeoPackageLayerConfig) {
    super(CONST_LAYER_TYPES.GEOPACKAGE, layerConfig);
  }

  /**
   * Overrides the way a geoview layer config initializes its layer entries.
   * @returns {Promise<TypeGeoviewLayerConfig>} A promise resolved once the layer entries have been initialized.
   */
  protected override onInitLayerEntries(): Promise<TypeGeoviewLayerConfig> {
    // Not implemented
    throw new NotImplementedError('onInitLayerEntries in GeoPackage is not implemented');
  }

  /**
   * Overrides the way the layer metadata is processed.
   * @param {VectorLayerEntryConfig} layerConfig - The layer entry configuration to process.
   * @returns {Promise<VectorLayerEntryConfig>} A promise that the layer entry configuration has gotten its metadata processed.
   */
  protected override onProcessLayerMetadata(layerConfig: VectorLayerEntryConfig): Promise<VectorLayerEntryConfig> {
    // Return the layer config
    return Promise.resolve(layerConfig);
  }

  /**
   * Overrides the way the layer entry is processed to generate an Open Layer Base Layer object.
   * @param {VectorLayerEntryConfig} layerConfig - The layer entry config needed to create the Open Layer object.
   * @param {LayerGroup} layerGroup Optional layer group for multiple layers.
   * @returns {Promise<BaseLayer>} The GeoView base layer that has been created.
   */
  protected override onProcessOneLayerEntry(layerConfig: VectorLayerEntryConfig, layerGroup?: GVGroupLayer): Promise<AbstractBaseLayer> {
    // TODO: Refactor - This function implementation needs revision, because it doesn't return a single 'BaseLayer', it can
    // TO.DOCONT: create more than one layer which seems to differ from the other layer classes.

    // Prepare a promise
    const promisedLayers = new Promise<AbstractBaseLayer>((resolve, reject) => {
      GeoPackage.#extractGeopackageData(layerConfig)
        .then(async ([layers, slds]) => {
          if (layers.length === 1) {
            this.#processOneGeopackageLayer(layerConfig, layers[0], slds)
              .then((baseLayer) => {
                if (baseLayer) {
                  // Set the layer status to processed
                  layerConfig.setLayerStatusProcessed();

                  if (layerGroup) layerGroup.addLayer(baseLayer);
                  resolve(layerGroup || baseLayer);
                } else {
                  // Throw error
                  throw new LayerNotCreatedError(layerConfig.layerPath, layerConfig.getLayerName());
                }
              })
              .catch((error: unknown) => {
                // Reject
                reject(formatError(error));
              });
          } else {
            // eslint-disable-next-line no-param-reassign
            layerConfig.entryType = CONST_LAYER_ENTRY_TYPES.GROUP;
            // eslint-disable-next-line no-param-reassign
            (layerConfig as TypeLayerEntryConfig).listOfLayerEntryConfig = [];
            const newLayerGroup = this.createLayerGroup(layerConfig as unknown as GroupLayerEntryConfig, layerConfig.initialSettings);

            // For each layer
            const promises: Promise<AbstractGVLayer>[] = [];
            for (let i = 0; i < layers.length; i++) {
              promises.push(
                new Promise((resolve2, reject2) => {
                  // "Clone" the config, patch until that layer type logic is rebuilt
                  const newLayerEntryConfig = layerConfig.clone() as VectorLayerEntryConfig;
                  newLayerEntryConfig.layerId = layers[i].name;
                  newLayerEntryConfig.layerName = layers[i].name;
                  newLayerEntryConfig.entryType = CONST_LAYER_ENTRY_TYPES.VECTOR;
                  newLayerEntryConfig.parentLayerConfig = layerConfig as unknown as GroupLayerEntryConfig; // TODO: Check this type conversion, maybe recreate the Group object instead?

                  this.#processOneGeopackageLayer(newLayerEntryConfig, layers[i], slds)
                    .then((baseLayer) => {
                      if (baseLayer) {
                        (layerConfig as unknown as GroupLayerEntryConfig).listOfLayerEntryConfig.push(newLayerEntryConfig);
                        newLayerGroup.addLayer(baseLayer);

                        // Set the layer status to processed
                        layerConfig.setLayerStatusProcessed();

                        resolve2(baseLayer);
                      } else {
                        // Throw error
                        throw new LayerNotCreatedError(layerConfig.layerPath, layerConfig.getLayerName());
                      }
                    })
                    .catch((error: unknown) => {
                      // Log
                      logger.logPromiseFailed('processOneGeopackageLayer (2) in processOneLayerEntry in GeoPackage', error);

                      // Set the layer status to error
                      // TODO: Check - Do we need to set the status to error here if we're doing it later in the other catch? (caught below)
                      layerConfig.setLayerStatusError();

                      // Reject
                      reject2(formatError(error));
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
        .catch((error: unknown) => {
          // Log
          logger.logPromiseFailed('extractGeopackageData in processOneLayerEntry in GeoPackage', error);

          // Set the layer status to error
          layerConfig.setLayerStatusError();

          // Reject
          reject(formatError(error));
        });
    });

    return promisedLayers;
  }

  /**
   * This method creates a GeoView layer using the definition provided in the layerConfig parameter.
   *
   * @param {VectorLayerEntryConfig} layerConfig Information needed to create the GeoView layer.
   * @param {sldsInterface} sld The SLD style associated with the layers geopackage, if any
   *
   * @returns {Promise<BaseLayer | undefined>} The GeoView base layer that has been created.
   * @private
   */
  #processOneGeopackageLayer(
    layerConfig: VectorLayerEntryConfig,
    layerInfo: LayerData,
    sld?: SldsInterface
  ): Promise<AbstractGVLayer | undefined> {
    // Alert that we want to register an extra layer entry
    this.emitLayerEntryRegisterInit({ config: layerConfig });

    const { name } = layerInfo;

    // Extract layer styles if they exist
    if (sld && sld[name]) {
      GeoPackage.processGeopackageStyle(layerConfig, sld[name]);
    }

    if (layerInfo.properties) {
      const { properties } = layerInfo;
      GeoPackage.#processFeatureInfoConfig(properties as TypeJsonObject, layerConfig);
    }

    // Redirect
    const layer = this.onCreateGVLayer(layerConfig);

    // Return the OpenLayer layer
    return Promise.resolve(layer);
  }

  /**
   * Overrides the creation of the GV Layer
   * @param {VectorLayerEntryConfig} layerConfig - The layer entry configuration.
   * @returns {AbstractGVLayer} The GV Layer
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected override onCreateGVLayer(layerConfig: VectorLayerEntryConfig): AbstractGVLayer {
    throw new NotImplementedError('Geopackage.onCreateGVLayer not implemented. No GVGeopackage class.');
  }

  /**
   * Create a source configuration for the vector layer.
   *
   * @param {VectorLayerEntryConfig} layerConfig The layer entry configuration.
   * @param {SourceOptions} sourceOptions The source options (default: {}).
   * @param {ReadOptions} readOptions The read options (default: {}).
   * @private
   */
  static #extractGeopackageData(
    layerConfig: VectorLayerEntryConfig,
    sourceOptions: SourceOptions<Feature> = {},
    readOptions: ReadOptions = {}
  ): Promise<[LayerData[], SldsInterface]> {
    const promisedGeopackageData = new Promise<[LayerData[], SldsInterface]>((resolve) => {
      const url = layerConfig.source!.dataAccessPath!;
      const attributions = layerConfig.getAttributions();
      // eslint-disable-next-line no-param-reassign
      if (attributions.length > 0) sourceOptions.attributions = attributions;

      // TODO: Refactor - Rewrite the xhr here to use utilities.fetch instead. XMLHttpRequest shouldn't be used anymore.
      const xhr = new XMLHttpRequest();
      xhr.responseType = 'arraybuffer';

      initSqlJs({
        locateFile: (file) => `https://sql.js.org/dist/${file}`,
      })
        .then((SQL) => {
          xhr.open('GET', url);
          xhr.onload = () => {
            if (xhr.status !== 200) return;

            const db = new SQL.Database(new Uint8Array(xhr.response as ArrayBuffer));
            const format = new FormatWKB();
            const layersInfo: LayerData[] = [];
            const styleSlds: SldsInterface = {};

            // Step 1: Get all feature tables
            let stmt = db.prepare(`
              SELECT gpkg_contents.table_name, gpkg_contents.srs_id, gpkg_geometry_columns.column_name
              FROM gpkg_contents
              JOIN gpkg_geometry_columns
                ON gpkg_contents.table_name = gpkg_geometry_columns.table_name
              WHERE gpkg_contents.data_type = 'features';
            `);

            const tables: TableInfo[] = [];
            while (stmt.step()) {
              const row = stmt.get();
              tables.push({
                tableName: row[0],
                srsId: row[1]?.toString(),
                geometryColumnName: row[2],
              });
            }

            // Step 2: Load layer_styles table if present
            stmt = db.prepare(`SELECT f_table_name, styleSLD FROM layer_styles`);
            while (stmt.step()) {
              const [tableName, sld] = stmt.get();
              if (sld) styleSlds[tableName as string] = sld as string;
            }

            // Step 3: Process each feature table
            for (const { tableName, srsId, geometryColumnName } of tables) {
              const dataProjection = `EPSG:${srsId}`;
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const rawFeatures: { geom: Uint8Array; properties: any }[] = [];

              stmt = db.prepare(`SELECT * FROM '${tableName}'`);
              while (stmt.step()) {
                const row = stmt.getAsObject();
                const geomBuffer = row[geometryColumnName as string] as Uint8Array;
                delete row[geometryColumnName as string];
                rawFeatures.push({ geom: geomBuffer, properties: row });
              }

              const vectorSource = new VectorSource({
                ...sourceOptions,
                loader: (extent, resolution, projection, success, failure) => {
                  try {
                    const features = rawFeatures.map(({ geom, properties }) => {
                      const parsed = GeoPackage.#parseGpkgGeom(geom);
                      const feature = format.readFeatures(parsed, {
                        ...readOptions,
                        dataProjection,
                        featureProjection: GeoPackage.#getProjectionCode(projection),
                      })[0];
                      feature.setProperties(properties);
                      return feature;
                    });

                    vectorSource.addFeatures(features);
                    success?.(features);
                  } catch (err) {
                    logger.logError(`Failed to load features for table ${tableName}:`, err);
                    failure?.();
                  }
                },
              });

              layersInfo.push({
                name: tableName as string,
                source: vectorSource,
                properties: (rawFeatures[0]?.properties as ParamsObject) ?? {},
              });
            }

            db.close();
            resolve([layersInfo, styleSlds]);
          };
          xhr.send();
        })
        .catch((error: unknown) => {
          // Log
          logger.logPromiseFailed('initSqlJs in extractGeopackageData in GeoPackage', error);
        });
    });

    return promisedGeopackageData;
  }

  /**
   * This method creates a GeoView layer using the definition provided in the layerConfig parameter.
   *
   * @param {VectorLayerEntryConfig} layerConfig Information needed to create the GeoView layer.
   * @param {string | number | Uint8Array} sld The SLD style associated with the layer
   */
  protected static processGeopackageStyle(layerConfig: VectorLayerEntryConfig, sld: string | number | Uint8Array): void {
    // Extract layer styles if they exist
    const { rules } = SLDReader.Reader(sld).layers[0].styles[0].featuretypestyles[0];
    // eslint-disable-next-line no-param-reassign
    if (layerConfig.layerStyle === undefined) layerConfig.layerStyle = {};

    for (let i = 0; i < rules.length; i++) {
      Object.keys(rules[i]).forEach((key) => {
        // Polygon style
        if (key.toLowerCase() === 'polygonsymbolizer' && !layerConfig.layerStyle!.Polygon) {
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
        } else if (key.toLowerCase() === 'linesymbolizer' && !layerConfig.layerStyle!.LineString) {
          const lineStyles = rules[i].linesymbolizer[0];

          const stroke: TypeStrokeSymbolConfig = {};
          if (lineStyles.stroke) {
            if (lineStyles.stroke.styling?.stroke) stroke.color = lineStyles.stroke.styling.stroke;
            if (lineStyles.stroke.styling?.strokeWidth) stroke.width = lineStyles.stroke.styling.strokeWidth;
          }

          const styles: TypeLineStringVectorConfig = { type: 'lineString', stroke };
          // eslint-disable-next-line no-param-reassign
          layerConfig.layerStyle!.LineString = {
            type: 'simple',
            fields: [],
            hasDefault: false,
            info: [{ visible: true, label: '', values: [], settings: styles }],
          };
          // Point style
        } else if (key.toLowerCase() === 'pointsymbolizer' && !layerConfig.layerStyle!.Point) {
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
              layerConfig.layerStyle!.Point = {
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

    layerConfig.source.featureInfo.outfields.forEach((outfield) => {
      // eslint-disable-next-line no-param-reassign
      if (!outfield.alias) outfield.alias = outfield.name;
    });

    // Set name field to first value
    if (!layerConfig.source.featureInfo.nameField)
      // eslint-disable-next-line no-param-reassign
      layerConfig.source.featureInfo.nameField = layerConfig.source.featureInfo.outfields[0].name;
  }

  /**
   * Create a source configuration for the vector layer.
   *
   * @param {Uint8Array} gpkgBinGeom Binary geometry array to be parsed.
   *
   * @returns {Uint8Array} Uint8Array Subarray of inputted binary geoametry array.
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

  /**
   * Utility function to get a projection code from a ProjectionLike
   */
  static #getProjectionCode(projection: ProjectionLike): string {
    return typeof projection === 'string' ? projection : projection!.getCode();
  }

  /**
   * Creates a configuration object for a Geopackage Feature layer.
   * This function constructs a `TypeGeoPackageLayerConfig` object that describes an Geopackage Feature layer
   * and its associated entry configurations based on the provided parameters.
   * @param {string} geoviewLayerId - A unique identifier for the GeoView layer.
   * @param {string} geoviewLayerName - The display name of the GeoView layer.
   * @param {string} metadataAccessPath - The URL or path to access metadata or feature data.
   * @param {boolean} isTimeAware - Indicates whether the layer supports time-based filtering.
   * @param {TypeJsonArray} layerEntries - An array of layer entries objects to be included in the configuration.
   * @returns {TypeGeoPackageLayerConfig} The constructed configuration object for the Geopackage Feature layer.
   */
  static createGeopackageLayerConfig(
    geoviewLayerId: string,
    geoviewLayerName: string,
    metadataAccessPath: string,
    isTimeAware: boolean,
    layerEntries: TypeJsonArray
  ): TypeGeoPackageLayerConfig {
    const geoviewLayerConfig: TypeGeoPackageLayerConfig = {
      geoviewLayerId,
      geoviewLayerName,
      // metadataAccessPath, // Wasn't initialized, originally, so not initializing it now
      geoviewLayerType: CONST_LAYER_TYPES.GEOPACKAGE,
      isTimeAware,
      listOfLayerEntryConfig: [],
    };
    geoviewLayerConfig.listOfLayerEntryConfig = layerEntries.map((layerEntry) => {
      const layerEntryConfig = new GeoPackageLayerEntryConfig({
        geoviewLayerConfig,
        schemaTag: CONST_LAYER_TYPES.GEOPACKAGE,
        entryType: CONST_LAYER_ENTRY_TYPES.VECTOR,
        layerId: `${layerEntry.id}`,
        source: {
          format: 'GeoPackage',
          dataAccessPath: metadataAccessPath,
        },
      } as GeoPackageLayerEntryConfig);
      return layerEntryConfig;
    });

    // Return it
    return geoviewLayerConfig;
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
