import type BaseImageLayer from 'ol/layer/BaseImage';
import type ImageSource from 'ol/source/Image';
import type LayerRenderer from 'ol/renderer/Layer';
import type { Extent } from 'ol/extent';
import type { Projection as OLProjection } from 'ol/proj';
import { AbstractGVLayer } from '@/geo/layer/gv-layers/abstract-gv-layer';
/**
 * Abstract Geoview Layer managing an OpenLayer raster type layer.
 */
export declare abstract class AbstractGVRaster extends AbstractGVLayer {
    /**
     * Overrides the parent method to return a more specific OpenLayers layer type (covariant return).
     *
     * @returns The strongly-typed OpenLayers type.
     */
    getOLLayer(): BaseImageLayer<ImageSource, LayerRenderer<any>>;
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
}
//# sourceMappingURL=abstract-gv-raster.d.ts.map