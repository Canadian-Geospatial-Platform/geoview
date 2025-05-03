import VectorTileLayer from 'ol/layer/VectorTile';
import VectorTileSource, { Options as SourceOptions } from 'ol/source/VectorTile';
import TileGrid, { Options as TileGridOptions } from 'ol/tilegrid/TileGrid';

import { applyStyle } from 'ol-mapbox-style';

import { MVT } from 'ol/format';
import { CONST_LAYER_TYPES } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { AbstractGeoViewRaster } from '@/geo/layer/geoview-layers/raster/abstract-geoview-raster';
import {
  TypeLayerEntryConfig,
  TypeSourceTileInitialConfig,
  TypeGeoviewLayerConfig,
  TypeTileGrid,
} from '@/api/config/types/map-schema-types';
import { TypeJsonObject } from '@/api/config/types/config-types';
import { validateExtentWhenDefined } from '@/geo/utils/utilities';
import { Projection } from '@/geo/utils/projection';
import { VectorTilesLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/vector-tiles-layer-entry-config';
import { logger } from '@/core/utils/logger';
import { LayerEntryConfigVectorTileProjectionNotMatchingMapProjectionError } from '@/core/exceptions/layer-entry-config-exceptions';
import { NotImplementedError } from '@/core/exceptions/core-exceptions';

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
   * Overrides the way the layer entry is processed to generate an Open Layer Base Layer object.
   * @param {VectorTilesLayerEntryConfig} layerConfig - The layer entry config needed to create the Open Layer object.
   * @returns {Promise<VectorTileLayer<VectorTileSource>>} The GeoView raster layer that has been created.
   */
  protected override onProcessOneLayerEntry(layerConfig: VectorTilesLayerEntryConfig): Promise<VectorTileLayer<VectorTileSource>> {
    const sourceOptions: SourceOptions = {
      url: layerConfig.source.dataAccessPath,
    };

    if (
      this.metadata?.tileInfo?.spatialReference?.wkid &&
      this.getMapViewer().getProjection().getCode().replace('EPSG:', '') !== this.metadata.tileInfo.spatialReference.wkid.toString()
    ) {
      // Set the layer status to error
      layerConfig.setLayerStatusError();

      // Raise error
      throw new LayerEntryConfigVectorTileProjectionNotMatchingMapProjectionError(layerConfig);
    }

    if (layerConfig.source.projection) sourceOptions.projection = `EPSG:${layerConfig.source.projection}`;

    if (layerConfig.source.tileGrid) {
      const tileGridOptions: TileGridOptions = {
        origin: layerConfig.source.tileGrid?.origin,
        resolutions: layerConfig.source.tileGrid?.resolutions as number[],
      };
      if (layerConfig.source.tileGrid?.tileSize) tileGridOptions.tileSize = layerConfig.source.tileGrid?.tileSize;
      if (layerConfig.source.tileGrid?.extent) tileGridOptions.extent = layerConfig.source.tileGrid?.extent;
      sourceOptions.tileGrid = new TileGrid(tileGridOptions);
    }

    sourceOptions.format = new MVT();
    sourceOptions.projection = this.getMapViewer().getProjection().getCode();
    sourceOptions.tileGrid = new TileGrid(layerConfig.source!.tileGrid!);

    // Create the source
    const source = new VectorTileSource(sourceOptions);

    // GV Time to request an OpenLayers layer!
    const requestResult = this.emitLayerRequesting({ config: layerConfig, source });

    // If any response
    let olLayer: VectorTileLayer<VectorTileSource>;
    if (requestResult.length > 0) {
      // Get the OpenLayer that was created
      olLayer = requestResult[0] as VectorTileLayer<VectorTileSource>;
    } else throw new NotImplementedError("Layer was requested by the framework, but never received. Shouldn't happen by design.");

    // GV Time to emit about the layer creation!
    this.emitLayerCreation({ config: layerConfig, layer: olLayer });

    // TODO: Refactor - Layers refactoring. What is this doing? See how we can do this in the new layers. Can it be done before?
    const resolutions = sourceOptions.tileGrid.getResolutions();

    let appliedStyle = layerConfig.styleUrl || (this.metadata?.defaultStyles as string);

    if (appliedStyle) {
      if (!appliedStyle.endsWith('/root.json')) appliedStyle = `${appliedStyle}/root.json`;

      applyStyle(olLayer, appliedStyle, {
        resolutions: resolutions?.length ? resolutions : [],
      }).catch((error) => {
        // Log
        logger.logPromiseFailed('applyStyle in processOneLayerEntry in VectorTiles', error);
      });
    }

    // Return the OpenLayer layer
    return Promise.resolve(olLayer);
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
    return Promise.resolve(layerConfig);
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
