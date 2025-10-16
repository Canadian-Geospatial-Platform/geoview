import type BaseTileLayer from 'ol/layer/BaseTile';
import type TileSource from 'ol/source/Tile';
import type LayerRenderer from 'ol/renderer/Layer';

import { AbstractGVLayer } from '@/geo/layer/gv-layers/abstract-gv-layer';

/**
 * Abstract Geoview Layer managing an OpenLayer tile type layer.
 */
export abstract class AbstractGVTile extends AbstractGVLayer {
  /**
   * Overrides the parent method to return a more specific OpenLayers layer type (covariant return).
   * @override
   * @returns {BaseTileLayer<TileSource, LayerRenderer<any>>} The strongly-typed OpenLayers type.
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
