import shp from 'shpjs';
import { CONST_LAYER_ENTRY_TYPES, CONST_LAYER_TYPES, ShapefileLayerConfig } from '@/api/config/types/map-schema-types';
import { TypeGeoJSONLayerConfig } from '@/geo/layer/geoview-layers/vector/geojson';
import { GeoJSONLayerEntryConfig } from '../validation-classes/vector-validation-classes/geojson-layer-entry-config';
import { TypeJsonArray, TypeJsonObject } from '@/api/config/types/config-types';
import { generateId } from '@/core/utils/utilities';

/**
 * A class to generate a GeoView layer config from a shapefile.
 * @exports
 * @class ShapefileReader
 */
export class ShapefileReader {
  /**
   * Generates GeoJson layer config from a shapefile.
   * @param {TypeShapefileLayerConfig} layerConfig - the config to convert
   * @returns {Promise<TypeGeoJSONLayerConfig>} A geojson layer config
   */
  static async convertShapefileConfigToGeoJson(layerConfig: ShapefileLayerConfig): Promise<TypeGeoJSONLayerConfig[]> {
    // shp expects either a url, path to a .zip, or an array buffer, so file url must be converted
    let shapefileURL: ArrayBuffer | string = layerConfig.metadataAccessPath;
    let filename: string | undefined;
    if (shapefileURL.startsWith('blob')) {
      const response = await fetch(shapefileURL);
      shapefileURL = await response.arrayBuffer();
    } else {
      filename = shapefileURL.split('/').pop()?.split('.')[0];
    }

    // Get geojson from shapefile(s)
    const geojson = await shp(shapefileURL);

    const geoviewLayerConfig: TypeGeoJSONLayerConfig = {
      geoviewLayerId: layerConfig.geoviewLayerId,
      geoviewLayerName: layerConfig.geoviewLayerName,
      geoviewLayerType: CONST_LAYER_TYPES.GEOJSON,
      metadataAccessPath: layerConfig.metadataAccessPath,
      listOfLayerEntryConfig: [],
    };

    // .zip may have multiple shapefiles inside, if so we need a layer entry for each
    if (geojson && Array.isArray(geojson)) {
      const newLayerEntryConfigs = geojson.map((layerGeojson) => {
        const matchingLayerEntryConfig = layerConfig.listOfLayerEntryConfig?.find(
          (layerEntryConfig) => layerEntryConfig.layerId === layerGeojson.fileName
        ) as unknown as GeoJSONLayerEntryConfig;
        return new GeoJSONLayerEntryConfig({
          geoviewLayerConfig,
          layerId: layerGeojson.fileName,
          layerName: layerGeojson.fileName,
          layerStyle: matchingLayerEntryConfig?.layerStyle ? matchingLayerEntryConfig.layerStyle : undefined,
          initialSettings: matchingLayerEntryConfig?.initialSettings ? matchingLayerEntryConfig.initialSettings : undefined,
          schemaTag: CONST_LAYER_TYPES.GEOJSON,
          entryType: CONST_LAYER_ENTRY_TYPES.VECTOR,
          source: {
            format: 'GeoJSON',
            geojson: JSON.stringify(layerGeojson),
          },
        } as GeoJSONLayerEntryConfig);
      });

      geoviewLayerConfig.listOfLayerEntryConfig = newLayerEntryConfigs;
    } else if (geojson) {
      const passedLayerEntryConfig = layerConfig.listOfLayerEntryConfig
        ? (layerConfig.listOfLayerEntryConfig[0] as unknown as GeoJSONLayerEntryConfig)
        : undefined;
      const layerEntryConfig = new GeoJSONLayerEntryConfig({
        geoviewLayerConfig,
        layerId: geojson.fileName || filename || generateId(),
        layerName: layerConfig.geoviewLayerName || geojson.fileName,
        layerStyle: passedLayerEntryConfig?.layerStyle,
        initialSettings: passedLayerEntryConfig?.initialSettings,
        schemaTag: CONST_LAYER_TYPES.GEOJSON,
        entryType: CONST_LAYER_ENTRY_TYPES.VECTOR,
        source: {
          format: 'GeoJSON',
          geojson: JSON.stringify(geojson),
        },
      } as GeoJSONLayerEntryConfig);

      geoviewLayerConfig.listOfLayerEntryConfig = [layerEntryConfig];
    }

    return [geoviewLayerConfig];
  }

