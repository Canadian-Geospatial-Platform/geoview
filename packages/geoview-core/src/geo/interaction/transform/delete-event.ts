import BaseEvent from 'ol/events/Event';
import Feature from 'ol/Feature';

/**
 * Event for delete feature operations
 */
export class DeleteFeatureEvent extends BaseEvent {
  feature: Feature;

  constructor(feature: Feature) {
    super('deletefeature');
    this.feature = feature;
  }
}
