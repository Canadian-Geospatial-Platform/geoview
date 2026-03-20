import { Select as OLSelect } from 'ol/interaction';
import type { SelectEvent as OLSelectEvent, Options as OLSelectOptions } from 'ol/interaction/Select';
import type Collection from 'ol/Collection';
import type Feature from 'ol/Feature';
import type { Geometry } from 'ol/geom';

import type { EventDelegateBase } from '@/api/events/event-helper';
import EventHelper from '@/api/events/event-helper';
import type { TypeFeatureStyle } from '@/geo/layer/geometry/geometry-types';
import { GeoUtilities } from '@/geo/utils/utilities';

import type { InteractionOptions } from './interaction';
import { Interaction } from './interaction';

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
 */
export class Select extends Interaction {
  /** The embedded OpenLayers Select component */
  #olSelect: OLSelect;

  /** Callback handlers for the selectchanged event. */
  #onSelectChangedHandlers: SelectChangedDelegate[] = [];

  /**
   * Initializes a Select component.
   *
   * @param options - Object to configure the initialization of the Select interaction
   */
  constructor(options: SelectOptions) {
    super(options);

    // The OpenLayers Select options
    // TODO: Enhancements - Add support for more selection options
    const olOptions: OLSelectOptions = {
      features: options.features,
      style: GeoUtilities.convertTypeFeatureStyleToOpenLayersStyle(options.style),
      hitTolerance: options.hitTolerance || 0,
    };

    // Instantiate the OpenLayers Select interaction
    this.#olSelect = new OLSelect(olOptions);

    // Register a handler when select is changed and immediately re-emit
    this.#olSelect.on('select', this.#emitSelectChanged.bind(this));
  }

  /**
   * Starts the interaction on the map.
   */
  override startInteraction(): void {
    // Redirect to super method to start interaction
    super.startInteraction(this.#olSelect);
  }

  /**
   * Stops the interaction on the map.
   */
  override stopInteraction(): void {
    // Redirect to super method to stop interaction
    super.stopInteraction(this.#olSelect);
  }

  /**
   * Gets the selected features.
   *
   * @returns The selected features
   */
  getFeatures(): Collection<Feature<Geometry>> {
    return this.#olSelect.getFeatures();
  }

  /**
   * Emits an event to all registered handlers.
   *
   * @param event - The event to emit
   */
  #emitSelectChanged(event: OLSelectEvent): void {
    // Emit the select changed event
    EventHelper.emitEvent(this, this.#onSelectChangedHandlers, event);
  }

  /**
   * Registers a select changed event handler.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   */
  onSelectChanged(callback: SelectChangedDelegate): void {
    // Register the select changed event callback
    EventHelper.onEvent(this.#onSelectChangedHandlers, callback);
  }

  /**
   * Unregisters a select changed event handler.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offSelectChanged(callback: SelectChangedDelegate): void {
    // Unregister the select changed event callback
    EventHelper.offEvent(this.#onSelectChangedHandlers, callback);
  }
}

/**
 * Delegate for the select changed event handler function signature.
 */
type SelectChangedDelegate = EventDelegateBase<Select, OLSelectEvent, void>;
