import XYZ, { Options as SourceOptions } from 'ol/source/XYZ';
import TileGrid, { Options as TileGridOptions } from 'ol/tilegrid/TileGrid';

import defaultsDeep from 'lodash/defaultsDeep';

import { AbstractGeoViewRaster } from '@/geo/layer/geoview-layers/raster/abstract-geoview-raster';
import { TypeSourceTileInitialConfig, TypeGeoviewLayerConfig, CONST_LAYER_TYPES } from '@/api/config/types/layer-schema-types';
import { validateExtentWhenDefined } from '@/geo/utils/utilities';
import {
  TypeMetadataXYZTiles,
  XYZTilesLayerEntryConfig,
} from '@/core/utils/config/validation-classes/raster-validation-classes/xyz-layer-entry-config';
import {
  LayerEntryConfigInvalidLayerEntryConfigError,
  LayerEntryConfigLayerIdNotFoundError,
} from '@/core/exceptions/layer-entry-config-exceptions';
import { LayerDataAccessPathMandatoryError } from '@/core/exceptions/layer-exceptions';
import { GVXYZTiles } from '@/geo/layer/gv-layers/tile/gv-xyz-tiles';
import { ConfigBaseClass, TypeLayerEntryShell } from '@/core/utils/config/validation-classes/config-base-class';
import { AbstractGeoViewLayer } from '@/geo/layer/geoview-layers/abstract-geoview-layers';

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
 *
 * @exports
 * @class XYZTiles
 */
export class XYZTiles extends AbstractGeoViewRaster {
  /**
   * Constructs a XYZTiles Layer configuration processor.
   * @param {TypeXYZTilesConfig} layerConfig the layer configuration
   */
  constructor(layerConfig: TypeXYZTilesConfig) {
    super(CONST_LAYER_TYPES.XYZ_TILES, layerConfig);
  }

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   * @override
   * @returns {TypeMetadataXYZTiles | undefined} The strongly-typed layer configuration specific to this layer.
   */
  override getMetadata(): TypeMetadataXYZTiles | undefined {
    return super.getMetadata() as TypeMetadataXYZTiles | undefined;
  }

  /**
   * Overrides the way a geoview layer config initializes its layer entries.
   * @returns {Promise<TypeGeoviewLayerConfig>} A promise resolved once the layer entries have been initialized.
   */
  protected override onInitLayerEntries(): Promise<TypeGeoviewLayerConfig> {
    // Redirect
    return Promise.resolve(
      // TODO: Check - Check if there's a way to better determine the isTimeAware flag, defaults to false, how is it used here?
      XYZTiles.createGeoviewLayerConfig(this.geoviewLayerId, this.geoviewLayerName, this.metadataAccessPath, false, [])
    );
  }

  /**
   * Overrides the validation of a layer entry config.
   * @param {ConfigBaseClass} layerConfig - The layer entry config to validate.
   */
  protected override onValidateLayerEntryConfig(layerConfig: ConfigBaseClass): void {
    // TODO: Update to properly use metadata from map server
    // Note that XYZ metadata as we defined it does not contain metadata layer group. If you need geojson layer group,
    // you can define them in the configuration section.

    // Get the metadata
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
   * @param {XYZTilesLayerEntryConfig} layerConfig - The layer entry configuration to process.
   * @returns {Promise<XYZTilesLayerEntryConfig>} A promise that the layer entry configuration has gotten its metadata processed.
   */
  protected override onProcessLayerMetadata(layerConfig: XYZTilesLayerEntryConfig): Promise<XYZTilesLayerEntryConfig> {
    // TODO Need to see why the metadata isn't handled properly for ESRI XYZ tiles.
    // GV Possibly caused by a difference between OGC and ESRI XYZ Tiles, but only have ESRI XYZ Tiles as example currently
    // GV Also, might be worth checking out OGCMapTile for this? https://openlayers.org/en/latest/examples/ogc-map-tiles-geographic.html
    // GV Seems like it can deal with less specificity in the url and can handle the x y z internally?

    // Get the metadata
    const metadata = this.getMetadata();

    if (metadata) {
      let metadataLayerConfigFound: XYZTilesLayerEntryConfig | undefined;
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
        // metadataLayerConfigFound can not be undefined because we have already validated the config exist
        layerConfig.setLayerMetadata(metadataLayerConfigFound);
        // eslint-disable-next-line no-param-reassign
        layerConfig.source = defaultsDeep(layerConfig.source, metadataLayerConfigFound.source);
        // eslint-disable-next-line no-param-reassign
        layerConfig.initialSettings = defaultsDeep(layerConfig.initialSettings, metadataLayerConfigFound.initialSettings);
        // eslint-disable-next-line no-param-reassign
        layerConfig.initialSettings.extent = validateExtentWhenDefined(layerConfig.initialSettings.extent);

        // Set zoom limits for max / min zooms
        const maxScale = metadataLayerConfigFound?.maxScale as number;
        const minScaleDenominator = metadataLayerConfigFound?.minScaleDenominator;
        // eslint-disable-next-line no-param-reassign
        layerConfig.maxScale =
          !maxScale && !minScaleDenominator
            ? layerConfig.maxScale
            : Math.max(maxScale ?? -Infinity, minScaleDenominator ?? -Infinity, layerConfig.maxScale ?? -Infinity);

        const minScale = metadataLayerConfigFound?.minScale as number;
        const maxScaleDenominator = metadataLayerConfigFound?.maxScaleDenominator;
        // eslint-disable-next-line no-param-reassign
        layerConfig.minScale =
          !minScale && !maxScaleDenominator
            ? layerConfig.minScale
            : Math.min(minScale ?? Infinity, maxScaleDenominator ?? Infinity, layerConfig.minScale ?? Infinity);
      }
    }

    // Return the layer config
    return Promise.resolve(layerConfig);
  }

