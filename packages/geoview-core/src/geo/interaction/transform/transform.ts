import Collection from 'ol/Collection';
import Feature from 'ol/Feature';
import { Geometry } from 'ol/geom';
import VectorSource from 'ol/source/Vector';

import EventHelper, { EventDelegateBase } from '@/api/events/event-helper';

import { Interaction, InteractionOptions } from '../interaction';
import { OLTransform, HandleType } from './transform-base';
import { TransformEvent, TransformSelectionEvent, TransformDeleteFeatureEvent } from './transform-events';

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
export class Transform extends Interaction {
  /** The embedded OpenLayers Transform component */
  #ol_transform: OLTransform;

  /** Callback handlers for when a feature is initially selected or when a handle is clicked on */
  #onTransformStartHandlers: TransformEventDelegate[] = [];

  /** Callback handler for when a feature is currently being transformed */
  #onTransformingHandlers: TransformEventDelegate[] = [];

  /**
   * Callback handler for mouse up event when a feature has finished transforming
   * Note: This will fire when initially or just clicking on a feature since a feature can be moved by clicking on it and dragging
   */
  #onTransformEndHandlers: TransformEventDelegate[] = [];

  /** Callback handler for when a feature is deleted */
  #onDeleteFeatureHandlers: TransformDeleteFeatureEventDelegate[] = [];

  /** Callback handler for when a feature is selected, deselected, or both (one deselected, another selected) */
  #onSelectionChangeHandlers: TransformSelectionEventDelegate[] = [];

  /**
   * Initializes a Transform component.
   * @param {TransformOptions} options - Object to configure the initialization of the Transform interaction.
   */
  constructor(options: TransformOptions) {
    super(options);

    // Set default options with all features enabled
    const defaultOptions = {
      translate: true,
      scale: true,
      rotate: true,
      stretch: true,
      enableDelete: true,
      ...options, // User options will override defaults
    };

    // Create the OLTransform options
    const olOptions: TransformOptions = {
      mapViewer: this.mapViewer,
      translate: defaultOptions.translate,
      scale: defaultOptions.scale,
      rotate: defaultOptions.rotate,
      stretch: defaultOptions.stretch,
      keepAspectRatio: defaultOptions.keepAspectRatio,
      hitTolerance: defaultOptions.hitTolerance,
      enableDelete: defaultOptions.enableDelete,
    };

    // If a list of features is specified
    if (defaultOptions.features) {
      // Set the features to transform
      olOptions.features = defaultOptions.features;
    } else if (defaultOptions.geometryGroupKey) {
      // If a geometry group key is set
      // Get the vector source for the geometry group or create one when not existing
      const geomGroup = this.mapViewer.layer.geometry?.createGeometryGroup(defaultOptions.geometryGroupKey);
      if (geomGroup) {
        olOptions.source = geomGroup.vectorSource;
      }
    }

    // Create the OLTransform instance
    this.#ol_transform = new OLTransform(olOptions);

    // Register event handlers
    this.#ol_transform.onTransformstart = this.#emitTransformStart.bind(this);
    this.#ol_transform.onTransforming = this.#emitTransforming.bind(this);
    this.#ol_transform.onTransformend = this.#emitTransformEnd.bind(this);
    this.#ol_transform.onDeletefeature = this.#emitDeleteFeature.bind(this);
    this.#ol_transform.onSelectionChange = this.#emitSelectionChange.bind(this);
  }

