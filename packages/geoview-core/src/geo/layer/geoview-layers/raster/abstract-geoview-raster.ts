import BaseLayer from 'ol/layer/Base';
// ! DELETE ME: import LayerGroup, { Options as LayerGroupOptions } from 'ol/layer/Group';
import LayerGroup from 'ol/layer/Group';
// ! DELETE ME: import Collection from 'ol/Collection';
import { AbstractGeoViewLayer } from '../abstract-geoview-layers';
import { TypeListOfLayerEntryConfig, TypeLayerEntryConfig } from '../../../map/map-schema-types';
import { api } from '../../../../app';
import { snackbarMessagePayload } from '../../../../api/events/payloads/snackbar-message-payload';
import { EVENT_NAMES } from '../../../../api/events/event-types';

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
  /**
   * This method is used to create the layers specified in the listOfLayerEntryConfig attribute inherited from its parent.
   * Normally, it is the second method called in the life cycle of a GeoView layer, the first one being the constructor.
   * Its code is the same for all child classes. It must first validate that the gvLayers attribute is null indicating
   * that the method has never been called before. If this is not the case, an error message must be sent. Then, it calls the
   * abstract method getAdditionalServiceDefinition. If the GeoView layer does not have a service definition, this method does
   * nothing. For example, when the child is a WMS service, this method executes the GetCapabilities request and saves the
   * result in an attribute of the class.
   *
   * The next operation is to instantiate each layer identified by the listOfLayerEntryConfig attribute. This is done using the
   * abstract method processOneLayerEntry. Then, a renderer is assigned to the newly created layer. The definition of the
   * renderers can come from the configuration of the GeoView layer or from the information saved by the method
   * getAdditionalServiceDefinition, priority being given to the first of the two. This operation is done by the abstract
   * method processLayerMetadata. Note that if field aliases are used, they will be set at the same time as the renderer.
   *
   * Finally, the layer registers to all panels that offer this possibility. For example, if the layer is query able, it could
   * subscribe to the details-panel and every time the user clicks on the map, the panel will ask the layer to return the
   * descriptive information of all the features in a tolerance radius. This information will be used to populate the
   * details-panel.
   *
   * @returns {Promise<void>} The promise that the code was executed.
   */
  createGeoViewRasterLayers(): Promise<void> {
    const promisedExecution = new Promise<void>((resolve) => {
      if (this.gvLayers === null && this.listOfLayerEntryConfig.length !== 0) {
        this.getAdditionalServiceDefinition().then(() => {
          this.processListOfLayerEntryConfig(this.listOfLayerEntryConfig).then((layersCreated) => {
            this.gvLayers = layersCreated;
            resolve();
          });
        });
      } else {
        api.event.emit(
          snackbarMessagePayload(EVENT_NAMES.SNACKBAR.EVENT_SNACKBAR_OPEN, this.mapId, {
            type: 'key',
            value: 'validation.layer.createtwice',
            params: [this.mapId],
          })
        );
        // eslint-disable-next-line no-console
        console.log(`Can not execute twice the createGeoViewRasterLayers method for the map ${this.mapId}`);
        resolve();
      }
    });
    return promisedExecution;
  }

  /** ***************************************************************************************************************************
   * Process recursively the list of layer Entries to create the layers and the layer groups.
   *
   * @param {TypeListOfLayerEntryConfig} listOfLayerEntryConfig The list of layer entries to process.
   *
   * @returns {Promise<BaseLayer | null>} The promise that the layers were created.
   */
  private processListOfLayerEntryConfig(listOfLayerEntryConfig: TypeListOfLayerEntryConfig): Promise<BaseLayer | null> {
    const promisedListOfLayerEntryProcessed = new Promise<BaseLayer | null>((resolve) => {
      if (listOfLayerEntryConfig.length === 1) {
        if (listOfLayerEntryConfig[0].entryType === 'group') {
          this.processListOfLayerEntryConfig(listOfLayerEntryConfig[0].listOfLayerEntryConfig).then((groupCreated) => {
            resolve(groupCreated);
          });
        } else {
          this.processOneLayerEntry(listOfLayerEntryConfig[0]).then((rasterLayer) => {
            if (rasterLayer) {
              this.processLayerMetadata(rasterLayer);
              this.registerToPanels(rasterLayer);
            } else {
              this.layerLoadError.push(listOfLayerEntryConfig[0].layerId);
            }
            resolve(rasterLayer);
          });
        }
      } else {
        const promiseOfLayerCreated: Promise<BaseLayer | null>[] = [];
        listOfLayerEntryConfig.forEach((layerEntryConfig: TypeLayerEntryConfig) => {
          if (layerEntryConfig.entryType === 'group') {
            promiseOfLayerCreated.push(this.processListOfLayerEntryConfig(layerEntryConfig.listOfLayerEntryConfig));
          } else promiseOfLayerCreated.push(this.processOneLayerEntry(layerEntryConfig));
        });
        Promise.all(promiseOfLayerCreated)
          .then((listOfLayerCreated) => {
            if (listOfLayerCreated && listOfLayerCreated.length !== 0) {
              // We use the first element of the array to retrieve the parent node.
              const { parentLayerConfig } = listOfLayerCreated[0]!.get('layerEntryConfig');
              const layerGroup = this.createLayerGroup(parentLayerConfig);
              listOfLayerCreated.forEach((rasterLayer) => {
                if (rasterLayer) {
                  this.processLayerMetadata(rasterLayer);
                  this.registerToPanels(rasterLayer);
                  (layerGroup as LayerGroup).getLayers().push(rasterLayer);
                } else {
                  this.layerLoadError.push(listOfLayerEntryConfig[0].layerId);
                }
              });
              resolve(layerGroup);
            } else resolve(null);
          })
          .catch((reason) => {
            // eslint-disable-next-line no-console
            console.log(reason);
            resolve(null);
          });
      }
    });
    return promisedListOfLayerEntryProcessed;
  }

  /**
   * This method reads from the metadataAccessPath additional information to complete the GeoView layer configuration.
   * If the GeoView layer does not have a service definition, this method does nothing.
   */
  abstract getAdditionalServiceDefinition(): Promise<void>;

  /**
   * This method creates a GeoView layer using the definition provided in the layerEntryConfig parameter.
   *
   * @param {TypeLayerEntryConfig} layerEntryConfig Information needed to create the GeoView layer.
   *
   * @returns {TypeBaseRasterLayer} The GeoView raster layer that has been created.
   */
  abstract processOneLayerEntry(layerEntryConfig: TypeLayerEntryConfig): Promise<TypeBaseRasterLayer | null>;

  /**
   * This method associate a renderer to the GeoView layer.
   *
   * @param {TypeBaseRasterLayer} rasterLayer The GeoView layer associated to the renderer.
   */
  abstract processLayerMetadata(rasterLayer: TypeBaseRasterLayer): void;

  /**
   * This method register the GeoView layer to panels that offer this possibility.
   *
   * @param {TypeBaseRasterLayer} rasterLayer The GeoView layer who wants to register.
   */
  abstract registerToPanels(rasterLayer: TypeBaseRasterLayer): void;
}