  /**
   * Generates GeoJson layer configs as TypeJsonObject from shapefiles.
   * @param {TypeJsonArray} layerConfigs - the config to convert
   * @returns {Promise<TypeJsonObject[]>} A geojson layer config array
   */
  static async getGVConfigsFromShapefiles(layerConfigs: TypeJsonArray): Promise<TypeJsonObject[]> {
    const promises = layerConfigs.map(async (layerConfig) => {
      // shp expects either a url, path to a .zip, or an array buffer, so file url must be converted
      let shapefileURL: string | ArrayBuffer = layerConfig.metadataAccessPath as string;
      let filename: string | undefined;
      if (shapefileURL.startsWith('blob')) {
        const response = await fetch(shapefileURL);
        shapefileURL = await response.arrayBuffer();
      } else {
        filename = shapefileURL.split('/').pop()?.split('.')[0];
      }

      // Get geojson from shapefile(s)
      const geojson = await shp(shapefileURL);

      // Create geoJSON geoview layer config with converted geojson
      const geoviewLayerConfig = {
        geoviewLayerId: layerConfig.geoviewLayerId,
        geoviewLayerName: layerConfig.geoviewLayerName,
        geoviewLayerType: CONST_LAYER_TYPES.GEOJSON,
        metadataAccessPath: layerConfig.metadataAccessPath,
        listOfLayerEntryConfig: [] as Array<object>,
      };

      const passedLayerEntryConfigs = layerConfig.listOfLayerEntryConfig as Array<TypeJsonObject>;
      // .zip may have multiple shapefiles inside, if so we need a layer entry for each
      if (geojson && Array.isArray(geojson)) {
        const newLayerEntryConfigs = geojson.map((layerGeojson) => {
          const matchingLayerEntryConfig = passedLayerEntryConfigs
            ? (passedLayerEntryConfigs.find(
                (layerEntryConfig) => layerEntryConfig.layerId === layerGeojson.fileName
              ) as unknown as GeoJSONLayerEntryConfig)
            : undefined;
          return {
            layerId: layerGeojson.fileName,
            layerName: layerGeojson.fileName,
            layerStyle: matchingLayerEntryConfig?.layerStyle ? matchingLayerEntryConfig.layerStyle : undefined,
            initialSettings: matchingLayerEntryConfig?.initialSettings ? matchingLayerEntryConfig.initialSettings : undefined,
            schemaTag: CONST_LAYER_TYPES.GEOJSON,
            entryType: CONST_LAYER_ENTRY_TYPES.VECTOR,
            source: {
              format: 'GeoJSON',
              geojson: JSON.stringify(layerGeojson),
            },
          };
        });

        geoviewLayerConfig.listOfLayerEntryConfig = newLayerEntryConfigs;
      } else if (geojson) {
        const layerEntryConfig = {
          layerId: geojson.fileName || filename || generateId(),
          layerName: layerConfig.geoviewLayerName || geojson.fileName,
          layerStyle: passedLayerEntryConfigs ? passedLayerEntryConfigs[0].layerStyle : undefined,
          initialSettings: passedLayerEntryConfigs ? passedLayerEntryConfigs[0]?.initialSettings : undefined,
          schemaTag: CONST_LAYER_TYPES.GEOJSON,
          entryType: CONST_LAYER_ENTRY_TYPES.VECTOR,
          source: {
            format: 'GeoJSON',
            geojson: JSON.stringify(geojson),
          },
        };

        geoviewLayerConfig.listOfLayerEntryConfig = [layerEntryConfig];
      }

      return geoviewLayerConfig as unknown as TypeJsonObject;
    });

    const settledPromises = await Promise.allSettled(promises);
    const configs = settledPromises
      .filter((settledPromise) => settledPromise.status === 'fulfilled')
      .map((settledPromise) => settledPromise.value);

    return configs;
  }
}
