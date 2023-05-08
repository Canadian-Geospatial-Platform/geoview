import { Snap as OLSnap } from 'ol/interaction';
import Collection from 'ol/Collection';
import Feature from 'ol/Feature';
import { Interaction, InteractionOptions } from './interaction';
/**
 * Supported options for snapping interactions
 */
export type SnapOptions = InteractionOptions & {
    geometryGroupKey?: string;
    features?: Collection<Feature>;
};
/**
 * Class used for snapping features on a map
 *
 * @exports
 * @class Snap
 */
export declare class Snap extends Interaction {
    ol_snap: OLSnap;
    /**
     * initialize modify component
     * @param {SnapOptions} options object to configure the initialization of the Snap interaction
     */
    constructor(options: SnapOptions);
    /**
     * Starts the interaction on the map
     */
    startInteraction(): void;
    /**
     * Stops the interaction on the map
     */
    stopInteraction(): void;
}
