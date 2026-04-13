import type { QueryType, TypeFeatureInfoResult } from '@/api/types/map-schema-types';
import type { AbstractBaseGVLayer } from '@/geo/layer/gv-layers/abstract-base-layer';
import type { PropagationType } from '@/geo/layer/layer-sets/abstract-layer-set';
import { AbstractLayerSet } from '@/geo/layer/layer-sets/abstract-layer-set';
import { type TypeAllFeatureInfoResultSet, type TypeAllFeatureInfoResultSetEntry } from '@/core/stores/store-interface-and-intial-values/data-table-state';
/**
 * A Layer-set working with the LayerSetController at handling a result set of registered layers and synchronizing
 * events happening on them (in this case when the user queries for all records within a layer) with a store
 * for UI updates.
 */
export declare class AllFeatureInfoLayerSet extends AbstractLayerSet {
    #private;
    /** The query type */
    static QUERY_TYPE: QueryType;
    /** The resultSet object as existing in the base class, retyped here as a TypeAllFeatureInfoResultSet */
    resultSet: TypeAllFeatureInfoResultSet;
    /**
     * Overrides the behavior to apply when a feature-info-layer-set wants to check for condition to register a layer in its set.
     *
     * @param layer - The layer
     * @returns True when the layer should be registered to this all-feature-info-layer-set.
     */
    protected onRegisterLayerCheck(layer: AbstractBaseGVLayer): boolean;
    /**
     * Overrides the behavior to apply when an all-feature-info-layer-set wants to register a layer in its set.
     *
     * @param layer - The layer
     */
    protected onRegisterLayer(layer: AbstractBaseGVLayer): void;
    /**
     * Overrides the behavior to apply when propagating to the store.
     *
     * @param resultSetEntry - The result set entry to propagate
     * @param type - The propagation type
     */
    protected onPropagateToStore(resultSetEntry: TypeAllFeatureInfoResultSetEntry, type: PropagationType): void;
    /**
     * Overrides the behavior to apply when deleting from the store.
     *
     * @param layerPath - The layer path to delete from the store
     */
    protected onDeleteFromStore(layerPath: string): void;
    /**
     * Helper function used to launch the query on a layer to get all of its feature information.
     *
     * @param layerPath - The layerPath that will be queried
     * @param queryType - The query type, default: AllFeatureInfoLayerSet.QUERY_TYPE
     * @returns A promise that resolves with the result of the query
     */
    queryLayer(layerPath: string, queryType?: QueryType): Promise<TypeFeatureInfoResult>;
    /**
     * Clears all stored features for a specific layer in the Feature Info result set.
     *
     * If the given `layerPath` exists in the internal `resultSet`, this method:
     * - Sets its `features` property to `null`, effectively removing all features.
     * - Propagates the updated layer result to the external store.
     * If the layer path does not exist in the result set, the method does nothing.
     *
     * @param layerPath - The unique path identifying the layer to clear
     */
    clearLayerFeatures(layerPath: string): void;
}
//# sourceMappingURL=all-feature-info-layer-set.d.ts.map