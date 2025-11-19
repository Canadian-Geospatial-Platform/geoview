import ImageLayer from 'ol/layer/Image';
import type { Options as ImageOptions } from 'ol/layer/BaseImage';
import type { Coordinate } from 'ol/coordinate';
import type { ImageArcGISRest, ImageWMS } from 'ol/source';
import type { Extent } from 'ol/extent';
import type { Projection as OLProjection, ProjectionLike } from 'ol/proj';
import type { Map as OLMap } from 'ol';
import { isArray } from 'lodash';

import EventHelper, { type EventDelegateBase } from '@/api/events/event-helper';
import type { TypeWmsLegend } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { Fetch } from '@/core/utils/fetch-helper';
import { xmlToJson } from '@/core/utils/utilities';
import { getExtentIntersection, replaceCRSandBBOXParam, validateExtentWhenDefined } from '@/geo/utils/utilities';
import { parseDateTimeValuesEsriImageOrWMS } from '@/geo/layer/gv-layers/utils';
import { logger } from '@/core/utils/logger';
import type { OgcWmsLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/ogc-wms-layer-entry-config';
import type { TypeFeatureInfoEntry } from '@/api/types/map-schema-types';
import { CONFIG_PROXY_URL } from '@/api/types/map-schema-types';
import type {
  TypeLayerMetadataWMSStyle,
  TypeLayerMetadataWMSStyleLegendUrl,
  TypeMetadataFeatureInfo,
} from '@/api/types/layer-schema-types';
import { CONST_LAYER_TYPES } from '@/api/types/layer-schema-types';
import { loadImage } from '@/geo/utils/renderer/geoview-renderer';
import { AbstractGVRaster } from '@/geo/layer/gv-layers/raster/abstract-gv-raster';
import type { GVEsriImage } from '@/geo/layer/gv-layers/raster/gv-esri-image';
import { Projection } from '@/geo/utils/projection';
import { LayerInvalidFeatureInfoFormatWMSError, LayerInvalidLayerFilterError } from '@/core/exceptions/layer-exceptions';
import { MapViewer } from '@/geo/map/map-viewer';
import { formatError, NetworkError, ResponseContentError } from '@/core/exceptions/core-exceptions';
import type { TypeDateFragments } from '@/core/utils/date-mgt';
import type { EsriImageLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/esri-image-layer-entry-config';

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
      // eslint-disable-next-line no-param-reassign
      (image.getImage() as HTMLImageElement).src = src;

      // Get if we're overriding the CRS
      const overridingCRS = this.getOverrideCRS();

      // If we're overriding the CRS for the layer as an attempt to do on-the-fly projection for tricky layers
      if (overridingCRS) {
        // Rebuild the URL with a reprojected BBOX
        const imageExtent = image.getExtent();
        const supportedBBOX = Projection.transformExtentFromProj(
          imageExtent,
          Projection.getProjectionFromString(overridingCRS.mapProjection),
          Projection.getProjectionFromString(overridingCRS.layerProjection)
        );

        // Replace the BBOX param in the src url
        const newUrl = replaceCRSandBBOXParam(src, overridingCRS.layerProjection, supportedBBOX);

        // eslint-disable-next-line no-param-reassign
        (image.getImage() as HTMLImageElement).src = newUrl;
      }
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
   * @param {unknown} event - The event which is being triggered.
   */
  protected override onImageLoadError(event: unknown): void {
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
    const layerConfig = this.getLayerConfig();
    let initialSettings = layerConfig.getInitialSettings();

    // Ensure bounds are available in the settings
    if (!initialSettings.bounds) {
      const projection = map.getView().getProjection();
      const computedBounds = this.getBounds(projection, MapViewer.DEFAULT_STOPS);

      // If no computed bounds, return
      if (!computedBounds) return [];

      const transformedBounds = Projection.transformExtentFromProj(computedBounds, projection, Projection.getProjectionLonLat());

      // Update initial settings with computed bounds
      layerConfig.updateInitialSettings({ bounds: transformedBounds });

      // Re-fetch settings after the update to ensure consistency
      initialSettings = layerConfig.getInitialSettings();
    }

    // If bounds still not set, return
    if (!initialSettings.bounds) return [];

    // Check if the clicked lon/lat is within the bounds
    const [lon, lat] = lonlat;
    const [minX, minY, maxX, maxY] = initialSettings.bounds;

    // If out of bounds, don't bother and return
    if (lon < minX || lon > maxX || lat < minY || lat > maxY) {
      // Log warning
      logger.logWarning(`Coordinates for the bounds were out-of-bounds for layer ${layerConfig.layerPath}`);
      return [];
    }

    // Project the lon/lat to the map's projection
    const clickCoordinate = Projection.transformFromLonLat(lonlat, map.getView().getProjection());

    // Get the source and resolution
    const viewResolution = map.getView().getResolution()!;
    const projectionCode = map.getView().getProjection().getCode();

    try {
      // Try various info format and keep in mind which one worked
      const featureMember = await this.#getFeatureInfoUsingAllPatterns(clickCoordinate, viewResolution, projectionCode, abortController);

      // Format and return the information
      return GVWMS.#formatWmsFeatureInfoResult(layerConfig.layerPath, featureMember, clickCoordinate);
    } catch {
      // Eat the error, we failed
    }

    // Failed
    return [];
  }

  /**
   * Overrides the fetching of the legend for a WMS layer.
   * @returns {Promise<TypeLegend | null>} The legend of the layer or null.
   * @override
   */
  override async onFetchLegend(): Promise<TypeWmsLegend | null> {
    try {
      // Get the layer config in a loaded phase
      const layerConfig = this.getLayerConfig();
      const legendImage = await GVWMS.#getLegendImage(layerConfig);

      if (legendImage) {
        const image = await loadImage(legendImage as string);
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
            styles: undefined, // TODO: Should probably put something in 'styles' here?
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
      styles: undefined,
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
    const metadataExtent = GVWMS.#getBoundsExtentFromMetadata(layerConfig, projection.getCode());

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
      layerBounds = getExtentIntersection(layerBounds, layerConfigBounds);
    } else if (layerConfigBounds && !layerBounds) {
      layerBounds = layerConfigBounds;
    }

    // Validate the bounds before returning them
    layerBounds = validateExtentWhenDefined(layerBounds, projection.getCode());

    // Return the calculated bounds
    return layerBounds;
  }

  // #endregion OVERRIDES

  // #region METHODS

  /**
   * Sets the style to be used by the wms layer. This methode does nothing if the layer path can't be found.
   * @param {string} wmsStyleId - The style identifier that will be used.
   */
  setWmsStyle(wmsStyleId: string): void {
    // TODO: Verify if we can apply more than one style at the same time since the parameter name is STYLES
    this.getOLSource()?.updateParams({ STYLES: wmsStyleId });
  }

  /**
   * Applies a view filter to the layer. When the combineLegendFilter flag is false, the filter paramater is used alone to display
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
      this.getExternalFragmentsOrder(),
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
   * Attempts to retrieve feature information from a WMS layer using a prioritized list of supported formats:
   * `application/geojson`, `application/json`, `text/xml`, `text/html`, and `text/plain`, in that order.
   * For each supported format found in the layer's WMS capabilities, the method tries to fetch feature info
   * using that format. If no format returns usable feature info, an error is thrown.
   * @param {Coordinate} clickCoordinate - The coordinate on the map where the user clicked.
   * @param {number} viewResolution - The current resolution of the map view.
   * @param {ProjectionLike} projectionCode - The projection used for the request (e.g., 'EPSG:3857').
   * @param {AbortController} [abortController] - Optional abort controller to cancel the request if needed.
   * @returns {Promise<Record<string, unknown>>} A promise that resolves to the feature info response, in the format of the first successful retrieval.
   * @throws {LayerInvalidFeatureInfoFormatWMSError} If no supported format returns usable feature info data.
   * @private
   */
  async #getFeatureInfoUsingAllPatterns(
    clickCoordinate: Coordinate,
    viewResolution: number,
    projectionCode: ProjectionLike,
    abortController: AbortController | undefined = undefined
  ): Promise<Record<string, unknown>[]> {
    // Get the layer config
    const layerConfig = this.getLayerConfig();

    // Get the layer source
    const wmsSource = this.getOLSource();

    // Get the supported info formats
    const featureInfoFormat = layerConfig.getServiceMetadata()?.Capability?.Request?.GetFeatureInfo?.Format;

    // Log the various info format supported for the layer, keeping the line commented, useful for debugging
    // logger.logDebug(layerConfig.getLayerNameCascade(), featureInfoFormat);

    // TODO: Performance - Think of a way to not recall all types when we know which type is the best to answer based on previous calls

    // If the info format includes XML
    let featureMember: Record<string, unknown>[] | undefined;
    if (featureInfoFormat?.includes('application/geojson')) {
      try {
        // Try to get the feature member using GEOJSON format
        featureMember = await GVWMS.#getFeatureInfoUsingJSON(
          layerConfig,
          wmsSource,
          clickCoordinate,
          viewResolution,
          this.getGetFeatureInfoTolerance(),
          projectionCode,
          'application/geojson',
          this.getGetFeatureInfoFeatureCount(),
          abortController
        );
      } catch {
        // Failed to retrieve featureMember using GeoJSON, eat the error, we'll try with another format
        logger.logError(
          `${layerConfig.getLayerNameCascade()} - Failed to retrieve featureMember using GeoJSON, eat the error, we'll try with another format`
        );
      }
    }

    if (!featureMember && featureInfoFormat?.includes('application/json')) {
      try {
        // Try to get the feature member using JSON format
        featureMember = await GVWMS.#getFeatureInfoUsingJSON(
          layerConfig,
          wmsSource,
          clickCoordinate,
          viewResolution,
          this.getGetFeatureInfoTolerance(),
          projectionCode,
          'application/json',
          this.getGetFeatureInfoFeatureCount(),
          abortController
        );
      } catch {
        // Failed to retrieve featureMember using Json, eat the error, we'll try with another format
        logger.logError(
          `${layerConfig.getLayerNameCascade()} - Failed to retrieve featureMember using JSON, eat the error, we'll try with another format`
        );
      }
    }

    // If the info format includes XML
    if (!featureMember && featureInfoFormat?.includes('text/xml')) {
      try {
        // Try to get the feature member using XML format
        const featMember = await GVWMS.#getFeatureInfoUsingXML(
          layerConfig,
          wmsSource,
          clickCoordinate,
          viewResolution,
          this.getGetFeatureInfoTolerance(),
          projectionCode,
          abortController
        );
        featureMember = [featMember];
      } catch {
        // Failed to retrieve featureMember using XML, eat the error, we'll try with another format
        logger.logError(
          `${layerConfig.getLayerNameCascade()} - Failed to retrieve featureMember using XML, eat the error, we'll try with another format`
        );
      }
    }

    // If not found anything and info format includes HTML
    if (!featureMember && featureInfoFormat?.includes('text/html')) {
      try {
        // Try to get the feature member using HTML format
        const featMember = await GVWMS.#getFeatureInfoUsingHTML(
          layerConfig,
          wmsSource,
          clickCoordinate,
          viewResolution,
          this.getGetFeatureInfoTolerance(),
          projectionCode,
          abortController
        );
        featureMember = [featMember];
      } catch {
        // Failed to retrieve featureMember using HTML, eat the error, we'll try with another format
        logger.logError(
          `${layerConfig.getLayerNameCascade()} - Failed to retrieve featureMember using HTML, eat the error, we'll try with another format`
        );
      }
    }

    // If not found anything, last attempt with text/plain
    if (!featureMember) {
      try {
        const featMember = await GVWMS.#getFeatureInfoUsingPlain(
          layerConfig,
          wmsSource,
          clickCoordinate,
          viewResolution,
          this.getGetFeatureInfoTolerance(),
          projectionCode,
          abortController
        );
        featureMember = [featMember];
      } catch {
        // Failed to retrieve featureMember using plain text, eat the error, we'll handle the case below
        logger.logError(
          `${layerConfig.getLayerNameCascade()} - Failed to retrieve featureMember using plain text, eat the error, we'll try with another format`
        );
      }
    }

    // If any found result
    if (featureMember) return featureMember;

    // Failed
    throw new LayerInvalidFeatureInfoFormatWMSError(layerConfig.layerPath, layerConfig.getLayerNameCascade());
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
    externalDateFragments: TypeDateFragments | undefined,
    layer: GVWMS | GVEsriImage | undefined,
    filter: string | undefined = '',
    callbackWhenUpdated: ((filterToUse: string) => void) | undefined = undefined
  ): void {
    // Parse
    let filterValueToUse: string = filter.replaceAll(/\s{2,}/g, ' ').trim();
    let currentFilter;
    try {
      // Update the layer config on the fly (maybe not ideal to do this?)
      layerConfig.setLayerFilter(filter);

      const queryElements = filterValueToUse.split(/(?<=\b)\s*=/);
      const dimension = queryElements[0].trim();
      // If there's a specific filter
      if (queryElements.length > 1) {
        filterValueToUse = queryElements[1].trim();
      }

      // Parse the filter value to use
      filterValueToUse = parseDateTimeValuesEsriImageOrWMS(filterValueToUse, externalDateFragments);

      // Create the source parameter to update
      const sourceParams = { [dimension]: filterValueToUse.replace(/\s*/g, '') };

      // Get the current filter
      currentFilter = source.getParams()[dimension];

      // Define what is considered the default filter
      const isDefaultFilter = !filterValueToUse;

      // Define what is a no operation
      const isNewFilterEffectivelyNoop = isDefaultFilter && !currentFilter;

      // Check whether the current filter is different from the new one
      const filterChanged = sourceParams[dimension] !== currentFilter;

      // Determine if we should apply or reset filter
      const shouldUpdateFilter = (filterChanged && !isNewFilterEffectivelyNoop) || (!!currentFilter && isDefaultFilter);

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
        filterValueToUse,
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
      if (featureCollection && isArray(featureCollection)) {
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
    const xmlDomResponse = new DOMParser().parseFromString(responseData, 'text/xml');
    const jsonResponse = xmlToJson(xmlDomResponse);

    // GV TODO: We should use a WMS format setting in the schema to decide what feature info response interpreter to use
    // GV For the moment, we try to guess the response format based on properties returned from the query
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
    const xmlDomResponse = new DOMParser().parseFromString(responseData, 'text/xml');

    // Get body text content and trim it
    const bodyContent = xmlDomResponse.body.textContent?.trim() || '';

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
      layerPath,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const extractFields = (obj: any, prefix = ''): void => {
      Object.keys(obj).forEach((key) => {
        if (key.endsWith('Geometry') || key.startsWith('@')) return;

        const parts = key.split(':');
        const fieldName = parts[parts.length - 1];
        const fullFieldName = prefix ? `${prefix}.${fieldName}` : fieldName;
        const value = obj[key];

        if (value && typeof value === 'object') {
          if ('#text' in value) {
            featureInfo.fieldInfo[fullFieldName] = {
              fieldKey: fieldKeyCounter++,
              value: value['#text'],
              dataType: 'string',
              alias: fullFieldName,
              domain: null,
            };
          } else {
            extractFields(value, fullFieldName);
          }
        } else {
          featureInfo.fieldInfo[fullFieldName] = {
            fieldKey: fieldKeyCounter++,
            value: value as string,
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
   * Gets the bounds as defined in the metadata, favoring the ones in the given projection or returning the first one found
   * @param {OgcWmsLayerEntryConfig} layerConfig - The layer config from which to read the bounding box
   * @param {string} projection - The projection to favor when looking for the bounds inside the metadata
   * @returns {[string, Extent]} The projection and its extent as provided by the metadata
   * @private
   * @static
   */
  static #getBoundsExtentFromMetadata(layerConfig: OgcWmsLayerEntryConfig, projection: string): [string, Extent] | undefined {
    // Get the bounding boxes in the metadata
    const boundingBoxes = layerConfig.getServiceMetadata()?.Capability.Layer.BoundingBox;

    // If found any
    if (boundingBoxes) {
      // Find the one with the right projection
      for (let i = 0; i < boundingBoxes.length; i++) {
        // Read the extent info from the GetCap
        const { crs, extent } = boundingBoxes[i];

        // If it's the crs we want
        if (crs === projection) {
          const extentSafe: Extent = Projection.readExtentCarefully(crs, extent);
          return [crs, extentSafe];
        }
      }

      // At this point, none could be found. If there's any to go with, we try our best...
      if (boundingBoxes.length > 0) {
        // Take the first one and return the bounds and projection
        const { crs, extent } = boundingBoxes[0];
        const extentSafe: Extent = Projection.readExtentCarefully(crs, extent);
        return [crs, extentSafe];
      }
    }

    // Really not found
    return undefined;
  }

  /**
   * Gets the legend image URL of a layer from the capabilities.
   * @param {OgcWmsLayerEntryConfig} layerConfig - Layer configuration.
   * @param {string} chosenStyle - The style to get the url for.
   * @returns {TypeLayerMetadataWMSStyleLegendUrl | undefined} URL of a Legend image in png format or undefined.
   * @private
   * @static
   */
  static #getLegendUrlFromCapabilities(
    layerConfig: OgcWmsLayerEntryConfig,
    chosenStyle?: string
  ): TypeLayerMetadataWMSStyleLegendUrl | undefined {
    // Get the capabilities metadata from the layer config
    const layerCapabilities = layerConfig.getLayerMetadata();
    const styles = layerCapabilities?.Style;

    // Return early if there are no styles defined
    if (!Array.isArray(styles)) return undefined;

    // Check whether a style named 'default' exists
    const hasDefaultStyle = styles.some((style) => style.Name === 'default');

    let selectedStyle: TypeLayerMetadataWMSStyle | undefined;

    if (chosenStyle) {
      // Use explicitly chosen style if provided
      selectedStyle = styles.find((style) => style.Name === chosenStyle);
    } else if (typeof layerConfig.source?.wmsStyle === 'string') {
      // If source.wmsStyle is defined and not an array, use that
      selectedStyle = styles.find((style) => style.Name === layerConfig.source.wmsStyle);
    } else {
      // No chosen style; prefer 'default' if available, else use the first style
      selectedStyle = hasDefaultStyle ? styles.find((style) => style.Name === 'default') : styles[0];
    }

    // Look for a legend URL in the selected style, preferring PNG format
    return selectedStyle?.LegendURL?.find((url) => url.Format === 'image/png');
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
    // Build the legend URL
    let queryUrl: string | undefined;

    const legendUrlFromCapabilities = GVWMS.#getLegendUrlFromCapabilities(layerConfig, chosenStyle);
    if (legendUrlFromCapabilities) {
      queryUrl = legendUrlFromCapabilities.OnlineResource;
    } else {
      const hasGetLegendGraphic = Object.keys(layerConfig.getServiceMetadata()?.Capability?.Request || {}).includes('GetLegendGraphic');
      if (hasGetLegendGraphic) {
        queryUrl = `${layerConfig.getMetadataAccessPath()}service=WMS&version=1.3.0&request=GetLegendGraphic&FORMAT=image/png&layer=${layerConfig.layerId}`;
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
