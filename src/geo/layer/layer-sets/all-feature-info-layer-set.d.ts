import { QueryType } from '@/api/config/types/map-schema-types';
import { AbstractBaseLayer } from '@/geo/layer/gv-layers/abstract-base-layer';
import { AbstractLayerSet, PropagationType } from '@/geo/layer/layer-sets/abstract-layer-set';
import { TypeAllFeatureInfoResultSet, TypeAllFeatureInfoResultSetEntry } from '@/core/stores/store-interface-and-intial-values/data-table-state';
/**
 * A Layer-set working with the LayerApi at handling a result set of registered layers and synchronizing
 * events happening on them (in this case when the user queries for all records within a layer) with a store
 * for UI updates.
 * @class AllFeatureInfoLayerSet
 */
export declare class AllFeatureInfoLayerSet extends AbstractLayerSet {
    #private;
    /** The resultSet object as existing in the base class, retyped here as a TypeAllFeatureInfoResultSet */
    resultSet: TypeAllFeatureInfoResultSet;
    /**
     * Overrides the behavior to apply when a feature-info-layer-set wants to check for condition to register a layer in its set.
     * @param {AbstractBaseLayer} layer - The layer
     * @returns {boolean} True when the layer should be registered to this all-feature-info-layer-set.
     */
    protected onRegisterLayerCheck(layer: AbstractBaseLayer): boolean;
    /**
     * Overrides the behavior to apply when an all-feature-info-layer-set wants to register a layer in its set.
     * @param {AbstractBaseLayer} layer - The layer
     */
    protected onRegisterLayer(layer: AbstractBaseLayer): void;
    /**
     * Overrides the behavior to apply when propagating to the store
     * @param {TypeAllFeatureInfoResultSetEntry} resultSetEntry - The result set entry to propagate
     */
    protected onPropagateToStore(resultSetEntry: TypeAllFeatureInfoResultSetEntry, type: PropagationType): void;
    /**
     * Overrides the behavior to apply when deleting from the store
     * @param {string} layerPath - The layer path to delete from the store
     */
    protected onDeleteFromStore(layerPath: string): void;
    /**
     * Helper function used to launch the query on a layer to get all of its feature information.
     * @param {string} layerPath - The layerPath that will be queried
     * @param {QueryType} queryType - The query's type to perform
     * @returns {Promise<TypeAllFeatureInfoResultSet | void>} A promise which will hold the result of the query
     */
    queryLayer(layerPath: string, queryType?: QueryType): Promise<TypeAllFeatureInfoResultSet | void>;
}
