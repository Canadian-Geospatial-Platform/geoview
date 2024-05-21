import VectorTile from 'ol/source/VectorTile';
import BaseVectorLayer from 'ol/layer/BaseVector';
import Feature from 'ol/Feature';

import { AbstractGVLayer } from '../abstract-gv-layer';

/**
 * Abstract Geoview Layer managing an OpenLayer vector tile type layer.
 */
export abstract class AbstractGVVectorTile extends AbstractGVLayer {
  /**
   * Overrides the get of the OpenLayers Layer
   * @returns {BaseVectorLayer} The OpenLayers Layer
   */
  // Disabling 'any', because too many renderer types in OpenLayers
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  override getOLLayer(): BaseVectorLayer<VectorTile<Feature>, any> {
    // Call parent and cast
    // Disabling 'any', because too many renderer types in OpenLayers
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return super.getOLLayer() as BaseVectorLayer<VectorTile<Feature>, any>;
  }
}
