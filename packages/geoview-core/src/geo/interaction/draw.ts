import { Type as OLGeomType } from 'ol/geom/Geometry';
import { Draw as OLDraw } from 'ol/interaction';
import { DrawEvent as OLDrawEvent, Options as OLDrawOptions } from 'ol/interaction/Draw';
import { FlatStyle } from 'ol/style/flat';

import { TypeFeatureStyle } from '@/geo/layer/geometry/geometry-types';
import { GeoUtilities } from '@/geo//utils/utilities';

import { Interaction, InteractionOptions } from './interaction';

/**
 * Supported options for drawing interactions
 */
export type DrawOptions = InteractionOptions & {
  geometryGroupKey: string;
  freehand?: boolean;
  type?: string; // TODO: Refactor - Utiliser un type dans geometry-types comme TypeVectorKeys, en changeant ceux-ci pour s'assoir sur les types OL: https://openlayers.org/en/latest/apidoc/module-ol_geom_Geometry.html#~Type
  style?: TypeFeatureStyle;
};

/**
 * Define a delegate for the event handler function signature
 */
type DrawDelegate = (sender: Draw, event: OLDrawEvent) => void;

/**
 * Class used for drawing features on a map
 *
 * @exports
 * @class Draw
 */
export class Draw extends Interaction {
  // The embedded Open Layers Draw component
  ol_draw: OLDraw;

  // Keep all callback delegates references
  private onDrawStartHandlers: DrawDelegate[] = [];

  // Keep all callback delegates references
  private onDrawEndHandlers: DrawDelegate[] = [];

  // Keep all callback delegates references
  private onDrawAbortHandlers: DrawDelegate[] = [];

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
    this.ol_draw.on('drawstart', this.emitDrawStart);
    this.ol_draw.on('drawend', this.emitDrawEnd);
    this.ol_draw.on('drawabort', this.emitDrawAbort);
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
   * Wires an event handler.
   * @param {DrawDelegate} callback The callback to be executed whenever the event is raised
   */
  onDrawStart = (callback: DrawDelegate): void => {
    // Push a new callback handler to the list of handlers
    this.onDrawStartHandlers.push(callback);
  };

  /**
   * Unwires an event handler.
   * @param {DrawDelegate} callback The callback to stop being called whenever the event is raised
   */
  offDrawStart = (callback: DrawDelegate): void => {
    const index = this.onDrawStartHandlers.indexOf(callback);
    if (index !== -1) {
      this.onDrawStartHandlers.splice(index, 1);
    }
  };

  /**
   * Emits an event to all handlers.
   * @param {OLDrawEvent} drawEvent object representing the Open Layers event from the interaction
   */
  emitDrawStart = (drawEvent: OLDrawEvent) => {
    // Trigger all the handlers in the array
    this.onDrawStartHandlers.forEach((handler) => handler(this, drawEvent));
  };

  /**
   * Wires an event handler.
   * @param {DrawDelegate} callback The callback to be executed whenever the event is raised
   */
  onDrawEnd = (callback: DrawDelegate): void => {
    // Push a new callback handler to the list of handlers
    this.onDrawEndHandlers.push(callback);
  };

  /**
   * Unwires an event handler.
   * @param {DrawDelegate} callback The callback to stop being called whenever the event is raised
   */
  offDrawEnd = (callback: DrawDelegate): void => {
    const index = this.onDrawEndHandlers.indexOf(callback);
    if (index !== -1) {
      this.onDrawEndHandlers.splice(index, 1);
    }
  };

  /**
   * Emits an event to all handlers.
   * @param {OLDrawEvent} drawEvent object representing the Open Layers event from the interaction
   */
  emitDrawEnd = (drawEvent: OLDrawEvent) => {
    // Trigger all the handlers in the array
    this.onDrawEndHandlers.forEach((handler) => handler(this, drawEvent));
  };

  /**
   * Wires an event handler.
   * @param {DrawDelegate} callback The callback to be executed whenever the event is raised
   */
  onDrawAbort = (callback: DrawDelegate): void => {
    // Push a new callback handler to the list of handlers
    this.onDrawAbortHandlers.push(callback);
  };

  /**
   * Unwires an event handler.
   * @param {DrawDelegate} callback The callback to stop being called whenever the event is raised
   */
  offDrawAbort = (callback: DrawDelegate): void => {
    const index = this.onDrawAbortHandlers.indexOf(callback);
    if (index !== -1) {
      this.onDrawAbortHandlers.splice(index, 1);
    }
  };

  /**
   * Emits an event to all handlers.
   * @param {OLDrawEvent} drawEvent object representing the Open Layers event from the interaction
   */
  emitDrawAbort = (drawEvent: OLDrawEvent) => {
    // Trigger all the handlers in the array
    this.onDrawAbortHandlers.forEach((handler) => handler(this, drawEvent));
  };
}
