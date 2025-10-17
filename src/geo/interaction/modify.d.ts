import type { ModifyEvent as OLModifyEvent } from 'ol/interaction/Modify';
import Collection from 'ol/Collection';
import type Feature from 'ol/Feature';
import type { Condition } from 'ol/events/condition';
import type { EventDelegateBase } from '@/api/events/event-helper';
import type { TypeFeatureStyle } from '@/geo/layer/geometry/geometry-types';
import type { InteractionOptions } from './interaction';
import { Interaction } from './interaction';
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
 * @class Modify
 * @extends {Interaction}
 * @exports
 */
export declare class Modify extends Interaction {
    #private;
    /**
     * Initializes a Modify component.
     * @param {ModifyOptions} options - Object to configure the initialization of the Modify interaction.
     */
    constructor(options: ModifyOptions);
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
    /**
     * Registers a callback handler for the modifystart event.
     * @param {ModifyDelegate} callback - The callback to be executed whenever the event is emitted.
     */
    onModifyStarted(callback: ModifyDelegate): void;
    /**
     * Unregisters a callback handler for the modifystart event.
     * @param {ModifyDelegate} callback - The callback to stop being called whenever the event is emitted.
     */
    offModifyStarted(callback: ModifyDelegate): void;
    /**
     * Registers a callback handler for the modifyend event.
     * @param {ModifyDelegate} callback - The callback to be executed whenever the event is emitted.
     */
    onModifyEnded(callback: ModifyDelegate): void;
    /**
     * Unregisters a callback handler for the modifyend event.
     * @param {ModifyDelegate} callback - The callback to stop being called whenever the event is emitted.
     */
    offModifyEnded(callback: ModifyDelegate): void;
    /**
     * Registers a callback handler for the modifydrag event.
     * @param {ModifyDelegate} callback - The callback to be executed whenever the event is emitted.
     */
    onModifyDragged(callback: ModifyDelegate): void;
    /**
     * Unregisters a callback handler for the modifydrag event.
     * @param {ModifyDelegate} callback - The callback to stop being called whenever the event is emitted.
     */
    offModifyDragged(callback: ModifyDelegate): void;
}
/**
 * Define a delegate for the event handler function signature
 */
type ModifyDelegate = EventDelegateBase<Modify, OLModifyEvent, void>;
export {};
//# sourceMappingURL=modify.d.ts.map