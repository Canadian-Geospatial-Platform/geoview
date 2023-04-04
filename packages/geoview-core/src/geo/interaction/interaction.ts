import { Interaction as OLInteraction } from 'ol/interaction';
import { MapViewer } from '../map/map';
// import OLBaseEvent from 'ol/events/Event'; Uncomment this line to start handling core interaction events

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
   * Initializes the abstract interaction component
   * @param {InteractionOptions} options the essential options for all GeoView interaction components
   */
  constructor(public options: InteractionOptions) {
    // Keep reference
    this.mapViewer = options.mapViewer;
  }

  /**
   * Starts the specified interaction on the map
   * @param {OLInteraction} olInteraction the Open Layer interaction module to effectively add interaction on the map with.
   */
  protected startInteraction(olInteraction: OLInteraction) {
    // Add modifier interaction on the map
    this.mapViewer.map.addInteraction(olInteraction);
  }

  /**
   * Stops the specified interaction on the map
   * @param {OLInteraction} olInteraction the Open Layer interaction module to effectively remove interaction on the map with.
   */
  protected stopInteraction(olInteraction: OLInteraction) {
    // Stop modifier interaction on the map
    this.mapViewer.map.removeInteraction(olInteraction);
  }
}
