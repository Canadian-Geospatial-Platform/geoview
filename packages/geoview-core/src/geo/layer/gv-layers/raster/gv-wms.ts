import axios from 'axios';

import ImageLayer from 'ol/layer/Image';
import { Options as ImageOptions } from 'ol/layer/BaseImage';
import { Coordinate } from 'ol/coordinate';
import { Pixel } from 'ol/pixel';
import { ImageWMS } from 'ol/source';
import { Extent } from 'ol/extent';

import { Cast, TypeJsonArray, TypeJsonObject } from '@/core/types/global-types';
import { CONST_LAYER_TYPES, TypeWmsLegend, TypeWmsLegendStyle } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { xmlToJson, getLocalizedValue } from '@/core/utils/utilities';
import { DateMgt } from '@/core/utils/date-mgt';
import { getExtentIntersection, validateExtentWhenDefined } from '@/geo/utils/utilities';
import { logger } from '@/core/utils/logger';
import { OgcWmsLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/ogc-wms-layer-entry-config';
import { TypeFeatureInfoEntry } from '@/geo/map/map-schema-types';
import { AppEventProcessor } from '@/api/event-processors/event-processor-children/app-event-processor';
import { loadImage } from '@/geo/utils/renderer/geoview-renderer';
import { AbstractGVRaster } from './abstract-gv-raster';
import { TypeLegend } from '@/core/stores/store-interface-and-intial-values/layer-state';

/**
 * Manages a WMS layer.
 *
 * @exports
 * @class GVWMS
 */
export class GVWMS extends AbstractGVRaster {
  // TODO: Refactor - Layers refactoring. Fix the WMSStyles initialization here
  WMSStyles = [];

  /**
   * Constructs a GVWMS layer to manage an OpenLayer layer.
   * @param {string} mapId - The map id
   * @param {ImageWMS} olSource - The OpenLayer source.
   * @param {OgcWmsLayerEntryConfig} layerConfig - The layer configuration.
   */
  public constructor(mapId: string, olSource: ImageWMS, layerConfig: OgcWmsLayerEntryConfig, layerCapabilities: TypeJsonObject) {
    super(mapId, olSource, layerConfig);

    // Validate
    if (!layerCapabilities) throw new Error('No layer capabilities were provided');

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
   * @param {Coordinate} location - The pixel coordinate that will be used by the query.
   * @returns {Promise<TypeFeatureInfoEntry[] | undefined | null>} A promise of an array of TypeFeatureInfoEntry[].
   */
  protected override getFeatureInfoAtPixel(location: Pixel): Promise<TypeFeatureInfoEntry[] | undefined | null> {
    // Redirect to getFeatureInfoAtCoordinate
    return this.getFeatureInfoAtCoordinate(this.getMapViewer().map.getCoordinateFromPixel(location));
  }

  /**
   * Overrides the return of feature information at a given coordinate.
   * @param {Coordinate} location - The coordinate that will be used by the query.
   * @returns {Promise<TypeFeatureInfoEntry[] | undefined | null>} A promise of an array of TypeFeatureInfoEntry[].
   */
  protected override getFeatureInfoAtCoordinate(location: Coordinate): Promise<TypeFeatureInfoEntry[] | undefined | null> {
    // Transform coordinate from map project to lntlat
    const projCoordinate = this.getMapViewer().convertCoordinateMapProjToLngLat(location);

    // Redirect to getFeatureInfoAtLongLat
    return this.getFeatureInfoAtLongLat(projCoordinate);
  }

  /**
   * Overrides the return of feature information at the provided long lat coordinate.
   * @param {Coordinate} lnglat - The coordinate that will be used by the query.
   * @returns {Promise<TypeFeatureInfoEntry[] | undefined | null>} A promise of an array of TypeFeatureInfoEntry[].
   */
  protected override async getFeatureInfoAtLongLat(lnglat: Coordinate): Promise<TypeFeatureInfoEntry[] | undefined | null> {
    try {
      // If the layer is invisible
      if (!this.getVisible()) return [];

      // Get the layer config and source
      const layerConfig = this.getLayerConfig();

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
        else if (featureInfoFormat.includes('text/plain' as TypeJsonObject)) infoFormat = 'text/plain';
        else throw new Error('Parameter info_format of GetFeatureInfo only support text/xml and text/plain for WMS services.');

      const wmsSource = this.getOLSource();
      const viewResolution = this.getMapViewer().getView().getResolution()!;
      const featureInfoUrl = wmsSource?.getFeatureInfoUrl(clickCoordinate, viewResolution, this.getMapViewer().getProjection().getCode(), {
        INFO_FORMAT: infoFormat,
      });
      if (featureInfoUrl) {
        let featureMember: TypeJsonObject | undefined;
        const response = await axios(featureInfoUrl);
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
        } else featureMember = { plain_text: { '#text': response.data } };
        if (featureMember) {
          const featureInfoResult = this.#formatWmsFeatureInfoResult(featureMember, layerConfig, clickCoordinate);
          return featureInfoResult;
        }
      }
      return [];
    } catch (error) {
      // Log
      logger.logError('gv-wms.getFeatureInfoAtLongLat()\n', error);
      return null;
    }
  }

  /**
   * Overrides the fetching of the legend for a WMS layer.
   * @returns {Promise<TypeLegend | null>} The legend of the layer or null.
   */
  override async getLegend(): Promise<TypeLegend | null> {
    try {
      // Get the layer config in a loaded phase
      const layerConfig = this.getLayerConfig();

      let legend: TypeWmsLegend;
      const legendImage = await this.#getLegendImage(layerConfig!);
      const styleLegends: TypeWmsLegendStyle[] = [];

      // If more than 1
      if (this.WMSStyles.length > 1) {
        for (let i = 0; i < this.WMSStyles.length; i++) {
          // TODO: refactor - does this await in a loop may haev an impact on performance?
          // TO.DOCONT: In this case here, when glancing at the code, the only reason to await would be if the order that the styleLegend
          // TO.DOCONT: get added to the styleLegends array MUST be the same order as they are in the WMSStyles array (as in they are 2 arrays with same indexes pointers).
          // TO.DOCONT: Without the await, WMSStyles[2] stuff could be associated with something in styleLegends[1] position for example (1<>2).
          // TO.DOCONT: If we remove the await, be mindful of that (maybe add this remark in the TODO?).
          // TO.DOCONT: In any case, I'd suggest to remove the await indeed, for performance, and rewrite the code to make it work (probably not 2 distinct arrays).
          // eslint-disable-next-line no-await-in-loop
          const styleLegend = await this.#getStyleLegend(layerConfig!, this.WMSStyles[i]);
          styleLegends.push(styleLegend);
        }
      }

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
      logger.logError('gv-wms.getLegend()\n', error);
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
          if (layerConfig?.source?.style && !Array.isArray(layerConfig?.source?.style)) return layerConfig.source.style === style.Name;

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
        queryUrl = `${getLocalizedValue(
          this.getLayerConfig().geoviewLayerConfig.metadataAccessPath,
          AppEventProcessor.getDisplayLanguage(this.getMapId())
        )!}service=WMS&version=1.3.0&request=GetLegendGraphic&FORMAT=image/png&layer=${layerConfig.layerId}`;

      if (queryUrl) {
        queryUrl = queryUrl.toLowerCase().startsWith('http:') ? `https${queryUrl.slice(4)}` : queryUrl;
        axios
          .get<TypeJsonObject>(queryUrl, { responseType: 'blob' })
          .then((response) => {
            if (response.data.type === 'text/xml') {
              resolve(null);
            }
            resolve(readImage(Cast<Blob>(response.data)));
          })
          .catch(() => resolve(null));
      } else resolve(null);
    });
    return promisedImage;
  }

  /**
   * Gets the legend info of a style.
   * @param {OgcWmsLayerEntryConfig} layerConfig - The layer configuration.
   * @param {string} wmsStyle - The wms style name
   * @returns {Promise<TypeWmsLegendStylel>} A promise of a TypeWmsLegendStyle.
   * @private
   */
  async #getStyleLegend(layerConfig: OgcWmsLayerEntryConfig, wmsStyle: string): Promise<TypeWmsLegendStyle> {
    try {
      const chosenStyle: string | undefined = wmsStyle;
      let styleLegend: TypeWmsLegendStyle;
      const styleLegendImage = await this.#getLegendImage(layerConfig!, chosenStyle);
      if (!styleLegendImage) {
        styleLegend = {
          name: wmsStyle,
          legend: null,
        };
        return styleLegend;
      }

      const styleImage = await loadImage(styleLegendImage as string);
      if (styleImage) {
        const drawingCanvas = document.createElement('canvas');
        drawingCanvas.width = styleImage.width;
        drawingCanvas.height = styleImage.height;
        const drawingContext = drawingCanvas.getContext('2d')!;
        drawingContext.drawImage(styleImage, 0, 0);
        styleLegend = {
          name: wmsStyle,
          legend: drawingCanvas,
        };
        return styleLegend;
      }

      return {
        name: wmsStyle,
        legend: null,
      } as TypeWmsLegendStyle;
    } catch (error) {
      return {
        name: wmsStyle,
        legend: null,
      } as TypeWmsLegendStyle;
    }
  }

  /**
   * Translates the get feature information result set to the TypeFeatureInfoEntry[] used by GeoView.
   * @param {TypeJsonObject} featureMember - An object formatted using the query syntax.
   * @param {OgcWmsLayerEntryConfig} layerConfig - The layer configuration.
   * @param {Coordinate} clickCoordinate - The coordinate where the user has clicked.
   * @returns {TypeFeatureInfoEntry[]} The feature info table.
   * @private
   */
  #formatWmsFeatureInfoResult(
    featureMember: TypeJsonObject,
    layerConfig: OgcWmsLayerEntryConfig,
    clickCoordinate: Coordinate
  ): TypeFeatureInfoEntry[] {
    const outfields = layerConfig?.source?.featureInfo?.outfields;
    const queryResult: TypeFeatureInfoEntry[] = [];

    let featureKeyCounter = 0;
    let fieldKeyCounter = 0;
    const featureInfoEntry: TypeFeatureInfoEntry = {
      // feature key for building the data-grid
      featureKey: featureKeyCounter++,
      geoviewLayerType: CONST_LAYER_TYPES.WMS,
      extent: [clickCoordinate[0], clickCoordinate[1], clickCoordinate[0], clickCoordinate[1]],
      geometry: null,
      featureIcon: document.createElement('canvas'),
      fieldInfo: {},
      nameField: null,
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

    if (!outfields) queryResult.push(featureInfoEntry);
    else {
      fieldKeyCounter = 0;
      const fieldsToDelete = Object.keys(featureInfoEntry.fieldInfo).filter((fieldName) => {
        if (outfields.find((outfield) => outfield.name === fieldName)) {
          const fieldIndex = outfields.findIndex((outfield) => outfield.name === fieldName);
          featureInfoEntry.fieldInfo[fieldName]!.fieldKey = fieldKeyCounter++;
          featureInfoEntry.fieldInfo[fieldName]!.alias = outfields![fieldIndex].alias;
          featureInfoEntry.fieldInfo[fieldName]!.dataType = outfields![fieldIndex].type;
          return false; // keep this entry
        }

        return true; // delete this entry
      });

      fieldsToDelete.forEach((entryToDelete) => {
        delete featureInfoEntry.fieldInfo[entryToDelete];
      });

      queryResult.push(featureInfoEntry);
    }

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
  setWmsStyle(wmsStyleId: string, layerPath: string): void {
    // TODO: Refactor - Layers refactoring. Remove the layerPath parameter once hybrid work is done (it should be moved when calling getLayerFilter below too)
    // TODO: Verify if we can apply more than one style at the same time since the parameter name is STYLES
    this.getOLSource()?.updateParams({ STYLES: wmsStyleId });
  }

  /**
   * Overrides when the layer gets in loaded status.
   */
  override onLoaded(): void {
    // Call parent
    super.onLoaded();

    // Apply view filter immediately (no need to provide a layer path here so '' is sent (hybrid work))
    this.applyViewFilter('', this.getLayerConfig().layerFilter || '');
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
  applyViewFilter(layerPath: string, filter: string, combineLegendFilter = true): void {
    // TODO: Refactor - Layers refactoring. Remove the layerPath parameter once hybrid work is done (it should be moved when calling getLayerFilter below too)
    const layerConfig = this.getLayerConfig();
    const olLayer = this.getOLLayer();

    // Log
    logger.logTraceCore('GVWMS - applyViewFilter', layerPath);

    // Get source
    const source = olLayer.getSource();
    if (source) {
      let filterValueToUse = filter;
      layerConfig.legendFilterIsOff = !combineLegendFilter;
      if (combineLegendFilter) layerConfig.layerFilter = filter;

      if (filterValueToUse) {
        filterValueToUse = filterValueToUse.replaceAll(/\s{2,}/g, ' ').trim();
        const queryElements = filterValueToUse.split(/(?<=\b)\s*=/);
        const dimension = queryElements[0].trim();
        filterValueToUse = queryElements[1].trim();

        // Convert date constants using the externalFragmentsOrder derived from the externalDateFormat
        const searchDateEntry = [
          ...`${filterValueToUse} `.matchAll(/(?<=^date\b\s')[\d/\-T\s:+Z]{4,25}(?=')|(?<=[(\s]date\b\s')[\d/\-T\s:+Z]{4,25}(?=')/gi),
        ];
        searchDateEntry.reverse();
        searchDateEntry.forEach((dateFound) => {
          // If the date has a time zone, keep it as is, otherwise reverse its time zone by changing its sign
          const reverseTimeZone = ![20, 25].includes(dateFound[0].length);
          const reformattedDate = DateMgt.applyInputDateFormat(dateFound[0], this.getExternalFragmentsOrder(), reverseTimeZone);
          filterValueToUse = `${filterValueToUse!.slice(0, dateFound.index! - 6)}${reformattedDate}${filterValueToUse!.slice(
            dateFound.index! + dateFound[0].length + 2
          )}`;
        });
        source.updateParams({ [dimension]: filterValueToUse.replace(/\s*/g, '') });
        olLayer.changed();

        // Emit event
        this.emitLayerFilterApplied({
          layerPath,
          filter: filterValueToUse,
        });
      }
    }
  }

  /**
   * Gets the bounds of the layer and returns updated bounds.
   * @returns {Extent | undefined} The layer bounding box.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  override getBounds(layerPath: string): Extent | undefined {
    // TODO: Refactor - Layers refactoring. Remove the layerPath parameter once hybrid work is done
    const layerConfig = this.getLayerConfig();

    // Get the source projection
    const sourceProjection = this.getOLSource().getProjection() || undefined;

    // Get the layer config bounds
    let layerConfigBounds = layerConfig?.initialSettings?.bounds;

    // If layer bounds were found, project
    if (layerConfigBounds) {
      // Make sure we're in the map projection. Always EPSG:4326 when coming from our configuration.
      layerConfigBounds = this.getMapViewer().convertExtentFromProjToMapProj(layerConfigBounds, 'EPSG:4326');
    }

    // Get the layer bounds from metadata
    const metadataExtent = this.#getBoundsExtentFromMetadata(sourceProjection?.getCode() || '');

    // If any
    let layerBounds;
    if (metadataExtent) {
      const [metadataProj, metadataBounds] = metadataExtent;
      layerBounds = this.getMapViewer().convertExtentFromProjToMapProj(metadataBounds, metadataProj);
    }

    // If both layer config had bounds and layer has real bounds, take the intersection between them
    if (layerConfigBounds && layerBounds) layerBounds = getExtentIntersection(layerBounds, layerConfigBounds);

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
        if (boundingBoxes[i].crs === projection)
          return [
            boundingBoxes[i].crs as string,
            // TODO: Check - Is it always in that order, 1, 0, 3, 2 or does that depend on the projection?
            [boundingBoxes[i].extent[1], boundingBoxes[i].extent[0], boundingBoxes[i].extent[3], boundingBoxes[i].extent[2]] as Extent,
          ];
      }

      // Not found. If any
      if (boundingBoxes.length > 0) {
        // Take the first one and return the bounds and projection
        return [
          boundingBoxes[0].crs as string,
          // TODO: Check - Is it always in that order, 1, 0, 3, 2 or does that depend on the projection?
          [boundingBoxes[0].extent[1], boundingBoxes[0].extent[0], boundingBoxes[0].extent[3], boundingBoxes[0].extent[2]] as Extent,
        ];
      }
    }

    // Really not found
    return undefined;
  }
}
