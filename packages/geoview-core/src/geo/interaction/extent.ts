import { Extent as OLExtent } from 'ol/interaction';
import type { ExtentEvent as OLExtentEvent, Options as OLExtentOptions } from 'ol/interaction/Extent';
import { shiftKeyOnly } from 'ol/events/condition';

import type { EventDelegateBase } from '@/api/events/event-helper';
import EventHelper from '@/api/events/event-helper';
import type { TypeFeatureStyle } from '@/geo/layer/geometry/geometry-types';
import { GeoUtilities } from '@/geo/utils/utilities';

import type { InteractionOptions } from './interaction';
import { Interaction } from './interaction';

/**
 * Supported options for extent interactions
 */
export type ExtentOptions = InteractionOptions & {
  boxStyle?: TypeFeatureStyle;
  pixelTolerance?: number;
};

/**
 * Class used for drawing an extent on a map.
 * @class Extent
 * @extends {Interaction}
 * @exports
 */
export class Extent extends Interaction {
  /** The embedded OpenLayers Extent component */
  // eslint-disable-next-line camelcase
  #ol_extent: OLExtent;

  /** Callback handlers for the extentchanged event. */
  #onExtentChangedHandlers: ExtentDelegate[] = [];

  /**
   * Initializes an Extent component.
   * @param {ExtentOptions} options - An object to configure the initialization of the Extent interaction.
   */
  constructor(options: ExtentOptions) {
    super(options);

    // Configure OpenLayers Extent options
    const olOptions: OLExtentOptions = {
      condition: shiftKeyOnly,
      boxStyle: GeoUtilities.convertTypeFeatureStyleToOpenLayersStyle(options.boxStyle),
      pixelTolerance: options.pixelTolerance || 0,
    };

    // Instantiate the OpenLayers Extent interaction
    this.#ol_extent = new OLExtent(olOptions);

    // Register event handler for extent change
    this.#ol_extent.on('extentchanged', this.#emitExtentChanged.bind(this));
  }

  /**
   * Starts the interaction on the map.
   * @override
   */
  override startInteraction(): void {
    // Redirect to super method to start interaction
    super.startInteraction(this.#ol_extent);
  }

  /**
   * Stops the interaction on the map.
   * @override
   */
  override stopInteraction(): void {
    // Redirect to super method to stop interaction
    super.stopInteraction(this.#ol_extent);
  }

  /**
   * Emits an event to all registered extent change event handlers.
   * @param {OLExtentEvent} event - The event to emit.
   * @private
   */
  #emitExtentChanged(event: OLExtentEvent): void {
    // Emit the extentchanged event
    EventHelper.emitEvent(this, this.#onExtentChangedHandlers, event);
  }

  /**
   * Registers an event handler for extent change events.
   * @param {ExtentDelegate} callback - The callback to be executed whenever the event is emitted.
   */
  onExtentChanged(callback: ExtentDelegate): void {
    // Register the extentchanged event callback
    EventHelper.onEvent(this.#onExtentChangedHandlers, callback);
  }

  /**
   * Unregisters an event handler for extent change events.
   * @param {ExtentDelegate} callback - The callback to stop being called whenever the event is emitted.
   */
  offExtentChanged(callback: ExtentDelegate): void {
    // Unregister the extentchanged event callback
    EventHelper.offEvent(this.#onExtentChangedHandlers, callback);
  }
}

/**
 * Define a delegate for the event handler function signature
 */
type ExtentDelegate = EventDelegateBase<Extent, OLExtentEvent, void>;
