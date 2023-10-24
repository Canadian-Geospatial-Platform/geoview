import { Type as OLGeomType } from 'ol/geom/Geometry';
import { Draw as OLDraw } from 'ol/interaction';
import { DrawEvent as OLDrawEvent, Options as OLDrawOptions } from 'ol/interaction/Draw';
import { FlatStyle } from 'ol/style/flat';

import { Interaction, InteractionOptions } from './interaction';
import { api } from '@/app';
import { EVENT_NAMES } from '@/api/events/event-types';
import { drawPayload } from '@/api/events/payloads';
import { TypeFeatureStyle } from '@/geo/layer/geometry/geometry-types';
import { GeoUtilities } from '@/geo//utils/utilities';

/**
 * Supported options for drawing interactions
 */
export type DrawOptions = InteractionOptions & {
  geometryGroupKey: string;
  freehand?: boolean;
  type?: string; // TODO: Refactoring - Utiliser un type dans geometry-types comme TypeVectorKeys, en changeant ceux-ci pour s'assoir sur les types OL: https://openlayers.org/en/latest/apidoc/module-ol_geom_Geometry.html#~Type
  style?: TypeFeatureStyle;
};

/**
 * Class used for drawing features on a map
 *
 * @exports
 * @class Draw
 */
export class Draw extends Interaction {
  // The embedded Open Layers Draw component
  ol_draw: OLDraw;

  /**
   * Initialize Draw component
   * @param {DrawOptions} options object to configure the initialization of the Draw interaction
   */
  constructor(options: DrawOptions) {
    super(options);

    // Get the vector source for the geometry group or create one when not existing
    const geomGroup = this.mapViewer.layer.geometry?.createGeometryGroup(options.geometryGroupKey);

    // The OpenLayers Draw options
    // TODO: Enhancements - Add support for more drawing options
    const olOptions: OLDrawOptions = {
      source: geomGroup?.vectorSource,
      type: (options.type as OLGeomType) || 'Polygon',
      style: new GeoUtilities().convertTypeFeatureStyleToOpenLayersStyle(options.style) as FlatStyle,
      freehand: options.freehand,
    };

    // Create the Open Layers Draw component
    this.ol_draw = new OLDraw(olOptions);

    // Wire handler when drawing starts
    this.ol_draw.on('drawstart', this.onDrawStart);
    this.ol_draw.on('drawend', this.onDrawEnd);
    this.ol_draw.on('drawabort', this.onDrawAbort);
  }

  /**
   * Starts the interaction on the map
   */
  public startInteraction() {
    // Redirect
    super.startInteraction(this.ol_draw);
  }

  /**
   * Stops the interaction on the map
   */
  public stopInteraction() {
    // Redirect
    super.stopInteraction(this.ol_draw);
  }

  /**
   * Handle when the drawing has started
   * @param {OLDrawEvent} e object representing the Open Layers event from the interaction
   */
  onDrawStart = (e: OLDrawEvent) => {
    // Raises EVENT_DRAW_STARTED event via the api
    api.event.emit(drawPayload(EVENT_NAMES.INTERACTION.EVENT_DRAW_STARTED, this.mapViewer.mapId, e));
  };

  /**
   * Handles when the drawing has ended
   * @param {OLDrawEvent} e object representing the Open Layers event from the interaction
   */
  onDrawEnd = (e: OLDrawEvent) => {
    // Raises EVENT_DRAW_ENDED event via the api
    api.event.emit(drawPayload(EVENT_NAMES.INTERACTION.EVENT_DRAW_ENDED, this.mapViewer.mapId, e));
  };

  /**
   * Handles when the drawing has aborted
   * @param {OLDrawEvent} e object representing the Open Layers event from the interaction
   */
  onDrawAbort = (e: OLDrawEvent) => {
    // Raises EVENT_DRAW_ABORTED event via the api
    api.event.emit(drawPayload(EVENT_NAMES.INTERACTION.EVENT_DRAW_ABORTED, this.mapViewer.mapId, e));
  };
}
