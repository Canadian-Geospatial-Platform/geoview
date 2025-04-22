import { ImageArcGISRest } from 'ol/source';
import { Image as ImageLayer } from 'ol/layer';
import { Options as ImageOptions } from 'ol/layer/BaseImage';
import { Coordinate } from 'ol/coordinate';
import { Pixel } from 'ol/pixel';
import { EsriJSON } from 'ol/format';
import { Extent } from 'ol/extent';
import Feature from 'ol/Feature';
import Geometry from 'ol/geom/Geometry';
import { Projection as OLProjection } from 'ol/proj';

import { getMetersPerPixel, validateExtent } from '@/geo/utils/utilities';
import { Projection } from '@/geo/utils/projection';
import { logger } from '@/core/utils/logger';
import { Fetch } from '@/core/utils/fetch-helper';
import { EsriDynamicLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/esri-dynamic-layer-entry-config';
import {
  TypeLayerStyleSettings,
  TypeFeatureInfoLayerConfig,
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
import { esriGetFieldType, esriGetFieldDomain, parseDateTimeValuesEsriDynamic } from '@/geo/layer/gv-layers/utils';
import { AbstractGVRaster } from '@/geo/layer/gv-layers/raster/abstract-gv-raster';
import { getLegendStyles } from '@/geo/utils/renderer/geoview-renderer';
import { CONST_LAYER_TYPES } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { TypeLegend } from '@/core/stores/store-interface-and-intial-values/layer-state';
import { TypeEsriImageLayerLegend } from '@/geo/layer/gv-layers/raster/gv-esri-image';
import { TypeJsonObject } from '@/api/config/types/config-types';
import { FetchEsriWorkerPool } from '@/core/workers/fetch-esri-worker-pool';
import { QueryParams } from '@/core/workers/fetch-esri-worker-script';
import { GeometryApi } from '@/geo/layer/geometry/geometry';
import { NoFeaturesPropertyError } from '@/core/exceptions/geoview-exceptions';
import { RequestAbortedError } from '@/core/exceptions/core-exceptions';

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

  // Override the hit tolerance for a GVEsriDynamic layer
  override hitTolerance: number = GVEsriDynamic.DEFAULT_HIT_TOLERANCE;

  /**
   * Constructs a GVEsriDynamic layer to manage an OpenLayer layer.
   * @param {string} mapId - The map id
   * @param {ImageArcGISRest} olSource - The OpenLayer source.
   * @param {EsriDynamicLayerEntryConfig} layerConfig - The layer configuration.
   */
  public constructor(mapId: string, olSource: ImageArcGISRest, layerConfig: EsriDynamicLayerEntryConfig) {
    super(mapId, olSource, layerConfig);

    // TODO: Performance - Do we need worker pool or one worker per layer is enough. If a worker is already working we should terminate it
    // TO.DOCONT: and use the abort controller to cancel the fetch and start a new one. So every esriDynamic layer has it's own worker.
    // Setup the worker pool
    this.#fetchWorkerPool = new FetchEsriWorkerPool();
    this.#fetchWorkerPool
      .init()
      .then(() => logger.logTraceCore('Worker pool for fetch ESRI initialized'))
      .catch((err) => logger.logError('Worker pool error', err));

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

    // Set the image spatial reference to the service source - performance is better when open layers does the conversion
    // Older versions of ArcGIS Server are not properly converted, so this is only used for version 10.8+
    const version = layerConfig.getLayerMetadata()?.currentVersion as number;
    const sourceSr =
      layerConfig.getLayerMetadata()?.sourceSpatialReference?.latestWkid || layerConfig.getLayerMetadata()?.sourceSpatialReference?.wkid;
    if (sourceSr && version && version >= 10.8) imageLayerOptions.source?.updateParams({ imageSR: sourceSr });

    // Init the layer options with initial settings
    AbstractGVRaster.initOptionsWithInitialSettings(imageLayerOptions, layerConfig);

    // Create and set the OpenLayer layer
    this.olLayer = new ImageLayer(imageLayerOptions);
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
        this.emitMessage('error.layer.notAbleToQuery', [this.getLayerName()!], 'error');
        break;
      default:
        break;
    }
  }

  /**
   * Overrides the get of the OpenLayers Layer
   * @returns {ImageLayer<ImageArcGISRest>} The OpenLayers Layer
   */
  override getOLLayer(): ImageLayer<ImageArcGISRest> {
    // Call parent and cast
    return super.getOLLayer() as ImageLayer<ImageArcGISRest>;
  }

  /**
   * Overrides the get of the OpenLayers Layer Source
   * @returns {ImageArcGISRest} The OpenLayers Layer Source
   */
  override getOLSource(): ImageArcGISRest {
    // Get source from OL
    return super.getOLSource() as ImageArcGISRest;
  }

  /**
   * Overrides the get of the layer configuration associated with the layer.
   * @returns {EsriDynamicLayerEntryConfig} The layer configuration or undefined if not found.
   */
  override getLayerConfig(): EsriDynamicLayerEntryConfig {
    // Call parent and cast
    return super.getLayerConfig() as EsriDynamicLayerEntryConfig;
  }

  /**
   * Overrides the return of the field type from the metadata. If the type can not be found, return 'string'.
   * @param {string} fieldName - The field name for which we want to get the type.
   * @returns {TypeOutfieldsType} The type of the field.
   */
  protected override getFieldType(fieldName: string): TypeOutfieldsType {
    // Redirect
    return esriGetFieldType(this.getLayerConfig(), fieldName);
  }

  /**
   * Overrides the return of the domain of the specified field.
   * @param {string} fieldName - The field name for which we want to get the domain.
   * @returns {null | codedValueType | rangeDomainType} The domain of the field.
   */
  protected override getFieldDomain(fieldName: string): null | codedValueType | rangeDomainType {
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
    const jsonResponse = await this.fetchAllFeatureInfoWithWorker(layerConfig);

    // If was aborted
    // Explicitely checking the abort condition here, after the fetch in the worker, because we can't send the abortController in a fetch happening inside a worker.
    if (abortController?.signal.aborted) {
      // Raise error
      throw new RequestAbortedError(abortController.signal);
    }

    // If any features
    if (jsonResponse.features) {
      // Parse the JSON response and create features
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const features = (jsonResponse.features as TypeJsonObject[]).map((featureData: any) => {
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
   * Query all features with a web worker
   * @param {EsriDynamicLayerEntryConfig} layerConfig - The layer config
   * @returns {TypeJsonObject} A promise of esri response for query.
   */
  fetchAllFeatureInfoWithWorker(layerConfig: EsriDynamicLayerEntryConfig): Promise<TypeJsonObject> {
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
    return this.#fetchWorkerPool.process(params);
  }

  /**
   * Overrides the return of feature information at a given pixel location.
   * @param {Pixel} location - The pixel coordinate that will be used by the query.
   * @param {boolean} queryGeometry - Whether to include geometry in the query, default is true.
   * @param {AbortController?} abortController - The optional abort controller.
   * @returns {Promise<TypeFeatureInfoEntry[] | undefined | null>} A promise of an array of TypeFeatureInfoEntry[].
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
   * Query the features geometry with a web worker
   * @param {EsriDynamicLayerEntryConfig} layerConfig - The layer config
   * @param {number[]} objectIds - Array of object IDs to query
   * @param {boolean} queryGeometry - Whether to include geometry in the query
   * @param {number} projection - The spatial reference ID for the output
   * @param {number} maxAllowableOffset - The maximum allowable offset for geometry simplification
   * @returns {TypeJsonObject} A promise of esri response for query.
   */
  fetchFeatureInfoGeometryWithWorker(
    layerConfig: EsriDynamicLayerEntryConfig,
    objectIds: number[],
    queryGeometry: boolean,
    projection: number,
    maxAllowableOffset: number
  ): Promise<TypeJsonObject> {
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
    return this.#fetchWorkerPool.process(params);
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
    // GV.CONT: This happen with max extent as initial extent and 3978 projection. If we use only the LL and UP corners for the repojection it works
    const mapViewer = this.getMapViewer();
    const mapExtent = mapViewer.getView().calculateExtent();
    const boundsLL = mapViewer.convertCoordinateMapProjToLngLat([mapExtent[0], mapExtent[1]]);
    const boundsUR = mapViewer.convertCoordinateMapProjToLngLat([mapExtent[2], mapExtent[3]]);
    const extent = { xmin: boundsLL[0], ymin: boundsLL[1], xmax: boundsUR[0], ymax: boundsUR[1] };
    const layerDefs = this.getOLSource()?.getParams()?.layerDefs || '';
    const size = mapViewer.map.getSize()!;

    // Identify query to get oid features value and attributes, at this point we do not query geometry
    identifyUrl =
      `${identifyUrl}identify?f=json&tolerance=${this.hitTolerance}` +
      `&mapExtent=${extent.xmin},${extent.ymin},${extent.xmax},${extent.ymax}` +
      `&imageDisplay=${size[0]},${size[1]},96` +
      `&layers=visible:${layerConfig.layerId}` +
      `&layerDefs=${encodeURI(layerDefs)}` +
      `&geometryType=esriGeometryPoint&geometry=${lnglat[0]},${lnglat[1]}` +
      `&returnGeometry=false&sr=4326&returnFieldName=true`;

    // If it takes more then 10 seconds it means the server is unresponsive and we should not continue. This will throw an error...
    const identifyJsonResponse = await Fetch.fetchWithTimeout<TypeJsonObject>(identifyUrl, undefined, 10000);

    // If no features identified return []
    if (identifyJsonResponse.results.length === 0) return [];

    // Extract OBJECTIDs
    const oidField = layerConfig.source.featureInfo.outfields
      ? layerConfig.source.featureInfo.outfields.filter((field) => field.type === 'oid')[0].name
      : 'OBJECTID';
    const objectIds = (identifyJsonResponse.results as TypeJsonObject[]).map((result) =>
      String(result.attributes[oidField]).replace(',', '')
    );

    // Get meters per pixel to set the maxAllowableOffset to simplify return geometry
    const maxAllowableOffset = queryGeometry
      ? getMetersPerPixel(
          mapViewer.getMapState().currentProjection as TypeValidMapProjectionCodes,
          mapViewer.getView().getResolution() || 7000,
          lnglat[1]
        )
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
    const features = new EsriJSON().readFeatures({ features: identifyJsonResponse.results }) as Feature<Geometry>[];
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
      // TO.DOCONT: We should carry this extra promise with the first response so that the caller of 'getFeatureInfoAtLongLat' can know
      // TO.DOCONT: when the geometries will be done fetching on the features that they've already received as 'resolved'. Carrying the promise
      // TO.DOCONT: would also allow us to more gracefully handle when the fetching of the geometries has failed, because without a
      // TO.DOCONT: handle on the promise, the caller of 'getFeatureInfoAtLongLat' have no idea of the 'fetchFeatureInfoGeometryWithWorker.catch()' here.
      // TO.DOCONT: However, this would mean change the 'getFeatureInfoAtLongLat' function signature with regards to its return type (and affect ALL other sibling classes)

      // TODO: Performance - We may need to use chunk and process 50 geom at a time. When we query 500 features (points) we have CORS issue with
      // TO.DOCONT: the esri query (was working with identify). But identify was failing on huge geometry...
      this.fetchFeatureInfoGeometryWithWorker(
        layerConfig,
        objectIds.map(Number),
        true,
        mapViewer.getMapState().currentProjection,
        maxAllowableOffset
      )
        .then((featuresJSON) => {
          (featuresJSON.features as TypeJsonObject[]).forEach((feat: TypeJsonObject, index: number) => {
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
            const newGeom: Geometry | null =
              geomType.length > 0
                ? (GeometryApi.createGeometryFromType(geomType[0] as TypeStyleGeometry, coordinates) as unknown as Geometry)
                : null;

            // TODO: Performance - We will need a trigger to refresh the higight and details panel (for zoom button) when extent and
            // TO.DOCONT: is applied. Sometimes the delay is too big so we need to change tab or layer in layer list to trigger the refresh
            // We assume order of arrayOfFeatureInfoEntries is the same as featuresJSON.features as they are processed in the same order
            const entry = arrayOfFeatureInfoEntries![index];
            if (newGeom !== null && entry.geometry && entry.geometry instanceof Feature) {
              entry.extent = newGeom.getExtent();
              entry.geometry.setGeometry(newGeom);
            }
          });
        })
        .catch((err) => {
          // Log
          logger.logError('The Worker to get the feature geometries has failed', err);
        });

    return arrayOfFeatureInfoEntries;
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
   * Gets the layer view filter. The filter is derived from the uniqueValue or the classBreak visibility flags and a layerFilter
   * associated to the layer.
   * @returns {string} The filter associated to the layer
   */
  getViewFilter(): string {
    const layerConfig = this.getLayerConfig();
    const { layerFilter } = layerConfig;

    // Get the style
    const style = this.getStyle();

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
        return layerFilter || '(1=1)';
      }
      if (styleSettings.type === 'uniqueValue') {
        setAllUndefinedVisibilityFlagsToYes(styleSettings);
        if (featuresAreAllVisible(styleSettings.info as { visible: boolean }[]))
          return `(1=1)${layerFilter ? ` and (${layerFilter})` : ''}`;

        // This section of code optimize the query to reduce it at it shortest expression.
        const fieldOfTheSameValue = GVEsriDynamic.#countFieldOfTheSameValue(styleSettings);
        const fieldOrder = GVEsriDynamic.#sortFieldOfTheSameValue(styleSettings, fieldOfTheSameValue);
        const queryTree = GVEsriDynamic.#getQueryTree(styleSettings, fieldOfTheSameValue, fieldOrder);
        // TODO: Refactor - Layers refactoring. Use the source.featureInfo from the layer, not the layerConfig anymore, here and below
        const query = this.#buildQuery(queryTree, 0, fieldOrder, styleSettings, layerConfig.source.featureInfo!);
        return `${query}${layerFilter ? ` and (${layerFilter})` : ''}`;
      }

      if (styleSettings.type === 'classBreaks') {
        setAllUndefinedVisibilityFlagsToYes(styleSettings);
        if (featuresAreAllVisible(styleSettings.info as { visible: boolean }[]))
          return `(1=1)${layerFilter ? ` and (${layerFilter})` : ''}`;

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
                    styleSettings.info[0].values[0]!,
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
    return '(1=1)';
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
  #buildQuery(
    queryTree: TypeQueryTree,
    level: number,
    fieldOrder: number[],
    styleSettings: TypeLayerStyleSettings,
    sourceFeatureInfo: TypeFeatureInfoLayerConfig
  ): string {
    let queryString = styleSettings.info[styleSettings.info.length - 1].visible !== false && !level ? 'not (' : '(';
    for (let i = 0; i < queryTree.length; i++) {
      const value = GVEsriDynamic.#formatFieldValue(styleSettings.fields[fieldOrder[level]], queryTree[i].fieldValue, sourceFeatureInfo);
      // The nextField array is not empty, then it is is not the last field
      if (queryTree[i].nextField.length) {
        // If i > 0 (true) then we add a OR clause
        if (i) queryString = `${queryString} or `;
        // Add to the query the 'fieldName = value and ' + the result of the recursive call to buildQuery using the next field and level
        queryString = `${queryString}${styleSettings.fields[fieldOrder[level]]} = ${value} and ${this.#buildQuery(
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

  /**
   * Overrides the fetching of the legend for an Esri Dynamic layer.
   * @returns {Promise<TypeLegend | null>} The legend of the layer or null.
   */
  override async onFetchLegend(): Promise<TypeLegend | null> {
    const layerConfig = this.getLayerConfig();
    // Only raster layers need the alternate code
    if (layerConfig.getLayerMetadata()?.type !== 'Raster Layer') return super.onFetchLegend();

    try {
      if (!layerConfig) return null;
      const legendUrl = `${layerConfig.geoviewLayerConfig.metadataAccessPath}/legend?f=json`;
      const legendJson = await Fetch.fetchJsonAs<TypeEsriImageLayerLegend>(legendUrl);

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
    } catch (error) {
      logger.logError(`Get Legend for ${layerConfig.layerPath} error`, error);
      return null;
    }
  }

  /**
   * Overrides when the style should be set by the fetched legend.
   * @param legend
   */
  override onSetStyleAccordingToLegend(legend: TypeLegend): void {
    // Set the style
    this.setStyle(legend.styleConfig!);
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
   * @param {string} filter - An optional filter to be used in place of the getViewFilter value.
   * @param {boolean} combineLegendFilter - Flag used to combine the legend filter and the filter together (default: true)
   */
  applyViewFilter(filter: string, combineLegendFilter: boolean = true): void {
    // Log
    logger.logTraceCore('GV-ESRI-DYNAMIC - applyViewFilter', this.getLayerPath());

    const layerConfig = this.getLayerConfig();
    const olLayer = this.getOLLayer();

    // TODO: Check - applyViewFilter implementation? Read the GV notes here
    // GV This code section differs from example GVEsriImage and GVWMS with the way the source is checked in the other classes implementation
    // GV Also, in this implementation, the layerConfig.layerFilter is updated with the timmed filter, not in the other classes implementations
    // GV ..which furthermore is actually only set in the `if (combineLegendFilter)` clause in the other classes implementations
    let filterValueToUse = filter.replaceAll(/\s{2,}/g, ' ').trim();
    layerConfig.legendFilterIsOff = !combineLegendFilter;
    layerConfig.layerFilter = filterValueToUse;
    if (combineLegendFilter) filterValueToUse = this.getViewFilter();

    // Parse the filter value to use
    filterValueToUse = parseDateTimeValuesEsriDynamic(filterValueToUse, this.getExternalFragmentsOrder());

    // Raster layer queries do not accept any layerDefs
    const layerDefs = layerConfig.getLayerMetadata()?.type === 'Raster Layer' ? '' : `{"${layerConfig.layerId}": "${filterValueToUse}"}`;
    olLayer?.getSource()?.updateParams({ layerDefs });
    olLayer?.changed();

    // Emit event
    this.emitLayerFilterApplied({
      filter: filterValueToUse,
    });
  }

  /**
   * Overrides the way to get the bounds for this layer type.
   * @param {OLProjection} projection - The projection to get the bounds into.
   * @param {number} stops - The number of stops to use to generate the extent.
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
   * @param {string} outfield - ID field to return for services that require a value in outfields.
   * @returns {Promise<Extent | undefined>} The extent of the features, if available.
   */
  override async getExtentFromFeatures(objectIds: string[], outfield?: string): Promise<Extent | undefined> {
    // Get url for service from layer entry config
    const layerEntryConfig = this.getLayerConfig();
    let baseUrl = layerEntryConfig.source.dataAccessPath;

    const idString = objectIds.join('%2C');
    if (baseUrl) {
      // Construct query
      if (!baseUrl.endsWith('/')) baseUrl += '/';

      // Use the returnExtentOnly=true to get only the extent of ids
      // TODO: We should return a real extent geometry Projection.transformAndDensifyExtent
      const outfieldQuery = outfield ? `&outFields=${outfield}` : '';
      const queryUrl = `${baseUrl}${layerEntryConfig.layerId}/query?&f=json&objectIds=${idString}${outfieldQuery}&returnExtentOnly=true`;

      try {
        const responseJson = await Fetch.fetchJsonAsObject(queryUrl);
        const { extent } = responseJson;

        const projectionExtent: OLProjection | undefined = Projection.getProjectionFromObj(extent.spatialReference);

        if (extent && projectionExtent) {
          const projExtent = Projection.transformExtentFromProj(
            [extent.xmin as number, extent.ymin as number, extent.xmax as number, extent.ymax as number],
            projectionExtent,
            this.getMapViewer().getProjection()
          );
          return validateExtent(projExtent, this.getMapViewer().getProjection().getCode());
        }
      } catch (error) {
        logger.logError(`Error fetching geometry from ${queryUrl}`, error);
      }

      // TODO: Cleanup - Keep for reference
      // // GV: outFields here is not wanted, it is included because some sevices require it in the query. It would be possible to use
      // // GV cont: OBJECTID, but it is not universal through the services, so we pass a value through.
      // const outfieldQuery = outfield ? `&outFields=${outfield}` : '';
      // let precision = '';
      // let allowableOffset = '';
      // if ((serviceMetaData?.layers as Array<TypeJsonObject>).every((layer) => layer.geometryType !== 'esriGeometryPoint')) {
      //   precision = '&geometryPrecision=1';
      //   allowableOffset = '&maxAllowableOffset=7937.5158750317505';
      // }
      // const queryUrl = `${baseUrl}${layerEntryConfig.layerId}/query?&f=json&where=&objectIds=${idString}${outfieldQuery}${precision}&returnGeometry=true${allowableOffset}`;

      // try {
      //   const responseJson = await fetchJson(queryUrl);

      //   // Convert response json to OL features
      //   const responseFeatures = new EsriJSON().readFeatures(
      //     { features: responseJson.features },
      //     {
      //       dataProjection: wkid ? `EPSG:${wkid}` : `EPSG:${responseJson.spatialReference.wkid}`,
      //       featureProjection: this.getMapViewer().getProjection().getCode(),
      //     }
      //   );

      //   // Determine max extent from features
      //   let calculatedExtent: Extent | undefined;
      //   responseFeatures.forEach((feature) => {
      //     const extent = feature.getGeometry()?.getExtent();

      //     if (extent) {
      //       // If extent has not been defined, set it to extent
      //       if (!calculatedExtent) calculatedExtent = extent;
      //       else getExtentUnion(calculatedExtent, extent);
      //     }
      //   });

      //   return calculatedExtent;
      // } catch (error) {
      //   logger.logError(`Error fetching geometry from ${queryUrl}`, error);
      // }
    }
    return undefined;
  }
}
