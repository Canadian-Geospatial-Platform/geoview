import type { Options as SourceOptions } from 'ol/source/XYZ';
import type { Options as TileGridOptions } from 'ol/tilegrid/TileGrid';
import type { Projection as OLProjection } from 'ol/proj';
import XYZ from 'ol/source/XYZ';
import TileGrid from 'ol/tilegrid/TileGrid';

import { AbstractGeoViewRaster } from '@/geo/layer/geoview-layers/raster/abstract-geoview-raster';
import type { DisplayDateMode } from '@/api/types/map-schema-types';
import type { TypeSourceTileInitialConfig, TypeGeoviewLayerConfig } from '@/api/types/layer-schema-types';
import { CONST_LAYER_TYPES } from '@/api/types/layer-schema-types';
import { LayerServiceMetadataUnableToFetchError } from '@/core/exceptions/layer-exceptions';
import type { ConfigBaseClass, TypeLayerEntryShell } from '@/api/config/validation-classes/config-base-class';
import {
  XYZTilesLayerEntryConfig,
  type TypeMetadataXYZTiles,
} from '@/api/config/validation-classes/raster-validation-classes/xyz-layer-entry-config';
import {
  LayerEntryConfigInvalidLayerEntryConfigError,
  LayerEntryConfigLayerIdNotFoundError,
} from '@/core/exceptions/layer-entry-config-exceptions';
import { GVXYZTiles } from '@/geo/layer/gv-layers/tile/gv-xyz-tiles';
import { AbstractGeoViewLayer } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import type { TypeProjection } from '@/geo/utils/projection';
import { validateAndPingUrl } from '@/core/utils/utilities';

// ? Do we keep this TODO ? Dynamic parameters can be placed on the dataAccessPath and initial settings can be used on xyz-tiles.
// TODO: Implement method to validate XYZ tile service
//
// NOTE: The signature of tile services may vary depending of if it's a dynamic or static tile service. Dynamic tile services solutions like TiTiler allows users
// to define query parameters such as a COG url, a TileMatrixSet and a resampling method.
// e.g.: http://{s}.somedomain.com/blabla/{z}/{x}/{y}{r}.png?url=http://smtg/cog.tif&TileMatrixSetId=CanadianNAD83_LCC&resampling_method=bilinear

// TODO: Add more customization (minZoom, maxZoom, TMS)

export type TypeSourceImageXYZTilesInitialConfig = TypeSourceTileInitialConfig;

export interface TypeXYZTilesConfig extends Omit<TypeGeoviewLayerConfig, 'listOfLayerEntryConfig'> {
  geoviewLayerType: typeof CONST_LAYER_TYPES.XYZ_TILES;
  listOfLayerEntryConfig: XYZTilesLayerEntryConfig[];
}

/**
 * A class to add xyz-tiles layer
 */
export class XYZTiles extends AbstractGeoViewRaster {
  /**
   * Constructs a XYZTiles Layer configuration processor.
   *
   * @param layerConfig - The layer configuration
   */
  // The constructor is not useless, it narrows down the accepted parameter type.
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(layerConfig: TypeXYZTilesConfig) {
    super(layerConfig);
  }

  // #region OVERRIDES

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   *
   * @returns The strongly-typed layer configuration specific to this layer
   */
  override getGeoviewLayerConfig(): TypeXYZTilesConfig {
    return super.getGeoviewLayerConfig() as TypeXYZTilesConfig;
  }

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   *
   * @returns The strongly-typed metadata specific to this layer
   */
  override getMetadata(): TypeMetadataXYZTiles | undefined {
    return super.getMetadata() as TypeMetadataXYZTiles | undefined;
  }

  /**
   * Overrides the way a geoview layer config initializes its layer entries.
   *
   * @returns A promise that resolves once the layer entries have been initialized
   */
  protected override onInitLayerEntries(): Promise<TypeGeoviewLayerConfig> {
    // Redirect
    return Promise.resolve(
      XYZTiles.createGeoviewLayerConfig(
        this.getGeoviewLayerId(),
        this.getGeoviewLayerName(),
        this.getMetadataAccessPath(),
        this.getGeoviewLayerConfig().isTimeAware,
        []
      )
    );
  }

