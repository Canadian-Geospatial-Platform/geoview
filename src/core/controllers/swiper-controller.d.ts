import type { Coordinate } from 'ol/coordinate';
import { AbstractMapViewerController } from '@/core/controllers/base/abstract-map-viewer-controller';
import type { ControllerRegistry } from '@/core/controllers/base/controller-registry';
import type { MapViewer } from '@/geo/map/map-viewer';
import { type TypeSwiperLayerEntry, type SwipeOrientation, type SwipeSide } from '@/core/stores/states/swiper-state';
/**
 * Controller responsible for time swiper interactions and
 * bridging the swiper state with the UI domain.
 */
export declare class SwiperController extends AbstractMapViewerController {
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
    constructor(mapViewer: MapViewer, controllerRegistry: ControllerRegistry);
    /**
     * Sets the swiper position, which determines the current position of the swipe comparison.
     *
     * @param position - The new swiper position, between 0 and 100.
     */
    setSwiperPosition(position: number): void;
    /**
     * Sets the layer paths for the swiper, which determines which layers are included in the swipe comparison.
     *
     * @param layerPaths - The array of layer paths to set for the swiper
     */
    setLayerPaths(layerPaths: string[]): void;
    /**
     * Sets the layer entries (path and side) for the swiper, replacing the current selection.
     *
     * @param entries - The layer entries to set, each with a layer path and its visible side
     */
    setLayers(entries: TypeSwiperLayerEntry[]): void;
    /**
     * Sets the visible side of the swiper bar for a given layer path.
     *
     * @param layerPath - The layer path to set the side for
     * @param side - The visible side of the swiper bar for this layer
     */
    setLayerSide(layerPath: string, side: SwipeSide): void;
    /**
     * Sets whether the swiper is interactive, i.e. whether the user can add/remove layers and set their side.
     *
     * @param interactive - Whether the swiper can be customized by the user
     */
    setInteractive(interactive: boolean): void;
    /**
     * Sets the swiper orientation, which determines the direction of the swipe comparison (e.g., vertical or horizontal).
     *
     * @param orientation - The swipe orientation to set
     */
    setOrientation(orientation: SwipeOrientation): void;
    /**
     * Adds a layer path to the swiper.
     *
     * @param layerPath - The layer path to add for the swiper
     * @param side - Optional visible side of the swiper bar for this layer. Defaults to the orientation's primary side (left/up)
     * @throws {LayerNotFoundError} When the layer couldn't be found at the given layer path
     */
    addLayerPath(layerPath: string, side?: SwipeSide): void;
    /**
     * Removes a layer path from the swiper.
     *
     * @param layerPath - The layer path to remove from the swiper
     * @throws {LayerNotFoundError} When the layer couldn't be found at the given layer path
     */
    removeLayerPath(layerPath: string): void;
    /**
     * Removes a layer path from the swiper if it exists.
     *
     * @param layerPath - The layer path to remove from the swiper
     */
    removeLayerPathIfExists(layerPath: string): void;
    /**
     * Removes all layer paths from the swiper, effectively deactivating the swiper for all layers.
     */
    removeAllLayerPaths(): void;
    /**
     * Checks if a pixel coordinate should be queried for a layer considering swiper clipping.
     *
     * @param layerPath - The layer path to check
     * @param pixelCoordinate - The pixel coordinate [x, y] relative to the map viewport
     * @param mapSize - The current map size [width, height] in pixels
     * @returns True if the coordinate should be queried (not clipped by swiper)
     */
    shouldQueryAtPixel(layerPath: string, pixelCoordinate: Coordinate, mapSize: number[]): boolean;
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
    isPointerOverSwiper(pixelCoordinate: Coordinate, mapSize: number[]): boolean;
}
//# sourceMappingURL=swiper-controller.d.ts.map