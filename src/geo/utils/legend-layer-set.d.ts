import { TypeLegendResultSets } from '../../api/events/payloads/get-legends-payload';
import { LayerSet } from './layer-set';
/** *****************************************************************************************************************************
 * A class to hold a set of layers associated with an array of TypeLegend. When this class is instantiated, all layers already
 * loaded on the specified map will be added to the set. Layers added afterwards will be added to the set and deleted layers
 * will be removed from the set.
 *
 * @class LegendsLayerSet
 */
export declare class LegendsLayerSet {
    /** The map identifier the layer set belongs to. */
    mapId: string;
    /** The layer set object. */
    layerSet: LayerSet;
    /** An object containing the result sets indexed using the layer path */
    resultSets: TypeLegendResultSets;
    /** ***************************************************************************************************************************
     * The class constructor that instanciate a set of layer.
     *
     * @param {string} mapId The map identifier the layer set belongs to.
     * @param {string} layerSetId The layer set identifier.
     *
     */
    constructor(mapId: string, layerSetId: string);
    /**
     * Helper function used to instanciate a LegendsLayerSet object. This function
     * avoids the "new LegendsLayerSet" syntax.
     *
     * @param {string} mapId The map identifier the layer set belongs to.
     * @param {string} layerSetId The layer set identifier.
     *
     * @returns {LegendsLayerSet} the LegendsLayerSet object created
     */
    static create(mapId: string, layerSetId: string): LegendsLayerSet;
}
