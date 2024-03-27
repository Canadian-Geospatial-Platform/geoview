import { Translate as OLTranslate } from 'ol/interaction';
import { TranslateEvent as OLTranslateEvent, Options as OLTranslateOptions } from 'ol/interaction/Translate';
import Collection from 'ol/Collection';
import Feature from 'ol/Feature';

import EventHelper, { EventDelegateBase } from '@/api/events/event-helper';

import { Interaction, InteractionOptions } from './interaction';

/**
 * Supported options for translate interactions
 */
export type TranslateOptions = InteractionOptions & {
  features?: Collection<Feature>;
};

/**
 * Class used to handle functions for selecting drawings on a map
 *
 * @exports
 * @class Translate
 */
export class Translate extends Interaction {
  // The embedded Open Layers Translate component
  #ol_translate: OLTranslate;

  // Keep all callback delegates references
  #onTranslateStartedHandlers: TranslateDelegate[] = [];

  // Keep all callback delegates references
  #onTranslateEndedHandlers: TranslateDelegate[] = [];

  /**
   * Initialize Translate component
   * @param {TranslateOptions} options object to configure the initialization of the Translate interaction
   */
  constructor(options: TranslateOptions) {
    super(options);

    // The OpenLayers Translate options
    // TODO: Enhancements - Add support for more translating options
    const olOptions: OLTranslateOptions = {};

    // If a list of features is specified
    if (options.features) {
      // Set the features to snap to
      olOptions.features = options.features;
    }

    // Activate the OpenLayers Translate module
    this.#ol_translate = new OLTranslate(olOptions);

    // Wire handler when drawing is changed
    this.#ol_translate.on('translatestart', this.emitTranslateStarted);
    this.#ol_translate.on('translateend', this.emitTranslateEnded);
  }

  /**
   * Starts the interaction on the map
   */
  public startInteraction() {
    // Redirect
    super.startInteraction(this.#ol_translate);
  }

  /**
   * Stops the interaction on the map
   */
  public stopInteraction() {
    // Redirect
    super.stopInteraction(this.#ol_translate);
  }

  /**
   * Emits an event to all handlers.
   * @param {OLTranslateEvent} event The event to emit
   */
  emitTranslateStarted = (event: OLTranslateEvent) => {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onTranslateStartedHandlers, event);
  };

  /**
   * Wires an event handler.
   * @param {TranslateDelegate} callback The callback to be executed whenever the event is emitted
   */
  onTranslateStarted = (callback: TranslateDelegate): void => {
    // Wire the event handler
    EventHelper.onEvent(this.#onTranslateStartedHandlers, callback);
  };

  /**
   * Unwires an event handler.
   * @param {TranslateDelegate} callback The callback to stop being called whenever the event is emitted
   */
  offTranslateStarted = (callback: TranslateDelegate): void => {
    // Unwire the event handler
    EventHelper.offEvent(this.#onTranslateStartedHandlers, callback);
  };

  /**
   * Emits an event to all handlers.
   * @param {OLTranslateEvent} event The event to emit
   */
  emitTranslateEnded = (event: OLTranslateEvent) => {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onTranslateEndedHandlers, event);
  };

  /**
   * Wires an event handler.
   * @param {SelectChangedDeTranslateDelegatelegate} callback The callback to be executed whenever the event is emitted
   */
  onTranslateEnded = (callback: TranslateDelegate): void => {
    // Wire the event handler
    EventHelper.onEvent(this.#onTranslateEndedHandlers, callback);
  };

  /**
   * Unwires an event handler.
   * @param {TranslateDelegate} callback The callback to stop being called whenever the event is emitted
   */
  offTranslateEnded = (callback: TranslateDelegate): void => {
    // Unwire the event handler
    EventHelper.offEvent(this.#onTranslateEndedHandlers, callback);
  };
}

/**
 * Define a delegate for the event handler function signature
 */
type TranslateDelegate = EventDelegateBase<Translate, OLTranslateEvent>;
