import axios, { CanceledError } from 'axios';

import ImageLayer from 'ol/layer/Image';
import { Options as ImageOptions } from 'ol/layer/BaseImage';
import { Coordinate } from 'ol/coordinate';
import { Pixel } from 'ol/pixel';
import { ImageWMS } from 'ol/source';
import { Extent } from 'ol/extent';

import { Cast, TypeJsonArray, TypeJsonObject } from '@/core/types/global-types';
import { CONST_LAYER_TYPES, TypeWmsLegend, TypeWmsLegendStyle } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { xmlToJson } from '@/core/utils/utilities';
import { AbortError } from '@/core/exceptions/core-exceptions';
import { getExtentIntersection, validateExtentWhenDefined } from '@/geo/utils/utilities';
import { parseDateTimeValuesEsriImageOrWMS } from '@/geo/layer/gv-layers/utils';
import { logger } from '@/core/utils/logger';
import { OgcWmsLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/ogc-wms-layer-entry-config';
import { TypeFeatureInfoEntry } from '@/geo/map/map-schema-types';
import { loadImage } from '@/geo/utils/renderer/geoview-renderer';
import { AbstractGVRaster } from '@/geo/layer/gv-layers/raster/abstract-gv-raster';
import { TypeLegend } from '@/core/stores/store-interface-and-intial-values/layer-state';
import { Projection } from '@/geo/utils/projection';
import { WMS_PROXY_URL } from '@/app';
import { GeoViewError } from '@/core/exceptions/geoview-exceptions';

/**
 * Manages a WMS layer.
 *
 * @exports
 * @class GVWMS
 */
export class GVWMS extends AbstractGVRaster {
  /**
   * Constructs a GVWMS layer to manage an OpenLayer layer.
   * @param {string} mapId - The map id
   * @param {ImageWMS} olSource - The OpenLayer source.
   * @param {OgcWmsLayerEntryConfig} layerConfig - The layer configuration.
   */
  public constructor(mapId: string, olSource: ImageWMS, layerConfig: OgcWmsLayerEntryConfig, layerCapabilities: TypeJsonObject) {
    super(mapId, olSource, layerConfig);

    // Create the image layer options.
    const imageLayerOptions: ImageOptions<ImageWMS> = {
      source: olSource,
      properties: { layerCapabilities, layerConfig },
    };

    // Init the layer options with initial settings
    AbstractGVRaster.initOptionsWithInitialSettings(imageLayerOptions, layerConfig);

    // Create and set the OpenLayer layer
    this.olLayer = new ImageLayer(imageLayerOptions);
  }

  /**
   * Overrides the get of the OpenLayers Layer
   * @returns {ImageLayer<ImageWMS>} The OpenLayers Layer
   */
  override getOLLayer(): ImageLayer<ImageWMS> {
    // Call parent and cast
    return super.getOLLayer() as ImageLayer<ImageWMS>;
  }

  /**
   * Overrides the get of the OpenLayers Layer Source
   * @returns {ImageWMS} The OpenLayers Layer Source
   */
  override getOLSource(): ImageWMS {
    // Get source from OL
    return super.getOLSource() as ImageWMS;
  }

  /**
   * Overrides the get of the layer configuration associated with the layer.
   * @returns {OgcWmsLayerEntryConfig} The layer configuration or undefined if not found.
   */
  override getLayerConfig(): OgcWmsLayerEntryConfig {
    // Call parent and cast
    return super.getLayerConfig() as OgcWmsLayerEntryConfig;
  }

  /**
   * Overrides the return of feature information at a given pixel location.
   * @param {Pixel} location - The pixel coordinate that will be used by the query.
   * @param {boolean} queryGeometry - Whether to include geometry in the query, default is true.
   * @param {AbortController?} abortController - The optional abort controller.
   * @returns {Promise<TypeFeatureInfoEntry[]>} A promise of an array of TypeFeatureInfoEntry[].
   */
  protected override getFeatureInfoAtPixel(
    location: Pixel,
    queryGeometry: boolean = true,
    abortController: AbortController | undefined = undefined
  ): Promise<TypeFeatureInfoEntry[]> {
    // Redirect to getFeatureInfoAtCoordinate
    return this.getFeatureInfoAtCoordinate(this.getMapViewer().map.getCoordinateFromPixel(location), queryGeometry, abortController);
  }

  /**
   * Overrides the return of feature information at a given coordinate.
   * @param {Coordinate} location - The coordinate that will be used by the query.
   * @param {boolean} queryGeometry - Whether to include geometry in the query, default is true.
   * @param {AbortController?} abortController - The optional abort controller.
   * @returns {Promise<TypeFeatureInfoEntry[]>} A promise of an array of TypeFeatureInfoEntry[].
   */
  protected override getFeatureInfoAtCoordinate(
    location: Coordinate,
    queryGeometry: boolean = true,
    abortController: AbortController | undefined = undefined
  ): Promise<TypeFeatureInfoEntry[]> {
    // Transform coordinate from map project to lntlat
    const projCoordinate = this.getMapViewer().convertCoordinateMapProjToLngLat(location);

    // Redirect to getFeatureInfoAtLongLat
    return this.getFeatureInfoAtLongLat(projCoordinate, queryGeometry, abortController);
  }

  /**
   * Overrides the return of feature information at the provided long lat coordinate.
   * @param {Coordinate} lnglat - The coordinate that will be used by the query.
   * @param {boolean} queryGeometry - Whether to include geometry in the query, default is true.
   * @param {AbortController?} abortController - The optional abort controller.
   * @returns {Promise<TypeFeatureInfoEntry[]>} A promise of an array of TypeFeatureInfoEntry[].
   */
  protected override async getFeatureInfoAtLongLat(
    lnglat: Coordinate,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    queryGeometry: boolean = true,
    abortController: AbortController | undefined = undefined
  ): Promise<TypeFeatureInfoEntry[]> {
    try {
      // If the layer is invisible
      if (!this.getVisible()) return [];

      // Get the layer config and source
      const layerConfig = this.getLayerConfig();

      // Check if bounds are properly set
      if (!layerConfig.initialSettings!.bounds) {
        const newBounds = this.getBounds();
        if (newBounds)
          layerConfig.initialSettings!.bounds = Projection.transformExtentFromProj(
            newBounds,
            this.getMapViewer().getView().getProjection(),
            Projection.PROJECTION_NAMES.LNGLAT
          );
        else return [];
      }

      const clickCoordinate = this.getMapViewer().convertCoordinateLngLatToMapProj(lnglat);
      if (
        lnglat[0] < layerConfig.initialSettings!.bounds![0] ||
        layerConfig.initialSettings!.bounds![2] < lnglat[0] ||
        lnglat[1] < layerConfig.initialSettings!.bounds![1] ||
        layerConfig.initialSettings!.bounds![3] < lnglat[1]
      )
        return [];

      let infoFormat = '';
      const featureInfoFormat = this.getLayerConfig().getServiceMetadata()?.Capability?.Request?.GetFeatureInfo?.Format as TypeJsonArray;
      if (featureInfoFormat)
        if (featureInfoFormat.includes('text/xml' as TypeJsonObject)) infoFormat = 'text/xml';
        else if (featureInfoFormat.includes('text/html' as TypeJsonObject)) infoFormat = 'text/html';
        else if (featureInfoFormat.includes('text/plain' as TypeJsonObject)) infoFormat = 'text/plain';
        else {
          throw new GeoViewError(
            this.getMapId(),
            'Parameter info_format of GetFeatureInfo only support text/xml, text/html and text/plain for WMS services.'
          );
        }

      const wmsSource = this.getOLSource();
      const viewResolution = this.getMapViewer().getView().getResolution()!;
      const featureInfoUrl = wmsSource?.getFeatureInfoUrl(clickCoordinate, viewResolution, this.getMapViewer().getProjection().getCode(), {
        INFO_FORMAT: infoFormat,
      });
      if (featureInfoUrl) {
        let featureMember: TypeJsonObject | undefined;

        // Perform query
        const response = await axios(featureInfoUrl, { signal: abortController?.signal });
        if (infoFormat === 'text/xml') {
          const xmlDomResponse = new DOMParser().parseFromString(response.data, 'text/xml');
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
              if (getFeatureInfoResponse?.Layer) {
                featureMember = {};
                featureMember['Layer name'] = getFeatureInfoResponse?.Layer?.['@attributes']?.name;
                if (getFeatureInfoResponse?.Layer?.Attribute?.['@attributes']) {
                  const fieldName = getFeatureInfoResponse.Layer.Attribute['@attributes'].name as string;
                  const fieldValue = getFeatureInfoResponse.Layer.Attribute['@attributes'].value;
                  featureMember[fieldName] = fieldValue;
                }
              }
            }
          }
        } else if (response.data && response.data.length > 0) {
          // The response has any data to show
          if (infoFormat === 'text/html') {
            featureMember = { html: response.data };
          } else featureMember = { plain_text: { '#text': response.data } };
        }

        if (featureMember) {
          const featureInfoResult = this.#formatWmsFeatureInfoResult(featureMember, clickCoordinate);
          return featureInfoResult;
        }
      }

      return [];
    } catch (error) {
      // If cancelled
      if (error instanceof CanceledError) {
        // Raise an Abort Error to standardize the error with an error coming from
        // a fetch() instead of axios (to standardize support accross layer classes)
        throw new AbortError('Cancelled', abortController?.signal);
      }

      // Raise higher
      throw error;
    }
  }

  /**
   * Overrides the fetching of the legend for a WMS layer.
   * @returns {Promise<TypeLegend | null>} The legend of the layer or null.
   */
  override async onFetchLegend(): Promise<TypeLegend | null> {
    try {
      // Get the layer config in a loaded phase
      const layerConfig = this.getLayerConfig();

      let legend: TypeWmsLegend;
      const legendImage = await this.#getLegendImage(layerConfig!);
      const styleLegends: TypeWmsLegendStyle[] = [];

      if (legendImage) {
        const image = await loadImage(legendImage as string);
        if (image) {
          const drawingCanvas = document.createElement('canvas');
          drawingCanvas.width = image.width;
          drawingCanvas.height = image.height;
          const drawingContext = drawingCanvas.getContext('2d')!;
          drawingContext.drawImage(image, 0, 0);
          legend = {
            type: CONST_LAYER_TYPES.WMS,
            legend: drawingCanvas,
            styles: styleLegends.length ? styleLegends : undefined,
          };
          return legend;
        }
      }

      legend = {
        type: CONST_LAYER_TYPES.WMS,
        legend: null,
        styles: styleLegends.length > 1 ? styleLegends : undefined,
      };

      return legend;
    } catch (error) {
      // Log
      logger.logError('gv-wms.onFetchLegend()\n', error);
      return null;
    }
  }

  /**
   * Gets the legend image URL of a layer from the capabilities. Return null if it does not exist.
   * @param {OgcWmsLayerEntryConfig} layerConfig layer configuration.
   * @param {string} style the style to get the url for
   * @returns {TypeJsonObject | null} URL of a Legend image in png format or null
   * @private
   */
  #getLegendUrlFromCapabilities(layerConfig: OgcWmsLayerEntryConfig, chosenStyle?: string): TypeJsonObject | null {
    const layerCapabilities = this.#getLayerMetadataEntry(layerConfig.layerId);
    if (Array.isArray(layerCapabilities?.Style)) {
      // check if WMS as a default legend style
      let isDefaultStyle = false;
      layerCapabilities!.Style.forEach((style) => {
        if (style.Name === 'default') isDefaultStyle = true;
      });

      let legendStyle;
      if (chosenStyle) {
        [legendStyle] = layerCapabilities!.Style.filter((style) => {
          return style.Name === chosenStyle;
        });
      } else {
        legendStyle = layerCapabilities?.Style.find((style) => {
          if (layerConfig?.source?.wmsStyle && !Array.isArray(layerConfig?.source?.wmsStyle))
            return layerConfig.source.wmsStyle === style.Name;

          // no style found, if default apply, if not use the available style
          return isDefaultStyle ? style.Name === 'default' : style.Name;
        });
      }

      if (Array.isArray(legendStyle?.LegendURL)) {
        const legendUrl = legendStyle!.LegendURL.find((urlEntry) => {
          if (urlEntry.Format === 'image/png') return true;
          return false;
        });
        return legendUrl || null;
      }
    }
    return null;
  }

  /**
   * Recursively searches the layerId in the layer entry of the capabilities.
   * @param {string} layerId - The layer identifier that must exists on the server.
   * @param {TypeJsonObject | undefined} layer - The layer entry from the capabilities that will be searched.
   * @returns {TypeJsonObject | null} The found layer from the capabilities or null if not found.
   * @private
   */
  #getLayerMetadataEntry(
    layerId: string,
    layer: TypeJsonObject | undefined = this.getLayerConfig().getServiceMetadata()?.Capability?.Layer
  ): TypeJsonObject | null {
    if (!layer) return null;
    if ('Name' in layer && (layer.Name as string) === layerId) return layer;
    if ('Layer' in layer) {
      if (Array.isArray(layer.Layer)) {
        for (let i = 0; i < layer.Layer.length; i++) {
          const layerFound = this.#getLayerMetadataEntry(layerId, layer.Layer[i]);
          if (layerFound) return layerFound;
        }
        return null;
      }
      return this.#getLayerMetadataEntry(layerId, layer.Layer);
    }
    return null;
  }

  /**
   * Gets the legend image of a layer.
   * @param {OgcWmsLayerEntryConfig} layerConfig - The layer configuration.
   * @param {string | undefined} chosenStyle - Style to get the legend image for.
   * @returns {blob} A promise of an image blob
   * @private
   */
  #getLegendImage(layerConfig: OgcWmsLayerEntryConfig, chosenStyle?: string): Promise<string | ArrayBuffer | null> {
    const promisedImage = new Promise<string | ArrayBuffer | null>((resolve) => {
      const readImage = (blob: Blob): Promise<string | ArrayBuffer | null> =>
        new Promise((resolveImage) => {
          const reader = new FileReader();
          reader.onloadend = () => resolveImage(reader.result);
          reader.onerror = () => resolveImage(null);
          reader.readAsDataURL(blob);
        });

      let queryUrl: string | undefined;
      const legendUrlFromCapabilities = this.#getLegendUrlFromCapabilities(layerConfig, chosenStyle);
      if (legendUrlFromCapabilities) queryUrl = legendUrlFromCapabilities.OnlineResource as string;
      else if (Object.keys(this.getLayerConfig().getServiceMetadata()?.Capability?.Request || {}).includes('GetLegendGraphic'))
        queryUrl = `${this.getLayerConfig().geoviewLayerConfig
          .metadataAccessPath!}service=WMS&version=1.3.0&request=GetLegendGraphic&FORMAT=image/png&layer=${layerConfig.layerId}`;

      if (queryUrl) {
        queryUrl = queryUrl.toLowerCase().startsWith('http:') ? `https${queryUrl.slice(4)}` : queryUrl;

        axios
          .get<TypeJsonObject>(queryUrl, { responseType: 'blob' })
          .then((response) => {
            // Text response means something went wrong
            if (response.data.type === 'text/xml') {
              resolve(null);
            }

            // Expected response, return it as image
            resolve(readImage(Cast<Blob>(response.data)));
          })
          .catch((error) => {
            /** For some layers the layer loads fine through the proxy, but fetching the legend fails
             * We try the fetch first without the proxy and if we get a network error, try again with the proxy.
             */
            if (error.code === 'ERR_NETWORK') {
              // Try appending link with proxy url to avoid CORS issues
              queryUrl = `${WMS_PROXY_URL}${queryUrl}`;

              axios
                .get<TypeJsonObject>(queryUrl, { responseType: 'blob' })
                .then((response) => {
                  // Text response means something went wrong
                  if (response.data.type === 'text/xml') {
                    resolve(null);
                  }

                  // Expected response, return it as image
                  resolve(readImage(Cast<Blob>(response.data)));
                })
                .catch(() => resolve(null));
              // Not a CORS issue, return null
            } else resolve(null);
          });
        // No URL to query
      } else resolve(null);
    });

    return promisedImage;
  }

  /**
   * Translates the get feature information result set to the TypeFeatureInfoEntry[] used by GeoView.
   * @param {TypeJsonObject} featureMember - An object formatted using the query syntax.
   * @param {Coordinate} clickCoordinate - The coordinate where the user has clicked.
   * @returns {TypeFeatureInfoEntry[]} The feature info table.
   * @private
   */
  #formatWmsFeatureInfoResult(featureMember: TypeJsonObject, clickCoordinate: Coordinate): TypeFeatureInfoEntry[] {
    const queryResult: TypeFeatureInfoEntry[] = [];

    let featureKeyCounter = 0;
    let fieldKeyCounter = 0;
    const featureInfoEntry: TypeFeatureInfoEntry = {
      // feature key for building the data-grid
      featureKey: featureKeyCounter++,
      geoviewLayerType: CONST_LAYER_TYPES.WMS,
      extent: [clickCoordinate[0], clickCoordinate[1], clickCoordinate[0], clickCoordinate[1]],
      geometry: null,
      featureIcon: document.createElement('canvas').toDataURL(),
      fieldInfo: {},
      nameField: null,
      layerPath: this.getLayerConfig().layerPath,
    };
    const createFieldEntries = (entry: TypeJsonObject, prefix = ''): void => {
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
   * Returns the attribute of an object that ends with the specified ending string or null if not found.
   * @param {TypeJsonObject} jsonObject - The object that is supposed to have the needed attribute.
   * @param {string} attribute - The attribute searched.
   * @returns {TypeJsonObject | undefined} The attribute information.
   * @private
   */
  static #getAttribute(jsonObject: TypeJsonObject, attributeEnding: string): TypeJsonObject | undefined {
    const keyFound = Object.keys(jsonObject).find((key) => key.endsWith(attributeEnding));
    return keyFound ? jsonObject[keyFound] : undefined;
  }

  /**
   * Sets the style to be used by the wms layer. This methode does nothing if the layer path can't be found.
   * @param {string} wmsStyleId - The style identifier that will be used.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setWmsStyle(wmsStyleId: string): void {
    // TODO: Verify if we can apply more than one style at the same time since the parameter name is STYLES
    this.getOLSource()?.updateParams({ STYLES: wmsStyleId });
  }

  /**
   * Overrides when the layer gets in loaded status.
   */
  override onLoaded(): void {
    // Call parent
    super.onLoaded();

    // Apply view filter immediately
    this.applyViewFilter(this.getLayerConfig().layerFilter || '');
  }

  /**
   * Applies a view filter to the layer. When the combineLegendFilter flag is false, the filter paramater is used alone to display
   * the features. Otherwise, the legend filter and the filter parameter are combined together to define the view filter. The
   * legend filters are derived from the uniqueValue or classBreaks style of the layer. When the layer config is invalid, nothing
   * is done.
   * TODO ! The combination of the legend filter and the dimension filter probably does not apply to WMS. The code can be simplified.
   * @param {string} filter - An optional filter to be used in place of the getViewFilter value.
   * @param {boolean} combineLegendFilter - Flag used to combine the legend filter and the filter together (default: true)
   */
  applyViewFilter(filter: string, combineLegendFilter: boolean = true): void {
    // Log
    logger.logTraceCore('GV-WMS - applyViewFilter', this.getLayerPath());

    const layerConfig = this.getLayerConfig();
    const olLayer = this.getOLLayer();

    // Get source
    const source = olLayer.getSource();
    if (source) {
      // Update the layer config on the fly (maybe not ideal to do this?)
      layerConfig.legendFilterIsOff = !combineLegendFilter;
      if (combineLegendFilter) layerConfig.layerFilter = filter;

      if (filter) {
        let filterValueToUse: string = filter.replaceAll(/\s{2,}/g, ' ').trim();
        const queryElements = filterValueToUse.split(/(?<=\b)\s*=/);
        const dimension = queryElements[0].trim();
        filterValueToUse = queryElements[1].trim();

        // Parse the filter value to use
        filterValueToUse = parseDateTimeValuesEsriImageOrWMS(filterValueToUse, this.getExternalFragmentsOrder());

        source.updateParams({ [dimension]: filterValueToUse.replace(/\s*/g, '') });
        olLayer.changed();

        // Emit event
        this.emitLayerFilterApplied({
          filter: filterValueToUse,
        });
      }
    }
  }

  /**
   * Overrides the way to get the bounds for this layer type.
   * @returns {Extent | undefined} The layer bounding box.
   */
  override onGetBounds(): Extent | undefined {
    const layerConfig = this.getLayerConfig();

    // Get the layer config bounds
    let layerConfigBounds = layerConfig?.initialSettings?.bounds;

    // If layer bounds were found, project
    if (layerConfigBounds) {
      // Make sure we're in the map projection. Always EPSG:4326 when coming from our configuration.
      layerConfigBounds = this.getMapViewer().convertExtentFromProjToMapProj(layerConfigBounds, 'EPSG:4326');
    }

    // Get the layer bounds from metadata, favoring a bounds in the same project as the map
    const metadataExtent = this.#getBoundsExtentFromMetadata(this.getMapViewer().getProjection().getCode());

    // If any
    let layerBounds;
    if (metadataExtent) {
      const [metadataProj, metadataBounds] = metadataExtent;
      layerBounds = this.getMapViewer().convertExtentFromProjToMapProj(metadataBounds, metadataProj);
    }

    // If both layer config had bounds and layer has real bounds, take the intersection between them
    if (layerConfigBounds && layerBounds) {
      layerBounds = getExtentIntersection(layerBounds, layerConfigBounds);
    } else if (layerConfigBounds && !layerBounds) {
      layerBounds = layerConfigBounds;
    }

    // Validate
    layerBounds = validateExtentWhenDefined(layerBounds, this.getMapViewer().getProjection().getCode());

    // Return the calculated bounds
    return layerBounds;
  }

  /**
   * Gets the bounds as defined in the metadata, favoring the ones in the given projection or returning the first one found
   * @param {string} projection - The projection to favor when looking for the bounds inside the metadata
   * @returns {[string, Extent]} The projection and its extent as provided by the metadata
   */
  #getBoundsExtentFromMetadata(projection: string): [string, Extent] | undefined {
    // Get the bounding boxes in the metadata
    const boundingBoxes = this.getLayerConfig().getServiceMetadata()?.Capability.Layer.BoundingBox as TypeJsonArray;

    // If found any
    if (boundingBoxes) {
      // Find the one with the right projection
      for (let i = 0; i < (boundingBoxes.length as number); i++) {
        // Read the extent info from the GetCap
        const { crs, extent } = boundingBoxes[i] as unknown as { crs: string; extent: Extent };

        // If it's the crs we want
        if (crs === projection) {
          const extentSafe: Extent = Projection.readExtentCarefully(crs, extent);
          return [crs, extentSafe];
        }
      }

      // At this point, none could be found. If there's any to go with, we try our best...
      if (boundingBoxes.length > 0) {
        // Take the first one and return the bounds and projection
        const { crs, extent } = boundingBoxes[0] as unknown as { crs: string; extent: Extent };
        const extentSafe: Extent = Projection.readExtentCarefully(crs, extent);
        return [crs, extentSafe];
      }
    }

    // Really not found
    return undefined;
  }
}
