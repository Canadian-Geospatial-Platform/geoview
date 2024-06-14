import BaseImageLayer from 'ol/layer/BaseImage';
import ImageSource from 'ol/source/Image';
import LayerRenderer from 'ol/renderer/Layer';
import { Extent } from 'ol/extent';
import { Projection as OLProjection } from 'ol/proj';

import { Projection } from '@/geo/utils/projection';
import { AbstractGVLayer } from '../abstract-gv-layer';

/**
 * Abstract Geoview Layer managing an OpenLayer raster type layer.
 */
export abstract class AbstractGVRaster extends AbstractGVLayer {
  /**
   * Overrides the get of the OpenLayers Layer
   * @returns The OpenLayers Layer
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
    return Projection.getProjection(`EPSG:${this.getLayerConfig().getMetadata()?.fullExtent?.spatialReference?.wkid}`) || undefined;
  }

  /**
   * Gets the metadata extent, if any.
   * @returns {Extent | undefined} The OpenLayer projection
   */
  getMetadataExtent(): Extent | undefined {
    // TODO: Layers refactoring. Johann: This should be converted to geoview schema in config
    const metadata = this.getLayerConfig().getMetadata();
    if (metadata?.fullExtent) {
      return [
        metadata?.fullExtent.xmin as number,
        metadata?.fullExtent.ymin as number,
        metadata?.fullExtent.xmax as number,
        metadata?.fullExtent.ymax as number,
      ] as Extent;
    }
    return undefined;
  }
}
