import BaseLayer from 'ol/layer/Base';
import { AbstractGeoViewLayer, TypeGeoViewEntry } from '../abstract-geoview-layers';

/** ******************************************************************************************************************************
 * AbstractGeoViewVector types
 */

// Base type used to keep the layer's hierarchical structure. It is similar to ol/layer/Base~BaseLayer.
export type TypeBaseVectorLayer = BaseLayer; // TypeVectorLayerGroup | TypeVectorLayer;

/** ******************************************************************************************************************************
 * The AbstractGeoViewVector class is a direct descendant of AbstractGeoViewLayer. As its name indicates, it is used to
 * instanciate GeoView vector layers. In addition to the components of the parent class, there is an attribute named
 * gvVectorLayers where the vector elements of the class will be kept.
 *
 * The gvVectorLayers attribute has a hierarchical structure. Its data type is TypetBaseVectorLayer. Subclasses of this type
 * are TypeVectorLayerGroup and TypeVectorLayer. The TypeVectorLayerGroup is a collection of TypetBaseVectorLayer. It is
 * important to note that a TypetBaseVectorLayer attribute can polymorphically refer to a TypeVectorLayerGroup or a
 * TypeVectorLayer. Here, we must not confuse instantiation and declaration of a polymorphic attribute.
 *
 * All leaves of the structure stored in the gvVectorLayers attribute must be of type TypeVectorLayer. This is where the
 * features are placed and can be considered as a feature group.
 */
export abstract class AbstractGeoViewVector extends AbstractGeoViewLayer {
  /**
   * The vector layer structure to be displayed for this GeoView vector class. Initial value is null indicating that the layers
   * have not been created.
   */
  gvVectorLayers: TypeBaseVectorLayer | null = null;

  /**
   * This method is used to create the layers specified in the entries attribute inherited from its parent.
   * Normally, it is the second method called in the life cycle of a GeoView layer, the first one being the constructor.
   * Its code is the same for all child classes. It must first validate that the gvVectorLayers attribute is null indicating
   * that the method has never been called before. If this is not the case, an error message must be sent. Then, it calls the
   * abstract method getAdditionalServiceDefinition. If the GeoView layer does not have a service definition, this method does
   * nothing. For example, when the child is a WFS service, this method executes the GetCapabilities request and saves the
   * result in an attribute of the class.
   *
   * The next operation is to instantiate each layer identified by the entries attribute. This is done using the abstract method
   * processOneLayerEntry. Then, a renderer is assigned to the newly created layer. The definition of the renderers can
   * come from the configuration of the GeoView layer or from the information saved by the method getAdditionalServiceDefinition,
   * priority being given to the first of the two. This operation is done by the abstract method setRenderer.
   * Note that if field aliases are used, they will be set at the same time as the renderer.
   *
   * Finally, the layer registers to all panels that offer this possibility. For example, if the layer is query able, it could
   * subscribe to the details-panel and every time the user clicks on the map, the panel will ask the layer to return the
   * descriptive information of all the features in a tolerance radius. This information will be used to populate the
   * details-panel.
   */
  createGeoViewVectorLayers() {
    if (this.gvVectorLayers === null) {
      this.getAdditionalServiceDefinition();
      if (this.layerEntries.length === 1) {
        this.gvVectorLayers = this.processOneLayerEntry(this.layerEntries[0]);
        this.setRenderer(this.layerEntries[0], this.gvVectorLayers);
      } else {
        this.layerEntries.forEach((layerEntry: TypeGeoViewEntry) => {
          const vectorLayer: TypeBaseVectorLayer = this.processOneLayerEntry(layerEntry);
          this.setRenderer(vectorLayer);
        });
      }
    }
  }

  /**
   * This method reads from the accessPath additional information to complete the GeoView layer configuration.
   * If the GeoView layer does not have a service definition, this method does nothing.
   */
  abstract getAdditionalServiceDefinition(): void;

  /**
   * This method creates a GeoView layer using the definition provided in the layerEntry parameter.
   *
   * @param {TypeGeoViewEntry} layerEntry Information needed to create the GeoView layer.
   *
   * @returns The GeoView vector layer that has been created.
   */
  abstract processOneLayerEntry(layerEntry: TypeGeoViewEntry): TypeBaseVectorLayer;

  /**
   * This method associate a renderer to the GeoView layer.
   *
   * @param {TypeGeoViewEntry} layerEntry Information needed to create the renderer.
   * @param {TypeGeoViewEntry} layerEntry Information needed to create the renderer.
   */
  abstract setRenderer(layerEntry: TypeGeoViewEntry, aVectorLayer: TypeBaseVectorLayer): void;
}
