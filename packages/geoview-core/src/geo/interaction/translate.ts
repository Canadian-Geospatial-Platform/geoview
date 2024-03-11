import { Translate as OLTranslate } from 'ol/interaction';
import { TranslateEvent as OLTranslateEvent, Options as OLTranslateOptions } from 'ol/interaction/Translate';
import Collection from 'ol/Collection';
import Feature from 'ol/Feature';

import { Interaction, InteractionOptions } from './interaction';

/**
 * Supported options for translate interactions
 */
export type TranslateOptions = InteractionOptions & {
  features?: Collection<Feature>;
};

/**
 * Define a delegate for the event handler function signature
 */
type TranslateDelegate = (sender: Translate, event: OLTranslateEvent) => void;

/**
 * Class used to handle functions for selecting drawings on a map
 *
 * @exports
 * @class Translate
 */
export class Translate extends Interaction {
  // The embedded Open Layers Translate component
  ol_translate: OLTranslate;

  // Keep all callback delegates references
  private onTranslateStartedHandlers: TranslateDelegate[] = [];

  // Keep all callback delegates references
  private onTranslateEndedHandlers: TranslateDelegate[] = [];

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
    this.ol_translate = new OLTranslate(olOptions);

    // Wire handler when drawing is changed
    this.ol_translate.on('translatestart', this.emitTranslateStarted);
    this.ol_translate.on('translateend', this.emitTranslateEnded);
  }

  /**
   * Starts the interaction on the map
   */
  public startInteraction() {
    // Redirect
    super.startInteraction(this.ol_translate);
  }

  /**
   * Stops the interaction on the map
   */
  public stopInteraction() {
    // Redirect
    super.stopInteraction(this.ol_translate);
  }

  /**
   * Wires an event handler.
   * @param {TranslateDelegate} callback The callback to be executed whenever the event is raised
   */
  onTranslateStarted = (callback: TranslateDelegate): void => {
    // Push a new callback handler to the list of handlers
    this.onTranslateStartedHandlers.push(callback);
  };

  /**
   * Unwires an event handler.
   * @param {TranslateDelegate} callback The callback to stop being called whenever the event is raised
   */
  offTranslateStarted = (callback: TranslateDelegate): void => {
    const index = this.onTranslateStartedHandlers.indexOf(callback);
    if (index !== -1) {
      this.onTranslateStartedHandlers.splice(index, 1);
    }
  };

  /**
   * Handles when the translation has started
   * @param {OLTranslateEvent} translateEvent object representing the Open Layers event from the interaction
   */
  emitTranslateStarted = (translateEvent: OLTranslateEvent) => {
    // Trigger all the handlers in the array
    this.onTranslateStartedHandlers.forEach((handler) => handler(this, translateEvent));
  };

  /**
   * Wires an event handler.
   * @param {TranslateDelegate} callback The callback to be executed whenever the event is raised
   */
  onTranslateEnded = (callback: TranslateDelegate): void => {
    // Push a new callback handler to the list of handlers
    this.onTranslateEndedHandlers.push(callback);
  };

  /**
   * Unwires an event handler.
   * @param {TranslateDelegate} callback The callback to stop being called whenever the event is raised
   */
  offTranslateEnded = (callback: TranslateDelegate): void => {
    const index = this.onTranslateEndedHandlers.indexOf(callback);
    if (index !== -1) {
      this.onTranslateEndedHandlers.splice(index, 1);
    }
  };

  /**
   * Handles when the translation has started
   * @param {OLTranslateEvent} translateEvent object representing the Open Layers event from the interaction
   */
  emitTranslateEnded = (translateEvent: OLTranslateEvent) => {
    // Trigger all the handlers in the array
    this.onTranslateEndedHandlers.forEach((handler) => handler(this, translateEvent));
  };
}
