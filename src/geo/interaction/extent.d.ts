import type { ExtentEvent as olExtentEvent } from 'ol/interaction/Extent';
import type { EventDelegateBase } from '@/api/events/event-helper';
import type { TypeFeatureStyle } from '@/geo/layer/geometry/geometry-types';
import type { InteractionOptions } from './interaction';
import { Interaction } from './interaction';
/**
 * Supported options for extent interactions
 */
export type ExtentOptions = InteractionOptions & {
    boxStyle?: TypeFeatureStyle;
    pixelTolerance?: number;
};
/**
 * Class used for drawing an extent on a map.
 */
export declare class Extent extends Interaction {
    #private;
    /**
     * Initializes an Extent component.
     *
     * @param options - An object to configure the initialization of the Extent interaction
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
     *
     * @param callback - The callback to be executed whenever the event is emitted
     */
    onExtentChanged(callback: ExtentDelegate): void;
    /**
     * Unregisters an event handler for extent change events.
     *
     * @param callback - The callback to stop being called whenever the event is emitted
     */
    offExtentChanged(callback: ExtentDelegate): void;
}
/**
 * Delegate for the extent event handler function signature.
 */
type ExtentDelegate = EventDelegateBase<Extent, olExtentEvent, void>;
export {};
//# sourceMappingURL=extent.d.ts.map