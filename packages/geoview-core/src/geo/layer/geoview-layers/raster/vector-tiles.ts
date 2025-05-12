import VectorTileLayer from 'ol/layer/VectorTile';
import VectorTileSource, { Options as SourceOptions } from 'ol/source/VectorTile';
import TileGrid, { Options as TileGridOptions } from 'ol/tilegrid/TileGrid';

import { applyStyle } from 'ol-mapbox-style';

import { MVT } from 'ol/format';
import { AbstractGeoViewRaster } from '@/geo/layer/geoview-layers/raster/abstract-geoview-raster';
import {
  TypeLayerEntryConfig,
  TypeSourceTileInitialConfig,
  TypeGeoviewLayerConfig,
  TypeTileGrid,
  CONST_LAYER_ENTRY_TYPES,
  CONST_LAYER_TYPES,
} from '@/api/config/types/map-schema-types';
import { TypeJsonArray, TypeJsonObject } from '@/api/config/types/config-types';
import { validateExtentWhenDefined } from '@/geo/utils/utilities';
import { Projection } from '@/geo/utils/projection';
import { VectorTilesLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/vector-tiles-layer-entry-config';
import { logger } from '@/core/utils/logger';
import { LayerDataAccessPathMandatoryError } from '@/core/exceptions/layer-exceptions';
import {
  LayerEntryConfigNoLayerProvidedError,
  LayerEntryConfigVectorTileProjectionNotMatchingMapProjectionError,
} from '@/core/exceptions/layer-entry-config-exceptions';

// TODO: Implement method to validate Vector Tiles service
// TODO: Add more customization (minZoom, maxZoom, TMS)

// GV: CONFIG EXTRACTION
// GV: This section of code must be deleted because we already have another type guard that does the same thing
// GV: |||||
// GV: vvvvv

export type TypeSourceVectorTilesInitialConfig = TypeSourceTileInitialConfig;

export interface TypeVectorTilesConfig extends Omit<TypeGeoviewLayerConfig, 'listOfLayerEntryConfig'> {
  geoviewLayerType: typeof CONST_LAYER_TYPES.VECTOR_TILES;
  listOfLayerEntryConfig: VectorTilesLayerEntryConfig[];
}

// GV: ^^^^^
// GV: |||||

/**
 * A class to add vector-tiles layer
 *
 * @exports
 * @class VectorTiles
 */
export class VectorTiles extends AbstractGeoViewRaster {
  /**
   * Constructs a VectorTiles Layer configuration processor.
   *
   * @param {string} mapId the id of the map
   * @param {TypeVectorTilesConfig} layerConfig the layer configuration
   */
  constructor(mapId: string, layerConfig: TypeVectorTilesConfig) {
    super(CONST_LAYER_TYPES.VECTOR_TILES, layerConfig, mapId);
  }

  /**
   * Overrides the way the layer metadata is processed.
   * @param {VectorTilesLayerEntryConfig} layerConfig - The layer entry configuration to process.
   * @returns {Promise<VectorTilesLayerEntryConfig>} A promise that the layer entry configuration has gotten its metadata processed.
   */
  protected override async onProcessLayerMetadata(layerConfig: VectorTilesLayerEntryConfig): Promise<VectorTilesLayerEntryConfig> {
    if (this.metadata) {
      const { tileInfo, fullExtent, minScale, maxScale, minZoom, maxZoom } = this.metadata;
      const newTileGrid: TypeTileGrid = {
        extent: [fullExtent.xmin as number, fullExtent.ymin as number, fullExtent.xmax as number, fullExtent.ymax as number],
        origin: [tileInfo.origin.x as number, tileInfo.origin.y as number],
        resolutions: (tileInfo.lods as Array<TypeJsonObject>).map(({ resolution }) => resolution as number),
        tileSize: [tileInfo.rows as number, tileInfo.cols as number],
      };
      // eslint-disable-next-line no-param-reassign
      layerConfig.source!.tileGrid = newTileGrid;

      // eslint-disable-next-line no-param-reassign
      layerConfig.initialSettings.extent = validateExtentWhenDefined(layerConfig.initialSettings.extent);

      if (fullExtent.spatialReference && !Projection.getProjectionFromObj(fullExtent.spatialReference))
        await Projection.addProjection(fullExtent.spatialReference);

      // Set zoom levels. Vector tiles may be unique as they can have both scale and zoom level properties
      // First set the min/max scales based on the service / config
      // * Infinity and -Infinity are used as extreme zoom level values in case the value is undefined
      if (minScale) {
        // eslint-disable-next-line no-param-reassign
        layerConfig.minScale = Math.min(layerConfig.minScale ?? Infinity, minScale as number);
      }

      if (maxScale) {
        // eslint-disable-next-line no-param-reassign
        layerConfig.maxScale = Math.max(layerConfig.maxScale ?? -Infinity, maxScale as number);
      }

      // Second, set the min/max zoom levels based on the service / config.
      // GV Vector tiles should always have a minZoom and maxZoom, so -Infinity or Infinity should never be set as a value
      if (minZoom) {
        // eslint-disable-next-line no-param-reassign
        layerConfig.initialSettings.minZoom = Math.max(layerConfig.initialSettings.minZoom ?? -Infinity, minZoom as number);
      }

      if (maxZoom) {
        // eslint-disable-next-line no-param-reassign
        layerConfig.initialSettings.maxZoom = Math.min(layerConfig.initialSettings.maxZoom ?? Infinity, maxZoom as number);
      }
    }

    // Return the layer config
    return layerConfig;
  }

  /**
   * Overrides the way the layer entry is processed to generate an Open Layer Base Layer object.
   * @param {VectorTilesLayerEntryConfig} layerConfig - The layer entry config needed to create the Open Layer object.
   * @returns {Promise<VectorTileLayer<VectorTileSource>>} The GeoView raster layer that has been created.
   */
  protected override onProcessOneLayerEntry(layerConfig: VectorTilesLayerEntryConfig): Promise<VectorTileLayer<VectorTileSource>> {
    // GV Time to request an OpenLayers layer!
    const requestResult = this.emitLayerRequesting({ config: layerConfig });

    // If any response
    let olLayer: VectorTileLayer<VectorTileSource>;
    if (requestResult.length > 0) {
      // Get the OpenLayer that was created
      olLayer = requestResult[0] as VectorTileLayer<VectorTileSource>;
    } else throw new LayerEntryConfigNoLayerProvidedError(layerConfig);

    // TODO: Refactor - Layers refactoring. What is this doing? See how we can do this in the new layers. Can it be done before?
    const resolutions = olLayer.getSource()?.getTileGrid()?.getResolutions();

    let appliedStyle = layerConfig.styleUrl || (this.metadata?.defaultStyles as string);

    if (appliedStyle) {
      if (!appliedStyle.endsWith('/root.json')) appliedStyle = `${appliedStyle}/root.json`;

      applyStyle(olLayer, appliedStyle, {
        resolutions: resolutions?.length ? resolutions : [],
      }).catch((error: unknown) => {
        // Log
        logger.logPromiseFailed('applyStyle in processOneLayerEntry in VectorTiles', error);
      });
    }

    // Return the OpenLayer layer
    return Promise.resolve(olLayer);
  }

  /**
   * Creates a configuration object for a XYZTiles layer.
   * This function constructs a `TypeVectorTilesConfig` object that describes an XYZTiles layer
   * and its associated entry configurations based on the provided parameters.
   * @param {string} geoviewLayerId - A unique identifier for the GeoView layer.
   * @param {string} geoviewLayerName - The display name of the GeoView layer.
   * @param {string} metadataAccessPath - The URL or path to access metadata.
   * @param {boolean} isTimeAware - Indicates whether the layer supports time-based filtering.
   * @param {TypeJsonArray} layerEntries - An array of layer entries objects to be included in the configuration.
   * @returns {TypeVectorTilesConfig} The constructed configuration object for the XYZTiles layer.
   */
  static createVectorTilesLayerConfig(
    geoviewLayerId: string,
    geoviewLayerName: string,
    metadataAccessPath: string,
    isTimeAware: boolean,
    layerEntries: TypeJsonArray
  ): TypeVectorTilesConfig {
    const geoviewLayerConfig: TypeVectorTilesConfig = {
      geoviewLayerId,
      geoviewLayerName,
      metadataAccessPath,
      geoviewLayerType: CONST_LAYER_TYPES.VECTOR_TILES,
      isTimeAware,
      listOfLayerEntryConfig: [],
    };
    geoviewLayerConfig.listOfLayerEntryConfig = layerEntries.map((layerEntry) => {
      const layerEntryConfig = new VectorTilesLayerEntryConfig({
        schemaTag: CONST_LAYER_TYPES.VECTOR_TILES,
        entryType: CONST_LAYER_ENTRY_TYPES.RASTER_TILE,
        layerId: layerEntry.id as string,
        tileGrid: layerEntry.tileGrid as unknown as TypeTileGrid,
        source: {
          dataAccessPath: metadataAccessPath,
        },
      } as VectorTilesLayerEntryConfig);
      return layerEntryConfig;
    });

    // Return it
    return geoviewLayerConfig;
  }

  /**
   * Creates a VectorTileSource from a layer config.
   * This encapsulates projection, tileGrid, and format setup.
   * @param {VectorTilesLayerEntryConfig} layerConfig - Configuration object for the vector tile layer.
   * @param {string} fallbackProjection - Fallback projection if none is provided in the config.
   * @returns An initialized VectorTileSource ready for use in a layer.
   * @throws If required config fields like dataAccessPath are missing.
   */
  static createVectorTileSource(layerConfig: VectorTilesLayerEntryConfig, fallbackProjection: string): VectorTileSource {
    const { source } = layerConfig;

    // Ensure the dataAccessPath is defined; required for fetching tiles
    if (!source?.dataAccessPath) {
      throw new LayerDataAccessPathMandatoryError(layerConfig.layerPath);
    }

    // Create the source options
    const sourceOptions: SourceOptions = {
      url: source.dataAccessPath,
      format: new MVT(),
    };

    // Assign projection from config if present, otherwise use fallback (e.g., map's current projection)
    sourceOptions.projection = source.projection ? `EPSG:${source.projection}` : fallbackProjection;

    // Validate the spatial reference in the tileInfo (if set) is the same as the source
    if (
      layerConfig.getServiceMetadata()?.tileInfo?.spatialReference?.wkid &&
      sourceOptions.projection.replace('EPSG:', '') !== layerConfig.getServiceMetadata()?.tileInfo.spatialReference.wkid.toString()
    ) {
      // Set the layer status to error
      layerConfig.setLayerStatusError();

      // Raise error
      throw new LayerEntryConfigVectorTileProjectionNotMatchingMapProjectionError(layerConfig);
    }

    // If tileGrid configuration exists, construct and assign an ol/tilegrid/TileGrid
    if (source.tileGrid) {
      const tileGridOptions: TileGridOptions = {
        origin: source.tileGrid.origin,
        resolutions: source.tileGrid.resolutions as number[],
        tileSize: source.tileGrid.tileSize,
        extent: source.tileGrid.extent,
      };
      sourceOptions.tileGrid = new TileGrid(tileGridOptions);
    }

    // Return the fully configured VectorTileSource instance
    return new VectorTileSource(sourceOptions);
  }
}

/**
 * type guard function that redefines a TypeGeoviewLayerConfig as a TypeVectorTilesConfig if the geoviewLayerType attribute of the
 * verifyIfLayer parameter is VECTOR_TILES. The type ascention applies only to the true block of the if clause that use this
 * function.
 *
 * @param {TypeGeoviewLayerConfig} verifyIfLayer Polymorphic object to test in order to determine if the type ascention is valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const layerConfigIsVectorTiles = (verifyIfLayer: TypeGeoviewLayerConfig): verifyIfLayer is TypeVectorTilesConfig => {
  return verifyIfLayer?.geoviewLayerType === CONST_LAYER_TYPES.VECTOR_TILES;
};

/**
 * type guard function that redefines a TypeLayerEntryConfig as a VectorTilesLayerEntryConfig if the geoviewLayerType attribute
 * of the verifyIfGeoViewEntry.geoviewLayerConfig attribute is VECTOR_TILES. The type ascention applies only to the true block of
 * the if clause that use this function.
 *
 * @param {TypeLayerEntryConfig} verifyIfGeoViewEntry Polymorphic object to test in order to determine if the type ascention is
 * valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export const geoviewEntryIsVectorTiles = (
  verifyIfGeoViewEntry: TypeLayerEntryConfig
): verifyIfGeoViewEntry is VectorTilesLayerEntryConfig => {
  return verifyIfGeoViewEntry?.geoviewLayerConfig?.geoviewLayerType === CONST_LAYER_TYPES.VECTOR_TILES;
};
