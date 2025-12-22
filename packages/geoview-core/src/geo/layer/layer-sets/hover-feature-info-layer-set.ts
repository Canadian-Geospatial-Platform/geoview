import type { Coordinate } from 'ol/coordinate';
import type { QueryType, TypeFeatureInfoEntry } from '@/api/types/map-schema-types';
import { AbstractGVLayer } from '@/geo/layer/gv-layers/abstract-gv-layer';
import type { AbstractBaseGVLayer } from '@/geo/layer/gv-layers/abstract-base-layer';
import type { PropagationType } from '@/geo/layer/layer-sets/abstract-layer-set';
import { AbstractLayerSet } from '@/geo/layer/layer-sets/abstract-layer-set';
import type { LayerApi } from '@/geo/layer/layer';
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';
import type {
  TypeHoverFeatureInfo,
  TypeHoverResultSet,
  TypeHoverResultSetEntry,
} from '@/core/stores/store-interface-and-intial-values/feature-info-state';
import { RequestAbortedError } from '@/core/exceptions/core-exceptions';
import { logger } from '@/core/utils/logger';

/**
 * A Layer-set working with the LayerApi at handling a result set of registered layers and synchronizing
 * events happening on them (in this case when the user hovers on the map) with a store
 * for UI updates.
 * @class HoverFeatureInfoLayerSet
 */
export class HoverFeatureInfoLayerSet extends AbstractLayerSet {
  /** The query type */
  static QUERY_TYPE: QueryType = 'at_pixel';

  /** The resultSet object as existing in the base class, retyped here as a TypeHoverFeatureInfoResultSet */
  declare resultSet: TypeHoverResultSet;

  // Keep all abort controllers per layer path
  #abortControllers: { [layerPath: string]: AbortController } = {};

  /**
   * The class constructor that instanciate a set of layer.
   * @param {LayerApi} layerApi - The layer Api to work with.
   */
  constructor(layerApi: LayerApi) {
    super(layerApi);

    // Register a handler when the map pointer moves
    layerApi.mapViewer.onMapPointerMove(() => {
      // This will execute immediately on every pointer move to clear the HoverFeatureInfo
      this.#propagateToStore(null);
    });

    // Register a handler when the map pointer stops
    layerApi.mapViewer.onMapPointerStop((mapViewer, payload) => {
      // Query
      this.queryLayers(payload.pixel).catch((error: unknown) => {
        // Log
        logger.logPromiseFailed('queryLayers in onMapPointerStop in HoverFeatureInfoLayerSet', error);
      });
    });
  }

  /**
   * Overrides the behavior to apply when a hover-feature-info-layer-set wants to check for condition to register a layer in its set.
   * @param {AbstractBaseGVLayer} layer - The layer
   * @returns {boolean} True when the layer should be registered to this hover-feature-info-layer-set.
   */
  protected override onRegisterLayerCheck(layer: AbstractBaseGVLayer): boolean {
    // Return if the layer is of queryable type and source is queryable
    return super.onRegisterLayerCheck(layer) && AbstractLayerSet.isQueryableType(layer) && AbstractLayerSet.isSourceQueryable(layer);
  }

  /**
   * Overrides the behavior to apply when a hover-feature-info-layer-set wants to register a layer in its set.
   * @param {AbstractBaseGVLayer} layer - The layer
   */
  protected override onRegisterLayer(layer: AbstractBaseGVLayer): void {
    // Call parent
    super.onRegisterLayer(layer);

    // Update the resultSet data
    const layerPath = layer.getLayerPath();
    this.resultSet[layerPath].queryStatus = 'processed';
    this.resultSet[layerPath].feature = undefined;
  }

