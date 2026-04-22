import type { Coordinate } from 'ol/coordinate';
import type { QueryType } from '@/api/types/map-schema-types';
import type { AbstractBaseGVLayer } from '@/geo/layer/gv-layers/abstract-base-layer';
import { AbstractLayerSet } from '@/geo/layer/layer-sets/abstract-layer-set';
import { setStoreMapHoverFeatureInfo } from '@/core/stores/store-interface-and-intial-values/map-state';
import { getStoreLayerInVisibleRangeLayerPaths } from '@/core/stores/store-interface-and-intial-values/layer-state';
import type { TypeHoverResultSet } from '@/core/stores/store-interface-and-intial-values/feature-info-state';
import { RequestAbortedError } from '@/core/exceptions/core-exceptions';
import { logger } from '@/core/utils/logger';

/**
 * A Layer-set working with the LayerSetController at handling a result set of registered layers and synchronizing
 * events happening on them (in this case when the user hovers on the map) with a store
 * for UI updates.
 */
export class HoverFeatureInfoLayerSet extends AbstractLayerSet {
  /** The query type */
  static QUERY_TYPE: QueryType = 'at_pixel';

  /** The abort controller shared by all layer queries for the current queryLayers call. */
  #abortController: AbortController = new AbortController();

  // #region OVERRIDES

  /**
   * Overrides the behavior to apply when a hover-feature-info-layer-set wants to check for condition to register a layer in its set.
   *
   * @param layer - The layer
   * @returns True when the layer should be registered to this hover-feature-info-layer-set
   */
  protected override onRegisterLayerCheck(layer: AbstractBaseGVLayer): boolean {
    // Return if the layer is of queryable type and source is queryable
    return super.onRegisterLayerCheck(layer) && AbstractLayerSet.isQueryableType(layer) && AbstractLayerSet.isSourceQueryable(layer);
  }

