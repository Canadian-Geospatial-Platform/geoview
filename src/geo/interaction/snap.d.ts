import type Collection from 'ol/Collection';
import type Feature from 'ol/Feature';
import type { InteractionOptions } from './interaction';
import { Interaction } from './interaction';
import type { GeometryApi } from '@/geo/layer/geometry/geometry';
/**
 * Supported options for snapping interactions
 */
export type SnapOptions = InteractionOptions & {
    geometryGroupKey?: string;
    features?: Collection<Feature>;
};
/**
 * Class used for snapping features on a map.
 */
export declare class Snap extends Interaction {
    #private;
    /**
     * Initializes a Snap component.
     *
     * @param options - Object to configure the initialization of the Snap interaction
     * @param geometryApi - The geometry API used to retrieve geometry groups if a geometry group key is provided in the options
     */
    constructor(options: SnapOptions, geometryApi: GeometryApi);
    /**
     * Starts the interaction on the map.
     */
    startInteraction(): void;
    /**
     * Stops the interaction on the map.
     */
    stopInteraction(): void;
}
//# sourceMappingURL=snap.d.ts.map