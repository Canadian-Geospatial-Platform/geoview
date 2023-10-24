import { Extent as OLExtent } from 'ol/interaction';
import { ExtentEvent as OLExtentEvent, Options as OLExtentOptions } from 'ol/interaction/Extent';
import MapBrowserEvent from 'ol/MapBrowserEvent';
import { shiftKeyOnly } from 'ol/events/condition';

import { Interaction, InteractionOptions } from './interaction';
import { api } from '@/app';
import { EVENT_NAMES } from '@/api/events/event-types';
import { extentPayload } from '@/api/events/payloads';
import { TypeFeatureStyle } from '@/geo/layer/geometry/geometry-types';
import { GeoUtilities } from '@/geo/utils/utilities';

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
  ol_extent: OLExtent;

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

    // Wire handler when drawing is changed
    this.ol_extent.on('extentchanged', this.onExtentChanged);
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
   * Handles when the extent has changed
   * @param {OLExtentEvent} e object representing the Open Layers event from the interaction
   */
  onExtentChanged = (e: OLExtentEvent) => {
    // Raises EVENT_EXTENT event via the api
    api.event.emit(extentPayload(EVENT_NAMES.INTERACTION.EVENT_EXTENT, this.mapViewer.mapId, e));
  };
}
