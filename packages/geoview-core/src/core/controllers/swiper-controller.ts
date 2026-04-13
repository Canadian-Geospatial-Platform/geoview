import { AbstractMapViewerController } from '@/core/controllers/base/abstract-map-viewer-controller';
import type { ControllerRegistry } from '@/core/controllers/base/controller-registry';
import type { MapViewer } from '@/geo/map/map-viewer';
import {
  addStoreSwiperLayerPath,
  removeAllStoreSwipers,
  removeStoreSwiperLayerPath,
  setStoreSwiperLayerPaths,
  setStoreSwiperOrientation,
  type SwipeOrientation,
} from '@/core/stores/store-interface-and-intial-values/swiper-state';

/**
 * Controller responsible for time swiper interactions and
 * bridging the swiper state with the UI domain.
 */
export class SwiperController extends AbstractMapViewerController {
  /**
   * Creates an instance of SwiperController.
   *
   * @param mapViewer - The map viewer instance to associate with this controller
   * @param controllerRegistry - The controller registry for accessing sibling controllers
   */
  // GV Leave the constructor here, because we'll likely need it soon to inject dependencies.
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(mapViewer: MapViewer, controllerRegistry: ControllerRegistry) {
    super(mapViewer, controllerRegistry);
  }

  /**
   * Sets the layer paths for the swiper, which determines which layers are included in the swipe comparison.
   *
   * @param layerPaths - The array of layer paths to set for the swiper
   */
  setLayerPaths(layerPaths: string[]): void {
    // Save in the store
    setStoreSwiperLayerPaths(this.getMapId(), layerPaths);
  }

  /**
   * Sets the swiper orientation, which determines the direction of the swipe comparison (e.g., vertical or horizontal).
   *
   * @param orientation - The swipe orientation to set
   */
  setOrientation(orientation: SwipeOrientation): void {
    // Save in the store
    setStoreSwiperOrientation(this.getMapId(), orientation);
  }

  /**
   * Adds a layer path to the swiper.
   *
   * @param layerPath - The layer path to add for the swiper
   * @throws {LayerNotFoundError} When the layer couldn't be found at the given layer path
   */
  addLayerPath(layerPath: string): void {
    // Check if the layer exists on the map, this call throws when it doesn't exist
    this.getControllersRegistry().layerController.getGeoviewLayer(layerPath);

    // Save in the store
    addStoreSwiperLayerPath(this.getMapId(), layerPath);
  }

  /**
   * Removes a layer path from the swiper.
   *
   * @param layerPath - The layer path to remove from the swiper
   * @throws {LayerNotFoundError} When the layer couldn't be found at the given layer path
   */
  removeLayerPath(layerPath: string): void {
    // Check if the layer exists on the map, this call throws when it doesn't exist
    this.getControllersRegistry().layerController.getGeoviewLayer(layerPath);

    // Remove from the store
    removeStoreSwiperLayerPath(this.getMapId(), layerPath);
  }

  /**
   * Removes a layer path from the swiper if it exists.
   *
   * @param layerPath - The layer path to remove from the swiper
   */
  removeLayerPathIfExists(layerPath: string): void {
    // Remove from the store
    removeStoreSwiperLayerPath(this.getMapId(), layerPath);
  }

  /**
   * Removes all layer paths from the swiper, effectively deactivating the swiper for all layers.
   */
  removeAllLayerPaths(): void {
    // Remove all layers from the store
    removeAllStoreSwipers(this.getMapId());
  }
}
