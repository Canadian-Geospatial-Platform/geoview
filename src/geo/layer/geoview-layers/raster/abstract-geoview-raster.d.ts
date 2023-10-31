import BaseLayer from 'ol/layer/Base';
import LayerGroup from 'ol/layer/Group';
import { AbstractGeoViewLayer } from '../abstract-geoview-layers';
import { TypeLayerEntryConfig } from '@/app';
/** *****************************************************************************************************************************
 * AbstractGeoViewRaster types
 */
export type TypeRasterLayerGroup = LayerGroup;
export type TypeRasterLayer = BaseLayer;
export type TypeBaseRasterLayer = BaseLayer | TypeRasterLayerGroup | TypeRasterLayer;
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
export declare abstract class AbstractGeoViewRaster extends AbstractGeoViewLayer {
    /** ***************************************************************************************************************************
     * This method adds listeners for openlayers loadend events, indicating that the layer is visible on the map
     *
     * @param {TypeLayerEntryConfig} layerEntryConfig The config of the layer to add the listener to.
     * @param {'tile' | 'image'} layerType The type of raster layer)
     */
    addLoadendListener(layerEntryConfig: TypeLayerEntryConfig, layerType: 'tile' | 'image'): void;
}
