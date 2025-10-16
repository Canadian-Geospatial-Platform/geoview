import type { Interaction as OLInteraction } from 'ol/interaction';
// import OLBaseEvent from 'ol/events/Event'; // TODO: Enhancements - Interaction - Uncomment to leverage the events further

import type { MapViewer } from '@/geo/map/map-viewer';

/**
 * Options for interactions
 */
export type InteractionOptions = {
  mapViewer: MapViewer;
};

/**
 * Astract Class used for GeoView Interactions
 *
 * @class Interaction
 * @abstract
 * @exports
 */
export abstract class Interaction {
  /** Reference the MapViewer associated with this interaction */
  public mapViewer: MapViewer;

  /**
   * Constructs an abstract Interaction component
   * @param {InteractionOptions} options - Object to configure the initialization of the Interaction mother class
   */
  constructor(options: InteractionOptions) {
    // Keep reference
    this.mapViewer = options.mapViewer;
  }

  /**
   * Starts the drawing interaction on the map
   * @param {OLInteraction} olInteraction - The OpenLayers Interaction object the map should start interacting on
   */
  protected startInteraction(olInteraction: OLInteraction): void {
    // Add modifier interaction on the map
    this.mapViewer.map.addInteraction(olInteraction);
  }

  /**
   * Stops the drawing interaction on the map
   * @param {OLInteraction} olInteraction - The OpenLayers Interaction object the map should stop interacting on
   */
  protected stopInteraction(olInteraction: OLInteraction): void {
    // Stop modifier interaction on the map
    this.mapViewer.map.removeInteraction(olInteraction);
  }
}
