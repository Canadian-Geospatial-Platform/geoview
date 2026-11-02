import type { IGeoviewState, TypeGetStore, TypeSetStore } from '@/core/stores/geoview-store';
/**
 * Creates the initial GeoView store state with the core slices and the setMapConfig action that adds the optional package slices.
 *
 * @param set - The Zustand state setter
 * @param get - The Zustand state getter
 * @returns The initialized GeoView store state
 */
export declare const geoviewStoreDefinition: (set: TypeSetStore, get: TypeGetStore) => IGeoviewState;
/** The store definition wrapped with the subscribeWithSelector middleware. */
export declare const geoviewStoreDefinitionWithSubscribeSelector: import("zustand").StateCreator<IGeoviewState, [], [["zustand/subscribeWithSelector", never]]>;
//# sourceMappingURL=geoview-store-definition.d.ts.map