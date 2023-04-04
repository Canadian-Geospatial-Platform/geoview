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
 * Class used for snapping features on a map
 *
 * @exports
 * @class Snap
 */
export class Snap extends Interaction {
  // The embedded Open Layers Snap component
  ol_snap: OLSnap;

  /**
   * initialize modify component
   * @param {SnapOptions} options the essential options for the snapping interaction
   */
  constructor(options: SnapOptions) {
    super(options);

    // The OpenLayers Snap options
    // TODO: Enhancements - Add support for more snapping options
    const olOptions: OLSnapOptions = {};

    // If a list of features is specified
    if (options.features) {
      // Set the features to snap to
      olOptions.features = options.features;
    } else if (options.geometryGroupKey) {
      // If a geometry group key is set
      // Get the vector source for the geometry group or create one when not existing
      const geomGroup = this.mapViewer.layer.vector?.createGeometryGroup(options.geometryGroupKey);
      olOptions.source = geomGroup?.vectorSource;
    }

    // Activate the OpenLayers Modify module
    this.ol_snap = new OLSnap(olOptions);
  }

  /**
   * Starts the interaction on the map
   */
  public startInteraction() {
    // Redirect
    super.startInteraction(this.ol_snap);
  }

  /**
   * Stops the interaction on the map
   */
  public stopInteraction() {
    // Redirect
    super.stopInteraction(this.ol_snap);
  }
}