  /**
   * Overrides the creation of the GV Layer
   * @param {XYZTilesLayerEntryConfig} layerConfig - The layer entry configuration.
   * @returns {GVXYZTiles} The GV Layer
   */
  protected override onCreateGVLayer(layerConfig: XYZTilesLayerEntryConfig): GVXYZTiles {
    // Create the source
    const source = XYZTiles.createXYZSource(layerConfig);

    // Create the GV Layer
    const gvLayer = new GVXYZTiles(source, layerConfig);

    // Return it
    return gvLayer;
  }

  /**
   * Initializes a GeoView layer configuration for a XYZ Tiles layer.
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
    const myLayer = new XYZTiles({ geoviewLayerId, geoviewLayerName, metadataAccessPath } as TypeXYZTilesConfig);
    return myLayer.initGeoViewLayerEntries();
  }

  /**
   * Creates a configuration object for a XYZTiles layer.
   * This function constructs a `TypeXYZTilesConfig` object that describes an XYZTiles layer
   * and its associated entry configurations based on the provided parameters.
   * @param {string} geoviewLayerId - A unique identifier for the GeoView layer.
   * @param {string} geoviewLayerName - The display name of the GeoView layer.
   * @param {string} metadataAccessPath - The URL or path to access metadata.
   * @param {boolean} isTimeAware - Indicates whether the layer supports time-based filtering.
   * @param {TypeLayerEntryShell[]} layerEntries - An array of layer entries objects to be included in the configuration.
   * @returns {TypeXYZTilesConfig} The constructed configuration object for the XYZTiles layer.
   */
  static createGeoviewLayerConfig(
    geoviewLayerId: string,
    geoviewLayerName: string,
    metadataAccessPath: string,
    isTimeAware: boolean,
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
        layerName: `${layerEntry.name || layerEntry.id}`,
        source: {
          dataAccessPath: metadataAccessPath,
        },
      });
      return layerEntryConfig;
    });

    // Return it
    return geoviewLayerConfig;
  }

  /**
   * Processes an XYZ Tiles GeoviewLayerConfig and returns a promise
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
   * @param {XYZTilesLayerEntryConfig} layerConfig - The configuration for the XYZ layer.
   * @returns A fully configured XYZ source.
   * @throws If required config fields like dataAccessPath are missing.
   */
  static createXYZSource(layerConfig: XYZTilesLayerEntryConfig): XYZ {
    const { source } = layerConfig;

    if (!source?.dataAccessPath) {
      throw new LayerDataAccessPathMandatoryError(layerConfig.layerPath, layerConfig.getLayerName());
    }

    const sourceOptions: SourceOptions = {
      url: source.dataAccessPath,
      attributions: layerConfig.getAttributions(),
      crossOrigin: source.crossOrigin ?? 'Anonymous',
      projection: source.projection ? `EPSG:${source.projection}` : undefined,
    };

    if (source.tileGrid) {
      const tileGridOptions: TileGridOptions = {
        origin: source.tileGrid.origin,
        resolutions: source.tileGrid.resolutions,
        tileSize: source.tileGrid.tileSize,
        extent: source.tileGrid.extent,
      };

      sourceOptions.tileGrid = new TileGrid(tileGridOptions);
    }

    return new XYZ(sourceOptions);
  }
}
