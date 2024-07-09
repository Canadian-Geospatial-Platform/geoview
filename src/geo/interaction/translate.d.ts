import { TranslateEvent as OLTranslateEvent } from 'ol/interaction/Translate';
import Collection from 'ol/Collection';
import Feature from 'ol/Feature';
import { EventDelegateBase } from '@/api/events/event-helper';
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
export declare class Translate extends Interaction {
    #private;
    /**
     * Initializes the Translate component.
     * @param {TranslateOptions} options - Object to configure the initialization of the Translate interaction.
     */
    constructor(options: TranslateOptions);
    /**
     * Starts the interaction on the map.
     */
    startInteraction(): void;
    /**
     * Stops the interaction on the map.
     */
    stopInteraction(): void;
    /**
     * Registers an event handler for translate started event.
     * @param {TranslateDelegate} callback - The callback to be executed whenever the event is emitted.
     */
    onTranslateStarted(callback: TranslateDelegate): void;
    /**
     * Unregisters an event handler for translate started event.
     * @param {TranslateDelegate} callback - The callback to stop being called whenever the event is emitted.
     */
    offTranslateStarted(callback: TranslateDelegate): void;
    /**
     * Registers an event handler for translate ended event.
     * @param {TranslateDelegate} callback - The callback to be executed whenever the event is emitted.
     */
    onTranslateEnded(callback: TranslateDelegate): void;
    /**
     * Unregisters an event handler for translate ended event.
     * @param {TranslateDelegate} callback - The callback to stop being called whenever the event is emitted.
     */
    offTranslateEnded(callback: TranslateDelegate): void;
}
/**
 * Define a delegate for the event handler function signature
 */
type TranslateDelegate = EventDelegateBase<Translate, OLTranslateEvent, void>;
export {};