  /**
   * Overrides the validation of a layer entry config.
   *
   * @param layerConfig - The layer entry config to validate
   */
  protected override onValidateLayerEntryConfig(layerConfig: ConfigBaseClass): void {
    // GV Note that XYZ metadata as we defined it does not contain metadata layer group. If you need geojson layer group,
    // GV you can define them in the configuration section.

    // Get the metadata
    // TODO: METADATA - Add support/validation for metadata coming from another XYZ Tile service than Esri. Search id: f32d024b
    // TO.DOCONT: e.g. https://tiles.stadiamaps.com/tiles/osm_bright/{z}/{x}/{y}.png
    const metadata = this.getMetadata();

    if (Array.isArray(metadata?.listOfLayerEntryConfig)) {
      const metadataLayerList = metadata.listOfLayerEntryConfig;
      const foundEntry = metadataLayerList.find((layerMetadata) => layerMetadata.layerId === layerConfig.layerId);
      if (!foundEntry) {
        // Add a layer load error
        this.addLayerLoadError(new LayerEntryConfigLayerIdNotFoundError(layerConfig), layerConfig);
      }
      return;
    }

    // ESRI MapServer Implementation
    if (Array.isArray(metadata?.layers)) {
      const metadataLayerList = metadata.layers;
      const foundEntry = metadataLayerList.find((layerMetadata) => layerMetadata.id.toString() === layerConfig.layerId);
      if (!foundEntry) {
        // Add a layer load error
        this.addLayerLoadError(new LayerEntryConfigLayerIdNotFoundError(layerConfig), layerConfig);
      }
      return;
    }

    // Throw an invalid layer entry config error
    throw new LayerEntryConfigInvalidLayerEntryConfigError(layerConfig);
  }

  /**
   * Overrides the way the layer metadata is processed.
   *
   * @param layerConfig - The layer entry configuration to process
   * @param displayDateMode - The display date mode to use for processing time dimensions in the metadata
   * @param mapProjection - Optional map projection
   * @param abortSignal - Optional {@link AbortSignal} used to cancel the layer creation process
   * @returns A promise that resolves once the layer entry configuration has gotten its metadata processed
   * @throws {LayerServiceMetadataUnableToFetchError} When the metadata fetch fails or contains an error
   */
  protected override async onProcessLayerMetadata(
    layerConfig: XYZTilesLayerEntryConfig,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    displayDateMode: DisplayDateMode,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    mapProjection?: OLProjection,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    abortSignal?: AbortSignal
  ): Promise<XYZTilesLayerEntryConfig> {
    // TODO: METADATA - Need to see why the metadata isn't handled properly for ESRI XYZ tiles. Search id: f32d024b
    // GV Possibly caused by a difference between OGC and ESRI XYZ Tiles, but only have ESRI XYZ Tiles as example currently
    // GV Also, might be worth checking out OGCMapTile for this? https://openlayers.org/en/latest/examples/ogc-map-tiles-geographic.html
    // GV Seems like it can deal with less specificity in the url and can handle the x y z internally?

    // Get the data access path
    const dataAccessPath = layerConfig.getDataAccessPath();

    // Get the configProxyUrl
    const configProxyUrl = this.getConfigProxyUrl();

    // Test to reach one tile to see if the service is reachable
    const test = await validateAndPingUrl(layerConfig.getDataAccessPath(), configProxyUrl);

    // If not reachable, throw an error immediately
    if (!test.isReachable)
      throw new LayerServiceMetadataUnableToFetchError(
        layerConfig.getGeoviewLayerId(),
        layerConfig.getLayerNameCascade(),
        new Error(test.error)
      );

    // If a proxy was necessary
    if (test.needsProxy) {
      // Indicate the proxy that was used
      layerConfig.setProxyUrl(configProxyUrl);

      // Update the access path to use the proxy if one was required
      layerConfig.setDataAccessPath(`${configProxyUrl}?${dataAccessPath}`);
    }

    // Get the metadata
    const metadata = this.getMetadata();

    // Process the metadata and set it on the layer config
    await XYZTiles.initLayerMetadata(layerConfig, metadata);

    // Return the layer config
    return Promise.resolve(layerConfig);
  }

  /**
   * Overrides the creation of the GV Layer
   *
   * @param layerConfig - The layer entry configuration
   * @returns The GV Layer
   */
  protected override onCreateGVLayer(layerConfig: XYZTilesLayerEntryConfig): GVXYZTiles {
    // Create the source
    const source = XYZTiles.createXYZSource(layerConfig);

    // Create the GV Layer
    const gvLayer = new GVXYZTiles(source, layerConfig);

    // Return it
    return gvLayer;
  }

