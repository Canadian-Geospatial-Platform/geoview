import { Select as OLSelect } from 'ol/interaction';
import { SelectEvent as OLSelectEvent, Options as OLSelectOptions } from 'ol/interaction/Select';
import Collection from 'ol/Collection';
import Feature from 'ol/Feature';
import { Geometry } from 'ol/geom';

import EventHelper, { EventDelegateBase } from '@/api/events/event-helper';
import { TypeFeatureStyle } from '@/geo/layer/geometry/geometry-types';
import { convertTypeFeatureStyleToOpenLayersStyle } from '@/geo/utils/utilities';

import { Interaction, InteractionOptions } from './interaction';

/**
 * Supported options for select interactions
 */
export type SelectOptions = InteractionOptions & {
  features?: Collection<Feature>;
  style?: TypeFeatureStyle;
  hitTolerance?: number;
};

/**
 * Class used for selecting features on a map.
 * @class Select
 * @extends {Interaction}
 * @exports
 */
export class Select extends Interaction {
  /** The embedded OpenLayers Select component */
  // eslint-disable-next-line camelcase
  #ol_select: OLSelect;

  /** Callback handlers for the selectchanged event. */
  #onSelectChangedHandlers: SelectChangedDelegate[] = [];

  /**
   * Initializes a Select component.
   * @param {SelectOptions} options - Object to configure the initialization of the Select interaction.
   */
  constructor(options: SelectOptions) {
    super(options);

    // The OpenLayers Select options
    // TODO: Enhancements - Add support for more selection options
    const olOptions: OLSelectOptions = {
      features: options.features,
      style: convertTypeFeatureStyleToOpenLayersStyle(options.style),
      hitTolerance: options.hitTolerance || 0,
    };

    // Instantiate the OpenLayers Select interaction
    this.#ol_select = new OLSelect(olOptions);

    // Register a handler when select is changed and immediately re-emit
    this.#ol_select.on('select', this.#emitSelectChanged.bind(this));
  }

  /**
   * Starts the interaction on the map.
   * @override
   */
  override startInteraction(): void {
    // Redirect to super method to start interaction
    super.startInteraction(this.#ol_select);
  }

  /**
   * Stops the interaction on the map.
   * @override
   */
  override stopInteraction(): void {
    // Redirect to super method to stop interaction
    super.stopInteraction(this.#ol_select);
  }

  /**
   * Gets the selected features.
   * @returns {Collection<Feature<Geometry>>} The selected features.
   */
  public getFeatures(): Collection<Feature<Geometry>> {
    return this.#ol_select.getFeatures();
  }

  /**
   * Emits an event the all registered handlers.
   * @param {OLSelectEvent} event - The event to emit.
   * @private
   */
  #emitSelectChanged(event: OLSelectEvent): void {
    // Emit the select changed event
    EventHelper.emitEvent(this, this.#onSelectChangedHandlers, event);
  }

  /**
   * Registers a select changed event handler.
   * @param {SelectChangedDelegate} callback - The callback to be executed whenever the event is emitted.
   */
  onSelectChanged(callback: SelectChangedDelegate): void {
    // Register the select changed event callback
    EventHelper.onEvent(this.#onSelectChangedHandlers, callback);
  }

  /**
   * Unregisters a select changed event handler.
   * @param {SelectChangedDelegate} callback - The callback to stop being called whenever the event is emitted.
   */
  offSelectChanged(callback: SelectChangedDelegate): void {
    // Unregister the select changed event callback
    EventHelper.offEvent(this.#onSelectChangedHandlers, callback);
  }
}

/**
 * Define a delegate for the event handler function signature
 */
type SelectChangedDelegate = EventDelegateBase<Select, OLSelectEvent, void>;
