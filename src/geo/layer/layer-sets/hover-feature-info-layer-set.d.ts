import type { Coordinate } from 'ol/coordinate';
import type { QueryType } from '@/api/types/map-schema-types';
import type { AbstractBaseGVLayer } from '@/geo/layer/gv-layers/abstract-base-layer';
import type { PropagationType } from '@/geo/layer/layer-sets/abstract-layer-set';
import { AbstractLayerSet } from '@/geo/layer/layer-sets/abstract-layer-set';
import type { LayerApi } from '@/geo/layer/layer';
import type { TypeHoverResultSet, TypeHoverResultSetEntry } from '@/core/stores/store-interface-and-intial-values/feature-info-state';
/**
 * A Layer-set working with the LayerApi at handling a result set of registered layers and synchronizing
 * events happening on them (in this case when the user hovers on the map) with a store
 * for UI updates.
 */
export declare class HoverFeatureInfoLayerSet extends AbstractLayerSet {
    #private;
    /** The query type */
    static QUERY_TYPE: QueryType;
    /** The resultSet object as existing in the base class, retyped here as a TypeHoverFeatureInfoResultSet */
    resultSet: TypeHoverResultSet;
    /**
     * The class constructor that instantiates a set of layers.
     *
     * @param layerApi - The layer Api to work with
     */
    constructor(layerApi: LayerApi);
    /**
     * Overrides the behavior to apply when a hover-feature-info-layer-set wants to check for condition to register a layer in its set.
     *
     * @param layer - The layer
     * @returns True when the layer should be registered to this hover-feature-info-layer-set
     */
    protected onRegisterLayerCheck(layer: AbstractBaseGVLayer): boolean;
    /**
     * Overrides the behavior to apply when a hover-feature-info-layer-set wants to register a layer in its set.
     *
     * @param layer - The layer
     */
    protected onRegisterLayer(layer: AbstractBaseGVLayer): void;
    /**
     * Overrides the behavior to apply when propagating to the store.
     *
     * @param resultSetEntry - The result set entry to propagate to the store
     * @param type - The propagation type
     */
    protected onPropagateToStore(resultSetEntry: TypeHoverResultSetEntry, type: PropagationType): void;
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
     * @param queryType - The query type, default: HoverFeatureInfoLayerSet.QUERY_TYPE
     * @returns A promise that resolves with the hover result set results
     */
    queryLayers(coordinate: Coordinate, queryType?: QueryType): Promise<TypeHoverResultSet>;
    /**
     * Clears the results for the provided layer path.
     *
     * @param layerPath - The layer path
     */
    clearResults(layerPath: string): void;
}
//# sourceMappingURL=hover-feature-info-layer-set.d.ts.map