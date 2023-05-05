import { Translate as OLTranslate } from 'ol/interaction';
import { TranslateEvent as OLTranslateEvent } from 'ol/interaction/Translate';
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
 * Class used to handle functions for selecting drawings on a map
 *
 * @exports
 * @class Translate
 */
export declare class Translate extends Interaction {
    ol_translate: OLTranslate;
    /**
     * Initialize Translate component
     * @param {TranslateOptions} options object to configure the initialization of the Translate interaction
     */
    constructor(options: TranslateOptions);
    /**
     * Starts the interaction on the map
     */
    startInteraction(): void;
    /**
     * Stops the interaction on the map
     */
    stopInteraction(): void;
    /**
     * Handles when the translation has started
     * @param {OLTranslateEvent} e object representing the Open Layers event from the interaction
     */
    onTranslateStarted: (e: OLTranslateEvent) => void;
    /**
     * Handles when the translation has ended
     * @param {OLTranslateEvent} e object representing the Open Layers event from the interaction
     */
    onTranslateEnded: (e: OLTranslateEvent) => void;
}
