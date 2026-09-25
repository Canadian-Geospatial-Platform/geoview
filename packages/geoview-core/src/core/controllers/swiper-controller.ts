import type { Coordinate } from 'ol/coordinate';

import { AbstractMapViewerController } from '@/core/controllers/base/abstract-map-viewer-controller';
import type { ControllerRegistry } from '@/core/controllers/base/controller-registry';
import type { MapViewer } from '@/geo/map/map-viewer';
import {
  addStoreSwiperLayerPath,
  getStoreSwiperLayerPaths,
  getStoreSwiperLayerSides,
  getStoreSwiperOrientation,
  getStoreSwiperPosition,
  removeAllStoreSwipers,
  removeStoreSwiperLayerPath,
  setStoreSwiperInteractive,
  setStoreSwiperLayerPaths,
  setStoreSwiperLayers,
  setStoreSwiperLayerSide,
  setStoreSwiperOrientation,
  setStoreSwiperPosition,
  type TypeSwiperLayerEntry,
  type SwipeOrientation,
  type SwipeSide,
} from '@/core/stores/states/swiper-state';

/**
 * Controller responsible for time swiper interactions and
 * bridging the swiper state with the UI domain.
 */
export class SwiperController extends AbstractMapViewerController {
  /** Half-width (in pixels) of the band along the thin swiper bar where map hover queries are suppressed. */
  static readonly SWIPER_HOVER_SUPPRESS_BAND_BAR = 8;

  /** Half-size (in pixels) of the band around the centered swiper handle where map hover queries are suppressed. */
  static readonly SWIPER_HOVER_SUPPRESS_BAND_HANDLE = 30;

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
   * Sets the layer entries (path and side) for the swiper, replacing the current selection.
   *
   * @param entries - The layer entries to set, each with a layer path and its visible side
   */
  setLayers(entries: TypeSwiperLayerEntry[]): void {
    // Save in the store
    setStoreSwiperLayers(this.getMapId(), entries);
  }

  /**
   * Sets the visible side of the swiper bar for a given layer path.
   *
   * @param layerPath - The layer path to set the side for
   * @param side - The visible side of the swiper bar for this layer
   */
  setLayerSide(layerPath: string, side: SwipeSide): void {
    // Save in the store
    setStoreSwiperLayerSide(this.getMapId(), layerPath, side);
  }

  /**
   * Sets whether the swiper is interactive, i.e. whether the user can add/remove layers and set their side.
   *
   * @param interactive - Whether the swiper can be customized by the user
   */
  setInteractive(interactive: boolean): void {
    // Save in the store
    setStoreSwiperInteractive(this.getMapId(), interactive);
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
   * @param side - Optional visible side of the swiper bar for this layer. Defaults to the orientation's primary side (left/up)
   * @throws {LayerNotFoundError} When the layer couldn't be found at the given layer path
   */
  addLayerPath(layerPath: string, side?: SwipeSide): void {
    // Check if the layer exists on the map, this call throws when it doesn't exist
    this.getControllersRegistry().layerController.getGeoviewLayer(layerPath);

    // Resolve the side, defaulting to the orientation's primary side (left for vertical, up for horizontal)
    const resolvedSide = side ?? (getStoreSwiperOrientation(this.getMapId()) === 'vertical' ? 'left' : 'up');

    // Save in the store
    addStoreSwiperLayerPath(this.getMapId(), layerPath, resolvedSide);
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

    // Resolve the visible side for this layer, defaulting to the orientation's primary side (left/up)
    const layerSides = getStoreSwiperLayerSides(this.getMapId());
    const matchedPath = swiperLayerPaths.find((path) => layerPath.includes(path));
    const side: SwipeSide = (matchedPath ? layerSides[matchedPath] : undefined) ?? (swiperOrientation === 'vertical' ? 'left' : 'up');

    // Convert swiper position to pixel value on the relevant axis
    const orientationIndex = swiperOrientation === 'vertical' ? 0 : 1; // 0 for vertical (x-axis), 1 for horizontal (y-axis)
    const swiperPositionPixelValue = (mapSize[orientationIndex] * swiperPositionPercentage) / 100;

    // The primary side (left/up) reveals the layer before the bar; the secondary side (right/down) reveals it after the bar
    const isPrimarySide = side === 'left' || side === 'up';
    return isPrimarySide
      ? pixelCoordinate[orientationIndex] <= swiperPositionPixelValue
      : pixelCoordinate[orientationIndex] >= swiperPositionPixelValue;
  }

  /**
   * Checks whether a pixel coordinate is over the swiper bar/handle region.
   *
   * Used to suppress the map hover feature-info query when the cursor rests on the swiper, since the
   * bar overlays the map and the pointer would otherwise trigger a hover query on the layer beneath it.
   * Two bands are combined: a tight band along the whole thin bar, and a larger band localized to the
   * centered handle (which extends further on both axes).
   *
   * @param pixelCoordinate - The pixel coordinate [x, y] relative to the map viewport
   * @param mapSize - The current map size [width, height] in pixels
   * @returns True when the pixel is on or near the swiper bar or handle
   */
  isPointerOverSwiper(pixelCoordinate: Coordinate, mapSize: number[]): boolean {
    // Only relevant when the swiper is active
    const swiperLayerPaths = getStoreSwiperLayerPaths(this.getMapId());
    if (!swiperLayerPaths || swiperLayerPaths.length === 0) return false;

    // Divider axis (the swipe direction) and the perpendicular axis (where the handle is centered)
    const orientation = getStoreSwiperOrientation(this.getMapId());
    const positionPercentage = getStoreSwiperPosition(this.getMapId()); // 0-100
    const dividerAxis = orientation === 'vertical' ? 0 : 1;
    const perpendicularAxis = orientation === 'vertical' ? 1 : 0;
    const dividerPixel = (mapSize[dividerAxis] * positionPercentage) / 100;
    const perpendicularCenter = mapSize[perpendicularAxis] / 2;

    const distanceToDivider = Math.abs(pixelCoordinate[dividerAxis] - dividerPixel);
    const distanceToHandleCenter = Math.abs(pixelCoordinate[perpendicularAxis] - perpendicularCenter);

    // On the thin bar strip anywhere along its length
    const overBar = distanceToDivider <= SwiperController.SWIPER_HOVER_SUPPRESS_BAND_BAR;

    // On the handle: a larger band, but only near the centered handle on both axes
    const overHandle =
      distanceToDivider <= SwiperController.SWIPER_HOVER_SUPPRESS_BAND_HANDLE &&
      distanceToHandleCenter <= SwiperController.SWIPER_HOVER_SUPPRESS_BAND_HANDLE;

    return overBar || overHandle;
  }
}
