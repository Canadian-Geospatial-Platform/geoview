import { Select as OLSelect } from 'ol/interaction';
import { SelectEvent as OLSelectEvent, Options as OLSelectOptions } from 'ol/interaction/Select';
import Collection from 'ol/Collection';
import Feature from 'ol/Feature';

import { Interaction, InteractionOptions } from './interaction';
import { api } from '@/app';
import { EVENT_NAMES } from '@/api/events/event-types';
import { selectPayload } from '@/api/events/payloads';
import { TypeFeatureStyle } from '@/geo/layer/geometry/geometry-types';
import { GeoUtilities } from '@/geo/utils/utilities';

/**
 * Supported options for select interactions
 */
export type SelectOptions = InteractionOptions & {
  features?: Collection<Feature>;
  style?: TypeFeatureStyle;
  hitTolerance?: number;
};

/**
 * Class used for selecting features on a map
 *
 * @exports
 * @class Select
 */
export class Select extends Interaction {
  // The embedded Open Layers Select component
  ol_select: OLSelect;

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

    // Wire handler when drawing is changed
    this.ol_select.on('select', this.onSelectChanged);
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
   * Handles when the selection has changed
   * @param {OLSelectEvent} e object representing the Open Layers event from the interaction
   */
  onSelectChanged = (e: OLSelectEvent) => {
    // Raises EVENT_SELECTED event via the api
    api.event.emit(selectPayload(EVENT_NAMES.INTERACTION.EVENT_SELECTED, this.mapViewer.mapId, e));
  };
}