  /**
   * Overrides the behavior to apply when deleting from the store.
   *
   * @param layerPath - The layer path to delete from the store
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected override onDeleteFromStore(layerPath: string): void {
    // Nothing to do here, hover's store only needs updating when a query happens
  }

  // #endregion OVERRIDES

  // #region PUBLIC METHODS

  /**
   * Queries the features at the provided coordinate for all the registered layers.
   *
   * @param coordinate - The pixel coordinate where to query the features when the queryType is 'at_pixel' or the map coordinate otherwise
   * @param queryType - The query type, either 'at_pixel' or 'all_features'. Defaults to the HoverFeatureInfoLayerSet.QUERY_TYPE static property value ('at_pixel').
   * @returns A promise that resolves with the hover result set results
   */
  async queryLayers(coordinate: Coordinate, queryType: QueryType = HoverFeatureInfoLayerSet.QUERY_TYPE): Promise<TypeHoverResultSet> {
    // Abort all in-flight queries from a previous call and create a fresh controller for this call
    this.#abortController.abort();
    this.#abortController = new AbortController();
    const { signal } = this.#abortController;

    // The result set to be returned
    const querySet: TypeHoverResultSet = {};

    // Get the layer visible in order and filter orderedLayerPaths to only include paths that exist in resultSet
    const orderedLayerPaths = this.#getOrderedLayerPaths();

    // Initialize the resultSet
    orderedLayerPaths.forEach((layerPath) => {
      // Init the result set entry for the layer path
      querySet[layerPath] = {
        layerPath: layerPath,
        queryStatus: 'init',
        feature: undefined,
      };
    });

    // Query each hoverable layer and collect the promises
    const allPromises = orderedLayerPaths
      .filter((layerPath) => this.layerDomain.getGeoviewLayerRegular(layerPath).getHoverable())
      .map((layerPath) => this.#queryLayerAndProcess(layerPath, coordinate, queryType, querySet, orderedLayerPaths, signal));

    // Await for the promises to settle
    await Promise.allSettled(allPromises);

    // Return the results
    return querySet;
  }

  /**
   * Clears the results immediately for all.
   */
  clearResults(): void {
    // This will execute immediately on every pointer move to clear the HoverFeatureInfo
    setStoreMapHoverFeatureInfo(this.getMapId(), null);
  }

  // #endregion PUBLIC METHODS

  // #region PRIVATE METHODS

  /**
   * Queries a single layer's features and processes the hover results.
   *
   * @param layerPath - The layer path to query
   * @param coordinate - The coordinate where to query the features
   * @param queryType - The query type
   * @param querySet - The result set to update with the query results
   * @param orderedLayerPaths - The ordered layer paths used to determine store update priority
   * @param signal - The abort signal for this query call
   */
  async #queryLayerAndProcess(
    layerPath: string,
    coordinate: Coordinate,
    queryType: QueryType,
    querySet: TypeHoverResultSet,
    orderedLayerPaths: string[],
    signal: AbortSignal
  ): Promise<void> {
    // Get the layer associated with the layer path
    const layer = this.layerDomain.getGeoviewLayerRegular(layerPath);

    try {
      // Process query on results data using the shared abort controller for this call
      const promiseResult = await this.queryLayerFeatures(layer, queryType, coordinate, false, this.#abortController);

      // If a newer queryLayers call has aborted this one, discard stale results
      if (signal.aborted) return;

      // Get the array of records in the results
      const arrayOfRecords = promiseResult.results;
      if (arrayOfRecords.length) {
        // Here we're explicitely typing it as string | undefined, because the object fieldInfo could be empty and have no first property
        // and without '"noUncheckedIndexedAccess": true' in the tsconfig, this is allowed.. this explicit way is safer so that 'nameField' is typed 'string | undefined'
        const nameField = arrayOfRecords[0].nameField ?? (Object.keys(arrayOfRecords[0].fieldInfo)[0] as string | undefined);
        const fieldInfo = nameField ? arrayOfRecords[0].fieldInfo[nameField] : undefined;

        // eslint-disable-next-line no-param-reassign
        querySet[layerPath].queryStatus = 'processed';

        // eslint-disable-next-line no-param-reassign
        querySet[layerPath].feature = {
          layerPath,
          featureIcon: arrayOfRecords[0].featureIcon,
          fieldInfo,
          geoviewLayerType: arrayOfRecords[0].geoviewLayerType,
          nameField,
        };
      }

      // Check if this layer should update the store
      const shouldUpdate = orderedLayerPaths.slice(0, orderedLayerPaths.indexOf(layerPath)).every((higherLayerPath) => {
        const higherLayer = querySet[higherLayerPath];
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
      if (shouldUpdate && querySet[layerPath].queryStatus === 'processed' && querySet[layerPath].feature) {
        // This will execute immediately on every pointer move to clear the HoverFeatureInfo
        setStoreMapHoverFeatureInfo(this.getMapId(), querySet[layerPath].feature);
      }
    } catch (error: unknown) {
      // If aborted
      if (error instanceof RequestAbortedError || signal.aborted) {
        // Log
        logger.logDebug('Query aborted and replaced by another one.. keep spinning..');
      } else {
        // Log
        logger.logPromiseFailed('queryLayerFeatures in queryLayers in hoverFeatureInfoLayerSet', error);
      }
    }
  }

  /**
   * Gets the ordered layer paths to query.
   *
   * @returns The ordered layer paths to query
   */
  #getOrderedLayerPaths(): string[] {
    // Get the map layer order
    const layerPathsInVisibleRange = getStoreLayerInVisibleRangeLayerPaths(this.getMapId());
    const registeredLayerPaths = this.getRegisteredLayerPaths();

    // Filter and order the layers that are in our resultSet
    return layerPathsInVisibleRange.filter((layerPath) => registeredLayerPaths.includes(layerPath));
  }

  // #endregion PRIVATE METHODS
}
