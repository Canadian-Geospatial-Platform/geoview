import { Extent as OLExtent } from 'ol/interaction';
import { ExtentEvent as OLExtentEvent, Options as OLExtentOptions } from 'ol/interaction/Extent';
import { shiftKeyOnly } from 'ol/events/condition';

import EventHelper, { EventDelegateBase } from '@/api/events/event-helper';
import { TypeFeatureStyle } from '@/geo/layer/geometry/geometry-types';
import { convertTypeFeatureStyleToOpenLayersStyle } from '@/geo/utils/utilities';

import { Interaction, InteractionOptions } from './interaction';

/**
 * Supported options for extent interactions
 */
export type ExtentOptions = InteractionOptions & {
  boxStyle?: TypeFeatureStyle;
  pixelTolerance?: number;
};

/**
 * Class used for drawing extent on a map
 *
 * @exports
 * @class Extent
 */
export class Extent extends Interaction {
  // The embedded Open Layers Extent component
  #ol_extent: OLExtent;

  // Keep all callback delegates references
  #onExtentChangedHandlers: ExtentDelegate[] = [];

  /**
   * Initialize Extent component
   * @param {ExtentOptions} options object to configure the initialization of the Extent interaction
   */
  constructor(options: ExtentOptions) {
    super(options);

    // The OpenLayers Extent options
    const olOptions: OLExtentOptions = {
      condition: shiftKeyOnly,
      boxStyle: convertTypeFeatureStyleToOpenLayersStyle(options.boxStyle),
      pixelTolerance: options.pixelTolerance || 0,
    };

    // Activate the OpenLayers Extent module
    this.#ol_extent = new OLExtent(olOptions);

    // Wire handler when drawing of extent is changed
    this.#ol_extent.on('extentchanged', this.emitExtentChanged);
  }

  /**
   * Starts the interaction on the map
   */
  public startInteraction() {
    // Redirect
    super.startInteraction(this.#ol_extent);
  }

  /**
   * Stops the interaction on the map
   */
  public stopInteraction() {
    // Redirect
    super.stopInteraction(this.#ol_extent);
  }

  /**
   * Emits an event to all handlers.
   * @param {OLExtentEvent} event The event to emit
   */
  emitExtentChanged = (event: OLExtentEvent) => {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onExtentChangedHandlers, event);
  };

  /**
   * Wires an event handler.
   * @param {ExtentDelegate} callback The callback to be executed whenever the event is emitted
   */
  onExtentChanged = (callback: ExtentDelegate): void => {
    // Wire the event handler
    EventHelper.onEvent(this.#onExtentChangedHandlers, callback);
  };

  /**
   * Unwires an event handler.
   * @param {ExtentDelegate} callback The callback to stop being called whenever the event is emitted
   */
  offExtentChanged = (callback: ExtentDelegate): void => {
    // Unwire the event handler
    EventHelper.offEvent(this.#onExtentChangedHandlers, callback);
  };
}

/**
 * Define a delegate for the event handler function signature
 */
type ExtentDelegate = EventDelegateBase<Extent, OLExtentEvent>;
