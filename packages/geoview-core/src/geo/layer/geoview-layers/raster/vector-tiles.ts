import VectorTileSource, { Options as SourceOptions } from 'ol/source/VectorTile';
import TileGrid, { Options as TileGridOptions } from 'ol/tilegrid/TileGrid';
import { ProjectionLike } from 'ol/proj';

import { applyStyle } from 'ol-mapbox-style';

import { MVT } from 'ol/format';
import { AbstractGeoViewLayer } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { AbstractGeoViewRaster } from '@/geo/layer/geoview-layers/raster/abstract-geoview-raster';
import {
  TypeLayerEntryConfig,
  TypeGeoviewLayerConfig,
  TypeTileGrid,
  CONST_LAYER_TYPES,
  TypeMetadataVectorTiles,
} from '@/api/config/types/map-schema-types';
import { ConfigBaseClass, TypeLayerEntryShell } from '@/core/utils/config/validation-classes/config-base-class';
import { validateExtentWhenDefined } from '@/geo/utils/utilities';
import { Projection } from '@/geo/utils/projection';
import { VectorTilesLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/vector-tiles-layer-entry-config';
import { logger } from '@/core/utils/logger';
import { LayerDataAccessPathMandatoryError } from '@/core/exceptions/layer-exceptions';
import { LayerEntryConfigVectorTileProjectionNotMatchingMapProjectionError } from '@/core/exceptions/layer-entry-config-exceptions';
import { GVVectorTiles } from '@/geo/layer/gv-layers/vector/gv-vector-tiles';

// TODO: Implement method to validate Vector Tiles service
// TODO: Add more customization (minZoom, maxZoom, TMS)
export interface TypeVectorTilesConfig extends Omit<TypeGeoviewLayerConfig, 'listOfLayerEntryConfig'> {
  geoviewLayerType: typeof CONST_LAYER_TYPES.VECTOR_TILES;
  listOfLayerEntryConfig: VectorTilesLayerEntryConfig[];
}

/**
 * A class to add vector-tiles layer
 *
 * @exports
 * @class VectorTiles
 */
export class VectorTiles extends AbstractGeoViewRaster {
  // TODO: Refactor - Review the purpose of this property
  /** Fallback projection (the map projection) */
  fallbackProjection: ProjectionLike;

  /**
   * Constructs a VectorTiles Layer configuration processor.
   * @param {TypeVectorTilesConfig} layerConfig the layer configuration
   */
  constructor(layerConfig: TypeVectorTilesConfig, fallbackProjection: ProjectionLike) {
    super(CONST_LAYER_TYPES.VECTOR_TILES, layerConfig);
    this.fallbackProjection = fallbackProjection;
  }

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   * @override
   * @returns {TypeMetadataVectorTiles | undefined} The strongly-typed layer configuration specific to this layer.
   */
  override getMetadata(): TypeMetadataVectorTiles | undefined {
    return super.getMetadata() as TypeMetadataVectorTiles | undefined;
  }

  /**
   * Overrides the way a geoview layer config initializes its layer entries.
   * @returns {Promise<TypeGeoviewLayerConfig>} A promise resolved once the layer entries have been initialized.
   */
  protected override onInitLayerEntries(): Promise<TypeGeoviewLayerConfig> {
    // Redirect
    return Promise.resolve(
      // TODO: Check - Check if there's a way to better determine the isTimeAware flag, defaults to false, how is it used here?
      VectorTiles.createGeoviewLayerConfig(this.geoviewLayerId, this.geoviewLayerName, this.metadataAccessPath, false, [])
    );
  }

  /**
   * Overrides the way the layer metadata is processed.
   * @param {VectorTilesLayerEntryConfig} layerConfig - The layer entry configuration to process.
   * @returns {Promise<VectorTilesLayerEntryConfig>} A promise that the layer entry configuration has gotten its metadata processed.
   */
  protected override async onProcessLayerMetadata(layerConfig: VectorTilesLayerEntryConfig): Promise<VectorTilesLayerEntryConfig> {
    if (this.getMetadata()) {
      const { tileInfo, fullExtent, minScale, maxScale, minZoom, maxZoom } = this.getMetadata()!;
      const newTileGrid: TypeTileGrid = {
        extent: [fullExtent.xmin, fullExtent.ymin, fullExtent.xmax, fullExtent.ymax],
        origin: [tileInfo.origin.x, tileInfo.origin.y],
        resolutions: tileInfo.lods.map(({ resolution }) => resolution),
        tileSize: [tileInfo.rows, tileInfo.cols],
      };

      // eslint-disable-next-line no-param-reassign
      layerConfig.source.tileGrid = newTileGrid;
      // eslint-disable-next-line no-param-reassign
      layerConfig.initialSettings.extent = validateExtentWhenDefined(layerConfig.initialSettings.extent);

      // Add projection definition if not already included
      if (fullExtent.spatialReference) {
        try {
          Projection.getProjectionFromObj(fullExtent.spatialReference);
        } catch (error: unknown) {
          logger.logWarning('Unsupported projection, attempting to add projection now.', error);
          await Projection.addProjection(fullExtent.spatialReference);
        }
      }

      // Set zoom levels. Vector tiles may be unique as they can have both scale and zoom level properties
      // First set the min/max scales based on the service / config
      // * Infinity and -Infinity are used as extreme zoom level values in case the value is undefined
      if (minScale) {
        // eslint-disable-next-line no-param-reassign
        layerConfig.minScale = Math.min(layerConfig.minScale ?? Infinity, minScale);
      }

      if (maxScale) {
        // eslint-disable-next-line no-param-reassign
        layerConfig.maxScale = Math.max(layerConfig.maxScale ?? -Infinity, maxScale);
      }

      // Second, set the min/max zoom levels based on the service / config.
      // GV Vector tiles should always have a minZoom and maxZoom, so -Infinity or Infinity should never be set as a value
      if (minZoom) {
        // eslint-disable-next-line no-param-reassign
        layerConfig.initialSettings.minZoom = Math.max(layerConfig.initialSettings.minZoom ?? -Infinity, minZoom);
      }

      if (maxZoom) {
        // eslint-disable-next-line no-param-reassign
        layerConfig.initialSettings.maxZoom = Math.min(layerConfig.initialSettings.maxZoom ?? Infinity, maxZoom);
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
  protected override async onProcessOneLayerEntry(layerConfig: VectorTilesLayerEntryConfig): Promise<GVVectorTiles> {
    // Sure call parent
    const layer = (await super.onProcessOneLayerEntry(layerConfig)) as GVVectorTiles;

    // TODO: Refactor - Layers refactoring. What is this doing? See how we can do this in the new layers. Can it be done before?
    const resolutions = layer.getOLSource()?.getTileGrid()?.getResolutions();

    let appliedStyle = layerConfig.styleUrl || this.getMetadata()?.defaultStyles;

    if (appliedStyle) {
      if (!appliedStyle.endsWith('/root.json')) appliedStyle = `${appliedStyle}/root.json`;

      applyStyle(layer.getOLLayer(), appliedStyle, {
        resolutions: resolutions?.length ? resolutions : [],
      }).catch((error: unknown) => {
        // Log
        logger.logPromiseFailed('applyStyle in processOneLayerEntry in VectorTiles', error);
      });
    }

    // Return the layer
    return layer;
  }

  /**
   * Overrides the creation of the GV Layer
   * @param {VectorTilesLayerEntryConfig} layerConfig - The layer entry configuration.
   * @returns {GVVectorTiles} The GV Layer
   */
  protected override onCreateGVLayer(layerConfig: VectorTilesLayerEntryConfig): GVVectorTiles {
    // Create the source
    const source = VectorTiles.createVectorTileSource(layerConfig, this.fallbackProjection);

    // Create the GV Layer
    const gvLayer = new GVVectorTiles(source, layerConfig);

    // Return it
    return gvLayer;
  }

  /**
   * Initializes a GeoView layer configuration for an Vector Tiles layer.
   * This method creates a basic TypeGeoviewLayerConfig using the provided
   * ID, name, and metadata access path URL. It then initializes the layer entries by calling
   * `initGeoViewLayerEntries`, which may involve fetching metadata or sublayer info.
   * @param {string} geoviewLayerId - A unique identifier for the layer.
   * @param {string} geoviewLayerName - The display name of the layer.
   * @param {string} metadataAccessPath - The full service URL to the layer endpoint.
   * @returns {Promise<TypeGeoviewLayerConfig>} A promise that resolves to an initialized GeoView layer configuration with layer entries.
   */
  static initGeoviewLayerConfig(
    geoviewLayerId: string,
    geoviewLayerName: string,
    metadataAccessPath: string
  ): Promise<TypeGeoviewLayerConfig> {
    // Create the Layer config
    const myLayer = new VectorTiles({ geoviewLayerId, geoviewLayerName, metadataAccessPath } as TypeVectorTilesConfig, 'EPSG:4326'); // Dummy projection just to be able to initialize it.
    return myLayer.initGeoViewLayerEntries();
  }

  /**
   * Creates a configuration object for a XYZTiles layer.
   * This function constructs a `TypeVectorTilesConfig` object that describes an XYZTiles layer
   * and its associated entry configurations based on the provided parameters.
   * @param {string} geoviewLayerId - A unique identifier for the GeoView layer.
   * @param {string} geoviewLayerName - The display name of the GeoView layer.
   * @param {string} metadataAccessPath - The URL or path to access metadata.
   * @param {boolean} isTimeAware - Indicates whether the layer supports time-based filtering.
   * @param {TypeLayerEntryShell[]} layerEntries - An array of layer entries objects to be included in the configuration.
   * @returns {TypeVectorTilesConfig} The constructed configuration object for the XYZTiles layer.
   */
  static createGeoviewLayerConfig(
    geoviewLayerId: string,
    geoviewLayerName: string,
    metadataAccessPath: string,
    isTimeAware: boolean,
    layerEntries: TypeLayerEntryShell[]
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
        geoviewLayerConfig,
        layerId: `${layerEntry.id}`,
        tileGrid: layerEntry.tileGrid,
      });
      return layerEntryConfig;
    });

    // Return it
    return geoviewLayerConfig;
  }

  /**
   * Processes a VectorTiles GeoviewLayerConfig and returns a promise
   * that resolves to an array of `ConfigBaseClass` layer entry configurations.
   *
   * This method:
   * 1. Creates a Geoview layer configuration using the provided parameters.
   * 2. Instantiates a layer with that configuration.
   * 3. Processes the layer configuration and returns the result.
   * @param {string} geoviewLayerId - The unique identifier for the GeoView layer.
   * @param {string} geoviewLayerName - The display name for the GeoView layer.
   * @param {string} url - The URL of the service endpoint.
   * @param {string[]} layerIds - An array of layer IDs to include in the configuration.
   * @param {boolean} isTimeAware - Indicates if the layer is time aware.
   * @param {ProjectionLike} fallbackProjection - Indicates the projection that should be used in case not set.
   * @returns {Promise<ConfigBaseClass[]>} A promise that resolves to an array of layer configurations.
   */
  static processGeoviewLayerConfig(
    geoviewLayerId: string,
    geoviewLayerName: string,
    url: string,
    layerIds: string[],
    isTimeAware: boolean,
    fallbackProjection: ProjectionLike
  ): Promise<ConfigBaseClass[]> {
    // Create the Layer config
    const layerConfig = VectorTiles.createGeoviewLayerConfig(
      geoviewLayerId,
      geoviewLayerName,
      url,
      isTimeAware,
      layerIds.map((layerId) => {
        return { id: layerId };
      })
    );

    // Create the class from geoview-layers package
    const myLayer = new VectorTiles(layerConfig, fallbackProjection);

    // Process it
    return AbstractGeoViewLayer.processConfig(myLayer);
  }

  /**
   * Creates a VectorTileSource from a layer config.
   * This encapsulates projection, tileGrid, and format setup.
   * @param {VectorTilesLayerEntryConfig} layerConfig - Configuration object for the vector tile layer.
   * @param {ProjectionLike} fallbackProjection - Fallback projection if none is provided in the config.
   * @returns An initialized VectorTileSource ready for use in a layer.
   * @throws If required config fields like dataAccessPath are missing.
   */
  static createVectorTileSource(layerConfig: VectorTilesLayerEntryConfig, fallbackProjection: ProjectionLike): VectorTileSource {
    const { source } = layerConfig;

    // Ensure the dataAccessPath is defined; required for fetching tiles
    if (!source?.dataAccessPath) {
      throw new LayerDataAccessPathMandatoryError(layerConfig.layerPath, layerConfig.getLayerName());
    }

    // Create the source options
    const sourceOptions: SourceOptions = {
      url: source.dataAccessPath,
      format: new MVT(),
    };

    // Assign projection from config if present, otherwise use fallback (e.g., map's current projection)
    sourceOptions.projection = source.projection ? `EPSG:${source.projection}` : `${fallbackProjection}`;

    // Validate the spatial reference in the tileInfo (if set) is the same as the source
    if (
      layerConfig.getServiceMetadata()?.tileInfo?.spatialReference?.wkid &&
      sourceOptions.projection.replace('EPSG:', '') !== layerConfig.getServiceMetadata()!.tileInfo.spatialReference.wkid.toString()
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
        resolutions: source.tileGrid.resolutions,
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
