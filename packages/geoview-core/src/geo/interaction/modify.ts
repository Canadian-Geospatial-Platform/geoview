import { Modify as OLModify } from 'ol/interaction';
import { ModifyEvent as OLModifyEvent, Options as OLModifyOptions } from 'ol/interaction/Modify';
import Collection from 'ol/Collection';
import Feature from 'ol/Feature';
import { Interaction, InteractionOptions } from './interaction';
import { api } from '../../app';
import { EVENT_NAMES } from '@/api/events/event-types';
import { modifyPayload } from '@/api/events/payloads/inter-modify-payload';
import { TypeFeatureStyle } from '../layer/vector/vector-types';
import { GeoUtilities } from '../utils/utilities';

/**
 * Supported options for modify interactions
 */
export type ModifyOptions = InteractionOptions & {
  geometryGroupKey?: string;
  features?: Collection<Feature>;
  style?: TypeFeatureStyle;
};

/**
 * Class used for modifying features on a map
 *
 * @exports
 * @class Modify
 */
export class Modify extends Interaction {
  // The embedded Open Layers Modify component
  ol_modify: OLModify;

  /**
   * Initialize Modify component
   * @param {ModifyOptions} options object to configure the initialization of the Modify interaction
   */
  constructor(options: ModifyOptions) {
    super(options);

    // The OpenLayers Modify options
    // TODO: Enhancements - Add support for more modifying options
    const olOptions: OLModifyOptions = {
      style: new GeoUtilities().convertTypeFeatureStyleToOpenLayersStyle(options.style),
    };

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
    this.ol_modify = new OLModify(olOptions);

    // Wire handler when modification is started
    this.ol_modify.on('modifystart', this.onModifyStarted);
    // Wire handler when modification is ended
    this.ol_modify.on('modifyend', this.onModifyEnded);
  }

  /**
   * Starts the interaction on the map
   */
  public startInteraction() {
    // Redirect
    super.startInteraction(this.ol_modify);
  }

  /**
   * Stops the interaction on the map
   */
  public stopInteraction() {
    // Redirect
    super.stopInteraction(this.ol_modify);
  }

  /**
   * Handles when the modification has started
   * @param {OLModifyEvent} e object representing the Open Layers event from the interaction
   */
  onModifyStarted = (e: OLModifyEvent) => {
    api.event.emit(modifyPayload(EVENT_NAMES.INTERACTION.EVENT_MODIFY_STARTED, this.mapViewer.mapId, e));
  };

  /**
   * Handles when the modification has ended
   * @param {OLModifyEvent} e object representing the Open Layers event from the interaction
   */
  onModifyEnded = (e: OLModifyEvent) => {
    api.event.emit(modifyPayload(EVENT_NAMES.INTERACTION.EVENT_MODIFY_ENDED, this.mapViewer.mapId, e));
  };
}
