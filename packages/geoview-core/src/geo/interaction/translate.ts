import { Translate as OLTranslate } from 'ol/interaction';
import { TranslateEvent as OLTranslateEvent, Options as OLTranslateOptions } from 'ol/interaction/Translate';
import Collection from 'ol/Collection';
import Feature from 'ol/Feature';
import { Interaction, InteractionOptions } from './interaction';
import { api } from '@/app';
import { EVENT_NAMES } from '@/api/events/event-types';
import { translatePayload } from '@/api/events/payloads';

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
  ol_translate: OLTranslate;

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
    this.ol_translate.on('translatestart', this.onTranslateStarted);
    this.ol_translate.on('translateend', this.onTranslateEnded);
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
   * Handles when the translation has started
   * @param {OLTranslateEvent} e object representing the Open Layers event from the interaction
   */
  onTranslateStarted = (e: OLTranslateEvent) => {
    api.event.emit(translatePayload(EVENT_NAMES.INTERACTION.EVENT_TRANSLATE_STARTED, this.mapViewer.mapId, e));
  };

  /**
   * Handles when the translation has ended
   * @param {OLTranslateEvent} e object representing the Open Layers event from the interaction
   */
  onTranslateEnded = (e: OLTranslateEvent) => {
    api.event.emit(translatePayload(EVENT_NAMES.INTERACTION.EVENT_TRANSLATE_ENDED, this.mapViewer.mapId, e));
  };
}
