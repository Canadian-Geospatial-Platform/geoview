import type { TypeMapFeaturesConfig } from '@/core/types/global-types';
/**
 * Creates the GeoView store for a map, initializes its subscriptions and registers it in the stores manager.
 *
 * Does nothing when the configuration has no map id.
 *
 * @param config - The map features configuration used to initialize the store
 */
export declare const addGeoViewStore: (config: TypeMapFeaturesConfig) => void;
/**
 * Clears the store subscriptions of a map and removes its GeoView store from the stores manager.
 *
 * @param id - The map identifier of the store to remove
 */
export declare const removeGeoviewStore: (id: string) => void;
//# sourceMappingURL=store-lifecycle.d.ts.map