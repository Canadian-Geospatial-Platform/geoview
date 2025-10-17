import type Collection from 'ol/Collection';
import type Feature from 'ol/Feature';
import type { Geometry } from 'ol/geom';
import type VectorSource from 'ol/source/Vector';
import type { EventDelegateBase } from '@/api/events/event-helper';
import type { InteractionOptions } from '../interaction';
import { Interaction } from '../interaction';
import { HandleType } from './transform-base';
import type { TransformEvent, TransformSelectionEvent, TransformDeleteFeatureEvent } from './transform-events';
/**
 * Supported options for transform interactions
 */
export type TransformOptions = InteractionOptions & {
    features?: Collection<Feature>;
    geometryGroupKey?: string;
    translate?: boolean;
    scale?: boolean;
    rotate?: boolean;
    stretch?: boolean;
    keepAspectRatio?: boolean;
    hitTolerance?: number;
    enableDelete?: boolean;
    source?: VectorSource;
};
/**
 * Class used for transforming features on a map.
 * @class Transform
 * @extends {Interaction}
 * @exports
 */
export declare class Transform extends Interaction {
    #private;
    /**
     * Initializes a Transform component.
     * @param {TransformOptions} options - Object to configure the initialization of the Transform interaction.
     */
    constructor(options: TransformOptions);
    /**
     * Starts the interaction on the map.
     * @override
     */
    startInteraction(): void;
    /**
     * Stops the interaction on the map.
     * @override
     */
    stopInteraction(): void;
    /**
     * Gets the features being transformed.
     * @returns {Collection<Feature<Geometry>>} The features.
     */
    getFeatures(): Collection<Feature<Geometry>>;
    /**
     * Sets the features to be transformed.
     * @param {Collection<Feature<Geometry>>} features - The features to transform.
     */
    setFeatures(features: Collection<Feature<Geometry>>): void;
    /**
     * Adds a feature to be transformed.
     * @param {Feature<Geometry>} feature - The feature to add.
     */
    addFeature(feature: Feature<Geometry>): void;
    /**
     * Removes a feature from being transformed.
     * @param {Feature<Geometry>} feature - The feature to remove.
     */
    removeFeature(feature: Feature<Geometry>): void;
    /**
     * Checks if a feature is currently being transformed.
     * @param {Feature<Geometry>} feature - The feature to check.
     * @returns {boolean} True if the feature is being transformed.
     */
    isFeatureBeingTransformed(feature: Feature<Geometry>): boolean;
    /**
     * Gets the currently selected/transforming feature.
     * @returns {Feature<Geometry> | undefined} The selected feature.
     */
    getSelectedFeature(): Feature<Geometry> | undefined;
    /**
     * Checks if any transformation is currently active.
     * @returns {boolean} True if transformation is active.
     */
    isTransforming(): boolean;
    /**
     * Selects a feature for transformation.
     * @param {Feature<Geometry>} feature - The feature to select.
     * @param {boolean} clearHistory - If true, clears the previous history stack. Default is true.
     */
    selectFeature(feature: Feature<Geometry>, clearHistory?: boolean): void;
    /**
     * Clears the current selection.
     */
    clearSelection(): void;
    /**
     * Displays the text editor for the selected feature
     */
    showTextEditor(): void;
    /**
     * Undo the last action
     */
    undo(callback?: () => void): boolean;
    /**
     * Redo the last action
     */
    redo(callback?: () => void): boolean;
    /**
     * Checks if undo is possible
     */
    canUndo(): boolean;
    /**
     * Checks if redo is possible
     */
    canRedo(): boolean;
    /**
     * Registers a transform start event handler.
     * @param {TransformEventDelegate} callback - The callback to be executed whenever the event is emitted.
     */
    onTransformStart(callback: TransformEventDelegate): void;
    /**
     * Unregisters a transform start event handler.
     * @param {TransformEventDelegate} callback - The callback to stop being called whenever the event is emitted.
     */
    offTransformStart(callback: TransformEventDelegate): void;
    /**
     * Registers a transforming event handler.
     * @param {TransformEventDelegate} callback - The callback to be executed whenever the event is emitted.
     */
    onTransforming(callback: TransformEventDelegate): void;
    /**
     * Unregisters a transforming event handler.
     * @param {TransformEventDelegate} callback - The callback to stop being called whenever the event is emitted.
     */
    offTransforming(callback: TransformEventDelegate): void;
    /**
     * Registers a transform end event handler.
     * @param {TransformEventDelegate} callback - The callback to be executed whenever the event is emitted.
     */
    onTransformEnd(callback: TransformEventDelegate): void;
    /**
     * Unregisters a transform end event handler.
     * @param {TransformEventDelegate} callback - The callback to stop being called whenever the event is emitted.
     */
    offTransformEnd(callback: TransformEventDelegate): void;
    /**
     * Registers a delete feature event handler.
     * @param {TransformDeleteFeatureEventDelegate} callback - The callback to be executed whenever the event is emitted.
     */
    onDeleteFeature(callback: TransformDeleteFeatureEventDelegate): void;
    /**
     * Unregisters a delete feature event handler.
     * @param {TransformDeleteFeatureEventDelegate} callback - The callback to stop being called whenever the event is emitted.
     */
    offDeleteFeature(callback: TransformDeleteFeatureEventDelegate): void;
    /**
     * Registers a selection change event handler.
     * @param {SelectionEventDelegate} callback - The callback to be executed whenever the event is emitted.
     */
    onSelectionChange(callback: TransformSelectionEventDelegate): void;
    /**
     * Unregisters a selection change event handler.
     * @param {SelectionEventDelegate} callback - The callback to stop being called whenever the event is emitted.
     */
    offSelectionChange(callback: TransformSelectionEventDelegate): void;
}
/**
 * Define a delegate for the event handler function signature.
 */
export type TransformEventDelegate = EventDelegateBase<Transform, TransformEvent, void>;
/**
 * Define a delegate for the delete feature event handler function signature.
 */
export type TransformDeleteFeatureEventDelegate = EventDelegateBase<Transform, TransformDeleteFeatureEvent, void>;
/**
 * Define a delegate for the selection event handler function signature.
 */
export type TransformSelectionEventDelegate = EventDelegateBase<Transform, TransformSelectionEvent, void>;
export { HandleType };
export type { TransformEvent, TransformDeleteFeatureEvent, TransformSelectionEvent };
//# sourceMappingURL=transform.d.ts.map