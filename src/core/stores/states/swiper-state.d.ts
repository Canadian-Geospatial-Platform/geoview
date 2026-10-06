import type { TypeGetStore, TypeSetStore } from '@/core/stores/geoview-store';
/** A single layer entry participating in the swiper, with its visible side. */
export type TypeSwiperLayerEntry = {
    /** The layer path participating in the swiper. */
    layerPath: string;
    /** The visible side of the swiper bar for this layer. */
    side: SwipeSide;
};
/** Represents the persisted Swiper package configuration. */
export type TypeSwiperConfig = {
    /** The orientation of the swiper divider. */
    orientation: SwipeOrientation;
    /** Whether users can customize the swiper from layer settings. */
    interactive: boolean;
    /** The configured layers and their visible sides. */
    layers: TypeSwiperLayerEntry[];
};
/**
 * Represents the Swiper Zustand store slice.
 *
 * Manages state for the swiper including layer paths and orientation.
 */
export interface ISwiperState {
    /** The position of the swiper divider, between 0 and 100. */
    swiperPosition: number;
    /** The list of layer paths currently participating in the swiper. */
    layerPaths: string[];
    /** The visible side of the swiper bar for each participating layer path. */
    layerSides: Record<string, SwipeSide>;
    /** The current orientation of the swiper divider. */
    orientation: SwipeOrientation;
    /** Whether the user can add/remove layers and set their side from the layer settings panel. */
    interactive: boolean;
    /** Actions to mutate the Swiper state. */
    actions: {
        /** Sets the swiper position. */
        setSwiperPosition: (position: number) => void;
        /** Sets the full list of layer paths for the swiper. */
        setLayerPaths: (layerPaths: string[]) => void;
        /** Sets the visible side for each participating layer path. */
        setLayerSides: (layerSides: Record<string, SwipeSide>) => void;
        /** Sets the swiper orientation. */
        setOrientation: (orientation: SwipeOrientation) => void;
        /** Sets whether the swiper is interactive (user can customize it). */
        setInteractive: (interactive: boolean) => void;
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
 * Gets the swiper position from the store.
 *
 * @param mapId - The map id to read swiper position from.
 * @returns The swiper position as a number.
 * @throws {PluginStateUninitializedError} When the Swiper plugin is uninitialized.
 */
export declare const getStoreSwiperPosition: (mapId: string) => number;
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
 * Gets the swiper visible sides per layer path from the store.
 *
 * @param mapId - The map id to read swiper layer sides from.
 * @returns The map of layer path to its visible side.
 * @throws {PluginStateUninitializedError} When the Swiper plugin is uninitialized.
 */
export declare const getStoreSwiperLayerSides: (mapId: string) => Record<string, SwipeSide>;
/** Hooks the swiper visible sides per layer path from the store. */
export declare const useStoreSwiperLayerSides: () => Record<string, SwipeSide>;
/**
 * Gets whether the swiper is interactive from the store.
 *
 * @param mapId - The map id to read the swiper interactive flag from.
 * @returns True when the user can customize the swiper.
 * @throws {PluginStateUninitializedError} When the Swiper plugin is uninitialized.
 */
export declare const getStoreSwiperInteractive: (mapId: string) => boolean;
/** Hooks whether the swiper is interactive from the store, returning false when the Swiper plugin is not loaded. */
export declare const useStoreSwiperInteractive: () => boolean;
/**
 * Gets the swiper orientation from the store.
 *
 * @param mapId - The map id to read the swiper orientation from.
 * @returns The current swiper orientation.
 * @throws {PluginStateUninitializedError} When the Swiper plugin is uninitialized.
 */
export declare const getStoreSwiperOrientation: (mapId: string) => SwipeOrientation;
/** Hooks the swiper orientation from the store. */
export declare const useStoreSwiperOrientation: () => SwipeOrientation;
/**
 * Sets the swiper position in the store.
 *
 * @param mapId - The map id.
 * @param position - The new swiper position, between 0 and 1.
 * @throws {PluginStateUninitializedError} When the Swiper plugin is uninitialized.
 */
export declare const setStoreSwiperPosition: (mapId: string, position: number) => void;
/**
 * Sets the swiper layer paths in the store.
 *
 * @param mapId - The map id.
 * @param layerPaths - The layer paths to set.
 * @throws {PluginStateUninitializedError} When the Swiper plugin is uninitialized.
 */
export declare const setStoreSwiperLayerPaths: (mapId: string, layerPaths: string[]) => void;
/**
 * Sets the swiper layer entries (path and side) in the store, replacing the current selection.
 *
 * @param mapId - The map id.
 * @param entries - The layer entries to set, each with a layer path and its visible side.
 * @throws {PluginStateUninitializedError} When the Swiper plugin is uninitialized.
 */
export declare const setStoreSwiperLayers: (mapId: string, entries: TypeSwiperLayerEntry[]) => void;
/**
 * Sets the visible side for a single swiper layer path in the store.
 *
 * @param mapId - The map id.
 * @param layerPath - The layer path to set the side for.
 * @param side - The visible side of the swiper bar for this layer.
 * @throws {PluginStateUninitializedError} When the Swiper plugin is uninitialized.
 */
export declare const setStoreSwiperLayerSide: (mapId: string, layerPath: string, side: SwipeSide) => void;
/**
 * Sets whether the swiper is interactive in the store.
 *
 * @param mapId - The map id.
 * @param interactive - Whether the user can customize the swiper.
 * @throws {PluginStateUninitializedError} When the Swiper plugin is uninitialized.
 */
export declare const setStoreSwiperInteractive: (mapId: string, interactive: boolean) => void;
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
export declare const addStoreSwiperLayerPath: (mapId: string, layerPath: string, side: SwipeSide) => void;
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
export type SwipeSide = 'left' | 'right' | 'up' | 'down';
//# sourceMappingURL=swiper-state.d.ts.map