import { TypeFeatureInfoResultSets } from '../../api/events/payloads/get-feature-info-payload';
import { LayerSet } from './layer-set';
/** ***************************************************************************************************************************
 * A class to hold a set of layers associated with an array of TypeArrayOfFeatureInfoEntries. When this class is instantiated,
 * all layers already loaded on the specified map that are queryable will be added to the set. Layers added afterwards will be
 * added to the set if they are queryable. Deleted layers will be removed from the set. If you click on the map, all queryable
 * layers will execute a query and return their result set.
 *
 * @class FeatureInfoLayerSet
 */
export declare class FeatureInfoLayerSet {
    /** Private static variable to keep the single instance that can be created by this class for a mapId (see singleton design pattern) */
    private static featureInfoLayerSetInstance;
    /** The map identifier the layer set belongs to. */
    mapId: string;
    /** The layer set object. */
    layerSet: LayerSet;
    /** An object containing the result sets indexed using the layer path */
    resultSets: TypeFeatureInfoResultSets;
    /** ***************************************************************************************************************************
     * The class constructor that instanciate a set of layer.
     *
     * @param {string} mapId The map identifier the layer set belongs to.
     *
     */
    private constructor();
    /**
     * Helper function used to instanciate a FeatureInfoLayerSet object. This function
     * avoids the "new FeatureInfoLayerSet" syntax.
     *
     * @param {string} mapId The map identifier the layer set belongs to.
     *
     * @returns {FeatureInfoLayerSet} the FeatureInfoLayerSet object created
     */
    static get(mapId: string): FeatureInfoLayerSet;
}
