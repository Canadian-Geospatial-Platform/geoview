import { DrawEvent as OLDrawEvent } from 'ol/interaction/Draw';
import { EventDelegateBase } from '@/api/events/event-helper';
import { TypeFeatureStyle } from '@/geo/layer/geometry/geometry-types';
import { Interaction, InteractionOptions } from './interaction';
/**
 * Supported options for drawing interactions
 */
export type DrawOptions = InteractionOptions & {
    geometryGroupKey: string;
    freehand?: boolean;
    type?: string;
    style?: TypeFeatureStyle;
};
/**
 * Class used for drawing features on a map
 *
 * @class Draw
 * @extends {Interaction}
 * @exports
 */
export declare class Draw extends Interaction {
    #private;
    /**
     * Initializes a Draw component.
     * @param {DrawOptions} options - Object to configure the initialization of the Draw interaction.
     */
    constructor(options: DrawOptions);
    /**
     * Starts the interaction on the map
     */
    startInteraction(): void;
    /**
     * Stops the interaction on the map
     */
    stopInteraction(): void;
    /**
     * Registers a callback handler for the drawstart event.
     * @param {DrawDelegate} callback - The callback to be executed whenever the event is emitted.
     */
    onDrawStart(callback: DrawDelegate): void;
    /**
     * Unregisters a callback handler for the drawstart event.
     * @param {DrawDelegate} callback - The callback to stop being called whenever the event is emitted.
     */
    offDrawStart(callback: DrawDelegate): void;
    /**
     * Registers a callback handler for the drawend event.
     * @param {DrawDelegate} callback - The callback to be executed whenever the event is emitted.
     */
    onDrawEnd(callback: DrawDelegate): void;
    /**
     * Unregisters a callback handler for the drawend event.
     * @param {DrawDelegate} callback - The callback to stop being called whenever the event is emitted.
     */
    offDrawEnd(callback: DrawDelegate): void;
    /**
     * Registers a callback handler for the drawabort event.
     * @param {DrawDelegate} callback - The callback to be executed whenever the event is emitted.
     */
    onDrawAbort(callback: DrawDelegate): void;
    /**
     * Unregisters a callback handler for the drawabort event.
     * @param {DrawDelegate} callback - The callback to stop being called whenever the event is emitted.
     */
    offDrawAbort(callback: DrawDelegate): void;
}
/**
 * Define a delegate for the event handler function signature
 */
type DrawDelegate = EventDelegateBase<Draw, OLDrawEvent, void>;
export {};
