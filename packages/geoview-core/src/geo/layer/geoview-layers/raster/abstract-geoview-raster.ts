import BaseLayer from 'ol/layer/Base';
import { Coordinate } from 'ol/coordinate';
import { Pixel } from 'ol/pixel';

import { AbstractGeoViewLayer } from '../abstract-geoview-layers';
import { TypeBaseLayerEntryConfig } from '../../../map/map-schema-types';
import { TypeFeatureInfoResult, TypeQueryType } from '../../../../api/events/payloads/get-feature-info-payload';

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
 * gvLayers where the raster elements of the class will be kept.
 *
 * The gvLayers attribute has a hierarchical structure. Its data type is TypetBaseRasterLayer. Subclasses of this type
 * are TypeRasterLayerGroup and TypeRasterLayer. The TypeRasterLayerGroup is a collection of TypetBaseRasterLayer. It is
 * important to note that a TypetBaseRasterLayer attribute can polymorphically refer to a TypeRasterLayerGroup or a
 * TypeRasterLayer. Here, we must not confuse instantiation and declaration of a polymorphic attribute.
 *
 * All leaves of the structure stored in the gvLayers attribute must be of type TypeRasterLayer. This is where the
 * features are placed.
 */
// ******************************************************************************************************************************
export abstract class AbstractGeoViewRaster extends AbstractGeoViewLayer {
  /** ***************************************************************************************************************************
   * This method reads the service metadata from the metadataAccessPath.
   *
   * @returns {Promise<void>} A promise that the execution is completed.
   */
  protected abstract getServiceMetadata(): Promise<void>;

  /** ***************************************************************************************************************************
   * This method creates a GeoView layer using the definition provided in the layerEntryConfig parameter.
   *
   * @param {TypeLayerEntryConfig} layerEntryConfig Information needed to create the GeoView layer.
   *
   * @returns {Promise<BaseLayer | null>} The GeoView base layer that has been created.
   */
  protected abstract processOneLayerEntry(layerEntryConfig: TypeBaseLayerEntryConfig): Promise<BaseLayer | null>;

  /** ***************************************************************************************************************************
   * This method is used to process the layer's metadata. It will fill the empty fields of the layer's configuration (renderer,
   * initial settings, fields and aliases).
   *
   * @param {TypeBaseLayerEntryConfig} layerEntryConfig The layer entry configuration to process.
   *
   * @returns {Promise<void>} A promise that the layer configuration has its metadata processed.
   */
  protected abstract processLayerMetadata(layerEntryConfig: TypeBaseLayerEntryConfig): Promise<void>;

  /** ***************************************************************************************************************************
   * Return feature information for all the features around the provided coordinate.
   *
   * @param {Coordinate} location The coordinate that will be used by the query.
   * @param {string} layerId Optional layer identifier. If undefined, this.activeLayer is used.
   *
   * @returns {Promise<TypeFeatureInfoResult>} The feature info table.
   */
  protected abstract getFeatureInfoAtCoordinate(location: Coordinate, layerId?: string): Promise<TypeFeatureInfoResult>;

  /** ***************************************************************************************************************************
   * Return feature information for all the features stored in the layer.
   *
   * @param {Pixel | Coordinate | Coordinate[]} location A pixel, a coordinate or a polygon that will be used by the query.
   * @param {string} layerId Optional layer identifier. If undefined, this.activeLayer is used.
   * @param {TypeQueryType} queryType Optional query type, default value is 'at pixel'.
   *
   * @returns {Promise<TypeFeatureInfoResult>} The feature info table.
   */
  getFeatureInfo(
    location: Pixel | Coordinate | Coordinate[],
    layerId?: string,
    queryType: TypeQueryType = 'at pixel'
  ): Promise<TypeFeatureInfoResult> {
    const queryResult = new Promise<TypeFeatureInfoResult>((resolve) => {
      switch (queryType) {
        case 'at pixel':
          // eslint-disable-next-line no-console
          console.log('Queries using pixel are not implemented.');
          resolve(null);
          break;
        case 'at coordinate':
          this.getFeatureInfoAtCoordinate(location as Coordinate, layerId).then((featureInfoResult) => resolve(featureInfoResult));
          break;
        case 'using a bounding box':
          // eslint-disable-next-line no-console
          console.log('Queries using bounding box are not implemented.');
          resolve(null);
          break;
        case 'using a polygon':
          // eslint-disable-next-line no-console
          console.log('Queries using polygon are not implemented.');
          resolve(null);
          break;
        default:
          // eslint-disable-next-line no-console
          console.log(`Queries using ${queryType} are invalid.`);
          resolve(null);
      }
    });
    return queryResult;
  }
}
