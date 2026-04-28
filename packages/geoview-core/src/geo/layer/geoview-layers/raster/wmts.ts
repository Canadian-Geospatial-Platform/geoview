import type { Options as SourceOptions } from 'ol/source/WMTS';
import WMTSSource from 'ol/source/WMTS';
import { get as getProjection } from 'ol/proj';
import { getTopLeft, getWidth } from 'ol/extent';
import type { Projection as OLProjection } from 'ol/proj';
import WMTSTileGrid from 'ol/tilegrid/WMTS';

import { AbstractGeoViewRaster } from '@/geo/layer/geoview-layers/raster/abstract-geoview-raster';
import type { TypeSourceTileInitialConfig, TypeGeoviewLayerConfig } from '@/api/types/layer-schema-types';
import { CONST_LAYER_TYPES } from '@/api/types/layer-schema-types';
import type {
  TypeMetadataWMTS,
  TypeMetadataWMTSLayer,
  TypeWMTSTileMatrixSet,
} from '@/api/config/validation-classes/raster-validation-classes/ogc-wmts-layer-entry-config';
import { OgcWmtsLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/ogc-wmts-layer-entry-config';
import { GVWMTS } from '@/geo/layer/gv-layers/tile/gv-wmts';
import type { ConfigBaseClass, TypeLayerEntryShell } from '@/api/config/validation-classes/config-base-class';
import { AbstractGeoViewLayer } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { GeoUtilities } from '@/geo/utils/utilities';
import { LayerServiceMetadataUnableToFetchError, LayerWMTSMetadataError } from '@/core/exceptions/layer-exceptions';
import { formatError } from '@/core/exceptions/core-exceptions';
import type { GroupLayerEntryConfig } from '@/api/config/validation-classes/group-layer-entry-config';
import { Projection } from '@/geo/utils/projection';
import type { DisplayDateMode } from '@/api/types/map-schema-types';

export interface TypeSourceImageWMTSInitialConfig extends TypeSourceTileInitialConfig {
  // The style identifier to use for this WMTS layer, will use "default" if not specified.
  wmtsStyle?: string;
  // The service extent to use when building the tile grid without metadata (e.g. [minX, minY, maxX, maxY]).
  extent?: [number, number, number, number];
  // The number of resolution levels (zoom levels) to generate when building the tile grid without metadata.
  resolutionLevels?: number;
}

export interface TypeWmtsLayerConfig extends TypeGeoviewLayerConfig {
  geoviewLayerType: typeof CONST_LAYER_TYPES.WMTS;
  listOfLayerEntryConfig: (GroupLayerEntryConfig | OgcWmtsLayerEntryConfig)[];
}

/**
 * A class to add wmts layer
 */
export class WMTS extends AbstractGeoViewRaster {
  /**
   * Constructs a WMTS Layer configuration processor.
   *
   * @param layerConfig - The layer configuration
   */
  // The constructor is not useless, it narrows down the accepted parameter type.
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(layerConfig: TypeWmtsLayerConfig) {
    super(layerConfig);
  }

  // #region OVERRIDES

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   *
   * @returns The strongly-typed layer configuration specific to this layer.
   */
  override getGeoviewLayerConfig(): TypeWmtsLayerConfig {
    return super.getGeoviewLayerConfig() as TypeWmtsLayerConfig;
  }

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   *
   * @returns The strongly-typed metadata specific to this layer.
   */
  override getMetadata(): TypeMetadataWMTS | undefined {
    return super.getMetadata() as TypeMetadataWMTS | undefined;
  }

  /**
   * Fetches and processes service metadata for the WMTS layer.
   *
   * Depending on whether the metadata URL points to an XML document or a standard WMS endpoint,
   * this method delegates to the appropriate metadata fetching logic.
   * - If the URL ends in `.xml`, a direct XML metadata fetch is performed.
   * - Otherwise, the method constructs a WMS GetCapabilities request.
   *   - If no specific layer configs are provided, a single metadata fetch is made.
   *   - If layer configs are present (e.g., Geomet use case), individual layer metadata is merged.
   *
   * @param abortSignal - Optional abort signal to handle cancelling of the process.
   * @returns A promise that resolves to the parsed metadata object,
   * or `undefined` if metadata could not be retrieved or no capabilities were found.
   * @throws {LayerServiceMetadataUnableToFetchError} When the metadata fetch fails or contains an error.
   */
  protected override onFetchServiceMetadata<T = TypeMetadataWMTS | undefined>(abortSignal?: AbortSignal): Promise<T> {
    // Construct a proper WMTS GetCapabilities URL
    let url = this.getMetadataAccessPath();
    // Ensure HTTPS
    if (url.toLowerCase().startsWith('http:')) {
      url = `https${url.slice(4)}`;
    }

    // Fetch the XML
    return this.#fetchXmlServiceMetadata(url, abortSignal) as Promise<T>;
  }

  /**
   * This method reads the service metadata from a XML metadataAccessPath.
   *
   * @param metadataUrl - The metadataAccessPath
   * @param abortSignal - Optional abort signal to handle cancelling of the process.
   * @returns A promise that resolves once the execution is completed.
   * @throws {LayerServiceMetadataUnableToFetchError} When the metadata fetch fails or contains an error.
   */
  async #fetchXmlServiceMetadata(metadataUrl: string, abortSignal?: AbortSignal): Promise<TypeMetadataWMTS> {
    let metadata;
    try {
      // Fetch it
      metadata = await WMTS.fetchMetadata(metadataUrl, abortSignal);
    } catch (error: unknown) {
      // Throw
      throw new LayerServiceMetadataUnableToFetchError(
        this.getGeoviewLayerId(),
        this.getLayerEntryNameOrGeoviewLayerName(),
        formatError(error)
      );
    }

    // Return the metadata
    return metadata;
  }

  /**
   * Overrides the way a geoview layer config initializes its layer entries.
   *
   * @returns A promise that resolves once the layer entries have been initialized.
   */
  protected override async onInitLayerEntries(): Promise<TypeGeoviewLayerConfig> {
    // Fetch the metadata
    const metadata = await this.onFetchServiceMetadata();

    // Now that we have metadata
    const layers = metadata?.Capabilities?.Contents.Layer;

    // Get all entries
    const entries = Array.isArray(layers)
      ? layers.map((layer) => {
          return {
            id: layer['ows:Identifier'],
            layerId: layer['ows:Identifier'],
            layerName: layer['ows:Title'],
          };
        })
      : [
          {
            id: layers!['ows:Identifier'],
            layerId: layers!['ows:Identifier'],
            layerName: layers!['ows:Title'],
          },
        ];

    // Redirect
    return WMTS.createGeoviewLayerConfig(
      this.getGeoviewLayerId(),
      this.getGeoviewLayerName(),
      this.getMetadataAccessPath(),
      this.getGeoviewLayerConfig().isTimeAware,
      entries
    );
  }

  /**
   * Overrides the validation of a layer entry config.
   *
   * @param layerConfig - The layer entry config to validate.
   */
  protected override onValidateLayerEntryConfig(layerConfig: ConfigBaseClass): void {
    const metadata = this.getMetadata();
    const layerMetadata = Array.isArray(metadata?.Capabilities?.Contents?.Layer)
      ? metadata?.Capabilities?.Contents?.Layer.find((layer) => layer['ows:Identifier'] === layerConfig.layerId)
      : metadata?.Capabilities?.Contents?.Layer;

    // Initialize the layer name by filling the blanks with the name from the metadata
    layerConfig.initLayerNameFromMetadata(layerMetadata?.['ows:Title']);
  }

  /**
   * Overrides the way the layer metadata is processed.
   *
   * @param layerConfig - The layer entry configuration to process.
   * @param mapProjection - Optional map projection.
   * @param abortSignal - Optional abort signal to handle cancelling of the process.
   * @returns A promise that resolves once the layer entry configuration has gotten its metadata processed.
   * @throws {LayerWMTSMetadataError} When the metadata is missing necessary information or contains an error.
   */
  protected override async onProcessLayerMetadata(
    layerConfig: OgcWmtsLayerEntryConfig,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    displayDateMode: DisplayDateMode,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    mapProjection?: OLProjection,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    abortSignal?: AbortSignal
  ): Promise<OgcWmtsLayerEntryConfig> {
    // Get the metadata
    const metadata = this.getMetadata();

    // If no metadata (e.g. no metadataAccessPath was provided), skip metadata processing entirely
    if (!metadata) return layerConfig;

    // Find the TileMatrixSet and Layer in the metadata that corresponds to the layer entry config
    const metadataLayerFound: TypeMetadataWMTSLayer | undefined =
      metadata && Array.isArray(metadata?.Capabilities?.Contents?.Layer)
        ? metadata?.Capabilities?.Contents?.Layer.find((layer) => layer['ows:Identifier'] === layerConfig.layerId)
        : (metadata?.Capabilities?.Contents?.Layer as TypeMetadataWMTSLayer | undefined);

    let tileMatrixIdentifier = layerConfig.tileMatrixSet;
    if (!tileMatrixIdentifier && metadataLayerFound?.TileMatrixSetLink) {
      if (Array.isArray(metadataLayerFound.TileMatrixSetLink)) {
        tileMatrixIdentifier = metadataLayerFound.TileMatrixSetLink[0].TileMatrixSet;
      } else {
        tileMatrixIdentifier = metadataLayerFound.TileMatrixSetLink.TileMatrixSet;
      }
    }

    const metadataTileMatrixFound: TypeWMTSTileMatrixSet | undefined =
      metadata && Array.isArray(metadata?.Capabilities?.Contents?.TileMatrixSet)
        ? metadata?.Capabilities?.Contents?.TileMatrixSet?.find((tileMatrix) => tileMatrix['ows:Identifier'] === tileMatrixIdentifier)
        : (metadata?.Capabilities?.Contents?.TileMatrixSet as TypeWMTSTileMatrixSet | undefined);

    // If not found
    if (!metadataTileMatrixFound || !metadataLayerFound) {
      // Throw
      throw new LayerWMTSMetadataError(this.getGeoviewLayerId(), this.getLayerEntryNameOrGeoviewLayerName(), `TileMatrixSet/Layer`);
    }

    // Check if there is a TileMatrixSetLink in the layer metadata that matches the tileMatrixSet of the layer entry config
    if (!layerConfig.tileMatrixSet) {
      const layerMetadataTileMatrixSetLink: boolean = Array.isArray(metadataLayerFound.TileMatrixSetLink)
        ? metadataLayerFound.TileMatrixSetLink.some((link) => link.TileMatrixSet === tileMatrixIdentifier)
        : metadataLayerFound.TileMatrixSetLink.TileMatrixSet === tileMatrixIdentifier;

      // If not found
      if (!layerMetadataTileMatrixSetLink) {
        // Throw
        throw new LayerWMTSMetadataError(this.getGeoviewLayerId(), this.getLayerEntryNameOrGeoviewLayerName(), `TileMatrixSetLink`);
      }
    }

    // If the layer entry config doesn't have a data access path, try to get it from the metadata's GetTile operation
    if (!layerConfig.hasDataAccessPath()) {
      const getTileOperation = metadata?.Capabilities?.['ows:OperationsMetadata']?.['ows:Operation']?.find(
        (operation) => operation['@attributes'].name === 'GetTile'
      );

      const tileLink = Array.isArray(getTileOperation?.['ows:DCP']['ows:HTTP']?.['ows:Get'])
        ? getTileOperation?.['ows:DCP']?.['ows:HTTP']?.['ows:Get']?.find(
            (get) => get['ows:Constraint']?.['ows:AllowedValues']?.['ows:Value'] === 'KVP' // KVP encoding is default
          )?.['@attributes']?.['xlink:href']
        : getTileOperation?.['ows:DCP']?.['ows:HTTP']?.['ows:Get']?.['@attributes']?.['xlink:href'];

      // Set the data access path from the metadata if it wasn't already set and a link was found in the metadata
      if (tileLink) {
        layerConfig.setDataAccessPath(tileLink);
      } else {
        // Throw
        throw new LayerWMTSMetadataError(this.getGeoviewLayerId(), this.getLayerEntryNameOrGeoviewLayerName(), `KVP GetTile`);
      }
    }

    // If the metadata layer has a bounding box, set it as the initial bounds of the layer entry config
    if (metadataLayerFound['ows:WGS84BoundingBox']) {
      const lowerCorner = metadataLayerFound['ows:WGS84BoundingBox']['ows:LowerCorner'];
      const upperCorner = metadataLayerFound['ows:WGS84BoundingBox']['ows:UpperCorner'];
      const lowerCornerCoords = typeof lowerCorner === 'string' ? lowerCorner.split(' ').map(Number) : lowerCorner;
      const upperCornerCoords = typeof upperCorner === 'string' ? upperCorner.split(' ').map(Number) : upperCorner;
      layerConfig.initInitialSettingsBoundsFromMetadata([...lowerCornerCoords, ...upperCornerCoords] as [number, number, number, number]);
    }

    // Extract the projection code from the TileMatrixSet's SupportedCRS.
    let metadataProjectionCode = metadataTileMatrixFound['ows:SupportedCRS'].split(':').slice(-1)[0];
    if (metadataProjectionCode === 'CRS84') metadataProjectionCode = '4326'; // CRS84 is equivalent to EPSG:4326

    // Check if we support that projection and if not add it on-the-fly
    await Projection.addProjectionIfMissing(`EPSG:${metadataProjectionCode}`);

    // Set the metadata on the layer config
    const layerMetadata = { Layer: metadataLayerFound, TileMatrixSet: metadataTileMatrixFound };
    layerConfig.setLayerMetadata(layerMetadata);

    // Return the layer config
    return Promise.resolve(layerConfig);
  }

  /**
   * Overrides the creation of the GV Layer.
   *
   * @param layerConfig - The layer entry configuration.
   * @returns The GV Layer
   */
  protected override onCreateGVLayer(layerConfig: OgcWmtsLayerEntryConfig): GVWMTS {
    // Create the source
    const source: WMTSSource = WMTS.createWMTSSource(layerConfig);

    // Create the GV Layer
    const gvLayer = new GVWMTS(source, layerConfig);

    // Return it
    return gvLayer;
  }

  // #endregion OVERRIDES

  // #region STATIC METHODS

  /**
   * Fetches the metadata for WMS Capabilities.
   *
   * @param url - The url to query the metadata from.
   * @param abortSignal - Optional abort signal to handle cancelling of the process.
   * @returns A promise that resolves to the parsed metadata object.
   * @throws {RequestTimeoutError} When the request exceeds the timeout duration.
   * @throws {RequestAbortedError} When the request was aborted by the caller's signal.
   * @throws {ResponseError} When the response is not OK (non-2xx).
   * @throws {ResponseEmptyError} When the JSON response is empty.
   * @throws {NetworkError} When a network issue happened.
   */
  static override fetchMetadata<T = TypeMetadataWMTS>(url: string, abortSignal?: AbortSignal): Promise<T> {
    // Redirect
    return GeoUtilities.getWMTSServiceMetadata(url, undefined, abortSignal) as Promise<T>;
  }

  /**
   * Initializes a GeoView layer configuration for a WMTS layer.
   *
   * This method creates a basic TypeGeoviewLayerConfig using the provided
   * ID, name, and metadata access path URL. It then initializes the layer entries by calling
   * `initGeoViewLayerEntries`, which may involve fetching metadata or sublayer info.
   *
   * @param geoviewLayerId - A unique identifier for the layer.
   * @param geoviewLayerName - The display name of the layer.
   * @param metadataAccessPath - The full service URL to the layer endpoint.
   * @param isTimeAware - Optional - Indicates whether the layer supports time-based filtering.
   * @returns A promise that resolves to an initialized GeoView layer configuration with layer entries.
   */
  static initGeoviewLayerConfig(
    geoviewLayerId: string,
    geoviewLayerName: string,
    metadataAccessPath: string,
    isTimeAware?: boolean
  ): Promise<TypeGeoviewLayerConfig> {
    // Create the Layer config
    const myLayer = new WMTS({ geoviewLayerId, geoviewLayerName, metadataAccessPath, isTimeAware } as TypeWmtsLayerConfig);
    return myLayer.initGeoViewLayerEntries();
  }

  /**
   * Creates a configuration object for a WMTS layer.
   *
   * This function constructs a `TypeWMTSConfig` object that describes a WMTS layer
   * and its associated entry configurations based on the provided parameters.
   *
   * @param geoviewLayerId - A unique identifier for the GeoView layer.
   * @param geoviewLayerName - The display name of the GeoView layer.
   * @param metadataAccessPath - The URL or path to access metadata.
   * @param isTimeAware - Indicates whether the layer supports time-based filtering.
   * @param layerEntries - An array of layer entries objects to be included in the configuration.
   * @returns The constructed configuration object for the WMTS layer.
   */
  static createGeoviewLayerConfig(
    geoviewLayerId: string,
    geoviewLayerName: string,
    metadataAccessPath: string,
    isTimeAware: boolean | undefined,
    layerEntries: TypeLayerEntryShell[]
  ): TypeWmtsLayerConfig {
    const geoviewLayerConfig: TypeWmtsLayerConfig = {
      geoviewLayerId,
      geoviewLayerName,
      metadataAccessPath,
      geoviewLayerType: CONST_LAYER_TYPES.WMTS,
      isTimeAware,
      listOfLayerEntryConfig: [],
    };
    geoviewLayerConfig.listOfLayerEntryConfig = layerEntries.map((layerEntry) => {
      const layerEntryConfig = new OgcWmtsLayerEntryConfig({
        geoviewLayerConfig,
        layerId: `${layerEntry.id}`,
        ...(layerEntry.layerName && { layerName: `${layerEntry.layerName}` }),
        tileMatrixSet: layerEntry.tileMatrixSet,
      });
      return layerEntryConfig;
    });

    // Return it
    return geoviewLayerConfig;
  }

  /**
   * Processes an  WMTS GeoviewLayerConfig and returns a promise
   * that resolves to an array of `ConfigBaseClass` layer entry configurations.
   *
   * This method:
   * 1. Creates a Geoview layer configuration using the provided parameters.
   * 2. Instantiates a layer with that configuration.
   * 3. Processes the layer configuration and returns the result.
   *
   * @param geoviewLayerId - The unique identifier for the GeoView layer.
   * @param geoviewLayerName - The display name for the GeoView layer.
   * @param url - The URL of the service endpoint.
   * @param layerIds - An array of layer IDs to include in the configuration.
   * @param isTimeAware - Indicates if the layer is time aware.
   * @returns A promise that resolves to an array of layer configurations.
   */
  static processGeoviewLayerConfig(
    geoviewLayerId: string,
    geoviewLayerName: string,
    url: string,
    layerIds: string[],
    isTimeAware: boolean
  ): Promise<ConfigBaseClass[]> {
    // Create the Layer config
    const layerConfig = WMTS.createGeoviewLayerConfig(
      geoviewLayerId,
      geoviewLayerName,
      url,
      isTimeAware,
      layerIds.map((layerId) => {
        return { id: layerId };
      })
    );

    // Create the class from geoview-layers package
    const myLayer = new WMTS(layerConfig);

    // Process it
    return AbstractGeoViewLayer.processConfig(myLayer);
  }

  /**
   * Creates a WMTS source from a layer config.
   *
   * @param layerConfig - The configuration for the WMTS layer.
   * @returns A fully configured WMTS source.
   * @throws {LayerWMTSMetadataError} When we don't have enough info to create a source.
   */
  static createWMTSSource(layerConfig: OgcWmtsLayerEntryConfig): WMTSSource {
    const metadata = layerConfig.getLayerMetadata();
    const tileMatrixSet = metadata?.TileMatrixSet as TypeWMTSTileMatrixSet | undefined;
    const layer = metadata?.Layer as TypeMetadataWMTSLayer | undefined;

    // If layerConfig has values, prioritize config over metadata
    if (
      layerConfig.hasDataAccessPath() &&
      layerConfig.getSource().extent &&
      (layerConfig.tileMatrixSet || layerConfig.getProjectionWithEPSG())
    ) {
      return WMTS.#createWMTSSourceFromConfig(layerConfig);
    }

    // If metadata with TileMatrixSet and Layer info is available, create source from metadata
    if (layer && tileMatrixSet) {
      return WMTS.#createWMTSSourceFromMetadata(layerConfig, layer, tileMatrixSet);
    }

    // If we don't have enough info to create a source, throw
    throw new LayerWMTSMetadataError(layerConfig.getGeoviewLayerId(), layerConfig.getLayerName(), 'items');
  }

  /**
   * Creates a WMTS source from metadata (TileMatrixSet and Layer info from GetCapabilities).
   *
   * @param layerConfig - The layer entry configuration.
   * @param layer - The WMTS layer metadata.
   * @param tileMatrixSet - The WMTS TileMatrixSet metadata.
   * @returns A fully configured WMTS source.
   */
  static #createWMTSSourceFromMetadata(
    layerConfig: OgcWmtsLayerEntryConfig,
    layer: TypeMetadataWMTSLayer,
    tileMatrixSet: TypeWMTSTileMatrixSet
  ): WMTSSource {
    // Determine the style to use. Priority is given to the style specified in the layer config's source configuration.
    let style: string = layerConfig.getSource()?.wmtsStyle || '';
    if (!style) {
      const foundStyle = Array.isArray(layer.Style)
        ? layer.Style.find((layerStyle) => layerStyle['@attributes'].isDefault === 'true') || layer.Style[0]
        : layer.Style;
      style = foundStyle['ows:Identifier'] || 'default';
    }

    // Extract the projection code from the TileMatrixSet's SupportedCRS and create an OpenLayers projection object.
    let metadataProjectionCode = tileMatrixSet['ows:SupportedCRS'].split(':').slice(-1)[0];
    if (metadataProjectionCode === 'CRS84') metadataProjectionCode = '4326'; // CRS84 is equivalent to EPSG:4326
    const projection = getProjection(`EPSG:${metadataProjectionCode}`);

    // Calculate max resolution for projection extent, defaults to max resolution for Web Mercator if extent is unavailable.
    const maxResolution = projection?.getExtent() ? getWidth(projection.getExtent()) / 256 : 156543.03392804097;

    const bounds = layerConfig.getInitialSettingsBounds();
    const extent = bounds
      ? Projection.transformExtentFromProj(bounds, getProjection('EPSG:4326')!, getProjection(`EPSG:${metadataProjectionCode}`)!)
      : undefined;

    // Calculate the resolutions, matrixIds, tileSizes, origins, and sizes arrays needed to create the WMTS tile grid.
    const resolutions: number[] = [];
    const matrixIds: string[] = [];
    const tileSizes: [number, number][] = [];
    const sizes: [number, number][] = [];
    const origins: [number, number][] = [];

    for (let i = 0; i < tileMatrixSet.TileMatrix.length; i++) {
      const tileMatrix = tileMatrixSet.TileMatrix[i];

      matrixIds[i] = tileMatrix['ows:Identifier'];
      resolutions[i] = maxResolution / Math.pow(2, i);
      tileSizes[i] = [Number(tileMatrix.TileWidth), Number(tileMatrix.TileHeight)];
      sizes[i] = [Number(tileMatrix.MatrixWidth), Number(tileMatrix.MatrixHeight)];
      origins[i] =
        typeof tileMatrix.TopLeftCorner === 'string'
          ? (tileMatrix.TopLeftCorner.split(' ').map(Number) as [number, number])
          : tileMatrix.TopLeftCorner;
    }

    // Create the WMTS tile grid using the calculated parameters.
    const tileGrid = new WMTSTileGrid({
      extent,
      matrixIds,
      resolutions,
      tileSizes,
      sizes,
      origins,
    });

    // Construct the source options for the WMTS source.
    const sourceOptions: SourceOptions = {
      url: layerConfig.getDataAccessPath(),
      crossOrigin: layerConfig.getSource().crossOrigin ?? 'Anonymous',
      format: layer.Format || 'image/png',
      layer: layerConfig.layerId,
      matrixSet: tileMatrixSet['ows:Identifier'],
      projection: projection!,
      style,
      tileGrid,
    };

    return new WMTSSource(sourceOptions);
  }

  /**
   * Creates a WMTS source from layerConfig attributes when no metadata is available.
   *
   * Requires the source config to have dataAccessPath, extent, and a projection derivable
   * from the tileMatrixSet identifier or source projection.
   *
   * @param layerConfig - The layer entry configuration.
   * @returns A fully configured WMTS source.
   * @throws {LayerWMTSMetadataError} When the layerConfig doesn't have enough info to create the source.
   */
  static #createWMTSSourceFromConfig(layerConfig: OgcWmtsLayerEntryConfig): WMTSSource {
    const sourceConfig = layerConfig.getSource();

    // Derive the projection code from the tileMatrixSet identifier or the source projection
    const projectionCode = layerConfig.tileMatrixSet ? `EPSG:${layerConfig.tileMatrixSet}` : layerConfig.getProjectionWithEPSG();
    const url = layerConfig.hasDataAccessPath() ? layerConfig.getDataAccessPath() : undefined;
    const projection = projectionCode ? getProjection(projectionCode) : undefined;
    const serviceExtent = sourceConfig?.extent;

    // If we don't have enough info to create a source, throw
    if (!url || !projection || !serviceExtent) {
      const missing = [!url && 'url', !projection && 'projection', !serviceExtent && 'extent'].filter(Boolean).join(', ');
      throw new LayerWMTSMetadataError(layerConfig.getGeoviewLayerId(), layerConfig.getLayerName(), missing);
    }

    // Build tile grid from the provided extent and resolution levels
    const numLevels = sourceConfig.resolutionLevels ?? 20;
    const size = getWidth(serviceExtent) / 256;
    const resolutions = new Array(numLevels);
    const matrixIds = new Array(numLevels);
    for (let z = 0; z < numLevels; ++z) {
      resolutions[z] = size / Math.pow(2, z);
      matrixIds[z] = z;
    }

    const sourceOptions: SourceOptions = {
      url,
      layer: layerConfig.layerId,
      matrixSet: layerConfig.tileMatrixSet || projectionCode!.replace('EPSG:', ''),
      format: 'image/png',
      projection,
      tileGrid: new WMTSTileGrid({
        origin: getTopLeft(serviceExtent),
        resolutions,
        matrixIds,
      }),
      style: sourceConfig.wmtsStyle || 'default',
      wrapX: true,
    };

    return new WMTSSource(sourceOptions);
  }

  // #endregion STATIC METHODS
}
