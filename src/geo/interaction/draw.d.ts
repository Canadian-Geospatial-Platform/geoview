import { Draw as OLDraw } from 'ol/interaction';
import { DrawEvent as OLDrawEvent } from 'ol/interaction/Draw';
import { Interaction, InteractionOptions } from './interaction';
import { TypeFeatureStyle } from '../layer/vector/vector-types';
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
 * @exports
 * @class Draw
 */
export declare class Draw extends Interaction {
    ol_draw: OLDraw;
    /**
     * Initialize Draw component
     * @param {DrawOptions} options object to configure the initialization of the Draw interaction
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
     * Handle when the drawing has started
     * @param {OLDrawEvent} e object representing the Open Layers event from the interaction
     */
    onDrawStart: (e: OLDrawEvent) => void;
    /**
     * Handles when the drawing has ended
     * @param {OLDrawEvent} e object representing the Open Layers event from the interaction
     */
    onDrawEnd: (e: OLDrawEvent) => void;
    /**
     * Handles when the drawing has aborted
     * @param {OLDrawEvent} e object representing the Open Layers event from the interaction
     */
    onDrawAbort: (e: OLDrawEvent) => void;
}
