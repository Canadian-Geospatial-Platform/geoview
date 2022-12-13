import { TypeResultSets } from '../../api/events/payloads/layer-set-payload';
/** ***************************************************************************************************************************
 * A class to hold a set of layers associated with an array of TypeArrayOfFeatureInfoEntries. When this class is instantiated,
 * all layers already loaded on the specified map that are queryable will be added to the set. Layers added afterwards will be
 * added to the set if they are queryable. Deleted layers will be removed from the set.
 *
 * @class FeatureInfoLayerSet
 */
export declare class LayerSet {
    /** The map identifier the layer set belongs to. */
    mapId: string;
    /** The layer set identifier. */
    layerSetId: string;
    /** An object containing the result sets indexed using the layer path */
    resultSets: TypeResultSets;
    /** Function used to determine if the layerPath can be added to the layer set. */
    registrationConditionFunction: (layerPath: string) => boolean;
    /** ***************************************************************************************************************************
     * The class constructor that instanciate a set of layer.
     *
     * @param {string} mapId The map identifier the layer set belongs to.
     * @param {string} layerSetIdentifier The layer set identifier.
     * @param {TypeResultSets} resultSets An object that will contain the result sets indexed using the layer path.
     * @param {(layerPath: string) => boolean} registrationConditionFunction A function to decide if the layer can be added.
     */
    constructor(mapId: string, layerSetIdentifier: string, resultSets: TypeResultSets, registrationConditionFunction: (layerPath: string) => boolean);
    /**
     * Helper function used to instanciate a FeatureInfoLayerSet object. This function
     * avoids the "new FeatureInfoLayerSet" syntax.
     *
     * @param {string} mapId The map identifier the layer set belongs to.
     * @param {string} layerSetId The layer set identifier.
     * @param {TypeResultSets} resultSets An object that will contain the result sets indexed using the layer path.
     * @param {(layerPath: string) => boolean} registrationConditionFunction A function to decide if the layer can be added.
     *
     * @returns {FeatureInfoLayerSet} the FeatureInfoLayerSet object created
     */
    static create(mapId: string, layerSetId: string, resultSets: TypeResultSets, registrationConditionFunction: (layerPath: string) => boolean): LayerSet;
}
