import { TypeFeatureInfoResultsSet } from '@/api/events/payloads';
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
    private mapId;
    /** The layer set object. */
    private layerSet;
    /** Private variable that keeps the click disable flags associated to the layerPath  * /
    private disableClickOnLayer: {
      [layerPath: string]: boolean;
    } = {};
  
    /** Private variable that keeps the hover disable flags associated to the layerPath  * /
    private disableHoverOverLayer: {
      [layerPath: string]: boolean;
    } = {};
  
    /** Flag used to disable hover event for the entire layerSet */
    private disableHover;
    /** An object containing the result sets indexed using the layer path */
    resultsSet: TypeFeatureInfoResultsSet;
    /** ***************************************************************************************************************************
     * The class constructor that instanciate a set of layer.
     *
     * @param {string} mapId The map identifier the layer set belongs to.
     *
     */
    private constructor();
    /**
     * Helper function used to instanciate a FeatureInfoLayerSet object. This function
     * must be used in place of the "new FeatureInfoLayerSet" syntax.
     *
     * @param {string} mapId The map identifier the layer set belongs to.
     *
     * @returns {FeatureInfoLayerSet} the FeatureInfoLayerSet object created
     */
    static get(mapId: string): FeatureInfoLayerSet;
    /**
     * Function used to delete a FeatureInfoLayerSet object associated to a mapId.
     *
     * @param {string} mapId The map identifier the layer set belongs to.
     */
    static delete(mapId: string): void;
    /**
     * Function used to enable listening of click events. When a layer path is not provided,
     * click events listening is enabled for all layers
     *
     * @param {string} layerPath Optional parameter used to enable only one layer
     */
    enableClickListener(layerPath?: string): void;
    /**
     * Function used to disable listening of click events. When a layer path is not provided,
     * click events listening is disable for all layers
     *
     * @param {string} layerPath Optional parameter used to disable only one layer
     */
    disableClickListener(layerPath?: string): void;
    /**
     * Function used to determine whether click events are disabled for a layer. When a layer path is not provided,
     * the value returned is undefined if the map flags are a mixture of true and false values.
     *
     * @param {string} layerPath Optional parameter used to get the flag value of a layer.
     *
     * @returns {boolean | undefined} The flag value for the map or layer.
     */
    isClickListenerEnabled(layerPath?: string): boolean | undefined;
    /**
     * Function used to enable listening of hover events. When a layer path is not provided,
     * hover events listening is enabled for all layers
     *
     * @param {string} layerPath Optional parameter used to enable only one layer
     */
    enableHoverListener(layerPath?: string): void;
    /**
     * Function used to disable listening of hover events. When a layer path is not provided,
     * hover events listening is disable for all layers
     *
     * @param {string} layerPath Optional parameter used to disable only one layer
     */
    disableHoverListener(layerPath?: string): void;
    /**
     * Function used to determine whether hover events are disabled for a layer. When a layer path is not provided,
     * the value returned is undefined if the map flags are a mixture of true and false values.
     *
     * @param {string} layerPath Optional parameter used to get the flag value of a layer.
     *
     * @returns {boolean | undefined} The flag value for the map or layer.
     */
    isHoverListenerEnabled(layerPath?: string): boolean | undefined;
}