  // #endregion OVERRIDES

  // #region STATIC PUBLIC METHODS

  /**
   * Creates a configuration object for a XYZTiles layer.
   *
   * This function constructs a `TypeXYZTilesConfig` object that describes an XYZTiles layer
   * and its associated entry configurations based on the provided parameters.
   *
   * @param geoviewLayerId - A unique identifier for the GeoView layer
   * @param geoviewLayerName - The display name of the GeoView layer
   * @param metadataAccessPath - The URL or path to access metadata
   * @param isTimeAware - Indicates whether the layer supports time-based filtering
   * @param layerEntries - An array of layer entries objects to be included
   * in the configuration.
   * @returns The constructed configuration object for the XYZTiles layer
   */
  static createGeoviewLayerConfig(
    geoviewLayerId: string,
    geoviewLayerName: string,
    metadataAccessPath: string,
    isTimeAware: boolean | undefined,
    layerEntries: TypeLayerEntryShell[]
  ): TypeXYZTilesConfig {
    const geoviewLayerConfig: TypeXYZTilesConfig = {
      geoviewLayerId,
      geoviewLayerName,
      metadataAccessPath,
      geoviewLayerType: CONST_LAYER_TYPES.XYZ_TILES,
      isTimeAware,
      listOfLayerEntryConfig: [],
    };
    geoviewLayerConfig.listOfLayerEntryConfig = layerEntries.map((layerEntry) => {
      const layerEntryConfig = new XYZTilesLayerEntryConfig({
        geoviewLayerConfig,
        layerId: `${layerEntry.id}`,
        ...(layerEntry.layerName && { layerName: `${layerEntry.layerName}` }),
      });
      return layerEntryConfig;
    });

    // Return it
    return geoviewLayerConfig;
  }

  /**
   * Initializes a GeoView layer configuration for a XYZ Tiles layer.
   *
   * This method creates a basic TypeGeoviewLayerConfig using the provided
   * ID, name, and metadata access path URL. It then initializes the layer entries by calling
   * `initGeoViewLayerEntries`, which may involve fetching metadata or sublayer info.
   *
   * @param geoviewLayerId - A unique identifier for the layer
   * @param geoviewLayerName - The display name of the layer
   * @param metadataAccessPath - The full service URL to the layer endpoint
   * @param isTimeAware - Optional to indicates whether the layer supports time-based filtering
   * @returns A promise that resolves to an initialized GeoView layer configuration with layer entries
   */
  static initGeoviewLayerConfig(
    geoviewLayerId: string,
    geoviewLayerName: string,
    metadataAccessPath: string,
    isTimeAware?: boolean
  ): Promise<TypeGeoviewLayerConfig> {
    // Create the Layer config
    const myLayer = new XYZTiles({ geoviewLayerId, geoviewLayerName, metadataAccessPath, isTimeAware } as TypeXYZTilesConfig);
    return myLayer.initGeoViewLayerEntries();
  }

