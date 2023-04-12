import { Interaction as OLInteraction } from 'ol/interaction';
// import OLBaseEvent from 'ol/events/Event'; // TODO: Enhancements - Interaction - Uncomment to leverage the events further
import { MapViewer } from '../map/map';

/**
 * Options for interactions
 */
export type InteractionOptions = {
  mapViewer: MapViewer;
};

/**
 * Astract Class used for GeoView Interactions
 *
 * @exports
 * @class Interaction
 */
export abstract class Interaction {
  // Reference the MapViewer associated with this interaction
  public mapViewer: MapViewer;

  /**
   * initialize modify component
   */
  constructor(public options: InteractionOptions) {
    // Keep reference
    this.mapViewer = options.mapViewer;
  }

  /**
   * Starts the drawing interaction on the map
   */
  protected startInteraction(olInteraction: OLInteraction) {
    // Add modifier interaction on the map
    this.mapViewer.map.addInteraction(olInteraction);
  }

  /**
   * Stops the drawing interaction on the map
   */
  protected stopInteraction(olInteraction: OLInteraction) {
    // Stop modifier interaction on the map
    this.mapViewer.map.removeInteraction(olInteraction);
  }
}
