import type { Type as OLGeomType } from 'ol/geom/Geometry';
import { Draw as OLDraw } from 'ol/interaction';
import type { GeometryFunction, DrawEvent as OLDrawEvent, Options as OLDrawOptions } from 'ol/interaction/Draw';
import type { FlatStyle } from 'ol/style/flat';

import type { EventDelegateBase } from '@/api/events/event-helper';
import EventHelper from '@/api/events/event-helper';
import type { TypeFeatureStyle } from '@/geo/layer/geometry/geometry-types';
import { GeoUtilities } from '@/geo/utils/utilities';

import type { InteractionOptions } from './interaction';
import { Interaction } from './interaction';

/**
 * Supported options for drawing interactions
 */
export type DrawOptions = InteractionOptions & {
  geometryGroupKey: string;
  freehand?: boolean;
  type?: string; // TODO: Refactor - Utiliser un type dans geometry-types comme TypeVectorKeys, en changeant ceux-ci pour s'assoir sur les types OL: https://openlayers.org/en/latest/apidoc/module-ol_geom_Geometry.html#~Type
  style?: TypeFeatureStyle;
  geometryFunction?: GeometryFunction;
};

/**
 * Class used for drawing features on a map.
 */
export class Draw extends Interaction {
  /** The embedded OpenLayers Draw component. */
  #olDraw: OLDraw;

  /** Callback handlers for the drawstart event. */
  #onDrawStartHandlers: DrawDelegate[] = [];

  /** Callback handlers for the drawend event. */
  #onDrawEndHandlers: DrawDelegate[] = [];

  /** Callback handlers for the drawabort event. */
  #onDrawAbortHandlers: DrawDelegate[] = [];

  /** Reference to the keyboard event handler */
  #keyboardHandler: (event: KeyboardEvent) => void;

  /**
   * Initializes a Draw component.
   *
   * @param options - Object to configure the initialization of the Draw interaction
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
      style: GeoUtilities.convertTypeFeatureStyleToOpenLayersStyle(options.style) as FlatStyle,
      freehand: options.freehand,
      stopClick: true,
      geometryFunction: options.geometryFunction,
    };

    // Instantiate the OpenLayers Draw interaction
    this.#olDraw = new OLDraw(olOptions);

    // Register handlers for draw events
    this.#olDraw.on('drawstart', this.#emitDrawStart.bind(this));
    this.#olDraw.on('drawend', this.#emitDrawEnd.bind(this));
    this.#olDraw.on('drawabort', this.#emitDrawAbort.bind(this));

    // Create and store the keyboard handler
    this.#keyboardHandler = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && this.#olDraw.getActive()) {
        this.#olDraw.abortDrawing();
      }
    };

    // Listener for aborting a drawing
    document.addEventListener('keydown', this.#keyboardHandler);
  }

  /**
   * Starts the interaction on the map.
   */
  override startInteraction(): void {
    // Redirect to super method to start interaction
    super.startInteraction(this.#olDraw);
  }

  /**
   * Stops the interaction on the map.
   */
  override stopInteraction(): void {
    // Remove the keyboard event listener
    document.removeEventListener('keydown', this.#keyboardHandler);

    // Redirect to super method to stop interaction
    super.stopInteraction(this.#olDraw);
  }

  /**
   * Emits the drawstart event to all registered handlers.
   *
   * @param event - The event to emit
   */
  #emitDrawStart(event: OLDrawEvent): void {
    // Emit the drawstart event
    EventHelper.emitEvent(this, this.#onDrawStartHandlers, event);
  }

  /**
   * Registers a callback handler for the drawstart event.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   */
  onDrawStart(callback: DrawDelegate): void {
    // Register the drawstart event callback
    EventHelper.onEvent(this.#onDrawStartHandlers, callback);
  }

  /**
   * Unregisters a callback handler for the drawstart event.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offDrawStart(callback: DrawDelegate): void {
    // Unregister the drawstart event callback
    EventHelper.offEvent(this.#onDrawStartHandlers, callback);
  }

  /**
   * Emits the drawend event to all registered handlers.
   *
   * @param event - The event to emit
   */
  #emitDrawEnd(event: OLDrawEvent): void {
    // Emit the drawend event
    EventHelper.emitEvent(this, this.#onDrawEndHandlers, event);
  }

  /**
   * Registers a callback handler for the drawend event.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   */
  onDrawEnd(callback: DrawDelegate): void {
    // Register the drawend event callback
    EventHelper.onEvent(this.#onDrawEndHandlers, callback);
  }

  /**
   * Unregisters a callback handler for the drawend event.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offDrawEnd(callback: DrawDelegate): void {
    // Unregister the drawend event callback
    EventHelper.offEvent(this.#onDrawEndHandlers, callback);
  }

  /**
   * Emits the drawabort event to all registered handlers.
   *
   * @param event - The event to emit
   */
  #emitDrawAbort(event: OLDrawEvent): void {
    // Emit the drawabort event
    EventHelper.emitEvent(this, this.#onDrawAbortHandlers, event);
  }

  /**
   * Registers a callback handler for the drawabort event.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   */
  onDrawAbort(callback: DrawDelegate): void {
    // Register the drawabort event callback
    EventHelper.onEvent(this.#onDrawAbortHandlers, callback);
  }

  /**
   * Unregisters a callback handler for the drawabort event.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offDrawAbort(callback: DrawDelegate): void {
    // Unregister the drawabort event callback
    EventHelper.offEvent(this.#onDrawAbortHandlers, callback);
  }
}

/**
 * Delegate for the draw event handler function signature.
 */
type DrawDelegate = EventDelegateBase<Draw, OLDrawEvent, void>;
