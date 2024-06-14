import { Modify as OLModify } from 'ol/interaction';
import { ModifyEvent as OLModifyEvent, Options as OLModifyOptions } from 'ol/interaction/Modify';
import Collection from 'ol/Collection';
import Feature from 'ol/Feature';
import { FlatStyle } from 'ol/style/flat';

import EventHelper, { EventDelegateBase } from '@/api/events/event-helper';
import { TypeFeatureStyle } from '@/geo/layer/geometry/geometry-types';
import { convertTypeFeatureStyleToOpenLayersStyle } from '@/geo/utils/utilities';

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
 * Class used for modifying features on a map.
 * @class Modify
 * @extends {Interaction}
 * @exports
 */
export class Modify extends Interaction {
  /** The embedded OpenLayers Modify component. */
  #ol_modify: OLModify;

  /** Callback handlers for the modifystart event. */
  #onModifyStartedHandlers: ModifyDelegate[] = [];

  /** Callback handlers for the modifyend event. */
  #onModifyEndedHandlers: ModifyDelegate[] = [];

  /**
   * Initializes a Modify component.
   * @param {ModifyOptions} options - Object to configure the initialization of the Modify interaction.
   */
  constructor(options: ModifyOptions) {
    super(options);

    // The OpenLayers Modify options
    // TODO: Enhancements - Add support for more modifying options
    const olOptions: OLModifyOptions = {
      style: convertTypeFeatureStyleToOpenLayersStyle(options.style) as FlatStyle,
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

    // Instantiate the OpenLayers Modify interaction
    this.#ol_modify = new OLModify(olOptions);

    // Register handlers for modify events
    this.#ol_modify.on('modifystart', this.#emitModifyStarted.bind(this));
    this.#ol_modify.on('modifyend', this.#emitModifyEnded.bind(this));
  }

  /**
   * Starts the interaction on the map.
   */
  override startInteraction(): void {
    // Redirect to super method to start interaction
    super.startInteraction(this.#ol_modify);
  }

  /**
   * Stops the interaction on the map.
   */
  override stopInteraction(): void {
    // Redirect to super method to stop interaction
    super.stopInteraction(this.#ol_modify);
  }

  /**
   * Emits the modifystart event the all registered handlers.
   * @param {OLModifyEvent} event - The event to emit.
   * @private
   */
  #emitModifyStarted(event: OLModifyEvent): void {
    // Emit the modifystarted event
    EventHelper.emitEvent(this, this.#onModifyStartedHandlers, event);
  }

  /**
   * Registers a callback handler for the modifystart event.
   * @param {ModifyDelegate} callback - The callback to be executed whenever the event is emitted.
   */
  onModifyStarted(callback: ModifyDelegate): void {
    // Register the modifystarted event callback
    EventHelper.onEvent(this.#onModifyStartedHandlers, callback);
  }

  /**
   * Unregisters a callback handler for the modifystart event.
   * @param {ModifyDelegate} callback - The callback to stop being called whenever the event is emitted.
   */
  offModifyStarted(callback: ModifyDelegate): void {
    // Unregister the modifystarted event callback
    EventHelper.offEvent(this.#onModifyStartedHandlers, callback);
  }

  /**
   * Emits the modifyend event the all registered handlers.
   * @param {OLModifyEvent} event - The event to emit.
   * @private
   */
  #emitModifyEnded(event: OLModifyEvent): void {
    // Emit the modifyended event
    EventHelper.emitEvent(this, this.#onModifyEndedHandlers, event);
  }

  /**
   * Registers a callback handler for the modifyend event.
   * @param {ModifyDelegate} callback - The callback to be executed whenever the event is emitted.
   */
  onModifyEnded(callback: ModifyDelegate): void {
    // Register the modifyended event callback
    EventHelper.onEvent(this.#onModifyEndedHandlers, callback);
  }

  /**
   * Unregisters a callback handler for the modifyend event.
   * @param {ModifyDelegate} callback - The callback to stop being called whenever the event is emitted.
   */
  offModifyEnded(callback: ModifyDelegate): void {
    // Unregister the modifyended event callback
    EventHelper.offEvent(this.#onModifyEndedHandlers, callback);
  }
}

/**
 * Define a delegate for the event handler function signature
 */
type ModifyDelegate = EventDelegateBase<Modify, OLModifyEvent, void>;
