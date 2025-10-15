/* eslint-disable max-classes-per-file */
import BaseEvent from 'ol/events/Event';
import type Feature from 'ol/Feature';
import type { Geometry } from 'ol/geom';

/**
 * Event for transform operations
 */
export class TransformEvent extends BaseEvent {
  feature: Feature;

  override type: string;

  constructor(type: string, feature: Feature) {
    super(type);
    this.feature = feature;
    this.type = type;
  }
}

/**
 * Event for delete feature operations
 */
export class TransformDeleteFeatureEvent extends BaseEvent {
  feature: Feature;

  constructor(feature: Feature) {
    super('deletefeature');
    this.feature = feature;
  }
}

/**
 * Selection event class for transform interactions
 */
export class TransformSelectionEvent extends BaseEvent {
  /** The event type */
  override type: string;

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
  constructor(type: string, previousFeature?: Feature<Geometry>, newFeature?: Feature<Geometry>, createSelectAction: boolean = false) {
    super(type);
    this.type = type;
    this.previousFeature = previousFeature;
    this.newFeature = newFeature;
    this.createSelectAction = createSelectAction;
  }
}
