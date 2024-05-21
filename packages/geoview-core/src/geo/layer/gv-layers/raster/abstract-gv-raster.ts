import BaseImageLayer from 'ol/layer/BaseImage';
import ImageSource from 'ol/source/Image';
import LayerRenderer from 'ol/renderer/Layer';

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
}
