import { ExtentEvent as OLExtentEvent } from 'ol/interaction/Extent';
import { EventDelegateBase } from '@/api/events/event-helper';
import { TypeFeatureStyle } from '@/geo/layer/geometry/geometry-types';
import { Interaction, InteractionOptions } from './interaction';
/**
 * Supported options for extent interactions
 */
export type ExtentOptions = InteractionOptions & {
    boxStyle?: TypeFeatureStyle;
    pixelTolerance?: number;
};
/**
 * Class used for drawing an extent on a map.
 * @class Extent
 * @extends {Interaction}
 * @exports
 */
export declare class Extent extends Interaction {
    #private;
    /**
     * Initializes an Extent component.
     * @param {ExtentOptions} options - An object to configure the initialization of the Extent interaction.
     */
    constructor(options: ExtentOptions);
    /**
     * Starts the interaction on the map.
     */
    startInteraction(): void;
    /**
     * Stops the interaction on the map.
     */
    stopInteraction(): void;
    /**
     * Registers an event handler for extent change events.
     * @param {ExtentDelegate} callback - The callback to be executed whenever the event is emitted.
     */
    onExtentChanged(callback: ExtentDelegate): void;
    /**
     * Unregisters an event handler for extent change events.
     * @param {ExtentDelegate} callback - The callback to stop being called whenever the event is emitted.
     */
    offExtentChanged(callback: ExtentDelegate): void;
}
/**
 * Define a delegate for the event handler function signature
 */
type ExtentDelegate = EventDelegateBase<Extent, OLExtentEvent, void>;
export {};
