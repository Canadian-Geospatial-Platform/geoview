import shp from 'shpjs';
import { ConfigAbstractBaseClassOrType, ConfigClassOrType, ShapefileLayerConfig } from '@/api/types/layer-schema-types';
import { GeoJSON as LayerGeoJSON, TypeGeoJSONLayerConfig } from '@/geo/layer/geoview-layers/vector/geojson';
import { GeoJSONLayerEntryConfig } from '@/api/config/validation-classes/vector-validation-classes/geojson-layer-entry-config';
import { ConfigBaseClass } from '@/api/config/validation-classes/config-base-class';
import { AbstractBaseLayerEntryConfig } from '@/api/config/validation-classes/abstract-base-layer-entry-config';
import { generateId } from '@/core/utils/utilities';
import { Fetch } from '@/core/utils/fetch-helper';

/**
 * A class to generate a GeoView layer config from a shapefile.
 * @exports
 * @class ShapefileReader
 */
export class ShapefileReader {
  /**
   * Generates GeoJson layer config from a shapefile.
   * @param {TypeShapefileLayerConfig} layerConfig - The config to convert.
   * @param {AbortSignal | undefined} abortSignal - Abort signal to handle cancelling of fetch.
   * @returns {Promise<TypeGeoJSONLayerConfig>} A geojson layer config
   */
  static async convertShapefileConfigToGeoJson(
    layerConfig: ShapefileLayerConfig,
    abortSignal?: AbortSignal
  ): Promise<TypeGeoJSONLayerConfig> {
    // shp expects either a url, path to a .zip, or an array buffer, so file url must be converted
    let shapefileURL: ArrayBuffer | string = layerConfig.metadataAccessPath;
    let filename: string | undefined;
    if (shapefileURL.startsWith('blob')) {
      shapefileURL = await Fetch.fetchArrayBuffer(shapefileURL, { signal: abortSignal });
    } else {
      filename = shapefileURL.split('/').pop()?.split('.')[0];
    }

    // Get geojson from shapefile(s)
    const geojson = await shp(shapefileURL);

    // Create a GeoJSON GeoviewLayerConfig
    const geoviewLayerConfig = LayerGeoJSON.createGeoviewLayerConfig(
      layerConfig.geoviewLayerId,
      layerConfig.geoviewLayerName || layerConfig.geoviewLayerId,
      layerConfig.metadataAccessPath,
      false,
      []
    );

    // .zip may have multiple shapefiles inside, if so we need a layer entry for each
    if (geojson && Array.isArray(geojson)) {
      const newLayerEntryConfigs = geojson
        .map((layerGeojson) => {
          const matchingLayerEntryConfig = layerConfig.listOfLayerEntryConfig?.find(
            (layerEntryConfig) => layerEntryConfig.layerId === layerGeojson.fileName
          ) as ConfigClassOrType;

          if (!layerConfig.listOfLayerEntryConfig || matchingLayerEntryConfig) {
            return new GeoJSONLayerEntryConfig({
              geoviewLayerConfig,
              layerId: layerGeojson.fileName || generateId(),
              layerName: layerGeojson.fileName,
              layerStyle: AbstractBaseLayerEntryConfig.getClassOrTypeLayerStyle(matchingLayerEntryConfig),
              initialSettings: AbstractBaseLayerEntryConfig.getClassOrTypeInitialSettings(matchingLayerEntryConfig),
              source: {
                format: 'GeoJSON',
                geojson: JSON.stringify(layerGeojson),
              },
            });
          }
          return undefined;
        })
        .filter((layerEntryConfig) => layerEntryConfig !== undefined);

      if (newLayerEntryConfigs) geoviewLayerConfig.listOfLayerEntryConfig = newLayerEntryConfigs;
    } else if (geojson) {
      const passedLayerEntryConfig = layerConfig.listOfLayerEntryConfig
        ? (layerConfig.listOfLayerEntryConfig[0] as ConfigAbstractBaseClassOrType)
        : undefined;

      const layerEntryConfig = new GeoJSONLayerEntryConfig({
        geoviewLayerConfig,
        layerId: geojson.fileName || filename || generateId(),
        layerName: layerConfig.geoviewLayerName || geojson.fileName,
        layerStyle: AbstractBaseLayerEntryConfig.getClassOrTypeLayerStyle(passedLayerEntryConfig),
        initialSettings: ConfigBaseClass.getClassOrTypeInitialSettings(passedLayerEntryConfig),
        source: {
          format: 'GeoJSON',
          geojson: JSON.stringify(geojson),
        },
      });

      geoviewLayerConfig.listOfLayerEntryConfig = [layerEntryConfig];
    }

    return geoviewLayerConfig;
  }
}
