import { Snap as OLSnap } from 'ol/interaction';
import { Options as OLSnapOptions } from 'ol/interaction/Snap';
import Collection from 'ol/Collection';
import Feature from 'ol/Feature';

import { Interaction, InteractionOptions } from './interaction';

/**
 * Supported options for snapping interactions
 */
export type SnapOptions = InteractionOptions & {
  geometryGroupKey?: string;
  features?: Collection<Feature>;
};

/**
 * Class used for snapping features on a map.
 * @class Snap
 * @extends {Interaction}
 * @exports
 */
export class Snap extends Interaction {
  /** The embedded OpenLayers Snap component */
  #ol_snap: OLSnap;

  /**
   * Initializes a Snap component.
   * @param {SnapOptions} options - Object to configure the initialization of the Snap interaction.
   */
  constructor(options: SnapOptions) {
    super(options);

    // The OpenLayers Snap options
    // TODO: Enhancements - Add support for more snapping options
    const olOptions: OLSnapOptions = {};

    // If a list of features is specified, set the features to snap to
    if (options.features) {
      olOptions.features = options.features;
    } else if (options.geometryGroupKey) {
      // If a geometry group key is set, get the vector source for the geometry group
      const geomGroup = this.mapViewer.layer.geometry?.createGeometryGroup(options.geometryGroupKey);
      olOptions.source = geomGroup?.vectorSource;
    }

    // Instantiate the OpenLayers Snap interaction
    this.#ol_snap = new OLSnap(olOptions);
  }

  /**
   * Starts the interaction on the map.
   */
  override startInteraction(): void {
    // Redirect to super method to start interaction
    super.startInteraction(this.#ol_snap);
  }

  /**
   * Stops the interaction on the map.
   */
  override stopInteraction(): void {
    // Redirect to super method to stop interaction
    super.stopInteraction(this.#ol_snap);
  }
}
