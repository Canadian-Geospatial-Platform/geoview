import ImageLayer from 'ol/layer/Image';
import { Options as ImageOptions } from 'ol/layer/BaseImage';
import { Coordinate } from 'ol/coordinate';
import { ImageArcGISRest, ImageWMS } from 'ol/source';
import { Extent } from 'ol/extent';
import { Projection as OLProjection } from 'ol/proj';
import { Map as OLMap } from 'ol';

import { TypeWmsLegend, TypeWmsLegendStyle } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { Fetch } from '@/core/utils/fetch-helper';
import { xmlToJson } from '@/core/utils/utilities';
import { getExtentIntersection, validateExtentWhenDefined } from '@/geo/utils/utilities';
import { parseDateTimeValuesEsriImageOrWMS } from '@/geo/layer/gv-layers/utils';
import { logger } from '@/core/utils/logger';
import { OgcWmsLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/ogc-wms-layer-entry-config';
import { CONFIG_PROXY_URL, TypeFeatureInfoEntry } from '@/api/types/map-schema-types';
import {
  CONST_LAYER_TYPES,
  TypeLayerMetadataWMSStyle,
  TypeLayerMetadataWMSStyleLegendUrl,
  TypeMetadataFeatureInfo,
} from '@/api/types/layer-schema-types';
import { loadImage } from '@/geo/utils/renderer/geoview-renderer';
import { AbstractGVRaster } from '@/geo/layer/gv-layers/raster/abstract-gv-raster';
import { GVEsriImage } from '@/geo/layer/gv-layers/raster/gv-esri-image';
import { Projection } from '@/geo/utils/projection';
import { LayerInvalidFeatureInfoFormatWMSError, LayerInvalidLayerFilterError } from '@/core/exceptions/layer-exceptions';
import { MapViewer } from '@/geo/map/map-viewer';
import { formatError, NetworkError } from '@/core/exceptions/core-exceptions';
import { TypeDateFragments } from '@/core/utils/date-mgt';
import { EsriImageLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/esri-image-layer-entry-config';

/**
 * Manages a WMS layer.
 *
 * @exports
 * @class GVWMS
 */
export class GVWMS extends AbstractGVRaster {
  /**
   * Constructs a GVWMS layer to manage an OpenLayer layer.
   * @param {ImageWMS} olSource - The OpenLayer source.
   * @param {OgcWmsLayerEntryConfig} layerConfig - The layer configuration.
   */
  public constructor(olSource: ImageWMS, layerConfig: OgcWmsLayerEntryConfig) {
    super(olSource, layerConfig);

    // Create the image layer options.
    const imageLayerOptions: ImageOptions<ImageWMS> = {
      source: olSource,
      properties: { layerConfig },
    };

    // Init the layer options with initial settings
    AbstractGVRaster.initOptionsWithInitialSettings(imageLayerOptions, layerConfig);

    // Create and set the OpenLayer layer
    this.setOLLayer(new ImageLayer(imageLayerOptions));
  }

  /**
   * Overrides the parent method to return a more specific OpenLayers layer type (covariant return).
   * @override
   * @returns {ImageLayer<ImageWMS>} The strongly-typed OpenLayers type.
   */
  override getOLLayer(): ImageLayer<ImageWMS> {
    // Call parent and cast
    return super.getOLLayer() as ImageLayer<ImageWMS>;
  }

  /**
   * Overrides the parent class's method to return a more specific OpenLayers source type (covariant return).
   * @override
   * @returns {ImageWMS} The ImageWMS source instance associated with this layer.
   */
  override getOLSource(): ImageWMS {
    // Get source from OL
    return super.getOLSource() as ImageWMS;
  }

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   * @override
   * @returns {OgcWmsLayerEntryConfig} The strongly-typed layer configuration specific to this layer.
   */
  override getLayerConfig(): OgcWmsLayerEntryConfig {
    // Call parent and cast
    return super.getLayerConfig() as OgcWmsLayerEntryConfig;
  }

  /**
   * Overrides the return of feature information at a given coordinate.
   * @param {OLMap} map - The Map where to get Feature Info At Coordinate from.
   * @param {Coordinate} location - The coordinate that will be used by the query.
   * @param {boolean} queryGeometry - Whether to include geometry in the query, default is true.
   * @param {AbortController?} abortController - The optional abort controller.
   * @returns {Promise<TypeFeatureInfoEntry[]>} A promise of an array of TypeFeatureInfoEntry[].
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

    let infoFormat = '';
    const featureInfoFormat = this.getLayerConfig().getServiceMetadata()?.Capability?.Request?.GetFeatureInfo?.Format;
    if (featureInfoFormat)
      if (featureInfoFormat.includes('text/xml')) infoFormat = 'text/xml';
      else if (featureInfoFormat.includes('text/html')) infoFormat = 'text/html';
      else if (featureInfoFormat.includes('text/plain')) infoFormat = 'text/plain';
      else {
        // Failed
        throw new LayerInvalidFeatureInfoFormatWMSError(layerConfig.layerPath, layerConfig.getLayerNameCascade());
      }

    const wmsSource = this.getOLSource();
    const viewResolution = map.getView().getResolution()!;
    const featureInfoUrl = wmsSource?.getFeatureInfoUrl(clickCoordinate, viewResolution, map.getView().getProjection().getCode(), {
      INFO_FORMAT: infoFormat,
    });

    if (featureInfoUrl) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let featureMember: any;

      // Perform query
      const responseData = await Fetch.fetchText(featureInfoUrl, { signal: abortController?.signal });
      if (infoFormat === 'text/xml') {
        // Read string as Json
        const xmlDomResponse = new DOMParser().parseFromString(responseData, 'text/xml');
        const jsonResponse = xmlToJson(xmlDomResponse);

        // GV TODO: We should use a WMS format setting in the schema to decide what feature info response interpreter to use
        // GV For the moment, we try to guess the response format based on properties returned from the query
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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if ('Layer' in (getFeatureInfoResponse as any)) {
              // Cast it
              const getFeatureInfoResponseCasted = getFeatureInfoResponse as TypeMetadataFeatureInfo;
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
      } else if (infoFormat === 'text/html') {
        // The response is in html format
        featureMember = { html: responseData };
      } else {
        // The response is in text format
        // eslint-disable-next-line camelcase
        featureMember = { plain_text: { '#text': responseData } };
      }

      // If managed to read data
      if (featureMember) {
        const featureInfoResult = GVWMS.#formatWmsFeatureInfoResult(layerConfig.layerPath, featureMember, clickCoordinate);
        return featureInfoResult;
      }

      // Log warning
      logger.logWarning(`Invalid information returned in the getFeatureInfo for layer ${layerConfig.layerPath}`);
    } else {
      // Log warning
      logger.logWarning(`No feature url to get the feature info from for the WMS layer ${layerConfig.layerPath}`);
    }

    // Empty
    return [];
  }

  /**
   * Overrides the fetching of the legend for a WMS layer.
   * @override
   * @returns {Promise<TypeLegend | null>} The legend of the layer or null.
   */
  override async onFetchLegend(): Promise<TypeWmsLegend | null> {
    try {
      // Get the layer config in a loaded phase
      const layerConfig = this.getLayerConfig();
      const legendImage = await GVWMS.#getLegendImage(layerConfig);
      const styleLegends: TypeWmsLegendStyle[] = [];

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
            styles: styleLegends.length ? styleLegends : undefined,
          };
        }
      }

      // No good
      return {
        type: CONST_LAYER_TYPES.WMS,
        legend: null,
        styles: styleLegends.length > 1 ? styleLegends : undefined,
      };
    } catch (error: unknown) {
      // Log
      logger.logError('gv-wms.onFetchLegend()\n', error);
      return null;
    }
  }

  /**
   * Overrides the way to get the bounds for this layer type.
   * @param {OLProjection} projection - The projection to get the bounds into.
   * @param {number} stops - The number of stops to use to generate the extent.
   * @override
   * @returns {Extent | undefined} The layer bounding box.
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
   * Translates the get feature information result set to the TypeFeatureInfoEntry[] used by GeoView.
   * @param {string} layerPath - The layer path.
   * @param {unknown} featureMember - An object formatted using the query syntax.
   * @param {Coordinate} clickCoordinate - The coordinate where the user has clicked.
   * @returns {TypeFeatureInfoEntry[]} The feature info table.
   * @private
   */
  static #formatWmsFeatureInfoResult(layerPath: string, featureMember: unknown, clickCoordinate: Coordinate): TypeFeatureInfoEntry[] {
    const queryResult: TypeFeatureInfoEntry[] = [];

    let featureKeyCounter = 0;
    let fieldKeyCounter = 0;
    const featureInfoEntry: TypeFeatureInfoEntry = {
      // feature key for building the data-grid
      featureKey: featureKeyCounter++,
      geoviewLayerType: CONST_LAYER_TYPES.WMS,
      extent: [clickCoordinate[0], clickCoordinate[1], clickCoordinate[0], clickCoordinate[1]],
      featureIcon: document.createElement('canvas').toDataURL(),
      fieldInfo: {},
      nameField: null,
      layerPath,
    };

    // GV Can be any object
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const createFieldEntries = (entry: any, prefix = ''): void => {
      const keys = Object.keys(entry);
      keys.forEach((key) => {
        if (!key.endsWith('Geometry') && !key.startsWith('@')) {
          const splitedKey = key.split(':');
          const fieldName = splitedKey.slice(-1)[0];
          if (typeof entry[key] === 'object') {
            if ('#text' in entry[key])
              featureInfoEntry.fieldInfo[`${prefix}${prefix ? '.' : ''}${fieldName}`] = {
                fieldKey: fieldKeyCounter++,
                value: entry[key]['#text'] as string,
                dataType: 'string',
                alias: `${prefix}${prefix ? '.' : ''}${fieldName}`,
                domain: null,
              };
            else createFieldEntries(entry[key], fieldName);
          } else
            featureInfoEntry.fieldInfo[`${prefix}${prefix ? '.' : ''}${fieldName}`] = {
              fieldKey: fieldKeyCounter++,
              value: entry[key] as string,
              dataType: 'string',
              alias: `${prefix}${prefix ? '.' : ''}${fieldName}`,
              domain: null,
            };
        }
      });
    };

    createFieldEntries(featureMember);
    queryResult.push(featureInfoEntry);

    return queryResult;
  }

  /**
   * Gets the bounds as defined in the metadata, favoring the ones in the given projection or returning the first one found
   * @param {OgcWmsLayerEntryConfig} layerConfig - The layer config from which to read the bounding box
   * @param {string} projection - The projection to favor when looking for the bounds inside the metadata
   * @returns {[string, Extent]} The projection and its extent as provided by the metadata
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
   */
  static #getLegendImage(layerConfig: OgcWmsLayerEntryConfig, chosenStyle?: string): Promise<string | ArrayBuffer | null> {
    const promisedImage = new Promise<string | ArrayBuffer | null>((resolve) => {
      const readImage = (blob: Blob): Promise<string | ArrayBuffer | null> =>
        new Promise((resolveImage) => {
          const reader = new FileReader();
          reader.onloadend = () => resolveImage(reader.result);
          reader.onerror = () => resolveImage(null);
          reader.readAsDataURL(blob);
        });

      let queryUrl: string | undefined;
      const legendUrlFromCapabilities = GVWMS.#getLegendUrlFromCapabilities(layerConfig, chosenStyle);
      if (legendUrlFromCapabilities) queryUrl = legendUrlFromCapabilities.OnlineResource;
      else if (Object.keys(layerConfig.getServiceMetadata()?.Capability?.Request || {}).includes('GetLegendGraphic'))
        queryUrl = `${layerConfig.geoviewLayerConfig
          .metadataAccessPath!}service=WMS&version=1.3.0&request=GetLegendGraphic&FORMAT=image/png&layer=${layerConfig.layerId}`;

      if (queryUrl) {
        queryUrl = queryUrl.toLowerCase().startsWith('http:') ? `https${queryUrl.slice(4)}` : queryUrl;

        /** For some layers the layer loads fine through the proxy, but fetching the legend fails
         * We try the fetch first without the proxy and if we get a network error, try again with the proxy.
         */
        Fetch.fetchBlob(queryUrl)
          .then((responseBlob) => {
            // Expected response, return it as image
            resolve(readImage(responseBlob));
          })
          .catch((error: unknown) => {
            // If a network error such as CORS
            if (error instanceof NetworkError) {
              // Try appending link with proxy url to avoid CORS issues
              queryUrl = `${CONFIG_PROXY_URL}?${queryUrl}`;

              Fetch.fetchBlob(queryUrl)
                .then((responseBlob) => {
                  // Expected response, return it as image
                  resolve(readImage(responseBlob));
                })
                .catch(() => {
                  // Just absolute fail
                  resolve(null);
                });
            } else {
              // Not a CORS issue, return null
              resolve(null);
            }
          });
        // No URL to query
      } else resolve(null);
    });

    return promisedImage;
  }

  /**
   * Returns the attribute of an object that ends with the specified ending string or null if not found.
   * @param {unknown} jsonObject - The object that is supposed to have the needed attribute.
   * @param {string} attributeEnding - The attribute searched.
   * @returns {unknown | undefined} The attribute information.
   * @private
   */
  static #getAttribute(jsonObject: unknown, attributeEnding: string): unknown | undefined {
    if (typeof jsonObject === 'object' && jsonObject !== null && !Array.isArray(jsonObject)) {
      const record = jsonObject as Record<string, unknown>;
      const keyFound = Object.keys(record).find((key) => key.endsWith(attributeEnding));
      return keyFound ? record[keyFound] : undefined;
    }
    return undefined;
  }

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
}
