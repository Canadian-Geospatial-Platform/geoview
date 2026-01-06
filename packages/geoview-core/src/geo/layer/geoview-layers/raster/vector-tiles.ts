import type { Options as SourceOptions } from 'ol/source/VectorTile';
import VectorTileSource from 'ol/source/VectorTile';
import type { Options as TileGridOptions } from 'ol/tilegrid/TileGrid';
import TileGrid from 'ol/tilegrid/TileGrid';

import { applyStyle } from 'ol-mapbox-style';

import { MVT } from 'ol/format';
import { AbstractGeoViewLayer } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { AbstractGeoViewRaster } from '@/geo/layer/geoview-layers/raster/abstract-geoview-raster';
import type {
  TypeGeoviewLayerConfig,
  TypeTileGrid,
  TypeMetadataVectorTiles,
  TypeValidSourceProjectionCodes,
} from '@/api/types/layer-schema-types';
import { CONST_LAYER_TYPES } from '@/api/types/layer-schema-types';
import type { ConfigBaseClass, TypeLayerEntryShell } from '@/api/config/validation-classes/config-base-class';
import { Projection } from '@/geo/utils/projection';
import { VectorTilesLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/vector-tiles-layer-entry-config';
import { logger } from '@/core/utils/logger';
import { LayerEntryConfigParameterProjectionNotDefinedInSourceError } from '@/core/exceptions/layer-entry-config-exceptions';
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
  /**
   * Constructs a VectorTiles Layer configuration processor.
   * @param {TypeVectorTilesConfig} layerConfig - The layer configuration
   * @param {ProjectionLike} fallbackProjection - The map projection when this layer is being created, for validation purposes.
   */
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(layerConfig: TypeVectorTilesConfig) {
    super(layerConfig);
  }

  // #region OVERRIDES

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
      VectorTiles.createGeoviewLayerConfig(
        this.getGeoviewLayerId(),
        this.getGeoviewLayerName(),
        this.getMetadataAccessPath(),
        this.getGeoviewLayerConfig().isTimeAware,
        []
      )
    );
  }

  /**
   * Overrides the way the layer metadata is processed.
   * @param {VectorTilesLayerEntryConfig} layerConfig - The layer entry configuration to process.
   * @returns {Promise<VectorTilesLayerEntryConfig>} A promise that the layer entry configuration has gotten its metadata processed.
   */
  protected override async onProcessLayerMetadata(layerConfig: VectorTilesLayerEntryConfig): Promise<VectorTilesLayerEntryConfig> {
    // Get the metadata
    const metadata = this.getMetadata();

    if (metadata) {
      const { tileInfo, fullExtent, minScale, maxScale, minZoom, maxZoom } = metadata;
      const newTileGrid: TypeTileGrid = {
        extent: [fullExtent.xmin, fullExtent.ymin, fullExtent.xmax, fullExtent.ymax],
        origin: [tileInfo.origin.x, tileInfo.origin.y],
        resolutions: tileInfo.lods.map(({ resolution }) => resolution),
        tileSize: [tileInfo.rows, tileInfo.cols],
      };

      // eslint-disable-next-line no-param-reassign
      layerConfig.getSource().tileGrid = newTileGrid;

      // Get the spatial reference from the metadata
      const projectionMetadata = metadata.tileInfo?.spatialReference?.wkid;

      // Make sure the projection is set on the source config
      layerConfig.initProjectionFromMetadata(projectionMetadata as unknown as TypeValidSourceProjectionCodes);

      // Check if we support that projection and if not add it on-the-fly
      await Projection.addProjectionIfMissing(fullExtent.spatialReference);

      // Set zoom levels. Vector tiles may be unique as they can have both scale and zoom level properties
      layerConfig.initMinScaleFromMetadata(minScale);
      layerConfig.initMaxScaleFromMetadata(maxScale);

      // Second, set the min/max zoom levels based on the service / config.
      layerConfig.initInitialSettingsMinZoomFromMetadata(minZoom);
      layerConfig.initInitialSettingsMaxZoomFromMetadata(maxZoom);
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

    // Get the style
    let appliedStyle = layerConfig.getStyleUrl() || this.getMetadata()?.defaultStyles;

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
    const source = VectorTiles.createVectorTileSource(layerConfig);

    // Create the GV Layer
    const gvLayer = new GVVectorTiles(source, layerConfig);

    // Return it
    return gvLayer;
  }

  // #endregion OVERRIDES

  // #region STATIC METHODS

  /**
   * Initializes a GeoView layer configuration for an Vector Tiles layer.
   * This method creates a basic TypeGeoviewLayerConfig using the provided
   * ID, name, and metadata access path URL. It then initializes the layer entries by calling
   * `initGeoViewLayerEntries`, which may involve fetching metadata or sublayer info.
   * @param {string} geoviewLayerId - A unique identifier for the layer.
   * @param {string} geoviewLayerName - The display name of the layer.
   * @param {string} metadataAccessPath - The full service URL to the layer endpoint.
   * @param {boolean?} [isTimeAware] - Indicates whether the layer supports time-based filtering.
   * @returns {Promise<TypeGeoviewLayerConfig>} A promise that resolves to an initialized GeoView layer configuration with layer entries.
   * @static
   */
  static initGeoviewLayerConfig(
    geoviewLayerId: string,
    geoviewLayerName: string,
    metadataAccessPath: string,
    isTimeAware?: boolean
  ): Promise<TypeGeoviewLayerConfig> {
    // Create the Layer config
    const myLayer = new VectorTiles({ geoviewLayerId, geoviewLayerName, metadataAccessPath, isTimeAware } as TypeVectorTilesConfig);
    return myLayer.initGeoViewLayerEntries();
  }

  /**
   * Creates a configuration object for a XYZTiles layer.
   * This function constructs a `TypeVectorTilesConfig` object that describes an XYZTiles layer
   * and its associated entry configurations based on the provided parameters.
   * @param {string} geoviewLayerId - A unique identifier for the GeoView layer.
   * @param {string} geoviewLayerName - The display name of the GeoView layer.
   * @param {string} metadataAccessPath - The URL or path to access metadata.
   * @param {boolean | undefined} isTimeAware - Indicates whether the layer supports time-based filtering.
   * @param {TypeLayerEntryShell[]} layerEntries - An array of layer entries objects to be included in the configuration.
   * @returns {TypeVectorTilesConfig} The constructed configuration object for the XYZTiles layer.
   * @static
   */
  static createGeoviewLayerConfig(
    geoviewLayerId: string,
    geoviewLayerName: string,
    metadataAccessPath: string,
    isTimeAware: boolean | undefined,
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
   * @returns {Promise<ConfigBaseClass[]>} A promise that resolves to an array of layer configurations.
   * @static
   */
  static processGeoviewLayerConfig(
    geoviewLayerId: string,
    geoviewLayerName: string,
    url: string,
    layerIds: string[],
    isTimeAware: boolean
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
    const myLayer = new VectorTiles(layerConfig);

    // Process it
    return AbstractGeoViewLayer.processConfig(myLayer);
  }

  /**
   * Creates a VectorTileSource from a layer config.
   * This encapsulates projection, tileGrid, and format setup.
   * @param {VectorTilesLayerEntryConfig} layerConfig - Configuration object for the vector tile layer.
   * @returns An initialized VectorTileSource ready for use in a layer.
   * @throws {LayerDataAccessPathMandatoryError} When the Data Access Path was undefined, likely because initDataAccessPath wasn't called.
   * @throws {LayerEntryConfigParameterProjectionNotDefinedInSourceError} When the source projection isn't defined.
   * @static
   */
  static createVectorTileSource(layerConfig: VectorTilesLayerEntryConfig): VectorTileSource {
    // Get the projection from the source config
    const sourceProjection = layerConfig.getProjection();

    // If no projection for the layer
    if (!sourceProjection) {
      throw new LayerEntryConfigParameterProjectionNotDefinedInSourceError(layerConfig);
    }

    // Create the source options
    const sourceOptions: SourceOptions = {
      url: layerConfig.getDataAccessPath(),
      format: new MVT(),
      projection: layerConfig.getProjectionWithEPSG(),
    };

    // Get the tile grid
    const { tileGrid } = layerConfig.getSource();

    // Create the tile grid options
    const tileGridOptions: TileGridOptions = {
      origin: tileGrid?.origin,
      resolutions: tileGrid!.resolutions, // TODO: ADD - Add a validation about the 'resolutions' property always existing?
      tileSize: tileGrid?.tileSize,
      extent: tileGrid?.extent,
    };

    // Assign the tile grid
    sourceOptions.tileGrid = new TileGrid(tileGridOptions);

    // Return the fully configured VectorTileSource instance
    return new VectorTileSource(sourceOptions);
  }

  // #endregion STATIC METHODS
}
