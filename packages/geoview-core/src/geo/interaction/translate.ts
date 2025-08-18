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
 * Class used to translate drawings on a map.
 * @class
 * @extends {Interaction}
 * @exports
 */
export class Translate extends Interaction {
  /** The embedded OpenLayers Translate component */
  #ol_translate: OLTranslate;

  /** Keep all callback delegates references */
  #onTranslateStartedHandlers: TranslateDelegate[] = [];

  /** Keep all callback delegates references */
  #onTranslateEndedHandlers: TranslateDelegate[] = [];

  /**
   * Initializes the Translate component.
   * @param {TranslateOptions} options - Object to configure the initialization of the Translate interaction.
   */
  constructor(options: TranslateOptions) {
    super(options);

    // The OpenLayers Translate options
    const olOptions: OLTranslateOptions = {};

    // If a list of features is specified, set the features to translate
    if (options.features) {
      olOptions.features = options.features;
    }

    // Instantiate the OpenLayers Translate interaction
    this.#ol_translate = new OLTranslate(olOptions);

    // Register handler when translation starts/ends
    this.#ol_translate.on('translatestart', this.#emitTranslateStarted.bind(this));
    this.#ol_translate.on('translateend', this.#emitTranslateEnded.bind(this));
  }

  /**
   * Starts the interaction on the map.
   * @override
   */
  override startInteraction(): void {
    // Redirect to super method to start interaction
    super.startInteraction(this.#ol_translate);
  }

  /**
   * Stops the interaction on the map.
   * @override
   */
  override stopInteraction(): void {
    // Redirect to super method to stop interaction
    super.stopInteraction(this.#ol_translate);
  }

  /**
   * Emits the translate started event the all registered handlers.
   * @param {OLTranslateEvent} event - The event to emit.
   * @private
   */
  #emitTranslateStarted(event: OLTranslateEvent): void {
    // Emit the translatestarted event
    EventHelper.emitEvent(this, this.#onTranslateStartedHandlers, event);
  }

  /**
   * Registers an event handler for translate started event.
   * @param {TranslateDelegate} callback - The callback to be executed whenever the event is emitted.
   */
  onTranslateStarted(callback: TranslateDelegate): void {
    // Register the translatestarted event callback
    EventHelper.onEvent(this.#onTranslateStartedHandlers, callback);
  }

  /**
   * Unregisters an event handler for translate started event.
   * @param {TranslateDelegate} callback - The callback to stop being called whenever the event is emitted.
   */
  offTranslateStarted(callback: TranslateDelegate): void {
    // Unregister the translatestarted event callback
    EventHelper.offEvent(this.#onTranslateStartedHandlers, callback);
  }

  /**
   * Emits the translate ended event the all registered handlers.
   * @param {OLTranslateEvent} event - The event to emit.
   * @private
   */
  #emitTranslateEnded(event: OLTranslateEvent): void {
    // Emit the translateended event
    EventHelper.emitEvent(this, this.#onTranslateEndedHandlers, event);
  }

  /**
   * Registers an event handler for translate ended event.
   * @param {TranslateDelegate} callback - The callback to be executed whenever the event is emitted.
   */
  onTranslateEnded(callback: TranslateDelegate): void {
    // Register the translateended event callback
    EventHelper.onEvent(this.#onTranslateEndedHandlers, callback);
  }

  /**
   * Unregisters an event handler for translate ended event.
   * @param {TranslateDelegate} callback - The callback to stop being called whenever the event is emitted.
   */
  offTranslateEnded(callback: TranslateDelegate): void {
    // Unregister the translateended event callback
    EventHelper.offEvent(this.#onTranslateEndedHandlers, callback);
  }
}

/**
 * Define a delegate for the event handler function signature
 */
type TranslateDelegate = EventDelegateBase<Translate, OLTranslateEvent, void>;
