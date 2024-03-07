import { Select as OLSelect } from 'ol/interaction';
import { SelectEvent as OLSelectEvent, Options as OLSelectOptions } from 'ol/interaction/Select';
import Collection from 'ol/Collection';
import Feature from 'ol/Feature';

import { TypeFeatureStyle } from '@/geo/layer/geometry/geometry-types';
import { GeoUtilities } from '@/geo/utils/utilities';

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
 * Define a delegate for the event handler function signature
 */
type SelectChangedDelegate = (sender: Select, event: OLSelectEvent) => void;

/**
 * Class used for selecting features on a map
 *
 * @exports
 * @class Select
 */
export class Select extends Interaction {
  // The embedded Open Layers Select component
  ol_select: OLSelect;

  // Keep all callback delegates references
  private onSelectChangedHandlers: SelectChangedDelegate[] = [];

  /**
   * Initialize Select component
   * @param {SelectOptions} options object to configure the initialization of the Select interaction
   */
  constructor(options: SelectOptions) {
    super(options);

    // The OpenLayers Select options
    // TODO: Enhancements - Add support for more selection options
    const olOptions: OLSelectOptions = {
      features: options.features,
      style: new GeoUtilities().convertTypeFeatureStyleToOpenLayersStyle(options.style),
      hitTolerance: options.hitTolerance || 0,
    };

    // Activate the OpenLayers Select module
    this.ol_select = new OLSelect(olOptions);

    // Wire handler when drawing is changed and immediately re-emit
    this.ol_select.on('select', this.emitSelectChanged);
  }

  /**
   * Starts the interaction on the map
   */
  public startInteraction() {
    // Redirect
    super.startInteraction(this.ol_select);
  }

  /**
   * Stops the interaction on the map
   */
  public stopInteraction() {
    // Redirect
    super.stopInteraction(this.ol_select);
  }

  /**
   * Wires an event handler.
   * @param {SelectChangedDelegate} callback The callback to be executed whenever the event is raised
   */
  onSelectChanged = (callback: SelectChangedDelegate): void => {
    // Push a new callback handler to the list of handlers
    this.onSelectChangedHandlers.push(callback);
  };

  /**
   * Unwires an event handler.
   * @param {SelectChangedDelegate} callback The callback to stop being called whenever the event is raised
   */
  offSelectChanged = (callback: SelectChangedDelegate): void => {
    const index = this.onSelectChangedHandlers.indexOf(callback);
    if (index !== -1) {
      this.onSelectChangedHandlers.splice(index, 1);
    }
  };

  /**
   * Emits an event to all handlers.
   * @param {OLSelectEvent} selectEvent object representing the Open Layers event from the interaction
   */
  emitSelectChanged = (selectEvent: OLSelectEvent) => {
    // Trigger all the handlers in the array
    this.onSelectChangedHandlers.forEach((handler) => handler(this, selectEvent));
  };
}
