/* eslint-disable @typescript-eslint/no-unused-vars */
import BaseLayer from 'ol/layer/Base';
import Feature from 'ol/Feature';
import { Geometry } from 'ol/geom';

import { AbstractGeoViewLayer } from '../abstract-geoview-layers';
import { Layer, LayerSetPayload, TypeLayerEntryConfig, api } from '@/app';

/** *****************************************************************************************************************************
 * AbstractGeoViewRaster types
 */

// Base type used to keep the layer's hierarchical structure. It is similar to ol/layer/Base~BaseLayer.
export type TypeBaseRasterLayer = BaseLayer; // TypeRasterLayerGroup | TypeRasterLayer;

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
export abstract class AbstractGeoViewRaster extends AbstractGeoViewLayer {
  /** ***************************************************************************************************************************
   * This method adds listeners for openlayers loadend events, indicating that the layer is visible on the map
   *
   * @param {TypeLayerEntryConfig} layerEntryConfig The config of the layer to add the listener to.
   * @param {'tile' | 'image'} layerType The type of raster layer)
   */
  addLoadendListener(layerEntryConfig: TypeLayerEntryConfig, layerType: 'tile' | 'image'): void {
    let loadErrorHandler: () => void;
    const loadEndHandler = () => {
      this.changeLayerStatus('loaded', layerEntryConfig);
      layerEntryConfig.olLayer!.get('source').un(`${layerType}loaderror`, loadErrorHandler);
    };
    loadErrorHandler = () => {
      this.changeLayerStatus('error', layerEntryConfig);
      layerEntryConfig.olLayer!.get('source').un(`${layerType}loadend`, loadEndHandler);
    };

    layerEntryConfig.olLayer!.get('source').once(`${layerType}loadend`, loadEndHandler);
    layerEntryConfig.olLayer!.get('source').once(`${layerType}loaderror`, loadErrorHandler);
  }
}
