import VectorTile from 'ol/source/VectorTile';
import VectorTileLayer from 'ol/layer/VectorTile';
import { Extent } from 'ol/extent';

import { AbstractGVLayer } from '../abstract-gv-layer';
import { validateExtent } from '@/geo/utils/utilities';

/**
 * Abstract Geoview Layer managing an OpenLayer vector tile type layer.
 */
export abstract class AbstractGVVectorTile extends AbstractGVLayer {
  /**
   * Overrides the get of the OpenLayers Layer
   * @returns {VectorTileLayer<Feature>} The OpenLayers Layer
   */
  // Disabling 'any', because too many renderer types in OpenLayers
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  override getOLLayer(): VectorTileLayer<VectorTile> {
    // Call parent and cast
    // Disabling 'any', because too many renderer types in OpenLayers
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return super.getOLLayer() as VectorTileLayer<VectorTile>;
  }

  /**
   * Overrides the get of the OpenLayers Layer
   * @returns {VectorTile} The OpenLayers Layer
   */
  override getOLSource(): VectorTile {
    // Get source from OL
    return super.getOLSource() as VectorTile;
  }

  /**
   * Gets the bounds of the layer and returns updated bounds.
   * @returns {Extent | undefined} The layer bounding box.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  override getBounds(): Extent | undefined {
    // Get the source projection
    const sourceProjection = this.getOLSource().getProjection() || undefined;

    // Get the layer bounds
    let sourceExtent = this.getOLSource().getTileGrid()?.getExtent();
    if (sourceExtent) {
      // Make sure we're in the map projection
      sourceExtent = this.getMapViewer().convertExtentFromProjToMapProj(sourceExtent, sourceProjection);
      sourceExtent = validateExtent(sourceExtent, this.getMapViewer().getProjection().getCode());
    }

    // Return the calculated layer bounds
    return sourceExtent;
  }
}
