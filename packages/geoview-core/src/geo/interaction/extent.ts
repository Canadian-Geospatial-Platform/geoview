import { Extent as OLExtent } from 'ol/interaction';
import { ExtentEvent as OLExtentEvent, Options as OLExtentOptions } from 'ol/interaction/Extent';
import { shiftKeyOnly } from 'ol/events/condition';

import { TypeFeatureStyle } from '@/geo/layer/geometry/geometry-types';
import { GeoUtilities } from '@/geo/utils/utilities';

import { Interaction, InteractionOptions } from './interaction';

/**
 * Supported options for extent interactions
 */
export type ExtentOptions = InteractionOptions & {
  boxStyle?: TypeFeatureStyle;
  pixelTolerance?: number;
};

/**
 * Define a delegate for the event handler function signature
 */
type ExtentDelegate = (sender: Extent, event: OLExtentEvent) => void;

/**
 * Class used for drawing extent on a map
 *
 * @exports
 * @class Extent
 */
export class Extent extends Interaction {
  // The embedded Open Layers Extent component
  ol_extent: OLExtent;

  // Keep all callback delegates references
  private onExtentChangedHandlers: ExtentDelegate[] = [];

  /**
   * Initialize Extent component
   * @param {ExtentOptions} options object to configure the initialization of the Extent interaction
   */
  constructor(options: ExtentOptions) {
    super(options);

    // The OpenLayers Extent options
    const olOptions: OLExtentOptions = {
      condition: shiftKeyOnly,
      boxStyle: new GeoUtilities().convertTypeFeatureStyleToOpenLayersStyle(options.boxStyle),
      pixelTolerance: options.pixelTolerance || 0,
    };

    // Activate the OpenLayers Extent module
    this.ol_extent = new OLExtent(olOptions);

    // Wire handler when drawing of extent is changed
    this.ol_extent.on('extentchanged', this.emitExtentChanged);
  }

  /**
   * Starts the interaction on the map
   */
  public startInteraction() {
    // Redirect
    super.startInteraction(this.ol_extent);
  }

  /**
   * Stops the interaction on the map
   */
  public stopInteraction() {
    // Redirect
    super.stopInteraction(this.ol_extent);
  }

  /**
   * Wires an event handler.
   * @param {ExtentDelegate} callback The callback to be executed whenever the event is raised
   */
  onExtentChanged = (callback: ExtentDelegate): void => {
    // Push a new callback handler to the list of handlers
    this.onExtentChangedHandlers.push(callback);
  };

  /**
   * Unwires an event handler.
   * @param {ExtentDelegate} callback The callback to stop being called whenever the event is raised
   */
  offExtentChanged = (callback: ExtentDelegate): void => {
    const index = this.onExtentChangedHandlers.indexOf(callback);
    if (index !== -1) {
      this.onExtentChangedHandlers.splice(index, 1);
    }
  };

  /**
   * Emits an event to all handlers.
   * @param {OLExtentEvent} extentEvent object representing the Open Layers event from the interaction
   */
  emitExtentChanged = (extentEvent: OLExtentEvent) => {
    // Trigger all the handlers in the array
    this.onExtentChangedHandlers.forEach((handler) => handler(this, extentEvent));
  };
}
