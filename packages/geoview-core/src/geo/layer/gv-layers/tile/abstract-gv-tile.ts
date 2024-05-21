import BaseTileLayer from 'ol/layer/BaseTile';
import TileSource from 'ol/source/Tile';
import LayerRenderer from 'ol/renderer/Layer';

import { AbstractGVLayer } from '../abstract-gv-layer';

/**
 * Abstract Geoview Layer managing an OpenLayer tile type layer.
 */
export abstract class AbstractGVTile extends AbstractGVLayer {
  /**
   * Overrides the get of the OpenLayers Layer
   * @returns The OpenLayers Layer
   */
  // Disabling 'any', because that's how it is in OpenLayers
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  override getOLLayer(): BaseTileLayer<TileSource, LayerRenderer<any>> {
    // Call parent and cast
    // Disabling 'any', because that's how it is in OpenLayers
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return super.getOLLayer() as BaseTileLayer<TileSource, LayerRenderer<any>>;
  }
}
