import { TypeResultsSet } from '@/api/events/payloads';
/** ***************************************************************************************************************************
 * A class to hold a set of layers associated with an value of any type. When this class is instantiated, all layers already
 * loaded on the specified map that have a return value equal to true when the registrationConditionFunction is called using
 * the layer path as a parameter will be added to the set. Layers added afterwards will be added to the set if the
 * registrationConditionFunction returns true. Deleted layers will be removed from the set.
 *
 * @class LayerSet
 */
export declare class LayerSet {
    /** The map identifier the layer set belongs to. */
    mapId: string;
    /** The layer set identifier. */
    layerSetId: string;
    /** An object containing the result sets indexed using the layer path */
    resultsSet: TypeResultsSet;
    /** Function used to determine if the layerPath can be added to the layer set. */
    registrationConditionFunction: (layerPath: string) => boolean;
    /** Function used to initialise the data property of the layer path entry. */
    registrationUserDataInitialisation?: (layerPath: string) => void;
    /** Sequence number to append to the layer name when we declare a layer as anonymous. */
    anonymousSequenceNumber: number;
    /** ***************************************************************************************************************************
     * The class constructor that instanciate a set of layer.
     *
     * @param {string} mapId The map identifier the layer set belongs to.
     * @param {string} layerSetIdentifier The layer set identifier.
     * @param {TypeResultsSet} resultsSet An object that will contain the result sets indexed using the layer path.
     * @param {(layerPath: string) => boolean} registrationConditionFunction A function to decide if the layer can be added.
     * @param {(layerPath: string) => void} registrationUserDataInitialisation A function to initialise the data property of the layer path entry.
     */
    constructor(mapId: string, layerSetIdentifier: string, resultsSet: TypeResultsSet, registrationConditionFunction: (layerPath: string) => boolean, registrationUserDataInitialisation?: (layerPath: string) => void);
    /**
     * Helper function used to instanciate a LayerSet object. This function
     * avoids the "new LayerSet" syntax.
     *
     * @param {string} mapId The map identifier the layer set belongs to.
     * @param {string} layerSetId The layer set identifier.
     * @param {TypeResultsSet} resultsSet An object that will contain the result sets indexed using the layer path.
     * @param {(layerPath: string) => boolean} registrationConditionFunction A function to decide if the layer can be added.
     *
     * @returns {LayerSet} the LayerSet object created
     */
    static create(mapId: string, layerSetId: string, resultsSet: TypeResultsSet, registrationConditionFunction: (layerPath: string) => boolean): LayerSet;
}
