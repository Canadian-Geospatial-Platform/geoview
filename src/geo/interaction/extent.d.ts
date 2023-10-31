import { Extent as OLExtent } from 'ol/interaction';
import { ExtentEvent as OLExtentEvent } from 'ol/interaction/Extent';
import { Interaction, InteractionOptions } from './interaction';
import { TypeFeatureStyle } from '@/geo/layer/geometry/geometry-types';
/**
 * Supported options for extent interactions
 */
export type ExtentOptions = InteractionOptions & {
    boxStyle?: TypeFeatureStyle;
    pixelTolerance?: number;
};
/**
 * Class used for drawing extent on a map
 *
 * @exports
 * @class Extent
 */
export declare class Extent extends Interaction {
    ol_extent: OLExtent;
    /**
     * Initialize Extent component
     * @param {ExtentOptions} options object to configure the initialization of the Extent interaction
     */
    constructor(options: ExtentOptions);
    /**
     * Starts the interaction on the map
     */
    startInteraction(): void;
    /**
     * Stops the interaction on the map
     */
    stopInteraction(): void;
    /**
     * Handles when the extent has changed
     * @param {OLExtentEvent} e object representing the Open Layers event from the interaction
     */
    onExtentChanged: (e: OLExtentEvent) => void;
}
