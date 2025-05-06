import { Options } from 'ol/layer/Base';
import { Coordinate } from 'ol/coordinate';
import { Pixel } from 'ol/pixel';
import { Extent } from 'ol/extent';
import Feature from 'ol/Feature';
import { Layer } from 'ol/layer';
import Source from 'ol/source/Source';
import { shared as iconImageCache } from 'ol/style/IconImageCache';
import { Projection as OLProjection } from 'ol/proj';

import { Style } from 'ol/style';
import cloneDeep from 'lodash/cloneDeep';
import { TimeDimension, DateMgt, TypeDateFragments } from '@/core/utils/date-mgt';
import { logger } from '@/core/utils/logger';
import { EsriDynamicLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/esri-dynamic-layer-entry-config';
import { OgcWmsLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/ogc-wms-layer-entry-config';
import { VectorLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-layer-entry-config';
import { AbstractBaseLayerEntryConfig } from '@/core/utils/config/validation-classes/abstract-base-layer-entry-config';
import EventHelper, { EventDelegateBase } from '@/api/events/event-helper';
import {
  TypeLayerStyleConfig,
  TypeFeatureInfoEntry,
  codedValueType,
  rangeDomainType,
  TypeLocation,
  QueryType,
  TypeStyleGeometry,
  TypeGeoviewLayerType,
  TypeOutfieldsType,
} from '@/api/config/types/map-schema-types';
import { getLegendStyles, getFeatureImageSource, processStyle } from '@/geo/utils/renderer/geoview-renderer';
import { TypeLegend } from '@/core/stores/store-interface-and-intial-values/layer-state';
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';
import { MapViewer } from '@/geo/map/map-viewer';
import { AbstractBaseLayer } from '@/geo/layer/gv-layers/abstract-base-layer';
import { SnackbarType } from '@/core/utils/notifications';
import { NotImplementedError, NotSupportedError } from '@/core/exceptions/core-exceptions';
import { LayerNotQueryableError } from '@/core/exceptions/layer-exceptions';

/**
 * Abstract Geoview Layer managing an OpenLayer layer.
 */
export abstract class AbstractGVLayer extends AbstractBaseLayer {
  // The default hit tolerance the query should be using
  static DEFAULT_HIT_TOLERANCE: number = 4;

  // The default hit tolerance
  hitTolerance: number = AbstractGVLayer.DEFAULT_HIT_TOLERANCE;

  // The OpenLayer source
  #olSource: Source;

  /** Style to apply to the vector layer. */
  #layerStyle?: TypeLayerStyleConfig;

  /** Layer temporal dimension */
  #layerTemporalDimension?: TimeDimension;

  /** Date format object used to translate server to ISO format and ISO to server format */
  #serverDateFragmentsOrder?: TypeDateFragments;

  /** Date format object used to translate internal UTC ISO format to the external format, the one used by the user */
  #externalFragmentsOrder?: TypeDateFragments;

  /** Boolean indicating if the layer should be included in time awareness functions such as the Time Slider. True by default. */
  #isTimeAware: boolean = true;

  // Keep all callback delegates references
  #onLayerStyleChangedHandlers: LayerStyleChangedDelegate[] = [];

  // Keep all callback delegate references
  #onLegendQueryingHandlers: LegendQueryingDelegate[] = [];

  // Keep all callback delegate references
  #onLegendQueriedHandlers: LegendQueriedDelegate[] = [];

  // Keep all callback delegate references
  #onLayerFilterAppliedHandlers: LayerFilterAppliedDelegate[] = [];

  // Keep all callback delegates references
  #onIndividualLayerLoadedHandlers: IndividualLayerLoadedDelegate[] = [];

  // Keep all callback delegates references
  #onLayerMessageHandlers: LayerMessageDelegate[] = [];

  /**
   * Constructs a GeoView layer to manage an OpenLayer layer.
   * @param {string} mapId - The map id
   * @param {BaseLayer} olLayer - The OpenLayer layer.
   * @param {AbstractBaseLayerEntryConfig} layerConfig - The layer configuration.
   */
  protected constructor(mapId: string, olSource: Source, layerConfig: AbstractBaseLayerEntryConfig) {
    super(mapId, layerConfig);
    this.#olSource = olSource;

    // Keep the date formatting information
    this.#serverDateFragmentsOrder = layerConfig.geoviewLayerConfig.serviceDateFormat
      ? DateMgt.getDateFragmentsOrder(layerConfig.geoviewLayerConfig.serviceDateFormat)
      : undefined;
    this.#externalFragmentsOrder = DateMgt.getDateFragmentsOrder(layerConfig.geoviewLayerConfig.externalDateFormat);

    // Boolean indicating if the layer should be included in time awareness functions such as the Time Slider. True by default.
    this.#isTimeAware = layerConfig.geoviewLayerConfig.isTimeAware === undefined ? true : layerConfig.geoviewLayerConfig.isTimeAware;

    // If there is a layer style in the config, set it in the layer
    if (layerConfig.layerStyle) this.setStyle(layerConfig.layerStyle);
  }

  /**
   * Gets the bounds for the layer in the given projection.
   * @param {OLProjection} projection - The projection to get the bounds into.
   * @param {number} stops - The number of stops to use to generate the extent.
   * @returns {Extent | undefined} The layer bounding box.
   */
  getBounds(projection: OLProjection, stops: number): Extent | undefined {
    // Redirect to overridable method
    return this.onGetBounds(projection, stops);
  }

  /**
   * Must override method to return the bounds of a layer in the given projection.
   * @param {OLProjection} projection - The projection to get the bounds into.
   * @param {number} stops - The number of stops to use to generate the extent.
   * @returns {Extent} The layer bounding box.
   */
  abstract onGetBounds(projection: OLProjection, stops: number): Extent | undefined;

  /**
   * Initializes the GVLayer. This function checks if the source is ready and if so it calls onLoaded() to pursue initialization of the layer.
   * If the source isn't ready, it registers to the source ready event to pursue initialization of the layer once its source is ready.
   */
  init(): void {
    // Activation of the load end/error listeners
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this.#olSource as any).once(['featuresloadend', 'imageloadend', 'tileloadend'], this.onLoaded.bind(this));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this.#olSource as any).once(['featuresloaderror', 'tileloaderror'], this.onError.bind(this));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this.#olSource as any).on(['imageloaderror'], this.onImageLoadError.bind(this));
  }

  /**
   * Gets the MapViewer where the layer resides
   * @returns {MapViewer} The MapViewer
   */
  getMapViewer(): MapViewer {
    // GV The GVLayers need a reference to the MapViewer to be able to perform operations.
    // GV This is a trick to obtain it. Otherwise, it'd need to be provided via constructor.
    return MapEventProcessor.getMapViewer(this.getMapId());
  }

  /**
   * Overrides the get of the OpenLayers Layer
   * @returns {Layer} The OpenLayers Layer
   */
  override getOLLayer(): Layer {
    // Call parent and cast
    return super.getOLLayer() as Layer;
  }

  /**
   * Gets the OpenLayers Layer Source
   * @returns The OpenLayers Layer Source
   */
  getOLSource(): Source {
    return this.#olSource;
  }

  /**
   * Gets the layer configuration associated with the layer.
   * @returns {AbstractBaseLayerEntryConfig} The layer configuration
   */
  override getLayerConfig(): AbstractBaseLayerEntryConfig {
    return super.getLayerConfig() as AbstractBaseLayerEntryConfig;
  }

  /**
   * Gets the layer style
   * @returns The layer style
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getStyle(): TypeLayerStyleConfig | undefined {
    return this.#layerStyle;
  }

  /**
   * Sets the layer style
   * @param {TypeStyleConfig | undefined} style - The layer style
   */
  setStyle(style: TypeLayerStyleConfig): void {
    this.#layerStyle = style;
    this.#emitLayerStyleChanged({ style });
  }

  /**
   * Gets the layer attributions
   * @returns {string[]} The layer attributions
   */
  override getAttributions(): string[] {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const attributionsAsRead = this.getOLSource().getAttributions()?.({} as any); // This looks very weird, but it's as documented in OpenLayers..

    // Depending on the internal formatting
    if (!attributionsAsRead) return [];
    if (typeof attributionsAsRead === 'string') return [attributionsAsRead];
    return attributionsAsRead;
  }

  /**
   * Gets the temporal dimension that is associated to the layer.
   * @returns {TimeDimension | undefined} The temporal dimension associated to the layer or undefined.
   */
  getTemporalDimension(): TimeDimension | undefined {
    return this.#layerTemporalDimension;
  }

  /**
   * Sets the temporal dimension for the layer.
   * @param {TimeDimension} temporalDimension - The value to assign to the layer temporal dimension property.
   */
  setTemporalDimension(temporalDimension: TimeDimension): void {
    this.#layerTemporalDimension = temporalDimension;
  }

  /**
   * Gets the flag if layer use its time dimension, this can be use to exclude layers from time function like time slider
   * @returns {boolean} The flag indicating if the layer should be included in time awareness functions such as the Time Slider. True by default.
   */
  getIsTimeAware(): boolean {
    return this.#isTimeAware;
  }

  /**
   * Gets the external fragments order.
   * @returns {TypeDateFragments | undefined} The external fragmets order associated to the layer or undefined.
   */
  getExternalFragmentsOrder(): TypeDateFragments | undefined {
    return this.#externalFragmentsOrder;
  }

  /**
   * Gets the in visible range value
   * @returns {boolean} true if the layer is in visible range
   */
  getInVisibleRange(): boolean {
    const mapZoom = this.getMapViewer().getView().getZoom();
    return mapZoom! > this.getMinZoom() && mapZoom! <= this.getMaxZoom();
  }

  /**
   * Overridable method called when the layer has been loaded correctly
   */
  protected onLoaded(): void {
    // Get the layer config
    const layerConfig = this.getLayerConfig();

    // Set the layer config status to loaded to keep mirroring the AbstractGeoViewLayer for now
    layerConfig.setLayerStatusLoaded();

    // Now that the layer is loaded, set its visibility correctly (had to be done in the loaded event, not before, per prior note in pre-refactor)
    this.setVisible(layerConfig.initialSettings?.states?.visible !== false);

    // Emit event
    this.#emitIndividualLayerLoaded({ layerPath: this.getLayerPath() });
  }

  /**
   * Emits a layer-specific message event with localization support
   * @protected
   * @param {string} messageKey - The key used to lookup the localized message OR message
   * @param {string[]} messageParams - Array of parameters to be interpolated into the localized message
   * @param {SnackbarType} messageType - The message type
   * @param {boolean} [notification=false] - Whether to show this as a notification. Defaults to false
   * @returns {void}
   *
   * @example
   * this.emitMessage(
   *   'layers.fetchProgress',
   *   ['50', '100'],
   *   messageType: 'error',
   *   true
   * );
   *
   * @fires LayerMessageEvent
   */
  protected emitMessage(
    messageKey: string,
    messageParams: string[],
    messageType: SnackbarType = 'info',
    notification: boolean = false
  ): void {
    this.#emitLayerMessage({ messageKey, messageParams, messageType, notification });
  }

  /**
   * Overridable method called when the layer is in error and couldn't be loaded correctly
   */
  protected onError(): void {
    // Log
    logger.logError(
      `Error loading layer: ${this.getLayerPath()} at zoom level: ${Math.round(this.getMapViewer().getView().getZoom() || 0)}`
    );

    // Set the layer config status to error to keep mirroring the AbstractGeoViewLayer for now
    this.getLayerConfig().setLayerStatusError();

    // Emit about the error
    this.emitMessage('layers.errorNotLoaded', [this.getLayerName()!], 'error', true);
  }

  /**
   * Overridable method called when the layer image is in error and couldn't be loaded correctly.
   * We do not put the layer status as error, as this could be specific to a zoom level and the layer is otherwise fine.
   */
  protected onImageLoadError(): void {
    // Log
    logger.logError(
      `Error loading source image for layer: ${this.getLayerPath()} at zoom level: ${Math.round(this.getMapViewer().getView().getZoom() || 0)}`
    );

    // Set the layer config status to error to keep mirroring the AbstractGeoViewLayer for now
    this.getLayerConfig().setLayerStatusError();

    // Emit about the error
    this.emitMessage(
      'layers.errorImageLoad',
      [this.getLayerName()!, Math.round(this.getMapViewer().getView().getZoom() || 0).toString()],
      'error',
      true
    );
  }

  /**
   * Returns feature information for the layer specified.
   * @param {QueryType} queryType - The type of query to perform.
   * @param {TypeLocation} location - An pixel, coordinate or polygon that will be used by the query.
   * @param {boolean} queryGeometry - Whether to include geometry in the query, default is true.
   * @param {AbortController?} abortController - The optional abort controller.
   * @returns {Promise<TypeFeatureInfoEntry[]>} The feature info table.
   */
  async getFeatureInfo(
    queryType: QueryType,
    location: TypeLocation,
    queryGeometry: boolean = true,
    abortController: AbortController | undefined = undefined
  ): Promise<TypeFeatureInfoEntry[]> {
    // Get the layer config
    const layerConfig = this.getLayerConfig();

    // If the layer is not queryable
    if (layerConfig.source?.featureInfo?.queryable === false) {
      // Throw error
      throw new LayerNotQueryableError(layerConfig.layerPath);
    }

    // Log
    logger.logTraceCore('ABSTRACT-GV-LAYERS - getFeatureInfo', queryType);
    const logMarkerKey = `${queryType}`;
    logger.logMarkerStart(logMarkerKey);

    let promiseGetFeature: Promise<TypeFeatureInfoEntry[]>;
    switch (queryType) {
      case 'all':
        promiseGetFeature = this.getAllFeatureInfo(abortController);
        break;
      case 'at_pixel':
        promiseGetFeature = this.getFeatureInfoAtPixel(location as Pixel, queryGeometry, abortController);
        break;
      case 'at_coordinate':
        promiseGetFeature = this.getFeatureInfoAtCoordinate(location as Coordinate, queryGeometry, abortController);
        break;
      case 'at_long_lat':
        promiseGetFeature = this.getFeatureInfoAtLongLat(location as Coordinate, queryGeometry, abortController);
        break;
      case 'using_a_bounding_box':
        promiseGetFeature = this.getFeatureInfoUsingBBox(location as Coordinate[], queryGeometry, abortController);
        break;
      case 'using_a_polygon':
        promiseGetFeature = this.getFeatureInfoUsingPolygon(location as Coordinate[], queryGeometry, abortController);
        break;
      default:
        // Not implemented
        throw new NotSupportedError(`Unsupported query type '${queryType}'`);
    }

    // Wait for results
    const arrayOfFeatureInfoEntries = await promiseGetFeature;

    // Log
    logger.logMarkerCheck(logMarkerKey, `to getFeatureInfo on ${this.getLayerPath()}`, arrayOfFeatureInfoEntries);

    // Return the result
    return arrayOfFeatureInfoEntries;
  }

  /**
   * Overridable function to get all feature information for all the features stored in the layer.
   * @param {AbortController?} abortController - The optional abort controller.
   * @returns {Promise<TypeFeatureInfoEntry[]>} A promise of an array of TypeFeatureInfoEntry[].
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected getAllFeatureInfo(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    abortController: AbortController | undefined = undefined
  ): Promise<TypeFeatureInfoEntry[]> {
    // Crash on purpose
    throw new NotImplementedError(`getAllFeatureInfo not implemented on layer path ${this.getLayerPath()}`);
  }

  /**
   * Overridable function to return of feature information at a given pixel location.
   * @param {Pixel} location - The pixel coordinate that will be used by the query.
   * @param {boolean} queryGeometry - Whether to include geometry in the query, default is true.
   * @param {AbortController?} abortController - The optional abort controller.
   * @returns {Promise<TypeFeatureInfoEntry[]>} A promise of an array of TypeFeatureInfoEntry[].
   */
  protected getFeatureInfoAtPixel(
    location: Pixel,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    queryGeometry: boolean = true,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    abortController: AbortController | undefined = undefined
  ): Promise<TypeFeatureInfoEntry[]> {
    // Crash on purpose
    throw new NotImplementedError(`getFeatureInfoAtPixel not implemented on layer path ${this.getLayerPath()}`);
  }

  /**
   * Overridable function to return of feature information at a given coordinate.
   * @param {Coordinate} location - The coordinate that will be used by the query.
   * @param {boolean} queryGeometry - Whether to include geometry in the query, default is true.
   * @param {AbortController?} abortController - The optional abort controller.
   * @returns {Promise<TypeFeatureInfoEntry[]>} A promise of an array of TypeFeatureInfoEntry[].
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected getFeatureInfoAtCoordinate(
    location: Coordinate,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    queryGeometry: boolean = true,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    abortController: AbortController | undefined = undefined
  ): Promise<TypeFeatureInfoEntry[]> {
    // Crash on purpose
    throw new NotImplementedError(`getFeatureInfoAtCoordinate not implemented on layer path ${this.getLayerPath()}`);
  }

  /**
   * Overridable function to return of feature information at the provided long lat coordinate.
   * @param {Coordinate} lnglat - The coordinate that will be used by the query.
   * @param {boolean} queryGeometry - Whether to include geometry in the query, default is true.
   * @param {AbortController?} abortController - The optional abort controller.
   * @returns {Promise<TypeFeatureInfoEntry[]>} A promise of an array of TypeFeatureInfoEntry[].
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected getFeatureInfoAtLongLat(
    lnglat: Coordinate,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    queryGeometry: boolean = true,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    abortController: AbortController | undefined = undefined
  ): Promise<TypeFeatureInfoEntry[]> {
    // Crash on purpose
    throw new NotImplementedError(`getFeatureInfoAtLongLat not implemented on layer path ${this.getLayerPath()}`);
  }

  /**
   * Overridable function to return of feature information at the provided bounding box.
   * @param {Coordinate} location - The bounding box that will be used by the query.
   * @param {boolean} queryGeometry - Whether to include geometry in the query, default is true.
   * @param {AbortController?} abortController - The optional abort controller.
   * @returns {Promise<TypeFeatureInfoEntry[]>} A promise of an array of TypeFeatureInfoEntry[].
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected getFeatureInfoUsingBBox(
    location: Coordinate[],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    queryGeometry: boolean = true,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    abortController: AbortController | undefined = undefined
  ): Promise<TypeFeatureInfoEntry[]> {
    // Crash on purpose
    throw new NotImplementedError(`getFeatureInfoUsingBBox not implemented on layer path ${this.getLayerPath()}`);
  }

  /**
   * Overridable function to return of feature information at the provided polygon.
   * @param {Coordinate} location - The polygon that will be used by the query.
   * @param {boolean} queryGeometry - Whether to include geometry in the query, default is true.
   * @param {AbortController?} abortController - The optional abort controller.
   * @returns {Promise<TypeFeatureInfoEntry[]>} A promise of an array of TypeFeatureInfoEntry[].
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected getFeatureInfoUsingPolygon(
    location: Coordinate[],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    queryGeometry: boolean = true,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    abortController: AbortController | undefined = undefined
  ): Promise<TypeFeatureInfoEntry[]> {
    // Crash on purpose
    throw new NotImplementedError(`getFeatureInfoUsingPolygon not implemented on layer path ${this.getLayerPath()}`);
  }

  /**
   * Overridable function to return the domain of the specified field or null if the field has no domain.
   * @param {string} fieldName - The field name for which we want to get the domain.
   * @returns {null | codedValueType | rangeDomainType} The domain of the field.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/class-methods-use-this
  protected getFieldDomain(fieldName: string): null | codedValueType | rangeDomainType {
    // Log - REMOVED as it is trigger for every row of data table, just enable for debuggin purpose
    // logger.logWarning(`getFieldDomain is not implemented for ${fieldName} on layer path ${this.getLayerPath()}`);
    return null;
  }

  /**
   * Overridable function to return the type of the specified field from the metadata. If the type can not be found, return 'string'.
   * @param {string} fieldName - The field name for which we want to get the type.
   *
   * @returns {TypeOutfieldsType} The type of the field.
   */
  protected getFieldType(fieldName: string): TypeOutfieldsType {
    // Log
    logger.logWarning(`getFieldType is not implemented for ${fieldName} on layer path ${this.getLayerPath()}`);
    return 'string';
  }

  /**
   * Queries the legend.
   * This function raises legend querying and queried events. It calls the overridable onFetchLegend() function.
   * @returns {Promise<TypeLegend | null>} The promise when the legend (or null) will be received
   */
  queryLegend(): Promise<TypeLegend | null> {
    // Emit that the legend has been queried
    this.#emitLegendQuerying();

    // Fetch the legend by calling the overridable function
    const promiseLegend = this.onFetchLegend();

    // Whenever the promise resolves
    promiseLegend
      .then((legend) => {
        // If legend was received
        if (legend) {
          // Save the style according to the legend
          this.onSetStyleAccordingToLegend(legend);
          // Check for possible number of icons and set icon cache size
          this.updateIconImageCache(legend);
          // Emit legend information once retrieved
          this.#emitLegendQueried({ legend });
        }
      })
      .catch((error: unknown) => {
        // Log
        logger.logPromiseFailed('promiseLegend in queryLegend in AbstractGVLayer', error);
      });

    // Return the promise
    return promiseLegend;
  }

  /**
   * Update the size of the icon image list based on styles.
   * @param {TypeLegend} legend - The legend to check.
   */
  updateIconImageCache(legend: TypeLegend): void {
    // GV This will need to be revised if functionality to add additional icons to a layer is added
    let styleCount = this.getMapViewer().iconImageCacheSize;
    if (legend.styleConfig)
      Object.keys(legend.styleConfig).forEach((geometry) => {
        if (
          legend.styleConfig &&
          (legend.styleConfig[geometry as TypeStyleGeometry]?.type === 'uniqueValue' ||
            legend.styleConfig[geometry as TypeStyleGeometry]?.type === 'classBreaks')
        ) {
          if (legend.styleConfig[geometry as TypeStyleGeometry]!.info?.length)
            styleCount += legend.styleConfig[geometry as TypeStyleGeometry]!.info.length;
        }
      });
    // Set the openlayers icon image cache
    iconImageCache.setSize(styleCount);
    // Update the cache size for the map viewer
    this.getMapViewer().iconImageCacheSize = styleCount;
  }

  /**
   * Overridable function returning the legend of the layer. Returns null when the layerPath specified is not found. If the style property
   * of the layerConfig object is undefined, the legend property of the object returned will be null.
   * @returns {Promise<TypeLegend | null>} The legend of the layer.
   */
  async onFetchLegend(): Promise<TypeLegend | null> {
    try {
      const legend: TypeLegend = {
        type: this.getLayerConfig().geoviewLayerConfig.geoviewLayerType as TypeGeoviewLayerType,
        styleConfig: this.getStyle(),
        legend: await getLegendStyles(this.getStyle()),
      };
      return legend;
    } catch (error: unknown) {
      // Log
      logger.logError(error);
      return null;
    }
  }

  /**
   * Overridable function set the style according to the fetched legend information
   *
   * @param {TypeLegend} legend - The fetched legend information
   */
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this, @typescript-eslint/no-unused-vars
  onSetStyleAccordingToLegend(legend: TypeLegend): void {
    // By default, nothing to do here, check for overrides in children classes
  }

  /**
   * Gets and formats the value of the field with the name passed in parameter. Vector GeoView layers convert dates to milliseconds
   * since the base date. Vector feature dates must be in ISO format.
   * @param {Feature} features - The features that hold the field values.
   * @param {string} fieldName - The field name.
   * @param {TypeOutfieldsType} fieldType - The field type.
   * @returns {string | number | Date} The formatted value of the field.
   */
  protected getFieldValue(feature: Feature, fieldName: string, fieldType: TypeOutfieldsType): string | number | Date {
    const fieldValue = feature.get(fieldName);
    let returnValue: string | number | Date;
    if (fieldType === 'date') {
      if (typeof fieldValue === 'string') {
        if (!this.#serverDateFragmentsOrder)
          this.#serverDateFragmentsOrder = DateMgt.getDateFragmentsOrder(DateMgt.deduceDateFormat(fieldValue));
        returnValue = DateMgt.applyInputDateFormat(fieldValue, this.#serverDateFragmentsOrder);
      } else {
        // All vector dates are kept internally in UTC.
        returnValue = DateMgt.convertToUTC(`${DateMgt.convertMilisecondsToDate(fieldValue)}Z`);
      }
      const reverseTimeZone = true;
      if (this.#externalFragmentsOrder)
        returnValue = DateMgt.applyOutputDateFormat(returnValue, this.#externalFragmentsOrder, reverseTimeZone);
      return returnValue;
    }
    return fieldValue;
  }

  /**
   * Converts the feature information to an array of TypeFeatureInfoEntry[] | undefined | null.
   * @param {Feature[]} features - The array of features to convert.
   * @param {OgcWmsLayerEntryConfig | EsriDynamicLayerEntryConfig | VectorLayerEntryConfig} layerConfig - The layer configuration.
   * @returns {TypeFeatureInfoEntry[]} The Array of feature information.
   */
  protected formatFeatureInfoResult(
    features: Feature[],
    layerConfig: OgcWmsLayerEntryConfig | EsriDynamicLayerEntryConfig | VectorLayerEntryConfig
  ): TypeFeatureInfoEntry[] {
    try {
      if (!features.length) return [];

      const outfields = layerConfig?.source?.featureInfo?.outfields;

      // Hold a dictionary built on the fly for the field domains
      const dictFieldDomains: { [fieldName: string]: codedValueType | rangeDomainType | null } = {};
      // Hold a dictionary build on the fly for the field types
      const dictFieldTypes: { [fieldName: string]: TypeOutfieldsType } = {};

      // Loop on the promised feature infos
      let featureKeyCounter = 0;
      let fieldKeyCounter = 0;
      const queryResult: TypeFeatureInfoEntry[] = [];

      // Dict to store created image sources to avoid recreating
      const imageSourceDict: { [styleAsJsonString: string]: string } = {};
      const layerStyle = this.getStyle()!;

      features.forEach((feature) => {
        // Check dict for existing image source and create it if it does not exist
        const geometryType = feature.getGeometry()
          ? (feature.getGeometry()!.getType() as TypeStyleGeometry)
          : (Object.keys(layerStyle)[0] as TypeStyleGeometry);

        let imageSource;
        if (layerStyle[geometryType]) {
          const styleSettings = layerStyle[geometryType]!;
          const { type } = styleSettings;
          const featureStyle = processStyle[type][geometryType](styleSettings, feature, layerConfig.filterEquation, true);

          // Sometimes data is not well fomrated and some features has no style associated, just throw a warning
          if (featureStyle === undefined) {
            logger.logWarning(`Feature style is undefined for ${this.getLayerPath()}`);
          }

          // Create a string unique to the style, but geometry agnostic
          const styleClone = cloneDeep(featureStyle) as Style;
          styleClone?.setGeometry?.('');
          const styleString = `${geometryType}${JSON.stringify(styleClone)}`;

          // Use string as dict key
          if (!imageSourceDict[styleString])
            imageSourceDict[styleString] = getFeatureImageSource(feature, layerStyle, layerConfig.filterEquation, true);
          imageSource = imageSourceDict[styleString];
        }

        if (!imageSource) imageSource = getFeatureImageSource(feature, layerStyle, layerConfig.filterEquation, true);

        let extent;
        if (feature.getGeometry()) extent = feature.getGeometry()!.getExtent();

        const featureInfoEntry: TypeFeatureInfoEntry = {
          // feature key for building the data-grid
          featureKey: featureKeyCounter++,
          geoviewLayerType: this.getLayerConfig().geoviewLayerConfig.geoviewLayerType as TypeGeoviewLayerType,
          extent,
          geometry: feature,
          featureIcon: imageSource,
          fieldInfo: {},
          nameField: layerConfig?.source?.featureInfo?.nameField || null,
          layerPath: layerConfig.layerPath,
        };

        const featureFields = feature.getKeys();
        featureFields.forEach((fieldName) => {
          if (fieldName !== 'geometry') {
            const fieldValue = feature.get(fieldName);
            // Skip complex fields
            if (fieldValue && typeof fieldValue === 'object' && !Array.isArray(fieldValue)) {
              return;
            }

            // Calculate the field domain if not already calculated
            if (!(fieldName in dictFieldDomains)) {
              // Calculate it
              dictFieldDomains[fieldName] = this.getFieldDomain(fieldName);
            }
            const fieldDomain = dictFieldDomains[fieldName];

            // Calculate the field type if not already calculated
            if (!(fieldName in dictFieldTypes)) {
              dictFieldTypes[fieldName] = this.getFieldType(fieldName);
            }
            const fieldType = dictFieldTypes[fieldName];
            const fieldEntry = outfields?.find((outfield) => outfield.name === fieldName || outfield.alias === fieldName);
            if (fieldEntry) {
              featureInfoEntry.fieldInfo[fieldEntry.name] = {
                fieldKey: fieldKeyCounter++,
                value:
                  // If fieldName is the alias for the entry, we will not get a value, so we try the fieldEntry name.
                  this.getFieldValue(feature, fieldName, fieldEntry!.type as 'string' | 'number' | 'date') ||
                  this.getFieldValue(feature, fieldEntry.name, fieldEntry!.type as 'string' | 'number' | 'date'),
                dataType: fieldEntry!.type,
                alias: fieldEntry!.alias,
                domain: fieldDomain,
              };
            } else if (!outfields) {
              featureInfoEntry.fieldInfo[fieldName] = {
                fieldKey: fieldKeyCounter++,
                value: this.getFieldValue(feature, fieldName, fieldType),
                dataType: fieldType,
                alias: fieldName,
                domain: fieldDomain,
              };
            }
          }
        });

        queryResult.push(featureInfoEntry);
      });

      return queryResult;
    } catch (error: unknown) {
      // Log
      logger.logError(error);
      return [];
    }
  }

  /**
   * Gets the layerFilter that is associated to the layer.
   * @returns {string | undefined} The filter associated to the layer or undefined.
   */
  getLayerFilter(): string | undefined {
    // Redirect
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (this.getLayerConfig() as any)?.layerFilter;
  }

  /**
   * Initializes common properties on a layer options.
   * @param {Options} layerOptions - The layer options to initialize
   * @param {AbstractBaseLayerEntryConfig} layerConfig - The config to read the initial settings from
   */
  protected static initOptionsWithInitialSettings(layerOptions: Options, layerConfig: AbstractBaseLayerEntryConfig): void {
    // GV Note: The visible flag (and maybe others?) must be set in the 'onLoaded' function below, because the layer needs to
    // GV attempt to be visible on the map in order to trigger its source loaded event.

    // Set the layer options as read from the initialSettings
    // GV We disable the warnings, because this function purpose is to actually initialize the given parameter
    // eslint-disable-next-line no-param-reassign
    if (layerConfig.initialSettings?.className !== undefined) layerOptions.className = layerConfig.initialSettings.className;
    // eslint-disable-next-line no-param-reassign
    if (layerConfig.initialSettings?.extent !== undefined) layerOptions.extent = layerConfig.initialSettings.extent;
    // eslint-disable-next-line no-param-reassign
    if (layerConfig.initialSettings?.states?.opacity !== undefined) layerOptions.opacity = layerConfig.initialSettings.states.opacity;
  }

  // #region EVENTS

  /**
   * Emits an event to all handlers.
   * @param {LegendQueryingEvent} event The event to emit
   * @private
   */
  #emitLegendQuerying(): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onLegendQueryingHandlers, undefined);
  }

  /**
   * Registers a legend querying event handler.
   * @param {LegendQueryingDelegate} callback The callback to be executed whenever the event is emitted
   */
  onLegendQuerying(callback: LegendQueryingDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onLegendQueryingHandlers, callback);
  }

  /**
   * Unregisters a legend querying event handler.
   * @param {LegendQueryingDelegate} callback The callback to stop being called whenever the event is emitted
   */
  offLegendQuerying(callback: LegendQueryingDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLegendQueryingHandlers, callback);
  }

  /**
   * Emits an event to all handlers.
   * @param {LegendQueriedEvent} event The event to emit
   * @private
   */
  #emitLegendQueried(event: LegendQueriedEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onLegendQueriedHandlers, event);
  }

  /**
   * Registers a legend queried event handler.
   * @param {LegendQueriedDelegate} callback The callback to be executed whenever the event is emitted
   */
  onLegendQueried(callback: LegendQueriedDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onLegendQueriedHandlers, callback);
  }

  /**
   * Unregisters a legend queried event handler.
   * @param {LegendQueriedDelegate} callback The callback to stop being called whenever the event is emitted
   */
  offLegendQueried(callback: LegendQueriedDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLegendQueriedHandlers, callback);
  }

  /**
   * Emits filter applied event.
   * @param {FilterAppliedEvent} event - The event to emit
   * @private
   */
  protected emitLayerFilterApplied(event: LayerFilterAppliedEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onLayerFilterAppliedHandlers, event);
  }

  /**
   * Registers a filter applied event handler.
   * @param {FilterAppliedDelegate} callback - The callback to be executed whenever the event is emitted
   */
  onLayerFilterApplied(callback: LayerFilterAppliedDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onLayerFilterAppliedHandlers, callback);
  }

  /**
   * Unregisters a filter applied event handler.
   * @param {FilterAppliedDelegate} callback - The callback to stop being called whenever the event is emitted
   */
  offLayerFilterApplied(callback: LayerFilterAppliedDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerFilterAppliedHandlers, callback);
  }

  /**
   * Emits an event to all handlers.
   * @param {LayerStyleChangedEvent} event - The event to emit
   */
  #emitLayerStyleChanged(event: LayerStyleChangedEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onLayerStyleChangedHandlers, event);
  }

  /**
   * Registers a layer style changed event handler.
   * @param {LayerStyleChangedDelegate} callback - The callback to be executed whenever the event is emitted
   */
  onLayerStyleChanged(callback: LayerStyleChangedDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onLayerStyleChangedHandlers, callback);
  }

  /**
   * Unregisters a layer style changed event handler.
   * @param {LayerStyleChangedDelegate} callback - The callback to stop being called whenever the event is emitted
   */
  offLayerStyleChanged(callback: LayerStyleChangedDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerStyleChangedHandlers, callback);
  }

  /**
   * Emits an event to all handlers when the layer's features have been loaded on the map.
   * @param {IndividualLayerLoadedEvent} event - The event to emit
   * @private
   */
  #emitIndividualLayerLoaded(event: IndividualLayerLoadedEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onIndividualLayerLoadedHandlers, event);
  }

  /**
   * Registers an individual layer loaded event handler.
   * @param {IndividualLayerLoadedDelegate} callback - The callback to be executed whenever the event is emitted
   */
  onIndividualLayerLoaded(callback: IndividualLayerLoadedDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onIndividualLayerLoadedHandlers, callback);
  }

  /**
   * Unregisters an individual layer loaded event handler.
   * @param {IndividualLayerLoadedDelegate} callback - The callback to stop being called whenever the event is emitted
   */
  offIndividualLayerLoaded(callback: IndividualLayerLoadedDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onIndividualLayerLoadedHandlers, callback);
  }

  /**
   * Emits an event to all handlers when the layer's sent a message.
   * @param {LayerMessageEvent} event - The event to emit
   * @private
   */
  #emitLayerMessage(event: LayerMessageEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onLayerMessageHandlers, event);
  }

  /**
   * Registers an individual layer message event handler.
   * @param {LayerMessageEventDelegate} callback - The callback to be executed whenever the event is emitted
   */
  onLayerMessage(callback: LayerMessageDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onLayerMessageHandlers, callback);
  }

  /**
   * Unregisters an individual layer message event handler.
   * @param {LayerMessageEventDelegate} callback - The callback to stop being called whenever the event is emitted
   */
  offLayerMessage(callback: LayerMessageDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerMessageHandlers, callback);
  }

  // #endregion EVENTS
}

