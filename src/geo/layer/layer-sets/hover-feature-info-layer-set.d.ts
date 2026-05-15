import type { Coordinate } from 'ol/coordinate';
import type { QueryType } from '@/api/types/map-schema-types';
import type { AbstractBaseGVLayer } from '@/geo/layer/gv-layers/abstract-base-layer';
import { AbstractLayerSet } from '@/geo/layer/layer-sets/abstract-layer-set';
import type { TypeHoverResultSet } from '@/core/stores/states/feature-info-state';
/**
 * A Layer-set working with the LayerSetController at handling a result set of registered layers and synchronizing
 * events happening on them (in this case when the user hovers on the map) with a store
 * for UI updates.
 */
export declare class HoverFeatureInfoLayerSet extends AbstractLayerSet {
    #private;
    /** The query type */
    static QUERY_TYPE: QueryType;
    /**
     * Overrides the behavior to apply when a hover-feature-info-layer-set wants to check for condition to register a layer in its set.
     *
     * @param layer - The layer
     * @returns True when the layer should be registered to this hover-feature-info-layer-set
     */
    protected onRegisterLayerCheck(layer: AbstractBaseGVLayer): boolean;
    /**
     * Overrides the behavior to apply when deleting from the store.
     *
     * @param layerPath - The layer path to delete from the store
     */
    protected onDeleteFromStore(layerPath: string): void;
    /**
     * Queries the features at the provided coordinate for all the registered layers.
     *
     * @param coordinate - The pixel coordinate where to query the features when the queryType is 'at_pixel' or the map coordinate otherwise
     * @param queryType - The query type, either 'at_pixel' or 'all_features'. Defaults to the HoverFeatureInfoLayerSet.QUERY_TYPE static property value ('at_pixel')
     * @returns A promise that resolves with the hover result set results
     */
    queryLayers(coordinate: Coordinate, queryType?: QueryType): Promise<TypeHoverResultSet>;
    /**
     * Clears the results immediately for all.
     */
    clearResults(): void;
}
//# sourceMappingURL=hover-feature-info-layer-set.d.ts.map