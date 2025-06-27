import { Coordinate } from 'ol/coordinate';
import { AbstractBaseLayer } from '@/geo/layer/gv-layers/abstract-base-layer';
import { AbstractLayerSet, PropagationType } from '@/geo/layer/layer-sets/abstract-layer-set';
import { LayerApi } from '@/geo/layer/layer';
import { TypeHoverResultSet, TypeHoverResultSetEntry } from '@/core/stores/store-interface-and-intial-values/feature-info-state';
/**
 * A Layer-set working with the LayerApi at handling a result set of registered layers and synchronizing
 * events happening on them (in this case when the user hovers on the map) with a store
 * for UI updates.
 * @class HoverFeatureInfoLayerSet
 */
export declare class HoverFeatureInfoLayerSet extends AbstractLayerSet {
    #private;
    /** The resultSet object as existing in the base class, retyped here as a TypeHoverFeatureInfoResultSet */
    resultSet: TypeHoverResultSet;
    /**
     * The class constructor that instanciate a set of layer.
     * @param {LayerApi} layerApi - The layer Api to work with.
     */
    constructor(layerApi: LayerApi);
    /**
     * Overrides the behavior to apply when a hover-feature-info-layer-set wants to check for condition to register a layer in its set.
     * @param {AbstractBaseLayer} layer - The layer
     * @returns {boolean} True when the layer should be registered to this hover-feature-info-layer-set.
     */
    protected onRegisterLayerCheck(layer: AbstractBaseLayer): boolean;
    /**
     * Overrides the behavior to apply when a hover-feature-info-layer-set wants to register a layer in its set.
     * @param {AbstractBaseLayer} layer - The layer
     */
    protected onRegisterLayer(layer: AbstractBaseLayer): void;
    /**
     * Overrides the behavior to apply when propagating to the store
     * @param {TypeHoverResultSetEntry} resultSetEntry - The result set entry to propagate to the store
     */
    protected onPropagateToStore(resultSetEntry: TypeHoverResultSetEntry, type: PropagationType): void;
    /**
     * Overrides the behavior to apply when deleting from the store
     * @param {string} layerPath - The layer path to delete from the store
     */
    protected onDeleteFromStore(layerPath: string): void;
    /**
     * Queries the features at the provided coordinate for all the registered layers.
     * @param {Coordinate} pixelCoordinate - The pixel coordinate where to query the features
     */
    queryLayers(pixelCoordinate: Coordinate): void;
    /**
     * Function used to enable listening of hover events. When a layer path is not provided,
     * hover events listening is enabled for all layers.
     * @param {string} layerPath - Optional parameter used to enable only one layer
     */
    enableHoverListener(layerPath?: string): void;
    /**
     * Function used to disable listening of hover events. When a layer path is not provided,
     * hover events listening is disable for all layers.
     * @param {string} layerPath - Optional parameter used to disable only one layer
     */
    disableHoverListener(layerPath?: string): void;
    /**
     * Function used to determine whether hover events are disabled for a layer. When a layer path is not provided,
     * the value returned is undefined if the map flags are a mixture of true and false values.
     * @param {string} layerPath - Optional parameter used to get the flag value of a layer.
     * @returns {boolean | undefined} The flag value for the map or layer.
     */
    isHoverListenerEnabled(layerPath?: string): boolean | undefined;
}
//# sourceMappingURL=hover-feature-info-layer-set.d.ts.map