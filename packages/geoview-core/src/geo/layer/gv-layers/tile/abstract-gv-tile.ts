import type BaseTileLayer from 'ol/layer/BaseTile';
import type TileSource from 'ol/source/Tile';
import type LayerRenderer from 'ol/renderer/Layer';

import { LayerTileFailedToLoadError, type GeoViewError } from '@/core/exceptions/geoview-exceptions';
import { AbstractGVLayer } from '@/geo/layer/gv-layers/abstract-gv-layer';

/**
 * Abstract Geoview Layer managing an OpenLayer tile type layer.
 */
export abstract class AbstractGVTile extends AbstractGVLayer {
  // #region OVERRIDES

  /**
   * Overrides the parent method to return a more specific OpenLayers layer type (covariant return).
   *
   * @returns The strongly-typed OpenLayers type.
   */
  // Disabling 'any', because that's how it is in OpenLayers
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  override getOLLayer(): BaseTileLayer<TileSource, LayerRenderer<any>> {
    // Call parent and cast
    // Disabling 'any', because that's how it is in OpenLayers
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return super.getOLLayer() as BaseTileLayer<TileSource, LayerRenderer<any>>;
  }

  /**
   * Overridable method called to get a more specific error code for all errors.
   *
   * @param event - The event which is being triggered.
   * @returns The GeoViewError stored in the GVVectorSource if any or the one from the parent method.
   */
  protected override onErrorDecipherError(event: Event): GeoViewError {
    // Generic error for a tile that failed to load
    return new LayerTileFailedToLoadError(this.getLayerName());
  }

  // #endregion OVERRIDES
}