  /**
   * Initializes the metadata for a given XYZTiles layer entry configuration.
   *
   * This method searches for the corresponding metadata entry in the provided metadata object based on the layer ID.
   * If a matching metadata entry is found, it sets the layer metadata on the configuration and initializes the source and initial settings using the metadata.
   *
   * @param layerConfig - The XYZTiles layer entry configuration to initialize with metadata
   * @param metadata - The metadata object containing information about the layers, which may include a list of layer entry configurations or a list of layers (for ESRI MapServer XYZ Tiles)
   */
  static async initLayerMetadata(layerConfig: XYZTilesLayerEntryConfig, metadata: TypeMetadataXYZTiles | undefined): Promise<void> {
    // If not metadata, skip
    if (!metadata) return;

    // If there's a spatial reference in the metadata
    let projection: TypeProjection | string | undefined;
    if (metadata.spatialReference) projection = metadata.spatialReference;

    // If there's a crs in the metadata
    if (!projection && metadata.crs) projection = metadata.crs;

    // Set the metadata projection code
    if (projection) await layerConfig.initProjectionFromMetadata(projection);

    let metadataLayerConfigFound;
    if (metadata.listOfLayerEntryConfig) {
      metadataLayerConfigFound = metadata.listOfLayerEntryConfig.find(
        (metadataLayerConfig) => metadataLayerConfig.layerId === layerConfig.layerId
      );
    }

    // For ESRI MapServer XYZ Tiles
    if (metadata.layers) {
      metadataLayerConfigFound = metadata.layers.find((metadataLayerConfig) => metadataLayerConfig.id === layerConfig.layerId);
    }

    // If found
    if (metadataLayerConfigFound) {
      // Set the layer metadata. metadataLayerConfigFound can't be undefined because we have already validated the config exist
      layerConfig.setLayerMetadata(metadataLayerConfigFound);

      // Initialize the source by filling the blanks with the information from the metadata
      layerConfig.initSourceFromMetadata(metadataLayerConfigFound.source);

      // Initialize the initial settings by filling the blanks with the information from the metadata
      layerConfig.initInitialSettingsFromMetadata(metadataLayerConfigFound.initialSettings);

      // Set zoom limits for max / min zooms
      // GV MinScaleDenominator is actually the maxScale and MaxScaleDenominator is actually the minScale
      const minScale = metadataLayerConfigFound?.minScale || metadataLayerConfigFound?.maxScaleDenominator;
      layerConfig.initMinScaleFromMetadata(minScale);
      const maxScale = metadataLayerConfigFound?.maxScale || metadataLayerConfigFound?.minScaleDenominator;
      layerConfig.initMaxScaleFromMetadata(maxScale);
    }
  }

  /**
   * Processes an XYZ Tiles GeoviewLayerConfig and returns a promise
   * that resolves to an array of `ConfigBaseClass` layer entry configurations.
   *
   * This method:
   * 1. Creates a Geoview layer configuration using the provided parameters.
   * 2. Instantiates a layer with that configuration.
   * 3. Processes the layer configuration and returns the result.
   *
   * @param geoviewLayerId - The unique identifier for the GeoView layer
   * @param geoviewLayerName - The display name for the GeoView layer
   * @param url - The URL of the service endpoint
   * @param layerIds - An array of layer IDs to include in the configuration
   * @param isTimeAware - Indicates if the layer is time aware
   * @returns A promise that resolves to an array of layer configurations
   */
  static processGeoviewLayerConfig(
    geoviewLayerId: string,
    geoviewLayerName: string,
    url: string,
    layerIds: string[],
    isTimeAware: boolean
  ): Promise<ConfigBaseClass[]> {
    // Create the Layer config
    const layerConfig = XYZTiles.createGeoviewLayerConfig(
      geoviewLayerId,
      geoviewLayerName,
      url,
      isTimeAware,
      layerIds.map((layerId) => {
        return { id: layerId };
      })
    );

    // Create the class from geoview-layers package
    const myLayer = new XYZTiles(layerConfig);

    // Process it
    return AbstractGeoViewLayer.processConfig(myLayer);
  }

  /**
   * Creates an XYZ source from a layer config.
   *
   * @param layerConfig - The configuration for the XYZ layer
   * @returns A fully configured XYZ source
   * @throws {LayerDataAccessPathMandatoryError} When the Data Access Path was undefined, likely because initDataAccessPath wasn't called
   */
  static createXYZSource(layerConfig: XYZTilesLayerEntryConfig): XYZ {
    const sourceOptions: SourceOptions = {
      url: layerConfig.getDataAccessPath(),
      attributions: layerConfig.getAttributions(),
      crossOrigin: layerConfig.getSource().crossOrigin ?? 'Anonymous',
      projection: layerConfig.getSourceProjectionWithEPSG(),
    };

    // Get the tile grid as defined in source config
    const { tileGrid } = layerConfig.getSource();

    // If a tile grid is specified
    if (tileGrid) {
      // If tileGrid configuration exists
      const tileGridOptions: TileGridOptions = {
        origin: tileGrid?.origin,
        resolutions: tileGrid.resolutions, // TODO: MINOR - Add a validation about the 'resolutions' property always existing?
        tileSize: tileGrid?.tileSize,
        extent: tileGrid?.extent,
      };

      // Assign the tile grid
      sourceOptions.tileGrid = new TileGrid(tileGridOptions);
    }

    // Return the fully configured XYZ instance
    return new XYZ(sourceOptions);
  }

  // #endregion STATIC PUBLIC METHODS
}
