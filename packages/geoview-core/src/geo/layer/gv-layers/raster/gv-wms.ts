import ImageLayer from 'ol/layer/Image';
import type { Options as ImageOptions } from 'ol/layer/BaseImage';
import type { Coordinate } from 'ol/coordinate';
import type { ImageArcGISRest, ImageWMS } from 'ol/source';
import type { Extent } from 'ol/extent';
import type { Projection as OLProjection, ProjectionLike } from 'ol/proj';
import type { Map as OLMap } from 'ol';
import { Polygon } from 'ol/geom';

import EventHelper, { type EventDelegateBase } from '@/api/events/event-helper';
import type { TypeLegend } from '@/core/stores/store-interface-and-intial-values/layer-state';
import { Fetch } from '@/core/utils/fetch-helper';
import { xmlToJson } from '@/core/utils/utilities';
import { GeoUtilities } from '@/geo/utils/utilities';
import { parseDateTimeValuesEsriImageOrWMS } from '@/geo/layer/gv-layers/utils';
import { logger } from '@/core/utils/logger';
import { OgcWmsLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/ogc-wms-layer-entry-config';
import type { OgcWfsLayerEntryConfig } from '@/api/config/validation-classes/vector-validation-classes/wfs-layer-entry-config';
import type { TypeFeatureInfoEntry, TypeLayerStyleConfig } from '@/api/types/map-schema-types';
import { CONFIG_PROXY_URL } from '@/api/types/map-schema-types';
import type { TypeMetadataFeatureInfo } from '@/api/types/layer-schema-types';
import { CONST_LAYER_TYPES } from '@/api/types/layer-schema-types';
import { GeoviewRenderer } from '@/geo/utils/renderer/geoview-renderer';
import { AbstractGVRaster } from '@/geo/layer/gv-layers/raster/abstract-gv-raster';
import { GVEsriDynamic } from '@/geo/layer/gv-layers/raster/gv-esri-dynamic';
import type { GVEsriImage } from '@/geo/layer/gv-layers/raster/gv-esri-image';
import { Projection } from '@/geo/utils/projection';
import { LayerInvalidFeatureInfoFormatWMSError, LayerInvalidLayerFilterError } from '@/core/exceptions/layer-exceptions';
import { MapViewer } from '@/geo/map/map-viewer';
import { formatError, NetworkError, ResponseContentError } from '@/core/exceptions/core-exceptions';
import { type TypeDateFragments } from '@/core/utils/date-mgt';
import { AbstractGVLayer } from '@/geo/layer/gv-layers/abstract-gv-layer';
import { GVWFS } from '@/geo/layer/gv-layers/vector/gv-wfs';
import type { EsriImageLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/esri-image-layer-entry-config';
import { WfsRenderer } from '@/geo/utils/renderer/wfs-renderer';
import { NoExtentError } from '@/core/exceptions/geoview-exceptions';

/**
 * Manages a WMS layer.
 *
 * @exports
 * @class GVWMS
 */
export class GVWMS extends AbstractGVRaster {
  /** The max feature count returned by the GetFeatureInfo */
  static readonly DEFAULT_MAX_FEATURE_COUNT: number = 100;

  /** The default Get Feature Info tolerance to use for QGIS Server services which are more picky by default (really needs to be zoomed in to get results, by default) */
  static readonly DEFAULT_GET_FEATURE_INFO_TOLERANCE: number = 20;

  /** The Get Feature Info feature count to use */
  #getFeatureInfoFeatureCount: number = GVWMS.DEFAULT_MAX_FEATURE_COUNT;

  /** The Get Feature Info tolerance to use for QGIS Server services which are more picky by default (really needs to be zoomed in to get results, by default) */
  #getFeatureInfoTolerance: number = GVWMS.DEFAULT_GET_FEATURE_INFO_TOLERANCE;

  /** Keep all callback delegates references */
  #onImageLoadRescueHandlers: ImageLoadRescueDelegate[] = [];

  /** Indicates if the CRS is to be overridden, because the layer struggles loading on the map */
  #overrideCRS?: CRSOverride;

  /**
   * Constructs a GVWMS layer to manage an OpenLayer layer.
   * @param {ImageWMS} olSource - The OpenLayer source.
   * @param {OgcWmsLayerEntryConfig} layerConfig - The layer configuration.
   */
  constructor(olSource: ImageWMS, layerConfig: OgcWmsLayerEntryConfig) {
    super(olSource, layerConfig);

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
   * @returns {ImageLayer<ImageWMS>} The strongly-typed OpenLayers type.
   * @override
   */
  override getOLLayer(): ImageLayer<ImageWMS> {
    // Call parent and cast
    return super.getOLLayer() as ImageLayer<ImageWMS>;
  }

  /**
   * Overrides the parent class's method to return a more specific OpenLayers source type (covariant return).
   * @returns {ImageWMS} The ImageWMS source instance associated with this layer.
   * @override
   */
  override getOLSource(): ImageWMS {
    // Get source from OL
    return super.getOLSource() as ImageWMS;
  }

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   * @returns {OgcWmsLayerEntryConfig} The strongly-typed layer configuration specific to this layer.
   * @override
   */
  override getLayerConfig(): OgcWmsLayerEntryConfig {
    // Call parent and cast
    return super.getLayerConfig() as OgcWmsLayerEntryConfig;
  }

  /**
   * Overrides when the layer image is in error and couldn't be loaded correctly.
   * @param {Event} event - The event which is being triggered.
   */
  protected override onImageLoadError(event: Event): void {
    // The WMS image failed to load.. check if there's something we can do..
    const rescued: boolean[] = this.#emitImageLoadRescue({ imageLoadErrorEvent: event });

    // If rescued
    if (rescued.length > 0 && rescued[0]) {
      // We've rescued(?) the situation, eat the error for now
    } else {
      // Not rescued, call parent
      super.onImageLoadError(event);
    }
  }

  /**
   * Gets if the CRS is to be overridden, because the layer struggles with the current map projection.
   * @returns {CRSOverride | undefined} The CRS Override properties if any.
   */
  getOverrideCRS(): CRSOverride | undefined {
    return this.#overrideCRS;
  }

  /**
   * Sets if the CRS is to be overridden, because the layer struggles with the current map projection.
   * @param {CRSOverride | undefined} value - The CRS Override properties or undefined.
   */
  setOverrideCRS(value: CRSOverride | undefined): void {
    this.#overrideCRS = value;
  }

  /**
   * Gets the feature count used for GetFeatureInfo requests.
   * @returns {number} The current GetFeatureInfo feature count.
   */
  getGetFeatureInfoFeatureCount(): number {
    return this.#getFeatureInfoFeatureCount;
  }

  /**
   * Sets the feature count used for GetFeatureInfo requests.
   * @param {number} value - The new GetFeatureInfo feature count.
   */
  setGetFeatureInfoFeatureCount(value: number): void {
    this.#getFeatureInfoFeatureCount = value;
  }

  /**
   * Gets the current pixel tolerance used for GetFeatureInfo requests for QGIS Server Services.
   * @returns {number} The current GetFeatureInfo pixel tolerance.
   */
  getGetFeatureInfoTolerance(): number {
    return this.#getFeatureInfoTolerance;
  }

  /**
   * Sets the current pixel tolerance used for GetFeatureInfo requests for QGIS Server Services.
   * @param {number} value - The new GetFeatureInfo pixel tolerance.
   */
  setGetFeatureInfoTolerance(value: number): void {
    this.#getFeatureInfoTolerance = value;
  }

  /**
   * Overrides the return of feature information at a given coordinate.
   * @param {OLMap} map - The Map where to get Feature Info At Coordinate from.
   * @param {Coordinate} location - The coordinate that will be used by the query.
   * @param {boolean} queryGeometry - Whether to include geometry in the query, default is true.
   * @param {AbortController?} abortController - The optional abort controller.
   * @returns {Promise<TypeFeatureInfoEntry[]>} A promise of an array of TypeFeatureInfoEntry[].
   * @override
   */
  protected override getFeatureInfoAtCoordinate(
    map: OLMap,
    location: Coordinate,
    queryGeometry: boolean = true,
    abortController: AbortController | undefined = undefined
  ): Promise<TypeFeatureInfoEntry[]> {
    // Transform coordinate from map projection to lntlat
    const projCoordinate = Projection.transformToLonLat(location, map.getView().getProjection());

    // Redirect to getFeatureInfoAtLonLat
    return this.getFeatureInfoAtLonLat(map, projCoordinate, queryGeometry, abortController);
  }

  /**
   * Overrides the return of feature information at the provided long lat coordinate.
   * @param {OLMap} map - The Map where to get Feature Info At LonLat from.
   * @param {Coordinate} lonlat - The coordinate that will be used by the query.
   * @param {boolean} queryGeometry - Whether to include geometry in the query, default is true.
   * @param {AbortController?} abortController - The optional abort controller.
   * @returns {Promise<TypeFeatureInfoEntry[]>} A promise of an array of TypeFeatureInfoEntry[].
   * @throws {LayerConfigWFSMissingError} If no WFS layer configuration is defined for this WMS layer.
   * @override
   */
  protected override async getFeatureInfoAtLonLat(
    map: OLMap,
    lonlat: Coordinate,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    queryGeometry: boolean = true,
    abortController: AbortController | undefined = undefined
  ): Promise<TypeFeatureInfoEntry[]> {
    // If the layer is invisible
    if (!this.getVisible()) return [];

    // Get the layer config and its initial settings
    const wmsLayerConfig = this.getLayerConfig();
    let initialSettings = wmsLayerConfig.getInitialSettings();

    // Ensure bounds are available in the settings
    if (!initialSettings.bounds) {
      const projection = map.getView().getProjection();
      const computedBounds = this.getBounds(projection, MapViewer.DEFAULT_STOPS);

      // If no computed bounds, return
      if (!computedBounds) return [];

      const transformedBounds = Projection.transformExtentFromProj(computedBounds, projection, Projection.getProjectionLonLat());

      // Update initial settings with computed bounds
      wmsLayerConfig.updateInitialSettings({ bounds: transformedBounds });

      // Re-fetch settings after the update to ensure consistency
      initialSettings = wmsLayerConfig.getInitialSettings();
    }

    // If bounds still not set, return
    if (!initialSettings.bounds) return [];

    // Check if the clicked lon/lat is within the bounds
    const [lon, lat] = lonlat;
    const [minX, minY, maxX, maxY] = initialSettings.bounds;

    // If out of bounds, don't bother and return
    if (lon < minX || lon > maxX || lat < minY || lat > maxY) {
      // Log warning
      logger.logWarning(`Coordinates for the bounds were out-of-bounds for layer ${wmsLayerConfig.layerPath}`);
      return [];
    }

    // Project the lon/lat to the map's projection
    const clickCoordinate = Projection.transformFromLonLat(lonlat, map.getView().getProjection());

    // Get the source and resolution
    const viewResolution = map.getView().getResolution()!;
    const projectionCode = map.getView().getProjection().getCode();

    try {
      // If the layer has a WFS associated
      if (wmsLayerConfig.hasWfsLayerConfig()) {
        try {
          // Get the Geoview Layer Config WFS equivalent
          const wfsLayerConfig = wmsLayerConfig.getWfsLayerConfig();

          // We're going to try performing a GetFeature using the WFS query instead of WMS, better chance to retrieve the geometry that way
          return await this.#getFeatureInfoUsingWFS(
            wmsLayerConfig,
            wfsLayerConfig,
            clickCoordinate,
            viewResolution,
            projectionCode,
            abortController
          );
        } catch (error: unknown) {
          // Failed to get feature info using WFS, continue with WMS
          logger.logDebug(`Failed to getFeatureInfoUsingWFS for '${wmsLayerConfig.layerPath}'`, error);
        }
      }

      // Try various info formats patterns to get feature info
      return await this.#getFeatureInfoUsingWMS(wmsLayerConfig, clickCoordinate, viewResolution, projectionCode, abortController);
    } catch (error: unknown) {
      // Eat the error, we failed
      logger.logDebug(`Eating error, we failed for '${wmsLayerConfig.layerPath}'`, error);
    }

    // Failed
    return [];
  }

  /**
   * Overrides the get all feature information for all the features stored in the layer.
   * This function performs a WFS 'GetFeature' query operation using the WFS layer configuration embedded in the WMS layer configuration.
   * @param {OLMap} map - The Map so that we can grab the resolution/projection we want to get features on.
   * @param {AbortController?} abortController - The optional abort controller.
   * @returns {Promise<TypeFeatureInfoEntry[]>} A promise of an array of TypeFeatureInfoEntry[].
   * @throws {LayerConfigWFSMissingError} If no WFS layer configuration is defined for this WMS layer.
   * @throws {ResponseError} When the response is not OK (non-2xx).
   * @throws {ResponseEmptyError} When the JSON response is empty.
   * @throws {RequestTimeoutError} When the request exceeds the timeout duration.
   * @throws {RequestAbortedError} When the request was aborted by the caller's signal.
   * @throws {NetworkError} When a network issue happened.
   */
  protected override getAllFeatureInfo(
    map: OLMap,
    abortController: AbortController | undefined = undefined
  ): Promise<TypeFeatureInfoEntry[]> {
    // Get the layer config and its initial settings
    const wmsLayerConfig = this.getLayerConfig();

    // Get the Geoview Layer Config WFS equivalent
    const wfsLayerConfig = wmsLayerConfig.getWfsLayerConfig();

    // Redirect
    return this.#getFeatureInfoUsingWFS(
      wmsLayerConfig,
      wfsLayerConfig,
      undefined,
      undefined,
      map.getView().getProjection().getCode(),
      abortController
    );
  }

  /**
   * Overrides the fetching of the legend for a WMS layer.
   * @returns {Promise<TypeLegend | null>} The legend of the layer or null.
   * @override
   */
  override async onFetchLegend(): Promise<TypeLegend | null> {
    try {
      // Get the config
      const layerConfig = this.getLayerConfig();

      // Get the layer style from the config
      const layerStyle = layerConfig.getLayerStyle();

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
      const legendImage = await GVWMS.#getLegendImage(layerConfig);

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
   * Overrides the way to get the bounds for this layer type.
   * @param {OLProjection} projection - The projection to get the bounds into.
   * @param {number} stops - The number of stops to use to generate the extent.
   * @returns {Extent | undefined} The layer bounding box.
   * @override
   */
  override onGetBounds(projection: OLProjection, stops: number): Extent | undefined {
    const layerConfig = this.getLayerConfig();

    // Get the layer config bounds
    let layerConfigBounds = layerConfig?.getInitialSettings()?.bounds;

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
    return layerBounds;
  }

  /**
   * Sends a query to get feature and calculates an extent from them.
   * @param {number[] | string[]} objectIds - The IDs of the features to calculate the extent from.
   * @param {OLProjection} outProjection - The output projection for the extent.
   * @param {string?} outfield - ID field to return for services that require a value in outfields.
   * @returns {Promise<Extent>} The extent of the features, if available.
   * @throws {LayerConfigWFSMissingError} If no WFS layer configuration is defined for this WMS layer.
   * @throws {NoPrimaryKeyFieldError} When the no outfields has the type 'oid'.
   * @throws {NoExtentError} When the extent couldn't be computed.
   * @throws {ResponseError} When the response is not OK (non-2xx).
   * @throws {ResponseEmptyError} When the JSON response is empty.
   * @throws {RequestTimeoutError} When the request exceeds the timeout duration.
   * @throws {RequestAbortedError} When the request was aborted by the caller's signal.
   * @throws {NetworkError} When a network issue happened.
   * @override
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  override async onGetExtentFromFeatures(objectIds: number[] | string[], outProjection: OLProjection, outfield?: string): Promise<Extent> {
    // Get the WMS layer config
    const wmsLayerConfig = this.getLayerConfig();

    // Get the Geoview Layer Config WFS equivalent
    const wfsLayerConfig = wmsLayerConfig.getWfsLayerConfig();

    // Get the primary key field name (equivalent of objectid for Esri Dynamic)
    const pkFieldName = wfsLayerConfig.getOutfieldsPK().name;

    // Create the sql filter using the object IDs
    const sqlFilter = objectIds.length === 1 ? `${pkFieldName} = ${objectIds[0]}` : `${pkFieldName} in (${objectIds.join(', ')})`;

    // Create the filterXML from the sql filter
    const xmlFilter =
      '<ogc:Filter>' + WfsRenderer.sqlToOlWfsFilterXml(sqlFilter, wfsLayerConfig.getVersion(), pkFieldName) + '</ogc:Filter>';

    // Get the supported info formats
    const featureInfoFormat = wfsLayerConfig.getSupportedFormats('application/json'); // application/json by default (QGIS Server doesn't seem to provide the metadata for the output formats, use application/json)

    // If one of those contain application/json, use that format to get features
    const outputFormat = featureInfoFormat.find((format) => format.toLowerCase().includes('application/json'));

    // Format the url
    const urlWithOutputJson = GeoUtilities.ensureServiceRequestUrlGetFeature(
      wfsLayerConfig.getMetadataAccessPath()!,
      wfsLayerConfig.layerId,
      wfsLayerConfig.getVersion(),
      outputFormat,
      [],
      xmlFilter,
      outProjection.getCode()
    );

    // Fetch and parse features
    const parsedFeatures = await GVWMS.fetchAndParseFeaturesFromWFSUrl(urlWithOutputJson, wmsLayerConfig, wfsLayerConfig);

    // For each feature
    let calculatedExtent: Extent | undefined;
    parsedFeatures.forEach((feature) => {
      // If calculatedExtent has not been defined, set it to extent
      if (!calculatedExtent) calculatedExtent = feature.extent;
      else GeoUtilities.getExtentUnion(calculatedExtent, feature.extent);
    });

    // If we have an extent, return it
    if (calculatedExtent) return calculatedExtent;

    // Throw
    throw new NoExtentError(this.getLayerPath());
  }

  // #endregion OVERRIDES

  // #region METHODS

  /**
   * Sets the style id to be used by the WMS layer.
   * @param {string} wmsStyleId - The style identifier to be used.
   */
  setWmsStyle(wmsStyleId: string): void {
    // TODO: Verify if we can apply more than one style at the same time since the parameter name is STYLES
    this.getOLSource()?.updateParams({ STYLES: wmsStyleId });
  }

  /**
   * Fetches feature data from a WFS GetFeature request URL (expected to return GeoJSON),
   * parses the response into OpenLayers features, and converts them into GeoView
   * Feature Info entries with appropriate attribute formatting.
   * This method:
   * - Performs an HTTP request to a WFS GetFeature endpoint.
   * - Parses the returned GeoJSON into OL features.
   * - Applies WFS/WMS configuration (schema, outfields, styles, filters).
   * - Formats fields according to WFS metadata, including date parsing rules.
   * - Returns an array of standardized `TypeFeatureInfoEntry` objects.
   * @param {string} urlWithOutputJson - The full WFS GetFeature request URL. Must specify an output format compatible
   *   with GeoJSON (e.g., `outputFormat=application/json`).
   * @param {OgcWmsLayerEntryConfig} wmsLayerConfig - The associated WMS layer configuration. Styling and filter settings from this
   *   config are applied when formatting the Feature Info results.
   * @param {OgcWfsLayerEntryConfig} wfsLayerConfig - The WFS layer configuration used for schema tags, outfields, metadata, and
   *   date formatting.
   * @param {AbortController} [abortController] - Optional `AbortController` used to cancel the fetch request.
   * @returns {Promise<TypeFeatureInfoEntry[]>}
   *   A promise resolving to an array of GeoView Feature Info entries representing
   *   the parsed and formatted features from the WFS response.
   * @throws {ResponseError} When the response is not OK (non-2xx).
   * @throws {ResponseEmptyError} When the JSON response is empty.
   * @throws {RequestTimeoutError} When the request exceeds the timeout duration.
   * @throws {RequestAbortedError} When the request was aborted by the caller's signal.
   * @throws {NetworkError} When a network issue happened.
   * @static
   */
  static async fetchAndParseFeaturesFromWFSUrl(
    urlWithOutputJson: string,
    wmsLayerConfig: OgcWmsLayerEntryConfig,
    wfsLayerConfig: OgcWfsLayerEntryConfig,
    abortController: AbortController | undefined = undefined
  ): Promise<TypeFeatureInfoEntry[]> {
    // Call the GetFeature
    const responseData = await Fetch.fetchJson(urlWithOutputJson, abortController);

    // Read the features
    const features = GeoUtilities.readFeaturesFromGeoJSON(responseData, undefined);

    // Parse the features
    return AbstractGVLayer.helperFormatFeatureInfoResult(
      features,
      wfsLayerConfig.layerPath,
      wfsLayerConfig.getSchemaTag(),
      wmsLayerConfig.getNameField(),
      wmsLayerConfig.getOutfields(),
      wmsLayerConfig.hasOutfieldsPK(),
      undefined, // TODO: Support domains?
      wmsLayerConfig.getLayerStyle(), // The styles as read from the WMS layer config (not WFS in case it was overridden in the WMS)
      wmsLayerConfig.getFilterEquation(), // The filter equation as read from the WMS layer config (not WFS in case it was overridden in the WMS)
      (fieldName) => GVWFS.getFieldType(wfsLayerConfig.getLayerMetadata(), fieldName),
      () => null,
      (feature, fieldName, fieldType) => {
        return AbstractGVLayer.helperGetFieldValue(
          feature,
          fieldName,
          fieldType,
          wfsLayerConfig.getServiceDateFragmentsOrder(),
          wfsLayerConfig.getExternalFragmentsOrder()
        );
      }
    );
  }

  /**
   * Applies a view filter to the layer. When the combineLegendFilter flag is false, the filter parameter is used alone to display
   * the features. Otherwise, the legend filter and the filter parameter are combined together to define the view filter. The
   * legend filters are derived from the uniqueValue or classBreaks style of the layer. When the layer config is invalid, nothing
   * is done.
   * TODO ! The combination of the legend filter and the dimension filter probably does not apply to WMS. The code can be simplified.
   * @param {string} filter - An optional filter to be used in place of the getViewFilter value.
   */
  applyViewFilter(filter: string | undefined = ''): void {
    // Log
    logger.logTraceCore('GV-WMS - applyViewFilter', this.getLayerPath());

    // Process the layer filtering using the static method shared between EsriImage and WMS
    GVWMS.applyViewFilterOnSource(
      this.getLayerConfig(),
      this.getOLSource(),
      this.getStyle(),
      this.getLayerConfig().getExternalFragmentsOrder(),
      this,
      filter,
      (filterToUse: string) => {
        // Emit event
        this.emitLayerFilterApplied({
          filter: filterToUse,
        });
      }
    );
  }

  /**
   * Retrieves feature information from a WFS layer based on a clicked map location.
   * This method is used internally to perform a "GetFeatureInfo" style request
   * using WFS. If a click coordinate and view resolution are provided, it:
   * 1. Buffers the clicked point into a small polygon based on the current resolution
   *    and configured tolerance.
   * 2. Converts the buffered polygon into a GML string.
   * 3. Creates a spatial <Intersects> filter for the WFS request.
   * 4. Builds a WFS GetFeature URL with the appropriate output format and filter.
   * 5. Fetches the WFS features and parses them into a consistent format.
   * @param {OgcWmsLayerEntryConfig} wmsLayerConfig - The current WMS layer config of the WMS layer.
   * @param {OgcWfsLayerEntryConfig} wfsLayerConfig - The current WFS layer config of the WMS layer.
   * @param {Coordinate | undefined} clickCoordinate - The clicked map coordinate
   *        in the map projection. If undefined, the query is non-spatial.
   * @param {number | undefined} viewResolution - Current map view resolution
   *        (map units per pixel). Required for buffering the click location.
   * @param {string} projectionCode - The map projection code (e.g., 'EPSG:3857')
   *        to use for the WFS request and geometry serialization.
   * @param {AbortController} [abortController] - Optional AbortController to
   *        allow cancellation of the WFS request.
   * @returns {Promise<TypeFeatureInfoEntry[]>} A promise resolving to an array
   *          of feature info entries retrieved from the WFS service.
   * @private
   */
  #getFeatureInfoUsingWFS(
    wmsLayerConfig: OgcWmsLayerEntryConfig,
    wfsLayerConfig: OgcWfsLayerEntryConfig,
    clickCoordinate: Coordinate | undefined,
    viewResolution: number | undefined,
    projectionCode: string,
    abortController?: AbortController
  ): Promise<TypeFeatureInfoEntry[]> {
    // Get the supported info formats
    const featureInfoFormat = wfsLayerConfig.getSupportedFormats('application/json'); // application/json by default (QGIS Server doesn't seem to provide the metadata for the output formats, use application/json)

    // If one of those contain application/json, use that format to get features
    const outputFormat = featureInfoFormat.find((format) => format.toLowerCase().includes('application/json'));

    // TODO: WMS - Add support for other formats. Not quite the GV issue #3134, but similar

    // Create the filterXML from the sql filter
    let gmlFilterAttribute;
    let gmlFilterSpatial;
    let fieldsToReturn = wfsLayerConfig.getOutfields();
    if (clickCoordinate && viewResolution) {
      // Build the filter from style if any
      const classFilters = GVEsriDynamic.getFilterFromStyle(wmsLayerConfig, wmsLayerConfig.getLayerStyle());

      // If any
      if (classFilters) {
        // Build a OGC Filter for the filter
        gmlFilterAttribute = WfsRenderer.sqlToOlWfsFilterXml(
          classFilters,
          wfsLayerConfig.getVersion(),
          wfsLayerConfig.getOutfields()?.[0]?.name
        );
      }

      // Get the geometry field name
      const geomFieldName = wfsLayerConfig.getGeometryField()?.name || 'geometry'; // default: geometry

      // Buffer the point into a polygon-circle to get features around the click point
      const bufferedPoint = GVWMS.#buildBufferPolygon(clickCoordinate, projectionCode, viewResolution, this.getGetFeatureInfoTolerance());

      // Write the polygon to GML
      const polygonGML = GeoUtilities.writeGeometryToGML(bufferedPoint, projectionCode);

      // Create the intersects filter
      gmlFilterSpatial = `<Intersects><PropertyName>${geomFieldName}</PropertyName>${polygonGML}</Intersects>`;

      // We want all fields in the response, to make sure the geometry is included, clear it
      fieldsToReturn = undefined;
    }

    // Build attribute+spatial OGC filter
    const xmlFilterTotal = WfsRenderer.combineGmlFilters(gmlFilterSpatial, gmlFilterAttribute);

    // Format the url
    const urlWithOutputJson = GeoUtilities.ensureServiceRequestUrlGetFeature(
      wfsLayerConfig.getMetadataAccessPath()!,
      wfsLayerConfig.layerId,
      wfsLayerConfig.getVersion(),
      outputFormat,
      fieldsToReturn,
      xmlFilterTotal,
      projectionCode
    );

    // Fetch and parse features
    return GVWMS.fetchAndParseFeaturesFromWFSUrl(urlWithOutputJson, wmsLayerConfig, wfsLayerConfig, abortController);
  }

  /**
   * Attempts to retrieve feature information from a WMS layer using a prioritized list of supported formats:
   * `application/geojson`, `application/json`, `text/xml`, `text/html`, and `text/plain`, in that order.
   * For each supported format found in the layer's WMS capabilities, the method tries to fetch feature info
   * using that format. If no format returns usable feature info, an error is thrown.
   * @param {OgcWmsLayerEntryConfig} wmsLayerConfig - The current WMS layer config of the WMS layer.
   * @param {Coordinate} clickCoordinate - The coordinate on the map where the user clicked.
   * @param {number} viewResolution - The current resolution of the map view.
   * @param {ProjectionLike} projectionCode - The projection used for the request (e.g., 'EPSG:3857').
   * @param {AbortController} [abortController] - Optional abort controller to cancel the request if needed.
   * @returns {Promise<Record<string, unknown>>} A promise that resolves to the feature info response, in the format of the first successful retrieval.
   * @throws {LayerInvalidFeatureInfoFormatWMSError} If no supported format returns usable feature info data.
   * @private
   */
  async #getFeatureInfoUsingWMS(
    wmsLayerConfig: OgcWmsLayerEntryConfig,
    clickCoordinate: Coordinate,
    viewResolution: number,
    projectionCode: ProjectionLike,
    abortController: AbortController | undefined = undefined
  ): Promise<TypeFeatureInfoEntry[]> {
    // Get the layer source
    const wmsSource = this.getOLSource();

    // Get the supported info formats
    const featureInfoFormat = wmsLayerConfig.getServiceMetadata()?.Capability?.Request?.GetFeatureInfo?.Format;

    // Log the various info format supported for the layer, keeping the line commented, useful for debugging
    // logger.logDebug(layerConfig.getLayerNameCascade(), featureInfoFormat);

    // TODO: Performance - Think of a way to not recall all types when we know which type is the best to answer based on previous calls

    // TODO: WMS - Add support for application/vnd.ogc.gml GV issue #3134

    // If the info format includes XML
    let featureMember: Record<string, unknown>[] | undefined;
    if (featureInfoFormat?.includes('application/geojson')) {
      try {
        // Try to get the feature member using GEOJSON format
        featureMember = await GVWMS.#getFeatureInfoUsingJSON(
          wmsLayerConfig,
          wmsSource,
          clickCoordinate,
          viewResolution,
          this.getGetFeatureInfoTolerance(),
          projectionCode,
          'application/geojson',
          this.getGetFeatureInfoFeatureCount(),
          abortController
        );
      } catch (error: unknown) {
        // Failed to retrieve featureMember using GeoJSON, eat the error, we'll try with another format
        logger.logError(
          `${wmsLayerConfig.getLayerNameCascade()} - Failed to retrieve featureMember using GeoJSON, eat the error, we'll try with another format`,
          error
        );
      }
    }

    if (!featureMember && featureInfoFormat?.includes('application/json')) {
      try {
        // Try to get the feature member using JSON format
        featureMember = await GVWMS.#getFeatureInfoUsingJSON(
          wmsLayerConfig,
          wmsSource,
          clickCoordinate,
          viewResolution,
          this.getGetFeatureInfoTolerance(),
          projectionCode,
          'application/json',
          this.getGetFeatureInfoFeatureCount(),
          abortController
        );
      } catch (error: unknown) {
        // Failed to retrieve featureMember using Json, eat the error, we'll try with another format
        logger.logError(
          `${wmsLayerConfig.getLayerNameCascade()} - Failed to retrieve featureMember using JSON, eat the error, we'll try with another format`,
          error
        );
      }
    }

    // If the info format includes XML
    if (!featureMember && featureInfoFormat?.includes('text/xml')) {
      try {
        // Try to get the feature member using XML format
        const featMember = await GVWMS.#getFeatureInfoUsingXML(
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
        // Failed to retrieve featureMember using XML, eat the error, we'll try with another format
        logger.logError(
          `${wmsLayerConfig.getLayerNameCascade()} - Failed to retrieve featureMember using XML, eat the error, we'll try with another format`,
          error
        );
      }
    }

    // If not found anything and info format includes HTML
    if (!featureMember && featureInfoFormat?.includes('text/html')) {
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
        // Failed to retrieve featureMember using HTML, eat the error, we'll try with another format
        logger.logError(
          `${wmsLayerConfig.getLayerNameCascade()} - Failed to retrieve featureMember using HTML, eat the error, we'll try with another format`,
          error
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
        // Failed to retrieve featureMember using plain text, eat the error, we'll handle the case below
        logger.logError(
          `${wmsLayerConfig.getLayerNameCascade()} - Failed to retrieve featureMember using plain text, eat the error, we'll try with another format`,
          error
        );
      }
    }

    // If any found result
    if (featureMember) {
      // Format and return the information
      return GVWMS.#formatWmsFeatureInfoResult(wmsLayerConfig.layerPath, featureMember, clickCoordinate);
    }

    // Failed
    throw new LayerInvalidFeatureInfoFormatWMSError(wmsLayerConfig.layerPath, wmsLayerConfig.getLayerNameCascade());
  }

  // #endregion METHODS

  // #region STATIC METHODS

  /**
   * Applies a view filter to a WMS or an Esri Image layer's source by updating the source parameters.
   * This function is responsible for generating the appropriate filter expression based on the layer configuration,
   * optional style, and time-based fragments. It ensures the filter is only applied if it has changed or needs to be reset.
   * @param {OgcWmsLayerEntryConfig | EsriImageLayerEntryConfig} layerConfig - The configuration object for the WMS or Esri Image layer.
   * @param {ImageWMS | ImageArcGISRest} source - The OpenLayers `ImageWMS` or `ImageArcGISRest` source instance to which the filter will be applied.
   * @param {TypeDateFragments | undefined} externalDateFragments - Optional external date fragments used to assist in formatting time-based filters.
   * @param {GVWMS | GVEsriImage | undefined} layer - Optional GeoView layer containing the source (if exists) in order to trigger a redraw.
   * @param {string | undefined} filter - The raw filter string input (defaults to an empty string if not provided).
   * @param {Function?} callbackWhenUpdated - Optional callback that is invoked with the final filter string if the layer was updated.
   * @throws {LayerInvalidLayerFilterError} If the filter expression fails to parse or cannot be applied.
   * @static
   */
  static applyViewFilterOnSource(
    layerConfig: OgcWmsLayerEntryConfig | EsriImageLayerEntryConfig,
    source: ImageWMS | ImageArcGISRest,
    style: TypeLayerStyleConfig | undefined,
    externalDateFragments: TypeDateFragments | undefined,
    layer: GVWMS | GVEsriImage | undefined,
    filter: string | undefined = '',
    callbackWhenUpdated: ((filterToUse: string) => void) | undefined = undefined
  ): void {
    // Parse
    let filterValueToUse: string = filter.replaceAll(/\s{2,}/g, ' ').trim();
    let currentFilter;
    let classFilters: string | undefined = undefined;
    try {
      // Update the layer config on the fly (maybe not ideal to do this?)
      layerConfig.setLayerFilter(filterValueToUse);

      const queryElements = filterValueToUse.split(/(?<=\b)\s*=/);
      const dimension = queryElements[0].trim();
      // If there's a specific filter
      if (queryElements.length > 1) {
        filterValueToUse = queryElements[1].trim();
      }

      // Get the current dimension filter
      currentFilter = source.getParams()[dimension];

      // Get the current class filter
      const currentClassFilter = source.getParams()['FILTER'];

      // Parse the filter value to use
      filterValueToUse = parseDateTimeValuesEsriImageOrWMS(filterValueToUse, externalDateFragments);

      // Create the source parameter to update
      const sourceParams = { [dimension]: filterValueToUse.replace(/\s*/g, '') };

      // If working with a WMS layer entry config, it's possible that it's filtered based on its style
      if (layerConfig instanceof OgcWmsLayerEntryConfig) {
        // Get the filters if any
        classFilters = GVEsriDynamic.getFilterFromStyle(layerConfig, style);

        // If filtering
        sourceParams.FILTER = '';
        if (classFilters) {
          // If QGIS Server
          if (layerConfig.getServerType() === 'qgis') {
            sourceParams.FILTER = layerConfig.layerId + ':' + classFilters;
          } else {
            // Build a OGC Filter for the filter
            const ogcXmlFilter = WfsRenderer.sqlToOlWfsFilterXml(
              classFilters,
              layerConfig.getVersion(),
              layerConfig.getOutfields()?.[0]?.name
            );
            sourceParams.FILTER = layerConfig.layerId + ':<ogc:Filter>' + ogcXmlFilter + '</ogc:Filter>';
          }
        }
      }

      // Define what is considered the default filter
      const isDefaultFilter = !filterValueToUse;

      // Define what is a no operation
      const isNewFilterEffectivelyNoop = isDefaultFilter && !currentFilter;

      // Check whether the current filter is different from the new one
      const filterChanged = sourceParams[dimension] !== currentFilter;

      // Check whether the class filter is different from the new one
      const classFilterChanged = sourceParams.FILTER !== currentClassFilter;

      // Determine if we should apply or reset filter
      const shouldUpdateFilter =
        classFilterChanged || (filterChanged && !isNewFilterEffectivelyNoop) || (!!currentFilter && isDefaultFilter);

      // If should update the filtering
      if (shouldUpdateFilter) {
        // Update the source param
        source.updateParams(sourceParams);
        layer?.getOLLayer().changed();

        // Updated
        callbackWhenUpdated?.(filterValueToUse);
      }
    } catch (error: unknown) {
      // Failed
      throw new LayerInvalidLayerFilterError(
        layerConfig.layerPath,
        layerConfig.getLayerNameCascade(),
        filterValueToUse || classFilters!,
        currentFilter,
        formatError(error)
      );
    }
  }

  /**
   * Retrieves feature information from a WMS layer using the `text/xml` info format.
   * This method performs a `GetFeatureInfo` request at the specified map coordinate,
   * using the provided WMS source and projection. It returns a Promise of a Record<string, unknown> response.
   * @param {OgcWmsLayerEntryConfig} layerConfig - Configuration object for the target WMS layer.
   * @param {ImageWMS} wmsSource - The OpenLayers WMS source used to construct the request.
   * @param {Coordinate} clickCoordinate - The coordinate on the map where the user clicked.
   * @param {number} viewResolution - The current resolution of the map view.
   * @param {ProjectionLike} projectionCode - The projection in which the request should be made (e.g., 'EPSG:3857').
   * @param {'application/json' | 'application/geojson'} infoFormat - The info format to query in.
   * @param {number | undefined} maxFeatures - The maximum number of features to include in response when we want more than 1.
   * @param {AbortController} [abortController] - Optional AbortController to allow cancellation of the request.
   * @returns {Promise<Record<string, unknown>>} A promise that resolves to a Record<string, unknown>.
   * @private
   * @static
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
    throw new LayerInvalidFeatureInfoFormatWMSError(layerConfig.layerPath, layerConfig.getLayerNameCascade());
  }

  /**
   * Retrieves feature information from a WMS layer using the `text/xml` info format.
   * This method performs a `GetFeatureInfo` request at the specified map coordinate,
   * using the provided WMS source and projection. It returns a Promise of a Record<string, unknown> response.
   * @param {OgcWmsLayerEntryConfig} layerConfig - Configuration object for the target WMS layer.
   * @param {ImageWMS} wmsSource - The OpenLayers WMS source used to construct the request.
   * @param {Coordinate} clickCoordinate - The coordinate on the map where the user clicked.
   * @param {number} viewResolution - The current resolution of the map view.
   * @param {ProjectionLike} projectionCode - The projection in which the request should be made (e.g., 'EPSG:3857').
   * @param {AbortController} [abortController] - Optional AbortController to allow cancellation of the request.
   * @returns {Promise<Record<string, unknown>>} A promise that resolves to a Record<string, unknown>.
   * @private
   * @static
   */
  static async #getFeatureInfoUsingXML(
    layerConfig: OgcWmsLayerEntryConfig,
    wmsSource: ImageWMS,
    clickCoordinate: Coordinate,
    viewResolution: number,
    qgisServerTolerance: number,
    projectionCode: ProjectionLike,
    abortController: AbortController | undefined = undefined
  ): Promise<Record<string, unknown>> {
    // Try to get the information using xml format
    const responseData = await GVWMS.#readFeatureInfo(
      layerConfig,
      wmsSource,
      clickCoordinate,
      viewResolution,
      qgisServerTolerance,
      projectionCode,
      'text/xml',
      undefined,
      abortController
    );

    // Read the response as json
    const xmlDomResponse = new DOMParser().parseFromString(responseData, 'application/xml');
    const jsonResponse = xmlToJson(xmlDomResponse);

    // Try to get the feature member
    let featureMember: Record<string, unknown> | undefined;
    const featureCollection = GVWMS.#getAttribute(jsonResponse, 'FeatureCollection');
    if (featureCollection) featureMember = GVWMS.#getAttribute(featureCollection, 'featureMember');
    else {
      const featureInfoResponse = GVWMS.#getAttribute(jsonResponse, 'FeatureInfoResponse');
      if (featureInfoResponse) {
        featureMember = GVWMS.#getAttribute(featureInfoResponse, 'FIELDS');
        if (featureMember) featureMember = GVWMS.#getAttribute(featureMember, '@attributes');
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
        }
      }
    }

    // If found
    if (featureMember) {
      // Success!
      return featureMember;
    }

    // Failed
    throw new LayerInvalidFeatureInfoFormatWMSError(layerConfig.layerPath, layerConfig.getLayerNameCascade());
  }

  /**
   * Retrieves feature information from a WMS layer using the `text/html` info format.
   * This method performs a `GetFeatureInfo` request at the specified map coordinate,
   * using the provided WMS source and projection. It returns the html response
   * wrapped in a structured object for downstream compatibility.
   * @param {OgcWmsLayerEntryConfig} layerConfig - Configuration object for the target WMS layer.
   * @param {ImageWMS} wmsSource - The OpenLayers WMS source used to construct the request.
   * @param {Coordinate} clickCoordinate - The coordinate on the map where the user clicked.
   * @param {number} viewResolution - The current resolution of the map view.
   * @param {ProjectionLike} projectionCode - The projection in which the request should be made (e.g., 'EPSG:3857').
   * @param {AbortController} [abortController] - Optional AbortController to allow cancellation of the request.
   * @returns {Promise<Record<string, unknown>>} A promise that resolves to an object containing the html info response
   *                                             under the key `html`.
   * @private
   * @static
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
      'text/html',
      undefined,
      abortController
    );

    // Read the response as json
    const xmlDomResponse = new DOMParser().parseFromString(responseData, 'text/html');

    // Get body text content and trim it
    const bodyContent = xmlDomResponse.body?.textContent?.trim();

    // Check if it's empty or only whitespace
    if (!bodyContent) {
      throw new LayerInvalidFeatureInfoFormatWMSError(layerConfig.layerPath, layerConfig.getLayerNameCascade());
    }

    // The response is in html format
    return { html: responseData };
  }

  /**
   * Retrieves feature information from a WMS layer using the `text/plain` info format.
   * This method performs a `GetFeatureInfo` request at the specified map coordinate,
   * using the provided WMS source and projection. It returns the plain-text response
   * wrapped in a structured object for downstream compatibility.
   * @param {OgcWmsLayerEntryConfig} layerConfig - Configuration object for the target WMS layer.
   * @param {ImageWMS} wmsSource - The OpenLayers WMS source used to construct the request.
   * @param {Coordinate} clickCoordinate - The coordinate on the map where the user clicked.
   * @param {number} viewResolution - The current resolution of the map view.
   * @param {ProjectionLike} projectionCode - The projection in which the request should be made (e.g., 'EPSG:3857').
   * @param {AbortController} [abortController] - Optional AbortController to allow cancellation of the request.
   * @returns {Promise<Record<string, unknown>>} A promise that resolves to an object containing the plain-text feature info response
   *                                             under the key `plain_text['#text']`.
   * @private
   * @static
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
      'text/plain',
      undefined,
      abortController
    );

    // The response is in plain format
    // eslint-disable-next-line camelcase
    return { plain_text: { '#text': responseData } };
  }

  /**
   * Attempts to retrieve feature information from a WMS layer at a specified coordinate.
   * Builds a GetFeatureInfo URL using the WMS source and fetches the response as plain text.
   * If the feature info URL cannot be generated, an error is thrown.
   * @param {OgcWmsLayerEntryConfig} layerConfig - The configuration object for the WMS layer.
   * @param {ImageWMS} wmsSource - The OpenLayers WMS source used to construct the GetFeatureInfo URL.
   * @param {Coordinate} clickCoordinate - The map coordinate where the user clicked.
   * @param {number} viewResolution - The current map view resolution.
   * @param {ProjectionLike} projectionCode - The projection of the map (e.g., 'EPSG:3857').
   * @param {string} infoFormat - The desired format for the feature info response (e.g., 'text/xml', 'application/json').
   * @param {number | undefined} maxFeatures - The maximum number of features to include in response when we want more than 1.
   * @param {AbortController} [abortController] - Optional abort controller to cancel the request if needed.
   * @returns {Promise<string>} A promise that resolves to the response text from the GetFeatureInfo request.
   * @throws {LayerInvalidFeatureInfoFormatWMSError} If the GetFeatureInfo URL could not be constructed,
   *         which likely indicates the info format is unsupported or the layer is misconfigured.
   * @private
   * @static
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
    throw new LayerInvalidFeatureInfoFormatWMSError(layerConfig.layerPath, layerConfig.getLayerNameCascade());
  }

  /**
   * Formats one or more WMS feature members into standardized feature info entries.
   * @param {string} layerPath - The layer path used to identify the WMS layer.
   * @param {unknown} featureMember - A single feature member or an array of feature members.
   * @param {Coordinate} clickCoordinate - The coordinate where the user clicked on the map.
   * @returns {TypeFeatureInfoEntry[]} An array of formatted feature info entries.
   * @private
   * @static
   */
  static #formatWmsFeatureInfoResult(
    layerPath: string,
    featureMember: Record<string, unknown> | Record<string, unknown>[],
    clickCoordinate: Coordinate
  ): TypeFeatureInfoEntry[] {
    const results: TypeFeatureInfoEntry[] = [];
    let featureKeyCounter = 0;

    if (Array.isArray(featureMember)) {
      featureMember.forEach((feature) => {
        if (feature && typeof feature === 'object') {
          results.push(this.#formatWmsFeatureInfoResultParser(feature, layerPath, clickCoordinate, featureKeyCounter++));
        }
      });
    } else if (featureMember && typeof featureMember === 'object') {
      results.push(this.#formatWmsFeatureInfoResultParser(featureMember, layerPath, clickCoordinate, featureKeyCounter++));
    }

    return results;
  }

  /**
   * Creates a TypeFeatureInfoEntry from a single WMS feature object.
   * @param {any} feature - The raw feature object from a WMS GetFeatureInfo response.
   * @param {string} layerPath - The WMS layer path.
   * @param {Coordinate} clickCoordinate - The map click coordinate.
   * @param {number} featureKey - The unique feature key.
   * @returns {TypeFeatureInfoEntry} The formatted feature info entry.
   * @private
   * @static
   */
  static #formatWmsFeatureInfoResultParser(
    feature: unknown,
    layerPath: string,
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
      nameField: null,
      supportZoomTo: true,
      layerPath,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const extractFields = (obj: any, prefix = ''): void => {
      Object.keys(obj).forEach((key) => {
        if (key.endsWith('Geometry') || key.startsWith('@')) return;

        const parts = key.split(':');
        const fieldName = parts[parts.length - 1];
        const fullFieldName = prefix ? `${prefix}.${fieldName}` : fieldName;
        const rawValue = obj[key];
        let value = rawValue as string;
        if (typeof rawValue === 'object' && '#text' in rawValue) value = rawValue['#text'];

        // If value has to go recursive
        if (typeof value === 'object') {
          // Go recursive
          extractFields(value, fullFieldName);
        } else {
          // Compile it
          featureInfo.fieldInfo[fullFieldName] = {
            fieldKey: fieldKeyCounter++,
            value: value,
            dataType: 'string',
            alias: fullFieldName,
            domain: null,
          };
        }
      });
    };

    extractFields(feature);
    return featureInfo;
  }

  /**
   * Gets the legend image of a layer.
   * @param {OgcWmsLayerEntryConfig} layerConfig - The layer configuration.
   * @param {string | undefined} chosenStyle - Style to get the legend image for.
   * @returns {blob} A promise of an image blob
   * @private
   * @static
   */
  static #getLegendImage(layerConfig: OgcWmsLayerEntryConfig, chosenStyle?: string): Promise<string | ArrayBuffer | null> {
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
          layerConfig.getVersion()
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
      // Fetch the image
      return Fetch.fetchBlobImage(queryUrl);
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
   * @param {unknown} jsonObject - The object that is supposed to have the needed attribute.
   * @param {string} attributeEnding - The attribute searched.
   * @returns {unknown | undefined} The attribute information.
   * @private
   * @static
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
   * @param {Coordinate} clickCoordinate - coordinate in map projection
   * @param {number} resolution
   * @param {number} pixelTolerance - number of screen pixels (like ArcGIS Identify)
   * @returns {string} GML polygon snippet
   */
  static #buildBufferPolygon(clickCoordinate: Coordinate, srsName: string, resolution: number, pixelTolerance: number = 10): Polygon {
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

  // #endregion STATIC METHODS

  // #region EVENTS

  /**
   * Emits an event to all handlers when the layer's sent a message.
   * @param {ImageLoadRescueEvent} event - The event to emit
   * @private
   */
  #emitImageLoadRescue(event: ImageLoadRescueEvent): boolean[] {
    // Emit the event for all handlers
    return EventHelper.emitEvent(this, this.#onImageLoadRescueHandlers, event);
  }

  /**
   * Registers an image load callback event handler.
   * @param {ImageLoadRescueDelegate} callback - The callback to be executed whenever the event is emitted
   */
  onImageLoadRescue(callback: ImageLoadRescueDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onImageLoadRescueHandlers, callback);
  }

  /**
   * Unregisters an image load callback event handler.
   * @param {ImageLoadRescueDelegate} callback - The callback to stop being called whenever the event is emitted
   */
  offImageLoadRescue(callback: ImageLoadRescueDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onImageLoadRescueHandlers, callback);
  }

  // #endregion EVENTS
}

export type CRSOverride = { layerProjection: string; mapProjection: string };

/**
 * Define an event for the delegate
 */
export type ImageLoadRescueEvent = { imageLoadErrorEvent: unknown };

/**
 * Define a delegate for the event handler function signature
 */
export type ImageLoadRescueDelegate = EventDelegateBase<GVWMS, ImageLoadRescueEvent, boolean>;
