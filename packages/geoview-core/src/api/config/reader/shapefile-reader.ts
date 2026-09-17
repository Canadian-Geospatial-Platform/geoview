import shp from 'shpjs';
import type { ConfigAbstractBaseClassOrType, ConfigClassOrType, ShapefileLayerConfig } from '@/api/types/layer-schema-types';
import type { TypeGeoJSONLayerConfig } from '@/geo/layer/geoview-layers/vector/geojson';
import { GeoJSON as LayerGeoJSON } from '@/geo/layer/geoview-layers/vector/geojson';
import { GeoJSONLayerEntryConfig } from '@/api/config/validation-classes/vector-validation-classes/geojson-layer-entry-config';
import { ConfigBaseClass } from '@/api/config/validation-classes/config-base-class';
import { AbstractBaseLayerEntryConfig } from '@/api/config/validation-classes/abstract-base-layer-entry-config';
import { generateId } from '@/core/utils/utilities';
import { Fetch } from '@/core/utils/fetch-helper';
import { LayerSourceFailedToLoadError } from '@/core/exceptions/geoview-exceptions';
import { formatError } from '@/core/exceptions/core-exceptions';
import { logger } from '@/core/utils/logger';

/** A class to generate a GeoView layer config from a shapefile. */
export class ShapefileReader {
  /**
   * Generates GeoJson layer config from a shapefile.
   *
   * @param layerConfig - The config to convert
   * @param abortSignal - Optional {@link AbortSignal} used to cancel the layer creation process
   * @returns A promise that resolves with the GeoJSON layer config
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
    let geojson;
    try {
      geojson = await shp(shapefileURL);
    } catch (error) {
      // shpjs throws a bare error when the shapefile files can't be downloaded (e.g. 404) or parsed;
      // surface a specific, actionable message naming the layer and the access path.
      throw new LayerSourceFailedToLoadError(layerConfig.geoviewLayerName || layerConfig.geoviewLayerId, formatError(error));
    }

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
              layerName: geojson.length === 1 ? layerConfig.geoviewLayerName || layerGeojson.fileName : layerGeojson.fileName,
              layerStyle: AbstractBaseLayerEntryConfig.getClassOrTypeLayerStyle(matchingLayerEntryConfig),
              initialSettings: AbstractBaseLayerEntryConfig.getClassOrTypeInitialSettings(matchingLayerEntryConfig),
              source: {
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

      // The layer id comes from the shapefile inside the archive
      const resolvedLayerId = geojson.fileName || filename || generateId();

      // Warn when a configured layerId doesn't match the shapefile in the archive; it's ignored and the archive content is used
      const configuredLayerId = layerConfig.listOfLayerEntryConfig?.[0]?.layerId;
      if (configuredLayerId && configuredLayerId !== resolvedLayerId) {
        logger.logWarning(
          `Shapefile layer '${layerConfig.geoviewLayerName || layerConfig.geoviewLayerId}': configured layerId '${configuredLayerId}' was not found in the archive; using '${resolvedLayerId}' instead.`
        );
      }

      const layerEntryConfig = new GeoJSONLayerEntryConfig({
        geoviewLayerConfig,
        layerId: resolvedLayerId,
        layerName: layerConfig.geoviewLayerName || geojson.fileName,
        layerStyle: AbstractBaseLayerEntryConfig.getClassOrTypeLayerStyle(passedLayerEntryConfig),
        initialSettings: ConfigBaseClass.getClassOrTypeInitialSettings(passedLayerEntryConfig),
        source: {
          geojson: JSON.stringify(geojson),
        },
      });

      geoviewLayerConfig.listOfLayerEntryConfig = [layerEntryConfig];
    }

    return geoviewLayerConfig;
  }
}
