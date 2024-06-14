import BaseLayer from 'ol/layer/Base';
import LayerGroup from 'ol/layer/Group';
import { Extent } from 'ol/extent';
import { Projection as OLProjection } from 'ol/proj';

import { AbstractGeoViewLayer } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { Projection } from '@/geo/utils/projection';

/** *****************************************************************************************************************************
 * AbstractGeoViewRaster types
 */

// Base type used to keep the layer's hierarchical structure. It is similar to ol/layer/Base~BaseLayer.
export type TypeRasterLayerGroup = LayerGroup;
export type TypeRasterLayer = BaseLayer;
export type TypeBaseRasterLayer = BaseLayer | TypeRasterLayerGroup | TypeRasterLayer;

// ******************************************************************************************************************************
// ******************************************************************************************************************************
/** *****************************************************************************************************************************
 * The AbstractGeoViewRaster class is a direct descendant of AbstractGeoViewLayer. As its name indicates, it is used to
 * instanciate GeoView raster layers. In addition to the components of the parent class, there is an attribute named
 * olLayers where the raster elements of the class will be kept.
 *
 * The olLayers attribute has a hierarchical structure. Its data type is TypeBaseRasterLayer. Subclasses of this type
 * are TypeRasterLayerGroup and TypeRasterLayer. The TypeRasterLayerGroup is a collection of TypetBaseRasterLayer. It is
 * important to note that a TypetBaseRasterLayer attribute can polymorphically refer to a TypeRasterLayerGroup or a
 * TypeRasterLayer. Here, we must not confuse instantiation and declaration of a polymorphic attribute.
 *
 * All leaves of the structure stored in the olLayers attribute must be of type TypeRasterLayer. This is where the
 * features are placed.
 */
// ******************************************************************************************************************************
// GV Layers Refactoring - Obsolete (in layers)
export abstract class AbstractGeoViewRaster extends AbstractGeoViewLayer {
  /**
   * Gets the source projection
   * @param {string} layerPath - The layer path to get the source for
   * @returns {OLProjection | undefined} The OpenLayer projection
   */
  getSourceProjection(layerPath: string): OLProjection | undefined {
    // Return the projection as read from the source or as ready from the metadata as second chance
    return (
      // Using any temporarily until layers migration is done and this is officially obsolete
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (super.getOLLayer(layerPath) as any).getSource()?.getProjection() || undefined
    );
  }

  /**
   * Gets the metadata extent projection, if any.
   * @returns {OLProjection | undefined} The OpenLayer projection
   */
  getMetadataProjection(): OLProjection | undefined {
    return Projection.getProjection(`EPSG:${this.metadata?.fullExtent?.spatialReference?.wkid}`) || undefined;
  }

  /**
   * Gets the metadata extent, if any.
   * @returns {Extent | undefined} The OpenLayer projection
   */
  getMetadataExtent(): Extent | undefined {
    if (this.metadata?.fullExtent) {
      return [
        this.metadata?.fullExtent.xmin as number,
        this.metadata?.fullExtent.ymin as number,
        this.metadata?.fullExtent.xmax as number,
        this.metadata?.fullExtent.ymax as number,
      ] as Extent;
    }
    return undefined;
  }
}
