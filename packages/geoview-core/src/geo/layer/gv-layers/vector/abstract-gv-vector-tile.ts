import type VectorTile from 'ol/source/VectorTile';
import type VectorTileLayer from 'ol/layer/VectorTile';
import type { Extent } from 'ol/extent';
import type { Projection as OLProjection } from 'ol/proj';

import { AbstractGVLayer } from '@/geo/layer/gv-layers/abstract-gv-layer';
import { GeoUtilities } from '@/geo/utils/utilities';
import { Projection } from '@/geo/utils/projection';

/**
 * Abstract Geoview Layer managing an OpenLayer vector tile type layer.
 */
export abstract class AbstractGVVectorTile extends AbstractGVLayer {
  // #region OVERRIDES

  /**
   * Overrides the parent method to return a more specific OpenLayers layer type (covariant return).
   * @override
   * @returns {VectorTileLayer<VectorTile>} The strongly-typed OpenLayers type.
   */
  override getOLLayer(): VectorTileLayer<VectorTile> {
    // Call parent and cast
    return super.getOLLayer() as VectorTileLayer<VectorTile>;
  }

  /**
   * Overrides the parent class's method to return a more specific OpenLayers source type (covariant return).
   * @returns {VectorTile} The VectorTile source instance associated with this layer.
   * @override
   */
  override getOLSource(): VectorTile {
    // Get source from OL
    return super.getOLSource() as VectorTile;
  }

  /**
   * Overrides the way to get the bounds for this layer type.
   * @param projection - The projection to get the bounds into.
   * @param stops - The number of stops to use to generate the extent.
   * @returns A promise of layer bounding box.
   */
  override async onGetBounds(projection: OLProjection, stops: number): Promise<Extent | undefined> {
    // Wait for the source to be ready, just in case the caller is early
    await this.waitForSourceReady();

    // Get the source projection
    const sourceProjection = this.getOLSource().getProjection();

    // Get the layer bounds
    let sourceExtent = this.getOLSource().getTileGrid()?.getExtent();

    // If both found
    if (sourceExtent && sourceProjection) {
      // Transform extent to given projection
      sourceExtent = Projection.transformExtentFromProj(sourceExtent, sourceProjection, projection, stops);
      sourceExtent = GeoUtilities.validateExtent(sourceExtent, projection.getCode());
    }

    // Return the calculated layer bounds
    return sourceExtent;
  }

  // #endregion OVERRIDES
}
