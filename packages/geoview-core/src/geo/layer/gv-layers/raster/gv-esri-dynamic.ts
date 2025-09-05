import { ImageArcGISRest } from 'ol/source';
import { Image as ImageLayer } from 'ol/layer';
import { Options as ImageOptions } from 'ol/layer/BaseImage';
import { Coordinate } from 'ol/coordinate';
import { EsriJSON } from 'ol/format';
import { Extent } from 'ol/extent';
import Feature from 'ol/Feature';
import Geometry from 'ol/geom/Geometry';
import { Projection as OLProjection } from 'ol/proj';
import { Map as OLMap } from 'ol';

import { getMetersPerPixel, validateExtent } from '@/geo/utils/utilities';
import { Projection } from '@/geo/utils/projection';
import { logger } from '@/core/utils/logger';
import { Fetch } from '@/core/utils/fetch-helper';
import { EsriDynamicLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/esri-dynamic-layer-entry-config';
import {
  TypeLayerStyleSettings,
  TypeFeatureInfoEntry,
  rangeDomainType,
  codedValueType,
  TypeLayerStyleConfig,
  TypeLayerStyleConfigInfo,
  TypeOutfieldsType,
  TypeStyleGeometry,
  TypeValidMapProjectionCodes,
  TypeIconSymbolVectorConfig,
} from '@/api/config/types/map-schema-types';
import { CONST_LAYER_TYPES, TypeFeatureInfoLayerConfig, TypeLayerMetadataEsriExtent } from '@/api/config/types/layer-schema-types';
import { esriGetFieldType, esriGetFieldDomain, parseDateTimeValuesEsriDynamic, GeometryJson } from '@/geo/layer/gv-layers/utils';
import { AbstractGVRaster } from '@/geo/layer/gv-layers/raster/abstract-gv-raster';
import { getLegendStyles } from '@/geo/utils/renderer/geoview-renderer';
import { TypeLegend } from '@/core/stores/store-interface-and-intial-values/layer-state';
import { TypeEsriImageLayerLegend } from '@/geo/layer/gv-layers/raster/gv-esri-image';
import { FetchEsriWorkerPool } from '@/core/workers/fetch-esri-worker-pool';
import { QueryParams } from '@/core/workers/fetch-esri-worker-script';
import { GeometryApi } from '@/geo/layer/geometry/geometry';
import { NoExtentError, NoFeaturesPropertyError } from '@/core/exceptions/geoview-exceptions';
import { formatError, RequestAbortedError } from '@/core/exceptions/core-exceptions';
import { LayerDataAccessPathMandatoryError, LayerInvalidLayerFilterError } from '@/core/exceptions/layer-exceptions';
import { TypeDateFragments } from '@/core/utils/date-mgt';

type TypeFieldOfTheSameValue = { value: string | number | Date; nbOccurence: number };
type TypeQueryTree = { fieldValue: string | number | Date; nextField: TypeQueryTree }[];

/**
 * Manages an Esri Dynamic layer.
 *
 * @exports
 * @class GVEsriDynamic
 */
export class GVEsriDynamic extends AbstractGVRaster {
  #fetchWorkerPool: FetchEsriWorkerPool;

  // The default hit tolerance the query should be using
  static override DEFAULT_HIT_TOLERANCE: number = 7;

  // The default filter when all should be included
  static DEFAULT_FILTER_1EQUALS1: string = '(1=1)';

  /**
   * Constructs a GVEsriDynamic layer to manage an OpenLayer layer.
   * @param {ImageArcGISRest} olSource - The OpenLayer source.
   * @param {EsriDynamicLayerEntryConfig} layerConfig - The layer configuration.
   */
  public constructor(olSource: ImageArcGISRest, layerConfig: EsriDynamicLayerEntryConfig) {
    super(olSource, layerConfig);

    // TODO: Performance - Do we need worker pool or one worker per layer is enough. If a worker is already working we should terminate it
    // TO.DOCONT: and use the abort controller to cancel the fetch and start a new one. So every esriDynamic layer has it's own worker.
    // Setup the worker pool
    this.#fetchWorkerPool = new FetchEsriWorkerPool();
    this.#fetchWorkerPool
      .init()
      .then(() => logger.logTraceCore('Worker pool for fetch ESRI initialized'))
      .catch((error: unknown) => logger.logError('Worker pool error', error));

    // Register the worker message handler
    this.#fetchWorkerPool.addMessageHandler(this.#handleWorkerMessage.bind(this));

    // TODO: Performance - Investigate to see if we can call the export map for the whole service at once instead of making many call
    // TO.DOCONT: We can use the layers and layersDef parameters to set what should be visible.
    // TO.DOCONT: layers=show:layerId ; layerDefs={ "layerId": "layer def" }
    // TO.DOCONT: There is no allowableOffset on esri dynamic to speed up. We will need to see what can be done for layers in wrong projection
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

  /**
   * Overrides the fetching of the legend for an Esri Dynamic layer.
   * @override
   * @returns {Promise<TypeLegend | null>} The legend of the layer or null.
   */
  override async onFetchLegend(): Promise<TypeLegend | null> {
    const layerConfig = this.getLayerConfig();
    // Only raster layers need the alternate code
    if (layerConfig.getLayerMetadata()?.type !== 'Raster Layer') return super.onFetchLegend();

    try {
      if (!layerConfig) return null;
      const legendUrl = `${layerConfig.geoviewLayerConfig.metadataAccessPath}/legend?f=json`;
      const legendJson = await Fetch.fetchJson<TypeEsriImageLayerLegend>(legendUrl);

      let legendInfo;
      if (legendJson.layers && legendJson.layers.length === 1) {
        legendInfo = legendJson.layers[0].legend;
      } else if (legendJson.layers.length) {
        const layerInfo = legendJson.layers.find((layer) => layer.layerId.toString() === layerConfig.layerId);
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
          visible: layerConfig.initialSettings.states?.visible || true,
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
        legend: await getLegendStyles(this.getStyle()),
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
   * @override
   */
  override onSetStyleAccordingToLegend(legend: TypeLegend): void {
    // Set the style
    this.setStyle(legend.styleConfig!);
  }

  /**
   * Overrides the way to get the bounds for this layer type.
   * @param {OLProjection} projection - The projection to get the bounds into.
   * @param {number} stops - The number of stops to use to generate the extent.
   * @override
   * @returns {Extent | undefined} The layer bounding box.
   */
  override onGetBounds(projection: OLProjection, stops: number): Extent | undefined {
    // Get the metadata projection
    const metadataProjection = this.getMetadataProjection();

    // Get the metadata extent
    let metadataExtent = this.getMetadataExtent();

    // If both found
    if (metadataExtent && metadataProjection) {
      // Transform extent to given projection
      metadataExtent = Projection.transformExtentFromProj(metadataExtent, metadataProjection, projection, stops);
      metadataExtent = validateExtent(metadataExtent, projection.getCode());
    }

    // Return the calculated layer bounds
    return metadataExtent;
  }

  /**
   * Sends a query to get ESRI Dynamic feature geometries and calculates an extent from them.
   * @param {string[]} objectIds - The IDs of the features to calculate the extent from.
   * @param {OLProjection} outProjection - The output projection for the extent.
   * @param {string?} outfield - ID field to return for services that require a value in outfields.
   * @override
   * @returns {Promise<Extent>} The extent of the features, if available.
   */
  override async onGetExtentFromFeatures(objectIds: string[], outProjection: OLProjection, outfield?: string): Promise<Extent> {
    // Get url for service from layer entry config
    const layerEntryConfig = this.getLayerConfig();
    let baseUrl = layerEntryConfig.source.dataAccessPath;

    // If no base url
    if (!baseUrl) throw new LayerDataAccessPathMandatoryError(layerEntryConfig.layerPath, layerEntryConfig.getLayerNameCascade());

    // Construct query
    if (!baseUrl.endsWith('/')) baseUrl += '/';

    // Use the returnExtentOnly=true to get only the extent of ids
    // TODO: We should return a real extent geometry Projection.transformAndDensifyExtent
    const idString = objectIds.join('%2C');
    const outfieldQuery = outfield ? `&outFields=${outfield}` : '';
    const queryUrl = `${baseUrl}${layerEntryConfig.layerId}/query?&f=json&objectIds=${idString}${outfieldQuery}&returnExtentOnly=true`;

    // Fetch
    const responseJson = await Fetch.fetchEsriJson<EsriQueryJsonResponse>(queryUrl);
    const { extent } = responseJson;

    const projectionExtent: OLProjection | undefined = Projection.getProjectionFromObj(extent.spatialReference);

    if (extent && projectionExtent) {
      const projExtent = Projection.transformExtentFromProj(
        [extent.xmin, extent.ymin, extent.xmax, extent.ymax],
        projectionExtent,
        outProjection
      );
      return validateExtent(projExtent, outProjection.getCode());
    }

    // Throw
    throw new NoExtentError(this.getLayerPath());
  }

  /**
   * Overrides the parent method to return a more specific OpenLayers layer type (covariant return).
   * @override
   * @returns {ImageLayer<ImageArcGISRest>} The strongly-typed OpenLayers type.
   */
  override getOLLayer(): ImageLayer<ImageArcGISRest> {
    // Call parent and cast
    return super.getOLLayer() as ImageLayer<ImageArcGISRest>;
  }

  /**
   * Overrides the parent class's method to return a more specific OpenLayers source type (covariant return).
   * @override
   * @returns {ImageArcGISRest} The ImageArcGISRest source instance associated with this layer.
   */
  override getOLSource(): ImageArcGISRest {
    // Get source from OL
    return super.getOLSource() as ImageArcGISRest;
  }

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   * @override
   * @returns {EsriDynamicLayerEntryConfig} The strongly-typed layer configuration specific to this layer.
   */
  override getLayerConfig(): EsriDynamicLayerEntryConfig {
    // Call parent and cast
    return super.getLayerConfig() as EsriDynamicLayerEntryConfig;
  }

  /**
   * Overrides the hit tolerance of the layer.
   * @override
   * @returns {number} The hit tolerance for a GV Esri Dynamic layer
   */
  override getHitTolerance(): number {
    // Override the hit tolerance for a GVEsriDynamic layer
    return GVEsriDynamic.DEFAULT_HIT_TOLERANCE;
  }

  /**
   * Overrides the return of the field type from the metadata. If the type can not be found, return 'string'.
   * @param {string} fieldName - The field name for which we want to get the type.
   * @returns {TypeOutfieldsType} The type of the field.
   */
  protected override onGetFieldType(fieldName: string): TypeOutfieldsType {
    // Redirect
    return esriGetFieldType(this.getLayerConfig(), fieldName);
  }

  /**
   * Overrides the return of the domain of the specified field.
   * @param {string} fieldName - The field name for which we want to get the domain.
   * @returns {null | codedValueType | rangeDomainType} The domain of the field.
   */
  protected override onGetFieldDomain(fieldName: string): null | codedValueType | rangeDomainType {
    // Redirect
    return esriGetFieldDomain(this.getLayerConfig(), fieldName);
  }

  /**
   * Overrides the get all feature information for all the features stored in the layer.
   * @param {AbortController?} abortController - The optional abort controller.
   * @returns {Promise<TypeFeatureInfoEntry[]>} A promise of an array of TypeFeatureInfoEntry[].
   */
  protected override async getAllFeatureInfo(abortController: AbortController | undefined = undefined): Promise<TypeFeatureInfoEntry[]> {
    // Get the layer config in a loaded phase
    const layerConfig = this.getLayerConfig();

    // Fetch the features with worker
    const jsonResponse = await this.#fetchAllFeatureInfoWithWorker(layerConfig);

    // If was aborted
    // Explicitely checking the abort condition here, after the fetch in the worker, because we can't send the abortController in a fetch happening inside a worker.
    if (abortController?.signal.aborted) {
      // Raise error
      throw new RequestAbortedError(abortController.signal);
    }

    // If any features
    if (jsonResponse.features) {
      // Parse the JSON response and create features
      const features = jsonResponse.features.map((featureData) => {
        // We do not query the geometry anymore (set as undefined). It will query if needed by later
        const properties = featureData.attributes;
        return new Feature({ ...properties, undefined });
      });

      // Format and return the result
      // Not having geometry have an effect on the style as it use the geometry to define wich one to use
      // The formatFeatureInfoResult (abstact-geoview-layer) / getFeatureCanvas (geoview-renderer) use geometry stored in style
      return this.formatFeatureInfoResult(features, layerConfig);
    }

    // Error
    throw new NoFeaturesPropertyError();
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
    queryGeometry: boolean = true,
    abortController: AbortController | undefined = undefined
  ): Promise<TypeFeatureInfoEntry[]> {
    // If invisible
    if (!this.getVisible()) return [];

    // Get the layer config in a loaded phase
    const layerConfig = this.getLayerConfig();

    // If not queryable or there no url access path to query return []
    if (!layerConfig.source.featureInfo?.queryable) return [];

    let identifyUrl = layerConfig.source.dataAccessPath;
    if (!identifyUrl) return [];

    identifyUrl = identifyUrl.endsWith('/') ? identifyUrl : `${identifyUrl}/`;

    // GV: We cannot directly use the view extent and reproject. If we do so some layers (issue #2413) identify will return empty resultset
    // GV.CONT: This happen with max extent as initial extent and 3978 projection. If we use only the LL and UP corners for the reprojection it works
    const mapExtent = map.getView().calculateExtent();
    const boundsLL = Projection.transformToLonLat([mapExtent[0], mapExtent[1]], map.getView().getProjection());
    const boundsUR = Projection.transformToLonLat([mapExtent[2], mapExtent[3]], map.getView().getProjection());
    const extent = { xmin: boundsLL[0], ymin: boundsLL[1], xmax: boundsUR[0], ymax: boundsUR[1] };
    const layerDefs = this.getOLSource()?.getParams()?.layerDefs || '';
    const size = map.getSize()!;
    const mapProjNumber = parseInt(map.getView().getProjection().getCode()?.split(':')[1] || '', 10);

    // Identify query to get oid features value and attributes, at this point we do not query geometry
    identifyUrl =
      `${identifyUrl}identify?f=json&tolerance=${this.getHitTolerance()}` +
      `&mapExtent=${extent.xmin},${extent.ymin},${extent.xmax},${extent.ymax}` +
      `&imageDisplay=${size[0]},${size[1]},96` +
      `&layers=visible:${layerConfig.layerId}` +
      `&layerDefs=${encodeURI(layerDefs)}` +
      `&geometryType=esriGeometryPoint&geometry=${lonlat[0]},${lonlat[1]}` +
      `&returnGeometry=false&sr=4326&returnFieldName=true`;

    // If it takes more then 10 seconds it means the server is unresponsive and we should not continue. This will throw an error...
    const identifyJsonResponse = await Fetch.fetchWithTimeout<EsriIdentifyJsonResponse>(identifyUrl, undefined, 10000);

    // If no features identified return []
    if (identifyJsonResponse.results.length === 0) return [];

    // Extract OBJECTIDs
    const oidField = layerConfig.source.featureInfo.outfields
      ? layerConfig.source.featureInfo.outfields.filter((field) => field.type === 'oid')[0].name
      : 'OBJECTID';
    const objectIds = identifyJsonResponse.results.map((result) => String(result.attributes[oidField]).replace(',', ''));

    // Get meters per pixel to set the maxAllowableOffset to simplify return geometry
    const maxAllowableOffset = queryGeometry
      ? getMetersPerPixel(mapProjNumber as TypeValidMapProjectionCodes, map.getView().getResolution() || 7000, lonlat[1])
      : 0;

    // TODO: Performance - We need to separate the query attribute from geometry. We can use the attributes returned by identify to show details panel
    // TO.DOCONT: or create 2 distinc query one for attributes and one for geometry. This way we can display the panel faster and wait later for geometry
    // TO.DOCONT: We need to see if we can fetch in async mode without freezing the ui. If not we will need a web worker for the fetch.
    // TO.DOCONT: If we go with web worker, we need a reusable approach so we can use with all our queries
    // Get features
    // const response = await esriQueryRecordsByUrlObjectIds(
    //   layerConfig.source.dataAccessPath + layerConfig.layerId,
    //   (layerConfig.getLayerMetadata()!.geometryType as string).replace('esriGeometry', '') as TypeStyleGeometry,
    //   objectIds,
    //   '*',
    //   false,
    //   mapViewer.getMapState().currentProjection,
    //   maxAllowableOffset,
    //   false
    // );

    // TODO: Performance - This is also time consuming, the creation of the feature can take several seconds, check web worker
    // TO.DOCONT: Because web worker can only use sereialize date and not object with function it may be difficult for this...
    // TO.DOCONT: For the moment, the feature is created without a geometry. This should be added by web worker
    // TO.DOCONT: Splitting the query will help avoid layer details error when geometry is big anf let ui not frezze. The Web worker
    // TO.DOCONT: geometry assignement must not be in an async function.
    // Transform the features in an OL feature - at this point, there is no geometry associated with the feature
    const features = new EsriJSON().readFeatures({ features: identifyJsonResponse.results });
    const arrayOfFeatureInfoEntries = this.formatFeatureInfoResult(features, layerConfig);

    // If cancelled
    // Explicitely checking the abort condition here, after reading the features, because the processing above is time consuming and maybe things have become aborted meanwhile.
    if (abortController?.signal.aborted) {
      // Raise error
      throw new RequestAbortedError(abortController.signal);
    }

    // If geometry is needed, use web worker to query and assign geometry later
    if (queryGeometry)
      // TODO: REFACTOR - Here, we're launching another async task to query the geometries, but the original promise will resolve first, by design.
      // TO.DOCONT: We should carry this extra promise with the first response so that the caller of 'getFeatureInfoAtLonLat' can know
      // TO.DOCONT: when the geometries will be done fetching on the features that they've already received as 'resolved'. Carrying the promise
      // TO.DOCONT: would also allow us to more gracefully handle when the fetching of the geometries has failed, because without a
      // TO.DOCONT: handle on the promise, the caller of 'getFeatureInfoAtLonLat' have no idea of the 'fetchFeatureInfoGeometryWithWorker.catch()' here.
      // TO.DOCONT: However, this would mean change the 'getFeatureInfoAtLonLat' function signature with regards to its return type (and affect ALL other sibling classes)

      // TODO: Performance - We may need to use chunk and process 50 geom at a time. When we query 500 features (points) we have CORS issue with
      // TO.DOCONT: the esri query (was working with identify). But identify was failing on huge geometry...
      this.#fetchFeatureInfoGeometryWithWorker(layerConfig, objectIds.map(Number), true, mapProjNumber, maxAllowableOffset)
        .then((featuresJSON) => {
          featuresJSON.features.forEach((feat, index: number) => {
            // If cancelled
            // Explicitely checking the abort condition here, after the fetch in the worker, because we can't send the abortController in a fetch happening inside a worker.
            if (abortController?.signal.aborted) {
              // Raise error
              throw new RequestAbortedError(abortController.signal);
            }

            // TODO: Performance - There is still a problem when we create the feature with new EsriJSON().readFeature. It goes trought a loop and take minutes on the deflate function
            // TO.DOCONT: 1dcd28aa-99da-4f62-b157-15631379b170, ocean biology layer has huge amount of verticies and when zoomed in we require more
            // TO.DOCONT: more definition so the feature creation take more time. Investigate if we can create the geometry instead
            // TO.DOCONT: Investigate using this approach in esri-feature.ts
            // const geom = new EsriJSON().readFeature(feat, {
            //   dataProjection: `EPSG:${mapViewer.getMapState().currentProjection}`,
            //   featureProjection: `EPSG:${mapViewer.getMapState().currentProjection}`,
            // }) as Feature<Geometry>;

            // TODO: Performance - Relying on style to get geometry is not good. We should extract it from metadata and keep it in dedicated attribute
            const geomType = Object.keys(layerConfig?.layerStyle || []);

            // Get coordinates in right format and create geometry
            const coordinates = (feat.geometry?.points ||
              feat.geometry?.paths ||
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              feat.geometry?.rings || [feat.geometry?.x, feat.geometry?.y]) as any; // MultiPoint or Line or Polygon or Point schema
            const newGeom: Geometry | undefined =
              geomType.length > 0 ? GeometryApi.createGeometryFromType(geomType[0] as TypeStyleGeometry, coordinates) : undefined;

            // TODO: Performance - We will need a trigger to refresh the higight and details panel (for zoom button) when extent and
            // TO.DOCONT: is applied. Sometimes the delay is too big so we need to change tab or layer in layer list to trigger the refresh
            // We assume order of arrayOfFeatureInfoEntries is the same as featuresJSON.features as they are processed in the same order
            const entry = arrayOfFeatureInfoEntries[index];
            entry.feature?.setGeometry(newGeom);
            entry.geometry = newGeom;
            entry.extent = newGeom?.getExtent();
          });
        })
        .catch((error: unknown) => {
          // Log error
          logger.logError('The Worker to get the feature geometries has failed', error);
        });

    return arrayOfFeatureInfoEntries;
  }

  /**
   * Applies a view filter to an Esri Dynamic layer's source by updating the `layerDefs` parameter.
   * @param {string | undefined} filter - The raw filter string input (defaults to an empty string if not provided).
   */
  applyViewFilter(filter: string | undefined = ''): void {
    // Log
    logger.logTraceCore('GV-ESRI-DYNAMIC - applyViewFilterOnSource', this.getLayerPath());

    // Redirect
    GVEsriDynamic.applyViewFilterOnSource(
      this.getLayerConfig(),
      this.getOLSource(),
      this.getStyle(),
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
   * Query all features with a web worker
   * @param {EsriDynamicLayerEntryConfig} layerConfig - The layer config
   * @returns {Promise<EsriFeaturesJsonResponse>} A promise of esri response for query.
   */
  #fetchAllFeatureInfoWithWorker(layerConfig: EsriDynamicLayerEntryConfig): Promise<EsriFeaturesJsonResponse> {
    const params: QueryParams = {
      url: layerConfig.source.dataAccessPath + layerConfig.layerId,
      geometryType: 'Point',
      objectIds: 'all',
      queryGeometry: false,
      projection: 4326,
      maxAllowableOffset: 6,
      maxRecordCount: layerConfig.maxRecordCount || 1000,
    };

    // Launch
    return this.#fetchWorkerPool.process(params) as Promise<EsriFeaturesJsonResponse>;
  }

  /**
   * Query the features geometry with a web worker
   * @param {EsriDynamicLayerEntryConfig} layerConfig - The layer config
   * @param {number[]} objectIds - Array of object IDs to query
   * @param {boolean} queryGeometry - Whether to include geometry in the query
   * @param {number} projection - The spatial reference ID for the output
   * @param {number} maxAllowableOffset - The maximum allowable offset for geometry simplification
   * @returns {Promise<EsriFeaturesJsonResponse>} A promise of esri response for query.
   */
  #fetchFeatureInfoGeometryWithWorker(
    layerConfig: EsriDynamicLayerEntryConfig,
    objectIds: number[],
    queryGeometry: boolean,
    projection: number,
    maxAllowableOffset: number
  ): Promise<EsriFeaturesJsonResponse> {
    const params: QueryParams = {
      url: layerConfig.source.dataAccessPath + layerConfig.layerId,
      geometryType: (layerConfig.getLayerMetadata()!.geometryType as string).replace('esriGeometry', ''),
      objectIds,
      queryGeometry,
      projection,
      maxAllowableOffset,
      maxRecordCount: layerConfig.maxRecordCount || 1000,
    };

    // Launch
    return this.#fetchWorkerPool.process(params) as Promise<EsriFeaturesJsonResponse>;
  }

  /**
   * Handles progress messages from a worker to update layer loading status
   * @param {MessageEvent} event - The message event from the worker containing progress data
   * @returns {void}
   */
  #handleWorkerMessage(event: MessageEvent): void {
    // Log
    logger.logDebug('Handling worker message', event);

    // Early return if not a FetchEsriWorker message
    const workerLog = event.data;
    if (workerLog.type !== 'message' || workerLog.message[0] !== 'FetchEsriWorker') {
      return;
    }

    // Handle based on log level
    switch (workerLog.level) {
      case 'info': {
        const { processed, total } = workerLog.message[1];
        let messageKey: string;
        if (processed === 0) {
          messageKey = 'layers.fetchStart';
        } else if (processed === total) {
          messageKey = 'layers.fetchDone';
        } else {
          messageKey = 'layers.fetchProgress';
        }

        this.emitMessage(messageKey, [processed, total], 'info');
        break;
      }
      case 'error':
        this.emitMessage('error.layer.notAbleToQuery', [this.getLayerName()], 'error');
        break;
      default:
        break;
    }
  }

  /**
   * Applies a view filter to an Esri Dynamic layer's source by updating the `layerDefs` parameter.
   * This function is responsible for generating the appropriate filter expression based on the layer configuration,
   * optional style, and time-based fragments. It ensures the filter is only applied if it has changed or needs to be reset.
   * @param {EsriDynamicLayerEntryConfig} layerConfig - The configuration object for the Esri Dynamic layer.
   * @param {ImageArcGISRest} source - The OpenLayers `ImageArcGISRest` source instance to which the filter will be applied.
   * @param {TypeLayerStyleConfig | undefined} style - Optional style configuration that may influence filter expression generation.
   * @param {TypeDateFragments | undefined} externalDateFragments - Optional external date fragments used to assist in formatting time-based filters.
   * @param {GVEsriDynamic | undefined} layer - Optional GeoView layer containing the source (if exists) in order to trigger a redraw.
   * @param {string | undefined} filter - The raw filter string input (defaults to an empty string if not provided).
   * @param {Function?} callbackWhenUpdated - Optional callback that is invoked with the final filter string if the layer was updated.
   * @throws {LayerInvalidLayerFilterError} If the filter expression fails to parse or cannot be applied.
   */
  static applyViewFilterOnSource(
    layerConfig: EsriDynamicLayerEntryConfig,
    source: ImageArcGISRest,
    style: TypeLayerStyleConfig | undefined,
    externalDateFragments: TypeDateFragments | undefined,
    layer: GVEsriDynamic | undefined,
    filter: string | undefined = '',
    callbackWhenUpdated: ((filterToUse: string) => void) | undefined = undefined
  ): void {
    // Parse the filter value to use
    let filterValueToUse = filter.replaceAll(/\s{2,}/g, ' ').trim();

    // Get the current filter
    const currentFilter = source.getParams().layerDefs;

    try {
      // TODO: Check - Is this assignation necessary? What's the intent?
      // Update the layer config information (not ideal to do this here...)
      // eslint-disable-next-line no-param-reassign
      layerConfig.layerFilter = filterValueToUse;
      filterValueToUse = GVEsriDynamic.getViewFilter(layerConfig, style);

      // Parse the filter value to use
      filterValueToUse = parseDateTimeValuesEsriDynamic(filterValueToUse, externalDateFragments);

      // Create the source parameter to update
      const layerDefs = layerConfig.getLayerMetadata()?.type === 'Raster Layer' ? '' : `{"${layerConfig.layerId}": "${filterValueToUse}"}`;

      // Define what is considered the default filter (e.g., "1=1")
      const isDefaultFilter = filterValueToUse === GVEsriDynamic.DEFAULT_FILTER_1EQUALS1;

      // Define what is a no operation
      const isNewFilterEffectivelyNoop = isDefaultFilter && !currentFilter;

      // Check whether the current filter is different from the new one
      const filterChanged = layerDefs !== currentFilter;

      // Determine if we should apply or reset filter
      const shouldUpdateFilter = (filterChanged && !isNewFilterEffectivelyNoop) || (!!currentFilter && isDefaultFilter);

      // If should update the filtering
      if (shouldUpdateFilter) {
        // Update the source params
        source.updateParams({ layerDefs });
        layer?.getOLLayer().changed();

        // Callback
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
   * Gets the layer view filter. The filter is derived from the uniqueValue or the classBreak visibility flags and a layerFilter
   * associated to the layer.
   * @returns {string} The filter associated to the layer
   */
  static getViewFilter(layerConfig: EsriDynamicLayerEntryConfig, style: TypeLayerStyleConfig | undefined): string {
    const { layerFilter } = layerConfig;

    if (style) {
      const setAllUndefinedVisibilityFlagsToYes = (styleConfig: TypeLayerStyleSettings): void => {
        // default value is true for all undefined visibility flags
        const settings = styleConfig.info;
        for (let i = 0; i < settings.length; i++) if (settings[i].visible === undefined) settings[i].visible = true;
      };

      const featuresAreAllVisible = (settings: { visible: boolean }[]): boolean => {
        return settings.every((setting) => setting.visible !== false);
      };

      // Get the first style settings.
      const styleSettings = layerConfig.getFirstStyleSettings()!;

      if (styleSettings.type === 'simple') {
        return layerFilter || GVEsriDynamic.DEFAULT_FILTER_1EQUALS1;
      }
      if (styleSettings.type === 'uniqueValue') {
        setAllUndefinedVisibilityFlagsToYes(styleSettings);
        if (featuresAreAllVisible(styleSettings.info as { visible: boolean }[]))
          return `${GVEsriDynamic.DEFAULT_FILTER_1EQUALS1}${layerFilter ? ` and (${layerFilter})` : ''}`;

        // This section of code optimize the query to reduce it at it shortest expression.
        const fieldOfTheSameValue = GVEsriDynamic.#countFieldOfTheSameValue(styleSettings);
        const fieldOrder = GVEsriDynamic.#sortFieldOfTheSameValue(styleSettings, fieldOfTheSameValue);
        const queryTree = GVEsriDynamic.#getQueryTree(styleSettings, fieldOfTheSameValue, fieldOrder);
        // TODO: Refactor - Layers refactoring. Use the source.featureInfo from the layer, not the layerConfig anymore, here and below
        const query = GVEsriDynamic.#buildQuery(queryTree, 0, fieldOrder, styleSettings, layerConfig.source.featureInfo!);
        return `${query}${layerFilter ? ` and (${layerFilter})` : ''}`;
      }

      if (styleSettings.type === 'classBreaks') {
        setAllUndefinedVisibilityFlagsToYes(styleSettings);
        if (featuresAreAllVisible(styleSettings.info as { visible: boolean }[]))
          return `${GVEsriDynamic.DEFAULT_FILTER_1EQUALS1}${layerFilter ? ` and (${layerFilter})` : ''}`;

        const filterArray: string[] = [];
        let visibleWhenGreatherThisIndex = -1;
        for (let i = 0; i < styleSettings.info.length; i++) {
          if (filterArray.length % 2 === 0) {
            if (i === 0) {
              // First set, visible, default not visible
              if (
                styleSettings.info[0].visible !== false &&
                (!styleSettings.hasDefault ||
                  (styleSettings.hasDefault && styleSettings.info[styleSettings.info.length - 1].visible === false))
              )
                filterArray.push(
                  `${styleSettings.fields[0]} >= ${GVEsriDynamic.#formatFieldValue(
                    styleSettings.fields[0],
                    styleSettings.info[0].values[0],
                    layerConfig.source.featureInfo!
                  )}`
                );
              else if (
                // First set, not visible, default visible
                styleSettings.info[0].visible === false &&
                styleSettings.hasDefault &&
                styleSettings.info[styleSettings.info.length - 1].visible !== false
              ) {
                filterArray.push(
                  `${styleSettings.fields[0]} < ${GVEsriDynamic.#formatFieldValue(
                    styleSettings.fields[0],
                    styleSettings.info[0].values[0],
                    layerConfig.source.featureInfo!
                  )}`
                );
                visibleWhenGreatherThisIndex = i;
              }
            } else if (
              // Visible, default not visible
              styleSettings.info[i].visible !== false &&
              (!styleSettings.hasDefault ||
                (styleSettings.hasDefault && styleSettings.info[styleSettings.info.length - 1].visible === false))
            ) {
              filterArray.push(
                `${styleSettings.fields[0]} > ${GVEsriDynamic.#formatFieldValue(
                  styleSettings.fields[0],
                  styleSettings.info[i].values[0],
                  layerConfig.source.featureInfo!
                )}`
              );
              if (i + 1 === styleSettings.info.length)
                filterArray.push(
                  `${styleSettings.fields[0]} <= ${GVEsriDynamic.#formatFieldValue(
                    styleSettings.fields[0],
                    styleSettings.info[i].values[1],
                    layerConfig.source.featureInfo!
                  )}`
                );
            } else if (
              // Not visible, default visible
              styleSettings.info[i].visible === false &&
              styleSettings.hasDefault &&
              styleSettings.info[styleSettings.info.length - 1].visible !== false
            ) {
              filterArray.push(
                `${styleSettings.fields[0]} <= ${GVEsriDynamic.#formatFieldValue(
                  styleSettings.fields[0],
                  styleSettings.info[i].values[0],
                  layerConfig.source.featureInfo!
                )}`
              );
              visibleWhenGreatherThisIndex = i;
            }
          } else if (
            !styleSettings.hasDefault ||
            (styleSettings.hasDefault && styleSettings.info[styleSettings.info.length - 1].visible === false)
          ) {
            // Default is not visible/does not exist
            if (styleSettings.info[i].visible === false) {
              filterArray.push(
                `${styleSettings.fields[0]} <= ${GVEsriDynamic.#formatFieldValue(
                  styleSettings.fields[0],
                  styleSettings.info[i - 1].values[1],
                  layerConfig.source.featureInfo!
                )}`
              );
            } else if (i + 1 === styleSettings.info.length) {
              filterArray.push(
                `${styleSettings.fields[0]} <= ${GVEsriDynamic.#formatFieldValue(
                  styleSettings.fields[0],
                  styleSettings.info[i].values[1],
                  layerConfig.source.featureInfo!
                )}`
              );
            }
          } else if (styleSettings.hasDefault && styleSettings.info[i].visible !== false) {
            // Has default and default is visible
            filterArray.push(
              `${styleSettings.fields[0]} > ${GVEsriDynamic.#formatFieldValue(
                styleSettings.fields[0],
                styleSettings.info[i - 1].values[1],
                layerConfig.source.featureInfo!
              )}`
            );
            visibleWhenGreatherThisIndex = -1;
          } else {
            visibleWhenGreatherThisIndex = i;
          }
        }

        if (visibleWhenGreatherThisIndex !== -1)
          filterArray.push(
            `${styleSettings.fields[0]} > ${GVEsriDynamic.#formatFieldValue(
              styleSettings.fields[0],
              styleSettings.info[visibleWhenGreatherThisIndex].values[1],
              layerConfig.source.featureInfo!
            )}`
          );

        if (styleSettings.hasDefault && styleSettings.info[styleSettings.info.length - 1].visible !== false) {
          const filterValue = `${filterArray.slice(0, -1).reduce((previousFilterValue, filterNode, i) => {
            if (i === 0) return `(${filterNode} or `;
            if (i % 2 === 0) return `${previousFilterValue} and ${filterNode}) or `;
            return `${previousFilterValue}(${filterNode}`;
          }, '')}${filterArray.slice(-1)[0]})`;
          return `${filterValue}${layerFilter ? ` and (${layerFilter})` : ''}`;
        }

        const filterValue = filterArray.length
          ? `${filterArray.reduce((previousFilterValue, filterNode, i) => {
              if (i === 0) return `((${filterNode} and `;
              if (i % 2 === 0) return `${previousFilterValue} or (${filterNode} and `;
              return `${previousFilterValue}${filterNode})`;
            }, '')})`
          : // We use '(1=0)' as false to select nothing
            '(1=0)';

        return `${filterValue}${layerFilter ? ` and (${layerFilter})` : ''}`;
      }
    }
    return GVEsriDynamic.DEFAULT_FILTER_1EQUALS1;
  }

  /**
   * Counts the number of times the value of a field is used by the unique value style information object. Depending on the
   * visibility of the default, we count visible or invisible settings.
   * @param {TypeLayerStyleSettings} styleSettings - The unique value style settings to evaluate.
   * @returns {TypeFieldOfTheSameValue[][]} The result of the evaluation. The first index of the array corresponds to the field's
   * index in the style settings and the second one to the number of different values the field may have based on visibility of
   * the feature.
   * @private
   */
  static #countFieldOfTheSameValue(styleSettings: TypeLayerStyleSettings): TypeFieldOfTheSameValue[][] {
    return styleSettings.info.reduce<TypeFieldOfTheSameValue[][]>(
      (counter, styleEntry): TypeFieldOfTheSameValue[][] => {
        if (styleEntry.visible !== false) {
          styleEntry.values.forEach((styleValue, i) => {
            const valueExist = counter[i]?.find((counterEntry) => counterEntry.value === styleValue);
            if (valueExist) valueExist.nbOccurence++;
            else if (counter[i]) counter[i].push({ value: styleValue, nbOccurence: 1 });
            // eslint-disable-next-line no-param-reassign
            else counter[i] = [{ value: styleValue, nbOccurence: 1 }];
          });
        }

        return counter;
      },
      styleSettings.fields.map<TypeFieldOfTheSameValue[]>(() => [])
    );
  }

  /**
   * Sorts the number of times the value of a field is used by the unique value style information object. Depending on the
   * visibility of the default value, we count the visible or invisible parameters. The order goes from the highest number of
   * occurrences to the lowest number of occurrences.
   * @param {TypeLayerStyleSettings} styleSettings - The unique value style settings to evaluate.
   * @param {TypeFieldOfTheSameValue[][]} fieldOfTheSameValue - The count information that contains the number of occurrences
   * of a value.
   * @returns {number[]} An array that gives the field order to use to build the query tree.
   * @private
   */
  static #sortFieldOfTheSameValue(styleSettings: TypeLayerStyleSettings, fieldOfTheSameValue: TypeFieldOfTheSameValue[][]): number[] {
    const fieldNotUsed = styleSettings.fields.map(() => true);
    const fieldOrder: number[] = [];
    for (let entrySelected = 0; entrySelected !== -1; entrySelected = fieldNotUsed.findIndex((flag) => flag)) {
      let entrySelectedTotalEntryCount = fieldOfTheSameValue[entrySelected].reduce((accumulator, fieldEntry) => {
        return accumulator + fieldEntry.nbOccurence;
      }, 0);
      for (let i = 0; i < styleSettings.fields.length; i++) {
        if (fieldNotUsed[i] && i !== entrySelected) {
          const newEntrySelectedTotalEntryCount = fieldOfTheSameValue[i].reduce((accumulator, fieldEntry) => {
            return accumulator + fieldEntry.nbOccurence;
          }, 0);
          if (
            fieldOfTheSameValue[entrySelected].length > fieldOfTheSameValue[i].length ||
            (fieldOfTheSameValue[entrySelected].length === fieldOfTheSameValue[i].length &&
              entrySelectedTotalEntryCount < newEntrySelectedTotalEntryCount)
          ) {
            entrySelected = i;
            entrySelectedTotalEntryCount = newEntrySelectedTotalEntryCount;
          }
        }
      }
      fieldNotUsed[entrySelected] = false;
      fieldOrder.push(entrySelected);
    }

    return fieldOrder;
  }

  /**
   * Gets the query tree. The tree structure is a representation of the optimized query we have to create. It contains the field
   * values in the order specified by the fieldOrder parameter. The optimization is based on the distributivity and associativity
   * of the Boolean algebra. The form is the following:
   *
   * (f1 = v11 and (f2 = v21 and f3 in (v31, v32) or f2 = v22 and f3 in (v31, v32, v33)) or f1 = v12 and (f2 = v21 and ...)))
   *
   * which is equivalent to:
   * f1 = v11 and f2 = v21 and f3 = v31 or f1 = v11 and f2 = v21 and f3 = v32 or f1 = v11 and f2 = v22 and f3 = v31 ...
   *
   * @param {TypeLayerStyleSettings} styleSettings - The unique value style settings to evaluate.
   * @param {TypeFieldOfTheSameValue[][]} fieldOfTheSameValue - The count information that contains the number of occurrences
   * of a value.
   * @param {number[]} fieldOrder - The field order to use when building the tree.
   * @returns {TypeQueryTree} The query tree to use when building the final query string.
   * @private
   */
  static #getQueryTree(
    styleSettings: TypeLayerStyleSettings,
    fieldOfTheSameValue: TypeFieldOfTheSameValue[][],
    fieldOrder: number[]
  ): TypeQueryTree {
    const queryTree: TypeQueryTree = [];
    styleSettings.info.forEach((styleEntry) => {
      if (styleEntry.visible !== false) {
        let levelToSearch = queryTree;
        for (let i = 0; i < fieldOrder.length; i++) {
          if (fieldOfTheSameValue[fieldOrder[i]].find((field) => field.value === styleEntry.values[fieldOrder[i]])) {
            const treeElementFound = levelToSearch.find((treeElement) => styleEntry.values[fieldOrder[i]] === treeElement.fieldValue);
            if (!treeElementFound) {
              levelToSearch.push({ fieldValue: styleEntry.values[fieldOrder[i]], nextField: [] });
              levelToSearch = levelToSearch[levelToSearch.length - 1].nextField;
            } else levelToSearch = treeElementFound.nextField;
          }
        }
      }
    });

    return queryTree;
  }

  /**
   * Builds the query using the provided query tree.
   * @param {TypeQueryTree} queryTree - The query tree to use.
   * @param {number} level - The level to use for solving the tree.
   * @param {number[]} fieldOrder - The field order to use for solving the tree.
   * @param {TypeLayerStyleSettings} styleSettings - The unique value style settings to evaluate.
   * @param {TypeFeatureInfoLayerConfig} sourceFeatureInfo - The source feature information that knows the field type.
   * @returns {string} The resulting query.
   * @private
   */
  static #buildQuery(
    queryTree: TypeQueryTree,
    level: number,
    fieldOrder: number[],
    styleSettings: TypeLayerStyleSettings,
    sourceFeatureInfo: TypeFeatureInfoLayerConfig
  ): string {
    // TODO The below commented code was previously causing the classes to be reversed by adding a 'not' to the query
    // TO.DO Need to confirm that the 'not' is no longer needed
    // TO.DO Changed on 2025-05-29 in PR 2916
    // let queryString = styleSettings.info[styleSettings.info.length - 1].visible !== false && !level ? 'not (' : '(';
    let queryString = '(';
    for (let i = 0; i < queryTree.length; i++) {
      const value = GVEsriDynamic.#formatFieldValue(styleSettings.fields[fieldOrder[level]], queryTree[i].fieldValue, sourceFeatureInfo);
      // The nextField array is not empty, then it is is not the last field
      if (queryTree[i].nextField.length) {
        // If i > 0 (true) then we add a OR clause
        if (i) queryString = `${queryString} or `;
        // Add to the query the 'fieldName = value and ' + the result of the recursive call to buildQuery using the next field and level
        queryString = `${queryString}${styleSettings.fields[fieldOrder[level]]} = ${value} and ${GVEsriDynamic.#buildQuery(
          queryTree[i].nextField,
          level + 1,
          fieldOrder,
          styleSettings,
          sourceFeatureInfo
        )}`;
      } else {
        // We have reached the last field and i = 0 (false) we concatenate 'fieldName in (value' else we concatenate ', value'
        queryString = i ? `${queryString}, ${value}` : `${styleSettings.fields[fieldOrder[level]]} in (${value}`;
      }
      // If i points to the last element of the queryTree, close the parenthesis.
      if (i === queryTree.length - 1) queryString = `${queryString})`;
    }

    return queryString === '(' ? '(1=0)' : queryString;
  }

  /**
   * Formats the field value to use in the query.
   * @param {string} fieldName - The field name.
   * @param {string | number | Date} rawValue - The unformatted field value.
   * @param {TypeFeatureInfoLayerConfig} sourceFeatureInfo - The source feature information that knows the field type.
   * @returns {string} The resulting field value.
   * @private
   */
  static #formatFieldValue(fieldName: string, rawValue: string | number | Date, sourceFeatureInfo: TypeFeatureInfoLayerConfig): string {
    const fieldEntry = sourceFeatureInfo.outfields?.find((outfield) => outfield.name === fieldName);
    const fieldType = fieldEntry?.type;
    switch (fieldType) {
      case 'date':
        return `date '${rawValue}'`;
      case 'string':
        return `'${rawValue}'`;
      default:
        return `${rawValue}`;
    }
  }
}

export type EsriQueryJsonResponse = {
  extent: TypeLayerMetadataEsriExtent;
};

export type EsriFeaturesJsonResponse = {
  features: EsriIdentifyJsonResponseAttribute[];
};

export type EsriIdentifyJsonResponse = {
  results: EsriIdentifyJsonResponseAttribute[];
};

export type EsriIdentifyJsonResponseAttribute = {
  attributes: Record<string, unknown>;
  geometry: GeometryJson;
};
