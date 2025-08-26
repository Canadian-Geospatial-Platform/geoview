import BaseImageLayer from 'ol/layer/BaseImage';
import ImageSource from 'ol/source/Image';
import LayerRenderer from 'ol/renderer/Layer';
import { Extent } from 'ol/extent';
import { Projection as OLProjection } from 'ol/proj';
import { AbstractGVLayer } from '@/geo/layer/gv-layers/abstract-gv-layer';
/**
 * Abstract Geoview Layer managing an OpenLayer raster type layer.
 */
export declare abstract class AbstractGVRaster extends AbstractGVLayer {
    /**
     * Overrides the parent method to return a more specific OpenLayers layer type (covariant return).
     * @override
     * @returns {BaseImageLayer<ImageSource, LayerRenderer>} The strongly-typed OpenLayers type.
     */
    getOLLayer(): BaseImageLayer<ImageSource, LayerRenderer<any>>;
    /**
     * Gets the metadata extent projection, if any.
     * @returns {OLProjection | undefined} The OpenLayer projection
     */
    getMetadataProjection(): OLProjection | undefined;
    /**
     * Gets the metadata extent, if any.
     * @returns {Extent | undefined} The OpenLayer projection
     */
    getMetadataExtent(): Extent | undefined;
}
//# sourceMappingURL=abstract-gv-raster.d.ts.map