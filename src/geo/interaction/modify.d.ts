import type { ModifyEvent as olModifyEvent } from 'ol/interaction/Modify';
import Collection from 'ol/Collection';
import type Feature from 'ol/Feature';
import type { Condition } from 'ol/events/condition';
import type { EventDelegateBase } from '@/api/events/event-helper';
import type { TypeFeatureStyle } from '@/geo/layer/geometry/geometry-types';
import type { InteractionOptions } from './interaction';
import { Interaction } from './interaction';
import type { GeometryApi } from '@/geo/layer/geometry/geometry';
/**
 * Supported options for modify interactions
 */
export type ModifyOptions = InteractionOptions & {
    geometryGroupKey?: string;
    features?: Collection<Feature>;
    style?: TypeFeatureStyle;
    insertVertexCondition?: Condition;
    pixelTolerance?: number;
};
/**
 * Class used for modifying features on a map.
 */
export declare class Modify extends Interaction {
    #private;
    /**
     * Initializes a Modify component.
     *
     * @param options - Object to configure the initialization of the Modify interaction
     * @param geometryApi - The geometry API used to retrieve geometry groups if a geometry group key is provided in the options
     */
    constructor(options: ModifyOptions, geometryApi: GeometryApi);
    /**
     * Starts the interaction on the map.
     */
    startInteraction(): void;
    /**
     * Stops the interaction on the map.
     */
    stopInteraction(): void;
    /**
     * Registers a callback handler for the modifystart event.
     *
     * @param callback - The callback to be executed whenever the event is emitted
     */
    onModifyStarted(callback: ModifyDelegate): void;
    /**
     * Unregisters a callback handler for the modifystart event.
     *
     * @param callback - The callback to stop being called whenever the event is emitted
     */
    offModifyStarted(callback: ModifyDelegate): void;
    /**
     * Registers a callback handler for the modifyend event.
     *
     * @param callback - The callback to be executed whenever the event is emitted
     */
    onModifyEnded(callback: ModifyDelegate): void;
    /**
     * Unregisters a callback handler for the modifyend event.
     *
     * @param callback - The callback to stop being called whenever the event is emitted
     */
    offModifyEnded(callback: ModifyDelegate): void;
    /**
     * Registers a callback handler for the modifydrag event.
     *
     * @param callback - The callback to be executed whenever the event is emitted
     */
    onModifyDragged(callback: ModifyDelegate): void;
    /**
     * Unregisters a callback handler for the modifydrag event.
     *
     * @param callback - The callback to stop being called whenever the event is emitted
     */
    offModifyDragged(callback: ModifyDelegate): void;
}
/**
 * Delegate for the modify event handler function signature.
 */
type ModifyDelegate = EventDelegateBase<Modify, olModifyEvent, void>;
export {};
//# sourceMappingURL=modify.d.ts.map