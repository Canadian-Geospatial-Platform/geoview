import ImageLayer from 'ol/layer/Image';
import type { Options as ImageOptions } from 'ol/layer/BaseImage';
import type { Coordinate } from 'ol/coordinate';
import type { ImageArcGISRest, ImageWMS } from 'ol/source';
import type { ImageSourceEvent } from 'ol/source/Image';
import type { Extent } from 'ol/extent';
import type { Projection as OLProjection, ProjectionLike } from 'ol/proj';
import type { Map as OLMap } from 'ol';
import { Polygon } from 'ol/geom';

import EventHelper, { type EventDelegateBase } from '@/api/events/event-helper';
import type { LayerBaseEvent } from '@/geo/layer/gv-layers/abstract-base-layer';
import { Fetch } from '@/core/utils/fetch-helper';
import { parseXMLToJson } from '@/core/utils/utilities';
import { GeoUtilities } from '@/geo/utils/utilities';
import { GVLayerUtilities } from '@/geo/layer/gv-layers/utils';
import { OgcWmsLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/ogc-wms-layer-entry-config';
import type { OgcWfsLayerEntryConfig } from '@/api/config/validation-classes/vector-validation-classes/wfs-layer-entry-config';
import type { TypeFeatureInfoEntry, TypeOutfieldsType, TypeFeatureInfoResult, TypeDisplayLanguage } from '@/api/types/map-schema-types';
import { CONFIG_PROXY_URL } from '@/api/types/map-schema-types';
import type { TypeLegend, TypeMetadataFeatureInfo } from '@/api/types/layer-schema-types';
import { CONST_LAYER_TYPES } from '@/api/types/layer-schema-types';
import { GeoviewRenderer } from '@/geo/utils/renderer/geoview-renderer';
import { AbstractGVRaster } from '@/geo/layer/gv-layers/raster/abstract-gv-raster';
import { Projection } from '@/geo/utils/projection';
import {
  LayerConfigWFSMissingError,
  LayerInvalidFeatureInfoFormatWMSError,
  LayerInvalidLayerFilterError,
} from '@/core/exceptions/layer-exceptions';
import { formatError, NetworkError, RequestAbortedError, ResponseContentError } from '@/core/exceptions/core-exceptions';
import { AbstractGVLayer } from '@/geo/layer/gv-layers/abstract-gv-layer';
import type { EsriImageLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/esri-image-layer-entry-config';
import { WfsRenderer } from '@/geo/utils/renderer/wfs-renderer';
import type { GeoViewError } from '@/core/exceptions/geoview-exceptions';
import {
  LayerImageFailedNoImageError,
  LayerImageFailedToLoadHeightTooBigError,
  LayerImageFailedToLoadWidthTooBigError,
  NoExtentError,
} from '@/core/exceptions/geoview-exceptions';
import type { LayerFilters } from '@/geo/layer/gv-layers/layer-filters';
import { logger } from '@/core/utils/logger';

/**
 * Manages a WMS layer.
 */
export class GVWMS extends AbstractGVRaster {
  /** The max feature count returned by the GetFeatureInfo */
  static readonly DEFAULT_MAX_FEATURE_COUNT: number = 100;

  /** Mime/type for GEOJSON */
  static readonly MIME_TYPE_FORMAT_GEOJSON = 'application/geojson';

  /** Mime/type for JSON */
  static readonly MIME_TYPE_FORMAT_JSON = 'application/json';

  /** Mime/type for GML */
  static readonly MIME_TYPE_FORMAT_GML = 'application/vnd.ogc.gml';

  /** Mime/type for XML */
  static readonly MIME_TYPE_FORMAT_APP_XML = 'application/xml';

  /** Mime/type for XML */
  static readonly MIME_TYPE_FORMAT_TEXT_XML = 'text/xml';

  /** Mime/type for HTML */
  static readonly MIME_TYPE_FORMAT_HTML = 'text/html';

  /** Mime/type for Text */
  static readonly MIME_TYPE_FORMAT_TEXT = 'text/plain';

  /**
   * The default Get Feature Info tolerance to use for QGIS Server services which are more picky by default (really needs to be zoomed in to get results, by default).
   * WMS needed a bigger tolerance to pick up more results during the spatial queries (to make it look more like the tolerance for other layer types)
   */
  static readonly DEFAULT_GET_FEATURE_INFO_TOLERANCE: number = 20;

  /** The Get Feature Info feature count to use */
  #getFeatureInfoFeatureCount: number = GVWMS.DEFAULT_MAX_FEATURE_COUNT;

  /** The Get Feature Info tolerance to use for QGIS Server services which are more picky by default (really needs to be zoomed in to get results, by default) */
  #getFeatureInfoTolerance: number = GVWMS.DEFAULT_GET_FEATURE_INFO_TOLERANCE;

  /** The feature out put format for the WMS that we know have worked */
  #featureOutputFormatWMSWorked?: string;

  /** Callback delegates for the WMS style changed event */
  #onWmsStyleChangedHandlers: WMSStyleChangedDelegate[] = [];

  /** Indicates if the CRS is to be overridden, because the layer struggles loading on the map */
  #overrideCRS?: CRSOverride;

  /** The currently active WMS style identifier */
  #wmsStyle?: string;

  /**
   * Constructs a GVWMS layer to manage an OpenLayer layer.
   *
   * @param olSource - The OpenLayer source
   * @param layerConfig - The layer configuration
   */
  constructor(olSource: ImageWMS, layerConfig: OgcWmsLayerEntryConfig) {
    super(olSource, layerConfig);

    // Initialize the active WMS style from the source params or layer config
    this.#wmsStyle = (olSource.getParams()?.STYLES as string) || layerConfig.getStyleToUse();

    // Create the image layer options.
    const imageLayerOptions: ImageOptions<ImageWMS> = {
      source: olSource,
      properties: { layerConfig },
    };

    // Init the layer options with initial settings
    AbstractGVRaster.initOptionsWithInitialSettings(imageLayerOptions, layerConfig);

    // Hook a custom function to the ImageLoadFunction of the source object
    olSource.setImageLoadFunction((image, src) => {
      // Assign the src to the image, this is the regular behavior
      let theUrl = src;

      // If we're overriding the CRS for the layer as an attempt to do on-the-fly projection for tricky layers
      const overridingCRS = this.getOverrideCRS();
      if (overridingCRS) {
        // Rebuild the URL with a reprojected BBOX
        const imageExtent = image.getExtent();
        const supportedBBOX = Projection.transformExtentFromProj(
          imageExtent,
          Projection.getProjectionFromString(overridingCRS.mapProjection),
          Projection.getProjectionFromString(overridingCRS.layerProjection)
        );

        // Replace the BBOX param in the src url
        theUrl = GeoUtilities.replaceCRSandBBOXParam(src, overridingCRS.layerProjection, supportedBBOX);
      }

      // eslint-disable-next-line no-param-reassign
      (image.getImage() as HTMLImageElement).src = theUrl;
    });

    // Create and set the OpenLayer layer
    this.setOLLayer(new ImageLayer(imageLayerOptions));
  }

  // #region OVERRIDES

  /**
   * Overrides the parent method to return a more specific OpenLayers layer type (covariant return).
   *
   * @returns The strongly-typed OpenLayers type
   */
  override getOLLayer(): ImageLayer<ImageWMS> {
    // Call parent and cast
    return super.getOLLayer() as ImageLayer<ImageWMS>;
  }

  /**
   * Overrides the parent class's method to return a more specific OpenLayers source type (covariant return).
   *
   * @returns The ImageWMS source instance associated with this layer
   */
  override getOLSource(): ImageWMS {
    // Get source from OL
    return super.getOLSource() as ImageWMS;
  }

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   *
   * @returns The strongly-typed layer configuration specific to this layer
   */
  override getLayerConfig(): OgcWmsLayerEntryConfig {
    // Call parent and cast
    return super.getLayerConfig() as OgcWmsLayerEntryConfig;
  }

  /**
   * Deciphers an image load error event and returns a corresponding
   * localized error message key.
   *
   * This override inspects the failed image request to detect more specific
   * failure scenarios before falling back to a generic error message.
   * The method currently checks for:
   * - Image size exceeding the service-defined `MaxWidth` or `MaxHeight`
   *   constraints (if available in service metadata).
   * - An empty image response (zero width or height).
   * If none of the specific conditions are met, a generic image load error
   * message key is returned.
   *
   * @param event - The image load error event triggered by the image source
   * @returns A GeoView Error representing the error
   */
  protected override onImageLoadErrorDecipherError(event: Event): GeoViewError {
    // Checks for more specific errors
    const maxWidth = this.getLayerConfig().getServiceMetadata()?.Service.MaxWidth;
    const maxHeight = this.getLayerConfig().getServiceMetadata()?.Service.MaxHeight;
    const image = (event as unknown as ImageSourceEvent).image?.getImage();

    // Check for size limit exceeded
    if (image && (!!maxWidth || !!maxHeight)) {
      // Use the currentSrc to get the actual image URL with parameters
      const imageSrc = image instanceof HTMLImageElement ? image.currentSrc : undefined;
      if (imageSrc) {
        // Check against max width allowed
        const width = Number(imageSrc.split('WIDTH=')[1]?.split('&')[0]);
        if (maxWidth && width > maxWidth) {
          return new LayerImageFailedToLoadWidthTooBigError(this.getLayerName(), width, maxWidth);
        }

        // Check against max height allowed
        const height = Number(imageSrc.split('HEIGHT=')[1]?.split('&')[0]);
        if (maxHeight && height > maxHeight) {
          return new LayerImageFailedToLoadHeightTooBigError(this.getLayerName(), height, maxHeight);
        }
      }
    } else if (image.height === 0 || image.width === 0) {
      // No image returned, update the error code
      return new LayerImageFailedNoImageError(this.getLayerName());
    }

    // Couldn't be deciphered, use parent's
    return super.onImageLoadErrorDecipherError(event);
  }

  /**
   * Overrides the return of feature information at a given coordinate.
   *
   * @param map - The Map where to get Feature Info At Coordinate from
   * @param location - The coordinate that will be used by the query
   * @param queryGeometry - Whether to include geometry in the query, default is true
   * @param language - The display language, used to guess the best name field for the 'nameField'
   * @param abortController - Optional {@link AbortController} to cancel the operation
   * @returns A promise that resolves with the feature info result
   */
  protected override getFeatureInfoAtCoordinate(
    map: OLMap,
    location: Coordinate,
    queryGeometry = true,
    language: TypeDisplayLanguage, // Used if we have to guess the field name for the 'nameField'
    abortController: AbortController | undefined = undefined
  ): Promise<TypeFeatureInfoResult> {
    // Transform coordinate from map projection to lntlat
    const projCoordinate = Projection.transformToLonLat(location, map.getView().getProjection());

    // Redirect to getFeatureInfoAtLonLat
    return this.getFeatureInfoAtLonLat(map, projCoordinate, queryGeometry, language, abortController);
  }

  /**
   * Overrides the return of feature information at the provided long lat coordinate.
   *
   * @param map - The Map where to get Feature Info At LonLat from
   * @param lonlat - The coordinate that will be used by the query
   * @param queryGeometry - Whether to include geometry in the query, default is true
   * @param language - The display language, used to guess the best name field if `nameField` is not provided
   * @param abortController - Optional {@link AbortController} to cancel the operation
   * @returns A promise that resolves with the feature info result
   * @throws {RequestAbortedError} When the request was aborted by the caller's signal
   * @throws {LayerInvalidFeatureInfoFormatWMSError} When no supported format returns usable feature info data
   */
  protected override async getFeatureInfoAtLonLat(
    map: OLMap,
    lonlat: Coordinate,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    queryGeometry = true,
    language: TypeDisplayLanguage, // Used if we have to guess the field name for the 'nameField'
    abortController: AbortController | undefined = undefined
  ): Promise<TypeFeatureInfoResult> {
    // The FeatureInfoResult object that will be returned
    const featureInfoResult: TypeFeatureInfoResult = { results: [] };

    // If the layer is invisible
    if (!this.getVisible()) return featureInfoResult;

    // Get the layer config and its initial settings
    const wmsLayerConfig = this.getLayerConfig();
    const initialSettingsBounds = wmsLayerConfig.getInitialSettingsBounds();

    // TODO: CHECK - Do we want that kind of check for EsriDynamic as well?
    // If the initial settings bounds are set, validate the queried location vs the bounds
    if (initialSettingsBounds) {
      // Check if the clicked lon/lat is within the bounds
      const [lon, lat] = lonlat;
      const [minX, minY, maxX, maxY] = initialSettingsBounds;

      // If out of bounds, don't bother and return
      if (lon < minX || lon > maxX || lat < minY || lat > maxY) {
        // Log warning
        logger.logWarning(`Coordinates were out-of-bounds for layer ${wmsLayerConfig.layerPath}, query was aborted.`);
        return featureInfoResult;
      }
    } else {
      // Log warning
      logger.logWarning(
        `Bounds were not set for layer ${wmsLayerConfig.layerPath}, therefore no validation was performed at the queried location.`
      );
    }

    // Get the map projection
    const mapProjection = map.getView().getProjection();

    // Project the lon/lat to the map's projection
    const clickCoordinate = Projection.transformFromLonLat(lonlat, mapProjection);

    // Get the source and resolution
    const viewResolution = map.getView().getResolution()!;

    // Get the Geoview Layer Config WFS equivalent if any
    const wfsLayerConfig = wmsLayerConfig.getWfsLayerConfig();

    // If the layer has a WFS associated
    if (wfsLayerConfig) {
      // We're going to try performing a GetFeature using the WFS query instead of WMS, better chance to retrieve the geometry that way
      return await this.#getFeatureInfoUsingWFS(
        wmsLayerConfig,
        wfsLayerConfig,
        clickCoordinate,
        viewResolution,
        mapProjection.getCode(),
        language,
        this.getLayerFilters(),
        abortController
      );
    }

    // Try various info formats patterns to get feature info
    return this.#getFeatureInfoUsingWMS(
      wmsLayerConfig,
      clickCoordinate,
      viewResolution,
      mapProjection.getCode(),
      language,
      abortController
    );
  }

  /**
   * Overrides the get all feature information for all the features stored in the layer.
   *
   * This function performs a WFS 'GetFeature' query operation using the WFS layer configuration embedded in the WMS layer configuration.
   *
   * @param map - The Map so that we can grab the resolution/projection we want to get features on
   * @param layerFilters - The layer filters to apply when querying the features
   * @param language - The display language, used to guess the best name field if `nameField` is not provided
   * @param abortController - Optional {@link AbortController} to cancel the operation
   * @returns A promise that resolves with the feature info result
   * @throws {LayerConfigWFSMissingError} When no WFS layer configuration is defined for this WMS layer
   * @throws {ResponseError} When the response is not OK (non-2xx)
   * @throws {ResponseEmptyError} When the JSON response is empty
   * @throws {RequestTimeoutError} When the request exceeds the timeout duration
   * @throws {RequestAbortedError} When the request was aborted by the caller's signal
   * @throws {NetworkError} When a network issue happened
   */
  protected override getAllFeatureInfo(
    map: OLMap,
    layerFilters: LayerFilters,
    language: TypeDisplayLanguage,
    abortController?: AbortController
  ): Promise<TypeFeatureInfoResult> {
    // Get the layer config and its initial settings
    const wmsLayerConfig = this.getLayerConfig();

    // Get the Geoview Layer Config WFS equivalent
    const wfsLayerConfig = wmsLayerConfig.getWfsLayerConfig();
    if (!wfsLayerConfig) throw new LayerConfigWFSMissingError(this.getLayerPath());

    // Redirect
    return this.#getFeatureInfoUsingWFS(
      wmsLayerConfig,
      wfsLayerConfig,
      undefined,
      undefined,
      map.getView().getProjection().getCode(),
      language,
      layerFilters,
      abortController
    );
  }

  /**
   * Overrides the fetching of the legend for a WMS layer.
   *
   * @returns A promise that resolves with the legend of the layer or null
   */
  override async onFetchLegend(): Promise<TypeLegend | null> {
    try {
      // Get the layer style from the config
      const layerStyle = this.getStyle();

      // If any style, we want a vector-like style legend
      if (layerStyle) {
        // Try to create a legend using the vector styles if any
        return await AbstractGVLayer.createLegendFromStyle(CONST_LAYER_TYPES.WFS, layerStyle);
      }
    } catch (error: unknown) {
      // Failed to create the legend using vector styling, continue..
      logger.logWarning('Failed to create the legend using vector styling', error);
    }

    // At this point, it's not a dynamic legend, fallback to use an image at least

    try {
      // Get the layer config in a loaded phase
      const layerConfig = this.getLayerConfig();
      const legendImage = await GVWMS.#getLegendImage(layerConfig, this.#wmsStyle);

      if (legendImage) {
        const image = await GeoviewRenderer.loadImage(legendImage as string);
        if (image) {
          const drawingCanvas = document.createElement('canvas');
          drawingCanvas.width = image.width;
          drawingCanvas.height = image.height;
          const drawingContext = drawingCanvas.getContext('2d', { willReadFrequently: true })!;
          drawingContext.drawImage(image, 0, 0);

          // Return the legend
          return {
            type: CONST_LAYER_TYPES.WMS,
            legend: drawingCanvas,
          };
        }
      }
    } catch (error: unknown) {
      this.emitMessage(
        'error.layer.noWMSLegend',
        { layerName: this.getLayerConfig().getLayerName() || this.getLayerConfig().layerId, errorName: formatError(error).name },
        'warning'
      );
      // Depending on the error
      if (error instanceof ResponseContentError) {
        // Log warning
        logger.logWarning('gv-wms.onFetchLegend()\n', `${error} - Maybe the WMS legend is expecting a query on the parent layer?`);
      } else {
        // Unknown error
        logger.logError('gv-wms.onFetchLegend()\n', error);
      }
    }

    // No good
    return {
      type: CONST_LAYER_TYPES.WMS,
      legend: null,
    };
  }

  /**
   * Overrides the way to initialize the bounds for this layer type.
   *
   * @param projection - The projection to initialize the bounds into
   * @param stops - The number of stops to use to generate the extent
   * @returns A promise that resolves with the layer bounding box or undefined when not found
   */
  override onInitBounds(projection: OLProjection, stops: number): Promise<Extent | undefined> {
    const layerConfig = this.getLayerConfig();

    // Get the layer config bounds
    let layerConfigBounds = layerConfig?.getInitialSettingsBounds();

    // If layer bounds were found, project
    if (layerConfigBounds) {
      // Transform extent to given projection
      layerConfigBounds = Projection.transformExtentFromProj(layerConfigBounds, Projection.getProjectionLonLat(), projection, stops);
    }

    // Get the layer bounds from metadata, favoring a bounds in the same projection as the map
    const metadataExtent = layerConfig.getBoundsExtent(projection.getCode());

    // If any
    let layerBounds;
    if (metadataExtent) {
      const [metadataProj, metadataBounds] = metadataExtent;

      // If read something
      if (metadataProj) {
        const metadataProjConv = Projection.getProjectionFromString(metadataProj);
        layerBounds = Projection.transformExtentFromProj(metadataBounds, metadataProjConv, projection, stops);
        layerBounds = GeoUtilities.validateExtentWhenDefined(layerBounds, projection.getCode());
      }
    }

    // If both layer config had bounds and layer has real bounds, take the intersection between them
    if (layerConfigBounds && layerBounds) {
      layerBounds = GeoUtilities.getExtentIntersection(layerBounds, layerConfigBounds);
    } else if (layerConfigBounds && !layerBounds) {
      layerBounds = layerConfigBounds;
    }

    // Validate the bounds before returning them
    layerBounds = GeoUtilities.validateExtentWhenDefined(layerBounds, projection.getCode());

    // Return the calculated bounds
    return Promise.resolve(layerBounds);
  }

  /**
   * Sends a query to get feature and calculates an extent from them.
   *
   * @param objectIds - The IDs of the features to calculate the extent from
   * @param outProjection - The output projection for the extent
   * @param outfield - Optional ID field to return for services that require a value in outfields
   * @returns A promise that resolves with the extent of the features
   * @throws {LayerConfigWFSMissingError} When no WFS layer configuration is defined for this WMS layer
   * @throws {NoPrimaryKeyFieldError} When the no outfields has the type 'oid'
   * @throws {NoExtentError} When the extent couldn't be computed
   * @throws {ResponseError} When the response is not OK (non-2xx)
   * @throws {ResponseEmptyError} When the JSON response is empty
   * @throws {RequestTimeoutError} When the request exceeds the timeout duration
   * @throws {RequestAbortedError} When the request was aborted by the caller's signal
   * @throws {NetworkError} When a network issue happened
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  override async onGetExtentFromFeatures(objectIds: number[] | string[], outProjection: OLProjection, outfield?: string): Promise<Extent> {
    // Get the WMS layer config
    const wmsLayerConfig = this.getLayerConfig();

    // Get the Geoview Layer Config WFS equivalent
    const wfsLayerConfig = wmsLayerConfig.getWfsLayerConfig();
    if (!wfsLayerConfig) throw new LayerConfigWFSMissingError(this.getLayerPath());

    // Get the primary key field name (equivalent of objectid for Esri Dynamic)
    const pkFieldName = wfsLayerConfig.getOutfieldsPK().name;

    // Create the sql filter using the object IDs
    const sqlFilter = objectIds.length === 1 ? `${pkFieldName} = ${objectIds[0]}` : `${pkFieldName} in (${objectIds.join(', ')})`;

    // The xml filter
    const xmlFilter = WfsRenderer.sqlToOlFilterXml(sqlFilter, wfsLayerConfig.getVersionOrDefault(), pkFieldName);

    // Wrap the ogc filter request
    const xmlFilterReady = WfsRenderer.wrapOGCFilter(xmlFilter, 'wfs', wfsLayerConfig.getVersionOrDefault());

    // Get the supported info formats
    const featureInfoFormat = wfsLayerConfig.getSupportedFormats(GVWMS.MIME_TYPE_FORMAT_JSON); // application/json by default (QGIS Server doesn't seem to provide the metadata for the output formats, use application/json)

    // If one of those contain application/json, use that format to get features
    const outputFormat = featureInfoFormat.find((format) => format.toLowerCase().includes(GVWMS.MIME_TYPE_FORMAT_JSON));

    // Format the url
    const urlWithOutputJson = GeoUtilities.ensureServiceRequestUrlGetFeature(
      wfsLayerConfig.getMetadataAccessPath()!,
      wfsLayerConfig.layerId,
      wfsLayerConfig.getVersionOrDefault(),
      outputFormat,
      [],
      xmlFilterReady,
      outProjection.getCode()
    );

    // Fetch and parse features
    const parsedFeatures = await GVWMS.fetchAndParseFeaturesFromWFSUrl(
      urlWithOutputJson,
      wmsLayerConfig,
      wfsLayerConfig,
      'en' // Language isn't necessary here as we're interested in the features extent
    );

    // For each feature
    let calculatedExtent: Extent | undefined;
    parsedFeatures.results.forEach((feature) => {
      // If calculatedExtent has not been defined, set it to extent
      if (!calculatedExtent) calculatedExtent = feature.extent;
      else GeoUtilities.getExtentUnion(calculatedExtent, feature.extent);
    });

    // If we have an extent, return it
    if (calculatedExtent) return calculatedExtent;

    // Throw
    throw new NoExtentError(this.getLayerPath());
  }

  /**
   * Overrides the way a WMS layer applies a view filter. It does so by updating the source FILTER and TIME parameters.
   *
   * @param filter - An optional filter to be used in place of the getViewFilter value
   */
  protected override onSetLayerFilters(filter?: LayerFilters): void {
    // Process the layer filtering using the static method shared between EsriImage and WMS
    GVWMS.applyViewFilterOnSource(this.getLayerConfig(), this.getOLSource(), filter);
  }

  // #endregion OVERRIDES

  // #region PUBLIC METHODS

  /**
   * Gets if the CRS is to be overridden, because the layer struggles with the current map projection.
   *
   * @returns The CRS Override properties or undefined when not set
   */
  getOverrideCRS(): CRSOverride | undefined {
    return this.#overrideCRS;
  }

  /**
   * Sets if the CRS is to be overridden, because the layer struggles with the current map projection.
   *
   * @param value - The CRS Override properties or undefined
   */
  setOverrideCRS(value: CRSOverride | undefined): void {
    this.#overrideCRS = value;
  }

  /**
   * Gets the feature count used for GetFeatureInfo requests.
   *
   * @returns The current GetFeatureInfo feature count
   */
  getGetFeatureInfoFeatureCount(): number {
    return this.#getFeatureInfoFeatureCount;
  }

  /**
   * Sets the feature count used for GetFeatureInfo requests.
   *
   * @param value - The new GetFeatureInfo feature count
   */
  setGetFeatureInfoFeatureCount(value: number): void {
    this.#getFeatureInfoFeatureCount = value;
  }

  /**
   * Gets the current pixel tolerance used for GetFeatureInfo requests for QGIS Server Services.
   *
   * @returns The current GetFeatureInfo pixel tolerance
   */
  getGetFeatureInfoTolerance(): number {
    return this.#getFeatureInfoTolerance;
  }

  /**
   * Sets the current pixel tolerance used for GetFeatureInfo requests for QGIS Server Services.
   *
   * @param value - The new GetFeatureInfo pixel tolerance
   */
  setGetFeatureInfoTolerance(value: number): void {
    this.#getFeatureInfoTolerance = value;
  }

  /**
   * Gets the currently active WMS style identifier.
   *
   * @returns The active WMS style name, or undefined if none is set
   */
  getWmsStyle(): string | undefined {
    return this.#wmsStyle;
  }

  /**
   * Sets the style id to be used by the WMS layer.
   *
   * @param wmsStyleId - The style identifier to be used
   */
  setWmsStyle(wmsStyleId: string): void {
    // Update the current style
    this.#wmsStyle = wmsStyleId;

    this.getOLSource()?.updateParams({ STYLES: wmsStyleId });

    // Emit about it
    this.#emitWmsStyleChanged({ wmsStyleName: wmsStyleId });
  }

  /**
   * Fetches feature data from a WFS GetFeature request URL (expected to return GeoJSON),
   * parses the response into OpenLayers features, and converts them into GeoView
   * Feature Info entries with appropriate attribute formatting.
   *
   * This method:
   * - Performs an HTTP request to a WFS GetFeature endpoint.
   * - Parses the returned GeoJSON into OL features.
   * - Applies WFS/WMS configuration (schema, outfields, styles, filters).
   * - Formats fields according to WFS metadata, including date parsing rules.
   * - Returns an array of standardized `TypeFeatureInfoEntry` objects.
   *
   * @param urlWithOutputJson - The full WFS GetFeature request URL. Must specify an output format compatible
   *   with GeoJSON (e.g., `outputFormat=application/json`)
   * @param wmsLayerConfig - The associated WMS layer configuration. Styling and filter settings from this
   *   config are applied when formatting the Feature Info results
   * @param wfsLayerConfig - The WFS layer configuration used for schema tags, outfields, metadata, and
   *   date formatting
   * @param language - The display language, used to guess the best name field if `nameField` is not provided in the WMS layer config
   * @param abortController - Optional {@link AbortController} used to cancel the fetch request
   * @returns A promise that resolves with the feature info result
   * @throws {ResponseError} When the response is not OK (non-2xx)
   * @throws {ResponseEmptyError} When the JSON response is empty
   * @throws {RequestTimeoutError} When the request exceeds the timeout duration
   * @throws {RequestAbortedError} When the request was aborted by the caller's signal
   * @throws {NetworkError} When a network issue happened
   */
  static async fetchAndParseFeaturesFromWFSUrl(
    urlWithOutputJson: string,
    wmsLayerConfig: OgcWmsLayerEntryConfig,
    wfsLayerConfig: OgcWfsLayerEntryConfig,
    language: TypeDisplayLanguage,
    abortController: AbortController | undefined = undefined
  ): Promise<TypeFeatureInfoResult> {
    // Call the GetFeature
    const responseData = await Fetch.fetchJson(urlWithOutputJson, abortController);

    // Read the EPSG from the data
    const dataEPSG = GeoUtilities.readEPSGOfGeoJSON(responseData);

    // Check if we have it in Projection and try adding it if we're missing it
    await Projection.addProjectionIfMissing(dataEPSG);

    // Read the features
    const features = GeoUtilities.readFeaturesFromGeoJSON(responseData, undefined);

    // Find the best name field and validate its existance at the same time when one was initially configured
    const nameField = AbstractGVLayer.findBestNameField(wmsLayerConfig.getNameField(), wfsLayerConfig.getOutfields(), language);

    // Parse the features
    const results = AbstractGVLayer.helperFormatFeatureInfoResult(
      features,
      wfsLayerConfig.layerPath,
      wfsLayerConfig.getSchemaTag(),
      nameField,
      wfsLayerConfig.getOutfields(),
      wmsLayerConfig.hasOutfieldsPK(),
      undefined,
      wmsLayerConfig.getLayerStyle(), // The styles as read from the WMS layer config (not WFS in case it was overridden in the WMS)
      wmsLayerConfig.getServiceDateFormat(),
      wmsLayerConfig.getServiceDateTimezone(),
      wmsLayerConfig.getServiceDateTemporalMode(),
      AbstractGVLayer.helperGetFieldValue
    );

    // Return the results
    return { results };
  }

  // #endregion PUBLIC METHODS

  // #region PRIVATE METHODS

  /**
   * Retrieves feature information from a WFS layer based on a clicked map location.
   *
   * This method is used internally to perform a "GetFeatureInfo" style request
   * using WFS. If a click coordinate and view resolution are provided, it:
   * 1. Buffers the clicked point into a small polygon based on the current resolution
   *    and configured tolerance.
   * 2. Converts the buffered polygon into a GML string.
   * 3. Creates a spatial <Intersects> filter for the WFS request.
   * 4. Builds a WFS GetFeature URL with the appropriate output format and filter.
   * 5. Fetches the WFS features and parses them into a consistent format.
   *
   * @param wmsLayerConfig - The current WMS layer config of the WMS layer
   * @param wfsLayerConfig - The current WFS layer config of the WMS layer
   * @param clickCoordinate - The clicked map coordinate
   *        in the map projection. If undefined, the query is non-spatial
   * @param viewResolution - Current map view resolution
   *        (map units per pixel). Required for buffering the click location
   * @param projectionCode - The map projection code (e.g., 'EPSG:3857')
   *        to use for the WFS request and geometry serialization
   * @param language - The display language, used to guess the best name field if `nameField` is not provided in the WMS layer config
   * @param layerFilters - Optional layer filters to use to filter the query
   * @param abortController - Optional {@link AbortController} to
   *        allow cancellation of the WFS request.
   * @returns A promise that resolves with the feature info result
   * @throws {RequestAbortedError} When the request was aborted by the caller's signal
   * @throws {LayerInvalidFeatureInfoFormatWMSError} When no supported format returns usable feature info data
   */
  #getFeatureInfoUsingWFS(
    wmsLayerConfig: OgcWmsLayerEntryConfig,
    wfsLayerConfig: OgcWfsLayerEntryConfig,
    clickCoordinate: Coordinate | undefined,
    viewResolution: number | undefined,
    projectionCode: string,
    language: TypeDisplayLanguage,
    layerFilters?: LayerFilters,
    abortController?: AbortController
  ): Promise<TypeFeatureInfoResult> {
    try {
      // Get the supported info formats
      const featureInfoFormat = wfsLayerConfig.getSupportedFormats(GVWMS.MIME_TYPE_FORMAT_JSON); // application/json by default (QGIS Server doesn't seem to provide the metadata for the output formats, use application/json)

      // If one of those contain application/json, use that format to get features
      const outputFormat = featureInfoFormat.find((format) => format.toLowerCase().includes(GVWMS.MIME_TYPE_FORMAT_JSON));

      // TODO: WMS - Add support for other formats. Not quite the GV issue #3134, but similar

      // Create the filterXML from the sql filter
      let gmlFilterAttribute;
      let gmlFilterSpatial;
      let fieldsToReturn = wfsLayerConfig.getOutfields();

      // Total filter
      const totalFilter = layerFilters?.getAllFilters();

      // If any
      if (totalFilter) {
        // Build a OGC Filter for the filter
        gmlFilterAttribute = WfsRenderer.sqlToOlFilterXml(
          totalFilter,
          wfsLayerConfig.getVersionOrDefault(),
          wfsLayerConfig.getOutfields()?.[0]?.name!
        );
      }

      // If performing a query based on a clicked coordinate, we want to filter spatially
      if (clickCoordinate && viewResolution) {
        // Get the geometry field name
        const geomFieldName = wfsLayerConfig.getGeometryField()?.name || 'geometry'; // default: geometry

        // Buffer the point into a polygon-circle to get features around the click point
        const bufferedPoint = GVWMS.#buildBufferPolygon(clickCoordinate, viewResolution, this.getGetFeatureInfoTolerance());

        // Write the polygon to GML
        const polygonGML = GeoUtilities.writeGeometryToGML(bufferedPoint, projectionCode);

        // Create the intersects filter
        gmlFilterSpatial = `<Intersects><PropertyName>${geomFieldName}</PropertyName>${polygonGML}</Intersects>`;

        // We want all fields in the response, to make sure the geometry is included, clear it
        fieldsToReturn = undefined;
      }

      // Build attribute+spatial OGC filter
      const xmlFilterTotal = WfsRenderer.combineGmlFilters(gmlFilterSpatial, gmlFilterAttribute);

      // Wrap the ogc filter request
      const xmlFilterReady = WfsRenderer.wrapOGCFilter(xmlFilterTotal, 'wfs', wfsLayerConfig.getVersionOrDefault());

      // Format the url
      const urlWithOutputJson = GeoUtilities.ensureServiceRequestUrlGetFeature(
        wfsLayerConfig.getMetadataAccessPath()!,
        wfsLayerConfig.layerId,
        wfsLayerConfig.getVersionOrDefault(),
        outputFormat,
        fieldsToReturn,
        xmlFilterReady,
        projectionCode
      );

      // Fetch and parse features
      return GVWMS.fetchAndParseFeaturesFromWFSUrl(urlWithOutputJson, wmsLayerConfig, wfsLayerConfig, language, abortController);
    } catch (error: unknown) {
      // Log if the request was not aborted, when aborted, we don't really care for logging
      GVWMS.#logErrorThrowIfAborted(error, `${wmsLayerConfig.getLayerNameCascade()} - Failed to retrieve features from its WFS service`);

      // Failed
      throw new LayerInvalidFeatureInfoFormatWMSError(
        wmsLayerConfig.layerPath,
        GVWMS.MIME_TYPE_FORMAT_JSON,
        wmsLayerConfig.getLayerNameCascade()
      );
    }
  }

  /**
   * Attempts to retrieve feature information from a WMS layer using a prioritized list of supported formats:
   * `application/geojson`, `application/json`, `text/xml`, `text/html`, and `text/plain`, in that order.
   *
   * For each supported format found in the layer's WMS capabilities, the method tries to fetch feature info
   * using that format. If no format returns usable feature info, an error is thrown.
   *
   * @param wmsLayerConfig - The current WMS layer config of the WMS layer
   * @param clickCoordinate - The coordinate on the map where the user clicked
   * @param viewResolution - The current resolution of the map view
   * @param projectionCode - The projection used for the request (e.g., 'EPSG:3857')
   * @param language - The display language, used to guess the best name field if `nameField` is not provided
   * @param abortController - Optional {@link AbortController} to cancel the request if needed
   * @returns A promise that resolves with the feature info result
   * @throws {RequestAbortedError} When the request was aborted by the caller's signal
   * @throws {LayerInvalidFeatureInfoFormatWMSError} When no supported format returns usable feature info data
   */
  async #getFeatureInfoUsingWMS(
    wmsLayerConfig: OgcWmsLayerEntryConfig,
    clickCoordinate: Coordinate,
    viewResolution: number,
    projectionCode: ProjectionLike,
    language: TypeDisplayLanguage, // Used if we have to guess the field name for the 'nameField'
    abortController?: AbortController
  ): Promise<TypeFeatureInfoResult> {
    // Get the layer source
    const wmsSource = this.getOLSource();

    // Get the supported info formats
    let featureInfoFormat = wmsLayerConfig.getServiceMetadata()?.Capability?.Request?.GetFeatureInfo?.Format || [
      GVWMS.MIME_TYPE_FORMAT_TEXT,
    ];

    // If any output format has worked in the past
    if (this.#featureOutputFormatWMSWorked) featureInfoFormat = [this.#featureOutputFormatWMSWorked];

    // Log the various info format supported for the layer, keeping the line commented, useful for debugging
    // logger.logDebug(layerConfig.getLayerNameCascade(), featureInfoFormat);

    // If the info format includes GEOJSON
    let featureMember: Record<string, unknown>[] | undefined;
    if (featureInfoFormat.includes(GVWMS.MIME_TYPE_FORMAT_GEOJSON)) {
      try {
        // Try to get the feature member using GEOJSON format
        featureMember = await GVWMS.#getFeatureInfoUsingJSON(
          wmsLayerConfig,
          wmsSource,
          clickCoordinate,
          viewResolution,
          this.getGetFeatureInfoTolerance(),
          projectionCode,
          GVWMS.MIME_TYPE_FORMAT_GEOJSON,
          this.getGetFeatureInfoFeatureCount(),
          abortController
        );

        // Keep in mind, this output format works
        this.#featureOutputFormatWMSWorked = GVWMS.MIME_TYPE_FORMAT_GEOJSON;
      } catch (error: unknown) {
        // Log if the request was not aborted, when aborted, we don't really care for logging
        GVWMS.#logErrorThrowIfAborted(
          error,
          `${wmsLayerConfig.getLayerNameCascade()} - Failed to retrieve featureMember using GeoJSON, eat the error, we'll try with another format`
        );
      }
    }

    // If not found and format includes JSON
    if (!featureMember && featureInfoFormat.includes(GVWMS.MIME_TYPE_FORMAT_JSON)) {
      try {
        // Try to get the feature member using JSON format
        featureMember = await GVWMS.#getFeatureInfoUsingJSON(
          wmsLayerConfig,
          wmsSource,
          clickCoordinate,
          viewResolution,
          this.getGetFeatureInfoTolerance(),
          projectionCode,
          GVWMS.MIME_TYPE_FORMAT_JSON,
          this.getGetFeatureInfoFeatureCount(),
          abortController
        );

        // Keep in mind, this output format works
        this.#featureOutputFormatWMSWorked = GVWMS.MIME_TYPE_FORMAT_JSON;
      } catch (error: unknown) {
        // Log if the request was not aborted, when aborted, we don't really care for logging
        GVWMS.#logErrorThrowIfAborted(
          error,
          `${wmsLayerConfig.getLayerNameCascade()} - Failed to retrieve featureMember using JSON, eat the error, we'll try with another format`
        );
      }
    }

    // If not found and format includes application/vnd.ogc.gml
    if (!featureMember && featureInfoFormat.includes(GVWMS.MIME_TYPE_FORMAT_GML)) {
      try {
        // Try to get the feature member using GML format
        featureMember = await GVWMS.#getFeatureInfoUsingGML(
          wmsLayerConfig,
          wmsSource,
          clickCoordinate,
          viewResolution,
          this.getGetFeatureInfoTolerance(),
          projectionCode,
          this.getGetFeatureInfoFeatureCount(),
          abortController
        );

        // Keep in mind, this output format works
        this.#featureOutputFormatWMSWorked = GVWMS.MIME_TYPE_FORMAT_GML;
      } catch (error: unknown) {
        // Log if the request was not aborted, when aborted, we don't really care for logging
        GVWMS.#logErrorThrowIfAborted(
          error,
          `${wmsLayerConfig.getLayerNameCascade()} - Failed to retrieve featureMember using GML, eat the error, we'll try with another format`
        );
      }
    }

    // If not found and format includes XML
    if (!featureMember && featureInfoFormat.includes(GVWMS.MIME_TYPE_FORMAT_TEXT_XML)) {
      try {
        // Try to get the feature member using XML format
        featureMember = await GVWMS.#getFeatureInfoUsingXML(
          wmsLayerConfig,
          wmsSource,
          clickCoordinate,
          viewResolution,
          this.getGetFeatureInfoTolerance(),
          projectionCode,
          abortController
        );

        // Keep in mind, this output format works
        this.#featureOutputFormatWMSWorked = GVWMS.MIME_TYPE_FORMAT_TEXT_XML;
      } catch (error: unknown) {
        // Log if the request was not aborted, when aborted, we don't really care for logging
        GVWMS.#logErrorThrowIfAborted(
          error,
          `${wmsLayerConfig.getLayerNameCascade()} - Failed to retrieve featureMember using XML, eat the error, we'll try with another format`
        );
      }
    }

    // If not found and format includes HTML
    if (!featureMember && featureInfoFormat.includes(GVWMS.MIME_TYPE_FORMAT_HTML)) {
      try {
        // Try to get the feature member using HTML format
        const featMember = await GVWMS.#getFeatureInfoUsingHTML(
          wmsLayerConfig,
          wmsSource,
          clickCoordinate,
          viewResolution,
          this.getGetFeatureInfoTolerance(),
          projectionCode,
          abortController
        );
        featureMember = [featMember];
      } catch (error: unknown) {
        // Log if the request was not aborted, when aborted, we don't really care for logging
        GVWMS.#logErrorThrowIfAborted(
          error,
          `${wmsLayerConfig.getLayerNameCascade()} - Failed to retrieve featureMember using HTML, eat the error, we'll try with another format`
        );
      }
    }

    // If not found anything, last attempt with text/plain
    if (!featureMember) {
      try {
        const featMember = await GVWMS.#getFeatureInfoUsingPlain(
          wmsLayerConfig,
          wmsSource,
          clickCoordinate,
          viewResolution,
          this.getGetFeatureInfoTolerance(),
          projectionCode,
          abortController
        );
        featureMember = [featMember];
      } catch (error: unknown) {
        // Log if the request was not aborted, when aborted, we don't really care for logging
        GVWMS.#logErrorThrowIfAborted(
          error,
          `${wmsLayerConfig.getLayerNameCascade()} - Failed to retrieve featureMember using plain text. Nothing can be done.`
        );
      }
    }

    // If any found result
    if (featureMember) {
      // Format and return the information
      return {
        results: GVWMS.#formatWmsFeatureInfoResult(
          wmsLayerConfig.layerPath,
          wmsLayerConfig.getNameField(),
          language,
          featureMember,
          clickCoordinate
        ),
      };
    }

    // Failed
    throw new LayerInvalidFeatureInfoFormatWMSError(wmsLayerConfig.layerPath, featureInfoFormat, wmsLayerConfig.getLayerNameCascade());
  }

  // #endregion PRIVATE METHODS

  // #region STATIC METHODS

  /**
   * Applies a view filter to a WMS or an Esri Image layer's source by updating the source parameters.
   *
   * This function is responsible for generating the appropriate filter expression based on the layer configuration,
   * optional style, and time-based fragments. It ensures the filter is only applied if it has changed or needs to be reset.
   *
   * @param layerConfig - The configuration object for the WMS or Esri Image layer
   * @param source - The OpenLayers `ImageWMS` or `ImageArcGISRest` source instance to which the filter will be applied
   * @param filter - The raw filter string input (defaults to an empty string if not provided)
   * @throws {LayerInvalidLayerFilterError} When the filter expression fails to parse or cannot be applied
   */
  static applyViewFilterOnSource(
    layerConfig: OgcWmsLayerEntryConfig | EsriImageLayerEntryConfig,
    source: ImageWMS | ImageArcGISRest,
    filter: LayerFilters | undefined
  ): void {
    // Create the source parameter to update
    const sourceParams: { TIME?: string; FILTER?: string } = {};

    // Parse
    let currentDataFilter: string | undefined;
    let currentDatetimeFilter: string | undefined;
    let newDataFilter: string | undefined;
    let newDatetimeFilter: string | undefined;
    try {
      // Get the current data filter
      currentDataFilter = source.getParams()['FILTER'];

      // Get the current datetime filter
      currentDatetimeFilter = source.getParams()['TIME'];

      // If working with a WMS layer entry config, it's possible that it's filtered based on its style, which is no possible with Esri Image
      if (layerConfig instanceof OgcWmsLayerEntryConfig) {
        // Init to nothing
        sourceParams.FILTER = undefined;

        // Get the data filters if any
        newDataFilter = filter?.getDataRelatedFilters();

        // If filtering
        if (newDataFilter) {
          // Build a OGC Filter for the filter
          const ogcXmlFilter = WfsRenderer.sqlToOlFilterXml(
            newDataFilter,
            layerConfig.getVersionOrDefault(),
            layerConfig.getOutfields()?.[0]?.name!
          );

          // Wrap the ogc filter request
          sourceParams.FILTER = WfsRenderer.wrapOGCFilter(ogcXmlFilter, 'wms', layerConfig.getVersionOrDefault());
        }
      }

      // Init to nothing
      sourceParams.TIME = undefined;

      // Check the time filter
      newDatetimeFilter = filter?.getTimeFilter();
      if (newDatetimeFilter) {
        // Read the date filter
        const queryElements = newDatetimeFilter.split(/(?<=\b)\s*=/);

        // If there's a specific filter
        if (queryElements.length > 1) {
          // Parse the filter value to use
          const datetimeFilter = GVLayerUtilities.parseDateTimeValuesEsriImageOrWMS(
            queryElements[1].trim(),
            layerConfig.getServiceDateTimezone()
          );

          // Create the source parameter to update
          sourceParams.TIME = datetimeFilter.replace(/\s*/g, '');
        }
      }

      // Determine if we should update the filter
      const shouldUpdateFilter = sourceParams.FILTER !== currentDataFilter || sourceParams.TIME !== currentDatetimeFilter;

      // If should update the filtering
      if (shouldUpdateFilter) {
        // Update the source param
        source.updateParams(sourceParams);
      }
    } catch (error: unknown) {
      // Failed
      throw new LayerInvalidLayerFilterError(
        layerConfig.layerPath,
        layerConfig.getLayerNameCascade(),
        `data: ${newDataFilter}, datetime: ${newDatetimeFilter}`,
        `data: ${currentDataFilter}, datetime: ${currentDatetimeFilter}`,
        formatError(error)
      );
    }
  }

  /**
   * Retrieves feature information from a WMS layer using the `application/json` or `application/geojson` info format.
   *
   * This method performs a `GetFeatureInfo` request at the specified map coordinate,
   * using the provided WMS source and projection. It returns a Promise of a Record<string, unknown> response.
   *
   * @param layerConfig - Configuration object for the target WMS layer
   * @param wmsSource - The OpenLayers WMS source used to construct the request
   * @param clickCoordinate - The coordinate on the map where the user clicked
   * @param viewResolution - The current resolution of the map view
   * @param projectionCode - The projection in which the request should be made (e.g., 'EPSG:3857')
   * @param infoFormat - The info format to query in
   * @param maxFeatures - Optional maximum number of features to include in response when we want more than 1
   * @param abortController - Optional {@link AbortController} to allow cancellation of the request
   * @returns A promise that resolves with an array of feature member records
   */
  static async #getFeatureInfoUsingJSON(
    layerConfig: OgcWmsLayerEntryConfig,
    wmsSource: ImageWMS,
    clickCoordinate: Coordinate,
    viewResolution: number,
    qgisServerTolerance: number,
    projectionCode: ProjectionLike,
    infoFormat: 'application/json' | 'application/geojson',
    maxFeatures: number | undefined,
    abortController: AbortController | undefined = undefined
  ): Promise<Record<string, unknown>[]> {
    // Try to get the information using xml format
    const responseData = await GVWMS.#readFeatureInfo(
      layerConfig,
      wmsSource,
      clickCoordinate,
      viewResolution,
      qgisServerTolerance,
      projectionCode,
      infoFormat,
      maxFeatures,
      abortController
    );

    // Parse the content as json
    const responseJson = JSON.parse(responseData);

    // If the response is an empty json, the response was good, we trust it as there were no features
    let featureMember: Record<string, unknown>[] | undefined;
    if (Object.keys(responseJson).length === 0 && responseJson.constructor === Object) {
      featureMember = [];
    }

    // If the response is a geojson
    if (responseJson.type === 'FeatureCollection') {
      // Get the features
      const featureCollection = GVWMS.#getAttribute(responseJson, 'features');
      if (featureCollection && Array.isArray(featureCollection)) {
        // If array is empty, the response was good, we trust it as there were no features
        featureMember = [];

        // Loop on the features
        featureCollection.forEach((feature) => {
          // Read the properties
          const readProps = GVWMS.#getAttribute(feature, 'properties');
          if (readProps) {
            featureMember!.push(readProps);
          }
        });
      }
    }

    // If found
    if (featureMember) {
      // Success!
      return featureMember;
    }

    // Failed
    throw new LayerInvalidFeatureInfoFormatWMSError(layerConfig.layerPath, infoFormat, layerConfig.getLayerNameCascade());
  }

  /**
   * Retrieves feature information from a WMS layer using the `application/vnd.ogc.gml` info format.
   *
   * This method performs a `GetFeatureInfo` request and parses namespaced GML responses into a
   * standardized array of feature-member records. It supports both standard `gml:featureMember`
   * payloads and fallback payloads that omit that wrapper.
   *
   * @param layerConfig - Configuration object for the target WMS layer
   * @param wmsSource - The OpenLayers WMS source used to construct the request
   * @param clickCoordinate - The coordinate on the map where the user clicked
   * @param viewResolution - The current resolution of the map view
   * @param qgisServerTolerance - The QGIS Server feature info pixel tolerance
   * @param projectionCode - The projection in which the request should be made (e.g., 'EPSG:3857')
   * @param maxFeatures - Optional maximum number of features to include in response when we want more than 1
   * @param abortController - Optional {@link AbortController} to allow cancellation of the request
   * @returns A promise that resolves with an array of feature member records
   */
  static async #getFeatureInfoUsingGML(
    layerConfig: OgcWmsLayerEntryConfig,
    wmsSource: ImageWMS,
    clickCoordinate: Coordinate,
    viewResolution: number,
    qgisServerTolerance: number,
    projectionCode: ProjectionLike,
    maxFeatures: number | undefined,
    abortController: AbortController | undefined = undefined
  ): Promise<Record<string, unknown>[]> {
    // Try to get the information using GML format
    const responseData = await GVWMS.#readFeatureInfo(
      layerConfig,
      wmsSource,
      clickCoordinate,
      viewResolution,
      qgisServerTolerance,
      projectionCode,
      GVWMS.MIME_TYPE_FORMAT_GML,
      maxFeatures,
      abortController
    );

    // Parse the content as XML
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(responseData, GVWMS.MIME_TYPE_FORMAT_APP_XML);

    // Abort if XML could not be parsed
    if (xmlDoc.getElementsByTagName('parsererror').length > 0) {
      throw new LayerInvalidFeatureInfoFormatWMSError(layerConfig.layerPath, GVWMS.MIME_TYPE_FORMAT_GML, layerConfig.getLayerNameCascade());
    }

    // Preferred path: parse standard gml:featureMember entries using localName for namespace safety.
    const allElements = Array.from(xmlDoc.getElementsByTagName('*'));
    const featureMemberElements = allElements.filter((element) => element.localName === 'featureMember');

    const featureMember: Record<string, unknown>[] = [];
    featureMemberElements.forEach((featureMemberElement): void => {
      const featureElements = GVWMS.#getXmlChildElements(featureMemberElement);

      // A featureMember usually wraps exactly one feature element, but process all to be safe.
      featureElements.forEach((featureElement): void => {
        featureMember.push(GVWMS.#convertXmlElementToRecord(featureElement));
      });
    });

    // Fallback path: some services don't use gml:featureMember.
    if (featureMember.length === 0 && xmlDoc.documentElement) {
      const fallbackCandidates = allElements.filter((element) => {
        const children = GVWMS.#getXmlChildElements(element);
        if (children.length === 0) return false;

        // Candidate features have at least one non-GML direct child field.
        return children.some((child) => child.prefix !== 'gml' && GVWMS.#getXmlChildElements(child).length === 0);
      });

      fallbackCandidates.forEach((candidate): void => {
        featureMember.push(GVWMS.#convertXmlElementToRecord(candidate));
      });

      // A valid GML response can legitimately contain zero features.
      if (fallbackCandidates.length === 0) {
        return [];
      }
    }

    // Success, including valid empty feature collections.
    return featureMember;
  }

  /**
   * Retrieves feature information from a WMS layer using the `text/xml` info format.
   *
   * This method performs a `GetFeatureInfo` request at the specified map coordinate,
   * using the provided WMS source and projection. It returns a Promise of a Record<string, unknown> response.
   *
   * @param layerConfig - Configuration object for the target WMS layer
   * @param wmsSource - The OpenLayers WMS source used to construct the request
   * @param clickCoordinate - The coordinate on the map where the user clicked
   * @param viewResolution - The current resolution of the map view
   * @param projectionCode - The projection in which the request should be made (e.g., 'EPSG:3857')
   * @param abortController - Optional {@link AbortController} to allow cancellation of the request
   * @returns A promise that resolves with an array of feature member records
   */
  static async #getFeatureInfoUsingXML(
    layerConfig: OgcWmsLayerEntryConfig,
    wmsSource: ImageWMS,
    clickCoordinate: Coordinate,
    viewResolution: number,
    qgisServerTolerance: number,
    projectionCode: ProjectionLike,
    abortController: AbortController | undefined = undefined
  ): Promise<Record<string, unknown>[]> {
    // Try to get the information using xml format
    const responseData = await GVWMS.#readFeatureInfo(
      layerConfig,
      wmsSource,
      clickCoordinate,
      viewResolution,
      qgisServerTolerance,
      projectionCode,
      GVWMS.MIME_TYPE_FORMAT_TEXT_XML,
      undefined,
      abortController
    );

    // Read the response as json
    const jsonResponse = parseXMLToJson(responseData);

    // Try to get the feature member
    let featureMember: Record<string, unknown> | undefined;
    const featureCollection = GVWMS.#getAttribute(jsonResponse, 'FeatureCollection');
    if (featureCollection) {
      featureMember = GVWMS.#getAttribute(featureCollection, 'featureMember');

      // A recognized FeatureCollection without a feature member is a valid empty response.
      if (!featureMember) {
        return [];
      }
    } else {
      const featureInfoResponse = GVWMS.#getAttribute(jsonResponse, 'FeatureInfoResponse');
      if (featureInfoResponse) {
        featureMember = GVWMS.#getAttribute(featureInfoResponse, 'FIELDS');
        if (featureMember) featureMember = GVWMS.#getAttribute(featureMember, '@attributes');
        else return [];
      } else {
        const getFeatureInfoResponse = GVWMS.#getAttribute(jsonResponse, 'GetFeatureInfoResponse');

        // If there's a 'Layer' property
        if (getFeatureInfoResponse && 'Layer' in getFeatureInfoResponse) {
          // Cast it
          const getFeatureInfoResponseCasted = getFeatureInfoResponse as unknown as TypeMetadataFeatureInfo;
          featureMember = {};
          featureMember['Layer name'] = getFeatureInfoResponseCasted?.Layer?.['@attributes']?.name;
          if (getFeatureInfoResponseCasted?.Layer?.Attribute?.['@attributes']) {
            const fieldName = getFeatureInfoResponseCasted.Layer.Attribute['@attributes'].name;
            const fieldValue = getFeatureInfoResponseCasted.Layer.Attribute['@attributes'].value;
            featureMember[fieldName] = fieldValue;
          }
        } else if (getFeatureInfoResponse) {
          return [];
        }
      }
    }

    // If found
    if (featureMember) {
      // Success!
      return [featureMember];
    }

    // Failed
    throw new LayerInvalidFeatureInfoFormatWMSError(
      layerConfig.layerPath,
      GVWMS.MIME_TYPE_FORMAT_TEXT_XML,
      layerConfig.getLayerNameCascade()
    );
  }

  /**
   * Retrieves feature information from a WMS layer using the `text/html` info format.
   *
   * This method performs a `GetFeatureInfo` request at the specified map coordinate,
   * using the provided WMS source and projection. It returns the html response
   * wrapped in a structured object for downstream compatibility.
   *
   * @param layerConfig - Configuration object for the target WMS layer
   * @param wmsSource - The OpenLayers WMS source used to construct the request
   * @param clickCoordinate - The coordinate on the map where the user clicked
   * @param viewResolution - The current resolution of the map view
   * @param projectionCode - The projection in which the request should be made (e.g., 'EPSG:3857')
   * @param abortController - Optional {@link AbortController} to allow cancellation of the request
   * @returns A promise that resolves with an object containing the html info response under the key `html`
   */
  static async #getFeatureInfoUsingHTML(
    layerConfig: OgcWmsLayerEntryConfig,
    wmsSource: ImageWMS,
    clickCoordinate: Coordinate,
    viewResolution: number,
    qgisServerTolerance: number,
    projectionCode: ProjectionLike,
    abortController: AbortController | undefined = undefined
  ): Promise<Record<string, unknown>> {
    // Try to get the information using html format
    const responseData = await GVWMS.#readFeatureInfo(
      layerConfig,
      wmsSource,
      clickCoordinate,
      viewResolution,
      qgisServerTolerance,
      projectionCode,
      GVWMS.MIME_TYPE_FORMAT_HTML,
      undefined,
      abortController
    );

    // Check if the response is a WMS ServiceException XML
    const parser = new DOMParser();
    const xmlTestDoc = parser.parseFromString(responseData, GVWMS.MIME_TYPE_FORMAT_APP_XML);
    if (
      xmlTestDoc.documentElement?.localName?.toLowerCase() === 'serviceexceptionreport' ||
      xmlTestDoc.documentElement?.localName?.toLowerCase() === 'serviceexception'
    ) {
      throw new LayerInvalidFeatureInfoFormatWMSError(
        layerConfig.layerPath,
        GVWMS.MIME_TYPE_FORMAT_HTML,
        layerConfig.getLayerNameCascade()
      );
    }

    // Read the response as html
    const xmlDomResponse = new DOMParser().parseFromString(responseData, GVWMS.MIME_TYPE_FORMAT_HTML);

    // Get body text content and trim it
    const bodyContent = xmlDomResponse.body?.textContent?.trim();

    // Check if it's empty or only whitespace
    if (!bodyContent) {
      throw new LayerInvalidFeatureInfoFormatWMSError(
        layerConfig.layerPath,
        GVWMS.MIME_TYPE_FORMAT_HTML,
        layerConfig.getLayerNameCascade()
      );
    }

    // The response is in html format
    return { html: responseData };
  }

  /**
   * Retrieves feature information from a WMS layer using the `text/plain` info format.
   *
   * This method performs a `GetFeatureInfo` request at the specified map coordinate,
   * using the provided WMS source and projection. It returns the plain-text response
   * wrapped in a structured object for downstream compatibility.
   *
   * @param layerConfig - Configuration object for the target WMS layer
   * @param wmsSource - The OpenLayers WMS source used to construct the request
   * @param clickCoordinate - The coordinate on the map where the user clicked
   * @param viewResolution - The current resolution of the map view
   * @param projectionCode - The projection in which the request should be made (e.g., 'EPSG:3857')
   * @param abortController - Optional {@link AbortController} to allow cancellation of the request
   * @returns A promise that resolves with an object containing the plain-text feature info response
   *          under the key `plain_text['#text']`
   */
  static async #getFeatureInfoUsingPlain(
    layerConfig: OgcWmsLayerEntryConfig,
    wmsSource: ImageWMS,
    clickCoordinate: Coordinate,
    viewResolution: number,
    qgisServerTolerance: number,
    projectionCode: ProjectionLike,
    abortController: AbortController | undefined = undefined
  ): Promise<Record<string, unknown>> {
    // Try to get the information using plain format
    const responseData = await GVWMS.#readFeatureInfo(
      layerConfig,
      wmsSource,
      clickCoordinate,
      viewResolution,
      qgisServerTolerance,
      projectionCode,
      GVWMS.MIME_TYPE_FORMAT_TEXT,
      undefined,
      abortController
    );

    // Sanitize response by stripping any HTML/XML nodes and keeping only text content
    const parser = new DOMParser();
    const htmlDoc = parser.parseFromString(responseData, GVWMS.MIME_TYPE_FORMAT_HTML);
    const sanitizedText = htmlDoc.body?.textContent?.trim() || '';

    // If no meaningful text remains after sanitization, treat as invalid
    if (!sanitizedText) {
      throw new LayerInvalidFeatureInfoFormatWMSError(
        layerConfig.layerPath,
        GVWMS.MIME_TYPE_FORMAT_TEXT,
        layerConfig.getLayerNameCascade()
      );
    }

    // The response is in plain format
    // eslint-disable-next-line camelcase
    return { plain_text: { '#text': sanitizedText } };
  }

  /**
   * Attempts to retrieve feature information from a WMS layer at a specified coordinate.
   *
   * Builds a GetFeatureInfo URL using the WMS source and fetches the response as plain text.
   * If the feature info URL cannot be generated, an error is thrown.
   *
   * @param layerConfig - The configuration object for the WMS layer
   * @param wmsSource - The OpenLayers WMS source used to construct the GetFeatureInfo URL
   * @param clickCoordinate - The map coordinate where the user clicked
   * @param viewResolution - The current map view resolution
   * @param projectionCode - The projection of the map (e.g., 'EPSG:3857')
   * @param infoFormat - The desired format for the feature info response (e.g., 'text/xml', 'application/json')
   * @param maxFeatures - Optional maximum number of features to include in response when we want more than 1
   * @param abortController - Optional {@link AbortController} to cancel the request if needed
   * @returns A promise that resolves with the response text from the GetFeatureInfo request
   * @throws {LayerInvalidFeatureInfoFormatWMSError} When the GetFeatureInfo URL could not be constructed,
   *         which likely indicates the info format is unsupported or the layer is misconfigured.
   */
  static #readFeatureInfo(
    layerConfig: OgcWmsLayerEntryConfig,
    wmsSource: ImageWMS,
    clickCoordinate: Coordinate,
    viewResolution: number,
    qgisServerTolerance: number,
    projectionCode: ProjectionLike,
    infoFormat: string,
    maxFeatures: number | undefined,
    abortController: AbortController | undefined = undefined
  ): Promise<string> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const params: any = {
      INFO_FORMAT: infoFormat,
    };

    // If we have a max features parameter to set
    if (maxFeatures) {
      params.FEATURE_COUNT = maxFeatures;
    }

    // Set the QGIS Server tolerances
    params.FI_POINT_TOLERANCE = qgisServerTolerance;
    params.FI_LINE_TOLERANCE = qgisServerTolerance;
    params.FI_POLYGON_TOLERANCE = qgisServerTolerance;

    // Generate the url
    const featureInfoUrl = wmsSource?.getFeatureInfoUrl(clickCoordinate, viewResolution, projectionCode, params);

    // If generated a url
    if (featureInfoUrl) {
      // Get the response data as text
      return Fetch.fetchText(featureInfoUrl, { signal: abortController?.signal });
    }

    // Error
    throw new LayerInvalidFeatureInfoFormatWMSError(layerConfig.layerPath, infoFormat, layerConfig.getLayerNameCascade());
  }

  /**
   * Formats one or more WMS feature members into standardized feature info entries.
   *
   * @param layerPath - The layer path used to identify the WMS layer
   * @param nameField - The field name to use as the display name for features, if available
   * @param language - The display language, used to guess the best name field if `nameField` is not provided
   * @param featureMember - A single feature member or an array of feature members
   * @param clickCoordinate - The coordinate where the user clicked on the map
   * @returns An array of formatted feature info entries
   */
  static #formatWmsFeatureInfoResult(
    layerPath: string,
    nameField: string | undefined,
    language: TypeDisplayLanguage, // Used if we have to guess the field name for the 'nameField'
    featureMember: Record<string, unknown> | Record<string, unknown>[],
    clickCoordinate: Coordinate
  ): TypeFeatureInfoEntry[] {
    const results: TypeFeatureInfoEntry[] = [];
    let featureKeyCounter = 0;

    if (Array.isArray(featureMember)) {
      featureMember.forEach((feature) => {
        if (feature && typeof feature === 'object') {
          results.push(
            this.#formatWmsFeatureInfoResultParser(feature, layerPath, nameField, language, clickCoordinate, featureKeyCounter++)
          );
        }
      });
    } else if (featureMember && typeof featureMember === 'object') {
      results.push(
        this.#formatWmsFeatureInfoResultParser(featureMember, layerPath, nameField, language, clickCoordinate, featureKeyCounter++)
      );
    }

    return results;
  }

  /**
   * Creates a TypeFeatureInfoEntry from a single WMS feature object.
   *
   * @param feature - The raw feature object from a WMS GetFeatureInfo response
   * @param layerPath - The WMS layer path
   * @param nameField - The field name to use as the display name for the feature, if available
   * @param language - The display language, used to guess the best name field if `nameField` is not provided
   * @param clickCoordinate - The map click coordinate
   * @param featureKey - The unique feature key
   * @returns The formatted feature info entry
   */
  static #formatWmsFeatureInfoResultParser(
    feature: unknown,
    layerPath: string,
    nameField: string | undefined,
    language: TypeDisplayLanguage, // Used if we have to guess the field name for the 'nameField'
    clickCoordinate: Coordinate,
    featureKey: number
  ): TypeFeatureInfoEntry {
    let fieldKeyCounter = 0;

    const featureInfo: TypeFeatureInfoEntry = {
      featureKey,
      geoviewLayerType: CONST_LAYER_TYPES.WMS,
      extent: [clickCoordinate[0], clickCoordinate[1], clickCoordinate[0], clickCoordinate[1]],
      featureIcon: document.createElement('canvas').toDataURL(),
      fieldInfo: {},
      supportZoomTo: true,
      layerPath,
      nameField,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const extractFields = (obj: any, prefix = ''): void => {
      Object.keys(obj).forEach((key) => {
        if (key.endsWith('Geometry') || key.startsWith('@')) return;

        const parts = key.split(':');
        const fieldName = parts[parts.length - 1];
        const fullFieldName = prefix ? `${prefix}.${fieldName}` : fieldName;
        const rawValue = obj[key];
        let value: unknown = rawValue;
        if (rawValue && typeof rawValue === 'object' && '#text' in rawValue) value = rawValue['#text'];

        // If value has to go recursive
        if (value && typeof value === 'object') {
          // Go recursive
          extractFields(value, fullFieldName);
        } else {
          // If the value looks like a date
          const dataType: TypeOutfieldsType = 'string';
          const dataValue: unknown = value;

          // TODO: EXPERIMENT - Try parsing dates to dynamically 'spot' date values inside data?
          // // If the value is a string
          // if (typeof value === 'string') {
          //   const dateDate = DateMgt.tryParseDate(value);
          //   if (dateDate) {
          //     dataType = 'date';
          //     dataValue = dateDate;
          //   }
          // }

          // Compile it
          featureInfo.fieldInfo[fullFieldName] = {
            fieldKey: fieldKeyCounter++,
            value: dataValue ?? '',
            dataType,
            alias: fullFieldName,
          };
        }
      });
    };

    // Call sub-function
    extractFields(feature);

    // Find the best name field and validate its existance at the same time when one was initially configured
    featureInfo.nameField = AbstractGVLayer.findBestNameField(featureInfo.nameField, featureInfo.fieldInfo, language);

    // Return the gathered feature information
    return featureInfo;
  }

  /**
   * Filters child nodes and returns only direct child Element nodes.
   *
   * @param element - The parent element whose children will be filtered
   * @returns An array containing only Element-type child nodes
   */
  static #getXmlChildElements(element: Element): Element[] {
    return Array.from(element.childNodes).filter((node): node is Element => node.nodeType === Node.ELEMENT_NODE);
  }

  /**
   * Adds a property to a record, aggregating duplicate keys as arrays.
   *
   * When a property key already exists, the values are collected into an array.
   * This is useful for XML elements that can have multiple children with the same tag name.
   *
   * @param record - The record to update
   * @param key - The property key to add or update
   * @param value - The value to add
   * @returns A new record with the property added or updated
   */
  static #addXmlRecordProperty(record: Record<string, unknown>, key: string, value: unknown): Record<string, unknown> {
    const currentValue = record[key];
    if (currentValue === undefined) {
      return { ...record, [key]: value };
    }

    if (Array.isArray(currentValue)) {
      return { ...record, [key]: [...currentValue, value] };
    }

    return { ...record, [key]: [currentValue, value] };
  }

  /**
   * Recursively converts an XML element and its children into an object record.
   *
   * Nested elements are converted to nested records. Text content is preserved,
   * with empty strings maintained to distinguish from missing content.
   *
   * @param element - The XML element to convert
   * @returns An object record representing the element and its descendants
   */
  static #convertXmlElementToRecord(element: Element): Record<string, unknown> {
    let record: Record<string, unknown> = {};
    const children = GVWMS.#getXmlChildElements(element);

    children.forEach((child): void => {
      const key = child.nodeName;
      const childElements = GVWMS.#getXmlChildElements(child);

      // Preserve empty values while still supporting nested structures.
      const value: unknown = childElements.length > 0 ? GVWMS.#convertXmlElementToRecord(child) : (child.textContent?.trim() ?? '');
      record = GVWMS.#addXmlRecordProperty(record, key, value);
    });

    return record;
  }

  /**
   * Gets the legend image of a layer.
   *
   * @param layerConfig - The layer configuration
   * @param chosenStyle - Style to get the legend image for
   * @returns A promise that resolves to an image blob or null if it fails to retrieve the legend image
   */
  static async #getLegendImage(layerConfig: OgcWmsLayerEntryConfig, chosenStyle?: string): Promise<string | ArrayBuffer | null> {
    // Get the legend URL from the layer metadata
    let queryUrl = layerConfig.getLegendUrl(chosenStyle);

    // If no legend url could be found in the metadata
    if (!queryUrl) {
      // Try to guess it reading more into the Capabilities
      const hasGetLegendGraphic = Object.keys(layerConfig.getServiceMetadata()?.Capability?.Request || {}).includes('GetLegendGraphic');
      if (hasGetLegendGraphic) {
        queryUrl = GeoUtilities.ensureServiceRequestUrlGetLegendGraphic(
          layerConfig.getMetadataAccessPath()!,
          layerConfig.layerId,
          layerConfig.getVersionOrDefault()
        );
      }
    }

    // Fetch and return the image (handle proxy fallback for CORS/network errors)
    if (!queryUrl) throw new ResponseContentError('No url to fetch the legend with');

    // Ensure HTTPS
    if (queryUrl.toLowerCase().startsWith('http:')) {
      queryUrl = `https${queryUrl.slice(4)}`;
    }

    try {
      // Fetch the image (must await so CORS/network errors are caught below)
      return await Fetch.fetchBlobImage(queryUrl);
    } catch (error) {
      // Retry with proxy if it's a network error (e.g., CORS)
      if (error instanceof NetworkError) {
        // Read the blob again, using the proxy this time
        const proxyUrl = `${CONFIG_PROXY_URL}?${queryUrl}`;
        return Fetch.fetchBlobImage(proxyUrl);
      }

      // Failed
      throw error;
    }
  }

  /**
   * Returns the attribute of an object that ends with the specified ending string or null if not found.
   *
   * @param jsonObject - The object that is supposed to have the needed attribute
   * @param attributeEnding - The attribute searched
   * @returns The attribute information or undefined when not found
   */
  static #getAttribute(jsonObject: unknown, attributeEnding: string): Record<string, unknown> | undefined {
    if (typeof jsonObject === 'object' && jsonObject !== null && !Array.isArray(jsonObject)) {
      const record = jsonObject as Record<string, Record<string, unknown>>;
      const keyFound = Object.keys(record).find((key) => key.endsWith(attributeEnding));
      return keyFound ? record[keyFound] : undefined;
    }
    return undefined;
  }

  /**
   * Build a buffered polygon (GML) around a clicked coordinate.
   *
   * @param clickCoordinate - coordinate in map projection
   * @param resolution - The map resolution
   * @param pixelTolerance - number of screen pixels (like ArcGIS Identify)
   * @returns The buffered polygon
   */
  static #buildBufferPolygon(clickCoordinate: Coordinate, resolution: number, pixelTolerance = 10): Polygon {
    // The buffer radius
    const bufferRadius = resolution * (pixelTolerance / 2); // buffer in map units

    // Convert Circle to Polygon manually
    const segments = 32; // smoothness
    const coordinates: number[][] = [];
    for (let i = 0; i < segments; i++) {
      const angle = (2 * Math.PI * i) / segments;
      const x = clickCoordinate[0] + bufferRadius * Math.cos(angle);
      const y = clickCoordinate[1] + bufferRadius * Math.sin(angle);
      coordinates.push([x, y]);
    }
    // Close the polygon
    coordinates.push(coordinates[0]);

    // Return the polygon
    return new Polygon([coordinates]);
  }

  /**
   * Logs the provided error with the given message if the error is not a `RequestAbortedError`. If the error is a `RequestAbortedError`, it rethrows it to be handled by the caller.
   *
   * @param error - The error to check and log if necessary
   * @param message - The message to log alongside the error if it's not a `RequestAbortedError`
   * @throws {RequestAbortedError} When the error is an instance of `RequestAbortedError`, it is rethrown for the caller to handle
   */
  static #logErrorThrowIfAborted(error: unknown, message: string): void {
    // If the error is a RequestAborted error, rethrow it, we want it to be handled by the caller and not eaten by the various attempts to get the feature info
    if (error instanceof RequestAbortedError) throw error;

    // Failed to retrieve features, log it as a warning
    logger.logWarning(message, error);
  }

  // #endregion STATIC METHODS

  // #region EVENTS

  /**
   * Emits a WMS style changed event to all handlers.
   *
   * @param event - The event to emit
   */
  #emitWmsStyleChanged(event: WMSStyleChangedEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onWmsStyleChangedHandlers, event);
  }

  /**
   * Registers a WMS style changed event handler.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   * @returns The registered callback, which can be used to unregister the event handler later
   */
  onWmsStyleChanged(callback: WMSStyleChangedDelegate): WMSStyleChangedDelegate {
    // Register the event handler
    return EventHelper.onEvent(this.#onWmsStyleChangedHandlers, callback);
  }

  /**
   * Unregisters a WMS style changed event handler.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offWmsStyleChanged(callback: WMSStyleChangedDelegate | undefined): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onWmsStyleChangedHandlers, callback);
  }

  // #endregion EVENTS
}

/** Defines the CRS override used to request WMS images in a different projection. */
export type CRSOverride = { layerProjection: string; mapProjection: string };

/**
 * Define an event for the delegate.
 */
export interface WMSStyleChangedEvent extends LayerBaseEvent {
  /** The WMS style name that was applied. */
  wmsStyleName: string;
}

/**
 * Define a delegate for the event handler function signature.
 */
export type WMSStyleChangedDelegate = EventDelegateBase<GVWMS, WMSStyleChangedEvent, void>;
