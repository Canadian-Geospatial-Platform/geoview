import BaseEvent from 'ol/events/Event';
import type Feature from 'ol/Feature';
import type { Geometry } from 'ol/geom';
/**
 * Event for transform operations
 */
export declare class TransformEvent extends BaseEvent {
    feature: Feature;
    type: string;
    constructor(type: string, feature: Feature);
}
/**
 * Event for delete feature operations
 */
export declare class TransformDeleteFeatureEvent extends BaseEvent {
    feature: Feature;
    constructor(feature: Feature);
}
/**
 * Selection event class for transform interactions
 */
export declare class TransformSelectionEvent extends BaseEvent {
    /** The event type */
    type: string;
    /** The previously selected feature */
    previousFeature?: Feature<Geometry>;
    /** The newly selected feature */
    newFeature?: Feature<Geometry>;
    /** Create selection action */
    createSelectAction: boolean;
    /**
     * Creates a new SelectionEvent
     * @param type - The event type
     * @param previousFeature - The previously selected feature
     * @param newFeature - The newly selected feature
     * @param createSelectAction - Create selection action
     */
    constructor(type: string, previousFeature?: Feature<Geometry>, newFeature?: Feature<Geometry>, createSelectAction?: boolean);
}
//# sourceMappingURL=transform-events.d.ts.map