import type { ImageArcGISRest } from 'ol/source';
import type { Geometry } from 'ol/geom';
import type { Options as ImageOptions } from 'ol/layer/BaseImage';
import type { Coordinate } from 'ol/coordinate';
import { Image as ImageLayer } from 'ol/layer';
import type { Extent } from 'ol/extent';
import { Feature } from 'ol';
import type { Projection as OLProjection } from 'ol/proj';
import type { Map as OLMap } from 'ol';

import type { EventDelegateBase } from '@/api/events/event-helper';
import EventHelper from '@/api/events/event-helper';
import { GeoUtilities } from '@/geo/utils/utilities';
import { Projection } from '@/geo/utils/projection';
import { logger } from '@/core/utils/logger';
import { Fetch } from '@/core/utils/fetch-helper';
import type { EsriImageLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/esri-image-layer-entry-config';
import type {
  TypeFeatureInfoEntry,
  TypeFeatureInfoResult,
  TypeFieldEntry,
  TypeIconSymbolVectorConfig,
  TypeLayerStyleConfig,
  TypeLayerStyleConfigInfo,
  TypeLayerStyleSettings,
} from '@/api/types/map-schema-types';
import { CONST_LAYER_TYPES } from '@/api/types/layer-schema-types';
import type { TypeMetadataEsriRasterFunctionInfos, TypeMosaicRule } from '@/api/types/layer-schema-types';
import type { TypeLegend } from '@/core/stores/store-interface-and-intial-values/layer-state';
import type { TemporalMode } from '@/core/utils/date-mgt';
import type { GeometryJson } from '@/geo/layer/gv-layers/utils';
import { GeoviewRenderer } from '@/geo/utils/renderer/geoview-renderer';
import type { LayerBaseEvent } from '@/geo/layer/gv-layers/abstract-base-layer';
import { AbstractGVRaster } from '@/geo/layer/gv-layers/raster/abstract-gv-raster';
import { GVWMS } from '@/geo/layer/gv-layers/raster/gv-wms';
import type { LayerFilters } from '@/geo/layer/gv-layers/layer-filters';
import { GeometryApi } from '@/geo/layer/geometry/geometry';

/**
 * Manages an Esri Image layer.
 */
export class GVEsriImage extends AbstractGVRaster {
  /** The currently active raster function id */
  #rasterFunction?: string;

  /** The cache of image previews for the different raster functions */
  #rasterFunctionPreviewCache = new Map<string, string>();

  /** The currently active mosaic rule */
  #mosaicRule?: TypeMosaicRule;

  /** Callback delegates for the raster function changed event */
  #onRasterFunctionChangedHandlers: RasterFunctionChangedDelegate[] = [];

  /** Callback delegates for the mosaic rule changed event */
  #onMosaicRuleChangedHandlers: MosaicRuleChangedDelegate[] = [];

  /**
   * Constructs a GVEsriImage layer to manage an OpenLayer layer.
   *
   * @param olSource - The OpenLayer source.
   * @param layerConfig - The layer configuration.
   */
  constructor(olSource: ImageArcGISRest, layerConfig: EsriImageLayerEntryConfig) {
    super(olSource, layerConfig);

    // Initialize the active raster function from config's initial value
    this.#rasterFunction = layerConfig.getInitialRasterFunction();
    this.#mosaicRule = layerConfig.getInitialMosaicRule();

    // Create the image layer options.
    const imageLayerOptions: ImageOptions<ImageArcGISRest> = {
      source: olSource,
      properties: { layerConfig },
    };

    // Init the layer options with initial settings
    AbstractGVRaster.initOptionsWithInitialSettings(imageLayerOptions, layerConfig);

    // Create and set the OpenLayer layer
    this.setOLLayer(new ImageLayer(imageLayerOptions));
  }

  // #region OVERRIDES

  /**
   * Overrides the parent method to return a more specific OpenLayers layer type (covariant return).
   *
   * @returns The strongly-typed OpenLayers type.
   */
  override getOLLayer(): ImageLayer<ImageArcGISRest> {
    // Call parent and cast
    return super.getOLLayer() as ImageLayer<ImageArcGISRest>;
  }

  /**
   * Overrides the parent class's method to return a more specific OpenLayers source type (covariant return).
   *
   * @returns The ImageArcGISRest source instance associated with this layer.
   */
  override getOLSource(): ImageArcGISRest {
    // Get source from OL
    return super.getOLSource() as ImageArcGISRest;
  }

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   *
   * @returns The strongly-typed layer configuration specific to this layer.
   */
  override getLayerConfig(): EsriImageLayerEntryConfig {
    // Call parent and cast
    return super.getLayerConfig() as EsriImageLayerEntryConfig;
  }

  /**
   * Overrides the fetching of the legend for an Esri image layer.
   *
   * @returns A promise that resolves with the legend of the layer or null
   */
  override async onFetchLegend(): Promise<TypeLegend | null> {
    const layerConfig = this.getLayerConfig();
    try {
      if (!layerConfig) return null;

      // Build legend URL with optional raster function
      let legendUrl = `${layerConfig.getMetadataAccessPath()}/legend?f=json`;
      const rasterFunction = this.#rasterFunction;
      if (rasterFunction) {
        const renderingRule = encodeURIComponent(JSON.stringify({ rasterFunction }));
        legendUrl += `&renderingRule=${renderingRule}`;
      }

      const mosaicRule = this.#mosaicRule;
      if (mosaicRule) {
        legendUrl += `&mosaicRule=${encodeURIComponent(JSON.stringify(mosaicRule))}`;
      }

      const legendJson = await Fetch.fetchEsriJson<TypeEsriImageLayerLegend>(legendUrl);
      let legendInfo;
      if (legendJson.layers && legendJson.layers.length === 1) {
        legendInfo = legendJson.layers[0].legend;
      } else if (legendJson.layers.length) {
        const layerInfo = legendJson.layers.find((layer) => Number(layer.layerId) === Number(layerConfig.layerId));
        if (layerInfo) legendInfo = layerInfo.legend;
      }
      if (!legendInfo) {
        const legend: TypeLegend = {
          type: CONST_LAYER_TYPES.ESRI_IMAGE,
          styleConfig: this.getStyle(),
          legend: null,
        };
        return legend;
      }
      const uniqueValueStyleInfo: TypeLayerStyleConfigInfo[] = [];
      legendInfo.forEach((info) => {
        const styleInfo: TypeLayerStyleConfigInfo = {
          label: info.label,
          visible: layerConfig.getInitialSettings()?.states?.visible ?? true, // default: true
          values: info.label.split(','),
          settings: {
            type: 'iconSymbol',
            mimeType: info.contentType,
            src: info.imageData,
            width: info.width,
            height: info.height,
          } as TypeIconSymbolVectorConfig,
        };
        uniqueValueStyleInfo.push(styleInfo);
      });
      const styleSettings: TypeLayerStyleSettings = {
        type: 'uniqueValue',
        fields: ['default'],
        hasDefault: false,
        info: uniqueValueStyleInfo,
      };
      const styleConfig: TypeLayerStyleConfig = {
        Point: styleSettings,
      };

      const legend: TypeLegend = {
        type: CONST_LAYER_TYPES.ESRI_IMAGE,
        styleConfig,
        legend: await GeoviewRenderer.getLegendStyles(styleConfig),
      };

      return legend;
    } catch (error: unknown) {
      logger.logError(`Get Legend for ${layerConfig.layerPath} error`, error);
      return null;
    }
  }

  /**
   * Overrides when the style should be set by the fetched legend.
   *
   * @param legend - The legend type
   */
  override onSetStyleAccordingToLegend(legend: TypeLegend): void {
    // Set the style
    this.setStyle(legend.styleConfig!);
  }

  /**
   * Overrides the way to get the bounds for this layer type.
   *
   * @param projection - The projection to get the bounds into.
   * @param stops - The number of stops to use to generate the extent.
   * @returns A promise that resolves with the layer bounding box or undefined when not found
   */
  override onGetBounds(projection: OLProjection, stops: number): Promise<Extent | undefined> {
    // Get the metadata projection
    const metadataProjection = this.getMetadataProjection();

    // Get the metadata extent
    let metadataExtent = this.getMetadataExtent();

    // If both found
    if (metadataExtent && metadataProjection) {
      // Transform extent to given projection
      metadataExtent = Projection.transformExtentFromProj(metadataExtent, metadataProjection, projection, stops);
      metadataExtent = GeoUtilities.validateExtent(metadataExtent, projection.getCode());
    }

    // Return the calculated layer bounds
    return Promise.resolve(metadataExtent);
  }

  /**
   * Overrides the way a WMS layer applies a view filter. It does so by updating the source TIME parameters.
   *
   * @param filter - An optional filter to be used in place of the getViewFilter value.
   */
  protected override onSetLayerFilters(filter?: LayerFilters): void {
    // Process the layer filtering using the static method shared between EsriImage and WMS
    GVWMS.applyViewFilterOnSource(this.getLayerConfig(), this.getOLSource(), filter);
  }

  /**
   * Overrides the return of feature information at a given coordinate.
   *
   * @param map - The Map where to get Feature Info At Coordinate from.
   * @param location - The coordinate that will be used by the query.
   * @param queryGeometry - Whether to include geometry in the query, default is true.
   * @returns A promise that resolves with the feature info result
   */
  protected override getFeatureInfoAtCoordinate(
    map: OLMap,
    location: Coordinate,
    queryGeometry: boolean = true
  ): Promise<TypeFeatureInfoResult> {
    // Transform coordinate from map projection to lntlat
    const projCoordinate = Projection.transformToLonLat(location, map.getView().getProjection());

    // Redirect to getFeatureInfoAtLonLat
    return this.getFeatureInfoAtLonLat(map, projCoordinate, queryGeometry);
  }

  /**
   * Overrides the return of feature information at the provided long lat coordinate.
   *
   * @param map - The Map where to get Feature Info At LonLat from.
   * @param lonlat - The coordinate that will be used by the query.
   * @param queryGeometry - Optional, whether to include geometry in the query, default is true.
   * @returns A promise that resolves with the feature info result
   */
  protected override async getFeatureInfoAtLonLat(
    map: OLMap,
    lonlat: Coordinate,
    queryGeometry: boolean = true
  ): Promise<TypeFeatureInfoResult> {
    const featureInfoResult: TypeFeatureInfoResult = { results: [] };

    // If invisible or not queryable, return empty result
    if (!this.getVisible() || !this.getLayerConfig().getQueryableSourceDefaulted()) {
      return featureInfoResult;
    }

    // Get the layer config
    const layerConfig = this.getLayerConfig();

    // Get map projection number
    const mapView = map.getView();
    const mapProjection = mapView.getProjection();
    const mapProjNumber = parseInt(mapProjection.getCode()?.split(':')[1] || '', 10);

    // Transform lonlat to map projection for the geometry parameter
    const mapCoordinate = Projection.transformFromLonLat(lonlat, mapProjection);

    // Build geometry parameter
    const geometryParam = encodeURIComponent(
      JSON.stringify({
        spatialReference: { wkid: mapProjNumber },
        x: mapCoordinate[0],
        y: mapCoordinate[1],
      })
    );

    // Build pixel size parameter (use map resolution)
    const resolution = mapView.getResolution() || 1;
    const pixelSizeParam = encodeURIComponent(
      JSON.stringify({
        spatialReference: { wkid: mapProjNumber },
        x: resolution,
        y: resolution,
      })
    );

    // Get source parameters for time and mosaic rule
    const sourceParams = this.getOLSource().getParams();

    // Build time parameter if available from source
    const timeParam = sourceParams?.TIME ? `&TIME=${this.getOLSource().getParams().TIME}` : '';

    // Build rendering rules parameter if raster function is active
    let renderingRulesParam = '';
    if (this.#rasterFunction) {
      renderingRulesParam = `&renderingRules=${encodeURIComponent(JSON.stringify([{ rasterFunction: this.#rasterFunction }]))}`;
    }

    // Build mosaic rule parameter if available from source (critical for processedValues)
    let mosaicRuleParam = '';
    if (sourceParams?.mosaicRule) {
      mosaicRuleParam = `&mosaicRule=${encodeURIComponent(JSON.stringify(this.#mosaicRule))}`;
    }

    // Construct the identify URL
    const identifyUrl =
      `${layerConfig.getMetadataAccessPath()}/identify?f=json` +
      `&geometryType=esriGeometryPoint` +
      `&geometry=${geometryParam}` +
      `${renderingRulesParam}` +
      `${mosaicRuleParam}` +
      `&pixelSize=${pixelSizeParam}` +
      `&returnGeometry=${queryGeometry}` +
      `&returnCatalogItems=true` +
      `&returnPixelValues=true` +
      `&maxItemCount=1` +
      `${timeParam}` +
      `&processAsMultidimensional=false`;

    // Fetch the identify response
    const identifyJsonResponse = await Fetch.fetchEsriJson<EsriImageIdentifyJsonResponse>(identifyUrl);

    // If no pixel value returned
    if (identifyJsonResponse.value === undefined || identifyJsonResponse.value === null || identifyJsonResponse.value === 'NoData') {
      return featureInfoResult;
    }

    // Build feature properties starting with pixel-specific fields
    const properties: Record<string, unknown> = {
      // Put pixel value first so it appears at top of details
      PixelValue: identifyJsonResponse.value,
      PixelName: identifyJsonResponse.name || 'Pixel',
    };

    // Determine the legend class index from processedValues
    let classIndex: number | undefined;
    if (identifyJsonResponse.processedValues?.[0] !== undefined && identifyJsonResponse.processedValues[0] !== 'NoData') {
      classIndex = parseInt(String(identifyJsonResponse.processedValues[0]), 10);
      properties.ProcessedValue = identifyJsonResponse.processedValues[0];
    }

    // Add catalog item attributes if available
    if (identifyJsonResponse.catalogItems?.features?.[0]?.attributes) {
      const catalogAttributes = identifyJsonResponse.catalogItems.features[0].attributes;
      Object.assign(properties, catalogAttributes);
    }

    // Create geometry if available and requested
    let geometry: Geometry | undefined;
    if (queryGeometry && identifyJsonResponse.location) {
      const locationGeom = identifyJsonResponse.location;
      geometry = GeometryApi.createGeometryFromType('Point', [locationGeom.x, locationGeom.y]);
    }

    // Create a feature with the properties
    const feature = new Feature({ ...properties, geometry });
    feature.set('classIndex', classIndex);

    // Format and return the result
    featureInfoResult.results = this.formatFeatureInfoResult(
      [feature],
      layerConfig,
      layerConfig.getServiceDateFormat(),
      layerConfig.getServiceDateTimezone(),
      layerConfig.getServiceDateTemporalMode()
    );
    return featureInfoResult;
  }

  /**
   * Overrides the formatting of feature info results to skip icon rendering for pixel-based queries.
   *
   * ESRI Image layers return pixel values, not symbolized features, so we skip the icon source step.
   *
   * @param features - The array of features to format
   * @param layerConfig - The layer configuration
   * @param serviceDateFormat - Optional date format used by the service
   * @param serviceDateIANA - Optional IANA time zone identifier used by the service
   * @param serviceDateTemporalMode - Optional temporal mode for date handling
   * @returns The formatted feature info entries
   */
  protected override formatFeatureInfoResult(
    features: Feature[],
    layerConfig: EsriImageLayerEntryConfig,
    serviceDateFormat: string | undefined,
    serviceDateIANA: string | undefined,
    serviceDateTemporalMode: TemporalMode | undefined
  ): TypeFeatureInfoEntry[] {
    // Extract ESRI Image-specific properties BEFORE parent processing
    const esriImageData = features.map((feature) => ({
      pixelValue: feature.get('PixelValue'),
      pixelName: feature.get('PixelName'),
      processedValue: feature.get('ProcessedValue'),
      classIndex: feature.get('classIndex'),
    }));

    // Call parent to get base formatting
    const baseResults = super.formatFeatureInfoResult(features, layerConfig, serviceDateFormat, serviceDateIANA, serviceDateTemporalMode);

    // Get legend data for RGBA extraction and icon assignment
    const legend = this.getLegend();
    const styleConfig = legend?.styleConfig;
    const legendSettings = styleConfig?.Point;
    const legendItems = legendSettings?.info;

    // Access canvas array for RGBA extraction
    const legendCanvases =
      legend?.legend && typeof legend.legend === 'object' && !(legend.legend instanceof HTMLCanvasElement)
        ? legend.legend?.Point?.arrayOfCanvas
        : undefined;

    // Enhance each result with ESRI Image-specific data
    return baseResults.map((result, index) => {
      const imageData = esriImageData[index];
      const { classIndex } = imageData;

      // Add feature icon if we have a matching legend item
      if (legendItems && Array.isArray(legendItems) && classIndex !== undefined && classIndex >= 0 && classIndex < legendItems.length) {
        const iconSettings = legendItems[classIndex]?.settings as TypeIconSymbolVectorConfig;
        const iconSrc = iconSettings?.src;
        // eslint-disable-next-line no-param-reassign
        result.featureIcon = iconSrc ? `data:image/png;base64,${iconSrc}` : undefined;
      }

      // Build new fieldInfo with ESRI Image fields first
      const newFieldInfo: Record<string, TypeFieldEntry> = {};
      let fieldKey = 0;

      // Add RGBA values if available
      if (legendCanvases && Array.isArray(legendCanvases) && classIndex !== undefined && classIndex < legendCanvases.length) {
        const canvas = legendCanvases[classIndex];
        if (canvas instanceof HTMLCanvasElement) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            const imageDataPixel = ctx.getImageData(5, 5, 1, 1);
            const r = imageDataPixel.data[0];
            const g = imageDataPixel.data[1];
            const b = imageDataPixel.data[2];
            const a = imageDataPixel.data[3];

            newFieldInfo.R = {
              fieldKey: fieldKey++,
              value: r,
              dataType: 'number',
              alias: 'R',
            };
            newFieldInfo.G = {
              fieldKey: fieldKey++,
              value: g,
              dataType: 'number',
              alias: 'G',
            };
            newFieldInfo.B = {
              fieldKey: fieldKey++,
              value: b,
              dataType: 'number',
              alias: 'B',
            };
            newFieldInfo.A = {
              fieldKey: fieldKey++,
              value: a,
              dataType: 'number',
              alias: 'A',
            };
          }
        }
      }

      // Add pixel-specific fields
      if (imageData.pixelValue !== undefined && imageData.pixelValue) {
        newFieldInfo.PixelValue = {
          fieldKey: fieldKey++,
          value: imageData.pixelValue,
          dataType: 'string',
          alias: 'Pixel Value',
        };
      }

      if (imageData.pixelName !== undefined && imageData.pixelName) {
        newFieldInfo.PixelName = {
          fieldKey: fieldKey++,
          value: imageData.pixelName,
          dataType: 'string',
          alias: 'Pixel Name',
        };
      }

      if (imageData.processedValue !== undefined && imageData.processedValue) {
        newFieldInfo.ProcessedValue = {
          fieldKey: fieldKey++,
          value: imageData.processedValue,
          dataType: 'string',
          alias: 'Processed Value',
        };
      }

      // Add existing fields from parent with updated keys
      Object.entries(result.fieldInfo).forEach(([fieldName, fieldEntry]) => {
        if (!fieldEntry) return;
        newFieldInfo[fieldName] = {
          ...fieldEntry,
          fieldKey: fieldKey++,
        };
      });

      // eslint-disable-next-line no-param-reassign
      result.fieldInfo = newFieldInfo;
      // eslint-disable-next-line no-param-reassign
      result.nameField = 'PixelValue';

      return result;
    });
  }

  // #endregion OVERRIDES

  // #region METHODS

  /**
   * Gets the list of rasterFunctionInfos that are available in the ImageServer
   *
   * @returns The ImageServer's rasterFunctionInfos or undefined when not available
   */
  getMetadataRasterFunctionInfos(): TypeMetadataEsriRasterFunctionInfos[] | undefined {
    return this.getLayerConfig().getRasterFunctionInfos();
  }

  /**
   * Gets the currently active raster function identifier.
   *
   * @returns The raster function identifier or undefined when not set
   */
  getRasterFunction(): string | undefined {
    return this.#rasterFunction;
  }

  /**
   * Updates the raster function for the layer
   *
   * @param rasterFunctionId - The raster function ID to apply
   */
  setRasterFunction(rasterFunctionId: string | undefined): void {
    // Update the config
    this.#rasterFunction = rasterFunctionId;

    // Prepare the renderingRule / rasterFunction parameter
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const params: Record<string, any> = {};
    if (rasterFunctionId) {
      params.renderingRule = JSON.stringify({ rasterFunction: rasterFunctionId });
    }

    // Update the OpenLayers source
    this.getOLSource().updateParams(params);

    // Emit about it
    this.#emitRasterFunctionChanged({ functionId: rasterFunctionId });
  }

  /**
   * Gets individual preview promises for each raster function
   *
   * @param size - The size of the preview image (width and height)
   * @returns A map of raster function names to their preview image promises
   */
  getRasterFunctionPreviews(size: number = 400): Map<string, Promise<string>> {
    const promises = new Map<string, Promise<string>>();
    const rasterFunctionInfos = this.getMetadataRasterFunctionInfos();
    const layerConfig = this.getLayerConfig();

    if (!rasterFunctionInfos || !layerConfig) return promises;

    const bounds = this.getMetadataExtent();
    if (!bounds) return promises;

    const baseUrl = layerConfig.getMetadataAccessPath();
    const bbox = bounds.join(',');

    rasterFunctionInfos.forEach((info) => {
      // Check cache first
      if (this.#rasterFunctionPreviewCache.has(info.name)) {
        promises.set(info.name, Promise.resolve(this.#rasterFunctionPreviewCache.get(info.name)!));
        return;
      }

      // Create individual promise
      const promise = (async () => {
        try {
          const renderingRule = encodeURIComponent(JSON.stringify({ rasterFunction: info.name }));
          const previewUrl = `${baseUrl}/exportImage?bbox=${bbox}&size=${size},${size}&f=image&renderingRule=${renderingRule}`;

          const response = await fetch(previewUrl);
          if (response.ok) {
            const blob = await response.blob();
            const base64 = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });

            // Cache the result
            this.#rasterFunctionPreviewCache.set(info.name, base64);
            return base64;
          }
          throw new Error('Failed to fetch');
        } catch (error) {
          logger.logWarning(`Failed to fetch preview for raster function ${info.name}`, error);
          throw error;
        }
      })();

      promises.set(info.name, promise);
    });

    return promises;
  }

  /**
   * Gets the current mosaic rule for the layer.
   *
   * @returns The current mosaic rule or undefined when not set
   */
  getMosaicRule(): TypeMosaicRule | undefined {
    return this.#mosaicRule;
  }

  /**
   * Sets the entire mosaicRule object and updates the OL source.
   *
   * @param mosaicRule - The new mosaicRule object
   */
  setMosaicRule(mosaicRule: TypeMosaicRule | undefined): void {
    this.#mosaicRule = mosaicRule;

    const olSource = this.getOLSource();
    const params = { ...olSource.getParams() };
    if (mosaicRule) {
      params.mosaicRule = JSON.stringify(mosaicRule);
    } else {
      delete params.mosaicRule;
    }
    olSource.updateParams(params);
    olSource.changed();

    // Emit about it
    this.#emitMosaicRuleChanged({ mosaicRule });
  }

  // #endregion METHODS

  // #region EVENTS

  /**
   * Emits a raster function changed event to all handlers.
   *
   * @param event - The event to emit
   */
  #emitRasterFunctionChanged(event: RasterFunctionChangedEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onRasterFunctionChangedHandlers, event);
  }

  /**
   * Registers a raster function changed event handler.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   * @returns The registered callback, which can be used to unregister the event handler later
   */
  onRasterFunctionChanged(callback: RasterFunctionChangedDelegate): RasterFunctionChangedDelegate {
    // Register the event handler
    return EventHelper.onEvent(this.#onRasterFunctionChangedHandlers, callback);
  }

  /**
   * Unregisters a raster function changed event handler.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offRasterFunctionChanged(callback: RasterFunctionChangedDelegate | undefined): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onRasterFunctionChangedHandlers, callback);
  }

  /**
   * Emits a mosaic rule changed event to all handlers.
   *
   * @param event - The event to emit
   */
  #emitMosaicRuleChanged(event: MosaicRuleChangedEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onMosaicRuleChangedHandlers, event);
  }

  /**
   * Registers a mosaic rule changed event handler.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   * @returns The registered callback, which can be used to unregister the event handler later
   */
  onMosaicRuleChanged(callback: MosaicRuleChangedDelegate): MosaicRuleChangedDelegate {
    // Register the event handler
    return EventHelper.onEvent(this.#onMosaicRuleChangedHandlers, callback);
  }

  /**
   * Unregisters a mosaic rule changed event handler.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offMosaicRuleChanged(callback: MosaicRuleChangedDelegate | undefined): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onMosaicRuleChangedHandlers, callback);
  }

  // #endregion EVENTS
}

/** Legend structure returned by the ESRI Image layer legend endpoint. */
export type TypeEsriImageLayerLegend = {
  layers: TypeEsriImageLayerLegendLayer[];
};

/** A single layer entry within an ESRI image legend response. */
export type TypeEsriImageLayerLegendLayer = {
  layerId: number | string;
  layerName: string;
  layerType: string;
  minScale: number;
  maxScale: number;
  legendType: string;
  legend: TypeEsriImageLayerLegendLayerLegend[];
};

/** A single legend entry (symbol) within an ESRI image legend layer. */
export type TypeEsriImageLayerLegendLayerLegend = {
  label: string;
  url: string;
  imageData: string;
  contentType: string;
  height: number;
  width: number;
  values: string[];
};

/** JSON response from the ESRI Image identify operation. */
export type EsriImageIdentifyJsonResponse = {
  objectId: number;
  name: string;
  value: string | number;
  location?: {
    x: number;
    y: number;
    spatialReference: {
      wkid: number;
      latestWkid?: number;
    };
  };
  properties?: {
    Values: string[];
  };
  catalogItems?: {
    objectIdFieldName: string;
    geometryType: string;
    spatialReference: {
      wkid: number;
      latestWkid?: number;
    };
    features: Array<{
      attributes: Record<string, unknown>;
      geometry?: GeometryJson;
    }>;
  };
  processedValues?: string[];
};

// #region EVENT DELEGATES

/**
 * Define an event for the delegate.
 */
export interface RasterFunctionChangedEvent extends LayerBaseEvent {
  /** The raster function identifier, or undefined when removed. */
  functionId: string | undefined;
}

/**
 * Define a delegate for the event handler function signature
 */
export type RasterFunctionChangedDelegate = EventDelegateBase<GVEsriImage, RasterFunctionChangedEvent, void>;

/**
 * Define an event for the delegate.
 */
export interface MosaicRuleChangedEvent extends LayerBaseEvent {
  /** The mosaic rule, or undefined when removed. */
  mosaicRule: TypeMosaicRule | undefined;
}

/**
 * Define a delegate for the event handler function signature.
 */
export type MosaicRuleChangedDelegate = EventDelegateBase<GVEsriImage, MosaicRuleChangedEvent, void>;

// #endregion EVENT DELEGATES
