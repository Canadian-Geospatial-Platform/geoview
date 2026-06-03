import type { Coordinate } from 'ol/coordinate';

import { AbstractMapViewerController } from '@/core/controllers/base/abstract-map-viewer-controller';
import type { ControllerRegistry } from '@/core/controllers/base/controller-registry';
import type { MapViewer } from '@/geo/map/map-viewer';
import {
  addStoreSwiperLayerPath,
  getStoreSwiperLayerPaths,
  getStoreSwiperOrientation,
  getStoreSwiperPosition,
  removeAllStoreSwipers,
  removeStoreSwiperLayerPath,
  setStoreSwiperLayerPaths,
  setStoreSwiperOrientation,
  setStoreSwiperPosition,
  type SwipeOrientation,
} from '@/core/stores/states/swiper-state';

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
   * Sets the swiper position, which determines the current position of the swipe comparison.
   *
   * @param position - The new swiper position, between 0 and 100.
   */
  setSwiperPosition(position: number): void {
    setStoreSwiperPosition(this.getMapId(), position);
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

  /**
   * Checks if a pixel coordinate should be queried for a layer considering swiper clipping.
   *
   * @param layerPath - The layer path to check
   * @param pixelCoordinate - The pixel coordinate [x, y] relative to the map viewport
   * @param mapSize - The current map size [width, height] in pixels
   * @returns True if the coordinate should be queried (not clipped by swiper)
   */
  shouldQueryAtPixel(layerPath: string, pixelCoordinate: Coordinate, mapSize: number[]): boolean {
    // Get swiper configuration from store
    const swiperLayerPaths = getStoreSwiperLayerPaths(this.getMapId());

    // No layers configured for swiping
    if (!swiperLayerPaths || swiperLayerPaths.length === 0) {
      return true;
    }

    // Check if this layer is affected by swiper
    const isLayerSwiped = swiperLayerPaths.some((path) => layerPath.includes(path));
    if (!isLayerSwiped) {
      return true;
    }

    // Get swiper state from store
    const swiperOrientation = getStoreSwiperOrientation(this.getMapId());
    const swiperPositionPercentage = getStoreSwiperPosition(this.getMapId()); // 0-100

    // Check if coordinate is in visible region
    const orientationIndex = swiperOrientation === 'vertical' ? 0 : 1; // 0 for vertical (x-axis), 1 for horizontal (y-axis)
    const swiperPositionPixelValue = (mapSize[orientationIndex] * swiperPositionPercentage) / 100; // Convert swiper position to pixel value
    return pixelCoordinate[orientationIndex] <= swiperPositionPixelValue;
  }
}
