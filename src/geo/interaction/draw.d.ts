import type { GeometryFunction, DrawEvent as OLDrawEvent } from 'ol/interaction/Draw';
import type { EventDelegateBase } from '@/api/events/event-helper';
import type { TypeFeatureStyle } from '@/geo/layer/geometry/geometry-types';
import type { InteractionOptions } from './interaction';
import { Interaction } from './interaction';
import type { GeometryApi } from '@/geo/layer/geometry/geometry';
/**
 * Supported options for drawing interactions
 */
export type DrawOptions = InteractionOptions & {
    geometryGroupKey: string;
    freehand?: boolean;
    type?: string;
    style?: TypeFeatureStyle;
    geometryFunction?: GeometryFunction;
};
/**
 * Class used for drawing features on a map.
 */
export declare class Draw extends Interaction {
    #private;
    /**
     * Initializes a Draw component.
     *
     * @param options - Object to configure the initialization of the Draw interaction
     * @param geometryApi - The geometry API used to retrieve geometry groups if a geometry group key is provided in the options
     */
    constructor(options: DrawOptions, geometryApi: GeometryApi);
    /**
     * Starts the interaction on the map.
     */
    startInteraction(): void;
    /**
     * Stops the interaction on the map.
     */
    stopInteraction(): void;
    /**
     * Finishes the current drawing, triggering the drawend event.
     * This is equivalent to double-clicking or pressing Enter to complete a drawing.
     */
    finishDrawing(): void;
    /**
     * Removes the last point added to the current drawing, allowing the user to undo the last step while drawing.
     *
     * @returns True if a point was removed, false if there were no points to remove
     */
    undo(): boolean;
    /**
     * Registers a callback handler for the drawstart event.
     *
     * @param callback - The callback to be executed whenever the event is emitted
     */
    onDrawStart(callback: DrawDelegate): void;
    /**
     * Unregisters a callback handler for the drawstart event.
     *
     * @param callback - The callback to stop being called whenever the event is emitted
     */
    offDrawStart(callback: DrawDelegate): void;
    /**
     * Registers a callback handler for the drawend event.
     *
     * @param callback - The callback to be executed whenever the event is emitted
     */
    onDrawEnd(callback: DrawDelegate): void;
    /**
     * Unregisters a callback handler for the drawend event.
     *
     * @param callback - The callback to stop being called whenever the event is emitted
     */
    offDrawEnd(callback: DrawDelegate): void;
    /**
     * Registers a callback handler for the drawabort event.
     *
     * @param callback - The callback to be executed whenever the event is emitted
     */
    onDrawAbort(callback: DrawDelegate): void;
    /**
     * Unregisters a callback handler for the drawabort event.
     *
     * @param callback - The callback to stop being called whenever the event is emitted
     */
    offDrawAbort(callback: DrawDelegate): void;
}
/**
 * Delegate for the draw event handler function signature.
 */
type DrawDelegate = EventDelegateBase<Draw, OLDrawEvent, void>;
export {};
//# sourceMappingURL=draw.d.ts.map