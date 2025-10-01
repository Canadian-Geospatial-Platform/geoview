import { ISwiperState, SwipeOrientation } from '@/core/stores/store-interface-and-intial-values/swiper-state';
import { AbstractEventProcessor } from '@/api/event-processors/abstract-event-processor';
/**
 * Event processor focusing on interacting with the swiper state in the store.
 */
export declare class SwiperEventProcessor extends AbstractEventProcessor {
    /**
     * Checks if the Swiper plugin is iniitialized for the given map.
     * @param {string} mapId - The map id
     * @returns {boolean} True when the Swiper plugin is initialized.
     * @static
     */
    static isSwiperInitialized(mapId: string): boolean;
    /**
     * Shortcut to get the Swiper state for a given map id
     * @param {string} mapId - The mapId
     * @returns {ISwiperState} The Swiper state.
     * @throws {PluginStateUninitializedError} When the Swiper plugin is uninitialized.
     * @static
     */
    protected static getSwiperState(mapId: string): ISwiperState;
    /**
     * Sets the layer paths on which the swiper should be activated.
     *
     * @param {string} mapId - The map id.
     * @returns {string[]} The layer paths
     * @throws {PluginStateUninitializedError} When the Swiper plugin is uninitialized.
     * @static
     */
    static getLayerPaths(mapId: string): string[];
    /**
     * Sets the layer paths on which the swiper should be activated.
     *
     * @param {string} mapId - The map id
     * @param {string[]} layerPaths - The array of layer paths
     * @throws {PluginStateUninitializedError} When the Swiper plugin is uninitialized.
     * @static
     */
    static setLayerPaths(mapId: string, layerPaths: string[]): void;
    /**
     * Adds a swiper functionality to the specified map id and layer path
     * @param {string} mapId - The map ID
     * @param {string} layerPath - The layer path
     * @throws {PluginStateUninitializedError} When the Swiper plugin is uninitialized.
     * @static
     */
    static addLayerPath(mapId: string, layerPath: string): void;
    /**
     * Removes a swiper functionality for the specified map id and layer path
     * @param {string} mapId - The map ID
     * @param {string} layerPath - The layer path
     * @throws {PluginStateUninitializedError} When the Swiper plugin is uninitialized.
     * @static
     */
    static removeLayerPath(mapId: string, layerPath: string): void;
    /**
     * Removes the swiper functionality for all layer paths
     * @param {string} mapId - The map ID
     * @throws {PluginStateUninitializedError} When the Swiper plugin is uninitialized.
     * @static
     */
    static removeAll(mapId: string): void;
    /**
     * Sets the orientation of the swiper.
     * @param {string} mapId - The map IDh
     * @param {SwipeOrientation} orientation - The orientation to set
     * @throws {PluginStateUninitializedError} When the Swiper plugin is uninitialized.
     * @static
     */
    static setOrientation(mapId: string, orientation: SwipeOrientation): void;
}
//# sourceMappingURL=swiper-event-processor.d.ts.map