import { Type as OLGeomType } from 'ol/geom/Geometry';
import { Draw as OLDraw } from 'ol/interaction';
import { DrawEvent as OLDrawEvent, Options as OLDrawOptions } from 'ol/interaction/Draw';
import { FlatStyle } from 'ol/style/flat';

import EventHelper, { EventDelegateBase } from '@/api/events/event-helper';
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
 * Class used for drawing features on a map
 *
 * @exports
 * @class Draw
 */
export class Draw extends Interaction {
  // The embedded Open Layers Draw component
  #ol_draw: OLDraw;

  // Keep all callback delegates references
  #onDrawStartHandlers: DrawDelegate[] = [];

  // Keep all callback delegates references
  #onDrawEndHandlers: DrawDelegate[] = [];

  // Keep all callback delegates references
  #onDrawAbortHandlers: DrawDelegate[] = [];

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
    this.#ol_draw = new OLDraw(olOptions);

    // Wire handler when drawing starts
    this.#ol_draw.on('drawstart', this.emitDrawStart);
    this.#ol_draw.on('drawend', this.emitDrawEnd);
    this.#ol_draw.on('drawabort', this.emitDrawAbort);
  }

  /**
   * Starts the interaction on the map
   */
  public startInteraction() {
    // Redirect
    super.startInteraction(this.#ol_draw);
  }

  /**
   * Stops the interaction on the map
   */
  public stopInteraction() {
    // Redirect
    super.stopInteraction(this.#ol_draw);
  }

  /**
   * Emits an event to all handlers.
   * @param {OLDrawEvent} event The event to emit
   */
  emitDrawStart = (event: OLDrawEvent) => {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onDrawStartHandlers, event);
  };

  /**
   * Wires an event handler.
   * @param {DrawDelegate} callback The callback to be executed whenever the event is emitted
   */
  onDrawStart = (callback: DrawDelegate): void => {
    // Wire the event handler
    EventHelper.onEvent(this.#onDrawStartHandlers, callback);
  };

  /**
   * Unwires an event handler.
   * @param {DrawDelegate} callback The callback to stop being called whenever the event is emitted
   */
  offDrawStart = (callback: DrawDelegate): void => {
    // Unwire the event handler
    EventHelper.offEvent(this.#onDrawStartHandlers, callback);
  };

  /**
   * Emits an event to all handlers.
   * @param {OLDrawEvent} event The event to emit
   */
  emitDrawEnd = (event: OLDrawEvent) => {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onDrawEndHandlers, event);
  };

  /**
   * Wires an event handler.
   * @param {DrawDelegate} callback The callback to be executed whenever the event is emitted
   */
  onDrawEnd = (callback: DrawDelegate): void => {
    // Wire the event handler
    EventHelper.onEvent(this.#onDrawEndHandlers, callback);
  };

  /**
   * Unwires an event handler.
   * @param {DrawDelegate} callback The callback to stop being called whenever the event is emitted
   */
  offDrawEnd = (callback: DrawDelegate): void => {
    // Unwire the event handler
    EventHelper.offEvent(this.#onDrawEndHandlers, callback);
  };

  /**
   * Emits an event to all handlers.
   * @param {OLDrawEvent} event The event to emit
   */
  emitDrawAbort = (event: OLDrawEvent) => {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onDrawAbortHandlers, event);
  };

  /**
   * Wires an event handler.
   * @param {DrawDelegate} callback The callback to be executed whenever the event is emitted
   */
  onDrawAbort = (callback: DrawDelegate): void => {
    // Wire the event handler
    EventHelper.onEvent(this.#onDrawAbortHandlers, callback);
  };

  /**
   * Unwires an event handler.
   * @param {DrawDelegate} callback The callback to stop being called whenever the event is emitted
   */
  offDrawAbort = (callback: DrawDelegate): void => {
    // Unwire the event handler
    EventHelper.offEvent(this.#onDrawAbortHandlers, callback);
  };
}

/**
 * Define a delegate for the event handler function signature
 */
type DrawDelegate = EventDelegateBase<Draw, OLDrawEvent>;
