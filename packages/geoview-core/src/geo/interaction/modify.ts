import { Modify as OLModify } from 'ol/interaction';
import { ModifyEvent as OLModifyEvent, Options as OLModifyOptions } from 'ol/interaction/Modify';
import Collection from 'ol/Collection';
import Feature from 'ol/Feature';
import { FlatStyle } from 'ol/style/flat';

import { TypeFeatureStyle } from '@/geo/layer/geometry/geometry-types';
import { GeoUtilities } from '@/geo/utils/utilities';

import { Interaction, InteractionOptions } from './interaction';

/**
 * Supported options for modify interactions
 */
export type ModifyOptions = InteractionOptions & {
  geometryGroupKey?: string;
  features?: Collection<Feature>;
  style?: TypeFeatureStyle;
};

/**
 * Define a delegate for the event handler function signature
 */
type ModifyDelegate = (sender: Modify, event: OLModifyEvent) => void;

/**
 * Class used for modifying features on a map
 *
 * @exports
 * @class Modify
 */
export class Modify extends Interaction {
  // The embedded Open Layers Modify component
  ol_modify: OLModify;

  // Keep all callback delegates references
  private onModifyStartedHandlers: ModifyDelegate[] = [];

  // Keep all callback delegates references
  private onModifyEndedHandlers: ModifyDelegate[] = [];

  /**
   * Initialize Modify component
   * @param {ModifyOptions} options object to configure the initialization of the Modify interaction
   */
  constructor(options: ModifyOptions) {
    super(options);

    // The OpenLayers Modify options
    // TODO: Enhancements - Add support for more modifying options
    const olOptions: OLModifyOptions = {
      style: new GeoUtilities().convertTypeFeatureStyleToOpenLayersStyle(options.style) as FlatStyle,
    };

    // If a list of features is specified
    if (options.features) {
      // Set the features to snap to
      olOptions.features = options.features;
    } else if (options.geometryGroupKey) {
      // If a geometry group key is set
      // Get the vector source for the geometry group or create one when not existing
      const geomGroup = this.mapViewer.layer.geometry?.createGeometryGroup(options.geometryGroupKey);
      olOptions.source = geomGroup?.vectorSource;
    }

    // Activate the OpenLayers Modify module
    this.ol_modify = new OLModify(olOptions);

    // Wire handler when modification is started
    this.ol_modify.on('modifystart', this.emitModifyStarted);
    // Wire handler when modification is ended
    this.ol_modify.on('modifyend', this.emitModifyEnded);
  }

  /**
   * Starts the interaction on the map
   */
  public startInteraction() {
    // Redirect
    super.startInteraction(this.ol_modify);
  }

  /**
   * Stops the interaction on the map
   */
  public stopInteraction() {
    // Redirect
    super.stopInteraction(this.ol_modify);
  }

  /**
   * Wires an event handler.
   * @param callback The callback to be executed whenever the event is raised
   */
  onModifyStarted = (callback: ModifyDelegate): void => {
    // Push a new callback handler to the list of handlers
    this.onModifyStartedHandlers.push(callback);
  };

  /**
   * Unwires an event handler.
   * @param callback The callback to stop being called whenever the event is raised
   */
  offModifyStarted = (callback: ModifyDelegate): void => {
    const index = this.onModifyStartedHandlers.indexOf(callback);
    if (index !== -1) {
      this.onModifyStartedHandlers.splice(index, 1);
    }
  };

  /**
   * Emits an event to all handlers.
   * @param {OLSelectEvent} modifyEvent object representing the Open Layers event from the interaction
   */
  emitModifyStarted = (modifyEvent: OLModifyEvent) => {
    // Trigger all the handlers in the array
    this.onModifyStartedHandlers.forEach((handler) => handler(this, modifyEvent));
  };

  /**
   * Wires an event handler.
   * @param callback The callback to be executed whenever the event is raised
   */
  onModifyEnded = (callback: ModifyDelegate): void => {
    // Push a new callback handler to the list of handlers
    this.onModifyEndedHandlers.push(callback);
  };

  /**
   * Unwires an event handler.
   * @param callback The callback to stop being called whenever the event is raised
   */
  offModifyEnded = (callback: ModifyDelegate): void => {
    const index = this.onModifyEndedHandlers.indexOf(callback);
    if (index !== -1) {
      this.onModifyEndedHandlers.splice(index, 1);
    }
  };

  /**
   * Emits an event to all handlers.
   * @param {OLSelectEvent} modifyEvent object representing the Open Layers event from the interaction
   */
  emitModifyEnded = (modifyEvent: OLModifyEvent) => {
    // Trigger all the handlers in the array
    this.onModifyEndedHandlers.forEach((handler) => handler(this, modifyEvent));
  };
}
