import type { IGeoviewState } from '@/core/stores/geoview-store';
import { getGeoViewStore } from '@/core/stores/stores-managers';
import { whenThisThen } from '@/core/utils/utilities';
import { GeoViewStoreOnMapNotFoundError } from '@/core/exceptions/geoview-exceptions';
import type { MapViewer } from '@/geo/map/map-viewer';
import type { LayerApi } from '@/geo/layer/layer';
import type { PluginsContainer } from '@/api/plugin/plugin-types';
import type { UIController } from '@/core/controllers/ui-controller';

export abstract class AbstractEventProcessor {
  /** The Map Viewers used by the processor and injected on initialization */
  static mapViewers: Record<string, MapViewer> = {};

  // #region PUBLIC METHODS

  /**
   *
   * @param mapId
   * @returns
   * @deprecated Shall not be used with the new controller model
   */
  static getMapViewer(mapId: string): MapViewer {
    return AbstractEventProcessor.mapViewers[mapId];
  }

  /**
   *
   * @param mapId
   * @returns
   * @deprecated Shall not be used with the new controller model
   */
  static getMapViewerLayerAPI(mapId: string): LayerApi {
    return this.getMapViewer(mapId).layer;
  }

  /**
   *
   * @param mapId
   * @returns
   * @deprecated Shall not be used with the new controller model
   */
  static getUIController(mapId: string): UIController {
    return this.getMapViewer(mapId).controllers.uiController;
  }

  /**
   * Shortcut to get the Map Viewer plugins instance for a given map id
   * This is use to reduce the use of api.getMapViewer(mapId).plugins and be more explicit
   * @param {string} mapId - map Id
   * @returns {PluginsContainer} The map plugins container
   * @static
   * @deprecated Shall not be used with the new controller model
   */
  static async getMapViewerPlugins(mapId: string): Promise<PluginsContainer> {
    await whenThisThen(() => this.getMapViewer(mapId));
    return this.getMapViewer(mapId).plugins;
  }

  /**
   * Initializes the map viewer in the processor, to be used later in the events processing.
   * @param mapId - The map id
   * @param mapViewer - The map viewer instance to initialize
   * @deprecated Shall not be used with the new controller model
   */
  static initializeMapViewer(mapId: string, mapViewer: MapViewer): void {
    // Keep the map viewer in the processor for later use in the events processing
    AbstractEventProcessor.mapViewers[mapId] = mapViewer;
  }

  // #endregion PUBLIC METHODS

  // #region STATIC METHODS

  /**
   * Shortcut to get the store state for a given map id
   *
   * @param {string} mapId - The map id to retreive the state for
   * @returns {IGeoviewState} the store state
   * @deprecated Should not be used with the new controller model, as the state should be accessed through the controller's adaptors.
   * This is still available for the moment for the event processors that are still used with the old model, but should be removed once all event processors are migrated to the new model.
   */
  protected static getState(mapId: string): IGeoviewState {
    // Get the GeoView Store for the given map
    const gvStore = getGeoViewStore(mapId);

    // If found
    if (gvStore) return gvStore.getState();

    // Not found
    throw new GeoViewStoreOnMapNotFoundError(mapId);
  }

  // #endregion STATIC METHODS
}
