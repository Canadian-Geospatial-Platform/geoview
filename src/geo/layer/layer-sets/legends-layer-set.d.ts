import type { ConfigBaseClass } from '@/api/config/validation-classes/config-base-class';
import type { TypeLayerStatus } from '@/api/types/layer-schema-types';
import type { PropagationType } from '@/geo/layer/layer-sets/abstract-layer-set';
import { AbstractLayerSet } from '@/geo/layer/layer-sets/abstract-layer-set';
import type { TypeLegendResultSet, TypeLegendResultSetEntry } from '@/core/stores/store-interface-and-intial-values/layer-state';
import type { AbstractBaseGVLayer } from '@/geo/layer/gv-layers/abstract-base-layer';
import type { LayerApi } from '@/geo/layer/layer';
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
     * @param layerConfig - The layer config
     * @returns True when the layer should be registered to this legends-layer-set
     */
    protected onRegisterLayerConfigCheck(layerConfig: ConfigBaseClass): boolean;
    /**
     * Overrides the behavior to apply when an all-feature-info-layer-set wants to check for condition to register a layer in its set.
     * @param layer - The layer
     * @returns True when the layer should be registered to this legends-layer-set
     */
    protected onRegisterLayerCheck(layer: AbstractBaseGVLayer): boolean;
    /**
     * Overrides the behavior to apply when a legends-layer-set wants to register a layer in its set.
     * @param {ConfigBaseClass} layerConfig - The layer config
     * @returns {void}
     * @override
     * @protected
     */
    protected onRegisterLayerConfig(layerConfig: ConfigBaseClass): void;
    /**
     * Overrides the behavior to apply when a legends-layer-set wants to unregister a layer in its set.
     * @param {ConfigBaseClass | undefined} layerConfig - The layer config
     * @returns {void}
     * @protected
     */
    protected onUnregisterLayerConfig(layerConfig: ConfigBaseClass | undefined): void;
    /**
     * Overrides the behavior to apply when a legends-layer-set wants to register a layer in its set.
     * @param {AbstractBaseGVLayer} layer - The layer
     * @returns {void}
     * @override
     * @protected
     */
    protected onRegisterLayer(layer: AbstractBaseGVLayer): void;
    /**
     * Processes action when the layer status changes.
     * @param {ConfigBaseClass} layerConfig - The layer config
     * @param {TypeLayerStatus} layerStatus - The new layer status
     * @returns {void}
     * @override
     * @protected
     */
    protected processLayerStatusChanged(layerConfig: ConfigBaseClass, layerStatus: TypeLayerStatus): void;
    /**
     * Overrides the behavior to apply when propagating to the store
     * @param {TypeLegendResultSetEntry} resultSetEntry - The result set entry to propagate
     * @param {PropagationType} type - The propagation type
     * @returns {void}
     * @override
     * @protected
     */
    protected onPropagateToStore(resultSetEntry: TypeLegendResultSetEntry, type: PropagationType): void;
    /**
     * Overrides the behavior to apply when deleting from the store
     * @param {string} layerPath - The layer path to delete form the store
     * @returns {void}
     * @override
     * @protected
     */
    protected onDeleteFromStore(layerPath: string): void;
}
//# sourceMappingURL=legends-layer-set.d.ts.map