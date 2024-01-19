/* eslint-disable @typescript-eslint/no-unused-vars */
import BaseLayer from 'ol/layer/Base';
import LayerGroup from 'ol/layer/Group';

import { AbstractGeoViewLayer } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { TypeLayerEntryConfig } from '@/geo/map/map-schema-types';
import { api } from '@/app';
import { logger } from '@/core/utils/logger';

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
export abstract class AbstractGeoViewRaster extends AbstractGeoViewLayer {
  /** ***************************************************************************************************************************
   * This method adds listeners for openlayers loadend events, indicating that the layer is visible on the map
   *
   * @param {string} layerPath The layer path to the layer's configuration to add the listener to.
   * @param {'tile' | 'image'} layerType The type of raster layer)
   */
  addLoadendListener(layerPath: string, layerType: 'tile' | 'image'): void {
    const layerConfig = this.getLayerConfig(layerPath) as TypeLayerEntryConfig;
    let loadErrorHandler: () => void;
    const loadEndHandler = () => {
      this.setLayerStatus('loaded', layerPath);
      layerConfig.olLayer!.get('source').un(`${layerType}loaderror`, loadErrorHandler);
    };
    loadErrorHandler = () => {
      this.setLayerStatus('error', layerPath);
      layerConfig.olLayer!.get('source').un(`${layerType}loadend`, loadEndHandler);
    };

    // TODO: BUG: Careful, sometimes 'source' is undefined (esri-dynamic layer case - notably in use-cases template);
    // TO.DOCONT: see NON-FIXING :( 'addLoadendListener_TEMPORARY' below for an alternate function
    layerConfig.olLayer!.get('source').once(`${layerType}loadend`, loadEndHandler);
    layerConfig.olLayer!.get('source').once(`${layerType}loaderror`, loadErrorHandler);
  }

  // TODO: Refactor - Either use or delete this temporary function replacing addLoadendListener
  // TO.DOCONT: to better handle the error when no source is defined or when
  // TO.DOCONT: something crashes, so that 'error' layer status is at least set.
  // TO.DOCONT: That said, the issue leading to this alternative method still isn't fixed,
  // TO.DOCONT: so I'm just leaving the method here for further debugging if necessary
  addLoadendListener_TEMPORARY(layerPath: string, layerType: 'tile' | 'image'): void {
    try {
      // Get the layer config and DO NOT use async here, because THIS is the code
      // that actually sets the 'loaded' status that getLayerConfigAsync is waiting for!
      const layerConfig = this.getLayerConfig(layerPath);
      let loadErrorHandler: () => void;
      const loadEndHandler = () => {
        this.setLayerStatus('loaded', layerPath);
        layerConfig!.olLayer!.get('source').un(`${layerType}loaderror`, loadErrorHandler);
      };
      loadErrorHandler = () => {
        this.setLayerStatus('error', layerPath);
        layerConfig!.olLayer!.get('source').un(`${layerType}loadend`, loadEndHandler);
      };

      // If found
      if (layerConfig) {
        // Wire the handlers for loadend and loaderror
        layerConfig.olLayer!.get('source').once(`${layerType}loadend`, loadEndHandler);
        layerConfig.olLayer!.get('source').once(`${layerType}loaderror`, loadErrorHandler);
      } else throw new Error(`Couldn't find layer config for layer path ${layerPath}`);
    } catch (error) {
      // Error wire handlers, so better set error right away
      this.setLayerStatus('error', layerPath);

      // Log
      logger.logError('addLoadendListener\n', error);
    }
  }
}
