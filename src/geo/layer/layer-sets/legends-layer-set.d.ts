import { ConfigBaseClass } from '@/core/utils/config/validation-classes/config-base-class';
import { TypeLayerStatus } from '@/geo/map/map-schema-types';
import { AbstractLayerSet, PropagationType } from './abstract-layer-set';
import { TypeLegendResultSet, TypeLegendResultSetEntry } from '@/core/stores/store-interface-and-intial-values/layer-state';
import { AbstractBaseLayer } from '../gv-layers/abstract-base-layer';
import { LayerApi } from '../layer';
/**
 * A Layer-set working with the LayerApi at handling a result set of registered layers and synchronizing
 * events happening on them (in this case when the layers are going through the layer statuses and legend querying) with a store
 * for UI updates.
 * @class LegendsLayerSet
 */
export declare class LegendsLayerSet extends AbstractLayerSet {
    #private;
    /** The resultSet object as existing in the base class, retyped here as a TypeLegendResultSet */
    resultSet: TypeLegendResultSet;
    /**
     * Constructs a Legends LayerSet to manage layers legends.
     * @param {LayerApi} layerApi - The layer api
     */
    constructor(layerApi: LayerApi);
    /**
     * Overrides the behavior to apply when an all-feature-info-layer-set wants to check for condition to register a layer in its set.
     * @param {ConfigBaseClass} layerConfig - The layer config
     * @returns {boolean} True when the layer should be registered to this legends-layer-set
     */
    protected onRegisterLayerConfigCheck(layerConfig: ConfigBaseClass): boolean;
    /**
     * Overrides the behavior to apply when an all-feature-info-layer-set wants to check for condition to register a layer in its set.
     * @param {AbstractBaseLayer} layer - The layer
     * @param {string} layerPath - The layer path
     * @returns {boolean} True when the layer should be registered to this legends-layer-set
     */
    protected onRegisterLayerCheck(layer: AbstractBaseLayer): boolean;
    /**
     * Overrides the behavior to apply when a legends-layer-set wants to register a layer in its set.
     * @param {ConfigBaseClass} layerConfig - The layer config
     */
    protected onRegisterLayerConfig(layerConfig: ConfigBaseClass): void;
    /**
     * Overrides the behavior to apply when a legends-layer-set wants to register a layer in its set.
     * @param {AbstractBaseLayer} layer - The layer
     */
    protected onRegisterLayer(layer: AbstractBaseLayer): void;
    /**
     * Overrides the behavior to apply when a layer status changed for a legends-layer-set.
     * @param {ConfigBaseClass} layerConfig - The layer config
     * @param {TypeLayerStatus} layerStatus - The new layer status
     */
    protected onProcessLayerStatusChanged(layerConfig: ConfigBaseClass, layerStatus: TypeLayerStatus): void;
    /**
     * Overrides the behavior to apply when propagating to the store
     * @param {TypeLegendResultSetEntry} resultSetEntry - The result set entry to propagate
     */
    protected onPropagateToStore(resultSetEntry: TypeLegendResultSetEntry, type: PropagationType): void;
    /**
     * Overrides the behavior to apply when deleting from the store
     * @param {string} layerPath - The layer path to delete form the store
     */
    protected onDeleteFromStore(layerPath: string): void;
}