  /**
   * Starts the interaction on the map.
   * @override
   */
  override startInteraction(): void {
    // Add the handle layer to the map
    if (this.mapViewer) {
      this.mapViewer.map.addLayer(this.#ol_transform.handleLayer);
      // Prevent context menu on map element
      this.mapViewer.map.getTargetElement().addEventListener('contextmenu', this.#ol_transform.contextMenuHandler);
    }

    // Redirect to super method to start interaction
    super.startInteraction(this.#ol_transform);
  }

  /**
   * Stops the interaction on the map.
   * @override
   */
  override stopInteraction(): void {
    // Remove the handle layer from the map
    if (this.mapViewer) {
      this.mapViewer.map.removeLayer(this.#ol_transform.handleLayer);
      // Remove context menu handler
      this.mapViewer.map.getTargetElement().removeEventListener('contextmenu', this.#ol_transform.contextMenuHandler);
    }

    // Clear any selected feature
    this.#ol_transform.clearSelection();

    // Redirect to super method to stop interaction
    super.stopInteraction(this.#ol_transform);
  }

  /**
   * Gets the features being transformed.
   * @returns {Collection<Feature<Geometry>>} The features.
   */
  public getFeatures(): Collection<Feature<Geometry>> {
    return this.#ol_transform.features;
  }

  /**
   * Sets the features to be transformed.
   * @param {Collection<Feature<Geometry>>} features - The features to transform.
   */
  public setFeatures(features: Collection<Feature<Geometry>>): void {
    // Clear existing features
    this.#ol_transform.features.clear();

    // Add new features
    features.forEach((feature) => {
      this.#ol_transform.features.push(feature);
    });
  }

  /**
   * Adds a feature to be transformed.
   * @param {Feature<Geometry>} feature - The feature to add.
   */
  public addFeature(feature: Feature<Geometry>): void {
    this.#ol_transform.features.push(feature);
  }

  /**
   * Removes a feature from being transformed.
   * @param {Feature<Geometry>} feature - The feature to remove.
   */
  public removeFeature(feature: Feature<Geometry>): void {
    this.#ol_transform.features.remove(feature);
  }

  /**
   * Checks if a feature is currently being transformed.
   * @param {Feature<Geometry>} feature - The feature to check.
   * @returns {boolean} True if the feature is being transformed.
   */
  public isFeatureBeingTransformed(feature: Feature<Geometry>): boolean {
    return this.#ol_transform.isFeatureBeingTransformed(feature);
  }

  /**
   * Gets the currently selected/transforming feature.
   * @returns {Feature<Geometry> | undefined} The selected feature.
   */
  public getSelectedFeature(): Feature<Geometry> | undefined {
    return this.#ol_transform.getSelectedFeature();
  }

  /**
   * Checks if any transformation is currently active.
   * @returns {boolean} True if transformation is active.
   */
  public isTransforming(): boolean {
    return this.#ol_transform.isTransforming();
  }

  /**
   * Selects a feature for transformation.
   * @param {Feature<Geometry>} feature - The feature to select.
   * @param {boolean} clearHistory - If true, clears the previous history stack. Default is true.
   */
  public selectFeature(feature: Feature<Geometry>, clearHistory: boolean = true): void {
    this.#ol_transform.selectFeature(feature, clearHistory);
  }

  /**
   * Clears the current selection.
   */
  public clearSelection(): void {
    this.#ol_transform.clearSelection();
  }

  /**
   * Displays the text editor for the selected feature
   */
  public showTextEditor(): void {
    this.#ol_transform.showTextEditor();
  }

  /**
   * Undo the last action
   */
  public undo(callback?: () => void): boolean {
    return this.#ol_transform.undo(callback);
  }

  /**
   * Redo the last action
   */
  public redo(callback?: () => void): boolean {
    return this.#ol_transform.redo(callback);
  }

  /**
   * Checks if undo is possible
   */
  public canUndo(): boolean {
    return this.#ol_transform.canUndo();
  }

  /**
   * Checks if redo is possible
   */
  public canRedo(): boolean {
    return this.#ol_transform.canRedo();
  }

  /**
   * Emits a transform start event to all handlers.
   * @param {TransformEvent} event - The event to emit.
   * @private
   */
  #emitTransformStart(event: TransformEvent): void {
    EventHelper.emitEvent(this, this.#onTransformStartHandlers, event);
  }

  /**
   * Registers a transform start event handler.
   * @param {TransformEventDelegate} callback - The callback to be executed whenever the event is emitted.
   */
  onTransformStart(callback: TransformEventDelegate): void {
    EventHelper.onEvent(this.#onTransformStartHandlers, callback);
  }

  /**
   * Unregisters a transform start event handler.
   * @param {TransformEventDelegate} callback - The callback to stop being called whenever the event is emitted.
   */
  offTransformStart(callback: TransformEventDelegate): void {
    EventHelper.offEvent(this.#onTransformStartHandlers, callback);
  }

  /**
   * Emits a transforming event to all handlers.
   * @param {TransformEvent} event - The event to emit.
   * @private
   */
  #emitTransforming(event: TransformEvent): void {
    EventHelper.emitEvent(this, this.#onTransformingHandlers, event);
  }

  /**
   * Registers a transforming event handler.
   * @param {TransformEventDelegate} callback - The callback to be executed whenever the event is emitted.
   */
  onTransforming(callback: TransformEventDelegate): void {
    EventHelper.onEvent(this.#onTransformingHandlers, callback);
  }

  /**
   * Unregisters a transforming event handler.
   * @param {TransformEventDelegate} callback - The callback to stop being called whenever the event is emitted.
   */
  offTransforming(callback: TransformEventDelegate): void {
    EventHelper.offEvent(this.#onTransformingHandlers, callback);
  }

  /**
   * Emits a transform end event to all handlers.
   * @param {TransformEvent} event - The event to emit.
   * @private
   */
  #emitTransformEnd(event: TransformEvent): void {
    EventHelper.emitEvent(this, this.#onTransformEndHandlers, event);
  }

  /**
   * Registers a transform end event handler.
   * @param {TransformEventDelegate} callback - The callback to be executed whenever the event is emitted.
   */
  onTransformEnd(callback: TransformEventDelegate): void {
    EventHelper.onEvent(this.#onTransformEndHandlers, callback);
  }

  /**
   * Unregisters a transform end event handler.
   * @param {TransformEventDelegate} callback - The callback to stop being called whenever the event is emitted.
   */
  offTransformEnd(callback: TransformEventDelegate): void {
    EventHelper.offEvent(this.#onTransformEndHandlers, callback);
  }

  /**
   * Emits a delete feature event to all handlers.
   * @param {DeleteFeatureEvent} event - The event to emit.
   * @private
   */
  #emitDeleteFeature(event: TransformDeleteFeatureEvent): void {
    EventHelper.emitEvent(this, this.#onDeleteFeatureHandlers, event);
  }

  /**
   * Registers a delete feature event handler.
   * @param {TransformDeleteFeatureEventDelegate} callback - The callback to be executed whenever the event is emitted.
   */
  onDeleteFeature(callback: TransformDeleteFeatureEventDelegate): void {
    EventHelper.onEvent(this.#onDeleteFeatureHandlers, callback);
  }

  /**
   * Unregisters a delete feature event handler.
   * @param {TransformDeleteFeatureEventDelegate} callback - The callback to stop being called whenever the event is emitted.
   */
  offDeleteFeature(callback: TransformDeleteFeatureEventDelegate): void {
    EventHelper.offEvent(this.#onDeleteFeatureHandlers, callback);
  }

  /**
   * Emits a selection change event to all handlers.
   * @param {SelectionEvent} event - The event to emit.
   * @private
   */
  #emitSelectionChange(event: TransformSelectionEvent): void {
    EventHelper.emitEvent(this, this.#onSelectionChangeHandlers, event);
  }

  /**
   * Registers a selection change event handler.
   * @param {SelectionEventDelegate} callback - The callback to be executed whenever the event is emitted.
   */
  onSelectionChange(callback: TransformSelectionEventDelegate): void {
    EventHelper.onEvent(this.#onSelectionChangeHandlers, callback);
  }

  /**
   * Unregisters a selection change event handler.
   * @param {SelectionEventDelegate} callback - The callback to stop being called whenever the event is emitted.
   */
  offSelectionChange(callback: TransformSelectionEventDelegate): void {
    EventHelper.offEvent(this.#onSelectionChangeHandlers, callback);
  }
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

// Re-export types from transform-base
export { HandleType };
export type { TransformEvent, TransformDeleteFeatureEvent, TransformSelectionEvent };
