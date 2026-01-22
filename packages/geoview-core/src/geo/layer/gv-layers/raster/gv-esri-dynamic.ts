import type { ImageArcGISRest } from 'ol/source';
import { Image as ImageLayer } from 'ol/layer';
import type { Options as ImageOptions } from 'ol/layer/BaseImage';
import type { Coordinate } from 'ol/coordinate';
import { EsriJSON } from 'ol/format';
import type { Extent } from 'ol/extent';
import Feature from 'ol/Feature';
import type Geometry from 'ol/geom/Geometry';
import type { Projection as OLProjection } from 'ol/proj';
import type { Map as OLMap } from 'ol';

import { GeoUtilities } from '@/geo/utils/utilities';
import { Projection } from '@/geo/utils/projection';
import { logger } from '@/core/utils/logger';
import { Fetch } from '@/core/utils/fetch-helper';
import type { EsriDynamicLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/esri-dynamic-layer-entry-config';
import type {
  TypeLayerStyleSettings,
  TypeFeatureInfoEntry,
  rangeDomainType,
  codedValueType,
  TypeLayerStyleConfig,
  TypeLayerStyleConfigInfo,
  TypeOutfieldsType,
  TypeValidMapProjectionCodes,
  TypeIconSymbolVectorConfig,
  TypeFeatureInfoEntryPartial,
} from '@/api/types/map-schema-types';
import type { TypeLayerMetadataEsriExtent } from '@/api/types/layer-schema-types';
import { CONST_LAYER_TYPES } from '@/api/types/layer-schema-types';
import type { GeometryJson } from '@/geo/layer/gv-layers/utils';
import { EsriUtilities } from '@/geo/layer/geoview-layers/esri-layer-common';
import { GVLayerUtilities } from '@/geo/layer/gv-layers/utils';
import { AbstractGVRaster } from '@/geo/layer/gv-layers/raster/abstract-gv-raster';
import { GeoviewRenderer } from '@/geo/utils/renderer/geoview-renderer';
import type { TypeLegend } from '@/core/stores/store-interface-and-intial-values/layer-state';
import type { TypeEsriImageLayerLegend } from '@/geo/layer/gv-layers/raster/gv-esri-image';
import { FetchEsriWorkerPool } from '@/core/workers/fetch-esri-worker-pool';
import type { QueryParams } from '@/core/workers/fetch-esri-worker-script';
import { GeometryApi } from '@/geo/layer/geometry/geometry';
import { NoFeaturesPropertyError } from '@/core/exceptions/geoview-exceptions';
import { formatError, RequestAbortedError } from '@/core/exceptions/core-exceptions';
import { LayerInvalidLayerFilterError } from '@/core/exceptions/layer-exceptions';
import type { TypeDateFragments } from '@/core/utils/date-mgt';
import type { LayerFilters } from '@/core/types/layer-filters';

/**
 * Manages an Esri Dynamic layer.
 *
 * @exports
 * @class GVEsriDynamic
 */
export class GVEsriDynamic extends AbstractGVRaster {
  /** The worker pool used when fetching records */
  #fetchWorkerPool: FetchEsriWorkerPool;

  // The default hit tolerance the query should be using
  static override DEFAULT_HIT_TOLERANCE: number = 7;

  /**
   * Constructs a GVEsriDynamic layer to manage an OpenLayer layer.
   * @param {ImageArcGISRest} olSource - The OpenLayer source.
   * @param {EsriDynamicLayerEntryConfig} layerConfig - The layer configuration.
   */
  constructor(olSource: ImageArcGISRest, layerConfig: EsriDynamicLayerEntryConfig) {
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

  // #region OVERRIDES

  /**
   * Overrides the fetching of the legend for an Esri Dynamic layer.
   * @override
   * @returns {Promise<TypeLegend | null>} The legend of the layer or null.
   */
  override async onFetchLegend(): Promise<TypeLegend | null> {
    // Get the config
    const layerConfig = this.getLayerConfig();

    // If not a Raster Layer type
    if (layerConfig.getLayerMetadata()?.type !== 'Raster Layer') {
      // Regular fetch
      return super.onFetchLegend();
    }

    // At this point, the layer type is 'Raster Layer'

    try {
      if (!layerConfig) return null;
      const legendUrl = `${layerConfig.getMetadataAccessPath()}/legend?f=json`;
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
          visible: layerConfig.getInitialSettings()?.states?.visible ?? true, // default: true,
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
      metadataExtent = GeoUtilities.validateExtent(metadataExtent, projection.getCode());
    }

    // Return the calculated layer bounds
    return metadataExtent;
  }

  /**
   * Sends a query to get ESRI Dynamic feature geometries and calculates an extent from them.
   * @param {number[] | string[]} objectIds - The IDs of the features to calculate the extent from.
   * @param {OLProjection} outProjection - The output projection for the extent.
   * @param {string?} outfield - ID field to return for services that require a value in outfields.
   * @override
   * @returns {Promise<Extent>} The extent of the features, if available.
   * @throws {LayerDataAccessPathMandatoryError} When the Data Access Path was undefined, likely because initDataAccessPath wasn't called.
   * @throws {RequestTimeoutError} When the request exceeds the timeout duration.
   * @throws {RequestAbortedError} When the request was aborted by the caller's signal.
   * @throws {ResponseError} When the response is not OK (non-2xx).
   * @throws {ResponseEmptyError} When the JSON response is empty.
   * @throws {ResponseTypeError} When the response from the service is not an object.
   * @throws {ResponseContentError} When the response actually contains an error within it.
   * @throws {NetworkError} When a network issue happened.
   */
  override async onGetExtentFromFeatures(objectIds: number[] | string[], outProjection: OLProjection, outfield?: string): Promise<Extent> {
    // Get url for service from layer entry config
    const layerEntryConfig = this.getLayerConfig();

    // Use the returnExtentOnly=true to get only the extent of ids and ask in the right projection right away
    const idStringClause = `&objectIds=${objectIds.join(',')}`;
    const outfieldQueryClause = outfield ? `&outFields=${outfield}` : '';
    const outSrClause = `&outSR=${Projection.readEPSGNumber(outProjection)}`;
    const queryUrl = `${layerEntryConfig.getDataAccessPath(true)}${layerEntryConfig.layerId}/query?${idStringClause}${outfieldQueryClause}${outSrClause}&returnExtentOnly=true&f=json`;

    // Fetch
    const responseJson = await Fetch.fetchEsriJson<EsriQueryJsonResponse>(queryUrl);
    const { extent } = responseJson;

    // Validate and return the extent
    return GeoUtilities.validateExtent([extent.xmin, extent.ymin, extent.xmax, extent.ymax], outProjection.getCode());
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
    return EsriUtilities.esriGetFieldType(this.getLayerConfig(), fieldName);
  }

  /**
   * Overrides the return of the domain of the specified field.
   * @param {string} fieldName - The field name for which we want to get the domain.
   * @returns {null | codedValueType | rangeDomainType} The domain of the field.
   */
  protected override onGetFieldDomain(fieldName: string): null | codedValueType | rangeDomainType {
    // Redirect
    return EsriUtilities.esriGetFieldDomain(this.getLayerConfig(), fieldName);
  }

  /**
   * Overrides the get all feature information for all the features stored in the layer.
   * @param {OLMap} map - The Map so that we can grab the resolution/projection we want to get features on.
   * @param {AbortController?} [abortController] - The optional abort controller.
   * @returns {Promise<TypeFeatureInfoEntry[]>} A promise of an array of TypeFeatureInfoEntry[].
   */
  protected override async getAllFeatureInfo(map: OLMap, abortController?: AbortController): Promise<TypeFeatureInfoEntry[]> {
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
   * @param {AbortController?} [abortController] - The optional abort controller.
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
   * @param {AbortController?} [abortController] - The optional abort controller.
   * @returns {Promise<TypeFeatureInfoEntry[]>} A promise of an array of TypeFeatureInfoEntry[].
   * @throws {LayerDataAccessPathMandatoryError} When the Data Access Path was undefined, likely because initDataAccessPath wasn't called.
   */
  protected override async getFeatureInfoAtLonLat(
    map: OLMap,
    lonlat: Coordinate,
    queryGeometry: boolean = true,
    abortController: AbortController | undefined = undefined
  ): Promise<TypeFeatureInfoEntry[]> {
    // Get the layer config in a loaded phase
    const layerConfig = this.getLayerConfig();

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
    const identifyUrl =
      `${layerConfig.getDataAccessPath(true)}identify?f=json&tolerance=${this.getHitTolerance()}` +
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
    const oidField = layerConfig.getOutfieldsPKNameOrDefault('OBJECTID');
    const objectIds = identifyJsonResponse.results.map((result) => String(result.attributes[oidField]).replace(',', ''));

    // Get meters per pixel to set the maxAllowableOffset to simplify return geometry
    const maxAllowableOffset = queryGeometry
      ? GeoUtilities.getMetersPerPixel(mapProjNumber as TypeValidMapProjectionCodes, map.getView().getResolution() || 7000, lonlat[1])
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

            // Get the geometry type
            const geomType = layerConfig?.getGeometryType();

            // Get coordinates in right format and create geometry
            const coordinates = (feat.geometry?.points ||
              feat.geometry?.paths ||
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              feat.geometry?.rings || [feat.geometry?.x, feat.geometry?.y]) as any; // MultiPoint or Line or Polygon or Point schema

            // Create the geometry from the (first?) type
            const newGeom: Geometry | undefined = geomType ? GeometryApi.createGeometryFromType(geomType, coordinates) : undefined;

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
   * Overrides the way an EsriDynamic layer applies a view filter. It does so by updating the source layerDefs parameter.
   * @param {LayerFilters} [filter] - The raw filter string input (defaults to an empty string if not provided).
   */
  protected override onSetLayerFilters(filter?: LayerFilters): void {
    // Redirect
    GVEsriDynamic.applyViewFilterOnSource(
      this.getLayerConfig(),
      this.getOLSource(),
      this.getLayerConfig().getExternalFragmentsOrder(),
      filter
    );
  }

  // #endregion OVERRIDES

  // #region PUBLIC METHODS

  /**
   * Retrieves feature records from the layer using their Object IDs (OIDs).
   * This method queries the underlying layer for the specified object IDs and returns
   * a Promise resolving to an array of partial feature info entries.
   * The method automatically determines the geometry type and output fields from
   * the layer configuration. If an output spatial reference (`outSR`) is provided,
   * the geometries are projected accordingly.
   * @param {number[]} objectIDs - An array of Object IDs to query.
   * @param {number} [outSR] - Optional output spatial reference (WKID) for geometry projection.
   * @returns {Promise<TypeFeatureInfoEntryPartial[]>} A promise resolving to an array of partial feature info entries.
   */
  getRecordsByOIDs(objectIDs: number[], outSR?: number | undefined): Promise<TypeFeatureInfoEntryPartial[]> {
    // Get the layer config
    const layerConfig = this.getLayerConfig();

    // Get the geometry type
    const geometryType = layerConfig.getGeometryType();

    // Get oid field
    const oidField = layerConfig.getOutfieldsPKNameOrDefault('OBJECTID');

    // Query for the specific object ids
    return EsriUtilities.queryRecordsByUrlObjectIds(
      `${layerConfig.getDataAccessPath(true)}${layerConfig.layerId}`,
      geometryType,
      objectIDs,
      oidField,
      true,
      outSR
    );
  }

  // #endregion PUBLIC METHODS

  // #region PRIVATE METHODS

  /**
   * Query all features with a web worker
   * @param {EsriDynamicLayerEntryConfig} layerConfig - The layer config
   * @returns {Promise<EsriFeaturesJsonResponse>} A promise of esri response for query.
   * @throws {LayerDataAccessPathMandatoryError} When the Data Access Path was undefined, likely because initDataAccessPath wasn't called.
   */
  #fetchAllFeatureInfoWithWorker(layerConfig: EsriDynamicLayerEntryConfig): Promise<EsriFeaturesJsonResponse> {
    const params: QueryParams = {
      url: layerConfig.getDataAccessPath(true) + layerConfig.layerId,
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
   * @throws {LayerDataAccessPathMandatoryError} When the Data Access Path was undefined, likely because initDataAccessPath wasn't called.
   */
  #fetchFeatureInfoGeometryWithWorker(
    layerConfig: EsriDynamicLayerEntryConfig,
    objectIds: number[],
    queryGeometry: boolean,
    projection: number,
    maxAllowableOffset: number
  ): Promise<EsriFeaturesJsonResponse> {
    const params: QueryParams = {
      url: layerConfig.getDataAccessPath(true) + layerConfig.layerId,
      geometryType: layerConfig.getLayerMetadata()!.geometryType.replace('esriGeometry', ''),
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
   * @param {MessageEvent} event - The message event from the worker containing progress data.
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

  // #endregion PRIVATE METHODS

  // #region STATIC METHODS

  /**
   * Applies a view filter to an Esri Dynamic layer's source by updating the `layerDefs` parameter.
   * This function is responsible for generating the appropriate filter expression based on the layer configuration,
   * optional style, and time-based fragments. It ensures the filter is only applied if it has changed or needs to be reset.
   * @param {EsriDynamicLayerEntryConfig} layerConfig - The configuration object for the Esri Dynamic layer.
   * @param {ImageArcGISRest} source - The OpenLayers `ImageArcGISRest` source instance to which the filter will be applied.
   * @param {TypeLayerStyleConfig | undefined} style - Optional style configuration that may influence filter expression generation.
   * @param {TypeDateFragments | undefined} externalDateFragments - Optional external date fragments used to assist in formatting time-based filters.
   * @param {string | undefined} filter - The raw filter string input (defaults to an empty string if not provided).
   * @throws {LayerInvalidLayerFilterError} If the filter expression fails to parse or cannot be applied.
   */
  static applyViewFilterOnSource(
    layerConfig: EsriDynamicLayerEntryConfig,
    source: ImageArcGISRest,
    externalDateFragments: TypeDateFragments | undefined,
    filter: LayerFilters | undefined
  ): void {
    // Get the filter to use
    let filterValueToUse = filter?.getAllFilters() || '';

    // Get the current filter
    const currentFilter = source.getParams().layerDefs;

    try {
      // Parse the filter value to use
      filterValueToUse = GVLayerUtilities.parseDateTimeValuesEsriDynamic(filterValueToUse, externalDateFragments);

      // Create the source parameter to update
      const layerDefs = layerConfig.getLayerMetadata()?.type === 'Raster Layer' ? '' : `{"${layerConfig.layerId}": "${filterValueToUse}"}`;

      // Define what is considered the default filter (e.g., "1=1")
      const isDefaultFilter = filterValueToUse === GeoviewRenderer.DEFAULT_FILTER_1EQUALS1;

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

  // #endregion STATIC METHODS
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
