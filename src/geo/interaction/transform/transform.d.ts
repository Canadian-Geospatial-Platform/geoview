import type Collection from 'ol/Collection';
import type Feature from 'ol/Feature';
import type { Geometry } from 'ol/geom';
import type VectorSource from 'ol/source/Vector';
import type { EventDelegateBase } from '@/api/events/event-helper';
import type { InteractionOptions } from '../interaction';
import { Interaction } from '../interaction';
import { HandleType } from './transform-base';
import type { TransformEvent, TransformSelectionEvent, TransformDeleteFeatureEvent } from './transform-events';
import type { GeometryApi } from '@/geo/layer/geometry/geometry';
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
 */
export declare class Transform extends Interaction {
    #private;
    /**
     * Initializes a Transform component.
     *
     * @param options - Object to configure the initialization of the Transform interaction
     * @param geometryApi - The geometry API used to retrieve geometry groups if a geometry group key is provided in the options
     */
    constructor(options: TransformOptions, geometryApi: GeometryApi);
    /**
     * Starts the interaction on the map.
     */
    startInteraction(): void;
    /**
     * Stops the interaction on the map.
     */
    stopInteraction(): void;
    /**
     * Gets the features being transformed.
     *
     * @returns The features collection
     */
    getFeatures(): Collection<Feature<Geometry>>;
    /**
     * Sets the features to be transformed.
     *
     * @param features - The features to transform
     */
    setFeatures(features: Collection<Feature<Geometry>>): void;
    /**
     * Adds a feature to be transformed.
     *
     * @param feature - The feature to add
     */
    addFeature(feature: Feature<Geometry>): void;
    /**
     * Removes a feature from being transformed.
     *
     * @param feature - The feature to remove
     */
    removeFeature(feature: Feature<Geometry>): void;
    /**
     * Checks if a feature is currently being transformed.
     *
     * @param feature - The feature to check
     * @returns True if the feature is being transformed
     */
    isFeatureBeingTransformed(feature: Feature<Geometry>): boolean;
    /**
     * Gets the currently selected/transforming feature.
     *
     * @returns The selected feature
     */
    getSelectedFeature(): Feature<Geometry> | undefined;
    /**
     * Checks if any transformation is currently active.
     *
     * @returns True if transformation is active
     */
    isTransforming(): boolean;
    /**
     * Selects a feature for transformation.
     *
     * @param feature - The feature to select
     * @param clearHistory - If true, clears the previous history stack. Default is true
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
     * Checks if there is a handle at the given coordinate (Keyboard / Crosshair).
     *
     * @param coordinate - The map coordinate to check
     * @returns True if a handle exists at the coordinate
     */
    hasHandleAtCoordinate(coordinate: number[]): boolean;
    /**
     * Gets the handle type at the given coordinate (Keyboard / Crosshair).
     *
     * @param coordinate - The map coordinate to check
     * @returns The handle type if a handle exists at the coordinate, otherwise undefined
     */
    getHandleTypeAtCoordinate(coordinate: number[]): HandleType | undefined;
    /**
     * Initializes transformation state for keyboard-based transformations (Keyboard / Crosshair).
     * Must be called after grabbing a handle and before applying transformations.
     *
     * @param coordinate - The coordinate where the transformation begins
     * @param handleType - The type of handle being transformed
     * @return True if the keyboard transform was successfully initiated, false otherwise (e.g. if no handle at coordinate or transform instance not initialized)
     */
    beginKeyboardTransform(coordinate: number[], handleType: HandleType): boolean;
    /**
     * Applies a transformation from a grabbed coordinate to a new coordinate (Keyboard / Crosshair).
     * Handles all transformation types internally based on the handle type.
     *
     * @param startCoordinate - The coordinate where the handle was grabbed
     * @param endCoordinate - The coordinate to transform to
     * @param handleType - The type of handle being transformed
     * @returns Whether the transformation was successfully applied
     */
    applyKeyboardTransformFromCoordinates(startCoordinate: number[], endCoordinate: number[], handleType: HandleType): boolean;
    /**
     * Deletes a vertex at the specified coordinate if one exists.
     *
     * @param coordinate - The coordinate to check for a vertex
     * @returns Whether a vertex was deleted
     */
    deleteVertexAtCoordinate(coordinate: number[]): boolean;
    /**
     * Restores the original style of any highlighted handle (Keyboard / Crosshair).
     */
    restoreHandleHighlight(): void;
    /**
     * Registers a transform start event handler.
     *
     * @param callback - The callback to be executed whenever the event is emitted
     */
    onTransformStart(callback: TransformEventDelegate): void;
    /**
     * Unregisters a transform start event handler.
     *
     * @param callback - The callback to stop being called whenever the event is emitted
     */
    offTransformStart(callback: TransformEventDelegate): void;
    /**
     * Registers a transforming event handler.
     *
     * @param callback - The callback to be executed whenever the event is emitted
     */
    onTransforming(callback: TransformEventDelegate): void;
    /**
     * Unregisters a transforming event handler.
     *
     * @param callback - The callback to stop being called whenever the event is emitted
     */
    offTransforming(callback: TransformEventDelegate): void;
    /**
     * Registers a transform end event handler.
     *
     * @param callback - The callback to be executed whenever the event is emitted
     */
    onTransformEnd(callback: TransformEventDelegate): void;
    /**
     * Unregisters a transform end event handler.
     *
     * @param callback - The callback to stop being called whenever the event is emitted
     */
    offTransformEnd(callback: TransformEventDelegate): void;
    /**
     * Registers a delete feature event handler.
     *
     * @param callback - The callback to be executed whenever the event is emitted
     */
    onDeleteFeature(callback: TransformDeleteFeatureEventDelegate): void;
    /**
     * Unregisters a delete feature event handler.
     *
     * @param callback - The callback to stop being called whenever the event is emitted
     */
    offDeleteFeature(callback: TransformDeleteFeatureEventDelegate): void;
    /**
     * Registers a selection change event handler.
     *
     * @param callback - The callback to be executed whenever the event is emitted
     */
    onSelectionChange(callback: TransformSelectionEventDelegate): void;
    /**
     * Unregisters a selection change event handler.
     *
     * @param callback - The callback to stop being called whenever the event is emitted
     */
    offSelectionChange(callback: TransformSelectionEventDelegate): void;
}
/**
 * Delegate for transform event handler function signature.
 */
export type TransformEventDelegate = EventDelegateBase<Transform, TransformEvent, void>;
/**
 * Delegate for delete feature event handler function signature.
 */
export type TransformDeleteFeatureEventDelegate = EventDelegateBase<Transform, TransformDeleteFeatureEvent, void>;
/**
 * Delegate for selection event handler function signature.
 */
export type TransformSelectionEventDelegate = EventDelegateBase<Transform, TransformSelectionEvent, void>;
export { HandleType };
export type { TransformEvent, TransformDeleteFeatureEvent, TransformSelectionEvent };
//# sourceMappingURL=transform.d.ts.map