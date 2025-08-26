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
 * Class used for snapping features on a map.
 * @class Snap
 * @extends {Interaction}
 * @exports
 */
export declare class Snap extends Interaction {
    #private;
    /**
     * Initializes a Snap component.
     * @param {SnapOptions} options - Object to configure the initialization of the Snap interaction.
     */
    constructor(options: SnapOptions);
    /**
     * Starts the interaction on the map.
     * @override
     */
    startInteraction(): void;
    /**
     * Stops the interaction on the map.
     * @override
     */
    stopInteraction(): void;
}
//# sourceMappingURL=snap.d.ts.map