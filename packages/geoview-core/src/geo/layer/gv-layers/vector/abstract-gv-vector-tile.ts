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
   * @override
   * @returns {VectorTile} The VectorTile source instance associated with this layer.
   */
  override getOLSource(): VectorTile {
    // Get source from OL
    return super.getOLSource() as VectorTile;
  }

  /**
   * Overrides the way to get the bounds for this layer type.
   * @param {OLProjection} projection - The projection to get the bounds into.
   * @param {number} stops - The number of stops to use to generate the extent.
   * @override
   * @returns {Extent | undefined} The layer bounding box.
   */
  override onGetBounds(projection: OLProjection, stops: number): Extent | undefined {
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
}
