import type { ImageArcGISRest } from 'ol/source';
import type { Geometry } from 'ol/geom';
import type { Options as ImageOptions } from 'ol/layer/BaseImage';
import type { Coordinate } from 'ol/coordinate';
import { Image as ImageLayer } from 'ol/layer';
import type { Extent } from 'ol/extent';
import { Feature } from 'ol';
import type { Projection as OLProjection } from 'ol/proj';
import type { Map as OLMap } from 'ol';

import { GeoUtilities } from '@/geo/utils/utilities';
import { Projection } from '@/geo/utils/projection';
import { logger } from '@/core/utils/logger';
import { Fetch } from '@/core/utils/fetch-helper';
import type { EsriImageLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/esri-image-layer-entry-config';
import type {
  codedValueType,
  rangeDomainType,
  TypeFeatureInfoEntry,
  TypeFieldEntry,
  TypeIconSymbolVectorConfig,
  TypeLayerStyleConfig,
  TypeLayerStyleConfigInfo,
  TypeLayerStyleSettings,
  TypeOutfieldsType,
} from '@/api/types/map-schema-types';
import { CONST_LAYER_TYPES, type TypeLayerMetadataEsri } from '@/api/types/layer-schema-types';
import type { GeometryJson } from '@/geo/layer/gv-layers/utils';
import { GeoviewRenderer } from '@/geo/utils/renderer/geoview-renderer';
import { AbstractGVRaster } from '@/geo/layer/gv-layers/raster/abstract-gv-raster';
import type { TypeLegend } from '@/core/stores/store-interface-and-intial-values/layer-state';
import { GVWMS } from '@/geo/layer/gv-layers/raster/gv-wms';
import type { LayerFilters } from '@/geo/layer/gv-layers/layer-filters';
import type { TypeMetadataEsriRasterFunctionInfos } from '@/api/types/layer-schema-types';
import { GeometryApi } from '@/geo/layer/geometry/geometry';

/**
 * Manages an Esri Image layer.
 *
 * @exports
 * @class GVEsriImage
 */
export class GVEsriImage extends AbstractGVRaster {
  /** The currently active raster function id */
  #rasterFunction?: string;

  /** The cache of image previews for the different raster functions */
  #rasterFunctionPreviewCache = new Map<string, string>();

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
   * @returns {Promise<TypeLegend | null>} The legend of the layer or null.
   * @override
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
   * @param {TypeLegend} legend - The legend type
   * @returns {void}
   * @override
   */
  override onSetStyleAccordingToLegend(legend: TypeLegend): void {
    // Set the style
    this.setStyle(legend.styleConfig!);
  }

  /**
   * Overrides the way to get the bounds for this layer type.
   * @param projection - The projection to get the bounds into.
   * @param stops - The number of stops to use to generate the extent.
   * @returns A promise of layer bounding box.
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
   * @param {LayerFilters} [filter] - An optional filter to be used in place of the getViewFilter value.
   * @returns {void}
   * @override
   */
  protected override onSetLayerFilters(filter?: LayerFilters): void {
    // Process the layer filtering using the static method shared between EsriImage and WMS
    GVWMS.applyViewFilterOnSource(this.getLayerConfig(), this.getOLSource(), filter);
  }

  /**
   * Overrides the return of feature information at a given coordinate.
   * @param {OLMap} map - The Map where to get Feature Info At Coordinate from.
   * @param {Coordinate} location - The coordinate that will be used by the query.
   * @param {boolean} queryGeometry - Whether to include geometry in the query, default is true.
   * @param {AbortController?} [abortController] - The optional abort controller.
   * @returns {Promise<TypeFeatureInfoEntry[]>} A promise of an array of TypeFeatureInfoEntry[].
   */
  protected override getFeatureInfoAtCoordinate(
    map: OLMap,
    location: Coordinate,
    queryGeometry: boolean = true
  ): Promise<TypeFeatureInfoEntry[]> {
    // Transform coordinate from map projection to lntlat
    const projCoordinate = Projection.transformToLonLat(location, map.getView().getProjection());

    // Redirect to getFeatureInfoAtLonLat
    return this.getFeatureInfoAtLonLat(map, projCoordinate, queryGeometry);
  }

  /**
   * Overrides the return of feature information at the provided long lat coordinate.
   * @param {OLMap} map - The Map where to get Feature Info At LonLat from.
   * @param {Coordinate} lonlat - The coordinate that will be used by the query.
   * @param {boolean} queryGeometry - Whether to include geometry in the query, default is true.
   * @param {AbortController?} [abortController] - The optional abort controller.
   * @returns {Promise<TypeFeatureInfoEntry[]>} A promise of an array of TypeFeatureInfoEntry[].
   * @throws {LayerDataAccessPathMandatoryError} When the Data Access Path was undefined, likely because initDataAccessPath wasn't called.
   */
  protected override async getFeatureInfoAtLonLat(
    map: OLMap,
    lonlat: Coordinate,
    queryGeometry: boolean = true
  ): Promise<TypeFeatureInfoEntry[]> {
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

    // Build rendering rules parameter if raster function is active
    let renderingRulesParam = '';
    if (this.#rasterFunction) {
      renderingRulesParam = `&renderingRules=${encodeURIComponent(JSON.stringify([{ rasterFunction: this.#rasterFunction }]))}`;
    }

    // Get source parameters for time and mosaic rule
    const sourceParams = this.getOLSource().getParams();

    // Build time parameter if available from source
    const timeParam = sourceParams?.time ? `&time=${this.getOLSource().getParams().time}` : '';

    // Build mosaic rule parameter if available from source (critical for processedValues)
    let mosaicRuleParam = '';
    if (sourceParams?.mosaicRule) {
      mosaicRuleParam = `&mosaicRule=${encodeURIComponent(JSON.stringify(sourceParams.mosaicRule))}`;
    }

    // Construct the identify URL
    const identifyUrl =
      `${layerConfig.getMetadataAccessPath()}/identify?f=json` +
      `&geometryType=esriGeometryPoint` +
      `&geometry=${geometryParam}` +
      `${mosaicRuleParam}` +
      `${renderingRulesParam}` +
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
      return [];
    }

    // Build feature properties starting with pixel-specific fields
    const properties: Record<string, unknown> = {
      // Put pixel value first so it appears at top of details
      PixelValue: identifyJsonResponse.value,
      Name: identifyJsonResponse.name || 'Pixel',
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
    const arrayOfFeatureInfoEntries = this.formatFeatureInfoResult([feature]);

    return arrayOfFeatureInfoEntries;
  }

  /**
   * Overrides the return of the field type from the metadata. If the type can not be found, return 'string'.
   * @param {string} fieldName - The field name for which we want to get the type.
   * @returns {TypeOutfieldsType} The type of the field.
   * @override
   */
  protected override onGetFieldType(fieldName: string): TypeOutfieldsType {
    // Handle special ESRI Image pixel fields
    const lowerFieldName = fieldName.toLowerCase();

    // Pixel-specific fields
    if (lowerFieldName === 'pixelvalue' || lowerFieldName === 'processedvalue') {
      return 'string';
    }

    if (lowerFieldName === 'name') {
      return 'string';
    }

    // Check catalog item fields from metadata
    const metadata = this.getLayerConfig().getServiceMetadata() as TypeLayerMetadataEsri;

    if (metadata?.fields) {
      const field = metadata.fields.find((f) => f.name.toLowerCase() === lowerFieldName);
      if (field) {
        // Map ESRI field types to our types
        switch (field.type) {
          case 'esriFieldTypeSmallInteger':
          case 'esriFieldTypeInteger':
          case 'esriFieldTypeOID':
            return 'number';
          case 'esriFieldTypeSingle':
          case 'esriFieldTypeDouble':
            return 'number';
          case 'esriFieldTypeDate':
            return 'date';
          case 'esriFieldTypeString':
          case 'esriFieldTypeGeometry':
          default:
            return 'string';
        }
      }
    }

    // Default to string for unknown fields
    return 'string';
  }

  /**
   * Overrides the return of the domain of the specified field.
   * @param {string} fieldName - The field name for which we want to get the domain.
   * @returns {null | codedValueType | rangeDomainType} The domain of the field.
   * @override
   */
  protected override onGetFieldDomain(fieldName: string): null | codedValueType | rangeDomainType {
    // Get metadata
    const metadata = this.getLayerConfig().getServiceMetadata() as TypeLayerMetadataEsri;

    // If no fields in metadata, return null
    if (!metadata?.fields) return null;

    // Find the field
    const field = metadata.fields.find((f) => f.name.toLowerCase() === fieldName.toLowerCase());

    // Return the domain if found
    return field?.domain || null;
  }

  /**
   * Overrides the formatting of feature info results to skip icon rendering for pixel-based queries.
   * ESRI Image layers return pixel values, not symbolized features, so we skip the icon source step.
   * @param {Feature[]} features - The array of features to format.
   * @returns {TypeFeatureInfoEntry[]} The formatted feature info entries.
   * @override
   * @protected
   */
  protected override formatFeatureInfoResult(features: Feature[]): TypeFeatureInfoEntry[] {
    // Get the legend from the layer
    const legend = this.getLegend();
    // Get class index from feature property set in getFeatureInfoAtLonLat
    const classIndex = features[0]?.get('classIndex');

    // Extract legend items from the style config
    // For ESRI Image, the legend.styleConfig contains the Point symbols array
    const styleConfig = legend?.styleConfig;
    const legendSettings = styleConfig?.Point;
    const legendItems = legendSettings?.info;

    // Access the canvas array for RGB extraction (legend.legend is the raw ESRI legend data)
    // Type guard: check if legend.legend is an object (not HTMLCanvasElement) before accessing Point
    const legendCanvases =
      legend?.legend && typeof legend.legend === 'object' && !(legend.legend instanceof HTMLCanvasElement)
        ? legend.legend?.Point?.arrayOfCanvas
        : undefined;

    return features.map((feature, featureId) => {
      // Build field info from feature properties
      const properties = feature.getProperties();
      const fieldInfo: Record<string, TypeFieldEntry> = {};

      // Find the matching legend icon based on processedValue (0-indexed into the legend items array)
      let featureIcon: string | undefined;
      if (legendItems && Array.isArray(legendItems) && classIndex !== undefined && classIndex >= 0 && classIndex < legendItems.length) {
        // Convert base64 src to data URI format if needed
        const iconSettings = legendItems[classIndex]?.settings as TypeIconSymbolVectorConfig;
        const iconSrc = iconSettings?.src;
        featureIcon = iconSrc ? `data:image/png;base64,${iconSrc}` : undefined;

        // Extract RGB values from the canvas if available
        if (legendCanvases && Array.isArray(legendCanvases) && classIndex < legendCanvases.length) {
          const canvas = legendCanvases[classIndex];
          if (canvas instanceof HTMLCanvasElement) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
              // Get pixel data from center of canvas (5,5) to avoid border
              const imageData = ctx.getImageData(5, 5, 1, 1);
              const r = imageData.data[0];
              const g = imageData.data[1];
              const b = imageData.data[2];
              const a = imageData.data[3];

              // Add RGB values FIRST to fieldInfo
              fieldInfo.R = {
                fieldKey: 0,
                value: r,
                dataType: 'number',
                domain: null,
                alias: 'R',
              };
              fieldInfo.G = {
                fieldKey: 1,
                value: g,
                dataType: 'number',
                domain: null,
                alias: 'G',
              };
              fieldInfo.B = {
                fieldKey: 2,
                value: b,
                dataType: 'number',
                domain: null,
                alias: 'B',
              };
              fieldInfo.A = {
                fieldKey: 3,
                value: a,
                dataType: 'number',
                domain: null,
                alias: 'A',
              };
            }
          }
        }
      }

      // Process each property as a field
      Object.keys(properties).forEach((fieldName, fieldId) => {
        // Skip geometry property
        if (fieldName === 'geometry') return;

        const value = properties[fieldName];
        const fieldType = this.getFieldType(fieldName);
        const domain = this.onGetFieldDomain(fieldName);

        fieldInfo[fieldName] = {
          fieldKey: fieldId + 4, // +4 to account for R,G,B,A fields added first
          value,
          dataType: fieldType,
          domain,
          alias: fieldName,
        };
      });

      const featureInfo: TypeFeatureInfoEntry = {
        featureKey: featureId,
        geoviewLayerType: CONST_LAYER_TYPES.ESRI_IMAGE,
        layerPath: this.getLayerPath(),
        featureIcon,
        nameField: 'PixelValue',
        extent: feature.getGeometry()?.getExtent(),
        geometry: feature.getGeometry(),
        fieldInfo,
        feature,
        uid: feature.getId()?.toString() || `${this.getLayerPath()}-${featureId}`, // Ensure uid exists
        supportZoomTo: !!feature.getGeometry()?.getExtent(),
      };
      return featureInfo;
    });
  }

  // #endregion OVERRIDES

  // #region METHODS

  /**
   * Gets the list of rasterFunctionInfos that are available in the ImageServer
   * @returns {TypeMetadataEsriRasterFunctionInfo[]} The ImageServer's rasterFunctionInfos
   */
  getMetadataRasterFunctionInfos(): TypeMetadataEsriRasterFunctionInfos[] | undefined {
    return this.getLayerConfig().getRasterFunctionInfos();
  }

  /**
   * Gets the currently active raster function identifier.
   * @returns {string | undefined} The raster function identifier
   */
  getRasterFunction(): string | undefined {
    return this.#rasterFunction;
  }

  /**
   * Updates the raster function for the layer
   * @param {string | undefined} rasterFunctionId - The raster function ID to apply
   * @returns {void}
   */
  updateRasterFunction(rasterFunctionId: string | undefined): void {
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
  }

  /**
   * Gets individual preview promises for each raster function
   * @param {number} [size=400] - The size of the preview image (width and height)
   * @returns {Map<string, Promise<string>>} Map of raster function names to preview promises
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

  // #endregion METHODS
}

// Exported for use in ESRI Dynamic raster layers
export type TypeEsriImageLayerLegend = {
  layers: TypeEsriImageLayerLegendLayer[];
};

export type TypeEsriImageLayerLegendLayer = {
  layerId: number | string;
  layerName: string;
  layerType: string;
  minScale: number;
  maxScale: number;
  legendType: string;
  legend: TypeEsriImageLayerLegendLayerLegend[];
};

export type TypeEsriImageLayerLegendLayerLegend = {
  label: string;
  url: string;
  imageData: string;
  contentType: string;
  height: number;
  width: number;
  values: string[];
};

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
