import type BaseImageLayer from 'ol/layer/BaseImage';
import type ImageSource from 'ol/source/Image';
import type LayerRenderer from 'ol/renderer/Layer';
import type { Extent } from 'ol/extent';
import type { Projection as OLProjection } from 'ol/proj';

import type { EventDelegateBase } from '@/api/events/event-helper';
import EventHelper from '@/api/events/event-helper';
import { Projection } from '@/geo/utils/projection';
import { AbstractGVLayer } from '@/geo/layer/gv-layers/abstract-gv-layer';
import type { GeoViewError } from '@/core/exceptions/geoview-exceptions';
import { logger } from '@/core/utils/logger';

/**
 * Abstract Geoview Layer managing an OpenLayer raster type layer.
 */
export abstract class AbstractGVRaster extends AbstractGVLayer {
  /** Callback delegates for the image load rescue event */
  #onImageLoadRescueHandlers: ImageLoadRescueDelegate[] = [];

  // #region OVERRIDES

  /**
   * Overrides the parent method to return a more specific OpenLayers layer type (covariant return).
   *
   * @returns The strongly-typed OpenLayers type
   */
  // Disabling 'any', because that's how it is in OpenLayers
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  override getOLLayer(): BaseImageLayer<ImageSource, LayerRenderer<any>> {
    // Call parent and cast
    // Disabling 'any', because that's how it is in OpenLayers
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return super.getOLLayer() as BaseImageLayer<ImageSource, LayerRenderer<any>>;
  }

  /**
   * Overrides when the layer image is in error and couldn't be loaded correctly.
   *
   * @param gvError - The error which has been triggered
   */
  protected override onImageLoadError(gvError: GeoViewError): void {
    // The raster layer image failed to load.. check if there's something we can do..
    const rescuePromise = this.#emitImageLoadRescue({ imageLoadErrorEvent: gvError }).at(0);

    // If no rescue callback is registered, fallback to default behavior.
    if (!rescuePromise) {
      super.onImageLoadError(gvError);
      return;
    }

    // Keep current behavior: only the first registered rescue handler is considered.
    rescuePromise
      .then((handled) => {
        // Not rescued, call parent
        if (!handled) super.onImageLoadError(gvError);
      })
      .catch((error: unknown) => {
        // If the rescue handler threw an error, log it and call parent
        logger.logPromiseFailed('AbstractGVRaster.onImageLoadError - rescue handler threw an error', error);
        // Not rescued, call parent
        super.onImageLoadError(gvError);
      });
  }

  // #endregion OVERRIDES

  // #region METHODS

  /**
   * Gets the metadata extent projection, if any.
   *
   * @returns The OpenLayer projection or undefined when not found
   */
  getMetadataProjection(): OLProjection | undefined {
    // Get metadata
    // GV Can be any object so disable eslint and proceed with caution
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const metadata = this.getLayerConfig().getServiceMetadata() as any;

    // Redirect
    return Projection.getProjectionFromObj(metadata?.fullExtent?.spatialReference);
  }

  /**
   * Gets the metadata extent, if any.
   *
   * @returns The metadata extent or undefined when not found
   */
  getMetadataExtent(): Extent | undefined {
    // Get the layer metadata precisely
    // GV Can be any object so disable eslint and proceed with caution
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const extent = (this.getLayerConfig().getLayerMetadata() as any)?.extent;

    // If found
    if (extent) {
      return [extent.xmin, extent.ymin, extent.xmax, extent.ymax] as Extent;
    }

    // Here, we couldn't find the layer metadata, so we use the layer parent definition metadata
    // Get metadata
    // GV Can be any object so disable eslint and proceed with caution
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const metadata = this.getLayerConfig().getServiceMetadata() as any;
    if (metadata?.fullExtent) {
      return [metadata?.fullExtent.xmin, metadata?.fullExtent.ymin, metadata?.fullExtent.xmax, metadata?.fullExtent.ymax] as Extent;
    }

    // No layer metadata extent could be found
    return undefined;
  }

  // #endregion METHODS

  // #region EVENTS

  /**
   * Emits an event to all handlers when the layer's image failed to load.
   *
   * @param event - The event to emit
   * @returns An array of boolean values returned by each event handler, indicating whether the event was handled
   */
  #emitImageLoadRescue(event: ImageLoadRescueEvent): Promise<boolean>[] {
    // Emit the event for all handlers
    return EventHelper.emitEvent(this, this.#onImageLoadRescueHandlers, event);
  }

  /**
   * Registers an image load callback event handler.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   * @returns A function that can be called to unregister the event handler
   */
  onImageLoadRescue(callback: ImageLoadRescueDelegate): ImageLoadRescueDelegate {
    // Register the event handler
    return EventHelper.onEvent(this.#onImageLoadRescueHandlers, callback);
  }

  /**
   * Unregisters an image load callback event handler.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offImageLoadRescue(callback: ImageLoadRescueDelegate | undefined): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onImageLoadRescueHandlers, callback);
  }

  // #endregion EVENTS
}

/**
 * Define an event for the delegate
 */
export type ImageLoadRescueEvent = { imageLoadErrorEvent: Error };

/**
 * Define a delegate for the event handler function signature
 */
export type ImageLoadRescueDelegate = EventDelegateBase<AbstractGVRaster, ImageLoadRescueEvent, Promise<boolean>>;
