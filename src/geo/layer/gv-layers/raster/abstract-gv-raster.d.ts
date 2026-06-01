import type BaseImageLayer from 'ol/layer/BaseImage';
import type ImageSource from 'ol/source/Image';
import type LayerRenderer from 'ol/renderer/Layer';
import type { Extent } from 'ol/extent';
import type { Projection as OLProjection } from 'ol/proj';
import type { EventDelegateBase } from '@/api/events/event-helper';
import { AbstractGVLayer } from '@/geo/layer/gv-layers/abstract-gv-layer';
import type { GeoViewError } from '@/core/exceptions/geoview-exceptions';
/**
 * Abstract Geoview Layer managing an OpenLayer raster type layer.
 */
export declare abstract class AbstractGVRaster extends AbstractGVLayer {
    #private;
    /**
     * Overrides the parent method to return a more specific OpenLayers layer type (covariant return).
     *
     * @returns The strongly-typed OpenLayers type
     */
    getOLLayer(): BaseImageLayer<ImageSource, LayerRenderer<any>>;
    /**
     * Overrides when the layer image is in error and couldn't be loaded correctly.
     *
     * @param gvError - The error which has been triggered
     */
    protected onImageLoadError(gvError: GeoViewError): void;
    /**
     * Gets the metadata extent projection, if any.
     *
     * @returns The OpenLayer projection or undefined when not found
     */
    getMetadataProjection(): OLProjection | undefined;
    /**
     * Gets the metadata extent, if any.
     *
     * @returns The metadata extent or undefined when not found
     */
    getMetadataExtent(): Extent | undefined;
    /**
     * Registers an image load callback event handler.
     *
     * @param callback - The callback to be executed whenever the event is emitted
     * @returns A function that can be called to unregister the event handler
     */
    onImageLoadRescue(callback: ImageLoadRescueDelegate): ImageLoadRescueDelegate;
    /**
     * Unregisters an image load callback event handler.
     *
     * @param callback - The callback to stop being called whenever the event is emitted
     */
    offImageLoadRescue(callback: ImageLoadRescueDelegate | undefined): void;
}
/**
 * Define an event for the delegate
 */
export type ImageLoadRescueEvent = {
    imageLoadErrorEvent: Error;
};
/**
 * Define a delegate for the event handler function signature
 */
export type ImageLoadRescueDelegate = EventDelegateBase<AbstractGVRaster, ImageLoadRescueEvent, Promise<boolean>>;
//# sourceMappingURL=abstract-gv-raster.d.ts.map