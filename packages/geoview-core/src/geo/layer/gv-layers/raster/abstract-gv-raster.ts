import BaseImageLayer from 'ol/layer/BaseImage';
import ImageSource from 'ol/source/Image';
import LayerRenderer from 'ol/renderer/Layer';
import { Extent } from 'ol/extent';
import { Projection as OLProjection } from 'ol/proj';

import { Projection } from '@/geo/utils/projection';
import { AbstractGVLayer } from '@/geo/layer/gv-layers/abstract-gv-layer';

/**
 * Abstract Geoview Layer managing an OpenLayer raster type layer.
 */
export abstract class AbstractGVRaster extends AbstractGVLayer {
  /**
   * Overrides the parent method to return a more specific OpenLayers layer type (covariant return).
   * @override
   * @returns {BaseImageLayer<ImageSource, LayerRenderer>} The strongly-typed OpenLayers type.
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
   * Gets the metadata extent projection, if any.
   * @returns {OLProjection | undefined} The OpenLayer projection
   */
  getMetadataProjection(): OLProjection | undefined {
    // Redirect
    return Projection.getProjectionFromObj(this.getLayerConfig().getServiceMetadata()?.fullExtent?.spatialReference);
  }

  /**
   * Gets the metadata extent, if any.
   * @returns {Extent | undefined} The OpenLayer projection
   */
  getMetadataExtent(): Extent | undefined {
    // Get the layer metadata precisely
    const extent = this.getLayerConfig().getLayerMetadata()?.extent;

    // If found
    if (extent) {
      return [extent.xmin, extent.ymin, extent.xmax, extent.ymax] as Extent;
    }

    // Here, we couldn't find the layer metadata, so we use the layer parent definition metadata
    const metadata = this.getLayerConfig().getServiceMetadata();
    if (metadata?.fullExtent) {
      return [metadata?.fullExtent.xmin, metadata?.fullExtent.ymin, metadata?.fullExtent.xmax, metadata?.fullExtent.ymax] as Extent;
    }

    // No layer metadata extent could be found
    return undefined;
  }
}