/**
 * Define a delegate for the event handler function signature
 */
type LayerStyleChangedDelegate = EventDelegateBase<AbstractGVLayer, LayerStyleChangedEvent, void>;

/**
 * Define an event for the delegate
 */
export type LayerStyleChangedEvent = {
  // The style
  style: TypeLayerStyleConfig;
};

/**
 * Define an event for the delegate
 */
export type LegendQueryingEvent = unknown;

/**
 * Define a delegate for the event handler function signature
 */
type LegendQueryingDelegate = EventDelegateBase<AbstractGVLayer, LegendQueryingEvent, void>;

/**
 * Define an event for the delegate
 */
export type LegendQueriedEvent = {
  legend: TypeLegend;
};

/**
 * Define a delegate for the event handler function signature
 */
type LegendQueriedDelegate = EventDelegateBase<AbstractGVLayer, LegendQueriedEvent, void>;

/**
 * Define a delegate for the event handler function signature
 */
type LayerFilterAppliedDelegate = EventDelegateBase<AbstractGVLayer, LayerFilterAppliedEvent, void>;

/**
 * Define an event for the delegate
 */
export type LayerFilterAppliedEvent = {
  // The filter
  filter: string;
};

/**
 * Define a delegate for the event handler function signature
 */
type IndividualLayerLoadedDelegate = EventDelegateBase<AbstractGVLayer, IndividualLayerLoadedEvent, void>;

/**
 * Define an event for the delegate
 */
export type IndividualLayerLoadedEvent = {
  // The loaded layer
  layerPath: string;
};

/**
 * Define a delegate for the event handler function signature
 */
type LayerMessageDelegate = EventDelegateBase<AbstractGVLayer, LayerMessageEvent, void>;

/**
 * Define an event for the delegate
 */
export type LayerMessageEvent = {
  // The loaded layer
  messageKey: string;
  messageParams: string[];
  messageType: SnackbarType;
  notification: boolean;
};
