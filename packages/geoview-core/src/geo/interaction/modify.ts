import { Modify as OLModify } from 'ol/interaction';
import { ModifyEvent as OLModifyEvent, Options as OLModifyOptions } from 'ol/interaction/Modify';
import Collection from 'ol/Collection';
import Feature from 'ol/Feature';
import { FlatStyle } from 'ol/style/flat';

import EventHelper, { EventDelegateBase } from '@/api/events/event-helper';
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
   * Emits an event to all handlers.
   * @param {OLModifyEvent} event The event to emit
   */
  emitModifyStarted = (event: OLModifyEvent) => {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.onModifyStartedHandlers, event);
  };

  /**
   * Wires an event handler.
   * @param {ModifyDelegate} callback The callback to be executed whenever the event is emitted
   */
  onModifyStarted = (callback: ModifyDelegate): void => {
    // Wire the event handler
    EventHelper.onEvent(this.onModifyStartedHandlers, callback);
  };

  /**
   * Unwires an event handler.
   * @param {ModifyDelegate} callback The callback to stop being called whenever the event is emitted
   */
  offModifyStarted = (callback: ModifyDelegate): void => {
    // Unwire the event handler
    EventHelper.offEvent(this.onModifyStartedHandlers, callback);
  };

  /**
   * Emits an event to all handlers.
   * @param {OLModifyEvent} event The event to emit
   */
  emitModifyEnded = (event: OLModifyEvent) => {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.onModifyEndedHandlers, event);
  };

  /**
   * Wires an event handler.
   * @param {ModifyDelegate} callback The callback to be executed whenever the event is emitted
   */
  onModifyEnded = (callback: ModifyDelegate): void => {
    // Wire the event handler
    EventHelper.onEvent(this.onModifyEndedHandlers, callback);
  };

  /**
   * Unwires an event handler.
   * @param {ModifyDelegate} callback The callback to stop being called whenever the event is emitted
   */
  offModifyEnded = (callback: ModifyDelegate): void => {
    // Unwire the event handler
    EventHelper.offEvent(this.onModifyEndedHandlers, callback);
  };
}

/**
 * Define a delegate for the event handler function signature
 */
type ModifyDelegate = EventDelegateBase<Modify, OLModifyEvent>;
