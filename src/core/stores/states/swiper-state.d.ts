import type { TypeGetStore, TypeSetStore } from '@/core/stores/geoview-store';
/**
 * Represents the Swiper Zustand store slice.
 *
 * Manages state for the swiper including layer paths and orientation.
 */
export interface ISwiperState {
    /** The list of layer paths currently participating in the swiper. */
    layerPaths: string[];
    /** The current orientation of the swiper divider. */
    orientation: SwipeOrientation;
    /** Actions to mutate the Swiper state. */
    actions: {
        /** Sets the full list of layer paths for the swiper. */
        setLayerPaths: (layerPaths: string[]) => void;
        /** Sets the swiper orientation. */
        setOrientation: (orientation: SwipeOrientation) => void;
    };
}
/**
 * Initializes a Swiper state object.
 *
 * @param set - The store set callback function
 * @param get - The store get callback function
 * @returns The Swiper state object
 */
export declare function initializeSwiperState(set: TypeSetStore, get: TypeGetStore): ISwiperState;
/**
 * Checks whether the Swiper plugin state has been initialized for the given map.
 *
 * @param mapId - The map id to check.
 * @returns True if the Swiper state is initialized, false otherwise.
 */
export declare const isStoreSwiperInitialized: (mapId: string) => boolean;
/**
 * Gets the swiper layer paths from the store.
 *
 * @param mapId - The map id to read swiper layer paths from.
 * @returns The array of layer paths participating in the swiper.
 * @throws {PluginStateUninitializedError} When the Swiper plugin is uninitialized.
 */
export declare const getStoreSwiperLayerPaths: (mapId: string) => string[];
/** Hooks the swiper layer paths from the store. */
export declare const useStoreSwiperLayerPaths: () => string[];
/**
 * Gets the swiper orientation from the store.
 *
 * @param mapId - The map id to read swiper layer paths from.
 * @returns The array of layer paths participating in the swiper.
 * @throws {PluginStateUninitializedError} When the Swiper plugin is uninitialized.
 */
export declare const getStoreSwiperOrientation: (mapId: string) => SwipeOrientation;
/** Hooks the swiper orientation from the store. */
export declare const useStoreSwiperOrientation: () => SwipeOrientation;
/**
 * Sets the swiper layer paths in the store.
 *
 * @param mapId - The map id.
 * @param layerPaths - The layer paths to set.
 * @throws {PluginStateUninitializedError} When the Swiper plugin is uninitialized.
 */
export declare const setStoreSwiperLayerPaths: (mapId: string, layerPaths: string[]) => void;
/**
 * Sets the swiper orientation in the store.
 *
 * @param mapId - The map id.
 * @param orientation - The new swiper orientation.
 * @throws {PluginStateUninitializedError} When the Swiper plugin is uninitialized.
 */
export declare const setStoreSwiperOrientation: (mapId: string, orientation: SwipeOrientation) => void;
/**
 * Adds a single layer path to the swiper in the store, if not already present.
 *
 * @param mapId - The map id.
 * @param layerPath - The layer path to add.
 * @throws {PluginStateUninitializedError} When the Swiper plugin is uninitialized.
 */
export declare const addStoreSwiperLayerPath: (mapId: string, layerPath: string) => void;
/**
 * Removes a single layer path from the swiper in the store.
 *
 * @param mapId - The map id.
 * @param layerPath - The layer path to remove.
 * @throws {PluginStateUninitializedError} When the Swiper plugin is uninitialized.
 */
export declare const removeStoreSwiperLayerPath: (mapId: string, layerPath: string) => void;
/**
 * Removes all layer paths from the swiper, effectively clearing the swiper.
 *
 * @param mapId - The map id.
 * @throws {PluginStateUninitializedError} When the Swiper plugin is uninitialized.
 */
export declare const removeAllStoreSwipers: (mapId: string) => void;
export type SwipeOrientation = 'horizontal' | 'vertical';
//# sourceMappingURL=swiper-state.d.ts.map