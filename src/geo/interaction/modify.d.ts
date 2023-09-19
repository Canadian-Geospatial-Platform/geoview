import { Modify as OLModify } from 'ol/interaction';
import { ModifyEvent as OLModifyEvent } from 'ol/interaction/Modify';
import Collection from 'ol/Collection';
import Feature from 'ol/Feature';
import { Interaction, InteractionOptions } from './interaction';
import { TypeFeatureStyle } from '../layer/geometry/geometry-types';
/**
 * Supported options for modify interactions
 */
export type ModifyOptions = InteractionOptions & {
    geometryGroupKey?: string;
    features?: Collection<Feature>;
    style?: TypeFeatureStyle;
};
/**
 * Class used for modifying features on a map
 *
 * @exports
 * @class Modify
 */
export declare class Modify extends Interaction {
    ol_modify: OLModify;
    /**
     * Initialize Modify component
     * @param {ModifyOptions} options object to configure the initialization of the Modify interaction
     */
    constructor(options: ModifyOptions);
    /**
     * Starts the interaction on the map
     */
    startInteraction(): void;
    /**
     * Stops the interaction on the map
     */
    stopInteraction(): void;
    /**
     * Handles when the modification has started
     * @param {OLModifyEvent} e object representing the Open Layers event from the interaction
     */
    onModifyStarted: (e: OLModifyEvent) => void;
    /**
     * Handles when the modification has ended
     * @param {OLModifyEvent} e object representing the Open Layers event from the interaction
     */
    onModifyEnded: (e: OLModifyEvent) => void;
}
