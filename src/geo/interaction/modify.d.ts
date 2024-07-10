import { ModifyEvent as OLModifyEvent } from 'ol/interaction/Modify';
import Collection from 'ol/Collection';
import Feature from 'ol/Feature';
import { EventDelegateBase } from '@/api/events/event-helper';
import { TypeFeatureStyle } from '@/geo/layer/geometry/geometry-types';
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
export declare class Modify extends Interaction {
    #private;
    /**
     * Initializes a Modify component.
     * @param {ModifyOptions} options - Object to configure the initialization of the Modify interaction.
     */
    constructor(options: ModifyOptions);
    /**
     * Starts the interaction on the map.
     */
    startInteraction(): void;
    /**
     * Stops the interaction on the map.
     */
    stopInteraction(): void;
    /**
     * Registers a callback handler for the modifystart event.
     * @param {ModifyDelegate} callback - The callback to be executed whenever the event is emitted.
     */
    onModifyStarted(callback: ModifyDelegate): void;
    /**
     * Unregisters a callback handler for the modifystart event.
     * @param {ModifyDelegate} callback - The callback to stop being called whenever the event is emitted.
     */
    offModifyStarted(callback: ModifyDelegate): void;
    /**
     * Registers a callback handler for the modifyend event.
     * @param {ModifyDelegate} callback - The callback to be executed whenever the event is emitted.
     */
    onModifyEnded(callback: ModifyDelegate): void;
    /**
     * Unregisters a callback handler for the modifyend event.
     * @param {ModifyDelegate} callback - The callback to stop being called whenever the event is emitted.
     */
    offModifyEnded(callback: ModifyDelegate): void;
}
/**
 * Define a delegate for the event handler function signature
 */
type ModifyDelegate = EventDelegateBase<Modify, OLModifyEvent, void>;
export {};
