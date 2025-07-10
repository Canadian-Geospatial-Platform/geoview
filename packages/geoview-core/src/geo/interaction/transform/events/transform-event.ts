import BaseEvent from 'ol/events/Event';
import Feature from 'ol/Feature';

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
