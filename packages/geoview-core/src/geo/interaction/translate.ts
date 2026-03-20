import { Translate as OLTranslate } from 'ol/interaction';
import type { TranslateEvent as OLTranslateEvent, Options as OLTranslateOptions } from 'ol/interaction/Translate';
import type Collection from 'ol/Collection';
import type Feature from 'ol/Feature';

import type { EventDelegateBase } from '@/api/events/event-helper';
import EventHelper from '@/api/events/event-helper';

import type { InteractionOptions } from './interaction';
import { Interaction } from './interaction';

/**
 * Supported options for translate interactions
 */
export type TranslateOptions = InteractionOptions & {
  features?: Collection<Feature>;
};

/**
 * Class used to translate drawings on a map.
 */
export class Translate extends Interaction {
  /** The embedded OpenLayers Translate component */
  #olTranslate: OLTranslate;

  /** Keep all callback delegates references */
  #onTranslateStartedHandlers: TranslateDelegate[] = [];

  /** Keep all callback delegates references */
  #onTranslateEndedHandlers: TranslateDelegate[] = [];

  /**
   * Initializes the Translate component.
   *
   * @param options - Object to configure the initialization of the Translate interaction
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
    this.#olTranslate = new OLTranslate(olOptions);

    // Register handler when translation starts/ends
    this.#olTranslate.on('translatestart', this.#emitTranslateStarted.bind(this));
    this.#olTranslate.on('translateend', this.#emitTranslateEnded.bind(this));
  }

  /**
   * Starts the interaction on the map.
   */
  override startInteraction(): void {
    // Redirect to super method to start interaction
    super.startInteraction(this.#olTranslate);
  }

  /**
   * Stops the interaction on the map.
   */
  override stopInteraction(): void {
    // Redirect to super method to stop interaction
    super.stopInteraction(this.#olTranslate);
  }

  /**
   * Emits the translate started event to all registered handlers.
   *
   * @param event - The event to emit
   */
  #emitTranslateStarted(event: OLTranslateEvent): void {
    // Emit the translatestarted event
    EventHelper.emitEvent(this, this.#onTranslateStartedHandlers, event);
  }

  /**
   * Registers an event handler for translate started event.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   */
  onTranslateStarted(callback: TranslateDelegate): void {
    // Register the translatestarted event callback
    EventHelper.onEvent(this.#onTranslateStartedHandlers, callback);
  }

  /**
   * Unregisters an event handler for translate started event.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offTranslateStarted(callback: TranslateDelegate): void {
    // Unregister the translatestarted event callback
    EventHelper.offEvent(this.#onTranslateStartedHandlers, callback);
  }

  /**
   * Emits the translate ended event to all registered handlers.
   *
   * @param event - The event to emit
   */
  #emitTranslateEnded(event: OLTranslateEvent): void {
    // Emit the translateended event
    EventHelper.emitEvent(this, this.#onTranslateEndedHandlers, event);
  }

  /**
   * Registers an event handler for translate ended event.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   */
  onTranslateEnded(callback: TranslateDelegate): void {
    // Register the translateended event callback
    EventHelper.onEvent(this.#onTranslateEndedHandlers, callback);
  }

  /**
   * Unregisters an event handler for translate ended event.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offTranslateEnded(callback: TranslateDelegate): void {
    // Unregister the translateended event callback
    EventHelper.offEvent(this.#onTranslateEndedHandlers, callback);
  }
}

/**
 * Delegate for the translate event handler function signature.
 */
type TranslateDelegate = EventDelegateBase<Translate, OLTranslateEvent, void>;
