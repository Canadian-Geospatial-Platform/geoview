import BaseEvent from 'ol/events/Event';
import Feature from 'ol/Feature';
import { Geometry } from 'ol/geom';

/**
 * Selection event class for transform interactions
 */
export class SelectionEvent extends BaseEvent {
  /** The event type */
  override type: string;

  /** The previously selected feature */
  previousFeature?: Feature<Geometry>;

  /** The newly selected feature */
  newFeature?: Feature<Geometry>;

  /**
   * Creates a new SelectionEvent
   * @param type The event type
   * @param previousFeature The previously selected feature
   * @param newFeature The newly selected feature
   */
  constructor(type: string, previousFeature?: Feature<Geometry>, newFeature?: Feature<Geometry>) {
    super(type);
    this.type = type;
    this.previousFeature = previousFeature;
    this.newFeature = newFeature;
  }
}