  /**
   * Overrides the behavior to apply when propagating to the store
   * @param {TypeHoverResultSetEntry} resultSetEntry - The result set entry to propagate to the store
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected override onPropagateToStore(resultSetEntry: TypeHoverResultSetEntry, type: PropagationType): void {
    // Nothing to do here, hover's store only needs updating when a query happens
  }

  /**
   * Overrides the behavior to apply when deleting from the store
   * @param {string} layerPath - The layer path to delete from the store
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected override onDeleteFromStore(layerPath: string): void {
    // Nothing to do here, hover's store only needs updating when a query happens
  }

  /**
   * Queries the features at the provided coordinate for all the registered layers.
   * @param {Coordinate} coordinate - The pixel coordinate where to query the features when the queryType is 'at_pixel' or the map coordinate otherwise.
   * @param {QueryType} queryType - The query type, default: HoverFeatureInfoLayerSet.QUERY_TYPE.
   * @returns {Promise<TypeHoverResultSet>} The hover result set results.
   * @throws {LayerNotFoundError} When the layer couldn't be found at the given layer path.
   * @async
   */
  async queryLayers(coordinate: Coordinate, queryType: QueryType = HoverFeatureInfoLayerSet.QUERY_TYPE): Promise<TypeHoverResultSet> {
    // FIXME: Watch out for code reentrancy between queries!

    // Get the layer visible in order and filter orderedLayerPaths to only include paths that exist in resultSet
    const orderedLayerPaths = this.#getOrderedLayerPaths();
    const layersToQuery = orderedLayerPaths.filter((path) => path in this.resultSet);

    // Prepare to hold all promises of features in the loop below
    const allPromises: Promise<TypeFeatureInfoEntry[]>[] = [];

    // Reinitialize the resultSet
    // Loop on each layer path in the resultSet were there is a layer to query
    layersToQuery.forEach((layerPath) => {
      // Get the layer associated with the layer path
      const layer = this.layerApi.getGeoviewLayer(layerPath);

      // If layer was found and of right type
      if (layer instanceof AbstractGVLayer) {
        // If the layer is not hoverable, skip it
        if (!layer.getHoverable()) return;

        // Flag processing
        this.resultSet[layerPath].queryStatus = 'init';

        // If the layer path has an abort controller
        if (Object.keys(this.#abortControllers).includes(layerPath)) {
          // Abort it
          this.#abortControllers[layerPath].abort();
        }

        // Create an AbortController for the query
        this.#abortControllers[layerPath] = new AbortController();

        // Process query on results data
        const promiseResult = AbstractLayerSet.queryLayerFeatures(
          this.layerApi,
          layer,
          queryType,
          coordinate,
          false,
          this.#abortControllers[layerPath]
        );

        // Add the promise
        allPromises.push(promiseResult);

        // When the promise is done, propagate to store
        promiseResult
          .then((arrayOfRecords) => {
            if (arrayOfRecords.length) {
              const nameField = arrayOfRecords[0].nameField || Object.entries(arrayOfRecords[0].fieldInfo)[0]?.[0];
              const fieldInfo = arrayOfRecords[0].fieldInfo[nameField];

              this.resultSet[layerPath].feature = {
                featureIcon: arrayOfRecords[0].featureIcon,
                fieldInfo,
                geoviewLayerType: arrayOfRecords[0].geoviewLayerType,
                nameField,
              };
              this.resultSet[layerPath].queryStatus = 'processed';
            } else {
              this.resultSet[layerPath].feature = undefined;
            }

            // Check if this layer should update the store
            const shouldUpdate = orderedLayerPaths.slice(0, orderedLayerPaths.indexOf(layerPath)).every((higherLayerPath) => {
              const higherLayer = this.resultSet[higherLayerPath];
              // Allow update if higher layer:
              // - hasn't been processed yet (will overwrite later if needed)
              // - OR is processed but has no feature
              return (
                higherLayer.queryStatus === 'init' ||
                (higherLayer.queryStatus === 'processed' && !higherLayer.feature) ||
                higherLayer.queryStatus === 'error'
              );
            });

            // If it should update and there is a feature to propagate
            if (shouldUpdate && this.resultSet[layerPath].queryStatus === 'processed' && this.resultSet[layerPath].feature) {
              // Propagate to the store
              this.#propagateToStore(this.resultSet[layerPath].feature);
            }
          })
          .catch((error: unknown) => {
            // If aborted
            if (error instanceof RequestAbortedError) {
              // Log
              logger.logDebug('Query aborted and replaced by another one.. keep spinning..');
            } else {
              // If there's a resultSet for the layer path
              if (this.resultSet[layerPath]) {
                // Error
                this.resultSet[layerPath].queryStatus = 'error';
                this.resultSet[layerPath].feature = undefined;
              }

              // Log
              logger.logPromiseFailed('queryLayerFeatures in queryLayers in hoverFeatureInfoLayerSet', error);
            }
          });
      }
    });

    // Await for the promises to settle
    await Promise.allSettled(allPromises);

    // Return the results
    return this.resultSet;
  }

  /**
   * Clears the results for the provided layer path.
   * @param {string} layerPath - The layer path
   */
  clearResults(layerPath: string): void {
    // Edit the result set
    this.resultSet[layerPath].feature = undefined;

    // Propagate to store
    this.#propagateToStore(this.resultSet[layerPath].feature);
  }

  /**
   * Propagates the resultSetEntry to the store
   * @param {TypeHoverFeatureInfo} hoverFeatureInfo - The hover info to propagate to the store
   * @private
   */
  #propagateToStore(hoverFeatureInfo: TypeHoverFeatureInfo | undefined): void {
    // Propagate
    MapEventProcessor.setMapHoverFeatureInfo(this.getMapId(), hoverFeatureInfo);
  }

  /**
   * Get the ordered layer paths to query
   * @returns {string[]} The ordered layer paths to query
   */
  #getOrderedLayerPaths(): string[] {
    // Get the map layer order
    const mapLayerOrder = this.layerApi.mapViewer.getMapLayerOrderInfo().filter((layer) => layer.inVisibleRange);
    const resultSetLayers = new Set(Object.keys(this.resultSet));

    // Filter and order the layers that are in our resultSet
    return mapLayerOrder.map((layer) => layer.layerPath).filter((layerPath) => resultSetLayers.has(layerPath));
  }
}
